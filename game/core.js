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

// Realistic free-kick layouts based on behind-the-taker broadcast/game camera references.
// World coordinates are deliberately explicit so the ball, wall and keeper remain aligned.
export const FREE_KICK_TEMPLATES = {
  central20: {
    label: "20 YARDS · CENTRAL",
    ball: { x: 455, y: 590 },
    wallPlayers: 4,
    wallT: 0.53,
    protectedGoalX: 0.48,
    keeperBias: 0.08,
    distanceYards: 20,
    camera: { x: -66, y: -8, zoom: 1.08 }
  },
  left20: {
    label: "20 YARDS · LEFT CHANNEL",
    ball: { x: 360, y: 596 },
    wallPlayers: 4,
    wallT: 0.54,
    protectedGoalX: 0.35,
    keeperBias: 0.12,
    distanceYards: 20,
    camera: { x: -28, y: -6, zoom: 1.06 }
  },
  right20: {
    label: "20 YARDS · RIGHT CHANNEL",
    ball: { x: 535, y: 596 },
    wallPlayers: 4,
    wallT: 0.54,
    protectedGoalX: 0.65,
    keeperBias: -0.12,
    distanceYards: 20,
    camera: { x: -92, y: -6, zoom: 1.06 }
  },
  central25: {
    label: "25 YARDS · CENTRAL",
    ball: { x: 430, y: 618 },
    wallPlayers: 5,
    wallT: 0.49,
    protectedGoalX: 0.50,
    keeperBias: 0.06,
    distanceYards: 25,
    camera: { x: -58, y: -20, zoom: 1.03 }
  },
  wideLeft30: {
    label: "30 YARDS · WIDE LEFT",
    ball: { x: 270, y: 612 },
    wallPlayers: 4,
    wallT: 0.50,
    protectedGoalX: 0.28,
    keeperBias: 0.15,
    distanceYards: 30,
    camera: { x: 18, y: -16, zoom: 1.01 }
  },
  wideRight30: {
    label: "30 YARDS · WIDE RIGHT",
    ball: { x: 610, y: 612 },
    wallPlayers: 4,
    wallT: 0.50,
    protectedGoalX: 0.72,
    keeperBias: -0.15,
    distanceYards: 30,
    camera: { x: -142, y: -16, zoom: 1.01 }
  },
  long35: {
    label: "35 YARDS · LONG RANGE",
    ball: { x: 405, y: 640 },
    wallPlayers: 5,
    wallT: 0.45,
    protectedGoalX: 0.50,
    keeperBias: 0.04,
    distanceYards: 35,
    camera: { x: -46, y: -30, zoom: 0.98 }
  }
};

// The opening cycle deliberately moves from familiar central positions to wider and longer shots.
export const STAGES = [
  { name: "THE OPENER", template: "central20", wind: 0.02, keeper: 0.18, aimSpeed: 0.92 },
  { name: "LEFT CHANNEL", template: "left20", wind: -0.04, keeper: 0.25, aimSpeed: 0.99 },
  { name: "RIGHT CHANNEL", template: "right20", wind: 0.05, keeper: 0.31, aimSpeed: 1.04 },
  { name: "TWENTY-FIVE OUT", template: "central25", wind: -0.08, keeper: 0.39, aimSpeed: 1.09 },
  { name: "WIDE LEFT", template: "wideLeft30", wind: 0.10, keeper: 0.47, aimSpeed: 1.14 },
  { name: "WIDE RIGHT", template: "wideRight30", wind: -0.12, keeper: 0.56, aimSpeed: 1.20 },
  { name: "THIRTY-FIVE OUT", template: "long35", wind: 0.14, keeper: 0.66, aimSpeed: 1.27 }
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
  const template = FREE_KICK_TEMPLATES[base.template];
  return {
    ...base,
    ...template,
    cycle,
    distance: clamp((template.distanceYards - 18) / 35 + cycle * 0.016, 0.05, 0.62),
    keeper: clamp(base.keeper + cycle * 0.035, 0, 0.82),
    wind: clamp(base.wind * (1 + cycle * 0.09), -0.22, 0.22),
    aimSpeed: clamp(base.aimSpeed + cycle * 0.035, 0.9, 1.46)
  };
}

export function applyStageCamera() {
  const { camera } = stageConfig();
  if (!elements.canvas || !camera) return;
  elements.canvas.style.transformOrigin = "50% 50%";
  elements.canvas.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
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
  if (name === "game") applyStageCamera();
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
    ready: ["READY", `${stageConfig().label}. The wall and keeper are positioned for this angle.`, "START SHOT", "SHOT METER"],
    power: ["SET POWER", "Power controls pace and height. Longer free kicks need a cleaner, stronger strike.", "LOCK POWER", "POWER"],
    aim: ["PICK YOUR SIDE", "The marker sweeps across the goal. Read the wall coverage before committing.", "LOCK PLACEMENT", "PLACEMENT"],
    curve: ["ADD CURVE", "Curl around the protected side and account for the wind.", "TAKE SHOT", "CURVE"],
    shooting: ["WATCH THE FLIGHT", "The ball, wall and goalkeeper all use the same visible trajectory.", "SHOT IN PLAY", "LOCKED"],
    result: ["SHOT COMPLETE", "The next stage may change the angle, distance and camera view.", "NEXT SHOT", "RESULT"]
  }[phase];
  elements.phaseTitle.textContent = content[0];
  elements.phaseHelp.textContent = content[1];
  elements.shotAction.textContent = content[2];
  elements.meterLabel.textContent = content[3];
  elements.shotAction.disabled = phase === "shooting";
  elements.canvasPrompt.textContent = phase === "ready" ? stageConfig().label : phase === "shooting" ? "SHOT IN PLAY" : content[2];
  renderSteps();
}

export function idealPower() {
  const yards = stageConfig().distanceYards;
  return clamp(0.63 + (yards - 18) * 0.0082, 0.66, 0.80);
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
  elements.stageNumber.textContent = `STAGE ${String(state.stage + 1).padStart(2, "0")} · ${stage.distanceYards} YDS`;
  elements.stageName.textContent = stage.name;
  elements.scoreValue.textContent = formatScore(state.score);
  elements.streakValue.textContent = String(state.streak);
  elements.livesValue.textContent = [0, 1, 2].map((index) => index < 3 - state.misses ? "●" : "○").join(" ");
  elements.windArrow.textContent = state.stageWind < -0.015 ? "←" : state.stageWind > 0.015 ? "→" : "•";
  elements.windValue.textContent = `${Math.abs(state.stageWind * 10).toFixed(1)} m/s`;
  applyStageCamera();
}

export function showResult(message, isMiss) {
  elements.resultBanner.textContent = message;
  elements.resultBanner.className = `result-banner is-visible${isMiss ? " is-miss" : ""}`;
}

export function easeOutCubic(value) { return 1 - Math.pow(1 - value, 3); }
export function easeInOutCubic(value) { return value < 0.5 ? 4 * value ** 3 : 1 - Math.pow(-2 * value + 2, 3) / 2; }
