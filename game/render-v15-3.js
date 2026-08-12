const loaderSourceUrl = new URL("./render-v15.js?v=15", import.meta.url);
const response = await fetch(loaderSourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V15 presentation renderer (${response.status})`);
let loaderSource = await response.text();

loaderSource = loaderSource
  .replaceAll("./render-v9-v15.js?v=15", "./render-v9-v15-3.js?v=153")
  .replaceAll("./keepers-v14.js?v=32.4", "./lab-matchups-v15-3.js?v=153")
  .replaceAll("./walls-v15.js?v=32.4", "./lab-matchups-v15-3.js?v=153");

loaderSource = loaderSource.replace(
  /new URL\("(\.\/[^"\n]+)"\s*,\s*import\.meta\.url\)/g,
  (_, specifier) => `new URL("${new URL(specifier, loaderSourceUrl).href}")`
);
loaderSource += "\n//# sourceURL=football-lab-render-v15-3-loader-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([loaderSource], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
