import {
  clamp,
  elements,
  smoothStep,
  state
} from "./core-v6.js?v=32.4";
import { GOAL } from "./world-v7.js?v=32.4";

const BUILD = "37.1.1";
const MODE_RISK = Object.freeze({ guided: 0.78, standard: 1, expert: 1.2 });

function ensureStyles() {
  if (document.getElementById("refinementStylesV371")) return;
  const style = document.createElement("style");
  style.id = "refinementStylesV371";
  style.textContent = `
    .training-accuracy-v371 { display:none; }
    html.training-active-v35 #livesValue { display:none !important; }
    html.training-active-v35 .training-accuracy-v371 { display:inline !important; }
  `;
  document.head.appendChild(style);
}

function removeLegacyRiskHalo() {
  document.getElementById("aimRiskHaloV371")?.remove();
  document.querySelectorAll(".aim-risk-halo-v371").forEach((node) => node.remove());
  window.__footballLabAimRiskV371 = null;
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
  return { attempts, goals, percent: attempts ? Math.round(goals / attempts * 100) : 0 };
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

function placementLabel(x, y) {
  const horizontal = x < 0 ? "OUTSIDE LEFT" : x > 1 ? "OUTSIDE RIGHT" : x < 0.33 ? "LEFT" : x > 0.67 ? "RIGHT" : "CENTRE";
  const vertical = y < 0 ? "ABOVE BAR" : y < 0.31 ? "HIGH" : y > 0.67 ? "LOW" : "MID";
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
  const actualX = Number.isFinite(shot?.actualX) ? shot.actualX : Number.isFinite(shot?.executionAimX) ? shot.executionAimX : intendedX;
  const actualY = Number.isFinite(shot?.actualY) ? shot.actualY : Number.isFinite(shot?.executionAimY) ? shot.executionAimY : intendedY;
  if (![intendedX, intendedY, actualX, actualY].every(Number.isFinite)) return null;
  const dx = (actualX - intendedX) * GOAL.width;
  const dy = (actualY - intendedY) * GOAL.height;
  const total = Math.hypot(dx, dy);
  return {
    intended: placementLabel(intendedX, intendedY),
    actual: placementLabel(actualX, actualY),
    dx,
    dy,
    total,
    horizontal: Math.abs(dx) < 0.03 ? "CENTRED" : dx < 0 ? `${Math.abs(dx).toFixed(2)}m LEFT` : `${Math.abs(dx).toFixed(2)}m RIGHT`,
    vertical: Math.abs(dy) < 0.03 ? "LEVEL" : dy < 0 ? `${Math.abs(dy).toFixed(2)}m HIGH` : `${Math.abs(dy).toFixed(2)}m LOW`,
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
  breakdown.reason = `${executionCopy}. ${String(breakdown.reason || "")}`.slice(0, 182);
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
  removeLegacyRiskHalo();
  syncTrainingAccuracy();
  enhanceBreakdown();
  requestAnimationFrame(refinementLoop);
}

ensureStyles();
removeLegacyRiskHalo();
ensureTrainingAccuracyValue();
requestAnimationFrame(refinementLoop);
window.addEventListener("footballlab:trainingstart", syncTrainingAccuracy);
window.addEventListener("footballlab:phasechange", syncTrainingAccuracy);
window.addEventListener("footballlab:shotmodechange", removeLegacyRiskHalo);

window.__footballLabRefinementV371 = Object.freeze({
  build: BUILD,
  trainingAccuracyIsolation: true,
  intendedVsActualFeedback: true,
  aimRiskHalo: false,
  solvedTrajectory: false,
  standardDifficultyChanged: false,
  modeRisk: { ...MODE_RISK },
  getTrainingAccuracy: trainingAccuracy,
  getAimRisk: aimRisk,
  getExecutionFeedback: executionFeedback
});
