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
  if (p.flight > 0 && !document.documentElement.classList.contains("reduced-motion-v22")) {
    const follow = easeOutCubic(p.flight);
    camera.position.z -= follow;
    camera.position.y -= follow * 0.08;
    camera.target.y += follow * 0.08;
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
  phase: "final-step", crouch: .062, pelvisX: .006, chestX: -.018, lean: -.102, rotate: -.024, shoulder: -.018,
  lk: P(-.16, -.14), rk: P(.145, -.215), la: P(-.21, -.006), ra: P(.19, -.105),
  lt: P(-.268, -.002), rt: P(.245, -.078), le: P(-.272, -.538), re: P(.252, -.575),
  lh: P(-.345, -.46), rh: P(.334, -.5)
};
const windup = {
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
const contact = {
  phase: "contact", crouch: .058, pelvisX: -.012, chestX: .046, lean: -.022, rotate: .052, shoulder: .06,
  lk: P(-.16, -.135), rk: P(.04, -.215), la: P(-.21, -.006), ra: P(-.045, -.235),
  lt: P(-.268, -.002), rt: P(-.13, -.21), le: P(-.3, -.485), re: P(.34, -.545),
  lh: P(-.37, -.355), rh: P(.42, -.44)
};
const follow = {
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
const recover = {
  phase: "recovery-step", crouch: .052, pelvisX: -.025, chestX: .028, lean: .032, rotate: .034, shoulder: .018,
  lk: P(-.135, -.155), rk: P(.025, -.19), la: P(-.205, -.006), ra: P(.105, -.018),
  lt: P(-.275, -.002), rt: P(.18, -.004), le: P(-.22, -.48), re: P(.245, -.5),
  lh: P(-.275, -.37), rh: P(.315, -.41)
};
const neutral = { ...idle, phase: "recovery-neutral", crouch: .034, lean: 0, rotate: .004 };

const VISUALS = Object.freeze({
  "dax-ryder": Object.freeze({ height: 1.93, skin: "#9b6749", skinLight: "#bb7d59", skinDark: "#70442f", shorts: "#111722", shortsLight: "#263140", sock: "#17202c", hair: "#101712" }),
  "leo-vale": Object.freeze({ height: 1.88, skin: "#b97955", skinLight: "#d69770", skinDark: "#7e4c36", shorts: "#0b1e28", shortsLight: "#183c4d", sock: "#102934", hair: "#18130f" }),
  "zion-arc": Object.freeze({ height: 1.9, skin: "#c38a68", skinLight: "#dda381", skinDark: "#895a43", shorts: "#24131f", shortsLight: "#4a263d", sock: "#2c1826", hair: "#2a1711" }),
  "kai-mori": Object.freeze({ height: 1.92, skin: "#70462f", skinLight: "#936247", skinDark: "#4b2c20", shorts: "#171429", shortsLight: "#312957", sock: "#201b38", hair: "#080b09" })
});

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

function currentPose(p, time) {
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

function travel(p) {
  if (!state.animation) return 0;
  if (p.replay) return 1;
  // V39.1: the root reaches its final position exactly as the support foot plants.
  const t = clamp(p.run / .73, 0, 1);
  if (t < .62) return smooth(t / .62) * .54;
  return .54 + easeOutCubic((t - .62) / .38) * .46;
}

function copyPose(base) {
  const pose = { ...base };
  for (const key of ["lk", "rk", "la", "ra", "lt", "rt", "le", "re", "lh", "rh"]) {
    if (base[key]) pose[key] = { ...base[key] };
  }
  return pose;
}

function specialistPose(base, character, p) {
  const pose = copyPose(base);
  if (!state.animation || p.replay) return pose;
  const load = smooth(clamp((p.run - .5) / .5, 0, 1));
  const release = smooth(clamp(p.flight / .28, 0, 1));

  if (character.id === "dax-ryder") {
    pose.crouch *= 1.12;
    pose.lean *= 1.15;
    pose.rotate *= 1.18;
    pose.shoulder *= 1.12;
    if (p.flight > 0 && p.flight < .34) {
      pose.ra.x -= .02 * release;
      pose.ra.y -= .012 * release;
      pose.rt.x -= .028 * release;
      pose.chestX += .014 * release;
      pose.shoulder += .018 * release;
    }
  } else if (character.id === "leo-vale") {
    pose.crouch *= .88;
    pose.lean *= .82;
    pose.rotate *= .72;
    pose.shoulder *= .78;
    pose.pelvisX *= .78;
    pose.lh.x *= .9;
    pose.rh.x *= .9;
  } else if (character.id === "zion-arc") {
    const bend = clamp(state.shot?.curve || 0, -1, 1);
    const whip = load * (.55 + Math.abs(bend) * .45);
    pose.rotate += bend * .082 * whip;
    pose.chestX += bend * .035 * whip;
    pose.shoulder += bend * .045 * whip;
    pose.lh.x -= .035 * whip;
    pose.rh.x += .055 * whip;
    if (p.flight > 0 && p.flight < .38) pose.rt.x -= bend * .065 * release;
  } else if (character.id === "kai-mori") {
    pose.crouch *= .92;
    pose.lean *= .88;
    pose.rotate *= .84;
    pose.shoulder *= .72;
    pose.pelvisX *= .82;
    pose.chestX *= .82;
    if (p.flight > .25) {
      pose.lh.x = lerp(pose.lh.x, -.275, release);
      pose.rh.x = lerp(pose.rh.x, .315, release);
    }
  }

  if (p.settle > 0) {
    const reaction = smooth(Math.sin(clamp(p.settle, 0, 1) * Math.PI));
    if (state.shot?.outcome === "GOAL") {
      pose.phase = "goal-reaction";
      pose.crouch -= reaction * .018;
      pose.lean = lerp(pose.lean, -.02, reaction);
      if (character.id === "dax-ryder") {
        pose.rh = mix(pose.rh, P(.22, -.82), reaction);
        pose.re = mix(pose.re, P(.16, -.69), reaction);
        pose.lh = mix(pose.lh, P(-.34, -.42), reaction);
      } else if (character.id === "leo-vale") {
        pose.lh = mix(pose.lh, P(-.42, -.53), reaction);
        pose.rh = mix(pose.rh, P(.42, -.53), reaction);
        pose.rotate *= .25;
      } else if (character.id === "zion-arc") {
        pose.lh = mix(pose.lh, P(-.55, -.58), reaction);
        pose.rh = mix(pose.rh, P(.55, -.58), reaction);
        pose.le = mix(pose.le, P(-.36, -.6), reaction);
        pose.re = mix(pose.re, P(.36, -.6), reaction);
      } else {
        pose.rh = mix(pose.rh, P(.18, -.6), reaction);
        pose.lh = mix(pose.lh, P(-.18, -.6), reaction);
        pose.crouch += reaction * .012;
      }
    } else {
      pose.phase = state.shot?.outcome === "SAVE" ? "save-reaction" : "miss-reaction";
      pose.lean = lerp(pose.lean, .04, reaction);
      pose.lh = mix(pose.lh, P(-.2, -.3), reaction);
      pose.rh = mix(pose.rh, P(.2, -.3), reaction);
      pose.rotate *= 1 - reaction * .6;
    }
  }
  return pose;
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
  const visual = VISUALS[character.id] || VISUALS["dax-ryder"];
  const camera = frameCamera(time), projection = projectedHeight(world, visual.height, camera, VIEW); if (!projection) return;
  const h = projection.height, foot = projection.foot, skin = visual.skin, skinLight = visual.skinLight, skinDark = visual.skinDark;
  const shirt = character.accent, shorts = visual.shorts, shortsLight = visual.shortsLight, sock = visual.sock, hair = visual.hair;
  ctx.save(); ctx.translate(foot.x, foot.y); ctx.rotate(pose.rotate || 0);
  const pelvis = P(pose.pelvisX * h, -.35 * h + pose.crouch * h * .08), chest = P(pose.chestX * h, -.665 * h + pose.crouch * h * .09);
  const headR = h * .069, head = P(chest.x, chest.y - h * .146), sh = h * .122, hip = h * .073, tilt = pose.shoulder * h;
  const ls = P(chest.x - sh, chest.y + h * .012 + tilt), rs = P(chest.x + sh, chest.y + h * .012 - tilt);
  const lh = P(pelvis.x - hip, pelvis.y), rh = P(pelvis.x + hip, pelvis.y), q = (v) => P(v.x * h, v.y * h);
  const lk = q(pose.lk), rk = q(pose.rk), la = q(pose.la), ra = q(pose.ra), lt = q(pose.lt), rt = q(pose.rt), le = q(pose.le), re = q(pose.re), lhand = q(pose.lh), rhand = q(pose.rh);
  const groundedPhase = ["final-step", "wind-up", "hip-drive", "lower-leg-snap", "contact", "follow-through"].includes(pose.phase);
  const shadowWidth = h * (pose.phase.includes("follow") || pose.phase.includes("recovery") ? .205 : .178);
  ctx.fillStyle = groundedPhase ? "rgba(0,0,0,.29)" : "rgba(0,0,0,.21)"; ctx.beginPath(); ctx.ellipse(0, 5, shadowWidth, h * (groundedPhase ? .043 : .036), -pose.rotate * .18, 0, TAU); ctx.fill();
  if (["final-step", "wind-up", "hip-drive", "lower-leg-snap", "contact", "follow-through"].includes(pose.phase)) { ctx.fillStyle = "rgba(10,39,20,.62)"; ctx.beginPath(); ctx.ellipse(la.x, la.y + h * .008, h * .072, h * .018, -.12, 0, TAU); ctx.fill(); }
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
  window.__footballLabMotionSnapshotV173 = { phase: pose.phase, run: p.run, flight: p.flight, plantLocked: Boolean(state.animation && !p.replay && p.run >= .73 && p.flight < .18), rootLocked: Boolean(state.animation && !p.replay && p.run >= .73), hipDrive: pose.phase === "hip-drive", legSnap: pose.phase === "lower-leg-snap", crossStep: pose.phase === "recovery-cross-step", shoulderCounterRotation: true, travel: travel(p), world: { x: world.x, y: world.y, z: world.z }, leftAnkle: { ...pose.la }, rightAnkle: { ...pose.ra }, bodyRotation: pose.rotate, torsoLean: pose.lean, build: "39.1.0" };
  transform(); // V38.7.2: ball-shaped contact ring retired; base renderer owns ball/contact readability.
}

export function drawHeroKicker(time) {
  const character = activeCharacter();
  if (["stage", "breakdown"].includes(state.presentation?.phase)) return;
  const p = progress(time), world = kickerWorld(state.currentStage, travel(p));
  const pose = specialistPose(currentPose(p, time), character, p);
  window.__footballLabHeroFrameV30 = { time, character: character.id, style: character.role, active: true };
  transform(); draw(world, pose, time, character, p);
}

window.__footballLabHeroArtV30 = true;
window.__footballLabMotionV30 = true;

window.__footballLabCharacterMotionV39 = Object.freeze({ build: "39.1.0", approach: "accelerating-short-final-stride", plant: "root-and-support-foot-locked-through-contact", strike: "hip-drive-then-lower-leg-snap", followThrough: "controlled-cross-body-shoulder-counter-rotation-recovery-step", grounded: true });
window.__footballLabCharacterMotionV391 = window.__footballLabCharacterMotionV39;
