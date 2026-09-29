import * as THREE from 'three';
import { camera, controls } from '../three/scene.js';
import { state } from '../core/state.js';
import { roomDims } from '../core/constants.js';

/**
 * Camera view transitions between the 3D perspective and the
 * top-down floor plan, with an eased animation.
 * Presets scale with the room footprint.
 */
function cameraViews() {
  const W = roomDims.w, D = roomDims.d;
  return {
    perspective: {
      pos: new THREE.Vector3(W * 0.83, Math.max(8, D * 0.8), D * 1.2),
      target: new THREE.Vector3(0, 1, 0),
      fov: 40
    },
    top: {
      pos: new THREE.Vector3(0, Math.max(16, Math.max(W, D) * 1.34), 0.01),
      target: new THREE.Vector3(0, 0, 0),
      fov: 34
    }
  };
}

let cameraAnim = null;

export function transitionToView(view) {
  state.view = view;
  document.querySelectorAll('#viewToggle button').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });

  // Show/hide floor plan overlay
  document.getElementById('floorplanOverlay').classList.toggle('show', view === 'top');

  const views = cameraViews();
  const target = views[view];
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startFov = camera.fov;
  const duration = 1100;
  const startTime = performance.now();
  controls.enabled = false;

  function animate() {
    const t = Math.min(1, (performance.now() - startTime) / duration);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    camera.position.lerpVectors(startPos, target.pos, eased);
    controls.target.lerpVectors(startTarget, target.target, eased);
    camera.fov = startFov + (target.fov - startFov) * eased;
    camera.updateProjectionMatrix();
    controls.update();
    if (t < 1) cameraAnim = requestAnimationFrame(animate);
    else { controls.enabled = true; cameraAnim = null; }
  }
  if (cameraAnim) cancelAnimationFrame(cameraAnim);
  animate();
}

/** Toggle between the two views (keyboard shortcut `V`). */
export function toggleView() {
  transitionToView(state.view === 'perspective' ? 'top' : 'perspective');
}

document.querySelectorAll('#viewToggle button').forEach(btn => {
  btn.addEventListener('click', () => transitionToView(btn.dataset.view));
});
