import { clamp, state } from "./core-v6.js?v=32.4";
import { keeperWorld } from "./world-v7.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";
import {
  normalisePathByDistance,
  previewShotPhysics as previewBaseShotPhysics,
  resolveShotPhysics as resolveBaseShotPhysics,
  sampleShotPath as sampleBaseShotPath
} from "./runtime-v23-bridge-physics-v19-base-v333.js?v=34.1";

const BUILD = "34.1.0";

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

function archetypeReadProfile(keeper) {
  const reading = clamp((keeper.stats?.reading ?? 70) / 100, 0.5, 1);
  const reflexes = clamp((keeper.stats?.reflexes ?? 70) / 100, 0.5, 1);
  const aggression = clamp((keeper.stats?.aggression ?? 65) / 100, 0.45, 1);
  const curveRead = clamp(Number(keeper.modifiers?.curveReadMultiplier) || 1, 0.35, 1.2);
  return { reading, reflexes, aggression, curveRead };
}

function buildReadModel(shot) {
  const plan = shot.keeperPlan;
  if (!plan || !Array.isArray(shot.path) || shot.path.length < 8) return null;
  const keeper = keeperForStage(state.stage);
  const profile = archetypeReadProfile(keeper);
  const endIndex = primaryEndIndex(shot);
  const finalX = plan.target?.x ?? shot.path[endIndex]?.x ?? 0;
  const predictedX = earlyLaneTarget(shot, endIndex);
  const base = keeperWorld(state.currentStage);
  const rawError = finalX - predictedX;
  const errorMagnitude = Math.abs(rawError);
  const launchDirection = Math.sign(predictedX - base.x || 1);
  const finalDirection = Math.sign(finalX - base.x || 1);
  const wrongFooted = launchDirection !== finalDirection && errorMagnitude > 0.34;

  // Aggressive keepers commit more strongly to the first read. Readers and reflex
  // keepers recover more effectively once late curl reveals the true destination.
  const commitStrength = clamp(
    0.07 + profile.aggression * 0.12 + profile.reading * 0.045,
    0.12,
    0.235
  );
  const correctionSkill = clamp(profile.reading * 0.58 + profile.reflexes * 0.34, 0.5, 0.95);
  const curveSensitivity = 0.52 + profile.curveRead * 0.48;
  const effectiveMisread = errorMagnitude * curveSensitivity * (1 - correctionSkill * 0.42);
  const misreadNorm = clamp((effectiveMisread - 0.08) / 1.15, 0, 1);
  const readPenalty = misreadNorm * (0.055 + profile.aggression * 0.045) * (wrongFooted ? 1.28 : 1);
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
    predictedX,
    finalX,
    rawError,
    errorMagnitude,
    effectiveMisread,
    wrongFooted,
    launchDirection,
    finalDirection,
    readPenalty,
    straightReadBonus,
    correctionDelay,
    readCommitX,
    profile
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
    && target.y > 2.44 * 0.71
    && Math.abs(target.x) > 3.66 * 0.55
  );
  plan.saved = false;
  plan.saveType = null;
  return true;
}

function convertBorderlineGoalToParry(shot, boostedThreshold) {
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
  plan.threshold = boostedThreshold;
  plan.contact = contact;
  return true;
}

function applyKeeperReadOutcome(shot, model) {
  const plan = shot.keeperPlan;
  if (!plan || !model) return { changed: false, type: null };
  const baselineThreshold = Number(plan.threshold) || 0;
  const adjustedThreshold = clamp(
    baselineThreshold - model.readPenalty + model.straightReadBonus,
    0.68,
    1.18
  );
  let changed = false;
  let type = null;

  if (shot.outcome === "SAVE" && Number.isFinite(plan.reachScore) && plan.reachScore > adjustedThreshold) {
    changed = restoreGoalPathFromSave(shot);
    type = changed ? "MISREAD_GOAL" : null;
  } else if (
    shot.outcome === "GOAL"
    && model.straightReadBonus > 0.008
    && Number.isFinite(plan.reachScore)
    && plan.reachScore <= adjustedThreshold
  ) {
    changed = convertBorderlineGoalToParry(shot, adjustedThreshold);
    type = changed ? "READ_SAVE" : null;
  }

  plan.threshold = adjustedThreshold;
  return { changed, type, adjustedThreshold };
}

export function resolveShotPhysics() {
  const result = resolveBaseShotPhysics();
  const shot = state.shot;
  const plan = shot?.keeperPlan;
  if (!plan || !["GOAL", "SAVE"].includes(shot.outcome)) return result;

  const model = buildReadModel(shot);
  if (!model) return result;

  const base = keeperWorld(state.currentStage);
  plan.start = {
    ...(plan.start || base),
    x: base.x + model.readCommitX
  };
  plan.reaction = clamp((Number(plan.reaction) || 0.2) + model.correctionDelay, 0.085, 0.46);
  plan.readPredictedX = model.predictedX;
  plan.readFinalX = model.finalX;
  plan.readErrorMetres = model.errorMagnitude;
  plan.effectiveMisreadMetres = model.effectiveMisread;
  plan.wrongFooted = model.wrongFooted;
  plan.readCommitX = model.readCommitX;
  plan.correctionDelay = model.correctionDelay;

  const outcomeChange = applyKeeperReadOutcome(shot, model);
  const pathMetrics = normalisePathByDistance(shot.path, shot.impactIndex);
  shot.path = pathMetrics.path;
  shot.impactIndex = pathMetrics.impactIndex;
  shot.impactProgress = pathMetrics.impactProgress;

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
      keeperReadOutcomeChange: outcomeChange.type,
      outcome: shot.outcome
    });
    if (outcomeChange.type === "MISREAD_GOAL") {
      shot.diagnostics.reason = model.wrongFooted
        ? "Goalkeeper committed to the early lane and was wrong-footed by late curl."
        : "Late bend moved beyond the goalkeeper's corrected reach."
    } else if (outcomeChange.type === "READ_SAVE") {
      shot.diagnostics.reason = "Goalkeeper read the straight launch early and recovered enough to parry."
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
    outcomeChange: outcomeChange.type,
    outcome: shot.outcome
  };

  return { ...result, diagnostics: shot.diagnostics };
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
  keeperReadingAI: true,
  build: BUILD
};