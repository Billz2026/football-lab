/* Football Lab Manager — keep the instant player-profile cache hot.
 * The previous warm-up stopped as soon as FLMPlayerProfile existed, even when
 * FLMManager.loadDatabase was not ready yet. That race left the first click
 * paying for the database/model load.
 */

function warmInstantProfile() {
  const api = window.FLMPlayerProfile;
  const manager = window.FLMManager;
  if (!api?.preload || !manager?.loadDatabase) return false;
  api.preload();
  return true;
}

function keepWarm() {
  if (warmInstantProfile()) return;

  const started = Date.now();
  const timer = setInterval(() => {
    if (warmInstantProfile() || Date.now() - started > 10000) {
      clearInterval(timer);
    }
  }, 10);
}

keepWarm();
document.addEventListener('DOMContentLoaded', keepWarm, { once: true });

[
  'flm:career-created',
  'flm:career-opened',
  'flm:career-data-refresh',
  'flm:career-sync-complete',
  'flm:player-audit-ready'
].forEach(eventName => document.addEventListener(eventName, keepWarm));

// By the time the pointer reaches a profile button, all profile data should
// already be hot. These are safeguards for unusually fast navigation/startup.
document.addEventListener('pointerover', event => {
  if (event.target.closest?.('[data-v044-profile]')) warmInstantProfile();
}, true);

document.addEventListener('pointerdown', event => {
  if (event.target.closest?.('[data-v044-profile]')) warmInstantProfile();
}, true);
