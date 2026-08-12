import {
  AIM_BOUNDS,
  WORLD,
  aimTargetLabel,
  canvasView,
  clamp,
  currentAimTarget,
  elements,
  state
} from "./core-v6.js?v=32.4";
import { buildCamera, GOAL } from "./world-v7.js?v=32.4";
import { projectWorld } from "./projection-v6.js?v=32.4";

const BUILD = "32.4.0";
const MODE_KEY = "footballLabShotModeV324";
const MODES = Object.freeze(["guided", "standard", "expert"]);
const gameFrame = document.querySelector(".game-frame");
const meter = document.querySelector(".meter");

if (!gameFrame || !elements.canvas || !elements.shotAction || !meter) {
  throw new Error("Build 32.4 could not initialise the strike controls.");
}

function readMode() {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    return MODES.includes(saved) ? saved : "standard";
  } catch {
    return "standard";
  }
}

state.controlMode = readMode();

const consolePanel = document.createElement("section");
consolePanel.id = "strikeConsoleV324";
consolePanel.className = "strike-console-v324";
consolePanel.setAttribute("aria-hidden", "true");
consolePanel.innerHTML = `
  <div class="strike-console-top-v324">
    <div class="strike-target-copy-v324">
      <span>INTENDED TARGET</span>
      <strong id="strikeTargetLabelV324">HIGH CENTRE</strong>
      <small>Tap or drag directly on the goal</small>
    </div>
    <button class="strike-mode-v324" id="strikeModeV324" type="button" aria-label="Change shot difficulty">
      <span>MODE</span><strong>STANDARD</strong>
    </button>
  </div>
  <div class="strike-dial-row-v324">
    <div class="strike-dial-v324" aria-label="Curl control">
      <svg viewBox="0 0 240 118" aria-hidden="true">
        <path class="strike-dial-track-v324" d="M 27 101 A 96 96 0 0 1 213 101"></path>
        <path class="strike-dial-zone-v324" d="M 27 101 A 96 96 0 0 1 213 101"></path>
        <g class="strike-dial-ticks-v324">
          <path d="M31 101l10-2M42 68l9 4M67 40l6 8M101 25l2 10M139 25l-2 10M173 40l-6 8M198 68l-9 4M209 101l-10-2"></path>
        </g>
      </svg>
      <i class="strike-needle-v324" id="strikeNeedleV324"><b></b></i>
      <span class="strike-dial-left-v324">LEFT</span>
      <span class="strike-dial-centre-v324">CLEAN</span>
      <span class="strike-dial-right-v324">RIGHT</span>
      <input id="strikeCurveV324" type="range" min="-100" max="100" step="1" value="0" aria-label="Curl: left, clean or right" />
    </div>
    <div class="strike-shape-copy-v324">
      <span>STRIKE SHAPE</span>
      <strong id="strikeCurveLabelV324">CLEAN STRIKE</strong>
      <small id="strikeRiskV324">Balanced contact window</small>
    </div>
    <button class="button button-primary strike-start-v324" id="strikeStartV324" type="button">
      <span>STRIKE</span><small>Power, then contact</small>
    </button>
  </div>
  <div class="strike-compact-guide-v324">
    <span><b>1</b> Set target + curl</span><i></i><span><b>2</b> Stop power</span><i></i><span><b>3</b> Stop contact</span>
  </div>
`;
gameFrame.appendChild(consolePanel);

const contactZone = document.createElement("i");
contactZone.id = "contactZoneV324";
contactZone.className = "contact-zone-v324";
contactZone.setAttribute("aria-hidden", "true");
meter.appendChild(contactZone);

const curveInput = consolePanel.querySelector("#strikeCurveV324");
const curveLabel = consolePanel.querySelector("#strikeCurveLabelV324");
const riskLabel = consolePanel.querySelector("#strikeRiskV324");
const targetLabel = consolePanel.querySelector("#strikeTargetLabelV324");
const needle = consolePanel.querySelector("#strikeNeedleV324");
const modeButton = consolePanel.querySelector("#strikeModeV324");
const startButton = consolePanel.querySelector("#strikeStartV324");

let draggingAim = false;
let previousPhase = state.phase;

function modeCopy(mode) {
  return ({ guided: "GUIDED", standard: "STANDARD", expert: "EXPERT" })[mode] || "STANDARD";
}

function setMode(mode) {
  state.controlMode = MODES.includes(mode) ? mode : "standard";
  document.documentElement.dataset.shotModeV324 = state.controlMode;
  modeButton.querySelector("strong").textContent = modeCopy(state.controlMode);
  try { localStorage.setItem(MODE_KEY, state.controlMode); } catch { /* in-memory mode still works */ }
  window.dispatchEvent(new CustomEvent("footballlab:shotmodechange", { detail: { mode: state.controlMode } }));
  renderAimControls();
}

function curveCopy(curve) {
  const amount = Math.round(Math.abs(curve) * 100);
  if (amount < 8) return "CLEAN STRIKE";
  if (amount < 48) return `${curve < 0 ? "LEFT" : "RIGHT"} CURL · ${amount}%`;
  return `${curve < 0 ? "LEFT" : "RIGHT"} WHIP · ${amount}%`;
}

function setCurve(value, source = "manual") {
  if (!state.shot) return;
  const curve = clamp(Number(value) || 0, -1, 1);
  state.shot.previewCurve = curve;
  state.shot.curveSource = source;
  curveInput.value = String(Math.round(curve * 100));
  renderAimControls();
}

function setTarget(x, y, source = "manual") {
  if (!state.shot) return;
  state.shot.previewAimX = clamp(Number(x), AIM_BOUNDS.minX, AIM_BOUNDS.maxX);
  state.shot.previewAimY = clamp(Number(y), AIM_BOUNDS.minY, AIM_BOUNDS.maxY);
  state.shot.aimSource = source;
  renderAimControls();
}

function projectedAimQuad() {
  const camera = buildCamera(state.currentStage);
  const world = (x, y) => ({
    x: -GOAL.halfWidth + x * GOAL.width,
    y: GOAL.height * (1 - y),
    z: 0.03
  });
  return [
    projectWorld(world(AIM_BOUNDS.minX, AIM_BOUNDS.minY), camera, WORLD),
    projectWorld(world(AIM_BOUNDS.maxX, AIM_BOUNDS.minY), camera, WORLD),
    projectWorld(world(AIM_BOUNDS.minX, AIM_BOUNDS.maxY), camera, WORLD),
    projectWorld(world(AIM_BOUNDS.maxX, AIM_BOUNDS.maxY), camera, WORLD)
  ];
}

function bilinear(quad, u, v) {
  const [topLeft, topRight, bottomLeft, bottomRight] = quad;
  return {
    x: topLeft.x * (1 - u) * (1 - v) + topRight.x * u * (1 - v)
      + bottomLeft.x * (1 - u) * v + bottomRight.x * u * v,
    y: topLeft.y * (1 - u) * (1 - v) + topRight.y * u * (1 - v)
      + bottomLeft.y * (1 - u) * v + bottomRight.y * u * v
  };
}

function inverseBilinear(point, quad) {
  let u = 0.5;
  let v = 0.5;
  for (let index = 0; index < 8; index += 1) {
    const current = bilinear(quad, u, v);
    const du = bilinear(quad, clamp(u + 0.001, 0, 1), v);
    const dv = bilinear(quad, u, clamp(v + 0.001, 0, 1));
    const ax = (du.x - current.x) / 0.001;
    const ay = (du.y - current.y) / 0.001;
    const bx = (dv.x - current.x) / 0.001;
    const by = (dv.y - current.y) / 0.001;
    const ex = point.x - current.x;
    const ey = point.y - current.y;
    const determinant = ax * by - ay * bx;
    if (Math.abs(determinant) < 0.0001) break;
    u = clamp(u + (ex * by - ey * bx) / determinant, 0, 1);
    v = clamp(v + (ey * ax - ex * ay) / determinant, 0, 1);
  }
  return { u, v };
}

function targetFromPointer(event) {
  const rect = elements.canvas.getBoundingClientRect();
  const point = {
    x: (event.clientX - rect.left - canvasView.offsetX) / Math.max(0.0001, canvasView.scale),
    y: (event.clientY - rect.top - canvasView.offsetY) / Math.max(0.0001, canvasView.scale)
  };
  const { u, v } = inverseBilinear(point, projectedAimQuad());
  return {
    x: AIM_BOUNDS.minX + u * (AIM_BOUNDS.maxX - AIM_BOUNDS.minX),
    y: AIM_BOUNDS.minY + v * (AIM_BOUNDS.maxY - AIM_BOUNDS.minY)
  };
}

function handleAimPointer(event) {
  if (state.phase !== "aim" || state.screen !== "game" || !event.isPrimary) return;
  if (event.type === "pointerdown" && event.pointerType === "mouse" && event.button !== 0) return;
  if (event.type === "pointermove" && !draggingAim) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (event.type === "pointerdown") {
    draggingAim = true;
    elements.canvas.setPointerCapture?.(event.pointerId);
  }
  const target = targetFromPointer(event);
  setTarget(target.x, target.y);
}

elements.canvas.addEventListener("pointerdown", handleAimPointer, { capture: true, passive: false });
elements.canvas.addEventListener("pointermove", handleAimPointer, { capture: true, passive: false });
elements.canvas.addEventListener("pointerup", (event) => {
  if (!draggingAim) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  draggingAim = false;
}, { capture: true, passive: false });
elements.canvas.addEventListener("pointercancel", () => { draggingAim = false; }, { capture: true });

function renderAimControls() {
  if (!state.shot) return;
  const target = currentAimTarget();
  const curve = clamp(state.shot.previewCurve || 0, -1, 1);
  targetLabel.textContent = aimTargetLabel(target.x, target.y);
  curveLabel.textContent = curveCopy(curve);
  needle.style.transform = `rotate(${curve * 62}deg)`;
  curveInput.value = String(Math.round(curve * 100));
  const extreme = Math.abs(curve);
  riskLabel.textContent = extreme > 0.78
    ? "Very tight contact window"
    : extreme > 0.46 ? "Curl reduces contact margin" : "Balanced contact window";
  elements.aimReadout.textContent = aimTargetLabel(target.x, target.y);
  elements.curveReadout.textContent = curveCopy(curve);
  modeButton.querySelector("strong").textContent = modeCopy(state.controlMode);
  window.__footballLabStrikeFrameV324 = {
    active: state.phase === "aim" && state.screen === "game",
    target: { x: target.x, y: target.y, label: aimTargetLabel(target.x, target.y) },
    curve,
    mode: state.controlMode,
    prediction: null,
    automaticRoute: null
  };
}

function syncExecutionZone() {
  const halfWindow = clamp(Number(state.shot?.contactWindow) || 0.1, 0.045, 0.18);
  meter.style.setProperty("--contact-window-v324", `${halfWindow * 200}%`);
  const perfectHalf = Math.max(0.018, halfWindow * 0.34);
  meter.style.setProperty("--perfect-window-v324", `${perfectHalf * 200}%`);
}

function activateAim() {
  consolePanel.setAttribute("aria-hidden", "false");
  document.documentElement.dataset.strikePhaseV324 = "aim";
  elements.canvasPrompt.textContent = "TAP GOAL TO AIM · SET CURL · STRIKE";
  renderAimControls();
}

function deactivateAim() {
  consolePanel.setAttribute("aria-hidden", "true");
}

function syncPhase() {
  if (state.phase !== previousPhase) {
    document.documentElement.dataset.strikePhaseV324 = state.phase;
    if (state.phase === "aim" && state.screen === "game") activateAim();
    else deactivateAim();
    if (state.phase === "contact") syncExecutionZone();
    previousPhase = state.phase;
  }
  requestAnimationFrame(syncPhase);
}

curveInput.addEventListener("input", () => setCurve(Number(curveInput.value) / 100));
modeButton.addEventListener("click", () => {
  const index = MODES.indexOf(state.controlMode);
  setMode(MODES[(index + 1) % MODES.length]);
});
startButton.addEventListener("click", () => {
  if (state.phase !== "aim" || !state.shot) return;
  window.dispatchEvent(new CustomEvent("footballlab:beginstrike"));
});

document.addEventListener("keydown", (event) => {
  if (state.phase !== "aim" || state.screen !== "game") return;
  const key = event.key.toLowerCase();
  const target = currentAimTarget();
  const step = event.shiftKey ? 0.008 : 0.026;
  const movement = {
    arrowleft: [-step, 0], a: [-step, 0],
    arrowright: [step, 0], d: [step, 0],
    arrowup: [0, -step], w: [0, -step],
    arrowdown: [0, step], s: [0, step]
  }[key];
  if (movement) {
    event.preventDefault();
    event.stopImmediatePropagation();
    setTarget(target.x + movement[0], target.y + movement[1]);
  } else if (key === "q" || key === "e") {
    event.preventDefault();
    event.stopImmediatePropagation();
    setCurve((state.shot.previewCurve || 0) + (key === "q" ? -0.06 : 0.06));
  }
}, { capture: true });

setMode(state.controlMode);
document.documentElement.dataset.strikePhaseV324 = state.phase;
requestAnimationFrame(syncPhase);

const contract = Object.freeze({
  build: BUILD,
  livePitchAim: true,
  solvedTrajectory: false,
  automaticRoutes: false,
  twoStopExecution: ["power", "contact"],
  defaultMode: "standard",
  modes: [...MODES],
  bounds: { ...AIM_BOUNDS },
  setTarget(x, y) { setTarget(x, y, "api"); },
  setCurve(value) { setCurve(value, "api"); },
  setMode
});
window.__footballLabStrikeV324 = contract;
