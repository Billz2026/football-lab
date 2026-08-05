const CACHE_NAME = "football-lab-shell-v173";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=2",
  "./app.js?v=172",
  "./manifest.webmanifest?v=161",
  "./mobile-v16.css?v=16",
  "./mobile-shell-v16-1.css?v=161",
  "./visual-v17.css?v=17",
  "./game/main-v17-3.js?v=173",
  "./game/render-v17-3.js?v=173",
  "./game/hero-kicker-v17-3.js?v=173",
  "./game/render-v17.js?v=173",
  "./game/render-v15.js?v=15",
  "./game/render-v9-v15.js?v=15",
  "./game/render-v17-1-base.js?v=171",
  "./game/visual-ui-v17.js?v=17",
  "./icons/football-lab-192.svg?v=161",
  "./icons/football-lab-512.svg?v=161"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
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