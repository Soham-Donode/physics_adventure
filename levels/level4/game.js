const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const vp = document.getElementById('viewport');

initSharedAssets('../../');

window.addEventListener('resize', () => resizeCanvas(canvas, vp));
resizeCanvas(canvas, vp);

let state = 'menu'; // menu | playing | dead | won
let lastTime = 0;

const GROUND_Y = 800;
const V_MAN_PX = 300;   // 15 * 20
const V_ARROW_PX = 400; // 20 * 20
const TIME_TO_WIN = 5000;

let globalVars = {
  groundOffset: 0,
  timeSurvived: 0
};
let shieldAngle = 0;
let arrows = [];
let particles = [];

let player = new Player(600, GROUND_Y - 55, 35, 55);

function init() {
  requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(loop); });
}

function startGame() {
  shieldAngle = parseFloat(document.getElementById('angleInput').value) || 0;
  document.getElementById('algoDialog').style.display = 'none';
  state = 'playing';
  globalVars.timeSurvived = 0;
  arrows = [];
  particles = [];
}

function resetGame() {
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('algoDialog').style.display = 'block';
  arrows = [];
  particles = [];
  globalVars.groundOffset = 0;
  player.frame = 0;
  state = 'menu';
}

function showLose() {
  if (window.sounds) window.sounds.explode();
  document.getElementById('overlayTitle').textContent = '💥 Hit!';
  document.getElementById('overlayTitle').className = 'lose-text';
  document.getElementById('overlayMsg').textContent = 'You need to tilt the shield to perfectly block the relative velocity vector!';
  document.getElementById('retryBtn').style.display = 'inline-block';
  document.getElementById('nextLevelBtn').style.display = 'none';
  document.getElementById('overlay').classList.add('show');
}

function showWin() {
  if (window.sounds) window.sounds.win();
  document.getElementById('overlayTitle').textContent = '🏁 Level 4 Complete!';
  document.getElementById('overlayTitle').className = 'win-text';
  document.getElementById('overlayMsg').textContent = 'You survived the arrow rain by mastering relative velocity!';
  document.getElementById('retryBtn').style.display = 'none';
  document.getElementById('nextLevelBtn').style.display = 'inline-block';
  document.getElementById('overlay').classList.add('show');
}

function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (den === 0) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }
  return null;
}

function spawnParticles(x, y, color, n, particlesArr) {
  for (let i=0; i<n; i++) {
    particlesArr.push({
      x, y,
      vx: (Math.random() - 0.5) * 400,
      vy: (Math.random() - 0.5) * 400,
      life: 1,
      decay: 0.02 + Math.random() * 0.05,
      color: color,
      r: Math.random() * 3 + 1
    });
  }
}

function update(dt) {
  state = updateMovement(dt, player, state, globalVars, arrows, particles, TIME_TO_WIN, V_MAN_PX, V_ARROW_PX, shieldAngle, showLose, showWin, lineIntersect, spawnParticles);
  
  if (state === 'playing') {
    arrows = arrows.filter(a => a.active);
  }
  particles = particles.filter(p => p.life > 0);
}

function draw() {
  const W = canvas.width, H = canvas.height;
  
  if (assets.sky.complete) {
    ctx.drawImage(assets.sky, 0, 50, W, H - 50);
  }

  drawMountains(ctx, W, GROUND_Y, globalVars.groundOffset);
  drawGroundTiles(ctx, W, GROUND_Y, H, globalVars.groundOffset);
  
  if (state === 'playing' || state === 'dead') {
    drawShield();
  }
  
  if (state !== 'dead') {
    const running = state === 'playing';
    player.draw(ctx, assets.idle, assets.run, running);
  }
  
  drawArrows();
  drawParticles();

  // Progress Bar
  if (state === 'playing') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(W/2 - 200, 70, 400, 20);
    ctx.fillStyle = '#50f878';
    ctx.fillRect(W/2 - 198, 72, (globalVars.timeSurvived / TIME_TO_WIN) * 396, 16);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(W/2 - 200, 70, 400, 20);
    
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('SURVIVE', W/2, 60);
    ctx.textAlign = 'left';
  }
}



function drawShield() {
  const cx = player.x + player.w/2;
  const cy = player.y - 10;
  const len = 100;
  const angleRad = shieldAngle * Math.PI / 180;
  
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angleRad);
  
  ctx.strokeStyle = '#50f8f8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-len/2, 0);
  ctx.lineTo(len/2, 0);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(80, 248, 248, 0.4)';
  ctx.lineWidth = 12;
  ctx.stroke();

  ctx.restore();
}

function drawArrows() {
  ctx.strokeStyle = '#f8f8f8';
  ctx.lineWidth = 2;
  for (let arrow of arrows) {
    ctx.beginPath();
    ctx.moveTo(arrow.x, arrow.y);
    ctx.lineTo(arrow.x - arrow.vx * 0.04, arrow.y - arrow.vy * 0.04);
    ctx.stroke();
  }
}

function drawParticles() {
  for (let p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function loop(ts) {
  const dt = Math.min(ts - lastTime, 32);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.startGame = startGame;
window.resetGame = resetGame;

init();
