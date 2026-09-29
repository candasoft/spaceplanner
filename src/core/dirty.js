/**
 * Tracks unsaved changes to the current project.
 * Kept dependency-free (imports only state) so feature modules can call
 * markDirty() without creating import cycles with project.js.
 */
import { state } from './state.js';

const listeners = new Set();

export function markDirty() {
  if (state.dirty) return;
  state.dirty = true;
  listeners.forEach(cb => cb(true));
}

export function clearDirty() {
  if (!state.dirty) return;
  state.dirty = false;
  listeners.forEach(cb => cb(false));
}

/** Subscribe to dirty-state changes: cb(dirty:boolean). Returns unsubscribe. */
export function onDirtyChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}