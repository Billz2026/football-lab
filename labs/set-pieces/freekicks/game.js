// Auto-load Free Kicks (no overlays, no ready state)
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const ASSETS = {
    player: "../../../assets/freekicks/player_idle.svg",
    ball: "../../../assets/freekicks/ball.svg",
  };

  const load = src => new Promise(r => {
    const i = new Image();
    i.onload = () => r(i);
    i.src = src;
  });

  let player, ball;

  async function boot() {
    player = await load(ASSETS.player);
    ball = await load(ASSETS.ball);
    requestAnimationFrame(loop);
  }

  function loop() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#0a0f0a";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.drawImage(player, 200, 180, 220, 320);
    ctx.drawImage(ball, 360, 430, 36, 36);

    requestAnimationFrame(loop);
  }

  boot();
})();
