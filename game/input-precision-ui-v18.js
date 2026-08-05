import { state, idealPower } from "./core-v6.js?v=7";

const meter = document.querySelector(".meter");
const meterWrap = document.querySelector(".meter-wrap");

if (!meter || !meterWrap) {
  throw new Error("V18 precision UI could not find the shot meter");
}

const style = document.createElement("style");
style.textContent = `
  .meter { isolation:isolate; }
  .meter > span { position:relative; z-index:1; }
  .meter > i { z-index:5; }
  .precision-zone-v18 {
    position:absolute;
    top:2px;
    bottom:2px;
    left:0;
    width:0;
    z-index:3;
    border:1px solid rgba(255,255,255,.82);
    border-radius:5px;
    background:rgba(218,254,77,.18);
    box-shadow:0 0 13px rgba(218,254,77,.28), inset 0 0 8px rgba(218,254,77,.2);
    opacity:0;
    pointer-events:none;
    transition:opacity .12s ease, left .12s ease, width .12s ease;
  }
  .meter[data-precision-phase="power"] .precision-zone-v18,
  .meter[data-precision-phase="curve"] .precision-zone-v18 { opacity:1; }
  .meter[data-precision-phase="curve"] .precision-zone-v18 {
    border-color:rgba(116,220,255,.78);
    background:rgba(116,220,255,.12);
    box-shadow:0 0 12px rgba(116,220,255,.2), inset 0 0 8px rgba(116,220,255,.14);
  }
  .precision-grid-v18 {
    position:absolute;
    inset:0;
    z-index:2;
    opacity:0;
    pointer-events:none;
    transition:opacity .12s ease;
  }
  .meter[data-precision-phase="aim"] .precision-grid-v18 { opacity:.82; }
  .precision-grid-v18 i {
    position:absolute;
    top:2px;
    bottom:2px;
    width:1px;
    background:rgba(255,255,255,.42);
    box-shadow:none;
    transform:none;
  }
  .precision-grid-v18 i:first-child { left:33.333%; }
  .precision-grid-v18 i:last-child { left:66.666%; }
  .precision-hint-v18 {
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    min-height:16px;
    margin-top:7px;
    color:rgba(239,247,236,.46);
    font:800 8px/1.2 system-ui;
    letter-spacing:.09em;
    text-transform:uppercase;
  }
  .precision-hint-v18 strong {
    color:rgba(239,247,236,.78);
    font:900 8px/1.2 system-ui;
  }
  .meter.is-precision-locked-v18 > i {
    animation:precision-lock-v18 .16s ease-out;
  }
  @keyframes precision-lock-v18 {
    0% { transform:translateX(-50%) scaleY(1); filter:none; }
    45% { transform:translateX(-50%) scaleY(1.24); filter:brightness(1.8); }
    100% { transform:translateX(-50%) scaleY(1); filter:none; }
  }
  @media (max-width:700px) {
    .precision-hint-v18 { font-size:7px; letter-spacing:.065em; }
    .precision-hint-v18 strong { font-size:7px; }
  }
`;
document.head.appendChild(style);

const zone = document.createElement("div");
zone.className = "precision-zone-v18";
zone.setAttribute("aria-hidden", "true");

const grid = document.createElement("div");
grid.className = "precision-grid-v18";
grid.setAttribute("aria-hidden", "true");
grid.innerHTML = "<i></i><i></i>";

meter.prepend(grid);
meter.prepend(zone);

const hint = document.createElement("div");
hint.className = "precision-hint-v18";
hint.setAttribute("aria-live", "polite");
meter.after(hint);

let previousPhase = state.phase;
let lockTimer = null;

function flashLockedMarker() {
  clearTimeout(lockTimer);
  meter.classList.remove("is-precision-locked-v18");
  void meter.offsetWidth;
  meter.classList.add("is-precision-locked-v18");
  lockTimer = setTimeout(() => meter.classList.remove("is-precision-locked-v18"), 180);
}

function renderGuide() {
  const phase = state.phase;
  meter.dataset.precisionPhase = phase;

  if (phase === "power") {
    const centre = idealPower();
    zone.style.left = `${Math.max(0, centre - 0.035) * 100}%`;
    zone.style.width = "7%";
    hint.innerHTML = "<span>UNDERHIT</span><strong>PERFECT CONTACT ZONE</strong><span>OVERHIT</span>";
  } else if (phase === "aim") {
    zone.style.width = "0";
    hint.innerHTML = "<span>LEFT</span><strong>GOAL THIRDS</strong><span>RIGHT</span>";
  } else if (phase === "curve") {
    zone.style.left = "44%";
    zone.style.width = "12%";
    hint.innerHTML = "<span>LEFT BEND</span><strong>STRAIGHT</strong><span>RIGHT BEND</span>";
  } else {
    zone.style.width = "0";
    hint.innerHTML = "<span>LOCK EACH INPUT</span><strong>INPUT PRECISION</strong><span>3 STEPS</span>";
  }

  if (["power", "aim", "curve"].includes(previousPhase) && previousPhase !== phase) {
    flashLockedMarker();
  }
  previousPhase = phase;
  requestAnimationFrame(renderGuide);
}

window.__footballLabPrecisionUiV18 = {
  powerWindowPercent: 7,
  aimThirdsVisible: true,
  curveNeutralWindowPercent: 12
};

requestAnimationFrame(renderGuide);
