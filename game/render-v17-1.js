const sourceUrl = new URL("./render-v17.js?v=17", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V17 cinematic renderer (${response.status})`);
let source = await response.text();

const before = 'from "./render-v15.js?v=15"';
const after = `from "${new URL("./render-v15-v17-1.js?v=171", import.meta.url).href}"`;
if (!source.includes(before)) {
  throw new Error("V17.1 cinematic patch failed: V15 renderer import not found");
}
source = source.replace(before, after);
source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-render-v17-1-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

window.__footballLabRigV171 = true;
export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
