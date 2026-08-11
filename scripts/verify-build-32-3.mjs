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

const core = await import("../game/core-v6.js?v=32.3");
const physics = await import("../game/runtime-v23-bridge-physics-v19-f1d39f9409.js?v=32.3");
const left = [
  { x: 0.02, y: 0.2, curve: -1 }, { x: 0.08, y: 0.24, curve: -0.95 },
  { x: 0.16, y: 0.2, curve: -1 }, { x: 0.22, y: 0.3, curve: -0.9 },
  { x: 0.08, y: 0.48, curve: -0.9 }, { x: 0.05, y: 0.38, curve: -0.82 }
];
const right = [
  { x: 0.98, y: 0.2, curve: 1 }, { x: 0.92, y: 0.24, curve: 0.95 },
  { x: 0.84, y: 0.2, curve: 1 }, { x: 0.78, y: 0.3, curve: 0.9 },
  { x: 0.7, y: 0.2, curve: 1 }, { x: 0.92, y: 0.48, curve: 0.9 },
  { x: 0.95, y: 0.38, curve: 0.82 }
];

const failures = [];
let minimumFlight = Infinity;
let maximumFlight = 0;

for (let stage = 0; stage < 30; stage += 1) {
  core.state.stage = stage;
  core.syncStage();
  core.state.stageWind = 0;
  const protectedRatio = Math.max(0.18, Math.min(
    0.82,
    ((core.state.currentStage.protectedGoalX || 0) + 3.66) / 7.32
  ));
  const over = [
    { x: protectedRatio, y: 0.1, curve: 0 },
    { x: protectedRatio, y: 0.07, curve: 0 },
    { x: Math.max(0.28, Math.min(0.72, protectedRatio)), y: 0.13, curve: 0 },
    { x: 0.5, y: 0.08, curve: 0 }
  ];
  const preview = (candidate) => physics.previewShotPhysics({
    power: core.idealPower(),
    aimX: candidate.x,
    aimY: candidate.y,
    curve: candidate.curve
  });
  const overhead = over.map(preview).find(
    (shot) => shot.outcome !== "WALL" && shot.diagnostics.wallLane === "OVER"
  );
  const lateral = [...left, ...right].map(preview).find(
    (shot) => shot.outcome !== "WALL" && shot.diagnostics.wallLane === "AROUND"
  );
  if (!overhead) failures.push(`Stage ${stage + 1} has no overhead route.`);
  if (!lateral) failures.push(`Stage ${stage + 1} has no lateral route.`);

  const shotInput = over[0];
  core.state.shot = {
    ...core.createShot(),
    power: core.idealPower(),
    aimX: shotInput.x,
    aimY: shotInput.y,
    curve: shotInput.curve
  };
  const actual = physics.resolveShotPhysics();
  minimumFlight = Math.min(minimumFlight, actual.flightDuration);
  maximumFlight = Math.max(maximumFlight, actual.flightDuration);
}

const finishPoints = [-1, 0, 1].map((curve) => physics.previewShotPhysics({
  power: core.idealPower(), aimX: 0.78, aimY: 0.2, curve
}).diagnostics.finalTarget);
const finishSpread = Math.max(...finishPoints.map(({ x }) => x))
  - Math.min(...finishPoints.map(({ x }) => x));
if (finishSpread > 0.03) failures.push(`Bend moved the selected finish by ${finishSpread.toFixed(3)} m.`);
if (minimumFlight < 820) failures.push(`Minimum flight ${minimumFlight} ms is too fast to read.`);

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
    if (child.startsWith("game/") && match[3] !== "32.3") {
      failures.push(`${relative} loads ${child} with cache version ${match[3] || "none"}.`);
    }
    queue.push(child);
  }
}

const result = {
  stagesChecked: 30,
  moduleFilesChecked: visited.size,
  flightRangeMs: [minimumFlight, maximumFlight],
  bendFinishSpreadMetres: Number(finishSpread.toFixed(3)),
  failures
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
