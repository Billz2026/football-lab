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

const BUILD = "38.5.1";
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
  const baseStart = {
    ...baseIdle,
    z: baseIdle.z + (profile.modifiers?.forwardStart || 0)
  };
  const style = ({
    reflex: { stance: 0.17, idleAmp: 0.068, idleMs: 560, push: 1.13, prepLead: 0.018, reachLead: 0.024, arc: 0.018, trail: 0.04, glove: 0.04 },
    giant: { stance: 0.205, idleAmp: 0.043, idleMs: 900, push: 0.93, prepLead: -0.008, reachLead: -0.006, arc: 0.055, trail: 0.075, glove: 0.025 },
    reader: { stance: 0.18, idleAmp: 0.048, idleMs: 760, push: 1.0, prepLead: 0.04, reachLead: 0.012, arc: 0.025, trail: 0.045, glove: 0.025 },
    aggressive: { stance: 0.175, idleAmp: 0.07, idleMs: 650, push: 1.08, prepLead: 0.022, reachLead: 0.014, arc: 0.016, trail: 0.035, glove: 0.03 },
    academy: { stance: 0.18, idleAmp: 0.058, idleMs: 720, push: 1.0, prepLead: 0, reachLead: 0, arc: 0.02, trail: 0.04, glove: 0.02 }
  })[profile.id] || { stance: 0.18, idleAmp: 0.058, idleMs: 720, push: 1.0, prepLead: 0, reachLead: 0, arc: 0.02, trail: 0.04, glove: 0.02 };

  if (!state.animation || !plan?.contact) {
    const sway = Math.sin(time / style.idleMs) * style.idleAmp;
    const breathe = Math.sin(time / 420) * 0.009;
    const settle = Math.sin(time / (style.idleMs * 0.58)) * 0.012;
    return {
      world: { ...baseStart, x: baseStart.x + sway },
      pose: {
        crouch: 0.115 + breathe,
        torsoLean: settle * 0.18,
        rotation: 0,
        leftKnee: { x: -style.stance, y: -0.135 },
        rightKnee: { x: style.stance, y: -0.135 },
        leftAnkle: { x: -style.stance - 0.045, y: -0.008 },
        rightAnkle: { x: style.stance + 0.045, y: -0.008 },
        leftToe: { x: -style.stance - 0.11, y: 0 },
        rightToe: { x: style.stance + 0.11, y: 0 },
        leftHand: { x: -0.39, y: -0.49 + settle },
        rightHand: { x: 0.39, y: -0.49 - settle },
        gloveScale: 1.02 + style.glove * 0.25,
        motion: "READY",
        saveHeightClass: "SET",
        wrongFooted: false
      }
    };
  }

  const flight = progress.motionFlight;
  const contactPoint = impactRatio();
  const reactionFraction = clamp(
    plan.reaction / Math.max(0.01, plan.flightSeconds || 1),
    0.08,
    0.72
  );
  const committed = plan.start || baseStart;
  const direction = Math.sign(plan.contact.x - baseStart.x || 1);
  const wrongFooted = Boolean(plan.wrongFooted);
  const heightNorm = clamp(Number(plan.contact.y) / GOAL.height, 0, 1);
  const low = smooth01(clamp((0.48 - heightNorm) / 0.34, 0, 1));
  const high = smooth01(clamp((heightNorm - 0.54) / 0.34, 0, 1));
  const mid = clamp(1 - Math.max(low, high), 0, 1);
  const heightClass = high > 0.42 ? "HIGH" : low > 0.42 ? "LOW" : "MID";

  const commit = smooth01(flight / Math.max(0.06, reactionFraction * 0.72));
  const correction = wrongFooted
    ? smooth01((flight - Math.max(0, reactionFraction - 0.1)) / 0.1)
    : 0;
  const committedX = lerp(baseStart.x, committed.x, commit);
  const preLaunchX = wrongFooted
    ? lerp(committedX, baseStart.x + direction * 0.04, correction * 0.82)
    : committedX;
  const coil = smooth01(
    (flight - Math.max(0, reactionFraction - (0.14 + style.prepLead))) / 0.12
  );
  const plant = pulse01((flight - Math.max(0, reactionFraction - 0.105)) / 0.135);
  const push = pulse01((flight - Math.max(0, reactionFraction - 0.025)) / 0.155) * style.push;
  const diveRaw = clamp(
    (flight - reactionFraction) / Math.max(0.1, contactPoint - reactionFraction),
    0,
    1
  );
  const launch = smooth01(diveRaw);
  const landStart = Math.min(0.985, contactPoint + 0.014 + high * 0.024 - low * 0.008);
  const land = smooth01((flight - landStart) / (0.12 + high * 0.04));
  const recovery = smooth01(progress.settle);
  const saveContact = state.shot?.outcome === "SAVE"
    ? smooth01((flight - Math.max(0.1, contactPoint - 0.026)) / 0.052)
    : 0;
  const catchHold = state.shot?.saveType === "CATCH"
    ? smooth01((saveContact - 0.08) / 0.68)
    : 0;
  const parryFollow = state.shot?.saveType === "PARRY"
    ? pulse01((flight - contactPoint) / 0.2)
    : 0;

  const bodyGap = 0.105 + high * 0.115 + low * 0.055 + (profile.id === "giant" ? 0.035 : 0);
  const bodyTargetX = plan.contact.x - direction * bodyGap;
  // V38.5.1: dives travel across goal first, upward second. High saves still rise,
  // but the hips no longer float above the wall and the keeper stays in the goalmouth depth.
  const arcHeight = Math.max(0.075, 0.13 + mid * 0.095 + high * 0.17 - low * 0.045 + style.arc * 0.4);
  const arcPulse = Math.sin(clamp(launch, 0, 1) * Math.PI * 0.68);
  const lateralDrive = smooth01(clamp(diveRaw / Math.max(0.62, 0.74 - high * 0.045 + low * 0.025), 0, 1));
  const landingSlide = direction * land * (0.045 + low * 0.05 + mid * 0.025);
  const committedZ = Number.isFinite(committed.z) ? committed.z : baseStart.z;
  const contactDepth = Number.isFinite(plan.contact.z) ? plan.contact.z : committedZ;
  const depthTarget = clamp(
    lerp(committedZ, contactDepth, profile.id === "aggressive" ? 0.42 : 0.28),
    0.2,
    baseStart.z + (profile.id === "aggressive" ? 0.34 : 0.16)
  );
  const world = {
    x: lerp(preLaunchX, bodyTargetX, lateralDrive) + landingSlide,
    y: Math.max(0, arcPulse * arcHeight + push * (0.022 + high * 0.018)) * (1 - land * 0.985),
    z: lerp(committedZ, depthTarget, launch)
  };

  const reach = smooth01(clamp(
    (diveRaw - Math.max(0.02, 0.07 - style.reachLead)) / Math.max(0.72, 0.88 + style.reachLead),
    0,
    1
  ));
  const trailReach = clamp(reach * (0.88 + style.trail), 0, 1);
  const trailOffsetX = 0.34 - high * 0.1 + low * 0.04;
  const trailOffsetY = low * 0.015 - mid * 0.09 - high * 0.17;
  const leadHand = {
    x: lerp(world.x + direction * 0.13, plan.contact.x, reach),
    y: lerp(world.y + 1.28, plan.contact.y, reach),
    z: lerp(world.z, plan.contact.z, reach)
  };
  const trailHand = {
    x: lerp(world.x - direction * 0.1, plan.contact.x - direction * trailOffsetX, trailReach),
    y: lerp(world.y + 1.15, plan.contact.y + trailOffsetY, trailReach),
    z: lerp(world.z + 0.025, plan.contact.z + 0.035, trailReach)
  };
  const absoluteLeftHand = direction > 0 ? trailHand : leadHand;
  const absoluteRightHand = direction > 0 ? leadHand : trailHand;
  let catchBallWorld = null;

  if (state.shot?.saveType === "CATCH" && saveContact > 0) {
    const cup = smooth01(saveContact / 0.42);
    const chestTarget = {
      x: world.x + direction * 0.02,
      y: world.y + 0.99 + high * 0.08 - low * 0.12,
      z: world.z
    };
    for (const hand of [absoluteLeftHand, absoluteRightHand]) {
      hand.x = lerp(hand.x, plan.contact.x, cup * 0.72);
      hand.y = lerp(hand.y, plan.contact.y, cup * 0.72);
      hand.z = lerp(hand.z, plan.contact.z, cup * 0.72);
      hand.x = lerp(hand.x, chestTarget.x, catchHold * 0.86);
      hand.y = lerp(hand.y, chestTarget.y, catchHold * 0.86);
      hand.z = lerp(hand.z, chestTarget.z, catchHold * 0.86);
    }
    catchBallWorld = {
      x: lerp(plan.contact.x, chestTarget.x, catchHold * 0.9),
      y: lerp(plan.contact.y, chestTarget.y, catchHold * 0.9),
      z: lerp(plan.contact.z, chestTarget.z, catchHold * 0.9)
    };
  } else if (parryFollow > 0) {
    const lead = direction > 0 ? absoluteRightHand : absoluteLeftHand;
    lead.x += direction * parryFollow * (0.22 + (profile.id === "reflex" ? 0.07 : 0));
    lead.y += parryFollow * (high * 0.085 + mid * 0.045 - low * 0.018);
    lead.z += parryFollow * 0.025;
  }

  // High dives remain diagonally athletic instead of rotating into a floating horizontal pose.
  const rotationTarget = direction * (low * 1.28 + mid * 0.98 + high * 0.68);
  const launchRotation = rotationTarget * launch;
  const recoveryTarget = direction * (state.shot?.saveType === "CATCH" ? 0.14 : 0.24);
  const recoveryBlend = Math.max(recovery, land * 0.28);
  const rotation = land > 0
    ? lerp(launchRotation, recoveryTarget, recoveryBlend)
    : launchRotation;

  const stance = style.stance;
  const lateral = direction * launch * (0.065 + low * 0.04);
  const scissor = launch * (0.12 + low * 0.11 + high * 0.035);
  const leftTrail = direction > 0 ? 1 : 0;
  const rightTrail = direction < 0 ? 1 : 0;

  let motion = "SET";
  if (recovery > 0.1) motion = "RECOVER";
  else if (land > 0.22) motion = "LAND";
  else if (state.shot?.saveType === "CATCH" && saveContact > 0.3) motion = "CATCH_SECURE";
  else if (parryFollow > 0.08) motion = "PARRY";
  else if (launch > 0.12) motion = heightClass + "_DIVE";
  else if (plant > 0.18) motion = wrongFooted ? "CORRECT_AND_PLANT" : "PLANT";
  else if (commit > 0.18) motion = wrongFooted ? "WRONG_FOOT_COMMIT" : "READ_SET";

  return {
    world,
    pose: {
      crouch: 0.105 + coil * 0.18 + plant * 0.06 + land * 0.205 + recovery * 0.09 + catchHold * 0.03,
      rotation,
      torsoLean: direction * launch * (0.105 + low * 0.075 - high * 0.018),
      chestX: direction * launch * (0.042 + low * 0.032),
      leftKnee: {
        x: -stance - lateral - direction * push * 0.075,
        y: -0.14 - launch * (0.025 + high * 0.035) + land * 0.065 + (leftTrail ? -plant * 0.018 : plant * 0.025)
      },
      rightKnee: {
        x: stance - lateral + direction * push * 0.075,
        y: -0.14 - launch * (0.02 + high * 0.035) + land * 0.065 + (rightTrail ? -plant * 0.018 : plant * 0.025)
      },
      leftAnkle: {
        x: -stance - 0.045 - direction * launch * (0.16 + low * 0.075) - direction * push * 0.115 - (leftTrail ? scissor * 0.2 : 0),
        y: -0.01 - launch * (leftTrail ? 0.085 + high * 0.026 : 0.018 + low * 0.025) + land * 0.05
      },
      rightAnkle: {
        x: stance + 0.045 - direction * launch * (0.16 + low * 0.075) + direction * push * 0.115 + (rightTrail ? scissor * 0.2 : 0),
        y: -0.01 - launch * (rightTrail ? 0.085 + high * 0.026 : 0.018 + low * 0.025) + land * 0.05
      },
      leftToe: { x: -stance - 0.11 - direction * launch * (0.18 + low * 0.06), y: -0.005 },
      rightToe: { x: stance + 0.11 - direction * launch * (0.18 + low * 0.06), y: -0.005 },
      absoluteLeftHand,
      absoluteRightHand,
      catchBallWorld,
      gloveScale: 1.05 + style.glove + (state.shot?.saveType === "CATCH" ? 0.07 : 0),
      motion,
      recovery,
      saveHeightClass: heightClass,
      wrongFooted,
      archetype: profile.id
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
  const visualHeight = profile.visualHeight * 1.20;
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
    visualScale: 1.20,
    groundedShadow: "soft-radial",
    wallLayering: "readability-overlay",
    airborne: Number(world.y) > 0.02
  };
}

function redrawBallOnTop(progress, camera, keeper) {
  if (!state.animation || !state.shot?.path?.length || progress.motionFlight <= 0) return;
  let world = sampleShotPath(state.shot.path, progress.motionFlight);
  if (!world) return;
  const impact = impactRatio();
  if (
    state.shot?.outcome === "SAVE"
    && state.shot?.saveType === "CATCH"
    && progress.motionFlight >= impact
    && keeper?.pose?.catchBallWorld
  ) {
    const lock = smooth01((progress.motionFlight - impact) / 0.055);
    const held = keeper.pose.catchBallWorld;
    world = {
      x: lerp(world.x, held.x, lock),
      y: lerp(world.y, held.y, lock),
      z: lerp(world.z, held.z, lock)
    };
  }
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
  redrawBallOnTop(progress, camera, keeper);
  ctx.restore();
}

function schedulePremiumKeeperOverlay() {
  const generation = ++overlayGeneration;
  queueMicrotask(() => {
    if (generation !== overlayGeneration) return;
    try {
      renderPremiumKeeper(performance.now());
    } catch (error) {
      console.error("Football Lab V38.5.1 keeper overlay failed", error);
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
    keeperVisualScale: "base-1.20",
    keeperReadyStance: "wide-crouched-balanced",
    keeperDiveMotion: "weighted-read-commit-correct-plant-lateral-height-dive-contact-shoulder-land-slide-recover",
    keeperMotionCorrection: "38.5.1-weight-depth-lateral",
    keeperDepthModel: "goalmouth-clamped",
    keeperWallReadability: "post-wall-overlay",
    keeperSleeves: "jersey-colour",
    keeperGloves: "compact-cuffed",
    keeperContactRing: "removed",
    keeperBallLayering: "ball-redrawn-above-keeper",
    aimingChanged: false,
    difficultyChanged: false,
    physicsChanged: false,
    shotOutcomeChanged: false,
    cacheGeneration: "38.5.1"
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
  motionCorrection: "38.5.1-weight-depth-lateral",
  legacyKeeperSuppressed: true,
  ovalMarkerRemoved: true,
  hardEllipseShadowRemoved: true,
  shadow: "soft-grounded-radial",
  visualScale: 1.18,
  readyStance: "athletic-wide-crouch",
  diveSequence: ["read", "commit", "correct", "plant", "lateral-push", "low-mid-high-dive", "contact", "shoulder-land", "slide", "recover"],
  wallReadabilityOverlay: true,
  jerseySleeves: true,
  compactGloves: true,
  contactRingRemoved: true,
  preservesKeeperAI: true,
  preservesShotOutcome: true,
  preservesAiming: true,
  preservesDifficulty: true
});


window.__footballLabKeeperVisualsV385 = Object.freeze({ ...window.__footballLabKeeperVisualsV381, build: BUILD, archetypeMotion: true, wrongFootAnimation: true, heightClassifiedDives: true, catchSecureBall: true, parryFollowThrough: true });
