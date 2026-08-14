import fs from "node:fs";

const paths = {
  app: "app.js",
  sw: "sw.js",
  runtime: "game/runtime-v23-main.js",
  bridgeV17: "game/runtime-v23-bridge-render-v17-3-1-64b7ab3399.js",
  genV17: "game/runtime-v23-generated-render-v17-v1731-7f257084b1.js",
  genV15: "game/runtime-v23-generated-render-v15-v1731-1b04a249af.js",
  bridgeV9: "game/runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js",
  base: "game/runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js",
  hero: "game/runtime-v23-generated-hero-kicker-v17-3-1-7c97a59e31.js"
};

const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]));

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`V39 patch failed: ${label}`);
  return text.replace(from, to);
}

function replaceSection(text, startMarker, endMarker, replacement, label) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`V39 patch failed: ${label} start`);
  const end = text.indexOf(endMarker, start);
  if (end < 0) throw new Error(`V39 patch failed: ${label} end`);
  return text.slice(0, start) + replacement + text.slice(end);
}

// ---------- Hero kicker: realistic approach, plant, hip drive, leg snap and recovery ----------
const newStep = `const step = {
  phase: "final-step", crouch: .062, pelvisX: .006, chestX: -.018, lean: -.102, rotate: -.024, shoulder: -.018,
  lk: P(-.145, -.148), rk: P(.145, -.215), la: P(-.198, -.006), ra: P(.19, -.105),
  lt: P(-.255, -.002), rt: P(.245, -.078), le: P(-.265, -.54), re: P(.25, -.575),
  lh: P(-.34, -.465), rh: P(.33, -.5)
};
`;
files.hero = replaceSection(files.hero, 'const step = {', 'const windup = {', newStep, 'hero final step');

const newWindupAndDrive = `const windup = {
  phase: "wind-up", crouch: .09, pelvisX: .018, chestX: -.04, lean: -.158, rotate: -.046, shoulder: -.044,
  lk: P(-.16, -.136), rk: P(.195, -.298), la: P(-.21, -.006), ra: P(.22, -.19),
  lt: P(-.268, -.002), rt: P(.282, -.155), le: P(-.31, -.55), re: P(.3, -.61),
  lh: P(-.38, -.44), rh: P(.38, -.535)
};
const hipDrive = {
  phase: "hip-drive", crouch: .078, pelvisX: .004, chestX: .004, lean: -.088, rotate: -.008, shoulder: .014,
  lk: P(-.16, -.136), rk: P(.095, -.258), la: P(-.21, -.006), ra: P(.15, -.26),
  lt: P(-.268, -.002), rt: P(.214, -.225), le: P(-.3, -.515), re: P(.315, -.59),
  lh: P(-.37, -.392), rh: P(.395, -.49)
};
`;
files.hero = replaceSection(files.hero, 'const windup = {', 'const contact = {', newWindupAndDrive, 'hero windup and hip drive');

const newContact = `const contact = {
  phase: "contact", crouch: .058, pelvisX: -.012, chestX: .046, lean: -.022, rotate: .052, shoulder: .06,
  lk: P(-.16, -.135), rk: P(.04, -.215), la: P(-.21, -.006), ra: P(-.045, -.235),
  lt: P(-.268, -.002), rt: P(-.13, -.21), le: P(-.3, -.485), re: P(.34, -.545),
  lh: P(-.37, -.355), rh: P(.42, -.44)
};
`;
files.hero = replaceSection(files.hero, 'const contact = {', 'const follow = {', newContact, 'hero contact');

const newFollowAndCross = `const follow = {
  phase: "follow-through", crouch: .034, pelvisX: -.03, chestX: .07, lean: .074, rotate: .074, shoulder: .064,
  lk: P(-.125, -.148), rk: P(-.045, -.278), la: P(-.18, -.006), ra: P(-.18, -.272),
  lt: P(-.245, -.002), rt: P(-.282, -.248), le: P(-.235, -.425), re: P(.292, -.482),
  lh: P(-.282, -.292), rh: P(.382, -.382)
};
const crossStep = {
  phase: "recovery-cross-step", crouch: .046, pelvisX: -.024, chestX: .045, lean: .038, rotate: .042, shoulder: .026,
  lk: P(-.125, -.15), rk: P(.012, -.19), la: P(-.175, -.006), ra: P(-.04, -.038),
  lt: P(-.24, -.002), rt: P(-.115, -.012), le: P(-.22, -.46), re: P(.25, -.49),
  lh: P(-.275, -.34), rh: P(.315, -.4)
};
`;
files.hero = replaceSection(files.hero, 'const follow = {', 'const recover = {', newFollowAndCross, 'hero follow and recovery cross step');

const newRunPose = `function runPose(run, time) {
  if (run < .58) {
    const t = run / .58;
    const cadence = Math.sin(t * Math.PI * 4.15);
    const strideCompression = lerp(1, .66, smooth(clamp((t - .5) / .5, 0, 1)));
    const s = cadence * strideCompression;
    const l = Math.max(0, s), r = Math.max(0, -s);
    const bounce = Math.abs(cadence) * .014 * strideCompression;
    return {
      phase: "accelerating-approach", crouch: .026 + bounce, pelvisX: s * .016, chestX: -s * .01,
      lean: -.032 - t * .07, rotate: s * .014, shoulder: -s * .022,
      lk: P(-.105 - s * .072, -.17 - l * .068), rk: P(.105 + s * .072, -.17 - r * .068),
      la: P(-.13 - s * .095, -.006 - l * .038), ra: P(.13 + s * .095, -.006 - r * .038),
      lt: P(-.185 - s * .105, -.002 - l * .028), rt: P(.185 + s * .105, -.002 - r * .028),
      le: P(-.22 + s * .052, -.535 - s * .022), re: P(.22 + s * .052, -.535 + s * .022),
      lh: P(-.285 + s * .072, -.425 - s * .04), rh: P(.285 + s * .072, -.425 + s * .04),
      breathe: Math.sin(time / 480) * .003
    };
  }
  if (run < .73) return blend(runPose(.579, time), step, smooth((run - .58) / .15));
  if (run < .86) return blend(step, windup, smooth((run - .73) / .13));
  const strike = clamp((run - .86) / .14, 0, 1);
  if (strike < .48) return blend(windup, hipDrive, smooth(strike / .48), "hip-drive");
  return blend(hipDrive, contact, smooth((strike - .48) / .52), "lower-leg-snap");
}

`;
files.hero = replaceSection(files.hero, 'function runPose(run, time) {', 'function currentPose(p, time) {', newRunPose, 'hero run pose');

const newCurrentPose = `function currentPose(p, time) {
  if (!state.animation) return { ...idle, crouch: idle.crouch + Math.sin(time / 520) * .007 };
  if (p.replay) {
    if (p.flight < .18) return blend(contact, follow, smooth(p.flight / .18));
    if (p.flight < .36) return blend(follow, crossStep, smooth((p.flight - .18) / .18));
    if (p.flight < .7) return blend(crossStep, recover, smooth((p.flight - .36) / .34));
    return blend(recover, neutral, smooth((p.flight - .7) / .3));
  }
  if (p.contact > 0 && p.flight <= 0) return contact;
  if (p.flight > 0 || p.settle > 0) {
    if (p.flight < .14) return blend(contact, follow, smooth(p.flight / .14));
    if (p.flight < .3) return blend(follow, crossStep, smooth((p.flight - .14) / .16));
    if (p.flight < .58) return blend(crossStep, recover, smooth((p.flight - .3) / .28));
    return blend(recover, neutral, Math.max(smooth((p.flight - .58) / .34), p.settle));
  }
  return runPose(p.run, time);
}

`;
files.hero = replaceSection(files.hero, 'function currentPose(p, time) {', 'function travel(p) {', newCurrentPose, 'hero current pose');

const newTravel = `function travel(p) {
  if (!state.animation) return 0;
  if (p.replay) return 1;
  const t = clamp(p.run / .82, 0, 1);
  if (t < .58) return smooth(t / .58) * .52;
  return .52 + easeOutCubic((t - .58) / .42) * .48;
}

`;
files.hero = replaceSection(files.hero, 'function travel(p) {', 'function copyPose(base) {', newTravel, 'hero travel');

// Give the player more grounded weight and a cleaner boot sole without changing geometry/physics.
files.hero = replaceOnce(
  files.hero,
  '  ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(0, 5, h * (pose.phase.includes("follow") ? .22 : .185), h * .04, -pose.rotate * .2, 0, TAU); ctx.fill();',
  '  const groundedPhase = ["final-step", "wind-up", "hip-drive", "lower-leg-snap", "contact"].includes(pose.phase);\n  const shadowWidth = h * (pose.phase.includes("follow") || pose.phase.includes("recovery") ? .205 : .178);\n  ctx.fillStyle = groundedPhase ? "rgba(0,0,0,.29)" : "rgba(0,0,0,.21)"; ctx.beginPath(); ctx.ellipse(0, 5, shadowWidth, h * (groundedPhase ? .043 : .036), -pose.rotate * .18, 0, TAU); ctx.fill();',
  'hero grounded shadow'
);
files.hero = replaceOnce(
  files.hero,
  '  if (["final-step", "wind-up", "contact"].includes(pose.phase)) { ctx.fillStyle = "rgba(12,45,23,.46)"; ctx.beginPath(); ctx.ellipse(la.x, la.y + h * .008, h * .065, h * .015, -.12, 0, TAU); ctx.fill(); }',
  '  if (["final-step", "wind-up", "hip-drive", "lower-leg-snap", "contact"].includes(pose.phase)) { ctx.fillStyle = "rgba(12,45,23,.55)"; ctx.beginPath(); ctx.ellipse(la.x, la.y + h * .008, h * .07, h * .017, -.12, 0, TAU); ctx.fill(); }',
  'hero plant-foot compression'
);
files.hero = replaceOnce(
  files.hero,
  '  window.__footballLabMotionSnapshotV173 = { phase: pose.phase, run: p.run, flight: p.flight, plantLocked: Boolean(state.animation && !p.replay && p.run >= .72), travel: travel(p), world: { x: world.x, y: world.y, z: world.z }, leftAnkle: { ...pose.la }, rightAnkle: { ...pose.ra }, bodyRotation: pose.rotate, torsoLean: pose.lean };',
  '  window.__footballLabMotionSnapshotV173 = { phase: pose.phase, run: p.run, flight: p.flight, plantLocked: Boolean(state.animation && !p.replay && p.run >= .73), hipDrive: pose.phase === "hip-drive", legSnap: pose.phase === "lower-leg-snap", crossStep: pose.phase === "recovery-cross-step", travel: travel(p), world: { x: world.x, y: world.y, z: world.z }, leftAnkle: { ...pose.la }, rightAnkle: { ...pose.ra }, bodyRotation: pose.rotate, torsoLean: pose.lean, build: "39.0.0" };',
  'hero V39 motion metadata'
);
files.hero += '\nwindow.__footballLabCharacterMotionV39 = Object.freeze({ build: "39.0.0", approach: "accelerating-short-final-stride", plant: "support-leg-load", strike: "hip-drive-then-lower-leg-snap", followThrough: "cross-body-then-recovery-step", grounded: true });\n';

// ---------- Wall: individual anticipation/jumps/reactions + refined proportions ----------
const newWallPose = `function wallPose(progress, index, count, hit) {
  const centreIndex = (count - 1) / 2;
  const direction = index < centreIndex ? -1 : 1;
  const variant = index % 4;
  const idleBias = (variant - 1.5) * 0.006;
  if (!state.animation) {
    const handLift = variant === 2 ? 0.055 : variant === 1 ? 0.025 : 0;
    return {
      crouch: 0.025 + (index % 3) * 0.006,
      pelvisX: idleBias,
      chestX: -idleBias * 0.7,
      headX: direction * (0.008 + variant * 0.003),
      shoulderTilt: (variant % 2 ? 1 : -1) * 0.012,
      leftHand: { x: -0.1 - variant * 0.008, y: -0.42 - handLift },
      rightHand: { x: 0.1 + variant * 0.008, y: -0.42 + (variant === 3 ? 0.035 : -handLift * 0.35) }
    };
  }

  const flight = progress.motionFlight;
  const wallProfile = wallForStage(state.stage);
  const modifiers = wallProfile.modifiers;
  const personalityOffset = [-0.018, 0.012, -0.004, 0.024][variant];
  const stagger = (index - centreIndex) * modifiers.staggerTiming
    + (index % 2 === 0 ? -modifiers.alternateDelay : modifiers.alternateDelay)
    + personalityOffset;
  const passRatio = clamp(pathRatioAtWall() - modifiers.jumpLead + stagger, 0.1, 0.88);
  const anticipation = smooth01((flight - (passRatio - 0.24)) / 0.15);
  const jump = pulse01((flight - (passRatio - 0.115)) / Math.max(0.19, modifiers.jumpWindow * (1.42 + variant * 0.045)));
  const landing = pulse01((flight - (passRatio + 0.085 + variant * 0.012)) / (0.29 + variant * 0.018));
  const jumpPattern = modifiers.jumpPattern[index % modifiers.jumpPattern.length] || 1;
  const hitRatio = state.shot.outcome === "WALL" && Number.isInteger(state.shot.collision?.index)
    ? state.shot.collision.index / Math.max(1, state.shot.path.length - 1)
    : passRatio;
  const hitReact = hit ? pulse01((flight - hitRatio) / 0.34) : 0;
  const passReact = pulse01((flight - passRatio) / (0.28 + variant * 0.015)) * (hit ? 0 : 1);
  const headTurn = smooth01(clamp((flight - passRatio) / 0.22, 0, 1));
  const tuck = Math.max(0, jump) * (0.018 + variant * 0.004);
  const armGuard = [0.0, 0.035, 0.07, 0.02][variant];
  const lateralFlinch = passReact * direction * (0.018 + variant * 0.006);

  return {
    crouch: 0.025 + anticipation * 0.12 + landing * (0.095 + variant * 0.01),
    lift: Math.max(0, jump) * 0.112 * modifiers.jumpMultiplier * jumpPattern * (0.94 + variant * 0.035),
    rotation: hitReact * direction * 0.34 + passReact * direction * (0.045 + variant * 0.012),
    torsoLean: hitReact * direction * 0.11 + lateralFlinch,
    shoulderTilt: (variant % 2 ? 1 : -1) * (0.012 + anticipation * 0.018) + hitReact * direction * 0.055,
    chestX: hitReact * direction * 0.095 + lateralFlinch,
    headX: direction * (0.008 + headTurn * (0.028 + variant * 0.006)),
    leftKnee: { x: -0.1 - hitReact * direction * 0.025 - jump * 0.008, y: -0.15 - tuck + landing * 0.035 },
    rightKnee: { x: 0.1 - hitReact * direction * 0.025 + jump * 0.008, y: -0.15 - tuck * 0.86 + landing * 0.035 },
    leftAnkle: { x: -0.13 - jump * 0.006, y: -0.005 - tuck * 0.45 + landing * 0.012 },
    rightAnkle: { x: 0.13 + jump * 0.006, y: -0.005 - tuck * 0.38 + landing * 0.012 },
    leftToe: { x: -0.18 - jump * 0.012, y: -0.002 + landing * 0.006 },
    rightToe: { x: 0.18 + jump * 0.012, y: -0.002 + landing * 0.006 },
    leftHand: { x: -0.09 - armGuard - hitReact * 0.16 - passReact * (0.025 + variant * 0.008), y: -0.42 - anticipation * (0.02 + variant * 0.012) + hitReact * 0.045 },
    rightHand: { x: 0.09 + armGuard + hitReact * 0.16 + passReact * (0.025 + (3 - variant) * 0.006), y: -0.42 + (variant === 3 ? anticipation * 0.035 : -anticipation * 0.015) - hitReact * 0.025 }
  };
}

`;
files.base = replaceSection(files.base, 'function wallPose(progress, index, count, hit) {', 'function impactRatio() {', newWallPose, 'wall individual pose');

// Refine generic articulated proportions used by the wall and fallback figures.
files.base = replaceOnce(files.base, '  const headRadius = h * 0.068;', '  const headRadius = h * 0.064;', 'wall head proportion');
files.base = replaceOnce(files.base, '  const shoulderHalf = h * 0.118;', '  const shoulderHalf = h * 0.112;\n  const shoulderTilt = (pose.shoulderTilt || 0) * h;', 'wall shoulder proportion');
files.base = replaceOnce(files.base, '  const hipHalf = h * 0.068;', '  const hipHalf = h * 0.072;', 'wall hip proportion');
files.base = replaceOnce(files.base, '  const leftShoulder = screenPoint(chest.x - shoulderHalf, chest.y + h * 0.015);\n  const rightShoulder = screenPoint(chest.x + shoulderHalf, chest.y + h * 0.015);', '  const leftShoulder = screenPoint(chest.x - shoulderHalf, chest.y + h * 0.015 + shoulderTilt);\n  const rightShoulder = screenPoint(chest.x + shoulderHalf, chest.y + h * 0.015 - shoulderTilt);', 'wall shoulder tilt');
files.base = replaceOnce(files.base, '  const legWidth = Math.max(4, h * 0.052);', '  const legWidth = Math.max(3.8, h * 0.049);', 'wall leg proportion');
files.base = replaceOnce(
  files.base,
  '  ctx.fillStyle = "rgba(0,0,0,.22)";\n  ctx.beginPath();\n  ctx.ellipse(0, 3 + liftPixels, h * 0.15, h * 0.038, 0, 0, TAU);\n  ctx.fill();',
  '  const airborne = clamp((pose.lift || 0) / 0.14, 0, 1);\n  ctx.fillStyle = `rgba(0,0,0,${0.24 - airborne * 0.1})`;\n  ctx.beginPath();\n  ctx.ellipse(0, 3 + liftPixels, h * (0.15 - airborne * 0.025), h * (0.038 - airborne * 0.008), 0, 0, TAU);\n  ctx.fill();',
  'wall grounded shadow'
);
files.base = replaceOnce(
  files.base,
  '  window.__footballLabWallMotionV32 = {\n    profile: wallProfile.id,\n    reactive: true,\n    jumping: Boolean(state.animation && progress.motionFlight > 0),\n    hitPlayer: state.shot?.collision?.playerIndex ?? null\n  };',
  '  window.__footballLabWallMotionV32 = {\n    profile: wallProfile.id,\n    reactive: true,\n    individualTiming: true,\n    individualHeadAndArmReaction: true,\n    staggeredLanding: true,\n    jumping: Boolean(state.animation && progress.motionFlight > 0),\n    hitPlayer: state.shot?.collision?.playerIndex ?? null,\n    build: "39.0.0"\n  };',
  'wall V39 metadata'
);
files.base += '\nwindow.__footballLabWallAnimationV39 = Object.freeze({ build: "39.0.0", anticipation: "individual", jump: "staggered", reaction: "head-arm-torso", landing: "offset", proportions: "refined" });\n';

// ---------- Cache/version chain ----------
for (const key of ["bridgeV9", "genV15", "genV17", "bridgeV17", "runtime"]) {
  files[key] = files[key].replaceAll('?v=38.8.0', '?v=39.0.0');
}
files.bridgeV17 = files.bridgeV17.replace('./runtime-v23-generated-hero-kicker-v17-3-1-7c97a59e31.js?v=38.8.0', './runtime-v23-generated-hero-kicker-v17-3-1-7c97a59e31.js?v=39.0.0');
files.app = files.app.replaceAll('38.8.0', '39.0.0');
files.app = files.app.replace('// Football Lab V39.0.0 cinematic goal/save payoff', '// Football Lab V39 character motion overhaul');
files.app = files.app.replace('badge.textContent = "V38.8";', 'badge.textContent = "V39";');
files.app = files.app.replace(
  '          duplicateImpactLabels: "retired",',
  '          duplicateImpactLabels: "retired",\n          characterMotion: "accelerating-approach-short-final-stride-plant-hip-drive-leg-snap-cross-step",\n          characterRendering: "refined-proportions-grounded-shadows",\n          wallMotion: "individual-anticipation-staggered-jump-head-arm-reaction-offset-landing",'
);
files.app = files.app.replace(
  '        window.__footballLabReleaseV388 = release;',
  '        window.__footballLabReleaseV388 = release;\n        window.__footballLabReleaseV390 = release;'
);
files.sw = files.sw.replace('// Football Lab V38.8 cinematic payoff cache reset', '// Football Lab V39 character motion cache reset');
files.sw = files.sw.replace('football-lab-shell-v38-8-0', 'football-lab-shell-v39-0-0');
files.sw = files.sw.replace('./app.js?v=38.8.0', './app.js?v=39.0.0');

for (const [key, path] of Object.entries(paths)) fs.writeFileSync(path, files[key]);
console.log('Applied Football Lab V39 character and wall motion overhaul');
