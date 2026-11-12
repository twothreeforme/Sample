// Game rules, no drawing. A squad auto-runs forward; the player steers left/right.
// The squad auto-fires at what is ahead, passes through gates that change its size, and fights a boss.
// All hit-tests (bullets, soldiers, gates) go through the pixel collision layer.
import { W, H } from '../engine/engine.js';

export const SQUAD_Y = 660, LEFT = 24, RIGHT = W - 24;
export const SP = 13, R = 5.5, MAXDRAW = 45;       // soldier spacing / radius / max soldiers drawn
export const SCROLL = 95, BOSS_Y = 170, GATE_H = 56;
const FIRE_DT = 0.22, MAX_SHOOTERS = 24, BULLET_V = 560;

export function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Gate effect from a spec like '+10', '-5', 'x2', '/2'. (Phase 5 replaces this with math problems.)
export function parseOp(s) {
  const m = /^([+\-x/])(\d+)$/.exec(s);
  if (!m) throw new Error('bad gate spec: ' + s);
  const v = +m[2], op = m[1];
  const apply = { '+': (n) => n + v, '-': (n) => Math.max(0, n - v), 'x': (n) => n * v, '/': (n) => Math.floor(n / v) }[op];
  return { label: op === '/' ? '÷' + v : op === 'x' ? '×' + v : s, apply, good: op === '+' || op === 'x' };
}

export function layout(count) {
  const m = Math.min(count, MAXDRAW);
  const cols = Math.min(9, Math.max(1, Math.ceil(Math.sqrt(m * 1.6))));
  return { m, cols, halfW: ((Math.min(cols, m) - 1) / 2) * SP + R };
}

export function createWorld(level, collision, seed = 1, difficulty = {}) {
  const rnd = mulberry32(seed);
  const D = { start: 1, enemyHp: 1, enemyDmg: 1, boss: 1, bossFire: 1, ...difficulty };
  const startCount = Math.max(1, Math.round(level.start * D.start));
  const items = [];
  let boss = null, length = 0;

  for (const ev of level.events) {
    length = Math.max(length, ev.at);
    if (ev.type === 'gates') {
      items.push({ kind: 'gate', wy: ev.at, done: false, gates: [parseOp(ev.left), parseOp(ev.right)] });
    } else if (ev.type === 'zombies') {
      const [x0, x1] = ev.spread || [LEFT + 20, RIGHT - 20];
      const hp = Math.max(1, Math.round(ev.hp * D.enemyHp)), dmg = Math.max(1, Math.round((ev.dmg || 2) * D.enemyDmg));
      for (let i = 0; i < ev.n; i++)
        items.push({ kind: 'zombie', x: x0 + rnd() * (x1 - x0), wy: ev.at + rnd() * 140, hp, maxhp: hp, r: 13, dmg, speed: ev.speed || 40, active: false });
    } else if (ev.type === 'barrel') {
      items.push({ kind: 'barrel', x: ev.x, wy: ev.at, hp: ev.hp || 10, maxhp: ev.hp || 10, r: 16 });
    } else if (ev.type === 'boss') {
      const bhp = Math.round(ev.hp * D.boss);
      boss = { kind: 'boss', x: W / 2, wy: ev.at, hp: bhp, maxhp: bhp, w: 170, h: 90, fireT: 1.5 };
      items.push(boss);
    }
  }

  const w = {
    level, length, boss, items, state: 'ready',      // ready -> play -> win | lose
    dist: 0, time: 0, count: startCount, sx: W / 2, bossLocked: false, diff: D,
    bullets: [], ebullets: [], particles: [], popups: [], fireT: 0,
    stats: { kills: 0, gates: 0, peak: startCount },
    ents: [null],
    screenY: (wy) => SQUAD_Y - (wy - w.dist),
    positions() {
      const { m, cols } = layout(w.count), out = [];
      for (let k = 0; k < m; k++) {
        const row = Math.floor(k / cols), rc = Math.min(cols, m - row * cols), col = k % cols;
        out.push({ x: w.sx + (col - (rc - 1) / 2) * SP, y: SQUAD_Y + row * SP * 0.85 });
      }
      return out;
    },
    start() { if (w.state === 'ready') w.state = 'play'; },
    step,
  };

  function burst(x, y, color, n = 6) {
    for (let i = 0; i < n; i++) { const a = rnd() * 6.283, v = 40 + rnd() * 90; w.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .4 + rnd() * .3, color }); }
  }
  const popup = (x, y, text, color) => w.popups.push({ x, y, text, color, life: 0.9 });

  // Redraw every collidable thing into the collision layer in this frame's screen coordinates.
  function drawCollision() {
    const L = collision; L.clear(); w.ents = [null];
    const add = (e) => { w.ents.push(e); return w.ents.length - 1; };
    for (const it of items) {                       // gates first so enemies draw over them
      const y = w.screenY(it.wy); it._y = y;
      if (y < -90 || y > H + 90 || it.kind !== 'gate' || it.done) continue;
      const half = (RIGHT - LEFT) / 2;
      it.gates.forEach((g, i) => L.rect(add({ kind: 'gate', row: it, g }), LEFT + i * half, y - GATE_H / 2, half - (i === 0 ? 3 : 0), GATE_H));
    }
    for (const it of items) {
      const y = it._y; if (y < -90 || y > H + 90 || it.dead) continue;
      if (it.kind === 'barrel') L.rect(add(it), it.x - it.r, y - it.r, it.r * 2, it.r * 2);
      else if (it.kind === 'zombie') L.circle(add(it), it.x, y, it.r);
      else if (it.kind === 'boss') L.rect(add(it), it.x - it.w / 2, y - it.h / 2, it.w, it.h);
    }
    for (const b of w.ebullets) L.circle(add({ kind: 'ebullet', ref: b }), b.x, b.y, 6);
    L.update();
  }

  function step(dt, targetX) {
    for (const p of w.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    w.particles = w.particles.filter((p) => p.life > 0);
    for (const p of w.popups) { p.y -= 40 * dt; p.life -= dt; }
    w.popups = w.popups.filter((p) => p.life > 0);
    if (w.state !== 'play') return;
    w.time += dt;

    // steer
    const { halfW } = layout(w.count);
    const tx = Math.max(LEFT + halfW, Math.min(RIGHT - halfW, targetX));
    w.sx += (tx - w.sx) * Math.min(1, dt * 14);

    // scroll until the boss arrives
    if (boss && !w.bossLocked && w.screenY(boss.wy) >= BOSS_Y) w.bossLocked = true;
    if (!w.bossLocked) w.dist += SCROLL * dt;
    if (boss && w.bossLocked) {
      boss.wy = w.dist + SQUAD_Y - BOSS_Y;
      boss.x = W / 2 + Math.sin(w.time * 0.8) * 120;
      boss.fireT -= dt;
      if (boss.fireT <= 0 && boss.hp > 0) {
        boss.fireT = 0.7 * D.bossFire;
        const by = BOSS_Y + boss.h / 2, dx = w.sx - boss.x, dy = SQUAD_Y - by, d = Math.hypot(dx, dy) || 1;
        w.ebullets.push({ x: boss.x, y: by, vx: dx / d * 240, vy: dy / d * 240 });
      }
    }

    // zombies wake up on screen and walk toward the squad
    for (const it of items) {
      if (it.kind !== 'zombie' || it.dead) continue;
      const y = w.screenY(it.wy);
      if (y > -30) it.active = true;
      if (it.active) { it.wy -= it.speed * dt; it.x += Math.sign(w.sx - it.x) * Math.min(25 * dt, Math.abs(w.sx - it.x)); }
    }
    for (const b of w.ebullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
    w.ebullets = w.ebullets.filter((b) => !b.dead && b.y < H + 20 && b.x > -20 && b.x < W + 20);

    drawCollision();
    const L = collision;

    // soldiers fire
    const pos = w.positions();
    w.fireT -= dt;
    if (w.fireT <= 0 && w.count > 0 && pos.length) {
      w.fireT += FIRE_DT;
      const s = Math.min(pos.length, MAX_SHOOTERS), stepI = pos.length / s;
      for (let i = 0; i < s; i++) { const p = pos[Math.floor(i * stepI)]; w.bullets.push({ x: p.x, y: p.y - 6, dmg: w.count / s }); }
    }

    // bullets hit enemies
    for (const b of w.bullets) {
      const ny = b.y - BULLET_V * dt;
      for (const y of [b.y, (b.y + ny) / 2, ny]) {
        const e = w.ents[L.at(b.x, y)];
        if (e && !e.dead && (e.kind === 'zombie' || e.kind === 'barrel' || e.kind === 'boss')) {
          e.hp -= b.dmg; b.dead = true; burst(b.x, y, '#ffd23f', 2);
          if (e.hp <= 0 && e.kind !== 'boss') { e.dead = true; w.stats.kills++; burst(e.x, w.screenY(e.wy), e.kind === 'zombie' ? '#7ed957' : '#b8793a', 10); }
          break;
        }
      }
      b.y = ny;
    }
    w.bullets = w.bullets.filter((b) => !b.dead && b.y > -10);

    // soldiers touch things
    let lost = 0;
    for (const p of pos) {
      const e = w.ents[L.at(p.x, p.y)];
      if (!e || e.dead) continue;
      if (e.kind === 'zombie') { lost += e.dmg; e.dead = true; burst(e.x, w.screenY(e.wy), '#7ed957', 8); popup(p.x, p.y - 10, '-' + e.dmg, '#ff6b6b'); }
      else if (e.kind === 'barrel') { lost += 3; e.dead = true; burst(e.x, w.screenY(e.wy), '#b8793a', 10); popup(p.x, p.y - 10, '-3', '#ff6b6b'); }
      else if (e.kind === 'ebullet') { lost += 1; e.ref.dead = true; }
    }
    if (lost) w.count = Math.max(0, w.count - lost);

    // squad centre passes through a gate
    const ge = w.ents[L.at(w.sx, SQUAD_Y - 8)];
    if (ge && ge.kind === 'gate' && !ge.row.done) {
      ge.row.done = true; ge.row.chosen = ge.g; w.stats.gates++;
      const before = w.count; w.count = ge.g.apply(w.count);
      popup(w.sx, SQUAD_Y - 30, (w.count >= before ? '+' : '') + (w.count - before), ge.g.good ? '#7dffb0' : '#ff6b6b');
    }
    w.stats.peak = Math.max(w.stats.peak, w.count);

    for (let i = items.length - 1; i >= 0; i--) {   // drop dead things and gates that scrolled past
      const it = items[i];
      if (it.dead || (it.kind === 'gate' && it.done && w.screenY(it.wy) > H + 90)) items.splice(i, 1);
    }

    if (boss && boss.hp <= 0) { w.state = 'win'; burst(boss.x, BOSS_Y, '#ffd23f', 40); }
    else if (w.count <= 0) w.state = 'lose';
  }
  return w;
}
