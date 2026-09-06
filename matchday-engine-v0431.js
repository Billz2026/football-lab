import './match-centre-v0451.js?v=0.4.5.1';
import {
  ROLE_DEFINITIONS,
  advanceInteractiveMatch as baseAdvanceInteractiveMatch,
  completeInteractiveRound as baseCompleteInteractiveRound,
  createInteractiveMatch as baseCreateInteractiveMatch,
  getUserShape,
  makeSubstitution as baseMakeSubstitution
} from './matchday-engine-v043.js';

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
} from './matchday-engine-v043.js';

export const LIVE_ENGINE_VERSION = 10;
export const XG_MODEL = Object.freeze({
  version: 2,
  method: 'shot-derived-contextual',
  spatial: false,
  bigChanceThreshold: 0.30
});

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round2 = value => Math.round(Number(value || 0) * 100) / 100;
const DIRECT_SHOT_TYPES = new Set(['goal', 'save', 'woodwork', 'miss']);

function playerById(db, id) {
  return db.players.find(player => player.id === id);
}

function positionCodes(player) {
  const raw = String(player?.primaryPosition || '').toUpperCase();
  return new Set(raw.split(/[^A-Z]+/).filter(Boolean));
}

function suitability(player, family) {
  if (!player) return -100;
  const codes = positionCodes(player);
  const group = player.positionGroup;
  let score = 0;
  if (family === 'GK') score = group === 'GK' ? 100 : -100;
  else if (family === 'CB') score = group === 'DEF' ? 45 : group === 'MID' ? 2 : -30;
  else if (family === 'FB' || family === 'WB') score = group === 'DEF' ? 38 : group === 'MID' ? 18 : -22;
  else if (family === 'DM') score = group === 'MID' ? 40 : group === 'DEF' ? 18 : -20;
  else if (family === 'CM') score = group === 'MID' ? 45 : group === 'ATT' ? 10 : group === 'DEF' ? 8 : -25;
  else if (family === 'AM') score = group === 'MID' ? 40 : group === 'ATT' ? 28 : -22;
  else if (family === 'W') score = group === 'ATT' ? 42 : group === 'MID' ? 34 : group === 'DEF' ? 4 : -25;
  else if (family === 'ST') score = group === 'ATT' ? 50 : group === 'MID' ? 8 : -30;

  const exact = {
    GK: ['GK'],
    CB: ['DC', 'CB'],
    FB: ['DR', 'DL', 'RB', 'LB'],
    WB: ['WBR', 'WBL', 'RWB', 'LWB', 'DR', 'DL'],
    DM: ['DM', 'DMC'],
    CM: ['MC', 'CM'],
    AM: ['AMC', 'AM'],
    W: ['AMR', 'AML', 'MR', 'ML', 'RW', 'LW'],
    ST: ['ST', 'CF']
  }[family] || [];

  if (exact.some(code => codes.has(code))) score += 32;
  return Math.round(score + (player.currentAbility || 100) / 20);
}

function readinessFor(career) {
  const ids = career.lineupIds || [];
  const statuses = ids.map(id => career.playerStatus?.[id]).filter(Boolean);
  const sharpness = statuses.length
    ? statuses.reduce((sum, status) => sum + (status.sharpness ?? 88), 0) / statuses.length
    : 88;
  const familiarity = career.preseason?.tacticalFamiliarity ?? 90;
  const factor = clamp(0.90 + sharpness / 1800 + familiarity / 1800, 0.95, 1.02);
  return { sharpness: Math.round(sharpness), familiarity: Math.round(familiarity), factor };
}

function adjustedDatabase(db, userClubId, factor) {
  if (Math.abs(factor - 1) < 0.001) return db;
  return {
    ...db,
    players: db.players.map(player => player.clubId === userClubId
      ? { ...player, currentAbility: (player.currentAbility || 100) * factor }
      : player)
  };
}

function ensureXgState(state) {
  if (!state?.stats) return state;
  for (const side of ['home', 'away']) {
    state.stats[side] ||= {};
    if (!Number.isFinite(state.stats[side].xG)) state.stats[side].xG = 0;
    if (!Number.isFinite(state.stats[side].bigChances)) state.stats[side].bigChances = 0;
    if (!Number.isFinite(state.stats[side].xgShots)) state.stats[side].xgShots = 0;
  }
  state.xgModel ||= {
    version: XG_MODEL.version,
    method: XG_MODEL.method,
    spatial: XG_MODEL.spatial,
    note: 'Shot coordinates are not yet simulated; xG is derived from generated chance context.'
  };
  state.xgModel.version = XG_MODEL.version;
  return state;
}

function exposeXg(state) {
  if (typeof window === 'undefined' || !state?.stats) return;
  window.__flmLiveXg = {
    fixtureId: state.fixtureId,
    minute: state.minute,
    home: round2(state.stats.home.xG),
    away: round2(state.stats.away.xG),
    homeBigChances: state.stats.home.bigChances || 0,
    awayBigChances: state.stats.away.bigChances || 0,
    model: state.xgModel
  };
  window.dispatchEvent(new CustomEvent('flm:live-xg', { detail: window.__flmLiveXg }));
}

function chanceText(event) {
  return `${event?.text || ''} ${(event?.lines || []).join(' ')}`.toLowerCase();
}

function eventRepresentsShot(event) {
  if (DIRECT_SHOT_TYPES.has(event?.type)) return true;
  if (event?.type !== 'corner') return false;
  const text = chanceText(event);
  // attackSequence can end in a blocked shot and a corner. crossSequence can also
  // end in a corner, but that is not recorded as a shot. Only the former belongs
  // in xG accounting.
  return /shot is blocked|drives toward goal/.test(text);
}

function contextualXg(event) {
  const text = chanceText(event);
  // Chance quality is based on the situation that generated the attempt. The
  // outcome itself (goal/save/miss) does not make the xG higher or lower.
  if (/penalt/.test(text)) return 0.76;
  if (/six[- ]yard|open goal|tap[- ]?in/.test(text)) return 0.58;
  if (/in behind|is through|one[- ]on[- ]one|clear through/.test(text)) return 0.34;
  if (/close range|point[- ]blank/.test(text)) return 0.31;
  if (/header|headed|cross/.test(text)) return 0.13;
  if (/edge of the area|edge of area|lets fly|long range|distance/.test(text)) return 0.06;
  if (/blocked|drives toward goal/.test(text)) return 0.055;
  if (/pocket of space|clever pass|attacks the space|breaks forward/.test(text)) return 0.12;
  return 0.10;
}

function attachEventXg(state, event, value) {
  event.xg = round2(value);
  const stored = [...(state.events || [])].reverse().find(item =>
    item.minute === event.minute && item.type === event.type &&
    item.clubId === event.clubId && item.playerId === event.playerId &&
    !Number.isFinite(item.xg)
  );
  if (stored) stored.xg = event.xg;
}

function annotateNewShots(state, events, beforeShots) {
  for (const side of ['home', 'away']) {
    const after = Number(state.stats[side].shots || 0);
    let remaining = Math.max(0, after - Number(beforeShots[side] || 0));
    if (!remaining) continue;

    const clubId = side === 'home' ? state.homeClubId : state.awayClubId;
    const candidates = (events || []).filter(event => event.clubId === clubId && eventRepresentsShot(event));
    for (const event of candidates) {
      if (!remaining) break;
      // The event ledger is authoritative. Store a two-decimal shot value first,
      // then derive aggregate xG from exactly those stored values so the headline
      // number can always be reconstructed from the match history without drift.
      const xg = round2(contextualXg(event));
      state.stats[side].xG = round2(state.stats[side].xG + xg);
      state.stats[side].xgShots += 1;
      if (xg >= XG_MODEL.bigChanceThreshold) state.stats[side].bigChances += 1;
      attachEventXg(state, event, xg);
      remaining -= 1;
    }

    // Do not silently fabricate xG for a shot that has no auditable shot event.
    // Current engine paths all emit explicit shot events; leaving xgShots behind the
    // shot counter makes any future broken path fail the lock tests instead of hiding it.
  }
}

export function createInteractiveMatch(career, db) {
  const state = ensureXgState(baseCreateInteractiveMatch(career, db));
  state.liveEngineVersion = LIVE_ENGINE_VERSION;
  state.userReadiness = readinessFor(career);
  exposeXg(state);
  return state;
}

export function advanceInteractiveMatch(inputState, career, db) {
  const prepared = ensureXgState(clone(inputState));
  const beforeShots = {
    home: Number(prepared.stats.home.shots || 0),
    away: Number(prepared.stats.away.shots || 0)
  };
  const factor = prepared.userReadiness?.factor ?? readinessFor(career).factor;
  const result = baseAdvanceInteractiveMatch(prepared, career, adjustedDatabase(db, prepared.userClubId || career.clubId, factor));
  const state = ensureXgState(result.state);
  state.liveEngineVersion = LIVE_ENGINE_VERSION;
  state.userReadiness = prepared.userReadiness || readinessFor(career);
  annotateNewShots(state, result.events, beforeShots);
  exposeXg(state);
  return { state, events: result.events };
}

export function completeInteractiveRound(career, inputState, db) {
  const state = ensureXgState(clone(inputState));
  exposeXg(state);
  return baseCompleteInteractiveRound(career, state, db);
}

export function makeSubstitution(inputState, outId, inId, db, career = {}) {
  const beforeShape = clone(getUserShape(inputState, career, db));
  const vacated = beforeShape.assignments.find(item => item.playerId === outId);
  const result = baseMakeSubstitution(inputState, outId, inId, db, career);

  if (!vacated) return result;

  const state = ensureXgState(result.state);
  const slot = beforeShape.slots.find(item => item.id === vacated.slotId);
  const nextShape = clone(beforeShape);
  const assignment = nextShape.assignments.find(item => item.slotId === vacated.slotId);
  assignment.playerId = inId;
  assignment.suitability = suitability(playerById(db, inId), slot.family);

  state.userShape = nextShape;
  state.playerDuties ||= {};
  state.playerDuties[inId] = ROLE_DEFINITIONS[assignment.role]?.duty || 'Support';

  result.event.lines = [
    ...(result.event.lines || []),
    `${playerById(db, inId)?.name || 'The substitute'} takes over at ${slot.label} as ${assignment.role}.`
  ];
  result.event.text = result.event.lines.join(' ');
  exposeXg(state);

  return { state, event: result.event };
}
