import {
  acceptSellerCounter,
  estimatePlayerValue,
  getNegotiation,
  getPlayerContract,
  getTransferBudget,
  getTransferStance,
  getTransferWindowStatus,
  submitContractOffer,
  submitTransferOffer
} from './transfers-v050.js?v=0.5.2';

const STYLE_ID = 'flm-v061-transfer-negotiation-style';
const SAVE_KEY = 'flm-career-save';
let dbPromise = null;
let scheduled = false;

const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;
const loadDb = () => dbPromise ||= manager()?.loadDatabase?.();
const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function compactMoney(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1000000) return `£${(n / 1000000).toFixed(n >= 100000000 ? 0 : 1)}m`;
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
  document.querySelector('.career-toast.v061-toast')?.remove();
  const element = document.createElement('div');
  element.className = `career-toast v061-toast${error ? ' is-error' : ''}`;
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
    .v061-profile-bid{border-color:#d6aa45!important;background:linear-gradient(180deg,#e6bd5d,#b98724)!important;color:#090704!important;font-weight:900!important}
    .v061-profile-bid[disabled]{opacity:.5;cursor:not-allowed!important}
    .v061-negotiation{position:absolute;inset:12px;z-index:40;display:grid;grid-template-rows:auto 1fr;background:#080705;border:1px solid rgba(239,185,63,.5);border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.72);overflow:hidden;color:#f2eadc}
    .v061-neg-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:16px 18px;border-bottom:1px solid rgba(239,185,63,.18);background:linear-gradient(180deg,#171208,#0a0805)}
    .v061-neg-head small{display:block;color:#b99a58;font-size:8px;letter-spacing:.14em}.v061-neg-head h3{margin:4px 0 0;font-size:20px}.v061-neg-close{border:1px solid rgba(239,185,63,.3);background:#0b0906;color:#e8d6aa;border-radius:8px;padding:8px 10px;cursor:pointer}
    .v061-neg-body{overflow:auto;padding:16px 18px 22px}.v061-neg-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:14px}
    .v061-neg-card{border:1px solid rgba(239,185,63,.17);background:#0c0a07;border-radius:11px;padding:14px}.v061-neg-card h4{margin:0 0 10px;color:#ffd66a;font-size:10px;letter-spacing:.08em}
    .v061-neg-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.v061-neg-fact{padding:9px;background:#080705;border:1px solid rgba(255,255,255,.05);border-radius:7px}.v061-neg-fact span{display:block;color:#81786b;font-size:7px;letter-spacing:.08em}.v061-neg-fact strong{display:block;margin-top:3px;font-size:10px}
    .v061-stance{display:inline-flex;margin-top:10px;padding:6px 9px;border-radius:999px;font-size:8px;font-weight:900;letter-spacing:.08em;border:1px solid rgba(239,185,63,.25)}.v061-stance.resistant{color:#ff786f;border-color:rgba(255,80,70,.35)}.v061-stance.reluctant{color:#ffbd60}.v061-stance.available,.v061-stance.open{color:#7ee38b}
    .v061-stage{margin-top:12px;padding:12px;border-radius:9px;background:#100d08;border-left:3px solid #d6aa45}.v061-stage strong{display:block;color:#ffd66a;font-size:11px}.v061-stage p{margin:5px 0 0;color:#a99f90;font-size:9px;line-height:1.5}
    .v061-field{display:grid;gap:5px;margin:10px 0}.v061-field label{font-size:8px;color:#a69677;letter-spacing:.08em}.v061-field input,.v061-field select{width:100%;box-sizing:border-box;border:1px solid rgba(239,185,63,.24);background:#070604;color:#f4ead8;border-radius:8px;padding:10px;font:inherit}
    .v061-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.v061-action{border:1px solid rgba(239,185,63,.3);background:#151007;color:#f2dfb3;border-radius:8px;padding:9px 12px;font-size:8px;font-weight:900;letter-spacing:.07em;cursor:pointer}.v061-action.primary{background:#d6aa45;color:#090704}.v061-action:disabled{opacity:.45;cursor:not-allowed}
    .v061-log{display:grid;gap:6px;max-height:220px;overflow:auto}.v061-log div{padding:8px;border-radius:7px;background:#080705;color:#a99e8b;font-size:8px;line-height:1.45;border:1px solid rgba(255,255,255,.04)}
    .v061-complete{padding:18px;text-align:center;border:1px solid rgba(81,191,108,.35);background:rgba(45,126,65,.08);border-radius:10px}.v061-complete strong{display:block;color:#83e29b;font-size:15px}.v061-complete p{color:#a7a095;font-size:9px}
    @media(max-width:720px){.v061-negotiation{inset:0;border-radius:0;border-left:0;border-right:0}.v061-neg-grid{grid-template-columns:1fr}.v061-neg-head{padding:13px}.v061-neg-body{padding:12px}.v061-neg-facts{grid-template-columns:1fr 1fr}.v061-action{min-height:42px;flex:1}.v061-profile-bid{min-height:40px}}
  `;
  document.head.appendChild(style);
}

async function playerContext(playerId) {
  const c = career();
  const db = await loadDb();
  const player = db?.players?.find(item => item.id === playerId);
  if (!c || !db || !player) return null;
  const club = db.clubs.find(item => item.id === player.clubId);
  return { c, db, player, club };
}

function closeNegotiation() {
  document.querySelector('.v061-negotiation')?.remove();
}

function stageCopy(negotiation) {
  if (negotiation?.status === 'fee-accepted') return ['FEE AGREED', 'The selling club has accepted your bid. Negotiate the player’s contract now.'];
  if (negotiation?.status === 'contract-countered') return ['AGENT COUNTER', 'The player’s representatives want improved personal terms.'];
  if (negotiation?.status === 'countered') return ['SELLER COUNTER-OFFER', `The club want ${compactMoney(negotiation.counterFee)}.`];
  if (negotiation?.status === 'rejected') return ['BID REJECTED', 'You can return with an improved bid while the club is still willing to listen.'];
  if (negotiation?.status === 'walked-away') return ['TALKS ENDED', 'The selling club have ended this negotiation after too many unsuccessful bids.'];
  if (negotiation?.status === 'completed') return ['TRANSFER COMPLETE', 'The player has joined your club.'];
  return ['OPEN NEGOTIATION', 'Submit a formal transfer bid. The selling club will respond immediately to the proposal.'];
}

async function renderNegotiation(playerId) {
  const context = await playerContext(playerId);
  if (!context) return;
  const { c, db, player, club } = context;
  if (player.clubId === c.clubId) {
    toast(`${player.name} is already at your club.`);
    return;
  }

  const modalCard = document.querySelector('#appModal .modal-card');
  if (!modalCard) return;
  modalCard.style.position = 'relative';
  closeNegotiation();

  const windowStatus = getTransferWindowStatus(c);
  const stance = getTransferStance(player, db, c, c.clubId);
  const negotiation = getNegotiation(c, db, playerId);
  const budget = getTransferBudget(c);
  const contract = getPlayerContract(c, player);
  const [stageTitle, stageDescription] = stageCopy(negotiation);
  const completed = negotiation?.status === 'completed' || player.clubId === c.clubId;
  const contractStage = ['fee-accepted', 'contract-countered'].includes(negotiation?.status);
  const bidDefault = negotiation?.counterFee || negotiation?.lastOffer || Math.min(budget.transferBudget, Math.max(stance.value, stance.minimumAcceptable * .82));

  const shell = document.createElement('section');
  shell.className = 'v061-negotiation';
  shell.dataset.v061Negotiation = playerId;
  shell.innerHTML = `
    <header class="v061-neg-head">
      <div><small>LIVE TRANSFER NEGOTIATION</small><h3>${esc(player.name)}</h3></div>
      <button type="button" class="v061-neg-close" data-v061-close>✕</button>
    </header>
    <div class="v061-neg-body">
      <div class="v061-neg-grid">
        <div>
          <section class="v061-neg-card">
            <h4>DEAL OVERVIEW</h4>
            <div class="v061-neg-facts">
              <div class="v061-neg-fact"><span>CURRENT CLUB</span><strong>${esc(club?.name || '—')}</strong></div>
              <div class="v061-neg-fact"><span>ESTIMATED VALUE</span><strong>${compactMoney(stance.value)}</strong></div>
              <div class="v061-neg-fact"><span>YOUR BUDGET</span><strong>${compactMoney(budget.transferBudget)}</strong></div>
              <div class="v061-neg-fact"><span>CONTRACT</span><strong>${contract?.expiryYear ? `Until Jun ${contract.expiryYear}` : '—'}</strong></div>
            </div>
            <span class="v061-stance ${esc(stance.tone)}">${esc(stance.label.toUpperCase())}</span>
            <div class="v061-stage"><strong>${esc(stageTitle)}</strong><p>${esc(stageDescription)}</p></div>
          </section>

          <section class="v061-neg-card" style="margin-top:10px">
            ${completed ? `
              <div class="v061-complete"><strong>DEAL COMPLETED</strong><p>${esc(player.name)} is now registered to your squad. The transfer fee and wages have been applied to the career finances.</p></div>` : contractStage ? `
              <h4>PERSONAL TERMS</h4>
              <div class="v061-neg-facts">
                <div class="v061-neg-fact"><span>AGREED FEE</span><strong>${compactMoney(negotiation.lastOffer)}</strong></div>
                <div class="v061-neg-fact"><span>WAGE DEMAND</span><strong>${compactMoney(negotiation.wageDemand)}/wk</strong></div>
              </div>
              <div class="v061-field"><label>WEEKLY WAGE</label><input data-v061-wage type="number" min="1000" step="500" value="${Math.max(1000, negotiation.wageOffer || negotiation.wageDemand)}"></div>
              <div class="v061-field"><label>CONTRACT LENGTH</label><select data-v061-years>${[2,3,4,5].map(year => `<option value="${year}" ${year === (negotiation.contractYears || 4) ? 'selected' : ''}>${year} years</option>`).join('')}</select></div>
              <div class="v061-actions"><button type="button" class="v061-action primary" data-v061-submit-contract>SUBMIT CONTRACT OFFER</button></div>` : `
              <h4>CLUB NEGOTIATION</h4>
              <div class="v061-field"><label>YOUR TRANSFER BID</label><input data-v061-fee type="number" min="250000" step="250000" value="${Math.round(bidDefault)}"></div>
              <div class="v061-actions">
                <button type="button" class="v061-action primary" data-v061-submit-bid ${!windowStatus.open || negotiation?.status === 'walked-away' ? 'disabled' : ''}>SUBMIT BID</button>
                ${negotiation?.counterFee ? `<button type="button" class="v061-action" data-v061-accept-counter ${negotiation.counterFee > budget.transferBudget ? 'disabled' : ''}>ACCEPT ${compactMoney(negotiation.counterFee)}</button>` : ''}
              </div>
              ${!windowStatus.open ? `<p style="color:#d98676;font-size:9px">The transfer window is currently closed.</p>` : ''}`}
          </section>
        </div>

        <aside class="v061-neg-card">
          <h4>NEGOTIATION HISTORY</h4>
          <div class="v061-log">${(negotiation?.messages || []).length ? [...negotiation.messages].reverse().map(message => `<div>${esc(message)}</div>`).join('') : '<div>No formal offers have been made yet.</div>'}</div>
          <div class="v061-stage" style="margin-top:12px"><strong>SELLER POSITION</strong><p>${stance.tone === 'resistant' ? 'This is a cornerstone player. The club has no need to sell and only an exceptional bid is likely to open the door.' : stance.tone === 'reluctant' ? 'The player is important to the club. Expect a premium and firm negotiation.' : 'The club is prepared to discuss a deal at a sensible market price.'}</p></div>
        </aside>
      </div>
    </div>`;
  modalCard.appendChild(shell);
}

async function submitBid(shell) {
  const context = await playerContext(shell.dataset.v061Negotiation);
  if (!context) return;
  const input = shell.querySelector('[data-v061-fee]');
  try {
    const result = submitTransferOffer(context.c, context.db, context.player.id, Number(input?.value));
    persist(context.c);
    if (result.status === 'accepted') toast('Transfer fee accepted — negotiate personal terms.');
    else if (result.status === 'countered') toast(`Seller countered at ${compactMoney(result.negotiation.counterFee)}.`);
    else if (result.status === 'walked-away') toast('The selling club ended negotiations.', true);
    else toast('Transfer bid rejected.', true);
    await renderNegotiation(context.player.id);
  } catch (error) {
    toast(error.message || 'The bid could not be submitted.', true);
  }
}

async function acceptCounter(shell) {
  const context = await playerContext(shell.dataset.v061Negotiation);
  if (!context) return;
  try {
    acceptSellerCounter(context.c, context.db, context.player.id);
    persist(context.c);
    toast('Fee agreed — personal terms are next.');
    await renderNegotiation(context.player.id);
  } catch (error) {
    toast(error.message || 'The counter-offer could not be accepted.', true);
  }
}

async function submitContract(shell) {
  const context = await playerContext(shell.dataset.v061Negotiation);
  if (!context) return;
  try {
    const wage = Number(shell.querySelector('[data-v061-wage]')?.value);
    const years = Number(shell.querySelector('[data-v061-years]')?.value);
    const result = submitContractOffer(context.c, context.db, context.player.id, wage, years);
    persist(context.c);
    if (result.status === 'completed') {
      toast(`${context.player.name} has signed for ${compactMoney(result.transaction?.fee)}.`);
    } else if (result.status === 'countered') {
      toast(`Agent countered at ${compactMoney(result.wageDemand)}/wk.`);
    }
    await renderNegotiation(context.player.id);
  } catch (error) {
    toast(error.message || 'Personal terms could not be agreed.', true);
  }
}

async function injectProfileAction() {
  const profile = document.querySelector('#appModal.is-open .flm-profile');
  const actions = profile?.querySelector('.flm-profile-actions');
  const c = career();
  const playerId = window.FLMPlayerProfile?.activePlayerId;
  if (!profile || !actions || !c || !playerId || actions.querySelector('[data-v061-profile-bid]')) return;
  const db = await loadDb();
  const player = db?.players?.find(item => item.id === playerId);
  if (!player || player.clubId === c.clubId) return;
  const windowStatus = getTransferWindowStatus(c);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'flm-profile-action v061-profile-bid';
  button.dataset.v061ProfileBid = playerId;
  button.textContent = windowStatus.open ? 'MAKE TRANSFER OFFER' : 'TRANSFER WINDOW CLOSED';
  button.disabled = !windowStatus.open;
  actions.appendChild(button);
}

function scheduleInject() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    injectProfileAction();
  });
}

document.addEventListener('click', event => {
  const bid = event.target.closest('[data-v061-profile-bid]');
  if (bid) {
    event.preventDefault();
    event.stopPropagation();
    renderNegotiation(bid.dataset.v061ProfileBid);
    return;
  }
  const shell = event.target.closest('[data-v061-negotiation]');
  if (!shell) return;
  if (event.target.closest('[data-v061-close]')) { closeNegotiation(); return; }
  if (event.target.closest('[data-v061-submit-bid]')) { submitBid(shell); return; }
  if (event.target.closest('[data-v061-accept-counter]')) { acceptCounter(shell); return; }
  if (event.target.closest('[data-v061-submit-contract]')) { submitContract(shell); }
}, true);

injectStyles();
const observer = new MutationObserver(scheduleInject);
observer.observe(document.body, { childList: true, subtree: true });
scheduleInject();
