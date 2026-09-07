import {
  advanceInteractiveMatch as baseAdvanceInteractiveMatch,
  completeInteractiveRound as baseCompleteInteractiveRound,
  createInteractiveMatch as baseCreateInteractiveMatch,
  makeSubstitution as baseMakeSubstitution
} from './matchday-structured-attacks-v1.js?v=1.0.0';

export {
  FORMATION_LAYOUTS,
  MAX_SUBSTITUTIONS,
  ROLE_DEFINITIONS,
  STRUCTURED_ATTACK_VERSION,
  STRUCTURED_XG_MODEL,
  TACTIC_OPTIONS,
  assignPlayersToFormation,
  changeTactics,
  getOpponentSnapshot,
  getUserShape,
  setPlayerDuty,
  setPlayerRole,
  structuredXgFor,
  swapShapePlayers
} from './matchday-structured-attacks-v1.js?v=1.0.0';

export const STRUCTURED_FLOW_VERSION = '1.0.0';
export const STRUCTURED_FLOW_TYPES = Object.freeze([
  'interception',
  'standing_tackle',
  'sliding_tackle',
  'poor_touch',
  'overhit_pass',
  'forced_back',
  'second_ball_win',
  'blocked_cross',
  'defensive_header',
  'keeper_claim',
  'overhit_cross',
  'press_regain',
  'offside_trap',
  'defensive_header_corner',
  'blocked_cross_corner',
  'last_ditch_block_corner'
]);

const ELIGIBLE_TYPES = new Set(['commentary', 'corner', 'offside', 'instruction']);
const clone = value => JSON.parse(JSON.stringify(value));

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value || '')) {
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

function pick(random, values) {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))];
}

function playerById(db, id) {
  return db?.players?.find(player => player.id === id) || null;
}

function clubById(db, id) {
  return db?.clubs?.find(club => club.id === id) || null;
}

function clubName(db, id) {
  const club = clubById(db, id);
  return club?.shortName || club?.name || 'The team';
}

function opponentClubId(state, clubId) {
  return clubId === state.homeClubId ? state.awayClubId : state.homeClubId;
}

function lineupForClub(state, clubId) {
  if (clubId === state.homeClubId) return state.homeLineupIds || [];
  if (clubId === state.awayClubId) return state.awayLineupIds || [];
  return [];
}

function choosePlayer(ids, db, random, groups = null, excluded = new Set()) {
  let pool = (ids || []).map(id => playerById(db, id)).filter(player => player && !excluded.has(player.id));
  if (groups?.length) {
    const positional = pool.filter(player => groups.includes(player.positionGroup));
    if (positional.length) pool = positional;
  }
  if (!pool.length) return null;
  const weighted = [];
  for (const player of pool) {
    const weight = player.positionGroup === 'DEF' ? 5 : player.positionGroup === 'MID' ? 4 : player.positionGroup === 'ATT' ? 3 : 1;
    for (let index = 0; index < weight; index += 1) weighted.push(player);
  }
  return weighted[Math.floor(random() * weighted.length)] || pool[0];
}

function goalkeeperFor(state, db, clubId) {
  const ids = lineupForClub(state, clubId);
  return ids.map(id => playerById(db, id)).find(player => player?.positionGroup === 'GK') || null;
}

function scoreMargin(state, clubId) {
  if (clubId === state.homeClubId) return Number(state.homeGoals || 0) - Number(state.awayGoals || 0);
  if (clubId === state.awayClubId) return Number(state.awayGoals || 0) - Number(state.homeGoals || 0);
  return 0;
}

function sourceText(event) {
  return `${event?.text || ''} ${(event?.lines || []).join(' ')}`.toLowerCase();
}

function isPressRegainText(text) {
  return /press|closes down|squeeze the pitch|win possession high|snaps into the challenge|wins the second ball/.test(text);
}

function isWideText(text) {
  return /flank|cross|wide|byline|wing/.test(text);
}

function subtypeFor(event, random) {
  const text = sourceText(event);
  if (event.type === 'offside') return 'offside_trap';
  if (event.type === 'corner') {
    if (/headed behind|heads? behind/.test(text)) return 'defensive_header_corner';
    if (/shot is blocked|blocked/.test(text)) return 'last_ditch_block_corner';
    return 'blocked_cross_corner';
  }
  if (isPressRegainText(text)) return /second ball/.test(text) ? 'second_ball_win' : 'press_regain';
  if (isWideText(text)) return pick(random, ['blocked_cross', 'defensive_header', 'keeper_claim', 'overhit_cross']);
  return pick(random, [
    'interception', 'interception', 'standing_tackle', 'standing_tackle',
    'sliding_tackle', 'poor_touch', 'overhit_pass', 'forced_back', 'second_ball_win'
  ]);
}

function rolesForSubtype(subtype, eventClubId, state) {
  if (['press_regain', 'second_ball_win'].includes(subtype)) {
    return {
      attackingClubId: opponentClubId(state, eventClubId),
      defendingClubId: eventClubId,
      possessionClubId: eventClubId
    };
  }
  const attackingClubId = eventClubId;
  const defendingClubId = opponentClubId(state, eventClubId);
  const attackingKeepsBall = subtype === 'forced_back';
  return {
    attackingClubId,
    defendingClubId,
    possessionClubId: attackingKeepsBall ? attackingClubId : defendingClubId
  };
}

function sideForSubtype(subtype, random) {
  if (['blocked_cross', 'defensive_header', 'keeper_claim', 'overhit_cross', 'blocked_cross_corner', 'defensive_header_corner'].includes(subtype)) {
    return random() < 0.5 ? 'left' : 'right';
  }
  const roll = random();
  return roll < 0.28 ? 'left' : roll < 0.56 ? 'right' : 'centre';
}

function zoneForSubtype(subtype, side) {
  if (['keeper_claim', 'defensive_header', 'defensive_header_corner', 'last_ditch_block_corner'].includes(subtype)) return 'penalty_area';
  if (['blocked_cross', 'overhit_cross', 'blocked_cross_corner'].includes(subtype)) return side === 'left' ? 'left_channel' : 'right_channel';
  if (subtype === 'offside_trap') return 'final_third';
  if (subtype === 'press_regain') return 'middle_third';
  return 'final_third';
}

function actionForSubtype(subtype) {
  if (subtype === 'interception') return 'interception';
  if (['standing_tackle', 'sliding_tackle', 'last_ditch_block_corner'].includes(subtype)) return 'tackle';
  if (['defensive_header', 'defensive_header_corner'].includes(subtype)) return 'aerial_duel';
  if (['keeper_claim'].includes(subtype)) return 'goalkeeper_claim';
  if (['blocked_cross', 'blocked_cross_corner'].includes(subtype)) return 'block';
  if (subtype === 'offside_trap') return 'offside';
  if (subtype === 'second_ball_win') return 'second_ball';
  if (subtype === 'press_regain') return 'press_turnover';
  if (subtype === 'forced_back') return 'recycle';
  return 'turnover';
}

function outcomeForSubtype(subtype) {
  if (['defensive_header_corner', 'blocked_cross_corner', 'last_ditch_block_corner'].includes(subtype)) return 'corner_conceded';
  if (subtype === 'keeper_claim') return 'keeper_possession';
  if (subtype === 'offside_trap') return 'offside';
  if (subtype === 'forced_back') return 'recycled';
  if (subtype === 'overhit_cross' || subtype === 'overhit_pass') return 'ball_runs_safe';
  if (subtype === 'second_ball_win' || subtype === 'press_regain') return 'possession_won';
  return 'attack_stopped';
}

function pressureFor(random, subtype) {
  if (['last_ditch_block_corner', 'sliding_tackle'].includes(subtype)) return 'high';
  if (['keeper_claim', 'forced_back', 'overhit_pass'].includes(subtype)) return random() < 0.5 ? 'low' : 'medium';
  return random() < 0.25 ? 'low' : random() < 0.78 ? 'medium' : 'high';
}

function contextTagsFor(state, roles, subtype, memory, defenderId) {
  const tags = [];
  const minute = Number(state.minute || 0);
  if (minute >= 75 && scoreMargin(state, roles.defendingClubId) > 0) tags.push('protecting-lead');
  if (minute >= 75 && scoreMargin(state, roles.attackingClubId) < 0) tags.push('chasing-game');
  if (subtype === 'press_regain') tags.push('high-regain');
  if (['sliding_tackle', 'last_ditch_block_corner'].includes(subtype)) tags.push('last-ditch');
  const defenderWins = Number(memory?.defenderActions?.[defenderId] || 0);
  if (defenderId && defenderWins >= 1) tags.push('repeat-defender');
  const breakdowns = Number(memory?.teamBreakdowns?.[roles.attackingClubId] || 0);
  if (breakdowns >= 2) tags.push('attack-frustration');
  const recent = (memory?.history || []).filter(item => item.attackingClubId === roles.attackingClubId && minute - Number(item.minute || 0) <= 8);
  if (recent.length >= 2) tags.push('pressure-resisted');
  return [...new Set(tags)];
}

function buildBeats(facts) {
  const developmentAction = ['blocked_cross', 'defensive_header', 'keeper_claim', 'overhit_cross', 'blocked_cross_corner', 'defensive_header_corner'].includes(facts.subtype)
    ? 'cross'
    : ['offside_trap', 'overhit_pass', 'interception'].includes(facts.subtype) ? 'pass' : 'carry';
  return [
    {
      phase: 'development',
      action: developmentAction,
      playerId: facts.attackerId,
      targetPlayerId: facts.targetPlayerId,
      zone: facts.zone,
      side: facts.side
    },
    {
      phase: 'duel',
      action: facts.action,
      playerId: facts.defenderId || facts.keeperId,
      opponentPlayerId: facts.attackerId,
      pressure: facts.pressure
    },
    {
      phase: 'resolution',
      action: 'possession_outcome',
      subtype: facts.outcome,
      teamId: facts.possessionClubId
    }
  ];
}

function fallbackFlowLines(event, facts, db) {
  const attacking = clubName(db, facts.attackingClubId);
  const defending = clubName(db, facts.defendingClubId);
  const attacker = playerById(db, facts.attackerId)?.name || 'The attacker';
  const defender = playerById(db, facts.defenderId)?.name || 'The defender';
  const keeper = playerById(db, facts.keeperId)?.name || 'The goalkeeper';
  switch (facts.subtype) {
    case 'interception': return [`${attacking} try to play through the final third.`, `${defender} reads it early and steps across ${attacker}.`, `${defending} have the ball back.`];
    case 'standing_tackle': return [`${attacker} tries to drive into the final third.`, `${defender} stands him up and wins the challenge cleanly.`, `${defending} turn possession over.`];
    case 'sliding_tackle': return [`${attacker} pushes the ball into space.`, `${defender} commits to the slide and times it perfectly.`, `The danger is cleared for ${defending}.`];
    case 'poor_touch': return [`${attacker} receives between the lines.`, `The first touch gets away from him and ${defender} pounces.`, `${defending} recover possession.`];
    case 'overhit_pass': return [`${attacking} look for the runner beyond the back line.`, `The pass has too much on it.`, `${keeper} watches it run safely through.`];
    case 'forced_back': return [`${attacker} tries to advance down the ${facts.side}.`, `${defender} shuts the route forward.`, `${attacking} are forced to recycle possession.`];
    case 'second_ball_win': return [`The loose ball drops in midfield.`, `${defender} reacts first and wins the second ball.`, `${defending} can build again.`];
    case 'press_regain': return [`${attacking} try to play through the press.`, `${defender} closes the space and forces the turnover.`, `${defending} win it high up the pitch.`];
    case 'blocked_cross': return [`${attacker} reaches crossing range on the ${facts.side}.`, `${defender} gets out quickly and blocks the delivery.`, `${attacking}'s move stalls.`];
    case 'defensive_header': return [`The cross is sent into the ${defending} area.`, `${defender} attacks it first and heads clear.`, `${defending} survive the delivery.`];
    case 'keeper_claim': return [`${attacking} send the ball into the box.`, `${keeper} comes through traffic and claims it cleanly.`, `${defending} can reset.`];
    case 'overhit_cross': return [`${attacker} tries to deliver from the ${facts.side}.`, `The cross is overhit and carries beyond everybody.`, `${defending} let the danger run out.`];
    case 'offside_trap': return [`${attacking} try to release ${attacker} behind the line.`, `${defending} step together and catch the run.`, `The flag goes up for offside.`];
    case 'defensive_header_corner': return [`${attacking} put the delivery into a dangerous area.`, `${defender} gets there first and heads behind.`, `Corner to ${attacking}.`];
    case 'blocked_cross_corner': return [`${attacker} tries to force a cross into the area.`, `${defender} blocks it at close range.`, `It spins behind for a ${attacking} corner.`];
    case 'last_ditch_block_corner': return [`${attacker} finds a sight of the penalty area.`, `${defender} throws himself across the danger.`, `The block takes it behind for a corner.`];
    default: return [`${attacking} try to work an opening.`, `${defending} read the danger.`, `The attack breaks down.`];
  }
}

export function deriveStructuredFlowFacts(state, event, db, serial = 0, memory = {}) {
  if (!event || event.attack || !ELIGIBLE_TYPES.has(event.type) || !event.clubId) return null;
  const random = seededRandom(`${state.seed}:${state.fixtureId}:${event.minute}:${event.clubId}:${event.type}:${serial}:structured-flow-v1`);
  const subtype = subtypeFor(event, random);
  const roles = rolesForSubtype(subtype, event.clubId, state);
  const attackingIds = lineupForClub(state, roles.attackingClubId);
  const defendingIds = lineupForClub(state, roles.defendingClubId);
  const eventPlayer = playerById(db, event.playerId);
  const attacker = eventPlayer?.clubId === roles.attackingClubId
    ? eventPlayer
    : choosePlayer(attackingIds, db, random, ['ATT', 'MID']);
  const creator = choosePlayer(attackingIds, db, random, ['MID', 'DEF'], new Set(attacker ? [attacker.id] : []));
  const keeper = goalkeeperFor(state, db, roles.defendingClubId);
  const defenderGroups = subtype === 'press_regain' || subtype === 'second_ball_win' ? ['MID', 'DEF'] : ['DEF', 'MID'];
  const defender = choosePlayer(defendingIds, db, random, defenderGroups, new Set(keeper ? [keeper.id] : []));
  const side = sideForSubtype(subtype, random);
  const zone = zoneForSubtype(subtype, side);
  const facts = {
    version: STRUCTURED_FLOW_VERSION,
    sequenceId: `${state.fixtureId}:${event.minute}:${event.clubId}:flow:${serial}`,
    sourceEventType: event.type,
    category: ['press_regain', 'second_ball_win'].includes(subtype) ? 'turnover' : ['forced_back'].includes(subtype) ? 'recycle' : 'broken_attack',
    phase: 'resolution',
    action: actionForSubtype(subtype),
    subtype,
    attackingClubId: roles.attackingClubId,
    defendingClubId: roles.defendingClubId,
    possessionClubId: roles.possessionClubId,
    attackerId: attacker?.id || null,
    creatorId: creator?.id || null,
    targetPlayerId: attacker?.id || null,
    defenderId: defender?.id || null,
    keeperId: keeper?.id || null,
    side,
    zone,
    pressure: pressureFor(random, subtype),
    outcome: outcomeForSubtype(subtype),
    contextTags: contextTagsFor(state, roles, subtype, memory, defender?.id || null)
  };
  facts.beats = buildBeats(facts);
  return facts;
}

function ensureMemory(state) {
  state.structuredFlowMemory ||= { version: STRUCTURED_FLOW_VERSION, defenderActions: {}, teamBreakdowns: {}, history: [] };
  state.structuredFlowMemory.version = STRUCTURED_FLOW_VERSION;
  state.structuredFlowMemory.defenderActions ||= {};
  state.structuredFlowMemory.teamBreakdowns ||= {};
  state.structuredFlowMemory.history ||= [];
  return state.structuredFlowMemory;
}

function updateMemory(memory, facts, minute) {
  if (facts.defenderId && facts.outcome !== 'recycled') {
    memory.defenderActions[facts.defenderId] = Number(memory.defenderActions[facts.defenderId] || 0) + 1;
  }
  if (facts.attackingClubId && facts.outcome !== 'recycled') {
    memory.teamBreakdowns[facts.attackingClubId] = Number(memory.teamBreakdowns[facts.attackingClubId] || 0) + 1;
  }
  memory.history.push({ minute, attackingClubId: facts.attackingClubId, defendingClubId: facts.defendingClubId, defenderId: facts.defenderId, subtype: facts.subtype });
  if (memory.history.length > 24) memory.history.splice(0, memory.history.length - 24);
}

function mirrorIntoStoredEvent(state, event) {
  const stored = [...(state.events || [])].reverse().find(item =>
    item.minute === event.minute && item.type === event.type && item.clubId === event.clubId &&
    item.playerId === event.playerId && !item.flow && !item.attack
  );
  if (!stored) return;
  for (const key of ['sequenceId', 'phase', 'action', 'subtype', 'outcome', 'lines', 'text']) {
    if (event[key] !== undefined) stored[key] = clone(event[key]);
  }
  stored.flow = clone(event.flow);
}

export function annotateStructuredFlowEvents(state, events, db) {
  const memory = ensureMemory(state);
  let serial = Number(state.structuredFlowSerial || 0);
  for (const event of events || []) {
    if (event?.attack || !ELIGIBLE_TYPES.has(event?.type) || !event?.clubId) continue;
    const facts = deriveStructuredFlowFacts(state, event, db, serial, memory);
    serial += 1;
    if (!facts) continue;
    event.flow = facts;
    event.sequenceId = facts.sequenceId;
    event.phase = facts.phase;
    event.action = facts.action;
    event.subtype = facts.subtype;
    event.outcome = facts.outcome;
    event.lines = fallbackFlowLines(event, facts, db);
    event.text = event.lines.join(' ');
    updateMemory(memory, facts, event.minute);
    mirrorIntoStoredEvent(state, event);
  }
  state.structuredFlowSerial = serial;
  state.structuredFlowVersion = STRUCTURED_FLOW_VERSION;
  return { state, events };
}

export function createInteractiveMatch(career, db) {
  const state = baseCreateInteractiveMatch(career, db);
  state.structuredFlowSerial = 0;
  state.structuredFlowVersion = STRUCTURED_FLOW_VERSION;
  ensureMemory(state);
  return state;
}

export function advanceInteractiveMatch(inputState, career, db) {
  const result = baseAdvanceInteractiveMatch(inputState, career, db);
  return annotateStructuredFlowEvents(result.state, result.events, db);
}

export function completeInteractiveRound(career, inputState, db) {
  return baseCompleteInteractiveRound(career, inputState, db);
}

export function makeSubstitution(inputState, outId, inId, db, career = {}) {
  return baseMakeSubstitution(inputState, outId, inId, db, career);
}
