import { drawScene as drawBaseScene, resizeCanvas } from "./render-v17.js?v=172";
import { drawHeroKicker } from "./hero-kicker-v17-2.js?v=172";

export { resizeCanvas };

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
  drawHeroKicker(time);
}

window.__footballLabRendererV17 = true;
window.__footballLabRigV171 = true;
window.__footballLabRendererV172 = true;
