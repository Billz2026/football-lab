/* Football Lab Manager — legacy player-profile compatibility entrypoint.
 * Retires the old five-request cache:no-store profile loader. This file now
 * protects the canonical instant profile API and restores audited market values.
 */
(() => {
  'use strict';

  function compactGBP(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'string' && /[^0-9.,-]/.test(value)) return value;
    const number = Number(String(value).replaceAll(',', ''));
    if (!Number.isFinite(number) || number <= 0) return null;
    if (number >= 1_000_000) {
      const millions = number / 1_000_000;
      return `£${millions >= 100 || Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)}m`;
    }
    if (number >= 1_000) {
      const thousands = number / 1_000;
      return `£${thousands >= 100 || Number.isInteger(thousands) ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
    }
    return `£${Math.round(number).toLocaleString('en-GB')}`;
  }

  function restoreValues(database) {
    for (const player of database?.players || []) {
      const source = player.auditedMarketValue ?? player.marketValue ?? player.estimatedValue;
      const formatted = compactGBP(source);
      if (formatted) player.estimatedValue = formatted;
    }
    return database;
  }

  function warmDatabase() {
    const manager = window.FLMManager;
    if (!manager?.loadDatabase) return false;
    if (!window.FLMPlayerValueWarmPromise) {
      window.FLMPlayerValueWarmPromise = manager.loadDatabase()
        .then(restoreValues)
        .catch(error => {
          console.warn('FLM player value warm-up:', error);
          return null;
        });
    }
    return true;
  }

  function protectInstantApi() {
    const api = window.FLMPlayerProfile;
    if (!api?.open) return false;
    api.preload?.();
    if (api.__flmInstantLocked) return true;
    try {
      Object.defineProperty(api, '__flmInstantLocked', { value: true });
      Object.defineProperty(window, 'FLMPlayerProfile', {
        configurable: false,
        enumerable: true,
        get() { return api; },
        set() { /* Legacy replacements are intentionally ignored. */ }
      });
    } catch (error) {
      console.warn('FLM instant profile protection:', error);
    }
    return true;
  }

  function finishBootstrap() {
    warmDatabase();
    return protectInstantApi();
  }

  if (!warmDatabase()) {
    const dbTimer = setInterval(() => {
      if (warmDatabase()) clearInterval(dbTimer);
    }, 10);
    setTimeout(() => clearInterval(dbTimer), 5000);
  }

  if (finishBootstrap()) return;

  // If module evaluation is still in flight, request the canonical module now.
  // Browser module caching means this does not create a second profile engine.
  import('./player-profile-fast-v1.js?v=1.0.1')
    .then(() => {
      if (finishBootstrap()) return;
      const apiTimer = setInterval(() => {
        if (finishBootstrap()) clearInterval(apiTimer);
      }, 10);
      setTimeout(() => clearInterval(apiTimer), 5000);
    })
    .catch(error => console.error('FLM instant profile bootstrap:', error));
})();
