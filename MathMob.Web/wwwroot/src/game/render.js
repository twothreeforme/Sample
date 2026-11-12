// Draws a world using only lines and geometry.
import { draw } from '../engine/draw.js';
import { W, H } from '../engine/engine.js';
import { LEFT, RIGHT, SQUAD_Y, GATE_H, R, BOSS_Y } from './world.js';

export function renderWorld(ctx, w) {
  draw.clear(ctx, W, H, '#1c2233');
  draw.rect(ctx, LEFT - 6, 0, RIGHT - LEFT + 12, H, '#262e45');                 // road
  draw.line(ctx, LEFT - 6, 0, LEFT - 6, H, '#4a5578', 3);
  draw.line(ctx, RIGHT + 6, 0, RIGHT + 6, H, '#4a5578', 3);
  const off = w.dist % 80;                                                       // scrolling centre dashes
  for (let y = -80 + off; y < H; y += 80) draw.line(ctx, W / 2, y, W / 2, y + 36, '#3a4565', 3);

  // gates
  const half = (RIGHT - LEFT) / 2;
  for (const it of w.items) {
    if (it.kind !== 'gate') continue;
    const y = w.screenY(it.wy); if (y < -80 || y > H + 80) continue;
    it.gates.forEach((g, i) => {
      const x = LEFT + i * half, gw = half - (i === 0 ? 3 : 0);
      const chosen = it.done && it.chosen === g, faded = it.done && !chosen;
      ctx.globalAlpha = faded ? 0.25 : 1;
      draw.rect(ctx, x, y - GATE_H / 2, gw, GATE_H, g.good ? '#2a6fdb' : '#c0392b', chosen ? '#fff' : 'rgba(255,255,255,.5)', chosen ? 4 : 2);
      draw.text(ctx, g.label, x + gw / 2, y + 2, { size: 30 });
      ctx.globalAlpha = 1;
    });
  }
  // barrels, zombies, boss
  for (const it of w.items) {
    const y = w.screenY(it.wy); if (y < -100 || y > H + 100) continue;
    if (it.kind === 'barrel') {
      draw.rect(ctx, it.x - it.r, y - it.r, it.r * 2, it.r * 2, '#8a5a2b', '#d9a566');
      draw.line(ctx, it.x - it.r, y - it.r, it.x + it.r, y + it.r, '#d9a566', 2);
      draw.line(ctx, it.x + it.r, y - it.r, it.x - it.r, y + it.r, '#d9a566', 2);
    } else if (it.kind === 'zombie') {
      draw.circle(ctx, it.x, y, it.r, '#4caf50', '#1b5e20');
      draw.circle(ctx, it.x - 4, y - 3, 2.5, '#111'); draw.circle(ctx, it.x + 4, y - 3, 2.5, '#111');
      draw.line(ctx, it.x - 4, y + 5, it.x + 4, y + 5, '#111', 2);
      draw.text(ctx, Math.ceil(it.hp), it.x, y - it.r - 8, { size: 11, color: '#cfe' });
    } else if (it.kind === 'boss') {
      const bw = it.w, bh = it.h;
      draw.poly(ctx, [[it.x - bw / 2, y - bh / 2 + 20], [it.x - bw / 4, y - bh / 2], [it.x + bw / 4, y - bh / 2], [it.x + bw / 2, y - bh / 2 + 20], [it.x + bw / 2, y + bh / 2], [it.x - bw / 2, y + bh / 2]], '#8e1b1b', '#ff6b6b', 3);
      draw.circle(ctx, it.x - 30, y - 5, 9, '#ffd23f'); draw.circle(ctx, it.x + 30, y - 5, 9, '#ffd23f');
      draw.line(ctx, it.x - 35, y + 25, it.x + 35, y + 25, '#111', 4);
    }
  }
  // boss HP bar + enemy shots
  if (w.boss && w.boss.hp > 0 && w.screenY(w.boss.wy) > -50) {
    const b = w.boss, f = Math.max(0, b.hp) / b.maxhp;
    draw.rect(ctx, 60, 56, W - 120, 14, '#0008', '#fff6', 2);
    draw.rect(ctx, 60, 56, (W - 120) * f, 14, '#e74c3c');
    draw.text(ctx, `BOSS ${Math.ceil(b.hp)}`, W / 2, 44, { size: 14 });
  }
  for (const b of w.ebullets) draw.circle(ctx, b.x, b.y, 6, '#ff9f43', '#fff');

  // squad
  for (const b of w.bullets) draw.line(ctx, b.x, b.y, b.x, b.y + 8, '#ffe066', 2.5);
  for (const p of w.positions()) {
    draw.circle(ctx, p.x, p.y, R, '#7fd4ff', '#0d3b66', 1.5);
    draw.line(ctx, p.x, p.y, p.x, p.y - 8, '#0d3b66', 2);
  }
  if (w.count > 0) draw.text(ctx, w.count, w.sx, SQUAD_Y - 26, { size: 26, color: '#7fd4ff' });

  for (const p of w.particles) { ctx.globalAlpha = Math.min(1, p.life * 2.5); draw.circle(ctx, p.x, p.y, 2.5, p.color); }
  ctx.globalAlpha = 1;
  for (const p of w.popups) draw.text(ctx, p.text, p.x, p.y, { size: 22, color: p.color });

  // HUD: progress to the boss
  const prog = Math.min(1, w.dist / Math.max(1, w.boss ? w.boss.wy - (SQUAD_Y - BOSS_Y) : w.length));
  draw.rect(ctx, 14, 12, W - 28, 6, '#0008');
  draw.rect(ctx, 14, 12, (W - 28) * prog, 6, '#7dffb0');
}
