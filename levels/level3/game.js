const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const vp = document.getElementById('viewport');

initSharedAssets('../../');

window.addEventListener('resize', () => resizeCanvas(canvas, vp));
resizeCanvas(canvas, vp);

let state = 'playing'; // playing | moving | won
let lastTime = 0;
let gameTime = 0;

const GROUND_Y = 800;

let player = new Player(100, GROUND_Y - 55, 35, 55);

let wood = {
  initialX: 800,
  initialY: 400,
  initialAngle: 60,
  x: 800,
  y: 400,
  angle: 60,
  w: 440,
  h: 40,
  animating: false,
  animProgress: 0,
  startX: 800,
  startY: 400,
  startAngle: 60,
  targetX: 800,
  targetY: 400,
  targetAngle: 60
};

function init() {
  requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(loop); });
}

function applyTransform() {
  if (state !== 'playing' || wood.animating) return;

  const tx = parseFloat(document.getElementById('txInput').value) || 0;
  const ty = parseFloat(document.getElementById('tyInput').value) || 0;
  const rot = parseFloat(document.getElementById('rotInput').value) || 0;

  wood.targetX = wood.initialX + tx;
  wood.targetY = wood.initialY + ty;
  wood.targetAngle = wood.initialAngle + rot;
  
  wood.animating = true;
  wood.animProgress = 0;
  
  wood.startX = wood.x;
  wood.startY = wood.y;
  wood.startAngle = wood.angle;
}

function resetWood() {
  if (state !== 'playing' || wood.animating) return;

  document.getElementById('txInput').value = 0;
  document.getElementById('tyInput').value = 0;
  document.getElementById('rotInput').value = 0;

  wood.targetX = wood.initialX;
  wood.targetY = wood.initialY;
  wood.targetAngle = wood.initialAngle;
  
  wood.animating = true;
  wood.animProgress = 0;
  
  wood.startX = wood.x;
  wood.startY = wood.y;
  wood.startAngle = wood.angle;
}

let toastTimeout;
function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.backgroundColor = isError ? '#c82000' : '#389828';
  t.classList.add('show');
  clearTimeout(toastTimeout);
  if (isError && window.sounds) window.sounds.lose();
  toastTimeout = setTimeout(() => t.classList.remove('show'), 2000);
}

function checkWinCondition() {
  const angMod = Math.abs(wood.angle) % 180;
  const isAngleCorrect = angMod < 5 || Math.abs(angMod - 180) < 5;

  const isCorrect = 
    Math.abs(wood.x - 600) < 5 && 
    Math.abs(wood.y - 800) < 5 && 
    isAngleCorrect;

  if (isCorrect) {
    if (window.sounds) window.sounds.win();
    showToast('Perfect Transformation!', false);
    state = 'moving';
  } else {
    if (wood.x !== wood.initialX || wood.y !== wood.initialY || wood.angle !== wood.initialAngle) {
      showToast('Incorrect Placement!', true);
    }
  }
}

function update(dt) {
  gameTime += dt;
  state = updateMovement(dt, player, state, wood, checkWinCondition, GROUND_Y);
}

function draw() {
  const W = canvas.width, H = canvas.height;
  
  if (assets.sky.complete) {
    ctx.drawImage(assets.sky, 0, 50, W, H - 50);
  }

  drawMountains(ctx, W, GROUND_Y);
  drawWater(ctx, W, GROUND_Y, H, gameTime);
  drawGroundTiles(ctx, W, GROUND_Y, H, 0, 400, 800);
  
  drawWood();
  const running = Math.abs(player.vx) > 0 || Math.abs(player.vy) > 0;
  player.draw(ctx, assets.idle, assets.run, running);
}



function drawWood() {
  ctx.save();
  ctx.translate(600, 800);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(-wood.w/2, -wood.h/2, wood.w, wood.h);
  
  ctx.beginPath();
  ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
  ctx.moveTo(0, -10); ctx.lineTo(0, 10);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(wood.x, wood.y);
  ctx.rotate(wood.angle * Math.PI / 180);
  
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.setLineDash([5, 5]);
  ctx.moveTo(0, 0);
  ctx.lineTo(150, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(-wood.w/2, -wood.h/2, wood.w, wood.h);
  
  ctx.strokeStyle = '#5c3a21';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-wood.w/2 + 10, -wood.h/2 + 10);
  ctx.lineTo(wood.w/2 - 10, -wood.h/2 + 10);
  ctx.moveTo(-wood.w/2 + 20, 0);
  ctx.lineTo(wood.w/2 - 20, 0);
  ctx.moveTo(-wood.w/2 + 10, wood.h/2 - 10);
  ctx.lineTo(wood.w/2 - 10, wood.h/2 - 10);
  ctx.stroke();

  ctx.strokeStyle = '#3e2723';
  ctx.lineWidth = 4;
  ctx.strokeRect(-wood.w/2, -wood.h/2, wood.w, wood.h);
  
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function loop(ts) {
  const dt = Math.min(ts - lastTime, 32);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Map globally needed functions for buttons
window.applyTransform = applyTransform;
window.resetWood = resetWood;

init();
