import fs from "node:fs";

const paths = {
  keeper: "game/keeper-visuals-v38-1.js",
  base: "game/runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js",
  bridgeV9: "game/runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js",
  genV15: "game/runtime-v23-generated-render-v15-v1731-1b04a249af.js",
  genV17: "game/runtime-v23-generated-render-v17-v1731-7f257084b1.js",
  bridgeV17: "game/runtime-v23-bridge-render-v17-3-1-64b7ab3399.js",
  runtime: "game/runtime-v23-main.js",
  app: "app.js"
};

const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]));

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`V38.5.2 patch failed: ${label}`);
  return text.replace(from, to);
}

files.keeper = replaceOnce(files.keeper, 'const BUILD = "38.5.1";', 'const BUILD = "38.5.2";', "keeper build marker");
files.keeper = replaceOnce(files.keeper, '    wallLayering: "readability-overlay",', '    wallLayering: "scene-depth-before-wall",', "keeper frame depth metadata");

const sceneHook = `function drawPremiumKeeperInScene(time) {
  if (state.screen !== "game" || !state.currentStage) return false;
  const progress = progressAt(time);
  const camera = cameraForFrame(time);
  const keeper = premiumKeeperState(progress, time);
  const profile = keeperForStage(state.stage);

  drawPremiumKeeperRig(keeper.world, keeper.pose, profile, camera);
  window.__footballLabPremiumKeeperSceneFrameV3852 = {
    build: BUILD,
    time,
    keeper,
    profile: profile.id,
    motion: keeper.pose?.motion || "READY",
    airborne: Number(keeper.world?.y) > 0.02,
    order: "goal-keeper-wall-ball"
  };
  window.__footballLabKeeperMotionV32 = {
    profile: profile.id,
    motion: keeper.pose?.motion || "READY",
    airborne: Number(keeper.world?.y) > 0.02,
    recovering: Boolean(progress.settle > 0),
    outcome: state.shot?.outcome || null,
    sceneDepth: true
  };
  return true;
}

`;
files.keeper = replaceOnce(
  files.keeper,
  '}\nfunction renderPremiumKeeper(time) {',
  `}\n\n${sceneHook}function renderPremiumKeeper(time) {`,
  "premium in-scene hook"
);

files.keeper = replaceOnce(
  files.keeper,
  '    keeperWallReadability: "post-wall-overlay",',
  '    keeperWallReadability: "true-scene-depth-before-wall",',
  "release wall layering metadata"
);
files.keeper = replaceOnce(
  files.keeper,
  '    keeperBallLayering: "ball-redrawn-above-keeper",',
  '    keeperBallLayering: "normal-ball-layer-with-catch-lock",',
  "release ball layering metadata"
);
files.keeper = replaceOnce(
  files.keeper,
  '    cacheGeneration: "38.5.1"',
  '    cacheGeneration: "38.5.2"',
  "keeper cache metadata"
);
files.keeper = replaceOnce(
  files.keeper,
  'patchLegacyKeeperRenderer();',
  'window.__footballLabPremiumKeeperSceneFrameV3852 = null;\nwindow.__footballLabPremiumKeeperSceneDrawV3852 = drawPremiumKeeperInScene;\nwindow.__footballLabKeeperPostSceneOverlayDisabledV3852 = true;',
  "disable post-scene keeper overlay"
);
files.keeper = replaceOnce(
  files.keeper,
  '  motionCorrection: "38.5.1-weight-depth-lateral",',
  '  motionCorrection: "38.5.2-true-scene-depth",',
  "public motion correction metadata"
);
files.keeper = replaceOnce(files.keeper, '  visualScale: 1.18,', '  visualScale: 1.20,', "public visual scale");
files.keeper = replaceOnce(files.keeper, '  wallReadabilityOverlay: true,', '  wallReadabilityOverlay: false,\n  trueSceneDepth: true,\n  keeperSceneOrder: "goal-keeper-wall-ball",', "public true-depth metadata");
files.keeper += '\nwindow.__footballLabKeeperVisualsV3852 = Object.freeze({ ...window.__footballLabKeeperVisualsV385, build: BUILD, trueSceneDepth: true, postSceneOverlay: false, legacyCanvasMonkeyPatch: false });\n';

files.base = replaceOnce(
  files.base,
  'function drawKeeper(time) {\n  const progress = progressAt(time);',
  `function drawKeeper(time) {
  const premiumSceneDraw = window.__footballLabPremiumKeeperSceneDrawV3852;
  if (typeof premiumSceneDraw === "function") {
    try {
      if (premiumSceneDraw(time)) return;
    } catch (error) {
      console.error("Football Lab V38.5.2 in-scene keeper failed; falling back to legacy rig", error);
    }
  }
  const progress = progressAt(time);`,
  "base keeper scene-slot delegation"
);

const catchLock = `  const premiumKeeperFrame = window.__footballLabPremiumKeeperSceneFrameV3852;
  if (
    state.animation
    && state.shot?.outcome === "SAVE"
    && state.shot?.saveType === "CATCH"
    && premiumKeeperFrame
    && Math.abs(Number(premiumKeeperFrame.time) - Number(time)) < 0.5
    && pathProgress >= impactRatio()
    && premiumKeeperFrame.keeper?.pose?.catchBallWorld
  ) {
    const lock = smooth01((pathProgress - impactRatio()) / 0.055);
    const held = premiumKeeperFrame.keeper.pose.catchBallWorld;
    world = {
      x: lerp(world.x, held.x, lock),
      y: lerp(world.y, held.y, lock),
      z: lerp(world.z, held.z, lock)
    };
  }

`;
files.base = replaceOnce(
  files.base,
  '  if (state.animation && pathProgress > 0.035) drawTrail(pathProgress);',
  `${catchLock}  if (state.animation && pathProgress > 0.035) drawTrail(pathProgress);`,
  "base ball catch lock"
);

files.bridgeV9 = replaceOnce(files.bridgeV9, './runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js?v=32.4', './runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js?v=38.5.2', "bridge v9 base cache version");
files.genV15 = replaceOnce(files.genV15, './runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js?v=32.4', './runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js?v=38.5.2', "generated v15 bridge cache version");
files.genV17 = replaceOnce(files.genV17, './runtime-v23-generated-render-v15-v1731-1b04a249af.js?v=32.4', './runtime-v23-generated-render-v15-v1731-1b04a249af.js?v=38.5.2', "generated v17 cache version");
files.bridgeV17 = replaceOnce(files.bridgeV17, './runtime-v23-generated-render-v17-v1731-7f257084b1.js?v=32.4', './runtime-v23-generated-render-v17-v1731-7f257084b1.js?v=38.5.2', "bridge v17 cache version");
files.runtime = replaceOnce(files.runtime, './runtime-v23-bridge-render-v17-3-1-64b7ab3399.js?v=32.4', './runtime-v23-bridge-render-v17-3-1-64b7ab3399.js?v=38.5.2', "runtime render cache version");
files.app = replaceOnce(files.app, './game/runtime-v23-main.js?v=35.1', './game/runtime-v23-main.js?v=38.5.2', "app runtime cache version");
files.app = replaceOnce(files.app, './game/keeper-visuals-v38-1.js?v=38.5.1', './game/keeper-visuals-v38-1.js?v=38.5.2', "app keeper cache version");
files.app = replaceOnce(files.app, '      .then(() => import("./game/keeper-halo-hotfix-v38-1-1.js?v=38.1.1"))\n', '', "retire legacy keeper halo canvas interceptor");

for (const [key, path] of Object.entries(paths)) fs.writeFileSync(path, files[key]);
console.log("Applied Football Lab V38.5.2 true keeper depth/layering");
