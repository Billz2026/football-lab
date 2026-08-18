import { drawArcadeHeroCharacterV50 } from "./arcade-character-v50.js?v=51.1.0";
import { activeCharacter } from "./characters-v13.js?v=32.4";

const BUILD = "51.1.0";

export function drawArcadeHeroCharacterV51(time) {
  drawArcadeHeroCharacterV50(time);

  const legacyFrame = window.__footballLabHeroFrameV50;
  const motion = window.__footballLabMotionSnapshotV42;
  const character = activeCharacter();

  window.__footballLabHeroFrameV51 = Object.freeze({
    build: BUILD,
    character: legacyFrame?.character || character?.id || null,
    sourceCharacterId: legacyFrame?.sourceCharacterId || character?.id || null,
    renderer: "polished-modern-arcade-articulated-2.5d",
    rig: "continuous-skeletal-canvas",
    artDirection: "premium-modern-arcade-football",
    realismTarget: "low",
    readabilityTarget: "very-high",
    silhouetteTarget: "hero-readable",
    kitSeparation: "high-contrast",
    proportions: "stylised-athletic",
    geometryPass: "rounded-athletic-v51.1",
    oversizedReadabilityFeatures: Object.freeze(["head", "boots", "hands", "keeper-gloves"]),
    staticSpriteFrames: false,
    production3D: false,
    phase: motion?.phase || legacyFrame?.phase || "idle",
    plantLocked: motion?.plantLocked ?? legacyFrame?.plantLocked ?? false,
    world: legacyFrame?.world || null,
    time
  });
}

export const ARCADE_CHARACTER_SYSTEM_V51 = Object.freeze({
  build: BUILD,
  renderer: "polished-modern-arcade-articulated-2.5d",
  artDirection: "premium-modern-arcade-football",
  characterPriority: ["readability", "silhouette", "animation", "identity", "realism"],
  lockedStyleRules: Object.freeze({
    realismRequired: false,
    simpleFaces: true,
    athleticExaggeration: true,
    highContrastKits: true,
    chunkierBoots: true,
    largerHands: true,
    roundedShirtSilhouette: true,
    balancedStrikePose: true,
    largerGoalkeeperGloves: true,
    fixedCameraReadability: true
  }),
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
  window.__footballLabArcadeCharacterSystemV51 = ARCADE_CHARACTER_SYSTEM_V51;
}
