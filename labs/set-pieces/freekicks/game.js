// Football Lab - Free Kicks (click-fix v2)
// Fix: overlay Next/Retry use both anchors AND explicit JS navigation,
// and we stop touch/click bubbling from the overlay into global handlers.

(() => {
  const STORE_KEY = "footballlab_freekicks_progress_v1";

  const LEVELS = [
    { id: 1, attempts: 6, target: { x: 0.78, y: 0.32, r: 0.070 }, wall: { x: 0.58, y: 0.64, count: 4 } },
    { id: 2, attempts: 5, target: { x: 0.72, y: 0.24, r: 0.060 }, wall: { x: 0.60, y: 0.64, count: 5 } },
    { id: 3, attempts: 5, target: { x: 0.84, y: 0.26, r: 0.055 }, wall: { x: 0.59, y: 0.64, count: 5 } },
    { id: 4, attempts: 4, target: { x: 0.70, y: 0.40, r: 0.055 }, wall: { x: 0.61, y: 0.64, count: 5 } },
  ];

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const hudLevel = document.getElementById("hudLevel");
  const hudAttempts = document.getElementById("hudAttempts");
  const hudCurve = document.getElementById("hudCurve");

  const overlay = document.getElementById("overlay");
  const overlayCard = document.getElementById("overlayCard");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const overlayNextLink = document.getElementById("overlayNextLink");
  const overlayRetryLink = document.getElementById("overlayRetryLink");

  const levelsGrid = document.getElementById("levelsGrid");

  const params = new URLSearchParams(location.search);
  const requestedLevel = Number(params.get("level") || 1);

  // ---- NAVIGATION SAFETY (mobile click-fix) ----
  function navTo(url){
    // force a hard navigation (works even if something blocks normal clicks)
    window.location.assign(url);
  }
  function bindNav(linkEl){
    if (!linkEl) return;
    // Click
    linkEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navTo(linkEl.getAttribute("href"));
    }, { capture: true });

    // Touch
    linkEl.addEventListener("touchend", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navTo(linkEl.getAttribute("href"));
    }, { capture: true, passive: false });
  }

  // Stop overlay interactions bubbling to window handlers
  if (overlayCard){
    ["click","touchstart","touchmove","touchend","pointerdown","pointerup"].forEach(evtName => {
      overlayCard.addEventListener(evtName, (e) => { e.stopPropagation(); }, { capture: true, passive: false });
    });
  }

  bindNav(overlayNextLink);
  bindNav(overlayRetryLink);

  // ---- PROGRESS ----
  function readProgress(){
    try{ return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; }catch{ return {}; }
  }
  function writeProgress(p){ localStorage.setItem(STORE_KEY, JSON.stringify(p)); }

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function dist(ax, ay, bx, by){ return Math.hypot(ax-bx, ay-by); }

  function getUnlockedLevel(){
    const p = readProgress();
    return p.unlockedLevel || 1;
  }
  function setUnlockedLevel(n){
    const p = readProgress();
    p.unlockedLevel = Math.max(p.unlockedLevel || 1, n);
    writeProgress(p);
  }

  const world = {
    w: canvas.width,
    h: canvas.height,
    goal: { x: 140, y: 70, w: 680, h: 220 },
    ballStart: { x: canvas.width * 0.30, y: canvas.height * 0.74 },
  };

  const state = {
    levelId: 1,
    attemptsTaken: 0,
    attemptsLimit: 0,
    curve: 0,
    target: { x: 0, y: 0, r: 0 },
    wall: [],
    ball: { x: world.ballStart.x, y: world.ballStart.y, vx: 0, vy: 0, r: 16, moving: false },
    aiming: false,
    aimStart: null,
    aimNow: null,
    levelComplete: false,
    levelFailed: false,
  };

  function buildWall(L){
    const arr = [];
    const baseX = world.w * L.wall.x;
    const baseY = world.h * L.wall.y;
    const spacing = 30;
    for (let i=0;i<L.wall.count;i++){
      arr.push({ x: baseX, y: baseY - i*spacing, r: 14 });
    }
    return arr;
  }

  function resetBall(){
    state.ball.x = world.ballStart.x;
    state.ball.y = world.ballStart.y;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.moving = false;
    state.curve = 0;
    hudCurve.textContent = "0.00";
  }

  function updateHUD(){
    hudLevel.textContent = String(state.levelId);
    hudAttempts.textContent = `${state.attemptsTaken}/${state.attemptsLimit}`;
    hudCurve.textContent = state.curve.toFixed(2);
  }

  function hideOverlay(){ overlay.hidden = true; overlay.style.display = "none"; }
  function showOverlay(title, text, canNext){
    overlay.hidden = false;
    overlay.style.display = "flex";
    overlay.hidden = false;
    overlayTitle.textContent = title;
    overlayText.textContent = text;

    const hasNext = canNext && state.levelId < LEVELS.length;
    overlayRetryLink.href = `./index.html?level=${state.levelId}`;

    overlayNextLink.style.display = hasNext ? "inline-flex" : "none";
    overlayNextLink.href = `./index.html?level=${Math.min(state.levelId+1, LEVELS.length)}`;
  }

  function loadLevelById(levelId){
    const unlocked = getUnlockedLevel();
    levelId = clamp(levelId, 1, LEVELS.length);
    if (levelId > unlocked) levelId = unlocked;

    const L = LEVELS[levelId - 1] || LEVELS[0];

    state.levelId = L.id;
    state.attemptsTaken = 0;
    state.attemptsLimit = L.attempts;
    state.levelComplete = false;
    state.levelFailed = false;

    state.target.x = world.goal.x + world.goal.w * L.target.x;
    state.target.y = world.goal.y + world.goal.h * L.target.y;
    state.target.r = world.goal.h * L.target.r;

    state.wall = buildWall(L);

    resetBall();
    updateHUD();
    hideOverlay();
  }

  function completeLevel(){
    state.levelComplete = true;
    if (state.levelId < LEVELS.length) setUnlockedLevel(state.levelId + 1);
    showOverlay("LEVEL COMPLETE", "Nice finish. Ready for the next level?", true);
    renderLevels();
  }
  function failLevel(){
    state.levelFailed = true;
    showOverlay("OUT OF ATTEMPTS", "Retry the level and adjust aim / curve.", false);
  }

  function renderLevels(){
    const unlocked = getUnlockedLevel();
    levelsGrid.innerHTML = "";
    for (const L of LEVELS){
      const a = document.createElement("a");
      a.className = "level-btn";
      a.href = `./index.html?level=${L.id}#top`;
      const locked = L.id > unlocked;
      if (locked) a.setAttribute("aria-disabled","true");

      const left = document.createElement("div");
      left.className = "level-num";
      left.textContent = `LEVEL ${L.id}`;

      const right = document.createElement("div");
      right.className = "level-tag";
      right.textContent = locked ? "LOCKED" : (L.id === state.levelId ? "PLAYING" : "UNLOCKED");

      a.appendChild(left);
      a.appendChild(right);
      levelsGrid.appendChild(a);
    }
  }

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
    if (dist(p.x, p.y, state.ball.x, state.ball.y) <= state.ball.r * 2.5){
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
    const power = clamp(drag / 250, 0, 1);

    const len = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;

    state.ball.vx = ux * (10 + 24 * power);
    state.ball.vy = uy * (10 + 24 * power);
    state.ball.moving = true;

    state.attemptsTaken += 1;
    updateHUD();

    state.aimStart = null;
    state.aimNow = null;
  }

  // Curve via swipe while moving
  let lastSwipeX = null;
  function swipeStart(evt){
    if (!state.ball.moving) return;
    const p = getCanvasPos(evt);
    lastSwipeX = p.x;
  }
  function swipeMove(evt){
    if (!state.ball.moving) return;
    const p = getCanvasPos(evt);
    if (lastSwipeX == null) lastSwipeX = p.x;
    const dx = p.x - lastSwipeX;
    lastSwipeX = p.x;
    state.curve = clamp(state.curve + dx / 400, -1, 1);
    hudCurve.textContent = state.curve.toFixed(2);
  }
  function swipeEnd(){ lastSwipeX = null; }

  // IMPORTANT: only bind touch handlers to CANVAS (not window) so overlay links work.
  canvas.addEventListener("mousedown", pointerDown);
  canvas.addEventListener("mousemove", pointerMove);
  canvas.addEventListener("mouseup", pointerUp);

  canvas.addEventListener("touchstart", (e)=>{ pointerDown(e); swipeStart(e); }, { passive:false });
  canvas.addEventListener("touchmove", (e)=>{ pointerMove(e); swipeMove(e); }, { passive:false });
  canvas.addEventListener("touchend", (e)=>{ pointerUp(e); swipeEnd(); }, { passive:false });

  function glowCircle(x,y,r){
    ctx.save();
    const g = ctx.createRadialGradient(x,y, r*0.15, x,y, r*1.35);
    g.addColorStop(0, "rgba(255,223,122,.85)");
    g.addColorStop(0.55, "rgba(242,193,79,.30)");
    g.addColorStop(1, "rgba(242,193,79,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x,y,r*1.35,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function render(){
    ctx.clearRect(0,0,world.w,world.h);

    const bg = ctx.createLinearGradient(0,0,0,world.h);
    bg.addColorStop(0,"rgba(10,12,15,1)");
    bg.addColorStop(1,"rgba(5,6,7,1)");
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,world.w,world.h);

    // goal
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(255,205,90,.85)";
    ctx.shadowColor = "rgba(242,193,79,.45)";
    ctx.shadowBlur = 18;
    ctx.strokeRect(world.goal.x, world.goal.y, world.goal.w, world.goal.h);
    ctx.restore();

    // target
    glowCircle(state.target.x, state.target.y, state.target.r);
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,223,122,.95)";
    ctx.beginPath(); ctx.arc(state.target.x, state.target.y, state.target.r, 0, Math.PI*2); ctx.stroke();
    ctx.restore();

    // wall
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.10)";
    ctx.strokeStyle = "rgba(255,205,90,.45)";
    ctx.lineWidth = 2;
    for (const m of state.wall){
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();

    // ball
    ctx.save();
    ctx.fillStyle = "rgba(255,223,122,.95)";
    ctx.shadowColor = "rgba(242,193,79,.45)";
    ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // aim line
    if (state.aiming && state.aimStart && state.aimNow){
      const dx = state.aimStart.x - state.aimNow.x;
      const dy = state.aimStart.y - state.aimNow.y;
      const drag = Math.hypot(dx, dy);
      const power = clamp(drag / 250, 0, 1);

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

  function collideCircle(a, b){
    return dist(a.x,a.y,b.x,b.y) <= (a.r + b.r);
  }

  function step(){
    if (state.ball.moving && !state.levelComplete && !state.levelFailed){
      const speed = Math.hypot(state.ball.vx, state.ball.vy);
      const side = state.curve * 0.06 * speed;
      state.ball.vx += side;

      state.ball.x += state.ball.vx;
      state.ball.y += state.ball.vy;

      state.ball.vy += 0.18;
      state.ball.vx *= 0.992;
      state.ball.vy *= 0.992;

      // wall hit resets attempt
      for (const m of state.wall){
        if (collideCircle({x:state.ball.x,y:state.ball.y,r:state.ball.r}, m)){
          state.ball.moving = false;
          resetBall();
          if (!state.levelComplete && state.attemptsTaken >= state.attemptsLimit) failLevel();
        }
      }

      const inGoalArea =
        state.ball.x > world.goal.x &&
        state.ball.x < world.goal.x + world.goal.w &&
        state.ball.y > world.goal.y &&
        state.ball.y < world.goal.y + world.goal.h;

      if (inGoalArea && dist(state.ball.x, state.ball.y, state.target.x, state.target.y) <= state.target.r){
        state.ball.moving = false;
        completeLevel();
      }

      if (state.ball.y > world.h + 80 || state.ball.x < -80 || state.ball.x > world.w + 80){
        state.ball.moving = false;
        resetBall();
        if (!state.levelComplete && state.attemptsTaken >= state.attemptsLimit) failLevel();
      }
    }

    render();
    requestAnimationFrame(step);
  }

  // Boot
  const unlocked = getUnlockedLevel();
  const start = clamp(requestedLevel || 1, 1, LEVELS.length);
  loadLevelById(start > unlocked ? unlocked : start);
  renderLevels();
  hideOverlay();
  step();
})();
// Auto-start UX: fade the hint after first interaction
(function(){
  const hb = document.getElementById("hintBanner");
  if(!hb) return;
  const fade = ()=>{
    hb.style.transition = "opacity 400ms ease";
    hb.style.opacity = "0";
    setTimeout(()=>{ hb.style.display="none"; }, 450);
    window.removeEventListener("pointerdown", fade, true);
    window.removeEventListener("touchstart", fade, true);
    window.removeEventListener("mousedown", fade, true);
  };
  window.addEventListener("pointerdown", fade, true);
  window.addEventListener("touchstart", fade, {capture:true, passive:true});
  window.addEventListener("mousedown", fade, true);
})();
