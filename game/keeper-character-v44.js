import { clamp, easeOutCubic, lerp, state, ctx, canvasView } from "./core-v6.js?v=32.4";
import { buildCamera } from "./world-v7.js?v=32.4";
import { projectWorld, projectedHeight } from "./projection-v6.js?v=32.4";
import { sampleShotPath } from "./physics-v7.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";
import { goalkeeperVisualProfileV42 } from "./character-profiles-v42.js?v=42.1.0";

const BUILD = "44.0.0";
const VIEW = Object.freeze({ width: 1200, height: 720 });
const TAU = Math.PI * 2;
const RETRY_MS = 100;
const MAX_RETRIES = 100;
let installed = false;
let retryTimer = null;
let retries = 0;

function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function replayPathProgress(value) {
  const t = clamp(value, 0, 1);
  if (t < 0.67) return easeOutCubic(t / 0.67) * 0.82;
  return 0.82 + smooth01((t - 0.67) / 0.33) * 0.18;
}

function cinematicFlightProgress(value) {
  const t = clamp(value, 0, 1);
  if (t <= 0.87) return (t / 0.87) * 0.9;
  return 0.9 + smooth01((t - 0.87) / 0.13) * 0.1;
}

function motionProgress(time) {
  if (!state.animation) return { motionFlight: 0, replay: false };
  const elapsed = time - state.animation.startedAt;
  const run = Math.max(1, state.animation.runUpDuration || 1);
  const contact = Math.max(0, state.animation.contactHoldDuration || 0);
  const flightDuration = Math.max(1, state.animation.flightDuration || 1);
  const flight = clamp((elapsed - run - contact) / flightDuration, 0, 1);
  const replay = Boolean(state.animation.isReplay);
  return {
    motionFlight: replay ? replayPathProgress(flight) : cinematicFlightProgress(flight),
    replay
  };
}

function cameraForFrame(time) {
  const camera = buildCamera(state.currentStage);
  const progress = motionProgress(time);
  const reducedMotion = document.documentElement.classList.contains("reduced-motion-v22");
  if (state.animation && progress.motionFlight > 0 && !reducedMotion) {
    const follow = easeOutCubic(progress.motionFlight);
    const ball = sampleShotPath(state.shot?.path, progress.motionFlight);
    camera.position.z -= follow * (progress.replay ? 4.6 : 3.3);
    camera.position.y += follow * 0.2;
    camera.fovY = lerp(camera.fovY, progress.replay ? 28.5 : 31.5, follow * 0.72);
    if (ball) {
      camera.target.x = lerp(camera.target.x, ball.x, follow * 0.68);
      camera.target.y = lerp(camera.target.y, ball.y, follow * 0.56);
      camera.target.z = lerp(camera.target.z, ball.z, follow * (1 - progress.motionFlight) * 0.42);
    }
  }
  return camera;
}

function applyCanvasTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function point(x, y) {
  return { x, y };
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

function drawGroundShadow(foot, height, airborne) {
  const alpha = clamp(0.2 - airborne * 0.13, 0.045, 0.2);
  ctx.save();
  ctx.translate(foot.x, foot.y + 2);
  ctx.scale(1, 0.34);
  const radius = height * 0.215;
  const gradient = ctx.createRadialGradient(0, 0, radius * 0.05, 0, 0, radius);
  gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
  gradient.addColorStop(0.58, `rgba(0,0,0,${alpha * 0.42})`);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawLimb(a, b, widthA, widthB, light, base, shadow) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const halfA = widthA * 0.5;
  const halfB = widthB * 0.5;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.24)";
  ctx.shadowBlur = Math.max(1, Math.min(widthA, widthB) * 0.18);
  ctx.beginPath();
  ctx.moveTo(a.x + nx * halfA, a.y + ny * halfA);
  ctx.quadraticCurveTo(a.x + dx * 0.48 + nx * halfA * 0.72, a.y + dy * 0.48 + ny * halfA * 0.72, b.x + nx * halfB, b.y + ny * halfB);
  ctx.lineTo(b.x - nx * halfB, b.y - ny * halfB);
  ctx.quadraticCurveTo(a.x + dx * 0.48 - nx * halfA * 0.72, a.y + dy * 0.48 - ny * halfA * 0.72, a.x - nx * halfA, a.y - ny * halfA);
  ctx.closePath();
  const gradient = ctx.createLinearGradient(a.x - nx * widthA, a.y - ny * widthA, a.x + nx * widthA, a.y + ny * widthA);
  gradient.addColorStop(0, shadow);
  gradient.addColorStop(0.42, base);
  gradient.addColorStop(0.72, light || base);
  gradient.addColorStop(1, shadow);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

function drawBoot(ankle, toe, width) {
  const dx = toe.x - ankle.x;
  const dy = toe.y - ankle.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const heel = point(ankle.x - dx * 0.04, ankle.y - dy * 0.04);
  const front = point(toe.x + dx * 0.08, toe.y + dy * 0.08);
  const half = width * 0.52;
  const gradient = ctx.createLinearGradient(heel.x, heel.y, front.x, front.y);
  gradient.addColorStop(0, "#050709");
  gradient.addColorStop(0.55, "#161d21");
  gradient.addColorStop(1, "#020304");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(heel.x + nx * half, heel.y + ny * half);
  ctx.quadraticCurveTo(front.x + nx * half * 0.8, front.y + ny * half * 0.8, front.x + nx * half * 0.34, front.y + ny * half * 0.34);
  ctx.lineTo(front.x - nx * half * 0.55, front.y - ny * half * 0.55);
  ctx.quadraticCurveTo(heel.x - nx * half, heel.y - ny * half, heel.x + nx * half, heel.y + ny * half);
  ctx.closePath();
  ctx.fill();
}

function drawGlove(hand, radius, visual) {
  const glove = visual.gloves;
  const gradient = ctx.createRadialGradient(hand.x - radius * 0.3, hand.y - radius * 0.3, 1, hand.x, hand.y, radius);
  gradient.addColorStop(0, glove.base);
  gradient.addColorStop(0.62, glove.base);
  gradient.addColorStop(1, glove.palm);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(hand.x, hand.y, radius * 0.86, radius, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = glove.accent;
  ctx.lineWidth = Math.max(1, radius * 0.16);
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, radius * 0.66, -2.4, -0.8);
  ctx.stroke();
}

function drawHead(head, radius, visual) {
  const skin = visual.skin;
  const hair = visual.hair;
  const jaw = visual.face?.jaw || 1;
  const headGradient = ctx.createRadialGradient(head.x - radius * 0.24, head.y - radius * 0.3, 1, head.x, head.y, radius * 1.15);
  headGradient.addColorStop(0, skin.light);
  headGradient.addColorStop(0.64, skin.base);
  headGradient.addColorStop(1, skin.shadow);
  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.moveTo(head.x - radius * 0.72, head.y - radius * 0.7);
  ctx.quadraticCurveTo(head.x - radius, head.y, head.x - radius * (0.72 + (jaw - 1) * 0.5), head.y + radius * 0.54);
  ctx.quadraticCurveTo(head.x, head.y + radius, head.x + radius * (0.72 + (jaw - 1) * 0.5), head.y + radius * 0.54);
  ctx.quadraticCurveTo(head.x + radius, head.y, head.x + radius * 0.72, head.y - radius * 0.7);
  ctx.quadraticCurveTo(head.x, head.y - radius, head.x - radius * 0.72, head.y - radius * 0.7);
  ctx.closePath();
  ctx.fill();

  const hairGradient = ctx.createLinearGradient(head.x - radius, head.y - radius, head.x + radius, head.y);
  hairGradient.addColorStop(0, hair.shadow);
  hairGradient.addColorStop(0.5, hair.base);
  hairGradient.addColorStop(1, hair.light);
  ctx.fillStyle = hairGradient;
  const volume = hair.volume || 1;
  const top = head.y - radius * 0.94 * volume;
  ctx.beginPath();
  if (hair.style === "classic-long") {
    ctx.moveTo(head.x - radius * 0.88, head.y - radius * 0.08);
    ctx.quadraticCurveTo(head.x - radius * 0.82, top, head.x, top - radius * 0.08);
    ctx.quadraticCurveTo(head.x + radius * 0.82, top, head.x + radius * 0.88, head.y - radius * 0.08);
    ctx.lineTo(head.x + radius * 0.72, head.y + radius * 0.28);
    ctx.quadraticCurveTo(head.x, head.y + radius * 0.14, head.x - radius * 0.72, head.y + radius * 0.28);
  } else {
    ctx.moveTo(head.x - radius * 0.84, head.y - radius * 0.08);
    ctx.quadraticCurveTo(head.x - radius * 0.62, top + radius * 0.08, head.x, top);
    ctx.quadraticCurveTo(head.x + radius * 0.62, top + radius * 0.08, head.x + radius * 0.84, head.y - radius * 0.08);
    ctx.quadraticCurveTo(head.x, head.y + radius * 0.16, head.x - radius * 0.84, head.y - radius * 0.08);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(8,12,12,.75)";
  ctx.beginPath();
  ctx.arc(head.x - radius * 0.25, head.y + radius * 0.05, Math.max(0.7, radius * 0.065), 0, TAU);
  ctx.arc(head.x + radius * 0.25, head.y + radius * 0.05, Math.max(0.7, radius * 0.065), 0, TAU);
  ctx.fill();

  if ((visual.face?.moustache || 0) > 0.25) {
    ctx.strokeStyle = hair.shadow;
    ctx.lineWidth = Math.max(1, radius * 0.09 * visual.face.moustache);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(head.x - radius * 0.3, head.y + radius * 0.34);
    ctx.quadraticCurveTo(head.x, head.y + radius * 0.42, head.x + radius * 0.3, head.y + radius * 0.34);
    ctx.stroke();
  }
}

function drawKeeperRig(world, pose, source, visual, camera) {
  const visualHeight = Math.max(1.82, Number(source.visualHeight) || 1.9) * 1.2;
  const projection = projectedHeight(world, visualHeight, camera, VIEW);
  if (!projection || projection.height < 8) return false;

  applyCanvasTransform();
  const { foot, height: h } = projection;
  const body = visual.body;
  drawGroundShadow(foot, h, Number(world.y) || 0);

  const rotation = pose.rotation || 0;
  const crouch = pose.crouch || 0;
  const pelvis = point(0, -0.335 * h + crouch * h * 0.09);
  const chest = point((pose.chestX || 0) * h, -0.635 * h + crouch * h * 0.1);
  const headRadius = h * 0.068 * (body.head || 1);
  const head = point(chest.x, chest.y - h * 0.148);
  const shoulderHalf = h * 0.132 * (body.shoulder || 1);
  const hipHalf = h * 0.076 * (body.waist || 1);
  const leftShoulder = point(chest.x - shoulderHalf, chest.y + h * 0.014);
  const rightShoulder = point(chest.x + shoulderHalf, chest.y + h * 0.014);
  const leftHip = point(pelvis.x - hipHalf, pelvis.y);
  const rightHip = point(pelvis.x + hipHalf, pelvis.y);
  const p = (value, fallback) => value ? point(value.x * h, value.y * h) : fallback;

  const localAbsolute = (worldPoint) => {
    if (!worldPoint) return null;
    const projected = projectWorld(worldPoint, camera, VIEW);
    if (!projected.visible) return null;
    const dx = projected.x - foot.x;
    const dy = projected.y - foot.y;
    const cosine = Math.cos(-rotation);
    const sine = Math.sin(-rotation);
    return point(dx * cosine - dy * sine, dx * sine + dy * cosine);
  };

  const leftKnee = p(pose.leftKnee, point(-0.18 * h, -0.14 * h));
  const rightKnee = p(pose.rightKnee, point(0.18 * h, -0.14 * h));
  const leftAnkle = p(pose.leftAnkle, point(-0.22 * h, -0.01 * h));
  const rightAnkle = p(pose.rightAnkle, point(0.22 * h, -0.01 * h));
  const leftToe = p(pose.leftToe, point(leftAnkle.x - h * 0.055, leftAnkle.y));
  const rightToe = p(pose.rightToe, point(rightAnkle.x + h * 0.055, rightAnkle.y));
  const leftHand = localAbsolute(pose.absoluteLeftHand) || p(pose.leftHand, point(-0.39 * h, -0.49 * h));
  const rightHand = localAbsolute(pose.absoluteRightHand) || p(pose.rightHand, point(0.39 * h, -0.49 * h));
  const leftElbow = point(lerp(leftShoulder.x, leftHand.x, 0.5) - h * 0.035, lerp(leftShoulder.y, leftHand.y, 0.5) + h * 0.025);
  const rightElbow = point(lerp(rightShoulder.x, rightHand.x, 0.5) + h * 0.035, lerp(rightShoulder.y, rightHand.y, 0.5) + h * 0.025);

  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(rotation);

  const thighWidth = Math.max(4.8, h * 0.057 * (body.thigh || 1));
  const calfWidth = Math.max(4.3, h * 0.05 * (body.calf || 1));
  drawLimb(leftHip, leftKnee, thighWidth, thighWidth * 0.82, visual.kit.shirt, visual.kit.shorts, visual.kit.shirtShadow);
  drawLimb(leftKnee, leftAnkle, calfWidth, calfWidth * 0.72, visual.kit.shirt, visual.kit.socks, visual.kit.shirtShadow);
  drawLimb(rightHip, rightKnee, thighWidth, thighWidth * 0.82, visual.kit.shirt, visual.kit.shorts, visual.kit.shirtShadow);
  drawLimb(rightKnee, rightAnkle, calfWidth, calfWidth * 0.72, visual.kit.shirt, visual.kit.socks, visual.kit.shirtShadow);
  drawBoot(leftAnkle, leftToe, calfWidth * 0.9);
  drawBoot(rightAnkle, rightToe, calfWidth * 0.9);

  const torsoX = (chest.x + pelvis.x) / 2;
  const torsoY = (chest.y + pelvis.y) / 2;
  const torsoW = h * 0.27 * (body.chest || 1);
  const torsoH = h * 0.345;
  const torsoGradient = ctx.createLinearGradient(torsoX - torsoW / 2, torsoY, torsoX + torsoW / 2, torsoY);
  torsoGradient.addColorStop(0, visual.kit.shirtShadow);
  torsoGradient.addColorStop(0.28, visual.kit.shirt);
  torsoGradient.addColorStop(0.7, visual.kit.shirt);
  torsoGradient.addColorStop(1, visual.kit.shirtShadow);
  ctx.save();
  ctx.translate(torsoX, torsoY);
  ctx.rotate(pose.torsoLean || 0);
  ctx.shadowColor = "rgba(0,0,0,.25)";
  ctx.shadowBlur = Math.max(1.5, h * 0.012);
  ctx.fillStyle = torsoGradient;
  roundedRect(-torsoW / 2, -torsoH / 2, torsoW, torsoH, h * 0.052);
  ctx.fill();
  ctx.fillStyle = visual.kit.trim;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(7, h * 0.05)}px system-ui`;
  ctx.fillText(String(visual.number), 0, h * 0.015);
  ctx.restore();

  const armWidth = Math.max(4.2, h * 0.048 * (body.shoulder || 1));
  drawLimb(leftShoulder, leftElbow, armWidth, armWidth * 0.9, visual.kit.shirt, visual.kit.shirt, visual.kit.shirtShadow);
  drawLimb(leftElbow, leftHand, armWidth * 0.9, armWidth * 0.68, visual.kit.shirt, visual.kit.shirt, visual.kit.shirtShadow);
  drawLimb(rightShoulder, rightElbow, armWidth, armWidth * 0.9, visual.kit.shirt, visual.kit.shirt, visual.kit.shirtShadow);
  drawLimb(rightElbow, rightHand, armWidth * 0.9, armWidth * 0.68, visual.kit.shirt, visual.kit.shirt, visual.kit.shirtShadow);

  const gloveRadius = armWidth * 0.72 * (pose.gloveScale || 1) * (visual.gloves.scale || 1);
  drawGlove(leftHand, gloveRadius, visual);
  drawGlove(rightHand, gloveRadius, visual);
  drawHead(head, headRadius, visual);

  ctx.restore();
  return true;
}

function drawProfiledKeeper(time, source, frame) {
  const keeper = frame?.keeper;
  if (!keeper?.world || !keeper?.pose) return false;
  const visual = goalkeeperVisualProfileV42(source.id);
  if (!visual) return false;
  const camera = cameraForFrame(time);
  const drawn = drawKeeperRig(keeper.world, keeper.pose, source, visual, camera);
  if (!drawn) return false;

  window.__footballLabKeeperFrameV44 = Object.freeze({
    build: BUILD,
    character: visual.id,
    sourceKeeperId: source.id,
    renderer: "articulated-layered-2.5d",
    rig: "continuous-goalkeeper-skeletal-canvas",
    staticSpriteFrames: false,
    sceneDepth: true,
    profileDrivenVisuals: true,
    motion: frame.motion || keeper.pose.motion || "READY",
    airborne: Boolean(frame.airborne),
    time
  });
  return true;
}

function installNow() {
  if (installed) return true;
  const originalSceneDraw = window.__footballLabPremiumKeeperSceneDrawV3852;
  if (typeof originalSceneDraw !== "function") return false;

  window.__footballLabPremiumKeeperSceneDrawV3852 = function footballLabKeeperSceneV44(time) {
    const source = keeperForStage(state.stage);
    ctx.save();
    const previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = 0;
    const result = originalSceneDraw(time);
    ctx.globalAlpha = previousAlpha;
    ctx.restore();

    const frame = window.__footballLabPremiumKeeperSceneFrameV3852;
    if (!drawProfiledKeeper(time, source, frame)) return originalSceneDraw(time);
    return result;
  };

  installed = true;
  clearTimeout(retryTimer);
  retryTimer = null;
  window.__footballLabKeeperRendererV44 = Object.freeze({
    build: BUILD,
    renderer: "articulated-layered-2.5d",
    rig: "continuous-goalkeeper-skeletal-canvas",
    goalkeeperCharacters: 4,
    goalkeeperArchetypes: 5,
    profileDrivenVisuals: true,
    staticSpriteFrames: false,
    spriteAtlasRequired: false,
    sceneDepthPreserved: true,
    keeperAIChanged: false,
    shotOutcomeChanged: false
  });
  return true;
}

function retryInstall() {
  if (installNow() || retries >= MAX_RETRIES) return;
  retries += 1;
  retryTimer = setTimeout(retryInstall, RETRY_MS);
}

export function installKeeperCharacterV44() {
  if (installNow()) return true;
  retryInstall();
  return false;
}

if (typeof window !== "undefined") installKeeperCharacterV44();
