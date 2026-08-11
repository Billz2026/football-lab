const loaderUrl = new URL("./render-v11-4-base.js?v=114", import.meta.url);
const response = await fetch(loaderUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V11.4 renderer loader (${response.status})`);
let loaderSource = await response.text();

const baseRendererUrl = new URL("./render-v11-3-base.js?v=113", import.meta.url).href;
const characterModuleUrl = new URL("./characters-v13.js?v=32.3", import.meta.url).href;
const keeperModuleUrl = new URL("./keepers-v14.js?v=32.3", import.meta.url).href;
const wallModuleUrl = new URL("./walls-v15.js?v=32.3", import.meta.url).href;

const oldSourceUrl = 'const sourceUrl = new URL("./render-v11-3-base.js?v=113", import.meta.url);';
const newSourceUrl = `const sourceUrl = new URL("${baseRendererUrl}");`;
if (!loaderSource.includes(oldSourceUrl)) {
  throw new Error("V15 renderer patch failed: V11.3 source URL not found");
}
loaderSource = loaderSource.replace(oldSourceUrl, newSourceUrl);

const insertionPoint = "// Blob modules need absolute dependency URLs because their own URL has no directory.";
if (!loaderSource.includes(insertionPoint)) {
  throw new Error("V15 renderer patch failed: insertion point not found");
}

const identityPatch = `
// V15 actor identities and wall layouts retain the proven V11.4 single-pass animation rig.
replaceRequired(
  "ability renderer imports",
  'import { playKickSound } from "./audio-v6.js?v=7";',
  'import { playKickSound } from "./audio-v6.js?v=7";\\nimport { activeCharacter } from "${characterModuleUrl}";\\nimport { keeperForStage } from "${keeperModuleUrl}";\\nimport { wallForStage, buildWallLayout } from "${wallModuleUrl}";'
);
replaceRequired(
  "selected kicker appearance",
  '  drawArticulated(\\n    world,\\n    kickerPose(progress, time),\\n    {\\n      shirt: "#dafe4d",\\n      shorts: "#111a14",\\n      skin: "#c99774",\\n      shoe: "#07110b"\\n    },\\n    1.82\\n  );',
  '  const character = activeCharacter();\\n  const pose = kickerPose(progress, time);\\n  pose.number = character.number;\\n  drawArticulated(\\n    world,\\n    pose,\\n    {\\n      shirt: character.accent,\\n      shorts: "#111a14",\\n      skin: "#c99774",\\n      shoe: "#07110b"\\n    },\\n    1.82\\n  );'
);
replaceRequired(
  "keeper profile start",
  'function keeperState(progress, time) {\\n  const idle = keeperWorld(state.currentStage);\\n  const plan = state.shot?.keeperPlan;',
  'function keeperState(progress, time) {\\n  const keeperProfile = keeperForStage(state.stage);\\n  const plan = state.shot?.keeperPlan;\\n  const baseIdle = keeperWorld(state.currentStage);\\n  const idle = plan?.start || {\\n    ...baseIdle,\\n    z: baseIdle.z + keeperProfile.modifiers.forwardStart\\n  };'
);
replaceRequired(
  "keeper kit identity",
  'function drawKeeper(time) {\\n  const progress = progressAt(time);\\n  const keeper = keeperState(progress, time);\\n  drawArticulated(\\n    keeper.world,\\n    keeper.pose,\\n    {\\n      shirt: "#dafe4d",\\n      shorts: "#16231b",\\n      skin: "#c99774",\\n      arm: "#f5f7f1",\\n      shoe: "#07110b"\\n    },\\n    1.9\\n  );\\n  drawKeeperContactPulse(time);\\n}',
  'function drawKeeper(time) {\\n  const progress = progressAt(time);\\n  const keeper = keeperState(progress, time);\\n  const keeperProfile = keeperForStage(state.stage);\\n  drawArticulated(\\n    keeper.world,\\n    keeper.pose,\\n    {\\n      shirt: keeperProfile.accent,\\n      shorts: keeperProfile.shorts,\\n      skin: "#c99774",\\n      arm: "#f5f7f1",\\n      shoe: "#07110b"\\n    },\\n    keeperProfile.visualHeight\\n  );\\n  drawKeeperContactPulse(time);\\n}'
);

replaceRequired(
  "wall layout helper marker",
  'function pathRatioAtWall() {',
  'function currentWallTargetX() {\\n  const shot = state.shot;\\n  if (Number.isFinite(shot?.actualX)) return -GOAL.halfWidth + shot.actualX * GOAL.width;\\n  if (Number.isFinite(shot?.aimX)) return -GOAL.halfWidth + shot.aimX * GOAL.width;\\n  return state.currentStage.protectedGoalX || 0;\\n}\\n\\nfunction activeWallLayout() {\\n  return buildWallLayout(state.currentStage, state.stage, {\\n    targetX: currentWallTargetX(),\\n    curve: state.shot?.curve ?? 0\\n  });\\n}\\n\\nfunction pathRatioAtWall() {'
);
if (!source.includes('const wall = buildWall(state.currentStage);')) {
  throw new Error("V15 renderer patch failed: wall construction calls missing");
}
source = source.replaceAll('const wall = buildWall(state.currentStage);', 'const wall = activeWallLayout();');
replaceRequired(
  "spray line width",
  '  const half = ((wall.players.length - 1) * 0.58) / 2 + 0.45;',
  '  const half = ((wall.players.length - 1) * wall.spacing) / 2 + 0.45;'
);
replaceRequired(
  "wall profile pose",
  '  const flight = progress.motionFlight;\\n  const centreIndex = (count - 1) / 2;\\n  const stagger = (index - centreIndex) * 0.007;\\n  const passRatio = clamp(pathRatioAtWall() + stagger, 0.1, 0.88);\\n  const anticipation = smooth01((flight - (passRatio - 0.23)) / 0.14);\\n  const jump = pulse01((flight - (passRatio - 0.12)) / 0.24);\\n  const landing = pulse01((flight - (passRatio + 0.1)) / 0.3);',
  '  const flight = progress.motionFlight;\\n  const wallProfile = wallForStage(state.stage);\\n  const modifiers = wallProfile.modifiers;\\n  const centreIndex = (count - 1) / 2;\\n  const stagger = (index - centreIndex) * modifiers.staggerTiming\\n    + (index % 2 === 0 ? -modifiers.alternateDelay : modifiers.alternateDelay);\\n  const passRatio = clamp(pathRatioAtWall() - modifiers.jumpLead + stagger, 0.1, 0.88);\\n  const anticipation = smooth01((flight - (passRatio - 0.23)) / 0.14);\\n  const jump = pulse01((flight - (passRatio - 0.12)) / Math.max(0.18, modifiers.jumpWindow * 1.5));\\n  const landing = pulse01((flight - (passRatio + 0.1)) / 0.3);\\n  const jumpPattern = modifiers.jumpPattern[index % modifiers.jumpPattern.length] || 1;'
);
replaceRequired(
  "wall jump profile",
  '    crouch: 0.025 + anticipation * 0.13 + landing * 0.105,\\n    lift: Math.max(0, jump) * 0.118,',
  '    crouch: 0.025 + anticipation * 0.13 + landing * 0.105,\\n    lift: Math.max(0, jump) * 0.118 * modifiers.jumpMultiplier * jumpPattern,'
);
replaceRequired(
  "wall renderer profile",
  'function drawWall(time) {\\n  const progress = progressAt(time);\\n  const wall = activeWallLayout();\\n  const sorted = [...wall.players].sort((a, b) => b.z - a.z);',
  'function drawWall(time) {\\n  const progress = progressAt(time);\\n  const wall = activeWallLayout();\\n  const wallProfile = wallForStage(state.stage);\\n  const sorted = [...wall.players].sort((a, b) => b.z - a.z);'
);
replaceRequired(
  "wall kit and height",
  '      {\\n        shirt: player.index % 2 ? "#294337" : "#355044",\\n        shorts: "#101a13",\\n        skin: "#c99774"\\n      },\\n      1.84',
  '      {\\n        shirt: player.index % 2 ? wallProfile.secondary : wallProfile.accent,\\n        shorts: "#101a13",\\n        skin: "#c99774"\\n      },\\n      wallProfile.playerHeight'
);

`;
loaderSource = loaderSource.replace(insertionPoint, identityPatch + insertionPoint);
loaderSource += "\n//# sourceURL=football-lab-render-v15-loader-generated.js\n";

const loaderModuleUrl = URL.createObjectURL(new Blob([loaderSource], { type: "text/javascript" }));
let generated;
try {
  generated = await import(loaderModuleUrl);
} finally {
  URL.revokeObjectURL(loaderModuleUrl);
}

export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
