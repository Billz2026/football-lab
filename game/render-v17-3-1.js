import { drawScene as drawBaseScene, resizeCanvas } from "./render-v17-v1731.js?v=1731";
import { drawHeroKicker } from "./hero-kicker-v17-3-1.js?v=1731";

export { resizeCanvas };

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
  drawHeroKicker(time);
}

window.__footballLabRendererV17 = true;
window.__footballLabRigV171 = true;
window.__footballLabRendererV172 = true;
window.__footballLabRendererV173 = true;
window.__footballLabRendererV1731 = true;
