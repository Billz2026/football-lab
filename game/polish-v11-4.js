import { elements } from "./core-v6.js?v=32.3";

const banner = elements.resultBanner;

function compactResultBanner() {
  const text = banner?.textContent?.trim() || "";
  if (!text) return;

  const points = text.match(/\+([\d,]+)/)?.[1];
  if (text.startsWith("TOP CORNER")) {
    banner.textContent = points ? `+${points} · TOP CORNER BONUS` : "TOP CORNER BONUS";
    return;
  }
  if (text.startsWith("PERFECT STRIKE")) {
    banner.textContent = points ? `+${points} · PERFECT CONTACT` : "PERFECT CONTACT";
    return;
  }
  if (text.startsWith("GOAL")) {
    banner.textContent = points ? `+${points} POINTS` : "POINTS AWARDED";
    return;
  }

  // The canvas already states SAVED, BLOCKED, POST, CROSSBAR or WIDE.
  // Hiding the repeated DOM banner leaves one clear outcome message.
  banner.textContent = "";
  banner.className = "result-banner";
}

if (banner) {
  new MutationObserver(compactResultBanner).observe(banner, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
  });
}

const style = document.createElement("style");
style.textContent = `
  .result-banner:empty { display: none; }
  .result-banner.is-visible { max-width: min(72%, 620px); }
`;
document.head.appendChild(style);
