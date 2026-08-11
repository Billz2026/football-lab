const sourceUrl = new URL("./main-v11-3.js?v=113", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V11.3 game flow (${response.status})`);
let source = await response.text();

function replaceRequired(label, before, after) {
  if (!source.includes(before)) throw new Error(`V15 main patch failed: ${label}`);
  source = source.replace(before, after);
}

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
  'import { difficultyForStage } from "./difficulty-v9.js?v=31";',
  `import { difficultyForStage } from "./difficulty-v9.js?v=31";\nimport { activeCharacter, meterMultiplier } from "${new URL("./characters-v13.js?v=31", import.meta.url).href}";\nimport { keeperForStage } from "${new URL("./keepers-v14.js?v=31", import.meta.url).href}";\nimport { wallForStage } from "${new URL("./walls-v15.js?v=31", import.meta.url).href}";`
);

const startMarker = "function startGame() {";
if (!source.includes(startMarker)) throw new Error("V15 main patch failed: startGame marker missing");
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
  "  Object.assign(state, {\n    characterId: activeCharacter().id,\n    keeperId: keeperForStage(0).id,\n    wallId: wallForStage(0).id,\n    score: 0,"
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

source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-main-v15-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
