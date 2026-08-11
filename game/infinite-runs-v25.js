import { formatScore, profile, state } from "./core-v6.js?v=31";

const BUILD = "25.0.0";
let pausedPhase = null;
let finishRequested = false;

function injectStyles() {
  if (document.getElementById("infiniteRunsStylesV25")) return;
  const style = document.createElement("style");
  style.id = "infiniteRunsStylesV25";
  style.textContent = `
    .infinite-rules-v25 {
      display:grid;
      grid-template-columns:auto 1fr;
      gap:7px 12px;
      align-items:center;
      margin:12px 0 2px;
      padding:12px;
      border:1px solid rgba(218,254,77,.18);
      border-radius:12px;
      background:rgba(218,254,77,.045);
    }
    .infinite-rules-v25 strong {
      color:#dafe4d;
      font:1000 10px/1 system-ui;
      letter-spacing:.09em;
    }
    .infinite-rules-v25 span {
      color:rgba(238,246,235,.64);
      font:750 9px/1.35 system-ui;
      text-align:right;
    }
    .finish-run-v25 {
      width:100%;
      margin-top:10px;
      min-height:48px;
    }
    .finish-run-v25:disabled {
      cursor:not-allowed;
      opacity:.42;
      transform:none;
    }
    .finish-confirm-card-v25 { width:min(520px,100%); text-align:center; }
    .finish-confirm-card-v25 h2 { margin:8px 0 12px; }
    .finish-confirm-card-v25 > p { margin:0 auto; max-width:410px; }
    .finish-snapshot-v25 {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:9px;
      margin:23px 0;
    }
    .finish-snapshot-v25 div {
      display:grid;
      gap:5px;
      padding:15px 10px;
      border:1px solid rgba(255,255,255,.09);
      border-radius:12px;
      background:rgba(0,0,0,.18);
    }
    .finish-snapshot-v25 span {
      color:rgba(244,247,240,.58);
      font:800 9px/1 system-ui;
      letter-spacing:.13em;
    }
    .finish-snapshot-v25 strong { color:#dafe4d; font-size:24px; }
    .finish-actions-v25 {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:9px;
    }
    @media (max-width:700px) {
      .infinite-rules-v25 { grid-template-columns:1fr; }
      .infinite-rules-v25 span { text-align:left; }
      .finish-actions-v25 { grid-template-columns:1fr; }
    }
  `;
  document.head.appendChild(style);
}

function updatePermanentCopy() {
  const heroCopy = document.querySelector(".hero-copy");
  if (heroCopy) {
    heroCopy.textContent = "Aim anywhere, shape realistic curl and progress with no lives or time pressure. Misses reset the streak, never the stage. Submit when you are ready.";
  }
  const modeCopy = document.querySelector("#classicCard small");
  if (modeCopy) {
    modeCopy.textContent = "Master three inputs, progress through escalating stages and decide when to submit your score.";
  }
  const modeSectionCopy = document.querySelector(".modes-section .section-heading p");
  if (modeSectionCopy) {
    modeSectionCopy.textContent = "An unlimited free-kick run with no lives or timer. The challenge rises; you decide when full time arrives.";
  }

  const bestValue = document.getElementById("livesValue");
  const stat = bestValue?.closest("div");
  const label = stat?.querySelector("span");
  if (label) label.textContent = "PERSONAL BEST";
  updateBestValue();
}

function updateBestValue() {
  const bestValue = document.getElementById("livesValue");
  if (!bestValue) return;
  const formatted = formatScore(profile.highScore);
  if (bestValue.textContent !== formatted) bestValue.textContent = formatted;
  bestValue.title = `Saved personal best: ${formatted}`;
}

function injectRulesPanel() {
  document.querySelector(".run-rules-v152")?.remove();
  const control = document.querySelector(".control-panel");
  const heading = control?.querySelector(".control-heading");
  if (!control || !heading || control.querySelector(".infinite-rules-v25")) return;
  const panel = document.createElement("div");
  panel.className = "infinite-rules-v25";
  panel.innerHTML = "<strong>UNLIMITED RUN</strong><span>MISS = STREAK RESET · YOUR STAGE REMAINS · FINISH WHEN YOU CHOOSE</span>";
  heading.after(panel);
}

function injectFinishButton() {
  const action = document.getElementById("shotAction");
  if (!action || document.getElementById("finishRunV25")) return;
  const button = document.createElement("button");
  button.className = "button button-secondary finish-run-v25";
  button.id = "finishRunV25";
  button.type = "button";
  button.textContent = "FINISH & SUBMIT RUN";
  action.after(button);
  button.addEventListener("click", openFinishDialog);
}

function injectFinishDialog() {
  if (document.getElementById("finishRunModalV25")) return;
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "finishRunModalV25";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "finishRunTitleV25");
  modal.innerHTML = `
    <div class="modal-backdrop" data-close-finish-v25></div>
    <section class="modal-card panel finish-confirm-card-v25">
      <button class="modal-close" type="button" data-close-finish-v25 aria-label="Continue playing">×</button>
      <span class="section-label">VOLUNTARY FULL TIME</span>
      <h2 id="finishRunTitleV25">SUBMIT THIS RUN?</h2>
      <p>This records your score and ends the current run. Your career level and saved personal best remain.</p>
      <div class="finish-snapshot-v25">
        <div><span>CURRENT SCORE</span><strong id="finishScoreV25">0</strong></div>
        <div><span>STAGE REACHED</span><strong id="finishStageV25">1</strong></div>
      </div>
      <div class="finish-actions-v25">
        <button class="button button-secondary" type="button" data-close-finish-v25>KEEP PLAYING</button>
        <button class="button button-primary" id="confirmFinishV25" type="button">SUBMIT SCORE</button>
      </div>
    </section>
  `;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close-finish-v25]").forEach((button) => {
    button.addEventListener("click", closeFinishDialog);
  });
  modal.querySelector("#confirmFinishV25")?.addEventListener("click", submitRun);
}

function finishIsAvailable() {
  return state.screen === "game"
    && !state.animation
    && !state.presentation
    && ["ready", "power", "aim", "curve"].includes(state.phase)
    && !document.getElementById("gameOverModal")?.classList.contains("is-open");
}

function syncFinishButton() {
  const button = document.getElementById("finishRunV25");
  if (!button) return;
  const runOpen = state.screen === "game"
    && !document.getElementById("gameOverModal")?.classList.contains("is-open");
  button.disabled = !runOpen;
  button.textContent = finishRequested ? "FINISHING AFTER THIS SHOT…" : "FINISH & SUBMIT RUN";
  button.title = finishIsAvailable()
    ? "Submit your current score and finish the run"
    : "Your finish request will open safely after the current shot";

  if (finishRequested && finishIsAvailable()) openFinishDialog();
}

function openFinishDialog() {
  if (state.screen !== "game") return;
  if (!finishIsAvailable()) {
    finishRequested = true;
    syncFinishButton();
    return;
  }
  finishRequested = false;
  const modal = document.getElementById("finishRunModalV25");
  if (!modal) return;
  document.getElementById("finishScoreV25").textContent = formatScore(state.score);
  document.getElementById("finishStageV25").textContent = String(state.stage + 1);
  pausedPhase = state.phase;
  state.phase = "paused";
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => modal.querySelector("#confirmFinishV25")?.focus());
}

function closeFinishDialog() {
  finishRequested = false;
  const modal = document.getElementById("finishRunModalV25");
  if (!modal?.classList.contains("is-open")) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  if (pausedPhase) {
    state.phase = pausedPhase;
    state.lastTime = performance.now();
    state.actionLockedUntil = performance.now() + 120;
    pausedPhase = null;
  }
  requestAnimationFrame(() => document.getElementById("finishRunV25")?.focus());
}

function submitRun() {
  finishRequested = false;
  const modal = document.getElementById("finishRunModalV25");
  modal?.classList.remove("is-open");
  modal?.setAttribute("aria-hidden", "true");
  pausedPhase = null;
  window.dispatchEvent(new CustomEvent("footballlab:submitrun"));
}

injectStyles();
updatePermanentCopy();
injectRulesPanel();
injectFinishButton();
injectFinishDialog();

const bestValue = document.getElementById("livesValue");
if (bestValue) new MutationObserver(updateBestValue).observe(bestValue, { childList:true, characterData:true, subtree:true });
window.addEventListener("footballlab:openfinish", openFinishDialog);
window.addEventListener("footballlab:runsubmitted", () => {
  const modal = document.getElementById("finishRunModalV25");
  modal?.classList.remove("is-open");
  modal?.setAttribute("aria-hidden", "true");
  updateBestValue();
});
window.addEventListener("footballlab:runcomplete", updateBestValue);
setInterval(syncFinishButton, 120);
syncFinishButton();

window.__footballLabInfiniteRunsV25 = Object.freeze({
  build: BUILD,
  lives: false,
  timer: false,
  voluntarySubmission: true
});
