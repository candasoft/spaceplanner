import '../styles/main.css';
import { ITEM_CATALOG } from '../features/catalog.js';
import {
  getItemPrice, getDefaultPrice, isPriceCustom, countCustomPrices,
  setItemPrice, resetItemPrice, resetAllPrices,
} from '../features/prices.js';
import { showToast } from '../features/toast.js';

/**
 * Furniture prices page: edit the unit price of every catalog entry.
 * Changes save immediately (localStorage) and apply to the planner on
 * its next load.
 */
const listEl = document.getElementById('priceList');
const countEl = document.getElementById('customCount');

function render() {
  const custom = countCustomPrices();
  countEl.textContent = custom === 0
    ? 'All default prices'
    : `${custom} custom price${custom !== 1 ? 's' : ''}`;

  listEl.innerHTML = '';
  Object.entries(ITEM_CATALOG).forEach(([type, item]) => {
    const current = getItemPrice(type);
    const def = getDefaultPrice(type);
    const isCustom = isPriceCustom(type);

    const row = document.createElement('div');
    row.className = 'pp-row';
    row.innerHTML = `
      <div class="pp-icon"><i class="fa-solid ${item.icon}"></i></div>
      <div class="flex-1 min-w-0">
        <div class="text-[13px] font-semibold truncate">${item.name}</div>
        <div class="text-[10.5px] font-mono mt-0.5 truncate" style="color: var(--charcoal-3);">
          default $${def.toLocaleString()} · ${item.dim[0]} × ${item.dim[1]} m${item.seats ? ` · ${item.seats} seat${item.seats > 1 ? 's' : ''}` : ''}
        </div>
      </div>
      ${isCustom ? '<span class="pp-badge">custom</span>' : ''}
      <div class="pp-input-wrap">
        <span class="text-[12px] font-mono" style="color: var(--charcoal-3);">$</span>
        <input type="number" class="pp-input" min="0" step="1" max="9999999" value="${current}" aria-label="${item.name} price">
      </div>
      <button class="btn-icon btn pp-reset" title="Reset to default price"
        style="${isCustom ? 'color: var(--accent);' : 'opacity: 0.35; pointer-events: none;'}">
        <i class="fa-solid fa-arrow-rotate-left text-[10px]"></i>
      </button>
    `;

    const input = row.querySelector('.pp-input');
    input.addEventListener('change', () => {
      const v = parseFloat(input.value);
      const saved = setItemPrice(type, v);
      if (saved === null) {
        showToast('Enter a valid price (0 or more)', 'fa-triangle-exclamation');
        render();
        return;
      }
      showToast(`${item.name} price set to $${saved.toLocaleString()}`, 'fa-tag');
      render();
    });

    row.querySelector('.pp-reset').addEventListener('click', () => {
      resetItemPrice(type);
      showToast(`${item.name} reset to $${getDefaultPrice(type).toLocaleString()}`, 'fa-arrow-rotate-left');
      render();
    });

    listEl.appendChild(row);
  });
}

document.getElementById('resetAll').addEventListener('click', () => {
  if (!window.confirm('Reset all furniture prices to their default values?')) return;
  resetAllPrices();
  showToast('All prices reset to defaults', 'fa-arrow-rotate-left');
  render();
});

render();
