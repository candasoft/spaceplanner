import * as THREE from 'three';
import { scene } from './scene.js';
import { roomDims, ROOM_H } from '../core/constants.js';

/**
 * The room shell: floor with plank lines, walls, baseboards, door
 * opening marker and windows.
 *
 * Built from the mutable `roomDims` — `rebuildRoom()` tears down and
 * regenerates everything when the floor editor changes the footprint.
 */
let roomGroup = null;

function disposeGroup(group) {
  group.traverse(c => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
  });
  scene.remove(group);
}

/** Build the whole room shell for the current roomDims. Returns the floor mesh. */
function buildRoom() {
  const group = new THREE.Group();
  const W = roomDims.w;
  const D = roomDims.d;

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ color: 0xE8DCC4, roughness: 0.88, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.userData.isFloor = true;
  group.add(floor);

  // Floor plank lines (subtle wood pattern)
  const plankMat = new THREE.LineBasicMaterial({ color: 0xb8a88a, transparent: true, opacity: 0.18 });
  for (let i = -D / 2; i <= D / 2; i += 0.4) {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-W / 2, 0.002, i),
      new THREE.Vector3(W / 2, 0.002, i)
    ]);
    group.add(new THREE.Line(geom, plankMat));
  }

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xF5F1EA, roughness: 0.95 });

  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(W, ROOM_H, 0.15), wallMat);
  wallBack.position.set(0, ROOM_H / 2, -D / 2);
  wallBack.receiveShadow = true;
  group.add(wallBack);

  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.15, ROOM_H, D), wallMat);
  wallLeft.position.set(-W / 2, ROOM_H / 2, 0);
  wallLeft.receiveShadow = true;
  group.add(wallLeft);

  // Baseboards
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2A2826, roughness: 0.7 });
  const baseBack = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, 0.02), baseMat);
  baseBack.position.set(0, 0.04, -D / 2 + 0.085);
  group.add(baseBack);
  const baseLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, D), baseMat);
  baseLeft.position.set(-W / 2 + 0.085, 0.04, 0);
  group.add(baseLeft);

  // Door opening on right wall (visual: gap indicator on floor)
  const doorW = Math.min(1.2, D * 0.35);
  const doorMarker = new THREE.Mesh(
    new THREE.PlaneGeometry(doorW, 0.1),
    new THREE.MeshBasicMaterial({ color: 0xC75D3F, transparent: true, opacity: 0 })
  );
  doorMarker.rotation.x = -Math.PI / 2;
  doorMarker.position.set(W / 2 - 0.1, 0.003, D * 0.4);
  group.add(doorMarker);

  // Windows sized/spaced relative to wall width (skip tiny rooms)
  if (W >= 8) addWindow(group, W, -W * 0.27, W * 0.23);
  if (W >= 12) addWindow(group, W, W * 0.18, W * 0.2);

  scene.add(group);
  roomGroup = group;
  return floor;
}

/** One window with frame, positioned on the back wall. */
function addWindow(group, W, x, w) {
  const D = roomDims.d;
  const h = Math.min(1.8, ROOM_H * 0.5);
  const y = 1.65;

  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0, emissive: 0xfff5e0, emissiveIntensity: 0.5, roughness: 1
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), windowMat);
  glass.position.set(x, y, -D / 2 + 0.09);
  group.add(glass);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2A2826, roughness: 0.6 });
  const t = 0.05;
  const parts = [
    { size: [w + t * 2, t, 0.06], pos: [x, y + h / 2 + t / 2, -D / 2 + 0.1] },
    { size: [w + t * 2, t, 0.06], pos: [x, y - h / 2 - t / 2, -D / 2 + 0.1] },
    { size: [t, h + t * 2, 0.06], pos: [x - w / 2 - t / 2, y, -D / 2 + 0.1] },
    { size: [t, h + t * 2, 0.06], pos: [x + w / 2 + t / 2, y, -D / 2 + 0.1] },
    { size: [t * 0.7, h, 0.06], pos: [x, y, -D / 2 + 0.1] },
  ];
  parts.forEach(p => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...p.size), frameMat);
    m.position.set(...p.pos);
    group.add(m);
  });
}

export let floor = buildRoom();

/**
 * Rebuild the room shell after the floor editor changes roomDims.
 * Returns the new floor mesh.
 */
export function rebuildRoom() {
  if (roomGroup) disposeGroup(roomGroup);
  floor = buildRoom();
  return floor;
}

/** Always-current floor mesh (rebuilt when dimensions change). */
export function getFloor() {
  return floor;
}
