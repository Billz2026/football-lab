import { clamp, state } from "./core-v6.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";

const BUILD = "36.1.0";

function tuneVisualReaction() {
  const shot = state.shot;
  const plan = shot?.keeperPlan;
  if (!plan || plan.visualReflexV361) return;

  const keeper = keeperForStage(state.stage);
  const wrongFooted = Boolean(plan.wrongFooted);
  const extraSharpness = wrongFooted ? 0 : ({
    reflex: 0.010,
    reader: 0.004,
    academy: 0.004,
    aggressive: 0.003,
    giant: 0
  }[keeper.id] || 0);

  const before = Number(plan.reaction) || 0.2;
  plan.reaction = clamp(before - extraSharpness, 0.082, 0.46);
  plan.visualReflexV361 = {
    build: BUILD,
    keeperId: keeper.id,
    before,
    after: plan.reaction,
    extraSharpness,
    wrongFootedProtected: wrongFooted
  };

  if (shot.diagnostics) {
    Object.assign(shot.diagnostics, {
      keeperVisualReflexModel: "grounded-first-step",
      keeperVisualReactionBefore: Number(before.toFixed(3)),
      keeperVisualReactionAfter: Number(plan.reaction.toFixed(3)),
      keeperWrongFootReflexBoostBlocked: wrongFooted,
      keeperOutcomeRecalculatedV361: false
    });
  }
}

window.addEventListener("footballlab:phasechange", (event) => {
  if (event.detail?.phase !== "shooting") return;
  queueMicrotask(tuneVisualReaction);
});

window.__footballLabKeeperReflexV361 = Object.freeze({
  build: BUILD,
  model: "grounded-first-step",
  reflexExtraSeconds: 0.010,
  readerExtraSeconds: 0.004,
  academyExtraSeconds: 0.004,
  wrongFootedBoost: false,
  outcomeRecalculation: false
});
