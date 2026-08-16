import {
  clamp, lerp, smoothStep, state, stageConfig, idealPower, strikeQuality, strikeQualityLabel
} from "./core-v6.js?v=32.4";
import { GOAL, ballWorld, buildWall, keeperWorld } from "./world-v7.js?v=32.4";
import { difficultyForStage } from "./difficulty-v9.js?v=32.4";
import { activeCharacter, characterPhysics } from "./characters-v13.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";
import { wallForStage, buildWallLayout } from "./walls-v15.js?v=32.4";

const BALL_RADIUS = 0.11;
const SAMPLE_COUNT = 220;

function signedCurve(value) {
  return Math.sign(value) * Math.pow(Math.abs(value), 1.32);
}

function effectiveKeeperSkill(stage, profile) {
  const keeper = keeperForStage(state.stage);
  const scenarioSkill = stage.keeper * 0.66;
  return clamp(0.34 + scenarioSkill + profile.keeperBoost + keeper.modifiers.skillBoost, 0.4, 0.95);
}

function buildDirectPath(target, profile) {
  const stage = stageConfig();
  const modifiers = characterPhysics();
  const start = ballWorld(stage);
  const power = state.shot.power ?? idealPower();
  const quality = state.shot.strikeQuality ?? strikeQuality(power);
  const curve = signedCurve(clamp((state.shot.curve ?? 0) * modifiers.curveStrength, -1.15, 1.15));
  const distance = start.z;
  const requestedHeight = Math.max(0, target.y - 1.05);
  const powerFlattening = (0.69 - power) * 0.58;
  const poorContactLift = (1 - quality) * 0.12;
  const arcHeight = clamp(
    0.82 + distance * 0.0175 + powerFlattening + requestedHeight * 0.10 + poorContactLift,
    0.9,
    1.62
  );
  const curveBulge = curve * (0.45 + distance * 0.0195);
  const windBulge = state.stageWind * (0.42 + distance * 0.0135);

  return Array.from({ length: SAMPLE_COUNT + 1 }, (_, index) => {
    const t = index / SAMPLE_COUNT;
    const lineX = lerp(start.x, target.x, t);
    const lineY = lerp(start.y, target.y, t);
    const curveEnvelope = Math.sin(Math.PI * t) * Math.pow(t, 1.18);
    const windEnvelope = Math.sin(Math.PI * t) * Math.pow(t, 1.42);
    const lift = arcHeight * 4 * t * (1 - t);
    return {
      x: lineX + curveBulge * curveEnvelope + windBulge * windEnvelope,
      y: Math.max(0.03, lineY + lift),
      z: lerp(start.z, GOAL.lineZ, t),
      t
    };
  });
}

function targetFromInputs(profile) {
  const stage = stageConfig();
  const shot = state.shot;
  const modifiers = characterPhysics();
  const power = clamp(shot.power ?? idealPower(), 0, 1);
  const ideal = idealPower();
  const quality = strikeQuality(power);
  const rawCurve = clamp((shot.curve ?? 0) * modifiers.curveStrength, -1.15, 1.15);
  const curve = signedCurve(rawCurve);
  const powerDelta = power - ideal;
  const controlPenalty = 1 - quality;
  const excessiveCurve = Math.max(0, Math.abs(rawCurve) - (0.58 + modifiers.excessiveCurveAllowance));
  const deterministicSide = ((state.stage + (shot.aimX > 0.5 ? 1 : 0)) % 2 === 0) ? 1 : -1;

  const selectedX = -GOAL.halfWidth + shot.aimX * GOAL.width;
  const selectedY = GOAL.height * (1 - shot.aimY);
  const finalCurve = curve * (0.19 + stage.distanceYards * 0.0052);
  const finalWind = state.stageWind * (0.21 + stage.distanceYards * 0.006);
  const underhitDrop = power < 0.33 ? smoothStep((0.33 - power) / 0.33) * 0.19 : 0;
  const overhitRise = power > 0.89 ? smoothStep((power - 0.89) / 0.11) * 0.125 : 0;

  const contactError = profile.contactError * modifiers.contactError;
  const powerDrift = powerDelta * 0.22 * contactError;
  const curveDrift = deterministicSide * excessiveCurve * (0.42 + controlPenalty * 0.45) * contactError;
  const qualityDrift = deterministicSide * controlPenalty * 0.17 * contactError;
  const horizontalDriftMetres = powerDrift + curveDrift + qualityDrift;
  const verticalContactDrift = excessiveCurve * controlPenalty * 0.13;
  const verticalDriftMetres = (underhitDrop - overhitRise) * GOAL.height + verticalContactDrift;

  shot.strikeQuality = quality;
  shot.speedMps = lerp(15.5, 36.5, smoothStep(power)) * lerp(0.86, 1, quality) * modifiers.shotSpeed;
  shot.actualX = shot.aimX
    + finalCurve / GOAL.width
    + finalWind / GOAL.width
    + horizontalDriftMetres / GOAL.width;
  shot.actualY = shot.aimY + underhitDrop - overhitRise + verticalContactDrift / GOAL.height;

  const target = {
    x: -GOAL.halfWidth + shot.actualX * GOAL.width,
    y: GOAL.height * (1 - shot.actualY),
    z: GOAL.lineZ
  };

  return {
    target,
    selected: { x: selectedX, y: selectedY },
    curveMetres: finalCurve,
    windMetres: finalWind,
    drift: { x: horizontalDriftMetres, y: verticalDriftMetres },
    excessiveCurve
  };
}

function analyseWall(path, profile, target) {
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

function calculateKeeperPlan(target, flightSeconds, profile) {
  const stage = stageConfig();
  const characterModifiers = characterPhysics();
  const keeper = keeperForStage(state.stage);
  const keeperModifiers = keeper.modifiers;
  const skill = effectiveKeeperSkill(stage, profile);
  const baseStart = keeperWorld(stage);
  const start = {
    x: lerp(baseStart.x, target.x, keeperModifiers.startTracking),
    y: baseStart.y,
    z: baseStart.z + keeperModifiers.forwardStart
  };
  const handStart = { x: start.x, y: 1.08, z: start.z };
  const dx = target.x - handStart.x;
  const dy = target.y - handStart.y;
  const curveReadDelay = Math.abs(state.shot.curve ?? 0) * 0.026 * keeperModifiers.curveReadMultiplier;
  const baseReaction = lerp(0.32, 0.115, skill) - profile.reactionBoost + curveReadDelay;
  const reaction = clamp(baseReaction * keeperModifiers.reactionMultiplier, 0.085, 0.42);
  const available = Math.min(0.6, Math.max(0, flightSeconds - reaction));
  const reachX = (0.98 + skill * 1.18 + available * lerp(1.6, 2.45, skill)) * profile.reachX * keeperModifiers.reachX;
  const reachY = (0.72 + skill * 0.88 + available * lerp(0.56, 0.86, skill)) * profile.reachY * keeperModifiers.reachY;

  const isTopCorner = Math.abs(target.x) > GOAL.halfWidth * 0.7 && target.y > GOAL.height * 0.67;
  const isBottomCorner = Math.abs(target.x) > GOAL.halfWidth * 0.76 && target.y < GOAL.height * 0.27;
  const cornerDifficulty = isTopCorner ? 1.2 : isBottomCorner ? 1.12 : 1;
  const reachScore = Math.sqrt((dx / reachX) ** 2 + (dy / reachY) ** 2) * cornerDifficulty;

  const power = state.shot.power ?? idealPower();
  const quality = state.shot.strikeQuality ?? strikeQuality(power);
  const paceAdjustment = lerp(0.14, -0.11, smoothStep(power));
  const poorContactBonus = (1 - quality) * 0.11;
  const targetWidth = Math.abs(target.x) / GOAL.halfWidth;
  const centralShot = targetWidth < 0.38;
  const lowShot = target.y < GOAL.height * 0.34;
  const highShot = target.y > GOAL.height * 0.68;
  const finesseShot = Math.abs(state.shot.curve ?? 0) > 0.42 && power < 0.82;
  const paceFactor = smoothStep(clamp((state.shot.speedMps - 27) / 10, 0, 1));
  const matchupAdjustment =
    (centralShot ? keeperModifiers.centralBonus : 0)
    + (finesseShot ? keeperModifiers.finesseBonus : 0)
    - (lowShot ? keeperModifiers.lowPenalty : 0)
    - (highShot ? keeperModifiers.highPenalty : 0)
    - paceFactor * keeperModifiers.pacePenalty;
  const threshold = clamp(
    0.84 + skill * 0.15 + paceAdjustment + poorContactBonus
      + characterModifiers.keeperThreshold + keeperModifiers.threshold + matchupAdjustment,
    0.72,
    1.12
  );
  const saved = reachScore <= threshold;
  const contactScale = saved ? 1 : Math.min(1, threshold / Math.max(reachScore, 0.001));
  const contact = {
    x: handStart.x + dx * contactScale,
    y: handStart.y + dy * contactScale,
    z: 0.28
  };
  const catchSpeedLimit = 27.5 - characterModifiers.catchResistance * 4.2 + keeperModifiers.catchBias * 12;
  const catchReachLimit = clamp(0.53 + keeperModifiers.catchBias * 0.3, 0.45, 0.62);
  const saveType = !saved
    ? null
    : reachScore < catchReachLimit && state.shot.speedMps < catchSpeedLimit && quality > 0.48 ? "CATCH" : "PARRY";

  return {
    keeperId: keeper.id,
    keeperName: keeper.name,
    keeperRole: keeper.role,
    keeperTrait: keeper.trait,
    keeperAccent: keeper.accent,
    keeperTier: keeper.tier,
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
    diveDirection: Math.sign(dx || 1),
    reachX,
    reachY
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

function outcomeReason(shot, wallAnalysis, keeperPlan, target) {
  if (shot.outcome === "WALL") return wallAnalysis.lane === "OVER" ? "Trajectory did not clear the jumping wall." : "Shot intersected the outside wall player.";
  if (shot.outcome === "SAVE") return keeperPlan.saveType === "CATCH" ? "Pace and placement allowed a clean catch." : "The goalkeeper reached the ball and parried it.";
  if (shot.outcome === "POST") return "Final target clipped the post.";
  if (shot.outcome === "BAR") return "Final target clipped the crossbar.";
  if (shot.outcome === "MISS") return target.y > GOAL.height ? "Shot finished above the crossbar." : target.y < 0 ? "Shot dropped below the goal plane." : "Shot finished outside the posts.";
  if (shot.topCorner) return "Clean corner placement exceeded the goalkeeper's reach.";
  return "Placement, pace and curve combined to beat the goalkeeper.";
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
  const profile = difficultyForStage(state.stage, stage);
  const shot = state.shot;
  const inputResult = targetFromInputs(profile);
  const target = inputResult.target;
  let path = buildDirectPath(target, profile);
  const flightSeconds = ballWorld(stage).z / Math.max(15, shot.speedMps);
  const wallAnalysis = analyseWall(path, profile, target);
  const wall = wallAnalysis.collision;
  const frame = wall ? null : findFrameCollision(target);
  const withinGoal = target.x > -GOAL.halfWidth + 0.11
    && target.x < GOAL.halfWidth - 0.11
    && target.y > 0.08
    && target.y < GOAL.height - 0.08;
  let keeperPlan = null;

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
    keeperPlan = calculateKeeperPlan(target, flightSeconds, profile);
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
  const activeKeeper = keeperForStage(state.stage);
  const activeWall = wallForStage(state.stage);
  state.keeperId = activeKeeper.id;
  state.wallId = activeWall.id;
  shot.diagnostics = {
    character: activeCharacter().name,
    characterTrait: activeCharacter().trait,
    goalkeeper: activeKeeper.name,
    goalkeeperRole: activeKeeper.role,
    goalkeeperTrait: activeKeeper.trait,
    goalkeeperTier: activeKeeper.tier,
    wallUnit: activeWall.name,
    wallRole: activeWall.role,
    wallTrait: activeWall.trait,
    wallTier: activeWall.tier,
    wallShiftMetres: Number((wallAnalysis.wall?.shift || 0).toFixed(2)),
    wallPlayerCount: wallAnalysis.wall?.players?.length || 0,
    stage: state.stage + 1,
    scenario: stage.id,
    challenge: profile.challenge,
    powerPercent: Math.round((shot.power ?? 0) * 100),
    powerQuality: strikeQualityLabel(shot.power ?? idealPower()),
    strikeQuality: Number((shot.strikeQuality ?? 0).toFixed(3)),
    speedMps: Number(shot.speedMps.toFixed(2)),
    selectedTarget: {
      x: Number(inputResult.selected.x.toFixed(2)),
      y: Number(inputResult.selected.y.toFixed(2))
    },
    finalTarget: {
      x: Number(target.x.toFixed(2)),
      y: Number(target.y.toFixed(2))
    },
    curvePercent: Math.round((shot.curve ?? 0) * 100),
    curveMetres: Number(inputResult.curveMetres.toFixed(2)),
    windMetres: Number(inputResult.windMetres.toFixed(2)),
    contactDriftMetres: {
      x: Number(inputResult.drift.x.toFixed(2)),
      y: Number(inputResult.drift.y.toFixed(2))
    },
    wallLane: wallAnalysis.lane,
    wallClearanceMetres: wallAnalysis.clearance == null ? null : Number(wallAnalysis.clearance.toFixed(2)),
    keeperReactionSeconds: keeperPlan ? Number(keeperPlan.reaction.toFixed(3)) : null,
    keeperReachScore: keeperPlan ? Number(keeperPlan.reachScore.toFixed(3)) : null,
    keeperThreshold: keeperPlan ? Number(keeperPlan.threshold.toFixed(3)) : null,
    keeperSkill: keeperPlan ? Number(keeperPlan.skill.toFixed(3)) : null,
    outcome: shot.outcome,
    reason: ""
  };
  shot.diagnostics.reason = outcomeReason(shot, wallAnalysis, keeperPlan, target);

  const baseDuration = clamp(flightSeconds * 1000, 650, 1380);
  const extra = ["WALL", "POST", "BAR", "SAVE"].includes(shot.outcome) ? 280 : 100;
  return { flightDuration: baseDuration + extra, target, diagnostics: shot.diagnostics };
}
