// Football Lab - Free Kicks (Side-angle) | Auto-start + no Next/Retry buttons
(() => {
  const STORE_KEY = "footballlab_freekicks_progress_sideangle_v1";
  const LEVELS = [
    { id: 1, attempts: 6, target: { x: 0.78, y: 0.34, r: 0.060 }, wall: { x: 0.63, y: 0.72, count: 4 } },
    { id: 2, attempts: 5, target: { x: 0.74, y: 0.26, r: 0.055 }, wall: { x: 0.65, y: 0.72, count: 5 } },
    { id: 3, attempts: 5, target: { x: 0.86, y: 0.28, r: 0.050 }, wall: { x: 0.64, y: 0.72, count: 5 } },
    { id: 4, attempts: 4, target: { x: 0.72, y: 0.44, r: 0.050 }, wall: { x: 0.66, y: 0.72, count: 5 } },
  ];

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hudLevel = document.getElementById("hudLevel");
  const hudAttempts = document.getElementById("hudAttempts");
  const hudCurve = document.getElementById("hudCurve");

  const startOverlay = document.getElementById("startOverlay");
  const startBtn = document.getElementById("startBtn");

  const toast = document.getElementById("toast");
  const toastTitle = document.getElementById("toastTitle");
  const toastText = document.getElementById("toastText");

  // Assets live in /assets/freekicks/
  const ASSETS = {
    playerIdle: "../../../assets/freekicks/player_idle.svg",
    playerKick: "../../../assets/freekicks/player_kick.svg",
    ball: "../../../assets/freekicks/ball.svg",
  };

  const loadImage = (src) => new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("Failed to load: " + src));
    i.src = src;
  });

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  const readProgress = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; } catch { return {}; } };
  const writeProgress = (p) => localStorage.setItem(STORE_KEY, JSON.stringify(p));
  const getUnlockedLevel = () => readProgress().unlockedLevel || 1;
  const setUnlockedLevel = (n) => { const p = readProgress(); p.unlockedLevel = Math.max(p.unlockedLevel || 1, n); writeProgress(p); };

  const params = new URLSearchParams(location.search);
  const requestedLevel = Number(params.get("level") || 1);

  const world = {
    w: canvas.width, h: canvas.height,
    pitch: { x: 70, y: 110, wTop: 700, wBottom: 860, h: 390 },
    goal: { x: 760, y: 110, w: 160, h: 140 },
  };

  function projectPitch(u, v) {
    const p = world.pitch;
    const y = p.y + p.h * (1 - v);
    const wAtV = p.wTop + (p.wBottom - p.wTop) * (1 - v);
    const xLeft = p.x + (p.wBottom - wAtV) * 0.5;
    return { x: xLeft + wAtV * u, y };
  }

  const state = {
    started: false,
    levelId: 1, attemptsTaken: 0, attemptsLimit: 0,
    curve: 0, kickPhase: "idle", kickT: 0,
    target: { x: 0, y: 0, r: 0 },
    wall: [],
    ball: { u: 0.22, v: 0.12, du: 0, dv: 0, r: 15, moving: false },
    aiming: false, aimStart: null, aimNow: null, pendingShot: null,
  };

  let IMG = null;

  function buildWall(L) {
    const arr = [];
    const spacing = 0.06;
    for (let i = 0; i < L.wall.count; i++) arr.push({ u: L.wall.x, v: L.wall.y + i * spacing, r: 13 });
    return arr;
  }

  function resetShot() {
    Object.assign(state.ball, { u: 0.22, v: 0.12, du: 0, dv: 0, moving: false });
    state.curve = 0;
    state.kickPhase = "idle";
    state.kickT = 0;
    hudCurve.textContent = "0.00";
  }

  function updateHUD() {
    hudLevel.textContent = String(state.levelId);
    hudAttempts.textContent = `${state.attemptsTaken}/${state.attemptsLimit}`;
    hudCurve.textContent = state.curve.toFixed(2);
  }

  function showToast(title, text, ms = 1100) {
    toastTitle.textContent = title;
    toastText.textContent = text;
    toast.hidden = false;
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => { toast.hidden = true; }, ms);
  }

  function loadLevelById(levelId) {
    const unlocked = getUnlockedLevel();
    levelId = clamp(levelId, 1, LEVELS.length);
    if (levelId > unlocked) levelId = unlocked;
    const L = LEVELS[levelId - 1] || LEVELS[0];

    state.levelId = L.id;
    state.attemptsTaken = 0;
    state.attemptsLimit = L.attempts;

    state.target.x = world.goal.x + world.goal.w * L.target.x;
    state.target.y = world.goal.y + world.goal.h * L.target.y;
    state.target.r = world.goal.h * L.target.r;

    state.wall = buildWall(L);
    resetShot();
    updateHUD();
  }

  // ---- Input helpers
  function getCanvasPos(evt) {
    const r = canvas.getBoundingClientRect();
    const t = evt.touches && evt.touches[0];
    const cx = t ? t.clientX : evt.clientX;
    const cy = t ? t.clientY : evt.clientY;
    return { x: (cx - r.left) * (canvas.width / r.width), y: (cy - r.top) * (canvas.height / r.height) };
  }
  const ballScreenPos = () => projectPitch(state.ball.u, state.ball.v);

  function pointerDown(evt) {
    if (!state.started) return;
    if (state.ball.moving || state.kickPhase !== "idle") return;

    const p = getCanvasPos(evt);
    const b = ballScreenPos();
    if (dist(p.x, p.y, b.x, b.y) <= state.ball.r * 2.8) {
      state.aiming = true;
      state.aimStart = { x: b.x, y: b.y };
      state.aimNow = p;
      evt.preventDefault?.();
    }
  }

  function pointerMove(evt) {
    if (!state.aiming) return;
    state.aimNow = getCanvasPos(evt);
    evt.preventDefault?.();
  }

  function pointerUp(evt) {
    if (!state.aiming) return;
    state.aiming = false;

    const end = state.aimNow || getCanvasPos(evt);
    const dx = state.aimStart.x - end.x;
    const dy = state.aimStart.y - end.y;

    const drag = Math.hypot(dx, dy);
    const power = clamp(drag / 260, 0, 1);

    const dirU = clamp(dx / 600, -0.22, 0.22);
    const dirV = clamp(dy / 420, -0.28, 0.28);

    state.kickPhase = "runup";
    state.kickT = 0;
    state.pendingShot = { power, dirU, dirV };

    state.attemptsTaken += 1;
    updateHUD();

    state.aimStart = null;
    state.aimNow = null;
  }

  // curve swipe while ball is moving
  let lastSwipeX = null;
  function swipeStart(evt) { if (!state.started || !state.ball.moving) return; lastSwipeX = getCanvasPos(evt).x; }
  function swipeMove(evt) {
    if (!state.started || !state.ball.moving) return;
    const x = getCanvasPos(evt).x;
    if (lastSwipeX == null) lastSwipeX = x;
    const dx = x - lastSwipeX;
    lastSwipeX = x;
    state.curve = clamp(state.curve + dx / 420, -1, 1);
    hudCurve.textContent = state.curve.toFixed(2);
  }
  function swipeEnd() { lastSwipeX = null; }

  canvas.addEventListener("mousedown", pointerDown);
  canvas.addEventListener("mousemove", pointerMove);
  canvas.addEventListener("mouseup", pointerUp);

  canvas.addEventListener("touchstart", (e) => { pointerDown(e); swipeStart(e); }, { passive: false });
  canvas.addEventListener("touchmove", (e) => { pointerMove(e); swipeMove(e); }, { passive: false });
  canvas.addEventListener("touchend", (e) => { pointerUp(e); swipeEnd(); }, { passive: false });

  // ---- Gameplay checks
  function collideBallWithWall() {
    const b = projectPitch(state.ball.u, state.ball.v);
    for (const m of state.wall) {
      const s = projectPitch(m.u, m.v);
      const r = 18 * (0.65 + m.v * 0.45);
      if (dist(b.x, b.y, s.x, s.y) <= r + 14) return true;
    }
    return false;
  }

  function inGoalBox() {
    const b = projectPitch(state.ball.u, state.ball.v);
    return b.x > world.goal.x && b.x < world.goal.x + world.goal.w && b.y > world.goal.y && b.y < world.goal.y + world.goal.h;
  }

  function reachedTarget() {
    const b = projectPitch(state.ball.u, state.ball.v);
    return dist(b.x, b.y, state.target.x, state.target.y) <= state.target.r;
  }

  function onMiss() {
    resetShot();
    if (state.attemptsTaken >= state.attemptsLimit) {
      showToast("OUT OF ATTEMPTS", "Restarting level…", 1100);
      window.setTimeout(() => loadLevelById(state.levelId), 900);
    }
  }

  function onLevelComplete() {
    if (state.levelId < LEVELS.length) {
      setUnlockedLevel(state.levelId + 1);
      showToast("LEVEL COMPLETE", "Loading next level…", 1100);
      window.setTimeout(() => loadLevelById(state.levelId + 1), 900);
    } else {
      // last level
      showToast("LAB COMPLETE", "Restarting from Level 1…", 1200);
      window.setTimeout(() => loadLevelById(1), 1000);
    }
  }

  // ---- Render (same premium side-angle feel, lightweight)
  function drawStadium() {
    const g = ctx.createLinearGradient(0, 0, 0, world.h);
    g.addColorStop(0, "rgba(8,10,14,1)");
    g.addColorStop(0.55, "rgba(6,7,9,1)");
    g.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, world.w, world.h);

    const band = ctx.createLinearGradient(0, 40, 0, 190);
    band.addColorStop(0, "rgba(255,205,90,0.07)");
    band.addColorStop(1, "rgba(255,205,90,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, 40, world.w, 160);
  }

  function drawPitch() {
    const p = world.pitch;
    const topLeft = { x: p.x + (p.wBottom - p.wTop) / 2, y: p.y };
    const topRight = { x: topLeft.x + p.wTop, y: p.y };
    const botLeft = { x: p.x, y: p.y + p.h };
    const botRight = { x: p.x + p.wBottom, y: p.y + p.h };

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(botRight.x, botRight.y);
    ctx.lineTo(botLeft.x, botLeft.y);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    grad.addColorStop(0, "rgba(30,60,44,1)");
    grad.addColorStop(1, "rgba(10,22,16,1)");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.clip();

    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
      const y = p.y + (p.h / 12) * i;
      ctx.fillRect(0, y, world.w, p.h / 12);
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,205,90,0.22)";
    ctx.stroke();

    ctx.restore();
  }

  function drawGoal() {
    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(255,205,90,.85)";
    ctx.shadowColor = "rgba(242,193,79,.35)";
    ctx.shadowBlur = 16;
    ctx.strokeRect(world.goal.x, world.goal.y, world.goal.w, world.goal.h);
    ctx.restore();
  }

  function glowCircle(x, y, r) {
    ctx.save();
    const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.6);
    g.addColorStop(0, "rgba(255,223,122,.85)");
    g.addColorStop(0.55, "rgba(242,193,79,.28)");
    g.addColorStop(1, "rgba(242,193,79,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTarget() {
    glowCircle(state.target.x, state.target.y, state.target.r);
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,223,122,.95)";
    ctx.beginPath();
    ctx.arc(state.target.x, state.target.y, state.target.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawWall() {
    ctx.save();
    for (const m of state.wall) {
      const s = projectPitch(m.u, m.v);
      const scale = 0.65 + m.v * 0.45;
      ctx.fillStyle = "rgba(255,255,255,.10)";
      ctx.strokeStyle = "rgba(255,205,90,.40)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, m.r * scale, m.r * 1.35 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer() {
    const b = projectPitch(state.ball.u, state.ball.v);
    const px = b.x - 120;
    const py = b.y - 235;
    const img = (state.kickPhase === "runup" || state.kickPhase === "strike") ? IMG.playerKick : IMG.playerIdle;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(px + 170, b.y + 18, 70, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    const wobble = (state.kickPhase === "runup") ? Math.sin(state.kickT * 10) * 2 : 0;
    ctx.drawImage(img, px, py + wobble, 260, 340);
    ctx.restore();
  }

  function drawBall() {
    const p = projectPitch(state.ball.u, state.ball.v);
    const shadowScale = 1.1 - state.ball.v * 0.55;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(p.x + 4, p.y + 16, 26 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    const size = 40 * (1.05 - state.ball.v * 0.55);
    ctx.drawImage(IMG.ball, p.x - size / 2, p.y - size / 2, size, size);

    if (state.ball.moving) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(255,205,90,0.28)";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - state.ball.du * 220, p.y + state.ball.dv * 220);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function drawAimLine() {
    if (!state.started || !state.aiming || !state.aimStart || !state.aimNow) return;
    const dx = state.aimStart.x - state.aimNow.x;
    const dy = state.aimStart.y - state.aimNow.y;
    const drag = Math.hypot(dx, dy);
    const power = clamp(drag / 260, 0, 1);

    ctx.save();
    ctx.lineWidth = 7;
    ctx.strokeStyle = `rgba(255,223,122,${0.25 + power * 0.65})`;
    ctx.shadowColor = "rgba(242,193,79,.55)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(state.aimStart.x, state.aimStart.y);
    ctx.lineTo(state.aimNow.x, state.aimNow.y);
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    drawStadium();
    drawPitch();
    drawGoal();
    drawTarget();
    drawWall();
    drawPlayer();
    drawBall();
    drawAimLine();
  }

  function step(dt) {
    if (!state.started) {
      render();
      return;
    }

    if (state.kickPhase === "runup") {
      state.kickT += dt;
      if (state.kickT > 0.35) { state.kickPhase = "strike"; state.kickT = 0; }
    } else if (state.kickPhase === "strike") {
      state.kickT += dt;
      if (state.kickT > 0.12) {
        const shot = state.pendingShot;
        state.pendingShot = null;

        state.ball.dv = 0.52 + shot.power * 0.70;
        state.ball.du = (shot.dirU * 0.9) + 0.08;
        state.ball.moving = true;

        state.kickPhase = "flight";
        state.kickT = 0;
      }
    }

    if (state.ball.moving) {
      state.ball.du += state.curve * 0.0028;
      state.ball.u += state.ball.du * dt;
      state.ball.v += state.ball.dv * dt;

      state.ball.du *= (1 - 0.22 * dt);
      state.ball.dv *= (1 - 0.10 * dt);
      state.ball.dv -= 0.06 * dt;

      if (collideBallWithWall()) {
        state.ball.moving = false;
        onMiss();
      } else if (inGoalBox() && reachedTarget()) {
        state.ball.moving = false;
        onLevelComplete();
      } else if (state.ball.v > 1.15 || state.ball.u < -0.2 || state.ball.u > 1.2) {
        state.ball.moving = false;
        onMiss();
      }
    }

    render();
  }

  let last = performance.now();
  function loop(now) {
    const dt = clamp((now - last) / 1000, 0, 0.033);
    last = now;
    if (!document.hidden) step(dt);
    requestAnimationFrame(loop);
  }

  function openStart() {
    state.started = false;
    document.body.classList.add("start-open");
    startOverlay.style.display = "grid";
  }

  function closeStart() {
    state.started = true;
    document.body.classList.remove("start-open");
    startOverlay.style.display = "none";
  }

  startBtn.addEventListener("click", () => {
    closeStart();
    // quick "ready" toast so it feels premium
    showToast("READY", "Good luck.", 800);
  });

  async function boot() {
    try {
      const [playerIdle, playerKick, ball] = await Promise.all([
        loadImage(ASSETS.playerIdle),
        loadImage(ASSETS.playerKick),
        loadImage(ASSETS.ball),
      ]);
      IMG = { playerIdle, playerKick, ball };

      const unlocked = getUnlockedLevel();
      const start = clamp(requestedLevel || 1, 1, LEVELS.length);
      loadLevelById(start > unlocked ? unlocked : start);

      openStart();
      render();
      requestAnimationFrame(loop);
    } catch (e) {
      ctx.fillStyle = "#0b0d10";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,223,122,.95)";
      ctx.font = "18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("Asset load failed. Check /assets/freekicks/ files.", 40, 70);
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.fillText(String(e), 40, 100);
    }
  }

  boot();
})();