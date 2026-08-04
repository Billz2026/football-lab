import { drawScene as drawBaseScene, resizeCanvas } from "./render-v11-4-base.js?v=114";

export { resizeCanvas };

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
}
