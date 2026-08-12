import { clamp, lerp, WORLD, state, ctx, canvasView, easeInOutCubic, easeOutCubic } from "./core-v6.js?v=32.4";
import { buildCamera, kickerWorld, ballWorld } from "./world-v7.js?v=32.4";
import { projectedHeight, projectWorld } from "./projection-v6.js?v=32.4";
import { activeCharacter } from "./characters-v13.js?v=32.4";

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
const recover = { ...idle, phase: "recovery", crouch: .04, pelvisX: -.01, chestX: .012, lean: .01, rotate: .012 };

function blend(a, b, t, phase = b.phase) {
  const j = (key) => mix(a[key], b[key], t);
  return {
    phase, crouch: lerp(a.crouch, b.crouch, t), pelvisX: lerp(a.pelvisX, b.pelvisX, t),
    chestX: lerp(a.chestX, b.chestX, t), lean: lerp(a.lean, b.lean, t),
    rotate: lerp(a.rotate, b.rotate, t), shoulder: lerp(a.shoulder, b.shoulder, t),
    lk: j("lk"), rk: j("rk"), la: j("la"), ra: j("ra"), lt: j("lt"), rt: j("rt"),
    le: j("le"), re: j("re"), lh: j("lh"), rh: j("rh")
  };
}

function runPose(run, time) {
  if (run < .56) {
    const t = run / .56;
    const s = Math.sin(t * Math.PI * 4.5);
    const l = Math.max(0, s), r = Math.max(0, -s);
    return {
      phase: "approach", crouch: .032 + Math.abs(s) * .02, pelvisX: s * .018, chestX: -s * .012,
      lean: -.045 - t * .075, rotate: s * .02, shoulder: -s * .025,
      lk: P(-.105 - s * .085, -.17 - l * .075), rk: P(.105 + s * .085, -.17 - r * .075),
      la: P(-.13 - s * .115, -.006 - l * .045), ra: P(.13 + s * .115, -.006 - r * .045),
      lt: P(-.19 - s * .12, -.002 - l * .035), rt: P(.19 + s * .12, -.002 - r * .035),
      le: P(-.22 + s * .06, -.54 - s * .025), re: P(.22 + s * .06, -.54 + s * .025),
      lh: P(-.29 + s * .085, -.43 - s * .045), rh: P(.29 + s * .085, -.43 + s * .045),
      breathe: Math.sin(time / 480) * .004
    };
  }
  if (run < .72) return blend(runPose(.559, time), step, smooth((run - .56) / .16));
  if (run < .9) return blend(step, windup, smooth((run - .72) / .18));
  return blend(windup, contact, smooth((run - .9) / .1));
}

function currentPose(p, time) {
  if (!state.animation) return { ...idle, crouch: idle.crouch + Math.sin(time / 520) * .008 };
  if (p.replay) {
    if (p.flight < .22) return blend(contact, follow, smooth(p.flight / .22));
    if (p.flight < .5) return { ...follow, phase: "follow-through-hold" };
    return blend(follow, recover, smooth((p.flight - .5) / .5));
  }
  if (p.contact > 0 && p.flight <= 0) return contact;
  if (p.flight > 0 || p.settle > 0) {
    if (p.flight < .22) return blend(contact, follow, smooth(p.flight / .22));
    if (p.flight < .48) return { ...follow, phase: "follow-through-hold" };
    return blend(follow, recover, Math.max(smooth((p.flight - .48) / .42), p.settle));
  }
  return runPose(p.run, time);
}

function travel(p) {
  if (!state.animation) return 0;
  if (p.replay) return 1;
  return easeInOutCubic(clamp(p.run / .72, 0, 1));
}

function tapered(a, b, wa, wb, c1, c2 = c1) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len, ny = dx / len;
  const shape = (pad, fill) => {
    ctx.fillStyle = fill; ctx.beginPath();
    ctx.moveTo(a.x + nx * (wa / 2 + pad), a.y + ny * (wa / 2 + pad));
    ctx.lineTo(b.x + nx * (wb / 2 + pad), b.y + ny * (wb / 2 + pad));
    ctx.quadraticCurveTo(b.x + dx * .03, b.y + dy * .03, b.x - nx * (wb / 2 + pad), b.y - ny * (wb / 2 + pad));
    ctx.lineTo(a.x - nx * (wa / 2 + pad), a.y - ny * (wa / 2 + pad));
    ctx.quadraticCurveTo(a.x - dx * .03, a.y - dy * .03, a.x + nx * (wa / 2 + pad), a.y + ny * (wa / 2 + pad));
    ctx.closePath(); ctx.fill();
  };
  shape(Math.max(1.3, Math.min(wa, wb) * .18), "rgba(2,7,4,.92)");
  const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y); g.addColorStop(0, c1); g.addColorStop(1, c2); shape(0, g);
}

function joint(p, r, colour) {
  ctx.fillStyle = "rgba(2,7,4,.88)"; ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 1.12, r, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = colour; ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * .88, 0, 0, TAU); ctx.fill();
}

function boot(ankle, toe, width, accent) {
  const dx = toe.x - ankle.x, dy = toe.y - ankle.y, len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len, ny = dx / len, heel = mix(ankle, toe, .05), front = mix(ankle, toe, 1.1), half = width * .5;
  ctx.fillStyle = "rgba(1,5,3,.95)"; ctx.beginPath();
  ctx.moveTo(heel.x + nx * (half + 1.4), heel.y + ny * (half + 1.4));
  ctx.lineTo(front.x + nx * (half * .72 + 1.4), front.y + ny * (half * .72 + 1.4));
  ctx.lineTo(front.x - nx * (half * .72 + 1.4), front.y - ny * (half * .72 + 1.4));
  ctx.lineTo(heel.x - nx * (half + 1.4), heel.y - ny * (half + 1.4)); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(heel.x, heel.y, front.x, front.y);
  g.addColorStop(0, "#cbd4d0"); g.addColorStop(.35, "#f5f8f3"); g.addColorStop(.78, "#fff"); g.addColorStop(1, "#c7d0cc");
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(heel.x + nx * half, heel.y + ny * half); ctx.lineTo(front.x + nx * half * .7, front.y + ny * half * .7);
  ctx.lineTo(front.x - nx * half * .7, front.y - ny * half * .7); ctx.lineTo(heel.x - nx * half, heel.y - ny * half); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = Math.max(1.1, width * .12); ctx.beginPath();
  const a = mix(heel, front, .28), b = mix(heel, front, .82); ctx.moveTo(a.x - nx * half * .55, a.y - ny * half * .55); ctx.lineTo(b.x - nx * half * .42, b.y - ny * half * .42); ctx.stroke();
}

function torso(chest, pelvis, h, pose, shirt, character) {
  const top = h * .125, bottom = h * .09, topY = chest.y - h * .035, bottomY = pelvis.y + h * .055, skew = pose.lean * h * .18;
  ctx.fillStyle = "rgba(2,7,4,.94)"; ctx.beginPath();
  ctx.moveTo(chest.x - top - 2, topY - 2); ctx.lineTo(chest.x + top + 2, topY - 2);
  ctx.lineTo(pelvis.x + bottom + skew + 2, bottomY + 2); ctx.lineTo(pelvis.x - bottom + skew - 2, bottomY + 2); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(chest.x - top, topY, pelvis.x + bottom, bottomY);
  g.addColorStop(0, "#718d1d"); g.addColorStop(.36, shirt); g.addColorStop(.66, "#e8ff68"); g.addColorStop(1, "#718d1d");
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(chest.x - top, topY); ctx.quadraticCurveTo(chest.x, topY - h * .018, chest.x + top, topY);
  ctx.lineTo(pelvis.x + bottom + skew, bottomY); ctx.quadraticCurveTo(pelvis.x, bottomY + h * .012, pelvis.x - bottom + skew, bottomY); ctx.closePath(); ctx.fill();
  const centre = mix(chest, pelvis, .5), name = character.name.split(" ").at(-1) || "PLAYER";
  ctx.fillStyle = "#0a120d"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(5.8, h * .042)}px system-ui`; ctx.fillText(name.slice(0, 10), centre.x + skew * .3, centre.y - h * .055);
  ctx.font = `1000 ${Math.max(10, h * .108)}px system-ui`; ctx.fillText(String(character.number), centre.x + skew * .45, centre.y + h * .035);
}

function impactFx(time, p, camera) {
  if (!state.animation || p.replay) return;
  const when = (state.animation.runUpDuration || 0) + (state.animation.contactHoldDuration || 0);
  const delta = p.elapsed - when;
  if (delta < -35 || delta > 145) return;
  const ball = projectWorld(ballWorld(state.currentStage), camera, VIEW); if (!ball.visible) return;
  const strength = 1 - clamp((delta + 35) / 180, 0, 1);
  ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.strokeStyle = `rgba(232,193,56,${.8 * strength})`; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(ball.x, ball.y, 7 + (1 - strength) * 20, 0, TAU); ctx.stroke();
  for (let i = 0; i < 7; i += 1) { const a = -1.45 + i * .39; ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + Math.cos(a) * (14 + (1 - strength) * 24), ball.y + Math.sin(a) * (10 + (1 - strength) * 18)); ctx.stroke(); }
  ctx.restore();
}

function draw(world, pose, time, character, p) {
  const camera = frameCamera(time), projection = projectedHeight(world, 1.9, camera, VIEW); if (!projection) return;
  const h = projection.height, foot = projection.foot, skin = "#9b6749", skinLight = "#bb7d59", skinDark = "#70442f";
  const shirt = character.accent, shorts = "#111722", shortsLight = "#263140", sock = "#17202c", hair = "#101712";
  ctx.save(); ctx.translate(foot.x, foot.y); ctx.rotate(pose.rotate || 0);
  const pelvis = P(pose.pelvisX * h, -.35 * h + pose.crouch * h * .08), chest = P(pose.chestX * h, -.665 * h + pose.crouch * h * .09);
  const headR = h * .069, head = P(chest.x, chest.y - h * .146), sh = h * .122, hip = h * .073, tilt = pose.shoulder * h;
  const ls = P(chest.x - sh, chest.y + h * .012 + tilt), rs = P(chest.x + sh, chest.y + h * .012 - tilt);
  const lh = P(pelvis.x - hip, pelvis.y), rh = P(pelvis.x + hip, pelvis.y), q = (v) => P(v.x * h, v.y * h);
  const lk = q(pose.lk), rk = q(pose.rk), la = q(pose.la), ra = q(pose.ra), lt = q(pose.lt), rt = q(pose.rt), le = q(pose.le), re = q(pose.re), lhand = q(pose.lh), rhand = q(pose.rh);
  ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(0, 5, h * (pose.phase.includes("follow") ? .22 : .185), h * .04, -pose.rotate * .2, 0, TAU); ctx.fill();
  if (["final-step", "wind-up", "contact"].includes(pose.phase)) { ctx.fillStyle = "rgba(12,45,23,.46)"; ctx.beginPath(); ctx.ellipse(la.x, la.y + h * .008, h * .065, h * .015, -.12, 0, TAU); ctx.fill(); }
  const tw = Math.max(6.2, h * .067), kw = Math.max(5.1, h * .055), sw = Math.max(4.5, h * .049);
  const lse = mix(lh, lk, .43), rse = mix(rh, rk, .43), lst = mix(lk, la, .3), rst = mix(rk, ra, .3);
  tapered(lh, lse, tw * 1.08, tw, shortsLight, shorts); tapered(rh, rse, tw * 1.08, tw, shortsLight, shorts);
  tapered(lse, lk, tw * .84, kw, skinDark, skin); tapered(rse, rk, tw * .84, kw, skinDark, skin); joint(lk, kw * .48, skin); joint(rk, kw * .48, skin);
  tapered(lk, lst, kw * .9, sw, skin, skinDark); tapered(rk, rst, kw * .9, sw, skin, skinDark); tapered(lst, la, sw * 1.05, sw * .82, sock, "#0e151f"); tapered(rst, ra, sw * 1.05, sw * .82, sock, "#0e151f");
  ctx.strokeStyle = shirt; ctx.lineWidth = Math.max(1.5, h * .014); for (const s of [lst, rst]) { ctx.beginPath(); ctx.moveTo(s.x - h * .026, s.y); ctx.lineTo(s.x + h * .026, s.y); ctx.stroke(); }
  boot(la, lt, tw * .9, shirt); boot(ra, rt, tw * .9, shirt);
  const aw = Math.max(4.7, h * .05), lsl = mix(ls, le, .31), rsl = mix(rs, re, .31);
  tapered(ls, lsl, aw * 1.1, aw * .95, "#718d1d", shirt); tapered(rs, rsl, aw * 1.1, aw * .95, "#718d1d", shirt);
  tapered(lsl, le, aw * .82, aw * .7, skinDark, skin); tapered(le, lhand, aw * .69, aw * .5, skin, skinLight); tapered(rsl, re, aw * .82, aw * .7, skinDark, skin); tapered(re, rhand, aw * .69, aw * .5, skin, skinLight);
  joint(le, aw * .33, skin); joint(re, aw * .33, skin); torso(chest, pelvis, h, pose, shirt, character);
  ctx.save(); ctx.translate(pelvis.x, pelvis.y - h * .012); const sg = ctx.createLinearGradient(-h * .1, 0, h * .1, 0); sg.addColorStop(0, "#0d121b"); sg.addColorStop(.55, shorts); sg.addColorStop(1, shortsLight); ctx.fillStyle = sg; ctx.fillRect(-h * .098, -h * .062, h * .196, h * .124); ctx.fillStyle = shirt; ctx.fillRect(-h * .007, -h * .059, h * .014, h * .112); ctx.restore();
  joint(lhand, aw * .4, skinLight); joint(rhand, aw * .4, skinLight); tapered(P(chest.x, chest.y - h * .028), P(head.x, head.y + headR * .72), h * .054, h * .047, skinDark, skin);
  const face = ctx.createRadialGradient(head.x - headR * .35, head.y - headR * .38, headR * .1, head.x, head.y, headR); face.addColorStop(0, skinLight); face.addColorStop(.62, skin); face.addColorStop(1, skinDark); joint(head, headR, face);
  ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(head.x, head.y - headR * .11, headR * .91, Math.PI, TAU); ctx.lineTo(head.x + headR * .62, head.y + headR * .03); ctx.quadraticCurveTo(head.x, head.y - headR * .02, head.x - headR * .62, head.y + headR * .03); ctx.closePath(); ctx.fill();
  ctx.restore();
  window.__footballLabMotionSnapshotV173 = { phase: pose.phase, run: p.run, flight: p.flight, plantLocked: Boolean(state.animation && !p.replay && p.run >= .72), travel: travel(p), world: { x: world.x, y: world.y, z: world.z }, leftAnkle: { ...pose.la }, rightAnkle: { ...pose.ra }, bodyRotation: pose.rotate, torsoLean: pose.lean };
  transform(); impactFx(time, p, camera);
}

export function drawHeroKicker(time) {
  const character = activeCharacter(); if (character.id !== "dax-ryder") return;
  if (["stage", "breakdown"].includes(state.presentation?.phase)) return;
  const p = progress(time), world = kickerWorld(state.currentStage, travel(p));
  transform(); draw(world, currentPose(p, time), time, character, p);
}

window.__footballLabHeroArtV172 = true;
window.__footballLabMotionV173 = true;
