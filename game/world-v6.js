export const METRES_PER_YARD = 0.9144;

export const GOAL = Object.freeze({
  halfWidth: 3.66,
  width: 7.32,
  height: 2.44,
  lineZ: 0,
  depth: 2.05
});

export const PITCH = Object.freeze({
  halfWidth: 34,
  penaltyHalfWidth: 20.16,
  penaltyDepth: 16.5,
  sixYardHalfWidth: 9.16,
  sixYardDepth: 5.5,
  penaltySpotZ: 11,
  arcRadius: 9.15
});

export const CHAPTERS = Object.freeze([
  Object.freeze({ number: 1, name: "FIRST TOUCH", venue: "FOUNDATION GROUND", environment: "academy", weather: "CLEAR MORNING", weatherId: "clear", weatherSeverity: 0.02 }),
  Object.freeze({ number: 2, name: "CITY LIGHTS", venue: "BOROUGH ARENA", environment: "city", weather: "EVENING BREEZE", weatherId: "breeze", weatherSeverity: 0.12 }),
  Object.freeze({ number: 3, name: "NIGHT SHIFT", venue: "CONTINENTAL PARK", environment: "night", weather: "COOL NIGHT", weatherId: "night", weatherSeverity: 0.08 }),
  Object.freeze({ number: 4, name: "STORM CIRCUIT", venue: "TEMPEST STADIUM", environment: "storm", weather: "DRIVING RAIN", weatherId: "rain", weatherSeverity: 0.48 }),
  Object.freeze({ number: 5, name: "WORLD STAGE", venue: "CROWN ARENA", environment: "world", weather: "PRIME-TIME LIGHTS", weatherId: "spotlight", weatherSeverity: 0.16 }),
  Object.freeze({ number: 6, name: "LEGENDS SUMMIT", venue: "SUMMIT BOWL", environment: "summit", weather: "COLD HIGH WIND", weatherId: "haze", weatherSeverity: 0.34 })
]);

const STAGE_BLUEPRINTS = Object.freeze([
  ["left20", "THE FIRST STRIKE", 19, -2.2, 3, -1.35, 0.62, 0.015, 0.010, 0.16, 0.90, "academy", "academy-line"],
  ["central20", "FIND THE CORNER", 20, 0, 4, -1.15, 0.72, -0.025, 0.012, 0.20, 0.94, "academy", "academy-line"],
  ["right22", "OPEN YOUR BODY", 21, 2.8, 4, 1.45, -0.68, 0.038, 0.014, 0.24, 0.98, "reflex", "academy-line"],
  ["central24", "OVER THE LINE", 22, -0.3, 4, -1.25, 0.72, -0.048, 0.015, 0.28, 1.02, "reflex", "compact"],
  ["left26", "FOUNDATION FINAL", 24, -4.2, 4, -1.85, 0.84, 0.065, 0.018, 0.32, 1.06, "giant", "compact"],

  ["right27", "STREETLIGHT BEND", 23, 4.5, 4, 1.85, -0.82, -0.075, 0.020, 0.34, 1.08, "giant", "compact"],
  ["central30wind", "TRAFFIC WIND", 25, 0.5, 4, -1.05, 0.60, 0.095, 0.022, 0.38, 1.11, "reader", "leaping"],
  ["wideLeft31", "BOROUGH ANGLE", 26, -6.2, 5, -2.15, 0.94, -0.105, 0.024, 0.41, 1.14, "reader", "leaping"],
  ["wideRight32", "NEON REVERSE", 28, 6.4, 5, 2.20, -0.96, 0.125, 0.025, 0.44, 1.17, "aggressive", "reading"],
  ["central34six", "CITY FINAL", 30, -0.5, 5, -1.20, 0.68, -0.14, 0.028, 0.47, 1.20, "aggressive", "reading"],

  ["left36long", "THE AWAY END", 27, -3.7, 5, -1.75, 0.86, 0.13, 0.026, 0.48, 1.21, "reflex", "reading"],
  ["right38long", "EUROPEAN NIGHT", 29, 4.0, 5, 1.80, -0.88, -0.145, 0.028, 0.51, 1.24, "giant", "staggered"],
  ["central40gale", "UNDER THE LIGHTS", 31, 0.4, 5, -1.05, 0.62, 0.16, 0.030, 0.54, 1.27, "reader", "staggered"],
  ["wideLeft42", "SILENT CROWD", 33, -7.2, 5, -2.35, 0.98, -0.175, 0.032, 0.57, 1.30, "aggressive", "compact"],
  ["central45final", "CONTINENTAL FINAL", 35, -0.8, 6, -1.20, 0.68, 0.19, 0.034, 0.60, 1.33, "reader", "leaping"],

  ["storm-left", "RAIN CHANNEL", 30, -5.0, 5, -1.95, 0.90, -0.18, 0.040, 0.60, 1.33, "giant", "leaping"],
  ["storm-centre", "SLICK SURFACE", 32, 0.2, 5, -1.10, 0.64, 0.20, 0.042, 0.63, 1.36, "reflex", "reading"],
  ["storm-right", "AGAINST THE GUST", 34, 5.7, 6, 2.10, -0.94, -0.225, 0.045, 0.66, 1.39, "reader", "staggered"],
  ["storm-wide", "EYE OF THE STORM", 36, -7.7, 6, -2.42, 1.02, 0.245, 0.048, 0.69, 1.42, "aggressive", "staggered"],
  ["storm-final", "TEMPEST FINAL", 38, 0.9, 6, 1.18, -0.70, -0.265, 0.050, 0.72, 1.45, "giant", "compact"],

  ["world-open", "THE WORLD STAGE", 34, -2.0, 5, -1.55, 0.78, 0.15, 0.032, 0.70, 1.43, "reflex", "reading"],
  ["world-left", "CROWN LEFT", 36, -5.4, 6, -2.05, 0.92, -0.18, 0.035, 0.73, 1.46, "giant", "staggered"],
  ["world-right", "CROWN RIGHT", 38, 5.8, 6, 2.12, -0.94, 0.205, 0.038, 0.76, 1.49, "reader", "compact"],
  ["world-pressure", "PRIME TIME", 40, 0.4, 6, -1.12, 0.66, -0.225, 0.040, 0.79, 1.52, "aggressive", "leaping"],
  ["world-final", "WORLD FINAL", 42, -0.7, 6, -1.18, 0.68, 0.245, 0.042, 0.82, 1.55, "reader", "staggered"],

  ["legend-angle", "LEGENDS ANGLE", 37, -7.6, 6, -2.42, 1.02, -0.22, 0.042, 0.80, 1.54, "reflex", "staggered"],
  ["legend-power", "THUNDER STRIKE", 39, 2.8, 6, 1.65, -0.82, 0.245, 0.044, 0.82, 1.57, "giant", "leaping"],
  ["legend-whip", "IMPOSSIBLE BEND", 41, -5.8, 6, -2.18, 0.96, -0.27, 0.047, 0.84, 1.60, "reader", "reading"],
  ["legend-ice", "LAST MINUTE", 43, 0.8, 6, 1.15, -0.70, 0.285, 0.050, 0.86, 1.63, "aggressive", "compact"],
  ["legend-final", "THE SUMMIT", 45, -0.6, 6, -1.20, 0.68, -0.30, 0.052, 0.88, 1.66, "reader", "staggered"]
]);

function cameraFor(distanceYards, ballX, stageIndex) {
  const side = Math.abs(ballX) < 0.8 ? -0.68 : Math.sign(ballX) * 0.5;
  const progress = stageIndex / Math.max(1, STAGE_BLUEPRINTS.length - 1);
  return Object.freeze({
    sideOffset: side,
    backDistance: 8.9 + distanceYards * 0.062,
    height: 2.78 + progress * 0.56,
    fovY: Math.abs(ballX) > 6 ? 43 : distanceYards > 39 ? 40 : 42,
    targetHeight: 1.0 + progress * 0.16
  });
}

export const SCENARIOS = Object.freeze(STAGE_BLUEPRINTS.map((blueprint, stageIndex) => {
  const [
    id, name, distanceYards, ballX, wallPlayers, protectedGoalX, keeperX,
    wind, windVariance, keeper, aimSpeed, keeperId, wallId
  ] = blueprint;
  const chapterIndex = Math.floor(stageIndex / 5);
  const chapter = CHAPTERS[chapterIndex];
  const channel = ballX < -4.5 ? "WIDE LEFT" : ballX < -1.2 ? "LEFT CHANNEL" : ballX > 4.5 ? "WIDE RIGHT" : ballX > 1.2 ? "RIGHT CHANNEL" : "CENTRAL";
  return Object.freeze({
    id,
    name,
    label: `${distanceYards} YARDS · ${channel}${wallPlayers >= 6 ? " · 6-MAN WALL" : ""}`,
    distanceYards,
    ballX,
    wallPlayers,
    protectedGoalX,
    keeperX,
    wind,
    windVariance,
    keeper,
    aimSpeed,
    keeperId,
    wallId,
    keeperTier: chapterIndex + 1,
    wallTier: chapterIndex + 1,
    chapterNumber: chapter.number,
    chapterName: chapter.name,
    chapterStage: (stageIndex % 5) + 1,
    totalCampaignStages: STAGE_BLUEPRINTS.length,
    venue: chapter.venue,
    environment: chapter.environment,
    weather: chapter.weather,
    weatherId: chapter.weatherId,
    weatherSeverity: chapter.weatherSeverity,
    difficulty: stageIndex / Math.max(1, STAGE_BLUEPRINTS.length - 1),
    camera: cameraFor(distanceYards, ballX, stageIndex)
  });
}));

export function scenarioForStage(stageIndex) {
  const training = globalThis.__footballLabTrainingScenario;
  if (training?.active) {
    return {
      ...training,
      cycle: 0,
      chapterCycle: 0
    };
  }
  const index = Math.max(0, Number(stageIndex) || 0);
  const cycle = Math.floor(index / SCENARIOS.length);
  const base = SCENARIOS[index % SCENARIOS.length];
  const cycleWind = base.wind * (1 + cycle * 0.06);
  return {
    ...base,
    cycle,
    chapterCycle: cycle,
    wallPlayers: Math.min(6, base.wallPlayers + (cycle >= 1 ? 1 : 0)),
    keeper: Math.min(0.92, base.keeper + cycle * 0.018),
    aimSpeed: Math.min(1.72, base.aimSpeed + cycle * 0.022),
    wind: Math.max(-0.32, Math.min(0.32, cycleWind)),
    windVariance: Math.min(0.065, (base.windVariance || 0.015) + cycle * 0.003),
    keeperTier: base.keeperTier + cycle,
    wallTier: base.wallTier + cycle
  };
}

export function ballWorld(scenario) {
  return { x: scenario.ballX, y: 0.11, z: scenario.distanceYards * METRES_PER_YARD };
}

export function buildCamera(scenario) {
  const ball = ballWorld(scenario);
  const config = scenario.camera;
  return {
    position: { x: ball.x + config.sideOffset, y: config.height, z: ball.z + config.backDistance },
    target: { x: ball.x * 0.08, y: config.targetHeight, z: 0 },
    fovY: config.fovY,
    near: 0.25
  };
}

function normaliseGround(dx, dz) {
  const length = Math.hypot(dx, dz) || 1;
  return { x: dx / length, z: dz / length };
}

export function buildWall(scenario) {
  const ball = ballWorld(scenario);
  const direction = normaliseGround(scenario.protectedGoalX - ball.x, GOAL.lineZ - ball.z);
  const centre = {
    x: ball.x + direction.x * 9.15,
    y: 0,
    z: ball.z + direction.z * 9.15
  };
  const tangent = { x: -direction.z, z: direction.x };
  const spacing = 0.68;
  const startOffset = -((scenario.wallPlayers - 1) * spacing) / 2;
  const players = Array.from({ length: scenario.wallPlayers }, (_, index) => {
    const offset = startOffset + index * spacing;
    return {
      index,
      x: centre.x + tangent.x * offset,
      y: 0,
      z: centre.z + tangent.z * offset,
      facing: Math.atan2(direction.x, -direction.z)
    };
  });
  return { centre, direction, tangent, players };
}

export function keeperWorld(scenario) {
  return { x: scenario.keeperX, y: 0, z: 0.38 };
}

export function kickerWorld(scenario, progress = 0) {
  const ball = ballWorld(scenario);
  const start = { x: ball.x - 1.0, y: 0, z: ball.z + 2.2 };
  const contact = { x: ball.x - 0.32, y: 0, z: ball.z + 0.48 };
  const t = Math.max(0, Math.min(1, progress));
  return {
    x: start.x + (contact.x - start.x) * t,
    y: 0,
    z: start.z + (contact.z - start.z) * t
  };
}

export function supportingPlayers(scenario) {
  const side = Math.sign(scenario.ballX || -1);
  const distanceShift = Math.max(0, scenario.distanceYards - 25) * 0.08;
  return [
    { x: -13.5 * side, y: 0, z: 15.4 + distanceShift, team: "attack" },
    { x: 13.8 * side, y: 0, z: 12.8 + distanceShift * 0.7, team: "defence" }
  ];
}
