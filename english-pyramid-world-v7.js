import {
  finaliseEnglishPyramidBackground as baseFinaliseEnglishPyramidBackground,
  nextPyramidSeasonLabel,
  NATIONAL_LEAGUE_STEP_TWO_AGGREGATE_ID
} from './english-pyramid-world-v6.js';
import { NATIONAL_LEAGUE_ID } from './national-league-world-v1.js';
import {
  NATIONAL_LEAGUE_NORTH_ID,
  NATIONAL_LEAGUE_SOUTH_ID
} from './national-league-step-two-world-v1.js';
import {
  STEP_THREE_DIVISION_IDS,
  STEP_THREE_2026_27_MEMBERSHIPS,
  ISTHMIAN_PREMIER_ID,
  NORTHERN_PREMIER_ID,
  SOUTHERN_PREMIER_CENTRAL_ID,
  SOUTHERN_PREMIER_SOUTH_ID,
  simulateStepThreeDivisionSeason
} from './national-league-step-three-world-v1.js';
import {
  STEP_FOUR_DIVISION_IDS,
  STEP_FOUR_2026_27_MEMBERSHIPS,
  STEP_FOUR_TO_STEP_THREE_PREFERENCES,
  simulateStepFourDivisionSeason
} from './national-league-step-four-world-v1.js';

export * from './english-pyramid-world-v6.js';

export const ENGLISH_PYRAMID_WORLD_V7_VERSION = 7;
export const NATIONAL_LEAGUE_STEP_THREE_AGGREGATE_V7_ID = 'eng-national-league-step-three';
export const NATIONAL_LEAGUE_STEP_FOUR_AGGREGATE_ID = 'eng-national-league-step-four';

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function ensureState(career) {
  career.worldHistory ||= [];
  career.lowerLeagueHistory ||= [];
  career.worldMemberships ||= [];
  career.worldBoundaries ||= [];
  return career;
}
function key(competitionId, season) { return `${competitionId}:${season}`; }
function findMembership(career, competitionId, season) {
  return (career?.worldMemberships || []).find(record => record?.key === key(competitionId, season)) || null;
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
function compactClub(club, overrides = {}) {
  return {
    id: club.id,
    slug: club.slug || String(club.id || '').split('-').slice(3).join('-'),
    name: club.name || club.id,
    strength: Number(club.strength ?? club.backgroundStrength ?? 52),
    geoNorthing: Number.isFinite(Number(club.geoNorthing)) ? Number(club.geoNorthing) : null,
    geoEasting: Number.isFinite(Number(club.geoEasting)) ? Number(club.geoEasting) : null,
    ...overrides
  };
}
function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function stepThreeClubsForSeason(career, competitionId, season) {
  if (season === '2026/27') return STEP_THREE_2026_27_MEMBERSHIPS[competitionId] || null;
  const membership = findMembership(career, competitionId, season);
  return membership?.status === 'complete' && membership.clubCount === 22 ? membership.clubs : null;
}
function simulateStepThreeV7(career, competitionId, season, completedAt) {
  const existing = outcomeIn(career, competitionId, season);
  if (existing) return { status: 'already-finalised', outcome: existing };
  const clubs = stepThreeClubsForSeason(career, competitionId, season);
  if (!clubs) {
    return {
      status: 'unsupported-membership',
      outcome: {
        schemaVersion: ENGLISH_PYRAMID_WORLD_V7_VERSION,
        key: key(competitionId, season),
        competitionId,
        season,
        status: 'unsupported-membership',
        promotedClubIds: [],
        relegatedClubIds: [],
        reason: `${season} Step 3 membership requires Step 4 promotion and FA-style geographic allocation data.`
      }
    };
  }
  const outcome = simulateStepThreeDivisionSeason({
    competitionId,
    season,
    clubs,
    seed: `${career.seed || career.id || 'career'}:${competitionId}:v7`,
    completedAt
  });
  career.lowerLeagueHistory.push(outcome);
  return { status: outcome.status === 'complete' ? 'finalised' : outcome.status, outcome };
}

function stepFourClubsForSeason(career, competitionId, season) {
  if (season === '2026/27') return STEP_FOUR_2026_27_MEMBERSHIPS[competitionId] || null;
  const membership = findMembership(career, competitionId, season);
  return membership?.status === 'complete' && membership.clubCount === 22 ? membership.clubs : null;
}
function simulateStepFourV7(career, competitionId, season, completedAt) {
  const existing = outcomeIn(career, competitionId, season);
  if (existing) return { status: 'already-finalised', outcome: existing };
  const clubs = stepFourClubsForSeason(career, competitionId, season);
  if (!clubs) {
    return {
      status: 'unsupported-membership',
      outcome: {
        schemaVersion: ENGLISH_PYRAMID_WORLD_V7_VERSION,
        key: key(competitionId, season),
        competitionId,
        season,
        status: 'unsupported-membership',
        promotedClubIds: [],
        relegatedClubIds: [],
        reason: `${season} Step 4 membership requires the 32 Step 5 promotion places and FA geographic allocation data.`
      }
    };
  }
  const outcome = simulateStepFourDivisionSeason({
    competitionId,
    season,
    clubs,
    seed: `${career.seed || career.id || 'career'}:${competitionId}:v7`,
    completedAt
  });
  career.lowerLeagueHistory.push(outcome);
  return { status: outcome.status === 'complete' ? 'finalised' : outcome.status, outcome };
}

const STEP_THREE_NAMES = Object.freeze({
  [ISTHMIAN_PREMIER_ID]: 'Isthmian League Premier',
  [NORTHERN_PREMIER_ID]: 'Northern Premier League Premier',
  [SOUTHERN_PREMIER_CENTRAL_ID]: 'Southern League Premier Central',
  [SOUTHERN_PREMIER_SOUTH_ID]: 'Southern League Premier South'
});

function stepThreeSurvivors(outcome) {
  const leaving = new Set([...(outcome?.promotedClubIds || []), ...(outcome?.relegatedClubIds || [])]);
  return (outcome?.clubs || [])
    .filter(club => !leaving.has(club.id))
    .map(club => compactClub(club, {
      assignedStepThreeDivisionId: outcome.competitionId,
      pyramidOrigin: `${outcome.competitionId}-survivor`
    }));
}
function stepThreeRelegated(outcome) {
  const map = new Map((outcome?.clubs || []).map(club => [club.id, club]));
  return (outcome?.relegatedClubIds || []).map(id => {
    const club = map.get(id) || { id, name: id, strength: 50 };
    return compactClub(club, {
      strength: clamp(Number(club.strength || 50) - 1, 44, 57),
      pyramidOrigin: `${outcome.competitionId}-relegated-to-step-four`
    });
  });
}
function promotedStepFourRecords(outcomes) {
  return outcomes.flatMap(outcome => {
    const map = new Map((outcome?.clubs || []).map(club => [club.id, club]));
    return (outcome?.promotedClubIds || []).map(id => {
      const club = map.get(id);
      if (!club) throw new Error('Step 4 promotion is missing club metadata.');
      return compactClub(club, {
        strength: clamp(Number(club.strength || 49) + 2, 47, 58),
        sourceStepFourDivisionId: outcome.competitionId,
        preferredStepThreeDivisionIds: [...(club.preferredStepThreeDivisionIds || STEP_FOUR_TO_STEP_THREE_PREFERENCES[outcome.competitionId] || STEP_THREE_DIVISION_IDS)],
        pyramidOrigin: `${outcome.competitionId}-promotion`
      });
    });
  });
}
function stepTwoRelegatedRecords(baseResult) {
  const divisions = [
    [NATIONAL_LEAGUE_NORTH_ID, baseResult?.nationalLeagueNorth?.outcome],
    [NATIONAL_LEAGUE_SOUTH_ID, baseResult?.nationalLeagueSouth?.outcome]
  ];
  return divisions.flatMap(([competitionId, outcome]) => {
    if (!outcome || outcome.status !== 'complete') return [];
    const map = new Map((outcome.clubs || []).map(club => [club.id, club]));
    const preferences = competitionId === NATIONAL_LEAGUE_NORTH_ID
      ? [NORTHERN_PREMIER_ID, SOUTHERN_PREMIER_CENTRAL_ID, ISTHMIAN_PREMIER_ID, SOUTHERN_PREMIER_SOUTH_ID]
      : [ISTHMIAN_PREMIER_ID, SOUTHERN_PREMIER_SOUTH_ID, SOUTHERN_PREMIER_CENTRAL_ID, NORTHERN_PREMIER_ID];
    return (outcome.relegatedClubIds || []).map(id => {
      const club = map.get(id) || { id, name: id, strength: 55 };
      const rotate = hashString(id) % 2;
      const ordered = rotate ? [preferences[0], preferences[2], preferences[1], preferences[3]] : preferences;
      return compactClub(club, {
        strength: clamp(Number(club.strength || 55) - 2, 49, 60),
        preferredStepThreeDivisionIds: ordered,
        pyramidOrigin: `${competitionId}-relegation-to-step-three`
      });
    });
  });
}
function allocateIncomingStepThree(incoming) {
  if (incoming.length !== 24 || new Set(incoming.map(club => club.id)).size !== 24) {
    throw new Error('Step 3 feeder allocation requires exactly 24 unique incoming clubs.');
  }
  const capacity = new Map(STEP_THREE_DIVISION_IDS.map(id => [id, 6]));
  const assignments = new Map(STEP_THREE_DIVISION_IDS.map(id => [id, []]));
  const ordered = [...incoming].sort((a, b) => {
    const ap = a.preferredStepThreeDivisionIds?.[0] || '';
    const bp = b.preferredStepThreeDivisionIds?.[0] || '';
    return ap.localeCompare(bp) || a.name.localeCompare(b.name);
  });
  for (const club of ordered) {
    const preferences = club.preferredStepThreeDivisionIds?.length
      ? club.preferredStepThreeDivisionIds
      : STEP_THREE_DIVISION_IDS;
    const available = preferences.filter(id => (capacity.get(id) || 0) > 0);
    if (!available.length) throw new Error('Step 3 feeder allocation ran out of geographic division capacity.');
    const chosen = available[0];
    capacity.set(chosen, capacity.get(chosen) - 1);
    assignments.get(chosen).push(compactClub(club, { assignedStepThreeDivisionId: chosen }));
  }
  if ([...capacity.values()].some(value => value !== 0)) throw new Error('Step 3 feeder allocation did not fill all four 22-club divisions.');
  return assignments;
}
function completeNextStepThreeMemberships(career, stepThreeOutcomes, stepFourOutcomes, baseResult) {
  if (stepThreeOutcomes.some(outcome => outcome?.status !== 'complete')) return null;
  if (stepFourOutcomes.some(outcome => outcome?.status !== 'complete' || outcome.promotedClubIds?.length !== 2)) return null;
  const sourceSeason = stepThreeOutcomes[0].season;
  const targetSeason = nextPyramidSeasonLabel(sourceSeason);
  if (!targetSeason) return null;
  const survivorsByDivision = new Map(STEP_THREE_DIVISION_IDS.map(id => {
    const outcome = stepThreeOutcomes.find(item => item.competitionId === id);
    const survivors = stepThreeSurvivors(outcome);
    if (survivors.length !== 16) throw new Error(`Step 3 ${id} requires exactly 16 survivors before feeder allocation.`);
    return [id, survivors];
  }));
  const incoming = [...stepTwoRelegatedRecords(baseResult), ...promotedStepFourRecords(stepFourOutcomes)];
  if (incoming.length !== 24) return null;
  const assignments = allocateIncomingStepThree(incoming);
  const records = {};
  for (const competitionId of STEP_THREE_DIVISION_IDS) {
    const clubs = [...survivorsByDivision.get(competitionId), ...assignments.get(competitionId)];
    if (clubs.length !== 22 || new Set(clubs.map(club => club.id)).size !== 22) {
      throw new Error(`Step 3 ${competitionId} ${targetSeason} membership must contain 22 unique clubs.`);
    }
    records[competitionId] = upsertMembership(career, {
      schemaVersion: ENGLISH_PYRAMID_WORLD_V7_VERSION,
      key: key(competitionId, targetSeason),
      competitionId,
      competitionName: STEP_THREE_NAMES[competitionId],
      season: targetSeason,
      status: 'complete',
      clubCount: 22,
      membershipSource: `${sourceSeason} cascade: 16 Step 3 survivors plus 6 clubs from the FA-style feeder pool`,
      allocationMethod: 'geographic-feeder-preference-with-fixed-22-club-capacity',
      clubs
    });
  }
  const all = STEP_THREE_DIVISION_IDS.flatMap(id => records[id].clubs);
  const aggregate = upsertMembership(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V7_VERSION,
    key: key(NATIONAL_LEAGUE_STEP_THREE_AGGREGATE_V7_ID, targetSeason),
    competitionId: NATIONAL_LEAGUE_STEP_THREE_AGGREGATE_V7_ID,
    competitionName: 'National League Step 3',
    season: targetSeason,
    status: 'complete',
    clubCount: 88,
    targetClubCount: 88,
    targetDivisionCount: 4,
    targetClubsPerDivision: 22,
    membershipSource: `${sourceSeason} cascade: 64 Step 3 survivors + 8 Step 2 relegated + 16 Step 4 promoted`,
    clubs: all,
    promotedFromStepFourClubIds: stepFourOutcomes.flatMap(outcome => outcome.promotedClubIds),
    relegatedFromStepTwoClubIds: stepTwoRelegatedRecords(baseResult).map(club => club.id),
    allocationMethod: 'geographic-feeder-preference-with-fixed-22-club-capacity'
  });
  return { divisions: records, aggregate };
}

function stepTwoSurvivors(outcome, sourceCompetitionId) {
  const leaving = new Set([...(outcome?.promotedClubIds || []), ...(outcome?.relegatedClubIds || [])]);
  return (outcome?.clubs || []).filter(club => !leaving.has(club.id)).map(club => compactClub(club, {
    geoNorthing: Number.isFinite(Number(club.geoNorthing)) ? Number(club.geoNorthing) : (sourceCompetitionId === NATIONAL_LEAGUE_NORTH_ID ? 74 : 28),
    pyramidOrigin: `${sourceCompetitionId}-survivor`
  }));
}
function relegatedNationalLeagueRecords(outcome) {
  const map = new Map((outcome?.clubs || []).map(club => [club.id, club]));
  return (outcome?.relegatedClubIds || []).map(id => {
    const club = map.get(id) || { id, name: id, strength: 57 };
    const northHint = hashString(id) % 100;
    return compactClub(club, {
      strength: clamp(Number(club.strength || 57) - 2, 50, 62),
      geoNorthing: Number.isFinite(Number(club.geoNorthing)) ? Number(club.geoNorthing) : 38 + (northHint % 31),
      pyramidOrigin: 'national-league-relegation'
    });
  });
}
function promotedStepThreeRecords(outcomes) {
  return outcomes.flatMap(outcome => {
    const map = new Map((outcome?.clubs || []).map(club => [club.id, club]));
    return (outcome?.promotedClubIds || []).map(id => {
      const club = map.get(id);
      if (!club) throw new Error('Step 3 promotion is missing club metadata.');
      const fallbackNorthing = outcome.competitionId === NORTHERN_PREMIER_ID ? 76 : outcome.competitionId === SOUTHERN_PREMIER_CENTRAL_ID ? 55 : 28;
      return compactClub(club, {
        strength: clamp(Number(club.strength || 52) + 2, 49, 60),
        geoNorthing: Number.isFinite(Number(club.geoNorthing)) ? Number(club.geoNorthing) : fallbackNorthing,
        pyramidOrigin: `${outcome.competitionId}-promotion`
      });
    });
  });
}
function allocateStepTwoGeographically(clubs) {
  if (clubs.length !== 48 || new Set(clubs.map(club => club.id)).size !== 48) {
    throw new Error('Step 2 geographic allocation requires exactly 48 unique clubs.');
  }
  const ranked = [...clubs].map(club => ({
    ...club,
    geoNorthing: Number.isFinite(Number(club.geoNorthing)) ? Number(club.geoNorthing) : 50 + (hashString(club.id) % 20)
  })).sort((a, b) => b.geoNorthing - a.geoNorthing || a.name.localeCompare(b.name));
  return { north: ranked.slice(0, 24), south: ranked.slice(24), method: 'geographic-northing-feeder-pool' };
}
function completeStepTwoMembershipsV7(career, baseResult, stepThreeOutcomes) {
  const northOutcome = baseResult?.nationalLeagueNorth?.outcome;
  const southOutcome = baseResult?.nationalLeagueSouth?.outcome;
  const nlOutcome = baseResult?.nationalLeague?.outcome;
  if (!northOutcome || northOutcome.status !== 'complete' || !southOutcome || southOutcome.status !== 'complete' || !nlOutcome || nlOutcome.status !== 'complete') return null;
  if (stepThreeOutcomes.some(outcome => outcome?.status !== 'complete' || outcome.promotedClubIds?.length !== 2)) return null;
  const sourceSeason = nlOutcome.season;
  const targetSeason = nextPyramidSeasonLabel(sourceSeason);
  if (!targetSeason) return null;
  const candidates = [
    ...stepTwoSurvivors(northOutcome, NATIONAL_LEAGUE_NORTH_ID),
    ...stepTwoSurvivors(southOutcome, NATIONAL_LEAGUE_SOUTH_ID),
    ...relegatedNationalLeagueRecords(nlOutcome),
    ...promotedStepThreeRecords(stepThreeOutcomes)
  ];
  const allocation = allocateStepTwoGeographically(candidates);
  const common = {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V7_VERSION,
    season: targetSeason,
    status: 'complete',
    clubCount: 24,
    sourceSeason,
    allocationMethod: allocation.method
  };
  const northRecord = upsertMembership(career, {
    ...common,
    key: key(NATIONAL_LEAGUE_NORTH_ID, targetSeason),
    competitionId: NATIONAL_LEAGUE_NORTH_ID,
    competitionName: 'National League North',
    membershipSource: `${sourceSeason} FA-style geographic feeder allocation`,
    clubs: allocation.north
  });
  const southRecord = upsertMembership(career, {
    ...common,
    key: key(NATIONAL_LEAGUE_SOUTH_ID, targetSeason),
    competitionId: NATIONAL_LEAGUE_SOUTH_ID,
    competitionName: 'National League South',
    membershipSource: `${sourceSeason} FA-style geographic feeder allocation`,
    clubs: allocation.south
  });
  const aggregate = upsertMembership(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V7_VERSION,
    key: key(NATIONAL_LEAGUE_STEP_TWO_AGGREGATE_ID, targetSeason),
    competitionId: NATIONAL_LEAGUE_STEP_TWO_AGGREGATE_ID,
    competitionName: 'National League Step 2',
    season: targetSeason,
    status: 'complete',
    clubCount: 48,
    targetClubCount: 48,
    targetDivisionCount: 2,
    targetClubsPerDivision: 24,
    membershipSource: `${sourceSeason} cascade: 36 Step 2 survivors + 4 National League relegated + 8 Step 3 promoted`,
    clubs: [...allocation.north, ...allocation.south],
    northClubIds: allocation.north.map(club => club.id),
    southClubIds: allocation.south.map(club => club.id),
    promotedFromStepThreeClubIds: stepThreeOutcomes.flatMap(outcome => outcome.promotedClubIds),
    relegatedFromNationalLeagueClubIds: [...nlOutcome.relegatedClubIds],
    allocationMethod: allocation.method
  });
  return { north: northRecord, south: southRecord, aggregate };
}

function stepFourSurvivors(outcome) {
  const leaving = new Set([...(outcome?.promotedClubIds || []), ...(outcome?.relegatedClubIds || [])]);
  return (outcome?.clubs || []).filter(club => !leaving.has(club.id)).map(club => compactClub(club, {
    sourceStepFourDivisionId: outcome.competitionId,
    pyramidOrigin: `${outcome.competitionId}-survivor`
  }));
}
function buildStepFiveBoundary(career, stepThreeOutcomes, stepFourOutcomes) {
  if (stepThreeOutcomes.some(outcome => outcome?.status !== 'complete') || stepFourOutcomes.some(outcome => outcome?.status !== 'complete')) return null;
  const sourceSeason = stepFourOutcomes[0].season;
  const targetSeason = nextPyramidSeasonLabel(sourceSeason);
  if (!targetSeason) return null;
  const survivors = stepFourOutcomes.flatMap(stepFourSurvivors);
  const relegated = stepThreeOutcomes.flatMap(stepThreeRelegated);
  const known = [...survivors, ...relegated];
  if (survivors.length !== 128 || relegated.length !== 16 || known.length !== 144 || new Set(known.map(club => club.id)).size !== 144) {
    throw new Error(`Step 4 ${targetSeason} boundary requires 128 survivors and 16 Step 3 relegated clubs.`);
  }
  return upsertMembership(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V7_VERSION,
    key: key(NATIONAL_LEAGUE_STEP_FOUR_AGGREGATE_ID, targetSeason),
    competitionId: NATIONAL_LEAGUE_STEP_FOUR_AGGREGATE_ID,
    competitionName: 'National League Step 4',
    season: targetSeason,
    status: 'incomplete-step-five-feeder',
    membershipSource: `${sourceSeason} Step 4 survivors plus Step 3 relegation pool; Step 5 not yet modelled`,
    clubs: known,
    clubCount: 144,
    targetClubCount: 176,
    targetDivisionCount: 8,
    targetClubsPerDivision: 22,
    stepFourSurvivorClubIds: survivors.map(club => club.id),
    relegatedFromStepThreeClubIds: relegated.map(club => club.id),
    promotedToStepThreeClubIds: stepFourOutcomes.flatMap(outcome => outcome.promotedClubIds),
    relegatedToStepFiveClubIds: stepFourOutcomes.flatMap(outcome => outcome.relegatedClubIds),
    missingPromotionSlots: 32,
    reason: `Step 4 ${targetSeason} has 144 known clubs. It still requires 32 promoted clubs from the sixteen Step 5 divisions plus FA geographic allocation across the eight Step 4 divisions.`
  });
}

function updateBoundaryV7(career, baseResult, nextStepThree, nextStepTwo, stepFiveBoundary) {
  const targetSeason = nextStepThree?.aggregate?.season || nextStepTwo?.aggregate?.season || stepFiveBoundary?.season || baseResult?.boundary?.season;
  if (!targetSeason) return baseResult?.boundary || null;
  const upper = baseResult?.boundary || {};
  const stepTwoStatus = nextStepTwo?.aggregate?.status || baseResult?.stepTwoBoundary?.status || upper.stepTwoStatus || 'unknown';
  const stepThreeStatus = nextStepThree?.aggregate?.status || upper.stepThreeStatus || 'unknown';
  const readyThroughStepThree = stepTwoStatus === 'complete' && stepThreeStatus === 'complete';
  return upsertBoundary(career, {
    schemaVersion: ENGLISH_PYRAMID_WORLD_V7_VERSION,
    key: `english-pyramid:${targetSeason}`,
    season: targetSeason,
    status: readyThroughStepThree && stepFiveBoundary ? 'step-three-ready-step-five-boundary' : (upper.status || 'blocked-by-lower-pyramid'),
    championshipStatus: upper.championshipStatus || baseResult?.membership?.status || 'unknown',
    leagueOneStatus: upper.leagueOneStatus || baseResult?.leagueOneMembership?.status || 'unknown',
    leagueTwoStatus: upper.leagueTwoStatus || baseResult?.leagueTwoMembership?.status || 'unknown',
    nationalLeagueStatus: upper.nationalLeagueStatus || baseResult?.nationalLeagueMembership?.status || 'unknown',
    stepTwoStatus,
    stepThreeStatus,
    stepFourStatus: stepFiveBoundary?.status || 'unsupported-step-five-feeder',
    reason: stepFiveBoundary?.reason || upper.reason || null
  });
}

export function finaliseEnglishPyramidBackground(career, { completedAt = null } = {}) {
  const baseResult = baseFinaliseEnglishPyramidBackground(career, { completedAt });
  if (!career || (career.competitionId || career.leagueId) !== 'eng-premier-league') {
    return { ...baseResult, stepFourDivisions: null, nextStepThreeMembership: null, stepFiveBoundary: null };
  }

  ensureState(career);
  const season = career.season || '2026/27';

  const stepThreeDivisions = Object.fromEntries(STEP_THREE_DIVISION_IDS.map(id => [
    id,
    simulateStepThreeV7(career, id, season, completedAt)
  ]));
  const stepThreeOutcomes = STEP_THREE_DIVISION_IDS.map(id => stepThreeDivisions[id].outcome);

  const stepFourDivisions = Object.fromEntries(STEP_FOUR_DIVISION_IDS.map(id => [
    id,
    simulateStepFourV7(career, id, season, completedAt)
  ]));
  const stepFourOutcomes = STEP_FOUR_DIVISION_IDS.map(id => stepFourDivisions[id].outcome);

  const nextStepTwoMembership = stepThreeOutcomes.every(outcome => outcome?.status === 'complete')
    ? completeStepTwoMembershipsV7(career, baseResult, stepThreeOutcomes)
    : null;

  const nextStepThreeMembership = stepThreeOutcomes.every(outcome => outcome?.status === 'complete') && stepFourOutcomes.every(outcome => outcome?.status === 'complete')
    ? completeNextStepThreeMemberships(career, stepThreeOutcomes, stepFourOutcomes, baseResult)
    : null;

  const stepFiveBoundary = stepThreeOutcomes.every(outcome => outcome?.status === 'complete') && stepFourOutcomes.every(outcome => outcome?.status === 'complete')
    ? buildStepFiveBoundary(career, stepThreeOutcomes, stepFourOutcomes)
    : null;

  const boundary = updateBoundaryV7(career, baseResult, nextStepThreeMembership, nextStepTwoMembership, stepFiveBoundary);

  return {
    ...baseResult,
    stepThreeDivisions,
    stepFourDivisions,
    stepThreeMembership: nextStepTwoMembership || baseResult.stepThreeMembership,
    stepTwoBoundary: nextStepTwoMembership?.aggregate || baseResult.stepTwoBoundary,
    nextStepThreeMembership,
    stepFourBoundary: nextStepThreeMembership?.aggregate || baseResult.stepFourBoundary,
    stepFiveBoundary,
    boundary
  };
}
