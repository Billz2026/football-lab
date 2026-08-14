// Football Lab V38.3 / V38.4 — Fold difficulty parity + cinematic presentation
import { AIM_BOUNDS, clamp, state, stageConfig } from "./core-v6.js?v=32.4";

const BALANCE_BUILD = "38.3.0";
const CINEMA_BUILD = "38.4.0";
const STYLE_ID = "foldBalanceCinemaStylesV3834";
const GRADE_ID = "foldCinemaGradeV384";

function foldTouchEligible() {
  const coarse = window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches;
  const touch = coarse || Number(navigator.maxTouchPoints || 0) > 0;
  return Boolean(touch && Math.min(window.innerWidth, window.innerHeight) >= 600);
}

function modeFactor() {
  if (state.controlMode === "guided") return 0.48;
  if (state.controlMode === "expert") return 1.28;
  return 1;
}

function targetPressure(x, y) {
  const horizontal = clamp(Math.abs(x - 0.5) / 0.5, 0, 1);
  const high = clamp((0.42 - y) / 0.42, 0, 1);
  const outside = clamp(Math.max(-x, x - 1) / 0.35, 0, 1);
  return clamp(horizontal * 0.54 + high * 0.38 + outside * 0.42, 0, 1);
}

function deterministicDirections(shot) {
  const x = Math.round(Number(shot.intendedAimX ?? shot.aimX ?? 0.5) * 100);
  const y = Math.round(Number(shot.intendedAimY ?? shot.aimY ?? 0.27) * 100);
  const seed = Math.abs((state.stage + 1) * 37 + x * 11 + y * 7) % 4;
  return {
    x: seed === 0 || seed === 3 ? 1 : -1,
    y: seed < 2 ? 1 : -1
  };
}

function tuneFoldContactWindow() {
  if (!foldTouchEligible() || state.phase !== "contact" || !state.shot) return;
  if (state.shot.foldContactBalanceBuild === BALANCE_BUILD) return;
  const current = Number(state.shot.contactWindow);
  if (!Number.isFinite(current) || current <= 0) return;
  const factor = state.controlMode === "guided" ? 0.94 : state.controlMode === "expert" ? 0.72 : 0.80;
  state.shot.contactWindow = clamp(current * factor, 0.044, 0.16);
  state.shot.foldContactBalanceBuild = BALANCE_BUILD;
}

function applyFoldExecutionParity() {
  if (!foldTouchEligible() || state.phase !== "shooting" || !state.shot) return;
  const shot = state.shot;
  if (shot.foldExecutionBalanceBuild === BALANCE_BUILD) return;

  const intendedX = Number(shot.intendedAimX ?? shot.aimX ?? 0.5);
  const intendedY = Number(shot.intendedAimY ?? shot.aimY ?? 0.27);
  const pressure = targetPressure(intendedX, intendedY);
  const distance = clamp((Number(stageConfig()?.distanceYards || 20) - 18) / 27, 0, 1);
  const factor = modeFactor();

  const existingErrorX = Number(shot.executionErrorX) || 0;
  const existingErrorY = Number(shot.executionErrorY) || 0;
  const errorScale = state.controlMode === "guided" ? 1.03 : state.controlMode === "expert" ? 1.28 : 1.18;
  const direction = deterministicDirections(shot);

  // Large touch surfaces make exact top-corner placement physically easier.
  // Add only a small deterministic floor, weighted toward ambitious targets and distance.
  const floor = (0.0025 + pressure * 0.0095 + distance * 0.0045) * factor;
  const extraX = existingErrorX * (errorScale - 1) + direction.x * floor * (0.42 + pressure * 0.58);
  const extraY = existingErrorY * (errorScale - 1) + direction.y * floor * 0.58;

  const currentX = Number.isFinite(shot.aimX) ? shot.aimX : intendedX;
  const currentY = Number.isFinite(shot.aimY) ? shot.aimY : intendedY;
  const executionX = clamp(currentX + extraX, AIM_BOUNDS.minX, AIM_BOUNDS.maxX);
  const executionY = clamp(currentY + extraY, AIM_BOUNDS.minY, AIM_BOUNDS.maxY);

  shot.aimX = executionX;
  shot.aimY = executionY;
  shot.executionAimX = executionX;
  shot.executionAimY = executionY;
  shot.executionErrorX = executionX - intendedX;
  shot.executionErrorY = executionY - intendedY;
  shot.foldExecutionPressure = pressure;
  shot.foldExecutionDistancePressure = distance;
  shot.foldExecutionBalanceBuild = BALANCE_BUILD;

  window.__footballLabLastFoldBalanceV383 = Object.freeze({
    build: BALANCE_BUILD,
    pressure,
    distancePressure: distance,
    mode: state.controlMode || "standard",
    intended: { x: intendedX, y: intendedY },
    executed: { x: executionX, y: executionY },
    deterministic: true
  });
}

function ensureCinemaStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    html[data-fold-shell-v3822="active"] body.is-game-active .screen-game .game-frame {
      position:relative!important;
      overflow:hidden!important;
      border-color:rgba(218,254,77,.17)!important;
      background:#031008!important;
      box-shadow:0 18px 50px rgba(0,0,0,.36),inset 0 1px rgba(255,255,255,.035)!important;
    }
    html[data-fold-shell-v3822="active"] body.is-game-active .screen-game #gameCanvas {
      transform-origin:50% 48%!important;
      filter:saturate(1.08) contrast(1.075) brightness(.96)!important;
      transition:transform .52s cubic-bezier(.2,.75,.2,1),filter .38s ease!important;
    }
    html[data-fold-shell-v3822="active"][data-fold-cinema-phase-v384="shooting"] body.is-game-active .screen-game #gameCanvas {
      transform:scale(1.018)!important;
      filter:saturate(1.13) contrast(1.095) brightness(.985)!important;
    }
    html[data-fold-shell-v3822="active"][data-fold-cinema-phase-v384="result"] body.is-game-active .screen-game #gameCanvas {
      transform:scale(1.006)!important;
    }
    .fold-cinema-grade-v384 {
      display:none;
    }
    html[data-fold-shell-v3822="active"] .fold-cinema-grade-v384 {
      position:absolute;
      inset:0;
      z-index:2;
      display:block;
      pointer-events:none;
      border-radius:inherit;
      opacity:.92;
      background:
        radial-gradient(ellipse at 50% 49%,rgba(0,0,0,0) 34%,rgba(0,0,0,.055) 59%,rgba(0,0,0,.24) 100%),
        linear-gradient(180deg,rgba(0,4,3,.13) 0%,rgba(0,0,0,0) 29%,rgba(0,0,0,0) 68%,rgba(0,4,2,.11) 100%),
        radial-gradient(circle at 50% 10%,rgba(218,254,77,.035),rgba(218,254,77,0) 34%);
      transition:opacity .28s ease,background .28s ease;
    }
    html[data-fold-shell-v3822="active"][data-fold-cinema-phase-v384="shooting"] .fold-cinema-grade-v384 {
      opacity:.72;
      background:
        radial-gradient(ellipse at 50% 48%,rgba(0,0,0,0) 40%,rgba(0,0,0,.045) 66%,rgba(0,0,0,.20) 100%),
        linear-gradient(180deg,rgba(0,5,3,.09),rgba(0,0,0,0) 34%,rgba(0,0,0,.08));
    }
    html[data-fold-shell-v3822="active"] body.is-game-active .screen-game .wind-chip,
    html[data-fold-shell-v3822="active"] body.is-game-active .screen-game .result-banner,
    html[data-fold-shell-v3822="active"] body.is-game-active .screen-game .canvas-prompt {
      z-index:4!important;
    }
    html[data-fold-shell-v3822="active"] body.is-game-active .screen-game .control-panel {
      border-color:rgba(218,254,77,.16)!important;
      background:linear-gradient(155deg,rgba(7,23,13,.965),rgba(2,10,6,.985))!important;
      box-shadow:0 14px 38px rgba(0,0,0,.3),inset 0 1px rgba(255,255,255,.035)!important;
      backdrop-filter:blur(14px)!important;
    }
    html[data-fold-shell-v3822="active"] body.is-game-active .screen-game .shot-step {
      background:linear-gradient(160deg,rgba(255,255,255,.032),rgba(255,255,255,.012))!important;
      transition:border-color .18s ease,background .18s ease,box-shadow .18s ease!important;
    }
    html[data-fold-shell-v3822="active"] body.is-game-active .screen-game .shot-step.is-current {
      border-color:rgba(218,254,77,.30)!important;
      background:linear-gradient(150deg,rgba(218,254,77,.075),rgba(255,255,255,.018))!important;
      box-shadow:inset 0 0 24px rgba(218,254,77,.035)!important;
    }
    html[data-fold-shell-v3822="active"] body.is-game-active .screen-game .action-button {
      box-shadow:0 10px 28px rgba(218,254,77,.14),inset 0 1px rgba(255,255,255,.38)!important;
    }
    html[data-fold-shell-v3822="active"] body.is-game-active {
      background:
        radial-gradient(circle at 50% 22%,rgba(25,67,39,.17),rgba(3,9,5,0) 42%),
        #020604!important;
    }
    @media (prefers-reduced-motion:reduce) {
      html[data-fold-shell-v3822="active"] body.is-game-active .screen-game #gameCanvas {transition:none!important}
    }
  `;
  document.head.appendChild(style);
}

function ensureCinemaGrade() {
  if (!foldTouchEligible()) return;
  ensureCinemaStyles();
  const frame = document.querySelector(".screen-game .game-frame");
  if (!frame || document.getElementById(GRADE_ID)) return;
  const grade = document.createElement("div");
  grade.id = GRADE_ID;
  grade.className = "fold-cinema-grade-v384";
  grade.setAttribute("aria-hidden", "true");
  frame.appendChild(grade);
}

function syncCinemaPhase() {
  const active = foldTouchEligible();
  document.documentElement.dataset.foldCinemaV384 = active ? "active" : "inactive";
  if (!active) {
    delete document.documentElement.dataset.foldCinemaPhaseV384;
    return;
  }
  ensureCinemaGrade();
  document.documentElement.dataset.foldCinemaPhaseV384 = state.phase || "ready";
}

function onPhaseChange(event) {
  const phase = event.detail?.phase;
  if (phase === "contact") tuneFoldContactWindow();
  if (phase === "shooting") applyFoldExecutionParity();
  syncCinemaPhase();
}

window.addEventListener("footballlab:phasechange", onPhaseChange);
window.addEventListener("resize", syncCinemaPhase, { passive:true });
window.addEventListener("orientationchange", () => setTimeout(syncCinemaPhase, 120), { passive:true });
window.addEventListener("footballlab:trainingstart", syncCinemaPhase);

ensureCinemaStyles();
syncCinemaPhase();

window.__footballLabFoldBalanceV383 = Object.freeze({
  build:BALANCE_BUILD,
  scope:"coarse-pointer-fold-tablet-touch",
  deterministicExecutionFloor:true,
  ambitiousTargetWeighted:true,
  contactWindowTightened:true,
  guidedPreserved:true,
  desktopChanged:false
});
window.__footballLabFoldCinemaV384 = Object.freeze({
  build:CINEMA_BUILD,
  canvasGrade:"contrast-saturation-vignette-depth",
  strikeCameraPush:"post-input-only",
  touchMappingChanged:false,
  physicsChanged:false
});
