import { createEngine, draw, reflect, W, H } from './engine/engine.js';

const engine = createEngine(document.getElementById('game'));
const { input, collision } = engine;

// Phase 2 demo: units bounce off obstacles using the pixel collision layer.
// Move: pointer / arrow keys.  Fire: hold pointer / space.  D: toggle collision-layer debug view.
const OBSTACLES = [
  { id: 1, name: 'circle',   color: '#e67e22', shape: 'circle', x: 120, y: 420, r: 45 },
  { id: 2, name: 'block',    color: '#9b59b6', shape: 'rect',   x: 250, y: 300, w: 110, h: 30 },
  { id: 3, name: 'triangle', color: '#16a085', shape: 'poly',   pts: [[340, 520], [440, 520], [390, 440]] },
  { id: 4, name: 'bar',      color: '#c0392b', shape: 'rect',   x: 30,  y: 200, w: 160, h: 16 },
];

const demo = {
  enter() { this.x = W / 2; this.units = []; this.hits = {}; this.debug = false; this.fireT = 0; },
  update(dt) {
    if (input.keyPressed.d) this.debug = !this.debug;
    const k = (input.keys.ArrowRight ? 1 : 0) - (input.keys.ArrowLeft ? 1 : 0);
    if (k) this.x += k * 380 * dt;
    else if (input.down) this.x += (input.x - this.x) * Math.min(1, dt * 18);
    this.x = Math.max(20, Math.min(W - 20, this.x));

    // fire stream
    this.fireT -= dt;
    if ((input.down || input.keys[' ']) && this.fireT <= 0) {
      this.units.push({ x: this.x, y: 705, vx: (Math.random() - .5) * 40, vy: -330, life: 6 });
      this.fireT = 0.06;
    }

    // rebuild + snapshot the collision layer (static here, but a real level redraws moving objects each frame)
    collision.clear();
    for (const o of OBSTACLES) {
      if (o.shape === 'circle') collision.circle(o.id, o.x, o.y, o.r);
      else if (o.shape === 'rect') collision.rect(o.id, o.x, o.y, o.w, o.h);
      else collision.poly(o.id, o.pts);
    }
    collision.update();

    for (const u of this.units) {
      u.x += u.vx * dt; u.y += u.vy * dt; u.life -= dt;
      const hit = collision.probe(u.x, u.y, 5);
      if (hit) {
        [u.vx, u.vy] = reflect(u.vx, u.vy, hit.nx, hit.ny, 0.95);
        u.x += hit.nx * 2; u.y += hit.ny * 2;
        this.hits[hit.id] = (this.hits[hit.id] || 0) + 1;
      }
      if (u.x < 5 || u.x > W - 5) { u.vx = -u.vx; u.x = Math.max(5, Math.min(W - 5, u.x)); }
      u.vy += 120 * dt;                // a little gravity so bounced units come back down
    }
    this.units = this.units.filter((u) => u.life > 0 && u.y < H + 10 && u.y > -10);
  },
  render(ctx) {
    draw.clear(ctx, W, H, '#12204a');
    if (this.debug) { ctx.globalAlpha = 0.9; ctx.drawImage(collision.canvas, 0, 0, W, H); ctx.globalAlpha = 1; }
    else for (const o of OBSTACLES) {
      if (o.shape === 'circle') draw.circle(ctx, o.x, o.y, o.r, o.color);
      else if (o.shape === 'rect') draw.rect(ctx, o.x, o.y, o.w, o.h, o.color);
      else draw.poly(ctx, o.pts, o.color);
    }
    for (const u of this.units) draw.circle(ctx, u.x, u.y, 4, '#7fd4ff');
    draw.poly(ctx, [[this.x, 710], [this.x - 18, 750], [this.x + 18, 750]], '#ffd23f');
    draw.text(ctx, 'Phase 2: pixel collision', W / 2, 24, { size: 18 });
    draw.text(ctx, `${engine.loop.stats.fps} fps · ${this.units.length} units · D = debug layer ${this.debug ? '(on)' : ''}`, W / 2, 48, { size: 13, color: '#fff9' });
    const line = OBSTACLES.map((o) => `${o.name} ${this.hits[o.id] || 0}`).join('  ·  ');
    draw.text(ctx, line, W / 2, 780, { size: 13, color: '#fff9' });
  },
};

engine.scenes.add('demo', demo);
engine.scenes.go('demo');
engine.loop.start();
