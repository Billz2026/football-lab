import { FORMATION_LAYOUTS, TACTIC_OPTIONS, assignPlayersToFormation } from './matchday-engine-v0431.js?v=0.4.3.1';
import { curatedKeyPlayerIds } from './key-players-v048.js?v=0.4.8';

const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-v048-tactics-style';
let database = null;
let queued = false;
let enhancing = false;

const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;
const playerById = (db, id) => db.players.find(player => player.id === id);
const displayName = player => {
  if (!player) return '—';
  const first = String(player.firstName || '').trim();
  const last = String(player.lastName || '').trim();
  const full = String(player.name || '').replace(',', '').trim();
  if (first.length > 1 && last) return `${first} ${last}`;
  if (first.length <= 1 && full) return full;
  if (full && !/^[A-Za-zÀ-ÖØ-öø-ÿ]\.?\s/.test(full)) return full;
  return [first, last].filter(Boolean).join(' ') || full || '—';
};
const clean = value => String(value || '').toUpperCase().replaceAll(' ', '');

function persist(c) {
  c.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = 'SAVED';
}

function statusFor(c, player) {
  const status = c.playerStatus?.[player.id] || {};
  return {
    condition: Math.round(status.condition ?? 100),
    sharpness: Math.round(status.sharpness ?? 88)
  };
}

function sideOf(slot) {
  const id = String(slot?.id || '');
  if (/^(R|RAM|RCM|RDM|RWB|RB|RM|RW|RST)/.test(id)) return 'R';
  if (/^(L|LAM|LCM|LDM|LWB|LB|LM|LW|LST)/.test(id)) return 'L';
  return 'C';
}

function positionSets(slot) {
  const side = sideOf(slot), family = slot?.family;
  if (family === 'GK') return { natural:['GK'], cover:[] };
  if (family === 'CB') return { natural:['DC','CB'], cover:side==='R'?['DR','RB','DMC','DM']:side==='L'?['DL','LB','DMC','DM']:['DMC','DM','DR','DL'] };
  if (family === 'FB') return side==='R'?{natural:['DR','RB'],cover:['WBR','RWB','MR','AMR']}:{natural:['DL','LB'],cover:['WBL','LWB','ML','AML']};
  if (family === 'WB') return side==='R'?{natural:['WBR','RWB'],cover:['DR','RB','MR','AMR']}:{natural:['WBL','LWB'],cover:['DL','LB','ML','AML']};
  if (family === 'DM') return { natural:['DMC','DM'], cover:['MC','CM','DC','CB'] };
  if (family === 'CM') return { natural:['MC','CM'], cover:['DMC','DM','AMC','AM'] };
  if (family === 'AM') return { natural:['AMC','AM'], cover:['MC','CM','ST','FC','CF'] };
  if (family === 'W') return side==='R'?{natural:['AMR','MR','RW','FR'],cover:['WBR','RWB','ST','FC','AMC']}:{natural:['AML','ML','LW','FL'],cover:['WBL','LWB','ST','FC','AMC']};
  if (family === 'ST') return { natural:['ST','FC','CF','SC'], cover:['AMC','AMR','AML','AM'] };
  return { natural:[], cover:[] };
}

function fitFor(player, slot) {
  if (!player || !slot) return 'unfamiliar';
  const sets = positionSets(slot);
  const primary = clean(player.primaryPosition);
  const alternatives = (player.secondaryPositions || []).map(clean);
  if (sets.natural.includes(primary)) return 'preferred';
  if (alternatives.some(code => sets.natural.includes(code))) return 'secondary';
  if (sets.cover.includes(primary) || alternatives.some(code => sets.cover.includes(code))) return 'secondary';
  return 'unfamiliar';
}

function fitText(fit) {
  return fit === 'preferred' ? 'Natural' : fit === 'secondary' ? 'Can play' : 'Out of position';
}

function defaultTactics(c) {
  return {
    formation: c.tactics?.formation || '4-3-3',
    mentality: c.tactics?.mentality || 'Balanced',
    pressing: c.tactics?.pressing || 'Standard',
    tempo: c.tactics?.tempo || 'Standard',
    passing: c.tactics?.passing || 'Mixed',
    width: c.tactics?.width || 'Balanced',
    defensiveLine: c.tactics?.defensiveLine || 'Standard'
  };
}

function initialShape(c, db, formation) {
  const saved = c.tacticalSetup?.formation === formation ? c.tacticalSetup : null;
  const ids = (c.lineupIds || []).filter(Boolean);
  if (!ids.length) return emptyShape(formation);
  const shape = assignPlayersToFormation(ids, formation, db, saved);
  shape.assignments = shape.slots.map((slot, index) => {
    const assignment = shape.assignments[index];
    return assignment || { slotId:slot.id, playerId:null, role:slot.roles?.[0] || '' };
  });
  return shape;
}

function emptyShape(formation) {
  const slots = (FORMATION_LAYOUTS[formation] || FORMATION_LAYOUTS['4-3-3']).map(slot => ({ ...slot }));
  return { formation, slots, assignments:slots.map(slot => ({ slotId:slot.id, playerId:null, role:slot.roles?.[0] || '' })) };
}

function shapeForIds(ids, formation, db, previous) {
  const cleanIds = (ids || []).filter(Boolean);
  if (!cleanIds.length) return emptyShape(formation);
  const shape = assignPlayersToFormation(cleanIds, formation, db, previous);
  shape.assignments = shape.slots.map((slot, index) => {
    const assignment = shape.assignments[index];
    return assignment || { slotId:slot.id, playerId:null, role:slot.roles?.[0] || '' };
  });
  return shape;
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
  .version-chip{font-size:0!important}.version-chip::after{content:'V0.4.10';font-size:11px}.footer-build{font-size:0!important}.footer-build::after{content:'V0.4.10 · TACTICS UX';font-size:10px}
  .v048-tactics{display:grid;gap:10px}.v048-topbar{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px;border:1px solid #ffffff16;border-radius:8px;background:#090909}.v048-form-select{display:flex;align-items:center;gap:8px}.v048-form-select span,.v048-mini-label{font-size:8px;font-weight:950;letter-spacing:.1em;color:#9b948a}.v048-form-select select,.v048-role-editor select{min-height:34px;border:1px solid #ffffff22;border-radius:5px;background:#151515;color:#fff;padding:0 9px;font-weight:850}.v048-tabs{display:flex;justify-content:center;gap:3px}.v048-tabs button,.v048-segment button,.v048-plan-actions button,.v048-quick button{border:1px solid #ffffff18;background:#111;color:#c9c5bd;min-height:34px;padding:0 11px;border-radius:5px;font-size:8px;font-weight:950;cursor:pointer}.v048-tabs button.is-active,.v048-segment button.is-active{border-color:#e0c64b;color:#fff2a0;background:#251c08}.v048-plan-actions{display:flex;gap:4px}.v048-plan-actions .primary{background:#e2c24b;color:#0b0904;border-color:#e2c24b}
  .v048-workspace{display:grid;grid-template-columns:minmax(310px,.78fr) minmax(470px,1.22fr);gap:10px;min-height:650px}.v048-squad{display:grid;grid-template-rows:auto 1fr;border:1px solid #ffffff15;border-radius:8px;background:#060606;overflow:hidden}.v048-squad-head{display:grid;grid-template-columns:48px minmax(0,1fr) 72px;gap:7px;padding:9px 10px;border-bottom:1px solid #ffffff12;background:#101010;color:#8b857b;font-size:8px;font-weight:950;letter-spacing:.08em}.v048-squad-list{overflow:auto;max-height:610px}.v048-squad-row{width:100%;display:grid;grid-template-columns:48px minmax(0,1fr) 72px;gap:7px;align-items:center;min-height:43px;padding:5px 10px;border:0;border-bottom:1px solid #ffffff0e;background:transparent;color:#ddd;text-align:left;cursor:grab}.v048-squad-row:hover,.v048-squad-row.is-picked{background:#ffffff08}.v048-squad-row.is-selected{outline:1px solid #e2c24b;outline-offset:-1px;background:#392d0a}.v048-pos{color:#d8cb51;font-size:9px;font-weight:950}.v048-name{min-width:0}.v048-name strong{display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px}.v048-name small{display:block;margin-top:2px;color:#777;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v048-star{color:#f5dd48}.v048-condition{text-align:right;font-size:8px}.v048-condition strong{display:block;color:#e5e0d6;font-size:9px}.v048-condition small{color:#777;font-size:7px}
  .v048-board{display:grid;grid-template-rows:auto minmax(520px,1fr) auto;border:1px solid #ffffff15;border-radius:8px;overflow:hidden;background:#080808}.v048-instructions{min-height:60px;padding:8px 9px;border-bottom:1px solid #ffffff12;background:#0d0d0d}.v048-instruction-panel{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.v048-instruction-title{min-width:80px;color:#d9c852;font-size:8px;font-weight:950;letter-spacing:.1em}.v048-segment{display:flex;gap:3px;flex-wrap:wrap}.v048-pitch{position:relative;min-height:525px;margin:10px;border:2px solid #2f783b;background:repeating-linear-gradient(90deg,#0b4b1d 0 12.5%,#0d5521 12.5% 25%);overflow:hidden}.v048-pitch:before{content:'';position:absolute;inset:3%;border:1px solid #ffffff55;pointer-events:none}.v048-pitch:after{content:'';position:absolute;left:3%;right:3%;top:50%;border-top:1px solid #ffffff55;pointer-events:none}.v048-centre-circle{position:absolute;left:50%;top:50%;width:90px;height:90px;border:1px solid #ffffff55;border-radius:50%;transform:translate(-50%,-50%)}.v048-box{position:absolute;left:25%;width:50%;height:17%;border:1px solid #ffffff55}.v048-box.top{top:3%;border-top:0}.v048-box.bottom{bottom:3%;border-bottom:0}.v048-player{position:absolute;z-index:3;transform:translate(-50%,-50%);width:112px;min-height:48px;padding:5px 6px;border:2px solid;border-radius:7px;background:#101010e8;color:#fff;text-align:center;cursor:grab;box-shadow:0 3px 12px #0009}.v048-player.fit-preferred{border-color:#48bb69}.v048-player.fit-secondary{border-color:#de9638}.v048-player.fit-unfamiliar{border-color:#d64d4d}.v048-player.is-selected{box-shadow:0 0 0 2px #f2d54f,0 4px 15px #000}.v048-player.is-drop{transform:translate(-50%,-50%) scale(1.05);background:#2b2612}.v048-player .slot{display:block;color:#f0de58;font-size:7px;font-weight:950}.v048-player strong{display:block;margin-top:2px;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v048-player small{display:block;margin-top:2px;color:#aaa;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v048-player .v048-star{display:inline}
  .v048-board-footer{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;min-height:60px;padding:8px 10px;border-top:1px solid #ffffff12;background:#0c0c0c}.v048-role-editor{display:flex;align-items:center;gap:8px;min-width:0}.v048-role-editor .copy{min-width:150px}.v048-role-editor strong{display:block;font-size:9px}.v048-role-editor small{display:block;margin-top:2px;color:#888;font-size:7px}.v048-help{color:#817b71;font-size:8px}.v048-legend{display:flex;gap:9px}.v048-legend span{font-size:7px;color:#8e877d}.v048-legend i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:4px}.v048-legend .g{background:#48bb69}.v048-legend .o{background:#de9638}.v048-legend .r{background:#d64d4d}.v048-toast{position:fixed;z-index:9999;left:50%;bottom:25px;transform:translateX(-50%);padding:8px 12px;border-radius:5px;background:#1b1b1b;color:#eee;border:1px solid #ffffff22;font-size:9px;font-weight:850}
  @media(max-width:980px){.v048-workspace{grid-template-columns:1fr}.v048-squad-list{max-height:260px}.v048-pitch{min-height:520px}.v048-topbar{grid-template-columns:1fr}.v048-tabs{justify-content:flex-start}.v048-plan-actions{justify-content:flex-start}}@media(max-width:620px){.v048-workspace{display:flex;flex-direction:column}.v048-board{order:1}.v048-squad{order:2}.v048-player{width:82px}.v048-player small{display:none}.v048-pitch{min-height:480px;margin:6px}.v048-board-footer{grid-template-columns:1fr}.v048-role-editor{flex-wrap:wrap}}

  /* Compact Championship Manager match sheet. Keep the whole selection in one view. */
  .v048-tactics{gap:8px;color:#eef3f6}.v048-topbar{grid-template-columns:auto minmax(0,1fr) auto;padding:7px 8px;border:1px solid #23558e;border-radius:0;background:#071c38}.v048-form-select span,.v048-mini-label{color:#9caebe}.v048-form-select select{min-height:32px;border:1px solid #2d6dbb;border-radius:0;background:#0a2242;color:#eef3f6}.v048-tabs{display:flex;justify-content:flex-start;gap:4px}.v048-tabs button,.v048-segment button,.v048-plan-actions button,.v048-quick button{min-height:32px;border:1px solid #2d6dbb;border-radius:0;background:#0a2242;color:#c7d2dc}.v048-tabs button.is-active,.v048-segment button.is-active{border-color:#f4c342;background:#174d36;color:#f4c342}.v048-plan-actions .primary{background:#f4c342;color:#071326;border-color:#f4c342}
  .v048-workspace{grid-template-columns:minmax(360px,.78fr) minmax(620px,1.22fr);gap:8px;min-height:0;width:100%;max-width:none}.v048-squad,.v048-board{border:1px solid #23558e;border-radius:0;background:#041429}.v048-squad{grid-template-rows:1fr}.v048-squad-head{padding:7px 9px;border-bottom:1px solid #23558e;background:#0a2242;color:#f4c342}.v048-squad-list{display:grid;grid-template-rows:repeat(20,minmax(0,1fr));overflow:hidden;max-height:none}.v048-squad-row{min-height:0;padding:2px 8px;border-bottom:1px solid rgba(90,160,225,.2);background:#071c38;color:#eef3f6}.v048-squad-row:nth-child(even){background:#0a2242}.v048-squad-row:hover,.v048-squad-row.is-selected{background:#174d36}.v048-squad-row.is-picked{background:#071c38;border-left:2px solid #2d8a4e}.v048-pos{color:#f4c342}.v048-name strong{font-size:10px}.v048-name small,.v048-condition small{color:#9caebe}.v048-condition strong{color:#eef3f6}.v048-board{grid-template-rows:auto auto auto;align-content:start}.v048-instructions{min-height:0;padding:7px 9px;border-bottom:1px solid #23558e;background:#071c38}.v048-instruction-panel{gap:6px}.v048-instruction-title{color:#f4c342}.v048-help{color:#9caebe}.v048-pitch{height:clamp(470px,calc(100dvh - 360px),620px);min-height:0;aspect-ratio:auto;margin:8px;border:2px solid #2d8a4e;background:repeating-linear-gradient(90deg,#0b4b1d 0 12.5%,#0d5521 12.5% 25%)}.v048-pitch:before,.v048-pitch:after{border-color:rgba(238,243,246,.5)}.v048-centre-circle{width:15%;height:auto;aspect-ratio:1}.v048-player{width:80px;min-height:34px;padding:3px 4px;border:1px solid #55dc7c;border-radius:0;background:#071c38ee;box-shadow:0 3px 9px #0009}.v048-player .slot{color:#f4c342;font-size:6px}.v048-player strong{font-size:8px}.v048-player small{margin-top:1px;color:#9caebe;font-size:6px}.v048-player.is-drop{background:#174d36}.v048-board-footer{min-height:0;padding:7px 9px;border-top:1px solid #23558e;background:#071c38}.v048-role-editor{display:none}.v048-legend{display:none}.v048-match-sheet-head{display:flex;justify-content:space-between;align-items:center;padding:7px 9px;border-bottom:1px solid #23558e;background:#0a2242;color:#f4c342;font-size:8px;font-weight:950;letter-spacing:.09em}.v048-match-sheet-head span:last-child{color:#9caebe;font-size:7px}.v048-section-label{padding:5px 8px;color:#f4c342;background:#061326;font-size:8px;font-weight:950;letter-spacing:.1em}.v048-bench-divider{border-top:1px solid #23558e}.v048-formation-slot{color:#8ee7a8;font-size:8px;font-weight:950}.v048-squad-row.is-picked .v048-formation-slot{color:#8ee7a8}.v048-squad-row[data-v048-bench-player]{cursor:grab}.v048-squad-row.is-drop{outline:1px solid #f4c342;outline-offset:-1px}.v048-squad-row .v048-name small{display:block}.v048-clear{border-color:#c36b55!important;color:#ffd0c0!important;background:#391c22!important}.v048-slot-id{display:grid;gap:1px;justify-items:start;line-height:1}.v048-slot-id strong{color:#f4c342;font-size:10px}.v048-slot-id small{color:#8ee7a8;font-size:7px;font-weight:950}
  @media(max-width:980px){.v048-workspace{grid-template-columns:1fr}.v048-squad-list{grid-template-rows:none;max-height:260px;overflow:auto}.v048-pitch{aspect-ratio:auto;min-height:520px}.v048-topbar{grid-template-columns:1fr}.v048-tabs{justify-content:flex-start}}
  @media(max-width:620px){.v048-pitch{min-height:480px}.v048-player{width:82px}.v048-player small{display:none}}
  .v048-compact-controls{display:flex;align-items:center;gap:5px}.v048-compact-controls .v048-segment{display:flex}.v048-compact-controls .v048-segment button{padding:0 9px}.v048-squad-list{grid-template-rows:auto repeat(11,minmax(0,1fr)) auto repeat(9,minmax(0,1fr))}.v048-squad-row{grid-template-columns:42px minmax(0,1fr) 64px}.v048-squad-row .v048-name small{font-size:7px}.v048-section-label{min-height:22px}.v048-match-sheet-head{min-height:28px}.career-content:has(.v048-tactics) > *{width:100%;max-width:none}.career-content:has(.v048-tactics){padding-left:18px;padding-right:18px}
  `;
  document.head.appendChild(style);
}

function toast(message) {
  document.querySelector('.v048-toast')?.remove();
  const el = document.createElement('div');
  el.className = 'v048-toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

function patchSquadStars(root, c, db) {
  if (!root.querySelector('.v044-list')) return;
  const keyIds = curatedKeyPlayerIds(db, c.clubId);
  root.querySelectorAll('.v044-star').forEach(star => star.remove());
  root.querySelectorAll('[data-v044-row]').forEach(row => {
    if (!keyIds.has(row.dataset.v044Row)) return;
    const strong = row.querySelector('.v044-name strong');
    if (!strong || strong.querySelector('.v048-star')) return;
    const star = document.createElement('i');
    star.className = 'v048-star';
    star.title = 'Key player · curated from real-world squad importance';
    star.textContent = '★';
    strong.appendChild(star);
  });
}

function buildTactics(root, c, db) {
  const old = root.querySelector('.v044-tactics');
  if (!old || root.querySelector('.v048-tactics')) return;
  const tactics = defaultTactics(c);
  let shape = initialShape(c, db, tactics.formation);
  let tab = 'overview';
  let selectedPlayerId = null;
  let selectedSlotId = null;
  const keyIds = curatedKeyPlayerIds(db, c.clubId);
  const order = { GK:0, DEF:1, MID:2, ATT:3 };
  const squad = db.players.filter(player => player.clubId === c.clubId && !player.isPlaceholder).sort((a,b) => order[a.positionGroup]-order[b.positionGroup] || a.name.localeCompare(b.name));

  const container = document.createElement('div');
  container.className = 'v048-tactics';
  container.dataset.v048Tactics = '1';
  old.replaceWith(container);
  root.querySelector('.career-page-heading h2')?.replaceChildren(document.createTextNode('Tactics'));
  const round = root.querySelector('.career-round');
  if (round) round.textContent = 'DRAG · DROP · PLAY';

  const assignment = slotId => shape.assignments.find(item => item.slotId === slotId);
  const slot = slotId => shape.slots.find(item => item.id === slotId);
  const assignedIds = () => new Set(shape.assignments.map(item => item.playerId).filter(Boolean));

  function saveShape() {
    c.lineupIds = shape.assignments.map(item => item.playerId);
    c.tacticalSetup = {
      formation: shape.formation,
      assignments: shape.assignments.map(item => ({ slotId:item.slotId, playerId:item.playerId, role:item.role }))
    };
    c.tactics = { ...c.tactics, ...tactics };
    persist(c);
  }

  function movePlayer(playerId, targetSlotId) {
    const incoming = playerById(db, playerId);
    const targetSlot = slot(targetSlotId);
    if (!incoming || !targetSlot) return;
    if (targetSlot.family === 'GK' && incoming.positionGroup !== 'GK') { toast('A goalkeeper must occupy the GK slot.'); return; }
    if (incoming.positionGroup === 'GK' && targetSlot.family !== 'GK') { toast('Goalkeepers can only be assigned to GK.'); return; }
    const target = assignment(targetSlotId);
    const existing = shape.assignments.find(item => item.playerId === playerId);
    if (existing && existing.slotId === targetSlotId) return;
    if (existing) {
      const outgoingId = target.playerId;
      target.playerId = playerId;
      existing.playerId = outgoingId;
    } else {
      target.playerId = playerId;
    }
    selectedPlayerId = null;
    selectedSlotId = targetSlotId;
    saveShape();
    render();
  }

  function swapSlots(first, second) {
    if (!first || !second || first === second) return;
    const a = assignment(first), b = assignment(second);
    if (!a || !b) return;
    const aPlayer = playerById(db, a.playerId), bPlayer = playerById(db, b.playerId);
    const aSlot = slot(first), bSlot = slot(second);
    if ((aSlot.family === 'GK' && bPlayer?.positionGroup !== 'GK') || (bSlot.family === 'GK' && aPlayer?.positionGroup !== 'GK')) { toast('The goalkeeper must stay in the GK slot.'); return; }
    [a.playerId, b.playerId] = [b.playerId, a.playerId];
    selectedSlotId = second;
    saveShape();
    render();
  }

  function removeFromSlot(slotId) {
    const target = assignment(slotId);
    if (!target?.playerId) return;
    target.playerId = null;
    target.role = slot(slotId)?.roles?.[0] || '';
    selectedSlotId = slotId;
    selectedPlayerId = null;
    saveShape();
    render();
  }

  function moveOrSwap(sourceSlotId, targetSlotId) {
    if (!sourceSlotId || !targetSlotId || sourceSlotId === targetSlotId) return;
    const source = assignment(sourceSlotId);
    const target = assignment(targetSlotId);
    if (!source?.playerId) return;
    if (target?.playerId) swapSlots(sourceSlotId, targetSlotId);
    else movePlayer(source.playerId, targetSlotId);
  }

  function optionButtons(key, values) {
    return `<div class="v048-segment">${values.map(value => `<button type="button" class="${tactics[key]===value?'is-active':''}" data-v048-option="${esc(key)}" data-value="${esc(value)}">${esc(value)}</button>`).join('')}</div>`;
  }

  function instructionsHtml() {
    if (tab === 'overview') return `<div class="v048-instruction-panel"><span class="v048-instruction-title">MENTALITY</span>${optionButtons('mentality', TACTIC_OPTIONS.mentality)}<span class="v048-help">Defensive protects space · Attacking commits more players forward.</span></div>`;
    if (tab === 'with-ball') return `<div class="v048-instruction-panel"><span class="v048-instruction-title">WITH BALL</span><span class="v048-mini-label">PASSING</span>${optionButtons('passing', TACTIC_OPTIONS.passing)}<span class="v048-mini-label">TEMPO</span>${optionButtons('tempo', TACTIC_OPTIONS.tempo)}<span class="v048-mini-label">WIDTH</span>${optionButtons('width', TACTIC_OPTIONS.width)}</div>`;
    return `<div class="v048-instruction-panel"><span class="v048-instruction-title">WITHOUT BALL</span><span class="v048-mini-label">PRESS</span>${optionButtons('pressing', TACTIC_OPTIONS.pressing)}<span class="v048-mini-label">LINE</span>${optionButtons('defensiveLine', TACTIC_OPTIONS.defensiveLine)}</div>`;
  }

  function squadHtml() {
    const picked = assignedIds();
    const starters = shape.slots.map((s, index) => {
      const a = assignment(s.id);
      const player = a?.playerId ? playerById(db, a.playerId) : null;
      const status = player ? statusFor(c, player) : null;
      return `<button type="button" draggable="${player ? 'true' : 'false'}" class="v048-squad-row ${player ? 'is-picked' : ''}" data-v048-squad-player="${esc(player?.id || '')}" data-v048-sheet-slot="${esc(s.id)}"><span class="v048-slot-id"><strong>${index + 1}</strong><small>${esc(s.label)}</small></span><span class="v048-name"><strong>${esc(player ? displayName(player) : 'EMPTY')}</strong><small>${player ? esc(player.primaryPosition || '—') : 'Drop a player here'}</small></span><span class="v048-condition">${status ? `<strong>${status.condition}%</strong><small>${status.sharpness}% sharp</small>` : '<small>OPEN</small>'}</span></button>`;
    }).join('');
    const benchPlayers = squad.filter(player => !picked.has(player.id)).slice(0, 9);
    const bench = benchPlayers.map((player, index) => {
      const status = statusFor(c, player);
      return `<button type="button" draggable="true" class="v048-squad-row ${selectedPlayerId===player.id?'is-selected':''}" data-v048-squad-player="${esc(player.id)}" data-v048-bench-player="1"><span class="v048-slot-id"><strong>${index + 12}</strong><small>SUB</small></span><span class="v048-name"><strong>${esc(displayName(player))}${keyIds.has(player.id)?'<i class="v048-star">★</i>':''}</strong><small>${esc(player.primaryPosition || '—')}</small></span><span class="v048-condition"><strong>${status.condition}%</strong><small>${status.sharpness}% sharp</small></span></button>`;
    }).join('');
    return `<div class="v048-match-sheet-head"><span>MATCHDAY SQUAD</span><span>${picked.size} / 11 SELECTED</span></div><div class="v048-section-label">STARTING XI</div>${starters}<div class="v048-section-label v048-bench-divider">BENCH · ${Math.min(9, benchPlayers.length)}</div>${bench}`;
  }

  function pitchHtml() {
    return shape.slots.map(s => {
      const a = assignment(s.id), p = a?.playerId ? playerById(db, a.playerId) : null;
      return `<button type="button" draggable="${p ? 'true' : 'false'}" class="v048-player ${selectedSlotId===s.id?'is-selected':''}" style="left:${s.x}%;top:${s.y}%" data-v048-slot="${esc(s.id)}" data-player-id="${esc(p?.id || '')}"><span class="slot">${esc(s.label)}</span><strong>${esc(p ? displayName(p) : 'EMPTY')}${keyIds.has(p?.id)?' <i class="v048-star">★</i>':''}</strong><small>${esc(p?.primaryPosition || 'Drop player')}</small></button>`;
    }).join('');
  }

  function render() {
    container.innerHTML = `<div class="v048-topbar"><label class="v048-form-select"><span>FORMATION</span><select data-v048-formation>${Object.keys(FORMATION_LAYOUTS).map(value => `<option ${shape.formation===value?'selected':''}>${esc(value)}</option>`).join('')}</select></label><div class="v048-compact-controls"><span class="v048-mini-label">MENTALITY</span>${optionButtons('mentality', TACTIC_OPTIONS.mentality)}</div><div class="v048-plan-actions"><button type="button" data-v048-auto>AUTO XI</button><button type="button" class="v048-clear" data-v048-clear>CLEAR XI</button><button type="button" class="primary" data-v048-save>SAVE PLAN</button></div></div><div class="v048-workspace"><section class="v048-squad"><div class="v048-squad-list">${squadHtml()}</div></section><section class="v048-board"><div class="v048-instructions"><div class="v048-instruction-panel"><span class="v048-instruction-title">MATCH PLAN</span><span class="v048-help">Drag a bench player onto a pitch position to replace him. Drag a player back to the sheet to remove him.</span></div></div><div class="v048-pitch" data-v048-pitch><i class="v048-centre-circle"></i><i class="v048-box top"></i><i class="v048-box bottom"></i>${pitchHtml()}</div><div class="v048-board-footer"><span class="v048-help">Click a player, then click another position to move or swap.</span></div></section></div>`;
    bind();
  }

  function bind() {
    container.querySelector('[data-v048-formation]')?.addEventListener('change', event => {
      tactics.formation = event.target.value;
      shape = shapeForIds(shape.assignments.map(item => item.playerId), tactics.formation, db, shape);
      selectedSlotId = null;
      saveShape();
      render();
    });
    container.querySelectorAll('[data-v048-option]').forEach(button => button.addEventListener('click', () => { tactics[button.dataset.v048Option] = button.dataset.value; saveShape(); render(); }));
    container.querySelector('[data-v048-save]')?.addEventListener('click', () => { saveShape(); toast('Match plan saved.'); });
    container.querySelector('[data-v048-clear]')?.addEventListener('click', () => {
      shape = emptyShape(shape.formation);
      selectedPlayerId = null;
      selectedSlotId = null;
      saveShape();
      render();
    });
    container.querySelector('[data-v048-auto]')?.addEventListener('click', () => {
      const byAbility = [...squad].sort((a,b) => (b.currentAbility || 0) - (a.currentAbility || 0));
      const chosen = [];
      Object.entries({ GK:1, DEF:4, MID:3, ATT:3 }).forEach(([group, count]) => chosen.push(...byAbility.filter(player => player.positionGroup === group).slice(0, count)));
      byAbility.forEach(player => { if (chosen.length < 11 && !chosen.some(item => item.id === player.id)) chosen.push(player); });
      shape = shapeForIds(chosen.slice(0, 11).map(player => player.id), shape.formation, db, null);
      selectedSlotId = null;
      saveShape();
      render();
    });
    container.querySelectorAll('[data-v048-squad-player]').forEach(row => {
      row.addEventListener('dragstart', event => {
        const playerId = row.dataset.v048SquadPlayer;
        if (!playerId) { event.preventDefault(); return; }
        event.dataTransfer.setData('application/x-flm-player', playerId);
        if (row.dataset.v048SheetSlot) event.dataTransfer.setData('application/x-flm-slot', row.dataset.v048SheetSlot);
        event.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragover', event => { event.preventDefault(); row.classList.add('is-drop'); });
      row.addEventListener('dragleave', () => row.classList.remove('is-drop'));
      row.addEventListener('drop', event => {
        event.preventDefault();
        row.classList.remove('is-drop');
        const sourceSlot = event.dataTransfer.getData('application/x-flm-slot');
        const playerId = event.dataTransfer.getData('application/x-flm-player');
        if (sourceSlot && row.dataset.v048SheetSlot) moveOrSwap(sourceSlot, row.dataset.v048SheetSlot);
        else if (sourceSlot) removeFromSlot(sourceSlot);
        else if (playerId && row.dataset.v048SheetSlot) movePlayer(playerId, row.dataset.v048SheetSlot);
      });
      row.addEventListener('click', () => {
        if (row.dataset.v048SheetSlot && row.dataset.v048SquadPlayer) {
          selectedSlotId = row.dataset.v048SheetSlot;
          selectedPlayerId = null;
        } else if (row.dataset.v048BenchPlayer) {
          selectedPlayerId = selectedPlayerId === row.dataset.v048SquadPlayer ? null : row.dataset.v048SquadPlayer;
          selectedSlotId = null;
        }
        render();
      });
    });
    container.querySelectorAll('[data-v048-slot]').forEach(chip => {
      chip.addEventListener('dragstart', event => { event.stopPropagation(); if (!chip.dataset.playerId) { event.preventDefault(); return; } event.dataTransfer.setData('application/x-flm-slot', chip.dataset.v048Slot); event.dataTransfer.setData('application/x-flm-player', chip.dataset.playerId); event.dataTransfer.effectAllowed = 'move'; });
      chip.addEventListener('dragover', event => { event.preventDefault(); chip.classList.add('is-drop'); });
      chip.addEventListener('dragleave', () => chip.classList.remove('is-drop'));
      chip.addEventListener('drop', event => {
        event.preventDefault(); chip.classList.remove('is-drop');
        const sourceSlot = event.dataTransfer.getData('application/x-flm-slot');
        const playerId = event.dataTransfer.getData('application/x-flm-player');
        if (sourceSlot) moveOrSwap(sourceSlot, chip.dataset.v048Slot);
        else if (playerId) movePlayer(playerId, chip.dataset.v048Slot);
      });
      chip.addEventListener('click', () => {
        const target = chip.dataset.v048Slot;
        if (selectedPlayerId) { movePlayer(selectedPlayerId, target); return; }
        if (selectedSlotId && selectedSlotId !== target) { moveOrSwap(selectedSlotId, target); return; }
        selectedSlotId = selectedSlotId === target ? null : target;
        render();
      });
    });
  }

  render();
}

async function enhance() {
  if (enhancing) return;
  const c = career(), root = document.querySelector('.career-content');
  if (!c || !root || !manager()?.loadDatabase) return;
  enhancing = true;
  try {
    database ||= await manager().loadDatabase();
    patchSquadStars(root, c, database);
    buildTactics(root, c, database);
  } finally {
    enhancing = false;
  }
}

function queue() {
  if (queued) return;
  queued = true;
  queueMicrotask(async () => { queued = false; try { await enhance(); } catch {} });
}

ensureStyles();
new MutationObserver(queue).observe(document.documentElement, { childList:true, subtree:true });
queue();
