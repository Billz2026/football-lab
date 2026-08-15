import { clamp, lerp, WORLD, state, ctx, canvasView, easeInOutCubic, easeOutCubic } from "./core-v6.js?v=32.4";
import { buildCamera, kickerWorld, ballWorld } from "./world-v7.js?v=32.4";
import { projectedHeight, projectWorld } from "./projection-v6.js?v=32.4";
import { activeCharacter } from "./characters-v13.js?v=32.4";
import { outfieldVisualProfileV42 } from "./character-profiles-v42.js?v=42.1.0";

const BUILD = "42.1.0";
const VIEW = { width: WORLD.width, height: WORLD.height };
const TAU = Math.PI * 2;
const P = (x, y) => ({ x, y });
const smooth = (value) => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => P(lerp(a.x, b.x, t), lerp(a.y, b.y, t));

function transform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function progress(time) {
  if (!state.animation) return { elapsed: 0, run: 0, contact: 0, flight: 0, settle: 0, replay: false };
  const a = state.animation;
  const runMs = Math.max(1, a.runUpDuration || 1);
  const holdMs = Math.max(0, a.contactHoldDuration || 0);
  const flightMs = Math.max(1, a.flightDuration || 1);
  const settleMs = Math.max(1, a.settleDuration || 1);
  const elapsed = time - a.startedAt;
  const flightStart = runMs + holdMs;
  return {
    elapsed,
    run: clamp(elapsed / runMs, 0, 1),
    contact: holdMs ? clamp((elapsed - runMs) / holdMs, 0, 1) : 0,
    flight: clamp((elapsed - flightStart) / flightMs, 0, 1),
    settle: clamp((elapsed - flightStart - flightMs) / settleMs, 0, 1),
    replay: Boolean(a.isReplay)
  };
}

function frameCamera(time) {
  const camera = buildCamera(state.currentStage);
  const p = progress(time);
  if (p.flight > 0) {
    const followCamera = easeOutCubic(p.flight) * 0.42;
    camera.position.z -= followCamera;
    camera.position.y -= followCamera * 0.05;
    camera.target.y += followCamera * 0.06;
  }
  return camera;
}

const idle = {
  phase: "idle", crouch: .022, pelvisX: 0, chestX: 0, lean: -.01, rotate: 0, shoulder: 0,
  lk: P(-.087, -.205), rk: P(.087, -.205), la: P(-.105, -.012), ra: P(.105, -.012),
  lt: P(-.155, -.004), rt: P(.155, -.004), le: P(-.17, -.515), re: P(.17, -.515),
  lh: P(-.205, -.37), rh: P(.205, -.37)
};
const step = {
  phase: "final-step", crouch: .06, pelvisX: .012, chestX: -.022, lean: -.105, rotate: -.03, shoulder: -.02,
  lk: P(-.145, -.18), rk: P(.145, -.255), la: P(-.215, -.008), ra: P(.195, -.12),
  lt: P(-.275, -.004), rt: P(.265, -.09), le: P(-.245, -.535), re: P(.245, -.575),
  lh: P(-.305, -.42), rh: P(.305, -.46)
};
const windup = {
  phase: "wind-up", crouch: .082, pelvisX: .024, chestX: -.045, lean: -.16, rotate: -.05, shoulder: -.04,
  lk: P(-.155, -.17), rk: P(.19, -.315), la: P(-.22, -.008), ra: P(.23, -.205),
  lt: P(-.285, -.004), rt: P(.3, -.17), le: P(-.285, -.535), re: P(.285, -.605),
  lh: P(-.35, -.395), rh: P(.355, -.505)
};
const contact = {
  phase: "contact", crouch: .055, pelvisX: -.004, chestX: .04, lean: -.03, rotate: .04, shoulder: .047,
  lk: P(-.155, -.17), rk: P(.052, -.25), la: P(-.218, -.008), ra: P(-.026, -.245),
  lt: P(-.285, -.004), rt: P(-.105, -.22), le: P(-.278, -.475), re: P(.305, -.535),
  lh: P(-.345, -.35), rh: P(.37, -.42)
};
const follow = {
  phase: "follow-through", crouch: .03, pelvisX: -.03, chestX: .067, lean: .085, rotate: .08, shoulder: .068,
  lk: P(-.12, -.18), rk: P(-.04, -.31), la: P(-.195, -.008), ra: P(-.2, -.33),
  lt: P(-.26, -.004), rt: P(-.3, -.3), le: P(-.22, -.415), re: P(.275, -.475),
  lh: P(-.27, -.29), rh: P(.355, -.37)
};
const recoverStep = {
  phase: "recovery-step", crouch: .042, pelvisX: -.022, chestX: .024, lean: .028, rotate: .03, shoulder: .016,
  lk: P(-.125, -.19), rk: P(.025, -.22), la: P(-.19, -.008), ra: P(.095, -.02),
  lt: P(-.255, -.004), rt: P(.165, -.005), le: P(-.205, -.465), re: P(.225, -.485),
  lh: P(-.255, -.35), rh: P(.285, -.39)
};
const neutral = { ...idle, phase: "recovery-neutral", crouch: .027, lean: 0, rotate: .004 };

function blend(a, b, t, phase = b.phase) {
  const joint = (key) => mix(a[key], b[key], t);
  return {
    phase,
    crouch: lerp(a.crouch, b.crouch, t), pelvisX: lerp(a.pelvisX, b.pelvisX, t), chestX: lerp(a.chestX, b.chestX, t),
    lean: lerp(a.lean, b.lean, t), rotate: lerp(a.rotate, b.rotate, t), shoulder: lerp(a.shoulder, b.shoulder, t),
    lk: joint("lk"), rk: joint("rk"), la: joint("la"), ra: joint("ra"), lt: joint("lt"), rt: joint("rt"),
    le: joint("le"), re: joint("re"), lh: joint("lh"), rh: joint("rh")
  };
}

function runPose(run, time, profile) {
  if (run < .56) {
    const t = run / .56;
    const s = Math.sin(t * Math.PI * 4.5 * (profile.motion.stride || 1));
    const leftLift = Math.max(0, s);
    const rightLift = Math.max(0, -s);
    return {
      phase: "approach", crouch: .028 + Math.abs(s) * .018, pelvisX: s * .016, chestX: -s * .011,
      lean: -.042 - t * (.07 + profile.motion.aggression * .012), rotate: s * .018, shoulder: -s * .022,
      lk: P(-.095 - s * .077, -.205 - leftLift * .07), rk: P(.095 + s * .077, -.205 - rightLift * .07),
      la: P(-.118 - s * .105, -.012 - leftLift * .04), ra: P(.118 + s * .105, -.012 - rightLift * .04),
      lt: P(-.16 - s * .11, -.004 - leftLift * .03), rt: P(.16 + s * .11, -.004 - rightLift * .03),
      le: P(-.18 + s * .052, -.52 - s * .023), re: P(.18 + s * .052, -.52 + s * .023),
      lh: P(-.225 + s * .074, -.375 - s * .038), rh: P(.225 + s * .074, -.375 + s * .038),
      breathe: Math.sin(time / 480) * .003
    };
  }
  if (run < .72) return blend(runPose(.559, time, profile), step, smooth((run - .56) / .16));
  if (run < .9) return blend(step, windup, smooth((run - .72) / .18));
  return blend(windup, contact, smooth((run - .9) / .1));
}

function personalisePose(source, profile) {
  const aggression = profile.motion.aggression || 0;
  const followBoost = profile.motion.followThrough || 1;
  const plantBoost = profile.motion.plant || 1;
  const phase = source.phase || "idle";
  const result = {
    ...source,
    crouch: source.crouch * (0.98 + aggression * .07),
    lean: source.lean * (0.98 + aggression * .09),
    rotate: source.rotate * (/follow|recovery-step/.test(phase) ? followBoost : 1),
    shoulder: source.shoulder * (0.98 + aggression * .07),
    lk: { ...source.lk }, rk: { ...source.rk }, la: { ...source.la }, ra: { ...source.ra },
    lt: { ...source.lt }, rt: { ...source.rt }, le: { ...source.le }, re: { ...source.re },
    lh: { ...source.lh }, rh: { ...source.rh }
  };
  if (/final-step|wind-up|contact/.test(phase)) {
    result.la.x *= plantBoost;
    result.lt.x *= plantBoost;
  }
  return result;
}

function currentPose(p, time, profile) {
  let pose;
  if (!state.animation) pose = { ...idle, crouch: idle.crouch + Math.sin(time / 520) * .006 };
  else if (p.replay) {
    if (p.flight < .22) pose = blend(contact, follow, smooth(p.flight / .22));
    else if (p.flight < .5) pose = { ...follow, phase: "follow-through-hold" };
    else if (p.flight < .84) pose = blend(follow, recoverStep, smooth((p.flight - .5) / .34));
    else pose = blend(recoverStep, neutral, smooth((p.flight - .84) / .16));
  } else if (p.contact > 0 && p.flight <= 0) pose = contact;
  else if (p.flight > 0 || p.settle > 0) {
    if (p.flight < .22) pose = blend(contact, follow, smooth(p.flight / .22));
    else if (p.flight < .48) pose = { ...follow, phase: "follow-through-hold" };
    else if (p.flight < .84) pose = blend(follow, recoverStep, smooth((p.flight - .48) / .36));
    else pose = blend(recoverStep, neutral, Math.max(smooth((p.flight - .84) / .16), p.settle));
  } else pose = runPose(p.run, time, profile);
  return personalisePose(pose, profile);
}

function travel(p) {
  if (!state.animation) return 0;
  if (p.replay) return 1;
  return easeInOutCubic(clamp(p.run / .72, 0, 1));
}

function softLimb(a, b, widthA, widthB, colourA, colourB, highlight = .12) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const bend = Math.min(widthA, widthB) * .13;
  const buildPath = (pad = 0) => {
    ctx.beginPath();
    ctx.moveTo(a.x + nx * (widthA * .5 + pad), a.y + ny * (widthA * .5 + pad));
    ctx.bezierCurveTo(
      a.x + dx * .28 + nx * bend, a.y + dy * .28 + ny * bend,
      a.x + dx * .72 + nx * bend * .35, a.y + dy * .72 + ny * bend * .35,
      b.x + nx * (widthB * .5 + pad), b.y + ny * (widthB * .5 + pad)
    );
    ctx.quadraticCurveTo(b.x + dx * .025, b.y + dy * .025, b.x - nx * (widthB * .5 + pad), b.y - ny * (widthB * .5 + pad));
    ctx.bezierCurveTo(
      a.x + dx * .72 - nx * bend * .25, a.y + dy * .72 - ny * bend * .25,
      a.x + dx * .28 - nx * bend * .65, a.y + dy * .28 - ny * bend * .65,
      a.x - nx * (widthA * .5 + pad), a.y - ny * (widthA * .5 + pad)
    );
    ctx.closePath();
  };
  buildPath(Math.max(.8, Math.min(widthA, widthB) * .08));
  ctx.fillStyle = "rgba(1,6,8,.32)";
  ctx.fill();
  buildPath();
  const gradient = ctx.createLinearGradient(a.x - nx * widthA, a.y - ny * widthA, a.x + nx * widthA, a.y + ny * widthA);
  gradient.addColorStop(0, colourB);
  gradient.addColorStop(.45, colourA);
  gradient.addColorStop(.8, colourA);
  gradient.addColorStop(1, colourB);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = highlight;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(.7, Math.min(widthA, widthB) * .055);
  ctx.beginPath();
  ctx.moveTo(a.x + nx * widthA * .22, a.y + ny * widthA * .22);
  ctx.lineTo(b.x + nx * widthB * .18, b.y + ny * widthB * .18);
  ctx.stroke();
  ctx.restore();
}

function skinJoint(point, radius, profile) {
  const g = ctx.createRadialGradient(point.x - radius * .25, point.y - radius * .28, 1, point.x, point.y, radius);
  g.addColorStop(0, profile.skin.light);
  g.addColorStop(.7, profile.skin.base);
  g.addColorStop(1, profile.skin.shadow);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(point.x, point.y, radius, radius * .82, 0, 0, TAU);
  ctx.fill();
}

function drawBoot(ankle, toe, width, profile) {
  const dx = toe.x - ankle.x;
  const dy = toe.y - ankle.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const heel = mix(ankle, toe, .02);
  const front = mix(ankle, toe, 1.13);
  const half = width * .43;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse((heel.x + front.x) * .5, (heel.y + front.y) * .5 + width * .2, length * .55, width * .27, Math.atan2(dy, dx), 0, TAU);
  ctx.fill();
  const g = ctx.createLinearGradient(heel.x, heel.y, front.x, front.y);
  g.addColorStop(0, profile.boots.secondary);
  g.addColorStop(.34, profile.boots.base);
  g.addColorStop(.78, profile.boots.base);
  g.addColorStop(1, profile.boots.secondary);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(heel.x + nx * half, heel.y + ny * half);
  ctx.quadraticCurveTo(front.x + nx * half * .76, front.y + ny * half * .76, front.x + nx * half * .42, front.y + ny * half * .42);
  ctx.lineTo(front.x - nx * half * .55, front.y - ny * half * .55);
  ctx.quadraticCurveTo(heel.x - nx * half, heel.y - ny * half, heel.x - nx * half, heel.y - ny * half);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = profile.boots.accent;
  ctx.lineWidth = Math.max(1, width * .085);
  const stripeA = mix(heel, front, .36);
  const stripeB = mix(heel, front, .72);
  ctx.beginPath();
  ctx.moveTo(stripeA.x - nx * half * .38, stripeA.y - ny * half * .38);
  ctx.lineTo(stripeB.x - nx * half * .27, stripeB.y - ny * half * .27);
  ctx.stroke();
  ctx.restore();
}

function drawShorts(pelvis, leftHip, rightHip, leftKnee, rightKnee, h, profile) {
  const body = profile.body;
  const topY = pelvis.y - h * .058;
  const hemY = pelvis.y + h * .082;
  const halfWaist = h * .074 * body.waist;
  const outer = h * .105 * body.thigh;
  const inner = h * .025;
  const g = ctx.createLinearGradient(pelvis.x - outer, topY, pelvis.x + outer, hemY);
  g.addColorStop(0, profile.kit.shorts);
  g.addColorStop(.48, profile.kit.shortsLight || profile.kit.shorts);
  g.addColorStop(1, profile.kit.shorts);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(pelvis.x - halfWaist, topY);
  ctx.quadraticCurveTo(pelvis.x, topY - h * .01, pelvis.x + halfWaist, topY);
  ctx.lineTo(rightHip.x + outer * .62, hemY);
  ctx.lineTo(pelvis.x + inner, hemY + h * .008);
  ctx.lineTo(pelvis.x, pelvis.y + h * .035);
  ctx.lineTo(pelvis.x - inner, hemY + h * .008);
  ctx.lineTo(leftHip.x - outer * .62, hemY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = Math.max(.8, h * .0045);
  ctx.beginPath();
  ctx.moveTo(pelvis.x - halfWaist * .88, topY + h * .008);
  ctx.lineTo(pelvis.x + halfWaist * .88, topY + h * .008);
  ctx.stroke();
}

function drawTorso(chest, pelvis, h, pose, profile) {
  const body = profile.body;
  const shoulder = h * .115 * body.shoulder;
  const waist = h * .073 * body.waist;
  const topY = chest.y - h * .04;
  const bottomY = pelvis.y + h * .038;
  const skew = pose.lean * h * .12;
  const leftShoulder = P(chest.x - shoulder, chest.y + pose.shoulder * h + h * .002);
  const rightShoulder = P(chest.x + shoulder, chest.y - pose.shoulder * h + h * .002);
  const g = ctx.createLinearGradient(chest.x - shoulder, topY, chest.x + shoulder, bottomY);
  g.addColorStop(0, profile.kit.shirtShadow);
  g.addColorStop(.22, profile.kit.shirt);
  g.addColorStop(.5, profile.kit.shirtLight || profile.kit.shirt);
  g.addColorStop(.78, profile.kit.shirt);
  g.addColorStop(1, profile.kit.shirtShadow);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.22)";
  ctx.shadowBlur = Math.max(1.5, h * .012);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(leftShoulder.x + h * .012, leftShoulder.y);
  ctx.quadraticCurveTo(chest.x - shoulder * .55, topY - h * .018, chest.x - h * .035, topY - h * .022);
  ctx.quadraticCurveTo(chest.x, topY - h * .032, chest.x + h * .035, topY - h * .022);
  ctx.quadraticCurveTo(chest.x + shoulder * .55, topY - h * .018, rightShoulder.x - h * .012, rightShoulder.y);
  ctx.quadraticCurveTo(chest.x + shoulder * 1.02, chest.y + h * .055, pelvis.x + waist + skew, bottomY);
  ctx.quadraticCurveTo(pelvis.x, bottomY + h * .014, pelvis.x - waist + skew, bottomY);
  ctx.quadraticCurveTo(chest.x - shoulder * 1.02, chest.y + h * .055, leftShoulder.x + h * .012, leftShoulder.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = profile.kit.collar || profile.kit.trim;
  ctx.lineWidth = Math.max(1, h * .007);
  ctx.beginPath();
  ctx.moveTo(chest.x - h * .029, topY - h * .012);
  ctx.quadraticCurveTo(chest.x, topY + h * .018, chest.x + h * .029, topY - h * .012);
  ctx.stroke();

  const centre = mix(chest, pelvis, .5);
  ctx.fillStyle = profile.kit.collar || profile.kit.trim;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `750 ${Math.max(5.5, h * .03)}px system-ui`;
  ctx.fillText(profile.displayName.split(" ").at(-1).slice(0, 10), centre.x + skew * .25, centre.y - h * .038);
  ctx.font = `900 ${Math.max(9, h * .078)}px system-ui`;
  ctx.fillText(String(profile.number), centre.x + skew * .3, centre.y + h * .022);
}

function drawBackHead(head, h, profile) {
  const shape = profile.face.shape;
  const jawFactor = profile.face.jaw || 1;
  const headScale = profile.body.head || 1;
  const rx = h * .052 * headScale * (shape === "broad-brow" ? 1.06 : shape === "angular" ? .96 : 1);
  const ry = h * .066 * headScale;
  const neckWidth = h * .038 * (profile.body.chest || 1);
  const neckTop = P(head.x, head.y + ry * .55);
  const neckBottom = P(head.x, head.y + ry * 1.35);
  softLimb(neckTop, neckBottom, neckWidth * .82, neckWidth, profile.skin.base, profile.skin.shadow, .06);

  ctx.fillStyle = profile.skin.shadow;
  ctx.beginPath(); ctx.ellipse(head.x - rx * .92, head.y + ry * .03, rx * .15, ry * .25, -.08, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(head.x + rx * .92, head.y + ry * .03, rx * .15, ry * .25, .08, 0, TAU); ctx.fill();

  const skin = ctx.createRadialGradient(head.x - rx * .2, head.y - ry * .3, 1, head.x, head.y, ry * 1.1);
  skin.addColorStop(0, profile.skin.light);
  skin.addColorStop(.62, profile.skin.base);
  skin.addColorStop(1, profile.skin.shadow);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(head.x - rx * .7, head.y - ry * .72);
  ctx.quadraticCurveTo(head.x - rx, head.y - ry * .08, head.x - rx * (.72 + (jawFactor - 1) * .45), head.y + ry * .48);
  ctx.quadraticCurveTo(head.x - rx * .34, head.y + ry * .92, head.x, head.y + ry);
  ctx.quadraticCurveTo(head.x + rx * .34, head.y + ry * .92, head.x + rx * (.72 + (jawFactor - 1) * .45), head.y + ry * .48);
  ctx.quadraticCurveTo(head.x + rx, head.y - ry * .08, head.x + rx * .7, head.y - ry * .72);
  ctx.quadraticCurveTo(head.x, head.y - ry * 1.0, head.x - rx * .7, head.y - ry * .72);
  ctx.closePath();
  ctx.fill();

  const hairG = ctx.createLinearGradient(head.x - rx, head.y - ry, head.x + rx, head.y);
  hairG.addColorStop(0, profile.hair.shadow);
  hairG.addColorStop(.46, profile.hair.base);
  hairG.addColorStop(1, profile.hair.light);
  ctx.fillStyle = hairG;
  const volume = profile.hair.volume || 1;
  const top = head.y - ry * .91 * volume;
  ctx.beginPath();
  if (profile.hair.style === "textured-crop") {
    ctx.moveTo(head.x - rx * .84, head.y - ry * .02);
    ctx.quadraticCurveTo(head.x - rx * .75, top + ry * .18, head.x - rx * .43, top + ry * .02);
    ctx.quadraticCurveTo(head.x - rx * .18, top - ry * .13, head.x + rx * .02, top + ry * .01);
    ctx.quadraticCurveTo(head.x + rx * .25, top - ry * .11, head.x + rx * .48, top + ry * .03);
    ctx.quadraticCurveTo(head.x + rx * .8, top + ry * .2, head.x + rx * .82, head.y - ry * .01);
  } else if (profile.hair.style === "sharp-textured") {
    ctx.moveTo(head.x - rx * .83, head.y - ry * .01);
    ctx.lineTo(head.x - rx * .65, top + ry * .14);
    ctx.lineTo(head.x - rx * .38, top - ry * .05);
    ctx.lineTo(head.x - rx * .08, top + ry * .01);
    ctx.lineTo(head.x + rx * .22, top - ry * .1);
    ctx.lineTo(head.x + rx * .52, top + ry * .02);
    ctx.lineTo(head.x + rx * .82, head.y - ry * .01);
  } else if (profile.hair.style === "refined-swept") {
    ctx.moveTo(head.x - rx * .83, head.y - ry * .01);
    ctx.quadraticCurveTo(head.x - rx * .72, top + ry * .06, head.x - rx * .15, top - ry * .1);
    ctx.quadraticCurveTo(head.x + rx * .33, top - ry * .2, head.x + rx * .76, top + ry * .08);
    ctx.lineTo(head.x + rx * .82, head.y - ry * .01);
  } else {
    ctx.moveTo(head.x - rx * .82, head.y - ry * .01);
    ctx.quadraticCurveTo(head.x - rx * .65, top + ry * .11, head.x, top + ry * .03);
    ctx.quadraticCurveTo(head.x + rx * .65, top + ry * .11, head.x + rx * .82, head.y - ry * .01);
  }
  ctx.quadraticCurveTo(head.x + rx * .55, head.y + ry * .35, head.x, head.y + ry * .43);
  ctx.quadraticCurveTo(head.x - rx * .55, head.y + ry * .35, head.x - rx * .84, head.y - ry * .02);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = profile.hair.light;
  ctx.globalAlpha = .16;
  ctx.lineWidth = Math.max(.7, h * .0035);
  ctx.beginPath();
  ctx.moveTo(head.x - rx * .42, top + ry * .17);
  ctx.quadraticCurveTo(head.x, top + ry * .02, head.x + rx * .42, top + ry * .16);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawHand(point, h, profile, angle = 0) {
  const radius = h * .018;
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle);
  const g = ctx.createRadialGradient(-radius * .25, -radius * .28, 1, 0, 0, radius);
  g.addColorStop(0, profile.skin.light);
  g.addColorStop(.65, profile.skin.base);
  g.addColorStop(1, profile.skin.shadow);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * .68, radius, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function impactFx(time, p, camera) {
  if (!state.animation || p.replay) return;
  const when = (state.animation.runUpDuration || 0) + (state.animation.contactHoldDuration || 0);
  const delta = p.elapsed - when;
  if (delta < -35 || delta > 145) return;
  const ball = projectWorld(ballWorld(state.currentStage), camera, VIEW);
  if (!ball.visible) return;
  const strength = 1 - clamp((delta + 35) / 180, 0, 1);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(232,193,56,${.8 * strength})`;
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 7 + (1 - strength) * 20, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawCharacter(world, pose, time, character, profile, p) {
  const camera = frameCamera(time);
  const projection = projectedHeight(world, 1.88 * (profile.body.height || 1), camera, VIEW);
  if (!projection) return;
  const h = projection.height;
  const foot = projection.foot;
  const body = profile.body;

  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(pose.rotate || 0);

  const pelvis = P(pose.pelvisX * h, -.365 * h + pose.crouch * h * .07);
  const chest = P(pose.chestX * h, -.67 * h + pose.crouch * h * .08);
  const shoulderHalf = h * .112 * body.shoulder;
  const hipHalf = h * .066 * body.waist;
  const shoulderTilt = pose.shoulder * h;
  const leftShoulder = P(chest.x - shoulderHalf, chest.y + h * .013 + shoulderTilt);
  const rightShoulder = P(chest.x + shoulderHalf, chest.y + h * .013 - shoulderTilt);
  const leftHip = P(pelvis.x - hipHalf, pelvis.y);
  const rightHip = P(pelvis.x + hipHalf, pelvis.y);
  const q = (point) => P(point.x * h, point.y * h);
  const leftKnee = q(pose.lk), rightKnee = q(pose.rk), leftAnkle = q(pose.la), rightAnkle = q(pose.ra);
  const leftToe = q(pose.lt), rightToe = q(pose.rt), leftElbow = q(pose.le), rightElbow = q(pose.re);
  const leftHand = q(pose.lh), rightHand = q(pose.rh);
  const head = P(chest.x + pose.lean * h * .017, chest.y - h * .145);

  ctx.fillStyle = "rgba(0,0,0,.2)";
  ctx.beginPath();
  ctx.ellipse(0, 5, h * (pose.phase.includes("follow") ? .2 : .17), h * .032, -pose.rotate * .15, 0, TAU);
  ctx.fill();

  const thighWidth = Math.max(6, h * .058 * body.thigh);
  const kneeWidth = Math.max(5, h * .047 * body.thigh);
  const calfWidth = Math.max(4.5, h * .043 * body.calf);
  const leftShortHem = mix(leftHip, leftKnee, .27);
  const rightShortHem = mix(rightHip, rightKnee, .27);
  const leftSockTop = mix(leftKnee, leftAnkle, .37);
  const rightSockTop = mix(rightKnee, rightAnkle, .37);

  softLimb(leftHip, leftShortHem, thighWidth * 1.02, thighWidth * .98, profile.kit.shorts, profile.kit.shortsLight || profile.kit.shorts, .08);
  softLimb(rightHip, rightShortHem, thighWidth * 1.02, thighWidth * .98, profile.kit.shorts, profile.kit.shortsLight || profile.kit.shorts, .08);
  softLimb(leftShortHem, leftKnee, thighWidth * .88, kneeWidth, profile.skin.base, profile.skin.shadow, .11);
  softLimb(rightShortHem, rightKnee, thighWidth * .88, kneeWidth, profile.skin.base, profile.skin.shadow, .11);
  skinJoint(leftKnee, kneeWidth * .42, profile);
  skinJoint(rightKnee, kneeWidth * .42, profile);
  softLimb(leftKnee, leftSockTop, kneeWidth * .88, calfWidth * 1.04, profile.skin.base, profile.skin.shadow, .1);
  softLimb(rightKnee, rightSockTop, kneeWidth * .88, calfWidth * 1.04, profile.skin.base, profile.skin.shadow, .1);
  softLimb(leftSockTop, leftAnkle, calfWidth * 1.04, calfWidth * .76, profile.kit.socks, "#d8dfdc", .18);
  softLimb(rightSockTop, rightAnkle, calfWidth * 1.04, calfWidth * .76, profile.kit.socks, "#d8dfdc", .18);
  ctx.strokeStyle = profile.kit.trim;
  ctx.lineWidth = Math.max(1, h * .007);
  for (const sockTop of [leftSockTop, rightSockTop]) {
    ctx.beginPath();
    ctx.moveTo(sockTop.x - h * .021, sockTop.y);
    ctx.lineTo(sockTop.x + h * .021, sockTop.y);
    ctx.stroke();
  }
  drawBoot(leftAnkle, leftToe, thighWidth * .72, profile);
  drawBoot(rightAnkle, rightToe, thighWidth * .72, profile);

  drawShorts(pelvis, leftHip, rightHip, leftKnee, rightKnee, h, profile);

  const upperArmWidth = Math.max(4.5, h * .043 * body.chest);
  const leftSleeveEnd = mix(leftShoulder, leftElbow, .24);
  const rightSleeveEnd = mix(rightShoulder, rightElbow, .24);
  softLimb(leftShoulder, leftSleeveEnd, upperArmWidth * 1.12, upperArmWidth, profile.kit.shirt, profile.kit.shirtShadow, .12);
  softLimb(rightShoulder, rightSleeveEnd, upperArmWidth * 1.12, upperArmWidth, profile.kit.shirt, profile.kit.shirtShadow, .12);
  softLimb(leftSleeveEnd, leftElbow, upperArmWidth * .74, upperArmWidth * .6, profile.skin.base, profile.skin.shadow, .11);
  softLimb(rightSleeveEnd, rightElbow, upperArmWidth * .74, upperArmWidth * .6, profile.skin.base, profile.skin.shadow, .11);
  softLimb(leftElbow, leftHand, upperArmWidth * .58, upperArmWidth * .43, profile.skin.base, profile.skin.shadow, .11);
  softLimb(rightElbow, rightHand, upperArmWidth * .58, upperArmWidth * .43, profile.skin.base, profile.skin.shadow, .11);

  drawTorso(chest, pelvis, h, pose, profile);
  drawHand(leftHand, h, profile, -.12);
  drawHand(rightHand, h, profile, .12);
  drawBackHead(head, h, profile);
  ctx.restore();

  window.__footballLabMotionSnapshotV42 = {
    build: BUILD,
    character: profile.id,
    phase: pose.phase,
    run: p.run,
    flight: p.flight,
    plantLocked: Boolean(state.animation && !p.replay && p.run >= .72),
    travel: travel(p),
    world: { x: world.x, y: world.y, z: world.z },
    bodyRotation: pose.rotate,
    torsoLean: pose.lean
  };
  transform();
  impactFx(time, p, camera);
}

export function drawHeroCharacterV42(time) {
  if (["stage", "breakdown"].includes(state.presentation?.phase)) return;
  const character = activeCharacter();
  const profile = outfieldVisualProfileV42(character.id);
  const p = progress(time);
  const world = kickerWorld(state.currentStage, travel(p));
  transform();
  drawCharacter(world, currentPose(p, time, profile), time, character, profile, p);
  window.__footballLabHeroFrameV42 = {
    build: BUILD,
    character: profile.id,
    sourceCharacterId: character.id,
    active: true,
    time
  };
}

window.__footballLabCharacterRendererV42 = Object.freeze({
  build: BUILD,
  renderer: "layered-2.5d-skeletal",
  artDirection: "premium-stylised-realism",
  rearViewGameplayModel: true,
  modularProfiles: true,
  outfieldCharacters: 4
});
