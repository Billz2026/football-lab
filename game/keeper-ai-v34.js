import { clamp, state } from "./core-v6.js?v=32.4";
import { GOAL, keeperWorld } from "./world-v7.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";
import { normalisePathByDistance } from "./runtime-v23-bridge-physics-v19-f1d39f9409.js?v=32.4";

const BUILD = "34.1.0";

function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function primaryEndIndex(shot) {
  if (!Array.isArray(shot?.path) || shot.path.length < 2) return 0;
  if (Number.isInteger(shot.impactIndex)) return Math.max(1, Math.min(shot.impactIndex, shot.path.length - 1));
  return shot.path.length - 1;
}

function earlyLaneTarget(shot, endIndex) {
  const path = shot.path;
  const start = path[0];
  const sampleIndex = Math.max(2, Math.min(endIndex - 1, Math.round(endIndex * 0.2)));
  const early = path[sampleIndex];
  const dz = early.z - start.z;
  if (!Number.isFinite(dz) || Math.abs(dz) < 0.001) return shot.keeperPlan?.target?.x ?? 0;
  const slopeX = (early.x - start.x) / dz;
  return early.x + slopeX * (0 - early.z);
}

function keeperReadProfile(keeper) {
  return {
    reading: clamp((keeper.stats?.reading ?? 70) / 100, 0.5, 1),
    reflexes: clamp((keeper.stats?.reflexes ?? 70) / 100, 0.5, 1),
    aggression: clamp((keeper.stats?.aggression ?? 65) / 100, 0.45, 1),
    curveRead: clamp(Number(keeper.modifiers?.curveReadMultiplier) || 1, 0.35, 1.2)
  };
}

function buildReadModel(shot) {
  const plan = shot.keeperPlan;
  if (!plan || !Array.isArray(shot.path) || shot.path.length < 8) return null;
  const keeper = keeperForStage(state.stage);
  const profile = keeperReadProfile(keeper);
  const endIndex = primaryEndIndex(shot);
  const finalX = plan.target?.x ?? shot.path[endIndex]?.x ?? 0;
  const predictedX = earlyLaneTarget(shot, endIndex);
  const base = keeperWorld(state.currentStage);
  const error = finalX - predictedX;
  const errorMagnitude = Math.abs(error);
  const launchDirection = Math.sign(predictedX - base.x || 1);
  const finalDirection = Math.sign(finalX - base.x || 1);
  const wrongFooted = launchDirection !== finalDirection && errorMagnitude > 0.34;

  const commitStrength = clamp(
    0.07 + profile.aggression * 0.12 + profile.reading * 0.045,
    0.12,
    0.235
  );
  const correctionSkill = clamp(profile.reading * 0.58 + profile.reflexes * 0.34, 0.5, 0.95);
  const curveSensitivity = 0.52 + profile.curveRead * 0.48;
  const effectiveMisread = errorMagnitude * curveSensitivity * (1 - correctionSkill * 0.42);
  const misreadNorm = clamp((effectiveMisread - 0.08) / 1.15, 0, 1);
  const readPenalty = misreadNorm
    * (0.055 + profile.aggression * 0.045)
    * (wrongFooted ? 1.28 : 1);
  const straightReadBonus = clamp((0.16 - errorMagnitude) / 0.16, 0, 1)
    * (0.004 + profile.reading * 0.012);
  const correctionDelay = clamp(
    effectiveMisread * (0.055 + profile.aggression * 0.04) * (1 - profile.reflexes * 0.34),
    0,
    0.095
  );
  const maxCommit = 0.46 + profile.aggression * 0.12;
  const readCommitX = clamp((predictedX - base.x) * commitStrength, -maxCommit, maxCommit);

  return {
    keeper,
    profile,
    base,
    predictedX,
    finalX,
    error,
    errorMagnitude,
    effectiveMisread,
    launchDirection,
    finalDirection,
    wrongFooted,
    readPenalty,
    straightReadBonus,
    correctionDelay,
    readCommitX
  };
}

function restoreGoalPathFromSave(shot) {
  const plan = shot.keeperPlan;
  if (!plan || !Array.isArray(shot.path) || shot.path.length < 8) return false;
  const target = plan.target;
  const impactProgress = Number.isFinite(shot.impactProgress)
    ? shot.impactProgress
    : Number.isInteger(shot.impactIndex)
      ? shot.impactIndex / Math.max(1, shot.path.length - 1)
      : 0.93;
  const cutProgress = clamp(impactProgress - 0.075, 0.68, 0.9);
  const cutIndex = Math.max(3, Math.min(shot.path.length - 2, Math.floor((shot.path.length - 1) * cutProgress)));
  const pre = shot.path.slice(0, cutIndex + 1);
  const start = pre[pre.length - 1];
  const continuation = Array.from({ length: 22 }, (_, index) => {
    const t = (index + 1) / 22;
    return {
      x: start.x + (target.x - start.x) * t,
      y: start.y + (target.y - start.y) * t,
      z: start.z + (target.z - start.z) * t,
      t: 1
    };
  });

  shot.path = [...pre, ...continuation];
  shot.outcome = "GOAL";
  shot.saveType = null;
  shot.impactIndex = null;
  shot.impactProgress = null;
  shot.collision = null;
  shot.topCorner = Boolean(
    shot.diagnostics?.premiumFinishEligible
    && target.y > GOAL.height * 0.71
    && Math.abs(target.x) > GOAL.halfWidth * 0.55
  );
  plan.saved = false;
  plan.saveType = null;
  return true;
}

function convertGoalToParry(shot, threshold) {
  const plan = shot.keeperPlan;
  if (!plan || !Array.isArray(shot.path) || shot.path.length < 12) return false;
  const impactBaseIndex = Math.max(4, Math.floor(shot.path.length * 0.93));
  const pre = shot.path.slice(0, impactBaseIndex);
  const start = pre[pre.length - 1];
  const target = plan.target || shot.path[shot.path.length - 1];
  const contact = { x: target.x, y: target.y, z: 0.28 };
  const contactSegment = Array.from({ length: 14 }, (_, index) => {
    const t = (index + 1) / 14;
    return {
      x: start.x + (contact.x - start.x) * t,
      y: start.y + (contact.y - start.y) * t,
      z: start.z + (contact.z - start.z) * t,
      t: 1
    };
  });
  const impactPoint = contactSegment[contactSegment.length - 1];
  const impactIndex = pre.length + contactSegment.length - 1;
  const directionX = Math.sign(plan.diveDirection || impactPoint.x || 1);
  const reboundEnd = { x: impactPoint.x + directionX * 1.7, y: 0.08, z: 2.35 };
  const rebound = Array.from({ length: 36 }, (_, index) => {
    const t = (index + 1) / 36;
    return {
      x: impactPoint.x + (reboundEnd.x - impactPoint.x) * t,
      y: Math.max(0.08, impactPoint.y + (reboundEnd.y - impactPoint.y) * t + 0.24 * Math.sin(Math.PI * t)),
      z: impactPoint.z + (reboundEnd.z - impactPoint.z) * t,
      t: 1
    };
  });

  shot.path = [...pre, ...contactSegment, ...rebound];
  shot.impactIndex = impactIndex;
  shot.outcome = "SAVE";
  shot.saveType = "PARRY";
  shot.topCorner = false;
  plan.saved = true;
  plan.saveType = "PARRY";
  plan.threshold = threshold;
  plan.contact = contact;
  return true;
}

function updatePathMetrics(shot) {
  const metrics = normalisePathByDistance(shot.path, shot.impactIndex);
  shot.path = metrics.path;
  shot.impactIndex = metrics.impactIndex;
  shot.impactProgress = metrics.impactProgress;
  shot.pathDistanceMetres = metrics.totalDistance;
  shot.primaryDistanceMetres = metrics.primaryDistance;
  shot.continuationDistanceMetres = metrics.continuationDistance;
  if (shot.collision && Number.isInteger(metrics.impactIndex)) shot.collision.index = metrics.impactIndex;
  if (shot.keeperPlan) shot.keeperPlan.flightSeconds = metrics.primaryDistance / Math.max(15, shot.speedMps || 15);
  return metrics;
}

function flightDurationFor(shot, metrics) {
  const speed = Math.max(15, Number(shot.speedMps) || 15);
  const primaryMs = clamp(metrics.primaryDistance / speed * 1180, 820, 1680);
  if (metrics.continuationDistance <= 0.01) return Math.round(primaryMs + 100);
  const continuationSpeed = Math.max(8, speed * 0.42);
  const continuationMs = clamp(metrics.continuationDistance / continuationSpeed * 1000, 160, 540);
  return Math.round(primaryMs + continuationMs);
}

function syncAnimationDuration(shot, metrics) {
  if (!state.animation) return;
  const flightDuration = flightDurationFor(shot, metrics);
  state.animation.flightDuration = flightDuration;
  state.animation.totalDuration =
    (state.animation.runUpDuration || 0)
    + (state.animation.contactHoldDuration || 0)
    + flightDuration
    + (state.animation.settleDuration || 0);
}

function applyKeeperReading() {
  const shot = state.shot;
  if (!shot || shot.keeperReadVersion === BUILD || !["GOAL", "SAVE"].includes(shot.outcome) || !shot.keeperPlan) return;
  const model = buildReadModel(shot);
  if (!model) return;
  const plan = shot.keeperPlan;

  plan.start = {
    ...(plan.start || model.base),
    x: model.base.x + model.readCommitX
  };
  plan.reaction = clamp((Number(plan.reaction) || 0.2) + model.correctionDelay, 0.085, 0.46);
  plan.readPredictedX = model.predictedX;
  plan.readFinalX = model.finalX;
  plan.readErrorMetres = model.errorMagnitude;
  plan.effectiveMisreadMetres = model.effectiveMisread;
  plan.wrongFooted = model.wrongFooted;
  plan.readCommitX = model.readCommitX;
  plan.correctionDelay = model.correctionDelay;

  const baselineThreshold = Number(plan.threshold) || 0;
  const adjustedThreshold = clamp(
    baselineThreshold - model.readPenalty + model.straightReadBonus,
    0.68,
    1.18
  );
  let outcomeChange = null;

  if (shot.outcome === "SAVE" && Number.isFinite(plan.reachScore) && plan.reachScore > adjustedThreshold) {
    if (restoreGoalPathFromSave(shot)) outcomeChange = "MISREAD_GOAL";
  } else if (
    shot.outcome === "GOAL"
    && model.straightReadBonus > 0.008
    && Number.isFinite(plan.reachScore)
    && plan.reachScore <= adjustedThreshold
  ) {
    if (convertGoalToParry(shot, adjustedThreshold)) outcomeChange = "READ_SAVE";
  }
  plan.threshold = adjustedThreshold;
  shot.keeperReadVersion = BUILD;

  const metrics = updatePathMetrics(shot);
  syncAnimationDuration(shot, metrics);

  if (shot.diagnostics) {
    Object.assign(shot.diagnostics, {
      keeperReadModel: "early-lane-commit-correct",
      keeperReadPredictedX: Number(model.predictedX.toFixed(3)),
      keeperReadFinalX: Number(model.finalX.toFixed(3)),
      keeperReadErrorMetres: Number(model.errorMagnitude.toFixed(3)),
      keeperEffectiveMisreadMetres: Number(model.effectiveMisread.toFixed(3)),
      keeperWrongFooted: model.wrongFooted,
      keeperReadCommitMetres: Number(model.readCommitX.toFixed(3)),
      keeperCorrectionDelaySeconds: Number(model.correctionDelay.toFixed(3)),
      keeperReadPenalty: Number(model.readPenalty.toFixed(3)),
      keeperStraightReadBonus: Number(model.straightReadBonus.toFixed(3)),
      keeperThreshold: Number((plan.threshold || 0).toFixed(3)),
      keeperReadOutcomeChange: outcomeChange,
      outcome: shot.outcome
    });
    if (outcomeChange === "MISREAD_GOAL") {
      shot.diagnostics.reason = model.wrongFooted
        ? "Goalkeeper committed to the early lane and was wrong-footed by late curl."
        : "Late bend moved beyond the goalkeeper's corrected reach.";
    } else if (outcomeChange === "READ_SAVE") {
      shot.diagnostics.reason = "Goalkeeper read the straight launch early and recovered enough to parry.";
    }
  }

  window.__footballLabKeeperReadingV341 = {
    build: BUILD,
    keeper: model.keeper.id,
    predictedX: model.predictedX,
    finalX: model.finalX,
    errorMetres: model.errorMagnitude,
    wrongFooted: model.wrongFooted,
    correctionDelay: model.correctionDelay,
    outcomeChange,
    outcome: shot.outcome
  };
}

window.addEventListener("footballlab:phasechange", (event) => {
  if (event.detail?.phase !== "shooting") return;
  queueMicrotask(applyKeeperReading);
});

window.__footballLabKeeperAIV34 = Object.freeze({
  build: BUILD,
  model: "early-lane-commit-correct",
  archetypeAware: true,
  preservesCoreStrikeBalance: true,
  wrongFootedCurl: true
});