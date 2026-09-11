/* Football Lab Manager — transfer player navigation v1.1
 * Transfer rows use the exact same profile-opening hook as the Squad screen.
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
        min-height: 50px !important;
        padding-top: 8px !important;
        padding-bottom: 8px !important;
        border-left: 3px solid transparent !important;
        cursor: pointer !important;
        transition: background-color .12s ease, border-color .12s ease, box-shadow .12s ease !important;
      }
      .v050-player-list .v050-player-row:hover,
      .v050-player-list .v050-player-row:focus-visible {
        background: #0a2946 !important;
        border-left-color: #3faee8 !important;
        outline: none !important;
      }
      .v050-player-list .v050-player-row.is-selected {
        background: #0d3658 !important;
        border-left-color: #62c8ff !important;
        box-shadow: inset 0 0 0 1px rgba(98, 200, 255, .12) !important;
      }
      .v050-player-list .v050-player-row strong {
        color: #edf7fd !important;
      }
      .v050-player-list .v050-player-row:hover strong,
      .v050-player-list .v050-player-row:focus-visible strong {
        color: #72d0ff !important;
      }
      .v050-player-list .v050-player-row strong::after {
        content: '  ›';
        color: #54bce9;
        font-size: .92em;
        opacity: .78;
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
      }
      .flm-transfer-profile-button:hover,
      .flm-transfer-profile-button:focus-visible {
        border-color: #69c8f5;
        background: #12456f;
        outline: none;
      }
      .flm-transfer-profile-button:disabled {
        cursor: default;
        opacity: .45;
      }
      .flm-transfer-profile-hint {
        color: #6f93ae;
        font: 700 8px/1.2 Inter, system-ui, sans-serif;
      }
      @media (max-width: 820px) {
        .v050-player-list .v050-player-row { min-height: 54px !important; }
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

  function enhanceRows(page) {
    page.querySelectorAll('[data-v050-player]').forEach(row => {
      const id = row.dataset.v050Player;
      if (!id) return;
      row.dataset.playerProfile = id;
      row.dataset.flmTransferNav = '1';
      row.title = 'Open player profile';
      row.setAttribute('aria-label', `${row.querySelector('strong')?.textContent?.trim() || 'Player'} — open profile`);
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
        <button type="button" class="flm-transfer-profile-button">VIEW PROFILE →</button>
        <span class="flm-transfer-profile-hint">Click any player row to open instantly</span>
      `;
      (head.firstElementChild || head).appendChild(actions);
    }

    const button = actions.querySelector('.flm-transfer-profile-button');
    const id = selectedPlayerId(page);
    if (button) {
      if (id) button.dataset.playerProfile = id;
      else delete button.dataset.playerProfile;
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

  new MutationObserver(scheduleEnhance).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('flm:career-rendered', scheduleEnhance);
  window.addEventListener('load', scheduleEnhance, { once: true });
  scheduleEnhance();
})();
