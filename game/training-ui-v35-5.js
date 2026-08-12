import { state, elements, createShot, setPhase, renderHud } from "./core-v6.js?v=32.4";
import { keeperById } from "./keepers-v14.js?v=32.4";

const BUILD = "35.5.0";
const BALL_NAMES = Object.freeze({
  standard: "STANDARD",
  curve: "CURVE",
  power: "POWER",
  control: "CONTROL",
  knuckle: "KNUCKLE"
});

let lastResult = "—";

function ensureStylesheet() {
  if (document.querySelector('link[data-training-ui-v355]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./game/training-ui-v35-5.css?v=35.5";
  link.dataset.trainingUiV355 = "true";
  document.head.appendChild(link);
}

function ensureTrainingUi() {
  const panel = document.querySelector(".control-panel");
  if (!panel) return null;

  let session = document.getElementById("trainingSessionBarV355");
  if (!session) {
    session = document.createElement("section");
    session.id = "trainingSessionBarV355";
    session.className = "training-session-bar-v355";
    session.setAttribute("aria-label", "Training session setup");
    session.innerHTML = `
      <div>
        <span class="training-session-mode-v355">FREE TRAINING</span>
        <strong class="training-session-config-v355" id="trainingConfigV355">—</strong>
      </div>
      <span class="training-last-v355">LAST <strong id="trainingLastTopV355">—</strong></span>`;
    panel.prepend(session);
  }

  let tools = document.getElementById("trainingToolsV355");
  if (!tools) {
    tools = document.createElement("section");
    tools.id = "trainingToolsV355";
    tools.className = "training-tools-v355";
    tools.setAttribute("aria-label", "Training session controls and statistics");
    tools.innerHTML = `
      <div class="training-stats-v355">
        <div class="training-stat-v355" data-stat="attempts"><span>ATTEMPTS</span><strong id="trainingAttemptsV355">0</strong></div>
        <div class="training-stat-v355" data-stat="goals"><span>GOALS</span><strong id="trainingGoalsV355">0</strong></div>
        <div class="training-stat-v355" data-stat="accuracy"><span>ACCURACY</span><strong id="trainingAccuracyV355">0%</strong></div>
        <div class="training-stat-v355" data-stat="last"><span>LAST RESULT</span><strong id="trainingLastV355">—</strong></div>
      </div>
      <div class="training-actions-v355">
        <button class="training-action-v355" id="trainingResetV355" data-action="reset" type="button">RESET BALL</button>
        <button class="training-action-v355" id="trainingEditV355" data-action="edit" type="button">EDIT SETUP</button>
        <button class="training-action-v355" id="trainingExitV355" data-action="exit" type="button">EXIT</button>
      </div>`;
    panel.appendChild(tools);

    tools.querySelector("#trainingResetV355")?.addEventListener("click", resetBall);
    tools.querySelector("#trainingEditV355")?.addEventListener("click", () => {
      if (state.gameMode !== "training" || state.animation || state.presentation) return;
      document.getElementById("trainingEditV35")?.click();
    });
    tools.querySelector("#trainingExitV355")?.addEventListener("click", () => {
      if (state.gameMode !== "training" || state.animation || state.presentation) return;
      document.getElementById("exitGame")?.click();
    });
  }

  return { session, tools };
}

function positionLabel(value) {
  const x = Number(value) || 0;
  if (x <= -5) return "WIDE LEFT";
  if (x < -1.25) return "LEFT";
  if (x >= 5) return "WIDE RIGHT";
  if (x > 1.25) return "RIGHT";
  return "CENTRAL";
}

function compactResult() {
  const shot = state.shot;
  if (!shot?.outcome) return "—";
  if (shot.outcome === "GOAL") return shot.topCorner ? "TOP CORNER" : "GOAL";
  if (shot.outcome === "SAVE") return shot.saveType === "CATCH" ? "HELD" : "SAVED";
  if (shot.outcome === "WALL") return "WALL";
  if (shot.outcome === "POST") return "POST";
  if (shot.outcome === "BAR") return "CROSSBAR";
  return "MISS";
}

function sessionSummary() {
  const config = state.trainingConfig || {};
  const scenario = globalThis.__footballLabTrainingScenario || {};
  const distance = Number(scenario.distanceYards || config.distance || 25);
  const wallPlayers = Number(scenario.wallPlayers ?? config.wallPlayers ?? 0);
  const ball = BALL_NAMES[config.ballId || state.trainingBallId] || "STANDARD";
  const keeper = keeperById(config.keeperId || scenario.keeperId || "academy");
  return `${Math.round(distance)}Y · ${positionLabel(config.ballX ?? scenario.ballX)} · ${wallPlayers ? `${wallPlayers}-WALL` : "NO WALL"} · ${ball} · ${keeper.nickname || keeper.name}`;
}

function rewriteMobileHud(training) {
  const hud = document.getElementById("mobileGameHudV161");
  if (!hud) return;
  const scoreSpans = [...hud.querySelectorAll(".mobile-score-v161 > span")];
  if (scoreSpans[0]?.firstChild) scoreSpans[0].firstChild.textContent = training ? "ATTEMPTS " : "SCORE ";
  if (scoreSpans[1]?.firstChild) scoreSpans[1].firstChild.textContent = training ? "GOALS " : "STREAK ";
  hud.setAttribute("aria-label", training ? "Training session information" : "Mobile match information");
}

function renderTrainingUi() {
  const ui = ensureTrainingUi();
  const active = state.gameMode === "training";
  rewriteMobileHud(active);
  if (!ui || !active) return;

  const attempts = Number(state.trainingAttempts) || 0;
  const goals = Number(state.trainingGoals) || 0;
  const accuracy = attempts ? Math.round(goals / attempts * 100) : 0;

  const config = document.getElementById("trainingConfigV355");
  if (config) config.textContent = sessionSummary();
  const attemptsNode = document.getElementById("trainingAttemptsV355");
  const goalsNode = document.getElementById("trainingGoalsV355");
  const accuracyNode = document.getElementById("trainingAccuracyV355");
  const lastNode = document.getElementById("trainingLastV355");
  const lastTopNode = document.getElementById("trainingLastTopV355");
  if (attemptsNode) attemptsNode.textContent = String(attempts);
  if (goalsNode) goalsNode.textContent = String(goals);
  if (accuracyNode) accuracyNode.textContent = `${accuracy}%`;
  if (lastNode) lastNode.textContent = lastResult;
  if (lastTopNode) lastTopNode.textContent = lastResult;

  const blocked = Boolean(state.animation || state.presentation || !["ready", "result"].includes(state.phase));
  ["trainingResetV355", "trainingEditV355", "trainingExitV355"].forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.disabled = blocked;
  });
}

function resetBall() {
  if (state.gameMode !== "training" || state.animation || state.presentation) return;
  state.animation = null;
  state.presentation = null;
  state.pendingStageAdvance = false;
  state.shot = createShot();
  state.actionLockedUntil = performance.now() + 90;
  elements.resultBanner.textContent = "";
  elements.resultBanner.className = "result-banner";
  setPhase("ready");
  renderHud();
  window.dispatchEvent(new CustomEvent("footballlab:trainingreset"));
  queueMicrotask(renderTrainingUi);
}

function activateTrainingUi() {
  ensureTrainingUi();
  lastResult = "—";
  document.body.classList.add("training-ui-active-v355");
  queueMicrotask(renderTrainingUi);
}

function deactivateTrainingUi() {
  document.body.classList.remove("training-ui-active-v355");
  rewriteMobileHud(false);
}

ensureStylesheet();
ensureTrainingUi();
rewriteMobileHud(state.gameMode === "training");

window.addEventListener("footballlab:trainingstart", activateTrainingUi);
window.addEventListener("footballlab:trainingreset", renderTrainingUi);
window.addEventListener("footballlab:phasechange", (event) => {
  if (state.gameMode !== "training") {
    deactivateTrainingUi();
    return;
  }
  if (event.detail?.phase === "result") {
    queueMicrotask(() => {
      lastResult = compactResult();
      renderTrainingUi();
    });
    return;
  }
  queueMicrotask(renderTrainingUi);
});
window.addEventListener("footballlab:keeperchange", () => queueMicrotask(renderTrainingUi));
window.addEventListener("resize", () => queueMicrotask(renderTrainingUi));

const observer = new MutationObserver(() => {
  if (state.gameMode === "training") queueMicrotask(renderTrainingUi);
});
["scoreValue", "streakValue", "livesValue", "stageNumber", "stageName"].forEach((id) => {
  const node = document.getElementById(id);
  if (node) observer.observe(node, { childList:true, characterData:true, subtree:true });
});

window.__footballLabTrainingUiV355 = Object.freeze({
  build: BUILD,
  campaignWidgets: "hidden-in-training",
  sessionStats: ["attempts", "goals", "accuracy", "last-result"],
  actions: ["reset-ball", "edit-setup", "exit"],
  mobileHud: "training-specific-labels",
  competitiveSubmission: false
});
