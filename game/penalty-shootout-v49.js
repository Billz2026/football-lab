import {
  clamp, state, elements, syncStage, setStageWind, renderHud, openModal, closeModal
} from "./core-v6.js?v=32.4";
import { KICKERS, activeCharacter, selectCharacter } from "./characters-v13.js?v=32.4";
import { keeperById } from "./keepers-v14.js?v=32.4";
import { shootoutDecision, shootoutPhaseLabel, goalCount, REGULATION_KICKS } from "./penalty-shootout-rules-v49.js?v=49.0.0";

const BUILD = "49.0.0";
const RECORD_KEY = "footballLabPenaltyShootoutRecordV49";
const KEEPER_IDS = ["academy", "reflex", "giant", "reader", "aggressive"];
const DIFFICULTIES = Object.freeze({
  academy: Object.freeze({ name: "ACADEMY", opponentKeeperId: "academy", baseConversion: 0.61, pressurePenalty: 0.050, keeperStrength: 0.30 }),
  pro: Object.freeze({ name: "PRO", opponentKeeperId: "reflex", baseConversion: 0.71, pressurePenalty: 0.034, keeperStrength: 0.36 }),
  elite: Object.freeze({ name: "ELITE", opponentKeeperId: "reader", baseConversion: 0.79, pressurePenalty: 0.020, keeperStrength: 0.42 }),
  world: Object.freeze({ name: "WORLD CLASS", opponentKeeperId: "aggressive", baseConversion: 0.84, pressurePenalty: 0.012, keeperStrength: 0.47 })
});

let pendingStart = null;
let match = null;
let recordCommittedForMatch = false;

function ensureStylesheet() {
  if (document.querySelector('link[data-penalty-shootout-v49]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./game/penalty-shootout-v49.css?v=49.0.0";
  link.dataset.penaltyShootoutV49 = "true";
  document.head.appendChild(link);
}

function loadRecord() {
  const fallback = { shootouts: 0, wins: 0, losses: 0, currentWinStreak: 0, bestWinStreak: 0, longestSuddenDeath: 0 };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(RECORD_KEY) || "{}") };
  } catch {
    return fallback;
  }
}

function saveRecord(value) {
  try { localStorage.setItem(RECORD_KEY, JSON.stringify(value)); } catch {}
}

function kickerOptions() {
  return KICKERS.map((kicker) => `<option value="${kicker.id}">${kicker.name} · ${kicker.role}</option>`).join("");
}

function keeperOptions() {
  return KEEPER_IDS.map((id) => {
    const keeper = keeperById(id);
    return `<option value="${keeper.id}">${keeper.name} · ${keeper.role}</option>`;
  }).join("");
}

function difficultyOptions() {
  return Object.entries(DIFFICULTIES).map(([id, item]) => `<option value="${id}"${id === "pro" ? " selected" : ""}>${item.name}</option>`).join("");
}

function buildSetupModal() {
  let modal = document.getElementById("penaltyShootoutSetupV49");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "penaltyShootoutSetupV49";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "penaltyShootoutTitleV49");
  modal.innerHTML = `
    <div class="modal-backdrop" data-shootout-close-v49></div>
    <section class="modal-card panel penalty-shootout-setup-v49">
      <button class="modal-close" type="button" data-shootout-close-v49 aria-label="Close">×</button>
      <span class="section-label">COMPETITIVE PENALTIES</span>
      <h2 id="penaltyShootoutTitleV49">WIN THE SHOOTOUT.</h2>
      <p>Five penalties each. The shootout can end early when the trailing side cannot catch up. If level after five, sudden death begins immediately.</p>
      <div class="penalty-shootout-grid-v49">
        <label class="penalty-shootout-field-v49"><span>PENALTY TAKER</span><select id="shootoutTakerV49">${kickerOptions()}</select></label>
        <label class="penalty-shootout-field-v49"><span>YOUR GOALKEEPER</span><select id="shootoutKeeperV49">${keeperOptions()}</select></label>
        <label class="penalty-shootout-field-v49"><span>OPPOSITION LEVEL</span><select id="shootoutDifficultyV49">${difficultyOptions()}</select></label>
        <label class="penalty-shootout-field-v49"><span>FORMAT</span><select disabled><option>5 KICKS + SUDDEN DEATH</option></select></label>
      </div>
      <div class="penalty-shootout-rules-v49">
        <div><strong>5 EACH</strong><small>Alternating regulation kicks</small></div>
        <div><strong>EARLY FINISH</strong><small>Ends when the lead is unreachable</small></div>
        <div><strong>SUDDEN DEATH</strong><small>One-for-one pairs after a tie</small></div>
      </div>
      <div class="penalty-shootout-actions-v49">
        <button class="button button-secondary" type="button" data-shootout-close-v49>BACK</button>
        <button class="button button-primary" id="startShootoutV49" type="button">START SHOOTOUT</button>
      </div>
    </section>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-shootout-close-v49]").forEach((button) => button.addEventListener("click", () => closeModal(modal)));
  modal.querySelector("#startShootoutV49")?.addEventListener("click", startShootoutFromSetup);
  return modal;
}

function buildResultModal() {
  let modal = document.getElementById("penaltyShootoutResultV49");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "penaltyShootoutResultV49";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "penaltyShootoutResultTitleV49");
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <section class="modal-card panel penalty-shootout-result-v49">
      <span class="section-label">PENALTY SHOOTOUT</span>
      <h2 id="penaltyShootoutResultTitleV49">FULL TIME</h2>
      <p id="penaltyShootoutResultCopyV49"></p>
      <div class="penalty-shootout-result-score-v49">
        <div><span>YOU</span><strong id="shootoutFinalPlayerV49">0</strong></div><b>—</b><div><span>OPPOSITION</span><strong id="shootoutFinalOpponentV49">0</strong></div>
      </div>
      <div class="penalty-shootout-record-v49">
        <div><span>SHOOTOUTS</span><strong id="shootoutRecordPlayedV49">0</strong></div>
        <div><span>WINS</span><strong id="shootoutRecordWinsV49">0</strong></div>
        <div><span>BEST WIN STREAK</span><strong id="shootoutRecordStreakV49">0</strong></div>
      </div>
      <div class="penalty-shootout-actions-v49">
        <button class="button button-secondary" id="shootoutMenuV49" type="button">MAIN MENU</button>
        <button class="button button-primary" id="shootoutAgainV49" type="button">PLAY AGAIN</button>
      </div>
    </section>`;
  document.body.appendChild(modal);
  modal.querySelector("#shootoutMenuV49")?.addEventListener("click", () => leaveShootout(false));
  modal.querySelector("#shootoutAgainV49")?.addEventListener("click", () => leaveShootout(true));
  return modal;
}

function ensureScoreboard() {
  let board = document.getElementById("shootoutScoreboardV49");
  if (board) return board;
  const panel = document.querySelector(".control-panel");
  if (!panel) return null;
  board = document.createElement("section");
  board.id = "shootoutScoreboardV49";
  board.className = "shootout-scoreboard-v49";
  board.setAttribute("aria-label", "Penalty shootout score");
  board.innerHTML = `
    <div class="shootout-score-head-v49"><span class="shootout-score-label-v49">PENALTY SHOOTOUT</span><strong id="shootoutPhaseV49">KICK 1 OF 5</strong></div>
    <div class="shootout-score-row-v49"><strong>YOU</strong><div class="shootout-markers-v49" id="shootoutPlayerMarkersV49"></div><b id="shootoutPlayerScoreV49">0</b></div>
    <div class="shootout-score-row-v49"><strong>OPPONENT</strong><div class="shootout-markers-v49" id="shootoutOpponentMarkersV49"></div><b id="shootoutOpponentScoreV49">0</b></div>
    <div class="shootout-last-v49" id="shootoutLastV49">YOUR KICK · PICK A CORNER AND COMMIT</div>`;
  panel.prepend(board);
  return board;
}

function updateHub() {
  const tile = document.querySelector(".hub-mode-penalties");
  if (!tile) return;
  tile.disabled = false;
  tile.setAttribute("aria-disabled", "false");
  tile.querySelector(".hub-mode-status")?.replaceChildren(document.createTextNode("PLAYABLE"));
  const title = tile.querySelector(".hub-tile-copy h3");
  const copy = tile.querySelector(".hub-tile-copy p");
  const cta = tile.querySelector(".hub-mode-cta");
  if (title) title.textContent = "PENALTY SHOOTOUT";
  if (copy) copy.textContent = "Five kicks each, early clinches and sudden death against escalating goalkeeper pressure.";
  if (cta) cta.innerHTML = "START SHOOTOUT <b>→</b>";
  tile.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    openSetup();
  }, true);

  const heroCopy = document.querySelector(".hub-hero-copy");
  if (heroCopy) heroCopy.textContent = "Choose a football discipline, build your technique and keep improving. Free Training, Classic Free Kicks and competitive Penalty Shootouts are playable now.";
  const playable = document.querySelector(".hub-hero-chip b");
  if (playable) playable.textContent = "3";
}

function openSetup() {
  const modal = buildSetupModal();
  const taker = modal.querySelector("#shootoutTakerV49");
  if (taker) taker.value = activeCharacter().id;
  openModal(modal);
}

function trainingField(id) {
  return document.getElementById(id);
}

function startShootoutFromSetup() {
  const modal = buildSetupModal();
  const takerId = modal.querySelector("#shootoutTakerV49")?.value || activeCharacter().id;
  const userKeeperId = modal.querySelector("#shootoutKeeperV49")?.value || "academy";
  const difficultyId = modal.querySelector("#shootoutDifficultyV49")?.value || "pro";
  const difficulty = DIFFICULTIES[difficultyId] || DIFFICULTIES.pro;

  pendingStart = { takerId, userKeeperId, difficultyId, seed: (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0 };
  selectCharacter(takerId);

  const penaltyActivity = [...document.querySelectorAll("#trainingModalV35 .training-activity-v35")]
    .find((button) => button.textContent.includes("PENALTIES"));
  penaltyActivity?.click();

  if (trainingField("trainingTakerV35")) trainingField("trainingTakerV35").value = takerId;
  if (trainingField("trainingKeeperV35")) trainingField("trainingKeeperV35").value = difficulty.opponentKeeperId;
  if (trainingField("trainingBallV35")) trainingField("trainingBallV35").value = "standard";
  if (trainingField("trainingDistanceV35")) trainingField("trainingDistanceV35").value = "12";
  if (trainingField("trainingPositionV35")) trainingField("trainingPositionV35").value = "0";
  if (trainingField("trainingWallCountV35")) trainingField("trainingWallCountV35").value = "0";
  if (trainingField("trainingWindV35")) trainingField("trainingWindV35").value = "off";

  closeModal(modal);
  trainingField("trainingStartV35")?.click();
}

function activateShootout() {
  if (!pendingStart) return;
  const difficulty = DIFFICULTIES[pendingStart.difficultyId] || DIFFICULTIES.pro;
  match = {
    ...pendingStart,
    playerResults: [],
    opponentResults: [],
    lastOpponentMessage: "YOUR KICK · PICK A CORNER AND COMMIT",
    complete: false,
    decision: null
  };
  pendingStart = null;
  recordCommittedForMatch = false;

  const scenario = globalThis.__footballLabTrainingScenario;
  if (!scenario) return;
  Object.assign(scenario, {
    id: "penalty-shootout",
    name: "PENALTY SHOOTOUT",
    label: "12 YARDS · COMPETITIVE PENALTY",
    chapterName: "PENALTY SHOOTOUT",
    venue: "FOOTBALL LAB SHOOTOUT ARENA",
    keeperId: difficulty.opponentKeeperId,
    keeper: difficulty.keeperStrength,
    aimSpeed: 0.94,
    trainingPenalty: false,
    competitivePenalty: true
  });
  state.trainingConfig = {
    ...(state.trainingConfig || {}),
    activity: "shootout",
    keeperId: difficulty.opponentKeeperId,
    distance: 12,
    ballX: 0,
    wallPlayers: 0,
    windId: "off",
    ballId: "standard"
  };
  state.stage = 0;
  state.misses = 0;
  state.score = 0;
  state.streak = 0;
  state.pendingStageAdvance = false;
  state.stageWind = 0;
  syncStage();
  setStageWind();
  state.stageWind = 0;
  document.documentElement.classList.add("penalty-shootout-active-v49");
  ensureScoreboard();
  scheduleRender();
}

function markerHtml(results) {
  const regulation = Array.from({ length: REGULATION_KICKS }, (_, index) => {
    const result = results[index];
    const className = result === true ? " is-goal" : result === false ? " is-miss" : "";
    const label = result === true ? "G" : result === false ? "×" : "○";
    return `<span class="shootout-kick-v49${className}">${label}</span>`;
  });
  const sudden = results.slice(REGULATION_KICKS).map((result) => `<span class="shootout-kick-v49 is-sudden${result ? " is-goal" : " is-miss"}">${result ? "G" : "×"}</span>`);
  return [...regulation, ...sudden].join("");
}

function renderMobileHud() {
  const hud = document.getElementById("mobileGameHudV161");
  if (!hud || !match) return;
  const scoreSpans = [...hud.querySelectorAll(".mobile-score-v161 > span")];
  if (scoreSpans[0]?.firstChild) scoreSpans[0].firstChild.textContent = "YOU ";
  if (scoreSpans[1]?.firstChild) scoreSpans[1].firstChild.textContent = "OPP ";
  hud.setAttribute("aria-label", "Penalty shootout score");
}

function renderShootoutUi() {
  if (!match || state.trainingConfig?.activity !== "shootout") return;
  const playerGoals = goalCount(match.playerResults);
  const opponentGoals = goalCount(match.opponentResults);
  const phase = shootoutPhaseLabel(match.playerResults, match.opponentResults);
  const opponentKeeper = keeperById((DIFFICULTIES[match.difficultyId] || DIFFICULTIES.pro).opponentKeeperId);
  const labels = [elements.scoreValue, elements.streakValue, elements.livesValue].map((value) => value?.parentElement?.querySelector("span"));
  if (labels[0]) labels[0].textContent = "YOU";
  if (labels[1]) labels[1].textContent = "OPPONENT";
  if (labels[2]) labels[2].textContent = "ROUND";
  if (elements.scoreValue) elements.scoreValue.textContent = String(playerGoals);
  if (elements.streakValue) elements.streakValue.textContent = String(opponentGoals);
  if (elements.livesValue) elements.livesValue.textContent = phase.includes("SUDDEN") ? "SD" : `${Math.min(5, match.playerResults.length + 1)}/5`;
  if (elements.stageNumber) elements.stageNumber.textContent = `PENALTY SHOOTOUT · ${phase}`;
  if (elements.stageName) elements.stageName.textContent = `${activeCharacter().name} vs ${opponentKeeper.nickname}`;
  if (elements.windArrow) elements.windArrow.textContent = "•";
  if (elements.windValue) elements.windValue.textContent = "0.0 m/s";
  const chip = document.querySelector(".training-session-chip-v35");
  if (chip) chip.textContent = "PENALTY SHOOTOUT · COMPETITIVE";
  const board = ensureScoreboard();
  if (board) {
    board.hidden = false;
    const phaseNode = document.getElementById("shootoutPhaseV49");
    const playerMarkers = document.getElementById("shootoutPlayerMarkersV49");
    const opponentMarkers = document.getElementById("shootoutOpponentMarkersV49");
    const playerScore = document.getElementById("shootoutPlayerScoreV49");
    const opponentScore = document.getElementById("shootoutOpponentScoreV49");
    const last = document.getElementById("shootoutLastV49");
    if (phaseNode) phaseNode.textContent = phase;
    if (playerMarkers) playerMarkers.innerHTML = markerHtml(match.playerResults);
    if (opponentMarkers) opponentMarkers.innerHTML = markerHtml(match.opponentResults);
    if (playerScore) playerScore.textContent = String(playerGoals);
    if (opponentScore) opponentScore.textContent = String(opponentGoals);
    if (last) last.textContent = match.lastOpponentMessage;
  }
  if (state.phase === "ready" && !match.complete) {
    if (elements.phaseHelp) elements.phaseHelp.textContent = phase.includes("SUDDEN")
      ? "Sudden death. Score, then survive the opponent reply. One mistake can end it."
      : "Choose the finish, then execute power and contact. Your opponent replies after every kick unless the shootout is already decided.";
    if (elements.canvasPrompt) elements.canvasPrompt.textContent = `${phase} · YOUR PENALTY`;
  }
  renderMobileHud();
}

function scheduleRender() {
  queueMicrotask(() => queueMicrotask(renderShootoutUi));
}

function deterministicRoll(seed, index) {
  let value = (seed + Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4294967296;
}

function opponentScoresNext() {
  const difficulty = DIFFICULTIES[match.difficultyId] || DIFFICULTIES.pro;
  const keeper = keeperById(match.userKeeperId);
  const stats = keeper.stats || {};
  const keeperRating = (Number(stats.reflexes || 70) * 0.45) + (Number(stats.reading || 70) * 0.35) + (Number(stats.reach || 70) * 0.20);
  const keeperEffect = (keeperRating - 75) * 0.0024;
  const kickNumber = match.opponentResults.length + 1;
  const pressureSteps = Math.max(0, kickNumber - 3) + (kickNumber > REGULATION_KICKS ? 2 : 0);
  const chance = clamp(difficulty.baseConversion - keeperEffect - pressureSteps * difficulty.pressurePenalty, 0.44, 0.91);
  const roll = deterministicRoll(match.seed, kickNumber + match.playerResults.length * 7);
  return { goal: roll < chance, chance, roll };
}

function applyPressureForNextKick() {
  if (!match) return;
  const scenario = globalThis.__footballLabTrainingScenario;
  const pressure = Math.max(0, match.playerResults.length - 2) + Math.max(0, match.playerResults.length - REGULATION_KICKS) * 2;
  state.stage = Math.round(clamp(pressure * 1.6, 0, 12));
  if (scenario) scenario.aimSpeed = clamp(0.94 + pressure * 0.035, 0.94, 1.22);
  syncStage();
  setStageWind();
  state.stageWind = 0;
}

function commitMatchRecord() {
  if (!match?.complete || recordCommittedForMatch) return loadRecord();
  recordCommittedForMatch = true;
  const value = loadRecord();
  value.shootouts += 1;
  if (match.decision?.winner === "player") {
    value.wins += 1;
    value.currentWinStreak += 1;
    value.bestWinStreak = Math.max(value.bestWinStreak, value.currentWinStreak);
  } else {
    value.losses += 1;
    value.currentWinStreak = 0;
  }
  const suddenRounds = Math.max(0, Math.max(match.playerResults.length, match.opponentResults.length) - REGULATION_KICKS);
  value.longestSuddenDeath = Math.max(value.longestSuddenDeath, suddenRounds);
  saveRecord(value);
  return value;
}

function completeMatch(decision) {
  match.complete = true;
  match.decision = decision;
  state.misses = 0;
  state.pendingStageAdvance = false;
  commitMatchRecord();
}

function handlePlayerResult() {
  if (!match || match.complete || state.trainingConfig?.activity !== "shootout" || !state.shot || state.shot.__shootoutCountedV49) return;
  state.shot.__shootoutCountedV49 = true;
  const scored = state.shot.outcome === "GOAL";
  match.playerResults.push(scored);
  state.misses = 0;
  state.score = 0;
  state.streak = 0;
  state.bestRunStreak = 0;
  state.pendingStageAdvance = false;

  let decision = shootoutDecision(match.playerResults, match.opponentResults);
  if (!decision.complete) {
    const opponent = opponentScoresNext();
    match.opponentResults.push(opponent.goal);
    const keeper = keeperById(match.userKeeperId);
    match.lastOpponentMessage = opponent.goal
      ? `OPPONENT SCORES · ${goalCount(match.playerResults)}–${goalCount(match.opponentResults)}`
      : `${keeper.nickname} STOPS IT · ${goalCount(match.playerResults)}–${goalCount(match.opponentResults)}`;
    decision = shootoutDecision(match.playerResults, match.opponentResults);
  } else {
    match.lastOpponentMessage = "SHOOTOUT CLINCHED BEFORE THE OPPONENT REPLY";
  }

  if (decision.complete) completeMatch(decision);
  else applyPressureForNextKick();

  const ownMessage = scored ? "YOU SCORE" : state.shot.outcome === "SAVE" ? "SAVED" : "YOU MISS";
  if (elements.resultBanner) elements.resultBanner.textContent = `${ownMessage} · ${match.lastOpponentMessage}`;
  scheduleRender();
}

function renderFinalModal() {
  if (!match?.complete) return;
  const modal = buildResultModal();
  const playerGoals = goalCount(match.playerResults);
  const opponentGoals = goalCount(match.opponentResults);
  const won = match.decision?.winner === "player";
  const suddenRounds = Math.max(0, Math.max(match.playerResults.length, match.opponentResults.length) - REGULATION_KICKS);
  const record = loadRecord();
  const title = document.getElementById("penaltyShootoutResultTitleV49");
  const copy = document.getElementById("penaltyShootoutResultCopyV49");
  if (title) title.textContent = won ? "SHOOTOUT WON." : "SHOOTOUT LOST.";
  if (copy) copy.textContent = suddenRounds
    ? `${won ? "You held your nerve" : "The opposition edged it"} after ${suddenRounds} sudden-death ${suddenRounds === 1 ? "round" : "rounds"}.`
    : won ? "You won inside the regulation five-kick format." : "The opposition won inside the regulation five-kick format.";
  document.getElementById("shootoutFinalPlayerV49").textContent = String(playerGoals);
  document.getElementById("shootoutFinalOpponentV49").textContent = String(opponentGoals);
  document.getElementById("shootoutRecordPlayedV49").textContent = String(record.shootouts);
  document.getElementById("shootoutRecordWinsV49").textContent = String(record.wins);
  document.getElementById("shootoutRecordStreakV49").textContent = String(record.bestWinStreak);
  openModal(modal);
}

function lockCompletedShootout() {
  if (!match?.complete || state.phase !== "ready") return;
  state.phase = "paused";
  state.actionLockedUntil = Number.POSITIVE_INFINITY;
  if (elements.shotAction) elements.shotAction.disabled = true;
  renderShootoutUi();
  renderFinalModal();
}

function cleanupPresentation() {
  document.documentElement.classList.remove("penalty-shootout-active-v49");
  const board = document.getElementById("shootoutScoreboardV49");
  if (board) board.hidden = true;
  closeModal(buildResultModal());
  state.actionLockedUntil = 0;
  if (elements.shotAction) elements.shotAction.disabled = false;
  match = null;
  pendingStart = null;
  recordCommittedForMatch = false;
}

function leaveShootout(reopen) {
  closeModal(buildResultModal());
  const exit = elements.exitGame;
  if (state.gameMode === "training" && exit) exit.click();
  else cleanupPresentation();
  setTimeout(() => {
    cleanupPresentation();
    if (reopen) openSetup();
  }, 0);
}

function publishReleaseMetadata() {
  const old = window.__footballLabReleaseV480;
  if (!old) return false;
  const release = Object.freeze({
    ...old,
    build: BUILD,
    primaryModes: "training-free-kicks-competitive-penalty-shootout-corners-finishing-match-scenarios",
    trainingActivities: "free-kicks-and-penalties-live-corners-finishing-scenarios-reserved",
    competitivePenalties: "five-kick-regulation-early-clinch-sudden-death",
    penaltyOpponent: "deterministic-difficulty-and-user-keeper-weighted",
    penaltyPressure: "progressive-meter-and-keeper-pressure",
    penaltyRecords: "shootouts-wins-losses-win-streak-sudden-death",
    cacheGeneration: BUILD
  });
  window.__footballLabReleaseV490 = release;
  document.documentElement.dataset.footballLabBuild = BUILD;
  const badge = document.querySelector(".build-badge-v22");
  if (badge) { badge.textContent = "V49.0"; badge.title = `Football Lab build ${BUILD}`; }
  const version = document.querySelector(".settings-version-v22 strong");
  if (version) version.textContent = BUILD;
  return true;
}

ensureStylesheet();
buildSetupModal();
buildResultModal();
ensureScoreboard();
updateHub();

window.addEventListener("footballlab:trainingstart", () => {
  if (pendingStart) activateShootout();
});

window.addEventListener("footballlab:phasechange", (event) => {
  if (!match || state.trainingConfig?.activity !== "shootout") return;
  if (event.detail?.phase === "result") handlePlayerResult();
  if (event.detail?.phase === "ready") {
    state.misses = 0;
    if (match.complete) queueMicrotask(() => queueMicrotask(lockCompletedShootout));
  }
  scheduleRender();
});

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest("#shotAction,#exitGame,#brandButton") : null;
  if (!target) return;
  if (target.id === "shotAction" && match?.complete) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  if ((target.id === "exitGame" || target.id === "brandButton") && match) {
    setTimeout(cleanupPresentation, 0);
  }
}, true);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && buildSetupModal().classList.contains("is-open")) closeModal(buildSetupModal());
});

const releaseTimer = setInterval(() => {
  if (publishReleaseMetadata()) clearInterval(releaseTimer);
}, 60);
setTimeout(() => clearInterval(releaseTimer), 10000);

window.__footballLabPenaltyShootoutV49 = Object.freeze({
  build: BUILD,
  regulationKicks: REGULATION_KICKS,
  earlyClinches: true,
  suddenDeath: true,
  alternatingOpponentReplies: true,
  difficultyLevels: Object.keys(DIFFICULTIES),
  recordKey: RECORD_KEY,
  snapshot: () => match ? {
    playerResults: [...match.playerResults],
    opponentResults: [...match.opponentResults],
    complete: match.complete,
    winner: match.decision?.winner || null,
    difficultyId: match.difficultyId,
    userKeeperId: match.userKeeperId
  } : null
});
