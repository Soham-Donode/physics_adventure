function updateMovement(dt, player, state, bresenhamPoints, CELL_SIZE, showWin, canvasWidth) {
  if (state === 'playing') {
    // Initial run to the bridge start
    const firstPoint = bresenhamPoints[0];
    const startX = firstPoint.x * CELL_SIZE + CELL_SIZE / 2 - player.w / 2;
    const startY = firstPoint.y * CELL_SIZE - player.h;
    
    if (player.x < startX - 2) {
      player.x += 0.22 * dt;
      player.isRunning = true;
      player.facing = 1;
      // Simple Y interpolation to climb onto first block if needed
      if (Math.abs(player.x - startX) < 100) {
          const p = 1 - (startX - player.x) / 100;
          player.y = (800 - player.h) + (startY - (800 - player.h)) * p;
      }
    } else {
      player.isRunning = false;
    }
    return state;
  }

  if (state === 'moving') {
    const target = bresenhamPoints[player.targetIndex];
    if (!target) {
       // Reached the end of bridge
       state = 'finalRun';
       return state;
    }

    const currentPoint = bresenhamPoints[player.targetIndex - 1] || bresenhamPoints[0];
    const nextPoint = bresenhamPoints[player.targetIndex];

    const curCx = currentPoint.x * CELL_SIZE + CELL_SIZE / 2 - player.w / 2;
    const curCy = currentPoint.y * CELL_SIZE - player.h;
    const nextCx = nextPoint.x * CELL_SIZE + CELL_SIZE / 2 - player.w / 2;
    const nextCy = nextPoint.y * CELL_SIZE - player.h;

    const isFlat = currentPoint.y === nextPoint.y;

    if (player.moveSubState === undefined) player.moveSubState = isFlat ? 10 : 0;
    if (player.subStateProgress === undefined) player.subStateProgress = 0;

    const speed = 0.22 * dt;
    player.subStateProgress += speed / CELL_SIZE;

    if (isFlat) {
      const p = Math.min(1, player.subStateProgress);
      player.x = curCx + (nextCx - curCx) * p;
      player.y = curCy;
      player.facing = (nextCx > curCx) ? 1 : -1;
      player.isRunning = true;

      if (p >= 1) {
        player.x = nextCx;
        player.targetIndex++;
        player.subStateProgress = 0;
        const nextNext = bresenhamPoints[player.targetIndex];
        if (nextNext && nextNext.y !== nextPoint.y) player.moveSubState = 0;
        if (player.targetIndex >= bresenhamPoints.length) state = 'finalRun';
      }
    } else {
      if (player.moveSubState === 0) {
        const edgeX = curCx + (nextCx > curCx ? 35 : -35);
        const p = Math.min(1, player.subStateProgress * 2.5);
        player.x = curCx + (edgeX - curCx) * p;
        player.y = curCy;
        player.isRunning = true;
        if (p >= 1) {
          player.moveSubState = 1;
          player.subStateProgress = 0;
          player.jumpStartX = player.x;
          player.jumpStartY = player.y;
        }
      } else if (player.moveSubState === 1) {
        const startX = player.jumpStartX;
        const startY = player.jumpStartY;
        const targetEdgeX = nextCx - (nextCx > curCx ? 35 : -35);
        const targetEdgeY = nextCy;
        const p = Math.min(1, player.subStateProgress * 1.5);
        const jumpHeight = 70;
        player.x = startX + (targetEdgeX - startX) * p;
        player.y = startY + (targetEdgeY - startY) * p - Math.sin(p * Math.PI) * jumpHeight;
        player.isRunning = false;
        if (p >= 1) {
          player.moveSubState = 2;
          player.subStateProgress = 0;
        }
      } else if (player.moveSubState === 2) {
        const targetX = nextCx;
        const p = Math.min(1, player.subStateProgress * 2.5);
        player.x = (nextCx - (nextCx > curCx ? 35 : -35)) + (targetX - (nextCx - (nextCx > curCx ? 35 : -35))) * p;
        player.y = nextCy;
        player.isRunning = true;
        if (p >= 1) {
          player.x = nextCx;
          player.targetIndex++;
          player.subStateProgress = 0;
          const nextNext = bresenhamPoints[player.targetIndex];
          player.moveSubState = (nextNext && nextNext.y === nextPoint.y) ? 10 : 0;
          if (player.targetIndex >= bresenhamPoints.length) state = 'finalRun';
        }
      }
    }
  }

  if (state === 'finalRun') {
    player.x += 0.25 * dt;
    player.isRunning = true;
    player.facing = 1;
    if (player.x > canvasWidth + 100) {
      showWin();
      return 'won';
    }
  }

  // Animation runs always
  player.frameTimer += dt;
  if (player.frameTimer > 80) {
    player.frame = (player.frame + 1) % 10;
    player.frameTimer = 0;
  }

  return state;
}
