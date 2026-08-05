const sourceUrl = new URL("./main-v15-2.js?v=152", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V15.2 game flow (${response.status})`);
let source = await response.text();

function patchRequired(label, before, after) {
  if (!source.includes(before)) {
    throw new Error(`V18 input-precision patch failed: ${label}`);
  }
  source = source.replace(before, after);
}

const renderNeedle = 'new URL("./render-v15.js?v=15", import.meta.url).href';
const renderReplacement = `new URL("${new URL("./render-v17-3-1.js?v=1731", import.meta.url).href}").href`;
patchRequired("V17.3.1 renderer URL", renderNeedle, renderReplacement);

patchRequired(
  "V19 physics URL",
  'new URL("./physics-v15.js?v=15", import.meta.url).href',
  'new URL("./physics-v19.js?v=19", import.meta.url).href'
);

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
  throw new Error("V18 input-precision patch failed: flow insertion marker missing");
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
replaceRequired(
  "action click suppression state",
  "let gamepadWasPressed = false;",
  "let gamepadWasPressed = false;\\nlet suppressActionClickUntil = 0;"
);
replaceRequired(
  "event-time meter sampling",
  \`function handleAction() {\\n  const now = performance.now();\\n  if (now < state.actionLockedUntil) return;\\n  state.actionLockedUntil = now + 135;\\n  unlockAudio();\`,
  \`function normaliseInputTime(inputTime) {\\n  const current = performance.now();\\n  if (!Number.isFinite(inputTime)) return current;\\n  return Math.abs(current - inputTime) <= 1000 ? inputTime : current;\\n}\\n\\nfunction sampleMeterAtInput(inputTime) {\\n  if (state.screen !== \\\"game\\\" || ![\\\"power\\\", \\\"aim\\\", \\\"curve\\\"].includes(state.phase)) return;\\n  const frameTime = state.lastTime;\\n  const correctionSeconds = Math.max(-0.05, Math.min((inputTime - frameTime) / 1000, 0.05));\\n  if (Math.abs(correctionSeconds) > 0.0001) updateMeter(correctionSeconds);\\n  state.lastTime = inputTime;\\n  window.__footballLabLastInputSample = {\\n    phase: state.phase,\\n    inputTime,\\n    frameTime,\\n    correctionMs: correctionSeconds * 1000,\\n    meterValue: state.meterValue\\n  };\\n}\\n\\nfunction handleAction(inputTime = performance.now()) {\\n  const now = normaliseInputTime(inputTime);\\n  if (now < state.actionLockedUntil) return;\\n  sampleMeterAtInput(now);\\n  state.actionLockedUntil = now + 70;\\n  unlockAudio();\`
);
replaceRequired(
  "low-latency pointer input",
  \`elements.shotAction.addEventListener(\\\"click\\\", handleAction);\\nelements.canvas.addEventListener(\\\"pointerdown\\\", (event) => {\\n  event.preventDefault();\\n  handleAction();\\n}, { passive: false });\`,
  \`elements.shotAction.addEventListener(\\\"pointerdown\\\", (event) => {\\n  if (!event.isPrimary || (event.pointerType === \\\"mouse\\\" && event.button !== 0)) return;\\n  event.preventDefault();\\n  suppressActionClickUntil = performance.now() + 450;\\n  handleAction(event.timeStamp);\\n}, { passive: false });\\nelements.shotAction.addEventListener(\\\"click\\\", (event) => {\\n  if (performance.now() < suppressActionClickUntil) {\\n    event.preventDefault();\\n    suppressActionClickUntil = 0;\\n    return;\\n  }\\n  handleAction(event.timeStamp);\\n});\\nelements.canvas.addEventListener(\\\"pointerdown\\\", (event) => {\\n  if (!event.isPrimary || (event.pointerType === \\\"mouse\\\" && event.button !== 0)) return;\\n  event.preventDefault();\\n  handleAction(event.timeStamp);\\n}, { passive: false });\`
);
replaceRequired(
  "keyboard event timestamp",
  \`    event.preventDefault();\\n    handleAction();\\n  }\\n  if (event.key.toLowerCase() === \\\"d\\\"\`,
  \`    event.preventDefault();\\n    handleAction(event.timeStamp);\\n  }\\n  if (event.key.toLowerCase() === \\\"d\\\"\`
);
`;
source = source.replace(flowMarker, `${flowPatch}${flowMarker}`);

source = source.replace(/new URL\("(\.\/[^"\n]+)", import\.meta\.url\)/g, (_, specifier) => {
  return `new URL("${new URL(specifier, sourceUrl).href}")`;
});
source += "\n//# sourceURL=football-lab-main-v19-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
try {
  await import(moduleUrl);
  window.__footballLabMainV17 = true;
  window.__footballLabMainV171 = true;
  window.__footballLabMainV172 = true;
  window.__footballLabMainV173 = true;
  window.__footballLabMainV1731 = true;
  window.__footballLabMainV174 = true;
  window.__footballLabMainV18 = true;
  window.__footballLabMainV19 = true;
  window.__footballLabFastFlowV174 = {
    stageIntroMs: 700,
    breakdownMs: 650,
    replayMs: 751,
    replayPolicy: "top-corner-life-restored-or-frame"
  };
  window.__footballLabInputPrecisionV18 = {
    eventTimeSampling: true,
    signedFrameCorrection: true,
    actionLockMs: 70,
    pointerDownActivation: true,
    clickDeduplicationMs: 450,
    powerPerfectWindow: 0.07
  };
  window.__footballLabPhysicsRouteV19 = {
    module: "physics-v19",
    worldDistanceResampling: true,
    distanceTimedFlight: true
  };
} finally {
  URL.revokeObjectURL(moduleUrl);
}
