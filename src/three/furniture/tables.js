import * as THREE from 'three';
import { state } from '../../core/state.js';

/** Round pedestal table. */
export function makeRoundTable() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.04, 32),
    new THREE.MeshStandardMaterial({ color: 0x8B6F47, roughness: 0.45 })
  );
  top.position.y = 0.74; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 0.74, 12),
    new THREE.MeshStandardMaterial({ color: 0x2A2826, roughness: 0.4, metalness: 0.4 })
  );
  pedestal.position.y = 0.37; pedestal.castShadow = true; g.add(pedestal);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0x2A2826, roughness: 0.4 })
  );
  base.position.y = 0.015; base.castShadow = true; g.add(base);
  return g;
}

/** Rectangular four-leg table. */
export function makeRectTable() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.04, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x8B6F47, roughness: 0.45 })
  );
  top.position.y = 0.74; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2A2826, roughness: 0.4, metalness: 0.3 });
  [[-0.72, -0.35], [0.72, -0.35], [-0.72, 0.35], [0.72, 0.35]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.74, 0.05), legMat);
    leg.position.set(x, 0.37, z); leg.castShadow = true; g.add(leg);
  });
  return g;
}

/**
 * Dining chair. `branded` seats pick up the brand color and are
 * recolored live by the brand module.
 */
export function makeChair(branded = false) {
  const g = new THREE.Group();
  const seatColor = branded ? state.brandColor : 0x2A2826;
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.05, 0.4),
    new THREE.MeshStandardMaterial({ color: seatColor, roughness: 0.7 })
  );
  seat.position.y = 0.45; seat.castShadow = true; seat.receiveShadow = true;
  if (branded) seat.userData.brand = true;
  g.add(seat);
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.45, 0.04),
    new THREE.MeshStandardMaterial({ color: seatColor, roughness: 0.7 })
  );
  back.position.set(0, 0.7, -0.18); back.castShadow = true;
  if (branded) back.userData.brand = true;
  g.add(back);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x4A4744, roughness: 0.5, metalness: 0.3 });
  const legGeom = new THREE.BoxGeometry(0.04, 0.45, 0.04);
  [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(x, 0.225, z); leg.castShadow = true; g.add(leg);
  });
  return g;
}

/** Bar stool with branded seat. */
export function makeStool() {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: state.brandColor, roughness: 0.7 })
  );
  seat.position.y = 0.65; seat.castShadow = true; seat.userData.brand = true; g.add(seat);
  const leg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.04, 0.65, 8),
    new THREE.MeshStandardMaterial({ color: 0x2A2826, roughness: 0.4, metalness: 0.5 })
  );
  leg.position.y = 0.325; leg.castShadow = true; g.add(leg);
  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16),
    new THREE.MeshStandardMaterial({ color: 0x2A2826, roughness: 0.5 })
  );
  foot.position.y = 0.01; g.add(foot);
  return g;
}

/** Work desk with branded cable-grommet accent. */
export function makeDesk() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.04, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xC4BAA8, roughness: 0.5 })
  );
  top.position.y = 0.74; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2A2826, metalness: 0.3 });
  [-0.6, 0.6].forEach(x => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.74, 0.5), legMat);
    leg.position.set(x, 0.37, 0); leg.castShadow = true; g.add(leg);
  });
  // Cable hole accent (brand)
  const accent = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: state.brandColor })
  );
  accent.position.set(0.5, 0.76, 0); accent.userData.brand = true; g.add(accent);
  return g;
}
