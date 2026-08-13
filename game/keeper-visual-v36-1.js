import { clamp, lerp, WORLD, state, ctx, canvasView, easeOutCubic } from "./core-v6.js?v=32.4";
import { buildCamera, keeperWorld } from "./world-v7.js?v=32.4";
import { projectWorld, projectedHeight } from "./projection-v6.js?v=32.4";
import { sampleShotPath } from "./physics-v7.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";

const BUILD = "36.1.0";
const viewport = { width: WORLD.width, height: WORLD.height };
const TAU = Math.PI * 2;

function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function pulse01(value) {
  return Math.sin(clamp(value, 0, 1) * Math.PI);
}

function progressAt(time) {
  if (!state.animation) return { flight: 0, motionFlight: 0, settle: 0, replay: false };
  const elapsed = time - state.animation.startedAt;
  const run = Math.max(1, state.animation.runUpDuration || 1);
  const contact = Math.max(0, state.animation.contactHoldDuration || 0);
  const flightDuration = Math.max(1, state.animation.flightDuration || 1);
  const flightStart = run + contact;
  const flight = clamp((elapsed - flightStart) / flightDuration, 0, 1);
  const replay = Boolean(state.animation.isReplay);
  const motionFlight = replay
    ? flight < 0.67
      ? easeOutCubic(flight / 0.67) * 0.82
      : 0.82 + smooth01((flight - 0.67) / 0.33) * 0.18
    : flight;
  return {
    flight,
    motionFlight,
    settle: clamp((elapsed - flightStart - flightDuration) / Math.max(1, state.animation.settleDuration || 1), 0, 1),
    replay
  };
}

function cameraForFrame(time) {
  const camera = buildCamera(state.currentStage);
  const progress = progressAt(time);
  const reducedMotion = document.documentElement.classList.contains("reduced-motion-v22");
  if (state.animation && progress.motionFlight > 0 && !reducedMotion) {
    const follow = easeOutCubic(progress.motionFlight);
    const ball = sampleShotPath(state.shot?.path || [], progress.motionFlight);
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

function impactRatio() {
  const shot = state.shot;
  if (!shot?.path?.length) return 0.93;
  if (Number.isInteger(shot.impactIndex)) {
    return clamp(shot.impactIndex / Math.max(1, shot.path.length - 1), 0.1, 0.99);
  }
  return 0.94;
}

function visualKeeperState(time) {
  const keeper = keeperForStage(state.stage);
  const progress = progressAt(time);
  const plan = state.shot?.keeperPlan;
  const baseIdle = keeperWorld(state.currentStage);
  const idle = plan?.start || {
    ...baseIdle,
    z: baseIdle.z + keeper.modifiers.forwardStart
  };

  if (!state.animation || !plan) {
    return {
      keeper,
      progress,
      world: { ...idle, x: idle.x + Math.sin(time / 650) * 0.09 },
      direction: 1,
      launch: 0,
      push: 0,
      land: 0,
      recovery: 0,
      catchHold: 0,
      crouch: 0.1 + Math.sin(time / 440) * 0.01,
      rotation: 0
    };
  }

  const flight = progress.motionFlight;
  const reactionFraction = clamp(plan.reaction / Math.max(0.01, plan.flightSeconds), 0.075, 0.72);
  const direction = Math.sign((plan.contact?.x ?? idle.x) - idle.x || plan.diveDirection || 1);
  const prep = clamp(flight / Math.max(0.075, reactionFraction), 0, 1);
  const archetypeSetSpeed = keeper.id === "reflex" ? 1.18 : keeper.id === "reader" ? 1.08 : keeper.id === "giant" ? 0.88 : 1;
  const setStep = direction * Math.sin(clamp(prep * archetypeSetSpeed, 0, 1) * Math.PI) * 0.055;
  const coil = smooth01((flight - Math.max(0, reactionFraction - 0.12)) / 0.12);
  const push = pulse01((flight - (reactionFraction - 0.035)) / 0.18);
  const diveRaw = clamp((flight - reactionFraction) / Math.max(0.11, 0.86 - reactionFraction), 0, 1);
  const launch = smooth01(clamp((diveRaw - 0.025) / 0.89, 0, 1));
  const contactPoint = impactRatio();
  const land = smooth01((flight - Math.min(0.9, contactPoint + 0.012)) / 0.16);
  const recovery = smooth01(progress.settle);
  const saveContact = state.shot?.outcome === "SAVE"
    ? smooth01((flight - Math.max(0.1, contactPoint - 0.025)) / 0.055)
    : 0;
  const catchHold = state.shot?.saveType === "CATCH" ? smooth01((saveContact - 0.08) / 0.72) : 0;

  const contact = plan.contact || { x: idle.x, y: 1.05, z: idle.z };
  const world = {
    x: lerp(idle.x + setStep, contact.x - direction * 0.075, launch),
    y: Math.max(0, Math.sin(launch * Math.PI) * 0.41 + push * 0.085) * (1 - land * 0.94),
    z: lerp(idle.z, contact.z, launch)
  };

  const launchRotation = direction * lerp(0, 1.02, launch);
  const finalRotation = direction * lerp(1.02, 0.68, recovery);
  const rotation = land > 0
    ? lerp(launchRotation, finalRotation, Math.max(land, recovery))
    : launchRotation;

  return {
    keeper,
    progress,
    world,
    direction,
    launch,
    push,
    land,
    recovery,
    catchHold,
    crouch: 0.09 + coil * 0.15 + land * 0.13 + recovery * 0.04,
    rotation
  };
}

function applyCanvasTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
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

function line(a, b, width, colour, outline = "rgba(1,5,3,.95)") {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = outline;
  ctx.lineWidth = width + Math.max(1.8, width * 0.5);
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

function glove(point, size, angle, accent) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle);

  ctx.fillStyle = "rgba(1,5,3,.96)";
  roundedRect(-size * 0.82, -size * 0.68, size * 1.64, size * 1.36, size * 0.42);
  ctx.fill();

  ctx.fillStyle = "#f7f8ee";
  roundedRect(-size * 0.7, -size * 0.58, size * 1.4, size * 1.16, size * 0.36);
  ctx.fill();

  ctx.fillStyle = accent;
  roundedRect(-size * 0.52, size * 0.35, size * 1.04, size * 0.38, size * 0.16);
  ctx.fill();

  ctx.strokeStyle = "rgba(18,28,22,.65)";
  ctx.lineWidth = Math.max(0.7, size * 0.12);
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * size * 0.25, -size * 0.45);
    ctx.lineTo(i * size * 0.25, size * 0.2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawKeeperRig(time) {
  if (state.screen !== "game" || !state.currentStage) return;
  const visual = visualKeeperState(time);
  const camera = cameraForFrame(time);
  const heightMetres = visual.keeper.visualHeight * 1.19;
  const projection = projectedHeight(visual.world, heightMetres, camera, viewport);
  if (!projection) return;

  const { foot, height: h } = projection;
  if (!Number.isFinite(h) || h < 8) return;

  const direction = visual.direction;
  const launch = visual.launch;
  const crouch = visual.crouch;
  const accent = visual.keeper.accent;
  const darkKit = visual.keeper.shorts || "#102019";
  const sleeve = accent;
  const skin = "#b97e5d";
  const rotation = visual.rotation * 0.84;

  ctx.save();
  applyCanvasTransform();
  ctx.translate(foot.x, foot.y - visual.world.y * h * 0.02);
  ctx.rotate(rotation);

  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.ellipse(0, 4 + visual.world.y * h * 0.1, h * 0.19, h * 0.052, 0, 0, TAU);
  ctx.fill();

  const pelvis = { x: -direction * launch * h * 0.018, y: -h * (0.30 - crouch * 0.07) };
  const chest = { x: direction * launch * h * 0.035, y: -h * (0.60 - crouch * 0.07) };
  const head = { x: chest.x + direction * launch * h * 0.025, y: chest.y - h * 0.19 };
  const shoulder = h * 0.145;
  const hip = h * 0.075;
  const leftShoulder = { x: chest.x - shoulder, y: chest.y };
  const rightShoulder = { x: chest.x + shoulder, y: chest.y };
  const leftHip = { x: pelvis.x - hip, y: pelvis.y };
  const rightHip = { x: pelvis.x + hip, y: pelvis.y };

  const trail = launch * h;
  const leftKnee = { x: -h * 0.105 - direction * trail * 0.055, y: -h * 0.15 + visual.land * h * 0.03 };
  const rightKnee = { x: h * 0.105 - direction * trail * 0.055, y: -h * 0.15 + visual.land * h * 0.03 };
  const leftFoot = { x: -h * 0.16 - direction * trail * 0.12, y: 0 };
  const rightFoot = { x: h * 0.16 - direction * trail * 0.12, y: 0 };

  const legWidth = Math.max(4.8, h * 0.058);
  line(leftHip, leftKnee, legWidth, darkKit);
  line(leftKnee, leftFoot, legWidth * 0.86, accent);
  line(rightHip, rightKnee, legWidth, darkKit);
  line(rightKnee, rightFoot, legWidth * 0.86, accent);

  ctx.save();
  ctx.translate((chest.x + pelvis.x) / 2, (chest.y + pelvis.y) / 2);
  ctx.rotate(direction * launch * 0.04);
  ctx.fillStyle = "rgba(1,5,3,.98)";
  roundedRect(-h * 0.153, -h * 0.18, h * 0.306, h * 0.36, h * 0.058);
  ctx.fill();
  const torso = ctx.createLinearGradient(-h * 0.12, 0, h * 0.12, 0);
  torso.addColorStop(0, darkKit);
  torso.addColorStop(0.22, accent);
  torso.addColorStop(0.78, accent);
  torso.addColorStop(1, darkKit);
  ctx.fillStyle = torso;
  roundedRect(-h * 0.139, -h * 0.166, h * 0.278, h * 0.332, h * 0.052);
  ctx.fill();
  ctx.fillStyle = "rgba(5,15,10,.48)";
  roundedRect(-h * 0.105, -h * 0.115, h * 0.21, h * 0.055, h * 0.02);
  ctx.fill();
  ctx.fillStyle = "rgba(248,251,244,.9)";
  ctx.font = `900 ${Math.max(7, h * 0.075)}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("1", 0, h * 0.018);
  ctx.restore();

  const armWidth = Math.max(4.4, h * 0.052);
  const extension = launch * h;
  const leadHand = {
    x: direction * (h * 0.34 + extension * 0.27),
    y: -h * (0.49 + launch * 0.11)
  };
  const trailHand = {
    x: -direction * h * 0.25 + direction * extension * 0.17,
    y: -h * (0.48 + launch * 0.055)
  };
  const idleLeft = { x: -h * 0.31, y: -h * 0.47 };
  const idleRight = { x: h * 0.31, y: -h * 0.47 };

  let leftHand = launch > 0.02 ? (direction > 0 ? trailHand : leadHand) : idleLeft;
  let rightHand = launch > 0.02 ? (direction > 0 ? leadHand : trailHand) : idleRight;

  if (visual.catchHold > 0) {
    const chestCatch = { x: direction * h * 0.035, y: -h * 0.53 };
    leftHand = {
      x: lerp(leftHand.x, chestCatch.x - h * 0.035, visual.catchHold * 0.78),
      y: lerp(leftHand.y, chestCatch.y, visual.catchHold * 0.78)
    };
    rightHand = {
      x: lerp(rightHand.x, chestCatch.x + h * 0.035, visual.catchHold * 0.78),
      y: lerp(rightHand.y, chestCatch.y, visual.catchHold * 0.78)
    };
  }

  const leftElbow = {
    x: lerp(leftShoulder.x, leftHand.x, 0.52) - h * 0.02,
    y: lerp(leftShoulder.y, leftHand.y, 0.52) + h * 0.035
  };
  const rightElbow = {
    x: lerp(rightShoulder.x, rightHand.x, 0.52) + h * 0.02,
    y: lerp(rightShoulder.y, rightHand.y, 0.52) + h * 0.035
  };

  line(leftShoulder, leftElbow, armWidth, sleeve);
  line(leftElbow, leftHand, armWidth * 0.92, sleeve);
  line(rightShoulder, rightElbow, armWidth, sleeve);
  line(rightElbow, rightHand, armWidth * 0.92, sleeve);

  const gloveSize = Math.max(3.4, h * (state.shot?.saveType === "CATCH" ? 0.083 : 0.076));
  glove(leftHand, gloveSize, -0.12 - direction * launch * 0.12, accent);
  glove(rightHand, gloveSize, 0.12 - direction * launch * 0.12, accent);

  const headRadius = Math.max(3.5, h * 0.072);
  ctx.fillStyle = "rgba(1,5,3,.96)";
  ctx.beginPath();
  ctx.arc(head.x, head.y, headRadius * 1.15, 0, TAU);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(head.x, head.y, headRadius, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#171713";
  ctx.beginPath();
  ctx.arc(head.x, head.y - headRadius * 0.16, headRadius * 0.88, Math.PI, TAU);
  ctx.fill();

  ctx.restore();

  window.__footballLabKeeperVisualV361 = {
    build: BUILD,
    keeper: visual.keeper.id,
    scale: 1.19,
    gloves: "shaped-palm-cuff",
    longSleeves: true,
    contactRingRemoved: true,
    visualReflexOnly: true,
    outcome: state.shot?.outcome || null
  };
}

function suppressLegacyKeeperContactRing() {
  if (window.__footballLabKeeperRingPatchV361) return;
  const proto = Object.getPrototypeOf(ctx);
  if (!proto?.stroke) return;
  const originalStroke = proto.stroke;
  proto.stroke = function patchedStroke(...args) {
    if (this === ctx && state.shot?.outcome === "SAVE") {
      const colour = String(this.strokeStyle || "");
      const width = Number(this.lineWidth) || 0;
      if (/218\s*,\s*254\s*,\s*77/.test(colour) && Math.abs(width - 2.2) < 0.08) {
        return undefined;
      }
    }
    return originalStroke.apply(this, args);
  };
  window.__footballLabKeeperRingPatchV361 = true;
}

function renderLoop(time) {
  if (state.screen === "game") drawKeeperRig(time);
  requestAnimationFrame(renderLoop);
}

suppressLegacyKeeperContactRing();
setTimeout(() => requestAnimationFrame(renderLoop), 0);

window.__footballLabKeeperVisualRigV361 = Object.freeze({
  build: BUILD,
  dominantSilhouette: true,
  scaleMultiplier: 1.19,
  longSleeveKeeperKit: true,
  shapedGoalkeeperGloves: true,
  legacyContactRingSuppressed: true,
  reflexTuning: "presentation-only"
});
