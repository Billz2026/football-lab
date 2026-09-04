import './match-centre-v0451.js?v=0.4.5.1';
import {
  ROLE_DEFINITIONS,
  advanceInteractiveMatch as baseAdvanceInteractiveMatch,
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
  completeInteractiveRound,
  getOpponentSnapshot,
  getUserShape,
  setPlayerDuty,
  setPlayerRole,
  swapShapePlayers
} from './matchday-engine-v043.js';

export const LIVE_ENGINE_VERSION = 8;

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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

export function createInteractiveMatch(career, db) {
  const state = baseCreateInteractiveMatch(career, db);
  state.userReadiness = readinessFor(career);
  return state;
}

export function advanceInteractiveMatch(inputState, career, db) {
  const factor = inputState.userReadiness?.factor ?? readinessFor(career).factor;
  const result = baseAdvanceInteractiveMatch(inputState, career, adjustedDatabase(db, inputState.userClubId || career.clubId, factor));
  result.state.userReadiness = inputState.userReadiness || readinessFor(career);
  return result;
}

export function makeSubstitution(inputState, outId, inId, db, career = {}) {
  const beforeShape = clone(getUserShape(inputState, career, db));
  const vacated = beforeShape.assignments.find(item => item.playerId === outId);
  const result = baseMakeSubstitution(inputState, outId, inId, db, career);

  if (!vacated) return result;

  const state = result.state;
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

  return { state, event: result.event };
}
