import { state } from '../core/state.js';
import { ITEM_CATALOG } from './catalog.js';
import { deselectItem, selectItem } from './selection.js';
import { deselectPlaced } from './itemEditor.js';
import { toggleView } from './views.js';
import { toggleFireSafety } from './egress.js';
import { toggleCostPanel } from './costing.js';

/**
 * Global keyboard shortcuts:
 *   Esc — deselect furniture
 *   V   — toggle 3D / floor plan view
 *   F   — fire egress paths
 *   C   — cost panel
 *   1-9 — select furniture from the library
 */
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'Escape') {
    deselectPlaced(); // clears placed-item selection if any, no-op otherwise
    deselectItem();
  } else if (e.key === 'v' || e.key === 'V') {
    toggleView();
  } else if (e.key === 'f' || e.key === 'F') {
    toggleFireSafety();
  } else if (e.key === 'c' || e.key === 'C') {
    toggleCostPanel();
  } else if (e.key >= '1' && e.key <= '9') {
    const keys = Object.keys(ITEM_CATALOG);
    const idx = parseInt(e.key) - 1;
    if (keys[idx]) selectItem(keys[idx]);
  }
});
