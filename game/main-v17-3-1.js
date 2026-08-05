const sourceUrl = new URL("./main-v15-2.js?v=152", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V15.2 game flow (${response.status})`);
let source = await response.text();

function patchRequired(label, before, after) {
  if (!source.includes(before)) {
    throw new Error(`V17.4 pacing patch failed: ${label}`);
  }
  source = source.replace(before, after);
}

const renderNeedle = 'new URL("./render-v15.js?v=15", import.meta.url).href';
const renderReplacement = `new URL("${new URL("./render-v17-3-1.js?v=1731", import.meta.url).href}").href`;
patchRequired("V17.3.1 renderer URL", renderNeedle, renderReplacement);

patchRequired(
  "stage intro duration",
  "setTimeout(prepareNextShot, 1850)",
  "setTimeout(prepareNextShot, 700)"
);
source = source.replace(
  "setTimeout(prepareNextShot, 1850)",
  "setTimeout(prepareNextShot, 700)"
);

const flowMarker = "\nconst originalGameOverChecks =";
if (!source.includes(flowMarker)) {
  throw new Error("V17.4 pacing patch failed: flow insertion marker missing");
}

const flowPatch = `
replaceRequired(
  "selective highlight replays",
  '  const replayable = ["GOAL", "SAVE", "POST", "BAR"].includes(shot.outcome);',
  '  const replayable = Boolean(shot.topCorner || shot.lifeRestored || ["POST", "BAR"].includes(shot.outcome));'
);
replaceRequired(
  "shorter highlight replay",
  "    flightDuration: 1120,\\n    settleDuration: 120,\\n    totalDuration: 1241,",
  "    flightDuration: 680,\\n    settleDuration: 70,\\n    totalDuration: 751,"
);
replaceRequired(
  "shorter shot breakdown",
  "  state.presentationTimeout = setTimeout(continueAfterBreakdown, 2200);",
  "  state.presentationTimeout = setTimeout(continueAfterBreakdown, 650);"
);
`;
source = source.replace(flowMarker, `${flowPatch}${flowMarker}`);

source = source.replace(/new URL\("(\.\/[^"\n]+)", import\.meta\.url\)/g, (_, specifier) => {
  return `new URL("${new URL(specifier, sourceUrl).href}")`;
});
source += "\n//# sourceURL=football-lab-main-v17-4-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
try {
  await import(moduleUrl);
  window.__footballLabMainV17 = true;
  window.__footballLabMainV171 = true;
  window.__footballLabMainV172 = true;
  window.__footballLabMainV173 = true;
  window.__footballLabMainV1731 = true;
  window.__footballLabMainV174 = true;
  window.__footballLabFastFlowV174 = {
    stageIntroMs: 700,
    breakdownMs: 650,
    replayMs: 751,
    replayPolicy: "top-corner-life-restored-or-frame"
  };
} finally {
  URL.revokeObjectURL(moduleUrl);
}
