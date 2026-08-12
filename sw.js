const CACHE_NAME = "football-lab-shell-v33-2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=2",
  "./product-polish-v22.css?v=22",
  "./app.js?v=33.2",
  "./manifest.webmanifest?v=23",
  "./mobile-v16.css?v=16",
  "./mobile-shell-v16-1.css?v=161",
  "./visual-v17.css?v=17",
  "./game/runtime-v23-main.js?v=33.2",
  "./game/flight-v33.js?v=33.2",
  "./game/release-v23.js?v=32.4",
  "./game/immersive-ui-v24.js?v=32.4",
  "./game/immersive-ui-v24.css?v=24.2",
  "./game/desktop-fit-v24-1.css?v=24.2",
  "./game/runtime-v23-bridge-physics-v19-f1d39f9409.js?v=32.4",
  "./game/runtime-v23-bridge-render-v17-3-1-64b7ab3399.js?v=32.4",
  "./game/runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js?v=32.4",
  "./game/runtime-v23-generated-hero-kicker-v17-3-1-7c97a59e31.js?v=32.4",
  "./game/runtime-v23-generated-physics-v15-9cf6fe15a3.js?v=32.4",
  "./game/runtime-v23-generated-render-v15-v1731-1b04a249af.js?v=32.4",
  "./game/runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js?v=32.4",
  "./game/runtime-v23-generated-render-v17-v1731-7f257084b1.js?v=32.4",
  "./game/core-v6.js?v=32.4",
  "./game/world-v6.js?v=32.4",
  "./game/world-v7.js?v=32.4",
  "./game/projection-v6.js?v=32.4",
  "./game/difficulty-v9.js?v=32.4",
  "./game/characters-v13.js?v=32.4",
  "./game/keepers-v14.js?v=32.4",
  "./game/walls-v15.js?v=32.4",
  "./game/audio-v32.js?v=32.4",
  "./game/audio-v6.js?v=32.4",
  "./game/physics-v7.js?v=32.4",
  "./game/polish-v10-2.js?v=32.4",
  "./game/polish-v11-4.js?v=32.4",
  "./game/characters-ui-v13.js?v=32.4",
  "./game/keepers-ui-v14.js?v=32.4",
  "./game/walls-ui-v15.js?v=32.4",
  "./game/mobile-ui-v16.js?v=32.4",
  "./game/mobile-shell-v16-1.js?v=32.4",
  "./game/mobile-shell-compact-v16-1.js?v=32.4",
  "./game/visual-ui-v17.js?v=32.4",
  "./game/strike-v32-4.js?v=32.4",
  "./game/strike-v32-4.css?v=32.4",
  "./game/input-precision-ui-v18.js?v=32.4",
  "./game/progression-v20.js?v=32.4",
  "./game/progression-v20.css?v=20",
  "./game/clarity-v21.js?v=32.4",
  "./game/product-polish-v22.js?v=32.4",
  "./game/infinite-runs-v25.js?v=32.4",
  "./game/campaign-v31.js?v=32.4",
  "./game/campaign-v31.css?v=32.4",
  "./game/matchday-impact-v32.js?v=32.4",
  "./icons/football-lab-192.svg?v=161",
  "./icons/football-lab-512.svg?v=161",
  "./social-card.svg"
];

async function refreshCoreCache() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(CORE_ASSETS.map(async (url) => {
    const response = await fetch(url, { cache: "reload" });
    if (!response.ok) throw new Error(`Unable to cache ${url} (${response.status})`);
    await cache.put(url, response);
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    refreshCoreCache().then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function networkFirst(request, fallbackUrl = null) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl, { ignoreSearch: true });
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: false });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }

  if (["script", "style", "image", "font", "audio"].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
