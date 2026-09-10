/* Football Lab Manager — squad number quick assign v1
 * Enhancement layer for squad-number-registration-v2.
 * Adds one-click sensible auto assignment plus a click-only number picker.
 */
(() => {
  'use strict';

  const VERSION = '1.0.0';
  const STYLE_ID = 'flm-squad-number-quickpick-v1-style';
  let dbPromise = null;

  const manager = () => window.FLMManager || null;
  const career = () => manager()?.activeCareer || null;
  const validNumber = value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 99;

  const POOLS = Object.freeze({
    GK:[1,13,22,31,32,40,41,42,43,44],
    RB:[2,12,22,24,32,34,35,36,38,42],
    LB:[3,12,15,17,23,33,34,35,36,39],
    CB:[4,5,6,12,15,16,18,20,21,24,25,26,30,33,35,36],
    DM:[6,4,8,14,16,18,20,21,24,25,28,30,32],
    CM:[8,6,10,14,16,18,20,21,23,24,25,28,30,32],
    AM:[10,8,14,17,18,20,21,23,24,27,28],
    RW:[7,11,17,19,21,22,23,27,28,30,32],
    LW:[11,7,17,19,20,22,23,27,28,30,32],
    ST:[9,10,11,14,18,19,20,21,23,27,29,30,31,33,39],
    DEF:[2,3,4,5,6,12,15,16,18,20,21,24,25,26,30,33,35,36],
    MID:[6,8,10,14,16,17,18,20,21,23,24,25,27,28,30,32],
    ATT:[7,9,10,11,14,17,18,19,20,21,22,23,27,29,30,31,33,39]
  });

  function loadDb() {
    if (!dbPromise && manager()?.loadDatabase) {
      dbPromise = Promise.resolve(manager().loadDatabase()).catch(error => {
        dbPromise = null;
        console.warn('FLM squad number quick picker database load failed:', error);
        return null;
      });
    }
    return dbPromise || Promise.resolve(null);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .flm-number-progress{gap:8px!important}.flm-number-auto{margin-left:auto;min-height:28px;padding:0 11px;border:1px solid #55dc7c;background:#174d36;color:#eaffef;font-size:8px;font-weight:950;letter-spacing:.04em;white-space:nowrap;cursor:pointer}.flm-number-auto:hover,.flm-number-auto:focus-visible{background:#1d6244;outline:none}.flm-number-row input[data-number-player]{cursor:pointer;-moz-appearance:textfield}.flm-number-row input[data-number-player]::-webkit-outer-spin-button,.flm-number-row input[data-number-player]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
      .flm-number-picker{position:fixed;z-index:30050;width:min(360px,calc(100vw - 20px));max-height:min(430px,70vh);display:grid;grid-template-rows:auto auto minmax(0,1fr);border:1px solid #3c76a7;background:#041326;box-shadow:0 18px 55px #000d;color:#edf5fa}.flm-number-picker-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-bottom:1px solid #21496e;background:#0a3158}.flm-number-picker-head div{min-width:0}.flm-number-picker-head small{display:block;color:#74e3a0;font-size:7px;font-weight:950;letter-spacing:.11em}.flm-number-picker-head strong{display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}.flm-number-picker-head button{width:30px;height:28px;border:1px solid #3a6d9b;background:#061a31;color:#dcebf6;cursor:pointer}.flm-number-suggestions{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;padding:8px 10px;border-bottom:1px solid #173a5d}.flm-number-suggestions button,.flm-number-grid button{min-height:31px;border:1px solid #27567f;background:#08213c;color:#eaf2f8;font-size:9px;font-weight:900;cursor:pointer}.flm-number-suggestions button{border-color:#3f845f;background:#123d2d}.flm-number-suggestions button:hover,.flm-number-grid button:hover{border-color:#74e3a0;background:#174d36}.flm-number-suggestions button:disabled,.flm-number-grid button:disabled{opacity:.2;cursor:not-allowed;background:#061426;border-color:#17334f}.flm-number-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;overflow:auto;padding:8px 10px 10px}.flm-number-grid button.is-current{border-color:#f4c342;color:#ffe177;box-shadow:inset 0 0 0 1px #f4c342}.flm-number-picker-note{grid-column:1/-1;color:#7f9cb4;font-size:7px;font-weight:850;letter-spacing:.06em;margin-bottom:1px}
      @media(max-width:650px){.flm-number-progress{flex-wrap:wrap}.flm-number-auto{width:100%;margin-left:0}.flm-number-picker{left:10px!important;right:10px!important;width:auto!important}.flm-number-grid{grid-template-columns:repeat(8,1fr)}}
    `;
    document.head.appendChild(style);
  }

  function fullName(player) {
    const first = String(player?.firstName || '').trim();
    const last = String(player?.lastName || '').trim();
    return first && last ? `${first} ${last}` : String(player?.name || 'Player').trim();
  }

  function roleKey(player) {
    const raw = String(player?.primaryPosition || '').toUpperCase().replace(/[\s_-]/g, '');
    if (raw.includes('GK')) return 'GK';
    if (raw.includes('WBR') || raw === 'DR' || raw.includes('RB')) return 'RB';
    if (raw.includes('WBL') || raw === 'DL' || raw.includes('LB')) return 'LB';
    if (raw.includes('DC') || raw.includes('CB')) return 'CB';
    if (raw.includes('DM')) return 'DM';
    if (raw.includes('AMR') || raw.includes('RW') || raw === 'MR') return 'RW';
    if (raw.includes('AML') || raw.includes('LW') || raw === 'ML') return 'LW';
    if (raw.includes('AMC') || raw === 'AM') return 'AM';
    if (raw.includes('ST') || raw.includes('CF')) return 'ST';
    if (raw.includes('MC') || raw.includes('CM')) return 'CM';
    const group = String(player?.positionGroup || '').toUpperCase();
    return group === 'GK' ? 'GK' : group === 'DEF' ? 'DEF' : group === 'MID' ? 'MID' : group === 'ATT' ? 'ATT' : 'MID';
  }

  function preferredPool(player) {
    const role = roleKey(player);
    const group = String(player?.positionGroup || '').toUpperCase();
    const merged = [...(POOLS[role] || []), ...(POOLS[group] || [])];
    return [...new Set(merged.filter(validNumber))];
  }

  function lastSeasonAssignments(c) {
    const history = Array.isArray(c?.squadNumberHistory) ? c.squadNumberHistory : [];
    const latest = history[history.length - 1];
    return latest?.assignments && typeof latest.assignments === 'object' ? latest.assignments : {};
  }

  function allInputs(modal) {
    return [...modal.querySelectorAll('[data-number-player]')];
  }

  function usedNumbers(modal, exceptInput = null) {
    const used = new Set();
    allInputs(modal).forEach(input => {
      if (input === exceptInput) return;
      const value = input.value.trim();
      if (validNumber(value)) used.add(Number(value));
    });
    return used;
  }

  function nextNumberFor(player, used, previousAssignments) {
    const old = previousAssignments?.[player.id];
    if (validNumber(old) && !used.has(Number(old))) return Number(old);
    const pool = preferredPool(player);
    for (const number of pool) if (!used.has(number)) return number;
    for (let number = 1; number <= 99; number += 1) if (!used.has(number)) return number;
    return null;
  }

  function autoAssign(modal, db) {
    const c = career();
    if (!c || !db) return;
    const inputs = allInputs(modal);
    const byId = new Map((db.players || []).map(player => [player.id, player]));
    const previous = lastSeasonAssignments(c);
    const used = usedNumbers(modal);
    const pending = inputs
      .filter(input => !validNumber(input.value.trim()))
      .map(input => ({ input, player:byId.get(input.dataset.numberPlayer) }))
      .filter(item => item.player)
      .sort((a,b) => {
        const groupOrder = { GK:0, DEF:1, MID:2, ATT:3 };
        const ag = groupOrder[String(a.player.positionGroup || '').toUpperCase()] ?? 9;
        const bg = groupOrder[String(b.player.positionGroup || '').toUpperCase()] ?? 9;
        if (ag !== bg) return ag - bg;
        return Number(b.player.currentAbility || 0) - Number(a.player.currentAbility || 0);
      });

    pending.forEach(({ input, player }) => {
      const number = nextNumberFor(player, used, previous);
      if (!number) return;
      input.value = String(number);
      used.add(number);
      input.dispatchEvent(new Event('input', { bubbles:true }));
    });

    const button = modal.querySelector('[data-number-auto]');
    if (button) {
      const remaining = allInputs(modal).filter(input => !validNumber(input.value.trim())).length;
      button.textContent = remaining ? `AUTO ASSIGN ${remaining} LEFT` : 'ALL NUMBERS ASSIGNED';
    }
  }

  function closePicker() {
    document.querySelector('.flm-number-picker')?.remove();
  }

  function placePicker(picker, input) {
    const rect = input.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 20);
    const left = Math.max(10, Math.min(window.innerWidth - width - 10, rect.right - width));
    const roomBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(430, window.innerHeight * .7);
    const top = roomBelow >= estimatedHeight + 8
      ? rect.bottom + 5
      : Math.max(10, rect.top - estimatedHeight - 5);
    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;
  }

  function openPicker(modal, input, player) {
    closePicker();
    if (!input || !player) return;
    const used = usedNumbers(modal, input);
    const current = validNumber(input.value.trim()) ? Number(input.value.trim()) : null;
    const suggestions = preferredPool(player).filter(number => !used.has(number) || number === current).slice(0, 6);
    const picker = document.createElement('div');
    picker.className = 'flm-number-picker';
    picker.dataset.flmNumberPicker = '1';
    picker.innerHTML = `
      <div class="flm-number-picker-head"><div><small>SELECT SQUAD NUMBER</small><strong>${fullName(player)}</strong></div><button type="button" data-picker-close aria-label="Close">✕</button></div>
      <div class="flm-number-suggestions"><div class="flm-number-picker-note">SUGGESTED FOR ${roleKey(player)}</div>${suggestions.map(number => `<button type="button" data-pick-number="${number}" class="${number === current ? 'is-current' : ''}">${number}</button>`).join('')}</div>
      <div class="flm-number-grid">${Array.from({length:99},(_,index) => index + 1).map(number => `<button type="button" data-pick-number="${number}" ${used.has(number) && number !== current ? 'disabled' : ''} class="${number === current ? 'is-current' : ''}">${number}</button>`).join('')}</div>`;
    document.body.appendChild(picker);
    placePicker(picker, input);

    picker.addEventListener('click', event => {
      const button = event.target.closest('[data-pick-number]');
      if (!button || button.disabled) return;
      input.value = button.dataset.pickNumber;
      input.dispatchEvent(new Event('input', { bubbles:true }));
      closePicker();
      input.focus({ preventScroll:true });
    });
    picker.querySelector('[data-picker-close]')?.addEventListener('click', closePicker);
  }

  async function enhanceModal(modal) {
    if (!modal || modal.dataset.flmNumberQuickpick === VERSION) return;
    modal.dataset.flmNumberQuickpick = VERSION;
    ensureStyles();
    const db = await loadDb();
    if (!db || !modal.isConnected) return;
    const byId = new Map((db.players || []).map(player => [player.id, player]));

    const progress = modal.querySelector('.flm-number-progress');
    if (progress && !progress.querySelector('[data-number-auto]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'flm-number-auto';
      button.dataset.numberAuto = '1';
      const remaining = allInputs(modal).filter(input => !validNumber(input.value.trim())).length;
      button.textContent = remaining ? `AUTO ASSIGN ${remaining}` : 'ALL NUMBERS ASSIGNED';
      button.addEventListener('click', () => autoAssign(modal, db));
      progress.appendChild(button);
    }

    allInputs(modal).forEach(input => {
      input.title = 'Click to choose an available squad number';
      input.setAttribute('aria-haspopup', 'dialog');
      input.addEventListener('click', () => openPicker(modal, input, byId.get(input.dataset.numberPlayer)));
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPicker(modal, input, byId.get(input.dataset.numberPlayer));
        }
      });
    });

    const focusInput = modal.querySelector('.flm-number-row.is-focus [data-number-player]');
    if (focusInput) setTimeout(() => {
      if (modal.isConnected && !document.querySelector('.flm-number-picker')) {
        openPicker(modal, focusInput, byId.get(focusInput.dataset.numberPlayer));
      }
    }, 180);
  }

  function scan() {
    document.querySelectorAll('.flm-number-modal').forEach(modal => {
      enhanceModal(modal).catch(error => console.warn('FLM squad number quick picker failed:', error));
    });
  }

  ensureStyles();
  new MutationObserver(scan).observe(document.body, { childList:true, subtree:true });
  window.addEventListener('resize', closePicker);
  window.addEventListener('scroll', closePicker, true);
  document.addEventListener('click', event => {
    const picker = document.querySelector('.flm-number-picker');
    if (!picker) return;
    if (event.target.closest('.flm-number-picker') || event.target.closest('[data-number-player]')) return;
    closePicker();
  }, true);
  scan();

  window.FLMSquadNumberQuickPick = Object.freeze({ version:VERSION, refresh:scan });
})();
