import { state } from "./core-v6.js?v=32.4";
import { CHAPTERS, SCENARIOS } from "./world-v6.js?v=32.4";

const BUILD = "41.0.0";
const STORAGE_KEY = "footballLabCampaignProgressV41";

const IDENTITIES = Object.freeze({
  academy: Object.freeze({ label: "CONTROL & FOUNDATIONS", copy: "Learn clean contact, placement and controlled curl before the pressure rises.", tier: "ACADEMY" }),
  city: Object.freeze({ label: "ANGLES & CROSSWIND", copy: "Wider positions, stronger walls and changing breeze force better shot planning.", tier: "CITY" }),
  night: Object.freeze({ label: "RANGE & PRECISION", copy: "Longer strikes under the lights reward power control and disciplined placement.", tier: "CONTINENTAL" }),
  storm: Object.freeze({ label: "WEATHER & COMPOSURE", copy: "Driving rain and heavier wind punish loose execution and rushed contact.", tier: "ELITE" }),
  world: Object.freeze({ label: "PRESSURE & ELITE KEEPERS", copy: "Prime-time stages combine range, walls and stronger goalkeeping with less margin.", tier: "WORLD" }),
  summit: Object.freeze({ label: "MASTERY", copy: "The final five stages demand complete control of power, curl, contact and nerve.", tier: "LEGENDS" })
});

function loadStyles() {
  if (document.querySelector('link[data-football-lab-campaign="v41"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./game/campaign-v41.css?v=41.0.0";
  link.dataset.footballLabCampaign = "v41";
  document.head.appendChild(link);
}

function loadProgress() {
  try {
    return { highestStage: 1, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { highestStage: 1 };
  }
}

const progress = loadProgress();

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function challengeForStage(stage) {
  if (!stage) return "CLASSIC FREE KICK";
  if ((stage.chapterStage || 1) === 5 && Number(stage.cycle || 0) === 0) return "CHAPTER FINAL";
  if (stage.weatherId === "rain") return "WEATHER TEST";
  if ((stage.wallPlayers || 0) >= 6) return "HEAVY WALL";
  if (Math.abs(stage.ballX || 0) >= 5.5) return "WIDE ANGLE";
  if ((stage.distanceYards || 0) >= 35) return "LONG RANGE";
  if (Math.abs(stage.wind || 0) >= 0.16) return "WIND CONTROL";
  return "TECHNIQUE TEST";
}

function createGameIdentity() {
  const frame = document.querySelector(".game-frame");
  if (!frame || document.getElementById("venueIdentityV41")) return;
  frame.insertAdjacentHTML("beforeend", `
    <div class="venue-identity-v41" id="venueIdentityV41" aria-live="polite">
      <span id="venueTierV41">ACADEMY VENUE</span>
      <strong id="venueNameV41">FOUNDATION GROUND</strong>
      <small id="venueChallengeV41">STAGE 1/5 · TECHNIQUE TEST</small>
    </div>
  `);
}

function createJourney() {
  if (document.getElementById("campaignJourneyV41")) return;
  const anchor = document.querySelector(".hub-modes-section") || document.querySelector(".modes-section");
  if (!anchor) return;
  const section = document.createElement("section");
  section.id = "campaignJourneyV41";
  section.className = "campaign-journey-v41 panel";
  section.innerHTML = `
    <div class="campaign-journey-heading-v41">
      <div><span>CLASSIC FREE KICKS · CAMPAIGN</span><h2>SIX VENUES. THIRTY DISTINCT TESTS.</h2></div>
      <p>The difficulty curve now changes the occasion as well as the numbers: every five-stage chapter has its own football identity and a dedicated final.</p>
    </div>
    <div class="campaign-journey-grid-v41">
      ${CHAPTERS.map((chapter, index) => {
        const identity = IDENTITIES[chapter.environment] || IDENTITIES.academy;
        const start = index * 5 + 1;
        const end = start + 4;
        return `
          <article data-chapter="${chapter.number}" data-environment="${chapter.environment}">
            <div class="campaign-chapter-top-v41"><i>${String(chapter.number).padStart(2, "0")}</i><span>${identity.tier}</span></div>
            <strong>${chapter.name}</strong>
            <b>${chapter.venue}</b>
            <small>STAGES ${String(start).padStart(2, "0")}–${String(end).padStart(2, "0")} · ${chapter.weather}</small>
            <em>${identity.label}</em>
            <p>${identity.copy}</p>
            <div class="campaign-stage-dots-v41" aria-label="Five stages">${Array.from({ length: 5 }, (_, stage) => `<span data-stage="${start + stage}"></span>`).join("")}</div>
          </article>`;
      }).join("")}
    </div>
    <div class="campaign-journey-footer-v41"><span>CHAPTER FINALS</span><b>05 · 10 · 15 · 20 · 25 · 30</b><small>Every fifth stage is treated as a major occasion before the next venue unlocks.</small></div>`;
  anchor.after(section);
}

function updateJourney() {
  const highest = Math.max(1, progress.highestStage || 1);
  document.querySelectorAll("#campaignJourneyV41 article").forEach((card) => {
    const chapter = Number(card.dataset.chapter) || 1;
    const start = (chapter - 1) * 5 + 1;
    const end = start + 4;
    card.classList.toggle("is-complete", highest > end);
    card.classList.toggle("is-current", highest >= start && highest <= end);
    card.classList.toggle("is-locked", highest < start);
  });
  document.querySelectorAll("#campaignJourneyV41 .campaign-stage-dots-v41 span").forEach((dot) => {
    const stage = Number(dot.dataset.stage) || 1;
    dot.classList.toggle("is-cleared", stage < highest);
    dot.classList.toggle("is-current", stage === highest);
    dot.classList.toggle("is-final", stage % 5 === 0);
  });
}

function updateGameIdentity() {
  const stage = state.currentStage;
  if (!stage) return;
  const identity = IDENTITIES[stage.environment] || IDENTITIES.academy;
  const final = (stage.chapterStage || 1) === 5 && Number(stage.cycle || 0) === 0;
  const tier = document.getElementById("venueTierV41");
  const venue = document.getElementById("venueNameV41");
  const challenge = document.getElementById("venueChallengeV41");
  if (tier) tier.textContent = final ? `${identity.tier} VENUE · CHAPTER FINAL` : `${identity.tier} VENUE`;
  if (venue) venue.textContent = stage.venue;
  if (challenge) challenge.textContent = `STAGE ${stage.chapterStage || 1}/5 · ${challengeForStage(stage)}`;
  document.documentElement.dataset.footballLabChapterV41 = String(stage.chapterNumber || 1);
  document.documentElement.dataset.footballLabChapterFinalV41 = final ? "true" : "false";
  document.documentElement.dataset.footballLabVenueTierV41 = identity.tier.toLowerCase();

  if (state.screen === "game") {
    const reached = Math.min(SCENARIOS.length + 1, Math.max(1, state.stage + 1));
    if (reached > progress.highestStage) {
      progress.highestStage = reached;
      saveProgress();
      updateJourney();
    }
  }

  window.__footballLabCampaignV41 = {
    build: BUILD,
    highestStage: progress.highestStage,
    stage: state.stage + 1,
    chapter: stage.chapterNumber,
    chapterStage: stage.chapterStage,
    venue: stage.venue,
    environment: stage.environment,
    weather: stage.weather,
    weatherId: stage.weatherId,
    venueTier: identity.tier,
    identity: identity.label,
    challenge: challengeForStage(stage),
    chapterFinal: final
  };
}

function updatePhaseCopy(event) {
  const phase = event?.detail?.phase;
  if (phase !== "ready") return;
  const stage = state.currentStage;
  if (!stage) return;
  const identity = IDENTITIES[stage.environment] || IDENTITIES.academy;
  const help = document.getElementById("phaseHelp");
  if (help) {
    const final = (stage.chapterStage || 1) === 5 && Number(stage.cycle || 0) === 0;
    const context = final
      ? "CHAPTER FINAL"
      : Number(stage.cycle || 0) > 0
        ? `MASTERY ${Number(stage.cycle) + 1} · STAGE ${stage.chapterStage || 1}/5`
        : `STAGE ${stage.chapterStage || 1}/5`;
    help.textContent = `${context} · ${identity.label}. Misses reset the streak, never your stage.`;
  }
}

loadStyles();
createGameIdentity();
createJourney();
updateJourney();
updateGameIdentity();

window.addEventListener("footballlab:keeperchange", updateGameIdentity);
window.addEventListener("footballlab:wallchange", updateGameIdentity);
window.addEventListener("footballlab:phasechange", (event) => {
  updateGameIdentity();
  updatePhaseCopy(event);
});
window.addEventListener("footballlab:runsubmitted", () => {
  updateGameIdentity();
  updateJourney();
});

window.__footballLabCampaignProgressionV41 = Object.freeze({
  build: BUILD,
  chapters: CHAPTERS.length,
  stages: SCENARIOS.length,
  chapterFinals: [5, 10, 15, 20, 25, 30],
  progressionStorage: STORAGE_KEY,
  levelIdentity: true,
  venueIdentity: true
});