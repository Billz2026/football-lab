import "./refinement-v37-1.js?v=37.1";
import { clamp, elements, setPhase, stageConfig, state, strikeQualityLabel } from "./core-v6.js?v=32.4";
import { activeCharacter } from "./characters-v13.js?v=32.4";

const TOUCH_BUILD = "38.2.0";
const TOUCH_STYLE_ID = "touchGameplayStylesV382";
const TOUCH_POWER_ID = "touchPowerControlV382";
const CHARGE_MS = 1150;
let touchActive = false;
let charging = false;
let chargeStartedAt = 0;
let chargeFrame = 0;

function touchEligible() {
  const coarse = window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches;
  const touch = coarse || Number(navigator.maxTouchPoints || 0) > 0;
  return Boolean(touch && Math.min(window.innerWidth, window.innerHeight) <= 1200);
}

function ensureTouchStyles() {
  if (document.getElementById(TOUCH_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = TOUCH_STYLE_ID;
  style.textContent = `
    .touch-power-v382{display:none}
    html[data-touch-gameplay-v382="active"] body.is-game-active .mobile-run-strip-v161,
    html[data-touch-gameplay-v382="active"] body.is-game-active .run-rules-v152,
    html[data-touch-gameplay-v382="active"] body.is-game-active .input-note{display:none!important}
    html[data-touch-gameplay-v382="active"] body.is-game-active .game-layout{grid-template-columns:minmax(0,1fr)!important;gap:8px!important}
    html[data-touch-gameplay-v382="active"] body.is-game-active .control-panel{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-areas:none!important;gap:8px!important;min-height:0!important;padding:10px!important;border-radius:16px!important}
    html[data-touch-gameplay-v382="active"] body.is-game-active .control-heading{display:none!important}
    html[data-touch-gameplay-v382="active"] body.is-game-active .shot-steps{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important;margin:0!important}
    html[data-touch-gameplay-v382="active"] body.is-game-active .shot-step{min-width:0!important;min-height:42px!important;gap:5px!important;padding:6px!important;border-radius:10px!important}
    html[data-touch-gameplay-v382="active"] body.is-game-active .shot-step>span{width:22px!important;height:22px!important;border-radius:7px!important;font-size:8px!important}
    html[data-touch-gameplay-v382="active"] body.is-game-active .shot-step strong,
    html[data-touch-gameplay-v382="active"] body.is-game-active .shot-step small{font-size:7px!important}
    html[data-touch-gameplay-v382="active"] body.is-game-active .meter-wrap{margin:0!important}
    html[data-touch-gameplay-v382="active"] body.is-game-active .meter{height:18px!important;border-radius:9px!important}
    html[data-touch-gameplay-v382="active"] body.is-game-active .action-button{width:100%!important;min-height:54px!important;margin:0!important;border-radius:14px!important;font-size:13px!important;letter-spacing:.06em!important}
    html[data-touch-gameplay-v382="active"] .touch-power-v382{display:none;gap:9px;padding:10px;border:1px solid rgba(218,254,77,.22);border-radius:14px;background:linear-gradient(160deg,rgba(8,22,12,.96),rgba(2,8,5,.96));box-shadow:inset 0 1px rgba(255,255,255,.04),0 10px 28px rgba(0,0,0,.24)}
    html[data-touch-gameplay-v382="active"][data-strike-phase-v324="power"] .touch-power-v382{display:grid!important}
    html[data-touch-gameplay-v382="active"][data-strike-phase-v324="power"] body.is-game-active .meter-wrap,
    html[data-touch-gameplay-v382="active"][data-strike-phase-v324="power"] body.is-game-active .action-button{display:none!important}
    .touch-power-head-v382{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .touch-power-head-v382 span{color:rgba(239,247,236,.62);font-size:9px;font-weight:950;letter-spacing:.14em}
    .touch-power-head-v382 strong{color:#fff;font-size:22px;line-height:1}.touch-power-head-v382 b{color:#dafe4d}
    .touch-power-track-v382{position:relative;height:22px;overflow:hidden;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.06);box-shadow:inset 0 2px 9px rgba(0,0,0,.4)}
    .touch-power-track-v382>span{position:absolute;inset:0 auto 0 0;width:0;border-radius:inherit;background:linear-gradient(90deg,#68e78f,#dafe4d 66%,#ffc85c 86%,#ff6176);box-shadow:0 0 16px rgba(218,254,77,.3)}
    .touch-power-track-v382>i{position:absolute;top:3px;bottom:3px;left:50%;width:1px;background:rgba(255,255,255,.38)}
    .touch-power-button-v382{min-height:58px;display:grid;place-content:center;gap:4px;border:0;border-radius:14px;background:#dafe4d;color:#07110b;font:inherit;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer;box-shadow:0 8px 24px rgba(218,254,77,.14)}
    .touch-power-button-v382 span{font-size:13px;font-weight:1000;letter-spacing:.07em}.touch-power-button-v382 small{font-size:7px;font-weight:850;opacity:.62}.touch-power-button-v382.is-charging{transform:scale(.985);filter:brightness(.93)}
    @media (hover:none) and (pointer:coarse) and (orientation:portrait){html[data-touch-gameplay-v382="active"] body.is-game-active main{padding:max(5px,env(safe-area-inset-top)) max(5px,env(safe-area-inset-right)) max(5px,env(safe-area-inset-bottom)) max(5px,env(safe-area-inset-left))!important}html[data-touch-gameplay-v382="active"] body.is-game-active .game-frame{width:100%!important;max-height:68dvh}}
    @media (hover:none) and (pointer:coarse) and (max-height:700px) and (orientation:landscape){html[data-touch-gameplay-v382="active"] body.is-game-active .game-layout{grid-template-columns:minmax(0,1fr) minmax(245px,34vw)!important;gap:7px!important}html[data-touch-gameplay-v382="active"] body.is-game-active .shot-steps{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);
}

function contactWindowForTouchShot() {
  const character = activeCharacter();
  const stageProgress = Math.min(1, Math.max(0, state.stage % 30) / 29);
  const accuracy = Number(character.stats?.accuracy) || 75;
  const composure = Number(character.stats?.composure) || 75;
  const skillBonus = (accuracy - 75) * 0.00055 + (composure - 75) * 0.00028;
  const curvePenalty = Math.abs(state.shot?.previewCurve || 0) * 0.036;
  const distancePenalty = Math.max(0, (stageConfig().distanceYards - 20) * 0.0008);
  const modeAdjustment = state.controlMode === "guided" ? 0.038 : state.controlMode === "expert" ? -0.022 : 0;
  return Math.max(0.052, Math.min(0.175, 0.13 - stageProgress * 0.025 + skillBonus - curvePenalty - distancePenalty + modeAdjustment));
}

function setPowerVisual(value) {
  const power = clamp(Number(value) || 0, 0, 1);
  const percentage = Math.round(power * 100);
  const panel = document.getElementById(TOUCH_POWER_ID);
  const number = panel?.querySelector("#touchPowerNumberV382");
  const fill = panel?.querySelector("#touchPowerFillV382");
  if (number) number.textContent = String(percentage);
  if (fill) fill.style.width = `${percentage}%`;
  elements.meterFill.style.width = `${percentage}%`;
  elements.meterMarker.style.left = `${percentage}%`;
  elements.meterNumber.textContent = `${percentage}%`;
}

function chargeValueAt(time) {
  const leg = Math.max(0, time - chargeStartedAt) / CHARGE_MS;
  const cycle = leg % 2;
  return cycle <= 1 ? cycle : 2 - cycle;
}

function chargeLoop(time) {
  if (!charging || !touchActive || state.phase !== "power") return;
  state.meterValue = clamp(chargeValueAt(time), 0, 1);
  setPowerVisual(state.meterValue);
  chargeFrame = requestAnimationFrame(chargeLoop);
}

function cancelCharge() {
  charging = false;
  cancelAnimationFrame(chargeFrame);
  const button = document.getElementById("touchPowerButtonV382");
  button?.classList.remove("is-charging");
  const label = button?.querySelector("span");
  if (label) label.textContent = "HOLD TO CHARGE";
}

function startCharge(event) {
  if (!touchActive || state.phase !== "power" || state.animation) return;
  event.preventDefault();
  charging = true;
  chargeStartedAt = performance.now();
  state.meterValue = 0;
  state.meterClock = 0;
  setPowerVisual(0);
  event.currentTarget.setPointerCapture?.(event.pointerId);
  event.currentTarget.classList.add("is-charging");
  event.currentTarget.querySelector("span").textContent = "RELEASE TO LOCK";
  navigator.vibrate?.(10);
  cancelAnimationFrame(chargeFrame);
  chargeFrame = requestAnimationFrame(chargeLoop);
}

function releaseCharge(event) {
  if (!charging || state.phase !== "power") return;
  event.preventDefault();
  const now = performance.now();
  const power = clamp(chargeValueAt(now), 0, 1);
  charging = false;
  cancelAnimationFrame(chargeFrame);
  state.meterValue = power;
  state.shot.power = power;
  state.shot.contactWindow = contactWindowForTouchShot();
  elements.powerReadout.textContent = `${Math.round(power * 100)}% · ${strikeQualityLabel(power)}`;
  setPowerVisual(power);
  event.currentTarget.classList.remove("is-charging");
  event.currentTarget.querySelector("span").textContent = "HOLD TO CHARGE";
  navigator.vibrate?.(18);
  state.actionLockedUntil = now + 90;
  setPhase("contact");
}

function ensureTouchPower() {
  const control = document.querySelector(".control-panel");
  if (!control) return null;
  let panel = document.getElementById(TOUCH_POWER_ID);
  if (panel) return panel;
  panel = document.createElement("section");
  panel.id = TOUCH_POWER_ID;
  panel.className = "touch-power-v382";
  panel.setAttribute("aria-label", "Touch power control");
  panel.innerHTML = `<div class="touch-power-head-v382"><span>POWER</span><strong><b id="touchPowerNumberV382">0</b>%</strong></div><div class="touch-power-track-v382" aria-hidden="true"><span id="touchPowerFillV382"></span><i></i></div><button class="touch-power-button-v382" id="touchPowerButtonV382" type="button"><span>HOLD TO CHARGE</span><small>Release at the power you want</small></button>`;
  const meter = control.querySelector(".meter-wrap");
  if (meter) meter.insertAdjacentElement("afterend", panel); else control.appendChild(panel);
  const button = panel.querySelector("#touchPowerButtonV382");
  button.addEventListener("contextmenu", (e) => e.preventDefault());
  button.addEventListener("click", (e) => e.preventDefault());
  button.addEventListener("pointerdown", startCharge, { passive: false });
  button.addEventListener("pointerup", releaseCharge, { passive: false });
  button.addEventListener("pointercancel", (e) => { e.preventDefault(); cancelCharge(); }, { passive: false });
  return panel;
}

function syncTouchPhase() {
  if (!touchActive) return;
  ensureTouchPower();
  if (state.phase !== "power") cancelCharge();
  if (state.phase === "power") setPowerVisual(state.meterValue || 0);
  if (state.phase === "contact") elements.shotAction.textContent = "TAP TO STRIKE";
  if (state.phase === "aim") elements.shotAction.textContent = "LOCK AIM";
}

function syncTouchLayout() {
  touchActive = touchEligible();
  document.documentElement.dataset.touchGameplayV382 = touchActive ? "active" : "inactive";
  document.body.classList.toggle("touch-gameplay-v382", touchActive);
  if (touchActive) {
    ensureTouchStyles();
    ensureTouchPower();
    syncTouchPhase();
  } else {
    cancelCharge();
  }
}

window.addEventListener("footballlab:phasechange", syncTouchPhase, true);
window.addEventListener("resize", syncTouchLayout, { passive: true });
window.addEventListener("orientationchange", () => setTimeout(syncTouchLayout, 120), { passive: true });
syncTouchLayout();
window.__footballLabTouchGameplayV382 = Object.freeze({ build: TOUCH_BUILD, touchCapabilityDetection: true, foldableSupport: true, holdReleasePower: true, shotPhysicsChanged: false, aimingChanged: false, difficultyChanged: false });

const release = () => {
  document.documentElement.dataset.footballLabBuild = "38.2";
  const badge = document.querySelector(".build-badge-v22");
  if (badge) {
    badge.textContent = "V38.2";
    badge.title = "Football Lab build 38.2.0";
  }
  const version = document.querySelector(".settings-version-v22 strong");
  if (version) version.textContent = "38.2.0";
  const previous = window.__footballLabReleaseV371 || window.__footballLabReleaseV370 || {};
  window.__footballLabReleaseV382 = Object.freeze({ ...previous, build: "38.2.0", touchGameplayShell: "coarse-pointer-phone-foldable", touchPowerControl: "hold-charge-release-lock", standardDifficultyChanged: false });
};

setTimeout(release, 0);
setTimeout(release, 500);
window.addEventListener("footballlab:trainingstart", release);
