const loaderUrl = new URL("./render-v11-4-base.js?v=114", import.meta.url);
const response = await fetch(loaderUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V11.4 renderer loader (${response.status})`);
let loaderSource = await response.text();

const baseRendererUrl = new URL("./render-v11-3-base.js?v=113", import.meta.url).href;
const characterModuleUrl = new URL("./characters-v13.js?v=32.4", import.meta.url).href;
const keeperModuleUrl = new URL("./keepers-v14.js?v=32.4", import.meta.url).href;
const wallModuleUrl = new URL("./walls-v15.js?v=32.4", import.meta.url).href;

const oldSourceUrl = 'const sourceUrl = new URL("./render-v11-3-base.js?v=113", import.meta.url);';
const newSourceUrl = `const sourceUrl = new URL("${baseRendererUrl}");`;
if (!loaderSource.includes(oldSourceUrl)) {
  throw new Error("V17.1 renderer patch failed: V11.3 source URL not found");
}
loaderSource = loaderSource.replace(oldSourceUrl, newSourceUrl);

const insertionPoint = "// Blob modules need absolute dependency URLs because their own URL has no directory.";
if (!loaderSource.includes(insertionPoint)) {
  throw new Error("V17.1 renderer patch failed: insertion point not found");
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
  throw new Error("V17.1 renderer patch failed: wall construction calls missing");
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

const rigPatch = `
// V17.1 repairs the shared articulated actor geometry.
replaceRequired(
  "actor body anchors",
  '  const pelvis = screenPoint((pose.pelvisX || 0) * h, -0.31 * h + crouch * h * 0.1);\\n  const chest = screenPoint((pose.chestX || 0) * h, -0.66 * h + crouch * h * 0.12);\\n  const head = screenPoint(chest.x + (pose.headX || 0) * h, -0.91 * h + crouch * h * 0.1);\\n  const shoulderHalf = h * 0.13;\\n  const hipHalf = h * 0.075;',
  '  const pelvis = screenPoint((pose.pelvisX || 0) * h, -0.335 * h + crouch * h * 0.09);\\n  const chest = screenPoint((pose.chestX || 0) * h, -0.635 * h + crouch * h * 0.1);\\n  const headRadius = h * 0.068;\\n  const neckBase = screenPoint(chest.x + (pose.headX || 0) * h * 0.2, chest.y - h * 0.025);\\n  const head = screenPoint(neckBase.x + (pose.headX || 0) * h * 0.8, neckBase.y - h * 0.12);\\n  const shoulderHalf = h * 0.118;\\n  const hipHalf = h * 0.068;'
);
replaceRequired(
  "actor neck connection",
  '  drawSegment(leftAnkle, leftToe, legWidth * 0.92, shoe);\\n  drawSegment(rightAnkle, rightToe, legWidth * 0.92, shoe);\\n\\n  ctx.save();',
  '  drawSegment(leftAnkle, leftToe, legWidth * 0.92, shoe);\\n  drawSegment(rightAnkle, rightToe, legWidth * 0.92, shoe);\\n\\n  const neckTop = screenPoint(head.x, head.y + headRadius * 0.74);\\n  drawSegment(neckBase, neckTop, Math.max(3, h * 0.05), skin, "rgba(2,7,4,.72)");\\n\\n  ctx.save();'
);
replaceRequired(
  "actor torso proportions",
  '  roundedRect(-h * 0.15, -h * 0.205, h * 0.3, h * 0.41, h * 0.07);\\n  ctx.fill();\\n  ctx.fillStyle = shirt;\\n  roundedRect(-h * 0.135, -h * 0.19, h * 0.27, h * 0.38, h * 0.06);',
  '  roundedRect(-h * 0.128, -h * 0.178, h * 0.256, h * 0.356, h * 0.055);\\n  ctx.fill();\\n  ctx.fillStyle = shirt;\\n  roundedRect(-h * 0.116, -h * 0.166, h * 0.232, h * 0.332, h * 0.05);'
);
replaceRequired(
  "actor head and hair",
  '  drawJoint(head, h * 0.073, skin);',
  '  drawJoint(head, headRadius, skin, "rgba(2,7,4,.7)");\\n  ctx.fillStyle = colours.hair || "#171713";\\n  ctx.beginPath();\\n  ctx.arc(head.x, head.y - headRadius * 0.12, headRadius * 0.87, Math.PI, TAU);\\n  ctx.fill();'
);
replaceRequired(
  "actor shoulder joints",
  '  const armWidth = Math.max(3.6, h * 0.043);\\n  drawSegment(leftShoulder, leftElbow, armWidth, arm);',
  '  const armWidth = Math.max(3.6, h * 0.043);\\n  drawJoint(leftShoulder, armWidth * 0.66, shirt, "rgba(2,7,4,.72)");\\n  drawJoint(rightShoulder, armWidth * 0.66, shirt, "rgba(2,7,4,.72)");\\n  drawSegment(leftShoulder, leftElbow, armWidth, arm);'
);
replaceRequired(
  "keeper set stance",
  '        leftKnee: { x: -0.13, y: -0.13 },\\n        rightKnee: { x: 0.13, y: -0.13 },\\n        leftHand: { x: -0.31, y: -0.55 },\\n        rightHand: { x: 0.31, y: -0.55 },\\n        glove: "#f7ffd2",\\n        gloveScale: 1.28',
  '        leftKnee: { x: -0.16, y: -0.135 },\\n        rightKnee: { x: 0.16, y: -0.135 },\\n        leftHand: { x: -0.36, y: -0.54 },\\n        rightHand: { x: 0.36, y: -0.54 },\\n        glove: "#f7ffd2",\\n        gloveScale: 1.45'
);
replaceRequired("keeper dive gloves", '      gloveScale: 1.5', '      gloveScale: 1.68');
replaceRequired("keeper visual scale", '    keeperProfile.visualHeight', '    keeperProfile.visualHeight * 1.08');
replaceRequired(
  "wall actor variation",
  '  for (const player of sorted) {\\n    const hit = state.shot.outcome === "WALL" && state.shot.collision?.playerIndex === player.index;\\n    drawArticulated(\\n      player,\\n      wallPose(progress, player.index, wall.players.length, hit),\\n      {\\n        shirt: player.index % 2 ? wallProfile.secondary : wallProfile.accent,\\n        shorts: "#101a13",\\n        skin: "#c99774"\\n      },\\n      wallProfile.playerHeight\\n    );\\n  }',
  '  const skinPalette = ["#c99774", "#9f6f52", "#d6a17a", "#7f543f", "#bd8461"];\\n  const hairPalette = ["#171713", "#211914", "#0e1210", "#30231b"];\\n  const heightPattern = [0.98, 1.025, 1.0, 1.04, 0.97, 1.015, 0.99];\\n  for (const player of sorted) {\\n    const hit = state.shot.outcome === "WALL" && state.shot.collision?.playerIndex === player.index;\\n    const variedPose = wallPose(progress, player.index, wall.players.length, hit);\\n    variedPose.headX = ((player.index % 3) - 1) * 0.012;\\n    variedPose.rotation = (variedPose.rotation || 0) + (player.index % 2 ? 0.012 : -0.01);\\n    drawArticulated(\\n      player,\\n      variedPose,\\n      {\\n        shirt: player.index % 2 ? wallProfile.secondary : wallProfile.accent,\\n        shorts: "#101a13",\\n        skin: skinPalette[player.index % skinPalette.length],\\n        hair: hairPalette[player.index % hairPalette.length]\\n      },\\n      wallProfile.playerHeight * heightPattern[player.index % heightPattern.length]\\n    );\\n  }'
);
`;

loaderSource = loaderSource.replace(insertionPoint, identityPatch + rigPatch + insertionPoint);
loaderSource += "\n//# sourceURL=football-lab-render-v17-1-loader-generated.js\n";

const loaderModuleUrl = URL.createObjectURL(new Blob([loaderSource], { type: "text/javascript" }));
let generated;
try {
  generated = await import(loaderModuleUrl);
} finally {
  URL.revokeObjectURL(loaderModuleUrl);
}

window.__footballLabRigBaseV171 = true;
export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
