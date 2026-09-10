/* Football Lab Manager — interaction stability hotfix v1.
 * 1) Makes the completed first-press summary a true one-time screen.
 * 2) Stops player-profile clicks from feeding the appointment module's global
 *    document click queue, so opening a profile is a single direct action.
 */

let appointmentCompletedThisSession = false;

function flmManager() {
  return window.FLMManager || null;
}

function activeCareer() {
  return flmManager()?.activeCareer || null;
}

function closeAppointmentFrame() {
  const modal = document.getElementById('appModal');
  if (!modal?.classList.contains('flm-appointment-open')) return;
  modal.classList.remove('is-open', 'flm-appointment-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.querySelector('.modal-card')?.classList.remove('modal-wide');
  document.body.style.overflow = document.querySelector('.career-app.is-open') ? 'hidden' : '';
}

function saveAppointmentDismissal(career) {
  const state = career?.appointmentExperience;
  if (!career || !state?.completed) return false;

  state.dismissed = true;
  state.stage = 'complete';

  // manager-core serialises careers with JSON.stringify as well, so writing the
  // canonical save key here is the same representation used by the main save.
  try {
    career.updatedAt = new Date().toISOString();
    localStorage.setItem('flm-career-save', JSON.stringify(career));
  } catch (error) {
    console.warn('FLM appointment dismissal save:', error);
  }

  return true;
}

function repairStaleCompletedSummary() {
  // A press conference completed during this page session is allowed to show
  // its summary exactly once. A completed state loaded from an older save is
  // stale UI and should never reopen over normal career navigation.
  if (appointmentCompletedThisSession) return false;
  const career = activeCareer();
  const state = career?.appointmentExperience;
  if (!state?.completed || state.dismissed) return false;

  saveAppointmentDismissal(career);
  closeAppointmentFrame();
  return true;
}

window.addEventListener('flm:appointment-complete', () => {
  appointmentCompletedThisSession = true;
});

// Window capture runs before the appointment module's document-capture click
// listener. Profile clicks therefore go straight to the canonical profile API
// without also scheduling the appointment modal again.
window.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const profileTrigger = target.closest('[data-v044-profile]');
  const playerId = profileTrigger?.dataset?.v044Profile;
  if (playerId) {
    // Repair an old completed summary before changing the career content. This
    // prevents the appointment MutationObserver from reopening it over the
    // newly rendered player profile.
    repairStaleCompletedSummary();

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    window.FLMPlayerProfile?.open?.(playerId, { source: 'squad' });
    return;
  }

  const enterCareer = target.closest('[data-appt-enter]');
  if (enterCareer) {
    const career = activeCareer();
    if (career?.appointmentExperience?.completed) {
      saveAppointmentDismissal(career);
    }
    return;
  }

  const closeTrigger = target.closest('.modal-close,[data-close-modal]');
  const modal = document.getElementById('appModal');
  if (closeTrigger && modal?.classList.contains('flm-appointment-open')) {
    const career = activeCareer();
    if (career?.appointmentExperience?.completed) {
      saveAppointmentDismissal(career);
    }
  }
}, true);

window.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const modal = document.getElementById('appModal');
  if (!modal?.classList.contains('flm-appointment-open')) return;
  const career = activeCareer();
  if (career?.appointmentExperience?.completed) {
    saveAppointmentDismissal(career);
  }
}, true);

function scheduleRepair() {
  requestAnimationFrame(() => {
    setTimeout(repairStaleCompletedSummary, 0);
  });
}

['flm:career-opened', 'flm:career-created', 'flm:career-data-refresh', 'flm:career-sync-complete']
  .forEach(eventName => document.addEventListener(eventName, scheduleRepair));

document.addEventListener('DOMContentLoaded', scheduleRepair, { once: true });
if (document.readyState !== 'loading') scheduleRepair();

// Existing saves can become active after DOMContentLoaded without emitting a
// stable public lifecycle event. Poll briefly during bootstrap only; once the
// stale completed state is repaired the timer stops permanently.
const staleRepairStarted = Date.now();
const staleRepairTimer = setInterval(() => {
  if (repairStaleCompletedSummary() || Date.now() - staleRepairStarted > 10000) {
    clearInterval(staleRepairTimer);
  }
}, 50);

// If the appointment module manages to open an old completed summary between
// lifecycle ticks, close it immediately rather than waiting for its 1.4 s poll.
const modalObserver = new MutationObserver(() => {
  const modal = document.getElementById('appModal');
  if (!modal?.classList.contains('flm-appointment-open')) return;
  repairStaleCompletedSummary();
});

const observeAppointmentModal = () => {
  const modal = document.getElementById('appModal');
  if (!modal) return false;
  modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
  return true;
};

if (!observeAppointmentModal()) {
  document.addEventListener('DOMContentLoaded', observeAppointmentModal, { once: true });
}
