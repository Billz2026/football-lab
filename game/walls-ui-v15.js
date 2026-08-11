import { state } from "./core-v6.js?v=32.2";
import { wallForStage } from "./walls-v15.js?v=32.2";

function injectStyles() {
  if (document.getElementById("wallStylesV15")) return;
  const style = document.createElement("style");
  style.id = "wallStylesV15";
  style.textContent = `
    :root { --active-wall-accent:#7ca98b; }
    .active-wall-chip-v15 { display:grid; grid-template-columns:34px 1fr; gap:10px; align-items:center; margin:12px 0 4px; padding:10px 11px; border-radius:12px; border:1px solid color-mix(in srgb,var(--active-wall-accent) 30%,transparent); background:color-mix(in srgb,var(--active-wall-accent) 7%,rgba(0,0,0,.12)); }
    .active-wall-chip-v15 i { display:grid; place-items:center; width:34px; height:34px; border-radius:10px; color:#07110b; background:var(--active-wall-accent); font:1000 17px/1 system-ui; }
    .active-wall-chip-v15 span { display:block; color:rgba(235,243,232,.48); font:800 8px/1 system-ui; letter-spacing:.09em; }
    .active-wall-chip-v15 strong { display:block; margin-top:4px; color:#f6fbf4; font:950 10px/1 system-ui; }
    .active-wall-chip-v15 em { display:block; margin-top:4px; color:var(--active-wall-accent); font:800 8px/1.2 system-ui; font-style:normal; letter-spacing:.04em; }
    @media (max-width:720px) { .active-wall-chip-v15 em { display:none; } }
  `;
  document.head.appendChild(style);
}

function ensureChip() {
  const panel = document.querySelector(".control-panel");
  if (!panel) return null;
  let chip = panel.querySelector(".active-wall-chip-v15");
  if (!chip) {
    chip = document.createElement("div");
    chip.className = "active-wall-chip-v15";
    chip.setAttribute("aria-label", "Current defensive wall");
    chip.innerHTML = `<i></i><div><span>DEFENSIVE WALL</span><strong></strong><em></em></div>`;
    const steps = panel.querySelector(".shot-steps");
    steps?.before(chip);
  }
  return chip;
}

function renderWall(wall = wallForStage(state.stage)) {
  const chip = ensureChip();
  if (!chip) return;
  document.documentElement.style.setProperty("--active-wall-accent", wall.accent);
  chip.querySelector("i").textContent = wall.icon;
  chip.querySelector("strong").textContent = wall.name;
  chip.querySelector("em").textContent = `${wall.role} · T${wall.tier}`;
  chip.title = `${wall.trait}: ${wall.traitCopy} Best route: ${wall.solution}`;
}

injectStyles();
renderWall();
window.addEventListener("footballlab:wallchange", (event) => renderWall(event.detail));
window.addEventListener("footballlab:keeperchange", () => renderWall());
window.addEventListener("footballlab:characterchange", () => renderWall());
