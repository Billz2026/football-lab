import {
  $, $$, formatScore, profile, state, elements, createShot, saveProfile, renderProfile,
  setStageWind, showScreen, openModal, closeModal, setPhase, idealPower, currentAimTarget,
  renderHud, showResult
} from "./core.js";
import { resolveShotPhysics } from "./physics.js";
import { resizeCanvas, drawScene } from "./render.js";
import { unlockAudio, playResultSound } from "./audio.js";

function startGame() {
  clearTimeout(state.resultTimeout);
  [elements.howModal, elements.previewModal, elements.gameOverModal].forEach(closeModal);
  Object.assign(state, { score: 0, streak: 0, bestRunStreak: 0, stage: 0, misses: 0, animation: null, finishedAnimationId: null });
  state.shot = createShot(); setStageWind(); setPhase("ready"); showScreen("game"); renderHud(); requestAnimationFrame(resizeCanvas);
}

function returnToMenu() {
  clearTimeout(state.resultTimeout); closeModal(elements.gameOverModal); state.animation = null; state.finishedAnimationId = null;
  setPhase("ready"); showScreen("menu"); renderProfile();
}

function handleAction() {
  if (state.screen !== "game" || state.animation) return;
  unlockAudio();
  if (state.phase === "ready") {
    state.shot = createShot(); elements.resultBanner.className = "result-banner";
    elements.powerReadout.textContent = elements.aimReadout.textContent = elements.curveReadout.textContent = "—";
    setPhase("power"); return;
  }
  if (state.phase === "power") {
    state.shot.power = state.meterValue; elements.powerReadout.textContent = `${Math.round(state.shot.power * 100)}%`; setPhase("aim"); return;
  }
  if (state.phase === "aim") {
    const target = currentAimTarget();
    Object.assign(state.shot, { aimX: target.x, aimY: target.y }); elements.aimReadout.textContent = target.label; setPhase("curve"); return;
  }
  if (state.phase === "curve") {
    state.shot.curve = (state.meterValue - .5) * 2;
    const direction = Math.abs(state.shot.curve) < .12 ? "STRAIGHT" : state.shot.curve < 0 ? "LEFT" : "RIGHT";
    elements.curveReadout.textContent = `${direction} ${Math.round(Math.abs(state.shot.curve) * 100)}%`;
    takeShot(); return;
  }
  if (state.phase === "result") prepareNextShot();
}

function takeShot() {
  setPhase("shooting");
  const { flightDuration } = resolveShotPhysics();
  state.animation = {
    id: `${performance.now()}-${state.stage}-${state.misses}`,
    startedAt: performance.now(), runUpDuration: 390, flightDuration,
    totalDuration: 390 + flightDuration + 180, impactPlayed: false
  };
  state.finishedAnimationId = null;
}

function finishShot(animationId) {
  if (!state.animation || state.finishedAnimationId === animationId) return;
  state.finishedAnimationId = animationId;
  const shot = state.shot; state.animation = null;
  let banner = "", miss = false;
  if (shot.outcome === "GOAL") {
    state.streak += 1; state.bestRunStreak = Math.max(state.bestRunStreak, state.streak);
    const points = 1000 + state.stage * 85 + Math.max(0, state.streak - 1) * 125
      + (Math.abs(shot.power - idealPower()) < .055 ? 300 : 0)
      + (shot.topCorner ? 650 : 0) + Math.round(Math.abs(state.stageWind) * 1500);
    shot.points = points; state.score += points;
    banner = shot.topCorner ? `TOP CORNER +${formatScore(points)}` : `GOAL +${formatScore(points)}`;
    state.stage += 1; playResultSound("GOAL");
  } else {
    state.misses += 1; state.streak = 0; miss = true;
    banner = ({ SAVE: "SAVED", WALL: "BLOCKED BY WALL", POST: "OFF THE POST", BAR: "OFF THE BAR", MISS: "OFF TARGET" })[shot.outcome] || "NO GOAL";
    playResultSound(shot.outcome);
  }
  renderHud(); showResult(banner, miss); setPhase("result");
  state.resultTimeout = setTimeout(state.misses >= 3 ? endRun : prepareNextShot, state.misses >= 3 ? 1450 : 1550);
}

function prepareNextShot() {
  if (state.misses >= 3) return;
  clearTimeout(state.resultTimeout); state.shot = createShot(); setStageWind(); elements.resultBanner.className = "result-banner";
  elements.powerReadout.textContent = elements.aimReadout.textContent = elements.curveReadout.textContent = "—";
  setPhase("ready"); renderHud();
}

function endRun() {
  const previousBest = profile.highScore;
  profile.highScore = Math.max(profile.highScore, state.score); profile.bestStreak = Math.max(profile.bestStreak, state.bestRunStreak);
  profile.xp += Math.max(50, Math.round(state.score * .08)); saveProfile();
  elements.finalScore.textContent = formatScore(state.score); elements.finalStage.textContent = String(state.stage + 1);
  elements.finalStreak.textContent = String(state.bestRunStreak); elements.finalBest.textContent = formatScore(profile.highScore);
  elements.gameOverTitle.textContent = state.score > previousBest ? "NEW PERSONAL BEST" : "FULL TIME"; openModal(elements.gameOverModal);
}

function updateMeter(delta) {
  if (!["power", "aim", "curve"].includes(state.phase)) return;
  state.meterClock += delta;
  if (state.phase === "power") state.meterValue = (Math.sin(state.meterClock * 3.6 - Math.PI / 2) + 1) / 2;
  else if (state.phase === "aim") state.meterValue = (Math.sin(state.meterClock * 2.45 - Math.PI / 2) + 1) / 2;
  else state.meterValue = (Math.sin(state.meterClock * 3.0) + 1) / 2;
  const percentage = state.meterValue * 100;
  elements.meterFill.style.width = `${percentage}%`; elements.meterMarker.style.left = `${percentage}%`;
  if (state.phase === "curve") {
    const curve = (state.meterValue - .5) * 2;
    elements.meterNumber.textContent = `${curve < -.12 ? "L" : curve > .12 ? "R" : "C"} ${Math.round(Math.abs(curve) * 100)}%`;
  } else if (state.phase === "aim") elements.meterNumber.textContent = currentAimTarget().label;
  else elements.meterNumber.textContent = Math.abs(percentage - idealPower() * 100) < 7 ? `CONTROL ${Math.round(percentage)}%` : `${Math.round(percentage)}%`;
}

function frame(time) {
  const delta = Math.min((time - state.lastTime) / 1000, .05); state.lastTime = time;
  if (state.screen === "game") { updateMeter(delta); drawScene(time, finishShot); }
  requestAnimationFrame(frame);
}

function openModePreview(name) {
  const content = name === "Road to Glory" ? {
    title: "ROAD TO GLORY", copy: "A lightweight career built around the same arcade shooting engine—not an unrealistic full football simulator.",
    items: ["Create and develop one player", "Five career chapters and rival encounters", "Power, accuracy, curve and composure upgrades", "Scenario objectives, rewards and unlockable venues"]
  } : {
    title: "SCORE ATTACK", copy: "A short repeatable mode designed specifically for high scores and weekly competition.",
    items: ["Sixty-second rounds", "Streak multiplier and bonus-time targets", "Personal and weekly high scores", "Identical daily conditions for every player"]
  };
  elements.previewTitle.textContent = content.title; elements.previewCopy.textContent = content.copy;
  elements.previewList.innerHTML = content.items.map((item) => `<div>${item}</div>`).join(""); openModal(elements.previewModal);
}

[
  [elements.playClassic, startGame], [elements.classicCard, startGame], [elements.modalPlay, startGame], [elements.retryGame, startGame],
  [elements.returnMenu, returnToMenu], [elements.exitGame, returnToMenu], [elements.brandButton, returnToMenu],
  [elements.howToPlay, () => openModal(elements.howModal)], [elements.shotAction, handleAction]
].forEach(([element, handler]) => element.addEventListener("click", handler));
elements.canvas.addEventListener("pointerdown", handleAction);
$$('[data-preview]').forEach((button) => button.addEventListener("click", () => openModePreview(button.dataset.preview)));
$$('[data-close-modal]').forEach((button) => button.addEventListener("click", () => closeModal(elements.howModal)));
$$('[data-close-preview]').forEach((button) => button.addEventListener("click", () => closeModal(elements.previewModal)));
document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && state.screen === "game" && !elements.gameOverModal.classList.contains("is-open")) { event.preventDefault(); handleAction(); }
  if (event.key === "Escape") { closeModal(elements.howModal); closeModal(elements.previewModal); }
});
window.addEventListener("resize", resizeCanvas);
if ("ResizeObserver" in window) new ResizeObserver(resizeCanvas).observe(elements.canvas);
renderProfile(); renderHud(); requestAnimationFrame(frame);
