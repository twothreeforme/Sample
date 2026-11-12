// Difficulty multipliers applied when a game starts.
//   start: starting squad size · enemyHp/enemyDmg: zombies · boss: boss HP · bossFire: boss shot interval (bigger = slower)
export const DIFFICULTIES = [
  { id: 'easy',   name: 'Easy',   start: 1.3, enemyHp: 0.85, enemyDmg: 1, boss: 0.75, bossFire: 1.25, blurb: 'Bigger squad, weaker zombies, slower boss' },
  { id: 'normal', name: 'Normal', start: 1,   enemyHp: 1,   enemyDmg: 1,   boss: 1,   bossFire: 1,   blurb: 'The standard challenge' },
  { id: 'hard',   name: 'Hard',   start: 0.7, enemyHp: 1.5, enemyDmg: 1.5, boss: 1.6, bossFire: 0.7, blurb: 'Smaller squad, tougher zombies, faster boss' },
];
export const diffById = (id) => DIFFICULTIES.find((d) => d.id === id) || DIFFICULTIES[1];

// Level data. `at` is the distance (world px) where the thing sits; the squad starts at 0 and scrolls forward.
// Gate specs: '+N', '-N', 'xN', '/N'. (Phase 5 swaps these for math problems.)
export const LEVELS = [
  {
    name: 'Test Level',
    start: 10,
    events: [
      { at: 500,  type: 'gates', left: '+5',  right: 'x2' },
      { at: 900,  type: 'zombies', n: 5, hp: 6 },
      { at: 1300, type: 'gates', left: '-8',  right: '+12' },
      { at: 1600, type: 'barrel', x: 150 },
      { at: 1600, type: 'barrel', x: 330 },
      { at: 1750, type: 'zombies', n: 8, hp: 8 },
      { at: 2150, type: 'gates', left: 'x3',  right: '-10' },
      { at: 2500, type: 'zombies', n: 12, hp: 10 },
      { at: 2900, type: 'gates', left: '+20', right: 'x2' },
      { at: 3500, type: 'boss', hp: 9000 },
    ],
  },
];
