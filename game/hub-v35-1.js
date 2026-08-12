const BUILD = "35.1.0";

function wireTrainingTile() {
  const hubTile = document.getElementById("trainingCardV35");
  const legacyTile = document.querySelector(".hub-training-bridge .training-card-v35");
  if (!hubTile || !legacyTile || hubTile.dataset.trainingWired === "true") return false;
  hubTile.dataset.trainingWired = "true";
  hubTile.addEventListener("click", () => legacyTile.click());
  return true;
}

function restoreHubLabels() {
  const classicNumber = document.querySelector("#classicCard .mode-number");
  if (classicNumber) classicNumber.textContent = "02 · FLAGSHIP MODE";
}

function wireHub() {
  restoreHubLabels();
  if (!wireTrainingTile()) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      restoreHubLabels();
      if (wireTrainingTile() || attempts > 30) clearInterval(timer);
    }, 50);
  }
}

wireHub();

window.addEventListener("footballlab:trainingstart", () => {
  document.querySelector(".hub-nav a[href='#trainingCardV35']")?.blur();
});

window.__footballLabHubV351 = Object.freeze({
  build: BUILD,
  navigation: "static-mode-hub",
  trainingTile: "static-with-legacy-modal-bridge",
  kickerSelection: "inside-classic-mode-entry",
  primaryModes: ["free-training", "classic-free-kicks", "penalties", "corners", "finishing", "match-scenarios"]
});
