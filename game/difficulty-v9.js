const BASE_PROFILES = Object.freeze({
  left20: {
    challenge: "INTRODUCTION",
    keeperBoost: 0.00,
    reactionBoost: 0.00,
    reachX: 0.98,
    reachY: 0.98,
    wallRadius: 0.33,
    wallJump: 0.31,
    contactError: 0.72,
    meter: { power: 0.92, aim: 0.90, curve: 0.92 }
  },
  central20: {
    challenge: "WALL COVERAGE",
    keeperBoost: 0.05,
    reactionBoost: 0.01,
    reachX: 1.03,
    reachY: 1.01,
    wallRadius: 0.35,
    wallJump: 0.34,
    contactError: 0.82,
    meter: { power: 0.98, aim: 1.00, curve: 0.98 }
  },
  right20: {
    challenge: "KEEPER POSITIONING",
    keeperBoost: 0.07,
    reactionBoost: 0.015,
    reachX: 1.05,
    reachY: 1.02,
    wallRadius: 0.35,
    wallJump: 0.34,
    contactError: 0.86,
    meter: { power: 1.00, aim: 1.03, curve: 1.02 }
  },
  central25: {
    challenge: "DISTANCE CONTROL",
    keeperBoost: 0.11,
    reactionBoost: 0.02,
    reachX: 1.07,
    reachY: 1.05,
    wallRadius: 0.36,
    wallJump: 0.35,
    contactError: 0.94,
    meter: { power: 1.05, aim: 1.08, curve: 1.06 }
  },
  wideLeft30: {
    challenge: "WIDE-ANGLE CURL",
    keeperBoost: 0.13,
    reactionBoost: 0.025,
    reachX: 1.08,
    reachY: 1.06,
    wallRadius: 0.35,
    wallJump: 0.35,
    contactError: 1.00,
    meter: { power: 1.08, aim: 1.12, curve: 1.13 }
  },
  wideRight30: {
    challenge: "OPPOSITE-SIDE CURL",
    keeperBoost: 0.14,
    reactionBoost: 0.025,
    reachX: 1.09,
    reachY: 1.06,
    wallRadius: 0.35,
    wallJump: 0.36,
    contactError: 1.02,
    meter: { power: 1.10, aim: 1.14, curve: 1.15 }
  },
  long35: {
    challenge: "POWER AND WIND",
    keeperBoost: 0.17,
    reactionBoost: 0.03,
    reachX: 1.11,
    reachY: 1.08,
    wallRadius: 0.37,
    wallJump: 0.37,
    contactError: 1.10,
    meter: { power: 1.14, aim: 1.18, curve: 1.18 }
  }
});

const FALLBACK = BASE_PROFILES.central25;

export function difficultyForStage(stageIndex, scenario) {
  const base = BASE_PROFILES[scenario.id] || FALLBACK;
  const cycle = Math.floor(stageIndex / 7);
  const cyclePressure = Math.min(0.16, cycle * 0.035);
  const meterPressure = Math.min(0.18, cycle * 0.04);

  return {
    ...base,
    id: scenario.id,
    stageIndex,
    cycle,
    keeperBoost: base.keeperBoost + cyclePressure,
    contactError: base.contactError + cycle * 0.08,
    meter: {
      power: base.meter.power + meterPressure,
      aim: base.meter.aim + meterPressure,
      curve: base.meter.curve + meterPressure
    }
  };
}
