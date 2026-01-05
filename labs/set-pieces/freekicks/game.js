// Football Lab - Free Kicks (Premium)
// Canvas-only, no external assets. Inspired by "magical-kicks" style gameplay.
// Features: aiming line + power, goalkeeper AI, target ring, wall, curve swipe, net hit feedback, light SFX.

(() => {
  "use strict";

  // -------- DOM --------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: true });

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
  const hintBanner = document.getElementById("hintBanner");

  // Prevent overlay clicks bubbling into the canvas
  if (overlayCard) {
    overlayCard.addEventListener("pointerdown", (e) => e.stopPropagation(), true);
    overlayCard.addEventListener("pointerup", (e) => e.stopPropagation(), true);
    overlayCard.addEventListener("click", (e) => e.stopPropagation(), true);
    overlayCard.addEventListener("touchstart", (e) => e.stopPropagation(), { capture: true, passive: false });
    overlayCard.addEventListener("touchend", (e) => e.stopPropagation(), { capture: true, passive: false });
  }

  function hideOverlay() {
    overlay.hidden = true;
    overlay.style.display = "none";
  }

  function showOverlay(title, text, canNext) {
    overlay.hidden = false;
    overlay.style.display = "flex";
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayNextLink.style.display = canNext ? "inline-flex" : "none";
    overlayRetryLink.style.display = "inline-flex";
  }

  function navTo(href) {
    // cache-bust to avoid GitHub Pages stale loads
    const u = new URL(href, location.href);
    u.searchParams.set("_", String(Date.now()));
    location.href = u.toString();
  }

  function bindNav(el) {
    if (!el) return;
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navTo(el.getAttribute("href"));
    }, true);
    el.addEventListener("touchend", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navTo(el.getAttribute("href"));
    }, { capture: true, passive: false });
  }

  bindNav(overlayNextLink);
  bindNav(overlayRetryLink);

  // -------- Audio (tiny SFX) --------
  let audioCtx = null;
  function beep(freq = 220, dur = 0.06, type = "sine", gain = 0.12) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }
  function thump() { beep(110, 0.07, "sine", 0.18); }
  function ping() { beep(650, 0.05, "triangle", 0.10); }
  function net()  { beep(320, 0.08, "square", 0.06); beep(240, 0.10, "square", 0.05); }

  // -------- World + Levels --------
  const STORAGE_KEY = "fl_freekicks_premium_v1";

  const LEVELS = [
    { id: 1, wall: 0, keeper: 0.85, target: 0.7 },
    { id: 2, wall: 3, keeper: 0.92, target: 0.75 },
    { id: 3, wall: 4, keeper: 0.98, target: 0.78 },
    { id: 4, wall: 5, keeper: 1.05, target: 0.80 },
    { id: 5, wall: 5, keeper: 1.12, target: 0.82 },
  ];

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { unlocked: 1 };
      const obj = JSON.parse(raw);
      return { unlocked: Math.max(1, Math.min(LEVELS.length, obj.unlocked || 1)) };
    } catch {
      return { unlocked: 1 };
    }
  }
  function saveProgress(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
  }

  const progress = loadProgress();

  // Parse level from query
  const params = new URLSearchParams(location.search);
  const startLevel = Math.max(1, Math.min(LEVELS.length, parseInt(params.get("level") || "1", 10) || 1));

  let currentLevel = Math.min(startLevel, progress.unlocked);

  // -------- Canvas Sizing --------
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);

  // -------- Game State --------
  const state = {
    mode: "aim", // "aim" | "fly" | "done"
    attempts: 0,
    curve: 0, // -1..1 indicator
    drag: { active: false, x0: 0, y0: 0, x: 0, y: 0 },
    swipe: { active: false, lastX: 0 },
    particles: [],
  };

  // World coordinates in screen space (we'll treat canvas as screen, but keep consistent with aspect)
  const world = {
    w: 1000,
    h: 562.5, // 16:9
  };

  // Entities
  const ball = {
    x: 260, y: 430,
    r: 16,
    vx: 0, vy: 0,
    spin: 0, // -1..1, curve strength
    flying: false,
  };

  const goal = {
    x: 250, y: 70,
    w: 500, h: 170,
    depth: 18,
    post: 10,
  };

  const keeper = {
    x: goal.x + goal.w/2,
    y: goal.y + goal.h - 28,
    w: 86,
    h: 34,
    speed: 520, // px/s, scaled by level
    react: 0.14,
    targetX: goal.x + goal.w/2,
    diving: 0, // 0..1
  };

  const wall = {
    count: 0,
    x: goal.x + goal.w/2,
    y: 270,
    gap: 0,
  };

  const target = {
    x: goal.x + goal.w*0.75,
    y: goal.y + goal.h*0.33,
    r: 18,
    pulse: 0,
  };

  function rand(min, max){ return min + Math.random()*(max-min); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function setLevel(id) {
    const L = LEVELS.find(l => l.id === id) || LEVELS[0];
    currentLevel = L.id;

    // ball reset
    ball.x = 260;
    ball.y = 430;
    ball.vx = 0;
    ball.vy = 0;
    ball.spin = 0;
    ball.flying = false;

    state.mode = "aim";
    state.drag.active = false;
    state.swipe.active = false;
    state.curve = 0;

    // keeper
    keeper.x = goal.x + goal.w/2;
    keeper.targetX = keeper.x;
    keeper.diving = 0;
    keeper.speed = 520 * L.keeper;

    // wall
    wall.count = L.wall;
    wall.x = goal.x + goal.w/2;
    wall.y = 270;
    wall.gap = rand(-70, 70);

    // target
    target.x = clamp(goal.x + goal.w*rand(0.18, 0.82), goal.x+35, goal.x+goal.w-35);
    target.y = clamp(goal.y + goal.h*rand(0.20, 0.62), goal.y+30, goal.y+goal.h-55);
    target.r = 18 + L.target * 6;

    updateHUD();
    hideOverlay();
  }

  function updateHUD() {
    if (hudLevel) hudLevel.textContent = String(currentLevel);
    if (hudAttempts) hudAttempts.textContent = String(state.attempts);
    if (hudCurve) hudCurve.textContent = String(Math.round(state.curve * 100));
  }

  // -------- Level Select UI --------
  function renderLevels() {
    if (!levelsGrid) return;
    levelsGrid.innerHTML = "";
    for (const L of LEVELS) {
      const btn = document.createElement("button");
      btn.className = "level-chip";
      const locked = L.id > progress.unlocked;
      btn.disabled = locked;
      btn.textContent = locked ? `🔒 ${L.id}` : `Level ${L.id}`;
      btn.addEventListener("click", () => {
        navTo(`./index.html?level=${L.id}`);
      });
      levelsGrid.appendChild(btn);
    }
  }

  // -------- Coordinate helpers --------
  function screenToWorld(px, py) {
    const rect = canvas.getBoundingClientRect();
    // normalize to [0,1] then to world
    const nx = (px - rect.left) / rect.width;
    const ny = (py - rect.top) / rect.height;
    return { x: nx * world.w, y: ny * world.h };
  }

  function worldToScreen(x, y) {
    const rect = canvas.getBoundingClientRect();
    return { x: (x / world.w) * rect.width, y: (y / world.h) * rect.height };
  }

  // -------- Input --------
  function pointerDown(e) {
    if (state.mode === "done") return;

    // fade hint on first interaction
    if (hintBanner && !hintBanner.classList.contains("is-hidden")) {
      hintBanner.classList.add("is-hidden");
      setTimeout(() => { if (hintBanner) hintBanner.style.display = "none"; }, 450);
    }

    const p = screenToWorld(e.clientX, e.clientY);

    if (state.mode === "aim") {
      const dx = p.x - ball.x, dy = p.y - ball.y;
      if (Math.hypot(dx, dy) <= ball.r * 2.2) {
        state.drag.active = true;
        state.drag.x0 = ball.x;
        state.drag.y0 = ball.y;
        state.drag.x = p.x;
        state.drag.y = p.y;
        canvas.setPointerCapture?.(e.pointerId);
      }
    } else if (state.mode === "fly") {
      state.swipe.active = true;
      state.swipe.lastX = p.x;
      canvas.setPointerCapture?.(e.pointerId);
    }
  }

  function pointerMove(e) {
    const p = screenToWorld(e.clientX, e.clientY);

    if (state.mode === "aim" && state.drag.active) {
      state.drag.x = p.x;
      state.drag.y = p.y;
    }

    if (state.mode === "fly" && state.swipe.active) {
      const dx = p.x - state.swipe.lastX;
      state.swipe.lastX = p.x;
      // convert swipe delta to spin
      ball.spin = clamp(ball.spin + (dx / 240), -1.2, 1.2);
      state.curve = clamp(ball.spin / 1.2, -1, 1);
      updateHUD();
    }
  }

  function pointerUp(e) {
    if (state.mode === "aim" && state.drag.active) {
      state.drag.active = false;

      // launch based on drag vector (from ball outward, we invert)
      const dx = ball.x - state.drag.x;
      const dy = ball.y - state.drag.y;

      const dist = Math.hypot(dx, dy);
      if (dist < 10) return;

      const maxPower = 980; // px/s
      const power = clamp(dist * 2.3, 240, maxPower);
      const nx = dx / dist, ny = dy / dist;

      ball.vx = nx * power;
      ball.vy = ny * power;
      ball.flying = true;
      state.mode = "fly";
      state.attempts += 1;
      updateHUD();
      thump();
    }

    if (state.mode === "fly") {
      state.swipe.active = false;
    }
  }

  canvas.addEventListener("pointerdown", pointerDown, { passive: true });
  canvas.addEventListener("pointermove", pointerMove, { passive: true });
  canvas.addEventListener("pointerup", pointerUp, { passive: true });
  canvas.addEventListener("pointercancel", pointerUp, { passive: true });

  // -------- Particles --------
  function spawnParticles(x, y, n = 18, spread = 1.0) {
    for (let i=0;i<n;i++){
      state.particles.push({
        x, y,
        vx: rand(-220,220) * spread,
        vy: rand(-240,120) * spread,
        life: rand(0.35, 0.70),
        t: 0,
      });
    }
  }

  // -------- Physics --------
  function circleRectHit(cx, cy, cr, rx, ry, rw, rh) {
    const px = clamp(cx, rx, rx+rw);
    const py = clamp(cy, ry, ry+rh);
    const dx = cx - px, dy = cy - py;
    return (dx*dx + dy*dy) <= cr*cr;
  }

  function resetAfter(result) {
    ball.flying = false;
    state.mode = "done";

    if (result === "goal") {
      showOverlay("GOAL!", "Clean finish. Ready for the next one?", currentLevel < LEVELS.length);
      net();
      spawnParticles(target.x, target.y, 26, 1.2);

      if (currentLevel >= progress.unlocked && progress.unlocked < LEVELS.length) {
        progress.unlocked = currentLevel + 1;
        saveProgress(progress);
        renderLevels();
      }
      overlayNextLink.href = `./index.html?level=${Math.min(LEVELS.length, currentLevel + 1)}`;
    } else if (result === "saved") {
      showOverlay("SAVED!", "Keeper got a hand to it. Try again.", false);
      ping();
    } else {
      showOverlay("MISS!", "Unlucky. Adjust your aim and power.", false);
      ping();
    }

    overlayRetryLink.href = `./index.html?level=${currentLevel}`;
  }

  function stepPhysics(dt) {
    // Particles
    for (let i=state.particles.length-1; i>=0; i--){
      const p = state.particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 460 * dt;
      if (p.t >= p.life) state.particles.splice(i,1);
    }

    if (!ball.flying) return;

    // Curve (side force)
    const curveForce = ball.spin * 520; // px/s^2
    ball.vx += curveForce * dt;

    // Air drag + gravity
    ball.vx *= (1 - 0.10 * dt);
    ball.vy *= (1 - 0.10 * dt);
    ball.vy += 580 * dt;

    // Move
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Keeper AI: track predicted x near goal line
    const L = LEVELS[currentLevel-1] || LEVELS[0];
    if (ball.y < 260 && ball.vy < 0) {
      // if ball going upwards, don't overreact
    }
    const predictY = keeper.y;
    const t = (predictY - ball.y) / (ball.vy || 1e-6); // time to reach keeper y
    let predictedX = ball.x + ball.vx * clamp(t, 0, 0.9);
    predictedX = clamp(predictedX, goal.x + keeper.w/2 + 8, goal.x + goal.w - keeper.w/2 - 8);

    // Smooth reaction
    keeper.targetX = keeper.targetX + (predictedX - keeper.targetX) * keeper.react;

    // Move keeper toward target
    const dir = Math.sign(keeper.targetX - keeper.x);
    keeper.x += dir * keeper.speed * dt;
    if (Math.abs(keeper.targetX - keeper.x) < 6) keeper.x = keeper.targetX;

    // Keep within posts
    keeper.x = clamp(keeper.x, goal.x + keeper.w/2 + 8, goal.x + goal.w - keeper.w/2 - 8);

    // Collision with keeper
    const krx = keeper.x - keeper.w/2, kry = keeper.y - keeper.h/2;
    if (circleRectHit(ball.x, ball.y, ball.r, krx, kry, keeper.w, keeper.h)) {
      resetAfter("saved");
      return;
    }

    // Wall collision (simple circles)
    if (wall.count > 0) {
      for (let i=0;i<wall.count;i++){
        const px = wall.x + wall.gap + (i - (wall.count-1)/2) * 0; // vertical wall
        const py = wall.y + i * 28;
        const pr = 14;
        const dx = ball.x - px, dy = ball.y - py;
        if ((dx*dx + dy*dy) <= (ball.r + pr)*(ball.r + pr) && ball.y < ball.y + 999) {
          // deflect
          const d = Math.max(1e-6, Math.hypot(dx, dy));
          const nx = dx / d, ny = dy / d;
          const dot = ball.vx*nx + ball.vy*ny;
          ball.vx = ball.vx - 1.8*dot*nx;
          ball.vy = ball.vy - 1.8*dot*ny;
          ball.spin *= 0.65;
          ping();
          spawnParticles(ball.x, ball.y, 10, 0.9);
          break;
        }
      }
    }

    // Goal detection: when ball crosses goal mouth area (near goal plane)
    const goalLineY = goal.y + goal.h - 10;
    const insidePosts = (ball.x > goal.x + goal.post + ball.r) && (ball.x < goal.x + goal.w - goal.post - ball.r);
    const withinMouth = (ball.y < goalLineY) && (ball.y > goal.y - 40);

    // Hit posts/crossbar
    const leftPostX = goal.x + goal.post;
    const rightPostX = goal.x + goal.w - goal.post;
    const barY = goal.y + goal.post;

    // posts as vertical lines -> approximate circles at corners + bar
    if (ball.y < goal.y + goal.h && ball.y > goal.y - 10) {
      // Left post
      if (Math.abs(ball.x - leftPostX) < goal.post && ball.y < goalLineY && ball.y > goal.y + 10) {
        ball.vx *= -0.7;
        ping();
      }
      // Right post
      if (Math.abs(ball.x - rightPostX) < goal.post && ball.y < goalLineY && ball.y > goal.y + 10) {
        ball.vx *= -0.7;
        ping();
      }
      // Crossbar
      if (Math.abs(ball.y - barY) < goal.post && ball.x > leftPostX && ball.x < rightPostX) {
        ball.vy *= -0.7;
        ping();
      }
    }

    // Score if ball goes behind goal plane
    if (ball.y < goal.y + goal.post + 6 && insidePosts) {
      // bonus if hits target
      const hitTarget = Math.hypot(ball.x - target.x, ball.y - target.y) < (target.r + ball.r);
      resetAfter("goal");
      if (hitTarget) beep(820, 0.06, "triangle", 0.08);
      return;
    }

    // Miss out of bounds
    if (ball.y > world.h + 80 || ball.x < -120 || ball.x > world.w + 120) {
      resetAfter("miss");
      return;
    }
  }

  // -------- Rendering --------
  function drawPitch() {
    // Background vignette
    const g = ctx.createRadialGradient(world.w*0.5, world.h*0.65, 120, world.w*0.5, world.h*0.6, world.w*0.8);
    g.addColorStop(0, "rgba(255,210,120,0.10)");
    g.addColorStop(0.45, "rgba(0,0,0,0.50)");
    g.addColorStop(1, "rgba(0,0,0,0.92)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,world.w,world.h);

    // subtle stripes
    ctx.globalAlpha = 0.20;
    for (let i=0;i<9;i++){
      ctx.fillStyle = i%2===0 ? "rgba(255,215,130,0.06)" : "rgba(255,215,130,0.02)";
      ctx.fillRect(0, i*(world.h/9), world.w, world.h/9);
    }
    ctx.globalAlpha = 1;
  }

  function drawGoal() {
    // Glow frame
    ctx.save();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(255,215,130,0.60)";
    ctx.shadowColor = "rgba(255,215,130,0.55)";
    ctx.shadowBlur = 26;
    ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);
    ctx.restore();

    // Net (simple grid)
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "rgba(255,215,130,0.55)";
    ctx.lineWidth = 1;
    for (let x=goal.x+14; x<goal.x+goal.w-14; x+=22){
      ctx.beginPath(); ctx.moveTo(x, goal.y+8); ctx.lineTo(x, goal.y+goal.h-8); ctx.stroke();
    }
    for (let y=goal.y+14; y<goal.y+goal.h-14; y+=22){
      ctx.beginPath(); ctx.moveTo(goal.x+8, y); ctx.lineTo(goal.x+goal.w-8, y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawTarget() {
    target.pulse += 0.02;
    const pr = target.r + Math.sin(target.pulse)*2;

    ctx.save();
    ctx.translate(target.x, target.y);
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = "rgba(255,215,130,0.92)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(255,215,130,0.55)";
    ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(0,0,pr,0,Math.PI*2); ctx.stroke();

    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0,0,pr*0.62,0,Math.PI*2); ctx.stroke();

    ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.moveTo(-pr*0.9,0); ctx.lineTo(pr*0.9,0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-pr*0.9); ctx.lineTo(0,pr*0.9); ctx.stroke();
    ctx.restore();
  }

  function drawWall() {
    if (wall.count <= 0) return;
    for (let i=0;i<wall.count;i++){
      const x = wall.x + wall.gap;
      const y = wall.y + i*28;

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "rgba(255,215,130,0.08)";
      ctx.strokeStyle = "rgba(255,215,130,0.35)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawKeeper() {
    const x = keeper.x;
    const y = keeper.y;

    // Body
    ctx.save();
    ctx.translate(x, y);

    // shadow
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(0, 18, 42, 12, 0, 0, Math.PI*2);
    ctx.fill();

    // torso
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "rgba(20,20,20,0.95)";
    ctx.strokeStyle = "rgba(255,215,130,0.22)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255,215,130,0.18)";
    ctx.shadowBlur = 10;

    const w = keeper.w, h = keeper.h;
    roundRect(ctx, -w/2, -h/2, w, h, 14);
    ctx.fill();
    ctx.stroke();

    // head
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(240,220,180,0.92)";
    ctx.beginPath();
    ctx.arc(0, -h/2 - 16, 12, 0, Math.PI*2);
    ctx.fill();

    // gloves
    ctx.fillStyle = "rgba(255,215,130,0.65)";
    ctx.beginPath(); ctx.arc(-w/2 - 10, -2, 8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w/2 + 10, -2, 8, 0, Math.PI*2); ctx.fill();

    ctx.restore();
  }

  function roundRect(c, x, y, w, h, r){
    const rr = Math.min(r, w/2, h/2);
    c.beginPath();
    c.moveTo(x+rr, y);
    c.arcTo(x+w, y, x+w, y+h, rr);
    c.arcTo(x+w, y+h, x, y+h, rr);
    c.arcTo(x, y+h, x, y, rr);
    c.arcTo(x, y, x+w, y, rr);
    c.closePath();
  }

  function drawBall() {
    ctx.save();
    ctx.translate(ball.x, ball.y);

    // glow
    ctx.shadowColor = "rgba(255,215,130,0.55)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "rgba(255,215,130,0.18)";
    ctx.beginPath();
    ctx.arc(0,0,ball.r+4,0,Math.PI*2);
    ctx.fill();

    // ball
    ctx.shadowBlur = 0;
    const grad = ctx.createRadialGradient(-6, -8, 4, 0, 0, ball.r);
    grad.addColorStop(0, "rgba(255,245,210,0.98)");
    grad.addColorStop(0.55, "rgba(255,220,140,0.92)");
    grad.addColorStop(1, "rgba(120,90,30,0.85)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0,0,ball.r,0,Math.PI*2);
    ctx.fill();

    // seams
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0,0,ball.r*0.75, -0.3, Math.PI*1.2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  function drawAimUI() {
    if (!state.drag.active) return;

    const dx = ball.x - state.drag.x;
    const dy = ball.y - state.drag.y;
    const dist = Math.hypot(dx, dy);

    // clamp
    const clamped = clamp(dist, 0, 420);
    const nx = dx / (dist || 1), ny = dy / (dist || 1);

    const ax = ball.x + nx * clamped;
    const ay = ball.y + ny * clamped;

    // aim line
    ctx.save();
    ctx.strokeStyle = "rgba(255,215,130,0.85)";
    ctx.lineWidth = 4;
    ctx.shadowColor = "rgba(255,215,130,0.45)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    // power pips
    const p = clamp(clamped / 420, 0, 1);
    const pipCount = 10;
    ctx.shadowBlur = 0;
    for (let i=0;i<pipCount;i++){
      const t = (i+1)/pipCount;
      const px = ball.x + nx * clamped * t;
      const py = ball.y + ny * clamped * t;
      ctx.globalAlpha = (t <= p) ? 0.95 : 0.18;
      ctx.fillStyle = "rgba(255,215,130,0.92)";
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // predicted curve indicator
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "600 14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(`Power ${Math.round(p*100)}%`, ball.x + 18, ball.y - 22);

    ctx.restore();
  }

  function drawParticles() {
    for (const p of state.particles){
      const a = 1 - (p.t / p.life);
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(255,215,130,0.9)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.clearRect(0, 0, world.w, world.h);

    drawPitch();
    drawGoal();
    drawTarget();
    drawWall();
    drawKeeper();
    drawAimUI();
    drawBall();
    drawParticles();
  }

  // -------- Main loop with fixed dt --------
  let last = performance.now();
  let acc = 0;
  const FIXED = 1/120;

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= FIXED) {
      stepPhysics(FIXED);
      acc -= FIXED;
    }
    render();
    requestAnimationFrame(frame);
  }

  // -------- Boot --------
  function boot() {
    // We draw in a fixed world size and scale via CSS aspect ratio.
    // Make canvas match CSS size.
    resize();

    // Ensure overlay is hidden on load (auto-start)
    hideOverlay();

    // Build level select
    renderLevels();

    // Activate level
    setLevel(currentLevel);

    // Update overlay links
    overlayNextLink.href = `./index.html?level=${Math.min(LEVELS.length, currentLevel + 1)}`;
    overlayRetryLink.href = `./index.html?level=${currentLevel}`;

    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
