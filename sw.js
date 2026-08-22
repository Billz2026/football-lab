// Football Lab V52 release and cache contract
const RELEASE_BUILD = "52.0.0";
const CACHE_NAME = `football-lab-shell-v${RELEASE_BUILD.replaceAll(".", "-")}`;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=2",
  "./product-polish-v22.css?v=22",
  "./game/hub-v35-1.css?v=35.1",
  "./game/hub-v35-2.css?v=35.2.1",
  "./game/hub-v52.css?v=52.0.0",
  "./game/hub-v35-3.css?v=35.3",
  "./game/hub-v35-4.css?v=35.4",
  "./game/progression-v20.css?v=20",
  "./game/world-v6.js?v=32.4",
  "./game/core-v6.js?v=32.4",
  "./game/product-polish-v22.js?v=32.4",
  "./game/progression-v20.js?v=32.4",
  "./game/hub-v35-1.js?v=35.1",
  "./game/hub-v35-3.js?v=35.3",
  "./game/hub-v35-4.js?v=35.6.2",
  "./assets/homepage/football-lab-gold-logo.webp",
  "./assets/homepage/free-training.webp",
  "./assets/homepage/classic-free-kicks.webp",
  "./assets/homepage/penalty-duel.webp",
  "./assets/homepage/corners.webp",
  "./assets/homepage/finishing.webp",
  "./assets/homepage/match-scenarios.webp",
  `./app.js?v=${RELEASE_BUILD}`
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
  event.waitUntil(refreshCoreCache().then(() => self.skipWaiting()));
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
    const response = await fetch(request, { cache: "no-store" });
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

  if (request.destination === "script") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (["style", "image", "font", "audio"].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
