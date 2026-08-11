const upstreamUrl = new URL("./render-v15.js?v=15", import.meta.url);
const response = await fetch(upstreamUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V15 presentation renderer (${response.status})`);
let source = await response.text();

const absolute = (specifier) => new URL(specifier, upstreamUrl).href;
const replacements = [
  [
    'new URL("./render-v11-4.js?v=114", import.meta.url)',
    `new URL("${absolute("./render-v11-4.js?v=114")}")`
  ],
  [
    'new URL("./render-v9-v15.js?v=15", import.meta.url).href',
    `new URL("${absolute("./render-v9-v17-3-1.js?v=1731")}").href`
  ],
  [
    'new URL("./characters-v13.js?v=32.2", import.meta.url).href',
    `new URL("${absolute("./characters-v13.js?v=32.2")}").href`
  ],
  [
    'new URL("./keepers-v14.js?v=32.2", import.meta.url).href',
    `new URL("${absolute("./keepers-v14.js?v=32.2")}").href`
  ],
  [
    'new URL("./walls-v15.js?v=32.2", import.meta.url).href',
    `new URL("${absolute("./walls-v15.js?v=32.2")}").href`
  ]
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`V17.3.1 presentation path patch failed: ${before}`);
  source = source.replace(before, after);
}

source += "\n//# sourceURL=football-lab-render-v15-v1731-generated.js\n";
const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

window.__footballLabPresentationV1731 = true;
export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
