import {
  SQUAD_ROLES,
  ensurePlayerDynamics,
  getMoveWillingness,
  getPlayerDynamics,
  getRenewalDemand,
  happinessLabel,
  moraleLabel,
  processPlayerDynamics,
  setSquadRole,
  submitRenewalOffer
} from './player-dynamics-v062.js';
import { getPlayerContract } from './transfers-v050.js?v=0.6.2';

const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-v062-dynamics-style';
let dbPromise = null;
let decorateQueued = false;

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
  if (localStorage.getItem('flm-autosave') !== 'false') localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = localStorage.getItem('flm-autosave') === 'false' ? 'MANUAL SAVE' : 'SAVED';
}

function toast(message, error = false) {
  document.querySelector('.career-toast.v062-toast')?.remove();
  const element = document.createElement('div');
  element.className = `career-toast v062-toast${error ? ' is-error' : ''}`;
  element.textContent = message;
  document.body.appendChild(element);
  requestAnimationFrame(() => element.classList.add('is-visible'));
  setTimeout(() => element.remove(), 3200);
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.version-chip{font-size:0!important}.version-chip::after{content:'V0.6.2'!important;font-size:11px!important}.footer-build{font-size:0!important}.footer-build::after{content:'V0.6.2 · PLAYER DYNAMICS & CONTRACTS'!important;font-size:10px!important}
.v062-dynamics{margin:0 0 12px;padding:12px;border:1px solid rgba(239,185,63,.24);border-radius:10px;background:linear-gradient(135deg,rgba(25,19,9,.94),rgba(7,7,5,.97))}.v062-dynamics-head{display:flex;justify-content:space-between;gap:10px;align-items:start;margin-bottom:10px}.v062-dynamics-head small{display:block;color:#8b806f;font-size:7px;font-weight:900;letter-spacing:.11em}.v062-dynamics-head strong{display:block;margin-top:3px;color:#ffd66a;font-size:12px}.v062-request{padding:4px 7px;border:1px solid #784029;border-radius:6px;color:#ffad79;background:#1b0d08;font-size:7px;font-weight:900;letter-spacing:.06em}.v062-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.v062-grid>div{padding:9px;border:1px solid rgba(255,255,255,.06);border-radius:7px;background:#080705}.v062-grid span{display:block;color:#756e63;font-size:6px;letter-spacing:.08em}.v062-grid b{display:block;margin-top:3px;color:#eee7da;font-size:9px}.v062-reason{margin:9px 0 0;color:#958b7c;font-size:8px;line-height:1.5}.v062-actions{display:grid;grid-template-columns:minmax(120px,1fr) auto;gap:7px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)}.v062-actions select,.v062-actions input{min-height:35px;border:1px solid rgba(239,185,63,.22);border-radius:7px;background:#0b0906;color:#eee7da;padding:0 9px;font-size:9px}.v062-actions button{min-height:35px;border:1px solid #d6a63c;border-radius:7px;background:#d6a63c;color:#171005;padding:0 11px;font-size:8px;font-weight:950;cursor:pointer}.v062-contract{display:grid;grid-template-columns:1fr 105px 70px auto;gap:7px;grid-column:1/-1}.v062-contract-label{grid-column:1/-1;color:#83796b;font-size:7px}.v062-contract button{white-space:nowrap}.v062-happy{color:#9edb8f!important}.v062-unsettled{color:#ffb070!important}
@media(max-width:720px){.v062-grid{grid-template-columns:1fr 1fr}.v062-actions{grid-template-columns:1fr}.v062-actions button{width:100%}.v062-contract{grid-template-columns:1fr 72px}.v062-contract-label{grid-column:1/-1}.v062-contract button{grid-column:1/-1}}
`;
  document.head.appendChild(style);
}

function addRequestNews(c, request) {
  c.news ||= { schemaVersion: 1, items: [], generatedRounds: [] };
  c.news.items ||= [];
  const key = `transfer-request-${request.playerId}-${c.currentDate || c.roundIndex}`;
  if (c.news.items.some(item => item.key === key)) return;
  c.news.items.push({
    id: `news-${c.id}-${key}`,
    key,
    round: c.roundIndex || 0,
    period: 'AM',
    dateLabel: c.currentDate || '',
    category: 'Transfers',
    source: 'Player Liaison',
    title: `${request.playerName} asks to leave`,
    body: `${request.playerName} has submitted a transfer request. ${request.reason}. His happiness, role and future playing time now need managing.`,
    priority: 'important',
    order: 64000 + (c.roundIndex || 0),
    read: false,
    relatedPlayerId: request.playerId,
    relatedClubId: c.clubId
  });
}

async function processDynamicsBeforeContinue() {
  const c = career();
  const db = await loadDb();
  if (!c || !db) return;
  const result = processPlayerDynamics(c, db);
  if (!result.changed) return;
  result.requests.forEach(request => addRequestNews(c, request));
  persist(c);
  if (result.requests.length) toast(`${result.requests[0].playerName} has submitted a transfer request.`, true);
}

function queueDecorate() {
  if (decorateQueued) return;
  decorateQueued = true;
  queueMicrotask(async () => {
    decorateQueued = false;
    await decorateProfile();
  });
}

async function decorateProfile(force = false) {
  injectStyles();
  const modal = document.querySelector('#appModal.is-open');
  const body = modal?.querySelector('#modalBody');
  const profile = body?.querySelector('.flm-profile');
  const playerId = window.FLMPlayerProfile?.activePlayerId;
  const c = career();
  if (!profile || !playerId || !c) return;
  const db = await loadDb();
  const player = db?.players?.find(item => item.id === playerId);
  if (!player) return;
  ensurePlayerDynamics(c, db);
  const dynamics = getPlayerDynamics(c, db, playerId);
  const own = player.clubId === c.clubId;
  const willingness = own ? null : getMoveWillingness(c, db, playerId, c.clubId);
  const contract = (() => { try { return getPlayerContract(c, player); } catch { return null; } })();
  const demand = own ? getRenewalDemand(c, db, playerId) : null;
  const signature = [playerId, dynamics.squadRole, dynamics.happiness, dynamics.morale, dynamics.transferRequest?.active, contract?.weeklyWage, contract?.expiryYear, willingness?.score].join('|');
  let panel = body.querySelector('.v062-dynamics');
  if (!force && panel?.dataset.signature === signature) return;
  panel?.remove();

  panel = document.createElement('section');
  panel.className = 'v062-dynamics';
  panel.dataset.signature = signature;
  panel.dataset.v062Dynamics = playerId;
  const happyClass = dynamics.happiness >= 65 ? 'v062-happy' : dynamics.happiness < 40 ? 'v062-unsettled' : '';
  const interestText = own ? (dynamics.transferRequest?.active ? 'Wants to leave' : 'No request') : `${willingness.label} · ${willingness.score}/100`;
  const reason = own
    ? dynamics.transferRequest?.active ? dynamics.transferRequest.reason : `Expected starts: ${Math.round(dynamics.expectedStartShare * 100)}% for a ${dynamics.squadRole.toLowerCase()} player.`
    : willingness.reason;
  panel.innerHTML = `
    <div class="v062-dynamics-head"><div><small>PLAYER DYNAMICS · V0.6.2</small><strong>${own ? 'SQUAD RELATIONSHIP' : 'MOVE INTEREST'}</strong></div>${dynamics.transferRequest?.active ? '<span class="v062-request">TRANSFER REQUESTED</span>' : ''}</div>
    <div class="v062-grid">
      <div><span>SQUAD ROLE</span><b>${esc(dynamics.squadRole)}</b></div>
      <div><span>HAPPINESS</span><b class="${happyClass}">${esc(happinessLabel(dynamics.happiness))} · ${dynamics.happiness}</b></div>
      <div><span>MORALE</span><b>${esc(moraleLabel(dynamics.morale))} · ${dynamics.morale}</b></div>
      <div><span>AGENT</span><b>${esc(dynamics.agent.name)} · ${esc(dynamics.agent.style)}</b></div>
      <div><span>CONTRACT</span><b>${contract?.expiryYear ? `Jun ${contract.expiryYear}` : '—'}</b></div>
      <div><span>WAGE</span><b>${contract?.weeklyWage ? `${compactMoney(contract.weeklyWage)}/wk` : '—'}</b></div>
      <div><span>${own ? 'TRANSFER STATUS' : 'INTEREST IN YOUR CLUB'}</span><b>${esc(interestText)}</b></div>
      <div><span>AMBITION / LOYALTY</span><b>${dynamics.ambition} / ${dynamics.loyalty}</b></div>
    </div>
    <p class="v062-reason">${esc(reason)}</p>
    ${own ? `<div class="v062-actions">
      <select data-v062-role aria-label="Squad role">${SQUAD_ROLES.map(role => `<option value="${role}" ${role === dynamics.squadRole ? 'selected' : ''}>${role}</option>`).join('')}</select>
      <button type="button" data-v062-role-save>UPDATE ROLE</button>
      <div class="v062-contract"><div class="v062-contract-label">NEW CONTRACT · Agent expectation ${compactMoney(demand.weeklyWage)}/wk · ${demand.years} yrs</div><input type="number" min="1000" step="500" value="${demand.weeklyWage}" data-v062-wage aria-label="Weekly wage"><select data-v062-years aria-label="Contract years">${[2,3,4,5].map(year => `<option value="${year}" ${year === demand.years ? 'selected' : ''}>${year} yrs</option>`).join('')}</select><button type="button" data-v062-renew>OFFER CONTRACT</button></div>
    </div>` : ''}`;

  const summary = body.querySelector('.v053-profile-summary');
  if (summary) summary.after(panel);
  else profile.querySelector('.flm-profile-tabs')?.before(panel);

  panel.querySelector('[data-v062-role-save]')?.addEventListener('click', () => {
    try {
      const role = panel.querySelector('[data-v062-role]').value;
      const result = setSquadRole(c, db, playerId, role);
      persist(c);
      toast(result.changed ? `${player.name}'s squad role is now ${role}.` : 'Squad role unchanged.');
      decorateProfile(true);
    } catch (error) { toast(error.message || 'Could not change squad role.', true); }
  });

  panel.querySelector('[data-v062-renew]')?.addEventListener('click', () => {
    try {
      const wage = Number(panel.querySelector('[data-v062-wage]').value);
      const years = Number(panel.querySelector('[data-v062-years]').value);
      const result = submitRenewalOffer(c, db, playerId, wage, years);
      if (result.status === 'accepted') {
        persist(c);
        toast(`${player.name} signed a new ${result.years}-year contract.`);
        decorateProfile(true);
      } else if (result.status === 'countered') {
        panel.querySelector('[data-v062-wage]').value = result.counterWage;
        toast(`${result.demand.agent.name} countered at ${compactMoney(result.counterWage)}/wk.`, true);
      } else {
        toast(result.message || 'Contract offer rejected.', true);
      }
    } catch (error) { toast(error.message || 'Contract negotiation failed.', true); }
  });
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-v060-continue],[data-v054-advance]')) processDynamicsBeforeContinue();
  if (event.target.closest('[data-player-profile],.v044-name strong,.v050-player-row strong,.v050-own-row strong,.v052-world-row strong')) setTimeout(queueDecorate, 40);
}, true);

const observer = new MutationObserver(() => {
  if (document.querySelector('#appModal.is-open .flm-profile')) queueDecorate();
});
observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

injectStyles();
