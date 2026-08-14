import fs from "node:fs";

const paths = {
  base: "game/runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js",
  bridgeV9: "game/runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js",
  genV15: "game/runtime-v23-generated-render-v15-v1731-1b04a249af.js",
  genV17: "game/runtime-v23-generated-render-v17-v1731-7f257084b1.js",
  bridgeV17: "game/runtime-v23-bridge-render-v17-3-1-64b7ab3399.js",
  runtime: "game/runtime-v23-main.js",
  app: "app.js",
  sw: "sw.js",
  index: "index.html"
};

const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]));

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`V38.7.1 patch failed: ${label}`);
  return text.replace(from, to);
}

function replaceSection(text, startMarker, endMarker, replacement, label) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`V38.7.1 patch failed: ${label} start`);
  const end = text.indexOf(endMarker, start);
  if (end < 0) throw new Error(`V38.7.1 patch failed: ${label} end`);
  return text.slice(0, start) + replacement + text.slice(end);
}

const ballHelpers = [
  'function drawPanelPentagon(cx, cy, radius, rotation, fillStyle) {',
  '  ctx.fillStyle = fillStyle;',
  '  ctx.beginPath();',
  '  for (let i = 0; i < 5; i += 1) {',
  '    const angle = rotation - Math.PI / 2 + i * TAU / 5;',
  '    const x = cx + Math.cos(angle) * radius;',
  '    const y = cy + Math.sin(angle) * radius;',
  '    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);',
  '  }',
  '  ctx.closePath();',
  '  ctx.fill();',
  '}',
  '',
  'function drawPremiumMatchBall(projected, radius, pathProgress, contactImpact) {',
  '  const squashX = 1 + contactImpact * 0.075;',
  '  const squashY = 1 - contactImpact * 0.1;',
  '  const speed = clamp((state.shot?.speedMps || 0) / 40, 0, 1);',
  '  const curve = Number(state.shot?.curve) || 0;',
  '  const spinDirection = Math.sign(curve) || 1;',
  '  const rotation = pathProgress * (9.5 + speed * 8.5) * spinDirection;',
  '',
  '  ctx.save();',
  '  ctx.translate(projected.x, projected.y);',
  '  ctx.scale(squashX, squashY);',
  '',
  '  const sphere = ctx.createRadialGradient(-radius * 0.34, -radius * 0.42, radius * 0.05, 0, 0, radius);',
  '  sphere.addColorStop(0, "#ffffff");',
  '  sphere.addColorStop(0.55, "#f3f4f2");',
  '  sphere.addColorStop(0.82, "#d9ddda");',
  '  sphere.addColorStop(1, "#aeb5b0");',
  '  ctx.fillStyle = sphere;',
  '  ctx.beginPath();',
  '  ctx.arc(0, 0, radius, 0, TAU);',
  '  ctx.fill();',
  '',
  '  ctx.save();',
  '  ctx.beginPath();',
  '  ctx.arc(0, 0, radius * 0.965, 0, TAU);',
  '  ctx.clip();',
  '  ctx.rotate(rotation);',
  '',
  '  ctx.strokeStyle = "rgba(25,29,27,.28)";',
  '  ctx.lineWidth = Math.max(0.45, radius * 0.055);',
  '  for (let i = 0; i < 5; i += 1) {',
  '    const angle = -Math.PI / 2 + i * TAU / 5;',
  '    ctx.beginPath();',
  '    ctx.moveTo(Math.cos(angle) * radius * 0.25, Math.sin(angle) * radius * 0.25);',
  '    ctx.quadraticCurveTo(Math.cos(angle + 0.18) * radius * 0.48, Math.sin(angle + 0.18) * radius * 0.48, Math.cos(angle) * radius * 0.64, Math.sin(angle) * radius * 0.64);',
  '    ctx.stroke();',
  '  }',
  '',
  '  drawPanelPentagon(0, 0, radius * 0.285, 0, "#101312");',
  '  for (let i = 0; i < 5; i += 1) {',
  '    const angle = -Math.PI / 2 + i * TAU / 5;',
  '    const cx = Math.cos(angle) * radius * 0.68;',
  '    const cy = Math.sin(angle) * radius * 0.68;',
  '    drawPanelPentagon(cx, cy, radius * 0.17, angle + Math.PI / 5, "#171a18");',
  '  }',
  '  ctx.restore();',
  '',
  '  ctx.strokeStyle = "rgba(4,8,6,.92)";',
  '  ctx.lineWidth = Math.max(0.8, radius * 0.105);',
  '  ctx.beginPath();',
  '  ctx.arc(0, 0, radius * 0.96, 0, TAU);',
  '  ctx.stroke();',
  '',
  '  ctx.fillStyle = "rgba(255,255,255,.42)";',
  '  ctx.beginPath();',
  '  ctx.ellipse(-radius * 0.32, -radius * 0.38, radius * 0.2, radius * 0.12, -0.45, 0, TAU);',
  '  ctx.fill();',
  '  ctx.restore();',
  '}',
  '',
].join('\n');

files.base = replaceOnce(
  files.base,
  'function drawBall(time, finishShot) {',
  ballHelpers + 'function drawBall(time, finishShot) {',
  'insert premium match ball helpers'
);

const newBallRender = [
  '  const radius = clamp(projected.scale * 0.122, 5.2, 12.2);',
  '',
  '  const contactImpact = state.animation && ["SAVE", "POST", "BAR"].includes(state.shot?.outcome)',
  '    ? Math.max(0, 1 - Math.abs(pathProgress - impactRatio()) / 0.022)',
  '    : 0;',
  '',
  '  drawPremiumMatchBall(projected, radius, pathProgress, contactImpact);',
].join('\n');

files.base = replaceSection(
  files.base,
  '  const radius = clamp(projected.scale * 0.112, 4.8, 11.4);',
  '\n}\n\nfunction drawTrail(progress) {',
  newBallRender,
  'replace live ball renderer'
);

const newTrail = [
  'function drawTrail(progress) {',
  '  const speed = clamp((state.shot?.speedMps || 24) / 38, 0.55, 1.25);',
  '  const sampleCount = 18;',
  '  const step = 0.0085 + speed * 0.0035;',
  '  const points = [];',
  '  for (let index = sampleCount; index >= 1; index -= 1) {',
  '    const world = sampleShotPath(state.shot.path, clamp(progress - index * step, 0, 1));',
  '    if (!world) continue;',
  '    const projected = projectWorld(world, activeCamera, viewport);',
  '    if (projected.visible) points.push(projected);',
  '  }',
  '  if (points.length < 2) return;',
  '',
  '  ctx.save();',
  '  ctx.lineCap = "round";',
  '  ctx.lineJoin = "round";',
  '  for (let index = 1; index < points.length; index += 1) {',
  '    const t = index / (points.length - 1);',
  '    const a = points[index - 1];',
  '    const b = points[index];',
  '    ctx.strokeStyle = "rgba(235,242,234," + (0.025 + t * 0.11).toFixed(3) + ")";',
  '    ctx.lineWidth = 0.45 + t * (0.75 + speed * 0.18);',
  '    ctx.beginPath();',
  '    ctx.moveTo(a.x, a.y);',
  '    ctx.lineTo(b.x, b.y);',
  '    ctx.stroke();',
  '  }',
  '  ctx.restore();',
  '}',
].join('\n');

files.base = replaceSection(
  files.base,
  'function drawTrail(progress) {',
  '\n\nfunction drawShotImpactFx(time) {',
  newTrail,
  'replace circular particle trail'
);

for (const key of ["bridgeV9", "genV15", "genV17", "bridgeV17"]) {
  files[key] = files[key].replaceAll('v=38.7.0', 'v=38.7.1');
}
files.runtime = files.runtime.replace('./runtime-v23-bridge-render-v17-3-1-64b7ab3399.js?v=38.7.0', './runtime-v23-bridge-render-v17-3-1-64b7ab3399.js?v=38.7.1');
files.app = files.app.replaceAll('38.7.0', '38.7.1');
files.app = files.app.replace('Football Lab V38.7 flight camera and shot composition', 'Football Lab V38.7.1 single ball integrity and premium match ball');
files.app = files.app.replace('ballPresentation: "readable-match-ball-continuous-curl-ribbon-contact-squash",', 'ballPresentation: "single-crisp-black-white-panel-match-ball-subtle-tapered-ribbon",');
files.app = files.app.replace('        window.__footballLabReleaseV387 = release;', '        window.__footballLabReleaseV387 = release;\n        window.__footballLabReleaseV3871 = release;');
files.sw = files.sw.replace('// Football Lab V38.1.5 stale-script cache reset', '// Football Lab V38.7.1 single ball integrity cache reset');
files.sw = files.sw.replace('const CACHE_NAME = "football-lab-shell-v38-1-5";', 'const CACHE_NAME = "football-lab-shell-v38-7-1";');
files.sw = files.sw.replaceAll('./app.js?v=36.3', './app.js?v=38.7.1');
files.index = files.index.replaceAll('./app.js?v=36.3', './app.js?v=38.7.1');

for (const [key, path] of Object.entries(paths)) fs.writeFileSync(path, files[key]);
console.log('Applied Football Lab V38.7.1 single ball integrity and premium match ball');
