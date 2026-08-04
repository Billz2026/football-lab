import { drawScene as drawBaseScene, resizeCanvas } from "./render-v11-3-base.js?v=113";

export { resizeCanvas };

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
}
