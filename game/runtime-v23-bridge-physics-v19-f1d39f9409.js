import { clamp, idealPower, lerp, smoothStep, state } from "./core-v6.js?v=32.4";
import {
  normalisePathByDistance,
  previewShotPhysics as previewBaseShotPhysics,
  resolveShotPhysics as resolveBaseShotPhysics,
  sampleShotPath as sampleBaseShotPath
} from "./runtime-v23-bridge-physics-v19-base-v332.js?v=33.3";

const BUILD = "33.3.0";

function doubleFaultMetrics(shot) {
  const power = clamp(Number(shot?.power ?? idealPower()), 0, 1);
  const ideal = idealPower();
  const powerDeviation = Math.abs(power - ideal);
  const contactQuality = clamp(Number.isFinite(shot?.contactQuality) ? shot.contactQuality : 1, 0.06, 1);
  const powerSeverity = smoothStep(clamp((powerDeviation - 0.18) / 0.24, 0, 1));
  const contactSeverity = smoothStep(clamp((0.46 - contactQuality) / 0.40, 0, 1));
  const severity = powerSeverity * contactSeverity;
  return {
    power,
    ideal,
    powerDeviation,
    contactQuality,
    powerSeverity,
    contactSeverity,
    severity,
    underhit: power < ideal,
    overhit: power > ideal
  };
}

function durationFromDistance(shot, metrics) {
  const speed = Math.max(15, Number(shot.speedMps) || 15);
  const primaryMs = clamp(metrics.primaryDistance / speed * 1180, 820, 1680);
  if (metrics.continuationDistance <= 0.01) return Math.round(primaryMs + 100);
  const continuationSpeed = Math.max(8, speed * 0.42);
  const continuationMs = clamp(
    metrics.continuationDistance / continuationSpeed * 1000,
    160,
    540
  );
  return Math.round(primaryMs + continuationMs);
}

function applyPathMetrics(shot) {
  const metrics = normalisePathByDistance(shot.path, shot.impactIndex);
  shot.path = metrics.path;
  shot.impactIndex = metrics.impactIndex;
  shot.impactProgress = metrics.impactProgress;
  shot.pathDistanceMetres = metrics.totalDistance;
  shot.primaryDistanceMetres = metrics.primaryDistance;
  shot.continuationDistanceMetres = metrics.continuationDistance;
  if (shot.collision && Number.isInteger(metrics.impactIndex)) {
    shot.collision.index = metrics.impactIndex;
  }
  if (shot.keeperPlan) {
    shot.keeperPlan.flightSeconds = metrics.primaryDistance / Math.max(15, shot.speedMps || 15);
  }
  return metrics;
}

function convertBorderlineGoalToParry(shot, boostedThreshold) {
  const plan = shot.keeperPlan;
  if (!plan || !Array.isArray(shot.path) || shot.path.length < 12) return false;

  const impactBaseIndex = Math.max(4, Math.floor(shot.path.length * 0.93));
  const pre = shot.path.slice(0, impactBaseIndex);
  const start = pre[pre.length - 1];
  const target = plan.target || shot.path[shot.path.length - 1];
  const contact = { x: target.x, y: target.y, z: 0.28 };
  const contactCount = 14;
  const contactSegment = Array.from({ length: contactCount }, (_, index) => {
    const t = (index + 1) / contactCount;
    return {
      x: lerp(start.x, contact.x, t),
      y: lerp(start.y, contact.y, t),
      z: lerp(start.z, contact.z, t),
      t: 1
    };
  });

  const impactPoint = contactSegment[contactSegment.length - 1];
  const impactIndex = pre.length + contactSegment.length - 1;
  const directionX = Math.sign(plan.diveDirection || impactPoint.x || 1);
  const reboundEnd = {
    x: impactPoint.x + directionX * 1.75,
    y: 0.08,
    z: 2.35
  };
  const reboundCount = 36;
  const rebound = Array.from({ length: reboundCount }, (_, index) => {
    const t = (index + 1) / reboundCount;
    return {
      x: lerp(impactPoint.x, reboundEnd.x, t),
      y: Math.max(0.08, lerp(impactPoint.y, reboundEnd.y, t) + 0.24 * Math.sin(Math.PI * t)),
      z: lerp(impactPoint.z, reboundEnd.z, t),
      t: 1
    };
  });

  shot.path = [...pre, ...contactSegment, ...rebound];
  shot.impactIndex = impactIndex;
  shot.outcome = "SAVE";
  shot.saveType = "PARRY";
  plan.saved = true;
  plan.saveType = "PARRY";
  plan.threshold = boostedThreshold;
  plan.contact = contact;
  return true;
}

export function resolveShotPhysics() {
  const shot = state.shot;
  const metrics = doubleFaultMetrics(shot);
  const originalCurve = clamp(Number(shot?.curve) || 0, -1, 1);
  const curveReduction = metrics.severity * (metrics.underhit ? 0.36 : 0.24);
  const curveRetention = 1 - curveReduction;

  if (metrics.severity > 0) shot.curve = originalCurve * curveRetention;
  let baseResult;
  try {
    baseResult = resolveBaseShotPhysics();
  } finally {
    shot.curve = originalCurve;
  }

  const originalSpeed = Math.max(0, Number(shot.speedMps) || 0);
  const speedPenalty = metrics.severity * (metrics.underhit ? 0.16 : 0.08);
  shot.speedMps = originalSpeed * (1 - speedPenalty);

  const slowFactor = smoothStep(clamp((24 - shot.speedMps) / 9, 0, 1));
  const keeperBoost = metrics.underhit ? metrics.severity * slowFactor * 0.16 : 0;
  let doubleFaultSave = false;

  if (
    shot.outcome === "GOAL"
    && keeperBoost > 0.018
    && shot.keeperPlan
    && Number.isFinite(shot.keeperPlan.reachScore)
    && Number.isFinite(shot.keeperPlan.threshold)
  ) {
    const boostedThreshold = clamp(shot.keeperPlan.threshold + keeperBoost, 0.72, 1.18);
    if (shot.keeperPlan.reachScore <= boostedThreshold) {
      doubleFaultSave = convertBorderlineGoalToParry(shot, boostedThreshold);
    }
  }

  const pathMetrics = applyPathMetrics(shot);
  const flightDuration = durationFromDistance(shot, pathMetrics);

  if (shot.diagnostics) {
    Object.assign(shot.diagnostics, {
      curvePercent: Math.round(originalCurve * 100),
      speedMps: Number(shot.speedMps.toFixed(2)),
      doubleFaultSeverity: Number(metrics.severity.toFixed(3)),
      doubleFaultPowerDeviation: Number(metrics.powerDeviation.toFixed(3)),
      doubleFaultCurveRetention: Number(curveRetention.toFixed(3)),
      doubleFaultSpeedPenalty: Number(speedPenalty.toFixed(3)),
      doubleFaultKeeperBoost: Number(keeperBoost.toFixed(3)),
      doubleFaultSave,
      outcome: shot.outcome,
      pathDistanceMetres: Number(pathMetrics.totalDistance.toFixed(3)),
      primaryDistanceMetres: Number(pathMetrics.primaryDistance.toFixed(3)),
      continuationDistanceMetres: Number(pathMetrics.continuationDistance.toFixed(3)),
      impactProgress: pathMetrics.impactProgress == null
        ? null
        : Number(pathMetrics.impactProgress.toFixed(4)),
      distanceTimedFlightMs: flightDuration
    });
    if (doubleFaultSave) {
      shot.diagnostics.reason = "Slow double-fault gave the goalkeeper time to recover and parry.";
    } else if (metrics.severity >= 0.55 && shot.outcome === "GOAL") {
      shot.diagnostics.reason = "Severe mishit still found placement beyond the goalkeeper's recovery range.";
    }
  }

  window.__footballLabLastDoubleFaultV333 = {
    severity: metrics.severity,
    curveRetention,
    speedPenalty,
    keeperBoost,
    convertedToSave: doubleFaultSave,
    outcome: shot.outcome
  };

  return { ...baseResult, flightDuration, diagnostics: shot.diagnostics };
}

export function sampleShotPath(path, progress) {
  return sampleBaseShotPath(path, progress);
}

export function previewShotPhysics(inputs = {}) {
  return previewBaseShotPhysics(inputs);
}

export { normalisePathByDistance };

window.__footballLabPhysicsConsistencyV19 = {
  worldDistanceResampling: true,
  distanceTimedFlight: true,
  collisionIndexRemapping: true,
  keeperTimingAlignment: true,
  doubleFaultProtection: true,
  build: BUILD
};
