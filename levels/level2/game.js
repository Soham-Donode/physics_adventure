// ─── Canvas setup ───────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const vp = document.getElementById('viewport');

initSharedAssets('../../');

window.addEventListener('resize', () => resizeCanvas(canvas, vp));
resizeCanvas(canvas, vp);

// ─── Game state ─────────────────────────────────────────────────────────────
let state = 'playing'; // playing | moving | won
let lastTime = 0;
let gameTime = 0;

const CELL_SIZE = 80;
const COLS = 15;
const ROWS = 10; // y: 0 to 9
const GROUND_Y = 800;

const startPoint = {x: 2, y: 9};
const endPoint = {x: 12, y: 4};

let bresenhamPoints = [];
let plottedPixels = [];
let currentPlotIndex = 1;

let player = new Player(
  2 * CELL_SIZE + CELL_SIZE / 2 - 17.5, 
  GROUND_Y - 55, 
  35, 55
);
player.targetIndex = 1;

function calculateBresenham(x0, y0, x1, y1) {
  let pts = [];
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = (x0 < x1) ? 1 : -1;
  let sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while(true) {
    pts.push({x: x, y: y});
    if (x === x1 && y === y1) break;
    let e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return pts;
}

function init() {
  bresenhamPoints = calculateBresenham(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
  // Start from empty bridge, user clicks the first water block (point 1)
  plottedPixels = [];
  document.getElementById('pointInfo').textContent = `Points: ${currentPlotIndex}/${bresenhamPoints.length}`;
  requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(loop); });
}

// ─── Input ──────────────────────────────────────────────────────────────────
canvas.addEventListener('click', (e) => {
  if (state !== 'playing') return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const cx = (e.clientX - rect.left) * scaleX;
  const cy = (e.clientY - rect.top) * scaleY;

  const gx = Math.floor(cx / CELL_SIZE);
  const gy = Math.floor(cy / CELL_SIZE);

  if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
    checkPixel(gx, gy);
  }
});

function checkPixel(gx, gy) {
  if (currentPlotIndex >= bresenhamPoints.length) return;

  for(let i=0; i<currentPlotIndex; i++){
     if(bresenhamPoints[i].x === gx && bresenhamPoints[i].y === gy) return;
  }

  const nextP = bresenhamPoints[currentPlotIndex];

  if (gx === nextP.x && gy === nextP.y) {
    plottedPixels.push({x: gx, y: gy});
    currentPlotIndex++;
    
    document.getElementById('pointInfo').textContent = `Points: ${currentPlotIndex}/${bresenhamPoints.length}`;

    if (currentPlotIndex === bresenhamPoints.length) {
      showToast('Path Complete!', false);
      state = 'moving';
      player.targetIndex = 1;
    } else {
      showToast('Correct!', false);
    }
  } else {
    showToast('Wrong Pixel!', true);
  }
}

let toastTimeout;
function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.backgroundColor = isError ? '#c82000' : '#389828';
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 2000);
}

function showWin() {
  document.getElementById('overlay').classList.add('show');
}

function update(dt) {
  gameTime += dt;
  state = updateMovement(dt, player, state, bresenhamPoints, CELL_SIZE, showWin, canvas.width);
}

// ─── Rendering ───────────────────────────────────────────────────────────────
function draw() {
  const W = canvas.width, H = canvas.height;
  
  if (assets.sky.complete) {
    ctx.drawImage(assets.sky, 0, 50, W, H - 50);
  }

  drawMountains(ctx, W, GROUND_Y);
  drawWater(ctx, W, GROUND_Y, H, gameTime);
  drawGroundTiles(ctx, W, GROUND_Y, H, 0, 3 * CELL_SIZE, 11 * CELL_SIZE); // Gap starts at x=3, ends at x=11
  
  drawPlatform();
  drawGrid();
  drawPixels();
  drawLabels();
  
  const running = player.isRunning;
  player.draw(ctx, assets.idle, assets.run, running);
}

function drawPlatform() {
  const startX = endPoint.x;
  const startY = endPoint.y;
  const blocks = 4;

  for (let i = 0; i < blocks; i++) {
    const px = (startX + i) * CELL_SIZE;
    const py = startY * CELL_SIZE;

    if (assets.stone.complete) {
      ctx.drawImage(assets.stone, px, py, CELL_SIZE, CELL_SIZE);
    } else {
      ctx.fillStyle = '#a8a8a8';
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
    }
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
  }
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;

  for (let x=0; x<=COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x*CELL_SIZE, 0);
    ctx.lineTo(x*CELL_SIZE, ROWS*CELL_SIZE);
    ctx.stroke();
  }
  for (let y=0; y<=ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y*CELL_SIZE);
    ctx.lineTo(COLS*CELL_SIZE, y*CELL_SIZE);
    ctx.stroke();
  }
}

function drawPixels() {
  for (let i = 0; i < plottedPixels.length; i++) {
    const p = plottedPixels[i];
    const px = p.x * CELL_SIZE;
    const py = p.y * CELL_SIZE;

    // All bridge blocks are stone
    if (assets.stone.complete) {
      ctx.drawImage(assets.stone, px, py, CELL_SIZE, CELL_SIZE);
    } else {
      ctx.fillStyle = '#a8a8a8';
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
  }
}

function drawLabels() {
  ctx.fillStyle = '#50f878';
  ctx.font = '12px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('START', startPoint.x * CELL_SIZE + CELL_SIZE/2, startPoint.y * CELL_SIZE - 60);

  ctx.fillStyle = '#f8f878';
  ctx.fillText('END', endPoint.x * CELL_SIZE + CELL_SIZE/2, endPoint.y * CELL_SIZE - 20);
  ctx.textAlign = 'left';
}

function loop(ts) {
  const dt = Math.min(ts - lastTime, 32);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

init();
