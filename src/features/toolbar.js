import { camera, controls } from '../three/scene.js';
import { ITEM_CATALOG } from './catalog.js';
import { transitionToView } from './views.js';
import { toggleFireSafety } from './egress.js';
import { clearAll, rotateLast, removeLastOfType } from './placement.js';

/**
 * Canvas toolbar buttons: zoom, reset, rotate, clear — and the
 * top-bar Fire Egress toggle. Also handles the per-type "remove one"
 * buttons in the Placed Items list (event delegation).
 */
document.getElementById('fireSafetyBtn').addEventListener('click', toggleFireSafety);
document.getElementById('clearBtn').addEventListener('click', clearAll);

document.getElementById('placedList').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove-type]');
  if (!btn) return;
  const type = btn.dataset.removeType;
  const name = ITEM_CATALOG[type]?.name || type;
  removeLastOfType(type);
  showToast(`Removed one ${name}`, 'fa-minus');
});

document.getElementById('zoomIn').addEventListener('click', () => {
  const dir = camera.position.clone().sub(controls.target).multiplyScalar(0.15);
  camera.position.sub(dir);
});
document.getElementById('zoomOut').addEventListener('click', () => {
  const dir = camera.position.clone().sub(controls.target).multiplyScalar(0.15);
  camera.position.add(dir);
});
document.getElementById('resetView').addEventListener('click', () => transitionToView('perspective'));
document.getElementById('rotateLeft').addEventListener('click', () => rotateLast(-Math.PI / 4));
document.getElementById('rotateRight').addEventListener('click', () => rotateLast(Math.PI / 4));
