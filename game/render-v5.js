import {
  clamp, lerp, WORLD, state, elements, ctx, canvasView, currentAimTarget,
  easeOutCubic, easeInOutCubic, smoothStep
} from "./core.js?v=5";
import {
  goalRect, ballStart, keeperHome, cubicPoint, wallPlayers, wallJumpAt
} from "./physics.js?v=5";
import { playKickSound } from "./audio-v5.js?v=5";

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

function impactPulse(time) {
  if (!state.animation || state.shot.impactRenderT == null) return 0;
  const local = (progressAt(time).flight - state.shot.impactRenderT) / 0.12;
  return local >= 0 && local <= 1 ? Math.sin(local * Math.PI) : 0;
}

function applyCameraFeedback(time) {
  let strength = impactPulse(time) * 7;
  const progress = progressAt(time);
  if (state.animation && state.shot.outcome === "GOAL" && progress.flight > 0.9) {
    strength = Math.max(strength, Math.sin(clamp((progress.flight - 0.9) / 0.1, 0, 1) * Math.PI) * 3.5);
  }
  if (strength > 0) ctx.translate(Math.sin(time * 0.11) * strength, Math.cos(time * 0.16) * strength * 0.55);
}

export function drawScene(time, finishShot) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
  applyTransform();
  applyCameraFeedback(time);
  drawBackground();
  drawPitch();
  drawGoal(time);
  drawWall(time);
  drawKeeper(time);
  drawTarget();
  drawKicker(time);
  drawBall(time, finishShot);
  drawForeground();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, 430);
  sky.addColorStop(0, "#071a13");
  sky.addColorStop(0.55, "#0b2b1b");
  sky.addColorStop(1, "#122e1d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = "rgba(2,5,3,.72)";
  ctx.beginPath();
  ctx.moveTo(0, 205);
  ctx.lineTo(1200, 130);
  ctx.lineTo(1200, 365);
  ctx.lineTo(0, 398);
  ctx.closePath();
  ctx.fill();

  for (let row = 0; row < 4; row += 1) {
    for (let x = 12 + row * 11; x < 1195; x += 24) {
      const alpha = 0.07 + ((x + row * 19) % 75) / 950;
      ctx.fillStyle = `rgba(226,255,196,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, 230 + row * 35 + Math.sin(x * 0.08) * 3, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const glow = ctx.createRadialGradient(900, 105, 0, 900, 105, 260);
  glow.addColorStop(0, "rgba(218,254,77,.20)");
  glow.addColorStop(1, "rgba(218,254,77,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(610, 0, 590, 330);
}

function drawPitch() {
  const goal = goalRect();
  ctx.fillStyle = "#164f2b";
  ctx.beginPath();
  ctx.moveTo(0, 405);
  ctx.lineTo(1200, 350);
  ctx.lineTo(1200, 720);
  ctx.lineTo(0, 720);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,.018)" : "rgba(0,0,0,.038)";
    ctx.beginPath();
    ctx.moveTo(i * 170 - 100, 720);
    ctx.lineTo(i * 138 + 120, 375);
    ctx.lineTo(i * 138 + 255, 368);
    ctx.lineTo(i * 170 + 80, 720);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(225,255,221,.60)";
  ctx.lineWidth = 3;
  const boxTopY = goal.y + goal.h + 10;
  const boxFrontY = 555;
  ctx.beginPath();
  ctx.moveTo(goal.x - 75, boxTopY);
  ctx.lineTo(goal.x + goal.w + 75, boxTopY);
  ctx.lineTo(goal.x + goal.w + 180, boxFrontY);
  ctx.lineTo(goal.x - 180, boxFrontY);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(goal.x + goal.w / 2 - 45, boxFrontY + 36, 92, -2.25, -0.22);
  ctx.stroke();

  const spot = ballStart();
  ctx.fillStyle = "rgba(235,255,230,.75)";
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoal(time) {
  const goal = goalRect();
  const progress = progressAt(time);
  const pulse = state.animation && state.shot.outcome === "GOAL" && progress.flight > 0.88
    ? Math.sin(clamp((progress.flight - 0.88) / 0.12, 0, 1) * Math.PI) * 12
    : 0;

  ctx.save();
  ctx.fillStyle = "rgba(8,20,13,.22)";
  ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
  ctx.strokeStyle = "rgba(238,255,236,.94)";
  ctx.lineWidth = 7;
  ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);
  ctx.strokeStyle = "rgba(238,255,236,.24)";
  ctx.lineWidth = 1.5;
  for (let x = goal.x + 25; x < goal.x + goal.w; x += 25) {
    ctx.beginPath();
    ctx.moveTo(x, goal.y);
    ctx.quadraticCurveTo(x + pulse, goal.y + goal.h * 0.55, x, goal.y + goal.h);
    ctx.stroke();
  }
  for (let y = goal.y + 22; y < goal.y + goal.h; y += 22) {
    ctx.beginPath();
    ctx.moveTo(goal.x, y);
    ctx.quadraticCurveTo(goal.x + goal.w * 0.5, y + pulse * 0.6, goal.x + goal.w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWall(time) {
  const progress = progressAt(time);
  const pathT = progress.flight * (state.shot.pathEndT ?? 1);
  const jump = state.animation ? wallJumpAt(pathT) : 0;
  const impactT = state.shot.collision?.renderT ?? 0.7;

  for (const player of wallPlayers()) {
    const hitPlayer = state.shot.outcome === "WALL" && state.shot.collision?.playerIndex === player.index;
    const recoilProgress = hitPlayer ? clamp((progress.flight - impactT) / 0.24, 0, 1) : 0;
    const recoil = Math.sin(recoilProgress * Math.PI) * 13;
    const rotation = hitPlayer ? Math.sin(recoilProgress * Math.PI) * 0.22 : 0;

    ctx.save();
    ctx.translate(player.x + recoil, player.y - jump);
    ctx.rotate(rotation);
    ctx.fillStyle = "rgba(4,8,6,.28)";
    ctx.beginPath();
    ctx.ellipse(0, 30 + jump, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = player.index % 2 ? "#273c31" : "#31483a";
    roundedRect(-14, -42, 28, 48, 10);
    ctx.fill();
    ctx.fillStyle = "#d7aa83";
    ctx.beginPath();
    ctx.arc(0, -54, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#101a13";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-6, 7);
    ctx.lineTo(-9, 30);
    ctx.moveTo(6, 7);
    ctx.lineTo(9, 30);
    ctx.stroke();
    ctx.restore();
  }
}

function drawKeeper(time) {
  const home = keeperHome();
  let x = home.x;
  let y = home.y;
  let rotation = 0;
  let stretch = 0;

  if (state.animation && state.shot.keeperPlan) {
    const progress = progressAt(time);
    const plan = state.shot.keeperPlan;
    const diveEnd = plan.impactRenderT ?? 0.9;
    const dive = smoothStep(clamp((progress.flight - plan.reactionDelay) / Math.max(0.12, diveEnd - plan.reactionDelay), 0, 1));
    const landing = clamp((progress.flight - diveEnd) / 0.18, 0, 1);
    x = lerp(plan.start.x, plan.contact.x, dive);
    y = lerp(plan.start.y, plan.contact.y, dive) - Math.sin(dive * Math.PI) * 24 + landing * 16;
    rotation = Math.sign(plan.contact.x - plan.start.x || 1) * dive * 0.9;
    stretch = dive * (1 - landing * 0.35);
  } else {
    x += Math.sin(time / 620) * 15;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(0, 30, 30 + stretch * 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f5f7f1";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(-34 - stretch * 18, 5);
  ctx.moveTo(10, -6);
  ctx.lineTo(34 + stretch * 18, 5);
  ctx.stroke();
  ctx.strokeStyle = "#15221a";
  ctx.beginPath();
  ctx.moveTo(-7, 21);
  ctx.lineTo(-18, 45);
  ctx.moveTo(7, 21);
  ctx.lineTo(18, 45);
  ctx.stroke();
  ctx.fillStyle = "#dafe4d";
  roundedRect(-17, -25, 34, 50, 11);
  ctx.fill();
  ctx.fillStyle = "#bd8d6e";
  ctx.beginPath();
  ctx.arc(0, -38, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTarget() {
  if (state.phase !== "aim") return;
  const target = currentAimTarget();
  const goal = goalRect();
  const x = goal.x + target.x * goal.w;
  const y = goal.y + target.y * goal.h;
  const pulse = 1 + Math.sin(state.meterClock * 7) * 0.08;

  ctx.save();
  ctx.strokeStyle = "rgba(218,254,77,.22)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(goal.x + 12, y);
  ctx.lineTo(goal.x + goal.w - 12, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = "rgba(218,254,77,.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-31, 0);
  ctx.lineTo(31, 0);
  ctx.moveTo(0, -31);
  ctx.lineTo(0, 31);
  ctx.stroke();
  ctx.restore();
}

function drawKicker(time) {
  const ball = ballStart();
  const progress = progressAt(time);
  const run = state.animation ? easeInOutCubic(progress.run) : 0;
  const x = lerp(ball.x - 92, ball.x - 28, run);
  const y = lerp(ball.y + 48, ball.y + 10, run);
  const kick = state.animation ? clamp((progress.run - 0.68) / 0.32, 0, 1) : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.10 - kick * 0.15);
  ctx.globalAlpha = state.animation && progress.flight > 0.75 ? lerp(1, 0.48, (progress.flight - 0.75) / 0.25) : 1;
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(0, 34, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0e1711";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-7, 16);
  ctx.lineTo(-16, 45);
  ctx.moveTo(7, 16);
  ctx.lineTo(12 + Math.sin(kick * Math.PI) * 36, 44 - Math.sin(kick * Math.PI) * 25);
  ctx.stroke();
  ctx.fillStyle = "#dafe4d";
  roundedRect(-18, -30, 36, 50, 11);
  ctx.fill();
  ctx.fillStyle = "#07110b";
  ctx.font = "900 14px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("10", 0, 2);
  ctx.strokeStyle = "#d7aa83";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-14, -17);
  ctx.lineTo(-32, -3);
  ctx.moveTo(14, -17);
  ctx.lineTo(30, -1);
  ctx.stroke();
  ctx.fillStyle = "#bd8d6e";
  ctx.beginPath();
  ctx.arc(0, -43, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBall(time, finishShot) {
  let position = ballStart();
  let radius = 15;
  let pathT = 0;

  if (state.animation) {
    const progress = progressAt(time);
    const flight = easeOutCubic(progress.flight);
    if (progress.run >= 0.92 && !state.animation.impactPlayed) {
      state.animation.impactPlayed = true;
      playKickSound();
    }
    if (progress.flight > 0) {
      pathT = flight * (state.shot.pathEndT ?? 1);
      position = cubicPoint(state.shot.trajectory, pathT);
      const impactT = state.shot.impactRenderT;
      radius = impactT != null && pathT > impactT
        ? lerp(9, state.shot.outcome === "WALL" ? 11.5 : 10.5, clamp((pathT - impactT) / Math.max(0.01, 1 - impactT), 0, 1))
        : lerp(15, 8.5, pathT);
    }
    if (progress.complete) finishShot(state.animation.id);
  }

  if (state.animation && pathT > 0.05) drawTrail(pathT);

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(position.x, position.y + 8, radius * 1.15, radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const gradient = ctx.createRadialGradient(position.x - radius * 0.35, position.y - radius * 0.4, 1, position.x, position.y, radius);
  gradient.addColorStop(0, "#fff");
  gradient.addColorStop(1, "#c7d0c6");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
  ctx.fill();

  const spinRate = 7 + (state.shot.power ?? 0.5) * 7 + Math.abs(state.shot.curve ?? 0) * 3;
  ctx.fillStyle = "#172019";
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 5 + pathT * spinRate;
    const px = position.x + Math.cos(angle) * radius * 0.38;
    const py = position.y + Math.sin(angle) * radius * 0.38;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawTrail(pathT) {
  ctx.save();
  for (let i = 1; i <= 8; i += 1) {
    const t = clamp(pathT - i * 0.02, 0, 1);
    if (!t) continue;
    const point = cubicPoint(state.shot.trajectory, t);
    const alpha = (1 - i / 9) * 0.18;
    ctx.fillStyle = `rgba(218,254,77,${alpha})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, lerp(10, 3.5, i / 8), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawForeground() {
  const start = ballStart();
  ctx.strokeStyle = "rgba(255,255,255,.42)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(start.x, start.y, 72, 0.25, 2.88);
  ctx.stroke();
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
