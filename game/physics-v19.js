import { clamp, lerp, state } from "./core-v6.js?v=7";
import {
  resolveShotPhysics as resolveBaseShotPhysics,
  sampleShotPath as sampleBaseShotPath
} from "./physics-v15.js?v=15";

const EPSILON = 1e-7;
const MIN_PATH_SAMPLES = 96;
const MAX_PATH_SAMPLES = 420;

function pointDistance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}

function isFinitePoint(point) {
  return point
    && Number.isFinite(point.x)
    && Number.isFinite(point.y)
    && Number.isFinite(point.z);
}

function cumulativeDistances(path) {
  const cumulative = [0];
  for (let index = 1; index < path.length; index += 1) {
    cumulative.push(cumulative[index - 1] + pointDistance(path[index - 1], path[index]));
  }
  return cumulative;
}

function interpolatePoint(a, b, amount) {
  const point = {
    x: lerp(a.x, b.x, amount),
    y: lerp(a.y, b.y, amount),
    z: lerp(a.z, b.z, amount)
  };
  if (Number.isFinite(a.t) || Number.isFinite(b.t)) {
    point.t = lerp(Number.isFinite(a.t) ? a.t : 0, Number.isFinite(b.t) ? b.t : 1, amount);
  }
  return point;
}

function spacingStats(path) {
  if (path.length < 2) return { mean: 0, maximumDeviationRatio: 0 };
  const lengths = [];
  for (let index = 1; index < path.length; index += 1) {
    lengths.push(pointDistance(path[index - 1], path[index]));
  }
  const mean = lengths.reduce((sum, value) => sum + value, 0) / lengths.length;
  const maximumDeviation = lengths.reduce(
    (maximum, value) => Math.max(maximum, Math.abs(value - mean)),
    0
  );
  return {
    mean,
    maximumDeviationRatio: mean > EPSILON ? maximumDeviation / mean : 0
  };
}

export function normalisePathByDistance(path, impactIndex = null) {
  if (!Array.isArray(path) || path.length < 2) {
    return {
      path: Array.isArray(path) ? path : [],
      impactIndex: Number.isInteger(impactIndex) ? 0 : null,
      impactProgress: Number.isInteger(impactIndex) ? 0 : null,
      totalDistance: 0,
      primaryDistance: 0,
      continuationDistance: 0,
      spacing: { mean: 0, maximumDeviationRatio: 0 }
    };
  }
  if (!path.every(isFinitePoint)) {
    throw new Error("V19 physics received a non-finite trajectory point");
  }

  const cumulative = cumulativeDistances(path);
  const totalDistance = cumulative[cumulative.length - 1];
  if (totalDistance <= EPSILON) {
    return {
      path: path.map((point) => ({ ...point })),
      impactIndex: Number.isInteger(impactIndex) ? 0 : null,
      impactProgress: Number.isInteger(impactIndex) ? 0 : null,
      totalDistance,
      primaryDistance: totalDistance,
      continuationDistance: 0,
      spacing: spacingStats(path)
    };
  }

  const originalImpactIndex = Number.isInteger(impactIndex)
    ? Math.round(clamp(impactIndex, 0, path.length - 1))
    : null;
  const primaryDistance = originalImpactIndex == null
    ? totalDistance
    : cumulative[originalImpactIndex];
  const impactProgress = originalImpactIndex == null
    ? null
    : clamp(primaryDistance / totalDistance, 0, 1);
  const sampleCount = Math.min(
    MAX_PATH_SAMPLES,
    Math.max(MIN_PATH_SAMPLES, path.length)
  );
  const result = [];
  let upperIndex = 1;

  for (let index = 0; index < sampleCount; index += 1) {
    const targetDistance = totalDistance * (index / (sampleCount - 1));
    while (
      upperIndex < cumulative.length - 1
      && cumulative[upperIndex] < targetDistance
    ) {
      upperIndex += 1;
    }
    const lowerIndex = Math.max(0, upperIndex - 1);
    const segmentDistance = cumulative[upperIndex] - cumulative[lowerIndex];
    const amount = segmentDistance > EPSILON
      ? clamp((targetDistance - cumulative[lowerIndex]) / segmentDistance, 0, 1)
      : 0;
    result.push(interpolatePoint(path[lowerIndex], path[upperIndex], amount));
  }

  const remappedImpactIndex = impactProgress == null
    ? null
    : Math.round(impactProgress * (result.length - 1));

  return {
    path: result,
    impactIndex: remappedImpactIndex,
    impactProgress,
    totalDistance,
    primaryDistance,
    continuationDistance: Math.max(0, totalDistance - primaryDistance),
    spacing: spacingStats(result)
  };
}

function durationFromDistance(shot, pathMetrics) {
  const speed = Math.max(15, Number(shot.speedMps) || 15);
  const primaryMs = clamp(pathMetrics.primaryDistance / speed * 1000, 650, 1380);
  if (pathMetrics.continuationDistance <= 0.01) return Math.round(primaryMs + 100);

  const continuationSpeed = Math.max(8, speed * 0.42);
  const continuationMs = clamp(
    pathMetrics.continuationDistance / continuationSpeed * 1000,
    120,
    460
  );
  return Math.round(primaryMs + continuationMs);
}

export function resolveShotPhysics() {
  const baseResult = resolveBaseShotPhysics();
  const shot = state.shot;
  const pathMetrics = normalisePathByDistance(shot.path, shot.impactIndex);

  shot.path = pathMetrics.path;
  shot.impactIndex = pathMetrics.impactIndex;
  shot.impactProgress = pathMetrics.impactProgress;
  shot.pathDistanceMetres = pathMetrics.totalDistance;
  shot.primaryDistanceMetres = pathMetrics.primaryDistance;
  shot.continuationDistanceMetres = pathMetrics.continuationDistance;
  if (shot.collision && Number.isInteger(pathMetrics.impactIndex)) {
    shot.collision.index = pathMetrics.impactIndex;
  }

  const flightSeconds = pathMetrics.primaryDistance / Math.max(15, shot.speedMps || 15);
  if (shot.keeperPlan) shot.keeperPlan.flightSeconds = flightSeconds;

  const flightDuration = durationFromDistance(shot, pathMetrics);
  if (shot.diagnostics) {
    Object.assign(shot.diagnostics, {
      pathDistanceMetres: Number(pathMetrics.totalDistance.toFixed(3)),
      primaryDistanceMetres: Number(pathMetrics.primaryDistance.toFixed(3)),
      continuationDistanceMetres: Number(pathMetrics.continuationDistance.toFixed(3)),
      impactProgress: pathMetrics.impactProgress == null
        ? null
        : Number(pathMetrics.impactProgress.toFixed(4)),
      pathSpacingMetres: Number(pathMetrics.spacing.mean.toFixed(4)),
      pathSpacingDeviationRatio: Number(pathMetrics.spacing.maximumDeviationRatio.toFixed(4)),
      distanceTimedFlightMs: flightDuration
    });
  }

  window.__footballLabLastPhysicsV19 = {
    outcome: shot.outcome,
    samples: shot.path.length,
    distanceMetres: pathMetrics.totalDistance,
    impactProgress: pathMetrics.impactProgress,
    spacingDeviationRatio: pathMetrics.spacing.maximumDeviationRatio,
    flightDuration
  };

  return { ...baseResult, flightDuration, diagnostics: shot.diagnostics };
}

export function sampleShotPath(path, progress) {
  return sampleBaseShotPath(path, progress);
}

window.__footballLabPhysicsConsistencyV19 = {
  worldDistanceResampling: true,
  distanceTimedFlight: true,
  collisionIndexRemapping: true,
  keeperTimingAlignment: true,
  minimumSamples: MIN_PATH_SAMPLES,
  maximumSamples: MAX_PATH_SAMPLES
};
