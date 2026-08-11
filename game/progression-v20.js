import {
  formatScore,
  profile,
  profileLevel,
  saveProfile,
  state,
  elements
} from "./core-v6.js?v=32.2";

const MEDALS = Object.freeze([
  Object.freeze({ id: "ELITE", label: "ELITE", threshold: 25000, xpBonus: 400, rank: 4 }),
  Object.freeze({ id: "GOLD", label: "GOLD", threshold: 16000, xpBonus: 250, rank: 3 }),
  Object.freeze({ id: "SILVER", label: "SILVER", threshold: 9000, xpBonus: 125, rank: 2 }),
  Object.freeze({ id: "BRONZE", label: "BRONZE", threshold: 4000, xpBonus: 50, rank: 1 }),
  Object.freeze({ id: "ROOKIE", label: "ROOKIE", threshold: 0, xpBonus: 0, rank: 0 })
]);

const TITLES = Object.freeze([
  Object.freeze({ level: 8, title: "ELITE FINISHER" }),
  Object.freeze({ level: 5, title: "FREE-KICK ARTIST" }),
  Object.freeze({ level: 3, title: "DEAD-BALL SPECIALIST" }),
  Object.freeze({ level: 2, title: "SET-PIECE STUDENT" }),
  Object.freeze({ level: 1, title: "THE PROSPECT" })
]);

function integer(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

export function medalForScore(score) {
  const safeScore = integer(score);
  return MEDALS.find((medal) => safeScore >= medal.threshold) || MEDALS[MEDALS.length - 1];
}

export function titleForLevel(level) {
  const safeLevel = Math.max(1, integer(level));
  return TITLES.find((entry) => safeLevel >= entry.level)?.title || TITLES[TITLES.length - 1].title;
}

export function scoreComponentsForShot(shot, context = {}) {
  const goal = shot?.outcome === "GOAL";
  const stageIndex = integer(context.stageIndex ?? state.stage);
  const distanceYards = Math.max(0, Number(context.distanceYards ?? state.currentStage?.distanceYards ?? 20) || 0);
  const streak = integer(context.streak ?? state.streak);
  const wind = Math.max(-0.36, Math.min(0.36, Number(context.wind ?? state.stageWind) || 0));
  const quality = Math.max(0, Math.min(1, Number(shot?.strikeQuality) || 0));

  const components = {
    baseGoal: goal ? 1000 : 0,
    stage: goal ? stageIndex * 85 : 0,
    streak: goal ? Math.max(0, streak - 1) * 125 : 0,
    strike: goal ? (quality >= 0.9 ? 350 : quality >= 0.68 ? 175 : 0) : 0,
    distance: goal ? Math.round(Math.max(0, distanceYards - 20) * 34) : 0,
    topCorner: goal && shot?.topCorner ? 700 : 0,
    wind: goal ? Math.round(Math.abs(wind) * 1700) : 0
  };
  const total = Object.values(components).reduce((sum, value) => sum + integer(value), 0);
  return Object.freeze({ ...components, total });
}

export function xpForRun(stats, medal, isPersonalBest = false, firstPersonalBest = false) {
  const stageReached = integer(stats?.stageReached);
  const goals = integer(stats?.goals);
  const perfectStrikes = integer(stats?.perfectStrikes);
  const topCorners = integer(stats?.topCorners);
  const personalBestBonus = isPersonalBest ? (firstPersonalBest ? 50 : 100) : 0;
  return integer(
    100
    + stageReached * 10
    + goals * 35
    + perfectStrikes * 20
    + topCorners * 30
    + integer(medal?.xpBonus)
    + personalBestBonus
  );
}

function loadStyles() {
  if (document.querySelector('link[data-football-lab-progression="v20"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./game/progression-v20.css?v=20";
  link.dataset.footballLabProgression = "v20";
  document.head.appendChild(link);
}

function createInterface() {
  const gameStats = document.querySelector(".game-stats");
  if (gameStats && !document.querySelector("#pbChaseV20")) {
    const chase = document.createElement("div");
    chase.id = "pbChaseV20";
    chase.className = "pb-chase-v20";
    chase.innerHTML = '<span id="pbChaseLabelV20">PB TARGET</span><strong id="pbChaseValueV20">—</strong>';
    gameStats.appendChild(chase);
  }

  const records = document.querySelector(".profile-records");
  if (records && !document.querySelector("#profileMedalV20")) {
    records.insertAdjacentHTML("beforeend", `
      <div><span>BEST MEDAL</span><strong id="profileMedalV20">ROOKIE</strong></div>
      <div><span>TOTAL GOALS</span><strong id="profileGoalsV20">0</strong></div>
    `);
  }

  const actions = document.querySelector("#gameOverModal .modal-actions");
  if (actions && !document.querySelector("#runSummaryV20")) {
    actions.insertAdjacentHTML("beforebegin", `
      <section class="run-summary-v20" id="runSummaryV20" aria-label="Run performance summary">
        <div class="run-grade-v20">
          <div><span>RUN GRADE</span><strong id="runMedalV20">ROOKIE</strong></div>
          <div><span>XP EARNED</span><strong id="runXpV20">+0</strong></div>
        </div>
        <div class="run-stats-v20">
          <div><span>GOALS</span><strong id="runGoalsV20">0</strong></div>
          <div><span>ACCURACY</span><strong id="runAccuracyV20">0%</strong></div>
          <div><span>PERFECT</span><strong id="runPerfectV20">0</strong></div>
          <div><span>TOP CORNERS</span><strong id="runCornersV20">0</strong></div>
          <div><span>KEEPER SAVES</span><strong id="runSavesV20">0</strong></div>
          <div><span>WALL BLOCKS</span><strong id="runWallsV20">0</strong></div>
        </div>
        <div class="run-integrity-v20" id="runIntegrityV20">SCORE VERIFIED</div>
        <div class="run-unlock-v20" id="runUnlockV20"></div>
      </section>
    `);
  }
}

function ensureProfileShape() {
  profile.totalRuns = integer(profile.totalRuns);
  profile.totalGoals = integer(profile.totalGoals);
  profile.bestMedal = MEDALS.some((medal) => medal.id === profile.bestMedal) ? profile.bestMedal : "ROOKIE";
  profile.medals = profile.medals && typeof profile.medals === "object" ? profile.medals : {};
  for (const medal of MEDALS) profile.medals[medal.id] = integer(profile.medals[medal.id]);
}

function currentTitle() {
  return titleForLevel(profileLevel());
}

function renderExtendedProfile() {
  ensureProfileShape();
  const title = currentTitle();
  const titleElement = document.querySelector(".player-card-top h2");
  if (titleElement) titleElement.textContent = title;
  const medal = document.querySelector("#profileMedalV20");
  const goals = document.querySelector("#profileGoalsV20");
  if (medal) medal.textContent = profile.bestMedal;
  if (goals) goals.textContent = formatScore(profile.totalGoals);
}

function createRunStats() {
  return {
    shots: 0,
    goals: 0,
    perfectStrikes: 0,
    cleanStrikes: 0,
    topCorners: 0,
    saves: 0,
    wallBlocks: 0,
    posts: 0,
    bars: 0,
    misses: 0,
    stageReached: 1,
    bestStreak: 0,
    integrityFailures: 0,
    pointsBySource: {
      baseGoal: 0,
      stage: 0,
      streak: 0,
      strike: 0,
      distance: 0,
      topCorner: 0,
      wind: 0
    }
  };
}

function cloneStats(stats) {
  return JSON.parse(JSON.stringify(stats));
}

let runActive = false;
let runStats = createRunStats();
let processedShots = new WeakSet();
let bestAtRunStart = integer(profile.highScore);
let xpAtRunStart = integer(profile.xp);
let titleAtRunStart = currentTitle();
let previousScreen = state.screen;
let previousModalOpen = elements.gameOverModal.classList.contains("is-open");
let previousScore = -1;

function beginRun() {
  runActive = true;
  runStats = createRunStats();
  processedShots = new WeakSet();
  bestAtRunStart = integer(profile.highScore);
  xpAtRunStart = integer(profile.xp);
  titleAtRunStart = currentTitle();
  previousScore = -1;
  window.__footballLabRunStatsV20 = cloneStats(runStats);
  updatePersonalBestChase();
}

function enforceScoreIntegrity(shot) {
  const expected = scoreComponentsForShot(shot, {
    stageIndex: state.stage,
    distanceYards: state.currentStage?.distanceYards,
    streak: state.streak,
    wind: state.stageWind
  });
  const recorded = integer(shot.points);
  const delta = expected.total - recorded;

  if (delta !== 0) {
    state.score = Math.max(0, integer(state.score) + delta);
    shot.points = expected.total;
    if (state.presentation?.breakdown) state.presentation.breakdown.points = expected.total;
    elements.scoreValue.textContent = formatScore(state.score);
    runStats.integrityFailures += 1;
  }

  shot.scoreBreakdown = expected;
  return expected;
}

function processShot(shot) {
  if (!runActive || !shot || processedShots.has(shot)) return;
  processedShots.add(shot);
  const receipt = enforceScoreIntegrity(shot);

  runStats.shots += 1;
  runStats.stageReached = Math.max(runStats.stageReached, integer(state.stage) + 1);
  runStats.bestStreak = Math.max(runStats.bestStreak, integer(state.bestRunStreak));
  if ((Number(shot.strikeQuality) || 0) >= 0.9) runStats.perfectStrikes += 1;
  else if ((Number(shot.strikeQuality) || 0) >= 0.68) runStats.cleanStrikes += 1;
  if (shot.topCorner) runStats.topCorners += 1;

  const outcomeKey = {
    GOAL: "goals",
    SAVE: "saves",
    WALL: "wallBlocks",
    POST: "posts",
    BAR: "bars",
    MISS: "misses"
  }[shot.outcome];
  if (outcomeKey) runStats[outcomeKey] += 1;

  for (const key of Object.keys(runStats.pointsBySource)) {
    runStats.pointsBySource[key] += integer(receipt[key]);
  }

  window.__footballLabRunStatsV20 = cloneStats(runStats);
  window.__footballLabLastScoreReceiptV20 = receipt;
  window.dispatchEvent(new CustomEvent("footballlab:runupdate", {
    detail: { stats: cloneStats(runStats), score: integer(state.score), receipt }
  }));
  updatePersonalBestChase();
}

function updatePersonalBestChase() {
  const label = document.querySelector("#pbChaseLabelV20");
  const value = document.querySelector("#pbChaseValueV20");
  const score = integer(state.score);
  if (!label || !value) return;

  if (bestAtRunStart <= 0) {
    label.textContent = "FIRST RECORD";
    value.textContent = formatScore(score);
    value.dataset.status = "active";
    return;
  }
  if (score > bestAtRunStart) {
    label.textContent = "NEW PB";
    value.textContent = `+${formatScore(score - bestAtRunStart)}`;
    value.dataset.status = "ahead";
    return;
  }
  label.textContent = "TO BEAT PB";
  value.textContent = formatScore(bestAtRunStart + 1 - score);
  value.dataset.status = "behind";
}

function medalById(id) {
  return MEDALS.find((medal) => medal.id === id) || MEDALS[MEDALS.length - 1];
}

function updateBestMedal(medal) {
  const previous = medalById(profile.bestMedal);
  if (medal.rank > previous.rank) profile.bestMedal = medal.id;
}

function renderRunSummary(summary) {
  const accuracy = summary.stats.shots > 0
    ? Math.round(summary.stats.goals / summary.stats.shots * 100)
    : 0;
  const values = {
    runMedalV20: summary.medal.label,
    runXpV20: `+${formatScore(summary.xpEarned)}`,
    runGoalsV20: String(summary.stats.goals),
    runAccuracyV20: `${accuracy}%`,
    runPerfectV20: String(summary.stats.perfectStrikes),
    runCornersV20: String(summary.stats.topCorners),
    runSavesV20: String(summary.stats.saves),
    runWallsV20: String(summary.stats.wallBlocks)
  };
  for (const [id, text] of Object.entries(values)) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  const integrity = document.querySelector("#runIntegrityV20");
  if (integrity) {
    integrity.textContent = summary.stats.integrityFailures === 0
      ? "SCORE VERIFIED · EVERY BONUS ACCOUNTED FOR"
      : `SCORE CORRECTED · ${summary.stats.integrityFailures} MISMATCH${summary.stats.integrityFailures === 1 ? "" : "ES"}`;
    integrity.dataset.status = summary.stats.integrityFailures === 0 ? "verified" : "corrected";
  }

  const unlock = document.querySelector("#runUnlockV20");
  if (unlock) {
    unlock.textContent = summary.unlockedTitle
      ? `TITLE UNLOCKED · ${summary.unlockedTitle}`
      : `CURRENT TITLE · ${summary.currentTitle}`;
  }

  const summaryElement = document.querySelector("#runSummaryV20");
  if (summaryElement) summaryElement.dataset.medal = summary.medal.id;
}

function finaliseRun() {
  if (!runActive) return;
  runActive = false;
  const score = integer(state.score);
  const medal = medalForScore(score);
  const newPersonalBest = score > bestAtRunStart;
  const xpEarned = xpForRun(runStats, medal, newPersonalBest, bestAtRunStart === 0);

  ensureProfileShape();
  profile.xp = xpAtRunStart + xpEarned;
  profile.totalRuns += 1;
  profile.totalGoals += runStats.goals;
  profile.medals[medal.id] += 1;
  updateBestMedal(medal);
  profile.lastRun = {
    score,
    medal: medal.id,
    accuracy: runStats.shots > 0 ? Number((runStats.goals / runStats.shots).toFixed(4)) : 0,
    xpEarned,
    completedAt: new Date().toISOString()
  };
  saveProfile();

  const newTitle = currentTitle();
  const summary = {
    score,
    benchmark: bestAtRunStart,
    newPersonalBest,
    medal,
    xpEarned,
    stats: cloneStats(runStats),
    currentTitle: newTitle,
    unlockedTitle: newTitle !== titleAtRunStart ? newTitle : null
  };
  window.__footballLabLastRunSummaryV20 = summary;
  renderRunSummary(summary);
  renderExtendedProfile();
  window.dispatchEvent(new CustomEvent("footballlab:runcomplete", { detail: summary }));
}

function monitor() {
  const modalOpen = elements.gameOverModal.classList.contains("is-open");

  if (state.screen === "game" && previousScreen !== "game") beginRun();
  if (previousModalOpen && !modalOpen && state.screen === "game" && integer(state.score) === 0) beginRun();
  if (state.screen === "menu" && previousScreen !== "menu") runActive = false;

  if (runActive && state.phase === "result" && state.shot) processShot(state.shot);
  if (!previousModalOpen && modalOpen) finaliseRun();
  if (runActive && integer(state.score) !== previousScore) {
    previousScore = integer(state.score);
    updatePersonalBestChase();
  }

  previousScreen = state.screen;
  previousModalOpen = modalOpen;
  requestAnimationFrame(monitor);
}

loadStyles();
createInterface();
ensureProfileShape();
renderExtendedProfile();

window.__footballLabProgressionV20 = Object.freeze({
  scoreReceipts: true,
  scoreCorrection: true,
  runStatistics: true,
  personalBestChase: true,
  medalGrades: MEDALS.map(({ id, threshold }) => ({ id, threshold })),
  performanceXp: true,
  profileTitles: TITLES.map(({ level, title }) => ({ level, title }))
});
window.__footballLabProgressionToolsV20 = Object.freeze({
  scoreComponentsForShot,
  medalForScore,
  xpForRun,
  titleForLevel
});

requestAnimationFrame(monitor);
