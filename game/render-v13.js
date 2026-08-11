const sourceUrl = new URL("./render-v11-4.js?v=114", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V11.4 presentation renderer (${response.status})`);
let source = await response.text();

function replaceRequired(label, before, after) {
  if (!source.includes(before)) throw new Error(`V13 presentation patch failed: ${label}`);
  source = source.replace(before, after);
}

replaceRequired(
  "V13 diagnostic renderer",
  'import { drawScene as drawBaseScene, resizeCanvas } from "./render-v9-v114.js?v=114";',
  `import { drawScene as drawBaseScene, resizeCanvas } from "${new URL("./render-v9-v13.js?v=13", import.meta.url).href}";`
);
replaceRequired(
  "character presentation import",
  'import { clamp, formatScore, WORLD, state, ctx } from "./core-v6.js?v=32.3";',
  `import { clamp, formatScore, WORLD, state, ctx } from "./core-v6.js?v=32.3";\nimport { activeCharacter } from "${new URL("./characters-v13.js?v=32.3", import.meta.url).href}";`
);
replaceRequired(
  "goal colour",
  '  if (outcome === "GOAL") return { primary: "#dafe4d", secondary: "rgba(218,254,77,.18)", text: "#07110b" };',
  '  if (outcome === "GOAL") return { primary: activeCharacter().accent, secondary: `${activeCharacter().accent}30`, text: "#07110b" };'
);

source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-render-v13-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
