import { drawScene as drawBaseScene, resizeCanvas } from "./render-v7.js?v=7";
import {
  clamp, lerp, WORLD, state, ctx, easeOutCubic
} from "./core-v6.js?v=7";
import { buildCamera, keeperWorld } from "./world-v7.js?v=7";
import { projectWorld } from "./projection-v6.js?v=7";

const viewport = { width: WORLD.width, height: WORLD.height };

export { resizeCanvas };

function progressAt(time) {
  if (!state.animation) return { flight: 0 };
  const elapsed = time - state.animation.startedAt;
  return {
    flight: clamp((elapsed - state.animation.runUpDuration) / state.animation.flightDuration, 0, 1)
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

function drawKeeperReach(time) {
  const plan = state.shot?.keeperPlan;
  if (!state.animation || !plan) return;

  const progress = progressAt(time);
  const reactionFraction = clamp(plan.reaction / Math.max(0.01, plan.flightSeconds), 0.1, 0.72);
  const dive = easeOutCubic(
    clamp((progress.flight - reactionFraction) / Math.max(0.12, 0.94 - reactionFraction), 0, 1)
  );
  if (dive <= 0.02) return;

  const camera = cameraForFrame(time);
  const idle = keeperWorld(state.currentStage);
  const body = {
    x: lerp(idle.x, plan.contact.x, dive),
    y: Math.sin(dive * Math.PI) * 0.26,
    z: lerp(idle.z, plan.contact.z, dive)
  };
  const direction = Math.sign(plan.contact.x - idle.x || 1);
  const shoulder = {
    x: body.x - direction * 0.05,
    y: body.y + 1.28,
    z: body.z
  };
  const reach = clamp(dive * 1.18, 0, 1);
  const hand = {
    x: lerp(shoulder.x, plan.contact.x, reach),
    y: lerp(shoulder.y, plan.contact.y, reach),
    z: lerp(shoulder.z, plan.contact.z, reach)
  };
  const elbow = {
    x: lerp(shoulder.x, hand.x, 0.54) - direction * 0.08,
    y: lerp(shoulder.y, hand.y, 0.54) - 0.04,
    z: lerp(shoulder.z, hand.z, 0.54)
  };

  const shoulderScreen = projectWorld(shoulder, camera, viewport);
  const elbowScreen = projectWorld(elbow, camera, viewport);
  const handScreen = projectWorld(hand, camera, viewport);
  if (!shoulderScreen.visible || !elbowScreen.visible || !handScreen.visible) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(245,247,241,.96)";
  ctx.lineWidth = clamp(shoulderScreen.scale * 0.09, 2.2, 5.4);
  ctx.beginPath();
  ctx.moveTo(shoulderScreen.x, shoulderScreen.y);
  ctx.lineTo(elbowScreen.x, elbowScreen.y);
  ctx.lineTo(handScreen.x, handScreen.y);
  ctx.stroke();

  const gloveRadius = clamp(handScreen.scale * 0.095, 2.8, 6.5);
  ctx.fillStyle = plan.saved ? "#f4ffbf" : "rgba(244,255,191,.78)";
  ctx.beginPath();
  ctx.arc(handScreen.x, handScreen.y, gloveRadius, 0, Math.PI * 2);
  ctx.fill();

  if (plan.saved && progress.flight > 0.78) {
    const pulse = clamp((progress.flight - 0.78) / 0.18, 0, 1);
    ctx.strokeStyle = `rgba(218,254,77,${0.55 * (1 - pulse)})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(handScreen.x, handScreen.y, gloveRadius + pulse * 14, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
  drawKeeperReach(time);
}
