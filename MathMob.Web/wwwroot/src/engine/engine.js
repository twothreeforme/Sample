// Ties canvas, loop, input and scenes together.
import { createLoop } from './loop.js';
import { createInput } from './input.js';
import { createScenes } from './scene.js';
import { createCollisionLayer } from './collision.js';
export { draw } from './draw.js';
export { reflect } from './collision.js';

export const W = 480, H = 800;   // logical game size; everything is authored in these units

export function createEngine(canvas) {
  const ctx = canvas.getContext('2d');
  const scale = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * scale; canvas.height = H * scale;
  const input = createInput(canvas, W, H);
  const scenes = createScenes();
  const collision = createCollisionLayer(W, H);

  const loop = createLoop(
    (dt) => { scenes.update(dt); input.endFrame(); },
    () => { ctx.setTransform(scale, 0, 0, scale, 0, 0); scenes.render(ctx); },
  );
  return { canvas, ctx, input, scenes, collision, loop, W, H };
}
