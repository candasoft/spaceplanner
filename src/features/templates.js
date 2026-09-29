import { state } from '../core/state.js';
import { roomDims } from '../core/constants.js';
import { showToast } from './toast.js';
import { clearAll, placeItemAt } from './placement.js';
import { renderLibrary } from './library.js';
import { resizeRoom } from './floorEditor.js';
import { markDirty } from '../core/dirty.js';

/**
 * Refresh template-dependent UI: library ordering (exhibition pieces first),
 * active template card and the brand badge. Does NOT touch the scene —
 * reused by project restore so saved layouts can set the template chrome
 * without re-placing the template's furniture.
 */
export function applyTemplateUI(name) {
  renderLibrary(name === 'exhibition' ? 'exhibition' : null);
  document.querySelectorAll('.template-card').forEach(c => {
    c.classList.toggle('active', c.dataset.template === name);
  });
  const label = name
    ? `${name.charAt(0).toUpperCase() + name.slice(1)} Template`
    : 'No Template';
  document.querySelector('.brand-badge').innerHTML = `<span class="w-1.5 h-1.5 rounded-full" style="background: var(--accent);"></span>${label}`;
}

/**
 * Room templates: preset furniture layouts loaded into the scene.
 */
export function loadTemplate(name) {
  clearAll();
  state.template = name;

  if (name === 'cafe') {
    placeItemAt('counter', -3.2, -4);
    [[-1.8, -1.5], [1.8, -1.5], [-1.8, 1.5], [1.8, 1.5], [0, 3.2]].forEach(([x, z]) => {
      placeItemAt('round_table', x, z);
      placeItemAt('chair', x - 0.85, z, Math.PI / 2);
      placeItemAt('chair', x + 0.85, z, -Math.PI / 2);
      placeItemAt('chair', x, z - 0.85, 0);
      placeItemAt('chair', x, z + 0.85, Math.PI);
    });
    placeItemAt('pendant', -1.8, -1.5);
    placeItemAt('pendant', 1.8, -1.5);
    placeItemAt('pendant', -1.8, 1.5);
    placeItemAt('pendant', 1.8, 1.5);
    placeItemAt('plant', -5.3, -4);
    placeItemAt('plant', 5.3, 4);
    placeItemAt('sofa', 4, 4.2, 0);
    placeItemAt('accent_chair', 4.8, -2.5, -Math.PI / 2);
    placeItemAt('shelf', -5.4, 0, Math.PI / 2);
  } else if (name === 'coworking') {
    // Long desks in two rows
    [-2, 2].forEach(zRow => {
      [-2.5, 0, 2.5].forEach(x => {
        placeItemAt('desk', x, zRow);
        placeItemAt('chair', x, zRow + 0.6, Math.PI);
      });
    });
    placeItemAt('rect_table', 4.5, -3);
    placeItemAt('chair', 4.5, -3.9, Math.PI);
    placeItemAt('chair', 4.5, -2.1, 0);
    placeItemAt('chair', 3.9, -3, Math.PI / 2);
    placeItemAt('chair', 5.1, -3, -Math.PI / 2);
    placeItemAt('plant', -5.3, -4);
    placeItemAt('plant', 5.3, 4);
    placeItemAt('shelf', -5.4, -2, Math.PI / 2);
    placeItemAt('shelf', -5.4, 2, Math.PI / 2);
    placeItemAt('pendant', -2.5, -2);
    placeItemAt('pendant', 2.5, -2);
    placeItemAt('pendant', -2.5, 2);
    placeItemAt('pendant', 2.5, 2);
  } else if (name === 'boutique') {
    placeItemAt('rack', -3, -2);
    placeItemAt('rack', 0, -2);
    placeItemAt('rack', 3, -2);
    placeItemAt('shelf', -5.4, 0, Math.PI / 2);
    placeItemAt('shelf', -5.4, 3, Math.PI / 2);
    placeItemAt('shelf', 5.4, 0, -Math.PI / 2);
    placeItemAt('counter', 3.5, -4);
    placeItemAt('sofa', -3.5, 4);
    placeItemAt('accent_chair', -1.5, 4);
    placeItemAt('plant', -5.3, -4);
    placeItemAt('plant', 5.3, 4);
    placeItemAt('pendant', 0, 0);
    placeItemAt('pendant', -3, -2);
    placeItemAt('pendant', 3, -2);
  } else if (name === 'restaurant') {
    [-3, 0, 3].forEach(x => {
      [-2.5, 2.5].forEach(z => {
        placeItemAt('rect_table', x, z);
        placeItemAt('chair', x - 0.45, z + 0.65, Math.PI);
        placeItemAt('chair', x + 0.45, z + 0.65, Math.PI);
        placeItemAt('chair', x - 0.45, z - 0.65, 0);
        placeItemAt('chair', x + 0.45, z - 0.65, 0);
      });
    });
    placeItemAt('counter', -4, -4);
    placeItemAt('plant', 5.3, 4);
    placeItemAt('plant', -5.3, 4);
    placeItemAt('plant', 5.3, -4);
    placeItemAt('pendant', -3, -2.5);
    placeItemAt('pendant', 0, -2.5);
    placeItemAt('pendant', 3, -2.5);
    placeItemAt('pendant', -3, 2.5);
    placeItemAt('pendant', 0, 2.5);
    placeItemAt('pendant', 3, 2.5);
  } else if (name === 'exhibition') {
    // Event & exhibition floor: stage at the back, booths along the walls,
    // registration + red carpet entry, food court, sponsor wall and lounge.
    // Resize the room for the event floor (rebuilds shell, camera, stats).
    resizeRoom(30, 22);

    // Stage with light trusses flanking it
    placeItemAt('stage', 0, -7.5);
    placeItemAt('truss', -7, -8.5);
    placeItemAt('truss', 7, -8.5);

    // Registration at the entry with red carpet leading in
    placeItemAt('registration', -8, 8.5, Math.PI);
    placeItemAt('red_carpet', -8, 3.5, Math.PI);

    // Exhibition booths in two rows flanking the central aisle
    [-11, -4, 4, 11].forEach((x, i) => {
      placeItemAt('booth', x, -1.5 + (i % 2) * 0.2, Math.PI);
      placeItemAt('booth', x, 4.5 - (i % 2) * 0.2);
    });

    // Food court corner
    placeItemAt('food_stall', 10, 8.5, Math.PI);
    placeItemAt('food_stall', 13, 8.5, Math.PI);
    [-0.5, 0.5, 1.5].forEach((dx, i) => placeItemAt('stool', 10.5 + dx, 6.8 + (i % 2) * 0.1));

    // Sponsor wall + event lounge
    placeItemAt('sponsor_wall', 0, 9.2, Math.PI);
    placeItemAt('lounge', 5, 8.8, Math.PI);
    placeItemAt('plant', 8.2, 9.4);
    placeItemAt('plant', -12.5, 6);
    placeItemAt('plant', -12.5, -4);

    // Ambient event lighting over the aisles
    [-8, 0, 8].forEach(x => {
      placeItemAt('pendant', x, 1.5);
      placeItemAt('pendant', x, 6.5);
    });
  }

  // Exhibition template gets its furniture first in the library
  applyTemplateUI(name);
  markDirty();
}

document.querySelectorAll('.template-card').forEach(card => {
  card.addEventListener('click', () => {
    loadTemplate(card.dataset.template);
    showToast(`Loaded ${card.dataset.template} template`, 'fa-folder-open');
  });
});
