import { drawHeroCharacterV44 } from "./hero-character-v44.js?v=51.1.0";

const BUILD = "50.0.0";

export function drawArcadeHeroCharacterV50(time) {
  drawHeroCharacterV44(time);

  const frame = window.__footballLabHeroFrameV44;
  if (!frame) return;

  window.__footballLabHeroFrameV50 = Object.freeze({
    build: BUILD,
    character: frame.character,
    sourceCharacterId: frame.sourceCharacterId,
    renderer: "modern-arcade-articulated-2.5d",
    rig: "continuous-skeletal-canvas",
    artDirection: "modern-arcade-football",
    realismTarget: "low",
    readabilityTarget: "high",
    staticSpriteFrames: false,
    production3D: false,
    phase: frame.phase,
    plantLocked: frame.plantLocked,
    world: frame.world,
    time
  });
}

export const ARCADE_CHARACTER_SYSTEM_V50 = Object.freeze({
  build: BUILD,
  renderer: "modern-arcade-articulated-2.5d",
  artDirection: "modern-arcade-football",
  characterPriority: ["readability", "animation", "silhouette", "identity", "realism"],
  realismRequired: false,
  glbRequired: false,
  sharedRig: true,
  reusableCharacterBase: true,
  outfieldCharacters: 4,
  goalkeeperCharacters: 4,
  gameplayPhysicsChanged: false,
  keeperAIChanged: false
});

if (typeof window !== "undefined") {
  window.__footballLabArcadeCharacterSystemV50 = ARCADE_CHARACTER_SYSTEM_V50;
}
