/* Football Lab Manager — transfer interest UI v1 */
import { getPlayerInterest } from './transfers-v050.js?v=0.6.3';
import { effectiveClubReputation, reputationLabel } from './club-reputation-v1.js?v=1.0.1';

(() => {
  'use strict';

  const STYLE_ID = 'flm-transfer-interest-ui-v1-style';
  let dbPromise = null;
  let queued = false;

  const manager = () => window.FLMManager;
  const career = () => manager()?.activeCareer || null;

  function database() {
    if (!dbPromise && manager()?.loadDatabase) dbPromise = Promise.resolve(manager().loadDatabase()).catch(() => null);
    return dbPromise || Promise.resolve(null);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .flm-interest-card{display:grid;grid-template-columns:minmax(130px,.32fr) minmax(0,1fr);gap:12px;align-items:center;margin-top:10px;padding:10px 12px;border:1px solid rgba(71,183,243,.3);border-left:3px solid #47b7f3;border-radius:6px;background:rgba(6,29,52,.78)}
      .flm-interest-card small{display:block;color:#7898b2;font-size:7px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.flm-interest-card strong{display:block;margin-top:3px;color:#dfeaf2;font-size:11px;font-weight:950}.flm-interest-card p{margin:0;color:#91aabe;font-size:9px;line-height:1.45}
      .flm-interest-card.is-interested{border-left-color:#55dc7c}.flm-interest-card.is-interested strong{color:#55dc7c}.flm-interest-card.is-open-to-move strong{color:#7ac8f5}.flm-interest-card.is-unlikely{border-left-color:#e7b84b}.flm-interest-card.is-unlikely strong{color:#e7b84b}.flm-interest-card.is-not-interested{border-color:rgba(255,107,107,.35);border-left-color:#ff6b6b;background:rgba(75,18,26,.18)}.flm-interest-card.is-not-interested strong{color:#ff858d}
      .flm-interest-block{margin-top:10px;padding:13px;border:1px solid rgba(255,107,107,.34);border-radius:7px;background:linear-gradient(180deg,rgba(78,19,28,.26),rgba(35,12,19,.18))}.flm-interest-block h4{margin:0;color:#ff858d;font-size:10px;font-weight:950;letter-spacing:.1em}.flm-interest-block p{margin:7px 0 0;color:#d5aeb4;font-size:9px;line-height:1.5}.flm-interest-block button{margin-top:10px;min-height:35px;padding:0 12px;border:1px solid #6f3941;border-radius:5px;background:#25151a;color:#a98e93;font-size:8px;font-weight:950;cursor:not-allowed}
      @media(max-width:760px){.flm-interest-card{grid-template-columns:1fr;gap:5px}}
    `;
    document.head.appendChild(style);
  }

  async function enhance() {
    queued = false;
    ensureStyles();
    const c = career();
    const detail = document.querySelector('.v050-transfer-page [data-v050-detail]');
    const selected = document.querySelector('.v050-transfer-page [data-v050-player].is-selected');
    if (!c || !detail || !selected) return;
    const db = await database();
    if (!db || !detail.isConnected) return;
    const player = db.players?.find(item => item.id === selected.dataset.v050Player);
    if (!player) return;
    const interest = getPlayerInterest(player, db, c, c.clubId);
    if (!interest) return;

    const signature = `${player.id}:${interest.key}:${interest.clubReputation}:${interest.requiredReputation}`;
    const existing = detail.querySelector('[data-flm-interest-card]');
    if (!existing || existing.dataset.flmInterestSignature !== signature) {
      existing?.remove();
      const card = document.createElement('div');
      card.className = `flm-interest-card is-${interest.key}`;
      card.dataset.flmInterestCard = '1';
      card.dataset.flmInterestSignature = signature;
      const stature = reputationLabel(effectiveClubReputation(c, db, c.clubId));
      card.innerHTML = `<div><small>PLAYER INTEREST</small><strong>${interest.label.toUpperCase()}</strong></div><p>${interest.message} <span style="opacity:.72">Club stature: ${stature}.</span></p>`;
      const facts = detail.querySelector('.v050-facts');
      if (facts) facts.after(card);
      else detail.prepend(card);
    }

    const offerBox = detail.querySelector('.v050-offer-box');
    if (!interest.canApproach && offerBox && !offerBox.dataset.flmInterestBlocked) {
      const blocked = document.createElement('div');
      blocked.className = 'flm-interest-block';
      blocked.dataset.flmInterestBlocked = '1';
      blocked.innerHTML = `<h4>PLAYER NOT INTERESTED</h4><p>${interest.message}</p><button type="button" disabled>APPROACH UNAVAILABLE</button>`;
      offerBox.replaceWith(blocked);
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => enhance().catch(() => { queued = false; }));
  }

  ensureStyles();
  new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-v050-player],[data-v050-tab],[data-v050-transfer-tab]')) queue();
  }, true);
  ['flm:career-opened','flm:career-created','flm:career-data-refresh','flm:career-sync-complete'].forEach(name => document.addEventListener(name, queue));
  queue();
})();
