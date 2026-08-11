import { clamp, state } from "./core-v6.js?v=7";

const CHARACTER_STORAGE_KEY = "footballLabSelectedKickerV13";

export const KICKERS = Object.freeze([
  Object.freeze({
    id: "dax-ryder",
    name: "VIKTOR KANE",
    nickname: "THE HAMMER",
    role: "POWER KICKER",
    number: 10,
    icon: "⚡",
    accent: "#dafe4d",
    stats: Object.freeze({ power: 94, accuracy: 68, curve: 61, composure: 66 }),
    trait: "THUNDER STRIKE",
    traitCopy: "Shots travel faster and powerful saves are more likely to be parried than caught.",
    weakness: "Faster meters and greater contact drift punish rushed placement.",
    modifiers: Object.freeze({
      shotSpeed: 1.12,
      contactError: 1.12,
      curveStrength: 0.94,
      excessiveCurveAllowance: 0,
      keeperThreshold: -0.025,
      catchResistance: 1,
      meter: Object.freeze({ power: 1.07, aim: 1.05, curve: 1.03 })
    })
  }),
  Object.freeze({
    id: "leo-vale",
    name: "BRUNO SILVA",
    nickname: "THE MAESTRO",
    role: "PRECISION SPECIALIST",
    number: 8,
    icon: "◎",
    accent: "#74dcff",
    stats: Object.freeze({ power: 68, accuracy: 95, curve: 77, composure: 82 }),
    trait: "DEAD-EYE",
    traitCopy: "Contact drift is heavily reduced and the placement sweep is easier to control.",
    weakness: "Lower pace gives goalkeepers more opportunity to hold central shots.",
    modifiers: Object.freeze({
      shotSpeed: 0.96,
      contactError: 0.66,
      curveStrength: 0.99,
      excessiveCurveAllowance: 0.03,
      keeperThreshold: 0.012,
      catchResistance: 0,
      meter: Object.freeze({ power: 0.96, aim: 0.82, curve: 0.94 })
    })
  }),
  Object.freeze({
    id: "zion-arc",
    name: "DAVE BECKETT",
    nickname: "THE WHIP",
    role: "CURVE MASTER",
    number: 11,
    icon: "↝",
    accent: "#ff9bd4",
    stats: Object.freeze({ power: 73, accuracy: 79, curve: 96, composure: 71 }),
    trait: "WHIPLASH",
    traitCopy: "Curve is stronger and remains controlled deeper into the meter's extreme zones.",
    weakness: "Slightly reduced pace makes straight long-range strikes less effective.",
    modifiers: Object.freeze({
      shotSpeed: 0.97,
      contactError: 0.9,
      curveStrength: 1.22,
      excessiveCurveAllowance: 0.12,
      keeperThreshold: 0,
      catchResistance: 0.15,
      meter: Object.freeze({ power: 1, aim: 0.98, curve: 0.82 })
    })
  }),
  Object.freeze({
    id: "kai-mori",
    name: "WAYNE REDMAN",
    nickname: "THE ICEMAN",
    role: "COMPOSURE PLAYER",
    number: 7,
    icon: "◆",
    accent: "#c7b7ff",
    stats: Object.freeze({ power: 77, accuracy: 83, curve: 76, composure: 96 }),
    trait: "ICE VEINS",
    traitCopy: "Meter escalation is reduced and late-stage pressure has less effect on execution.",
    weakness: "Balanced technique has no elite power or curl ceiling.",
    modifiers: Object.freeze({
      shotSpeed: 0.98,
      contactError: 0.82,
      curveStrength: 1,
      excessiveCurveAllowance: 0.05,
      keeperThreshold: 0.008,
      catchResistance: 0.05,
      meter: Object.freeze({ power: 0.88, aim: 0.88, curve: 0.88 })
    })
  })
]);

const KICKER_BY_ID = new Map(KICKERS.map((kicker) => [kicker.id, kicker]));

function storedCharacterId() {
  try {
    return localStorage.getItem(CHARACTER_STORAGE_KEY) || KICKERS[0].id;
  } catch {
    return KICKERS[0].id;
  }
}

let selectedId = KICKER_BY_ID.has(storedCharacterId()) ? storedCharacterId() : KICKERS[0].id;
state.characterId = selectedId;

export function activeCharacter() {
  return KICKER_BY_ID.get(state.characterId || selectedId) || KICKERS[0];
}

export function characterById(id) {
  return KICKER_BY_ID.get(id) || KICKERS[0];
}

export function selectCharacter(id) {
  const character = characterById(id);
  selectedId = character.id;
  state.characterId = character.id;
  try {
    localStorage.setItem(CHARACTER_STORAGE_KEY, character.id);
  } catch {
    // Storage can be unavailable in private browsing; the in-memory selection still works.
  }
  window.dispatchEvent(new CustomEvent("footballlab:characterchange", { detail: character }));
  return character;
}

export function meterMultiplier(type, stageIndex = state.stage) {
  const character = activeCharacter();
  let multiplier = character.modifiers.meter[type] ?? 1;
  if (character.id === "kai-mori" && stageIndex >= 3) {
    const lateStageRelief = clamp(1 - (stageIndex - 2) * 0.025, 0.82, 1);
    multiplier *= lateStageRelief;
  }
  return multiplier;
}

export function characterPhysics() {
  return activeCharacter().modifiers;
}
