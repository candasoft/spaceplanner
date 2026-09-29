import { state } from '../core/state.js';
import { roomDims, ROOM_LIMITS } from '../core/constants.js';
import { rebuildRoom } from '../three/room.js';
import { setRoomScale } from '../three/scene.js';
import { repositionItems } from './placement.js';
import { rebuildEgress } from './egress.js';
import { updateStats } from './stats.js';
import { showToast } from './toast.js';
import { markDirty } from '../core/dirty.js';

/**
 * Floor editor: editable room width/depth in the HUD.
 * Changing the footprint rebuilds the room shell, clamps placed items
 * back inside, re-anchors the egress paths, and recomputes area,
 * density and max occupancy (3 m² per seat).
 */
const SEAT_SQ_M = 3; // m² of floor per seat for max occupancy

const widthInput = document.getElementById('roomWidthInput');
const depthInput = document.getElementById('roomDepthInput');

widthInput.min = ROOM_LIMITS.min;
widthInput.max = ROOM_LIMITS.maxWidth;
depthInput.min = ROOM_LIMITS.min;
depthInput.max = ROOM_LIMITS.maxDepth;
[widthInput, depthInput].forEach(inp => { inp.step = 0.5; });

function clampVal(v, max) {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return null;
  return Math.min(max, Math.max(ROOM_LIMITS.min, Math.round(n * 10) / 10));
}

function applyDims() {
  const w = clampVal(widthInput.value, ROOM_LIMITS.maxWidth);
  const d = clampVal(depthInput.value, ROOM_LIMITS.maxDepth);
  if (w == null || d == null) return; // ignore transient invalid input

  roomDims.w = w;
  roomDims.d = d;

  state.roomW = w;
  state.roomD = d;
  state.roomArea = Math.round(w * d * 10) / 10;
  state.maxCapacity = Math.floor(state.roomArea / SEAT_SQ_M);

  rebuildRoom();
  setRoomScale(w, d);
  repositionItems();
  rebuildEgress();
  updateStats();
}

widthInput.addEventListener('change', () => {
  applyDims();
  markDirty();
  showToast(`Room resized to ${roomDims.w} × ${roomDims.d} m`, 'fa-ruler-combined');
});
depthInput.addEventListener('change', () => {
  applyDims();
  markDirty();
  showToast(`Room resized to ${roomDims.w} × ${roomDims.d} m`, 'fa-ruler-combined');
});

// Optional deep link: /?w=18&d=9 presets the room footprint on load
const params = new URLSearchParams(window.location.search);
const qw = clampVal(params.get('w'), ROOM_LIMITS.maxWidth);
const qd = clampVal(params.get('d'), ROOM_LIMITS.maxDepth);
if (qw != null || qd != null) {
  if (qw != null) widthInput.value = qw;
  if (qd != null) depthInput.value = qd;
  applyDims();
}

/** Keep inputs in sync when roomDims changes programmatically. */
export function syncFloorInputs() {
  widthInput.value = roomDims.w;
  depthInput.value = roomDims.d;
}

/**
 * Resize the room programmatically (e.g. templates that need a bigger
 * floor): updates inputs and runs the full apply pipeline without the
 * "Room resized" toast.
 */
export function resizeRoom(w, d) {
  widthInput.value = w;
  depthInput.value = d;
  applyDims();
}
