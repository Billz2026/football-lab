// Football Lab • Free Kicks — Centered Goal + Net (v3)
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hint = document.getElementById("hint");

  const ASSETS = {
    player: "../../../assets/freekicks/player_idle.svg",
    ball: "../../../assets/freekicks/ball.svg",
  };

  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const dist = (ax,ay,bx,by)=>Math.hypot(ax-bx, ay-by);

  const loadImg = (src)=>new Promise((res,rej)=>{
    const i=new Image();
    i.onload=()=>res(i);
    i.onerror=()=>rej(new Error("Failed to load: "+src));
    i.src = src + (src.includes("?") ? "" : "?v=" + Date.now());
  });

  // --- Layout (centered goal)
  const PLAYER = { x: 480, y: 405, w: 260, h: 340 };
  const BALL_START = { x: 480, y: 455 };

  const GOAL = {
    x: 330, y: 90, w: 300, h: 160,
    mouth: { x: 340, y: 100, w: 280, h: 140 }
  };

  const state = {
    ball: { x: BALL_START.x, y: BALL_START.y, vx: 0, vy: 0, moving: false, r: 18 },
    aim: { active: false, start: null, now: null },
    goalFlash: 0
  };

  let IMG = { player:null, ball:null };

  function getPointerPos(evt){
    const r=canvas.getBoundingClientRect();
    const pt = evt.touches && evt.touches[0] ? evt.touches[0] : evt;
    return { x:(pt.clientX-r.left)*(canvas.width/r.width), y:(pt.clientY-r.top)*(canvas.height/r.height) };
  }

  function resetBall(){
    state.ball.x = BALL_START.x;
    state.ball.y = BALL_START.y;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.moving = false;
    state.aim.active=false;
    state.aim.start=null;
    state.aim.now=null;
    if (hint) hint.style.opacity="1";
  }

  // --- Input
  function onDown(evt){
    if (state.ball.moving) return;
    const p=getPointerPos(evt);
    if (dist(p.x,p.y,state.ball.x,state.ball.y) <= state.ball.r*2.8){
      state.aim.active=true;
      state.aim.start={ x: state.ball.x, y: state.ball.y };
      state.aim.now=p;
      if (hint) hint.style.opacity="0";
      evt.preventDefault?.();
    }
  }
  function onMove(evt){
    if (!state.aim.active) return;
    state.aim.now=getPointerPos(evt);
    evt.preventDefault?.();
  }
  function onUp(evt){
    if (!state.aim.active) return;
    state.aim.active=false;

    const end = state.aim.now || getPointerPos(evt);
    const dx = state.aim.start.x - end.x;
    const dy = state.aim.start.y - end.y;
    const drag = Math.hypot(dx,dy);
    const power = clamp(drag/260, 0, 1);

    state.ball.vx = clamp(dx/260, -1, 1) * (420 + power*420);
    state.ball.vy = clamp(dy/260, -1, 1) * (420 + power*420) - (220 + power*220);

    state.ball.moving=true;
    state.aim.start=null;
    state.aim.now=null;
    evt.preventDefault?.();
  }

  canvas.addEventListener("mousedown", onDown);
  canvas.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener("touchstart", onDown, { passive:false });
  canvas.addEventListener("touchmove", onMove, { passive:false });
  canvas.addEventListener("touchend", onUp, { passive:false });

  // --- Drawing
  function drawBackground(){
    const g=ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,"#050608"); g.addColorStop(1,"#000");
    ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  function drawPitch(){
    ctx.save();
    ctx.fillStyle="#0e2016";
    ctx.fillRect(60,80,840,420);
    for (let i=0;i<12;i++){
      ctx.fillStyle = i%2===0 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
      ctx.fillRect(60,80+i*(420/12),840,420/12);
    }
    ctx.strokeStyle="rgba(255,205,90,0.20)";
    ctx.lineWidth=2; ctx.strokeRect(60,80,840,420);
    ctx.restore();
  }
  function drawGoal(){
    ctx.save();
    ctx.lineWidth=5;
    ctx.strokeStyle="rgba(255,205,90,0.8)";
    ctx.shadowColor="rgba(242,193,79,0.35)";
    ctx.shadowBlur=18;
    ctx.strokeRect(GOAL.x,GOAL.y,GOAL.w,GOAL.h);
    ctx.restore();

    // net
    ctx.save();
    ctx.strokeStyle="rgba(255,255,255,0.18)";
    for(let x=GOAL.x+10;x<GOAL.x+GOAL.w;x+=16){
      ctx.beginPath(); ctx.moveTo(x,GOAL.y+10); ctx.lineTo(x,GOAL.y+GOAL.h-10); ctx.stroke();
    }
    for(let y=GOAL.y+10;y<GOAL.y+GOAL.h;y+=16){
      ctx.beginPath(); ctx.moveTo(GOAL.x+10,y); ctx.lineTo(GOAL.x+GOAL.w-10,y); ctx.stroke();
    }
    ctx.restore();

    if (state.goalFlash>0){
      ctx.save();
      ctx.fillStyle=`rgba(255,223,122,${state.goalFlash})`;
      ctx.fillRect(GOAL.x,GOAL.y,GOAL.w,GOAL.h);
      ctx.restore();
    }
  }
  function drawPlayer(){
    const x=PLAYER.x-PLAYER.w/2, y=PLAYER.y-PLAYER.h;
    ctx.drawImage(IMG.player,x,y,PLAYER.w,PLAYER.h);
  }
  function drawBall(){
    const size=42;
    ctx.drawImage(IMG.ball,state.ball.x-size/2,state.ball.y-size/2,size,size);
  }
  function drawAim(){
    if(!state.aim.active||!state.aim.start||!state.aim.now) return;
    ctx.save();
    ctx.lineWidth=8; ctx.lineCap="round";
    ctx.strokeStyle="rgba(255,223,122,0.7)";
    ctx.beginPath();
    ctx.moveTo(state.aim.start.x,state.aim.start.y);
    ctx.lineTo(state.aim.now.x,state.aim.now.y);
    ctx.stroke();
    ctx.restore();
  }

  function update(dt){
    if(!state.ball.moving) return;
    state.ball.x+=state.ball.vx*dt;
    state.ball.y+=state.ball.vy*dt;
    state.ball.vx*= (1-0.45*dt);
    state.ball.vy*= (1-0.18*dt);
    state.ball.vy+=520*dt;

    // goal detection
    if (
      state.ball.x>GOAL.mouth.x && state.ball.x<GOAL.mouth.x+GOAL.mouth.w &&
      state.ball.y>GOAL.mouth.y && state.ball.y<GOAL.mouth.y+GOAL.mouth.h
    ){
      state.goalFlash=0.6;
      state.ball.moving=false;
      setTimeout(resetBall, 900);
    }

    if (state.goalFlash>0) state.goalFlash=Math.max(0,state.goalFlash-dt*1.8);

    if (state.ball.x<0||state.ball.x>canvas.width||state.ball.y<0||state.ball.y>canvas.height){
      resetBall();
    }
  }

  let last=performance.now();
  function loop(now){
    const dt=clamp((now-last)/1000,0,0.033); last=now;
    update(dt);
    drawBackground();
    drawPitch();
    drawGoal();
    drawPlayer();
    drawBall();
    drawAim();
    requestAnimationFrame(loop);
  }

  async function boot(){
    const [p,b]=await Promise.all([loadImg(ASSETS.player),loadImg(ASSETS.ball)]);
    IMG.player=p; IMG.ball=b;
    resetBall();
    requestAnimationFrame(loop);
  }
  boot();
})();