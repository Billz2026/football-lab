import {
  state, elements, syncStage, setStageWind, renderHud, openModal
} from "./core-v6.js?v=32.4";

const BUILD = "48.0.1";
const modal = document.getElementById("trainingModalV35");

if (!modal) {
  throw new Error("Penalty Training V48 requires the Training Ground V35 modal");
}

const activityButtons = [...modal.querySelectorAll(".training-activity-v35")];
const freeKickButton = activityButtons.find((button) => button.textContent.includes("FREE KICKS"));
const penaltyButton = activityButtons.find((button) => button.textContent.includes("PENALTIES"));
const startButton = document.getElementById("trainingStartV35");
const intro = modal.querySelector(".training-intro-v35");
const takerField = document.getElementById("trainingTakerV35");
const distanceField = document.getElementById("trainingDistanceV35");
const positionField = document.getElementById("trainingPositionV35");
const wallCountField = document.getElementById("trainingWallCountV35");
const wallField = document.getElementById("trainingWallV35");
const windField = document.getElementById("trainingWindV35");
const distanceCopy = document.getElementById("trainingDistanceCopyV35");
const positionCopy = document.getElementById("trainingPositionCopyV35");
const hubPenaltyTile = document.querySelector(".hub-mode-penalties");

let penaltySelected = false;
let freeKickSnapshot = null;

function fieldContainer(field) {
  return field?.closest(".training-field-v35") || null;
}

const penaltyLockedFields = [distanceField, positionField, wallCountField, wallField, windField].filter(Boolean);

function rememberFreeKickSetup() {
  if (penaltySelected || freeKickSnapshot) return;
  freeKickSnapshot = {
    distance: distanceField?.value || "25",
    ballX: positionField?.value || "0",
    wallPlayers: wallCountField?.value || "4",
    wallId: wallField?.value || "academy-line",
    windId: windField?.value || "off"
  };
}

function setLockedPresentation(locked) {
  penaltyLockedFields.forEach((field) => {
    field.disabled = locked;
    const container = fieldContainer(field);
    if (container) {
      container.classList.toggle("penalty-fixed-v48", locked);
      container.setAttribute("aria-disabled", locked ? "true" : "false");
      container.style.opacity = locked ? "0.58" : "";
    }
  });
}

function setActivity(mode) {
  const nextPenalty = mode === "penalties";
  if (nextPenalty && !penaltySelected) rememberFreeKickSetup();
  penaltySelected = nextPenalty;

  freeKickButton?.classList.toggle("is-active", !penaltySelected);
  penaltyButton?.classList.toggle("is-active", penaltySelected);

  const takerLabel = takerField?.closest("label")?.querySelector(":scope > span");
  if (takerLabel) takerLabel.textContent = penaltySelected ? "PENALTY TAKER" : "FREE-KICK TAKER";

  if (penaltySelected) {
    if (distanceField) {
      distanceField.min = "12";
      distanceField.max = "12";
      distanceField.value = "12";
    }
    if (positionField) positionField.value = "0";
    if (wallCountField) wallCountField.value = "0";
    if (windField) windField.value = "off";
    if (distanceCopy) distanceCopy.textContent = "12 YDS · PENALTY SPOT";
    if (positionCopy) positionCopy.textContent = "CENTRAL · FIXED";
    if (intro) intro.textContent = "Penalty practice is live. Pick a taker, choose the goalkeeper and rehearse placement, power and contact from the spot with unlimited attempts.";
    if (startButton) startButton.textContent = "START PENALTY TRAINING";
    setLockedPresentation(true);
  } else {
    setLockedPresentation(false);
    if (distanceField) {
      distanceField.min = "16";
      distanceField.max = "45";
      distanceField.value = freeKickSnapshot?.distance || distanceField.value || "25";
    }
    if (positionField) positionField.value = freeKickSnapshot?.ballX || positionField.value || "0";
    if (wallCountField) wallCountField.value = freeKickSnapshot?.wallPlayers || wallCountField.value || "4";
    if (wallField) wallField.value = freeKickSnapshot?.wallId || wallField.value || "academy-line";
    if (windField) windField.value = freeKickSnapshot?.windId || windField.value || "off";
    if (distanceCopy) distanceCopy.textContent = `${Math.round(Number(distanceField?.value) || 25)} YDS`;
    if (positionCopy) positionCopy.textContent = "CENTRAL";
    if (intro) intro.textContent = "Unlimited practice with no lives, score farming or career penalties. Free Kicks and Penalties are playable now; future Football Lab activities plug into this same sandbox.";
    if (startButton) startButton.textContent = "START FREE TRAINING";
  }
}

function penaltyCamera() {
  return {
    sideOffset: -0.32,
    backDistance: 9.1,
    height: 2.72,
    fovY: 43,
    targetHeight: 1.02
  };
}

function updatePenaltyHud() {
  if (state.gameMode !== "training" || state.trainingConfig?.activity !== "penalties") return;
  const attempts = Number(state.trainingAttempts) || 0;
  const goals = Number(state.trainingGoals) || 0;
  const accuracy = attempts ? Math.round(goals / attempts * 100) : 0;

  if (elements.stageNumber && elements.stageNumber.textContent !== "PENALTY TRAINING · 12 YDS") elements.stageNumber.textContent = "PENALTY TRAINING · 12 YDS";
  if (elements.stageName && elements.stageName.textContent !== "ONE VS ONE · PENALTY SPOT") elements.stageName.textContent = "ONE VS ONE · PENALTY SPOT";
  if (elements.scoreValue) elements.scoreValue.textContent = String(attempts);
  if (elements.streakValue) elements.streakValue.textContent = String(goals);
  if (elements.livesValue) elements.livesValue.textContent = `${accuracy}%`;
  if (elements.windArrow) elements.windArrow.textContent = "•";
  if (elements.windValue) elements.windValue.textContent = "0.0 m/s";

  const chip = document.querySelector(".training-session-chip-v35");
  if (chip && chip.textContent !== "PENALTY TRAINING · UNLIMITED ATTEMPTS") chip.textContent = "PENALTY TRAINING · UNLIMITED ATTEMPTS";

  const sessionMode = document.querySelector(".training-session-mode-v355");
  if (sessionMode && sessionMode.textContent !== "PENALTY TRAINING") sessionMode.textContent = "PENALTY TRAINING";

  if (state.phase === "ready") {
    if (elements.phaseHelp) elements.phaseHelp.textContent = "Pick your corner, shape the strike, then execute power and contact. The keeper will punish predictable placement.";
    if (elements.canvasPrompt) elements.canvasPrompt.textContent = "PENALTY SPOT · ONE VS ONE";
  } else if (state.phase === "result") {
    if (elements.phaseHelp) elements.phaseHelp.textContent = "Review the penalty, then go again. Accuracy is tracked without affecting career records.";
  }
}

function schedulePenaltyHud() {
  updatePenaltyHud();
  requestAnimationFrame(() => {
    updatePenaltyHud();
    requestAnimationFrame(updatePenaltyHud);
  });
}

function applyPenaltyScenario() {
  const scenario = globalThis.__footballLabTrainingScenario;
  if (!scenario || state.gameMode !== "training") return;

  Object.assign(scenario, {
    active: true,
    training: true,
    id: "training-penalty",
    name: "PENALTY TRAINING",
    label: "12 YARDS · PENALTY SPOT · NO WALL",
    distanceYards: 12,
    ballX: 0,
    wallPlayers: 0,
    protectedGoalX: 0,
    keeperX: 0,
    wind: 0,
    windVariance: 0,
    keeper: 0.31,
    aimSpeed: 0.92,
    keeperTier: 1,
    wallTier: 1,
    chapterNumber: 0,
    chapterName: "PENALTY TRAINING",
    chapterStage: 0,
    totalCampaignStages: 0,
    venue: "FOOTBALL LAB PENALTY AREA",
    environment: "academy",
    weather: "CALM",
    weatherId: "training",
    weatherSeverity: 0,
    difficulty: 0.16,
    camera: penaltyCamera(),
    trainingPenalty: true
  });

  state.trainingConfig = {
    ...(state.trainingConfig || {}),
    activity: "penalties",
    distance: 12,
    ballX: 0,
    wallPlayers: 0,
    windId: "off"
  };
  state.stageWind = 0;
  syncStage();
  setStageWind();
  state.stageWind = 0;
  renderHud();
  document.documentElement.classList.add("penalty-training-v48");
  schedulePenaltyHud();
}

function activateHubPenaltyTile() {
  if (!hubPenaltyTile) return;
  hubPenaltyTile.disabled = false;
  hubPenaltyTile.setAttribute("aria-disabled", "false");
  const status = hubPenaltyTile.querySelector(".hub-mode-status");
  const copy = hubPenaltyTile.querySelector(".hub-tile-copy p");
  const cta = hubPenaltyTile.querySelector(".hub-mode-cta");
  if (status) status.textContent = "TRAINING LIVE";
  if (copy) copy.textContent = "Unlimited penalty practice is now live in the Training Ground. Competitive shootouts remain in development.";
  if (cta) cta.innerHTML = "ENTER PENALTY TRAINING <b>→</b>";
  hubPenaltyTile.addEventListener("click", () => {
    setActivity("penalties");
    openModal(modal);
  });
}

if (penaltyButton) {
  penaltyButton.disabled = false;
  penaltyButton.removeAttribute("disabled");
  penaltyButton.innerHTML = "<strong>PENALTIES</strong><small>PLAYABLE NOW</small>";
  penaltyButton.addEventListener("click", () => setActivity("penalties"));
}

freeKickButton?.addEventListener("click", () => setActivity("free-kicks"));

window.addEventListener("footballlab:trainingstart", () => {
  if (!penaltySelected) {
    document.documentElement.classList.remove("penalty-training-v48");
    return;
  }
  applyPenaltyScenario();
});

window.addEventListener("footballlab:trainingreset", () => {
  if (state.trainingConfig?.activity === "penalties") schedulePenaltyHud();
});

window.addEventListener("footballlab:phasechange", () => {
  if (state.trainingConfig?.activity !== "penalties") return;
  schedulePenaltyHud();
});

[elements.exitGame, elements.brandButton].filter(Boolean).forEach((button) => {
  button.addEventListener("click", () => {
    if (state.trainingConfig?.activity === "penalties") {
      document.documentElement.classList.remove("penalty-training-v48");
    }
  });
});

activateHubPenaltyTile();
setActivity("free-kicks");

window.__footballLabPenaltyTrainingV48 = Object.freeze({
  build: BUILD,
  activity: "penalties",
  distanceYards: 12,
  unlimitedAttempts: true,
  competitiveMode: false,
  careerRecordsAffected: false,
  hudOwnership: "post-listener-animation-frame"
});

await import("./penalty-shootout-v49.js?v=49.0.0");
