const sourceUrl = new URL("./main-v11-3.js?v=113", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V11.3 game flow (${response.status})`);
let source = await response.text();

function replaceRequired(label, before, after) {
  if (!source.includes(before)) throw new Error(`V14 main patch failed: ${label}`);
  source = source.replace(before, after);
}

replaceRequired(
  "V14 physics import",
  'import { resolveShotPhysics } from "./physics-v9.js?v=9";',
  `import { resolveShotPhysics } from "${new URL("./physics-v14.js?v=14", import.meta.url).href}";`
);
replaceRequired(
  "V14 renderer import",
  'import { resizeCanvas, drawScene } from "./render-v11-3.js?v=113";',
  `import { resizeCanvas, drawScene } from "${new URL("./render-v14.js?v=14", import.meta.url).href}";`
);
replaceRequired(
  "ability imports",
  'import { difficultyForStage } from "./difficulty-v9.js?v=9";',
  `import { difficultyForStage } from "./difficulty-v9.js?v=9";\nimport { activeCharacter, meterMultiplier } from "${new URL("./characters-v13.js?v=13", import.meta.url).href}";\nimport { keeperForStage } from "${new URL("./keepers-v14.js?v=14", import.meta.url).href}";`
);

const startMarker = "function startGame() {";
if (!source.includes(startMarker)) throw new Error("V14 main patch failed: startGame marker missing");
const introHelper = `
function announceKeeperChange() {
  const keeper = keeperForStage(state.stage);
  state.keeperId = keeper.id;
  window.dispatchEvent(new CustomEvent("footballlab:keeperchange", { detail: keeper }));
  return keeper;
}

function showStageIntro() {
  clearPresentationTimers();
  const keeper = announceKeeperChange();
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
    keeperId: keeper.id
  };
  elements.shotAction.textContent = "START STAGE";
  playStageSound();
  state.presentationTimeout = setTimeout(prepareNextShot, 1500);
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
  "run ability snapshot",
  "  Object.assign(state, {\n    score: 0,",
  "  Object.assign(state, {\n    characterId: activeCharacter().id,\n    keeperId: keeperForStage(0).id,\n    score: 0,"
);
replaceRequired(
  "opening opponent reveal",
  "  renderHud();\n  requestAnimationFrame(resizeCanvas);\n}",
  "  renderHud();\n  requestAnimationFrame(resizeCanvas);\n  showStageIntro();\n}"
);
replaceRequired(
  "keeper breakdown identity",
  "function keeperLabel(diagnostics, shot) {\n  if (!diagnostics || diagnostics.keeperReachScore == null) {\n    return shot.outcome === \"GOAL\" ? \"BEATEN\" : \"NOT TESTED\";\n  }\n  if (shot.outcome === \"SAVE\") return shot.saveType === \"CATCH\" ? \"CAUGHT\" : \"PARRIED\";\n  const margin = diagnostics.keeperReachScore - diagnostics.keeperThreshold;\n  return margin > 0 ? `SHORT ${margin.toFixed(2)}` : \"REACHED\";\n}",
  "function keeperLabel(diagnostics, shot) {\n  const keeper = keeperForStage(state.stage);\n  if (!diagnostics || diagnostics.keeperReachScore == null) {\n    return `${keeper.nickname} · ${shot.outcome === \"GOAL\" ? \"BEATEN\" : \"NOT TESTED\"}`;\n  }\n  if (shot.outcome === \"SAVE\") return `${keeper.nickname} · ${shot.saveType === \"CATCH\" ? \"CAUGHT\" : \"PARRIED\"}`;\n  const margin = diagnostics.keeperReachScore - diagnostics.keeperThreshold;\n  return `${keeper.nickname} · ${margin > 0 ? `SHORT ${margin.toFixed(2)}` : \"REACHED\"}`;\n}"
);
replaceRequired(
  "advanced-stage keeper update",
  "    state.stage += 1;\n    syncStage();\n    renderHud();",
  "    state.stage += 1;\n    syncStage();\n    const keeper = announceKeeperChange();\n    renderHud();"
);
replaceRequired(
  "stage presentation keeper",
  "      challenge: difficulty.challenge\n    };",
  "      challenge: difficulty.challenge,\n      keeperId: keeper.id\n    };"
);
replaceRequired(
  "longer opponent reveal",
  "    state.presentationTimeout = setTimeout(prepareNextShot, 1180);",
  "    state.presentationTimeout = setTimeout(prepareNextShot, 1500);"
);
replaceRequired(
  "prepare keeper state",
  "  state.shot = createShot();\n  syncStage();\n  setStageWind();",
  "  state.shot = createShot();\n  syncStage();\n  announceKeeperChange();\n  setStageWind();"
);

source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-main-v14-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
