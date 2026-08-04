import { drawScene as drawBaseScene, resizeCanvas } from "./render-v9.js?v=113";
import { clamp, formatScore, WORLD, state, ctx } from "./core-v6.js?v=7";

export { resizeCanvas };

function roundedPanel(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function outcomePalette(outcome) {
  if (outcome === "GOAL") return { primary: "#dafe4d", secondary: "rgba(218,254,77,.18)", text: "#07110b" };
  if (outcome === "SAVE") return { primary: "#d8eeff", secondary: "rgba(155,211,255,.2)", text: "#07110b" };
  if (outcome === "POST" || outcome === "BAR") return { primary: "#ffffff", secondary: "rgba(255,255,255,.2)", text: "#07110b" };
  if (outcome === "WALL") return { primary: "#f5c67a", secondary: "rgba(245,198,122,.2)", text: "#07110b" };
  return { primary: "#ff8e8e", secondary: "rgba(255,110,110,.18)", text: "#07110b" };
}

function resultTitle(outcome, saveType, topCorner) {
  if (outcome === "GOAL") return topCorner ? "TOP CORNER" : "GOAL";
  if (outcome === "SAVE") return saveType === "CATCH" ? "HELD" : "SAVED";
  if (outcome === "POST") return "POST";
  if (outcome === "BAR") return "CROSSBAR";
  if (outcome === "WALL") return "BLOCKED";
  return "WIDE";
}

function drawImpactFeedback(time) {
  const presentation = state.presentation;
  if (!presentation?.impactAt) return;
  const elapsed = time - presentation.impactAt;
  if (elapsed < 0 || elapsed > 610) return;
  const t = clamp(elapsed / 610, 0, 1);
  const palette = outcomePalette(presentation.outcome);
  const intensity = Math.sin(Math.PI * Math.min(1, t * 1.18)) * (1 - t * 0.35);

  ctx.save();
  const gradient = ctx.createRadialGradient(
    WORLD.width * 0.5,
    WORLD.height * 0.46,
    20,
    WORLD.width * 0.5,
    WORLD.height * 0.46,
    WORLD.width * 0.58
  );
  gradient.addColorStop(0, palette.secondary.replace(/\.[0-9]+\)/, `${0.24 * intensity})`));
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  const titleDelay = presentation.outcome === "SAVE" ? 175 : 145;
  if (elapsed > titleDelay) {
    const titleProgress = clamp((elapsed - titleDelay) / 245, 0, 1);
    const scale = 0.86 + titleProgress * 0.14;
    const alpha = Math.min(1, titleProgress * 2.4) * (1 - clamp((elapsed - 465) / 145, 0, 1));
    ctx.globalAlpha = alpha;
    ctx.translate(WORLD.width * 0.5, WORLD.height * 0.31);
    ctx.scale(scale, scale);
    ctx.textAlign = "center";
    ctx.font = "1000 58px system-ui";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(2,7,4,.7)";
    const title = resultTitle(presentation.outcome, presentation.saveType, presentation.topCorner);
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = palette.primary;
    ctx.fillText(title, 0, 0);
  }
  ctx.restore();
}

function drawReplayOverlay() {
  const presentation = state.presentation;
  if (presentation?.phase !== "replay") return;
  ctx.save();
  ctx.fillStyle = "rgba(2,7,4,.72)";
  roundedPanel(22, 22, 215, 54, 10);
  ctx.fill();
  ctx.fillStyle = "#dafe4d";
  ctx.font = "900 12px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("SLOW-MOTION REPLAY", 38, 45);
  ctx.fillStyle = "rgba(240,247,238,.65)";
  ctx.font = "700 9px system-ui";
  ctx.fillText("TAP, SPACE OR A TO SKIP", 38, 62);
  ctx.restore();
}

function breakdownRow(label, value, x, y, width) {
  ctx.fillStyle = "rgba(233,242,230,.56)";
  ctx.font = "800 10px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(label, x, y);
  ctx.fillStyle = "rgba(250,253,248,.96)";
  ctx.textAlign = "right";
  ctx.fillText(value, x + width, y);
}

function drawBreakdown(time) {
  const presentation = state.presentation;
  if (presentation?.phase !== "breakdown" || !presentation.breakdown) return;
  const elapsed = time - presentation.startedAt;
  const enter = clamp(elapsed / 240, 0, 1);
  const panelWidth = 690;
  const panelHeight = 184;
  const x = (WORLD.width - panelWidth) / 2;
  const y = WORLD.height - 214 + (1 - enter) * 34;
  const palette = outcomePalette(presentation.outcome);
  const data = presentation.breakdown;

  ctx.save();
  ctx.globalAlpha = enter;
  ctx.fillStyle = "rgba(2,7,4,.93)";
  ctx.strokeStyle = palette.secondary;
  ctx.lineWidth = 1.5;
  roundedPanel(x, y, panelWidth, panelHeight, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = palette.primary;
  ctx.font = "1000 22px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(data.title, x + 22, y + 34);
  if (data.points > 0) {
    ctx.textAlign = "right";
    ctx.fillText(`+${formatScore(data.points)}`, x + panelWidth - 22, y + 34);
  }

  const columnWidth = 196;
  breakdownRow("POWER", data.power, x + 22, y + 67, columnWidth);
  breakdownRow("PLACEMENT", data.placement, x + 22, y + 91, columnWidth);
  breakdownRow("CURVE", data.curve, x + 22, y + 115, columnWidth);
  breakdownRow("SHOT SPEED", data.speed, x + 252, y + 67, columnWidth);
  breakdownRow("WALL", data.wall, x + 252, y + 91, columnWidth);
  breakdownRow("KEEPER", data.keeper, x + 252, y + 115, columnWidth);

  ctx.fillStyle = "rgba(235,243,232,.72)";
  ctx.font = "700 10px system-ui";
  ctx.textAlign = "left";
  const reason = data.reason || "";
  ctx.fillText(reason.slice(0, 92), x + 22, y + 148);
  if (reason.length > 92) ctx.fillText(reason.slice(92, 184), x + 22, y + 164);

  ctx.fillStyle = "rgba(218,254,77,.72)";
  ctx.font = "800 9px system-ui";
  ctx.textAlign = "right";
  ctx.fillText("TAP TO CONTINUE", x + panelWidth - 22, y + 164);
  ctx.restore();
}

function drawStageTransition(time) {
  const presentation = state.presentation;
  if (presentation?.phase !== "stage") return;
  const elapsed = time - presentation.startedAt;
  const enter = clamp(elapsed / 260, 0, 1);
  const exit = 1 - clamp((elapsed - 900) / 260, 0, 1);
  const alpha = Math.min(enter, exit);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(2,7,4,.78)";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#dafe4d";
  ctx.font = "900 13px system-ui";
  ctx.fillText(`STAGE ${String(presentation.stageNumber).padStart(2, "0")} · ${presentation.distanceYards} YDS`, WORLD.width / 2, WORLD.height * 0.39);
  ctx.fillStyle = "#f7fbf5";
  ctx.font = "1000 44px system-ui";
  ctx.fillText(presentation.stageName, WORLD.width / 2, WORLD.height * 0.49);
  ctx.fillStyle = "rgba(239,247,236,.7)";
  ctx.font = "800 15px system-ui";
  ctx.fillText(presentation.challenge, WORLD.width / 2, WORLD.height * 0.56);
  ctx.fillStyle = "rgba(218,254,77,.72)";
  ctx.font = "800 10px system-ui";
  ctx.fillText("TAP TO START", WORLD.width / 2, WORLD.height * 0.64);
  ctx.restore();
}

export function drawScene(time, finishAnimation) {
  drawBaseScene(time, finishAnimation);
  drawImpactFeedback(time);
  drawReplayOverlay();
  drawBreakdown(time);
  drawStageTransition(time);
}
