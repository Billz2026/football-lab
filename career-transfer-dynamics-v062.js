import { getNegotiation } from './transfers-v050.js?v=0.6.2';

let dbPromise = null;
let scheduled = false;
const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;
const loadDb = () => dbPromise ||= manager()?.loadDatabase?.();
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

function injectStyle() {
  if (document.getElementById('flm-v062-transfer-dynamics-style')) return;
  const style = document.createElement('style');
  style.id = 'flm-v062-transfer-dynamics-style';
  style.textContent = `.v062-interest-warning{margin-top:10px;padding:10px;border:1px solid rgba(255,125,95,.38);border-radius:8px;background:rgba(100,34,20,.16)}.v062-interest-warning strong{display:block;color:#ff9b7b;font-size:9px;letter-spacing:.08em}.v062-interest-warning p{margin:4px 0 0;color:#b9a59a;font-size:8px;line-height:1.45}.v062-interest-good{border-color:rgba(75,190,100,.3);background:rgba(35,105,48,.12)}.v062-interest-good strong{color:#8fe0a0}`;
  document.head.appendChild(style);
}

async function decorate() {
  injectStyle();
  const shell = document.querySelector('.v061-negotiation[data-v061-negotiation]');
  if (!shell) return;
  const playerId = shell.dataset.v061Negotiation;
  const c = career();
  const db = await loadDb();
  if (!c || !db || !playerId) return;
  const negotiation = getNegotiation(c, db, playerId);
  const interest = negotiation?.playerInterest;
  if (!interest) return;
  const signature = `${playerId}|${interest.score}|${negotiation.agent?.name || ''}|${negotiation.status}|${negotiation.messages?.length || 0}`;
  if (shell.dataset.v062Interest === signature) return;
  shell.dataset.v062Interest = signature;

  shell.querySelectorAll('[data-v062-interest-fact],.v062-interest-warning').forEach(node => node.remove());
  const facts = shell.querySelector('.v061-neg-facts');
  if (facts) {
    facts.insertAdjacentHTML('beforeend', `<div class="v061-neg-fact" data-v062-interest-fact><span>PLAYER INTEREST</span><strong>${esc(interest.label)} · ${interest.score}/100</strong></div><div class="v061-neg-fact" data-v062-interest-fact><span>AGENT</span><strong>${esc(negotiation.agent?.name || 'Representative')}</strong></div>`);
  }
  const stage = shell.querySelector('.v061-stage');
  if (stage) {
    const warning = document.createElement('div');
    warning.className = `v062-interest-warning${interest.score >= 58 ? ' v062-interest-good' : ''}`;
    const title = interest.score < 25 ? 'PLAYER NOT INTERESTED' : interest.score < 40 ? 'PLAYER NEEDS CONVINCING' : interest.score >= 76 ? 'PLAYER VERY INTERESTED' : 'PLAYER INTEREST';
    warning.innerHTML = `<strong>${esc(title)}</strong><p>${esc(interest.reason)}</p>`;
    stage.after(warning);
  }
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    decorate().catch(error => console.error('V0.6.2 transfer dynamics UI:', error));
  });
}

new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
document.addEventListener('click', event => {
  if (event.target.closest('[data-v061-submit-bid],[data-v061-accept-counter],[data-v061-submit-contract]')) setTimeout(schedule, 40);
});
schedule();
