import { drawHeroCharacterV42 } from "./hero-character-v42.js?v=51.1.0";

const BUILD = "51.1.0";

export function drawHeroCharacterV44(time) {
  drawHeroCharacterV42(time);

  const frame = window.__footballLabHeroFrameV42;
  const motion = window.__footballLabMotionSnapshotV42;
  if (!frame) return;

  window.__footballLabHeroFrameV44 = Object.freeze({
    build: BUILD,
    character: frame.character,
    sourceCharacterId: frame.sourceCharacterId,
    renderer: "polished-articulated-layered-2.5d",
    rig: "continuous-skeletal-canvas",
    staticSpriteFrames: false,
    phase: motion?.phase || "idle",
    plantLocked: Boolean(motion?.plantLocked),
    world: motion?.world || null,
    time
  });
}

window.__footballLabCharacterRendererV44 = Object.freeze({
  build: BUILD,
  renderer: "polished-articulated-layered-2.5d",
  rig: "continuous-skeletal-canvas",
  animation: "continuous-joint-interpolation",
  artDirection: "premium-modern-arcade-football",
  roundedAthleticGeometry: true,
  enlargedBootsAndHands: true,
  outfieldCharacters: 4,
  staticSpriteFrames: false,
  spriteAtlasRequired: false,
  gameplayPhysicsChanged: false,
  campaignChanged: false
});
