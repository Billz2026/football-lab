import { state, elements } from "./core-v6.js?v=32.4";
import { characterById } from "./characters-v13.js?v=32.4";
import { keeperById } from "./keepers-v14.js?v=32.4";

const BUILD = "35.6.1";
const BALL_NAMES = Object.freeze({
  standard: "STANDARD",
  curve: "CURVE",
  power: "POWER",
  control: "CONTROL",
  knuckle: "KNUCKLE"
});

function ensureStylesheet() {
  if (document.querySelector('link[data-training-ui-v356]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./game/training-ui-v35-6.css?v=38.2.1";
  link.dataset.trainingUiV356 = "true";
  document.head.appendChild(link);
}

function positionLabel(value) {
  const x = Number(value) || 0;
  if (x <= -5) return "WIDE LEFT";
  if (x < -1.25) return "LEFT";
  if (x >= 5) return "WIDE RIGHT";
  if (x > 1.25) return "RIGHT";
  return "CENTRAL";
}

function kickerShortName(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.at(-1) || "TAKER";
}

function sessionSummary() {
  const config = state.trainingConfig || {};
  const scenario = globalThis.__footballLabTrainingScenario || {};
  const distance = Number(scenario.distanceYards || config.distance || 25);
  const wallPlayers = Number(scenario.wallPlayers ?? config.wallPlayers ?? 0);
  const ball = BALL_NAMES[config.ballId || state.trainingBallId] || "STANDARD";
  const kicker = characterById(config.takerId || state.characterId);
  const keeper = keeperById(config.keeperId || scenario.keeperId || "academy");
  return `${Math.round(distance)}Y · ${positionLabel(config.ballX ?? scenario.ballX)} · ${wallPlayers ? `${wallPlayers}-WALL` : "NO WALL"} · ${ball} · ${kickerShortName(kicker.name)} · ${keeper.name}`;
}

function clearStaleExecution() {
  if (state.gameMode !== "training" || state.phase !== "ready") return;
  if (elements.powerReadout) elements.powerReadout.textContent = "—";
  if (elements.contactReadout) elements.contactReadout.textContent = "—";
  if (elements.meterNumber) elements.meterNumber.textContent = "—";
  if (elements.meterFill) elements.meterFill.style.width = "0%";
  if (elements.meterMarker) {
    elements.meterMarker.style.left = "0%";
    elements.meterMarker.style.opacity = "0";
  }
}

function rewriteTrainingSummary() {
  if (state.gameMode !== "training") return;
  const node = document.getElementById("trainingConfigV355");
  if (!node) return;
  const next = sessionSummary();
  if (node.textContent !== next) node.textContent = next;
}

function rewriteMobileTrainingHud() {
  if (state.gameMode !== "training") return;
  const hud = document.getElementById("mobileGameHudV161");
  if (!hud) return;
  const scoreSpans = [...hud.querySelectorAll(".mobile-score-v161 > span")];
  if (scoreSpans[0]?.firstChild && scoreSpans[0].firstChild.textContent !== "ATTEMPTS ") scoreSpans[0].firstChild.textContent = "ATTEMPTS ";
  if (scoreSpans[1]?.firstChild && scoreSpans[1].firstChild.textContent !== "GOALS ") scoreSpans[1].firstChild.textContent = "GOALS ";
}

function applyTrainingMicroPolish() {
  if (state.gameMode !== "training") return;
  document.body.classList.add("training-ui-active-v356");
  rewriteTrainingSummary();
  rewriteMobileTrainingHud();
  clearStaleExecution();
}

function removeTrainingMicroPolish() {
  document.body.classList.remove("training-ui-active-v356");
}

ensureStylesheet();

window.addEventListener("footballlab:trainingstart", () => queueMicrotask(applyTrainingMicroPolish));
window.addEventListener("footballlab:trainingreset", () => queueMicrotask(applyTrainingMicroPolish));
window.addEventListener("footballlab:keeperchange", () => queueMicrotask(rewriteTrainingSummary));
window.addEventListener("footballlab:characterchange", () => queueMicrotask(rewriteTrainingSummary));
window.addEventListener("footballlab:phasechange", (event) => {
  if (state.gameMode !== "training") {
    removeTrainingMicroPolish();
    return;
  }
  if (event.detail?.phase === "ready") {
    queueMicrotask(() => {
      clearStaleExecution();
      rewriteTrainingSummary();
      rewriteMobileTrainingHud();
    });
  }
});

// Do not observe trainingConfigV355 and then rewrite it from that observer.
// V35.6 originally did that, producing a self-triggering MutationObserver loop
// which could lock mobile browsers while the training setup modal was open.

if (state.gameMode === "training") queueMicrotask(applyTrainingMicroPolish);

document.documentElement.dataset.footballLabBuild = "35.6.1";
const version = document.querySelector(".settings-version-v22 strong");
if (version) version.textContent = BUILD;

window.__footballLabTrainingUiV356 = Object.freeze({
  build: BUILD,
  mobileHud: "attempts-goals",
  duplicatePitchSetup: false,
  setupSummary: "distance-position-wall-ball-taker-keeper",
  staleExecutionReadouts: "cleared-on-ready",
  executionCards: "compact",
  setupFreezeHotfix: "self-observing-summary-loop-removed",
  foldFullscreenV3821: "coarse-pointer-full-width-pitch-bottom-touch-tray",
  physicsChanged: false
});
