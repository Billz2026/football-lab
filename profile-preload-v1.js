/* Football Lab Manager — player profile preload v1
 * Starts all profile dependencies as soon as the main runtime is ready.
 * The career database is already a singleton in FLMManager; this simply warms
 * that promise plus the small player-model file before a player can be clicked.
 */

const MODEL_URL = './data/model/player-model-v1.json?v=1.0.0';

function startProfilePreload() {
  const manager = window.FLMManager;
  if (!manager?.loadDatabase) return false;
  if (window.FLMProfilePreloadPromise) return true;

  const databasePromise = manager.loadDatabase();
  const modelPromise = fetch(MODEL_URL, { cache: 'force-cache' }).then(response => {
    if (!response.ok) throw new Error(`Player model failed to preload (${response.status})`);
    return response.json();
  });

  window.FLMProfilePreloadPromise = Promise.all([databasePromise, modelPromise])
    .then(([database, model]) => {
      const data = { ...database, model };
      window.FLMProfilePreloadedData = data;
      return data;
    })
    .catch(error => {
      console.warn('FLM profile preload:', error);
      window.FLMProfilePreloadPromise = null;
      return null;
    });

  return true;
}

if (!startProfilePreload()) {
  const timer = setInterval(() => {
    if (startProfilePreload()) clearInterval(timer);
  }, 10);
  setTimeout(() => clearInterval(timer), 5000);
}
