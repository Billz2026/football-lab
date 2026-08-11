const BASE_PROFILES = Object.freeze({
  left20: {
    challenge: "INTRODUCTION",
    keeperBoost: 0.00, reactionBoost: 0.00, reachX: 0.98, reachY: 0.98,
    wallRadius: 0.33, wallJump: 0.31, contactError: 0.72,
    meter: { power: 0.92, aim: 0.90, curve: 0.92 }
  },
  central20: {
    challenge: "WALL COVERAGE",
    keeperBoost: 0.04, reactionBoost: 0.008, reachX: 1.01, reachY: 1.00,
    wallRadius: 0.34, wallJump: 0.32, contactError: 0.78,
    meter: { power: 0.96, aim: 0.97, curve: 0.96 }
  },
  right22: {
    challenge: "KEEPER POSITIONING",
    keeperBoost: 0.055, reactionBoost: 0.012, reachX: 1.03, reachY: 1.01,
    wallRadius: 0.345, wallJump: 0.33, contactError: 0.82,
    meter: { power: 0.98, aim: 1.00, curve: 1.00 }
  },
  central24: {
    challenge: "FIVE-MAN COVERAGE",
    keeperBoost: 0.075, reactionBoost: 0.015, reachX: 1.04, reachY: 1.03,
    wallRadius: 0.35, wallJump: 0.34, contactError: 0.87,
    meter: { power: 1.01, aim: 1.03, curve: 1.03 }
  },
  left26: {
    challenge: "LEFT-CHANNEL CURL",
    keeperBoost: 0.09, reactionBoost: 0.018, reachX: 1.05, reachY: 1.04,
    wallRadius: 0.35, wallJump: 0.345, contactError: 0.91,
    meter: { power: 1.03, aim: 1.05, curve: 1.06 }
  },
  right27: {
    challenge: "REVERSE-SIDE CURL",
    keeperBoost: 0.10, reactionBoost: 0.02, reachX: 1.055, reachY: 1.045,
    wallRadius: 0.355, wallJump: 0.35, contactError: 0.94,
    meter: { power: 1.05, aim: 1.07, curve: 1.08 }
  },
  central30wind: {
    challenge: "CROSSWIND CONTROL",
    keeperBoost: 0.115, reactionBoost: 0.022, reachX: 1.065, reachY: 1.05,
    wallRadius: 0.355, wallJump: 0.355, contactError: 0.97,
    meter: { power: 1.07, aim: 1.09, curve: 1.10 }
  },
  wideLeft31: {
    challenge: "WIDE-ANGLE BEND",
    keeperBoost: 0.125, reactionBoost: 0.024, reachX: 1.075, reachY: 1.055,
    wallRadius: 0.35, wallJump: 0.36, contactError: 1.00,
    meter: { power: 1.08, aim: 1.11, curve: 1.12 }
  },
  wideRight32: {
    challenge: "WIND-ASSISTED ANGLE",
    keeperBoost: 0.135, reactionBoost: 0.025, reachX: 1.08, reachY: 1.06,
    wallRadius: 0.355, wallJump: 0.36, contactError: 1.02,
    meter: { power: 1.10, aim: 1.13, curve: 1.14 }
  },
  central34six: {
    challenge: "SIX-MAN WALL",
    keeperBoost: 0.145, reactionBoost: 0.026, reachX: 1.085, reachY: 1.065,
    wallRadius: 0.36, wallJump: 0.365, contactError: 1.04,
    meter: { power: 1.11, aim: 1.14, curve: 1.15 }
  },
  left36long: {
    challenge: "LONG-RANGE POWER",
    keeperBoost: 0.155, reactionBoost: 0.028, reachX: 1.09, reachY: 1.07,
    wallRadius: 0.36, wallJump: 0.37, contactError: 1.06,
    meter: { power: 1.12, aim: 1.15, curve: 1.16 }
  },
  right38long: {
    challenge: "LONG-RANGE PRECISION",
    keeperBoost: 0.165, reactionBoost: 0.029, reachX: 1.095, reachY: 1.075,
    wallRadius: 0.365, wallJump: 0.375, contactError: 1.08,
    meter: { power: 1.13, aim: 1.16, curve: 1.17 }
  },
  central40gale: {
    challenge: "HEAVY-WIND MASTERY",
    keeperBoost: 0.175, reactionBoost: 0.03, reachX: 1.10, reachY: 1.08,
    wallRadius: 0.365, wallJump: 0.38, contactError: 1.10,
    meter: { power: 1.14, aim: 1.17, curve: 1.18 }
  },
  wideLeft42: {
    challenge: "EXTREME ANGLE AND RANGE",
    keeperBoost: 0.185, reactionBoost: 0.031, reachX: 1.105, reachY: 1.085,
    wallRadius: 0.37, wallJump: 0.385, contactError: 1.12,
    meter: { power: 1.15, aim: 1.18, curve: 1.19 }
  },
  central45final: {
    challenge: "DISTANCE KING",
    keeperBoost: 0.195, reactionBoost: 0.032, reachX: 1.11, reachY: 1.09,
    wallRadius: 0.37, wallJump: 0.39, contactError: 1.14,
    meter: { power: 1.16, aim: 1.19, curve: 1.20 }
  }
});

const FALLBACK = BASE_PROFILES.central24;
const HANDCRAFTED_STAGE_COUNT = 30;

export function difficultyForStage(stageIndex, scenario) {
  const base = BASE_PROFILES[scenario.id] || FALLBACK;
  const cycle = Math.floor(stageIndex / HANDCRAFTED_STAGE_COUNT);
  const progress = Math.max(0, Math.min(1, Number(scenario.difficulty) || 0));
  const weatherPressure = Math.max(0, Math.min(0.6, Number(scenario.weatherSeverity) || 0));
  const wallPressure = Math.max(0, (Number(scenario.wallPlayers) || 4) - 3) * 0.012;
  const cyclePressure = Math.min(0.12, cycle * 0.02);
  const meterPressure = Math.min(0.14, cycle * 0.025);

  return {
    ...base,
    id: scenario.id,
    stageIndex,
    cycle,
    challenge: `${scenario.chapterName || "CLASSIC KICKS"} · ${scenario.weather || base.challenge}`,
    keeperBoost: 0.005 + progress * 0.19 + cyclePressure,
    reactionBoost: 0.002 + progress * 0.03,
    reachX: 0.98 + progress * 0.12,
    reachY: 0.98 + progress * 0.105,
    wallRadius: 0.325 + wallPressure + progress * 0.03,
    wallJump: 0.295 + progress * 0.095,
    contactError: 0.70 + progress * 0.42 + weatherPressure * 0.07 + cycle * 0.05,
    meter: {
      power: 0.9 + progress * 0.25 + weatherPressure * 0.025 + meterPressure,
      aim: 0.89 + progress * 0.28 + weatherPressure * 0.03 + meterPressure,
      curve: 0.91 + progress * 0.27 + weatherPressure * 0.035 + meterPressure
    }
  };
}
