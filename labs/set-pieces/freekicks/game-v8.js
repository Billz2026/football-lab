// Football Lab • Free Kicks (v6)
// Adds: wall, keeper saves, scoring + streak, deeper goal look, tougher physics.
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hint = document.getElementById("hint");
  const toast = document.getElementById("toast");

  const elPwr = document.getElementById("pwr");
  const elCur = document.getElementById("cur");
  const elShots = document.getElementById("shots");
  const elScore = document.getElementById("score");
  const elStreak = document.getElementById("streak");

  const ASSETS = {
    ball: "../../../assets/freekicks/ball.svg",
    kickerIdle: "../../../assets/freekicks/player_idle.svg",
    kickerKick: "../../../assets/freekicks/player_kick.svg",
  };

  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp = (a,b,t)=>a+(b-a)*t;
  const dist = (ax,ay,bx,by)=>Math.hypot(ax-bx, ay-by);

  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
      r = Math.min(r, w/2, h/2);
      this.beginPath();
      this.moveTo(x+r, y);
      this.arcTo(x+w, y, x+w, y+h, r);
      this.arcTo(x+w, y+h, x, y+h, r);
      this.arcTo(x, y+h, x, y, r);
      this.arcTo(x, y, x+w, y, r);
      this.closePath();
      return this;
    };
  }

  const loadImg = (src)=>new Promise((res,rej)=> {
    const i=new Image();
    i.onload=()=>res(i);
    i.onerror=()=>rej(new Error("Failed to load: "+src));
    i.src = src + (src.includes("?") ? "" : "?v=" + Date.now());
  });

  const PITCH = { topY: 40, botY: 528, topW: 320, botW: 960, cx: 480 };

  // Push goal "further back": higher + smaller
  const GOAL = { cx: 480, y: 28, w: 180, h: 96, post: 4, mouthPad: 12 };

  // More realistic FK distance
  const KICKER_SPOT = { u: 0.47, v: 0.24 };
  const BALL_SPOT   = { u: 0.52, v: 0.22 };

  const WALL = { v: 0.62, count: 4, spread: 0.18, radius: 0.022 };

  const state = {
    shots: 0, score: 0, streak: 0,
    phase: "idle",
    aim: { active:false, start:null, now:null, power:0, curve:0 },
    ball: { u: BALL_SPOT.u, v: BALL_SPOT.v, du:0, dv:0, spin:0, flying:false },
    keeper: { u: 0.50, targetU: 0.50, diving: false, diveT: 0, reactDelay: 0.12, speed: 2.4, reach: 0.19 },
    goalFlash: 0, netWave: 0, toastT: 0,
  };

  function project(u, v){
    const y = PITCH.botY + (PITCH.topY - PITCH.botY) * v;
    const w = PITCH.botW + (PITCH.topW - PITCH.botW) * v;
    return { x: PITCH.cx + (u - 0.5) * w, y, w };
  }

  function showToast(text){
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    state.toastT = 1.25;
  }
  function updateHUD(){
    elShots && (elShots.textContent = String(state.shots));
    elScore && (elScore.textContent = String(state.score));
    elStreak && (elStreak.textContent = String(state.streak));
  }

  function resetBall(){
    state.phase="idle";
    state.ball.u = BALL_SPOT.u; state.ball.v = BALL_SPOT.v;
    state.ball.du = 0; state.ball.dv = 0; state.ball.spin = 0; state.ball.flying = false;

    state.aim.active=false; state.aim.start=null; state.aim.now=null; state.aim.power=0; state.aim.curve=0;

    state.goalFlash=0; state.netWave=0;

    state.keeper.diving=false; state.keeper.diveT=0; state.keeper.targetU=0.5;
    if (hint) hint.style.opacity="1";
    elPwr && (elPwr.textContent="0%");
    elCur && (elCur.textContent="0%");
  }

  function getWallMen(){
    const mid = 0.5;
    const start = mid - WALL.spread/2;
    const step = WALL.spread / (WALL.count - 1);
    const men = [];
    for (let i=0;i<WALL.count;i++) men.push({ u: start + step*i, v: WALL.v });
    return men;
  }

  let IMG = { ball:null, kickerIdle:null, kickerKick:null };

  function getPointerPos(evt){
    const r=canvas.getBoundingClientRect();
    const pt = evt.touches && evt.touches[0] ? evt.touches[0] : evt;
    return { x:(pt.clientX-r.left)*(canvas.width/r.width), y:(pt.clientY-r.top)*(canvas.height/r.height) };
  }

  function onDown(evt){
    if (state.ball.flying) return;
    const p=getPointerPos(evt);
    const bp = project(state.ball.u, state.ball.v);
    if (dist(p.x,p.y,bp.x,bp.y) <= 30){
      state.aim.active=true;
      state.aim.start={ x: bp.x, y: bp.y };
      state.aim.now=p;
      if (hint) hint.style.opacity="0";
      evt.preventDefault?.();
    }
  }

  function onMove(evt){
    if (!state.aim.active) return;
    state.aim.now=getPointerPos(evt);

    const dx = state.aim.start.x - state.aim.now.x;
    const dy = state.aim.start.y - state.aim.now.y;
    const drag = Math.hypot(dx,dy);

    const power = clamp(drag / 240, 0, 1);
    const curve = clamp(dx / 240, -1, 1);

    state.aim.power = power;
    state.aim.curve = curve;

    elPwr && (elPwr.textContent = Math.round(power*100) + "%");
    elCur && (elCur.textContent = Math.round(Math.abs(curve)*100) + "%");
    evt.preventDefault?.();
  }

  function onUp(evt){
    if (!state.aim.active) return;
    state.aim.active=false;

    const end = state.aim.now || getPointerPos(evt);
    const dx = state.aim.start.x - end.x;
    const dy = state.aim.start.y - end.y;

    const drag = Math.hypot(dx,dy);
    const power = clamp(drag / 240, 0, 1);

    const dirU = clamp(dx / 540, -0.55, 0.55);
    const dirV = clamp(dy / 430, -0.10, 1.05);

    // Tougher physics: not every shot reaches / scores
    const strength = 0.65 + power * 2.05; // 0.65..2.70
  state.ball.du = dirU * 0.92 * strength;
  state.ball.dv = (0.92 + dirV * 0.82) * strength;
    state.ball.spin = clamp(dx / 260, -1, 1) * (0.35 + power*1.05);

    state.ball.flying = true;
    state.phase="kicked";

    state.shots += 1;
    updateHUD();

    const predicted = clamp(0.5 + dirU * 0.58 + (Math.random()-0.5)*0.05, 0.18, 0.82);
    state.keeper.targetU = predicted;
    state.keeper.diving = true;
    state.keeper.diveT = 0;

    evt.preventDefault?.();
  }

  canvas.addEventListener("mousedown", onDown);
  canvas.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener("touchstart", onDown, { passive:false });
  canvas.addEventListener("touchmove", onMove, { passive:false });
  canvas.addEventListener("touchend", onUp, { passive:false });

  function drawBackground(){
    const g=ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,"#050608");
    g.addColorStop(1,"#000000");
    ctx.fillStyle=g;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const glow=ctx.createRadialGradient(480, 40, 10, 480, 40, 560);
    glow.addColorStop(0,"rgba(255,205,90,0.11)");
    glow.addColorStop(1,"rgba(255,205,90,0)");
    ctx.fillStyle=glow;
    ctx.fillRect(0,0,canvas.width,260);
  }

  function drawPitch(){
    const xTopL = PITCH.cx - PITCH.topW/2, xTopR = PITCH.cx + PITCH.topW/2;
    const xBotL = PITCH.cx - PITCH.botW/2, xBotR = PITCH.cx + PITCH.botW/2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xTopL, PITCH.topY);
    ctx.lineTo(xTopR, PITCH.topY);
    ctx.lineTo(xBotR, PITCH.botY);
    ctx.lineTo(xBotL, PITCH.botY);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, PITCH.topY, 0, PITCH.botY);
    grad.addColorStop(0, "rgba(18,40,28,1)");
    grad.addColorStop(1, "rgba(7,16,11,1)");
    ctx.fillStyle=grad; ctx.fill(); ctx.clip();

    const stripes = 14;
    for (let i=0;i<stripes;i++){
      const t = i/stripes;
      const y = PITCH.topY + (PITCH.botY-PITCH.topY)*t;
      const v = clamp(1 - t, 0, 1);
      const w = PITCH.botW + (PITCH.topW - PITCH.botW) * v;
      const xl = PITCH.cx - w/2;
      ctx.fillStyle = i%2===0 ? "rgba(255,255,255,0.028)" : "rgba(0,0,0,0.028)";
      ctx.fillRect(xl, y, w, (PITCH.botY-PITCH.topY)/stripes);
    }
    ctx.restore();
  }

  function drawGoal(){
    const x = GOAL.cx - GOAL.w/2, y = GOAL.y, w = GOAL.w, h = GOAL.h;

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    const cell = 14;
    const wave = state.netWave;
    for (let ix=0; ix<=w; ix+=cell){
      ctx.beginPath();
      const x0 = x + ix;
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + Math.sin((ix*0.09)+wave)*2.0, y+h);
      ctx.stroke();
    }
    for (let iy=0; iy<=h; iy+=cell){
      ctx.beginPath();
      const y0 = y + iy;
      ctx.moveTo(x, y0);
      ctx.lineTo(x+w, y0 + Math.sin((iy*0.11)+wave)*1.6);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.lineWidth = GOAL.post;
    ctx.strokeStyle = "rgba(255,205,90,0.9)";
    ctx.shadowColor = "rgba(242,193,79,0.26)";
    ctx.shadowBlur = 12;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();

    if (state.goalFlash>0){
      ctx.save();
      ctx.fillStyle = `rgba(255,223,122,${state.goalFlash})`;
      ctx.fillRect(x,y,w,h);
      // Big GOAL flash for clear feedback
      ctx.globalAlpha = Math.min(1, state.goalFlash*2.2);
      ctx.font = "800 44px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,.55)";
      ctx.shadowBlur = 12;
      ctx.fillText("GOAL!", GOAL.cx, GOAL.y + GOAL.h + 46);
      ctx.restore();
    }
  }

  function drawWall(){
    const men = getWallMen();
    for (const m of men){
      const p = project(m.u, m.v);
      const depth = (0.98 - m.v*0.55);
      const w = 28*depth, h = 64*depth;
      const x = p.x - w/2, y = p.y - h;

      ctx.save();
      ctx.fillStyle="rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y+10, 16*depth, 5*depth, 0, 0, Math.PI*2);
      ctx.fill();

      const body = ctx.createLinearGradient(x, y, x+w, y+h);
      body.addColorStop(0, "rgba(18,19,22,1)");
      body.addColorStop(1, "rgba(7,8,10,1)");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10*depth);
      ctx.fill();

      ctx.strokeStyle="rgba(255,205,90,0.22)";
      ctx.lineWidth=2;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawKeeper(){
    const mouthX = GOAL.cx - (GOAL.w/2) + GOAL.mouthPad;
    const mouthW = GOAL.w - GOAL.mouthPad*2;

    const x = mouthX + mouthW * state.keeper.u;
    const y = GOAL.y + GOAL.h - 14;

    const s = 0.48;
    const bodyW = 90*s, bodyH = 140*s;

    const t = state.keeper.diveT;
    const diveAmt = clamp((t - state.keeper.reactDelay) / 0.35, 0, 1);
    const diveX = state.keeper.diving ? (state.keeper.targetU - 0.5) * 160 * diveAmt : 0;
    const diveY = state.keeper.diving ? -38 * diveAmt : 0;

    ctx.save();
    ctx.translate(x + diveX, y + diveY);
    ctx.rotate(state.keeper.diving ? (state.keeper.targetU<0.5 ? -0.18 : 0.18) * diveAmt : 0);

    ctx.fillStyle="rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 9, 36, 9, 0, 0, Math.PI*2);
    ctx.fill();

    const grad = ctx.createLinearGradient(-40, -120, 40, 20);
    grad.addColorStop(0, "rgba(24,28,34,1)");
    grad.addColorStop(1, "rgba(10,12,15,1)");
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect(-bodyW/2, -bodyH, bodyW, bodyH*0.72, 18*s);
    ctx.fill();

    ctx.fillStyle="rgba(225,225,225,0.10)";
    ctx.beginPath();
    ctx.arc(0, -bodyH-18*s, 16*s, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
  }

  function drawKicker(){
    const kp = project(KICKER_SPOT.u, KICKER_SPOT.v);
    const scale = 0.48;
    const img = (state.phase==="kicked" && state.ball.flying) ? IMG.kickerKick : IMG.kickerIdle;
    const w = 280*scale, h = 360*scale;

    const x = kp.x - w/2 - 22;
    const y = kp.y - h + 26;

    ctx.save();
    ctx.fillStyle="rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(kp.x - 10, kp.y + 18, 62, 14, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.drawImage(img, x, y, w, h);
  }

  function drawBall(){
    const bp = project(state.ball.u, state.ball.v);
    const size = 34 * (1.12 - state.ball.v*0.62);

    ctx.save();
    ctx.fillStyle="rgba(0,0,0,0.30)";
    ctx.beginPath();
    ctx.ellipse(bp.x+3, bp.y+13, 19, 8, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.drawImage(IMG.ball, bp.x-size/2, bp.y-size/2, size, size);
  }

  function drawAim(){
    if(!state.aim.active||!state.aim.start||!state.aim.now) return;

    const dx = state.aim.start.x - state.aim.now.x;
    const dy = state.aim.start.y - state.aim.now.y;
    const drag = Math.hypot(dx,dy);
    const power = clamp(drag/240, 0, 1);

    ctx.save();
    ctx.lineWidth=9;
    ctx.lineCap="round";
    ctx.strokeStyle=`rgba(255,223,122,${0.20 + power*0.70})`;
    ctx.shadowColor="rgba(242,193,79,0.50)";
    ctx.shadowBlur=16;
    ctx.beginPath();
    ctx.moveTo(state.aim.start.x, state.aim.start.y);
    ctx.lineTo(state.aim.now.x, state.aim.now.y);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,205,90,0.85)";
    const n = Math.max(1, drag);
    const ux = dx / n, uy = dy / n;
    ctx.beginPath();
    ctx.arc(state.aim.start.x + ux*70, state.aim.start.y + uy*70, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function inGoalMouth(){
    const bp = project(state.ball.u, state.ball.v);
    const x = GOAL.cx - GOAL.w/2 + GOAL.mouthPad;
    const y = GOAL.y + GOAL.mouthPad;
    const w = GOAL.w - GOAL.mouthPad*2;
    const h = GOAL.h - GOAL.mouthPad*2;
    return (bp.x > x && bp.x < x+w && bp.y > y && bp.y < y+h);
  }

  function wallCollision(){
    const men = getWallMen();
    for (const m of men){
      const du = state.ball.u - m.u;
      const dv = state.ball.v - m.v;
      if (Math.hypot(du, dv) < WALL.radius) return true;
    }
    return false;
  }

  function update(dt){
    if (state.toastT > 0){
      state.toastT -= dt;
      if (state.toastT <= 0 && toast) toast.classList.remove("show");
    }

    if (state.keeper.diving){
      state.keeper.diveT += dt;
      const t = state.keeper.diveT;
      const active = t > state.keeper.reactDelay;
      const speed = state.keeper.speed * (active ? 1 : 0);
      state.keeper.u = lerp(state.keeper.u, state.keeper.targetU, clamp(dt*speed, 0, 1));
      if (t > 0.65) state.keeper.diving = false;
    } else {
      state.keeper.u = lerp(state.keeper.u, 0.5, clamp(dt*0.9, 0, 1));
    }

    if (!state.ball.flying) return;

    const curveInfluence = state.ball.spin * (0.26 + state.ball.v*0.85);
    state.ball.du += curveInfluence * dt;

    state.ball.u += state.ball.du * dt;
    state.ball.v += state.ball.dv * dt;

    state.ball.du *= (1 - 0.48*dt);
    state.ball.dv *= (1 - 0.22*dt);

    state.ball.dv -= 0.16 * dt; // gravity
    state.netWave += dt * 6.0;
    if (state.goalFlash>0) state.goalFlash = Math.max(0, state.goalFlash - dt*2.0);

    if (state.ball.v > WALL.v - 0.025 && state.ball.v < WALL.v + 0.025){
      if (wallCollision()){
        showToast("Blocked!");
        state.streak = 0;
        updateHUD();
        state.ball.dv *= 0.35;
        state.ball.du += (Math.random()-0.5)*0.55;
        state.ball.v -= 0.02;
        state.ball.dv -= 0.32;
      }
    }

    if (state.ball.v > 0.94) {
      const bp = project(state.ball.u, state.ball.v);
      const mouthX = GOAL.cx - (GOAL.w/2) + GOAL.mouthPad;
      const mouthW = GOAL.w - GOAL.mouthPad*2;
      const kx = mouthX + mouthW * state.keeper.u;
      const save = inGoalMouth() && Math.abs(bp.x - kx) < (GOAL.w * state.keeper.reach);

      if (inGoalMouth() && !save) {
        state.goalFlash = 0.40;
        state.netWave += 2.0;
        state.score += (100 + state.streak*10);
        state.streak += 1;
        showToast(state.streak > 1 ? `GOAL! (+${100 + (state.streak-1)*10})` : "GOAL! (+100)");
      } else if (inGoalMouth() && save) {
        state.score = Math.max(0, state.score - 10);
        state.streak = 0;
        showToast("Saved! (-10)");
        state.ball.u += (bp.x < kx ? -0.03 : 0.03);
        state.ball.v -= 0.10;
        state.ball.du *= -0.45;
        state.ball.dv = -0.25;
      } else {
        state.score = Math.max(0, state.score - 5);
        state.streak = 0;
        showToast("Missed! (-5)");
      }

      updateHUD();
      state.ball.flying = false;
      setTimeout(resetBall, 850);
      return;
    }

    if (state.ball.v < 0 || state.ball.u < -0.15 || state.ball.u > 1.15 || state.ball.v > 1.2){
      state.ball.flying = false;
      state.score = Math.max(0, state.score - 5);
      state.streak = 0;
      updateHUD();
      showToast("Out! (-5)");
      setTimeout(resetBall, 650);
    }
  }

  function render(){
    drawBackground();
    drawPitch();
    drawGoal();
    drawWall();
    drawKeeper();
    drawKicker();
    drawBall();
    drawAim();
  }

  let last=performance.now();
  function loop(now){
    const dt = clamp((now-last)/1000, 0, 0.033);
    last=now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  async function boot(){
    try{
      const [ball, idle, kick] = await Promise.all([
        loadImg(ASSETS.ball),
        loadImg(ASSETS.kickerIdle),
        loadImg(ASSETS.kickerKick),
      ]);
      IMG.ball = ball; IMG.kickerIdle = idle; IMG.kickerKick = kick || idle;

      updateHUD();
      resetBall();
      requestAnimationFrame(loop);
    }catch(e){
      ctx.fillStyle="#0b0d10"; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle="rgba(255,223,122,.95)";
      ctx.font="18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("Asset load failed. Check /assets/freekicks/ files.", 40, 70);
      ctx.fillStyle="rgba(255,255,255,.7)";
      ctx.fillText(String(e), 40, 100);
      console.error(e);
    }
  }

  boot();
})();