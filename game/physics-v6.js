import {
  clamp, lerp, smoothStep, state, stageConfig, idealPower, strikeQuality
} from "./core-v6.js?v=6";
import { GOAL, ballWorld, buildWall, keeperWorld } from "./world-v6.js?v=6";

const BALL_RADIUS = 0.11;
const SAMPLE_COUNT = 180;

function signedCurve(value) {
  return Math.sign(value) * Math.pow(Math.abs(value), 1.28);
}

function buildDirectPath(target) {
  const stage = stageConfig();
  const start = ballWorld(stage);
  const power = state.shot.power ?? idealPower();
  const curve = signedCurve(state.shot.curve ?? 0);
  const distance = start.z;
  const arcHeight = 1.45 + distance * 0.027 + (power - idealPower()) * 0.75;
  const curveBulge = curve * (0.78 + distance * 0.026);
  const windBulge = state.stageWind * (0.62 + distance * 0.018);

  return Array.from({ length: SAMPLE_COUNT + 1 }, (_, index) => {
    const t = index / SAMPLE_COUNT;
    const lineX = lerp(start.x, target.x, t);
    const lineY = lerp(start.y, target.y, t);
    const bendEnvelope = Math.sin(Math.PI * t) * Math.pow(t, 0.72);
    return {
      x: lineX + curveBulge * bendEnvelope + windBulge * Math.sin(Math.PI * t) * t,
      y: Math.max(0.03, lineY + arcHeight * 4 * t * (1 - t)),
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
  const finalCurve = curve * (0.26 + stage.distanceYards * 0.006);
  const finalWind = state.stageWind * (0.30 + stage.distanceYards * 0.008);
  const underhitDrop = power < 0.18 ? smoothStep((0.18 - power) / 0.18) * 0.11 : 0;
  const overhitRise = power > 0.93 ? smoothStep((power - 0.93) / 0.07) * 0.09 : 0;

  shot.strikeQuality = quality;
  shot.speedMps = lerp(18, 34, smoothStep(power));
  shot.actualX = shot.aimX + finalCurve / GOAL.width + finalWind / GOAL.width;
  shot.actualY = shot.aimY + underhitDrop - overhitRise + Math.abs(curve) * 0.004;

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
    for (const player of wall.players) {
      const groundDistance = Math.hypot(point.x - player.x, point.z - player.z);
      const playerHeight = 1.84 + 0.34;
      if (groundDistance <= 0.34 + BALL_RADIUS && point.y <= playerHeight + BALL_RADIUS && point.y >= 0.03) {
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
  if (target.x >= -GOAL.halfWidth - radius && target.x <= GOAL.halfWidth + radius && Math.abs(target.y - GOAL.height) <= radius) {
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
  const reaction = lerp(0.33, 0.15, stage.keeper) + Math.abs(state.shot.curve ?? 0) * 0.025;
  const available = Math.max(0, flightSeconds - reaction);
  const reachX = 0.76 + stage.keeper * 1.02 + available * lerp(1.25, 2.0, stage.keeper);
  const reachY = 0.62 + stage.keeper * 0.72 + available * 0.48;
  const reachScore = Math.sqrt((dx / reachX) ** 2 + (dy / reachY) ** 2);
  const powerPenalty = lerp(0.06, -0.1, smoothStep(state.shot.power ?? idealPower()));
  const threshold = clamp(0.78 + stage.keeper * 0.18 + powerPenalty, 0.7, 1.02);
  const saved = reachScore <= threshold;
  const contactScale = saved ? 1 : Math.min(1, threshold / Math.max(reachScore, 0.001));
  const contact = {
    x: handStart.x + dx * contactScale,
    y: handStart.y + dy * contactScale,
    z: 0.28
  };
  const saveType = !saved ? null : reachScore < 0.5 && (state.shot.power ?? 0.7) < 0.78 ? "CATCH" : "PARRY";
  return { saved, saveType, start, contact, reaction, flightSeconds, reachScore };
}

function appendRebound(path, collision, type) {
  const before = path.slice(0, collision.index + 1);
  const point = collision.point;
  const stage = stageConfig();
  const reboundCount = 40;
  const directionX = type === "POST"
    ? (collision.side === "LEFT" ? -1 : 1)
    : Math.sign(point.x - stage.ballX || 1);
  const end = type === "WALL"
    ? { x: point.x - directionX * 1.2, y: 0.08, z: point.z + 3.1 }
    : type === "BAR"
      ? { x: point.x + directionX * 1.1, y: 0.08, z: 2.8 }
      : type === "POST"
        ? { x: point.x + directionX * 2.2, y: 0.08, z: 2.2 }
        : { x: point.x + directionX * 2.0, y: 0.08, z: 2.6 };

  const rebound = Array.from({ length: reboundCount }, (_, index) => {
    const t = (index + 1) / reboundCount;
    return {
      x: lerp(point.x, end.x, t),
      y: Math.max(0.08, lerp(point.y, end.y, t) + 0.35 * Math.sin(Math.PI * t)),
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
  const flightSeconds = ballWorld(stage).z / Math.max(16, shot.speedMps);
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

  const baseDuration = clamp(flightSeconds * 1000, 650, 1320);
  const extra = ["WALL", "POST", "BAR", "SAVE"].includes(shot.outcome) ? 260 : 120;
  return { flightDuration: baseDuration + extra, target };
}
