import * as THREE from 'three';
import { state } from '../../core/state.js';

/** Service counter with branded strips, espresso machine and display case. */
export function makeCounter() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 0.95, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xF5F1EA, roughness: 0.7 })
  );
  body.position.y = 0.475; body.castShadow = true; body.receiveShadow = true; g.add(body);
  // Brand accent strip
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 0.1, 0.02),
    new THREE.MeshStandardMaterial({ color: state.brandColor, roughness: 0.5 })
  );
  strip.position.set(0, 0.55, 0.36); strip.castShadow = true; strip.userData.brand = true; g.add(strip);
  // Lower accent
  const strip2 = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 0.03, 0.02),
    new THREE.MeshStandardMaterial({ color: state.brandColor, roughness: 0.5 })
  );
  strip2.position.set(0, 0.2, 0.36); strip2.userData.brand = true; g.add(strip2);
  // Top counter (stone)
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(3.05, 0.05, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x2A2826, roughness: 0.3, metalness: 0.2 })
  );
  top.position.y = 0.97; top.castShadow = true; top.receiveShadow = true; g.add(top);
  // Espresso machine
  const machine = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.45, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xC4BAA8, roughness: 0.4, metalness: 0.5 })
  );
  machine.position.set(-0.9, 1.22, 0); machine.castShadow = true; g.add(machine);
  // Machine group head
  const groupHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x2A2826, metalness: 0.6 })
  );
  groupHead.position.set(-0.9, 1.0, 0.22); g.add(groupHead);
  // Display case
  const display = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.55, 0.55),
    new THREE.MeshStandardMaterial({ color: 0xF5F1EA, roughness: 0.1, transparent: true, opacity: 0.4, metalness: 0.1 })
  );
  display.position.set(0.85, 1.25, 0); g.add(display);
  // Display top
  const displayTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.04, 0.57),
    new THREE.MeshStandardMaterial({ color: 0x2A2826, roughness: 0.3 })
  );
  displayTop.position.set(0.85, 1.54, 0); g.add(displayTop);
  return g;
}

/** Display shelf with branded back panel and product items. */
export function makeShelf() {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B6F47, roughness: 0.6 });
  [-0.45, 0.45].forEach(x => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.8, 0.35), woodMat);
    side.position.set(x, 0.9, 0); side.castShadow = true; g.add(side);
  });
  [0.05, 0.5, 0.95, 1.4].forEach(y => {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.03, 0.35), woodMat);
    sh.position.set(0, y, 0); sh.castShadow = true; sh.receiveShadow = true; g.add(sh);
  });
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.7, 0.01),
    new THREE.MeshStandardMaterial({ color: state.brandColor, roughness: 0.6 })
  );
  back.position.set(0, 0.9, -0.16); back.userData.brand = true; g.add(back);
  // Items
  const colors = [0xC4BAA8, 0x8B6F47, state.brandColor, 0x4A6741];
  [0.27, 0.72, 1.17].forEach((y, idx) => {
    for (let i = 0; i < 3; i++) {
      const c = colors[(idx + i) % colors.length];
      const item = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.22, 0.16),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })
      );
      item.position.set(-0.3 + i * 0.3, y + 0.13, 0);
      item.castShadow = true;
      if ((idx + i) % 4 === 2) item.userData.brand = true;
      g.add(item);
    }
  });
  return g;
}

/** Clothing rack with branded hanging garments. */
export function makeRack() {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2A2826, metalness: 0.5, roughness: 0.4 });
  [-0.45, 0.45].forEach(x => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8), poleMat);
    pole.position.set(x, 0.8, 0); pole.castShadow = true; g.add(pole);
  });
  const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), poleMat);
  topBar.rotation.z = Math.PI / 2; topBar.position.y = 1.55; g.add(topBar);
  const baseMat2 = new THREE.MeshStandardMaterial({ color: 0x2A2826 });
  [-0.45, 0.45].forEach(x => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.3), baseMat2);
    f.position.set(x, 0.02, 0); g.add(f);
  });
  // Hanging items
  const itemMat = new THREE.MeshStandardMaterial({ color: state.brandColor, roughness: 0.7 });
  for (let i = 0; i < 5; i++) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.4, 8), itemMat);
    h.position.set(-0.32 + i * 0.16, 1.2, 0); h.userData.brand = true; g.add(h);
  }
  return g;
}

/** Potted planter. */
export function makePlant() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.35, 16),
    new THREE.MeshStandardMaterial({ color: 0x8B6F47, roughness: 0.7 })
  );
  pot.position.y = 0.175; pot.castShadow = true; pot.receiveShadow = true; g.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4A6741, roughness: 0.8 });
  for (let i = 0; i < 6; i++) {
    const r = 0.14 + Math.random() * 0.1;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), leafMat);
    const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
    leaf.position.set(Math.cos(angle) * 0.08, 0.5 + Math.random() * 0.3, Math.sin(angle) * 0.08);
    leaf.scale.y = 1.3; leaf.castShadow = true; g.add(leaf);
  }
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), leafMat);
  top.position.y = 0.85; top.scale.y = 1.4; top.castShadow = true; g.add(top);
  return g;
}

/** Hanging pendant light with branded shade. */
export function makePendant() {
  const g = new THREE.Group();
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: 0x2A2826 })
  );
  cord.position.y = 2.7; g.add(cord);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.28, 18, 1, true),
    new THREE.MeshStandardMaterial({
      color: state.brandColor, roughness: 0.4, side: THREE.DoubleSide, metalness: 0.3
    })
  );
  shade.position.y = 2.0; shade.userData.brand = true; shade.castShadow = true; g.add(shade);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff5e0, emissive: 0xffd5a0, emissiveIntensity: 2 })
  );
  bulb.position.y = 1.95; g.add(bulb);
  return g;
}
