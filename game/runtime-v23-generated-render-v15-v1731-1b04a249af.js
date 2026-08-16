import { drawScene as drawBaseScene, resizeCanvas } from "./runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js?v=40.3.0";
import { clamp, formatScore, WORLD, state, ctx } from "./core-v6.js?v=32.4";
import { activeCharacter } from "./characters-v13.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";
import { wallForStage } from "./walls-v15.js?v=32.4";

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
  if (outcome === "GOAL") return { primary: activeCharacter().accent, secondary: activeCharacter().accent + "30", text: "#07110b" };
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

  // V38.8: no result typography during the impact hold. The normal result banner is authoritative.
  ctx.restore();
}

function outcomeStingTitleV402D(presentation) {
  if (presentation.outcome === "GOAL") return "GOAL";
  if (presentation.outcome === "SAVE") return presentation.saveType === "CATCH" ? "SAVED · HELD" : "SAVED · PARRIED";
  if (presentation.outcome === "POST") return "OFF THE POST";
  if (presentation.outcome === "BAR") return "CROSSBAR";
  if (presentation.outcome === "WALL") return "BLOCKED";
  return "WIDE";
}

function outcomeStingAccentV402D(presentation) {
  if (presentation.outcome === "GOAL") return activeCharacter().accent || "#dafe4d";
  if (presentation.outcome === "SAVE") return "#74dcff";
  if (presentation.outcome === "POST" || presentation.outcome === "BAR") return "#f7fbf5";
  if (presentation.outcome === "WALL") return "#f5c67a";
  return "#ff8e8e";
}

function drawOutcomeStingV402D(time) {
  const presentation = state.presentation;
  if (presentation?.phase !== "result" || !Number.isFinite(presentation.resultAt)) return;
  const hold = Math.max(620, Number(presentation.resultHoldMs) || 760);
  const elapsed = time - presentation.resultAt;
  if (elapsed < 0 || elapsed > hold) return;

  const enter = clamp(elapsed / 105, 0, 1);
  const exit = 1 - clamp((elapsed - (hold - 155)) / 155, 0, 1);
  const alpha = Math.min(enter, exit);
  const title = outcomeStingTitleV402D(presentation);
  const accent = outcomeStingAccentV402D(presentation);
  const width = clamp(255 + title.length * 22, 360, 650);
  const height = 104;
  const x = (WORLD.width - width) / 2;
  const y = WORLD.height * 0.275;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(0,0,0,.52)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "rgba(3,10,7,.82)";
  roundedPanel(x, y, width, height, 18);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = accent + "b8";
  ctx.lineWidth = 1.6;
  roundedPanel(x + 0.8, y + 0.8, width - 1.6, height - 1.6, 18);
  ctx.stroke();

  ctx.fillStyle = accent;
  roundedPanel(x + 20, y + 14, width - 40, 4, 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(240,247,238,.54)";
  ctx.font = "900 9px system-ui";
  ctx.fillText("SHOT RESULT", WORLD.width / 2, y + 38);
  ctx.fillStyle = "#f8fcf6";
  ctx.font = title.length > 12 ? "1000 36px system-ui" : "1000 44px system-ui";
  ctx.fillText(title, WORLD.width / 2, y + 80);
  ctx.restore();

  window.__footballLabOutcomeStingV402D = {
    build: "40.2D",
    title,
    phase: presentation.phase,
    visible: true,
    elapsed,
    hold
  };
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
  ctx.font = "900 11px system-ui";
  ctx.fillText(`CHAPTER ${presentation.chapterNumber || 1} · ${presentation.chapterName || "CLASSIC KICKS"}`, WORLD.width / 2, WORLD.height * 0.33);
  ctx.fillStyle = "rgba(239,247,236,.68)";
  ctx.font = "900 12px system-ui";
  ctx.fillText(`STAGE ${String(presentation.stageNumber).padStart(2, "0")} · ${presentation.distanceYards} YDS`, WORLD.width / 2, WORLD.height * 0.39);
  ctx.fillStyle = "#f7fbf5";
  ctx.font = "1000 44px system-ui";
  ctx.fillText(presentation.stageName, WORLD.width / 2, WORLD.height * 0.49);
  ctx.fillStyle = "#dafe4d";
  ctx.font = "900 12px system-ui";
  ctx.fillText(`${presentation.venue || "FOOTBALL LAB"} · ${presentation.weather || "MATCH CONDITIONS"}`, WORLD.width / 2, WORLD.height * 0.56);
  ctx.fillStyle = "rgba(218,254,77,.72)";
  ctx.font = "800 10px system-ui";
  ctx.fillText("TAP TO START", WORLD.width / 2, WORLD.height * 0.88);
  ctx.restore();
}


function matchupStat(label, value, x, y, width, accent) {
  ctx.fillStyle = "rgba(235,243,232,.52)";
  ctx.font = "850 8px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(label, x, y);
  ctx.fillStyle = "rgba(255,255,255,.08)";
  roundedPanel(x + 72, y - 7, width, 6, 3);
  ctx.fill();
  ctx.fillStyle = accent;
  roundedPanel(x + 72, y - 7, width * clamp(value / 100, 0, 1), 6, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(248,252,246,.9)";
  ctx.textAlign = "right";
  ctx.fillText(String(value), x + 72 + width + 24, y);
}

function drawKeeperStageCard(time) {
  const presentation = state.presentation;
  if (presentation?.phase !== "stage") return;
  const keeper = keeperForStage(Math.max(0, (presentation.stageNumber || state.stage + 1) - 1));
  const elapsed = time - presentation.startedAt;
  const enter = clamp((elapsed - 120) / 260, 0, 1);
  const exit = 1 - clamp((elapsed - 1320) / 300, 0, 1);
  const alpha = Math.min(enter, exit);
  const width = 690;
  const height = 142;
  const x = (WORLD.width - width) / 2;
  const y = 420;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(2,7,4,.93)";
  ctx.strokeStyle = keeper.accent + "66";
  ctx.lineWidth = 1.4;
  roundedPanel(x, y, width, height, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = keeper.accent;
  roundedPanel(x + 16, y + 16, 58, 58, 14);
  ctx.fill();
  ctx.fillStyle = "#07110b";
  ctx.font = "1000 28px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(keeper.icon, x + 45, y + 45);
  ctx.textBaseline = "alphabetic";

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(235,243,232,.52)";
  ctx.font = "850 8px system-ui";
  ctx.fillText("GOALKEEPER · TIER " + keeper.tier, x + 90, y + 25);
  ctx.fillStyle = "#f7fbf5";
  ctx.font = "1000 22px system-ui";
  ctx.fillText(keeper.name, x + 90, y + 50);
  ctx.fillStyle = keeper.accent;
  ctx.font = "900 9px system-ui";
  ctx.fillText(keeper.role + " · " + keeper.trait, x + 90, y + 69);
  ctx.fillStyle = "rgba(235,243,232,.66)";
  ctx.font = "650 10px system-ui";
  ctx.fillText(keeper.traitCopy.slice(0, 75), x + 90, y + 88);

  matchupStat("REFLEXES", keeper.stats.reflexes, x + 390, y + 27, 160, keeper.accent);
  matchupStat("REACH", keeper.stats.reach, x + 390, y + 50, 160, keeper.accent);
  matchupStat("READING", keeper.stats.reading, x + 390, y + 73, 160, keeper.accent);
  matchupStat("AGGRESSION", keeper.stats.aggression, x + 390, y + 96, 160, keeper.accent);

  ctx.fillStyle = keeper.accent + "18";
  roundedPanel(x + 16, y + 105, width - 32, 23, 8);
  ctx.fill();
  ctx.fillStyle = keeper.accent;
  ctx.font = "900 8px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("BEST ROUTE", x + 27, y + 120);
  ctx.fillStyle = "rgba(241,247,239,.78)";
  ctx.font = "700 9px system-ui";
  ctx.fillText(keeper.solution.slice(0, 92), x + 96, y + 120);
  ctx.restore();
}

function drawWallStageCard(time) {
  const presentation = state.presentation;
  if (presentation?.phase !== "stage") return;
  const wall = wallForStage(Math.max(0, (presentation.stageNumber || state.stage + 1) - 1));
  const elapsed = time - presentation.startedAt;
  const enter = clamp((elapsed - 180) / 260, 0, 1);
  const exit = 1 - clamp((elapsed - 1320) / 300, 0, 1);
  const alpha = Math.min(enter, exit);
  const x = 24;
  const y = 420;
  const width = 210;
  const height = 142;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(2,7,4,.93)";
  ctx.strokeStyle = wall.accent + "66";
  ctx.lineWidth = 1.4;
  roundedPanel(x, y, width, height, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = wall.accent;
  roundedPanel(x + 13, y + 13, 38, 38, 10);
  ctx.fill();
  ctx.fillStyle = "#07110b";
  ctx.font = "1000 18px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(wall.icon, x + 32, y + 32);
  ctx.textBaseline = "alphabetic";

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(235,243,232,.48)";
  ctx.font = "850 7px system-ui";
  ctx.fillText("WALL · TIER " + wall.tier, x + 60, y + 20);
  ctx.fillStyle = "#f7fbf5";
  ctx.font = "1000 14px system-ui";
  ctx.fillText(wall.name, x + 60, y + 39);
  ctx.fillStyle = wall.accent;
  ctx.font = "900 7px system-ui";
  ctx.fillText(wall.role, x + 60, y + 55);

  matchupStat("COVER", wall.stats.coverage, x + 14, y + 76, 78, wall.accent);
  matchupStat("JUMP", wall.stats.jump, x + 14, y + 94, 78, wall.accent);
  matchupStat("READ", wall.stats.reading, x + 14, y + 112, 78, wall.accent);

  ctx.fillStyle = wall.accent + "18";
  roundedPanel(x + 12, y + 119, width - 24, 15, 7);
  ctx.fill();
  ctx.fillStyle = "rgba(241,247,239,.78)";
  ctx.font = "700 7px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(wall.solution.slice(0, 48), x + width / 2, y + 130);
  ctx.restore();
}

export function drawScene(time, finishAnimation) {
  drawBaseScene(time, finishAnimation);
  drawImpactFeedback(time);
  drawOutcomeStingV402D(time);
  drawReplayOverlay();
  drawBreakdown(time);
  drawStageTransition(time);
  drawKeeperStageCard(time);
  drawWallStageCard(time);
}
