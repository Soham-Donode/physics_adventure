// ─── Canvas setup ───────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const vp = document.getElementById('viewport');

initSharedAssets('../../');
const villianImg = new Image();
villianImg.src = '../../assets/villian.png';
const cannonImg = new Image();
cannonImg.src = '../../assets/cannon.png';

window.addEventListener('resize', () => resizeCanvas(canvas, vp));
resizeCanvas(canvas, vp);

// ─── Constants ──────────────────────────────────────────────────────────────
const GRAVITY_PLAYER = 0.4;    // canvas pixels/frame² (feel-based)
const SCALE          = 14;     // Increased zoom (px per "meter")
const G_PHYSICS      = 9.8;    // m/s² (real world gravity)
const SLOW_MO        = 1.0;    // real-time speed for better action
const GROUND_Y       = () => canvas.height - 80;
const HUD_H          = 50;

// ─── Game state ─────────────────────────────────────────────────────────────
let state = 'playing'; // playing | dead | won
let keys  = {};
let shake = 0;
let muzzleFlash = 0;
let hitEffects = []; // {x, y, text, life}

let player = new Player(80, 0, 35, 55);
player.onGround = false;
player.nearCannon = false;

// ─── Cannon ─────────────────────────────────────────────────────────────────
const cannon = {
  x: 60, y: 0, w: 180, h: 108,
  angle: 45,   // degrees
};

// ─── Projectile ─────────────────────────────────────────────────────────────
let projectile = null;

// ─── Enemies ────────────────────────────────────────────────────────────────
let enemies = [];
function makeEnemies() {
  const gY   = GROUND_Y();
  const EW   = 68, EH = 75;
  const midCx = (cannon.x + cannon.w) + 45 * SCALE; 
  const midX  = midCx - EW / 2;
  enemies = [
    { x: midX - 100, y: gY - EH, w: EW, h: EH, alive: true, wobble: 0 },
    { x: midX,       y: gY - EH, w: EW, h: EH, alive: true, wobble: Math.PI/3 },
    { x: midX + 100, y: gY - EH, w: EW, h: EH, alive: true, wobble: Math.PI*0.7 },
  ];
}

// ─── Platforms ──────────────────────────────────────────────────────────────
let platforms = [];
function makePlatforms() {
  const gY = GROUND_Y();
  platforms = [
    { x: 0, y: gY, w: canvas.width, h: 80 }, // ground only
  ];
}

// ─── Particles (death/hit effects) ──────────────────────────────────────────
let particles = [];
function spawnParticles(x, y, color, n=14) {
  for (let i=0; i<n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 4 + 1;
    particles.push({
      x, y,
      vx: Math.cos(a)*s, vy: Math.sin(a)*s - 2,
      life: 1, decay: Math.random()*0.03+0.02,
      r: Math.random()*6+2,
      color,
    });
  }
}

// ─── Input ──────────────────────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  const dialogOpen = document.getElementById('cannonDialog').classList.contains('show');
  if (dialogOpen) {
    if (e.code === 'Enter') shootCannon();
    if (e.code === 'Escape') closeDialog();
    return;
  }
  keys[e.code] = true;
  if (e.code === 'KeyE' && player.nearCannon && !projectile && state === 'playing') {
    openDialog();
  }
  if (e.code !== 'F5') e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ─── Dialog helpers ──────────────────────────────────────────────────────────
function openDialog() {
  document.getElementById('cannonDialog').classList.add('show');
}
function closeDialog() {
  document.getElementById('cannonDialog').classList.remove('show');
}
function shootCannon() {
  const angleDeg = parseFloat(document.getElementById('angleInput').value);
  const speed    = parseFloat(document.getElementById('speedInput').value);
  if (isNaN(angleDeg) || isNaN(speed)) return;
  const angle = (Math.clamp ? Math.clamp : clamp)(angleDeg, 0, 90) * Math.PI / 180;
  const sv    = clamp(speed, 10, 150);

  const pxSpeedPerSec = sv * SCALE;

  projectile = {
    x:  cannon.x + cannon.w,
    y:  cannon.y + cannon.h / 2,
    vx: Math.cos(angle) * pxSpeedPerSec,
    vy: -Math.sin(angle) * pxSpeedPerSec,
    t:  0,
    trail: [],
    slowFactor: SLOW_MO,
    physAngle: angleDeg,
    physSpeed: sv,
  };
  cannon.angle = angleDeg;
  closeDialog();
  shake = 8;
  muzzleFlash = 1;
  if (window.sounds) window.sounds.shoot();
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ─── Physics update ──────────────────────────────────────────────────────────
let lastTime = 0;
function update(dt) {
  const gY = GROUND_Y();
  cannon.y = gY - cannon.h;

  state = updateMovement(dt, player, state, keys, platforms, GRAVITY_PLAYER, canvas, enemies, showWin, GROUND_Y, shake, muzzleFlash, hitEffects, particles, projectile, SLOW_MO, SCALE, G_PHYSICS, spawnParticles, clearProjectile, restartGame, showHint);

  if (state !== 'playing') return;

  enemies.forEach(e => { e.wobble += 0.05; });

  if (projectile) {
    const dtS = (dt / 1000) * projectile.slowFactor;
    const steps = 3;
    const sDt = dtS / steps;
    for (let i = 0; i < steps; i++) {
      projectile.vy += (G_PHYSICS * SCALE) * sDt;
      projectile.x  += projectile.vx * sDt;
      projectile.y  += projectile.vy * sDt;
      
      if (i === 0 && Math.random() > 0.5) projectile.trail.push({x: projectile.x, y: projectile.y});
    }

    if (projectile.trail.length > 30) projectile.trail.shift();

    if (projectile.y > gY) {
      spawnParticles(projectile.x, gY, '#c87020', 8);
      clearProjectile();
    }

    if (!projectile) return;

    for (const e of enemies) {
      if (!e.alive) continue;
      if (projectile.x > e.x && projectile.x < e.x + e.w &&
          projectile.y > e.y && projectile.y < e.y + e.h) {
        e.alive = false;
        shake = 12;
        spawnParticles(e.x + e.w/2, e.y + e.h/2, '#ff5050', 28);
        spawnParticles(e.x + e.w/2, e.y + e.h/2, '#ffcc00', 16);
        hitEffects.push({x: e.x + e.w/2, y: e.y - 20, text: 'BOOM!', life: 1});
        if (window.sounds) window.sounds.explode();
        document.getElementById('enemyCount').textContent =
          'Enemies: ' + enemies.filter(x => x.alive).length;
        clearProjectile();
        if (enemies.every(x => !x.alive)) {
          showHint('All enemies eliminated! Go to the right edge!');
        }
        break;
      }
    }

    if (!projectile) return;

    if (projectile.x > canvas.width + 20 || projectile.x < -20) {
      clearProjectile();
    }
  }

  if (shake > 0) shake *= 0.9;
  if (muzzleFlash > 0) muzzleFlash -= 0.1;
  
  hitEffects.forEach(h => h.life -= 0.02);
  hitEffects = hitEffects.filter(h => h.life > 0);

  particles.forEach(p => {
    p.x   += p.vx; p.y   += p.vy; p.vy  += 0.1;
    p.life -= p.decay;
  });
  particles = particles.filter(p => p.life > 0);
}

function clearProjectile() {
  projectile = null;
}

// ─── Rendering ───────────────────────────────────────────────────────────────
function draw() {
  const W = canvas.width, H = canvas.height;
  const gY = GROUND_Y();

  if (assets.sky.complete) {
    ctx.drawImage(assets.sky, 0, HUD_H, W, H - HUD_H);
  }

  ctx.save();
  if (shake > 1) {
    ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake);
  }

  drawMountains(ctx, W, gY);
  drawGroundTiles(ctx, W, gY, H);
  drawDistanceLabels(gY);

  if (enemies.every(e => !e.alive)) {
    ctx.fillStyle = 'rgba(80,255,80,0.1)';
    ctx.fillRect(W - 40, gY - 300, 40, 300);
    ctx.strokeStyle = '#50f878';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W - 40, gY - 320);
    ctx.lineTo(W - 40, gY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#50f878';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('GOAL >', W - 50, gY - 320);
    ctx.textAlign = 'left';
  }

  drawCannon();

  if (projectile && projectile.trail.length > 1) {
    for (let i=1; i<projectile.trail.length; i++) {
      const t = projectile.trail[i];
      const t0 = projectile.trail[i-1];
      const alpha = i / projectile.trail.length * 0.7;
      ctx.strokeStyle = `rgba(255,180,50,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t0.x, t0.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }
    drawPredictedPath();
  }

  if (projectile) {
    const glowGrad = ctx.createRadialGradient(
      projectile.x, projectile.y, 0,
      projectile.x, projectile.y, 14
    );
    glowGrad.addColorStop(0, '#fff8e0');
    glowGrad.addColorStop(0.3, '#ffcc40');
    glowGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 14, 0, Math.PI*2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 7, 0, Math.PI*2);
    ctx.fillStyle = '#ff8800';
    ctx.fill();
    ctx.strokeStyle = '#ffcc40';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  for (const e of enemies) {
    if (!e.alive) continue;
    drawEnemy(e);
  }

  const running = Math.abs(player.vx) > 0.5;
  player.draw(ctx, assets.idle, assets.run, running);

  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI*2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  for (const h of hitEffects) {
    ctx.fillStyle = `rgba(255, 255, 255, ${h.life})`;
    ctx.font = 'bold 10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(h.text, h.x, h.y - (1 - h.life) * 40);
    ctx.textAlign = 'left';
  }

  if (player.nearCannon && !projectile) {
    ctx.fillStyle = 'rgba(180,160,255,0.9)';
    ctx.font = 'bold 13px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('[E] Aim Cannon', cannon.x + cannon.w/2, cannon.y - 14);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

function drawDistanceLabels(gY) {
  const mid = enemies[1];
  if (!mid || !mid.alive) return;

  const startX = cannon.x + cannon.w;
  const endX   = mid.x + mid.w / 2;
  const lineY  = gY + 6;

  const meters = ((endX - startX) / SCALE).toFixed(1);

  ctx.save();
  ctx.strokeStyle = '#ffe066';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(startX, lineY);
  ctx.lineTo(endX,   lineY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, lineY - 6); ctx.lineTo(startX, lineY + 6);
  ctx.moveTo(endX,   lineY - 6); ctx.lineTo(endX,   lineY + 6);
  ctx.stroke();

  const mx = (startX + endX) / 2;
  const my = lineY - 8;
  ctx.font = 'bold 12px monospace';
  const label = String.fromCharCode(8596) + ' ' + meters + ' m';
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(10,10,10,0.65)';
  ctx.beginPath();
  ctx.roundRect(mx - tw/2 - 6, my - 14, tw + 12, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#ffe066';
  ctx.textAlign = 'center';
  ctx.fillText(label, mx, my);
  ctx.textAlign = 'left';

  ctx.restore();
}

function drawCannon() {
  const gY = GROUND_Y();
  cannon.y = gY - cannon.h + 25; 

  const bCx = cannon.x + cannon.w - 30;
  const bCy = cannon.y + cannon.h/2 - 10;
  const ang = -cannon.angle * Math.PI/180;
  const bLen = 65;

  ctx.save();
  ctx.translate(cannon.x + cannon.w/2, cannon.y + cannon.h/2);
  ctx.scale(-1, 1);
  ctx.drawImage(cannonImg, -cannon.w/2, -cannon.h/2, cannon.w, cannon.h);
  ctx.restore();

  if (muzzleFlash > 0) {
    const tipX = bCx + Math.cos(ang) * bLen;
    const tipY = bCy + Math.sin(ang) * bLen;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 25 * muzzleFlash, 0, Math.PI*2);
    const grad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 25 * muzzleFlash);
    grad.addColorStop(0, `rgba(255, 255, 200, ${muzzleFlash})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.strokeStyle='rgba(160,140,255,0.4)';ctx.lineWidth=1;
  ctx.beginPath();
  ctx.arc(bCx, bCy, 24, ang, 0);
  ctx.stroke();

  ctx.fillStyle='rgba(160,140,255,0.8)';ctx.font='11px monospace';
  ctx.fillText(cannon.angle+'°', bCx+28, bCy-8);
}

function drawPredictedPath() {
  if (!projectile) return;
  const gY = GROUND_Y();
  ctx.strokeStyle = 'rgba(255,220,80,0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4,6]);
  ctx.beginPath();
  let px = projectile.x, py = projectile.y;
  let pvx = projectile.vx, pvy = projectile.vy;
  ctx.moveTo(px, py);
  
  const stepS = (1/60) * projectile.slowFactor;
  for (let i=0; i<180; i++) {
    pvy += (G_PHYSICS * SCALE) * stepS;
    px  += pvx * stepS;
    py  += pvy * stepS;
    if (py > gY || px > canvas.width + 50) break;
    if (i % 4 === 0) ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawEnemy(e) {
  const bob = Math.sin(e.wobble) * 3;
  const ex = e.x, ey = e.y + bob;

  ctx.save();
  ctx.translate(ex + e.w/2, ey + e.h/2);
  ctx.scale(-1, 1);
  ctx.drawImage(villianImg, -e.w/2, -e.h/2, e.w, e.h);
  ctx.restore();
}

let hintTimeout;
function showHint(msg) {
  clearTimeout(hintTimeout);
  const el = document.getElementById('enemyCount');
  el.textContent = msg;
  el.style.color = '#80ffb0';
  hintTimeout = setTimeout(() => {
    el.textContent = 'Enemies: ' + enemies.filter(e=>e.alive).length;
    el.style.color = '';
  }, 3000);
}

function showWin() {
  if (window.sounds) window.sounds.win();
  state = 'won';
  document.getElementById('overlayTitle').textContent = '🏁 Level 1 Complete!';
  document.getElementById('overlayTitle').className = 'win-text';
  document.getElementById('overlayMsg').innerHTML = 
    'You mastered projectile motion!<br><br>' +
    '<button onclick="goToLevel(\'../level2/index.html\')" style="background:#50f878;color:#000;box-shadow:4px 4px 0 #1a6c2a;">Next Mission ▶</button>';
  document.getElementById('overlay').classList.add('show');
}

function restartGame() {
  state = 'playing';
  projectile = null;
  clearProjectile();
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('enemyCount').textContent = 'Enemies: 3';
  const gY = GROUND_Y();
  player.x = 80; player.y = gY - player.h;
  player.vx = 0; player.vy = 0;
  makeEnemies();
  makePlatforms();
  particles = [];
}

function loop(ts) {
  const dt = Math.min(ts - lastTime, 32);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function init() {
  const gY = GROUND_Y();
  player.y = gY - player.h;
  player.wasOnGround = true;
  player.squash = 1;
  makeEnemies();
  makePlatforms();
  requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(loop); });
}

window.shootCannon = shootCannon;
window.closeDialog = closeDialog;
window.restartGame = restartGame;

init();
