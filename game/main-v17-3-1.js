const sourceUrl = new URL("./main-v15-2.js?v=152", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V15.2 game flow (${response.status})`);
let source = await response.text();

const renderNeedle = 'new URL("./render-v15.js?v=15", import.meta.url).href';
const renderReplacement = `new URL("${new URL("./render-v17-3-1.js?v=1731", import.meta.url).href}").href`;
if (!source.includes(renderNeedle)) {
  throw new Error("V17.3.1 game-flow patch failed: V15 renderer URL not found");
}
source = source.replace(renderNeedle, renderReplacement);
source = source.replace(/new URL\("(\.\/[^"\n]+)", import\.meta\.url\)/g, (_, specifier) => {
  return `new URL("${new URL(specifier, sourceUrl).href}")`;
});
source += "\n//# sourceURL=football-lab-main-v17-3-1-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
try {
  await import(moduleUrl);
  window.__footballLabMainV17 = true;
  window.__footballLabMainV171 = true;
  window.__footballLabMainV172 = true;
  window.__footballLabMainV173 = true;
  window.__footballLabMainV1731 = true;
} finally {
  URL.revokeObjectURL(moduleUrl);
}
