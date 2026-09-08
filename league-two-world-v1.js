import { createChampionshipFixtures } from './championship-world-v1.js';

export const LEAGUE_TWO_WORLD_VERSION = 1;
export const LEAGUE_TWO_ID = 'eng-league-two';

export const LEAGUE_TWO_RULES = Object.freeze({
  id: LEAGUE_TWO_ID,
  name: 'League Two',
  clubCount: 24,
  automaticPromotionPlaces: 3,
  playoffPlaces: Object.freeze([4, 5, 6, 7]),
  relegationPlaces: 2,
  ranking: Object.freeze([
    'points',
    'goalDifference',
    'goalsFor',
    'headToHeadPoints',
    'headToHeadGoalDifference',
    'headToHeadGoalsFor',
    'wins',
    'awayGoals',
    'disciplinePenaltyPoints',
    'severeSendingOffs'
  ])
});

// Verified against the EFL's published 2026/27 League Two field.
// Strength is an internal Football Lab background rating, not an EFL metric.
export const LEAGUE_TWO_2026_27_CLUBS = Object.freeze([
  ['accrington-stanley', 'Accrington Stanley', 61],
  ['barnet', 'Barnet', 65],
  ['bristol-rovers', 'Bristol Rovers', 66],
  ['cheltenham-town', 'Cheltenham Town', 63],
  ['chesterfield', 'Chesterfield', 66],
  ['colchester-united', 'Colchester United', 64],
  ['crawley-town', 'Crawley Town', 62],
  ['crewe-alexandra', 'Crewe Alexandra', 64],
  ['exeter-city', 'Exeter City', 65],
  ['fleetwood-town', 'Fleetwood Town', 63],
  ['gillingham', 'Gillingham', 63],
  ['grimsby-town', 'Grimsby Town', 64],
  ['newport-county', 'Newport County', 61],
  ['northampton-town', 'Northampton Town', 65],
  ['oldham-athletic', 'Oldham Athletic', 63],
  ['port-vale', 'Port Vale', 65],
  ['rochdale', 'Rochdale', 61],
  ['rotherham-united', 'Rotherham United', 67],
  ['salford-city', 'Salford City', 66],
  ['shrewsbury-town', 'Shrewsbury Town', 64],
  ['swindon-town', 'Swindon Town', 66],
  ['tranmere-rovers', 'Tranmere Rovers', 63],
  ['walsall', 'Walsall', 67],
  ['york-city', 'York City', 65]
].map(([slug, name, strength]) => Object.freeze({
  id: `eng-league-two-${slug}`,
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
  if (!Array.isArray(clubs) || clubs.length !== LEAGUE_TWO_RULES.clubCount) {
    throw new Error(`League Two background simulation requires exactly ${LEAGUE_TWO_RULES.clubCount} clubs.`);
  }
  const ids = clubs.map(club => club?.id).filter(Boolean);
  if (new Set(ids).size !== LEAGUE_TWO_RULES.clubCount) throw new Error('League Two club ids must be unique.');
  if (clubs.some(club => !Number.isFinite(Number(club.strength)))) throw new Error('Every League Two club requires a numeric background strength.');
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
    points: 0,
    awayGoals: 0,
    disciplinePenaltyPoints: 0,
    severeSendingOffs: 0
  }));
}

function discipline(random) {
  const yellows = 1 + Math.floor(random() * 4) + (random() < 0.18 ? 1 : 0);
  let sendingOffPoints = 0;
  let severeSendingOffs = 0;
  if (random() < 0.055) {
    const severe = random() < 0.48;
    sendingOffPoints = severe ? 12 : 10;
    severeSendingOffs = severe ? 1 : 0;
  }
  return { penaltyPoints: yellows * 4 + sendingOffPoints, severeSendingOffs };
}

function simulateLeagueFixture(fixture, clubMap, seed) {
  const random = seededRandom(`${seed}:${fixture.id}`);
  const home = clubMap.get(fixture.homeClubId);
  const away = clubMap.get(fixture.awayClubId);
  const difference = clamp(((Number(home.strength) + 2.2) - Number(away.strength)) / 17, -1.35, 1.35);
  const homeExpected = clamp(1.38 + difference, 0.28, 3.25);
  const awayExpected = clamp(1.10 - difference, 0.22, 2.95);
  const homeDiscipline = discipline(random);
  const awayDiscipline = discipline(random);
  return {
    ...fixture,
    played: true,
    homeGoals: poisson(homeExpected, random),
    awayGoals: poisson(awayExpected, random),
    homePenaltyPoints: homeDiscipline.penaltyPoints,
    awayPenaltyPoints: awayDiscipline.penaltyPoints,
    homeSevereSendingOffs: homeDiscipline.severeSendingOffs,
    awaySevereSendingOffs: awayDiscipline.severeSendingOffs
  };
}

function applyLeagueResult(table, result) {
  const home = table.find(row => row.clubId === result.homeClubId);
  const away = table.find(row => row.clubId === result.awayClubId);
  home.played += 1; away.played += 1;
  home.goalsFor += result.homeGoals; home.goalsAgainst += result.awayGoals;
  away.goalsFor += result.awayGoals; away.goalsAgainst += result.homeGoals;
  away.awayGoals += result.awayGoals;
  home.disciplinePenaltyPoints += Number(result.homePenaltyPoints || 0);
  away.disciplinePenaltyPoints += Number(result.awayPenaltyPoints || 0);
  home.severeSendingOffs += Number(result.homeSevereSendingOffs || 0);
  away.severeSendingOffs += Number(result.awaySevereSendingOffs || 0);
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

function playedFixtures(fixtures) {
  return (fixtures || []).flat().filter(fixture => fixture?.played && Number.isFinite(Number(fixture.homeGoals)) && Number.isFinite(Number(fixture.awayGoals)));
}

function h2hStats(clubIds, fixtures) {
  const wanted = new Set(clubIds);
  const stats = Object.fromEntries(clubIds.map(clubId => [clubId, { points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 }]));
  for (const fixture of playedFixtures(fixtures)) {
    if (!wanted.has(fixture.homeClubId) || !wanted.has(fixture.awayClubId)) continue;
    const home = stats[fixture.homeClubId];
    const away = stats[fixture.awayClubId];
    const hg = Number(fixture.homeGoals);
    const ag = Number(fixture.awayGoals);
    home.goalsFor += hg; home.goalsAgainst += ag;
    away.goalsFor += ag; away.goalsAgainst += hg;
    if (hg > ag) home.points += 3;
    else if (hg < ag) away.points += 3;
    else { home.points += 1; away.points += 1; }
  }
  for (const value of Object.values(stats)) value.goalDifference = value.goalsFor - value.goalsAgainst;
  return stats;
}

function baseCompare(a, b) {
  return Number(b.points) - Number(a.points) || Number(b.goalDifference) - Number(a.goalDifference) || Number(b.goalsFor) - Number(a.goalsFor);
}

function sameBase(a, b) {
  return Number(a.points) === Number(b.points) && Number(a.goalDifference) === Number(b.goalDifference) && Number(a.goalsFor) === Number(b.goalsFor);
}

function consequencesForRange(startPosition, endPosition) {
  const consequences = [];
  const automaticBoundary = LEAGUE_TWO_RULES.automaticPromotionPlaces;
  const playoffBoundary = Math.max(...LEAGUE_TWO_RULES.playoffPlaces);
  const lastSafe = LEAGUE_TWO_RULES.clubCount - LEAGUE_TWO_RULES.relegationPlaces;
  if (startPosition <= automaticBoundary && endPosition > automaticBoundary) consequences.push('automatic-promotion');
  if (startPosition <= playoffBoundary && endPosition > playoffBoundary) consequences.push('playoff-qualification');
  if (startPosition <= lastSafe && endPosition > lastSafe) consequences.push('relegation');
  return consequences;
}

export function rankLeagueTwoTable(table, fixtures, { seed = 'league-two-ranking' } = {}) {
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
    const h2h = h2hStats(group.map(row => row.clubId), fixtures);
    const ranked = group.map(row => ({ row, h2h: h2h[row.clubId] })).sort((a, b) =>
      b.h2h.points - a.h2h.points ||
      b.h2h.goalDifference - a.h2h.goalDifference ||
      b.h2h.goalsFor - a.h2h.goalsFor ||
      Number(b.row.won || 0) - Number(a.row.won || 0) ||
      Number(b.row.awayGoals || 0) - Number(a.row.awayGoals || 0) ||
      Number(a.row.disciplinePenaltyPoints || 0) - Number(b.row.disciplinePenaltyPoints || 0) ||
      Number(a.row.severeSendingOffs || 0) - Number(b.row.severeSendingOffs || 0)
    );

    let index = 0;
    while (index < ranked.length) {
      const first = ranked[index];
      const equalMetrics = item => item.h2h.points === first.h2h.points &&
        item.h2h.goalDifference === first.h2h.goalDifference &&
        item.h2h.goalsFor === first.h2h.goalsFor &&
        Number(item.row.won || 0) === Number(first.row.won || 0) &&
        Number(item.row.awayGoals || 0) === Number(first.row.awayGoals || 0) &&
        Number(item.row.disciplinePenaltyPoints || 0) === Number(first.row.disciplinePenaltyPoints || 0) &&
        Number(item.row.severeSendingOffs || 0) === Number(first.row.severeSendingOffs || 0);
      let end = index + 1;
      while (end < ranked.length && equalMetrics(ranked[end])) end += 1;
      let tied = ranked.slice(index, end);
      const startPosition = rows.length + 1;
      const endPosition = startPosition + tied.length - 1;
      const consequences = tied.length > 1 ? consequencesForRange(startPosition, endPosition) : [];
      const decidingMatchRequired = consequences.includes('automatic-promotion') || consequences.includes('relegation');
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
            wins: Number(item.row.won || 0),
            awayGoals: Number(item.row.awayGoals || 0),
            disciplinePenaltyPoints: Number(item.row.disciplinePenaltyPoints || 0),
            severeSendingOffs: Number(item.row.severeSendingOffs || 0),
            unresolved: decidingMatchRequired && tied.length > 1
          }
        });
      }
      if (decidingMatchRequired && tied.length > 1) {
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
  const homeStrength = Number(homeClub.strength) + (neutral ? 0 : 1.9);
  const awayStrength = Number(awayClub.strength);
  const difference = clamp((homeStrength - awayStrength) / 18, -1.2, 1.2);
  return {
    homeGoals: poisson(clamp(1.31 + difference, 0.24, 3.0), random),
    awayGoals: poisson(clamp(1.07 - difference, 0.22, 2.75), random)
  };
}

function resolveLevel(homeClub, awayClub, seed, homeGoals, awayGoals) {
  if (homeGoals !== awayGoals) return { winnerClubId: homeGoals > awayGoals ? homeClub.id : awayClub.id, method: '90-minutes', extraTime: null, penalties: null };
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

function simulateSemiFinal(higher, lower, seed) {
  const firstLeg = simulateKnockout90(lower, higher, `${seed}:leg1`);
  const secondLeg = simulateKnockout90(higher, lower, `${seed}:leg2`);
  const higherAggregate = firstLeg.awayGoals + secondLeg.homeGoals;
  const lowerAggregate = firstLeg.homeGoals + secondLeg.awayGoals;
  const resolution = higherAggregate === lowerAggregate ? resolveLevel(higher, lower, `${seed}:leg2`, 0, 0) : null;
  const winnerClubId = higherAggregate > lowerAggregate ? higher.id : lowerAggregate > higherAggregate ? lower.id : resolution.winnerClubId;
  return {
    higherSeedClubId: higher.id,
    lowerSeedClubId: lower.id,
    firstLeg: { homeClubId: lower.id, awayClubId: higher.id, ...firstLeg },
    secondLeg: { homeClubId: higher.id, awayClubId: lower.id, ...secondLeg },
    aggregate: { higherSeedGoals: higherAggregate, lowerSeedGoals: lowerAggregate },
    resolution: resolution || { winnerClubId, method: 'aggregate', extraTime: null, penalties: null },
    winnerClubId
  };
}

function simulatePlayoffFinal(firstClub, secondClub, seed) {
  const score = simulateKnockout90(firstClub, secondClub, `${seed}:90`, { neutral: true });
  const resolution = resolveLevel(firstClub, secondClub, seed, score.homeGoals, score.awayGoals);
  return {
    venue: 'Wembley Stadium',
    neutral: true,
    homeClubId: firstClub.id,
    awayClubId: secondClub.id,
    ...score,
    resolution,
    winnerClubId: resolution.winnerClubId
  };
}

export function simulateLeagueTwoSeason({
  seed = 'football-lab-league-two',
  season = '2026/27',
  clubs = LEAGUE_TWO_2026_27_CLUBS,
  completedAt = null
} = {}) {
  validateMembership(clubs);
  const clubMap = new Map(clubs.map(club => [club.id, club]));
  const fixtures = createChampionshipFixtures(clubs).map((round, roundIndex) => round.map((fixture, matchIndex) =>
    simulateLeagueFixture({ ...fixture, id: `l2-mw${roundIndex + 1}-m${matchIndex + 1}` }, clubMap, `${seed}:${season}`)
  ));
  const table = blankTable(clubs);
  fixtures.flat().forEach(result => applyLeagueResult(table, result));
  const ranking = rankLeagueTwoTable(table, fixtures, { seed: `${seed}:${season}:ranking` });

  const compactBase = {
    schemaVersion: LEAGUE_TWO_WORLD_VERSION,
    key: `${LEAGUE_TWO_ID}:${season}`,
    competitionId: LEAGUE_TWO_ID,
    competitionName: LEAGUE_TWO_RULES.name,
    season,
    completedAt,
    membershipSource: season === '2026/27' ? '2026/27 verified EFL League Two membership' : 'derived English pyramid membership',
    clubs: clubs.map(({ id, name, slug, strength }) => ({ id, name, slug, strength })),
    clubCount: clubs.length,
    regularSeasonMatches: fixtures.flat().length,
    rankingRules: [...LEAGUE_TWO_RULES.ranking],
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

  const automaticPromotionClubIds = ranking.rows.slice(0, 3).map(row => row.clubId);
  const playoffRows = ranking.rows.slice(3, 7);
  const byId = id => clubMap.get(id);
  const semi47 = simulateSemiFinal(byId(playoffRows[0].clubId), byId(playoffRows[3].clubId), `${seed}:${season}:po-4v7`);
  const semi56 = simulateSemiFinal(byId(playoffRows[1].clubId), byId(playoffRows[2].clubId), `${seed}:${season}:po-5v6`);
  const final = simulatePlayoffFinal(byId(semi47.winnerClubId), byId(semi56.winnerClubId), `${seed}:${season}:po-final`);
  const playoffWinnerClubId = final.winnerClubId;
  const relegatedClubIds = ranking.rows.slice(-2).map(row => row.clubId);

  return {
    ...compactBase,
    status: 'complete',
    championClubId: ranking.rows[0]?.clubId || null,
    runnerUpClubId: ranking.rows[1]?.clubId || null,
    automaticPromotionClubIds,
    playoffClubIds: playoffRows.map(row => row.clubId),
    playoffWinnerClubId,
    promotedClubIds: [...automaticPromotionClubIds, playoffWinnerClubId],
    relegatedClubIds,
    playoffs: { semiFinals: [semi47, semi56], final }
  };
}
