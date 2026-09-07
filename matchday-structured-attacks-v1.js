import {
  advanceInteractiveMatch as baseAdvanceInteractiveMatch,
  completeInteractiveRound as baseCompleteInteractiveRound,
  createInteractiveMatch as baseCreateInteractiveMatch,
  makeSubstitution as baseMakeSubstitution
} from './matchday-engine-v0431.js?v=0.4.3.1';

export {
  FORMATION_LAYOUTS,
  MAX_SUBSTITUTIONS,
  ROLE_DEFINITIONS,
  TACTIC_OPTIONS,
  assignPlayersToFormation,
  changeTactics,
  getOpponentSnapshot,
  getUserShape,
  setPlayerDuty,
  setPlayerRole,
  swapShapePlayers
} from './matchday-engine-v0431.js?v=0.4.3.1';

export const STRUCTURED_ATTACK_VERSION = '1.0.0';
export const STRUCTURED_XG_MODEL = Object.freeze({
  version: 2,
  method: 'structured-shot-context',
  spatial: 'coarse-zones',
  bigChanceThreshold: 0.30
});

const SHOT_EVENT_TYPES = new Set(['goal', 'save', 'woodwork', 'miss']);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round2 = value => Math.round(Number(value || 0) * 100) / 100;
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

function opponentLineup(state, clubId) {
  const opponent = opponentClubId(state, clubId);
  return opponent === state.homeClubId ? (state.homeLineupIds || []) : (state.awayLineupIds || []);
}

function goalkeeperId(state, db, clubId) {
  const ids = opponentLineup(state, clubId);
  return ids.find(id => playerById(db, id)?.positionGroup === 'GK') || ids[0] || null;
}

function scoreForState(state) {
  return { home: Number(state.homeGoals || 0), away: Number(state.awayGoals || 0) };
}

function scoreBeforeEvent(state, event) {
  const after = scoreForState(state);
  const before = { ...after };
  if (event.type === 'goal') {
    if (event.clubId === state.homeClubId) before.home = Math.max(0, before.home - 1);
    if (event.clubId === state.awayClubId) before.away = Math.max(0, before.away - 1);
  }
  return before;
}

function chanceBand(event) {
  const xg = Number(event?.xg);
  if (Number.isFinite(xg)) {
    if (xg >= 0.30) return 'big';
    if (xg <= 0.08) return 'long';
    return 'normal';
  }
  return event?.type === 'goal' ? 'normal' : 'normal';
}

function distanceFor(random, band) {
  if (band === 'big') return 6 + Math.floor(random() * 8);
  if (band === 'long') return 19 + Math.floor(random() * 10);
  return 11 + Math.floor(random() * 9);
}

function shotSubtypeFor(random, band, eventType) {
  const roll = random();
  if (band === 'big') {
    if (roll < 0.22) return 'first_time';
    if (roll < 0.38) return 'header';
    if (roll < 0.47 && eventType === 'goal') return 'chip';
    return roll < 0.72 ? 'placed' : 'drive';
  }
  if (band === 'long') {
    if (roll < 0.14) return 'volley';
    if (roll < 0.55) return 'long_range_drive';
    return 'curler';
  }
  if (roll < 0.16) return 'first_time';
  if (roll < 0.29) return 'header';
  if (roll < 0.39) return 'volley';
  if (roll < 0.70) return 'placed';
  return 'drive';
}

function deliveryFor(random, subtype, band) {
  if (subtype === 'header') return pick(random, ['high_cross', 'far_post_cross', 'near_post_cross']);
  if (subtype === 'first_time') return pick(random, ['low_cross', 'cutback', 'through_ball']);
  if (band === 'long') return pick(random, ['central_combination', 'layoff', 'second_ball']);
  return pick(random, ['through_ball', 'low_cross', 'cutback', 'one_two', 'switch_then_cross', 'central_combination']);
}

function sideForDelivery(random, delivery) {
  if (['low_cross', 'cutback', 'high_cross', 'far_post_cross', 'near_post_cross', 'switch_then_cross'].includes(delivery)) {
    return random() < 0.5 ? 'left' : 'right';
  }
  return 'centre';
}

function angleFor(side, random) {
  if (side === 'centre') return random() < 0.72 ? 'central' : pick(random, ['left_half', 'right_half']);
  return side === 'left' ? pick(random, ['left_half', 'wide_left']) : pick(random, ['right_half', 'wide_right']);
}

function zoneFor(distance, side) {
  if (distance <= 7) return 'six_yard_box';
  if (distance <= 14) return side === 'centre' ? 'central_box' : `${side}_box`;
  if (distance <= 19) return side === 'centre' ? 'edge_of_box' : `${side}_channel`;
  return 'long_range';
}

function pressureFor(random, band) {
  const roll = random();
  if (band === 'big') return roll < 0.28 ? 'none' : roll < 0.66 ? 'low' : 'medium';
  if (band === 'long') return roll < 0.18 ? 'low' : roll < 0.70 ? 'medium' : 'high';
  return roll < 0.12 ? 'none' : roll < 0.38 ? 'low' : roll < 0.80 ? 'medium' : 'high';
}

function outcomeFor(random, eventType) {
  if (eventType === 'goal') return 'goal';
  if (eventType === 'save') return pick(random, ['saved_held', 'saved_parried', 'saved_tipped', 'saved_blocked', 'saved_smothered']);
  if (eventType === 'woodwork') return random() < 0.58 ? 'post' : 'crossbar';
  if (eventType === 'miss') return random() < 0.68 ? 'wide' : 'over';
  return 'unknown';
}

function heightFor(subtype, delivery) {
  if (subtype === 'header' || ['high_cross', 'far_post_cross', 'near_post_cross'].includes(delivery)) return 'high';
  if (['low_cross', 'cutback'].includes(delivery)) return 'ground';
  return 'mid';
}

function finishTypeFor(subtype, distance) {
  if (subtype === 'volley') return 'volley';
  if (subtype === 'chip') return 'chip';
  if (subtype === 'long_range_drive' && distance >= 22) return 'screamer';
  return 'normal';
}

export function structuredXgFor(facts = {}) {
  const distance = Number(facts.distance || 18);
  let value = distance <= 6 ? 0.48
    : distance <= 10 ? 0.34
      : distance <= 14 ? 0.21
        : distance <= 18 ? 0.12
          : distance <= 22 ? 0.075
            : 0.045;

  const angleMultiplier = {
    central: 1,
    left_half: 0.90,
    right_half: 0.90,
    wide_left: 0.70,
    wide_right: 0.70
  }[facts.angle] ?? 0.9;
  const pressureMultiplier = { none: 1.13, low: 1.04, medium: 0.91, high: 0.77 }[facts.pressure] ?? 0.91;
  const techniqueMultiplier = {
    placed: 1.05,
    drive: 0.96,
    first_time: 0.94,
    header: 0.78,
    volley: 0.78,
    chip: 0.82,
    long_range_drive: 0.90,
    curler: 0.88
  }[facts.subtype] ?? 1;

  return round2(clamp(value * angleMultiplier * pressureMultiplier * techniqueMultiplier, 0.03, 0.62));
}

function attemptDescription(subtype, shooter) {
  if (subtype === 'first_time') return `${shooter} meets it first time—`;
  if (subtype === 'header') return `${shooter} attacks it in the air—`;
  if (subtype === 'volley') return `${shooter} hits the volley—`;
  if (subtype === 'chip') return `${shooter} tries to lift it over the goalkeeper—`;
  if (subtype === 'long_range_drive') return `${shooter} drives one from distance—`;
  if (subtype === 'curler') return `${shooter} tries to bend it towards the far corner—`;
  if (subtype === 'placed') return `${shooter} opens up and places the shot—`;
  return `${shooter} drives the shot goalwards—`;
}

function buildupDescription(facts, team, creator, shooter) {
  const actor = creator || team;
  if (facts.delivery === 'through_ball') return `${actor} spots the run and slides the ball in behind...`;
  if (facts.delivery === 'low_cross') return `${team} work it down the ${facts.side} and fire a low ball across the area...`;
  if (facts.delivery === 'cutback') return `${team} reach the byline on the ${facts.side} and cut it back into danger...`;
  if (facts.delivery === 'high_cross') return `${team} lift a high cross into the box...`;
  if (facts.delivery === 'near_post_cross') return `${team} whip the delivery towards the near post...`;
  if (facts.delivery === 'far_post_cross') return `${team} hang the cross towards the far post...`;
  if (facts.delivery === 'one_two') return `${actor} exchange a sharp one-two and open a lane through the defence...`;
  if (facts.delivery === 'switch_then_cross') return `${team} switch play quickly before delivering from the ${facts.side}...`;
  if (facts.delivery === 'layoff') return `${shooter} receives a neat layoff outside the area...`;
  if (facts.delivery === 'second_ball') return `${team} recover the second ball and ${shooter} has a sight of goal...`;
  return `${team} combine through the middle and create a shooting lane...`;
}

function outcomeDescription(facts, team, opponent, keeper) {
  if (facts.outcome === 'goal') return `GOAL! ${team} finish the move!`;
  if (facts.outcome === 'saved_held') return `${keeper} gets behind it and holds on.`;
  if (facts.outcome === 'saved_parried') return `${keeper} can only parry it, but ${opponent} react first to the loose ball.`;
  if (facts.outcome === 'saved_tipped') return `${keeper} gets fingertips to it and turns it away.`;
  if (facts.outcome === 'saved_blocked') return `${keeper} makes himself big and blocks the effort.`;
  if (facts.outcome === 'saved_smothered') return `${keeper} is quickly down to smother the shot.`;
  if (facts.outcome === 'post') return `OFF THE POST! ${opponent} survive.`;
  if (facts.outcome === 'crossbar') return `OFF THE BAR! ${opponent} survive.`;
  if (facts.outcome === 'over') return `It climbs over the crossbar.`;
  if (facts.outcome === 'wide') return `It flashes wide of the post.`;
  return `${opponent} deal with the danger.`;
}

export function renderStructuredAttackLines(event, facts, db) {
  const team = clubName(db, event.clubId);
  const opponent = clubName(db, facts.opponentClubId);
  const shooter = playerById(db, event.playerId)?.name || 'The attacker';
  const creator = playerById(db, event.assistPlayerId)?.name || '';
  const keeper = playerById(db, facts.opponentPlayerId)?.name || 'The goalkeeper';
  return [
    buildupDescription(facts, team, creator, shooter),
    facts.pressure === 'high' ? `${shooter} has a defender tight to him.` : `${shooter} finds the shooting window.`,
    attemptDescription(facts.subtype, shooter),
    outcomeDescription(facts, team, opponent, keeper)
  ];
}

function buildBeats(event, facts) {
  return [
    {
      phase: 'buildup',
      action: ['low_cross', 'cutback', 'high_cross', 'near_post_cross', 'far_post_cross', 'switch_then_cross'].includes(facts.delivery) ? 'cross' : 'pass',
      subtype: facts.delivery,
      playerId: event.assistPlayerId || null,
      targetPlayerId: event.playerId || null,
      side: facts.side,
      height: facts.height
    },
    {
      phase: 'penetration',
      action: 'movement',
      subtype: facts.delivery === 'through_ball' ? 'run_in_behind' : 'attack_space',
      playerId: event.playerId || null,
      zoneTo: facts.zoneFrom,
      pressure: facts.pressure
    },
    {
      phase: 'attempt',
      action: 'shot',
      subtype: facts.subtype,
      playerId: event.playerId || null,
      opponentPlayerId: facts.opponentPlayerId,
      bodyPart: facts.bodyPart,
      firstTime: facts.firstTime,
      distance: facts.distance,
      angle: facts.angle,
      pressure: facts.pressure
    },
    {
      phase: 'outcome',
      action: facts.outcome.startsWith('saved_') ? 'save' : 'shot_outcome',
      subtype: facts.outcome,
      playerId: facts.outcome.startsWith('saved_') ? facts.opponentPlayerId : event.playerId || null
    }
  ];
}

export function deriveStructuredAttackFacts(state, event, db, serial = 0) {
  if (!SHOT_EVENT_TYPES.has(event?.type)) return null;
  const random = seededRandom(`${state.seed}:${state.fixtureId}:${event.minute}:${event.clubId}:${event.playerId}:${event.type}:${serial}:structured-attack-v1`);
  const band = chanceBand(event);
  const distance = distanceFor(random, band);
  const subtype = shotSubtypeFor(random, band, event.type);
  const delivery = deliveryFor(random, subtype, band);
  const side = sideForDelivery(random, delivery);
  const angle = angleFor(side, random);
  const pressure = pressureFor(random, band);
  const outcome = outcomeFor(random, event.type);
  const opponentId = opponentClubId(state, event.clubId);
  const keeper = goalkeeperId(state, db, event.clubId);
  const bodyPart = subtype === 'header' ? 'head' : (random() < 0.22 ? 'left_foot' : 'right_foot');
  const facts = {
    version: STRUCTURED_ATTACK_VERSION,
    sequenceId: `${state.fixtureId}:${event.minute}:${event.clubId}:${serial}`,
    phase: 'outcome',
    action: 'shot',
    subtype,
    delivery,
    teamId: event.clubId,
    playerId: event.playerId || null,
    targetPlayerId: event.playerId || null,
    opponentClubId: opponentId,
    opponentPlayerId: keeper,
    zoneFrom: zoneFor(distance, side),
    zoneTo: 'goal',
    side,
    height: heightFor(subtype, delivery),
    firstTime: ['first_time', 'volley', 'header'].includes(subtype),
    bodyPart,
    pressure,
    distance,
    angle,
    outcome,
    scoreBefore: scoreBeforeEvent(state, event),
    scoreAfter: scoreForState(state),
    contextTags: [],
    legacyXg: Number.isFinite(Number(event.xg)) ? Number(event.xg) : null
  };
  facts.xg = structuredXgFor(facts);
  facts.beats = buildBeats(event, facts);
  return facts;
}

function mirrorIntoStoredEvent(state, event) {
  const stored = [...(state.events || [])].reverse().find(item =>
    item.minute === event.minute && item.type === event.type && item.clubId === event.clubId &&
    item.playerId === event.playerId && !item.attack
  );
  if (!stored) return;
  for (const key of ['sequenceId', 'phase', 'action', 'subtype', 'outcome', 'finishType', 'xg', 'lines', 'text']) {
    if (event[key] !== undefined) stored[key] = clone(event[key]);
  }
  stored.attack = clone(event.attack);
}

function applyStructuredXg(state, event, oldXg, newXg) {
  if (!Number.isFinite(oldXg) || !Number.isFinite(newXg)) return;
  const side = event.clubId === state.homeClubId ? 'home' : event.clubId === state.awayClubId ? 'away' : null;
  if (!side || !state.stats?.[side]) return;
  state.stats[side].xG = round2(Math.max(0, Number(state.stats[side].xG || 0) - oldXg + newXg));
  const threshold = STRUCTURED_XG_MODEL.bigChanceThreshold;
  if (oldXg >= threshold && newXg < threshold) state.stats[side].bigChances = Math.max(0, Number(state.stats[side].bigChances || 0) - 1);
  if (oldXg < threshold && newXg >= threshold) state.stats[side].bigChances = Number(state.stats[side].bigChances || 0) + 1;
}

export function annotateStructuredAttackEvents(state, events, db) {
  let serial = Number(state.structuredAttackSerial || 0);
  for (const event of events || []) {
    if (!SHOT_EVENT_TYPES.has(event?.type)) continue;
    const oldXg = Number(event.xg);
    const facts = deriveStructuredAttackFacts(state, event, db, serial);
    serial += 1;
    if (!facts) continue;
    event.attack = facts;
    event.sequenceId = facts.sequenceId;
    event.phase = facts.phase;
    event.action = facts.action;
    event.subtype = facts.subtype;
    event.outcome = facts.outcome;
    event.finishType = finishTypeFor(facts.subtype, facts.distance);
    event.xg = facts.xg;
    event.lines = renderStructuredAttackLines(event, facts, db);
    event.text = event.lines.join(' ');
    if (Number.isFinite(oldXg)) applyStructuredXg(state, event, oldXg, facts.xg);
    mirrorIntoStoredEvent(state, event);
  }
  state.structuredAttackSerial = serial;
  state.structuredAttackVersion = STRUCTURED_ATTACK_VERSION;
  if (state.xgModel) state.xgModel = { ...state.xgModel, ...STRUCTURED_XG_MODEL };
  return { state, events };
}

export function createInteractiveMatch(career, db) {
  const state = baseCreateInteractiveMatch(career, db);
  state.structuredAttackSerial = 0;
  state.structuredAttackVersion = STRUCTURED_ATTACK_VERSION;
  if (state.xgModel) state.xgModel = { ...state.xgModel, ...STRUCTURED_XG_MODEL };
  return state;
}

export function advanceInteractiveMatch(inputState, career, db) {
  const result = baseAdvanceInteractiveMatch(inputState, career, db);
  return annotateStructuredAttackEvents(result.state, result.events, db);
}

export function completeInteractiveRound(career, inputState, db) {
  return baseCompleteInteractiveRound(career, inputState, db);
}

export function makeSubstitution(inputState, outId, inId, db, career = {}) {
  return baseMakeSubstitution(inputState, outId, inId, db, career);
}
