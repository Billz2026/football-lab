import { clamp, easeOutCubic, WORLD, state, ctx, canvasView } from "./core-v6.js?v=31";
import { buildCamera } from "./world-v7.js?v=31";
import { projectWorld } from "./projection-v6.js?v=31";
import { sampleShotPath } from "./physics-v7.js?v=31";
import { activeCharacter } from "./characters-v13.js?v=31";

const VIEW = { width: WORLD.width, height: WORLD.height };
const TAU = Math.PI * 2;

function applyTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function smooth(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function progressAt(time) {
  if (!state.animation) return { elapsed: 0, flight: 0, settle: 0, replay: false };
  const animation = state.animation;
  const elapsed = time - animation.startedAt;
  const flightStart = (animation.runUpDuration || 0) + (animation.contactHoldDuration || 0);
  const flightDuration = Math.max(1, animation.flightDuration || 1);
  const flight = clamp((elapsed - flightStart) / flightDuration, 0, 1);
  return {
    elapsed,
    flight,
    settle: clamp((elapsed - flightStart - flightDuration) / Math.max(1, animation.settleDuration || 1), 0, 1),
    replay: Boolean(animation.isReplay)
  };
}

function impactRatio() {
  if (!state.shot?.path?.length) return 0.94;
  if (Number.isInteger(state.shot.impactIndex)) {
    return clamp(state.shot.impactIndex / Math.max(1, state.shot.path.length - 1), 0.1, 0.99);
  }
  return 0.94;
}

function cameraForFrame(progress) {
  const camera = buildCamera(state.currentStage);
  if (progress.flight > 0) {
    const follow = easeOutCubic(progress.flight);
    const ball = sampleShotPath(state.shot?.path, progress.flight);
    camera.position.z -= follow;
    camera.position.y -= follow * 0.08;
    camera.target.y += follow * 0.08;
    if (ball) {
      camera.target.x += (ball.x - camera.target.x) * follow * 0.24;
      camera.target.y += (ball.y - camera.target.y) * follow * 0.2;
    }
  }
  return camera;
}

function impactPoint(progress) {
  const path = state.shot?.path;
  if (!path?.length) return null;
  const index = Number.isInteger(state.shot.impactIndex) ? state.shot.impactIndex : path.length - 1;
  return projectWorld(path[Math.min(path.length - 1, index)], cameraForFrame(progress), VIEW);
}

function outcomeColour() {
  if (state.shot?.outcome === "GOAL") return "218,254,77";
  if (state.shot?.outcome === "SAVE") return "116,219,255";
  if (state.shot?.outcome === "WALL") return "255,190,102";
  if (["POST", "BAR"].includes(state.shot?.outcome)) return "255,255,255";
  return "255,119,119";
}

function drawImpactParticles(time, progress) {
  if (!state.animation || progress.replay || document.documentElement.classList.contains("reduced-motion-v22")) return;
  const ratio = impactRatio();
  const reveal = clamp((progress.flight - ratio) / 0.16, 0, 1);
  if (reveal <= 0 || reveal >= 1) return;
  const impact = impactPoint(progress);
  if (!impact?.visible) return;
  const colour = outcomeColour();
  const fade = 1 - reveal;
  const count = state.shot?.outcome === "GOAL" ? 18 : 11;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * TAU + (index % 3) * 0.17;
    const distance = 12 + reveal * (34 + (index % 5) * 8);
    const x = impact.x + Math.cos(angle) * distance;
    const y = impact.y + Math.sin(angle) * distance * 0.72 + reveal * reveal * 14;
    ctx.fillStyle = `rgba(${colour},${fade * (0.28 + (index % 4) * 0.08)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 2.2 + (index % 3), 0.9 + (index % 2), angle, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawCrowdSurge(time, progress) {
  if (!state.animation) return;
  const ratio = impactRatio();
  const surge = clamp((progress.flight - Math.max(0, ratio - 0.04)) / 0.2, 0, 1);
  if (surge <= 0 || surge >= 1) return;
  const strength = Math.sin(surge * Math.PI);
  const colour = outcomeColour();
  const lights = state.shot?.outcome === "GOAL" ? 54 : 30;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let index = 0; index < lights; index += 1) {
    const x = 40 + ((index * 73) % 1120);
    const y = 176 + ((index * 41) % 142);
    const flicker = 0.5 + Math.sin(time / 70 + index * 1.7) * 0.5;
    ctx.fillStyle = `rgba(${colour},${strength * flicker * 0.38})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (index % 3) * 0.7, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawVelocityChip(progress) {
  if (!state.animation || progress.replay || progress.flight <= 0.08 || progress.flight >= 0.87) return;
  const speed = Number(state.shot?.speedMps || state.shot?.diagnostics?.speedMps || 0);
  if (!speed) return;
  const alpha = Math.min(smooth((progress.flight - 0.08) / 0.12), 1 - smooth((progress.flight - 0.72) / 0.15));
  const width = 144;
  const x = WORLD.width - width - 28;
  const y = 28;

  ctx.save();
  ctx.globalAlpha = alpha * 0.9;
  ctx.fillStyle = "rgba(2,7,4,.78)";
  ctx.strokeStyle = "rgba(218,254,77,.28)";
  ctx.lineWidth = 1;
  roundedRect(x, y, width, 46, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(235,243,232,.56)";
  ctx.font = "850 8px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("SHOT VELOCITY", x + 14, y + 17);
  ctx.fillStyle = "#dafe4d";
  ctx.font = "1000 17px system-ui";
  ctx.fillText(`${speed.toFixed(1)} m/s`, x + 14, y + 36);
  ctx.restore();
}

function drawChapterComplete(time) {
  const presentation = state.presentation;
  if (presentation?.phase !== "chapter-complete") return;
  const elapsed = time - presentation.startedAt;
  const enter = smooth(elapsed / 260);
  const exit = 1 - smooth((elapsed - 1350) / 300);
  const alpha = Math.min(enter, exit);
  const accent = activeCharacter().accent;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(1,5,3,.88)";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  if (!document.documentElement.classList.contains("reduced-motion-v22")) {
    for (let index = 0; index < 36; index += 1) {
      const x = ((index * 127 + elapsed * (0.025 + (index % 4) * 0.008)) % (WORLD.width + 80)) - 40;
      const y = 70 + ((index * 61 + elapsed * (0.08 + (index % 3) * 0.025)) % 520);
      ctx.fillStyle = index % 3 ? accent : "#f7fbf5";
      ctx.globalAlpha = alpha * (0.35 + (index % 5) * 0.1);
      ctx.fillRect(x, y, 3 + (index % 3) * 2, 8 + (index % 4) * 2);
    }
  }

  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.fillStyle = accent;
  ctx.font = "900 12px system-ui";
  ctx.fillText(`CHAPTER ${presentation.chapterNumber} COMPLETE`, WORLD.width / 2, WORLD.height * 0.35);
  ctx.fillStyle = "#f7fbf5";
  ctx.font = "1000 52px system-ui";
  ctx.fillText(presentation.chapterName, WORLD.width / 2, WORLD.height * 0.47);
  ctx.fillStyle = "rgba(239,247,236,.7)";
  ctx.font = "800 12px system-ui";
  ctx.fillText(`${presentation.venue} MASTERED · ${presentation.scoreLabel}`, WORLD.width / 2, WORLD.height * 0.54);
  ctx.fillStyle = "rgba(218,254,77,.75)";
  ctx.font = "850 10px system-ui";
  ctx.fillText("TAP TO CONTINUE THE JOURNEY", WORLD.width / 2, WORLD.height * 0.82);
  ctx.restore();
}

export function drawMatchdayImpact(time) {
  applyTransform();
  const progress = progressAt(time);
  drawCrowdSurge(time, progress);
  drawImpactParticles(time, progress);
  drawVelocityChip(progress);
  drawChapterComplete(time);
  window.__footballLabMatchdayFrameV32 = {
    outcome: state.shot?.outcome || null,
    flight: progress.flight,
    keeperMotion: state.shot?.saveType || null,
    chapterMoment: state.presentation?.phase === "chapter-complete",
    localNetPhysics: true,
    crowdReactive: true
  };
}

document.documentElement.dataset.footballLabBuild = "32";
window.__footballLabMatchdayV32 = Object.freeze({
  build: "32.0.0",
  keeperMotions: ["DIVE", "CATCH", "PARRY", "RECOVERY"],
  localNetPhysics: true,
  ballFollowCamera: true,
  reactiveCrowd: true,
  layeredAudio: true,
  specialistReactions: true,
  chapterMoments: true,
  reducedMotionAware: true
});
