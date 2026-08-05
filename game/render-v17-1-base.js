const sourceUrl = new URL("./render-v15-base.js?v=15", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V15 actor renderer (${response.status})`);
let source = await response.text();

const injectionNeedle = "loaderSource = loaderSource.replace(insertionPoint, identityPatch + insertionPoint);";
if (!source.includes(injectionNeedle)) {
  throw new Error("V17.1 actor patch failed: V15 injection point not found");
}

const rigPatchInjection = String.raw`
const rigPatch = String.raw\`
// V17.1 repairs the shared articulated rig before the renderer is generated.
replaceRequired(
  "actor body anchors",
  [
    '  const pelvis = screenPoint((pose.pelvisX || 0) * h, -0.31 * h + crouch * h * 0.1);',
    '  const chest = screenPoint((pose.chestX || 0) * h, -0.66 * h + crouch * h * 0.12);',
    '  const head = screenPoint(chest.x + (pose.headX || 0) * h, -0.91 * h + crouch * h * 0.1);',
    '  const shoulderHalf = h * 0.13;',
    '  const hipHalf = h * 0.075;'
  ].join("\n"),
  [
    '  const pelvis = screenPoint((pose.pelvisX || 0) * h, -0.335 * h + crouch * h * 0.09);',
    '  const chest = screenPoint((pose.chestX || 0) * h, -0.635 * h + crouch * h * 0.1);',
    '  const headRadius = h * 0.068;',
    '  const neckBase = screenPoint(chest.x + (pose.headX || 0) * h * 0.2, chest.y - h * 0.025);',
    '  const head = screenPoint(neckBase.x + (pose.headX || 0) * h * 0.8, neckBase.y - h * 0.12);',
    '  const shoulderHalf = h * 0.118;',
    '  const hipHalf = h * 0.068;'
  ].join("\n")
);
replaceRequired(
  "actor neck connection",
  [
    '  drawSegment(leftAnkle, leftToe, legWidth * 0.92, shoe);',
    '  drawSegment(rightAnkle, rightToe, legWidth * 0.92, shoe);',
    '',
    '  ctx.save();'
  ].join("\n"),
  [
    '  drawSegment(leftAnkle, leftToe, legWidth * 0.92, shoe);',
    '  drawSegment(rightAnkle, rightToe, legWidth * 0.92, shoe);',
    '',
    '  const neckTop = screenPoint(head.x, head.y + headRadius * 0.74);',
    '  drawSegment(neckBase, neckTop, Math.max(3, h * 0.05), skin, "rgba(2,7,4,.72)");',
    '',
    '  ctx.save();'
  ].join("\n")
);
replaceRequired(
  "actor torso proportions",
  [
    '  roundedRect(-h * 0.15, -h * 0.205, h * 0.3, h * 0.41, h * 0.07);',
    '  ctx.fill();',
    '  ctx.fillStyle = shirt;',
    '  roundedRect(-h * 0.135, -h * 0.19, h * 0.27, h * 0.38, h * 0.06);'
  ].join("\n"),
  [
    '  roundedRect(-h * 0.128, -h * 0.178, h * 0.256, h * 0.356, h * 0.055);',
    '  ctx.fill();',
    '  ctx.fillStyle = shirt;',
    '  roundedRect(-h * 0.116, -h * 0.166, h * 0.232, h * 0.332, h * 0.05);'
  ].join("\n")
);
replaceRequired(
  "actor head and hair",
  '  drawJoint(head, h * 0.073, skin);',
  [
    '  drawJoint(head, headRadius, skin, "rgba(2,7,4,.7)");',
    '  ctx.fillStyle = colours.hair || "#171713";',
    '  ctx.beginPath();',
    '  ctx.arc(head.x, head.y - headRadius * 0.12, headRadius * 0.87, Math.PI, TAU);',
    '  ctx.fill();'
  ].join("\n")
);
replaceRequired(
  "actor shoulder joints",
  [
    '  const armWidth = Math.max(3.6, h * 0.043);',
    '  drawSegment(leftShoulder, leftElbow, armWidth, arm);'
  ].join("\n"),
  [
    '  const armWidth = Math.max(3.6, h * 0.043);',
    '  drawJoint(leftShoulder, armWidth * 0.66, shirt, "rgba(2,7,4,.72)");',
    '  drawJoint(rightShoulder, armWidth * 0.66, shirt, "rgba(2,7,4,.72)");',
    '  drawSegment(leftShoulder, leftElbow, armWidth, arm);'
  ].join("\n")
);
replaceRequired(
  "keeper set stance",
  [
    '        leftKnee: { x: -0.13, y: -0.13 },',
    '        rightKnee: { x: 0.13, y: -0.13 },',
    '        leftHand: { x: -0.31, y: -0.55 },',
    '        rightHand: { x: 0.31, y: -0.55 },',
    '        glove: "#f7ffd2",',
    '        gloveScale: 1.28'
  ].join("\n"),
  [
    '        leftKnee: { x: -0.16, y: -0.135 },',
    '        rightKnee: { x: 0.16, y: -0.135 },',
    '        leftHand: { x: -0.36, y: -0.54 },',
    '        rightHand: { x: 0.36, y: -0.54 },',
    '        glove: "#f7ffd2",',
    '        gloveScale: 1.45'
  ].join("\n")
);
replaceRequired(
  "keeper dive gloves",
  '      gloveScale: 1.5',
  '      gloveScale: 1.68'
);
replaceRequired(
  "keeper visual scale",
  '    keeperProfile.visualHeight',
  '    keeperProfile.visualHeight * 1.08'
);
replaceRequired(
  "wall actor variation setup",
  '    const hit = state.shot.outcome === "WALL" && state.shot.collision?.playerIndex === player.index;',
  [
    '    const hit = state.shot.outcome === "WALL" && state.shot.collision?.playerIndex === player.index;',
    '    const wallPoseState = wallPose(progress, player.index, wall.players.length, hit);',
    '    wallPoseState.headX = ((player.index % 3) - 1) * 0.012;',
    '    wallPoseState.rotation = (wallPoseState.rotation || 0) + (player.index % 2 ? 0.012 : -0.01);',
    '    const skinPalette = ["#c99774", "#9f6f52", "#d6a17a", "#7f543f", "#bd8461"];',
    '    const hairPalette = ["#171713", "#211914", "#0e1210", "#30231b"];',
    '    const heightPattern = [0.98, 1.025, 1.0, 1.04, 0.97, 1.015, 0.99];',
    '    const wallHeight = wallProfile.playerHeight * heightPattern[player.index % heightPattern.length];'
  ].join("\n")
);
replaceRequired(
  "wall varied pose",
  '      wallPose(progress, player.index, wall.players.length, hit),',
  '      wallPoseState,'
);
replaceRequired(
  "wall varied skin",
  '        skin: "#c99774"',
  '        skin: skinPalette[player.index % skinPalette.length],\n        hair: hairPalette[player.index % hairPalette.length]'
);
replaceRequired(
  "wall varied height",
  '      wallProfile.playerHeight',
  '      wallHeight'
);
\`;
loaderSource = loaderSource.replace(insertionPoint, identityPatch + rigPatch + insertionPoint);
`;

source = source.replace(injectionNeedle, rigPatchInjection);
source = source.replace(/new URL\("(\.\/[^"\n]+)", import\.meta\.url\)/g, (_, specifier) => {
  return `new URL("${new URL(specifier, sourceUrl).href}")`;
});
source += "\n//# sourceURL=football-lab-render-v17-1-base-loader.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
