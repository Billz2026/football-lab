// Football Lab Manager — shared modal ownership guard v1.
// The modern player profile renders inside the career content area. Legacy
// interaction code can still reopen the generic app modal afterwards, leaving
// the default MANAGEMENT FOUNDATION shell over a valid profile. Close only that
// empty placeholder state; real transfer/settings/database modals remain intact.

let queued = false;

function parts() {
  const modal = document.getElementById('appModal');
  return {
    modal,
    card: modal?.querySelector('.modal-card') || null,
    title: document.getElementById('modalTitle'),
    copy: document.getElementById('modalCopy'),
    body: document.getElementById('modalBody'),
    actions: document.getElementById('modalActions')
  };
}

function integratedProfileVisible() {
  return Boolean(document.querySelector('.career-app.is-open .career-content > .flm-instant-profile'));
}

function empty(node) {
  return !node || (!node.children.length && !node.textContent?.trim());
}

function isPlaceholderModal(p) {
  if (!p.modal?.classList.contains('is-open')) return false;
  if (p.modal.classList.contains('flm-appointment-open') || p.modal.classList.contains('flm-appointment-intro-open')) return false;
  if (p.title?.textContent?.trim() !== 'MANAGEMENT FOUNDATION') return false;
  return empty(p.copy) && empty(p.body) && empty(p.actions);
}

function closePlaceholder() {
  queued = false;
  const p = parts();
  if (!integratedProfileVisible() || !isPlaceholderModal(p)) return false;

  p.modal.classList.remove('is-open', 'club-picker-modal', 'flm-profile-v2-open');
  p.modal.setAttribute('aria-hidden', 'true');
  p.card?.classList.remove('modal-wide');
  p.modal.style.removeProperty('z-index');
  document.body.style.overflow = document.querySelector('.career-app.is-open') ? 'hidden' : '';
  window.dispatchEvent(new CustomEvent('flm:shared-modal-placeholder-closed'));
  return true;
}

function queue() {
  if (queued) return;
  queued = true;
  queueMicrotask(closePlaceholder);
  requestAnimationFrame(closePlaceholder);
}

const modal = document.getElementById('appModal');
if (modal) {
  new MutationObserver(queue).observe(modal, {
    attributes: true,
    attributeFilter: ['class', 'aria-hidden'],
    childList: true,
    subtree: true,
    characterData: true
  });
}

new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
document.addEventListener('click', queue, true);
window.addEventListener('flm:appointment-complete', queue);
setInterval(closePlaceholder, 250);
queue();

window.FLMSharedModalOwnershipV1 = Object.freeze({ version: 1, reconcile: closePlaceholder });
