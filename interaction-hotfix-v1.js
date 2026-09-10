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
  const manager = flmManager();
  const state = career?.appointmentExperience;
  if (!career || !state?.completed) return false;

  state.dismissed = true;
  state.stage = 'complete';

  // Keep compatibility with the appointment module's legacy save key while
  // also asking the authoritative manager save system to persist the career.
  try {
    career.updatedAt = new Date().toISOString();
    localStorage.setItem('flm-career-save', JSON.stringify(career));
  } catch {}

  document.dispatchEvent(new CustomEvent('flm:career-save-requested', {
    detail: { career, source: 'appointment-dismissal-hotfix' }
  }));

  Promise.resolve(manager?.saveActiveCareer?.()).catch(error => {
    console.warn('FLM appointment dismissal save:', error);
  });
  return true;
}

function repairStaleCompletedSummary() {
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

['flm:career-opened', 'flm:career-data-refresh', 'flm:career-sync-complete']
  .forEach(eventName => document.addEventListener(eventName, scheduleRepair));

document.addEventListener('DOMContentLoaded', scheduleRepair, { once: true });
if (document.readyState !== 'loading') scheduleRepair();
