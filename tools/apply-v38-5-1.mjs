import fs from "node:fs";

const keeperPath = "game/keeper-visuals-v38-1.js";
const appPath = "app.js";
let source = fs.readFileSync(keeperPath, "utf8");
let app = fs.readFileSync(appPath, "utf8");

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`V38.5.1 patch failed: ${label}`);
  return text.replace(from, to);
}

source = replaceOnce(source, 'const BUILD = "38.5.0";', 'const BUILD = "38.5.1";', "build marker");

source = replaceOnce(
  source,
  '  const arcHeight = Math.max(0.12, 0.22 + mid * 0.18 + high * 0.34 - low * 0.08 + style.arc);\n  const arcPulse = Math.sin(clamp(launch, 0, 1) * Math.PI * 0.72);\n  const committedZ = Number.isFinite(committed.z) ? committed.z : baseStart.z;\n  const world = {\n    x: lerp(preLaunchX, bodyTargetX, launch),\n    y: Math.max(0, arcPulse * arcHeight + push * (0.045 + high * 0.04)) * (1 - land * 0.96),\n    z: lerp(committedZ, plan.contact.z, launch)\n  };',
  '  // V38.5.1: dives travel across goal first, upward second. High saves still rise,\n  // but the hips no longer float above the wall and the keeper stays in the goalmouth depth.\n  const arcHeight = Math.max(0.075, 0.13 + mid * 0.095 + high * 0.17 - low * 0.045 + style.arc * 0.4);\n  const arcPulse = Math.sin(clamp(launch, 0, 1) * Math.PI * 0.68);\n  const lateralDrive = smooth01(clamp(diveRaw / Math.max(0.62, 0.74 - high * 0.045 + low * 0.025), 0, 1));\n  const landingSlide = direction * land * (0.045 + low * 0.05 + mid * 0.025);\n  const committedZ = Number.isFinite(committed.z) ? committed.z : baseStart.z;\n  const contactDepth = Number.isFinite(plan.contact.z) ? plan.contact.z : committedZ;\n  const depthTarget = clamp(\n    lerp(committedZ, contactDepth, profile.id === "aggressive" ? 0.42 : 0.28),\n    0.2,\n    baseStart.z + (profile.id === "aggressive" ? 0.34 : 0.16)\n  );\n  const world = {\n    x: lerp(preLaunchX, bodyTargetX, lateralDrive) + landingSlide,\n    y: Math.max(0, arcPulse * arcHeight + push * (0.022 + high * 0.018)) * (1 - land * 0.985),\n    z: lerp(committedZ, depthTarget, launch)\n  };',
  "lateral/vertical/depth motion"
);

source = replaceOnce(
  source,
  '  const rotationTarget = direction * (low * 1.38 + mid * 1.1 + high * 0.86);',
  '  // High dives remain diagonally athletic instead of rotating into a floating horizontal pose.\n  const rotationTarget = direction * (low * 1.28 + mid * 0.98 + high * 0.68);',
  "dive rotation"
);

source = replaceOnce(
  source,
  '  const recoveryTarget = direction * (state.shot?.saveType === "CATCH" ? 0.18 : 0.31);',
  '  const recoveryTarget = direction * (state.shot?.saveType === "CATCH" ? 0.14 : 0.24);',
  "recovery rotation"
);

source = replaceOnce(
  source,
  '      crouch: 0.105 + coil * 0.18 + plant * 0.055 + land * 0.16 + recovery * 0.075 + catchHold * 0.03,',
  '      crouch: 0.105 + coil * 0.18 + plant * 0.06 + land * 0.205 + recovery * 0.09 + catchHold * 0.03,',
  "landing weight"
);

source = source.replaceAll('high * 0.065', 'high * 0.035');
source = source.replaceAll('high * 0.05', 'high * 0.026');

source = replaceOnce(
  source,
  '  const visualHeight = profile.visualHeight * 1.18;',
  '  const visualHeight = profile.visualHeight * 1.20;',
  "keeper visual scale"
);
source = replaceOnce(source, '    visualScale: 1.18,', '    visualScale: 1.20,', "frame scale metadata");
source = replaceOnce(source, '    keeperVisualScale: "base-1.18",', '    keeperVisualScale: "base-1.20",', "release scale metadata");
source = replaceOnce(
  source,
  '    keeperDiveMotion: "read-commit-correct-plant-push-height-dive-contact-land-recover",',
  '    keeperDiveMotion: "weighted-read-commit-correct-plant-lateral-height-dive-contact-shoulder-land-slide-recover",\n    keeperMotionCorrection: "38.5.1-weight-depth-lateral",\n    keeperDepthModel: "goalmouth-clamped",',
  "release dive metadata"
);
source = replaceOnce(
  source,
  '    cacheGeneration: "38.5"',
  '    cacheGeneration: "38.5.1"',
  "release cache metadata"
);
source = replaceOnce(
  source,
  '  diveSequence: ["read", "commit", "correct", "plant", "push", "low-mid-high-dive", "contact", "land", "recover"],',
  '  diveSequence: ["read", "commit", "correct", "plant", "lateral-push", "low-mid-high-dive", "contact", "shoulder-land", "slide", "recover"],',
  "public dive sequence"
);
source = replaceOnce(source, '  build: BUILD,\n  legacyKeeperSuppressed: true,', '  build: BUILD,\n  motionCorrection: "38.5.1-weight-depth-lateral",\n  legacyKeeperSuppressed: true,', "public motion correction");
source = replaceOnce(
  source,
  '      console.error("Football Lab V38.5 keeper overlay failed", error);',
  '      console.error("Football Lab V38.5.1 keeper overlay failed", error);',
  "overlay error label"
);

app = replaceOnce(
  app,
  './game/keeper-visuals-v38-1.js?v=38.5.0',
  './game/keeper-visuals-v38-1.js?v=38.5.1',
  "app cache version"
);

fs.writeFileSync(keeperPath, source);
fs.writeFileSync(appPath, app);
console.log("Applied Football Lab V38.5.1 keeper weight/depth correction");
