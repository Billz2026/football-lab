import { clamp, state, elements, syncStage } from "./core-v6.js?v=32.4";

const BUILD = "50.0.0";
const PENALTY_CAMERA = Object.freeze({
  sideOffset: 0,
  backDistance: 7.5,
  height: 1.9,
  fovY: 36,
  targetHeight: 1.12
});
const ZONES = Object.freeze([
  Object.freeze({ id: "high-left", label: "TOP LEFT", short: "TL", x: 0.18, y: 0.18 }),
  Object.freeze({ id: "high-centre", label: "HIGH CENTRE", short: "HC", x: 0.50, y: 0.18 }),
  Object.freeze({ id: "high-right", label: "TOP RIGHT", short: "TR", x: 0.82, y: 0.18 }),
  Object.freeze({ id: "low-left", label: "LOW LEFT", short: "LL", x: 0.18, y: 0.76 }),
  Object.freeze({ id: "low-centre", label: "LOW CENTRE", short: "LC", x: 0.50, y: 0.76 }),
  Object.freeze({ id: "low-right", label: "LOW RIGHT", short: "LR", x: 0.82, y: 0.76 })
]);
const KEEPER_CUES = Object.freeze([
  "BOUNCING ON THE LINE",
  "HOLDING THE CENTRE",
  "SHUFFLING LEFT",
  "SHUFFLING RIGHT",
  "WAITING LATE",
  "SHOWING YOU ONE SIDE"
]);

let active = false;
let selectedZone = null;
let runUpCommitted = false;

function ensureStylesheet() {
  if (document.querySelector('link[data-penalty-experience-v50]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./game/penalty-experience-v50.css?v=50.0.0";
  link.dataset.penaltyExperienceV50 = "true";
  document.head.appendChild(link);
}

function isShootout() {
  return state.trainingConfig?.activity === "shootout"
    && document.documentElement.classList.contains("penalty-shootout-active-v49");
}

function zoneButtons() {
  return ZONES.map((zone, index) => `
    <button type="button" class="penalty-zone-v50" data-penalty-zone-v50="${zone.id}" aria-label="${zone.label}, penalty placement ${index + 1}">
      <span>${index + 1}</span><strong>${zone.short}</strong><small>${zone.label}</small>
    </button>`).join("");
}

function ensureUi() {
  let goalZones = document.getElementById("penaltyGoalZonesV50");
  if (!goalZones) {
    goalZones = document.createElement("div");
    goalZones.id = "penaltyGoalZonesV50";
    goalZones.className = "penalty-goal-zones-v50";
    goalZones.setAttribute("aria-label", "Choose penalty placement");
    goalZones.innerHTML = zoneButtons();
    document.querySelector(".game-frame")?.appendChild(goalZones);
    goalZones.querySelectorAll("[data-penalty-zone-v50]").forEach((button) => {
      button.addEventListener("click", () => selectZone(button.dataset.penaltyZoneV50));
    });
  }

  let panel = document.getElementById("penaltyControlV50");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "penaltyControlV50";
    panel.className = "penalty-control-v50";
    panel.setAttribute("aria-label", "Penalty controls");
    panel.innerHTML = `
      <div class="penalty-pressure-v50">
        <div><span>NERVE</span><strong id="penaltyPressureValueV50">24%</strong></div>
        <i><b id="penaltyPressureBarV50"></b></i>
      </div>
      <div class="penalty-read-v50">
        <span>KEEPER READ</span>
        <strong id="penaltyKeeperCueV50">BOUNCING ON THE LINE</strong>
        <small>Body language only — never a guaranteed dive.</small>
      </div>
      <div class="penalty-placement-v50">
        <span>PLACEMENT</span>
        <strong id="penaltyPlacementV50">NOT SELECTED</strong>
        <small id="penaltyPlacementHelpV50">Choose one of the six goal zones.</small>
      </div>
      <button class="button button-primary penalty-runup-v50" id="penaltyRunUpV50" type="button" disabled>
        START RUN-UP
      </button>`;
    const heading = document.querySelector(".control-panel .control-heading");
    if (heading?.parentElement) heading.insertAdjacentElement("afterend", panel);
    document.getElementById("penaltyRunUpV50")?.addEventListener("click", beginRunUp);
  }
  return { goalZones, panel };
}

function shootoutSnapshot() {
  return window.__footballLabPenaltyShootoutV49?.snapshot?.() || null;
}

function pressureForKick(snapshot) {
  const taken = Math.max(snapshot?.playerResults?.length || 0, snapshot?.opponentResults?.length || 0);
  const sudden = Math.max(0, taken - 5);
  return Math.round(clamp(24 + taken * 12 + sudden * 16, 24, 100));
}

function keeperCueForKick(snapshot) {
  const kick = Math.max(snapshot?.playerResults?.length || 0, snapshot?.opponentResults?.length || 0);
  const difficultyOffset = ({ academy: 0, pro: 1, elite: 2, world: 3 })[snapshot?.difficultyId] || 0;
  return KEEPER_CUES[(kick + difficultyOffset) % KEEPER_CUES.length];
}

function updatePressure() {
  const snapshot = shootoutSnapshot();
  const pressure = pressureForKick(snapshot);
  const value = document.getElementById("penaltyPressureValueV50");
  const bar = document.getElementById("penaltyPressureBarV50");
  const cue = document.getElementById("penaltyKeeperCueV50");
  if (value) value.textContent = `${pressure}%`;
  if (bar) bar.style.width = `${pressure}%`;
  if (cue) cue.textContent = keeperCueForKick(snapshot);
  document.documentElement.classList.toggle("penalty-pressure-high-v50", pressure >= 72);
}

function setPenaltyCamera() {
  const scenario = globalThis.__footballLabTrainingScenario;
  if (!scenario || state.trainingConfig?.activity !== "shootout") return;
  scenario.camera = { ...PENALTY_CAMERA };
  scenario.penaltyExperience = "v50-six-zone-one-v-one";
  scenario.penaltyCurl = false;
  scenario.penaltyRunUp = "deliberate";
  syncStage();
  state.stageWind = 0;
}

function resetPlacement() {
  selectedZone = null;
  runUpCommitted = false;
  document.querySelectorAll("[data-penalty-zone-v50]").forEach((button) => button.classList.remove("is-selected"));
  const copy = document.getElementById("penaltyPlacementV50");
  const help = document.getElementById("penaltyPlacementHelpV50");
  const runUp = document.getElementById("penaltyRunUpV50");
  if (copy) copy.textContent = "NOT SELECTED";
  if (help) help.textContent = "Choose one of the six goal zones.";
  if (runUp) {
    runUp.disabled = true;
    runUp.textContent = "START RUN-UP";
  }
}

function selectZone(id) {
  if (!active || state.phase !== "aim") return;
  const zone = ZONES.find((item) => item.id === id);
  if (!zone) return;
  selectedZone = zone;
  runUpCommitted = false;
  window.__footballLabStrikeV324?.setTarget(zone.x, zone.y);
  window.__footballLabStrikeV324?.setCurve(0);
  document.querySelectorAll("[data-penalty-zone-v50]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.penaltyZoneV50 === zone.id);
  });
  const copy = document.getElementById("penaltyPlacementV50");
  const help = document.getElementById("penaltyPlacementHelpV50");
  const runUp = document.getElementById("penaltyRunUpV50");
  if (copy) copy.textContent = zone.label;
  if (help) help.textContent = "Placement locked. The keeper can still read you.";
  if (runUp) runUp.disabled = false;
  if (elements.canvasPrompt) elements.canvasPrompt.textContent = `${zone.label} LOCKED · START RUN-UP`;
}

function beginRunUp() {
  if (!active || state.phase !== "aim" || !selectedZone || runUpCommitted) return;
  runUpCommitted = true;
  window.__footballLabStrikeV324?.setTarget(selectedZone.x, selectedZone.y);
  window.__footballLabStrikeV324?.setCurve(0);
  const button = document.getElementById("penaltyRunUpV50");
  if (button) {
    button.disabled = true;
    button.textContent = "COMMITTED";
  }
  if (elements.canvasPrompt) elements.canvasPrompt.textContent = "RUN-UP COMMITTED · HOLD YOUR NERVE";
  document.documentElement.classList.add("penalty-runup-committed-v50");
  setTimeout(() => {
    if (!active || state.phase !== "aim") return;
    window.dispatchEvent(new CustomEvent("footballlab:beginstrike"));
  }, 260);
}

function phaseCopy(phase) {
  return ({
    ready: ["ON THE SPOT", "Settle yourself. Read the goalkeeper, then step up to choose your finish.", "STEP UP", "PENALTY"],
    aim: ["PICK YOUR FINISH", "Choose one of six fixed goal zones. There is no free-kick curl control in a shootout.", "", "PLACEMENT"],
    power: ["RUN-UP", "Commit the pace. Too much power makes placement harder; too little gives the keeper time.", "LOCK POWER", "STRIKE POWER"],
    contact: ["KEEP YOUR NERVE", "Final contact. Centre the timing window under pressure to send the keeper the wrong way.", "STRIKE", "COMPOSURE"],
    shooting: ["NO TURNING BACK", "The decision is made. Watch the keeper and the ball.", "SHOT IN PLAY", "LOCKED"],
    result: ["DECISION", "The shootout updates after the opponent reply.", "NEXT PENALTY", "RESULT"],
    paused: ["SHOOTOUT COMPLETE", "The result is final.", "", "FULL TIME"]
  })[phase] || ["PENALTY SHOOTOUT", "Hold your nerve.", "", "PENALTY"];
}

function renderPenaltyPresentation() {
  if (!active || !isShootout()) return;
  ensureUi();
  const root = document.documentElement;
  root.dataset.penaltyPhaseV50 = state.phase;
  const [title, help, action, meter] = phaseCopy(state.phase);
  const sectionLabel = document.querySelector(".control-panel .control-heading .section-label");
  if (sectionLabel) sectionLabel.textContent = "PENALTY CONTROL";
  if (elements.phaseTitle) elements.phaseTitle.textContent = title;
  if (elements.phaseHelp) elements.phaseHelp.textContent = help;
  if (elements.meterLabel) elements.meterLabel.textContent = meter;
  if (elements.shotAction && action) elements.shotAction.textContent = action;
  if (state.phase === "aim") {
    window.__footballLabStrikeV324?.setCurve(0);
    if (elements.curveReadout) elements.curveReadout.textContent = "LOCKED · NO CURL";
  }
  if (state.phase !== "aim") document.documentElement.classList.remove("penalty-runup-committed-v50");
  updatePressure();
}

function schedulePresentation() {
  queueMicrotask(() => queueMicrotask(renderPenaltyPresentation));
}

function activateExperience() {
  if (!isShootout()) return;
  active = true;
  ensureUi();
  document.documentElement.classList.add("penalty-experience-v50");
  setPenaltyCamera();
  resetPlacement();
  renderPenaltyPresentation();
  schedulePresentation();
}

function cleanupExperience() {
  if (!active && !document.documentElement.classList.contains("penalty-experience-v50")) return;
  active = false;
  selectedZone = null;
  runUpCommitted = false;
  const root = document.documentElement;
  root.classList.remove("penalty-experience-v50", "penalty-pressure-high-v50", "penalty-runup-committed-v50");
  delete root.dataset.penaltyPhaseV50;
  const sectionLabel = document.querySelector(".control-panel .control-heading .section-label");
  if (sectionLabel) sectionLabel.textContent = "SHOT CONTROL";
  resetPlacement();
}

function blockFreeAimPointer(event) {
  if (!active || state.phase !== "aim" || !isShootout()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function handlePenaltyKeys(event) {
  if (!active || state.phase !== "aim" || !isShootout()) return;
  const key = event.key.toLowerCase();
  const numeric = Number(key);
  if (numeric >= 1 && numeric <= ZONES.length) {
    event.preventDefault();
    event.stopImmediatePropagation();
    selectZone(ZONES[numeric - 1].id);
    return;
  }
  if (key === " " || key === "spacebar") {
    event.preventDefault();
    event.stopImmediatePropagation();
    beginRunUp();
    return;
  }
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d", "q", "e"].includes(key)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}

function publishReleaseMetadata() {
  const old = window.__footballLabReleaseV490;
  if (!old) return false;
  const release = Object.freeze({
    ...old,
    build: BUILD,
    penaltyExperience: "dedicated-six-zone-one-v-one",
    penaltyCamera: "close-centred-behind-taker",
    penaltyPlacement: "six-fixed-goal-zones",
    penaltyCurl: "disabled",
    penaltyExecution: "placement-run-up-power-composure",
    penaltyKeeperRead: "body-language-non-guaranteed",
    penaltyPressurePresentation: "progressive-nerve-meter",
    cacheGeneration: BUILD
  });
  window.__footballLabReleaseV500 = release;
  document.documentElement.dataset.footballLabPenaltyExperienceBuild = BUILD;
  const badge = document.querySelector(".build-badge-v22");
  if (badge) {
    badge.textContent = "V50.0";
    badge.title = `Football Lab build ${BUILD}`;
  }
  const version = document.querySelector(".settings-version-v22 strong");
  if (version) version.textContent = BUILD;
  return true;
}

ensureStylesheet();
ensureUi();

elements.canvas?.addEventListener("pointerdown", blockFreeAimPointer, { capture: true, passive: false });
elements.canvas?.addEventListener("pointermove", blockFreeAimPointer, { capture: true, passive: false });
document.addEventListener("keydown", handlePenaltyKeys, { capture: true });

window.addEventListener("footballlab:trainingstart", () => {
  queueMicrotask(() => queueMicrotask(() => {
    if (isShootout()) activateExperience();
    else cleanupExperience();
  }));
});

window.addEventListener("footballlab:phasechange", (event) => {
  if (!active || !isShootout()) return;
  if (event.detail?.phase === "ready") resetPlacement();
  if (event.detail?.phase === "aim") {
    runUpCommitted = false;
    window.__footballLabStrikeV324?.setCurve(0);
  }
  renderPenaltyPresentation();
  schedulePresentation();
});

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest("#exitGame,#brandButton") : null;
  if (!target || !active) return;
  setTimeout(() => {
    if (!isShootout()) cleanupExperience();
  }, 0);
}, true);

const releaseTimer = setInterval(() => {
  if (publishReleaseMetadata()) clearInterval(releaseTimer);
}, 60);
setTimeout(() => clearInterval(releaseTimer), 10000);

window.__footballLabPenaltyExperienceV50 = Object.freeze({
  build: BUILD,
  camera: { ...PENALTY_CAMERA },
  zones: ZONES.map((zone) => ({ ...zone })),
  curlEnabled: false,
  freeAimEnabled: false,
  snapshot: () => ({
    active,
    phase: state.phase,
    selectedZone: selectedZone?.id || null,
    selectedLabel: selectedZone?.label || null,
    pressure: pressureForKick(shootoutSnapshot()),
    camera: globalThis.__footballLabTrainingScenario?.camera ? { ...globalThis.__footballLabTrainingScenario.camera } : null
  })
});
