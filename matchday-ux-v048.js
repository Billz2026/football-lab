import { FORMATION_LAYOUTS } from './matchday-engine-v0431.js?v=0.4.3.1';

const STYLE_ID = 'flm-v048-matchday-ux-style';
let queued = false;
let selectedBenchId = null;
let selectedShapeSlot = null;

const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
  .v048-native-hidden{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important;opacity:0!important;pointer-events:none!important}.v048-live-tabs{display:flex;gap:3px;margin:8px 0}.v048-live-tabs button,.v048-live-segment button,.v048-live-formation select{min-height:36px;border:1px solid #ffffff20;border-radius:5px;background:#121212;color:#d4d0c7;padding:0 10px;font-size:9px;font-weight:900;cursor:pointer}.v048-live-tabs button.is-active,.v048-live-segment button.is-active{border-color:#ecd752;background:#33290d;color:#fff2a0}.v048-live-formation{display:flex;align-items:center;gap:8px;margin:9px 0}.v048-live-formation span,.v048-live-label{color:#938c81;font-size:8px;font-weight:950;letter-spacing:.1em}.v048-live-panel{min-height:76px;padding:10px;border:1px solid #ffffff12;background:#080808}.v048-live-panel-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.v048-live-segment{display:flex;gap:3px;flex-wrap:wrap}.v048-live-help{margin-left:auto;color:#777;font-size:8px}.v048-live-tactics .flm-preset-row{grid-template-columns:repeat(3,minmax(0,1fr));margin:8px 0}.v048-live-tactics .flm-preset-row button{border-radius:5px;min-height:34px;font-size:8px}
  .v048-sub-shell{display:grid;grid-template-columns:minmax(420px,1.2fr) minmax(240px,.8fr);gap:10px}.v048-sub-pitch{position:relative;min-height:520px;border:2px solid #2c7639;background:repeating-linear-gradient(90deg,#0b491c 0 12.5%,#0d5320 12.5% 25%);overflow:hidden}.v048-sub-pitch:before{content:'';position:absolute;inset:3%;border:1px solid #ffffff55}.v048-sub-pitch:after{content:'';position:absolute;left:3%;right:3%;top:50%;border-top:1px solid #ffffff55}.v048-sub-player{position:absolute;z-index:2;transform:translate(-50%,-50%);width:108px;padding:6px;border:1px solid #ffffff36;border-radius:6px;background:#101010e8;color:#fff;text-align:center;cursor:pointer}.v048-sub-player.is-off{border-color:#ef6b62;background:#3b1515}.v048-sub-player.is-drop{box-shadow:0 0 0 2px #e8d253}.v048-sub-player span{display:block;color:#ead955;font-size:7px;font-weight:950}.v048-sub-player strong{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v048-sub-player small{display:block;color:#999;font-size:7px}.v048-bench{display:grid;grid-template-rows:auto 1fr;border:1px solid #ffffff16;background:#080808}.v048-bench-head{padding:9px;border-bottom:1px solid #ffffff14;color:#e5d650;font-size:9px;font-weight:950}.v048-bench-list{display:grid;align-content:start;gap:3px;padding:6px;max-height:520px;overflow:auto}.v048-bench-player{display:grid;grid-template-columns:42px 1fr 48px;gap:6px;align-items:center;min-height:40px;padding:5px 7px;border:1px solid #ffffff10;border-radius:4px;background:#111;color:#ddd;text-align:left;cursor:grab}.v048-bench-player.is-in{border-color:#4cc477;background:#12351f}.v048-bench-player span{color:#e4d452;font-size:8px;font-weight:950}.v048-bench-player strong{font-size:9px}.v048-bench-player small{text-align:right;color:#888;font-size:7px}.v048-sub-plan{display:flex;align-items:center;justify-content:space-between;gap:9px;margin:9px 0;padding:8px 10px;border:1px solid #ffffff13;background:#101010}.v048-sub-plan strong{font-size:9px}.v048-sub-plan span{color:#8b857b;font-size:8px}.v048-sub-plan .in{color:#63cf82}.v048-sub-plan .out{color:#ef786f}
  .v048-shape-simple{display:grid;grid-template-columns:minmax(450px,1fr) 250px;gap:10px}.v048-shape-simple .flm-shape-pitch{min-height:570px}.v048-shape-simple .flm-shape-player{cursor:grab}.v048-shape-simple .flm-shape-player.is-selected{box-shadow:0 0 0 2px #ead653}.v048-shape-editor{align-self:start;padding:11px;border:1px solid #ffffff14;background:#0e0e0e}.v048-shape-editor h4{margin:0 0 4px;font-size:11px}.v048-shape-editor p{margin:0 0 10px;color:#898278;font-size:8px}.v048-shape-editor select{width:100%;min-height:38px;border:1px solid #ffffff20;border-radius:5px;background:#151515;color:#fff;padding:0 8px}.v048-shape-editor small{display:block;margin-top:8px;color:#777;line-height:1.4}.v048-shape-simple .flm-role-list,.v048-shape-simple .flm-shape-switch{display:none!important}
  @media(max-width:850px){.v048-sub-shell,.v048-shape-simple{grid-template-columns:1fr}.v048-sub-pitch{min-height:500px}.v048-bench-list{max-height:260px}.v048-shape-simple .flm-shape-pitch{min-height:510px}}
  `;
  document.head.appendChild(style);
}

function selectNative(field, value) {
  if (!field) return;
  field.value = value;
  field.dispatchEvent(new Event('change', { bubbles:true }));
}

function enhanceTactics(dialog) {
  if (!dialog.querySelector('[data-live-tactic]') || dialog.querySelector('.v048-live-tactics')) return;
  const nativeForm = dialog.querySelector('.flm-tactic-form');
  if (!nativeForm) return;
  nativeForm.classList.add('v048-native-hidden');
  const holder = document.createElement('div');
  holder.className = 'v048-live-tactics';
  let tab = 'overview';
  const fields = Object.fromEntries([...dialog.querySelectorAll('[data-live-tactic]')].map(field => [field.dataset.liveTactic, field]));

  function buttons(key) {
    const field = fields[key];
    return `<div class="v048-live-segment">${[...field.options].map(option => `<button type="button" class="${field.value===option.value?'is-active':''}" data-v048-live-key="${esc(key)}" data-value="${esc(option.value)}">${esc(option.textContent)}</button>`).join('')}</div>`;
  }
  function panel() {
    if (tab === 'overview') return `<div class="v048-live-panel-row"><span class="v048-live-label">MENTALITY</span>${buttons('mentality')}<span class="v048-live-help">Change the game state without digging through seven dropdowns.</span></div>`;
    if (tab === 'with-ball') return `<div class="v048-live-panel-row"><span class="v048-live-label">PASSING</span>${buttons('passing')}<span class="v048-live-label">TEMPO</span>${buttons('tempo')}<span class="v048-live-label">WIDTH</span>${buttons('width')}</div>`;
    return `<div class="v048-live-panel-row"><span class="v048-live-label">PRESS</span>${buttons('pressing')}<span class="v048-live-label">DEFENSIVE LINE</span>${buttons('defensiveLine')}</div>`;
  }
  function draw() {
    holder.innerHTML = `<div class="v048-live-formation"><span>FORMATION</span><select data-v048-live-formation>${[...fields.formation.options].map(option => `<option ${fields.formation.value===option.value?'selected':''}>${esc(option.value)}</option>`).join('')}</select></div><div class="v048-live-tabs"><button type="button" class="${tab==='overview'?'is-active':''}" data-v048-live-tab="overview">OVERVIEW</button><button type="button" class="${tab==='with-ball'?'is-active':''}" data-v048-live-tab="with-ball">WITH BALL</button><button type="button" class="${tab==='without-ball'?'is-active':''}" data-v048-live-tab="without-ball">WITHOUT BALL</button></div><div class="v048-live-panel">${panel()}</div>`;
    holder.querySelector('[data-v048-live-formation]')?.addEventListener('change', event => { selectNative(fields.formation, event.target.value); draw(); });
    holder.querySelectorAll('[data-v048-live-tab]').forEach(button => button.addEventListener('click', () => { tab = button.dataset.v048LiveTab; draw(); }));
    holder.querySelectorAll('[data-v048-live-key]').forEach(button => button.addEventListener('click', () => { selectNative(fields[button.dataset.v048LiveKey], button.dataset.value); draw(); }));
  }
  nativeForm.before(holder);
  draw();
  const apply = dialog.querySelector('[data-apply-live-tactics]');
  if (apply) apply.textContent = 'APPLY TACTIC';
}

function optionData(option) {
  const parts = String(option?.textContent || '').split('·').map(part => part.trim());
  return { id:option?.value || '', name:parts[0] || option?.value || '', slot:parts[1] || '', condition:parts[2] || '' };
}

function enhanceSubs(dialog) {
  const off = dialog.querySelector('[data-sub-out]'), on = dialog.querySelector('[data-sub-in]');
  if (!off || !on || dialog.querySelector('.v048-sub-shell')) return;
  dialog.querySelector('.flm-sub-grid')?.classList.add('v048-native-hidden');
  dialog.querySelector('.flm-player-live-list')?.classList.add('v048-native-hidden');
  const formation = document.querySelector('[data-shape-label]')?.textContent?.trim() || '4-3-3';
  const layout = FORMATION_LAYOUTS[formation] || FORMATION_LAYOUTS['4-3-3'];
  const outOptions = [...off.options].map(optionData);
  const benchOptions = [...on.options].map(optionData);
  const playerForSlot = slotId => outOptions.find(item => item.slot === slotId);
  const holder = document.createElement('div');
  holder.className = 'v048-sub-shell';

  function selected() { return { out:optionData(off.selectedOptions[0]), in:optionData(on.selectedOptions[0]) }; }
  function updatePlan() {
    const plan = dialog.querySelector('[data-v048-sub-plan]');
    if (!plan) return;
    const pair = selected();
    plan.innerHTML = `<div><span>PLANNED CHANGE</span><strong><b class="in">IN ${esc(pair.in.name || '—')}</b> → <b class="out">OUT ${esc(pair.out.name || '—')}</b></strong></div><span>Drag a substitute onto the player to replace.</span>`;
    dialog.querySelectorAll('[data-v048-bench]').forEach(row => row.classList.toggle('is-in', row.dataset.v048Bench === pair.in.id));
    dialog.querySelectorAll('[data-v048-out]').forEach(row => row.classList.toggle('is-off', row.dataset.v048Out === pair.out.id));
  }
  function chooseBench(id) { selectNative(on, id); selectedBenchId = id; updatePlan(); }
  function chooseOut(id) { selectNative(off, id); updatePlan(); }

  holder.innerHTML = `<div class="v048-sub-pitch"><i class="v048-centre-circle"></i>${layout.map(slot => { const item = playerForSlot(slot.id); if (!item) return ''; return `<button type="button" class="v048-sub-player" style="left:${slot.x}%;top:${slot.y}%" data-v048-out="${esc(item.id)}" data-slot="${esc(slot.id)}"><span>${esc(slot.label)}</span><strong>${esc(item.name)}</strong><small>${esc(item.condition)}</small></button>`; }).join('')}</div><aside class="v048-bench"><div class="v048-bench-head">SUBSTITUTES</div><div class="v048-bench-list">${benchOptions.map(item => `<button type="button" draggable="true" class="v048-bench-player" data-v048-bench="${esc(item.id)}"><span>${esc(item.slot || 'SUB')}</span><strong>${esc(item.name)}</strong><small>${esc(item.condition)}</small></button>`).join('')}</div></aside>`;
  const plan = document.createElement('div'); plan.className = 'v048-sub-plan'; plan.dataset.v048SubPlan = '1';
  const status = dialog.querySelector('.flm-sub-status');
  status?.after(plan);
  plan.after(holder);

  holder.querySelectorAll('[data-v048-bench]').forEach(row => {
    row.addEventListener('dragstart', event => { selectedBenchId = row.dataset.v048Bench; event.dataTransfer.setData('application/x-flm-sub', selectedBenchId); event.dataTransfer.effectAllowed = 'move'; chooseBench(selectedBenchId); });
    row.addEventListener('click', () => chooseBench(row.dataset.v048Bench));
  });
  holder.querySelectorAll('[data-v048-out]').forEach(chip => {
    chip.addEventListener('dragover', event => { event.preventDefault(); chip.classList.add('is-drop'); });
    chip.addEventListener('dragleave', () => chip.classList.remove('is-drop'));
    chip.addEventListener('drop', event => { event.preventDefault(); chip.classList.remove('is-drop'); const incoming = event.dataTransfer.getData('application/x-flm-sub') || selectedBenchId; if (incoming) chooseBench(incoming); chooseOut(chip.dataset.v048Out); });
    chip.addEventListener('click', () => { chooseOut(chip.dataset.v048Out); if (selectedBenchId) chooseBench(selectedBenchId); });
  });
  updatePlan();
  const apply = dialog.querySelector('[data-apply-sub]');
  if (apply) apply.textContent = 'CONFIRM SUB';
}

function enhanceShape(dialog) {
  const layout = dialog.querySelector('.flm-shape-layout');
  const hiddenRoles = dialog.querySelector('.flm-role-list');
  if (!layout || !hiddenRoles || dialog.querySelector('.v048-shape-editor')) return;
  layout.classList.add('v048-shape-simple');
  const roleFields = [...dialog.querySelectorAll('[data-role-slot]')];
  const pitchPlayers = [...dialog.querySelectorAll('.flm-shape-player')];
  const swapA = dialog.querySelector('[data-swap-a]'), swapB = dialog.querySelector('[data-swap-b]'), swapButton = dialog.querySelector('[data-swap-players]');
  pitchPlayers.forEach((chip, index) => { const field = roleFields[index]; if (field) chip.dataset.v048ShapeSlot = field.dataset.roleSlot; });
  const editor = document.createElement('aside');
  editor.className = 'v048-shape-editor';
  layout.appendChild(editor);

  function draw(slotId) {
    selectedShapeSlot = slotId || selectedShapeSlot || roleFields[0]?.dataset.roleSlot;
    pitchPlayers.forEach(chip => chip.classList.toggle('is-selected', chip.dataset.v048ShapeSlot === selectedShapeSlot));
    const field = roleFields.find(item => item.dataset.roleSlot === selectedShapeSlot);
    const chip = pitchPlayers.find(item => item.dataset.v048ShapeSlot === selectedShapeSlot);
    editor.innerHTML = field ? `<h4>${esc(chip?.querySelector('strong')?.textContent || 'Player')}</h4><p>${esc(selectedShapeSlot)} · change one role at a time</p><select data-v048-one-role>${[...field.options].map(option => `<option ${field.value===option.value?'selected':''}>${esc(option.value)}</option>`).join('')}</select><small>Click another player to select them. Drag one pitch player onto another to swap their positions.</small>` : '<p>Select a player.</p>';
    editor.querySelector('[data-v048-one-role]')?.addEventListener('change', event => selectNative(field, event.target.value));
  }

  pitchPlayers.forEach(chip => {
    chip.draggable = true;
    chip.addEventListener('dragstart', event => { event.dataTransfer.setData('application/x-flm-shape-slot', chip.dataset.v048ShapeSlot); event.dataTransfer.effectAllowed = 'move'; });
    chip.addEventListener('dragover', event => event.preventDefault());
    chip.addEventListener('drop', event => { event.preventDefault(); const from = event.dataTransfer.getData('application/x-flm-shape-slot'); const to = chip.dataset.v048ShapeSlot; if (!from || !to || from === to || !swapA || !swapB || !swapButton) return; swapA.value = from; swapB.value = to; swapButton.click(); });
    chip.addEventListener('click', () => draw(chip.dataset.v048ShapeSlot));
  });
  const apply = dialog.querySelector('[data-apply-roles]');
  if (apply) apply.textContent = 'APPLY ROLE CHANGES';
  draw();
}

function enhance() {
  const dialog = document.querySelector('[data-manager-dialog]');
  if (!dialog || !document.querySelector('[data-manager-modal].is-open')) return;
  enhanceTactics(dialog);
  enhanceSubs(dialog);
  enhanceShape(dialog);
}

function queue() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; try { enhance(); } catch {} });
}

ensureStyles();
new MutationObserver(queue).observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
queue();
