import { drawScene as drawBaseScene, resizeCanvas } from "./render-v17-v1731.js?v=1731";
import { drawHeroCharacterV42 } from "./hero-character-v42.js?v=42.0.0";
import { activeCharacter } from "./characters-v13.js?v=32.4";

export { resizeCanvas };

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
  drawHeroCharacterV42(time);

  window.__footballLabVisibleKickersV1731 = {
    base: 0,
    hero: 1,
    total: 1,
    character: activeCharacter().id,
    renderer: "v42-layered-character",
    time
  };
}

window.__footballLabRendererV17 = true;
window.__footballLabRigV171 = true;
window.__footballLabRendererV172 = true;
window.__footballLabRendererV173 = true;
window.__footballLabRendererV1731 = true;
window.__footballLabCharacterRendererBridgeV42 = true;
