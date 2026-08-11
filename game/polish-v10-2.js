import { state, elements } from "./core-v6.js?v=32.2";

const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
let lastPresentationPhase = null;
let phaseStartedAt = performance.now();
let autoAdvancedPhase = null;

function timingForPresentation(presentation) {
  if (!presentation) return null;
  if (presentation.phase === "replay") {
    if (reducedMotion) return 160;
    if (presentation.outcome === "SAVE") return 920;
    if (presentation.outcome === "POST" || presentation.outcome === "BAR") return 820;
    return presentation.topCorner ? 900 : 680;
  }
  if (presentation.phase === "breakdown") return reducedMotion ? 850 : 1500;
  if (presentation.phase === "stage") return reducedMotion ? 500 : 900;
  return null;
}

function updatePacing(time) {
  const presentation = state.presentation;
  const phase = presentation?.phase ?? null;
  if (phase !== lastPresentationPhase) {
    lastPresentationPhase = phase;
    phaseStartedAt = time;
    autoAdvancedPhase = null;
  }

  const limit = timingForPresentation(presentation);
  if (!limit || autoAdvancedPhase === phase) return;
  if (time - phaseStartedAt < limit) return;
  if (document.hidden || state.screen !== "game") return;

  autoAdvancedPhase = phase;
  elements.shotAction?.click();
}

function injectPolishStyles() {
  const style = document.createElement("style");
  style.textContent = `
    #shotAction { transition: transform .12s ease, filter .12s ease; }
    #shotAction:active { transform: translateY(1px) scale(.995); }
    .result-banner.is-visible { letter-spacing: .035em; }
    @media (prefers-reduced-motion: reduce) {
      #shotAction { transition: none; }
    }
  `;
  document.head.appendChild(style);
}

function polishFrame(time) {
  if (state.screen === "game") updatePacing(time);
  requestAnimationFrame(polishFrame);
}

injectPolishStyles();
requestAnimationFrame(polishFrame);
