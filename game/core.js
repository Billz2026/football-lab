export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const formatScore = (value) => Math.max(0, Math.round(value)).toLocaleString("en-GB");

export const STORAGE_KEY = "footballLabArcadeProfileV2";
export const WORLD = { width: 1200, height: 720 };
export const STAGES = [
  { name: "THE OPENER", wall: 3, wind: 0.02, keeper: 0.22, distance: 0.18 },
  { name: "AROUND THE WALL", wall: 4, wind: -0.04, keeper: 0.30, distance: 0.24 },
  { name: "THE WIDE ANGLE", wall: 4, wind: 0.07, keeper: 0.38, distance: 0.30 },
  { name: "HEAVY WEATHER", wall: 5, wind: -0.12, keeper: 0.46, distance: 0.34 },
  { name: "TOP BINS ONLY", wall: 5, wind: 0.09, keeper: 0.54, distance: 0.38 },
  { name: "THE SPECIALIST", wall: 6, wind: -0.14, keeper: 0.62, distance: 0.43 },
  { name: "NIGHT FINAL", wall: 6, wind: 0.16, keeper: 0.70, distance: 0.48 }
];

function loadProfile() {
  const fallback = { highScore: 0, bestStreak: 0, xp: 0 };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return fallback;
  }
}

export const profile = loadProfile();
export const state = {
  screen: "menu",
  phase: "ready",
  score: 0,
  streak: 0,
  bestRunStreak: 0,
  stage: 0,
  misses: 0,
  meterClock: 0,
  meterValue: 0,
  lastTime: performance.now(),
  shot: null,
  animation: null,
  resultTimeout: null,
  stageWind: 0,
  finishedAnimationId: null,
  audioContext: null
};

export const elements = {
  menuScreen: $("#menuScreen"), gameScreen: $("#gameScreen"), playClassic: $("#playClassic"), classicCard: $("#classicCard"),
  howToPlay: $("#howToPlay"), howModal: $("#howModal"), previewModal: $("#previewModal"), gameOverModal: $("#gameOverModal"),
  modalPlay: $("#modalPlay"), brandButton: $("#brandButton"), exitGame: $("#exitGame"), retryGame: $("#retryGame"),
  returnMenu: $("#returnMenu"), shotAction: $("#shotAction"), canvas: $("#gameCanvas"), stageNumber: $("#stageNumber"),
  stageName: $("#stageName"), scoreValue: $("#scoreValue"), streakValue: $("#streakValue"), livesValue: $("#livesValue"),
  windArrow: $("#windArrow"), windValue: $("#windValue"), resultBanner: $("#resultBanner"), canvasPrompt: $("#canvasPrompt"),
  phaseTitle: $("#phaseTitle"), phaseHelp: $("#phaseHelp"), meterFill: $("#meterFill"), meterMarker: $("#meterMarker"),
  meterLabel: $("#meterLabel"), meterNumber: $("#meterNumber"), powerReadout: $("#powerReadout"), aimReadout: $("#aimReadout"),
  curveReadout: $("#curveReadout"), previewTitle: $("#previewTitle"), previewCopy: $("#previewCopy"), previewList: $("#previewList"),
  finalScore: $("#finalScore"), finalStage: $("#finalStage"), finalStreak: $("#finalStreak"), finalBest: $("#finalBest"),
  gameOverTitle: $("#gameOverTitle")
};

export const ctx = elements.canvas.getContext("2d");
export const canvasView = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1 };

export function createShot() {
  return {
    power: null, aimX: null, aimY: null, curve: null, actualX: null, actualY: null,
    outcome: null, points: 0, topCorner: false, trajectory: null, keeperPlan: null,
    collision: null, pathEndT: 1
  };
}
state.shot = createShot();

export function saveProfile() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  renderProfile();
}

export function profileLevel() {
  return Math.max(1, Math.floor(profile.xp / 1000) + 1);
}

export function renderProfile() {
  const level = profileLevel();
  const currentXp = profile.xp % 1000;
  $("#headerLevel").textContent = String(level);
  $("#profileLevel").textContent = `LV. ${level}`;
  $("#headerBest").textContent = formatScore(profile.highScore);
  $("#profileBest").textContent = formatScore(profile.highScore);
  $("#profileStreak").textContent = String(profile.bestStreak);
  $("#xpCopy").textContent = `${formatScore(currentXp)} / 1,000`;
  $("#xpBar").style.width = `${currentXp / 10}%`;
}

export function stageConfig() {
  const cycle = Math.floor(state.stage / STAGES.length);
  const base = STAGES[state.stage % STAGES.length];
  return {
    ...base,
    keeper: clamp(base.keeper + cycle * 0.04, 0, 0.84),
    wind: clamp(base.wind * (1 + cycle * 0.10), -0.22, 0.22),
    distance: clamp(base.distance + cycle * 0.018, 0.18, 0.58)
  };
}

export function setStageWind() {
  const stage = stageConfig();
  const phase = (state.stage + 1) * 1.73 + state.misses * 0.91;
  state.stageWind = clamp(stage.wind + Math.sin(phase) * 0.014, -0.24, 0.24);
}

export function showScreen(name) {
  state.screen = name;
  elements.menuScreen.classList.toggle("is-active", name === "menu");
  elements.gameScreen.classList.toggle("is-active", name === "game");
}

export function openModal(modal) {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

export function closeModal(modal) {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

export function renderSteps() {
  const order = ["power", "aim", "curve"];
  const phaseIndex = order.indexOf(state.phase);
  $$(".shot-step").forEach((step, index) => {
    step.classList.toggle("is-current", (state.phase === "ready" && index === 0) || phaseIndex === index);
    step.classList.toggle("is-complete", phaseIndex > index || ["shooting", "result"].includes(state.phase));
  });
}

export function setPhase(phase) {
  state.phase = phase;
  state.meterClock = 0;
  state.meterValue = phase === "curve" ? 0.5 : 0;
  const content = {
    ready: ["READY", "Lock in power, horizontal placement and curve. Every result now comes from your inputs.", "START SHOT", "SHOT METER"],
    power: ["SET POWER", "Aim for the bright control zone. Power also controls the shot height.", "LOCK POWER", "POWER"],
    aim: ["PICK YOUR SIDE", "The marker sweeps left to right. Power has already set the shot height.", "LOCK PLACEMENT", "PLACEMENT"],
    curve: ["ADD CURVE", "Bend around the wall and compensate for the wind. The flight visibly follows your choice.", "TAKE SHOT", "CURVE"],
    shooting: ["WATCH THE FLIGHT", "The run-up, wall, goalkeeper and ball react to the same physical trajectory.", "SHOT IN PLAY", "LOCKED"],
    result: ["SHOT COMPLETE", "The result is based on the visible path, not a hidden random roll.", "NEXT SHOT", "RESULT"]
  }[phase];
  elements.phaseTitle.textContent = content[0];
  elements.phaseHelp.textContent = content[1];
  elements.shotAction.textContent = content[2];
  elements.meterLabel.textContent = content[3];
  elements.shotAction.disabled = phase === "shooting";
  elements.canvasPrompt.textContent = phase === "ready" ? "PRESS START SHOT" : phase === "shooting" ? "SHOT IN PLAY" : content[2];
  renderSteps();
}

export function idealPower() {
  return clamp(0.67 + stageConfig().distance * 0.18, 0.69, 0.80);
}

export function shotHeightFromPower(power) {
  return clamp(0.42 - (power - idealPower()) * 0.68, 0.13, 0.76);
}

export function currentAimTarget() {
  const sweep = (Math.sin(state.meterClock * 2.45 - Math.PI / 2) + 1) / 2;
  const x = 0.07 + sweep * 0.86;
  const y = shotHeightFromPower(state.shot.power ?? idealPower());
  const horizontal = x < 0.33 ? "LEFT" : x > 0.67 ? "RIGHT" : "CENTRE";
  const vertical = y < 0.32 ? "HIGH" : y > 0.58 ? "LOW" : "MID";
  return { x, y, label: `${vertical} ${horizontal}` };
}

export function renderHud() {
  const stage = stageConfig();
  elements.stageNumber.textContent = `STAGE ${String(state.stage + 1).padStart(2, "0")}`;
  elements.stageName.textContent = stage.name;
  elements.scoreValue.textContent = formatScore(state.score);
  elements.streakValue.textContent = String(state.streak);
  elements.livesValue.textContent = [0, 1, 2].map((index) => index < 3 - state.misses ? "●" : "○").join(" ");
  elements.windArrow.textContent = state.stageWind < -0.015 ? "←" : state.stageWind > 0.015 ? "→" : "•";
  elements.windValue.textContent = `${Math.abs(state.stageWind * 10).toFixed(1)} m/s`;
}

export function showResult(message, isMiss) {
  elements.resultBanner.textContent = message;
  elements.resultBanner.className = `result-banner is-visible${isMiss ? " is-miss" : ""}`;
}

export function easeOutCubic(value) { return 1 - Math.pow(1 - value, 3); }
export function easeInOutCubic(value) { return value < 0.5 ? 4 * value ** 3 : 1 - Math.pow(-2 * value + 2, 3) / 2; }
export function smoothStep(value) { return value * value * (3 - 2 * value); }
