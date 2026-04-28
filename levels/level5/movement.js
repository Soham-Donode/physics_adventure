function traceBeam(lightSource, obstacles, enemies, mirrors, canvas) {
  const beamPath = [];
  const beamOffset = lightSource.offset || 0;
  const ray = {
    x: lightSource.x + beamOffset * Math.cos(lightSource.angle),
    y: lightSource.y + beamOffset * Math.sin(lightSource.angle),
    dx: Math.cos(lightSource.angle),
    dy: Math.sin(lightSource.angle)
  };
  beamPath.push({ x: ray.x, y: ray.y });

  const maxBounces = 16;
  for (let b = 0; b < maxBounces; b++) {
    let bestHit = null;
    let minT = Infinity;
    let hitType = null;
    let hitObj = null;

    const bh = intersectRayBounds(ray, canvas);
    if (bh && bh.t < minT) { minT = bh.t; bestHit = bh; hitType = 'wall'; }

    obstacles.forEach(obs => {
      const h = intersectRayRect(ray, obs);
      if (h && h.t < minT) { minT = h.t; bestHit = h; hitType = 'obs'; }
    });

    enemies.forEach(en => {
      if (!en.alive) return;
      const h = intersectRayRect(ray, en);
      if (h && h.t < minT) { minT = h.t; bestHit = h; hitType = 'enemy'; hitObj = en; }
    });

    mirrors.forEach(m => {
      const h = intersectRayMirror(ray, m);
      if (h && h.t < minT) { minT = h.t; bestHit = h; hitType = 'mirror'; hitObj = m; }
    });

    if (bestHit) {
      beamPath.push({ x: bestHit.x, y: bestHit.y });
      if (hitType === 'mirror' && bestHit.normal) {
        const dot = ray.dx * bestHit.normal.x + ray.dy * bestHit.normal.y;
        ray.x = bestHit.x + bestHit.normal.x * 0.1;
        ray.y = bestHit.y + bestHit.normal.y * 0.1;
        ray.dx = ray.dx - 2 * dot * bestHit.normal.x;
        ray.dy = ray.dy - 2 * dot * bestHit.normal.y;
      } else if (hitType === 'enemy') {
        hitObj.beingHit = true;
        break;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return beamPath;
}

function intersectRayRect(ray, r) {
  let tMin = (r.x - ray.x) / ray.dx;
  let tMax = (r.x + r.w - ray.x) / ray.dx;
  if (tMin > tMax) [tMin, tMax] = [tMax, tMin];
  let tyMin = (r.y - ray.y) / ray.dy;
  let tyMax = (r.y + r.h - ray.y) / ray.dy;
  if (tyMin > tyMax) [tyMin, tyMax] = [tyMax, tyMin];
  if ((tMin > tyMax) || (tyMin > tMax)) return null;
  let t = Math.max(tMin, tyMin);
  if (t < 0) return null;
  return { t: t, x: ray.x + ray.dx * t, y: ray.y + ray.dy * t };
}

function intersectRayMirror(ray, m) {
  const half = 32;
  const rad = m.angle * Math.PI / 180;
  const x1 = m.x - Math.sin(rad) * half;
  const y1 = m.y + Math.cos(rad) * half;
  const x2 = m.x + Math.sin(rad) * half;
  const y2 = m.y - Math.cos(rad) * half;

  const dx = x2 - x1, dy = y2 - y1;
  const det = ray.dx * dy - ray.dy * dx;
  if (Math.abs(det) < 0.0001) return null;
  const t = ((x1 - ray.x) * dy - (y1 - ray.y) * dx) / det;
  const u = ((x1 - ray.x) * ray.dy - (y1 - ray.y) * ray.dx) / det;
  if (t > 0 && u >= 0 && u <= 1) {
    let nx = -dy, ny = dx;
    const mag = Math.sqrt(nx * nx + ny * ny);
    nx /= mag; ny /= mag;
    if (ray.dx * nx + ray.dy * ny > 0) { nx = -nx; ny = -ny; }
    return { t: t, x: ray.x + ray.dx * t, y: ray.y + ray.dy * t, normal: { x: nx, y: ny } };
  }
  return null;
}

function intersectRayBounds(ray, canvas) {
  let t = Infinity;
  if (ray.dx > 0) t = Math.min(t, (canvas.width - ray.x) / ray.dx);
  if (ray.dx < 0) t = Math.min(t, (0 - ray.x) / ray.dx);
  if (ray.dy > 0) t = Math.min(t, (canvas.height - ray.y) / ray.dy);
  if (ray.dy < 0) t = Math.min(t, (0 - ray.y) / ray.dy);
  return (t === Infinity || t < 0) ? null : { t: t, x: ray.x + ray.dx * t, y: ray.y + ray.dy * t };
}
