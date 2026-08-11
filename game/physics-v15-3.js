const loaderSourceUrl = new URL("./physics-v15.js?v=15", import.meta.url);
const response = await fetch(loaderSourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V15 physics loader (${response.status})`);
let loaderSource = await response.text();

loaderSource = loaderSource
  .replaceAll("./keepers-v14.js?v=32.2", "./lab-matchups-v15-3.js?v=153")
  .replaceAll("./walls-v15.js?v=32.2", "./lab-matchups-v15-3.js?v=153");

loaderSource = loaderSource.replace(
  /new URL\("(\.\/[^"\n]+)"\s*,\s*import\.meta\.url\)/g,
  (_, specifier) => `new URL("${new URL(specifier, loaderSourceUrl).href}")`
);
loaderSource += "\n//# sourceURL=football-lab-physics-v15-3-loader-generated.js\n";

const loaderModuleUrl = URL.createObjectURL(new Blob([loaderSource], { type: "text/javascript" }));
let generated;
try {
  generated = await import(loaderModuleUrl);
} finally {
  URL.revokeObjectURL(loaderModuleUrl);
}

export const resolveShotPhysics = generated.resolveShotPhysics;
export const sampleShotPath = generated.sampleShotPath;
