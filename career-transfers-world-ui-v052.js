import {
  acceptIncomingOffer,
  ensureTransferWorld,
  getTransferWorldSnapshot,
  isTransferWindowOpen,
  processTransferWorld,
  rejectIncomingOffer
} from './transfers-world-v052.js?v=0.5.2';

const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-transfer-world-v052-style';
let db = null;
let queued = false;
let scanning = false;
let customView = null;

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');
const money = value => `£${Number(value || 0).toLocaleString('en-GB')}`;
const compactMoney = value => value >= 1000000
  ? `£${(value / 1000000).toFixed(value >= 10000000 ? 1 : 2)}m`
  : `£${Math.round(value / 1000)}k`;
const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;
const club = id => db?.clubs?.find(item => item.id === id);
const player = id => db?.players?.find(item => item.id === id);
const clubName = id => club(id)?.shortName || club(id)?.name || 'Unknown club';

function loadStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = './career-transfers-world-v052.css?v=0.5.2';
  document.head.appendChild(link);
}

function persist(c) {
  if (!c || localStorage.getItem('flm-autosave') === 'false') return;
  c.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status && status.textContent !== 'SAVED') status.textContent = 'SAVED';
}

async function syncWorld() {
  const c = career();
  if (!c || !manager()?.loadDatabase) return null;
  db ||= await manager().loadDatabase();
  let changed = ensureTransferWorld(c, db);
  const processed = processTransferWorld(c, db);
  changed = processed.changed || changed;
  if (changed) persist(c);
  return { c, snapshot: getTransferWorldSnapshot(c) };
}

function hiddenBaseNodes(page) {
  const tabs = page.querySelector('.v050-tabs');
  if (!tabs) return [];
  const nodes = [];
  let current = tabs.nextElementSibling;
  while (current) {
    if (!current.classList.contains('v052-custom-view')) nodes.push(current);
    current = current.nextElementSibling;
  }
  return nodes;
}

function activateCustomButton(page, button) {
  page.querySelectorAll('.v050-tabs button').forEach(item => item.classList.toggle('is-active', item === button));
}

function offerStatusLabel(status) {
  return {
    pending: 'ACTION REQUIRED',
    accepted: 'ACCEPTED',
    rejected: 'REJECTED',
    expired: 'EXPIRED'
  }[status] || String(status || '').toUpperCase();
}

function showOffers(page, c, trigger) {
  customView = 'offers';
  activateCustomButton(page, trigger);
  page.querySelector('.v052-custom-view')?.remove();
  hiddenBaseNodes(page).forEach(node => { node.hidden = true; });
  const snapshot = getTransferWorldSnapshot(c);
  const offers = [...(snapshot?.incomingOffers || [])].reverse();
  const pending = offers.filter(offer => offer.status === 'pending');
  const panel = document.createElement('section');
  panel.className = 'v052-custom-view';
  panel.innerHTML = `
    <div class="v052-view-head"><div><p class="eyebrow">INCOMING TRANSFER BIDS</p><h3>Offers For Your Players</h3></div><span>${pending.length} PENDING</span></div>
    ${offers.length ? `<div class="v052-offer-list">${offers.map(offer => {
      const p = player(offer.playerId);
      return `<article class="v052-offer ${offer.status === 'pending' ? 'is-pending' : ''}">
        <div><small>${esc(clubName(offer.buyerClubId))} BID</small><strong>${esc(p?.name || 'Player')}</strong><span>${compactMoney(offer.fee)} · ${offer.status === 'pending' ? 'Decision required' : offerStatusLabel(offer.status)}</span></div>
        <em class="v052-status ${esc(offer.status)}">${esc(offerStatusLabel(offer.status))}</em>
        ${offer.status === 'pending' ? `<div class="v052-offer-actions"><button data-v052-accept="${esc(offer.id)}">ACCEPT ${compactMoney(offer.fee)}</button><button class="secondary" data-v052-reject="${esc(offer.id)}">REJECT</button></div>` : '<div></div>'}
      </article>`;
    }).join('')}</div>` : `<div class="v052-empty"><strong>NO BIDS RECEIVED</strong><span>Transfer-list a player to make incoming interest more likely. Clubs can also bid for high-value players who are not listed.</span></div>`}
    <div class="v052-note"><strong>BOARD POLICY</strong><span>85% of an accepted transfer fee is returned to your transfer budget. The outgoing player's wage is released.</span></div>`;
  page.appendChild(panel);

  panel.querySelectorAll('[data-v052-accept]').forEach(button => button.addEventListener('click', () => {
    try {
      const transaction = acceptIncomingOffer(c, db, button.dataset.v052Accept);
      persist(c);
      const name = player(transaction.playerId)?.name || 'Player';
      window.alert?.(`${name} sold to ${clubName(transaction.toClubId)} for ${money(transaction.fee)}. ${money(transaction.budgetCredit)} added to your transfer budget.`);
    } catch (error) {
      window.alert?.(error.message);
    }
    showOffers(page, c, trigger);
  }));
  panel.querySelectorAll('[data-v052-reject]').forEach(button => button.addEventListener('click', () => {
    try { rejectIncomingOffer(c, db, button.dataset.v052Reject); persist(c); }
    catch (error) { window.alert?.(error.message); }
    showOffers(page, c, trigger);
  }));
}

function worldDealRow(transaction) {
  const p = player(transaction.playerId);
  const from = clubName(transaction.fromClubId);
  const to = clubName(transaction.toClubId);
  return `<article class="v052-deal-row"><div><strong>${esc(p?.name || 'Player')}</strong><span>${esc(from)} → ${esc(to)}</span></div><b>${compactMoney(transaction.fee)}</b>${transaction.deadlineDay ? '<em>DEADLINE DAY</em>' : '<em>COMPLETED</em>'}</article>`;
}

function rumourRow(rumour) {
  const p = player(rumour.playerId);
  return `<article class="v052-rumour-row"><div><strong>${esc(clubName(rumour.buyerClubId))} watching ${esc(p?.name || 'player')}</strong><span>${esc(clubName(rumour.sellerClubId))} · expected around ${compactMoney(rumour.estimatedFee)}</span></div><em>${esc(rumour.confidence)}</em></article>`;
}

function showWorld(page, c, trigger) {
  customView = 'world';
  activateCustomButton(page, trigger);
  page.querySelector('.v052-custom-view')?.remove();
  hiddenBaseNodes(page).forEach(node => { node.hidden = true; });
  const snapshot = getTransferWorldSnapshot(c);
  const deals = [...(snapshot?.aiTransactions || [])].reverse().slice(0, 16);
  const rumours = [...(snapshot?.rumours || [])].reverse().slice(0, 10);
  const open = isTransferWindowOpen(c);
  const panel = document.createElement('section');
  panel.className = 'v052-custom-view';
  panel.innerHTML = `
    <div class="v052-view-head"><div><p class="eyebrow">LIVING TRANSFER MARKET</p><h3>Football World</h3></div><span class="${open ? 'open' : 'closed'}">${open ? 'WINDOW OPEN' : 'WINDOW CLOSED'}</span></div>
    <div class="v052-world-kpis">
      <article><small>AI DEALS</small><strong>${snapshot?.aiTransactions?.length || 0}</strong><span>Completed this summer</span></article>
      <article><small>LIVE RUMOURS</small><strong>${snapshot?.rumours?.filter(item => item.status === 'active').length || 0}</strong><span>Market intelligence</span></article>
      <article><small>YOUR BIDS</small><strong>${snapshot?.incomingOffers?.filter(item => item.status === 'pending').length || 0}</strong><span>Awaiting decision</span></article>
      <article><small>DEADLINE DAY</small><strong>${snapshot?.deadlineDay?.triggered ? 'DONE' : 'PENDING'}</strong><span>${snapshot?.deadlineDay?.triggered ? `${snapshot.deadlineDay.deals} late deals` : 'After Matchweek 2'}</span></article>
    </div>
    <div class="v052-world-grid">
      <section><div class="v052-section-head"><strong>LATEST COMPLETED DEALS</strong><span>AI clubs buy for squad needs and budget</span></div>${deals.length ? `<div class="v052-deal-list">${deals.map(worldDealRow).join('')}</div>` : '<div class="v052-empty"><strong>NO AI DEALS YET</strong><span>The market will move as pre-season advances.</span></div>'}</section>
      <section><div class="v052-section-head"><strong>TRANSFER RUMOURS</strong><span>Not every link becomes a deal</span></div>${rumours.length ? `<div class="v052-rumour-list">${rumours.map(rumourRow).join('')}</div>` : '<div class="v052-empty"><strong>QUIET MARKET</strong><span>No current rumours.</span></div>'}</section>
    </div>
    ${snapshot?.deadlineDay?.triggered ? `<div class="v052-deadline closed"><strong>DEADLINE DAY COMPLETE</strong><span>The summer market is shut. ${snapshot.deadlineDay.deals} AI deals were completed in the final push.</span></div>` : `<div class="v052-deadline"><strong>DEADLINE DAY SYSTEM ACTIVE</strong><span>Activity increases before the window shuts after Matchweek 2. Pending bids expire at the deadline.</span></div>`}`;
  page.appendChild(panel);
}

function decorateTransferPage(c, snapshot) {
  const page = document.querySelector('.v050-transfer-page');
  if (!page) return;
  const tabs = page.querySelector('.v050-tabs');
  if (!tabs) return;

  const eyebrow = page.querySelector('.v050-transfer-head .eyebrow');
  const label = isTransferWindowOpen(c) ? 'SUMMER TRANSFER WINDOW · OPEN' : 'SUMMER TRANSFER WINDOW · CLOSED';
  if (eyebrow && eyebrow.textContent !== label) eyebrow.textContent = label;

  let offersButton = tabs.querySelector('[data-v052-offers]');
  if (!offersButton) {
    offersButton = document.createElement('button');
    offersButton.type = 'button';
    offersButton.dataset.v052Offers = '1';
    tabs.appendChild(offersButton);
    offersButton.addEventListener('click', () => showOffers(page, career(), offersButton));
  }
  const pending = snapshot?.incomingOffers?.filter(offer => offer.status === 'pending').length || 0;
  const offersLabel = pending ? `OFFERS · ${pending}` : 'OFFERS';
  if (offersButton.textContent !== offersLabel) offersButton.textContent = offersLabel;

  let worldButton = tabs.querySelector('[data-v052-world]');
  if (!worldButton) {
    worldButton = document.createElement('button');
    worldButton.type = 'button';
    worldButton.dataset.v052World = '1';
    worldButton.textContent = 'WORLD';
    tabs.appendChild(worldButton);
    worldButton.addEventListener('click', () => showWorld(page, career(), worldButton));
  }

  if (!isTransferWindowOpen(c)) {
    const controls = page.querySelectorAll('[data-v050-offer],[data-v050-asking],[data-v050-counter],[data-v050-contract],[data-v050-fee],[data-v050-wage],[data-v050-years]');
    controls.forEach(control => { control.disabled = true; });
    const detail = page.querySelector('.v050-detail');
    if (detail && !detail.querySelector('[data-v052-closed]')) {
      const closed = document.createElement('div');
      closed.className = 'v052-window-closed';
      closed.dataset.v052Closed = '1';
      closed.innerHTML = '<strong>TRANSFER WINDOW CLOSED</strong><span>Scouting remains available, but bids and contracts are locked until the next registration window.</span>';
      detail.prepend(closed);
    }
  }

  if (customView === 'offers') showOffers(page, c, offersButton);
  if (customView === 'world') showWorld(page, c, worldButton);
}

async function scan() {
  queued = false;
  if (scanning || !window.FLMManager) return;
  scanning = true;
  try {
    loadStyles();
    const synced = await syncWorld();
    if (synced) decorateTransferPage(synced.c, synced.snapshot);
  } finally {
    scanning = false;
  }
}

function queue() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => scan().catch(() => { queued = false; scanning = false; }));
}

document.addEventListener('click', event => {
  if (event.target.closest('.v050-tabs button:not([data-v052-offers]):not([data-v052-world])')) customView = null;
});

loadStyles();
queue();
new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
