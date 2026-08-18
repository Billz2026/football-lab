const freeze = (value) => Object.freeze(value);

// V51 arcade proportions: deliberately designed for the fixed gameplay camera.
// Silhouette, kit separation and motion readability outrank anatomical realism.
// Heads, shoulders, lower-leg mass, boots and goalkeeper gloves are intentionally
// exaggerated just enough to remain readable without drifting into chibi styling.
const BODY_PRESETS = freeze({
  balanced: freeze({ height: 1.03, shoulder: 1.11, chest: 1.08, waist: 0.94, thigh: 1.08, calf: 1.10, head: 1.13 }),
  lean: freeze({ height: 1.0, shoulder: 1.04, chest: 1.0, waist: 0.91, thigh: 1.0, calf: 1.05, head: 1.12 }),
  elegant: freeze({ height: 1.015, shoulder: 1.06, chest: 1.02, waist: 0.92, thigh: 1.02, calf: 1.06, head: 1.12 }),
  compactPower: freeze({ height: 0.97, shoulder: 1.16, chest: 1.15, waist: 1.01, thigh: 1.16, calf: 1.14, head: 1.13 }),
  keeperPower: freeze({ height: 1.09, shoulder: 1.20, chest: 1.16, waist: 1.03, thigh: 1.10, calf: 1.11, head: 1.11 }),
  keeperGrace: freeze({ height: 1.07, shoulder: 1.10, chest: 1.05, waist: 0.96, thigh: 1.05, calf: 1.08, head: 1.10 }),
  keeperLean: freeze({ height: 1.06, shoulder: 1.08, chest: 1.03, waist: 0.94, thigh: 1.03, calf: 1.07, head: 1.10 }),
  keeperClassic: freeze({ height: 1.05, shoulder: 1.16, chest: 1.12, waist: 1.0, thigh: 1.09, calf: 1.10, head: 1.12 })
});

const OUTFIELD_KIT = freeze({
  shirt: "#f7f8f4",
  shirtLight: "#ffffff",
  shirtShadow: "#c7d2d7",
  shorts: "#102740",
  shortsLight: "#244d76",
  socks: "#f4f6f2",
  trim: "#51b8e8",
  collar: "#14385c"
});

export const OUTFIELD_VISUALS_V42 = freeze({
  "dax-ryder": freeze({
    id: "viktor-kane",
    displayName: "VIKTOR KANE",
    number: 10,
    inspiration: "tall composed arcade centre-forward",
    body: BODY_PRESETS.balanced,
    skin: freeze({ base: "#e3a783", light: "#f0bc9c", shadow: "#bd7559" }),
    hair: freeze({ style: "textured-crop", base: "#a9854f", light: "#c8a96a", shadow: "#644b2e", volume: 1.04 }),
    face: freeze({ shape: "strong-jaw", jaw: 1.06, stubble: 0.06 }),
    kit: OUTFIELD_KIT,
    boots: freeze({ base: "#0b1014", secondary: "#303a42", accent: "#d6ec4a" }),
    motion: freeze({ stance: "composed", stride: 1.04, plant: 1.08, followThrough: 1.13, aggression: 0.55 })
  }),
  "leo-vale": freeze({
    id: "bruno-silva",
    displayName: "BRUNO SILVA",
    number: 8,
    inspiration: "quick technical arcade playmaker",
    body: BODY_PRESETS.lean,
    skin: freeze({ base: "#d0956f", light: "#e4aa83", shadow: "#a4654a" }),
    hair: freeze({ style: "sharp-textured", base: "#30231e", light: "#594136", shadow: "#15100e", volume: 0.96 }),
    face: freeze({ shape: "angular", jaw: 0.98, stubble: 0.10 }),
    kit: OUTFIELD_KIT,
    boots: freeze({ base: "#0d1317", secondary: "#31434d", accent: "#55d9ff" }),
    motion: freeze({ stance: "alert", stride: 1.09, plant: 1.01, followThrough: 1.04, aggression: 0.66 })
  }),
  "zion-arc": freeze({
    id: "david-beckett",
    displayName: "DAVID BECKETT",
    number: 7,
    inspiration: "smooth set-piece arcade specialist",
    body: BODY_PRESETS.elegant,
    skin: freeze({ base: "#dca27c", light: "#edba96", shadow: "#b26f54" }),
    hair: freeze({ style: "refined-swept", base: "#876949", light: "#b39364", shadow: "#4f3b2a", volume: 1.02 }),
    face: freeze({ shape: "defined-cheek", jaw: 1.01, stubble: 0.08 }),
    kit: OUTFIELD_KIT,
    boots: freeze({ base: "#f4f0e8", secondary: "#cbc0b3", accent: "#d8a63f" }),
    motion: freeze({ stance: "elegant", stride: 1.02, plant: 1.03, followThrough: 1.17, aggression: 0.42 })
  }),
  "kai-mori": freeze({
    id: "wayne-redman",
    displayName: "WAYNE REDMAN",
    number: 9,
    inspiration: "compact power-forward arcade bruiser",
    body: BODY_PRESETS.compactPower,
    skin: freeze({ base: "#d9a07c", light: "#ebB795", shadow: "#ad694f" }),
    hair: freeze({ style: "short-practical", base: "#453228", light: "#695044", shadow: "#211814", volume: 0.89 }),
    face: freeze({ shape: "broad-brow", jaw: 1.09, stubble: 0.04 }),
    kit: OUTFIELD_KIT,
    boots: freeze({ base: "#0c1114", secondary: "#394148", accent: "#a47be8" }),
    motion: freeze({ stance: "grounded", stride: 0.97, plant: 1.18, followThrough: 1.12, aggression: 0.90 })
  })
});

export const GOALKEEPER_VISUALS_V42 = freeze({
  "mikkel-storm": freeze({
    id: "mikkel-storm",
    displayName: "MIKKEL STORM",
    number: 1,
    inspiration: "big commanding arcade goalkeeper",
    body: BODY_PRESETS.keeperPower,
    skin: freeze({ base: "#dca17c", light: "#edb896", shadow: "#a9684e" }),
    hair: freeze({ style: "short-commanding", base: "#856c49", light: "#ad925f", shadow: "#4e3e2b", volume: 0.96 }),
    face: freeze({ shape: "rugged-square", jaw: 1.11, stubble: 0.07 }),
    kit: freeze({ shirt: "#e04473", shirtShadow: "#902545", shorts: "#f3f4ef", socks: "#e04473", trim: "#ffffff" }),
    gloves: freeze({ base: "#ffffff", palm: "#cbd2cf", accent: "#f4df59", scale: 1.28 }),
    motion: freeze({ stanceWidth: 1.14, explosiveness: 1.13, reachStyle: "commanding", recovery: 0.98 })
  }),
  "rafael-dantas": freeze({
    id: "rafael-dantas",
    displayName: "RAFAEL DANTAS",
    number: 12,
    inspiration: "calm fluid arcade shot-stopper",
    body: BODY_PRESETS.keeperGrace,
    skin: freeze({ base: "#73503c", light: "#916a52", shadow: "#493026" }),
    hair: freeze({ style: "short-clean", base: "#1d1715", light: "#382b27", shadow: "#0c0a09", volume: 0.90 }),
    face: freeze({ shape: "calm-long", jaw: 0.99, stubble: 0.02 }),
    kit: freeze({ shirt: "#2e65bc", shirtShadow: "#173b77", shorts: "#f1f3ee", socks: "#2e65bc", trim: "#ffffff" }),
    gloves: freeze({ base: "#ffffff", palm: "#d2d7d4", accent: "#72c8ff", scale: 1.23 }),
    motion: freeze({ stanceWidth: 1.07, explosiveness: 1.04, reachStyle: "fluid", recovery: 1.06 })
  }),
  "diego-varela": freeze({
    id: "diego-varela",
    displayName: "DIEGO VARELA",
    number: 13,
    inspiration: "fast reflex arcade goalkeeper",
    body: BODY_PRESETS.keeperLean,
    skin: freeze({ base: "#cc936d", light: "#e0a982", shadow: "#9f6147" }),
    hair: freeze({ style: "dark-modern", base: "#29201d", light: "#4a3730", shadow: "#120e0d", volume: 0.94 }),
    face: freeze({ shape: "slim-sharp", jaw: 0.96, stubble: 0.10 }),
    kit: freeze({ shirt: "#7950b4", shirtShadow: "#48296b", shorts: "#f1f3ee", socks: "#7950b4", trim: "#ffffff" }),
    gloves: freeze({ base: "#ffffff", palm: "#c7cdd1", accent: "#e8c0ff", scale: 1.23 }),
    motion: freeze({ stanceWidth: 1.04, explosiveness: 1.17, reachStyle: "elastic", recovery: 1.10 })
  }),
  "simon-henshaw": freeze({
    id: "simon-henshaw",
    displayName: "SIMON HENSHAW",
    number: 22,
    inspiration: "classic high-contrast arcade goalkeeper",
    body: BODY_PRESETS.keeperClassic,
    skin: freeze({ base: "#d99f7b", light: "#eab693", shadow: "#aa6950" }),
    hair: freeze({ style: "classic-long", base: "#6b4f3a", light: "#927052", shadow: "#402e23", volume: 1.04 }),
    face: freeze({ shape: "mature-classic", jaw: 1.05, stubble: 0.04, moustache: 0.48 }),
    kit: freeze({ shirt: "#e14276", shirtShadow: "#8f234c", shorts: "#f4f3ee", socks: "#1b1f2a", trim: "#ffffff" }),
    gloves: freeze({ base: "#ffffff", palm: "#d0d4d1", accent: "#f3d84f", scale: 1.28 }),
    motion: freeze({ stanceWidth: 1.12, explosiveness: 1.02, reachStyle: "classic", recovery: 1.03 })
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
  build: "51.0.0-arcade-profile",
  rendererTarget: "polished-modern-arcade-articulated-2.5d",
  artDirection: "premium-modern-arcade-football",
  realismRequired: false,
  readabilityPriority: true,
  exaggeratedSilhouettes: true,
  largerHeadsForReadability: true,
  athleticShoulderLanguage: true,
  chunkierLowerLegReadability: true,
  oversizedKeeperGloves: true,
  highContrastKits: true,
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
