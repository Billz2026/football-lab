(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const formatScore = (value) => Math.max(0, Math.round(value)).toLocaleString("en-GB");

  const STORAGE_KEY = "footballLabArcadeProfileV2";
  const STAGES = [
    { name: "THE OPENER", wall: 3, wind: 0.02, keeper: 0.24, distance: 0.18 },
    { name: "AROUND THE WALL", wall: 4, wind: -0.04, keeper: 0.31, distance: 0.24 },
    { name: "THE WIDE ANGLE", wall: 4, wind: 0.07, keeper: 0.38, distance: 0.30 },
    { name: "HEAVY WEATHER", wall: 5, wind: -0.12, keeper: 0.43, distance: 0.34 },
    { name: "TOP BINS ONLY", wall: 5, wind: 0.09, keeper: 0.52, distance: 0.38 },
    { name: "THE SPECIALIST", wall: 6, wind: -0.14, keeper: 0.60, distance: 0.43 },
    { name: "NIGHT FINAL", wall: 6, wind: 0.16, keeper: 0.68, distance: 0.48 }
  ];

  const profile = loadProfile();
  const state = {
    screen: "menu",
    phase: "ready",
    score: 0,
    streak: 0,
    bestRunStreak: 0,
    stage: 0,
    misses: 0,
    meterClock: 0,
    meterValue: 0,
    lastTime: performance.now(),
    shot: createShot(),
    animation: null,
    resultTimeout: null,
    stageWind: 0
  };

  const elements = {
    menuScreen: $("#menuScreen"),
    gameScreen: $("#gameScreen"),
    playClassic: $("#playClassic"),
    classicCard: $("#classicCard"),
    howToPlay: $("#howToPlay"),
    howModal: $("#howModal"),
    previewModal: $("#previewModal"),
    gameOverModal: $("#gameOverModal"),
    modalPlay: $("#modalPlay"),
    brandButton: $("#brandButton"),
    exitGame: $("#exitGame"),
    retryGame: $("#retryGame"),
    returnMenu: $("#returnMenu"),
    shotAction: $("#shotAction"),
    canvas: $("#gameCanvas"),
    stageNumber: $("#stageNumber"),
    stageName: $("#stageName"),
    scoreValue: $("#scoreValue"),
    streakValue: $("#streakValue"),
    livesValue: $("#livesValue"),
    windArrow: $("#windArrow"),
    windValue: $("#windValue"),
    resultBanner: $("#resultBanner"),
    canvasPrompt: $("#canvasPrompt"),
    phaseTitle: $("#phaseTitle"),
    phaseHelp: $("#phaseHelp"),
    meterFill: $("#meterFill"),
    meterMarker: $("#meterMarker"),
    meterLabel: $("#meterLabel"),
    meterNumber: $("#meterNumber"),
    powerReadout: $("#powerReadout"),
    aimReadout: $("#aimReadout"),
    curveReadout: $("#curveReadout"),
    previewTitle: $("#previewTitle"),
    previewCopy: $("#previewCopy"),
    previewList: $("#previewList"),
    finalScore: $("#finalScore"),
    finalStage: $("#finalStage"),
    finalStreak: $("#finalStreak"),
    finalBest: $("#finalBest")
  };

  const ctx = elements.canvas.getContext("2d");
  let canvasScale = 1;
  let canvasOffsetX = 0;
  let canvasOffsetY = 0;
  let canvasDpr = 1;
  const WORLD = { width: 1200, height: 720 };

  function loadProfile() {
    const fallback = { highScore: 0, bestStreak: 0, xp: 0 };
    try {
      return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch {
      return fallback;
    }
  }

  function saveProfile() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    renderProfile();
  }

  function profileLevel() {
    return Math.max(1, Math.floor(profile.xp / 1000) + 1);
  }

  function renderProfile() {
    const level = profileLevel();
    const currentXp = profile.xp % 1000;
    $("#headerLevel").textContent = String(level);
    $("#profileLevel").textContent = `LV. ${level}`;
    $("#headerBest").textContent = formatScore(profile.highScore);
    $("#profileBest").textContent = formatScore(profile.highScore);
    $("#profileStreak").textContent = String(profile.bestStreak);
    $("#xpCopy").textContent = `${formatScore(currentXp)} / 1,000`;
    $("#xpBar").style.width = `${currentXp / 10}%`;
  }

  function createShot() {
    return {
      power: null,
      aimX: null,
      aimY: null,
      curve: null,
      actualX: null,
      actualY: null,
      outcome: null,
      points: 0,
      topCorner: false
    };
  }

  function stageConfig() {
    const cycle = Math.floor(state.stage / STAGES.length);
    const base = STAGES[state.stage % STAGES.length];
    return {
      ...base,
      keeper: clamp(base.keeper + cycle * 0.045, 0, 0.82),
      wind: clamp(base.wind * (1 + cycle * 0.12), -0.22, 0.22),
      distance: clamp(base.distance + cycle * 0.018, 0.18, 0.58)
    };
  }

  function randomiseWind() {
    const stage = stageConfig();
    const variance = (Math.random() - 0.5) * 0.035;
    state.stageWind = clamp(stage.wind + variance, -0.24, 0.24);
  }

  function showScreen(name) {
    state.screen = name;
    elements.menuScreen.classList.toggle("is-active", name === "menu");
    elements.gameScreen.classList.toggle("is-active", name === "game");
    if (name === "game") requestAnimationFrame(resizeCanvas);
  }

  function openModal(modal) {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  function startGame() {
    clearTimeout(state.resultTimeout);
    closeModal(elements.howModal);
    closeModal(elements.previewModal);
    closeModal(elements.gameOverModal);
    state.score = 0;
    state.streak = 0;
    state.bestRunStreak = 0;
    state.stage = 0;
    state.misses = 0;
    state.animation = null;
    state.shot = createShot();
    randomiseWind();
    setPhase("ready");
    showScreen("game");
    renderHud();
  }

  function returnToMenu() {
    clearTimeout(state.resultTimeout);
    closeModal(elements.gameOverModal);
    state.animation = null;
    setPhase("ready");
    showScreen("menu");
    renderProfile();
  }

  function setPhase(phase) {
    state.phase = phase;
    state.meterClock = 0;
    state.meterValue = phase === "curve" ? 0.5 : 0;

    const content = {
      ready: ["READY", "Lock in power, placement and curve. Tap the pitch or use the button.", "START SHOT", "SHOT METER"],
      power: ["SET POWER", "Stop inside the bright control zone. Maximum power is not always the best choice.", "LOCK POWER", "POWER"],
      aim: ["PICK YOUR SPOT", "The target moves across the goal. Corners score more and are harder for the keeper.", "LOCK PLACEMENT", "PLACEMENT"],
      curve: ["ADD CURVE", "Bend left or right to clear the wall and counter the wind.", "TAKE SHOT", "CURVE"],
      shooting: ["WATCH THE FLIGHT", "Your three inputs are locked. The shot is now committed.", "SHOT IN PLAY", "LOCKED"],
      result: ["SHOT COMPLETE", "Review the result, then prepare for the next stage.", "NEXT SHOT", "RESULT"]
    }[phase];

    elements.phaseTitle.textContent = content[0];
    elements.phaseHelp.textContent = content[1];
    elements.shotAction.textContent = content[2];
    elements.meterLabel.textContent = content[3];
    elements.shotAction.disabled = phase === "shooting";
    elements.canvasPrompt.textContent = phase === "ready" ? "PRESS START SHOT" : phase === "shooting" ? "SHOT IN PLAY" : content[2];
    renderSteps();
  }

  function renderSteps() {
    const order = ["power", "aim", "curve"];
    const phaseIndex = order.indexOf(state.phase);
    $$(".shot-step").forEach((step, index) => {
      step.classList.toggle("is-current", (state.phase === "ready" && index === 0) || phaseIndex === index);
      step.classList.toggle("is-complete", phaseIndex > index || ["shooting", "result"].includes(state.phase));
    });
  }

  function handleAction() {
    if (state.screen !== "game" || state.animation) return;

    if (state.phase === "ready") {
      state.shot = createShot();
      elements.resultBanner.className = "result-banner";
      elements.powerReadout.textContent = "—";
      elements.aimReadout.textContent = "—";
      elements.curveReadout.textContent = "—";
      setPhase("power");
      return;
    }

    if (state.phase === "power") {
      state.shot.power = state.meterValue;
      elements.powerReadout.textContent = `${Math.round(state.shot.power * 100)}%`;
      setPhase("aim");
      return;
    }

    if (state.phase === "aim") {
      const target = currentAimTarget();
      state.shot.aimX = target.x;
      state.shot.aimY = target.y;
      elements.aimReadout.textContent = target.label;
      setPhase("curve");
      return;
    }

    if (state.phase === "curve") {
      state.shot.curve = (state.meterValue - 0.5) * 2;
      const direction = Math.abs(state.shot.curve) < 0.12 ? "STRAIGHT" : state.shot.curve < 0 ? "LEFT" : "RIGHT";
      elements.curveReadout.textContent = `${direction} ${Math.round(Math.abs(state.shot.curve) * 100)}%`;
      takeShot();
      return;
    }

    if (state.phase === "result") prepareNextShot();
  }

  function currentAimTarget() {
    const t = state.meterClock;
    const x = 0.5 + Math.sin(t * 2.15) * 0.43;
    const y = 0.49 + Math.sin(t * 3.05 + 1.1) * 0.36;
    const horizontal = x < 0.34 ? "LEFT" : x > 0.66 ? "RIGHT" : "CENTRE";
    const vertical = y < 0.38 ? "HIGH" : y > 0.66 ? "LOW" : "MID";
    return { x: clamp(x, 0.04, 0.96), y: clamp(y, 0.08, 0.92), label: `${vertical} ${horizontal}` };
  }

  function takeShot() {
    setPhase("shooting");
    const stage = stageConfig();
    const shot = state.shot;
    const powerError = (0.74 - shot.power) * 0.55;
    const curlShift = shot.curve * (0.12 + shot.power * 0.035);
    const windShift = state.stageWind * 0.62;
    const fatigueSpread = (Math.random() - 0.5) * (0.018 + state.stage * 0.0015);

    shot.actualX = shot.aimX + curlShift + windShift + fatigueSpread;
    shot.actualY = shot.aimY + powerError + Math.abs(shot.curve) * 0.018;

    const withinGoal = shot.actualX > 0.01 && shot.actualX < 0.99 && shot.actualY > 0.02 && shot.actualY < 0.98;
    const lowCentral = shot.actualY > 0.63 && shot.actualX > 0.18 && shot.actualX < 0.82;
    const wallRisk = stage.wall > 0 && lowCentral && Math.abs(shot.curve) < 0.42;
    const wallBlocked = wallRisk && Math.random() < clamp(0.43 + stage.wall * 0.045 - shot.power * 0.2, 0.18, 0.72);

    const keeperRead = clamp(shot.actualX + (Math.random() - 0.5) * (0.52 - stage.keeper * 0.3), 0.05, 0.95);
    const keeperDistance = Math.abs(shot.actualX - keeperRead) + Math.abs(shot.actualY - 0.57) * 0.34;
    const saved = withinGoal && !wallBlocked && keeperDistance < lerp(0.11, 0.25, stage.keeper) && Math.random() < lerp(0.24, 0.72, stage.keeper);

    shot.topCorner = withinGoal && shot.actualY < 0.34 && (shot.actualX < 0.29 || shot.actualX > 0.71);
    if (!withinGoal) shot.outcome = "MISS";
    else if (wallBlocked) shot.outcome = "WALL";
    else if (saved) shot.outcome = "SAVE";
    else shot.outcome = "GOAL";

    const goal = goalRect();
    let endX = goal.x + shot.actualX * goal.w;
    let endY = goal.y + shot.actualY * goal.h;
    if (shot.outcome === "WALL") {
      endX = 590 + (shot.actualX - 0.5) * 180;
      endY = 431;
    }

    state.animation = {
      startedAt: performance.now(),
      duration: 1050,
      start: ballStart(),
      end: { x: endX, y: endY },
      keeperX: goal.x + keeperRead * goal.w,
      outcome: shot.outcome
    };
  }

  function finishShot() {
    const shot = state.shot;
    state.animation = null;
    let banner = "";
    let miss = false;

    if (shot.outcome === "GOAL") {
      state.streak += 1;
      state.bestRunStreak = Math.max(state.bestRunStreak, state.streak);
      const stageBonus = state.stage * 85;
      const streakBonus = Math.max(0, state.streak - 1) * 125;
      const precisionBonus = Math.abs(shot.power - 0.74) < 0.075 ? 250 : 0;
      const cornerBonus = shot.topCorner ? 600 : 0;
      const windBonus = Math.round(Math.abs(state.stageWind) * 1400);
      shot.points = 1000 + stageBonus + streakBonus + precisionBonus + cornerBonus + windBonus;
      state.score += shot.points;
      banner = shot.topCorner ? `TOP CORNER +${formatScore(shot.points)}` : `GOAL +${formatScore(shot.points)}`;
      state.stage += 1;
    } else {
      state.misses += 1;
      state.streak = 0;
      miss = true;
      banner = shot.outcome === "SAVE" ? "SAVED" : shot.outcome === "WALL" ? "BLOCKED" : "OFF TARGET";
    }

    renderHud();
    showResult(banner, miss);
    setPhase("result");

    if (state.misses >= 3) state.resultTimeout = setTimeout(endRun, 1250);
    else state.resultTimeout = setTimeout(prepareNextShot, 1350);
  }

  function prepareNextShot() {
    if (state.misses >= 3) return;
    clearTimeout(state.resultTimeout);
    state.shot = createShot();
    randomiseWind();
    elements.resultBanner.className = "result-banner";
    elements.powerReadout.textContent = "—";
    elements.aimReadout.textContent = "—";
    elements.curveReadout.textContent = "—";
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

  function showResult(message, isMiss) {
    elements.resultBanner.textContent = message;
    elements.resultBanner.className = `result-banner is-visible${isMiss ? " is-miss" : ""}`;
  }

  function renderHud() {
    const stage = stageConfig();
    elements.stageNumber.textContent = `STAGE ${String(state.stage + 1).padStart(2, "0")}`;
    elements.stageName.textContent = stage.name;
    elements.scoreValue.textContent = formatScore(state.score);
    elements.streakValue.textContent = String(state.streak);
    elements.livesValue.textContent = [0, 1, 2].map((index) => index < 3 - state.misses ? "●" : "○").join(" ");
    const windDirection = state.stageWind < -0.015 ? "←" : state.stageWind > 0.015 ? "→" : "•";
    elements.windArrow.textContent = windDirection;
    elements.windValue.textContent = `${Math.abs(state.stageWind * 10).toFixed(1)} m/s`;
  }

  function updateMeter(delta) {
    if (!["power", "aim", "curve"].includes(state.phase)) return;
    state.meterClock += delta;

    if (state.phase === "power") state.meterValue = (Math.sin(state.meterClock * 3.8 - Math.PI / 2) + 1) / 2;
    else if (state.phase === "aim") state.meterValue = (Math.sin(state.meterClock * 2.15) + 1) / 2;
    else state.meterValue = (Math.sin(state.meterClock * 3.05) + 1) / 2;

    const percentage = state.meterValue * 100;
    elements.meterFill.style.width = `${percentage}%`;
    elements.meterMarker.style.left = `${percentage}%`;

    if (state.phase === "curve") {
      const curve = (state.meterValue - 0.5) * 2;
      elements.meterNumber.textContent = `${curve < -0.12 ? "L" : curve > 0.12 ? "R" : "C"} ${Math.round(Math.abs(curve) * 100)}%`;
    } else if (state.phase === "aim") elements.meterNumber.textContent = currentAimTarget().label;
    else elements.meterNumber.textContent = `${Math.round(percentage)}%`;
  }

  function resizeCanvas() {
    const rect = elements.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    canvasDpr = clamp(window.devicePixelRatio || 1, 1, 2);
    elements.canvas.width = Math.round(rect.width * canvasDpr);
    elements.canvas.height = Math.round(rect.height * canvasDpr);
    canvasScale = Math.min(rect.width / WORLD.width, rect.height / WORLD.height);
    canvasOffsetX = (rect.width - WORLD.width * canvasScale) / 2;
    canvasOffsetY = (rect.height - WORLD.height * canvasScale) / 2;
    applyCanvasTransform();
  }

  function applyCanvasTransform() {
    ctx.setTransform(canvasDpr * canvasScale, 0, 0, canvasDpr * canvasScale, canvasDpr * canvasOffsetX, canvasDpr * canvasOffsetY);
  }

  function goalRect() {
    return { x: 770, y: 185, w: 310, h: 205 };
  }

  function ballStart() {
    const distance = stageConfig().distance;
    return { x: 250 - distance * 90, y: 570 + distance * 35 };
  }

  function drawScene(time) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    applyCanvasTransform();
    drawBackground();
    drawPitch();
    drawGoal();
    drawKeeper(time);
    drawWall();
    drawTarget();
    drawBall(time);
    drawForeground();
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, 430);
    sky.addColorStop(0, "#071a13");
    sky.addColorStop(.55, "#0b2b1b");
    sky.addColorStop(1, "#122e1d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.fillStyle = "rgba(2,5,3,.7)";
    ctx.beginPath();
    ctx.moveTo(0, 215);
    ctx.lineTo(1200, 135);
    ctx.lineTo(1200, 365);
    ctx.lineTo(0, 398);
    ctx.closePath();
    ctx.fill();

    for (let row = 0; row < 4; row += 1) {
      for (let x = 15 + row * 12; x < 1190; x += 25) {
        const alpha = 0.08 + ((x + row * 17) % 70) / 900;
        ctx.fillStyle = `rgba(226,255,196,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, 235 + row * 34 + Math.sin(x) * 3, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const glow = ctx.createRadialGradient(960, 95, 0, 960, 95, 220);
    glow.addColorStop(0, "rgba(218,254,77,.22)");
    glow.addColorStop(1, "rgba(218,254,77,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(700, 0, 500, 310);
  }

  function drawPitch() {
    ctx.fillStyle = "#164f2b";
    ctx.beginPath();
    ctx.moveTo(0, 405);
    ctx.lineTo(1200, 350);
    ctx.lineTo(1200, 720);
    ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 7; i += 1) {
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,.018)" : "rgba(0,0,0,.035)";
      ctx.beginPath();
      ctx.moveTo(i * 190 - 80, 720);
      ctx.lineTo(i * 150 + 190, 370);
      ctx.lineTo(i * 150 + 340, 363);
      ctx.lineTo(i * 190 + 110, 720);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(225,255,221,.58)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(755, 407);
    ctx.lineTo(1125, 390);
    ctx.lineTo(1170, 605);
    ctx.lineTo(660, 635);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(730, 555, 90, -1.92, -0.13);
    ctx.stroke();
  }

  function drawGoal() {
    const goal = goalRect();
    ctx.save();
    ctx.strokeStyle = "rgba(238,255,236,.92)";
    ctx.lineWidth = 7;
    ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);
    ctx.strokeStyle = "rgba(238,255,236,.2)";
    ctx.lineWidth = 1.5;
    for (let x = goal.x + 25; x < goal.x + goal.w; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, goal.y); ctx.lineTo(x, goal.y + goal.h); ctx.stroke();
    }
    for (let y = goal.y + 22; y < goal.y + goal.h; y += 22) {
      ctx.beginPath(); ctx.moveTo(goal.x, y); ctx.lineTo(goal.x + goal.w, y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawWall() {
    const count = stageConfig().wall;
    const spacing = 35;
    const start = 600 - ((count - 1) * spacing) / 2;
    for (let i = 0; i < count; i += 1) {
      const x = start + i * spacing;
      const y = 445 + Math.abs(i - (count - 1) / 2) * 1.5;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = "rgba(4,8,6,.26)";
      ctx.beginPath(); ctx.ellipse(0, 30, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = i % 2 ? "#273c31" : "#31483a";
      roundedRect(-14, -42, 28, 48, 10); ctx.fill();
      ctx.fillStyle = "#d7aa83";
      ctx.beginPath(); ctx.arc(0, -54, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#101a13";
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(-6, 7); ctx.lineTo(-9, 30); ctx.moveTo(6, 7); ctx.lineTo(9, 30); ctx.stroke();
      ctx.restore();
    }
  }

  function drawKeeper(time) {
    const goal = goalRect();
    let keeperX = goal.x + goal.w * 0.5;
    let keeperY = goal.y + goal.h * 0.73;
    let rotation = 0;

    if (state.animation) {
      const progress = clamp((time - state.animation.startedAt) / state.animation.duration, 0, 1);
      const dive = smoothStep(clamp((progress - .42) / .45, 0, 1));
      keeperX = lerp(goal.x + goal.w * .5, state.animation.keeperX, dive);
      keeperY -= Math.sin(dive * Math.PI) * 34;
      rotation = (state.animation.keeperX < goal.x + goal.w / 2 ? -1 : 1) * dive * .72;
    } else keeperX += Math.sin(time / 620) * 24;

    ctx.save();
    ctx.translate(keeperX, keeperY);
    ctx.rotate(rotation);
    ctx.fillStyle = "rgba(0,0,0,.2)";
    ctx.beginPath(); ctx.ellipse(0, 30, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#f5f7f1";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(-34, 5); ctx.moveTo(10, -6); ctx.lineTo(34, 5); ctx.stroke();
    ctx.strokeStyle = "#15221a";
    ctx.beginPath(); ctx.moveTo(-7, 21); ctx.lineTo(-18, 45); ctx.moveTo(7, 21); ctx.lineTo(18, 45); ctx.stroke();
    ctx.fillStyle = "#dafe4d";
    roundedRect(-17, -25, 34, 50, 11); ctx.fill();
    ctx.fillStyle = "#bd8d6e";
    ctx.beginPath(); ctx.arc(0, -38, 12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawTarget() {
    if (state.phase !== "aim") return;
    const target = currentAimTarget();
    const goal = goalRect();
    const x = goal.x + target.x * goal.w;
    const y = goal.y + target.y * goal.h;
    const pulse = 1 + Math.sin(state.meterClock * 7) * .08;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = "rgba(218,254,77,.95)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-31, 0); ctx.lineTo(31, 0); ctx.moveTo(0, -31); ctx.lineTo(0, 31); ctx.stroke();
    ctx.restore();
  }

  function drawBall(time) {
    let position = ballStart();
    let radius = 15;
    let height = 0;

    if (state.animation) {
      const raw = clamp((time - state.animation.startedAt) / state.animation.duration, 0, 1);
      const progress = easeOutCubic(raw);
      const start = state.animation.start;
      const end = state.animation.end;
      position = { x: lerp(start.x, end.x, progress), y: lerp(start.y, end.y, progress) };
      height = Math.sin(progress * Math.PI) * (120 + (state.shot.power || .5) * 110);
      radius = lerp(15, 9, progress);
      if (raw >= 1) finishShot();
    }

    ctx.save();
    ctx.globalAlpha = .28;
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(position.x, position.y + 6, radius * 1.15, radius * .4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const ballY = position.y - height;
    const gradient = ctx.createRadialGradient(position.x - radius * .35, ballY - radius * .4, 1, position.x, ballY, radius);
    gradient.addColorStop(0, "#fff");
    gradient.addColorStop(1, "#c7d0c6");
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(position.x, ballY, radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#172019";
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / 5;
      const x = position.x + Math.cos(angle) * radius * .38;
      const y = ballY + Math.sin(angle) * radius * .38;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
  }

  function drawForeground() {
    const start = ballStart();
    ctx.strokeStyle = "rgba(255,255,255,.42)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(start.x, start.y, 72, .25, 2.88); ctx.stroke();
  }

  function roundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function easeOutCubic(value) { return 1 - Math.pow(1 - value, 3); }
  function smoothStep(value) { return value * value * (3 - 2 * value); }

  function frame(time) {
    const delta = Math.min((time - state.lastTime) / 1000, .05);
    state.lastTime = time;
    if (state.screen === "game") {
      updateMeter(delta);
      drawScene(time);
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

  elements.playClassic.addEventListener("click", startGame);
  elements.classicCard.addEventListener("click", startGame);
  elements.modalPlay.addEventListener("click", startGame);
  elements.retryGame.addEventListener("click", startGame);
  elements.returnMenu.addEventListener("click", returnToMenu);
  elements.exitGame.addEventListener("click", returnToMenu);
  elements.brandButton.addEventListener("click", returnToMenu);
  elements.howToPlay.addEventListener("click", () => openModal(elements.howModal));
  elements.shotAction.addEventListener("click", handleAction);
  elements.canvas.addEventListener("pointerdown", handleAction);

  $$("[data-preview]").forEach((button) => button.addEventListener("click", () => openModePreview(button.dataset.preview)));
  $$("[data-close-modal]").forEach((button) => button.addEventListener("click", () => closeModal(elements.howModal)));
  $$("[data-close-preview]").forEach((button) => button.addEventListener("click", () => closeModal(elements.previewModal)));

  document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && state.screen === "game" && !elements.gameOverModal.classList.contains("is-open")) {
      event.preventDefault();
      handleAction();
    }
    if (event.key === "Escape") {
      closeModal(elements.howModal);
      closeModal(elements.previewModal);
    }
  });

  window.addEventListener("resize", resizeCanvas);
  if ("ResizeObserver" in window) new ResizeObserver(resizeCanvas).observe(elements.canvas);

  renderProfile();
  renderHud();
  requestAnimationFrame(frame);
})();
