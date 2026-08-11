import {
  $, $$, formatScore, profile, state, elements, createShot, saveProfile, renderProfile,
  setStageWind, showScreen, openModal, closeModal, setPhase, idealPower, currentAimTarget,
  renderHud, showResult, stageConfig, strikeQualityLabel, syncStage
} from "./core-v6.js?v=32.2";
import { resolveShotPhysics } from "./physics-v9.js?v=9";
import { resizeCanvas, drawScene } from "./render-v11-3.js?v=113";
import { unlockAudio, playImpactSound, playOutcomeSound, playStageSound } from "./audio-v10.js?v=10";
import { difficultyForStage } from "./difficulty-v9.js?v=32.2";

state.debugDiagnostics = false;
state.presentation = null;
state.presentationTimeout = null;
state.impactTimer = null;
state.pendingStageAdvance = false;
state.actionLockedUntil = 0;
window.__footballLabDiagnostics = window.__footballLabDiagnostics || [];

let gamepadWasPressed = false;

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

function startGame() {
  resetPresentation();
  resetShotReadouts();
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
    const target = currentAimTarget();
    Object.assign(state.shot, { aimX: target.x, aimY: target.y });
    elements.aimReadout.textContent = target.label;
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
  const contactHoldDuration = 64;
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
  state.animation = null;
  state.presentation = {
    ...state.presentation,
    phase: "breakdown",
    startedAt: performance.now(),
    skippable: true,
    breakdown: state.presentation?.breakdown || buildBreakdown(state.shot)
  };
  elements.shotAction.textContent = "CONTINUE";
  state.presentationTimeout = setTimeout(continueAfterBreakdown, 2200);
}

function continueAfterBreakdown() {
  if (state.presentation?.phase !== "breakdown") return;
  clearPresentationTimers();
  if (state.misses >= 3) {
    endRun();
    return;
  }
  if (state.pendingStageAdvance) {
    state.stage += 1;
    syncStage();
    renderHud();
    const difficulty = difficultyForStage(state.stage, stageConfig());
    state.presentation = {
      phase: "stage",
      startedAt: performance.now(),
      skippable: true,
      stageNumber: state.stage + 1,
      distanceYards: state.currentStage.distanceYards,
      stageName: state.currentStage.name,
      challenge: difficulty.challenge
    };
    elements.shotAction.textContent = "START NEXT STAGE";
    playStageSound();
    vibrate([12, 28, 12]);
    state.presentationTimeout = setTimeout(prepareNextShot, 1180);
    return;
  }
  prepareNextShot();
}

function finishAnimation(animationId) {
  if (state.presentation?.phase === "replay") finishReplay(animationId);
  else finishPrimaryShot(animationId);
}

function prepareNextShot() {
  if (state.misses >= 3) return;
  resetPresentation();
  state.shot = createShot();
  syncStage();
  setStageWind();
  resetShotReadouts();
  setPhase("ready");
  renderHud();
}

function endRun() {
  resetPresentation();
  clearResultBanner();
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

function pollGamepad() {
  const pads = navigator.getGamepads?.() || [];
  const pad = [...pads].find(Boolean);
  const pressed = Boolean(pad && (pad.buttons[0]?.pressed || pad.buttons[9]?.pressed));
  if (pressed && !gamepadWasPressed) handleAction();
  gamepadWasPressed = pressed;
}

function frame(time) {
  const delta = Math.min((time - state.lastTime) / 1000, 0.05);
  state.lastTime = time;
  pollGamepad();
  if (state.screen === "game") {
    updateMeter(delta);
    drawScene(time, finishAnimation);
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
  [elements.howToPlay, () => openModal(elements.howModal)]
].forEach(([element, handler]) => element.addEventListener("click", handler));

elements.shotAction.addEventListener("click", handleAction);
elements.canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  handleAction();
}, { passive: false });
elements.canvas.style.touchAction = "manipulation";
elements.shotAction.style.touchAction = "manipulation";

$$('[data-preview]').forEach((button) => button.addEventListener("click", () => openModePreview(button.dataset.preview)));
$$('[data-close-modal]').forEach((button) => button.addEventListener("click", () => closeModal(elements.howModal)));
$$('[data-close-preview]').forEach((button) => button.addEventListener("click", () => closeModal(elements.previewModal)));

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if ((event.code === "Space" || event.code === "Enter") && state.screen === "game" && !elements.gameOverModal.classList.contains("is-open")) {
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
