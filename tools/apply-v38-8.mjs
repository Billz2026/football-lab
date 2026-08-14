import fs from "node:fs";

const paths = {
  app: "app.js",
  sw: "sw.js",
  runtime: "game/runtime-v23-main.js",
  base: "game/runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js",
  keeper: "game/keeper-visuals-v38-1.js",
  cinematic: "game/runtime-v23-generated-render-v17-v1731-7f257084b1.js",
  matchday: "game/matchday-impact-v32.js",
  presentation: "game/runtime-v23-generated-render-v15-v1731-1b04a249af.js",
  bridgeV9: "game/runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js",
  genV15: "game/runtime-v23-generated-render-v15-v1731-1b04a249af.js",
  genV17: "game/runtime-v23-generated-render-v17-v1731-7f257084b1.js",
  bridgeV17: "game/runtime-v23-bridge-render-v17-3-1-64b7ab3399.js"
};

const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]));

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`V38.8 patch failed: ${label}`);
  return text.replace(from, to);
}

const cinematicHelper = `function cinematicFlightProgress(value) {
  const t = clamp(value, 0, 1);
  if (t <= 0.87) return (t / 0.87) * 0.9;
  return 0.9 + smooth01((t - 0.87) / 0.13) * 0.1;
}

`;

files.base = replaceOnce(
  files.base,
  `function replayPathProgress(value) {
  const t = clamp(value, 0, 1);
  if (t < 0.67) return easeOutCubic(t / 0.67) * 0.82;
  return 0.82 + smooth01((t - 0.67) / 0.33) * 0.18;
}

`,
  `function replayPathProgress(value) {
  const t = clamp(value, 0, 1);
  if (t < 0.67) return easeOutCubic(t / 0.67) * 0.82;
  return 0.82 + smooth01((t - 0.67) / 0.33) * 0.18;
}

${cinematicHelper}`,
  "base cinematic flight helper"
);
files.base = replaceOnce(files.base, `    motionFlight: replay ? replayPathProgress(flight) : flight,`, `    motionFlight: replay ? replayPathProgress(flight) : cinematicFlightProgress(flight),`, "base final-flight remap");
files.base = replaceOnce(files.base, `  const speedEnergy = 0.52 + clamp((state.shot.speedMps || 0) / 42, 0, 1) * 0.34;`, `  const speedEnergy = 0.6 + clamp((state.shot.speedMps || 0) / 42, 0, 1) * 0.42;`, "net energy");
files.base = replaceOnce(files.base, `    ? Math.max(0, Math.exp(-rippleClock * 1.45) * speedEnergy * (0.72 + Math.cos(rippleClock * TAU * 2.2) * 0.28))`, `    ? Math.max(0, Math.exp(-rippleClock * 1.22) * speedEnergy * (0.7 + Math.cos(rippleClock * TAU * 2.15) * 0.3))`, "net decay");
files.base = replaceOnce(files.base, `    lineWorld({ x, y: 0.04, z: backZ - ripple * 0.58 }, { x, y: GOAL.height, z: -ripple * 0.14 }, 0.82, net);`, `    lineWorld({ x, y: 0.04, z: backZ - ripple * 0.72 }, { x, y: GOAL.height, z: -ripple * 0.18 }, 0.82, net);`, "vertical net displacement");
files.base = replaceOnce(files.base, `    lineWorld({ x: left, y, z: -ripple * 0.08 }, { x: right, y, z: backZ - ripple * 1.08 }, 0.82, net);`, `    lineWorld({ x: left, y, z: -ripple * 0.1 }, { x: right, y, z: backZ - ripple * 1.3 }, 0.82, net);`, "horizontal net displacement");

files.keeper = replaceOnce(
  files.keeper,
  `function replayPathProgress(value) {
  const t = clamp(value, 0, 1);
  if (t < 0.67) return easeOutCubic(t / 0.67) * 0.82;
  return 0.82 + smooth01((t - 0.67) / 0.33) * 0.18;
}

`,
  `function replayPathProgress(value) {
  const t = clamp(value, 0, 1);
  if (t < 0.67) return easeOutCubic(t / 0.67) * 0.82;
  return 0.82 + smooth01((t - 0.67) / 0.33) * 0.18;
}

${cinematicHelper}`,
  "keeper cinematic flight helper"
);
files.keeper = replaceOnce(files.keeper, `    motionFlight: replay ? replayPathProgress(flight) : flight,`, `    motionFlight: replay ? replayPathProgress(flight) : cinematicFlightProgress(flight),`, "keeper final-flight remap");

files.cinematic = replaceOnce(
  files.cinematic,
  `function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

`,
  `function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

${cinematicHelper}`,
  "cinematic layer helper"
);
files.cinematic = replaceOnce(files.cinematic, `    : flight;`, `    : cinematicFlightProgress(flight);`, "cinematic layer motion remap");

files.matchday = replaceOnce(
  files.matchday,
  `function smooth(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

`,
  `function smooth(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function cinematicFlightProgress(value) {
  const t = clamp(value, 0, 1);
  if (t <= 0.87) return (t / 0.87) * 0.9;
  return 0.9 + smooth((t - 0.87) / 0.13) * 0.1;
}

`,
  "matchday cinematic helper"
);
files.matchday = replaceOnce(files.matchday, `  const flight = clamp((elapsed - flightStart) / flightDuration, 0, 1);
  return {
    elapsed,
    flight,`, `  const rawFlight = clamp((elapsed - flightStart) / flightDuration, 0, 1);
  const replay = Boolean(animation.isReplay);
  const flight = replay ? rawFlight : cinematicFlightProgress(rawFlight);
  return {
    elapsed,
    flight,`, "matchday visual flight");
files.matchday = replaceOnce(files.matchday, `    replay: Boolean(animation.isReplay)`, `    replay`, "matchday replay variable");
files.matchday = replaceOnce(files.matchday, `  drawOutcomeCallout(progress);`, `  // V38.8: keep the decisive glove/net/frame contact unobstructed; one result label follows after the hold.`, "retire flight outcome callout");
files.matchday = replaceOnce(files.matchday, `  outcomeCallouts: true,`, `  outcomeCallouts: false,
  cleanImpactFrame: true,
  cinematicFinalApproach: true,`, "matchday metadata");

const titleBlock = `  const titleDelay = presentation.outcome === "SAVE" ? 175 : 145;
  if (elapsed > titleDelay) {
    const titleProgress = clamp((elapsed - titleDelay) / 245, 0, 1);
    const scale = 0.86 + titleProgress * 0.14;
    const alpha = Math.min(1, titleProgress * 2.4) * (1 - clamp((elapsed - 465) / 145, 0, 1));
    ctx.globalAlpha = alpha;
    ctx.translate(WORLD.width * 0.5, WORLD.height * 0.31);
    ctx.scale(scale, scale);
    ctx.textAlign = "center";
    ctx.font = "1000 58px system-ui";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(2,7,4,.7)";
    const title = resultTitle(presentation.outcome, presentation.saveType, presentation.topCorner);
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = palette.primary;
    ctx.fillText(title, 0, 0);
  }
`;
files.presentation = replaceOnce(files.presentation, titleBlock, `  // V38.8: no result typography during the impact hold. The normal result banner is authoritative.\n`, "retire pre-result canvas title");

const runtimeHelper = `function cinematicFlightProgress(value) {
  const t = Math.max(0, Math.min(1, value));
  if (t <= 0.87) return (t / 0.87) * 0.9;
  const u = Math.max(0, Math.min(1, (t - 0.87) / 0.13));
  const smooth = u * u * (3 - 2 * u);
  return 0.9 + smooth * 0.1;
}

function visualTimeRatioForPath(pathRatio) {
  const target = Math.max(0, Math.min(1, pathRatio));
  let low = 0;
  let high = 1;
  for (let index = 0; index < 16; index += 1) {
    const mid = (low + high) / 2;
    if (cinematicFlightProgress(mid) < target) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

`;
files.runtime = replaceOnce(files.runtime, `function settleDurationForShot(shot) {`, `${runtimeHelper}function settleDurationForShot(shot) {`, "runtime visual timing helpers");
files.runtime = replaceOnce(files.runtime, `  if (shot.outcome === "SAVE") return 390;
  if (shot.outcome === "WALL") return 300;
  if (shot.outcome === "POST" || shot.outcome === "BAR") return 310;
  return 260;`, `  if (shot.outcome === "SAVE") return 410;
  if (shot.outcome === "WALL") return 310;
  if (shot.outcome === "POST" || shot.outcome === "BAR") return 330;
  return 285;`, "clean impact hold durations");
files.runtime = replaceOnce(files.runtime, `  const impactDelayMs = runUpDuration + contactHoldDuration + flightDuration * impactRatio;`, `  const impactTimeRatio = visualTimeRatioForPath(impactRatio);
  const impactDelayMs = runUpDuration + contactHoldDuration + flightDuration * impactTimeRatio;`, "visual impact scheduling");
files.runtime = replaceOnce(files.runtime, `    topCorner: state.shot.topCorner
  };`, `    topCorner: state.shot.topCorner,
    impactHoldMs: 220,
    cinematicFinalApproach: true,
    impactTimeRatio
  };`, "flight presentation metadata");

for (const key of ["bridgeV9", "bridgeV17", "runtime"]) {
  files[key] = files[key].replaceAll("?v=38.7.2", "?v=38.8.0");
}
files.presentation = files.presentation.replaceAll("?v=38.7.2", "?v=38.8.0");
files.cinematic = files.cinematic.replaceAll("?v=38.7.2", "?v=38.8.0");
files.genV15 = files.presentation;
files.genV17 = files.cinematic;
files.bridgeV17 = files.bridgeV17.replace('./matchday-impact-v32.js?v=32.4', './matchday-impact-v32.js?v=38.8.0');
files.bridgeV17 = files.bridgeV17.replace('./runtime-v23-generated-hero-kicker-v17-3-1-7c97a59e31.js?v=38.7.2', './runtime-v23-generated-hero-kicker-v17-3-1-7c97a59e31.js?v=38.8.0');

files.app = files.app.replaceAll("38.7.2", "38.8.0");
files.app = files.app.replace("// Football Lab V38.8.0 true single-ball renderer", "// Football Lab V38.8 cinematic goal/save payoff");
files.app = files.app.replace('badge.textContent = "V38.7";', 'badge.textContent = "V38.8";');
files.app = files.app.replace('./game/keeper-visuals-v38-1.js?v=38.5.2', './game/keeper-visuals-v38-1.js?v=38.8.0');
files.app = files.app.replace('          cameraImpactHold: "through-settle",', '          cameraImpactHold: "clean-contact-before-result",\n          cinematicFinalApproach: "final-13-percent-subtle-time-remap",\n          resultReveal: "single-authoritative-banner-after-impact-hold",\n          duplicateImpactLabels: "retired",');
files.app = files.app.replace('          netPresentation: "localised-persistent-impact-ripple",', '          netPresentation: "stronger-localised-persistent-impact-ripple",');
files.app = files.app.replace('        window.__footballLabReleaseV3872 = release;', '        window.__footballLabReleaseV3872 = release;\n        window.__footballLabReleaseV388 = release;');

files.sw = files.sw.replace('// Football Lab V38.7.1 single ball integrity cache reset', '// Football Lab V38.8 cinematic payoff cache reset');
files.sw = files.sw.replace('football-lab-shell-v38-7-1', 'football-lab-shell-v38-8-0');
files.sw = files.sw.replace('./app.js?v=38.7.1', './app.js?v=38.8.0');

const written = new Set();
for (const [key, path] of Object.entries(paths)) {
  if (written.has(path)) continue;
  fs.writeFileSync(path, files[key]);
  written.add(path);
}
console.log("Applied Football Lab V38.8 cinematic goal/save payoff");
