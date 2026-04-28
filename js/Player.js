class Player {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.frame = 0;
    this.frameTimer = 0;
    this.squash = 1;
    this.wasOnGround = false;
    this.targetIndex = 1; // Used in level 2
  }

  updateAnimation(dt) {
    this.frameTimer += dt;
    if (this.frameTimer > 80) {
      this.frame = (this.frame + 1) % 10;
      this.frameTimer = 0;
    }
  }

  draw(ctx, idleImg, runImg, isRunning) {
    const px = this.x, py = this.y;
    const w = this.w, h = this.h;
    const f = this.facing;
    const frame = this.frame;
    const img = isRunning ? runImg : idleImg;

    ctx.save();
    ctx.translate(px + w/2, py + h);
    ctx.scale(f, 1);
    ctx.translate(0, -h);

    if (img && img.complete) {
      // Scaled up by ~25%
      ctx.drawImage(img, frame * 120, 0, 120, 80, -95, h - 125, 190, 125);
    }

    ctx.restore();
  }
}
