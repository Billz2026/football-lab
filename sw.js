const CACHE_NAME = "football-lab-shell-v18";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=2",
  "./app.js?v=172",
  "./manifest.webmanifest?v=161",
  "./mobile-v16.css?v=16",
  "./mobile-shell-v16-1.css?v=161",
  "./visual-v17.css?v=17",
  "./game/main-v18.js?v=18",
  "./game/input-precision-ui-v18.js?v=18",
  "./game/render-v17-3-1.js?v=1731",
  "./game/hero-kicker-v17-3-1.js?v=1731",
  "./game/render-v17-v1731.js?v=1731",
  "./game/render-v15-v1731.js?v=1731",
  "./game/render-v9-v17-3-1.js?v=1731",
  "./game/render-v17-1-base-v1731.js?v=1731",
  "./game/visual-ui-v17.js?v=17",
  "./icons/football-lab-192.svg?v=161",
  "./icons/football-lab-512.svg?v=161"
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

async function networkFirst(request, fallbackUrl = null) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
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

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }

  event.respondWith(networkFirst(request));
});
