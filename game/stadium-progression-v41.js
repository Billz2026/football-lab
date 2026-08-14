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

const CHAPTER_IDENTITIES = Object.freeze({
  academy: "CONTROL & FOUNDATIONS",
  city: "ANGLES & CROSSWIND",
  night: "RANGE & PRECISION",
  storm: "WEATHER & COMPOSURE",
  world: "PRESSURE & ELITE KEEPERS",
  summit: "MASTERY"
});

const NEXT_VENUES = Object.freeze({
  1: "BOROUGH ARENA",
  2: "CONTINENTAL PARK",
  3: "TEMPEST STADIUM",
  4: "CROWN ARENA",
  5: "SUMMIT BOWL"
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

function transitionAlpha(elapsed, phase) {
  const enter = clamp(elapsed / 190, 0, 1);
  const exitStart = phase === "chapter-complete" ? 1320 : 850;
  const exitLength = phase === "chapter-complete" ? 300 : 240;
  const exit = 1 - clamp((elapsed - exitStart) / exitLength, 0, 1);
  return Math.min(enter, exit);
}

function drawTransitionBackdrop(time, venue, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const grade = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height);
  grade.addColorStop(0, "rgba(1,5,4,.98)");
  grade.addColorStop(0.58, "rgba(2,8,6,.96)");
  grade.addColorStop(1, `rgba(${venue.accent},.10)`);
  ctx.fillStyle = grade;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  const glow = ctx.createRadialGradient(WORLD.width * 0.5, WORLD.height * 0.40, 20, WORLD.width * 0.5, WORLD.height * 0.40, 470);
  glow.addColorStop(0, `rgba(${venue.accent},${0.11 + venue.energy * 0.035})`);
  glow.addColorStop(1, `rgba(${venue.accent},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(100, 40, WORLD.width - 200, WORLD.height - 80);

  ctx.fillStyle = `rgba(${venue.accent},.08)`;
  for (let index = 0; index < 24; index += 1) {
    const x = (index * 73 + 19) % WORLD.width;
    const y = 545 + ((index * 29) % 85);
    const height = 16 + ((index * 11) % 44);
    ctx.fillRect(x, y - height, 32 + (index % 4) * 13, height);
  }

  if (!document.documentElement.classList.contains("reduced-motion-v22")) {
    ctx.globalCompositeOperation = "screen";
    for (let index = 0; index < 44; index += 1) {
      const x = 22 + ((index * 97) % 1155);
      const y = 92 + ((index * 53) % 470);
      const pulse = 0.32 + Math.sin(time / 180 + index * 1.7) * 0.18;
      ctx.fillStyle = `rgba(${venue.secondary},${clamp(pulse, 0.08, 0.5) * alpha})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }
  ctx.restore();
}

function drawStageDots(active, venue, alpha) {
  const width = 224;
  const gap = 12;
  const dotWidth = (width - gap * 4) / 5;
  const x = (WORLD.width - width) / 2;
  const y = WORLD.height * 0.655;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let index = 1; index <= 5; index += 1) {
    ctx.fillStyle = index < active
      ? `rgba(${venue.accent},.46)`
      : index === active
        ? `rgba(${venue.secondary},.94)`
        : "rgba(240,247,238,.12)";
    roundedRect(x + (index - 1) * (dotWidth + gap), y, dotWidth, 5, 3);
    ctx.fill();
  }
  ctx.restore();
}

function drawStagePresentation(time, presentation, venue, alpha) {
  const identity = CHAPTER_IDENTITIES[state.currentStage?.environment] || "CLASSIC FREE KICKS";
  const stageInChapter = chapterStage();
  const final = isChapterFinal();
  const newVenue = stageInChapter === 1 && state.stage > 0 && state.stage < 30;
  const label = final ? "CHAPTER FINAL" : newVenue ? "NEW VENUE" : `STAGE ${stageInChapter} OF 5`;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.fillStyle = `rgba(${venue.accent},.88)`;
  ctx.font = "950 10px system-ui";
  ctx.fillText(`CHAPTER ${presentation.chapterNumber || 1} · ${identity}`, WORLD.width / 2, WORLD.height * 0.285);

  ctx.fillStyle = `rgba(${venue.secondary},.76)`;
  ctx.font = "900 9px system-ui";
  ctx.fillText(label, WORLD.width / 2, WORLD.height * 0.34);

  ctx.fillStyle = "#f8fcf6";
  const title = presentation.stageName || state.currentStage?.name || "CLASSIC FREE KICK";
  ctx.font = title.length > 18 ? "1000 39px system-ui" : "1000 48px system-ui";
  ctx.fillText(title, WORLD.width / 2, WORLD.height * 0.445);

  ctx.fillStyle = `rgba(${venue.accent},.9)`;
  ctx.font = "950 12px system-ui";
  ctx.fillText(presentation.venue || state.currentStage?.venue || venue.label, WORLD.width / 2, WORLD.height * 0.515);

  ctx.fillStyle = "rgba(239,247,236,.58)";
  ctx.font = "800 10px system-ui";
  ctx.fillText(`${presentation.distanceYards || state.currentStage?.distanceYards || 20} YDS · ${presentation.weather || state.currentStage?.weather || "MATCH CONDITIONS"}`, WORLD.width / 2, WORLD.height * 0.56);

  ctx.fillStyle = "rgba(239,247,236,.44)";
  ctx.font = "800 9px system-ui";
  ctx.fillText(final ? "MASTER THIS TEST TO COMPLETE THE CHAPTER" : "FIVE DISTINCT TESTS DEFINE EVERY VENUE", WORLD.width / 2, WORLD.height * 0.61);

  ctx.fillStyle = `rgba(${venue.secondary},.74)`;
  ctx.font = "850 9px system-ui";
  ctx.fillText("TAP TO START", WORLD.width / 2, WORLD.height * 0.86);
  ctx.restore();
  drawStageDots(stageInChapter, venue, alpha);
}

function drawChapterCompletePresentation(presentation, venue, alpha) {
  const chapter = Number(presentation.chapterNumber || state.currentStage?.chapterNumber || 1);
  const campaignComplete = chapter >= 6;
  const nextVenue = NEXT_VENUES[chapter];

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.fillStyle = `rgba(${venue.accent},.92)`;
  ctx.font = "950 11px system-ui";
  ctx.fillText(campaignComplete ? "CAMPAIGN MILESTONE" : `CHAPTER ${chapter} COMPLETE`, WORLD.width / 2, WORLD.height * 0.30);

  ctx.fillStyle = "#f8fcf6";
  const title = presentation.chapterName || state.currentStage?.chapterName || "CHAPTER COMPLETE";
  ctx.font = title.length > 17 ? "1000 42px system-ui" : "1000 52px system-ui";
  ctx.fillText(title, WORLD.width / 2, WORLD.height * 0.43);

  ctx.fillStyle = `rgba(${venue.secondary},.82)`;
  ctx.font = "950 12px system-ui";
  ctx.fillText(`${presentation.venue || state.currentStage?.venue || venue.label} MASTERED`, WORLD.width / 2, WORLD.height * 0.505);

  ctx.fillStyle = "rgba(239,247,236,.62)";
  ctx.font = "850 10px system-ui";
  ctx.fillText(presentation.scoreLabel || "CHAPTER CLEARED", WORLD.width / 2, WORLD.height * 0.555);

  const nextLine = campaignComplete
    ? "ENDLESS MASTERY NOW CONTINUES BEYOND STAGE 30"
    : `NEXT DESTINATION · ${nextVenue}`;
  ctx.fillStyle = `rgba(${venue.accent},.76)`;
  ctx.font = "900 10px system-ui";
  ctx.fillText(nextLine, WORLD.width / 2, WORLD.height * 0.66);

  ctx.fillStyle = "rgba(239,247,236,.44)";
  ctx.font = "800 9px system-ui";
  ctx.fillText("TAP TO CONTINUE THE JOURNEY", WORLD.width / 2, WORLD.height * 0.86);
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

export function drawCampaignPresentationV41(time) {
  const presentation = state.presentation;
  if (!presentation || !["stage", "chapter-complete"].includes(presentation.phase)) return;
  applyTransform();
  const elapsed = Math.max(0, time - (presentation.startedAt || time));
  const alpha = transitionAlpha(elapsed, presentation.phase);
  if (alpha <= 0) return;
  const venue = profile();
  drawTransitionBackdrop(time, venue, alpha);
  if (presentation.phase === "chapter-complete") drawChapterCompletePresentation(presentation, venue, alpha);
  else drawStagePresentation(time, presentation, venue, alpha);
  window.__footballLabCampaignPresentationV41 = {
    build: "41.0.0",
    phase: presentation.phase,
    chapter: state.currentStage?.chapterNumber,
    stageInChapter: chapterStage(),
    venue: state.currentStage?.venue,
    visible: alpha > 0
  };
}
