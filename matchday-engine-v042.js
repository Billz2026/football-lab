import {
  MAX_SUBSTITUTIONS,
  TACTIC_OPTIONS,
  advanceInteractiveMatch as baseAdvanceInteractiveMatch,
  changeTactics as baseChangeTactics,
  completeInteractiveRound as baseCompleteInteractiveRound,
  createInteractiveMatch as baseCreateInteractiveMatch,
  makeSubstitution as baseMakeSubstitution
} from './matchday-engine-v041.js';

export { MAX_SUBSTITUTIONS, TACTIC_OPTIONS };
export const LIVE_ENGINE_VERSION = 3;
export const PLAYER_DUTIES = ['Defend', 'Support', 'Attack'];

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

function playerById(db, id) {
  return db.players.find(player => player.id === id);
}

function clubById(db, id) {
  return db.clubs.find(club => club.id === id);
}

function clubName(db, id) {
  return clubById(db, id)?.shortName || clubById(db, id)?.name || 'Unknown';
}

function userSide(state) {
  return state.userClubId === state.homeClubId ? 'home' : 'away';
}

function otherSide(side) {
  return side === 'home' ? 'away' : 'home';
}

function lineupFor(state, side) {
  return side === 'home' ? state.homeLineupIds : state.awayLineupIds;
}

function setLineup(state, side, ids) {
  if (side === 'home') state.homeLineupIds = ids;
  else state.awayLineupIds = ids;
}

function defaultDuty(player) {
  if (!player) return 'Support';
  if (player.positionGroup === 'GK' || player.positionGroup === 'DEF') return 'Defend';
  if (player.positionGroup === 'ATT') return 'Attack';
  return 'Support';
}

function ensureExtendedState(inputState, db) {
  const state = clone(inputState);
  state.liveEngineVersion = LIVE_ENGINE_VERSION;
  state.playerDuties ||= {};
  state.injuredIds ||= [];
  state.sentOffIds ||= [];
  state.yellowByPlayer ||= {};
  state.stats.home.redCards ??= 0;
  state.stats.away.redCards ??= 0;
  for (const id of [...state.homeLineupIds, ...state.awayLineupIds, ...(state.userBenchIds || [])]) {
    if (!state.playerDuties[id]) state.playerDuties[id] = defaultDuty(playerById(db, id));
  }
  return state;
}

function recordEvent(state, event) {
  const stored = {
    minute: state.minute,
    type: event.type || 'commentary',
    clubId: event.clubId || null,
    playerId: event.playerId || null,
    assistPlayerId: event.assistPlayerId || null,
    text: event.text || (event.lines || []).join(' '),
    lines: event.lines || (event.text ? [event.text] : [])
  };
  state.events.push(stored);
  return stored;
}

function choosePlayer(ids, db, random, groups = null) {
  let pool = ids.map(id => playerById(db, id)).filter(Boolean);
  if (groups?.length) {
    const filtered = pool.filter(player => groups.includes(player.positionGroup));
    if (filtered.length) pool = filtered;
  }
  if (!pool.length) return null;
  return pool[Math.floor(random() * pool.length)] || pool[0];
}

function aiTactics(state, side) {
  const goalsFor = side === 'home' ? state.homeGoals : state.awayGoals;
  const goalsAgainst = side === 'home' ? state.awayGoals : state.homeGoals;
  const trailing = goalsFor < goalsAgainst;
  const leading = goalsFor > goalsAgainst;
  const clubId = side === 'home' ? state.homeClubId : state.awayClubId;
  const baseFormation = hashString(clubId) % 2 ? '4-2-3-1' : '4-3-3';
  if (state.minute >= 68 && trailing) {
    return { formation: state.minute >= 80 ? '3-4-3' : baseFormation, mentality: 'Attacking', pressing: 'High', tempo: 'High', passing: 'Direct', width: 'Wide', defensiveLine: 'High' };
  }
  if (state.minute >= 74 && leading) {
    return { formation: '4-5-1', mentality: 'Defensive', pressing: 'Low', tempo: 'Slow', passing: 'Mixed', width: 'Narrow', defensiveLine: 'Low' };
  }
  return { formation: baseFormation, mentality: 'Balanced', pressing: 'Standard', tempo: 'Standard', passing: 'Mixed', width: 'Balanced', defensiveLine: 'Standard' };
}

export function getOpponentSnapshot(inputState, db) {
  const state = ensureExtendedState(inputState, db);
  const side = otherSide(userSide(state));
  const clubId = side === 'home' ? state.homeClubId : state.awayClubId;
  return {
    side,
    clubId,
    clubName: clubName(db, clubId),
    tactics: aiTactics(state, side),
    lineupIds: [...lineupFor(state, side)],
    redCards: state.stats[side].redCards || 0
  };
}

function situationalEvent(state, db) {
  if (![15, 30, 40, 55, 65, 75, 82, 87].includes(state.minute)) return null;
  const side = userSide(state);
  const opponentSide = otherSide(side);
  const teamId = state.userClubId;
  const opponentId = opponentSide === 'home' ? state.homeClubId : state.awayClubId;
  const forGoals = side === 'home' ? state.homeGoals : state.awayGoals;
  const againstGoals = side === 'home' ? state.awayGoals : state.homeGoals;
  const tired = lineupFor(state, side)
    .map(id => ({ id, condition: state.conditions[id] ?? 100 }))
    .sort((a, b) => a.condition - b.condition)[0];
  const tiredPlayer = tired?.condition < 67 ? playerById(db, tired.id) : null;
  let text;

  if (state.minute >= 75 && forGoals > againstGoals) {
    text = `${clubName(db, teamId)} are protecting a ${forGoals - againstGoals}-goal advantage now. ${clubName(db, opponentId)} are committing more players forward.`;
  } else if (state.minute >= 65 && forGoals < againstGoals) {
    text = `${clubName(db, teamId)} need a response. The urgency is rising as they push higher up the pitch.`;
  } else if (state.tactics.mentality === 'Defensive') {
    text = `${clubName(db, teamId)} are sitting deeper in their ${state.tactics.formation}, keeping numbers behind the ball.`;
  } else if (state.tactics.mentality === 'Attacking') {
    text = `${clubName(db, teamId)} are taking risks now. The ${state.tactics.formation} is stretching the game in search of chances.`;
  } else {
    text = `${clubName(db, teamId)} are staying patient in their ${state.tactics.formation} while ${clubName(db, opponentId)} try to disrupt the rhythm.`;
  }

  if (tiredPlayer) text += ` ${tiredPlayer.name} is beginning to look tired at ${Math.round(tired.condition)}% condition.`;
  return recordEvent(state, { type: 'situation', clubId: teamId, lines: [text] });
}

function applyInstructionImpact(state, db, random) {
  const side = userSide(state);
  const lineup = lineupFor(state, side).filter(id => !state.sentOffIds.includes(id));
  if (!lineup.length || random() > .115) return null;
  const candidates = lineup.filter(id => playerById(db, id)?.positionGroup !== 'GK');
  const id = candidates[Math.floor(random() * candidates.length)];
  const player = playerById(db, id);
  if (!player) return null;
  const duty = state.playerDuties[id] || defaultDuty(player);
  const team = clubName(db, state.userClubId);
  const opponent = clubName(db, side === 'home' ? state.awayClubId : state.homeClubId);

  if (duty === 'Defend') {
    state.ratings[id] = clamp((state.ratings[id] ?? 6.5) + .025, 4, 10);
    return recordEvent(state, {
      type: 'instruction', clubId: state.userClubId, playerId: id,
      lines: [`${player.name} holds his position exactly as instructed and cuts out the danger before ${opponent} can break.`]
    });
  }

  if (duty === 'Support') {
    state.stats[side].possessionTicks += 1;
    state.ratings[id] = clamp((state.ratings[id] ?? 6.5) + .018, 4, 10);
    return recordEvent(state, {
      type: 'instruction', clubId: state.userClubId, playerId: id,
      lines: [`${player.name} drops into support, gives ${team} an extra passing option and helps recycle possession.`]
    });
  }

  if (random() < .38) {
    state.stats[side].shots += 1;
    const onTarget = random() < .48;
    if (onTarget) state.stats[side].onTarget += 1;
    const ability = (player.currentAbility || 100) / 120;
    const condition = (state.conditions[id] ?? 100) / 100;
    if (onTarget && random() < .055 * ability * condition) {
      if (side === 'home') state.homeGoals += 1; else state.awayGoals += 1;
      state.ratings[id] = clamp((state.ratings[id] ?? 6.5) + .7, 4, 10);
      return recordEvent(state, {
        type: 'goal', clubId: state.userClubId, playerId: id,
        lines: [`${player.name} attacks the space exactly as instructed...`, `${player.name} SHOOTS!`, `GOAL! The attacking duty pays off for ${team}!`]
      });
    }
    return recordEvent(state, {
      type: onTarget ? 'save' : 'miss', clubId: state.userClubId, playerId: id,
      lines: onTarget
        ? [`${player.name} breaks forward from his attacking duty and gets a shot away.`, `${opponent} survive as the goalkeeper makes the stop.`]
        : [`${player.name} drives forward on his attacking instruction but cannot keep the effort on target.`]
    });
  }

  return recordEvent(state, {
    type: 'instruction', clubId: state.userClubId, playerId: id,
    lines: [`${player.name} keeps pushing beyond his normal position, trying to turn the attacking instruction into an overload.`]
  });
}

function applyDiscipline(state, db, baseEvents, random) {
  const extra = [];
  for (const event of baseEvents) {
    if (event.type !== 'yellow' || !event.playerId) continue;
    state.yellowByPlayer[event.playerId] = (state.yellowByPlayer[event.playerId] || 0) + 1;
    if (state.yellowByPlayer[event.playerId] < 2 || state.sentOffIds.includes(event.playerId)) continue;
    const side = lineupFor(state, 'home').includes(event.playerId) ? 'home' : lineupFor(state, 'away').includes(event.playerId) ? 'away' : null;
    if (!side) continue;
    setLineup(state, side, lineupFor(state, side).filter(id => id !== event.playerId));
    state.sentOffIds.push(event.playerId);
    state.stats[side].redCards += 1;
    const p = playerById(db, event.playerId);
    extra.push(recordEvent(state, {
      type: 'red', clubId: side === 'home' ? state.homeClubId : state.awayClubId, playerId: event.playerId,
      lines: [`SECOND YELLOW! ${p?.name || 'The player'} is sent off.`, `${clubName(db, side === 'home' ? state.homeClubId : state.awayClubId)} will have to reorganise with ten men.`]
    }));
  }

  if (random() < .0013) {
    const side = random() < .5 ? 'home' : 'away';
    const available = lineupFor(state, side).filter(id => !state.sentOffIds.includes(id));
    const offender = choosePlayer(available, db, random, ['DEF', 'MID']);
    if (offender) {
      setLineup(state, side, lineupFor(state, side).filter(id => id !== offender.id));
      state.sentOffIds.push(offender.id);
      state.stats[side].redCards += 1;
      extra.push(recordEvent(state, {
        type: 'red', clubId: side === 'home' ? state.homeClubId : state.awayClubId, playerId: offender.id,
        lines: [`RED CARD! ${offender.name} is dismissed for a reckless challenge.`, `${clubName(db, side === 'home' ? state.homeClubId : state.awayClubId)} are down to ten.`]
      }));
    }
  }
  return extra;
}

function applyInjury(state, db, random) {
  if (random() > .0042) return null;
  const side = random() < .5 ? 'home' : 'away';
  const available = lineupFor(state, side).filter(id => !state.injuredIds.includes(id) && !state.sentOffIds.includes(id));
  const injured = choosePlayer(available, db, random);
  if (!injured) return null;
  state.injuredIds.push(injured.id);
  const serious = random() < .3;
  state.conditions[injured.id] = Math.min(state.conditions[injured.id] ?? 100, serious ? 38 : 55);
  state.ratings[injured.id] = clamp((state.ratings[injured.id] ?? 6.5) - .08, 4, 10);
  return recordEvent(state, {
    type: 'injury', clubId: side === 'home' ? state.homeClubId : state.awayClubId, playerId: injured.id,
    lines: serious
      ? [`${injured.name} has gone down and immediately signals to the bench.`, `This looks serious. ${clubName(db, side === 'home' ? state.homeClubId : state.awayClubId)} may need to make a change.`]
      : [`${injured.name} is moving gingerly after that challenge.`, `He is trying to continue, but his condition has clearly dropped.`]
  });
}

export function createInteractiveMatch(career, db) {
  return ensureExtendedState(baseCreateInteractiveMatch(career, db), db);
}

export function advanceInteractiveMatch(inputState, career, db) {
  const prepared = ensureExtendedState(inputState, db);
  const advanced = baseAdvanceInteractiveMatch(prepared, career, db);
  const state = ensureExtendedState(advanced.state, db);
  const random = seededRandom(`${state.seed}:${state.fixtureId}:extended:${state.minute}:${state.substitutions.length}`);
  const extras = [];

  extras.push(...applyDiscipline(state, db, advanced.events, random));
  const injury = applyInjury(state, db, random);
  if (injury) extras.push(injury);
  const instruction = applyInstructionImpact(state, db, random);
  if (instruction) extras.push(instruction);
  const situation = situationalEvent(state, db);
  if (situation) extras.push(situation);

  return { state, events: [...advanced.events, ...extras] };
}

export function makeSubstitution(inputState, outId, inId, db) {
  const result = baseMakeSubstitution(ensureExtendedState(inputState, db), outId, inId, db);
  const state = ensureExtendedState(result.state, db);
  if (!state.playerDuties[inId]) state.playerDuties[inId] = defaultDuty(playerById(db, inId));
  return { state, event: result.event };
}

export function changeTactics(inputState, patch) {
  return baseChangeTactics(inputState, patch);
}

export function setPlayerDuty(inputState, playerId, duty, db) {
  const state = ensureExtendedState(inputState, db);
  if (!PLAYER_DUTIES.includes(duty)) throw new Error('Choose a valid player duty.');
  if (!lineupFor(state, userSide(state)).includes(playerId)) throw new Error('Player instructions can only be changed for players currently on the pitch.');
  const p = playerById(db, playerId);
  if (p?.positionGroup === 'GK' && duty !== 'Defend') throw new Error('Goalkeepers use the Defend duty in this match engine.');
  state.playerDuties[playerId] = duty;
  const event = recordEvent(state, {
    type: 'instruction-change', clubId: state.userClubId, playerId,
    lines: [`Player instruction: ${p?.name || 'Player'} — ${duty}.`]
  });
  return { state, event };
}

export function completeInteractiveRound(career, inputState, db) {
  const state = ensureExtendedState(inputState, db);
  const finished = baseCompleteInteractiveRound(career, state, db);
  if (finished.lastMatch) {
    const fullHistory = clone(finished.lastMatch.events || []);
    const keyTypes = new Set(['goal', 'yellow', 'red', 'injury', 'substitution', 'tactical', 'instruction-change', 'woodwork', 'marker']);
    finished.lastMatch.commentaryHistory = fullHistory;
    finished.lastMatch.events = fullHistory.filter(event => keyTypes.has(event.type));
    finished.lastMatch.sentOffIds = [...state.sentOffIds];
    finished.lastMatch.injuredIds = [...state.injuredIds];
    finished.lastMatch.playerDuties = { ...state.playerDuties };
  }
  return finished;
}
