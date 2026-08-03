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
    keeper: 0.25,
    aimSpeed: 0.99,
    camera: { sideOffset: -0.8, backDistance: 9.0, height: 2.8, fovY: 42, targetHeight: 1.02 }
  },
  {
    id: "right20",
    name: "RIGHT CHANNEL",
    label: "20 YARDS · RIGHT CHANNEL",
    distanceYards: 20,
    ballX: 2.8,
    wallPlayers: 4,
    protectedGoalX: 1.65,
    keeperX: -0.72,
    wind: 0.045,
    keeper: 0.31,
    aimSpeed: 1.04,
    camera: { sideOffset: 0.65, backDistance: 9.0, height: 2.8, fovY: 42, targetHeight: 1.0 }
  },
  {
    id: "central25",
    name: "TWENTY-FIVE OUT",
    label: "25 YARDS · CENTRAL",
    distanceYards: 25,
    ballX: -0.6,
    wallPlayers: 5,
    protectedGoalX: -1.35,
    keeperX: 0.78,
    wind: -0.075,
    keeper: 0.39,
    aimSpeed: 1.09,
    camera: { sideOffset: -0.75, backDistance: 9.5, height: 2.9, fovY: 42, targetHeight: 1.06 }
  },
  {
    id: "wideLeft30",
    name: "WIDE LEFT",
    label: "30 YARDS · WIDE LEFT",
    distanceYards: 30,
    ballX: -7.0,
    wallPlayers: 4,
    protectedGoalX: -2.25,
    keeperX: 0.95,
    wind: 0.10,
    keeper: 0.47,
    aimSpeed: 1.14,
    camera: { sideOffset: -0.45, backDistance: 10.0, height: 3.0, fovY: 44, targetHeight: 1.08 }
  },
  {
    id: "wideRight30",
    name: "WIDE RIGHT",
    label: "30 YARDS · WIDE RIGHT",
    distanceYards: 30,
    ballX: 7.0,
    wallPlayers: 4,
    protectedGoalX: 2.25,
    keeperX: -0.95,
    wind: -0.11,
    keeper: 0.56,
    aimSpeed: 1.2,
    camera: { sideOffset: 0.45, backDistance: 10.0, height: 3.0, fovY: 44, targetHeight: 1.08 }
  },
  {
    id: "long35",
    name: "THIRTY-FIVE OUT",
    label: "35 YARDS · LONG RANGE",
    distanceYards: 35,
    ballX: -1.2,
    wallPlayers: 5,
    protectedGoalX: -1.3,
    keeperX: 0.72,
    wind: 0.14,
    keeper: 0.66,
    aimSpeed: 1.27,
    camera: { sideOffset: -0.72, backDistance: 10.5, height: 3.1, fovY: 41, targetHeight: 1.1 }
  }
]);

export function scenarioForStage(stageIndex) {
  const cycle = Math.floor(stageIndex / SCENARIOS.length);
  const base = SCENARIOS[stageIndex % SCENARIOS.length];
  return {
    ...base,
    cycle,
    keeper: Math.min(0.84, base.keeper + cycle * 0.035),
    aimSpeed: Math.min(1.48, base.aimSpeed + cycle * 0.035),
    wind: Math.max(-0.22, Math.min(0.22, base.wind * (1 + cycle * 0.08)))
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
  return [
    { x: -13.5 * side, y: 0, z: 15.4, team: "attack" },
    { x: 13.8 * side, y: 0, z: 12.8, team: "defence" }
  ];
}
