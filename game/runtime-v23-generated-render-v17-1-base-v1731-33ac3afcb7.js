import {
  clamp, lerp, WORLD, state, elements, ctx, canvasView,
  currentAimTarget, easeInOutCubic, easeOutCubic
} from "./core-v6.js?v=32.4";
import {
  GOAL, PITCH, buildCamera, ballWorld, buildWall, keeperWorld,
  kickerWorld, supportingPlayers
} from "./world-v7.js?v=32.4";
import { projectWorld, projectSegment, projectedHeight } from "./projection-v6.js?v=32.4";
import { sampleShotPath } from "./physics-v7.js?v=32.4";
import { playKickSound } from "./audio-v6.js?v=32.4";
import { activeCharacter } from "./characters-v13.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";
import { wallForStage, buildWallLayout } from "./walls-v15.js?v=32.4";

let activeCamera;
const viewport = { width: WORLD.width, height: WORLD.height };
const TAU = Math.PI * 2;

export function resizeCanvas() {
  const rect = elements.canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  canvasView.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
  elements.canvas.width = Math.round(rect.width * canvasView.dpr);
  elements.canvas.height = Math.round(rect.height * canvasView.dpr);
  canvasView.scale = Math.min(rect.width / WORLD.width, rect.height / WORLD.height);
  canvasView.offsetX = (rect.width - WORLD.width * canvasView.scale) / 2;
  canvasView.offsetY = (rect.height - WORLD.height * canvasView.scale) / 2;
  applyTransform();
}

function applyTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function pulse01(value) {
  return Math.sin(clamp(value, 0, 1) * Math.PI);
}

function replayPathProgress(value) {
  const t = clamp(value, 0, 1);
  if (t < 0.67) return easeOutCubic(t / 0.67) * 0.82;
  return 0.82 + smooth01((t - 0.67) / 0.33) * 0.18;
}

function progressAt(time) {
  if (!state.animation) {
    return { elapsed: 0, run: 0, contact: 0, flight: 0, motionFlight: 0, settle: 0, complete: false, replay: false };
  }
  const elapsed = time - state.animation.startedAt;
  const runUpDuration = Math.max(1, state.animation.runUpDuration || 1);
  const contactHoldDuration = Math.max(0, state.animation.contactHoldDuration || 0);
  const flightDuration = Math.max(1, state.animation.flightDuration || 1);
  const settleDuration = Math.max(1, state.animation.settleDuration || 1);
  const flightStart = runUpDuration + contactHoldDuration;
  const flightEnd = flightStart + flightDuration;
  const flight = clamp((elapsed - flightStart) / flightDuration, 0, 1);
  const replay = Boolean(state.animation.isReplay);
  return {
    elapsed,
    run: clamp(elapsed / runUpDuration, 0, 1),
    contact: contactHoldDuration > 0 ? clamp((elapsed - runUpDuration) / contactHoldDuration, 0, 1) : 0,
    flight,
    motionFlight: replay ? replayPathProgress(flight) : flight,
    settle: clamp((elapsed - flightEnd) / settleDuration, 0, 1),
    complete: elapsed >= state.animation.totalDuration,
    replay
  };
}

function cameraForFrame(time) {
  const camera = buildCamera(state.currentStage);
  const progress = progressAt(time);
  const reducedMotion = document.documentElement.classList.contains("reduced-motion-v22");
  if (state.animation && progress.motionFlight > 0 && !reducedMotion) {
    const composition = easeOutCubic(clamp((progress.motionFlight - 0.085) / 0.915, 0, 1));
    const finalApproach = smooth01(clamp((progress.motionFlight - 0.66) / 0.34, 0, 1));
    const ball = sampleShotPath(state.shot?.path, progress.motionFlight);
    camera.position.z -= composition * (progress.replay ? 5.55 : 4.55) + finalApproach * (progress.replay ? 0.55 : 0.42);
    camera.position.y += composition * 0.14;
    camera.fovY = lerp(
      camera.fovY,
      progress.replay ? 25.9 : 27.9,
      clamp(composition * 0.82 + finalApproach * 0.12, 0, 0.94)
    );
    if (ball) {
      camera.target.x = lerp(camera.target.x, ball.x, clamp(composition * 0.84 + finalApproach * 0.1, 0, 0.94));
      camera.target.y = lerp(camera.target.y, ball.y, clamp(composition * 0.72 + finalApproach * 0.12, 0, 0.9));
      camera.target.z = lerp(camera.target.z, ball.z, composition * (1 - progress.motionFlight) * 0.26);
    }
  }
  window.__footballLabCameraV32 = {
    ballFollow: Boolean(state.animation && progress.motionFlight > 0 && !reducedMotion),
    closeFollow: true,
    kickerClearsFrame: true,
    finalApproachEmphasis: true,
    impactHoldThroughSettle: true,
    fovY: camera.fovY,
    reducedMotion,
    flight: progress.motionFlight
  };
  return camera;
}

function applyCameraFeedback(time) {
  if (!state.animation || state.animation.isReplay || document.documentElement.classList.contains("reduced-motion-v22")) return;
  const progress = progressAt(time);
  const contact = clamp(progress.flight / 0.075, 0, 1);
  const impact = impactRatio();
  const outcomeWindow = clamp((progress.motionFlight - impact) / 0.095, 0, 1);
  const contactStrength = contact > 0 && contact < 1 ? Math.sin(contact * Math.PI) * 1.9 : 0;
  const impactStrength = outcomeWindow > 0 && outcomeWindow < 1
    ? Math.sin(outcomeWindow * Math.PI) * ({ GOAL: 2.6, SAVE: 2.2, POST: 3.2, BAR: 3.2, WALL: 2.5 }[state.shot?.outcome] || 0.9)
    : 0;
  const strength = contactStrength + impactStrength;
  if (strength <= 0) return;
  ctx.translate(Math.sin(time * 0.17) * strength, Math.cos(time * 0.21) * strength * 0.48);
}

function lineWorld(a, b, width = 1.6, colour = "rgba(235,255,232,.68)") {
  const segment = projectSegment(a, b, activeCamera, viewport);
  if (!segment) return;
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(segment.a.x, segment.a.y);
  ctx.lineTo(segment.b.x, segment.b.y);
  ctx.stroke();
}

function polygonWorld(points, fillStyle) {
  const projected = points.map((point) => projectWorld(point, activeCamera, viewport));
  if (projected.some((point) => !point.visible)) return;
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  projected.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.closePath();
  ctx.fill();
}

function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

const VENUE_THEMES = Object.freeze({
  academy: Object.freeze({ sky: ["#173929", "#2f6946", "#8aac6b"], stand: ["#0c1711", "#19281e"], crowd: "220,244,207", glow: "210,249,153", rows: 3, roof: false, lights: false }),
  city: Object.freeze({ sky: ["#1b2432", "#654a45", "#c27a51"], stand: ["#080d12", "#18212a"], crowd: "255,220,178", glow: "255,167,94", rows: 5, roof: true, lights: true }),
  night: Object.freeze({ sky: ["#020714", "#071527", "#142b3f"], stand: ["#010409", "#08111a"], crowd: "202,228,255", glow: "102,181,255", rows: 6, roof: true, lights: true }),
  storm: Object.freeze({ sky: ["#081016", "#172832", "#334750"], stand: ["#03070a", "#0d171b"], crowd: "187,216,220", glow: "151,208,220", rows: 6, roof: true, lights: true }),
  world: Object.freeze({ sky: ["#080516", "#15102b", "#2b2040"], stand: ["#020205", "#0e0b16"], crowd: "255,233,174", glow: "242,201,102", rows: 7, roof: true, lights: true }),
  summit: Object.freeze({ sky: ["#03070d", "#101d28", "#29404a"], stand: ["#010304", "#091014"], crowd: "228,245,247", glow: "194,236,239", rows: 7, roof: true, lights: true })
});

function drawBackground() {
  const theme = VENUE_THEMES[state.currentStage.environment] || VENUE_THEMES.academy;
  const sky = ctx.createLinearGradient(0, 0, 0, 360);
  sky.addColorStop(0, theme.sky[0]);
  sky.addColorStop(0.68, theme.sky[1]);
  sky.addColorStop(1, theme.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  const stand = ctx.createLinearGradient(0, 112, 0, 350);
  stand.addColorStop(0, theme.stand[0]);
  stand.addColorStop(1, theme.stand[1]);
  ctx.fillStyle = stand;
  ctx.fillRect(0, 112, WORLD.width, 244);

  if (theme.roof) {
    ctx.fillStyle = "rgba(0,0,0,.72)";
    ctx.fillRect(0, 96, WORLD.width, 22);
    ctx.fillStyle = `rgba(${theme.glow},.16)`;
    ctx.fillRect(0, 116, WORLD.width, 2);
  }

  for (let row = 0; row < theme.rows; row += 1) {
    for (let x = 10 + row * 13; x < WORLD.width; x += 22) {
      const alpha = 0.055 + ((x + row * 23) % 70) / 940;
      ctx.fillStyle = `rgba(${theme.crowd},${alpha})`;
      ctx.beginPath();
      ctx.arc(x, 150 + row * 37 + Math.sin(x * 0.1) * 2, 3, 0, TAU);
      ctx.fill();
    }
  }

  if (theme.lights) {
    for (const x of [80, WORLD.width - 80]) {
      ctx.fillStyle = "rgba(4,7,8,.9)";
      ctx.fillRect(x - 4, 18, 8, 118);
      const light = ctx.createRadialGradient(x, 28, 2, x, 28, 125);
      light.addColorStop(0, `rgba(${theme.glow},.38)`);
      light.addColorStop(1, `rgba(${theme.glow},0)`);
      ctx.fillStyle = light;
      ctx.fillRect(x - 130, -80, 260, 250);
      ctx.fillStyle = `rgba(${theme.glow},.72)`;
      ctx.fillRect(x - 28, 18, 56, 13);
    }
  }

  const glow = ctx.createRadialGradient(610, 190, 0, 610, 190, 470);
  glow.addColorStop(0, `rgba(${theme.glow},.12)`);
  glow.addColorStop(1, `rgba(${theme.glow},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(80, 0, 1050, 430);

  ctx.fillStyle = "rgba(1,5,3,.72)";
  ctx.fillRect(442, 123, 316, 36);
  ctx.strokeStyle = `rgba(${theme.glow},.32)`;
  ctx.strokeRect(442.5, 123.5, 315, 35);
  ctx.fillStyle = `rgba(${theme.glow},.78)`;
  ctx.font = "900 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(state.currentStage.venue || "FOOTBALL LAB", 600, 146);
}

function drawPitch() {
  const nearZ = activeCamera.position.z - 0.32;
  polygonWorld([
    { x: -PITCH.halfWidth, y: 0, z: -4 },
    { x: PITCH.halfWidth, y: 0, z: -4 },
    { x: PITCH.halfWidth, y: 0, z: nearZ },
    { x: -PITCH.halfWidth, y: 0, z: nearZ }
  ], "#18572f");

  for (let z = -4, index = 0; z < nearZ; z += 4.2, index += 1) {
    const next = Math.min(nearZ, z + 4.2);
    polygonWorld([
      { x: -PITCH.halfWidth, y: 0.002, z },
      { x: PITCH.halfWidth, y: 0.002, z },
      { x: PITCH.halfWidth, y: 0.002, z: next },
      { x: -PITCH.halfWidth, y: 0.002, z: next }
    ], index % 2 ? "rgba(255,255,255,.014)" : "rgba(0,0,0,.035)");
  }

  const white = "rgba(236,255,232,.66)";
  lineWorld({ x: -PITCH.halfWidth, y: 0.015, z: 0 }, { x: PITCH.halfWidth, y: 0.015, z: 0 }, 1.6, white);
  const penalty = PITCH.penaltyHalfWidth;
  lineWorld({ x: -penalty, y: 0.015, z: 0 }, { x: -penalty, y: 0.015, z: PITCH.penaltyDepth }, 1.55, white);
  lineWorld({ x: penalty, y: 0.015, z: 0 }, { x: penalty, y: 0.015, z: PITCH.penaltyDepth }, 1.55, white);
  lineWorld({ x: -penalty, y: 0.015, z: PITCH.penaltyDepth }, { x: penalty, y: 0.015, z: PITCH.penaltyDepth }, 1.55, white);

  const six = PITCH.sixYardHalfWidth;
  lineWorld({ x: -six, y: 0.018, z: 0 }, { x: -six, y: 0.018, z: PITCH.sixYardDepth }, 1.3, white);
  lineWorld({ x: six, y: 0.018, z: 0 }, { x: six, y: 0.018, z: PITCH.sixYardDepth }, 1.3, white);
  lineWorld({ x: -six, y: 0.018, z: PITCH.sixYardDepth }, { x: six, y: 0.018, z: PITCH.sixYardDepth }, 1.3, white);

  const spot = projectWorld({ x: 0, y: 0.025, z: PITCH.penaltySpotZ }, activeCamera, viewport);
  if (spot.visible) {
    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, Math.max(1.2, spot.scale * 0.065), 0, TAU);
    ctx.fill();
  }

  const arcPoints = [];
  for (let angle = Math.PI * 0.13; angle <= Math.PI * 0.87; angle += Math.PI / 54) {
    const point = {
      x: Math.cos(angle) * PITCH.arcRadius,
      y: 0.02,
      z: PITCH.penaltySpotZ + Math.sin(angle) * PITCH.arcRadius
    };
    if (point.z >= PITCH.penaltyDepth - 0.08) arcPoints.push(point);
  }
  ctx.strokeStyle = white;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let started = false;
  for (const point of arcPoints) {
    const projected = projectWorld(point, activeCamera, viewport);
    if (!projected.visible) continue;
    started ? ctx.lineTo(projected.x, projected.y) : ctx.moveTo(projected.x, projected.y);
    started = true;
  }
  if (started) ctx.stroke();
}

function drawGoal(time) {
  const left = -GOAL.halfWidth;
  const right = GOAL.halfWidth;
  const backZ = -GOAL.depth;
  const frame = "rgba(247,255,244,.96)";
  const net = "rgba(238,255,236,.19)";
  const progress = progressAt(time);
  const impact = impactRatio();
  const goalImpactActive = Boolean(state.animation && state.shot.outcome === "GOAL" && progress.motionFlight >= impact);
  const impactFlightTail = goalImpactActive
    ? clamp((progress.motionFlight - impact) / Math.max(0.028, 1 - impact), 0, 1)
    : 0;
  const rippleClock = impactFlightTail * 0.28 + progress.settle * 0.72;
  const speedEnergy = 0.52 + clamp((state.shot.speedMps || 0) / 42, 0, 1) * 0.34;
  const rippleEnergy = goalImpactActive
    ? Math.max(0, Math.exp(-rippleClock * 1.45) * speedEnergy * (0.72 + Math.cos(rippleClock * TAU * 2.2) * 0.28))
    : 0;
  const impactX = Number.isFinite(state.shot?.actualX) ? lerp(left, right, state.shot.actualX) : 0;
  const impactY = Number.isFinite(state.shot?.actualY) ? GOAL.height * (1 - state.shot.actualY) : GOAL.height * 0.5;
  const localRipple = (x, y) => {
    const xFalloff = Math.max(0, 1 - Math.abs(x - impactX) / (GOAL.width * 0.55));
    const yFalloff = Math.max(0, 1 - Math.abs(y - impactY) / (GOAL.height * 0.72));
    return rippleEnergy * xFalloff * yFalloff;
  };

  lineWorld({ x: left, y: 0, z: 0 }, { x: left, y: GOAL.height, z: 0 }, 3.4, frame);
  lineWorld({ x: right, y: 0, z: 0 }, { x: right, y: GOAL.height, z: 0 }, 3.4, frame);
  lineWorld({ x: left, y: GOAL.height, z: 0 }, { x: right, y: GOAL.height, z: 0 }, 3.4, frame);
  lineWorld({ x: left, y: GOAL.height, z: 0 }, { x: left, y: GOAL.height, z: backZ }, 1.7, frame);
  lineWorld({ x: right, y: GOAL.height, z: 0 }, { x: right, y: GOAL.height, z: backZ }, 1.7, frame);
  lineWorld({ x: left, y: GOAL.height, z: backZ }, { x: right, y: GOAL.height, z: backZ }, 1.7, frame);

  for (let i = 0; i <= 10; i += 1) {
    const x = lerp(left, right, i / 10);
    const ripple = localRipple(x, impactY);
    lineWorld({ x, y: 0.04, z: backZ - ripple * 0.58 }, { x, y: GOAL.height, z: -ripple * 0.14 }, 0.82, net);
  }
  for (let i = 1; i < 7; i += 1) {
    const y = (GOAL.height * i) / 7;
    const ripple = localRipple(impactX, y);
    lineWorld({ x: left, y, z: -ripple * 0.08 }, { x: right, y, z: backZ - ripple * 1.08 }, 0.82, net);
  }
  window.__footballLabNetV32 = {
    localised: true,
    active: rippleEnergy > 0,
    impactX,
    impactY,
    energy: rippleEnergy
  };
}

function drawSimplePerson(world, options = {}) {
  const projection = projectedHeight(world, options.height || 1.8, activeCamera, viewport);
  if (!projection) return;
  const { foot, height } = projection;
  const bodyWidth = height * 0.205;
  const headRadius = height * 0.07;
  const headY = -height;
  const bodyTop = headY + headRadius * 1.8;
  const bodyBottom = -height * 0.29;

  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.fillStyle = "rgba(0,0,0,.19)";
  ctx.beginPath();
  ctx.ellipse(0, 3, bodyWidth * 0.6, height * 0.04, 0, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = options.shortColour || "#111a14";
  ctx.lineWidth = Math.max(3, height * 0.052);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-bodyWidth * 0.17, bodyBottom);
  ctx.lineTo(-bodyWidth * 0.27, 0);
  ctx.moveTo(bodyWidth * 0.17, bodyBottom);
  ctx.lineTo(bodyWidth * 0.27, 0);
  ctx.stroke();

  ctx.fillStyle = options.shirtColour || "#31483a";
  roundedRect(-bodyWidth / 2, bodyTop, bodyWidth, bodyBottom - bodyTop, bodyWidth * 0.22);
  ctx.fill();

  ctx.strokeStyle = options.skinColour || "#c99774";
  ctx.lineWidth = Math.max(3, height * 0.047);
  ctx.beginPath();
  ctx.moveTo(-bodyWidth * 0.4, bodyTop + height * 0.14);
  ctx.lineTo(-bodyWidth * 0.72, bodyTop + height * 0.24);
  ctx.moveTo(bodyWidth * 0.4, bodyTop + height * 0.14);
  ctx.lineTo(bodyWidth * 0.72, bodyTop + height * 0.24);
  ctx.stroke();

  ctx.fillStyle = options.skinColour || "#c99774";
  ctx.beginPath();
  ctx.arc(0, headY + headRadius, headRadius, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawSupportingPlayers() {
  for (const player of supportingPlayers(state.currentStage)) {
    drawSimplePerson(player, {
      shirtColour: player.team === "attack" ? "#dafe4d" : "#345246",
      shortColour: "#172019",
      height: 1.78,
      alpha: 0.65
    });
  }
}

function screenPoint(x, y) { return { x, y }; }

function drawSegment(a, b, width, colour, outline = "rgba(2,7,4,.82)") {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = outline;
  ctx.lineWidth = width + Math.max(1.4, width * 0.38);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function drawJoint(point, radius, colour, outline = "rgba(2,7,4,.82)") {
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius + Math.max(1.1, radius * 0.35), 0, TAU);
  ctx.fill();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, TAU);
  ctx.fill();
}

function drawArticulated(world, pose, colours, heightMetres = 1.82) {
  const projection = projectedHeight(world, heightMetres, activeCamera, viewport);
  if (!projection) return;
  const { foot, height: h } = projection;
  const skin = colours.skin || "#c99774";
  const shirt = colours.shirt || "#dafe4d";
  const shorts = colours.shorts || "#111a14";
  const shoe = colours.shoe || "#07110b";
  const arm = colours.arm || skin;
  const rotation = pose.rotation || 0;
  const liftPixels = (pose.lift || 0) * h;

  ctx.save();
  ctx.translate(foot.x, foot.y - liftPixels);
  ctx.rotate(rotation);
  ctx.globalAlpha = pose.alpha ?? 1;

  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(0, 3 + liftPixels, h * 0.15, h * 0.038, 0, 0, TAU);
  ctx.fill();

  const crouch = pose.crouch || 0;
  const pelvis = screenPoint((pose.pelvisX || 0) * h, -0.335 * h + crouch * h * 0.09);
  const chest = screenPoint((pose.chestX || 0) * h, -0.635 * h + crouch * h * 0.1);
  const headRadius = h * 0.068;
  const neckBase = screenPoint(chest.x + (pose.headX || 0) * h * 0.2, chest.y - h * 0.025);
  const head = screenPoint(neckBase.x + (pose.headX || 0) * h * 0.8, neckBase.y - h * 0.12);
  const shoulderHalf = h * 0.118;
  const hipHalf = h * 0.068;
  const leftShoulder = screenPoint(chest.x - shoulderHalf, chest.y + h * 0.015);
  const rightShoulder = screenPoint(chest.x + shoulderHalf, chest.y + h * 0.015);
  const leftHip = screenPoint(pelvis.x - hipHalf, pelvis.y);
  const rightHip = screenPoint(pelvis.x + hipHalf, pelvis.y);

  const localAbsolute = (worldPoint) => {
    if (!worldPoint) return null;
    const projected = projectWorld(worldPoint, activeCamera, viewport);
    if (!projected.visible) return null;
    const dx = projected.x - foot.x;
    const dy = projected.y - (foot.y - liftPixels);
    const cosine = Math.cos(-rotation);
    const sine = Math.sin(-rotation);
    return screenPoint(dx * cosine - dy * sine, dx * sine + dy * cosine);
  };
  const p = (value, fallback) => value ? screenPoint(value.x * h, value.y * h) : fallback;

  const leftKnee = p(pose.leftKnee, screenPoint(-0.11 * h, -0.15 * h));
  const rightKnee = p(pose.rightKnee, screenPoint(0.11 * h, -0.15 * h));
  const leftAnkle = p(pose.leftAnkle, screenPoint(-0.13 * h, -0.01 * h));
  const rightAnkle = p(pose.rightAnkle, screenPoint(0.13 * h, -0.01 * h));
  const leftToe = p(pose.leftToe, screenPoint(leftAnkle.x - 0.045 * h, leftAnkle.y + 0.005 * h));
  const rightToe = p(pose.rightToe, screenPoint(rightAnkle.x + 0.045 * h, rightAnkle.y + 0.005 * h));

  const absoluteLeftHand = localAbsolute(pose.absoluteLeftHand);
  const absoluteRightHand = localAbsolute(pose.absoluteRightHand);
  const leftHand = absoluteLeftHand || p(pose.leftHand, screenPoint(-0.27 * h, -0.42 * h));
  const rightHand = absoluteRightHand || p(pose.rightHand, screenPoint(0.27 * h, -0.42 * h));
  const leftElbow = p(
    pose.leftElbow,
    absoluteLeftHand
      ? screenPoint(lerp(leftShoulder.x, leftHand.x, 0.52) - h * 0.035, lerp(leftShoulder.y, leftHand.y, 0.52) + h * 0.025)
      : screenPoint(-0.22 * h, -0.55 * h)
  );
  const rightElbow = p(
    pose.rightElbow,
    absoluteRightHand
      ? screenPoint(lerp(rightShoulder.x, rightHand.x, 0.52) + h * 0.035, lerp(rightShoulder.y, rightHand.y, 0.52) + h * 0.025)
      : screenPoint(0.22 * h, -0.55 * h)
  );

  const legWidth = Math.max(4, h * 0.052);
  drawSegment(leftHip, leftKnee, legWidth, shorts);
  drawSegment(leftKnee, leftAnkle, legWidth * 0.86, shorts);
  drawSegment(rightHip, rightKnee, legWidth, shorts);
  drawSegment(rightKnee, rightAnkle, legWidth * 0.86, shorts);
  drawSegment(leftAnkle, leftToe, legWidth * 0.92, shoe);
  drawSegment(rightAnkle, rightToe, legWidth * 0.92, shoe);

  const neckTop = screenPoint(head.x, head.y + headRadius * 0.74);
  drawSegment(neckBase, neckTop, Math.max(3, h * 0.05), skin, "rgba(2,7,4,.72)");

  ctx.save();
  ctx.translate((chest.x + pelvis.x) / 2, (chest.y + pelvis.y) / 2);
  ctx.rotate(pose.torsoLean || 0);
  ctx.fillStyle = "rgba(2,7,4,.8)";
  roundedRect(-h * 0.128, -h * 0.178, h * 0.256, h * 0.356, h * 0.055);
  ctx.fill();
  ctx.fillStyle = shirt;
  roundedRect(-h * 0.116, -h * 0.166, h * 0.232, h * 0.332, h * 0.05);
  ctx.fill();
  if (pose.number != null) {
    ctx.fillStyle = "#07110b";
    ctx.font = `900 ${Math.max(8, h * 0.1)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(pose.number), 0, h * 0.015);
  }
  ctx.restore();

  const armWidth = Math.max(3.6, h * 0.043);
  drawJoint(leftShoulder, armWidth * 0.66, shirt, "rgba(2,7,4,.72)");
  drawJoint(rightShoulder, armWidth * 0.66, shirt, "rgba(2,7,4,.72)");
  drawSegment(leftShoulder, leftElbow, armWidth, arm);
  drawSegment(leftElbow, leftHand, armWidth * 0.88, arm);
  drawSegment(rightShoulder, rightElbow, armWidth, arm);
  drawSegment(rightElbow, rightHand, armWidth * 0.88, arm);
  const gloveRadius = armWidth * 0.58 * (pose.gloveScale || 1);
  drawJoint(leftHand, gloveRadius, pose.glove || skin);
  drawJoint(rightHand, gloveRadius, pose.glove || skin);
  drawJoint(head, headRadius, skin, "rgba(2,7,4,.7)");
  ctx.fillStyle = colours.hair || "#171713";
  ctx.beginPath();
  ctx.arc(head.x, head.y - headRadius * 0.12, headRadius * 0.87, Math.PI, TAU);
  ctx.fill();

  ctx.restore();
}

function impactKickerPose() {
  return {
    number: 10,
    crouch: 0.055,
    torsoLean: -0.055,
    rotation: 0.018,
    leftKnee: { x: -0.17, y: -0.13 },
    leftAnkle: { x: -0.23, y: -0.005 },
    leftToe: { x: -0.29, y: -0.002 },
    rightKnee: { x: 0.08, y: -0.225 },
    rightAnkle: { x: -0.015, y: -0.245 },
    rightToe: { x: -0.095, y: -0.218 },
    leftHand: { x: -0.29, y: -0.42 },
    rightHand: { x: 0.37, y: -0.48 }
  };
}

function kickerPose(progress, time) {
  if (!state.animation) {
    const breathe = Math.sin(time / 520) * 0.01;
    return {
      number: 10,
      crouch: 0.035 + breathe,
      leftKnee: { x: -0.095, y: -0.145 },
      rightKnee: { x: 0.095, y: -0.145 },
      leftAnkle: { x: -0.12, y: -0.005 },
      rightAnkle: { x: 0.12, y: -0.005 },
      leftHand: { x: -0.25, y: -0.43 },
      rightHand: { x: 0.25, y: -0.43 }
    };
  }

  if (progress.replay) {
    const follow = smooth01(clamp(progress.flight / 0.28, 0, 1));
    return {
      ...impactKickerPose(),
      torsoLean: lerp(-0.055, 0.055, follow),
      rotation: lerp(0.018, 0.052, follow),
      rightKnee: { x: lerp(0.08, -0.02, follow), y: lerp(-0.225, -0.29, follow) },
      rightAnkle: { x: lerp(-0.015, -0.2, follow), y: lerp(-0.245, -0.32, follow) },
      rightToe: { x: lerp(-0.095, -0.3, follow), y: lerp(-0.218, -0.29, follow) }
    };
  }

  if (progress.contact > 0 && progress.flight <= 0) return impactKickerPose();

  if (progress.flight > 0 || progress.settle > 0) {
    const follow = smooth01(clamp(progress.flight / 0.17, 0, 1));
    const recover = smooth01(clamp((progress.flight - 0.4) / 0.52, 0, 1));
    const settle = progress.settle;
    return {
      number: 10,
      crouch: lerp(lerp(0.055, 0.025, follow), 0.04, Math.max(recover, settle)),
      torsoLean: lerp(lerp(-0.055, 0.055, follow), 0.005, Math.max(recover, settle)),
      rotation: lerp(lerp(0.018, 0.052, follow), 0.01, Math.max(recover, settle)),
      leftKnee: { x: lerp(-0.17, -0.11, recover), y: lerp(-0.13, -0.145, recover) },
      leftAnkle: { x: lerp(-0.23, -0.13, recover), y: -0.005 },
      leftToe: { x: lerp(-0.29, -0.18, recover), y: -0.002 },
      rightKnee: {
        x: lerp(lerp(0.08, -0.02, follow), 0.11, recover),
        y: lerp(lerp(-0.225, -0.29, follow), -0.15, recover)
      },
      rightAnkle: {
        x: lerp(lerp(-0.015, -0.2, follow), 0.13, recover),
        y: lerp(lerp(-0.245, -0.32, follow), -0.005, recover)
      },
      rightToe: {
        x: lerp(lerp(-0.095, -0.3, follow), 0.18, recover),
        y: lerp(lerp(-0.218, -0.29, follow), 0, recover)
      },
      leftHand: { x: lerp(-0.29, -0.25, recover), y: lerp(-0.42, -0.43, recover) },
      rightHand: { x: lerp(0.37, 0.25, recover), y: lerp(-0.48, -0.43, recover) }
    };
  }

  const run = progress.run;
  if (run < 0.62) {
    const stride = Math.sin((run / 0.62) * Math.PI * 3.8);
    const lift = Math.abs(stride) * 0.03;
    return {
      number: 10,
      crouch: 0.025 + lift,
      pelvisX: stride * 0.024,
      chestX: stride * 0.028,
      torsoLean: -0.035 - run * 0.065,
      leftKnee: { x: -0.1 - stride * 0.075, y: -0.15 - Math.max(0, stride) * 0.085 },
      rightKnee: { x: 0.1 + stride * 0.075, y: -0.15 - Math.max(0, -stride) * 0.085 },
      leftAnkle: { x: -0.13 - stride * 0.105, y: -0.005 - Math.max(0, stride) * 0.028 },
      rightAnkle: { x: 0.13 + stride * 0.105, y: -0.005 - Math.max(0, -stride) * 0.028 },
      leftHand: { x: -0.26 + stride * 0.075, y: -0.44 - stride * 0.04 },
      rightHand: { x: 0.26 + stride * 0.075, y: -0.44 + stride * 0.04 }
    };
  }

  if (run < 0.84) {
    const plant = smooth01((run - 0.62) / 0.22);
    return {
      number: 10,
      crouch: lerp(0.04, 0.095, plant),
      torsoLean: lerp(-0.075, -0.145, plant),
      chestX: lerp(0.01, -0.03, plant),
      leftKnee: { x: lerp(-0.1, -0.17, plant), y: lerp(-0.15, -0.13, plant) },
      leftAnkle: { x: lerp(-0.13, -0.23, plant), y: -0.005 },
      leftToe: { x: lerp(-0.17, -0.29, plant), y: -0.002 },
      rightKnee: { x: lerp(0.1, 0.2, plant), y: lerp(-0.15, -0.31, plant) },
      rightAnkle: { x: lerp(0.13, 0.23, plant), y: lerp(-0.005, -0.2, plant) },
      rightToe: { x: lerp(0.18, 0.3, plant), y: lerp(0, -0.17, plant) },
      leftHand: { x: lerp(-0.25, -0.34, plant), y: lerp(-0.44, -0.5, plant) },
      rightHand: { x: lerp(0.25, 0.33, plant), y: lerp(-0.44, -0.59, plant) }
    };
  }

  const strike = smooth01((run - 0.84) / 0.16);
  const impact = impactKickerPose();
  return {
    number: 10,
    crouch: lerp(0.095, impact.crouch, strike),
    torsoLean: lerp(-0.145, impact.torsoLean, strike),
    rotation: lerp(-0.035, impact.rotation, strike),
    leftKnee: impact.leftKnee,
    leftAnkle: impact.leftAnkle,
    leftToe: impact.leftToe,
    rightKnee: { x: lerp(0.2, impact.rightKnee.x, strike), y: lerp(-0.31, impact.rightKnee.y, strike) },
    rightAnkle: { x: lerp(0.23, impact.rightAnkle.x, strike), y: lerp(-0.2, impact.rightAnkle.y, strike) },
    rightToe: { x: lerp(0.3, impact.rightToe.x, strike), y: lerp(-0.17, impact.rightToe.y, strike) },
    leftHand: { x: lerp(-0.34, impact.leftHand.x, strike), y: lerp(-0.5, impact.leftHand.y, strike) },
    rightHand: { x: lerp(0.33, impact.rightHand.x, strike), y: lerp(-0.59, impact.rightHand.y, strike) }
  };
}

function currentWallTargetX() {
  const shot = state.shot;
  if (Number.isFinite(shot?.actualX)) return -GOAL.halfWidth + shot.actualX * GOAL.width;
  if (Number.isFinite(shot?.aimX)) return -GOAL.halfWidth + shot.aimX * GOAL.width;
  return state.currentStage.protectedGoalX || 0;
}

function activeWallLayout() {
  return buildWallLayout(state.currentStage, state.stage, {
    targetX: currentWallTargetX(),
    curve: state.shot?.curve ?? 0
  });
}

function pathRatioAtWall() {
  const path = state.shot?.path;
  if (!path?.length) return 0.5;
  if (state.shot.outcome === "WALL" && Number.isInteger(state.shot.collision?.index)) {
    return clamp(state.shot.collision.index / Math.max(1, path.length - 1), 0.08, 0.9);
  }
  const wall = activeWallLayout();
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let index = 0; index < path.length; index += 1) {
    const point = path[index];
    const distance = Math.hypot(point.x - wall.centre.x, point.z - wall.centre.z);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return clamp(bestIndex / Math.max(1, path.length - 1), 0.08, 0.9);
}

function wallPose(progress, index, count, hit) {
  if (!state.animation) {
    return {
      crouch: 0.025,
      leftHand: { x: -0.1, y: -0.42 },
      rightHand: { x: 0.1, y: -0.42 }
    };
  }

  const flight = progress.motionFlight;
  const wallProfile = wallForStage(state.stage);
  const modifiers = wallProfile.modifiers;
  const centreIndex = (count - 1) / 2;
  const stagger = (index - centreIndex) * modifiers.staggerTiming
    + (index % 2 === 0 ? -modifiers.alternateDelay : modifiers.alternateDelay);
  const passRatio = clamp(pathRatioAtWall() - modifiers.jumpLead + stagger, 0.1, 0.88);
  const anticipation = smooth01((flight - (passRatio - 0.23)) / 0.14);
  const jump = pulse01((flight - (passRatio - 0.12)) / Math.max(0.18, modifiers.jumpWindow * 1.5));
  const landing = pulse01((flight - (passRatio + 0.1)) / 0.3);
  const jumpPattern = modifiers.jumpPattern[index % modifiers.jumpPattern.length] || 1;
  const hitRatio = state.shot.outcome === "WALL" && Number.isInteger(state.shot.collision?.index)
    ? state.shot.collision.index / Math.max(1, state.shot.path.length - 1)
    : passRatio;
  const hitReact = hit ? pulse01((flight - hitRatio) / 0.32) : 0;
  const passReact = pulse01((flight - passRatio) / 0.26) * (hit ? 0 : 1);
  const direction = index < centreIndex ? -1 : 1;

  return {
    crouch: 0.025 + anticipation * 0.13 + landing * 0.105,
    lift: Math.max(0, jump) * 0.118 * modifiers.jumpMultiplier * jumpPattern,
    rotation: hitReact * direction * 0.34 + passReact * direction * 0.055,
    chestX: hitReact * direction * 0.1 + passReact * direction * 0.018,
    leftKnee: { x: -0.1 - hitReact * direction * 0.025, y: -0.15 + landing * 0.035 },
    rightKnee: { x: 0.1 - hitReact * direction * 0.025, y: -0.15 + landing * 0.035 },
    leftAnkle: { x: -0.13, y: -0.005 + landing * 0.01 },
    rightAnkle: { x: 0.13, y: -0.005 + landing * 0.01 },
    leftHand: { x: -0.09 - hitReact * 0.16 - passReact * 0.035, y: -0.42 + anticipation * 0.055 + hitReact * 0.04 },
    rightHand: { x: 0.09 + hitReact * 0.16 + passReact * 0.035, y: -0.42 + anticipation * 0.055 - hitReact * 0.025 }
  };
}

function impactRatio() {
  const shot = state.shot;
  if (!shot?.path?.length) return 0.93;
  if (Number.isInteger(shot.impactIndex)) return clamp(shot.impactIndex / Math.max(1, shot.path.length - 1), 0.1, 0.99);
  return 0.94;
}

function keeperState(progress, time) {
  const keeperProfile = keeperForStage(state.stage);
  const plan = state.shot?.keeperPlan;
  const baseIdle = keeperWorld(state.currentStage);
  const idle = plan?.start || {
    ...baseIdle,
    z: baseIdle.z + keeperProfile.modifiers.forwardStart
  };
  if (!state.animation || !plan) {
    const shift = Math.sin(time / 620) * 0.14;
    return {
      world: { ...idle, x: idle.x + shift },
      pose: {
        crouch: 0.09 + Math.sin(time / 420) * 0.012,
        leftKnee: { x: -0.16, y: -0.135 },
        rightKnee: { x: 0.16, y: -0.135 },
        leftHand: { x: -0.36, y: -0.54 },
        rightHand: { x: 0.36, y: -0.54 },
        glove: "#f7ffd2",
        gloveScale: 1.45
      }
    };
  }

  const flight = progress.motionFlight;
  const reactionFraction = clamp(plan.reaction / Math.max(0.01, plan.flightSeconds), 0.08, 0.72);
  const direction = Math.sign(plan.contact.x - idle.x || 1);
  const prep = clamp(flight / Math.max(0.08, reactionFraction), 0, 1);
  const adjustmentStep = Math.sin(prep * Math.PI * 4) * (1 - prep) * 0.055;
  const coil = smooth01((flight - Math.max(0, reactionFraction - 0.13)) / 0.13);
  const push = pulse01((flight - (reactionFraction - 0.04)) / 0.2);
  const diveRaw = clamp((flight - reactionFraction) / Math.max(0.12, 0.9 - reactionFraction), 0, 1);
  const dive = smooth01(diveRaw);
  const launch = smooth01(clamp((diveRaw - 0.07) / 0.93, 0, 1));
  const contactPoint = impactRatio();
  const land = smooth01((flight - Math.min(0.9, contactPoint + 0.01)) / 0.16);
  const recovery = smooth01(progress.settle);
  const saveContact = state.shot?.outcome === "SAVE"
    ? smooth01((flight - Math.max(0.1, contactPoint - 0.025)) / 0.055)
    : 0;
  const catchHold = state.shot?.saveType === "CATCH" ? smooth01((saveContact - 0.08) / 0.72) : 0;
  const parryFollow = state.shot?.saveType === "PARRY" ? pulse01((flight - contactPoint) / 0.22) : 0;

  const world = {
    x: lerp(idle.x + adjustmentStep, plan.contact.x - direction * 0.08, launch),
    y: Math.max(0, Math.sin(launch * Math.PI) * 0.38 + push * 0.075) * (1 - land * 0.94),
    z: lerp(idle.z, plan.contact.z, launch)
  };

  const leadShoulderHeight = world.y + 1.28;
  const reach = smooth01(clamp((diveRaw - 0.08) / 0.82, 0, 1));
  const leadHand = {
    x: lerp(world.x + direction * 0.12, plan.contact.x, reach),
    y: lerp(leadShoulderHeight, plan.contact.y, reach),
    z: lerp(world.z, plan.contact.z, reach)
  };
  const trailHand = {
    x: lerp(world.x - direction * 0.1, plan.contact.x - direction * 0.23, reach * 0.9),
    y: lerp(world.y + 1.18, plan.contact.y - 0.08, reach * 0.9),
    z: lerp(world.z + 0.02, plan.contact.z + 0.03, reach * 0.9)
  };
  const absoluteLeftHand = direction > 0 ? trailHand : leadHand;
  const absoluteRightHand = direction > 0 ? leadHand : trailHand;

  if (catchHold > 0) {
    const chestTarget = { x: world.x + direction * 0.035, y: world.y + 1.05, z: world.z };
    for (const hand of [absoluteLeftHand, absoluteRightHand]) {
      hand.x = lerp(hand.x, chestTarget.x, catchHold * 0.72);
      hand.y = lerp(hand.y, chestTarget.y, catchHold * 0.72);
      hand.z = lerp(hand.z, chestTarget.z, catchHold * 0.72);
    }
  } else if (parryFollow > 0) {
    const lead = direction > 0 ? absoluteRightHand : absoluteLeftHand;
    lead.x += direction * parryFollow * 0.22;
    lead.y += parryFollow * 0.06;
  }

  const launchRotation = direction * lerp(0, 1.08, launch);
  const finalRotation = direction * lerp(1.08, 0.7, recovery);
  const rotation = land > 0 ? lerp(launchRotation, finalRotation, Math.max(land, recovery)) : launchRotation;

  return {
    world,
    pose: {
      crouch: 0.08 + coil * 0.16 + land * 0.16 + recovery * 0.05 + catchHold * 0.035,
      rotation,
      torsoLean: direction * launch * 0.12,
      chestX: direction * launch * 0.045,
      leftKnee: {
        x: -0.13 - direction * launch * 0.06 - direction * push * 0.09,
        y: -0.14 - launch * 0.055 + land * 0.055
      },
      rightKnee: {
        x: 0.13 - direction * launch * 0.06 + direction * push * 0.09,
        y: -0.14 + launch * 0.025 + land * 0.055
      },
      leftAnkle: {
        x: -0.16 - direction * launch * 0.15 - direction * push * 0.13,
        y: -0.01 - launch * 0.09 + land * 0.045
      },
      rightAnkle: {
        x: 0.16 - direction * launch * 0.15 + direction * push * 0.13,
        y: -0.01 + launch * 0.025 + land * 0.045
      },
      absoluteLeftHand,
      absoluteRightHand,
      glove: "#f7ffd2",
      gloveScale: state.shot?.saveType === "CATCH" ? 1.78 : 1.68,
      saveMotion: state.shot?.saveType || null,
      recovery
    }
  };
}

function drawWallSprayLine() {
  if (state.currentStage.id !== "left20") return;
  const wall = activeWallLayout();
  const half = ((wall.players.length - 1) * wall.spacing) / 2 + 0.45;
  lineWorld(
    {
      x: wall.centre.x - wall.tangent.x * half,
      y: 0.025,
      z: wall.centre.z - wall.tangent.z * half
    },
    {
      x: wall.centre.x + wall.tangent.x * half,
      y: 0.025,
      z: wall.centre.z + wall.tangent.z * half
    },
    1.2,
    "rgba(245,250,243,.32)"
  );
}

function drawWall(time) {
  const progress = progressAt(time);
  const wall = activeWallLayout();
  const wallProfile = wallForStage(state.stage);
  const sorted = [...wall.players].sort((a, b) => b.z - a.z);
  const skinPalette = ["#c99774", "#9f6f52", "#d6a17a", "#7f543f", "#bd8461"];
  const hairPalette = ["#171713", "#211914", "#0e1210", "#30231b"];
  const heightPattern = [0.98, 1.025, 1.0, 1.04, 0.97, 1.015, 0.99];
  for (const player of sorted) {
    const hit = state.shot.outcome === "WALL" && state.shot.collision?.playerIndex === player.index;
    const variedPose = wallPose(progress, player.index, wall.players.length, hit);
    variedPose.headX = ((player.index % 3) - 1) * 0.012;
    variedPose.rotation = (variedPose.rotation || 0) + (player.index % 2 ? 0.012 : -0.01);
    drawArticulated(
      player,
      variedPose,
      {
        shirt: player.index % 2 ? wallProfile.secondary : wallProfile.accent,
        shorts: "#101a13",
        skin: skinPalette[player.index % skinPalette.length],
        hair: hairPalette[player.index % hairPalette.length]
      },
      wallProfile.playerHeight * heightPattern[player.index % heightPattern.length]
    );
  }
  window.__footballLabWallMotionV32 = {
    profile: wallProfile.id,
    reactive: true,
    jumping: Boolean(state.animation && progress.motionFlight > 0),
    hitPlayer: state.shot?.collision?.playerIndex ?? null
  };
}

function drawKeeperContactPulse(time) {
  if (!state.animation || state.shot?.outcome !== "SAVE" || !state.shot.keeperPlan) return;
  const progress = progressAt(time);
  const ratio = impactRatio();
  const window = clamp((progress.motionFlight - ratio) / 0.16, 0, 1);
  if (window <= 0 || window >= 1) return;
  const contact = projectWorld(state.shot.keeperPlan.contact, activeCamera, viewport);
  if (!contact.visible) return;
  ctx.save();
  ctx.strokeStyle = `rgba(218,254,77,${0.72 * (1 - window)})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(contact.x, contact.y, 6 + window * 20, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawKeeper(time) {
  const premiumSceneDraw = window.__footballLabPremiumKeeperSceneDrawV3852;
  if (typeof premiumSceneDraw === "function") {
    try {
      if (premiumSceneDraw(time)) return;
    } catch (error) {
      console.error("Football Lab V38.5.2 in-scene keeper failed; falling back to legacy rig", error);
    }
  }
  const progress = progressAt(time);
  const keeper = keeperState(progress, time);
  const keeperProfile = keeperForStage(state.stage);
  drawArticulated(
    keeper.world,
    keeper.pose,
    {
      shirt: keeperProfile.accent,
      shorts: keeperProfile.shorts,
      skin: "#c99774",
      arm: "#f5f7f1",
      shoe: "#07110b"
    },
    keeperProfile.visualHeight * 1.08
  );
  drawKeeperContactPulse(time);
  window.__footballLabKeeperMotionV32 = {
    profile: keeperProfile.id,
    motion: state.shot?.outcome === "SAVE" ? state.shot.saveType : state.animation ? "DIVE" : "READY",
    airborne: keeper.world.y > 0.02,
    recovering: Boolean(progress.settle > 0),
    outcome: state.shot?.outcome || null
  };
}

function drawKicker(time) {
  const progress = progressAt(time);
  const rawApproach = progress.replay ? 1 : clamp(progress.run / 0.84, 0, 1);
  const approach = progress.replay
    ? 1
    : rawApproach < 0.64
      ? smooth01(rawApproach / 0.64) * 0.5
      : 0.5 + smooth01((rawApproach - 0.64) / 0.36) * 0.5;
  const runPosition = state.animation ? easeInOutCubic(approach) : 0;
  const world = kickerWorld(state.currentStage, runPosition);
  if (state.animation && !progress.replay && progress.run < 0.84) {
    const extra = (1 - smooth01(progress.run / 0.84)) * 0.18;
    world.z += extra;
    world.x -= extra * 0.08;
  }
  const character = activeCharacter();
  const pose = kickerPose(progress, time);
  pose.number = character.number;
  drawArticulated(
    world,
    pose,
    {
      shirt: character.accent,
      shorts: "#111a14",
      skin: "#c99774",
      shoe: "#07110b"
    },
    1.82
  );
}

function targetWorld() {
  const target = currentAimTarget();
  return {
    x: -GOAL.halfWidth + target.x * GOAL.width,
    y: GOAL.height * (1 - target.y),
    z: 0.03
  };
}

function drawAimGuide() {
  if (state.phase !== "aim") return;
  const guideProgress = state.controlMode === "guided" ? 0.55 : state.controlMode === "expert" ? 0 : 0.32;
  if (guideProgress <= 0) return;
  const startWorld = ballWorld(state.currentStage);
  const finishWorld = targetWorld();
  const curve = clamp(state.shot?.previewCurve || 0, -1, 1);
  const guideWorld = {
    x: lerp(startWorld.x, finishWorld.x, guideProgress) + curve * 0.22,
    y: lerp(startWorld.y, finishWorld.y, guideProgress) + Math.sin(Math.PI * guideProgress) * 0.55,
    z: lerp(startWorld.z, finishWorld.z, guideProgress)
  };
  const start = projectWorld(startWorld, activeCamera, viewport);
  const end = projectWorld(guideWorld, activeCamera, viewport);
  if (!start.visible || !end.visible) return;
  ctx.save();
  ctx.strokeStyle = "rgba(218,254,77,.28)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 8]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(218,254,77,.5)";
  ctx.beginPath();
  ctx.arc(end.x, end.y, 2.4, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawTarget() {
  if (state.phase !== "aim") return;
  const projected = projectWorld(targetWorld(), activeCamera, viewport);
  if (!projected.visible) return;
  const radius = clamp(projected.scale * 0.2, 7, 11);
  const pulse = 1 + Math.sin(state.meterClock * 7) * 0.055;
  ctx.save();
  ctx.translate(projected.x, projected.y);
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = "rgba(218,254,77,.85)";
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-radius * 1.35, 0);
  ctx.lineTo(-radius * 0.72, 0);
  ctx.moveTo(radius * 0.72, 0);
  ctx.lineTo(radius * 1.35, 0);
  ctx.moveTo(0, -radius * 1.35);
  ctx.lineTo(0, -radius * 0.72);
  ctx.moveTo(0, radius * 0.72);
  ctx.lineTo(0, radius * 1.35);
  ctx.stroke();
  ctx.restore();
}

function drawContactBurst(time) {
  if (!state.animation || state.animation.isReplay) return;
  const progress = progressAt(time);
  const window = clamp(progress.flight / 0.065, 0, 1);
  if (window <= 0 || window >= 1) return;
  const ball = projectWorld(ballWorld(state.currentStage), activeCamera, viewport);
  if (!ball.visible) return;
  const strength = 1 - window;
  ctx.save();
  ctx.strokeStyle = `rgba(218,254,77,${0.7 * strength})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const angle = -0.8 + i * 0.38;
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(
      ball.x + Math.cos(angle) * (12 + window * 16),
      ball.y + Math.sin(angle) * (8 + window * 10)
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawBall(time, finishShot) {
  const progress = progressAt(time);
  let world = ballWorld(state.currentStage);
  let pathProgress = 0;

  if (state.animation) {
    if (progress.flight > 0 && !state.animation.impactPlayed) {
      state.animation.impactPlayed = true;
      playKickSound();
    }
    if (progress.flight > 0) {
      pathProgress = progress.motionFlight;
      world = sampleShotPath(state.shot.path, pathProgress) || world;
    }
    if (progress.complete) finishShot(state.animation.id);
  }

  const premiumKeeperFrame = window.__footballLabPremiumKeeperSceneFrameV3852;
  if (
    state.animation
    && state.shot?.outcome === "SAVE"
    && state.shot?.saveType === "CATCH"
    && premiumKeeperFrame
    && Math.abs(Number(premiumKeeperFrame.time) - Number(time)) < 0.5
    && pathProgress >= impactRatio()
    && premiumKeeperFrame.keeper?.pose?.catchBallWorld
  ) {
    const lock = smooth01((pathProgress - impactRatio()) / 0.055);
    const held = premiumKeeperFrame.keeper.pose.catchBallWorld;
    world = {
      x: lerp(world.x, held.x, lock),
      y: lerp(world.y, held.y, lock),
      z: lerp(world.z, held.z, lock)
    };
  }

  if (state.animation && pathProgress > 0.035) drawTrail(pathProgress);
  const projected = projectWorld(world, activeCamera, viewport);
  if (!projected.visible) return;
  const radius = clamp(projected.scale * 0.112, 4.8, 11.4);

  const contactImpact = state.animation && ["SAVE", "POST", "BAR"].includes(state.shot?.outcome)
    ? Math.max(0, 1 - Math.abs(pathProgress - impactRatio()) / 0.026)
    : 0;
  const squashX = 1 + contactImpact * 0.16;
  const squashY = 1 - contactImpact * 0.2;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(244,255,235,${0.1 + clamp((state.shot?.speedMps || 0) / 42, 0, 1) * 0.12})`;
  ctx.shadowColor = "rgba(218,254,77,.22)";
  ctx.shadowBlur = 7;
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, radius * 1.48, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(projected.x, projected.y + radius * 0.68, radius * 1.1, radius * 0.35, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  const gradient = ctx.createRadialGradient(
    projected.x - radius * 0.35,
    projected.y - radius * 0.4,
    1,
    projected.x,
    projected.y,
    radius
  );
  gradient.addColorStop(0, "#fff");
  gradient.addColorStop(1, "#c7d0c6");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(projected.x, projected.y, radius * squashX, radius * squashY, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgba(5,13,8,.72)";
  ctx.lineWidth = 1.05;
  ctx.stroke();

  ctx.fillStyle = "#172019";
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + i * TAU / 5 + pathProgress * 12;
    const px = projected.x + Math.cos(angle) * radius * 0.38 * squashX;
    const py = projected.y + Math.sin(angle) * radius * 0.38 * squashY;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawTrail(progress) {
  ctx.save();
  const speed = clamp((state.shot?.speedMps || 24) / 38, 0.55, 1.25);
  const curve = Math.abs(state.shot?.curve || 0);
  const trailCount = 12 + Math.round(speed * 7);
  const ribbon = [];
  for (let index = trailCount; index >= 1; index -= 1) {
    const world = sampleShotPath(state.shot.path, clamp(progress - index * (0.009 + speed * 0.0045), 0, 1));
    if (!world) continue;
    const projected = projectWorld(world, activeCamera, viewport);
    if (projected.visible) ribbon.push(projected);
  }
  if (ribbon.length > 1) {
    ctx.strokeStyle = `rgba(236,255,223,${0.12 + speed * 0.08})`;
    ctx.lineWidth = clamp(1.15 + speed * 0.72, 1.25, 2.2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(218,254,77,.2)";
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ribbon.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  for (let i = 1; i <= trailCount; i += 1) {
    const world = sampleShotPath(state.shot.path, clamp(progress - i * (0.009 + speed * 0.0045), 0, 1));
    if (!world) continue;
    const projected = projectWorld(world, activeCamera, viewport);
    if (!projected.visible) continue;
    ctx.fillStyle = `rgba(218,254,77,${(1 - i / (trailCount + 1)) * (0.15 + speed * 0.1)})`;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, clamp(projected.scale * 0.072, 2.1, 7), 0, TAU);
    ctx.fill();
    if (curve > 0.2 && i % 2 === 0) {
      ctx.strokeStyle = `rgba(239,255,220,${(1 - i / trailCount) * 0.16})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, clamp(projected.scale * 0.09, 3, 9), progress * TAU * 5 + i, progress * TAU * 5 + i + Math.PI * 0.9);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawShotImpactFx(time) {
  if (!state.animation || !state.shot?.path?.length) return;
  const outcome = state.shot.outcome;
  if (!["GOAL", "SAVE", "POST", "BAR", "WALL"].includes(outcome)) return;
  const progress = progressAt(time);
  const ratio = impactRatio();
  if (progress.motionFlight < ratio) return;
  const flightTail = clamp((progress.motionFlight - ratio) / Math.max(0.025, 1 - ratio), 0, 1);
  const age = progress.motionFlight < 0.999 ? flightTail * 0.24 : 0.24 + progress.settle * 0.76;
  if (age >= 1) return;

  const impactWorld = outcome === "SAVE" && state.shot.keeperPlan?.contact
    ? state.shot.keeperPlan.contact
    : Number.isInteger(state.shot.impactIndex)
      ? state.shot.path[state.shot.impactIndex]
      : state.shot.path[state.shot.path.length - 1];
  if (!impactWorld) return;
  const point = projectWorld(impactWorld, activeCamera, viewport);
  if (!point.visible) return;

  const palette = outcome === "SAVE" ? "156,225,255"
    : outcome === "GOAL" ? "218,254,77"
      : outcome === "POST" || outcome === "BAR" ? "255,235,177"
        : "244,247,240";
  const fade = Math.max(0, 1 - age);
  const radius = 9 + age * (outcome === "POST" || outcome === "BAR" ? 34 : 27);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 1.65);
  glow.addColorStop(0, "rgba(" + palette + "," + (0.27 * fade) + ")");
  glow.addColorStop(1, "rgba(" + palette + ",0)");
  ctx.fillStyle = glow;
  ctx.fillRect(point.x - radius * 2, point.y - radius * 2, radius * 4, radius * 4);
  ctx.strokeStyle = "rgba(" + palette + "," + (0.5 * fade) + ")";
  ctx.lineWidth = outcome === "SAVE" ? 1.7 : 1.35;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, TAU);
  ctx.stroke();

  const particleCount = outcome === "POST" || outcome === "BAR" ? 9 : outcome === "SAVE" ? 6 : 4;
  for (let index = 0; index < particleCount; index += 1) {
    const angle = -2.7 + index * (TAU / particleCount) + age * 0.38;
    const distance = 8 + age * (18 + (index % 3) * 5);
    const length = 4 + (index % 3) * 2.5;
    ctx.strokeStyle = "rgba(" + palette + "," + (fade * (0.2 + (index % 2) * 0.12)) + ")";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(point.x + Math.cos(angle) * distance, point.y + Math.sin(angle) * distance);
    ctx.lineTo(point.x + Math.cos(angle) * (distance + length), point.y + Math.sin(angle) * (distance + length));
    ctx.stroke();
  }
  ctx.restore();
}

export function drawScene(time, finishShot) {
  activeCamera = cameraForFrame(time);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
  applyTransform();
  applyCameraFeedback(time);
  drawBackground();
  drawPitch();
  drawGoal(time);
  drawSupportingPlayers();
  drawKeeper(time);
  drawWallSprayLine();
  drawWall(time);
  drawAimGuide();
  drawTarget();
  window.__footballLabBaseKickerSuppressedV30 = true;
  // All four specialists are rendered by the unified premium rig after the base scene.
  // Keeping the legacy rig available but suppressed avoids duplicate players.

  drawContactBurst(time);
  drawBall(time, finishShot);
  drawShotImpactFx(time);
}

window.__footballLabBallImpactV386 = Object.freeze({ build: "38.6.0", readableBall: true, continuousCurlRibbon: true, persistentNetRipple: true, impactFx: true, physicsChanged: false, outcomeChanged: false });
