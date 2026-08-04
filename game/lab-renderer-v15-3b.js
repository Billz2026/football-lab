import {
  clamp, lerp, WORLD, state, elements, ctx, canvasView, currentAimTarget
} from "./core-v6.js?v=7";
import { GOAL, ballWorld, keeperWorld, kickerWorld } from "./world-v7.js?v=7";
import { activeCharacter } from "./characters-v13.js?v=13";
import { buildWallLayout, keeperForStage, wallForStage } from "./lab-matchups-v15-3.js?v=153";

const TAU = Math.PI * 2;
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
  ctx.setTransform(
    canvasView.dpr * canvasView.scale,
    0,
    0,
    canvasView.dpr * canvasView.scale,
    canvasView.dpr * canvasView.offsetX,
    canvasView.dpr * canvasView.offsetY
  );
}

function smooth(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function progressAt(time) {
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

function screenPoint(world) {
  const ball = ballWorld(state.currentStage);
  const depth = clamp(world.z / Math.max(1, ball.z), -0.12, 1.15);
  const perspective = 0.58 + depth * 0.68;
  return {
    x: WORLD.width / 2 + world.x * 40 * perspective,
    y: 242 + depth * 360 - world.y * 82 * perspective,
    scale: perspective
  };
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  sky.addColorStop(0, "#06160d");
  sky.addColorStop(0.42, "#0b2116");
  sky.addColorStop(1, "#164b2c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = "rgba(1,6,3,.74)";
  ctx.fillRect(0, 85, WORLD.width, 180);
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 34; column += 1) {
      ctx.fillStyle = `rgba(126,172,130,${0.08 + ((row + column) % 3) * 0.025})`;
      ctx.beginPath();
      ctx.arc(28 + column * 36 + (row % 2) * 9, 122 + row * 36, 3, 0, TAU);
      ctx.fill();
    }
  }
}

function drawPitch() {
  ctx.fillStyle = "#174f2e";
  ctx.beginPath();
  ctx.moveTo(75, WORLD.height);
  ctx.lineTo(WORLD.width - 75, WORLD.height);
  ctx.lineTo(940, 250);
  ctx.lineTo(260, 250);
  ctx.closePath();
  ctx.fill();
  for (let index = 0; index < 7; index += 1) {
    const top = 250 + index * 58;
    ctx.fillStyle = index % 2 ? "rgba(255,255,255,.018)" : "rgba(0,0,0,.025)";
    ctx.fillRect(80, top, WORLD.width - 160, 30);
  }
  ctx.strokeStyle = "rgba(225,242,222,.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(270, 347);
  ctx.lineTo(930, 347);
  ctx.lineTo(1020, 535);
  ctx.lineTo(180, 535);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(WORLD.width / 2, 540, 122, Math.PI, TAU);
  ctx.stroke();
}

function drawGoal() {
  const left = 430;
  const right = 770;
  const top = 190;
  const bottom = 350;
  ctx.strokeStyle = "rgba(246,250,244,.96)";
  ctx.lineWidth = 6;
  ctx.strokeRect(left, top, right - left, bottom - top);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(236,246,233,.22)";
  for (let x = left + 34; x < right; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }
  for (let y = top + 32; y < bottom; y += 32) {
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
}

function drawActor(world, height, colours, pose = {}) {
  const point = screenPoint(world);
  const size = clamp(52 * point.scale * (height / 1.84), 28, 108);
  const footY = point.y - (pose.lift || 0) * size;
  const bodyHeight = size * 0.56;
  const lean = (pose.lean || 0) * size * 0.35;
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = colours.outline || "#07110b";
  ctx.lineWidth = Math.max(4, size * 0.095);
  ctx.beginPath();
  ctx.moveTo(point.x - size * 0.11, footY - bodyHeight * 0.06);
  ctx.lineTo(point.x - size * 0.15 - (pose.leftLeg || 0) * size * 0.13, footY);
  ctx.moveTo(point.x + size * 0.11, footY - bodyHeight * 0.06);
  ctx.lineTo(point.x + size * 0.15 + (pose.rightLeg || 0) * size * 0.13, footY);
  ctx.stroke();
  ctx.fillStyle = colours.shirt;
  ctx.strokeStyle = colours.outline || "#07110b";
  ctx.lineWidth = Math.max(2, size * 0.035);
  ctx.beginPath();
  ctx.roundRect(point.x - size * 0.23 + lean, footY - bodyHeight, size * 0.46, bodyHeight * 0.78, size * 0.1);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = colours.skin;
  ctx.lineWidth = Math.max(4, size * 0.075);
  ctx.beginPath();
  ctx.moveTo(point.x - size * 0.18 + lean, footY - bodyHeight * 0.78);
  ctx.lineTo(point.x - size * (0.34 + (pose.armSpread || 0) * 0.12), footY - bodyHeight * 0.33);
  ctx.moveTo(point.x + size * 0.18 + lean, footY - bodyHeight * 0.78);
  ctx.lineTo(point.x + size * (0.34 + (pose.armSpread || 0) * 0.12), footY - bodyHeight * 0.33);
  ctx.stroke();
  ctx.fillStyle = colours.skin;
  ctx.strokeStyle = colours.outline || "#07110b";
  ctx.lineWidth = Math.max(2, size * 0.03);
  ctx.beginPath();
  ctx.arc(point.x + lean * 0.4, footY - bodyHeight - size * 0.12, size * 0.13, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function targetX() {
  if (Number.isFinite(state.shot?.actualX)) return -GOAL.halfWidth + state.shot.actualX * GOAL.width;
  if (Number.isFinite(state.shot?.aimX)) return -GOAL.halfWidth + state.shot.aimX * GOAL.width;
  return state.currentStage.protectedGoalX || 0;
}

function activeWallLayout() {
  return buildWallLayout(state.currentStage, state.stage, {
    targetX: targetX(),
    curve: state.shot?.curve ?? 0
  });
}

function drawWall(progress) {
  const wall = activeWallLayout();
  const profile = wallForStage(state.stage);
  wall.players.forEach((player) => {
    const jumpCentre = 0.48 + (player.timingOffset || 0);
    const jump = Math.max(0, Math.sin(clamp((progress.flight - jumpCentre + 0.13) / 0.26, 0, 1) * Math.PI));
    const hit = state.shot?.outcome === "WALL" && state.shot?.collision?.playerIndex === player.index;
    drawActor(player, profile.playerHeight, {
      shirt: player.index % 2 ? profile.secondary : profile.accent,
      skin: "#c99774",
      outline: "#08120c"
    }, {
      lift: jump * profile.modifiers.jumpMultiplier * (player.jumpMultiplier || 1) * 0.42,
      lean: hit ? smooth(progress.settle) * (player.index % 2 ? -0.45 : 0.45) : 0,
      armSpread: jump * 0.18
    });
  });
}

function drawKeeper(progress) {
  const profile = keeperForStage(state.stage);
  const plan = state.shot?.keeperPlan;
  const base = plan?.start || keeperWorld(state.currentStage);
  let position = base;
  let dive = 0;
  if (plan && progress.flight > 0) {
    const reaction = clamp(plan.reaction / Math.max(plan.flightSeconds, 0.01), 0, 0.85);
    dive = smooth((progress.flight - reaction) / Math.max(0.12, 1 - reaction));
    position = {
      x: lerp(base.x, plan.contact.x, dive * 0.78),
      y: 0,
      z: lerp(base.z, plan.contact.z, dive * 0.3)
    };
  }
  drawActor(position, profile.visualHeight, {
    shirt: profile.accent,
    skin: "#c99774",
    outline: "#07110b"
  }, {
    lean: plan ? Math.sign(plan.contact.x - base.x || 1) * dive * 0.7 : 0,
    lift: Math.sin(dive * Math.PI) * 0.22,
    armSpread: dive * 1.15,
    leftLeg: -dive * 0.2,
    rightLeg: dive * 0.2
  });
}

function drawKicker(progress) {
  const character = activeCharacter();
  const run = smooth(progress.run);
  const position = kickerWorld(state.currentStage, run);
  const strike = progress.flight > 0 ? Math.max(0, 1 - progress.flight * 4) : 0;
  drawActor(position, 1.82, {
    shirt: character.accent,
    skin: "#c99774",
    outline: "#07110b"
  }, {
    lean: run * 0.12 + strike * 0.12,
    leftLeg: Math.sin(run * Math.PI * 4) * 0.28,
    rightLeg: -Math.sin(run * Math.PI * 4) * 0.28 + strike * 0.7,
    armSpread: run * 0.16
  });
}

function drawBall(progress) {
  const world = progress.flight > 0 && state.shot?.path?.length
    ? samplePath(state.shot.path, progress.flight)
    : ballWorld(state.currentStage);
  if (!world) return;
  const point = screenPoint(world);
  const radius = clamp(8 * point.scale, 5, 13);
  ctx.fillStyle = "#f7faf5";
  ctx.strokeStyle = "#0a100c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111814";
  ctx.beginPath();
  ctx.arc(point.x + radius * 0.18, point.y - radius * 0.12, radius * 0.28, 0, TAU);
  ctx.fill();
}

function drawAimMarker() {
  if (state.phase !== "aim") return;
  const target = currentAimTarget();
  const x = 430 + target.x * 340;
  const y = 190 + target.y * 160;
  ctx.strokeStyle = activeCharacter().accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, TAU);
  ctx.moveTo(x - 30, y);
  ctx.lineTo(x + 30, y);
  ctx.moveTo(x, y - 30);
  ctx.lineTo(x, y + 30);
  ctx.stroke();
}

function drawMatchupLabel() {
  const keeper = keeperForStage(state.stage);
  const wall = wallForStage(state.stage);
  ctx.fillStyle = "rgba(2,8,4,.76)";
  ctx.beginPath();
  ctx.roundRect(18, WORLD.height - 50, 500, 32, 10);
  ctx.fill();
  ctx.fillStyle = "rgba(240,247,237,.84)";
  ctx.font = "850 11px system-ui";
  ctx.fillText(`${activeCharacter().name} · ${keeper.nickname} · ${wall.nickname}`, 32, WORLD.height - 29);
}

export function drawScene(time, finishAnimation) {
  applyTransform();
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);
  const progress = progressAt(time);
  drawBackground();
  drawPitch();
  drawGoal();
  drawKeeper(progress);
  drawWall(progress);
  drawKicker(progress);
  drawBall(progress);
  drawAimMarker();
  drawMatchupLabel();
  if (progress.complete && state.animation && state.animation.id !== lastFinishedId) {
    lastFinishedId = state.animation.id;
    queueMicrotask(() => finishAnimation(lastFinishedId));
  }
  if (!state.animation) lastFinishedId = null;
}
