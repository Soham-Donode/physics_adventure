// Common Graphics and Assets

// Inject transition styles
const style = document.createElement('style');
style.textContent = `
  #fadeOverlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 9999; pointer-events: none;
    display: flex; align-items: center; justify-content: center;
  }
  .fade-layer {
    position: absolute; width: 100%; height: 50%;
    background: #0a0a0a; transition: transform 0.6s cubic-bezier(0.77, 0, 0.175, 1);
  }
  .fade-top { top: 0; transform: translateY(-100%); }
  .fade-bottom { bottom: 0; transform: translateY(100%); }
  
  #fadeOverlay.active .fade-top { transform: translateY(0); }
  #fadeOverlay.active .fade-bottom { transform: translateY(0); }
  #fadeOverlay.active { pointer-events: all; }

  #loaderText {
    color: #f8f878; font-family: 'Press Start 2P', monospace; font-size: 14px;
    z-index: 10000; opacity: 0; transition: opacity 0.3s;
    text-shadow: 2px 2px 0 #000;
  }
  #fadeOverlay.active #loaderText { opacity: 1; }

  /* Tactile UI Effects */
  button, .level-card, .btn {
    transition: transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.2s !important;
    cursor: pointer;
  }
  button:hover, .level-card:hover { transform: scale(1.03); filter: brightness(1.1); }
  button:active, .level-card:active { transform: scale(0.95); }
`;
document.head.appendChild(style);

const fadeEl = document.createElement('div');
fadeEl.id = 'fadeOverlay';
fadeEl.innerHTML = `
  <div class="fade-layer fade-top"></div>
  <div class="fade-layer fade-bottom"></div>
  <div id="loaderText">LOADING...</div>
`;
document.body.appendChild(fadeEl);

function goToLevel(url) {
  fadeEl.classList.add('active');
  if (window.sounds) window.sounds.click();
  setTimeout(() => {
    window.location.href = url;
  }, 700);
}

// Fade in on load
window.addEventListener('load', () => {
  fadeEl.classList.add('active');
  setTimeout(() => {
    fadeEl.classList.remove('active');
  }, 200);
});

const assets = {
  sky: new Image(),
  idle: new Image(),
  run: new Image(),
  face: new Image(),
  mountains: new Image(),
  grass: new Image(),
  dirt: new Image(),
  stone: new Image()
};

function initSharedAssets(basePath) {
  assets.sky.src = basePath + 'assets/sky.png';
  assets.idle.src = basePath + 'assets/character/standing/_Idle.png';
  assets.run.src = basePath + 'assets/character/running/_Run.png';
  assets.face.src = basePath + 'assets/face.png';
  assets.mountains.src = basePath + 'assets/background/mountains.png';
  assets.grass.src = basePath + 'assets/grass/green.png';
  assets.dirt.src = basePath + 'assets/grass/brown.png';
  assets.stone.src = basePath + 'assets/grass/stone.png';
}

function resizeCanvas(canvas, viewport, internalW = 1200, internalH = 900) {
  const targetRatio = internalW / internalH;
  let w = window.innerWidth;
  let h = window.innerHeight;
  
  if (w / h > targetRatio) {
    w = h * targetRatio;
  } else {
    h = w / targetRatio;
  }
  
  canvas.width = internalW;
  canvas.height = internalH;
  
  const scale = h / internalH;
  viewport.style.transform = `scale(${scale})`;
  viewport.style.left = (window.innerWidth - w) / 2 + 'px';
  viewport.style.top = (window.innerHeight - h) / 2 + 'px';
}

function drawMountains(ctx, W, gY, offset = 0) {
  if (!assets.mountains.complete) return;
  
  const mOffset = (offset * 0.2) % 1200;
  
  ctx.save();
  ctx.translate(-mOffset, 0);
  
  // Draw two copies for seamless loop
  ctx.drawImage(assets.mountains, 0, gY - 200, 1200, 200);
  ctx.drawImage(assets.mountains, 1200, gY - 200, 1200, 200);
  
  ctx.restore();
}

function drawGroundTiles(ctx, W, gY, H, offset = 0, gapStart = -1, gapEnd = -1) {
  const T = 32;
  const startCol = Math.floor(offset / T);
  const pixelOffset = offset % T;

  const rows = Math.ceil((H - gY) / T) + 1;
  const cols = Math.ceil(W / T) + 2;

  for (let row = 0; row < rows; row++) {
    const ty = gY + row * T;
    for (let c = 0; c < cols; c++) {
      const col = startCol + c;
      const tx = c * T - pixelOffset;
      
      // Skip if in gap
      if (tx >= gapStart && tx < gapEnd) continue;

      const isGrass = row === 0;
      
      const img = isGrass ? assets.grass : assets.dirt;
      if (img.complete) {
        ctx.drawImage(img, tx, ty, T, T);
      } else {
        ctx.fillStyle = isGrass ? '#58b848' : '#a85830';
        ctx.fillRect(tx, ty, T, T);
      }
      
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx + 0.5, ty + 0.5, T - 1, T - 1);
    }
  }
}

function drawWater(ctx, W, gY, H, time = 0) {
  ctx.save();
  ctx.fillStyle = '#006994';
  ctx.fillRect(0, gY, W, H - gY);
  
  // Wave overlay
  // Simplified water without bubbles
  ctx.restore();
}
