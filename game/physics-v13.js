const sourceUrl = new URL("./physics-v9.js?v=9", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V9 physics (${response.status})`);
let source = await response.text();

function replaceRequired(label, before, after) {
  if (!source.includes(before)) throw new Error(`V13 physics patch failed: ${label}`);
  source = source.replace(before, after);
}

const characterImport = `import { activeCharacter, characterPhysics } from "${new URL("./characters-v13.js?v=13", import.meta.url).href}";`;
replaceRequired(
  "character import",
  'import { difficultyForStage } from "./difficulty-v9.js?v=9";',
  `import { difficultyForStage } from "./difficulty-v9.js?v=9";\n${characterImport}`
);

replaceRequired(
  "direct-path modifiers",
  "function buildDirectPath(target, profile) {\n  const stage = stageConfig();\n  const start = ballWorld(stage);",
  "function buildDirectPath(target, profile) {\n  const stage = stageConfig();\n  const modifiers = characterPhysics();\n  const start = ballWorld(stage);"
);
replaceRequired(
  "direct-path curve",
  "  const curve = signedCurve(state.shot.curve ?? 0);",
  "  const curve = signedCurve(clamp((state.shot.curve ?? 0) * modifiers.curveStrength, -1.15, 1.15));"
);

replaceRequired(
  "input modifiers",
  "function targetFromInputs(profile) {\n  const stage = stageConfig();\n  const shot = state.shot;",
  "function targetFromInputs(profile) {\n  const stage = stageConfig();\n  const shot = state.shot;\n  const modifiers = characterPhysics();"
);
replaceRequired(
  "effective curve input",
  "  const curve = signedCurve(shot.curve ?? 0);\n  const rawCurve = shot.curve ?? 0;",
  "  const rawCurve = clamp((shot.curve ?? 0) * modifiers.curveStrength, -1.15, 1.15);\n  const curve = signedCurve(rawCurve);"
);
replaceRequired(
  "curve control allowance",
  "  const excessiveCurve = Math.max(0, Math.abs(rawCurve) - 0.58);",
  "  const excessiveCurve = Math.max(0, Math.abs(rawCurve) - (0.58 + modifiers.excessiveCurveAllowance));"
);
replaceRequired(
  "character contact error",
  "  const powerDrift = powerDelta * 0.22 * profile.contactError;\n  const curveDrift = deterministicSide * excessiveCurve * (0.42 + controlPenalty * 0.45) * profile.contactError;\n  const qualityDrift = deterministicSide * controlPenalty * 0.17 * profile.contactError;",
  "  const contactError = profile.contactError * modifiers.contactError;\n  const powerDrift = powerDelta * 0.22 * contactError;\n  const curveDrift = deterministicSide * excessiveCurve * (0.42 + controlPenalty * 0.45) * contactError;\n  const qualityDrift = deterministicSide * controlPenalty * 0.17 * contactError;"
);
replaceRequired(
  "character shot pace",
  "  shot.speedMps = lerp(15.5, 36.5, smoothStep(power)) * lerp(0.86, 1, quality);",
  "  shot.speedMps = lerp(15.5, 36.5, smoothStep(power)) * lerp(0.86, 1, quality) * modifiers.shotSpeed;"
);

replaceRequired(
  "keeper character modifiers",
  "function calculateKeeperPlan(target, flightSeconds, profile) {\n  const stage = stageConfig();",
  "function calculateKeeperPlan(target, flightSeconds, profile) {\n  const stage = stageConfig();\n  const modifiers = characterPhysics();"
);
replaceRequired(
  "keeper threshold modifier",
  "  const threshold = clamp(0.84 + skill * 0.15 + paceAdjustment + poorContactBonus, 0.78, 1.07);",
  "  const threshold = clamp(0.84 + skill * 0.15 + paceAdjustment + poorContactBonus + modifiers.keeperThreshold, 0.75, 1.08);"
);
replaceRequired(
  "parry trait",
  "  const saveType = !saved\n    ? null\n    : reachScore < 0.53 && power < 0.76 && quality > 0.48 ? \"CATCH\" : \"PARRY\";",
  "  const catchSpeedLimit = 27.5 - modifiers.catchResistance * 4.2;\n  const saveType = !saved\n    ? null\n    : reachScore < 0.53 && state.shot.speedMps < catchSpeedLimit && quality > 0.48 ? \"CATCH\" : \"PARRY\";"
);

replaceRequired(
  "diagnostic character",
  "  shot.diagnostics = {\n    stage: state.stage + 1,",
  "  shot.diagnostics = {\n    character: activeCharacter().name,\n    characterTrait: activeCharacter().trait,\n    stage: state.stage + 1,"
);

source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-physics-v13-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

export const resolveShotPhysics = generated.resolveShotPhysics;
export const sampleShotPath = generated.sampleShotPath;
