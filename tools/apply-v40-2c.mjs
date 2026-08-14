import fs from "node:fs";

const paths = {
  base: "game/runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js",
  bridgeV9: "game/runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js",
  genV15: "game/runtime-v23-generated-render-v15-v1731-1b04a249af.js",
  genV17: "game/runtime-v23-generated-render-v17-v1731-7f257084b1.js",
  bridgeV17: "game/runtime-v23-bridge-render-v17-3-1-64b7ab3399.js",
  runtime: "game/runtime-v23-main.js",
  app: "app.js",
  sw: "sw.js"
};

const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]));

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`V40.2C patch failed: ${label}`);
  return text.replace(from, to);
}

function replaceRange(text, startMarker, endMarker, replacement, label) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`V40.2C patch failed: ${label}`);
  return text.slice(0, start) + replacement + text.slice(end);
}

const goalContrast = `function drawGoalContrastV402C() {
  const leftBottom = projectWorld({ x: -GOAL.halfWidth, y: 0.02, z: -GOAL.depth * 0.22 }, activeCamera, viewport);
  const rightBottom = projectWorld({ x: GOAL.halfWidth, y: 0.02, z: -GOAL.depth * 0.22 }, activeCamera, viewport);
  const leftTop = projectWorld({ x: -GOAL.halfWidth, y: GOAL.height, z: -GOAL.depth * 0.22 }, activeCamera, viewport);
  const rightTop = projectWorld({ x: GOAL.halfWidth, y: GOAL.height, z: -GOAL.depth * 0.22 }, activeCamera, viewport);
  const points = [leftBottom, rightBottom, leftTop, rightTop];
  if (points.some((point) => !point?.visible)) return;

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(leftTop.y, rightTop.y);
  const maxY = Math.max(leftBottom.y, rightBottom.y);
  const goalSpan = Math.max(120, maxX - minX);
  const goalHeight = Math.max(60, maxY - minY);
  const centreX = (minX + maxX) / 2;
  const centreY = minY + goalHeight * 0.6;
  const radiusX = clamp(goalSpan * 0.78, 118, 250);
  const radiusY = clamp(goalHeight * 0.92, 58, 128);
  const feather = clamp(goalSpan * 0.16, 26, 54);
  const left = clamp(centreX - radiusX * 0.82, 130, WORLD.width * 0.48);
  const right = clamp(centreX + radiusX * 0.82, WORLD.width * 0.52, WORLD.width - 130);

  // V40.2C: no rectangular backdrop. A very soft elliptical contrast field sits over the
  // existing stand so the stadium remains continuous while the keeper lane stays readable.
  ctx.save();
  ctx.translate(centreX, centreY);
  const scaleY = radiusY / radiusX;
  ctx.scale(1, scaleY);
  const shade = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
  shade.addColorStop(0, "rgba(3,15,10,.115)");
  shade.addColorStop(0.42, "rgba(3,15,10,.075)");
  shade.addColorStop(0.72, "rgba(3,15,10,.032)");
  shade.addColorStop(1, "rgba(3,15,10,0)");
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(0, 0, radiusX, 0, TAU);
  ctx.fill();
  ctx.restore();

  window.__footballLabGoalContrastV402C = {
    build: "40.2C",
    left,
    right,
    centreX,
    centreY,
    radiusX,
    radiusY,
    feather,
    goalSpan,
    advertisingClear: true,
    keeperContrast: "soft-radial-only",
    treatment: "no-rectangle-continuous-stadium"
  };
}

`;

files.base = replaceRange(
  files.base,
  "function drawGoalBackdropV402B() {",
  "function pitchDetailTier() {",
  goalContrast,
  "replace block-shaped goal bay"
);
files.base = replaceOnce(files.base, "  drawGoalBackdropV402B();", "  drawGoalContrastV402C();", "base goal contrast call");

files.genV17 = replaceOnce(
  files.genV17,
  "  const keeperBackdrop = window.__footballLabGoalBackdropV402B;",
  "  const keeperBackdrop = window.__footballLabGoalContrastV402C;",
  "advertising reads radial goal contrast"
);
files.genV17 = replaceOnce(files.genV17, "window.__footballLabAdvertisingV402B = {", "window.__footballLabAdvertisingV402C = {", "advertising public marker");
files.genV17 = replaceOnce(files.genV17, '    build: "40.2B",', '    build: "40.2C",', "advertising build marker");
files.genV17 = replaceOnce(files.genV17, '    tone: "muted-low-profile"', '    tone: "muted-low-profile",\n    centreTreatment: "radial-no-block"', "advertising centre metadata");

files.runtime = replaceOnce(
  files.runtime,
  '  if (phase === "replay") {',
  '  if (phase === "result") return true;\n  if (phase === "replay") {',
  "lock input during result hold"
);

const oldResultBanner = `function resultBannerForShot(shot, points) {
  if (shot.outcome === "GOAL") {
    if (shot.topCorner) return \`TOP CORNER +\${formatScore(points)}\`;
    if (shot.strikeQuality >= 0.9) return \`PERFECT STRIKE +\${formatScore(points)}\`;
    return \`GOAL +\${formatScore(points)}\`;
  }
  return ({
    SAVE: shot.saveType === "CATCH" ? "HELD BY KEEPER" : "PARRIED AWAY",
    WALL: "BLOCKED BY WALL",
    POST: "OFF THE POST",
    BAR: "OFF THE BAR",
    MISS: "OFF TARGET"
  })[shot.outcome] || "NO GOAL";
}
`;
const newResultBanner = `function outcomeHeading(shot) {
  return ({
    GOAL: "GOAL",
    SAVE: "SAVED",
    WALL: "BLOCKED",
    POST: "OFF THE POST",
    BAR: "CROSSBAR",
    MISS: "WIDE"
  })[shot.outcome] || "SHOT COMPLETE";
}

function resultBannerForShot(shot, points) {
  if (shot.outcome === "GOAL") {
    if (shot.topCorner) return \`GOAL · TOP CORNER +\${formatScore(points)}\`;
    if (shot.strikeQuality >= 0.9) return \`GOAL · PERFECT STRIKE +\${formatScore(points)}\`;
    return \`GOAL +\${formatScore(points)}\`;
  }
  return ({
    SAVE: shot.saveType === "CATCH" ? "SAVED · HELD" : "SAVED · PARRIED",
    WALL: "BLOCKED",
    POST: "OFF THE POST",
    BAR: "CROSSBAR",
    MISS: "WIDE"
  })[shot.outcome] || "SHOT COMPLETE";
}
`;
files.runtime = replaceOnce(files.runtime, oldResultBanner, newResultBanner, "clear outcome wording");

const oldFinish = `  renderHud();
  showResult(resultBannerForShot(shot, points), miss);
  setPhase("result");
  playOutcomeSound(shot.outcome, { topCorner: shot.topCorner, saveType: shot.saveType });

  state.presentation = {
    ...state.presentation,
    phase: "result",
    resultAt: performance.now(),
    outcome: shot.outcome,
    saveType: shot.saveType,
    topCorner: shot.topCorner,
    breakdown: buildBreakdown(shot)
  };

  const replayable = Boolean(shot.outcome === "GOAL" && (
    shot.topCorner
    || shot.strikeQuality >= 0.9
    || (Math.abs(shot.curve || 0) >= 0.68 && shot.diagnostics?.wallLane === "AROUND")
  ));
  if (replayable) startReplay();
  else showBreakdown();`;
const newFinish = `  renderHud();
  const resultMessage = resultBannerForShot(shot, points);
  showResult(resultMessage, miss);
  setPhase("result");
  elements.phaseTitle.textContent = outcomeHeading(shot);
  elements.phaseHelp.textContent = resultMessage;
  elements.shotAction.textContent = "RESULT";
  elements.shotAction.disabled = true;
  playOutcomeSound(shot.outcome, { topCorner: shot.topCorner, saveType: shot.saveType });

  state.presentation = {
    ...state.presentation,
    phase: "result",
    resultAt: performance.now(),
    outcome: shot.outcome,
    saveType: shot.saveType,
    topCorner: shot.topCorner,
    resultHoldMs: 760,
    breakdown: buildBreakdown(shot)
  };

  const replayable = Boolean(shot.outcome === "GOAL" && (
    shot.topCorner
    || shot.strikeQuality >= 0.9
    || (Math.abs(shot.curve || 0) >= 0.68 && shot.diagnostics?.wallLane === "AROUND")
  ));
  state.presentationTimeout = setTimeout(() => {
    if (state.presentation?.phase !== "result") return;
    clearResultBanner();
    elements.shotAction.disabled = false;
    if (replayable) startReplay();
    else showBreakdown();
  }, 760);`;
files.runtime = replaceOnce(files.runtime, oldFinish, newFinish, "hold outcome before breakdown/replay");

for (const key of ["base", "bridgeV9", "genV15", "genV17", "bridgeV17", "runtime"]) {
  if (!files[key].includes("40.2.1")) throw new Error(`V40.2C patch failed: ${key} missing cache baseline`);
  files[key] = files[key].replaceAll("40.2.1", "40.2.2");
}

files.app = files.app.replaceAll("40.2.1", "40.2.2");
files.app = replaceOnce(files.app, "// Football Lab V40.2B integrated goal bay refinement", "// Football Lab V40.2C natural goalmouth and outcome feedback", "app header");
files.app = replaceOnce(files.app, 'badge.textContent = "V40.2B";', 'badge.textContent = "V40.2C";', "app badge");
files.app = replaceOnce(files.app, '          goalBackdrop: "transparent-feathered-integrated-stadium-recess",', '          goalBackdrop: "no-rectangle-soft-radial-keeper-contrast",', "release goal backdrop");
files.app = replaceOnce(files.app, '          keeperBackdropContrast: "soft-centre-lane-no-hard-slab",', '          keeperBackdropContrast: "radial-continuous-stadium-no-block",', "release keeper contrast");
files.app = replaceOnce(files.app, '          advertisingArchitecture: "muted-side-only-feathered-to-goalmouth",', '          advertisingArchitecture: "muted-side-only-clear-goalmouth",\n          outcomeFeedback: "impact-hold-then-clear-goal-save-post-bar-block-wide-banner",', "release outcome feedback");
files.app = replaceOnce(files.app, "        window.__footballLabReleaseV402B = release;", "        window.__footballLabReleaseV402B = release;\n        window.__footballLabReleaseV402C = release;", "release public marker");

files.sw = replaceOnce(files.sw, "// Football Lab V40.2B integrated goal bay cache reset", "// Football Lab V40.2C natural goalmouth and outcome feedback cache reset", "sw header");
files.sw = replaceOnce(files.sw, 'const CACHE_NAME = "football-lab-shell-v40-2-1";', 'const CACHE_NAME = "football-lab-shell-v40-2-2";', "sw cache name");
files.sw = files.sw.replaceAll("40.2.1", "40.2.2");

for (const [key, path] of Object.entries(paths)) fs.writeFileSync(path, files[key]);
console.log("Applied Football Lab V40.2C natural goalmouth and outcome feedback");
