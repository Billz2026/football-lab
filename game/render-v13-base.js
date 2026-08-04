const loaderUrl = new URL("./render-v11-4-base.js?v=114", import.meta.url);
const response = await fetch(loaderUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V11.4 renderer loader (${response.status})`);
let loaderSource = await response.text();

const baseRendererUrl = new URL("./render-v11-3-base.js?v=113", import.meta.url).href;
const characterModuleUrl = new URL("./characters-v13.js?v=13", import.meta.url).href;

const oldSourceUrl = 'const sourceUrl = new URL("./render-v11-3-base.js?v=113", import.meta.url);';
const newSourceUrl = `const sourceUrl = new URL("${baseRendererUrl}");`;
if (!loaderSource.includes(oldSourceUrl)) {
  throw new Error("V13 renderer patch failed: V11.3 source URL not found");
}
loaderSource = loaderSource.replace(oldSourceUrl, newSourceUrl);

const insertionPoint = "// Blob modules need absolute dependency URLs because their own URL has no directory.";
if (!loaderSource.includes(insertionPoint)) {
  throw new Error("V13 renderer patch failed: insertion point not found");
}

const identityPatch = `
// V13 kicker identity: keep the proven animation rig and swap only the selected kicker's visual identity.
replaceRequired(
  "character renderer import",
  'import { playKickSound } from "./audio-v6.js?v=7";',
  'import { playKickSound } from "./audio-v6.js?v=7";\\nimport { activeCharacter } from "${characterModuleUrl}";'
);
replaceRequired(
  "selected kicker appearance",
  '  drawArticulated(\\n    world,\\n    kickerPose(progress, time),\\n    {\\n      shirt: "#dafe4d",\\n      shorts: "#111a14",\\n      skin: "#c99774",\\n      shoe: "#07110b"\\n    },\\n    1.82\\n  );',
  '  const character = activeCharacter();\\n  const pose = kickerPose(progress, time);\\n  pose.number = character.number;\\n  drawArticulated(\\n    world,\\n    pose,\\n    {\\n      shirt: character.accent,\\n      shorts: "#111a14",\\n      skin: "#c99774",\\n      shoe: "#07110b"\\n    },\\n    1.82\\n  );'
);

`;
loaderSource = loaderSource.replace(insertionPoint, identityPatch + insertionPoint);
loaderSource += "\n//# sourceURL=football-lab-render-v13-loader-generated.js\n";

const loaderModuleUrl = URL.createObjectURL(new Blob([loaderSource], { type: "text/javascript" }));
let generated;
try {
  generated = await import(loaderModuleUrl);
} finally {
  URL.revokeObjectURL(loaderModuleUrl);
}

export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
