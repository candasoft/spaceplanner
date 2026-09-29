/**
 * Global application state.
 * Single source of truth shared by all feature modules.
 */
export const state = {
  view: 'perspective',      // 'perspective' | 'top'
  template: 'cafe',         // active template id
  brandColor: '#C75D3F',    // accent color applied across the scene
  fireSafety: false,        // fire egress overlay visibility
  selectedItem: null,       // furniture type currently being placed
  placedItems: [],          // [{ id, type, position, rotation, mesh, name, price, seats }]
  costPanelOpen: false,
  projectId: null,           // id of the saved project currently open (null = never saved)
  projectName: 'Maple & Marble Cafe', // display name shown in the top bar
  dirty: false,              // unsaved changes since last save
  roomW: 12,                // room width in meters (mirrors roomDims.w)
  roomD: 10,                // room depth in meters (mirrors roomDims.d)
  roomArea: 120,            // m² (roomW × roomD)
  maxCapacity: 40,          // seats (area / 3 m² per seat)
};
