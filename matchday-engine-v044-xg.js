import * as base from './matchday-engine-v0431.js';

export const FORMATION_LAYOUTS = base.FORMATION_LAYOUTS;
export const MAX_SUBSTITUTIONS = base.MAX_SUBSTITUTIONS;
export const ROLE_DEFINITIONS = base.ROLE_DEFINITIONS;
export const TACTIC_OPTIONS = base.TACTIC_OPTIONS;
export const assignPlayersToFormation = base.assignPlayersToFormation;
export const changeTactics = base.changeTactics;
export const getOpponentSnapshot = base.getOpponentSnapshot;
export const getUserShape = base.getUserShape;
export const makeSubstitution = base.makeSubstitution;
export const setPlayerDuty = base.setPlayerDuty;
export const setPlayerRole = base.setPlayerRole;
export const swapShapePlayers = base.swapShapePlayers;
export const LIVE_ENGINE_VERSION = 9;

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round2 = value => Math.round(Number(value || 0) * 100) / 100;
const SHOT_TYPES = new Set(['goal', 'save', 'woodwork', 'miss', 'corner']);

function ensureXgState(inputState) {
  const state = inputState;
  if (!state?.stats) return state;
  for (const side of ['home', 'away']) {
    state.stats[side] ||= {};
    if (!Number.isFinite(state.stats[side].xG)) state.stats[side].xG = 0;
    if (!Number.isFinite(state.stats[side].bigChances)) state.stats[side].bigChances = 0;
    if (!Number.isFinite(state.stats[side].xgShots)) state.stats[side].xgShots = 0;
  }
  state.xgModel ||= {
    version: 1,
    method: 'shot-derived-contextual',
    spatial: false,
    note: 'Shot coordinates are not yet simulated; xG is derived from generated chance context.'
  };
  return state;
}

function sideForClub(state, clubId) {
  if (clubId === state.homeClubId) return 'home';
  if (clubId === state.awayClubId) return 'away';
  return null;
}

function combinedText(event) {
  return `${event?.text || ''} ${(event?.lines || []).join(' ')}`.toLowerCase();
}

function contextualXg(event) {
  const text = combinedText(event);
  // Chance quality is evaluated from the situation that generated the shot, not
  // from whether the shot happened to go in. This keeps xG outcome-independent.
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
  // Events returned by older layers usually share identity with state.events, but
  // locate defensively so xG survives any clone performed by a wrapper layer.
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
    const candidates = (events || []).filter(event => event.clubId === clubId && SHOT_TYPES.has(event.type));
    for (const event of candidates) {
      if (!remaining) break;
      const xg = contextualXg(event);
      state.stats[side].xG = round2(state.stats[side].xG + xg);
      state.stats[side].xgShots += 1;
      if (xg >= 0.30) state.stats[side].bigChances += 1;
      attachEventXg(state, event, xg);
      remaining -= 1;
    }

    // Some older engine branches can record a shot without returning a dedicated
    // shot event in that minute. Keep xG tied to those real shot deltas rather than
    // inventing extra attempts; use a conservative neutral chance value.
    while (remaining > 0) {
      state.stats[side].xG = round2(state.stats[side].xG + 0.08);
      state.stats[side].xgShots += 1;
      remaining -= 1;
    }
  }
}

export function createInteractiveMatch(career, db) {
  const state = ensureXgState(base.createInteractiveMatch(career, db));
  state.liveEngineVersion = LIVE_ENGINE_VERSION;
  return state;
}

export function advanceInteractiveMatch(inputState, career, db) {
  const prepared = ensureXgState(clone(inputState));
  const beforeShots = {
    home: Number(prepared.stats.home.shots || 0),
    away: Number(prepared.stats.away.shots || 0)
  };
  const result = base.advanceInteractiveMatch(prepared, career, db);
  const state = ensureXgState(result.state);
  state.liveEngineVersion = LIVE_ENGINE_VERSION;
  annotateNewShots(state, result.events, beforeShots);
  return { state, events: result.events };
}

export function completeInteractiveRound(career, inputState, db) {
  return base.completeInteractiveRound(career, ensureXgState(clone(inputState)), db);
}

export const XG_MODEL = Object.freeze({
  version: 1,
  method: 'shot-derived-contextual',
  spatial: false,
  bigChanceThreshold: 0.30
});
