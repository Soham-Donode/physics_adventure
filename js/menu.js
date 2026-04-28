const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
const mountainImg = new Image();
mountainImg.src = 'assets/background/mountains.png';
const grassImg = new Image();
grassImg.src = 'assets/grass/green.png';
const dirtImg = new Image();
dirtImg.src = 'assets/grass/brown.png';

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const stars = Array.from({length: 180}, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.8 + 0.4,
  b: Math.random() * 0.6 + 0.4,
  twinkle: Math.random() * Math.PI * 2,
  speed: 0.005 + Math.random() * 0.015,
}));

const fireflies = Array.from({length: 25}, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 3 + 1,
  dx: (Math.random() - 0.5) * 0.001,
  dy: (Math.random() - 0.5) * 0.0008,
  phase: Math.random() * Math.PI * 2,
}));

function drawBGMountains(W, H) {
  if (!mountainImg.complete) return;
  
  // Draw scaled and looped
  const aspect = mountainImg.width / mountainImg.height;
  const mH = H * 0.3;
  const mW = mH * aspect;
  const gY = H - 32 * 2;
  
  for (let x = 0; x < W; x += mW) {
    ctx.drawImage(mountainImg, x, gY - mH + 10, mW, mH);
  }
}

function drawBGGround(W, H) {
  const T = 32;
  const gY = H - T * 2;
  
  // Grass row
  for (let col = 0; col <= W/T; col++) {
    const tx = col * T;
    if (grassImg.complete) {
      ctx.drawImage(grassImg, tx, gY, T, T);
    } else {
      ctx.fillStyle = '#2a5828';
      ctx.fillRect(tx, gY, T, T);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tx + 0.5, gY + 0.5, T - 1, T - 1);
  }
  
  // Dirt row
  for (let col = 0; col <= W/T; col++) {
    const tx = col * T;
    if (dirtImg.complete) {
      ctx.drawImage(dirtImg, tx, gY + T, T, T);
    } else {
      ctx.fillStyle = '#4a2818';
      ctx.fillRect(tx, gY + T, T, T);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tx + 0.5, gY + T + 0.5, T - 1, T - 1);
  }
}

let time = 0;
function draw() {
  const W = canvas.width, H = canvas.height;
  time += 0.016;

  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.7);
  sky.addColorStop(0, '#0a0a1a');
  sky.addColorStop(0.5, '#0e1428');
  sky.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  for (const s of stars) {
    s.twinkle += s.speed;
    const alpha = s.b * (0.6 + 0.4 * Math.sin(s.twinkle));
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H * 0.7, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,220,255,${alpha})`;
    ctx.fill();
  }

  const moonX = W * 0.85, moonY = H * 0.12;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 60);
  moonGlow.addColorStop(0, 'rgba(200,220,255,0.15)');
  moonGlow.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(moonX, moonY, 60, 0, Math.PI*2);
  ctx.fillStyle = moonGlow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(moonX, moonY, 22, 0, Math.PI*2);
  ctx.fillStyle = '#d0d8e8';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(moonX + 6, moonY - 4, 18, 0, Math.PI*2);
  ctx.fillStyle = '#0a0a1a';
  ctx.fill();

  drawBGMountains(W, H);

  for (const f of fireflies) {
    f.x += f.dx;
    f.y += f.dy;
    f.phase += 0.03;
    if (f.x < 0 || f.x > 1) f.dx *= -1;
    if (f.y < 0.3 || f.y > 0.9) f.dy *= -1;
    const alpha = 0.3 + 0.7 * Math.abs(Math.sin(f.phase));
    ctx.beginPath();
    ctx.arc(f.x * W, f.y * H, f.r * alpha, 0, Math.PI*2);
    const glow = ctx.createRadialGradient(f.x*W, f.y*H, 0, f.x*W, f.y*H, f.r * 3);
    glow.addColorStop(0, `rgba(180,255,120,${alpha * 0.6})`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(f.x * W, f.y * H, f.r * 0.5, 0, Math.PI*2);
    ctx.fillStyle = `rgba(200,255,150,${alpha})`;
    ctx.fill();
  }

  drawBGGround(W, H);

  requestAnimationFrame(draw);
}

draw();

window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('hide');
  }, 3000);
});
