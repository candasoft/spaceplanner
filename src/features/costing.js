import { state } from '../core/state.js';
import { ITEM_CATALOG } from './catalog.js';

/**
 * Cost estimate: grouped per-type breakdown in the slide-out panel,
 * plus delivery / contingency totals. Delivery 12% + contingency 8%.
 */
export function updateCostPanel(subtotal) {
  const delivery = subtotal * 0.12;
  const contingency = subtotal * 0.08;
  const total = subtotal + delivery + contingency;
  document.getElementById('costSubtotal').textContent = '$' + subtotal.toLocaleString();
  document.getElementById('costDelivery').textContent = '$' + Math.round(delivery).toLocaleString();
  document.getElementById('costContingency').textContent = '$' + Math.round(contingency).toLocaleString();
  document.getElementById('costTotal').textContent = '$' + Math.round(total).toLocaleString();

  const content = document.getElementById('costContent');
  const grouped = {};
  state.placedItems.forEach(i => {
    if (!grouped[i.type]) grouped[i.type] = { count: 0, ...i };
    grouped[i.type].count++;
  });

  if (Object.keys(grouped).length === 0) {
    content.innerHTML = `
      <div class="text-center py-12">
        <div class="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3" style="background: var(--bg-2);">
          <i class="fa-solid fa-receipt text-xl" style="color: var(--oat-dark);"></i>
        </div>
        <div class="text-sm font-semibold mb-1">No items yet</div>
        <div class="text-[11px] leading-relaxed" style="color: var(--charcoal-3);">Place furniture in the canvas<br>to see cost breakdown.</div>
      </div>
    `;
    return;
  }

  content.innerHTML = '';
  Object.values(grouped).forEach(g => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-3 py-3 border-b';
    row.style.borderColor = 'var(--line-soft)';
    row.innerHTML = `
      <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: var(--bg-2);">
        <i class="fa-solid ${ITEM_CATALOG[g.type].icon} text-sm"></i>
      </div>
      <div class="flex-1">
        <div class="text-[13px] font-semibold">${g.name}</div>
        <div class="text-[11px]" style="color: var(--charcoal-3);">$${g.price} × ${g.count}</div>
      </div>
      <div class="font-display font-bold">$${(g.price * g.count).toLocaleString()}</div>
    `;
    content.appendChild(row);
  });
}

export function toggleCostPanel() {
  state.costPanelOpen = !state.costPanelOpen;
  document.getElementById('costPanel').classList.toggle('open', state.costPanelOpen);
  if (state.costPanelOpen) updateCostPanel(state.placedItems.reduce((s, i) => s + i.price, 0));
}

document.getElementById('costBtn').addEventListener('click', toggleCostPanel);
document.getElementById('openCostBtn').addEventListener('click', toggleCostPanel);
document.getElementById('closeCost').addEventListener('click', toggleCostPanel);
