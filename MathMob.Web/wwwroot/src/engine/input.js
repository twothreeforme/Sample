// Pointer (mouse/touch) and keyboard input, reported in logical game coordinates.
export function createInput(canvas, W, H) {
  const input = {
    x: W / 2, y: H / 2,     // last pointer position (logical px)
    down: false,            // pointer/finger held
    pressed: false,         // went down this frame
    released: false,        // went up this frame
    keys: {},               // held keys by e.key
    keyPressed: {},         // keys that went down this frame
    endFrame() { input.pressed = false; input.released = false; input.keyPressed = {}; },
  };
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    input.x = (e.clientX - r.left) / r.width * W;
    input.y = (e.clientY - r.top) / r.height * H;
  };
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId); pos(e);
    input.down = true; input.pressed = true; e.preventDefault();
  });
  canvas.addEventListener('pointermove', pos);
  const up = () => { if (input.down) input.released = true; input.down = false; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  addEventListener('keydown', (e) => {
    if (!e.repeat) input.keyPressed[e.key] = true;
    input.keys[e.key] = true;
    if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
  });
  addEventListener('keyup', (e) => { input.keys[e.key] = false; });
  return input;
}
