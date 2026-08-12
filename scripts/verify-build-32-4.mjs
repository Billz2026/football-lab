import fs from "node:fs";
import path from "node:path";

function fakeElement() {
  return {
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {}, dataset: {}, textContent: "", innerHTML: "", disabled: false, hidden: false,
    getContext() { return {}; },
    querySelector() { return fakeElement(); },
    querySelectorAll() { return []; },
    addEventListener() {}, setAttribute() {}, appendChild() {}, after() {}, closest() { return null; }
  };
}

globalThis.window = globalThis;
globalThis.document = {
  querySelector: fakeElement,
  querySelectorAll() { return []; },
  documentElement: fakeElement(),
  body: fakeElement(),
  addEventListener() {},
  createElement: fakeElement
};
globalThis.localStorage = { getItem() { return null; }, setItem() {} };
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
globalThis.requestAnimationFrame = () => 0;
globalThis.CustomEvent = class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };
globalThis.dispatchEvent = () => true;

const core = await import("../game/core-v6.js?v=32.4");
const physics = await import("../game/runtime-v23-bridge-physics-v19-f1d39f9409.js?v=32.4");

const failures = [];
const candidateTargets = [];
for (const x of [0.06, 0.14, 0.24, 0.38, 0.5, 0.62, 0.76, 0.86, 0.94]) {
  for (const y of [0.08, 0.16, 0.26, 0.38, 0.52]) {
    for (const curve of [-1, -0.75, -0.45, 0, 0.45, 0.75, 1]) {
      candidateTargets.push({ x, y, curve });
    }
  }
}

function resolve(stage, candidate, powerOffset = 0, contactOffset = 0, contactQuality = 1) {
  core.state.stage = stage;
  core.syncStage();
  core.state.stageWind = 0;
  core.state.shot = {
    ...core.createShot(),
    power: Math.max(0, Math.min(1, core.idealPower() + powerOffset)),
    aimX: candidate.x,
    aimY: candidate.y,
    curve: candidate.curve,
    contactTiming: 0.5 + contactOffset * 0.5,
    contactOffset,
    contactQuality,
    contactWindow: 0.1
  };
  const flight = physics.resolveShotPhysics();
  return { ...core.state.shot, flightDuration: flight.flightDuration };
}

const viableRoutes = [];
let scoringRoutesFound = 0;
let minimumFlight = Infinity;
let maximumFlight = 0;
for (let stage = 0; stage < 30; stage += 1) {
  const winner = candidateTargets.find((candidate) => resolve(stage, candidate).outcome === "GOAL");
  if (!winner) failures.push(`Stage ${stage + 1} has no clean, deterministic scoring route.`);
  else scoringRoutesFound += 1;
  viableRoutes.push(winner || { x: 0.5, y: 0.2, curve: 0 });
  const sample = resolve(stage, winner || viableRoutes[stage]);
  minimumFlight = Math.min(minimumFlight, sample.flightDuration);
  maximumFlight = Math.max(maximumFlight, sample.flightDuration);
}

const deterministicCandidate = viableRoutes[0];
const early = resolve(0, deterministicCandidate, 0, -0.65, 0.3);
const late = resolve(0, deterministicCandidate, 0, 0.65, 0.3);
const repeatedLate = resolve(0, deterministicCandidate, 0, 0.65, 0.3);
if (JSON.stringify(late) !== JSON.stringify(repeatedLate)) failures.push("Repeated contact input did not resolve identically.");
if (!(early.diagnostics.finalTarget.x < late.diagnostics.finalTarget.x - 0.45)) {
  failures.push("Early and late contact do not produce a legible directional split.");
}
if (minimumFlight < 820) failures.push(`Minimum flight ${minimumFlight} ms is too fast to read.`);

const contactWindow = (stage, curve, mode = "standard", accuracy = 68, composure = 66) => {
  core.state.stage = stage;
  core.syncStage();
  const progress = stage / 29;
  const skillBonus = ((accuracy + composure) / 2 - 72) * 0.0011;
  const curvePenalty = Math.abs(curve) * 0.035;
  const distancePenalty = Math.max(0, (core.state.currentStage.distanceYards - 24) * 0.0014);
  const modeAdjustment = mode === "guided" ? 0.038 : mode === "expert" ? -0.022 : 0;
  return Math.max(0.052, Math.min(0.175,
    0.13 - progress * 0.025 + skillBonus - curvePenalty - distancePenalty + modeAdjustment
  ));
};

const windows = {
  openingStandard: contactWindow(0, 0),
  openingExtremeCurl: contactWindow(0, 1),
  finalStandard: contactWindow(29, 0),
  finalExtremeCurl: contactWindow(29, 1),
  finalGuided: contactWindow(29, 1, "guided"),
  finalExpert: contactWindow(29, 1, "expert")
};
if (!(windows.openingExtremeCurl < windows.openingStandard)) failures.push("Extreme curl does not tighten contact.");
if (!(windows.finalExtremeCurl < windows.openingExtremeCurl)) failures.push("Late stages do not tighten contact.");
if (!(windows.finalGuided > windows.finalExtremeCurl && windows.finalExpert <= windows.finalExtremeCurl)) {
  failures.push("Guided/Standard/Expert contact windows are not ordered correctly.");
}

const queue = ["app.js"];
const visited = new Set();
while (queue.length) {
  const relative = queue.shift();
  if (visited.has(relative)) continue;
  visited.add(relative);
  const source = fs.readFileSync(relative, "utf8");
  for (const match of source.matchAll(/(?:from\s*|import\s*\()\s*["']([^"']+\.js)(\?v=([^"']+))?["']/g)) {
    if (!match[1].startsWith(".")) continue;
    const child = path.normalize(path.join(path.dirname(relative), match[1]));
    if (child.startsWith("game/") && match[3] !== "32.4") {
      failures.push(`${relative} loads ${child} with cache version ${match[3] || "none"}.`);
    }
    queue.push(child);
  }
}

const strikeSource = fs.readFileSync("game/strike-v32-4.js", "utf8");
const renderSource = fs.readFileSync("game/runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js", "utf8");
if (/previewShotPhysics|resolveShotPhysics/.test(strikeSource)) failures.push("Strike UI still solves physics before execution.");
if (!/guideProgress.*expert.*0/.test(renderSource)) failures.push("Expert mode still exposes a launch guide.");

console.log(JSON.stringify({
  build: "32.4.0",
  stagesChecked: 30,
  scoringRoutesFound,
  moduleFilesChecked: visited.size,
  flightRangeMs: [minimumFlight, maximumFlight],
  contactWindows: Object.fromEntries(Object.entries(windows).map(([key, value]) => [key, Number(value.toFixed(3))])),
  deterministicContact: JSON.stringify(late) === JSON.stringify(repeatedLate),
  earlyLateFinishSplitMetres: Number((late.diagnostics.finalTarget.x - early.diagnostics.finalTarget.x).toFixed(3)),
  failures
}, null, 2));

if (failures.length) process.exit(1);
