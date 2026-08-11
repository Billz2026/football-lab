import { state, elements } from "./core-v6.js?v=31";

const BUILD = "22.0.0";
const SETTINGS_KEY = "footballLabSettingsV22";
const TUTORIAL_KEY = "footballLabTutorialV22";

const defaultSettings = Object.freeze({
  sound: true,
  haptics: true,
  reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false,
  highContrast: false
});

function readSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { ...defaultSettings };
  }
}

const settings = readSettings();
let lastDialogOpener = null;
let tutorialTarget = null;
let pausedPhase = null;
let updateReloadRequested = false;
const dialogOpeners = new WeakMap();
const nativeVibrate = navigator.vibrate?.bind(navigator);

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applySettings() {
  document.documentElement.classList.toggle("reduced-motion-v22", settings.reducedMotion);
  document.documentElement.classList.toggle("high-contrast-v22", settings.highContrast);
  document.documentElement.dataset.soundEnabled = String(settings.sound);
  document.documentElement.dataset.hapticsEnabled = String(settings.haptics);

  if (state.audioContext) {
    const action = settings.sound ? state.audioContext.resume?.() : state.audioContext.suspend?.();
    action?.catch?.(() => {});
  }

  document.querySelectorAll("[data-setting]").forEach((button) => {
    const key = button.dataset.setting;
    const enabled = Boolean(settings[key]);
    button.setAttribute("aria-checked", String(enabled));
    button.dataset.enabled = String(enabled);
    const value = button.querySelector("[data-setting-value]");
    if (value) value.textContent = enabled ? "ON" : "OFF";
  });
}

try {
  if (nativeVibrate) {
    navigator.vibrate = (pattern) => settings.haptics ? nativeVibrate(pattern) : false;
  }
} catch {
  // Some browsers expose a non-writable vibrate method. The game still remains usable.
}

function toast(message, action = null) {
  let region = document.querySelector("#toastRegionV22");
  if (!region) {
    region = document.createElement("div");
    region.id = "toastRegionV22";
    region.className = "toast-region-v22";
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }

  const item = document.createElement("div");
  item.className = "toast-v22";
  item.innerHTML = `<span></span>`;
  item.querySelector("span").textContent = message;
  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.addEventListener("click", action.handler, { once: true });
    item.appendChild(button);
  }
  region.appendChild(item);
  requestAnimationFrame(() => item.classList.add("is-visible"));
  if (!action) {
    setTimeout(() => {
      item.classList.remove("is-visible");
      setTimeout(() => item.remove(), 220);
    }, 2600);
  }
}

function injectHeaderControls() {
  const header = document.querySelector(".site-header");
  const stats = document.querySelector(".header-stats");
  if (!header || !stats || document.querySelector("#settingsButtonV22")) return;

  const controls = document.createElement("div");
  controls.className = "header-tools-v22";
  controls.innerHTML = `
    <span class="build-badge-v22" title="Football Lab build ${BUILD}">V22</span>
    <button class="settings-button-v22" id="settingsButtonV22" type="button" aria-haspopup="dialog" aria-controls="settingsModalV22" aria-label="Open settings">⚙</button>
  `;
  stats.before(controls);
}

function settingRow(key, title, description) {
  return `
    <div class="setting-row-v22">
      <div><strong>${title}</strong><span>${description}</span></div>
      <button class="setting-toggle-v22" type="button" role="switch" data-setting="${key}" aria-checked="false">
        <i aria-hidden="true"></i><b data-setting-value>OFF</b>
      </button>
    </div>`;
}

function injectSettingsModal() {
  if (document.querySelector("#settingsModalV22")) return;
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "settingsModalV22";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "settingsTitleV22");
  modal.innerHTML = `
    <div class="modal-backdrop" data-close-settings></div>
    <section class="modal-card panel settings-card-v22">
      <button class="modal-close" type="button" data-close-settings aria-label="Close settings">×</button>
      <span class="section-label">GAME SETTINGS</span>
      <h2 id="settingsTitleV22">CONTROL THE EXPERIENCE.</h2>
      <p>Preferences are saved on this device. Football Lab does not require an account.</p>
      <div class="settings-list-v22">
        ${settingRow("sound", "Sound effects", "Impact, crowd and result audio.")}
        ${settingRow("haptics", "Haptic feedback", "Vibration on supported phones and controllers.")}
        ${settingRow("reducedMotion", "Reduced motion", "Minimises interface animation and camera movement.")}
        ${settingRow("highContrast", "High-contrast aiming", "Strengthens the meter, target and focus indicators.")}
      </div>
      <div class="settings-actions-v22">
        <button class="button button-secondary" id="fullscreenButtonV22" type="button">ENTER FULL SCREEN</button>
        <button class="button button-secondary" id="resetTutorialV22" type="button">RESET TUTORIAL</button>
      </div>
      <div class="settings-version-v22"><span>BUILD</span><strong>${BUILD}</strong></div>
    </section>`;
  document.body.appendChild(modal);
}

function openDialog(modal, opener = document.activeElement) {
  if (!modal) return;
  lastDialogOpener = opener instanceof HTMLElement ? opener : null;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  const focusable = modal.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
  requestAnimationFrame(() => focusable?.focus());
}

function closeDialog(modal) {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  if (lastDialogOpener?.isConnected) lastDialogOpener.focus();
  lastDialogOpener = null;
}

function visibleDialog() {
  const dialogs = [...document.querySelectorAll("[role='dialog'].is-open, .kicker-select-shell.is-open")];
  return dialogs.at(-1) || null;
}

function focusables(container) {
  return [...container.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")]
    .filter((element) => !element.hasAttribute("hidden") && element.getClientRects().length > 0);
}

function bindAccessibility() {
  document.addEventListener("keydown", (event) => {
    const dialog = visibleDialog();
    if (!dialog) return;

    if (event.key === "Tab") {
      const items = focusables(dialog);
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (event.key !== "Escape") return;
    if (dialog.id === "gameOverModal") return;
    event.preventDefault();
    if (dialog.id === "settingsModalV22") {
      closeDialog(dialog);
      return;
    }
    const close = dialog.querySelector("[data-close-modal], [data-close-preview], [data-kicker-close], .modal-close");
    close?.click();
  }, true);

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const target = record.target;
      if (!(target instanceof HTMLElement) || record.attributeName !== "class") continue;
      if (!target.matches("[role='dialog'], .kicker-select-shell")) continue;
      if (target.classList.contains("is-open")) {
        if (!dialogOpeners.has(target) && document.activeElement instanceof HTMLElement) {
          dialogOpeners.set(target, document.activeElement);
        }
        const first = focusables(target)[0];
        requestAnimationFrame(() => first?.focus());
      } else {
        const opener = dialogOpeners.get(target);
        dialogOpeners.delete(target);
        if (opener?.isConnected) requestAnimationFrame(() => opener.focus());
      }
    }
  });

  document.querySelectorAll("[role='dialog'], .kicker-select-shell").forEach((dialog) => {
    observer.observe(dialog, { attributes: true, attributeFilter: ["class"] });
  });

  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches?.("[role='dialog'], .kicker-select-shell")) {
          observer.observe(node, { attributes: true, attributeFilter: ["class"] });
        }
        node.querySelectorAll?.("[role='dialog'], .kicker-select-shell").forEach((dialog) => {
          observer.observe(dialog, { attributes: true, attributeFilter: ["class"] });
        });
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}

function bindSettings() {
  const button = document.querySelector("#settingsButtonV22");
  const modal = document.querySelector("#settingsModalV22");
  button?.addEventListener("click", () => openDialog(modal, button));
  modal?.querySelectorAll("[data-close-settings]").forEach((close) => close.addEventListener("click", () => closeDialog(modal)));

  modal?.querySelectorAll("[data-setting]").forEach((toggle) => {
    toggle.addEventListener("click", async () => {
      const key = toggle.dataset.setting;
      settings[key] = !settings[key];
      saveSettings();
      applySettings();
      if (key === "sound" && settings.sound && state.audioContext?.state === "suspended") {
        await state.audioContext.resume().catch(() => {});
      }
    });
  });

  document.querySelector("#fullscreenButtonV22")?.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      toast("Full screen is not available in this browser.");
    }
  });

  document.addEventListener("fullscreenchange", () => {
    const fullScreenButton = document.querySelector("#fullscreenButtonV22");
    if (fullScreenButton) fullScreenButton.textContent = document.fullscreenElement ? "EXIT FULL SCREEN" : "ENTER FULL SCREEN";
  });

  document.querySelector("#resetTutorialV22")?.addEventListener("click", () => {
    localStorage.removeItem(TUTORIAL_KEY);
    toast("Tutorial reset. It will appear on the next run.");
  });
}

function injectShareAction() {
  const actions = document.querySelector("#gameOverModal .modal-actions");
  if (!actions || document.querySelector("#shareScoreV22")) return;
  const button = document.createElement("button");
  button.className = "button button-secondary share-score-v22";
  button.id = "shareScoreV22";
  button.type = "button";
  button.textContent = "SHARE SCORE";
  actions.appendChild(button);

  button.addEventListener("click", async () => {
    const score = elements.finalScore?.textContent?.trim() || "0";
    const kicker = document.querySelector(".active-kicker-chip-v13 strong")?.textContent?.trim();
    const text = `I scored ${score} in Football Lab${kicker ? ` with ${kicker}` : ""}. Can you beat it?`;
    const url = "https://billz2026.github.io/football-lab/index.html";
    try {
      if (navigator.share) await navigator.share({ title: "Football Lab", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast("Score copied to your clipboard.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") toast("The score could not be shared on this device.");
    }
  });
}

function injectTutorial() {
  if (document.querySelector("#tutorialV22")) return;
  const tutorial = document.createElement("aside");
  tutorial.id = "tutorialV22";
  tutorial.className = "tutorial-v22";
  tutorial.setAttribute("aria-live", "polite");
  tutorial.innerHTML = `
    <div class="tutorial-card-v22">
      <span>FIRST-RUN COACH</span>
      <strong id="tutorialTitleV22"></strong>
      <p id="tutorialCopyV22"></p>
      <button id="skipTutorialV22" type="button">SKIP TUTORIAL</button>
    </div>`;
  document.body.appendChild(tutorial);
  tutorial.querySelector("#skipTutorialV22")?.addEventListener("click", () => {
    localStorage.setItem(TUTORIAL_KEY, "skipped");
    hideTutorial();
    toast("Tutorial skipped. You can reset it in Settings.");
  });
}

const tutorialSteps = {
  ready: {
    title: "Start your run",
    copy: "Press START SHOT. The next three taps lock power, placement and curve.",
    target: () => elements.shotAction
  },
  power: {
    title: "Lock the power",
    copy: "Tap when the white marker reaches the bright contact zone. Too much power sends the ball high.",
    target: () => document.querySelector(".meter-wrap")
  },
  aim: {
    title: "Pick your side",
    copy: "Watch the target sweep across the goal. Corners score more, but the wall and keeper cover space.",
    target: () => document.querySelector(".game-frame")
  },
  curve: {
    title: "Shape the strike",
    copy: "Lock left, centre or right curve. Use bend to clear the wall and counter the wind.",
    target: () => document.querySelector(".meter-wrap")
  }
};

function hideTutorial() {
  const tutorial = document.querySelector("#tutorialV22");
  tutorial?.classList.remove("is-visible");
  tutorialTarget?.classList.remove("tutorial-target-v22");
  tutorialTarget = null;
}

function positionTutorial(target) {
  const tutorial = document.querySelector("#tutorialV22");
  const card = tutorial?.querySelector(".tutorial-card-v22");
  if (!tutorial || !card || !target) return;
  const rect = target.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const margin = 14;
  let top = rect.top - cardRect.height - margin;
  if (top < margin) top = rect.bottom + margin;
  top = Math.max(margin, Math.min(top, innerHeight - cardRect.height - margin));
  const left = Math.max(margin, Math.min(rect.left + rect.width / 2 - cardRect.width / 2, innerWidth - cardRect.width - margin));
  card.style.top = `${top}px`;
  card.style.left = `${left}px`;
}

function renderTutorialStep(step) {
  const tutorial = document.querySelector("#tutorialV22");
  if (!tutorial || !step) return;
  const target = step.target();
  if (!target) return;
  tutorial.querySelector("#tutorialTitleV22").textContent = step.title;
  tutorial.querySelector("#tutorialCopyV22").textContent = step.copy;
  if (tutorialTarget !== target) {
    tutorialTarget?.classList.remove("tutorial-target-v22");
    tutorialTarget = target;
    tutorialTarget.classList.add("tutorial-target-v22");
  }
  tutorial.classList.add("is-visible");
  requestAnimationFrame(() => positionTutorial(target));
}

function watchTutorial() {
  let previousPhase = null;
  setInterval(() => {
    if (localStorage.getItem(TUTORIAL_KEY)) {
      hideTutorial();
      return;
    }
    if (state.screen !== "game" || state.phase === "paused") {
      hideTutorial();
      return;
    }
    if (["shooting", "result"].includes(state.phase)) {
      localStorage.setItem(TUTORIAL_KEY, "complete");
      hideTutorial();
      toast("Tutorial complete. Chase your personal best.");
      return;
    }
    if (state.phase !== previousPhase) {
      previousPhase = state.phase;
      renderTutorialStep(tutorialSteps[state.phase]);
    } else if (tutorialTarget) {
      positionTutorial(tutorialTarget);
    }
  }, 120);
  window.addEventListener("resize", () => tutorialTarget && positionTutorial(tutorialTarget));
}

function injectPauseOverlay() {
  if (document.querySelector("#pauseOverlayV22")) return;
  const overlay = document.createElement("div");
  overlay.id = "pauseOverlayV22";
  overlay.className = "pause-overlay-v22";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="panel pause-card-v22" role="dialog" aria-modal="true" aria-labelledby="pauseTitleV22">
      <span class="section-label">GAME PAUSED</span>
      <h2 id="pauseTitleV22">READY WHEN YOU ARE.</h2>
      <p>The timing meter was frozen when the tab lost focus.</p>
      <div><button class="button button-primary" id="resumeGameV22" type="button">RESUME</button><button class="button button-secondary" id="exitPausedGameV22" type="button">MAIN MENU</button></div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector("#resumeGameV22")?.addEventListener("click", resumeFromPause);
  overlay.querySelector("#exitPausedGameV22")?.addEventListener("click", () => {
    resumeFromPause();
    elements.exitGame?.click();
  });
}

function pauseForVisibility() {
  if (state.screen !== "game" || pausedPhase || !["ready", "power", "aim", "curve"].includes(state.phase)) return;
  pausedPhase = state.phase;
  state.phase = "paused";
  hideTutorial();
}

function showPauseOverlay() {
  if (!pausedPhase) return;
  const overlay = document.querySelector("#pauseOverlayV22");
  overlay?.classList.add("is-visible");
  overlay?.setAttribute("aria-hidden", "false");
  overlay?.querySelector("[role='dialog']")?.classList.add("is-open");
  requestAnimationFrame(() => overlay?.querySelector("#resumeGameV22")?.focus());
}

function resumeFromPause() {
  if (!pausedPhase) return;
  state.phase = pausedPhase;
  pausedPhase = null;
  state.lastTime = performance.now();
  state.actionLockedUntil = performance.now() + 120;
  const overlay = document.querySelector("#pauseOverlayV22");
  overlay?.classList.remove("is-visible");
  overlay?.setAttribute("aria-hidden", "true");
  overlay?.querySelector("[role='dialog']")?.classList.remove("is-open");
}

function bindVisibilityPause() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseForVisibility();
    else showPauseOverlay();
  });
}

function attachServiceWorker(registration) {
  if (!registration || registration.__footballLabV22Bound) return;
  registration.__footballLabV22Bound = true;

  const offerUpdate = () => {
    const worker = registration.waiting;
    if (!worker) return;
    toast("A new Football Lab build is ready.", {
      label: "RELOAD",
      handler: () => {
        updateReloadRequested = true;
        worker.postMessage({ type: "SKIP_WAITING" });
      }
    });
  };

  offerUpdate();
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) offerUpdate();
    });
  });
}

function bindServiceWorkerUpdates() {
  if (window.__footballLabServiceWorkerRegistration) {
    attachServiceWorker(window.__footballLabServiceWorkerRegistration);
  }
  window.addEventListener("footballlab:swready", (event) => attachServiceWorker(event.detail?.registration));
  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    if (!updateReloadRequested) return;
    updateReloadRequested = false;
    location.reload();
  });
}

function enhanceModeHierarchy() {
  const heading = document.querySelector("#modesTitle");
  if (heading) heading.textContent = "PLAY NOW. SEE WHAT'S NEXT.";
  const copy = document.querySelector(".modes-section .section-heading p");
  if (copy) copy.textContent = "Classic Kicks is the complete playable mode. Future modes stay secondary until they are ready.";
  document.querySelectorAll(".mode-card:not(.mode-card-active)").forEach((card) => card.setAttribute("aria-description", "Preview of a planned game mode"));
}

function initialise() {
  injectHeaderControls();
  injectSettingsModal();
  injectShareAction();
  injectTutorial();
  injectPauseOverlay();
  enhanceModeHierarchy();
  bindSettings();
  bindAccessibility();
  bindVisibilityPause();
  bindServiceWorkerUpdates();
  applySettings();
  watchTutorial();
  window.__footballLabProductPolishV22 = { build: BUILD, settings };
}

initialise();
