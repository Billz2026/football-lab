import {
  acceptSellerCounter,
  ensureTransferState,
  estimatePlayerValue,
  estimateWeeklyWage,
  getAskingPrice,
  getNegotiation,
  getTransferBudget,
  listOwnPlayersForTransfer,
  searchTransferMarket,
  submitContractOffer,
  submitTransferOffer,
  toggleTransferListed
} from './transfers-v050.js?v=0.5.0';

const SAVE_KEY = 'flm-career-save';
let db = null;
let open = false;
let tab = 'Market';
let selectedId = null;
let query = '';
let position = 'All';
let queued = false;
let rendering = false;
let flash = null;

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;
const club = id => db?.clubs?.find(item => item.id === id);
const player = id => db?.players?.find(item => item.id === id);
const clubName = id => club(id)?.shortName || club(id)?.name || 'Unknown club';
const money = value => `£${Number(value || 0).toLocaleString('en-GB')}`;
const compactMoney = value => value >= 1000000 ? `£${(value / 1000000).toFixed(value >= 10000000 ? 1 : 2)}m` : `£${Math.round(value / 1000)}k`;

function loadStyles() {
  if (document.getElementById('flm-transfers-v050-style')) return;
  const link = document.createElement('link');
  link.id = 'flm-transfers-v050-style';
  link.rel = 'stylesheet';
  link.href = './career-transfers-v050.css?v=0.5.0';
  document.head.appendChild(link);
}

function persist(c) {
  if (!c || localStorage.getItem('flm-autosave') === 'false') return;
  c.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = 'SAVED';
}

async function sync() {
  const c = career();
  if (!c || !manager()?.loadDatabase) return null;
  db ||= await manager().loadDatabase();
  if (ensureTransferState(c, db)) persist(c);
  return { c, db };
}

async function ensureNav() {
  const nav = document.querySelector('.career-nav');
  const c = career();
  if (!nav || !c) return;
  await sync();
  let button = nav.querySelector('[data-v050-transfer-tab]');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'career-nav-button v050-transfer-nav';
    button.dataset.v050TransferTab = '1';
    button.textContent = 'Transfers';
    nav.querySelector('[data-career-tab="squad"]')?.after(button);
    button.addEventListener('click', () => {
      if (button.disabled) return;
      document.querySelector('[data-career-tab="overview"]')?.click();
      open = true;
      queueMicrotask(() => renderTransfers(true));
    });
  }
  button.disabled = Boolean(document.querySelector('[data-live-match]'));
  button.classList.toggle('is-active', open);
}

function playerMeta(p) {
  const alternatives = (p.secondaryPositions || []).length ? p.secondaryPositions.join(', ') : '—';
  return `${p.reportedAge || '—'} yrs · ${p.primaryPosition || p.positionGroup || '—'} · Alt: ${alternatives}`;
}

function marketDetail(c, p) {
  if (!p) return `<div class="v050-empty"><strong>SELECT A PLAYER</strong><span>Search the market and open a player to begin negotiations.</span></div>`;
  const asking = getAskingPrice(p, db);
  const value = estimatePlayerValue(p);
  const negotiation = c.transfers.negotiations[p.id] || null;
  const status = negotiation?.status || 'idle';
  const latest = negotiation?.messages?.at(-1) || null;

  let action = '';
  if (status === 'fee-accepted' || status === 'contract-countered') {
    const demand = negotiation.wageDemand || estimateWeeklyWage(p);
    action = `
      <div class="v050-offer-box">
        <h4>PERSONAL TERMS</h4>
        <div class="v050-offer-grid contract">
          <input type="number" min="1000" step="500" value="${demand}" data-v050-wage aria-label="Weekly wage offer" />
          <select data-v050-years aria-label="Contract length"><option>2</option><option>3</option><option selected>4</option><option>5</option></select>
          <button class="v050-action" data-v050-contract>OFFER CONTRACT</button>
        </div>
        <div class="v050-message ${status === 'contract-countered' ? 'bad' : 'good'}">${status === 'contract-countered' ? esc(latest) : `Fee agreed. Representatives are looking for around ${money(demand)} per week.`}</div>
      </div>`;
  } else {
    const defaultFee = negotiation?.counterFee || asking;
    action = `
      <div class="v050-offer-box">
        <h4>TRANSFER FEE</h4>
        <div class="v050-offer-grid">
          <input type="number" min="250000" step="250000" value="${defaultFee}" data-v050-fee aria-label="Transfer fee offer" />
          <button class="v050-action" data-v050-offer>MAKE OFFER</button>
        </div>
        ${status === 'countered' ? `<button class="v050-action secondary" style="margin-top:7px" data-v050-counter>ACCEPT COUNTER · ${compactMoney(negotiation.counterFee)}</button>` : `<button class="v050-action secondary" style="margin-top:7px" data-v050-asking>MEET ASKING PRICE · ${compactMoney(asking)}</button>`}
        ${latest ? `<div class="v050-message ${status === 'rejected' ? 'bad' : ''}">${esc(latest)}</div>` : ''}
      </div>`;
  }

  return `
    <div class="v050-detail-head">
      <div><p class="eyebrow">TRANSFER TARGET</p><h3>${esc(p.name)}</h3><p>${esc(playerMeta(p))}</p></div>
      <div class="v050-price-card"><small>ESTIMATED VALUE</small><strong>${compactMoney(value)}</strong></div>
    </div>
    <div class="v050-facts">
      <div><small>CURRENT CLUB</small><strong>${esc(clubName(p.clubId))}</strong></div>
      <div><small>ASKING PRICE</small><strong>${compactMoney(asking)}</strong></div>
      <div><small>PREFERRED POSITION</small><strong>${esc(p.primaryPosition || p.positionGroup || '—')}</strong></div>
    </div>
    ${action}`;
}

function marketView(c) {
  const players = searchTransferMarket(c, db, { query, position });
  if (!players.some(p => p.id === selectedId)) selectedId = players[0]?.id || null;
  const selected = player(selectedId);
  return `
    <div class="v050-market-tools">
      <input type="search" value="${esc(query)}" placeholder="Search players or positions" data-v050-search aria-label="Search transfer market" />
      <select data-v050-position aria-label="Filter position"><option ${position === 'All' ? 'selected' : ''}>All</option><option ${position === 'GK' ? 'selected' : ''}>GK</option><option ${position === 'DEF' ? 'selected' : ''}>DEF</option><option ${position === 'MID' ? 'selected' : ''}>MID</option><option ${position === 'ATT' ? 'selected' : ''}>ATT</option></select>
    </div>
    <div class="v050-market-layout">
      <div class="v050-player-list">${players.length ? players.slice(0, 120).map(p => `<button class="v050-player-row ${p.id === selectedId ? 'is-selected' : ''}" data-v050-player="${esc(p.id)}"><span class="v050-pos">${esc(p.primaryPosition || p.positionGroup || '—')}</span><span><strong>${esc(p.name)}</strong><small>${esc(clubName(p.clubId))} · Age ${esc(p.reportedAge || '—')}</small></span><span class="v050-value">${compactMoney(estimatePlayerValue(p))}</span></button>`).join('') : `<div class="v050-empty"><strong>NO MATCHES</strong><span>Change the search or position filter.</span></div>`}</div>
      <article class="v050-detail">${marketDetail(c, selected)}</article>
    </div>`;
}

function negotiationsView(c) {
  const entries = Object.values(c.transfers.negotiations || {}).filter(item => item.status !== 'idle');
  return entries.length ? `<div class="v050-negotiation-list">${entries.map(item => {
    const p = player(item.playerId);
    const completed = item.status === 'completed';
    return `<div class="v050-negotiation-row"><span><strong>${esc(p?.name || 'Player')}</strong><small>${completed ? `Signed for ${compactMoney(item.lastOffer)}` : `${esc(clubName(item.sellingClubId))} · Last bid ${compactMoney(item.lastOffer)}`}</small></span><span class="v050-status">${esc(item.status.replaceAll('-', ' ').toUpperCase())}</span>${completed ? '<span></span>' : `<button class="v050-list-button" data-v050-open-neg="${esc(item.playerId)}">OPEN</button>`}</div>`;
  }).join('')}</div>` : `<div class="v050-empty"><strong>NO NEGOTIATIONS</strong><span>Make an offer for a player to start a negotiation.</span></div>`;
}

function ownSquadView(c) {
  const players = listOwnPlayersForTransfer(c, db);
  const listed = new Set(c.transfers.listedPlayerIds || []);
  return `<div class="v050-own-list">${players.map(p => `<div class="v050-own-row"><span><strong>${esc(p.name)}</strong><small>${esc(playerMeta(p))} · Estimated ${compactMoney(estimatePlayerValue(p))}</small></span><span class="v050-status">${listed.has(p.id) ? 'TRANSFER LISTED' : 'AVAILABLE'}</span><button class="v050-list-button" data-v050-list="${esc(p.id)}">${listed.has(p.id) ? 'REMOVE FROM LIST' : 'TRANSFER LIST'}</button></div>`).join('')}</div>`;
}

async function renderTransfers(force = false) {
  if (!open || rendering) return;
  const root = document.querySelector('.career-content');
  const synced = await sync();
  if (!root || !synced) return;
  if (!force && root.dataset.v050Transfers === '1') return;
  rendering = true;
  const c = synced.c;
  const budget = getTransferBudget(c);
  document.querySelectorAll('.career-nav-button').forEach(button => button.classList.remove('is-active'));
  document.querySelector('[data-v050-transfer-tab]')?.classList.add('is-active');
  root.dataset.v050Transfers = '1';
  root.innerHTML = `
    <section class="v050-transfer-page">
      <div class="v050-transfer-head"><div><p class="eyebrow">SUMMER TRANSFER WINDOW</p><h2>Transfers</h2></div><div class="v050-budget"><div><small>TRANSFER BUDGET</small><strong>${compactMoney(budget.transferBudget)}</strong></div><div><small>WAGE ROOM / WEEK</small><strong>${compactMoney(budget.wageRoom)}</strong></div></div></div>
      ${flash ? `<div class="v050-message ${flash.good ? 'good' : flash.bad ? 'bad' : ''}">${esc(flash.text)}</div>` : ''}
      <div class="v050-tabs"><button class="${tab === 'Market' ? 'is-active' : ''}" data-v050-tab="Market">MARKET</button><button class="${tab === 'Negotiations' ? 'is-active' : ''}" data-v050-tab="Negotiations">NEGOTIATIONS</button><button class="${tab === 'My Squad' ? 'is-active' : ''}" data-v050-tab="My Squad">MY SQUAD</button></div>
      ${tab === 'Market' ? marketView(c) : tab === 'Negotiations' ? negotiationsView(c) : ownSquadView(c)}
    </section>`;
  flash = null;

  root.querySelectorAll('[data-v050-tab]').forEach(button => button.addEventListener('click', () => { tab = button.dataset.v050Tab; renderTransfers(true); }));
  root.querySelector('[data-v050-search]')?.addEventListener('input', event => { query = event.target.value; selectedId = null; renderTransfers(true); });
  root.querySelector('[data-v050-position]')?.addEventListener('change', event => { position = event.target.value; selectedId = null; renderTransfers(true); });
  root.querySelectorAll('[data-v050-player]').forEach(button => button.addEventListener('click', () => { selectedId = button.dataset.v050Player; renderTransfers(true); }));
  root.querySelector('[data-v050-asking]')?.addEventListener('click', () => {
    const p = player(selectedId); const input = root.querySelector('[data-v050-fee]'); if (p && input) input.value = String(getAskingPrice(p, db));
  });
  root.querySelector('[data-v050-offer]')?.addEventListener('click', () => {
    try {
      const result = submitTransferOffer(c, db, selectedId, Number(root.querySelector('[data-v050-fee]').value));
      persist(c);
      flash = { text: result.status === 'accepted' ? 'Transfer fee accepted. Negotiate personal terms.' : result.negotiation.messages.at(-1), good: result.status === 'accepted', bad: result.status === 'rejected' };
    } catch (error) { flash = { text: error.message, bad: true }; }
    renderTransfers(true);
  });
  root.querySelector('[data-v050-counter]')?.addEventListener('click', () => {
    try { acceptSellerCounter(c, db, selectedId); persist(c); flash = { text: 'Counter-offer accepted. Personal terms can now be negotiated.', good: true }; }
    catch (error) { flash = { text: error.message, bad: true }; }
    renderTransfers(true);
  });
  root.querySelector('[data-v050-contract]')?.addEventListener('click', () => {
    try {
      const result = submitContractOffer(c, db, selectedId, Number(root.querySelector('[data-v050-wage]').value), Number(root.querySelector('[data-v050-years]').value));
      persist(c);
      if (result.status === 'completed') {
        flash = { text: `${player(result.transaction.playerId)?.name || 'Player'} has signed for ${clubName(c.clubId)}.`, good: true };
        tab = 'My Squad'; selectedId = null;
      } else flash = { text: result.negotiation.messages.at(-1), bad: true };
    } catch (error) { flash = { text: error.message, bad: true }; }
    renderTransfers(true);
  });
  root.querySelectorAll('[data-v050-open-neg]').forEach(button => button.addEventListener('click', () => { selectedId = button.dataset.v050OpenNeg; tab = 'Market'; renderTransfers(true); }));
  root.querySelectorAll('[data-v050-list]').forEach(button => button.addEventListener('click', () => {
    try { const listed = toggleTransferListed(c, db, button.dataset.v050List); persist(c); flash = { text: listed ? 'Player added to the transfer list.' : 'Player removed from the transfer list.' }; }
    catch (error) { flash = { text: error.message, bad: true }; }
    renderTransfers(true);
  }));
  rendering = false;
}

async function scan() {
  queued = false;
  if (!window.FLMManager) return;
  loadStyles();
  await ensureNav();
  if (open) await renderTransfers();
}

function queue() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => scan().catch(() => { queued = false; rendering = false; }));
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-v050-transfer-tab]')) return;
  if (event.target.closest('.career-nav-button')) open = false;
}, true);

loadStyles();
new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
queue();
