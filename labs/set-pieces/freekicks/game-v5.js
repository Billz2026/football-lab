// Football Lab • Free Kicks — Scale + Camera Fix (v5)
// Goal: make the scene feel less disjointed by fixing relative scale.
// - Smaller kicker + positioned naturally behind/side of the ball
// - Keeper scaled to fit inside the goal (not oversized)
// - Ball size/position tuned
// - Goal size reduced slightly and pushed back to feel deeper

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

  // Polyfill roundRect
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

  const loadImg = (src)=>new Promise((res,rej)=>{
    const i=new Image();
    i.onload=()=>res(i);
    i.onerror=()=>rej(new Error("Failed to load: "+src));
    i.src = src + (src.includes("?") ? "" : "?v=" + Date.now());
  });

  // --- Perspective pitch
  const PITCH = {
    topY: 78,
    botY: 528,
    topW: 480,
    botW: 920,
    cx: 480,
  };

  // Smaller goal, slightly higher to feel deeper
  const GOAL = {
    cx: 480,
    y: 88,
    w: 250,
    h: 135,
    post: 5,
    mouthPad: 14
  };

  // Places (u across 0..1, v depth 0..1 bottom->top)
  // NOTE: v bigger => closer to goal (top). Ball/kicker near bottom => small v.
  const KICKER_SPOT = { u: 0.47, v: 0.10 };
  const BALL_SPOT   = { u: 0.52, v: 0.075 };

  const state = {
    shots: 0,
    phase: "idle",
    aim: { active:false, start:null, now:null, power:0, curve:0 },
    ball: { u: BALL_SPOT.u, v: BALL_SPOT.v, du:0, dv:0, spin:0, flying:false },
    keeper: { u: 0.50, targetU:0.50, diving:false, diveT:0 },
    goalFlash: 0,
    netWave: 0,
  };

  function project(u, v){
    const y = PITCH.botY + (PITCH.topY - PITCH.botY) * v;
    const w = PITCH.botW + (PITCH.topW - PITCH.botW) * v;
    return { x: PITCH.cx + (u - 0.5) * w, y, w };
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

  // --- Input
  function onDown(evt){
    if (state.ball.flying) return;
    const p=getPointerPos(evt);
    const bp = project(state.ball.u, state.ball.v);
    const hit = dist(p.x,p.y,bp.x,bp.y) <= 30;
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
    const power = clamp(drag / 230, 0, 1);
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
    const power = clamp(drag / 230, 0, 1);

    const dirU = clamp(dx / 520, -0.55, 0.55);
    const dirV = clamp(dy / 420, -0.15, 1.0);

    // Slightly more power baseline than v4 so net is always reachable
    const strength = 0.85 + power * 1.65; // 0.85..2.5
    state.ball.du = dirU * 0.85 * strength;
    state.ball.dv = (0.95 + dirV * 0.75) * strength;
    state.ball.spin = clamp(dx / 250, -1, 1) * (0.55 + power*0.95);
    state.ball.flying = true;
    state.phase="kicked";
    state.shots += 1;
    if (elShots) elShots.textContent = String(state.shots);

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

  // --- Draw helpers
  function drawBackground(){
    const g=ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,"#050608");
    g.addColorStop(1,"#000000");
    ctx.fillStyle=g;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const band=ctx.createRadialGradient(480, 55, 10, 480, 55, 520);
    band.addColorStop(0,"rgba(255,205,90,0.12)");
    band.addColorStop(1,"rgba(255,205,90,0)");
    ctx.fillStyle=band;
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
    grad.addColorStop(1, "rgba(8,18,12,1)");
    ctx.fillStyle=grad;
    ctx.fill();
    ctx.clip();

    // stripes
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

    ctx.lineWidth=2;
    ctx.strokeStyle="rgba(255,205,90,0.16)";
    ctx.stroke();
    ctx.restore();
  }

  function drawGoalAndNet(){
    const x = GOAL.cx - GOAL.w/2;
    const y = GOAL.y;
    const w = GOAL.w;
    const h = GOAL.h;

    // net
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

    // frame
    ctx.save();
    ctx.lineWidth = GOAL.post;
    ctx.strokeStyle = "rgba(255,205,90,0.88)";
    ctx.shadowColor = "rgba(242,193,79,0.28)";
    ctx.shadowBlur = 12;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();

    if (state.goalFlash>0){
      ctx.save();
      ctx.fillStyle = `rgba(255,223,122,${state.goalFlash})`;
      ctx.fillRect(x,y,w,h);
      ctx.restore();
    }
  }

  function drawKeeper(){
    const mouthX = GOAL.cx - (GOAL.w/2) + GOAL.mouthPad;
    const mouthW = GOAL.w - GOAL.mouthPad*2;

    const x = mouthX + mouthW * state.keeper.u;
    const y = GOAL.y + GOAL.h - 14;

    // scaled smaller to fit goal
    const s = 0.44;
    const bodyW = 90*s, bodyH = 140*s;

    const t = state.keeper.diveT;
    const diveX = state.keeper.diving ? (state.keeper.targetU - 0.5) * 130 * clamp(t/0.35,0,1) : 0;
    const diveY = state.keeper.diving ? -32 * clamp(t/0.35,0,1) : 0;

    ctx.save();
    ctx.translate(x + diveX, y + diveY);
    ctx.rotate(state.keeper.diving ? (state.keeper.targetU<0.5 ? -0.16 : 0.16) * clamp(t/0.35,0,1) : 0);

    // shadow
    ctx.fillStyle="rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 9, 34, 9, 0, 0, Math.PI*2);
    ctx.fill();

    const grad = ctx.createLinearGradient(-40, -120, 40, 20);
    grad.addColorStop(0, "rgba(25,28,34,1)");
    grad.addColorStop(1, "rgba(10,12,15,1)");
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect(-bodyW/2, -bodyH, bodyW, bodyH*0.72, 18*s);
    ctx.fill();

    ctx.fillStyle="rgba(225,225,225,0.10)";
    ctx.beginPath();
    ctx.arc(0, -bodyH-18*s, 16*s, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = "rgba(18,20,24,1)";
    ctx.beginPath();
    ctx.roundRect(-bodyW/2-22*s, -bodyH*0.82, 30*s, 80*s, 16*s);
    ctx.roundRect(bodyW/2-8*s, -bodyH*0.82, 30*s, 80*s, 16*s);
    ctx.fill();

    ctx.restore();
  }

  function drawKicker(){
    const kp = project(KICKER_SPOT.u, KICKER_SPOT.v);

    // realistic-ish size: smaller than before
    const scale = 0.48;
    const img = (state.phase==="kicked" && state.ball.flying) ? IMG.kickerKick : IMG.kickerIdle;
    const w = 280*scale;
    const h = 360*scale;

    // place behind the ball (slightly lower on pitch) and slightly left
    const x = kp.x - w/2 - 28;
    const y = kp.y - h + 26;

    // shadow
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
    const size = 34 * (1.10 - state.ball.v*0.55);

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
    const power = clamp(drag/230, 0, 1);

    ctx.save();
    ctx.lineWidth=9;
    ctx.lineCap="round";
    ctx.strokeStyle=`rgba(255,223,122,${0.20 + power*0.75})`;
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
    // keeper movement
    if (state.keeper.diving){
      state.keeper.diveT += dt;
      const k = clamp(dt*6.5, 0, 1);
      state.keeper.u = state.keeper.u + (state.keeper.targetU - state.keeper.u)*k;
      if (state.keeper.diveT > 0.55) state.keeper.diving=false;
    } else {
      state.keeper.u = state.keeper.u + (0.5 - state.keeper.u)*clamp(dt*1.8, 0, 1);
    }

    if (!state.ball.flying) return;

    // curve
    const curveInfluence = state.ball.spin * (0.30 + state.ball.v*0.70);
    state.ball.du += curveInfluence * dt;

    state.ball.u += state.ball.du * dt;
    state.ball.v += state.ball.dv * dt;

    state.ball.du *= (1 - 0.42*dt);
    state.ball.dv *= (1 - 0.18*dt);
    state.ball.dv -= 0.095 * dt;

    state.netWave += dt * 6.0;
    if (state.goalFlash>0) state.goalFlash = Math.max(0, state.goalFlash - dt*1.8);

    // goal line
    if (state.ball.v > 0.92) {
      const mouthU = clamp((state.ball.u - 0.5) / 0.5, -1, 1);
      const keeperU = clamp((state.keeper.u - 0.5) / 0.5, -1, 1);
      const close = Math.abs(mouthU - keeperU) < 0.26;

      if (inGoalMouth() && !close) {
        state.goalFlash = 0.40;
        state.netWave += 2.0;
      }
      state.ball.flying = false;
      setTimeout(resetBall, 900);
      return;
    }

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
      IMG.kickerKick = kick || idle;
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