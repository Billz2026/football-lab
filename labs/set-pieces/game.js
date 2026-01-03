\
// Football Lab - Set Pieces Lab (v4)
// Fallback approach: "Next / Retry" are links that reload with ?level=N.
// This avoids mobile browsers that sometimes ignore button click handlers over canvas.

(() => {
  const STORE_KEY = "footballlab_progress_v1";

  const LEVELS = [
    { id: 1, name: "Starter",  shots: 5, wind: 0.00, target: { x: 0.78, y: 0.36, r: 0.075 } },
    { id: 2, name: "Pressure", shots: 4, wind: 0.18, target: { x: 0.72, y: 0.30, r: 0.060 } },
  ];

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const hudLevel = document.getElementById("hudLevel");
  const hudShots = document.getElementById("hudShots");
  const hudWind  = document.getElementById("hudWind");

  const nextLink = document.getElementById("nextLink");
  const restartLink = document.getElementById("restartLink");

  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const overlayNextLink = document.getElementById("overlayNextLink");
  const overlayRetryLink = document.getElementById("overlayRetryLink");

  function readProgress(){
    try{ return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; }catch{ return {}; }
  }
  function writeProgress(p){ localStorage.setItem(STORE_KEY, JSON.stringify(p)); }

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function dist(ax, ay, bx, by){ return Math.hypot(ax-bx, ay-by); }

  function getUnlockedLevel(){
    const p = readProgress();
    return (p.setPieces && p.setPieces.unlockedLevel) ? p.setPieces.unlockedLevel : 1;
  }
  function setUnlockedLevel(n){
    const p = readProgress();
    p.setPieces = p.setPieces || {};
    p.setPieces.unlockedLevel = Math.max(p.setPieces.unlockedLevel || 1, n);
    writeProgress(p);
  }

  // Read level from URL: /index.html?level=2
  const params = new URLSearchParams(location.search);
  const requestedLevel = Number(params.get("level") || 0);

  const world = {
    w: canvas.width,
    h: canvas.height,
    goal: { x: 120, y: 70, w: 720, h: 220 },
    ballStart: { x: canvas.width * 0.50, y: canvas.height * 0.82 },
  };

  const state = {
    levelIndex: 0,
    shotsTaken: 0,
    shotsLimit: 0,
    wind: 0,
    target: { x: 0, y: 0, r: 0 },
    ball: { x: world.ballStart.x, y: world.ballStart.y, vx: 0, vy: 0, r: 18, moving: false },
    aiming: false,
    aimStart: null,
    aimNow: null,
    levelComplete: false,
    levelFailed: false,
  };

  function resetBall(){
    state.ball.x = world.ballStart.x;
    state.ball.y = world.ballStart.y;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.moving = false;
  }

  function updateHUD(){
    const L = LEVELS[state.levelIndex];
    hudLevel.textContent = String(L.id);
    hudShots.textContent = `${state.shotsTaken}/${state.shotsLimit}`;
    hudWind.textContent = `${state.wind.toFixed(2)}`;
  }

  function showOverlay(title, text, canNext){
    overlay.hidden = false;
    overlayTitle.textContent = title;
    overlayText.textContent = text;

    const L = LEVELS[state.levelIndex];
    const hasNext = canNext && (L.id < LEVELS.length);

    overlayNextLink.style.display = hasNext ? "inline-flex" : "none";
    if (hasNext){
      overlayNextLink.href = `./index.html?level=${L.id + 1}`;
      nextLink.href = overlayNextLink.href;
    }
    // retry reloads same level
    overlayRetryLink.href = `./index.html?level=${L.id}`;
    restartLink.href = overlayRetryLink.href;

    // also toggle the top Next Level link state
    nextLink.setAttribute("aria-disabled", hasNext ? "false" : "true");
    if (!hasNext) nextLink.setAttribute("aria-disabled", "true");
  }

  function hideOverlay(){ overlay.hidden = true; }

  function loadLevelById(levelId){
    const unlocked = getUnlockedLevel();
    levelId = clamp(levelId, 1, LEVELS.length);
    // Don't allow going above unlocked
    if (levelId > unlocked) levelId = unlocked;

    const index = LEVELS.findIndex(l => l.id === levelId);
    state.levelIndex = index === -1 ? 0 : index;

    state.levelComplete = false;
    state.levelFailed = false;

    const L = LEVELS[state.levelIndex];
    state.shotsTaken = 0;
    state.shotsLimit = L.shots;
    state.wind = L.wind;

    state.target.x = world.goal.x + world.goal.w * L.target.x;
    state.target.y = world.goal.y + world.goal.h * L.target.y;
    state.target.r = world.goal.h * L.target.r;

    resetBall();
    updateHUD();
    hideOverlay();

    // Set next link for current level (disabled until completed)
    nextLink.setAttribute("aria-disabled","true");
    nextLink.href = `./index.html?level=${Math.min(L.id + 1, LEVELS.length)}`;
  }

  function tryComplete(){
    state.levelComplete = true;
    const L = LEVELS[state.levelIndex];
    const hasNext = (L.id < LEVELS.length);
    if (hasNext) setUnlockedLevel(L.id + 1);
    showOverlay("LEVEL COMPLETE", hasNext ? "Nice finish. Ready for the next level?" : "You finished the current build. More levels coming soon.", hasNext);
  }

  function failLevel(){
    state.levelFailed = true;
    showOverlay("OUT OF SHOTS", "Retry the level and adjust your aim/power.", false);
  }

  // Input
  function getCanvasPos(evt){
    const rect = canvas.getBoundingClientRect();
    const t = evt.touches && evt.touches[0];
    const clientX = t ? t.clientX : evt.clientX;
    const clientY = t ? t.clientY : evt.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function pointerDown(evt){
    if (state.levelComplete || state.levelFailed) return;
    if (state.ball.moving) return;

    const p = getCanvasPos(evt);
    if (dist(p.x, p.y, state.ball.x, state.ball.y) <= state.ball.r * 2.2){
      state.aiming = true;
      state.aimStart = { x: state.ball.x, y: state.ball.y };
      state.aimNow = p;
      evt.preventDefault?.();
    }
  }
  function pointerMove(evt){
    if (!state.aiming) return;
    state.aimNow = getCanvasPos(evt);
    evt.preventDefault?.();
  }
  function pointerUp(evt){
    if (!state.aiming) return;
    state.aiming = false;

    const end = state.aimNow || getCanvasPos(evt);
    const dx = state.aimStart.x - end.x;
    const dy = state.aimStart.y - end.y;

    const drag = Math.hypot(dx, dy);
    const power = clamp(drag / 260, 0, 1);

    const len = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;

    state.ball.vx = ux * (10 + 20 * power);
    state.ball.vy = uy * (10 + 20 * power);
    state.ball.moving = true;

    state.shotsTaken += 1;
    updateHUD();

    state.aimStart = null;
    state.aimNow = null;
  }

  canvas.addEventListener("mousedown", pointerDown);
  window.addEventListener("mousemove", pointerMove);
  window.addEventListener("mouseup", pointerUp);

  canvas.addEventListener("touchstart", pointerDown, { passive:false });
  window.addEventListener("touchmove", pointerMove, { passive:false });
  window.addEventListener("touchend", pointerUp, { passive:false });

  function drawGlowCircle(x,y,r){
    ctx.save();
    const g = ctx.createRadialGradient(x,y, r*0.15, x,y, r*1.25);
    g.addColorStop(0, "rgba(255,223,122,.85)");
    g.addColorStop(0.55, "rgba(242,193,79,.30)");
    g.addColorStop(1, "rgba(242,193,79,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x,y,r*1.25,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function render(){
    ctx.clearRect(0,0,world.w,world.h);

    const bg = ctx.createLinearGradient(0,0,0,world.h);
    bg.addColorStop(0,"rgba(10,12,15,1)");
    bg.addColorStop(1,"rgba(5,6,7,1)");
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,world.w,world.h);

    // goal frame
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(255,205,90,.85)";
    ctx.shadowColor = "rgba(242,193,79,.45)";
    ctx.shadowBlur = 18;
    ctx.strokeRect(world.goal.x, world.goal.y, world.goal.w, world.goal.h);
    ctx.restore();

    // target
    drawGlowCircle(state.target.x, state.target.y, state.target.r);
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,223,122,.95)";
    ctx.beginPath();
    ctx.arc(state.target.x, state.target.y, state.target.r, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();

    // ball
    ctx.save();
    ctx.fillStyle = "rgba(255,223,122,.95)";
    ctx.shadowColor = "rgba(242,193,79,.45)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // aim line
    if (state.aiming && state.aimStart && state.aimNow){
      const dx = state.aimStart.x - state.aimNow.x;
      const dy = state.aimStart.y - state.aimNow.y;
      const drag = Math.hypot(dx, dy);
      const power = clamp(drag / 260, 0, 1);

      ctx.save();
      ctx.lineWidth = 6;
      ctx.strokeStyle = `rgba(255,223,122,${0.25 + power*0.65})`;
      ctx.shadowColor = "rgba(242,193,79,.55)";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(state.ball.x, state.ball.y);
      ctx.lineTo(state.aimNow.x, state.aimNow.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function step(){
    if (state.ball.moving && !state.levelComplete && !state.levelFailed){
      state.ball.vx += state.wind * 0.03;
      state.ball.x += state.ball.vx;
      state.ball.y += state.ball.vy;

      state.ball.vy += 0.22;
      state.ball.vx *= 0.992;
      state.ball.vy *= 0.992;

      if (state.ball.x < state.ball.r){ state.ball.x = state.ball.r; state.ball.vx *= -0.55; }
      if (state.ball.x > world.w - state.ball.r){ state.ball.x = world.w - state.ball.r; state.ball.vx *= -0.55; }

      if (state.ball.y > world.h + 80 || (Math.abs(state.ball.vx) + Math.abs(state.ball.vy) < 0.35 && state.ball.y > world.h * 0.78)){
        state.ball.moving = false;
        resetBall();
        if (!state.levelComplete && state.shotsTaken >= state.shotsLimit) failLevel();
      }

      const inGoalArea =
        state.ball.x > world.goal.x &&
        state.ball.x < world.goal.x + world.goal.w &&
        state.ball.y > world.goal.y &&
        state.ball.y < world.goal.y + world.goal.h;

      if (inGoalArea && dist(state.ball.x, state.ball.y, state.target.x, state.target.y) <= state.target.r){
        state.ball.moving = false;
        tryComplete();
      }
    }

    render();
    requestAnimationFrame(step);
  }

  // Boot: choose requested level if available, else unlocked
  const unlocked = getUnlockedLevel();
  const startLevel = (requestedLevel >= 1) ? requestedLevel : unlocked;
  loadLevelById(startLevel);
  step();
})();
