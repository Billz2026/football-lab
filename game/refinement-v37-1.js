import {
  WORLD,
  canvasView,
  clamp,
  currentAimTarget,
  elements,
  smoothStep,
  state
} from "./core-v6.js?v=32.4";
import { buildCamera, GOAL } from "./world-v7.js?v=32.4";
import { projectWorld } from "./projection-v6.js?v=32.4";

const BUILD = "37.1.0";
const MODE_RISK = Object.freeze({ guided: 0.78, standard: 1, expert: 1.2 });

function ensureStyles() {
  if (document.getElementById("refinementStylesV371")) return;
  const style = document.createElement("style");
  style.id = "refinementStylesV371";
  style.textContent = `
    .aim-risk-halo-v371 {
      position:fixed;
      left:0;
      top:0;
      width:46px;
      height:46px;
      z-index:55;
      pointer-events:none;
      border:1.5px solid rgba(218,254,77,.58);
      border-radius:50%;
      box-shadow:0 0 0 1px rgba(3,10,6,.45),0 0 20px rgba(218,254,77,.1),inset 0 0 16px rgba(218,254,77,.055);
      transform:translate(-50%,-50%);
      opacity:0;
      transition:width .12s ease,height .12s ease,opacity .12s ease,border-color .12s ease;
    }
    .aim-risk-halo-v371::before,
    .aim-risk-halo-v371::after {
      content:"";
      position:absolute;
      inset:50% auto auto 50%;
      background:rgba(218,254,77,.72);
      transform:translate(-50%,-50%);
      border-radius:99px;
    }
    .aim-risk-halo-v371::before { width:7px; height:1px; }
    .aim-risk-halo-v371::after { width:1px; height:7px; }
    .aim-risk-halo-v371[data-risk="high"] { border-color:rgba(255,211,102,.72); }
    .training-accuracy-v371 { display:none; }
    html.training-active-v35 #livesValue { display:none !important; }
    html.training-active-v35 .training-accuracy-v371 { display:inline !important; }
  `;
  document.head.appendChild(style);
}

function ensureRiskHalo() {
  let halo = document.getElementById("aimRiskHaloV371");
  if (halo) return halo;
  halo = document.createElement("i");
  halo.id = "aimRiskHaloV371";
  halo.className = "aim-risk-halo-v371";
  halo.setAttribute("aria-hidden", "true");
  document.body.appendChild(halo);
  return halo;
}

function ensureTrainingAccuracyValue() {
  const original = elements.livesValue;
  if (!original?.parentElement) return null;
  let value = document.getElementById("trainingAccuracyV371");
  if (value) return value;
  value = document.createElement("strong");
  value.id = "trainingAccuracyV371";
  value.className = "training-accuracy-v371";
  value.textContent = "0%";
  original.insertAdjacentElement("afterend", value);
  return value;
}

function trainingAccuracy() {
  const attempts = Number(state.trainingAttempts) || 0;
  const goals = Number(state.trainingGoals) || 0;
  return {
    attempts,
    goals,
    percent: attempts ? Math.round(goals / attempts * 100) : 0
  };
}

function syncTrainingAccuracy() {
  const value = ensureTrainingAccuracyValue();
  if (!value) return;
  const stats = trainingAccuracy();
  value.textContent = `${stats.percent}%`;
  value.title = `${stats.goals} goals from ${stats.attempts} training attempts`;
}

function aimRisk() {
  const curve = Math.abs(Number(state.shot?.previewCurve) || 0);
  const curvePressure = smoothStep(clamp((curve - 0.12) / 0.88, 0, 1));
  const distance = clamp(Number(state.currentStage?.distanceYards) || 20, 16, 45);
  const distancePressure = clamp((distance - 18) / 27, 0, 1);
  const mode = state.controlMode || "standard";
  const modeScale = MODE_RISK[mode] || MODE_RISK.standard;
  const risk = clamp((0.34 + curvePressure * 0.43 + distancePressure * 0.23) * modeScale, 0.24, 1.18);
  return { curvePressure, distancePressure, mode, modeScale, risk };
}

function targetScreenPoint() {
  const target = currentAimTarget();
  const world = {
    x: -GOAL.halfWidth + target.x * GOAL.width,
    y: GOAL.height * (1 - target.y),
    z: 0.03
  };
  const projected = projectWorld(world, buildCamera(state.currentStage), WORLD);
  if (!projected?.visible) return null;
  const rect = elements.canvas.getBoundingClientRect();
  return {
    x: rect.left + canvasView.offsetX + projected.x * canvasView.scale,
    y: rect.top + canvasView.offsetY + projected.y * canvasView.scale,
    rect,
    projected,
    target
  };
}

function renderRiskHalo() {
  const halo = ensureRiskHalo();
  const active = state.screen === "game" && state.phase === "aim" && !state.animation;
  if (!active) {
    halo.style.opacity = "0";
    requestAnimationFrame(renderRiskHalo);
    return;
  }
  const point = targetScreenPoint();
  if (!point) {
    halo.style.opacity = "0";
    requestAnimationFrame(renderRiskHalo);
    return;
  }
  const risk = aimRisk();
  const viewportScale = clamp(point.rect.width / 920, 0.72, 1.12);
  const diameter = (34 + risk.risk * 40) * viewportScale;
  halo.style.left = `${point.x}px`;
  halo.style.top = `${point.y}px`;
  halo.style.width = `${diameter}px`;
  halo.style.height = `${diameter}px`;
  halo.style.opacity = "1";
  halo.dataset.risk = risk.risk >= 0.82 ? "high" : risk.risk >= 0.55 ? "medium" : "low";
  halo.title = "Precision risk area: intended target only, not a solved trajectory";
  window.__footballLabAimRiskV371 = {
    build: BUILD,
    risk: Number(risk.risk.toFixed(3)),
    diameter: Number(diameter.toFixed(2)),
    curvePressure: Number(risk.curvePressure.toFixed(3)),
    distancePressure: Number(risk.distancePressure.toFixed(3)),
    mode: risk.mode,
    solvedTrajectory: false
  };
  requestAnimationFrame(renderRiskHalo);
}

function placementLabel(x, y) {
  const horizontal = x < 0
    ? "OUTSIDE LEFT"
    : x > 1
      ? "OUTSIDE RIGHT"
      : x < 0.33 ? "LEFT" : x > 0.67 ? "RIGHT" : "CENTRE";
  const vertical = y < 0
    ? "ABOVE BAR"
    : y < 0.31 ? "HIGH" : y > 0.67 ? "LOW" : "MID";
  return `${vertical} ${horizontal}`;
}

function contactCopy(shot) {
  const quality = clamp(Number.isFinite(shot?.contactQuality) ? shot.contactQuality : 1, 0.06, 1);
  const offset = Number(shot?.contactOffset) || 0;
  if (quality >= 0.94) return "PERFECT CONTACT";
  if (quality >= 0.72) return offset < 0 ? "CLEAN EARLY" : "CLEAN LATE";
  if (quality >= 0.44) return offset < 0 ? "MISHIT EARLY" : "MISHIT LATE";
  return offset < 0 ? "POOR EARLY" : "POOR LATE";
}

function executionFeedback(shot) {
  const intendedX = Number.isFinite(shot?.intendedAimX) ? shot.intendedAimX : shot?.aimX;
  const intendedY = Number.isFinite(shot?.intendedAimY) ? shot.intendedAimY : shot?.aimY;
  const actualX = Number.isFinite(shot?.actualX)
    ? shot.actualX
    : Number.isFinite(shot?.executionAimX) ? shot.executionAimX : intendedX;
  const actualY = Number.isFinite(shot?.actualY)
    ? shot.actualY
    : Number.isFinite(shot?.executionAimY) ? shot.executionAimY : intendedY;
  if (![intendedX, intendedY, actualX, actualY].every(Number.isFinite)) return null;

  const dx = (actualX - intendedX) * GOAL.width;
  const dy = (actualY - intendedY) * GOAL.height;
  const total = Math.hypot(dx, dy);
  const horizontal = Math.abs(dx) < 0.03 ? "CENTRED" : dx < 0 ? `${Math.abs(dx).toFixed(2)}m LEFT` : `${Math.abs(dx).toFixed(2)}m RIGHT`;
  const vertical = Math.abs(dy) < 0.03 ? "LEVEL" : dy < 0 ? `${Math.abs(dy).toFixed(2)}m HIGH` : `${Math.abs(dy).toFixed(2)}m LOW`;

  return {
    intended: placementLabel(intendedX, intendedY),
    actual: placementLabel(actualX, actualY),
    dx,
    dy,
    total,
    horizontal,
    vertical,
    contact: contactCopy(shot)
  };
}

let lastBreakdown = null;
function enhanceBreakdown() {
  const presentation = state.presentation;
  const breakdown = presentation?.breakdown;
  const shot = state.shot;
  if (presentation?.phase !== "breakdown" || !breakdown || !shot || breakdown === lastBreakdown) return;
  const feedback = executionFeedback(shot);
  if (!feedback) return;
  lastBreakdown = breakdown;
  breakdown.placement = `${feedback.intended} → ${feedback.actual}`;
  const executionCopy = feedback.total < 0.04
    ? `EXECUTION ON TARGET · ${feedback.contact}`
    : `EXECUTION ${feedback.total.toFixed(2)}m · ${feedback.horizontal} · ${feedback.vertical} · ${feedback.contact}`;
  const baseReason = String(breakdown.reason || "");
  breakdown.reason = `${executionCopy}. ${baseReason}`.slice(0, 182);
  window.__footballLabLastFeedbackV371 = {
    build: BUILD,
    intended: feedback.intended,
    actual: feedback.actual,
    executionMetres: Number(feedback.total.toFixed(3)),
    horizontalMetres: Number(feedback.dx.toFixed(3)),
    verticalMetres: Number(feedback.dy.toFixed(3)),
    contact: feedback.contact
  };
}

function refinementLoop() {
  syncTrainingAccuracy();
  enhanceBreakdown();
  requestAnimationFrame(refinementLoop);
}

ensureStyles();
ensureTrainingAccuracyValue();
requestAnimationFrame(renderRiskHalo);
requestAnimationFrame(refinementLoop);

window.addEventListener("footballlab:trainingstart", syncTrainingAccuracy);
window.addEventListener("footballlab:phasechange", syncTrainingAccuracy);
window.addEventListener("footballlab:shotmodechange", () => { window.__footballLabAimRiskV371 = null; });

window.__footballLabRefinementV371 = Object.freeze({
  build: BUILD,
  trainingAccuracyIsolation: true,
  intendedVsActualFeedback: true,
  aimRiskHalo: true,
  solvedTrajectory: false,
  standardDifficultyChanged: false,
  modeRisk: { ...MODE_RISK },
  getTrainingAccuracy: trainingAccuracy,
  getAimRisk: aimRisk,
  getExecutionFeedback: executionFeedback
});