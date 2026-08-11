const sourceUrl = new URL("./main-v11-3.js?v=113", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V11.3 game flow (${response.status})`);
let source = await response.text();

function replaceRequired(label, before, after) {
  if (!source.includes(before)) throw new Error(`V13 main patch failed: ${label}`);
  source = source.replace(before, after);
}

replaceRequired(
  "character physics import",
  'import { resolveShotPhysics } from "./physics-v9.js?v=9";',
  `import { resolveShotPhysics } from "${new URL("./physics-v13.js?v=13", import.meta.url).href}";`
);
replaceRequired(
  "V13 renderer import",
  'import { resizeCanvas, drawScene } from "./render-v11-3.js?v=113";',
  `import { resizeCanvas, drawScene } from "${new URL("./render-v13.js?v=13", import.meta.url).href}";`
);
replaceRequired(
  "character meter import",
  'import { difficultyForStage } from "./difficulty-v9.js?v=32.2";',
  `import { difficultyForStage } from "./difficulty-v9.js?v=32.2";\nimport { activeCharacter, meterMultiplier } from "${new URL("./characters-v13.js?v=32.2", import.meta.url).href}";`
);

replaceRequired(
  "power meter character speed",
  "    const speed = (3.35 + stage.aimSpeed * 0.18) * difficulty.meter.power;",
  "    const speed = (3.35 + stage.aimSpeed * 0.18) * difficulty.meter.power * meterMultiplier(\"power\", state.stage);"
);
replaceRequired(
  "aim meter character speed",
  "    state.meterClock += delta * difficulty.meter.aim;",
  "    state.meterClock += delta * difficulty.meter.aim * meterMultiplier(\"aim\", state.stage);"
);
replaceRequired(
  "curve meter character speed",
  "    const speed = (2.78 + stage.aimSpeed * 0.2) * difficulty.meter.curve;",
  "    const speed = (2.78 + stage.aimSpeed * 0.2) * difficulty.meter.curve * meterMultiplier(\"curve\", state.stage);"
);
replaceRequired(
  "run character snapshot",
  "  Object.assign(state, {\n    score: 0,",
  "  Object.assign(state, {\n    characterId: activeCharacter().id,\n    score: 0,"
);

source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-main-v13-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
