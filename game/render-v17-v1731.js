const upstreamUrl = new URL("./render-v17.js?v=17", import.meta.url);
const response = await fetch(upstreamUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V17 cinematic renderer (${response.status})`);
let source = await response.text();

const baseImport = 'import { drawScene as drawBaseScene, resizeCanvas } from "./render-v15.js?v=15";';
const baseReplacement = `import { drawScene as drawBaseScene, resizeCanvas } from "${new URL("./render-v15-v1731.js?v=1731", upstreamUrl).href}";`;
if (!source.includes(baseImport)) throw new Error("V17.3.1 cinematic base import missing");
source = source.replace(baseImport, baseReplacement);

source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, upstreamUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-render-v17-v1731-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

window.__footballLabCinematicRendererV1731 = true;
export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
