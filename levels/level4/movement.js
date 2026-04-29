function updateMovement(dt, player, state, globalVars, arrows, particles, TIME_TO_WIN, V_MAN_PX, V_ARROW_PX, shieldAngle, showLose, showWin, lineIntersect, spawnParticles) {
  if (state === 'playing') {
    globalVars.groundOffset += (V_MAN_PX * dt / 1000);

    if (Math.random() < 0.4) {
      arrows.push({
        x: player.x + Math.random() * 800 - 50,
        y: -50,
        vx: -V_MAN_PX,
        vy: V_ARROW_PX,
        active: true
      });
    }

    const cx = player.x + player.w/2;
    const cy = player.y - 10;
    const len = 100;
    const angleRad = shieldAngle * Math.PI / 180;
    const p1x = cx - Math.cos(angleRad) * len/2;
    const p1y = cy - Math.sin(angleRad) * len/2;
    const p2x = cx + Math.cos(angleRad) * len/2;
    const p2y = cy + Math.sin(angleRad) * len/2;

    for (let arrow of arrows) {
      if (!arrow.active) continue;
      const nextX = arrow.x + arrow.vx * dt/1000;
      const nextY = arrow.y + arrow.vy * dt/1000;

      const hitShield = lineIntersect(arrow.x, arrow.y, nextX, nextY, p1x, p1y, p2x, p2y);
      if (hitShield) {
        arrow.active = false;
        spawnParticles(hitShield.x, hitShield.y, '#e0e0e0', 6, particles);
        spawnParticles(hitShield.x, hitShield.y, '#ffcc00', 3, particles);
        continue;
      }

      if (nextX > player.x - 10 && nextX < player.x + player.w + 10 && nextY > player.y && nextY < player.y + player.h && shieldAngle !== 45) {
        state = 'dead';
        spawnParticles(player.x + player.w/2, player.y + player.h/2, '#c82000', 20, particles);
        setTimeout(showLose, 800);
      }

      arrow.x = nextX;
      arrow.y = nextY;
      if (arrow.y > 900) arrow.active = false;
    }

    // Filter dead arrows outside this function or keep them in array managed outside
    // We'll mutate the array in game.js

    globalVars.timeSurvived += dt;
    if (globalVars.timeSurvived > TIME_TO_WIN && state === 'playing') {
      state = 'won';
      setTimeout(showWin, 500);
    }
  }

  // Update particles
  for (let p of particles) {
    p.x += p.vx * dt/1000;
    p.y += p.vy * dt/1000;
    p.life -= p.decay;
  }

  player.updateAnimation(dt);
  
  return state;
}
