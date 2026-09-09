import { userMatchLineup, eligibleBenchIds, substitutionStatus } from './matchday-substitution-state-v1.js?v=1.0.0';

const STYLE_ID = 'flm-matchday-substitution-sheet-v1-style';

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

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

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .flm-match-modal{position:fixed;inset:0;width:100vw;height:100vh;padding:18px;z-index:100;align-items:center;justify-content:center}
    .flm-match-dialog:has(.flm-v049-match-sheet){width:min(1540px,calc(100vw - 36px));max-height:calc(100vh - 36px);padding:12px;border-color:#23558e;border-radius:2px;background:#041429;overflow:hidden}
    .flm-v049-match-sheet{display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;gap:8px;height:100%;min-height:0;color:#eef3f6}
    .flm-v049-context{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:6px 9px;border:1px solid #23558e;background:#061326;color:#9caebe;font-size:9px;font-weight:800}
    .flm-v049-context strong{color:#eef3f6;font-size:12px}.flm-v049-context span{color:#f4c342;font-size:8px;letter-spacing:.08em}
    .flm-v049-status{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 9px;border:1px solid #23558e;background:#071c38;color:#9caebe;font-size:8px;letter-spacing:.05em}
    .flm-v049-status strong{color:#f4c342;font-size:9px}
    .flm-v049-workspace{display:grid;grid-template-columns:minmax(430px,.82fr) minmax(600px,1.18fr);gap:8px;min-height:0;height:clamp(560px,calc(100vh - 250px),680px)}
    .flm-v049-squad,.flm-v049-board{border:1px solid #23558e;background:#041429;overflow:hidden}
    .flm-v049-squad{display:grid;grid-template-rows:1fr;min-width:0;min-height:0}
    .flm-v049-list{display:grid;grid-template-rows:28px 22px repeat(11,minmax(0,1fr)) 22px repeat(9,minmax(0,1fr));overflow:hidden;min-height:0;height:100%}
    .flm-v049-sheet-head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:5px 9px;border-bottom:1px solid #23558e;background:#0a2242;color:#f4c342;font-size:8px;font-weight:950;letter-spacing:.09em}
    .flm-v049-sheet-head span:last-child{color:#9caebe;font-size:7px}
    .flm-v049-section{display:flex;align-items:center;padding:2px 8px;color:#f4c342;background:#061326;border-bottom:1px solid #23558e;font-size:8px;font-weight:950;letter-spacing:.1em}
    .flm-v049-section.bench{border-top:1px solid #23558e}
    .flm-v049-row{width:100%;display:grid;grid-template-columns:42px minmax(0,1fr) 68px;gap:7px;align-items:center;min-height:0;padding:1px 8px;border:0;border-bottom:1px solid rgba(90,160,225,.2);background:#071c38;color:#eef3f6;text-align:left;cursor:pointer}
    .flm-v049-row:nth-child(even){background:#0a2242}
    .flm-v049-row:hover,.flm-v049-row.is-selected{background:#174d36}
    .flm-v049-row.is-off{border-left:2px solid #ef786f;background:#3b1d25}
    .flm-v049-row.is-in{border-left:2px solid #55dc7c;background:#174d36}
    .flm-v049-row[draggable="true"]{cursor:grab;touch-action:manipulation}
    .flm-v049-row[draggable="true"].is-dragging{opacity:.48;cursor:grabbing}
    .flm-v049-row.is-drop{background:#174d36;box-shadow:inset 0 0 0 1px #f4c342}
    .flm-v049-slot{display:grid;gap:1px;justify-items:start;line-height:1}
    .flm-v049-slot strong{color:#f4c342;font-size:9px}
    .flm-v049-slot small{color:#8ee7a8;font-size:6px;font-weight:950}
    .flm-v049-name{min-width:0}
    .flm-v049-name strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px}
    .flm-v049-name small{display:block;margin-top:1px;color:#9caebe;font-size:6px}
    .flm-v049-condition{text-align:right;color:#eef3f6;font-size:7px;font-weight:850}
    .flm-v049-condition small{display:block;margin-top:1px;color:#9caebe;font-size:6px;font-weight:500}
    .flm-v049-board{display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-width:0;min-height:0}
    .flm-v049-board-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 9px;border-bottom:1px solid #23558e;background:#071c38}
    .flm-v049-board-head strong{color:#f4c342;font-size:8px;letter-spacing:.1em}
    .flm-v049-board-head span{color:#9caebe;font-size:8px;text-align:right}
    .flm-v049-pitch{position:relative;height:auto;min-height:0;margin:8px;border:2px solid #2d8a4e;background:repeating-linear-gradient(90deg,#0b4b1d 0 12.5%,#0d5521 12.5% 25%);overflow:hidden}
    .flm-v049-pitch:before{content:'';position:absolute;inset:3%;border:1px solid #ffffff55;pointer-events:none}
    .flm-v049-pitch:after{content:'';position:absolute;left:3%;right:3%;top:50%;border-top:1px solid #ffffff55;pointer-events:none}
    .flm-v049-circle{position:absolute;left:50%;top:50%;width:15%;aspect-ratio:1;border:1px solid #ffffff55;border-radius:50%;transform:translate(-50%,-50%)}
    .flm-v049-box{position:absolute;left:25%;width:50%;height:17%;border:1px solid #ffffff55}
    .flm-v049-box.top{top:3%;border-top:0}.flm-v049-box.bottom{bottom:3%;border-bottom:0}
    .flm-v049-player{position:absolute;z-index:2;transform:translate(-50%,-50%);width:104px;min-height:34px;padding:3px 4px;border:1px solid #55dc7c;background:#071c38ee;color:#fff;text-align:center;cursor:pointer;box-shadow:0 3px 9px #0009}
    .flm-v049-player:hover,.flm-v049-player.is-selected{box-shadow:0 0 0 2px #f4c342,0 3px 9px #0009}
    .flm-v049-player.is-off{border-color:#ef786f;background:#3b1d25}.flm-v049-player.is-in{border-color:#55dc7c;background:#174d36}
    .flm-v049-player.is-drop{transform:translate(-50%,-50%) scale(1.05);background:#174d36}
    .flm-v049-player .position{display:block;color:#f4c342;font-size:6px;font-weight:950}
    .flm-v049-player strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:8px}
    .flm-v049-player small{display:block;margin-top:1px;color:#9caebe;font-size:6px}
    .flm-v049-plan{display:flex;justify-content:space-between;align-items:center;gap:9px;min-height:43px;padding:7px 9px;border-top:1px solid #23558e;background:#071c38}
    .flm-v049-plan span{display:block;color:#9caebe;font-size:7px;letter-spacing:.1em}.flm-v049-plan strong{display:block;margin-top:2px;font-size:10px}.flm-v049-plan .in{color:#55dc7c}.flm-v049-plan .out{color:#ef786f}.flm-v049-plan em{color:#f4c342;font-size:7px;font-style:normal;font-weight:950;text-align:right}
    .flm-v049-actions{display:flex;justify-content:space-between;align-items:center;gap:8px;padding-top:8px;border-top:1px solid #23558e}.flm-v049-actions button{min-height:32px;padding:0 12px;border:1px solid #2d6dbb;border-radius:0;background:#0a2242;color:#eef3f6;font-size:8px;font-weight:950;cursor:pointer}.flm-v049-actions .primary{background:#f4c342;color:#071326;border-color:#f4c342}.flm-v049-actions button:disabled{cursor:not-allowed;opacity:.45}
    @media(max-width:900px){.flm-match-modal{position:absolute;width:100%;height:100%;padding:8px}.flm-match-dialog:has(.flm-v049-match-sheet){width:100%;max-height:96%;overflow:auto}.flm-v049-workspace{grid-template-columns:1fr;height:auto}.flm-v049-list{grid-template-rows:auto repeat(11,34px) auto repeat(9,34px);overflow:auto;max-height:430px}.flm-v049-pitch{height:480px}.flm-v049-board{order:1;min-height:540px}.flm-v049-squad{order:2}.flm-v049-context{align-items:flex-start;flex-direction:column;gap:3px}}
  `;
  document.head.appendChild(style);
}

function playerFor(db, id) {
  return db.players.find(player => player.id === id);
}

function conditionFor(state, id) {
  return Math.round(state.conditions?.[id] ?? 100);
}

export function renderMatchSubstitutionSheet({ dialog, state, db, head, close, openTactics, makeSubstitution, setState, addEvent, getShape }) {
  ensureStyles();
  let selectedOutId = userMatchLineup(state).find(id => (state.injuredIds || []).includes(id)) || null;
  let selectedInId = null;
  let draggedBenchId = null;
  let suppressClickUntil = 0;
  let busy = false;

  function currentLineup() {
    return userMatchLineup(state);
  }

  function availableBench() {
    return eligibleBenchIds(state, db);
  }

  function planText(outPlayer, inPlayer) {
    if (!outPlayer && !inPlayer) return '<div><span>PLANNED CHANGE</span><strong>Select a player off, then choose a substitute.</strong></div><em>SELECT PLAYER OFF</em>';
    if (!outPlayer) return `<div><span>SUBSTITUTE READY</span><strong class="in">IN · ${esc(displayName(inPlayer))}</strong></div><em>SELECT PLAYER OFF</em>`;
    if (!inPlayer) return `<div><span>PLAYER OFF</span><strong class="out">OUT · ${esc(displayName(outPlayer))}</strong></div><em>SELECT REPLACEMENT</em>`;
    return `<div><span>PLANNED CHANGE</span><strong><b class="in">IN · ${esc(displayName(inPlayer))}</b> → <b class="out">OUT · ${esc(displayName(outPlayer))}</b></strong></div><em>READY TO CONFIRM</em>`;
  }

  function render() {
    const lineup = currentLineup();
    const bench = availableBench();
    const shape = getShape();
    const assignmentFor = id => shape.assignments.find(item => item.playerId === id);
    const slotFor = id => {
      const assignment = assignmentFor(id);
      return assignment ? shape.slots.find(slot => slot.id === assignment.slotId) : null;
    };
    const outPlayer = selectedOutId ? playerFor(db, selectedOutId) : null;
    const inPlayer = selectedInId ? playerFor(db, selectedInId) : null;
    const clubName = id => db.clubs?.find(club => club.id === id)?.name || (id === state.homeClubId ? 'Home' : id === state.awayClubId ? 'Away' : 'Match');
    const matchContext = `${clubName(state.homeClubId)} ${state.homeGoals ?? 0}–${state.awayGoals ?? 0} ${clubName(state.awayClubId)}`;
    const availability = substitutionStatus(state, db, selectedOutId);
    const remaining = availability.remaining;
    const windowsUsed = [...new Set(state.substitutionWindowMinutes || [])].length;
    const windowInfo = state.substitutionWindowLimit == null ? 'FULL SQUAD BENCH' : `${Math.max(0, state.substitutionWindowLimit - windowsUsed)} WINDOWS LEFT`;
    const validPlan = Boolean(outPlayer && inPlayer && availability.canSubstitute && availability.replacementIds.includes(selectedInId) && !busy);
    const starters = shape.slots.map((slot, index) => {
      const assignment = shape.assignments.find(item => item.slotId === slot.id);
      const player = assignment?.playerId ? playerFor(db, assignment.playerId) : null;
      if (!player || !lineup.includes(player.id)) return '';
      const selected = selectedOutId === player.id;
      return `<button type="button" class="flm-v049-row ${selected ? 'is-off' : ''}" data-v049-out="${esc(player.id)}"><span class="flm-v049-slot"><strong>${index + 1}</strong><small>${esc(slot.label)}</small></span><span class="flm-v049-name"><strong>${esc(displayName(player))}</strong><small>${esc(player.primaryPosition || '—')}</small></span><span class="flm-v049-condition">${conditionFor(state, player.id)}%<small>CONDITION</small></span></button>`;
    }).join('');
    const benchRows = bench.map((id, index) => {
      const player = playerFor(db, id);
      const selected = selectedInId === id;
      return `<button type="button" draggable="true" class="flm-v049-row ${selected ? 'is-in' : ''}" data-v049-in="${esc(id)}"><span class="flm-v049-slot"><strong>${index + 12}</strong><small>SUB</small></span><span class="flm-v049-name"><strong>${esc(displayName(player))}</strong><small>${esc(player?.primaryPosition || '—')}</small></span><span class="flm-v049-condition">${conditionFor(state, id)}%<small>CONDITION</small></span></button>`;
    }).join('');
    const pitch = shape.slots.map(slot => {
      const assignment = shape.assignments.find(item => item.slotId === slot.id);
      const player = assignment?.playerId ? playerFor(db, assignment.playerId) : null;
      if (!player || !lineup.includes(player.id)) return '';
      const selectedOut = selectedOutId === player.id;
      const selectedIn = selectedInId === player.id;
      return `<button type="button" class="flm-v049-player ${selectedOut ? 'is-off' : ''} ${selectedIn ? 'is-in' : ''}" style="left:${slot.x}%;top:${slot.y}%" data-v049-pitch-out="${esc(player.id)}"><span class="position">${esc(slot.label)}</span><strong>${esc(displayName(player))}</strong><small>${conditionFor(state, player.id)}% CON</small></button>`;
    }).join('');
    dialog.dataset.v049MatchSheet = '1';
    dialog.innerHTML = `${head('Match Plan','IN-MATCH MANAGEMENT')}<div class="flm-v049-match-sheet"><div class="flm-v049-context"><strong>${esc(matchContext)}</strong><span>${state.minute}' · ${windowInfo}</span></div><div class="flm-v049-status"><strong>${remaining} SUBSTITUTIONS REMAINING</strong><span>XI ${lineup.length} · BENCH ${bench.length}</span></div><div class="flm-v049-workspace"><aside class="flm-v049-squad"><div class="flm-v049-list"><div class="flm-v049-sheet-head"><span>MATCHDAY SQUAD</span><span>${lineup.length} / 11 ON PITCH</span></div><div class="flm-v049-section">STARTING XI</div>${starters}<div class="flm-v049-section bench">BENCH · ${bench.length}</div>${benchRows || '<div class="flm-v049-row"><span class="flm-v049-name"><strong>NO AVAILABLE SUBSTITUTES</strong></span></div>'}</div></aside><section class="flm-v049-board"><div class="flm-v049-board-head"><strong>TACTICAL BOARD</strong><span>Click players to plan a change, or drag a bench row onto a starter.</span></div><div class="flm-v049-pitch"><i class="flm-v049-circle"></i><i class="flm-v049-box top"></i><i class="flm-v049-box bottom"></i>${pitch}</div><div class="flm-v049-plan" data-v049-plan>${planText(outPlayer, inPlayer)}</div></section></div><div class="flm-v049-actions"><button type="button" data-v049-tactics>TACTICS OPTIONS</button><button type="button" data-close-manager>CLOSE</button><button type="button" class="primary" data-v049-confirm ${validPlan ? '' : 'disabled'}>CONFIRM SUB</button></div></div>`;
    // Friendlies can register more than nine substitutes. Keep them reachable
    // without squeezing all rows into the old fixed nine-bench grid.
    const list = dialog.querySelector('.flm-v049-list');
    list.style.gridTemplateRows = `28px 22px repeat(${lineup.length}, minmax(26px, 1fr)) 22px repeat(${Math.max(1, bench.length)}, minmax(26px, 1fr))`;
    list.style.overflowY = 'auto';
    if (availability.reason) dialog.querySelector('.flm-v049-status strong').textContent = availability.reason;
    const clearDropHighlights = () => {
      dialog.querySelectorAll('.flm-v049-player.is-drop,.flm-v049-row.is-drop').forEach(item => item.classList.remove('is-drop'));
    };
    dialog.querySelectorAll('[data-v049-out],[data-v049-pitch-out]').forEach(button => {
      button.addEventListener('click', () => {
        if (Date.now() < suppressClickUntil) return;
        selectedOutId = button.dataset.v049Out || button.dataset.v049PitchOut;
        render();
      });
    });
    dialog.querySelectorAll('[data-v049-in]').forEach(button => {
      button.addEventListener('click', () => {
        if (Date.now() < suppressClickUntil) return;
        selectedInId = button.dataset.v049In;
        render();
      });
      button.addEventListener('dragstart', event => {
        draggedBenchId = button.dataset.v049In;
        selectedInId = draggedBenchId;
        suppressClickUntil = Date.now() + 350;
        button.classList.add('is-dragging');
        dialog.querySelector('.flm-v049-match-sheet')?.classList.add('is-dragging');
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'copy';
          event.dataTransfer.setData('application/x-flm-match-sub', draggedBenchId);
          event.dataTransfer.setData('text/plain', draggedBenchId);
        }
      });
      button.addEventListener('dragend', () => {
        suppressClickUntil = Date.now() + 250;
        draggedBenchId = null;
        button.classList.remove('is-dragging');
        dialog.querySelector('.flm-v049-match-sheet')?.classList.remove('is-dragging');
        clearDropHighlights();
      });
    });
    const bindDropTarget = (button, outId) => {
      button.addEventListener('dragenter', event => {
        event.preventDefault();
        button.classList.add('is-drop');
      });
      button.addEventListener('dragover', event => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        button.classList.add('is-drop');
      });
      button.addEventListener('dragleave', event => {
        if (!event.relatedTarget || !button.contains(event.relatedTarget)) button.classList.remove('is-drop');
      });
      button.addEventListener('drop', event => {
        event.preventDefault();
        const incoming = event.dataTransfer?.getData('application/x-flm-match-sub')
          || event.dataTransfer?.getData('text/plain')
          || draggedBenchId;
        button.classList.remove('is-drop');
        draggedBenchId = null;
        if (!incoming || !bench.includes(incoming)) return;
        suppressClickUntil = Date.now() + 250;
        selectedInId = incoming;
        selectedOutId = outId;
        render();
      });
    };
    dialog.querySelectorAll('[data-v049-out]').forEach(button => bindDropTarget(button, button.dataset.v049Out));
    dialog.querySelectorAll('[data-v049-pitch-out]').forEach(button => bindDropTarget(button, button.dataset.v049PitchOut));
    dialog.querySelector('[data-v049-confirm]')?.addEventListener('click', async () => {
      if (!selectedOutId || !selectedInId || busy) return;
      busy = true;
      render();
      try {
        const result = makeSubstitution(state, selectedOutId, selectedInId);
        state = result.state;
        setState(state);
        await addEvent(result.event);
        selectedOutId = null;
        selectedInId = null;
        busy = false;
        render();
      } catch (error) {
        busy = false;
        render();
        const status = dialog.querySelector('.flm-v049-status');
        if (status) status.innerHTML = `<strong>${esc(error.message)}</strong><span>Choose another change</span>`;
      }
    });
    dialog.querySelector('[data-v049-tactics]')?.addEventListener('click', () => openTactics?.());
    dialog.querySelectorAll('[data-close-manager]').forEach(button => button.addEventListener('click', close));
  }

  render();
}
