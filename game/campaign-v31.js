import { state } from "./core-v6.js?v=32.2";
import { CHAPTERS, SCENARIOS } from "./world-v6.js?v=32.2";

const BUILD = "31.0.0";

function loadStyles() {
  if (document.querySelector('link[data-football-lab-campaign="v31"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./game/campaign-v31.css?v=32.2";
  link.dataset.footballLabCampaign = "v31";
  document.head.appendChild(link);
}

function createStageContext() {
  const copy = document.querySelector(".stage-copy");
  if (!copy || document.getElementById("stageContextV31")) return;
  copy.insertAdjacentHTML("beforeend", `
    <small class="stage-context-v31" id="stageContextV31">
      <span id="stageChapterV31">CHAPTER 1 · FIRST TOUCH</span>
      <b aria-hidden="true">•</b>
      <span id="stageVenueV31">FOUNDATION GROUND</span>
      <b aria-hidden="true">•</b>
      <span id="stageWeatherV31">CLEAR MORNING</span>
    </small>
  `);
}

function createCampaignMap() {
  const modes = document.querySelector(".modes-section");
  if (!modes || document.getElementById("campaignMapV31")) return;
  const section = document.createElement("section");
  section.id = "campaignMapV31";
  section.className = "campaign-map-v31 panel";
  section.setAttribute("aria-labelledby", "campaignMapTitleV31");
  section.innerHTML = `
    <div class="campaign-map-heading-v31">
      <div><span>CLASSIC JOURNEY</span><h2 id="campaignMapTitleV31">SIX VENUES. THIRTY STAGES.</h2></div>
      <p>Clear each goal to advance. A miss resets only the streak, so every stage can be mastered at your pace.</p>
    </div>
    <div class="campaign-chapters-v31">
      ${CHAPTERS.map((chapter, index) => {
        const start = index * 5 + 1;
        const end = start + 4;
        return `
          <article data-environment="${chapter.environment}">
            <i>${String(chapter.number).padStart(2, "0")}</i>
            <div><span>STAGES ${String(start).padStart(2, "0")}–${String(end).padStart(2, "0")}</span><strong>${chapter.name}</strong><small>${chapter.venue} · ${chapter.weather}</small></div>
          </article>
        `;
      }).join("")}
    </div>
  `;
  modes.after(section);
}

function updateMenuNumbers() {
  const meta = document.querySelectorAll(".hero-meta span");
  if (meta[1]) meta[1].innerHTML = `<b>${SCENARIOS.length}</b> DESIGNED STAGES`;
  const classicCopy = document.querySelector("#classicCard small");
  if (classicCopy) classicCopy.textContent = "Travel through six venues and 30 handcrafted stages, then enter endless mastery cycles.";
}

function renderStageContext() {
  const stage = state.currentStage;
  if (!stage) return;
  const chapter = document.getElementById("stageChapterV31");
  const venue = document.getElementById("stageVenueV31");
  const weather = document.getElementById("stageWeatherV31");
  if (chapter) chapter.textContent = `CHAPTER ${stage.chapterNumber} · ${stage.chapterName}`;
  if (venue) venue.textContent = stage.venue;
  if (weather) weather.textContent = stage.weather;
  document.documentElement.dataset.footballLabEnvironment = stage.environment;
  document.documentElement.style.setProperty("--campaign-progress-v31", `${((stage.chapterStage || 1) / 5) * 100}%`);
  window.__footballLabStageContextV31 = {
    stage: state.stage + 1,
    chapter: stage.chapterNumber,
    chapterName: stage.chapterName,
    venue: stage.venue,
    weather: stage.weather,
    environment: stage.environment,
    keeperTier: stage.keeperTier,
    wallTier: stage.wallTier
  };
}

loadStyles();
createStageContext();
createCampaignMap();
updateMenuNumbers();
renderStageContext();

window.addEventListener("footballlab:keeperchange", renderStageContext);
window.addEventListener("footballlab:wallchange", renderStageContext);
window.addEventListener("footballlab:characterchange", renderStageContext);
window.addEventListener("footballlab:runsubmitted", renderStageContext);

window.__footballLabCampaignV31 = Object.freeze({
  build: BUILD,
  chapters: CHAPTERS.length,
  handcraftedStages: SCENARIOS.length,
  endlessMastery: true,
  environments: CHAPTERS.map((chapter) => chapter.environment)
});
