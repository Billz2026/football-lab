import { clamp, easeInOutCubic, easeOutCubic, WORLD, state, ctx, canvasView } from "./core-v6.js?v=32.4";
import { buildCamera, kickerWorld } from "./world-v7.js?v=32.4";
import { projectedHeight } from "./projection-v6.js?v=32.4";
import { activeCharacter } from "./characters-v13.js?v=32.4";
import { drawHeroCharacterV42 } from "./hero-character-v42.js?v=42.1.0";
import {
  drawCharacterSpriteV43,
  preloadCharacterSpritesV43,
  spriteAtlasReadyV43,
  spriteAtlasStateV43
} from "./character-sprites-v43.js?v=43.0.0";

const BUILD = "43.0.0";
const VIEW = { width: WORLD.width, height: WORLD.height };

function transform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function progress(time) {
  if (!state.animation) return { elapsed: 0, run: 0, contact: 0, flight: 0, settle: 0, replay: false };
  const animation = state.animation;
  const runMs = Math.max(1, animation.runUpDuration || 1);
  const holdMs = Math.max(0, animation.contactHoldDuration || 0);
  const flightMs = Math.max(1, animation.flightDuration || 1);
  const settleMs = Math.max(1, animation.settleDuration || 1);
  const elapsed = time - animation.startedAt;
  const flightStart = runMs + holdMs;
  return {
    elapsed,
    run: clamp(elapsed / runMs, 0, 1),
    contact: holdMs ? clamp((elapsed - runMs) / holdMs, 0, 1) : 0,
    flight: clamp((elapsed - flightStart) / flightMs, 0, 1),
    settle: clamp((elapsed - flightStart - flightMs) / settleMs, 0, 1),
    replay: Boolean(animation.isReplay)
  };
}

function travel(p) {
  if (!state.animation) return 0;
  if (p.replay) return 1;
  return easeInOutCubic(clamp(p.run / 0.72, 0, 1));
}

function frameCamera(time, p) {
  const camera = buildCamera(state.currentStage);
  if (state.animation && p.flight > 0) {
    const follow = easeOutCubic(p.flight) * 0.42;
    camera.position.z -= follow;
    camera.position.y -= follow * 0.05;
    camera.target.y += follow * 0.06;
  }
  return camera;
}

function frameFor(p) {
  if (!state.animation) return { key: "viktor-idle-back", phase: "idle" };
  if (p.replay) {
    if (p.flight < 0.52) return { key: "viktor-contact", phase: "replay-contact" };
    if (p.flight < 0.82) return { key: "viktor-windup-side", phase: "replay-recover" };
    return { key: "viktor-idle-back", phase: "replay-reset" };
  }
  if (p.run < 0.54) return { key: "viktor-idle-back", phase: "approach" };
  if (p.run < 0.88 && p.contact <= 0 && p.flight <= 0) return { key: "viktor-windup-side", phase: "wind-up" };
  if (p.contact > 0 || p.flight < 0.38) return { key: "viktor-contact", phase: "contact" };
  if (p.flight < 0.74) return { key: "viktor-windup-side", phase: "follow-through" };
  return { key: "viktor-idle-back", phase: "recovery" };
}

function drawGroundShadow(foot, height, airborne = 0) {
  const alpha = clamp(0.22 - airborne * 0.13, 0.06, 0.22);
  ctx.save();
  const gradient = ctx.createRadialGradient(foot.x, foot.y + 2, 0, foot.x, foot.y + 2, height * 0.18);
  gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
  gradient.addColorStop(0.55, `rgba(0,0,0,${alpha * 0.42})`);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(foot.x, foot.y + 2, height * 0.18, height * 0.038, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawViktorSprite(time) {
  const p = progress(time);
  const world = kickerWorld(state.currentStage, travel(p));
  const camera = frameCamera(time, p);
  const projection = projectedHeight(world, 1.89, camera, VIEW);
  if (!projection || projection.height < 8) return false;

  transform();
  const frame = frameFor(p);
  const h = projection.height * 1.04;
  const bob = !state.animation ? Math.sin(time / 650) * h * 0.004 : 0;
  drawGroundShadow(projection.foot, h, Number(world.y) || 0);

  const drawn = drawCharacterSpriteV43(
    ctx,
    frame.key,
    projection.foot.x,
    projection.foot.y + bob,
    h,
    {
      offsetX: frame.key === "viktor-contact" ? h * 0.035 : 0,
      offsetY: frame.key === "viktor-contact" ? h * 0.006 : 0,
      rotation: frame.key === "viktor-contact" ? -0.018 : 0
    }
  );
  if (!drawn) return false;

  window.__footballLabHeroFrameV43 = {
    build: BUILD,
    character: "viktor-kane",
    sourceCharacterId: "dax-ryder",
    renderer: "premium-sprite-2.5d",
    phase: frame.phase,
    sprite: frame.key,
    atlasReady: true,
    run: p.run,
    flight: p.flight,
    world: { x: world.x, y: world.y, z: world.z },
    time
  };
  return true;
}

export function drawHeroCharacterV43(time) {
  if (["stage", "breakdown"].includes(state.presentation?.phase)) return;
  const character = activeCharacter();
  if (character.id !== "dax-ryder" || !spriteAtlasReadyV43()) {
    drawHeroCharacterV42(time);
    window.__footballLabHeroFrameV43 = {
      build: BUILD,
      character: character.name,
      sourceCharacterId: character.id,
      renderer: "v42-fallback",
      atlasReady: spriteAtlasReadyV43(),
      atlasStatus: spriteAtlasStateV43().status,
      time
    };
    return;
  }

  if (!drawViktorSprite(time)) drawHeroCharacterV42(time);
}

preloadCharacterSpritesV43();
window.__footballLabCharacterRendererV43 = Object.freeze({
  build: BUILD,
  renderer: "asset-backed-premium-2.5d",
  masterOutfield: "viktor-kane",
  masterGoalkeeper: "mikkel-storm",
  v42Fallback: true,
  gameplayPhysicsChanged: false,
  campaignChanged: false
});
