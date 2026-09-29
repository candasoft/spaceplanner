import { state } from '../core/state.js';
import { roomDims } from '../core/constants.js';
import { clearAll, placeItemAt } from './placement.js';
import { resizeRoom } from './floorEditor.js';
import { setBrandColor } from './brand.js';
import { applyTemplateUI } from './templates.js';
import { deselectPlaced } from './itemEditor.js';
import { onDirtyChange, clearDirty, markDirty } from '../core/dirty.js';
import { showToast } from './toast.js';

/**
 * Project persistence: create / name / rename / save / open plans.
 * Projects are stored in localStorage as a serialized snapshot of the
 * scene (room size, brand color, template and every placed item with its
 * edited scale, rotation, booth status and desk color).
 */
const STORAGE_KEY = 'atelier.projects.v1';
const DEFAULT_ROOM = { w: 12, d: 10 };
const DEFAULT_BRAND = '#C75D3F';

// ---------- DOM ----------
const nameEl = document.getElementById('projectName');
const dirtyDot = document.getElementById('projDirtyDot');
const modal = document.getElementById('projectModal');
const modalTitle = document.getElementById('projectModalTitle');
const modalSub = document.getElementById('projectModalSub');
const modalBody = document.getElementById('projectModalBody');

// ---------- Storage helpers ----------
function readProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeProjects(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    showToast('Could not write to local storage', 'fa-triangle-exclamation');
    return false;
  }
}

export function listProjects() {
  return readProjects().sort((a, b) => b.updatedAt - a.updatedAt);
}

function round3(v) {
  return Math.round(v * 1000) / 1000;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Snapshot the current scene into a plain serializable object. */
function serializeCurrent() {
  return {
    template: state.template,
    brandColor: state.brandColor,
    room: { w: roomDims.w, d: roomDims.d },
    items: state.placedItems.map(i => ({
      type: i.type,
      x: round3(i.position.x),
      z: round3(i.position.z),
      rot: round3(i.rotation),
      sx: round3(i.scale.x),
      sz: round3(i.scale.z),
      available: i.available !== false,
      deskColor: i.deskColor || null,
      boothName: i.boothName ?? null, // keeps '' (cleared) distinct from unset
    })),
  };
}

// ---------- Top bar name + dirty dot ----------
function updateNameUI() {
  nameEl.textContent = state.projectName;
}

onDirtyChange(dirty => dirtyDot.classList.toggle('hidden', !dirty));
nameEl.addEventListener('click', () => {
  if (state.projectId) showNameDialog('rename', state.projectId);
  else showNameDialog('save');
});

// ---------- Project operations ----------
export function saveCurrentProject(name) {
  const list = readProjects();
  const id = state.projectId || 'p_' + Date.now().toString(36);
  const projectName = (name || state.projectName || '').trim() || 'Untitled Project';
  const entry = { id, name: projectName, updatedAt: Date.now(), ...serializeCurrent() };
  const idx = list.findIndex(p => p.id === id);
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  if (!writeProjects(list)) return false;
  state.projectId = id;
  state.projectName = projectName;
  updateNameUI();
  clearDirty();
  showToast(`Saved "${projectName}"`, 'fa-floppy-disk');
  return true;
}

function createNewProject(name) {
  deselectPlaced();
  clearAll(true);
  state.projectId = null;
  state.projectName = (name || '').trim() || 'Untitled Project';
  resizeRoom(DEFAULT_ROOM.w, DEFAULT_ROOM.d);
  setBrandColor(DEFAULT_BRAND);
  state.template = '';
  applyTemplateUI('');
  // Persist the empty project so it shows up under Open right away
  const id = 'p_' + Date.now().toString(36);
  const entry = { id, name: state.projectName, updatedAt: Date.now(), ...serializeCurrent() };
  const list = readProjects();
  list.push(entry);
  writeProjects(list);
  state.projectId = id;
  updateNameUI();
  clearDirty();
  closeModal();
  showToast(`Created "${state.projectName}"`, 'fa-file-circle-plus');
}

export function openProject(id) {
  const p = readProjects().find(x => x.id === id);
  if (!p) {
    showToast('Project not found', 'fa-triangle-exclamation');
    return false;
  }
  deselectPlaced();
  clearAll(true);
  state.projectId = p.id;
  state.projectName = p.name;
  resizeRoom(p.room?.w ?? DEFAULT_ROOM.w, p.room?.d ?? DEFAULT_ROOM.d);
  setBrandColor(p.brandColor || DEFAULT_BRAND);
  (p.items || []).forEach(it => {
    placeItemAt(it.type, it.x, it.z, it.rot, {
      scale: { x: it.sx ?? 1, z: it.sz ?? 1 },
      available: it.available,
      deskColor: it.deskColor,
      boothName: it.boothName,
    });
  });
  state.template = p.template || '';
  applyTemplateUI(state.template);
  updateNameUI();
  clearDirty();
  showToast(`Opened "${p.name}"`, 'fa-folder-open');
  return true;
}

function renameProject(id, newName) {
  const name = (newName || '').trim();
  if (!name) return;
  const list = readProjects();
  const p = list.find(x => x.id === id);
  if (p) {
    p.name = name;
    p.updatedAt = Date.now();
    writeProjects(list);
  }
  if (state.projectId === id) {
    state.projectName = name;
    updateNameUI();
  }
  showToast(`Renamed to "${name}"`, 'fa-pen');
}

function deleteProject(id) {
  const list = readProjects();
  const p = list.find(x => x.id === id);
  const next = list.filter(x => x.id !== id);
  writeProjects(next);
  if (state.projectId === id) {
    // Current scene stays, but it's no longer backed by a stored project
    state.projectId = null;
    markDirty();
  }
  if (p) showToast(`Deleted "${p.name}"`, 'fa-trash');
  showList(); // refresh rows
}

// ---------- Modal ----------
function closeModal() {
  modal.classList.remove('open');
}

function showList() {
  modalTitle.textContent = 'Projects';
  modalSub.textContent = 'Open, rename or delete a saved project';
  const list = listProjects();
  if (list.length === 0) {
    modalBody.innerHTML = `
      <div class="text-[11.5px] text-center py-6 leading-relaxed" style="color: var(--charcoal-3);">
        No saved projects yet.<br>Press <b>Save</b> to store the current plan.
      </div>`;
    return;
  }
  modalBody.innerHTML = list.map(p => `
    <div class="proj-row" data-id="${p.id}">
      <div class="flex-1 min-w-0">
        <div class="text-[12px] font-semibold truncate">${escapeHtml(p.name)}</div>
        <div class="text-[10px] font-mono mt-0.5" style="color: var(--charcoal-3);">
          ${(p.items || []).length} items · ${new Date(p.updatedAt).toLocaleString()}
        </div>
      </div>
      <button class="btn proj-open" title="Open project"><i class="fa-solid fa-folder-open text-[10px]"></i><span>Open</span></button>
      <button class="btn-icon btn proj-rename" title="Rename"><i class="fa-solid fa-pen text-[10px]"></i></button>
      <button class="btn-icon btn proj-delete" title="Delete" style="color: var(--danger);"><i class="fa-solid fa-trash text-[10px]"></i></button>
    </div>`).join('');

  modalBody.querySelectorAll('.proj-row').forEach(row => {
    const id = row.dataset.id;
    row.querySelector('.proj-open').addEventListener('click', () => {
      if (openProject(id)) closeModal();
    });
    row.querySelector('.proj-rename').addEventListener('click', () => showNameDialog('rename', id));
    row.querySelector('.proj-delete').addEventListener('click', () => {
      const p = listProjects().find(x => x.id === id);
      if (p && window.confirm(`Delete "${p.name}"? This cannot be undone.`)) deleteProject(id);
    });
  });
}

/** mode: 'new' (blank project), 'save' (name + store current), 'rename'. */
function showNameDialog(mode, id = null) {
  const labels = {
    new: ['New project', 'Name your new project — the canvas is reset', 'Create project'],
    save: ['Save project', 'Name this plan to store it locally', 'Save project'],
    rename: ['Rename project', 'Give this project a new name', 'Rename'],
  };
  const [title, sub, cta] = labels[mode];
  modalTitle.textContent = title;
  modalSub.textContent = sub;
  const current = mode === 'rename'
    ? (listProjects().find(p => p.id === id)?.name ?? state.projectName)
    : state.projectName;
  modalBody.innerHTML = `
    <div class="text-[11px] mb-1.5" style="color: var(--charcoal-3);">Project name</div>
    <input type="text" class="proj-input" id="projNameInput" maxlength="60" value="${escapeHtml(current)}">
    <div class="flex gap-2 mt-4">
      <button class="btn flex-1 justify-center" id="projCancel">Cancel</button>
      <button class="btn btn-primary flex-1 justify-center" id="projConfirm">${cta}</button>
    </div>`;

  const input = document.getElementById('projNameInput');
  input.focus();
  input.select();
  const confirmFn = () => {
    const v = input.value.trim();
    if (!v) { input.focus(); return; }
    if (mode === 'new') createNewProject(v);
    else if (mode === 'rename') { renameProject(id, v); closeModal(); }
    else { if (saveCurrentProject(v)) closeModal(); }
  };
  document.getElementById('projConfirm').addEventListener('click', confirmFn);
  document.getElementById('projCancel').addEventListener('click', closeModal);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmFn();
    else if (e.key === 'Escape') closeModal();
  });
  modal.classList.add('open');
}

function showListModal() {
  showList();
  modal.classList.add('open');
}

function handleSave() {
  if (state.projectId) saveCurrentProject();
  else showNameDialog('save');
}

// ---------- Wiring ----------
document.getElementById('newProjectBtn').addEventListener('click', () => showNameDialog('new'));
document.getElementById('openProjectBtn').addEventListener('click', showListModal);
document.getElementById('saveProjectBtn').addEventListener('click', handleSave);
document.getElementById('closeProject').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    handleSave();
  } else if (e.key === 'Escape' && modal.classList.contains('open')) {
    closeModal();
  }
});

