import { drawScene as drawBaseScene, resizeCanvas } from "./render-v17.js?v=173";
import { drawHeroKicker } from "./hero-kicker-v17-3.js?v=173";

export { resizeCanvas };

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
  drawHeroKicker(time);
}

window.__footballLabRendererV17 = true;
window.__footballLabRigV171 = true;
window.__footballLabRendererV172 = true;
window.__footballLabRendererV173 = true;
