/* Football Lab – Isometric Free Kicks
   Matches your freekicks/index.html IDs:
   #game, #scoreVal, #streakVal, #windVal, #windArrow, #hintText,
   #btnCurl, #btnDip, #btnKnuckle, #btnReset, #btnNewWind, #btnExit
*/
(() => {
  "use strict";

  console.log("[Freekicks] game.js loaded ✅");

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  // HUD refs (must exist, your index.html has them)
  const scoreEl = document.getElementById("scoreVal");
  const streakEl = document.getElementById("streakVal");
  const windEl = document.getElementById("windVal");
  const windArrow = document.getElementById("windArrow");
  const hintEl = document.getElementById("hintText");

  const btnCurl = document.getElementById("btnCurl");
  const btnDip = document.getElementById("btnDip");
  const btnKnuckle = document.getElementById("btnKnuckle");
  const btnReset = document.getElementById("btnReset");
  const btnNewWind = document.getElementById("btnNewWind");
  const btnExit = document.getElementById("btnExit");

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);

  // These are “screen anchors” tuned for your pitch placeholder.
  // If you later use a different pitch image, we can tweak these.
  const ANCHOR = {
    ball: { x: 280, y: 610 },
    goalCenter: { x: 1420, y: 280 },
    goalW: 360,
    goalH: 170,
    wallY: 470,
    wallX0: 980,
    wallSpacing: 34
  };

  const STATE = {
    score: 0,
    streak: 0,
    t: 0,
    dt: 1 / 60,
    aiming: false,
    curl: false,
    dip: false,
    knuckle: false,
    wind: { ax: 0, deg: 0, label: "—" },
    aim: { x: 0, y: 0, power: 0 },
    last: "Drag from the ball to aim & power. Release to shoot."
  };

  const ball = {
    x: ANCHOR.ball.x,
    y: ANCHOR.ball.y,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    live: false
  };

  const wall = { n: 5, xs: [] };

  const keeper = {
    x: ANCHOR.goalCenter.x,
    y: ANCHOR.goalCenter.y + 55,
    targetX: ANCHOR.goalCenter.x,
    skill: 0.72
  };

  function resetWall() {
    wall.xs = [];
    const start = ANCHOR.wallX0 - (wall.n - 1) * ANCHOR.wallSpacing * 0.5;
    for (let i = 0; i < wall.n; i++) wall.xs.push(start + i * ANCHOR.wallSpacing);
  }

  function resetShot() {
    ball.x = ANCHOR.ball.x;
    ball.y = ANCHOR.ball.y;
    ball.z = 0;
    ball.vx = ball.vy = ball.vz = 0;
    ball.live = false;

    keeper.x = ANCHOR.goalCenter.x;
    keeper.targetX = keeper.x;

    STATE.aiming = false;
    STATE.last = "Drag from the ball to aim & power. Release to shoot.";
    hintEl.textContent = STATE.last;
  }

  function setWind() {
    const ax = rand(-0.11, 0.11);
    const deg = ax * 260;
    const dir = ax < -0.015 ? "←" : ax > 0.015 ? "→" : "•";
    const strength = Math.round(Math.abs(ax) * 100);
    STATE.wind = { ax, deg, label: `${dir} ${strength}` };
    windEl.textContent = STATE.wind.label;
    windArrow.style.transform = `rotate(${deg}deg)`;
  }

  // HiDPI canvas sizing
  function fitCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2.25, window.devicePixelRatio || 1));
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    // Work in CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", fitCanvas);

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
  }

  // Draw helpers
  function drawBall() {
    const sx = ball.x;
    const sy = ball.y - ball.z;

    // shadow
    ctx.save();
    ctx.globalAlpha = 0.33;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + 7, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ball
    ctx.save();
    ctx.fillStyle = "rgba(245,248,255,0.96)";
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawAim() {
    if (!STATE.aiming) return;

    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,208,64,0.88)";
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y - ball.z);
    ctx.lineTo(STATE.aim.x, STATE.aim.y);
    ctx.stroke();

    // Power bar bottom-left
    const p = STATE.aim.power;
    const barW = 160, barH = 12;
    const x = 22, y = (canvas.getBoundingClientRect().height - 98);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    roundRect(x, y, barW, barH, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(255,208,64,0.85)";
    roundRect(x, y, barW * p, barH, 6);
    ctx.fill();
    ctx.restore();
  }

  function drawWall() {
    ctx.save();
    for (const x of wall.xs) {
      const y = ANCHOR.wallY;

      // body
      ctx.fillStyle = "rgba(165,45,55,0.88)";
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      roundRect(x - 9, y - 34, 18, 42, 7);
      ctx.fill();
      ctx.stroke();

      // legs
      ctx.fillStyle = "rgba(240,240,240,0.90)";
      roundRect(x - 8, y + 10, 7, 14, 3); ctx.fill();
      roundRect(x + 1, y + 10, 7, 14, 3); ctx.fill();
    }
    ctx.restore();
  }

  function drawKeeper() {
    ctx.save();
    const x = keeper.x;
    const y = keeper.y;

    ctx.fillStyle = "rgba(255,160,40,0.92)";
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    roundRect(x - 12, y - 32, 24, 34, 8);
    ctx.fill(); ctx.stroke();

    // gloves
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    roundRect(x - 26, y - 22, 12, 10, 4); ctx.fill();
    roundRect(x + 14, y - 22, 12, 10, 4); ctx.fill();

    ctx.restore();
  }

  function drawGoalTarget() {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    const x = ANCHOR.goalCenter.x - ANCHOR.goalW / 2;
    const y = ANCHOR.goalCenter.y - ANCHOR.goalH / 2;
    ctx.strokeRect(x, y, ANCHOR.goalW, ANCHOR.goalH);
    ctx.restore();
  }

  // Physics
  function takeShot() {
    const dx = STATE.aim.x - ball.x;
    const dy = STATE.aim.y - (ball.y - ball.z);
    const len = Math.hypot(dx, dy) || 1;

    const p = STATE.aim.power;

    // Shoot opposite drag direction
    const nx = -dx / len;
    const ny = -dy / len;

    const speed = lerp(260, 980, p);
    ball.vx = nx * speed;
    ball.vy = ny * speed;

    // Lift from upward drag
    const lift = clamp((-dy / len + 0.25) * 1.25, 0, 1);
    ball.vz = lerp(140, 560, lift);

    keeper.targetX = clamp(
      ANCHOR.goalCenter.x + ball.vx * 0.12,
      ANCHOR.goalCenter.x - ANCHOR.goalW / 2 + 18,
      ANCHOR.goalCenter.x + ANCHOR.goalW / 2 - 18
    );

    ball.live = true;
    hintEl.textContent = "Shot taken…";
  }

  function resolve(result) {
    STATE.last = result;
    hintEl.textContent = result;

    if (result === "GOAL!") {
      STATE.score += 1;
      STATE.streak += 1;
      if (STATE.streak > 1 && STATE.streak % 3 === 0) STATE.score += 1;
    } else {
      STATE.streak = 0;
    }

    scoreEl.textContent = String(STATE.score);
    streakEl.textContent = String(STATE.streak);

    setTimeout(() => resetShot(), 900);
  }

  function update(dt) {
    if (!ball.live) return;

    // Side forces
    const wind = STATE.wind.ax;
    const curl = STATE.curl ? (ball.vy * 0.00012) * (ball.vx >= 0 ? 1 : -1) : 0;
    const knuckle = STATE.knuckle ? (Math.sin(STATE.t * 22) * 0.25 + (Math.random() - 0.5) * 0.12) : 0;
    ball.vx += (wind + curl + knuckle) * 820 * dt;

    // Gravity (Dip makes it drop more later)
    let g = 900;
    const progress = clamp((ANCHOR.ball.y - ball.y) / 560, 0, 1);
    if (STATE.dip && progress > 0.45) g *= 1.22;

    // Integrate
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    ball.vz -= g * dt;
    ball.z = Math.max(0, ball.z + ball.vz * dt);

    // Wall collision
    if (ball.y < ANCHOR.wallY + 14 && ball.y > ANCHOR.wallY - 22 && ball.z < 30) {
      for (const wx of wall.xs) {
        if (Math.abs(ball.x - wx) < 12) {
          ball.live = false;
          resolve("Blocked by the wall");
          return;
        }
      }
    }

    // Keeper movement
    keeper.x = lerp(keeper.x, keeper.targetX, dt * lerp(3.2, 7.0, keeper.skill));

    // Goal mouth check
    const gx0 = ANCHOR.goalCenter.x - ANCHOR.goalW / 2;
    const gy0 = ANCHOR.goalCenter.y - ANCHOR.goalH / 2;

    if (ball.y < ANCHOR.goalCenter.y + 70) {
      const inMouth =
        ball.x >= gx0 &&
        ball.x <= gx0 + ANCHOR.goalW &&
        (ball.y - ball.z) >= gy0 &&
        (ball.y - ball.z) <= gy0 + ANCHOR.goalH;

      if (inMouth) {
        const dist = Math.abs(ball.x - keeper.x);
        const reachable = dist < lerp(26, 50, keeper.skill);
        const saveChance = reachable ? lerp(0.25, 0.58, keeper.skill) : 0.10;

        ball.live = false;
        if (reachable && Math.random() < saveChance) resolve("Saved!");
        else resolve("GOAL!");
        return;
      }

      // Missed past the zone
      if (ball.y < ANCHOR.goalCenter.y - 60) {
        ball.live = false;
        resolve("Missed — Off target");
        return;
      }
    }

    // Out of play
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    if (ball.x < -80 || ball.x > w + 80 || ball.y < -120 || ball.y > h + 120) {
      ball.live = false;
      resolve("Out of play");
    }
  }

  // Input mapping (CSS pixels)
  function localPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function nearBall(p) {
    const bx = ball.x;
    const by = ball.y - ball.z;
    return Math.hypot(p.x - bx, p.y - by) < 28;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (ball.live) return;
    const p = localPos(e);
    if (!nearBall(p)) return;

    STATE.aiming = true;
    STATE.aim.x = p.x;
    STATE.aim.y = p.y;
    STATE.aim.power = 0;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!STATE.aiming) return;
    const p = localPos(e);
    STATE.aim.x = p.x;
    STATE.aim.y = p.y;

    const dx = p.x - ball.x;
    const dy = p.y - (ball.y - ball.z);
    STATE.aim.power = clamp(Math.hypot(dx, dy) / 280, 0, 1);
  });

  function endAim() {
    if (!STATE.aiming) return;
    STATE.aiming = false;

    if (STATE.aim.power < 0.06) {
      hintEl.textContent = "Too soft — drag longer for power";
      return;
    }
    takeShot();
  }

  canvas.addEventListener("pointerup", endAim);
  canvas.addEventListener("pointercancel", () => (STATE.aiming = false));

  // Buttons
  function toggle(btn, key) {
    STATE[key] = !STATE[key];
    btn.classList.toggle("on", STATE[key]);
  }

  btnCurl.addEventListener("click", () => toggle(btnCurl, "curl"));
  btnDip.addEventListener("click", () => toggle(btnDip, "dip"));
  btnKnuckle.addEventListener("click", () => toggle(btnKnuckle, "knuckle"));
  btnReset.addEventListener("click", resetShot);
  btnNewWind.addEventListener("click", setWind);

  btnExit.addEventListener("click", () => {
    // Back to set-pieces menu (adjust if your path differs)
    window.location.href = "../index.html";
  });

  function loop() {
    fitCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw order
    drawGoalTarget();
    drawWall();
    drawKeeper();
    drawBall();
    drawAim();

    update(STATE.dt);
    STATE.t += STATE.dt;

    requestAnimationFrame(loop);
  }

  // Init
  resetWall();
  setWind();
  resetShot();
  scoreEl.textContent = "0";
  streakEl.textContent = "0";

  requestAnimationFrame(loop);
})();
