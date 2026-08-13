import { AIM_BOUNDS, clamp, idealPower, smoothStep, state } from "./core-v6.js?v=32.4";

const BUILD = "37.0.0";
const MODE_SCALE = Object.freeze({ guided: 0.68, standard: 1, expert: 1.22 });

function modeScale() {
  return MODE_SCALE[state.controlMode] || MODE_SCALE.standard;
}

function executionMetrics(shot = state.shot) {
  const power = clamp(Number(shot?.power ?? idealPower()), 0, 1);
  const ideal = idealPower();
  const powerDelta = power - ideal;
  const powerDeviation = Math.abs(powerDelta);
  const powerSeverity = smoothStep(clamp((powerDeviation - 0.04) / 0.25, 0, 1));

  const contactQuality = clamp(
    Number.isFinite(shot?.contactQuality) ? Number(shot.contactQuality) : 1,
    0.06,
    1
  );
  const contactOffset = clamp(Number(shot?.contactOffset) || 0, -1, 1);
  const contactSeverity = smoothStep(clamp((0.96 - contactQuality) / 0.90, 0, 1));

  const curve = clamp(Number(shot?.curve) || 0, -1, 1);
  const curvePressure = smoothStep(clamp((Math.abs(curve) - 0.18) / 0.82, 0, 1));
  const distanceYards = clamp(Number(state.currentStage?.distanceYards) || 20, 16, 45);
  const distancePressure = clamp((distanceYards - 18) / 27, 0, 1);
  const scale = modeScale();

  const combinedSeverity = clamp(
    contactSeverity * 0.69
      + powerSeverity * 0.31
      + contactSeverity * powerSeverity * 0.20,
    0,
    1
  );

  const deterministicSide = ((state.stage + (Number(shot?.aimX) >= 0.5 ? 1 : 0)) % 2 === 0) ? 1 : -1;
  const horizontalDirection = Math.abs(contactOffset) > 0.025
    ? Math.sign(contactOffset)
    : Math.sign(curve || powerDelta || deterministicSide);

  const horizontalLimit = (0.035 + distancePressure * 0.035 + curvePressure * 0.040) * scale;
  const curveTimingBias = Math.sign(curve || horizontalDirection)
    * curvePressure
    * contactSeverity
    * (0.008 + distancePressure * 0.012)
    * scale;
  const horizontalOffset = horizontalDirection * combinedSeverity * horizontalLimit + curveTimingBias;

  const verticalPower = -Math.sign(powerDelta || 1)
    * powerSeverity
    * (0.010 + distancePressure * 0.018)
    * scale;
  const verticalContact = contactOffset
    * contactSeverity
    * (0.008 + curvePressure * 0.010)
    * scale;
  const verticalOffset = verticalPower + verticalContact;

  return {
    power,
    idealPower: ideal,
    powerDelta,
    powerSeverity,
    contactQuality,
    contactOffset,
    contactSeverity,
    curve,
    curvePressure,
    distanceYards,
    distancePressure,
    mode: state.controlMode || "standard",
    modeScale: scale,
    severity: combinedSeverity,
    horizontalLimit,
    horizontalOffset,
    verticalOffset
  };
}

function applyExecutionCone() {
  if (state.screen !== "game" || state.phase !== "shooting") return;
  const shot = state.shot;
  if (!shot || shot.executionBalanceVersion === BUILD) return;
  if (!Number.isFinite(shot.aimX) || !Number.isFinite(shot.aimY)) return;

  const intendedAimX = shot.aimX;
  const intendedAimY = shot.aimY;
  const metrics = executionMetrics(shot);
  const executionAimX = clamp(intendedAimX + metrics.horizontalOffset, AIM_BOUNDS.minX, AIM_BOUNDS.maxX);
  const executionAimY = clamp(intendedAimY + metrics.verticalOffset, AIM_BOUNDS.minY, AIM_BOUNDS.maxY);

  Object.assign(shot, {
    intendedAimX,
    intendedAimY,
    executionAimX,
    executionAimY,
    executionErrorX: executionAimX - intendedAimX,
    executionErrorY: executionAimY - intendedAimY,
    executionSeverity: metrics.severity,
    executionMode: metrics.mode,
    executionBalanceVersion: BUILD,
    aimX: executionAimX,
    aimY: executionAimY
  });

  window.__footballLabLastExecutionV37 = {
    build: BUILD,
    intended: { x: intendedAimX, y: intendedAimY },
    executed: { x: executionAimX, y: executionAimY },
    error: {
      x: executionAimX - intendedAimX,
      y: executionAimY - intendedAimY
    },
    severity: metrics.severity,
    powerSeverity: metrics.powerSeverity,
    contactSeverity: metrics.contactSeverity,
    curvePressure: metrics.curvePressure,
    distancePressure: metrics.distancePressure,
    mode: metrics.mode,
    deterministic: true
  };

  const shotRef = shot;
  queueMicrotask(() => {
    if (state.shot !== shotRef) return;
    shotRef.aimX = intendedAimX;
    shotRef.aimY = intendedAimY;
  });
}

window.addEventListener("footballlab:phasechange", (event) => {
  if (event.detail?.phase === "shooting") applyExecutionCone();
});

export function previewExecution(inputs = {}) {
  const shot = {
    ...state.shot,
    ...inputs
  };
  const metrics = executionMetrics(shot);
  const intendedAimX = Number.isFinite(shot.aimX) ? shot.aimX : 0.5;
  const intendedAimY = Number.isFinite(shot.aimY) ? shot.aimY : 0.27;
  return {
    ...metrics,
    intendedAimX,
    intendedAimY,
    executionAimX: clamp(intendedAimX + metrics.horizontalOffset, AIM_BOUNDS.minX, AIM_BOUNDS.maxX),
    executionAimY: clamp(intendedAimY + metrics.verticalOffset, AIM_BOUNDS.minY, AIM_BOUNDS.maxY)
  };
}

window.__footballLabSkillBalanceV37 = Object.freeze({
  build: BUILD,
  model: "deterministic-execution-cone",
  reticleMeaning: "intended-target",
  rng: false,
  inputs: ["power", "contact", "curl", "distance", "mode"],
  modeScale: { ...MODE_SCALE },
  preview: previewExecution
});

import("./refinement-release-v37-1.js?v=37.1").catch((error) => {
  console.error("Football Lab V37.1 refinement failed to load", error);
});