import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Three.js bootstrap: scene, camera, renderer, controls, lighting,
 * resize handling and the central animation loop.
 *
 * Other modules subscribe per-frame work with `onFrame()` instead of
 * running their own requestAnimationFrame loops.
 */

// ---------- DOM mount ----------
export const container = document.getElementById('canvasContainer');

// ---------- Scene ----------
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xF5F1EA);
scene.fog = new THREE.Fog(0xF5F1EA, 18, 38);

// ---------- Camera ----------
export const camera = new THREE.PerspectiveCamera(
  40,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(10, 8, 12);

// ---------- Renderer ----------
export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

// ---------- Controls ----------
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 22;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 1, 0);

// ---------- Lighting ----------
const ambient = new THREE.AmbientLight(0xfff5e8, 0.55);
scene.add(ambient);

const sunLight = new THREE.DirectionalLight(0xfff0d5, 1.0);
sunLight.position.set(7, 13, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.left = -12;
sunLight.shadow.camera.right = 12;
sunLight.shadow.camera.top = 12;
sunLight.shadow.camera.bottom = -12;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 40;
sunLight.shadow.bias = -0.0005;
sunLight.shadow.radius = 4;
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight(0xfff5e8, 0xc4b394, 0.35);
scene.add(hemiLight);

const fillLight = new THREE.DirectionalLight(0xc4b394, 0.3);
fillLight.position.set(-5, 4, -3);
scene.add(fillLight);

// ---------- Frame callback registry ----------
const frameCallbacks = new Set();

/**
 * Register a callback to run every frame: cb(deltaTimeSeconds, nowMs).
 * Returns an unsubscribe function.
 */
export function onFrame(cb) {
  frameCallbacks.add(cb);
  return () => frameCallbacks.delete(cb);
}

// ---------- Resize ----------
window.addEventListener('resize', () => {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// ---------- Animation loop ----------
let lastTime = performance.now();

function tick(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  frameCallbacks.forEach((cb) => cb(dt, now));

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

export function startRenderLoop() {
  requestAnimationFrame(tick);
}

/**
 * Adapt camera limits, fog, far plane and the sun's shadow frustum to the
 * room footprint so large rooms (up to 150 × 40 m) stay fully visible and
 * small ones keep tight framing.
 */
export function setRoomScale(w, d) {
  const span = Math.max(w, d);
  controls.maxDistance = Math.max(22, span * 1.8);
  scene.fog.near = Math.max(18, span * 1.6);
  scene.fog.far = Math.max(38, span * 3.4);

  // Push the camera far plane out so the room never gets clipped when
  // zoomed out (default far of 100 only fits rooms up to ~30 m).
  const far = Math.max(100, span * 4.2);
  if (camera.far !== far) {
    camera.far = far;
    camera.updateProjectionMatrix();
  }

  // Scale the sun light and its shadow frustum with the room so the whole
  // floor keeps receiving shadows (fixed ±12 box only covers small rooms).
  const s = Math.max(1, span / 12);
  sunLight.position.set(7 * s, 13 * s, 5 * s);
  sunLight.shadow.camera.left = -12 * s;
  sunLight.shadow.camera.right = 12 * s;
  sunLight.shadow.camera.top = 12 * s;
  sunLight.shadow.camera.bottom = -12 * s;
  sunLight.shadow.camera.far = 40 * s;
  sunLight.shadow.camera.updateProjectionMatrix();
}
