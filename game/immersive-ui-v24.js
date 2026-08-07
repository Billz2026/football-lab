const IMMERSIVE_BUILD = "24.1";

function appendStylesheet(href, marker, value) {
  if (document.querySelector(`link[${marker}="${value}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute(marker, value);
  document.head.appendChild(link);
}

function loadImmersiveStyles() {
  appendStylesheet(`./game/immersive-ui-v24.css?v=${IMMERSIVE_BUILD}`, "data-football-lab-immersive", "v24");
  appendStylesheet(`./game/desktop-fit-v24-1.css?v=${IMMERSIVE_BUILD}`, "data-football-lab-desktop-fit", "v24.1");
}

function polishProductionMenu() {
  const modes = document.querySelector(".modes-section");
  if (!modes) return;

  const label = modes.querySelector(".section-label");
  const title = modes.querySelector(".section-heading h2");
  const copy = modes.querySelector(".section-heading p");
  const classic = document.querySelector("#classicCard");

  if (label) label.textContent = "FEATURED MODE";
  if (title) title.textContent = "CLASSIC KICKS";
  if (copy) copy.textContent = "Master power, placement and curve in the core Football Lab challenge. Build your streak, beat tougher keepers and chase a new personal best.";

  document.querySelectorAll(".mode-card").forEach((card) => {
    if (card !== classic) card.remove();
  });

  if (classic) {
    classic.querySelector(".mode-number")?.remove();
    const status = classic.querySelector(".mode-status");
    const description = classic.querySelector("small");
    const cta = classic.querySelector(".mode-cta");
    if (status) status.textContent = "PLAY NOW";
    if (description) description.textContent = "Choose a specialist, master three inputs and survive escalating free-kick stages.";
    if (cta) cta.innerHTML = "CHOOSE KICKER <b>→</b>";
  }
}

function markImmersiveExperience() {
  document.documentElement.dataset.footballLabUi = "immersive-v24";
}

loadImmersiveStyles();
polishProductionMenu();
markImmersiveExperience();

window.__footballLabImmersiveUiV24 = true;
