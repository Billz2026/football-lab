export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, value) => clamp((value - a) / (b - a || 1), 0, 1);
export const smoothStep = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
export const formatScore = (value) => Math.max(0, Math.round(value)).toLocaleString("en-GB");

export const STORAGE_KEY = "footballLabArcadeProfileV2";
export const WORLD = { width: 1200, height: 720 };

// Each stage changes the mechanics rather than only increasing a hidden difficulty number.
export const STAGES = [
  { name: "THE OPENER", wall: 3, wind: 0.02, keeper: 0.18, distance: 0.18, startOffset: 0, wallOffset: 0, aimSpeed: 0.92 },
  { name: "AROUND THE WALL", wall: 4, wind: -0.04, keeper: 0.26, distance: 0.24, startOffset: -28, wallOffset: 12, aimSpeed: 1.00 },
  { name: "THE WIDE ANGLE", wall: 4, wind: 0.07, keeper: 0.34, distance: 0.30, startOffset: 44, wallOffset: -18, aimSpeed: 1.06 },
  { name: "HEAVY WEATHER", wall: 5, wind: -0.12, keeper: 0.42, distance: 0.34, startOffset: -18, wallOffset: 8, aimSpeed: 1.10 },
  { name: "TOP BINS ONLY", wall: 5, wind: 0.09, keeper: 0.50, distance: 0.38, startOffset: 26, wallOffset: -12, aimSpeed: 1.16 },
  { name: "THE SPECIALIST", wall: 6, wind: -0.14, keeper: 0.59, distance: 0.43, startOffset: -34, wallOffset: 18, aimSpeed: 1.22 },
  { name: "NIGHT FINAL", wall: 6, wind: 0.16, keeper: 0.68, distance: 0.48, startOffset: 34, wallOffset: -20, aimSpeed: 1.28 }
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
    power: null,
    aimX: null,
    aimY: null,
    curve: null,
    actualX: null,
    actualY: null,
    outcome: null,
    points: 0,
    topCorner: false,
    trajectory: null,
    keeperPlan: null,
    collision: null,
    pathEndT: 1,
    strikeQuality: 0,
    strikeLabel: "",
    speedMps: 0,
    wallCrossT: 0.5,
    impactRenderT: null,
    saveType: null
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
    keeper: clamp(base.keeper + cycle * 0.035, 0, 0.82),
    wind: clamp(base.wind * (1 + cycle * 0.09), -0.22, 0.22),
    distance: clamp(base.distance + cycle * 0.016, 0.18, 0.58),
    aimSpeed: clamp(base.aimSpeed + cycle * 0.035, 0.9, 1.46)
  };
}

export function setStageWind() {
  const stage = stageConfig();
  const phase = (state.stage + 1) * 1.73 + state.misses * 0.91;
  state.stageWind = clamp(stage.wind + Math.sin(phase) * 0.012, -0.24, 0.24);
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
    ready: ["READY", "Lock in power, horizontal placement and curve. Every result comes from the visible flight path.", "START SHOT", "SHOT METER"],
    power: ["SET POWER", "Power controls pace and height. The control zone gives the cleanest strike.", "LOCK POWER", "POWER"],
    aim: ["PICK YOUR SIDE", "The marker sweeps across the goal. Power has already established the shot height.", "LOCK PLACEMENT", "PLACEMENT"],
    curve: ["ADD CURVE", "Curl develops through the flight. Counter the wind rather than aiming blindly at the corner.", "TAKE SHOT", "CURVE"],
    shooting: ["WATCH THE FLIGHT", "Ball speed, wall contact, goalkeeper reach and frame rebounds use one deterministic path.", "SHOT IN PLAY", "LOCKED"],
    result: ["SHOT COMPLETE", "The outcome follows the same mechanics you can see on screen.", "NEXT SHOT", "RESULT"]
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
  return clamp(0.66 + stageConfig().distance * 0.22, 0.69, 0.79);
}

export function strikeQuality(power) {
  const deviation = Math.abs(power - idealPower());
  return 1 - smoothStep(invLerp(0.035, 0.31, deviation));
}

export function strikeQualityLabel(power) {
  const quality = strikeQuality(power);
  if (quality >= 0.90) return "PERFECT";
  if (quality >= 0.68) return "CLEAN";
  if (quality >= 0.38) return "RISKY";
  return power < idealPower() ? "UNDERHIT" : "OVERHIT";
}

export function shotHeightFromPower(power) {
  const ideal = idealPower();
  const delta = clamp((power - ideal) / 0.34, -1.35, 1.15);
  const linear = delta * 0.255;
  const extreme = Math.sign(delta) * delta * delta * 0.055;
  return clamp(0.47 - linear - extreme, 0.12, 0.83);
}

export function currentAimTarget() {
  const speed = 2.22 * stageConfig().aimSpeed;
  const sweep = (Math.sin(state.meterClock * speed - Math.PI / 2) + 1) / 2;
  const eased = smoothStep(sweep);
  const x = 0.065 + eased * 0.87;
  const y = shotHeightFromPower(state.shot.power ?? idealPower());
  const horizontal = x < 0.33 ? "LEFT" : x > 0.67 ? "RIGHT" : "CENTRE";
  const vertical = y < 0.31 ? "HIGH" : y > 0.59 ? "LOW" : "MID";
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
