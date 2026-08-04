import {
  clamp, state, elements, createShot, syncStage, setStageWind, setPhase,
  currentAimTarget, renderHud, strikeQualityLabel
} from "./core-v6.js?v=7";
import { SCENARIOS } from "./world-v7.js?v=7";
import { KICKERS, selectCharacter, activeCharacter, meterMultiplier } from "./characters-v13.js?v=13";
import { GOALKEEPERS, WALLS, keeperForStage, wallForStage } from "./lab-matchups-v15-3.js?v=153";
import { resolveShotPhysics } from "./lab-physics-v15-3b.js?v=1531";
import { resizeCanvas, drawScene } from "./lab-renderer-v15-3b.js?v=1531";
import { difficultyForStage } from "./difficulty-v9.js?v=9";

const ui = Object.freeze({
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
  shots: document.getElementById("labShots"),
  goalRate: document.getElementById("labGoalRate"),
  saves: document.getElementById("labSaves"),
  wallBlocks: document.getElementById("labWallBlocks"),
  frameHits: document.getElementById("labFrameHits"),
  misses: document.getElementById("labMisses"),
  pace: document.getElementById("labAveragePace"),
  clearance: document.getElementById("labAverageClearance"),
  margin: document.getElementById("labAverageMargin"),
  last: document.getElementById("labLastResult")
});

let stats;
let resetTimer = null;
let loopId = 0;
let lastFrameTime = performance.now();

function emptyStats() {
  return {
    shots: 0, goals: 0, saves: 0, wallBlocks: 0, frameHits: 0, misses: 0,
    paceTotal: 0, paceCount: 0, clearanceTotal: 0, clearanceCount: 0,
    marginTotal: 0, marginCount: 0, last: null
  };
}

function option(value, label) {
  const node = document.createElement("option");
  node.value = String(value);
  node.textContent = label;
  return node;
}

function populateControls() {
  SCENARIOS.forEach((scenario, index) => ui.stage.append(option(index, `STAGE ${index + 1} · ${scenario.distanceYards} YDS · ${scenario.name}`)));
  KICKERS.forEach((kicker) => ui.kicker.append(option(kicker.id, `${kicker.name} · ${kicker.role}`)));
  ui.keeper.append(option("", "STAGE DEFAULT"));
  GOALKEEPERS.forEach((keeper) => ui.keeper.append(option(keeper.id, `${keeper.name} · ${keeper.role}`)));
  ui.wall.append(option("", "STAGE DEFAULT"));
  WALLS.forEach((wall) => ui.wall.append(option(wall.id, `${wall.name} · ${wall.role}`)));
  [1, 2, 3, 4].forEach((tier) => ui.tier.append(option(tier, `TIER ${tier}`)));
  [
    ["stage", "SCENARIO WIND"], [0, "CALM"], [-0.35, "3.5 M/S LEFT"], [-0.25, "2.5 M/S LEFT"],
    [-0.15, "1.5 M/S LEFT"], [0.15, "1.5 M/S RIGHT"], [0.25, "2.5 M/S RIGHT"], [0.35, "3.5 M/S RIGHT"]
  ].forEach(([value, label]) => ui.wind.append(option(value, label)));
  ui.kicker.value = activeCharacter().id;
}

function percentage(value, total) {
  return total ? `${Math.round((value / total) * 100)}%` : "0%";
}

function renderStats() {
  ui.shots.textContent = String(stats.shots);
  ui.goalRate.textContent = percentage(stats.goals, stats.shots);
  ui.saves.textContent = String(stats.saves);
  ui.wallBlocks.textContent = String(stats.wallBlocks);
  ui.frameHits.textContent = String(stats.frameHits);
  ui.misses.textContent = String(stats.misses);
  ui.pace.textContent = stats.paceCount ? `${(stats.paceTotal / stats.paceCount).toFixed(1)} m/s` : "—";
  ui.clearance.textContent = stats.clearanceCount ? `${(stats.clearanceTotal / stats.clearanceCount).toFixed(2)} m` : "—";
  ui.margin.textContent = stats.marginCount ? (stats.marginTotal / stats.marginCount).toFixed(3) : "—";
  ui.last.textContent = stats.last
    ? `${stats.last.outcome} · ${stats.last.powerPercent}% power · ${stats.last.speedMps.toFixed(1)} m/s · ${stats.last.reason}`
    : "No shots recorded.";
  elements.scoreValue.textContent = String(stats.shots);
  elements.streakValue.textContent = String(stats.goals);
}

function resetStats() {
  stats = emptyStats();
  renderStats();
}

function recordShot() {
  const record = state.shot?.diagnostics;
  if (!record) return;
  stats.shots += 1;
  stats.goals += record.outcome === "GOAL" ? 1 : 0;
  stats.saves += record.outcome === "SAVE" ? 1 : 0;
  stats.wallBlocks += record.outcome === "WALL" ? 1 : 0;
  stats.frameHits += ["POST", "BAR"].includes(record.outcome) ? 1 : 0;
  stats.misses += record.outcome === "MISS" ? 1 : 0;
  if (Number.isFinite(record.speedMps)) { stats.paceTotal += record.speedMps; stats.paceCount += 1; }
  if (Number.isFinite(record.wallClearanceMetres)) { stats.clearanceTotal += record.wallClearanceMetres; stats.clearanceCount += 1; }
  if (Number.isFinite(record.keeperReachScore) && Number.isFinite(record.keeperThreshold)) {
    stats.marginTotal += record.keeperReachScore - record.keeperThreshold;
    stats.marginCount += 1;
  }
  stats.last = record;
  window.__footballLabMatchupStats = { ...stats };
  renderStats();
}

function drawOnce() {
  requestAnimationFrame((time) => drawScene(time, finishAnimation));
}

function shouldAnimate() {
  return Boolean(state.animation) || ["power", "aim", "curve"].includes(state.phase);
}

function ensureLoop() {
  if (loopId) return;
  lastFrameTime = performance.now();
  loopId = requestAnimationFrame(frame);
}

function frame(time) {
  loopId = 0;
  const delta = Math.min((time - lastFrameTime) / 1000, 0.05);
  lastFrameTime = time;
  updateMeter(delta);
  drawScene(time, finishAnimation);
  if (shouldAnimate()) loopId = requestAnimationFrame(frame);
}

function clearResult() {
  clearTimeout(resetTimer);
  resetTimer = null;
  elements.resultBanner.textContent = "";
  elements.resultBanner.className = "result-banner";
}

function resetAttempt() {
  clearResult();
  state.animation = null;
  state.finishedAnimationId = null;
  state.presentation = null;
  state.shot = createShot();
  syncStage();
  setStageWind();
  if (Number.isFinite(state.matchupLab?.wind)) state.stageWind = state.matchupLab.wind;
  elements.powerReadout.textContent = "—";
  elements.aimReadout.textContent = "—";
  elements.curveReadout.textContent = "—";
  setPhase("ready");
  renderHud();
  renderStats();
  drawOnce();
}

function resultLabel() {
  const shot = state.shot;
  if (shot.outcome === "GOAL") return shot.topCorner ? "TOP CORNER" : "GOAL";
  if (shot.outcome === "SAVE") return shot.saveType === "CATCH" ? "HELD" : "PARRIED";
  return ({ WALL: "BLOCKED", POST: "POST", BAR: "CROSSBAR", MISS: "WIDE" })[shot.outcome] || shot.outcome;
}

function finishAnimation(animationId) {
  if (!state.animation || state.finishedAnimationId === animationId) return;
  state.finishedAnimationId = animationId;
  state.animation = null;
  recordShot();
  setPhase("result");
  elements.resultBanner.textContent = resultLabel();
  elements.resultBanner.className = `result-banner is-visible${state.shot.outcome === "GOAL" ? "" : " is-miss"}`;
  drawOnce();
  resetTimer = setTimeout(resetAttempt, 1250);
}

function settleDuration(outcome) {
  if (outcome === "SAVE") return 390;
  if (outcome === "WALL") return 300;
  if (outcome === "POST" || outcome === "BAR") return 310;
  return 260;
}

function takeShot() {
  setPhase("shooting");
  clearResult();
  const { flightDuration } = resolveShotPhysics();
  const startedAt = performance.now();
  const settle = settleDuration(state.shot.outcome);
  state.animation = {
    id: `lab-${startedAt}-${state.stage}-${stats.shots}`,
    startedAt,
    runUpDuration: 560,
    contactHoldDuration: 64,
    flightDuration,
    settleDuration: settle,
    totalDuration: 560 + 64 + flightDuration + settle
  };
  state.finishedAnimationId = null;
  ensureLoop();
}

function curveLabel(value) {
  const amount = Math.round(Math.abs(value || 0) * 100);
  return amount < 12 ? "STRAIGHT" : `${value < 0 ? "LEFT" : "RIGHT"} ${amount}%`;
}

function handleAction() {
  if (state.animation) return;
  if (state.phase === "ready" || state.phase === "result") {
    resetAttempt();
    setPhase("power");
    ensureLoop();
    return;
  }
  if (state.phase === "power") {
    state.shot.power = state.meterValue;
    elements.powerReadout.textContent = `${Math.round(state.shot.power * 100)}% · ${strikeQualityLabel(state.shot.power)}`;
    setPhase("aim");
    ensureLoop();
    return;
  }
  if (state.phase === "aim") {
    const target = currentAimTarget();
    Object.assign(state.shot, { aimX: target.x, aimY: target.y });
    elements.aimReadout.textContent = target.label;
    setPhase("curve");
    ensureLoop();
    return;
  }
  if (state.phase === "curve") {
    state.shot.curve = (state.meterValue - 0.5) * 2;
    elements.curveReadout.textContent = curveLabel(state.shot.curve);
    takeShot();
  }
}

function updateMeter(delta) {
  if (!["power", "aim", "curve"].includes(state.phase)) return;
  const stage = state.currentStage;
  const difficulty = difficultyForStage(state.stage, stage);
  if (state.phase === "power") {
    state.meterClock += delta;
    const speed = (3.35 + stage.aimSpeed * 0.18) * difficulty.meter.power * meterMultiplier("power", state.stage);
    state.meterValue = (Math.sin(state.meterClock * speed - Math.PI / 2) + 1) / 2;
  } else if (state.phase === "aim") {
    state.meterClock += delta * difficulty.meter.aim * meterMultiplier("aim", state.stage);
    state.meterValue = currentAimTarget().x;
  } else {
    state.meterClock += delta;
    const speed = (2.78 + stage.aimSpeed * 0.2) * difficulty.meter.curve * meterMultiplier("curve", state.stage);
    state.meterValue = (Math.sin(state.meterClock * speed) + 1) / 2;
  }
  const percent = state.meterValue * 100;
  elements.meterFill.style.width = `${percent}%`;
  elements.meterMarker.style.left = `${percent}%`;
  if (state.phase === "curve") {
    const curve = (state.meterValue - 0.5) * 2;
    elements.meterNumber.textContent = `${curve < -0.12 ? "L" : curve > 0.12 ? "R" : "C"} ${Math.round(Math.abs(curve) * 100)}%`;
  } else if (state.phase === "aim") {
    elements.meterNumber.textContent = currentAimTarget().label;
  } else {
    elements.meterNumber.textContent = `${strikeQualityLabel(state.meterValue)} ${Math.round(percent)}%`;
  }
}

function renderMatchupSummary() {
  const keeper = keeperForStage(state.stage);
  const wall = wallForStage(state.stage);
  ui.summary.innerHTML = `<strong>${activeCharacter().name} VS ${keeper.name}</strong>${wall.name} · Tier ${keeper.tier} defence · ${state.currentStage.distanceYards} yards · ${Math.abs(state.stageWind * 10).toFixed(1)} m/s wind`;
}

function applyMatchup() {
  const stageIndex = clamp(Number(ui.stage.value) || 0, 0, SCENARIOS.length - 1);
  const windChoice = ui.wind.value;
  const wind = windChoice === "stage" ? null : Number(windChoice);
  selectCharacter(ui.kicker.value);
  state.matchupLab = {
    active: true,
    stageIndex,
    kickerId: ui.kicker.value,
    keeperId: ui.keeper.value || null,
    wallId: ui.wall.value || null,
    tier: clamp(Number(ui.tier.value) || 1, 1, 4),
    wind
  };
  state.screen = "game";
  state.stage = stageIndex;
  state.score = 0;
  state.streak = 0;
  state.misses = 0;
  syncStage();
  setStageWind();
  if (Number.isFinite(wind)) state.stageWind = wind;
  resetStats();
  resetAttempt();
  renderMatchupSummary();
  resizeCanvas();
  drawOnce();
}

async function copyResults() {
  const keeper = keeperForStage(state.stage);
  const wall = wallForStage(state.stage);
  const summary = [
    "FOOTBALL LAB · MATCHUP TEST",
    `Stage: ${state.stage + 1} · ${state.currentStage.distanceYards} yards`,
    `Kicker: ${activeCharacter().name}`,
    `Goalkeeper: ${keeper.name} · Tier ${keeper.tier}`,
    `Wall: ${wall.name} · Tier ${wall.tier}`,
    `Shots: ${stats.shots}`,
    `Goal rate: ${percentage(stats.goals, stats.shots)}`,
    `Saves: ${stats.saves}`,
    `Wall blocks: ${stats.wallBlocks}`,
    `Frame hits: ${stats.frameHits}`,
    `Misses: ${stats.misses}`
  ].join("\n");
  try {
    await navigator.clipboard.writeText(summary);
    const previous = ui.copy.textContent;
    ui.copy.textContent = "COPIED";
    setTimeout(() => { ui.copy.textContent = previous; }, 900);
  } catch {
    console.info(summary);
  }
}

populateControls();
stats = emptyStats();
ui.apply.addEventListener("click", applyMatchup);
ui.reset.addEventListener("click", resetStats);
ui.copy.addEventListener("click", copyResults);
elements.shotAction.addEventListener("click", handleAction);
elements.canvas.addEventListener("pointerdown", handleAction);
elements.exitGame.addEventListener("click", () => { location.href = "./index.html"; });
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") { event.preventDefault(); handleAction(); }
});
window.addEventListener("resize", () => { resizeCanvas(); drawOnce(); });

state.screen = "game";
state.animation = null;
state.presentation = null;
applyMatchup();
window.__footballLabStandaloneLabReady = true;
document.body.dataset.labReady = "true";
