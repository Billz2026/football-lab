import { clamp, state } from "./core-v6.js?v=32.4";
import { buildWall as buildBaseWall } from "./world-v7.js?v=32.4";
import { scenarioForStage } from "./world-v6.js?v=32.4";

const STANDARD_WALL = Object.freeze({
  id: "academy-line",
  name: "ACADEMY LINE",
  nickname: "THE BASICS",
  role: "BALANCED WALL",
  icon: "▥",
  accent: "#7ca98b",
  secondary: "#355044",
  trait: "HOLDS THE LINE",
  traitCopy: "Balanced spacing and jump timing for the opening stages.",
  weakness: "Clean curl or precise height can expose the outer defender.",
  solution: "Use the opening stages to learn the wall plane and clearance height.",
  stats: Object.freeze({ coverage: 68, jump: 66, reading: 55, discipline: 65 }),
  playerHeight: 1.84,
  modifiers: Object.freeze({
    spacing: 0.54,
    countDelta: 0,
    radius: 1.03,
    jumpMultiplier: 1,
    jumpLead: 0,
    jumpWindow: 0.16,
    underGap: 0.08,
    tracking: 0.02,
    curveTracking: 0,
    maxShift: 0.08,
    staggerTiming: 0.007,
    alternateDelay: 0,
    zStagger: 0,
    jumpPattern: Object.freeze([1]),
    radiusPattern: Object.freeze([1])
  })
});

export const WALLS = Object.freeze([
  Object.freeze({
    id: "compact",
    name: "IRON BLOCK",
    nickname: "THE LOCK",
    role: "COMPACT WALL",
    icon: "▦",
    accent: "#63d49a",
    secondary: "#234c38",
    trait: "CLOSE RANKS",
    traitCopy: "Tight shoulder spacing removes the obvious central lane.",
    weakness: "The compressed line leaves more room outside the edge defender.",
    solution: "Bend around the outside rather than forcing the ball through the middle.",
    stats: Object.freeze({ coverage: 96, jump: 70, reading: 64, discipline: 94 }),
    playerHeight: 1.84,
    modifiers: Object.freeze({
      spacing: 0.46,
      countDelta: 0,
      radius: 1.09,
      jumpMultiplier: 0.98,
      jumpLead: 0.005,
      jumpWindow: 0.17,
      underGap: 0.1,
      tracking: 0.035,
      curveTracking: 0,
      maxShift: 0.16,
      staggerTiming: 0.004,
      alternateDelay: 0,
      zStagger: 0,
      jumpPattern: Object.freeze([1, 0.98, 1.02, 1]),
      radiusPattern: Object.freeze([1.03, 1.06, 1.06, 1.03])
    })
  }),
  Object.freeze({
    id: "leaping",
    name: "SKYLINE FOUR",
    nickname: "THE LEAPERS",
    role: "LEAPING WALL",
    icon: "⇈",
    accent: "#ffb457",
    secondary: "#60411d",
    trait: "HIGH RISE",
    traitCopy: "Explosive jumps punish floated shots and ordinary wall clearance.",
    weakness: "The airborne line can be attacked with a controlled low drive.",
    solution: "Keep the strike low and fast instead of trying to clear their jump.",
    stats: Object.freeze({ coverage: 76, jump: 98, reading: 65, discipline: 78 }),
    playerHeight: 1.85,
    modifiers: Object.freeze({
      spacing: 0.58,
      countDelta: 0,
      radius: 0.98,
      jumpMultiplier: 1.36,
      jumpLead: 0.035,
      jumpWindow: 0.15,
      underGap: 0.78,
      tracking: 0.02,
      curveTracking: 0,
      maxShift: 0.12,
      staggerTiming: 0.006,
      alternateDelay: 0.005,
      zStagger: 0,
      jumpPattern: Object.freeze([0.96, 1.04, 1.08, 1]),
      radiusPattern: Object.freeze([1, 0.98, 0.98, 1])
    })
  }),
  Object.freeze({
    id: "reading",
    name: "VECTOR UNIT",
    nickname: "THE READERS",
    role: "READING WALL",
    icon: "◫",
    accent: "#b995ff",
    secondary: "#463263",
    trait: "SHADES THE LANE",
    traitCopy: "Slides toward the selected target and anticipates conventional bend.",
    weakness: "Late or opposite curl can punish their early commitment.",
    solution: "Disguise the curve or bend away from the wall's initial movement.",
    stats: Object.freeze({ coverage: 84, jump: 80, reading: 98, discipline: 88 }),
    playerHeight: 1.84,
    modifiers: Object.freeze({
      spacing: 0.54,
      countDelta: 0,
      radius: 1.03,
      jumpMultiplier: 1.08,
      jumpLead: 0.015,
      jumpWindow: 0.16,
      underGap: 0.16,
      tracking: 0.18,
      curveTracking: 0.10,
      maxShift: 0.48,
      staggerTiming: 0.006,
      alternateDelay: 0.004,
      zStagger: 0.015,
      jumpPattern: Object.freeze([1, 1.04, 1.04, 1]),
      radiusPattern: Object.freeze([1, 1.03, 1.03, 1])
    })
  }),
  Object.freeze({
    id: "staggered",
    name: "BROKEN RHYTHM",
    nickname: "THE STAGGER",
    role: "STAGGERED WALL",
    icon: "▥",
    accent: "#ff718f",
    secondary: "#632535",
    trait: "MIXED TIMING",
    traitCopy: "An extra defender and uneven jump rhythm disrupt repeated solutions.",
    weakness: "The late-jumping edge creates a narrow timing window for accurate curl.",
    solution: "Read the delayed outer player and attack that edge at the correct moment.",
    stats: Object.freeze({ coverage: 92, jump: 87, reading: 79, discipline: 60 }),
    playerHeight: 1.84,
    modifiers: Object.freeze({
      spacing: 0.6,
      countDelta: 1,
      radius: 1.02,
      jumpMultiplier: 1.16,
      jumpLead: 0.02,
      jumpWindow: 0.18,
      underGap: 0.25,
      tracking: 0.07,
      curveTracking: 0.04,
      maxShift: 0.28,
      staggerTiming: 0.026,
      alternateDelay: 0.018,
      zStagger: 0.055,
      jumpPattern: Object.freeze([1.08, 0.84, 1.18, 0.9, 1.12, 0.88]),
      radiusPattern: Object.freeze([1.02, 0.98, 1.04, 0.98, 1.02, 0.98])
    })
  })
]);

const ROTATION = WALLS;
const BY_ID = new Map([STANDARD_WALL, ...WALLS].map((wall) => [wall.id, wall]));

function scaledWall(base, stageIndex, requestedTier = null) {
  const cycle = requestedTier == null
    ? (stageIndex < 6 ? 0 : Math.floor((stageIndex - 6) / ROTATION.length) + 1)
    : Math.max(0, Number(requestedTier) - 1);
  if (cycle <= 0) return { ...base, tier: 1, stageIndex };
  const modifiers = base.modifiers;
  return {
    ...base,
    tier: cycle + 1,
    stageIndex,
    modifiers: {
      ...modifiers,
      radius: clamp(modifiers.radius + cycle * 0.01, 0.95, 1.13),
      jumpMultiplier: clamp(modifiers.jumpMultiplier + cycle * 0.018, 0.95, 1.48),
      tracking: clamp(modifiers.tracking + cycle * 0.014, 0, 0.24),
      maxShift: clamp(modifiers.maxShift + cycle * 0.025, 0, 0.62)
    }
  };
}

export function wallForStage(stageIndex = state.stage) {
  const index = Math.max(0, Number(stageIndex) || 0);
  const scenario = scenarioForStage(index);
  const wall = BY_ID.get(scenario.wallId)
    || (index < 2 ? STANDARD_WALL : ROTATION[(index - 2) % ROTATION.length]);
  return scaledWall(wall, index, scenario.wallTier);
}

export function wallById(id) {
  return BY_ID.get(id) || STANDARD_WALL;
}

export function activeWall() {
  return wallForStage(state.stage);
}

export function buildWallLayout(scenario, stageIndex = state.stage, options = {}) {
  const base = buildBaseWall(scenario);
  const profile = wallForStage(stageIndex);
  const modifiers = profile.modifiers;
  if (Number(scenario.wallPlayers) <= 0) {
    return {
      ...base,
      players: [],
      profile,
      shift: 0,
      spacing: modifiers.spacing
    };
  }
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

export function wallMatchupSummary(stageIndex = state.stage) {
  const wall = wallForStage(stageIndex);
  return `${wall.role} · ${wall.trait}`;
}
