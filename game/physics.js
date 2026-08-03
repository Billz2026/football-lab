import { clamp, lerp, stageConfig, state, idealPower, currentAimTarget } from "./core.js";

export function goalRect() { return { x: 770, y: 185, w: 310, h: 205 }; }
export function ballStart() {
  const distance = stageConfig().distance;
  return { x: 250 - distance * 90, y: 570 + distance * 35 };
}

export function cubicPoint(path, t) {
  const u = 1 - t, uu = u * u, tt = t * t;
  return {
    x: uu * u * path.p0.x + 3 * uu * t * path.p1.x + 3 * u * tt * path.p2.x + tt * t * path.p3.x,
    y: uu * u * path.p0.y + 3 * uu * t * path.p1.y + 3 * u * tt * path.p2.y + tt * t * path.p3.y
  };
}

export function buildTrajectory(target) {
  const start = ballStart();
  const { curve = 0, power = idealPower() } = state.shot;
  const direction = target.x >= start.x ? 1 : -1;
  const arc = 80 + Math.pow(power, 1.45) * 270;
  const lateralBend = curve * 150 + state.stageWind * 82;
  return {
    p0: start,
    p1: { x: start.x + 235 * direction + lateralBend * 0.35, y: start.y - arc * 0.64 },
    p2: { x: target.x - 245 * direction + lateralBend * 0.85, y: target.y - arc * 0.72 },
    p3: target
  };
}

export function wallPlayers() {
  const count = stageConfig().wall, spacing = 35, start = 600 - ((count - 1) * spacing) / 2;
  return Array.from({ length: count }, (_, index) => ({
    x: start + index * spacing,
    y: 445 + Math.abs(index - (count - 1) / 2) * 1.5,
    index
  }));
}

export function wallJumpAt(pathT) {
  if (pathT < 0.35 || pathT > 0.64) return 0;
  return Math.sin(((pathT - 0.35) / 0.29) * Math.PI) * 23;
}

function findWallCollision(path) {
  const players = wallPlayers();
  for (let step = 18; step <= 78; step += 1) {
    const t = step / 100, point = cubicPoint(path, t), radius = lerp(15, 10, t), jump = wallJumpAt(t);
    for (const player of players) {
      const left = player.x - 17 - radius, right = player.x + 17 + radius;
      const top = player.y - 68 - jump - radius, bottom = player.y + 30 - jump + radius;
      if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) {
        return { type: "WALL", point, pathT: t, playerIndex: player.index };
      }
    }
  }
  return null;
}

function findGoalFrameCollision(target) {
  const goal = goalRect(), postRadius = 13;
  const vertical = target.y >= goal.y - postRadius && target.y <= goal.y + goal.h + postRadius;
  const horizontal = target.x >= goal.x - postRadius && target.x <= goal.x + goal.w + postRadius;
  if (vertical && Math.abs(target.x - goal.x) <= postRadius) return { type: "POST", point: { x: goal.x, y: clamp(target.y, goal.y, goal.y + goal.h) } };
  if (vertical && Math.abs(target.x - goal.x - goal.w) <= postRadius) return { type: "POST", point: { x: goal.x + goal.w, y: clamp(target.y, goal.y, goal.y + goal.h) } };
  if (horizontal && Math.abs(target.y - goal.y) <= postRadius) return { type: "BAR", point: { x: clamp(target.x, goal.x, goal.x + goal.w), y: goal.y } };
  return null;
}

function calculateKeeperPlan(target) {
  const stage = stageConfig(), goal = goalRect();
  const start = { x: goal.x + goal.w * 0.5, y: goal.y + goal.h * 0.58 };
  const dx = target.x - start.x, dy = target.y - start.y, power = state.shot.power ?? idealPower();
  const speedPenalty = lerp(1.08, 0.78, power);
  const horizontalReach = lerp(74, 172, stage.keeper) * speedPenalty;
  const verticalReach = lerp(46, 112, stage.keeper) * speedPenalty;
  const reachScore = Math.sqrt((dx / horizontalReach) ** 2 + (dy / verticalReach) ** 2);
  const saved = reachScore <= 1 && power < lerp(0.93, 1.02, stage.keeper);
  const scale = saved ? 1 : Math.min(1, 0.92 / Math.max(reachScore, 0.001));
  return {
    saved, start, target,
    contact: { x: start.x + dx * scale, y: start.y + dy * scale },
    reactionDelay: lerp(0.52, 0.28, stage.keeper),
    reachScore
  };
}

export function resolveShotPhysics() {
  const shot = state.shot, goal = goalRect(), ideal = idealPower();
  shot.actualX = shot.aimX + state.stageWind * 0.30 + shot.curve * 0.045;
  shot.actualY = shot.aimY + (ideal - shot.power) * 0.52 + Math.abs(shot.curve) * 0.012;
  const target = { x: goal.x + shot.actualX * goal.w, y: goal.y + shot.actualY * goal.h };
  const originalPath = buildTrajectory(target);
  const wall = findWallCollision(originalPath);
  const frame = wall ? null : findGoalFrameCollision(target);
  const withinGoal = shot.actualX > 0.015 && shot.actualX < 0.985 && shot.actualY > 0.018 && shot.actualY < 0.985;

  let endpoint = target;
  if (wall) {
    shot.outcome = "WALL"; shot.collision = wall; endpoint = wall.point;
  } else if (frame) {
    shot.outcome = frame.type; shot.collision = frame; endpoint = frame.point;
  } else if (withinGoal) {
    shot.keeperPlan = calculateKeeperPlan(target);
    shot.outcome = shot.keeperPlan.saved ? "SAVE" : "GOAL";
    if (shot.outcome === "SAVE") endpoint = shot.keeperPlan.contact;
  } else {
    shot.outcome = "MISS";
  }

  shot.topCorner = shot.outcome === "GOAL" && shot.actualY < 0.31 && (shot.actualX < 0.28 || shot.actualX > 0.72);
  shot.trajectory = wall ? originalPath : buildTrajectory(endpoint);
  shot.pathEndT = wall ? wall.pathT : 1;
  const baseFlight = lerp(1040, 760, clamp(shot.power, 0, 1));
  return { flightDuration: baseFlight * (0.55 + shot.pathEndT * 0.45) };
}

export { currentAimTarget };
