import { clamp, lerp, WORLD, state, ctx, canvasView, easeInOutCubic, easeOutCubic } from "./core-v6.js?v=32.4";
import { buildCamera, kickerWorld, ballWorld } from "./world-v7.js?v=32.4";
import { projectedHeight, projectWorld } from "./projection-v6.js?v=32.4";
import { activeCharacter } from "./characters-v13.js?v=32.4";
import { outfieldVisualProfileV42 } from "./character-profiles-v42.js?v=42.1.0";

const BUILD = "45.0.0";
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
      lh: P(-.225 + s * .074, -.375 - s * .038), rh: P(.225 + s * .074, -.375 + s * .038)
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

function volumePath(a, b, startWidth, midWidth, endWidth, pad = 0) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const mid = mix(a, b, .52);
  const sw = startWidth * .5 + pad;
  const mw = midWidth * .5 + pad;
  const ew = endWidth * .5 + pad;
  ctx.beginPath();
  ctx.moveTo(a.x + nx * sw, a.y + ny * sw);
  ctx.quadraticCurveTo(lerp(a.x, mid.x, .58) + nx * mw, lerp(a.y, mid.y, .58) + ny * mw, mid.x + nx * mw, mid.y + ny * mw);
  ctx.quadraticCurveTo(lerp(mid.x, b.x, .46) + nx * mw, lerp(mid.y, b.y, .46) + ny * mw, b.x + nx * ew, b.y + ny * ew);
  ctx.quadraticCurveTo(b.x + dx * .018, b.y + dy * .018, b.x - nx * ew, b.y - ny * ew);
  ctx.quadraticCurveTo(lerp(mid.x, b.x, .46) - nx * mw, lerp(mid.y, b.y, .46) - ny * mw, mid.x - nx * mw, mid.y - ny * mw);
  ctx.quadraticCurveTo(lerp(a.x, mid.x, .58) - nx * mw, lerp(a.y, mid.y, .58) - ny * mw, a.x - nx * sw, a.y - ny * sw);
  ctx.closePath();
  return { nx, ny, maxWidth: Math.max(startWidth, midWidth, endWidth) };
}

function drawVolume(a, b, startWidth, midWidth, endWidth, light, base, shadow, highlight = .16) {
  const outlinePad = Math.max(.9, Math.min(startWidth, endWidth) * .065);
  volumePath(a, b, startWidth, midWidth, endWidth, outlinePad);
  ctx.fillStyle = "rgba(1,5,7,.44)";
  ctx.fill();

  const basis = volumePath(a, b, startWidth, midWidth, endWidth);
  const gradient = ctx.createLinearGradient(
    a.x - basis.nx * basis.maxWidth, a.y - basis.ny * basis.maxWidth,
    a.x + basis.nx * basis.maxWidth, a.y + basis.ny * basis.maxWidth
  );
  gradient.addColorStop(0, shadow);
  gradient.addColorStop(.27, base);
  gradient.addColorStop(.53, light);
  gradient.addColorStop(.76, base);
  gradient.addColorStop(1, shadow);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = highlight;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(.8, basis.maxWidth * .038);
  ctx.beginPath();
  ctx.moveTo(a.x + basis.nx * startWidth * .17, a.y + basis.ny * startWidth * .17);
  ctx.quadraticCurveTo(
    lerp(a.x, b.x, .52) + basis.nx * midWidth * .2,
    lerp(a.y, b.y, .52) + basis.ny * midWidth * .2,
    b.x + basis.nx * endWidth * .12,
    b.y + basis.ny * endWidth * .12
  );
  ctx.stroke();
  ctx.restore();
}

function drawJoint(point, rx, ry, light, base, shadow) {
  const g = ctx.createRadialGradient(point.x - rx * .27, point.y - ry * .32, 1, point.x, point.y, Math.max(rx, ry));
  g.addColorStop(0, light);
  g.addColorStop(.55, base);
  g.addColorStop(1, shadow);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(point.x, point.y, rx, ry, 0, 0, TAU);
  ctx.fill();
}

function drawGroundShadow(h, phase) {
  ctx.save();
  const width = h * (/follow/.test(phase) ? .22 : .19);
  const gradient = ctx.createRadialGradient(0, 4, width * .08, 0, 4, width);
  gradient.addColorStop(0, "rgba(0,0,0,.24)");
  gradient.addColorStop(.62, "rgba(0,0,0,.10)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.scale(1, .26);
  ctx.beginPath();
  ctx.arc(0, 15, width, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawBoot(ankle, toe, h, profile) {
  const dx = toe.x - ankle.x;
  const dy = toe.y - ankle.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const heel = mix(ankle, toe, -.07);
  const front = mix(ankle, toe, 1.08);
  const half = h * .028;
  const g = ctx.createLinearGradient(heel.x - nx * half, heel.y - ny * half, heel.x + nx * half, heel.y + ny * half);
  g.addColorStop(0, profile.boots.secondary);
  g.addColorStop(.42, profile.boots.base);
  g.addColorStop(.72, profile.boots.base);
  g.addColorStop(1, profile.boots.secondary);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(heel.x + nx * half, heel.y + ny * half);
  ctx.quadraticCurveTo(front.x + nx * half * .95, front.y + ny * half * .95, front.x + nx * half * .48, front.y + ny * half * .48);
  ctx.lineTo(front.x - nx * half * .7, front.y - ny * half * .7);
  ctx.quadraticCurveTo(heel.x - nx * half, heel.y - ny * half, heel.x - nx * half, heel.y - ny * half);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = profile.boots.accent;
  ctx.lineWidth = Math.max(1, h * .005);
  ctx.beginPath();
  ctx.moveTo(mix(heel, front, .34).x - nx * half * .35, mix(heel, front, .34).y - ny * half * .35);
  ctx.lineTo(mix(heel, front, .72).x - nx * half * .22, mix(heel, front, .72).y - ny * half * .22);
  ctx.stroke();
}

function drawShortsVolume(pelvis, leftHip, rightHip, h, profile) {
  const body = profile.body;
  const halfWaist = h * .09 * body.waist;
  const outer = h * .112 * body.thigh;
  const topY = pelvis.y - h * .062;
  const hemY = pelvis.y + h * .095;
  const g = ctx.createLinearGradient(pelvis.x - outer, topY, pelvis.x + outer, hemY);
  g.addColorStop(0, profile.kit.shorts);
  g.addColorStop(.22, profile.kit.shortsLight || profile.kit.shorts);
  g.addColorStop(.5, profile.kit.shortsLight || profile.kit.shorts);
  g.addColorStop(.82, profile.kit.shorts);
  g.addColorStop(1, "#07111e");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(pelvis.x - halfWaist, topY);
  ctx.quadraticCurveTo(pelvis.x, topY - h * .016, pelvis.x + halfWaist, topY);
  ctx.lineTo(rightHip.x + outer * .64, hemY);
  ctx.quadraticCurveTo(pelvis.x + h * .045, hemY + h * .014, pelvis.x, pelvis.y + h * .045);
  ctx.quadraticCurveTo(pelvis.x - h * .045, hemY + h * .014, leftHip.x - outer * .64, hemY);
  ctx.closePath();
  ctx.fill();

  const depth = ctx.createRadialGradient(pelvis.x, pelvis.y + h * .015, 1, pelvis.x, pelvis.y + h * .02, h * .13);
  depth.addColorStop(0, "rgba(255,255,255,.09)");
  depth.addColorStop(.6, "rgba(255,255,255,0)");
  depth.addColorStop(1, "rgba(0,0,0,.12)");
  ctx.fillStyle = depth;
  ctx.beginPath();
  ctx.ellipse(pelvis.x, pelvis.y + h * .025, h * .105 * body.thigh, h * .072, 0, 0, TAU);
  ctx.fill();
}

function drawTorsoVolume(chest, pelvis, h, pose, profile) {
  const body = profile.body;
  const shoulder = h * .148 * body.shoulder;
  const rib = h * .132 * body.chest;
  const waist = h * .088 * body.waist;
  const top = chest.y - h * .055;
  const bottom = pelvis.y + h * .048;
  const skew = pose.lean * h * .11;
  const leftShoulder = P(chest.x - shoulder, chest.y + pose.shoulder * h + h * .004);
  const rightShoulder = P(chest.x + shoulder, chest.y - pose.shoulder * h + h * .004);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.25)";
  ctx.shadowBlur = Math.max(2, h * .014);
  const g = ctx.createLinearGradient(chest.x - shoulder, top, chest.x + shoulder, bottom);
  g.addColorStop(0, profile.kit.shirtShadow);
  g.addColorStop(.18, profile.kit.shirt);
  g.addColorStop(.43, profile.kit.shirtLight || profile.kit.shirt);
  g.addColorStop(.64, profile.kit.shirt);
  g.addColorStop(1, profile.kit.shirtShadow);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(chest.x - h * .04, top - h * .01);
  ctx.quadraticCurveTo(chest.x - shoulder * .58, top - h * .018, leftShoulder.x, leftShoulder.y);
  ctx.quadraticCurveTo(chest.x - rib * 1.08, chest.y + h * .105, pelvis.x - waist + skew, bottom);
  ctx.quadraticCurveTo(pelvis.x, bottom + h * .025, pelvis.x + waist + skew, bottom);
  ctx.quadraticCurveTo(chest.x + rib * 1.08, chest.y + h * .105, rightShoulder.x, rightShoulder.y);
  ctx.quadraticCurveTo(chest.x + shoulder * .58, top - h * .018, chest.x + h * .04, top - h * .01);
  ctx.quadraticCurveTo(chest.x, top + h * .022, chest.x - h * .04, top - h * .01);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = .16;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(.8, h * .0045);
  ctx.beginPath();
  ctx.moveTo(chest.x - rib * .62, chest.y + h * .035);
  ctx.quadraticCurveTo(chest.x, chest.y + h * .072, chest.x + rib * .62, chest.y + h * .035);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = profile.kit.collar || profile.kit.trim;
  ctx.lineWidth = Math.max(1.2, h * .0075);
  ctx.beginPath();
  ctx.moveTo(chest.x - h * .032, top + h * .006);
  ctx.quadraticCurveTo(chest.x, top + h * .038, chest.x + h * .032, top + h * .006);
  ctx.stroke();

  const centre = mix(chest, pelvis, .52);
  ctx.fillStyle = profile.kit.collar || profile.kit.trim;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${Math.max(6, h * .031)}px system-ui`;
  ctx.fillText(profile.displayName.split(" ").at(-1).slice(0, 10), centre.x + skew * .2, centre.y - h * .045);
  ctx.font = `900 ${Math.max(10, h * .082)}px system-ui`;
  ctx.fillText(String(profile.number), centre.x + skew * .25, centre.y + h * .026);

  return { leftShoulder, rightShoulder };
}

function drawHeadAndNeck(head, chest, h, profile) {
  const body = profile.body;
  const rx = h * .061 * (body.head || 1);
  const ry = h * .074 * (body.head || 1);
  const neckTop = P(head.x, head.y + ry * .58);
  const neckBottom = P(chest.x, chest.y - h * .032);
  drawVolume(neckTop, neckBottom, h * .045 * body.chest, h * .05 * body.chest, h * .052 * body.chest, profile.skin.light, profile.skin.base, profile.skin.shadow, .09);

  const skin = ctx.createRadialGradient(head.x - rx * .28, head.y - ry * .35, 1, head.x, head.y, ry * 1.08);
  skin.addColorStop(0, profile.skin.light);
  skin.addColorStop(.58, profile.skin.base);
  skin.addColorStop(1, profile.skin.shadow);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(head.x, head.y, rx, ry, 0, 0, TAU);
  ctx.fill();

  const hair = ctx.createLinearGradient(head.x - rx, head.y - ry, head.x + rx, head.y);
  hair.addColorStop(0, profile.hair.shadow);
  hair.addColorStop(.5, profile.hair.base);
  hair.addColorStop(1, profile.hair.light);
  ctx.fillStyle = hair;
  const volume = profile.hair.volume || 1;
  ctx.beginPath();
  ctx.ellipse(head.x, head.y - ry * .43, rx * .98, ry * .67 * volume, 0, Math.PI, TAU);
  ctx.quadraticCurveTo(head.x + rx * .88, head.y + ry * .22, head.x + rx * .66, head.y + ry * .33);
  ctx.quadraticCurveTo(head.x, head.y + ry * .08, head.x - rx * .66, head.y + ry * .33);
  ctx.quadraticCurveTo(head.x - rx * .88, head.y + ry * .22, head.x - rx * .98, head.y - ry * .43);
  ctx.fill();

  ctx.fillStyle = "rgba(22,15,12,.34)";
  ctx.beginPath();
  ctx.ellipse(head.x, head.y + ry * .49, rx * .5, ry * .12, 0, 0, TAU);
  ctx.fill();
}

function drawHand(point, h, profile, angle = 0) {
  const radius = h * .022;
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle);
  const g = ctx.createRadialGradient(-radius * .3, -radius * .35, 1, 0, 0, radius);
  g.addColorStop(0, profile.skin.light);
  g.addColorStop(.6, profile.skin.base);
  g.addColorStop(1, profile.skin.shadow);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * .72, radius, 0, 0, TAU);
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
  if (!projection || projection.height < 10) return;
  const h = projection.height;
  const foot = projection.foot;
  const body = profile.body;

  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(pose.rotate || 0);

  const pelvis = P(pose.pelvisX * h, -.365 * h + pose.crouch * h * .07);
  const chest = P(pose.chestX * h, -.67 * h + pose.crouch * h * .08);
  const shoulderHalf = h * .148 * body.shoulder;
  const hipHalf = h * .082 * body.waist;
  const shoulderTilt = pose.shoulder * h;
  const leftShoulder = P(chest.x - shoulderHalf, chest.y + h * .013 + shoulderTilt);
  const rightShoulder = P(chest.x + shoulderHalf, chest.y + h * .013 - shoulderTilt);
  const leftHip = P(pelvis.x - hipHalf, pelvis.y);
  const rightHip = P(pelvis.x + hipHalf, pelvis.y);
  const q = (point) => P(point.x * h, point.y * h);
  const leftKnee = q(pose.lk), rightKnee = q(pose.rk), leftAnkle = q(pose.la), rightAnkle = q(pose.ra);
  const leftToe = q(pose.lt), rightToe = q(pose.rt), leftElbow = q(pose.le), rightElbow = q(pose.re);
  const leftHand = q(pose.lh), rightHand = q(pose.rh);
  const head = P(chest.x + pose.lean * h * .018, chest.y - h * .158);

  drawGroundShadow(h, pose.phase);

  const thighHip = h * .103 * body.thigh;
  const thighBelly = h * .116 * body.thigh;
  const kneeW = h * .073 * body.thigh;
  const calfBelly = h * .082 * body.calf;
  const ankleW = h * .047 * body.calf;
  const leftShortHem = mix(leftHip, leftKnee, .29);
  const rightShortHem = mix(rightHip, rightKnee, .29);
  const leftSockTop = mix(leftKnee, leftAnkle, .38);
  const rightSockTop = mix(rightKnee, rightAnkle, .38);

  drawVolume(leftHip, leftShortHem, thighHip, thighBelly, thighBelly * .94, profile.kit.shortsLight || profile.kit.shorts, profile.kit.shorts, profile.kit.shorts, .1);
  drawVolume(rightHip, rightShortHem, thighHip, thighBelly, thighBelly * .94, profile.kit.shortsLight || profile.kit.shorts, profile.kit.shorts, profile.kit.shorts, .1);
  drawVolume(leftShortHem, leftKnee, thighBelly * .9, thighBelly, kneeW, profile.skin.light, profile.skin.base, profile.skin.shadow, .15);
  drawVolume(rightShortHem, rightKnee, thighBelly * .9, thighBelly, kneeW, profile.skin.light, profile.skin.base, profile.skin.shadow, .15);
  drawJoint(leftKnee, kneeW * .43, kneeW * .38, profile.skin.light, profile.skin.base, profile.skin.shadow);
  drawJoint(rightKnee, kneeW * .43, kneeW * .38, profile.skin.light, profile.skin.base, profile.skin.shadow);
  drawVolume(leftKnee, leftSockTop, kneeW * .92, calfBelly, calfBelly * .92, profile.skin.light, profile.skin.base, profile.skin.shadow, .13);
  drawVolume(rightKnee, rightSockTop, kneeW * .92, calfBelly, calfBelly * .92, profile.skin.light, profile.skin.base, profile.skin.shadow, .13);
  drawVolume(leftSockTop, leftAnkle, calfBelly * .95, calfBelly * 1.03, ankleW, "#ffffff", profile.kit.socks, "#c8d1ce", .22);
  drawVolume(rightSockTop, rightAnkle, calfBelly * .95, calfBelly * 1.03, ankleW, "#ffffff", profile.kit.socks, "#c8d1ce", .22);
  drawBoot(leftAnkle, leftToe, h, profile);
  drawBoot(rightAnkle, rightToe, h, profile);

  drawShortsVolume(pelvis, leftHip, rightHip, h, profile);

  const upperArm = h * .067 * body.chest;
  const upperArmBelly = h * .075 * body.chest;
  const elbowW = h * .052 * body.chest;
  const forearmBelly = h * .058 * body.chest;
  const wristW = h * .035 * body.chest;
  const leftSleeve = mix(leftShoulder, leftElbow, .26);
  const rightSleeve = mix(rightShoulder, rightElbow, .26);

  drawVolume(leftShoulder, leftSleeve, upperArm * 1.18, upperArmBelly, upperArm, profile.kit.shirtLight || profile.kit.shirt, profile.kit.shirt, profile.kit.shirtShadow, .14);
  drawVolume(rightShoulder, rightSleeve, upperArm * 1.18, upperArmBelly, upperArm, profile.kit.shirtLight || profile.kit.shirt, profile.kit.shirt, profile.kit.shirtShadow, .14);
  drawVolume(leftSleeve, leftElbow, upperArm * .92, upperArmBelly, elbowW, profile.skin.light, profile.skin.base, profile.skin.shadow, .14);
  drawVolume(rightSleeve, rightElbow, upperArm * .92, upperArmBelly, elbowW, profile.skin.light, profile.skin.base, profile.skin.shadow, .14);
  drawJoint(leftElbow, elbowW * .42, elbowW * .36, profile.skin.light, profile.skin.base, profile.skin.shadow);
  drawJoint(rightElbow, elbowW * .42, elbowW * .36, profile.skin.light, profile.skin.base, profile.skin.shadow);
  drawVolume(leftElbow, leftHand, elbowW * .9, forearmBelly, wristW, profile.skin.light, profile.skin.base, profile.skin.shadow, .14);
  drawVolume(rightElbow, rightHand, elbowW * .9, forearmBelly, wristW, profile.skin.light, profile.skin.base, profile.skin.shadow, .14);

  drawTorsoVolume(chest, pelvis, h, pose, profile);
  drawHand(leftHand, h, profile, -.12);
  drawHand(rightHand, h, profile, .12);
  drawHeadAndNeck(head, chest, h, profile);
  ctx.restore();

  window.__footballLabMotionSnapshotV45 = {
    build: BUILD,
    character: profile.id,
    phase: pose.phase,
    run: p.run,
    flight: p.flight,
    plantLocked: Boolean(state.animation && !p.replay && p.run >= .72),
    travel: travel(p),
    world: { x: world.x, y: world.y, z: world.z },
    bodyRotation: pose.rotate,
    torsoLean: pose.lean,
    volumetric: true
  };
  transform();
  impactFx(time, p, camera);
}

export function drawHeroCharacterV45(time) {
  if (["stage", "breakdown"].includes(state.presentation?.phase)) return;
  const character = activeCharacter();
  const profile = outfieldVisualProfileV42(character.id);
  const p = progress(time);
  const world = kickerWorld(state.currentStage, travel(p));
  transform();
  drawCharacter(world, currentPose(p, time, profile), time, character, profile, p);
  window.__footballLabHeroFrameV45 = Object.freeze({
    build: BUILD,
    character: profile.id,
    sourceCharacterId: character.id,
    renderer: "volumetric-articulated-2.5d",
    rig: "anatomical-tapered-volume-canvas",
    volumetricBody: true,
    staticSpriteFrames: false,
    active: true,
    time
  });
}

window.__footballLabCharacterRendererV45 = Object.freeze({
  build: BUILD,
  renderer: "volumetric-articulated-2.5d",
  rig: "anatomical-tapered-volume-canvas",
  artDirection: "realistic-athletic-human-proportions",
  volumetricTorso: true,
  anatomicalLimbTaper: true,
  muscleVolume: true,
  groundedDepthShading: true,
  outfieldCharacters: 4,
  staticSpriteFrames: false,
  gameplayPhysicsChanged: false
});
