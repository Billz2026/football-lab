/* Football Lab Manager — instant player profile runtime guard v1.
 * Locks the canonical in-career profile API so the legacy deferred profile
 * script cannot overwrite it, and restores visible market values from the
 * audited/player market-value fields already present in the career database.
 */

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

function restorePlayerValues(database) {
  if (!database?.players) return database;
  for (const player of database.players) {
    const raw = player.auditedMarketValue ?? player.marketValue ?? player.estimatedValue;
    const formatted = compactGBP(raw);
    if (formatted) player.estimatedValue = formatted;
  }
  return database;
}

function warmValues() {
  const manager = window.FLMManager;
  if (!manager?.loadDatabase) return false;
  if (!window.FLMPlayerValueWarmPromise) {
    window.FLMPlayerValueWarmPromise = manager.loadDatabase()
      .then(restorePlayerValues)
      .catch(error => {
        console.warn('FLM player value warm-up:', error);
        return null;
      });
  }
  return true;
}

function lockProfileApi() {
  const api = window.FLMPlayerProfile;
  if (!api?.open || api.__flmInstantLocked) return Boolean(api?.__flmInstantLocked);

  try {
    Object.defineProperty(api, '__flmInstantLocked', { value: true, configurable: false });
    Object.defineProperty(window, 'FLMPlayerProfile', {
      configurable: false,
      enumerable: true,
      get() { return api; },
      set() {
        // Intentionally ignore legacy attempts to replace the instant profile API.
      }
    });
    api.preload?.();
    return true;
  } catch (error) {
    console.warn('FLM player profile API lock:', error);
    return false;
  }
}

if (!warmValues()) {
  const valueTimer = setInterval(() => {
    if (warmValues()) clearInterval(valueTimer);
  }, 10);
  setTimeout(() => clearInterval(valueTimer), 5000);
}

if (!lockProfileApi()) {
  const apiTimer = setInterval(() => {
    if (lockProfileApi()) clearInterval(apiTimer);
  }, 10);
  setTimeout(() => clearInterval(apiTimer), 5000);
}
