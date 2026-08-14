import fs from "node:fs";

const keeperPath = "game/keeper-visuals-v38-1.js";
const appPath = "app.js";
let source = fs.readFileSync(keeperPath, "utf8");

if (!source.includes('const BUILD = "38.1.0";')) throw new Error("Expected V38.1 keeper build marker not found");
source = source.replace('const BUILD = "38.1.0";', 'const BUILD = "38.5.0";');

const keeperStart = source.indexOf("function premiumKeeperState(progress, time) {");
const keeperEnd = source.indexOf("\nfunction screenPoint(x, y) {", keeperStart);
if (keeperStart < 0 || keeperEnd < 0) throw new Error("premiumKeeperState boundaries not found");

const keeperReplacement = String.raw`function premiumKeeperState(progress, time) {
  const profile = keeperForStage(state.stage);
  const plan = state.shot?.keeperPlan;
  const baseIdle = keeperWorld(state.currentStage);
  const baseStart = {
    ...baseIdle,
    z: baseIdle.z + (profile.modifiers?.forwardStart || 0)
  };
  const style = ({
    reflex: { stance: 0.17, idleAmp: 0.068, idleMs: 560, push: 1.13, prepLead: 0.018, reachLead: 0.024, arc: 0.018, trail: 0.04, glove: 0.04 },
    giant: { stance: 0.205, idleAmp: 0.043, idleMs: 900, push: 0.93, prepLead: -0.008, reachLead: -0.006, arc: 0.055, trail: 0.075, glove: 0.025 },
    reader: { stance: 0.18, idleAmp: 0.048, idleMs: 760, push: 1.0, prepLead: 0.04, reachLead: 0.012, arc: 0.025, trail: 0.045, glove: 0.025 },
    aggressive: { stance: 0.175, idleAmp: 0.07, idleMs: 650, push: 1.08, prepLead: 0.022, reachLead: 0.014, arc: 0.016, trail: 0.035, glove: 0.03 },
    academy: { stance: 0.18, idleAmp: 0.058, idleMs: 720, push: 1.0, prepLead: 0, reachLead: 0, arc: 0.02, trail: 0.04, glove: 0.02 }
  })[profile.id] || { stance: 0.18, idleAmp: 0.058, idleMs: 720, push: 1.0, prepLead: 0, reachLead: 0, arc: 0.02, trail: 0.04, glove: 0.02 };

  if (!state.animation || !plan?.contact) {
    const sway = Math.sin(time / style.idleMs) * style.idleAmp;
    const breathe = Math.sin(time / 420) * 0.009;
    const settle = Math.sin(time / (style.idleMs * 0.58)) * 0.012;
    return {
      world: { ...baseStart, x: baseStart.x + sway },
      pose: {
        crouch: 0.115 + breathe,
        torsoLean: settle * 0.18,
        rotation: 0,
        leftKnee: { x: -style.stance, y: -0.135 },
        rightKnee: { x: style.stance, y: -0.135 },
        leftAnkle: { x: -style.stance - 0.045, y: -0.008 },
        rightAnkle: { x: style.stance + 0.045, y: -0.008 },
        leftToe: { x: -style.stance - 0.11, y: 0 },
        rightToe: { x: style.stance + 0.11, y: 0 },
        leftHand: { x: -0.39, y: -0.49 + settle },
        rightHand: { x: 0.39, y: -0.49 - settle },
        gloveScale: 1.02 + style.glove * 0.25,
        motion: "READY",
        saveHeightClass: "SET",
        wrongFooted: false
      }
    };
  }

  const flight = progress.motionFlight;
  const contactPoint = impactRatio();
  const reactionFraction = clamp(
    plan.reaction / Math.max(0.01, plan.flightSeconds || 1),
    0.08,
    0.72
  );
  const committed = plan.start || baseStart;
  const direction = Math.sign(plan.contact.x - baseStart.x || 1);
  const wrongFooted = Boolean(plan.wrongFooted);
  const heightNorm = clamp(Number(plan.contact.y) / GOAL.height, 0, 1);
  const low = smooth01(clamp((0.48 - heightNorm) / 0.34, 0, 1));
  const high = smooth01(clamp((heightNorm - 0.54) / 0.34, 0, 1));
  const mid = clamp(1 - Math.max(low, high), 0, 1);
  const heightClass = high > 0.42 ? "HIGH" : low > 0.42 ? "LOW" : "MID";

  const commit = smooth01(flight / Math.max(0.06, reactionFraction * 0.72));
  const correction = wrongFooted
    ? smooth01((flight - Math.max(0, reactionFraction - 0.1)) / 0.1)
    : 0;
  const committedX = lerp(baseStart.x, committed.x, commit);
  const preLaunchX = wrongFooted
    ? lerp(committedX, baseStart.x + direction * 0.04, correction * 0.82)
    : committedX;
  const coil = smooth01(
    (flight - Math.max(0, reactionFraction - (0.14 + style.prepLead))) / 0.12
  );
  const plant = pulse01((flight - Math.max(0, reactionFraction - 0.105)) / 0.135);
  const push = pulse01((flight - Math.max(0, reactionFraction - 0.025)) / 0.155) * style.push;
  const diveRaw = clamp(
    (flight - reactionFraction) / Math.max(0.1, contactPoint - reactionFraction),
    0,
    1
  );
  const launch = smooth01(diveRaw);
  const landStart = Math.min(0.985, contactPoint + 0.014 + high * 0.024 - low * 0.008);
  const land = smooth01((flight - landStart) / (0.12 + high * 0.04));
  const recovery = smooth01(progress.settle);
  const saveContact = state.shot?.outcome === "SAVE"
    ? smooth01((flight - Math.max(0.1, contactPoint - 0.026)) / 0.052)
    : 0;
  const catchHold = state.shot?.saveType === "CATCH"
    ? smooth01((saveContact - 0.08) / 0.68)
    : 0;
  const parryFollow = state.shot?.saveType === "PARRY"
    ? pulse01((flight - contactPoint) / 0.2)
    : 0;

  const bodyGap = 0.105 + high * 0.115 + low * 0.055 + (profile.id === "giant" ? 0.035 : 0);
  const bodyTargetX = plan.contact.x - direction * bodyGap;
  const arcHeight = Math.max(0.12, 0.22 + mid * 0.18 + high * 0.34 - low * 0.08 + style.arc);
  const arcPulse = Math.sin(clamp(launch, 0, 1) * Math.PI * 0.72);
  const committedZ = Number.isFinite(committed.z) ? committed.z : baseStart.z;
  const world = {
    x: lerp(preLaunchX, bodyTargetX, launch),
    y: Math.max(0, arcPulse * arcHeight + push * (0.045 + high * 0.04)) * (1 - land * 0.96),
    z: lerp(committedZ, plan.contact.z, launch)
  };

  const reach = smooth01(clamp(
    (diveRaw - Math.max(0.02, 0.07 - style.reachLead)) / Math.max(0.72, 0.88 + style.reachLead),
    0,
    1
  ));
  const trailReach = clamp(reach * (0.88 + style.trail), 0, 1);
  const trailOffsetX = 0.34 - high * 0.1 + low * 0.04;
  const trailOffsetY = low * 0.015 - mid * 0.09 - high * 0.17;
  const leadHand = {
    x: lerp(world.x + direction * 0.13, plan.contact.x, reach),
    y: lerp(world.y + 1.28, plan.contact.y, reach),
    z: lerp(world.z, plan.contact.z, reach)
  };
  const trailHand = {
    x: lerp(world.x - direction * 0.1, plan.contact.x - direction * trailOffsetX, trailReach),
    y: lerp(world.y + 1.15, plan.contact.y + trailOffsetY, trailReach),
    z: lerp(world.z + 0.025, plan.contact.z + 0.035, trailReach)
  };
  const absoluteLeftHand = direction > 0 ? trailHand : leadHand;
  const absoluteRightHand = direction > 0 ? leadHand : trailHand;
  let catchBallWorld = null;

  if (state.shot?.saveType === "CATCH" && saveContact > 0) {
    const cup = smooth01(saveContact / 0.42);
    const chestTarget = {
      x: world.x + direction * 0.02,
      y: world.y + 0.99 + high * 0.08 - low * 0.12,
      z: world.z
    };
    for (const hand of [absoluteLeftHand, absoluteRightHand]) {
      hand.x = lerp(hand.x, plan.contact.x, cup * 0.72);
      hand.y = lerp(hand.y, plan.contact.y, cup * 0.72);
      hand.z = lerp(hand.z, plan.contact.z, cup * 0.72);
      hand.x = lerp(hand.x, chestTarget.x, catchHold * 0.86);
      hand.y = lerp(hand.y, chestTarget.y, catchHold * 0.86);
      hand.z = lerp(hand.z, chestTarget.z, catchHold * 0.86);
    }
    catchBallWorld = {
      x: lerp(plan.contact.x, chestTarget.x, catchHold * 0.9),
      y: lerp(plan.contact.y, chestTarget.y, catchHold * 0.9),
      z: lerp(plan.contact.z, chestTarget.z, catchHold * 0.9)
    };
  } else if (parryFollow > 0) {
    const lead = direction > 0 ? absoluteRightHand : absoluteLeftHand;
    lead.x += direction * parryFollow * (0.22 + (profile.id === "reflex" ? 0.07 : 0));
    lead.y += parryFollow * (high * 0.085 + mid * 0.045 - low * 0.018);
    lead.z += parryFollow * 0.025;
  }

  const rotationTarget = direction * (low * 1.38 + mid * 1.1 + high * 0.86);
  const launchRotation = rotationTarget * launch;
  const recoveryTarget = direction * (state.shot?.saveType === "CATCH" ? 0.18 : 0.31);
  const recoveryBlend = Math.max(recovery, land * 0.28);
  const rotation = land > 0
    ? lerp(launchRotation, recoveryTarget, recoveryBlend)
    : launchRotation;

  const stance = style.stance;
  const lateral = direction * launch * (0.065 + low * 0.04);
  const scissor = launch * (0.12 + low * 0.11 + high * 0.035);
  const leftTrail = direction > 0 ? 1 : 0;
  const rightTrail = direction < 0 ? 1 : 0;

  let motion = "SET";
  if (recovery > 0.1) motion = "RECOVER";
  else if (land > 0.22) motion = "LAND";
  else if (state.shot?.saveType === "CATCH" && saveContact > 0.3) motion = "CATCH_SECURE";
  else if (parryFollow > 0.08) motion = "PARRY";
  else if (launch > 0.12) motion = heightClass + "_DIVE";
  else if (plant > 0.18) motion = wrongFooted ? "CORRECT_AND_PLANT" : "PLANT";
  else if (commit > 0.18) motion = wrongFooted ? "WRONG_FOOT_COMMIT" : "READ_SET";

  return {
    world,
    pose: {
      crouch: 0.105 + coil * 0.18 + plant * 0.055 + land * 0.16 + recovery * 0.075 + catchHold * 0.03,
      rotation,
      torsoLean: direction * launch * (0.105 + low * 0.075 - high * 0.018),
      chestX: direction * launch * (0.042 + low * 0.032),
      leftKnee: {
        x: -stance - lateral - direction * push * 0.075,
        y: -0.14 - launch * (0.025 + high * 0.065) + land * 0.065 + (leftTrail ? -plant * 0.018 : plant * 0.025)
      },
      rightKnee: {
        x: stance - lateral + direction * push * 0.075,
        y: -0.14 - launch * (0.02 + high * 0.035) + land * 0.065 + (rightTrail ? -plant * 0.018 : plant * 0.025)
      },
      leftAnkle: {
        x: -stance - 0.045 - direction * launch * (0.16 + low * 0.075) - direction * push * 0.115 - (leftTrail ? scissor * 0.2 : 0),
        y: -0.01 - launch * (leftTrail ? 0.085 + high * 0.05 : 0.018 + low * 0.025) + land * 0.05
      },
      rightAnkle: {
        x: stance + 0.045 - direction * launch * (0.16 + low * 0.075) + direction * push * 0.115 + (rightTrail ? scissor * 0.2 : 0),
        y: -0.01 - launch * (rightTrail ? 0.085 + high * 0.05 : 0.018 + low * 0.025) + land * 0.05
      },
      leftToe: { x: -stance - 0.11 - direction * launch * (0.18 + low * 0.06), y: -0.005 },
      rightToe: { x: stance + 0.11 - direction * launch * (0.18 + low * 0.06), y: -0.005 },
      absoluteLeftHand,
      absoluteRightHand,
      catchBallWorld,
      gloveScale: 1.05 + style.glove + (state.shot?.saveType === "CATCH" ? 0.07 : 0),
      motion,
      recovery,
      saveHeightClass: heightClass,
      wrongFooted,
      archetype: profile.id
    }
  };
}`;

source = source.slice(0, keeperStart) + keeperReplacement + source.slice(keeperEnd);

const ballStart = source.indexOf("function redrawBallOnTop(progress, camera) {");
const ballEnd = source.indexOf("\nfunction renderPremiumKeeper(time) {", ballStart);
if (ballStart < 0 || ballEnd < 0) throw new Error("redrawBallOnTop boundaries not found");

const ballReplacement = String.raw`function redrawBallOnTop(progress, camera, keeper) {
  if (!state.animation || !state.shot?.path?.length || progress.motionFlight <= 0) return;
  let world = sampleShotPath(state.shot.path, progress.motionFlight);
  if (!world) return;
  const impact = impactRatio();
  if (
    state.shot?.outcome === "SAVE"
    && state.shot?.saveType === "CATCH"
    && progress.motionFlight >= impact
    && keeper?.pose?.catchBallWorld
  ) {
    const lock = smooth01((progress.motionFlight - impact) / 0.055);
    const held = keeper.pose.catchBallWorld;
    world = {
      x: lerp(world.x, held.x, lock),
      y: lerp(world.y, held.y, lock),
      z: lerp(world.z, held.z, lock)
    };
  }
  const projected = projectWorld(world, camera, VIEWPORT);
  if (!projected.visible) return;

  const radius = clamp(projected.scale * 0.105, 3.5, 10.2);
  const gradient = ctx.createRadialGradient(
    projected.x - radius * 0.28,
    projected.y - radius * 0.34,
    radius * 0.08,
    projected.x,
    projected.y,
    radius
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "#c7d0c6");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, radius, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "#172019";
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + i * TAU / 5 + progress.motionFlight * 12;
    const x = projected.x + Math.cos(angle) * radius * 0.38;
    const y = projected.y + Math.sin(angle) * radius * 0.38;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}`;

source = source.slice(0, ballStart) + ballReplacement + source.slice(ballEnd);
if (!source.includes("redrawBallOnTop(progress, camera);")) throw new Error("Keeper ball redraw call not found");
source = source.replace("redrawBallOnTop(progress, camera);", "redrawBallOnTop(progress, camera, keeper);");
source = source.replace("Football Lab V38.1 keeper overlay failed", "Football Lab V38.5 keeper overlay failed");
source = source.replace('keeperDiveMotion: "set-push-stretch-land-recover"', 'keeperDiveMotion: "read-commit-correct-plant-push-height-dive-contact-land-recover"');
source = source.replace('cacheGeneration: "38.1"', 'cacheGeneration: "38.5"');
source = source.replace('diveSequence: ["set", "push", "stretch", "contact", "land", "recover"]', 'diveSequence: ["read", "commit", "correct", "plant", "push", "low-mid-high-dive", "contact", "land", "recover"]');
source += '\n\nwindow.__footballLabKeeperVisualsV385 = Object.freeze({ ...window.__footballLabKeeperVisualsV381, build: BUILD, archetypeMotion: true, wrongFootAnimation: true, heightClassifiedDives: true, catchSecureBall: true, parryFollowThrough: true });\n';
fs.writeFileSync(keeperPath, source);

let app = fs.readFileSync(appPath, "utf8");
const oldImport = './game/keeper-visuals-v38-1.js?v=38.1';
if (!app.includes(oldImport)) throw new Error("Keeper visual import not found in app.js");
app = app.replace(oldImport, './game/keeper-visuals-v38-1.js?v=38.5.0');
fs.writeFileSync(appPath, app);

console.log("Applied V38.5 goalkeeper motion source patch");
