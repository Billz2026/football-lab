const STYLE_ID = "mobileGameplayStylesV16";
const GAME_CLASS = "is-game-active";

function ensureStylesheet() {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.href = "./mobile-v16.css?v=16";
  document.head.appendChild(link);
}

function viewportHeight() {
  return Math.max(320, Math.round(window.visualViewport?.height || window.innerHeight));
}

function syncViewportVariable() {
  document.documentElement.style.setProperty("--game-viewport-height", `${viewportHeight()}px`);
}

function syncGameMode() {
  const gameScreen = document.getElementById("gameScreen");
  const active = Boolean(gameScreen?.classList.contains("is-active"));
  document.body.classList.toggle(GAME_CLASS, active);
  document.documentElement.dataset.gameLayout = active ? "active" : "menu";

  if (active) {
    syncViewportVariable();
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }
}

ensureStylesheet();
syncViewportVariable();
syncGameMode();

const gameScreen = document.getElementById("gameScreen");
if (gameScreen) {
  new MutationObserver(syncGameMode).observe(gameScreen, {
    attributes: true,
    attributeFilter: ["class"]
  });
}

window.addEventListener("resize", syncViewportVariable, { passive: true });
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    syncViewportVariable();
    syncGameMode();
  }, 120);
}, { passive: true });
window.visualViewport?.addEventListener("resize", syncViewportVariable, { passive: true });
window.visualViewport?.addEventListener("scroll", syncViewportVariable, { passive: true });
