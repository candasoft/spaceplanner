import * as THREE from 'three';

/**
 * A flat plane that renders text from a 2D canvas — used for booth signage
 * (wall plaque + floor decal). No extra font files: it draws with the CSS
 * fonts already loaded on the page (Archivo Variable).
 *
 * Returns { mesh, update(name) }:
 *   - `update('')` (or whitespace) hides the mesh
 *   - text auto-shrinks to fit the plane width
 *   - redraws once web fonts finish loading (in case of a race at boot)
 */
export function makeTextSign({
  width,
  height,
  color = '#2A2826',   // text color
  plaque = null,       // optional rounded-rect background behind the text
  stroke = null,       // optional outline color (readability on busy floors)
  font = "'Archivo Variable', Archivo, sans-serif",
  weight = 700,
  resolution = 1024,   // canvas width in px; height follows the plane ratio
}) {
  const canvas = document.createElement('canvas');
  const w = resolution;
  const h = Math.max(64, Math.round(resolution * (height / width)));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);

  let lastText = '';

  function update(name) {
    const text = (name || '').trim();
    lastText = text;
    ctx.clearRect(0, 0, w, h);
    mesh.visible = text.length > 0;
    if (!text) { texture.needsUpdate = true; return; }

    const pad = h * 0.1;
    if (plaque) {
      ctx.fillStyle = plaque;
      const r = h * 0.18;
      ctx.beginPath();
      ctx.moveTo(pad + r, pad);
      ctx.arcTo(w - pad, pad, w - pad, h - pad, r);
      ctx.arcTo(w - pad, h - pad, pad, h - pad, r);
      ctx.arcTo(pad, h - pad, pad, pad, r);
      ctx.arcTo(pad, pad, w - pad, pad, r);
      ctx.closePath();
      ctx.fill();
    }

    // Fit the text to ~86% of the usable width
    let size = Math.floor(h * 0.5);
    ctx.font = `${weight} ${size}px ${font}`;
    const maxWidth = (w - pad * 2) * 0.94;
    const measured = ctx.measureText(text).width;
    if (measured > maxWidth) {
      size = Math.max(10, Math.floor(size * (maxWidth / measured)));
      ctx.font = `${weight} ${size}px ${font}`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (stroke) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(2, size * 0.1);
      ctx.strokeStyle = stroke;
      ctx.strokeText(text, w / 2, h / 2);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2);
    texture.needsUpdate = true;
  }

  update('');

  // The first update may run before web fonts finish loading (template
  // booths are placed at boot) — redraw once they're ready.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => update(lastText));
  }

  return { mesh, update };
 }