// Football Lab - Set Pieces Lab (v3)
// Single-file build so it works reliably on GitHub Pages mobile (no missing levels.js).

(() => {
  const STORE_KEY = "footballlab_progress_v1";

  // Level data (expand anytime)
  const LEVELS = [
    { id: 1, name: "Starter",  shots: 5, wind: 0.00, target: { x: 0.78, y: 0.36, r: 0.075 } },
    { id: 2, name: "Pressure", shots: 4, wind: 0.18, target: { x: 0.72, y: 0.30, r: 0.060 } },
  ];

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const hudLevel = document.getElementById("hudLevel");
  const hudShots = document.getElementById("hudShots");
  const hudWind  = document.getElementById("hudWind");

  const nextBtn = document.getElementById("nextBtn");
  const restartBtn = document.getElementById("restartBtn");
  const backBtn = document.getElementById("backBtn");

  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const overlayNext = document.getElementById("overlayNext");
  const overlayRetry = document.getElementById("overlayRetry");

  function readProgress(){
    try{ return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; }catch{ return {}; }
  }
  function writeProgress(p){ localStorage.setItem(STORE_KEY, JSON.stringify(p)); }

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function dist(ax, ay, bx, by){ return Math.hypot(ax-bx, ay-by); }

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
    overlayNext.style.display = canNext ? "inline-flex" : "none";

    // stop canvas stealing taps
    canvas.style.pointerEvents = "none";
  }
  function hideOverlay(){
    overlay.hidden = true;
    canvas.style.pointerEvents = "auto";
  }

  function loadLevel(index){
    const unlocked = getUnlockedLevel();
    index = clamp(index, 0, LEVELS.length - 1);
    if (LEVELS[index].id > unlocked) index = unlocked - 1;

    state.levelIndex = index;
    state.levelComplete = false;
    state.levelFailed = false;

    const L = LEVELS[index];
    state.shotsTaken = 0;
    state.shotsLimit = L.shots;
    state.wind = L.wind;

    state.target.x = world.goal.x + world.goal.w * L.target.x;
    state.target.y = world.goal.y + world.goal.h * L.target.y;
    state.target.r = world.goal.h * L.target.r;

    resetBall();
    updateHUD();
    nextBtn.disabled = true;
    hideOverlay();
  }

  function tryComplete(){
    state.levelComplete = true;
    const L = LEVELS[state.levelIndex];
    const hasNext = (L.id < LEVELS.length);
    if (hasNext) setUnlockedLevel(L.id + 1);
    nextBtn.disabled = !hasNext;

    showOverlay("LEVEL COMPLETE", hasNext ? "Nice finish. Ready for the next level?" : "You finished the current build. More levels coming soon.", hasNext);
  }

  function failLevel(){
    state.levelFailed = true;
    showOverlay("OUT OF SHOTS", "Retry the level and adjust your aim/power.", false);
  }

  function nextLevel(){
    const L = LEVELS[state.levelIndex];
    const nextIndex = LEVELS.findIndex(x => x.id === L.id + 1);
    if (nextIndex !== -1) loadLevel(nextIndex);
  }

  function restartLevel(){ loadLevel(state.levelIndex); }

  function bindTap(el, fn){
    if (!el) return;
    el.addEventListener("pointerup", (e) => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive:false });
    el.addEventListener("touchend", (e) => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive:false });
    el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  // Prevent taps from reaching canvas
  overlay.addEventListener("pointerdown", (e) => e.stopPropagation());
  overlay.addEventListener("click", (e) => e.stopPropagation());

  bindTap(nextBtn, nextLevel);
  bindTap(restartBtn, restartLevel);
  bindTap(backBtn, () => { location.href = "../../index.html"; });
  bindTap(overlayNext, () => { hideOverlay(); nextLevel(); });
  bindTap(overlayRetry, () => { hideOverlay(); restartLevel(); });

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

  // Loop
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

    // net
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "rgba(255,205,90,.55)";
    for (let x=world.goal.x; x<=world.goal.x+world.goal.w; x+=28){
      ctx.beginPath(); ctx.moveTo(x, world.goal.y); ctx.lineTo(x, world.goal.y+world.goal.h); ctx.stroke();
    }
    for (let y=world.goal.y; y<=world.goal.y+world.goal.h; y+=22){
      ctx.beginPath(); ctx.moveTo(world.goal.x, y); ctx.lineTo(world.goal.x+world.goal.w, y); ctx.stroke();
    }
    ctx.restore();

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

    // aim line + power
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

      const px = 24, py = world.h - 28, pw = 220, ph = 10;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,205,90,.55)";
      ctx.strokeRect(px, py, pw, ph);
      ctx.fillStyle = "rgba(255,223,122,.95)";
      ctx.fillRect(px, py, pw*power, ph);
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

  // Boot
  const unlocked = getUnlockedLevel();
  const startIndex = Math.max(0, LEVELS.findIndex(x => x.id === unlocked));
  loadLevel(startIndex === -1 ? 0 : startIndex);
  step();
})();
