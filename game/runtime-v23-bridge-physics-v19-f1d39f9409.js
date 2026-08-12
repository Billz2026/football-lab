import { clamp, createShot, lerp, state } from "./core-v6.js?v=32.4";
import {
  resolveShotPhysics as resolveBaseShotPhysics,
  sampleShotPath as sampleBaseShotPath
} from "./runtime-v23-generated-physics-v15-9cf6fe15a3.js?v=32.4";

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

function resampleSection(path, sampleCount) {
  const count = Math.max(2, Math.round(sampleCount));
  const cumulative = cumulativeDistances(path);
  const totalDistance = cumulative[cumulative.length - 1];
  if (totalDistance <= EPSILON) {
    return Array.from({ length: count }, (_, index) => ({
      ...(index === count - 1 ? path[path.length - 1] : path[0])
    }));
  }

  const result = [];
  let upperIndex = 1;
  for (let index = 0; index < count; index += 1) {
    if (index === 0) {
      result.push({ ...path[0] });
      continue;
    }
    if (index === count - 1) {
      result.push({ ...path[path.length - 1] });
      continue;
    }

    const targetDistance = totalDistance * (index / (count - 1));
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
  return result;
}

function mergeSpacingStats(primaryPath, continuationPath) {
  const primary = spacingStats(primaryPath);
  const continuation = continuationPath.length > 1
    ? spacingStats(continuationPath)
    : { mean: 0, maximumDeviationRatio: 0 };
  const primaryIntervals = Math.max(0, primaryPath.length - 1);
  const continuationIntervals = Math.max(0, continuationPath.length - 1);
  const intervalCount = primaryIntervals + continuationIntervals;
  const mean = intervalCount > 0
    ? (
      primary.mean * primaryIntervals
      + continuation.mean * continuationIntervals
    ) / intervalCount
    : 0;

  return {
    mean,
    maximumDeviationRatio: Math.max(
      primary.maximumDeviationRatio,
      continuation.maximumDeviationRatio
    ),
    primary,
    continuation
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
      spacing: mergeSpacingStats(Array.isArray(path) ? path : [], [])
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
      spacing: mergeSpacingStats(path, [])
    };
  }

  const originalImpactIndex = Number.isInteger(impactIndex)
    ? Math.round(clamp(impactIndex, 0, path.length - 1))
    : null;
  const primaryDistance = originalImpactIndex == null
    ? totalDistance
    : cumulative[originalImpactIndex];
  const continuationDistance = Math.max(0, totalDistance - primaryDistance);
  const impactProgress = originalImpactIndex == null
    ? null
    : clamp(primaryDistance / totalDistance, 0, 1);
  const sampleCount = Math.min(
    MAX_PATH_SAMPLES,
    Math.max(MIN_PATH_SAMPLES, path.length)
  );

  const hasImpactBoundary = originalImpactIndex != null
    && originalImpactIndex > 0
    && originalImpactIndex < path.length - 1
    && primaryDistance > EPSILON
    && continuationDistance > EPSILON;

  let result;
  let remappedImpactIndex;
  let primaryResult;
  let continuationResult;

  if (hasImpactBoundary) {
    const totalIntervals = sampleCount - 1;
    const primaryIntervals = Math.round(clamp(
      totalIntervals * impactProgress,
      1,
      totalIntervals - 1
    ));
    const continuationIntervals = totalIntervals - primaryIntervals;
    primaryResult = resampleSection(
      path.slice(0, originalImpactIndex + 1),
      primaryIntervals + 1
    );
    continuationResult = resampleSection(
      path.slice(originalImpactIndex),
      continuationIntervals + 1
    );
    result = primaryResult.concat(continuationResult.slice(1));
    remappedImpactIndex = primaryResult.length - 1;
  } else {
    result = resampleSection(path, sampleCount);
    remappedImpactIndex = impactProgress == null
      ? null
      : Math.round(impactProgress * (result.length - 1));
    primaryResult = remappedImpactIndex == null
      ? result
      : result.slice(0, remappedImpactIndex + 1);
    continuationResult = remappedImpactIndex == null
      ? []
      : result.slice(remappedImpactIndex);
  }

  return {
    path: result,
    impactIndex: remappedImpactIndex,
    impactProgress,
    totalDistance,
    primaryDistance,
    continuationDistance,
    spacing: mergeSpacingStats(primaryResult, continuationResult)
  };
}

function durationFromDistance(shot, pathMetrics) {
  const speed = Math.max(15, Number(shot.speedMps) || 15);
  const primaryMs = clamp(pathMetrics.primaryDistance / speed * 1180, 820, 1680);
  if (pathMetrics.continuationDistance <= 0.01) return Math.round(primaryMs + 100);

  const continuationSpeed = Math.max(8, speed * 0.42);
  const continuationMs = clamp(
    pathMetrics.continuationDistance / continuationSpeed * 1000,
    160,
    540
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
      primarySpacingDeviationRatio: Number(
        pathMetrics.spacing.primary.maximumDeviationRatio.toFixed(4)
      ),
      continuationSpacingDeviationRatio: Number(
        pathMetrics.spacing.continuation.maximumDeviationRatio.toFixed(4)
      ),
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

export function previewShotPhysics(inputs = {}) {
  const originalShot = state.shot;
  const originalKeeperId = state.keeperId;
  const originalWallId = state.wallId;
  const previewShot = {
    ...createShot(),
    power: Number(inputs.power),
    aimX: Number(inputs.aimX),
    aimY: Number(inputs.aimY),
    previewAimX: Number(inputs.aimX),
    previewAimY: Number(inputs.aimY),
    curve: clamp(Number(inputs.curve) || 0, -1, 1)
  };

  state.shot = previewShot;
  try {
    const result = resolveBaseShotPhysics();
    return {
      outcome: previewShot.outcome,
      path: previewShot.path.map((point) => ({ ...point })),
      collision: previewShot.collision
        ? { ...previewShot.collision, point: { ...previewShot.collision.point } }
        : null,
      impactIndex: Number.isInteger(previewShot.impactIndex) ? previewShot.impactIndex : null,
      diagnostics: previewShot.diagnostics
        ? structuredClone(previewShot.diagnostics)
        : null,
      target: result.target ? { ...result.target } : null
    };
  } finally {
    state.shot = originalShot;
    state.keeperId = originalKeeperId;
    state.wallId = originalWallId;
  }
}

window.__footballLabPhysicsConsistencyV19 = {
  worldDistanceResampling: true,
  distanceTimedFlight: true,
  collisionIndexRemapping: true,
  keeperTimingAlignment: true,
  minimumSamples: MIN_PATH_SAMPLES,
  maximumSamples: MAX_PATH_SAMPLES
};
