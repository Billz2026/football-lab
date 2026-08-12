import {
  clamp, lerp, smoothStep, state, stageConfig, idealPower, strikeQuality
} from "./core-v6.js?v=32.4";
import { GOAL, ballWorld, buildWall, keeperWorld } from "./world-v7.js?v=32.4";

const BALL_RADIUS = 0.11;
const SAMPLE_COUNT = 210;

function signedCurve(value) {
  return Math.sign(value) * Math.pow(Math.abs(value), 1.3);
}

function effectiveKeeperSkill(stage) {
  const stageGrowth = Math.min(0.1, state.stage * 0.012);
  return clamp(0.36 + stage.keeper * 0.72 + stageGrowth, 0.42, 0.9);
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
    0.9 + distance * 0.018 + powerFlattening + requestedHeight * 0.11,
    0.98,
    1.64
  );
  const curveBulge = curve * (0.47 + distance * 0.02);
  const windBulge = state.stageWind * (0.44 + distance * 0.014);

  return Array.from({ length: SAMPLE_COUNT + 1 }, (_, index) => {
    const t = index / SAMPLE_COUNT;
    const lineX = lerp(start.x, target.x, t);
    const lineY = lerp(start.y, target.y, t);
    const curveEnvelope = Math.sin(Math.PI * t) * Math.pow(t, 1.15);
    const windEnvelope = Math.sin(Math.PI * t) * Math.pow(t, 1.38);
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
  const ideal = idealPower();
  const quality = strikeQuality(power);
  const curve = signedCurve(shot.curve ?? 0);
  const powerDelta = power - ideal;
  const controlPenalty = 1 - quality;
  const finalCurve = curve * (0.2 + stage.distanceYards * 0.0053);
  const finalWind = state.stageWind * (0.22 + stage.distanceYards * 0.0062);
  const underhitDrop = power < 0.31 ? smoothStep((0.31 - power) / 0.31) * 0.17 : 0;
  const overhitRise = power > 0.91 ? smoothStep((power - 0.91) / 0.09) * 0.105 : 0;
  const contactDrift = powerDelta * 0.032 + curve * controlPenalty * 0.018;

  shot.strikeQuality = quality;
  shot.speedMps = lerp(17.5, 35.5, smoothStep(power));
  shot.actualX = shot.aimX + finalCurve / GOAL.width + finalWind / GOAL.width + contactDrift;
  shot.actualY = shot.aimY + underhitDrop - overhitRise + Math.abs(curve) * controlPenalty * 0.008;

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
    const jumpWindow = Math.max(0, 1 - Math.abs(flightProgress - 0.5) / 0.16);
    const jumpHeight = Math.sin(jumpWindow * Math.PI / 2) * 0.34;
    for (const player of wall.players) {
      const groundDistance = Math.hypot(point.x - player.x, point.z - player.z);
      const playerHeight = 1.84 + jumpHeight;
      if (
        groundDistance <= 0.34 + BALL_RADIUS
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
  const skill = effectiveKeeperSkill(stage);
  const start = keeperWorld(stage);
  const handStart = { x: start.x, y: 1.08, z: start.z };
  const dx = target.x - handStart.x;
  const dy = target.y - handStart.y;
  const curveReadDelay = Math.abs(state.shot.curve ?? 0) * 0.02;
  const reaction = lerp(0.3, 0.12, skill) + curveReadDelay;
  const available = Math.min(0.55, Math.max(0, flightSeconds - reaction));
  const reachX = 0.95 + skill * 1.15 + available * lerp(1.55, 2.35, skill);
  const reachY = 0.72 + skill * 0.85 + available * lerp(0.55, 0.82, skill);
  const isTopCorner = Math.abs(target.x) > GOAL.halfWidth * 0.72 && target.y > GOAL.height * 0.67;
  const isBottomCorner = Math.abs(target.x) > GOAL.halfWidth * 0.78 && target.y < GOAL.height * 0.27;
  const cornerDifficulty = isTopCorner ? 1.18 : isBottomCorner ? 1.1 : 1;
  const reachScore = Math.sqrt((dx / reachX) ** 2 + (dy / reachY) ** 2) * cornerDifficulty;
  const power = state.shot.power ?? idealPower();
  const quality = state.shot.strikeQuality ?? strikeQuality(power);
  const pacePenalty = lerp(0.12, -0.1, smoothStep(power));
  const poorContactBonus = (1 - quality) * 0.09;
  const threshold = clamp(0.82 + skill * 0.16 + pacePenalty + poorContactBonus, 0.76, 1.06);
  const saved = reachScore <= threshold;
  const contactScale = saved ? 1 : Math.min(1, threshold / Math.max(reachScore, 0.001));
  const contact = {
    x: handStart.x + dx * contactScale,
    y: handStart.y + dy * contactScale,
    z: 0.28
  };
  const saveType = !saved
    ? null
    : reachScore < 0.55 && power < 0.77 ? "CATCH" : "PARRY";

  return {
    saved,
    saveType,
    start,
    contact,
    reaction,
    flightSeconds,
    reachScore,
    threshold,
    skill,
    target,
    diveDirection: Math.sign(dx || 1)
  };
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
        : { x: point.x + directionX * 1.9, y: 0.08, z: 2.5 };

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
  const impactIndex = Math.floor(path.length * 0.93);
  const pre = path.slice(0, impactIndex);
  const start = pre[pre.length - 1];
  const contactSegment = Array.from({ length: 16 }, (_, index) => {
    const t = (index + 1) / 16;
    return {
      x: lerp(start.x, plan.contact.x, t),
      y: lerp(start.y, plan.contact.y, t),
      z: lerp(start.z, plan.contact.z, t),
      t: 1
    };
  });
  const impactPoint = contactSegment[contactSegment.length - 1];
  const collision = { index: pre.length + contactSegment.length - 1, point: impactPoint };
  if (plan.saveType === "CATCH") {
    return { path: [...pre, ...contactSegment], impactIndex: collision.index };
  }
  return {
    path: appendRebound([...pre, ...contactSegment], collision, "SAVE"),
    impactIndex: collision.index
  };
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
  const extra = ["WALL", "POST", "BAR", "SAVE"].includes(shot.outcome) ? 280 : 100;
  return { flightDuration: baseDuration + extra, target };
}
