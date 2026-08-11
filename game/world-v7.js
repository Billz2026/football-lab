import {
  METRES_PER_YARD,
  GOAL,
  PITCH,
  SCENARIOS,
  scenarioForStage,
  ballWorld,
  buildCamera as buildBaseCamera,
  buildWall as buildBaseWall,
  keeperWorld,
  kickerWorld as kickerBaseWorld,
  supportingPlayers
} from "./world-v6.js?v=32.3";

export { METRES_PER_YARD, GOAL, PITCH, SCENARIOS, scenarioForStage, ballWorld, keeperWorld, supportingPlayers };

const STAGE_ONE_ID = "left20";

function normaliseGround(dx, dz) {
  const length = Math.hypot(dx, dz) || 1;
  return { x: dx / length, z: dz / length };
}

export function buildCamera(scenario) {
  if (scenario.id !== STAGE_ONE_ID) return buildBaseCamera(scenario);
  const ball = ballWorld(scenario);
  return {
    position: {
      x: ball.x - 0.42,
      y: 2.25,
      z: ball.z + 9.5
    },
    target: {
      x: -0.25,
      y: 0.95,
      z: 0
    },
    fovY: 36.5,
    near: 0.25
  };
}

export function buildWall(scenario) {
  if (scenario.id !== STAGE_ONE_ID) return buildBaseWall(scenario);
  const ball = ballWorld(scenario);
  const direction = normaliseGround(scenario.protectedGoalX - ball.x, GOAL.lineZ - ball.z);
  const centre = {
    x: ball.x + direction.x * 9.15,
    y: 0,
    z: ball.z + direction.z * 9.15
  };
  const tangent = { x: -direction.z, z: direction.x };
  const spacing = 0.58;
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

export function kickerWorld(scenario, progress = 0) {
  if (scenario.id !== STAGE_ONE_ID) return kickerBaseWorld(scenario, progress);
  const ball = ballWorld(scenario);
  const start = { x: ball.x - 0.9, y: 0, z: ball.z + 1.85 };
  const contact = { x: ball.x - 0.3, y: 0, z: ball.z + 0.42 };
  const t = Math.max(0, Math.min(1, progress));
  return {
    x: start.x + (contact.x - start.x) * t,
    y: 0,
    z: start.z + (contact.z - start.z) * t
  };
}
