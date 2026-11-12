// Tiny canvas UI helpers: buttons drawn from geometry + hit testing.
import { draw } from '../engine/draw.js';

export const inRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

export function button(ctx, r, label, { active = false, color = '#2fbf71', size = 22 } = {}) {
  draw.rrect(ctx, r.x, r.y, r.w, r.h, 12, active ? color : '#2b3a6b', active ? '#fff' : '#5c6fa8', active ? 3 : 2);
  draw.text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 1, { size });
}
