import {
  $, $$, formatScore, profile, state, elements, createShot, saveProfile, renderProfile,
  setStageWind, showScreen, openModal, closeModal, setPhase, idealPower, currentAimTarget,
  renderHud, showResult, stageConfig, strikeQualityLabel, syncStage
} from "./core-v6.js?v=32.2";
import { resolveShotPhysics } from "./physics-v9.js?v=9";
import { resizeCanvas, drawScene } from "./render-v9.js?v=9";
import { unlockAudio, playResultSound } from "./audio-v6.js?v=7";
import { difficultyForStage } from "./difficulty-v9.js?v=32.2";

state.debugDiagnostics = false;
window.__footballLabDiagnostics = window.__footballLabDiagnostics || [];

function startGame() {
  clearTimeout(state.resultTimeout);
  [elements.howModal, elements.previewModal, elements.gameOverModal].forEach(closeModal);
  Object.assign(state, {
    score: 0,
    streak: 0,
    bestRunStreak: 0,
    stage: 0,
    misses: 0,
    animation: null,
    finishedAnimationId: null
  });
  syncStage();
  state.shot = createShot();
  setStageWind();
  setPhase("ready");
  showScreen("game");
  renderHud();
  requestAnimationFrame(resizeCanvas);
}

function returnToMenu() {
  clearTimeout(state.resultTimeout);
  closeModal(elements.gameOverModal);
  state.animation = null;
  state.finishedAnimationId = null;
  setPhase("ready");
  showScreen("menu");
  renderProfile();
}

function resetShotReadouts() {
  elements.resultBanner.className = "result-banner";
  elements.powerReadout.textContent = "—";
  elements.aimReadout.textContent = "—";
  elements.curveReadout.textContent = "—";
}

function handleAction() {
  if (state.screen !== "game" || state.animation) return;
  unlockAudio();

  if (state.phase === "ready") {
    state.shot = createShot();
    resetShotReadouts();
    setPhase("power");
    return;
  }

  if (state.phase === "power") {
    state.shot.power = state.meterValue;
    elements.powerReadout.textContent = `${Math.round(state.shot.power * 100)}% · ${strikeQualityLabel(state.shot.power)}`;
    setPhase("aim");
    return;
  }

  if (state.phase === "aim") {
    const target = currentAimTarget();
    Object.assign(state.shot, { aimX: target.x, aimY: target.y });
    elements.aimReadout.textContent = target.label;
    setPhase("curve");
    return;
  }

  if (state.phase === "curve") {
    state.shot.curve = (state.meterValue - 0.5) * 2;
    const direction = Math.abs(state.shot.curve) < 0.12
      ? "STRAIGHT"
      : state.shot.curve < 0 ? "LEFT" : "RIGHT";
    elements.curveReadout.textContent = `${direction} ${Math.round(Math.abs(state.shot.curve) * 100)}%`;
    takeShot();
    return;
  }

  if (state.phase === "result") prepareNextShot();
}

function recordDiagnostics(diagnostics) {
  if (!diagnostics) return;
  const record = {
    recordedAt: new Date().toISOString(),
    ...diagnostics
  };
  window.__footballLabDiagnostics.push(record);
  if (window.__footballLabDiagnostics.length > 60) window.__footballLabDiagnostics.shift();
  window.__footballLabLastShot = record;
  if (state.debugDiagnostics) console.table(record);
}

function takeShot() {
  setPhase("shooting");
  const { flightDuration, diagnostics } = resolveShotPhysics();
  recordDiagnostics(diagnostics);
  const runUpDuration = 400;
  state.animation = {
    id: `${performance.now()}-${state.stage}-${state.misses}`,
    startedAt: performance.now(),
    runUpDuration,
    flightDuration,
    totalDuration: runUpDuration + flightDuration + 180,
    impactPlayed: false
  };
  state.finishedAnimationId = null;
}

function finishShot(animationId) {
  if (!state.animation || state.finishedAnimationId === animationId) return;
  state.finishedAnimationId = animationId;
  const shot = state.shot;
  state.animation = null;
  let banner = "";
  let miss = false;

  if (shot.outcome === "GOAL") {
    state.streak += 1;
    state.bestRunStreak = Math.max(state.bestRunStreak, state.streak);
    const strikeBonus = shot.strikeQuality >= 0.9 ? 350 : shot.strikeQuality >= 0.68 ? 175 : 0;
    const distanceBonus = Math.max(0, state.currentStage.distanceYards - 20) * 28;
    const points = 1000
      + state.stage * 85
      + Math.max(0, state.streak - 1) * 125
      + strikeBonus
      + distanceBonus
      + (shot.topCorner ? 700 : 0)
      + Math.round(Math.abs(state.stageWind) * 1500);
    shot.points = points;
    state.score += points;
    banner = shot.topCorner
      ? `TOP CORNER +${formatScore(points)}`
      : shot.strikeQuality >= 0.9
        ? `PERFECT STRIKE +${formatScore(points)}`
        : `GOAL +${formatScore(points)}`;
    state.stage += 1;
    syncStage();
    playResultSound("GOAL");
  } else {
    state.misses += 1;
    state.streak = 0;
    miss = true;
    banner = ({
      SAVE: shot.saveType === "CATCH" ? "HELD BY KEEPER" : "PARRIED AWAY",
      WALL: "BLOCKED BY WALL",
      POST: "OFF THE POST",
      BAR: "OFF THE BAR",
      MISS: "OFF TARGET"
    })[shot.outcome] || "NO GOAL";
    playResultSound(shot.outcome);
  }

  renderHud();
  showResult(banner, miss);
  setPhase("result");
  const resultDelay = ["POST", "BAR", "WALL", "SAVE"].includes(shot.outcome) ? 1850 : 1550;
  state.resultTimeout = setTimeout(
    state.misses >= 3 ? endRun : prepareNextShot,
    state.misses >= 3 ? resultDelay + 100 : resultDelay
  );
}

function prepareNextShot() {
  if (state.misses >= 3) return;
  clearTimeout(state.resultTimeout);
  state.shot = createShot();
  syncStage();
  setStageWind();
  resetShotReadouts();
  setPhase("ready");
  renderHud();
}

function endRun() {
  const previousBest = profile.highScore;
  profile.highScore = Math.max(profile.highScore, state.score);
  profile.bestStreak = Math.max(profile.bestStreak, state.bestRunStreak);
  profile.xp += Math.max(50, Math.round(state.score * 0.08));
  saveProfile();
  elements.finalScore.textContent = formatScore(state.score);
  elements.finalStage.textContent = String(state.stage + 1);
  elements.finalStreak.textContent = String(state.bestRunStreak);
  elements.finalBest.textContent = formatScore(profile.highScore);
  elements.gameOverTitle.textContent = state.score > previousBest ? "NEW PERSONAL BEST" : "FULL TIME";
  openModal(elements.gameOverModal);
}

function updateMeter(delta) {
  if (!["power", "aim", "curve"].includes(state.phase)) return;
  const stage = stageConfig();
  const difficulty = difficultyForStage(state.stage, stage);

  if (state.phase === "power") {
    state.meterClock += delta;
    const speed = (3.35 + stage.aimSpeed * 0.18) * difficulty.meter.power;
    state.meterValue = (Math.sin(state.meterClock * speed - Math.PI / 2) + 1) / 2;
  } else if (state.phase === "aim") {
    state.meterClock += delta * difficulty.meter.aim;
    state.meterValue = currentAimTarget().x;
  } else {
    state.meterClock += delta;
    const speed = (2.78 + stage.aimSpeed * 0.2) * difficulty.meter.curve;
    state.meterValue = (Math.sin(state.meterClock * speed) + 1) / 2;
  }

  const percentage = state.meterValue * 100;
  elements.meterFill.style.width = `${percentage}%`;
  elements.meterMarker.style.left = `${percentage}%`;

  if (state.phase === "curve") {
    const curve = (state.meterValue - 0.5) * 2;
    elements.meterNumber.textContent = `${curve < -0.12 ? "L" : curve > 0.12 ? "R" : "C"} ${Math.round(Math.abs(curve) * 100)}%`;
  } else if (state.phase === "aim") {
    elements.meterNumber.textContent = currentAimTarget().label;
  } else {
    elements.meterNumber.textContent = `${strikeQualityLabel(state.meterValue)} ${Math.round(percentage)}%`;
  }
}

function frame(time) {
  const delta = Math.min((time - state.lastTime) / 1000, 0.05);
  state.lastTime = time;
  if (state.screen === "game") {
    updateMeter(delta);
    drawScene(time, finishShot);
  }
  requestAnimationFrame(frame);
}

function openModePreview(name) {
  const content = name === "Road to Glory" ? {
    title: "ROAD TO GLORY",
    copy: "A lightweight career built around the same arcade shooting engine—not an unrealistic full football simulator.",
    items: ["Create and develop one player", "Five career chapters and rival encounters", "Power, accuracy, curve and composure upgrades", "Scenario objectives, rewards and unlockable venues"]
  } : {
    title: "SCORE ATTACK",
    copy: "A short repeatable mode designed specifically for high scores and weekly competition.",
    items: ["Sixty-second rounds", "Streak multiplier and bonus-time targets", "Personal and weekly high scores", "Identical daily conditions for every player"]
  };
  elements.previewTitle.textContent = content.title;
  elements.previewCopy.textContent = content.copy;
  elements.previewList.innerHTML = content.items.map((item) => `<div>${item}</div>`).join("");
  openModal(elements.previewModal);
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
  if (event.code === "Space" && state.screen === "game" && !elements.gameOverModal.classList.contains("is-open")) {
    event.preventDefault();
    handleAction();
  }
  if (event.key.toLowerCase() === "d" && state.screen === "game") {
    state.debugDiagnostics = !state.debugDiagnostics;
    console.info(`Football Lab diagnostics ${state.debugDiagnostics ? "enabled" : "disabled"}.`);
  }
  if (event.key === "Escape") {
    closeModal(elements.howModal);
    closeModal(elements.previewModal);
  }
});

window.addEventListener("resize", resizeCanvas);
if ("ResizeObserver" in window) new ResizeObserver(resizeCanvas).observe(elements.canvas);

syncStage();
renderProfile();
renderHud();
requestAnimationFrame(frame);
