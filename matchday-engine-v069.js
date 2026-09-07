import * as base from './matchday-structured-attacks-v1.js?v=1.0.0';
import { applyMatchDrama, MATCH_DRAMA_VERSION } from './match-drama-v3.js?v=3.0.0';

export {
  FORMATION_LAYOUTS,
  MAX_SUBSTITUTIONS,
  ROLE_DEFINITIONS,
  TACTIC_OPTIONS,
  STRUCTURED_ATTACK_VERSION,
  STRUCTURED_XG_MODEL,
  assignPlayersToFormation,
  changeTactics,
  getOpponentSnapshot,
  getUserShape,
  setPlayerDuty,
  setPlayerRole,
  swapShapePlayers
} from './matchday-structured-attacks-v1.js?v=1.0.0';

export const MATCH_RULES_VERSION = '0.7.2';
export const MATCH_DRAMA_ENGINE_VERSION = MATCH_DRAMA_VERSION;
export const MATCH_STRUCTURED_ATTACK_VERSION = base.STRUCTURED_ATTACK_VERSION;
export const PREMIER_LEAGUE_BENCH_LIMIT = 9;
export const PREMIER_LEAGUE_SUBSTITUTION_LIMIT = 5;
export const PREMIER_LEAGUE_WINDOW_LIMIT = 3;
export const FRIENDLY_SUBSTITUTION_LIMIT = 11;

const clone = value => JSON.parse(JSON.stringify(value));
const round2 = value => Math.round(Number(value || 0) * 100) / 100;

function fixtureForState(career = {}, state = {}) {
  const fixture = (career.fixtures || []).flat().find(item => item?.id === state.fixtureId);
  return fixture || {
    id: state.fixtureId,
    type: state.fixtureType || '',
    competitionName: state.competitionName || career.competitionName || ''
  };
}

export function isFriendlyMatch(fixture = {}) {
  const text = `${fixture.type || ''} ${fixture.competitionName || ''} ${fixture.name || ''}`.toLowerCase();
  return /friendly|pre[- ]?season/.test(text);
}

export function substitutionRulesForFixture(fixture = {}) {
  if (isFriendlyMatch(fixture)) {
    return Object.freeze({
      kind: 'friendly',
      benchLimit: null,
      maxSubstitutions: FRIENDLY_SUBSTITUTION_LIMIT,
      maxInPlayWindows: null,
      halfTimeUsesWindow: false,
      reentryAllowed: false
    });
  }
  return Object.freeze({
    kind: 'competitive',
    benchLimit: PREMIER_LEAGUE_BENCH_LIMIT,
    maxSubstitutions: PREMIER_LEAGUE_SUBSTITUTION_LIMIT,
    maxInPlayWindows: PREMIER_LEAGUE_WINDOW_LIMIT,
    halfTimeUsesWindow: false,
    reentryAllowed: false
  });
}

function userLineup(state) {
  return state.userClubId === state.homeClubId ? state.homeLineupIds : state.awayLineupIds;
}

function availableUserSquad(career, db, state) {
  const lineup = new Set(userLineup(state) || []);
  return (db.players || [])
    .filter(player => player.clubId === state.userClubId && !player.isPlaceholder && !lineup.has(player.id))
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0));
}

function initialiseBenchPlayer(state, career, id) {
  state.conditions ||= {};
  state.ratings ||= {};
  state.minutesPlayed ||= {};
  if (!Number.isFinite(Number(state.conditions[id]))) state.conditions[id] = career.playerStatus?.[id]?.condition ?? 100;
  if (!Number.isFinite(Number(state.ratings[id]))) state.ratings[id] = 6.5;
  if (!Number.isFinite(Number(state.minutesPlayed[id]))) state.minutesPlayed[id] = 0;
}

function applyRules(inputState, career, db) {
  const state = inputState;
  const fixture = fixtureForState(career, state);
  const rules = substitutionRulesForFixture(fixture);
  state.fixtureType = fixture.type || state.fixtureType || '';
  state.competitionName = fixture.competitionName || state.competitionName || '';
  state.matchRulesVersion = MATCH_RULES_VERSION;
  state.matchDramaVersion = MATCH_DRAMA_ENGINE_VERSION;
  state.matchRulesKind = rules.kind;
  state.substitutionLimit = rules.maxSubstitutions;
  state.substitutionWindowLimit = rules.maxInPlayWindows;
  state.substitutionWindowMinutes ||= [];

  if (rules.kind === 'friendly') {
    state.userBenchIds = availableUserSquad(career, db, state).map(player => player.id);
  } else {
    state.userBenchIds = [...(state.userBenchIds || [])].slice(0, rules.benchLimit);
  }
  for (const id of state.userBenchIds || []) initialiseBenchPlayer(state, career, id);
  return state;
}

function publishLiveXg(state) {
  if (typeof window === 'undefined' || !state?.stats?.home || !state?.stats?.away) return;
  window.__flmLiveXg = {
    fixtureId: state.fixtureId,
    minute: state.minute,
    home: round2(state.stats.home.xG),
    away: round2(state.stats.away.xG),
    homeBigChances: Number(state.stats.home.bigChances || 0),
    awayBigChances: Number(state.stats.away.bigChances || 0),
    model: state.xgModel || { version: 1, method: 'shot-derived-contextual', spatial: false }
  };
  try { window.dispatchEvent(new CustomEvent('flm:live-xg', { detail: window.__flmLiveXg })); } catch (_) {}
}

function cloneStructuredAttack(attack) {
  if (!attack || typeof attack !== 'object') return null;
  return {
    ...attack,
    scoreBefore: attack.scoreBefore ? { ...attack.scoreBefore } : null,
    scoreAfter: attack.scoreAfter ? { ...attack.scoreAfter } : null,
    contextTags: [...(attack.contextTags || [])],
    beats: (attack.beats || []).map(beat => ({ ...beat }))
  };
}

function cloneStructuredEvent(event) {
  return {
    minute: event.minute,
    type: event.type,
    clubId: event.clubId,
    playerId: event.playerId,
    assistPlayerId: event.assistPlayerId,
    sequenceId: event.sequenceId,
    phase: event.phase,
    action: event.action,
    subtype: event.subtype,
    outcome: event.outcome,
    finishType: event.finishType,
    xg: event.xg,
    text: event.text,
    lines: Array.isArray(event.lines) ? [...event.lines] : undefined,
    attack: cloneStructuredAttack(event.attack)
  };
}

function publishStructuredCommentary(state, emittedEvents = []) {
  if (typeof window === 'undefined' || !state?.fixtureId) return;
  const existing = window.__flmLiveStateV332;
  const sameFixture = existing?.fixtureId === state.fixtureId;
  const events = sameFixture && Array.isArray(existing?.events) ? [...existing.events] : [];
  const seen = new Set(events.map(event => event?.attack?.sequenceId).filter(Boolean));
  for (const event of emittedEvents || []) {
    const sequenceId = event?.attack?.sequenceId;
    if (!sequenceId || seen.has(sequenceId)) continue;
    events.push(cloneStructuredEvent(event));
    seen.add(sequenceId);
  }
  window.__flmLiveStateV332 = {
    fixtureId: state.fixtureId,
    minute: state.minute,
    homeClubId: state.homeClubId,
    awayClubId: state.awayClubId,
    homeGoals: Number(state.homeGoals || 0),
    awayGoals: Number(state.awayGoals || 0),
    events,
    structuredCommentarySnapshotVersion: '2.1.0'
  };
  window.__flmStructuredCommentaryV2 = window.__flmLiveStateV332;
}

function isHalfTimeSubstitution(state) {
  return Number(state.minute) === 45;
}

function windowKey(state) {
  return Math.max(0, Math.floor(Number(state.minute) || 0));
}

function assertWindowAvailable(state, rules) {
  if (rules.kind !== 'competitive' || isHalfTimeSubstitution(state)) return;
  const key = windowKey(state);
  const used = [...new Set(state.substitutionWindowMinutes || [])];
  if (used.includes(key)) return;
  if (used.length >= rules.maxInPlayWindows) {
    throw new Error('You have used all three in-play substitution windows. Half-time changes do not use a window.');
  }
}

function recordWindow(state, rules) {
  if (rules.kind !== 'competitive' || isHalfTimeSubstitution(state)) return;
  const key = windowKey(state);
  state.substitutionWindowMinutes ||= [];
  if (!state.substitutionWindowMinutes.includes(key)) state.substitutionWindowMinutes.push(key);
}

export function createInteractiveMatch(career, db) {
  const state = applyRules(base.createInteractiveMatch(career, db), career, db);
  state.matchDrama ||= { version: MATCH_DRAMA_ENGINE_VERSION, serial: 0, counts: {}, atmosphere: [] };
  state.matchDrama.version = MATCH_DRAMA_ENGINE_VERSION;
  publishLiveXg(state);
  publishStructuredCommentary(state, []);
  return state;
}

export function advanceInteractiveMatch(inputState, career, db) {
  const result = base.advanceInteractiveMatch(inputState, career, db);
  let state = applyRules(result.state, career, db);
  const drama = applyMatchDrama(state, db, result.events);
  state = applyRules(drama.state, career, db);
  publishLiveXg(state);
  publishStructuredCommentary(state, result.events);
  return { ...result, state, events: [...(result.events || []), ...(drama.events || [])] };
}

export function completeInteractiveRound(career, inputState, db) {
  return base.completeInteractiveRound(career, inputState, db);
}

export function makeSubstitution(inputState, outId, inId, db, career = {}) {
  const state = applyRules(clone(inputState), career, db);
  const fixture = fixtureForState(career, state);
  const rules = substitutionRulesForFixture(fixture);
  if ((state.subbedOffIds || []).includes(inId)) throw new Error('A substituted player cannot return to the match.');
  assertWindowAvailable(state, rules);
  const result = base.makeSubstitution(state, outId, inId, db, career);
  const next = applyRules(result.state, career, db);
  recordWindow(next, rules);
  publishLiveXg(next);
  publishStructuredCommentary(next, []);
  return { ...result, state: next };
}
