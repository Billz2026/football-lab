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

export const SCENARIOS = Object.freeze([
  {
    id: "left20",
    name: "THE OPENER",
    label: "20 YARDS · LEFT CHANNEL",
    distanceYards: 20,
    ballX: -2.7,
    wallPlayers: 4,
    protectedGoalX: -1.65,
    keeperX: 0.72,
    wind: 0.02,
    windVariance: 0.012,
    keeper: 0.18,
    aimSpeed: 0.92,
    camera: { sideOffset: -0.65, backDistance: 9.0, height: 2.8, fovY: 42, targetHeight: 1.0 }
  },
  {
    id: "central20",
    name: "CENTRAL TEST",
    label: "20 YARDS · CENTRAL",
    distanceYards: 20,
    ballX: 0,
    wallPlayers: 4,
    protectedGoalX: -1.45,
    keeperX: 0.86,
    wind: -0.035,
    windVariance: 0.014,
    keeper: 0.24,
    aimSpeed: 0.98,
    camera: { sideOffset: -0.8, backDistance: 9.0, height: 2.8, fovY: 42, targetHeight: 1.02 }
  },
  {
    id: "right22",
    name: "RIGHT CHANNEL",
    label: "22 YARDS · RIGHT CHANNEL",
    distanceYards: 22,
    ballX: 3.2,
    wallPlayers: 4,
    protectedGoalX: 1.75,
    keeperX: -0.76,
    wind: 0.055,
    windVariance: 0.016,
    keeper: 0.29,
    aimSpeed: 1.03,
    camera: { sideOffset: 0.68, backDistance: 9.1, height: 2.82, fovY: 42, targetHeight: 1.02 }
  },
  {
    id: "central24",
    name: "FIVE-MAN TEST",
    label: "24 YARDS · CENTRAL · 5-MAN WALL",
    distanceYards: 24,
    ballX: -0.45,
    wallPlayers: 5,
    protectedGoalX: -1.3,
    keeperX: 0.74,
    wind: -0.07,
    windVariance: 0.018,
    keeper: 0.35,
    aimSpeed: 1.08,
    camera: { sideOffset: -0.72, backDistance: 9.35, height: 2.88, fovY: 42, targetHeight: 1.04 }
  },
  {
    id: "left26",
    name: "BEND THE LINE",
    label: "26 YARDS · LEFT CHANNEL",
    distanceYards: 26,
    ballX: -4.8,
    wallPlayers: 5,
    protectedGoalX: -2.0,
    keeperX: 0.92,
    wind: 0.095,
    windVariance: 0.022,
    keeper: 0.4,
    aimSpeed: 1.12,
    camera: { sideOffset: -0.55, backDistance: 9.6, height: 2.94, fovY: 43, targetHeight: 1.06 }
  },
  {
    id: "right27",
    name: "REVERSE BEND",
    label: "27 YARDS · RIGHT CHANNEL",
    distanceYards: 27,
    ballX: 5.2,
    wallPlayers: 5,
    protectedGoalX: 2.05,
    keeperX: -0.94,
    wind: -0.11,
    windVariance: 0.024,
    keeper: 0.45,
    aimSpeed: 1.16,
    camera: { sideOffset: 0.55, backDistance: 9.7, height: 2.96, fovY: 43, targetHeight: 1.07 }
  },
  {
    id: "central30wind",
    name: "CROSSWIND",
    label: "30 YARDS · CENTRAL · CROSSWIND",
    distanceYards: 30,
    ballX: 0.75,
    wallPlayers: 5,
    protectedGoalX: -1.1,
    keeperX: 0.62,
    wind: 0.16,
    windVariance: 0.03,
    keeper: 0.5,
    aimSpeed: 1.2,
    camera: { sideOffset: -0.58, backDistance: 10.0, height: 3.0, fovY: 42, targetHeight: 1.08 }
  },
  {
    id: "wideLeft31",
    name: "WIDE LEFT",
    label: "31 YARDS · WIDE LEFT",
    distanceYards: 31,
    ballX: -7.4,
    wallPlayers: 5,
    protectedGoalX: -2.35,
    keeperX: 1.0,
    wind: -0.14,
    windVariance: 0.03,
    keeper: 0.54,
    aimSpeed: 1.23,
    camera: { sideOffset: -0.42, backDistance: 10.1, height: 3.02, fovY: 44, targetHeight: 1.09 }
  },
  {
    id: "wideRight32",
    name: "WIDE RIGHT",
    label: "32 YARDS · WIDE RIGHT",
    distanceYards: 32,
    ballX: 7.8,
    wallPlayers: 5,
    protectedGoalX: 2.4,
    keeperX: -1.02,
    wind: 0.18,
    windVariance: 0.032,
    keeper: 0.58,
    aimSpeed: 1.27,
    camera: { sideOffset: 0.42, backDistance: 10.2, height: 3.05, fovY: 44, targetHeight: 1.1 }
  },
  {
    id: "central34six",
    name: "THE SIX",
    label: "34 YARDS · CENTRAL · 6-MAN WALL",
    distanceYards: 34,
    ballX: -0.8,
    wallPlayers: 6,
    protectedGoalX: -1.25,
    keeperX: 0.7,
    wind: -0.19,
    windVariance: 0.034,
    keeper: 0.62,
    aimSpeed: 1.31,
    camera: { sideOffset: -0.68, backDistance: 10.45, height: 3.1, fovY: 41, targetHeight: 1.11 }
  },
  {
    id: "left36long",
    name: "LONG LEFT",
    label: "36 YARDS · LEFT OF CENTRE",
    distanceYards: 36,
    ballX: -3.8,
    wallPlayers: 5,
    protectedGoalX: -1.8,
    keeperX: 0.9,
    wind: 0.21,
    windVariance: 0.036,
    keeper: 0.66,
    aimSpeed: 1.35,
    camera: { sideOffset: -0.58, backDistance: 10.7, height: 3.14, fovY: 41, targetHeight: 1.12 }
  },
  {
    id: "right38long",
    name: "LONG RIGHT",
    label: "38 YARDS · RIGHT OF CENTRE",
    distanceYards: 38,
    ballX: 4.2,
    wallPlayers: 6,
    protectedGoalX: 1.9,
    keeperX: -0.92,
    wind: -0.22,
    windVariance: 0.038,
    keeper: 0.7,
    aimSpeed: 1.39,
    camera: { sideOffset: 0.58, backDistance: 10.9, height: 3.18, fovY: 41, targetHeight: 1.13 }
  },
  {
    id: "central40gale",
    name: "THE GALE",
    label: "40 YARDS · CENTRAL · HEAVY WIND",
    distanceYards: 40,
    ballX: 0.35,
    wallPlayers: 6,
    protectedGoalX: -1.15,
    keeperX: 0.64,
    wind: 0.27,
    windVariance: 0.045,
    keeper: 0.74,
    aimSpeed: 1.43,
    camera: { sideOffset: -0.64, backDistance: 11.15, height: 3.22, fovY: 40, targetHeight: 1.14 }
  },
  {
    id: "wideLeft42",
    name: "FORTY-TWO WIDE",
    label: "42 YARDS · WIDE LEFT · 6-MAN WALL",
    distanceYards: 42,
    ballX: -8.2,
    wallPlayers: 6,
    protectedGoalX: -2.45,
    keeperX: 1.05,
    wind: -0.25,
    windVariance: 0.044,
    keeper: 0.78,
    aimSpeed: 1.47,
    camera: { sideOffset: -0.38, backDistance: 11.35, height: 3.28, fovY: 42, targetHeight: 1.15 }
  },
  {
    id: "central45final",
    name: "THE DISTANCE KING",
    label: "45 YARDS · CENTRAL · 6-MAN WALL",
    distanceYards: 45,
    ballX: -1.1,
    wallPlayers: 6,
    protectedGoalX: -1.2,
    keeperX: 0.68,
    wind: 0.3,
    windVariance: 0.05,
    keeper: 0.82,
    aimSpeed: 1.52,
    camera: { sideOffset: -0.7, backDistance: 11.7, height: 3.35, fovY: 39, targetHeight: 1.17 }
  }
]);

export function scenarioForStage(stageIndex) {
  const index = Math.max(0, Number(stageIndex) || 0);
  const cycle = Math.floor(index / SCENARIOS.length);
  const base = SCENARIOS[index % SCENARIOS.length];
  const cycleWind = base.wind * (1 + cycle * 0.075);
  return {
    ...base,
    cycle,
    wallPlayers: Math.min(6, base.wallPlayers + (cycle >= 2 ? 1 : 0)),
    keeper: Math.min(0.88, base.keeper + cycle * 0.025),
    aimSpeed: Math.min(1.68, base.aimSpeed + cycle * 0.028),
    wind: Math.max(-0.32, Math.min(0.32, cycleWind)),
    windVariance: Math.min(0.065, (base.windVariance || 0.015) + cycle * 0.004)
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
