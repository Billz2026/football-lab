"use strict";

const GOAL_WIDTH = 7.32;
const GOAL_HEIGHT = 2.44;
const HALF_GOAL = GOAL_WIDTH / 2;

const scenarios = [
  { name: "THE OPENER", distance: 20, wall: 4, wind: 0.02, keeper: 0.18 },
  { name: "CENTRAL TEST", distance: 20, wall: 4, wind: -0.04, keeper: 0.24 },
  { name: "RIGHT CHANNEL", distance: 22, wall: 4, wind: 0.06, keeper: 0.29 },
  { name: "FIVE-MAN TEST", distance: 24, wall: 5, wind: -0.07, keeper: 0.35 },
  { name: "BEND THE LINE", distance: 26, wall: 5, wind: 0.10, keeper: 0.40 },
  { name: "REVERSE BEND", distance: 27, wall: 5, wind: -0.11, keeper: 0.45 },
  { name: "CROSSWIND", distance: 30, wall: 5, wind: 0.16, keeper: 0.50 },
  { name: "WIDE LEFT", distance: 31, wall: 5, wind: -0.14, keeper: 0.54 },
  { name: "WIDE RIGHT", distance: 32, wall: 5, wind: 0.18, keeper: 0.58 },
  { name: "THE SIX", distance: 34, wall: 6, wind: -0.19, keeper: 0.62 },
  { name: "LONG LEFT", distance: 36, wall: 5, wind: 0.21, keeper: 0.66 },
  { name: "LONG RIGHT", distance: 38, wall: 6, wind: -0.22, keeper: 0.70 },
  { name: "THE GALE", distance: 40, wall: 6, wind: 0.27, keeper: 0.74 },
  { name: "FORTY-TWO WIDE", distance: 42, wall: 6, wind: -0.25, keeper: 0.78 },
  { name: "THE DISTANCE KING", distance: 45, wall: 6, wind: 0.30, keeper: 0.82 }
];

const kickers = [
  { id: "dax-ryder", name: "DAX RYDER", role: "POWER KICKER", accent: "#dafe4d", pace: 1.12, accuracy: 0.88, curve: 0.94 },
  { id: "leo-vale", name: "LEO VALE", role: "PRECISION SPECIALIST", accent: "#74dcff", pace: 0.96, accuracy: 1.18, curve: 0.99 },
  { id: "zion-arc", name: "ZION ARC", role: "CURVE MASTER", accent: "#ff9bd4", pace: 0.97, accuracy: 1.00, curve: 1.22 },
  { id: "kai-mori", name: "KAI MORI", role: "COMPOSURE PLAYER", accent: "#c7b7ff", pace: 0.98, accuracy: 1.08, curve: 1.00 }
];

const keepers = [
  { id: "default", name: "MILO KENT", role: "BALANCED KEEPER", accent: "#dafe4d", reach: 1.00, central: 0.00, low: 0.00, high: 0.00 },
  { id: "reflex", name: "RAFA SOL", role: "REFLEX KEEPER", accent: "#67d9ff", reach: 0.96, central: 0.10, low: 0.00, high: 0.00 },
  { id: "giant", name: "BRUNO HALE", role: "GIANT KEEPER", accent: "#ffb36b", reach: 1.18, central: 0.02, low: -0.13, high: 0.05 },
  { id: "reader", name: "ELI VOSS", role: "SHOT READER", accent: "#d2a7ff", reach: 1.04, central: 0.05, low: 0.00, high: 0.00 },
  { id: "aggressive", name: "JAX MERCER", role: "AGGRESSIVE KEEPER", accent: "#ff718f", reach: 1.00, central: 0.13, low: 0.00, high: -0.10 }
];

const walls = [
  { id: "default", name: "ACADEMY LINE", role: "BALANCED WALL", accent: "#7ca98b", coverage: 1.00, jump: 1.00, extra: 0 },
  { id: "compact", name: "IRON BLOCK", role: "COMPACT WALL", accent: "#63d49a", coverage: 1.15, jump: 1.00, extra: 0 },
  { id: "leaping", name: "SKYLINE FOUR", role: "LEAPING WALL", accent: "#ffb457", coverage: 1.00, jump: 1.38, extra: 0 },
  { id: "reading", name: "VECTOR UNIT", role: "READING WALL", accent: "#b995ff", coverage: 1.08, jump: 1.12, extra: 0 },
  { id: "staggered", name: "BROKEN RHYTHM", role: "STAGGERED WALL", accent: "#ff718f", coverage: 1.06, jump: 1.18, extra: 1 }
];

const dom = {
  stage: document.getElementById("labStage"),
  kicker: document.getElementById("labKicker"),
  keeper: document.getElementById("labKeeper"),
  wall: document.getElementById("labWall"),
  tier: document.getElementById("labTier"),
  wind: document.getElementById("labWind"),
  apply: document.getElementById("labApply"),
  reset: document.getElementById("labReset"),
  copy: document.getElementById("labCopy"),
  summary: document.getElementById("labMatchupSummary"),
  canvas: document.getElementById("gameCanvas"),
  action: document.getElementById("shotAction"),
  phaseTitle: document.getElementById("phaseTitle"),
  phaseHelp: document.getElementById("phaseHelp"),
  powerReadout: document.getElementById("powerReadout"),
  aimReadout: document.getElementById("aimReadout"),
  curveReadout: document.getElementById("curveReadout"),
  meterFill: document.getElementById("meterFill"),
  meterMarker: document.getElementById("meterMarker"),
  meterLabel: document.getElementById("meterLabel"),
  meterNumber: document.getElementById("meterNumber"),
  stageNumber: document.getElementById("stageNumber"),
  stageName: document.getElementById("stageName"),
  score: document.getElementById("scoreValue"),
  goals: document.getElementById("streakValue"),
  windArrow: document.getElementById("windArrow"),
  windValue: document.getElementById("windValue"),
  result: document.getElementById("resultBanner"),
  prompt: document.getElementById("canvasPrompt"),
  exit: document.getElementById("exitGame"),
  stats: {
    shots: document.getElementById("labShots"),
    goalRate: document.getElementById("labGoalRate"),
    saves: document.getElementById("labSaves"),
    wall: document.getElementById("labWallBlocks"),
    frame: document.getElementById("labFrameHits"),
    misses: document.getElementById("labMisses"),
    pace: document.getElementById("labAveragePace"),
    clearance: document.getElementById("labAverageClearance"),
    margin: document.getElementById("labAverageMargin"),
    last: document.getElementById("labLastResult")
  }
};

const ctx = dom.canvas.getContext("2d");

const state = {
  scenario: scenarios[0],
  kicker: kickers[0],
  keeper: keepers[0],
  wall: walls[0],
  stageIndex: 0,
  tier: 1,
  wind: scenarios[0].wind,
  phase: "ready",
  meter: 0,
  direction: 1,
  timer: null,
  shot: {},
  stats: createStats()
};

function createStats() {
  return {
    shots: 0,
    goals: 0,
    saves: 0,
    wallBlocks: 0,
    frameHits: 0,
    misses: 0,
    paceTotal: 0,
    clearanceTotal: 0,
    clearanceCount: 0,
    marginTotal: 0,
    marginCount: 0,
    last: null
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smooth(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function addOption(select, value, label) {
  const option = document.createElement("option");
  option.value = String(value);
  option.textContent = label;
  select.appendChild(option);
}

function populateSelectors() {
  scenarios.forEach((scenario, index) => {
    addOption(dom.stage, index, `STAGE ${index + 1} · ${scenario.distance} YDS · ${scenario.name}`);
  });
  kickers.forEach((kicker) => addOption(dom.kicker, kicker.id, `${kicker.name} · ${kicker.role}`));
  keepers.forEach((keeper, index) => addOption(dom.keeper, keeper.id, index === 0 ? "STAGE DEFAULT" : `${keeper.name} · ${keeper.role}`));
  walls.forEach((wall, index) => addOption(dom.wall, wall.id, index === 0 ? "STAGE DEFAULT" : `${wall.name} · ${wall.role}`));
  [1, 2, 3, 4].forEach((tier) => addOption(dom.tier, tier, `TIER ${tier}`));
  [
    ["stage", "SCENARIO WIND"],
    [0, "CALM"],
    [-0.35, "3.5 M/S LEFT"],
    [-0.25, "2.5 M/S LEFT"],
    [-0.15, "1.5 M/S LEFT"],
    [0.15, "1.5 M/S RIGHT"],
    [0.25, "2.5 M/S RIGHT"],
    [0.35, "3.5 M/S RIGHT"]
  ].forEach(([value, label]) => addOption(dom.wind, value, label));
}

function idealPower() {
  return clamp(0.63 + (state.scenario.distance - 18) * 0.0082, 0.66, 0.86);
}

function powerQuality(power) {
  const difference = Math.abs(power - idealPower());
  if (difference <= 0.04) return 1;
  return 1 - smooth((difference - 0.04) / 0.28);
}

function qualityLabel(power) {
  const quality = powerQuality(power);
  if (quality >= 0.90) return "PERFECT";
  if (quality >= 0.68) return "CLEAN";
  if (quality >= 0.38) return "RISKY";
  return power < idealPower() ? "UNDERHIT" : "OVERHIT";
}

function currentAim() {
  const x = 0.07 + state.meter * 0.86;
  const power = state.shot.power ?? idealPower();
  const powerDifference = clamp((power - idealPower()) / 0.34, -1.2, 1.1);
  const y = clamp(0.48 - powerDifference * 0.25, 0.13, 0.82);
  const vertical = y < 0.32 ? "HIGH" : y > 0.59 ? "LOW" : "MID";
  const horizontal = x < 0.33 ? "LEFT" : x > 0.67 ? "RIGHT" : "CENTRE";
  return { x, y, label: `${vertical} ${horizontal}` };
}

function setPhase(phase) {
  stopMeter();
  state.phase = phase;
  state.meter = phase === "curve" ? 0.5 : 0;
  state.direction = 1;

  const copy = {
    ready: ["READY", "The selected matchup repeats after every attempt.", "START SHOT", "SHOT METER"],
    power: ["SET POWER", "Stop inside the clean contact zone.", "LOCK POWER", "POWER"],
    aim: ["PICK YOUR SIDE", "Read the keeper and wall before committing.", "LOCK PLACEMENT", "PLACEMENT"],
    curve: ["ADD CURVE", "Counter the wind and bend around the wall.", "TAKE SHOT", "CURVE"],
    result: ["SHOT COMPLETE", "Review the result or start the next attempt.", "NEXT SHOT", "RESULT"]
  }[phase];

  dom.phaseTitle.textContent = copy[0];
  dom.phaseHelp.textContent = copy[1];
  dom.action.textContent = copy[2];
  dom.meterLabel.textContent = copy[3];
  dom.prompt.textContent = phase === "ready" ? `${state.scenario.distance} YARDS · ${state.scenario.name}` : copy[2];

  document.querySelectorAll(".shot-step").forEach((step, index) => {
    const phaseIndex = ["power", "aim", "curve"].indexOf(phase);
    step.classList.toggle("is-current", phase === "ready" ? index === 0 : phaseIndex === index);
    step.classList.toggle("is-complete", phaseIndex > index || phase === "result");
  });

  if (["power", "aim", "curve"].includes(phase)) startMeter();
}

function startMeter() {
  stopMeter();
  state.timer = window.setInterval(() => {
    const speed = 0.018 * (1 + (state.tier - 1) * 0.08);
    state.meter += state.direction * speed;
    if (state.meter >= 1) {
      state.meter = 1;
      state.direction = -1;
    } else if (state.meter <= 0) {
      state.meter = 0;
      state.direction = 1;
    }
    updateMeterUi();
  }, 30);
}

function stopMeter() {
  if (state.timer) window.clearInterval(state.timer);
  state.timer = null;
}

function updateMeterUi() {
  const percent = state.meter * 100;
  dom.meterFill.style.width = `${percent}%`;
  dom.meterMarker.style.left = `${percent}%`;

  if (state.phase === "power") {
    dom.meterNumber.textContent = `${qualityLabel(state.meter)} ${Math.round(percent)}%`;
  } else if (state.phase === "aim") {
    dom.meterNumber.textContent = currentAim().label;
    drawScene();
  } else if (state.phase === "curve") {
    const curve = (state.meter - 0.5) * 2;
    const side = curve < -0.12 ? "L" : curve > 0.12 ? "R" : "C";
    dom.meterNumber.textContent = `${side} ${Math.round(Math.abs(curve) * 100)}%`;
  }
}

function resolveShot() {
  const shot = state.shot;
  const quality = powerQuality(shot.power);
  const powerDifference = shot.power - idealPower();
  const curve = shot.curve * state.kicker.curve;
  const selectedX = -HALF_GOAL + shot.aimX * GOAL_WIDTH;
  const selectedY = GOAL_HEIGHT * (1 - shot.aimY);

  const targetX = selectedX
    + curve * (0.45 + state.scenario.distance * 0.012)
    + state.wind * (0.55 + state.scenario.distance * 0.012)
    + (1 - quality) * 0.18 / state.kicker.accuracy;
  const targetY = selectedY + powerDifference * 0.72;
  const pace = (15.5 + smooth(shot.power) * 21) * state.kicker.pace;

  const wallCount = state.scenario.wall + state.wall.extra;
  const wallCoverage = wallCount * 0.17 * state.wall.coverage * (1 + (state.tier - 1) * 0.03);
  const wallClearance = targetY + 0.75 - (1.75 + 0.25 * state.wall.jump * (1 + (state.tier - 1) * 0.03));
  const wallBlocked = Math.abs(targetX) < wallCoverage && wallClearance < 0;

  let outcome;
  let reason;
  let keeperMargin = null;

  if (wallBlocked) {
    outcome = "WALL";
    reason = "Trajectory intersected the wall.";
  } else if (Math.abs(Math.abs(targetX) - HALF_GOAL) <= 0.14 && targetY > 0 && targetY < GOAL_HEIGHT + 0.14) {
    outcome = "POST";
    reason = "Final target clipped the post.";
  } else if (Math.abs(targetY - GOAL_HEIGHT) <= 0.14 && Math.abs(targetX) < HALF_GOAL + 0.14) {
    outcome = "BAR";
    reason = "Final target clipped the crossbar.";
  } else if (Math.abs(targetX) >= HALF_GOAL || targetY <= 0.05 || targetY >= GOAL_HEIGHT) {
    outcome = "MISS";
    reason = targetY >= GOAL_HEIGHT ? "Shot finished above the crossbar." : "Shot finished outside the posts.";
  } else {
    const central = Math.abs(targetX) < 1.35;
    const low = targetY < 0.82;
    const high = targetY > 1.66;
    const reachScore = Math.hypot(targetX / (2.25 * state.keeper.reach), (targetY - 1.08) / (1.25 * state.keeper.reach));
    const threshold = 0.90
      + state.scenario.keeper * 0.12
      + (state.tier - 1) * 0.025
      + (central ? state.keeper.central : 0)
      + (low ? state.keeper.low : 0)
      + (high ? state.keeper.high : 0)
      - smooth((pace - 27) / 10) * 0.08;
    keeperMargin = reachScore - threshold;
    if (keeperMargin <= 0) {
      outcome = "SAVE";
      reason = "The goalkeeper reached the ball.";
    } else {
      outcome = "GOAL";
      reason = "Placement, pace and curve beat the goalkeeper.";
    }
  }

  return {
    outcome,
    reason,
    powerPercent: Math.round(shot.power * 100),
    speedMps: pace,
    wallClearance,
    keeperMargin,
    targetX,
    targetY
  };
}

function recordResult(result) {
  const stats = state.stats;
  stats.shots += 1;
  if (result.outcome === "GOAL") stats.goals += 1;
  if (result.outcome === "SAVE") stats.saves += 1;
  if (result.outcome === "WALL") stats.wallBlocks += 1;
  if (["POST", "BAR"].includes(result.outcome)) stats.frameHits += 1;
  if (result.outcome === "MISS") stats.misses += 1;
  stats.paceTotal += result.speedMps;
  stats.clearanceTotal += result.wallClearance;
  stats.clearanceCount += 1;
  if (Number.isFinite(result.keeperMargin)) {
    stats.marginTotal += result.keeperMargin;
    stats.marginCount += 1;
  }
  stats.last = result;
  window.__footballLabMatchupStats = { ...stats };
  renderStats();
}

function renderStats() {
  const stats = state.stats;
  dom.stats.shots.textContent = String(stats.shots);
  dom.stats.goalRate.textContent = stats.shots ? `${Math.round((stats.goals / stats.shots) * 100)}%` : "0%";
  dom.stats.saves.textContent = String(stats.saves);
  dom.stats.wall.textContent = String(stats.wallBlocks);
  dom.stats.frame.textContent = String(stats.frameHits);
  dom.stats.misses.textContent = String(stats.misses);
  dom.stats.pace.textContent = stats.shots ? `${(stats.paceTotal / stats.shots).toFixed(1)} m/s` : "—";
  dom.stats.clearance.textContent = stats.clearanceCount ? `${(stats.clearanceTotal / stats.clearanceCount).toFixed(2)} m` : "—";
  dom.stats.margin.textContent = stats.marginCount ? (stats.marginTotal / stats.marginCount).toFixed(3) : "—";
  dom.stats.last.textContent = stats.last
    ? `${stats.last.outcome} · ${stats.last.powerPercent}% power · ${stats.last.speedMps.toFixed(1)} m/s · ${stats.last.reason}`
    : "No shots recorded.";
  dom.score.textContent = String(stats.shots);
  dom.goals.textContent = String(stats.goals);
}

function drawScene(result = null) {
  dom.canvas.width = 1200;
  dom.canvas.height = 720;

  const background = ctx.createLinearGradient(0, 0, 0, 720);
  background.addColorStop(0, "#06160d");
  background.addColorStop(0.45, "#0b2116");
  background.addColorStop(1, "#174f2e");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1200, 720);

  ctx.fillStyle = "rgba(1,6,3,.72)";
  ctx.fillRect(0, 90, 1200, 180);

  ctx.fillStyle = "#174f2e";
  ctx.beginPath();
  ctx.moveTo(70, 720);
  ctx.lineTo(1130, 720);
  ctx.lineTo(935, 270);
  ctx.lineTo(265, 270);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#f4faf2";
  ctx.lineWidth = 6;
  ctx.strokeRect(430, 185, 340, 165);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(240,248,237,.25)";
  for (let x = 464; x < 770; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, 185);
    ctx.lineTo(x, 350);
    ctx.stroke();
  }
  for (let y = 218; y < 350; y += 33) {
    ctx.beginPath();
    ctx.moveTo(430, y);
    ctx.lineTo(770, y);
    ctx.stroke();
  }

  const wallCount = state.scenario.wall + state.wall.extra;
  const wallStart = 600 - ((wallCount - 1) * 28 * state.wall.coverage);
  for (let index = 0; index < wallCount; index += 1) {
    const x = wallStart + index * 56 * state.wall.coverage;
    ctx.fillStyle = state.wall.accent;
    ctx.strokeStyle = "#07110b";
    ctx.lineWidth = 3;
    ctx.fillRect(x - 13, 322, 26, 64);
    ctx.strokeRect(x - 13, 322, 26, 64);
    ctx.fillStyle = "#c99774";
    ctx.beginPath();
    ctx.arc(x, 309, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = state.keeper.accent;
  ctx.fillRect(586, 250, 28, 65);
  ctx.fillStyle = state.kicker.accent;
  ctx.fillRect(568, 575, 38, 88);
  ctx.fillStyle = "#c99774";
  ctx.beginPath();
  ctx.arc(587, 561, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f7faf5";
  ctx.strokeStyle = "#07110b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(620, 650, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (state.phase === "aim") {
    const aim = currentAim();
    const x = 430 + aim.x * 340;
    const y = 185 + aim.y * 165;
    ctx.strokeStyle = state.kicker.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.moveTo(x - 30, y);
    ctx.lineTo(x + 30, y);
    ctx.moveTo(x, y - 30);
    ctx.lineTo(x, y + 30);
    ctx.stroke();
  }

  if (result) {
    const endX = 600 + result.targetX * 46;
    const endY = 350 - result.targetY * 68;
    ctx.strokeStyle = state.kicker.accent;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(620, 650);
    ctx.quadraticCurveTo((620 + endX) / 2, 330, endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = state.kicker.accent;
    ctx.beginPath();
    ctx.arc(endX, endY, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function resetAttempt() {
  state.shot = {};
  dom.powerReadout.textContent = "—";
  dom.aimReadout.textContent = "—";
  dom.curveReadout.textContent = "—";
  dom.result.textContent = "";
  dom.result.className = "result-banner";
  setPhase("ready");
  drawScene();
}

function handleAction() {
  if (["ready", "result"].includes(state.phase)) {
    resetAttempt();
    setPhase("power");
    return;
  }

  if (state.phase === "power") {
    state.shot.power = state.meter;
    dom.powerReadout.textContent = `${Math.round(state.meter * 100)}% · ${qualityLabel(state.meter)}`;
    setPhase("aim");
    return;
  }

  if (state.phase === "aim") {
    const aim = currentAim();
    state.shot.aimX = aim.x;
    state.shot.aimY = aim.y;
    dom.aimReadout.textContent = aim.label;
    setPhase("curve");
    return;
  }

  if (state.phase === "curve") {
    state.shot.curve = (state.meter - 0.5) * 2;
    dom.curveReadout.textContent = Math.abs(state.shot.curve) < 0.12
      ? "STRAIGHT"
      : `${state.shot.curve < 0 ? "LEFT" : "RIGHT"} ${Math.round(Math.abs(state.shot.curve) * 100)}%`;
    stopMeter();
    const result = resolveShot();
    recordResult(result);
    setPhase("result");
    dom.result.textContent = result.outcome === "BAR" ? "CROSSBAR" : result.outcome;
    dom.result.className = `result-banner is-visible${result.outcome === "GOAL" ? "" : " is-miss"}`;
    drawScene(result);
  }
}

function applyMatchup() {
  state.stageIndex = clamp(Number(dom.stage.value) || 0, 0, scenarios.length - 1);
  state.scenario = scenarios[state.stageIndex];
  state.kicker = kickers.find((item) => item.id === dom.kicker.value) || kickers[0];
  state.keeper = keepers.find((item) => item.id === dom.keeper.value) || keepers[0];
  state.wall = walls.find((item) => item.id === dom.wall.value) || walls[0];
  state.tier = clamp(Number(dom.tier.value) || 1, 1, 4);
  state.wind = dom.wind.value === "stage" ? state.scenario.wind : Number(dom.wind.value);
  state.stats = createStats();

  dom.stageNumber.textContent = `STAGE ${String(state.stageIndex + 1).padStart(2, "0")} · ${state.scenario.distance} YDS`;
  dom.stageName.textContent = state.scenario.name;
  dom.windArrow.textContent = state.wind < -0.01 ? "←" : state.wind > 0.01 ? "→" : "•";
  dom.windValue.textContent = `${Math.abs(state.wind * 10).toFixed(1)} m/s`;
  dom.summary.innerHTML = `<strong>${state.kicker.name} VS ${state.keeper.name}</strong>${state.wall.name} · Tier ${state.tier} defence · ${state.scenario.distance} yards`;

  renderStats();
  resetAttempt();
}

function resetResults() {
  state.stats = createStats();
  renderStats();
}

async function copyResults() {
  const stats = state.stats;
  const summary = [
    "FOOTBALL LAB · MATCHUP TEST",
    `Stage: ${state.stageIndex + 1} · ${state.scenario.distance} yards`,
    `Kicker: ${state.kicker.name}`,
    `Goalkeeper: ${state.keeper.name} · Tier ${state.tier}`,
    `Wall: ${state.wall.name} · Tier ${state.tier}`,
    `Shots: ${stats.shots}`,
    `Goal rate: ${stats.shots ? Math.round((stats.goals / stats.shots) * 100) : 0}%`,
    `Saves: ${stats.saves}`,
    `Wall blocks: ${stats.wallBlocks}`,
    `Frame hits: ${stats.frameHits}`,
    `Misses: ${stats.misses}`
  ].join("\n");

  try {
    await navigator.clipboard.writeText(summary);
    const previous = dom.copy.textContent;
    dom.copy.textContent = "COPIED";
    window.setTimeout(() => { dom.copy.textContent = previous; }, 900);
  } catch {
    console.info(summary);
  }
}

populateSelectors();
dom.apply.addEventListener("click", applyMatchup);
dom.reset.addEventListener("click", resetResults);
dom.copy.addEventListener("click", copyResults);
dom.action.addEventListener("click", handleAction);
dom.canvas.addEventListener("pointerdown", handleAction);
dom.exit.addEventListener("click", () => { window.location.href = "./index.html"; });
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    handleAction();
  }
});

applyMatchup();
document.body.dataset.labReady = "true";
window.__footballLabStandaloneLabReady = true;
