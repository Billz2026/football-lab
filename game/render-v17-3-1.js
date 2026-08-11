import { drawScene as drawBaseScene, resizeCanvas } from "./render-v17-v1731.js?v=1731";
import { drawHeroKicker } from "./hero-kicker-v17-3-1.js?v=1731";
import { activeCharacter } from "./characters-v13.js?v=32.2";

export { resizeCanvas };

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
  drawHeroKicker(time);

  const heroSelected = activeCharacter().id === "dax-ryder";
  const baseVisible = heroSelected ? 0 : 1;
  const heroVisible = heroSelected ? 1 : 0;
  window.__footballLabVisibleKickersV1731 = {
    base: baseVisible,
    hero: heroVisible,
    total: baseVisible + heroVisible,
    character: activeCharacter().id,
    time
  };
}

window.__footballLabRendererV17 = true;
window.__footballLabRigV171 = true;
window.__footballLabRendererV172 = true;
window.__footballLabRendererV173 = true;
window.__footballLabRendererV1731 = true;
