let loaded = false;
let loading = false;
let queued = false;

const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;

async function loadTransfers() {
  if (loaded || loading || !career()) return;
  loading = true;
  document.querySelector('[data-v054-transfer-gate]')?.remove();
  try {
    await import('./career-transfers-cm-v1.js?v=1.0.0');
    loaded = true;
  } catch (error) {
    console.error('Transfer Centre V1 failed to load:', error);
  } finally {
    loading = false;
  }
}

function sync() {
  if (!career()) return;
  loadTransfers();
}

function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    sync();
  });
}

new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
sync();
