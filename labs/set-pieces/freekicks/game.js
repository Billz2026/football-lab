const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const overlay = document.getElementById('overlay');
const nextBtn = document.getElementById('nextBtn');
const retryBtn = document.getElementById('retryBtn');

const ballImg = new Image();
ballImg.src = './ball.svg';

const playerIdle = new Image();
playerIdle.src = './player_idle.svg';

const playerKick = new Image();
playerKick.src = './player_kick.svg';

let kicked = false;

canvas.addEventListener('click', () => {
  kicked = true;
  setTimeout(() => {
    overlay.hidden = false;
  }, 600);
});

nextBtn.onclick = () => location.reload();
retryBtn.onclick = () => location.reload();

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.drawImage(playerIdle, 250, 180, 220, 320);
  ctx.drawImage(ballImg, 420, 380, 40, 40);

  if (kicked) {
    ctx.drawImage(playerKick, 250, 180, 220, 320);
  }

  requestAnimationFrame(draw);
}

draw();
