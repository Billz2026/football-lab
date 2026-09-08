import { createChampionshipFixtures } from './championship-world-v1.js';

export const NATIONAL_LEAGUE_WORLD_VERSION = 1;
export const NATIONAL_LEAGUE_ID = 'eng-national-league';

export const NATIONAL_LEAGUE_RULES = Object.freeze({
  id: NATIONAL_LEAGUE_ID,
  name: 'National League',
  clubCount: 24,
  automaticPromotionPlaces: 1,
  playoffPlaces: Object.freeze([2, 3, 4, 5, 6, 7]),
  relegationPlaces: 4,
  ranking: Object.freeze([
    'points',
    'goalDifference',
    'goalsFor',
    'wins',
    'headToHeadRecord',
    'decidingMatchIfRequired'
  ])
});

// Verified against The FA's National League System Step 1 allocation for 2026/27.
// Strength is an internal Football Lab background-world rating, not an FA metric.
export const NATIONAL_LEAGUE_2026_27_CLUBS = Object.freeze([
  ['afc-fylde', 'AFC Fylde', 59],
  ['aldershot-town', 'Aldershot Town', 60],
  ['altrincham', 'Altrincham', 61],
  ['barrow', 'Barrow', 63],
  ['boreham-wood', 'Boreham Wood', 62],
  ['boston-united', 'Boston United', 59],
  ['carlisle-united', 'Carlisle United', 64],
  ['eastleigh', 'Eastleigh', 60],
  ['fc-halifax-town', 'FC Halifax Town', 61],
  ['forest-green-rovers', 'Forest Green Rovers', 63],
  ['gateshead', 'Gateshead', 62],
  ['harrogate-town', 'Harrogate Town', 62],
  ['hartlepool-united', 'Hartlepool United', 61],
  ['hornchurch', 'Hornchurch', 56],
  ['kidderminster-harriers', 'Kidderminster Harriers', 58],
  ['scunthorpe-united', 'Scunthorpe United', 61],
  ['solihull-moors', 'Solihull Moors', 60],
  ['southend-united', 'Southend United', 63],
  ['sutton-united', 'Sutton United', 61],
  ['tamworth', 'Tamworth', 58],
  ['wealdstone', 'Wealdstone', 57],
  ['woking', 'Woking', 59],
  ['worthing', 'Worthing', 58],
  ['yeovil-town', 'Yeovil Town', 60]
].map(([slug, name, strength]) => Object.freeze({
  id: `eng-national-league-${slug}`,
  slug,
  name,
  strength
})));

const clone = value => JSON.parse(JSON.stringify(value));
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

function validateMembership(clubs) {
  if (!Array.isArray(clubs) || clubs.length !== NATIONAL_LEAGUE_RULES.clubCount) {
    throw new Error(`National League background simulation requires exactly ${NATIONAL_LEAGUE_RULES.clubCount} clubs.`);
  }
  const ids = clubs.map(club => club?.id).filter(Boolean);
  if (new Set(ids).size !== NATIONAL_LEAGUE_RULES.clubCount) throw new Error('National League club ids must be unique.');
  if (clubs.some(club => !Number.isFinite(Number(club.strength)))) throw new Error('Every National League club requires a numeric background strength.');
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
  const difference = clamp(((Number(home.strength) + 2.35) - Number(away.strength)) / 16.5, -1.35, 1.35);
  return {
    ...fixture,
    played: true,
    homeGoals: poisson(clamp(1.42 + difference, 0.28, 3.3), random),
    awayGoals: poisson(clamp(1.08 - difference, 0.22, 2.9), random)
  };
}

function applyLeagueResult(table, result) {
  const home = table.find(row => row.clubId === result.homeClubId);
  const away = table.find(row => row.clubId === result.awayClubId);
  home.played += 1;
  away.played += 1;
  home.goalsFor += result.homeGoals;
  home.goalsAgainst += result.awayGoals;
  away.goalsFor += result.awayGoals;
  away.goalsAgainst += result.homeGoals;
  if (result.homeGoals > result.awayGoals) {
    home.won += 1;
    home.points += 3;
    away.lost += 1;
  } else if (result.homeGoals < result.awayGoals) {
    away.won += 1;
    away.points += 3;
    home.lost += 1;
  } else {
    home.drawn += 1;
    away.drawn += 1;
    home.points += 1;
    away.points += 1;
  }
  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;
}

function playedFixtures(fixtures) {
  return (fixtures || []).flat().filter(fixture => fixture?.played && Number.isFinite(Number(fixture.homeGoals)) && Number.isFinite(Number(fixture.awayGoals)));
}

function headToHeadRecord(clubIds, fixtures) {
  const wanted = new Set(clubIds);
  const stats = Object.fromEntries(clubIds.map(clubId => [clubId, { points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 }]));
  for (const fixture of playedFixtures(fixtures)) {
    if (!wanted.has(fixture.homeClubId) || !wanted.has(fixture.awayClubId)) continue;
    const home = stats[fixture.homeClubId];
    const away = stats[fixture.awayClubId];
    const hg = Number(fixture.homeGoals);
    const ag = Number(fixture.awayGoals);
    home.goalsFor += hg;
    home.goalsAgainst += ag;
    away.goalsFor += ag;
    away.goalsAgainst += hg;
    if (hg > ag) home.points += 3;
    else if (hg < ag) away.points += 3;
    else {
      home.points += 1;
      away.points += 1;
    }
  }
  for (const value of Object.values(stats)) value.goalDifference = value.goalsFor - value.goalsAgainst;
  return stats;
}

function baseCompare(a, b) {
  return Number(b.points) - Number(a.points) ||
    Number(b.goalDifference) - Number(a.goalDifference) ||
    Number(b.goalsFor) - Number(a.goalsFor) ||
    Number(b.won) - Number(a.won);
}

function sameBase(a, b) {
  return Number(a.points) === Number(b.points) &&
    Number(a.goalDifference) === Number(b.goalDifference) &&
    Number(a.goalsFor) === Number(b.goalsFor) &&
    Number(a.won) === Number(b.won);
}

function consequencesForRange(startPosition, endPosition) {
  const consequences = [];
  if (startPosition <= 1 && endPosition > 1) consequences.push('automatic-promotion');
  if (startPosition <= 7 && endPosition > 7) consequences.push('playoff-qualification');
  if (startPosition <= 20 && endPosition > 20) consequences.push('relegation');
  for (const seedBoundary of [2, 3, 4, 5, 6]) {
    if (startPosition <= seedBoundary && endPosition > seedBoundary) {
      consequences.push('playoff-seeding');
      break;
    }
  }
  return consequences;
}

export function rankNationalLeagueTable(table, fixtures, { seed = 'national-league-ranking' } = {}) {
  const baseSorted = [...table].sort(baseCompare);
  const groups = [];
  for (const row of baseSorted) {
    const current = groups.at(-1);
    if (current && sameBase(current[0], row)) current.push(row);
    else groups.push([row]);
  }

  const rows = [];
  const unresolvedGroups = [];
  const administrativeResolutions = [];
  for (const group of groups) {
    if (group.length === 1) {
      rows.push({ ...clone(group[0]), position: rows.length + 1 });
      continue;
    }
    const h2h = headToHeadRecord(group.map(row => row.clubId), fixtures);
    let ranked = group.map(row => ({ row, h2h: h2h[row.clubId] })).sort((a, b) =>
      b.h2h.points - a.h2h.points ||
      b.h2h.goalDifference - a.h2h.goalDifference ||
      b.h2h.goalsFor - a.h2h.goalsFor
    );

    let index = 0;
    while (index < ranked.length) {
      const first = ranked[index];
      const equalMetrics = item => item.h2h.points === first.h2h.points &&
        item.h2h.goalDifference === first.h2h.goalDifference &&
        item.h2h.goalsFor === first.h2h.goalsFor;
      let end = index + 1;
      while (end < ranked.length && equalMetrics(ranked[end])) end += 1;
      let tied = ranked.slice(index, end);
      const startPosition = rows.length + 1;
      const endPosition = startPosition + tied.length - 1;
      const consequences = tied.length > 1 ? consequencesForRange(startPosition, endPosition) : [];
      const decidingMatchRequired = tied.length > 1 && consequences.length > 0;
      if (tied.length > 1 && !decidingMatchRequired) {
        tied = tied.sort((a, b) => hashString(`${seed}:${a.row.clubId}`) - hashString(`${seed}:${b.row.clubId}`) || String(a.row.clubId).localeCompare(String(b.row.clubId)));
        administrativeResolutions.push({
          clubIds: tied.map(item => item.row.clubId),
          positions: [startPosition, endPosition],
          consequences,
          method: 'simulated-administrative-lot'
        });
      }
      for (const item of tied) {
        rows.push({
          ...clone(item.row),
          position: rows.length + 1,
          tiebreak: {
            headToHeadPoints: item.h2h.points,
            headToHeadGoalDifference: item.h2h.goalDifference,
            headToHeadGoalsFor: item.h2h.goalsFor,
            unresolved: decidingMatchRequired
          }
        });
      }
      if (decidingMatchRequired) {
        unresolvedGroups.push({
          clubIds: tied.map(item => item.row.clubId),
          positions: [startPosition, endPosition],
          consequences,
          method: 'deciding-league-match-required'
        });
      }
      index = end;
    }
  }
  return { rows, unresolvedGroups, administrativeResolutions, decidingMatchRequired: unresolvedGroups.length > 0 };
}

function simulateKnockout90(homeClub, awayClub, seed, { neutral = false } = {}) {
  const random = seededRandom(seed);
  const homeStrength = Number(homeClub.strength) + (neutral ? 0 : 2.0);
  const awayStrength = Number(awayClub.strength);
  const difference = clamp((homeStrength - awayStrength) / 17.5, -1.2, 1.2);
  return {
    homeGoals: poisson(clamp(1.34 + difference, 0.24, 3.0), random),
    awayGoals: poisson(clamp(1.05 - difference, 0.22, 2.75), random)
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

function simulateOneOff(homeClub, awayClub, seed, { neutral = false, venue = null } = {}) {
  const score = simulateKnockout90(homeClub, awayClub, `${seed}:90`, { neutral });
  const resolution = resolveKnockout(homeClub, awayClub, seed, score);
  return {
    homeClubId: homeClub.id,
    awayClubId: awayClub.id,
    neutral,
    venue,
    ...score,
    resolution,
    winnerClubId: resolution.winnerClubId
  };
}

export function simulateNationalLeagueSeason({
  seed = 'football-lab-national-league',
  season = '2026/27',
  clubs = NATIONAL_LEAGUE_2026_27_CLUBS,
  completedAt = null
} = {}) {
  validateMembership(clubs);
  const clubMap = new Map(clubs.map(club => [club.id, club]));
  const fixtures = createChampionshipFixtures(clubs).map((round, roundIndex) => round.map((fixture, matchIndex) =>
    simulateLeagueFixture({ ...fixture, id: `nl-mw${roundIndex + 1}-m${matchIndex + 1}` }, clubMap, `${seed}:${season}`)
  ));
  const table = blankTable(clubs);
  fixtures.flat().forEach(result => applyLeagueResult(table, result));
  const ranking = rankNationalLeagueTable(table, fixtures, { seed: `${seed}:${season}:ranking` });

  const compactBase = {
    schemaVersion: NATIONAL_LEAGUE_WORLD_VERSION,
    key: `${NATIONAL_LEAGUE_ID}:${season}`,
    competitionId: NATIONAL_LEAGUE_ID,
    competitionName: NATIONAL_LEAGUE_RULES.name,
    season,
    completedAt,
    membershipSource: season === '2026/27' ? '2026/27 verified FA National League Step 1 allocation' : 'derived English pyramid membership',
    clubs: clubs.map(({ id, name, slug, strength }) => ({ id, name, slug, strength })),
    clubCount: clubs.length,
    regularSeasonMatches: fixtures.flat().length,
    rankingRules: [...NATIONAL_LEAGUE_RULES.ranking],
    finalTable: ranking.rows,
    rankingResolution: {
      decidingMatchRequired: ranking.decidingMatchRequired,
      unresolvedGroups: ranking.unresolvedGroups,
      administrativeResolutions: ranking.administrativeResolutions
    }
  };

  if (ranking.decidingMatchRequired) {
    return {
      ...compactBase,
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

  const eliminatorA = simulateOneOff(fifth, sixth, `${seed}:${season}:po-5v6`);
  const eliminatorB = simulateOneOff(fourth, seventh, `${seed}:${season}:po-4v7`);
  const semiFinalA = simulateOneOff(second, byId(eliminatorA.winnerClubId), `${seed}:${season}:po-2vA`);
  const semiFinalB = simulateOneOff(third, byId(eliminatorB.winnerClubId), `${seed}:${season}:po-3vB`);
  const final = simulateOneOff(byId(semiFinalA.winnerClubId), byId(semiFinalB.winnerClubId), `${seed}:${season}:po-final`, { neutral: true, venue: 'Wembley Stadium' });
  const playoffWinnerClubId = final.winnerClubId;
  const relegatedClubIds = ranking.rows.slice(-4).map(row => row.clubId);

  return {
    ...compactBase,
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
