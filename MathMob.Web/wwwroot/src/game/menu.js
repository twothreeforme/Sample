// Menu scene: pick a difficulty, then New Game starts play immediately.
import { draw, W, H } from '../engine/engine.js';
import { DIFFICULTIES, diffById } from './levels.js';
import { button, inRect } from './ui.js';

const KEY = 'mathmob.difficulty';
const DIFF_BTNS = DIFFICULTIES.map((d, i) => ({ x: 35 + i * 140, y: 330, w: 130, h: 56, id: d.id }));
const NEW_GAME = { x: 90, y: 480, w: 300, h: 84 };

export const loadDifficulty = () => { try { return diffById(localStorage.getItem(KEY)).id; } catch { return 'normal'; } };
const saveDifficulty = (id) => { try { localStorage.setItem(KEY, id); } catch { /* private mode etc: fine */ } };

export function createMenuScene(engine) {
  const { input } = engine;
  let sel = 'normal';
  const select = (id) => { sel = id; saveDifficulty(id); };
  const start = () => engine.scenes.go('play', { difficulty: sel });

  return {
    enter() { sel = loadDifficulty(); },
    update() {
      const i = DIFFICULTIES.findIndex((d) => d.id === sel);
      if (input.keyPressed.ArrowLeft) select(DIFFICULTIES[Math.max(0, i - 1)].id);
      if (input.keyPressed.ArrowRight) select(DIFFICULTIES[Math.min(DIFFICULTIES.length - 1, i + 1)].id);
      if (input.keyPressed.Enter || input.keyPressed[' ']) return start();
      if (input.pressed) {
        for (const b of DIFF_BTNS) if (inRect(input.x, input.y, b)) select(b.id);
        if (inRect(input.x, input.y, NEW_GAME)) start();
      }
    },
    render(ctx) {
      draw.clear(ctx, W, H, '#12182b');
      for (let i = 0; i < 6; i++) draw.line(ctx, 60 + i * 72, 0, 240, 260, 'rgba(255,255,255,.04)', 2);   // faint road lines
      draw.text(ctx, 'MATH MOB', W / 2, 140, { size: 56, color: '#7fd4ff' });
      draw.text(ctx, 'Grow your squad. Beat the boss.', W / 2, 192, { size: 18, color: '#fffa', weight: 'normal' });
      draw.text(ctx, 'DIFFICULTY', W / 2, 300, { size: 15, color: '#fff9' });
      for (const b of DIFF_BTNS) button(ctx, b, diffById(b.id).name, { active: b.id === sel, color: '#2a6fdb' });
      draw.text(ctx, diffById(sel).blurb, W / 2, 420, { size: 16, color: '#fffc', weight: 'normal' });
      button(ctx, NEW_GAME, 'NEW GAME', { active: true, size: 32 });
      draw.text(ctx, '← → difficulty  ·  Enter / Space: new game', W / 2, H - 40, { size: 13, color: '#fff7', weight: 'normal' });
    },
  };
}
