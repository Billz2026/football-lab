import { state, MAX_LIVES, LIFE_STREAK_TARGET } from "./core-v6.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";
import { wallForStage } from "./walls-v15.js?v=32.4";

const STYLE_ID = "mobileGameShellStylesV161";
const HUD_ID = "mobileGameHudV161";
const RUN_STRIP_ID = "mobileRunStripV161";
const INSTALL_ID = "installFootballLabV161";
const STANDALONE_QUERY = "(display-mode: standalone)";

let deferredInstallPrompt = null;
let updateQueued = false;

function ensureStylesheet() {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.href = "./mobile-shell-v16-1.css?v=161";
  document.head.appendChild(link);
}

function ensurePwaMetadata() {
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "./manifest.webmanifest?v=161";
    document.head.appendChild(manifest);
  }

  const metadata = [
    ["mobile-web-app-capable", "yes"],
    ["apple-mobile-web-app-capable", "yes"],
    ["apple-mobile-web-app-status-bar-style", "black-translucent"],
    ["apple-mobile-web-app-title", "Football Lab"]
  ];

  metadata.forEach(([name, content]) => {
    if (document.querySelector(`meta[name="${name}"]`)) return;
    const meta = document.createElement("meta");
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  });

  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const icon = document.createElement("link");
    icon.rel = "apple-touch-icon";
    icon.href = "./icons/football-lab-192.svg?v=161";
    document.head.appendChild(icon);
  }
}

function isStandalone() {
  return window.matchMedia?.(STANDALONE_QUERY).matches || window.navigator.standalone === true;
}

function createPips(count, className) {
  return Array.from({ length: count }, (_, index) => `<i class="${className}" data-pip="${index}"></i>`).join("");
}

function ensureHud() {
  const frame = document.querySelector(".game-frame");
  if (!frame) return null;

  let hud = document.getElementById(HUD_ID);
  if (hud) return hud;

  hud = document.createElement("div");
  hud.id = HUD_ID;
  hud.className = "mobile-game-hud-v161";
  hud.setAttribute("aria-label", "Mobile match information");
  hud.innerHTML = `
    <div class="mobile-hud-top-v161">
      <button class="mobile-hud-button-v161 mobile-exit-v161" type="button" aria-label="Exit game">←</button>
      <div class="mobile-stage-v161">
        <span data-hud-stage>STAGE 01</span>
        <strong data-hud-stage-name>THE OPENER</strong>
      </div>
      <div class="mobile-score-v161">
        <span>SCORE <strong data-hud-score>0</strong></span>
        <span>STREAK <strong data-hud-streak>0</strong></span>
      </div>
      <div class="mobile-lives-v161" aria-label="Remaining lives">
        <span data-hud-lives-copy>LIVES 5/5</span>
        <div>${createPips(MAX_LIVES, "mobile-life-pip-v161")}</div>
      </div>
      <div class="mobile-wind-v161">
        <span data-hud-wind-arrow>→</span>
        <div><small>WIND</small><strong data-hud-wind>0.0 m/s</strong></div>
      </div>
      <button class="mobile-hud-button-v161 mobile-fullscreen-v161" type="button" aria-label="Toggle fullscreen">⛶</button>
    </div>
    <div class="mobile-matchup-v161">
      <div class="mobile-matchup-chip-v161" data-hud-keeper>
        <i>GK</i><div><span>GOALKEEPER</span><strong>ACADEMY KEEPER</strong></div>
      </div>
      <div class="mobile-matchup-chip-v161" data-hud-wall>
        <i>▥</i><div><span>DEFENSIVE WALL</span><strong>ACADEMY LINE</strong></div>
      </div>
    </div>`;

  hud.querySelector(".mobile-exit-v161")?.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // Fullscreen exit is optional; continue back to the menu.
    }
    document.getElementById("exitGame")?.click();
  });

  hud.querySelector(".mobile-fullscreen-v161")?.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      }
    } catch (error) {
      console.info("Fullscreen was not available", error);
    }
    queueUpdate();
  });

  frame.appendChild(hud);
  return hud;
}

function ensureRunStrip() {
  const control = document.querySelector(".control-panel");
  if (!control) return null;

  let strip = document.getElementById(RUN_STRIP_ID);
  if (strip) return strip;

  strip = document.createElement("div");
  strip.id = RUN_STRIP_ID;
  strip.className = "mobile-run-strip-v161";
  strip.innerHTML = `
    <div class="mobile-run-lives-v161">
      <div><span>REMAINING LIVES</span><strong data-run-lives-copy>5 / 5</strong></div>
      <div class="mobile-run-pips-v161" aria-label="Five lives">${createPips(MAX_LIVES, "mobile-run-life-v161")}</div>
    </div>
    <div class="mobile-run-recovery-v161">
      <div><span>LIFE RECOVERY</span><strong data-run-recovery-copy>0 / 3 GOALS</strong></div>
      <div class="mobile-run-pips-v161" aria-label="Three-goal recovery progress">${createPips(LIFE_STREAK_TARGET, "mobile-run-recovery-pip-v161")}</div>
    </div>`;

  control.querySelector(".control-heading")?.after(strip);
  return strip;
}

function setPips(nodes, activeCount) {
  nodes.forEach((node, index) => node.classList.toggle("is-active", index < activeCount));
}

function text(id, fallback = "") {
  return document.getElementById(id)?.textContent?.trim() || fallback;
}

function currentLives() {
  return Math.max(0, MAX_LIVES - Number(state.misses || 0));
}

function currentRecovery() {
  return Math.max(0, Number(state.streak || 0) % LIFE_STREAK_TARGET);
}

function renderHud() {
  updateQueued = false;
  const hud = ensureHud();
  const strip = ensureRunStrip();
  if (!hud || !strip) return;

  const lives = currentLives();
  const recovery = currentRecovery();
  const keeper = keeperForStage(state.stage);
  const wall = wallForStage(state.stage);

  hud.querySelector("[data-hud-stage]").textContent = text("stageNumber", `STAGE ${String(state.stage + 1).padStart(2, "0")}`);
  hud.querySelector("[data-hud-stage-name]").textContent = text("stageName", state.currentStage?.name || "CLASSIC KICKS");
  hud.querySelector("[data-hud-score]").textContent = text("scoreValue", String(state.score || 0));
  hud.querySelector("[data-hud-streak]").textContent = text("streakValue", String(state.streak || 0));
  hud.querySelector("[data-hud-lives-copy]").textContent = `LIVES ${lives}/${MAX_LIVES}`;
  hud.querySelector("[data-hud-wind-arrow]").textContent = text("windArrow", "→");
  hud.querySelector("[data-hud-wind]").textContent = text("windValue", "0.0 m/s");
  hud.querySelector(".mobile-fullscreen-v161").textContent = document.fullscreenElement ? "×" : "⛶";
  hud.querySelector(".mobile-fullscreen-v161").setAttribute("aria-label", document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen");

  setPips([...hud.querySelectorAll(".mobile-life-pip-v161")], lives);

  const keeperChip = hud.querySelector("[data-hud-keeper]");
  keeperChip.style.setProperty("--matchup-accent", keeper.accent);
  keeperChip.querySelector("i").textContent = keeper.icon || "GK";
  keeperChip.querySelector("strong").textContent = `${keeper.name} · T${keeper.tier}`;

  const wallChip = hud.querySelector("[data-hud-wall]");
  wallChip.style.setProperty("--matchup-accent", wall.accent);
  wallChip.querySelector("i").textContent = wall.icon || "▥";
  wallChip.querySelector("strong").textContent = `${wall.name} · T${wall.tier}`;

  strip.querySelector("[data-run-lives-copy]").textContent = `${lives} / ${MAX_LIVES}`;
  strip.querySelector("[data-run-recovery-copy]").textContent = `${recovery} / ${LIFE_STREAK_TARGET} GOALS`;
  setPips([...strip.querySelectorAll(".mobile-run-life-v161")], lives);
  setPips([...strip.querySelectorAll(".mobile-run-recovery-pip-v161")], recovery);

  document.body.classList.toggle("is-pwa-standalone-v161", isStandalone());
}

function queueUpdate() {
  if (updateQueued) return;
  updateQueued = true;
  requestAnimationFrame(renderHud);
}

function observeGameState() {
  const ids = ["stageNumber", "stageName", "scoreValue", "streakValue", "livesValue", "windArrow", "windValue"];
  const observer = new MutationObserver(queueUpdate);
  ids.forEach((id) => {
    const node = document.getElementById(id);
    if (node) observer.observe(node, { childList: true, characterData: true, subtree: true });
  });

  const gameScreen = document.getElementById("gameScreen");
  if (gameScreen) observer.observe(gameScreen, { attributes: true, attributeFilter: ["class"] });

  ["footballlab:keeperchange", "footballlab:wallchange", "footballlab:characterchange", "footballlab:liferestored"].forEach((eventName) => {
    window.addEventListener(eventName, queueUpdate);
  });

  document.addEventListener("fullscreenchange", queueUpdate);
}

function ensureInstallButton() {
  const actions = document.querySelector(".hero-actions");
  if (!actions) return null;
  let button = document.getElementById(INSTALL_ID);
  if (button) return button;

  button = document.createElement("button");
  button.id = INSTALL_ID;
  button.type = "button";
  button.className = "button button-secondary install-football-lab-v161";
  button.textContent = "INSTALL GAME";
  button.hidden = true;
  button.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    button.hidden = true;
  });
  actions.appendChild(button);
  return button;
}

function setupInstallPrompt() {
  const button = ensureInstallButton();
  if (!button) return;

  if (isStandalone()) {
    button.hidden = true;
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    button.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    button.hidden = true;
    document.body.classList.add("is-pwa-standalone-v161");
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" })
      .then((registration) => {
        window.__footballLabServiceWorkerReady = Boolean(registration);
      })
      .catch((error) => console.info("Offline shell was not registered", error));
  }, { once: true });
}

ensureStylesheet();
ensurePwaMetadata();
ensureHud();
ensureRunStrip();
setupInstallPrompt();
observeGameState();
registerServiceWorker();
queueUpdate();

window.__footballLabMobileShellV161 = true;
