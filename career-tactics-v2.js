import { FORMATION_LAYOUTS, TACTIC_OPTIONS, assignPlayersToFormation } from './matchday-engine-v0431.js?v=0.4.3.1';
import { autoPickLineup } from './manager-core.js?v=0.3.0';

const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-career-tactics-v2-style';
const BENCH_LIMIT = 9;
let database = null;
let queued = false;
let enhancing = false;

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
  c.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = 'SAVED';
}

function squadFor(db, c) {
  return db.players
    .filter(player => player.clubId === c.clubId && !player.isPlaceholder)
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0) || displayName(a).localeCompare(displayName(b)));
}

function playerById(db, id) {
  return db.players.find(player => player.id === id) || null;
}

function statusFor(c, player) {
  const status = c.playerStatus?.[player.id] || {};
  return { condition: Math.round(status.condition ?? 100), sharpness: Math.round(status.sharpness ?? 88) };
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

function emptyShape(formation) {
  const slots = (FORMATION_LAYOUTS[formation] || FORMATION_LAYOUTS['4-3-3']).map(slot => ({ ...slot }));
  return { formation, slots, assignments: slots.map(slot => ({ slotId: slot.id, playerId: null, role: slot.roles?.[0] || '' })) };
}

function shapeForIds(ids, formation, db, previous = null) {
  const cleanIds = [...new Set((ids || []).filter(Boolean))].slice(0, 11);
  if (!cleanIds.length) return emptyShape(formation);
  const next = assignPlayersToFormation(cleanIds, formation, db, previous);
  next.assignments = next.slots.map((slot, index) => next.assignments[index] || { slotId: slot.id, playerId: null, role: slot.roles?.[0] || '' });
  return next;
}

function initialShape(c, db, formation) {
  const previous = c.tacticalSetup?.formation === formation ? c.tacticalSetup : null;
  return shapeForIds(c.lineupIds || [], formation, db, previous);
}

function ensureBench(c, squad, fillLegacy = true) {
  const squadIds = new Set(squad.map(player => player.id));
  const lineup = new Set((c.lineupIds || []).filter(Boolean));
  const hadBench = Array.isArray(c.benchIds);
  let bench = hadBench ? c.benchIds : [];
  bench = [...new Set(bench.filter(id => squadIds.has(id) && !lineup.has(id)))].slice(0, BENCH_LIMIT);
  if (!hadBench && fillLegacy) {
    bench = squad.filter(player => !lineup.has(player.id)).slice(0, BENCH_LIMIT).map(player => player.id);
  }
  c.benchIds = bench;
}

function fillBench(c, squad) {
  const lineup = new Set((c.lineupIds || []).filter(Boolean));
  c.benchIds = squad.filter(player => !lineup.has(player.id)).slice(0, BENCH_LIMIT).map(player => player.id);
}

function toast(message, error = false) {
  document.querySelector('.flm-tactics-v2-toast')?.remove();
  const node = document.createElement('div');
  node.className = `flm-tactics-v2-toast${error ? ' is-error' : ''}`;
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
    .career-content:has(.flm-tactics-v2){padding-left:18px!important;padding-right:18px!important}.career-content:has(.flm-tactics-v2)>*{width:100%!important;max-width:none!important}
    .v048-tactics.flm-tactics-v2{display:grid;gap:7px;color:#eef3f6;width:100%}
    .flm-tv2-top{display:grid;grid-template-columns:auto auto auto minmax(0,1fr) auto;gap:6px;align-items:end;padding:7px 8px;border:1px solid #23558e;background:#071c38}
    .flm-tv2-field{display:grid;gap:3px}.flm-tv2-field span{color:#9caebe;font-size:7px;font-weight:950;letter-spacing:.09em}.flm-tv2-field select{min-width:112px;min-height:31px;padding:0 8px;border:1px solid #2d6dbb;border-radius:0;background:#0a2242;color:#eef3f6;font-size:8px;font-weight:900}
    .flm-tv2-actions{display:flex;justify-content:flex-end;gap:4px;align-items:end;flex-wrap:wrap}.flm-tv2-actions button{min-height:31px;padding:0 9px;border:1px solid #2d6dbb;border-radius:0;background:#0a2242;color:#d8e2ea;font-size:8px;font-weight:950;cursor:pointer}.flm-tv2-actions button:hover{background:#174d36;border-color:#55dc7c}.flm-tv2-actions .primary{background:#f4c342;border-color:#f4c342;color:#071326}.flm-tv2-actions .danger{background:#351923;border-color:#8f4850;color:#ffd0d0}
    .flm-tv2-status{align-self:center;color:#8ee7a8;font-size:8px;font-weight:900;text-align:center;white-space:nowrap}
    .flm-tv2-workspace{display:grid;grid-template-columns:minmax(360px,.72fr) minmax(620px,1.28fr);gap:8px;min-height:0;height:clamp(520px,calc(100dvh - 260px),760px)}
    .flm-tv2-sheet,.flm-tv2-board{min-height:0;border:1px solid #23558e;background:#041429;overflow:hidden}.flm-tv2-sheet{display:grid;grid-template-rows:auto 1fr}.flm-tv2-title{display:flex;align-items:center;justify-content:space-between;min-height:31px;padding:6px 9px;border-bottom:1px solid #23558e;background:#0a2242;color:#f4c342;font-size:9px;font-weight:950;letter-spacing:.09em}.flm-tv2-title span{color:#9caebe;font-size:7px}
    .flm-tv2-sheet-body{display:grid;grid-template-rows:auto minmax(0,1fr) auto minmax(0,.82fr);min-height:0}.flm-tv2-section{display:flex;justify-content:space-between;align-items:center;min-height:24px;padding:4px 8px;border-bottom:1px solid #23558e;background:#061326;color:#f4c342;font-size:8px;font-weight:950;letter-spacing:.09em}.flm-tv2-section span{color:#9caebe;font-size:7px}.flm-tv2-list{min-height:0;overflow:auto}
    .flm-tv2-row{display:grid;grid-template-columns:40px minmax(0,1fr) 62px;gap:6px;align-items:center;min-height:29px;padding:2px 8px;border-bottom:1px solid rgba(90,160,225,.18);background:#071c38;color:#eef3f6;cursor:grab}.flm-tv2-row:nth-child(even){background:#0a2242}.flm-tv2-row:hover,.flm-tv2-row.is-selected{background:#174d36}.flm-tv2-row.is-drop{outline:1px solid #f4c342;outline-offset:-1px}.flm-tv2-num{display:grid;line-height:1}.flm-tv2-num strong{color:#f4c342;font-size:9px}.flm-tv2-num small{margin-top:2px;color:#8ee7a8;font-size:6px;font-weight:950}.flm-tv2-name{min-width:0}.flm-tv2-name strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:9px}.flm-tv2-name small{display:block;color:#9caebe;font-size:7px}.flm-tv2-ready{text-align:right}.flm-tv2-ready strong{display:block;font-size:8px}.flm-tv2-ready small{display:block;color:#9caebe;font-size:6px}
    .flm-tv2-board{display:grid;grid-template-rows:auto 1fr auto}.flm-tv2-board-head{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:31px;padding:6px 9px;border-bottom:1px solid #23558e;background:#0a2242}.flm-tv2-board-head strong{color:#f4c342;font-size:9px;letter-spacing:.08em}.flm-tv2-board-head span{color:#9caebe;font-size:7px}
    .flm-tv2-pitch{position:relative;min-height:0;margin:8px;border:2px solid #2d8a4e;background:repeating-linear-gradient(90deg,#0b4b1d 0 12.5%,#0d5521 12.5% 25%);overflow:hidden}.flm-tv2-pitch:before{content:'';position:absolute;inset:3%;border:1px solid rgba(238,243,246,.52);pointer-events:none}.flm-tv2-pitch:after{content:'';position:absolute;left:3%;right:3%;top:50%;border-top:1px solid rgba(238,243,246,.52);pointer-events:none}.flm-tv2-circle{position:absolute;left:50%;top:50%;width:15%;aspect-ratio:1;border:1px solid rgba(238,243,246,.52);border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}.flm-tv2-box{position:absolute;left:25%;width:50%;height:17%;border:1px solid rgba(238,243,246,.52);pointer-events:none}.flm-tv2-box.top{top:3%;border-top:0}.flm-tv2-box.bottom{bottom:3%;border-bottom:0}
    .v048-player.flm-tv2-player{position:absolute;z-index:3;transform:translate(-50%,-50%);width:104px;min-height:42px;padding:4px 5px;border:1px solid #55dc7c;border-radius:0;background:#071c38ee;color:#fff;text-align:center;cursor:grab;box-shadow:0 3px 10px #0009}.v048-player.flm-tv2-player:hover,.v048-player.flm-tv2-player.is-selected{background:#174d36;box-shadow:0 0 0 1px #f4c342}.v048-player.flm-tv2-player.is-drop{background:#4a3b12}.flm-tv2-player .slot{display:block;color:#f4c342;font-size:6px;font-weight:950}.flm-tv2-player strong{display:block;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:8px}.flm-tv2-player small{display:block;margin-top:1px;color:#9caebe;font-size:6px}
    .flm-tv2-board-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:31px;padding:5px 9px;border-top:1px solid #23558e;background:#071c38;color:#9caebe;font-size:7px}.flm-tv2-board-foot strong{color:#8ee7a8}
    .flm-tactics-v2-toast{position:fixed;z-index:99999;left:50%;bottom:24px;transform:translate(-50%,8px);opacity:0;padding:8px 12px;border:1px solid #55dc7c;background:#071c38;color:#eef3f6;font-size:9px;font-weight:900;transition:.16s}.flm-tactics-v2-toast.is-visible{opacity:1;transform:translate(-50%,0)}.flm-tactics-v2-toast.is-error{border-color:#c35b65;color:#ffd1d5}
    @media(max-width:1040px){.flm-tv2-top{grid-template-columns:repeat(3,1fr)}.flm-tv2-status{grid-column:1/2}.flm-tv2-actions{grid-column:2/4}.flm-tv2-workspace{grid-template-columns:1fr;height:auto}.flm-tv2-sheet-body{max-height:610px}.flm-tv2-pitch{min-height:560px}}
    @media(max-width:650px){.career-content:has(.flm-tactics-v2){padding-left:8px!important;padding-right:8px!important}.flm-tv2-top{grid-template-columns:1fr 1fr}.flm-tv2-field select{width:100%;min-width:0}.flm-tv2-status{grid-column:1/3}.flm-tv2-actions{grid-column:1/3;justify-content:flex-start}.flm-tv2-pitch{min-height:480px}.v048-player.flm-tv2-player{width:82px}.flm-tv2-player small{display:none}}
  `;
  document.head.appendChild(style);
}

function buildTactics(root, c, db) {
  const old = root.querySelector('.v044-tactics');
  if (!old || root.querySelector('.flm-tactics-v2')) return;

  const squad = squadFor(db, c);
  ensureBench(c, squad, true);
  const tactics = defaultTactics(c);
  let shape = initialShape(c, db, tactics.formation);
  let selectedSlotId = null;

  const container = document.createElement('div');
  container.className = 'v048-tactics flm-tactics-v2';
  container.dataset.v048Tactics = '2';
  old.replaceWith(container);

  const assignment = slotId => shape.assignments.find(item => item.slotId === slotId);

  function selectedIds() {
    return shape.assignments.map(item => item.playerId).filter(Boolean);
  }

  function reconcileBench(displacedId = null, incomingId = null) {
    const lineup = new Set(selectedIds());
    let bench = [...new Set((c.benchIds || []).filter(id => !lineup.has(id) && playerById(db, id)))];
    if (incomingId) bench = bench.filter(id => id !== incomingId);
    if (displacedId && !lineup.has(displacedId) && !bench.includes(displacedId)) bench.unshift(displacedId);
    c.benchIds = bench.slice(0, BENCH_LIMIT);
  }

  function saveShape() {
    c.lineupIds = selectedIds();
    c.tactics = { ...tactics, formation: shape.formation };
    c.tacticalSetup = {
      formation: shape.formation,
      assignments: shape.assignments.map(item => ({ slotId: item.slotId, playerId: item.playerId || null, role: item.role }))
    };
    c.manualLineupSelection = true;
    reconcileBench();
    persist(c);
  }

  function replaceSlot(slotId, playerId) {
    if (!playerId || !playerById(db, playerId)) return;
    const target = assignment(slotId);
    if (!target) return;
    const source = shape.assignments.find(item => item.playerId === playerId);
    const displaced = target.playerId || null;

    if (source && source.slotId !== slotId) {
      source.playerId = displaced;
      target.playerId = playerId;
      reconcileBench();
    } else if (!source) {
      target.playerId = playerId;
      reconcileBench(displaced, playerId);
    }
    selectedSlotId = null;
    saveShape();
    render();
  }

  function moveSlotToBench(slotId, benchIndex) {
    const source = assignment(slotId);
    if (!source?.playerId) return;
    const outgoing = source.playerId;
    const bench = [...(c.benchIds || [])];
    const incoming = bench[benchIndex] || null;
    source.playerId = incoming;
    bench[benchIndex] = outgoing;
    c.benchIds = bench.filter(Boolean).slice(0, BENCH_LIMIT);
    selectedSlotId = null;
    saveShape();
    render();
  }

  function reorderBench(playerId, targetIndex) {
    const bench = [...(c.benchIds || [])].filter(id => id !== playerId);
    bench.splice(Math.max(0, Math.min(targetIndex, BENCH_LIMIT - 1)), 0, playerId);
    c.benchIds = bench.slice(0, BENCH_LIMIT);
    persist(c);
    render();
  }

  function pitchHtml() {
    return shape.slots.map(slot => {
      const a = assignment(slot.id);
      const player = a?.playerId ? playerById(db, a.playerId) : null;
      return `<button type="button" draggable="${player ? 'true' : 'false'}" class="v048-player flm-tv2-player ${selectedSlotId === slot.id ? 'is-selected' : ''}" style="left:${slot.x}%;top:${slot.y}%" data-v048-slot="${esc(slot.id)}" data-flm-tv2-slot="${esc(slot.id)}" data-player-id="${esc(player?.id || '')}"><span class="slot">${esc(slot.label)}</span><strong>${esc(player ? displayName(player) : 'EMPTY')}</strong><small>${esc(player?.primaryPosition || 'Drop player')}</small></button>`;
    }).join('');
  }

  function xiRows() {
    return shape.slots.map((slot, index) => {
      const a = assignment(slot.id);
      const player = a?.playerId ? playerById(db, a.playerId) : null;
      const status = player ? statusFor(c, player) : null;
      return `<div class="flm-tv2-row ${selectedSlotId === slot.id ? 'is-selected' : ''}" data-flm-tv2-sheet-slot="${esc(slot.id)}" data-flm-tv2-drop-slot="${esc(slot.id)}" ${player ? `draggable="true" data-player-id="${esc(player.id)}"` : ''}><span class="flm-tv2-num"><strong>${index + 1}</strong><small>${esc(slot.label)}</small></span><span class="flm-tv2-name"><strong>${esc(player ? displayName(player) : 'EMPTY')}</strong><small>${esc(player?.primaryPosition || 'Drop player here')}</small></span><span class="flm-tv2-ready">${status ? `<strong>${status.condition}%</strong><small>${status.sharpness}% SHP</small>` : '<small>OPEN</small>'}</span></div>`;
    }).join('');
  }

  function benchRows() {
    const ids = [...(c.benchIds || [])];
    return Array.from({ length: BENCH_LIMIT }, (_, index) => {
      const player = ids[index] ? playerById(db, ids[index]) : null;
      const status = player ? statusFor(c, player) : null;
      return `<div class="flm-tv2-row" data-flm-tv2-bench-index="${index}" ${player ? `draggable="true" data-flm-tv2-bench-player="${esc(player.id)}"` : ''}><span class="flm-tv2-num"><strong>${index + 12}</strong><small>SUB</small></span><span class="flm-tv2-name"><strong>${esc(player ? displayName(player) : 'EMPTY')}</strong><small>${esc(player?.primaryPosition || 'Drop player here')}</small></span><span class="flm-tv2-ready">${status ? `<strong>${status.condition}%</strong><small>${status.sharpness}% SHP</small>` : '<small>OPEN</small>'}</span></div>`;
    }).join('');
  }

  function render() {
    const complete = selectedIds().length === 11 && selectedIds().some(id => playerById(db, id)?.positionGroup === 'GK');
    container.innerHTML = `
      <div class="flm-tv2-top">
        <label class="flm-tv2-field"><span>FORMATION</span><select data-flm-tv2-formation>${Object.keys(FORMATION_LAYOUTS).map(value => `<option ${shape.formation === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></label>
        <label class="flm-tv2-field"><span>MENTALITY</span><select data-flm-tv2-tactic="mentality">${TACTIC_OPTIONS.mentality.map(value => `<option ${tactics.mentality === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></label>
        <label class="flm-tv2-field"><span>PRESSING</span><select data-flm-tv2-tactic="pressing">${TACTIC_OPTIONS.pressing.map(value => `<option ${tactics.pressing === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></label>
        <div class="flm-tv2-status">${selectedIds().length}/11 XI · ${(c.benchIds || []).length}/${BENCH_LIMIT} BENCH${complete ? ' · READY' : ''}</div>
        <div class="flm-tv2-actions"><button type="button" data-flm-tv2-edit>EDIT SQUAD</button><button type="button" data-flm-tv2-auto>AUTO XI</button><button type="button" class="danger" data-flm-tv2-clear>CLEAR XI</button><button type="button" class="primary" data-flm-tv2-save>SAVE PLAN</button></div>
      </div>
      <div class="flm-tv2-workspace">
        <section class="flm-tv2-sheet"><div class="flm-tv2-title">MATCHDAY SQUAD <span>DRAG XI ↔ BENCH</span></div><div class="flm-tv2-sheet-body"><div class="flm-tv2-section">STARTING XI <span>${selectedIds().length} / 11</span></div><div class="flm-tv2-list">${xiRows()}</div><div class="flm-tv2-section">BENCH <span>${(c.benchIds || []).length} / ${BENCH_LIMIT}</span></div><div class="flm-tv2-list">${benchRows()}</div></div></section>
        <section class="flm-tv2-board"><div class="flm-tv2-board-head"><strong>${esc(shape.formation)} SHAPE</strong><span>Drag a substitute onto any position · drag players between positions to swap</span></div><div class="flm-tv2-pitch"><i class="flm-tv2-circle"></i><i class="flm-tv2-box top"></i><i class="flm-tv2-box bottom"></i>${pitchHtml()}</div><div class="flm-tv2-board-foot"><span>Click two pitch positions to swap them. Use Squad to choose different substitutes.</span><strong>${complete ? 'XI VALID' : 'XI INCOMPLETE'}</strong></div></section>
      </div>`;
    bind();
  }

  function bindDragSource(node, playerId, slotId = '') {
    node.addEventListener('dragstart', event => {
      if (!playerId) { event.preventDefault(); return; }
      event.dataTransfer.setData('application/x-flm-player', playerId);
      if (slotId) event.dataTransfer.setData('application/x-flm-slot', slotId);
      event.dataTransfer.effectAllowed = 'move';
    });
  }

  function bindDrop(node, handler) {
    node.addEventListener('dragover', event => { event.preventDefault(); node.classList.add('is-drop'); });
    node.addEventListener('dragleave', () => node.classList.remove('is-drop'));
    node.addEventListener('drop', event => {
      event.preventDefault();
      node.classList.remove('is-drop');
      handler(event);
    });
  }

  function bind() {
    container.querySelector('[data-flm-tv2-formation]')?.addEventListener('change', event => {
      tactics.formation = event.target.value;
      shape = shapeForIds(selectedIds(), tactics.formation, db, shape);
      selectedSlotId = null;
      saveShape();
      render();
    });
    container.querySelectorAll('[data-flm-tv2-tactic]').forEach(select => select.addEventListener('change', () => {
      tactics[select.dataset.flmTv2Tactic] = select.value;
      c.tactics = { ...tactics, formation: shape.formation };
      persist(c);
    }));
    container.querySelector('[data-flm-tv2-edit]')?.addEventListener('click', () => {
      (document.querySelector('.career-nav [data-career-tab="squad"]') || document.querySelector('[data-career-tab="squad"]'))?.click();
    });
    container.querySelector('[data-flm-tv2-auto]')?.addEventListener('click', () => {
      const ids = autoPickLineup(db.players, c.clubId);
      shape = shapeForIds(ids, shape.formation, db, null);
      c.lineupIds = ids;
      fillBench(c, squad);
      saveShape();
      selectedSlotId = null;
      render();
      toast('Best XI and bench loaded.');
    });
    container.querySelector('[data-flm-tv2-clear]')?.addEventListener('click', () => {
      shape = emptyShape(shape.formation);
      c.lineupIds = [];
      delete c.tacticalSetup;
      persist(c);
      selectedSlotId = null;
      render();
      toast('Starting XI cleared.');
    });
    container.querySelector('[data-flm-tv2-save]')?.addEventListener('click', () => {
      const ids = selectedIds();
      if (ids.length !== 11 || !ids.some(id => playerById(db, id)?.positionGroup === 'GK')) {
        toast('Select exactly 11 players including a goalkeeper before saving.', true);
        return;
      }
      saveShape();
      toast('Match plan saved.');
    });

    container.querySelectorAll('[data-flm-tv2-slot]').forEach(chip => {
      const slotId = chip.dataset.flmTv2Slot;
      const playerId = chip.dataset.playerId;
      if (playerId) bindDragSource(chip, playerId, slotId);
      bindDrop(chip, event => {
        const sourceSlot = event.dataTransfer.getData('application/x-flm-slot');
        const player = event.dataTransfer.getData('application/x-flm-player');
        if (sourceSlot && sourceSlot !== slotId) {
          const source = assignment(sourceSlot);
          const target = assignment(slotId);
          [source.playerId, target.playerId] = [target.playerId, source.playerId];
          selectedSlotId = null;
          saveShape();
          render();
        } else if (player) replaceSlot(slotId, player);
      });
      chip.addEventListener('click', () => {
        if (!selectedSlotId) { selectedSlotId = slotId; render(); return; }
        if (selectedSlotId === slotId) { selectedSlotId = null; render(); return; }
        const source = assignment(selectedSlotId);
        const target = assignment(slotId);
        [source.playerId, target.playerId] = [target.playerId, source.playerId];
        selectedSlotId = null;
        saveShape();
        render();
      });
    });

    container.querySelectorAll('[data-flm-tv2-sheet-slot]').forEach(row => {
      const slotId = row.dataset.flmTv2SheetSlot;
      const playerId = row.dataset.playerId;
      if (playerId) bindDragSource(row, playerId, slotId);
      bindDrop(row, event => {
        const sourceSlot = event.dataTransfer.getData('application/x-flm-slot');
        const player = event.dataTransfer.getData('application/x-flm-player');
        if (sourceSlot && sourceSlot !== slotId) {
          const source = assignment(sourceSlot);
          const target = assignment(slotId);
          [source.playerId, target.playerId] = [target.playerId, source.playerId];
          saveShape();
          render();
        } else if (player) replaceSlot(slotId, player);
      });
    });

    container.querySelectorAll('[data-flm-tv2-bench-index]').forEach(row => {
      const index = Number(row.dataset.flmTv2BenchIndex);
      const playerId = row.dataset.flmTv2BenchPlayer || '';
      if (playerId) bindDragSource(row, playerId);
      bindDrop(row, event => {
        const sourceSlot = event.dataTransfer.getData('application/x-flm-slot');
        const player = event.dataTransfer.getData('application/x-flm-player');
        if (sourceSlot) moveSlotToBench(sourceSlot, index);
        else if (player && player !== playerId) reorderBench(player, index);
      });
    });
  }

  saveShape();
  render();
}

async function enhance() {
  if (enhancing) return;
  const c = career();
  const root = document.querySelector('.career-content');
  if (!c || !root || root.querySelector('.flm-tactics-v2') || !root.querySelector('.v044-tactics') || !manager()?.loadDatabase) return;
  enhancing = true;
  try {
    database ||= await manager().loadDatabase();
    injectStyles();
    buildTactics(root, c, database);
  } finally {
    enhancing = false;
  }
}

function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(async () => {
    queued = false;
    try { await enhance(); } catch (error) { console.error('[FLM] Tactics v2 failed', error); }
  });
}

new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
queue();
