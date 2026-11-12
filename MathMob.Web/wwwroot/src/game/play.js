// Play scene: wraps a world with input, HUD and a win/lose screen.
// Entered from the menu with { difficulty }, and the game begins immediately.
import { draw, W, H } from '../engine/engine.js';
import { createWorld } from './world.js';
import { renderWorld } from './render.js';
import { LEVELS, diffById } from './levels.js';
import { button, inRect } from './ui.js';

const MENU_BTN = { x: W - 76, y: 26, w: 62, h: 28 };
const AGAIN_BTN = { x: 55, y: 440, w: 175, h: 58 };
const BACK_BTN = { x: 250, y: 440, w: 175, h: 58 };

export function createPlayScene(engine) {
  const { input, collision } = engine;
  let world, tx, diff = diffById('normal'), levelIdx = 0;

  const begin = () => {
    world = createWorld(LEVELS[levelIdx], collision, (Math.random() * 1e9) | 0, diff);
    tx = W / 2;
    world.start();                                   // New Game -> the run begins right away
  };
  const toMenu = () => engine.scenes.go('menu');

  return {
    enter(data) { diff = diffById(data && data.difficulty); begin(); },
    update(dt) {
      const over = world.state === 'win' || world.state === 'lose';
      if (input.pressed && inRect(input.x, input.y, over ? BACK_BTN : MENU_BTN)) return toMenu();
      if (input.keyPressed.Escape) return toMenu();
      if (over) {
        if ((input.pressed && inRect(input.x, input.y, AGAIN_BTN)) || input.keyPressed.Enter || input.keyPressed[' ']) return begin();
      } else {
        const k = (input.keys.ArrowRight || input.keys.d ? 1 : 0) - (input.keys.ArrowLeft || input.keys.a ? 1 : 0);
        if (k) tx += k * 380 * dt; else if (input.down) tx = input.x;
      }
      world.step(dt, tx);
    },
    render(ctx) {
      renderWorld(ctx, world);
      const s = world.stats;
      draw.text(ctx, diff.name, 16, 40, { size: 13, color: '#fffa', align: 'left' });
      button(ctx, MENU_BTN, 'Menu', { size: 14 });
      draw.text(ctx, `Kills ${s.kills}  ·  Gates ${s.gates}  ·  ${engine.loop.stats.fps} fps`, W / 2, H - 14, { size: 12, color: '#fff7' });
      if (world.state === 'win') endBanner(ctx, 'VICTORY!', `Squad left: ${world.count}  ·  ${diff.name}`, '#7dffb0');
      if (world.state === 'lose') endBanner(ctx, 'SQUAD LOST', `${s.kills} kills  ·  ${diff.name}`, '#ff6b6b');
    },
  };
}

function endBanner(ctx, title, sub, color) {
  draw.rrect(ctx, 30, 290, W - 60, 230, 16, 'rgba(8,12,30,.9)', '#fff5');
  draw.text(ctx, title, W / 2, 340, { size: 34, color });
  draw.text(ctx, sub, W / 2, 392, { size: 16, color: '#fffc', weight: 'normal' });
  button(ctx, AGAIN_BTN, 'Play Again', { active: true, size: 20 });
  button(ctx, BACK_BTN, 'Menu', { size: 20 });
}
