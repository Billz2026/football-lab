const sourceUrl = new URL("./main-v11-3.js?v=113", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V11.3 game flow (${response.status})`);
let source = await response.text();

const oldRendererImport = 'from "./render-v11-3.js?v=113"';
const newRendererImport = `from "${new URL("./render-v11-4.js?v=114", import.meta.url).href}"`;
if (!source.includes(oldRendererImport)) {
  throw new Error("V11.4 main patch failed: renderer import not found");
}
source = source.replace(oldRendererImport, newRendererImport);

source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-main-v11-4-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
