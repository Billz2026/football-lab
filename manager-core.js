export const CAREER_VERSION = 1;
export const SAVE_KEY = 'flm-career-save';

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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function poisson(lambda, random) {
  const limit = Math.exp(-lambda);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > limit && count < 9);
  return clamp(count - 1, 0, 6);
}

export function createFixtures(clubIds) {
  if (!Array.isArray(clubIds) || clubIds.length < 2 || clubIds.length % 2 !== 0) {
    throw new Error('The demo league requires an even number of clubs.');
  }

  let rotation = [...clubIds];
  const rounds = [];
  for (let roundIndex = 0; roundIndex < clubIds.length - 1; roundIndex += 1) {
    const fixtures = [];
    for (let pairIndex = 0; pairIndex < rotation.length / 2; pairIndex += 1) {
      const first = rotation[pairIndex];
      const second = rotation[rotation.length - 1 - pairIndex];
      const flip = (roundIndex + pairIndex) % 2 === 1;
      fixtures.push({
        id: `r${roundIndex + 1}-m${pairIndex + 1}`,
        round: roundIndex + 1,
        homeClubId: flip ? second : first,
        awayClubId: flip ? first : second,
        played: false,
        homeGoals: null,
        awayGoals: null,
        events: []
      });
    }
    rounds.push(fixtures);
    rotation = [rotation[0], rotation.at(-1), ...rotation.slice(1, -1)];
  }
  return rounds;
}

export function autoPickLineup(players, clubId) {
  const squad = players
    .filter(player => player.clubId === clubId && !player.isPlaceholder)
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0));
  const picked = [];
  const quotas = { GK: 1, DEF: 4, MID: 3, ATT: 3 };

  Object.entries(quotas).forEach(([group, required]) => {
    picked.push(...squad.filter(player => player.positionGroup === group).slice(0, required));
  });
  squad.forEach(player => {
    if (picked.length < 11 && !picked.some(selected => selected.id === player.id)) picked.push(player);
  });
  return picked.slice(0, 11).map(player => player.id);
}

export function validateLineup(lineupIds, players, clubId) {
  const unique = [...new Set(lineupIds || [])];
  const squadIds = new Set(players.filter(player => player.clubId === clubId).map(player => player.id));
  const selected = players.filter(player => unique.includes(player.id));
  const errors = [];
  if (unique.length !== 11) errors.push('Select exactly 11 players.');
  if (unique.some(id => !squadIds.has(id))) errors.push('Every selected player must belong to your club.');
  if (!selected.some(player => player.positionGroup === 'GK')) errors.push('Your starting XI needs a goalkeeper.');
  return { valid: errors.length === 0, errors };
}

function baseTable(clubs) {
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

export function sortedTable(table) {
  return [...table].sort((a, b) =>
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.clubId.localeCompare(b.clubId)
  );
}

function initialPlayerStatus(players, clubs) {
  const eligibleClubIds = new Set(clubs.map(club => club.id));
  return Object.fromEntries(players
    .filter(player => eligibleClubIds.has(player.clubId))
    .map(player => [player.id, { condition: 100, sharpness: 88, morale: 'Good', appearances: 0, goals: 0 }])
  );
}

export function createCareer({ clubId, clubs, players, seed = Date.now(), managerName = 'The Gaffer' }) {
  const demoClubs = clubs.filter(club => !club.isPlaceholder);
  if (!demoClubs.some(club => club.id === clubId)) throw new Error('Choose a club from the playable demo league.');
  if (demoClubs.length < 4 || demoClubs.length % 2 !== 0) throw new Error('The playable database needs an even set of at least four real clubs.');

  const timestamp = new Date().toISOString();
  return {
    version: CAREER_VERSION,
    id: `career-${hashString(`${clubId}:${seed}:${timestamp}`).toString(16)}`,
    managerName,
    clubId,
    season: '2026/27',
    competitionName: 'Football Lab Invitational',
    createdAt: timestamp,
    updatedAt: timestamp,
    seed: String(seed),
    status: 'active',
    roundIndex: 0,
    fixtures: createFixtures(demoClubs.map(club => club.id)),
    table: baseTable(demoClubs),
    lineupIds: autoPickLineup(players, clubId),
    tactics: { formation: '4-3-3', mentality: 'Balanced', pressing: 'Standard' },
    playerStatus: initialPlayerStatus(players, demoClubs),
    lastMatch: null
  };
}

function lineupPlayers(career, db, clubId) {
  const ids = clubId === career.clubId ? career.lineupIds : autoPickLineup(db.players, clubId);
  return ids.map(id => db.players.find(player => player.id === id)).filter(Boolean);
}

function teamStrength(career, db, clubId, home) {
  const club = db.clubs.find(item => item.id === clubId);
  const lineup = lineupPlayers(career, db, clubId);
  const ability = lineup.reduce((sum, player) => {
    const status = career.playerStatus[player.id] || { condition: 100, sharpness: 88 };
    const readiness = (status.condition * 0.65 + status.sharpness * 0.35) / 100;
    return sum + (player.currentAbility || 100) * readiness;
  }, 0) / Math.max(1, lineup.length);
  const reputation = clamp(((club?.reputation || 7000) - 7000) / 350, -5, 5);
  return ability + reputation + (home ? 2.2 : 0);
}

function tacticalExpectedGoals(career, clubId) {
  if (clubId !== career.clubId) return { attack: 0, conceded: 0 };
  const mentality = {
    Defensive: { attack: -0.16, conceded: -0.22 },
    Balanced: { attack: 0, conceded: 0 },
    Attacking: { attack: 0.2, conceded: 0.17 }
  }[career.tactics.mentality] || { attack: 0, conceded: 0 };
  const pressing = {
    Low: { attack: -0.05, conceded: 0.04 },
    Standard: { attack: 0, conceded: 0 },
    High: { attack: 0.1, conceded: -0.06 }
  }[career.tactics.pressing] || { attack: 0, conceded: 0 };
  return { attack: mentality.attack + pressing.attack, conceded: mentality.conceded + pressing.conceded };
}

function scorerFor(players, random) {
  const weighted = players.flatMap(player => {
    const weight = player.positionGroup === 'ATT' ? 5 : player.positionGroup === 'MID' ? 3 : player.positionGroup === 'DEF' ? 1 : 0;
    return Array.from({ length: weight }, () => player);
  });
  return weighted[Math.floor(random() * weighted.length)] || players[0];
}

function buildEvents(fixture, homePlayers, awayPlayers, random) {
  const events = [];
  const addGoals = (count, clubId, players) => {
    for (let index = 0; index < count; index += 1) {
      const minute = 4 + Math.floor(random() * 86);
      const scorer = scorerFor(players, random);
      events.push({ minute, type: 'goal', clubId, playerId: scorer?.id || null, text: `${scorer?.name || 'A player'} scores.` });
    }
  };
  addGoals(fixture.homeGoals, fixture.homeClubId, homePlayers);
  addGoals(fixture.awayGoals, fixture.awayClubId, awayPlayers);
  if (random() > 0.35) events.push({ minute: 12 + Math.floor(random() * 72), type: 'yellow', clubId: random() > 0.5 ? fixture.homeClubId : fixture.awayClubId, text: 'Yellow card after a late challenge.' });
  return events.sort((a, b) => a.minute - b.minute);
}

function simulateFixture(career, db, fixture) {
  const random = seededRandom(`${career.seed}:${fixture.id}`);
  const homeStrength = teamStrength(career, db, fixture.homeClubId, true);
  const awayStrength = teamStrength(career, db, fixture.awayClubId, false);
  const difference = clamp((homeStrength - awayStrength) / 28, -1.35, 1.35);
  const homeTactics = tacticalExpectedGoals(career, fixture.homeClubId);
  const awayTactics = tacticalExpectedGoals(career, fixture.awayClubId);
  const homeExpected = clamp(1.35 + difference + homeTactics.attack + awayTactics.conceded, 0.25, 3.2);
  const awayExpected = clamp(1.1 - difference + awayTactics.attack + homeTactics.conceded, 0.2, 3.0);
  const result = {
    ...fixture,
    played: true,
    homeGoals: poisson(homeExpected, random),
    awayGoals: poisson(awayExpected, random)
  };
  result.events = buildEvents(result, lineupPlayers(career, db, fixture.homeClubId), lineupPlayers(career, db, fixture.awayClubId), random);
  return result;
}

function applyResult(table, result) {
  const home = table.find(row => row.clubId === result.homeClubId);
  const away = table.find(row => row.clubId === result.awayClubId);
  home.played += 1;
  away.played += 1;
  home.goalsFor += result.homeGoals;
  home.goalsAgainst += result.awayGoals;
  away.goalsFor += result.awayGoals;
  away.goalsAgainst += result.homeGoals;
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

function updatePlayerStatus(career, db, userResult) {
  const userAtHome = userResult.homeClubId === career.clubId;
  const goalsFor = userAtHome ? userResult.homeGoals : userResult.awayGoals;
  const goalsAgainst = userAtHome ? userResult.awayGoals : userResult.homeGoals;
  const morale = goalsFor > goalsAgainst ? 'Excellent' : goalsFor < goalsAgainst ? 'Okay' : 'Good';
  const fatigue = career.tactics.pressing === 'High' ? 12 : career.tactics.pressing === 'Low' ? 7 : 9;
  const starters = new Set(career.lineupIds);
  Object.entries(career.playerStatus).forEach(([playerId, status]) => {
    const player = db.players.find(item => item.id === playerId);
    if (player?.clubId !== career.clubId) return;
    if (starters.has(playerId)) {
      status.condition = clamp(status.condition - fatigue, 55, 100);
      status.sharpness = clamp(status.sharpness + 3, 1, 100);
      status.appearances += 1;
      status.morale = morale;
    } else {
      status.condition = clamp(status.condition + 4, 1, 100);
      status.sharpness = clamp(status.sharpness - 1, 1, 100);
    }
  });
  userResult.events.filter(event => event.type === 'goal' && event.clubId === career.clubId && event.playerId).forEach(event => {
    if (career.playerStatus[event.playerId]) career.playerStatus[event.playerId].goals += 1;
  });
}

export function getNextFixture(career) {
  if (career.status === 'complete') return null;
  return career.fixtures[career.roundIndex]?.find(fixture => fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId) || null;
}

export function simulateNextRound(career, db) {
  const lineupCheck = validateLineup(career.lineupIds, db.players, career.clubId);
  if (!lineupCheck.valid) throw new Error(lineupCheck.errors.join(' '));
  if (career.status === 'complete' || !career.fixtures[career.roundIndex]) throw new Error('This demo season is complete.');

  const next = clone(career);
  const results = next.fixtures[next.roundIndex].map(fixture => simulateFixture(next, db, fixture));
  next.fixtures[next.roundIndex] = results;
  results.forEach(result => applyResult(next.table, result));
  const userResult = results.find(result => result.homeClubId === next.clubId || result.awayClubId === next.clubId);
  updatePlayerStatus(next, db, userResult);
  next.lastMatch = userResult;
  next.roundIndex += 1;
  if (next.roundIndex >= next.fixtures.length) next.status = 'complete';
  next.updatedAt = new Date().toISOString();
  return next;
}

export function updateLineup(career, lineupIds, players) {
  const validation = validateLineup(lineupIds, players, career.clubId);
  if (!validation.valid) throw new Error(validation.errors.join(' '));
  return { ...career, lineupIds: [...lineupIds], updatedAt: new Date().toISOString() };
}

export function updateTactics(career, tactics) {
  const allowed = {
    formation: ['4-3-3', '4-2-3-1', '4-4-2'],
    mentality: ['Defensive', 'Balanced', 'Attacking'],
    pressing: ['Low', 'Standard', 'High']
  };
  const next = { ...career.tactics };
  Object.entries(allowed).forEach(([key, values]) => {
    if (values.includes(tactics[key])) next[key] = tactics[key];
  });
  return { ...career, tactics: next, updatedAt: new Date().toISOString() };
}

export function serializeCareer(career) {
  return JSON.stringify(career);
}

export function parseCareer(raw, db) {
  const career = typeof raw === 'string' ? JSON.parse(raw) : clone(raw);
  if (career.version !== CAREER_VERSION) throw new Error('This save belongs to an unsupported Football Lab version.');
  if (!db.clubs.some(club => club.id === career.clubId && !club.isPlaceholder)) throw new Error('The saved club is not available in this database.');
  if (!Array.isArray(career.fixtures) || !Array.isArray(career.table)) throw new Error('The career save is incomplete.');
  return career;
}
