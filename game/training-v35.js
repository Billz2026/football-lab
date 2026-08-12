import {
  clamp, state, elements, createShot, syncStage, setStageWind,
  showScreen, openModal, closeModal, setPhase, renderHud
} from "./core-v6.js?v=32.4";
import { KICKERS, activeCharacter, selectCharacter } from "./characters-v13.js?v=32.4";
import { keeperById } from "./keepers-v14.js?v=32.4";
import { wallById } from "./walls-v15.js?v=32.4";

const BUILD = "35.0.0";
const STORAGE_KEY = "footballLabTrainingSetupV35";

const BALLS = Object.freeze({
  standard: Object.freeze({ name: "STANDARD MATCH BALL", copy: "Reference physics. Balanced pace, curl and control.", effect: "REFERENCE" }),
  curve: Object.freeze({ name: "CURVE BALL", copy: "More controlled bend with slightly less emphasis on raw pace.", effect: "CURVE +22%" }),
  power: Object.freeze({ name: "POWER BALL", copy: "Hotter strike. Adds effective power but reduces controlled curl.", effect: "POWER +6% · CURVE -12%" }),
  control: Object.freeze({ name: "CONTROL BALL", copy: "Training-focused touch. Poor contact is softened without changing your meter timing.", effect: "CONTACT CONTROL +32%" }),
  knuckle: Object.freeze({ name: "KNUCKLE BALL", copy: "Low-spin experimental ball: extra pace, minimal controlled curl and deterministic instability.", effect: "LOW SPIN · EXPERIMENTAL" })
});

const KEEPERS = ["academy", "reflex", "giant", "reader", "aggressive"].map((id) => keeperById(id));
const WALLS = ["academy-line", "compact", "leaping", "reading", "staggered"].map((id) => wallById(id));
const WIND = Object.freeze({
  off: Object.freeze({ name: "OFF", wind: 0, variance: 0, severity: 0 }),
  light: Object.freeze({ name: "LIGHT VARIABLE", wind: 0, variance: 0.045, severity: 0.08 }),
  medium: Object.freeze({ name: "MEDIUM VARIABLE", wind: 0, variance: 0.10, severity: 0.18 }),
  strong: Object.freeze({ name: "STRONG VARIABLE", wind: 0, variance: 0.18, severity: 0.34 }),
  random: Object.freeze({ name: "RANDOM LAB WIND", wind: 0, variance: 0.28, severity: 0.48 })
});

function loadSetup() {
  const fallback = {
    activity: "free-kicks",
    takerId: activeCharacter().id,
    keeperId: "academy",
    distance: 25,
    ballX: 0,
    wallPlayers: 4,
    wallId: "academy-line",
    windId: "off",
    ballId: "standard"
  };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return fallback;
  }
}

let setup = loadSetup();

function saveSetup() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(setup)); } catch {}
}

function ensureStylesheet() {
  if (document.querySelector('link[data-training-v35]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./game/training-v35.css?v=35.0";
  link.dataset.trainingV35 = "true";
  document.head.appendChild(link);
}

function positionLabel(value) {
  const x = Number(value) || 0;
  if (x <= -5) return "WIDE LEFT";
  if (x < -1.25) return "LEFT CHANNEL";
  if (x >= 5) return "WIDE RIGHT";
  if (x > 1.25) return "RIGHT CHANNEL";
  return "CENTRAL";
}

function cameraForTraining(distanceYards, ballX) {
  const sideOffset = Math.abs(ballX) < 0.8 ? -0.68 : Math.sign(ballX) * 0.5;
  const longRange = clamp((distanceYards - 25) / 20, 0, 1);
  return {
    sideOffset,
    backDistance: 8.9 + distanceYards * 0.062,
    height: 2.9 + longRange * 0.42,
    fovY: Math.abs(ballX) > 6 ? 43 : distanceYards >= 40 ? 40 : 42,
    targetHeight: 1.03 + longRange * 0.10
  };
}

function buildScenario(config) {
  const distance = Math.round(clamp(Number(config.distance) || 25, 16, 45));
  const ballX = clamp(Number(config.ballX) || 0, -8, 8);
  const wallPlayers = Math.round(clamp(Number(config.wallPlayers) || 0, 0, 5));
  const wind = WIND[config.windId] || WIND.off;
  const keeper = keeperById(config.keeperId);
  const wall = wallById(config.wallId);
  return {
    active: true,
    training: true,
    id: "training-free-kick",
    name: "FREE KICK TRAINING",
    label: `${distance} YARDS · ${positionLabel(ballX)} · ${wallPlayers ? `${wallPlayers}-MAN WALL` : "NO WALL"}`,
    distanceYards: distance,
    ballX,
    wallPlayers,
    protectedGoalX: 0,
    keeperX: 0,
    wind: wind.wind,
    windVariance: wind.variance,
    keeper: 0.27,
    aimSpeed: 1.02,
    keeperId: keeper.id,
    wallId: wall.id,
    keeperTier: 1,
    wallTier: 1,
    chapterNumber: 0,
    chapterName: "FREE TRAINING",
    chapterStage: 0,
    totalCampaignStages: 0,
    venue: "FOOTBALL LAB TRAINING GROUND",
    environment: "academy",
    weather: wind.name,
    weatherId: "training",
    weatherSeverity: wind.severity,
    difficulty: 0,
    camera: cameraForTraining(distance, ballX),
    trainingBallId: config.ballId
  };
}

function keeperOptions() {
  return KEEPERS.map((keeper) => `<option value="${keeper.id}">${keeper.name} · ${keeper.role}</option>`).join("");
}

function kickerOptions() {
  return KICKERS.map((kicker) => `<option value="${kicker.id}">${kicker.name} · ${kicker.role}</option>`).join("");
}

function wallOptions() {
  return WALLS.map((wall) => `<option value="${wall.id}">${wall.name} · ${wall.role}</option>`).join("");
}

function ballOptions() {
  return Object.entries(BALLS).map(([id, ball]) => `<option value="${id}">${ball.name}</option>`).join("");
}

function windOptions() {
  return Object.entries(WIND).map(([id, item]) => `<option value="${id}">${item.name}</option>`).join("");
}

function buildModal() {
  const modal = document.createElement("div");
  modal.className = "modal training-modal-v35";
  modal.id = "trainingModalV35";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "trainingTitleV35");
  modal.innerHTML = `
    <div class="modal-backdrop" data-training-close></div>
    <div class="modal-card panel training-setup-card-v35">
      <button class="modal-close" type="button" data-training-close aria-label="Close">×</button>
      <span class="section-label">FOOTBALL LAB TRAINING GROUND</span>
      <h2 id="trainingTitleV35">BUILD YOUR SESSION.</h2>
      <p class="training-intro-v35">Unlimited practice with no lives, score farming or career penalties. Free Kicks is live now; future Football Lab activities plug into this same sandbox.</p>
      <div class="training-activity-grid-v35" aria-label="Training activities">
        <button class="training-activity-v35 is-active" type="button"><strong>FREE KICKS</strong><small>PLAYABLE NOW</small></button>
        <button class="training-activity-v35" type="button" disabled><strong>PENALTIES</strong><small>ENGINE SLOT READY</small></button>
        <button class="training-activity-v35" type="button" disabled><strong>CORNERS</strong><small>ENGINE SLOT READY</small></button>
        <button class="training-activity-v35" type="button" disabled><strong>FINISHING</strong><small>ENGINE SLOT READY</small></button>
        <button class="training-activity-v35" type="button" disabled><strong>MATCH SCENARIOS</strong><small>ENGINE SLOT READY</small></button>
      </div>
      <div class="training-config-grid-v35">
        <label class="training-field-v35"><span>FREE-KICK TAKER</span><select id="trainingTakerV35">${kickerOptions()}</select></label>
        <label class="training-field-v35"><span>GOALKEEPER</span><select id="trainingKeeperV35">${keeperOptions()}</select></label>
        <label class="training-field-v35 training-slider-v35">
          <div class="training-slider-head-v35"><span>DISTANCE</span><strong id="trainingDistanceCopyV35">25 YDS</strong></div>
          <input id="trainingDistanceV35" type="range" min="16" max="45" step="1" value="25" />
          <div class="training-presets-v35">${[18,22,25,30,35,40,45].map((value) => `<button type="button" class="training-preset-v35" data-distance="${value}">${value} YDS</button>`).join("")}</div>
        </label>
        <label class="training-field-v35 training-slider-v35">
          <div class="training-slider-head-v35"><span>BALL POSITION</span><strong id="trainingPositionCopyV35">CENTRAL</strong></div>
          <input id="trainingPositionV35" type="range" min="-8" max="8" step="0.5" value="0" />
          <div class="training-position-copy-v35">Move the free kick across the pitch from a wide-left angle through centre to wide-right.</div>
        </label>
        <label class="training-field-v35"><span>WALL PLAYERS</span><select id="trainingWallCountV35">${[0,2,3,4,5].map((count) => `<option value="${count}">${count === 0 ? "NO WALL" : `${count} PLAYERS`}</option>`).join("")}</select></label>
        <label class="training-field-v35"><span>WALL STYLE</span><select id="trainingWallV35">${wallOptions()}</select></label>
        <label class="training-field-v35"><span>WIND</span><select id="trainingWindV35">${windOptions()}</select></label>
        <label class="training-field-v35"><span>FOOTBALL</span><select id="trainingBallV35">${ballOptions()}</select></label>
        <div class="training-ball-note-v35" id="trainingBallNoteV35"></div>
      </div>
      <div class="training-actions-v35">
        <button class="button button-secondary" type="button" data-training-close>CANCEL</button>
        <button class="button button-primary training-start-v35" id="trainingStartV35" type="button">START FREE TRAINING</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

function buildMenuCard() {
  const grid = document.querySelector(".mode-grid");
  if (!grid || document.querySelector(".training-card-v35")) return null;
  const card = document.createElement("button");
  card.className = "mode-card training-card-v35";
  card.type = "button";
  card.innerHTML = `<span class="mode-number">01</span><span class="mode-status">NEW · PLAYABLE</span><span class="mode-icon" aria-hidden="true">◌</span><strong>FREE TRAINING</strong><small>Build your own practice session: taker, keeper, distance, wall, wind and specialist footballs.</small><span class="mode-cta">ENTER TRAINING <b>→</b></span>`;
  grid.prepend(card);
  if (elements.classicCard) elements.classicCard.querySelector(".mode-number").textContent = "02";
  const previewCards = [...grid.querySelectorAll("[data-preview]")];
  previewCards.forEach((item, index) => {
    const number = item.querySelector(".mode-number");
    if (number) number.textContent = String(index + 3).padStart(2, "0");
  });
  const sectionCopy = document.querySelector(".modes-section .section-heading p");
  if (sectionCopy) sectionCopy.textContent = "Train freely, play the Classic Kicks campaign, or preview the next Football Lab challenges.";
  return card;
}

const modal = buildModal();
const menuCard = buildMenuCard();

function field(id) { return document.getElementById(id); }

function syncFormFromSetup() {
  field("trainingTakerV35").value = setup.takerId;
  field("trainingKeeperV35").value = setup.keeperId;
  field("trainingDistanceV35").value = setup.distance;
  field("trainingPositionV35").value = setup.ballX;
  field("trainingWallCountV35").value = setup.wallPlayers;
  field("trainingWallV35").value = setup.wallId;
  field("trainingWindV35").value = setup.windId;
  field("trainingBallV35").value = setup.ballId;
  updateFormCopy();
}

function updateFormCopy() {
  const distance = Math.round(Number(field("trainingDistanceV35").value));
  const ballX = Number(field("trainingPositionV35").value);
  const ballId = field("trainingBallV35").value;
  field("trainingDistanceCopyV35").textContent = `${distance} YDS`;
  field("trainingPositionCopyV35").textContent = positionLabel(ballX);
  const ball = BALLS[ballId] || BALLS.standard;
  field("trainingBallNoteV35").textContent = `${ball.effect} · ${ball.copy}`;
  document.querySelectorAll(".training-preset-v35").forEach((button) => {
    button.classList.toggle("is-selected", Number(button.dataset.distance) === distance);
  });
}

function readForm() {
  return {
    activity: "free-kicks",
    takerId: field("trainingTakerV35").value,
    keeperId: field("trainingKeeperV35").value,
    distance: Math.round(Number(field("trainingDistanceV35").value)),
    ballX: Number(field("trainingPositionV35").value),
    wallPlayers: Number(field("trainingWallCountV35").value),
    wallId: field("trainingWallV35").value,
    windId: field("trainingWindV35").value,
    ballId: field("trainingBallV35").value
  };
}

function statLabels(training) {
  const labels = [elements.scoreValue, elements.streakValue, elements.livesValue].map((value) => value?.parentElement?.querySelector("span"));
  if (training) {
    if (labels[0]) labels[0].textContent = "ATTEMPTS";
    if (labels[1]) labels[1].textContent = "GOALS";
    if (labels[2]) labels[2].textContent = "ACCURACY";
  } else {
    if (labels[0]) labels[0].textContent = "SCORE";
    if (labels[1]) labels[1].textContent = "STREAK";
    if (labels[2]) labels[2].textContent = "PERSONAL BEST";
  }
}

function trainingHud() {
  if (state.gameMode !== "training") return;
  const attempts = Number(state.trainingAttempts) || 0;
  const goals = Number(state.trainingGoals) || 0;
  const accuracy = attempts ? Math.round(goals / attempts * 100) : 0;
  const scenario = globalThis.__footballLabTrainingScenario;
  const keeper = keeperById(setup.keeperId);
  const ball = BALLS[setup.ballId] || BALLS.standard;
  statLabels(true);
  elements.stageNumber.textContent = `FREE TRAINING · ${scenario?.distanceYards || setup.distance} YDS`;
  elements.stageName.textContent = `${keeper.nickname} · ${ball.name}`;
  elements.scoreValue.textContent = String(attempts);
  elements.streakValue.textContent = String(goals);
  elements.livesValue.textContent = `${accuracy}%`;
  elements.livesValue.title = `${goals} goals from ${attempts} training attempts`;
  if (setup.windId === "off") state.stageWind = 0;
  elements.windArrow.textContent = state.stageWind < -0.015 ? "←" : state.stageWind > 0.015 ? "→" : "•";
  elements.windValue.textContent = `${Math.abs(state.stageWind * 10).toFixed(1)} m/s`;
  if (state.phase === "ready") {
    elements.phaseHelp.textContent = "Unlimited attempts. This exact setup repeats until you edit it.";
    elements.canvasPrompt.textContent = `${scenario?.label || "FREE TRAINING"} · ${ball.name}`;
  } else if (state.phase === "result") {
    elements.phaseHelp.textContent = "Review the strike, then repeat the same setup or edit the session.";
  }
}

function resetTrainingShotState() {
  state.score = 0;
  state.streak = 0;
  state.bestRunStreak = 0;
  state.stage = 0;
  state.misses = 0;
  state.pendingStageAdvance = false;
  state.animation = null;
  state.finishedAnimationId = null;
  state.presentation = null;
  state.trainingAttempts = 0;
  state.trainingGoals = 0;
  state.shot = createShot();
}

function startTraining() {
  setup = readForm();
  saveSetup();
  selectCharacter(setup.takerId);
  globalThis.__footballLabTrainingScenario = buildScenario(setup);
  state.gameMode = "training";
  state.trainingConfig = { ...setup };
  state.trainingBallId = setup.ballId;
  resetTrainingShotState();
  syncStage();
  setStageWind();
  if (setup.windId === "off") state.stageWind = 0;
  [elements.howModal, elements.previewModal, elements.gameOverModal].forEach((item) => item && closeModal(item));
  closeModal(modal);
  elements.resultBanner.textContent = "";
  elements.resultBanner.className = "result-banner";
  document.documentElement.classList.add("training-active-v35");
  statLabels(true);
  showScreen("game");
  setPhase("ready");
  renderHud();
  trainingHud();
  window.dispatchEvent(new CustomEvent("resize"));
  window.dispatchEvent(new CustomEvent("footballlab:keeperchange", { detail: keeperById(setup.keeperId) }));
  window.dispatchEvent(new CustomEvent("footballlab:trainingstart", { detail: { ...setup, scenario: globalThis.__footballLabTrainingScenario } }));
}

function clearTrainingContext() {
  if (state.gameMode !== "training" && !globalThis.__footballLabTrainingScenario) return;
  globalThis.__footballLabTrainingScenario = null;
  state.gameMode = "classic";
  state.trainingBallId = null;
  state.trainingConfig = null;
  document.documentElement.classList.remove("training-active-v35");
  statLabels(false);
}

function stopTrainingToMenu() {
  state.animation = null;
  state.presentation = null;
  clearTrainingContext();
  state.stage = 0;
  state.misses = 0;
  state.score = 0;
  state.streak = 0;
  state.shot = createShot();
  syncStage();
  setStageWind();
  setPhase("ready");
  renderHud();
  elements.resultBanner.textContent = "";
  elements.resultBanner.className = "result-banner";
  showScreen("menu");
}

function openTrainingSetup() {
  syncFormFromSetup();
  openModal(modal);
}

function addTrainingPitchControls() {
  const panel = document.querySelector(".control-panel");
  if (!panel || document.getElementById("trainingEditV35")) return;
  const button = document.createElement("button");
  button.id = "trainingEditV35";
  button.className = "button button-secondary training-edit-v35";
  button.type = "button";
  button.textContent = "EDIT TRAINING SETUP";
  button.addEventListener("click", () => {
    if (state.gameMode !== "training" || state.animation) return;
    openTrainingSetup();
  });
  elements.shotAction.insertAdjacentElement("afterend", button);

  const chip = document.createElement("div");
  chip.className = "training-session-chip-v35";
  chip.textContent = "FREE TRAINING · UNLIMITED ATTEMPTS";
  document.querySelector(".game-frame")?.appendChild(chip);
}

function applyTrainingBallEffect() {
  if (state.gameMode !== "training" || !state.shot || state.shot.__trainingBallOriginal) return;
  const ballId = setup.ballId || "standard";
  const shot = state.shot;
  const original = {
    power: shot.power,
    curve: shot.curve,
    contactQuality: shot.contactQuality,
    contactOffset: shot.contactOffset
  };
  shot.__trainingBallOriginal = original;
  shot.trainingBallId = ballId;

  if (ballId === "curve") {
    shot.curve = clamp((Number(shot.curve) || 0) * 1.22, -1, 1);
  } else if (ballId === "power") {
    shot.power = clamp((Number(shot.power) || 0) + 0.06, 0, 1);
    shot.curve = clamp((Number(shot.curve) || 0) * 0.88, -1, 1);
  } else if (ballId === "control") {
    const quality = Number.isFinite(shot.contactQuality) ? shot.contactQuality : 1;
    shot.contactQuality = clamp(quality + (1 - quality) * 0.32, 0.06, 1);
    shot.contactOffset = clamp((Number(shot.contactOffset) || 0) * 0.78, -1, 1);
  } else if (ballId === "knuckle") {
    const selectedPower = Number(shot.power) || 0;
    const selectedAimX = Number(shot.aimX) || 0.5;
    const selectedAimY = Number(shot.aimY) || 0.5;
    const nudge = Math.sin((selectedPower * 11.7 + selectedAimX * 7.1 + selectedAimY * 5.3) * Math.PI) * 0.10;
    shot.power = clamp(selectedPower + 0.035, 0, 1);
    shot.curve = clamp((Number(shot.curve) || 0) * 0.28, -1, 1);
    shot.contactOffset = clamp((Number(shot.contactOffset) || 0) + nudge, -1, 1);
    if (Number.isFinite(shot.contactQuality)) {
      shot.contactQuality = clamp(shot.contactQuality - Math.abs(nudge) * 0.55, 0.06, 1);
    }
    shot.trainingKnuckleNudge = nudge;
  }

  queueMicrotask(() => {
    if (!shot.__trainingBallOriginal) return;
    const diagnostics = shot.diagnostics;
    if (diagnostics) {
      diagnostics.trainingBall = BALLS[ballId]?.name || BALLS.standard.name;
      diagnostics.trainingBallEffect = BALLS[ballId]?.effect || BALLS.standard.effect;
      diagnostics.trainingSelectedPowerPercent = Math.round((Number(original.power) || 0) * 100);
      diagnostics.trainingSelectedCurvePercent = Math.round((Number(original.curve) || 0) * 100);
      if (Number.isFinite(shot.trainingKnuckleNudge)) diagnostics.trainingKnuckleNudge = Number(shot.trainingKnuckleNudge.toFixed(3));
    }
    shot.power = original.power;
    shot.curve = original.curve;
    shot.contactQuality = original.contactQuality;
    shot.contactOffset = original.contactOffset;
    delete shot.__trainingBallOriginal;
  });
}

function handleTrainingResult() {
  if (state.gameMode !== "training" || !state.shot || state.shot.__trainingCounted) return;
  const shot = state.shot;
  shot.__trainingCounted = true;
  state.trainingAttempts = (Number(state.trainingAttempts) || 0) + 1;
  if (shot.outcome === "GOAL") state.trainingGoals = (Number(state.trainingGoals) || 0) + 1;
  state.score = 0;
  state.streak = 0;
  state.bestRunStreak = 0;
  state.misses = state.trainingAttempts;
  state.pendingStageAdvance = false;
  shot.points = 0;
  const messages = {
    GOAL: shot.topCorner ? "TOP CORNER · TRAINING" : "GOAL · TRAINING",
    SAVE: shot.saveType === "CATCH" ? "HELD · TRAINING" : "PARRIED · TRAINING",
    WALL: "BLOCKED · TRAINING",
    POST: "POST · TRAINING",
    BAR: "CROSSBAR · TRAINING",
    MISS: "OFF TARGET · TRAINING"
  };
  elements.resultBanner.textContent = messages[shot.outcome] || "TRAINING SHOT COMPLETE";
  trainingHud();
}

ensureStylesheet();
addTrainingPitchControls();
syncFormFromSetup();
state.gameMode = state.gameMode || "classic";

menuCard?.addEventListener("click", openTrainingSetup);
field("trainingStartV35").addEventListener("click", startTraining);
field("trainingDistanceV35").addEventListener("input", updateFormCopy);
field("trainingPositionV35").addEventListener("input", updateFormCopy);
field("trainingBallV35").addEventListener("change", updateFormCopy);
document.querySelectorAll(".training-preset-v35").forEach((button) => button.addEventListener("click", () => {
  field("trainingDistanceV35").value = button.dataset.distance;
  updateFormCopy();
}));
modal.querySelectorAll("[data-training-close]").forEach((button) => button.addEventListener("click", () => closeModal(modal)));

[elements.playClassic, elements.classicCard, elements.modalPlay, elements.retryGame].filter(Boolean).forEach((button) => {
  button.addEventListener("click", clearTrainingContext, true);
});

[elements.exitGame, elements.brandButton].filter(Boolean).forEach((button) => {
  button.addEventListener("click", (event) => {
    if (state.gameMode !== "training") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    stopTrainingToMenu();
  }, true);
});

window.addEventListener("footballlab:phasechange", (event) => {
  if (state.gameMode !== "training") return;
  if (event.detail?.phase === "shooting") applyTrainingBallEffect();
  if (event.detail?.phase === "result") handleTrainingResult();
  if (event.detail?.phase === "ready" && setup.windId === "off") state.stageWind = 0;
  queueMicrotask(trainingHud);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal(modal);
});

window.__footballLabTrainingV35 = Object.freeze({
  build: BUILD,
  framework: "shared-training-ground",
  playableActivities: ["free-kicks"],
  reservedActivities: ["penalties", "corners", "finishing", "match-scenarios"],
  distanceRangeYards: [16, 45],
  unlimitedAttempts: true,
  competitiveRecordsAffected: false,
  balls: Object.keys(BALLS)
});