const sourceUrl = new URL("./render-v15.js?v=15", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V15 matchup renderer (${response.status})`);
let source = await response.text();

const before = 'new URL("./render-v9-v15.js?v=15", import.meta.url).href';
const after = `"${new URL("./render-v9-v17-1.js?v=171", import.meta.url).href}"`;
if (!source.includes(before)) {
  throw new Error("V17.1 matchup patch failed: diagnostic renderer URL not found");
}
source = source.replace(before, after);
source = source.replace(/new URL\("(\.\/[^"\n]+)", import\.meta\.url\)/g, (_, specifier) => {
  return `new URL("${new URL(specifier, sourceUrl).href}")`;
});
source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-render-v15-v17-1-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
