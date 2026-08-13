import {
  clamp,
  easeOutCubic,
  lerp,
  state,
  ctx,
  canvasView
} from "./core-v6.js?v=32.4";
import { GOAL, buildCamera, keeperWorld } from "./world-v7.js?v=32.4";
import { projectWorld, projectedHeight } from "./projection-v6.js?v=32.4";
import { sampleShotPath } from "./physics-v7.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";

const BUILD = "38.1.0";
const VIEWPORT = Object.freeze({ width: 1200, height: 720 });
const TAU = Math.PI * 2;

let saveDepth = 0;
let legacyKeeperDepth = -1;
let suppressLegacyKeeper = false;
let articulatedShadowIndex = 0;
let suppressContactPulseStroke = 0;
let overlayGeneration = 0;
let canvasPatched = false;

function normaliseColour(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
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
    return {
      elapsed: 0,
      run: 0,
      contact: 0,
      flight: 0,
      motionFlight: 0,
      settle: 0,
      replay: false
    };
  }

  const elapsed = time - state.animation.startedAt;
  const runUpDuration = Math.max(1, state.animation.runUpDuration || 1);
  const contactHoldDuration = Math.max(0, state.animation.contactHoldDuration || 0);
  const flightDuration = Math.max(1, state.animation.flightDuration || 1);
  const flightStart = runUpDuration + contactHoldDuration;
  const flightEnd = flightStart + flightDuration;
  const flight = clamp((elapsed - flightStart) / flightDuration, 0, 1);
  const replay = Boolean(state.animation.isReplay);

  return {
    elapsed,
    run: clamp(elapsed / runUpDuration, 0, 1),
    contact: contactHoldDuration > 0
      ? clamp((elapsed - runUpDuration) / contactHoldDuration, 0, 1)
      : 0,
    flight,
    motionFlight: replay ? replayPathProgress(flight) : flight,
    settle: clamp((elapsed - flightEnd) / Math.max(1, state.animation.settleDuration || 1), 0, 1),
    replay
  };
}

function impactRatio() {
  const shot = state.shot;
  if (!shot?.path?.length) return 0.93;
  if (Number.isInteger(shot.impactIndex)) {
    return clamp(shot.impactIndex / Math.max(1, shot.path.length - 1), 0.1, 0.99);
  }
  return 0.94;
}

function cameraForFrame(time) {
  const camera = buildCamera(state.currentStage);
  const progress = progressAt(time);
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
      camera.target.z = lerp(
        camera.target.z,
        ball.z,
        follow * (1 - progress.motionFlight) * 0.42
      );
    }
  }

  return camera;
}

function applyCanvasTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function applyCameraFeedback(time, progress) {
  if (
    !state.animation
    || state.animation.isReplay
    || document.documentElement.classList.contains("reduced-motion-v22")
  ) return;

  const contact = clamp(progress.flight / 0.075, 0, 1);
  const impact = impactRatio();
  const outcomeWindow = clamp((progress.motionFlight - impact) / 0.095, 0, 1);
  const contactStrength = contact > 0 && contact < 1
    ? Math.sin(contact * Math.PI) * 1.9
    : 0;
  const impactStrength = outcomeWindow > 0 && outcomeWindow < 1
    ? Math.sin(outcomeWindow * Math.PI)
      * ({ GOAL: 2.6, SAVE: 2.2, POST: 3.2, BAR: 3.2, WALL: 2.5 }[state.shot?.outcome] || 0.9)
    : 0;
  const strength = contactStrength + impactStrength;
  if (strength <= 0) return;

  ctx.translate(
    Math.sin(time * 0.17) * strength,
    Math.cos(time * 0.21) * strength * 0.48
  );
}

function premiumKeeperState(progress, time) {
  const profile = keeperForStage(state.stage);
  const plan = state.shot?.keeperPlan;
  const baseIdle = keeperWorld(state.currentStage);
  const idle = plan?.start || {
    ...baseIdle,
    z: baseIdle.z + (profile.modifiers?.forwardStart || 0)
  };

  if (!state.animation || !plan?.contact) {
    const settleShift = Math.sin(time / 760) * 0.075;
    const breathe = Math.sin(time / 430) * 0.008;
    return {
      world: { ...idle, x: idle.x + settleShift },
      pose: {
        crouch: 0.12 + breathe,
        torsoLean: 0,
        rotation: 0,
        leftKnee: { x: -0.18, y: -0.13 },
        rightKnee: { x: 0.18, y: -0.13 },
        leftAnkle: { x: -0.22, y: -0.008 },
        rightAnkle: { x: 0.22, y: -0.008 },
        leftToe: { x: -0.28, y: 0 },
        rightToe: { x: 0.28, y: 0 },
        leftHand: { x: -0.39, y: -0.49 },
        rightHand: { x: 0.39, y: -0.49 },
        gloveScale: 1.02,
        motion: "READY"
      }
    };
  }

  const flight = progress.motionFlight;
  const reactionFraction = clamp(
    plan.reaction / Math.max(0.01, plan.flightSeconds || 1),
    0.08,
    0.72
  );
  const direction = Math.sign(plan.contact.x - idle.x || 1);
  const prep = clamp(flight / Math.max(0.08, reactionFraction), 0, 1);
  const setStep = Math.sin(prep * Math.PI * 3.2) * (1 - prep) * 0.035;
  const coil = smooth01((flight - Math.max(0, reactionFraction - 0.15)) / 0.14);
  const push = pulse01((flight - (reactionFraction - 0.05)) / 0.2);
  const diveRaw = clamp(
    (flight - reactionFraction) / Math.max(0.12, 0.9 - reactionFraction),
    0,
    1
  );
  const dive = smooth01(diveRaw);
  const launch = smooth01(clamp((diveRaw - 0.045) / 0.955, 0, 1));
  const contactPoint = impactRatio();
  const land = smooth01((flight - Math.min(0.9, contactPoint + 0.008)) / 0.16);
  const recovery = smooth01(progress.settle);
  const saveContact = state.shot?.outcome === "SAVE"
    ? smooth01((flight - Math.max(0.1, contactPoint - 0.028)) / 0.055)
    : 0;
  const catchHold = state.shot?.saveType === "CATCH"
    ? smooth01((saveContact - 0.08) / 0.72)
    : 0;
  const parryFollow = state.shot?.saveType === "PARRY"
    ? pulse01((flight - contactPoint) / 0.22)
    : 0;

  const world = {
    x: lerp(idle.x + setStep, plan.contact.x - direction * 0.075, launch),
    y: Math.max(0, Math.sin(launch * Math.PI) * 0.43 + push * 0.09) * (1 - land * 0.94),
    z: lerp(idle.z, plan.contact.z, launch)
  };

  const reach = smooth01(clamp((diveRaw - 0.055) / 0.84, 0, 1));
  const leadHand = {
    x: lerp(world.x + direction * 0.14, plan.contact.x, reach),
    y: lerp(world.y + 1.31, plan.contact.y, reach),
    z: lerp(world.z, plan.contact.z, reach)
  };
  const trailHand = {
    x: lerp(world.x - direction * 0.11, plan.contact.x - direction * 0.25, reach * 0.9),
    y: lerp(world.y + 1.18, plan.contact.y - 0.09, reach * 0.9),
    z: lerp(world.z + 0.02, plan.contact.z + 0.03, reach * 0.9)
  };
  const absoluteLeftHand = direction > 0 ? trailHand : leadHand;
  const absoluteRightHand = direction > 0 ? leadHand : trailHand;

  if (catchHold > 0) {
    const chestTarget = {
      x: world.x + direction * 0.035,
      y: world.y + 1.06,
      z: world.z
    };
    for (const hand of [absoluteLeftHand, absoluteRightHand]) {
      hand.x = lerp(hand.x, chestTarget.x, catchHold * 0.74);
      hand.y = lerp(hand.y, chestTarget.y, catchHold * 0.74);
      hand.z = lerp(hand.z, chestTarget.z, catchHold * 0.74);
    }
  } else if (parryFollow > 0) {
    const lead = direction > 0 ? absoluteRightHand : absoluteLeftHand;
    lead.x += direction * parryFollow * 0.24;
    lead.y += parryFollow * 0.065;
  }

  const launchRotation = direction * lerp(0, 1.15, launch);
  const finalRotation = direction * lerp(1.15, 0.72, recovery);
  const rotation = land > 0
    ? lerp(launchRotation, finalRotation, Math.max(land, recovery))
    : launchRotation;

  return {
    world,
    pose: {
      crouch: 0.105 + coil * 0.17 + land * 0.15 + recovery * 0.045 + catchHold * 0.035,
      rotation,
      torsoLean: direction * launch * 0.14,
      chestX: direction * launch * 0.055,
      leftKnee: {
        x: -0.15 - direction * launch * 0.075 - direction * push * 0.1,
        y: -0.14 - launch * 0.06 + land * 0.055
      },
      rightKnee: {
        x: 0.15 - direction * launch * 0.075 + direction * push * 0.1,
        y: -0.14 + launch * 0.03 + land * 0.055
      },
      leftAnkle: {
        x: -0.19 - direction * launch * 0.17 - direction * push * 0.14,
        y: -0.01 - launch * 0.1 + land * 0.045
      },
      rightAnkle: {
        x: 0.19 - direction * launch * 0.17 + direction * push * 0.14,
        y: -0.01 + launch * 0.03 + land * 0.045
      },
      leftToe: { x: -0.25 - direction * launch * 0.18, y: -0.005 },
      rightToe: { x: 0.25 - direction * launch * 0.18, y: -0.005 },
      absoluteLeftHand,
      absoluteRightHand,
      gloveScale: state.shot?.saveType === "CATCH" ? 1.12 : 1.06,
      motion: state.shot?.saveType || (dive > 0.08 ? "DIVE" : "SET"),
      recovery
    }
  };
}

function screenPoint(x, y) {
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

function drawSegment(a, b, width, colour, outline = "rgba(1,5,3,.92)") {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = outline;
  ctx.lineWidth = width + Math.max(1.5, width * 0.4);
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

function drawJoint(point, radius, colour, outline = "rgba(1,5,3,.9)") {
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius + Math.max(1.1, radius * 0.32), 0, TAU);
  ctx.fill();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, TAU);
  ctx.fill();
}

function drawSoftGroundShadow(foot, height, airborne) {
  const alpha = clamp(0.18 - airborne * 0.13, 0.045, 0.18);
  ctx.save();
  ctx.translate(foot.x, foot.y + 2);
  ctx.scale(1, 0.34);
  const radius = height * 0.21;
  const gradient = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius);
  gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
  gradient.addColorStop(0.55, `rgba(0,0,0,${alpha * 0.45})`);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawPremiumKeeperRig(world, pose, profile, camera) {
  const visualHeight = profile.visualHeight * 1.18;
  const projection = projectedHeight(world, visualHeight, camera, VIEWPORT);
  if (!projection || projection.height < 8) return;

  const { foot, height: h } = projection;
  drawSoftGroundShadow(foot, h, Number(world.y) || 0);

  const rotation = pose.rotation || 0;
  const crouch = pose.crouch || 0;
  const pelvis = screenPoint(0, -0.335 * h + crouch * h * 0.09);
  const chest = screenPoint((pose.chestX || 0) * h, -0.635 * h + crouch * h * 0.1);
  const headRadius = h * 0.069;
  const neckBase = screenPoint(chest.x, chest.y - h * 0.026);
  const head = screenPoint(neckBase.x, neckBase.y - h * 0.122);
  const shoulderHalf = h * 0.132;
  const hipHalf = h * 0.076;
  const leftShoulder = screenPoint(chest.x - shoulderHalf, chest.y + h * 0.014);
  const rightShoulder = screenPoint(chest.x + shoulderHalf, chest.y + h * 0.014);
  const leftHip = screenPoint(pelvis.x - hipHalf, pelvis.y);
  const rightHip = screenPoint(pelvis.x + hipHalf, pelvis.y);

  const p = (value, fallback) => value
    ? screenPoint(value.x * h, value.y * h)
    : fallback;

  const localAbsolute = (worldPoint) => {
    if (!worldPoint) return null;
    const projected = projectWorld(worldPoint, camera, VIEWPORT);
    if (!projected.visible) return null;
    const dx = projected.x - foot.x;
    const dy = projected.y - foot.y;
    const cosine = Math.cos(-rotation);
    const sine = Math.sin(-rotation);
    return screenPoint(dx * cosine - dy * sine, dx * sine + dy * cosine);
  };

  const leftKnee = p(pose.leftKnee, screenPoint(-0.18 * h, -0.14 * h));
  const rightKnee = p(pose.rightKnee, screenPoint(0.18 * h, -0.14 * h));
  const leftAnkle = p(pose.leftAnkle, screenPoint(-0.22 * h, -0.01 * h));
  const rightAnkle = p(pose.rightAnkle, screenPoint(0.22 * h, -0.01 * h));
  const leftToe = p(pose.leftToe, screenPoint(leftAnkle.x - h * 0.055, leftAnkle.y));
  const rightToe = p(pose.rightToe, screenPoint(rightAnkle.x + h * 0.055, rightAnkle.y));

  const absoluteLeftHand = localAbsolute(pose.absoluteLeftHand);
  const absoluteRightHand = localAbsolute(pose.absoluteRightHand);
  const leftHand = absoluteLeftHand || p(pose.leftHand, screenPoint(-0.39 * h, -0.49 * h));
  const rightHand = absoluteRightHand || p(pose.rightHand, screenPoint(0.39 * h, -0.49 * h));
  const leftElbow = absoluteLeftHand
    ? screenPoint(lerp(leftShoulder.x, leftHand.x, 0.5) - h * 0.035, lerp(leftShoulder.y, leftHand.y, 0.5) + h * 0.025)
    : screenPoint(-0.26 * h, -0.54 * h);
  const rightElbow = absoluteRightHand
    ? screenPoint(lerp(rightShoulder.x, rightHand.x, 0.5) + h * 0.035, lerp(rightShoulder.y, rightHand.y, 0.5) + h * 0.025)
    : screenPoint(0.26 * h, -0.54 * h);

  const skin = "#c99774";
  const jersey = profile.accent;
  const shorts = profile.shorts;
  const gloves = "#f4f7e9";
  const shoes = "#050906";

  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(rotation);

  const legWidth = Math.max(4.8, h * 0.057);
  drawSegment(leftHip, leftKnee, legWidth, shorts);
  drawSegment(leftKnee, leftAnkle, legWidth * 0.88, shorts);
  drawSegment(rightHip, rightKnee, legWidth, shorts);
  drawSegment(rightKnee, rightAnkle, legWidth * 0.88, shorts);
  drawSegment(leftAnkle, leftToe, legWidth * 0.9, shoes);
  drawSegment(rightAnkle, rightToe, legWidth * 0.9, shoes);

  const neckTop = screenPoint(head.x, head.y + headRadius * 0.74);
  drawSegment(neckBase, neckTop, Math.max(3.3, h * 0.05), skin, "rgba(1,5,3,.82)");

  ctx.save();
  ctx.translate((chest.x + pelvis.x) / 2, (chest.y + pelvis.y) / 2);
  ctx.rotate(pose.torsoLean || 0);
  ctx.fillStyle = "rgba(1,5,3,.94)";
  roundedRect(-h * 0.143, -h * 0.184, h * 0.286, h * 0.368, h * 0.058);
  ctx.fill();
  ctx.fillStyle = jersey;
  roundedRect(-h * 0.13, -h * 0.171, h * 0.26, h * 0.342, h * 0.052);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.16)";
  roundedRect(-h * 0.105, -h * 0.145, h * 0.21, h * 0.055, h * 0.018);
  ctx.fill();
  ctx.restore();

  const armWidth = Math.max(4.2, h * 0.049);
  drawJoint(leftShoulder, armWidth * 0.72, jersey);
  drawJoint(rightShoulder, armWidth * 0.72, jersey);
  drawSegment(leftShoulder, leftElbow, armWidth, jersey);
  drawSegment(leftElbow, leftHand, armWidth * 0.92, jersey);
  drawSegment(rightShoulder, rightElbow, armWidth, jersey);
  drawSegment(rightElbow, rightHand, armWidth * 0.92, jersey);

  const cuffRadius = armWidth * 0.58;
  drawJoint(leftHand, cuffRadius * 0.78, "#101812");
  drawJoint(rightHand, cuffRadius * 0.78, "#101812");
  const gloveRadius = armWidth * 0.62 * (pose.gloveScale || 1);
  drawJoint(leftHand, gloveRadius, gloves);
  drawJoint(rightHand, gloveRadius, gloves);

  drawJoint(head, headRadius, skin, "rgba(1,5,3,.92)");
  ctx.fillStyle = "#171713";
  ctx.beginPath();
  ctx.arc(head.x, head.y - headRadius * 0.13, headRadius * 0.88, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(7,17,11,.8)";
  ctx.beginPath();
  ctx.arc(head.x - headRadius * 0.28, head.y + headRadius * 0.07, Math.max(0.7, h * 0.006), 0, TAU);
  ctx.arc(head.x + headRadius * 0.28, head.y + headRadius * 0.07, Math.max(0.7, h * 0.006), 0, TAU);
  ctx.fill();

  ctx.restore();

  window.__footballLabKeeperVisualFrameV381 = {
    build: BUILD,
    keeper: profile.id,
    motion: pose.motion || "READY",
    visualScale: 1.18,
    groundedShadow: "soft-radial",
    wallLayering: "readability-overlay",
    airborne: Number(world.y) > 0.02
  };
}

function redrawBallOnTop(progress, camera) {
  if (!state.animation || !state.shot?.path?.length || progress.motionFlight <= 0) return;
  const world = sampleShotPath(state.shot.path, progress.motionFlight);
  if (!world) return;
  const projected = projectWorld(world, camera, VIEWPORT);
  if (!projected.visible) return;

  const radius = clamp(projected.scale * 0.105, 3.5, 10.2);
  const gradient = ctx.createRadialGradient(
    projected.x - radius * 0.28,
    projected.y - radius * 0.34,
    radius * 0.08,
    projected.x,
    projected.y,
    radius
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "#c7d0c6");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, radius, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "#172019";
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + i * TAU / 5 + progress.motionFlight * 12;
    const x = projected.x + Math.cos(angle) * radius * 0.38;
    const y = projected.y + Math.sin(angle) * radius * 0.38;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function renderPremiumKeeper(time) {
  if (state.screen !== "game" || !state.currentStage) return;
  const progress = progressAt(time);
  const camera = cameraForFrame(time);
  const keeper = premiumKeeperState(progress, time);
  const profile = keeperForStage(state.stage);

  applyCanvasTransform();
  ctx.save();
  applyCameraFeedback(time, progress);
  drawPremiumKeeperRig(keeper.world, keeper.pose, profile, camera);
  redrawBallOnTop(progress, camera);
  ctx.restore();
}

function schedulePremiumKeeperOverlay() {
  const generation = ++overlayGeneration;
  queueMicrotask(() => {
    if (generation !== overlayGeneration) return;
    try {
      renderPremiumKeeper(performance.now());
    } catch (error) {
      console.error("Football Lab V38.1 keeper overlay failed", error);
    }
  });
}

function patchLegacyKeeperRenderer() {
  if (canvasPatched) return;
  canvasPatched = true;

  const originalClearRect = ctx.clearRect.bind(ctx);
  const originalSave = ctx.save.bind(ctx);
  const originalRestore = ctx.restore.bind(ctx);
  const originalEllipse = ctx.ellipse.bind(ctx);
  const originalArc = ctx.arc.bind(ctx);
  const originalFill = ctx.fill.bind(ctx);
  const originalStroke = ctx.stroke.bind(ctx);
  const originalFillText = ctx.fillText.bind(ctx);

  ctx.clearRect = function footballLabClearRectV381(...args) {
    const result = originalClearRect(...args);
    saveDepth = 0;
    legacyKeeperDepth = -1;
    suppressLegacyKeeper = false;
    articulatedShadowIndex = 0;
    suppressContactPulseStroke = 0;
    schedulePremiumKeeperOverlay();
    return result;
  };

  ctx.save = function footballLabSaveV381(...args) {
    saveDepth += 1;
    return originalSave(...args);
  };

  ctx.restore = function footballLabRestoreV381(...args) {
    const result = originalRestore(...args);
    saveDepth = Math.max(0, saveDepth - 1);
    if (suppressLegacyKeeper && saveDepth < legacyKeeperDepth) {
      suppressLegacyKeeper = false;
      legacyKeeperDepth = -1;
    }
    return result;
  };

  ctx.ellipse = function footballLabEllipseV381(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
    const colour = normaliseColour(this.fillStyle);
    const legacyArticulatedShadow = (
      colour === "rgba(0,0,0,0.22)"
      || colour === "rgba(0,0,0,.22)"
    );

    if (state.screen === "game" && legacyArticulatedShadow) {
      if (articulatedShadowIndex === 0) {
        suppressLegacyKeeper = true;
        legacyKeeperDepth = saveDepth;
      }
      articulatedShadowIndex += 1;
    }

    return originalEllipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
  };

  ctx.arc = function footballLabArcV381(x, y, radius, startAngle, endAngle, anticlockwise) {
    const stroke = normaliseColour(this.strokeStyle);
    const width = Number(this.lineWidth) || 0;
    if (
      state.shot?.outcome === "SAVE"
      && stroke.startsWith("rgba(218,254,77,")
      && Math.abs(width - 2.2) < 0.12
      && radius >= 5.5
      && radius <= 28
    ) {
      suppressContactPulseStroke = 1;
      return undefined;
    }
    return originalArc(x, y, radius, startAngle, endAngle, anticlockwise);
  };

  ctx.fill = function footballLabFillV381(...args) {
    if (suppressLegacyKeeper) return undefined;
    return originalFill(...args);
  };

  ctx.stroke = function footballLabStrokeV381(...args) {
    if (suppressLegacyKeeper) return undefined;
    if (suppressContactPulseStroke > 0) {
      suppressContactPulseStroke -= 1;
      return undefined;
    }
    return originalStroke(...args);
  };

  ctx.fillText = function footballLabFillTextV381(...args) {
    if (suppressLegacyKeeper) return undefined;
    return originalFillText(...args);
  };
}

function publishRelease() {
  document.documentElement.dataset.footballLabBuild = "38.1";
  const badge = document.querySelector(".build-badge-v22");
  if (badge) {
    badge.textContent = "V38.1";
    badge.title = "Football Lab build 38.1.0";
  }
  const version = document.querySelector(".settings-version-v22 strong");
  if (version) version.textContent = "38.1.0";

  const previous = window.__footballLabReleaseV371 || window.__footballLabReleaseV370 || {};
  window.__footballLabReleaseV381 = Object.freeze({
    ...previous,
    build: BUILD,
    keeperVisualRig: "premium-athletic-readability-rig",
    keeperLegacyRig: "suppressed",
    keeperOvalMarker: "removed",
    keeperGroundShadow: "soft-radial-no-ring",
    keeperVisualScale: "base-1.18",
    keeperReadyStance: "wide-crouched-balanced",
    keeperDiveMotion: "set-push-stretch-land-recover",
    keeperWallReadability: "post-wall-overlay",
    keeperSleeves: "jersey-colour",
    keeperGloves: "compact-cuffed",
    keeperContactRing: "removed",
    keeperBallLayering: "ball-redrawn-above-keeper",
    aimingChanged: false,
    difficultyChanged: false,
    physicsChanged: false,
    shotOutcomeChanged: false,
    cacheGeneration: "38.1"
  });
}

patchLegacyKeeperRenderer();
setTimeout(publishRelease, 0);
setTimeout(publishRelease, 900);
window.addEventListener("footballlab:trainingstart", publishRelease);
window.addEventListener("footballlab:phasechange", (event) => {
  if (["ready", "aim", "shooting", "result"].includes(event.detail?.phase)) publishRelease();
});

window.__footballLabKeeperVisualsV381 = Object.freeze({
  build: BUILD,
  legacyKeeperSuppressed: true,
  ovalMarkerRemoved: true,
  hardEllipseShadowRemoved: true,
  shadow: "soft-grounded-radial",
  visualScale: 1.18,
  readyStance: "athletic-wide-crouch",
  diveSequence: ["set", "push", "stretch", "contact", "land", "recover"],
  wallReadabilityOverlay: true,
  jerseySleeves: true,
  compactGloves: true,
  contactRingRemoved: true,
  preservesKeeperAI: true,
  preservesShotOutcome: true,
  preservesAiming: true,
  preservesDifficulty: true
});
