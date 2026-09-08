import { competitionRulesFor, rankCompetitionTable } from './competition-rules-v1.js';

export const SEASON_HISTORY_SCHEMA_VERSION = 1;

const clone = value => JSON.parse(JSON.stringify(value));

export function ensureSeasonHistoryState(career) {
  if (!career || typeof career !== 'object') return career;
  if (!Array.isArray(career.seasonHistory)) career.seasonHistory = [];
  if (!Object.prototype.hasOwnProperty.call(career, 'seasonOutcome')) career.seasonOutcome = null;
  if (!Object.prototype.hasOwnProperty.call(career, 'seasonResolution')) career.seasonResolution = null;
  if (!Object.prototype.hasOwnProperty.call(career, 'nextSeasonContext')) career.nextSeasonContext = null;
  if (!Object.prototype.hasOwnProperty.call(career, 'defendingChampionClubId')) career.defendingChampionClubId = null;
  return career;
}

export function isSeasonComplete(career) {
  if (!career || career.status !== 'complete') return false;
  const fixtures = (career.fixtures || []).flat();
  if (!fixtures.length) return false;
  return fixtures.every(fixture => fixture?.played === true);
}

function recordKey(career) {
  return `${career.competitionId || career.leagueId || career.competitionName || 'competition'}:${career.season || 'season'}`;
}

export function finaliseSeason(career, { completedAt = new Date().toISOString() } = {}) {
  ensureSeasonHistoryState(career);
  if (!isSeasonComplete(career)) return { status: 'not-complete', outcome: null };

  const rules = competitionRulesFor(career);
  if (!rules) return { status: 'unsupported-competition', outcome: null };

  const key = recordKey(career);
  const existing = career.seasonHistory.find(record => record.key === key);
  if (existing) {
    career.seasonOutcome = existing;
    career.nextSeasonContext ||= {
      sourceSeason: existing.season,
      sourceCompetitionId: existing.competitionId,
      defendingChampionClubId: existing.championClubId,
      relegatedClubIds: [...(existing.relegatedClubIds || [])],
      europeanQualificationStatus: existing.europeanQualification?.status || 'pending'
    };
    return { status: 'already-finalised', outcome: existing };
  }

  const ranking = rankCompetitionTable(career);
  if (ranking.playoffRequired) {
    career.seasonResolution = {
      schemaVersion: SEASON_HISTORY_SCHEMA_VERSION,
      status: 'playoff-required',
      season: career.season,
      competitionId: rules.id,
      unresolvedGroups: clone(ranking.unresolvedGroups.filter(group => group.consequences.length))
    };
    career.seasonOutcome = null;
    career.nextSeasonContext = null;
    return { status: 'playoff-required', outcome: null, resolution: career.seasonResolution };
  }

  const relegationCount = rules.relegationPlaces || 0;
  const relegatedClubIds = relegationCount ? ranking.rows.slice(-relegationCount).map(row => row.clubId) : [];
  const outcome = {
    schemaVersion: SEASON_HISTORY_SCHEMA_VERSION,
    key,
    season: career.season,
    competitionId: rules.id,
    competitionName: career.competitionName || rules.name,
    completedAt,
    championClubId: ranking.rows[0]?.clubId || null,
    runnerUpClubId: ranking.rows[1]?.clubId || null,
    relegatedClubIds,
    finalTable: clone(ranking.rows),
    rankingRules: [...rules.ranking],
    unresolvedNonConsequentialTies: clone(ranking.unresolvedGroups.filter(group => !group.consequences.length)),
    europeanQualification: {
      status: 'pending',
      allocations: null,
      reason: 'Domestic cup and UEFA qualification context is required before European places can be finalised.'
    }
  };

  career.seasonHistory.push(outcome);
  career.seasonOutcome = outcome;
  career.seasonResolution = {
    schemaVersion: SEASON_HISTORY_SCHEMA_VERSION,
    status: 'finalised',
    season: career.season,
    competitionId: rules.id
  };
  career.nextSeasonContext = {
    sourceSeason: career.season,
    sourceCompetitionId: rules.id,
    defendingChampionClubId: outcome.championClubId,
    relegatedClubIds: [...relegatedClubIds],
    europeanQualificationStatus: outcome.europeanQualification.status
  };
  return { status: 'finalised', outcome };
}
