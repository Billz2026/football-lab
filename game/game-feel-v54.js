import { clamp, easeOutCubic, WORLD, state, ctx, canvasView } from "./core-v6.js?v=32.4";
import { buildCamera, ballWorld } from "./world-v7.js?v=32.4";
import { projectWorld } from "./projection-v6.js?v=32.4";
import { sampleShotPath } from "./physics-v7.js?v=32.4";
import { playStrikeSound } from "./strike-audio-v54.js?v=54.0.0";

const BUILD = "54.0.0";
const VIEW = { width: WORLD.width, height: WORLD.height };
const TAU = Math.PI * 2;

let animationToken = null;
let strikeSoundPlayed = false;

function applyTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function smooth(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function cinematicFlightProgress(value) {
  const t = clamp(value, 0, 1);
  if (t <= 0.87) return (t / 0.87) * 0.9;
  return 0.9 + smooth((t - 0.87) / 0.13) * 0.1;
}

function progressAt(time) {
  const animation = state.animation;
  if (!animation) {
    return {
      elapsed: 0,
      flightStart: 0,
      rawFlight: 0,
      flight: 0,
      settle: 0,
      replay: false
    };
  }
  const runMs = Math.max(1, Number(animation.runUpDuration) || 1);
  const holdMs = Math.max(0, Number(animation.contactHoldDuration) || 0);
  const flightMs = Math.max(1, Number(animation.flightDuration) || 1);
  const settleMs = Math.max(1, Number(animation.settleDuration) || 1);
  const elapsed = time - animation.startedAt;
  const flightStart = runMs + holdMs;
  const rawFlight = clamp((elapsed - flightStart) / flightMs, 0, 1);
  const replay = Boolean(animation.isReplay);
  return {
    elapsed,
    flightStart,
    rawFlight,
    flight: replay ? rawFlight : cinematicFlightProgress(rawFlight),
    settle: clamp((elapsed - flightStart - flightMs) / settleMs, 0, 1),
    replay
  };
}

function shotStyle(shot = state.shot, stage = state.currentStage) {
  const ballId = String(stage?.trainingBallId || "standard");
  const quality = clamp(Number(shot?.contactQuality ?? 1), 0, 1);
  const power = clamp(Number(shot?.power ?? 0.5), 0, 1);
  const curve = clamp(Number(shot?.curve ?? 0), -1, 1);

  if (ballId === "knuckle") return "knuckle";
  if (quality < 0.45) return "mishit";
  if (Math.abs(curve) >= 0.58 || ballId === "curve") return "curl";
  if (power >= 0.84 || ballId === "power") return "driven";
  if (ballId === "control") return "controlled";
  return "balanced";
}

function contactStrength() {
  const quality = clamp(Number(state.shot?.contactQuality ?? 1), 0, 1);
  const power = clamp(Number(state.shot?.power ?? 0.5), 0, 1);
  return clamp(quality * 0.66 + power * 0.34, 0.12, 1);
}

function cameraForFrame(progress) {
  const camera = buildCamera(state.currentStage);
  if (progress.flight > 0) {
    const follow = easeOutCubic(progress.flight);
    const ball = sampleShotPath(state.shot?.path, progress.flight);
    camera.position.z -= follow * (progress.replay ? 4.6 : 3.3);
    camera.position.y += follow * 0.2;
    camera.fovY = camera.fovY + (progress.replay ? 28.5 - camera.fovY : 31.5 - camera.fovY) * follow * 0.72;
    if (ball) {
      camera.target.x += (ball.x - camera.target.x) * follow * 0.68;
      camera.target.y += (ball.y - camera.target.y) * follow * 0.56;
      camera.target.z += (ball.z - camera.target.z) * follow * (1 - progress.flight) * 0.42;
    }
  }
  return camera;
}

function contactPoint() {
  if (!state.currentStage) return null;
  return projectWorld(ballWorld(state.currentStage), buildCamera(state.currentStage), VIEW);
}

function impactPoint(progress) {
  const path = state.shot?.path;
  if (!Array.isArray(path) || path.length < 2) return null;
  const index = Number.isInteger(state.shot?.impactIndex)
    ? clamp(state.shot.impactIndex, 0, path.length - 1)
    : path.length - 1;
  return projectWorld(path[index], cameraForFrame(progress), VIEW);
}

function ensureStrikeSound(time, progress) {
  const animation = state.animation;
  if (!animation || progress.replay) return;

  if (animationToken !== animation.id) {
    animationToken = animation.id;
    strikeSoundPlayed = false;
  }
  if (strikeSoundPlayed || progress.elapsed < progress.flightStart) return;

  strikeSoundPlayed = true;
  playStrikeSound({
    power: state.shot?.power,
    contactQuality: state.shot?.contactQuality,
    curve: state.shot?.curve,
    ballId: state.currentStage?.trainingBallId || "standard"
  });
}

function drawContactMoment(progress) {
  if (!state.animation || progress.replay) return;
  const localMs = progress.elapsed - progress.flightStart;
  if (localMs < -46 || localMs > 145) return;

  const point = contactPoint();
  if (!point?.visible) return;

  const enter = smooth((localMs + 46) / 46);
  const exit = 1 - smooth((localMs - 42) / 103);
  const alpha = clamp(Math.min(enter, exit), 0, 1);
  const strength = contactStrength();
  const quality = clamp(Number(state.shot?.contactQuality ?? 1), 0, 1);
  const perfect = quality >= 0.94;
  const scale = 0.72 + strength * 0.52;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";

  const flashLength = 13 + 11 * strength;
  ctx.strokeStyle = perfect
    ? `rgba(255,225,151,${alpha * 0.56})`
    : `rgba(246,248,242,${alpha * 0.34})`;
  ctx.lineWidth = 1.2 + strength * 1.3;
  ctx.beginPath();
  ctx.moveTo(point.x - flashLength * 0.72, point.y + 2);
  ctx.lineTo(point.x + flashLength * 0.28, point.y - flashLength * 0.2);
  ctx.stroke();

  const grassCount = perfect ? 8 : 6;
  ctx.globalCompositeOperation = "source-over";
  for (let index = 0; index < grassCount; index += 1) {
    const spread = (index / Math.max(1, grassCount - 1) - 0.5) * 28 * scale;
    const lift = 5 + (index % 3) * 3 + strength * 5;
    const drift = (index % 2 ? 1 : -1) * (3 + (index % 4));
    ctx.strokeStyle = `rgba(168,184,118,${alpha * (0.2 + (index % 3) * 0.07)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(point.x + spread * 0.3, point.y + 8);
    ctx.quadraticCurveTo(
      point.x + spread * 0.72 + drift,
      point.y + 3 - lift * 0.45,
      point.x + spread + drift,
      point.y + 8 - lift
    );
    ctx.stroke();
  }

  ctx.restore();
}

function trailPalette(style, alpha) {
  if (style === "mishit") return `rgba(224,226,218,${alpha * 0.28})`;
  if (style === "curl") return `rgba(241,244,235,${alpha * 0.48})`;
  if (style === "knuckle") return `rgba(248,244,228,${alpha * 0.42})`;
  if (style === "driven") return `rgba(255,250,235,${alpha * 0.54})`;
  if (style === "controlled") return `rgba(235,242,230,${alpha * 0.4})`;
  return `rgba(240,243,235,${alpha * 0.38})`;
}

function drawFlightSignature(time, progress) {
  if (!state.animation || progress.flight <= 0.015 || progress.flight >= 0.985) return;
  if (!Array.isArray(state.shot?.path) || state.shot.path.length < 2) return;
  if (document.documentElement.classList.contains("reduced-motion-v22")) return;

  const style = shotStyle();
  const quality = clamp(Number(state.shot?.contactQuality ?? 1), 0, 1);
  const speed = clamp(Number(state.shot?.speedMps || state.shot?.diagnostics?.speedMps || 24), 15, 42);
  const camera = cameraForFrame(progress);
  const sampleCount = style === "driven" ? 7 : style === "curl" ? 9 : style === "knuckle" ? 6 : style === "mishit" ? 4 : 6;
  const trailWindow = style === "driven" ? 0.058 : style === "curl" ? 0.085 : style === "knuckle" ? 0.055 : 0.07;
  const points = [];

  for (let index = sampleCount - 1; index >= 0; index -= 1) {
    const behind = (index / Math.max(1, sampleCount - 1)) * trailWindow;
    const sampleProgress = clamp(progress.flight - behind, 0, 1);
    const world = sampleShotPath(state.shot.path, sampleProgress);
    if (!world) continue;
    const projected = projectWorld(world, camera, VIEW);
    if (projected?.visible) points.push(projected);
  }
  if (points.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (style === "knuckle") {
    const wobble = 1.4 + (1 - quality) * 1.7;
    points.forEach((point, index) => {
      const phase = time / 46 + index * 2.23;
      const radius = 0.9 + (index % 2) * 0.7;
      const alpha = (1 - index / points.length) * 0.36;
      ctx.fillStyle = trailPalette(style, alpha);
      ctx.beginPath();
      ctx.arc(
        point.x + Math.sin(phase) * wobble,
        point.y + Math.cos(phase * 1.17) * wobble * 0.62,
        radius,
        0,
        TAU
      );
      ctx.fill();
    });
  } else {
    for (let index = 1; index < points.length; index += 1) {
      const fade = 1 - index / points.length;
      const alpha = fade * (0.36 + quality * 0.3) * (0.78 + (speed - 15) / 54);
      ctx.strokeStyle = trailPalette(style, alpha);
      ctx.lineWidth = style === "driven"
        ? 1.2 + fade * 1.9
        : style === "curl"
          ? 0.9 + fade * 1.4
          : 0.8 + fade * 1.1;
      ctx.beginPath();
      ctx.moveTo(points[index - 1].x, points[index - 1].y);
      ctx.lineTo(points[index].x, points[index].y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawImpactCompression(time, progress) {
  const impactAt = Number(state.presentation?.impactAt);
  if (!state.animation || progress.replay || !Number.isFinite(impactAt)) return;
  const age = time - impactAt;
  if (age < -18 || age > 150) return;

  const point = impactPoint(progress);
  if (!point?.visible) return;

  const enter = smooth((age + 18) / 28);
  const exit = 1 - smooth((age - 44) / 106);
  const alpha = clamp(Math.min(enter, exit), 0, 1);
  const outcome = state.shot?.outcome;
  const isFrame = outcome === "POST" || outcome === "BAR";
  const isSave = outcome === "SAVE";
  const isGoal = outcome === "GOAL";
  const count = isGoal ? 7 : isFrame ? 9 : isSave ? 6 : 4;
  const reach = isFrame ? 25 : isGoal ? 22 : 18;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";

  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * TAU + (isSave ? 0.28 : 0);
    const inner = 4 + (index % 2) * 2;
    const outer = inner + reach * (0.54 + (index % 3) * 0.13);
    const colour = isFrame
      ? `rgba(255,255,255,${alpha * 0.5})`
      : isSave
        ? `rgba(214,239,244,${alpha * 0.34})`
        : isGoal
          ? `rgba(244,247,232,${alpha * 0.32})`
          : `rgba(235,235,229,${alpha * 0.22})`;
    ctx.strokeStyle = colour;
    ctx.lineWidth = isFrame ? 1.7 : 1.2;
    ctx.beginPath();
    ctx.moveTo(point.x + Math.cos(angle) * inner, point.y + Math.sin(angle) * inner * 0.72);
    ctx.lineTo(point.x + Math.cos(angle) * outer, point.y + Math.sin(angle) * outer * 0.72);
    ctx.stroke();
  }

  if (isGoal || isSave || isFrame) {
    const pulse = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 42);
    pulse.addColorStop(0, `rgba(255,255,255,${alpha * (isFrame ? 0.1 : 0.065)})`);
    pulse.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = pulse;
    ctx.fillRect(point.x - 44, point.y - 44, 88, 88);
  }

  ctx.restore();
}

export function drawGameFeelV54(time) {
  applyTransform();
  const progress = progressAt(time);

  if (!state.animation) {
    animationToken = null;
    strikeSoundPlayed = false;
  } else {
    ensureStrikeSound(time, progress);
  }

  drawContactMoment(progress);
  drawFlightSignature(time, progress);
  drawImpactCompression(time, progress);

  window.__footballLabGameFeelFrameV54 = {
    build: BUILD,
    animationId: state.animation?.id || null,
    style: shotStyle(),
    strikeSoundPlayed,
    contactQuality: Number(state.shot?.contactQuality ?? 1),
    flight: progress.flight,
    replay: progress.replay
  };
}

window.__footballLabGameFeelV54 = Object.freeze({
  build: BUILD,
  livePath: "articulated-v44-plus-3d-auto",
  physicsChanged: false,
  outcomesChanged: false,
  strikeAudio: true,
  contactSync: "ball-launch-frame",
  contactTurfResponse: true,
  shotSignatures: ["balanced", "controlled", "driven", "curl", "knuckle", "mishit"],
  impactCompression: true,
  reducedMotionAware: true,
  classifyShot(sample = {}, stage = {}) {
    return shotStyle(sample, stage);
  }
});
