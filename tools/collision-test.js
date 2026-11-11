// Headless test of the pixel collision layer. Usage: node tools/collision-test.js
import { createCanvas } from '@napi-rs/canvas';
import { createCollisionLayer, reflect } from '../MathMob.Web/wwwroot/src/engine/collision.js';

let fails = 0, total = 0;
const eq = (name, got, want) => { total++; if (got !== want) { fails++; console.error(`FAIL ${name}: got ${got}, want ${want}`); } };
const ok = (name, cond, info = '') => { total++; if (!cond) { fails++; console.error(`FAIL ${name} ${info}`); } };

const L = createCollisionLayer(480, 800, createCanvas);
L.clear();
L.circle(1, 100, 100, 30);
L.rect(2, 200, 50, 80, 40);
L.poly(3, [[300, 200], [360, 200], [330, 140]]);
L.line(4, 50, 300, 250, 300, 6);
L.rect(4095, 400, 400, 20, 20);          // highest id
L.circle(5, 150, 500, 40);
L.rect(6, 140, 490, 40, 20);             // overlaps the circle, drawn later -> wins
L.update();

// shape interiors and exteriors
eq('circle centre', L.at(100, 100), 1);
eq('circle just inside', L.at(127, 100), 1);
eq('circle just outside', L.at(135, 100), 0);
eq('rect inside', L.at(240, 70), 2);
eq('rect outside', L.at(240, 100), 0);
eq('poly inside', L.at(330, 190), 3);
eq('poly outside corner', L.at(305, 145), 0);
eq('thick line', L.at(150, 300), 4);
eq('line miss', L.at(150, 310), 0);
eq('max id', L.at(410, 410), 4095);
eq('overlap: later draw wins', L.at(160, 500), 6);
eq('overlap: earlier still visible', L.at(150, 530), 5);
eq('out of bounds', L.at(-5, -5), 0);
eq('out of bounds far', L.at(9999, 9999), 0);
eq('fractional coords', L.at(100.7, 100.2), 1);

// every id round-trips through the colour encoding
L.clear();
for (let id = 1; id < 4096; id++) L.rect(id, (id % 64) * 7, Math.floor(id / 64) * 7, 5, 5);
L.update();
let bad = 0;
for (let id = 1; id < 4096; id++) if (L.at((id % 64) * 7 + 2, Math.floor(id / 64) * 7 + 2) !== id) bad++;
eq('all 4095 ids round-trip', bad, 0);

// normals
L.clear(); L.circle(1, 200, 200, 30); L.rect(2, 300, 300, 100, 20); L.update();
let p = L.probe(232, 200, 6);
ok('probe hits circle', p && p.id === 1);
ok('circle normal points right', p && p.nx > 0.8 && Math.abs(p.ny) < 0.3, JSON.stringify(p));
p = L.probe(200, 168, 6);
ok('circle normal points up', p && p.ny < -0.8 && Math.abs(p.nx) < 0.3, JSON.stringify(p));
p = L.probe(350, 296, 6);
ok('rect top normal points up', p && p.id === 2 && p.ny < -0.7, JSON.stringify(p));
eq('probe in empty space', L.probe(50, 700, 6), null);

// simulated unit: fired straight up at a wall, must bounce back down and never tunnel through
L.clear(); L.rect(9, 0, 100, 480, 20); L.update();
let u = { x: 240, y: 400, vx: 0, vy: -320 }, bounced = false, tunneled = false;
for (let t = 0; t < 120; t++) {
  u.x += u.vx / 60; u.y += u.vy / 60;
  const hit = L.probe(u.x, u.y, 4);
  if (hit) { [u.vx, u.vy] = reflect(u.vx, u.vy, hit.nx, hit.ny); u.y += hit.ny * 2; bounced = true; }
  if (u.y < 95) tunneled = true;
}
ok('unit bounced off wall', bounced);
ok('unit never tunnelled', !tunneled, `y=${u.y}`);
ok('unit now moving down', u.vy > 0, `vy=${u.vy}`);

// reflect() maths
let [rx, ry] = reflect(3, -4, 0, 1);
ok('reflect off floor', rx === 3 && ry === 4);
[rx, ry] = reflect(3, 4, 0, 1);
ok('no reflect when moving away', rx === 3 && ry === 4);

console.log(`${total - fails}/${total} collision checks passed`);
process.exit(fails ? 1 : 0);
