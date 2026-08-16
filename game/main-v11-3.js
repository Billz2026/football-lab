import {
  $, $$, formatScore, profile, state, elements, createShot, saveProfile, renderProfile,
  setStageWind, showScreen, openModal, closeModal, setPhase, idealPower,
  renderHud, showResult, stageConfig, strikeQualityLabel, syncStage, MAX_LIVES, LIFE_STREAK_TARGET
} from "./core-v6.js?v=32.4";
import { resolveShotPhysics } from "./physics-v19.js?v=19";
import { resizeCanvas, drawScene } from "./render-v17-3-1.js?v=1731";
import { unlockAudio, playImpactSound, playOutcomeSound, playStageSound } from "./audio-v10.js?v=10";
import { difficultyForStage } from "./difficulty-v9.js?v=32.4";
import { activeCharacter, meterMultiplier } from "./characters-v13.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";
import { wallForStage } from "./walls-v15.js?v=32.4";

state.debugDiagnostics = false;
state.presentation = null;
state.presentationTimeout = null;
state.impactTimer = null;
state.pendingStageAdvance = false;
state.actionLockedUntil = 0;
window.__footballLabDiagnostics = window.__footballLabDiagnostics || [];

let gamepadWasPressed = false;
let suppressActionClickUntil = 0;

function clearPresentationTimers() {
  clearTimeout(state.presentationTimeout);
  clearTimeout(state.impactTimer);
  state.presentationTimeout = null;
  state.impactTimer = null;
}

function clearResultBanner() {
  clearTimeout(state.resultTimeout);
  state.resultTimeout = null;
  elements.resultBanner.textContent = "";
  elements.resultBanner.className = "result-banner";
}

function restoreReplayState() {
  const presentation = state.presentation;
  if (!presentation) return;
  if (presentation.originalPath) state.shot.path = presentation.originalPath;
  if (presentation.originalKeeperPlan !== undefined) state.shot.keeperPlan = presentation.originalKeeperPlan;
}

function resetPresentation() {
  clearPresentationTimers();
  restoreReplayState();
  state.presentation = null;
  state.pendingStageAdvance = false;
}

function resetShotReadouts() {
  clearResultBanner();
  elements.powerReadout.textContent = "—";
  elements.aimReadout.textContent = "—";
  elements.curveReadout.textContent = "—";
}

function announceMatchupChange() {
  const keeper = keeperForStage(state.stage);
  const wall = wallForStage(state.stage);
  state.keeperId = keeper.id;
  state.wallId = wall.id;
  window.dispatchEvent(new CustomEvent("footballlab:keeperchange", { detail: keeper }));
  window.dispatchEvent(new CustomEvent("footballlab:wallchange", { detail: wall }));
  return { keeper, wall };
}

function showStageIntro() {
  clearPresentationTimers();
  const { keeper, wall } = announceMatchupChange();
  const difficulty = difficultyForStage(state.stage, stageConfig());
  const startedAt = performance.now();
  state.presentation = {
    phase: "stage",
    startedAt,
    skippable: true,
    stageNumber: state.stage + 1,
    distanceYards: state.currentStage.distanceYards,
    stageName: state.currentStage.name,
    chapterNumber: state.currentStage.chapterNumber,
    chapterName: state.currentStage.chapterName,
    venue: state.currentStage.venue,
    weather: state.currentStage.weather,
    challenge: difficulty.challenge,
    keeperId: keeper.id,
    wallId: wall.id
  };
  elements.shotAction.textContent = "START STAGE";
  playStageSound();
  state.presentationTimeout = setTimeout(prepareNextShot, 1100);
}

function startGame() {
  resetPresentation();
  resetShotReadouts();
  [elements.howModal, elements.previewModal, elements.gameOverModal].forEach(closeModal);
  Object.assign(state, {
    characterId: activeCharacter().id,
    keeperId: keeperForStage(0).id,
    wallId: wallForStage(0).id,
    maxLives: MAX_LIVES,
    lifeStreakTarget: LIFE_STREAK_TARGET,
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
  showStageIntro();
}

function returnToMenu() {
  resetPresentation();
  clearResultBanner();
  closeModal(elements.gameOverModal);
  state.animation = null;
  state.finishedAnimationId = null;
  setPhase("ready");
  showScreen("menu");
  renderProfile();
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function placementLabel(shot) {
  const horizontal = shot.aimX < 0.33 ? "LEFT" : shot.aimX > 0.67 ? "RIGHT" : "CENTRE";
  const vertical = shot.aimY < 0.31 ? "HIGH" : shot.aimY > 0.59 ? "LOW" : "MID";
  return `${vertical} ${horizontal}`;
}

function curveLabel(shot) {
  const amount = Math.round(Math.abs(shot.curve || 0) * 100);
  if (amount < 12) return "STRAIGHT";
  return `${shot.curve < 0 ? "LEFT" : "RIGHT"} ${amount}%`;
}

function wallLabel(diagnostics) {
  if (!diagnostics) return "—";
  if (diagnostics.wallClearanceMetres == null) return diagnostics.wallLane || "N/A";
  const clearance = diagnostics.wallClearanceMetres;
  return `${diagnostics.wallLane} ${clearance >= 0 ? "+" : ""}${clearance.toFixed(2)} m`;
}

function keeperLabel(diagnostics, shot) {
  if (!diagnostics || diagnostics.keeperReachScore == null) {
    return shot.outcome === "GOAL" ? "BEATEN" : "NOT TESTED";
  }
  if (shot.outcome === "SAVE") return shot.saveType === "CATCH" ? "CAUGHT" : "PARRIED";
  const margin = diagnostics.keeperReachScore - diagnostics.keeperThreshold;
  return margin > 0 ? `SHORT ${margin.toFixed(2)}` : "REACHED";
}

function buildBreakdown(shot) {
  const diagnostics = shot.diagnostics;
  const title = shot.outcome === "GOAL"
    ? shot.topCorner ? "TOP-CORNER FINISH" : "GOAL"
    : shot.outcome === "SAVE"
      ? shot.saveType === "CATCH" ? "HELD BY KEEPER" : "PARRIED AWAY"
      : shot.outcome === "POST"
        ? "OFF THE POST"
        : shot.outcome === "BAR"
          ? "OFF THE CROSSBAR"
          : shot.outcome === "WALL"
            ? "BLOCKED BY THE WALL"
            : "OFF TARGET";

  return {
    title,
    points: shot.points || 0,
    power: `${Math.round((shot.power || 0) * 100)}% · ${strikeQualityLabel(shot.power || 0)}`,
    placement: placementLabel(shot),
    curve: curveLabel(shot),
    speed: `${(diagnostics?.speedMps || shot.speedMps || 0).toFixed(1)} m/s`,
    wall: wallLabel(diagnostics),
    keeper: keeperLabel(diagnostics, shot),
    reason: diagnostics?.reason || "The shot outcome followed the selected power, placement and curve."
  };
}

function handlePresentationAction() {
  const phase = state.presentation?.phase;
  if (phase === "replay") {
    finishReplay(state.animation?.id);
    return true;
  }
  if (phase === "breakdown") {
    continueAfterBreakdown();
    return true;
  }
  if (phase === "stage") {
    prepareNextShot();
    return true;
  }
  return false;
}

function handleAction() {
  const now = performance.now();
  if (now < state.actionLockedUntil) return;
  state.actionLockedUntil = now + 135;
  unlockAudio();

  if (handlePresentationAction()) return;
  if (state.screen !== "game" || state.animation) return;

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
    state.shot.aimX = state.meterValue;
    elements.aimReadout.textContent = `${Math.round(state.shot.aimX * 100)}%`;
    setPhase("curve");
    return;
  }

  if (state.phase === "curve") {
    state.shot.curve = (state.meterValue - 0.5) * 2;
    elements.curveReadout.textContent = curveLabel(state.shot);
    takeShot();
    return;
  }

  if (state.phase === "result") prepareNextShot();
}

function recordDiagnostics(diagnostics) {
  if (!diagnostics) return;
  const record = { recordedAt: new Date().toISOString(), ...diagnostics };
  window.__footballLabDiagnostics.push(record);
  if (window.__footballLabDiagnostics.length > 60) window.__footballLabDiagnostics.shift();
  window.__footballLabLastShot = record;
  if (state.debugDiagnostics) console.table(record);
}

function impactRatioForShot(shot) {
  if (!shot.path?.length) return 0.94;
  if (Number.isInteger(shot.impactIndex)) {
    return Math.max(0.12, Math.min(0.98, shot.impactIndex / Math.max(1, shot.path.length - 1)));
  }
  return shot.outcome === "GOAL" || shot.outcome === "MISS" ? 0.96 : 0.9;
}

function settleDurationForShot(shot) {
  if (shot.outcome === "SAVE") return 390;
  if (shot.outcome === "WALL") return 300;
  if (shot.outcome === "POST" || shot.outcome === "BAR") return 310;
  return 260;
}

function takeShot() {
  setPhase("shooting");
  clearResultBanner();
  const { flightDuration, diagnostics } = resolveShotPhysics();
  recordDiagnostics(diagnostics);
  const runUpDuration = 560;
  const contactHoldDuration = 140;
  const settleDuration = settleDurationForShot(state.shot);
  const startedAt = performance.now();
  const impactRatio = impactRatioForShot(state.shot);
  const impactDelayMs = runUpDuration + contactHoldDuration + flightDuration * impactRatio;

  state.presentation = {
    phase: "flight",
    startedAt,
    impactAt: startedAt + impactDelayMs,
    outcome: state.shot.outcome,
    saveType: state.shot.saveType,
    topCorner: state.shot.topCorner
  };

  playImpactSound(state.shot.outcome, impactDelayMs / 1000);
  state.impactTimer = setTimeout(() => {
    const patterns = {
      GOAL: 35,
      SAVE: [22, 28, 18],
      POST: [16, 18, 34],
      BAR: [16, 18, 34],
      WALL: 28,
      MISS: 10
    };
    vibrate(patterns[state.shot.outcome] || 10);
  }, impactDelayMs);

  state.animation = {
    id: `${startedAt}-${state.stage}-${state.misses}`,
    startedAt,
    runUpDuration,
    contactHoldDuration,
    flightDuration,
    settleDuration,
    totalDuration: runUpDuration + contactHoldDuration + flightDuration + settleDuration,
    impactPlayed: false,
    isReplay: false
  };
  state.finishedAnimationId = null;
}

function scoreShot(shot) {
  if (shot.outcome !== "GOAL") {
    state.misses += 1;
    state.streak = 0;
    state.pendingStageAdvance = false;
    return 0;
  }

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
  state.pendingStageAdvance = true;
  return points;
}

function resultBannerForShot(shot, points) {
  if (shot.outcome === "GOAL") {
    if (shot.topCorner) return `TOP CORNER +${formatScore(points)}`;
    if (shot.strikeQuality >= 0.9) return `PERFECT STRIKE +${formatScore(points)}`;
    return `GOAL +${formatScore(points)}`;
  }
  return ({
    SAVE: shot.saveType === "CATCH" ? "HELD BY KEEPER" : "PARRIED AWAY",
    WALL: "BLOCKED BY WALL",
    POST: "OFF THE POST",
    BAR: "OFF THE BAR",
    MISS: "OFF TARGET"
  })[shot.outcome] || "NO GOAL";
}

function finishPrimaryShot(animationId) {
  if (!state.animation || state.finishedAnimationId === animationId) return;
  state.finishedAnimationId = animationId;
  const shot = state.shot;
  state.animation = null;
  const points = scoreShot(shot);
  const miss = shot.outcome !== "GOAL";

  renderHud();
  showResult(resultBannerForShot(shot, points), miss);
  setPhase("result");
  playOutcomeSound(shot.outcome, { topCorner: shot.topCorner });

  state.presentation = {
    ...state.presentation,
    phase: "result",
    resultAt: performance.now(),
    outcome: shot.outcome,
    saveType: shot.saveType,
    topCorner: shot.topCorner,
    breakdown: buildBreakdown(shot)
  };

  const replayable = ["GOAL", "SAVE", "POST", "BAR"].includes(shot.outcome);
  if (replayable) startReplay();
  else showBreakdown();
}

function startReplay() {
  clearPresentationTimers();
  const shot = state.shot;
  const originalPath = shot.path;
  const originalKeeperPlan = shot.keeperPlan;
  const impactIndex = Number.isInteger(shot.impactIndex)
    ? shot.impactIndex
    : Math.floor(originalPath.length * 0.94);
  const startIndex = Math.max(0, impactIndex - Math.floor(originalPath.length * 0.42));
  shot.path = originalPath.slice(startIndex);
  if (shot.keeperPlan) {
    shot.keeperPlan = { ...shot.keeperPlan, reaction: 0.02, flightSeconds: 1 };
  }

  const startedAt = performance.now();
  state.presentation = {
    ...state.presentation,
    phase: "replay",
    startedAt,
    originalPath,
    originalKeeperPlan,
    skippable: true
  };
  elements.shotAction.textContent = "SKIP REPLAY";
  state.animation = {
    id: `replay-${startedAt}-${state.stage}-${state.misses}`,
    startedAt,
    runUpDuration: 1,
    contactHoldDuration: 0,
    flightDuration: 1120,
    settleDuration: 120,
    totalDuration: 1241,
    impactPlayed: true,
    isReplay: true
  };
  state.finishedAnimationId = null;
}

function finishReplay(animationId) {
  if (state.presentation?.phase !== "replay") return;
  if (animationId && state.finishedAnimationId === animationId) return;
  if (animationId) state.finishedAnimationId = animationId;
  restoreReplayState();
  state.animation = null;
  showBreakdown();
}

function showBreakdown() {
  clearPresentationTimers();
  restoreReplayState();
  const shot = state.shot;
  state.presentation = {
    ...state.presentation,
    phase: "breakdown",
    shownAt: performance.now(),
    skippable: true,
    breakdown: buildBreakdown(shot)
  };
  elements.shotAction.textContent = state.pendingStageAdvance ? "CONTINUE" : "RETRY";
  const breakdown = state.presentation.breakdown;
  if (breakdown?.reason) {
    elements.phaseTitle.textContent = breakdown.title;
    elements.phaseHelp.textContent = breakdown.reason;
  }
  window.dispatchEvent(new CustomEvent("footballlab:breakdown", { detail: breakdown }));
}

function continueAfterBreakdown() {
  clearPresentationTimers();
  if (state.pendingStageAdvance) {
    state.stage += 1;
    state.pendingStageAdvance = false;
    syncStage();
    setStageWind();
    showStageIntro();
    return;
  }
  prepareNextShot();
}

function prepareNextShot() {
  clearPresentationTimers();
  restoreReplayState();
  state.shot = createShot();
  state.animation = null;
  state.finishedAnimationId = null;
  resetShotReadouts();
  renderHud();
  setPhase("ready");
  announceMatchupChange();
  window.dispatchEvent(new CustomEvent("footballlab:shotreset"));
}

function finishAnimation(animationId) {
  if (!state.animation) return;
  if (state.animation.isReplay) finishReplay(animationId);
  else finishPrimaryShot(animationId);
}

function checkGamepadAction() {
  const gamepads = navigator.getGamepads?.() || [];
  const gamepad = [...gamepads].find(Boolean);
  const pressed = Boolean(gamepad?.buttons?.[0]?.pressed);
  if (pressed && !gamepadWasPressed) handleAction(performance.now());
  gamepadWasPressed = pressed;
}

function frame(time) {
  const dt = Math.min((time - state.lastTime) / 1000, 0.05);
  state.lastTime = time;
  state.meterClock += dt * 0.78 * meterMultiplier();
  updateMeter(dt);
  checkGamepadAction();
  drawScene(time, finishAnimation);
  requestAnimationFrame(frame);
}

elements.shotAction.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 && event.pointerType !== "touch") return;
  event.preventDefault();
  suppressActionClickUntil = performance.now() + 550;
  handleAction(event.timeStamp);
});
elements.shotAction.addEventListener("click", (event) => {
  if (performance.now() < suppressActionClickUntil) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  handleAction(event.timeStamp);
});
elements.shotAction.addEventListener("touchend", (event) => {
  event.preventDefault();
});
elements.playClassic.addEventListener("click", startGame);
elements.classicCard?.addEventListener("click", startGame);
elements.howToPlay.addEventListener("click", () => openModal(elements.howModal));
elements.modalPlay.addEventListener("click", startGame);
elements.exitGame.addEventListener("click", returnToMenu);
elements.retryGame.addEventListener("click", startGame);
elements.returnMenu.addEventListener("click", returnToMenu);
elements.brandButton.addEventListener("click", returnToMenu);
document.addEventListener("keydown", (event) => {
  if ((event.code === "Space" || event.code === "Enter") && !event.repeat) {
    event.preventDefault();
    handleAction(event.timeStamp);
  }
});

renderProfile();
showScreen("menu");
renderHud();
setPhase("ready");
resizeCanvas();
requestAnimationFrame(frame);
//# sourceURL=football-lab-main-v19-generated.js

export const __footballLabMainV18 = Object.freeze({ build: "18.0.0", source: "main-v15-2" });
