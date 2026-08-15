import { installKeeperCharacterV45 } from "./keeper-character-v45.js?v=45.0.0";

const BUILD = "44.0.0";

export function installKeeperCharacterV44() {
  const installed = installKeeperCharacterV45();
  window.__footballLabKeeperRendererV44 = Object.freeze({
    build: BUILD,
    renderer: "articulated-layered-2.5d",
    rig: "continuous-goalkeeper-skeletal-canvas",
    goalkeeperCharacters: 4,
    goalkeeperArchetypes: 5,
    staticSpriteFrames: false,
    spriteAtlasRequired: false,
    sceneDepthPreserved: true,
    keeperAIChanged: false,
    shotOutcomeChanged: false,
    upgradedBy: "45.0.0-volumetric"
  });
  return installed;
}

if (typeof window !== "undefined") installKeeperCharacterV44();
