import "./refinement-v37-1.js?v=37.1";

const release = () => {
  document.documentElement.dataset.footballLabBuild = "37.1";
  const badge = document.querySelector(".build-badge-v22");
  if (badge) {
    badge.textContent = "V37.1";
    badge.title = "Football Lab build 37.1.0";
  }
  const version = document.querySelector(".settings-version-v22 strong");
  if (version) version.textContent = "37.1.0";
  const previous = window.__footballLabReleaseV370 || {};
  window.__footballLabReleaseV371 = Object.freeze({
    ...previous,
    build: "37.1.0",
    aimRiskHalo: "dynamic-curve-distance-mode-risk-without-solved-path",
    executionFeedback: "intended-vs-actual-placement-error-and-contact",
    trainingAccuracy: "isolated-live-percentage-display",
    standardDifficultyChanged: false,
    cacheGeneration: "37.1"
  });
};

setTimeout(release, 0);
setTimeout(release, 500);
window.addEventListener("footballlab:trainingstart", release);
