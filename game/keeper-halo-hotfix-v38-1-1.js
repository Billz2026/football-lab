import { state, ctx } from "./core-v6.js?v=32.4";

const BUILD = "38.1.1";
const PATCH_TAG = "__footballLabV3811";
let moveCount = 0;
let lineCount = 0;

function normaliseColour(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function tagged(fn) {
  return Boolean(fn && fn[PATCH_TAG]);
}

function mark(fn) {
  try { Object.defineProperty(fn, PATCH_TAG, { value: true }); }
  catch { fn[PATCH_TAG] = true; }
  return fn;
}

function installBeginPathGuard() {
  if (tagged(ctx.beginPath)) return;
  const previous = ctx.beginPath.bind(ctx);
  ctx.beginPath = mark(function footballLabBeginPathV3811(...args) {
    moveCount = 0;
    lineCount = 0;
    return previous(...args);
  });
}

function installMoveToGuard() {
  if (tagged(ctx.moveTo)) return;
  const previous = ctx.moveTo.bind(ctx);
  ctx.moveTo = mark(function footballLabMoveToV3811(...args) {
    moveCount += 1;
    return previous(...args);
  });
}

function installLineToGuard() {
  if (tagged(ctx.lineTo)) return;
  const previous = ctx.lineTo.bind(ctx);
  ctx.lineTo = mark(function footballLabLineToV3811(...args) {
    lineCount += 1;
    return previous(...args);
  });
}

function installStrokeGuard() {
  if (tagged(ctx.stroke)) return;
  const previous = ctx.stroke.bind(ctx);
  ctx.stroke = mark(function footballLabStrokeV3811(...args) {
    const colour = normaliseColour(this.strokeStyle);
    const width = Number(this.lineWidth) || 0;

    // The free-kick pitch renderer draws the penalty arc as one long projected
    // 1.5px white polyline. From the low free-kick camera it lands directly
    // behind the goalkeeper and reads as a large oval/halo around his body.
    // Suppress only that long path. Short pitch lines, goal/net lines, the
    // goalkeeper rig, aiming, physics and shot resolution are untouched.
    const projectedPenaltyArc = (
      state.screen === "game"
      && colour === "rgba(236,255,232,.66)"
      && Math.abs(width - 1.5) < 0.06
      && moveCount >= 1
      && lineCount >= 10
    );

    if (projectedPenaltyArc) {
      window.__footballLabKeeperHaloSuppressedV3811 =
        (window.__footballLabKeeperHaloSuppressedV3811 || 0) + 1;
      moveCount = 0;
      lineCount = 0;
      return undefined;
    }

    const result = previous(...args);
    moveCount = 0;
    lineCount = 0;
    return result;
  });
}

function ensureCanvasGuard() {
  installBeginPathGuard();
  installMoveToGuard();
  installLineToGuard();
  installStrokeGuard();
  window.__footballLabKeeperHaloCanvasPatchV3811 = true;
}

const release = Object.freeze({
  build: BUILD,
  keeperBodyHalo: "removed",
  keeperProjectedPenaltyArc: "suppressed-in-free-kick-view",
  keeperGroundShadow: "soft-ground-only",
  keeperRigChanged: false,
  aimingChanged: false,
  difficultyChanged: false,
  keeperAIChanged: false,
  physicsChanged: false,
  shotOutcomeChanged: false
});

function publishBuildMarker() {
  document.documentElement.dataset.footballLabBuild = BUILD;
  const badge = document.querySelector(".build-badge-v22");
  if (badge) {
    badge.textContent = "V38.1.1";
    badge.title = "Football Lab build 38.1.1";
  }
  const version = document.querySelector(".settings-version-v22 strong");
  if (version) version.textContent = BUILD;
  window.__footballLabReleaseV3811 = release;
}

function reinforcePresentationGuard() {
  ensureCanvasGuard();
  publishBuildMarker();
}

ensureCanvasGuard();
publishBuildMarker();

// Older presentation modules can replace canvas methods later in the dynamic
// boot chain. Re-assert this final visual-only guard for the first few seconds,
// then re-check whenever gameplay phases change. This does not run physics.
let guardFrames = 0;
function guardBootChain() {
  reinforcePresentationGuard();
  guardFrames += 1;
  if (guardFrames < 240) requestAnimationFrame(guardBootChain);
}
requestAnimationFrame(guardBootChain);

for (const eventName of ["footballlab:phasechange", "footballlab:trainingstart", "footballlab:keeperchange"]) {
  window.addEventListener(eventName, reinforcePresentationGuard, true);
}
window.addEventListener("load", () => {
  reinforcePresentationGuard();
  setTimeout(reinforcePresentationGuard, 50);
  setTimeout(reinforcePresentationGuard, 250);
  setTimeout(reinforcePresentationGuard, 1000);
}, { once: true });

window.__footballLabKeeperHaloHotfixV3811 = Object.freeze({
  build: BUILD,
  source: "projected-penalty-arc",
  bodyHaloRemoved: true,
  penaltyArcSuppressedInFreeKickView: true,
  groundShadowRetained: true,
  finalCanvasGuard: true,
  preservesKeeperRig: true,
  preservesKeeperAI: true,
  preservesAiming: true,
  preservesDifficulty: true,
  preservesPhysics: true,
  preservesShotOutcome: true
});
