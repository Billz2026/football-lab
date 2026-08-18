import { state, elements } from "./core-v6.js?v=32.4";

function interceptCompetitiveExit(event) {
  if (state.gameMode !== "training") return;
  event.preventDefault?.();
  event.stopImmediatePropagation?.();
  elements.exitGame?.click();
}

window.addEventListener("footballlab:submitrun", interceptCompetitiveExit, true);
window.addEventListener("footballlab:openfinish", interceptCompetitiveExit, true);

window.__footballLabTrainingGuardV35 = Object.freeze({
  blocksCompetitiveSubmission: true,
  blocksCareerRewards: true
});

await import("./penalty-duel-v51.js?v=51.0.0");
await import("./penalty-duel-transition-guard-v51.js?v=51.0.1");