import { state } from '../core/state.js';
import { ITEM_CATALOG } from './catalog.js';
import { animateNumber } from '../core/utils.js';
import { updateCostPanel } from './costing.js';

/**
 * Capacity / occupancy statistics for the HUD and right panel,
 * plus the grouped "Placed Items" list.
 */
export function updateStats() {
  const seats = state.placedItems.reduce((s, i) => s + i.seats, 0);
  const total = state.placedItems.reduce((s, i) => s + i.price, 0);
  const pct = Math.min(100, Math.round((seats / state.maxCapacity) * 100));
  const density = seats / state.roomArea;

  animateNumber('capacityCount', seats);
  animateNumber('seatsStat', seats);
  document.getElementById('capacityMax').textContent = state.maxCapacity;
  document.getElementById('itemCount').textContent = `${state.placedItems.length} item${state.placedItems.length !== 1 ? 's' : ''}`;
  document.getElementById('occPercent').textContent = pct;
  document.getElementById('occFill').style.width = pct + '%';
  document.getElementById('capacityBar').style.width = pct + '%';
  document.getElementById('capacityPct').textContent = pct + '%';
  document.getElementById('densityStat').textContent = density.toFixed(2);
  document.getElementById('perSeatStat').textContent = seats > 0 ? (state.roomArea / seats).toFixed(1) + ' m²' : '—';
  document.getElementById('liveTotal').textContent = '$' + total.toLocaleString();
  document.getElementById('placedCount').textContent = state.placedItems.length;

  // Floor area labels (HUD + right panel)
  document.getElementById('floorAreaStat').textContent = state.roomArea;
  const areaHud = document.getElementById('floorAreaHud');
  if (areaHud) areaHud.textContent = state.roomArea;
  const ft2 = Math.round(state.roomArea * 10.7639);
  const ft2El = document.getElementById('floorAreaFt2');
  if (ft2El) ft2El.textContent = ft2.toLocaleString('en-US');

  // Fire safety
  const overCapacity = seats > state.maxCapacity;
  document.getElementById('egressDot').style.background = overCapacity ? 'var(--danger)' : 'var(--success)';
  document.getElementById('egressStatus').textContent = overCapacity ? 'Over limit' : 'Compliant';
  document.getElementById('egressStatus').style.color = overCapacity ? 'var(--danger)' : 'var(--charcoal)';

  updatePlacedList();
  updateCostPanel(total);
}

function updatePlacedList() {
  const list = document.getElementById('placedList');
  if (state.placedItems.length === 0) {
    list.innerHTML = `<div class="text-[11px] text-center py-4 leading-relaxed" style="color: var(--charcoal-3);">No items yet.<br>Click a furniture piece<br>on the left to start.</div>`;
    return;
  }
  const grouped = {};
  state.placedItems.forEach(i => {
    if (!grouped[i.type]) grouped[i.type] = { count: 0, ...i };
    grouped[i.type].count++;
  });
  list.innerHTML = '';
  Object.values(grouped).forEach(g => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2.5 p-2 rounded-md border';
    row.style.borderColor = 'var(--line-soft)';
    row.style.background = 'var(--surface-2)';
    row.innerHTML = `
      <div class="w-7 h-7 rounded flex items-center justify-center" style="background: var(--bg-2);">
        <i class="fa-solid ${ITEM_CATALOG[g.type].icon} text-[11px]"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-[11px] font-semibold truncate">${g.name}</div>
        <div class="text-[10px] font-mono" style="color: var(--charcoal-3);">×${g.count} · $${g.price}</div>
      </div>
      <div class="text-[11px] font-mono font-semibold">$${(g.price * g.count).toLocaleString()}</div>
    `;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-icon btn remove-item-btn';
    removeBtn.title = `Remove one ${g.name}`;
    removeBtn.innerHTML = `<i class="fa-solid fa-minus text-[9px]"></i>`;
    removeBtn.style.color = 'var(--danger)';
    // Removal handled via event delegation in toolbar.js to avoid a
    // circular dependency between stats.js and placement.js.
    removeBtn.dataset.removeType = g.type;
    row.appendChild(removeBtn);
    list.appendChild(row);
  });
}
