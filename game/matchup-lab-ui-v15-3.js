import {
  state, elements, createShot, syncStage, setStageWind, setPhase, showScreen,
  renderHud, closeModal, MAX_LIVES
} from "./core-v6.js?v=7";
import { SCENARIOS } from "./world-v7.js?v=7";
import { KICKERS, selectCharacter, activeCharacter } from "./characters-v13.js?v=13";
import { GOALKEEPERS, WALLS, keeperForStage, wallForStage } from "./lab-matchups-v15-3.js?v=153";

const UNLOCK_KEY = "footballLabMatchupLabUnlockedV153";
let previousCharacterId = null;
let lastDiagnosticIndex = 0;
let stats = createStats();

function createStats() {
  return {
    shots: 0,
    goals: 0,
    saves: 0,
    wallBlocks: 0,
    frameHits: 0,
    misses: 0,
    speedTotal: 0,
    speedCount: 0,
    wallClearanceTotal: 0,
    wallClearanceCount: 0,
    keeperMarginTotal: 0,
    keeperMarginCount: 0,
    last: null
  };
}

function injectStyles() {
  if (document.getElementById("matchupLabStylesV153")) return;
  const style = document.createElement("style");
  style.id = "matchupLabStylesV153";
  style.textContent = `
    .matchup-lab-launch-v153 { position:fixed; left:16px; bottom:16px; z-index:9990; border:1px solid rgba(218,254,77,.4); border-radius:10px; padding:9px 12px; background:rgba(3,8,5,.94); color:#dafe4d; font:900 9px/1 system-ui; letter-spacing:.11em; cursor:pointer; box-shadow:0 10px 30px rgba(0,0,0,.35); }
    .matchup-lab-modal-v153 { position:fixed; inset:0; z-index:9995; display:none; place-items:center; padding:18px; background:rgba(0,0,0,.78); backdrop-filter:blur(8px); }
    .matchup-lab-modal-v153.is-open { display:grid; }
    .matchup-lab-panel-v153 { width:min(980px,96vw); max-height:92vh; overflow:auto; border:1px solid rgba(218,254,77,.24); border-radius:18px; padding:22px; background:#07110b; color:#f4f8f2; box-shadow:0 28px 90px rgba(0,0,0,.65); }
    .matchup-lab-head-v153 { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; margin-bottom:18px; }
    .matchup-lab-head-v153 span { color:#dafe4d; font:900 9px/1 system-ui; letter-spacing:.12em; }
    .matchup-lab-head-v153 h2 { margin:7px 0 5px; font:1000 clamp(24px,4vw,38px)/.95 system-ui; }
    .matchup-lab-head-v153 p { margin:0; max-width:660px; color:rgba(235,243,232,.6); font:650 11px/1.45 system-ui; }
    .matchup-lab-close-v153 { border:0; background:transparent; color:#fff; font:800 24px/1 system-ui; cursor:pointer; }
    .matchup-lab-grid-v153 { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
    .matchup-lab-field-v153 { display:grid; gap:7px; padding:12px; border:1px solid rgba(255,255,255,.08); border-radius:12px; background:rgba(255,255,255,.025); }
    .matchup-lab-field-v153 label { color:rgba(235,243,232,.52); font:850 8px/1 system-ui; letter-spacing:.09em; }
    .matchup-lab-field-v153 select { width:100%; border:1px solid rgba(255,255,255,.12); border-radius:9px; padding:10px; background:#0d1b13; color:#f6faf4; font:750 11px system-ui; }
    .matchup-lab-actions-v153 { display:flex; flex-wrap:wrap; gap:9px; margin:16px 0; }
    .matchup-lab-actions-v153 button { border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:11px 14px; background:#112119; color:#eef5eb; font:900 9px/1 system-ui; letter-spacing:.07em; cursor:pointer; }
    .matchup-lab-actions-v153 button.is-primary { border-color:#dafe4d; background:#dafe4d; color:#07110b; }
    .matchup-lab-stats-v153 { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:8px; }
    .matchup-lab-stat-v153 { padding:11px; border:1px solid rgba(255,255,255,.07); border-radius:11px; background:rgba(255,255,255,.025); }
    .matchup-lab-stat-v153 span { display:block; color:rgba(235,243,232,.45); font:800 7px/1 system-ui; letter-spacing:.08em; }
    .matchup-lab-stat-v153 strong { display:block; margin-top:6px; color:#fff; font:1000 18px/1 system-ui; }
    .matchup-lab-analysis-v153 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:8px; }
    .matchup-lab-analysis-v153 div { padding:11px; border-radius:11px; background:rgba(218,254,77,.045); border:1px solid rgba(218,254,77,.1); }
    .matchup-lab-analysis-v153 span { display:block; color:rgba(235,243,232,.48); font:800 7px/1 system-ui; }
    .matchup-lab-analysis-v153 strong { display:block; margin-top:5px; color:#dafe4d; font:900 11px/1.2 system-ui; }
    .matchup-lab-last-v153 { margin-top:10px; padding:12px; border-radius:11px; background:rgba(0,0,0,.24); color:rgba(235,243,232,.7); font:700 10px/1.45 system-ui; }
    .matchup-lab-hint-v153 { margin-top:12px; color:rgba(235,243,232,.42); font:700 9px/1.4 system-ui; }
    @media (max-width:820px) { .matchup-lab-grid-v153 { grid-template-columns:1fr 1fr; } .matchup-lab-stats-v153 { grid-template-columns:repeat(3,1fr); } }
    @media (max-width:560px) { .matchup-lab-grid-v153,.matchup-lab-analysis-v153 { grid-template-columns:1fr; } }
  `;
  document.head.appendChild(style);
}

function option(value, label) {
  return `<option value="${value}">${label}</option>`;
}

function ensureUi() {
  let launch = document.querySelector(".matchup-lab-launch-v153");
  if (!launch) {
    launch = document.createElement("button");
    launch.type = "button";
    launch.className = "matchup-lab-launch-v153";
    launch.textContent = "MATCHUP LAB";
    launch.addEventListener("click", openLab);
    document.body.appendChild(launch);
  }

  let modal = document.querySelector(".matchup-lab-modal-v153");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.className = "matchup-lab-modal-v153";
  modal.innerHTML = `
    <section class="matchup-lab-panel-v153" role="dialog" aria-modal="true" aria-label="Matchup Lab">
      <div class="matchup-lab-head-v153">
        <div><span>DEVELOPMENT TOOL · V15.3</span><h2>MATCHUP LAB</h2><p>Freeze one scenario and repeat the exact kicker, goalkeeper, wall and wind combination. Lab attempts do not consume lives, add score or advance the stage.</p></div>
        <button class="matchup-lab-close-v153" type="button" aria-label="Close Matchup Lab">×</button>
      </div>
      <div class="matchup-lab-grid-v153">
        <div class="matchup-lab-field-v153"><label>SCENARIO</label><select data-lab-stage>${SCENARIOS.map((stage, index) => option(index, `STAGE ${index + 1} · ${stage.distanceYards} YDS · ${stage.name}`)).join("")}</select></div>
        <div class="matchup-lab-field-v153"><label>KICKER</label><select data-lab-kicker>${KICKERS.map((player) => option(player.id, `${player.name} · ${player.role}`)).join("")}</select></div>
        <div class="matchup-lab-field-v153"><label>GOALKEEPER</label><select data-lab-keeper>${option("", "STAGE DEFAULT")}${GOALKEEPERS.map((keeper) => option(keeper.id, `${keeper.name} · ${keeper.role}`)).join("")}</select></div>
        <div class="matchup-lab-field-v153"><label>WALL</label><select data-lab-wall>${option("", "STAGE DEFAULT")}${WALLS.map((wall) => option(wall.id, `${wall.name} · ${wall.role}`)).join("")}</select></div>
        <div class="matchup-lab-field-v153"><label>DEFENSIVE TIER</label><select data-lab-tier>${[1,2,3,4].map((tier) => option(tier, `TIER ${tier}`)).join("")}</select></div>
        <div class="matchup-lab-field-v153"><label>WIND</label><select data-lab-wind>${option("stage", "SCENARIO WIND")}${option(0, "CALM")}${option(-3.5, "3.5 M/S LEFT")}${option(-2.5, "2.5 M/S LEFT")}${option(-1.5, "1.5 M/S LEFT")}${option(1.5, "1.5 M/S RIGHT")}${option(2.5, "2.5 M/S RIGHT")}${option(3.5, "3.5 M/S RIGHT")}</select></div>
      </div>
      <div class="matchup-lab-actions-v153">
        <button class="is-primary" type="button" data-lab-apply>APPLY AND TEST</button>
        <button type="button" data-lab-reset>RESET RESULTS</button>
        <button type="button" data-lab-copy>COPY RESULTS</button>
        <button type="button" data-lab-exit>EXIT LAB</button>
      </div>
      <div class="matchup-lab-stats-v153">
        ${["SHOTS","GOAL RATE","SAVES","WALL","FRAME","MISSES"].map((label, index) => `<div class="matchup-lab-stat-v153"><span>${label}</span><strong data-lab-stat="${index}">0</strong></div>`).join("")}
      </div>
      <div class="matchup-lab-analysis-v153">
        <div><span>AVERAGE PACE</span><strong data-lab-speed>—</strong></div>
        <div><span>AVERAGE WALL CLEARANCE</span><strong data-lab-clearance>—</strong></div>
        <div><span>AVERAGE KEEPER MARGIN</span><strong data-lab-margin>—</strong></div>
      </div>
      <div class="matchup-lab-last-v153" data-lab-last>No lab shots recorded.</div>
      <div class="matchup-lab-hint-v153">Shortcut: <strong>Shift + L</strong>. A goal rate around 55–75% with deliberate use of the recommended route is the provisional balance target, not an automatic pass condition.</div>
    </section>`;
  document.body.appendChild(modal);

  modal.querySelector(".matchup-lab-close-v153").addEventListener("click", closeLab);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeLab(); });
  modal.querySelector("[data-lab-apply]").addEventListener("click", applyLab);
  modal.querySelector("[data-lab-reset]").addEventListener("click", resetStats);
  modal.querySelector("[data-lab-copy]").addEventListener("click", copyResults);
  modal.querySelector("[data-lab-exit]").addEventListener("click", exitLab);
  return modal;
}

function isUnlocked() {
  try {
    return localStorage.getItem(UNLOCK_KEY) === "1" || new URLSearchParams(location.search).has("lab");
  } catch {
    return new URLSearchParams(location.search).has("lab");
  }
}

function unlockLab() {
  try { localStorage.setItem(UNLOCK_KEY, "1"); } catch { /* in-memory access remains available */ }
  ensureUi();
}

function openLab() {
  unlockLab();
  const modal = ensureUi();
  modal.classList.add("is-open");
  const stageSelect = modal.querySelector("[data-lab-stage]");
  stageSelect.value = String(state.matchupLab?.stageIndex ?? state.stage ?? 0);
  modal.querySelector("[data-lab-kicker]").value = state.matchupLab?.kickerId || activeCharacter().id;
  modal.querySelector("[data-lab-keeper]").value = state.matchupLab?.keeperId || "";
  modal.querySelector("[data-lab-wall]").value = state.matchupLab?.wallId || "";
  modal.querySelector("[data-lab-tier]").value = String(state.matchupLab?.tier || 1);
  const wind = state.matchupLab?.wind;
  modal.querySelector("[data-lab-wind]").value = Number.isFinite(wind) ? String(wind * 10) : "stage";
  renderStats();
}

function closeLab() {
  document.querySelector(".matchup-lab-modal-v153")?.classList.remove("is-open");
}

function clearRuntime() {
  clearTimeout(state.presentationTimeout);
  clearTimeout(state.impactTimer);
  clearTimeout(state.resultTimeout);
  state.presentationTimeout = null;
  state.impactTimer = null;
  state.resultTimeout = null;
  state.presentation = null;
  state.animation = null;
  state.finishedAnimationId = null;
  state.pendingStageAdvance = false;
  elements.resultBanner.textContent = "";
  elements.resultBanner.className = "result-banner";
}

function applyLab() {
  const modal = ensureUi();
  const stageIndex = Number(modal.querySelector("[data-lab-stage]").value) || 0;
  const kickerId = modal.querySelector("[data-lab-kicker]").value;
  const keeperId = modal.querySelector("[data-lab-keeper]").value || null;
  const wallId = modal.querySelector("[data-lab-wall]").value || null;
  const tier = Number(modal.querySelector("[data-lab-tier]").value) || 1;
  const windChoice = modal.querySelector("[data-lab-wind]").value;
  const wind = windChoice === "stage" ? null : Number(windChoice) / 10;

  if (!state.matchupLab?.active) previousCharacterId = activeCharacter().id;
  selectCharacter(kickerId);
  state.matchupLab = { active: true, stageIndex, kickerId, keeperId, wallId, tier, wind };
  state.stage = stageIndex;
  Object.assign(state, {
    score: 0,
    streak: 0,
    bestRunStreak: 0,
    misses: 0,
    maxLives: MAX_LIVES
  });
  clearRuntime();
  syncStage();
  state.shot = createShot();
  setStageWind();
  if (Number.isFinite(wind)) state.stageWind = wind;
  [elements.howModal, elements.previewModal, elements.gameOverModal].forEach(closeModal);
  elements.powerReadout.textContent = "—";
  elements.aimReadout.textContent = "—";
  elements.curveReadout.textContent = "—";
  setPhase("ready");
  showScreen("game");
  renderHud();

  const keeper = keeperForStage(stageIndex);
  const wall = wallForStage(stageIndex);
  state.keeperId = keeper.id;
  state.wallId = wall.id;
  window.dispatchEvent(new CustomEvent("footballlab:keeperchange", { detail: keeper }));
  window.dispatchEvent(new CustomEvent("footballlab:wallchange", { detail: wall }));
  window.dispatchEvent(new CustomEvent("footballlab:labchange", { detail: state.matchupLab }));
  requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  resetStats();
  closeLab();
}

function exitLab() {
  clearRuntime();
  state.matchupLab = { active: false };
  if (previousCharacterId) selectCharacter(previousCharacterId);
  previousCharacterId = null;
  setPhase("ready");
  showScreen("menu");
  renderHud();
  window.dispatchEvent(new CustomEvent("footballlab:labchange", { detail: state.matchupLab }));
  closeLab();
}

function resetStats() {
  stats = createStats();
  const records = window.__footballLabDiagnostics || [];
  lastDiagnosticIndex = records.length;
  window.__footballLabMatchupStats = stats;
  renderStats();
}

function percentage(value, total) {
  return total ? `${Math.round((value / total) * 100)}%` : "0%";
}

function renderStats() {
  const modal = document.querySelector(".matchup-lab-modal-v153");
  if (!modal) return;
  const values = [
    stats.shots,
    percentage(stats.goals, stats.shots),
    stats.saves,
    stats.wallBlocks,
    stats.frameHits,
    stats.misses
  ];
  modal.querySelectorAll("[data-lab-stat]").forEach((node, index) => { node.textContent = values[index]; });
  modal.querySelector("[data-lab-speed]").textContent = stats.speedCount ? `${(stats.speedTotal / stats.speedCount).toFixed(1)} m/s` : "—";
  modal.querySelector("[data-lab-clearance]").textContent = stats.wallClearanceCount ? `${(stats.wallClearanceTotal / stats.wallClearanceCount).toFixed(2)} m` : "—";
  modal.querySelector("[data-lab-margin]").textContent = stats.keeperMarginCount ? (stats.keeperMarginTotal / stats.keeperMarginCount).toFixed(3) : "—";
  modal.querySelector("[data-lab-last]").textContent = stats.last
    ? `${stats.last.outcome} · ${stats.last.powerPercent}% power · ${stats.last.speedMps.toFixed(1)} m/s · ${stats.last.wallLane || "N/A"} wall lane · ${stats.last.reason || "Outcome recorded."}`
    : "No lab shots recorded.";
}

function addRecord(record) {
  stats.shots += 1;
  stats.goals += record.outcome === "GOAL" ? 1 : 0;
  stats.saves += record.outcome === "SAVE" ? 1 : 0;
  stats.wallBlocks += record.outcome === "WALL" ? 1 : 0;
  stats.frameHits += ["POST", "BAR"].includes(record.outcome) ? 1 : 0;
  stats.misses += record.outcome === "MISS" ? 1 : 0;
  if (Number.isFinite(record.speedMps)) {
    stats.speedTotal += record.speedMps;
    stats.speedCount += 1;
  }
  if (Number.isFinite(record.wallClearanceMetres)) {
    stats.wallClearanceTotal += record.wallClearanceMetres;
    stats.wallClearanceCount += 1;
  }
  if (Number.isFinite(record.keeperReachScore) && Number.isFinite(record.keeperThreshold)) {
    stats.keeperMarginTotal += record.keeperReachScore - record.keeperThreshold;
    stats.keeperMarginCount += 1;
  }
  stats.last = record;
  window.__footballLabMatchupStats = stats;
  renderStats();
}

function pollDiagnostics() {
  const records = window.__footballLabDiagnostics || [];
  if (lastDiagnosticIndex > records.length) lastDiagnosticIndex = 0;
  if (state.matchupLab?.active) {
    while (lastDiagnosticIndex < records.length) addRecord(records[lastDiagnosticIndex++]);
  } else {
    lastDiagnosticIndex = records.length;
  }
}

async function copyResults() {
  const config = state.matchupLab;
  const summary = [
    "FOOTBALL LAB · MATCHUP TEST",
    `Stage: ${(config?.stageIndex ?? state.stage) + 1}`,
    `Kicker: ${activeCharacter().name}`,
    `Goalkeeper: ${keeperForStage(config?.stageIndex ?? state.stage).name}`,
    `Wall: ${wallForStage(config?.stageIndex ?? state.stage).name}`,
    `Shots: ${stats.shots}`,
    `Goal rate: ${percentage(stats.goals, stats.shots)}`,
    `Saves: ${stats.saves}`,
    `Wall blocks: ${stats.wallBlocks}`,
    `Frame hits: ${stats.frameHits}`,
    `Misses: ${stats.misses}`
  ].join("\n");
  try {
    await navigator.clipboard.writeText(summary);
    const button = document.querySelector("[data-lab-copy]");
    if (button) {
      const previous = button.textContent;
      button.textContent = "COPIED";
      setTimeout(() => { button.textContent = previous; }, 900);
    }
  } catch {
    console.info(summary);
  }
}

injectStyles();
if (isUnlocked()) ensureUi();
window.addEventListener("keydown", (event) => {
  if (event.shiftKey && event.code === "KeyL") {
    event.preventDefault();
    unlockLab();
    const modal = ensureUi();
    modal.classList.contains("is-open") ? closeLab() : openLab();
  }
});
setInterval(pollDiagnostics, 250);
window.__footballLabOpenMatchupLab = openLab;
