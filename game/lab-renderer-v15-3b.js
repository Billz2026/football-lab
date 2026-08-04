import {
  clamp, lerp, WORLD, state, elements, ctx, canvasView, currentAimTarget
} from "./core-v6.js?v=7";
import {
  GOAL, PITCH, buildCamera, ballWorld, keeperWorld, kickerWorld
} from "./world-v7.js?v=7";
import { projectWorld, projectSegment, projectedHeight } from "./projection-v6.js?v=7";
import { activeCharacter } from "./characters-v13.js?v=13";
import { buildWallLayout, keeperForStage, wallForStage } from "./lab-matchups-v15-3.js?v=153";

const viewport = { width: WORLD.width, height: WORLD.height };
const TAU = Math.PI * 2;
let activeCamera = null;
let lastFinishedId = null;

export function resizeCanvas() {
  const rect = elements.canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  canvasView.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
  elements.canvas.width = Math.round(rect.width * canvasView.dpr);
  elements.canvas.height = Math.round(rect.height * canvasView.dpr);
  canvasView.scale = Math.min(rect.width / WORLD.width, rect.height / WORLD.height);
  canvasView.offsetX = (rect.width - WORLD.width * canvasView.scale) / 2;
  canvasView.offsetY = (rect.height - WORLD.height * canvasView.scale) / 2;
}

function applyTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function smooth(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function animationProgress(time) {
  const animation = state.animation;
  if (!animation) return { run: 0, flight: 0, settle: 0, complete: false };
  const elapsed = time - animation.startedAt;
  const runUp = Math.max(1, animation.runUpDuration || 1);
  const hold = Math.max(0, animation.contactHoldDuration || 0);
  const flightDuration = Math.max(1, animation.flightDuration || 1);
  const flightStart = runUp + hold;
  const flightEnd = flightStart + flightDuration;
  return {
    run: clamp(elapsed / runUp, 0, 1),
    flight: clamp((elapsed - flightStart) / flightDuration, 0, 1),
    settle: clamp((elapsed - flightEnd) / Math.max(1, animation.settleDuration || 1), 0, 1),
    complete: elapsed >= animation.totalDuration
  };
}

function samplePath(path, progress) {
  if (!path?.length) return null;
  const scaled = clamp(progress, 0, 1) * (path.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(path.length - 1, lower + 1);
  const mix = scaled - lower;
  return {
    x: lerp(path[lower].x, path[upper].x, mix),
    y: lerp(path[lower].y, path[upper].y, mix),
    z: lerp(path[lower].z, path[upper].z, mix)
  };
}

function project(point) {
  return projectWorld(point, activeCamera, viewport);
}

function line3d(a, b, stroke, width = 2, alpha = 1) {
  const segment = projectSegment(a, b, activeCamera, viewport);
  if (!segment) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(segment.a.x, segment.a.y);
  ctx.lineTo(segment.b.x, segment.b.y);
  ctx.stroke();
  ctx.restore();
}

function polygon3d(points, fill, stroke = null, width = 1) {
  const projected = points.map(project);
  if (projected.some((point) => !point.visible)) return;
  ctx.beginPath();
  ctx.moveTo(projected[0].x, projected[0].y);
  projected.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  gradient.addColorStop(0, "#06150d");
  gradient.addColorStop(0.42, "#0a2115");
  gradient.addColorStop(1, "#123b24");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = "rgba(1,6,3,.72)";
  ctx.fillRect(0, 92, WORLD.width, 205);
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 36; column += 1) {
      ctx.fillStyle = `rgba(129,177,132,${0.09 + ((row + column) % 3) * 0.025})`;
      ctx.beginPath();
      ctx.arc(28 + column * 34 + (row % 2) * 8, 132 + row * 34, 3.2, 0, TAU);
      ctx.fill();
    }
  }
}

function drawPitch() {
  polygon3d([
    { x: -PITCH.halfWidth, y: 0, z: 0 },
    { x: PITCH.halfWidth, y: 0, z: 0 },
    { x: PITCH.halfWidth, y: 0, z: state.currentStage.distanceYards * 0.9144 + 15 },
    { x: -PITCH.halfWidth, y: 0, z: state.currentStage.distanceYards * 0.9144 + 15 }
  ], "#164b2c");

  for (let z = 0; z < state.currentStage.distanceYards * 0.9144 + 15; z += 6) {
    polygon3d([
      { x: -PITCH.halfWidth, y: 0.003, z },
      { x: PITCH.halfWidth, y: 0.003, z },
      { x: PITCH.halfWidth, y: 0.003, z: z + 3 },
      { x: -PITCH.halfWidth, y: 0.003, z: z + 3 }
    ], "rgba(255,255,255,.025)");
  }

  const marking = "rgba(225,242,222,.72)";
  line3d({ x: -PITCH.penaltyHalfWidth, y: 0.02, z: 0 }, { x: -PITCH.penaltyHalfWidth, y: 0.02, z: PITCH.penaltyDepth }, marking, 2);
  line3d({ x: PITCH.penaltyHalfWidth, y: 0.02, z: 0 }, { x: PITCH.penaltyHalfWidth, y: 0.02, z: PITCH.penaltyDepth }, marking, 2);
  line3d({ x: -PITCH.penaltyHalfWidth, y: 0.02, z: PITCH.penaltyDepth }, { x: PITCH.penaltyHalfWidth, y: 0.02, z: PITCH.penaltyDepth }, marking, 2);
  line3d({ x: -PITCH.sixYardHalfWidth, y: 0.02, z: 0 }, { x: -PITCH.sixYardHalfWidth, y: 0.02, z: PITCH.sixYardDepth }, marking, 1.6);
  line3d({ x: PITCH.sixYardHalfWidth, y: 0.02, z: 0 }, { x: PITCH.sixYardHalfWidth, y: 0.02, z: PITCH.sixYardDepth }, marking, 1.6);
  line3d({ x: -PITCH.sixYardHalfWidth, y: 0.02, z: PITCH.sixYardDepth }, { x: PITCH.sixYardHalfWidth, y: 0.02, z: PITCH.sixYardDepth }, marking, 1.6);
}

function drawGoal() {
  const white = "rgba(244,250,241,.95)";
  line3d({ x: -GOAL.halfWidth, y: 0, z: 0 }, { x: -GOAL.halfWidth, y: GOAL.height, z: 0 }, white, 5);
  line3d({ x: GOAL.halfWidth, y: 0, z: 0 }, { x: GOAL.halfWidth, y: GOAL.height, z: 0 }, white, 5);
  line3d({ x: -GOAL.halfWidth, y: GOAL.height, z: 0 }, { x: GOAL.halfWidth, y: GOAL.height, z: 0 }, white, 5);
  line3d({ x: -GOAL.halfWidth, y: 0, z: 0 }, { x: -GOAL.halfWidth, y: 0, z: -GOAL.depth }, white, 2.5);
  line3d({ x: GOAL.halfWidth, y: 0, z: 0 }, { x: GOAL.halfWidth, y: 0, z: -GOAL.depth }, white, 2.5);
  line3d({ x: -GOAL.halfWidth, y: GOAL.height, z: 0 }, { x: -GOAL.halfWidth, y: GOAL.height, z: -GOAL.depth }, white, 2.5);
  line3d({ x: GOAL.halfWidth, y: GOAL.height, z: 0 }, { x: GOAL.halfWidth, y: GOAL.height, z: -GOAL.depth }, white, 2.5);

  for (let index = 1; index < 8; index += 1) {
    const x = -GOAL.halfWidth + (GOAL.width * index) / 8;
    line3d({ x, y: 0, z: 0 }, { x, y: GOAL.height, z: 0 }, "rgba(235,246,232,.24)", 1);
  }
  for (let index = 1; index < 5; index += 1) {
    const y = (GOAL.height * index) / 5;
    line3d({ x: -GOAL.halfWidth, y, z: 0 }, { x: GOAL.halfWidth, y, z: 0 }, "rgba(235,246,232,.24)", 1);
  }
}

function drawActor(feet, height, palette, pose = {}) {
  const measure = projectedHeight(feet, height, activeCamera, viewport);
  if (!measure) return;
  const { foot, head } = measure;
  const scale = clamp(measure.height / 115, 0.35, 1.7);
  const bodyTopY = head.y + 19 * scale;
  const hipY = foot.y - 43 * scale;
  const centreX = foot.x;
  const lean = (pose.lean || 0) * 22 * scale;
  const lift = (pose.lift || 0) * 40 * scale;
  const yOffset = -lift;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = palette.outline || "#07110b";
  ctx.lineWidth = 8 * scale;
  ctx.beginPath();
  ctx.moveTo(centreX - 8 * scale, hipY + yOffset);
  ctx.lineTo(centreX - 12 * scale - (pose.leftLeg || 0) * 12 * scale, foot.y + yOffset);
  ctx.moveTo(centreX + 8 * scale, hipY + yOffset);
  ctx.lineTo(centreX + 12 * scale + (pose.rightLeg || 0) * 12 * scale, foot.y + yOffset);
  ctx.stroke();

  ctx.fillStyle = palette.shirt;
  ctx.strokeStyle = palette.outline || "#07110b";
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.roundRect(centreX - 21 * scale + lean, bodyTopY + yOffset, 42 * scale, Math.max(35 * scale, hipY - bodyTopY), 10 * scale);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = palette.skin;
  ctx.lineWidth = 8 * scale;
  ctx.beginPath();
  ctx.moveTo(centreX - 15 * scale + lean, bodyTopY + 13 * scale + yOffset);
  ctx.lineTo(centreX - 29 * scale - (pose.armSpread || 0) * 10 * scale, hipY - 5 * scale + yOffset);
  ctx.moveTo(centreX + 15 * scale + lean, bodyTopY + 13 * scale + yOffset);
  ctx.lineTo(centreX + 29 * scale + (pose.armSpread || 0) * 10 * scale, hipY - 5 * scale + yOffset);
  ctx.stroke();

  ctx.fillStyle = palette.skin;
  ctx.strokeStyle = palette.outline || "#07110b";
  ctx.lineWidth = 2.5 * scale;
  ctx.beginPath();
  ctx.arc(centreX + lean * 0.5, head.y + 11 * scale + yOffset, 12 * scale, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function currentTargetX() {
  if (Number.isFinite(state.shot?.actualX)) return -GOAL.halfWidth + state.shot.actualX * GOAL.width;
  if (Number.isFinite(state.shot?.aimX)) return -GOAL.halfWidth + state.shot.aimX * GOAL.width;
  return state.currentStage.protectedGoalX || 0;
}

function wallLayout() {
  return buildWallLayout(state.currentStage, state.stage, {
    targetX: currentTargetX(),
    curve: state.shot?.curve ?? 0
  });
}

function wallPassRatio(wall) {
  const path = state.shot?.path;
  if (!path?.length) return 0.48;
  let closestIndex = 0;
  let closestDistance = Infinity;
  path.forEach((point, index) => {
    const distance = Math.hypot(point.x - wall.centre.x, point.z - wall.centre.z);
    if (distance < closestDistance) { closestDistance = distance; closestIndex = index; }
  });
  return closestIndex / Math.max(1, path.length - 1);
}

function drawWall(progress) {
  const wall = wallLayout();
  const profile = wallForStage(state.stage);
  const pass = wallPassRatio(wall);
  [...wall.players].sort((a, b) => b.z - a.z).forEach((player) => {
    const timing = pass + (player.timingOffset || 0);
    const jumpPulse = Math.max(0, Math.sin(clamp((progress.flight - timing + 0.1) / 0.24, 0, 1) * Math.PI));
    const hit = state.shot?.outcome === "WALL" && state.shot?.collision?.playerIndex === player.index;
    const impact = hit ? smooth(progress.settle) : 0;
    drawActor(player, profile.playerHeight, {
      shirt: player.index % 2 ? profile.secondary : profile.accent,
      skin: "#c99774",
      outline: "#0a120d"
    }, {
      lift: jumpPulse * profile.modifiers.jumpMultiplier * (player.jumpMultiplier || 1) * 0.7,
      lean: impact * (player.index % 2 ? -0.45 : 0.45),
      armSpread: jumpPulse * 0.2 + impact * 0.5
    });
  });
}

function drawKicker(progress) {
  const character = activeCharacter();
  const run = smooth(progress.run);
  const feet = kickerWorld(state.currentStage, run);
  const kickPhase = progress.flight > 0 ? Math.max(0, 1 - progress.flight * 4) : 0;
  drawActor(feet, 1.82, {
    shirt: character.accent,
    skin: "#c99774",
    outline: "#07110b"
  }, {
    lean: run * 0.13 + kickPhase * 0.12,
    leftLeg: Math.sin(run * Math.PI * 4) * 0.35,
    rightLeg: -Math.sin(run * Math.PI * 4) * 0.35 + kickPhase * 0.7,
    armSpread: run * 0.16
  });
}

function drawKeeper(progress) {
  const profile = keeperForStage(state.stage);
  const base = state.shot?.keeperPlan?.start || keeperWorld(state.currentStage);
  const plan = state.shot?.keeperPlan;
  let feet = base;
  let dive = 0;
  if (plan && progress.flight > 0) {
    const reactionRatio = clamp(plan.reaction / Math.max(plan.flightSeconds, 0.01), 0, 0.85);
    dive = smooth((progress.flight - reactionRatio) / Math.max(0.12, 1 - reactionRatio));
    feet = {
      x: lerp(base.x, plan.contact.x, dive * 0.76),
      y: 0,
      z: lerp(base.z, plan.contact.z, dive * 0.35)
    };
  }
  drawActor(feet, profile.visualHeight, {
    shirt: profile.accent,
    skin: "#c99774",
    outline: "#07110b"
  }, {
    lean: plan ? Math.sign(plan.contact.x - base.x || 1) * dive * 0.62 : 0,
    lift: Math.sin(dive * Math.PI) * 0.34,
    armSpread: dive * 0.9,
    leftLeg: -dive * 0.25,
    rightLeg: dive * 0.25
  });
}

function drawBall(progress) {
  const ball = progress.flight > 0 && state.shot?.path?.length
    ? samplePath(state.shot.path, progress.flight)
    : ballWorld(state.currentStage);
  if (!ball) return;
  const point = project(ball);
  if (!point.visible) return;
  const radius = clamp(point.scale * 0.11, 4, 14);
  ctx.save();
  ctx.shadowColor = "rgba(255,255,255,.35)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#f7faf5";
  ctx.strokeStyle = "#0a100c";
  ctx.lineWidth = Math.max(1.5, radius * 0.18);
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111814";
  ctx.beginPath();
  ctx.arc(point.x + radius * 0.18, point.y - radius * 0.1, radius * 0.28, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawAimMarker() {
  if (state.phase !== "aim") return;
  const target = currentAimTarget();
  const world = {
    x: -GOAL.halfWidth + target.x * GOAL.width,
    y: GOAL.height * (1 - target.y),
    z: GOAL.lineZ
  };
  const point = project(world);
  if (!point.visible) return;
  ctx.save();
  ctx.strokeStyle = activeCharacter().accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 22, 0, TAU);
  ctx.moveTo(point.x - 30, point.y);
  ctx.lineTo(point.x + 30, point.y);
  ctx.moveTo(point.x, point.y - 30);
  ctx.lineTo(point.x, point.y + 30);
  ctx.stroke();
  ctx.restore();
}

function drawLabels() {
  const keeper = keeperForStage(state.stage);
  const wall = wallForStage(state.stage);
  ctx.save();
  ctx.fillStyle = "rgba(2,8,4,.72)";
  ctx.beginPath();
  ctx.roundRect(18, WORLD.height - 52, 500, 34, 10);
  ctx.fill();
  ctx.fillStyle = "rgba(240,247,237,.82)";
  ctx.font = "850 11px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`${activeCharacter().name} · ${keeper.nickname} · ${wall.nickname}`, 32, WORLD.height - 31);
  ctx.restore();
}

export function drawScene(time, finishAnimation) {
  applyTransform();
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);
  activeCamera = buildCamera(state.currentStage);
  const progress = animationProgress(time);
  drawBackground();
  drawPitch();
  drawGoal();
  drawKeeper(progress);
  drawWall(progress);
  drawKicker(progress);
  drawBall(progress);
  drawAimMarker();
  drawLabels();

  if (progress.complete && state.animation && state.animation.id !== lastFinishedId) {
    lastFinishedId = state.animation.id;
    queueMicrotask(() => finishAnimation(lastFinishedId));
  }
  if (!state.animation) lastFinishedId = null;
}
