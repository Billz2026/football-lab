import {
  AIM_BOUNDS,
  WORLD,
  aimTargetLabel,
  canvasView,
  clamp,
  currentAimTarget,
  elements,
  state
} from "./core-v6.js?v=31";
import { GOAL, buildCamera } from "./world-v7.js?v=31";
import { cameraBasis } from "./projection-v6.js?v=31";

const BUILD = "32.1.0";
const viewport = { width: WORLD.width, height: WORLD.height };
const meterWrap = document.querySelector(".meter-wrap");
const controlPanel = document.querySelector(".control-panel");

if (!meterWrap || !controlPanel || !elements.canvas) {
  throw new Error("Build 32.1 could not initialise the free-aim controls.");
}

if (!document.querySelector('link[href*="free-aim-v32-1.css"]')) {
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "./game/free-aim-v32-1.css?v=32.1";
  style.dataset.footballLabFreeAim = "v32.1";
  document.head.appendChild(style);
}

const control = document.createElement("section");
control.id = "freeAimControlV321";
control.className = "free-aim-v321";
control.setAttribute("aria-label", "Two-dimensional shot placement");
control.innerHTML = `
  <div class="free-aim-pad-v321" id="freeAimPadV321" role="application" tabindex="0" aria-label="Shot placement pad. Drag or use arrow keys to aim anywhere around the goal.">
    <div class="free-aim-goal-v321" aria-hidden="true"></div>
    <i class="free-aim-reticle-v321" id="freeAimReticleV321" aria-hidden="true"></i>
  </div>
  <div class="free-aim-copy-v321">
    <span>EXACT TARGET</span>
    <strong id="freeAimLabelV321">HIGH CENTRE</strong>
    <small id="freeAimCoachV321">DRAG ON GOAL OR PAD</small>
  </div>
`;
meterWrap.insertAdjacentElement("beforebegin", control);

const pad = document.getElementById("freeAimPadV321");
const reticle = document.getElementById("freeAimReticleV321");
const label = document.getElementById("freeAimLabelV321");
const coach = document.getElementById("freeAimCoachV321");

let previousPhase = state.phase;
let draggingCanvas = false;
let draggingPad = false;

function normalise(value, min, max) {
  return (value - min) / (max - min);
}

function coachForTarget(target) {
  if (target.x < 0) return "ADD RIGHT BEND TO RETURN";
  if (target.x > 1) return "ADD LEFT BEND TO RETURN";
  if (target.y < 0) return "TARGET IS ABOVE THE BAR";
  if (target.y > 1) return "TARGET IS BELOW THE GOAL";
  return "FULL HEIGHT + WIDTH CONTROL";
}

function updatePlacement(x, y, source = "direct") {
  if (state.phase !== "aim" || !state.shot) return false;
  state.shot.previewAimX = clamp(x, AIM_BOUNDS.minX, AIM_BOUNDS.maxX);
  state.shot.previewAimY = clamp(y, AIM_BOUNDS.minY, AIM_BOUNDS.maxY);
  state.shot.aimSource = source;
  const target = currentAimTarget();
  label.textContent = target.label;
  coach.textContent = coachForTarget(target);
  elements.aimReadout.textContent = target.label;
  reticle.style.left = `${normalise(target.x, AIM_BOUNDS.minX, AIM_BOUNDS.maxX) * 100}%`;
  reticle.style.top = `${normalise(target.y, AIM_BOUNDS.minY, AIM_BOUNDS.maxY) * 100}%`;
  window.__footballLabFreeAimFrameV321 = {
    phase: state.phase,
    x: target.x,
    y: target.y,
    label: target.label,
    source
  };
  return true;
}

function placementFromPad(event) {
  const rect = pad.getBoundingClientRect();
  const xRatio = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  const yRatio = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
  return {
    x: AIM_BOUNDS.minX + xRatio * (AIM_BOUNDS.maxX - AIM_BOUNDS.minX),
    y: AIM_BOUNDS.minY + yRatio * (AIM_BOUNDS.maxY - AIM_BOUNDS.minY)
  };
}

function placementFromCanvas(event) {
  const rect = elements.canvas.getBoundingClientRect();
  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;
  const screenX = (canvasX - canvasView.offsetX) / Math.max(0.0001, canvasView.scale);
  const screenY = (canvasY - canvasView.offsetY) / Math.max(0.0001, canvasView.scale);
  const camera = buildCamera(state.currentStage);
  const basis = cameraBasis(camera);
  const focal = (viewport.height / 2) / Math.tan((camera.fovY * Math.PI / 180) / 2);
  const horizontal = (screenX - viewport.width / 2) / focal;
  const vertical = (viewport.height / 2 - screenY) / focal;
  const ray = {
    x: basis.forward.x + basis.right.x * horizontal + basis.up.x * vertical,
    y: basis.forward.y + basis.right.y * horizontal + basis.up.y * vertical,
    z: basis.forward.z + basis.right.z * horizontal + basis.up.z * vertical
  };
  if (Math.abs(ray.z) < 0.0001) return currentAimTarget();
  const distance = (GOAL.lineZ + 0.035 - camera.position.z) / ray.z;
  const worldX = camera.position.x + ray.x * distance;
  const worldY = camera.position.y + ray.y * distance;
  return {
    x: (worldX + GOAL.halfWidth) / GOAL.width,
    y: 1 - worldY / GOAL.height
  };
}

pad.addEventListener("pointerdown", (event) => {
  if (state.phase !== "aim" || !event.isPrimary) return;
  event.preventDefault();
  draggingPad = true;
  pad.setPointerCapture?.(event.pointerId);
  const target = placementFromPad(event);
  updatePlacement(target.x, target.y, "pad");
});

pad.addEventListener("pointermove", (event) => {
  if (!draggingPad || state.phase !== "aim") return;
  event.preventDefault();
  const target = placementFromPad(event);
  updatePlacement(target.x, target.y, "pad");
});

pad.addEventListener("pointerup", () => { draggingPad = false; });
pad.addEventListener("pointercancel", () => { draggingPad = false; });

elements.canvas.addEventListener("pointerdown", (event) => {
  if (state.phase !== "aim" || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  draggingCanvas = true;
  elements.canvas.setPointerCapture?.(event.pointerId);
  const target = placementFromCanvas(event);
  updatePlacement(target.x, target.y, "pitch");
}, { capture: true, passive: false });

elements.canvas.addEventListener("pointermove", (event) => {
  if (!draggingCanvas || state.phase !== "aim") return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const target = placementFromCanvas(event);
  updatePlacement(target.x, target.y, "pitch");
}, { capture: true, passive: false });

function finishCanvasDrag(event) {
  if (!draggingCanvas) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  draggingCanvas = false;
}

elements.canvas.addEventListener("pointerup", finishCanvasDrag, { capture: true, passive: false });
elements.canvas.addEventListener("pointercancel", finishCanvasDrag, { capture: true, passive: false });

document.addEventListener("keydown", (event) => {
  if (state.phase !== "aim" || state.screen !== "game") return;
  const key = event.key.toLowerCase();
  const directions = {
    arrowleft: [-1, 0], a: [-1, 0],
    arrowright: [1, 0], d: [1, 0],
    arrowup: [0, -1], w: [0, -1],
    arrowdown: [0, 1], s: [0, 1]
  };
  const direction = directions[key];
  if (!direction) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const target = currentAimTarget();
  const step = event.shiftKey ? 0.008 : 0.025;
  updatePlacement(target.x + direction[0] * step, target.y + direction[1] * step, "keyboard");
}, { capture: true });

function syncPhase() {
  const phase = state.phase;
  if (phase !== previousPhase) {
    document.documentElement.dataset.freeAimV321 = phase === "aim" ? "active" : "inactive";
    if (phase === "aim") {
      updatePlacement(state.shot.previewAimX, state.shot.previewAimY, state.shot.aimSource || "default");
      requestAnimationFrame(() => pad.focus({ preventScroll: true }));
    } else if (phase === "curve" && Number.isFinite(state.shot?.aimX)) {
      if (state.shot.aimX < 0) {
        elements.phaseHelp.textContent = "The line starts outside the left of the wall. Add RIGHT curl to bend the ball back toward goal.";
      } else if (state.shot.aimX > 1) {
        elements.phaseHelp.textContent = "The line starts outside the right of the wall. Add LEFT curl to bend the ball back toward goal.";
      }
    }
    previousPhase = phase;
  }
  requestAnimationFrame(syncPhase);
}

document.documentElement.dataset.freeAimV321 = "inactive";
updatePlacement(0.5, 0.27, "default");
requestAnimationFrame(syncPhase);

window.__footballLabFreeAimV321 = Object.freeze({
  build: BUILD,
  directPitchAim: true,
  dragPadAim: true,
  keyboardAim: true,
  unrestrictedHeight: true,
  outsidePostLanes: true,
  progressiveReturnCurl: true,
  powerIndependentHeight: true,
  bounds: { ...AIM_BOUNDS },
  setAim(x, y) {
    return updatePlacement(Number(x), Number(y), "api");
  },
  labelFor(x, y) {
    return aimTargetLabel(Number(x), Number(y));
  }
});
