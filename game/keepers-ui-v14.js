import { state } from "./core-v6.js?v=32.2";
import { keeperForStage } from "./keepers-v14.js?v=32.2";

function injectStyles() {
  if (document.getElementById("keeperStylesV14")) return;
  const style = document.createElement("style");
  style.id = "keeperStylesV14";
  style.textContent = `
    :root { --active-keeper-accent:#dafe4d; }
    .active-keeper-chip-v14 { display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:10px; border:1px solid color-mix(in srgb,var(--active-keeper-accent) 30%,transparent); background:color-mix(in srgb,var(--active-keeper-accent) 7%,rgba(0,0,0,.15)); }
    .active-keeper-chip-v14 i { display:grid; place-items:center; width:24px; height:24px; border-radius:8px; color:#07110b; background:var(--active-keeper-accent); font:1000 12px/1 system-ui; }
    .active-keeper-chip-v14 span { display:block; color:rgba(235,243,232,.5); font:800 8px/1 system-ui; letter-spacing:.08em; }
    .active-keeper-chip-v14 strong { display:block; margin-top:3px; color:#f6fbf4; font:900 9px/1 system-ui; }
    .active-keeper-chip-v14 em { display:block; margin-top:3px; color:var(--active-keeper-accent); font:800 7px/1 system-ui; font-style:normal; letter-spacing:.06em; }
    @media (max-width:900px) { .active-keeper-chip-v14 em { display:none; } }
    @media (max-width:720px) { .active-keeper-chip-v14 { display:none; } }
  `;
  document.head.appendChild(style);
}

function ensureChip() {
  const topbar = document.querySelector(".game-topbar");
  if (!topbar) return null;
  let chip = topbar.querySelector(".active-keeper-chip-v14");
  if (!chip) {
    chip = document.createElement("div");
    chip.className = "active-keeper-chip-v14";
    chip.setAttribute("aria-label", "Current goalkeeper opponent");
    chip.innerHTML = `<i></i><div><span>OPPONENT</span><strong></strong><em></em></div>`;
    const stats = topbar.querySelector(".game-stats");
    stats?.before(chip);
  }
  return chip;
}

function renderKeeper(keeper = keeperForStage(state.stage)) {
  const chip = ensureChip();
  if (!chip) return;
  document.documentElement.style.setProperty("--active-keeper-accent", keeper.accent);
  chip.querySelector("i").textContent = keeper.icon;
  chip.querySelector("strong").textContent = keeper.name;
  chip.querySelector("em").textContent = `${keeper.role} · T${keeper.tier}`;
  chip.title = `${keeper.trait}: ${keeper.traitCopy}`;
}

injectStyles();
renderKeeper();
window.addEventListener("footballlab:keeperchange", (event) => renderKeeper(event.detail));
window.addEventListener("footballlab:characterchange", () => renderKeeper());
