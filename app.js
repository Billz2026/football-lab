function registerFootballLabServiceWorker() {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register("./sw.js?v=32.2", {
    scope: "./",
    updateViaCache: "none"
  })
    .then(async (registration) => {
      window.__footballLabServiceWorkerReady = true;
      window.__footballLabServiceWorkerRegistration = registration;
      window.dispatchEvent(new CustomEvent("footballlab:swready", { detail: { registration } }));
      await registration.update();
    })
    .catch((error) => console.info("Offline shell was not registered", error));
}

if (document.readyState === "complete") registerFootballLabServiceWorker();
else window.addEventListener("load", registerFootballLabServiceWorker, { once: true });

window.__footballLabStartupError = null;

const localCaptureHost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const runtimeCaptureMode = localCaptureHost
  && new URLSearchParams(location.search).get("runtime-capture") === "v23";
const runtimeEntry = runtimeCaptureMode
  ? "./game/main-v18.js?v=32.2"
  : "./game/runtime-v23-main.js?v=32.2";
window.__footballLabRuntimeCaptureMode = runtimeCaptureMode;

const runtimePromise = import(runtimeEntry);
const bootPromise = runtimeCaptureMode
  ? runtimePromise.then(() => {
      window.__footballLabMainV19 = true;
      window.__footballLabCaptureReadyV23 = true;
    })
  : runtimePromise
      .then(() => import("./game/polish-v10-2.js?v=32.2"))
      .then(() => import("./game/polish-v11-4.js?v=32.2"))
      .then(() => import("./game/characters-ui-v13.js?v=32.2"))
      .then(() => import("./game/keepers-ui-v14.js?v=32.2"))
      .then(() => import("./game/walls-ui-v15.js?v=32.2"))
      .then(() => import("./game/mobile-ui-v16.js?v=32.2"))
      .then(() => import("./game/mobile-shell-v16-1.js?v=32.2"))
      .then(() => import("./game/mobile-shell-compact-v16-1.js?v=32.2"))
      .then(() => import("./game/visual-ui-v17.js?v=32.2"))
      .then(() => import("./game/aiming-v32-2.js?v=32.2"))
      .then(() => import("./game/input-precision-ui-v18.js?v=32.2"))
      .then(() => import("./game/progression-v20.js?v=32.2"))
      .then(() => import("./game/clarity-v21.js?v=32.2"))
      .then(() => import("./game/product-polish-v22.js?v=32.2"))
      .then(() => import("./game/release-v23.js?v=32.2"))
      .then(() => import("./game/immersive-ui-v24.js?v=32.2"))
      .then(() => import("./game/infinite-runs-v25.js?v=32.2"))
      .then(() => import("./game/campaign-v31.js?v=32.2"))
      .then(() => {
        document.documentElement.dataset.footballLabBuild = "32.2";
        const badge = document.querySelector(".build-badge-v22");
        if (badge) {
          badge.textContent = "V32.2";
          badge.title = "Football Lab build 32.2.0";
        }
        const version = document.querySelector(".settings-version-v22 strong");
        if (version) version.textContent = "32.2.0";
        window.__footballLabReleaseV322 = Object.freeze({
          build: "32.2.0",
          aiming: "target-and-route-planner",
          cacheGeneration: "32.2"
        });
      });

bootPromise.catch((error) => {
  window.__footballLabStartupError = error?.stack || error?.message || String(error);
  console.error("Football Lab failed to start", error);
  const message = document.createElement("div");
  message.className = "football-lab-startup-error";
  message.setAttribute("role", "alert");
  message.textContent = `The game failed to load: ${error?.message || "unknown startup error"}.`;
  Object.assign(message.style, {
    position: "fixed",
    inset: "auto 20px 20px",
    zIndex: "9999",
    padding: "16px 18px",
    borderRadius: "12px",
    background: "#260b0b",
    color: "#fff",
    font: "700 14px system-ui"
  });
  document.body.appendChild(message);
});
