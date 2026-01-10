/* Football Lab – Isometric Free Kicks
   This version is designed to LOOK like your reference:
   - Background image layer (./assets/pitch.png)
   - Transparent canvas overlay for ball + aim + basic keeper/wall interaction
   - Premium HUD elements

   Drop your own pitch image at:
   /labs/set-pieces/freekicks/assets/pitch.png
*/
(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('scoreVal');
  const streakEl = document.getElementById('streakVal');
  const windEl = document.getElementById('windVal');
  const windArrow = document.getElementById('windArrow');
  const hintEl = document.getElementById('hintText');

  const btnCurl = document.getElementById('btnCurl');
  const btnDip = document.getElementById('btnDip');
  const btnKnuckle = document.getElementById('btnKnuckle');
  const btnReset = document.getElementById('btnReset');
  const btnNewWind = document.getElementById('btnNewWind');
  const btnExit = document.getElementById('btnExit');

  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp = (a,b,t)=>a+(b-a)*t;
  const rand = (a,b)=>a+Math.random()*(b-a);

  // --- Screen-space anchor points (tuned for a typical isometric pitch image)
  // You can tweak these if your background image has different layout.
  const ANCHOR = {
    ball: { x: 250, y: 585 },
    goalCenter: { x: 950, y: 235 },
    goalW: 250,
    goalH: 120,
    wallY: 420,
    wallX0: 610,
    wallSpacing: 22
  };

  const STATE = {
    score: 0,
    streak: 0,
    t: 0,
    dt: 1/60,
    aiming: false,
    curl: false,
    dip: false,
    knuckle: false,
    wind: { ax: 0, deg: 0, label: '—' },
    last: 'Drag from the ball to aim & power.',
    // aim line
    aim: { x: 0, y: 0, power: 0 }
  };

  // Ball in pseudo-3D but mapped to screen coordinates (feels isometric)
  const ball = {
    x: ANCHOR.ball.x,
    y: ANCHOR.ball.y,
    z: 0,       // height in pixels
    vx: 0,
    vy: 0,
    vz: 0,
    r: 7,
    live: false
  };

  const wall = {
    n: 5,
    xs: []
  };

  const keeper = {
    x: ANCHOR.goalCenter.x,
    y: ANCHOR.goalCenter.y + 35,
    targetX: ANCHOR.goalCenter.x,
    skill: 0.72
  };

  function resetWall(){
    wall.xs = [];
    const start = ANCHOR.wallX0 - (wall.n-1)*ANCHOR.wallSpacing*0.5;
    for(let i=0;i<wall.n;i++) wall.xs.push(start + i*ANCHOR.wallSpacing);
  }

  function resetShot(){
    ball.x = ANCHOR.ball.x;
    ball.y = ANCHOR.ball.y;
    ball.z = 0;
    ball.vx = 0; ball.vy = 0; ball.vz = 0;
    ball.live = false;
    keeper.x = ANCHOR.goalCenter.x;
    keeper.targetX = keeper.x;
    STATE.aiming = false;
    STATE.last = 'Drag from the ball to aim & power. Release to shoot.';
    hintEl.textContent = STATE.last;
  }

  function setWind(){
    const ax = rand(-0.10, 0.10);
    const deg = ax * 240; // just for arrow rotation
    const dir = ax < -0.015 ? '←' : ax > 0.015 ? '→' : '•';
    const strength = Math.round(Math.abs(ax)*100);
    STATE.wind = { ax, deg, label: `${dir} ${strength}` };
    windEl.textContent = STATE.wind.label;
    windArrow.style.transform = `rotate(${deg}deg)`;
  }

  // --- Canvas sizing (HiDPI)
  function fitCanvas(){
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2.25, window.devicePixelRatio || 1));
    const w = Math.round(rect.width*dpr);
    const h = Math.round(rect.height*dpr);
    if(canvas.width !== w || canvas.height !== h){
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', fitCanvas);

  // --- Drawing helpers
  function drawAim(){
    if(!STATE.aiming) return;
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,208,64,0.85)';
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y - ball.z);
    ctx.lineTo(STATE.aim.x, STATE.aim.y);
    ctx.stroke();

    // power bar
    const p = STATE.aim.power;
    const barW = 140, barH = 10;
    const x = 26, y = canvas.getBoundingClientRect().height - 90;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, x, y, barW, barH, 6, true, false);
    ctx.fillStyle = 'rgba(255,208,64,0.85)';
    roundRect(ctx, x, y, barW*p, barH, 6, true, false);
    ctx.restore();
  }

  function drawBall(){
    const sx = ball.x, sy = ball.y - ball.z;
    // shadow
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y+6, 10, 4, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // ball
    ctx.save();
    ctx.fillStyle = 'rgba(245,248,255,0.95)';
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawWall(){
    ctx.save();
    for(const x of wall.xs){
      const y = ANCHOR.wallY;
      ctx.fillStyle = 'rgba(155,40,45,0.85)';
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      roundRect(ctx, x-7, y-28, 14, 34, 6, true, true);
      // legs
      ctx.fillStyle = 'rgba(240,240,240,0.90)';
      roundRect(ctx, x-6, y+6, 5, 12, 3, true, false);
      roundRect(ctx, x+1, y+6, 5, 12, 3, true, false);
    }
    ctx.restore();
  }

  function drawGoalTarget(){
    // subtle target box aligned to goal mouth for feedback
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    const x = ANCHOR.goalCenter.x - ANCHOR.goalW/2;
    const y = ANCHOR.goalCenter.y - ANCHOR.goalH/2;
    ctx.strokeRect(x, y, ANCHOR.goalW, ANCHOR.goalH);
    ctx.restore();
  }

  function drawKeeper(){
    // keeper block at goal mouth
    ctx.save();
    const x = keeper.x;
    const y = keeper.y;
    ctx.fillStyle = 'rgba(255,160,40,0.90)';
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    roundRect(ctx, x-10, y-26, 20, 28, 7, true, true);
    // arms
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    roundRect(ctx, x-22, y-18, 10, 8, 4, true, false);
    roundRect(ctx, x+12, y-18, 10, 8, 4, true, false);
    ctx.restore();
  }

  function roundRect(c, x, y, w, h, r, fill, stroke){
    const rr = Math.min(r, w/2, h/2);
    c.beginPath();
    c.moveTo(x+rr, y);
    c.arcTo(x+w, y, x+w, y+h, rr);
    c.arcTo(x+w, y+h, x, y+h, rr);
    c.arcTo(x, y+h, x, y, rr);
    c.arcTo(x, y, x+w, y, rr);
    if(fill) c.fill();
    if(stroke) c.stroke();
  }

  // --- Physics (screen space)
  function takeShot(){
    const dx = STATE.aim.x - ball.x;
    const dy = STATE.aim.y - (ball.y - ball.z);
    const len = Math.hypot(dx, dy) || 1;

    const p = STATE.aim.power;
    // Shot goes opposite drag direction
    const nx = -dx / len;
    const ny = -dy / len;

    // Base velocity toward goal (isometric: up-right)
    const speed = lerp(260, 920, p);
    ball.vx = nx * speed;
    ball.vy = ny * speed;

    // Lift from upward component
    const lift = clamp((-dy/len + 0.25) * 1.2, 0, 1);
    ball.vz = lerp(120, 520, lift);

    // Keeper target prediction
    keeper.targetX = clamp(ANCHOR.goalCenter.x + ball.vx * 0.12, ANCHOR.goalCenter.x - ANCHOR.goalW/2 + 16, ANCHOR.goalCenter.x + ANCHOR.goalW/2 - 16);

    ball.live = true;
    STATE.last = 'Shot taken…';
    hintEl.textContent = STATE.last;
  }

  function resolve(result){
    STATE.last = result;
    hintEl.textContent = result;

    if(result === 'GOAL!'){
      STATE.score += 1;
      STATE.streak += 1;
      if(STATE.streak>1 && STATE.streak%3===0) STATE.score += 1;
    } else {
      STATE.streak = 0;
    }
    scoreEl.textContent = String(STATE.score);
    streakEl.textContent = String(STATE.streak);

    setTimeout(() => resetShot(), 900);
  }

  function update(dt){
    if(!ball.live) return;

    // Wind + curl + knuckle affect x
    const wind = STATE.wind.ax;
    const curl = STATE.curl ? (ball.vy * 0.00012) * (ball.vx>=0?1:-1) : 0;
    const knuckle = STATE.knuckle ? (Math.sin(STATE.t*22)*0.25 + (Math.random()-0.5)*0.12) : 0;
    ball.vx += (wind + curl + knuckle) * 800 * dt;

    // Dip = extra gravity late
    let g = 860;
    const progress = clamp((ANCHOR.ball.y - ball.y)/520, 0, 1); // rough
    if(STATE.dip && progress > 0.45) g *= 1.22;

    // Integrate
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.vz -= g * dt;
    ball.z = Math.max(0, ball.z + ball.vz * dt);

    // wall collision (simple)
    if(ball.y < ANCHOR.wallY + 12 && ball.y > ANCHOR.wallY - 18 && ball.z < 26){
      for(const wx of wall.xs){
        if(Math.abs(ball.x - wx) < 10){
          ball.live = false;
          resolve('Blocked by the wall');
          return;
        }
      }
    }

    // keeper movement
    keeper.x = lerp(keeper.x, keeper.targetX, dt * lerp(3.2, 7.0, keeper.skill));

    // goal check when near goal area
    const gx0 = ANCHOR.goalCenter.x - ANCHOR.goalW/2;
    const gy0 = ANCHOR.goalCenter.y - ANCHOR.goalH/2;

    if(ball.y < ANCHOR.goalCenter.y + 60){
      const inMouth = (ball.x >= gx0 && ball.x <= gx0 + ANCHOR.goalW) && ((ball.y - ball.z) >= gy0 && (ball.y - ball.z) <= gy0 + ANCHOR.goalH);

      if(inMouth){
        // save?
        const dist = Math.abs(ball.x - keeper.x);
        const reachable = dist < lerp(26, 48, keeper.skill);
        const saveChance = reachable ? lerp(0.25, 0.58, keeper.skill) : 0.10;

        ball.live = false;
        if(reachable && Math.random() < saveChance) resolve('Saved!');
        else resolve('GOAL!');
        return;
      }

      // miss (past the goal zone)
      if(ball.y < ANCHOR.goalCenter.y - 40){
        ball.live = false;
        resolve('Missed — Off target');
        return;
      }
    }

    // out of bounds
    if(ball.x < -60 || ball.x > canvas.getBoundingClientRect().width + 60 || ball.y < -80 || ball.y > canvas.getBoundingClientRect().height + 80){
      ball.live = false;
      resolve('Out of play');
      return;
    }
  }

  // --- Input
  function localPos(e){
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function nearBall(p){
    const bx = ball.x, by = ball.y - ball.z;
    return Math.hypot(p.x - bx, p.y - by) < 26;
  }

  canvas.addEventListener('pointerdown', (e) => {
    if(ball.live) return;
    const p = localPos(e);
    if(!nearBall(p)) return;
    STATE.aiming = true;
    STATE.aim.x = p.x;
    STATE.aim.y = p.y;
    STATE.aim.power = 0;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if(!STATE.aiming) return;
    const p = localPos(e);
    STATE.aim.x = p.x;
    STATE.aim.y = p.y;
    const dx = p.x - ball.x;
    const dy = p.y - (ball.y - ball.z);
    STATE.aim.power = clamp(Math.hypot(dx,dy)/260, 0, 1);
  });

  function endAim(){
    if(!STATE.aiming) return;
    STATE.aiming = false;
    if(STATE.aim.power < 0.06){
      hintEl.textContent = 'Too soft — drag longer for power';
      return;
    }
    takeShot();
  }
  canvas.addEventListener('pointerup', endAim);
  canvas.addEventListener('pointercancel', () => STATE.aiming = false);

  // --- Buttons
  function toggle(btn, key){
    STATE[key] = !STATE[key];
    btn.classList.toggle('on', STATE[key]);
  }
  btnCurl.addEventListener('click', () => toggle(btnCurl, 'curl'));
  btnDip.addEventListener('click', () => toggle(btnDip, 'dip'));
  btnKnuckle.addEventListener('click', () => toggle(btnKnuckle, 'knuckle'));
  btnReset.addEventListener('click', () => resetShot());
  btnNewWind.addEventListener('click', () => setWind());
  btnExit.addEventListener('click', () => {
    // go back to Set Pieces root (adjust if your structure differs)
    window.location.href = "../../index.html";
  });

  // --- Main loop
  function render(){
    fitCanvas();
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // subtle goal box hint + entities
    drawGoalTarget();
    drawWall();
    drawKeeper();
    drawBall();
    drawAim();

    update(STATE.dt);
    STATE.t += STATE.dt;
    requestAnimationFrame(render);
  }

  // Init
  resetWall();
  setWind();
  resetShot();
  requestAnimationFrame(render);
})();
