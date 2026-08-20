import { state, ctx } from "./core-v6.js?v=32.4";
import { buildCamera, keeperWorld } from "./world-v7.js?v=32.4";
import { projectWorld } from "./projection-v6.js?v=32.4";

const BUILD = "38.1.3";
const PATCH_TAG = "__footballLabV3813";
const VIEWPORT = Object.freeze({ width: 1200, height: 720 });

let saveDepth = 0;
let suppressLegacyRig = false;
let suppressDepth = -1;
let legacyRigSeenThisFrame = false;
let moveCount = 0;
let lineCount = 0;
let suppressionCount = 0;
let haloObserver = null;

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

function removeAimRiskHalo() {
  document.querySelectorAll("#aimRiskHaloV371, .aim-risk-halo-v371").forEach((node) => node.remove());

  let style = document.getElementById("footballLabNoAimRiskHaloV3813");
  if (!style) {
    style = document.createElement("style");
    style.id = "footballLabNoAimRiskHaloV3813";
    style.textContent = "#aimRiskHaloV371,.aim-risk-halo-v371{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;}";
    document.head.appendChild(style);
  }

  if (!haloObserver && document.documentElement) {
    haloObserver = new MutationObserver(() => {
      document.querySelectorAll("#aimRiskHaloV371, .aim-risk-halo-v371").forEach((node) => node.remove());
    });
    haloObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.__footballLabAimRiskHaloRemovedV3813 = true;
}

function resetFrameState() {
  saveDepth = 0;
  suppressLegacyRig = false;
  suppressDepth = -1;
  legacyRigSeenThisFrame = false;
  moveCount = 0;
  lineCount = 0;
}

function armLegacySuppression(source) {
  if (legacyRigSeenThisFrame || state.screen !== "game") return;
  legacyRigSeenThisFrame = true;
  suppressLegacyRig = true;
  suppressDepth = Math.max(0, saveDepth);
  suppressionCount += 1;
  window.__footballLabKeeperGhostSuppressedFramesV3812 = suppressionCount;
  window.__footballLabKeeperGhostLastTriggerV3812 = source;
}

function projectedKeeperFoot() {
  if (!state.currentStage) return null;
  try {
    const point = projectWorld(
      keeperWorld(state.currentStage),
      buildCamera(state.currentStage),
      VIEWPORT
    );
    return point?.visible ? point : null;
  } catch {
    return null;
  }
}

function nearKeeperFoot(x, y) {
  const foot = projectedKeeperFoot();
  if (!foot) return false;
  return Math.abs(Number(x) - foot.x) <= 82 && Math.abs(Number(y) - foot.y) <= 42;
}

function installClearRectGuard() {
  if (tagged(ctx.clearRect)) return;
  const previous = ctx.clearRect.bind(ctx);
  ctx.clearRect = mark(function footballLabClearRectV3813(...args) {
    const result = previous(...args);
    resetFrameState();
    return result;
  });
}

function installSaveGuard() {
  if (tagged(ctx.save)) return;
  const previous = ctx.save.bind(ctx);
  ctx.save = mark(function footballLabSaveV3813(...args) {
    saveDepth += 1;
    return previous(...args);
  });
}

function installRestoreGuard() {
  if (tagged(ctx.restore)) return;
  const previous = ctx.restore.bind(ctx);
  ctx.restore = mark(function footballLabRestoreV3813(...args) {
    const result = previous(...args);
    saveDepth = Math.max(0, saveDepth - 1);
    if (suppressLegacyRig && saveDepth < suppressDepth) {
      suppressLegacyRig = false;
      suppressDepth = -1;
    }
    return result;
  });
}

function installTranslateGuard() {
  if (tagged(ctx.translate)) return;
  const previous = ctx.translate.bind(ctx);
  ctx.translate = mark(function footballLabTranslateV3813(x, y, ...rest) {
    if (!legacyRigSeenThisFrame && nearKeeperFoot(x, y)) {
      armLegacySuppression("goalmouth-transform");
    }
    return previous(x, y, ...rest);
  });
}

function installEllipseGuard() {
  if (tagged(ctx.ellipse)) return;
  const previous = ctx.ellipse.bind(ctx);
  ctx.ellipse = mark(function footballLabEllipseV3813(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
    const colour = normaliseColour(this.fillStyle);
    const legacyArticulatedShadow = colour === "rgba(0,0,0,0.22)" || colour === "rgba(0,0,0,.22)";
    if (!legacyRigSeenThisFrame && state.screen === "game" && legacyArticulatedShadow) {
      armLegacySuppression("legacy-shadow-signature");
    }
    return previous(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
  });
}

function installBeginPathGuard() {
  if (tagged(ctx.beginPath)) return;
  const previous = ctx.beginPath.bind(ctx);
  ctx.beginPath = mark(function footballLabBeginPathV3813(...args) {
    moveCount = 0;
    lineCount = 0;
    return previous(...args);
  });
}

function installMoveToGuard() {
  if (tagged(ctx.moveTo)) return;
  const previous = ctx.moveTo.bind(ctx);
  ctx.moveTo = mark(function footballLabMoveToV3813(...args) {
    moveCount += 1;
    return previous(...args);
  });
}

function installLineToGuard() {
  if (tagged(ctx.lineTo)) return;
  const previous = ctx.lineTo.bind(ctx);
  ctx.lineTo = mark(function footballLabLineToV3813(...args) {
    lineCount += 1;
    return previous(...args);
  });
}

function installFillGuard() {
  if (tagged(ctx.fill)) return;
  const previous = ctx.fill.bind(ctx);
  ctx.fill = mark(function footballLabFillV3813(...args) {
    if (suppressLegacyRig) return undefined;
    return previous(...args);
  });
}

function installStrokeGuard() {
  if (tagged(ctx.stroke)) return;
  const previous = ctx.stroke.bind(ctx);
  ctx.stroke = mark(function footballLabStrokeV3813(...args) {
    if (suppressLegacyRig) {
      moveCount = 0;
      lineCount = 0;
      return undefined;
    }

    const colour = normaliseColour(this.strokeStyle);
    const width = Number(this.lineWidth) || 0;
    const pitchWhite = colour === "rgba(236,255,232,0.66)" || colour === "rgba(236,255,232,.66)";
    const projectedPenaltyArc = (
      state.screen === "game"
      && pitchWhite
      && Math.abs(width - 1.5) < 0.06
      && moveCount >= 1
      && lineCount >= 10
    );

    if (projectedPenaltyArc) {
      window.__footballLabKeeperPenaltyArcSuppressionsV3812 =
        (window.__footballLabKeeperPenaltyArcSuppressionsV3812 || 0) + 1;
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

function installFillTextGuard() {
  if (tagged(ctx.fillText)) return;
  const previous = ctx.fillText.bind(ctx);
  ctx.fillText = mark(function footballLabFillTextV3813(...args) {
    if (suppressLegacyRig) return undefined;
    return previous(...args);
  });
}

function installStrokeTextGuard() {
  if (tagged(ctx.strokeText)) return;
  const previous = ctx.strokeText.bind(ctx);
  ctx.strokeText = mark(function footballLabStrokeTextV3813(...args) {
    if (suppressLegacyRig) return undefined;
    return previous(...args);
  });
}

function installRectGuards() {
  if (!tagged(ctx.fillRect)) {
    const previousFillRect = ctx.fillRect.bind(ctx);
    ctx.fillRect = mark(function footballLabFillRectV3813(...args) {
      if (suppressLegacyRig) return undefined;
      return previousFillRect(...args);
    });
  }
  if (!tagged(ctx.strokeRect)) {
    const previousStrokeRect = ctx.strokeRect.bind(ctx);
    ctx.strokeRect = mark(function footballLabStrokeRectV3813(...args) {
      if (suppressLegacyRig) return undefined;
      return previousStrokeRect(...args);
    });
  }
}

function ensureCanvasGuards() {
  installClearRectGuard();
  installSaveGuard();
  installRestoreGuard();
  installTranslateGuard();
  installEllipseGuard();
  installBeginPathGuard();
  installMoveToGuard();
  installLineToGuard();
  installFillGuard();
  installStrokeGuard();
  installFillTextGuard();
  installStrokeTextGuard();
  installRectGuards();
  window.__footballLabKeeperGhostCanvasPatchV3812 = true;
}

const release = Object.freeze({
  build: BUILD,
  keeperGhostRig: "suppressed-at-goalmouth-transform",
  keeperBodyHalo: "removed-at-legacy-rig-source-scope",
  aimRiskHalo: "removed-completely",
  keeperProjectedPenaltyArc: "suppressed-in-free-kick-view",
  keeperGroundShadow: "premium-soft-ground-only",
  keeperRigChanged: false,
  aimingChanged: false,
  difficultyChanged: false,
  keeperAIChanged: false,
  physicsChanged: false,
  shotOutcomeChanged: false
});

function publishBuildMarker() {
  document.documentElement.dataset.footballLabKeeperHaloBuild = BUILD;
  const badge = document.querySelector(".build-badge-v22");
  if (badge) {
    badge.textContent = "V38.1.3";
    badge.title = "Football Lab build 38.1.3";
  }
  const version = document.querySelector(".settings-version-v22 strong");
  if (version) version.textContent = BUILD;
  window.__footballLabReleaseV3811 = release;
  window.__footballLabReleaseV3812 = release;
  window.__footballLabReleaseV3813 = release;
}

function reinforcePresentationGuard() {
  removeAimRiskHalo();
  ensureCanvasGuards();
  publishBuildMarker();
}

removeAimRiskHalo();
ensureCanvasGuards();
publishBuildMarker();

let guardFrames = 0;
function guardBootChain() {
  reinforcePresentationGuard();
  guardFrames += 1;
  if (guardFrames < 360) requestAnimationFrame(guardBootChain);
}
requestAnimationFrame(guardBootChain);

for (const eventName of ["footballlab:phasechange", "footballlab:trainingstart", "footballlab:keeperchange", "footballlab:shotmodechange"]) {
  window.addEventListener(eventName, reinforcePresentationGuard, true);
}
window.addEventListener("load", () => {
  reinforcePresentationGuard();
  setTimeout(reinforcePresentationGuard, 50);
  setTimeout(reinforcePresentationGuard, 250);
  setTimeout(reinforcePresentationGuard, 1000);
}, { once: true });

const contract = Object.freeze({
  build: BUILD,
  source: "v37-1-aim-risk-halo-plus-legacy-goalkeeper-rig",
  aimRiskHaloRemoved: true,
  bodyHaloRemoved: true,
  legacyGoalkeeperRigSuppressed: true,
  suppressionTrigger: "goalmouth-transform-with-shadow-fallback",
  penaltyArcSuppressedInFreeKickView: true,
  premiumGroundShadowRetained: true,
  finalCanvasGuard: true,
  preservesPremiumKeeperRig: true,
  preservesKeeperAI: true,
  preservesAiming: true,
  preservesDifficulty: true,
  preservesPhysics: true,
  preservesShotOutcome: true
});

window.__footballLabKeeperHaloHotfixV3811 = contract;
window.__footballLabKeeperGhostCleanupV3812 = contract;
window.__footballLabKeeperCleanVisualV3813 = contract;
