/*
 * Prevent the LOAD GAME dialog from reopening once a career is already active.
 *
 * The persisted save is still available from the front-end menu.  Inside an
 * active career there is only one local career slot, so reopening the same
 * save dialog is redundant and can leave the player staring at a modal over
 * the career they have already loaded.
 */

function hasActiveCareer() {
  if (window.FLMManager?.activeCareer) return true;

  const careerApp = document.getElementById('careerApp');
  if (!careerApp) return false;

  const style = window.getComputedStyle(careerApp);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function isLoadGameModal() {
  const modal = document.getElementById('appModal');
  const title = document.getElementById('modalTitle');
  return Boolean(
    modal?.classList.contains('is-open') &&
    String(title?.textContent || '').trim().toUpperCase() === 'LOAD GAME'
  );
}

function dismissRedundantLoadModal() {
  if (!hasActiveCareer() || !isLoadGameModal()) return false;

  const modal = document.getElementById('appModal');
  const closeControl = modal?.querySelector('[data-close-modal]');

  if (closeControl instanceof HTMLElement) {
    closeControl.click();
  }

  // Defensive fallback in case a later shell replaces the normal close hook.
  if (modal?.classList.contains('is-open')) {
    modal.classList.remove('is-open', 'club-picker-modal');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  return true;
}

// Stop explicit LOAD GAME actions from reopening the current save.
document.addEventListener('click', event => {
  const trigger = event.target instanceof Element
    ? event.target.closest('[data-action="load-game"]')
    : null;

  if (!trigger || !hasActiveCareer()) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  dismissRedundantLoadModal();
}, true);

// Also cover automatic/re-rendered modal opens from legacy shell code.
const modal = document.getElementById('appModal');
if (modal) {
  const observer = new MutationObserver(() => {
    dismissRedundantLoadModal();
  });

  observer.observe(modal, {
    attributes: true,
    attributeFilter: ['class', 'aria-hidden'],
    childList: true,
    subtree: true
  });
}
