import { clamp, state } from "./core-v6.js?v=32.4";
import { GOAL } from "./world-v7.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";

const BUILD = "36.0.0";
let calloutTimer = 0;

function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function ensureStylesheet() {
  if (document.querySelector("link[data-keeper-polish-v36]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./game/keeper-polish-v36.css?v=36.0";
  link.dataset.keeperPolishV36 = "true";
  document.head.appendChild(link);
}

function ensureCallout() {
  const frame = document.querySelector(".game-frame");
  if (!frame) return null;
  let node = document.getElementById("keeperCalloutV36");
  if (!node) {
    node = document.createElement("div");
    node.id = "keeperCalloutV36";
    node.className = "keeper-callout-v36";
    node.setAttribute("aria-live", "polite");
    frame.appendChild(node);
  }
  return node;
}

function applyIdleReadability() {
  const stage = state.currentStage;
  if (!stage || state.screen !== "game") return;
  if (!Number.isFinite(stage.__keeperPresentationOriginalX)) {
    stage.__keeperPresentationOriginalX = Number(stage.keeperX) || 0;
  }

  const originalX = stage.__keeperPresentationOriginalX;
  const protectedX = Number(stage.protectedGoalX) || 0;
  let direction = Math.sign(originalX - protectedX);
  if (!direction) direction = Number(stage.ballX) <= 0 ? 1 : -1;

  const existingSeparation = Math.abs(originalX - protectedX);
  const readabilityNudge = existingSeparation < 0.9 ? 0.28 : existingSeparation < 1.45 ? 0.18 : 0.10;
  stage.keeperX = clamp(
    originalX + direction * readabilityNudge,
    -GOAL.halfWidth + 0.58,
    GOAL.halfWidth - 0.58
  );
}

function savePresentationType(shot, plan, keeper) {
  if (shot?.outcome !== "SAVE" || !plan?.contact) return null;
  const horizontalReach = Math.abs(plan.contact.x - plan.start.x);
  const high = plan.contact.y > GOAL.height * 0.72;
  const low = plan.contact.y < GOAL.height * 0.30;

  if (shot.saveType === "CATCH") {
    return low ? "LOW SMOTHER" : "SECURE HOLD";
  }
  if (plan.wrongFooted) return "RECOVERY SAVE";
  if (high && horizontalReach > 1.05) return "FINGERTIP SAVE";
  if (horizontalReach > 1.45) return "FULL-STRETCH SAVE";
  if (low) return "LOW PARRY";
  if (keeper.id === "giant") return "TWO-HAND PARRY";
  if (keeper.id === "reflex") return "QUICK-HANDS SAVE";
  return "STRONG PARRY";
}

function presentationProfile(keeper, plan) {
  const wrongFooted = Boolean(plan.wrongFooted);
  const misread = Math.max(0, Number(plan.effectiveMisreadMetres ?? plan.readErrorMetres) || 0);
  const finalDirection = Math.sign((plan.contact?.x ?? 0) - (plan.start?.x ?? 0) || plan.diveDirection || 1);
  const archetypeWrongFoot = {
    reflex: 0.86,
    giant: 1.0,
    reader: 0.68,
    aggressive: 1.22,
    academy: 0.92
  }[keeper.id] || 1;
  const wrongOffset = wrongFooted
    ? -finalDirection * clamp((0.12 + misread * 0.11) * archetypeWrongFoot, 0.10, 0.31)
    : 0;
  const readOffset = wrongFooted
    ? 0
    : finalDirection * clamp(0.025 + (keeper.stats?.reading || 70) / 100 * 0.045, 0.04, 0.07);
  const forwardStep = keeper.id === "aggressive" ? 0.11 : keeper.id === "reader" ? 0.035 : keeper.id === "reflex" ? 0.02 : 0;
  const reactionAdjustment = wrongFooted
    ? 0.024 + misread * 0.018 + (keeper.id === "aggressive" ? 0.018 : 0) - (keeper.id === "reader" ? 0.012 : 0)
    : keeper.id === "reflex" ? -0.012 : keeper.id === "reader" ? -0.006 : keeper.id === "giant" ? 0.008 : 0;

  return {
    wrongFooted,
    misread,
    finalDirection,
    wrongOffset,
    readOffset,
    forwardStep,
    reactionAdjustment
  };
}

function initialiseKeeperPresentation() {
  const shot = state.shot;
  const plan = shot?.keeperPlan;
  if (!shot || !plan || plan.presentationV36) return;

  applyIdleReadability();
  const keeper = keeperForStage(state.stage);
  const profile = presentationProfile(keeper, plan);
  const physicsStart = { ...(plan.start || { x: 0, y: 0, z: 0.38 }) };
  const presentationX = Number.isFinite(state.currentStage?.keeperX)
    ? state.currentStage.keeperX
    : physicsStart.x;
  const baseStart = {
    ...physicsStart,
    x: clamp(presentationX, -GOAL.halfWidth + 0.52, GOAL.halfWidth - 0.52)
  };
  const physicsReaction = Number(plan.reaction) || 0.2;

  plan.physicsStartV36 = physicsStart;
  plan.physicsReactionV36 = physicsReaction;
  plan.start = { ...baseStart };
  plan.reaction = clamp(physicsReaction + profile.reactionAdjustment, 0.085, 0.46);
  plan.presentationSaveType = savePresentationType(shot, plan, keeper);
  plan.presentationV36 = {
    build: BUILD,
    keeperId: keeper.id,
    keeperName: keeper.name,
    baseStart,
    profile
  };

  if (shot.diagnostics) {
    Object.assign(shot.diagnostics, {
      keeperPresentationModel: "read-set-correct-dive",
      keeperPresentationType: plan.presentationSaveType,
      keeperPresentationWrongFooted: profile.wrongFooted,
      keeperPresentationWrongStepMetres: Number(Math.abs(profile.wrongOffset).toFixed(3)),
      keeperPresentationReadStepMetres: Number(Math.abs(profile.readOffset).toFixed(3)),
      keeperPresentationReactionSeconds: Number(plan.reaction.toFixed(3)),
      keeperPresentationPhysicsChanged: false
    });
  }

  window.__footballLabKeeperPresentationV36 = {
    build: BUILD,
    keeper: keeper.id,
    wrongFooted: profile.wrongFooted,
    savePresentation: plan.presentationSaveType,
    physicsChanged: false
  };
}

function flightProgress(now) {
  const animation = state.animation;
  if (!animation) return 0;
  const run = Math.max(0, Number(animation.runUpDuration) || 0);
  const contact = Math.max(0, Number(animation.contactHoldDuration) || 0);
  const duration = Math.max(1, Number(animation.flightDuration) || 1);
  return clamp((now - animation.startedAt - run - contact) / duration, 0, 1);
}

function animateKeeperRead(now) {
  const plan = state.shot?.keeperPlan;
  const presentation = plan?.presentationV36;
  if (state.phase === "shooting" && state.animation && presentation) {
    const f = flightProgress(now);
    const { baseStart, profile } = presentation;
    let x = baseStart.x;
    let z = baseStart.z;

    if (profile.wrongFooted) {
      const commit = smooth01(clamp(f / 0.20, 0, 1));
      const correct = smooth01(clamp((f - 0.20) / 0.30, 0, 1));
      const wrongX = baseStart.x + profile.wrongOffset * commit;
      const recoveredX = baseStart.x + profile.finalDirection * 0.045;
      x = correct > 0 ? wrongX + (recoveredX - wrongX) * correct : wrongX;
    } else {
      const read = smooth01(clamp(f / 0.28, 0, 1));
      x = baseStart.x + profile.readOffset * read;
    }

    if (profile.forwardStep > 0) {
      z = baseStart.z - profile.forwardStep * smooth01(clamp(f / 0.24, 0, 1));
    }

    plan.start.x = clamp(x, -GOAL.halfWidth + 0.46, GOAL.halfWidth - 0.46);
    plan.start.z = z;
  }
  requestAnimationFrame(animateKeeperRead);
}

function showKeeperCallout() {
  const shot = state.shot;
  const plan = shot?.keeperPlan;
  if (shot?.outcome !== "SAVE" || !plan?.presentationSaveType) return;
  const keeper = keeperForStage(state.stage);
  const node = ensureCallout();
  if (!node) return;
  window.clearTimeout(calloutTimer);
  node.innerHTML = `<span>${plan.presentationSaveType}</span><strong>${keeper.name}</strong>`;
  node.classList.add("is-visible");
  calloutTimer = window.setTimeout(() => node.classList.remove("is-visible"), 1200);
}

function clearKeeperCallout() {
  const node = ensureCallout();
  node?.classList.remove("is-visible");
}

ensureStylesheet();
ensureCallout();
requestAnimationFrame(animateKeeperRead);

window.addEventListener("footballlab:trainingstart", () => queueMicrotask(applyIdleReadability));
window.addEventListener("footballlab:keeperchange", () => queueMicrotask(applyIdleReadability));
window.addEventListener("footballlab:phasechange", (event) => {
  const phase = event.detail?.phase;
  if (phase === "ready") {
    clearKeeperCallout();
    queueMicrotask(applyIdleReadability);
    return;
  }
  if (phase === "shooting") {
    queueMicrotask(initialiseKeeperPresentation);
    return;
  }
  if (phase === "result") {
    queueMicrotask(showKeeperCallout);
  }
});

window.__footballLabKeeperPolishV36 = Object.freeze({
  build: BUILD,
  model: "read-set-correct-dive",
  wrongFootedSetStep: true,
  archetypeMotion: true,
  keeperWallReadability: true,
  savePresentationTypes: [
    "LOW SMOTHER",
    "SECURE HOLD",
    "RECOVERY SAVE",
    "FINGERTIP SAVE",
    "FULL-STRETCH SAVE",
    "LOW PARRY",
    "TWO-HAND PARRY",
    "QUICK-HANDS SAVE",
    "STRONG PARRY"
  ],
  preservesShotOutcome: true,
  preservesCoreBalance: true
});
