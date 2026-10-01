import * as THREE from 'three';
import { scene, container, camera, renderer } from '../three/scene.js';
import { getFloor } from '../three/room.js';
import { state } from '../core/state.js';
import { roomDims, PLACEMENT_MARGIN } from '../core/constants.js';
import { ITEM_CATALOG, BOOTH_STATUS_COLORS, setBoothDeskColor, setBoothName } from './catalog.js';
import { updateStats } from './stats.js';
import { showToast } from './toast.js';
import { markDirty } from '../core/dirty.js';
import { getGhostItem, setGhostItem, removeGhost } from './selection.js';

/**
 * Item placement: raycast ghost preview onto the floor, click to place,
 * plus programmatic placement for templates and removal helpers.
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getMouseIntersection(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObject(getFloor())[0];
}

function clampToRoom(v, size) {
  return Math.max(-size / 2 + PLACEMENT_MARGIN, Math.min(size / 2 - PLACEMENT_MARGIN, v));
}

/**
 * Clamp a center value along one room axis so an object whose half-extent
 * (center to edge) is `halfFoot` stays inside the walls plus the placement
 * margin. Pins to the center when the object exceeds the usable floor.
 */
export function clampCenter(v, roomSize, halfFoot) {
  const lo = -roomSize / 2 + PLACEMENT_MARGIN + halfFoot;
  const hi = roomSize / 2 - PLACEMENT_MARGIN - halfFoot;
  if (lo > hi) return 0;
  return Math.max(lo, Math.min(hi, v));
}

container.addEventListener('mousemove', (e) => {
  if (!state.selectedItem) return;
  const hit = getMouseIntersection(e);
  if (!hit) return;
  const x = clampToRoom(hit.point.x, roomDims.w);
  const z = clampToRoom(hit.point.z, roomDims.d);
  let ghost = getGhostItem();
  if (!ghost) {
    ghost = ITEM_CATALOG[state.selectedItem].factory();
    ghost.traverse(c => {
      if (c.isMesh) {
        c.material = c.material.clone();
        c.material.transparent = true;
        c.material.opacity = 0.45;
        c.castShadow = false;
      }
    });
    scene.add(ghost);
    setGhostItem(ghost);
  }
  ghost.position.set(x, 0, z);
});

container.addEventListener('click', (e) => {
  if (!state.selectedItem) return;
  if (e.target !== renderer.domElement) return;
  const hit = getMouseIntersection(e);
  if (hit) placeItem(state.selectedItem, hit.point);
});

export function placeItem(type, position, rotY = 0, opts = {}) {
  const item = ITEM_CATALOG[type];
  const mesh = item.factory();
  const x = clampToRoom(position.x, roomDims.w);
  const z = clampToRoom(position.z, roomDims.d);
  mesh.position.set(x, 0, z);
  mesh.rotation.y = rotY;

  // Restored items (from a saved project) keep their edited size/status.
  // Only width/depth are ever edited, so height stays at the original size.
  const sx = opts.scale?.x ?? 1;
  const sz = opts.scale?.z ?? 1;
  const sy = 1;
  const available = opts.available !== false;
  // Booth desk color from a saved project (null = default black)
  const deskColor = opts.deskColor || null;
  if (deskColor) setBoothDeskColor(mesh, deskColor);
  // Booth name for the wall/floor signage: a saved project restores its
  // custom name; new booths get an auto-numbered default ("B1", "B2", …).
  const boothName = opts.boothName ?? (type === 'booth'
    ? `B${state.placedItems.filter(i => i.type === 'booth').length + 1}`
    : null);
  if (boothName) setBoothName(mesh, boothName);
  if (!available) {
    mesh.traverse(c => {
      if (c.isMesh && c.userData.boothFascia) c.material.color.set(BOOTH_STATUS_COLORS.occupied);
    });
  }

  // Subtle drop-in animation towards the item's final (possibly edited) scale
  mesh.scale.set(0.01, 0.01, 0.01);
  const startTime = performance.now();
  function animateIn() {
    const t = Math.min(1, (performance.now() - startTime) / 300);
    const eased = 1 - Math.pow(1 - t, 3);
    const s = 0.01 + (1 - 0.01) * eased;
    mesh.scale.set(sx * s, sy * s, sz * s);
    if (t < 1) requestAnimationFrame(animateIn);
    else mesh.scale.set(sx, sy, sz);
  }
  animateIn();

  const placed = {
    id: Date.now() + Math.random(),
    type, position: { x, z }, rotation: rotY, mesh,
    name: item.name, price: item.price, seats: item.seats,
    scale: { x: sx, z: sz },
    available, // booth availability status (booths only, rest unused)
    deskColor, // booth desk color (booths only, rest null)
    boothName, // wall/floor signage name (booths only, rest null)
  };
  mesh.userData.placedId = placed.id;
  state.placedItems.push(placed);
  scene.add(mesh);
  updateStats();
  markDirty();
  return placed;
}

export function placeItemAt(type, x, z, rotY = 0, opts = {}) {
  return placeItem(type, new THREE.Vector3(x, 0, z), rotY, opts);
}

/** Find a placed item record by its id. */
export function getItemById(id) {
  return state.placedItems.find(i => i.id === id) || null;
}

/** Effective floor footprint (meters) of a placed item, including user scale. */
export function itemFootprint(item) {
  const [w, d] = ITEM_CATALOG[item.type].dim;
  return { w: w * item.scale.x, d: d * item.scale.z };
}

/**
 * Axis-aligned half-extents (m) of an item's footprint AFTER its current
 * rotation — the extents that must actually fit between the room walls.
 * Rotating a non-square item swaps which local axis lines up with the room.
 */
export function rotatedHalfExtents(item) {
  const { w, d } = itemFootprint(item);
  const c = Math.abs(Math.cos(item.rotation));
  const s = Math.abs(Math.sin(item.rotation));
  return { x: (w * c + d * s) / 2, z: (w * s + d * c) / 2 };
}

/**
 * Clamp an item's center so its rotated footprint stays inside the room
 * walls plus the placement margin. No-op when the item already fits —
 * called after rotating so an item can never end up poking through a wall
 * and so it sits as close to the edge as its new orientation allows.
 */
export function fitItemInsideRoom(item) {
  const h = rotatedHalfExtents(item);
  const x = clampCenter(item.position.x, roomDims.w, h.x);
  const z = clampCenter(item.position.z, roomDims.d, h.z);
  if (x !== item.position.x || z !== item.position.z) {
    item.position.x = x;
    item.position.z = z;
    item.mesh.position.set(x, 0, z);
  }
}

/** Remove a specific placed item by id (used by the selection editor). */
export function removeItem(id) {
  const idx = state.placedItems.findIndex(i => i.id === id);
  if (idx === -1) return false;
  const item = state.placedItems[idx];
  scene.remove(item.mesh);
  item.mesh.traverse(c => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
  });
  state.placedItems.splice(idx, 1);
  updateStats();
  markDirty();
  return true;
}

export function removeLastOfType(type) {
  for (let i = state.placedItems.length - 1; i >= 0; i--) {
    if (state.placedItems[i].type === type) {
      scene.remove(state.placedItems[i].mesh);
      state.placedItems.splice(i, 1);
      updateStats();
      markDirty();
      return;
    }
  }
}

export function clearAll(silent = false) {
  state.placedItems.forEach(i => {
    scene.remove(i.mesh);
    i.mesh.traverse(c => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    });
  });
  state.placedItems = [];
  updateStats();
  markDirty();
  if (!silent) showToast('All items cleared', 'fa-trash');
}

/** Rotate the most recently placed item (toolbar buttons). */
export function rotateLast(angle) {
  if (state.placedItems.length === 0) return;
  const item = state.placedItems[state.placedItems.length - 1];
  item.rotation += angle;
  item.mesh.rotation.y = item.rotation;
  fitItemInsideRoom(item);
  markDirty();
  showToast(`Rotated ${item.name}`, 'fa-rotate');
}

/**
 * Clamp all placed items back inside the current room footprint.
 * Called after the floor editor changes dimensions.
 */
export function repositionItems() {
  state.placedItems.forEach(item => {
    const x = clampToRoom(item.position.x, roomDims.w);
    const z = clampToRoom(item.position.z, roomDims.d);
    if (x !== item.position.x || z !== item.position.z) {
      item.position.x = x;
      item.position.z = z;
      item.mesh.position.set(x, 0, z);
    }
  });
}
