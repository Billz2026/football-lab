const sourceUrl = new URL("./physics-v9.js?v=9", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V9 physics (${response.status})`);
let source = await response.text();

function replaceRequired(label, before, after) {
  if (!source.includes(before)) throw new Error(`V15 physics patch failed: ${label}`);
  source = source.replace(before, after);
}

const characterImport = `import { activeCharacter, characterPhysics } from "${new URL("./characters-v13.js?v=31", import.meta.url).href}";`;
const keeperImport = `import { keeperForStage } from "${new URL("./keepers-v14.js?v=31", import.meta.url).href}";`;
const wallImport = `import { wallForStage, buildWallLayout } from "${new URL("./walls-v15.js?v=31", import.meta.url).href}";`;
replaceRequired(
  "ability imports",
  'import { difficultyForStage } from "./difficulty-v9.js?v=31";',
  `import { difficultyForStage } from "./difficulty-v9.js?v=31";\n${characterImport}\n${keeperImport}\n${wallImport}`
);

replaceRequired(
  "keeper skill archetype",
  "function effectiveKeeperSkill(stage, profile) {\n  const scenarioSkill = stage.keeper * 0.66;\n  return clamp(0.34 + scenarioSkill + profile.keeperBoost, 0.4, 0.92);\n}",
  "function effectiveKeeperSkill(stage, profile) {\n  const keeper = keeperForStage(state.stage);\n  const scenarioSkill = stage.keeper * 0.66;\n  return clamp(0.34 + scenarioSkill + profile.keeperBoost + keeper.modifiers.skillBoost, 0.4, 0.95);\n}"
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

const wallStart = source.indexOf("function analyseWall(path, profile) {");
const wallEnd = source.indexOf("\nfunction findFrameCollision", wallStart);
if (wallStart < 0 || wallEnd < 0) throw new Error("V15 physics patch failed: wall analyser not found");
const wallFunction = `function analyseWall(path, profile, target) {
  const wallProfile = wallForStage(state.stage);
  const wall = buildWallLayout(stageConfig(), state.stage, {
    targetX: target?.x,
    curve: state.shot?.curve ?? 0
  });
  const modifiers = wallProfile.modifiers;
  let collision = null;
  let closest = null;
  let passIndex = 0;
  let passDistance = Infinity;

  for (let index = 0; index < path.length; index += 1) {
    const point = path[index];
    const distance = Math.hypot(point.x - wall.centre.x, point.z - wall.centre.z);
    if (distance < passDistance) {
      passDistance = distance;
      passIndex = index;
    }
  }
  const passRatio = clamp(passIndex / Math.max(1, path.length - 1), 0.08, 0.9);

  for (let index = 1; index < path.length - 1; index += 1) {
    const point = path[index];
    const flightProgress = index / (path.length - 1);

    for (const player of wall.players) {
      const jumpCentre = clamp(passRatio - modifiers.jumpLead + player.timingOffset, 0.08, 0.92);
      const jumpWindow = Math.max(0, 1 - Math.abs(flightProgress - jumpCentre) / modifiers.jumpWindow);
      const jumpHeight = Math.sin(jumpWindow * Math.PI / 2)
        * profile.wallJump
        * modifiers.jumpMultiplier
        * player.jumpMultiplier;
      const feetHeight = jumpHeight * modifiers.underGap;
      const playerHeight = wallProfile.playerHeight + jumpHeight;
      const radius = profile.wallRadius * modifiers.radius * player.radiusMultiplier;
      const groundDistance = Math.hypot(point.x - player.x, point.z - player.z);
      const clearance = point.y - playerHeight - BALL_RADIUS;
      const lateralGap = groundDistance - radius - BALL_RADIUS;
      const candidateScore = Math.hypot(Math.max(0, lateralGap), Math.abs(point.z - player.z));

      if (!closest || candidateScore < closest.score) {
        closest = {
          score: candidateScore,
          clearance,
          lateralGap,
          feetHeight,
          point,
          playerIndex: player.index
        };
      }

      if (
        groundDistance <= radius + BALL_RADIUS
        && point.y <= playerHeight + BALL_RADIUS
        && point.y + BALL_RADIUS >= feetHeight
      ) {
        collision = { type: "WALL", index, point, playerIndex: player.index };
        break;
      }
    }
    if (collision) break;
  }

  const lane = closest && closest.lateralGap > 0.18
    ? "AROUND"
    : closest && closest.point.y + BALL_RADIUS < closest.feetHeight
      ? "UNDER"
      : "OVER";

  return {
    collision,
    clearance: closest?.clearance ?? null,
    lateralGap: closest?.lateralGap ?? null,
    lane,
    wallProfile,
    wall
  };
}
`;
source = source.slice(0, wallStart) + wallFunction + source.slice(wallEnd);
replaceRequired(
  "wall analyser call",
  "  const wallAnalysis = analyseWall(path, profile);",
  "  const wallAnalysis = analyseWall(path, profile, target);"
);

replaceRequired(
  "keeper archetype setup",
  "function calculateKeeperPlan(target, flightSeconds, profile) {\n  const stage = stageConfig();\n  const skill = effectiveKeeperSkill(stage, profile);\n  const start = keeperWorld(stage);\n  const handStart = { x: start.x, y: 1.08, z: start.z };",
  "function calculateKeeperPlan(target, flightSeconds, profile) {\n  const stage = stageConfig();\n  const characterModifiers = characterPhysics();\n  const keeper = keeperForStage(state.stage);\n  const keeperModifiers = keeper.modifiers;\n  const skill = effectiveKeeperSkill(stage, profile);\n  const baseStart = keeperWorld(stage);\n  const start = {\n    x: lerp(baseStart.x, target.x, keeperModifiers.startTracking),\n    y: baseStart.y,\n    z: baseStart.z + keeperModifiers.forwardStart\n  };\n  const handStart = { x: start.x, y: 1.08, z: start.z };"
);
replaceRequired(
  "keeper reaction and reach",
  "  const curveReadDelay = Math.abs(state.shot.curve ?? 0) * 0.026;\n  const reaction = clamp(lerp(0.32, 0.115, skill) - profile.reactionBoost + curveReadDelay, 0.095, 0.38);\n  const available = Math.min(0.6, Math.max(0, flightSeconds - reaction));\n  const reachX = (0.98 + skill * 1.18 + available * lerp(1.6, 2.45, skill)) * profile.reachX;\n  const reachY = (0.72 + skill * 0.88 + available * lerp(0.56, 0.86, skill)) * profile.reachY;",
  "  const curveReadDelay = Math.abs(state.shot.curve ?? 0) * 0.026 * keeperModifiers.curveReadMultiplier;\n  const baseReaction = lerp(0.32, 0.115, skill) - profile.reactionBoost + curveReadDelay;\n  const reaction = clamp(baseReaction * keeperModifiers.reactionMultiplier, 0.085, 0.42);\n  const available = Math.min(0.6, Math.max(0, flightSeconds - reaction));\n  const reachX = (0.98 + skill * 1.18 + available * lerp(1.6, 2.45, skill)) * profile.reachX * keeperModifiers.reachX;\n  const reachY = (0.72 + skill * 0.88 + available * lerp(0.56, 0.86, skill)) * profile.reachY * keeperModifiers.reachY;"
);
replaceRequired(
  "keeper threshold matchup",
  "  const threshold = clamp(0.84 + skill * 0.15 + paceAdjustment + poorContactBonus, 0.78, 1.07);",
  "  const targetWidth = Math.abs(target.x) / GOAL.halfWidth;\n  const centralShot = targetWidth < 0.38;\n  const lowShot = target.y < GOAL.height * 0.34;\n  const highShot = target.y > GOAL.height * 0.68;\n  const finesseShot = Math.abs(state.shot.curve ?? 0) > 0.42 && power < 0.82;\n  const paceFactor = smoothStep(clamp((state.shot.speedMps - 27) / 10, 0, 1));\n  const matchupAdjustment =\n    (centralShot ? keeperModifiers.centralBonus : 0)\n    + (finesseShot ? keeperModifiers.finesseBonus : 0)\n    - (lowShot ? keeperModifiers.lowPenalty : 0)\n    - (highShot ? keeperModifiers.highPenalty : 0)\n    - paceFactor * keeperModifiers.pacePenalty;\n  const threshold = clamp(\n    0.84 + skill * 0.15 + paceAdjustment + poorContactBonus\n      + characterModifiers.keeperThreshold + keeperModifiers.threshold + matchupAdjustment,\n    0.72,\n    1.12\n  );"
);
replaceRequired(
  "keeper catch archetype",
  "  const saveType = !saved\n    ? null\n    : reachScore < 0.53 && power < 0.76 && quality > 0.48 ? \"CATCH\" : \"PARRY\";",
  "  const catchSpeedLimit = 27.5 - characterModifiers.catchResistance * 4.2 + keeperModifiers.catchBias * 12;\n  const catchReachLimit = clamp(0.53 + keeperModifiers.catchBias * 0.3, 0.45, 0.62);\n  const saveType = !saved\n    ? null\n    : reachScore < catchReachLimit && state.shot.speedMps < catchSpeedLimit && quality > 0.48 ? \"CATCH\" : \"PARRY\";"
);
replaceRequired(
  "keeper plan identity",
  "  return {\n    saved,\n    saveType,",
  "  return {\n    keeperId: keeper.id,\n    keeperName: keeper.name,\n    keeperRole: keeper.role,\n    keeperTrait: keeper.trait,\n    keeperAccent: keeper.accent,\n    keeperTier: keeper.tier,\n    saved,\n    saveType,"
);

replaceRequired(
  "diagnostic identities",
  "  shot.diagnostics = {\n    stage: state.stage + 1,",
  "  const activeKeeper = keeperForStage(state.stage);\n  const activeWall = wallForStage(state.stage);\n  state.keeperId = activeKeeper.id;\n  state.wallId = activeWall.id;\n  shot.diagnostics = {\n    character: activeCharacter().name,\n    characterTrait: activeCharacter().trait,\n    goalkeeper: activeKeeper.name,\n    goalkeeperRole: activeKeeper.role,\n    goalkeeperTrait: activeKeeper.trait,\n    goalkeeperTier: activeKeeper.tier,\n    wallUnit: activeWall.name,\n    wallRole: activeWall.role,\n    wallTrait: activeWall.trait,\n    wallTier: activeWall.tier,\n    wallShiftMetres: Number((wallAnalysis.wall?.shift || 0).toFixed(2)),\n    wallPlayerCount: wallAnalysis.wall?.players?.length || 0,\n    stage: state.stage + 1,"
);

source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-physics-v15-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

export const resolveShotPhysics = generated.resolveShotPhysics;
export const sampleShotPath = generated.sampleShotPath;
