// ─── Canvas & Context ─────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const vp = document.getElementById('viewport');

initSharedAssets('../../');

window.addEventListener('resize', () => resizeCanvas(canvas, vp));
resizeCanvas(canvas, vp);

// ─── Assets ───────────────────────────────────────────────────────────────
const skyImg = assets.sky;
const mountainsImg = assets.mountains;
const villianImg = new Image(); villianImg.src = '../../assets/villian.png';
const mirrorImg = new Image(); mirrorImg.src = '../../assets/mirror_v2.png';
const heroImg = assets.idle;

const wandSvg = `
<svg width="100" height="20" xmlns="http://www.w3.org/2000/svg">
  <g transform="scale(5)">
    <rect x="0" y="1" width="14" height="2" fill="#5c4033"/>
    <rect x="0" y="1" width="14" height="1" fill="#8b5a2b"/>
    <rect x="0" y="0" width="2" height="4" fill="#ffd700"/>
    <rect x="3" y="0" width="1" height="4" fill="#ffd700"/>
    <rect x="9" y="0" width="1" height="4" fill="#ffd700"/>
    <rect x="14" y="1" width="4" height="2" fill="#00e5ff"/>
    <rect x="15" y="0" width="2" height="4" fill="#00e5ff"/>
    <rect x="15" y="1" width="2" height="2" fill="#ffffff"/>
  </g>
</svg>
`.trim();
const wandImg = new Image();
wandImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(wandSvg);

const HERO_FRAME_W = 120;
const HERO_FRAME_H = 80;
const HERO_DRAW_W = 280;
const HERO_DRAW_H = 205;
const HERO_POS = { x: 90, y: 505 };
const HERO_GUN_OFFSET = { x: 60, y: 64 };
const HERO_PLATFORM = { x: 90, y: 505, w: 60, h: 145 };
const GUN_LENGTH = 60;
const GUN_THICKNESS = 14;
const GUN_COLOR = '#50f8f8';

// ─── Game Constants ───────────────────────────────────────────────────────
const BEAM_COLOR = '#00ffff';
const BEAM_CORE = '#ffffff';

// ─── Game State ───────────────────────────────────────────────────────────
let state = 'playing';
let mirrors = [];
let enemies = [];
let obstacles = [];
let lightSource = { x: 100, y: 450, angle: 0, offset: GUN_LENGTH };
let beamPath = [];
let time = 0;
let shake = 0;

// Interaction state
let selectedMirror = null;
let heldMirror = null;
let draggingMirror = null;
let dragOffset = { x: 0, y: 0 };
let mouseDownPos = { x: 0, y: 0 };

// ─── Level Data ───────────────────────────────────────────────────────────
function initLevel() {
  mirrors = [];
  enemies = [
    { x: 1050, y: 300, w: 70, h: 70, alive: true, hp: 60 },
    { x: 1050, y: 750, w: 70, h: 70, alive: true, hp: 60 },
    { x: 500, y: 80, w: 70, h: 70, alive: true, hp: 60 },
    { x: 500, y: 780, w: 70, h: 70, alive: true, hp: 60 },
    { x: 750, y: 400, w: 70, h: 70, alive: true, hp: 60 }
  ];
  obstacles = [
    { x: 350, y: 0, w: 40, h: 300 },
    { x: 350, y: 400, w: 40, h: 250 },
    { x: 350, y: 750, w: 40, h: 150 },
    { x: 650, y: 150, w: 40, h: 350 },
    { x: 650, y: 600, w: 40, h: 300 },
    { x: 900, y: 0, w: 40, h: 450 },
    { x: 900, y: 550, w: 40, h: 350 },
    { x: 450, y: 200, w: 200, h: 40 },
    { x: 100, y: 650, w: 250, h: 40 },
    { x: 750, y: 500, w: 150, h: 40 },
    { x: 500, y: 600, w: 150, h: 40 },
    { x: 1000, y: 200, w: 100, h: 30 },
    { x: 1000, y: 400, w: 100, h: 30 },
    { x: 450, y: 150, w: 100, h: 30 },
    { x: 750, y: 350, w: 100, h: 30 }
  ];
  updateHUD();
}

function updateHUD() {
  document.getElementById('enemyCount').textContent = `Enemies: ${enemies.filter(e => e.alive).length}`;
}

// ─── Interaction ──────────────────────────────────────────────────────────
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (1200 / rect.width),
    y: (e.clientY - rect.top) * (900 / rect.height)
  };
}

function takeMirror(e) {
  e.stopPropagation();
  if (!heldMirror) {
    mouseDownPos = { x: e.clientX, y: e.clientY };
    const p = getPos(e);
    heldMirror = { x: p.x, y: p.y, angle: 45 };
    closeControl();
    // Hide the UI mirror to make it look like it was "picked up"
    document.getElementById('uiMirrorImg').style.visibility = 'hidden';
  }
}

canvas.addEventListener('mousedown', e => {
  if (state !== 'playing') return;

  if (window.bgMusic && window.bgMusic.paused) {
    window.bgMusic.play().catch(() => { });
  }

  const p = getPos(e);
  mouseDownPos = { x: e.clientX, y: e.clientY };

  if (e.button === 2) {
    const idx = mirrors.findIndex(m => Math.hypot(m.x - p.x, m.y - p.y) < 30);
    if (idx !== -1) {
      if (selectedMirror === mirrors[idx]) closeControl();
      mirrors.splice(idx, 1);
    }
    return;
  }

  // Find mirror (search in reverse to get the topmost one)
  const mirror = mirrors.slice().reverse().find(m => Math.hypot(m.x - p.x, m.y - p.y) < 30);
  if (mirror) {
    if (window.sounds) window.sounds.click();
    draggingMirror = mirror;
    dragOffset = { x: mirror.x - p.x, y: mirror.y - p.y };
  } else {
    closeControl();
  }
});

window.addEventListener('mousemove', e => {
  const p = getPos(e);
  if (heldMirror) { heldMirror.x = p.x; heldMirror.y = p.y; }
  if (draggingMirror) {
    draggingMirror.x = p.x + dragOffset.x;
    draggingMirror.y = p.y + dragOffset.y;
  }
});

window.addEventListener('mouseup', e => {
  if (draggingMirror) {
    const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
    if (dist < 5) {
      selectedMirror = draggingMirror;
      openControl();
    }
    draggingMirror = null;
  }

  if (heldMirror) {
    const p = getPos(e);
    // Don't place if we are still very close to the inventory button and it was just a quick click
    const distFromStart = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
    
    // If it was a drag (dist > 10) or we are far from the UI button (p.x < 1000)
    if (p.x < 1100 || p.y > 100) {
       heldMirror.x = p.x; heldMirror.y = p.y;
       mirrors.push(heldMirror);
       if (window.sounds) window.sounds.click();
    }
    heldMirror = null;
    // Show the UI mirror again
    document.getElementById('uiMirrorImg').style.visibility = 'visible';
  }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', e => {
  if (state !== 'playing' || !selectedMirror) return;

  const isDelete = e.key === 'Delete' || e.key === 'Del';
  const isCtrlD = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd';

  if (isDelete || isCtrlD) {
    e.preventDefault();
    const idx = mirrors.indexOf(selectedMirror);
    if (idx !== -1) {
      mirrors.splice(idx, 1);
      closeControl();
      if (window.sounds) window.sounds.click();
    }
  }
});

// ─── Mirror Control Logic ─────────────────────────────────────────────────
function openControl() {
  const panel = document.getElementById('mirrorControl');
  panel.style.display = 'block';

  const panelW = 180;
  const panelH = 200;

  let left = selectedMirror.x + 60;
  let top = selectedMirror.y - 100;

  if (left + panelW > 1180) {
    left = selectedMirror.x - panelW - 60;
  }

  if (top < 60) top = 60;
  if (top + panelH > 880) top = 880 - panelH;
  if (left < 20) left = 20;

  panel.style.left = left + 'px';
  panel.style.top = top + 'px';
  document.getElementById('angleInput').value = selectedMirror.angle;
}

function closeControl() {
  document.getElementById('mirrorControl').style.display = 'none';
  selectedMirror = null;
}

function updateMirrorAngle() {
  if (selectedMirror) {
    let val = parseInt(document.getElementById('angleInput').value);
    selectedMirror.angle = ((val % 360) + 360) % 360;
  }
}

function adjustAngle(delta) {
  if (selectedMirror) {
    selectedMirror.angle = ((selectedMirror.angle + delta) % 360 + 360) % 360;
    document.getElementById('angleInput').value = selectedMirror.angle;
  }
}

// ─── Main Loop ────────────────────────────────────────────────────────────
function update() {
  if (state !== 'playing') return;
  time += 0.016;
  const gunOrigin = getGunOrigin();
  lightSource.x = gunOrigin.x;
  lightSource.y = gunOrigin.y;
  enemies.forEach(e => e.beingHit = false);
  beamPath = traceBeam(lightSource, obstacles, enemies, mirrors, canvas);
  enemies.forEach(e => {
    if (e.beingHit && e.alive) {
      e.hp -= 1;
      if (Math.random() < 0.2) spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ff4444', 3);
      if (e.hp <= 0) {
        e.alive = false;
        shake = 15;
        if (window.sounds) window.sounds.explode();
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ffaa00', 30);
        updateHUD();
        if (enemies.every(en => !en.alive)) showWin();
      }
    } else {
      e.hp = Math.min(60, e.hp + 0.5);
    }
  });
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= p.decay; });
  particles = particles.filter(p => p.life > 0);
  if (shake > 0) shake *= 0.9;
}

function draw() {
  ctx.save();
  if (shake > 1) ctx.translate(Math.random() * shake - shake / 2, Math.random() * shake - shake / 2);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (skyImg.complete) {
    ctx.drawImage(skyImg, 0, 0, canvas.width, canvas.height);
  }

  // Draw Mountains at the bottom
  if (mountainsImg.complete) {
    // Parallax mountains at the bottom
    ctx.drawImage(mountainsImg, 0, 600, 1200, 300);
  }

  // Dark overlay (reduced opacity to make it look like the image but keep beam visible)
  ctx.fillStyle = 'rgba(10, 10, 30, 0.4)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1e1e2e';
  ctx.strokeStyle = '#33334d';
  ctx.lineWidth = 4;
  obstacles.forEach(o => { ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeRect(o.x, o.y, o.w, o.h); });
  if (beamPath.length > 1) {
    ctx.shadowBlur = 15; ctx.shadowColor = BEAM_COLOR;
    ctx.strokeStyle = BEAM_COLOR; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(beamPath[0].x, beamPath[0].y);
    beamPath.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = BEAM_CORE; ctx.lineWidth = 2; ctx.stroke();
  }

  drawProtagonistWithGun();
  enemies.forEach(e => {
    if (!e.alive) return;
    ctx.save();
    if (e.beingHit) { ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2); ctx.filter = 'brightness(2) hue-rotate(90deg)'; }
    ctx.drawImage(villianImg, e.x, e.y, e.w, e.h);
    if (e.hp < 60) { ctx.fillStyle = '#000'; ctx.fillRect(e.x, e.y - 15, e.w, 6); ctx.fillStyle = '#ff0000'; ctx.fillRect(e.x, e.y - 15, e.w * (e.hp / 60), 6); }
    ctx.restore();
  });
  mirrors.forEach(m => {
    ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(-m.angle * Math.PI / 180);
    ctx.globalCompositeOperation = 'lighten'; ctx.drawImage(mirrorImg, -32, -32, 64, 64);
    ctx.globalCompositeOperation = 'source-over';
    if (selectedMirror === m) { ctx.strokeStyle = '#f8f878'; ctx.lineWidth = 2; ctx.strokeRect(-32, -32, 64, 64); }
    ctx.restore();
  });
  if (heldMirror) {
    ctx.save(); ctx.globalAlpha = 0.5; ctx.translate(heldMirror.x, heldMirror.y);
    ctx.rotate(-heldMirror.angle * Math.PI / 180); ctx.drawImage(mirrorImg, -32, -32, 64, 64);
    ctx.restore();
  }
  particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 4, 4); });
  ctx.restore();
  requestAnimationFrame(() => { update(); draw(); });
}

function drawProtagonistWithGun() {
  const baseX = HERO_POS.x;
  const baseY = HERO_POS.y;

  ctx.save();
  ctx.fillStyle = '#1e1e2e';
  ctx.strokeStyle = '#33334d';
  ctx.lineWidth = 4;
  ctx.fillRect(HERO_PLATFORM.x, HERO_PLATFORM.y, HERO_PLATFORM.w, HERO_PLATFORM.h);
  ctx.strokeRect(HERO_PLATFORM.x, HERO_PLATFORM.y, HERO_PLATFORM.w, HERO_PLATFORM.h);
  ctx.restore();

  if (heroImg && heroImg.complete) {
    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.drawImage(
      heroImg,
      0, 0, HERO_FRAME_W, HERO_FRAME_H,
      -100, -210,
      HERO_DRAW_W, HERO_DRAW_H
    );
    ctx.restore();
  }

  ctx.save();
  const gunOrigin = getGunOrigin();
  ctx.translate(gunOrigin.x, gunOrigin.y);
  ctx.rotate(lightSource.angle);

  if (wandImg.complete) {
    ctx.drawImage(wandImg, 0, -8, 80, 16);
  }

  ctx.restore();
}

function getGunOrigin() {
  return {
    x: HERO_POS.x + HERO_GUN_OFFSET.x,
    y: HERO_POS.y - HERO_GUN_OFFSET.y
  };
}

let particles = [];
function spawnParticles(x, y, color, n = 15) {
  for (let i = 0; i < n; i++) {
    particles.push({ x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 1, decay: 0.02 + Math.random() * 0.02, color });
  }
}

function calculateScore(mirrorsUsed) {
  // score inversely proportional to mirrors used
  // e.g. 10000 base points, deduct 1000 per mirror, min 1000
  return Math.max(1000, 10000 - (mirrorsUsed * 1000));
}

function showWin() {
  state = 'won';
  const score = calculateScore(mirrors.length);
  document.getElementById('overlayTitle').textContent = 'LEVEL COMPLETE!';
  document.getElementById('overlayTitle').className = 'win-text';
  document.getElementById('overlayMsg').innerHTML = `The crystal's light has purified the shadows.<br><br>Score: ${score} (Mirrors used: ${mirrors.length})`;
  document.getElementById('overlay').classList.add('show');
  if (window.sounds) window.sounds.win();
}

function restartGame() {
  document.getElementById('overlay').classList.remove('show');
  state = 'playing';
  initLevel();
}

window.takeMirror = takeMirror;
window.adjustAngle = adjustAngle;
window.closeControl = closeControl;
window.updateMirrorAngle = updateMirrorAngle;
window.restartGame = restartGame;

initLevel();
draw();
