import {
  finaliseEnglishPyramidBackground as baseFinaliseEnglishPyramidBackground,
  getChampionshipMembership,
  getLeagueOneMembership,
  nextPyramidSeasonLabel
} from './english-pyramid-world-v2.js';
import { LEAGUE_ONE_ID } from './league-one-world-v1.js';
import {
  LEAGUE_TWO_2026_27_CLUBS,
  LEAGUE_TWO_ID,
  simulateLeagueTwoSeason
} from './league-two-world-v1.js';

export * from './english-pyramid-world-v2.js';

export const ENGLISH_PYRAMID_WORLD_V3_VERSION = 3;

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function ensureState(career) {
  career.worldHistory ||= [];
  career.lowerLeagueHistory ||= [];
  career.worldMemberships ||= [];
  career.worldBoundaries ||= [];
  return career;
}

function membershipKey(competitionId, season) {
  return `${competitionId}:${season}`;
}

function compactClub(club, overrides = {}) {
  return {
    id: club.id,
    slug: club.slug || String(club.id || '').replace(/^eng-(?:championship|league-one|league-two)-/, ''),
    name: club.name || club.shortName || club.id,
    strength: Number(club.strength ?? club.backgroundStrength ?? overrides.strength ?? 64),
    ...overrides
  };
}

function findMembership(career, competitionId, season) {
  return (career?.worldMemberships || []).find(record => record?.key === membershipKey(competitionId, season)) || null;
}

function upsertMembership(career, record) {
  ensureState(career);
  const index = career.worldMemberships.findIndex(item => item?.key === record.key);
  if (index >= 0) career.worldMemberships[index] = clone(record);
  else career.worldMemberships.push(clone(record));
  return record;
}

function upsertBoundary(career, record) {
  ensureState(career);
  const index = career.worldBoundaries.findIndex(item => item?.key === record.key);
  if (index >= 0) career.worldBoundaries[index] = clone(record);
  else career.worldBoundaries.push(clone(record));
  return record;
}

function uniqueMembership(clubs, expected, label) {
  const ids = clubs.map(club => club?.id).filter(Boolean);
  if (clubs.length !== expected || new Set(ids).size !== expected) {
    throw new Error(`${label} membership handoff requires exactly ${expected} unique clubs.`);
  }
  return clubs;
}

function outcomeIn(history, competitionId, season) {
  return (history || []).find(record => record?.competitionId === competitionId && record?.season === season) || null;
}

export function getLeagueTwoMembership(career, season = career?.season || '2026/27') {
  if (season === '2026/27') return LEAGUE_TWO_2026_27_CLUBS.map(club => compactClub(club));
  const record = findMembership(career, LEAGUE_TWO_ID, season);
  if (!record || record.status !== 'complete' || record.clubs?.length !== 24) return null;
  return record.clubs.map(club => compactClub(club));
}

function simulateLeagueTwoMembership(career, season, completedAt) {
  const existing = outcomeIn(career.lowerLeagueHistory, LEAGUE_TWO_ID, season);
  if (existing) return { status: 'already-finalised', outcome: existing };
  const clubs = getLeagueTwoMembership(career, season);
  if (!clubs) {
    const membership = findMembership(career, LEAGUE_TWO_ID, season);
    return {
      status: 'unsupported-membership',
      outcome: {
        schemaVersion: ENGLISH_PYRAMID_WORLD_V3_VERSION,
        key: membershipKey(LEAGUE_TWO_ID, season),
        competitionId: LEAGUE_TWO_ID,
        competitionName: 'League Two',
        season,
        status: 'unsupported-membership',
        promotedClubIds: [],
        relegatedClubIds: [],
        reason: membership?.reason || `League Two ${season} requires National League promotion data before it can be simulated.`
      }
    };
  }
  const outcome = simulateLeagueTwoSeason({
    seed: `${career.seed || career.id || 'career'}:${LEAGUE_TWO_ID}`,
    season,
    clubs,
    completedAt
  });
  career.lowerLeagueHistory.push(outcome);
  return { status: outcome.status === 'complete' ? 'finalised' : outcome.status, outcome };
}

function leagueOneSurvivors(currentClubs, outcome) {
  const leaving = new Set([...(outcome.promotedClubIds || []), ...(outcome.relegatedClubIds || [])]);
  return currentClubs
    .filter(club => !leaving.has(club.id))
    .map(club => compactClub(club, { pyramidOrigin: club.pyramidOrigin || 'league-one-survivor' }));
}

function championshipRelegatedRecords(championshipOutcome) {
  const map = new Map((championshipOutcome?.clubs || []).map(club => [club.id, club]));
  return (championshipOutcome?.relegatedClubIds || []).map(id => {
    const club = map.get(id) || { id, name: id, strength: 70 };
    return compactClub(club, {
      strength: clamp(Number(club.strength || 70) - 2, 61, 78),
      pyramidOrigin: 'championship-relegation'
    });
  });
}

function leagueTwoPromotedRecords(leagueTwoOutcome) {
  const map = new Map((leagueTwoOutcome?.clubs || []).map(club => [club.id, club]));
  return (leagueTwoOutcome?.promotedClubIds || []).map(id => {
    const club = map.get(id);
    if (!club) throw new Error('League Two promotion outcome is missing club metadata.');
    return compactClub(club, {
      strength: clamp(Number(club.strength || 64) + 2, 60, 74),
      pyramidOrigin: 'league-two-promotion'
    });
  });
}

function buildLeagueOneTargetMembership(career, championshipOutcome, leagueOneOutcome, leagueTwoOutcome) {
  if (!championshipOutcome || championshipOutcome.status !== 'complete') return null;
  if (!leagueOneOutcome || leagueOneOutcome.status !== 'complete') return null;
  if (!leagueTwoOutcome || leagueTwoOutcome.status !== 'complete' || leagueTwoOutcome.promotedClubIds?.length !== 4) return null;

  const sourceSeason = leagueOneOutcome.season;
  const targetSeason = nextPyramidSeasonLabel(sourceSeason);
  const current = getLeagueOneMembership(career, sourceSeason);
  if (!targetSeason || !current) return null;

  const clubs = uniqueMembership([
    ...leagueOneSurvivors(current, leagueOneOutcome),
    ...championshipRelegatedRecords(championshipOutcome),
    ...leagueTwoPromotedRecords(leagueTwoOutcome)
  ], 24, `League One ${targetSeason}`);

  return upsertMembership(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V3_VERSION,
    key: membershipKey(LEAGUE_ONE_ID, targetSeason),
    competitionId: LEAGUE_ONE_ID,
    competitionName: 'League One',
    season: targetSeason,
    status: 'complete',
    membershipSource: `${sourceSeason} cascade: 17 League One survivors + 3 Championship relegated + 4 League Two promoted`,
    clubs,
    clubCount: clubs.length,
    sourceSeason,
    promotedToChampionshipClubIds: [...leagueOneOutcome.promotedClubIds],
    relegatedToLeagueTwoClubIds: [...leagueOneOutcome.relegatedClubIds],
    relegatedFromChampionshipClubIds: [...championshipOutcome.relegatedClubIds],
    promotedFromLeagueTwoClubIds: [...leagueTwoOutcome.promotedClubIds]
  });
}

function buildLeagueTwoNationalLeagueBoundary(career, leagueOneOutcome, leagueTwoOutcome) {
  if (!leagueOneOutcome || leagueOneOutcome.status !== 'complete') return null;
  if (!leagueTwoOutcome || leagueTwoOutcome.status !== 'complete') return null;
  const sourceSeason = leagueTwoOutcome.season;
  const targetSeason = nextPyramidSeasonLabel(sourceSeason);
  const current = getLeagueTwoMembership(career, sourceSeason);
  if (!targetSeason || !current) return null;

  const leaving = new Set([...(leagueTwoOutcome.promotedClubIds || []), ...(leagueTwoOutcome.relegatedClubIds || [])]);
  const survivors = current
    .filter(club => !leaving.has(club.id))
    .map(club => compactClub(club, { pyramidOrigin: 'league-two-survivor' }));
  const leagueOneMap = new Map((leagueOneOutcome.clubs || []).map(club => [club.id, club]));
  const relegatedFromLeagueOne = (leagueOneOutcome.relegatedClubIds || []).map(id => {
    const club = leagueOneMap.get(id) || { id, name: id, strength: 64 };
    return compactClub(club, {
      strength: clamp(Number(club.strength || 64) - 2, 57, 71),
      pyramidOrigin: 'league-one-relegation'
    });
  });
  const known = [...survivors, ...relegatedFromLeagueOne];
  if (known.length !== 22 || new Set(known.map(club => club.id)).size !== 22) {
    throw new Error(`League Two ${targetSeason} boundary must contain 22 known unique clubs before National League promotion.`);
  }

  return upsertMembership(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V3_VERSION,
    key: membershipKey(LEAGUE_TWO_ID, targetSeason),
    competitionId: LEAGUE_TWO_ID,
    competitionName: 'League Two',
    season: targetSeason,
    status: 'incomplete-lower-pyramid',
    membershipSource: `${sourceSeason} League Two + League One handoff; National League feeder not yet modelled`,
    clubs: known,
    clubCount: known.length,
    missingPromotionSlots: 2,
    promotedToLeagueOneClubIds: [...leagueTwoOutcome.promotedClubIds],
    relegatedToNationalLeagueClubIds: [...leagueTwoOutcome.relegatedClubIds],
    relegatedFromLeagueOneClubIds: [...leagueOneOutcome.relegatedClubIds],
    reason: `League Two ${targetSeason} has 22 known clubs and requires two promoted National League clubs before background simulation can continue.`
  });
}

function updateBoundary(career, baseResult, leagueOneMembership, leagueTwoMembership) {
  const targetSeason = leagueOneMembership?.season || leagueTwoMembership?.season || baseResult?.membership?.season;
  if (!targetSeason) return baseResult?.boundary || null;
  const championshipStatus = baseResult?.membership?.status || baseResult?.boundary?.championshipStatus || 'unknown';
  const leagueOneStatus = leagueOneMembership?.status || baseResult?.leagueOneMembership?.status || 'unknown';
  const leagueTwoStatus = leagueTwoMembership?.status || 'unknown';
  const readyThroughLeagueOne = championshipStatus === 'complete' && leagueOneStatus === 'complete';
  return upsertBoundary(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V3_VERSION,
    key: `english-pyramid:${targetSeason}`,
    season: targetSeason,
    status: readyThroughLeagueOne ? 'league-one-ready-national-league-boundary' : 'blocked-by-lower-pyramid',
    championshipStatus,
    leagueOneStatus,
    leagueTwoStatus,
    reason: leagueTwoMembership?.reason || baseResult?.leagueOneMembership?.reason || baseResult?.membership?.reason || null
  });
}

export function finaliseEnglishPyramidBackground(career, { completedAt = null } = {}) {
  const baseResult = baseFinaliseEnglishPyramidBackground(career, { completedAt });
  if (!career || (career.competitionId || career.leagueId) !== 'eng-premier-league') {
    return { ...baseResult, leagueTwo: null, leagueTwoMembership: null };
  }
  ensureState(career);
  const season = career.season || '2026/27';

  let leagueTwo = { status: 'unsupported-membership', outcome: null };
  if (getLeagueTwoMembership(career, season)) {
    leagueTwo = simulateLeagueTwoMembership(career, season, completedAt);
    career.leagueTwoOutcome = leagueTwo.outcome;
  }

  let leagueOneMembership = baseResult?.leagueOneMembership || null;
  if (baseResult?.championship?.outcome?.status === 'complete' && baseResult?.leagueOne?.outcome?.status === 'complete' && leagueTwo.outcome?.status === 'complete') {
    leagueOneMembership = buildLeagueOneTargetMembership(
      career,
      baseResult.championship.outcome,
      baseResult.leagueOne.outcome,
      leagueTwo.outcome
    ) || leagueOneMembership;
  }

  let leagueTwoMembership = null;
  if (baseResult?.leagueOne?.outcome?.status === 'complete' && leagueTwo.outcome?.status === 'complete') {
    leagueTwoMembership = buildLeagueTwoNationalLeagueBoundary(career, baseResult.leagueOne.outcome, leagueTwo.outcome);
  }

  const boundary = updateBoundary(career, baseResult, leagueOneMembership, leagueTwoMembership);
  return {
    ...baseResult,
    leagueTwo,
    leagueOneMembership,
    leagueTwoMembership,
    boundary
  };
}
