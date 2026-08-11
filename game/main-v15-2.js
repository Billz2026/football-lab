const sourceUrl = new URL("./main-v11-3.js?v=113", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V11.3 game flow (${response.status})`);
let source = await response.text();

function replaceRequired(label, before, after) {
  if (!source.includes(before)) throw new Error(`V15.2 main patch failed: ${label}`);
  source = source.replace(before, after);
}

replaceRequired(
  "run rule constants",
  "  renderHud, showResult, stageConfig, strikeQualityLabel, syncStage\n} from \"./core-v6.js?v=32.3\";",
  "  renderHud, showResult, stageConfig, strikeQualityLabel, syncStage, MAX_LIVES, LIFE_STREAK_TARGET\n} from \"./core-v6.js?v=32.3\";"
);
replaceRequired(
  "V15 physics import",
  'import { resolveShotPhysics } from "./physics-v9.js?v=9";',
  `import { resolveShotPhysics } from "${new URL("./physics-v15.js?v=15", import.meta.url).href}";`
);
replaceRequired(
  "V15 renderer import",
  'import { resizeCanvas, drawScene } from "./render-v11-3.js?v=113";',
  `import { resizeCanvas, drawScene } from "${new URL("./render-v15.js?v=15", import.meta.url).href}";`
);
replaceRequired(
  "matchup imports",
  'import { difficultyForStage } from "./difficulty-v9.js?v=32.3";',
  `import { difficultyForStage } from "./difficulty-v9.js?v=32.3";\nimport { activeCharacter, meterMultiplier } from "${new URL("./characters-v13.js?v=32.3", import.meta.url).href}";\nimport { keeperForStage } from "${new URL("./keepers-v14.js?v=32.3", import.meta.url).href}";\nimport { wallForStage } from "${new URL("./walls-v15.js?v=32.3", import.meta.url).href}";`
);

const startMarker = "function startGame() {";
if (!source.includes(startMarker)) throw new Error("V15.2 main patch failed: startGame marker missing");
const introHelper = `
function announceMatchupChange() {
  const keeper = keeperForStage(state.stage);
  const wall = wallForStage(state.stage);
  state.keeperId = keeper.id;
  state.wallId = wall.id;
  window.dispatchEvent(new CustomEvent("footballlab:keeperchange", { detail: keeper }));
  window.dispatchEvent(new CustomEvent("footballlab:wallchange", { detail: wall }));
  return { keeper, wall };
}

function showStageIntro() {
  clearPresentationTimers();
  const { keeper, wall } = announceMatchupChange();
  const difficulty = difficultyForStage(state.stage, stageConfig());
  const startedAt = performance.now();
  state.presentation = {
    phase: "stage",
    startedAt,
    skippable: true,
    stageNumber: state.stage + 1,
    distanceYards: state.currentStage.distanceYards,
    stageName: state.currentStage.name,
    challenge: difficulty.challenge,
    keeperId: keeper.id,
    wallId: wall.id
  };
  elements.shotAction.textContent = "START STAGE";
  playStageSound();
  state.presentationTimeout = setTimeout(prepareNextShot, 1850);
}

`;
source = source.replace(startMarker, introHelper + startMarker);

replaceRequired(
  "power meter character speed",
  "    const speed = (3.35 + stage.aimSpeed * 0.18) * difficulty.meter.power;",
  "    const speed = (3.35 + stage.aimSpeed * 0.18) * difficulty.meter.power * meterMultiplier(\"power\", state.stage);"
);
replaceRequired(
  "aim meter character speed",
  "    state.meterClock += delta * difficulty.meter.aim;",
  "    state.meterClock += delta * difficulty.meter.aim * meterMultiplier(\"aim\", state.stage);"
);
replaceRequired(
  "curve meter character speed",
  "    const speed = (2.78 + stage.aimSpeed * 0.2) * difficulty.meter.curve;",
  "    const speed = (2.78 + stage.aimSpeed * 0.2) * difficulty.meter.curve * meterMultiplier(\"curve\", state.stage);"
);
replaceRequired(
  "run matchup snapshot",
  "  Object.assign(state, {\n    score: 0,",
  "  Object.assign(state, {\n    characterId: activeCharacter().id,\n    keeperId: keeperForStage(0).id,\n    wallId: wallForStage(0).id,\n    maxLives: MAX_LIVES,\n    lifeStreakTarget: LIFE_STREAK_TARGET,\n    score: 0,"
);
replaceRequired(
  "opening matchup reveal",
  "  renderHud();\n  requestAnimationFrame(resizeCanvas);\n}",
  "  renderHud();\n  requestAnimationFrame(resizeCanvas);\n  showStageIntro();\n}"
);
replaceRequired(
  "wall breakdown identity",
  "function wallLabel(diagnostics) {\n  if (!diagnostics) return \"—\";\n  if (diagnostics.wallClearanceMetres == null) return diagnostics.wallLane || \"N/A\";\n  const clearance = diagnostics.wallClearanceMetres;\n  return `${diagnostics.wallLane} ${clearance >= 0 ? \"+\" : \"\"}${clearance.toFixed(2)} m`;\n}",
  "function wallLabel(diagnostics) {\n  const wall = wallForStage(state.stage);\n  if (!diagnostics) return `${wall.nickname} · —`;\n  if (diagnostics.wallClearanceMetres == null) return `${wall.nickname} · ${diagnostics.wallLane || \"N/A\"}`;\n  const clearance = diagnostics.wallClearanceMetres;\n  return `${wall.nickname} · ${diagnostics.wallLane} ${clearance >= 0 ? \"+\" : \"\"}${clearance.toFixed(2)} m`;\n}"
);
replaceRequired(
  "keeper breakdown identity",
  "function keeperLabel(diagnostics, shot) {\n  if (!diagnostics || diagnostics.keeperReachScore == null) {\n    return shot.outcome === \"GOAL\" ? \"BEATEN\" : \"NOT TESTED\";\n  }\n  if (shot.outcome === \"SAVE\") return shot.saveType === \"CATCH\" ? \"CAUGHT\" : \"PARRIED\";\n  const margin = diagnostics.keeperReachScore - diagnostics.keeperThreshold;\n  return margin > 0 ? `SHORT ${margin.toFixed(2)}` : \"REACHED\";\n}",
  "function keeperLabel(diagnostics, shot) {\n  const keeper = keeperForStage(state.stage);\n  if (!diagnostics || diagnostics.keeperReachScore == null) {\n    return `${keeper.nickname} · ${shot.outcome === \"GOAL\" ? \"BEATEN\" : \"NOT TESTED\"}`;\n  }\n  if (shot.outcome === \"SAVE\") return `${keeper.nickname} · ${shot.saveType === \"CATCH\" ? \"CAUGHT\" : \"PARRIED\"}`;\n  const margin = diagnostics.keeperReachScore - diagnostics.keeperThreshold;\n  return `${keeper.nickname} · ${margin > 0 ? `SHORT ${margin.toFixed(2)}` : \"REACHED\"}`;\n}"
);

const oldScoreShot = `function scoreShot(shot) {
  if (shot.outcome !== "GOAL") {
    state.misses += 1;
    state.streak = 0;
    state.pendingStageAdvance = false;
    return 0;
  }

  state.streak += 1;
  state.bestRunStreak = Math.max(state.bestRunStreak, state.streak);
  const strikeBonus = shot.strikeQuality >= 0.9 ? 350 : shot.strikeQuality >= 0.68 ? 175 : 0;
  const distanceBonus = Math.max(0, state.currentStage.distanceYards - 20) * 28;
  const points = 1000
    + state.stage * 85
    + Math.max(0, state.streak - 1) * 125
    + strikeBonus
    + distanceBonus
    + (shot.topCorner ? 700 : 0)
    + Math.round(Math.abs(state.stageWind) * 1500);
  shot.points = points;
  state.score += points;
  state.pendingStageAdvance = true;
  return points;
}`;
const newScoreShot = `function scoreShot(shot) {
  shot.lifeRestored = false;
  if (shot.outcome !== "GOAL") {
    state.misses = Math.min(MAX_LIVES, state.misses + 1);
    state.streak = 0;
    state.pendingStageAdvance = false;
    return 0;
  }

  state.streak += 1;
  state.bestRunStreak = Math.max(state.bestRunStreak, state.streak);
  if (state.streak % LIFE_STREAK_TARGET === 0 && state.misses > 0) {
    state.misses -= 1;
    shot.lifeRestored = true;
    window.dispatchEvent(new CustomEvent("footballlab:liferestored", {
      detail: { lives: MAX_LIVES - state.misses, streak: state.streak }
    }));
  }
  const strikeBonus = shot.strikeQuality >= 0.9 ? 350 : shot.strikeQuality >= 0.68 ? 175 : 0;
  const distanceBonus = Math.max(0, state.currentStage.distanceYards - 20) * 34;
  const points = 1000
    + state.stage * 85
    + Math.max(0, state.streak - 1) * 125
    + strikeBonus
    + distanceBonus
    + (shot.topCorner ? 700 : 0)
    + Math.round(Math.abs(state.stageWind) * 1700);
  shot.points = points;
  state.score += points;
  state.pendingStageAdvance = true;
  return points;
}`;
replaceRequired("five-life scoring", oldScoreShot, newScoreShot);

replaceRequired(
  "life recovery result",
  "  if (shot.outcome === \"GOAL\") {\n    if (shot.topCorner) return `TOP CORNER +${formatScore(points)}`;",
  "  if (shot.outcome === \"GOAL\") {\n    if (shot.lifeRestored) return `LIFE RESTORED · +${formatScore(points)}`;\n    if (shot.topCorner) return `TOP CORNER +${formatScore(points)}`;"
);
replaceRequired(
  "advanced-stage matchup update",
  "    state.stage += 1;\n    syncStage();\n    renderHud();",
  "    state.stage += 1;\n    syncStage();\n    const { keeper, wall } = announceMatchupChange();\n    renderHud();"
);
replaceRequired(
  "stage presentation matchup",
  "      challenge: difficulty.challenge\n    };",
  "      challenge: difficulty.challenge,\n      keeperId: keeper.id,\n      wallId: wall.id\n    };"
);
replaceRequired(
  "longer matchup reveal",
  "    state.presentationTimeout = setTimeout(prepareNextShot, 1180);",
  "    state.presentationTimeout = setTimeout(prepareNextShot, 1850);"
);
replaceRequired(
  "prepare matchup state",
  "  state.shot = createShot();\n  syncStage();\n  setStageWind();",
  "  state.shot = createShot();\n  syncStage();\n  announceMatchupChange();\n  setStageWind();"
);

const originalGameOverChecks = (source.match(/state\.misses >= 3/g) || []).length;
if (originalGameOverChecks < 2) throw new Error("V15.2 main patch failed: life-limit checks missing");
source = source.replace(/state\.misses >= 3/g, "state.misses >= MAX_LIVES");

source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-main-v15-2-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
