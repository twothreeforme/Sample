// Fixed-timestep loop: update() runs at a constant rate, render() once per frame.
export function createLoop(update, render, stepHz = 60) {
  const step = 1 / stepHz;
  let acc = 0, last = 0, running = false, raf = 0;
  const stats = { fps: 0, frames: 0, t: 0 };

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now;
    acc += dt;
    while (acc >= step) { update(step); acc -= step; }
    render(acc / step);
    stats.frames++; stats.t += dt;
    if (stats.t >= 0.5) { stats.fps = Math.round(stats.frames / stats.t); stats.frames = 0; stats.t = 0; }
    raf = requestAnimationFrame(frame);
  }
  return {
    stats,
    start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
  };
}
