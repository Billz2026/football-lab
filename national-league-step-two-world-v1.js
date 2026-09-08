import { createChampionshipFixtures } from './championship-world-v1.js';
import { rankNationalLeagueTable } from './national-league-world-v1.js';

export const NATIONAL_LEAGUE_STEP_TWO_WORLD_VERSION = 1;
export const NATIONAL_LEAGUE_NORTH_ID = 'eng-national-league-north';
export const NATIONAL_LEAGUE_SOUTH_ID = 'eng-national-league-south';

export const NATIONAL_LEAGUE_STEP_TWO_RULES = Object.freeze({
  clubCount: 24,
  automaticPromotionPlaces: 1,
  playoffPlaces: Object.freeze([2, 3, 4, 5, 6, 7]),
  relegationPlaces: 4,
  playoffFormat: 'single-leg-higher-placed-club-home',
  ranking: Object.freeze([
    'points',
    'goalDifference',
    'goalsFor',
    'wins',
    'headToHeadRecord',
    'decidingMatchIfRequired'
  ])
});

// Verified against The FA's National League System Step 2 allocation for 2026/27.
// Strength is an internal Football Lab background-world rating, not an FA metric.
export const NATIONAL_LEAGUE_NORTH_2026_27_CLUBS = Object.freeze([
  ['afc-telford-united', 'AFC Telford United', 57],
  ['bedford-town', 'Bedford Town', 55],
  ['brackley-town', 'Brackley Town', 60],
  ['buxton', 'Buxton', 57],
  ['chester', 'Chester', 59],
  ['chorley', 'Chorley', 58],
  ['darlington', 'Darlington', 56],
  ['harborough-town', 'Harborough Town', 54],
  ['hebburn-town', 'Hebburn Town', 53],
  ['hednesford-town', 'Hednesford Town', 54],
  ['hereford', 'Hereford', 57],
  ['kings-lynn-town', "King's Lynn Town", 57],
  ['macclesfield', 'Macclesfield', 59],
  ['marine', 'Marine', 55],
  ['merthyr-town', 'Merthyr Town', 57],
  ['morecambe', 'Morecambe', 60],
  ['oxford-city', 'Oxford City', 56],
  ['radcliffe', 'Radcliffe', 55],
  ['scarborough-athletic', 'Scarborough Athletic', 55],
  ['southport', 'Southport', 55],
  ['south-shields', 'South Shields', 58],
  ['spalding-united', 'Spalding United', 53],
  ['spennymoor-town', 'Spennymoor Town', 57],
  ['worksop-town', 'Worksop Town', 55]
].map(([slug, name, strength]) => Object.freeze({
  id: `${NATIONAL_LEAGUE_NORTH_ID}-${slug}`,
  slug,
  name,
  strength
})));

export const NATIONAL_LEAGUE_SOUTH_2026_27_CLUBS = Object.freeze([
  ['afc-totton', 'AFC Totton', 55],
  ['billericay-town', 'Billericay Town', 56],
  ['braintree-town', 'Braintree Town', 59],
  ['chelmsford-city', 'Chelmsford City', 57],
  ['chesham-united', 'Chesham United', 55],
  ['dagenham-redbridge', 'Dagenham & Redbridge', 58],
  ['dorking-wanderers', 'Dorking Wanderers', 59],
  ['dover-athletic', 'Dover Athletic', 56],
  ['ebbsfleet-united', 'Ebbsfleet United', 58],
  ['farnborough', 'Farnborough', 56],
  ['farnham-town', 'Farnham Town', 53],
  ['folkestone-invicta', 'Folkestone Invicta', 54],
  ['hampton-richmond-borough', 'Hampton & Richmond Borough', 55],
  ['hemel-hempstead-town', 'Hemel Hempstead Town', 55],
  ['horsham', 'Horsham', 56],
  ['maidenhead-united', 'Maidenhead United', 58],
  ['maidstone-united', 'Maidstone United', 59],
  ['salisbury', 'Salisbury', 54],
  ['slough-town', 'Slough Town', 55],
  ['tonbridge-angels', 'Tonbridge Angels', 55],
  ['torquay-united', 'Torquay United', 60],
  ['truro-city', 'Truro City', 59],
  ['walton-hersham', 'Walton & Hersham', 53],
  ['weston-super-mare', 'Weston-super-Mare', 57]
].map(([slug, name, strength]) => Object.freeze({
  id: `${NATIONAL_LEAGUE_SOUTH_ID}-${slug}`,
  slug,
  name,
  strength
})));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = hashString(seed) || 1;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function poisson(lambda, random) {
  const limit = Math.exp(-lambda);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > limit && count < 10);
  return clamp(count - 1, 0, 7);
}

function validateMembership(clubs, competitionName) {
  if (!Array.isArray(clubs) || clubs.length !== NATIONAL_LEAGUE_STEP_TWO_RULES.clubCount) {
    throw new Error(`${competitionName} background simulation requires exactly 24 clubs.`);
  }
  const ids = clubs.map(club => club?.id).filter(Boolean);
  if (new Set(ids).size !== 24) throw new Error(`${competitionName} club ids must be unique.`);
  if (clubs.some(club => !Number.isFinite(Number(club.strength)))) throw new Error(`Every ${competitionName} club requires a numeric background strength.`);
}

function blankTable(clubs) {
  return clubs.map(club => ({
    clubId: club.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  }));
}

function simulateLeagueFixture(fixture, clubMap, seed) {
  const random = seededRandom(`${seed}:${fixture.id}`);
  const home = clubMap.get(fixture.homeClubId);
  const away = clubMap.get(fixture.awayClubId);
  const difference = clamp(((Number(home.strength) + 2.4) - Number(away.strength)) / 16, -1.35, 1.35);
  return {
    ...fixture,
    played: true,
    homeGoals: poisson(clamp(1.44 + difference, 0.28, 3.3), random),
    awayGoals: poisson(clamp(1.06 - difference, 0.22, 2.9), random)
  };
}

function applyLeagueResult(table, result) {
  const home = table.find(row => row.clubId === result.homeClubId);
  const away = table.find(row => row.clubId === result.awayClubId);
  home.played += 1; away.played += 1;
  home.goalsFor += result.homeGoals; home.goalsAgainst += result.awayGoals;
  away.goalsFor += result.awayGoals; away.goalsAgainst += result.homeGoals;
  if (result.homeGoals > result.awayGoals) {
    home.won += 1; home.points += 3; away.lost += 1;
  } else if (result.homeGoals < result.awayGoals) {
    away.won += 1; away.points += 3; home.lost += 1;
  } else {
    home.drawn += 1; away.drawn += 1; home.points += 1; away.points += 1;
  }
  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;
}

function simulateKnockout90(homeClub, awayClub, seed) {
  const random = seededRandom(seed);
  const difference = clamp(((Number(homeClub.strength) + 2.0) - Number(awayClub.strength)) / 17, -1.2, 1.2);
  return {
    homeGoals: poisson(clamp(1.36 + difference, 0.24, 3.0), random),
    awayGoals: poisson(clamp(1.04 - difference, 0.22, 2.75), random)
  };
}

function resolveKnockout(homeClub, awayClub, seed, score) {
  if (score.homeGoals !== score.awayGoals) {
    return { winnerClubId: score.homeGoals > score.awayGoals ? homeClub.id : awayClub.id, method: '90-minutes', extraTime: null, penalties: null };
  }
  const random = seededRandom(`${seed}:extra-time`);
  const difference = clamp((Number(homeClub.strength) - Number(awayClub.strength)) / 25, -0.6, 0.6);
  const extraHome = poisson(clamp(0.31 + difference, 0.08, 0.68), random);
  const extraAway = poisson(clamp(0.27 - difference, 0.08, 0.63), random);
  if (extraHome !== extraAway) {
    return {
      winnerClubId: extraHome > extraAway ? homeClub.id : awayClub.id,
      method: 'extra-time',
      extraTime: { homeGoals: extraHome, awayGoals: extraAway },
      penalties: null
    };
  }
  const penaltyRandom = seededRandom(`${seed}:penalties`);
  const homeChance = clamp(0.5 + (Number(homeClub.strength) - Number(awayClub.strength)) / 300, 0.43, 0.57);
  const winnerClubId = penaltyRandom() < homeChance ? homeClub.id : awayClub.id;
  const loserScore = 3 + Math.floor(penaltyRandom() * 3);
  return {
    winnerClubId,
    method: 'penalties',
    extraTime: { homeGoals: extraHome, awayGoals: extraAway },
    penalties: winnerClubId === homeClub.id ? { home: loserScore + 1, away: loserScore } : { home: loserScore, away: loserScore + 1 }
  };
}

function simulateOneOff(homeClub, awayClub, seed, metadata = {}) {
  const score = simulateKnockout90(homeClub, awayClub, `${seed}:90`);
  const resolution = resolveKnockout(homeClub, awayClub, seed, score);
  return {
    homeClubId: homeClub.id,
    awayClubId: awayClub.id,
    neutral: false,
    ...metadata,
    ...score,
    resolution,
    winnerClubId: resolution.winnerClubId
  };
}

export function simulateNationalLeagueStepTwoDivisionSeason({
  competitionId,
  competitionName,
  seed = 'football-lab-national-league-step-two',
  season = '2026/27',
  clubs,
  completedAt = null
} = {}) {
  if (![NATIONAL_LEAGUE_NORTH_ID, NATIONAL_LEAGUE_SOUTH_ID].includes(competitionId)) throw new Error('Unsupported National League Step 2 division.');
  validateMembership(clubs, competitionName);
  const clubMap = new Map(clubs.map(club => [club.id, club]));
  const fixturePrefix = competitionId === NATIONAL_LEAGUE_NORTH_ID ? 'nln' : 'nls';
  const fixtures = createChampionshipFixtures(clubs).map((round, roundIndex) => round.map((fixture, matchIndex) =>
    simulateLeagueFixture({ ...fixture, id: `${fixturePrefix}-mw${roundIndex + 1}-m${matchIndex + 1}` }, clubMap, `${seed}:${season}:${competitionId}`)
  ));
  const table = blankTable(clubs);
  fixtures.flat().forEach(result => applyLeagueResult(table, result));
  const ranking = rankNationalLeagueTable(table, fixtures, { seed: `${seed}:${season}:${competitionId}:ranking` });

  const base = {
    schemaVersion: NATIONAL_LEAGUE_STEP_TWO_WORLD_VERSION,
    key: `${competitionId}:${season}`,
    competitionId,
    competitionName,
    season,
    completedAt,
    membershipSource: season === '2026/27' ? `2026/27 verified FA ${competitionName} Step 2 allocation` : 'derived English pyramid membership',
    clubs: clubs.map(({ id, name, slug, strength }) => ({ id, name, slug, strength })),
    clubCount: clubs.length,
    regularSeasonMatches: fixtures.flat().length,
    rankingRules: [...NATIONAL_LEAGUE_STEP_TWO_RULES.ranking],
    finalTable: ranking.rows,
    rankingResolution: {
      decidingMatchRequired: ranking.decidingMatchRequired,
      unresolvedGroups: ranking.unresolvedGroups,
      administrativeResolutions: ranking.administrativeResolutions
    }
  };

  if (ranking.decidingMatchRequired) {
    return {
      ...base,
      status: 'resolution-required',
      championClubId: ranking.rows[0]?.clubId || null,
      automaticPromotionClubIds: [],
      playoffClubIds: [],
      playoffWinnerClubId: null,
      promotedClubIds: [],
      relegatedClubIds: [],
      playoffs: null
    };
  }

  const championClubId = ranking.rows[0].clubId;
  const playoffRows = ranking.rows.slice(1, 7);
  const byId = id => clubMap.get(id);
  const second = byId(playoffRows[0].clubId);
  const third = byId(playoffRows[1].clubId);
  const fourth = byId(playoffRows[2].clubId);
  const fifth = byId(playoffRows[3].clubId);
  const sixth = byId(playoffRows[4].clubId);
  const seventh = byId(playoffRows[5].clubId);

  const eliminatorA = simulateOneOff(fifth, sixth, `${seed}:${season}:${competitionId}:po-5v6`, { round: 'eliminator-a' });
  const eliminatorB = simulateOneOff(fourth, seventh, `${seed}:${season}:${competitionId}:po-4v7`, { round: 'eliminator-b' });
  const semiFinalA = simulateOneOff(second, byId(eliminatorA.winnerClubId), `${seed}:${season}:${competitionId}:po-2vA`, { round: 'semi-final-a' });
  const semiFinalB = simulateOneOff(third, byId(eliminatorB.winnerClubId), `${seed}:${season}:${competitionId}:po-3vB`, { round: 'semi-final-b' });

  const positionById = new Map(ranking.rows.map(row => [row.clubId, row.position]));
  const finalistA = byId(semiFinalA.winnerClubId);
  const finalistB = byId(semiFinalB.winnerClubId);
  const higherFinalist = positionById.get(finalistA.id) < positionById.get(finalistB.id) ? finalistA : finalistB;
  const lowerFinalist = higherFinalist.id === finalistA.id ? finalistB : finalistA;
  const final = simulateOneOff(higherFinalist, lowerFinalist, `${seed}:${season}:${competitionId}:po-final`, {
    round: 'promotion-final',
    hostClubId: higherFinalist.id,
    venueRule: 'ground-of-higher-placed-club'
  });

  const playoffWinnerClubId = final.winnerClubId;
  const relegatedClubIds = ranking.rows.slice(-4).map(row => row.clubId);
  return {
    ...base,
    status: 'complete',
    championClubId,
    runnerUpClubId: ranking.rows[1]?.clubId || null,
    automaticPromotionClubIds: [championClubId],
    playoffClubIds: playoffRows.map(row => row.clubId),
    playoffWinnerClubId,
    promotedClubIds: [championClubId, playoffWinnerClubId],
    relegatedClubIds,
    playoffs: {
      eliminators: [eliminatorA, eliminatorB],
      semiFinals: [semiFinalA, semiFinalB],
      final
    }
  };
}

export function simulateNationalLeagueNorthSeason(options = {}) {
  return simulateNationalLeagueStepTwoDivisionSeason({
    competitionId: NATIONAL_LEAGUE_NORTH_ID,
    competitionName: 'National League North',
    clubs: NATIONAL_LEAGUE_NORTH_2026_27_CLUBS,
    ...options
  });
}

export function simulateNationalLeagueSouthSeason(options = {}) {
  return simulateNationalLeagueStepTwoDivisionSeason({
    competitionId: NATIONAL_LEAGUE_SOUTH_ID,
    competitionName: 'National League South',
    clubs: NATIONAL_LEAGUE_SOUTH_2026_27_CLUBS,
    ...options
  });
}
