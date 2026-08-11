import {
  $, $$, formatScore, profile, state, elements, createShot, saveProfile, renderProfile,
  setStageWind, showScreen, openModal, closeModal, setPhase, idealPower, currentAimTarget,
  renderHud, showResult, stageConfig, strikeQualityLabel, syncStage, MAX_LIVES, LIFE_STREAK_TARGET
} from "./core-v6.js?v=32.2";
import { resolveShotPhysics } from "./runtime-v23-bridge-physics-v19-f1d39f9409.js?v=32.2";
import { resizeCanvas, drawScene } from "./runtime-v23-bridge-render-v17-3-1-64b7ab3399.js?v=32.2";
import { unlockAudio, playImpactSound, playOutcomeSound, playStageSound } from "./audio-v32.js?v=32.2";
import { difficultyForStage } from "./difficulty-v9.js?v=32.2";
import { activeCharacter, meterMultiplier } from "./characters-v13.js?v=32.2";
import { keeperForStage } from "./keepers-v14.js?v=32.2";
import { wallForStage } from "./walls-v15.js?v=32.2";

state.debugDiagnostics = false;
state.presentation = null;
state.presentationTimeout = null;
state.impactTimer = null;
state.contactHapticTimer = null;
state.pendingStageAdvance = false;
state.actionLockedUntil = 0;
window.__footballLabDiagnostics = window.__footballLabDiagnostics || [];

let gamepadWasPressed = false;
let suppressActionClickUntil = 0;

function clearPresentationTimers() {
  clearTimeout(state.presentationTimeout);
  clearTimeout(state.impactTimer);
  clearTimeout(state.contactHapticTimer);
  state.presentationTimeout = null;
  state.impactTimer = null;
  state.contactHapticTimer = null;
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
  const horizontal = shot.aimX < 0
    ? "OUTSIDE LEFT"
    : shot.aimX > 1
      ? "OUTSIDE RIGHT"
      : shot.aimX < 0.33 ? "LEFT" : shot.aimX > 0.67 ? "RIGHT" : "CENTRE";
  const vertical = shot.aimY < 0
    ? "ABOVE BAR"
    : shot.aimY < 0.31 ? "HIGH" : shot.aimY > 0.67 ? "LOW" : "MID";
  return `${vertical} ${horizontal}`;
}

function curveLabel(shot) {
  const amount = Math.round(Math.abs(shot.curve || 0) * 100);
  if (amount < 12) return "STRAIGHT";
  return `${shot.curve < 0 ? "LEFT" : "RIGHT"} ${amount}%`;
}

function wallLabel(diagnostics) {
  const wall = wallForStage(state.stage);
  if (!diagnostics) return `${wall.nickname} · —`;
  if (diagnostics.wallClearanceMetres == null) return `${wall.nickname} · ${diagnostics.wallLane || "N/A"}`;
  const clearance = diagnostics.wallClearanceMetres;
  return `${wall.nickname} · ${diagnostics.wallLane} ${clearance >= 0 ? "+" : ""}${clearance.toFixed(2)} m`;
}

function keeperLabel(diagnostics, shot) {
  const keeper = keeperForStage(state.stage);
  if (!diagnostics || diagnostics.keeperReachScore == null) {
    return `${keeper.nickname} · ${shot.outcome === "GOAL" ? "BEATEN" : "NOT TESTED"}`;
  }
  if (shot.outcome === "SAVE") return `${keeper.nickname} · ${shot.saveType === "CATCH" ? "CAUGHT" : "PARRIED"}`;
  const margin = diagnostics.keeperReachScore - diagnostics.keeperThreshold;
  return `${keeper.nickname} · ${margin > 0 ? `SHORT ${margin.toFixed(2)}` : "REACHED"}`;
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
  if (phase === "chapter-complete") {
    advanceAfterChapter();
    return true;
  }
  return false;
}

function normaliseInputTime(inputTime) {
  const current = performance.now();
  if (!Number.isFinite(inputTime)) return current;
  return Math.abs(current - inputTime) <= 1000 ? inputTime : current;
}

function sampleMeterAtInput(inputTime) {
  if (state.screen !== "game" || !["power", "aim", "curve"].includes(state.phase)) return;
  const frameTime = state.lastTime;
  const correctionSeconds = Math.max(-0.05, Math.min((inputTime - frameTime) / 1000, 0.05));
  if (Math.abs(correctionSeconds) > 0.0001) updateMeter(correctionSeconds);
  state.lastTime = inputTime;
  window.__footballLabLastInputSample = {
    phase: state.phase,
    inputTime,
    frameTime,
    correctionMs: correctionSeconds * 1000,
    meterValue: state.meterValue
  };
}

function handleAction(inputTime = performance.now()) {
  const now = normaliseInputTime(inputTime);
  if (now < state.actionLockedUntil) return;
  sampleMeterAtInput(now);
  state.actionLockedUntil = now + 70;
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
    Object.assign(state.shot, {
      aimX: target.x,
      aimY: target.y,
      curve: Math.max(-1, Math.min(1, state.shot.previewCurve || 0))
    });
    elements.aimReadout.textContent = target.label;
    elements.curveReadout.textContent = curveLabel(state.shot);
    takeShot();
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
  const character = activeCharacter();
  const motionProfile = ({
    "dax-ryder": { runUpDuration: 640, contactHoldDuration: 76, settleBonus: 45, style: "power" },
    "leo-vale": { runUpDuration: 720, contactHoldDuration: 72, settleBonus: 70, style: "precision" },
    "zion-arc": { runUpDuration: 680, contactHoldDuration: 74, settleBonus: 60, style: "curve" },
    "kai-mori": { runUpDuration: 760, contactHoldDuration: 78, settleBonus: 85, style: "composure" }
  })[character.id] || { runUpDuration: 700, contactHoldDuration: 74, settleBonus: 60, style: "balanced" };
  const { runUpDuration, contactHoldDuration } = motionProfile;
  const settleDuration = settleDurationForShot(state.shot) + motionProfile.settleBonus;
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
  state.contactHapticTimer = setTimeout(() => vibrate(12), runUpDuration + contactHoldDuration);
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
    isReplay: false,
    motionStyle: motionProfile.style,
    characterId: character.id
  };
  state.finishedAnimationId = null;
}

function scoreShot(shot) {
  shot.lifeRestored = false;
  if (shot.outcome !== "GOAL") {
    state.misses += 1;
    state.streak = 0;
    state.pendingStageAdvance = false;
    return 0;
  }

  state.streak += 1;
  state.bestRunStreak = Math.max(state.bestRunStreak, state.streak);
  const strikeBonus = shot.strikeQuality >= 0.9 ? 350 : shot.strikeQuality >= 0.68 ? 175 : 0;
  const distanceBonus = Math.max(0, state.currentStage.distanceYards - 20) * 34;
  const points = 1000
    + state.stage * 85
    + Math.max(0, state.streak - 1) * 125
    + strikeBonus
    + distanceBonus
    + (shot.topCorner ? 700 : 0)
    + Math.round(Math.abs(state.stageWind) * 1700);
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
  playOutcomeSound(shot.outcome, { topCorner: shot.topCorner, saveType: shot.saveType });

  state.presentation = {
    ...state.presentation,
    phase: "result",
    resultAt: performance.now(),
    outcome: shot.outcome,
    saveType: shot.saveType,
    topCorner: shot.topCorner,
    breakdown: buildBreakdown(shot)
  };

  const replayable = Boolean(shot.outcome === "GOAL" && (shot.topCorner || shot.strikeQuality >= 0.9));
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
    flightDuration: 820,
    settleDuration: 90,
    totalDuration: 911,
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
  state.presentationTimeout = setTimeout(continueAfterBreakdown, 650);
}

function beginNextStage() {
  state.stage += 1;
  syncStage();
  const { keeper, wall } = announceMatchupChange();
  renderHud();
  const difficulty = difficultyForStage(state.stage, stageConfig());
  state.presentation = {
    phase: "stage",
    startedAt: performance.now(),
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
  elements.shotAction.textContent = "START NEXT STAGE";
  playStageSound();
  vibrate([12, 28, 12]);
  state.presentationTimeout = setTimeout(prepareNextShot, 1100);
}

function showChapterComplete() {
  clearPresentationTimers();
  state.presentation = {
    phase: "chapter-complete",
    startedAt: performance.now(),
    skippable: true,
    chapterNumber: state.currentStage.chapterNumber,
    chapterName: state.currentStage.chapterName,
    venue: state.currentStage.venue,
    scoreLabel: `${formatScore(state.score)} PTS`
  };
  elements.shotAction.textContent = "CONTINUE JOURNEY";
  playStageSound({ chapterComplete: true });
  vibrate([18, 35, 18, 45, 24]);
  state.presentationTimeout = setTimeout(advanceAfterChapter, 1650);
}

function advanceAfterChapter() {
  if (state.presentation?.phase !== "chapter-complete") return;
  clearPresentationTimers();
  beginNextStage();
}

function continueAfterBreakdown() {
  if (state.presentation?.phase !== "breakdown") return;
  clearPresentationTimers();
  if (state.pendingStageAdvance) {
    const completedStage = state.stage + 1;
    if (completedStage <= 30 && completedStage % 5 === 0) showChapterComplete();
    else beginNextStage();
    return;
  }
  prepareNextShot();
}

function finishAnimation(animationId) {
  if (state.presentation?.phase === "replay") finishReplay(animationId);
  else finishPrimaryShot(animationId);
}

function prepareNextShot() {
  resetPresentation();
  state.shot = createShot();
  syncStage();
  announceMatchupChange();
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
    const speed = (3.35 + stage.aimSpeed * 0.18) * difficulty.meter.power * meterMultiplier("power", state.stage);
    state.meterValue = (Math.sin(state.meterClock * speed - Math.PI / 2) + 1) / 2;
  } else if (state.phase === "aim") {
    const target = currentAimTarget();
    state.meterValue = Math.max(0, Math.min(1, target.x));
  } else {
    state.meterClock += delta;
    const speed = (2.78 + stage.aimSpeed * 0.2) * difficulty.meter.curve * meterMultiplier("curve", state.stage);
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
  [elements.returnMenu, returnToMenu],
  [elements.exitGame, () => window.dispatchEvent(new CustomEvent("footballlab:openfinish"))],
  [elements.brandButton, () => state.screen === "game"
    ? window.dispatchEvent(new CustomEvent("footballlab:openfinish"))
    : returnToMenu()],
  [elements.howToPlay, () => openModal(elements.howModal)]
].forEach(([element, handler]) => element.addEventListener("click", handler));

elements.shotAction.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
  event.preventDefault();
  suppressActionClickUntil = performance.now() + 450;
  handleAction(event.timeStamp);
}, { passive: false });
elements.shotAction.addEventListener("click", (event) => {
  if (performance.now() < suppressActionClickUntil) {
    event.preventDefault();
    suppressActionClickUntil = 0;
    return;
  }
  handleAction(event.timeStamp);
});
elements.canvas.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
  event.preventDefault();
  handleAction(event.timeStamp);
}, { passive: false });
elements.canvas.style.touchAction = "manipulation";
elements.shotAction.style.touchAction = "manipulation";

window.addEventListener("footballlab:takeplannedshot", () => {
  if (state.screen !== "game" || state.phase !== "aim" || state.animation) return;
  suppressActionClickUntil = 0;
  handleAction(performance.now());
});

window.addEventListener("footballlab:submitrun", () => {
  if (state.screen !== "game" || elements.gameOverModal.classList.contains("is-open")) return;
  setPhase("ready");
  endRun();
  window.dispatchEvent(new CustomEvent("footballlab:runsubmitted"));
});

$$('[data-preview]').forEach((button) => button.addEventListener("click", () => openModePreview(button.dataset.preview)));
$$('[data-close-modal]').forEach((button) => button.addEventListener("click", () => closeModal(elements.howModal)));
$$('[data-close-preview]').forEach((button) => button.addEventListener("click", () => closeModal(elements.previewModal)));

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if ((event.code === "Space" || event.code === "Enter") && state.screen === "game" && !elements.gameOverModal.classList.contains("is-open")) {
    event.preventDefault();
    handleAction(event.timeStamp);
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



window.__footballLabRuntimeV23 = Object.freeze({ staticModules: true, generatedModuleCount: 9 });
