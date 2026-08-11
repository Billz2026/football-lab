import {
  clamp, lerp, WORLD, state, elements, ctx, canvasView,
  currentAimTarget, easeInOutCubic, easeOutCubic
} from "./core-v6.js?v=32.3";
import {
  GOAL, PITCH, buildCamera, ballWorld, buildWall, keeperWorld,
  kickerWorld, supportingPlayers
} from "./world-v7.js?v=32.3";
import { projectWorld, projectSegment, projectedHeight } from "./projection-v6.js?v=32.3";
import { sampleShotPath } from "./physics-v7.js?v=7";
import { playKickSound } from "./audio-v6.js?v=7";

let activeCamera;
const viewport = { width: WORLD.width, height: WORLD.height };

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
  if (!state.animation) return { run: 0, flight: 0, complete: false };
  const elapsed = time - state.animation.startedAt;
  return {
    run: clamp(elapsed / state.animation.runUpDuration, 0, 1),
    flight: clamp((elapsed - state.animation.runUpDuration) / state.animation.flightDuration, 0, 1),
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

function applyCameraFeedback(time) {
  if (!state.animation) return;
  const progress = progressAt(time);
  const contact = clamp((progress.flight - 0.005) / 0.085, 0, 1);
  if (contact <= 0 || contact >= 1) return;
  const strength = Math.sin(contact * Math.PI) * 2.2;
  ctx.translate(Math.sin(time * 0.13) * strength, Math.cos(time * 0.17) * strength * 0.5);
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
      ctx.arc(x, 150 + row * 37 + Math.sin(x * 0.1) * 2, 3, 0, Math.PI * 2);
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
    ctx.arc(spot.x, spot.y, Math.max(1.2, spot.scale * 0.065), 0, Math.PI * 2);
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

function drawPerson(world, options = {}) {
  const heightMetres = options.height || 1.8;
  const projection = projectedHeight(world, heightMetres, activeCamera, viewport);
  if (!projection) return;
  const { foot, height } = projection;
  const bodyWidth = height * 0.205;
  const headRadius = height * 0.07;
  const headY = -height;
  const bodyTop = headY + headRadius * 1.8;
  const bodyBottom = -height * 0.29;

  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(options.lean || 0);
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.fillStyle = "rgba(0,0,0,.19)";
  ctx.beginPath();
  ctx.ellipse(0, 3, bodyWidth * 0.6, height * 0.04, 0, 0, Math.PI * 2);
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

  ctx.strokeStyle = options.armColour || options.skinColour || "#c99774";
  ctx.lineWidth = Math.max(3, height * 0.047);
  ctx.beginPath();
  ctx.moveTo(-bodyWidth * 0.4, bodyTop + height * 0.14);
  ctx.lineTo(-bodyWidth * 0.72, bodyTop + height * 0.24);
  ctx.moveTo(bodyWidth * 0.4, bodyTop + height * 0.14);
  ctx.lineTo(bodyWidth * 0.72, bodyTop + height * 0.24);
  ctx.stroke();

  ctx.fillStyle = options.skinColour || "#c99774";
  ctx.beginPath();
  ctx.arc(0, headY + headRadius, headRadius, 0, Math.PI * 2);
  ctx.fill();

  if (options.number) {
    ctx.fillStyle = options.numberColour || "#07110b";
    ctx.font = `900 ${Math.max(8, height * 0.1)}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(String(options.number), 0, bodyTop + (bodyBottom - bodyTop) * 0.58);
  }
  ctx.restore();
}

function drawSupportingPlayers() {
  for (const player of supportingPlayers(state.currentStage)) {
    drawPerson(player, {
      shirtColour: player.team === "attack" ? "#dafe4d" : "#345246",
      shortColour: "#172019",
      height: 1.78,
      alpha: 0.78
    });
  }
}

function drawWallSprayLine() {
  if (state.currentStage.id !== "left20") return;
  const wall = buildWall(state.currentStage);
  const half = ((wall.players.length - 1) * 0.58) / 2 + 0.45;
  const a = {
    x: wall.centre.x - wall.tangent.x * half,
    y: 0.025,
    z: wall.centre.z - wall.tangent.z * half
  };
  const b = {
    x: wall.centre.x + wall.tangent.x * half,
    y: 0.025,
    z: wall.centre.z + wall.tangent.z * half
  };
  lineWorld(a, b, 1.2, "rgba(245,250,243,.32)");
}

function drawWall(time) {
  const wall = buildWall(state.currentStage);
  const progress = progressAt(time);
  const jumpPeak = state.animation ? Math.sin(clamp((progress.flight - 0.28) / 0.32, 0, 1) * Math.PI) : 0;
  const jumpMetres = jumpPeak > 0 ? jumpPeak * 0.3 : 0;
  for (const player of [...wall.players].sort((a, b) => b.z - a.z)) {
    const hit = state.shot.outcome === "WALL" && state.shot.collision?.playerIndex === player.index;
    drawPerson({ ...player, y: jumpMetres }, {
      shirtColour: player.index % 2 ? "#294337" : "#355044",
      shortColour: "#101a13",
      height: 1.84,
      lean: hit ? 0.08 : 0
    });
  }
}

function drawKeeper(time) {
  const idle = keeperWorld(state.currentStage);
  let world = idle;
  let lean = 0;
  if (state.animation && state.shot.keeperPlan) {
    const progress = progressAt(time);
    const plan = state.shot.keeperPlan;
    const reactionFraction = clamp(plan.reaction / Math.max(0.01, plan.flightSeconds), 0.12, 0.7);
    const dive = easeOutCubic(clamp((progress.flight - reactionFraction) / Math.max(0.12, 0.94 - reactionFraction), 0, 1));
    world = {
      x: lerp(idle.x, plan.contact.x, dive),
      y: Math.sin(dive * Math.PI) * 0.26,
      z: lerp(idle.z, plan.contact.z, dive)
    };
    lean = Math.sign(plan.contact.x - idle.x || 1) * dive * 0.55;
  } else {
    world = { ...idle, x: idle.x + Math.sin(time / 620) * 0.16 };
  }
  drawPerson(world, {
    shirtColour: "#dafe4d",
    shortColour: "#16231b",
    armColour: "#f5f7f1",
    height: 1.9,
    lean
  });
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
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
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

function drawKicker(time) {
  const progress = progressAt(time);
  const run = state.animation ? easeInOutCubic(progress.run) : 0;
  const kick = state.animation ? clamp((progress.run - 0.68) / 0.32, 0, 1) : 0;
  drawPerson(kickerWorld(state.currentStage, run), {
    shirtColour: "#dafe4d",
    shortColour: "#111a14",
    height: 1.82,
    number: 10,
    lean: -kick * 0.12
  });
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
  ctx.ellipse(projected.x, projected.y + radius * 0.68, radius * 1.1, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const gradient = ctx.createRadialGradient(projected.x - radius * 0.35, projected.y - radius * 0.4, 1, projected.x, projected.y, radius);
  gradient.addColorStop(0, "#fff");
  gradient.addColorStop(1, "#c7d0c6");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#172019";
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 5 + pathProgress * 12;
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
    ctx.arc(projected.x, projected.y, clamp(projected.scale * 0.055, 1.5, 5.5), 0, Math.PI * 2);
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
  drawBall(time, finishShot);
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
