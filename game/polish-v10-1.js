import {
  clamp, lerp, WORLD, state, ctx, elements, easeOutCubic
} from "./core-v6.js?v=32.2";
import { buildCamera, keeperWorld } from "./world-v7.js?v=32.2";
import { projectWorld } from "./projection-v6.js?v=32.2";

const viewport = { width: WORLD.width, height: WORLD.height };
const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

let lastPresentationPhase = null;
let phaseStartedAt = performance.now();
let autoAdvancedPhase = null;

function animationProgress(time) {
  if (!state.animation) return { flight: 0 };
  const elapsed = time - state.animation.startedAt;
  return {
    flight: clamp(
      (elapsed - state.animation.runUpDuration) / Math.max(1, state.animation.flightDuration),
      0,
      1
    )
  };
}

function cameraForFrame(time) {
  const camera = buildCamera(state.currentStage);
  const progress = animationProgress(time);
  if (state.animation && progress.flight > 0) {
    const follow = easeOutCubic(progress.flight) * 0.42;
    camera.position.z -= follow;
    camera.position.y -= follow * 0.05;
    camera.target.y += follow * 0.06;
  }
  return camera;
}

function drawGloveShape(x, y, radius, rotation, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;

  ctx.shadowColor = "rgba(218,254,77,.7)";
  ctx.shadowBlur = radius * 1.4;
  ctx.fillStyle = "#f7ffd2";
  ctx.strokeStyle = "rgba(5,13,8,.94)";
  ctx.lineWidth = Math.max(1.7, radius * 0.22);

  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.12, radius * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#dafe4d";
  for (let finger = -2; finger <= 2; finger += 1) {
    const offset = finger * radius * 0.27;
    ctx.beginPath();
    ctx.roundRect(
      radius * 0.4,
      offset - radius * 0.1,
      radius * (0.72 - Math.abs(finger) * 0.05),
      radius * 0.2,
      radius * 0.09
    );
    ctx.fill();
  }

  ctx.fillStyle = "#172019";
  ctx.beginPath();
  ctx.roundRect(-radius * 1.18, -radius * 0.52, radius * 0.55, radius * 1.04, radius * 0.18);
  ctx.fill();
  ctx.restore();
}

function drawEnhancedKeeperContact(time) {
  const plan = state.shot?.keeperPlan;
  if (!state.animation || !plan || state.shot?.outcome !== "SAVE") return;

  const progress = animationProgress(time);
  const reactionFraction = clamp(
    plan.reaction / Math.max(0.01, plan.flightSeconds),
    0.08,
    0.72
  );
  const dive = easeOutCubic(
    clamp((progress.flight - reactionFraction) / Math.max(0.1, 0.94 - reactionFraction), 0, 1)
  );
  if (dive <= 0.025) return;

  const camera = cameraForFrame(time);
  const idle = keeperWorld(state.currentStage);
  const direction = Math.sign(plan.contact.x - idle.x || 1);
  const body = {
    x: lerp(idle.x, plan.contact.x, dive),
    y: Math.sin(dive * Math.PI) * 0.26,
    z: lerp(idle.z, plan.contact.z, dive)
  };

  const leadShoulder = {
    x: body.x - direction * 0.08,
    y: body.y + 1.31,
    z: body.z
  };
  const trailShoulder = {
    x: body.x + direction * 0.09,
    y: body.y + 1.21,
    z: body.z + 0.02
  };
  const reach = clamp(dive * 1.22, 0, 1);
  const leadHand = {
    x: lerp(leadShoulder.x, plan.contact.x, reach),
    y: lerp(leadShoulder.y, plan.contact.y, reach),
    z: lerp(leadShoulder.z, plan.contact.z, reach)
  };
  const trailHand = {
    x: lerp(trailShoulder.x, plan.contact.x - direction * 0.22, reach * 0.86),
    y: lerp(trailShoulder.y, plan.contact.y - 0.08, reach * 0.86),
    z: lerp(trailShoulder.z, plan.contact.z + 0.03, reach * 0.86)
  };

  const leadShoulderScreen = projectWorld(leadShoulder, camera, viewport);
  const trailShoulderScreen = projectWorld(trailShoulder, camera, viewport);
  const leadHandScreen = projectWorld(leadHand, camera, viewport);
  const trailHandScreen = projectWorld(trailHand, camera, viewport);
  if (![leadShoulderScreen, trailShoulderScreen, leadHandScreen, trailHandScreen].every((p) => p.visible)) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(247,255,242,.98)";
  ctx.lineWidth = clamp(leadShoulderScreen.scale * 0.105, 3.2, 7.2);

  ctx.beginPath();
  ctx.moveTo(leadShoulderScreen.x, leadShoulderScreen.y);
  ctx.lineTo(leadHandScreen.x, leadHandScreen.y);
  ctx.moveTo(trailShoulderScreen.x, trailShoulderScreen.y);
  ctx.lineTo(trailHandScreen.x, trailHandScreen.y);
  ctx.stroke();

  const leadRadius = clamp(leadHandScreen.scale * 0.16, 5.8, 12.5);
  const trailRadius = clamp(trailHandScreen.scale * 0.145, 5.1, 11.2);
  const gloveAngle = Math.atan2(
    leadHandScreen.y - leadShoulderScreen.y,
    leadHandScreen.x - leadShoulderScreen.x
  );
  drawGloveShape(trailHandScreen.x, trailHandScreen.y, trailRadius, gloveAngle, 0.86);
  drawGloveShape(leadHandScreen.x, leadHandScreen.y, leadRadius, gloveAngle, 1);

  const impactWindow = clamp((progress.flight - 0.78) / 0.16, 0, 1);
  if (impactWindow > 0) {
    ctx.strokeStyle = `rgba(218,254,77,${0.8 * (1 - impactWindow)})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(
      leadHandScreen.x,
      leadHandScreen.y,
      leadRadius + 5 + impactWindow * 24,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
  ctx.restore();
}

function timingForPresentation(presentation) {
  if (!presentation) return null;
  if (presentation.phase === "replay") {
    if (reducedMotion) return 160;
    if (presentation.outcome === "SAVE") return 920;
    if (presentation.outcome === "POST" || presentation.outcome === "BAR") return 820;
    return presentation.topCorner ? 900 : 680;
  }
  if (presentation.phase === "breakdown") return reducedMotion ? 850 : 1500;
  if (presentation.phase === "stage") return reducedMotion ? 500 : 900;
  return null;
}

function updatePacing(time) {
  const presentation = state.presentation;
  const phase = presentation?.phase ?? null;
  if (phase !== lastPresentationPhase) {
    lastPresentationPhase = phase;
    phaseStartedAt = time;
    autoAdvancedPhase = null;
  }

  const limit = timingForPresentation(presentation);
  if (!limit || autoAdvancedPhase === phase) return;
  if (time - phaseStartedAt < limit) return;
  if (document.hidden || state.screen !== "game") return;

  autoAdvancedPhase = phase;
  elements.shotAction?.click();
}

function injectPolishStyles() {
  const style = document.createElement("style");
  style.textContent = `
    #shotAction { transition: transform .12s ease, filter .12s ease; }
    #shotAction:active { transform: translateY(1px) scale(.995); }
    .result-banner.is-visible { letter-spacing: .035em; }
    @media (prefers-reduced-motion: reduce) {
      #shotAction { transition: none; }
    }
  `;
  document.head.appendChild(style);
}

function polishFrame(time) {
  if (state.screen === "game") {
    drawEnhancedKeeperContact(time);
    updatePacing(time);
  }
  requestAnimationFrame(polishFrame);
}

injectPolishStyles();
requestAnimationFrame(polishFrame);
