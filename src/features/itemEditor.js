import * as THREE from 'three';
import { scene, container, camera, renderer, controls, onFrame } from '../three/scene.js';
import { getFloor } from '../three/room.js';
import { state } from '../core/state.js';
import { roomDims, PLACEMENT_MARGIN } from '../core/constants.js';
import { ITEM_CATALOG, BOOTH_STATUS_COLORS, BOOTH_DESK_DEFAULT, setBoothDeskColor } from './catalog.js';
import { getItemById, itemFootprint, removeItem, clampCenter, rotatedHalfExtents, fitItemInsideRoom } from './placement.js';
import { showToast } from './toast.js';
import { markDirty } from '../core/dirty.js';

/**
 * Item editor: click a placed furniture to select it (outline highlight +
 * dimension inspector), drag to move it across the floor, edit its
 * width/depth in the inspector to resize the mesh, rotate or delete it.
 */

let selected = null;      // currently selected placed item record
let highlight = null;     // THREE.BoxHelper outline
let dragging = false;
let dragMoved = false;
let downPos = null;       // pointerdown position to distinguish click from orbit-drag

// ---------- Inspector DOM ----------
const panel = document.getElementById('itemInspector');
const nameEl = document.getElementById('inspName');
const typeEl = document.getElementById('inspType');
const dimW = document.getElementById('inspDimW');
const dimD = document.getElementById('inspDimD');
const rotateBtn = document.getElementById('inspRotate');
const deleteBtn = document.getElementById('inspDelete');
const closeBtn = document.getElementById('inspClose');
const statusRow = document.getElementById('inspStatusRow');
const statusBtn = document.getElementById('inspStatus');
const statusDot = document.getElementById('inspStatusDot');
const statusText = document.getElementById('inspStatusText');
const deskRow = document.getElementById('inspDeskRow');
const deskInput = document.getElementById('inspDeskColor');
const deskWrap = document.getElementById('inspDeskWrap');
const deskSwatches = Array.from(document.querySelectorAll('#inspDeskRow .desk-swatch'));

function raycastAt(e, targets, recursive) {
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(targets, recursive);
}

function getPlacedRoot(obj) {
  // Walk up from the intersected child to the placed root group
  let o = obj;
  while (o) {
    if (o.userData && o.userData.placedId) return o;
    o = o.parent;
  }
  return null;
}

function pickPlacedItem(e) {
  const roots = state.placedItems.map(i => i.mesh);
  for (const hit of raycastAt(e, roots, true)) {
    const root = getPlacedRoot(hit.object);
    if (root) return getItemById(root.userData.placedId);
  }
  return null;
}

function floorHit(e) {
  return raycastAt(e, [getFloor()], false)[0] || null;
}

// `clampCenter` (footprint-aware center clamping) lives in placement.js so
// both the drag handler and the rotation code share the exact same rules.

function refreshHighlight() {
  if (highlight) {
    scene.remove(highlight);
    highlight.geometry.dispose();
    highlight = null;
  }
  if (selected) {
    highlight = new THREE.BoxHelper(selected.mesh, 0xE08A3C);
    scene.add(highlight);
  }
}

function getFasciaMesh(item) {
  let fascia = null;
  item.mesh.traverse(c => {
    if (c.isMesh && c.userData.boothFascia) fascia = c;
  });
  return fascia;
}

/** Does this item carry an editable desk (booth front counter)? */
function hasDesk(item) {
  let found = false;
  item.mesh.traverse(c => {
    if (c.isMesh && c.userData.boothDesk) found = true;
  });
  return found;
}

function syncInspector() {
  if (!selected) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  const { w, d } = itemFootprint(selected);
  nameEl.textContent = selected.name;
  typeEl.textContent = `$${selected.price}${selected.seats ? ` · ${selected.seats} seat${selected.seats !== 1 ? 's' : ''}` : ''}`;
  if (document.activeElement !== dimW) dimW.value = w.toFixed(1);
  if (document.activeElement !== dimD) dimD.value = d.toFixed(1);

  // Booth status row — only for items that carry a status fascia
  const fascia = getFasciaMesh(selected);
  if (fascia) {
    statusRow.classList.remove('hidden');
    const available = selected.available !== false;
    statusDot.style.background = available ? 'var(--success)' : 'var(--danger)';
    statusText.textContent = available ? 'Available' : 'Occupied';
    statusBtn.style.color = available ? 'var(--success)' : 'var(--danger)';
  } else {
    statusRow.classList.add('hidden');
  }

  // Desk color row — only for items that carry an editable desk
  const desk = hasDesk(selected);
  deskRow.classList.toggle('hidden', !desk);
  if (desk) {
    const cur = (selected.deskColor || BOOTH_DESK_DEFAULT).toLowerCase();
    if (document.activeElement !== deskInput) deskInput.value = cur;
    deskWrap.style.background = cur;
    deskSwatches.forEach(s => s.classList.toggle('active', s.dataset.color.toLowerCase() === cur));
  }
}

// ---------- Selection ----------
export function selectPlacedItem(id) {
  selected = id ? getItemById(id) : null;
  if (selected && state.selectedItem) {
    // Cancel any active placement mode so the two don't fight
    state.selectedItem = null;
    document.querySelectorAll('.item-card').forEach(c => c.classList.remove('active'));
    container.classList.remove('placing');
  }
  refreshHighlight();
  syncInspector();
  if (selected) showToast(`${selected.name} selected — drag to move`, 'fa-object-group');
}

export function getSelectedPlaced() {
  return selected;
}

export function deselectPlaced() {
  selectPlacedItem(null);
}

// ---------- Pointer interaction ----------
container.addEventListener('pointerdown', (e) => {
  if (e.target !== renderer.domElement) return;
  downPos = { x: e.clientX, y: e.clientY };
  dragMoved = false;

  if (state.selectedItem) return; // placement mode handles its own logic

  const hitItem = pickPlacedItem(e);
  if (hitItem && hitItem === selected) {
    dragging = true;
    controls.enabled = false;
  }
});

container.addEventListener('pointermove', (e) => {
  if (!dragging || !selected) return;
  const hit = floorHit(e);
  if (!hit) return;
  dragMoved = true;
  // Use the ROTATED footprint extents: rotating a non-square item swaps
  // which local axis lines up with the room, and the old unrotated clamp
  // made the item stop short of the wall on one axis.
  const h = rotatedHalfExtents(selected);
  const cx = clampCenter(hit.point.x, roomDims.w, h.x);
  const cz = clampCenter(hit.point.z, roomDims.d, h.z);
  selected.position.x = cx;
  selected.position.z = cz;
  selected.mesh.position.set(cx, 0, cz);
  if (highlight) highlight.update();
});

container.addEventListener('pointerup', (e) => {
  const wasDragging = dragging;
  dragging = false;
  controls.enabled = true;

  if (state.selectedItem) return; // placement mode handles clicks
  if (e.target !== renderer.domElement) return;

  const isClick = downPos && Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) < 5;
  downPos = null;

  if (wasDragging && dragMoved) { markDirty(); return; } // finished a move — keep selection

  if (isClick) {
    const hitItem = pickPlacedItem(e);
    if (hitItem) selectPlacedItem(hitItem.id);
    else deselectPlaced();
  }
});

// ---------- Dimension editing (resize) ----------
function applyDim(input, axis) {
  if (!selected) return;
  const [baseW, baseD] = ITEM_CATALOG[selected.type].dim;
  const maxW = roomDims.w - 2 * PLACEMENT_MARGIN;
  const maxD = roomDims.d - 2 * PLACEMENT_MARGIN;
  const base = axis === 'x' ? baseW : baseD;
  const max = axis === 'x' ? maxW : maxD;
  let v = parseFloat(input.value);
  if (Number.isNaN(v) || v <= 0) v = base; // restore default on invalid input
  v = Math.min(max, Math.max(0.1, Math.round(v * 10) / 10));
  selected.scale[axis] = v / base;
  // Only width/depth are editable — height stays at the original catalog size
  selected.mesh.scale.set(selected.scale.x, 1, selected.scale.z);
  input.value = v.toFixed(1);
  if (highlight) highlight.update();
  const { w, d } = itemFootprint(selected);
  showToast(`${selected.name} resized to ${w.toFixed(1)} × ${d.toFixed(1)} m`, 'fa-up-right-and-down-left-from-center');
  markDirty();
}

dimW.addEventListener('change', () => applyDim(dimW, 'x'));
dimD.addEventListener('change', () => applyDim(dimD, 'z'));

// ---------- Booth availability status ----------
statusBtn.addEventListener('click', () => {
  if (!selected) return;
  const fascia = getFasciaMesh(selected);
  if (!fascia) return;
  selected.available = selected.available === false; // toggle
  const status = selected.available ? 'available' : 'occupied';
  fascia.material.color.set(BOOTH_STATUS_COLORS[status]);
  markDirty();
  syncInspector();
  showToast(
    `${selected.name} is now ${status}`,
    selected.available ? 'fa-circle-check' : 'fa-circle-xmark'
  );
});

// ---------- Booth desk color ----------
function applyDeskColor(color) {
  if (!selected || !hasDesk(selected)) return;
  selected.deskColor = color;
  setBoothDeskColor(selected.mesh, color);
  markDirty();
  syncInspector();
}

deskSwatches.forEach(sw => sw.addEventListener('click', () => {
  applyDeskColor(sw.dataset.color);
  showToast('Desk color updated', 'fa-palette');
}));
// Live preview while the native color picker is open (matches brand.js)
deskInput.addEventListener('input', () => applyDeskColor(deskInput.value));

// ---------- Rotate / delete / close ----------
rotateBtn.addEventListener('click', () => {
  if (!selected) return;
  selected.rotation += Math.PI / 4;
  selected.mesh.rotation.y = selected.rotation;
  // Re-fit: the new orientation may need more room along a room axis —
  // only pulls the item back if it now pokes through a wall, never pushes
  // it further away than its footprint requires.
  fitItemInsideRoom(selected);
  if (highlight) highlight.update();
  markDirty();
  showToast(`Rotated ${selected.name}`, 'fa-rotate');
});

export function deleteSelected() {
  if (!selected) return false;
  const name = selected.name;
  const id = selected.id;
  selectPlacedItem(null);
  removeItem(id);
  showToast(`Removed ${name}`, 'fa-trash');
  return true;
}

deleteBtn.addEventListener('click', deleteSelected);
closeBtn.addEventListener('click', deselectPlaced);

// ---------- Keyboard ----------
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (deleteSelected()) e.preventDefault();
  }
});

// Keep the outline aligned with the selected mesh, and auto-deselect if the
// item was removed elsewhere (Clear all, template reload, ...).
onFrame(() => {
  if (selected && highlight) {
    if (!getItemById(selected.id)) {
      selectPlacedItem(null);
      return;
    }
    highlight.update();
  }
});

