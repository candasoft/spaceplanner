import { ITEM_CATALOG } from './catalog.js';
import { selectItem } from './selection.js';

/**
 * Left panel furniture library: renders a clickable card per catalog entry.
 */
const itemLibrary = document.getElementById('itemLibrary');

/** Item type ids that are relevant to the exhibition template. */
const EXHIBITION_ITEMS = [
  'booth', 'registration', 'stage', 'food_stall',
  'red_carpet', 'sponsor_wall', 'lounge', 'truss',
];

// Tracks how the library was last rendered. Initialized to `undefined` (not
// null) so the very first renderLibrary() call — whose mode defaults to
// null — doesn't hit the "already rendered" guard and skip rendering.
let currentMode;

function buildCard(key, item) {
  const card = document.createElement('div');
  card.className = 'item-card';
  card.dataset.item = key;
  card.innerHTML = `
      <div class="item-icon"><i class="fa-solid ${item.icon} text-[13px]"></i></div>
      <div class="flex-1 min-w-0">
        <div class="text-[11.5px] font-semibold truncate">${item.name}</div>
        <div class="text-[10px] font-mono mt-0.5" style="color: var(--charcoal-3);">
          $${item.price}${item.seats ? ' · ' + item.seats + ' seat' : ''}
        </div>
      </div>
    `;
  card.addEventListener('click', () => selectItem(key));
  return card;
}

/**
 * Render the furniture library cards.
 * @param {string|null} mode 'exhibition' puts exhibition furniture first, null uses catalog order.
 */
export function renderLibrary(mode = null) {
  if (mode === currentMode) return;
  currentMode = mode;
  itemLibrary.innerHTML = '';
  let entries = Object.entries(ITEM_CATALOG);
  if (mode === 'exhibition') {
    entries = entries.sort(([a], [b]) => {
      const ia = EXHIBITION_ITEMS.indexOf(a);
      const ib = EXHIBITION_ITEMS.indexOf(b);
      return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
    });
  }
  entries.forEach(([key, item]) => itemLibrary.appendChild(buildCard(key, item)));
}

export function initLibrary() {
  renderLibrary();
}
