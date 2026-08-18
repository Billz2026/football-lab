const freeze = (value) => Object.freeze(value);

// V50 arcade proportions: readable silhouettes beat anatomical realism.
// Heads, shoulders, gloves and lower-leg mass are deliberately a little larger
// so players remain identifiable at the fixed gameplay camera distance.
const BODY_PRESETS = freeze({
  balanced: freeze({ height: 1.02, shoulder: 1.04, chest: 1.02, waist: 0.97, thigh: 1.03, calf: 1.04, head: 1.09 }),
  lean: freeze({ height: 1.0, shoulder: 0.98, chest: 0.96, waist: 0.92, thigh: 0.96, calf: 0.99, head: 1.08 }),
  elegant: freeze({ height: 1.015, shoulder: 1.0, chest: 0.98, waist: 0.94, thigh: 0.98, calf: 1.0, head: 1.08 }),
  compactPower: freeze({ height: 0.965, shoulder: 1.1, chest: 1.11, waist: 1.04, thigh: 1.12, calf: 1.11, head: 1.11 }),
  keeperPower: freeze({ height: 1.09, shoulder: 1.15, chest: 1.12, waist: 1.02, thigh: 1.08, calf: 1.09, head: 1.08 }),
  keeperGrace: freeze({ height: 1.07, shoulder: 1.04, chest: 1.0, waist: 0.96, thigh: 1.01, calf: 1.03, head: 1.07 }),
  keeperLean: freeze({ height: 1.06, shoulder: 1.02, chest: 0.98, waist: 0.93, thigh: 0.98, calf: 1.01, head: 1.07 }),
  keeperClassic: freeze({ height: 1.045, shoulder: 1.1, chest: 1.08, waist: 1.01, thigh: 1.06, calf: 1.06, head: 1.09 })
});

const OUTFIELD_KIT = freeze({
  shirt: "#f5f7f4",
  shirtLight: "#ffffff",
  shirtShadow: "#d2dad8",
  shorts: "#132b49",
  shortsLight: "#244b78",
  socks: "#f7f8f4",
  trim: "#2a92c9",
  collar: "#173b60"
});

export const OUTFIELD_VISUALS_V42 = freeze({
  "dax-ryder": freeze({
    id: "viktor-kane",
    displayName: "VIKTOR KANE",
    number: 10,
    inspiration: "tall composed arcade centre-forward",
    body: BODY_PRESETS.balanced,
    skin: freeze({ base: "#e6ad89", light: "#f1bea0", shadow: "#c57c5e" }),
    hair: freeze({ style: "textured-crop", base: "#b89558", light: "#d4b875", shadow: "#735a36", volume: 1.0 }),
    face: freeze({ shape: "strong-jaw", jaw: 1.04, stubble: 0.08 }),
    kit: OUTFIELD_KIT,
    boots: freeze({ base: "#11161a", secondary: "#303940", accent: "#e7f54b" }),
    motion: freeze({ stance: "composed", stride: 1.0, plant: 1.04, followThrough: 1.04, aggression: 0.48 })
  }),
  "leo-vale": freeze({
    id: "bruno-silva",
    displayName: "BRUNO SILVA",
    number: 8,
    inspiration: "quick technical arcade playmaker",
    body: BODY_PRESETS.lean,
    skin: freeze({ base: "#d49972", light: "#e6ae87", shadow: "#a9684d" }),
    hair: freeze({ style: "sharp-textured", base: "#34251f", light: "#5a4034", shadow: "#17110f", volume: 0.92 }),
    face: freeze({ shape: "angular", jaw: 0.97, stubble: 0.12 }),
    kit: OUTFIELD_KIT,
    boots: freeze({ base: "#101518", secondary: "#33434c", accent: "#4fd4ff" }),
    motion: freeze({ stance: "alert", stride: 1.06, plant: 0.98, followThrough: 0.98, aggression: 0.62 })
  }),
  "zion-arc": freeze({
    id: "david-beckett",
    displayName: "DAVID BECKETT",
    number: 7,
    inspiration: "smooth set-piece arcade specialist",
    body: BODY_PRESETS.elegant,
    skin: freeze({ base: "#dfa780", light: "#edbc98", shadow: "#b87458" }),
    hair: freeze({ style: "refined-swept", base: "#8f704e", light: "#b99b6d", shadow: "#55412f", volume: 0.98 }),
    face: freeze({ shape: "defined-cheek", jaw: 1.0, stubble: 0.1 }),
    kit: OUTFIELD_KIT,
    boots: freeze({ base: "#f5f1ea", secondary: "#cfc5b9", accent: "#d7a84c" }),
    motion: freeze({ stance: "elegant", stride: 0.99, plant: 1.0, followThrough: 1.12, aggression: 0.38 })
  }),
  "kai-mori": freeze({
    id: "wayne-redman",
    displayName: "WAYNE REDMAN",
    number: 9,
    inspiration: "compact power-forward arcade bruiser",
    body: BODY_PRESETS.compactPower,
    skin: freeze({ base: "#dda682", light: "#ecba99", shadow: "#b16e54" }),
    hair: freeze({ style: "short-practical", base: "#49372b", light: "#6b5140", shadow: "#241a15", volume: 0.84 }),
    face: freeze({ shape: "broad-brow", jaw: 1.07, stubble: 0.05 }),
    kit: OUTFIELD_KIT,
    boots: freeze({ base: "#101315", secondary: "#3a4147", accent: "#9b78e6" }),
    motion: freeze({ stance: "grounded", stride: 0.94, plant: 1.14, followThrough: 1.06, aggression: 0.86 })
  })
});

export const GOALKEEPER_VISUALS_V42 = freeze({
  "mikkel-storm": freeze({
    id: "mikkel-storm",
    displayName: "MIKKEL STORM",
    number: 1,
    inspiration: "big commanding arcade goalkeeper",
    body: BODY_PRESETS.keeperPower,
    skin: freeze({ base: "#dfa681", light: "#edba99", shadow: "#ae6d52" }),
    hair: freeze({ style: "short-commanding", base: "#8d744f", light: "#b59a6a", shadow: "#55442f", volume: 0.92 }),
    face: freeze({ shape: "rugged-square", jaw: 1.1, stubble: 0.08 }),
    kit: freeze({ shirt: "#d63f66", shirtShadow: "#8e2442", shorts: "#f1f2ed", socks: "#d63f66", trim: "#ffffff" }),
    gloves: freeze({ base: "#ffffff", palm: "#cfd4d0", accent: "#f3dc55", scale: 1.18 }),
    motion: freeze({ stanceWidth: 1.1, explosiveness: 1.1, reachStyle: "commanding", recovery: 0.96 })
  }),
  "rafael-dantas": freeze({
    id: "rafael-dantas",
    displayName: "RAFAEL DANTAS",
    number: 12,
    inspiration: "calm fluid arcade shot-stopper",
    body: BODY_PRESETS.keeperGrace,
    skin: freeze({ base: "#76513c", light: "#936b52", shadow: "#4c3228" }),
    hair: freeze({ style: "short-clean", base: "#1f1816", light: "#3a2c28", shadow: "#0e0b0a", volume: 0.86 }),
    face: freeze({ shape: "calm-long", jaw: 0.98, stubble: 0.02 }),
    kit: freeze({ shirt: "#2455a4", shirtShadow: "#15336a", shorts: "#f0f2ed", socks: "#2455a4", trim: "#ffffff" }),
    gloves: freeze({ base: "#ffffff", palm: "#d6d8d5", accent: "#68bcff", scale: 1.13 }),
    motion: freeze({ stanceWidth: 1.02, explosiveness: 1.0, reachStyle: "fluid", recovery: 1.04 })
  }),
  "diego-varela": freeze({
    id: "diego-varela",
    displayName: "DIEGO VARELA",
    number: 13,
    inspiration: "fast reflex arcade goalkeeper",
    body: BODY_PRESETS.keeperLean,
    skin: freeze({ base: "#d09871", light: "#e2ad87", shadow: "#a4654a" }),
    hair: freeze({ style: "dark-modern", base: "#2b211e", light: "#4e3931", shadow: "#130f0e", volume: 0.9 }),
    face: freeze({ shape: "slim-sharp", jaw: 0.95, stubble: 0.12 }),
    kit: freeze({ shirt: "#6e3fa1", shirtShadow: "#43245f", shorts: "#f0f2ed", socks: "#6e3fa1", trim: "#ffffff" }),
    gloves: freeze({ base: "#ffffff", palm: "#c8ced1", accent: "#e5b7ff", scale: 1.12 }),
    motion: freeze({ stanceWidth: 0.98, explosiveness: 1.14, reachStyle: "elastic", recovery: 1.08 })
  }),
  "simon-henshaw": freeze({
    id: "simon-henshaw",
    displayName: "SIMON HENSHAW",
    number: 22,
    inspiration: "classic high-contrast arcade goalkeeper",
    body: BODY_PRESETS.keeperClassic,
    skin: freeze({ base: "#dca480", light: "#eab895", shadow: "#ae6e54" }),
    hair: freeze({ style: "classic-long", base: "#72553f", light: "#987558", shadow: "#453226", volume: 1.02 }),
    face: freeze({ shape: "mature-classic", jaw: 1.04, stubble: 0.05, moustache: 0.55 }),
    kit: freeze({ shirt: "#c93b68", shirtShadow: "#7a203e", shorts: "#f4f4ef", socks: "#171b22", trim: "#ffffff" }),
    gloves: freeze({ base: "#ffffff", palm: "#d4d6d2", accent: "#f2d64d", scale: 1.16 }),
    motion: freeze({ stanceWidth: 1.06, explosiveness: 0.98, reachStyle: "classic", recovery: 1.0 })
  })
});

const KEEPER_AI_TO_VISUAL = freeze({
  academy: "simon-henshaw",
  reflex: "diego-varela",
  giant: "mikkel-storm",
  reader: "rafael-dantas",
  aggressive: "mikkel-storm"
});

export function outfieldVisualProfileV42(characterId) {
  return OUTFIELD_VISUALS_V42[characterId] || OUTFIELD_VISUALS_V42["dax-ryder"];
}

export function goalkeeperVisualProfileV42(keeperId) {
  const visualId = KEEPER_AI_TO_VISUAL[keeperId] || "simon-henshaw";
  return GOALKEEPER_VISUALS_V42[visualId];
}

export const CHARACTER_SYSTEM_V42 = freeze({
  build: "50.0.0-arcade-profile",
  rendererTarget: "modern-arcade-articulated-2.5d",
  artDirection: "modern-arcade-football",
  realismRequired: false,
  readabilityPriority: true,
  exaggeratedSilhouettes: true,
  sharedOutfieldKit: true,
  outfieldCount: 4,
  goalkeeperCount: 4,
  outfield: freeze(["viktor-kane", "bruno-silva", "david-beckett", "wayne-redman"]),
  goalkeepers: freeze(["mikkel-storm", "rafael-dantas", "diego-varela", "simon-henshaw"]),
  reusableAcrossModes: true,
  directCelebrityLikenesses: false
});

if (typeof window !== "undefined") {
  window.__footballLabCharacterSystemV42 = CHARACTER_SYSTEM_V42;
}
