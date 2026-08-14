import fs from "node:fs";

const paths = {
  base: "game/runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js",
  bridgeV9: "game/runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js",
  genV15: "game/runtime-v23-generated-render-v15-v1731-1b04a249af.js",
  genV17: "game/runtime-v23-generated-render-v17-v1731-7f257084b1.js",
  hero: "game/runtime-v23-generated-hero-kicker-v17-3-1-7c97a59e31.js",
  bridgeV17: "game/runtime-v23-bridge-render-v17-3-1-64b7ab3399.js",
  runtime: "game/runtime-v23-main.js",
  app: "app.js",
  sw: "sw.js"
};

const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]));

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`V38.7.2 patch failed: ${label}`);
  return text.replace(from, to);
}

// Premium match-ball refinement: retain strong black/white readability without a reticle-like rim.
files.base = replaceOnce(files.base,
  'ctx.strokeStyle = "rgba(25,29,27,.28)";\n  ctx.lineWidth = Math.max(0.45, radius * 0.055);',
  'ctx.strokeStyle = "rgba(25,29,27,.20)";\n  ctx.lineWidth = Math.max(0.4, radius * 0.045);',
  "soften panel seams");
files.base = replaceOnce(files.base,
  'drawPanelPentagon(0, 0, radius * 0.285, 0, "#101312");',
  'drawPanelPentagon(0, 0, radius * 0.275, 0, "#141715");',
  "central black panel refinement");
files.base = replaceOnce(files.base,
  'drawPanelPentagon(cx, cy, radius * 0.17, angle + Math.PI / 5, "#171a18");',
  'drawPanelPentagon(cx, cy, radius * 0.165, angle + Math.PI / 5, "#1a1d1b");',
  "outer black panel refinement");
files.base = replaceOnce(files.base,
  'ctx.strokeStyle = "rgba(4,8,6,.92)";\n  ctx.lineWidth = Math.max(0.8, radius * 0.105);',
  'ctx.strokeStyle = "rgba(4,8,6,.72)";\n  ctx.lineWidth = Math.max(0.65, radius * 0.078);',
  "soften ball outer rim");
files.base = replaceOnce(files.base,
  'ctx.fillStyle = "rgba(255,255,255,.42)";',
  'ctx.fillStyle = "rgba(255,255,255,.30)";',
  "soften ball highlight");

// Retire every later ball-shaped presentation pass. The base premium match ball is authoritative.
files.genV17 = replaceOnce(files.genV17,
  '  drawBallEnergy(time);\n  drawContactFx(time);',
  '  // V38.7.2: the base premium match ball is the only rendered football.\n  // Legacy circular ball-energy and radial contact-orb passes are retired.',
  "retire V17 circular ball-energy/contact overlays");
files.hero = replaceOnce(files.hero,
  '  transform(); impactFx(time, p, camera);',
  '  transform(); // V38.7.2: ball-shaped contact ring retired; base renderer owns ball/contact readability.',
  "retire hero ball contact ring");

// Cache-bust the entire renderer graph down to the modified base and hero files.
files.bridgeV9 = files.bridgeV9.replaceAll('v=38.7.1', 'v=38.7.2');
files.genV15 = files.genV15.replaceAll('v=38.7.1', 'v=38.7.2');
files.genV17 = files.genV17.replaceAll('v=38.7.1', 'v=38.7.2');
files.bridgeV17 = files.bridgeV17.replaceAll('v=38.7.1', 'v=38.7.2');
files.bridgeV17 = files.bridgeV17.replace('./runtime-v23-generated-hero-kicker-v17-3-1-7c97a59e31.js?v=32.4', './runtime-v23-generated-hero-kicker-v17-3-1-7c97a59e31.js?v=38.7.2');
files.runtime = files.runtime.replace('./runtime-v23-bridge-render-v17-3-1-64b7ab3399.js?v=38.7.1', './runtime-v23-bridge-render-v17-3-1-64b7ab3399.js?v=38.7.2');

files.app = files.app.replace('Football Lab V38.7.1 single ball integrity and premium match ball', 'Football Lab V38.7.2 true single-ball renderer');
files.app = files.app.replaceAll('38.7.1', '38.7.2');
files.app = files.app.replace('ballPresentation: "single-crisp-black-white-panel-match-ball-subtle-tapered-ribbon",', 'ballPresentation: "one-authoritative-black-white-panel-match-ball-no-circular-ghost-overlays",\n          singleBallRenderer: "base-scene-authoritative",\n          legacyBallEnergy: "retired",\n          legacyContactOrb: "retired",');
files.app = files.app.replace('        window.__footballLabReleaseV3871 = release;', '        window.__footballLabReleaseV3871 = release;\n        window.__footballLabReleaseV3872 = release;');

files.sw = files.sw.replace('football-lab-shell-v38-1-5', 'football-lab-shell-v38-7-2');
files.sw = files.sw.replace('"./app.js?v=36.3"', '"./app.js?v=38.7.2"');

for (const [key, path] of Object.entries(paths)) fs.writeFileSync(path, files[key]);
console.log("Applied Football Lab V38.7.2 true single-ball renderer");
