import {
  finaliseEnglishPyramidBackground as baseFinaliseEnglishPyramidBackground,
  getLeagueTwoMembership,
  nextPyramidSeasonLabel
} from './english-pyramid-world-v3.js';
import { LEAGUE_TWO_ID } from './league-two-world-v1.js';
import {
  NATIONAL_LEAGUE_2026_27_CLUBS,
  NATIONAL_LEAGUE_ID,
  simulateNationalLeagueSeason
} from './national-league-world-v1.js';

export * from './english-pyramid-world-v3.js';

export const ENGLISH_PYRAMID_WORLD_V4_VERSION = 4;

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
    slug: club.slug || String(club.id || '').replace(/^eng-(?:championship|league-one|league-two|national-league)-/, ''),
    name: club.name || club.shortName || club.id,
    strength: Number(club.strength ?? club.backgroundStrength ?? overrides.strength ?? 58),
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

function outcomeIn(history, competitionId, season) {
  return (history || []).find(record => record?.competitionId === competitionId && record?.season === season) || null;
}

function uniqueMembership(clubs, expected, label) {
  const ids = clubs.map(club => club?.id).filter(Boolean);
  if (clubs.length !== expected || new Set(ids).size !== expected) {
    throw new Error(`${label} membership handoff requires exactly ${expected} unique clubs.`);
  }
  return clubs;
}

export function getNationalLeagueMembership(career, season = career?.season || '2026/27') {
  if (season === '2026/27') return NATIONAL_LEAGUE_2026_27_CLUBS.map(club => compactClub(club));
  const record = findMembership(career, NATIONAL_LEAGUE_ID, season);
  if (!record || record.status !== 'complete' || record.clubs?.length !== 24) return null;
  return record.clubs.map(club => compactClub(club));
}

function simulateNationalLeagueMembership(career, season, completedAt) {
  const existing = outcomeIn(career.lowerLeagueHistory, NATIONAL_LEAGUE_ID, season);
  if (existing) return { status: 'already-finalised', outcome: existing };
  const clubs = getNationalLeagueMembership(career, season);
  if (!clubs) {
    const membership = findMembership(career, NATIONAL_LEAGUE_ID, season);
    return {
      status: 'unsupported-membership',
      outcome: {
        schemaVersion: ENGLISH_PYRAMID_WORLD_V4_VERSION,
        key: membershipKey(NATIONAL_LEAGUE_ID, season),
        competitionId: NATIONAL_LEAGUE_ID,
        competitionName: 'National League',
        season,
        status: 'unsupported-membership',
        promotedClubIds: [],
        relegatedClubIds: [],
        reason: membership?.reason || `National League ${season} requires National League North/South promotion data before it can be simulated.`
      }
    };
  }
  const outcome = simulateNationalLeagueSeason({
    seed: `${career.seed || career.id || 'career'}:${NATIONAL_LEAGUE_ID}`,
    season,
    clubs,
    completedAt
  });
  career.lowerLeagueHistory.push(outcome);
  return { status: outcome.status === 'complete' ? 'finalised' : outcome.status, outcome };
}

function leagueTwoSurvivors(currentClubs, outcome) {
  const leaving = new Set([...(outcome.promotedClubIds || []), ...(outcome.relegatedClubIds || [])]);
  return currentClubs
    .filter(club => !leaving.has(club.id))
    .map(club => compactClub(club, { pyramidOrigin: club.pyramidOrigin || 'league-two-survivor' }));
}

function leagueOneRelegatedRecords(leagueOneOutcome) {
  const map = new Map((leagueOneOutcome?.clubs || []).map(club => [club.id, club]));
  return (leagueOneOutcome?.relegatedClubIds || []).map(id => {
    const club = map.get(id) || { id, name: id, strength: 64 };
    return compactClub(club, {
      strength: clamp(Number(club.strength || 64) - 2, 56, 70),
      pyramidOrigin: 'league-one-relegation'
    });
  });
}

function nationalLeaguePromotedRecords(nationalLeagueOutcome) {
  const map = new Map((nationalLeagueOutcome?.clubs || []).map(club => [club.id, club]));
  return (nationalLeagueOutcome?.promotedClubIds || []).map(id => {
    const club = map.get(id);
    if (!club) throw new Error('National League promotion outcome is missing club metadata.');
    return compactClub(club, {
      strength: clamp(Number(club.strength || 59) + 2, 56, 68),
      pyramidOrigin: 'national-league-promotion'
    });
  });
}

function buildLeagueTwoTargetMembership(career, leagueOneOutcome, leagueTwoOutcome, nationalLeagueOutcome) {
  if (!leagueOneOutcome || leagueOneOutcome.status !== 'complete') return null;
  if (!leagueTwoOutcome || leagueTwoOutcome.status !== 'complete') return null;
  if (!nationalLeagueOutcome || nationalLeagueOutcome.status !== 'complete' || nationalLeagueOutcome.promotedClubIds?.length !== 2) return null;

  const sourceSeason = leagueTwoOutcome.season;
  const targetSeason = nextPyramidSeasonLabel(sourceSeason);
  const current = getLeagueTwoMembership(career, sourceSeason);
  if (!targetSeason || !current) return null;

  const clubs = uniqueMembership([
    ...leagueTwoSurvivors(current, leagueTwoOutcome),
    ...leagueOneRelegatedRecords(leagueOneOutcome),
    ...nationalLeaguePromotedRecords(nationalLeagueOutcome)
  ], 24, `League Two ${targetSeason}`);

  return upsertMembership(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V4_VERSION,
    key: membershipKey(LEAGUE_TWO_ID, targetSeason),
    competitionId: LEAGUE_TWO_ID,
    competitionName: 'League Two',
    season: targetSeason,
    status: 'complete',
    membershipSource: `${sourceSeason} cascade: 18 League Two survivors + 4 League One relegated + 2 National League promoted`,
    clubs,
    clubCount: clubs.length,
    sourceSeason,
    promotedToLeagueOneClubIds: [...leagueTwoOutcome.promotedClubIds],
    relegatedToNationalLeagueClubIds: [...leagueTwoOutcome.relegatedClubIds],
    relegatedFromLeagueOneClubIds: [...leagueOneOutcome.relegatedClubIds],
    promotedFromNationalLeagueClubIds: [...nationalLeagueOutcome.promotedClubIds]
  });
}

function buildNationalLeagueStepTwoBoundary(career, leagueTwoOutcome, nationalLeagueOutcome) {
  if (!leagueTwoOutcome || leagueTwoOutcome.status !== 'complete') return null;
  if (!nationalLeagueOutcome || nationalLeagueOutcome.status !== 'complete') return null;
  const sourceSeason = nationalLeagueOutcome.season;
  const targetSeason = nextPyramidSeasonLabel(sourceSeason);
  const current = getNationalLeagueMembership(career, sourceSeason);
  if (!targetSeason || !current) return null;

  const leaving = new Set([...(nationalLeagueOutcome.promotedClubIds || []), ...(nationalLeagueOutcome.relegatedClubIds || [])]);
  const survivors = current
    .filter(club => !leaving.has(club.id))
    .map(club => compactClub(club, { pyramidOrigin: 'national-league-survivor' }));
  const leagueTwoMap = new Map((leagueTwoOutcome.clubs || []).map(club => [club.id, club]));
  const relegatedFromLeagueTwo = (leagueTwoOutcome.relegatedClubIds || []).map(id => {
    const club = leagueTwoMap.get(id) || { id, name: id, strength: 59 };
    return compactClub(club, {
      strength: clamp(Number(club.strength || 59) - 2, 53, 65),
      pyramidOrigin: 'league-two-relegation'
    });
  });
  const known = [...survivors, ...relegatedFromLeagueTwo];
  if (known.length !== 20 || new Set(known.map(club => club.id)).size !== 20) {
    throw new Error(`National League ${targetSeason} boundary must contain 20 known unique clubs before Step 2 promotion.`);
  }

  return upsertMembership(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V4_VERSION,
    key: membershipKey(NATIONAL_LEAGUE_ID, targetSeason),
    competitionId: NATIONAL_LEAGUE_ID,
    competitionName: 'National League',
    season: targetSeason,
    status: 'incomplete-lower-pyramid',
    membershipSource: `${sourceSeason} National League + League Two handoff; National League North/South feeders not yet modelled`,
    clubs: known,
    clubCount: known.length,
    missingPromotionSlots: 4,
    promotedToLeagueTwoClubIds: [...nationalLeagueOutcome.promotedClubIds],
    relegatedToStepTwoClubIds: [...nationalLeagueOutcome.relegatedClubIds],
    relegatedFromLeagueTwoClubIds: [...leagueTwoOutcome.relegatedClubIds],
    reason: `National League ${targetSeason} has 20 known clubs and requires four promoted clubs from National League North/South before background simulation can continue.`
  });
}

function updateBoundary(career, baseResult, leagueTwoMembership, nationalLeagueMembership) {
  const targetSeason = leagueTwoMembership?.season || nationalLeagueMembership?.season || baseResult?.boundary?.season;
  if (!targetSeason) return baseResult?.boundary || null;
  const championshipStatus = baseResult?.membership?.status || baseResult?.boundary?.championshipStatus || 'unknown';
  const leagueOneStatus = baseResult?.leagueOneMembership?.status || baseResult?.boundary?.leagueOneStatus || 'unknown';
  const leagueTwoStatus = leagueTwoMembership?.status || baseResult?.leagueTwoMembership?.status || baseResult?.boundary?.leagueTwoStatus || 'unknown';
  const nationalLeagueStatus = nationalLeagueMembership?.status || 'unknown';
  const readyThroughLeagueTwo = championshipStatus === 'complete' && leagueOneStatus === 'complete' && leagueTwoStatus === 'complete';
  return upsertBoundary(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V4_VERSION,
    key: `english-pyramid:${targetSeason}`,
    season: targetSeason,
    status: readyThroughLeagueTwo ? 'league-two-ready-step-two-boundary' : 'blocked-by-lower-pyramid',
    championshipStatus,
    leagueOneStatus,
    leagueTwoStatus,
    nationalLeagueStatus,
    reason: nationalLeagueMembership?.reason || baseResult?.leagueTwoMembership?.reason || baseResult?.boundary?.reason || null
  });
}

export function finaliseEnglishPyramidBackground(career, { completedAt = null } = {}) {
  const baseResult = baseFinaliseEnglishPyramidBackground(career, { completedAt });
  if (!career || (career.competitionId || career.leagueId) !== 'eng-premier-league') {
    return { ...baseResult, nationalLeague: null, nationalLeagueMembership: null };
  }
  ensureState(career);
  const season = career.season || '2026/27';

  let nationalLeague = { status: 'unsupported-membership', outcome: null };
  if (getNationalLeagueMembership(career, season)) {
    nationalLeague = simulateNationalLeagueMembership(career, season, completedAt);
    career.nationalLeagueOutcome = nationalLeague.outcome;
  }

  let leagueTwoMembership = baseResult?.leagueTwoMembership || null;
  if (baseResult?.leagueOne?.outcome?.status === 'complete' && baseResult?.leagueTwo?.outcome?.status === 'complete' && nationalLeague.outcome?.status === 'complete') {
    leagueTwoMembership = buildLeagueTwoTargetMembership(
      career,
      baseResult.leagueOne.outcome,
      baseResult.leagueTwo.outcome,
      nationalLeague.outcome
    ) || leagueTwoMembership;
  }

  let nationalLeagueMembership = null;
  if (baseResult?.leagueTwo?.outcome?.status === 'complete' && nationalLeague.outcome?.status === 'complete') {
    nationalLeagueMembership = buildNationalLeagueStepTwoBoundary(career, baseResult.leagueTwo.outcome, nationalLeague.outcome);
  }

  const boundary = updateBoundary(career, baseResult, leagueTwoMembership, nationalLeagueMembership);
  return {
    ...baseResult,
    nationalLeague,
    leagueTwoMembership,
    nationalLeagueMembership,
    boundary
  };
}
