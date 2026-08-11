import { clamp, state } from "./core-v6.js?v=32.2";
import { GOALKEEPERS, keeperById, keeperForStage as stageKeeperForStage } from "./keepers-v14.js?v=32.2";
import { WALLS, wallById, wallForStage as stageWallForStage, buildWallLayout as stageBuildWallLayout } from "./walls-v15.js?v=32.2";
import { buildWall as buildBaseWall } from "./world-v7.js?v=32.2";

export { GOALKEEPERS, WALLS };

function labConfig() {
  return state.matchupLab?.active ? state.matchupLab : null;
}

function forcedTier() {
  return clamp(Math.round(Number(labConfig()?.tier) || 1), 1, 4);
}

function scaleKeeper(base, tier, stageIndex) {
  if (tier <= 1) return { ...base, tier: 1, stageIndex };
  const cycle = tier - 1;
  const modifiers = base.modifiers;
  return {
    ...base,
    tier,
    stageIndex,
    modifiers: {
      ...modifiers,
      reactionMultiplier: clamp(modifiers.reactionMultiplier * (1 - cycle * 0.018), 0.68, 1.18),
      reachX: clamp(modifiers.reachX + cycle * 0.018, 0.9, 1.22),
      reachY: clamp(modifiers.reachY + cycle * 0.015, 0.92, 1.26),
      threshold: clamp(modifiers.threshold + cycle * 0.012, -0.05, 0.095),
      skillBoost: clamp(modifiers.skillBoost + cycle * 0.012, 0, 0.085)
    }
  };
}

function scaleWall(base, tier, stageIndex) {
  if (tier <= 1) return { ...base, tier: 1, stageIndex };
  const cycle = tier - 1;
  const modifiers = base.modifiers;
  return {
    ...base,
    tier,
    stageIndex,
    modifiers: {
      ...modifiers,
      radius: clamp(modifiers.radius + cycle * 0.008, 0.95, 1.13),
      jumpMultiplier: clamp(modifiers.jumpMultiplier + cycle * 0.018, 0.95, 1.48),
      tracking: clamp(modifiers.tracking + cycle * 0.012, 0, 0.24),
      maxShift: clamp(modifiers.maxShift + cycle * 0.025, 0, 0.62)
    }
  };
}

export function keeperForStage(stageIndex = state.stage) {
  const config = labConfig();
  if (!config?.keeperId) return stageKeeperForStage(stageIndex);
  return scaleKeeper(keeperById(config.keeperId), forcedTier(), stageIndex);
}

export function wallForStage(stageIndex = state.stage) {
  const config = labConfig();
  if (!config?.wallId) return stageWallForStage(stageIndex);
  return scaleWall(wallById(config.wallId), forcedTier(), stageIndex);
}

export function buildWallLayout(scenario, stageIndex = state.stage, options = {}) {
  const config = labConfig();
  if (!config?.wallId) return stageBuildWallLayout(scenario, stageIndex, options);

  const base = buildBaseWall(scenario);
  const profile = wallForStage(stageIndex);
  const modifiers = profile.modifiers;
  const baseCount = Math.max(1, base.players.length);
  const count = Math.max(2, baseCount + modifiers.countDelta);
  const targetX = Number.isFinite(options.targetX) ? options.targetX : scenario.protectedGoalX;
  const curve = Number.isFinite(options.curve) ? options.curve : 0;
  const targetShift = clamp(
    (targetX - (scenario.protectedGoalX || 0)) * modifiers.tracking,
    -modifiers.maxShift,
    modifiers.maxShift
  );
  const curveShift = clamp(
    curve * modifiers.curveTracking,
    -modifiers.maxShift * 0.55,
    modifiers.maxShift * 0.55
  );
  const shift = clamp(targetShift + curveShift, -modifiers.maxShift, modifiers.maxShift);
  const centre = {
    x: base.centre.x + base.tangent.x * shift,
    y: 0,
    z: base.centre.z + base.tangent.z * shift
  };
  const startOffset = -((count - 1) * modifiers.spacing) / 2;
  const centreIndex = (count - 1) / 2;
  const players = Array.from({ length: count }, (_, index) => {
    const offset = startOffset + index * modifiers.spacing;
    const depthSign = index % 2 === 0 ? -1 : 1;
    const depthOffset = depthSign * modifiers.zStagger;
    const jumpPattern = modifiers.jumpPattern[index % modifiers.jumpPattern.length] || 1;
    const radiusPattern = modifiers.radiusPattern[index % modifiers.radiusPattern.length] || 1;
    return {
      index,
      x: centre.x + base.tangent.x * offset + base.direction.x * depthOffset,
      y: 0,
      z: centre.z + base.tangent.z * offset + base.direction.z * depthOffset,
      facing: Math.atan2(base.direction.x, -base.direction.z),
      timingOffset: (index - centreIndex) * modifiers.staggerTiming
        + (index % 2 === 0 ? -modifiers.alternateDelay : modifiers.alternateDelay),
      jumpMultiplier: jumpPattern,
      radiusMultiplier: radiusPattern
    };
  });

  return {
    ...base,
    centre,
    players,
    profile,
    shift,
    spacing: modifiers.spacing
  };
}
