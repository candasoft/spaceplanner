import { scene, container } from '../three/scene.js';
import { state } from '../core/state.js';
import { ITEM_CATALOG } from './catalog.js';
import { showToast } from './toast.js';

/**
 * Furniture selection for placement: toggles the placing cursor mode
 * and shows/hides the translucent ghost preview mesh.
 */
let ghostItem = null;

export function getGhostItem() {
  return ghostItem;
}

export function setGhostItem(mesh) {
  ghostItem = mesh;
}

export function removeGhost() {
  if (ghostItem) {
    scene.remove(ghostItem);
    ghostItem = null;
  }
}

export function selectItem(key) {
  if (state.selectedItem === key) {
    // Deselect
    state.selectedItem = null;
    document.querySelectorAll('.item-card').forEach(c => c.classList.remove('active'));
    container.classList.remove('placing');
    removeGhost();
    return;
  }
  state.selectedItem = key;
  document.querySelectorAll('.item-card').forEach(c => c.classList.toggle('active', c.dataset.item === key));
  container.classList.add('placing');
  removeGhost();
  showToast(`${ITEM_CATALOG[key].name} selected — click floor to place`, 'fa-hand-pointer');
}

export function deselectItem() {
  if (state.selectedItem) selectItem(state.selectedItem);
}
