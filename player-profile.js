/* Football Lab Manager — legacy player-profile compatibility entrypoint.
 * The old implementation re-fetched five JSON files with cache:no-store and
 * could overwrite the instant in-career profile API. That behaviour is retired.
 */
(() => {
  'use strict';

  function useInstantProfile() {
    const api = window.FLMPlayerProfile;
    if (!api?.open) return false;
    api.preload?.();
    return true;
  }

  if (useInstantProfile()) return;

  // If the module runtime has not finished evaluating yet, load the canonical
  // instant profile module. ES module caching prevents duplicate evaluation.
  import('./player-profile-fast-v1.js?v=1.0.1')
    .then(() => {
      if (useInstantProfile()) return;
      const timer = setInterval(() => {
        if (useInstantProfile()) clearInterval(timer);
      }, 10);
      setTimeout(() => clearInterval(timer), 5000);
    })
    .catch(error => console.error('FLM instant profile bootstrap:', error));
})();
