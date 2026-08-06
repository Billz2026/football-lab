const CACHE_NAME = "football-lab-shell-v22";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=2",
  "./product-polish-v22.css?v=22",
  "./app.js?v=22",
  "./manifest.webmanifest?v=22",
  "./mobile-v16.css?v=16",
  "./mobile-shell-v16-1.css?v=161",
  "./visual-v17.css?v=17",
  "./game/main-v18.js?v=19",
  "./game/physics-v19.js?v=19",
  "./game/input-precision-ui-v18.js?v=18",
  "./game/progression-v20.js?v=20",
  "./game/progression-v20.css?v=20",
  "./game/clarity-v21.js?v=21",
  "./game/product-polish-v22.js?v=22",
  "./game/audio-v10.js?v=10",
  "./game/render-v17-3-1.js?v=1731",
  "./game/hero-kicker-v17-3-1.js?v=1731",
  "./game/render-v17-v1731.js?v=1731",
  "./game/render-v15-v1731.js?v=1731",
  "./game/render-v9-v17-3-1.js?v=1731",
  "./game/render-v17-1-base-v1731.js?v=1731",
  "./game/visual-ui-v17.js?v=17",
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
  event.waitUntil(refreshCoreCache());
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
