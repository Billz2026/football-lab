import { clamp, state, ctx } from "./core-v6.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";

const BUILD = "36.3.0";

function normaliseColour(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function patchCanvasDirectly() {
  if (window.__footballLabKeeperDirectCanvasPatchV363) return;

  const originalStroke = ctx.stroke.bind(ctx);
  const originalArc = ctx.arc.bind(ctx);
  let suppressLegacyTargetStrokes = 0;
  let suppressLegacySavePulseStroke = 0;

  ctx.arc = function footballLabArcV363(x, y, radius, startAngle, endAngle, anticlockwise) {
    const stroke = normaliseColour(this.strokeStyle);
    const width = Number(this.lineWidth) || 0;

    // Base renderer's old aim target: 7–11px lime circle with two crosshair strokes.
    // Arm a two-stroke suppression budget so both the circle and its crosshair vanish.
    if (
      state.phase === "aim"
      && stroke === "rgba(218,254,77,0.85)"
      && Math.abs(width - 1.7) < 0.09
      && radius >= 6.5
      && radius <= 11.5
    ) {
      suppressLegacyTargetStrokes = 2;
      return undefined;
    }

    // Base renderer's expanding save-contact circle.
    if (
      state.shot?.outcome === "SAVE"
      && stroke.startsWith("rgba(218,254,77,")
      && Math.abs(width - 2.2) < 0.09
      && radius >= 5.5
      && radius <= 27
    ) {
      suppressLegacySavePulseStroke = 1;
      return undefined;
    }

    return originalArc(x, y, radius, startAngle, endAngle, anticlockwise);
  };

  ctx.stroke = function footballLabStrokeV363(...args) {
    if (suppressLegacyTargetStrokes > 0) {
      suppressLegacyTargetStrokes -= 1;
      return undefined;
    }
    if (suppressLegacySavePulseStroke > 0) {
      suppressLegacySavePulseStroke -= 1;
      return undefined;
    }

    const colour = normaliseColour(this.strokeStyle);

    // The base keeper used almost-white arms. Recolour only that exact legacy
    // arm stroke into the active goalkeeper jersey and make the sleeve read
    // slightly stronger. This keeps the original human proportions intact.
    if (colour === "#f5f7f1" || colour === "rgb(245,247,241)") {
      const keeper = keeperForStage(state.stage);
      const previousColour = this.strokeStyle;
      const previousWidth = this.lineWidth;
      this.strokeStyle = keeper.accent;
      this.lineWidth = previousWidth * 1.1;
      const result = originalStroke(...args);
      this.strokeStyle = previousColour;
      this.lineWidth = previousWidth;
      return result;
    }

    return originalStroke(...args);
  };

  window.__footballLabKeeperDirectCanvasPatchV363 = true;
}

function sharpenVisibleAttempt() {
  const shot = state.shot;
  const plan = shot?.keeperPlan;
  if (!shot || !plan || plan.readabilityV363 || !["GOAL", "SAVE"].includes(shot.outcome)) return;

  const keeper = keeperForStage(state.stage);
  const wrongFooted = Boolean(plan.wrongFooted);
  const beforeReaction = Number(plan.reaction) || 0.2;

  // This is still presentation-only. It makes the first visible movement read
  // sooner, while keeping a real wrong-foot penalty for deceptive late curl.
  const cap = {
    reflex: 0.094,
    reader: 0.104,
    academy: 0.114,
    aggressive: 0.12,
    giant: 0.132
  }[keeper.id] || 0.116;
  const wrongFootPenalty = wrongFooted
    ? keeper.id === "reader" ? 0.026 : keeper.id === "reflex" ? 0.032 : 0.042
    : 0;
  plan.reaction = clamp(Math.min(beforeReaction, cap + wrongFootPenalty), 0.086, 0.18);

  // Central goals previously produced a barely visible movement. Give the
  // animation a small but football-like committed attempt without changing
  // the already-resolved goal/save result.
  if (shot.outcome === "GOAL" && plan.start && plan.contact) {
    let dx = Number(plan.contact.x) - Number(plan.start.x);
    let direction = Math.sign(dx);
    if (!direction) direction = Math.sign((Number(shot.aimX) || 0.5) - 0.5) || 1;
    const minimumAttempt = wrongFooted ? 0.24 : 0.29;
    if (Math.abs(dx) < minimumAttempt) {
      plan.contact.x = Number(plan.start.x) + direction * minimumAttempt;
      dx = plan.contact.x - plan.start.x;
      plan.diveDirection = direction;
    }
  }

  plan.readabilityV363 = {
    build: BUILD,
    keeperId: keeper.id,
    beforeReaction,
    visualReaction: plan.reaction,
    wrongFooted,
    outcomePreserved: shot.outcome
  };

  if (shot.diagnostics) {
    Object.assign(shot.diagnostics, {
      keeperReadabilityV363: true,
      keeperVisualReactionBeforeV363: Number(beforeReaction.toFixed(3)),
      keeperVisualReactionAfterV363: Number(plan.reaction.toFixed(3)),
      keeperOutcomeRecalculatedV363: false
    });
  }
}

patchCanvasDirectly();

window.addEventListener("footballlab:phasechange", (event) => {
  if (event.detail?.phase !== "shooting") return;
  // Run after V36.0/V36.2 presentation adjustments have completed.
  queueMicrotask(() => queueMicrotask(() => queueMicrotask(sharpenVisibleAttempt)));
});

window.__footballLabKeeperReadabilityV363 = Object.freeze({
  build: BUILD,
  legacyAimCircleRemovedDirectly: true,
  legacyAimCrosshairRemovedDirectly: true,
  legacySavePulseRemovedDirectly: true,
  keeperLongSleeves: "jersey-colour",
  keeperProportions: "base-human-rig",
  centralGoalAttemptMinimum: 0.29,
  wrongFootProtection: true,
  outcomeRecalculation: false
});
