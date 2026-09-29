/**
 * Room dimensions in meters.
 * `roomDims` is mutable — the floor editor updates it and rebuilds the scene.
 * Floor area: roomDims.w × roomDims.d (default 12 m × 10 m = 120 m²).
 */
export const ROOM_H = 3.4;

/** Editable room size bounds (meters), per axis. */
export const ROOM_LIMITS = { min: 4, maxWidth: 150, maxDepth: 40 };

/** Current room footprint — mutated by the floor editor. */
export const roomDims = { w: 12, d: 10 };

/** Margin (m) kept between placed items and the walls. */
export const PLACEMENT_MARGIN = 0.5;
