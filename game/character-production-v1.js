const freeze = (value) => Object.freeze(value);

export const CHARACTER_PRODUCTION_BUILD_V1 = "1.0.2";
export const CHARACTER_ASSET_ROOT_V1 = "./assets/characters/v1";

const OUTFIELD_CLIPS = freeze([
  "idle",
  "approach",
  "plant",
  "windup",
  "contact",
  "follow-through",
  "recovery"
]);

const GOALKEEPER_CLIPS = freeze([
  "set",
  "shuffle-left",
  "shuffle-right",
  "dive-left-low",
  "dive-left-mid",
  "dive-left-high",
  "dive-right-low",
  "dive-right-mid",
  "dive-right-high",
  "parry",
  "catch",
  "landing",
  "recovery"
]);

export const CHARACTER_RIGS_V1 = freeze({
  outfield: freeze({
    id: "fl-humanoid-outfield-v1",
    benchmarkCharacter: "viktor-kane",
    skeleton: "FL_HUMANOID_V1",
    requiredClips: OUTFIELD_CLIPS,
    rootBone: "Root",
    hipsBone: "Hips",
    headBone: "Head",
    leftFootBone: "LeftFoot",
    rightFootBone: "RightFoot"
  }),
  goalkeeper: freeze({
    id: "fl-humanoid-goalkeeper-v1",
    benchmarkCharacter: "mikkel-storm",
    skeleton: "FL_HUMANOID_V1",
    requiredClips: GOALKEEPER_CLIPS,
    rootBone: "Root",
    hipsBone: "Hips",
    headBone: "Head",
    leftHandBone: "LeftHand",
    rightHandBone: "RightHand"
  })
});

function asset(id, sourceId, kind, options = {}) {
  const base = `${CHARACTER_ASSET_ROOT_V1}/${kind}/${id}`;
  return freeze({
    id,
    sourceId,
    kind,
    benchmark: Boolean(options.benchmark),
    bundledModel: Boolean(options.bundledModel),
    referenceStatus: "approved",
    productionStatus: "awaiting-glb",
    liveRenderer: options.liveRenderer || "3d-auto",
    model: `${base}/${id}.glb`,
    lods: freeze([
      `${base}/${id}-lod1.glb`,
      `${base}/${id}-lod2.glb`
    ]),
    rig: kind === "outfield" ? CHARACTER_RIGS_V1.outfield.id : CHARACTER_RIGS_V1.goalkeeper.id,
    visualIdentity: freeze(options.visualIdentity || {}),
    notes: options.notes || ""
  });
}

export const CHARACTER_ASSETS_V1 = freeze({
  "viktor-kane": asset("viktor-kane", "dax-ryder", "outfield", {
    benchmark: true,
    bundledModel: true,
    liveRenderer: "arcade-v44",
    visualIdentity: {
      build: "tall-balanced-athletic",
      hair: "short-textured-blonde",
      face: "original-strong-jaw",
      kit: "football-lab-white-navy",
      role: "master-outfield"
    },
    notes: "Approved master outfield reference retained for asset work. Live gameplay intentionally uses the shared V44 arcade renderer for roster consistency."
  }),
  "bruno-silva": asset("bruno-silva", "leo-vale", "outfield", {
    visualIdentity: {
      build: "lean-technical",
      hair: "short-dark-textured",
      face: "original-angular",
      kit: "football-lab-white-navy",
      role: "precision-playmaker"
    }
  }),
  "david-beckett": asset("david-beckett", "zion-arc", "outfield", {
    visualIdentity: {
      build: "lean-elegant-athletic",
      hair: "styled-light-brown-blonde",
      face: "original-defined",
      kit: "football-lab-black-teal",
      role: "set-piece-specialist"
    }
  }),
  "wayne-redman": asset("wayne-redman", "kai-mori", "outfield", {
    visualIdentity: {
      build: "compact-powerful",
      hair: "short-brown",
      face: "original-broad-rugged",
      kit: "football-lab-black-teal",
      role: "power-forward"
    }
  }),
  "mikkel-storm": asset("mikkel-storm", "giant", "goalkeeper", {
    benchmark: true,
    bundledModel: true,
    visualIdentity: {
      build: "tall-physically-imposing",
      hair: "short-light-brown-blonde",
      face: "original-commanding",
      kit: "football-lab-deep-green",
      role: "master-goalkeeper"
    },
    notes: "Approved master goalkeeper reference. Must feel physically dominant without using a direct real-person likeness."
  }),
  "rafael-dantas": asset("rafael-dantas", "reader", "goalkeeper", {
    visualIdentity: {
      build: "tall-lean-athletic",
      hair: "short-dark-clean",
      face: "original-calm",
      kit: "football-lab-navy-blue",
      role: "composed-shot-stopper"
    }
  }),
  "diego-varela": asset("diego-varela", "reflex", "goalkeeper", {
    visualIdentity: {
      build: "tall-lean-agile",
      hair: "short-dark-modern",
      face: "original-sharp-stubble",
      kit: "football-lab-black-purple",
      role: "reflex-specialist"
    }
  }),
  "simon-henshaw": asset("simon-henshaw", "academy", "goalkeeper", {
    visualIdentity: {
      build: "tall-solid-classic",
      hair: "longer-light-brown-classic",
      face: "original-mature-moustache",
      kit: "football-lab-teal",
      role: "classic-safe-hands"
    }
  })
});

const BY_SOURCE_ID = new Map(
  Object.values(CHARACTER_ASSETS_V1)
    .filter((entry) => entry.liveRenderer !== "arcade-v44")
    .map((entry) => [entry.sourceId, entry])
);

export function characterAssetV1(id) {
  return CHARACTER_ASSETS_V1[id] || null;
}

export function characterAssetBySourceIdV1(sourceId) {
  return BY_SOURCE_ID.get(sourceId) || null;
}

export function requiredClipsForAssetV1(entry) {
  if (!entry) return freeze([]);
  return entry.kind === "goalkeeper" ? CHARACTER_RIGS_V1.goalkeeper.requiredClips : CHARACTER_RIGS_V1.outfield.requiredClips;
}

export const CHARACTER_PRODUCTION_CONTRACT_V1 = freeze({
  build: CHARACTER_PRODUCTION_BUILD_V1,
  format: "glb",
  rendererTarget: "rigged-3d-human-realism",
  masterOutfield: "viktor-kane",
  masterGoalkeeper: "mikkel-storm",
  liveIntegration: false,
  liveArcadeFallback: ["viktor-kane"],
  fallbackRenderer: "v42.1-layered-canvas",
  assetCount: Object.keys(CHARACTER_ASSETS_V1).length,
  explicitApprovalRequired: true,
  directCelebrityLikenesses: false
});

if (typeof window !== "undefined") {
  window.__footballLabCharacterProductionV1 = CHARACTER_PRODUCTION_CONTRACT_V1;
}
