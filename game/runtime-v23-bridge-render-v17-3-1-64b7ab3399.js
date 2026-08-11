import { drawScene as drawBaseScene, resizeCanvas } from "./runtime-v23-generated-render-v17-v1731-7f257084b1.js?v=30";
import { drawHeroKicker } from "./runtime-v23-generated-hero-kicker-v17-3-1-7c97a59e31.js?v=30";
import { activeCharacter } from "./characters-v13.js?v=13";

export { resizeCanvas };

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
  drawHeroKicker(time);

  const baseVisible = 0;
  const heroVisible = 1;
  window.__footballLabVisibleKickersV30 = {
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
