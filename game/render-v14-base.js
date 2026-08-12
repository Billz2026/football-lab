const loaderUrl = new URL("./render-v11-4-base.js?v=114", import.meta.url);
const response = await fetch(loaderUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V11.4 renderer loader (${response.status})`);
let loaderSource = await response.text();

const baseRendererUrl = new URL("./render-v11-3-base.js?v=113", import.meta.url).href;
const characterModuleUrl = new URL("./characters-v13.js?v=32.4", import.meta.url).href;
const keeperModuleUrl = new URL("./keepers-v14.js?v=32.4", import.meta.url).href;

const oldSourceUrl = 'const sourceUrl = new URL("./render-v11-3-base.js?v=113", import.meta.url);';
const newSourceUrl = `const sourceUrl = new URL("${baseRendererUrl}");`;
if (!loaderSource.includes(oldSourceUrl)) {
  throw new Error("V14 renderer patch failed: V11.3 source URL not found");
}
loaderSource = loaderSource.replace(oldSourceUrl, newSourceUrl);

const insertionPoint = "// Blob modules need absolute dependency URLs because their own URL has no directory.";
if (!loaderSource.includes(insertionPoint)) {
  throw new Error("V14 renderer patch failed: insertion point not found");
}

const identityPatch = `
// V14 actor identities: retain the V11.4 animation rig and swap selected kicker plus stage goalkeeper visuals.
replaceRequired(
  "ability renderer imports",
  'import { playKickSound } from "./audio-v6.js?v=7";',
  'import { playKickSound } from "./audio-v6.js?v=7";\\nimport { activeCharacter } from "${characterModuleUrl}";\\nimport { keeperForStage } from "${keeperModuleUrl}";'
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

`;
loaderSource = loaderSource.replace(insertionPoint, identityPatch + insertionPoint);
loaderSource += "\n//# sourceURL=football-lab-render-v14-loader-generated.js\n";

const loaderModuleUrl = URL.createObjectURL(new Blob([loaderSource], { type: "text/javascript" }));
let generated;
try {
  generated = await import(loaderModuleUrl);
} finally {
  URL.revokeObjectURL(loaderModuleUrl);
}

export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
