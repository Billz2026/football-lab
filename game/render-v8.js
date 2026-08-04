import { drawScene as drawBaseScene, resizeCanvas } from "./render-v11-2-base.js?v=112";

export { resizeCanvas };

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
}
