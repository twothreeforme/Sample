// Minimal scene manager. A scene is { enter(data), update(dt), render(ctx) , exit() }.
export function createScenes() {
  const scenes = {};
  let current = null;
  return {
    add(name, scene) { scenes[name] = scene; },
    go(name, data) {
      if (current && current.exit) current.exit();
      current = scenes[name];
      if (!current) throw new Error('Unknown scene: ' + name);
      if (current.enter) current.enter(data);
    },
    update(dt) { if (current && current.update) current.update(dt); },
    render(ctx) { if (current && current.render) current.render(ctx); },
  };
}
