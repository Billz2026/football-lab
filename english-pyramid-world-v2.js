import {
  CHAMPIONSHIP_2026_27_CLUBS,
  CHAMPIONSHIP_ID,
  simulateChampionshipSeason
} from './championship-world-v1.js';
import {
  LEAGUE_ONE_2026_27_CLUBS,
  LEAGUE_ONE_ID,
  simulateLeagueOneSeason
} from './league-one-world-v1.js';

export const ENGLISH_PYRAMID_WORLD_VERSION = 2;

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function nextPyramidSeasonLabel(label) {
  const match = /^(\d{4})\/(\d{2})$/.exec(String(label || ''));
  if (!match) return null;
  const start = Number(match[1]) + 1;
  return `${start}/${String((start + 1) % 100).padStart(2, '0')}`;
}

function ensureState(career) {
  career.worldHistory ||= [];
  career.lowerLeagueHistory ||= [];
  career.worldMemberships ||= [];
  career.worldBoundaries ||= [];
  return career;
}

function compactClub(club, overrides = {}) {
  return {
    id: club.id,
    slug: club.slug || String(club.id || '').replace(/^eng-(?:championship|league-one)-/, ''),
    name: club.name || club.shortName || club.id,
    strength: Number(club.strength ?? club.backgroundStrength ?? overrides.strength ?? 70),
    ...overrides
  };
}

function membershipKey(competitionId, season) {
  return `${competitionId}:${season}`;
}

function findMembershipRecord(career, competitionId, season) {
  return (career?.worldMemberships || []).find(record => record?.key === membershipKey(competitionId, season)) || null;
}

function upsertMembership(career, record) {
  ensureState(career);
  const index = career.worldMemberships.findIndex(item => item?.key === record.key);
  if (index >= 0) career.worldMemberships[index] = clone(record);
  else career.worldMemberships.push(clone(record));
  return record;
}

export function getChampionshipMembership(career, season = career?.season || '2026/27') {
  if (season === '2026/27') return CHAMPIONSHIP_2026_27_CLUBS.map(club => compactClub(club));
  const record = findMembershipRecord(career, CHAMPIONSHIP_ID, season);
  if (!record || record.status !== 'complete' || record.clubs?.length !== 24) return null;
  return record.clubs.map(club => compactClub(club));
}

export function getLeagueOneMembership(career, season = career?.season || '2026/27') {
  if (season === '2026/27') return LEAGUE_ONE_2026_27_CLUBS.map(club => compactClub(club));
  const record = findMembershipRecord(career, LEAGUE_ONE_ID, season);
  if (!record || record.status !== 'complete' || record.clubs?.length !== 24) return null;
  return record.clubs.map(club => compactClub(club));
}

function outcomeIn(history, competitionId, season) {
  return (history || []).find(record => record?.competitionId === competitionId && record?.season === season) || null;
}

function simulateChampionshipMembership(career, season, completedAt) {
  const existing = outcomeIn(career.worldHistory, CHAMPIONSHIP_ID, season);
  if (existing) return { status: 'already-finalised', outcome: existing };

  const clubs = getChampionshipMembership(career, season);
  if (!clubs) {
    const membership = findMembershipRecord(career, CHAMPIONSHIP_ID, season);
    const outcome = {
      schemaVersion: ENGLISH_PYRAMID_WORLD_VERSION,
      key: membershipKey(CHAMPIONSHIP_ID, season),
      competitionId: CHAMPIONSHIP_ID,
      competitionName: 'Championship',
      season,
      completedAt: null,
      status: 'unsupported-membership',
      membershipSource: membership?.membershipSource || 'lower-pyramid membership unavailable',
      clubs: clone(membership?.clubs || []),
      clubCount: membership?.clubs?.length || 0,
      championClubId: null,
      runnerUpClubId: null,
      automaticPromotionClubIds: [],
      playoffClubIds: [],
      playoffWinnerClubId: null,
      promotedClubIds: [],
      relegatedClubIds: [],
      playoffs: null,
      reason: membership?.reason || `Championship ${season} cannot be simulated until the lower-pyramid membership handoff is complete.`
    };
    career.worldHistory.push(outcome);
    return { status: outcome.status, outcome };
  }

  const simulated = simulateChampionshipSeason({
    seed: `${career.seed || career.id || 'career'}:${CHAMPIONSHIP_ID}`,
    season,
    clubs,
    completedAt
  });
  const outcome = {
    ...simulated,
    schemaVersion: ENGLISH_PYRAMID_WORLD_VERSION,
    membershipSource: season === '2026/27'
      ? '2026/27 verified Championship membership'
      : `derived English pyramid membership for ${season}`,
    clubs: clubs.map(club => compactClub(club))
  };
  career.worldHistory.push(outcome);
  return { status: outcome.status === 'complete' ? 'finalised' : outcome.status, outcome };
}

function simulateLeagueOneMembership(career, season, completedAt) {
  const existing = outcomeIn(career.lowerLeagueHistory, LEAGUE_ONE_ID, season);
  if (existing) return { status: 'already-finalised', outcome: existing };
  const clubs = getLeagueOneMembership(career, season);
  if (!clubs) {
    const membership = findMembershipRecord(career, LEAGUE_ONE_ID, season);
    return {
      status: 'unsupported-membership',
      outcome: {
        competitionId: LEAGUE_ONE_ID,
        competitionName: 'League One',
        season,
        status: 'unsupported-membership',
        promotedClubIds: [],
        relegatedClubIds: [],
        reason: membership?.reason || `League One ${season} requires League Two promotion/relegation data before it can be simulated.`
      }
    };
  }
  const outcome = simulateLeagueOneSeason({
    seed: `${career.seed || career.id || 'career'}:${LEAGUE_ONE_ID}`,
    season,
    clubs,
    completedAt
  });
  career.lowerLeagueHistory.push(outcome);
  return { status: outcome.status === 'complete' ? 'finalised' : outcome.status, outcome };
}

function attachChampionshipToNextSeason(career, outcome) {
  if (!career?.nextSeasonContext || !outcome) return;
  career.nextSeasonContext.championshipSeason = outcome.season;
  career.nextSeasonContext.championshipStatus = outcome.status;
  career.nextSeasonContext.promotedFromChampionshipClubIds = [...(outcome.promotedClubIds || [])];
  career.nextSeasonContext.championshipRelegatedClubIds = [...(outcome.relegatedClubIds || [])];
  career.nextSeasonContext.championshipChampionClubId = outcome.championClubId || null;
  career.nextSeasonContext.championshipPlayoffWinnerClubId = outcome.playoffWinnerClubId || null;
}

function sourceClubById(career, id) {
  return (career?.seasonClubs || []).find(club => club?.id === id) || null;
}

function premierRelegatedRecord(career, clubId, index) {
  const source = sourceClubById(career, clubId);
  const table = career?.seasonOutcome?.finalTable || career?.table || [];
  const position = table.findIndex(row => row?.clubId === clubId) + 1;
  const positionStrength = position >= 18 ? 84 - (position - 18) * 2 : 80 - index * 2;
  const sourceStrength = Number(source?.backgroundStrength);
  const strength = Number.isFinite(sourceStrength) ? clamp(sourceStrength + 4, 72, 86) : clamp(positionStrength, 76, 84);
  return compactClub(source || { id: clubId, name: clubId, strength }, {
    id: clubId,
    name: source?.name || source?.shortName || clubId,
    strength,
    pyramidOrigin: 'premier-league-relegation'
  });
}

function promotedLeagueOneRecord(club) {
  return compactClub(club, {
    strength: clamp(Number(club.strength || 68) + 2, 64, 80),
    pyramidOrigin: 'league-one-promotion'
  });
}

function championshipSurvivors(currentClubs, outcome) {
  const leaving = new Set([...(outcome.promotedClubIds || []), ...(outcome.relegatedClubIds || [])]);
  return currentClubs.filter(club => !leaving.has(club.id)).map(club => compactClub(club, { pyramidOrigin: club.pyramidOrigin || 'championship-survivor' }));
}

function uniqueMembership(clubs, expected, label) {
  const ids = clubs.map(club => club?.id).filter(Boolean);
  if (clubs.length !== expected || new Set(ids).size !== expected) {
    throw new Error(`${label} membership handoff requires exactly ${expected} unique clubs.`);
  }
  return clubs;
}

function buildChampionshipTargetMembership(career, championshipOutcome, leagueOneOutcome) {
  const sourceSeason = championshipOutcome.season;
  const targetSeason = nextPyramidSeasonLabel(sourceSeason);
  const currentClubs = getChampionshipMembership(career, sourceSeason);
  if (!targetSeason || !currentClubs || championshipOutcome.status !== 'complete') return null;

  const premierRelegatedClubIds = [...(career?.nextSeasonContext?.relegatedClubIds || career?.seasonOutcome?.relegatedClubIds || [])];
  if (premierRelegatedClubIds.length !== 3) return null;

  if (!leagueOneOutcome || leagueOneOutcome.status !== 'complete' || leagueOneOutcome.promotedClubIds?.length !== 3) {
    const known = [
      ...championshipSurvivors(currentClubs, championshipOutcome),
      ...premierRelegatedClubIds.map((clubId, index) => premierRelegatedRecord(career, clubId, index))
    ];
    return upsertMembership(career, {
      schemaVersion: ENGLISH_PYRAMID_WORLD_VERSION,
      key: membershipKey(CHAMPIONSHIP_ID, targetSeason),
      competitionId: CHAMPIONSHIP_ID,
      competitionName: 'Championship',
      season: targetSeason,
      status: 'incomplete-lower-pyramid',
      membershipSource: `${sourceSeason} Championship + Premier League handoff; League One feeder unavailable`,
      clubs: known,
      clubCount: known.length,
      missingPromotionSlots: 3,
      reason: `Championship ${targetSeason} is missing three promoted League One clubs. League Two must be modelled before the League One feeder can continue beyond ${sourceSeason}.`
    });
  }

  const leagueOneMap = new Map((leagueOneOutcome.clubs || []).map(club => [club.id, club]));
  const promoted = leagueOneOutcome.promotedClubIds.map(id => leagueOneMap.get(id)).filter(Boolean).map(promotedLeagueOneRecord);
  if (promoted.length !== 3) throw new Error('League One promotion outcome is missing club metadata.');

  const clubs = uniqueMembership([
    ...championshipSurvivors(currentClubs, championshipOutcome),
    ...premierRelegatedClubIds.map((clubId, index) => premierRelegatedRecord(career, clubId, index)),
    ...promoted
  ], 24, `Championship ${targetSeason}`);

  return upsertMembership(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_VERSION,
    key: membershipKey(CHAMPIONSHIP_ID, targetSeason),
    competitionId: CHAMPIONSHIP_ID,
    competitionName: 'Championship',
    season: targetSeason,
    status: 'complete',
    membershipSource: `${sourceSeason} cascade: 18 Championship survivors + 3 Premier League relegated + 3 League One promoted`,
    clubs,
    clubCount: clubs.length,
    sourceSeason,
    promotedToPremierLeagueClubIds: [...championshipOutcome.promotedClubIds],
    relegatedToLeagueOneClubIds: [...championshipOutcome.relegatedClubIds],
    relegatedFromPremierLeagueClubIds: premierRelegatedClubIds,
    promotedFromLeagueOneClubIds: [...leagueOneOutcome.promotedClubIds]
  });
}

function buildLeagueOneBoundary(career, championshipOutcome, leagueOneOutcome) {
  if (!leagueOneOutcome || leagueOneOutcome.status !== 'complete') return null;
  const sourceSeason = leagueOneOutcome.season;
  const targetSeason = nextPyramidSeasonLabel(sourceSeason);
  if (!targetSeason) return null;
  const current = getLeagueOneMembership(career, sourceSeason);
  if (!current) return null;
  const leaving = new Set([...(leagueOneOutcome.promotedClubIds || []), ...(leagueOneOutcome.relegatedClubIds || [])]);
  const survivors = current.filter(club => !leaving.has(club.id)).map(club => compactClub(club, { pyramidOrigin: 'league-one-survivor' }));
  const championshipMap = new Map((championshipOutcome.clubs || []).map(club => [club.id, club]));
  const relegatedFromChampionship = (championshipOutcome.relegatedClubIds || []).map(id => {
    const club = championshipMap.get(id) || { id, name: id, strength: 70 };
    return compactClub(club, { strength: clamp(Number(club.strength || 70) - 2, 62, 78), pyramidOrigin: 'championship-relegation' });
  });
  const known = [...survivors, ...relegatedFromChampionship];

  return upsertMembership(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_VERSION,
    key: membershipKey(LEAGUE_ONE_ID, targetSeason),
    competitionId: LEAGUE_ONE_ID,
    competitionName: 'League One',
    season: targetSeason,
    status: 'incomplete-lower-pyramid',
    membershipSource: `${sourceSeason} League One + Championship handoff; League Two feeder not yet modelled`,
    clubs: known,
    clubCount: known.length,
    missingPromotionSlots: 4,
    reason: `League One ${targetSeason} has ${known.length} known clubs and requires four promoted League Two clubs before background simulation can continue.`
  });
}

function recordBoundary(career, championshipMembership, leagueOneMembership) {
  const targetSeason = championshipMembership?.season || leagueOneMembership?.season;
  if (!targetSeason) return null;
  const key = `english-pyramid:${targetSeason}`;
  const existing = career.worldBoundaries.find(item => item?.key === key);
  if (existing) return existing;
  const boundary = {
    schemaVersion: ENGLISH_PYRAMID_WORLD_VERSION,
    key,
    season: targetSeason,
    status: championshipMembership?.status === 'complete' ? 'championship-ready' : 'blocked-by-lower-pyramid',
    championshipStatus: championshipMembership?.status || 'unknown',
    leagueOneStatus: leagueOneMembership?.status || 'unknown',
    reason: leagueOneMembership?.reason || championshipMembership?.reason || null
  };
  career.worldBoundaries.push(boundary);
  return boundary;
}

export function finaliseEnglishPyramidBackground(career, { completedAt = null } = {}) {
  if (!career || (career.competitionId || career.leagueId) !== 'eng-premier-league') {
    return { status: 'not-applicable', championship: null, leagueOne: null, membership: null };
  }
  ensureState(career);
  const season = career.season || '2026/27';

  const championship = simulateChampionshipMembership(career, season, completedAt);
  career.championshipOutcome = championship.outcome;
  attachChampionshipToNextSeason(career, championship.outcome);

  let leagueOne = { status: 'unsupported-membership', outcome: null };
  if (getLeagueOneMembership(career, season)) {
    leagueOne = simulateLeagueOneMembership(career, season, completedAt);
    career.leagueOneOutcome = leagueOne.outcome;
  }

  let championshipMembership = null;
  let leagueOneMembership = null;
  if (championship.outcome?.status === 'complete') {
    championshipMembership = buildChampionshipTargetMembership(career, championship.outcome, leagueOne.outcome);
    if (leagueOne.outcome?.status === 'complete') {
      leagueOneMembership = buildLeagueOneBoundary(career, championship.outcome, leagueOne.outcome);
    }
  }
  const boundary = recordBoundary(career, championshipMembership, leagueOneMembership);

  return {
    status: championship.status,
    championship,
    leagueOne,
    membership: championshipMembership,
    leagueOneMembership,
    boundary
  };
}
