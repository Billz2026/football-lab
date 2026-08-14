import fs from "node:fs";

const paths = {
  base: "game/runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js",
  bridgeV9: "game/runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js",
  genV15: "game/runtime-v23-generated-render-v15-v1731-1b04a249af.js",
  genV17: "game/runtime-v23-generated-render-v17-v1731-7f257084b1.js",
  bridgeV17: "game/runtime-v23-bridge-render-v17-3-1-64b7ab3399.js",
  runtime: "game/runtime-v23-main.js",
  flight: "game/flight-v33.js",
  audio: "game/audio-v32.js",
  app: "app.js"
};

const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]));

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`V38.6 patch failed: ${label}`);
  return text.replace(from, to);
}

// Camera: keep aim untouched; tighten only once the ball is in flight.
files.base = replaceOnce(
  files.base,
  '    camera.position.z -= follow * (progress.replay ? 4.6 : 3.3);\n    camera.position.y += follow * 0.2;\n    camera.fovY = lerp(camera.fovY, progress.replay ? 28.5 : 31.5, follow * 0.72);',
  '    camera.position.z -= follow * (progress.replay ? 4.9 : 3.8);\n    camera.position.y += follow * 0.24;\n    camera.fovY = lerp(camera.fovY, progress.replay ? 27.8 : 30.4, follow * 0.76);',
  "base camera push"
);
files.base = replaceOnce(files.base, 'camera.target.x = lerp(camera.target.x, ball.x, follow * 0.68);', 'camera.target.x = lerp(camera.target.x, ball.x, follow * 0.76);', "camera x follow");
files.base = replaceOnce(files.base, 'camera.target.y = lerp(camera.target.y, ball.y, follow * 0.56);', 'camera.target.y = lerp(camera.target.y, ball.y, follow * 0.64);', "camera y follow");
files.base = replaceOnce(files.base, 'follow * (1 - progress.motionFlight) * 0.42', 'follow * (1 - progress.motionFlight) * 0.36', "camera z target follow");

// Net: carry the deformation into settle so goals visibly hit the net instead of flashing through it.
files.base = replaceOnce(
  files.base,
  '  const ripplePhase = state.animation && state.shot.outcome === "GOAL"\n    ? clamp((progress.motionFlight - impact) / Math.max(0.045, 1 - impact), 0, 1)\n    : 0;\n  const rippleEnergy = ripplePhase > 0\n    ? Math.sin(ripplePhase * Math.PI) * (0.42 + clamp((state.shot.speedMps || 0) / 42, 0, 1) * 0.24)\n    : 0;',
  '  const goalImpactActive = Boolean(state.animation && state.shot.outcome === "GOAL" && progress.motionFlight >= impact);\n  const impactFlightTail = goalImpactActive\n    ? clamp((progress.motionFlight - impact) / Math.max(0.028, 1 - impact), 0, 1)\n    : 0;\n  const rippleClock = impactFlightTail * 0.28 + progress.settle * 0.72;\n  const speedEnergy = 0.52 + clamp((state.shot.speedMps || 0) / 42, 0, 1) * 0.34;\n  const rippleEnergy = goalImpactActive\n    ? Math.max(0, Math.exp(-rippleClock * 1.45) * speedEnergy * (0.72 + Math.cos(rippleClock * TAU * 2.2) * 0.28))\n    : 0;',
  "persistent net ripple"
);
files.base = replaceOnce(files.base, 'lineWorld({ x, y: 0.04, z: backZ - ripple * 0.42 }, { x, y: GOAL.height, z: -ripple }, 0.75, net);', 'lineWorld({ x, y: 0.04, z: backZ - ripple * 0.58 }, { x, y: GOAL.height, z: -ripple * 0.14 }, 0.82, net);', "vertical net deformation");
files.base = replaceOnce(files.base, 'lineWorld({ x: left, y, z: 0 }, { x: right, y, z: backZ - ripple }, 0.75, net);', 'lineWorld({ x: left, y, z: -ripple * 0.08 }, { x: right, y, z: backZ - ripple * 1.08 }, 0.82, net);', "horizontal net deformation");

// Ball readability: keep scale physical but establish a minimum readable match-ball silhouette.
files.base = replaceOnce(files.base, '  const radius = clamp(projected.scale * 0.105, 3.5, 10.2);', '  const radius = clamp(projected.scale * 0.112, 4.8, 11.4);', "ball radius");
files.base = replaceOnce(
  files.base,
  '  ctx.save();\n  ctx.globalAlpha = 0.22;\n  ctx.fillStyle = "#000";',
  '  const contactImpact = state.animation && ["SAVE", "POST", "BAR"].includes(state.shot?.outcome)\n    ? Math.max(0, 1 - Math.abs(pathProgress - impactRatio()) / 0.026)\n    : 0;\n  const squashX = 1 + contactImpact * 0.16;\n  const squashY = 1 - contactImpact * 0.2;\n\n  ctx.save();\n  ctx.globalCompositeOperation = "screen";\n  ctx.fillStyle = `rgba(244,255,235,${0.1 + clamp((state.shot?.speedMps || 0) / 42, 0, 1) * 0.12})`;\n  ctx.shadowColor = "rgba(218,254,77,.22)";\n  ctx.shadowBlur = 7;\n  ctx.beginPath();\n  ctx.arc(projected.x, projected.y, radius * 1.48, 0, TAU);\n  ctx.fill();\n  ctx.restore();\n\n  ctx.save();\n  ctx.globalAlpha = 0.22;\n  ctx.fillStyle = "#000";',
  "ball tracking halo"
);
files.base = replaceOnce(files.base, '  ctx.arc(projected.x, projected.y, radius, 0, TAU);\n  ctx.fill();', '  ctx.ellipse(projected.x, projected.y, radius * squashX, radius * squashY, 0, 0, TAU);\n  ctx.fill();\n  ctx.strokeStyle = "rgba(5,13,8,.72)";\n  ctx.lineWidth = 1.05;\n  ctx.stroke();', "ball body squash and outline");
files.base = replaceOnce(files.base, '    const px = projected.x + Math.cos(angle) * radius * 0.38;\n    const py = projected.y + Math.sin(angle) * radius * 0.38;', '    const px = projected.x + Math.cos(angle) * radius * 0.38 * squashX;\n    const py = projected.y + Math.sin(angle) * radius * 0.38 * squashY;', "ball panel squash");

// Continuous curved ribbon beneath the existing ghost points makes curl readable at a glance.
files.base = replaceOnce(
  files.base,
  '  const trailCount = 12 + Math.round(speed * 7);',
  '  const trailCount = 12 + Math.round(speed * 7);\n  const ribbon = [];\n  for (let index = trailCount; index >= 1; index -= 1) {\n    const world = sampleShotPath(state.shot.path, clamp(progress - index * (0.009 + speed * 0.0045), 0, 1));\n    if (!world) continue;\n    const projected = projectWorld(world, activeCamera, viewport);\n    if (projected.visible) ribbon.push(projected);\n  }\n  if (ribbon.length > 1) {\n    ctx.strokeStyle = `rgba(236,255,223,${0.12 + speed * 0.08})`;\n    ctx.lineWidth = clamp(1.15 + speed * 0.72, 1.25, 2.2);\n    ctx.lineCap = "round";\n    ctx.lineJoin = "round";\n    ctx.shadowColor = "rgba(218,254,77,.2)";\n    ctx.shadowBlur = 5;\n    ctx.beginPath();\n    ribbon.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));\n    ctx.stroke();\n    ctx.shadowBlur = 0;\n  }',
  "continuous flight ribbon"
);

const impactFx = `\nfunction drawShotImpactFx(time) {\n  if (!state.animation || !state.shot?.path?.length) return;\n  const outcome = state.shot.outcome;\n  if (!["GOAL", "SAVE", "POST", "BAR", "WALL"].includes(outcome)) return;\n  const progress = progressAt(time);\n  const ratio = impactRatio();\n  if (progress.motionFlight < ratio) return;\n  const flightTail = clamp((progress.motionFlight - ratio) / Math.max(0.025, 1 - ratio), 0, 1);\n  const age = progress.motionFlight < 0.999 ? flightTail * 0.24 : 0.24 + progress.settle * 0.76;\n  if (age >= 1) return;\n\n  const impactWorld = outcome === "SAVE" && state.shot.keeperPlan?.contact\n    ? state.shot.keeperPlan.contact\n    : Number.isInteger(state.shot.impactIndex)\n      ? state.shot.path[state.shot.impactIndex]\n      : state.shot.path[state.shot.path.length - 1];\n  if (!impactWorld) return;\n  const point = projectWorld(impactWorld, activeCamera, viewport);\n  if (!point.visible) return;\n\n  const palette = outcome === "SAVE" ? "156,225,255"\n    : outcome === "GOAL" ? "218,254,77"\n      : outcome === "POST" || outcome === "BAR" ? "255,235,177"\n        : "244,247,240";\n  const fade = Math.max(0, 1 - age);\n  const radius = 9 + age * (outcome === "POST" || outcome === "BAR" ? 34 : 27);\n\n  ctx.save();\n  ctx.globalCompositeOperation = "screen";\n  const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 1.65);\n  glow.addColorStop(0, `rgba(${palette},${0.27 * fade})`);\n  glow.addColorStop(1, `rgba(${palette},0)`);\n  ctx.fillStyle = glow;\n  ctx.fillRect(point.x - radius * 2, point.y - radius * 2, radius * 4, radius * 4);\n  ctx.strokeStyle = `rgba(${palette},${0.5 * fade})`;\n  ctx.lineWidth = outcome === "SAVE" ? 1.7 : 1.35;\n  ctx.beginPath();\n  ctx.arc(point.x, point.y, radius, 0, TAU);\n  ctx.stroke();\n\n  const particleCount = outcome === "POST" || outcome === "BAR" ? 9 : outcome === "SAVE" ? 6 : 4;\n  for (let index = 0; index < particleCount; index += 1) {\n    const angle = -2.7 + index * (TAU / particleCount) + age * 0.38;\n    const distance = 8 + age * (18 + (index % 3) * 5);\n    const length = 4 + (index % 3) * 2.5;\n    ctx.strokeStyle = `rgba(${palette},${fade * (0.2 + (index % 2) * 0.12)})`;\n    ctx.lineWidth = 1.1;\n    ctx.beginPath();\n    ctx.moveTo(point.x + Math.cos(angle) * distance, point.y + Math.sin(angle) * distance);\n    ctx.lineTo(point.x + Math.cos(angle) * (distance + length), point.y + Math.sin(angle) * (distance + length));\n    ctx.stroke();\n  }\n  ctx.restore();\n}\n`;
files.base = replaceOnce(files.base, '\nexport function drawScene(time, finishShot) {', `${impactFx}\nexport function drawScene(time, finishShot) {`, "impact fx function");
files.base = replaceOnce(files.base, '  drawBall(time, finishShot);\n}', '  drawBall(time, finishShot);\n  drawShotImpactFx(time);\n}\n\nwindow.__footballLabBallImpactV386 = Object.freeze({ build: "38.6.0", readableBall: true, continuousCurlRibbon: true, persistentNetRipple: true, impactFx: true, physicsChanged: false, outcomeChanged: false });', "impact fx scene call");

// Flight shaping remains deterministic and endpoint-preserving, but curl reads more clearly.
files.flight = replaceOnce(files.flight, 'const BUILD = "33.2.0";', 'const BUILD = "38.6.0";', "flight build");
files.flight = replaceOnce(files.flight, '  const minimumCurvePeak = curveMagnitude * (0.34 + distanceYards * 0.018);', '  const minimumCurvePeak = curveMagnitude * (0.42 + distanceYards * 0.021);', "minimum visual curve");
files.flight = replaceOnce(files.flight, '      ? 0.62\n      : 0.72;', '      ? 0.68\n      : 0.79;', "curve outcome blend");
files.flight = replaceOnce(files.flight, '50 + (targetX - 0.5) * 18', '50 + (targetX - 0.5) * 22', "camera target origin");
files.flight = replaceOnce(files.flight, '    + focus * (replay ? 0.124 : 0.088)\n    + latePush * (replay ? 0.012 : 0.009);', '    + focus * (replay ? 0.138 : 0.108)\n    + latePush * (replay ? 0.016 : 0.013);', "flight css push");
files.flight = replaceOnce(files.flight, '  const settleLift = focus * (replay ? 0.35 : 0.18);', '  const settleLift = focus * (replay ? 0.3 : 0.12);', "camera settle lift");
files.flight = replaceOnce(files.flight, '  camera: "target-biased-late-flight-push"', '  camera: "cinematic-target-biased-ball-follow",\n  readableCurl: true,\n  presentationOnly: true', "flight metadata");

// Impact audio: stronger glove slap, net thump and frame ring, still synthetic/lightweight.
files.audio = replaceOnce(files.audio, '    noise({ duration: 0.24, volume: 0.052, delay: delaySeconds, frequency: 2100, q: 0.48 });', '    noise({ duration: 0.28, volume: 0.064, delay: delaySeconds, frequency: 1760, q: 0.46 });\n    noise({ duration: 0.09, volume: 0.032, delay: delaySeconds + 0.012, frequency: 720, q: 0.62 });', "goal net impact audio");
files.audio = replaceOnce(files.audio, '    noise({ duration: 0.14, volume: 0.06, delay: delaySeconds, frequency: 580, q: 0.62, pan: 0.12 });\n    tone({ frequency: 138, endFrequency: 72, duration: 0.16, type: "triangle", volume: 0.058, delay: delaySeconds });', '    noise({ duration: 0.13, volume: 0.072, delay: delaySeconds, frequency: 760, q: 0.58, pan: 0.12 });\n    noise({ duration: 0.07, volume: 0.03, delay: delaySeconds + 0.008, frequency: 1850, q: 0.9, pan: 0.12 });\n    tone({ frequency: 124, endFrequency: 64, duration: 0.17, type: "triangle", volume: 0.06, delay: delaySeconds });', "save glove impact audio");
files.audio = replaceOnce(files.audio, '    tone({ frequency: outcome === "BAR" ? 1260 : 1040, endFrequency: 710, duration: 0.38, type: "sine", volume: 0.075, delay: delaySeconds });', '    tone({ frequency: outcome === "BAR" ? 1320 : 1080, endFrequency: 690, duration: 0.42, type: "sine", volume: 0.082, delay: delaySeconds });', "frame impact ring");
files.audio += '\nwindow.__footballLabAudioV386 = Object.freeze({ build: "38.6.0", netImpact: true, gloveSlap: true, frameRing: true });\n';

// Cache-rotate the full render/audio/flight chain so devices cannot keep V38.5.2 visuals.
files.bridgeV9 = replaceOnce(files.bridgeV9, 'v=38.5.2', 'v=38.6.0', "bridge v9 cache");
files.genV15 = replaceOnce(files.genV15, 'v=38.5.2', 'v=38.6.0', "generated v15 cache");
files.genV17 = replaceOnce(files.genV17, 'v=38.5.2', 'v=38.6.0', "generated v17 cache");
files.bridgeV17 = replaceOnce(files.bridgeV17, 'v=38.5.2', 'v=38.6.0', "bridge v17 cache");
files.runtime = replaceOnce(files.runtime, './runtime-v23-bridge-render-v17-3-1-64b7ab3399.js?v=38.5.2', './runtime-v23-bridge-render-v17-3-1-64b7ab3399.js?v=38.6.0', "runtime render cache");
files.runtime = replaceOnce(files.runtime, './audio-v32.js?v=32.4', './audio-v32.js?v=38.6.0', "runtime audio cache");
files.app = replaceOnce(files.app, './game/runtime-v23-main.js?v=38.5.2', './game/runtime-v23-main.js?v=38.6.0', "app runtime cache");
files.app = replaceOnce(files.app, './game/flight-v33.js?v=35.1', './game/flight-v33.js?v=38.6.0', "app flight cache");
files.app = replaceOnce(files.app, './sw.js?v=38.1.1', './sw.js?v=38.6.0', "service worker cache rotation");

for (const [key, path] of Object.entries(paths)) fs.writeFileSync(path, files[key]);
console.log("Applied Football Lab V38.6 ball flight and impact feel");
