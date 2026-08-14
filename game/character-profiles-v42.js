const freeze = (value) => Object.freeze(value);

const BODY_PRESETS = freeze({
  balanced: freeze({ height: 1.02, shoulder: 1.02, chest: 1.0, waist: 0.98, thigh: 1.0, calf: 1.0, head: 1.0 }),
  lean: freeze({ height: 1.0, shoulder: 0.96, chest: 0.94, waist: 0.92, thigh: 0.92, calf: 0.94, head: 0.98 }),
  elegant: freeze({ height: 1.015, shoulder: 0.98, chest: 0.96, waist: 0.94, thigh: 0.96, calf: 0.96, head: 0.98 }),
  compactPower: freeze({ height: 0.965, shoulder: 1.08, chest: 1.1, waist: 1.05, thigh: 1.12, calf: 1.08, head: 1.03 }),
  keeperPower: freeze({ height: 1.09, shoulder: 1.12, chest: 1.1, waist: 1.0, thigh: 1.05, calf: 1.05, head: 1.0 }),
  keeperGrace: freeze({ height: 1.07, shoulder: 1.0, chest: 0.98, waist: 0.95, thigh: 0.98, calf: 0.98, head: 0.99 }),
  keeperLean: freeze({ height: 1.06, shoulder: 0.98, chest: 0.95, waist: 0.92, thigh: 0.94, calf: 0.96, head: 0.98 }),
  keeperClassic: freeze({ height: 1.045, shoulder: 1.06, chest: 1.05, waist: 1.0, thigh: 1.03, calf: 1.02, head: 1.01 })
});

export const OUTFIELD_VISUALS_V42 = freeze({
  "dax-ryder": freeze({
    id: "viktor-kane",
    displayName: "VIKTOR KANE",
    number: 10,
    inspiration: "elite English centre-forward presence without direct likeness",
    body: BODY_PRESETS.balanced,
    skin: freeze({ base: "#e7b08e", light: "#f4c5a5", shadow: "#bd795c" }),
    hair: freeze({ style: "textured-crop", base: "#d9bb77", light: "#f0d59a", shadow: "#8f7346", volume: 1.02 }),
    face: freeze({ shape: "strong-jaw", brow: 0.95, nose: 1.02, jaw: 1.06, stubble: 0.14 }),
    kit: freeze({ shirt: "#dafe4d", shirtShadow: "#718d1d", shorts: "#102016", socks: "#f5f7ef", trim: "#0b130d" }),
    boots: freeze({ base: "#f6f7f3", secondary: "#cbd3cf", accent: "#dafe4d" }),
    motion: freeze({ stance: "composed", stride: 1.0, plant: 1.02, followThrough: 1.0, aggression: 0.42 })
  }),
  "leo-vale": freeze({
    id: "bruno-silva",
    displayName: "BRUNO SILVA",
    number: 8,
    inspiration: "intense Portuguese playmaker energy without direct likeness",
    body: BODY_PRESETS.lean,
    skin: freeze({ base: "#d69b74", light: "#eab08a", shadow: "#a9674c" }),
    hair: freeze({ style: "sharp-textured", base: "#34251f", light: "#5b4033", shadow: "#17110f", volume: 0.94 }),
    face: freeze({ shape: "angular", brow: 1.08, nose: 1.04, jaw: 0.96, stubble: 0.28 }),
    kit: freeze({ shirt: "#74dcff", shirtShadow: "#216f89", shorts: "#10212a", socks: "#e9f8ff", trim: "#09202a" }),
    boots: freeze({ base: "#15191a", secondary: "#424c50", accent: "#74dcff" }),
    motion: freeze({ stance: "alert", stride: 1.05, plant: 0.96, followThrough: 0.96, aggression: 0.58 })
  }),
  "zion-arc": freeze({
    id: "david-beckett",
    displayName: "DAVID BECKETT",
    number: 7,
    inspiration: "iconic English set-piece elegance without direct likeness",
    body: BODY_PRESETS.elegant,
    skin: freeze({ base: "#e1aa82", light: "#f0c09b", shadow: "#b77357" }),
    hair: freeze({ style: "refined-swept", base: "#9c7b54", light: "#c7a878", shadow: "#5b4532", volume: 1.0 }),
    face: freeze({ shape: "defined-cheek", brow: 0.96, nose: 1.0, jaw: 1.01, stubble: 0.22 }),
    kit: freeze({ shirt: "#ff9bd4", shirtShadow: "#9c4f7b", shorts: "#251524", socks: "#fff0f8", trim: "#27111f" }),
    boots: freeze({ base: "#f8f3ef", secondary: "#d0c5be", accent: "#ff9bd4" }),
    motion: freeze({ stance: "elegant", stride: 0.99, plant: 1.0, followThrough: 1.1, aggression: 0.34 })
  }),
  "kai-mori": freeze({
    id: "wayne-redman",
    displayName: "WAYNE REDMAN",
    number: 9,
    inspiration: "compact English power-forward intensity without direct likeness",
    body: BODY_PRESETS.compactPower,
    skin: freeze({ base: "#dfaa87", light: "#efbea0", shadow: "#b36f55" }),
    hair: freeze({ style: "short-practical", base: "#49372b", light: "#705542", shadow: "#241a15", volume: 0.86 }),
    face: freeze({ shape: "broad-brow", brow: 1.12, nose: 1.03, jaw: 1.08, stubble: 0.08 }),
    kit: freeze({ shirt: "#c7b7ff", shirtShadow: "#6657a4", shorts: "#1d1830", socks: "#f3f0ff", trim: "#171225" }),
    boots: freeze({ base: "#101314", secondary: "#44464b", accent: "#c7b7ff" }),
    motion: freeze({ stance: "grounded", stride: 0.94, plant: 1.12, followThrough: 1.03, aggression: 0.82 })
  })
});

export const GOALKEEPER_VISUALS_V42 = freeze({
  "mikkel-storm": freeze({
    id: "mikkel-storm",
    displayName: "MIKKEL STORM",
    number: 1,
    inspiration: "dominant Scandinavian goalkeeper presence without direct likeness",
    body: BODY_PRESETS.keeperPower,
    skin: freeze({ base: "#e0a984", light: "#efbea0", shadow: "#ae6e53" }),
    hair: freeze({ style: "short-commanding", base: "#9f8459", light: "#c7ad77", shadow: "#5d4b36", volume: 0.94 }),
    face: freeze({ shape: "rugged-square", brow: 1.1, jaw: 1.12, stubble: 0.2 }),
    kit: freeze({ shirt: "#1d7d48", shirtShadow: "#0d3f29", shorts: "#102b20", socks: "#173a2b", trim: "#dafe4d" }),
    gloves: freeze({ base: "#f2f4ef", palm: "#c7d0cb", accent: "#dafe4d", scale: 1.08 }),
    motion: freeze({ stanceWidth: 1.08, explosiveness: 1.08, reachStyle: "commanding", recovery: 0.96 })
  }),
  "rafael-dantas": freeze({
    id: "rafael-dantas",
    displayName: "RAFAEL DANTAS",
    number: 12,
    inspiration: "calm Brazilian shot-stopper elegance without direct likeness",
    body: BODY_PRESETS.keeperGrace,
    skin: freeze({ base: "#76513c", light: "#936b52", shadow: "#4c3228" }),
    hair: freeze({ style: "short-clean", base: "#1f1816", light: "#3a2c28", shadow: "#0e0b0a", volume: 0.88 }),
    face: freeze({ shape: "calm-long", brow: 0.96, jaw: 0.98, stubble: 0.04 }),
    kit: freeze({ shirt: "#222a60", shirtShadow: "#121633", shorts: "#15193e", socks: "#20265a", trim: "#78a9ff" }),
    gloves: freeze({ base: "#f7f7f4", palm: "#d6d8d5", accent: "#78a9ff", scale: 1.03 }),
    motion: freeze({ stanceWidth: 1.0, explosiveness: 0.98, reachStyle: "fluid", recovery: 1.04 })
  }),
  "diego-varela": freeze({
    id: "diego-varela",
    displayName: "DIEGO VARELA",
    number: 13,
    inspiration: "modern Spanish reflex goalkeeper energy without direct likeness",
    body: BODY_PRESETS.keeperLean,
    skin: freeze({ base: "#d39a74", light: "#e6b08a", shadow: "#a5664b" }),
    hair: freeze({ style: "dark-modern", base: "#2b211e", light: "#4e3931", shadow: "#130f0e", volume: 0.94 }),
    face: freeze({ shape: "slim-sharp", brow: 1.05, jaw: 0.94, stubble: 0.34 }),
    kit: freeze({ shirt: "#652f7e", shirtShadow: "#33163f", shorts: "#2a1234", socks: "#4b205e", trim: "#e3b4ff" }),
    gloves: freeze({ base: "#e9edf0", palm: "#bcc5ca", accent: "#e3b4ff", scale: 1.0 }),
    motion: freeze({ stanceWidth: 0.96, explosiveness: 1.12, reachStyle: "elastic", recovery: 1.08 })
  }),
  "simon-henshaw": freeze({
    id: "simon-henshaw",
    displayName: "SIMON HENSHAW",
    number: 22,
    inspiration: "classic English goalkeeper authority without direct likeness",
    body: BODY_PRESETS.keeperClassic,
    skin: freeze({ base: "#dea783", light: "#edbb9d", shadow: "#ae6f56" }),
    hair: freeze({ style: "classic-long", base: "#7a5c43", light: "#9f7c5d", shadow: "#493528", volume: 1.06 }),
    face: freeze({ shape: "mature-classic", brow: 1.01, jaw: 1.05, stubble: 0.12, moustache: 0.72 }),
    kit: freeze({ shirt: "#2a5e69", shirtShadow: "#143139", shorts: "#17343b", socks: "#214a53", trim: "#f0d7a2" }),
    gloves: freeze({ base: "#f3eee1", palm: "#d0c7b5", accent: "#f0d7a2", scale: 1.04 }),
    motion: freeze({ stanceWidth: 1.04, explosiveness: 0.96, reachStyle: "classic", recovery: 1.0 })
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
  build: "42.0.0",
  rendererTarget: "layered-2.5d-skeletal",
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
