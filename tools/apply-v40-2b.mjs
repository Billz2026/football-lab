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
  if (!text.includes(from)) throw new Error(`V40.2B patch failed: ${label}`);
  return text.replace(from, to);
}

function replaceSection(text, startMarker, endMarker, replacement, label) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`V40.2B patch failed: ${label} start`);
  const end = text.indexOf(endMarker, start);
  if (end < 0) throw new Error(`V40.2B patch failed: ${label} end`);
  return text.slice(0, start) + replacement + text.slice(end);
}

const integratedBay = `function drawGoalBackdropV402B() {
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
  const padX = goalSpan * 0.18;
  const x = clamp(minX - padX, 120, WORLD.width - 320);
  const right = clamp(maxX + padX, x + 260, WORLD.width - 120);
  const y = clamp(minY - 18, 210, 332);
  const bottom = clamp(maxY + 14, y + 86, 382);
  const width = right - x;
  const height = bottom - y;
  const feather = clamp(width * 0.16, 28, 58);
  const outerLeft = Math.max(58, x - feather);
  const outerRight = Math.min(WORLD.width - 58, right + feather);
  const centreX = (x + right) / 2;

  ctx.save();

  // Integrated translucent recess: the underlying stadium remains visible.
  const bay = ctx.createLinearGradient(outerLeft, 0, outerRight, 0);
  bay.addColorStop(0, "rgba(12,31,23,0)");
  bay.addColorStop(0.12, "rgba(12,31,23,.055)");
  bay.addColorStop(0.28, "rgba(12,31,23,.16)");
  bay.addColorStop(0.50, "rgba(10,27,20,.245)");
  bay.addColorStop(0.72, "rgba(12,31,23,.16)");
  bay.addColorStop(0.88, "rgba(12,31,23,.055)");
  bay.addColorStop(1, "rgba(12,31,23,0)");
  ctx.fillStyle = bay;
  ctx.fillRect(outerLeft, y, outerRight - outerLeft, height);

  // Soft vertical depth, not a hard slab.
  const depth = ctx.createLinearGradient(0, y, 0, bottom);
  depth.addColorStop(0, "rgba(19,40,31,.08)");
  depth.addColorStop(0.45, "rgba(7,24,17,.13)");
  depth.addColorStop(1, "rgba(4,18,12,.075)");
  ctx.fillStyle = depth;
  ctx.fillRect(x, y, width, height);

  // Keeper clarity is concentrated gently in the centre/lower lane.
  const keeperLane = ctx.createRadialGradient(centreX, y + height * 0.63, 8, centreX, y + height * 0.63, width * 0.5);
  keeperLane.addColorStop(0, "rgba(0,0,0,.13)");
  keeperLane.addColorStop(0.48, "rgba(0,0,0,.065)");
  keeperLane.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = keeperLane;
  ctx.fillRect(outerLeft, y, outerRight - outerLeft, height);

  // Faint upper stadium ribs add architecture without cluttering the keeper/net lane.
  ctx.strokeStyle = "rgba(208,229,203,.038)";
  ctx.lineWidth = 1;
  const ribCount = 8;
  for (let index = 1; index < ribCount; index += 1) {
    const ribX = x + (width * index) / ribCount;
    ctx.beginPath();
    ctx.moveTo(ribX, y + 5);
    ctx.lineTo(ribX, y + height * 0.42);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(218,238,211,.026)";
  ctx.beginPath();
  ctx.moveTo(x + 18, y + height * 0.26);
  ctx.lineTo(right - 18, y + height * 0.26);
  ctx.stroke();

  ctx.restore();

  window.__footballLabGoalBackdropV402B = {
    build: "40.2B",
    left: x,
    right,
    top: y,
    bottom,
    width,
    goalSpan,
    feather,
    outerLeft,
    outerRight,
    advertisingClear: true,
    keeperContrast: "soft-integrated-centre-lane",
    treatment: "transparent-feathered-stadium-recess"
  };
}

`;

files.base = replaceSection(
  files.base,
  'function drawGoalBackdropV402A() {',
  'function pitchDetailTier() {',
  integratedBay,
  'integrated goal bay'
);
files.base = replaceOnce(files.base, '  drawGoalBackdropV402A();', '  drawGoalBackdropV402B();', 'goal bay scene call');

const sideAdvertising = `  const keeperBackdrop = window.__footballLabGoalBackdropV402B;
  const fallbackHalf = 190;
  const cleanLeft = keeperBackdrop?.advertisingClear
    ? clamp(keeperBackdrop.left - keeperBackdrop.feather * 0.22, 160, WORLD.width * 0.48)
    : WORLD.width / 2 - fallbackHalf;
  const cleanRight = keeperBackdrop?.advertisingClear
    ? clamp(keeperBackdrop.right + keeperBackdrop.feather * 0.22, WORLD.width * 0.52, WORLD.width - 160)
    : WORLD.width / 2 + fallbackHalf;
  const boardY = 348;
  const boardHeight = 17;
  const offset = (time / 31) % 210;

  const drawSideBoard = (startX, endX, side) => {
    const width = endX - startX;
    if (width < 48) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX, boardY, width, boardHeight);
    ctx.clip();

    const board = ctx.createLinearGradient(startX, 0, endX, 0);
    if (side === "left") {
      board.addColorStop(0, "rgba(2,12,7,.58)");
      board.addColorStop(0.72, "rgba(2,12,7,.46)");
      board.addColorStop(1, "rgba(2,12,7,.035)");
    } else {
      board.addColorStop(0, "rgba(2,12,7,.035)");
      board.addColorStop(0.28, "rgba(2,12,7,.46)");
      board.addColorStop(1, "rgba(2,12,7,.58)");
    }
    ctx.fillStyle = board;
    ctx.fillRect(startX, boardY, width, boardHeight);

    const ribbon = ctx.createLinearGradient(startX, 0, endX, 0);
    if (side === "left") {
      ribbon.addColorStop(0, "rgba(218,254,77,.10)");
      ribbon.addColorStop(0.76, "rgba(218,254,77,.065)");
      ribbon.addColorStop(1, "rgba(218,254,77,0)");
    } else {
      ribbon.addColorStop(0, "rgba(218,254,77,0)");
      ribbon.addColorStop(0.24, "rgba(218,254,77,.065)");
      ribbon.addColorStop(1, "rgba(218,254,77,.10)");
    }
    ctx.fillStyle = ribbon;
    ctx.fillRect(startX, boardY + 1, width, 1);

    ctx.font = "780 7.4px system-ui";
    ctx.textAlign = "center";
    for (let textX = startX - 210 + offset; textX < endX + 210; textX += 210) {
      const edgeDistance = side === "left" ? endX - textX : textX - startX;
      const edgeFade = clamp(edgeDistance / 72, 0, 1);
      if (edgeFade <= 0.04) continue;
      ctx.fillStyle = "rgba(235,243,232," + (0.34 * edgeFade).toFixed(3) + ")";
      ctx.fillText("FOOTBALL LAB  •  MASTER THE STRIKE", textX, boardY + 12);
    }
    ctx.restore();
  };

  drawSideBoard(0, cleanLeft, "left");
  drawSideBoard(cleanRight, WORLD.width, "right");

  window.__footballLabAdvertisingV402B = {
    build: "40.2B",
    layout: "side-only-feathered",
    cleanGoalZone: true,
    hardDividers: false,
    cleanLeft,
    cleanRight,
    boardY,
    boardHeight,
    tone: "muted-low-profile"
  };
`;

files.genV17 = replaceSection(
  files.genV17,
  '  const keeperBackdrop = window.__footballLabGoalBackdropV402A;',
  '\n}\n\nfunction drawGoalHighlights(time) {',
  sideAdvertising,
  'feathered side advertising'
);

for (const key of ["runtime", "bridgeV17", "genV17", "genV15", "bridgeV9"]) {
  if (!files[key].includes("40.2.0")) throw new Error(`V40.2B patch failed: ${key} cache marker`);
  files[key] = files[key].replaceAll("40.2.0", "40.2.1");
}

files.app = replaceOnce(files.app, '// Football Lab V40.2A goal backdrop and side advertising', '// Football Lab V40.2B integrated goal bay refinement', 'app header');
files.app = files.app.replaceAll("40.2.0", "40.2.1");
files.app = replaceOnce(files.app, 'badge.textContent = "V40.2A";', 'badge.textContent = "V40.2B";', 'build badge');
files.app = replaceOnce(files.app, 'goalBackdrop: "recessed-matte-dark-keeper-clarity-zone",', 'goalBackdrop: "transparent-feathered-integrated-stadium-recess",', 'goal backdrop metadata');
files.app = replaceOnce(files.app, 'advertisingArchitecture: "side-only-outside-goalmouth",', 'advertisingArchitecture: "muted-side-only-feathered-to-goalmouth",', 'advertising metadata');
files.app = replaceOnce(files.app, 'keeperBackdropContrast: "central-board-free",', 'keeperBackdropContrast: "soft-centre-lane-no-hard-slab",', 'keeper backdrop contrast metadata');
files.app = replaceOnce(files.app, 'window.__footballLabReleaseV402A = release;', 'window.__footballLabReleaseV402A = release;\n        window.__footballLabReleaseV402B = release;', 'V40.2B release alias');

files.sw = replaceOnce(files.sw, '// Football Lab V40.2A goal backdrop cache reset', '// Football Lab V40.2B integrated goal bay cache reset', 'service worker header');
files.sw = files.sw.replaceAll("40-2-0", "40-2-1").replaceAll("40.2.0", "40.2.1");

for (const [key, path] of Object.entries(paths)) fs.writeFileSync(path, files[key]);
console.log("Applied Football Lab V40.2B integrated goal bay refinement");
