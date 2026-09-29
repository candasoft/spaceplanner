import { ITEM_CATALOG } from './catalog.js';

/**
 * User-defined furniture prices.
 *
 * Overrides are stored in localStorage and merged into ITEM_CATALOG on
 * import, so every consumer (library cards, placement snapshots, stats,
 * cost panel, PDF export) picks them up with no other changes.
 * A pristine snapshot of the factory prices is kept for resets/badges.
 */
const STORAGE_KEY = 'atelier.prices.v1';

// Pristine factory defaults, captured before any stored override is applied.
const DEFAULT_PRICES = Object.fromEntries(
  Object.entries(ITEM_CATALOG).map(([type, item]) => [type, item.price])
);

// localStorage can be unavailable (SSR-less pages, private browsing).
function storage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readStored() {
  const s = storage();
  if (!s) return {};
  try {
    const raw = s.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  } catch {
    return {};
  }
}

let overrides = readStored();

function writeStored() {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // quota exceeded / private mode — overrides stay in-memory only
  }
}

function sanitize(price) {
  const v = Math.round(Number(price) * 100) / 100;
  return Number.isFinite(v) && v >= 0 ? v : null;
}

/** Factory default price for a type (never affected by overrides). */
export function getDefaultPrice(type) {
  return DEFAULT_PRICES[type];
}

/** Effective price for a type (override if set, else default). */
export function getItemPrice(type) {
  return overrides[type] ?? DEFAULT_PRICES[type] ?? 0;
}

/** True when the type has an override that differs from the default. */
export function isPriceCustom(type) {
  return type in overrides && overrides[type] !== DEFAULT_PRICES[type];
}

/** How many types currently have a custom price. */
export function countCustomPrices() {
  return Object.entries(overrides).filter(([type, v]) => v !== DEFAULT_PRICES[type]).length;
}

/** Set (or clear, when equal to default) a type's price. Returns the value. */
export function setItemPrice(type, price) {
  if (!(type in DEFAULT_PRICES)) return null;
  const v = sanitize(price);
  if (v === null) return null;
  if (v === DEFAULT_PRICES[type]) delete overrides[type];
  else overrides[type] = v;
  ITEM_CATALOG[type].price = v;
  writeStored();
  return v;
}

/** Revert one type to its factory default price. */
export function resetItemPrice(type) {
  if (!(type in DEFAULT_PRICES)) return;
  delete overrides[type];
  ITEM_CATALOG[type].price = DEFAULT_PRICES[type];
  writeStored();
}

/** Revert every type to its factory default price. */
export function resetAllPrices() {
  overrides = {};
  for (const type of Object.keys(DEFAULT_PRICES)) {
    ITEM_CATALOG[type].price = DEFAULT_PRICES[type];
  }
  writeStored();
}

/** Merge stored overrides into ITEM_CATALOG (drops corrupt entries). */
export function applyPriceOverrides() {
  for (const type of Object.keys(overrides)) {
    const v = sanitize(overrides[type]);
    if (v === null || !(type in DEFAULT_PRICES)) {
      delete overrides[type];
      continue;
    }
    ITEM_CATALOG[type].price = v;
  }
}

// Apply immediately on import — before the app boots — so the library,
// placement, stats, costing and export all render with custom prices.
applyPriceOverrides();
