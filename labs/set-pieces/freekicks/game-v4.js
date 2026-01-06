// Football Lab • Free Kicks — Premium Blockout (v4)
// Improvements:
// - Correct scale: smaller goal + smaller characters
// - Proper roles: kicker (near ball) + goalkeeper (in goal)
// - Better power mapping so you can reach the net
// - Simple curve (side spin) from drag angle
// - Clean HUD: Power/Curve/Shots

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hint = document.getElementById("hint");
  const elPwr = document.getElementById("pwr");
  const elCur = document.getElementById("cur");
  const elShots = document.getElementById("shots");

  const ASSETS = {
    ball: "../../../assets/freekicks/ball.svg",
    kickerIdle: "../../../assets/freekicks/player_idle.svg",
    kickerKick: "../../../assets/freekicks/player_kick.svg",
  };

  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const dist = (ax,ay,bx,by)=>Math.hypot(ax-bx, ay-by);

  const loadImg = (src)=>new Promise((res,rej)=>{
    const i=new Image();
    i.onload=()=>res(i);
    i.onerror=()=>rej(new Error("Failed to load: "+src));
    i.src = src + (src.includes("?") ? "" : "?v=" + Date.now());
  });

  // Perspective pitch (trapezoid)
  const PITCH = {
    topY: 70,
    botY: 520,
    topW: 520,
    botW: 900,
    cx: 480,
  };

  // Goal smaller + centered, sitting on pitch top
  const GOAL = {
    cx: 480,
    y: 92,
    w: 280,
    h: 150,
    post: 5,
    mouthPad: 14
  };

  // Character anchors in pitch coordinates (u across 0..1, v depth 0..1 bottom->top)
  const KICKER_SPOT = { u: 0.50, v: 0.16 }; // near bottom
  const BALL_SPOT   = { u: 0.50, v: 0.12 };

  const state = {
    shots: 0,
    phase: "idle", // idle | kicked
    aim: { active:false, start:null, now:null, power:0, curve:0 },
    ball: { u: BALL_SPOT.u, v: BALL_SPOT.v, du:0, dv:0, spin:0, flying:false },
    keeper: { u: 0.50, targetU:0.50, diving:false, diveT:0 }, // simple keeper
    goalFlash: 0,
    netWave: 0,
  };

  // Project pitch uv -> screen xy
  function project(u, v){
    const y = PITCH.botY + (PITCH.topY - PITCH.botY) * v;
    const w = PITCH.botW + (PITCH.topW - PITCH.botW) * v;
    return { x: PITCH.cx + (u - 0.5) * w, y, w };
  }

  function uvFromScreen(x,y){
    // approximate inverse: compute v from y, then u from width at that v
    const v = clamp((PITCH.botY - y) / (PITCH.botY - PITCH.topY), 0, 1);
    const w = PITCH.botW + (PITCH.topW - PITCH.botW) * v;
    const u = clamp(0.5 + (x - PITCH.cx)/w, 0, 1);
    return { u, v };
  }

  function getPointerPos(evt){
    const r=canvas.getBoundingClientRect();
    const pt = evt.touches && evt.touches[0] ? evt.touches[0] : evt;
    return { x:(pt.clientX-r.left)*(canvas.width/r.width), y:(pt.clientY-r.top)*(canvas.height/r.height) };
  }

  function resetBall(){
    state.phase="idle";
    state.ball.u = BALL_SPOT.u;
    state.ball.v = BALL_SPOT.v;
    state.ball.du = 0;
    state.ball.dv = 0;
    state.ball.spin = 0;
    state.ball.flying = false;
    state.aim.active=false;
    state.aim.start=null;
    state.aim.now=null;
    state.aim.power=0;
    state.aim.curve=0;
    state.goalFlash=0;
    state.netWave=0;
    state.keeper.diving=false;
    state.keeper.diveT=0;
    state.keeper.targetU=0.5;
    if (hint) hint.style.opacity="1";
    if (elPwr) elPwr.textContent="0%";
    if (elCur) elCur.textContent="0%";
  }

  let IMG = { ball:null, kickerIdle:null, kickerKick:null };

  // --- INPUT
  function onDown(evt){
    if (state.ball.flying) return;
    const p=getPointerPos(evt);
    const bp = project(state.ball.u, state.ball.v);
    // tighter hit radius; must grab ball
    const hit = dist(p.x,p.y,bp.x,bp.y) <= 34;
    if (hit){
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

    // curve from horizontal offset
    const curve = clamp(dx / 220, -1, 1);

    state.aim.power = power;
    state.aim.curve = curve;

    if (elPwr) elPwr.textContent = Math.round(power*100) + "%";
    if (elCur) elCur.textContent = Math.round(Math.abs(curve)*100) + "%";
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

    // Direction: upward to goal, based on dy
    // Map drag to pitch velocity (dv depth, du sideways)
    const dirU = clamp(dx / 520, -0.55, 0.55);
    const dirV = clamp(dy / 420, -0.15, 1.0); // pull down gives positive dy => forward

    // Base shot strength — tuned so it reaches the net
    const strength = 0.65 + power * 1.35; // 0.65..2.0
    state.ball.du = dirU * 0.85 * strength;
    state.ball.dv = (0.90 + dirV * 0.70) * strength; // strong forward
    state.ball.spin = clamp(dx / 260, -1, 1) * (0.55 + power*0.85); // curve amount
    state.ball.flying = true;
    state.phase="kicked";
    state.shots += 1;
    if (elShots) elShots.textContent = String(state.shots);

    // keeper reacts to where ball is *aimed* (simple)
    state.keeper.targetU = clamp(0.5 + dirU * 0.55, 0.22, 0.78);
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

  // --- Premium-ish visuals (procedural)
  function drawBackground(){
    const g=ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,"#050608");
    g.addColorStop(1,"#000000");
    ctx.fillStyle=g;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // stadium glow band
    const band=ctx.createRadialGradient(480, 60, 10, 480, 60, 520);
    band.addColorStop(0,"rgba(255,205,90,0.14)");
    band.addColorStop(1,"rgba(255,205,90,0)");
    ctx.fillStyle=band;
    ctx.fillRect(0,0,canvas.width,260);
  }

  function drawPitch(){
    const topW = PITCH.topW, botW = PITCH.botW;
    const xTopL = PITCH.cx - topW/2, xTopR = PITCH.cx + topW/2;
    const xBotL = PITCH.cx - botW/2, xBotR = PITCH.cx + botW/2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xTopL, PITCH.topY);
    ctx.lineTo(xTopR, PITCH.topY);
    ctx.lineTo(xBotR, PITCH.botY);
    ctx.lineTo(xBotL, PITCH.botY);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, PITCH.topY, 0, PITCH.botY);
    grad.addColorStop(0, "rgba(18,40,28,1)");
    grad.addColorStop(1, "rgba(8,18,12,1)");
    ctx.fillStyle=grad;
    ctx.fill();
    ctx.clip();

    // mow stripes
    const stripes = 14;
    for (let i=0;i<stripes;i++){
      const t = i/stripes;
      const y = PITCH.topY + (PITCH.botY-PITCH.topY)*t;
      const v = clamp(1 - t, 0, 1);
      const w = PITCH.botW + (PITCH.topW - PITCH.botW) * v;
      const xl = PITCH.cx - w/2;
      ctx.fillStyle = i%2===0 ? "rgba(255,255,255,0.030)" : "rgba(0,0,0,0.030)";
      ctx.fillRect(xl, y, w, (PITCH.botY-PITCH.topY)/stripes);
    }

    // pitch border
    ctx.lineWidth=2;
    ctx.strokeStyle="rgba(255,205,90,0.18)";
    ctx.stroke();
    ctx.restore();
  }

  function drawGoalAndNet(){
    const x = GOAL.cx - GOAL.w/2;
    const y = GOAL.y;
    const w = GOAL.w;
    const h = GOAL.h;

    // net behind frame
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "rgba(255,255,255,0.20)";
    const cell = 16;
    const wave = state.netWave;
    for (let ix=0; ix<=w; ix+=cell){
      ctx.beginPath();
      const x0 = x + ix;
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + Math.sin((ix*0.08)+wave)*2.2, y+h);
      ctx.stroke();
    }
    for (let iy=0; iy<=h; iy+=cell){
      ctx.beginPath();
      const y0 = y + iy;
      ctx.moveTo(x, y0);
      ctx.lineTo(x+w, y0 + Math.sin((iy*0.10)+wave)*1.8);
      ctx.stroke();
    }
    ctx.restore();

    // goal frame
    ctx.save();
    ctx.lineWidth = GOAL.post;
    ctx.strokeStyle = "rgba(255,205,90,0.88)";
    ctx.shadowColor = "rgba(242,193,79,0.30)";
    ctx.shadowBlur = 14;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();

    // goal flash
    if (state.goalFlash>0){
      ctx.save();
      ctx.fillStyle = `rgba(255,223,122,${state.goalFlash})`;
      ctx.fillRect(x,y,w,h);
      ctx.restore();
    }
  }

  function drawKeeper(){
    // simple keeper silhouette, positioned inside goal mouth based on keeper.u
    const mouthX = GOAL.cx - (GOAL.w/2) + GOAL.mouthPad;
    const mouthW = GOAL.w - GOAL.mouthPad*2;
    const u = state.keeper.u;
    const x = mouthX + mouthW * u;
    const y = GOAL.y + GOAL.h - 18;

    // scale smaller for depth
    const s = 0.52;
    const bodyW = 90*s, bodyH = 140*s;

    // dive offset
    const t = state.keeper.diveT;
    const diveX = state.keeper.diving ? (state.keeper.targetU - 0.5) * 140 * clamp(t/0.35,0,1) : 0;
    const diveY = state.keeper.diving ? -40 * clamp(t/0.35,0,1) : 0;

    ctx.save();
    ctx.translate(x + diveX, y + diveY);
    ctx.rotate(state.keeper.diving ? (state.keeper.targetU<0.5 ? -0.18 : 0.18) * clamp(t/0.35,0,1) : 0);

    // shadow
    ctx.fillStyle="rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 10, 40, 10, 0, 0, Math.PI*2);
    ctx.fill();

    // body (dark kit)
    const grad = ctx.createLinearGradient(-40, -120, 40, 20);
    grad.addColorStop(0, "rgba(25,28,34,1)");
    grad.addColorStop(1, "rgba(10,12,15,1)");
    ctx.fillStyle = grad;

    // torso
    ctx.beginPath();
    ctx.roundRect(-bodyW/2, -bodyH, bodyW, bodyH*0.72, 18*s);
    ctx.fill();
    // head
    ctx.fillStyle="rgba(225,225,225,0.10)";
    ctx.beginPath();
    ctx.arc(0, -bodyH-18*s, 18*s, 0, Math.PI*2);
    ctx.fill();

    // arms
    ctx.fillStyle = "rgba(18,20,24,1)";
    ctx.beginPath();
    ctx.roundRect(-bodyW/2-22*s, -bodyH*0.82, 30*s, 80*s, 16*s);
    ctx.roundRect(bodyW/2-8*s, -bodyH*0.82, 30*s, 80*s, 16*s);
    ctx.fill();

    ctx.restore();
  }

  // Polyfill for roundRect in older browsers (very rare)
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

  function drawKicker(){
    // draw kicker near the ball, scaled to pitch depth
    const kp = project(KICKER_SPOT.u, KICKER_SPOT.v);
    const bp = project(BALL_SPOT.u, BALL_SPOT.v);
    const scale = 0.58; // smaller, more realistic

    const img = (state.phase==="kicked" && state.ball.flying) ? IMG.kickerKick : IMG.kickerIdle;

    const w = 280*scale;
    const h = 360*scale;

    // offset so kicker is slightly left of ball
    const x = kp.x - w/2 - 40;
    const y = kp.y - h + 10;

    // shadow
    ctx.save();
    ctx.fillStyle="rgba(0,0,0,0.30)";
    ctx.beginPath();
    ctx.ellipse(kp.x - 20, kp.y + 18, 70, 16, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.drawImage(img, x, y, w, h);

    // reset kick pose after short time
    if (state.phase==="kicked" && state.ball.flying){
      // nothing; we keep kick image briefly via timer below
    }
  }

  function drawBall(){
    const bp = project(state.ball.u, state.ball.v);
    const size = 38 * (1.05 - state.ball.v*0.55);

    // shadow
    ctx.save();
    ctx.fillStyle="rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.ellipse(bp.x+3, bp.y+14, 22, 9, 0, 0, Math.PI*2);
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
    ctx.strokeStyle=`rgba(255,223,122,${0.22 + power*0.70})`;
    ctx.shadowColor="rgba(242,193,79,0.55)";
    ctx.shadowBlur=16;
    ctx.beginPath();
    ctx.moveTo(state.aim.start.x, state.aim.start.y);
    ctx.lineTo(state.aim.now.x, state.aim.now.y);
    ctx.stroke();
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

  function update(dt){
    // keeper follow / dive
    if (state.keeper.diving){
      state.keeper.diveT += dt;
      // move u towards target quickly
      const k = clamp(dt*6.5, 0, 1);
      state.keeper.u = state.keeper.u + (state.keeper.targetU - state.keeper.u)*k;
      // stop dive after 0.5s
      if (state.keeper.diveT > 0.55) state.keeper.diving=false;
    } else {
      // return to center slowly
      state.keeper.u = state.keeper.u + (0.5 - state.keeper.u)*clamp(dt*1.8, 0, 1);
    }

    if (!state.ball.flying) return;

    // apply curve/spin: sideways influence increases with depth (as ball travels)
    const curveInfluence = state.ball.spin * (0.30 + state.ball.v*0.65);
    state.ball.du += curveInfluence * dt;

    state.ball.u += state.ball.du * dt;
    state.ball.v += state.ball.dv * dt;

    // drag + gravity in depth space
    state.ball.du *= (1 - 0.42*dt);
    state.ball.dv *= (1 - 0.18*dt);
    state.ball.dv -= 0.10 * dt; // "gravity" pulling v down slightly

    // net wave anim
    state.netWave += dt * 6.0;
    if (state.goalFlash>0) state.goalFlash = Math.max(0, state.goalFlash - dt*1.8);

    // keeper "save" check: if ball reaches goal plane and keeper aligns, it's saved
    // We approximate: when v > 0.92 we're at the goal line (near top)
    if (state.ball.v > 0.92) {
      const mouthU = clamp((state.ball.u - 0.5) / 0.5, -1, 1);
      const keeperU = clamp((state.keeper.u - 0.5) / 0.5, -1, 1);
      const close = Math.abs(mouthU - keeperU) < 0.26; // save width

      if (inGoalMouth() && !close) {
        // GOAL
        state.goalFlash = 0.45;
        state.netWave += 2.2;
      }
      // end shot either way
      state.ball.flying = false;

      // reset after short pause
      setTimeout(resetBall, 900);
      return;
    }

    // bounds (miss)
    if (state.ball.v < 0 || state.ball.u < -0.15 || state.ball.u > 1.15 || state.ball.v > 1.2){
      state.ball.flying = false;
      setTimeout(resetBall, 650);
    }
  }

  function render(){
    drawBackground();
    drawPitch();
    drawGoalAndNet();
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
      IMG.ball = ball;
      IMG.kickerIdle = idle;
      IMG.kickerKick = kick;

      // if kick sprite missing, fall back
      if (!IMG.kickerKick) IMG.kickerKick = IMG.kickerIdle;

      resetBall();

      // after shot, show kick pose briefly
      const origOnUp = onUp;
      // no override, rely on phase flag
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