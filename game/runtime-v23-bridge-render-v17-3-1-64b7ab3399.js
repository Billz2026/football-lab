import { drawScene as drawBaseScene, resizeCanvas } from "./runtime-v23-generated-render-v17-v1731-7f257084b1.js?v=38.7.0";
import { drawHeroKicker } from "./runtime-v23-generated-hero-kicker-v17-3-1-7c97a59e31.js?v=32.4";
import { activeCharacter } from "./characters-v13.js?v=32.4";
import { WORLD, state, ctx, canvasView } from "./core-v6.js?v=32.4";
import { drawMatchdayImpact } from "./matchday-impact-v32.js?v=32.4";

export { resizeCanvas };

function applyCanvasTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function drawVenueWeather(time) {
  const weather = state.currentStage.weatherId || "clear";
  const severity = Math.max(0, Math.min(1, Number(state.currentStage.weatherSeverity) || 0));
  applyCanvasTransform();
  ctx.save();

  if (weather === "rain") {
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(196,225,235,${0.12 + severity * 0.18})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let index = 0; index < 112; index += 1) {
      const x = ((index * 89 + time * 0.34) % (WORLD.width + 180)) - 90;
      const y = ((index * 53 + time * 0.72) % (WORLD.height + 120)) - 60;
      const length = 10 + (index % 5) * 3;
      ctx.moveTo(x, y);
      ctx.lineTo(x - length * 0.42, y + length);
    }
    ctx.stroke();
    const rainGrade = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    rainGrade.addColorStop(0, "rgba(74,113,128,.12)");
    rainGrade.addColorStop(1, "rgba(9,23,27,.04)");
    ctx.fillStyle = rainGrade;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  } else if (weather === "haze") {
    const haze = ctx.createLinearGradient(0, 80, 0, 620);
    haze.addColorStop(0, "rgba(196,224,226,.04)");
    haze.addColorStop(0.56, "rgba(204,231,229,.115)");
    haze.addColorStop(1, "rgba(204,231,229,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  } else if (weather === "breeze") {
    ctx.fillStyle = "rgba(255,226,178,.2)";
    for (let index = 0; index < 22; index += 1) {
      const x = ((index * 137 + time * 0.018 * (1 + index % 3)) % (WORLD.width + 40)) - 20;
      const y = 118 + ((index * 71) % 360) + Math.sin(time / 520 + index) * 8;
      ctx.beginPath();
      ctx.arc(x, y, 0.8 + (index % 3) * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === "spotlight") {
    ctx.globalCompositeOperation = "screen";
    const pulse = 0.82 + Math.sin(time / 900) * 0.08;
    const flare = ctx.createRadialGradient(910, 92, 2, 910, 92, 150);
    flare.addColorStop(0, `rgba(255,229,157,${0.18 * pulse})`);
    flare.addColorStop(1, "rgba(255,229,157,0)");
    ctx.fillStyle = flare;
    ctx.fillRect(740, -40, 340, 300);
  } else if (weather === "clear") {
    ctx.globalCompositeOperation = "screen";
    const sun = ctx.createRadialGradient(955, 92, 0, 955, 92, 130);
    sun.addColorStop(0, "rgba(241,255,205,.18)");
    sun.addColorStop(1, "rgba(241,255,205,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(810, -40, 290, 270);
  }

  ctx.restore();
  window.__footballLabEnvironmentV31 = {
    chapter: state.currentStage.chapterNumber,
    venue: state.currentStage.venue,
    environment: state.currentStage.environment,
    weather,
    severity
  };
}

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
  drawHeroKicker(time);
  drawVenueWeather(time);
  drawMatchdayImpact(time);

  const baseVisible = 0;
  const heroVisible = 1;
  window.__footballLabVisibleKickersV30 = {
    base: baseVisible,
    hero: heroVisible,
    total: baseVisible + heroVisible,
    character: activeCharacter().id,
    time
  };
}

window.__footballLabRendererV17 = true;
window.__footballLabRigV171 = true;
window.__footballLabRendererV172 = true;
window.__footballLabRendererV173 = true;
window.__footballLabRendererV1731 = true;
window.__footballLabEnvironmentRendererV31 = true;
window.__footballLabRendererV32 = true;
