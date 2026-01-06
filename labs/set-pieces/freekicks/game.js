// Football Lab • Free Kicks (Playable) — FIX: player stays put while ball moves
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hint = document.getElementById("hint");

  const ASSETS = {
    player: "../../../assets/freekicks/player_idle.svg",
    ball: "../../../assets/freekicks/ball.svg",
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  const loadImg = (src) => new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Failed to load: " + src));
    // keep cache-bust to avoid old assets sticking
    i.src = src + (src.includes("?") ? "" : "?v=" + Date.now());
  });

  const state = {
    pitch: { x: 80, y: 80, wTop: 720, wBottom: 880, h: 420 },

    // Fixed kick spot (player anchored here)
    kickSpot: { u: 0.34, v: 0.18 },

    // Ball moves independently
    ball: { u: 0.34, v: 0.18, du: 0, dv: 0, moving: false, r: 18 },

    aim: { active: false, start: null, now: null },
  };

  let IMG = { player: null, ball: null };

  function project(u, v) {
    const p = state.pitch;
    const y = p.y + p.h * (1 - v);
    const wAtV = p.wTop + (p.wBottom - p.wTop) * (1 - v);
    const xLeft = p.x + (p.wBottom - wAtV) * 0.5;
    return { x: xLeft + wAtV * u, y };
  }

  function getPointerPos(evt) {
    const r = canvas.getBoundingClientRect();
    const pt = evt.touches && evt.touches[0] ? evt.touches[0] : evt;
    return {
      x: (pt.clientX - r.left) * (canvas.width / r.width),
      y: (pt.clientY - r.top) * (canvas.height / r.height),
    };
  }

  function resetBall() {
    state.ball.u = state.kickSpot.u;
    state.ball.v = state.kickSpot.v;
    state.ball.du = 0;
    state.ball.dv = 0;
    state.ball.moving = false;
    state.aim.active = false;
    state.aim.start = null;
    state.aim.now = null;
  }

  // --- INPUT
  function onDown(evt) {
    if (state.ball.moving) return;

    const p = getPointerPos(evt);
    const b = project(state.ball.u, state.ball.v);

    // Smaller hit radius so you MUST start on the ball (prevents "dragging the player")
    const hit = dist(p.x, p.y, b.x, b.y) <= state.ball.r * 2.6;

    if (hit) {
      state.aim.active = true;
      state.aim.start = { x: b.x, y: b.y };
      state.aim.now = p;
      if (hint) hint.style.opacity = "0";
      evt.preventDefault?.();
    }
  }

  function onMove(evt) {
    if (!state.aim.active) return;
    state.aim.now = getPointerPos(evt);
    evt.preventDefault?.();
  }

  function onUp(evt) {
    if (!state.aim.active) return;
    state.aim.active = false;

    const end = state.aim.now || getPointerPos(evt);
    const dx = state.aim.start.x - end.x;
    const dy = state.aim.start.y - end.y;

    const drag = Math.hypot(dx, dy);
    const power = clamp(drag / 260, 0, 1);

    const aimU = clamp(dx / 650, -0.35, 0.35);
    const aimV = clamp(dy / 520, -0.45, 0.45);

    state.ball.du = 0.18 + power * 0.70 + aimU * 0.65;
    state.ball.dv = 0.45 + power * 0.95 + aimV * 0.25;

    state.ball.moving = true;

    state.aim.start = null;
    state.aim.now = null;
    evt.preventDefault?.();
  }

  canvas.addEventListener("mousedown", onDown);
  canvas.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);

  canvas.addEventListener("touchstart", onDown, { passive: false });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  canvas.addEventListener("touchend", onUp, { passive: false });

  // --- RENDER
  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#050608");
    g.addColorStop(0.6, "#060708");
    g.addColorStop(1, "#000000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const band = ctx.createLinearGradient(0, 30, 0, 220);
    band.addColorStop(0, "rgba(255,205,90,0.07)");
    band.addColorStop(1, "rgba(255,205,90,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, canvas.width, 240);
  }

  function drawPitch() {
    const p = state.pitch;
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
    grad.addColorStop(0, "rgba(22,46,34,1)");
    grad.addColorStop(1, "rgba(9,18,13,1)");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.clip();

    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.035)";
      const y = p.y + (p.h / 12) * i;
      ctx.fillRect(0, y, canvas.width, p.h / 12);
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,205,90,0.20)";
    ctx.stroke();
    ctx.restore();
  }

  function drawGoal() {
    const gx = 775, gy = 115, gw = 150, gh = 135;
    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(255,205,90,0.75)";
    ctx.shadowColor = "rgba(242,193,79,0.35)";
    ctx.shadowBlur = 16;
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.restore();
  }

  function drawPlayer() {
    // Player anchored to kick spot, NOT the moving ball
    const k = project(state.kickSpot.u, state.kickSpot.v);
    const px = k.x - 170;
    const py = k.y - 300;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(px + 190, k.y + 18, 80, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.drawImage(IMG.player, px, py, 280, 360);
  }

  function drawBall() {
    const p = project(state.ball.u, state.ball.v);
    const size = 40 * (1.05 - state.ball.v * 0.55);

    const shadowScale = 1.08 - state.ball.v * 0.6;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(p.x + 4, p.y + 16, 26 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.drawImage(IMG.ball, p.x - size / 2, p.y - size / 2, size, size);
  }

  function drawAim() {
    if (!state.aim.active || !state.aim.start || !state.aim.now) return;

    const dx = state.aim.start.x - state.aim.now.x;
    const dy = state.aim.start.y - state.aim.now.y;
    const drag = Math.hypot(dx, dy);
    const power = clamp(drag / 260, 0, 1);

    ctx.save();
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(255,223,122,${0.25 + power * 0.65})`;
    ctx.shadowColor = "rgba(242,193,79,0.6)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(state.aim.start.x, state.aim.start.y);
    ctx.lineTo(state.aim.now.x, state.aim.now.y);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,223,122,${0.25 + power * 0.75})`;
    ctx.beginPath();
    ctx.arc(state.aim.now.x, state.aim.now.y, 6 + power * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function update(dt) {
    if (!state.ball.moving) return;

    state.ball.u += state.ball.du * dt;
    state.ball.v += state.ball.dv * dt;

    state.ball.du *= (1 - 0.30 * dt);
    state.ball.dv *= (1 - 0.14 * dt);
    state.ball.dv -= 0.09 * dt;

    if (state.ball.v < 0.12) state.ball.v = 0.12;

    if (state.ball.v > 1.15 || state.ball.u < -0.2 || state.ball.u > 1.2) {
      resetBall();
      if (hint) hint.style.opacity = "1";
    }
  }

  function render() {
    drawBackground();
    drawPitch();
    drawGoal();
    drawPlayer();
    drawBall();
    drawAim();
  }

  let last = performance.now();
  function loop(now) {
    const dt = clamp((now - last) / 1000, 0, 0.033);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  async function boot() {
    try {
      const [player, ball] = await Promise.all([loadImg(ASSETS.player), loadImg(ASSETS.ball)]);
      IMG.player = player;
      IMG.ball = ball;
      resetBall();
      requestAnimationFrame(loop);
    } catch (e) {
      ctx.fillStyle = "#0b0d10";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,223,122,.95)";
      ctx.font = "18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("Asset load failed. Check /assets/freekicks/ files.", 40, 70);
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.fillText(String(e), 40, 100);
      console.error(e);
    }
  }

  boot();
})();