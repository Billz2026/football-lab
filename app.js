function registerFootballLabServiceWorker() {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register("./sw.js?v=221", {
    scope: "./",
    updateViaCache: "none"
  })
    .then(async (registration) => {
      window.__footballLabServiceWorkerReady = Boolean(registration);
      await registration.update();
    })
    .catch((error) => console.info("Offline shell was not registered", error));
}

if (document.readyState === "complete") registerFootballLabServiceWorker();
else window.addEventListener("load", registerFootballLabServiceWorker, { once: true });

window.__footballLabStartupError = null;

import("./game/main-v18.js?v=19")
  .then(() => import("./game/polish-v10-2.js?v=114"))
  .then(() => import("./game/polish-v11-4.js?v=114"))
  .then(() => import("./game/characters-ui-v13.js?v=13"))
  .then(() => import("./game/keepers-ui-v14.js?v=14"))
  .then(() => import("./game/walls-ui-v15.js?v=15"))
  .then(() => import("./game/run-rules-ui-v15-2.js?v=152"))
  .then(() => import("./game/mobile-ui-v16.js?v=16"))
  .then(() => import("./game/mobile-shell-v16-1.js?v=161"))
  .then(() => import("./game/mobile-shell-compact-v16-1.js?v=161"))
  .then(() => import("./game/visual-ui-v17.js?v=17"))
  .then(() => import("./game/input-precision-ui-v18.js?v=18"))
  .then(() => import("./game/progression-v20.js?v=20"))
  .then(() => import("./game/clarity-v22.js?v=22"))
  .then(() => import("./game/v22-overlay-cleanup.js?v=22"))
  .catch((error) => {
    window.__footballLabStartupError = error?.stack || error?.message || String(error);
    console.error("Football Lab failed to start", error);
    const message = document.createElement("div");
    message.className = "football-lab-startup-error";
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
