import * as THREE from 'three';
import { state } from '../../core/state.js';

/** Lounge sofa with branded throw cushions. */
export function makeSofa() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.4, 0.75),
    new THREE.MeshStandardMaterial({ color: 0xC4BAA8, roughness: 0.9 })
  );
  base.position.y = 0.2; base.castShadow = true; base.receiveShadow = true; g.add(base);
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.55, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xC4BAA8, roughness: 0.9 })
  );
  back.position.set(0, 0.6, -0.28); back.castShadow = true; g.add(back);
  const armMat = new THREE.MeshStandardMaterial({ color: 0xC4BAA8, roughness: 0.9 });
  [-0.82, 0.82].forEach(x => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.75), armMat);
    arm.position.set(x, 0.45, 0); arm.castShadow = true; g.add(arm);
  });
  // Brand cushions
  const cushionMat = new THREE.MeshStandardMaterial({ color: state.brandColor, roughness: 0.8 });
  [-0.45, 0.45].forEach(x => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 0.6), cushionMat);
    c.position.set(x, 0.46, 0.05); c.castShadow = true; c.userData.brand = true; g.add(c);
  });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2A2826, metalness: 0.3 });
  [[-0.85, -0.32], [0.85, -0.32], [-0.85, 0.32], [0.85, 0.32]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6), legMat);
    leg.position.set(x, 0.05, z); g.add(leg);
  });
  return g;
}
