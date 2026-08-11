import {
  clamp, lerp, WORLD, state, ctx, canvasView, easeInOutCubic, easeOutCubic
} from "./core-v6.js?v=32.2";
import { buildCamera, kickerWorld } from "./world-v7.js?v=32.2";
import { projectedHeight } from "./projection-v6.js?v=32.2";
import { activeCharacter } from "./characters-v13.js?v=32.2";

const viewport = { width: WORLD.width, height: WORLD.height };
const TAU = Math.PI * 2;

function applyWorldTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function replayPathProgress(value) {
  const t = clamp(value, 0, 1);
  if (t < 0.67) return easeOutCubic(t / 0.67) * 0.82;
  return 0.82 + smooth01((t - 0.67) / 0.33) * 0.18;
}

function progressAt(time) {
  if (!state.animation) {
    return { elapsed: 0, run: 0, contact: 0, flight: 0, motionFlight: 0, settle: 0, replay: false };
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
    replay
  };
}

function cameraForFrame(time) {
  const camera = buildCamera(state.currentStage);
  const progress = progressAt(time);
  if (state.animation && progress.motionFlight > 0) {
    const follow = easeOutCubic(progress.motionFlight) * 0.42;
    camera.position.z -= follow;
    camera.position.y -= follow * 0.05;
    camera.target.y += follow * 0.06;
  }
  return camera;
}

function impactPose() {
  return {
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
      ...impactPose(),
      torsoLean: lerp(-0.055, 0.08, follow),
      rotation: lerp(0.018, 0.075, follow),
      rightKnee: { x: lerp(0.08, -0.02, follow), y: lerp(-0.225, -0.29, follow) },
      rightAnkle: { x: lerp(-0.015, -0.2, follow), y: lerp(-0.245, -0.32, follow) },
      rightToe: { x: lerp(-0.095, -0.3, follow), y: lerp(-0.218, -0.29, follow) }
    };
  }

  if (progress.contact > 0 && progress.flight <= 0) return impactPose();

  if (progress.flight > 0 || progress.settle > 0) {
    const follow = smooth01(clamp(progress.flight / 0.17, 0, 1));
    const recover = smooth01(clamp((progress.flight - 0.32) / 0.42, 0, 1));
    const settle = progress.settle;
    return {
      crouch: lerp(lerp(0.055, 0.025, follow), 0.04, Math.max(recover, settle)),
      torsoLean: lerp(lerp(-0.055, 0.09, follow), 0.005, Math.max(recover, settle)),
      rotation: lerp(lerp(0.018, 0.08, follow), 0.01, Math.max(recover, settle)),
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
      crouch: 0.025 + lift,
      pelvisX: stride * 0.012,
      chestX: stride * 0.018,
      torsoLean: -0.045 - run * 0.09,
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
      crouch: lerp(0.04, 0.095, plant),
      torsoLean: lerp(-0.09, -0.19, plant),
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
  const impact = impactPose();
  return {
    crouch: lerp(0.095, impact.crouch, strike),
    torsoLean: lerp(-0.19, impact.torsoLean, strike),
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

function point(x, y) {
  return { x, y };
}

function mixPoint(a, b, t) {
  return point(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
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

function drawSegment(a, b, width, colour, outline = "rgba(2,7,4,.92)") {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = outline;
  ctx.lineWidth = width + Math.max(1.8, width * 0.42);
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

function drawJoint(p, radius, colour, outline = "rgba(2,7,4,.9)") {
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius + Math.max(1.2, radius * 0.32), 0, TAU);
  ctx.fill();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, TAU);
  ctx.fill();
}

function drawBoot(ankle, toe, width, primary, accent) {
  const dx = toe.x - ankle.x;
  const dy = toe.y - ankle.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const heel = mixPoint(ankle, toe, 0.1);
  const front = mixPoint(ankle, toe, 1.08);
  const half = width * 0.48;
  ctx.fillStyle = "rgba(2,7,4,.94)";
  ctx.beginPath();
  ctx.moveTo(heel.x + nx * (half + 1.6), heel.y + ny * (half + 1.6));
  ctx.lineTo(front.x + nx * (half * 0.72 + 1.6), front.y + ny * (half * 0.72 + 1.6));
  ctx.lineTo(front.x - nx * (half * 0.72 + 1.6), front.y - ny * (half * 0.72 + 1.6));
  ctx.lineTo(heel.x - nx * (half + 1.6), heel.y - ny * (half + 1.6));
  ctx.closePath();
  ctx.fill();

  const gradient = ctx.createLinearGradient(heel.x, heel.y, front.x, front.y);
  gradient.addColorStop(0, primary);
  gradient.addColorStop(0.72, "#dce5df");
  gradient.addColorStop(1, primary);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(heel.x + nx * half, heel.y + ny * half);
  ctx.lineTo(front.x + nx * half * 0.72, front.y + ny * half * 0.72);
  ctx.lineTo(front.x - nx * half * 0.72, front.y - ny * half * 0.72);
  ctx.lineTo(heel.x - nx * half, heel.y - ny * half);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1.2, width * 0.13);
  ctx.beginPath();
  ctx.moveTo(heel.x - nx * half * 0.72, heel.y - ny * half * 0.72);
  ctx.lineTo(front.x - nx * half * 0.55, front.y - ny * half * 0.55);
  ctx.stroke();
}

function drawHero(world, pose, time, character) {
  const camera = cameraForFrame(time);
  const projection = projectedHeight(world, 1.86, camera, viewport);
  if (!projection) return;
  const { foot, height: h } = projection;
  const rotation = pose.rotation || 0;
  const crouch = pose.crouch || 0;
  const liftPixels = (pose.lift || 0) * h;

  const skin = "#9b6749";
  const skinLight = "#b77a57";
  const skinShadow = "#71452f";
  const shirt = character.accent;
  const shirtDark = "#78951f";
  const trim = "#f2f7e8";
  const shorts = "#111722";
  const sock = "#17202c";
  const boot = "#f3f7f0";
  const hair = "#101712";

  ctx.save();
  ctx.translate(foot.x, foot.y - liftPixels);
  ctx.rotate(rotation);

  const pelvis = point((pose.pelvisX || 0) * h, -0.335 * h + crouch * h * 0.09);
  const chest = point((pose.chestX || 0) * h, -0.635 * h + crouch * h * 0.1);
  const headRadius = h * 0.071;
  const neckBase = point(chest.x + (pose.headX || 0) * h * 0.2, chest.y - h * 0.025);
  const head = point(neckBase.x + (pose.headX || 0) * h * 0.8, neckBase.y - h * 0.12);
  const shoulderHalf = h * 0.122;
  const hipHalf = h * 0.072;
  const leftShoulder = point(chest.x - shoulderHalf, chest.y + h * 0.015);
  const rightShoulder = point(chest.x + shoulderHalf, chest.y + h * 0.015);
  const leftHip = point(pelvis.x - hipHalf, pelvis.y);
  const rightHip = point(pelvis.x + hipHalf, pelvis.y);
  const p = (value, fallback) => value ? point(value.x * h, value.y * h) : fallback;

  const leftKnee = p(pose.leftKnee, point(-0.11 * h, -0.15 * h));
  const rightKnee = p(pose.rightKnee, point(0.11 * h, -0.15 * h));
  const leftAnkle = p(pose.leftAnkle, point(-0.13 * h, -0.01 * h));
  const rightAnkle = p(pose.rightAnkle, point(0.13 * h, -0.01 * h));
  const leftToe = p(pose.leftToe, point(leftAnkle.x - 0.045 * h, leftAnkle.y + 0.005 * h));
  const rightToe = p(pose.rightToe, point(rightAnkle.x + 0.045 * h, rightAnkle.y + 0.005 * h));
  const leftHand = p(pose.leftHand, point(-0.27 * h, -0.42 * h));
  const rightHand = p(pose.rightHand, point(0.27 * h, -0.42 * h));
  const leftElbow = p(pose.leftElbow, point(-0.22 * h, -0.55 * h));
  const rightElbow = p(pose.rightElbow, point(0.22 * h, -0.55 * h));

  ctx.fillStyle = "rgba(0,0,0,.19)";
  ctx.beginPath();
  ctx.ellipse(0, 4 + liftPixels, h * 0.17, h * 0.042, 0, 0, TAU);
  ctx.fill();

  const thighWidth = Math.max(5, h * 0.062);
  const shinWidth = Math.max(4.4, h * 0.051);
  const leftShortEnd = mixPoint(leftHip, leftKnee, 0.48);
  const rightShortEnd = mixPoint(rightHip, rightKnee, 0.48);
  const leftSockTop = mixPoint(leftKnee, leftAnkle, 0.26);
  const rightSockTop = mixPoint(rightKnee, rightAnkle, 0.26);

  drawSegment(leftHip, leftShortEnd, thighWidth, shorts);
  drawSegment(leftShortEnd, leftKnee, thighWidth * 0.88, skin);
  drawSegment(rightHip, rightShortEnd, thighWidth, shorts);
  drawSegment(rightShortEnd, rightKnee, thighWidth * 0.88, skin);
  drawSegment(leftKnee, leftSockTop, shinWidth * 0.92, skin);
  drawSegment(leftSockTop, leftAnkle, shinWidth, sock);
  drawSegment(rightKnee, rightSockTop, shinWidth * 0.92, skin);
  drawSegment(rightSockTop, rightAnkle, shinWidth, sock);

  ctx.strokeStyle = shirt;
  ctx.lineWidth = Math.max(1.5, h * 0.014);
  for (const sockTop of [leftSockTop, rightSockTop]) {
    ctx.beginPath();
    ctx.moveTo(sockTop.x - h * 0.027, sockTop.y);
    ctx.lineTo(sockTop.x + h * 0.027, sockTop.y);
    ctx.stroke();
  }
  drawBoot(leftAnkle, leftToe, thighWidth * 0.92, boot, shirt);
  drawBoot(rightAnkle, rightToe, thighWidth * 0.92, boot, shirt);

  ctx.save();
  ctx.translate(pelvis.x, pelvis.y - h * 0.018);
  ctx.fillStyle = "rgba(2,7,4,.92)";
  roundedRect(-h * 0.105, -h * 0.075, h * 0.21, h * 0.15, h * 0.035);
  ctx.fill();
  const shortGradient = ctx.createLinearGradient(-h * 0.1, 0, h * 0.1, 0);
  shortGradient.addColorStop(0, "#0d121b");
  shortGradient.addColorStop(0.55, shorts);
  shortGradient.addColorStop(1, "#202a37");
  ctx.fillStyle = shortGradient;
  roundedRect(-h * 0.094, -h * 0.067, h * 0.188, h * 0.134, h * 0.03);
  ctx.fill();
  ctx.fillStyle = shirt;
  ctx.fillRect(-h * 0.008, -h * 0.064, h * 0.016, h * 0.125);
  ctx.restore();

  ctx.save();
  ctx.translate((chest.x + pelvis.x) / 2, (chest.y + pelvis.y) / 2);
  ctx.rotate(pose.torsoLean || 0);
  ctx.fillStyle = "rgba(2,7,4,.94)";
  roundedRect(-h * 0.136, -h * 0.186, h * 0.272, h * 0.372, h * 0.06);
  ctx.fill();

  const jersey = ctx.createLinearGradient(-h * 0.12, -h * 0.17, h * 0.12, h * 0.17);
  jersey.addColorStop(0, shirtDark);
  jersey.addColorStop(0.38, shirt);
  jersey.addColorStop(0.68, "#e4ff62");
  jersey.addColorStop(1, shirtDark);
  ctx.fillStyle = jersey;
  roundedRect(-h * 0.123, -h * 0.173, h * 0.246, h * 0.346, h * 0.052);
  ctx.fill();

  ctx.fillStyle = "rgba(8,20,13,.38)";
  roundedRect(-h * 0.123, -h * 0.173, h * 0.033, h * 0.346, h * 0.025);
  ctx.fill();
  roundedRect(h * 0.09, -h * 0.173, h * 0.033, h * 0.346, h * 0.025);
  ctx.fill();

  ctx.strokeStyle = trim;
  ctx.lineWidth = Math.max(1.3, h * 0.012);
  ctx.beginPath();
  ctx.arc(0, -h * 0.158, h * 0.039, 0.12 * Math.PI, 0.88 * Math.PI);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,.34)";
  ctx.lineWidth = Math.max(1, h * 0.007);
  ctx.beginPath();
  ctx.moveTo(-h * 0.075, -h * 0.13);
  ctx.lineTo(-h * 0.094, h * 0.12);
  ctx.moveTo(h * 0.075, -h * 0.13);
  ctx.lineTo(h * 0.094, h * 0.12);
  ctx.stroke();

  const lastName = character.name.split(" ").at(-1) || "PLAYER";
  ctx.fillStyle = "#0a120d";
  ctx.font = `900 ${Math.max(5.8, h * 0.043)}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(lastName.slice(0, 10), 0, -h * 0.072);
  ctx.font = `1000 ${Math.max(10, h * 0.112)}px system-ui`;
  ctx.fillText(String(character.number), 0, h * 0.035);

  ctx.fillStyle = "rgba(255,255,255,.24)";
  roundedRect(-h * 0.052, h * 0.105, h * 0.104, h * 0.011, h * 0.005);
  ctx.fill();
  ctx.restore();

  const armWidth = Math.max(4.4, h * 0.049);
  const leftSleeveEnd = mixPoint(leftShoulder, leftElbow, 0.34);
  const rightSleeveEnd = mixPoint(rightShoulder, rightElbow, 0.34);
  drawJoint(leftShoulder, armWidth * 0.7, shirt);
  drawJoint(rightShoulder, armWidth * 0.7, shirt);
  drawSegment(leftShoulder, leftSleeveEnd, armWidth * 1.05, shirt);
  drawSegment(rightShoulder, rightSleeveEnd, armWidth * 1.05, shirt);
  drawSegment(leftSleeveEnd, leftElbow, armWidth * 0.88, skin);
  drawSegment(leftElbow, leftHand, armWidth * 0.78, skin);
  drawSegment(rightSleeveEnd, rightElbow, armWidth * 0.88, skin);
  drawSegment(rightElbow, rightHand, armWidth * 0.78, skin);

  ctx.strokeStyle = trim;
  ctx.lineWidth = Math.max(1.1, h * 0.009);
  for (const cuff of [leftSleeveEnd, rightSleeveEnd]) {
    ctx.beginPath();
    ctx.arc(cuff.x, cuff.y, armWidth * 0.54, 0, TAU);
    ctx.stroke();
  }

  const wristLeft = mixPoint(leftElbow, leftHand, 0.78);
  ctx.strokeStyle = trim;
  ctx.lineWidth = Math.max(1.2, h * 0.012);
  ctx.beginPath();
  ctx.moveTo(wristLeft.x - h * 0.017, wristLeft.y);
  ctx.lineTo(wristLeft.x + h * 0.017, wristLeft.y);
  ctx.stroke();
  drawJoint(leftHand, armWidth * 0.44, skinLight);
  drawJoint(rightHand, armWidth * 0.44, skinLight);

  const neckTop = point(head.x, head.y + headRadius * 0.72);
  drawSegment(neckBase, neckTop, Math.max(3.6, h * 0.052), skinShadow, "rgba(2,7,4,.9)");
  drawJoint(point(head.x - headRadius * 0.83, head.y + headRadius * 0.05), headRadius * 0.21, skin);
  drawJoint(point(head.x + headRadius * 0.83, head.y + headRadius * 0.05), headRadius * 0.21, skin);

  const face = ctx.createRadialGradient(
    head.x - headRadius * 0.35,
    head.y - headRadius * 0.38,
    headRadius * 0.1,
    head.x,
    head.y,
    headRadius
  );
  face.addColorStop(0, skinLight);
  face.addColorStop(0.62, skin);
  face.addColorStop(1, skinShadow);
  drawJoint(head, headRadius, face, "rgba(2,7,4,.92)");

  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(head.x, head.y - headRadius * 0.11, headRadius * 0.91, Math.PI, TAU);
  ctx.lineTo(head.x + headRadius * 0.63, head.y + headRadius * 0.05);
  ctx.quadraticCurveTo(head.x, head.y - headRadius * 0.02, head.x - headRadius * 0.63, head.y + headRadius * 0.05);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(218,254,77,.16)";
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.arc(
      head.x + i * headRadius * 0.23,
      head.y - headRadius * (0.68 + (i % 2) * 0.04),
      headRadius * 0.075,
      0,
      TAU
    );
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255,255,255,.2)";
  ctx.lineWidth = Math.max(1, h * 0.006);
  ctx.beginPath();
  ctx.arc(head.x - headRadius * 0.18, head.y - headRadius * 0.08, headRadius * 0.68, 0.72 * Math.PI, 1.2 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

export function drawHeroKicker(time) {
  const character = activeCharacter();
  if (character.id !== "dax-ryder") return;
  const presentationPhase = state.presentation?.phase;
  if (presentationPhase === "stage" || presentationPhase === "breakdown") return;

  const progress = progressAt(time);
  const approach = progress.replay ? 1 : clamp(progress.run / 0.84, 0, 1);
  const runPosition = state.animation ? easeInOutCubic(approach) : 0;
  const world = kickerWorld(state.currentStage, runPosition);
  if (state.animation && !progress.replay && progress.run < 0.84) {
    const extra = (1 - smooth01(progress.run / 0.84)) * 0.34;
    world.z += extra;
    world.x -= extra * 0.13;
  }

  applyWorldTransform();
  drawHero(world, kickerPose(progress, time), time, character);
}

window.__footballLabHeroArtV172 = true;
