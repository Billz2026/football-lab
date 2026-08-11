import {
  AIM_BOUNDS,
  aimTargetLabel,
  clamp,
  currentAimTarget,
  elements,
  idealPower,
  state
} from "./core-v6.js?v=32.3";
import { previewShotPhysics } from "./runtime-v23-bridge-physics-v19-f1d39f9409.js?v=32.3";
import { GOAL, ballWorld, keeperWorld } from "./world-v7.js?v=32.3";
import { buildWallLayout, wallForStage } from "./walls-v15.js?v=32.3";

const BUILD = "32.3.0";
const VIEWBOX = Object.freeze({ width: 1000, height: 620 });
const gameFrame = document.querySelector(".game-frame");

if (!gameFrame || !elements.canvas || !elements.shotAction) {
  throw new Error("Build 32.3 could not initialise the shot planner.");
}

const planner = document.createElement("section");
planner.id = "aimPlannerV322";
planner.className = "aim-planner-v322";
planner.setAttribute("aria-hidden", "true");
planner.innerHTML = `
  <div class="aim-planner-shell-v322">
    <header class="aim-planner-header-v322">
      <div>
        <span class="aim-kicker-v322">FREE-KICK VIEW · TARGET + BEND</span>
        <h2>CHOOSE YOUR TARGET</h2>
        <p>Tap the goal or the space around it. The coloured flight line predicts the real shot.</p>
      </div>
      <div class="aim-free-badge-v322"><i></i> FULL AIM RANGE</div>
    </header>

    <div class="aim-route-row-v322" role="group" aria-label="Quick shot routes">
      <button type="button" data-aim-route="over"><span>↑</span><strong>OVER WALL</strong><small>High direct arc</small></button>
      <button type="button" data-aim-route="left"><span>↶</span><strong>AROUND LEFT</strong><small>Outside then return</small></button>
      <button type="button" data-aim-route="right"><span>↷</span><strong>AROUND RIGHT</strong><small>Outside then return</small></button>
    </div>

    <div class="aim-surface-v322" id="aimSurfaceV322" role="application" tabindex="0" aria-label="Goal aiming view. Drag anywhere to choose the final target.">
      <div class="aim-sky-v322" aria-hidden="true"></div>
      <div class="aim-stands-v322" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="aim-pitch-v322" aria-hidden="true"></div>
      <div class="aim-goal-v322" aria-hidden="true"><i></i><b></b></div>
      <div class="aim-wall-v322" id="aimWallV322" aria-hidden="true"></div>
      <i class="aim-keeper-v322" id="aimKeeperV322" aria-hidden="true"></i>
      <svg class="aim-path-v322" id="aimPathV322" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
        <path class="aim-path-shadow-v322" id="aimPathShadowV322"></path>
        <path class="aim-path-line-v322" id="aimPathLineV322"></path>
        <circle class="aim-impact-v322" id="aimImpactV322" r="11"></circle>
      </svg>
      <i class="aim-finish-v322" id="aimFinishV322" aria-hidden="true"></i>
      <button class="aim-target-v322" id="aimTargetV322" type="button" aria-label="Drag shot target">
        <i></i><span id="aimTargetLabelV322">HIGH CENTRE</span>
      </button>
      <div class="aim-verdict-v322 is-checking" id="aimVerdictV322" aria-live="polite">
        <span>SHOT PREDICTION</span><strong>CHECKING ROUTE…</strong><small>Move the target to update</small>
      </div>
      <div class="aim-surface-hint-v322"><strong>DRAG TARGET</strong><span>Every point inside and outside the goal is available</span></div>
    </div>

    <div class="aim-feedback-v322">
      <div class="aim-frame-card-v322" id="aimFrameCardV322"><span>SHOT RESULT</span><strong id="aimFrameStatusV322">ON TARGET</strong><small id="aimFinalTargetV322">HIGH CENTRE</small></div>
      <div class="aim-status-v322" id="aimWallStatusV322"><span>ROUTE PAST WALL</span><strong>CHECKING…</strong><small id="aimClearanceV322">—</small></div>
    </div>

    <div class="aim-bend-v322">
      <div class="aim-bend-heading-v322"><span>BALL ROUTE · <b id="aimWindV322">CALM WIND</b></span><strong id="aimBendLabelV322">STRAIGHT</strong></div>
      <button type="button" class="aim-bend-nudge-v322" data-curve-nudge="-0.08" aria-label="Add more left bend">−</button>
      <input id="aimCurveV322" type="range" min="-100" max="100" step="1" value="0" aria-label="Ball bend. Left to right." />
      <button type="button" class="aim-bend-nudge-v322" data-curve-nudge="0.08" aria-label="Add more right bend">+</button>
      <div class="aim-bend-scale-v322" aria-hidden="true"><span>BEND LEFT</span><span>STRAIGHT</span><span>BEND RIGHT</span></div>
    </div>

    <button class="button button-primary aim-take-shot-v322" id="aimTakeShotV322" type="button">
      <span>TAKE FREE KICK</span><small>Target and route locked</small>
    </button>
  </div>
`;
gameFrame.appendChild(planner);

const mobilePlannerQuery = matchMedia("(max-width: 700px)");

function syncPlannerHost() {
  const host = mobilePlannerQuery.matches ? document.body : gameFrame;
  if (planner.parentElement !== host) host.appendChild(planner);
}

mobilePlannerQuery.addEventListener?.("change", syncPlannerHost);
syncPlannerHost();

const surface = planner.querySelector("#aimSurfaceV322");
const targetMarker = planner.querySelector("#aimTargetV322");
const targetLabel = planner.querySelector("#aimTargetLabelV322");
const pathLine = planner.querySelector("#aimPathLineV322");
const pathShadow = planner.querySelector("#aimPathShadowV322");
const impactMarker = planner.querySelector("#aimImpactV322");
const finishMarker = planner.querySelector("#aimFinishV322");
const wallLayer = planner.querySelector("#aimWallV322");
const keeper = planner.querySelector("#aimKeeperV322");
const wallStatus = planner.querySelector("#aimWallStatusV322");
const frameCard = planner.querySelector("#aimFrameCardV322");
const verdict = planner.querySelector("#aimVerdictV322");
const clearanceLabel = planner.querySelector("#aimClearanceV322");
const finalTargetLabel = planner.querySelector("#aimFinalTargetV322");
const frameStatus = planner.querySelector("#aimFrameStatusV322");
const windLabel = planner.querySelector("#aimWindV322");
const bendLabel = planner.querySelector("#aimBendLabelV322");
const curveInput = planner.querySelector("#aimCurveV322");
const takeShot = planner.querySelector("#aimTakeShotV322");
const routeButtons = [...planner.querySelectorAll("[data-aim-route]")];

let dragging = false;
let previousPhase = state.phase;
let activeRoute = "over";
let currentPreview = null;

function ratio(value, min, max) {
  return (value - min) / (max - min);
}

function aimToView(x, y) {
  return {
    x: clamp(ratio(x, AIM_BOUNDS.minX, AIM_BOUNDS.maxX), 0, 1),
    y: clamp(ratio(y, AIM_BOUNDS.minY, AIM_BOUNDS.maxY), 0, 1)
  };
}

function worldToView(point) {
  return aimToView(
    (point.x + GOAL.halfWidth) / GOAL.width,
    1 - point.y / GOAL.height
  );
}

function bendText(curve) {
  const amount = Math.round(Math.abs(curve) * 100);
  if (amount < 8) return "STRAIGHT";
  return `${curve < 0 ? "LEFT" : "RIGHT"} BEND · ${amount}%`;
}

function intendedTarget() {
  const target = currentAimTarget();
  return { x: target.x, y: target.y };
}

function setTarget(x, y, source = "manual") {
  if (!state.shot) return;
  state.shot.previewAimX = clamp(Number(x), AIM_BOUNDS.minX, AIM_BOUNDS.maxX);
  state.shot.previewAimY = clamp(Number(y), AIM_BOUNDS.minY, AIM_BOUNDS.maxY);
  state.shot.aimSource = source;
  if (source === "manual") activeRoute = null;
  renderPlanner();
}

function setCurve(value, source = "manual") {
  if (!state.shot) return;
  state.shot.previewCurve = clamp(Number(value), -1, 1);
  state.shot.curveSource = source;
  curveInput.value = String(Math.round(state.shot.previewCurve * 100));
  if (source === "manual") activeRoute = null;
  renderPlanner();
}

function previewFor(target, curve) {
  return previewShotPhysics({
    power: Number.isFinite(state.shot?.power) ? state.shot.power : idealPower(),
    aimX: target.x,
    aimY: target.y,
    curve
  });
}

function candidatesForRoute(route) {
  if (route === "left") {
    return [
      { x: 0.02, y: 0.2, curve: -1 },
      { x: 0.08, y: 0.24, curve: -0.95 },
      { x: 0.16, y: 0.2, curve: -1 },
      { x: 0.22, y: 0.3, curve: -0.9 },
      { x: 0.08, y: 0.48, curve: -0.9 },
      { x: 0.05, y: 0.38, curve: -0.82 }
    ];
  }
  if (route === "right") {
    return [
      { x: 0.98, y: 0.2, curve: 1 },
      { x: 0.92, y: 0.24, curve: 0.95 },
      { x: 0.84, y: 0.2, curve: 1 },
      { x: 0.78, y: 0.3, curve: 0.9 },
      { x: 0.7, y: 0.2, curve: 1 },
      { x: 0.92, y: 0.48, curve: 0.9 },
      { x: 0.95, y: 0.38, curve: 0.82 }
    ];
  }
  const protectedRatio = clamp(
    ((state.currentStage?.protectedGoalX || 0) + GOAL.halfWidth) / GOAL.width,
    0.18,
    0.82
  );
  return [
    { x: protectedRatio, y: 0.1, curve: 0 },
    { x: protectedRatio, y: 0.07, curve: 0 },
    { x: clamp(protectedRatio, 0.28, 0.72), y: 0.13, curve: 0 },
    { x: 0.5, y: 0.08, curve: 0 }
  ];
}

function chooseRoute(route) {
  if (!state.shot) return;
  const candidates = candidatesForRoute(route);
  const routeLane = route === "over" ? "OVER" : "AROUND";
  const selection = candidates.find((candidate) => {
    const preview = previewFor(candidate, candidate.curve);
    return preview.outcome !== "WALL" && preview.diagnostics?.wallLane === routeLane;
  })
    || candidates.find((candidate) => previewFor(candidate, candidate.curve).outcome !== "WALL")
    || candidates[0];
  activeRoute = route;
  state.shot.previewAimX = selection.x;
  state.shot.previewAimY = selection.y;
  state.shot.previewCurve = selection.curve;
  state.shot.aimSource = `preset-${route}`;
  state.shot.curveSource = `preset-${route}`;
  curveInput.value = String(Math.round(selection.curve * 100));
  renderPlanner();
}

function renderWall() {
  const target = intendedTarget();
  const curve = state.shot?.previewCurve || 0;
  const worldTargetX = -GOAL.halfWidth + target.x * GOAL.width;
  const layout = buildWallLayout(state.currentStage, state.stage, { targetX: worldTargetX, curve });
  const profile = wallForStage(state.stage);
  const feetY = worldToView({ x: 0, y: 0 }).y;
  wallLayer.replaceChildren(...layout.players.map((player) => {
    const body = document.createElement("i");
    body.innerHTML = "<b></b><span></span><em></em>";
    const head = worldToView({ x: player.x, y: profile.playerHeight });
    const feet = worldToView({ x: player.x, y: 0 });
    body.style.left = `${feet.x * 100}%`;
    body.style.top = `${head.y * 100}%`;
    body.style.height = `${Math.max(6, (feetY - head.y) * 100)}%`;
    return body;
  }));

  const keeperWorldPoint = keeperWorld(state.currentStage);
  const keeperHead = worldToView({ x: keeperWorldPoint.x, y: 1.96 });
  const keeperFeet = worldToView({ x: keeperWorldPoint.x, y: 0 });
  keeper.style.left = `${keeperFeet.x * 100}%`;
  keeper.style.top = `${keeperHead.y * 100}%`;
  keeper.style.height = `${Math.max(7, (keeperFeet.y - keeperHead.y) * 100)}%`;
  if (!keeper.firstElementChild) keeper.innerHTML = "<b></b><span></span><em></em>";
}

function predictionFor(preview) {
  const final = preview.diagnostics?.finalTarget;
  if (preview.outcome === "WALL") {
    return { key: "wall", label: "WALL BLOCKED", detail: "Move the target or change the bend" };
  }
  if (!final) return { key: "wide", label: "WIDE", detail: "No valid finish point" };

  const postGap = GOAL.halfWidth - Math.abs(final.x);
  const barGap = GOAL.height - final.y;
  const insideWidth = Math.abs(final.x) < GOAL.halfWidth;
  const insideHeight = final.y > 0 && final.y < GOAL.height;
  if (preview.outcome === "BAR" || (insideWidth && barGap >= 0 && barGap < 0.24)) {
    return { key: "frame", label: "CROSSBAR RISK", detail: "Aim slightly lower" };
  }
  if (preview.outcome === "POST" || (insideHeight && postGap >= 0 && postGap < 0.24)) {
    return { key: "frame", label: "POST RISK", detail: "Aim slightly inside the post" };
  }
  if (!insideWidth || !insideHeight || preview.outcome === "MISS") {
    return { key: "wide", label: "WIDE", detail: "Target finishes outside the goal" };
  }
  return {
    key: "target",
    label: "ON TARGET",
    detail: preview.outcome === "SAVE" ? "Keeper can reach this finish" : "Clear route into the goal"
  };
}

function renderPath(preview) {
  const primaryPath = Number.isInteger(preview.impactIndex)
    ? preview.path.slice(0, preview.impactIndex + 1)
    : preview.path;
  const samples = primaryPath.filter((_, index) => index % 4 === 0 || index === primaryPath.length - 1);
  const final = preview.diagnostics?.finalTarget;
  const finishView = final ? worldToView({ ...final, z: GOAL.lineZ }) : { x: 0.5, y: 0.5 };
  const points = samples.map((point, index) => {
    const progress = Number.isFinite(point.t)
      ? clamp(point.t, 0, 1)
      : index / Math.max(1, samples.length - 1);
    const worldView = worldToView(point);
    // The stadium planner is a perspective view, not a technical elevation plot.
    // Keep the true lateral route while compressing height into a readable broadcast arc.
    const view = {
      x: worldView.x,
      y: clamp(0.92 + (finishView.y - 0.92) * progress - Math.sin(Math.PI * progress) * 0.14, 0.04, 0.97)
    };
    return `${(view.x * VIEWBOX.width).toFixed(1)},${(view.y * VIEWBOX.height).toFixed(1)}`;
  });
  const pathData = points.length ? `M ${points.join(" L ")}` : "";
  pathLine.setAttribute("d", pathData);
  pathShadow.setAttribute("d", pathData);
  const prediction = predictionFor(preview);
  pathLine.dataset.prediction = prediction.key;
  pathLine.classList.toggle("is-blocked", preview.outcome === "WALL");

  if (preview.outcome === "WALL" && preview.collision?.point) {
    const impact = worldToView(preview.collision.point);
    impactMarker.setAttribute("cx", String(impact.x * VIEWBOX.width));
    impactMarker.setAttribute("cy", String(impact.y * VIEWBOX.height));
    impactMarker.classList.add("is-visible");
  } else {
    impactMarker.classList.remove("is-visible");
  }

  if (final) {
    const view = worldToView({ ...final, z: GOAL.lineZ });
    finishMarker.style.left = `${view.x * 100}%`;
    finishMarker.style.top = `${view.y * 100}%`;
  }
}

function renderFeedback(preview) {
  const diagnostics = preview.diagnostics || {};
  const clearance = diagnostics.wallClearanceMetres;
  const blocked = preview.outcome === "WALL";
  const around = diagnostics.wallLane === "AROUND";
  wallStatus.classList.toggle("is-blocked", blocked);
  wallStatus.classList.toggle("is-clear", !blocked);
  wallStatus.querySelector("strong").textContent = blocked
    ? "BLOCKED"
    : around ? "AROUND WALL" : "CLEAR OF WALL";
  clearanceLabel.textContent = Number.isFinite(clearance)
    ? `${clearance >= 0 ? "+" : ""}${clearance.toFixed(2)} m ${around ? "lateral/height margin" : "clearance"}`
    : "open route";

  const target = intendedTarget();
  const label = aimTargetLabel(target.x, target.y);
  finalTargetLabel.textContent = label;
  targetLabel.textContent = label;
  elements.aimReadout.textContent = label;

  const prediction = predictionFor(preview);
  frameStatus.textContent = prediction.label;
  frameCard.dataset.prediction = prediction.key;
  verdict.className = `aim-verdict-v322 is-${prediction.key}`;
  verdict.querySelector("strong").textContent = prediction.label;
  verdict.querySelector("small").textContent = prediction.detail;

  const wind = Number(diagnostics.windMetres) || 0;
  windLabel.textContent = Math.abs(wind) < 0.03
    ? "CALM WIND"
    : `${wind < 0 ? "LEFT" : "RIGHT"} WIND ${Math.abs(wind).toFixed(2)} m`;

  const curve = state.shot?.previewCurve || 0;
  bendLabel.textContent = bendText(curve);
  elements.curveReadout.textContent = bendText(curve);
}

function renderPlanner() {
  if (!state.shot || state.phase !== "aim") return;
  const target = intendedTarget();
  const curve = clamp(state.shot.previewCurve || 0, -1, 1);
  const marker = aimToView(target.x, target.y);
  targetMarker.style.left = `${marker.x * 100}%`;
  targetMarker.style.top = `${marker.y * 100}%`;
  targetMarker.classList.toggle("is-left-edge", marker.x < 0.2);
  targetMarker.classList.toggle("is-right-edge", marker.x > 0.8);
  targetMarker.classList.toggle("is-bottom-edge", marker.y > 0.78);
  curveInput.value = String(Math.round(curve * 100));
  routeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.aimRoute === activeRoute));
  renderWall();
  currentPreview = previewFor(target, curve);
  renderPath(currentPreview);
  renderFeedback(currentPreview);
  window.__footballLabAimFrameV322 = {
    active: true,
    target: { ...target },
    curve,
    route: activeRoute || "manual",
    outcome: currentPreview.outcome,
    wallLane: currentPreview.diagnostics?.wallLane,
    wallClearance: currentPreview.diagnostics?.wallClearanceMetres,
    finalTarget: currentPreview.diagnostics?.finalTarget,
    prediction: predictionFor(currentPreview).label
  };
  window.__footballLabAimFrameV323 = window.__footballLabAimFrameV322;
}

function targetFromPointer(event) {
  const rect = surface.getBoundingClientRect();
  return {
    x: AIM_BOUNDS.minX + clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1)
      * (AIM_BOUNDS.maxX - AIM_BOUNDS.minX),
    y: AIM_BOUNDS.minY + clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1)
      * (AIM_BOUNDS.maxY - AIM_BOUNDS.minY)
  };
}

surface.addEventListener("pointerdown", (event) => {
  if (state.phase !== "aim" || !event.isPrimary) return;
  event.preventDefault();
  dragging = true;
  surface.setPointerCapture?.(event.pointerId);
  const target = targetFromPointer(event);
  setTarget(target.x, target.y);
});

surface.addEventListener("pointermove", (event) => {
  if (!dragging || state.phase !== "aim") return;
  event.preventDefault();
  const target = targetFromPointer(event);
  setTarget(target.x, target.y);
});

surface.addEventListener("pointerup", () => { dragging = false; });
surface.addEventListener("pointercancel", () => { dragging = false; });

routeButtons.forEach((button) => button.addEventListener("click", () => chooseRoute(button.dataset.aimRoute)));
curveInput.addEventListener("input", () => setCurve(Number(curveInput.value) / 100));
planner.querySelectorAll("[data-curve-nudge]").forEach((button) => {
  button.addEventListener("click", () => setCurve((state.shot?.previewCurve || 0) + Number(button.dataset.curveNudge)));
});

takeShot.addEventListener("click", () => {
  if (state.phase !== "aim" || !state.shot) return;
  const target = intendedTarget();
  state.shot.previewAimX = target.x;
  state.shot.previewAimY = target.y;
  state.shot.previewCurve = clamp(state.shot.previewCurve || 0, -1, 1);
  window.dispatchEvent(new CustomEvent("footballlab:takeplannedshot"));
});

document.addEventListener("keydown", (event) => {
  if (state.phase !== "aim" || state.screen !== "game") return;
  const key = event.key.toLowerCase();
  const target = intendedTarget();
  const step = event.shiftKey ? 0.008 : 0.025;
  const directions = {
    arrowleft: [-step, 0], a: [-step, 0],
    arrowright: [step, 0], d: [step, 0],
    arrowup: [0, -step], w: [0, -step],
    arrowdown: [0, step], s: [0, step]
  };
  if (directions[key]) {
    event.preventDefault();
    event.stopImmediatePropagation();
    setTarget(target.x + directions[key][0], target.y + directions[key][1]);
    return;
  }
  if (key === "q" || key === "e") {
    event.preventDefault();
    event.stopImmediatePropagation();
    setCurve((state.shot?.previewCurve || 0) + (key === "q" ? -0.05 : 0.05));
    return;
  }
  if (["1", "2", "3"].includes(key)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    chooseRoute(({ "1": "over", "2": "left", "3": "right" })[key]);
  }
}, { capture: true });

function activatePlanner() {
  syncPlannerHost();
  planner.setAttribute("aria-hidden", "false");
  document.documentElement.dataset.aimPlannerV322 = "active";
  elements.phaseTitle.textContent = "AIM SHOT";
  elements.phaseHelp.textContent = "Tap the goal, check the coloured prediction, then shape the bend and shoot.";
  elements.shotAction.textContent = "TAKE FREE KICK";
  elements.canvasPrompt.textContent = "AIM SHOT · DRAG TARGET";
  document.querySelector('.shot-step[data-step="aim"]')?.classList.add("is-current");
  document.querySelector('.shot-step[data-step="curve"]')?.classList.add("is-current");
  if (!state.shot.aimPlannerInitialised) {
    state.shot.aimPlannerInitialised = true;
    chooseRoute("over");
  } else {
    renderPlanner();
  }
  requestAnimationFrame(() => surface.focus({ preventScroll: true }));
}

function deactivatePlanner() {
  planner.setAttribute("aria-hidden", "true");
  document.documentElement.dataset.aimPlannerV322 = "inactive";
  window.__footballLabAimFrameV322 = { active: false };
}

function syncPhase() {
  if (state.phase !== previousPhase) {
    if (state.phase === "aim" && state.screen === "game") activatePlanner();
    else deactivatePlanner();
    previousPhase = state.phase;
  }
  requestAnimationFrame(syncPhase);
}

document.documentElement.dataset.aimPlannerV322 = "inactive";
deactivatePlanner();
requestAnimationFrame(syncPhase);

const aimingContract = Object.freeze({
  build: BUILD,
  directGoalAim: true,
  targetMeansFinish: true,
  curveChangesRouteOnly: true,
  exactWallPreview: true,
  quickRoutes: ["over", "left", "right"],
  mobileFullScreenPlanner: true,
  bounds: { ...AIM_BOUNDS },
  setTarget(x, y) { setTarget(x, y, "api"); },
  setCurve(value) { setCurve(value, "api"); },
  chooseRoute
});
window.__footballLabAimingV322 = aimingContract;
window.__footballLabAimingV323 = aimingContract;
