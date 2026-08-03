import {
  clamp, lerp, smoothStep, stageConfig, state, idealPower, strikeQuality,
  currentAimTarget
} from "./core.js";

export function goalRect() {
  return { x: 770, y: 185, w: 310, h: 205 };
}

export function ballStart() {
  const stage = stageConfig();
  return {
    x: 250 - stage.distance * 102 + stage.startOffset,
    y: 570 + stage.distance * 38 + Math.abs(stage.startOffset) * 0.12
  };
}

function cubicBezier(path, t) {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return {
    x: uu * u * path.p0.x + 3 * uu * t * path.p1.x + 3 * u * tt * path.p2.x + tt * t * path.p3.x,
    y: uu * u * path.p0.y + 3 * uu * t * path.p1.y + 3 * u * tt * path.p2.y + tt * t * path.p3.y
  };
}

export function cubicPoint(path, t) {
  const progress = clamp(t, 0, 1);
  if (!path.segments) return cubicBezier(path, progress);
  const segment = path.segments.find((entry) => progress <= entry.to + 1e-6) || path.segments[path.segments.length - 1];
  const localT = clamp((progress - segment.from) / Math.max(0.0001, segment.to - segment.from), 0, 1);
  return cubicBezier(segment.path, localT);
}

function splitCubic(path, t) {
  const a = { x: lerp(path.p0.x, path.p1.x, t), y: lerp(path.p0.y, path.p1.y, t) };
  const b = { x: lerp(path.p1.x, path.p2.x, t), y: lerp(path.p1.y, path.p2.y, t) };
  const c = { x: lerp(path.p2.x, path.p3.x, t), y: lerp(path.p2.y, path.p3.y, t) };
  const d = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
  const e = { x: lerp(b.x, c.x, t), y: lerp(b.y, c.y, t) };
  const point = { x: lerp(d.x, e.x, t), y: lerp(d.y, e.y, t) };
  return {
    left: { p0: path.p0, p1: a, p2: d, p3: point },
    right: { p0: point, p1: e, p2: c, p3: path.p3 },
    point
  };
}

function signedPower(value) {
  return Math.sign(value) * Math.pow(Math.abs(value), 1.32);
}

export function buildTrajectory(target) {
  const start = ballStart();
  const stage = stageConfig();
  const power = state.shot.power ?? idealPower();
  const spin = signedPower(state.shot.curve ?? 0);
  const distance = Math.hypot(target.x - start.x, target.y - start.y);
  const lineOne = { x: lerp(start.x, target.x, 0.31), y: lerp(start.y, target.y, 0.31) };
  const lineTwo = { x: lerp(start.x, target.x, 0.71), y: lerp(start.y, target.y, 0.71) };

  const heightDemand = clamp((0.56 - state.shot.actualY) * 150, -20, 78);
  const arcHeight = 116 + stage.distance * 58 + power * 96 + heightDemand;
  const curveAmplitude = spin * (74 + stage.distance * 108);
  const windAmplitude = state.stageWind * (92 + stage.distance * 120);

  return {
    p0: start,
    p1: {
      x: lineOne.x - curveAmplitude * 0.24 + windAmplitude * 0.08,
      y: lineOne.y - arcHeight * 0.88
    },
    p2: {
      x: lineTwo.x + curveAmplitude * 0.82 + windAmplitude * 0.62,
      y: lineTwo.y - arcHeight * 0.54
    },
    p3: target,
    distance
  };
}

export function wallPlayers() {
  const stage = stageConfig();
  const spacing = 35;
  const centre = 600 + stage.wallOffset;
  const start = centre - ((stage.wall - 1) * spacing) / 2;
  return Array.from({ length: stage.wall }, (_, index) => ({
    x: start + index * spacing,
    y: 445 + Math.abs(index - (stage.wall - 1) / 2) * 1.5,
    index
  }));
}

export function wallJumpAt(renderT) {
  const centre = state.shot.wallJumpRenderT ?? state.shot.wallCrossT ?? 0.5;
  const lead = 0.105;
  const tail = 0.13;
  if (renderT < centre - lead || renderT > centre + tail) return 0;
  const local = (renderT - (centre - lead)) / (lead + tail);
  return Math.sin(clamp(local, 0, 1) * Math.PI) * (22 + stageConfig().wall * 0.75);
}

function wallCentreX() {
  const players = wallPlayers();
  return players.reduce((sum, player) => sum + player.x, 0) / Math.max(1, players.length);
}

function findWallCrossT(path) {
  const centre = wallCentreX();
  let bestT = 0.5;
  let bestDistance = Infinity;
  for (let step = 15; step <= 82; step += 1) {
    const t = step / 100;
    const distance = Math.abs(cubicBezier(path, t).x - centre);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestT = t;
    }
  }
  return bestT;
}

function circleRectOverlap(point, radius, rect) {
  const closestX = clamp(point.x, rect.left, rect.right);
  const closestY = clamp(point.y, rect.top, rect.bottom);
  return (point.x - closestX) ** 2 + (point.y - closestY) ** 2 <= radius ** 2;
}

function circleCircleOverlap(point, radius, circle) {
  const distance = Math.hypot(point.x - circle.x, point.y - circle.y);
  return distance <= radius + circle.radius;
}

function findWallCollision(path, crossT) {
  const players = wallPlayers();
  const startStep = Math.max(1, Math.floor((crossT - 0.12) * 240));
  const endStep = Math.min(239, Math.ceil((crossT + 0.12) * 240));

  for (let step = startStep; step <= endStep; step += 1) {
    const t = step / 240;
    const point = cubicBezier(path, t);
    const radius = lerp(15, 10, t);
    const jump = (() => {
      const local = (t - (crossT - 0.105)) / 0.235;
      return local >= 0 && local <= 1 ? Math.sin(local * Math.PI) * (22 + stageConfig().wall * 0.75) : 0;
    })();

    for (const player of players) {
      const head = { x: player.x, y: player.y - 54 - jump, radius: 11 };
      const body = { left: player.x - 15, right: player.x + 15, top: player.y - 44 - jump, bottom: player.y + 7 - jump };
      const legs = { left: player.x - 12, right: player.x + 12, top: player.y + 5 - jump, bottom: player.y + 31 - jump };
      if (circleCircleOverlap(point, radius, head) || circleRectOverlap(point, radius, body) || circleRectOverlap(point, radius, legs)) {
        return { type: "WALL", point, pathT: t, playerIndex: player.index };
      }
    }
  }
  return null;
}

function findGoalFrameCollision(target) {
  const goal = goalRect();
  const collisionRadius = 15;
  const vertical = target.y >= goal.y - collisionRadius && target.y <= goal.y + goal.h + collisionRadius;
  const horizontal = target.x >= goal.x - collisionRadius && target.x <= goal.x + goal.w + collisionRadius;

  if (vertical && Math.abs(target.x - goal.x) <= collisionRadius) {
    return { type: "POST", side: "LEFT", point: { x: goal.x, y: clamp(target.y, goal.y, goal.y + goal.h) } };
  }
  if (vertical && Math.abs(target.x - (goal.x + goal.w)) <= collisionRadius) {
    return { type: "POST", side: "RIGHT", point: { x: goal.x + goal.w, y: clamp(target.y, goal.y, goal.y + goal.h) } };
  }
  if (horizontal && Math.abs(target.y - goal.y) <= collisionRadius) {
    return { type: "BAR", point: { x: clamp(target.x, goal.x, goal.x + goal.w), y: goal.y } };
  }
  return null;
}

function baseFlightDurationMs(power) {
  const stage = stageConfig();
  const speedFactor = smoothStep(clamp((power - 0.12) / 0.88, 0, 1));
  return lerp(1120, 710, speedFactor) + stage.distance * 105;
}

function calculateKeeperPlan(target, flightDuration) {
  const stage = stageConfig();
  const goal = goalRect();
  const power = state.shot.power ?? idealPower();
  const start = { x: goal.x + goal.w * 0.5, y: goal.y + goal.h * 0.58 };
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const flightSeconds = flightDuration / 1000;

  // Curl delays the read slightly, while better keepers react sooner and travel faster.
  const reactionSeconds = lerp(0.34, 0.155, stage.keeper) + Math.abs(state.shot.curve ?? 0) * 0.028;
  const availableSeconds = Math.max(0, flightSeconds - reactionSeconds);
  const horizontalSpeed = lerp(190, 382, stage.keeper);
  const verticalSpeed = lerp(118, 238, stage.keeper);
  const reachX = 24 + horizontalSpeed * availableSeconds;
  const reachY = 19 + verticalSpeed * availableSeconds;
  const cornerDifficulty = Math.abs(dx) > goal.w * 0.34 && target.y < goal.y + goal.h * 0.42 ? 1.13 : 1;
  const reachScore = Math.sqrt((dx / reachX) ** 2 + (dy / reachY) ** 2) * cornerDifficulty;

  const pacePenalty = lerp(0.06, -0.13, smoothStep(power));
  const skillThreshold = lerp(0.66, 0.91, stage.keeper);
  const saveThreshold = clamp(skillThreshold + pacePenalty, 0.62, 1.02);
  const saved = reachScore <= saveThreshold;
  const contactScale = saved ? 1 : Math.min(1, saveThreshold / Math.max(reachScore, 0.001));
  const contact = { x: start.x + dx * contactScale, y: start.y + dy * contactScale };
  const reactionDelay = clamp(reactionSeconds / flightSeconds, 0.16, 0.68);
  const saveType = !saved ? null : reachScore < 0.50 && power < 0.77 ? "CATCH" : "PARRY";

  return {
    saved,
    saveType,
    start,
    target,
    contact,
    reactionDelay,
    interceptT: 0.82,
    reachScore,
    reachX,
    reachY
  };
}

function reboundPath(point, type, collision = {}) {
  const power = state.shot.power ?? idealPower();
  const centreX = goalRect().x + goalRect().w / 2;
  let end;

  if (type === "WALL") {
    end = { x: point.x - (86 + power * 62), y: point.y + 92 + power * 28 };
  } else if (type === "POST") {
    const direction = collision.side === "LEFT" ? -1 : 1;
    end = { x: point.x + direction * (105 + power * 60), y: point.y + 58 + power * 24 };
  } else if (type === "BAR") {
    const direction = Math.sign(point.x - centreX || 1);
    end = { x: point.x + direction * (42 + power * 36), y: point.y + 118 + power * 34 };
  } else if (type === "SAVE" && state.shot.saveType === "PARRY") {
    const direction = Math.sign(point.x - centreX || 1);
    end = { x: point.x + direction * (82 + power * 46), y: point.y + 82 + power * 24 };
  } else {
    end = { x: point.x, y: point.y + 12 };
  }

  return {
    p0: point,
    p1: { x: lerp(point.x, end.x, 0.28), y: point.y + (type === "BAR" ? 14 : 5) },
    p2: { x: lerp(point.x, end.x, 0.74), y: end.y - 28 },
    p3: end
  };
}

function segmentedTrajectory(primary, impactRenderT, bounce) {
  return {
    segments: [
      { from: 0, to: impactRenderT, path: primary },
      { from: impactRenderT, to: 1, path: bounce }
    ]
  };
}

function targetFromInputs() {
  const shot = state.shot;
  const stage = stageConfig();
  const goal = goalRect();
  const power = clamp(shot.power ?? idealPower(), 0, 1);
  const quality = strikeQuality(power);
  const spin = signedPower(shot.curve ?? 0);
  const curveDrift = spin * (0.052 + stage.distance * 0.085);
  const windDrift = state.stageWind * (0.18 + stage.distance * 0.24);
  const underhitDrop = power < 0.18 ? smoothStep((0.18 - power) / 0.18) * 0.09 : 0;
  const overhitRise = power > 0.93 ? smoothStep((power - 0.93) / 0.07) * 0.07 : 0;

  shot.strikeQuality = quality;
  shot.speedMps = lerp(18, 34, smoothStep(power));
  shot.actualX = shot.aimX + curveDrift + windDrift + spin * (1 - quality) * 0.018;
  shot.actualY = shot.aimY + underhitDrop - overhitRise + Math.abs(spin) * 0.006;

  return {
    x: goal.x + shot.actualX * goal.w,
    y: goal.y + shot.actualY * goal.h
  };
}

export function resolveShotPhysics() {
  const shot = state.shot;
  const goal = goalRect();
  const target = targetFromInputs();
  const directPath = buildTrajectory(target);
  const crossT = findWallCrossT(directPath);
  shot.wallCrossT = crossT;

  const wall = findWallCollision(directPath, crossT);
  const frame = wall ? null : findGoalFrameCollision(target);
  const withinGoal = shot.actualX > 0.018 && shot.actualX < 0.982 && shot.actualY > 0.02 && shot.actualY < 0.982;
  const primaryFlightDuration = baseFlightDurationMs(shot.power ?? idealPower());

  let flightDuration = primaryFlightDuration;
  let trajectory = directPath;

  if (wall) {
    const split = splitCubic(directPath, wall.pathT);
    const impactRenderT = clamp(0.61 + wall.pathT * 0.17, 0.66, 0.76);
    shot.outcome = "WALL";
    shot.collision = { ...wall, renderT: impactRenderT };
    shot.impactRenderT = impactRenderT;
    shot.wallJumpRenderT = impactRenderT;
    trajectory = segmentedTrajectory(split.left, impactRenderT, reboundPath(split.point, "WALL", wall));
    flightDuration += 300;
  } else if (frame) {
    const impactRenderT = 0.82;
    const framePath = buildTrajectory(frame.point);
    shot.outcome = frame.type;
    shot.collision = { ...frame, renderT: impactRenderT };
    shot.impactRenderT = impactRenderT;
    shot.wallJumpRenderT = crossT;
    trajectory = segmentedTrajectory(framePath, impactRenderT, reboundPath(frame.point, frame.type, frame));
    flightDuration += 260;
  } else if (withinGoal) {
    const keeperPlan = calculateKeeperPlan(target, primaryFlightDuration);
    shot.keeperPlan = keeperPlan;
    shot.saveType = keeperPlan.saveType;
    shot.wallJumpRenderT = crossT;

    if (keeperPlan.saved) {
      const savePath = buildTrajectory(keeperPlan.contact);
      const impactRenderT = 0.82;
      keeperPlan.impactRenderT = impactRenderT;
      shot.outcome = "SAVE";
      shot.impactRenderT = impactRenderT;
      trajectory = segmentedTrajectory(savePath, impactRenderT, reboundPath(keeperPlan.contact, "SAVE"));
      flightDuration += keeperPlan.saveType === "PARRY" ? 255 : 120;
    } else {
      shot.outcome = "GOAL";
      trajectory = directPath;
    }
  } else {
    shot.outcome = "MISS";
    shot.wallJumpRenderT = crossT;
  }

  shot.topCorner = shot.outcome === "GOAL" && shot.actualY < 0.29 && (shot.actualX < 0.27 || shot.actualX > 0.73);
  shot.trajectory = trajectory;
  shot.pathEndT = 1;

  return { flightDuration };
}

export { currentAimTarget };
