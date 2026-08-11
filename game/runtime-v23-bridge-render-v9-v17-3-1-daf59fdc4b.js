import { drawScene as drawBaseScene, resizeCanvas } from "./runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js?v=32.2";
import { WORLD, state, ctx } from "./core-v6.js?v=32.2";

export { resizeCanvas };

function diagnosticLine(label, value, x, y, width) {
  ctx.fillStyle = "rgba(236,244,235,.58)";
  ctx.font = "800 10px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(label, x, y);
  ctx.fillStyle = "rgba(248,252,246,.94)";
  ctx.textAlign = "right";
  ctx.fillText(String(value), x + width, y);
}

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

function drawDiagnostics() {
  if (!state.debugDiagnostics) return;
  const data = state.shot?.diagnostics;
  const width = 380;
  const height = data ? 334 : 58;
  const x = WORLD.width - width - 18;
  const y = 18;

  ctx.save();
  ctx.fillStyle = "rgba(3,8,5,.93)";
  ctx.strokeStyle = "rgba(218,254,77,.34)";
  ctx.lineWidth = 1;
  roundedPanel(x, y, width, height, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#dafe4d";
  ctx.font = "900 11px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("V15 MATCHUP DIAGNOSTICS · D TO HIDE", x + 14, y + 22);

  if (!data) {
    ctx.fillStyle = "rgba(236,244,235,.65)";
    ctx.font = "700 10px system-ui";
    ctx.fillText("Take a shot to inspect the full matchup.", x + 14, y + 43);
    ctx.restore();
    return;
  }

  const left = x + 14;
  const valueWidth = width - 28;
  let row = y + 45;
  const wallClearance = data.wallClearanceMetres == null
    ? `${data.wallLane} · N/A`
    : `${data.wallLane} · ${data.wallClearanceMetres.toFixed(2)} m`;
  const keeperReach = data.keeperReachScore == null
    ? "NOT TESTED"
    : `${data.keeperReachScore.toFixed(3)} / ${data.keeperThreshold.toFixed(3)}`;

  diagnosticLine("KICKER", data.character || "—", left, row, valueWidth); row += 20;
  diagnosticLine("GOALKEEPER", data.goalkeeper || "—", left, row, valueWidth); row += 20;
  diagnosticLine("KEEPER TYPE", data.goalkeeperRole || "—", left, row, valueWidth); row += 20;
  diagnosticLine("WALL UNIT", data.wallUnit || "—", left, row, valueWidth); row += 20;
  diagnosticLine("WALL TYPE", data.wallRole || "—", left, row, valueWidth); row += 20;
  diagnosticLine("WALL COUNT", data.wallPlayerCount ?? "—", left, row, valueWidth); row += 20;
  diagnosticLine("WALL SHIFT", `${Number(data.wallShiftMetres || 0).toFixed(2)} m`, left, row, valueWidth); row += 20;
  diagnosticLine("CHALLENGE", data.challenge, left, row, valueWidth); row += 20;
  diagnosticLine("POWER", `${data.powerPercent}% · ${data.powerQuality}`, left, row, valueWidth); row += 20;
  diagnosticLine("PACE", `${data.speedMps.toFixed(1)} m/s`, left, row, valueWidth); row += 20;
  diagnosticLine("FINAL TARGET", `${data.finalTarget.x.toFixed(2)}, ${data.finalTarget.y.toFixed(2)} m`, left, row, valueWidth); row += 20;
  diagnosticLine("WALL RESULT", wallClearance, left, row, valueWidth); row += 20;
  diagnosticLine("KEEPER REACH", keeperReach, left, row, valueWidth); row += 20;
  diagnosticLine("OUTCOME", data.outcome, left, row, valueWidth); row += 18;

  ctx.fillStyle = "rgba(236,244,235,.72)";
  ctx.font = "700 9px system-ui";
  ctx.textAlign = "left";
  const reason = data.reason || "";
  const maxChars = 65;
  ctx.fillText(reason.slice(0, maxChars), left, row);
  if (reason.length > maxChars) ctx.fillText(reason.slice(maxChars, maxChars * 2), left, row + 13);
  ctx.restore();
}

export function drawScene(time, finishShot) {
  drawBaseScene(time, finishShot);
  drawDiagnostics();
}

window.__footballLabDiagnosticRendererV1731 = true;
