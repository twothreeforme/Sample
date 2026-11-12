// Pixel collision layer.
// Every collidable object is drawn into a hidden canvas in a flat colour that encodes its id
// (1..4095). Asking "what is at (x,y)?" is then a single pixel lookup. Later draws win overlaps.
//
// Usage per frame:  layer.clear(); layer.circle(1,...); layer.rect(2,...); layer.update();
//                   layer.at(x,y) -> id | 0       layer.probe(x,y,r) -> {id,nx,ny} | null
const defaultCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const TAU = Math.PI * 2;

// scale < 1 stores the layer at lower resolution (e.g. 0.5 = 4x cheaper to read each frame);
// all drawing and query coordinates stay in logical units.
export function createCollisionLayer(W, H, createCanvas = defaultCanvas, scale = 1) {
  const PW = Math.round(W * scale), PH = Math.round(H * scale);
  const canvas = createCanvas(PW, PH);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  let data = null;

  // id -> colour: each of R,G,B holds one nibble (x16) so anti-aliased edges still decode.
  const color = (id) => `rgb(${(id & 15) * 16},${((id >> 4) & 15) * 16},${((id >> 8) & 15) * 16})`;

  function at(x, y) {
    x = Math.floor(x * scale); y = Math.floor(y * scale);
    if (!data || x < 0 || y < 0 || x >= PW || y >= PH) return 0;
    const i = (y * PW + x) * 4;
    if (data[i + 3] < 128) return 0;
    return (Math.round(data[i] / 16) & 15) | ((Math.round(data[i + 1] / 16) & 15) << 4) | ((Math.round(data[i + 2] / 16) & 15) << 8);
  }

  const layer = {
    canvas, W, H, scale, at,
    clear() { ctx.clearRect(0, 0, W, H); data = null; },
    // Draw any path: fn(ctx) builds it, we fill it with the id colour.
    shape(id, fn) { ctx.fillStyle = color(id); ctx.beginPath(); fn(ctx); ctx.fill(); },
    circle(id, x, y, r) { layer.shape(id, (c) => c.arc(x, y, r, 0, TAU)); },
    rect(id, x, y, w, h) { ctx.fillStyle = color(id); ctx.fillRect(x, y, w, h); },
    poly(id, pts) { layer.shape(id, (c) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }); },
    line(id, x1, y1, x2, y2, width = 4) {
      ctx.strokeStyle = color(id); ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    },
    // Snapshot the layer once after drawing; all at()/probe() calls read from this buffer.
    update() { data = ctx.getImageData(0, 0, PW, PH).data; },
    // Hit test with a surface normal: samples a ring of radius r around (x,y).
    // Returns null if nothing solid is touched, else {id, nx, ny} where (nx,ny) points away from the surface.
    probe(x, y, r = 4) {
      let id = at(x, y), sx = 0, sy = 0, n = 0;
      for (let k = 0; k < 8; k++) {
        const a = k * TAU / 8, dx = Math.cos(a), dy = Math.sin(a), h = at(x + dx * r, y + dy * r);
        if (h) { sx += dx; sy += dy; n++; if (!id) id = h; }
      }
      if (!id) return null;
      const len = Math.hypot(sx, sy);
      return len > 1e-6 ? { id, nx: -sx / len, ny: -sy / len } : { id, nx: 0, ny: -1 };
    },
  };
  return layer;
}

// Reflect velocity (vx,vy) about unit normal (nx,ny) with restitution e.
export function reflect(vx, vy, nx, ny, e = 1) {
  const d = vx * nx + vy * ny;
  if (d >= 0) return [vx, vy];          // already moving away
  return [(vx - 2 * d * nx) * e, (vy - 2 * d * ny) * e];
}
