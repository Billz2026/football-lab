const sourceUrl = new URL("./render-v11-3-base.js?v=113", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V11.3 renderer (${response.status})`);
let source = await response.text();

function replaceRequired(label, before, after) {
  if (!source.includes(before)) {
    throw new Error(`V11.4 renderer patch failed: ${label}`);
  }
  source = source.replace(before, after);
}

// Kicker: make the feet and hips drive the approach instead of the body gliding.
replaceRequired(
  "run hip transfer",
  "      pelvisX: stride * 0.012,\n      chestX: stride * 0.018,\n      torsoLean: -0.045 - run * 0.09,",
  "      pelvisX: stride * 0.024,\n      chestX: stride * 0.028,\n      torsoLean: -0.035 - run * 0.065,"
);
replaceRequired(
  "plant lean",
  "      torsoLean: lerp(-0.09, -0.19, plant),",
  "      torsoLean: lerp(-0.075, -0.145, plant),"
);
replaceRequired(
  "strike lean",
  "    torsoLean: lerp(-0.19, impact.torsoLean, strike),",
  "    torsoLean: lerp(-0.145, impact.torsoLean, strike),"
);
replaceRequired(
  "replay follow through",
  "      torsoLean: lerp(-0.055, 0.08, follow),\n      rotation: lerp(0.018, 0.075, follow),",
  "      torsoLean: lerp(-0.055, 0.055, follow),\n      rotation: lerp(0.018, 0.052, follow),"
);
replaceRequired(
  "slower recovery",
  "    const recover = smooth01(clamp((progress.flight - 0.32) / 0.42, 0, 1));",
  "    const recover = smooth01(clamp((progress.flight - 0.4) / 0.52, 0, 1));"
);
replaceRequired(
  "controlled follow through",
  "      torsoLean: lerp(lerp(-0.055, 0.09, follow), 0.005, Math.max(recover, settle)),\n      rotation: lerp(lerp(0.018, 0.08, follow), 0.01, Math.max(recover, settle)),",
  "      torsoLean: lerp(lerp(-0.055, 0.055, follow), 0.005, Math.max(recover, settle)),\n      rotation: lerp(lerp(0.018, 0.052, follow), 0.01, Math.max(recover, settle)),"
);
replaceRequired(
  "footstep matched travel",
  "  const approach = progress.replay ? 1 : clamp(progress.run / 0.84, 0, 1);\n  const runPosition = state.animation ? easeInOutCubic(approach) : 0;",
  "  const rawApproach = progress.replay ? 1 : clamp(progress.run / 0.84, 0, 1);\n  const approach = progress.replay\n    ? 1\n    : rawApproach < 0.64\n      ? smooth01(rawApproach / 0.64) * 0.5\n      : 0.5 + smooth01((rawApproach - 0.64) / 0.36) * 0.5;\n  const runPosition = state.animation ? easeInOutCubic(approach) : 0;"
);
replaceRequired(
  "reduce approach drift",
  "    const extra = (1 - smooth01(progress.run / 0.84)) * 0.34;\n    world.z += extra;\n    world.x -= extra * 0.13;",
  "    const extra = (1 - smooth01(progress.run / 0.84)) * 0.18;\n    world.z += extra;\n    world.x -= extra * 0.08;"
);

// Wall: earlier anticipation, a visibly higher jump, and a clearer isolated impact reaction.
replaceRequired(
  "wall anticipation",
  "  const anticipation = smooth01((flight - (passRatio - 0.18)) / 0.11);\n  const jump = pulse01((flight - (passRatio - 0.09)) / 0.18);\n  const landing = pulse01((flight - (passRatio + 0.1)) / 0.22);",
  "  const anticipation = smooth01((flight - (passRatio - 0.23)) / 0.14);\n  const jump = pulse01((flight - (passRatio - 0.12)) / 0.24);\n  const landing = pulse01((flight - (passRatio + 0.1)) / 0.3);"
);
replaceRequired(
  "wall hit duration",
  "  const hitReact = hit ? pulse01((flight - hitRatio) / 0.24) : 0;",
  "  const hitReact = hit ? pulse01((flight - hitRatio) / 0.32) : 0;"
);
replaceRequired(
  "wall jump and recoil",
  "    crouch: 0.025 + anticipation * 0.11 + landing * 0.075,\n    lift: Math.max(0, jump) * 0.082,\n    rotation: hitReact * direction * 0.17,\n    chestX: hitReact * direction * 0.05,",
  "    crouch: 0.025 + anticipation * 0.13 + landing * 0.105,\n    lift: Math.max(0, jump) * 0.118,\n    rotation: hitReact * direction * 0.28,\n    chestX: hitReact * direction * 0.08,"
);
replaceRequired(
  "wall arm reaction",
  "    leftHand: { x: -0.09 - hitReact * 0.08, y: -0.42 + anticipation * 0.04 },\n    rightHand: { x: 0.09 + hitReact * 0.08, y: -0.42 + anticipation * 0.04 }",
  "    leftHand: { x: -0.09 - hitReact * 0.14, y: -0.42 + anticipation * 0.055 + hitReact * 0.035 },\n    rightHand: { x: 0.09 + hitReact * 0.14, y: -0.42 + anticipation * 0.055 - hitReact * 0.02 }"
);

// Goalkeeper: hold the set position longer, push from the ground, then land after contact.
replaceRequired(
  "keeper push window",
  "  const push = pulse01((flight - (reactionFraction - 0.025)) / 0.16);\n  const diveRaw = clamp((flight - reactionFraction) / Math.max(0.12, 0.9 - reactionFraction), 0, 1);\n  const dive = smooth01(diveRaw);\n  const land = smooth01((flight - 0.82) / 0.18);",
  "  const push = pulse01((flight - (reactionFraction - 0.04)) / 0.2);\n  const diveRaw = clamp((flight - reactionFraction) / Math.max(0.12, 0.9 - reactionFraction), 0, 1);\n  const dive = smooth01(diveRaw);\n  const launch = smooth01(clamp((diveRaw - 0.07) / 0.93, 0, 1));\n  const contactPoint = impactRatio();\n  const land = smooth01((flight - Math.min(0.9, contactPoint + 0.01)) / 0.16);"
);
replaceRequired(
  "keeper world launch",
  "    x: lerp(idle.x + adjustmentStep, plan.contact.x - direction * 0.08, dive),\n    y: Math.max(0, Math.sin(dive * Math.PI) * 0.34 + push * 0.045) * (1 - land * 0.92),\n    z: lerp(idle.z, plan.contact.z, dive)",
  "    x: lerp(idle.x + adjustmentStep, plan.contact.x - direction * 0.08, launch),\n    y: Math.max(0, Math.sin(launch * Math.PI) * 0.38 + push * 0.075) * (1 - land * 0.94),\n    z: lerp(idle.z, plan.contact.z, launch)"
);
replaceRequired(
  "keeper body rotation",
  "  const launchRotation = direction * lerp(0, 1.02, dive);\n  const finalRotation = direction * lerp(1.02, 0.78, recovery);",
  "  const launchRotation = direction * lerp(0, 1.08, launch);\n  const finalRotation = direction * lerp(1.08, 0.7, recovery);"
);
replaceRequired(
  "keeper landing weight",
  "      crouch: 0.08 + coil * 0.14 + land * 0.11 + recovery * 0.04,\n      rotation,\n      torsoLean: direction * dive * 0.1,\n      chestX: direction * dive * 0.035,",
  "      crouch: 0.08 + coil * 0.16 + land * 0.16 + recovery * 0.05,\n      rotation,\n      torsoLean: direction * launch * 0.12,\n      chestX: direction * launch * 0.045,"
);
replaceRequired(
  "keeper leg push",
  "        x: -0.13 - direction * dive * 0.06 - direction * push * 0.05,\n        y: -0.14 - dive * 0.055 + land * 0.04",
  "        x: -0.13 - direction * launch * 0.06 - direction * push * 0.09,\n        y: -0.14 - launch * 0.055 + land * 0.055"
);
replaceRequired(
  "keeper trail leg push",
  "        x: 0.13 - direction * dive * 0.06 + direction * push * 0.05,\n        y: -0.14 + dive * 0.025 + land * 0.04",
  "        x: 0.13 - direction * launch * 0.06 + direction * push * 0.09,\n        y: -0.14 + launch * 0.025 + land * 0.055"
);
replaceRequired(
  "keeper foot push",
  "        x: -0.16 - direction * dive * 0.15 - direction * push * 0.08,\n        y: -0.01 - dive * 0.09 + land * 0.03",
  "        x: -0.16 - direction * launch * 0.15 - direction * push * 0.13,\n        y: -0.01 - launch * 0.09 + land * 0.045"
);
replaceRequired(
  "keeper trailing foot",
  "        x: 0.16 - direction * dive * 0.15 + direction * push * 0.08,\n        y: -0.01 + dive * 0.025 + land * 0.03",
  "        x: 0.16 - direction * launch * 0.15 + direction * push * 0.13,\n        y: -0.01 + launch * 0.025 + land * 0.045"
);

// Blob modules need absolute dependency URLs because their own URL has no directory.
source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-render-v11-4-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
