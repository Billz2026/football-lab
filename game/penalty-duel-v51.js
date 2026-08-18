import { clamp, state, elements, syncStage } from "./core-v6.js?v=32.4";
import { keeperById } from "./keepers-v14.js?v=32.4";
import { shootoutDecision, shootoutPhaseLabel, goalCount, REGULATION_KICKS } from "./penalty-shootout-rules-v49.js?v=49.0.0";

const BUILD = "51.0.0";
const RECORD_KEY = "footballLabPenaltyShootoutRecordV49";
const PENALTY_CAMERA = Object.freeze({ sideOffset: 0, backDistance: 7.15, height: 1.82, fovY: 34.5, targetHeight: 1.11 });
const ZONES = Object.freeze([
  Object.freeze({ id: "high-left", label: "TOP LEFT", short: "TL", x: 0.18, y: 0.18, column: "left", row: "high" }),
  Object.freeze({ id: "high-centre", label: "HIGH CENTRE", short: "HC", x: 0.50, y: 0.18, column: "centre", row: "high" }),
  Object.freeze({ id: "high-right", label: "TOP RIGHT", short: "TR", x: 0.82, y: 0.18, column: "right", row: "high" }),
  Object.freeze({ id: "low-left", label: "LOW LEFT", short: "LL", x: 0.18, y: 0.76, column: "left", row: "low" }),
  Object.freeze({ id: "low-centre", label: "LOW CENTRE", short: "LC", x: 0.50, y: 0.76, column: "centre", row: "low" }),
  Object.freeze({ id: "low-right", label: "LOW RIGHT", short: "LR", x: 0.82, y: 0.76, column: "right", row: "low" })
]);
const DIFFICULTIES = Object.freeze({
  academy: Object.freeze({ label: "ACADEMY", cpuName: "ACADEMY XI", runUpMs: 1650, cueReliability: 0.88, reactsToEarly: 0.08, missChance: 0.14, saveThreshold: 0.48, disguise: 0.10 }),
  pro: Object.freeze({ label: "PROFESSIONAL", cpuName: "PRO XI", runUpMs: 1450, cueReliability: 0.72, reactsToEarly: 0.28, missChance: 0.09, saveThreshold: 0.56, disguise: 0.28 }),
  elite: Object.freeze({ label: "ELITE", cpuName: "ELITE XI", runUpMs: 1250, cueReliability: 0.54, reactsToEarly: 0.54, missChance: 0.055, saveThreshold: 0.63, disguise: 0.50 }),
  world: Object.freeze({ label: "WORLD CLASS", cpuName: "WORLD XI", runUpMs: 1080, cueReliability: 0.38, reactsToEarly: 0.78, missChance: 0.03, saveThreshold: 0.70, disguise: 0.72 })
});

let active = false;
let duel = null;
let attackZone = null;
let internalAction = false;
let composureValue = 0.5;
let composureFrame = 0;
let composureStartedAt = 0;
let defense = null;
let defenseTimer = 0;
let recordCommitted = false;

function ensureStylesheet() {
  if (document.querySelector('link[data-penalty-duel-v51]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./game/penalty-duel-v51.css?v=51.0.0";
  link.dataset.penaltyDuelV51 = "true";
  document.head.appendChild(link);
}

function isShootout() {
  return state.trainingConfig?.activity === "shootout" && document.documentElement.classList.contains("penalty-shootout-active-v49");
}

function difficulty() {
  return DIFFICULTIES[duel?.difficultyId] || DIFFICULTIES.pro;
}

function deterministic(seed, index) {
  let value = ((seed >>> 0) + Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return (value >>> 0) / 4294967296;
}

function kickIndex() {
  return Math.max(duel?.playerResults?.length || 0, duel?.opponentResults?.length || 0);
}

function pressure() {
  const taken = kickIndex();
  const sudden = Math.max(0, taken - REGULATION_KICKS);
  return Math.round(clamp(24 + taken * 11 + sudden * 17, 24, 100));
}

function loadRecord() {
  const fallback = { shootouts: 0, wins: 0, losses: 0, currentWinStreak: 0, bestWinStreak: 0, longestSuddenDeath: 0 };
  try { return { ...fallback, ...JSON.parse(localStorage.getItem(RECORD_KEY) || "{}") }; }
  catch { return fallback; }
}

function saveRecord(value) {
  try { localStorage.setItem(RECORD_KEY, JSON.stringify(value)); } catch {}
}

function ensureAttackUi() {
  let zones = document.getElementById("penaltyDuelZonesV51");
  if (!zones) {
    zones = document.createElement("div");
    zones.id = "penaltyDuelZonesV51";
    zones.className = "penalty-duel-zones-v51";
    zones.setAttribute("aria-label", "Choose penalty finish");
    zones.innerHTML = ZONES.map((zone) => `<button class="duel-zone-v51" type="button" data-v51-attack-zone="${zone.id}"><strong>${zone.short}</strong><small>${zone.label}</small></button>`).join("");
    document.querySelector(".game-frame")?.appendChild(zones);
    zones.querySelectorAll("[data-v51-attack-zone]").forEach((button) => button.addEventListener("click", () => selectAttackZone(button.dataset.v51AttackZone)));
  }

  let panel = document.getElementById("penaltyDuelControlV51");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "penaltyDuelControlV51";
    panel.className = "penalty-duel-control-v51";
    panel.innerHTML = `
      <div class="duel-card-v51 duel-card-pressure-v51"><div class="duel-pressure-head-v51"><span>PRESSURE</span><strong id="duelPressureV51">24%</strong></div><i class="duel-pressure-track-v51"><b id="duelPressureBarV51"></b></i></div>
      <div class="duel-card-v51"><span>KEEPER BODY LANGUAGE</span><strong id="duelKeeperReadV51">HOLDING THE LINE</strong><small>Read the keeper, but the cue is never a guaranteed dive.</small></div>
      <div class="duel-card-v51"><span>YOUR DECISION</span><strong id="duelAttackChoiceV51">SETTLE ON THE SPOT</strong><small id="duelAttackHelpV51">Step up, then pick one finish. No curl. No free-kick setup.</small></div>
      <button class="button button-primary duel-attack-action-v51" id="duelStepUpV51" type="button">STEP UP</button>
      <button class="button button-primary duel-attack-action-v51" id="duelRunUpV51" type="button" hidden disabled>START RUN-UP</button>
      <div class="duel-composure-v51" id="duelComposureV51"><div class="duel-composure-copy-v51"><span>COMPOSURE</span><strong id="duelComposureCopyV51">TIME THE STRIKE</strong></div><div class="duel-composure-track-v51"><i class="duel-composure-marker-v51" id="duelComposureMarkerV51"></i></div><button class="button button-primary duel-attack-action-v51" id="duelStrikeV51" type="button">STRIKE</button></div>`;
    const heading = document.querySelector(".control-panel .control-heading");
    if (heading?.parentElement) heading.insertAdjacentElement("afterend", panel);
    document.getElementById("duelStepUpV51")?.addEventListener("click", stepUp);
    document.getElementById("duelRunUpV51")?.addEventListener("click", startRunUp);
    document.getElementById("duelStrikeV51")?.addEventListener("click", strikeFromComposure);
  }
  return { zones, panel };
}

function ensureDefenseUi() {
  let overlay = document.getElementById("penaltyDefenseV51");
  if (overlay) return overlay;
  overlay = document.createElement("section");
  overlay.id = "penaltyDefenseV51";
  overlay.className = "penalty-defense-v51";
  overlay.setAttribute("aria-label", "Control your goalkeeper against the CPU penalty");
  overlay.innerHTML = `
    <div class="defense-stadium-v51"></div><div class="defense-goal-v51"></div>
    <div class="defense-header-v51"><div><span>CPU PENALTY · YOU ARE THE GOALKEEPER</span><strong id="defenseCpuNameV51">PRO XI</strong><small id="defenseCueV51">READ THE RUN-UP</small></div><div><span>DIFFICULTY</span><strong id="defenseDifficultyV51">PROFESSIONAL</strong><small id="defenseTimingV51">WAIT FOR THE STRIKE</small></div></div>
    <div class="defense-cpu-v51" id="defenseCpuV51"><i></i><b></b></div><div class="defense-ball-v51" id="defenseBallV51"></div>
    <div class="defense-keeper-v51" id="defenseKeeperV51"><i class="head"></i><i class="body"></i><i class="arm-l"></i><i class="arm-r"></i><i class="leg-l"></i><i class="leg-r"></i></div>
    <div class="defense-result-v51" id="defenseResultV51"></div>
    <div class="defense-controls-v51"><div class="defense-shuffle-v51" aria-label="Goalkeeper starting position"><button type="button" data-v51-shift="left">SHIFT LEFT</button><button type="button" data-v51-shift="centre" class="is-selected">HOLD CENTRE</button><button type="button" data-v51-shift="right">SHIFT RIGHT</button></div><div class="defense-dive-grid-v51" aria-label="Goalkeeper dive direction">${ZONES.map((zone) => `<button type="button" data-v51-dive="${zone.id}" disabled>${zone.label}</button>`).join("")}</div></div>`;
  document.querySelector(".game-frame")?.appendChild(overlay);
  overlay.querySelectorAll("[data-v51-shift]").forEach((button) => button.addEventListener("click", () => setKeeperShift(button.dataset.v51Shift)));
  overlay.querySelectorAll("[data-v51-dive]").forEach((button) => button.addEventListener("click", () => commitDive(button.dataset.v51Dive)));
  return overlay;
}

function ensureResultModal() {
  let modal = document.getElementById("penaltyDuelResultV51");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "penaltyDuelResultV51";
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `<div class="modal-backdrop"></div><section class="modal-card panel penalty-duel-result-v51"><span class="section-label">PLAYER VS CPU PENALTIES</span><h2 id="duelResultTitleV51">SHOOTOUT WON.</h2><p id="duelResultCopyV51"></p><div class="duel-final-score-v51"><div><span>YOU</span><strong id="duelFinalYouV51">0</strong></div><b>—</b><div><span>CPU</span><strong id="duelFinalCpuV51">0</strong></div></div><div class="duel-result-actions-v51"><button class="button button-secondary" id="duelMenuV51" type="button">MAIN MENU</button><button class="button button-primary" id="duelAgainV51" type="button">PLAY AGAIN</button></div></section>`;
  document.body.appendChild(modal);
  document.getElementById("duelMenuV51")?.addEventListener("click", () => leaveDuel(false));
  document.getElementById("duelAgainV51")?.addEventListener("click", () => leaveDuel(true));
  return modal;
}

function showModal(modal) { modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false"); }
function hideModal(modal) { modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); }

function enhanceSetup() {
  const modal = document.getElementById("penaltyShootoutSetupV49");
  if (!modal) return;
  const title = modal.querySelector("#penaltyShootoutTitleV49");
  const intro = title?.nextElementSibling;
  const difficultyLabel = modal.querySelector("#shootoutDifficultyV49")?.closest("label")?.querySelector(":scope > span");
  if (title) title.textContent = "BEAT THE CPU. THEN SAVE THEIRS.";
  if (intro) intro.textContent = "You take every penalty, then the camera flips and you control your goalkeeper for the CPU reply. Five each, early clinches and sudden death.";
  if (difficultyLabel) difficultyLabel.textContent = "CPU DIFFICULTY";
  const tile = document.querySelector(".hub-mode-penalties .hub-tile-copy p");
  if (tile) tile.textContent = "A full player-vs-CPU shootout: take your kick, then control the goalkeeper for the CPU reply.";
}

function setPenaltyCamera() {
  const scenario = globalThis.__footballLabTrainingScenario;
  if (!scenario || !isShootout()) return;
  scenario.camera = { ...PENALTY_CAMERA };
  scenario.penaltyExperience = "v51-full-player-vs-cpu-duel";
  scenario.penaltyCurl = false;
  scenario.penaltyExecution = "placement-runup-composure";
  syncStage();
  state.stageWind = 0;
}

function keeperCue() {
  const cues = ["HOLDING THE CENTRE", "SMALL STEP LEFT", "SMALL STEP RIGHT", "BOUNCING LATE", "SHOWING THE FAR POST", "WAITING ON THE LINE"];
  const offset = ({ academy: 0, pro: 1, elite: 3, world: 5 })[duel?.difficultyId] || 0;
  return cues[(kickIndex() + offset) % cues.length];
}

function renderScoreboard(message = null) {
  if (!duel) return;
  const playerGoals = goalCount(duel.playerResults);
  const cpuGoals = goalCount(duel.opponentResults);
  const phase = shootoutPhaseLabel(duel.playerResults, duel.opponentResults);
  const playerMarkers = document.getElementById("shootoutPlayerMarkersV49");
  const cpuMarkers = document.getElementById("shootoutOpponentMarkersV49");
  const marker = (results) => {
    const regulation = Array.from({ length: REGULATION_KICKS }, (_, index) => {
      const value = results[index]; const cls = value === true ? " is-goal" : value === false ? " is-miss" : ""; const label = value === true ? "G" : value === false ? "×" : "○";
      return `<span class="shootout-kick-v49${cls}">${label}</span>`;
    });
    const sudden = results.slice(REGULATION_KICKS).map((value) => `<span class="shootout-kick-v49 is-sudden${value ? " is-goal" : " is-miss"}">${value ? "G" : "×"}</span>`);
    return [...regulation, ...sudden].join("");
  };
  if (playerMarkers) playerMarkers.innerHTML = marker(duel.playerResults);
  if (cpuMarkers) cpuMarkers.innerHTML = marker(duel.opponentResults);
  if (document.getElementById("shootoutPlayerScoreV49")) document.getElementById("shootoutPlayerScoreV49").textContent = String(playerGoals);
  if (document.getElementById("shootoutOpponentScoreV49")) document.getElementById("shootoutOpponentScoreV49").textContent = String(cpuGoals);
  if (document.getElementById("shootoutPhaseV49")) document.getElementById("shootoutPhaseV49").textContent = phase;
  if (document.getElementById("shootoutLastV49")) document.getElementById("shootoutLastV49").textContent = message || duel.lastMessage || (duel.turn === "cpu" ? "CPU KICK · YOU ARE IN GOAL" : "YOUR KICK · PICK YOUR FINISH");
  const opponentLabel = document.querySelector("#shootoutOpponentMarkersV49")?.closest(".shootout-score-row-v49")?.querySelector("strong");
  if (opponentLabel) opponentLabel.textContent = "CPU";
  if (elements.scoreValue) elements.scoreValue.textContent = String(playerGoals);
  if (elements.streakValue) elements.streakValue.textContent = String(cpuGoals);
  if (elements.livesValue) elements.livesValue.textContent = phase.includes("SUDDEN") ? "SD" : `${Math.min(5, duel.playerResults.length + 1)}/5`;
  if (elements.stageNumber) elements.stageNumber.textContent = `PENALTY DUEL · ${phase}`;
  if (elements.stageName) elements.stageName.textContent = duel.turn === "cpu" ? "YOU ARE THE GOALKEEPER" : "YOU ARE THE PENALTY TAKER";
}

function updatePressureUi() {
  const value = pressure();
  const root = document.documentElement;
  root.classList.toggle("is-high-pressure-v51", value >= 72);
  const copy = document.getElementById("duelPressureV51"); const bar = document.getElementById("duelPressureBarV51");
  if (copy) copy.textContent = `${value}%`; if (bar) bar.style.width = `${value}%`;
}

function clearAttackSelection() {
  attackZone = null;
  document.querySelectorAll("[data-v51-attack-zone]").forEach((button) => button.classList.remove("is-selected"));
  const choice = document.getElementById("duelAttackChoiceV51"); const help = document.getElementById("duelAttackHelpV51"); const run = document.getElementById("duelRunUpV51");
  if (choice) choice.textContent = "SETTLE ON THE SPOT";
  if (help) help.textContent = "Step up, then pick one finish. No curl. No free-kick setup.";
  if (run) { run.disabled = true; run.hidden = true; run.textContent = "START RUN-UP"; }
}

function renderAttack() {
  if (!active || !duel || duel.turn !== "player" || duel.complete || !isShootout()) return;
  ensureAttackUi(); updatePressureUi();
  const root = document.documentElement;
  const phase = state.phase;
  root.dataset.duelAttackV51 = phase === "aim" ? "aim" : phase === "contact" ? "contact" : phase;
  const section = document.querySelector(".control-heading .section-label");
  if (section) section.textContent = "PENALTY DUEL";
  const step = document.getElementById("duelStepUpV51"); const run = document.getElementById("duelRunUpV51");
  if (step) step.hidden = phase !== "ready";
  if (run) run.hidden = phase !== "aim";
  const read = document.getElementById("duelKeeperReadV51"); if (read) read.textContent = keeperCue();
  if (phase === "ready") {
    if (elements.phaseTitle) elements.phaseTitle.textContent = "YOUR PENALTY";
    if (elements.phaseHelp) elements.phaseHelp.textContent = "Step up. Read the keeper. Pick one finish and commit.";
    if (elements.canvasPrompt) elements.canvasPrompt.textContent = "YOUR KICK · STEP UP";
  } else if (phase === "aim") {
    window.__footballLabStrikeV324?.setCurve(0);
    if (elements.phaseTitle) elements.phaseTitle.textContent = "PICK YOUR FINISH";
    if (elements.phaseHelp) elements.phaseHelp.textContent = "Choose one of six penalty zones. There is no curl or free-kick shaping.";
    if (elements.canvasPrompt) elements.canvasPrompt.textContent = attackZone ? `${attackZone.label} · START RUN-UP` : "PICK A PENALTY ZONE";
  } else if (phase === "power") {
    if (elements.phaseTitle) elements.phaseTitle.textContent = "RUN-UP";
    if (elements.phaseHelp) elements.phaseHelp.textContent = "The run-up sets the pace automatically. Your final input is composure at contact.";
    if (elements.canvasPrompt) elements.canvasPrompt.textContent = "RUN-UP · WATCH THE BALL";
  } else if (phase === "contact") {
    if (elements.phaseTitle) elements.phaseTitle.textContent = "KEEP YOUR NERVE";
    if (elements.phaseHelp) elements.phaseHelp.textContent = "Time one clean strike. Centre is perfect; panic early or late and placement degrades.";
    if (elements.canvasPrompt) elements.canvasPrompt.textContent = "TIME THE STRIKE";
    startComposureMeter();
  } else if (phase === "shooting") {
    stopComposureMeter();
    if (elements.phaseTitle) elements.phaseTitle.textContent = "COMMITTED";
    if (elements.phaseHelp) elements.phaseHelp.textContent = "Watch the keeper. Your decision is locked.";
  }
  renderScoreboard();
  requestAnimationFrame(() => renderScoreboard());
}

function clickBaseAction() {
  if (!elements.shotAction) return;
  internalAction = true;
  try { elements.shotAction.click(); } finally { internalAction = false; }
}

function stepUp() {
  if (!active || duel?.turn !== "player" || state.phase !== "ready") return;
  clearAttackSelection(); clickBaseAction();
}

function selectAttackZone(id) {
  if (!active || duel?.turn !== "player" || state.phase !== "aim") return;
  const zone = ZONES.find((item) => item.id === id); if (!zone) return;
  attackZone = zone;
  window.__footballLabStrikeV324?.setTarget(zone.x, zone.y); window.__footballLabStrikeV324?.setCurve(0);
  document.querySelectorAll("[data-v51-attack-zone]").forEach((button) => button.classList.toggle("is-selected", button.dataset.v51AttackZone === id));
  const choice = document.getElementById("duelAttackChoiceV51"); const help = document.getElementById("duelAttackHelpV51"); const run = document.getElementById("duelRunUpV51");
  if (choice) choice.textContent = zone.label; if (help) help.textContent = "Finish selected. Start the run-up when you are ready.";
  if (run) { run.disabled = false; run.hidden = false; }
  if (elements.canvasPrompt) elements.canvasPrompt.textContent = `${zone.label} · START RUN-UP`;
}

function startRunUp() {
  if (!active || duel?.turn !== "player" || state.phase !== "aim" || !attackZone) return;
  window.__footballLabStrikeV324?.setTarget(attackZone.x, attackZone.y); window.__footballLabStrikeV324?.setCurve(0);
  const run = document.getElementById("duelRunUpV51"); if (run) { run.disabled = true; run.textContent = "RUNNING UP…"; }
  window.dispatchEvent(new CustomEvent("footballlab:beginstrike"));
  setTimeout(autoLockPenaltyPower, 240);
}

function autoLockPenaltyPower() {
  if (!active || duel?.turn !== "player") return;
  if (state.phase !== "power") { if (state.phase === "aim") setTimeout(autoLockPenaltyPower, 90); return; }
  state.meterValue = 0.66; state.lastTime = performance.now(); clickBaseAction();
  if (state.phase === "contact" && state.shot) {
    const shrink = 1 - (pressure() / 100) * 0.19;
    state.shot.contactWindow = clamp((Number(state.shot.contactWindow) || 0.11) * shrink, 0.05, 0.14);
    startComposureMeter();
  }
}

function startComposureMeter() {
  if (!active || duel?.turn !== "player" || state.phase !== "contact") return;
  if (!composureStartedAt) composureStartedAt = performance.now();
  cancelAnimationFrame(composureFrame);
  const tick = (now) => {
    if (!active || duel?.turn !== "player" || state.phase !== "contact") { composureFrame = 0; return; }
    const speed = 0.0038 + (pressure() / 100) * 0.0023;
    composureValue = (Math.sin((now - composureStartedAt) * speed - Math.PI / 2) + 1) / 2;
    const marker = document.getElementById("duelComposureMarkerV51"); if (marker) marker.style.setProperty("--duel-composure-v51", String(composureValue));
    const copy = document.getElementById("duelComposureCopyV51"); if (copy) copy.textContent = Math.abs(composureValue - 0.5) < 0.08 ? "CALM" : composureValue < 0.5 ? "EARLY" : "LATE";
    composureFrame = requestAnimationFrame(tick);
  };
  composureFrame = requestAnimationFrame(tick);
}

function stopComposureMeter() { cancelAnimationFrame(composureFrame); composureFrame = 0; composureStartedAt = 0; }

function strikeFromComposure() {
  if (!active || duel?.turn !== "player" || state.phase !== "contact") return;
  stopComposureMeter(); state.meterValue = composureValue; state.lastTime = performance.now(); clickBaseAction();
}

function zoneForRoll(value) { return ZONES[Math.min(ZONES.length - 1, Math.floor(clamp(value, 0, 0.999999) * ZONES.length))]; }
function cueForZone(zone, truthful) {
  const source = truthful ? zone : ZONES[(ZONES.indexOf(zone) + 2 + kickIndex()) % ZONES.length];
  const side = source.column === "left" ? "OPENING TO HIS LEFT" : source.column === "right" ? "OPENING TO HIS RIGHT" : "SQUARING UP CENTRALLY";
  return `${side} · ${source.row === "high" ? "UPRIGHT CONTACT" : "LOW BODY SHAPE"}`;
}

function setKeeperShift(value) {
  if (!active || duel?.turn !== "cpu" || !defense || defense.committed) return;
  defense.shift = ["left", "centre", "right"].includes(value) ? value : "centre";
  document.querySelectorAll("[data-v51-shift]").forEach((button) => button.classList.toggle("is-selected", button.dataset.v51Shift === defense.shift));
  const px = defense.shift === "left" ? -38 : defense.shift === "right" ? 38 : 0;
  document.getElementById("defenseKeeperV51")?.style.setProperty("--keeper-shift-v51", `${px}px`);
}

function commitDive(id) {
  if (!active || duel?.turn !== "cpu" || !defense || !defense.runUpStarted || defense.resolved || defense.committed) return;
  const zone = ZONES.find((item) => item.id === id); if (!zone) return;
  defense.committed = zone; defense.commitAt = performance.now();
  const keeper = document.getElementById("defenseKeeperV51"); if (keeper) keeper.dataset.dive = zone.id;
  document.querySelectorAll("[data-v51-dive]").forEach((button) => button.classList.toggle("is-selected", button.dataset.v51Dive === zone.id));
  document.getElementById("defenseTimingV51").textContent = defense.strikeAt ? "REACTION COMMITTED" : "DIVE COMMITTED";
}

function chooseCounterZone(committed, roll) {
  if (!committed) return defense.plannedZone;
  const opposite = committed.column === "left" ? "right" : committed.column === "right" ? "left" : (roll < 0.5 ? "left" : "right");
  const row = roll < 0.48 ? "low" : "high";
  return ZONES.find((zone) => zone.column === opposite && zone.row === row) || defense.plannedZone;
}

function startDefenseTurn() {
  if (!active || !duel || duel.complete) return;
  stopComposureMeter(); clearTimeout(defenseTimer);
  duel.turn = "cpu"; attackZone = null;
  const cfg = difficulty(); const index = duel.opponentResults.length;
  const plannedZone = zoneForRoll(deterministic(duel.seed, 100 + index * 11));
  const truthful = deterministic(duel.seed, 101 + index * 11) < cfg.cueReliability;
  defense = { plannedZone, finalZone: plannedZone, shift: "centre", committed: null, commitAt: 0, runUpStarted: false, strikeAt: 0, resolved: false, truthful };
  ensureDefenseUi(); document.documentElement.classList.add("is-defending-v51"); delete document.documentElement.dataset.duelAttackV51;
  const overlay = document.getElementById("penaltyDefenseV51"); overlay?.classList.remove("is-shot");
  const ball = document.getElementById("defenseBallV51"); if (ball) { ball.classList.remove("is-shot"); ball.style.left = "50%"; ball.style.top = "43%"; }
  const keeper = document.getElementById("defenseKeeperV51"); if (keeper) { delete keeper.dataset.dive; keeper.style.setProperty("--keeper-shift-v51", "0px"); }
  const cpu = document.getElementById("defenseCpuV51"); cpu?.classList.remove("is-running");
  const result = document.getElementById("defenseResultV51"); if (result) { result.className = "defense-result-v51"; result.textContent = ""; }
  document.querySelectorAll("[data-v51-shift]").forEach((button) => button.classList.toggle("is-selected", button.dataset.v51Shift === "centre"));
  document.querySelectorAll("[data-v51-dive]").forEach((button) => { button.disabled = true; button.classList.remove("is-selected"); });
  document.getElementById("defenseCpuNameV51").textContent = cfg.cpuName;
  document.getElementById("defenseDifficultyV51").textContent = cfg.label;
  document.getElementById("defenseCueV51").textContent = cueForZone(plannedZone, truthful);
  document.getElementById("defenseTimingV51").textContent = "SHUFFLE, THEN READ THE RUN-UP";
  duel.lastMessage = "CPU KICK · YOU CONTROL THE GOALKEEPER"; renderScoreboard();
  defenseTimer = setTimeout(beginCpuRunUp, 650);
}

function beginCpuRunUp() {
  if (!active || duel?.turn !== "cpu" || !defense || duel.complete) return;
  defense.runUpStarted = true;
  const cfg = difficulty();
  document.getElementById("defenseCpuV51")?.classList.add("is-running");
  document.querySelectorAll("[data-v51-dive]").forEach((button) => { button.disabled = false; });
  document.getElementById("defenseTimingV51").textContent = "DIVE ON THE STRIKE";
  defenseTimer = setTimeout(cpuStrike, cfg.runUpMs);
}

function cpuStrike() {
  if (!active || duel?.turn !== "cpu" || !defense || defense.resolved) return;
  const cfg = difficulty(); defense.strikeAt = performance.now();
  const earlyLead = defense.committed ? defense.strikeAt - defense.commitAt : 0;
  const reactionRoll = deterministic(duel.seed, 150 + duel.opponentResults.length * 13);
  if (defense.committed && earlyLead > 420 && reactionRoll < cfg.reactsToEarly) defense.finalZone = chooseCounterZone(defense.committed, deterministic(duel.seed, 151 + duel.opponentResults.length * 13));
  else defense.finalZone = defense.plannedZone;
  const latePressure = pressure() / 100;
  const missRoll = deterministic(duel.seed, 152 + duel.opponentResults.length * 13);
  defense.cpuMiss = missRoll < clamp(cfg.missChance + Math.max(0, latePressure - 0.65) * 0.07, 0.02, 0.2);
  const ball = document.getElementById("defenseBallV51");
  const visual = defense.cpuMiss ? { left: deterministic(duel.seed, 153 + duel.opponentResults.length) < 0.5 ? -4 : 104, top: 34 } : {
    left: defense.finalZone.column === "left" ? 23 : defense.finalZone.column === "right" ? 77 : 50,
    top: defense.finalZone.row === "high" ? 19 : 57
  };
  if (ball) { ball.style.left = `${visual.left}%`; ball.style.top = `${visual.top}%`; ball.classList.add("is-shot"); }
  document.getElementById("defenseTimingV51").textContent = "STRIKE!";
  defenseTimer = setTimeout(resolveCpuKick, 460);
}

function keeperRating() {
  const keeper = keeperById(duel?.userKeeperId || "academy"); const stats = keeper?.stats || {};
  return ((Number(stats.reflexes) || 70) * 0.45 + (Number(stats.reading) || 70) * 0.30 + (Number(stats.reach) || 70) * 0.25) / 100;
}

function zoneMatch(committed, finalZone) {
  if (!committed) return 0;
  if (committed.id === finalZone.id) return 1;
  if (committed.column === finalZone.column) return 0.58;
  if (committed.row === finalZone.row && committed.column === "centre") return 0.34;
  return 0.08;
}

function resolveCpuKick() {
  if (!active || duel?.turn !== "cpu" || !defense || defense.resolved) return;
  defense.resolved = true; document.querySelectorAll("[data-v51-dive],[data-v51-shift]").forEach((button) => { button.disabled = true; });
  const cfg = difficulty(); let saved = false;
  if (!defense.cpuMiss && defense.committed) {
    const leadMs = defense.strikeAt - defense.commitAt;
    const timing = clamp(1 - Math.abs(leadMs - 90) / 690, 0, 1);
    const match = zoneMatch(defense.committed, defense.finalZone);
    const finalSide = defense.finalZone.column; const shiftAligned = defense.shift === finalSide ? 0.055 : defense.shift !== "centre" && finalSide !== "centre" ? -0.065 : finalSide === "centre" && defense.shift !== "centre" ? -0.05 : 0;
    const keeperBonus = (keeperRating() - 0.72) * 0.22;
    const reach = timing * 0.55 + match * 0.35 + keeperBonus + shiftAligned;
    const threshold = cfg.saveThreshold + deterministic(duel.seed, 170 + duel.opponentResults.length * 17) * 0.11;
    saved = reach >= threshold;
    defense.timingQuality = timing; defense.reach = reach; defense.threshold = threshold;
  }
  const cpuGoal = !defense.cpuMiss && !saved;
  duel.opponentResults.push(cpuGoal);
  const result = document.getElementById("defenseResultV51");
  if (result) {
    result.textContent = defense.cpuMiss ? "CPU MISSES" : saved ? "SAVED!" : "CPU SCORES";
    result.className = `defense-result-v51 is-visible ${defense.cpuMiss ? "is-miss" : saved ? "is-save" : "is-goal"}`;
  }
  duel.lastMessage = defense.cpuMiss ? "CPU MISSES · YOUR KICK NEXT" : saved ? "YOU SAVE IT · YOUR KICK NEXT" : "CPU SCORES · YOUR KICK NEXT";
  renderScoreboard();
  const decision = shootoutDecision(duel.playerResults, duel.opponentResults);
  if (decision.complete) { defenseTimer = setTimeout(() => completeDuel(decision), 760); return; }
  defenseTimer = setTimeout(returnToPlayerTurn, 880);
}

function returnToPlayerTurn() {
  if (!active || !duel || duel.complete) return;
  document.documentElement.classList.remove("is-defending-v51"); defense = null; duel.turn = "player"; clearAttackSelection(); renderScoreboard("YOUR KICK · STEP UP AND PICK A FINISH");
  if (state.phase === "ready") renderAttack();
  else requestAnimationFrame(() => { if (state.phase === "ready") renderAttack(); });
}

function handlePlayerResult() {
  if (!active || !duel || duel.turn !== "player" || duel.complete || !state.shot || state.shot.__duelCountedV51) return;
  state.shot.__duelCountedV51 = true; stopComposureMeter();
  const scored = state.shot.outcome === "GOAL"; duel.playerResults.push(scored);
  duel.lastMessage = scored ? "YOU SCORE · GET READY TO DEFEND" : state.shot.outcome === "SAVE" ? "CPU KEEPER SAVES · GET READY TO DEFEND" : "YOU MISS · GET READY TO DEFEND";
  renderScoreboard();
  const decision = shootoutDecision(duel.playerResults, duel.opponentResults);
  if (decision.complete) { completeDuel(decision); return; }
  setTimeout(startDefenseTurn, 620);
}

function commitRecord() {
  if (!duel?.complete || recordCommitted) return;
  recordCommitted = true; const value = loadRecord(); value.shootouts += 1;
  if (duel.decision?.winner === "player") { value.wins += 1; value.currentWinStreak += 1; value.bestWinStreak = Math.max(value.bestWinStreak, value.currentWinStreak); }
  else { value.losses += 1; value.currentWinStreak = 0; }
  value.longestSuddenDeath = Math.max(value.longestSuddenDeath || 0, Math.max(0, Math.max(duel.playerResults.length, duel.opponentResults.length) - REGULATION_KICKS)); saveRecord(value);
}

function completeDuel(decision) {
  if (!duel || duel.complete) return;
  clearTimeout(defenseTimer); stopComposureMeter(); duel.complete = true; duel.decision = decision; duel.turn = "complete"; commitRecord(); renderScoreboard(decision.winner === "player" ? "SHOOTOUT WON" : "SHOOTOUT LOST");
  document.documentElement.classList.remove("is-defending-v51");
  const modal = ensureResultModal(); const won = decision.winner === "player"; const sudden = Math.max(0, Math.max(duel.playerResults.length, duel.opponentResults.length) - REGULATION_KICKS);
  document.getElementById("duelResultTitleV51").textContent = won ? "SHOOTOUT WON." : "SHOOTOUT LOST.";
  document.getElementById("duelResultCopyV51").textContent = sudden ? `${won ? "You held your nerve" : "The CPU edged it"} after ${sudden} sudden-death ${sudden === 1 ? "round" : "rounds"}.` : `${won ? "You beat the CPU" : "The CPU wins"} inside the regulation shootout.`;
  document.getElementById("duelFinalYouV51").textContent = String(goalCount(duel.playerResults)); document.getElementById("duelFinalCpuV51").textContent = String(goalCount(duel.opponentResults));
  setTimeout(() => { if (active) showModal(modal); }, 340);
}

function leaveDuel(reopen) {
  hideModal(ensureResultModal()); const exit = elements.exitGame; if (exit) exit.click();
  setTimeout(() => { if (reopen) document.querySelector(".hub-mode-penalties")?.click(); }, 180);
}

function activateDuel() {
  if (!isShootout()) return;
  const legacy = window.__footballLabPenaltyShootoutV49?.snapshot?.(); if (!legacy) return;
  active = true; recordCommitted = false; attackZone = null; defense = null;
  duel = { difficultyId: legacy.difficultyId || "pro", userKeeperId: legacy.userKeeperId || "academy", playerResults: [], opponentResults: [], turn: "player", complete: false, decision: null, lastMessage: "YOUR KICK · STEP UP", seed: (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0 };
  ensureAttackUi(); ensureDefenseUi(); ensureResultModal(); setPenaltyCamera();
  document.documentElement.classList.add("penalty-duel-v51"); document.documentElement.classList.remove("is-defending-v51"); clearAttackSelection(); updatePressureUi(); renderAttack(); renderScoreboard();
}

function cleanupDuel() {
  clearTimeout(defenseTimer); stopComposureMeter(); active = false; duel = null; defense = null; attackZone = null; recordCommitted = false;
  const root = document.documentElement; root.classList.remove("penalty-duel-v51", "is-defending-v51", "is-high-pressure-v51"); delete root.dataset.duelAttackV51;
  hideModal(ensureResultModal());
}

function blockLegacyPointer(event) {
  if (!active || !isShootout() || internalAction) return;
  const target = event.target instanceof Element ? event.target.closest("#gameCanvas,#shotAction") : null; if (!target) return;
  event.preventDefault(); event.stopImmediatePropagation();
}

function handleKeys(event) {
  if (!active || !isShootout()) return;
  const key = event.key.toLowerCase();
  if (duel?.turn === "player") {
    if (state.phase === "ready" && (key === " " || key === "enter")) { event.preventDefault(); event.stopImmediatePropagation(); stepUp(); return; }
    if (state.phase === "aim") {
      const number = Number(key); if (number >= 1 && number <= ZONES.length) { event.preventDefault(); event.stopImmediatePropagation(); selectAttackZone(ZONES[number - 1].id); return; }
      if (key === " " || key === "enter") { event.preventDefault(); event.stopImmediatePropagation(); startRunUp(); return; }
    }
    if (state.phase === "contact" && (key === " " || key === "enter")) { event.preventDefault(); event.stopImmediatePropagation(); strikeFromComposure(); return; }
  } else if (duel?.turn === "cpu" && defense?.runUpStarted) {
    const map = { q: "high-left", w: "high-centre", e: "high-right", a: "low-left", s: "low-centre", d: "low-right" };
    if (map[key]) { event.preventDefault(); event.stopImmediatePropagation(); commitDive(map[key]); return; }
  }
  if ([" ", "enter", "arrowleft", "arrowright", "arrowup", "arrowdown", "q", "w", "e", "a", "s", "d"].includes(key)) { event.preventDefault(); event.stopImmediatePropagation(); }
}

function publishRelease() {
  const old = window.__footballLabReleaseV490 || window.__footballLabReleaseV480; if (!old) return false;
  const release = Object.freeze({ ...old, build: BUILD, penaltyExperience: "full-player-vs-cpu-alternating-duel", penaltyAttack: "six-zone-runup-single-composure-strike", penaltyDefense: "user-controlled-goalkeeper-cpu-kicks", penaltyCpuDifficulty: "academy-pro-elite-world-class-behavioural", penaltyCpuBehaviour: "runup-cues-disguise-early-keeper-read", penaltyKeeperControl: "shuffle-plus-six-zone-dive-timing", penaltyOpponentSimulation: "retired-from-live-v51", cacheGeneration: BUILD });
  window.__footballLabReleaseV510 = release; document.documentElement.dataset.footballLabBuild = BUILD;
  const badge = document.querySelector(".build-badge-v22"); if (badge) { badge.textContent = "V51.0"; badge.title = `Football Lab build ${BUILD}`; }
  const version = document.querySelector(".settings-version-v22 strong"); if (version) version.textContent = BUILD;
  return true;
}

ensureStylesheet(); enhanceSetup(); ensureAttackUi(); ensureDefenseUi(); ensureResultModal();
document.addEventListener("pointerdown", blockLegacyPointer, { capture: true, passive: false });
window.addEventListener("keydown", handleKeys, { capture: true });

window.addEventListener("footballlab:trainingstart", () => queueMicrotask(() => queueMicrotask(() => { if (isShootout()) activateDuel(); else cleanupDuel(); })));
window.addEventListener("footballlab:phasechange", (event) => {
  if (!active || !isShootout() || !duel) return;
  const phase = event.detail?.phase;
  if (phase === "result" && duel.turn === "player") handlePlayerResult();
  else if (phase === "ready" && duel.turn === "player" && !duel.complete) { clearAttackSelection(); renderAttack(); }
  else if (duel.turn === "player" && !duel.complete) renderAttack();
  queueMicrotask(() => queueMicrotask(() => { if (active) renderScoreboard(); }));
});

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest("#exitGame,#brandButton") : null; if (!target || !active) return;
  setTimeout(cleanupDuel, 0);
}, true);

const releaseTimer = setInterval(() => { if (publishRelease()) clearInterval(releaseTimer); }, 60); setTimeout(() => clearInterval(releaseTimer), 10000);

window.__footballLabPenaltyDuelV51 = Object.freeze({
  build: BUILD,
  shouldInterceptLegacyResult: () => active && isShootout(),
  difficulties: Object.fromEntries(Object.entries(DIFFICULTIES).map(([id, value]) => [id, { ...value }])),
  zones: ZONES.map((zone) => ({ ...zone })),
  goalkeeperControl: "shuffle-plus-six-zone-timed-dive",
  cpuRepliesArePlayable: true,
  attackFlow: "placement-runup-composure",
  snapshot: () => duel ? { active, turn: duel.turn, difficultyId: duel.difficultyId, userKeeperId: duel.userKeeperId, playerResults: [...duel.playerResults], opponentResults: [...duel.opponentResults], pressure: pressure(), attackZone: attackZone?.id || null, phase: state.phase, defense: defense ? { plannedZone: defense.plannedZone?.id || null, finalZone: defense.finalZone?.id || null, shift: defense.shift, committed: defense.committed?.id || null, runUpStarted: defense.runUpStarted, strikeAt: defense.strikeAt, resolved: defense.resolved, cpuMiss: Boolean(defense.cpuMiss), timingQuality: defense.timingQuality ?? null } : null, complete: duel.complete, winner: duel.decision?.winner || null } : null
});
