/* Football Lab Manager — interaction stability hotfix v3.
 *
 * The current player profile is an integrated career screen. A legacy wrapper
 * in career-interactions-v053 can still call openModalShell() after the new
 * profile has rendered. Because that shared modal retains the previous press
 * conference summary, every player click can appear to reopen FIRST IMPRESSION
 * SET even though the appointment flow itself is already complete.
 *
 * This guard keeps squad profiles on the direct integrated path and removes
 * that stale shared-modal reopen before it can paint.
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

function modalParts() {
  return {
    modal: document.getElementById('appModal'),
    title: document.getElementById('modalTitle'),
    body: document.getElementById('modalBody')
  };
}

function integratedPlayerProfileVisible() {
  return Boolean(document.querySelector('.career-app.is-open .career-content > .flm-instant-profile'));
}

function modalContainsCompletedAppointment() {
  const { modal, title, body } = modalParts();
  if (!modal) return false;
  if (title?.textContent?.trim() === 'FIRST IMPRESSION SET') return true;
  if (body?.querySelector('.flm-appointment[data-appointment-v066="summary"]')) return true;
  return false;
}

function closeSharedModal() {
  const { modal } = modalParts();
  if (!modal?.classList.contains('is-open')) return false;
  modal.classList.remove('is-open', 'flm-appointment-open', 'club-picker-modal', 'flm-profile-v2-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.querySelector('.modal-card')?.classList.remove('modal-wide');
  document.body.style.overflow = document.querySelector('.career-app.is-open') ? 'hidden' : '';
  return true;
}

function closeAppointmentFrame() {
  const { modal } = modalParts();
  if (!modal?.classList.contains('flm-appointment-open')) return false;
  return closeSharedModal();
}

function closeGhostProfileModal() {
  const { modal } = modalParts();
  if (!integratedPlayerProfileVisible() || !modal?.classList.contains('is-open')) return false;

  // The legacy career-interactions wrapper reopens the generic modal after the
  // integrated profile render. If that modal still contains the completed
  // appointment screen, it is never a legitimate player-profile UI.
  if (modalContainsCompletedAppointment() || modal.classList.contains('flm-appointment-open')) {
    return closeSharedModal();
  }
  return false;
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
  const { modal } = modalParts();
  return Boolean(modal?.classList.contains('is-open') && modalContainsCompletedAppointment());
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

  if (!state.dismissed || !locked) saveAppointmentDismissal(career);
  if (visible && closeStale && !allowed) closeSharedModal();
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

function settleProfileOpen(result) {
  // A wrapped legacy open() may reopen the shared modal after awaiting the
  // integrated renderer. Cover both the immediate microtask and its completion.
  queueMicrotask(closeGhostProfileModal);
  requestAnimationFrame(closeGhostProfileModal);
  Promise.resolve(result).finally(() => {
    closeGhostProfileModal();
    requestAnimationFrame(closeGhostProfileModal);
  });
}

function openSquadPlayerNow(playerId) {
  if (!playerId) return;
  enforceCompletedAppointment();
  warmPlayerProfile();
  const result = window.FLMPlayerProfile?.open?.(playerId, { source: 'squad' });
  settleProfileOpen(result);
}

window.addEventListener('pointerover', event => {
  if (squadPlayerIdFromTarget(event.target)) warmPlayerProfile();
}, true);

// Open on pointerdown and stop the older document-level v053/v044 listeners.
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

    if (playerId === suppressPlayerClickId && performance.now() < suppressPlayerClickUntil) {
      suppressPlayerClickId = null;
      suppressPlayerClickUntil = 0;
      closeGhostProfileModal();
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
  const { modal } = modalParts();
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
  const { modal } = modalParts();
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
  // The completion screen only needs a very small grace period to render once.
  // It must never be eligible to reopen during normal career navigation.
  allowSummaryUntil = Date.now() + 1500;
  saveAppointmentDismissal(career);
});

function repairLoadedCareer() {
  const career = activeCareer();
  const state = career?.appointmentExperience;
  if (!state?.completed) return false;

  if (!summaryIsAllowed(career)) {
    saveAppointmentDismissal(career);
    if (isCompletedSummaryVisible()) closeSharedModal();
  }
  closeGhostProfileModal();
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

const bootstrapStarted = Date.now();
const bootstrapRepair = setInterval(() => {
  if (repairLoadedCareer() || Date.now() - bootstrapStarted > 12000) {
    clearInterval(bootstrapRepair);
  }
}, 25);

// This observer also catches the v053 ghost-modal path, which adds only
// `is-open` and therefore bypassed the previous flm-appointment-open check.
const modalObserver = new MutationObserver(() => {
  if (closeGhostProfileModal()) return;

  const career = activeCareer();
  if (!career?.appointmentExperience?.completed) return;

  saveAppointmentDismissal(career);
  if (isCompletedSummaryVisible() && !summaryIsAllowed(career)) {
    closeSharedModal();
  }
});

function observeAppointmentModal() {
  const { modal } = modalParts();
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
