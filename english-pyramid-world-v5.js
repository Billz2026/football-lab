import {
  finaliseEnglishPyramidBackground as baseFinaliseEnglishPyramidBackground,
  getNationalLeagueMembership,
  nextPyramidSeasonLabel
} from './english-pyramid-world-v4.js';
import { NATIONAL_LEAGUE_ID } from './national-league-world-v1.js';
import {
  NATIONAL_LEAGUE_NORTH_2026_27_CLUBS,
  NATIONAL_LEAGUE_NORTH_ID,
  NATIONAL_LEAGUE_SOUTH_2026_27_CLUBS,
  NATIONAL_LEAGUE_SOUTH_ID,
  simulateNationalLeagueNorthSeason,
  simulateNationalLeagueSouthSeason
} from './national-league-step-two-world-v1.js';

export * from './english-pyramid-world-v4.js';

export const ENGLISH_PYRAMID_WORLD_V5_VERSION = 5;
export const NATIONAL_LEAGUE_STEP_TWO_AGGREGATE_ID = 'eng-national-league-step-two';

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
    slug: club.slug || String(club.id || '').replace(/^eng-(?:championship|league-one|league-two|national-league(?:-north|-south)?)-/, ''),
    name: club.name || club.shortName || club.id,
    strength: Number(club.strength ?? club.backgroundStrength ?? overrides.strength ?? 55),
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

function outcomeIn(career, competitionId, season) {
  return (career?.lowerLeagueHistory || []).find(record => record?.competitionId === competitionId && record?.season === season) || null;
}

function uniqueMembership(clubs, expected, label) {
  const ids = clubs.map(club => club?.id).filter(Boolean);
  if (clubs.length !== expected || new Set(ids).size !== expected) {
    throw new Error(`${label} membership handoff requires exactly ${expected} unique clubs.`);
  }
  return clubs;
}

export function getNationalLeagueStepTwoMembership(career, competitionId, season = career?.season || '2026/27') {
  if (season === '2026/27') {
    if (competitionId === NATIONAL_LEAGUE_NORTH_ID) return NATIONAL_LEAGUE_NORTH_2026_27_CLUBS.map(club => compactClub(club));
    if (competitionId === NATIONAL_LEAGUE_SOUTH_ID) return NATIONAL_LEAGUE_SOUTH_2026_27_CLUBS.map(club => compactClub(club));
  }
  const record = findMembership(career, competitionId, season);
  if (!record || record.status !== 'complete' || record.clubs?.length !== 24) return null;
  return record.clubs.map(club => compactClub(club));
}

function simulateStepTwoDivision(career, competitionId, season, completedAt) {
  const existing = outcomeIn(career, competitionId, season);
  if (existing) return { status: 'already-finalised', outcome: existing };
  const clubs = getNationalLeagueStepTwoMembership(career, competitionId, season);
  if (!clubs) {
    const membership = findMembership(career, competitionId, season);
    return {
      status: 'unsupported-membership',
      outcome: {
        schemaVersion: ENGLISH_PYRAMID_WORLD_V5_VERSION,
        key: membershipKey(competitionId, season),
        competitionId,
        competitionName: competitionId === NATIONAL_LEAGUE_NORTH_ID ? 'National League North' : 'National League South',
        season,
        status: 'unsupported-membership',
        promotedClubIds: [],
        relegatedClubIds: [],
        reason: membership?.reason || `${season} Step 2 membership requires Step 3 promotion and FA geographic allocation data.`
      }
    };
  }
  const options = {
    seed: `${career.seed || career.id || 'career'}:${competitionId}`,
    season,
    clubs,
    completedAt
  };
  const outcome = competitionId === NATIONAL_LEAGUE_NORTH_ID
    ? simulateNationalLeagueNorthSeason(options)
    : simulateNationalLeagueSouthSeason(options);
  career.lowerLeagueHistory.push(outcome);
  return { status: outcome.status === 'complete' ? 'finalised' : outcome.status, outcome };
}

function nationalLeagueSurvivors(currentClubs, outcome) {
  const leaving = new Set([...(outcome.promotedClubIds || []), ...(outcome.relegatedClubIds || [])]);
  return currentClubs
    .filter(club => !leaving.has(club.id))
    .map(club => compactClub(club, { pyramidOrigin: club.pyramidOrigin || 'national-league-survivor' }));
}

function leagueTwoRelegatedRecords(leagueTwoOutcome) {
  const map = new Map((leagueTwoOutcome?.clubs || []).map(club => [club.id, club]));
  return (leagueTwoOutcome?.relegatedClubIds || []).map(id => {
    const club = map.get(id) || { id, name: id, strength: 59 };
    return compactClub(club, {
      strength: clamp(Number(club.strength || 59) - 2, 53, 65),
      pyramidOrigin: 'league-two-relegation'
    });
  });
}

function stepTwoPromotedRecords(...outcomes) {
  return outcomes.flatMap(outcome => {
    const map = new Map((outcome?.clubs || []).map(club => [club.id, club]));
    return (outcome?.promotedClubIds || []).map(id => {
      const club = map.get(id);
      if (!club) throw new Error('Step 2 promotion outcome is missing club metadata.');
      return compactClub(club, {
        strength: clamp(Number(club.strength || 56) + 2, 53, 64),
        pyramidOrigin: outcome.competitionId === NATIONAL_LEAGUE_NORTH_ID
          ? 'national-league-north-promotion'
          : 'national-league-south-promotion'
      });
    });
  });
}

function buildNationalLeagueTargetMembership(career, leagueTwoOutcome, nationalLeagueOutcome, northOutcome, southOutcome) {
  if (!leagueTwoOutcome || leagueTwoOutcome.status !== 'complete') return null;
  if (!nationalLeagueOutcome || nationalLeagueOutcome.status !== 'complete') return null;
  if (!northOutcome || northOutcome.status !== 'complete' || northOutcome.promotedClubIds?.length !== 2) return null;
  if (!southOutcome || southOutcome.status !== 'complete' || southOutcome.promotedClubIds?.length !== 2) return null;

  const sourceSeason = nationalLeagueOutcome.season;
  const targetSeason = nextPyramidSeasonLabel(sourceSeason);
  const current = getNationalLeagueMembership(career, sourceSeason);
  if (!targetSeason || !current) return null;

  const clubs = uniqueMembership([
    ...nationalLeagueSurvivors(current, nationalLeagueOutcome),
    ...leagueTwoRelegatedRecords(leagueTwoOutcome),
    ...stepTwoPromotedRecords(northOutcome, southOutcome)
  ], 24, `National League ${targetSeason}`);

  return upsertMembership(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V5_VERSION,
    key: membershipKey(NATIONAL_LEAGUE_ID, targetSeason),
    competitionId: NATIONAL_LEAGUE_ID,
    competitionName: 'National League',
    season: targetSeason,
    status: 'complete',
    membershipSource: `${sourceSeason} cascade: 18 National League survivors + 2 League Two relegated + 4 Step 2 promoted`,
    clubs,
    clubCount: clubs.length,
    sourceSeason,
    promotedToLeagueTwoClubIds: [...nationalLeagueOutcome.promotedClubIds],
    relegatedToStepTwoClubIds: [...nationalLeagueOutcome.relegatedClubIds],
    relegatedFromLeagueTwoClubIds: [...leagueTwoOutcome.relegatedClubIds],
    promotedFromNationalLeagueNorthClubIds: [...northOutcome.promotedClubIds],
    promotedFromNationalLeagueSouthClubIds: [...southOutcome.promotedClubIds]
  });
}

function stepTwoSurvivors(outcome) {
  const leaving = new Set([...(outcome.promotedClubIds || []), ...(outcome.relegatedClubIds || [])]);
  return (outcome.clubs || [])
    .filter(club => !leaving.has(club.id))
    .map(club => compactClub(club, {
      pyramidOrigin: outcome.competitionId === NATIONAL_LEAGUE_NORTH_ID
        ? 'national-league-north-survivor'
        : 'national-league-south-survivor'
    }));
}

function nationalLeagueRelegatedPool(nationalLeagueOutcome) {
  const map = new Map((nationalLeagueOutcome?.clubs || []).map(club => [club.id, club]));
  return (nationalLeagueOutcome?.relegatedClubIds || []).map(id => {
    const club = map.get(id) || { id, name: id, strength: 57 };
    return compactClub(club, {
      strength: clamp(Number(club.strength || 57) - 2, 51, 62),
      pyramidOrigin: 'national-league-relegation-unallocated-step-two'
    });
  });
}

function buildStepThreeBoundary(career, nationalLeagueOutcome, northOutcome, southOutcome) {
  if (!nationalLeagueOutcome || nationalLeagueOutcome.status !== 'complete') return null;
  if (!northOutcome || northOutcome.status !== 'complete' || !southOutcome || southOutcome.status !== 'complete') return null;
  const sourceSeason = nationalLeagueOutcome.season;
  const targetSeason = nextPyramidSeasonLabel(sourceSeason);
  if (!targetSeason) return null;

  const northSurvivors = stepTwoSurvivors(northOutcome);
  const southSurvivors = stepTwoSurvivors(southOutcome);
  const relegatedFromNationalLeague = nationalLeagueRelegatedPool(nationalLeagueOutcome);
  if (northSurvivors.length !== 18 || southSurvivors.length !== 18 || relegatedFromNationalLeague.length !== 4) {
    throw new Error(`Step 2 ${targetSeason} boundary requires 18 North survivors, 18 South survivors and four relegated Step 1 clubs.`);
  }
  const known = [...northSurvivors, ...southSurvivors, ...relegatedFromNationalLeague];
  if (new Set(known.map(club => club.id)).size !== 40) throw new Error(`Step 2 ${targetSeason} boundary requires 40 unique known clubs.`);

  return upsertMembership(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V5_VERSION,
    key: membershipKey(NATIONAL_LEAGUE_STEP_TWO_AGGREGATE_ID, targetSeason),
    competitionId: NATIONAL_LEAGUE_STEP_TWO_AGGREGATE_ID,
    competitionName: 'National League Step 2',
    season: targetSeason,
    status: 'incomplete-step-three-feeder',
    membershipSource: `${sourceSeason} Step 2 survivors plus unallocated National League relegation feeder pool; Step 3 not yet modelled`,
    clubs: known,
    clubCount: known.length,
    targetClubCount: 48,
    targetDivisionCount: 2,
    targetClubsPerDivision: 24,
    northSurvivorClubIds: northSurvivors.map(club => club.id),
    southSurvivorClubIds: southSurvivors.map(club => club.id),
    unallocatedRelegatedFromNationalLeagueClubIds: relegatedFromNationalLeague.map(club => club.id),
    promotedToNationalLeagueClubIds: [...northOutcome.promotedClubIds, ...southOutcome.promotedClubIds],
    relegatedToStepThreeClubIds: [...northOutcome.relegatedClubIds, ...southOutcome.relegatedClubIds],
    missingPromotionSlots: 8,
    reason: `Step 2 ${targetSeason} has 40 known clubs. It still requires eight promoted clubs from the four Step 3 divisions, plus FA geographic allocation of the four relegated National League clubs between North and South.`
  });
}

function updateBoundary(career, baseResult, nationalLeagueMembership, stepThreeBoundary) {
  const targetSeason = nationalLeagueMembership?.season || stepThreeBoundary?.season || baseResult?.boundary?.season;
  if (!targetSeason) return baseResult?.boundary || null;
  const championshipStatus = baseResult?.membership?.status || baseResult?.boundary?.championshipStatus || 'unknown';
  const leagueOneStatus = baseResult?.leagueOneMembership?.status || baseResult?.boundary?.leagueOneStatus || 'unknown';
  const leagueTwoStatus = baseResult?.leagueTwoMembership?.status || baseResult?.boundary?.leagueTwoStatus || 'unknown';
  const nationalLeagueStatus = nationalLeagueMembership?.status || baseResult?.nationalLeagueMembership?.status || baseResult?.boundary?.nationalLeagueStatus || 'unknown';
  const stepTwoStatus = stepThreeBoundary?.status || 'unknown';
  const readyThroughNationalLeague = championshipStatus === 'complete' && leagueOneStatus === 'complete' && leagueTwoStatus === 'complete' && nationalLeagueStatus === 'complete';
  return upsertBoundary(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V5_VERSION,
    key: `english-pyramid:${targetSeason}`,
    season: targetSeason,
    status: readyThroughNationalLeague ? 'national-league-ready-step-three-boundary' : 'blocked-by-lower-pyramid',
    championshipStatus,
    leagueOneStatus,
    leagueTwoStatus,
    nationalLeagueStatus,
    stepTwoStatus,
    reason: stepThreeBoundary?.reason || baseResult?.nationalLeagueMembership?.reason || baseResult?.boundary?.reason || null
  });
}

export function finaliseEnglishPyramidBackground(career, { completedAt = null } = {}) {
  const baseResult = baseFinaliseEnglishPyramidBackground(career, { completedAt });
  if (!career || (career.competitionId || career.leagueId) !== 'eng-premier-league') {
    return { ...baseResult, nationalLeagueNorth: null, nationalLeagueSouth: null, stepTwoBoundary: null };
  }
  ensureState(career);
  const season = career.season || '2026/27';

  const nationalLeagueNorth = simulateStepTwoDivision(career, NATIONAL_LEAGUE_NORTH_ID, season, completedAt);
  const nationalLeagueSouth = simulateStepTwoDivision(career, NATIONAL_LEAGUE_SOUTH_ID, season, completedAt);
  career.nationalLeagueNorthOutcome = nationalLeagueNorth.outcome;
  career.nationalLeagueSouthOutcome = nationalLeagueSouth.outcome;

  let nationalLeagueMembership = baseResult?.nationalLeagueMembership || null;
  if (
    baseResult?.leagueTwo?.outcome?.status === 'complete' &&
    baseResult?.nationalLeague?.outcome?.status === 'complete' &&
    nationalLeagueNorth.outcome?.status === 'complete' &&
    nationalLeagueSouth.outcome?.status === 'complete'
  ) {
    nationalLeagueMembership = buildNationalLeagueTargetMembership(
      career,
      baseResult.leagueTwo.outcome,
      baseResult.nationalLeague.outcome,
      nationalLeagueNorth.outcome,
      nationalLeagueSouth.outcome
    ) || nationalLeagueMembership;
  }

  let stepTwoBoundary = null;
  if (
    baseResult?.nationalLeague?.outcome?.status === 'complete' &&
    nationalLeagueNorth.outcome?.status === 'complete' &&
    nationalLeagueSouth.outcome?.status === 'complete'
  ) {
    stepTwoBoundary = buildStepThreeBoundary(
      career,
      baseResult.nationalLeague.outcome,
      nationalLeagueNorth.outcome,
      nationalLeagueSouth.outcome
    );
  }

  const boundary = updateBoundary(career, baseResult, nationalLeagueMembership, stepTwoBoundary);
  return {
    ...baseResult,
    nationalLeagueNorth,
    nationalLeagueSouth,
    nationalLeagueMembership,
    stepTwoBoundary,
    boundary
  };
}
