export const CHAMPIONSHIP_WORLD_VERSION = 1;
export const CHAMPIONSHIP_ID = 'eng-championship';

export const CHAMPIONSHIP_RULES = Object.freeze({
  id: CHAMPIONSHIP_ID,
  name: 'Championship',
  clubCount: 24,
  automaticPromotionPlaces: 2,
  playoffPlaces: Object.freeze([3, 4, 5, 6]),
  relegationPlaces: 3,
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

// 2026/27 membership. Kept separate from data/current because Championship squads are
// not yet imported and must not become user-playable accidentally.
export const CHAMPIONSHIP_2026_27_CLUBS = Object.freeze([
  ['birmingham-city', 'Birmingham City', 74],
  ['blackburn-rovers', 'Blackburn Rovers', 69],
  ['bolton-wanderers', 'Bolton Wanderers', 66],
  ['bristol-city', 'Bristol City', 71],
  ['burnley', 'Burnley', 80],
  ['cardiff-city', 'Cardiff City', 66],
  ['charlton-athletic', 'Charlton Athletic', 67],
  ['derby-county', 'Derby County', 70],
  ['lincoln-city', 'Lincoln City', 64],
  ['middlesbrough', 'Middlesbrough', 76],
  ['millwall', 'Millwall', 72],
  ['norwich-city', 'Norwich City', 75],
  ['portsmouth', 'Portsmouth', 68],
  ['preston-north-end', 'Preston North End', 68],
  ['queens-park-rangers', 'Queens Park Rangers', 69],
  ['sheffield-united', 'Sheffield United', 77],
  ['southampton', 'Southampton', 78],
  ['stoke-city', 'Stoke City', 70],
  ['swansea-city', 'Swansea City', 71],
  ['watford', 'Watford', 73],
  ['west-bromwich-albion', 'West Bromwich Albion', 74],
  ['west-ham-united', 'West Ham United', 84],
  ['wolverhampton-wanderers', 'Wolverhampton Wanderers', 83],
  ['wrexham', 'Wrexham', 70]
].map(([slug, name, strength]) => Object.freeze({
  id: `eng-championship-${slug}`,
  slug,
  name,
  strength
})));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clone = value => JSON.parse(JSON.stringify(value));

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

function validateClubs(clubs) {
  if (!Array.isArray(clubs) || clubs.length !== CHAMPIONSHIP_RULES.clubCount) {
    throw new Error(`Championship background simulation requires exactly ${CHAMPIONSHIP_RULES.clubCount} clubs.`);
  }
  const ids = clubs.map(club => club?.id).filter(Boolean);
  if (new Set(ids).size !== CHAMPIONSHIP_RULES.clubCount) throw new Error('Championship club ids must be unique.');
  if (clubs.some(club => !Number.isFinite(Number(club.strength)))) throw new Error('Every Championship club requires a numeric background strength.');
}

export function createChampionshipFixtures(clubs = CHAMPIONSHIP_2026_27_CLUBS) {
  validateClubs(clubs);
  const firstLeg = [];
  let rotation = clubs.map(club => club.id);
  for (let roundIndex = 0; roundIndex < rotation.length - 1; roundIndex += 1) {
    const round = [];
    for (let pairIndex = 0; pairIndex < rotation.length / 2; pairIndex += 1) {
      const first = rotation[pairIndex];
      const second = rotation[rotation.length - 1 - pairIndex];
      const flip = pairIndex === 0 ? roundIndex % 2 === 1 : pairIndex % 2 === 1;
      round.push({ homeClubId: flip ? second : first, awayClubId: flip ? first : second });
    }
    firstLeg.push(round);
    rotation = [rotation[0], rotation.at(-1), ...rotation.slice(1, -1)];
  }
  const returnOrder = [...firstLeg.slice(1), firstLeg[0]];
  const rounds = [
    ...firstLeg,
    ...returnOrder.map(round => round.map(fixture => ({
      homeClubId: fixture.awayClubId,
      awayClubId: fixture.homeClubId
    })))
  ];
  return rounds.map((round, roundIndex) => round.map((fixture, pairIndex) => ({
    id: `champ-mw${roundIndex + 1}-m${pairIndex + 1}`,
    round: roundIndex + 1,
    homeClubId: fixture.homeClubId,
    awayClubId: fixture.awayClubId,
    played: false,
    homeGoals: null,
    awayGoals: null
  })));
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

function matchStrength(club, home) {
  return Number(club.strength) + (home ? 2.4 : 0);
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
  return {
    penaltyPoints: yellows * 4 + sendingOffPoints,
    severeSendingOffs
  };
}

function simulateLeagueFixture(fixture, clubMap, seed) {
  const random = seededRandom(`${seed}:${fixture.id}`);
  const home = clubMap.get(fixture.homeClubId);
  const away = clubMap.get(fixture.awayClubId);
  const difference = clamp((matchStrength(home, true) - matchStrength(away, false)) / 18, -1.4, 1.4);
  const homeExpected = clamp(1.42 + difference, 0.28, 3.35);
  const awayExpected = clamp(1.13 - difference, 0.22, 3.0);
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
    const homeGoals = Number(fixture.homeGoals);
    const awayGoals = Number(fixture.awayGoals);
    home.goalsFor += homeGoals; home.goalsAgainst += awayGoals;
    away.goalsFor += awayGoals; away.goalsAgainst += homeGoals;
    if (homeGoals > awayGoals) home.points += 3;
    else if (homeGoals < awayGoals) away.points += 3;
    else { home.points += 1; away.points += 1; }
  }
  for (const value of Object.values(stats)) value.goalDifference = value.goalsFor - value.goalsAgainst;
  return stats;
}

function sameBase(a, b) {
  return Number(a.points) === Number(b.points) &&
    Number(a.goalDifference) === Number(b.goalDifference) &&
    Number(a.goalsFor) === Number(b.goalsFor);
}

function baseCompare(a, b) {
  return Number(b.points) - Number(a.points) ||
    Number(b.goalDifference) - Number(a.goalDifference) ||
    Number(b.goalsFor) - Number(a.goalsFor);
}

function consequenceForRange(startPosition, endPosition) {
  const consequences = [];
  const automaticBoundary = CHAMPIONSHIP_RULES.automaticPromotionPlaces;
  const playoffBoundary = Math.max(...CHAMPIONSHIP_RULES.playoffPlaces);
  const lastSafe = CHAMPIONSHIP_RULES.clubCount - CHAMPIONSHIP_RULES.relegationPlaces;
  if (startPosition <= automaticBoundary && endPosition > automaticBoundary) consequences.push('automatic-promotion');
  if (startPosition <= playoffBoundary && endPosition > playoffBoundary) consequences.push('playoff-qualification');
  if (startPosition <= lastSafe && endPosition > lastSafe) consequences.push('relegation');
  return consequences;
}

export function rankChampionshipTable(table, fixtures, { seed = 'championship-ranking' } = {}) {
  const baseSorted = [...table].sort((a, b) => baseCompare(a, b));
  const baseGroups = [];
  for (const row of baseSorted) {
    const current = baseGroups.at(-1);
    if (current && sameBase(current[0], row)) current.push(row);
    else baseGroups.push([row]);
  }

  const rows = [];
  const unresolvedGroups = [];
  const administrativeResolutions = [];
  for (const group of baseGroups) {
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
      let end = index + 1;
      const equalMetrics = item => item.h2h.points === first.h2h.points &&
        item.h2h.goalDifference === first.h2h.goalDifference &&
        item.h2h.goalsFor === first.h2h.goalsFor &&
        Number(item.row.won || 0) === Number(first.row.won || 0) &&
        Number(item.row.awayGoals || 0) === Number(first.row.awayGoals || 0) &&
        Number(item.row.disciplinePenaltyPoints || 0) === Number(first.row.disciplinePenaltyPoints || 0) &&
        Number(item.row.severeSendingOffs || 0) === Number(first.row.severeSendingOffs || 0);
      while (end < ranked.length && equalMetrics(ranked[end])) end += 1;
      let tied = ranked.slice(index, end);
      const startPosition = rows.length + 1;
      const endPosition = startPosition + tied.length - 1;
      const consequences = tied.length > 1 ? consequenceForRange(startPosition, endPosition) : [];
      const requiresLeagueDecider = consequences.includes('automatic-promotion') || consequences.includes('relegation');

      if (tied.length > 1 && !requiresLeagueDecider) {
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
            unresolved: requiresLeagueDecider && tied.length > 1
          }
        });
      }
      if (requiresLeagueDecider && tied.length > 1) {
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

  return {
    rows,
    unresolvedGroups,
    administrativeResolutions,
    decidingMatchRequired: unresolvedGroups.length > 0
  };
}

function simulateKnockout90(homeClub, awayClub, seed, { neutral = false } = {}) {
  const random = seededRandom(seed);
  const homeStrength = Number(homeClub.strength) + (neutral ? 0 : 2.0);
  const awayStrength = Number(awayClub.strength);
  const difference = clamp((homeStrength - awayStrength) / 19, -1.25, 1.25);
  return {
    homeGoals: poisson(clamp(1.34 + difference, 0.25, 3.1), random),
    awayGoals: poisson(clamp(1.08 - difference, 0.22, 2.8), random)
  };
}

function resolveLevelKnockout(homeClub, awayClub, seed, homeGoals, awayGoals) {
  if (homeGoals !== awayGoals) return { winnerClubId: homeGoals > awayGoals ? homeClub.id : awayClub.id, method: '90-minutes', extraTime: null, penalties: null };
  const random = seededRandom(`${seed}:extra-time`);
  const difference = clamp((Number(homeClub.strength) - Number(awayClub.strength)) / 25, -0.65, 0.65);
  const extraHome = poisson(clamp(0.32 + difference, 0.08, 0.7), random);
  const extraAway = poisson(clamp(0.28 - difference, 0.08, 0.65), random);
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
  const firstLegScore = simulateKnockout90(lower, higher, `${seed}:leg1`);
  const secondLegScore = simulateKnockout90(higher, lower, `${seed}:leg2`);
  const higherAggregate = firstLegScore.awayGoals + secondLegScore.homeGoals;
  const lowerAggregate = firstLegScore.homeGoals + secondLegScore.awayGoals;
  let resolution = null;
  if (higherAggregate === lowerAggregate) {
    resolution = resolveLevelKnockout(higher, lower, `${seed}:leg2`, 0, 0);
  }
  const winnerClubId = higherAggregate > lowerAggregate ? higher.id : lowerAggregate > higherAggregate ? lower.id : resolution.winnerClubId;
  return {
    higherSeedClubId: higher.id,
    lowerSeedClubId: lower.id,
    firstLeg: { homeClubId: lower.id, awayClubId: higher.id, ...firstLegScore },
    secondLeg: { homeClubId: higher.id, awayClubId: lower.id, ...secondLegScore },
    aggregate: { higherSeedGoals: higherAggregate, lowerSeedGoals: lowerAggregate },
    resolution: higherAggregate === lowerAggregate ? resolution : { winnerClubId, method: 'aggregate', extraTime: null, penalties: null },
    winnerClubId
  };
}

function simulatePlayoffFinal(firstClub, secondClub, seed) {
  const score = simulateKnockout90(firstClub, secondClub, `${seed}:90`, { neutral: true });
  const resolution = resolveLevelKnockout(firstClub, secondClub, seed, score.homeGoals, score.awayGoals);
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

export function simulateChampionshipSeason({
  seed = 'football-lab-championship',
  season = '2026/27',
  clubs = CHAMPIONSHIP_2026_27_CLUBS,
  completedAt = null
} = {}) {
  validateClubs(clubs);
  const clubMap = new Map(clubs.map(club => [club.id, club]));
  const fixtures = createChampionshipFixtures(clubs).map(round => round.map(fixture => simulateLeagueFixture(fixture, clubMap, `${seed}:${season}`)));
  const table = blankTable(clubs);
  fixtures.flat().forEach(result => applyLeagueResult(table, result));
  const ranking = rankChampionshipTable(table, fixtures, { seed: `${seed}:${season}:ranking` });

  const compactBase = {
    schemaVersion: CHAMPIONSHIP_WORLD_VERSION,
    key: `${CHAMPIONSHIP_ID}:${season}`,
    competitionId: CHAMPIONSHIP_ID,
    competitionName: CHAMPIONSHIP_RULES.name,
    season,
    completedAt,
    membershipSource: '2026/27 verified membership',
    clubs: clubs.map(({ id, name, slug }) => ({ id, name, slug })),
    clubCount: clubs.length,
    regularSeasonMatches: fixtures.flat().length,
    rankingRules: [...CHAMPIONSHIP_RULES.ranking],
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

  const automaticPromotionClubIds = ranking.rows.slice(0, 2).map(row => row.clubId);
  const playoffRows = ranking.rows.slice(2, 6);
  const byId = id => clubMap.get(id);
  const semi36 = simulateSemiFinal(byId(playoffRows[0].clubId), byId(playoffRows[3].clubId), `${seed}:${season}:po-3v6`);
  const semi45 = simulateSemiFinal(byId(playoffRows[1].clubId), byId(playoffRows[2].clubId), `${seed}:${season}:po-4v5`);
  const final = simulatePlayoffFinal(byId(semi36.winnerClubId), byId(semi45.winnerClubId), `${seed}:${season}:po-final`);
  const playoffWinnerClubId = final.winnerClubId;
  const relegatedClubIds = ranking.rows.slice(-3).map(row => row.clubId);
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
    playoffs: {
      semiFinals: [semi36, semi45],
      final
    }
  };
}

function isPremierLeagueCareer(career) {
  const id = career?.competitionId || career?.leagueId;
  if (id === 'eng-premier-league') return true;
  const name = String(career?.competitionName || '').toLowerCase();
  return career?.table?.length === 20 && name.includes('premier league');
}

function attachToNextSeasonContext(career, outcome) {
  if (!career?.nextSeasonContext || !outcome) return;
  career.nextSeasonContext.championshipSeason = outcome.season;
  career.nextSeasonContext.championshipStatus = outcome.status;
  career.nextSeasonContext.promotedFromChampionshipClubIds = [...(outcome.promotedClubIds || [])];
  career.nextSeasonContext.championshipRelegatedClubIds = [...(outcome.relegatedClubIds || [])];
  career.nextSeasonContext.championshipChampionClubId = outcome.championClubId || null;
  career.nextSeasonContext.championshipPlayoffWinnerClubId = outcome.playoffWinnerClubId || null;
}

export function finaliseChampionshipBackground(career, { completedAt = null } = {}) {
  if (!career || !isPremierLeagueCareer(career)) return { status: 'not-applicable', outcome: null };
  if (!Array.isArray(career.worldHistory)) career.worldHistory = [];
  const season = career.season || '2026/27';
  const key = `${CHAMPIONSHIP_ID}:${season}`;
  const existing = career.worldHistory.find(record => record.key === key);
  if (existing) {
    career.championshipOutcome = existing;
    attachToNextSeasonContext(career, existing);
    return { status: 'already-finalised', outcome: existing };
  }
  const outcome = simulateChampionshipSeason({
    seed: `${career.seed || career.id || 'career'}:${CHAMPIONSHIP_ID}`,
    season,
    completedAt
  });
  career.worldHistory.push(outcome);
  career.championshipOutcome = outcome;
  attachToNextSeasonContext(career, outcome);
  return { status: outcome.status === 'complete' ? 'finalised' : outcome.status, outcome };
}
