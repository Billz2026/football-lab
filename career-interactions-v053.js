import {
  estimatePlayerValue,
  getPlayerContract,
  respondToIncomingOffer
} from './transfers-v050.js?v=0.5.2';

const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-v053-interactions-style';
let dbPromise = null;
let profileApiWrapped = false;

const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;
const loadDb = () => dbPromise ||= manager()?.loadDatabase?.();
const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function compactMoney(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1000000) return `£${(n / 1000000).toFixed(n >= 10000000 ? 1 : 2)}m`;
  return `£${Math.round(n / 1000)}k`;
}

function persist(c) {
  if (!c) return;
  c.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = 'SAVED';
}

function toast(message, error = false) {
  document.querySelector('.career-toast.v053-toast')?.remove();
  const element = document.createElement('div');
  element.className = `career-toast v053-toast${error ? ' is-error' : ''}`;
  element.textContent = message;
  document.body.appendChild(element);
  requestAnimationFrame(() => element.classList.add('is-visible'));
  setTimeout(() => element.remove(), 2800);
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .version-chip{font-size:0!important}.version-chip::after{content:'V0.5.3'!important;font-size:11px!important}
    .footer-build{font-size:0!important}.footer-build::after{content:'V0.5.3 · PLAYER & TRANSFER INTERACTIONS'!important;font-size:10px!important}
    .v044-name strong,.v050-player-row strong,.v050-own-row strong,.v052-offer-main strong,.v052-world-row strong{cursor:pointer;text-decoration-thickness:1px;text-underline-offset:3px}
    .v044-name strong:hover,.v050-player-row strong:hover,.v050-own-row strong:hover,.v052-offer-main strong:hover,.v052-world-row strong:hover{text-decoration:underline;color:#ffd66a}
    .v053-profile-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:0 0 12px}
    .v053-profile-summary>div{padding:10px;border:1px solid rgba(239,185,63,.16);border-radius:8px;background:#0b0a08}
    .v053-profile-summary small{display:block;color:#81786b;font-size:7px;letter-spacing:.08em}.v053-profile-summary strong{display:block;margin-top:3px;color:#f2eadc;font-size:10px}
    .v053-compare-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
    .v053-compare-card{padding:11px;border:1px solid rgba(239,185,63,.18);border-radius:9px;background:#0a0907}.v053-compare-card h4{margin:0 0 8px;color:#ffd66a;font-size:11px}.v053-compare-card div{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:9px}.v053-compare-card div:last-child{border-bottom:0}.v053-compare-card span{color:#847c70}
    .v053-offer-busy{opacity:.55;pointer-events:none}
    @media(max-width:620px){.v053-profile-summary{grid-template-columns:1fr 1fr}.v053-compare-summary{grid-template-columns:1fr}.v044-name strong,.v050-player-row strong,.v050-own-row strong,.v052-offer-main strong{min-height:28px;align-items:center}}
  `;
  document.head.appendChild(style);
}

function openModalShell() {
  const modal = document.getElementById('appModal');
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModalShell() {
  const modal = document.getElementById('appModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.querySelector('.modal-card')?.classList.remove('modal-wide');
  document.body.style.overflow = document.querySelector('.career-app.is-open') ? 'hidden' : '';
}

function aggregateStats(player, c) {
  const live = c?.playerStatus?.[player.id] || {};
  const rows = Array.isArray(player.seasonStats) ? player.seasonStats : [];
  const apps = Number.isFinite(live.appearances) ? live.appearances : rows.reduce((sum, row) => sum + (Number(row.apps) || 0), 0);
  const goals = Number.isFinite(live.goals) ? live.goals : rows.reduce((sum, row) => sum + (Number(row.goals) || 0), 0);
  const assists = rows.reduce((sum, row) => sum + (Number(row.assists) || 0), 0);
  const rated = rows.filter(row => Number.isFinite(Number(row.averageRating)) && Number(row.apps) > 0);
  const ratingApps = rated.reduce((sum, row) => sum + Number(row.apps), 0);
  const avg = ratingApps ? rated.reduce((sum, row) => sum + Number(row.averageRating) * Number(row.apps), 0) / ratingApps : null;
  return { apps, goals, assists, avg };
}

function playerSnapshot(player, c) {
  if (!player) return { value: 0, wage: 0, contract: '—', stats: { apps: 0, goals: 0, assists: 0, avg: null } };
  let contract = null;
  try { if (c) contract = getPlayerContract(c, player); } catch {}
  return {
    value: estimatePlayerValue(player),
    wage: contract?.weeklyWage || player.contract?.weeklyWage || 0,
    contract: contract?.expiryYear ? `Jun ${contract.expiryYear}` : player.contract?.endDate || '—',
    stats: aggregateStats(player, c)
  };
}

async function enrichCompare(basePlayerId) {
  const root = document.querySelector('[data-compare-body]');
  const select = document.querySelector('[data-compare-select]');
  if (!root || !select) return;
  const db = await loadDb();
  const c = career();
  if (!db) return;

  const draw = () => {
    root.querySelector('.v053-compare-summary')?.remove();
    const a = db.players.find(player => player.id === basePlayerId);
    const b = db.players.find(player => player.id === select.value);
    if (!a || !b) return;
    const sa = playerSnapshot(a, c);
    const sb = playerSnapshot(b, c);
    const card = (player, snapshot) => `<article class="v053-compare-card"><h4>${esc(player.name)}</h4>
      <div><span>Position</span><strong>${esc(player.primaryPosition || player.positionGroup || '—')}</strong></div>
      <div><span>Age</span><strong>${esc(player.reportedAge || '—')}</strong></div>
      <div><span>Value</span><strong>${compactMoney(snapshot.value)}</strong></div>
      <div><span>Wage</span><strong>${snapshot.wage ? `${compactMoney(snapshot.wage)}/wk` : '—'}</strong></div>
      <div><span>Contract</span><strong>${esc(snapshot.contract)}</strong></div>
      <div><span>Apps / Goals / Assists</span><strong>${snapshot.stats.apps} / ${snapshot.stats.goals} / ${snapshot.stats.assists}</strong></div>
      <div><span>Average rating</span><strong>${snapshot.stats.avg ? snapshot.stats.avg.toFixed(2) : '—'}</strong></div>
    </article>`;
    const summary = document.createElement('div');
    summary.className = 'v053-compare-summary';
    summary.innerHTML = `${card(a, sa)}${card(b, sb)}`;
    root.prepend(summary);
  };

  if (!select.dataset.v053CompareReady) {
    select.dataset.v053CompareReady = '1';
    select.addEventListener('change', () => setTimeout(draw, 0));
  }
  draw();
}

async function enrichProfile(playerId) {
  const db = await loadDb();
  const c = career();
  const player = db?.players?.find(item => item.id === playerId);
  const body = document.getElementById('modalBody');
  if (!player || !body) return;

  const snapshot = playerSnapshot(player, c);
  const valueBox = body.querySelector('.flm-profile-value strong');
  if (valueBox) valueBox.textContent = compactMoney(snapshot.value);

  body.querySelector('.v053-profile-summary')?.remove();
  const summary = document.createElement('div');
  summary.className = 'v053-profile-summary';
  summary.innerHTML = `
    <div><small>LIVE VALUE</small><strong>${compactMoney(snapshot.value)}</strong></div>
    <div><small>WAGE</small><strong>${snapshot.wage ? `${compactMoney(snapshot.wage)}/wk` : '—'}</strong></div>
    <div><small>CONTRACT</small><strong>${esc(snapshot.contract)}</strong></div>
    <div><small>SEASON</small><strong>${snapshot.stats.apps} apps · ${snapshot.stats.goals} goals · ${snapshot.stats.assists} assists</strong></div>`;
  body.querySelector('.flm-profile-tabs')?.before(summary);

  const back = document.getElementById('modalActions')?.querySelector('button:first-child');
  if (back && document.querySelector('.career-app.is-open')) {
    const replacement = back.cloneNode(true);
    replacement.textContent = 'BACK TO CAREER';
    replacement.addEventListener('click', closeModalShell);
    back.replaceWith(replacement);
  }

  const compare = body.querySelector('[data-profile-compare]');
  if (compare && !compare.dataset.v053Ready) {
    compare.dataset.v053Ready = '1';
    compare.addEventListener('click', () => setTimeout(() => enrichCompare(playerId), 0));
  }

  body.querySelectorAll('[data-profile-tab]').forEach(tab => {
    if (tab.dataset.v053Ready) return;
    tab.dataset.v053Ready = '1';
    tab.addEventListener('click', () => {
      if (tab.dataset.profileTab === 'transfer') {
        setTimeout(() => {
          const panel = body.querySelector('[data-profile-panel]');
          const rows = [...(panel?.querySelectorAll('.flm-info-row') || [])];
          const valueRow = rows.find(row => row.querySelector('span')?.textContent === 'Estimated Value');
          if (valueRow) valueRow.querySelector('strong').textContent = compactMoney(snapshot.value);
          const listedRow = rows.find(row => row.querySelector('span')?.textContent === 'Transfer Listed');
          if (listedRow && c) listedRow.querySelector('strong').textContent = c.transfers?.listedPlayerIds?.includes(playerId) ? 'Yes' : 'No';
        }, 0);
      }
    });
  });
}

function wrapProfileApi() {
  const api = window.FLMPlayerProfile;
  if (!api || profileApiWrapped || api.__v053Wrapped) return false;
  const originalOpen = api.open.bind(api);
  api.open = async playerId => {
    await originalOpen(playerId);
    openModalShell();
    await enrichProfile(playerId);
  };
  api.__v053Wrapped = true;
  profileApiWrapped = true;
  return true;
}

async function openProfile(playerId) {
  if (!playerId) return;
  if (!wrapProfileApi()) {
    for (let tries = 0; tries < 20 && !wrapProfileApi(); tries += 1) await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (window.FLMPlayerProfile?.open) await window.FLMPlayerProfile.open(playerId);
}

async function resolvePlayerIdFromElement(target) {
  const direct = target.closest('[data-player-profile]');
  if (direct?.dataset.playerProfile) return direct.dataset.playerProfile;
  const squad = target.closest('[data-v044-row]');
  if (squad?.dataset.v044Row) return squad.dataset.v044Row;
  const market = target.closest('[data-v050-player]');
  if (market?.dataset.v050Player) return market.dataset.v050Player;
  const positioned = target.closest('[data-player-id]');
  if (positioned?.dataset.playerId) return positioned.dataset.playerId;

  const c = career();
  const db = await loadDb();
  const offerRow = target.closest('[data-v052-offer-row]');
  if (offerRow && c) return c.transfers?.incomingOffers?.find(item => item.id === offerRow.dataset.v052OfferRow)?.playerId || null;

  const name = target.textContent?.trim();
  if (!name || !db) return null;
  const exact = db.players.find(player => player.name === name && (!c || player.clubId === c.clubId));
  if (exact) return exact.id;
  const anyExact = db.players.find(player => player.name === name);
  if (anyExact) return anyExact.id;
  const suffix = db.players.find(player => name.endsWith(player.name));
  return suffix?.id || null;
}

function isPlayerNameHotspot(target) {
  if (!target.closest('strong')) return false;
  return Boolean(
    target.closest('[data-v044-row]') ||
    target.closest('[data-v050-player]') ||
    target.closest('.v050-own-row') ||
    target.closest('[data-v052-offer-row]') ||
    target.closest('.v052-world-row') ||
    target.closest('[data-player-id]')
  );
}

function refreshOffers() {
  setTimeout(() => {
    const offers = document.querySelector('[data-v050-tab="Offers"]');
    if (offers) { offers.click(); return; }
    document.querySelector('[data-v050-transfer-tab]')?.click();
    setTimeout(() => document.querySelector('[data-v050-tab="Offers"]')?.click(), 0);
  }, 0);
}

async function handleOfferAction(event, control) {
  event.preventDefault();
  event.stopImmediatePropagation();
  const c = career();
  const db = await loadDb();
  if (!c || !db) { toast('Transfer data is not available.', true); return; }

  const row = control.closest('[data-v052-offer-row]');
  const offerId = control.dataset.v052Accept || control.dataset.v052Reject || control.dataset.v052Counter || row?.dataset.v052OfferRow;
  const action = control.hasAttribute('data-v052-accept') ? 'accept' : control.hasAttribute('data-v052-reject') ? 'reject' : 'counter';
  const input = action === 'counter' ? row?.querySelector('[data-v052-counter-fee]') : null;

  row?.classList.add('v053-offer-busy');
  try {
    const result = respondToIncomingOffer(c, db, offerId, action, action === 'counter' ? Number(input?.value) : null);
    persist(c);
    if (action === 'accept') {
      const player = db.players.find(item => item.id === result.transaction?.playerId);
      toast(`${player?.name || 'Player'} sold for ${compactMoney(result.transaction?.fee)}. Recheck your squad.`);
    } else if (action === 'reject') {
      toast('Transfer offer rejected.');
    } else if (result.status === 'completed') {
      toast(`Counter accepted at ${compactMoney(result.transaction?.fee)}.`);
    } else {
      toast('The buying club rejected your counter-offer.', true);
    }
    refreshOffers();
  } catch (error) {
    row?.classList.remove('v053-offer-busy');
    toast(error.message || 'Transfer action failed.', true);
  }
}

document.addEventListener('click', event => {
  const offerControl = event.target.closest('[data-v052-accept],[data-v052-reject],[data-v052-counter]');
  if (offerControl) {
    handleOfferAction(event, offerControl);
    return;
  }

  const explicit = event.target.closest('[data-player-profile]');
  const hotspot = isPlayerNameHotspot(event.target);
  if (!explicit && !hotspot) return;
  if (event.target.closest('input,select,textarea') || event.target.closest('[data-v052-accept],[data-v052-reject],[data-v052-counter],[data-v050-list]')) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  resolvePlayerIdFromElement(event.target).then(openProfile);
}, true);

document.addEventListener('keydown', event => {
  if (!['Enter', ' '].includes(event.key)) return;
  const element = event.target.closest('[data-player-profile],[data-v044-row],[data-v050-player]');
  if (!element) return;
  event.preventDefault();
  resolvePlayerIdFromElement(element).then(openProfile);
});

injectStyles();
wrapProfileApi();
const wrapTimer = setInterval(() => { if (wrapProfileApi()) clearInterval(wrapTimer); }, 100);
setTimeout(() => clearInterval(wrapTimer), 5000);
