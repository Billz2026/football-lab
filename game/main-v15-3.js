const loaderSourceUrl = new URL("./main-v15-2.js?v=152", import.meta.url);
const response = await fetch(loaderSourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V15.2 game flow (${response.status})`);
let loaderSource = await response.text();

loaderSource = loaderSource
  .replaceAll("./physics-v15.js?v=15", "./physics-v15-3.js?v=153")
  .replaceAll("./render-v15.js?v=15", "./render-v15-3.js?v=153")
  .replaceAll("./keepers-v14.js?v=31", "./lab-matchups-v15-3.js?v=153")
  .replaceAll("./walls-v15.js?v=31", "./lab-matchups-v15-3.js?v=153");

loaderSource = loaderSource.replace(
  /new URL\("(\.\/[^"\n]+)"\s*,\s*import\.meta\.url\)/g,
  (_, specifier) => `new URL("${new URL(specifier, loaderSourceUrl).href}")`
);

const insertionIndex = loaderSource.lastIndexOf("\nsource = source.replace(/from");
if (insertionIndex < 0) throw new Error("V15.3 main patch failed: loader insertion point missing");

const labPatches = `
replaceRequired(
  "normal start exits lab",
  'function startGame() {\\n  resetPresentation();',
  'function startGame() {\\n  if (state.matchupLab?.active) {\\n    state.matchupLab = { active: false };\\n    window.dispatchEvent(new CustomEvent("footballlab:labchange", { detail: state.matchupLab }));\\n  }\\n  resetPresentation();'
);
replaceRequired(
  "menu return exits lab",
  'function returnToMenu() {\\n  resetPresentation();',
  'function returnToMenu() {\\n  if (state.matchupLab?.active) {\\n    state.matchupLab = { active: false };\\n    window.dispatchEvent(new CustomEvent("footballlab:labchange", { detail: state.matchupLab }));\\n  }\\n  resetPresentation();'
);
replaceRequired(
  "lab scoring isolation",
  'function scoreShot(shot) {\\n  shot.lifeRestored = false;',
  'function scoreShot(shot) {\\n  if (state.matchupLab?.active) {\\n    shot.lifeRestored = false;\\n    state.pendingStageAdvance = false;\\n    if (shot.outcome === "GOAL") {\\n      state.streak += 1;\\n      state.bestRunStreak = Math.max(state.bestRunStreak, state.streak);\\n    } else {\\n      state.streak = 0;\\n    }\\n    shot.points = 0;\\n    return 0;\\n  }\\n  shot.lifeRestored = false;'
);
replaceRequired(
  "lab repeat after breakdown",
  'function continueAfterBreakdown() {\\n  if (state.presentation?.phase !== "breakdown") return;\\n  clearPresentationTimers();',
  'function continueAfterBreakdown() {\\n  if (state.presentation?.phase !== "breakdown") return;\\n  clearPresentationTimers();\\n  if (state.matchupLab?.active) {\\n    prepareNextShot();\\n    return;\\n  }'
);
replaceRequired(
  "lab wind lock",
  '  announceMatchupChange();\\n  setStageWind();\\n  resetShotReadouts();',
  '  announceMatchupChange();\\n  setStageWind();\\n  if (state.matchupLab?.active && Number.isFinite(state.matchupLab.wind)) {\\n    state.stageWind = state.matchupLab.wind;\\n  }\\n  resetShotReadouts();'
);
`;

loaderSource = loaderSource.slice(0, insertionIndex) + "\n" + labPatches + loaderSource.slice(insertionIndex);
loaderSource += "\n//# sourceURL=football-lab-main-v15-3-loader-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([loaderSource], { type: "text/javascript" }));
try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
