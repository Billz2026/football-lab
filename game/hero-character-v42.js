import { clamp, lerp, WORLD, state, ctx, canvasView, easeInOutCubic, easeOutCubic } from "./core-v6.js?v=32.4";
import { buildCamera, kickerWorld, ballWorld } from "./world-v7.js?v=32.4";
import { projectedHeight, projectWorld } from "./projection-v6.js?v=32.4";
import { activeCharacter } from "./characters-v13.js?v=32.4";
import { outfieldVisualProfileV42 } from "./character-profiles-v42.js?v=51.0.0";

const BUILD = "51.1.0";
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
  phase: "final-step", crouch: .052, pelvisX: .012, chestX: -.018, lean: -.09, rotate: -.026, shoulder: -.018,
  lk: P(-.14, -.18), rk: P(.14, -.248), la: P(-.205, -.008), ra: P(.185, -.105),
  lt: P(-.265, -.004), rt: P(.25, -.078), le: P(-.225, -.525), re: P(.225, -.555),
  lh: P(-.28, -.405), rh: P(.28, -.445)
};
const windup = {
  phase: "wind-up", crouch: .07, pelvisX: .022, chestX: -.038, lean: -.135, rotate: -.043, shoulder: -.034,
  lk: P(-.15, -.17), rk: P(.175, -.3), la: P(-.215, -.008), ra: P(.215, -.188),
  lt: P(-.278, -.004), rt: P(.282, -.155), le: P(-.255, -.515), re: P(.255, -.575),
  lh: P(-.31, -.39), rh: P(.315, -.49)
};
const contact = {
  phase: "contact", crouch: .05, pelvisX: -.004, chestX: .035, lean: -.018, rotate: .035, shoulder: .04,
  lk: P(-.15, -.17), rk: P(.045, -.25), la: P(-.212, -.008), ra: P(-.018, -.238),
  lt: P(-.275, -.004), rt: P(-.095, -.215), le: P(-.235, -.472), re: P(.25, -.515),
  lh: P(-.295, -.355), rh: P(.305, -.405)
};
const follow = {
  phase: "follow-through", crouch: .028, pelvisX: -.027, chestX: .055, lean: .068, rotate: .065, shoulder: .052,
  lk: P(-.115, -.18), rk: P(-.012, -.292), la: P(-.19, -.008), ra: P(-.135, -.27),
  lt: P(-.252, -.004), rt: P(-.22, -.245), le: P(-.195, -.42), re: P(.23, -.46),
  lh: P(-.24, -.315), rh: P(.29, -.365)
};
const recoverStep = {
  phase: "recovery-step", crouch: .038, pelvisX: -.02, chestX: .02, lean: .022, rotate: .024, shoulder: .014,
  lk: P(-.12, -.19), rk: P(.025, -.22), la: P(-.18, -.008), ra: P(.09, -.02),
  lt: P(-.245, -.004), rt: P(.16, -.005), le: P(-.195, -.465), re: P(.21, -.48),
  lh: P(-.245, -.35), rh: P(.27, -.385)
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
      phase: "approach", crouch: .027 + Math.abs(s) * .016, pelvisX: s * .015, chestX: -s * .01,
      lean: -.038 - t * (.06 + profile.motion.aggression * .01), rotate: s * .016, shoulder: -s * .018,
      lk: P(-.092 - s * .07, -.205 - leftLift * .065), rk: P(.092 + s * .07, -.205 - rightLift * .065),
      la: P(-.115 - s * .095, -.012 - leftLift * .036), ra: P(.115 + s * .095, -.012 - rightLift * .036),
      lt: P(-.158 - s * .1, -.004 - leftLift * .027), rt: P(.158 + s * .1, -.004 - rightLift * .027),
      le: P(-.175 + s * .045, -.515 - s * .02), re: P(.175 + s * .045, -.515 + s * .02),
      lh: P(-.215 + s * .064, -.38 - s * .032), rh: P(.215 + s * .064, -.38 + s * .032),
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
    crouch: source.crouch * (0.98 + aggression * .06),
    lean: source.lean * (0.98 + aggression * .075),
    rotate: source.rotate * (/follow|recovery-step/.test(phase) ? Math.min(1.12, followBoost) : 1),
    shoulder: source.shoulder * (0.98 + aggression * .06),
    lk: { ...source.lk }, rk: { ...source.rk }, la: { ...source.la }, ra: { ...source.ra },
    lt: { ...source.lt }, rt: { ...source.rt }, le: { ...source.le }, re: { ...source.re },
    lh: { ...source.lh }, rh: { ...source.rh }
  };
  if (/final-step|wind-up|contact/.test(phase)) {
    result.la.x *= Math.min(1.1, plantBoost);
    result.lt.x *= Math.min(1.1, plantBoost);
  }
  return result;
}

function currentPose(p, time, profile) {
  let pose;
  if (!state.animation) pose = { ...idle, crouch: idle.crouch + Math.sin(time / 520) * .005 };
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
  const bend = Math.min(widthA, widthB) * .09;
  const buildPath = (pad = 0) => {
    ctx.beginPath();
    ctx.moveTo(a.x + nx * (widthA * .5 + pad), a.y + ny * (widthA * .5 + pad));
    ctx.bezierCurveTo(
      a.x + dx * .28 + nx * bend, a.y + dy * .28 + ny * bend,
      a.x + dx * .72 + nx * bend * .24, a.y + dy * .72 + ny * bend * .24,
      b.x + nx * (widthB * .5 + pad), b.y + ny * (widthB * .5 + pad)
    );
    ctx.quadraticCurveTo(b.x + dx * .018, b.y + dy * .018, b.x - nx * (widthB * .5 + pad), b.y - ny * (widthB * .5 + pad));
    ctx.bezierCurveTo(
      a.x + dx * .72 - nx * bend * .22, a.y + dy * .72 - ny * bend * .22,
      a.x + dx * .28 - nx * bend * .45, a.y + dy * .28 - ny * bend * .45,
      a.x - nx * (widthA * .5 + pad), a.y - ny * (widthA * .5 + pad)
    );
    ctx.closePath();
  };
  buildPath(Math.max(.7, Math.min(widthA, widthB) * .065));
  ctx.fillStyle = "rgba(1,6,8,.28)";
  ctx.fill();
  buildPath();
  const gradient = ctx.createLinearGradient(a.x - nx * widthA, a.y - ny * widthA, a.x + nx * widthA, a.y + ny * widthA);
  gradient.addColorStop(0, colourB);
  gradient.addColorStop(.42, colourA);
  gradient.addColorStop(.8, colourA);
  gradient.addColorStop(1, colourB);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = highlight;
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(.7, Math.min(widthA, widthB) * .05);
  ctx.beginPath();
  ctx.moveTo(a.x + nx * widthA * .2, a.y + ny * widthA * .2);
  ctx.lineTo(b.x + nx * widthB * .16, b.y + ny * widthB * .16);
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
  ctx.ellipse(point.x, point.y, radius, radius * .88, 0, 0, TAU);
  ctx.fill();
}

function drawBoot(ankle, toe, width, profile) {
  const dx = toe.x - ankle.x;
  const dy = toe.y - ankle.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const heel = mix(ankle, toe, -.02);
  const front = mix(ankle, toe, 1.19);
  const half = width * .52;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse((heel.x + front.x) * .5 + nx * width * .03, (heel.y + front.y) * .5 + ny * width * .03 + width * .16, length * .61, width * .31, angle, 0, TAU);
  ctx.fill();

  const g = ctx.createLinearGradient(heel.x, heel.y, front.x, front.y);
  g.addColorStop(0, profile.boots.secondary);
  g.addColorStop(.24, profile.boots.base);
  g.addColorStop(.76, profile.boots.base);
  g.addColorStop(1, profile.boots.secondary);
  ctx.fillStyle = g;
  ctx.strokeStyle = "rgba(2,7,10,.58)";
  ctx.lineWidth = Math.max(1, width * .07);
  ctx.beginPath();
  ctx.moveTo(heel.x + nx * half * .76, heel.y + ny * half * .76);
  ctx.quadraticCurveTo(heel.x - ux * width * .12 + nx * half, heel.y - uy * width * .12 + ny * half, front.x + nx * half * .62, front.y + ny * half * .62);
  ctx.quadraticCurveTo(front.x + ux * width * .18, front.y + uy * width * .18, front.x - nx * half * .5, front.y - ny * half * .5);
  ctx.quadraticCurveTo(heel.x - nx * half * .84, heel.y - ny * half * .84, heel.x + nx * half * .76, heel.y + ny * half * .76);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = profile.boots.accent;
  ctx.globalAlpha = .82;
  ctx.lineWidth = Math.max(1.1, width * .1);
  const stripeA = mix(heel, front, .38);
  const stripeB = mix(heel, front, .69);
  ctx.beginPath();
  ctx.moveTo(stripeA.x - nx * half * .28, stripeA.y - ny * half * .28);
  ctx.lineTo(stripeB.x - nx * half * .18, stripeB.y - ny * half * .18);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(255,255,255,.14)";
  ctx.lineWidth = Math.max(.8, width * .05);
  ctx.beginPath();
  ctx.moveTo(heel.x + nx * half * .35, heel.y + ny * half * .35);
  ctx.lineTo(front.x + nx * half * .25, front.y + ny * half * .25);
  ctx.stroke();
  ctx.restore();
}

function drawShorts(pelvis, leftHip, rightHip, leftKnee, rightKnee, h, profile) {
  const body = profile.body;
  const topY = pelvis.y - h * .058;
  const hemY = pelvis.y + h * .078;
  const halfWaist = h * .077 * body.waist;
  const outer = h * .104 * body.thigh;
  const inner = h * .022;
  const g = ctx.createLinearGradient(pelvis.x - outer, topY, pelvis.x + outer, hemY);
  g.addColorStop(0, profile.kit.shorts);
  g.addColorStop(.48, profile.kit.shortsLight || profile.kit.shorts);
  g.addColorStop(1, profile.kit.shorts);
  ctx.fillStyle = g;
  ctx.strokeStyle = "rgba(1,8,14,.34)";
  ctx.lineWidth = Math.max(.8, h * .0045);
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pelvis.x - halfWaist, topY);
  ctx.quadraticCurveTo(pelvis.x, topY - h * .008, pelvis.x + halfWaist, topY);
  ctx.quadraticCurveTo(rightHip.x + outer * .58, pelvis.y + h * .025, rightHip.x + outer * .54, hemY);
  ctx.quadraticCurveTo(pelvis.x + inner * 1.2, hemY + h * .008, pelvis.x, pelvis.y + h * .034);
  ctx.quadraticCurveTo(pelvis.x - inner * 1.2, hemY + h * .008, leftHip.x - outer * .54, hemY);
  ctx.quadraticCurveTo(leftHip.x - outer * .58, pelvis.y + h * .025, pelvis.x - halfWaist, topY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = Math.max(.8, h * .004);
  ctx.beginPath();
  ctx.moveTo(pelvis.x - halfWaist * .82, topY + h * .008);
  ctx.lineTo(pelvis.x + halfWaist * .82, topY + h * .008);
  ctx.stroke();
}

function drawTorso(chest, pelvis, h, pose, profile) {
  const body = profile.body;
  const shoulder = h * .111 * body.shoulder;
  const waist = h * .076 * body.waist;
  const topY = chest.y - h * .038;
  const bottomY = pelvis.y + h * .034;
  const skew = pose.lean * h * .105;
  const leftShoulder = P(chest.x - shoulder, chest.y + pose.shoulder * h + h * .005);
  const rightShoulder = P(chest.x + shoulder, chest.y - pose.shoulder * h + h * .005);
  const upperLeft = P(leftShoulder.x + h * .026, leftShoulder.y - h * .006);
  const upperRight = P(rightShoulder.x - h * .026, rightShoulder.y - h * .006);
  const g = ctx.createLinearGradient(chest.x - shoulder, topY, chest.x + shoulder, bottomY);
  g.addColorStop(0, profile.kit.shirtShadow);
  g.addColorStop(.2, profile.kit.shirt);
  g.addColorStop(.5, profile.kit.shirtLight || profile.kit.shirt);
  g.addColorStop(.8, profile.kit.shirt);
  g.addColorStop(1, profile.kit.shirtShadow);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.18)";
  ctx.shadowBlur = Math.max(1.2, h * .008);
  ctx.fillStyle = g;
  ctx.strokeStyle = "rgba(5,15,25,.30)";
  ctx.lineWidth = Math.max(.8, h * .0045);
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(upperLeft.x, upperLeft.y);
  ctx.quadraticCurveTo(chest.x - shoulder * .56, topY - h * .02, chest.x - h * .035, topY - h * .02);
  ctx.quadraticCurveTo(chest.x, topY - h * .029, chest.x + h * .035, topY - h * .02);
  ctx.quadraticCurveTo(chest.x + shoulder * .56, topY - h * .02, upperRight.x, upperRight.y);
  ctx.quadraticCurveTo(rightShoulder.x + h * .004, chest.y + h * .052, pelvis.x + waist + skew, bottomY);
  ctx.quadraticCurveTo(pelvis.x + waist * .42 + skew, bottomY + h * .011, pelvis.x + skew, bottomY + h * .01);
  ctx.quadraticCurveTo(pelvis.x - waist * .42 + skew, bottomY + h * .011, pelvis.x - waist + skew, bottomY);
  ctx.quadraticCurveTo(leftShoulder.x - h * .004, chest.y + h * .052, upperLeft.x, upperLeft.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = profile.kit.collar || profile.kit.trim;
  ctx.lineWidth = Math.max(1.1, h * .007);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(chest.x - h * .029, topY - h * .01);
  ctx.quadraticCurveTo(chest.x, topY + h * .016, chest.x + h * .029, topY - h * .01);
  ctx.stroke();

  const centre = mix(chest, pelvis, .5);
  ctx.fillStyle = profile.kit.collar || profile.kit.trim;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${Math.max(5.8, h * .031)}px system-ui`;
  ctx.fillText(profile.displayName.split(" ").at(-1).slice(0, 10), centre.x + skew * .22, centre.y - h * .039);
  ctx.font = `900 ${Math.max(9.5, h * .079)}px system-ui`;
  ctx.fillText(String(profile.number), centre.x + skew * .25, centre.y + h * .022);
}

function drawBackHead(head, h, profile) {
  const shape = profile.face.shape;
  const jawFactor = profile.face.jaw || 1;
  const headScale = profile.body.head || 1;
  const rx = h * .052 * headScale * (shape === "broad-brow" ? 1.06 : shape === "angular" ? .96 : 1);
  const ry = h * .065 * headScale;
  const neckWidth = h * .039 * (profile.body.chest || 1);
  const neckTop = P(head.x, head.y + ry * .55);
  const neckBottom = P(head.x, head.y + ry * 1.3);
  softLimb(neckTop, neckBottom, neckWidth * .84, neckWidth, profile.skin.base, profile.skin.shadow, .06);

  ctx.fillStyle = profile.skin.shadow;
  ctx.beginPath(); ctx.ellipse(head.x - rx * .92, head.y + ry * .03, rx * .15, ry * .25, -.08, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(head.x + rx * .92, head.y + ry * .03, rx * .15, ry * .25, .08, 0, TAU); ctx.fill();

  const skin = ctx.createRadialGradient(head.x - rx * .2, head.y - ry * .3, 1, head.x, head.y, ry * 1.1);
  skin.addColorStop(0, profile.skin.light);
  skin.addColorStop(.62, profile.skin.base);
  skin.addColorStop(1, profile.skin.shadow);
  ctx.fillStyle = skin;
  ctx.strokeStyle = "rgba(73,44,31,.22)";
  ctx.lineWidth = Math.max(.7, h * .0035);
  ctx.beginPath();
  ctx.moveTo(head.x - rx * .7, head.y - ry * .72);
  ctx.quadraticCurveTo(head.x - rx, head.y - ry * .08, head.x - rx * (.72 + (jawFactor - 1) * .45), head.y + ry * .48);
  ctx.quadraticCurveTo(head.x - rx * .34, head.y + ry * .92, head.x, head.y + ry);
  ctx.quadraticCurveTo(head.x + rx * .34, head.y + ry * .92, head.x + rx * (.72 + (jawFactor - 1) * .45), head.y + ry * .48);
  ctx.quadraticCurveTo(head.x + rx, head.y - ry * .08, head.x + rx * .7, head.y - ry * .72);
  ctx.quadraticCurveTo(head.x, head.y - ry * 1.0, head.x - rx * .7, head.y - ry * .72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

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
  ctx.globalAlpha = .18;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(.7, h * .0035);
  ctx.beginPath();
  ctx.moveTo(head.x - rx * .42, top + ry * .17);
  ctx.quadraticCurveTo(head.x, top + ry * .02, head.x + rx * .42, top + ry * .16);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawHand(point, h, profile, angle = 0) {
  const radius = h * .023;
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle);
  const g = ctx.createRadialGradient(-radius * .25, -radius * .28, 1, 0, 0, radius);
  g.addColorStop(0, profile.skin.light);
  g.addColorStop(.65, profile.skin.base);
  g.addColorStop(1, profile.skin.shadow);
  ctx.fillStyle = g;
  ctx.strokeStyle = "rgba(75,43,31,.24)";
  ctx.lineWidth = Math.max(.7, h * .0035);
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * .72, radius, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSockCuff(point, h, profile) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.fillStyle = profile.kit.trim;
  ctx.beginPath();
  ctx.roundRect(-h * .022, -h * .005, h * .044, h * .01, h * .004);
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
  const shoulderHalf = h * .11 * body.shoulder;
  const hipHalf = h * .066 * body.waist;
  const shoulderTilt = pose.shoulder * h;
  const leftShoulder = P(chest.x - shoulderHalf, chest.y + h * .016 + shoulderTilt);
  const rightShoulder = P(chest.x + shoulderHalf, chest.y + h * .016 - shoulderTilt);
  const leftHip = P(pelvis.x - hipHalf, pelvis.y);
  const rightHip = P(pelvis.x + hipHalf, pelvis.y);
  const q = (point) => P(point.x * h, point.y * h);
  const leftKnee = q(pose.lk), rightKnee = q(pose.rk), leftAnkle = q(pose.la), rightAnkle = q(pose.ra);
  const leftToe = q(pose.lt), rightToe = q(pose.rt), leftElbow = q(pose.le), rightElbow = q(pose.re);
  const leftHand = q(pose.lh), rightHand = q(pose.rh);
  const head = P(chest.x + pose.lean * h * .014, chest.y - h * .146);

  ctx.fillStyle = "rgba(0,0,0,.2)";
  ctx.beginPath();
  ctx.ellipse(0, 5, h * (pose.phase.includes("follow") ? .19 : .165), h * .03, -pose.rotate * .15, 0, TAU);
  ctx.fill();

  const thighWidth = Math.max(6.5, h * .061 * body.thigh);
  const kneeWidth = Math.max(5.5, h * .049 * body.thigh);
  const calfWidth = Math.max(5, h * .047 * body.calf);
  const leftShortHem = mix(leftHip, leftKnee, .29);
  const rightShortHem = mix(rightHip, rightKnee, .29);
  const leftSockTop = mix(leftKnee, leftAnkle, .39);
  const rightSockTop = mix(rightKnee, rightAnkle, .39);

  softLimb(leftHip, leftShortHem, thighWidth * 1.02, thighWidth * .98, profile.kit.shorts, profile.kit.shortsLight || profile.kit.shorts, .07);
  softLimb(rightHip, rightShortHem, thighWidth * 1.02, thighWidth * .98, profile.kit.shorts, profile.kit.shortsLight || profile.kit.shorts, .07);
  softLimb(leftShortHem, leftKnee, thighWidth * .9, kneeWidth * 1.02, profile.skin.base, profile.skin.shadow, .1);
  softLimb(rightShortHem, rightKnee, thighWidth * .9, kneeWidth * 1.02, profile.skin.base, profile.skin.shadow, .1);
  skinJoint(leftKnee, kneeWidth * .5, profile);
  skinJoint(rightKnee, kneeWidth * .5, profile);
  softLimb(leftKnee, leftSockTop, kneeWidth * .98, calfWidth * 1.08, profile.skin.base, profile.skin.shadow, .09);
  softLimb(rightKnee, rightSockTop, kneeWidth * .98, calfWidth * 1.08, profile.skin.base, profile.skin.shadow, .09);
  softLimb(leftSockTop, leftAnkle, calfWidth * 1.12, calfWidth * .9, profile.kit.socks, "#d7dfdd", .16);
  softLimb(rightSockTop, rightAnkle, calfWidth * 1.12, calfWidth * .9, profile.kit.socks, "#d7dfdd", .16);
  drawSockCuff(leftSockTop, h, profile);
  drawSockCuff(rightSockTop, h, profile);
  drawBoot(leftAnkle, leftToe, thighWidth * .9, profile);
  drawBoot(rightAnkle, rightToe, thighWidth * .9, profile);

  drawShorts(pelvis, leftHip, rightHip, leftKnee, rightKnee, h, profile);

  // Torso first, then sleeves on top: this creates a clean manufactured shirt silhouette
  // instead of the old pointed shoulder join.
  drawTorso(chest, pelvis, h, pose, profile);

  const upperArmWidth = Math.max(5.2, h * .046 * body.chest);
  const leftSleeveEnd = mix(leftShoulder, leftElbow, .29);
  const rightSleeveEnd = mix(rightShoulder, rightElbow, .29);
  softLimb(leftShoulder, leftSleeveEnd, upperArmWidth * 1.24, upperArmWidth * 1.08, profile.kit.shirt, profile.kit.shirtShadow, .11);
  softLimb(rightShoulder, rightSleeveEnd, upperArmWidth * 1.24, upperArmWidth * 1.08, profile.kit.shirt, profile.kit.shirtShadow, .11);
  softLimb(leftSleeveEnd, leftElbow, upperArmWidth * .78, upperArmWidth * .67, profile.skin.base, profile.skin.shadow, .1);
  softLimb(rightSleeveEnd, rightElbow, upperArmWidth * .78, upperArmWidth * .67, profile.skin.base, profile.skin.shadow, .1);
  softLimb(leftElbow, leftHand, upperArmWidth * .66, upperArmWidth * .5, profile.skin.base, profile.skin.shadow, .1);
  softLimb(rightElbow, rightHand, upperArmWidth * .66, upperArmWidth * .5, profile.skin.base, profile.skin.shadow, .1);

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
  renderer: "polished-layered-2.5d-skeletal",
  artDirection: "premium-modern-arcade-football",
  rearViewGameplayModel: true,
  modularProfiles: true,
  roundedAthleticGeometry: true,
  enlargedBootsAndHands: true,
  balancedStrikeSilhouette: true,
  outfieldCharacters: 4
});
