/* Football Lab - Set Pieces Lab (Canvas)
   - Drag to aim, release to shoot
   - Hit the glowing target to complete the level
   - Next level unlocks and saves via localStorage
*/

const STORE_KEY = "footballlab_progress_v1";
const LEVELS = window.SET_PIECES_LEVELS || [];

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hudLevel = document.getElementById("hudLevel");
const hudShots = document.getElementById("hudShots");
const hudWind  = document.getElementById("hudWind");

const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const backBtn = document.getElementById("backBtn");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayNext = document.getElementById("overlayNext");
const overlayRetry = document.getElementById("overlayRetry");

function readProgress(){
  try{ return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; }catch{ return {}; }
}
function writeProgress(p){ localStorage.setItem(STORE_KEY, JSON.stringify(p)); }

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function dist(ax, ay, bx, by){ return Math.hypot(ax-bx, ay-by); }

// World layout (in canvas pixels)
const world = {
  w: canvas.width,
  h: canvas.height,
  // goal is drawn in the upper area
  goal: { x: 120, y: 70, w: 720, h: 220 },
  ballStart: { x: canvas.width * 0.50, y: canvas.height * 0.82 },
};

const state = {
  levelIndex: 0,
  shotsTaken: 0,
  shotsLimit: 0,
  wind: 0,
  target: { x: 0, y: 0, r: 0 },

  ball: { x: world.ballStart.x, y: world.ballStart.y, vx: 0, vy: 0, r: 18, moving: false },
  aiming: false,
  aimStart: null,
  aimNow: null,

  levelComplete: false,
  levelFailed: false,
};

function getUnlockedLevel(){
  const p = readProgress();
  return (p.setPieces && p.setPieces.unlockedLevel) ? p.setPieces.unlockedLevel : 1;
}
function setUnlockedLevel(n){
  const p = readProgress();
  p.setPieces = p.setPieces || {};
  p.setPieces.unlockedLevel = Math.max(p.setPieces.unlockedLevel || 1, n);
  writeProgress(p);
}

function loadLevel(index){
  const unlocked = getUnlockedLevel();
  // keep within available
  index = clamp(index, 0, Math.max(LEVELS.length - 1, 0));
  // prevent loading beyond unlocked (but allow if already unlocked)
  if (LEVELS[index] && LEVELS[index].id > unlocked) index = unlocked - 1;

  state.levelIndex = index;
  state.levelComplete = false;
  state.levelFailed = false;

  const L = LEVELS[index];
  state.shotsTaken = 0;
  state.shotsLimit = L.shots;
  state.wind = L.wind;

  // target position inside the goal based on relative coords
  state.target.x = world.goal.x + world.goal.w * L.target.x;
  state.target.y = world.goal.y + world.goal.h * L.target.y;
  state.target.r = world.goal.h * L.target.r;

  resetBall();
  updateHUD();
  nextBtn.disabled = true;
  hideOverlay();
}

function resetBall(){
  state.ball.x = world.ballStart.x;
  state.ball.y = world.ballStart.y;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.moving = false;
}

function updateHUD(){
  const L = LEVELS[state.levelIndex];
  hudLevel.textContent = String(L.id);
  hudShots.textContent = `${state.shotsTaken}/${state.shotsLimit}`;
  hudWind.textContent = `${state.wind.toFixed(2)}`;
}

function showOverlay(title, text, canNext){
  overlay.hidden = false;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayNext.style.display = canNext ? "inline-flex" : "none";
}
function hideOverlay(){ overlay.hidden = true; }

function currentLevel(){ return LEVELS[state.levelIndex]; }

function tryComplete(){
  state.levelComplete = true;
  // unlock next level (if exists)
  const L = currentLevel();
  const nextId = L.id + 1;
  if (LEVELS.some(x => x.id === nextId)) setUnlockedLevel(nextId);
  nextBtn.disabled = false;

  const hasNext = LEVELS.some(x => x.id === nextId);
  showOverlay("LEVEL COMPLETE", hasNext ? "Nice finish. Ready for the next level?" : "You finished the current build. More levels coming soon.", hasNext);
}

function failLevel(){
  state.levelFailed = true;
  showOverlay("OUT OF SHOTS", "Retry the level and adjust your aim/power.", false);
}

function nextLevel(){
  const L = currentLevel();
  const nextIndex = LEVELS.findIndex(x => x.id === L.id + 1);
  if (nextIndex !== -1) loadLevel(nextIndex);
}

function restartLevel(){ loadLevel(state.levelIndex); }

// Input handling (mouse + touch)
function getCanvasPos(evt){
  const rect = canvas.getBoundingClientRect();
  const isTouch = evt.touches && evt.touches[0];
  const clientX = isTouch ? evt.touches[0].clientX : evt.clientX;
  const clientY = isTouch ? evt.touches[0].clientY : evt.clientY;
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
}

function pointerDown(evt){
  if (state.levelComplete || state.levelFailed) return;
  if (state.ball.moving) return;

  const p = getCanvasPos(evt);
  // allow aim start near the ball
  if (dist(p.x, p.y, state.ball.x, state.ball.y) <= state.ball.r * 2.2){
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

  // power from drag distance
  const drag = Math.hypot(dx, dy);
  const power = clamp(drag / 260, 0, 1);

  // direction normalized
  const len = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / len;
  const uy = dy / len;

  // shoot
  state.ball.vx = ux * (10 + 20 * power);
  state.ball.vy = uy * (10 + 20 * power);
  state.ball.moving = true;

  state.shotsTaken += 1;
  updateHUD();

  // clear aim
  state.aimStart = null;
  state.aimNow = null;
}

canvas.addEventListener("mousedown", pointerDown);
window.addEventListener("mousemove", pointerMove);
window.addEventListener("mouseup", pointerUp);

canvas.addEventListener("touchstart", pointerDown, { passive:false });
window.addEventListener("touchmove", pointerMove, { passive:false });
window.addEventListener("touchend", pointerUp, { passive:false });

// Buttons
nextBtn.addEventListener("click", nextLevel);
restartBtn.addEventListener("click", restartLevel);
backBtn.addEventListener("click", () => location.href = "../../index.html");

overlayNext.addEventListener("click", () => { hideOverlay(); nextLevel(); });
overlayRetry.addEventListener("click", () => { hideOverlay(); restartLevel(); });

// Physics + game loop
function step(){
  // update ball if moving
  if (state.ball.moving && !state.levelComplete && !state.levelFailed){
    // wind drift
    state.ball.vx += state.wind * 0.03;

    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;

    // simple gravity + damping
    state.ball.vy += 0.22;
    state.ball.vx *= 0.992;
    state.ball.vy *= 0.992;

    // bounce off side walls
    if (state.ball.x < state.ball.r){
      state.ball.x = state.ball.r;
      state.ball.vx *= -0.55;
    }
    if (state.ball.x > world.w - state.ball.r){
      state.ball.x = world.w - state.ball.r;
      state.ball.vx *= -0.55;
    }

    // stop if slow / out of bounds
    if (state.ball.y > world.h + 80 || (Math.abs(state.ball.vx) + Math.abs(state.ball.vy) < 0.35 && state.ball.y > world.h * 0.78)){
      state.ball.moving = false;
      resetBall();

      if (!state.levelComplete){
        if (state.shotsTaken >= state.shotsLimit) failLevel();
      }
    }

    // check target hit (only when ball is inside goal area)
    const inGoalArea = (
      state.ball.x > world.goal.x &&
      state.ball.x < world.goal.x + world.goal.w &&
      state.ball.y > world.goal.y &&
      state.ball.y < world.goal.y + world.goal.h
    );

    if (inGoalArea){
      if (dist(state.ball.x, state.ball.y, state.target.x, state.target.y) <= state.target.r){
        state.ball.moving = false;
        tryComplete();
      }
    }
  }

  render();
  requestAnimationFrame(step);
}

function drawGlowCircle(x,y,r){
  ctx.save();
  const g = ctx.createRadialGradient(x,y, r*0.15, x,y, r*1.25);
  g.addColorStop(0, "rgba(255,223,122,.85)");
  g.addColorStop(0.55, "rgba(242,193,79,.30)");
  g.addColorStop(1, "rgba(242,193,79,0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x,y,r*1.25,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function render(){
  ctx.clearRect(0,0,world.w,world.h);

  // background pitch-ish gradient
  const bg = ctx.createLinearGradient(0,0,0,world.h);
  bg.addColorStop(0,"rgba(10,12,15,1)");
  bg.addColorStop(1,"rgba(5,6,7,1)");
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,world.w,world.h);

  // subtle grid
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "rgba(255,205,90,.35)";
  for (let x=0; x<world.w; x+=40){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,world.h); ctx.stroke();
  }
  for (let y=0; y<world.h; y+=40){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(world.w,y); ctx.stroke();
  }
  ctx.restore();

  // goal frame
  ctx.save();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(255,205,90,.85)";
  ctx.shadowColor = "rgba(242,193,79,.45)";
  ctx.shadowBlur = 18;
  ctx.strokeRect(world.goal.x, world.goal.y, world.goal.w, world.goal.h);
  ctx.restore();

  // net lines (simple)
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "rgba(255,205,90,.55)";
  for (let x=world.goal.x; x<=world.goal.x+world.goal.w; x+=28){
    ctx.beginPath(); ctx.moveTo(x, world.goal.y); ctx.lineTo(x, world.goal.y+world.goal.h); ctx.stroke();
  }
  for (let y=world.goal.y; y<=world.goal.y+world.goal.h; y+=22){
    ctx.beginPath(); ctx.moveTo(world.goal.x, y); ctx.lineTo(world.goal.x+world.goal.w, y); ctx.stroke();
  }
  ctx.restore();

  // target
  drawGlowCircle(state.target.x, state.target.y, state.target.r);
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,223,122,.95)";
  ctx.beginPath();
  ctx.arc(state.target.x, state.target.y, state.target.r, 0, Math.PI*2);
  ctx.stroke();
  ctx.restore();

  // ball
  ctx.save();
  ctx.fillStyle = "rgba(255,223,122,.95)";
  ctx.shadowColor = "rgba(242,193,79,.45)";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI*2);
  ctx.fill();

  // ball inner detail
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "rgba(0,0,0,.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.r*0.55, 0, Math.PI*2);
  ctx.stroke();
  ctx.restore();

  // aim line
  if (state.aiming && state.aimStart && state.aimNow){
    const dx = state.aimStart.x - state.aimNow.x;
    const dy = state.aimStart.y - state.aimNow.y;
    const drag = Math.hypot(dx, dy);
    const power = clamp(drag / 260, 0, 1);

    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = `rgba(255,223,122,${0.25 + power*0.65})`;
    ctx.shadowColor = "rgba(242,193,79,.55)";
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.moveTo(state.ball.x, state.ball.y);
    ctx.lineTo(state.aimNow.x, state.aimNow.y);
    ctx.stroke();

    // power bar
    const px = 24, py = world.h - 28, pw = 220, ph = 10;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,205,90,.55)";
    ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = "rgba(255,223,122,.95)";
    ctx.fillRect(px, py, pw*power, ph);

    ctx.restore();
  }

  // text overlays in canvas (small)
  ctx.save();
  ctx.font = "700 14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillStyle = "rgba(255,255,255,.70)";
  const L = currentLevel();
  ctx.fillText(`Set Pieces • ${L.name}`, 22, 28);
  ctx.restore();
}

// boot
(function boot(){
  // start at highest unlocked level, but clamp to available
  const unlocked = getUnlockedLevel();
  const startIndex = Math.max(0, LEVELS.findIndex(x => x.id === unlocked));
  loadLevel(startIndex === -1 ? 0 : startIndex);
  step();
})();
