/* Football Lab Manager — interaction stability hotfix v2.
 *
 * Two legacy behaviours were colliding with the current career UI:
 * 1) career-interactions-v053 owns an older player-name click handler whose
 *    openProfile() can wait 20 x 50 ms after the canonical profile API has
 *    replaced the API it originally wrapped. We intercept squad player intent
 *    at window-capture level before that legacy document listener can run.
 * 2) career-appointment-media polls and queues from global DOM/click activity.
 *    Completed press summaries are now persisted as dismissed immediately when
 *    completion fires, while the just-completed summary is still allowed to be
 *    shown once in the current call stack. Any stale/reopened copy is closed.
 */

let allowSummaryCareerId = null;
let allowSummaryUntil = 0;
let suppressPlayerClickId = null;
let suppressPlayerClickUntil = 0;

function flmManager() {
  return window.FLMManager || null;
}

function activeCareer() {
  return flmManager()?.activeCareer || null;
}

function appointmentLockKey(career) {
  return career?.id ? `flm-appointment-summary-closed:${career.id}` : null;
}

function hasAppointmentLock(career) {
  const key = appointmentLockKey(career);
  if (!key) return false;
  try { return localStorage.getItem(key) === '1'; }
  catch { return false; }
}

function setAppointmentLock(career) {
  const key = appointmentLockKey(career);
  if (!key) return;
  try { localStorage.setItem(key, '1'); } catch {}
}

function closeAppointmentFrame() {
  const modal = document.getElementById('appModal');
  if (!modal?.classList.contains('flm-appointment-open')) return false;
  modal.classList.remove('is-open', 'flm-appointment-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.querySelector('.modal-card')?.classList.remove('modal-wide');
  document.body.style.overflow = document.querySelector('.career-app.is-open') ? 'hidden' : '';
  return true;
}

function saveAppointmentDismissal(career) {
  const state = career?.appointmentExperience;
  if (!career || !state?.completed) return false;

  state.dismissed = true;
  state.stage = 'complete';
  setAppointmentLock(career);

  try {
    career.updatedAt = new Date().toISOString();
    localStorage.setItem('flm-career-save', JSON.stringify(career));
  } catch (error) {
    console.warn('FLM appointment dismissal save:', error);
  }

  return true;
}

function isCompletedSummaryVisible() {
  const modal = document.getElementById('appModal');
  if (!modal?.classList.contains('flm-appointment-open') || !modal.classList.contains('is-open')) return false;
  if (modal.querySelector('.flm-appointment[data-appointment-v066="summary"]')) return true;
  return document.getElementById('modalTitle')?.textContent?.trim() === 'FIRST IMPRESSION SET';
}

function summaryIsAllowed(career) {
  return Boolean(
    career?.id &&
    allowSummaryCareerId === career.id &&
    Date.now() < allowSummaryUntil
  );
}

function enforceCompletedAppointment({ closeStale = true } = {}) {
  const career = activeCareer();
  const state = career?.appointmentExperience;
  if (!state?.completed) return false;

  const allowed = summaryIsAllowed(career);
  const visible = isCompletedSummaryVisible();
  const locked = hasAppointmentLock(career);

  // Completion itself is persisted as dismissed immediately. The appointment
  // module can still render the summary once because it calls renderSummary()
  // directly after dispatching flm:appointment-complete.
  if (!state.dismissed || !locked) saveAppointmentDismissal(career);

  // A newly completed conference may remain visible once. Anything else is a
  // stale reopen caused by the appointment module's global queue/polling.
  if (visible && closeStale && !allowed) closeAppointmentFrame();
  return true;
}

function squadPlayerIdFromTarget(target) {
  if (!(target instanceof Element)) return null;

  const profileButton = target.closest('[data-v044-profile]');
  if (profileButton?.dataset.v044Profile) return profileButton.dataset.v044Profile;

  const name = target.closest('.v044-name');
  const row = name?.closest('[data-v044-row]');
  if (row?.dataset.v044Row) return row.dataset.v044Row;

  return null;
}

function warmPlayerProfile() {
  try { window.FLMPlayerProfile?.preload?.(); } catch {}
}

function openSquadPlayerNow(playerId) {
  if (!playerId) return;
  enforceCompletedAppointment();
  warmPlayerProfile();
  window.FLMPlayerProfile?.open?.(playerId, { source: 'squad' });
}

// Pre-warm as soon as the user moves toward a player. This costs no click time.
window.addEventListener('pointerover', event => {
  if (squadPlayerIdFromTarget(event.target)) warmPlayerProfile();
}, true);

// Open on pointerdown rather than waiting for click. More importantly, this
// window-capture listener runs before career-interactions-v053's document
// capture listener, removing its hard-coded retry loop from squad navigation.
window.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  const playerId = squadPlayerIdFromTarget(event.target);
  if (!playerId) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  suppressPlayerClickId = playerId;
  suppressPlayerClickUntil = performance.now() + 1200;
  openSquadPlayerNow(playerId);
}, true);

window.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const playerId = squadPlayerIdFromTarget(target);
  if (playerId) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Pointerdown already opened this player. Suppress the compatibility click
    // so neither the v053 legacy listener nor the v044 target listener fires.
    if (playerId === suppressPlayerClickId && performance.now() < suppressPlayerClickUntil) {
      suppressPlayerClickId = null;
      suppressPlayerClickUntil = 0;
      return;
    }

    openSquadPlayerNow(playerId);
    return;
  }

  const enterCareer = target.closest('[data-appt-enter]');
  if (enterCareer) {
    const career = activeCareer();
    if (career?.appointmentExperience?.completed) {
      saveAppointmentDismissal(career);
      allowSummaryCareerId = null;
      allowSummaryUntil = 0;
    }
    return;
  }

  const closeTrigger = target.closest('.modal-close,[data-close-modal]');
  const modal = document.getElementById('appModal');
  if (closeTrigger && modal?.classList.contains('flm-appointment-open')) {
    const career = activeCareer();
    if (career?.appointmentExperience?.completed) {
      saveAppointmentDismissal(career);
      allowSummaryCareerId = null;
      allowSummaryUntil = 0;
    }
  }
}, true);

window.addEventListener('keydown', event => {
  const playerId = squadPlayerIdFromTarget(event.target);
  if (playerId && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openSquadPlayerNow(playerId);
    return;
  }

  if (event.key !== 'Escape') return;
  const modal = document.getElementById('appModal');
  if (!modal?.classList.contains('flm-appointment-open')) return;
  const career = activeCareer();
  if (career?.appointmentExperience?.completed) {
    saveAppointmentDismissal(career);
    allowSummaryCareerId = null;
    allowSummaryUntil = 0;
  }
}, true);

window.addEventListener('flm:appointment-complete', event => {
  const career = activeCareer();
  if (!career?.appointmentExperience?.completed) return;

  allowSummaryCareerId = event.detail?.careerId || career.id;
  allowSummaryUntil = Date.now() + 30000;

  // This is the key persistence fix: do not wait for ENTER CAREER or the X.
  // The summary will still render once because the appointment module renders
  // it directly after this event returns.
  saveAppointmentDismissal(career);
});

function repairLoadedCareer() {
  const career = activeCareer();
  const state = career?.appointmentExperience;
  if (!state?.completed) return false;

  // A completed conference loaded from storage is never a new completion in
  // this page session. Persist dismissal before the polling module can reopen it.
  if (!summaryIsAllowed(career)) {
    saveAppointmentDismissal(career);
    if (isCompletedSummaryVisible()) closeAppointmentFrame();
  }
  return true;
}

function scheduleRepair() {
  requestAnimationFrame(() => setTimeout(repairLoadedCareer, 0));
}

[
  'flm:career-opened',
  'flm:career-created',
  'flm:career-data-refresh',
  'flm:career-sync-complete'
].forEach(eventName => document.addEventListener(eventName, scheduleRepair));

document.addEventListener('DOMContentLoaded', scheduleRepair, { once: true });
if (document.readyState !== 'loading') scheduleRepair();

// Some current saves become active without a stable lifecycle event. Repair
// during bootstrap only, then stop. This is not a permanent game-loop poll.
const bootstrapStarted = Date.now();
const bootstrapRepair = setInterval(() => {
  if (repairLoadedCareer() || Date.now() - bootstrapStarted > 12000) {
    clearInterval(bootstrapRepair);
  }
}, 25);

// If the old appointment module physically inserts FIRST IMPRESSION SET again,
// this observer is the final guard. New-completion summaries are allowed once;
// stale copies are removed immediately.
const modalObserver = new MutationObserver(() => {
  const career = activeCareer();
  if (!career?.appointmentExperience?.completed) return;

  saveAppointmentDismissal(career);
  if (isCompletedSummaryVisible() && !summaryIsAllowed(career)) {
    closeAppointmentFrame();
  }
});

function observeAppointmentModal() {
  const modal = document.getElementById('appModal');
  if (!modal) return false;
  modalObserver.observe(modal, {
    attributes: true,
    attributeFilter: ['class', 'aria-hidden'],
    childList: true,
    subtree: true,
    characterData: true
  });
  return true;
}

if (!observeAppointmentModal()) {
  document.addEventListener('DOMContentLoaded', observeAppointmentModal, { once: true });
}

warmPlayerProfile();
