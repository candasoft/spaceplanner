import { state } from '../core/state.js';
import { hexToRgb } from '../core/utils.js';
import { showToast } from './toast.js';
import { getGhostItem } from './selection.js';
import { recolorEgressPath } from './egress.js';
import { markDirty } from '../core/dirty.js';

/**
 * Brand theming: one accent color that recolors every mesh flagged
 * with `userData.brand`, plus CSS custom properties for the UI chrome.
 */
export function setBrandColor(color) {
  state.brandColor = color;
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-rgb', hexToRgb(color));
  document.getElementById('colorWrap').style.background = color;
  document.getElementById('brandHex').textContent = color.toUpperCase();

  // Pulse effect
  const colorWrap = document.getElementById('colorWrap');
  colorWrap.classList.remove('pulse-once');
  void colorWrap.offsetWidth;
  colorWrap.classList.add('pulse-once');

  // Recolor branded meshes
  state.placedItems.forEach(item => {
    item.mesh.traverse(c => {
      if (c.isMesh && c.userData.brand) {
        c.material.color.set(color);
      }
    });
  });
  // Egress path color
  recolorEgressPath(color);
  markDirty();
  // Ghost preview
  const ghost = getGhostItem();
  if (ghost) {
    ghost.traverse(c => {
      if (c.isMesh && c.userData.brand) c.material.color.set(color);
    });
  }
}

document.getElementById('brandColor').addEventListener('input', (e) => {
  setBrandColor(e.target.value);
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
});

document.querySelectorAll('.swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    const color = swatch.dataset.color;
    document.getElementById('brandColor').value = color;
    setBrandColor(color);
    showToast('Brand color applied across the room', 'fa-palette');
  });
});
