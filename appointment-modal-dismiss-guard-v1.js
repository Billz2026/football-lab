/*
 * Defensive appointment-modal cleanup.
 *
 * The appointment workflow shares #appModal with player profiles and other
 * manager surfaces. A dismissed appointment can leave stale appointment-owned
 * classes behind, but cleanup must never close unrelated content that has since
 * been rendered into the shared modal.
 */

let queued = false;

function hasAppointmentContent(modal) {
  return Boolean(modal?.querySelector('.flm-appointment[data-appointment-v066]'));
}

function closeDismissedAppointmentModal() {
  const appointment = window.FLMManager?.activeCareer?.appointmentExperience;
  if (!appointment?.dismissed) return false;

  const modal = document.getElementById('appModal');
  if (!modal?.classList.contains('flm-appointment-open')) return false;

  // #appModal is shared. If another surface (for example a player profile) has
  // replaced the appointment content, only discard the stale ownership marker.
  // Preserve the modal's visible/open state for the current surface.
  if (!hasAppointmentContent(modal)) {
    modal.classList.remove('flm-appointment-open');
    return true;
  }

  // The modal still contains the dismissed appointment itself, so it is safe to
  // close it fully using the same state as the appointment workflow.
  modal.classList.remove('is-open', 'flm-appointment-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.querySelector('.modal-card')?.classList.remove('modal-wide');
  document.body.style.overflow = '';
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
window.addEventListener('flm:career-loaded', queueCleanup);
window.addEventListener('storage', queueCleanup);
queueCleanup();
