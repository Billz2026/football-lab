import { clamp, easeOutCubic, elements, lerp, smoothStep, state } from "./core-v6.js?v=32.4";

const BUILD = "33.2.0";

function primaryEndIndex(shot) {
  if (!Array.isArray(shot?.path) || shot.path.length < 2) return 0;
  if (Number.isInteger(shot.impactIndex)) {
    return Math.round(clamp(shot.impactIndex, 1, shot.path.length - 1));
  }
  return shot.path.length - 1;
}

function inferredCurveSign(path, start, end) {
  let strongest = 0;
  let sign = 1;
  const last = Math.max(1, path.length - 1);
  path.forEach((point, index) => {
    const t = index / last;
    const deviation = point.x - lerp(start.x, end.x, t);
    if (Math.abs(deviation) > Math.abs(strongest)) {
      strongest = deviation;
      sign = Math.sign(deviation || 1);
    }
  });
  return sign;
}

function curveEnvelope(t) {
  return 4 * t * (1 - t) * (0.78 + 0.44 * t);
}

function arcEnvelope(t) {
  return 4 * t * (1 - t) * (1.08 - 0.22 * t);
}

function lateDipEnvelope(t) {
  if (t <= 0.52 || t >= 1) return 0;
  const late = smoothStep((t - 0.52) / 0.48);
  return Math.sin(Math.PI * t) * late;
}

function reshapePrimaryFlight(shot) {
  const endIndex = primaryEndIndex(shot);
  if (endIndex < 2) return false;

  const path = shot.path;
  const start = path[0];
  const end = path[endIndex];
  const primary = path.slice(0, endIndex + 1);
  const curve = clamp(Number(shot.curve) || 0, -1, 1);
  const curveMagnitude = Math.abs(curve);
  const distanceYards = Number(state.currentStage?.distanceYards) || 20;

  let peakOriginalCurve = 0;
  let peakLift = 0;
  primary.forEach((point, index) => {
    const t = index / endIndex;
    const lineX = lerp(start.x, end.x, t);
    const lineY = lerp(start.y, end.y, t);
    peakOriginalCurve = Math.max(peakOriginalCurve, Math.abs(point.x - lineX));
    peakLift = Math.max(peakLift, point.y - lineY);
  });

  const curveSign = curveMagnitude > 0.06
    ? Math.sign(curve)
    : inferredCurveSign(primary, start, end);
  const minimumCurvePeak = curveMagnitude * (0.34 + distanceYards * 0.018);
  const desiredCurvePeak = Math.max(peakOriginalCurve * 0.96, minimumCurvePeak);
  const outcomeBlend = shot.outcome === "WALL"
    ? 0.42
    : shot.outcome === "SAVE"
      ? 0.62
      : 0.72;
  const xBlend = curveMagnitude < 0.08 ? 0.18 : outcomeBlend;

  const controlledPeakLift = clamp(peakLift, 0.72, 3.05);
  const pace = clamp((Number(shot.speedMps) || 24) / 36, 0, 1);
  const dipAmount = 0.08 + curveMagnitude * 0.22 + pace * 0.035;
  const yBlend = shot.outcome === "WALL" ? 0.34 : 0.58;

  for (let index = 1; index < endIndex; index += 1) {
    const t = index / endIndex;
    const point = path[index];
    const lineX = lerp(start.x, end.x, t);
    const lineY = lerp(start.y, end.y, t);
    const shapedX = lineX + curveSign * desiredCurvePeak * curveEnvelope(t);
    const shapedY = Math.max(
      0.04,
      lineY
        + controlledPeakLift * arcEnvelope(t)
        - dipAmount * lateDipEnvelope(t)
    );

    point.x = lerp(point.x, shapedX, xBlend);
    point.y = lerp(point.y, shapedY, yBlend);
  }

  shot.flightModel = "progressive-magnus-dip";
  shot.flightModelVersion = BUILD;
  shot.visualCurvePeakMetres = Number(desiredCurvePeak.toFixed(3));
  shot.visualDipMetres = Number(dipAmount.toFixed(3));
  if (shot.diagnostics) {
    shot.diagnostics.flightModel = shot.flightModel;
    shot.diagnostics.visualCurvePeakMetres = shot.visualCurvePeakMetres;
    shot.diagnostics.visualDipMetres = shot.visualDipMetres;
  }
  return true;
}

function enhanceResolvedShot() {
  const shot = state.shot;
  if (!shot || shot.flightModelVersion === BUILD || !Array.isArray(shot.path) || shot.path.length < 3) return;
  reshapePrimaryFlight(shot);
}

function animationFlightProgress(now = performance.now()) {
  const animation = state.animation;
  if (!animation) return 0;
  const run = Math.max(1, Number(animation.runUpDuration) || 1);
  const contact = Math.max(0, Number(animation.contactHoldDuration) || 0);
  const duration = Math.max(1, Number(animation.flightDuration) || 1);
  return clamp((now - animation.startedAt - run - contact) / duration, 0, 1);
}

function updateFlightCamera(now) {
  const canvas = elements.canvas;
  const animation = state.animation;
  if (!canvas || state.screen !== "game" || !animation) {
    if (canvas && canvas.dataset.flightCameraV33 === "active") {
      canvas.style.transform = "none";
      canvas.style.transformOrigin = "50% 50%";
      delete canvas.dataset.flightCameraV33;
    }
    requestAnimationFrame(updateFlightCamera);
    return;
  }

  const progress = animationFlightProgress(now);
  if (progress <= 0.012) {
    canvas.style.transform = "none";
    canvas.style.transformOrigin = "50% 50%";
    requestAnimationFrame(updateFlightCamera);
    return;
  }

  const replay = Boolean(animation.isReplay);
  const focus = easeOutCubic(clamp((progress - 0.012) / 0.988, 0, 1));
  const latePush = smoothStep(clamp((progress - 0.52) / 0.48, 0, 1));
  const targetX = clamp(
    Number.isFinite(state.shot?.actualX) ? state.shot.actualX : Number(state.shot?.aimX) || 0.5,
    -0.2,
    1.2
  );
  const originX = clamp(50 + (targetX - 0.5) * 18, 41.5, 58.5);
  const originY = replay ? 43 : 46;
  // V33.2 adds only a modest extra push in the final half of flight so the
  // ball and keeper read more clearly without turning the shot into a cut-scene.
  const scale = 1
    + focus * (replay ? 0.124 : 0.088)
    + latePush * (replay ? 0.012 : 0.009);
  const settleLift = focus * (replay ? 0.35 : 0.18);

  canvas.style.transformOrigin = `${originX}% ${originY}%`;
  canvas.style.transform = `translate3d(0, ${settleLift}%, 0) scale(${scale.toFixed(4)})`;
  canvas.dataset.flightCameraV33 = "active";
  requestAnimationFrame(updateFlightCamera);
}

requestAnimationFrame(updateFlightCamera);

window.addEventListener("footballlab:phasechange", (event) => {
  if (event.detail?.phase !== "shooting") return;
  queueMicrotask(enhanceResolvedShot);
});

window.__footballLabFlightV33 = Object.freeze({
  build: BUILD,
  model: "progressive-magnus-dip",
  deterministic: true,
  preservesResolvedOutcome: true,
  camera: "target-biased-late-flight-push"
});