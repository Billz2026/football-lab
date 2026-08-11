import { scenarioForStage } from "./world-v6.js?v=31";

export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothStep = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (value) => 1 - Math.pow(1 - clamp(value, 0, 1), 3);
export const easeInOutCubic = (value) => value < 0.5
  ? 4 * value ** 3
  : 1 - Math.pow(-2 * value + 2, 3) / 2;
export const formatScore = (value) => Math.max(0, Math.round(value)).toLocaleString("en-GB");

export const WORLD = { width: 1200, height: 720 };
export const STORAGE_KEY = "footballLabArcadeProfileV2";
export const MAX_LIVES = 5;
export const LIFE_STREAK_TARGET = 3;
export const AIM_BOUNDS = Object.freeze({ minX: -0.22, maxX: 1.22, minY: -0.2, maxY: 1.08 });

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
  maxLives: MAX_LIVES,
  lifeStreakTarget: LIFE_STREAK_TARGET,
  meterClock: 0,
  meterValue: 0,
  lastTime: performance.now(),
  stageWind: 0,
  shot: null,
  animation: null,
  resultTimeout: null,
  finishedAnimationId: null,
  audioContext: null,
  currentStage: scenarioForStage(0)
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

export function stageConfig() {
  return scenarioForStage(state.stage);
}

export function syncStage() {
  state.currentStage = stageConfig();
  return state.currentStage;
}

export function createShot() {
  return {
    power: null, aimX: null, aimY: null, curve: null, actualX: null, actualY: null,
    previewAimX: 0.5, previewAimY: 0.27,
    outcome: null, points: 0, topCorner: false, path: [], impactIndex: null,
    collision: null, keeperPlan: null, saveType: null, strikeQuality: 0, speedMps: 0,
    lifeRestored: false
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

export function setStageWind() {
  const stage = stageConfig();
  const phase = (state.stage + 1) * 1.73 + state.misses * 0.91;
  const gust = Math.sin(phase) * (stage.windVariance || 0.015);
  state.stageWind = clamp(stage.wind + gust, -0.36, 0.36);
}

export function showScreen(name) {
  state.screen = name;
  elements.menuScreen.classList.toggle("is-active", name === "menu");
  elements.gameScreen.classList.toggle("is-active", name === "game");
  elements.canvas.style.transform = "none";
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
  const stage = stageConfig();
  const content = {
    ready: ["READY", `${stage.chapterName} · ${stage.label}. Misses reset the streak, never your stage.`, "START SHOT", "SHOT METER"],
    power: ["SET POWER", "Power controls pace and contact quality. Placement controls the shot height.", "LOCK POWER", "POWER"],
    aim: ["PLACE YOUR SHOT", "Drag anywhere on the goal view or target pad—including outside the posts—to choose the exact line.", "LOCK PLACEMENT", "2D PLACEMENT"],
    curve: ["ADD CURVE", "Curl develops progressively. Aim outside the wall, then bend the ball back toward goal.", "TAKE SHOT", "CURVE"],
    shooting: ["WATCH THE FLIGHT", "The ball travels through the same world space as the wall, goal and goalkeeper.", "SHOT IN PLAY", "LOCKED"],
    result: ["SHOT COMPLETE", "A goal advances the stage. A miss lets you retry without losing progress.", "NEXT SHOT", "RESULT"]
  }[phase];
  elements.phaseTitle.textContent = content[0];
  elements.phaseHelp.textContent = content[1];
  elements.shotAction.textContent = content[2];
  elements.meterLabel.textContent = content[3];
  elements.shotAction.disabled = phase === "shooting";
  elements.canvasPrompt.textContent = phase === "ready" ? stage.label : phase === "shooting" ? "SHOT IN PLAY" : content[2];
  renderSteps();
}

export function idealPower() {
  return clamp(0.63 + (stageConfig().distanceYards - 18) * 0.0082, 0.66, 0.86);
}

export function strikeQuality(power) {
  const deviation = Math.abs(power - idealPower());
  if (deviation <= 0.035) return 1;
  return 1 - smoothStep(clamp((deviation - 0.035) / 0.28, 0, 1));
}

export function strikeQualityLabel(power) {
  const quality = strikeQuality(power);
  if (quality >= 0.9) return "PERFECT";
  if (quality >= 0.68) return "CLEAN";
  if (quality >= 0.38) return "RISKY";
  return power < idealPower() ? "UNDERHIT" : "OVERHIT";
}

export function shotHeightFromPower(power) {
  const delta = clamp((power - idealPower()) / 0.34, -1.35, 1.15);
  const linear = delta * 0.255;
  const extreme = Math.sign(delta) * delta * delta * 0.055;
  return clamp(0.47 - linear - extreme, 0.12, 0.83);
}

export function aimTargetLabel(x, y) {
  const horizontal = x < 0
    ? "OUTSIDE LEFT"
    : x > 1
      ? "OUTSIDE RIGHT"
      : x < 0.33
        ? "LEFT"
        : x > 0.67
          ? "RIGHT"
          : "CENTRE";
  const vertical = y < 0
    ? "ABOVE BAR"
    : y < 0.31
      ? "HIGH"
      : y > 0.67
        ? "LOW"
        : "MID";
  return `${vertical} ${horizontal}`;
}

export function currentAimTarget() {
  const x = clamp(
    Number.isFinite(state.shot?.previewAimX) ? state.shot.previewAimX : 0.5,
    AIM_BOUNDS.minX,
    AIM_BOUNDS.maxX
  );
  const y = clamp(
    Number.isFinite(state.shot?.previewAimY) ? state.shot.previewAimY : 0.27,
    AIM_BOUNDS.minY,
    AIM_BOUNDS.maxY
  );
  return { x, y, label: aimTargetLabel(x, y) };
}

export function renderHud() {
  const stage = stageConfig();
  const maxLives = state.maxLives || MAX_LIVES;
  const livesRemaining = Math.max(0, maxLives - state.misses);
  const stageContext = stage.cycle > 0 ? `MASTERY ${stage.cycle + 1}` : `CH ${stage.chapterNumber}`;
  elements.stageNumber.textContent = `${stageContext} · STAGE ${String(state.stage + 1).padStart(2, "0")} · ${stage.distanceYards} YDS`;
  elements.stageName.textContent = stage.name;
  elements.scoreValue.textContent = formatScore(state.score);
  elements.streakValue.textContent = String(state.streak);
  elements.livesValue.textContent = Array.from({ length: maxLives }, (_, index) => index < livesRemaining ? "●" : "○").join(" ");
  elements.livesValue.title = `${livesRemaining} of ${maxLives} lives · ${Math.min(state.streak, LIFE_STREAK_TARGET)}/${LIFE_STREAK_TARGET} goals toward recovery`;
  elements.windArrow.textContent = state.stageWind < -0.015 ? "←" : state.stageWind > 0.015 ? "→" : "•";
  elements.windValue.textContent = `${Math.abs(state.stageWind * 10).toFixed(1)} m/s`;
}

export function showResult(message, isMiss) {
  elements.resultBanner.textContent = message;
  elements.resultBanner.className = `result-banner is-visible${isMiss ? " is-miss" : ""}`;
}
