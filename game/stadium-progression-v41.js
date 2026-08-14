import { clamp, WORLD, state, ctx, canvasView } from "./core-v6.js?v=32.4";

const TAU = Math.PI * 2;

const VENUES = Object.freeze({
  academy: Object.freeze({
    label: "FOUNDATION GROUND", tier: "ACADEMY", accent: "210,249,153", secondary: "140,202,128",
    crowd: 0.42, energy: 0.32, flags: 3, beam: 0.03, boards: ["BUILD THE BASICS", "FIRST TOUCH"]
  }),
  city: Object.freeze({
    label: "BOROUGH ARENA", tier: "CITY", accent: "255,178,103", secondary: "255,221,175",
    crowd: 0.58, energy: 0.48, flags: 5, beam: 0.06, boards: ["OWN THE ANGLE", "CITY LIGHTS"]
  }),
  night: Object.freeze({
    label: "CONTINENTAL PARK", tier: "CONTINENTAL", accent: "120,190,255", secondary: "205,232,255",
    crowd: 0.72, energy: 0.64, flags: 7, beam: 0.085, boards: ["UNDER THE LIGHTS", "NIGHT SHIFT"]
  }),
  storm: Object.freeze({
    label: "TEMPEST STADIUM", tier: "ELITE", accent: "163,218,228", secondary: "210,235,239",
    crowd: 0.78, energy: 0.72, flags: 8, beam: 0.075, boards: ["MASTER THE CONDITIONS", "STORM CIRCUIT"]
  }),
  world: Object.freeze({
    label: "CROWN ARENA", tier: "WORLD", accent: "245,205,112", secondary: "255,236,188",
    crowd: 0.90, energy: 0.90, flags: 10, beam: 0.12, boards: ["THE WORLD IS WATCHING", "WORLD STAGE"]
  }),
  summit: Object.freeze({
    label: "SUMMIT BOWL", tier: "LEGENDS", accent: "205,242,244", secondary: "238,252,252",
    crowd: 1, energy: 1, flags: 12, beam: 0.15, boards: ["LEAVE YOUR MARK", "LEGENDS SUMMIT"]
  })
});

function applyTransform() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function profile() {
  return VENUES[state.currentStage?.environment] || VENUES.academy;
}

function chapterStage() {
  return Math.max(1, Math.min(5, Number(state.currentStage?.chapterStage) || 1));
}

function isChapterFinal() {
  return chapterStage() === 5 && Number(state.currentStage?.cycle || 0) === 0;
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

function drawStadiumLightWash(time, venue) {
  const progress = (chapterStage() - 1) / 4;
  const finalBoost = isChapterFinal() ? 1.35 : 1;
  const pulse = 0.82 + Math.sin(time / 920) * 0.08;
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const topGlow = ctx.createLinearGradient(0, 74, 0, 245);
  topGlow.addColorStop(0, `rgba(${venue.accent},${venue.beam * finalBoost * pulse})`);
  topGlow.addColorStop(1, `rgba(${venue.accent},0)`);
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 60, WORLD.width, 210);

  if (venue.energy >= 0.6) {
    const edgeAlpha = venue.beam * (0.58 + progress * 0.35) * finalBoost;
    for (const side of [-1, 1]) {
      const x = side < 0 ? 90 : WORLD.width - 90;
      const beam = ctx.createRadialGradient(x, 82, 4, x, 82, 240);
      beam.addColorStop(0, `rgba(${venue.secondary},${edgeAlpha})`);
      beam.addColorStop(1, `rgba(${venue.secondary},0)`);
      ctx.fillStyle = beam;
      ctx.fillRect(x - 250, -120, 500, 380);
    }
  }
  ctx.restore();
}

function drawCrowdSpark(time, venue) {
  const density = venue.crowd * (0.8 + chapterStage() * 0.04) * (isChapterFinal() ? 1.18 : 1);
  const count = Math.round(34 + density * 92);
  const reduced = document.documentElement.classList.contains("reduced-motion-v22");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let index = 0; index < count; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const lane = (index * 83 + (index % 5) * 19) % 340;
    const x = side < 0 ? 28 + lane : WORLD.width - 28 - lane;
    const y = 146 + ((index * 43) % 168);
    const flicker = reduced ? 0.58 : 0.42 + Math.sin(time / (330 + (index % 6) * 31) + index * 1.73) * 0.28;
    const highlight = index % Math.max(5, Math.round(13 - density * 5)) === 0;
    const alpha = (highlight ? 0.32 : 0.11) * density * clamp(flicker + 0.4, 0.15, 1);
    ctx.fillStyle = `rgba(${highlight ? venue.secondary : venue.accent},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, highlight ? 1.8 : 1.05, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawSupporterFlags(time, venue) {
  if (venue.flags <= 0) return;
  const reduced = document.documentElement.classList.contains("reduced-motion-v22");
  const count = venue.flags + (isChapterFinal() ? 3 : 0);
  ctx.save();
  for (let index = 0; index < count; index += 1) {
    const leftSide = index % 2 === 0;
    const slot = Math.floor(index / 2);
    const x = leftSide ? 52 + slot * 54 : WORLD.width - 52 - slot * 54;
    const y = 214 + (index % 3) * 24;
    const wave = reduced ? 0 : Math.sin(time / 280 + index * 1.4) * 4;
    const width = 18 + (index % 2) * 4;
    const height = 9;
    ctx.strokeStyle = "rgba(235,243,232,.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
    ctx.fillStyle = `rgba(${venue.accent},${0.18 + venue.energy * 0.12})`;
    ctx.beginPath();
    ctx.moveTo(x + 1, y - 13);
    ctx.quadraticCurveTo(x + width * 0.55, y - 16 + wave * 0.2, x + width + wave, y - 11);
    ctx.lineTo(x + width + wave, y - 11 + height);
    ctx.quadraticCurveTo(x + width * 0.48, y - 7 + wave * 0.18, x + 1, y - 5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawVenueScoreboard(venue) {
  const final = isChapterFinal();
  const width = final ? 310 : 270;
  const height = 48;
  const x = (WORLD.width - width) / 2;
  const y = 94;
  ctx.save();
  ctx.fillStyle = "rgba(1,5,5,.72)";
  ctx.strokeStyle = `rgba(${venue.accent},${final ? 0.46 : 0.22})`;
  ctx.lineWidth = final ? 1.5 : 1;
  roundedRect(x, y, width, height, 7);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = `rgba(${venue.accent},.82)`;
  ctx.font = "900 8px system-ui";
  ctx.fillText(final ? "CHAPTER FINAL" : `${venue.tier} VENUE · STAGE ${chapterStage()} OF 5`, WORLD.width / 2, y + 16);
  ctx.fillStyle = "rgba(247,251,245,.9)";
  ctx.font = "950 12px system-ui";
  ctx.fillText(state.currentStage?.venue || venue.label, WORLD.width / 2, y + 34);
  ctx.restore();
}

function drawSideBanners(time, venue) {
  const final = isChapterFinal();
  const alpha = 0.18 + venue.energy * 0.08 + (final ? 0.08 : 0);
  const y = 318;
  const width = 245;
  const height = 18;
  const text = final ? "CHAPTER FINAL" : venue.boards[(chapterStage() - 1) % venue.boards.length];
  const drift = document.documentElement.classList.contains("reduced-motion-v22") ? 0 : Math.sin(time / 1400) * 4;
  ctx.save();
  for (const side of [-1, 1]) {
    const x = side < 0 ? 18 + drift : WORLD.width - width - 18 - drift;
    ctx.fillStyle = "rgba(1,6,4,.55)";
    ctx.strokeStyle = `rgba(${venue.accent},${alpha})`;
    roundedRect(x, y, width, height, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(${venue.secondary},${0.46 + venue.energy * 0.16})`;
    ctx.font = "850 7px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(text, x + width / 2, y + 12);
  }
  ctx.restore();
}

function drawFinalOccasion(time, venue) {
  if (!isChapterFinal()) return;
  const reduced = document.documentElement.classList.contains("reduced-motion-v22");
  const pulse = reduced ? 0.72 : 0.62 + Math.sin(time / 480) * 0.1;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const halo = ctx.createRadialGradient(WORLD.width / 2, 132, 10, WORLD.width / 2, 132, 360);
  halo.addColorStop(0, `rgba(${venue.accent},${0.055 * pulse})`);
  halo.addColorStop(1, `rgba(${venue.accent},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(220, 0, 760, 300);

  const flashCount = 20 + Math.round(venue.energy * 20);
  for (let index = 0; index < flashCount; index += 1) {
    const side = index % 2 ? -1 : 1;
    const x = side < 0 ? 22 + ((index * 61) % 310) : WORLD.width - 22 - ((index * 61) % 310);
    const y = 164 + ((index * 37) % 132);
    const flicker = reduced ? 0.55 : 0.4 + Math.sin(time / 95 + index * 2.1) * 0.35;
    ctx.fillStyle = `rgba(${venue.secondary},${clamp(flicker, 0.08, 0.72) * 0.42})`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

export function drawStadiumProgressionV41(time) {
  if (!state.currentStage || state.screen !== "game") return;
  if (["stage", "chapter-complete"].includes(state.presentation?.phase)) return;
  applyTransform();
  const venue = profile();
  drawStadiumLightWash(time, venue);
  drawCrowdSpark(time, venue);
  drawSupporterFlags(time, venue);
  drawSideBanners(time, venue);
  drawFinalOccasion(time, venue);
  drawVenueScoreboard(venue);
  window.__footballLabStadiumV41 = {
    build: "41.0.0",
    venue: state.currentStage.venue,
    environment: state.currentStage.environment,
    chapter: state.currentStage.chapterNumber,
    stageInChapter: chapterStage(),
    chapterFinal: isChapterFinal(),
    crowdEnergy: venue.energy,
    venueTier: venue.tier
  };
}
