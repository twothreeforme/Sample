// Headless playthroughs of the game rules. Usage: node tools/sim-test.js
// Also the seed of the balance tool: prints outcome stats per bot.
import { createSoftLayer } from './soft-layer.js';
import { createWorld, parseOp, layout, LEFT, RIGHT } from '../MathMob.Web/wwwroot/src/game/world.js';
import { LEVELS, DIFFICULTIES } from '../MathMob.Web/wwwroot/src/game/levels.js';

let fails = 0, total = 0;
const ok = (name, cond, info = '') => { total++; if (!cond) { fails++; console.error(`FAIL ${name} ${info}`); } };

const layer = createSoftLayer(480, 800, 0.5);   // same resolution the game uses
const mid = (LEFT + RIGHT) / 2, laneC = [LEFT + (RIGHT - LEFT) / 4, RIGHT - (RIGHT - LEFT) / 4];

// bots return the x the squad should steer to
const bots = {
  idle: () => mid,
  smart: (w) => {   // head for the better side of the next unpassed gate, otherwise stay central
    const g = w.items.filter((i) => i.kind === 'gate' && !i.done && w.screenY(i.wy) > -40).sort((a, b) => b.wy - a.wy).pop();
    if (!g || w.screenY(g.wy) < 0) return mid;
    return g.gates[0].apply(w.count) >= g.gates[1].apply(w.count) ? laneC[0] : laneC[1];
  },
};

function play(level, bot, seed, diff = {}, maxSec = 180) {
  const w = createWorld(level, layer, seed, diff); w.start();
  for (let t = 0; t < maxSec * 60 && w.state === 'play'; t++) {
    w.step(1 / 60, bot(w));
  }
  return w;
}

// --- unit checks
ok('parseOp +', parseOp('+5').apply(10) === 15);
ok('parseOp x', parseOp('x3').apply(7) === 21);
ok('parseOp - floors at 0', parseOp('-9').apply(4) === 0);
ok('parseOp /', parseOp('/2').apply(7) === 3);
ok('layout caps drawn soldiers', layout(1000).m === 45);

// --- gate effect in isolation: one gate, nothing else
const gateOnly = { start: 10, events: [{ at: 300, type: 'gates', left: '+5', right: 'x2' }, { at: 900, type: 'boss', hp: 1 }] };
let w = createWorld(gateOnly, layer, 1); w.start();
for (let t = 0; t < 600 && w.stats.gates === 0; t++) w.step(1 / 60, laneC[1]);
ok('right gate (x2) doubled the squad', w.count === 20, `count=${w.count}`);
w = createWorld(gateOnly, layer, 1); w.start();
for (let t = 0; t < 600 && w.stats.gates === 0; t++) w.step(1 / 60, laneC[0]);
ok('left gate (+5) added 5', w.count === 15, `count=${w.count}`);

// --- bullets kill zombies
const zOnly = { start: 20, events: [{ at: 600, type: 'zombies', n: 3, hp: 5, spread: [230, 250] }, { at: 2000, type: 'boss', hp: 1 }] };
w = createWorld(zOnly, layer, 2); w.start();
for (let t = 0; t < 60 * 20; t++) w.step(1 / 60, 240);
ok('zombies in line of fire all die', w.stats.kills === 3, `kills=${w.stats.kills}`);

// --- zombies that reach the squad cost soldiers
w = createWorld({ start: 5, events: [{ at: 500, type: 'zombies', n: 6, hp: 9999, spread: [220, 260] }, { at: 2000, type: 'boss', hp: 1 }] }, layer, 3); w.start();
for (let t = 0; t < 60 * 30 && w.state === 'play'; t++) w.step(1 / 60, 240);
ok('unkillable zombies wipe out the squad', w.state === 'lose', `state=${w.state} count=${w.count}`);

// --- difficulty multipliers reach the world
const probe = { start: 10, events: [{ at: 600, type: 'zombies', n: 2, hp: 10, dmg: 2 }, { at: 3000, type: 'boss', hp: 1000 }] };
const byId = Object.fromEntries(DIFFICULTIES.map((d) => [d.id, d]));
const wN = createWorld(probe, layer, 1, byId.normal), wE = createWorld(probe, layer, 1, byId.easy), wH = createWorld(probe, layer, 1, byId.hard);
const zHp = (x) => x.items.find((i) => i.kind === 'zombie').maxhp, zDmg = (x) => x.items.find((i) => i.kind === 'zombie').dmg;
ok('normal changes nothing', wN.count === 10 && zHp(wN) === 10 && zDmg(wN) === 2 && wN.boss.maxhp === 1000);
ok('easy: bigger squad', wE.count === 13, `count=${wE.count}`);
ok('easy: weaker zombies/boss', zHp(wE) === 9 && zDmg(wE) === 2 && wE.boss.maxhp === 750, `hp=${zHp(wE)} dmg=${zDmg(wE)} boss=${wE.boss.maxhp}`);
ok('hard: smaller squad', wH.count === 7, `count=${wH.count}`);
ok('hard: tougher zombies/boss', zHp(wH) === 15 && zDmg(wH) === 3 && wH.boss.maxhp === 1600, `hp=${zHp(wH)} dmg=${zDmg(wH)} boss=${wH.boss.maxhp}`);
ok('no difficulty given = normal', createWorld(probe, layer, 1).count === 10);

// --- full level playthroughs, every difficulty
console.log('level            diff    bot    seeds  wins   avg final squad  avg peak');
const results = {};
for (const level of LEVELS) for (const diff of DIFFICULTIES) for (const [name, bot] of Object.entries(bots)) {
  let wins = 0, final = 0, peak = 0; const N = 10;
  for (let s = 1; s <= N; s++) { const r = play(level, bot, s, diff); if (r.state === 'win') wins++; final += r.count; peak += r.stats.peak; }
  results[`${diff.id}/${name}`] = { wins, final: final / N };
  console.log(`${level.name.padEnd(16)} ${diff.id.padEnd(7)} ${name.padEnd(6)} ${String(N).padEnd(6)} ${String(wins).padEnd(6)} ${(final / N).toFixed(1).padEnd(16)} ${(peak / N).toFixed(1)}`);
  if (name === 'smart') ok(`${level.name}/${diff.id}: smart bot wins most runs`, wins >= 7, `wins=${wins}/${N}`);
  if (name === 'idle') ok(`${level.name}/${diff.id}: idle bot does not always win`, wins < N, `wins=${wins}/${N}`);
}
ok('easier difficulty leaves a bigger squad (smart bot)', results['easy/smart'].final > results['normal/smart'].final && results['normal/smart'].final > results['hard/smart'].final,
  JSON.stringify([results['easy/smart'].final, results['normal/smart'].final, results['hard/smart'].final]));

console.log(`${total - fails}/${total} simulation checks passed`);
process.exit(fails ? 1 : 0);
