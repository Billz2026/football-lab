import { clamp, state, ctx, canvasView, currentAimTarget } from "./core-v6.js?v=32.4";
import { GOAL, buildCamera, keeperWorld } from "./world-v7.js?v=32.4";
import { projectWorld, projectedHeight } from "./projection-v6.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";

const BUILD = "36.2.0";
const viewport = { width: 1200, height: 720 };
const TAU = Math.PI * 2;

function normaliseColour(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function applyCanvasTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function suppressLegacyVisuals() {
  if (window.__footballLabKeeperCanvasPatchV362) return;
  const proto = Object.getPrototypeOf(ctx);
  if (!proto?.stroke || !proto?.arc) return;

  const originalStroke = proto.stroke;
  const originalArc = proto.arc;

  proto.stroke = function keeperRealismStrokePatch(...args) {
    if (this === ctx) {
      const colour = normaliseColour(this.strokeStyle);
      const width = Number(this.lineWidth) || 0;

      // Remove the old large circular aim target and its attached crosshair.
      if (
        state.phase === "aim"
        && colour.includes("218,254,77")
        && Math.abs(width - 1.7) < 0.16
      ) {
        return undefined;
      }

      // Remove the old expanding save-contact ring.
      if (
        ["SAVE", "GOAL"].includes(state.shot?.outcome)
        && colour.includes("218,254,77")
        && Math.abs(width - 2.2) < 0.16
      ) {
        return undefined;
      }

      // The legacy keeper used almost-white arms, which washed the keeper out.
      // Recolour only those arm strokes into the active goalkeeper jersey colour.
      if (colour === "#f5f7f1" || colour === "rgb(245,247,241)") {
        const previousColour = this.strokeStyle;
        const previousWidth = this.lineWidth;
        const keeper = keeperForStage(state.stage);
        this.strokeStyle = keeper.accent;
        this.lineWidth = previousWidth * 1.04;
        const result = originalStroke.apply(this, args);
        this.strokeStyle = previousColour;
        this.lineWidth = previousWidth;
        return result;
      }
    }
    return originalStroke.apply(this, args);
  };

  proto.arc = function keeperRealismArcPatch(x, y, radius, startAngle, endAngle, anticlockwise) {
    if (this === ctx) {
      const colour = normaliseColour(this.fillStyle);
      // Keep gloves readable, but remove the oversized mitten/spaceman effect.
      if (colour === "#f7ffd2" || colour === "rgb(247,255,210)") {
        radius *= 0.79;
      }
    }
    return originalArc.call(this, x, y, radius, startAngle, endAngle, anticlockwise);
  };

  window.__footballLabKeeperCanvasPatchV362 = true;
}

function shotFinalPoint(shot) {
  if (!Array.isArray(shot?.path) || !shot.path.length) return null;
  if (Number.isInteger(shot.impactIndex) && shot.path[shot.impactIndex]) return shot.path[shot.impactIndex];
  return shot.path[shot.path.length - 1];
}

function ensureVisibleKeeperAttempt() {
  const shot = state.shot;
  const plan = shot?.keeperPlan;
  if (!shot || !plan || plan.realismV362 || !["GOAL", "SAVE"].includes(shot.outcome)) return;

  const keeper = keeperForStage(state.stage);
  const wrongFooted = Boolean(plan.wrongFooted);
  const baseReactionCap = {
    reflex: 0.102,
    reader: 0.112,
    academy: 0.122,
    aggressive: 0.128,
    giant: 0.138
  }[keeper.id] || 0.124;
  const wrongFootPenalty = wrongFooted
    ? keeper.id === "reader" ? 0.028 : keeper.id === "reflex" ? 0.035 : 0.045
    : 0;

  const beforeReaction = Number(plan.reaction) || 0.2;
  const visualReaction = Math.min(beforeReaction, baseReactionCap + wrongFootPenalty);
  plan.reaction = clamp(visualReaction, 0.088, 0.19);

  const finalPoint = plan.target || shotFinalPoint(shot);
  const start = plan.start || keeperWorld(state.currentStage);
  let attemptedContact = plan.contact ? { ...plan.contact } : null;

  // A beaten goalkeeper must still make a football-like attempt.
  // On goals we aim the visual hands just short of the ball; the resolved outcome is untouched.
  if (shot.outcome === "GOAL" && finalPoint) {
    const rawDx = finalPoint.x - start.x;
    let direction = Math.sign(rawDx);
    if (!direction) direction = Math.sign((Number(shot.aimX) || 0.5) - 0.5) || 1;
    const minimumLateralAttempt = direction * 0.18;
    const visualDx = Math.abs(rawDx) < 0.18 ? minimumLateralAttempt : rawDx * 0.84;
    attemptedContact = {
      x: start.x + visualDx,
      y: clamp((Number(finalPoint.y) || 1.15) - 0.055, 0.28, GOAL.height - 0.04),
      z: 0.12
    };
    plan.contact = attemptedContact;
    plan.diveDirection = direction;
  }

  plan.realismV362 = {
    build: BUILD,
    keeperId: keeper.id,
    beforeReaction,
    visualReaction: plan.reaction,
    wrongFooted,
    outcomePreserved: shot.outcome,
    visibleAttemptForced: shot.outcome === "GOAL",
    attemptedContact
  };

  if (shot.diagnostics) {
    Object.assign(shot.diagnostics, {
      keeperRealismModel: "set-push-dive-attempt",
      keeperVisualReactionBeforeV362: Number(beforeReaction.toFixed(3)),
      keeperVisualReactionAfterV362: Number(plan.reaction.toFixed(3)),
      keeperVisibleAttemptV362: shot.outcome === "GOAL",
      keeperWrongFootProtectedV362: wrongFooted,
      keeperOutcomeRecalculatedV362: false
    });
  }
}

function drawCompactTarget() {
  if (state.screen !== "game" || state.phase !== "aim" || !state.currentStage) return;
  const target = currentAimTarget();
  const world = {
    x: -GOAL.halfWidth + target.x * GOAL.width,
    y: GOAL.height * (1 - target.y),
    z: 0.03
  };
  const camera = buildCamera(state.currentStage);
  const point = projectWorld(world, camera, viewport);
  if (!point.visible) return;

  applyCanvasTransform();
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.strokeStyle = "rgba(218,254,77,.94)";
  ctx.fillStyle = "rgba(218,254,77,.96)";
  ctx.lineWidth = 1.65;
  ctx.lineCap = "round";

  const inner = 5.5;
  const outer = 11.5;
  const corner = 4.5;

  // Four small bracket corners: readable without looking attached to the goalkeeper.
  const signs = [
    [-1, -1], [1, -1], [-1, 1], [1, 1]
  ];
  for (const [sx, sy] of signs) {
    ctx.beginPath();
    ctx.moveTo(sx * outer, sy * (inner + corner));
    ctx.lineTo(sx * outer, sy * inner);
    ctx.lineTo(sx * inner, sy * inner);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 1.9, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawKeeperGloveCuffs() {
  if (state.screen !== "game" || state.animation || !state.currentStage) return;
  const keeper = keeperForStage(state.stage);
  const world = keeperWorld(state.currentStage);
  const camera = buildCamera(state.currentStage);
  const projection = projectedHeight(world, keeper.visualHeight * 1.055, camera, viewport);
  if (!projection || projection.height < 8) return;

  const { foot, height: h } = projection;
  applyCanvasTransform();
  ctx.save();
  ctx.translate(foot.x, foot.y);

  const y = -h * 0.47;
  const offset = h * 0.305;
  const w = Math.max(3.4, h * 0.058);
  const hgt = Math.max(2.5, h * 0.046);
  ctx.fillStyle = "rgba(4,10,7,.95)";
  for (const x of [-offset, offset]) {
    ctx.fillRect(x - w * 0.58, y + hgt * 0.36, w * 1.16, hgt * 0.72);
    ctx.fillStyle = "rgba(247,248,238,.98)";
    ctx.fillRect(x - w * 0.46, y + hgt * 0.42, w * 0.92, hgt * 0.48);
    ctx.fillStyle = "rgba(4,10,7,.95)";
  }
  ctx.restore();
}

function overlayLoop() {
  if (state.screen === "game") {
    drawCompactTarget();
    drawKeeperGloveCuffs();
  }
  requestAnimationFrame(overlayLoop);
}

suppressLegacyVisuals();

window.addEventListener("footballlab:phasechange", (event) => {
  if (event.detail?.phase !== "shooting") return;
  // Keeper AI and V36.0 presentation listeners run first. Apply this final visual-only correction afterwards.
  queueMicrotask(() => queueMicrotask(ensureVisibleKeeperAttempt));
});

requestAnimationFrame(overlayLoop);

window.__footballLabKeeperRealismV362 = Object.freeze({
  build: BUILD,
  model: "set-push-dive-attempt",
  oversizedOverlayRemoved: true,
  legacyAimRingRemoved: true,
  compactBracketTarget: true,
  keeperScale: "base-rig-1.08",
  gloveScaleReduction: "21-percent",
  longSleeveRecolour: true,
  visibleAttemptOnGoal: true,
  wrongFootProtection: true,
  outcomeRecalculation: false
});
