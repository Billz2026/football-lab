const sourceUrl = new URL("./main-v17.js?v=17", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V17 game flow (${response.status})`);
let source = await response.text();

const before = 'new URL("./render-v17.js?v=17", import.meta.url).href';
const after = `new URL("${new URL("./render-v17-1.js?v=171", import.meta.url).href}").href`;
if (!source.includes(before)) {
  throw new Error("V17.1 game-flow patch failed: V17 renderer URL not found");
}
source = source.replace(before, after);
source = source.replace(/new URL\("(\.\/[^"\n]+)", import\.meta\.url\)/g, (_, specifier) => {
  return `new URL("${new URL(specifier, sourceUrl).href}")`;
});
source += "\n//# sourceURL=football-lab-main-v17-1-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
try {
  await import(moduleUrl);
  window.__footballLabMainV171 = true;
} finally {
  URL.revokeObjectURL(moduleUrl);
}
