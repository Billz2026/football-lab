import {
  clamp, lerp, WORLD, state, elements, ctx, canvasView,
  currentAimTarget, easeInOutCubic, easeOutCubic
} from "./core-v6.js?v=31";
import {
  GOAL, PITCH, buildCamera, ballWorld, buildWall, keeperWorld,
  kickerWorld, supportingPlayers
} from "./world-v7.js?v=31";
import { projectWorld, projectSegment, projectedHeight } from "./projection-v6.js?v=31";
import { sampleShotPath } from "./physics-v7.js?v=7";
import { playKickSound } from "./audio-v6.js?v=7";

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

function progressAt(time) {
  if (!state.animation) return { run: 0, flight: 0, complete: false, replay: false };
  const elapsed = time - state.animation.startedAt;
  return {
    run: clamp(elapsed / Math.max(1, state.animation.runUpDuration), 0, 1),
    flight: clamp((elapsed - state.animation.runUpDuration) / Math.max(1, state.animation.flightDuration), 0, 1),
    complete: elapsed >= state.animation.totalDuration,
    replay: Boolean(state.animation.isReplay)
  };
}

function cameraForFrame(time) {
  const camera = buildCamera(state.currentStage);
  const progress = progressAt(time);
  if (state.animation && progress.flight > 0) {
    const follow = easeOutCubic(progress.flight) * 0.42;
    camera.position.z -= follow;
    camera.position.y -= follow * 0.05;
    camera.target.y += follow * 0.06;
  }
  return camera;
}

function applyCameraFeedback(time) {
  if (!state.animation || state.animation.isReplay) return;
  const progress = progressAt(time);
  const contact = clamp((progress.flight - 0.005) / 0.085, 0, 1);
  if (contact <= 0 || contact >= 1) return;
  const strength = Math.sin(contact * Math.PI) * 2.2;
  ctx.translate(Math.sin(time * 0.13) * strength, Math.cos(time * 0.17) * strength * 0.5);
}

function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function pulse01(value) {
  return Math.sin(clamp(value, 0, 1) * Math.PI);
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

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, 360);
  sky.addColorStop(0, "#06150f");
  sky.addColorStop(0.72, "#0a281a");
  sky.addColorStop(1, "#12321f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  const stand = ctx.createLinearGradient(0, 112, 0, 350);
  stand.addColorStop(0, "rgba(1,4,2,.92)");
  stand.addColorStop(1, "rgba(5,12,8,.7)");
  ctx.fillStyle = stand;
  ctx.fillRect(0, 112, WORLD.width, 244);

  for (let row = 0; row < 5; row += 1) {
    for (let x = 10 + row * 13; x < WORLD.width; x += 22) {
      const alpha = 0.065 + ((x + row * 23) % 70) / 1100;
      ctx.fillStyle = `rgba(228,255,205,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, 150 + row * 37 + Math.sin(x * 0.1) * 2, 3, 0, TAU);
      ctx.fill();
    }
  }

  const glow = ctx.createRadialGradient(610, 190, 0, 610, 190, 470);
  glow.addColorStop(0, "rgba(218,254,77,.11)");
  glow.addColorStop(1, "rgba(218,254,77,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(80, 0, 1050, 430);
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
  const ripple = state.animation && state.shot.outcome === "GOAL" && progress.flight > 0.88
    ? Math.sin(clamp((progress.flight - 0.88) / 0.12, 0, 1) * Math.PI) * 0.2
    : 0;

  lineWorld({ x: left, y: 0, z: 0 }, { x: left, y: GOAL.height, z: 0 }, 3.4, frame);
  lineWorld({ x: right, y: 0, z: 0 }, { x: right, y: GOAL.height, z: 0 }, 3.4, frame);
  lineWorld({ x: left, y: GOAL.height, z: 0 }, { x: right, y: GOAL.height, z: 0 }, 3.4, frame);
  lineWorld({ x: left, y: GOAL.height, z: 0 }, { x: left, y: GOAL.height, z: backZ }, 1.7, frame);
  lineWorld({ x: right, y: GOAL.height, z: 0 }, { x: right, y: GOAL.height, z: backZ }, 1.7, frame);
  lineWorld({ x: left, y: GOAL.height, z: backZ }, { x: right, y: GOAL.height, z: backZ }, 1.7, frame);

  for (let i = 0; i <= 10; i += 1) {
    const x = lerp(left, right, i / 10);
    lineWorld({ x, y: 0.04, z: backZ - ripple }, { x, y: GOAL.height, z: 0 }, 0.75, net);
  }
  for (let i = 1; i < 7; i += 1) {
    const y = (GOAL.height * i) / 7;
    lineWorld({ x: left, y, z: 0 }, { x: right, y, z: backZ - ripple }, 0.75, net);
  }
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

  ctx.save();
  ctx.translate(foot.x, foot.y - (pose.lift || 0) * h);
  ctx.rotate(pose.rotation || 0);
  ctx.globalAlpha = pose.alpha ?? 1;

  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(0, 3 + (pose.lift || 0) * h, h * 0.15, h * 0.038, 0, 0, TAU);
  ctx.fill();

  const crouch = pose.crouch || 0;
  const pelvis = screenPoint((pose.pelvisX || 0) * h, -0.31 * h + crouch * h * 0.1);
  const chest = screenPoint((pose.chestX || 0) * h, -0.66 * h + crouch * h * 0.12);
  const head = screenPoint(chest.x + (pose.headX || 0) * h, -0.91 * h + crouch * h * 0.1);
  const shoulderHalf = h * 0.13;
  const hipHalf = h * 0.075;
  const leftShoulder = screenPoint(chest.x - shoulderHalf, chest.y + h * 0.015);
  const rightShoulder = screenPoint(chest.x + shoulderHalf, chest.y + h * 0.015);
  const leftHip = screenPoint(pelvis.x - hipHalf, pelvis.y);
  const rightHip = screenPoint(pelvis.x + hipHalf, pelvis.y);

  const p = (value, fallback) => value
    ? screenPoint(value.x * h, value.y * h)
    : fallback;

  const leftKnee = p(pose.leftKnee, screenPoint(-0.11 * h, -0.15 * h));
  const rightKnee = p(pose.rightKnee, screenPoint(0.11 * h, -0.15 * h));
  const leftAnkle = p(pose.leftAnkle, screenPoint(-0.13 * h, -0.01 * h));
  const rightAnkle = p(pose.rightAnkle, screenPoint(0.13 * h, -0.01 * h));
  const leftToe = p(pose.leftToe, screenPoint(leftAnkle.x - 0.045 * h, leftAnkle.y + 0.005 * h));
  const rightToe = p(pose.rightToe, screenPoint(rightAnkle.x + 0.045 * h, rightAnkle.y + 0.005 * h));
  const leftElbow = p(pose.leftElbow, screenPoint(-0.22 * h, -0.55 * h));
  const rightElbow = p(pose.rightElbow, screenPoint(0.22 * h, -0.55 * h));
  const leftHand = p(pose.leftHand, screenPoint(-0.27 * h, -0.42 * h));
  const rightHand = p(pose.rightHand, screenPoint(0.27 * h, -0.42 * h));

  const legWidth = Math.max(4, h * 0.052);
  drawSegment(leftHip, leftKnee, legWidth, shorts);
  drawSegment(leftKnee, leftAnkle, legWidth * 0.86, shorts);
  drawSegment(rightHip, rightKnee, legWidth, shorts);
  drawSegment(rightKnee, rightAnkle, legWidth * 0.86, shorts);
  drawSegment(leftAnkle, leftToe, legWidth * 0.92, shoe);
  drawSegment(rightAnkle, rightToe, legWidth * 0.92, shoe);

  ctx.save();
  ctx.translate((chest.x + pelvis.x) / 2, (chest.y + pelvis.y) / 2);
  ctx.rotate(pose.torsoLean || 0);
  ctx.fillStyle = "rgba(2,7,4,.8)";
  roundedRect(-h * 0.15, -h * 0.205, h * 0.3, h * 0.41, h * 0.07);
  ctx.fill();
  ctx.fillStyle = shirt;
  roundedRect(-h * 0.135, -h * 0.19, h * 0.27, h * 0.38, h * 0.06);
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
  drawSegment(leftShoulder, leftElbow, armWidth, arm);
  drawSegment(leftElbow, leftHand, armWidth * 0.88, arm);
  drawSegment(rightShoulder, rightElbow, armWidth, arm);
  drawSegment(rightElbow, rightHand, armWidth * 0.88, arm);
  drawJoint(leftHand, armWidth * 0.58, pose.glove || skin);
  drawJoint(rightHand, armWidth * 0.58, pose.glove || skin);
  drawJoint(head, h * 0.073, skin);

  ctx.restore();
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
    return {
      number: 10,
      torsoLean: -0.11,
      leftKnee: { x: -0.1, y: -0.14 },
      leftAnkle: { x: -0.15, y: -0.005 },
      rightKnee: { x: 0.18, y: -0.29 },
      rightAnkle: { x: 0.28, y: -0.17 },
      rightToe: { x: 0.35, y: -0.14 },
      leftHand: { x: -0.31, y: -0.47 },
      rightHand: { x: 0.34, y: -0.56 }
    };
  }

  const run = progress.run;
  if (run < 0.56) {
    const stride = Math.sin(run * Math.PI * 4.4);
    return {
      number: 10,
      crouch: 0.03 + Math.abs(stride) * 0.02,
      torsoLean: -0.04 - run * 0.08,
      leftKnee: { x: -0.1 - stride * 0.055, y: -0.15 - Math.max(0, stride) * 0.07 },
      rightKnee: { x: 0.1 + stride * 0.055, y: -0.15 - Math.max(0, -stride) * 0.07 },
      leftAnkle: { x: -0.13 - stride * 0.075, y: -0.005 - Math.max(0, stride) * 0.02 },
      rightAnkle: { x: 0.13 + stride * 0.075, y: -0.005 - Math.max(0, -stride) * 0.02 },
      leftHand: { x: -0.25 + stride * 0.055, y: -0.44 - stride * 0.03 },
      rightHand: { x: 0.25 + stride * 0.055, y: -0.44 + stride * 0.03 }
    };
  }

  if (run < 0.82) {
    const plant = smooth01((run - 0.56) / 0.26);
    return {
      number: 10,
      crouch: lerp(0.04, 0.09, plant),
      torsoLean: lerp(-0.08, -0.18, plant),
      chestX: lerp(0.01, -0.025, plant),
      leftKnee: { x: lerp(-0.1, -0.17, plant), y: lerp(-0.15, -0.13, plant) },
      leftAnkle: { x: lerp(-0.13, -0.23, plant), y: -0.005 },
      leftToe: { x: lerp(-0.17, -0.28, plant), y: -0.002 },
      rightKnee: { x: lerp(0.1, 0.19, plant), y: lerp(-0.15, -0.29, plant) },
      rightAnkle: { x: lerp(0.13, 0.22, plant), y: lerp(-0.005, -0.18, plant) },
      rightToe: { x: lerp(0.18, 0.28, plant), y: lerp(0, -0.16, plant) },
      leftHand: { x: lerp(-0.25, -0.33, plant), y: lerp(-0.44, -0.49, plant) },
      rightHand: { x: lerp(0.25, 0.31, plant), y: lerp(-0.44, -0.58, plant) }
    };
  }

  const strike = smooth01((run - 0.82) / 0.18);
  return {
    number: 10,
    crouch: lerp(0.09, 0.035, strike),
    torsoLean: lerp(-0.18, 0.055, strike),
    rotation: lerp(-0.035, 0.055, strike),
    leftKnee: { x: -0.17, y: -0.13 },
    leftAnkle: { x: -0.23, y: -0.005 },
    leftToe: { x: -0.29, y: -0.002 },
    rightKnee: { x: lerp(0.19, 0.07, strike), y: lerp(-0.29, -0.22, strike) },
    rightAnkle: { x: lerp(0.22, -0.01, strike), y: lerp(-0.18, -0.24, strike) },
    rightToe: { x: lerp(0.28, -0.09, strike), y: lerp(-0.16, -0.22, strike) },
    leftHand: { x: lerp(-0.33, -0.28, strike), y: lerp(-0.49, -0.4, strike) },
    rightHand: { x: lerp(0.31, 0.38, strike), y: lerp(-0.58, -0.46, strike) }
  };
}

function wallPose(progress, index, hit) {
  if (!state.animation) {
    return {
      crouch: 0.025,
      leftHand: { x: -0.1, y: -0.42 },
      rightHand: { x: 0.1, y: -0.42 }
    };
  }

  const anticipation = smooth01(clamp((progress.flight - 0.05) / 0.18, 0, 1));
  const jump = pulse01((progress.flight - 0.22) / 0.34);
  const landing = pulse01((progress.flight - 0.55) / 0.24);
  const stagger = (index - 2) * 0.008;
  const hitReact = hit ? pulse01((progress.flight - 0.56) / 0.28) : 0;
  return {
    crouch: 0.03 + anticipation * 0.09 + landing * 0.05,
    lift: Math.max(0, jump) * (0.055 + stagger),
    rotation: hitReact * 0.11,
    chestX: hitReact * 0.035,
    leftKnee: { x: -0.1, y: -0.15 + landing * 0.025 },
    rightKnee: { x: 0.1, y: -0.15 + landing * 0.025 },
    leftHand: { x: -0.09, y: -0.42 + anticipation * 0.035 },
    rightHand: { x: 0.09, y: -0.42 + anticipation * 0.035 }
  };
}

function keeperState(progress, time) {
  const idle = keeperWorld(state.currentStage);
  const plan = state.shot?.keeperPlan;
  if (!state.animation || !plan) {
    const shift = Math.sin(time / 620) * 0.16;
    return {
      world: { ...idle, x: idle.x + shift },
      pose: {
        crouch: 0.09 + Math.sin(time / 420) * 0.012,
        leftKnee: { x: -0.13, y: -0.13 },
        rightKnee: { x: 0.13, y: -0.13 },
        leftHand: { x: -0.31, y: -0.55 },
        rightHand: { x: 0.31, y: -0.55 },
        glove: "#f7ffd2"
      }
    };
  }

  const reactionFraction = clamp(plan.reaction / Math.max(0.01, plan.flightSeconds), 0.08, 0.72);
  const coil = smooth01(clamp((progress.flight - Math.max(0, reactionFraction - 0.12)) / 0.12, 0, 1));
  const dive = easeOutCubic(clamp((progress.flight - reactionFraction) / Math.max(0.1, 0.92 - reactionFraction), 0, 1));
  const land = smooth01(clamp((progress.flight - 0.88) / 0.12, 0, 1));
  const direction = Math.sign(plan.contact.x - idle.x || 1);
  const world = {
    x: lerp(idle.x, plan.contact.x, dive),
    y: Math.sin(dive * Math.PI) * 0.26 * (1 - land * 0.7),
    z: lerp(idle.z, plan.contact.z, dive)
  };

  const reachY = clamp((plan.contact.y - 1.1) / 1.4, -0.8, 0.8);
  return {
    world,
    pose: {
      crouch: 0.08 + coil * 0.12 + land * 0.08,
      rotation: direction * dive * 0.72,
      torsoLean: direction * dive * 0.08,
      chestX: direction * dive * 0.03,
      leftKnee: { x: -0.13 - direction * dive * 0.05, y: -0.14 - dive * 0.05 },
      rightKnee: { x: 0.13 - direction * dive * 0.05, y: -0.14 + dive * 0.02 },
      leftAnkle: { x: -0.16 - direction * dive * 0.12, y: -0.01 - dive * 0.08 },
      rightAnkle: { x: 0.16 - direction * dive * 0.12, y: -0.01 + dive * 0.02 },
      leftHand: {
        x: direction > 0 ? lerp(-0.3, 0.33, dive) : lerp(-0.3, -0.5, dive),
        y: lerp(-0.54, -0.58 - reachY * 0.24, dive)
      },
      rightHand: {
        x: direction > 0 ? lerp(0.3, 0.5, dive) : lerp(0.3, -0.33, dive),
        y: lerp(-0.54, -0.58 - reachY * 0.24, dive)
      },
      glove: "#f7ffd2"
    }
  };
}

function drawWallSprayLine() {
  if (state.currentStage.id !== "left20") return;
  const wall = buildWall(state.currentStage);
  const half = ((wall.players.length - 1) * 0.58) / 2 + 0.45;
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
  const wall = buildWall(state.currentStage);
  const sorted = [...wall.players].sort((a, b) => b.z - a.z);
  for (const player of sorted) {
    const hit = state.shot.outcome === "WALL" && state.shot.collision?.playerIndex === player.index;
    drawArticulated(
      player,
      wallPose(progress, player.index, hit),
      {
        shirt: player.index % 2 ? "#294337" : "#355044",
        shorts: "#101a13",
        skin: "#c99774"
      },
      1.84
    );
  }
}

function drawKeeper(time) {
  const progress = progressAt(time);
  const keeper = keeperState(progress, time);
  drawArticulated(
    keeper.world,
    keeper.pose,
    {
      shirt: "#dafe4d",
      shorts: "#16231b",
      skin: "#c99774",
      arm: "#f5f7f1",
      shoe: "#07110b"
    },
    1.9
  );
}

function drawKicker(time) {
  const progress = progressAt(time);
  const runPosition = state.animation
    ? (progress.replay ? 1 : easeInOutCubic(progress.run))
    : 0;
  drawArticulated(
    kickerWorld(state.currentStage, runPosition),
    kickerPose(progress, time),
    {
      shirt: "#dafe4d",
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
  const start = projectWorld(ballWorld(state.currentStage), activeCamera, viewport);
  const end = projectWorld(targetWorld(), activeCamera, viewport);
  if (!start.visible || !end.visible) return;
  ctx.save();
  ctx.strokeStyle = "rgba(218,254,77,.13)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 8]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
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
  const window = clamp((progress.flight - 0.005) / 0.07, 0, 1);
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
    if (progress.run >= 0.92 && !state.animation.impactPlayed) {
      state.animation.impactPlayed = true;
      playKickSound();
    }
    if (progress.flight > 0) {
      pathProgress = easeOutCubic(progress.flight);
      world = sampleShotPath(state.shot.path, pathProgress) || world;
    }
    if (progress.complete) finishShot(state.animation.id);
  }

  if (state.animation && pathProgress > 0.05) drawTrail(pathProgress);
  const projected = projectWorld(world, activeCamera, viewport);
  if (!projected.visible) return;
  const radius = clamp(projected.scale * 0.1, 3, 9.6);

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
  ctx.arc(projected.x, projected.y, radius, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "#172019";
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + i * TAU / 5 + pathProgress * 12;
    const px = projected.x + Math.cos(angle) * radius * 0.38;
    const py = projected.y + Math.sin(angle) * radius * 0.38;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawTrail(progress) {
  ctx.save();
  for (let i = 1; i <= 6; i += 1) {
    const world = sampleShotPath(state.shot.path, clamp(progress - i * 0.022, 0, 1));
    if (!world) continue;
    const projected = projectWorld(world, activeCamera, viewport);
    if (!projected.visible) continue;
    ctx.fillStyle = `rgba(218,254,77,${(1 - i / 7) * 0.11})`;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, clamp(projected.scale * 0.055, 1.5, 5.5), 0, TAU);
    ctx.fill();
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
  drawKicker(time);
  drawContactBurst(time);
  drawBall(time, finishShot);
}
