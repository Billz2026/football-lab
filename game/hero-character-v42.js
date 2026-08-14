import { clamp, lerp, WORLD, state, ctx, canvasView, easeInOutCubic, easeOutCubic } from "./core-v6.js?v=32.4";
import { buildCamera, kickerWorld, ballWorld } from "./world-v7.js?v=32.4";
import { projectedHeight, projectWorld } from "./projection-v6.js?v=32.4";
import { activeCharacter } from "./characters-v13.js?v=32.4";
import { outfieldVisualProfileV42 } from "./character-profiles-v42.js?v=42.0.0";

const BUILD = "42.0.0";
const VIEW = { width: WORLD.width, height: WORLD.height };
const TAU = Math.PI * 2;
const P = (x, y) => ({ x, y });
const smooth = (v) => { const t = clamp(v, 0, 1); return t * t * (3 - 2 * t); };
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
    const follow = easeOutCubic(p.flight) * 0.42;
    camera.position.z -= follow;
    camera.position.y -= follow * 0.05;
    camera.target.y += follow * 0.06;
  }
  return camera;
}

const idle = {
  phase: "idle", crouch: .028, pelvisX: 0, chestX: 0, lean: -.012, rotate: 0, shoulder: 0,
  lk: P(-.095, -.17), rk: P(.095, -.17), la: P(-.12, -.006), ra: P(.12, -.006),
  lt: P(-.18, -.002), rt: P(.18, -.002), le: P(-.2, -.53), re: P(.2, -.53),
  lh: P(-.255, -.42), rh: P(.255, -.42)
};
const step = {
  phase: "final-step", crouch: .075, pelvisX: .012, chestX: -.025, lean: -.115, rotate: -.032, shoulder: -.022,
  lk: P(-.16, -.145), rk: P(.16, -.235), la: P(-.225, -.006), ra: P(.22, -.125),
  lt: P(-.295, -.002), rt: P(.29, -.09), le: P(-.28, -.55), re: P(.27, -.59),
  lh: P(-.36, -.48), rh: P(.35, -.51)
};
const windup = {
  phase: "wind-up", crouch: .098, pelvisX: .026, chestX: -.052, lean: -.175, rotate: -.055, shoulder: -.048,
  lk: P(-.17, -.135), rk: P(.2, -.31), la: P(-.23, -.006), ra: P(.245, -.205),
  lt: P(-.3, -.002), rt: P(.315, -.17), le: P(-.32, -.55), re: P(.31, -.62),
  lh: P(-.39, -.45), rh: P(.39, -.54)
};
const contact = {
  phase: "contact", crouch: .064, pelvisX: -.004, chestX: .045, lean: -.035, rotate: .045, shoulder: .052,
  lk: P(-.17, -.132), rk: P(.055, -.225), la: P(-.23, -.006), ra: P(-.028, -.245),
  lt: P(-.3, -.002), rt: P(-.108, -.222), le: P(-.31, -.49), re: P(.34, -.55),
  lh: P(-.38, -.37), rh: P(.42, -.45)
};
const follow = {
  phase: "follow-through", crouch: .036, pelvisX: -.035, chestX: .075, lean: .095, rotate: .088, shoulder: .075,
  lk: P(-.13, -.145), rk: P(-.045, -.292), la: P(-.21, -.006), ra: P(-.215, -.325),
  lt: P(-.28, -.002), rt: P(-.315, -.3), le: P(-.24, -.43), re: P(.3, -.49),
  lh: P(-.29, -.3), rh: P(.39, -.39)
};
const recoverStep = {
  phase: "recovery-step", crouch: .052, pelvisX: -.025, chestX: .028, lean: .032, rotate: .034, shoulder: .018,
  lk: P(-.135, -.155), rk: P(.025, -.19), la: P(-.205, -.006), ra: P(.105, -.018),
  lt: P(-.275, -.002), rt: P(.18, -.004), le: P(-.22, -.48), re: P(.245, -.5),
  lh: P(-.275, -.37), rh: P(.315, -.41)
};
const neutral = { ...idle, phase: "recovery-neutral", crouch: .034, lean: 0, rotate: .004 };

function blend(a, b, t, phase = b.phase) {
  const j = (key) => mix(a[key], b[key], t);
  return {
    phase,
    crouch: lerp(a.crouch, b.crouch, t),
    pelvisX: lerp(a.pelvisX, b.pelvisX, t),
    chestX: lerp(a.chestX, b.chestX, t),
    lean: lerp(a.lean, b.lean, t),
    rotate: lerp(a.rotate, b.rotate, t),
    shoulder: lerp(a.shoulder, b.shoulder, t),
    lk: j("lk"), rk: j("rk"), la: j("la"), ra: j("ra"), lt: j("lt"), rt: j("rt"),
    le: j("le"), re: j("re"), lh: j("lh"), rh: j("rh")
  };
}

function runPose(run, time, profile) {
  if (run < .56) {
    const t = run / .56;
    const cadence = 4.5 * (profile.motion.stride || 1);
    const s = Math.sin(t * Math.PI * cadence);
    const l = Math.max(0, s), r = Math.max(0, -s);
    return {
      phase: "approach", crouch: .032 + Math.abs(s) * .02, pelvisX: s * .018, chestX: -s * .012,
      lean: -.045 - t * (.075 + profile.motion.aggression * .014), rotate: s * .02, shoulder: -s * .025,
      lk: P(-.105 - s * .085, -.17 - l * .075), rk: P(.105 + s * .085, -.17 - r * .075),
      la: P(-.13 - s * .115, -.006 - l * .045), ra: P(.13 + s * .115, -.006 - r * .045),
      lt: P(-.19 - s * .12, -.002 - l * .035), rt: P(.19 + s * .12, -.002 - r * .035),
      le: P(-.22 + s * .06, -.54 - s * .025), re: P(.22 + s * .06, -.54 + s * .025),
      lh: P(-.29 + s * .085, -.43 - s * .045), rh: P(.29 + s * .085, -.43 + s * .045),
      breathe: Math.sin(time / 480) * .004
    };
  }
  if (run < .72) return blend(runPose(.559, time, profile), step, smooth((run - .56) / .16));
  if (run < .9) return blend(step, windup, smooth((run - .72) / .18));
  return blend(windup, contact, smooth((run - .9) / .1));
}

function personalisePose(pose, profile) {
  const aggression = profile.motion.aggression || 0;
  const followBoost = profile.motion.followThrough || 1;
  const plantBoost = profile.motion.plant || 1;
  const phase = pose.phase || "idle";
  const plantPhase = /final-step|wind-up|contact/.test(phase);
  const followPhase = /follow|recovery-step/.test(phase);
  const clone = {
    ...pose,
    crouch: pose.crouch * (0.98 + aggression * 0.08),
    lean: pose.lean * (0.98 + aggression * 0.1),
    rotate: pose.rotate * (followPhase ? followBoost : 1),
    shoulder: pose.shoulder * (0.98 + aggression * 0.08),
    lk: { ...pose.lk }, rk: { ...pose.rk }, la: { ...pose.la }, ra: { ...pose.ra },
    lt: { ...pose.lt }, rt: { ...pose.rt }, le: { ...pose.le }, re: { ...pose.re },
    lh: { ...pose.lh }, rh: { ...pose.rh }
  };
  if (plantPhase) {
    clone.la.x *= plantBoost;
    clone.lt.x *= plantBoost;
  }
  return clone;
}

function currentPose(p, time, profile) {
  let pose;
  if (!state.animation) {
    pose = { ...idle, crouch: idle.crouch + Math.sin(time / 520) * .008 };
  } else if (p.replay) {
    if (p.flight < .22) pose = blend(contact, follow, smooth(p.flight / .22));
    else if (p.flight < .5) pose = { ...follow, phase: "follow-through-hold" };
    else if (p.flight < .84) pose = blend(follow, recoverStep, smooth((p.flight - .5) / .34));
    else pose = blend(recoverStep, neutral, smooth((p.flight - .84) / .16));
  } else if (p.contact > 0 && p.flight <= 0) {
    pose = contact;
  } else if (p.flight > 0 || p.settle > 0) {
    if (p.flight < .22) pose = blend(contact, follow, smooth(p.flight / .22));
    else if (p.flight < .48) pose = { ...follow, phase: "follow-through-hold" };
    else if (p.flight < .84) pose = blend(follow, recoverStep, smooth((p.flight - .48) / .36));
    else pose = blend(recoverStep, neutral, Math.max(smooth((p.flight - .84) / .16), p.settle));
  } else {
    pose = runPose(p.run, time, profile);
  }
  return personalisePose(pose, profile);
}

function travel(p) {
  if (!state.animation) return 0;
  if (p.replay) return 1;
  return easeInOutCubic(clamp(p.run / .72, 0, 1));
}

function limb(a, b, widthA, widthB, colourA, colourB, highlight = "rgba(255,255,255,.11)") {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const path = (pad = 0) => {
    ctx.beginPath();
    ctx.moveTo(a.x + nx * (widthA / 2 + pad), a.y + ny * (widthA / 2 + pad));
    ctx.quadraticCurveTo(
      a.x + dx * .42 + nx * (Math.max(widthA, widthB) * .1 + pad),
      a.y + dy * .42 + ny * (Math.max(widthA, widthB) * .1 + pad),
      b.x + nx * (widthB / 2 + pad), b.y + ny * (widthB / 2 + pad)
    );
    ctx.quadraticCurveTo(b.x + dx * .045, b.y + dy * .045, b.x - nx * (widthB / 2 + pad), b.y - ny * (widthB / 2 + pad));
    ctx.quadraticCurveTo(
      a.x + dx * .42 - nx * (Math.max(widthA, widthB) * .08 + pad),
      a.y + dy * .42 - ny * (Math.max(widthA, widthB) * .08 + pad),
      a.x - nx * (widthA / 2 + pad), a.y - ny * (widthA / 2 + pad)
    );
    ctx.closePath();
  };
  path(Math.max(1.1, Math.min(widthA, widthB) * .12));
  ctx.fillStyle = "rgba(3,7,8,.48)";
  ctx.fill();
  path(0);
  const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
  gradient.addColorStop(0, colourA);
  gradient.addColorStop(.72, colourB);
  gradient.addColorStop(1, colourB);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = .62;
  ctx.strokeStyle = highlight;
  ctx.lineWidth = Math.max(1, Math.min(widthA, widthB) * .08);
  ctx.beginPath();
  ctx.moveTo(a.x + nx * widthA * .18, a.y + ny * widthA * .18);
  ctx.lineTo(b.x + nx * widthB * .15, b.y + ny * widthB * .15);
  ctx.stroke();
  ctx.restore();
}

function joint(point, radius, base, light) {
  ctx.fillStyle = "rgba(3,7,8,.38)";
  ctx.beginPath(); ctx.ellipse(point.x, point.y + radius * .06, radius * 1.08, radius * .94, 0, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(point.x - radius * .28, point.y - radius * .35, radius * .08, point.x, point.y, radius);
  g.addColorStop(0, light);
  g.addColorStop(.72, base);
  g.addColorStop(1, "rgba(71,39,30,.72)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(point.x, point.y, radius, radius * .9, 0, 0, TAU); ctx.fill();
}

function drawBoot(ankle, toe, width, profile) {
  const dx = toe.x - ankle.x;
  const dy = toe.y - ankle.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const heel = mix(ankle, toe, .02);
  const front = mix(ankle, toe, 1.14);
  const half = width * .5;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.ellipse(mix(heel, front, .55).x, mix(heel, front, .55).y + width * .25, length * .58, width * .36, Math.atan2(dy, dx), 0, TAU);
  ctx.fill();
  const g = ctx.createLinearGradient(heel.x, heel.y, front.x, front.y);
  g.addColorStop(0, profile.boots.secondary);
  g.addColorStop(.35, profile.boots.base);
  g.addColorStop(.82, profile.boots.base);
  g.addColorStop(1, profile.boots.secondary);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(heel.x + nx * half, heel.y + ny * half);
  ctx.quadraticCurveTo(front.x + nx * half * .72, front.y + ny * half * .72, front.x + nx * half * .5, front.y + ny * half * .5);
  ctx.lineTo(front.x - nx * half * .55, front.y - ny * half * .55);
  ctx.quadraticCurveTo(heel.x - nx * half * .92, heel.y - ny * half * .92, heel.x - nx * half, heel.y - ny * half);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = profile.boots.accent;
  ctx.lineWidth = Math.max(1.1, width * .11);
  ctx.beginPath();
  const laceA = mix(heel, front, .31), laceB = mix(heel, front, .68);
  ctx.moveTo(laceA.x - nx * half * .4, laceA.y - ny * half * .4);
  ctx.lineTo(laceB.x - nx * half * .28, laceB.y - ny * half * .28);
  ctx.stroke();
  ctx.restore();
}

function drawShorts(pelvis, h, profile, pose) {
  const body = profile.body;
  const halfTop = h * .092 * body.waist;
  const halfBottom = h * .115 * body.thigh;
  const topY = pelvis.y - h * .065;
  const bottomY = pelvis.y + h * .072;
  const skew = pose.lean * h * .04;
  const g = ctx.createLinearGradient(pelvis.x - halfTop, topY, pelvis.x + halfTop, bottomY);
  g.addColorStop(0, profile.kit.shorts);
  g.addColorStop(.55, profile.kit.shorts);
  g.addColorStop(1, "#2d3540");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(pelvis.x - halfTop, topY);
  ctx.lineTo(pelvis.x + halfTop, topY);
  ctx.lineTo(pelvis.x + halfBottom + skew, bottomY);
  ctx.quadraticCurveTo(pelvis.x, bottomY + h * .018, pelvis.x - halfBottom + skew, bottomY);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = profile.kit.trim;
  ctx.lineWidth = Math.max(1, h * .008);
  ctx.beginPath(); ctx.moveTo(pelvis.x, topY + h * .008); ctx.lineTo(pelvis.x + skew * .2, bottomY - h * .012); ctx.stroke();
}

function drawTorso(chest, pelvis, h, pose, character, profile) {
  const body = profile.body;
  const top = h * .128 * body.shoulder;
  const bottom = h * .088 * body.waist;
  const topY = chest.y - h * .047;
  const bottomY = pelvis.y + h * .045;
  const skew = pose.lean * h * .15;
  ctx.save();
  ctx.fillStyle = "rgba(2,6,7,.5)";
  ctx.beginPath();
  ctx.moveTo(chest.x - top - 2.2, topY - 1.5);
  ctx.lineTo(chest.x + top + 2.2, topY - 1.5);
  ctx.lineTo(pelvis.x + bottom + skew + 2, bottomY + 2);
  ctx.lineTo(pelvis.x - bottom + skew - 2, bottomY + 2);
  ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(chest.x - top, topY, chest.x + top, bottomY);
  g.addColorStop(0, profile.kit.shirtShadow);
  g.addColorStop(.3, profile.kit.shirt);
  g.addColorStop(.62, profile.kit.shirt);
  g.addColorStop(1, profile.kit.shirtShadow);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(chest.x - top, topY + h * .012);
  ctx.quadraticCurveTo(chest.x - top * .46, topY - h * .015, chest.x, topY - h * .02);
  ctx.quadraticCurveTo(chest.x + top * .46, topY - h * .015, chest.x + top, topY + h * .012);
  ctx.lineTo(pelvis.x + bottom + skew, bottomY);
  ctx.quadraticCurveTo(pelvis.x, bottomY + h * .014, pelvis.x - bottom + skew, bottomY);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = profile.kit.trim;
  ctx.lineWidth = Math.max(1.1, h * .008);
  ctx.beginPath();
  ctx.moveTo(chest.x - h * .034, topY - h * .006);
  ctx.quadraticCurveTo(chest.x, topY + h * .032, chest.x + h * .034, topY - h * .006);
  ctx.stroke();
  const centre = mix(chest, pelvis, .5);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = profile.kit.trim;
  ctx.font = `800 ${Math.max(6, h * .037)}px system-ui`;
  const surname = profile.displayName.split(" ").at(-1) || character.name.split(" ").at(-1) || "PLAYER";
  ctx.fillText(surname.slice(0, 10), centre.x + skew * .25, centre.y - h * .05);
  ctx.font = `900 ${Math.max(10, h * .096)}px system-ui`;
  ctx.fillText(String(profile.number || character.number), centre.x + skew * .35, centre.y + h * .03);
  ctx.restore();
}

function hairPath(head, rx, ry, profile) {
  const style = profile.hair.style;
  const top = head.y - ry * .88;
  ctx.beginPath();
  if (style === "textured-crop") {
    ctx.moveTo(head.x - rx * .82, head.y - ry * .12);
    ctx.quadraticCurveTo(head.x - rx * .82, top + ry * .18, head.x - rx * .46, top + ry * .02);
    ctx.quadraticCurveTo(head.x - rx * .22, top - ry * .18, head.x, top + ry * .01);
    ctx.quadraticCurveTo(head.x + rx * .24, top - ry * .16, head.x + rx * .48, top + ry * .03);
    ctx.quadraticCurveTo(head.x + rx * .86, top + ry * .2, head.x + rx * .78, head.y - ry * .05);
  } else if (style === "sharp-textured") {
    ctx.moveTo(head.x - rx * .82, head.y - ry * .08);
    ctx.lineTo(head.x - rx * .66, top + ry * .14);
    ctx.lineTo(head.x - rx * .34, top - ry * .06);
    ctx.lineTo(head.x - rx * .04, top + ry * .01);
    ctx.lineTo(head.x + rx * .23, top - ry * .12);
    ctx.lineTo(head.x + rx * .54, top + ry * .02);
    ctx.lineTo(head.x + rx * .82, head.y - ry * .03);
  } else if (style === "refined-swept") {
    ctx.moveTo(head.x - rx * .82, head.y - ry * .08);
    ctx.quadraticCurveTo(head.x - rx * .72, top + ry * .04, head.x - rx * .18, top - ry * .12);
    ctx.quadraticCurveTo(head.x + rx * .34, top - ry * .24, head.x + rx * .76, top + ry * .08);
    ctx.lineTo(head.x + rx * .8, head.y - ry * .02);
  } else {
    ctx.moveTo(head.x - rx * .82, head.y - ry * .05);
    ctx.quadraticCurveTo(head.x - rx * .7, top + ry * .08, head.x, top + ry * .01);
    ctx.quadraticCurveTo(head.x + rx * .7, top + ry * .08, head.x + rx * .82, head.y - ry * .05);
  }
  ctx.quadraticCurveTo(head.x, head.y + ry * .02, head.x - rx * .82, head.y - ry * .08);
  ctx.closePath();
}

function drawHead(head, h, profile) {
  const shape = profile.face.shape;
  const headScale = profile.body.head || 1;
  const rx = h * .061 * headScale * (shape === "broad-brow" ? 1.08 : shape === "angular" ? .96 : 1);
  const ry = h * .073 * headScale * (shape === "defined-cheek" ? 1.02 : 1);
  ctx.save();
  ctx.fillStyle = profile.skin.shadow;
  ctx.beginPath(); ctx.ellipse(head.x - rx * .94, head.y + ry * .03, rx * .18, ry * .3, -.08, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(head.x + rx * .94, head.y + ry * .03, rx * .18, ry * .3, .08, 0, TAU); ctx.fill();
  const face = ctx.createRadialGradient(head.x - rx * .3, head.y - ry * .36, rx * .08, head.x, head.y, ry * 1.05);
  face.addColorStop(0, profile.skin.light);
  face.addColorStop(.58, profile.skin.base);
  face.addColorStop(1, profile.skin.shadow);
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.moveTo(head.x - rx * .72, head.y - ry * .72);
  ctx.quadraticCurveTo(head.x - rx, head.y - ry * .05, head.x - rx * (.72 + (profile.face.jaw - 1) * .55), head.y + ry * .46);
  ctx.quadraticCurveTo(head.x - rx * .34, head.y + ry * .94, head.x, head.y + ry);
  ctx.quadraticCurveTo(head.x + rx * .34, head.y + ry * .94, head.x + rx * (.72 + (profile.face.jaw - 1) * .55), head.y + ry * .46);
  ctx.quadraticCurveTo(head.x + rx, head.y - ry * .05, head.x + rx * .72, head.y - ry * .72);
  ctx.quadraticCurveTo(head.x, head.y - ry * 1.02, head.x - rx * .72, head.y - ry * .72);
  ctx.closePath(); ctx.fill();

  const eyeY = head.y - ry * .08;
  const eyeGap = rx * .34;
  ctx.strokeStyle = "rgba(39,25,21,.82)";
  ctx.lineWidth = Math.max(1, h * .006 * (profile.face.brow || 1));
  ctx.beginPath();
  ctx.moveTo(head.x - eyeGap - rx * .22, eyeY - ry * .17);
  ctx.lineTo(head.x - eyeGap + rx * .18, eyeY - ry * .13);
  ctx.moveTo(head.x + eyeGap - rx * .18, eyeY - ry * .13);
  ctx.lineTo(head.x + eyeGap + rx * .22, eyeY - ry * .17);
  ctx.stroke();
  ctx.fillStyle = "#f1ede6";
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(head.x + side * eyeGap, eyeY, rx * .17, ry * .075, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#273330";
    ctx.beginPath(); ctx.arc(head.x + side * eyeGap, eyeY, Math.max(1, rx * .055), 0, TAU); ctx.fill();
    ctx.fillStyle = "#f1ede6";
  }
  ctx.strokeStyle = "rgba(102,61,48,.58)";
  ctx.lineWidth = Math.max(1, h * .0045);
  ctx.beginPath();
  ctx.moveTo(head.x, eyeY + ry * .06);
  ctx.quadraticCurveTo(head.x - rx * .04, head.y + ry * .25, head.x + rx * .08 * (profile.face.nose || 1), head.y + ry * .31);
  ctx.stroke();
  ctx.strokeStyle = "rgba(90,43,40,.62)";
  ctx.beginPath(); ctx.moveTo(head.x - rx * .2, head.y + ry * .52); ctx.quadraticCurveTo(head.x, head.y + ry * .59, head.x + rx * .22, head.y + ry * .51); ctx.stroke();
  if ((profile.face.stubble || 0) > 0) {
    ctx.globalAlpha = profile.face.stubble * .62;
    ctx.fillStyle = "#332924";
    ctx.beginPath();
    ctx.ellipse(head.x, head.y + ry * .5, rx * .58, ry * .38, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  const hair = ctx.createLinearGradient(head.x - rx, head.y - ry, head.x + rx, head.y);
  hair.addColorStop(0, profile.hair.shadow);
  hair.addColorStop(.46, profile.hair.base);
  hair.addColorStop(1, profile.hair.light);
  ctx.fillStyle = hair;
  hairPath(head, rx * profile.hair.volume, ry * profile.hair.volume, profile);
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
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(ball.x, ball.y, 7 + (1 - strength) * 20, 0, TAU); ctx.stroke();
  for (let i = 0; i < 7; i += 1) {
    const a = -1.45 + i * .39;
    ctx.beginPath(); ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(ball.x + Math.cos(a) * (14 + (1 - strength) * 24), ball.y + Math.sin(a) * (10 + (1 - strength) * 18));
    ctx.stroke();
  }
  ctx.restore();
}

function drawCharacter(world, pose, time, character, profile, p) {
  const camera = frameCamera(time);
  const visualHeightMetres = 1.88 * (profile.body.height || 1);
  const projection = projectedHeight(world, visualHeightMetres, camera, VIEW);
  if (!projection) return;
  const h = projection.height;
  const foot = projection.foot;
  const body = profile.body;
  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(pose.rotate || 0);

  const pelvis = P(pose.pelvisX * h, -.35 * h + pose.crouch * h * .08);
  const chest = P(pose.chestX * h, -.665 * h + pose.crouch * h * .09);
  const shoulderHalf = h * .122 * body.shoulder;
  const hipHalf = h * .073 * body.waist;
  const shoulderTilt = pose.shoulder * h;
  const ls = P(chest.x - shoulderHalf, chest.y + h * .012 + shoulderTilt);
  const rs = P(chest.x + shoulderHalf, chest.y + h * .012 - shoulderTilt);
  const lHip = P(pelvis.x - hipHalf, pelvis.y);
  const rHip = P(pelvis.x + hipHalf, pelvis.y);
  const q = (v) => P(v.x * h, v.y * h);
  const lk = q(pose.lk), rk = q(pose.rk), la = q(pose.la), ra = q(pose.ra);
  const lt = q(pose.lt), rt = q(pose.rt), le = q(pose.le), re = q(pose.re);
  const lhand = q(pose.lh), rhand = q(pose.rh);
  const head = P(chest.x + pose.lean * h * .018, chest.y - h * .154);

  ctx.fillStyle = "rgba(0,0,0,.24)";
  ctx.beginPath();
  ctx.ellipse(0, 6, h * (pose.phase.includes("follow") ? .23 : .19), h * .042, -pose.rotate * .18, 0, TAU);
  ctx.fill();

  if (["final-step", "wind-up", "contact"].includes(pose.phase)) {
    ctx.fillStyle = "rgba(12,45,23,.4)";
    ctx.beginPath(); ctx.ellipse(la.x, la.y + h * .009, h * .068, h * .015, -.12, 0, TAU); ctx.fill();
  }

  const thighW = Math.max(6.5, h * .069 * body.thigh);
  const kneeW = Math.max(5.2, h * .055 * body.thigh);
  const calfW = Math.max(4.7, h * .05 * body.calf);
  const leftUpperMid = mix(lHip, lk, .46);
  const rightUpperMid = mix(rHip, rk, .46);
  const leftSockTop = mix(lk, la, .34);
  const rightSockTop = mix(rk, ra, .34);

  limb(lHip, leftUpperMid, thighW * 1.04, thighW, profile.kit.shorts, profile.kit.shorts);
  limb(rHip, rightUpperMid, thighW * 1.04, thighW, profile.kit.shorts, profile.kit.shorts);
  limb(leftUpperMid, lk, thighW * .86, kneeW, profile.skin.shadow, profile.skin.base);
  limb(rightUpperMid, rk, thighW * .86, kneeW, profile.skin.shadow, profile.skin.base);
  joint(lk, kneeW * .48, profile.skin.base, profile.skin.light);
  joint(rk, kneeW * .48, profile.skin.base, profile.skin.light);
  limb(lk, leftSockTop, kneeW * .9, calfW * 1.04, profile.skin.base, profile.skin.shadow);
  limb(rk, rightSockTop, kneeW * .9, calfW * 1.04, profile.skin.base, profile.skin.shadow);
  limb(leftSockTop, la, calfW * 1.08, calfW * .82, profile.kit.socks, profile.kit.socks, "rgba(255,255,255,.18)");
  limb(rightSockTop, ra, calfW * 1.08, calfW * .82, profile.kit.socks, profile.kit.socks, "rgba(255,255,255,.18)");
  ctx.strokeStyle = profile.kit.trim;
  ctx.lineWidth = Math.max(1.4, h * .012);
  for (const sockTop of [leftSockTop, rightSockTop]) {
    ctx.beginPath(); ctx.moveTo(sockTop.x - h * .026, sockTop.y); ctx.lineTo(sockTop.x + h * .026, sockTop.y); ctx.stroke();
  }
  drawBoot(la, lt, thighW * .82, profile);
  drawBoot(ra, rt, thighW * .82, profile);

  const armW = Math.max(4.8, h * .05 * body.chest);
  const leftSleeve = mix(ls, le, .29);
  const rightSleeve = mix(rs, re, .29);
  limb(ls, leftSleeve, armW * 1.15, armW, profile.kit.shirtShadow, profile.kit.shirt);
  limb(rs, rightSleeve, armW * 1.15, armW, profile.kit.shirtShadow, profile.kit.shirt);
  limb(leftSleeve, le, armW * .82, armW * .68, profile.skin.shadow, profile.skin.base);
  limb(rightSleeve, re, armW * .82, armW * .68, profile.skin.shadow, profile.skin.base);
  limb(le, lhand, armW * .68, armW * .48, profile.skin.base, profile.skin.light);
  limb(re, rhand, armW * .68, armW * .48, profile.skin.base, profile.skin.light);
  joint(le, armW * .31, profile.skin.base, profile.skin.light);
  joint(re, armW * .31, profile.skin.base, profile.skin.light);

  drawTorso(chest, pelvis, h, pose, character, profile);
  drawShorts(pelvis, h, profile, pose);
  joint(lhand, armW * .37, profile.skin.base, profile.skin.light);
  joint(rhand, armW * .37, profile.skin.base, profile.skin.light);
  limb(P(chest.x, chest.y - h * .03), P(head.x, head.y + h * .052), h * .052, h * .046, profile.skin.shadow, profile.skin.base);
  drawHead(head, h, profile);
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
  modularProfiles: true,
  outfieldCharacters: 4
});
