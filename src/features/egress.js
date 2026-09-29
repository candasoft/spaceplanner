import * as THREE from 'three';
import { scene, onFrame } from '../three/scene.js';
import { state } from '../core/state.js';
import { roomDims } from '../core/constants.js';
import { showToast } from './toast.js';

/**
 * Fire egress visualization: two curved exit paths with flowing arrows,
 * a pulsing exit ring and an EXIT sign post at the door.
 * Path geometry adapts to the current room footprint.
 */
let egressGroup = null;
let egressArrows = [];

export function toggleFireSafety() {
  state.fireSafety = !state.fireSafety;
  const btn = document.getElementById('fireSafetyBtn');
  btn.classList.toggle('active', state.fireSafety);
  if (state.fireSafety) showEgressPaths();
  else hideEgressPaths();
}

/** Rebuild the egress overlay if visible (after room resize). */
export function rebuildEgress() {
  if (state.fireSafety) showEgressPaths();
}

/** Recolor the egress path tubes/arrows when the brand color changes. */
export function recolorEgressPath(color) {
  if (!egressGroup) return;
  egressGroup.traverse(c => {
    if (c.isMesh && c.userData.egressPath) c.material.color.set(color);
  });
}

function showEgressPaths() {
  hideEgressPaths();
  egressGroup = new THREE.Group();
  egressArrows = [];

  // Exit at front-right corner (door) — scales with the room footprint
  const W = roomDims.w, D = roomDims.d;
  const exitX = W / 2 - 0.5, exitZ = D / 2 - 0.5;

  // Two paths
  const paths = [
    [
      new THREE.Vector3(-W / 2 + 1, 0.02, -D / 2 + 1),
      new THREE.Vector3(-W / 2 + 1, 0.02, D * 0.25),
      new THREE.Vector3(0, 0.02, D * 0.25),
      new THREE.Vector3(exitX, 0.02, D * 0.25),
      new THREE.Vector3(exitX, 0.02, exitZ)
    ],
    [
      new THREE.Vector3(W * 0.33, 0.02, -D / 2 + 1),
      new THREE.Vector3(W * 0.33, 0.02, 0),
      new THREE.Vector3(exitX, 0.02, 0),
      new THREE.Vector3(exitX, 0.02, exitZ)
    ]
  ];

  paths.forEach(points => {
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.3);

    // Tube
    const tubeGeom = new THREE.TubeGeometry(curve, 80, 0.06, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: state.brandColor, transparent: true, opacity: 0.35
    });
    const tube = new THREE.Mesh(tubeGeom, tubeMat);
    tube.userData.egressPath = true;
    egressGroup.add(tube);

    // Flowing arrows
    const arrowCount = 6;
    for (let i = 0; i < arrowCount; i++) {
      const arrowGeom = new THREE.ConeGeometry(0.18, 0.32, 8);
      const arrowMat = new THREE.MeshBasicMaterial({ color: state.brandColor });
      const arrow = new THREE.Mesh(arrowGeom, arrowMat);
      arrow.userData.phase = i / arrowCount;
      arrow.userData.curve = curve;
      egressGroup.add(arrow);
      egressArrows.push(arrow);
    }
  });

  // Exit marker
  const exitRing = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.75, 24),
    new THREE.MeshBasicMaterial({ color: 0x6B8E4E, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  exitRing.position.set(exitX, 0.04, exitZ);
  exitRing.rotation.x = -Math.PI / 2;
  egressGroup.add(exitRing);

  const exitRing2 = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 0.85, 24),
    new THREE.MeshBasicMaterial({ color: 0x6B8E4E, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  exitRing2.position.set(exitX, 0.04, exitZ);
  exitRing2.rotation.x = -Math.PI / 2;
  exitRing2.userData.pulseRing = true;
  egressGroup.add(exitRing2);

  // EXIT sign post
  const signPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: 0x2A2826 })
  );
  signPost.position.set(exitX, 0.7, exitZ);
  egressGroup.add(signPost);

  const signPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.25, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x6B8E4E, emissive: 0x6B8E4E, emissiveIntensity: 0.4 })
  );
  signPlate.position.set(exitX, 1.5, exitZ);
  egressGroup.add(signPlate);

  scene.add(egressGroup);
  showToast('Fire egress paths visible', 'fa-route');
}

function hideEgressPaths() {
  if (egressGroup) {
    scene.remove(egressGroup);
    egressGroup.traverse(c => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    });
    egressGroup = null;
    egressArrows = [];
  }
}

// Per-frame animation: flowing arrows + pulsing exit ring
onFrame((dt, now) => {
  if (egressArrows.length > 0) {
    egressArrows.forEach(arrow => {
      arrow.userData.phase = (arrow.userData.phase + dt * 0.35) % 1;
      const pos = arrow.userData.curve.getPoint(arrow.userData.phase);
      const tangent = arrow.userData.curve.getTangent(arrow.userData.phase).normalize();
      arrow.position.copy(pos);
      arrow.position.y = 0.1;
      arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      // Fade in/out at ends
      const fade = Math.sin(arrow.userData.phase * Math.PI);
      arrow.material.opacity = 0.4 + fade * 0.6;
      arrow.material.transparent = true;
    });
  }

  if (egressGroup) {
    const t = now * 0.001;
    egressGroup.traverse(c => {
      if (c.userData.pulseRing) {
        const s = 1 + Math.sin(t * 2) * 0.15;
        c.scale.set(s, s, 1);
        c.material.opacity = 0.4 + Math.sin(t * 2) * 0.2;
      }
    });
  }
});
