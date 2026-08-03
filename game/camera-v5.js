import { WORLD, state, elements, stageConfig } from "./core.js?v=5";

let lastSignature = "";

function syncStageCamera() {
  if (state.screen === "game" && elements.canvas) {
    const { camera } = stageConfig();
    const width = elements.canvas.offsetWidth || WORLD.width;
    const height = elements.canvas.offsetHeight || WORLD.height;
    const x = camera.x * (width / WORLD.width);
    const y = camera.y * (height / WORLD.height);
    const signature = `${state.stage}:${Math.round(width)}:${Math.round(height)}:${camera.x}:${camera.y}:${camera.zoom}`;

    if (signature !== lastSignature) {
      elements.canvas.style.transformOrigin = "50% 50%";
      elements.canvas.style.transform = `translate(${x}px, ${y}px) scale(${camera.zoom})`;
      lastSignature = signature;
    }
  }
  requestAnimationFrame(syncStageCamera);
}

requestAnimationFrame(syncStageCamera);
