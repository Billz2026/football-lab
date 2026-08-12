const sourceUrl = new URL("./render-v11-4.js?v=114", import.meta.url);
const response = await fetch(sourceUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V11.4 presentation renderer (${response.status})`);
let source = await response.text();

function replaceRequired(label, before, after) {
  if (!source.includes(before)) throw new Error(`V15 presentation patch failed: ${label}`);
  source = source.replace(before, after);
}

replaceRequired(
  "V15 diagnostic renderer",
  'import { drawScene as drawBaseScene, resizeCanvas } from "./render-v9-v114.js?v=114";',
  `import { drawScene as drawBaseScene, resizeCanvas } from "${new URL("./render-v9-v15.js?v=15", import.meta.url).href}";`
);
replaceRequired(
  "matchup presentation imports",
  'import { clamp, formatScore, WORLD, state, ctx } from "./core-v6.js?v=32.4";',
  `import { clamp, formatScore, WORLD, state, ctx } from "./core-v6.js?v=32.4";\nimport { activeCharacter } from "${new URL("./characters-v13.js?v=32.4", import.meta.url).href}";\nimport { keeperForStage } from "${new URL("./keepers-v14.js?v=32.4", import.meta.url).href}";\nimport { wallForStage } from "${new URL("./walls-v15.js?v=32.4", import.meta.url).href}";`
);
replaceRequired(
  "goal colour",
  '  if (outcome === "GOAL") return { primary: "#dafe4d", secondary: "rgba(218,254,77,.18)", text: "#07110b" };',
  '  if (outcome === "GOAL") return { primary: activeCharacter().accent, secondary: activeCharacter().accent + "30", text: "#07110b" };'
);
replaceRequired(
  "stage prompt position",
  '  ctx.fillText("TAP TO START", WORLD.width / 2, WORLD.height * 0.64);',
  '  ctx.fillText("TAP TO START", WORLD.width / 2, WORLD.height * 0.88);'
);

const marker = "export function drawScene(time, finishAnimation) {";
if (!source.includes(marker)) throw new Error("V15 presentation patch failed: drawScene marker missing");
const matchupCards = `
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

`;
source = source.replace(marker, matchupCards + marker);
replaceRequired(
  "matchup card calls",
  "  drawStageTransition(time);\n}",
  "  drawStageTransition(time);\n  drawKeeperStageCard(time);\n  drawWallStageCard(time);\n}"
);

source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, sourceUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-render-v15-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
