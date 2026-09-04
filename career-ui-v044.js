import {
  FORMATION_LAYOUTS,
  ROLE_DEFINITIONS,
  TACTIC_OPTIONS,
  assignPlayersToFormation
} from './matchday-engine-v0431.js?v=0.4.3.1';

const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-v044-career-style';
const VERSION = 'V0.4.4';
let renderQueued = false;
let cachedDb = null;

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function manager() {
  return window.FLMManager;
}

async function db() {
  cachedDb ||= await manager().loadDatabase();
  return cachedDb;
}

function career() {
  return manager()?.activeCareer || null;
}

function persist(activeCareer) {
  activeCareer.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(activeCareer));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = 'SAVED';
}

function rerender(tab) {
  requestAnimationFrame(() => document.querySelector(`[data-career-tab="${tab}"]`)?.click());
}

function playerById(database, id) {
  return database.players.find(player => player.id === id);
}

function cleanPosition(value) {
  return String(value || '').toUpperCase().replaceAll(' ', '');
}

function positionCodes(player) {
  return [player?.primaryPosition, ...(player?.secondaryPositions || [])]
    .filter(Boolean)
    .flatMap(value => cleanPosition(value).split(/[\/,;]+/))
    .filter(Boolean);
}

function preferredPositions(player) {
  return [player?.primaryPosition].filter(Boolean);
}

function alternativePositions(player) {
  return [...new Set((player?.secondaryPositions || []).filter(Boolean))];
}

function sideOf(slot) {
  const id = String(slot?.id || '');
  if (/^(R|RAM|RCM|RDM|RWB|RB|RM|RW|RST)/.test(id)) return 'R';
  if (/^(L|LAM|LCM|LDM|LWB|LB|LM|LW|LST)/.test(id)) return 'L';
  return 'C';
}

function slotCodeSets(slot) {
  const side = sideOf(slot);
  const family = slot?.family;
  if (family === 'GK') return { natural: ['GK'], cover: [] };
  if (family === 'CB') return { natural: ['DC','CB'], cover: side === 'R' ? ['DR','RB','DMC','DM'] : side === 'L' ? ['DL','LB','DMC','DM'] : ['DMC','DM','DR','DL'] };
  if (family === 'FB') return side === 'R'
    ? { natural: ['DR','RB'], cover: ['WBR','RWB','MR','AMR'] }
    : { natural: ['DL','LB'], cover: ['WBL','LWB','ML','AML'] };
  if (family === 'WB') return side === 'R'
    ? { natural: ['WBR','RWB'], cover: ['DR','RB','MR','AMR'] }
    : { natural: ['WBL','LWB'], cover: ['DL','LB','ML','AML'] };
  if (family === 'DM') return { natural: ['DMC','DM'], cover: ['MC','CM','DC','CB'] };
  if (family === 'CM') return { natural: ['MC','CM'], cover: ['DMC','DM','AMC','AM'] };
  if (family === 'AM') return { natural: ['AMC','AM'], cover: ['MC','CM','ST','FC','CF'] };
  if (family === 'W') return side === 'R'
    ? { natural: ['AMR','MR','RW','FR'], cover: ['WBR','RWB','ST','FC','AMC'] }
    : { natural: ['AML','ML','LW','FL'], cover: ['WBL','LWB','ST','FC','AMC'] };
  if (family === 'ST') return { natural: ['ST','FC','CF','SC'], cover: ['AMC','AMR','AML','AM'] };
  return { natural: [], cover: [] };
}

function codeMatches(code, allowed) {
  const cleaned = cleanPosition(code);
  return allowed.some(item => cleaned === item || cleaned.includes(item));
}

export function getPositionFit(player, slot) {
  if (!player || !slot) return 'unfamiliar';
  const sets = slotCodeSets(slot);
  const primary = cleanPosition(player.primaryPosition);
  if (codeMatches(primary, sets.natural)) return 'preferred';
  const alternatives = alternativePositions(player).map(cleanPosition);
  if (alternatives.some(code => codeMatches(code, sets.natural))) return 'secondary';
  if (codeMatches(primary, sets.cover) || alternatives.some(code => codeMatches(code, sets.cover))) return 'secondary';
  return 'unfamiliar';
}

function fitLabel(fit) {
  return fit === 'preferred' ? 'Preferred position' : fit === 'secondary' ? 'Can cover this position' : 'Unsuitable position';
}

function keyPlayers(database, clubId) {
  return new Set(database.players
    .filter(player => player.clubId === clubId && !player.isPlaceholder)
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0) || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map(player => player.id));
}

function statusFor(activeCareer, player) {
  const careerStatus = activeCareer.playerStatus?.[player.id] || {};
  const sourceStatus = player.status || {};
  return {
    condition: careerStatus.condition ?? sourceStatus.condition ?? 100,
    sharpness: careerStatus.sharpness ?? sourceStatus.matchSharpness ?? 88,
    morale: careerStatus.morale ?? sourceStatus.morale ?? 'Good',
    injury: sourceStatus.injuries && sourceStatus.injuries !== 'None' ? sourceStatus.injuries : null,
    suspension: sourceStatus.suspension && sourceStatus.suspension !== 'None' ? sourceStatus.suspension : null
  };
}

function positionText(player) {
  const preferred = preferredPositions(player).join(', ') || '—';
  const alternatives = alternativePositions(player).join(', ') || '—';
  return { preferred, alternatives };
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .version-chip{white-space:nowrap}
    .db-player-rating{display:none!important}
    .v044-squad-shell{display:grid;gap:14px}
    .v044-squad-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 14px;border:1px solid rgba(239,185,63,.16);border-radius:12px;background:rgba(255,255,255,.018)}
    .v044-squad-toolbar>div{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.v044-squad-toolbar small{color:#7f786c;font-size:9px;letter-spacing:.08em}.v044-squad-toolbar button{min-height:36px;padding:0 13px;border:1px solid rgba(239,185,63,.28);border-radius:8px;background:#0c0b08;color:#d8bd72;font-size:9px;font-weight:900;letter-spacing:.09em;cursor:pointer}
    .v044-legend{display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:9px;color:#8c8579}.v044-legend i{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:5px}.v044-legend .p{background:#4ec07c}.v044-legend .s{background:#d6953f}.v044-legend .u{background:#d65d55}
    .v044-squad-head,.v044-squad-row{display:grid;grid-template-columns:36px 62px minmax(170px,1.25fr) 110px minmax(120px,1fr) 74px 74px 72px;gap:10px;align-items:center}
    .v044-squad-head{padding:0 12px;color:#716b61;font-size:8px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
    .v044-squad-list{display:grid;gap:4px}.v044-squad-row{min-height:58px;padding:7px 12px;border:1px solid rgba(239,185,63,.1);border-radius:9px;background:rgba(255,255,255,.014);cursor:pointer}.v044-squad-row.is-selected{border-color:rgba(239,185,63,.38);background:rgba(239,185,63,.05)}
    .v044-squad-row input{width:17px;height:17px;accent-color:#e9b63d}.v044-pos{color:#e8cb73;font-size:10px;font-weight:950}.v044-name{min-width:0}.v044-name strong{display:flex;align-items:center;gap:6px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v044-name small{display:block;margin-top:4px;color:#716b61;font-size:9px}.v044-key-star{color:#f6d94a;font-size:12px;text-shadow:0 0 8px rgba(246,217,74,.35)}
    .v044-alt{font-size:10px;color:#9f978b}.v044-status{font-size:9px;color:#8e877b}.v044-status b{display:block;color:#c9c1b4;font-size:10px}.v044-status.is-alert b{color:#e08773}.v044-profile{min-height:32px;border:1px solid rgba(239,185,63,.18);border-radius:7px;background:#0b0a07;color:#b9a572;font-size:8px;font-weight:900;cursor:pointer}
    .v044-tactics{display:grid;grid-template-columns:minmax(420px,1.2fr) minmax(330px,.8fr);gap:18px}.v044-tactic-pitch{position:relative;min-height:650px;border:1px solid rgba(239,185,63,.32);border-radius:16px;background:repeating-linear-gradient(0deg,rgba(255,255,255,.018) 0 64px,rgba(255,255,255,.035) 65px 128px),linear-gradient(#17331f,#0c1d12);overflow:hidden}.v044-tactic-pitch:before{content:'';position:absolute;inset:5%;border:1px solid rgba(255,255,255,.3)}.v044-tactic-pitch:after{content:'';position:absolute;left:5%;right:5%;top:50%;border-top:1px solid rgba(255,255,255,.3)}
    .v044-pitch-player{position:absolute;z-index:2;transform:translate(-50%,-50%);width:126px;padding:7px 8px;border:2px solid;border-radius:9px;background:rgba(7,8,6,.92);box-shadow:0 8px 20px rgba(0,0,0,.28);text-align:center}.v044-pitch-player.fit-preferred{border-color:#4ec07c}.v044-pitch-player.fit-secondary{border-color:#d6953f}.v044-pitch-player.fit-unfamiliar{border-color:#d65d55}.v044-pitch-player span{display:block;color:#e8cb73;font-size:8px;font-weight:950;letter-spacing:.07em}.v044-pitch-player strong{display:block;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px}.v044-pitch-player small{display:block;margin-top:2px;color:#8c8579;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .v044-tactic-side{display:grid;align-content:start;gap:10px}.v044-tactic-card{padding:15px;border:1px solid rgba(239,185,63,.16);border-radius:12px;background:linear-gradient(145deg,rgba(22,20,14,.88),rgba(8,8,6,.94))}.v044-card-title{margin-bottom:10px;color:#e6bf52;font-size:9px;font-weight:950;letter-spacing:.12em}.v044-control-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.v044-control{display:grid;gap:5px}.v044-control span{color:#80786c;font-size:8px;font-weight:900;letter-spacing:.09em}.v044-control select{min-height:38px;border:1px solid rgba(255,255,255,.13);border-radius:8px;background:#0d0c09;color:#eee7da;padding:0 8px;font-size:10px}
    .v044-role-list{display:grid;gap:5px;max-height:300px;overflow:auto}.v044-role-row{display:grid;grid-template-columns:42px minmax(95px,1fr) minmax(120px,1fr);gap:6px;align-items:center;padding:6px;border:1px solid rgba(255,255,255,.06);border-radius:7px}.v044-role-row>span{font-size:8px;font-weight:950;color:#e8cb73}.v044-role-row strong{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v044-role-row select{min-height:30px;border:1px solid rgba(255,255,255,.12);border-radius:7px;background:#0d0c09;color:#eee7da;font-size:9px;padding:0 6px}
    .v044-save-row{display:flex;gap:7px;flex-wrap:wrap}.v044-save-row button{min-height:40px;padding:0 12px;border:1px solid rgba(239,185,63,.27);border-radius:8px;background:#0d0c09;color:#d3b86f;font-size:8px;font-weight:950;letter-spacing:.07em;cursor:pointer}.v044-save-row button.primary{background:linear-gradient(#ffd363,#e5a72c);color:#171005;border-color:#f8ca5b}
    .v044-fit-note{padding:9px 10px;border-radius:8px;background:rgba(255,255,255,.025);color:#8d8579;font-size:9px;line-height:1.5}.v044-fit-note strong{color:#d8bd72}
    @media(max-width:980px){.v044-squad-head{display:none}.v044-squad-row{grid-template-columns:28px 48px minmax(140px,1fr) 90px 70px}.v044-squad-row>.v044-alt,.v044-squad-row>.v044-status:nth-of-type(2),.v044-squad-row>.v044-profile{display:none}.v044-tactics{grid-template-columns:1fr}.v044-tactic-pitch{min-height:560px}}
    @media(max-width:620px){.v044-squad-toolbar{align-items:flex-start;flex-direction:column}.v044-squad-row{grid-template-columns:25px 44px minmax(130px,1fr) 60px}.v044-squad-row>.v044-alt,.v044-squad-row>.v044-status,.v044-squad-row>.v044-profile{display:none}.v044-tactic-pitch{min-height:500px}.v044-pitch-player{width:92px;padding:5px}.v044-pitch-player small{display:none}.v044-control-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function updateVersionChip() {
  const chip = document.querySelector('.version-chip');
  if (chip) chip.textContent = VERSION;
}

function validateSelection(ids, database, clubId) {
  if (ids.length !== 11) return { valid: false, error: 'Select exactly 11 players.' };
  const players = ids.map(id => playerById(database, id)).filter(Boolean);
  if (players.length !== 11 || players.some(player => player.clubId !== clubId)) return { valid: false, error: 'Every selected player must belong to your club.' };
  if (!players.some(player => player.positionGroup === 'GK')) return { valid: false, error: 'Your starting XI needs a goalkeeper.' };
  return { valid: true, error: '' };
}

function renderSquad(root, activeCareer, database) {
  if (root.dataset.v044Squad === '1') return;
  const list = root.querySelector('.career-squad-list');
  const actions = root.querySelector('.career-squad-actions');
  if (!list || !actions) return;
  root.dataset.v044Squad = '1';
  const selected = new Set(activeCareer.lineupIds || []);
  const stars = keyPlayers(database, activeCareer.clubId);
  const order = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
  const squad = database.players
    .filter(player => player.clubId === activeCareer.clubId && !player.isPlaceholder)
    .sort((a,b) => order[a.positionGroup] - order[b.positionGroup] || a.name.localeCompare(b.name));

  const heading = root.querySelector('.career-page-heading h2');
  if (heading) heading.textContent = 'Squad';
  const eyebrow = root.querySelector('.career-page-heading .eyebrow');
  if (eyebrow) eyebrow.textContent = 'SQUAD · POSITION(S)';

  actions.outerHTML = `<div class="v044-squad-toolbar"><div><button type="button" data-v044-auto-pick>AUTO PICK XI</button><small>Key player ★ · preferred and alternative positions shown. Overall ability is hidden.</small></div><div class="v044-legend"><span><i class="p"></i>Preferred</span><span><i class="s"></i>Cover</span><span><i class="u"></i>Wrong position</span></div></div>`;
  list.outerHTML = `<div class="v044-squad-shell"><div class="v044-squad-head"><span>XI</span><span>POS</span><span>PLAYER</span><span>PREFERRED</span><span>ALTERNATIVES</span><span>CON</span><span>SHARP</span><span></span></div><div class="v044-squad-list">${squad.map(player => {
    const status = statusFor(activeCareer, player);
    const positions = positionText(player);
    const alert = status.injury || status.suspension;
    return `<label class="v044-squad-row ${selected.has(player.id) ? 'is-selected' : ''}" data-v044-player-row="${esc(player.id)}"><input type="checkbox" value="${esc(player.id)}" ${selected.has(player.id) ? 'checked' : ''} data-v044-lineup><span class="v044-pos">${esc(player.primaryPosition || '—')}</span><span class="v044-name"><strong>${esc(player.name)}${stars.has(player.id) ? '<i class="v044-key-star" title="Key player" aria-label="Key player">★</i>' : ''}</strong><small>${esc(status.morale)}${alert ? ` · ${esc(alert)}` : ''}</small></span><span class="v044-alt">${esc(positions.preferred)}</span><span class="v044-alt">${esc(positions.alternatives)}</span><span class="v044-status ${alert ? 'is-alert' : ''}"><small>CON</small><b>${Math.round(status.condition)}%</b></span><span class="v044-status"><small>SHARP</small><b>${Math.round(status.sharpness)}%</b></span><button type="button" class="v044-profile" data-v044-profile="${esc(player.id)}">PROFILE</button></label>`;
  }).join('')}</div></div>`;

  root.querySelector('[data-v044-auto-pick]')?.addEventListener('click', () => {
    const picked = [...squad]
      .sort((a,b) => (b.currentAbility || 0) - (a.currentAbility || 0));
    const chosen = [];
    const quotas = { GK:1, DEF:4, MID:3, ATT:3 };
    Object.entries(quotas).forEach(([group,count]) => chosen.push(...picked.filter(player => player.positionGroup === group).slice(0,count)));
    picked.forEach(player => { if (chosen.length < 11 && !chosen.some(item => item.id === player.id)) chosen.push(player); });
    activeCareer.lineupIds = chosen.slice(0,11).map(player => player.id);
    activeCareer.tacticalSetup = null;
    persist(activeCareer);
    rerender('squad');
  });

  root.querySelectorAll('[data-v044-lineup]').forEach(input => input.addEventListener('change', () => {
    const ids = [...root.querySelectorAll('[data-v044-lineup]:checked')].map(item => item.value);
    if (ids.length > 11) {
      input.checked = false;
      return;
    }
    root.querySelector(`[data-v044-player-row="${CSS.escape(input.value)}"]`)?.classList.toggle('is-selected', input.checked);
    const validation = validateSelection(ids, database, activeCareer.clubId);
    const counter = root.querySelector('[data-lineup-counter]');
    if (counter) {
      counter.textContent = `${ids.length} / 11 SELECTED`;
      counter.classList.toggle('is-valid', validation.valid);
    }
    if (!validation.valid) return;
    activeCareer.lineupIds = ids;
    activeCareer.tacticalSetup = null;
    persist(activeCareer);
  }));

  root.querySelectorAll('[data-v044-profile]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    window.FLMPlayerProfile?.open(button.dataset.v044Profile);
  }));
}

function defaultTactics(activeCareer) {
  return {
    formation: activeCareer.tactics?.formation || '4-3-3',
    mentality: activeCareer.tactics?.mentality || 'Balanced',
    pressing: activeCareer.tactics?.pressing || 'Standard',
    tempo: activeCareer.tactics?.tempo || 'Standard',
    passing: activeCareer.tactics?.passing || 'Mixed',
    width: activeCareer.tactics?.width || 'Balanced',
    defensiveLine: activeCareer.tactics?.defensiveLine || 'Standard'
  };
}

function shapeFor(activeCareer, database, formation = defaultTactics(activeCareer).formation) {
  const previous = activeCareer.tacticalSetup?.formation === formation ? activeCareer.tacticalSetup : null;
  return assignPlayersToFormation(activeCareer.lineupIds, formation, database, previous);
}

function renderPitch(shape, database) {
  return shape.slots.map(slot => {
    const assignment = shape.assignments.find(item => item.slotId === slot.id);
    const player = playerById(database, assignment?.playerId);
    const fit = getPositionFit(player, slot);
    return `<div class="v044-pitch-player fit-${fit}" style="left:${slot.x}%;top:${slot.y}%" title="${esc(fitLabel(fit))}"><span>${esc(slot.label)}</span><strong>${esc(player?.name || '—')}</strong><small>${esc(assignment?.role || '')} · ${esc(fitLabel(fit))}</small></div>`;
  }).join('');
}

function renderRoleRows(shape, database) {
  return shape.slots.map(slot => {
    const assignment = shape.assignments.find(item => item.slotId === slot.id);
    const player = playerById(database, assignment?.playerId);
    return `<div class="v044-role-row"><span>${esc(slot.label)}</span><strong>${esc(player?.name || '—')}</strong><select data-v044-role="${esc(slot.id)}">${slot.roles.map(role => `<option ${assignment?.role === role ? 'selected' : ''}>${esc(role)}</option>`).join('')}</select></div>`;
  }).join('');
}

function optionField(label, key, values, value) {
  return `<label class="v044-control"><span>${esc(label)}</span><select data-v044-tactic="${esc(key)}">${values.map(item => `<option ${item === value ? 'selected' : ''}>${esc(item)}</option>`).join('')}</select></label>`;
}

function presetStore(activeCareer) {
  activeCareer.tacticPresets ||= {};
  return activeCareer.tacticPresets;
}

function renderTactics(root, activeCareer, database) {
  if (root.dataset.v044Tactics === '1') return;
  const oldGrid = root.querySelector('.career-tactics-grid');
  if (!oldGrid) return;
  root.dataset.v044Tactics = '1';
  const tactics = defaultTactics(activeCareer);
  let shape = shapeFor(activeCareer, database, tactics.formation);

  const heading = root.querySelector('.career-page-heading h2');
  if (heading) heading.textContent = 'Tactics Centre';
  const badge = root.querySelector('.career-round');
  if (badge) badge.textContent = 'PRE-MATCH · ROLES · POSITION FIT';

  oldGrid.outerHTML = `<div class="v044-tactics"><div><div class="v044-tactic-pitch" data-v044-pitch>${renderPitch(shape,database)}</div><div class="v044-legend" style="margin-top:10px"><span><i class="p"></i>Preferred</span><span><i class="s"></i>Can cover</span><span><i class="u"></i>Wrong position</span></div></div><aside class="v044-tactic-side"><section class="v044-tactic-card"><div class="v044-card-title">TEAM INSTRUCTIONS</div><div class="v044-control-grid">${optionField('FORMATION','formation',Object.keys(FORMATION_LAYOUTS),tactics.formation)}${optionField('MENTALITY','mentality',TACTIC_OPTIONS.mentality,tactics.mentality)}${optionField('PRESSING','pressing',TACTIC_OPTIONS.pressing,tactics.pressing)}${optionField('TEMPO','tempo',TACTIC_OPTIONS.tempo,tactics.tempo)}${optionField('PASSING','passing',TACTIC_OPTIONS.passing,tactics.passing)}${optionField('WIDTH','width',TACTIC_OPTIONS.width,tactics.width)}${optionField('DEFENSIVE LINE','defensiveLine',TACTIC_OPTIONS.defensiveLine,tactics.defensiveLine)}</div></section><section class="v044-tactic-card"><div class="v044-card-title">PLAYER ROLES</div><div class="v044-role-list" data-v044-role-list>${renderRoleRows(shape,database)}</div></section><section class="v044-tactic-card"><div class="v044-card-title">TACTIC SLOTS</div><div class="v044-save-row"><button data-v044-load-preset="1">LOAD 1</button><button data-v044-save-preset="1">SAVE 1</button><button data-v044-load-preset="2">LOAD 2</button><button data-v044-save-preset="2">SAVE 2</button><button data-v044-load-preset="3">LOAD 3</button><button data-v044-save-preset="3">SAVE 3</button></div></section><div class="v044-fit-note"><strong>POSITION FIT:</strong> green is a preferred/natural position, orange is a secondary or adjacent cover position, red is unsuitable. Poor fit remains visible before you commit the plan.</div><div class="v044-save-row"><button class="primary" data-v044-save-tactics>SAVE MATCH PLAN</button></div></aside></div>`;

  const refreshShape = formation => {
    shape = assignPlayersToFormation(activeCareer.lineupIds, formation, database, activeCareer.tacticalSetup?.formation === formation ? activeCareer.tacticalSetup : null);
    const pitch = root.querySelector('[data-v044-pitch]');
    const roles = root.querySelector('[data-v044-role-list]');
    if (pitch) pitch.innerHTML = renderPitch(shape,database);
    if (roles) roles.innerHTML = renderRoleRows(shape,database);
  };

  root.querySelector('[data-v044-tactic="formation"]')?.addEventListener('change', event => refreshShape(event.target.value));

  root.querySelector('[data-v044-save-tactics]')?.addEventListener('click', () => {
    const values = Object.fromEntries([...root.querySelectorAll('[data-v044-tactic]')].map(field => [field.dataset.v044Tactic, field.value]));
    const formation = values.formation;
    const latest = assignPlayersToFormation(activeCareer.lineupIds, formation, database, shape?.formation === formation ? shape : null);
    latest.assignments.forEach(assignment => {
      const roleField = root.querySelector(`[data-v044-role="${CSS.escape(assignment.slotId)}"]`);
      const slot = latest.slots.find(item => item.id === assignment.slotId);
      if (roleField && slot?.roles.includes(roleField.value)) assignment.role = roleField.value;
    });
    activeCareer.tactics = { ...activeCareer.tactics, ...values };
    activeCareer.tacticalSetup = latest;
    persist(activeCareer);
    rerender('tactics');
  });

  root.querySelectorAll('[data-v044-save-preset]').forEach(button => button.addEventListener('click', () => {
    const slot = button.dataset.v044SavePreset;
    const values = Object.fromEntries([...root.querySelectorAll('[data-v044-tactic]')].map(field => [field.dataset.v044Tactic, field.value]));
    const latest = assignPlayersToFormation(activeCareer.lineupIds, values.formation, database, shape?.formation === values.formation ? shape : null);
    latest.assignments.forEach(assignment => {
      const field = root.querySelector(`[data-v044-role="${CSS.escape(assignment.slotId)}"]`);
      const slotDef = latest.slots.find(item => item.id === assignment.slotId);
      if (field && slotDef?.roles.includes(field.value)) assignment.role = field.value;
    });
    presetStore(activeCareer)[slot] = { tactics: values, tacticalSetup: latest };
    persist(activeCareer);
    button.textContent = `SAVED ${slot}`;
  }));

  root.querySelectorAll('[data-v044-load-preset]').forEach(button => button.addEventListener('click', () => {
    const slot = button.dataset.v044LoadPreset;
    const preset = presetStore(activeCareer)[slot];
    if (!preset) {
      button.textContent = `EMPTY ${slot}`;
      return;
    }
    activeCareer.tactics = { ...activeCareer.tactics, ...preset.tactics };
    activeCareer.tacticalSetup = preset.tacticalSetup;
    persist(activeCareer);
    rerender('tactics');
  }));
}

async function enhanceCareer() {
  const api = manager();
  const activeCareer = career();
  const root = document.querySelector('.career-content');
  if (!api || !activeCareer || !root) return;
  const database = await db();
  if (root.querySelector('.career-squad-list')) renderSquad(root, activeCareer, database);
  if (root.querySelector('.career-tactics-grid')) renderTactics(root, activeCareer, database);
}

function queueEnhance() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(async () => {
    renderQueued = false;
    try { await enhanceCareer(); } catch (error) { console.error('V0.4.4 career UI enhancement failed', error); }
  });
}

function boot() {
  injectStyles();
  updateVersionChip();
  const observer = new MutationObserver(() => {
    updateVersionChip();
    queueEnhance();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  queueEnhance();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();

window.FLMPositionFit = { getPositionFit, preferredPositions, alternativePositions };
