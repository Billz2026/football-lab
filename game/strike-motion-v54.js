import { clamp, state } from "./core-v6.js?v=32.4";

const BUILD = "54.1.0";

const STYLE_BIAS = Object.freeze({
  power: 0.135,
  curve: 0.115,
  precision: 0.09,
  composure: 0.075,
  balanced: 0.1
});

function biasForAnimation(animation) {
  return STYLE_BIAS[animation?.motionStyle] ?? STYLE_BIAS.balanced;
}

export function visualHeroTimeV54(time) {
  const animation = state.animation;
  if (!animation || animation.isReplay) return time;

  const runMs = Math.max(1, Number(animation.runUpDuration) || 1);
  const elapsed = time - animation.startedAt;
  if (elapsed <= 0 || elapsed >= runMs) return time;

  const rawRun = clamp(elapsed / runMs, 0, 1);
  const bias = biasForAnimation(animation);
  const emphasis = Math.sin(Math.PI * rawRun) ** 2;
  const visualRun = clamp(rawRun + bias * emphasis, 0, 1);

  return animation.startedAt + visualRun * runMs;
}

window.__footballLabStrikeMotionV54 = Object.freeze({
  build: BUILD,
  physicsChanged: false,
  launchTimingChanged: false,
  runUpDurationChanged: false,
  purpose: "compress-early-approach-expand-plant-windup-contact",
  styleBias: { ...STYLE_BIAS },
  sample(rawRun, style = "balanced") {
    const raw = clamp(Number(rawRun) || 0, 0, 1);
    const bias = STYLE_BIAS[style] ?? STYLE_BIAS.balanced;
    return clamp(raw + bias * Math.sin(Math.PI * raw) ** 2, 0, 1);
  }
});
