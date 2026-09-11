/* Football Lab Manager — transfer player navigation v1.2
 * Real user clicks open player profiles immediately.
 * Internal/synthetic transfer-list clicks remain available to the market UI
 * so detail synchronisation cannot fight with profile navigation.
 */
(() => {
  'use strict';

  const STYLE_ID = 'flm-transfer-player-navigation-v12-style';
  let frame = 0;

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
        box-shadow: inset 0 0 0 1px rgba(63, 174, 232, .10) !important;
        outline: none !important;
      }

      .v050-player-list .v050-player-row.is-selected {
        background: #0d3658 !important;
        border-left-color: #62c8ff !important;
        box-shadow: inset 0 0 0 1px rgba(98, 200, 255, .12) !important;
      }

      .v050-player-list .v050-player-row strong {
        color: #edf7fd !important;
        pointer-events: none;
      }

      .v050-player-list .v050-player-row small,
      .v050-player-list .v050-player-row .v050-pos,
      .v050-player-list .v050-player-row .v050-value {
        pointer-events: none;
      }

      .v050-player-list .v050-player-row:hover strong,
      .v050-player-list .v050-player-row:focus-visible strong {
        color: #72d0ff !important;
      }

      .v050-player-list .v050-player-row strong::after {
        content: '  ›';
        color: #54bce9;
        font-size: .92em;
        opacity: .82;
      }

      @media (max-width: 820px) {
        .v050-player-list .v050-player-row {
          min-height: 54px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function currentTransferPage() {
    return document.querySelector('.v050-transfer-page');
  }

  function cleanLegacyHooks(page) {
    if (!page) return;
    page.querySelectorAll('[data-v050-player][data-player-profile]').forEach(row => {
      delete row.dataset.playerProfile;
      row.dataset.flmTransferNav = '1.2';
      row.title = 'Open player profile';
    });

    page.querySelectorAll('[data-flm-transfer-profile-actions]').forEach(node => node.remove());
  }

  function enhance() {
    ensureStyles();
    cleanLegacyHooks(currentTransferPage());
  }

  function scheduleEnhance() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      enhance();
    });
  }

  function openProfile(playerId) {
    if (!playerId) return false;
    const profile = window.FLMPlayerProfile;
    if (!profile || typeof profile.open !== 'function') return false;
    profile.open(playerId);
    return true;
  }

  /*
   * Important: the transfer market internally calls row.click() when it needs
   * to synchronise its preview panel. Those generated clicks have isTrusted=false.
   * We ignore them. Only a real mouse/touch/keyboard click opens a profile.
   * Capture phase stops the row's normal select/preview handler before it can
   * compete with the profile transition.
   */
  document.addEventListener('click', event => {
    if (!event.isTrusted) return;

    const row = event.target.closest?.('.v050-transfer-page [data-v050-player]');
    if (!row) return;

    const playerId = row.dataset.v050Player;
    if (!playerId || !openProfile(playerId)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  new MutationObserver(scheduleEnhance).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.addEventListener('flm:career-rendered', scheduleEnhance);
  window.addEventListener('load', scheduleEnhance, { once: true });
  scheduleEnhance();
})();
