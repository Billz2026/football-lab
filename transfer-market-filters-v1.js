/* Football Lab Manager — transfer market filters v1
 * Adds a click-first recruitment filter layer without exposing hidden ability.
 * The existing transfer UI remains authoritative for offers and negotiations.
 */
import {
  estimatePlayerValue,
  estimateWeeklyWage,
  getAskingPrice,
  getPlayerContract,
  getTransferBudget,
  searchTransferMarket
} from './transfers-v050.js?v=0.6.2';

(() => {
  'use strict';

  const VERSION = '1.0.0';
  const STYLE_ID = 'flm-transfer-filters-v1-style';
  let database = null;
  let dbPromise = null;
  let frame = 0;
  let selectedId = null;
  let advancedOpen = false;
  const state = {
    age: 'any',
    value: 'any',
    contract: 'any',
    wage: 'any',
    club: 'all',
    nationality: 'all',
    sort: 'value-desc',
    affordable: false,
    expiring: false,
    u23: false
  };

  const manager = () => window.FLMManager;
  const career = () => manager()?.activeCareer || null;
  const esc = value => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const clubName = id => database?.clubs?.find(club => club.id === id)?.name || 'Unknown club';
  const compactMoney = value => {
    const amount = Number(value || 0);
    if (amount >= 1000000) return `£${(amount / 1000000).toFixed(amount >= 10000000 ? 1 : 2)}m`;
    return `£${Math.round(amount / 1000)}k`;
  };

  function ensureDatabase() {
    if (database) return Promise.resolve(database);
    if (!dbPromise && manager()?.loadDatabase) {
      dbPromise = Promise.resolve(manager().loadDatabase()).then(db => (database = db)).catch(() => null);
    }
    return dbPromise || Promise.resolve(null);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .flm-cm-shell .career-content:has(.v050-transfer-page){padding:12px 14px 14px!important;overflow:hidden!important}
      .flm-cm-shell .career-content .v050-transfer-page{width:100%!important;max-width:none!important;margin:0!important;min-height:0!important}
      .flm-cm-shell .career-content .v050-market-layout{height:calc(100dvh - 332px)!important;min-height:520px!important;max-height:none!important;grid-template-columns:minmax(390px,40%) minmax(0,60%)!important}
      .flm-cm-shell .career-content .v050-detail{padding:18px 20px!important}
      .v056-filter-shell{display:grid!important;grid-template-columns:1fr!important;gap:6px!important}
      .v056-filter-primary{display:grid;grid-template-columns:minmax(260px,1fr) 118px 160px 112px;gap:6px;align-items:center}
      .v056-filter-primary .v050-search-wrap input{min-height:36px}
      .v056-filter-primary select,.v056-filter-primary button,.v056-filter-more select{min-height:36px;border:1px solid rgba(61,119,169,.35);border-radius:5px;background:#061d34;color:#eef5f9;padding:0 9px;font:800 9px/1 Inter,system-ui,sans-serif;outline:none}
      .v056-filter-primary select:focus,.v056-filter-more select:focus{border-color:#47b7f3;box-shadow:0 0 0 2px rgba(71,183,243,.12)}
      .v056-more-toggle{cursor:pointer;color:#c9dfed!important}.v056-more-toggle.is-active{border-color:#47b7f3!important;background:#0b3153!important;color:#fff!important}
      .v056-quick{display:flex;gap:5px;align-items:center;min-height:30px;flex-wrap:wrap}
      .v056-chip{min-height:27px;padding:0 9px;border:1px solid rgba(61,119,169,.3);border-radius:4px;background:#06182c;color:#8eabc1;font:900 8px/1 Inter,system-ui,sans-serif;cursor:pointer}
      .v056-chip:hover{border-color:#47b7f3;color:#fff}.v056-chip.is-active{border-color:#55dc7c;background:#174d36;color:#eaffef}
      .v056-filter-summary{margin-left:auto;color:#6689a6;font:800 8px/1 Inter,system-ui,sans-serif;letter-spacing:.02em}
      .v056-filter-more{display:grid;grid-template-columns:repeat(6,minmax(110px,1fr));gap:6px;padding:7px;border:1px solid rgba(61,119,169,.25);border-radius:6px;background:rgba(4,20,38,.7)}
      .v056-filter-more[hidden]{display:none!important}
      .v056-filter-field{display:grid;gap:4px}.v056-filter-field span{color:#7897af;font:900 7px/1 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      .v056-reset{min-height:36px!important;align-self:end;border-color:#365a77!important;background:#082640!important;color:#cfe4f2!important;cursor:pointer}
      .v056-budget-flag{display:inline-flex;align-items:center;min-height:22px;margin-top:7px;padding:0 8px;border:1px solid rgba(255,107,107,.4);border-radius:4px;background:rgba(255,107,107,.08);color:#ff9c9c;font:900 7px/1 Inter,system-ui,sans-serif;letter-spacing:.07em}
      .v056-budget-flag.good{border-color:rgba(85,220,124,.35);background:rgba(85,220,124,.07);color:#75e699}
      @media(max-width:1180px){.v056-filter-primary{grid-template-columns:minmax(220px,1fr) 105px 135px 100px}.v056-filter-more{grid-template-columns:repeat(3,minmax(120px,1fr))}.flm-cm-shell .career-content .v050-market-layout{grid-template-columns:minmax(330px,42%) minmax(0,58%)!important}}
      @media(max-width:820px){.flm-cm-shell .career-content:has(.v050-transfer-page){overflow:auto!important}.flm-cm-shell .career-content .v050-market-layout{height:auto!important;min-height:0!important;grid-template-columns:1fr!important}.v056-filter-primary{grid-template-columns:1fr 1fr}.v056-filter-primary .v050-search-wrap{grid-column:1/-1}.v056-filter-more{grid-template-columns:repeat(2,minmax(0,1fr))}.v056-filter-summary{width:100%;margin:3px 0 0}.v050-player-list{max-height:390px}.v050-detail{min-height:420px}}
      @media(max-width:520px){.v056-filter-primary{grid-template-columns:1fr}.v056-filter-primary .v050-search-wrap{grid-column:auto}.v056-filter-more{grid-template-columns:1fr}.v056-quick{display:grid;grid-template-columns:1fr 1fr}.v056-chip{min-height:34px}}
    `;
    document.head.appendChild(style);
  }

  function seasonStart(c) {
    const match = String(c?.season || '2026/27').match(/(20\d{2})/);
    return match ? Number(match[1]) : 2026;
  }

  function ageMatch(age, key) {
    const n = Number(age);
    if (!Number.isFinite(n)) return key === 'any';
    if (key === 'u21') return n <= 21;
    if (key === 'u23') return n <= 23;
    if (key === '24-28') return n >= 24 && n <= 28;
    if (key === '29-32') return n >= 29 && n <= 32;
    if (key === '33+') return n >= 33;
    return true;
  }

  function valueMatch(value, key) {
    const m = Number(value) / 1000000;
    if (key === '0-5') return m <= 5;
    if (key === '5-15') return m > 5 && m <= 15;
    if (key === '15-30') return m > 15 && m <= 30;
    if (key === '30-60') return m > 30 && m <= 60;
    if (key === '60+') return m > 60;
    return true;
  }

  function wageMatch(wage, key) {
    const k = Number(wage) / 1000;
    if (key === '25') return k <= 25;
    if (key === '50') return k <= 50;
    if (key === '100') return k <= 100;
    if (key === '200') return k <= 200;
    if (key === '200+') return k > 200;
    return true;
  }

  function contractMatch(expiry, key, start) {
    const year = Number(expiry);
    if (!Number.isFinite(year)) return key === 'any';
    if (key === '1') return year <= start + 1;
    if (key === '2') return year <= start + 2;
    if (key === '3+') return year >= start + 3;
    return true;
  }

  function nationalityOf(p) {
    return String(p?.nationality || p?.nationalityCode || '').trim();
  }

  function currentQuery() {
    return document.querySelector('[data-v050-search]')?.value || '';
  }

  function currentPosition() {
    return document.querySelector('[data-v050-position]')?.value || 'All';
  }

  function filteredPlayers(c) {
    const base = searchTransferMarket(c, database, { query: currentQuery(), position: currentPosition() });
    const start = seasonStart(c);
    const budget = getTransferBudget(c);
    const rows = base.filter(p => {
      const age = Number(p.reportedAge);
      const value = estimatePlayerValue(p);
      const contract = getPlayerContract(c, p);
      const wage = Number(contract?.weeklyWage || estimateWeeklyWage(p));
      const asking = getAskingPrice(p, database, c);
      if (!ageMatch(age, state.age)) return false;
      if (!valueMatch(value, state.value)) return false;
      if (!contractMatch(contract?.expiryYear, state.contract, start)) return false;
      if (!wageMatch(wage, state.wage)) return false;
      if (state.club !== 'all' && p.clubId !== state.club) return false;
      if (state.nationality !== 'all' && nationalityOf(p) !== state.nationality) return false;
      if (state.affordable && (asking > budget.transferBudget || wage > budget.wageRoom)) return false;
      if (state.expiring && Number(contract?.expiryYear || 9999) > start + 1) return false;
      if (state.u23 && (!Number.isFinite(age) || age > 23)) return false;
      return true;
    });

    const score = p => ({
      value: estimatePlayerValue(p),
      age: Number(p.reportedAge || 99),
      wage: Number(getPlayerContract(c, p)?.weeklyWage || estimateWeeklyWage(p)),
      contract: Number(getPlayerContract(c, p)?.expiryYear || 9999),
      name: String(p.name || '')
    });
    rows.sort((a,b) => {
      const A = score(a), B = score(b);
      if (state.sort === 'value-asc') return A.value - B.value || A.name.localeCompare(B.name);
      if (state.sort === 'age-asc') return A.age - B.age || B.value - A.value;
      if (state.sort === 'age-desc') return B.age - A.age || B.value - A.value;
      if (state.sort === 'contract') return A.contract - B.contract || B.value - A.value;
      if (state.sort === 'wage-asc') return A.wage - B.wage || B.value - A.value;
      if (state.sort === 'name') return A.name.localeCompare(B.name);
      return B.value - A.value || A.name.localeCompare(B.name);
    });
    return rows;
  }

  function rowMarkup(c, p, activeId) {
    const contract = getPlayerContract(c, p);
    return `<button class="v050-player-row ${p.id === activeId ? 'is-selected' : ''}" data-v050-player="${esc(p.id)}">
      <span class="v050-pos">${esc(p.primaryPosition || p.positionGroup || '—')}</span>
      <span><strong>${esc(p.name)}</strong><small>${esc(clubName(p.clubId))} · Age ${esc(p.reportedAge || '—')} · Jun ${contract?.expiryYear || '—'}</small></span>
      <span class="v050-value">${compactMoney(estimatePlayerValue(p))}</span>
    </button>`;
  }

  function clubOptions(c) {
    const players = searchTransferMarket(c, database, { query:'', position:'All' });
    const ids = [...new Set(players.map(p => p.clubId).filter(Boolean))]
      .sort((a,b) => clubName(a).localeCompare(clubName(b)));
    return `<option value="all">All clubs</option>${ids.map(id => `<option value="${esc(id)}" ${state.club === id ? 'selected' : ''}>${esc(clubName(id))}</option>`).join('')}`;
  }

  function nationalityOptions(c) {
    const values = [...new Set(searchTransferMarket(c, database, { query:'', position:'All' }).map(nationalityOf).filter(Boolean))].sort();
    return `<option value="all">All nations</option>${values.map(value => `<option value="${esc(value)}" ${state.nationality === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}`;
  }

  function filterMarkup(c, originalTools) {
    const q = originalTools.querySelector('[data-v050-search]')?.value || '';
    const pos = originalTools.querySelector('[data-v050-position]')?.value || 'All';
    return `<div class="v050-market-tools v056-filter-shell" data-v056-filter-shell>
      <div class="v056-filter-primary">
        <div class="v050-search-wrap"><input type="search" value="${esc(q)}" placeholder="Search player or club" data-v050-search aria-label="Search transfer market"><span data-v050-market-count>—</span></div>
        <select data-v050-position aria-label="Position"><option ${pos==='All'?'selected':''}>All</option><option ${pos==='GK'?'selected':''}>GK</option><option ${pos==='DEF'?'selected':''}>DEF</option><option ${pos==='MID'?'selected':''}>MID</option><option ${pos==='ATT'?'selected':''}>ATT</option></select>
        <select data-v056-sort aria-label="Sort transfer market">
          <option value="value-desc" ${state.sort==='value-desc'?'selected':''}>Value · High to low</option><option value="value-asc" ${state.sort==='value-asc'?'selected':''}>Value · Low to high</option><option value="age-asc" ${state.sort==='age-asc'?'selected':''}>Age · Youngest</option><option value="age-desc" ${state.sort==='age-desc'?'selected':''}>Age · Oldest</option><option value="contract" ${state.sort==='contract'?'selected':''}>Contract · Expiring</option><option value="wage-asc" ${state.sort==='wage-asc'?'selected':''}>Wage · Low to high</option><option value="name" ${state.sort==='name'?'selected':''}>Name · A-Z</option>
        </select>
        <button type="button" class="v056-more-toggle ${advancedOpen?'is-active':''}" data-v056-more>${advancedOpen?'LESS FILTERS':'MORE FILTERS'}</button>
      </div>
      <div class="v056-quick">
        <button type="button" class="v056-chip ${state.affordable?'is-active':''}" data-v056-chip="affordable">AFFORDABLE ONLY</button>
        <button type="button" class="v056-chip ${state.expiring?'is-active':''}" data-v056-chip="expiring">EXPIRING SOON</button>
        <button type="button" class="v056-chip ${state.u23?'is-active':''}" data-v056-chip="u23">U23</button>
        <span class="v056-filter-summary" data-v056-summary></span>
      </div>
      <div class="v056-filter-more" data-v056-more-panel ${advancedOpen?'':'hidden'}>
        <label class="v056-filter-field"><span>Age</span><select data-v056-filter="age"><option value="any">Any age</option><option value="u21" ${state.age==='u21'?'selected':''}>21 and under</option><option value="u23" ${state.age==='u23'?'selected':''}>23 and under</option><option value="24-28" ${state.age==='24-28'?'selected':''}>24–28</option><option value="29-32" ${state.age==='29-32'?'selected':''}>29–32</option><option value="33+" ${state.age==='33+'?'selected':''}>33+</option></select></label>
        <label class="v056-filter-field"><span>Value</span><select data-v056-filter="value"><option value="any">Any value</option><option value="0-5" ${state.value==='0-5'?'selected':''}>Up to £5m</option><option value="5-15" ${state.value==='5-15'?'selected':''}>£5m–£15m</option><option value="15-30" ${state.value==='15-30'?'selected':''}>£15m–£30m</option><option value="30-60" ${state.value==='30-60'?'selected':''}>£30m–£60m</option><option value="60+" ${state.value==='60+'?'selected':''}>£60m+</option></select></label>
        <label class="v056-filter-field"><span>Contract</span><select data-v056-filter="contract"><option value="any">Any contract</option><option value="1" ${state.contract==='1'?'selected':''}>≤ 1 year</option><option value="2" ${state.contract==='2'?'selected':''}>≤ 2 years</option><option value="3+" ${state.contract==='3+'?'selected':''}>3+ years</option></select></label>
        <label class="v056-filter-field"><span>Max wage</span><select data-v056-filter="wage"><option value="any">Any wage</option><option value="25" ${state.wage==='25'?'selected':''}>£25k/wk</option><option value="50" ${state.wage==='50'?'selected':''}>£50k/wk</option><option value="100" ${state.wage==='100'?'selected':''}>£100k/wk</option><option value="200" ${state.wage==='200'?'selected':''}>£200k/wk</option><option value="200+" ${state.wage==='200+'?'selected':''}>£200k+/wk</option></select></label>
        <label class="v056-filter-field"><span>Club</span><select data-v056-filter="club">${clubOptions(c)}</select></label>
        <label class="v056-filter-field"><span>Nationality</span><select data-v056-filter="nationality">${nationalityOptions(c)}</select></label>
        <button type="button" class="v056-reset" data-v056-reset>RESET FILTERS</button>
      </div>
    </div>`;
  }

  function syncDetailBudgetFlag(c) {
    const detail = document.querySelector('[data-v050-detail]');
    if (!detail || detail.querySelector('[data-v056-budget-flag]')) return;
    const active = document.querySelector('[data-v050-player].is-selected');
    const p = active ? database?.players?.find(item => item.id === active.dataset.v050Player) : null;
    if (!p) return;
    const budget = getTransferBudget(c);
    const asking = getAskingPrice(p, database, c);
    const wage = Number(getPlayerContract(c,p)?.weeklyWage || estimateWeeklyWage(p));
    const affordable = asking <= budget.transferBudget && wage <= budget.wageRoom;
    const flag = document.createElement('span');
    flag.dataset.v056BudgetFlag = '1';
    flag.className = `v056-budget-flag ${affordable ? 'good' : ''}`;
    flag.textContent = affordable ? 'WITHIN CURRENT BUDGET' : asking > budget.transferBudget ? `OVER BUDGET · ${compactMoney(asking - budget.transferBudget)}` : 'WAGE DEMAND EXCEEDS ROOM';
    detail.querySelector('.v050-detail-head>div:first-child')?.appendChild(flag);
  }

  function apply() {
    const c = career();
    const page = document.querySelector('.v050-transfer-page');
    if (!c || !database || !page) return;
    const activeTab = page.querySelector('.v050-tabs button.is-active')?.textContent?.trim().split('·')[0].trim();
    if (activeTab !== 'MARKET') return;

    let tools = page.querySelector('.v050-market-tools');
    if (!tools) return;
    if (!tools.matches('[data-v056-filter-shell]')) {
      const holder = document.createElement('div');
      holder.innerHTML = filterMarkup(c, tools).trim();
      tools.replaceWith(holder.firstElementChild);
      tools = page.querySelector('[data-v056-filter-shell]');
    }

    const list = page.querySelector('[data-v050-player-list]');
    if (!list) return;
    const originalSelected = list.querySelector('.v050-player-row.is-selected')?.dataset.v050Player;
    if (originalSelected) selectedId = originalSelected;
    const rows = filteredPlayers(c);
    if (!rows.some(p => p.id === selectedId)) selectedId = rows[0]?.id || null;
    const fingerprint = JSON.stringify([currentQuery(),currentPosition(),state,selectedId,rows.slice(0,120).map(p=>p.id)]);
    if (list.dataset.v056Fingerprint !== fingerprint) {
      const scroll = list.scrollTop;
      list.innerHTML = rows.length
        ? rows.slice(0,120).map(p => rowMarkup(c,p,selectedId)).join('')
        : '<div class="v050-empty"><strong>NO PLAYERS MATCH</strong><span>Relax one or more recruitment filters.</span></div>';
      list.dataset.v056Fingerprint = fingerprint;
      list.scrollTop = scroll;
      const selectedButton = selectedId ? list.querySelector(`[data-v050-player="${CSS.escape(selectedId)}"]`) : null;
      const currentDetailName = page.querySelector('.v050-detail h3')?.textContent?.trim();
      const selectedPlayer = selectedId ? database.players.find(p=>p.id===selectedId) : null;
      if (selectedButton && selectedPlayer && currentDetailName !== selectedPlayer.name) {
        requestAnimationFrame(() => selectedButton.isConnected && selectedButton.click());
      }
    }
    const count = page.querySelector('[data-v050-market-count]');
    if (count) count.textContent = `${Math.min(rows.length,120)} / ${rows.length}`;
    const summary = page.querySelector('[data-v056-summary]');
    if (summary) summary.textContent = `${rows.length} PLAYER${rows.length===1?'':'S'} MATCHING`;
    syncDetailBudgetFlag(c);
  }

  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(async () => {
      frame = 0;
      ensureStyles();
      await ensureDatabase();
      apply();
    });
  }

  document.addEventListener('click', event => {
    const playerButton = event.target.closest?.('[data-v050-player]');
    if (playerButton) selectedId = playerButton.dataset.v050Player;

    const more = event.target.closest?.('[data-v056-more]');
    if (more) {
      advancedOpen = !advancedOpen;
      more.classList.toggle('is-active', advancedOpen);
      more.textContent = advancedOpen ? 'LESS FILTERS' : 'MORE FILTERS';
      const panel = document.querySelector('[data-v056-more-panel]');
      if (panel) panel.hidden = !advancedOpen;
      return;
    }

    const chip = event.target.closest?.('[data-v056-chip]');
    if (chip) {
      const key = chip.dataset.v056Chip;
      state[key] = !state[key];
      chip.classList.toggle('is-active', state[key]);
      selectedId = null;
      schedule();
      return;
    }

    if (event.target.closest?.('[data-v056-reset]')) {
      Object.assign(state,{age:'any',value:'any',contract:'any',wage:'any',club:'all',nationality:'all',sort:'value-desc',affordable:false,expiring:false,u23:false});
      selectedId = null;
      const shell = document.querySelector('[data-v056-filter-shell]');
      if (shell) shell.replaceWith(document.createElement('div'));
      schedule();
    }
  }, true);

  document.addEventListener('change', event => {
    const filter = event.target.closest?.('[data-v056-filter]');
    if (filter) {
      state[filter.dataset.v056Filter] = filter.value;
      selectedId = null;
      schedule();
      return;
    }
    const sort = event.target.closest?.('[data-v056-sort]');
    if (sort) {
      state.sort = sort.value;
      schedule();
      return;
    }
    if (event.target.closest?.('[data-v050-position]')) {
      selectedId = null;
      requestAnimationFrame(schedule);
    }
  }, true);

  document.addEventListener('input', event => {
    if (event.target.closest?.('[data-v050-search]')) {
      selectedId = null;
      requestAnimationFrame(schedule);
    }
  }, true);

  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  ['flm:career-opened','flm:career-data-refresh','flm:career-sync-complete'].forEach(name => document.addEventListener(name,schedule));
  ensureStyles();
  schedule();
  window.FLMTransferFilters = Object.freeze({version:VERSION,refresh:schedule});
})();
