// Pure-JS stand-in for the collision layer, used by headless simulations.
// Same drawing/query API as engine/collision.js (clear, rect, circle, poly, line, update, at) but rasterises
// ids into a typed array. No canvas, no per-frame allocation, so it can run millions of frames.
// (The real canvas-based layer is covered by tools/collision-test.js.)
export function createSoftLayer(W, H, scale = 0.5) {
  const PW = Math.round(W * scale), PH = Math.round(H * scale);
  const grid = new Uint16Array(PW * PH);
  // visit every cell whose centre falls inside a logical-space bounding box
  const each = (x0, y0, x1, y1, fn) => {
    const a = Math.max(0, Math.floor(x0 * scale)), b = Math.min(PW - 1, Math.ceil(x1 * scale));
    const c = Math.max(0, Math.floor(y0 * scale)), d = Math.min(PH - 1, Math.ceil(y1 * scale));
    for (let py = c; py <= d; py++) for (let px = a; px <= b; px++) fn(px, py, (px + 0.5) / scale, (py + 0.5) / scale);
  };
  const layer = {
    W, H, scale,
    clear() { grid.fill(0); },
    update() {},
    rect(id, x, y, w, h) { each(x, y, x + w, y + h, (px, py, cx, cy) => { if (cx >= x && cx < x + w && cy >= y && cy < y + h) grid[py * PW + px] = id; }); },
    circle(id, x, y, r) { each(x - r, y - r, x + r, y + r, (px, py, cx, cy) => { if ((cx - x) ** 2 + (cy - y) ** 2 <= r * r) grid[py * PW + px] = id; }); },
    poly(id, pts) {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      each(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), (px, py, cx, cy) => {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > cy) !== (yj > cy) && cx < ((xj - xi) * (cy - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) grid[py * PW + px] = id;
      });
    },
    line(id, x1, y1, x2, y2, width = 4) {
      const hw = width / 2, dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy || 1;
      each(Math.min(x1, x2) - hw, Math.min(y1, y2) - hw, Math.max(x1, x2) + hw, Math.max(y1, y2) + hw, (px, py, cx, cy) => {
        const t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / len2));
        if ((cx - (x1 + t * dx)) ** 2 + (cy - (y1 + t * dy)) ** 2 <= hw * hw) grid[py * PW + px] = id;
      });
    },
    at(x, y) {
      const px = Math.floor(x * scale), py = Math.floor(y * scale);
      return px < 0 || py < 0 || px >= PW || py >= PH ? 0 : grid[py * PW + px];
    },
  };
  return layer;
}
