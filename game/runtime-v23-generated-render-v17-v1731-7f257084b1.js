import { drawScene as drawBaseScene, resizeCanvas } from "./runtime-v23-generated-render-v15-v1731-1b04a249af.js";
import { clamp, WORLD, state, ctx, canvasView, easeOutCubic } from "./core-v6.js?v=32.4";
import { GOAL, buildCamera, ballWorld, keeperWorld } from "./world-v7.js?v=32.4";
import { projectWorld, projectSegment } from "./projection-v6.js?v=32.4";
import { sampleShotPath } from "./physics-v7.js?v=7";
import { buildWallLayout } from "./walls-v15.js?v=32.4";

export { resizeCanvas };

const viewport = { width: WORLD.width, height: WORLD.height };
const TAU = Math.PI * 2;
const crowdLights = Array.from({ length: 118 }, (_, index) => ({
  x: 28 + ((index * 97) % 1145),
  y: 154 + ((index * 47) % 166),
  radius: 0.8 + ((index * 13) % 17) / 10,
  phase: (index * 1.73) % TAU,
  strength: 0.18 + ((index * 19) % 42) / 100
}));

function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function animationProgress(time) {
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
  const progress = animationProgress(time);
  if (state.animation && progress.motionFlight > 0) {
    const follow = easeOutCubic(progress.motionFlight) * 0.42;
    camera.position.z -= follow;
    camera.position.y -= follow * 0.05;
    camera.target.y += follow * 0.06;
  }
  return camera;
}

function applyWorldTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function drawStadiumAtmosphere(time) {
  const pulse = 0.78 + Math.sin(time / 1050) * 0.08;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const leftBeam = ctx.createLinearGradient(0, 0, 470, 520);
  leftBeam.addColorStop(0, `rgba(224,244,224,${0.095 * pulse})`);
  leftBeam.addColorStop(1, "rgba(224,244,224,0)");
  ctx.fillStyle = leftBeam;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(105, 12);
  ctx.lineTo(510, 590);
  ctx.lineTo(305, 590);
  ctx.closePath();
  ctx.fill();

  const rightBeam = ctx.createLinearGradient(WORLD.width, 0, 720, 520);
  rightBeam.addColorStop(0, `rgba(218,254,77,${0.075 * pulse})`);
  rightBeam.addColorStop(1, "rgba(218,254,77,0)");
  ctx.fillStyle = rightBeam;
  ctx.beginPath();
  ctx.moveTo(WORLD.width - 110, 0);
  ctx.lineTo(WORLD.width, 0);
  ctx.lineTo(910, 590);
  ctx.lineTo(705, 590);
  ctx.closePath();
  ctx.fill();

  const centreGlow = ctx.createRadialGradient(600, 275, 15, 600, 275, 500);
  centreGlow.addColorStop(0, "rgba(209,255,157,.07)");
  centreGlow.addColorStop(0.55, "rgba(86,183,105,.025)");
  centreGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = centreGlow;
  ctx.fillRect(0, 0, WORLD.width, 620);

  for (const light of crowdLights) {
    const flicker = 0.55 + Math.sin(time / 420 + light.phase) * 0.45;
    ctx.fillStyle = `rgba(235,255,221,${light.strength * flicker})`;
    ctx.beginPath();
    ctx.arc(light.x, light.y, light.radius, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  const ribbon = ctx.createLinearGradient(0, 0, WORLD.width, 0);
  ribbon.addColorStop(0, "rgba(25,75,47,.2)");
  ribbon.addColorStop(0.2, "rgba(218,254,77,.28)");
  ribbon.addColorStop(0.5, "rgba(240,255,205,.12)");
  ribbon.addColorStop(0.8, "rgba(218,254,77,.28)");
  ribbon.addColorStop(1, "rgba(25,75,47,.2)");
  ctx.fillStyle = "rgba(1,8,4,.74)";
  ctx.fillRect(0, 330, WORLD.width, 30);
  ctx.fillStyle = ribbon;
  ctx.fillRect(0, 332, WORLD.width, 2);
  ctx.fillRect(0, 356, WORLD.width, 1);
  ctx.fillStyle = "rgba(239,247,236,.62)";
  ctx.font = "850 9px system-ui";
  ctx.textAlign = "center";
  const offset = (time / 22) % 220;
  for (let x = -220 + offset; x < WORLD.width + 220; x += 220) {
    ctx.fillText("FOOTBALL LAB  •  MASTER THE STRIKE", x, 350);
  }
  ctx.restore();
}

function drawGoalHighlights(time) {
  const camera = cameraForFrame(time);
  const left = -GOAL.halfWidth;
  const right = GOAL.halfWidth;
  const back = -GOAL.depth;

  const glowLine = (a, b, width = 3.2) => {
    const segment = projectSegment(a, b, camera, viewport);
    if (!segment) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = "rgba(248,255,243,.32)";
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(218,254,77,.32)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(segment.a.x, segment.a.y);
    ctx.lineTo(segment.b.x, segment.b.y);
    ctx.stroke();
    ctx.restore();
  };

  glowLine({ x: left, y: 0, z: 0 }, { x: left, y: GOAL.height, z: 0 });
  glowLine({ x: right, y: 0, z: 0 }, { x: right, y: GOAL.height, z: 0 });
  glowLine({ x: left, y: GOAL.height, z: 0 }, { x: right, y: GOAL.height, z: 0 });
  glowLine({ x: left, y: GOAL.height, z: 0 }, { x: left, y: GOAL.height, z: back }, 1.5);
  glowLine({ x: right, y: GOAL.height, z: 0 }, { x: right, y: GOAL.height, z: back }, 1.5);
}

function drawGroundContactShadows(time) {
  const camera = cameraForFrame(time);
  const points = [{ world: keeperWorld(state.currentStage), width: 28, alpha: 0.13 }];
  const targetX = Number.isFinite(state.shot?.actualX)
    ? -GOAL.halfWidth + state.shot.actualX * GOAL.width
    : state.currentStage.protectedGoalX || 0;
  const wall = buildWallLayout(state.currentStage, state.stage, {
    targetX,
    curve: state.shot?.curve || 0
  });
  wall.players.forEach((player) => points.push({ world: player, width: 20, alpha: 0.1 }));

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  for (const item of points) {
    const projected = projectWorld({ ...item.world, y: 0.01 }, camera, viewport);
    if (!projected.visible) continue;
    const width = clamp(projected.scale * item.width, 6, item.width);
    const gradient = ctx.createRadialGradient(projected.x, projected.y, 0, projected.x, projected.y, width);
    gradient.addColorStop(0, `rgba(0,0,0,${item.alpha})`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(projected.x, projected.y + 2, width, width * 0.22, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawBallEnergy(time) {
  const progress = animationProgress(time);
  if (!state.animation || progress.motionFlight <= 0.02 || !state.shot?.path?.length) return;
  const camera = cameraForFrame(time);
  const colour = state.shot.outcome === "GOAL" ? "218,254,77" : "232,246,227";

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let index = 1; index <= 12; index += 1) {
    const ratio = clamp(progress.motionFlight - index * 0.012, 0, 1);
    const world = sampleShotPath(state.shot.path, ratio);
    if (!world) continue;
    const point = projectWorld(world, camera, viewport);
    if (!point.visible) continue;
    const alpha = (1 - index / 13) * (progress.replay ? 0.16 : 0.11);
    const radius = clamp(point.scale * (0.05 + index * 0.002), 1.3, 6.2);
    ctx.fillStyle = `rgba(${colour},${alpha})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawContactFx(time) {
  const progress = animationProgress(time);
  if (!state.animation || progress.flight <= 0 || progress.flight > 0.11 || progress.replay) return;
  const ball = projectWorld(ballWorld(state.currentStage), cameraForFrame(time), viewport);
  if (!ball.visible) return;
  const intensity = 1 - progress.flight / 0.11;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, 38);
  glow.addColorStop(0, `rgba(238,255,207,${0.4 * intensity})`);
  glow.addColorStop(1, "rgba(218,254,77,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(ball.x - 42, ball.y - 42, 84, 84);

  for (let index = 0; index < 10; index += 1) {
    const angle = -2.8 + index * 0.34;
    const distance = 10 + index * 2.2 + (1 - intensity) * 20;
    ctx.fillStyle = `rgba(205,224,174,${0.32 * intensity})`;
    ctx.beginPath();
    ctx.ellipse(
      ball.x + Math.cos(angle) * distance,
      ball.y + 8 + Math.sin(angle) * distance * 0.45,
      2.2,
      0.9,
      angle,
      0,
      TAU
    );
    ctx.fill();
  }
  ctx.restore();
}

function drawOutcomeFocus(time) {
  const progress = animationProgress(time);
  if (!state.animation || progress.motionFlight < 0.82) return;
  const outcome = state.shot?.outcome;
  if (!outcome || !state.shot?.path?.length) return;
  const impactWorld = Number.isInteger(state.shot.impactIndex)
    ? state.shot.path[state.shot.impactIndex]
    : state.shot.path[state.shot.path.length - 1];
  if (!impactWorld) return;
  const impact = projectWorld(impactWorld, cameraForFrame(time), viewport);
  if (!impact.visible) return;
  const reveal = smooth01((progress.motionFlight - 0.82) / 0.18);
  const tint = outcome === "GOAL" ? "218,254,77" : outcome === "SAVE" ? "116,219,255" : "244,247,240";

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const halo = ctx.createRadialGradient(impact.x, impact.y, 0, impact.x, impact.y, 72 + reveal * 44);
  halo.addColorStop(0, `rgba(${tint},${0.15 * (1 - reveal * 0.55)})`);
  halo.addColorStop(1, `rgba(${tint},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(impact.x - 120, impact.y - 120, 240, 240);
  ctx.restore();
}

function drawCinematicGrade(time) {
  const progress = animationProgress(time);
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const grade = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  grade.addColorStop(0, "rgba(10,24,18,.28)");
  grade.addColorStop(0.48, "rgba(58,124,72,.05)");
  grade.addColorStop(1, "rgba(2,8,4,.2)");
  ctx.fillStyle = grade;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.globalCompositeOperation = "source-over";
  const vignette = ctx.createRadialGradient(600, 390, 210, 600, 390, 720);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.68, "rgba(0,0,0,.05)");
  vignette.addColorStop(1, "rgba(0,0,0,.46)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  if (progress.replay) {
    const bar = 24;
    ctx.fillStyle = "rgba(1,4,2,.72)";
    ctx.fillRect(0, 0, WORLD.width, bar);
    ctx.fillRect(0, WORLD.height - bar, WORLD.width, bar);
    ctx.fillStyle = "rgba(240,247,238,.82)";
    ctx.font = "900 9px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("SLOW-MOTION REPLAY", 24, 16);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(218,254,77,.88)";
    ctx.fillText("FOOTBALL LAB", WORLD.width - 24, 16);
  }
  ctx.restore();
}

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
  applyWorldTransform();
  drawStadiumAtmosphere(time);
  drawGroundContactShadows(time);
  drawGoalHighlights(time);
  drawBallEnergy(time);
  drawContactFx(time);
  drawOutcomeFocus(time);
  drawCinematicGrade(time);
}

window.__footballLabRendererV17 = true;
