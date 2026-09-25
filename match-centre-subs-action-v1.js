/* Football Lab Manager — Match Centre substitutions action v1.
 * V5 keeps the native MATCH PLAN substitution sheet, but the visible CM4 rail
 * only exposed Tactics. Restore a direct Subs action without duplicating any
 * substitution state or rules.
 */
(() => {
  'use strict';

  let queued = false;

  function enhanceShell(shell) {
    if (!shell || shell.querySelector('[data-cm4-subs]')) return;
    const tactics = shell.querySelector('[data-cm4-tactics]');
    const live = shell.closest('[data-live-match], .flm-live-match');
    if (!tactics || !live) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.cm4Subs = '1';
    button.textContent = 'Subs';
    button.setAttribute('aria-label', 'Substitutions');
    tactics.after(button);

    button.addEventListener('click', () => {
      const native = live.querySelector('[data-open-subs]') || live.querySelector('[data-open-tactics]');
      native?.click();
    });
  }

  function sync() {
    queued = false;
    document.querySelectorAll('[data-live-match] .cm4-shell, .flm-live-match .cm4-shell').forEach(enhanceShell);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('flm:live-state-v332', queue);
  queue();

  window.FLMMatchCentreSubsActionV1 = Object.freeze({ version: '1.0.0', refresh: queue });
})();
