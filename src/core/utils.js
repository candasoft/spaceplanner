/**
 * Convert a hex color string to an "r, g, b" string,
 * used for CSS custom properties like `--accent-rgb`.
 */
export function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : '0, 0, 0';
}

/**
 * Animate a numeric counter in the element with the given id
 * towards `target` with an ease-out curve.
 */
export function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const diff = target - current;
  const start = performance.now();
  const dur = 400;
  function tick() {
    const t = Math.min(1, (performance.now() - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(current + diff * eased);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  }
  tick();
}
