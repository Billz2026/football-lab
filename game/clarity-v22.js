import {
  clamp,
  WORLD,
  state,
  elements,
  canvasView,
  currentAimTarget,
  easeOutCubic
} from "./core-v6.js?v=7";
import { GOAL, buildCamera, ballWorld, keeperWorld } from "./world-v7.js?v=7";
import { projectWorld, projectSegment, projectedHeight } from "./projection-v6.js?v=7";
import { sampleShotPath } from "./physics-v7.js?v=7";
import { keeperForStage } from "./keepers-v14.js?v=14";

const viewport = { width: WORLD.width, height: WORLD.height };
const TAU = Math.PI * 2;
const previousOverlay = document.querySelector("#clarityOverlayV21");
if (previousOverlay) previousOverlay.style.display = "none";

const overlay = document.createElement("canvas");
overlay.id = "clarityOverlayV22";
overlay.setAttribute("aria-hidden", "true");
Object.assign(overlay.style, {
  position: "absolute",
  inset: "0",
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  zIndex: "2",
  borderRadius: "inherit"
});
elements.canvas.insertAdjacentElement("afterend", overlay);
const overlayCtx = overlay.getContext("2d", { alpha: true });

for (const selector of [".wind-chip", ".result-banner", ".canvas-prompt"]) {
  const element = document.querySelector(selector);
  if (element) element.style.zIndex = "4";
}

const windChip = document.querySelector(".wind-chip");
if (windChip) {
  Object.assign(windChip.style, {
    inset: "14px auto auto 14px",
    minWidth: "96px",
    padding: "9px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,.16)",
    background: "rgba(2,8,5,.82)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 24px rgba(0,0,0,.24)"
  });
}

let previousPhase = state.phase;
let lastAimWorld = null;
let lockFlash = null;

function syncOverlaySize() {
  if (overlay.width !== elements.canvas.width) overlay.width = elements.canvas.width;
  if (overlay.height !== elements.canvas.height) overlay.height = elements.canvas.height;
}

function applyWorldTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  overlayCtx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function animationProgress(time) {
  if (!state.animation) return { flight: 0, motionFlight: 0 };
  const elapsed = time - state.animation.startedAt;
  const run = Math.max(1, state.animation.runUpDuration || 1);
  const contact = Math.max(0, state.animation.contactHoldDuration || 0);
  const duration = Math.max(1, state.animation.flightDuration || 1);
  const flight = clamp((elapsed - run - contact) / duration, 0, 1);
  const motionFlight = state.animation.isReplay
    ? flight < 0.67
      ? easeOutCubic(flight / 0.67) * 0.82
      : 0.82 + ((flight - 0.67) / 0.33) * 0.18
    : flight;
  return { flight, motionFlight: clamp(motionFlight, 0, 1) };
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

function targetWorld(target = currentAimTarget()) {
  return {
    x: -GOAL.halfWidth + target.x * GOAL.width,
    y: GOAL.height * (1 - target.y),
    z: 0.035
  };
}

function drawKeeperGrounding(time, camera) {
  if (state.animation) return false;
  const keeper = keeperForStage(state.stage);
  const world = keeperWorld(state.currentStage);
  world.x += Math.sin(time / 620) * 0.14;
  const projection = projectedHeight(world, keeper.visualHeight * 1.08, camera, viewport);
  if (!projection) return false;

  const { foot, height } = projection;
  overlayCtx.save();
  const shadow = overlayCtx.createRadialGradient(foot.x, foot.y + 3, 0, foot.x, foot.y + 3, height * 0.27);
  shadow.addColorStop(0, "rgba(0,0,0,.62)");
  shadow.addColorStop(0.55, "rgba(0,0,0,.26)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  overlayCtx.fillStyle = shadow;
  overlayCtx.beginPath();
  overlayCtx.ellipse(foot.x, foot.y + 4, height * 0.27, height * 0.06, 0, 0, TAU);
  overlayCtx.fill();
  overlayCtx.restore();
  return true;
}

function drawGoalZones(camera) {
  for (const fraction of [1 / 3, 2 / 3]) {
    const x = -GOAL.halfWidth + GOAL.width * fraction;
    const segment = projectSegment(
      { x, y: 0.04, z: 0.025 },
      { x, y: GOAL.height, z: 0.025 },
      camera,
      viewport
    );
    if (!segment) continue;
    overlayCtx.save();
    overlayCtx.strokeStyle = "rgba(244,255,239,.28)";
    overlayCtx.lineWidth = 1.25;
    overlayCtx.setLineDash([5, 6]);
    overlayCtx.beginPath();
    overlayCtx.moveTo(segment.a.x, segment.a.y);
    overlayCtx.lineTo(segment.b.x, segment.b.y);
    overlayCtx.stroke();
    overlayCtx.restore();
  }
}

function drawAimGuide(camera) {
  const start = projectWorld(ballWorld(state.currentStage), camera, viewport);
  const end = projectWorld(targetWorld(), camera, viewport);
  if (!start.visible || !end.visible) return;

  overlayCtx.save();
  overlayCtx.setLineDash([10, 8]);
  overlayCtx.strokeStyle = "rgba(1,7,4,.9)";
  overlayCtx.lineWidth = 5.6;
  overlayCtx.beginPath();
  overlayCtx.moveTo(start.x, start.y);
  overlayCtx.lineTo(end.x, end.y);
  overlayCtx.stroke();

  overlayCtx.strokeStyle = "rgba(218,254,77,.96)";
  overlayCtx.lineWidth = 2.5;
  overlayCtx.stroke();
  overlayCtx.restore();
}

function drawTargetMarker(time, camera) {
  const world = targetWorld();
  lastAimWorld = { ...world };
  const point = projectWorld(world, camera, viewport);
  if (!point.visible) return { visible: false, radius: 0 };

  const radius = clamp(point.scale * 0.34, 15, 24);
  const pulse = 1 + Math.sin(time / 145) * 0.06;
  overlayCtx.save();
  overlayCtx.translate(point.x, point.y);
  overlayCtx.scale(pulse, pulse);

  const backing = overlayCtx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.7);
  backing.addColorStop(0, "rgba(2,7,4,.42)");
  backing.addColorStop(0.58, "rgba(2,7,4,.78)");
  backing.addColorStop(1, "rgba(2,7,4,0)");
  overlayCtx.fillStyle = backing;
  overlayCtx.beginPath();
  overlayCtx.arc(0, 0, radius * 1.7, 0, TAU);
  overlayCtx.fill();

  overlayCtx.shadowColor = "rgba(218,254,77,.96)";
  overlayCtx.shadowBlur = 18;
  overlayCtx.strokeStyle = "rgba(255,255,255,.99)";
  overlayCtx.lineWidth = 5;
  overlayCtx.beginPath();
  overlayCtx.arc(0, 0, radius, 0, TAU);
  overlayCtx.stroke();

  overlayCtx.shadowBlur = 7;
  overlayCtx.strokeStyle = "#dafe4d";
  overlayCtx.lineWidth = 2.8;
  overlayCtx.stroke();

  const cross = radius * 1.55;
  const gap = radius * 0.56;
  overlayCtx.shadowBlur = 0;
  overlayCtx.strokeStyle = "rgba(1,7,4,.96)";
  overlayCtx.lineWidth = 7;
  overlayCtx.beginPath();
  overlayCtx.moveTo(-cross, 0); overlayCtx.lineTo(-gap, 0);
  overlayCtx.moveTo(gap, 0); overlayCtx.lineTo(cross, 0);
  overlayCtx.moveTo(0, -cross); overlayCtx.lineTo(0, -gap);
  overlayCtx.moveTo(0, gap); overlayCtx.lineTo(0, cross);
  overlayCtx.stroke();

  overlayCtx.strokeStyle = "#dafe4d";
  overlayCtx.lineWidth = 3.2;
  overlayCtx.stroke();

  overlayCtx.fillStyle = "#fff";
  overlayCtx.beginPath();
  overlayCtx.arc(0, 0, Math.max(3.5, radius * 0.2), 0, TAU);
  overlayCtx.fill();

  overlayCtx.fillStyle = "#dafe4d";
  overlayCtx.strokeStyle = "rgba(1,7,4,.96)";
  overlayCtx.lineWidth = 2.5;
  overlayCtx.beginPath();
  overlayCtx.moveTo(0, -radius * 1.88);
  overlayCtx.lineTo(-radius * 0.38, -radius * 1.32);
  overlayCtx.lineTo(radius * 0.38, -radius * 1.32);
  overlayCtx.closePath();
  overlayCtx.fill();
  overlayCtx.stroke();
  overlayCtx.restore();
  return { visible: true, radius };
}

function updateLockFlash(time) {
  if (state.phase === "aim") lastAimWorld = targetWorld();
  if (previousPhase === "aim" && state.phase !== "aim" && lastAimWorld) {
    lockFlash = { world: { ...lastAimWorld }, startedAt: time };
  }
  previousPhase = state.phase;
}

function drawLockFlash(time, camera) {
  if (!lockFlash) return false;
  const elapsed = time - lockFlash.startedAt;
  if (elapsed > 480) {
    lockFlash = null;
    return false;
  }
  const point = projectWorld(lockFlash.world, camera, viewport);
  if (!point.visible) return false;
  const progress = clamp(elapsed / 480, 0, 1);
  const radius = 18 + progress * 28;
  overlayCtx.save();
  overlayCtx.globalAlpha = 1 - progress;
  overlayCtx.shadowColor = "#dafe4d";
  overlayCtx.shadowBlur = 15;
  overlayCtx.strokeStyle = "#fff";
  overlayCtx.lineWidth = 4 - progress * 2;
  overlayCtx.beginPath();
  overlayCtx.arc(point.x, point.y, radius, 0, TAU);
  overlayCtx.stroke();
  overlayCtx.fillStyle = "#dafe4d";
  overlayCtx.font = "900 11px system-ui";
  overlayCtx.textAlign = "center";
  overlayCtx.fillText("LOCKED", point.x, point.y - radius - 8);
  overlayCtx.restore();
  return true;
}

function drawBallContrast(time, camera) {
  if (!state.animation || !state.shot?.path?.length) return false;
  const progress = animationProgress(time);
  if (progress.motionFlight <= 0 || progress.motionFlight >= 1) return false;
  const world = sampleShotPath(state.shot.path, progress.motionFlight);
  if (!world) return false;
  const point = projectWorld(world, camera, viewport);
  if (!point.visible) return false;
  const radius = clamp(point.scale * 0.118, 4.5, 11.5);

  overlayCtx.save();
  overlayCtx.strokeStyle = "rgba(1,5,3,.94)";
  overlayCtx.lineWidth = 5.5;
  overlayCtx.beginPath();
  overlayCtx.arc(point.x, point.y, radius + 1, 0, TAU);
  overlayCtx.stroke();
  overlayCtx.strokeStyle = "rgba(255,255,255,.98)";
  overlayCtx.lineWidth = 2.1;
  overlayCtx.beginPath();
  overlayCtx.arc(point.x, point.y, radius + 0.5, 0, TAU);
  overlayCtx.stroke();
  overlayCtx.restore();
  return true;
}

function render(time) {
  syncOverlaySize();
  overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
  updateLockFlash(time);

  const frame = {
    active: false,
    keeperGrounded: false,
    keeperOvalVisible: false,
    targetVisible: false,
    targetRadius: 0,
    lockFlash: false,
    ballOutlined: false,
    time
  };

  if (state.screen === "game" && state.currentStage) {
    frame.active = true;
    applyWorldTransform();
    const camera = cameraForFrame(time);
    frame.keeperGrounded = drawKeeperGrounding(time, camera);

    if (state.phase === "aim") {
      drawGoalZones(camera);
      drawAimGuide(camera);
      const target = drawTargetMarker(time, camera);
      frame.targetVisible = target.visible;
      frame.targetRadius = target.radius;
    }

    frame.lockFlash = drawLockFlash(time, camera);
    frame.ballOutlined = drawBallContrast(time, camera);
  }

  window.__footballLabClarityFrameV22 = frame;
  requestAnimationFrame(render);
}

window.__footballLabClarityV22 = Object.freeze({
  separateOverlayCanvas: true,
  replacesV21Overlay: true,
  targetMinimumRadius: 15,
  targetMaximumRadius: 24,
  aimGuideUnderStroke: true,
  goalThirdGuides: true,
  lockConfirmationMs: 480,
  goalkeeperOvalRemoved: true,
  goalkeeperGroundShadow: true,
  ballContrastOutline: true,
  windChipRestyled: true
});

requestAnimationFrame(render);
