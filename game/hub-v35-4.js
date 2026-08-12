const BUILD = "35.4.0";

function ensureHubStyle(){
  if (document.querySelector("link[data-football-lab-hub='35.4']")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./game/hub-v35-4.css?v=35.4";
  link.dataset.footballLabHub = "35.4";
  document.head.appendChild(link);
}

const TILE_COPY = new Map([
  [".hub-mode-training p", "Build your session. Practise without limits."],
  [".hub-mode-free-kicks p", "Master curl, power and contact."],
  [".hub-mode-penalties p", "Placement, power and nerve."],
  [".hub-mode-corners p", "Deliver, attack and finish."],
  [".hub-mode-finishing p", "Beat the keeper from live situations."],
  [".hub-mode-scenarios p", "Recreate high-pressure football moments."]
]);

function tightenTileCopy(){
  TILE_COPY.forEach((copy, selector) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = copy;
  });
}

function promoteFuturePanelIntoMosaic(){
  const grid = document.querySelector(".hub-mode-grid");
  const future = document.querySelector(".hub-future-strip");
  if (!grid || !future || future.parentElement === grid) return;
  grid.appendChild(future);
}

function markArtworkReadyTiles(){
  document.querySelectorAll(".hub-mode-tile").forEach((tile) => {
    tile.dataset.artReady = "true";
  });
}

function setPlayNavActive(){
  document.querySelectorAll(".hub-nav a").forEach((link) => link.classList.remove("is-active"));
  const play = document.querySelector(".hub-nav a[href='#modeHub']");
  play?.classList.add("is-active");
}

function applyHubV354(){
  ensureHubStyle();
  tightenTileCopy();
  promoteFuturePanelIntoMosaic();
  markArtworkReadyTiles();
  setPlayNavActive();
}

applyHubV354();

window.__footballLabHubV354 = Object.freeze({
  build: BUILD,
  layout: "asymmetric-console-mosaic",
  copy: "short-form-mode-descriptions",
  lockedModes: "visually-subordinate",
  futurePanel: "mosaic-integrated",
  artworkSlots: "cinematic-ready"
});
