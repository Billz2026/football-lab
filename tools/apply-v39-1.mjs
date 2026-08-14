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
  if (!text.includes(from)) throw new Error(`V39.1 patch failed: ${label}`);
  return text.replace(from, to);
}

function replaceSection(text, startMarker, endMarker, replacement, label) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`V39.1 patch failed: ${label} start`);
  const end = text.indexOf(endMarker, start);
  if (end < 0) throw new Error(`V39.1 patch failed: ${label} end`);
  return text.slice(0, start) + replacement + text.slice(end);
}

// ---------- Hero kicker: hard root/plant lock, smoother leg path, stronger upper-body counterbalance ----------
const step = `const step = {
  phase: "final-step", crouch: .062, pelvisX: .006, chestX: -.018, lean: -.102, rotate: -.024, shoulder: -.018,
  lk: P(-.16, -.14), rk: P(.145, -.215), la: P(-.21, -.006), ra: P(.19, -.105),
  lt: P(-.268, -.002), rt: P(.245, -.078), le: P(-.272, -.538), re: P(.252, -.575),
  lh: P(-.345, -.46), rh: P(.334, -.5)
};
`;
files.hero = replaceSection(files.hero, 'const step = {', 'const windup = {', step, 'hero locked final step');

const follow = `const follow = {
  phase: "follow-through", crouch: .034, pelvisX: -.026, chestX: .082, lean: .068, rotate: .062, shoulder: .09,
  lk: P(-.15, -.142), rk: P(-.03, -.265), la: P(-.21, -.006), ra: P(-.135, -.258),
  lt: P(-.268, -.002), rt: P(-.22, -.235), le: P(-.255, -.405), re: P(.31, -.46),
  lh: P(-.34, -.275), rh: P(.425, -.355)
};
const crossStep = {
  phase: "recovery-cross-step", crouch: .044, pelvisX: -.022, chestX: .052, lean: .034, rotate: .036, shoulder: .035,
  lk: P(-.132, -.15), rk: P(.006, -.19), la: P(-.19, -.006), ra: P(-.018, -.035),
  lt: P(-.252, -.002), rt: P(-.085, -.01), le: P(-.225, -.452), re: P(.26, -.48),
  lh: P(-.286, -.332), rh: P(.325, -.39)
};
`;
files.hero = replaceSection(files.hero, 'const follow = {', 'const recover = {', follow, 'hero smoother follow/cross step');

const currentPose = `function currentPose(p, time) {
  if (!state.animation) return { ...idle, crouch: idle.crouch + Math.sin(time / 520) * .007 };
  if (p.replay) {
    if (p.flight < .2) return blend(contact, follow, smooth(p.flight / .2));
    if (p.flight < .4) return blend(follow, crossStep, smooth((p.flight - .2) / .2));
    if (p.flight < .72) return blend(crossStep, recover, smooth((p.flight - .4) / .32));
    return blend(recover, neutral, smooth((p.flight - .72) / .28));
  }
  if (p.contact > 0 && p.flight <= 0) return contact;
  if (p.flight > 0 || p.settle > 0) {
    if (p.flight < .18) return blend(contact, follow, smooth(p.flight / .18));
    if (p.flight < .38) return blend(follow, crossStep, smooth((p.flight - .18) / .2));
    if (p.flight < .64) return blend(crossStep, recover, smooth((p.flight - .38) / .26));
    return blend(recover, neutral, Math.max(smooth((p.flight - .64) / .3), p.settle));
  }
  return runPose(p.run, time);
}

`;
files.hero = replaceSection(files.hero, 'function currentPose(p, time) {', 'function travel(p) {', currentPose, 'hero follow timing');

const travel = `function travel(p) {
  if (!state.animation) return 0;
  if (p.replay) return 1;
  // V39.1: the root reaches its final position exactly as the support foot plants.
  const t = clamp(p.run / .73, 0, 1);
  if (t < .62) return smooth(t / .62) * .54;
  return .54 + easeOutCubic((t - .62) / .38) * .46;
}

`;
files.hero = replaceSection(files.hero, 'function travel(p) {', 'function copyPose(base) {', travel, 'hero root plant lock');

files.hero = replaceOnce(
  files.hero,
  `    if (p.flight > 0 && p.flight < .34) {
      pose.ra.x -= .045 * release;
      pose.ra.y -= .025 * release;
      pose.rt.x -= .06 * release;
      pose.chestX += .018 * release;
    }`,
  `    if (p.flight > 0 && p.flight < .34) {
      pose.ra.x -= .02 * release;
      pose.ra.y -= .012 * release;
      pose.rt.x -= .028 * release;
      pose.chestX += .014 * release;
      pose.shoulder += .018 * release;
    }`,
  'power specialist excessive cross-body leg'
);

files.hero = replaceOnce(
  files.hero,
  '  const groundedPhase = ["final-step", "wind-up", "hip-drive", "lower-leg-snap", "contact"].includes(pose.phase);',
  '  const groundedPhase = ["final-step", "wind-up", "hip-drive", "lower-leg-snap", "contact", "follow-through"].includes(pose.phase);',
  'hero grounded follow phase'
);
files.hero = replaceOnce(
  files.hero,
  '  if (["final-step", "wind-up", "hip-drive", "lower-leg-snap", "contact"].includes(pose.phase)) { ctx.fillStyle = "rgba(12,45,23,.55)"; ctx.beginPath(); ctx.ellipse(la.x, la.y + h * .008, h * .07, h * .017, -.12, 0, TAU); ctx.fill(); }',
  '  if (["final-step", "wind-up", "hip-drive", "lower-leg-snap", "contact", "follow-through"].includes(pose.phase)) { ctx.fillStyle = "rgba(10,39,20,.62)"; ctx.beginPath(); ctx.ellipse(la.x, la.y + h * .008, h * .072, h * .018, -.12, 0, TAU); ctx.fill(); }',
  'hero plant turf compression'
);
files.hero = replaceOnce(
  files.hero,
  '  window.__footballLabMotionSnapshotV173 = { phase: pose.phase, run: p.run, flight: p.flight, plantLocked: Boolean(state.animation && !p.replay && p.run >= .73), hipDrive: pose.phase === "hip-drive", legSnap: pose.phase === "lower-leg-snap", crossStep: pose.phase === "recovery-cross-step", travel: travel(p), world: { x: world.x, y: world.y, z: world.z }, leftAnkle: { ...pose.la }, rightAnkle: { ...pose.ra }, bodyRotation: pose.rotate, torsoLean: pose.lean, build: "39.0.0" };',
  '  window.__footballLabMotionSnapshotV173 = { phase: pose.phase, run: p.run, flight: p.flight, plantLocked: Boolean(state.animation && !p.replay && p.run >= .73 && p.flight < .18), rootLocked: Boolean(state.animation && !p.replay && p.run >= .73), hipDrive: pose.phase === "hip-drive", legSnap: pose.phase === "lower-leg-snap", crossStep: pose.phase === "recovery-cross-step", shoulderCounterRotation: true, travel: travel(p), world: { x: world.x, y: world.y, z: world.z }, leftAnkle: { ...pose.la }, rightAnkle: { ...pose.ra }, bodyRotation: pose.rotate, torsoLean: pose.lean, build: "39.1.0" };',
  'hero V39.1 motion metadata'
);
files.hero = replaceOnce(
  files.hero,
  'window.__footballLabCharacterMotionV39 = Object.freeze({ build: "39.0.0", approach: "accelerating-short-final-stride", plant: "support-leg-load", strike: "hip-drive-then-lower-leg-snap", followThrough: "cross-body-then-recovery-step", grounded: true });',
  'window.__footballLabCharacterMotionV39 = Object.freeze({ build: "39.1.0", approach: "accelerating-short-final-stride", plant: "root-and-support-foot-locked-through-contact", strike: "hip-drive-then-lower-leg-snap", followThrough: "controlled-cross-body-shoulder-counter-rotation-recovery-step", grounded: true });\nwindow.__footballLabCharacterMotionV391 = window.__footballLabCharacterMotionV39;',
  'hero V39.1 public contract'
);

// ---------- Base articulated rig: actually render shoulder tilt from wall personality ----------
files.base = replaceOnce(
  files.base,
  `  const shoulderHalf = h * 0.118;
  const hipHalf = h * 0.068;
  const leftShoulder = screenPoint(chest.x - shoulderHalf, chest.y + h * 0.015);
  const rightShoulder = screenPoint(chest.x + shoulderHalf, chest.y + h * 0.015);`,
  `  const shoulderHalf = h * 0.118;
  const hipHalf = h * 0.068;
  const shoulderTilt = (pose.shoulderTilt || 0) * h;
  const leftShoulder = screenPoint(chest.x - shoulderHalf, chest.y + h * 0.015 + shoulderTilt);
  const rightShoulder = screenPoint(chest.x + shoulderHalf, chest.y + h * 0.015 - shoulderTilt);`,
  'wall shoulder tilt rendering'
);

const wallPose = `function wallPose(progress, index, count, hit) {
  const centreIndex = (count - 1) / 2;
  const direction = index < centreIndex ? -1 : 1;
  const variant = index % 5;
  const personality = ["brace", "face-guard", "track-ball", "duck-flinch", "late-jump"][variant];
  const idleBias = (variant - 2) * 0.005;
  if (!state.animation) {
    const faceGuard = variant === 1 ? 0.075 : 0;
    const duck = variant === 3 ? 0.014 : 0;
    return {
      personality,
      crouch: 0.025 + (index % 3) * 0.005 + duck,
      pelvisX: idleBias,
      chestX: -idleBias * 0.7,
      headX: direction * (0.007 + variant * 0.0025),
      shoulderTilt: (variant % 2 ? 1 : -1) * 0.011,
      leftHand: { x: -0.1 - variant * 0.006, y: -0.42 - faceGuard },
      rightHand: { x: 0.1 + variant * 0.006, y: -0.42 - faceGuard * 0.7 + (variant === 4 ? 0.025 : 0) }
    };
  }

  const flight = progress.motionFlight;
  const wallProfile = wallForStage(state.stage);
  const modifiers = wallProfile.modifiers;
  const personalityOffset = [-0.016, 0.004, -0.006, 0.014, 0.038][variant];
  const stagger = (index - centreIndex) * modifiers.staggerTiming
    + (index % 2 === 0 ? -modifiers.alternateDelay : modifiers.alternateDelay)
    + personalityOffset;
  const passRatio = clamp(pathRatioAtWall() - modifiers.jumpLead + stagger, 0.1, 0.9);
  const anticipation = smooth01((flight - (passRatio - 0.245)) / 0.15);
  const jumpWindow = Math.max(0.19, modifiers.jumpWindow * (1.4 + variant * 0.035));
  const jump = pulse01((flight - (passRatio - 0.112)) / jumpWindow);
  const landing = pulse01((flight - (passRatio + 0.082 + variant * 0.011)) / (0.29 + variant * 0.017));
  const jumpPattern = modifiers.jumpPattern[index % modifiers.jumpPattern.length] || 1;
  const hitRatio = state.shot.outcome === "WALL" && Number.isInteger(state.shot.collision?.index)
    ? state.shot.collision.index / Math.max(1, state.shot.path.length - 1)
    : passRatio;
  const hitReact = hit ? pulse01((flight - hitRatio) / 0.34) : 0;
  const passReact = pulse01((flight - passRatio) / (0.27 + variant * 0.016)) * (hit ? 0 : 1);
  const headTurn = smooth01(clamp((flight - passRatio) / 0.22, 0, 1));
  const faceGuard = variant === 1 ? anticipation * 0.095 : 0;
  const duck = variant === 3 ? anticipation * 0.04 + Math.max(0, jump) * 0.025 : 0;
  const lateJumpScale = variant === 4 ? 0.86 : 1;
  const trackTurn = headTurn * (variant === 2 ? 1 : variant === 4 ? 0.72 : 0.42);
  const tuck = Math.max(0, jump) * (0.017 + variant * 0.0035);
  const armGuard = [0, 0.055, 0.025, 0.018, 0.012][variant];
  const lateralFlinch = passReact * direction * (0.016 + variant * 0.005);

  return {
    personality,
    crouch: 0.025 + anticipation * 0.112 + landing * (0.09 + variant * 0.009) + duck,
    lift: Math.max(0, jump) * 0.11 * modifiers.jumpMultiplier * jumpPattern * (0.95 + variant * 0.027) * lateJumpScale,
    rotation: hitReact * direction * 0.34 + passReact * direction * (0.04 + variant * 0.011) + trackTurn * direction * 0.022,
    torsoLean: hitReact * direction * 0.11 + lateralFlinch + (variant === 3 ? -duck * 0.8 : 0),
    shoulderTilt: (variant % 2 ? 1 : -1) * (0.011 + anticipation * 0.016) + hitReact * direction * 0.052,
    chestX: hitReact * direction * 0.09 + lateralFlinch,
    headX: direction * (0.006 + trackTurn * (0.03 + variant * 0.004)),
    leftKnee: { x: -0.1 - hitReact * direction * 0.024 - jump * 0.007, y: -0.15 - tuck + landing * 0.034 + duck * 0.24 },
    rightKnee: { x: 0.1 - hitReact * direction * 0.024 + jump * 0.007, y: -0.15 - tuck * 0.84 + landing * 0.034 + duck * 0.24 },
    leftAnkle: { x: -0.13 - jump * 0.005 - landing * (variant % 2 ? 0.008 : 0), y: -0.005 - tuck * 0.42 + landing * 0.012 },
    rightAnkle: { x: 0.13 + jump * 0.005 + landing * (variant % 2 ? 0 : 0.008), y: -0.005 - tuck * 0.36 + landing * 0.012 },
    leftToe: { x: -0.18 - jump * 0.01 - landing * (variant === 2 ? 0.016 : 0), y: -0.002 + landing * 0.006 },
    rightToe: { x: 0.18 + jump * 0.01 + landing * (variant === 4 ? 0.018 : 0), y: -0.002 + landing * 0.006 },
    leftHand: { x: -0.09 - armGuard - hitReact * 0.16 - passReact * (0.024 + variant * 0.007), y: -0.42 - faceGuard - anticipation * (0.014 + variant * 0.007) + hitReact * 0.045 },
    rightHand: { x: 0.09 + armGuard + hitReact * 0.16 + passReact * (0.024 + (4 - variant) * 0.005), y: -0.42 - faceGuard * 0.72 + (variant === 4 ? anticipation * 0.025 : -anticipation * 0.012) - hitReact * 0.025 }
  };
}

`;
files.base = replaceSection(files.base, 'function wallPose(progress, index, count, hit) {', 'function impactRatio() {', wallPose, 'wall individual behaviour pass');

files.base = replaceOnce(
  files.base,
  `    variedPose.headX = ((player.index % 3) - 1) * 0.012;
    variedPose.rotation = (variedPose.rotation || 0) + (player.index % 2 ? 0.012 : -0.01);`,
  `    variedPose.headX = (variedPose.headX || 0) + ((player.index % 3) - 1) * 0.008;
    variedPose.rotation = (variedPose.rotation || 0) + (player.index % 2 ? 0.009 : -0.008);`,
  'preserve wall authored head reactions'
);
files.base = replaceOnce(
  files.base,
  `    individualTiming: true,
    individualHeadAndArmReaction: true,
    staggeredLanding: true,
    jumping: Boolean(state.animation && progress.motionFlight > 0),
    hitPlayer: state.shot?.collision?.playerIndex ?? null,
    build: "39.0.0"`,
  `    individualTiming: true,
    individualHeadAndArmReaction: true,
    shoulderCounterMotion: true,
    behaviourVariants: ["brace", "face-guard", "track-ball", "duck-flinch", "late-jump"],
    staggeredLanding: true,
    jumping: Boolean(state.animation && progress.motionFlight > 0),
    hitPlayer: state.shot?.collision?.playerIndex ?? null,
    build: "39.1.0"`,
  'wall V39.1 metadata'
);

// ---------- Release/cache version chain ----------
for (const key of ["app", "runtime", "bridgeV17", "genV17", "genV15", "bridgeV9"]) {
  files[key] = files[key].replaceAll("39.0.0", "39.1.0");
}
files.app = files.app.replace('// Football Lab V38.8 cinematic goal/save payoff', '// Football Lab V39.1 plant lock and motion cleanup');
files.app = files.app.replace('badge.textContent = "V39";', 'badge.textContent = "V39.1";');
files.app = files.app.replace(
  '          characterMotion: "accelerating-approach-short-final-stride-plant-hip-drive-leg-snap-cross-step",',
  '          characterMotion: "root-locked-plant-hip-drive-leg-snap-controlled-cross-step",\n          plantFootLock: "root-and-support-foot-fixed-through-contact",\n          upperBodyCounterRotation: "shoulder-arm-momentum-through-follow-through",'
);
files.app = files.app.replace(
  '          wallMotion: "individual-anticipation-staggered-jump-head-arm-reaction-offset-landing",',
  '          wallMotion: "five-behaviour-individual-anticipation-jump-head-arm-turn-landing",'
);
files.app = files.app.replace(
  '        window.__footballLabReleaseV390 = release;',
  '        window.__footballLabReleaseV390 = release;\n        window.__footballLabReleaseV391 = release;'
);

files.sw = files.sw.replace('// Football Lab V38.8 cinematic payoff cache reset', '// Football Lab V39.1 plant lock and motion cleanup cache reset');
files.sw = files.sw.replace('football-lab-shell-v38-8-0', 'football-lab-shell-v39-1-0');
files.sw = files.sw.replace('./app.js?v=38.8.0', './app.js?v=39.1.0');

for (const [key, path] of Object.entries(paths)) fs.writeFileSync(path, files[key]);
console.log("Applied Football Lab V39.1 plant lock and motion cleanup");
