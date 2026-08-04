import { state, MAX_LIVES, LIFE_STREAK_TARGET } from "./core-v6.js?v=7";

function injectStyles() {
  if (document.getElementById("runRulesStylesV152")) return;
  const style = document.createElement("style");
  style.id = "runRulesStylesV152";
  style.textContent = `
    .run-rules-v152 { display:grid; grid-template-columns:auto 1fr; gap:10px 12px; align-items:center; margin:12px 0 2px; padding:11px 12px; border:1px solid rgba(218,254,77,.16); border-radius:12px; background:rgba(218,254,77,.045); }
    .run-rules-v152>strong { color:#dafe4d; font:1000 10px/1 system-ui; letter-spacing:.09em; }
    .run-rules-v152>span { color:rgba(238,246,235,.62); font:750 9px/1.3 system-ui; text-align:right; }
    .life-progress-v152 { grid-column:1/-1; display:flex; align-items:center; gap:7px; }
    .life-progress-v152 i { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,.1); box-shadow:inset 0 0 0 1px rgba(255,255,255,.08); transition:background .18s ease,transform .18s ease,box-shadow .18s ease; }
    .life-progress-v152 i.is-active { background:#dafe4d; box-shadow:0 0 10px rgba(218,254,77,.55); transform:scale(1.08); }
    .life-progress-v152 small { margin-left:auto; color:rgba(238,246,235,.44); font:800 8px/1 system-ui; letter-spacing:.07em; }
    .run-rules-v152.is-restored { animation:lifeRestorePulseV152 .8s ease; }
    @keyframes lifeRestorePulseV152 { 0%,100% { border-color:rgba(218,254,77,.16); box-shadow:none; } 35% { border-color:#dafe4d; box-shadow:0 0 24px rgba(218,254,77,.28); } }
  `;
  document.head.appendChild(style);
}

function updateMenuCopy() {
  const heroCopy = document.querySelector(".hero-copy");
  if (heroCopy) heroCopy.textContent = "Choose a specialist, survive 15 handcrafted free-kick scenarios and recover lost lives by building three-goal streaks.";
  const meta = document.querySelectorAll(".hero-meta span");
  if (meta[1]) meta[1].innerHTML = "<b>15+</b> SCENARIOS";
  const modeCopy = document.querySelector("#classicCard small");
  if (modeCopy) modeCopy.textContent = "Five lives, streak recovery and escalating distance, wall, goalkeeper and wind challenges.";
  const livesNode = document.getElementById("livesValue");
  if (livesNode && !state.misses) livesNode.textContent = Array.from({ length: MAX_LIVES }, () => "●").join(" ");
}

function ensurePanel() {
  const control = document.querySelector(".control-panel");
  if (!control) return null;
  let panel = control.querySelector(".run-rules-v152");
  if (panel) return panel;
  panel = document.createElement("div");
  panel.className = "run-rules-v152";
  panel.innerHTML = `
    <strong>${MAX_LIVES} LIVES</strong>
    <span>MISS = −1 · ${LIFE_STREAK_TARGET} GOALS IN A ROW = +1</span>
    <div class="life-progress-v152" aria-label="Life recovery streak progress">
      ${Array.from({ length: LIFE_STREAK_TARGET }, () => "<i></i>").join("")}
      <small></small>
    </div>`;
  const heading = control.querySelector(".control-heading");
  heading?.after(panel);
  return panel;
}

function render() {
  const panel = ensurePanel();
  if (!panel) return;
  const progress = state.streak % LIFE_STREAK_TARGET;
  const lives = Math.max(0, MAX_LIVES - state.misses);
  panel.querySelectorAll("i").forEach((dot, index) => dot.classList.toggle("is-active", index < progress));
  const copy = panel.querySelector("small");
  copy.textContent = lives >= MAX_LIVES
    ? "LIVES FULL"
    : `${progress}/${LIFE_STREAK_TARGET} TO RESTORE`;
  const livesNode = document.getElementById("livesValue");
  if (livesNode) livesNode.title = `${lives} of ${MAX_LIVES} lives · ${progress}/${LIFE_STREAK_TARGET} goals toward recovery`;
}

injectStyles();
updateMenuCopy();
render();

const streakNode = document.getElementById("streakValue");
const livesNode = document.getElementById("livesValue");
const observer = new MutationObserver(render);
if (streakNode) observer.observe(streakNode, { childList: true, characterData: true, subtree: true });
if (livesNode) observer.observe(livesNode, { childList: true, characterData: true, subtree: true });

window.addEventListener("footballlab:liferestored", () => {
  const panel = ensurePanel();
  if (!panel) return;
  panel.classList.remove("is-restored");
  requestAnimationFrame(() => panel.classList.add("is-restored"));
  setTimeout(() => panel.classList.remove("is-restored"), 900);
  render();
});
