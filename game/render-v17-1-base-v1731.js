const upstreamUrl = new URL("./render-v17-1-base.js?v=171", import.meta.url);
const response = await fetch(upstreamUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V17.1 repaired renderer (${response.status})`);
let source = await response.text();

const absolute = (specifier) => new URL(specifier, upstreamUrl).href;
const replacements = [
  [
    'new URL("./render-v11-4-base.js?v=114", import.meta.url)',
    `new URL("${absolute("./render-v11-4-base.js?v=114")}")`
  ],
  [
    'new URL("./render-v11-3-base.js?v=113", import.meta.url)',
    `new URL("${absolute("./render-v11-3-base.js?v=113")}")`
  ],
  [
    'new URL("./characters-v13.js?v=13", import.meta.url)',
    `new URL("${absolute("./characters-v13.js?v=13")}")`
  ],
  [
    'new URL("./keepers-v14.js?v=14", import.meta.url)',
    `new URL("${absolute("./keepers-v14.js?v=14")}")`
  ],
  [
    'new URL("./walls-v15.js?v=15", import.meta.url)',
    `new URL("${absolute("./walls-v15.js?v=15")}")`
  ]
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`V17.3.1 base path patch failed: ${before}`);
  source = source.replace(before, after);
}

const marker = 'loaderSource = loaderSource.replace(insertionPoint, identityPatch + rigPatch + insertionPoint);';
if (!source.includes(marker)) throw new Error("V17.3.1 single-kicker insertion marker missing");

const singleKickerInjection = String.raw`
const singleKickerPatch = \
\`\n// The finished hero rig replaces, rather than overlays, the temporary base kicker.\nreplaceRequired(\n  "single hero renderer",\n  '  drawKicker(time);',\n  '  const heroSelected = activeCharacter().id === "dax-ryder";\\n  window.__footballLabBaseKickerSuppressedV1731 = heroSelected;\\n  if (!heroSelected) drawKicker(time);'\n);\n\`;
loaderSource = loaderSource.replace(insertionPoint, identityPatch + rigPatch + singleKickerPatch + insertionPoint);`;

source = source.replace(marker, singleKickerInjection);
source += "\n//# sourceURL=football-lab-render-v17-1-base-v1731-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

window.__footballLabSingleKickerBaseV1731 = true;
export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
