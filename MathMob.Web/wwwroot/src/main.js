import { createEngine } from './engine/engine.js';
import { createMenuScene } from './game/menu.js';
import { createPlayScene } from './game/play.js';

const engine = createEngine(document.getElementById('game'));
engine.scenes.add('menu', createMenuScene(engine));
engine.scenes.add('play', createPlayScene(engine));
engine.scenes.go('menu');
engine.loop.start();
