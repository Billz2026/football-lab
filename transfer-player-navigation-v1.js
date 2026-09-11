/* Football Lab Manager — transfer player navigation v1
 * Faster player browsing from the transfer market without changing transfer logic.
 */
(() => {
  'use strict';

  const STYLE_ID = 'flm-transfer-player-navigation-v1-style';
  let frame = 0;

  function scheduleEnhance() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      enhance();
    });
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .v050-player-list .v050-player-row {
        min-height: 48px !important;
        padding-top: 7px !important;
        padding-bottom: 7px !important;
        border-left: 3px solid transparent !important;
        cursor: pointer !important;
        transition: background-color .12s ease, border-color .12s ease, box-shadow .12s ease !important;
      }

      .v050-player-list .v050-player-row:hover {
        background: #0a2946 !important;
        border-left-color: #3faee8 !important;
      }

      .v050-player-list .v050-player-row.is-selected {
        background: #0d3658 !important;
        border-left-color: #62c8ff !important;
        box-shadow: inset 0 0 0 1px rgba(98, 200, 255, .12) !important;
      }

      .v050-player-list .v050-player-row strong[data-flm-transfer-profile-link] {
        color: #edf7fd !important;
        cursor: pointer !important;
        text-decoration: underline;
        text-decoration-color: transparent;
        text-underline-offset: 3px;
        transition: color .12s ease, text-decoration-color .12s ease;
      }

      .v050-player-list .v050-player-row strong[data-flm-transfer-profile-link]::after {
        content: '  ↗';
        color: #54bce9;
        font-size: .86em;
        opacity: .75;
      }

      .v050-player-list .v050-player-row strong[data-flm-transfer-profile-link]:hover {
        color: #72d0ff !important;
        text-decoration-color: #72d0ff;
      }

      .flm-transfer-profile-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
      }

      .flm-transfer-profile-button {
        min-height: 34px;
        padding: 0 13px;
        border: 1px solid #4a9fd0;
        border-radius: 4px;
        background: #0b3152;
        color: #f4fbff;
        font: 800 9px/1 Inter, system-ui, sans-serif;
        letter-spacing: .055em;
        text-transform: uppercase;
        cursor: pointer;
        transition: background-color .12s ease, border-color .12s ease, transform .12s ease;
      }

      .flm-transfer-profile-button:hover,
      .flm-transfer-profile-button:focus-visible {
        border-color: #69c8f5;
        background: #12456f;
        outline: none;
      }

      .flm-transfer-profile-button:active {
        transform: translateY(1px);
      }

      .flm-transfer-profile-button:disabled {
        cursor: default;
        opacity: .45;
      }

      .flm-transfer-profile-hint {
        color: #6f93ae;
        font: 700 8px/1.2 Inter, system-ui, sans-serif;
        letter-spacing: .025em;
      }

      @media (max-width: 820px) {
        .v050-player-list .v050-player-row {
          min-height: 52px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function currentTransferPage() {
    return document.querySelector('.v050-transfer-page');
  }

  function selectedPlayerId(page = currentTransferPage()) {
    return page?.querySelector('[data-v050-player].is-selected')?.dataset.v050Player || null;
  }

  function openProfile(playerId) {
    if (!playerId) return false;
    const api = window.FLMPlayerProfile;
    if (!api?.open) return false;
    api.open(playerId);
    return true;
  }

  function enhanceRows(page) {
    page.querySelectorAll('[data-v050-player]').forEach(row => {
      const id = row.dataset.v050Player;
      if (!id) return;

      row.dataset.flmTransferNav = '1';
      row.title = 'Click row to select · Click player name or press Enter to open profile';

      const name = row.querySelector('strong');
      if (name) {
        name.dataset.flmTransferProfileLink = id;
        name.title = 'Open full player profile';
      }
    });
  }

  function enhanceDetail(page) {
    const detail = page.querySelector('[data-v050-detail]') || page.querySelector('.v050-detail');
    if (!detail) return;

    const head = detail.querySelector('.v050-detail-head');
    if (!head) return;

    let actions = head.querySelector('[data-flm-transfer-profile-actions]');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'flm-transfer-profile-actions';
      actions.dataset.flmTransferProfileActions = '1';
      actions.innerHTML = `
        <button type="button" class="flm-transfer-profile-button" data-flm-transfer-profile-open>VIEW PROFILE →</button>
        <span class="flm-transfer-profile-hint">Player name opens profile instantly</span>
      `;

      const primary = head.firstElementChild || head;
      primary.appendChild(actions);
    }

    const button = actions.querySelector('[data-flm-transfer-profile-open]');
    const id = selectedPlayerId(page);
    if (button) {
      button.dataset.playerId = id || '';
      button.disabled = !id;
    }
  }

  function enhance() {
    ensureStyles();
    const page = currentTransferPage();
    if (!page) return;
    enhanceRows(page);
    enhanceDetail(page);
  }

  function adjacentRow(row, direction) {
    const list = row.closest('[data-v050-player-list], .v050-player-list');
    if (!list) return null;
    const rows = [...list.querySelectorAll('[data-v050-player]')].filter(item => item.offsetParent !== null);
    const index = rows.indexOf(row);
    if (index < 0) return null;
    return rows[index + direction] || null;
  }

  document.addEventListener('click', event => {
    const directName = event.target.closest?.('[data-flm-transfer-profile-link]');
    if (directName) {
      const row = directName.closest('[data-v050-player]');
      const id = row?.dataset.v050Player || directName.dataset.flmTransferProfileLink;
      if (id && openProfile(id)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }

    const profileButton = event.target.closest?.('[data-flm-transfer-profile-open]');
    if (profileButton) {
      const id = profileButton.dataset.playerId || selectedPlayerId();
      if (id && openProfile(id)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }

    if (event.target.closest?.('[data-v050-player]')) scheduleEnhance();
  }, true);

  document.addEventListener('dblclick', event => {
    const row = event.target.closest?.('[data-v050-player]');
    if (!row) return;
    if (openProfile(row.dataset.v050Player)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  document.addEventListener('keydown', event => {
    const row = event.target.closest?.('[data-v050-player]');
    if (!row || !row.closest('.v050-transfer-page')) return;

    if (event.key === 'Enter') {
      if (openProfile(row.dataset.v050Player)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const next = adjacentRow(row, event.key === 'ArrowDown' ? 1 : -1);
    if (!next) return;

    event.preventDefault();
    next.focus({ preventScroll: true });
    next.scrollIntoView({ block: 'nearest' });
    next.click();
    scheduleEnhance();
  }, true);

  new MutationObserver(scheduleEnhance).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('flm:career-rendered', scheduleEnhance);
  window.addEventListener('load', scheduleEnhance, { once: true });
  scheduleEnhance();
})();
