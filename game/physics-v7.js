import {
  clamp, lerp, smoothStep, state, stageConfig, idealPower, strikeQuality
} from "./core-v6.js?v=32.3";
import { GOAL, ballWorld, buildWall, keeperWorld } from "./world-v7.js?v=32.3";

const BALL_RADIUS = 0.11;
const SAMPLE_COUNT = 200;

function signedCurve(value) {
  return Math.sign(value) * Math.pow(Math.abs(value), 1.3);
}

function buildDirectPath(target) {
  const stage = stageConfig();
  const start = ballWorld(stage);
  const power = state.shot.power ?? idealPower();
  const curve = signedCurve(state.shot.curve ?? 0);
  const distance = start.z;
  const requestedHeight = Math.max(0, target.y - 1.1);
  const powerFlattening = (0.7 - power) * 0.52;
  const arcHeight = clamp(
    0.92 + distance * 0.018 + powerFlattening + requestedHeight * 0.12,
    1.0,
    1.68
  );
  const curveBulge = curve * (0.48 + distance * 0.021);
  const windBulge = state.stageWind * (0.48 + distance * 0.015);

  return Array.from({ length: SAMPLE_COUNT + 1 }, (_, index) => {
    const t = index / SAMPLE_COUNT;
    const lineX = lerp(start.x, target.x, t);
    const lineY = lerp(start.y, target.y, t);
    const curveEnvelope = Math.sin(Math.PI * t) * Math.pow(t, 1.12);
    const windEnvelope = Math.sin(Math.PI * t) * Math.pow(t, 1.34);
    const lift = arcHeight * 4 * t * (1 - t);
    return {
      x: lineX + curveBulge * curveEnvelope + windBulge * windEnvelope,
      y: Math.max(0.03, lineY + lift),
      z: lerp(start.z, GOAL.lineZ, t),
      t
    };
  });
}

function targetFromInputs() {
  const stage = stageConfig();
  const shot = state.shot;
  const power = clamp(shot.power ?? idealPower(), 0, 1);
  const quality = strikeQuality(power);
  const curve = signedCurve(shot.curve ?? 0);
  const finalCurve = curve * (0.21 + stage.distanceYards * 0.0055);
  const finalWind = state.stageWind * (0.24 + stage.distanceYards * 0.0065);
  const underhitDrop = power < 0.24 ? smoothStep((0.24 - power) / 0.24) * 0.14 : 0;
  const overhitRise = power > 0.94 ? smoothStep((power - 0.94) / 0.06) * 0.075 : 0;

  shot.strikeQuality = quality;
  shot.speedMps = lerp(20, 35.5, smoothStep(power));
  shot.actualX = shot.aimX + finalCurve / GOAL.width + finalWind / GOAL.width;
  shot.actualY = shot.aimY + underhitDrop - overhitRise + Math.abs(curve) * 0.003;

  return {
    x: -GOAL.halfWidth + shot.actualX * GOAL.width,
    y: GOAL.height * (1 - shot.actualY),
    z: GOAL.lineZ
  };
}

function findWallCollision(path) {
  const wall = buildWall(stageConfig());
  for (let index = 1; index < path.length - 1; index += 1) {
    const point = path[index];
    const flightProgress = index / (path.length - 1);
    const jumpWindow = Math.max(0, 1 - Math.abs(flightProgress - 0.5) / 0.15);
    const jumpHeight = Math.sin(jumpWindow * Math.PI / 2) * 0.3;
    for (const player of wall.players) {
      const groundDistance = Math.hypot(point.x - player.x, point.z - player.z);
      const playerHeight = 1.84 + jumpHeight;
      if (
        groundDistance <= 0.31 + BALL_RADIUS
        && point.y <= playerHeight + BALL_RADIUS
        && point.y >= 0.03
      ) {
        return { type: "WALL", index, point, playerIndex: player.index };
      }
    }
  }
  return null;
}

function findFrameCollision(target) {
  const radius = 0.14;
  const insideVertical = target.y >= -radius && target.y <= GOAL.height + radius;
  if (insideVertical && Math.abs(target.x + GOAL.halfWidth) <= radius) {
    return { type: "POST", side: "LEFT", point: { ...target, x: -GOAL.halfWidth } };
  }
  if (insideVertical && Math.abs(target.x - GOAL.halfWidth) <= radius) {
    return { type: "POST", side: "RIGHT", point: { ...target, x: GOAL.halfWidth } };
  }
  if (
    target.x >= -GOAL.halfWidth - radius
    && target.x <= GOAL.halfWidth + radius
    && Math.abs(target.y - GOAL.height) <= radius
  ) {
    return { type: "BAR", point: { ...target, y: GOAL.height } };
  }
  return null;
}

function calculateKeeperPlan(target, flightSeconds) {
  const stage = stageConfig();
  const start = keeperWorld(stage);
  const handStart = { x: start.x, y: 1.08, z: start.z };
  const dx = target.x - handStart.x;
  const dy = target.y - handStart.y;
  const reaction = lerp(0.35, 0.16, stage.keeper) + Math.abs(state.shot.curve ?? 0) * 0.028;
  const available = Math.max(0, flightSeconds - reaction);
  const reachX = 0.72 + stage.keeper * 1.0 + available * lerp(1.22, 1.95, stage.keeper);
  const reachY = 0.58 + stage.keeper * 0.68 + available * 0.46;
  const reachScore = Math.sqrt((dx / reachX) ** 2 + (dy / reachY) ** 2);
  const pacePenalty = lerp(0.075, -0.12, smoothStep(state.shot.power ?? idealPower()));
  const threshold = clamp(0.76 + stage.keeper * 0.18 + pacePenalty, 0.68, 1.0);
  const saved = reachScore <= threshold;
  const contactScale = saved ? 1 : Math.min(1, threshold / Math.max(reachScore, 0.001));
  const contact = {
    x: handStart.x + dx * contactScale,
    y: handStart.y + dy * contactScale,
    z: 0.28
  };
  const saveType = !saved
    ? null
    : reachScore < 0.48 && (state.shot.power ?? 0.7) < 0.77 ? "CATCH" : "PARRY";
  return { saved, saveType, start, contact, reaction, flightSeconds, reachScore };
}

function appendRebound(path, collision, type) {
  const before = path.slice(0, collision.index + 1);
  const point = collision.point;
  const stage = stageConfig();
  const reboundCount = 44;
  const directionX = type === "POST"
    ? (collision.side === "LEFT" ? -1 : 1)
    : Math.sign(point.x - stage.ballX || 1);
  const end = type === "WALL"
    ? { x: point.x - directionX * 1.15, y: 0.08, z: point.z + 3.0 }
    : type === "BAR"
      ? { x: point.x + directionX * 1.0, y: 0.08, z: 2.65 }
      : type === "POST"
        ? { x: point.x + directionX * 2.05, y: 0.08, z: 2.05 }
        : { x: point.x + directionX * 1.85, y: 0.08, z: 2.45 };

  const rebound = Array.from({ length: reboundCount }, (_, index) => {
    const t = (index + 1) / reboundCount;
    return {
      x: lerp(point.x, end.x, t),
      y: Math.max(0.08, lerp(point.y, end.y, t) + 0.28 * Math.sin(Math.PI * t)),
      z: lerp(point.z, end.z, t),
      t: 1
    };
  });
  return [...before, ...rebound];
}

function pathWithKeeperContact(path, plan) {
  const impactIndex = Math.floor(path.length * 0.94);
  const pre = path.slice(0, impactIndex);
  const start = pre[pre.length - 1];
  const contactSegment = Array.from({ length: 14 }, (_, index) => {
    const t = (index + 1) / 14;
    return {
      x: lerp(start.x, plan.contact.x, t),
      y: lerp(start.y, plan.contact.y, t),
      z: lerp(start.z, plan.contact.z, t),
      t: 1
    };
  });
  const impactPoint = contactSegment[contactSegment.length - 1];
  const collision = { index: pre.length + contactSegment.length - 1, point: impactPoint };
  if (plan.saveType === "CATCH") return { path: [...pre, ...contactSegment], impactIndex: collision.index };
  return { path: appendRebound([...pre, ...contactSegment], collision, "SAVE"), impactIndex: collision.index };
}

export function sampleShotPath(path, progress) {
  if (!path.length) return null;
  const scaled = clamp(progress, 0, 1) * (path.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(path.length - 1, lower + 1);
  const t = scaled - lower;
  return {
    x: lerp(path[lower].x, path[upper].x, t),
    y: lerp(path[lower].y, path[upper].y, t),
    z: lerp(path[lower].z, path[upper].z, t)
  };
}

export function resolveShotPhysics() {
  const stage = stageConfig();
  const shot = state.shot;
  const target = targetFromInputs();
  let path = buildDirectPath(target);
  const flightSeconds = ballWorld(stage).z / Math.max(18, shot.speedMps);
  const wall = findWallCollision(path);
  const frame = wall ? null : findFrameCollision(target);
  const withinGoal = target.x > -GOAL.halfWidth + 0.11
    && target.x < GOAL.halfWidth - 0.11
    && target.y > 0.08
    && target.y < GOAL.height - 0.08;

  if (wall) {
    shot.outcome = "WALL";
    shot.collision = wall;
    shot.impactIndex = wall.index;
    path = appendRebound(path, wall, "WALL");
  } else if (frame) {
    const collision = { ...frame, index: path.length - 1 };
    shot.outcome = frame.type;
    shot.collision = collision;
    shot.impactIndex = collision.index;
    path = appendRebound(path, collision, frame.type);
  } else if (withinGoal) {
    const keeperPlan = calculateKeeperPlan(target, flightSeconds);
    shot.keeperPlan = keeperPlan;
    shot.saveType = keeperPlan.saveType;
    if (keeperPlan.saved) {
      const contact = pathWithKeeperContact(path, keeperPlan);
      path = contact.path;
      shot.outcome = "SAVE";
      shot.impactIndex = contact.impactIndex;
    } else {
      shot.outcome = "GOAL";
    }
  } else {
    shot.outcome = "MISS";
  }

  shot.topCorner = shot.outcome === "GOAL"
    && target.y > GOAL.height * 0.71
    && Math.abs(target.x) > GOAL.halfWidth * 0.55;
  shot.path = path;

  const baseDuration = clamp(flightSeconds * 1000, 620, 1220);
  const extra = ["WALL", "POST", "BAR", "SAVE"].includes(shot.outcome) ? 260 : 100;
  return { flightDuration: baseDuration + extra, target };
}
