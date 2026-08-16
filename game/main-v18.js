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
  '["GOAL", "SAVE", "POST", "BAR"].includes(shot.outcome)',
  'Boolean(shot.topCorner || shot.lifeRestored || ["POST", "BAR"].includes(shot.outcome))'
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
  "contact readout reset",
  '  elements.curveReadout.textContent = "—";',
  '  elements.curveReadout.textContent = "—";\\n  if (elements.contactReadout) elements.contactReadout.textContent = "—";'
);
replaceRequired(
  "contact timing helpers",
  'function wallLabel(diagnostics) {',
  \`function contactWindowForShot() {
  const character = activeCharacter();
  const stageProgress = Math.min(1, Math.max(0, state.stage % 30) / 29);
  const accuracy = Number(character.stats?.accuracy) || 75;
  const composure = Number(character.stats?.composure) || 75;
  const skillBonus = (accuracy - 75) * 0.00055 + (composure - 75) * 0.00028;
  const curvePenalty = Math.abs(state.shot?.previewCurve || state.shot?.curve || 0) * 0.036;
  const distancePenalty = Math.max(0, (state.currentStage.distanceYards - 20) * 0.0008);
  const modeAdjustment = state.controlMode === "guided" ? 0.038 : state.controlMode === "expert" ? -0.022 : 0;
  return Math.max(0.052, Math.min(0.175,
    0.13 - stageProgress * 0.025 + skillBonus - curvePenalty - distancePenalty + modeAdjustment
  ));
}

function contactQualityAt(value, window) {
  const distance = Math.abs(value - 0.5);
  const ratio = distance / Math.max(0.025, window);
  if (ratio <= 0.34) return 1;
  if (ratio <= 1) return 1 - ((ratio - 0.34) / 0.66) ** 1.35 * 0.4;
  return Math.max(0.06, 0.6 - (ratio - 1) * 0.31);
}

function contactLabel(quality, offset = 0) {
  if (quality >= 0.94) return "PERFECT CONTACT";
  if (quality >= 0.72) return offset < 0 ? "CLEAN · EARLY" : "CLEAN · LATE";
  if (quality >= 0.44) return offset < 0 ? "MISHIT · EARLY" : "MISHIT · LATE";
  return offset < 0 ? "POOR · EARLY" : "POOR · LATE";
}

function wallLabel(diagnostics) {\`
);
replaceRequired(
  "ready opens aim",
  '    resetShotReadouts();\\n    setPhase("power");\\n    return;\\n  }\\n\\n  if (state.phase === "power") {',
  '    resetShotReadouts();\\n    setPhase("aim");\\n    return;\\n  }\\n\\n  if (state.phase === "power") {'
);
replaceRequired(
  "power opens contact",
  '    setPhase("aim");\\n    return;\\n  }\\n\\n  if (state.phase === "aim") {',
  '    state.shot.contactWindow = contactWindowForShot();\\n    setPhase("contact");\\n    return;\\n  }\\n\\n  if (state.phase === "aim") {'
);
replaceRequired(
  "aim locks preview curve",
  '    Object.assign(state.shot, { aimX: target.x, aimY: target.y });',
  '    Object.assign(state.shot, { aimX: target.x, aimY: target.y, curve: Number.isFinite(state.shot.previewCurve) ? state.shot.previewCurve : 0 });'
);
replaceRequired(
  "aim opens power",
  '    elements.aimReadout.textContent = target.label;\\n    setPhase("curve");',
  '    elements.aimReadout.textContent = target.label;\\n    elements.curveReadout.textContent = curveLabel(state.shot);\\n    setPhase("power");'
);
replaceRequired(
  "contact action phase",
  '\\n  if (state.phase === "curve") {',
  '\\n  if (state.phase === "contact") {\\n    const offset = state.meterValue - 0.5;\\n    const window = Number(state.shot.contactWindow) || contactWindowForShot();\\n    const quality = contactQualityAt(state.meterValue, window);\\n    state.shot.contactTiming = state.meterValue;\\n    state.shot.contactOffset = offset;\\n    state.shot.contactErrorRatio = Math.abs(offset) / Math.max(0.025, window);\\n    state.shot.contactQuality = quality;\\n    if (elements.contactReadout) elements.contactReadout.textContent = contactLabel(quality, offset) + " · " + Math.round(quality * 100) + "%";\\n    takeShot();\\n    return;\\n  }\\n\\n  if (state.phase === "curve") {'
);
replaceRequired(
  "contact meter phase",
  '  if (!["power", "aim", "curve"].includes(state.phase)) return;',
  '  if (!["power", "aim", "contact", "curve"].includes(state.phase)) return;'
);
replaceRequired(
  "aim and contact meter motion",
  '  } else if (state.phase === "aim") {\\n    state.meterClock += delta * difficulty.meter.aim * meterMultiplier("aim", state.stage);\\n    state.meterValue = currentAimTarget().x;\\n  } else {',
  '  } else if (state.phase === "aim") {\\n    const target = currentAimTarget();\\n    state.meterValue = Math.max(0, Math.min(1, target.x));\\n  } else if (state.phase === "contact") {\\n    state.meterClock += delta;\\n    const modeSpeed = state.controlMode === "guided" ? 0.84 : state.controlMode === "expert" ? 1.16 : 1;\\n    const curvePressure = 1 + Math.abs(state.shot?.curve || 0) * 0.24;\\n    const speed = (3.05 + stage.aimSpeed * 0.18) * difficulty.meter.aim * meterMultiplier("aim", state.stage) * modeSpeed * curvePressure;\\n    state.meterValue = (Math.sin(state.meterClock * speed - Math.PI / 2) + 1) / 2;\\n  } else {'
);
replaceRequired(
  "contact meter label",
  '  if (state.phase === "curve") {',
  '  if (state.phase === "contact") {\\n    const window = Number(state.shot?.contactWindow) || 0.1;\\n    const quality = contactQualityAt(state.meterValue, window);\\n    const offset = state.meterValue - 0.5;\\n    elements.meterNumber.textContent = quality >= 0.94 ? "PERFECT" : (offset < 0 ? "EARLY" : "LATE") + " · " + Math.round(quality * 100) + "%";\\n  } else if (state.phase === "curve") {'
);
replaceRequired(
  "action click suppression state",
  "let gamepadWasPressed = false;",
  "let gamepadWasPressed = false;\\nlet suppressActionClickUntil = 0;"
);
replaceRequired(
  "event-time meter sampling",
  \`function handleAction() {\\n  const now = performance.now();\\n  if (now < state.actionLockedUntil) return;\\n  state.actionLockedUntil = now + 135;\\n  unlockAudio();\`,
  \`function normaliseInputTime(inputTime) {\\n  const current = performance.now();\\n  if (!Number.isFinite(inputTime)) return current;\\n  return Math.abs(current - inputTime) <= 1000 ? inputTime : current;\\n}\\n\\nfunction sampleMeterAtInput(inputTime) {\\n  if (state.screen !== \\\"game\\\" || ![\\\"power\\\", \\\"aim\\\", \\\"contact\\\", \\\"curve\\\"].includes(state.phase)) return;\\n  const frameTime = state.lastTime;\\n  const correctionSeconds = Math.max(-0.05, Math.min((inputTime - frameTime) / 1000, 0.05));\\n  if (Math.abs(correctionSeconds) > 0.0001) updateMeter(correctionSeconds);\\n  state.lastTime = inputTime;\\n  window.__footballLabLastInputSample = {\\n    phase: state.phase,\\n    inputTime,\\n    frameTime,\\n    correctionMs: correctionSeconds * 1000,\\n    meterValue: state.meterValue\\n  };\\n}\\n\\nfunction handleAction(inputTime = performance.now()) {\\n  const now = normaliseInputTime(inputTime);\\n  if (now < state.actionLockedUntil) return;\\n  sampleMeterAtInput(now);\\n  state.actionLockedUntil = now + 70;\\n  unlockAudio();\`
);
replaceRequired(
  "low-latency pointer input",
  \`elements.shotAction.addEventListener(\\\"click\\\", handleAction);\\nelements.canvas.addEventListener(\\\"pointerdown\\\", (event) => {\\n  event.preventDefault();\\n  handleAction();\\n}, { passive: false });\`,
  \`elements.shotAction.addEventListener(\\\"pointerdown\\\", (event) => {\\n  if (!event.isPrimary || (event.pointerType === \\\"mouse\\\" && event.button !== 0)) return;\\n  event.preventDefault();\\n  suppressActionClickUntil = performance.now() + 450;\\n  handleAction(event.timeStamp);\\n}, { passive: false });\\nelements.shotAction.addEventListener(\\\"click\\\", (event) => {\\n  if (performance.now() < suppressActionClickUntil) {\\n    event.preventDefault();\\n    suppressActionClickUntil = 0;\\n    return;\\n  }\\n  handleAction(event.timeStamp);\\n});\\nelements.canvas.addEventListener(\\\"pointerdown\\\", (event) => {\\n  if (!event.isPrimary || (event.pointerType === \\\"mouse\\\" && event.button !== 0)) return;\\n  event.preventDefault();\\n  handleAction(event.timeStamp);\\n}, { passive: false });\`
);
replaceRequired(
  "planned strike event bridge",
  \`elements.canvas.style.touchAction = "manipulation";\\nelements.shotAction.style.touchAction = "manipulation";\`,
  \`elements.canvas.style.touchAction = "manipulation";\\nelements.shotAction.style.touchAction = "manipulation";\\n\\nwindow.addEventListener("footballlab:takeplannedshot", () => {\\n  if (state.screen !== "game" || state.phase !== "aim" || state.animation) return;\\n  state.actionLockedUntil = 0;\\n  suppressActionClickUntil = 0;\\n  handleAction(performance.now());\\n});\\n\\nwindow.addEventListener("footballlab:beginstrike", () => {\\n  if (state.screen !== "game" || state.phase !== "aim" || state.animation) return;\\n  state.actionLockedUntil = 0;\\n  suppressActionClickUntil = 0;\\n  handleAction(performance.now());\\n});\`
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
    powerPerfectWindow: 0.07,
    strikeFlow: "aim-power-contact"
  };
  window.__footballLabPhysicsRouteV19 = {
    module: "physics-v19",
    worldDistanceResampling: true,
    distanceTimedFlight: true
  };
} finally {
  URL.revokeObjectURL(moduleUrl);
}
