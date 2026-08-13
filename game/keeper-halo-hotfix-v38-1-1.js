import { state, ctx } from "./core-v6.js?v=32.4";

const BUILD = "38.1.1";

function normaliseColour(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function suppressProjectedPenaltyArc() {
  if (window.__footballLabKeeperHaloCanvasPatchV3811) return;

  const originalBeginPath = ctx.beginPath.bind(ctx);
  const originalMoveTo = ctx.moveTo.bind(ctx);
  const originalLineTo = ctx.lineTo.bind(ctx);
  const originalStroke = ctx.stroke.bind(ctx);

  let moveCount = 0;
  let lineCount = 0;

  ctx.beginPath = function footballLabBeginPathV3811(...args) {
    moveCount = 0;
    lineCount = 0;
    return originalBeginPath(...args);
  };

  ctx.moveTo = function footballLabMoveToV3811(...args) {
    moveCount += 1;
    return originalMoveTo(...args);
  };

  ctx.lineTo = function footballLabLineToV3811(...args) {
    lineCount += 1;
    return originalLineTo(...args);
  };

  ctx.stroke = function footballLabStrokeV3811(...args) {
    const colour = normaliseColour(this.strokeStyle);
    const width = Number(this.lineWidth) || 0;

    // The free-kick pitch renderer draws the penalty arc as one long projected
    // 1.5px white polyline. From the low free-kick camera it sits directly
    // behind the goalkeeper and reads like a large oval/halo around his body.
    // Suppress only that multi-segment path. Normal pitch markings, goal/net
    // lines, the keeper rig and gameplay coordinates remain untouched.
    const projectedPenaltyArc = (
      state.screen === "game"
      && colour === "rgba(236,255,232,.66)"
      && Math.abs(width - 1.5) < 0.06
      && moveCount === 1
      && lineCount >= 10
    );

    if (projectedPenaltyArc) {
      window.__footballLabKeeperHaloSuppressedV3811 =
        (window.__footballLabKeeperHaloSuppressedV3811 || 0) + 1;
      moveCount = 0;
      lineCount = 0;
      return undefined;
    }

    const result = originalStroke(...args);
    moveCount = 0;
    lineCount = 0;
    return result;
  };

  window.__footballLabKeeperHaloCanvasPatchV3811 = true;
}

suppressProjectedPenaltyArc();

document.documentElement.dataset.footballLabBuild = BUILD;

const release = Object.freeze({
  build: BUILD,
  keeperBodyHalo: "removed",
  projectedPenaltyArcBehindKeeper: "suppressed",
  keeperGroundShadow: "retained-soft-ground-only",
  keeperRigChanged: false,
  aimingChanged: false,
  difficultyChanged: false,
  keeperAIChanged: false,
  physicsChanged: false,
  shotOutcomeChanged: false
});

window.__footballLabKeeperHaloHotfixV3811 = Object.freeze({
  build: BUILD,
  source: "projected-penalty-arc",
  bodyHaloRemoved: true,
  penaltyArcSuppressedInFreeKickView: true,
  groundShadowRetained: true,
  preservesKeeperRig: true,
  preservesKeeperAI: true,
  preservesAiming: true,
  preservesDifficulty: true,
  preservesPhysics: true,
  preservesShotOutcome: true
});

window.__footballLabReleaseV3811 = release;
