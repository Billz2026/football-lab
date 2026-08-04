import { clamp, state } from "./core-v6.js?v=7";

const STANDARD_KEEPER = Object.freeze({
  id: "academy",
  name: "MILO KENT",
  nickname: "THE FOUNDATION",
  role: "BALANCED KEEPER",
  icon: "◇",
  accent: "#dafe4d",
  shorts: "#16231b",
  trait: "SOLID BASE",
  traitCopy: "Balanced positioning, reaction and reach for the opening stages.",
  weakness: "Extreme corners can beat him when pace and placement are clean.",
  solution: "Use the opening stages to learn controlled corner placement.",
  stats: Object.freeze({ reflexes: 70, reach: 70, reading: 68, aggression: 62 }),
  visualHeight: 1.9,
  modifiers: Object.freeze({
    reactionMultiplier: 1,
    reachX: 1,
    reachY: 1,
    threshold: -0.01,
    skillBoost: 0,
    curveReadMultiplier: 1,
    startTracking: 0,
    forwardStart: 0,
    lowPenalty: 0,
    highPenalty: 0,
    pacePenalty: 0,
    centralBonus: 0,
    finesseBonus: 0,
    catchBias: 0
  })
});

export const GOALKEEPERS = Object.freeze([
  Object.freeze({
    id: "reflex",
    name: "RAFA SOL",
    nickname: "QUICK HANDS",
    role: "REFLEX KEEPER",
    icon: "⚡",
    accent: "#67d9ff",
    shorts: "#10212a",
    trait: "SNAP REACTION",
    traitCopy: "Reacts early and dominates central and medium-height shots.",
    weakness: "Shorter reach leaves precise extreme corners available.",
    solution: "Commit to the outer top or bottom corner instead of shooting through him.",
    stats: Object.freeze({ reflexes: 96, reach: 72, reading: 74, aggression: 67 }),
    visualHeight: 1.86,
    modifiers: Object.freeze({
      reactionMultiplier: 0.74,
      reachX: 0.93,
      reachY: 0.95,
      threshold: 0.025,
      skillBoost: 0.018,
      curveReadMultiplier: 0.9,
      startTracking: 0.025,
      forwardStart: 0.02,
      lowPenalty: 0,
      highPenalty: 0,
      pacePenalty: 0,
      centralBonus: 0.07,
      finesseBonus: 0,
      catchBias: 0.025
    })
  }),
  Object.freeze({
    id: "giant",
    name: "BRUNO HALE",
    nickname: "THE TOWER",
    role: "GIANT KEEPER",
    icon: "▥",
    accent: "#ffb36b",
    shorts: "#2a1a10",
    trait: "LONG REACH",
    traitCopy: "Covers high corners and wide shots with exceptional wingspan.",
    weakness: "Slower reactions make fast low shots the correct answer.",
    solution: "Drive the ball low and hard before his frame can get down.",
    stats: Object.freeze({ reflexes: 67, reach: 97, reading: 72, aggression: 61 }),
    visualHeight: 2.04,
    modifiers: Object.freeze({
      reactionMultiplier: 1.16,
      reachX: 1.14,
      reachY: 1.2,
      threshold: 0.018,
      skillBoost: 0.012,
      curveReadMultiplier: 1,
      startTracking: 0.015,
      forwardStart: 0,
      lowPenalty: 0.13,
      highPenalty: -0.035,
      pacePenalty: 0,
      centralBonus: 0.015,
      finesseBonus: 0,
      catchBias: -0.015
    })
  }),
  Object.freeze({
    id: "reader",
    name: "ELI VOSS",
    nickname: "THE READER",
    role: "SHOT READER",
    icon: "◉",
    accent: "#d2a7ff",
    shorts: "#1e1429",
    trait: "READS THE SPIN",
    traitCopy: "Tracks finesse, curve and predictable placement before the strike lands.",
    weakness: "Raw pace and late movement can beat his anticipation.",
    solution: "Use power or disguise the curve instead of repeating the obvious lane.",
    stats: Object.freeze({ reflexes: 79, reach: 78, reading: 97, aggression: 69 }),
    visualHeight: 1.91,
    modifiers: Object.freeze({
      reactionMultiplier: 0.88,
      reachX: 1.01,
      reachY: 1,
      threshold: 0.02,
      skillBoost: 0.02,
      curveReadMultiplier: 0.42,
      startTracking: 0.13,
      forwardStart: 0.04,
      lowPenalty: 0,
      highPenalty: 0,
      pacePenalty: 0.115,
      centralBonus: 0.025,
      finesseBonus: 0.075,
      catchBias: 0.01
    })
  }),
  Object.freeze({
    id: "aggressive",
    name: "JAX MERCER",
    nickname: "THE CLOSER",
    role: "AGGRESSIVE KEEPER",
    icon: "▲",
    accent: "#ff718f",
    shorts: "#2a1018",
    trait: "CLOSES THE ANGLE",
    traitCopy: "Steps forward and attacks weak or central shots before they develop.",
    weakness: "High curl and late movement can exploit the space behind his advance.",
    solution: "Bend the ball high or away from his early movement.",
    stats: Object.freeze({ reflexes: 84, reach: 76, reading: 80, aggression: 98 }),
    visualHeight: 1.9,
    modifiers: Object.freeze({
      reactionMultiplier: 0.9,
      reachX: 1,
      reachY: 0.97,
      threshold: 0.015,
      skillBoost: 0.016,
      curveReadMultiplier: 0.84,
      startTracking: 0.07,
      forwardStart: 0.42,
      lowPenalty: 0,
      highPenalty: 0.085,
      pacePenalty: 0,
      centralBonus: 0.105,
      finesseBonus: -0.075,
      catchBias: 0.055
    })
  })
]);

const ROTATION = GOALKEEPERS;
const BY_ID = new Map([STANDARD_KEEPER, ...GOALKEEPERS].map((keeper) => [keeper.id, keeper]));

function scaledKeeper(base, stageIndex) {
  const cycle = stageIndex < 6 ? 0 : Math.floor((stageIndex - 6) / ROTATION.length) + 1;
  if (cycle <= 0) return { ...base, tier: 1, stageIndex };
  const modifiers = base.modifiers;
  return {
    ...base,
    tier: cycle + 1,
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

export function keeperForStage(stageIndex = state.stage) {
  const index = Math.max(0, Number(stageIndex) || 0);
  if (index < 2) return scaledKeeper(STANDARD_KEEPER, index);
  const keeper = ROTATION[(index - 2) % ROTATION.length];
  return scaledKeeper(keeper, index);
}

export function keeperById(id) {
  return BY_ID.get(id) || STANDARD_KEEPER;
}

export function activeKeeper() {
  return keeperForStage(state.stage);
}

export function keeperMatchupSummary(stageIndex = state.stage) {
  const keeper = keeperForStage(stageIndex);
  return `${keeper.role} · ${keeper.trait}`;
}
