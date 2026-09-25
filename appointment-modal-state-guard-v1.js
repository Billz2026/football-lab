// Football Lab Manager — appointment modal state guard v1.
//
// The appointment experience owns its own career state and the shared app modal.
// Under rapid onboarding / observer activity it is possible for the career state
// to be persisted as dismissed while the modal retains its appointment-only open
// classes. Enforce the state invariant at the shared DOM boundary: a dismissed
// appointment can never keep the blocking appointment modal open.

const MODAL_ID = 'appModal';
let queued = false;

function appointmentDismissed() {
  return Boolean(window.FLMManager?.activeCareer?.appointmentExperience?.dismissed);
}

function reconcileAppointmentModal() {
  queued = false;
  if (!appointmentDismissed()) return false;

  const modal = document.getElementById(MODAL_ID);
  if (!modal?.classList.contains('flm-appointment-open')) return false;

  modal.classList.remove('is-open', 'flm-appointment-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.querySelector('.modal-card')?.classList.remove('modal-wide');
  document.body.style.overflow = document.querySelector('.career-app.is-open') ? 'hidden' : '';
  window.dispatchEvent(new CustomEvent('flm:appointment-modal-reconciled'));
  return true;
}

function queueReconcile() {
  if (queued) return;
  queued = true;
  setTimeout(reconcileAppointmentModal, 0);
}

document.addEventListener('click', queueReconcile);
window.addEventListener('flm:appointment-complete', queueReconcile);
new MutationObserver(queueReconcile).observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'aria-hidden']
});

// Low-frequency fallback for state changes that do not mutate the DOM themselves.
setInterval(reconcileAppointmentModal, 250);
queueReconcile();

window.FLMAppointmentModalStateGuard = Object.freeze({
  version: 1,
  reconcile: reconcileAppointmentModal
});
