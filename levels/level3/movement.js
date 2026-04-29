function updateMovement(dt, player, state, wood, checkWinCondition, GROUND_Y) {
  if (wood.animating) {
    wood.animProgress += dt * 0.0015; // roughly 600ms duration
    if (wood.animProgress >= 1) {
      wood.animProgress = 1;
      wood.animating = false;
      wood.x = wood.targetX;
      wood.y = wood.targetY;
      wood.angle = wood.targetAngle;
      if (checkWinCondition()) {
        state = 'moving';
      }
    } else {
      const t = wood.animProgress;
      const ease = 1 - Math.pow(1 - t, 3); // cubic ease out
      wood.x = wood.startX + (wood.targetX - wood.startX) * ease;
      wood.y = wood.startY + (wood.targetY - wood.startY) * ease;
      wood.angle = wood.startAngle + (wood.targetAngle - wood.startAngle) * ease;
    }
  }

  if (state === 'moving') {
    if (player.x < 1000) {
      player.vx = 0.2 * dt;
      player.facing = 1;
      
      // Check if on wood
      if (player.x >= 370 && player.x <= 830) {
        player.y = GROUND_Y - 20 - player.h; // wood thickness raises it
      } else {
        player.y = GROUND_Y - player.h;
      }
    } else {
      player.vx = 0;
      state = 'won';
      localStorage.setItem('level3_completed', 'true');
      setTimeout(() => document.getElementById('overlay').classList.add('show'), 500);
    }
    player.x += player.vx;
  }

  // Animation runs always
  player.updateAnimation(dt);
  
  return state;
}
