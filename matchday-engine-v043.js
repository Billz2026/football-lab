import {
  MAX_SUBSTITUTIONS,
  TACTIC_OPTIONS,
  advanceInteractiveMatch as baseAdvanceInteractiveMatch,
  changeTactics as baseChangeTactics,
  completeInteractiveRound as baseCompleteInteractiveRound,
  createInteractiveMatch as baseCreateInteractiveMatch,
  getOpponentSnapshot as baseGetOpponentSnapshot,
  makeSubstitution as baseMakeSubstitution,
  setPlayerDuty as baseSetPlayerDuty
} from './matchday-engine-v042.js';

export { MAX_SUBSTITUTIONS, TACTIC_OPTIONS };
export const LIVE_ENGINE_VERSION = 4;

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const ROLE_DEFINITIONS = {
  Goalkeeper: { duty: 'Defend', families: ['GK'], attack: 0, control: .02, defense: .08 },
  'Sweeper Keeper': { duty: 'Support', families: ['GK'], attack: .01, control: .05, defense: .04 },
  'Central Defender': { duty: 'Defend', families: ['CB'], attack: 0, control: .01, defense: .08 },
  'Ball Playing Defender': { duty: 'Support', families: ['CB'], attack: .01, control: .06, defense: .04 },
  'Full Back': { duty: 'Support', families: ['FB', 'WB'], attack: .03, control: .03, defense: .05 },
  'Wing Back': { duty: 'Attack', families: ['FB', 'WB'], attack: .07, control: .03, defense: .01 },
  Anchor: { duty: 'Defend', families: ['DM'], attack: 0, control: .04, defense: .09 },
  'Defensive Midfielder': { duty: 'Defend', families: ['DM', 'CM'], attack: .01, control: .05, defense: .07 },
  'Central Midfielder': { duty: 'Support', families: ['CM', 'DM'], attack: .03, control: .06, defense: .03 },
  'Box-to-Box Midfielder': { duty: 'Support', families: ['CM'], attack: .05, control: .05, defense: .04 },
  Playmaker: { duty: 'Support', families: ['CM', 'AM'], attack: .05, control: .09, defense: .01 },
  'Advanced Playmaker': { duty: 'Attack', families: ['AM', 'CM'], attack: .08, control: .08, defense: 0 },
  'Shadow Striker': { duty: 'Attack', families: ['AM'], attack: .11, control: .02, defense: 0 },
  Winger: { duty: 'Attack', families: ['W'], attack: .09, control: .04, defense: 0 },
  'Inside Forward': { duty: 'Attack', families: ['W'], attack: .11, control: .02, defense: 0 },
  'Wide Midfielder': { duty: 'Support', families: ['W', 'CM'], attack: .05, control: .05, defense: .03 },
  'Advanced Forward': { duty: 'Attack', families: ['ST'], attack: .12, control: .02, defense: 0 },
  Poacher: { duty: 'Attack', families: ['ST'], attack: .14, control: 0, defense: 0 },
  'Target Man': { duty: 'Support', families: ['ST'], attack: .08, control: .05, defense: .01 }
};

const S = (id, label, family, x, y, roles) => ({ id, label, family, x, y, roles });

export const FORMATION_LAYOUTS = {
  '4-3-3': [
    S('GK','GK','GK',50,91,['Goalkeeper','Sweeper Keeper']),
    S('RB','RB','FB',82,73,['Full Back','Wing Back']), S('RCB','RCB','CB',61,77,['Central Defender','Ball Playing Defender']),
    S('LCB','LCB','CB',39,77,['Central Defender','Ball Playing Defender']), S('LB','LB','FB',18,73,['Full Back','Wing Back']),
    S('RCM','RCM','CM',65,51,['Central Midfielder','Box-to-Box Midfielder','Playmaker']), S('CM','CM','CM',50,57,['Central Midfielder','Box-to-Box Midfielder','Playmaker','Defensive Midfielder']), S('LCM','LCM','CM',35,51,['Central Midfielder','Box-to-Box Midfielder','Playmaker']),
    S('RW','RW','W',80,25,['Winger','Inside Forward','Wide Midfielder']), S('ST','ST','ST',50,17,['Advanced Forward','Poacher','Target Man']), S('LW','LW','W',20,25,['Winger','Inside Forward','Wide Midfielder'])
  ],
  '4-2-3-1': [
    S('GK','GK','GK',50,91,['Goalkeeper','Sweeper Keeper']),
    S('RB','RB','FB',82,73,['Full Back','Wing Back']), S('RCB','RCB','CB',61,77,['Central Defender','Ball Playing Defender']), S('LCB','LCB','CB',39,77,['Central Defender','Ball Playing Defender']), S('LB','LB','FB',18,73,['Full Back','Wing Back']),
    S('RDM','RDM','DM',61,58,['Defensive Midfielder','Anchor','Central Midfielder']), S('LDM','LDM','DM',39,58,['Defensive Midfielder','Anchor','Central Midfielder']),
    S('RAM','RAM','W',79,37,['Winger','Inside Forward','Wide Midfielder']), S('AM','AM','AM',50,34,['Advanced Playmaker','Shadow Striker','Playmaker']), S('LAM','LAM','W',21,37,['Winger','Inside Forward','Wide Midfielder']),
    S('ST','ST','ST',50,16,['Advanced Forward','Poacher','Target Man'])
  ],
  '4-4-2': [
    S('GK','GK','GK',50,91,['Goalkeeper','Sweeper Keeper']),
    S('RB','RB','FB',82,73,['Full Back','Wing Back']), S('RCB','RCB','CB',61,77,['Central Defender','Ball Playing Defender']), S('LCB','LCB','CB',39,77,['Central Defender','Ball Playing Defender']), S('LB','LB','FB',18,73,['Full Back','Wing Back']),
    S('RM','RM','W',80,48,['Wide Midfielder','Winger']), S('RCM','RCM','CM',61,52,['Central Midfielder','Box-to-Box Midfielder','Playmaker']), S('LCM','LCM','CM',39,52,['Central Midfielder','Box-to-Box Midfielder','Playmaker']), S('LM','LM','W',20,48,['Wide Midfielder','Winger']),
    S('RST','RST','ST',61,19,['Advanced Forward','Poacher','Target Man']), S('LST','LST','ST',39,19,['Advanced Forward','Poacher','Target Man'])
  ],
  '4-1-4-1': [
    S('GK','GK','GK',50,91,['Goalkeeper','Sweeper Keeper']),
    S('RB','RB','FB',82,73,['Full Back','Wing Back']), S('RCB','RCB','CB',61,77,['Central Defender','Ball Playing Defender']), S('LCB','LCB','CB',39,77,['Central Defender','Ball Playing Defender']), S('LB','LB','FB',18,73,['Full Back','Wing Back']),
    S('DM','DM','DM',50,62,['Anchor','Defensive Midfielder','Central Midfielder']),
    S('RM','RM','W',80,43,['Wide Midfielder','Winger']), S('RCM','RCM','CM',61,46,['Central Midfielder','Box-to-Box Midfielder','Playmaker']), S('LCM','LCM','CM',39,46,['Central Midfielder','Box-to-Box Midfielder','Playmaker']), S('LM','LM','W',20,43,['Wide Midfielder','Winger']),
    S('ST','ST','ST',50,17,['Advanced Forward','Poacher','Target Man'])
  ],
  '4-5-1': [
    S('GK','GK','GK',50,91,['Goalkeeper','Sweeper Keeper']),
    S('RB','RB','FB',82,73,['Full Back','Wing Back']), S('RCB','RCB','CB',61,77,['Central Defender','Ball Playing Defender']), S('LCB','LCB','CB',39,77,['Central Defender','Ball Playing Defender']), S('LB','LB','FB',18,73,['Full Back','Wing Back']),
    S('RM','RM','W',80,48,['Wide Midfielder','Winger']), S('RCM','RCM','CM',64,52,['Central Midfielder','Box-to-Box Midfielder','Playmaker']), S('CM','CM','DM',50,57,['Defensive Midfielder','Anchor','Central Midfielder']), S('LCM','LCM','CM',36,52,['Central Midfielder','Box-to-Box Midfielder','Playmaker']), S('LM','LM','W',20,48,['Wide Midfielder','Winger']),
    S('ST','ST','ST',50,17,['Advanced Forward','Poacher','Target Man'])
  ],
  '3-5-2': [
    S('GK','GK','GK',50,91,['Goalkeeper','Sweeper Keeper']),
    S('RCB','RCB','CB',69,75,['Central Defender','Ball Playing Defender']), S('CB','CB','CB',50,79,['Central Defender','Ball Playing Defender']), S('LCB','LCB','CB',31,75,['Central Defender','Ball Playing Defender']),
    S('RWB','RWB','WB',87,52,['Wing Back','Full Back']), S('RCM','RCM','CM',63,51,['Central Midfielder','Box-to-Box Midfielder','Playmaker']), S('CM','CM','DM',50,57,['Defensive Midfielder','Anchor','Central Midfielder']), S('LCM','LCM','CM',37,51,['Central Midfielder','Box-to-Box Midfielder','Playmaker']), S('LWB','LWB','WB',13,52,['Wing Back','Full Back']),
    S('RST','RST','ST',61,19,['Advanced Forward','Poacher','Target Man']), S('LST','LST','ST',39,19,['Advanced Forward','Poacher','Target Man'])
  ],
  '3-4-3': [
    S('GK','GK','GK',50,91,['Goalkeeper','Sweeper Keeper']),
    S('RCB','RCB','CB',69,75,['Central Defender','Ball Playing Defender']), S('CB','CB','CB',50,79,['Central Defender','Ball Playing Defender']), S('LCB','LCB','CB',31,75,['Central Defender','Ball Playing Defender']),
    S('RM','RM','WB',84,51,['Wing Back','Wide Midfielder']), S('RCM','RCM','CM',61,53,['Central Midfielder','Box-to-Box Midfielder','Playmaker']), S('LCM','LCM','CM',39,53,['Central Midfielder','Box-to-Box Midfielder','Playmaker']), S('LM','LM','WB',16,51,['Wing Back','Wide Midfielder']),
    S('RW','RW','W',78,25,['Winger','Inside Forward']), S('ST','ST','ST',50,17,['Advanced Forward','Poacher','Target Man']), S('LW','LW','W',22,25,['Winger','Inside Forward'])
  ],
  '5-3-2': [
    S('GK','GK','GK',50,91,['Goalkeeper','Sweeper Keeper']),
    S('RWB','RWB','WB',88,65,['Wing Back','Full Back']), S('RCB','RCB','CB',68,76,['Central Defender','Ball Playing Defender']), S('CB','CB','CB',50,80,['Central Defender','Ball Playing Defender']), S('LCB','LCB','CB',32,76,['Central Defender','Ball Playing Defender']), S('LWB','LWB','WB',12,65,['Wing Back','Full Back']),
    S('RCM','RCM','CM',64,49,['Central Midfielder','Box-to-Box Midfielder','Playmaker']), S('CM','CM','DM',50,56,['Anchor','Defensive Midfielder','Central Midfielder']), S('LCM','LCM','CM',36,49,['Central Midfielder','Box-to-Box Midfielder','Playmaker']),
    S('RST','RST','ST',61,20,['Advanced Forward','Poacher','Target Man']), S('LST','LST','ST',39,20,['Advanced Forward','Poacher','Target Man'])
  ]
};

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
function seededRandom(seed) {
  let state = hashString(seed) || 1;
  return () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ (value >>> 15), value | 1); value ^= value + Math.imul(value ^ (value >>> 7), value | 61); return ((value ^ (value >>> 14)) >>> 0) / 4294967296; };
}
function playerById(db,id){ return db.players.find(player=>player.id===id); }
function userSide(state){ return state.userClubId===state.homeClubId?'home':'away'; }
function lineupFor(state,side){ return side==='home'?state.homeLineupIds:state.awayLineupIds; }

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
    GK:['GK'], CB:['DC','CB'], FB:['DR','DL','RB','LB'], WB:['WBR','WBL','RWB','LWB','DR','DL'],
    DM:['DM','DMC'], CM:['MC','CM'], AM:['AMC','AM'], W:['AMR','AML','MR','ML','RW','LW'], ST:['ST','CF']
  }[family] || [];
  if (exact.some(code=>codes.has(code))) score += 32;
  return score + (player.currentAbility || 100) / 20;
}

function bestRole(slot, player) {
  if (slot.family === 'GK') return 'Goalkeeper';
  const roles = slot.roles || [];
  if (!roles.length) return 'Central Midfielder';
  const group = player?.positionGroup;
  if (group === 'ATT' && roles.includes('Poacher')) return 'Poacher';
  if (group === 'ATT' && roles.includes('Inside Forward')) return 'Inside Forward';
  if (group === 'DEF' && roles.includes('Central Defender')) return 'Central Defender';
  if (group === 'DEF' && roles.includes('Full Back')) return 'Full Back';
  return roles[0];
}

export function assignPlayersToFormation(lineupIds, formation, db, previous = null) {
  const slots = clone(FORMATION_LAYOUTS[formation] || FORMATION_LAYOUTS['4-3-3']);
  const remaining = [...lineupIds];
  const assignments = [];
  const ordered = [...slots].sort((a,b)=>(a.family==='GK'?-1:b.family==='GK'?1:0));
  for (const slot of ordered) {
    let bestIndex = 0; let bestScore = -Infinity;
    remaining.forEach((id,index)=>{
      const score = suitability(playerById(db,id), slot.family);
      if (score > bestScore) { bestScore=score; bestIndex=index; }
    });
    const [playerId] = remaining.splice(bestIndex,1);
    const prevRole = previous?.assignments?.find(item=>item.playerId===playerId)?.role;
    const role = slot.roles.includes(prevRole) ? prevRole : bestRole(slot, playerById(db,playerId));
    assignments.push({ slotId:slot.id, playerId, role, suitability:Math.round(suitability(playerById(db,playerId),slot.family)) });
  }
  return { formation, assignments: slots.map(slot=>assignments.find(a=>a.slotId===slot.id)), slots };
}

function syncDutiesFromRoles(state) {
  state.playerDuties ||= {};
  for (const assignment of state.userShape?.assignments || []) {
    const role = ROLE_DEFINITIONS[assignment.role];
    if (role) state.playerDuties[assignment.playerId] = role.duty;
  }
  return state;
}

function ensureShape(inputState, career, db) {
  const state = clone(inputState);
  const side = userSide(state);
  const lineup = lineupFor(state, side);
  const formation = state.tactics?.formation || career.tactics?.formation || '4-3-3';
  const persisted = career.tacticalSetup?.formation === formation ? career.tacticalSetup : null;
  if (!state.userShape || state.userShape.formation !== formation || state.userShape.assignments?.filter(a=>lineup.includes(a.playerId)).length !== lineup.length) {
    state.userShape = assignPlayersToFormation(lineup, formation, db, state.userShape || persisted);
  }
  return syncDutiesFromRoles(state);
}

export function getUserShape(inputState, career, db) {
  return ensureShape(inputState, career, db).userShape;
}

export function createInteractiveMatch(career, db) {
  const state = baseCreateInteractiveMatch(career, db);
  return ensureShape(state, career, db);
}

export function changeTactics(inputState, patch, career = {}, db = null) {
  const result = baseChangeTactics(inputState, patch);
  let state = result.state;
  if (db && patch.formation && patch.formation !== inputState.tactics?.formation) {
    const side = userSide(state);
    state.userShape = assignPlayersToFormation(lineupFor(state,side), state.tactics.formation, db, inputState.userShape);
    syncDutiesFromRoles(state);
    result.event.lines = [...(result.event.lines || []), `The players reorganise into a ${state.tactics.formation} shape.`];
    result.event.text = result.event.lines.join(' ');
  }
  return { state, event: result.event };
}

export function makeSubstitution(inputState, outId, inId, db, career = {}) {
  const result = baseMakeSubstitution(inputState, outId, inId, db);
  let state = ensureShape(result.state, career, db);
  const assignment = state.userShape.assignments.find(item=>item.playerId===outId);
  if (assignment) {
    assignment.playerId = inId;
    const slot = state.userShape.slots.find(item=>item.id===assignment.slotId);
    assignment.role = slot.roles.includes(assignment.role) ? assignment.role : bestRole(slot, playerById(db,inId));
    assignment.suitability = Math.round(suitability(playerById(db,inId),slot.family));
  } else {
    state.userShape = assignPlayersToFormation(lineupFor(state,userSide(state)), state.tactics.formation, db, state.userShape);
  }
  syncDutiesFromRoles(state);
  return { state, event: result.event };
}

export function setPlayerRole(inputState, slotId, role, career, db) {
  const state = ensureShape(inputState, career, db);
  const slot = state.userShape.slots.find(item=>item.id===slotId);
  if (!slot) throw new Error('Choose a valid tactical position.');
  if (!slot.roles.includes(role)) throw new Error(`${role} is not available for ${slot.label}.`);
  const assignment = state.userShape.assignments.find(item=>item.slotId===slotId);
  if (!assignment) throw new Error('That tactical position has no player assigned.');
  assignment.role = role;
  assignment.suitability = Math.round(suitability(playerById(db,assignment.playerId),slot.family));
  syncDutiesFromRoles(state);
  const p = playerById(db, assignment.playerId);
  const event = {
    minute:state.minute, type:'role-change', clubId:state.userClubId, playerId:assignment.playerId,
    text:`Role change: ${p?.name || 'Player'} — ${slot.label} / ${role}.`, lines:[`Role change: ${p?.name || 'Player'} — ${slot.label} / ${role}.`]
  };
  state.events.push(event);
  return { state, event };
}

export function swapShapePlayers(inputState, firstSlotId, secondSlotId, career, db) {
  const state = ensureShape(inputState, career, db);
  const a = state.userShape.assignments.find(item=>item.slotId===firstSlotId);
  const b = state.userShape.assignments.find(item=>item.slotId===secondSlotId);
  if (!a || !b) throw new Error('Choose two occupied tactical positions.');
  [a.playerId,b.playerId] = [b.playerId,a.playerId];
  for (const assignment of [a,b]) {
    const slot = state.userShape.slots.find(item=>item.id===assignment.slotId);
    if (!slot.roles.includes(assignment.role)) assignment.role = bestRole(slot, playerById(db,assignment.playerId));
    assignment.suitability = Math.round(suitability(playerById(db,assignment.playerId),slot.family));
  }
  syncDutiesFromRoles(state);
  const event = { minute:state.minute,type:'shape-change',clubId:state.userClubId,text:`Positional switch: ${firstSlotId} ↔ ${secondSlotId}.`,lines:[`Positional switch: ${firstSlotId} ↔ ${secondSlotId}.`] };
  state.events.push(event);
  return {state,event};
}

function roleEvent(state, career, db) {
  if (!state.userShape?.assignments?.length) return null;
  const random = seededRandom(`${state.seed}:${state.fixtureId}:roles:${state.minute}:${JSON.stringify(state.userShape.assignments.map(a=>[a.slotId,a.playerId,a.role]))}`);
  if (random() > .12) return null;
  const candidates = state.userShape.assignments.filter(a=>!state.sentOffIds?.includes(a.playerId));
  const assignment = candidates[Math.floor(random()*candidates.length)];
  const slot = state.userShape.slots.find(item=>item.id===assignment.slotId);
  const p = playerById(db,assignment.playerId);
  const role = ROLE_DEFINITIONS[assignment.role] || ROLE_DEFINITIONS['Central Midfielder'];
  const side = userSide(state);
  const fit = suitability(p,slot.family);
  const fitFactor = clamp((fit+20)/90,.35,1.2);
  let lines=[]; let type='role';

  if (fit < 18 && random() < .45) {
    state.ratings[assignment.playerId] = clamp((state.ratings[assignment.playerId]||6.5)-.07,4,10);
    lines=[`${p?.name || 'The player'} looks uncomfortable at ${slot.label}. The positional mismatch leaves space for the opposition.`];
  } else if (role.duty === 'Defend') {
    state.ratings[assignment.playerId]=clamp((state.ratings[assignment.playerId]||6.5)+.035*fitFactor,4,10);
    lines=[`${p?.name || 'The defender'} reads the danger from ${slot.label} and holds the shape as a ${assignment.role}.`];
  } else if (role.duty === 'Support') {
    state.stats[side].possessionTicks += 1;
    state.ratings[assignment.playerId]=clamp((state.ratings[assignment.playerId]||6.5)+.03*fitFactor,4,10);
    lines=[`${p?.name || 'The midfielder'} finds space from ${slot.label}, linking the play in the ${assignment.role} role.`];
  } else {
    const chance = (.18 + role.attack) * fitFactor;
    if (random() < chance) {
      state.stats[side].shots += 1;
      const onTarget = random() < .48 * fitFactor;
      if (onTarget) state.stats[side].onTarget += 1;
      if (onTarget && random() < .055 * fitFactor) {
        if (side==='home') state.homeGoals += 1; else state.awayGoals += 1;
        state.ratings[assignment.playerId]=clamp((state.ratings[assignment.playerId]||6.5)+.75,4,10);
        type='goal';
        lines=[`${p?.name || 'The attacker'} attacks the space from ${slot.label}...`, `${assignment.role.toUpperCase()}! ${p?.name || 'He'} is through!`, `GOAL! The role and position combine perfectly.`];
      } else {
        lines=[`${p?.name || 'The attacker'} breaks from ${slot.label} in the ${assignment.role} role and gets into a dangerous area.`];
      }
    } else lines=[`${p?.name || 'The attacker'} keeps stretching the defence from ${slot.label} as a ${assignment.role}.`];
  }

  const event={minute:state.minute,type,clubId:state.userClubId,playerId:assignment.playerId,text:lines.join(' '),lines};
  state.events.push(event);
  return event;
}

export function advanceInteractiveMatch(inputState, career, db) {
  const prepared = ensureShape(inputState, career, db);
  const advanced = baseAdvanceInteractiveMatch(prepared, career, db);
  let state = ensureShape(advanced.state, career, db);
  const role = roleEvent(state, career, db);
  return { state, events: role ? [...advanced.events, role] : advanced.events };
}

export function setPlayerDuty(inputState, playerId, duty, db) {
  return baseSetPlayerDuty(inputState, playerId, duty, db);
}

export function getOpponentSnapshot(inputState, db) {
  return baseGetOpponentSnapshot(inputState, db);
}

export function completeInteractiveRound(career, inputState, db) {
  const state = ensureShape(inputState, career, db);
  const finished = baseCompleteInteractiveRound(career, state, db);
  finished.tacticalSetup = {
    formation: state.userShape.formation,
    assignments: state.userShape.assignments.map(({slotId,playerId,role})=>({slotId,playerId,role}))
  };
  if (finished.lastMatch) finished.lastMatch.tacticalSetup = clone(finished.tacticalSetup);
  return finished;
}
