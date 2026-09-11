/*
 * Defensive appointment-modal cleanup.
 *
 * The appointment workflow can mark the experience dismissed before a competing
 * modal/render mutation finishes. In that race the career state is correct but
 * the full-screen appointment class can remain mounted and block the career.
 * Whenever dismissal is authoritative, force the appointment frame back to the
 * same closed DOM state used by career-appointment-media-v066.js.
 */

let queued = false;

function closeDismissedAppointmentModal() {
  const appointment = window.FLMManager?.activeCareer?.appointmentExperience;
  if (!appointment?.dismissed) return false;

  const modal = document.getElementById('appModal');
  if (!modal?.classList.contains('flm-appointment-open')) return false;

  modal.classList.remove('is-open', 'flm-appointment-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.querySelector('.modal-card')?.classList.remove('modal-wide');
  document.body.style.overflow = document.querySelector('.career-app.is-open') ? 'hidden' : '';
  return true;
}

function queueCleanup() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    closeDismissedAppointmentModal();
  });
}

const modal = document.getElementById('appModal');
if (modal) {
  new MutationObserver(queueCleanup).observe(modal, {
    attributes: true,
    attributeFilter: ['class', 'aria-hidden'],
    childList: true,
    subtree: true
  });
}

window.addEventListener('flm:career-rendered', queueCleanup);
window.addEventListener('storage', queueCleanup);
queueCleanup();
