const upstreamUrl = new URL("./render-v17.js?v=17", import.meta.url);
const response = await fetch(upstreamUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V17 renderer for V22 (${response.status})`);
let source = await response.text();

function replaceRequired(label, before, after) {
  if (!source.includes(before)) throw new Error(`V22 renderer patch failed: ${label}`);
  source = source.replace(before, after);
}

replaceRequired(
  "V17 base renderer route",
  'import { drawScene as drawBaseScene, resizeCanvas } from "./render-v15.js?v=15";',
  `import { drawScene as drawBaseScene, resizeCanvas } from "${new URL("./render-v15-v1731.js?v=1731", upstreamUrl).href}";`
);

replaceRequired(
  "reduced crowd density",
  "const crowdLights = Array.from({ length: 118 }, (_, index) => ({",
  "const crowdLights = Array.from({ length: 72 }, (_, index) => ({"
);
replaceRequired(
  "reduced crowd sparkle",
  "  strength: 0.18 + ((index * 19) % 42) / 100",
  "  strength: 0.07 + ((index * 19) % 42) / 210"
);

const ribbonPattern = /  ctx\.save\(\);\n  const ribbon = ctx\.createLinearGradient\(0, 0, WORLD\.width, 0\);[\s\S]*?  ctx\.restore\(\);\n}/;
if (!ribbonPattern.test(source)) throw new Error("V22 renderer patch failed: advertisement ribbon block");
source = source.replace(ribbonPattern, `  ctx.save();
  const ribbon = ctx.createLinearGradient(0, 0, WORLD.width, 0);
  ribbon.addColorStop(0, "rgba(10,36,24,.04)");
  ribbon.addColorStop(0.22, "rgba(218,254,77,.055)");
  ribbon.addColorStop(0.5, "rgba(236,255,221,.025)");
  ribbon.addColorStop(0.78, "rgba(218,254,77,.055)");
  ribbon.addColorStop(1, "rgba(10,36,24,.04)");
  ctx.fillStyle = "rgba(1,6,3,.94)";
  ctx.fillRect(0, 326, WORLD.width, 38);
  ctx.fillStyle = ribbon;
  ctx.fillRect(0, 328, WORLD.width, 1);
  ctx.fillRect(0, 362, WORLD.width, 1);
  ctx.fillStyle = "rgba(239,247,236,.105)";
  ctx.font = "800 8px system-ui";
  ctx.textAlign = "center";
  const offset = (time / 34) % 300;
  for (let x = -300 + offset; x < WORLD.width + 300; x += 300) {
    ctx.fillText("FOOTBALL LAB", x, 349);
  }
  ctx.restore();
}`);

const marker = "export function drawScene(time, finishShot) {";
if (!source.includes(marker)) throw new Error("V22 renderer patch failed: drawScene marker");

const v22Enhancements = `
const V22_THEMES = Object.freeze([
  { id: "clean-night", sky: "224,244,232", goal: "246,255,241", pitch: "110,211,132", ambient: 0.052, goalLift: 0.19, pitchLift: 0.07 },
  { id: "floodlit-lime", sky: "218,254,77", goal: "236,255,211", pitch: "139,232,112", ambient: 0.045, goalLift: 0.2, pitchLift: 0.075 },
  { id: "dusk-session", sky: "255,194,128", goal: "255,241,216", pitch: "126,218,138", ambient: 0.043, goalLift: 0.18, pitchLift: 0.065 },
  { id: "elite-cool", sky: "128,215,255", goal: "226,248,255", pitch: "102,208,161", ambient: 0.047, goalLift: 0.19, pitchLift: 0.068 }
]);
let v22ThemeIndex = -1;
let v22LastScreen = state.screen;
let v22ForcedGoalUntil = 0;

function selectV22Theme() {
  const previous = v22ThemeIndex;
  let next = Math.floor(Math.random() * V22_THEMES.length);
  if (V22_THEMES.length > 1 && next === previous) next = (next + 1) % V22_THEMES.length;
  v22ThemeIndex = next;
}

function currentV22Theme() {
  if (v22ThemeIndex < 0 || (state.screen === "game" && v22LastScreen !== "game")) selectV22Theme();
  v22LastScreen = state.screen;
  return V22_THEMES[Math.max(0, v22ThemeIndex)];
}

function drawV22ThemeLighting(time) {
  const theme = currentV22Theme();
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const sky = ctx.createLinearGradient(0, 0, 0, 410);
  sky.addColorStop(0, \`rgba(\${theme.sky},\${theme.ambient})\`);
  sky.addColorStop(0.72, \`rgba(\${theme.sky},\${theme.ambient * 0.32})\`);
  sky.addColorStop(1, \`rgba(\${theme.sky},0)\`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.width, 430);

  const goal = ctx.createRadialGradient(600, 340, 25, 600, 340, 365);
  goal.addColorStop(0, \`rgba(\${theme.goal},\${theme.goalLift})\`);
  goal.addColorStop(0.46, \`rgba(\${theme.goal},\${theme.goalLift * 0.45})\`);
  goal.addColorStop(1, \`rgba(\${theme.goal},0)\`);
  ctx.fillStyle = goal;
  ctx.fillRect(180, 85, 840, 540);

  const pitch = ctx.createLinearGradient(0, 360, 0, WORLD.height);
  pitch.addColorStop(0, \`rgba(\${theme.pitch},0)\`);
  pitch.addColorStop(0.42, \`rgba(\${theme.pitch},\${theme.pitchLift * 0.45})\`);
  pitch.addColorStop(1, \`rgba(\${theme.pitch},\${theme.pitchLift})\`);
  ctx.fillStyle = pitch;
  ctx.fillRect(0, 340, WORLD.width, WORLD.height - 340);
  ctx.restore();

  ctx.save();
  const focus = ctx.createRadialGradient(600, 365, 250, 600, 365, 760);
  focus.addColorStop(0, "rgba(0,0,0,0)");
  focus.addColorStop(0.72, "rgba(0,0,0,.025)");
  focus.addColorStop(1, "rgba(0,0,0,.16)");
  ctx.fillStyle = focus;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.restore();
  return theme;
}

function v22GoalReaction(time) {
  if (time < v22ForcedGoalUntil) {
    const remaining = v22ForcedGoalUntil - time;
    const phase = clamp(1 - remaining / 700, 0, 1);
    return { active: true, amplitude: Math.sin(phase * Math.PI) * 0.55, forced: true };
  }
  if (!state.animation || state.shot?.outcome !== "GOAL" || !state.shot?.path?.length) {
    return { active: false, amplitude: 0, forced: false };
  }
  const progress = animationProgress(time);
  const primaryPhase = clamp((progress.motionFlight - 0.76) / 0.24, 0, 1);
  const primary = Math.sin(primaryPhase * Math.PI) * 0.52;
  const settle = Math.sin(clamp(progress.settle, 0, 1) * Math.PI) * 0.13;
  const amplitude = Math.max(0, primary + settle);
  return { active: amplitude > 0.008, amplitude, forced: false };
}

function drawV22NetReaction(time) {
  const reaction = v22GoalReaction(time);
  if (!reaction.active) return false;
  const camera = cameraForFrame(time);
  const path = state.shot?.path;
  const final = path?.[path.length - 1] || { x: 0, y: GOAL.height * 0.55, z: -GOAL.depth * 0.4 };
  const impactX = clamp(final.x, -GOAL.halfWidth, GOAL.halfWidth);
  const impactY = clamp(final.y, 0.12, GOAL.height - 0.06);
  const amplitude = reaction.amplitude;

  const bulgedPoint = (x, y) => {
    const dx = (x - impactX) / Math.max(0.1, GOAL.width * 0.34);
    const dy = (y - impactY) / Math.max(0.1, GOAL.height * 0.42);
    const falloff = Math.exp(-(dx * dx * 2.2 + dy * dy * 2.8));
    return {
      x,
      y,
      z: -GOAL.depth * 0.36 - amplitude * falloff * 0.72
    };
  };

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = \`rgba(245,255,241,\${0.42 + amplitude * 0.42})\`;
  ctx.lineWidth = 1.15 + amplitude * 1.5;
  ctx.shadowColor = "rgba(218,254,77,.5)";
  ctx.shadowBlur = 4 + amplitude * 10;

  for (let column = 0; column <= 12; column += 1) {
    const x = -GOAL.halfWidth + (GOAL.width * column) / 12;
    ctx.beginPath();
    let started = false;
    for (let row = 0; row <= 14; row += 1) {
      const y = 0.04 + ((GOAL.height - 0.04) * row) / 14;
      const point = projectWorld(bulgedPoint(x, y), camera, viewport);
      if (!point.visible) continue;
      started ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y);
      started = true;
    }
    if (started) ctx.stroke();
  }

  for (let row = 1; row < 9; row += 1) {
    const y = (GOAL.height * row) / 9;
    ctx.beginPath();
    let started = false;
    for (let column = 0; column <= 18; column += 1) {
      const x = -GOAL.halfWidth + (GOAL.width * column) / 18;
      const point = projectWorld(bulgedPoint(x, y), camera, viewport);
      if (!point.visible) continue;
      started ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y);
      started = true;
    }
    if (started) ctx.stroke();
  }
  ctx.restore();

  const impact = projectWorld(bulgedPoint(impactX, impactY), camera, viewport);
  if (impact.visible) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const flash = ctx.createRadialGradient(impact.x, impact.y, 0, impact.x, impact.y, 52 + amplitude * 70);
    flash.addColorStop(0, \`rgba(238,255,211,\${0.2 + amplitude * 0.26})\`);
    flash.addColorStop(1, "rgba(218,254,77,0)");
    ctx.fillStyle = flash;
    ctx.fillRect(impact.x - 130, impact.y - 130, 260, 260);
    ctx.restore();
  }
  return true;
}

window.__footballLabV22ForceGoalRipple = (duration = 700) => {
  v22ForcedGoalUntil = performance.now() + clamp(Number(duration) || 700, 200, 2000);
};
window.__footballLabVisualV22 = Object.freeze({
  advertisementCentreQuieting: true,
  advertisementTextOpacity: 0.105,
  crowdDensity: 72,
  curatedThemes: V22_THEMES.map((theme) => theme.id),
  themeSelection: "per-run",
  goalAreaLighting: true,
  netRipple: true,
  netRippleDurationMs: 700,
  impactPointDeformation: true
});

`;
source = source.replace(marker, v22Enhancements + marker);

replaceRequired(
  "V22 draw calls",
  "  drawStadiumAtmosphere(time);\n  drawGroundContactShadows(time);\n  drawGoalHighlights(time);\n  drawBallEnergy(time);\n  drawContactFx(time);\n  drawOutcomeFocus(time);\n  drawCinematicGrade(time);",
  "  drawStadiumAtmosphere(time);\n  const v22Theme = drawV22ThemeLighting(time);\n  drawGroundContactShadows(time);\n  drawGoalHighlights(time);\n  drawBallEnergy(time);\n  drawContactFx(time);\n  const v22NetRipple = drawV22NetReaction(time);\n  drawOutcomeFocus(time);\n  drawCinematicGrade(time);\n  window.__footballLabVisualFrameV22 = { theme: v22Theme.id, netRippleActive: v22NetRipple, time };"
);

source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, upstreamUrl).href}"`;
});
source += "\n//# sourceURL=football-lab-render-v22-generated.js\n";

const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

window.__footballLabRendererV22 = true;
export const resizeCanvas = generated.resizeCanvas;
export const drawScene = generated.drawScene;
