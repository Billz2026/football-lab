import { drawHeroCharacterV45 } from "./hero-character-v45.js?v=45.0.0";

const BUILD = "44.0.0";

export function drawHeroCharacterV44(time) {
  drawHeroCharacterV45(time);

  const frame = window.__footballLabHeroFrameV45;
  const motion = window.__footballLabMotionSnapshotV45;
  if (!frame) return;

  window.__footballLabHeroFrameV44 = Object.freeze({
    build: BUILD,
    character: frame.character,
    sourceCharacterId: frame.sourceCharacterId,
    renderer: "articulated-layered-2.5d",
    rig: "continuous-skeletal-canvas",
    staticSpriteFrames: false,
    phase: motion?.phase || "idle",
    plantLocked: Boolean(motion?.plantLocked),
    world: motion?.world || null,
    upgradedBy: "45.0.0-volumetric",
    time
  });
}

window.__footballLabCharacterRendererV44 = Object.freeze({
  build: BUILD,
  renderer: "articulated-layered-2.5d",
  rig: "continuous-skeletal-canvas",
  animation: "continuous-joint-interpolation",
  outfieldCharacters: 4,
  staticSpriteFrames: false,
  spriteAtlasRequired: false,
  gameplayPhysicsChanged: false,
  campaignChanged: false,
  upgradedBy: "45.0.0-volumetric"
});
