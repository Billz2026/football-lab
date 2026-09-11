import { autoPickLineup } from './manager-core.js?v=0.3.0';

const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-team-selection-v2-style';
const BENCH_LIMIT = 9;
let queued = false;
let database = null;

const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;
const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function displayName(player) {
  if (!player) return '—';
  const first = String(player.firstName || '').trim();
  const last = String(player.lastName || '').trim();
  const full = String(player.name || '').replace(',', '').trim();
  if (first.length > 1 && last) return `${first} ${last}`;
  return full || [first, last].filter(Boolean).join(' ') || '—';
}

function persist(c) {
  if (!c) return;
  c.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = 'SAVED';
}

function squadFor(db, c) {
  const order = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
  return db.players
    .filter(player => player.clubId === c.clubId && !player.isPlaceholder)
    .sort((a, b) => order[a.positionGroup] - order[b.positionGroup]
      || String(a.primaryPosition || '').localeCompare(String(b.primaryPosition || ''))
      || displayName(a).localeCompare(displayName(b)));
}

function bestAvailable(squad, excluded = new Set()) {
  return [...squad]
    .filter(player => !excluded.has(player.id))
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0));
}

function normaliseSelection(c, squad, { fillLegacyBench = true } = {}) {
  const squadIds = new Set(squad.map(player => player.id));
  const lineup = [...new Set((c.lineupIds || []).filter(id => squadIds.has(id)))].slice(0, 11);
  c.lineupIds = lineup;

  const hadBench = Array.isArray(c.benchIds);
  let bench = hadBench ? c.benchIds : [];
  bench = [...new Set(bench.filter(id => squadIds.has(id) && !lineup.includes(id)))].slice(0, BENCH_LIMIT);

  if (!hadBench && fillLegacyBench) {
    const excluded = new Set(lineup);
    bench = bestAvailable(squad, excluded).slice(0, BENCH_LIMIT).map(player => player.id);
  }
  c.benchIds = bench;
}

function initialiseCareerOwnership(c, squad) {
  if (!c) return;
  if (!Object.prototype.hasOwnProperty.call(c, 'manualLineupSelection')) {
    const untouched = Number(c.roundIndex || 0) === 0 && !c.lastMatch;
    if (untouched) {
      c.lineupIds = [];
      c.benchIds = [];
      c.manualLineupSelection = true;
      delete c.tacticalSetup;
    } else {
      c.manualLineupSelection = false;
      normaliseSelection(c, squad, { fillLegacyBench: true });
    }
    persist(c);
    return;
  }
  normaliseSelection(c, squad, { fillLegacyBench: !Array.isArray(c.benchIds) });
}

function statusFor(c, player) {
  const status = c.playerStatus?.[player.id] || {};
  return {
    condition: Math.round(status.condition ?? 100),
    sharpness: Math.round(status.sharpness ?? 88),
    morale: status.morale || 'Good'
  };
}

function playerById(squad, id) {
  return squad.find(player => player.id === id) || null;
}

function toast(message, error = false) {
  document.querySelector('.flm-selection-v2-toast')?.remove();
  const node = document.createElement('div');
  node.className = `flm-selection-v2-toast${error ? ' is-error' : ''}`;
  node.textContent = message;
  document.body.appendChild(node);
  requestAnimationFrame(() => node.classList.add('is-visible'));
  setTimeout(() => node.remove(), 2200);
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .career-content:has(.flm-selection-v2){padding-left:18px!important;padding-right:18px!important}
    .career-content:has(.flm-selection-v2)>*{width:100%!important;max-width:none!important}
    .career-content:has(.flm-selection-v2) .career-page-heading{margin-bottom:7px!important}
    .career-content:has(.flm-selection-v2) .career-squad-actions{margin-bottom:7px!important;padding:0!important;background:transparent!important;border:0!important}
    .flm-v2-toolbar{display:flex;align-items:center;gap:5px;flex-wrap:wrap;width:100%}
    .flm-v2-toolbar button{min-height:30px;padding:0 10px;border:1px solid #2d6dbb;border-radius:0;background:#0a2242;color:#d9e2ea;font-size:8px;font-weight:950;letter-spacing:.04em;cursor:pointer}
    .flm-v2-toolbar button:hover{background:#174d36;border-color:#55dc7c}.flm-v2-toolbar .danger{margin-left:auto;border-color:#8f4850;background:#351923;color:#ffd0d0}
    .flm-v2-note{flex:1 1 260px;color:#9caebe;font-size:8px;text-align:right}
    .lineup-counter.flm-v2-counter{border-color:#23558e!important;background:#071c38!important;color:#f4c342!important;white-space:nowrap}
    .lineup-counter.flm-v2-counter.is-valid{border-color:#55dc7c!important;color:#8ee7a8!important}
    .flm-selection-v2{display:grid;grid-template-columns:minmax(560px,1.15fr) minmax(390px,.85fr);gap:8px;height:clamp(520px,calc(100dvh - 255px),760px);min-height:0;color:#eef3f6}
    .flm-v2-panel{min-height:0;border:1px solid #23558e;background:#041429;overflow:hidden}
    .flm-v2-roster{display:grid;grid-template-rows:auto auto 1fr}.flm-v2-sheet{display:grid;grid-template-rows:auto 1fr}
    .flm-v2-panel-title{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:31px;padding:6px 9px;border-bottom:1px solid #23558e;background:#0a2242;color:#f4c342;font-size:9px;font-weight:950;letter-spacing:.09em}
    .flm-v2-panel-title span{color:#9caebe;font-size:7px;letter-spacing:.04em}
    .flm-v2-head,.flm-v2-row{display:grid;grid-template-columns:42px minmax(165px,1fr) 54px 54px 104px;gap:6px;align-items:center}
    .flm-v2-head{min-height:25px;padding:3px 8px;border-bottom:1px solid #23558e;background:#061326;color:#9caebe;font-size:7px;font-weight:950;letter-spacing:.08em}
    .flm-v2-list{min-height:0;overflow:auto;scrollbar-width:thin;scrollbar-color:#2d6dbb #041429}
    .flm-v2-row{min-height:29px;padding:2px 8px;border-bottom:1px solid rgba(90,160,225,.18);background:#071c38;color:#eef3f6;font-size:8px;cursor:grab}
    .flm-v2-row:nth-child(even){background:#0a2242}.flm-v2-row:hover{background:#10345f}.flm-v2-row.is-xi{border-left:3px solid #55dc7c;background:#0c382d}.flm-v2-row.is-bench{border-left:3px solid #f4c342;background:#302711}
    .flm-v2-pos{color:#f4c342;font-size:9px;font-weight:950}.flm-v2-name{min-width:0}.flm-v2-name strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:9px}.flm-v2-name small{display:block;margin-top:1px;color:#9caebe;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .flm-v2-metric{text-align:center}.flm-v2-metric strong{display:block;font-size:9px}.flm-v2-metric small{display:block;color:#7f93a4;font-size:6px}
    .flm-v2-row-actions{display:flex;justify-content:flex-end;gap:3px}.flm-v2-row-actions button{min-width:46px;min-height:23px;padding:0 5px;border:1px solid #2d6dbb;border-radius:0;background:#061326;color:#cbd7e1;font-size:7px;font-weight:950;cursor:pointer}.flm-v2-row-actions button.is-active{border-color:#55dc7c;background:#174d36;color:#fff}.flm-v2-row-actions button.sub.is-active{border-color:#f4c342;background:#4a3b12;color:#fff3b0}
    .flm-v2-sheet-body{display:grid;grid-template-rows:auto minmax(0,1fr) auto minmax(0,.82fr);min-height:0}
    .flm-v2-section{display:flex;align-items:center;justify-content:space-between;min-height:25px;padding:4px 8px;border-bottom:1px solid #23558e;background:#061326;color:#f4c342;font-size:8px;font-weight:950;letter-spacing:.09em}.flm-v2-section span{color:#9caebe;font-size:7px}
    .flm-v2-slots{min-height:0;overflow:auto}.flm-v2-slot{display:grid;grid-template-columns:32px minmax(0,1fr) 60px 58px;gap:6px;align-items:center;min-height:30px;padding:2px 8px;border-bottom:1px solid rgba(90,160,225,.18);background:#071c38}.flm-v2-slot:nth-child(even){background:#0a2242}.flm-v2-slot.is-drop{outline:1px solid #f4c342;outline-offset:-1px;background:#174d36}
    .flm-v2-slot-no{color:#f4c342;font-size:9px;font-weight:950}.flm-v2-slot-player{min-width:0}.flm-v2-slot-player strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:9px}.flm-v2-slot-player small{display:block;color:#8ee7a8;font-size:7px}.flm-v2-slot.empty .flm-v2-slot-player strong{color:#6e8497}.flm-v2-slot-condition{text-align:right;color:#d7e0e8;font-size:8px}.flm-v2-slot-actions{display:flex;justify-content:flex-end;gap:3px}.flm-v2-slot-actions button{min-width:25px;min-height:22px;padding:0 5px;border:1px solid #2d6dbb;border-radius:0;background:#061326;color:#cbd7e1;font-size:7px;font-weight:950;cursor:pointer}.flm-v2-slot-actions .remove{border-color:#73424a;color:#ffc1c6}
    .flm-selection-v2-toast{position:fixed;z-index:99999;left:50%;bottom:24px;transform:translate(-50%,8px);opacity:0;padding:8px 12px;border:1px solid #55dc7c;background:#071c38;color:#eef3f6;font-size:9px;font-weight:900;transition:.16s}.flm-selection-v2-toast.is-visible{opacity:1;transform:translate(-50%,0)}.flm-selection-v2-toast.is-error{border-color:#c35b65;color:#ffd1d5}
    @media(max-width:1050px){.flm-selection-v2{grid-template-columns:1fr;height:auto}.flm-v2-list{max-height:380px}.flm-v2-sheet-body{max-height:650px}.flm-v2-note{display:none}.flm-v2-toolbar .danger{margin-left:0}}
    @media(max-width:650px){.career-content:has(.flm-selection-v2){padding-left:8px!important;padding-right:8px!important}.flm-v2-head,.flm-v2-row{grid-template-columns:36px minmax(120px,1fr) 44px 88px}.flm-v2-head span:nth-child(4),.flm-v2-row>.flm-v2-metric:nth-child(4){display:none}.flm-v2-row-actions button{min-width:40px}.flm-v2-slot{grid-template-columns:26px minmax(0,1fr) 48px}.flm-v2-slot-actions{display:none}}
  `;
  document.head.appendChild(style);
}

function setSelection(c, squad, nextLineup, nextBench) {
  const squadIds = new Set(squad.map(player => player.id));
  const lineup = [...new Set(nextLineup.filter(id => squadIds.has(id)))].slice(0, 11);
  const lineupSet = new Set(lineup);
  const bench = [...new Set(nextBench.filter(id => squadIds.has(id) && !lineupSet.has(id)))].slice(0, BENCH_LIMIT);
  const lineupChanged = JSON.stringify(c.lineupIds || []) !== JSON.stringify(lineup);
  c.lineupIds = lineup;
  c.benchIds = bench;
  c.manualLineupSelection = true;
  if (lineupChanged) delete c.tacticalSetup;
  persist(c);
}

function autoBench(c, squad) {
  const excluded = new Set(c.lineupIds || []);
  c.benchIds = bestAvailable(squad, excluded).slice(0, BENCH_LIMIT).map(player => player.id);
  persist(c);
}

function renderSelection(container, c, squad) {
  const lineup = [...(c.lineupIds || [])];
  const bench = [...(c.benchIds || [])];
  const lineupSet = new Set(lineup);
  const benchSet = new Set(bench);

  const roster = squad.map(player => {
    const status = statusFor(c, player);
    const state = lineupSet.has(player.id) ? 'is-xi' : benchSet.has(player.id) ? 'is-bench' : '';
    return `<div class="flm-v2-row ${state}" draggable="true" data-flm-v2-player="${esc(player.id)}">
      <span class="flm-v2-pos">${esc(player.primaryPosition || player.positionGroup || '—')}</span>
      <span class="flm-v2-name"><strong>${esc(displayName(player))}</strong><small>${esc(status.morale)}${player.secondaryPositions?.length ? ` · ${esc(player.secondaryPositions.join('/'))}` : ''}</small></span>
      <span class="flm-v2-metric"><strong>${status.condition}%</strong><small>CON</small></span>
      <span class="flm-v2-metric"><strong>${status.sharpness}%</strong><small>SHP</small></span>
      <span class="flm-v2-row-actions"><button type="button" class="${lineupSet.has(player.id) ? 'is-active' : ''}" data-flm-v2-to-xi="${esc(player.id)}">XI</button><button type="button" class="sub ${benchSet.has(player.id) ? 'is-active' : ''}" data-flm-v2-to-bench="${esc(player.id)}">SUB</button></span>
    </div>`;
  }).join('');

  const slotHtml = (kind, ids, limit, startNumber) => Array.from({ length: limit }, (_, index) => {
    const id = ids[index] || '';
    const player = playerById(squad, id);
    const status = player ? statusFor(c, player) : null;
    return `<div class="flm-v2-slot ${player ? '' : 'empty'}" data-flm-v2-drop="${kind}" data-flm-v2-index="${index}" ${player ? `draggable="true" data-flm-v2-selected-player="${esc(player.id)}"` : ''}>
      <span class="flm-v2-slot-no">${startNumber + index}</span>
      <span class="flm-v2-slot-player"><strong>${esc(player ? displayName(player) : 'EMPTY')}</strong><small>${esc(player?.primaryPosition || (kind === 'xi' ? 'Starting XI' : 'Substitute'))}</small></span>
      <span class="flm-v2-slot-condition">${status ? `${status.condition}%` : '—'}</span>
      <span class="flm-v2-slot-actions">${player ? `<button type="button" data-flm-v2-move="${kind === 'xi' ? 'bench' : 'xi'}" data-player="${esc(player.id)}">${kind === 'xi' ? 'SUB' : 'XI'}</button><button type="button" class="remove" data-flm-v2-remove="${esc(player.id)}">×</button>` : ''}</span>
    </div>`;
  }).join('');

  container.innerHTML = `
    <section class="flm-v2-panel flm-v2-roster">
      <div class="flm-v2-panel-title">FIRST TEAM <span>${squad.length} PLAYERS · DRAG OR CLICK</span></div>
      <div class="flm-v2-head"><span>POS</span><span>PLAYER</span><span>CON</span><span>SHP</span><span>SELECT</span></div>
      <div class="flm-v2-list">${roster}</div>
    </section>
    <section class="flm-v2-panel flm-v2-sheet">
      <div class="flm-v2-panel-title">MATCHDAY SELECTION <span>XI + ${BENCH_LIMIT} SUBS</span></div>
      <div class="flm-v2-sheet-body">
        <div class="flm-v2-section">STARTING XI <span>${lineup.length} / 11</span></div>
        <div class="flm-v2-slots">${slotHtml('xi', lineup, 11, 1)}</div>
        <div class="flm-v2-section">BENCH <span>${bench.length} / ${BENCH_LIMIT}</span></div>
        <div class="flm-v2-slots">${slotHtml('bench', bench, BENCH_LIMIT, 12)}</div>
      </div>
    </section>`;

  bindSelection(container, c, squad);
  updateHeader(c);
}

function addTo(c, squad, playerId, target, targetIndex = null) {
  if (!playerById(squad, playerId)) return;
  let lineup = [...(c.lineupIds || [])].filter(id => id !== playerId);
  let bench = [...(c.benchIds || [])].filter(id => id !== playerId);

  const list = target === 'xi' ? lineup : bench;
  const other = target === 'xi' ? bench : lineup;
  const limit = target === 'xi' ? 11 : BENCH_LIMIT;

  if (Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < limit) {
    const displaced = list[targetIndex];
    if (displaced && displaced !== playerId) {
      if (other.length < (target === 'xi' ? BENCH_LIMIT : 11)) other.push(displaced);
    }
    list[targetIndex] = playerId;
  } else if (list.length < limit) {
    list.push(playerId);
  } else {
    toast(target === 'xi' ? 'Starting XI is full. Drop onto a specific XI slot to replace someone.' : 'Bench is full. Drop onto a specific bench slot to replace someone.', true);
    return;
  }

  if (target === 'xi') setSelection(c, squad, list, other);
  else setSelection(c, squad, other, list);
}

function removePlayer(c, squad, playerId) {
  setSelection(c, squad, (c.lineupIds || []).filter(id => id !== playerId), (c.benchIds || []).filter(id => id !== playerId));
}

function bindSelection(container, c, squad) {
  container.querySelectorAll('[data-flm-v2-to-xi]').forEach(button => button.addEventListener('click', () => {
    addTo(c, squad, button.dataset.flmV2ToXi, 'xi');
    renderSelection(container, c, squad);
  }));
  container.querySelectorAll('[data-flm-v2-to-bench]').forEach(button => button.addEventListener('click', () => {
    addTo(c, squad, button.dataset.flmV2ToBench, 'bench');
    renderSelection(container, c, squad);
  }));
  container.querySelectorAll('[data-flm-v2-move]').forEach(button => button.addEventListener('click', () => {
    addTo(c, squad, button.dataset.player, button.dataset.flmV2Move);
    renderSelection(container, c, squad);
  }));
  container.querySelectorAll('[data-flm-v2-remove]').forEach(button => button.addEventListener('click', () => {
    removePlayer(c, squad, button.dataset.flmV2Remove);
    renderSelection(container, c, squad);
  }));

  container.querySelectorAll('[data-flm-v2-player],[data-flm-v2-selected-player]').forEach(node => {
    node.addEventListener('dragstart', event => {
      const playerId = node.dataset.flmV2Player || node.dataset.flmV2SelectedPlayer;
      if (!playerId) return;
      event.dataTransfer.setData('application/x-flm-player', playerId);
      event.dataTransfer.effectAllowed = 'move';
    });
  });
  container.querySelectorAll('[data-flm-v2-drop]').forEach(slot => {
    slot.addEventListener('dragover', event => { event.preventDefault(); slot.classList.add('is-drop'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('is-drop'));
    slot.addEventListener('drop', event => {
      event.preventDefault();
      slot.classList.remove('is-drop');
      const playerId = event.dataTransfer.getData('application/x-flm-player');
      if (!playerId) return;
      addTo(c, squad, playerId, slot.dataset.flmV2Drop, Number(slot.dataset.flmV2Index));
      renderSelection(container, c, squad);
    });
  });
}

function updateHeader(c) {
  const lineup = [...new Set((c.lineupIds || []).filter(Boolean))];
  const bench = [...new Set((c.benchIds || []).filter(Boolean))];
  const counter = document.querySelector('[data-lineup-counter]');
  if (counter) {
    counter.classList.add('flm-v2-counter');
    counter.classList.toggle('is-valid', lineup.length === 11);
    counter.textContent = `XI ${lineup.length}/11 · BENCH ${bench.length}/${BENCH_LIMIT}`;
  }
  const heading = document.querySelector('.career-content .career-page-heading h2');
  if (heading && document.querySelector('.flm-selection-v2')) heading.textContent = 'Matchday Squad';
}

function enhanceActions(c, squad, container) {
  const actions = document.querySelector('.career-squad-actions');
  if (!actions || actions.dataset.flmV2Actions === '1') return;
  actions.dataset.flmV2Actions = '1';
  actions.innerHTML = `<div class="flm-v2-toolbar"><button type="button" data-flm-v2-auto-xi>AUTO PICK XI</button><button type="button" data-flm-v2-auto-bench>AUTO BENCH</button><button type="button" class="danger" data-flm-v2-clear>CLEAR SQUAD</button><span class="flm-v2-note">Select your XI and up to ${BENCH_LIMIT} substitutes. Drag players directly into a slot.</span></div>`;

  actions.querySelector('[data-flm-v2-auto-xi]')?.addEventListener('click', () => {
    const ids = autoPickLineup(database.players, c.clubId);
    setSelection(c, squad, ids, (c.benchIds || []).filter(id => !ids.includes(id)));
    renderSelection(container, c, squad);
    toast('Best XI selected.');
  });
  actions.querySelector('[data-flm-v2-auto-bench]')?.addEventListener('click', () => {
    autoBench(c, squad);
    renderSelection(container, c, squad);
    toast('Best available bench selected.');
  });
  actions.querySelector('[data-flm-v2-clear]')?.addEventListener('click', () => {
    setSelection(c, squad, [], []);
    renderSelection(container, c, squad);
    toast('Matchday squad cleared.');
  });
}

async function enhanceSquad() {
  const c = career();
  const legacy = document.querySelector('.career-squad-list');
  if (!c || !legacy || document.querySelector('.flm-selection-v2') || !manager()?.loadDatabase) return;
  database ||= await manager().loadDatabase();
  const squad = squadFor(database, c);
  initialiseCareerOwnership(c, squad);
  injectStyles();

  const container = document.createElement('div');
  container.className = 'flm-selection-v2';
  container.dataset.squadV2 = '1';
  legacy.replaceWith(container);
  renderSelection(container, c, squad);
  enhanceActions(c, squad, container);
}

function queueEnhance() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(async () => {
    queued = false;
    try { await enhanceSquad(); } catch (error) { console.error('[FLM] Squad v2 failed', error); }
  });
}

new MutationObserver(queueEnhance).observe(document.body, { childList: true, subtree: true });
queueEnhance();
