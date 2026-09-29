import './styles/main.css';

// ---- Three.js bootstrap (scene, camera, renderer, lights, loop) ----
import { startRenderLoop } from './three/scene.js';

// ---- Feature modules ----
import { initLibrary } from './features/library.js';
import './features/itemEditor.js';
import './features/costing.js';
import './features/brand.js';
import './features/egress.js';
import './features/views.js';
import './features/toolbar.js';
import './features/keyboard.js';
import './features/floorEditor.js';
import './features/export.js';
import './features/project.js';
// Applies stored price overrides into ITEM_CATALOG before boot — must be
// imported so the library/placement/stats render with custom prices.
import './features/prices.js';

// ---- Boot flow ----
import { loadTemplate } from './features/templates.js';
import { showToast } from './features/toast.js';
import { clearDirty } from './core/dirty.js';

// Initial layout + UI + render loop
initLibrary();
loadTemplate('cafe');
clearDirty(); // the boot layout itself is not an "unsaved edit"
startRenderLoop();

setTimeout(() => showToast('Welcome — try clicking a chair, then the floor', 'fa-hand-pointer'), 800);
