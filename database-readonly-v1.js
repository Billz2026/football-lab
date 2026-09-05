// Football Database is an encyclopaedia, not a transfer/recruitment workflow.
// Career actions belong inside Transfers, Scouting, Squad and Contract screens.
(() => {
  'use strict';

  const ACTION_SELECTORS = [
    '[data-v061-profile-bid]',
    '[data-profile-shortlist]',
    '[data-profile-compare]',
    '[data-v061-submit-bid]',
    '[data-v061-accept-counter]',
    '[data-v061-submit-contract]'
  ].join(',');

  let databaseContext = false;
  let queued = false;

  function setContext(value) {
    databaseContext = Boolean(value);
    window.__flmDatabaseReadOnlyContext = databaseContext;
    document.body.classList.toggle('flm-database-readonly-context', databaseContext);
    queueSync();
  }

  function ensureStyle() {
    if (document.getElementById('flm-database-readonly-style')) return;
    const style = document.createElement('style');
    style.id = 'flm-database-readonly-style';
    style.textContent = `
      .flm-readonly-badge{display:inline-flex;align-items:center;gap:6px;margin:0 0 10px;padding:5px 8px;border:1px solid rgba(239,185,63,.28);border-radius:6px;background:#0c0a07;color:#d8b45d;font-size:7px;font-weight:950;letter-spacing:.12em}
      .flm-readonly-badge::before{content:'◉';font-size:7px}.flm-database-readonly-context .v061-negotiation{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function removeCareerActions(root) {
    root.querySelectorAll(ACTION_SELECTORS).forEach(element => element.remove());
    root.querySelectorAll('button').forEach(button => {
      const text = String(button.textContent || '').trim().toUpperCase();
      if (/MAKE TRANSFER OFFER|SUBMIT BID|ACCEPT .*COUNTER|SUBMIT CONTRACT OFFER|ADD TO SHORTLIST|SHORTLISTED|COMPARE PLAYER/.test(text)) button.remove();
    });
  }

  function sync() {
    ensureStyle();
    if (!databaseContext) return;
    const modal = document.querySelector('#appModal.is-open');
    if (!modal) return;
    removeCareerActions(modal);
    const profile = modal.querySelector('.flm-profile');
    if (profile && !profile.querySelector('.flm-readonly-badge')) {
      const badge = document.createElement('div');
      badge.className = 'flm-readonly-badge';
      badge.textContent = 'DATABASE VIEW · READ ONLY';
      const first = profile.querySelector('.flm-profile-head,.flm-profile-tabs') || profile.firstElementChild;
      if (first) first.before(badge);
      else profile.prepend(badge);
    }
  }

  function queueSync() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      sync();
    });
  }

  document.addEventListener('click', event => {
    const mainAction = event.target.closest('[data-action]');
    if (mainAction) {
      if (mainAction.dataset.action === 'database') setContext(true);
      else if (['new-game','quick-start','load-game','settings','hall-of-fame'].includes(mainAction.dataset.action)) setContext(false);
    }

    if (!databaseContext) return;
    const forbidden = event.target.closest(ACTION_SELECTORS);
    if (forbidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      forbidden.remove();
    }
  }, true);

  document.addEventListener('flm:career-opened', () => setContext(false));
  new MutationObserver(queueSync).observe(document.body, { childList: true, subtree: true });
  ensureStyle();
  window.__flmDatabaseReadOnlyContext = false;
})();
