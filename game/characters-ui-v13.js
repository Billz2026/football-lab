import { state } from "./core-v6.js?v=7";
import { KICKERS, activeCharacter, characterById, selectCharacter } from "./characters-v13.js?v=13";

let selectedCandidateId = activeCharacter().id;
let pendingStartTarget = null;
let bypassStartIntercept = false;

function statBar(label, value) {
  return `
    <div class="kicker-stat">
      <span>${label}</span>
      <div><i style="width:${value}%"></i></div>
      <strong>${value}</strong>
    </div>`;
}

function cardMarkup(kicker) {
  return `
    <button class="kicker-card" type="button" data-kicker-id="${kicker.id}" aria-pressed="false" style="--kicker-accent:${kicker.accent}">
      <div class="kicker-card-head">
        <span class="kicker-icon">${kicker.icon}</span>
        <div><small>${kicker.nickname}</small><strong>${kicker.name}</strong><em>${kicker.role}</em></div>
        <b>#${kicker.number}</b>
      </div>
      <div class="kicker-stats">
        ${statBar("POWER", kicker.stats.power)}
        ${statBar("ACCURACY", kicker.stats.accuracy)}
        ${statBar("CURVE", kicker.stats.curve)}
        ${statBar("COMPOSURE", kicker.stats.composure)}
      </div>
      <div class="kicker-trait"><span>${kicker.trait}</span><p>${kicker.traitCopy}</p></div>
      <div class="kicker-weakness"><span>TRADE-OFF</span><p>${kicker.weakness}</p></div>
    </button>`;
}

function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    :root { --active-kicker-accent: #dafe4d; }
    .player-silhouette .player-body { background: var(--active-kicker-accent) !important; }
    .kicker-select-shell { position:fixed; inset:0; z-index:10020; display:none; align-items:center; justify-content:center; padding:22px; }
    .kicker-select-shell.is-open { display:flex; }
    .kicker-select-backdrop { position:absolute; inset:0; background:rgba(1,5,3,.88); backdrop-filter:blur(9px); }
    .kicker-select-panel { position:relative; width:min(1180px,96vw); max-height:min(900px,92vh); overflow:auto; border:1px solid rgba(218,254,77,.18); border-radius:22px; background:linear-gradient(145deg,rgba(7,19,12,.99),rgba(3,10,6,.99)); box-shadow:0 32px 100px rgba(0,0,0,.55); padding:26px; color:#f5faf2; }
    .kicker-select-top { display:flex; align-items:flex-start; justify-content:space-between; gap:22px; margin-bottom:22px; }
    .kicker-select-top small { color:#dafe4d; font:900 11px/1 system-ui; letter-spacing:.18em; }
    .kicker-select-top h2 { margin:8px 0 6px; font:1000 clamp(28px,4vw,46px)/.95 system-ui; letter-spacing:-.04em; }
    .kicker-select-top p { margin:0; max-width:700px; color:rgba(236,244,233,.67); font:650 13px/1.5 system-ui; }
    .kicker-select-close { width:42px; height:42px; flex:0 0 42px; border:1px solid rgba(255,255,255,.12); border-radius:12px; background:rgba(255,255,255,.045); color:#fff; font-size:24px; cursor:pointer; }
    .kicker-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
    .kicker-card { min-width:0; text-align:left; color:#eef7eb; border:1px solid rgba(255,255,255,.09); border-radius:17px; background:rgba(255,255,255,.026); padding:16px; cursor:pointer; transition:transform .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease; }
    .kicker-card:hover { transform:translateY(-2px); border-color:color-mix(in srgb,var(--kicker-accent) 55%,transparent); }
    .kicker-card.is-selected { border-color:var(--kicker-accent); background:color-mix(in srgb,var(--kicker-accent) 8%,rgba(255,255,255,.025)); box-shadow:0 0 0 1px color-mix(in srgb,var(--kicker-accent) 28%,transparent),0 18px 42px rgba(0,0,0,.28); }
    .kicker-card-head { display:grid; grid-template-columns:42px 1fr auto; gap:11px; align-items:center; padding-bottom:14px; border-bottom:1px solid rgba(255,255,255,.07); }
    .kicker-icon { display:grid; place-items:center; width:42px; height:42px; border-radius:12px; color:#07110b; background:var(--kicker-accent); font:1000 21px/1 system-ui; }
    .kicker-card-head small,.kicker-card-head em { display:block; font-style:normal; }
    .kicker-card-head small { color:var(--kicker-accent); font:850 8px/1.1 system-ui; letter-spacing:.12em; }
    .kicker-card-head strong { display:block; margin:4px 0; font:1000 17px/.95 system-ui; }
    .kicker-card-head em { color:rgba(236,244,233,.55); font:800 8px/1 system-ui; letter-spacing:.08em; }
    .kicker-card-head b { color:rgba(255,255,255,.18); font:1000 23px/1 system-ui; }
    .kicker-stats { display:grid; gap:8px; margin:15px 0; }
    .kicker-stat { display:grid; grid-template-columns:72px 1fr 25px; gap:8px; align-items:center; }
    .kicker-stat>span,.kicker-stat>strong { font:850 8px/1 system-ui; letter-spacing:.06em; }
    .kicker-stat>span { color:rgba(235,243,232,.58); }
    .kicker-stat>strong { text-align:right; color:#f7fbf5; }
    .kicker-stat>div { height:5px; overflow:hidden; border-radius:99px; background:rgba(255,255,255,.08); }
    .kicker-stat i { display:block; height:100%; border-radius:inherit; background:var(--kicker-accent); }
    .kicker-trait,.kicker-weakness { border-radius:11px; padding:11px; }
    .kicker-trait { background:color-mix(in srgb,var(--kicker-accent) 9%,rgba(255,255,255,.02)); border:1px solid color-mix(in srgb,var(--kicker-accent) 20%,transparent); }
    .kicker-weakness { margin-top:8px; background:rgba(255,255,255,.025); }
    .kicker-trait span,.kicker-weakness span { display:block; margin-bottom:5px; font:900 8px/1 system-ui; letter-spacing:.1em; }
    .kicker-trait span { color:var(--kicker-accent); }
    .kicker-weakness span { color:rgba(255,180,180,.72); }
    .kicker-trait p,.kicker-weakness p { margin:0; color:rgba(238,246,235,.68); font:650 10px/1.38 system-ui; }
    .kicker-select-footer { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-top:22px; padding-top:18px; border-top:1px solid rgba(255,255,255,.08); }
    .kicker-current-copy small { display:block; color:rgba(235,243,232,.48); font:850 9px/1 system-ui; letter-spacing:.11em; }
    .kicker-current-copy strong { display:block; margin-top:6px; color:var(--selected-accent,#dafe4d); font:1000 18px/1 system-ui; }
    .kicker-confirm { min-width:230px; border:0; border-radius:13px; padding:15px 22px; background:var(--selected-accent,#dafe4d); color:#07110b; font:1000 12px/1 system-ui; letter-spacing:.08em; cursor:pointer; }
    .character-summary-v13 { margin-top:12px; padding:11px 12px; border-radius:12px; border:1px solid color-mix(in srgb,var(--active-kicker-accent) 25%,transparent); background:color-mix(in srgb,var(--active-kicker-accent) 7%,transparent); }
    .character-summary-v13 strong { display:block; color:var(--active-kicker-accent); font:900 9px/1 system-ui; letter-spacing:.11em; }
    .character-summary-v13 span { display:block; margin-top:6px; color:rgba(235,243,232,.62); font:650 10px/1.4 system-ui; }
    .character-change-v13 { margin-top:10px; width:100%; border:1px solid rgba(255,255,255,.1); border-radius:10px; padding:10px; background:rgba(255,255,255,.035); color:#eff6ed; font:850 9px/1 system-ui; letter-spacing:.08em; cursor:pointer; }
    .active-kicker-chip-v13 { display:flex; align-items:center; gap:8px; margin-left:auto; padding:7px 10px; border-radius:10px; border:1px solid color-mix(in srgb,var(--active-kicker-accent) 26%,transparent); background:color-mix(in srgb,var(--active-kicker-accent) 7%,rgba(0,0,0,.15)); }
    .active-kicker-chip-v13 i { width:8px; height:8px; border-radius:50%; background:var(--active-kicker-accent); box-shadow:0 0 12px var(--active-kicker-accent); }
    .active-kicker-chip-v13 span { color:rgba(235,243,232,.5); font:800 8px/1 system-ui; letter-spacing:.08em; }
    .active-kicker-chip-v13 strong { color:#f6fbf4; font:900 9px/1 system-ui; }
    @media (max-width:980px) { .kicker-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media (max-width:620px) { .kicker-select-shell { padding:8px; } .kicker-select-panel { padding:17px; max-height:96vh; } .kicker-grid { grid-template-columns:1fr; } .kicker-select-footer { align-items:stretch; flex-direction:column; } .kicker-confirm { width:100%; min-width:0; } }
  `;
  document.head.appendChild(style);
}

function injectSelector() {
  const shell = document.createElement("div");
  shell.className = "kicker-select-shell";
  shell.id = "kickerSelectV13";
  shell.setAttribute("aria-hidden", "true");
  shell.innerHTML = `
    <div class="kicker-select-backdrop" data-kicker-close></div>
    <section class="kicker-select-panel" role="dialog" aria-modal="true" aria-labelledby="kickerSelectTitle">
      <header class="kicker-select-top">
        <div><small>PHASE 1 · KICKER ROSTER</small><h2 id="kickerSelectTitle">CHOOSE YOUR SPECIALIST</h2><p>Every kicker changes the meters and shot model. Pick a style that fits the stage rather than looking for one universal best character.</p></div>
        <button class="kicker-select-close" type="button" data-kicker-close aria-label="Close kicker selection">×</button>
      </header>
      <div class="kicker-grid">${KICKERS.map(cardMarkup).join("")}</div>
      <footer class="kicker-select-footer">
        <div class="kicker-current-copy"><small>SELECTED KICKER</small><strong id="kickerSelectedName"></strong></div>
        <button class="kicker-confirm" id="kickerConfirmV13" type="button">START WITH KICKER</button>
      </footer>
    </section>`;
  document.body.appendChild(shell);
  return shell;
}

function addProfileControls() {
  const panel = document.querySelector(".player-panel");
  if (panel && !panel.querySelector(".character-summary-v13")) {
    const summary = document.createElement("div");
    summary.className = "character-summary-v13";
    summary.innerHTML = `<strong></strong><span></span><button class="character-change-v13" type="button">CHANGE KICKER</button>`;
    const progress = panel.querySelector(".progress-block");
    progress?.before(summary);
    summary.querySelector("button")?.addEventListener("click", () => openSelector(null));
  }

  const topbar = document.querySelector(".game-topbar");
  if (topbar && !topbar.querySelector(".active-kicker-chip-v13")) {
    const chip = document.createElement("div");
    chip.className = "active-kicker-chip-v13";
    chip.innerHTML = `<i></i><div><span>KICKER</span><strong></strong></div>`;
    const stats = topbar.querySelector(".game-stats");
    stats?.before(chip);
  }
}

const shell = (() => {
  injectStyles();
  return injectSelector();
})();

function renderCandidate() {
  const candidate = characterById(selectedCandidateId);
  shell.style.setProperty("--selected-accent", candidate.accent);
  shell.querySelector("#kickerSelectedName").textContent = `${candidate.name} · ${candidate.trait}`;
  shell.querySelectorAll(".kicker-card").forEach((card) => {
    const selected = card.dataset.kickerId === candidate.id;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });
}

function renderActiveCharacter() {
  addProfileControls();
  const character = activeCharacter();
  document.documentElement.style.setProperty("--active-kicker-accent", character.accent);
  const profileTitle = document.querySelector(".player-card-top h2");
  if (profileTitle) profileTitle.textContent = character.name;
  const number = document.querySelector(".player-silhouette .player-body span");
  if (number) number.textContent = String(character.number);
  const summary = document.querySelector(".character-summary-v13");
  if (summary) {
    summary.querySelector("strong").textContent = `${character.trait} · ${character.role}`;
    summary.querySelector("span").textContent = character.traitCopy;
  }
  const chipName = document.querySelector(".active-kicker-chip-v13 strong");
  if (chipName) chipName.textContent = character.name;
}

function openSelector(startTarget) {
  if (state.screen === "game" && startTarget == null) return;
  pendingStartTarget = startTarget;
  selectedCandidateId = activeCharacter().id;
  renderCandidate();
  shell.classList.add("is-open");
  shell.setAttribute("aria-hidden", "false");
  shell.querySelector("#kickerConfirmV13").textContent = startTarget ? "START WITH KICKER" : "SELECT KICKER";
  document.body.style.overflow = "hidden";
}

function closeSelector() {
  shell.classList.remove("is-open");
  shell.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  pendingStartTarget = null;
}

shell.addEventListener("click", (event) => {
  const card = event.target.closest("[data-kicker-id]");
  if (card) {
    selectedCandidateId = card.dataset.kickerId;
    renderCandidate();
    return;
  }
  if (event.target.closest("[data-kicker-close]")) closeSelector();
});

shell.querySelector("#kickerConfirmV13").addEventListener("click", () => {
  const startTarget = pendingStartTarget;
  selectCharacter(selectedCandidateId);
  renderActiveCharacter();
  closeSelector();
  if (startTarget?.isConnected) {
    bypassStartIntercept = true;
    startTarget.click();
    bypassStartIntercept = false;
  }
});

document.addEventListener("click", (event) => {
  if (bypassStartIntercept) return;
  const target = event.target.closest("#playClassic,#classicCard,#modalPlay");
  if (!target) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openSelector(target);
}, true);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && shell.classList.contains("is-open")) {
    event.preventDefault();
    closeSelector();
  }
});

window.addEventListener("footballlab:characterchange", renderActiveCharacter);
window.__footballLabCharacters = KICKERS;
window.__footballLabActiveCharacter = activeCharacter;
renderActiveCharacter();
