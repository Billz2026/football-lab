import { state } from "./core-v6.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";
import { goalkeeperVisualProfileV42 } from "./character-profiles-v42.js?v=42.1.0";

const BUILD = "44.0.0";
const RETRY_MS = 100;
const MAX_RETRIES = 100;
let installed = false;
let retryTimer = null;
let retries = 0;

function installNow() {
  if (installed) return true;
  const originalSceneDraw = window.__footballLabPremiumKeeperSceneDrawV3852;
  if (typeof originalSceneDraw !== "function") return false;

  window.__footballLabPremiumKeeperSceneDrawV3852 = function footballLabKeeperSceneV44(time) {
    const result = originalSceneDraw(time);
    const source = keeperForStage(state.stage);
    const visual = goalkeeperVisualProfileV42(source.id);
    const frame = window.__footballLabPremiumKeeperSceneFrameV3852;

    window.__footballLabKeeperFrameV44 = Object.freeze({
      build: BUILD,
      character: visual?.id || source.id,
      sourceKeeperId: source.id,
      renderer: "articulated-layered-2.5d",
      rig: "continuous-goalkeeper-skeletal-canvas",
      staticSpriteFrames: false,
      sceneDepth: true,
      motion: frame?.motion || "READY",
      airborne: Boolean(frame?.airborne),
      time
    });

    return result;
  };

  installed = true;
  clearTimeout(retryTimer);
  retryTimer = null;
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
    shotOutcomeChanged: false
  });
  return true;
}

function retryInstall() {
  if (installNow() || retries >= MAX_RETRIES) return;
  retries += 1;
  retryTimer = setTimeout(retryInstall, RETRY_MS);
}

export function installKeeperCharacterV44() {
  if (installNow()) return true;
  retryInstall();
  return false;
}

if (typeof window !== "undefined") installKeeperCharacterV44();
