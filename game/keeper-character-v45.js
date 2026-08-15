import { clamp, easeOutCubic, lerp, state, ctx, canvasView } from "./core-v6.js?v=32.4";
import { buildCamera } from "./world-v7.js?v=32.4";
import { projectWorld, projectedHeight } from "./projection-v6.js?v=32.4";
import { sampleShotPath } from "./physics-v7.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";
import { goalkeeperVisualProfileV42 } from "./character-profiles-v42.js?v=42.1.0";

const BUILD = "45.0.0";
const VIEW = Object.freeze({ width: 1200, height: 720 });
const TAU = Math.PI * 2;
const P = (x, y) => ({ x, y });
const mix = (a, b, t) => P(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
const smooth = (value) => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
let installed = false;
let retryTimer = null;
let retries = 0;

function transform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function motionProgress(time) {
  if (!state.animation) return 0;
  const a = state.animation;
  const elapsed = time - a.startedAt;
  const run = Math.max(1, a.runUpDuration || 1);
  const contact = Math.max(0, a.contactHoldDuration || 0);
  const flightDuration = Math.max(1, a.flightDuration || 1);
  return clamp((elapsed - run - contact) / flightDuration, 0, 1);
}

function cameraForFrame(time) {
  const camera = buildCamera(state.currentStage);
  const flight = motionProgress(time);
  const reduced = document.documentElement.classList.contains("reduced-motion-v22");
  if (state.animation && flight > 0 && !reduced) {
    const follow = easeOutCubic(flight);
    const ball = sampleShotPath(state.shot?.path, flight);
    camera.position.z -= follow * 3.3;
    camera.position.y += follow * .2;
    camera.fovY = lerp(camera.fovY, 31.5, follow * .72);
    if (ball) {
      camera.target.x = lerp(camera.target.x, ball.x, follow * .68);
      camera.target.y = lerp(camera.target.y, ball.y, follow * .56);
      camera.target.z = lerp(camera.target.z, ball.z, follow * (1 - flight) * .42);
    }
  }
  return camera;
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

function drawVolume(a, b, startWidth, midWidth, endWidth, light, base, shadow, highlight = .14) {
  const pad = Math.max(.9, Math.min(startWidth, endWidth) * .065);
  volumePath(a, b, startWidth, midWidth, endWidth, pad);
  ctx.fillStyle = "rgba(1,5,5,.46)";
  ctx.fill();
  const basis = volumePath(a, b, startWidth, midWidth, endWidth);
  const g = ctx.createLinearGradient(
    a.x - basis.nx * basis.maxWidth, a.y - basis.ny * basis.maxWidth,
    a.x + basis.nx * basis.maxWidth, a.y + basis.ny * basis.maxWidth
  );
  g.addColorStop(0, shadow);
  g.addColorStop(.26, base);
  g.addColorStop(.52, light);
  g.addColorStop(.76, base);
  g.addColorStop(1, shadow);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = highlight;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(.8, basis.maxWidth * .038);
  ctx.beginPath();
  ctx.moveTo(a.x + basis.nx * startWidth * .16, a.y + basis.ny * startWidth * .16);
  ctx.quadraticCurveTo(lerp(a.x, b.x, .52) + basis.nx * midWidth * .2, lerp(a.y, b.y, .52) + basis.ny * midWidth * .2, b.x + basis.nx * endWidth * .12, b.y + basis.ny * endWidth * .12);
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

function drawShadow(foot, h, airborne) {
  const alpha = clamp(.24 - airborne * .15, .055, .24);
  ctx.save();
  const radius = h * .22;
  const g = ctx.createRadialGradient(foot.x, foot.y + 3, radius * .06, foot.x, foot.y + 3, radius);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`);
  g.addColorStop(.62, `rgba(0,0,0,${alpha * .38})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.translate(foot.x, foot.y + 3);
  ctx.scale(1, .27);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawGlove(point, h, visual, rotation = 0) {
  const scale = visual.gloves?.scale || 1;
  const rx = h * .031 * scale;
  const ry = h * .038 * scale;
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(rotation);
  const g = ctx.createRadialGradient(-rx * .3, -ry * .35, 1, 0, 0, ry);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(.5, visual.gloves?.base || "#f2f4ef");
  g.addColorStop(1, visual.gloves?.palm || "#bfc8c4");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = visual.gloves?.accent || visual.kit.trim;
  ctx.lineWidth = Math.max(1, h * .006);
  ctx.beginPath();
  ctx.moveTo(-rx * .55, 0);
  ctx.lineTo(rx * .55, 0);
  ctx.stroke();
  ctx.restore();
}

function drawKeeperTorso(chest, pelvis, h, pose, visual) {
  const body = visual.body;
  const shoulder = h * .162 * body.shoulder;
  const rib = h * .145 * body.chest;
  const waist = h * .09 * body.waist;
  const top = chest.y - h * .055;
  const bottom = pelvis.y + h * .052;
  const lean = (pose.torsoLean || 0) * h * .12;
  const g = ctx.createLinearGradient(chest.x - shoulder, top, chest.x + shoulder, bottom);
  g.addColorStop(0, visual.kit.shirtShadow);
  g.addColorStop(.2, visual.kit.shirt);
  g.addColorStop(.48, visual.kit.trim || visual.kit.shirt);
  g.addColorStop(.58, visual.kit.shirt);
  g.addColorStop(1, visual.kit.shirtShadow);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.28)";
  ctx.shadowBlur = Math.max(2, h * .014);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(chest.x - h * .042, top);
  ctx.quadraticCurveTo(chest.x - shoulder * .62, top - h * .018, chest.x - shoulder, chest.y + h * .01);
  ctx.quadraticCurveTo(chest.x - rib * 1.08, chest.y + h * .11, pelvis.x - waist + lean, bottom);
  ctx.quadraticCurveTo(pelvis.x, bottom + h * .026, pelvis.x + waist + lean, bottom);
  ctx.quadraticCurveTo(chest.x + rib * 1.08, chest.y + h * .11, chest.x + shoulder, chest.y + h * .01);
  ctx.quadraticCurveTo(chest.x + shoulder * .62, top - h * .018, chest.x + h * .042, top);
  ctx.quadraticCurveTo(chest.x, top + h * .025, chest.x - h * .042, top);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = .17;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(.8, h * .0045);
  ctx.beginPath();
  ctx.moveTo(chest.x - rib * .65, chest.y + h * .038);
  ctx.quadraticCurveTo(chest.x, chest.y + h * .078, chest.x + rib * .65, chest.y + h * .038);
  ctx.stroke();
  ctx.restore();
  return {
    leftShoulder: P(chest.x - shoulder, chest.y + h * .012),
    rightShoulder: P(chest.x + shoulder, chest.y + h * .012)
  };
}

function drawKeeperShorts(pelvis, leftHip, rightHip, h, visual) {
  const body = visual.body;
  const halfWaist = h * .091 * body.waist;
  const outer = h * .116 * body.thigh;
  const top = pelvis.y - h * .062;
  const hem = pelvis.y + h * .098;
  const g = ctx.createLinearGradient(pelvis.x - outer, top, pelvis.x + outer, hem);
  g.addColorStop(0, visual.kit.shorts);
  g.addColorStop(.5, visual.kit.shirtShadow);
  g.addColorStop(1, visual.kit.shorts);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(pelvis.x - halfWaist, top);
  ctx.quadraticCurveTo(pelvis.x, top - h * .014, pelvis.x + halfWaist, top);
  ctx.lineTo(rightHip.x + outer * .64, hem);
  ctx.quadraticCurveTo(pelvis.x + h * .046, hem + h * .012, pelvis.x, pelvis.y + h * .045);
  ctx.quadraticCurveTo(pelvis.x - h * .046, hem + h * .012, leftHip.x - outer * .64, hem);
  ctx.closePath();
  ctx.fill();
}

function drawKeeperHead(head, chest, h, visual) {
  const body = visual.body;
  const rx = h * .062 * (body.head || 1);
  const ry = h * .076 * (body.head || 1);
  const neckTop = P(head.x, head.y + ry * .6);
  const neckBottom = P(chest.x, chest.y - h * .032);
  drawVolume(neckTop, neckBottom, h * .047 * body.chest, h * .052 * body.chest, h * .055 * body.chest, visual.skin.light, visual.skin.base, visual.skin.shadow, .08);
  const skin = ctx.createRadialGradient(head.x - rx * .28, head.y - ry * .34, 1, head.x, head.y, ry * 1.1);
  skin.addColorStop(0, visual.skin.light);
  skin.addColorStop(.58, visual.skin.base);
  skin.addColorStop(1, visual.skin.shadow);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(head.x, head.y, rx, ry, 0, 0, TAU);
  ctx.fill();
  const hair = ctx.createLinearGradient(head.x - rx, head.y - ry, head.x + rx, head.y);
  hair.addColorStop(0, visual.hair.shadow);
  hair.addColorStop(.52, visual.hair.base);
  hair.addColorStop(1, visual.hair.light);
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(head.x, head.y - ry * .42, rx * .98, ry * .68 * (visual.hair.volume || 1), 0, Math.PI, TAU);
  ctx.quadraticCurveTo(head.x + rx * .9, head.y + ry * .22, head.x + rx * .68, head.y + ry * .34);
  ctx.quadraticCurveTo(head.x, head.y + ry * .08, head.x - rx * .68, head.y + ry * .34);
  ctx.quadraticCurveTo(head.x - rx * .9, head.y + ry * .22, head.x - rx * .98, head.y - ry * .42);
  ctx.fill();
}

function drawKeeper(frame, source, visual, time) {
  if (!frame?.keeper?.world || !frame?.keeper?.pose) return false;
  const keeper = frame.keeper;
  const pose = keeper.pose;
  const world = keeper.world;
  const camera = cameraForFrame(time);
  const visualHeight = Math.max(1.82, Number(source.visualHeight) || 1.9) * 1.18;
  const projection = projectedHeight(world, visualHeight, camera, VIEW);
  if (!projection || projection.height < 10) return false;
  const h = projection.height;
  const foot = projection.foot;
  const body = visual.body;
  const rotation = pose.rotation || 0;

  transform();
  drawShadow(foot, h, Number(world.y) || 0);
  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(rotation);

  const crouch = pose.crouch || 0;
  const pelvis = P(0, -.35 * h + crouch * h * .075);
  const chest = P((pose.chestX || 0) * h, -.66 * h + crouch * h * .085);
  const hipHalf = h * .084 * body.waist;
  const leftHip = P(pelvis.x - hipHalf, pelvis.y);
  const rightHip = P(pelvis.x + hipHalf, pelvis.y);
  const local = (value, fallback) => value ? P(value.x * h, value.y * h) : fallback;
  const localAbsolute = (worldPoint) => {
    if (!worldPoint) return null;
    const projected = projectWorld(worldPoint, camera, VIEW);
    if (!projected.visible) return null;
    const dx = projected.x - foot.x;
    const dy = projected.y - foot.y;
    const c = Math.cos(-rotation);
    const s = Math.sin(-rotation);
    return P(dx * c - dy * s, dx * s + dy * c);
  };

  const leftKnee = local(pose.leftKnee, P(-.18 * h, -.14 * h));
  const rightKnee = local(pose.rightKnee, P(.18 * h, -.14 * h));
  const leftAnkle = local(pose.leftAnkle, P(-.22 * h, -.01 * h));
  const rightAnkle = local(pose.rightAnkle, P(.22 * h, -.01 * h));
  const leftToe = local(pose.leftToe, P(leftAnkle.x - h * .065, leftAnkle.y));
  const rightToe = local(pose.rightToe, P(rightAnkle.x + h * .065, rightAnkle.y));

  const thighHip = h * .105 * body.thigh;
  const thighBelly = h * .118 * body.thigh;
  const kneeW = h * .075 * body.thigh;
  const calfBelly = h * .084 * body.calf;
  const ankleW = h * .049 * body.calf;
  const leftShortHem = mix(leftHip, leftKnee, .3);
  const rightShortHem = mix(rightHip, rightKnee, .3);
  const leftSockTop = mix(leftKnee, leftAnkle, .34);
  const rightSockTop = mix(rightKnee, rightAnkle, .34);

  drawVolume(leftHip, leftShortHem, thighHip, thighBelly, thighBelly * .94, visual.kit.shirtShadow, visual.kit.shorts, visual.kit.shirtShadow, .1);
  drawVolume(rightHip, rightShortHem, thighHip, thighBelly, thighBelly * .94, visual.kit.shirtShadow, visual.kit.shorts, visual.kit.shirtShadow, .1);
  drawVolume(leftShortHem, leftKnee, thighBelly * .9, thighBelly, kneeW, visual.skin.light, visual.skin.base, visual.skin.shadow, .12);
  drawVolume(rightShortHem, rightKnee, thighBelly * .9, thighBelly, kneeW, visual.skin.light, visual.skin.base, visual.skin.shadow, .12);
  drawJoint(leftKnee, kneeW * .43, kneeW * .38, visual.skin.light, visual.skin.base, visual.skin.shadow);
  drawJoint(rightKnee, kneeW * .43, kneeW * .38, visual.skin.light, visual.skin.base, visual.skin.shadow);
  drawVolume(leftKnee, leftSockTop, kneeW * .92, calfBelly, calfBelly * .92, visual.skin.light, visual.skin.base, visual.skin.shadow, .11);
  drawVolume(rightKnee, rightSockTop, kneeW * .92, calfBelly, calfBelly * .92, visual.skin.light, visual.skin.base, visual.skin.shadow, .11);
  drawVolume(leftSockTop, leftAnkle, calfBelly * .95, calfBelly, ankleW, visual.kit.trim, visual.kit.socks, visual.kit.shirtShadow, .14);
  drawVolume(rightSockTop, rightAnkle, calfBelly * .95, calfBelly, ankleW, visual.kit.trim, visual.kit.socks, visual.kit.shirtShadow, .14);
  drawVolume(leftAnkle, leftToe, ankleW * 1.3, ankleW * 1.45, ankleW * .8, "#202824", "#080d0a", "#020403", .08);
  drawVolume(rightAnkle, rightToe, ankleW * 1.3, ankleW * 1.45, ankleW * .8, "#202824", "#080d0a", "#020403", .08);

  drawKeeperShorts(pelvis, leftHip, rightHip, h, visual);
  const shoulders = drawKeeperTorso(chest, pelvis, h, pose, visual);

  const leftHand = localAbsolute(pose.absoluteLeftHand) || local(pose.leftHand, P(-.4 * h, -.49 * h));
  const rightHand = localAbsolute(pose.absoluteRightHand) || local(pose.rightHand, P(.4 * h, -.49 * h));
  const leftElbow = P(lerp(shoulders.leftShoulder.x, leftHand.x, .5) - h * .035, lerp(shoulders.leftShoulder.y, leftHand.y, .5) + h * .018);
  const rightElbow = P(lerp(shoulders.rightShoulder.x, rightHand.x, .5) + h * .035, lerp(shoulders.rightShoulder.y, rightHand.y, .5) + h * .018);
  const upperArm = h * .071 * body.chest;
  const upperBelly = h * .079 * body.chest;
  const elbowW = h * .055 * body.chest;
  const forearm = h * .063 * body.chest;
  const wrist = h * .039 * body.chest;

  drawVolume(shoulders.leftShoulder, leftElbow, upperArm * 1.18, upperBelly, elbowW, visual.kit.trim, visual.kit.shirt, visual.kit.shirtShadow, .13);
  drawVolume(shoulders.rightShoulder, rightElbow, upperArm * 1.18, upperBelly, elbowW, visual.kit.trim, visual.kit.shirt, visual.kit.shirtShadow, .13);
  drawVolume(leftElbow, leftHand, elbowW, forearm, wrist, visual.kit.trim, visual.kit.shirt, visual.kit.shirtShadow, .12);
  drawVolume(rightElbow, rightHand, elbowW, forearm, wrist, visual.kit.trim, visual.kit.shirt, visual.kit.shirtShadow, .12);
  drawGlove(leftHand, h, visual, -.08);
  drawGlove(rightHand, h, visual, .08);

  const head = P(chest.x + (pose.torsoLean || 0) * h * .02, chest.y - h * .16);
  drawKeeperHead(head, chest, h, visual);
  ctx.restore();

  window.__footballLabKeeperFrameV45 = Object.freeze({
    build: BUILD,
    character: visual.id,
    sourceKeeperId: source.id,
    renderer: "volumetric-articulated-2.5d",
    rig: "anatomical-tapered-volume-goalkeeper",
    volumetricBody: true,
    staticSpriteFrames: false,
    sceneDepth: true,
    motion: pose.motion || "READY",
    airborne: Boolean(Number(world.y) > .02),
    time
  });
  window.__footballLabKeeperFrameV44 = Object.freeze({
    build: "44.0.0",
    character: visual.id,
    sourceKeeperId: source.id,
    renderer: "articulated-layered-2.5d",
    rig: "continuous-goalkeeper-skeletal-canvas",
    staticSpriteFrames: false,
    sceneDepth: true,
    motion: pose.motion || "READY",
    airborne: Boolean(Number(world.y) > .02),
    upgradedBy: BUILD,
    time
  });
  return true;
}

function installNow() {
  if (installed) return true;
  const originalSceneDraw = window.__footballLabPremiumKeeperSceneDrawV3852;
  if (typeof originalSceneDraw !== "function") return false;

  window.__footballLabPremiumKeeperSceneDrawV3852 = function footballLabKeeperSceneV45(time) {
    ctx.save();
    const alpha = ctx.globalAlpha;
    ctx.globalAlpha = 0;
    const result = originalSceneDraw(time);
    ctx.globalAlpha = alpha;
    ctx.restore();

    const source = keeperForStage(state.stage);
    const visual = goalkeeperVisualProfileV42(source.id);
    const frame = window.__footballLabPremiumKeeperSceneFrameV3852;
    if (!drawKeeper(frame, source, visual, time)) return originalSceneDraw(time);
    return result;
  };

  installed = true;
  clearTimeout(retryTimer);
  retryTimer = null;
  window.__footballLabKeeperRendererV45 = Object.freeze({
    build: BUILD,
    renderer: "volumetric-articulated-2.5d",
    rig: "anatomical-tapered-volume-goalkeeper",
    artDirection: "realistic-athletic-human-proportions",
    goalkeeperCharacters: 4,
    volumetricTorso: true,
    anatomicalLimbTaper: true,
    sceneDepthPreserved: true,
    keeperAIChanged: false,
    shotOutcomeChanged: false,
    staticSpriteFrames: false
  });
  window.__footballLabKeeperRendererV44 = Object.freeze({
    build: "44.0.0",
    renderer: "articulated-layered-2.5d",
    rig: "continuous-goalkeeper-skeletal-canvas",
    goalkeeperCharacters: 4,
    goalkeeperArchetypes: 5,
    staticSpriteFrames: false,
    spriteAtlasRequired: false,
    sceneDepthPreserved: true,
    keeperAIChanged: false,
    shotOutcomeChanged: false,
    upgradedBy: BUILD
  });
  return true;
}

function retryInstall() {
  if (installNow() || retries >= 100) return;
  retries += 1;
  retryTimer = setTimeout(retryInstall, 100);
}

export function installKeeperCharacterV45() {
  if (installNow()) return true;
  retryInstall();
  return false;
}

if (typeof window !== "undefined") installKeeperCharacterV45();
