import {
  clamp, lerp, WORLD, state, elements, ctx, canvasView,
  easeInOutCubic, easeOutCubic
} from "./core-v6.js?v=32.2";
import {
  buildCamera, ballWorld, buildWall, keeperWorld, kickerWorld
} from "./world-v7.js?v=32.2";
import { projectWorld, projectedHeight } from "./projection-v6.js?v=32.2";

const viewport = { width: WORLD.width, height: WORLD.height };
const TAU = Math.PI * 2;

function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function pulse01(value) {
  const t = clamp(value, 0, 1);
  return Math.sin(t * Math.PI);
}

function applyTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function progressAt(time) {
  if (!state.animation) return { run: 0, flight: 0, elapsed: 0, complete: false };
  const elapsed = time - state.animation.startedAt;
  return {
    run: clamp(elapsed / Math.max(1, state.animation.runUpDuration), 0, 1),
    flight: clamp((elapsed - state.animation.runUpDuration) / Math.max(1, state.animation.flightDuration), 0, 1),
    elapsed,
    complete: elapsed >= state.animation.totalDuration
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

function point(x, y) { return { x, y }; }

function mixPoint(a, b, t) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function drawLimb(a, b, width, colour, outline = "rgba(3,9,6,.72)") {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = outline;
  ctx.lineWidth = width + Math.max(1.5, width * 0.42);
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

function drawJoint(p, radius, colour, outline = "rgba(3,9,6,.72)") {
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius + Math.max(1.2, radius * 0.42), 0, TAU);
  ctx.fill();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, TAU);
  ctx.fill();
}

function drawShoe(ankle, toe, width, colour = "#0b130e") {
  drawLimb(ankle, toe, width, colour, "rgba(1,5,3,.85)");
}

function drawTorso(center, width, height, lean, colour, number = null) {
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(lean);
  ctx.fillStyle = "rgba(2,7,4,.76)";
  roundedRect(-width * 0.56, -height * 0.53, width * 1.12, height * 1.08, width * 0.28);
  ctx.fill();
  ctx.fillStyle = colour;
  roundedRect(-width * 0.5, -height * 0.5, width, height, width * 0.24);
  ctx.fill();
  if (number !== null) {
    ctx.fillStyle = "#07110b";
    ctx.font = `900 ${Math.max(8, width * 0.55)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(number), 0, height * 0.04);
  }
  ctx.restore();
}

function drawHead(center, radius, skin = "#c99774") {
  ctx.fillStyle = "rgba(2,7,4,.72)";
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius * 1.16, 0, TAU);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, TAU);
  ctx.fill();
}

function drawShadow(foot, width, alpha = 0.24) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(foot.x, foot.y + 3, width, width * 0.24, 0, 0, TAU);
  ctx.fill();
}

function drawArticulatedPlayer(world, pose, colours, camera, heightMetres = 1.82) {
  const projection = projectedHeight(world, heightMetres, camera, viewport);
  if (!projection) return;
  const { foot, height } = projection;
  const h = height;
  const skin = colours.skin || "#c99774";
  const shirt = colours.shirt || "#dafe4d";
  const shorts = colours.shorts || "#111a14";
  const shoe = colours.shoe || "#07110b";
  const arm = colours.arm || skin;

  ctx.save();
  ctx.globalAlpha = pose.alpha ?? 1;
  ctx.translate(foot.x, foot.y - (pose.liftPx || 0));
  if (pose.bodyRotation) ctx.rotate(pose.bodyRotation);

  const pelvis = point((pose.pelvisX || 0) * h, -0.31 * h + (pose.crouch || 0) * h * 0.12);
  const chest = point((pose.chestX || 0) * h, -0.67 * h + (pose.crouch || 0) * h * 0.15);
  const neck = point(chest.x, -0.81 * h + (pose.crouch || 0) * h * 0.12);
  const head = point(neck.x + (pose.headX || 0) * h, -0.91 * h + (pose.crouch || 0) * h * 0.1);
  const shoulderHalf = 0.13 * h;
  const hipHalf = 0.075 * h;
  const leftShoulder = point(chest.x - shoulderHalf, chest.y + 0.015 * h);
  const rightShoulder = point(chest.x + shoulderHalf, chest.y + 0.015 * h);
  const leftHip = point(pelvis.x - hipHalf, pelvis.y);
  const rightHip = point(pelvis.x + hipHalf, pelvis.y);

  const localPoint = (value, fallback) => value ? point(value.x * h, value.y * h) : fallback;
  const leftKnee = localPoint(pose.leftKnee, point(-0.11 * h, -0.15 * h));
  const rightKnee = localPoint(pose.rightKnee, point(0.11 * h, -0.15 * h));
  const leftAnkle = localPoint(pose.leftAnkle, point(-0.13 * h, -0.01 * h));
  const rightAnkle = localPoint(pose.rightAnkle, point(0.13 * h, -0.01 * h));
  const leftToe = localPoint(pose.leftToe, point(leftAnkle.x - 0.045 * h, leftAnkle.y + 0.005 * h));
  const rightToe = localPoint(pose.rightToe, point(rightAnkle.x + 0.045 * h, rightAnkle.y + 0.005 * h));

  const leftElbow = localPoint(pose.leftElbow, point(-0.22 * h, -0.55 * h));
  const rightElbow = localPoint(pose.rightElbow, point(0.22 * h, -0.55 * h));
  const leftHand = localPoint(pose.leftHand, point(-0.26 * h, -0.42 * h));
  const rightHand = localPoint(pose.rightHand, point(0.26 * h, -0.42 * h));

  drawShadow(point(0, 0), 0.14 * h, pose.shadowAlpha ?? 0.22);

  const legWidth = Math.max(4.2, 0.052 * h);
  drawLimb(leftHip, leftKnee, legWidth, shorts);
  drawLimb(leftKnee, leftAnkle, legWidth * 0.86, shorts);
  drawLimb(rightHip, rightKnee, legWidth, shorts);
  drawLimb(rightKnee, rightAnkle, legWidth * 0.86, shorts);
  drawShoe(leftAnkle, leftToe, legWidth * 0.9, shoe);
  drawShoe(rightAnkle, rightToe, legWidth * 0.9, shoe);

  drawTorso(mixPoint(chest, pelvis, 0.48), 0.27 * h, 0.39 * h, pose.torsoLean || 0, shirt, pose.number ?? null);

  const armWidth = Math.max(3.8, 0.043 * h);
  drawLimb(leftShoulder, leftElbow, armWidth, arm);
  drawLimb(leftElbow, leftHand, armWidth * 0.88, arm);
  drawLimb(rightShoulder, rightElbow, armWidth, arm);
  drawLimb(rightElbow, rightHand, armWidth * 0.88, arm);
  drawJoint(leftHand, armWidth * 0.58, pose.gloveColour || skin);
  drawJoint(rightHand, armWidth * 0.58, pose.gloveColour || skin);
  drawHead(head, 0.073 * h, skin);

  ctx.restore();
}

function kickerPose(progress, time, isReplay) {
  const run = progress.run;
  const flight = progress.flight;
  const idle = !state.animation;
  const breath = idle ? Math.sin(time / 530) * 0.008 : 0;
  const pose = {
    number: 10,
    crouch: 0,
    torsoLean: 0,
    chestX: 0,
    headX: 0,
    bodyRotation: 0,
    shadowAlpha: 0.23
  };

  if (idle) {
    pose.crouch = 0.04 + breath;
    pose.leftKnee = point(-0.095, -0.145);
    pose.rightKnee = point(0.095, -0.145);
    pose.leftAnkle = point(-0.12, -0.005);
    pose.rightAnkle = point(0.12, -0.005);
    pose.leftHand = point(-0.25, -0.43);
    pose.rightHand = point(0.25, -0.43);
    return pose;
  }

  if (isReplay) {
    pose.torsoLean = -0.1;
    pose.leftKnee = point(-0.08, -0.15);
    pose.leftAnkle = point(-0.11, -0.005);
    pose.rightKnee = point(0.18, -0.30);
    pose.rightAnkle = point(0.29, -0.18);
    pose.rightToe = point(0.36, -0.15);
    pose.leftHand = point(-0.29, -0.46);
    pose.rightHand = point(0.30, -0.55);
    return pose;
  }

  if (run < 0.58) {
    const stride = Math.sin(run * Math.PI * 4.2);
    const strideAbs = Math.abs(stride);
    pose.crouch = 0.03 + strideAbs * 0.025;
    pose.torsoLean = -0.035 - run * 0.08;
    pose.chestX = run * 0.018;
    pose.leftKnee = point(-0.10 - stride * 0.055, -0.15 - Math.max(0, stride) * 0.07);
    pose.rightKnee = point(0.10 + stride * 0.055, -0.15 - Math.max(0, -stride) * 0.07);
    pose.leftAnkle = point(-0.13 - stride * 0.075, -0.005 - Math.max(0, stride) * 0.02);
    pose.rightAnkle = point(0.13 + stride * 0.075, -0.005 - Math.max(0, -stride) * 0.02);
    pose.leftHand = point(-0.25 + stride * 0.055, -0.44 - stride * 0.03);
    pose.rightHand = point(0.25 + stride * 0.055, -0.44 + stride * 0.03);
  } else if (run < 0.82) {
    const plant = smooth01((run - 0.58) / 0.24);
    pose.crouch = lerp(0.04, 0.09, plant);
    pose.torsoLean = lerp(-0.08, -0.18, plant);
    pose.chestX = lerp(0.01, -0.025, plant);
    pose.leftKnee = point(lerp(-0.10, -0.17, plant), lerp(-0.15, -0.13, plant));
    pose.leftAnkle = point(lerp(-0.13, -0.23, plant), -0.005);
    pose.leftToe = point(lerp(-0.17, -0.28, plant), -0.002);
    pose.rightKnee = point(lerp(0.10, 0.19, plant), lerp(-0.15, -0.29, plant));
    pose.rightAnkle = point(lerp(0.13, 0.22, plant), lerp(-0.005, -0.18, plant));
    pose.rightToe = point(lerp(0.18, 0.28, plant), lerp(0, -0.16, plant));
    pose.leftHand = point(lerp(-0.25, -0.33, plant), lerp(-0.44, -0.49, plant));
    pose.rightHand = point(lerp(0.25, 0.31, plant), lerp(-0.44, -0.58, plant));
  } else {
    const strike = smooth01((run - 0.82) / 0.18);
    const snap = easeOutCubic(strike);
    pose.crouch = lerp(0.09, 0.035, snap);
    pose.torsoLean = lerp(-0.18, 0.055, snap);
    pose.bodyRotation = lerp(-0.035, 0.055, snap);
    pose.leftKnee = point(-0.17, -0.13);
    pose.leftAnkle = point(-0.23, -0.005);
    pose.leftToe = point(-0.29, -0.002);
    pose.rightKnee = point(lerp(0.19, 0.07, snap), lerp(-0.29, -0.22, snap));
    pose.rightAnkle = point(lerp(0.22, -0.01, snap), lerp(-0.18, -0.24, snap));
    pose.rightToe = point(lerp(0.28, -0.09, snap), lerp(-0.16, -0.22, snap));
    pose.leftHand = point(lerp(-0.33, -0.28, snap), lerp(-0.49, -0.40, snap));
    pose.rightHand = point(lerp(0.31, 0.38, snap), lerp(-0.58, -0.46, snap));
  }

  if (flight > 0) {
    const follow = smooth01(clamp(flight / 0.28, 0, 1));
    const recover = smooth01(clamp((flight - 0.28) / 0.34, 0, 1));
    pose.torsoLean = lerp(0.055, 0.16, follow) * (1 - recover) + lerp(0.16, 0.01, recover);
    pose.bodyRotation = lerp(0.055, 0.11, follow) * (1 - recover);
    pose.crouch = lerp(0.035, 0.02, follow) + recover * 0.02;
    pose.leftKnee = point(-0.16 + recover * 0.06, -0.13);
    pose.leftAnkle = point(-0.22 + recover * 0.10, -0.005);
    pose.leftToe = point(-0.28 + recover * 0.12, -0.002);
    pose.rightKnee = point(lerp(0.07, -0.03, follow), lerp(-0.22, -0.33, follow));
    pose.rightAnkle = point(lerp(-0.01, -0.15, follow), lerp(-0.24, -0.28, follow));
    pose.rightToe = point(lerp(-0.09, -0.22, follow), lerp(-0.22, -0.25, follow));
    pose.leftHand = point(lerp(-0.28, -0.34, follow), lerp(-0.40, -0.50, follow));
    pose.rightHand = point(lerp(0.38, 0.29, follow), lerp(-0.46, -0.36, follow));
    if (recover > 0) {
      pose.rightKnee = mixPoint(pose.rightKnee, point(0.10, -0.15), recover);
      pose.rightAnkle = mixPoint(pose.rightAnkle, point(0.13, -0.005), recover);
      pose.rightToe = mixPoint(pose.rightToe, point(0.18, 0), recover);
      pose.leftKnee = mixPoint(pose.leftKnee, point(-0.10, -0.15), recover);
      pose.leftAnkle = mixPoint(pose.leftAnkle, point(-0.13, -0.005), recover);
      pose.leftToe = mixPoint(pose.leftToe, point(-0.18, 0), recover);
      pose.leftHand = mixPoint(pose.leftHand, point(-0.25, -0.43), recover);
      pose.rightHand = mixPoint(pose.rightHand, point(0.25, -0.43), recover);
    }
  }

  return pose;
}

function wallPose(progress, playerIndex, hit) {
  const flight = progress.flight;
  const stagger = playerIndex * 0.012;
  const crouchIn = smooth01((flight - (0.10 + stagger)) / 0.12);
  const jumpUp = smooth01((flight - (0.22 + stagger)) / 0.12);
  const land = smooth01((flight - (0.56 + stagger)) / 0.12);
  const baseJumpWindow = clamp((flight - 0.28) / 0.32, 0, 1);
  const jump = Math.sin(baseJumpWindow * Math.PI);
  const hitPulse = hit ? pulse01((flight - 0.42) / 0.28) : 0;
  const pose = {
    crouch: crouchIn * (1 - jumpUp) * 0.12 + land * (1 - smooth01((flight - 0.7) / 0.16)) * 0.09,
    liftPx: 0,
    torsoLean: (playerIndex % 2 ? -1 : 1) * hitPulse * 0.12,
    bodyRotation: (playerIndex % 2 ? -1 : 1) * hitPulse * 0.055,
    leftKnee: point(-0.09, -0.145 + crouchIn * 0.025),
    rightKnee: point(0.09, -0.145 + crouchIn * 0.025),
    leftAnkle: point(-0.11, -0.004),
    rightAnkle: point(0.11, -0.004),
    leftToe: point(-0.15, 0),
    rightToe: point(0.15, 0),
    leftElbow: point(-0.16, -0.55),
    rightElbow: point(0.16, -0.55),
    leftHand: point(-0.09, -0.41),
    rightHand: point(0.09, -0.41),
    jumpMetres: jump * 0.30
  };
  if (jump > 0.02) {
    pose.leftKnee = point(-0.07, -0.19 - jump * 0.025);
    pose.rightKnee = point(0.07, -0.19 - jump * 0.025);
    pose.leftAnkle = point(-0.09, -0.08 - jump * 0.015);
    pose.rightAnkle = point(0.09, -0.08 - jump * 0.015);
    pose.leftToe = point(-0.13, -0.07 - jump * 0.015);
    pose.rightToe = point(0.13, -0.07 - jump * 0.015);
    pose.leftHand = point(-0.08, -0.43 - jump * 0.02);
    pose.rightHand = point(0.08, -0.43 - jump * 0.02);
  }
  if (hitPulse > 0) {
    const side = playerIndex % 2 ? -1 : 1;
    pose.leftHand = point(-0.16 - side * hitPulse * 0.05, -0.50 + hitPulse * 0.08);
    pose.rightHand = point(0.16 - side * hitPulse * 0.05, -0.50 + hitPulse * 0.08);
    pose.chestX = side * hitPulse * 0.035;
  }
  return pose;
}

function impactRatio(shot) {
  if (!shot?.path?.length) return 0.92;
  if (Number.isInteger(shot.impactIndex)) {
    return clamp(shot.impactIndex / Math.max(1, shot.path.length - 1), 0.08, 0.99);
  }
  return 0.94;
}

function keeperPose(progress, time, plan) {
  const idleWorld = keeperWorld(state.currentStage);
  if (!state.animation || !plan) {
    const sway = Math.sin(time / 540);
    return {
      world: { ...idleWorld, x: idleWorld.x + sway * 0.11 },
      pose: {
        crouch: 0.06 + Math.abs(Math.sin(time / 430)) * 0.025,
        torsoLean: sway * 0.025,
        leftKnee: point(-0.11, -0.14),
        rightKnee: point(0.11, -0.14),
        leftAnkle: point(-0.14, -0.005),
        rightAnkle: point(0.14, -0.005),
        leftHand: point(-0.27, -0.49),
        rightHand: point(0.27, -0.49),
        gloveColour: "#f4ffbf",
        shadowAlpha: 0.25
      }
    };
  }

  const reactionFraction = clamp(plan.reaction / Math.max(0.01, plan.flightSeconds), 0.08, 0.72);
  const flight = progress.flight;
  const coil = smooth01((flight - Math.max(0, reactionFraction - 0.13)) / 0.12) * (1 - smooth01((flight - reactionFraction) / 0.08));
  const launch = easeOutCubic(clamp((flight - reactionFraction) / Math.max(0.12, 0.94 - reactionFraction), 0, 1));
  const impact = impactRatio(state.shot);
  const contactPulse = pulse01((flight - Math.max(reactionFraction, impact - 0.06)) / 0.16);
  const landing = smooth01((flight - Math.min(0.9, impact + 0.045)) / 0.16);
  const direction = Math.sign(plan.contact.x - idleWorld.x || 1);
  const world = {
    x: lerp(idleWorld.x, plan.contact.x, launch),
    y: Math.sin(launch * Math.PI) * 0.26,
    z: lerp(idleWorld.z, plan.contact.z, launch)
  };

  const pose = {
    crouch: coil * 0.16 + landing * 0.10,
    bodyRotation: direction * lerp(0, 0.92, launch) * (1 - landing * 0.22),
    torsoLean: direction * lerp(0, 0.16, launch),
    chestX: direction * launch * 0.035,
    headX: direction * launch * 0.018,
    gloveColour: "#f4ffbf",
    leftKnee: point(-0.11, -0.14),
    rightKnee: point(0.11, -0.14),
    leftAnkle: point(-0.14, -0.005),
    rightAnkle: point(0.14, -0.005),
    leftToe: point(-0.19, 0),
    rightToe: point(0.19, 0),
    leftElbow: point(-0.21, -0.58),
    rightElbow: point(0.21, -0.58),
    leftHand: point(-0.31, -0.49),
    rightHand: point(0.31, -0.49),
    shadowAlpha: 0.26
  };

  if (coil > 0) {
    pose.leftKnee = point(-0.13, -0.115);
    pose.rightKnee = point(0.13, -0.115);
    pose.leftHand = point(-0.30, -0.44);
    pose.rightHand = point(0.30, -0.44);
  }

  if (launch > 0) {
    const lead = direction > 0 ? "right" : "left";
    const trail = direction > 0 ? "left" : "right";
    pose[`${lead}Knee`] = point(direction * 0.06, -0.20 - launch * 0.05);
    pose[`${lead}Ankle`] = point(direction * 0.16, -0.18 - launch * 0.08);
    pose[`${lead}Toe`] = point(direction * 0.22, -0.16 - launch * 0.08);
    pose[`${trail}Knee`] = point(-direction * 0.15, -0.22 + launch * 0.03);
    pose[`${trail}Ankle`] = point(-direction * 0.25, -0.13 + launch * 0.03);
    pose[`${trail}Toe`] = point(-direction * 0.31, -0.11 + launch * 0.03);

    const reach = clamp(launch * 1.18, 0, 1);
    pose[`${lead}Elbow`] = point(lerp(direction * 0.13, direction * 0.29, reach), lerp(-0.64, -0.69, reach));
    pose[`${lead}Hand`] = point(lerp(direction * 0.25, direction * 0.45, reach), lerp(-0.52, -0.72, reach));
    pose[`${trail}Elbow`] = point(lerp(-direction * 0.13, direction * 0.12, reach), lerp(-0.61, -0.67, reach));
    pose[`${trail}Hand`] = point(lerp(-direction * 0.25, direction * 0.30, reach), lerp(-0.49, -0.65, reach));

    if (plan.saveType === "CATCH") {
      pose.leftHand = point(direction * 0.34, -0.68);
      pose.rightHand = point(direction * 0.39, -0.68);
    } else if (contactPulse > 0) {
      pose[`${lead}Hand`] = point(direction * (0.45 + contactPulse * 0.035), -0.72 - contactPulse * 0.02);
    }
  }

  if (landing > 0) {
    pose.bodyRotation = direction * lerp(0.92, 0.58, landing);
    pose.crouch = lerp(pose.crouch, 0.14, landing);
    pose.leftKnee = mixPoint(pose.leftKnee, point(-0.06, -0.11), landing);
    pose.rightKnee = mixPoint(pose.rightKnee, point(0.06, -0.11), landing);
    pose.leftAnkle = mixPoint(pose.leftAnkle, point(-0.18, -0.04), landing);
    pose.rightAnkle = mixPoint(pose.rightAnkle, point(0.18, -0.04), landing);
  }

  return { world, pose, contactPulse, direction };
}

function drawKicker(time, camera, progress) {
  if (state.screen !== "game") return;
  const isReplay = Boolean(state.animation?.isReplay);
  const run = state.animation && !isReplay ? easeInOutCubic(progress.run) : (isReplay ? 1 : 0);
  drawArticulatedPlayer(kickerWorld(state.currentStage, run), kickerPose(progress, time, isReplay), {
    shirt: "#dafe4d",
    shorts: "#111a14",
    shoe: "#07110b",
    skin: "#c99774"
  }, camera, 1.84);
}

function drawWall(camera, progress) {
  if (state.screen !== "game") return;
  const wall = buildWall(state.currentStage);
  const players = [...wall.players].sort((a, b) => b.z - a.z);
  for (const player of players) {
    const hit = state.shot?.outcome === "WALL" && state.shot?.collision?.playerIndex === player.index;
    const pose = wallPose(progress, player.index, hit);
    const world = { ...player, y: pose.jumpMetres || 0 };
    delete pose.jumpMetres;
    drawArticulatedPlayer(world, pose, {
      shirt: player.index % 2 ? "#294337" : "#355044",
      shorts: "#101a13",
      shoe: "#07110b",
      skin: "#c99774"
    }, camera, 1.86);
  }
}

function drawKeeper(time, camera, progress) {
  if (state.screen !== "game") return;
  const plan = state.shot?.keeperPlan;
  const result = keeperPose(progress, time, plan);
  drawArticulatedPlayer(result.world, result.pose, {
    shirt: "#dafe4d",
    shorts: "#16231b",
    shoe: "#07110b",
    skin: "#c99774",
    arm: "#eff5eb"
  }, camera, 1.92);

  if (plan && state.animation && result.contactPulse > 0.01) {
    const contact = projectWorld(plan.contact, camera, viewport);
    if (contact.visible) {
      const radius = clamp(contact.scale * 0.17, 8, 18);
      ctx.save();
      ctx.globalAlpha = 1 - result.contactPulse * 0.45;
      ctx.strokeStyle = "rgba(218,254,77,.88)";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(contact.x, contact.y, radius + result.contactPulse * 12, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "rgba(244,255,191,.95)";
      ctx.beginPath();
      ctx.ellipse(contact.x, contact.y, radius * 0.58, radius * 0.42, result.direction * 0.25, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawKickContact(camera, progress) {
  if (!state.animation || state.animation.isReplay) return;
  const contact = clamp((progress.run - 0.885) / 0.115, 0, 1);
  if (contact <= 0 || contact >= 1) return;
  const pulse = Math.sin(contact * Math.PI);
  const ball = projectWorld(ballWorld(state.currentStage), camera, viewport);
  if (!ball.visible) return;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = "rgba(218,254,77,.72)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 8 + pulse * 10, 0, TAU);
  ctx.stroke();
  const angles = [-2.75, -2.25, -1.85, -1.35, -0.95];
  for (let i = 0; i < angles.length; i += 1) {
    const angle = angles[i];
    const distance = 7 + pulse * (12 + i * 2.5);
    const x = ball.x + Math.cos(angle) * distance;
    const y = ball.y + Math.sin(angle) * distance * 0.55;
    ctx.fillStyle = `rgba(192,218,154,${0.7 - i * 0.09})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.4 + pulse * 0.9, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function animationFrame(time) {
  requestAnimationFrame(animationFrame);
  if (state.screen !== "game" || !elements.canvas.width || !elements.canvas.height) return;
  if (["breakdown", "stage"].includes(state.presentation?.phase)) return;

  const progress = progressAt(time);
  const camera = cameraForFrame(time);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  applyTransform();
  drawKeeper(time, camera, progress);
  drawWall(camera, progress);
  drawKicker(time, camera, progress);
  drawKickContact(camera, progress);
  ctx.restore();
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

requestAnimationFrame(animationFrame);
