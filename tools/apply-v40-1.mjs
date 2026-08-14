import fs from "node:fs";

const paths = {
  app: "app.js",
  sw: "sw.js",
  runtime: "game/runtime-v23-main.js",
  bridgeV17: "game/runtime-v23-bridge-render-v17-3-1-64b7ab3399.js",
  genV17: "game/runtime-v23-generated-render-v17-v1731-7f257084b1.js",
  genV15: "game/runtime-v23-generated-render-v15-v1731-1b04a249af.js",
  bridgeV9: "game/runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js",
  base: "game/runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js"
};

const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]));

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`V40.1 patch failed: ${label}`);
  return text.replace(from, to);
}

function replaceSection(text, startMarker, endMarker, replacement, label) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`V40.1 patch failed: ${label} start`);
  const end = text.indexOf(endMarker, start);
  if (end < 0) throw new Error(`V40.1 patch failed: ${label} end`);
  return text.slice(0, start) + replacement + text.slice(end);
}

const premiumPitch = `function pitchDetailTier() {
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches || false;
  const rect = elements.canvas.getBoundingClientRect();
  const pixels = Math.max(1, rect.width * rect.height * Math.min(window.devicePixelRatio || 1, 2));
  return coarse || pixels > 1550000 ? 1 : 2;
}

const PITCH_SURFACES = Object.freeze({
  academy: Object.freeze({ base: "#1d6238", dark: "rgba(3,32,17,.075)", light: "rgba(225,255,204,.034)", grain: "rgba(219,247,193,.16)" }),
  city: Object.freeze({ base: "#315d35", dark: "rgba(31,29,8,.075)", light: "rgba(255,231,178,.034)", grain: "rgba(230,225,170,.14)" }),
  night: Object.freeze({ base: "#154735", dark: "rgba(0,16,19,.09)", light: "rgba(176,222,214,.032)", grain: "rgba(186,230,211,.13)" }),
  storm: Object.freeze({ base: "#204f3b", dark: "rgba(4,27,28,.09)", light: "rgba(197,226,211,.03)", grain: "rgba(203,229,211,.12)" }),
  world: Object.freeze({ base: "#285638", dark: "rgba(17,13,25,.08)", light: "rgba(244,224,174,.03)", grain: "rgba(226,220,178,.12)" }),
  summit: Object.freeze({ base: "#214d3f", dark: "rgba(3,24,27,.085)", light: "rgba(204,238,224,.032)", grain: "rgba(204,233,220,.13)" })
});

function paintPitchLine(a, b, width = 1.6) {
  lineWorld(a, b, width + 1.3, "rgba(4,31,17,.28)");
  lineWorld(a, b, width, "rgba(242,255,238,.82)");
}

function turfPatch(cx, cz, radiusX, radiusZ, colour, segments = 16) {
  const points = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * TAU;
    points.push({
      x: cx + Math.cos(angle) * radiusX,
      y: 0.006,
      z: cz + Math.sin(angle) * radiusZ
    });
  }
  polygonWorld(points, colour);
}

function drawPitch() {
  const nearZ = activeCamera.position.z - 0.32;
  const surface = PITCH_SURFACES[state.currentStage.environment] || PITCH_SURFACES.academy;
  const quality = pitchDetailTier();

  polygonWorld([
    { x: -PITCH.halfWidth, y: 0, z: -4 },
    { x: PITCH.halfWidth, y: 0, z: -4 },
    { x: PITCH.halfWidth, y: 0, z: nearZ },
    { x: -PITCH.halfWidth, y: 0, z: nearZ }
  ], surface.base);

  // Cross-pitch mowing: broader near the camera, tighter toward goal through perspective.
  for (let z = -4, index = 0; z < nearZ; z += 3.45, index += 1) {
    const next = Math.min(nearZ, z + 3.45);
    const depth = clamp((z + 4) / Math.max(1, nearZ + 4), 0, 1);
    const fill = index % 2
      ? surface.light.replace(/\.[0-9]+\)$/, (0.026 + depth * 0.018).toFixed(3) + ")")
      : surface.dark.replace(/\.[0-9]+\)$/, (0.05 + depth * 0.035).toFixed(3) + ")");
    polygonWorld([
      { x: -PITCH.halfWidth, y: 0.002, z },
      { x: PITCH.halfWidth, y: 0.002, z },
      { x: PITCH.halfWidth, y: 0.002, z: next },
      { x: -PITCH.halfWidth, y: 0.002, z: next }
    ], fill);
  }

  // Longitudinal mower passes break up the old flat horizontal-band look.
  const laneWidth = quality === 2 ? 5.4 : 7.2;
  for (let x = -PITCH.halfWidth, index = 0; x < PITCH.halfWidth; x += laneWidth, index += 1) {
    const next = Math.min(PITCH.halfWidth, x + laneWidth);
    polygonWorld([
      { x, y: 0.003, z: -3.95 },
      { x: next, y: 0.003, z: -3.95 },
      { x: next, y: 0.003, z: nearZ },
      { x, y: 0.003, z: nearZ }
    ], index % 2 ? "rgba(255,255,232,.010)" : "rgba(0,16,8,.018)");
  }

  // Controlled goalmouth light: depth through contrast, not blanket brightness.
  for (let z = -2.6, band = 0; z < 8.2; z += 2.7, band += 1) {
    const next = z + 2.7;
    const alpha = Math.max(0.008, 0.026 - band * 0.0032);
    polygonWorld([
      { x: -PITCH.halfWidth, y: 0.004, z },
      { x: PITCH.halfWidth, y: 0.004, z },
      { x: PITCH.halfWidth, y: 0.004, z: next },
      { x: -PITCH.halfWidth, y: 0.004, z: next }
    ], "rgba(225,255,205," + alpha.toFixed(3) + ")");
  }

  // Deterministic micro turf. No per-frame randomness, and reduced count on Fold/coarse devices.
  const tuftCount = quality === 2 ? 72 : 30;
  const zSpan = Math.max(12, nearZ + 3.2);
  for (let index = 0; index < tuftCount; index += 1) {
    const x = -PITCH.halfWidth + 0.8 + ((index * 17.31 + 3.7) % Math.max(2, PITCH.halfWidth * 2 - 1.6));
    const z = -3.2 + ((index * 11.47 + 1.9) % zSpan);
    const point = projectWorld({ x, y: 0.018, z }, activeCamera, viewport);
    if (!point.visible || point.y < 290 || point.y > WORLD.height - 18) continue;
    const depthFade = clamp((point.y - 280) / 520, 0.18, 1);
    ctx.strokeStyle = surface.grain.replace(/\.[0-9]+\)$/, (0.05 + depthFade * 0.12).toFixed(3) + ")");
    ctx.lineWidth = quality === 2 ? 0.75 : 0.62;
    ctx.beginPath();
    ctx.moveTo(point.x - 1.5 * depthFade, point.y + 0.4);
    ctx.lineTo(point.x + 1.1 * depthFade, point.y - 1.3 * depthFade);
    ctx.stroke();
  }

  // Wear stays localized: free-kick setup and goalmouth, never a dirty all-over texture.
  const ballStart = ballWorld(state.currentStage);
  turfPatch(ballStart.x, ballStart.z, 0.48, 0.29, "rgba(92,82,44,.095)", quality === 2 ? 18 : 12);
  turfPatch(ballStart.x + 0.32, ballStart.z + 0.18, 0.35, 0.2, "rgba(214,205,139,.035)", 12);
  turfPatch(-1.35, 0.85, 1.15, 0.72, "rgba(94,82,48,.052)", quality === 2 ? 18 : 12);
  turfPatch(1.35, 0.85, 1.15, 0.72, "rgba(94,82,48,.052)", quality === 2 ? 18 : 12);
  turfPatch(0, 1.8, 2.45, 1.05, "rgba(214,205,139,.018)", 18);

  // Painted markings use a soft dark under-stroke so they sit on the turf rather than float above it.
  paintPitchLine({ x: -PITCH.halfWidth, y: 0.015, z: 0 }, { x: PITCH.halfWidth, y: 0.015, z: 0 }, 1.72);
  const penalty = PITCH.penaltyHalfWidth;
  paintPitchLine({ x: -penalty, y: 0.015, z: 0 }, { x: -penalty, y: 0.015, z: PITCH.penaltyDepth }, 1.62);
  paintPitchLine({ x: penalty, y: 0.015, z: 0 }, { x: penalty, y: 0.015, z: PITCH.penaltyDepth }, 1.62);
  paintPitchLine({ x: -penalty, y: 0.015, z: PITCH.penaltyDepth }, { x: penalty, y: 0.015, z: PITCH.penaltyDepth }, 1.62);

  const six = PITCH.sixYardHalfWidth;
  paintPitchLine({ x: -six, y: 0.018, z: 0 }, { x: -six, y: 0.018, z: PITCH.sixYardDepth }, 1.42);
  paintPitchLine({ x: six, y: 0.018, z: 0 }, { x: six, y: 0.018, z: PITCH.sixYardDepth }, 1.42);
  paintPitchLine({ x: -six, y: 0.018, z: PITCH.sixYardDepth }, { x: six, y: 0.018, z: PITCH.sixYardDepth }, 1.42);

  const spot = projectWorld({ x: 0, y: 0.025, z: PITCH.penaltySpotZ }, activeCamera, viewport);
  if (spot.visible) {
    ctx.fillStyle = "rgba(5,32,18,.28)";
    ctx.beginPath();
    ctx.arc(spot.x + 0.7, spot.y + 0.8, Math.max(1.7, spot.scale * 0.076), 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(244,255,241,.88)";
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, Math.max(1.25, spot.scale * 0.064), 0, TAU);
    ctx.fill();
  }

  const arcPoints = [];
  for (let angle = Math.PI * 0.13; angle <= Math.PI * 0.87; angle += Math.PI / 54) {
    const point = {
      x: Math.cos(angle) * PITCH.arcRadius,
      y: 0.02,
      z: PITCH.penaltySpotZ + Math.sin(angle) * PITCH.arcRadius
    };
    if (point.z >= PITCH.penaltyDepth - 0.08) arcPoints.push(point);
  }
  ctx.beginPath();
  let started = false;
  for (const point of arcPoints) {
    const projected = projectWorld(point, activeCamera, viewport);
    if (!projected.visible) continue;
    started ? ctx.lineTo(projected.x, projected.y) : ctx.moveTo(projected.x, projected.y);
    started = true;
  }
  if (started) {
    ctx.strokeStyle = "rgba(4,31,17,.28)";
    ctx.lineWidth = 2.75;
    ctx.stroke();
    ctx.strokeStyle = "rgba(242,255,238,.82)";
    ctx.lineWidth = 1.52;
    ctx.stroke();
  }

  window.__footballLabPitchV401 = {
    build: "40.1.0",
    surface: state.currentStage.environment || "academy",
    mowing: "cross-cut-depth-graded",
    grain: "deterministic-device-scaled",
    wear: "free-kick-and-goalmouth-localized",
    paintedLines: "understroke-plus-bright-paint",
    quality: quality === 2 ? "full" : "fold-mobile"
  };
}

`;

files.base = replaceSection(files.base, 'function drawPitch() {', 'function drawGoal(time) {', premiumPitch, 'premium pitch renderer');

for (const key of ["runtime", "bridgeV17", "genV17", "genV15", "bridgeV9"]) {
  if (!files[key].includes("39.1.0")) throw new Error(`V40.1 patch failed: ${key} cache marker`);
  files[key] = files[key].replaceAll("39.1.0", "40.1.0");
}

files.app = replaceOnce(files.app, '// Football Lab V39.1 plant lock and motion cleanup', '// Football Lab V40.1 premium pitch', 'app header');
files.app = files.app.replaceAll("39.1.0", "40.1.0");
files.app = replaceOnce(files.app, 'badge.textContent = "V39.1";', 'badge.textContent = "V40.1";', 'build badge');
files.app = replaceOnce(
  files.app,
  '          upperBodyCounterRotation: "shoulder-arm-momentum-through-follow-through",\n          characterRendering: "refined-proportions-grounded-shadows",',
  '          upperBodyCounterRotation: "shoulder-arm-momentum-through-follow-through",\n          characterRendering: "refined-proportions-grounded-shadows",\n          pitchSurface: "depth-graded-procedural-turf",\n          pitchMowing: "cross-cut-directional-bands",\n          pitchWear: "localized-free-kick-and-goalmouth",\n          pitchLighting: "controlled-goalmouth-falloff",\n          pitchQualityScaling: "fold-mobile-reduced-micro-detail",',
  'app pitch release metadata'
);
files.app = replaceOnce(files.app, '        window.__footballLabReleaseV391 = release;', '        window.__footballLabReleaseV391 = release;\n        window.__footballLabReleaseV401 = release;', 'app V40.1 release alias');

files.sw = replaceOnce(files.sw, '// Football Lab V38.8 cinematic payoff cache reset', '// Football Lab V40.1 premium pitch cache reset', 'service worker header');
files.sw = files.sw.replaceAll("39-1-0", "40-1-0").replaceAll("39.1.0", "40.1.0");

for (const [key, path] of Object.entries(paths)) fs.writeFileSync(path, files[key]);
console.log("Applied Football Lab V40.1 premium pitch");
