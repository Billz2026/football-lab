export const MATCHDAY_SUBSTITUTION_GUARD_VERSION = '0.7.1';

const STYLE_ID = 'flm-matchday-substitution-guard-v071';
let queued = false;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Permanent reachability guard: the starting XI must never clip its last row. */
    @media (min-width:560px) and (max-width:900px) {
      .flm-live-match[data-cm4="1"] .v2-sub-dialog[data-cm46-dialog="subs"] .v2-sub-column:first-child .v2-sub-list {
        overflow-x:hidden!important;
        overflow-y:auto!important;
        overscroll-behavior:contain!important;
        -webkit-overflow-scrolling:touch;
        scrollbar-gutter:stable;
      }
    }

    /* Fold/tablet width where the historical 300px list cap hid player 11 (normally ST). */
    @media (min-width:560px) and (max-width:760px) {
      .flm-live-match[data-cm4="1"] .v2-sub-dialog[data-cm46-dialog="subs"] .v2-sub-column:first-child .v2-sub-list {
        grid-template-rows:repeat(11,minmax(27px,1fr))!important;
        max-height:308px!important;
      }
      .flm-live-match[data-cm4="1"] .v2-sub-dialog[data-cm46-dialog="subs"] .v2-sub-column:first-child .v2-sub-player {
        min-height:27px!important;
        padding:1px 5px!important;
      }
    }
  `;
  document.head.appendChild(style);
}

function guardList(list) {
  if (!list) return;
  list.dataset.subReachabilityGuard = MATCHDAY_SUBSTITUTION_GUARD_VERSION;

  // CSS should make every row reachable. This inline fallback deliberately wins
  // over future !important regressions if another presentation layer clips the list.
  if (list.scrollHeight > list.clientHeight + 2) {
    list.style.setProperty('overflow-y', 'auto', 'important');
    list.style.setProperty('overflow-x', 'hidden', 'important');
    list.style.setProperty('overscroll-behavior', 'contain', 'important');
  }
}

function sync() {
  queued = false;
  ensureStyles();
  document
    .querySelectorAll('.flm-live-match[data-cm4="1"] .v2-sub-dialog[data-cm46-dialog="subs"] .v2-sub-column:first-child .v2-sub-list')
    .forEach(guardList);
}

function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(sync);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  ensureStyles();
  queue();
  new MutationObserver(queue).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'hidden', 'aria-hidden', 'data-cm46-dialog']
  });
  window.addEventListener('resize', queue, { passive: true });
  window.FLMMatchdaySubstitutionGuard = Object.freeze({
    version: MATCHDAY_SUBSTITUTION_GUARD_VERSION,
    refresh: queue
  });
}
