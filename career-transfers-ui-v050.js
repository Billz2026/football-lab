import {
  acceptSellerCounter,
  ensureTransferState,
  estimatePlayerValue,
  estimateWeeklyWage,
  getAskingPrice,
  getIncomingOffers,
  getNegotiation,
  getPlayerContract,
  getTransferBudget,
  getTransferWindowStatus,
  listOwnPlayersForTransfer,
  processTransferWorld,
  respondToIncomingOffer,
  searchTransferMarket,
  submitContractOffer,
  submitTransferOffer,
  toggleTransferListed
} from './transfers-v050.js?v=0.5.5';

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
let syncPromise = null;
let marketFrame = 0;
let marketScrollTop = 0;
const boundRoots = new WeakSet();

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
const compactMoney = value => value >= 1000000
  ? `£${(value / 1000000).toFixed(value >= 10000000 ? 1 : 2)}m`
  : `£${Math.round(value / 1000)}k`;

function loadStyles() {
  const existing = document.getElementById('flm-transfers-v050-style');
  if (existing) {
    if (!existing.href.includes('v=0.5.5')) existing.href = './career-transfers-v050.css?v=0.5.5';
    return;
  }
  const link = document.createElement('link');
  link.id = 'flm-transfers-v050-style';
  link.rel = 'stylesheet';
  link.href = './career-transfers-v050.css?v=0.5.5';
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
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    const c = career();
    if (!c || !manager()?.loadDatabase) return null;
    db ||= await manager().loadDatabase();
    const stateChanged = ensureTransferState(c, db);
    const world = processTransferWorld(c, db);
    if (stateChanged || world.changed) persist(c);
    return { c, db, world };
  })();

  try {
    return await syncPromise;
  } finally {
    syncPromise = null;
  }
}

function updateNavBadge(c = career()) {
  const button = document.querySelector('.career-nav [data-v050-transfer-tab]');
  if (!button || !c?.transfers) return;
  let pending = 0;
  try {
    pending = getIncomingOffers(c, { includeResolved: false }).length;
  } catch (_) {
    pending = 0;
  }
  const nextLabel = pending
    ? `Transfers<small>${pending} OFFER${pending === 1 ? '' : 'S'}</small>`
    : 'Transfers';
  if (button.innerHTML !== nextLabel) button.innerHTML = nextLabel;
  button.disabled = Boolean(document.querySelector('[data-live-match]'));
  button.classList.toggle('is-active', open);
}

function ensureNav() {
  const nav = document.querySelector('.career-nav');
  const c = career();
  if (!nav || !c) return;

  let button = nav.querySelector('[data-v050-transfer-tab]');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'career-nav-button v050-transfer-nav';
    button.dataset.v050TransferTab = '1';
    nav.querySelector('[data-career-tab="squad"]')?.after(button);
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (button.disabled) return;
      open = true;
      tab = 'Market';
      flash = null;
      requestAnimationFrame(() => renderTransfers(true));
    });
  }
  updateNavBadge(c);
}

function playerMeta(p) {
  const alternatives = (p.secondaryPositions || []).length ? p.secondaryPositions.join(', ') : '—';
  return `${p.reportedAge || '—'} yrs · ${p.primaryPosition || p.positionGroup || '—'} · Alt: ${alternatives}`;
}

function contractLabel(c, p) {
  const contract = getPlayerContract(c, p);
  return contract ? `£${contract.weeklyWage.toLocaleString('en-GB')}/wk · Jun ${contract.expiryYear}` : 'Contract unavailable';
}

function marketDetail(c, p) {
  if (!p) return `<div class="v050-empty"><strong>SELECT A PLAYER</strong><span>Search the market and open a player to begin negotiations.</span></div>`;
  const window = getTransferWindowStatus(c);
  const asking = getAskingPrice(p, db, c);
  const value = estimatePlayerValue(p);
  const negotiation = c.transfers.negotiations[p.id] || null;
  const status = negotiation?.status || 'idle';
  const latest = negotiation?.messages?.at(-1) || null;
  const contract = getPlayerContract(c, p);

  let action = '';
  if (!window.open) {
    action = `<div class="v050-offer-box v052-closed"><h4>WINDOW CLOSED</h4><div class="v050-message bad">Permanent registrations closed at 23:00 on 1 September. You can still scout the market, but no deal can be completed.</div></div>`;
  } else if (status === 'fee-accepted' || status === 'contract-countered') {
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
        ${status === 'countered'
          ? `<button class="v050-action secondary" style="margin-top:7px" data-v050-counter>ACCEPT COUNTER · ${compactMoney(negotiation.counterFee)}</button>`
          : `<button class="v050-action secondary" style="margin-top:7px" data-v050-asking>MEET ASKING PRICE · ${compactMoney(asking)}</button>`}
        ${latest ? `<div class="v050-message ${status === 'rejected' ? 'bad' : ''}">${esc(latest)}</div>` : ''}
      </div>`;
  }

  return `
    <div class="v050-detail-head">
      <div><p class="eyebrow">TRANSFER TARGET</p><h3>${esc(p.name)}</h3><p>${esc(playerMeta(p))}</p></div>
      <div class="v050-price-card"><small>ESTIMATED VALUE</small><strong>${compactMoney(value)}</strong></div>
    </div>
    <div class="v050-facts v052-facts-four">
      <div><small>CURRENT CLUB</small><strong>${esc(clubName(p.clubId))}</strong></div>
      <div><small>ASKING PRICE</small><strong>${compactMoney(asking)}</strong></div>
      <div><small>CONTRACT</small><strong>${contract ? `Jun ${contract.expiryYear}` : '—'}</strong></div>
      <div><small>EST. WAGE</small><strong>${compactMoney(contract?.weeklyWage || estimateWeeklyWage(p))}/wk</strong></div>
    </div>
    ${action}`;
}

function marketPlayers(c) {
  return searchTransferMarket(c, db, { query, position });
}

function ensureSelected(players) {
  if (!players.some(p => p.id === selectedId)) selectedId = players[0]?.id || null;
  return players.find(p => p.id === selectedId) || null;
}

function marketRows(c, players) {
  if (!players.length) {
    return `<div class="v050-empty"><strong>NO MATCHES</strong><span>Change the search or position filter.</span></div>`;
  }
  return players.slice(0, 120).map(p => `
    <button class="v050-player-row ${p.id === selectedId ? 'is-selected' : ''}" data-v050-player="${esc(p.id)}">
      <span class="v050-pos">${esc(p.primaryPosition || p.positionGroup || '—')}</span>
      <span><strong>${esc(p.name)}</strong><small>${esc(clubName(p.clubId))} · Age ${esc(p.reportedAge || '—')} · Jun ${getPlayerContract(c, p)?.expiryYear || '—'}</small></span>
      <span class="v050-value">${compactMoney(estimatePlayerValue(p))}</span>
    </button>`).join('');
}

function marketView(c) {
  const players = marketPlayers(c);
  const selected = ensureSelected(players);
  return `
    <div class="v050-market-tools">
      <div class="v050-search-wrap"><input type="search" value="${esc(query)}" placeholder="Search players or positions" data-v050-search aria-label="Search transfer market" /><span data-v050-market-count>${Math.min(players.length, 120)} / ${players.length}</span></div>
      <select data-v050-position aria-label="Filter position"><option ${position === 'All' ? 'selected' : ''}>All</option><option ${position === 'GK' ? 'selected' : ''}>GK</option><option ${position === 'DEF' ? 'selected' : ''}>DEF</option><option ${position === 'MID' ? 'selected' : ''}>MID</option><option ${position === 'ATT' ? 'selected' : ''}>ATT</option></select>
    </div>
    <div class="v050-market-layout">
      <div class="v050-player-list" data-v050-player-list>${marketRows(c, players)}</div>
      <article class="v050-detail" data-v050-detail>${marketDetail(c, selected)}</article>
    </div>`;
}

function refreshMarket(c, { resetScroll = false, detailOnly = false } = {}) {
  const root = document.querySelector('.career-content');
  if (!root || tab !== 'Market' || !root.querySelector('.v050-transfer-page')) return;

  const list = root.querySelector('[data-v050-player-list]');
  const detail = root.querySelector('[data-v050-detail]');
  if (!list || !detail) return;

  if (detailOnly) {
    root.querySelectorAll('[data-v050-player]').forEach(button => {
      button.classList.toggle('is-selected', button.dataset.v050Player === selectedId);
    });
    detail.innerHTML = marketDetail(c, player(selectedId));
    return;
  }

  const previousScroll = resetScroll ? 0 : list.scrollTop;
  const players = marketPlayers(c);
  const selected = ensureSelected(players);
  list.innerHTML = marketRows(c, players);
  detail.innerHTML = marketDetail(c, selected);
  const count = root.querySelector('[data-v050-market-count]');
  if (count) count.textContent = `${Math.min(players.length, 120)} / ${players.length}`;
  list.scrollTop = previousScroll;
}

function scheduleMarketRefresh(resetScroll = false) {
  if (marketFrame) cancelAnimationFrame(marketFrame);
  marketFrame = requestAnimationFrame(() => {
    marketFrame = 0;
    const c = career();
    if (c && db) refreshMarket(c, { resetScroll });
  });
}

function negotiationsView(c) {
  const entries = Object.values(c.transfers.negotiations || {}).filter(item => item.status !== 'idle');
  return entries.length ? `<div class="v050-negotiation-list">${entries.map(item => {
    const p = player(item.playerId);
    const completed = item.status === 'completed';
    return `<div class="v050-negotiation-row"><span><strong>${esc(p?.name || 'Player')}</strong><small>${completed ? `Signed for ${compactMoney(item.lastOffer)}` : `${esc(clubName(item.sellingClubId))} · Last bid ${compactMoney(item.lastOffer)}`}</small></span><span class="v050-status">${esc(item.status.replaceAll('-', ' ').toUpperCase())}</span>${completed ? '<span></span>' : `<button class="v050-list-button" data-v050-open-neg="${esc(item.playerId)}">OPEN</button>`}</div>`;
  }).join('')}</div>` : `<div class="v050-empty"><strong>NO NEGOTIATIONS</strong><span>Make an offer for a player to start a negotiation.</span></div>`;
}

function offersView(c) {
  const offers = getIncomingOffers(c).sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || b.round - a.round);
  if (!offers.length) return `<div class="v050-empty"><strong>NO OFFERS RECEIVED</strong><span>Transfer-listed players are much more likely to attract bids as the window develops.</span></div>`;
  return `<div class="v052-offer-list">${offers.map(offer => {
    const p = player(offer.playerId);
    const pending = offer.status === 'pending';
    const defaultCounter = Math.round((offer.offeredFee * 1.1) / 250000) * 250000;
    return `<article class="v052-offer-row ${pending ? 'is-pending' : ''}" data-v052-offer-row="${esc(offer.id)}">
      <div class="v052-offer-main"><span class="v050-pos">${esc(p?.primaryPosition || p?.positionGroup || '—')}</span><span><strong>${esc(p?.name || 'Player')}</strong><small>${esc(clubName(offer.buyerClubId))} · ${offer.listed ? 'Transfer listed' : 'Unsolicited bid'} · ${esc(contractLabel(c, p))}</small></span></div>
      <div class="v052-offer-money"><small>OFFER</small><strong>${compactMoney(offer.offeredFee)}</strong></div>
      <span class="v050-status">${esc(offer.status.replaceAll('-', ' ').toUpperCase())}</span>
      ${pending ? `<div class="v052-offer-actions"><button class="v050-action" data-v052-accept="${esc(offer.id)}">ACCEPT</button><input type="number" step="250000" min="250000" value="${defaultCounter}" data-v052-counter-fee="${esc(offer.id)}" aria-label="Counter offer"/><button class="v050-action secondary" data-v052-counter="${esc(offer.id)}">COUNTER</button><button class="v050-list-button" data-v052-reject="${esc(offer.id)}">REJECT</button></div>` : `<div class="v052-resolved">${offer.completedFee ? `Completed at ${compactMoney(offer.completedFee)}` : offer.counterFee ? `Countered at ${compactMoney(offer.counterFee)}` : 'No longer active'}</div>`}
    </article>`;
  }).join('')}</div>`;
}

function worldView(c) {
  const aiDeals = [...(c.transfers.completed || [])].filter(item => item.source === 'ai').reverse();
  const rumours = [...(c.transfers.rumours || [])].reverse();
  const latestDeals = aiDeals.slice(0, 30);
  const latestRumours = rumours.slice(0, 12);
  return `<div class="v052-world-grid">
    <section class="v052-world-panel"><div class="v052-world-head"><strong>COMPLETED DEALS</strong><span>${aiDeals.length} AI-TO-AI</span></div>${latestDeals.length ? latestDeals.map(item => {
      const p = player(item.playerId);
      return `<div class="v052-world-row"><span><strong>${esc(p?.name || 'Player')}</strong><small>${esc(clubName(item.fromClubId))} → ${esc(clubName(item.toClubId))}</small></span><b>${compactMoney(item.fee)}</b></div>`;
    }).join('') : `<div class="v050-empty"><strong>NO AI DEALS YET</strong><span>Recruitment departments will act as squad needs and budgets develop.</span></div>`}</section>
    <section class="v052-world-panel"><div class="v052-world-head"><strong>TRANSFER RUMOURS</strong><span>UNCONFIRMED</span></div>${latestRumours.length ? latestRumours.map(item => {
      const p = player(item.playerId);
      return `<div class="v052-world-row"><span><strong>${esc(clubName(item.buyerClubId))} tracking ${esc(p?.name || 'target')}</strong><small>No agreement confirmed</small></span><span class="v050-status">MONITORING</span></div>`;
    }).join('') : `<div class="v050-empty"><strong>NO ACTIVE RUMOURS</strong><span>Interest will appear as clubs identify targets.</span></div>`}</section>
  </div>`;
}

function ownSquadView(c) {
  const players = listOwnPlayersForTransfer(c, db);
  const listed = new Set(c.transfers.listedPlayerIds || []);
  return `<div class="v050-own-list">${players.map(p => {
    const contract = getPlayerContract(c, p);
    return `<div class="v050-own-row"><span><strong>${esc(p.name)}</strong><small>${esc(playerMeta(p))} · ${compactMoney(estimatePlayerValue(p))} value · ${money(contract?.weeklyWage || 0)}/wk · Jun ${contract?.expiryYear || '—'}</small></span><span class="v050-status">${listed.has(p.id) ? 'TRANSFER LISTED' : 'UNDER CONTRACT'}</span><button class="v050-list-button" data-v050-list="${esc(p.id)}">${listed.has(p.id) ? 'REMOVE FROM LIST' : 'TRANSFER LIST'}</button></div>`;
  }).join('')}</div>`;
}

function bindRoot(root) {
  if (boundRoots.has(root)) return;
  boundRoots.add(root);

  root.addEventListener('input', event => {
    const search = event.target.closest?.('[data-v050-search]');
    if (!search) return;
    query = search.value;
    selectedId = null;
    scheduleMarketRefresh(true);
  });

  root.addEventListener('change', event => {
    const filter = event.target.closest?.('[data-v050-position]');
    if (!filter) return;
    position = filter.value;
    selectedId = null;
    scheduleMarketRefresh(true);
  });

  root.addEventListener('click', event => {
    const c = career();
    if (!c || !db) return;

    const tabButton = event.target.closest('[data-v050-tab]');
    if (tabButton) {
      tab = tabButton.dataset.v050Tab;
      void renderTransfers(true);
      return;
    }

    const playerButton = event.target.closest('[data-v050-player]');
    if (playerButton) {
      const list = root.querySelector('[data-v050-player-list]');
      if (list) marketScrollTop = list.scrollTop;
      selectedId = playerButton.dataset.v050Player;
      refreshMarket(c, { detailOnly: true });
      return;
    }

    if (event.target.closest('[data-v050-asking]')) {
      const p = player(selectedId);
      const input = root.querySelector('[data-v050-fee]');
      if (p && input) input.value = String(getAskingPrice(p, db, c));
      return;
    }

    if (event.target.closest('[data-v050-offer]')) {
      try {
        const feeInput = root.querySelector('[data-v050-fee]');
        const result = submitTransferOffer(c, db, selectedId, Number(feeInput?.value));
        persist(c);
        flash = {
          text: result.status === 'accepted' ? 'Transfer fee accepted. Negotiate personal terms.' : result.negotiation.messages.at(-1),
          good: result.status === 'accepted',
          bad: result.status === 'rejected'
        };
      } catch (error) {
        flash = { text: error.message, bad: true };
      }
      void renderTransfers(true);
      return;
    }

    if (event.target.closest('[data-v050-counter]')) {
      try {
        acceptSellerCounter(c, db, selectedId);
        persist(c);
        flash = { text: 'Counter-offer accepted. Personal terms can now be negotiated.', good: true };
      } catch (error) {
        flash = { text: error.message, bad: true };
      }
      void renderTransfers(true);
      return;
    }

    if (event.target.closest('[data-v050-contract]')) {
      try {
        const wageInput = root.querySelector('[data-v050-wage]');
        const yearsInput = root.querySelector('[data-v050-years]');
        const result = submitContractOffer(c, db, selectedId, Number(wageInput?.value), Number(yearsInput?.value));
        persist(c);
        if (result.status === 'completed') {
          flash = { text: `${player(result.transaction.playerId)?.name || 'Player'} has signed for ${clubName(c.clubId)}.`, good: true };
          tab = 'My Squad';
          selectedId = null;
        } else {
          flash = { text: result.negotiation.messages.at(-1), bad: true };
        }
      } catch (error) {
        flash = { text: error.message, bad: true };
      }
      void renderTransfers(true);
      return;
    }

    const openNegotiation = event.target.closest('[data-v050-open-neg]');
    if (openNegotiation) {
      selectedId = openNegotiation.dataset.v050OpenNeg;
      tab = 'Market';
      void renderTransfers(true);
      return;
    }

    const listButton = event.target.closest('[data-v050-list]');
    if (listButton) {
      try {
        const listed = toggleTransferListed(c, db, listButton.dataset.v050List);
        persist(c);
        flash = { text: listed ? 'Player added to the transfer list. Clubs will assess him as the window develops.' : 'Player removed from the transfer list.' };
      } catch (error) {
        flash = { text: error.message, bad: true };
      }
      void renderTransfers(true);
      return;
    }

    const accept = event.target.closest('[data-v052-accept]');
    if (accept) {
      try {
        const result = respondToIncomingOffer(c, db, accept.dataset.v052Accept, 'accept');
        persist(c);
        tab = 'My Squad';
        flash = { text: `Offer accepted. ${player(result.transaction.playerId)?.name || 'Player'} has left for ${clubName(result.transaction.toClubId)}. Recheck your starting XI.`, good: true };
      } catch (error) {
        flash = { text: error.message, bad: true };
      }
      void renderTransfers(true);
      return;
    }

    const reject = event.target.closest('[data-v052-reject]');
    if (reject) {
      try {
        respondToIncomingOffer(c, db, reject.dataset.v052Reject, 'reject');
        persist(c);
        flash = { text: 'Transfer offer rejected.' };
      } catch (error) {
        flash = { text: error.message, bad: true };
      }
      void renderTransfers(true);
      return;
    }

    const counter = event.target.closest('[data-v052-counter]');
    if (counter) {
      const offerId = counter.dataset.v052Counter;
      const input = root.querySelector(`[data-v052-counter-fee="${CSS.escape(offerId)}"]`);
      try {
        const result = respondToIncomingOffer(c, db, offerId, 'counter', Number(input?.value));
        persist(c);
        if (result.status === 'completed') {
          tab = 'My Squad';
          flash = { text: `Counter accepted. ${player(result.transaction.playerId)?.name || 'Player'} has been sold for ${compactMoney(result.transaction.fee)}.`, good: true };
        } else {
          flash = { text: 'The buying club rejected your counter-offer and walked away.', bad: true };
        }
      } catch (error) {
        flash = { text: error.message, bad: true };
      }
      void renderTransfers(true);
    }
  });
}

async function renderTransfers(force = false) {
  if (!open || rendering) return;
  let root = document.querySelector('.career-content');
  if (!root) return;
  if (!force && root.dataset.v050Transfers === '1' && root.querySelector('.v050-transfer-page')) return;

  rendering = true;
  try {
    const synced = await sync();
    if (!synced || !open) return;
    root = document.querySelector('.career-content');
    if (!root) return;

    const currentList = root.querySelector('[data-v050-player-list]');
    if (currentList) marketScrollTop = currentList.scrollTop;

    const c = synced.c;
    const budget = getTransferBudget(c);
    const window = getTransferWindowStatus(c);
    const pendingOffers = getIncomingOffers(c, { includeResolved: false }).length;

    document.querySelectorAll('.career-nav-button').forEach(button => button.classList.remove('is-active'));
    document.querySelector('[data-v050-transfer-tab]')?.classList.add('is-active');

    root.dataset.v050Transfers = '1';
    root.innerHTML = `
      <section class="v050-transfer-page">
        <div class="v050-transfer-head">
          <div><p class="eyebrow">${window.deadlineWeek ? 'DEADLINE WEEK · 1 SEP 23:00' : window.open ? 'SUMMER TRANSFER WINDOW · OPEN' : 'SUMMER TRANSFER WINDOW · CLOSED'}</p><h2>Transfers</h2></div>
          <div class="v050-budget v052-budget">
            <div><small>TRANSFER BUDGET</small><strong>${compactMoney(budget.transferBudget)}</strong></div>
            <div><small>WAGE ROOM / WEEK</small><strong>${compactMoney(budget.wageRoom)}</strong></div>
            <div class="${window.open ? 'is-open' : 'is-closed'}"><small>WINDOW</small><strong>${window.deadlineWeek ? `${Math.max(0, window.daysRemaining)} DAYS` : window.open ? 'OPEN' : 'CLOSED'}</strong></div>
          </div>
        </div>
        <div class="v052-window-strip ${window.deadlineWeek ? 'deadline' : window.open ? 'open' : 'closed'}"><strong>${esc(window.label)}</strong><span>${window.open ? `${Math.max(0, window.daysRemaining)} days until the 1 September deadline.` : 'Permanent deals cannot now be registered.'}</span></div>
        ${flash ? `<div class="v050-message v050-page-flash ${flash.good ? 'good' : flash.bad ? 'bad' : ''}">${esc(flash.text)}</div>` : ''}
        <div class="v050-tabs">
          <button class="${tab === 'Market' ? 'is-active' : ''}" data-v050-tab="Market">MARKET</button>
          <button class="${tab === 'Negotiations' ? 'is-active' : ''}" data-v050-tab="Negotiations">NEGOTIATIONS</button>
          <button class="${tab === 'Offers' ? 'is-active' : ''}" data-v050-tab="Offers">OFFERS${pendingOffers ? ` · ${pendingOffers}` : ''}</button>
          <button class="${tab === 'World' ? 'is-active' : ''}" data-v050-tab="World">WORLD</button>
          <button class="${tab === 'My Squad' ? 'is-active' : ''}" data-v050-tab="My Squad">MY SQUAD</button>
        </div>
        ${tab === 'Market' ? marketView(c) : tab === 'Negotiations' ? negotiationsView(c) : tab === 'Offers' ? offersView(c) : tab === 'World' ? worldView(c) : ownSquadView(c)}
      </section>`;

    bindRoot(root);
    updateNavBadge(c);
    flash = null;

    if (tab === 'Market') {
      requestAnimationFrame(() => {
        const list = root.querySelector('[data-v050-player-list]');
        if (list) list.scrollTop = marketScrollTop;
      });
    }
  } finally {
    rendering = false;
  }
}

async function scan() {
  if (!window.FLMManager) return;
  loadStyles();
  ensureNav();
  if (open) await renderTransfers(false);
}

function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    scan().catch(() => { rendering = false; });
  });
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-v050-transfer-tab]')) return;
  if (event.target.closest('.career-nav-button')) {
    open = false;
    if (marketFrame) {
      cancelAnimationFrame(marketFrame);
      marketFrame = 0;
    }
  }
}, true);

loadStyles();
new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
queue();
