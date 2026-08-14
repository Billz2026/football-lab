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
  if (!text.includes(from)) throw new Error(`V40.2A patch failed: ${label}`);
  return text.replace(from, to);
}

const backdrop = `function drawGoalBackdropV402A() {
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
  const padX = goalSpan * 0.2;
  const x = clamp(minX - padX, 120, WORLD.width - 320);
  const right = clamp(maxX + padX, x + 260, WORLD.width - 120);
  const y = clamp(minY - 24, 205, 330);
  const bottom = clamp(maxY + 18, y + 92, 386);
  const width = right - x;
  const height = bottom - y;

  ctx.save();
  roundedRect(x, y, width, height, 10);
  ctx.clip();

  const recess = ctx.createLinearGradient(0, y, 0, bottom);
  recess.addColorStop(0, "rgba(3,11,8,.985)");
  recess.addColorStop(0.55, "rgba(5,17,12,.97)");
  recess.addColorStop(1, "rgba(1,8,5,.99)");
  ctx.fillStyle = recess;
  ctx.fillRect(x, y, width, height);

  const centreShade = ctx.createRadialGradient((x + right) / 2, y + height * 0.55, 12, (x + right) / 2, y + height * 0.55, width * 0.54);
  centreShade.addColorStop(0, "rgba(0,0,0,.32)");
  centreShade.addColorStop(0.58, "rgba(0,0,0,.12)");
  centreShade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = centreShade;
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = "rgba(195,225,190,.045)";
  ctx.lineWidth = 1;
  const panelCount = 7;
  for (let index = 1; index < panelCount; index += 1) {
    const panelX = x + (width * index) / panelCount;
    ctx.beginPath();
    ctx.moveTo(panelX, y + 8);
    ctx.lineTo(panelX, bottom - 6);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(218,254,77,.11)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 7);
  ctx.lineTo(right - 12, y + 7);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = "rgba(214,238,207,.10)";
  ctx.lineWidth = 1;
  roundedRect(x + 0.5, y + 0.5, width - 1, height - 1, 10);
  ctx.stroke();

  window.__footballLabGoalBackdropV402A = {
    build: "40.2A",
    left: x,
    right,
    top: y,
    bottom,
    width,
    goalSpan,
    advertisingClear: true,
    keeperContrast: "recessed-matte-dark"
  };
}

`;

files.base = replaceOnce(
  files.base,
  '}\n\nfunction pitchDetailTier() {',
  `}\n\n${backdrop}function pitchDetailTier() {`,
  "base backdrop insertion"
);
files.base = replaceOnce(
  files.base,
  '  drawBackground();\n  drawPitch();',
  '  drawBackground();\n  drawGoalBackdropV402A();\n  drawPitch();',
  "base backdrop draw order"
);

const oldAds = `  ctx.save();
  const ribbon = ctx.createLinearGradient(0, 0, WORLD.width, 0);
  ribbon.addColorStop(0, "rgba(25,75,47,.2)");
  ribbon.addColorStop(0.2, "rgba(218,254,77,.28)");
  ribbon.addColorStop(0.5, "rgba(240,255,205,.12)");
  ribbon.addColorStop(0.8, "rgba(218,254,77,.28)");
  ribbon.addColorStop(1, "rgba(25,75,47,.2)");
  ctx.fillStyle = "rgba(1,8,4,.74)";
  ctx.fillRect(0, 330, WORLD.width, 30);
  ctx.fillStyle = ribbon;
  ctx.fillRect(0, 332, WORLD.width, 2);
  ctx.fillRect(0, 356, WORLD.width, 1);
  ctx.fillStyle = "rgba(239,247,236,.62)";
  ctx.font = "850 9px system-ui";
  ctx.textAlign = "center";
  const offset = (time / 22) % 220;
  for (let x = -220 + offset; x < WORLD.width + 220; x += 220) {
    ctx.fillText("FOOTBALL LAB  •  MASTER THE STRIKE", x, 350);
  }
  ctx.restore();`;

const sideAds = `  const keeperBackdrop = window.__footballLabGoalBackdropV402A;
  const fallbackHalf = 185;
  const cleanLeft = keeperBackdrop?.advertisingClear
    ? clamp(keeperBackdrop.left - 12, 170, WORLD.width * 0.48)
    : WORLD.width / 2 - fallbackHalf;
  const cleanRight = keeperBackdrop?.advertisingClear
    ? clamp(keeperBackdrop.right + 12, WORLD.width * 0.52, WORLD.width - 170)
    : WORLD.width / 2 + fallbackHalf;
  const boardY = 342;
  const boardHeight = 22;
  const offset = (time / 28) % 196;

  const drawSideBoard = (startX, endX) => {
    const width = endX - startX;
    if (width < 48) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX, boardY, width, boardHeight);
    ctx.clip();

    const board = ctx.createLinearGradient(0, boardY, 0, boardY + boardHeight);
    board.addColorStop(0, "rgba(2,12,7,.78)");
    board.addColorStop(1, "rgba(1,7,4,.9)");
    ctx.fillStyle = board;
    ctx.fillRect(startX, boardY, width, boardHeight);

    const ribbon = ctx.createLinearGradient(startX, 0, endX, 0);
    ribbon.addColorStop(0, "rgba(45,92,58,.12)");
    ribbon.addColorStop(0.5, "rgba(218,254,77,.24)");
    ribbon.addColorStop(1, "rgba(45,92,58,.12)");
    ctx.fillStyle = ribbon;
    ctx.fillRect(startX, boardY + 1, width, 1.5);
    ctx.fillStyle = "rgba(220,238,215,.085)";
    ctx.fillRect(startX, boardY + boardHeight - 1, width, 1);

    ctx.fillStyle = "rgba(239,247,236,.50)";
    ctx.font = "820 8px system-ui";
    ctx.textAlign = "center";
    for (let x = startX - 196 + offset; x < endX + 196; x += 196) {
      ctx.fillText("FOOTBALL LAB  •  MASTER THE STRIKE", x, boardY + 15);
    }
    ctx.restore();
  };

  drawSideBoard(0, cleanLeft);
  drawSideBoard(cleanRight, WORLD.width);

  ctx.save();
  ctx.strokeStyle = "rgba(218,254,77,.16)";
  ctx.lineWidth = 1.2;
  for (const x of [cleanLeft, cleanRight]) {
    ctx.beginPath();
    ctx.moveTo(x, boardY + 2);
    ctx.lineTo(x, boardY + boardHeight - 2);
    ctx.stroke();
  }
  ctx.restore();

  window.__footballLabAdvertisingV402A = {
    build: "40.2A",
    layout: "side-only",
    cleanGoalZone: true,
    cleanLeft,
    cleanRight,
    boardY,
    boardHeight
  };`;

files.genV17 = replaceOnce(files.genV17, oldAds, sideAds, "late advertising ribbon replacement");

for (const key of ["runtime", "bridgeV17", "genV17", "genV15", "bridgeV9"]) {
  if (!files[key].includes("40.1.0")) throw new Error(`V40.2A patch failed: ${key} cache marker`);
  files[key] = files[key].replaceAll("40.1.0", "40.2.0");
}

files.app = replaceOnce(files.app, '// Football Lab V40.1 premium pitch', '// Football Lab V40.2A goal backdrop and side advertising', 'app header');
files.app = files.app.replaceAll("40.1.0", "40.2.0");
files.app = replaceOnce(files.app, 'badge.textContent = "V40.1";', 'badge.textContent = "V40.2A";', 'build badge');
files.app = replaceOnce(
  files.app,
  '          pitchQualityScaling: "fold-mobile-reduced-micro-detail",\n          wallMotion:',
  '          pitchQualityScaling: "fold-mobile-reduced-micro-detail",\n          goalBackdrop: "recessed-matte-dark-keeper-clarity-zone",\n          advertisingArchitecture: "side-only-outside-goalmouth",\n          keeperBackdropContrast: "central-board-free",\n          goalLayering: "backdrop-before-pitch-goal-keeper",\n          wallMotion:',
  'release advertising metadata'
);
files.app = replaceOnce(
  files.app,
  '        window.__footballLabReleaseV401 = release;',
  '        window.__footballLabReleaseV401 = release;\n        window.__footballLabReleaseV402A = release;',
  'release V40.2A alias'
);

files.sw = replaceOnce(files.sw, '// Football Lab V40.1 premium pitch cache reset', '// Football Lab V40.2A goal backdrop cache reset', 'service worker header');
files.sw = files.sw.replaceAll("40-1-0", "40-2-0").replaceAll("40.1.0", "40.2.0");

for (const [key, path] of Object.entries(paths)) fs.writeFileSync(path, files[key]);
console.log("Applied Football Lab V40.2A goal backdrop and side advertising architecture");
