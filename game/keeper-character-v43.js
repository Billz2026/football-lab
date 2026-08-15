import { clamp, easeOutCubic, lerp, state, ctx, canvasView } from "./core-v6.js?v=32.4";
import { buildCamera } from "./world-v7.js?v=32.4";
import { projectWorld, projectedHeight } from "./projection-v6.js?v=32.4";
import { sampleShotPath } from "./physics-v7.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";
import {
  drawCharacterSpriteV43,
  preloadCharacterSpritesV43,
  spriteAtlasReadyV43,
  spriteAtlasStateV43
} from "./character-sprites-v43.js?v=43.1.0";

const BUILD = "43.1.0";
const VIEW = Object.freeze({ width: 1200, height: 720 });
let installed = false;
let originalSceneDraw = null;
let retryTimer = null;

function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function replayPathProgress(value) {
  const t = clamp(value, 0, 1);
  if (t < 0.67) return easeOutCubic(t / 0.67) * 0.82;
  return 0.82 + smooth01((t - 0.67) / 0.33) * 0.18;
}

function cinematicFlightProgress(value) {
  const t = clamp(value, 0, 1);
  if (t <= 0.87) return (t / 0.87) * 0.9;
  return 0.9 + smooth01((t - 0.87) / 0.13) * 0.1;
}

function motionProgress(time) {
  if (!state.animation) return { motionFlight: 0, replay: false };
  const elapsed = time - state.animation.startedAt;
  const run = Math.max(1, state.animation.runUpDuration || 1);
  const contact = Math.max(0, state.animation.contactHoldDuration || 0);
  const flightDuration = Math.max(1, state.animation.flightDuration || 1);
  const flight = clamp((elapsed - run - contact) / flightDuration, 0, 1);
  const replay = Boolean(state.animation.isReplay);
  return {
    motionFlight: replay ? replayPathProgress(flight) : cinematicFlightProgress(flight),
    replay
  };
}

function cameraForFrame(time) {
  const camera = buildCamera(state.currentStage);
  const progress = motionProgress(time);
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
      camera.target.z = lerp(camera.target.z, ball.z, follow * (1 - progress.motionFlight) * 0.42);
    }
  }
  return camera;
}

function applyCanvasTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function isMikkelArchetype(profile) {
  return profile?.id === "giant" || profile?.id === "aggressive";
}

function isDiveMotion(motion) {
  return /DIVE|PARRY|LAND|CATCH_SECURE/.test(String(motion || ""));
}

function drawSoftShadow(foot, height, airborne) {
  const alpha = clamp(0.18 - airborne * 0.12, 0.045, 0.18);
  ctx.save();
  const gradient = ctx.createRadialGradient(foot.x, foot.y + 2, 0, foot.x, foot.y + 2, height * 0.2);
  gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
  gradient.addColorStop(0.55, `rgba(0,0,0,${alpha * 0.42})`);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(foot.x, foot.y + 2, height * 0.2, height * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMikkelSprite(time, keeper, profile) {
  if (!keeper?.world || !keeper?.pose || !spriteAtlasReadyV43()) return false;
  const camera = cameraForFrame(time);
  const visualHeight = Math.max(1.93, Number(profile?.visualHeight) || 1.93) * 1.08;
  const projection = projectedHeight(keeper.world, visualHeight, camera, VIEW);
  if (!projection || projection.height < 8) return false;

  applyCanvasTransform();
  const motion = keeper.pose.motion || "READY";
  const diving = isDiveMotion(motion);
  const h = projection.height * (diving ? 1.12 : 1.04);
  drawSoftShadow(projection.foot, h, Number(keeper.world.y) || 0);

  let drawn = false;
  if (diving) {
    const centreWorld = {
      x: keeper.world.x,
      y: keeper.world.y + visualHeight * 0.52,
      z: keeper.world.z
    };
    const centre = projectWorld(centreWorld, camera, VIEW);
    if (centre.visible) {
      const direction = Math.sign(keeper.pose.rotation || 1);
      drawn = drawCharacterSpriteV43(ctx, "mikkel-dive", centre.x, centre.y, h, {
        anchorX: 0.53,
        anchorY: 0.5,
        flipX: direction < 0,
        rotation: direction * 0.012
      });
    }
  } else {
    drawn = drawCharacterSpriteV43(ctx, "mikkel-set", projection.foot.x, projection.foot.y, h, {
      anchorX: 0.5,
      anchorY: 0.985,
      offsetY: Math.sin(time / 720) * h * 0.002
    });
  }

  if (drawn) {
    window.__footballLabKeeperFrameV43 = {
      build: BUILD,
      character: "mikkel-storm",
      sourceKeeperId: profile.id,
      renderer: "premium-sprite-2.5d",
      fidelity: "approved-reference-high-resolution",
      motion,
      sprite: diving ? "mikkel-dive" : "mikkel-set",
      atlasReady: true,
      sceneDepth: true,
      time
    };
  }
  return drawn;
}

function installNow() {
  if (installed) return true;
  const current = window.__footballLabPremiumKeeperSceneDrawV3852;
  if (typeof current !== "function") return false;
  originalSceneDraw = current;

  window.__footballLabPremiumKeeperSceneDrawV3852 = function footballLabKeeperSceneV43(time) {
    const profile = keeperForStage(state.stage);
    if (!isMikkelArchetype(profile) || !spriteAtlasReadyV43()) {
      window.__footballLabKeeperFrameV43 = {
        build: BUILD,
        sourceKeeperId: profile.id,
        renderer: "v38-fallback",
        atlasReady: spriteAtlasReadyV43(),
        atlasStatus: spriteAtlasStateV43().status,
        time
      };
      return originalSceneDraw(time);
    }

    ctx.save();
    const previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = 0;
    const result = originalSceneDraw(time);
    ctx.globalAlpha = previousAlpha;
    ctx.restore();

    const frame = window.__footballLabPremiumKeeperSceneFrameV3852;
    if (!drawMikkelSprite(time, frame?.keeper, profile)) return originalSceneDraw(time);
    return result;
  };

  installed = true;
  window.__footballLabKeeperRendererV43 = Object.freeze({
    build: BUILD,
    renderer: "asset-backed-premium-2.5d",
    fidelity: "approved-reference-high-resolution",
    masterGoalkeeper: "mikkel-storm",
    sourceArchetypes: ["giant", "aggressive"],
    sceneDepthPreserved: true,
    keeperAIChanged: false,
    shotOutcomeChanged: false,
    v38Fallback: true
  });
  return true;
}

export function installKeeperCharacterV43() {
  if (installNow()) return true;
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => installNow(), 0);
  setTimeout(() => installNow(), 600);
  return false;
}

preloadCharacterSpritesV43();
if (typeof window !== "undefined") installKeeperCharacterV43();
