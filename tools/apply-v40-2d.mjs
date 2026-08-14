import fs from "node:fs";

const paths = {
  genV15: "game/runtime-v23-generated-render-v15-v1731-1b04a249af.js",
  genV17: "game/runtime-v23-generated-render-v17-v1731-7f257084b1.js",
  bridgeV17: "game/runtime-v23-bridge-render-v17-3-1-64b7ab3399.js",
  runtime: "game/runtime-v23-main.js",
  app: "app.js",
  sw: "sw.js"
};

const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]));

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`V40.2D patch failed: ${label}`);
  return text.replace(from, to);
}

const outcomeSting = `function outcomeStingTitleV402D(presentation) {
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

`;

files.genV15 = replaceOnce(
  files.genV15,
  "function drawReplayOverlay() {",
  outcomeSting + "function drawReplayOverlay() {",
  "insert canvas outcome sting"
);
files.genV15 = replaceOnce(
  files.genV15,
  "  drawImpactFeedback(time);\n  drawReplayOverlay();",
  "  drawImpactFeedback(time);\n  drawOutcomeStingV402D(time);\n  drawReplayOverlay();",
  "activate canvas outcome sting"
);

for (const key of ["genV15", "genV17", "bridgeV17", "runtime"]) {
  if (!files[key].includes("40.2.2")) throw new Error(`V40.2D patch failed: ${key} missing cache baseline`);
  files[key] = files[key].replaceAll("40.2.2", "40.2.3");
}

if (!files.app.includes("40.2.2")) throw new Error("V40.2D patch failed: app missing cache baseline");
files.app = files.app.replaceAll("40.2.2", "40.2.3");
files.app = replaceOnce(files.app, "// Football Lab V40.2C natural goalmouth and outcome feedback", "// Football Lab V40.2D authoritative canvas outcome feedback", "app header");
files.app = replaceOnce(files.app, 'badge.textContent = "V40.2C";', 'badge.textContent = "V40.2D";', "app badge");
files.app = replaceOnce(files.app, '          resultReveal: "single-authoritative-banner-after-impact-hold",', '          resultReveal: "authoritative-canvas-sting-after-impact-hold",', "result reveal metadata");
files.app = replaceOnce(files.app, '          outcomeFeedback: "impact-hold-then-clear-goal-save-post-bar-block-wide-banner",', '          outcomeFeedback: "canvas-goal-save-parry-post-bar-block-wide-sting-plus-control-panel",\n          outcomeCanvasSting: "visible-on-desktop-fold-mobile",', "outcome metadata");
files.app = replaceOnce(files.app, "        window.__footballLabReleaseV402C = release;", "        window.__footballLabReleaseV402C = release;\n        window.__footballLabReleaseV402D = release;", "release marker");

files.sw = replaceOnce(files.sw, "// Football Lab V40.2C natural goalmouth and outcome feedback cache reset", "// Football Lab V40.2D authoritative canvas outcome feedback cache reset", "sw header");
files.sw = replaceOnce(files.sw, 'const CACHE_NAME = "football-lab-shell-v40-2-2";', 'const CACHE_NAME = "football-lab-shell-v40-2-3";', "sw cache name");
files.sw = files.sw.replaceAll("40.2.2", "40.2.3");

for (const [key, path] of Object.entries(paths)) fs.writeFileSync(path, files[key]);
console.log("Applied Football Lab V40.2D authoritative canvas outcome feedback");
