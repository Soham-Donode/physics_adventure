function updateMovement(dt, player, state, keys, platforms, GRAVITY_PLAYER, canvas, enemies, showWin, GROUND_Y, shake, muzzleFlash, hitEffects, particles, projectile, SLOW_MO, SCALE, G_PHYSICS, spawnParticles, clearProjectile, restartGame, showHint, currentAngle) {
  if (state !== 'playing') return state;

  const gY = GROUND_Y();
  
  // Player movement
  const spd = keys['ShiftLeft'] || keys['ShiftRight'] ? 5.5 : 3.2;
  if (keys['ArrowLeft']  || keys['KeyA']) { player.vx = -spd; player.facing = -1; }
  else if (keys['ArrowRight'] || keys['KeyD']) { player.vx = spd;  player.facing =  1; }
  else player.vx *= 0.7;

  if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.onGround) {
    player.vy = -10;
    player.onGround = false;
    player.squash = 0.6; // jump stretch
    if (window.sounds) window.sounds.jump();
  }

  player.vy += GRAVITY_PLAYER;
  player.x  += player.vx;
  player.y  += player.vy;

  // Clamp within screen & Check win condition
  if (player.x < 0) { player.x = 0; player.vx = 0; }
  if (player.x + player.w > canvas.width - 5) {
    if (enemies.every(e => !e.alive)) {
      showWin();
      return 'won';
    } else {
      player.x = canvas.width - player.w - 5;
      player.vx = 0;
    }
  }

  // Platform collision
  if (player.onGround && player.vy === 0 && !player.wasOnGround) {
    player.squash = 1.3; // landing squash
  }
  player.wasOnGround = player.onGround;
  if (player.squash) player.squash += (1 - player.squash) * 0.2;

  player.onGround = false;
  for (const p of platforms) {
    if (player.x + player.w > p.x && player.x < p.x + p.w) {
      if (player.y + player.h > p.y && player.y + player.h < p.y + p.h + player.vy + 2 && player.vy >= 0) {
        player.y  = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }

  // Near cannon check
  // Note: Cannon object isn't passed here, so we assume its position based on fixed x/y
  const cannon = { x: 60, w: 140 }; // Hardcoded or passed from global state
  const dx = Math.abs((player.x + player.w/2) - (cannon.x + cannon.w/2));
  player.nearCannon = (dx < 80) && player.onGround;

  // Player touches enemy → die and restart
  for (const e of enemies) {
    if (!e.alive) continue;
    if (player.x + player.w > e.x && player.x < e.x + e.w &&
        player.y + player.h > e.y && player.y < e.y + e.h && currentAngle !== 45) {
      spawnParticles(player.x + player.w/2, player.y + player.h/2, '#ff4444', 22);
      setTimeout(() => restartGame(), 600); // brief delay to show particles
      return 'dead';
    }
  }

  player.updateAnimation(dt);

  return state;
}
