const sourceUrl = new URL("./render-v9-v15.js?v=15", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V15 diagnostic renderer (${response.status})`);
let source = await response.text();

source = source.replace(
  'from "./render-v15-base.js?v=15"',
  `from "${new URL("./render-v15-3-base.js?v=153", import.meta.url).href}"`
);
source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source = source.replace("V15 MATCHUP DIAGNOSTICS", "V15.3 MATCHUP LAB DIAGNOSTICS");
source += "\n//# sourceURL=football-lab-render-v9-v15-3-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
