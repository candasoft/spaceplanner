import * as THREE from 'three';
import { state } from '../../core/state.js';
import { makeTextSign } from '../textSign.js';

/**
 * Event & exhibition infrastructure: booths, registration, staging,
 * food stalls, red carpet, sponsor walls, lounges and light trusses.
 * Same visual language as the other furniture sets: warm neutrals
 * (0x2A2826 charcoal, 0xC4BAA8 oat, 0x8B6F47 wood) with brand-color
 * accents flagged via userData.brand for live recoloring.
 */

/** Mesh material helpers (kept local to avoid repeating configs). */
const charcoal = (rough = 0.4, metal = 0.3) =>
  new THREE.MeshStandardMaterial({ color: 0x2A2826, roughness: rough, metalness: metal });
const oat = (rough = 0.6) => new THREE.MeshStandardMaterial({ color: 0xC4BAA8, roughness: rough });
const brand = (rough = 0.6) =>
  new THREE.MeshStandardMaterial({ color: state.brandColor, roughness: rough });

/** Exhibition booth (3 × 3 m default footprint): back wall, side panels, status fascia (available/occupied) and a desk (front counter) whose color is editable from the inspector. */
export function makeBooth() {
  const g = new THREE.Group();
  // Back wall — rear face sits on the footprint edge at z=-1.5
  const back = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 0.08), oat(0.85));
  back.position.set(0, 1.2, -1.46); back.castShadow = true; back.receiveShadow = true; g.add(back);
  // Status fascia band mounted across the top of the back wall.
  // Its rear face sits exactly on the wall's front face (z=-1.42) but with
  // opposite normals; no faces overlap coplanarly anymore (the old position
  // put both rear faces at z=-1.04, causing visible z-fighting/flashing).
  // Color encodes booth status: green = available, red = occupied
  // (toggled from the item inspector). Deliberately NOT userData.brand so
  // brand-color changes don't override the status color.
  const fascia = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.5, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x6B8E4E, roughness: 0.5 })
  );
  fascia.position.set(0, 2.05, -1.37); fascia.castShadow = true; fascia.userData.boothFascia = true; g.add(fascia);
  // Side half-walls — run the full booth depth from the back wall to the
  // front footprint edge (z=1.5); they clear the counter (x ∈ [-0.85, 0.85]).
  [-1.46, 1.46].forEach(x => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 2.93), oat(0.85));
    side.position.set(x, 0.55, 0.035); side.castShadow = true; side.receiveShadow = true; g.add(side);
  });
  // Front presentation counter ("desk") — top keeps its 0.25 m inset from the
  // front edge (z=1.5). Flagged `boothDesk` so the item inspector can recolor
  // it; charcoal() returns a fresh material per call, so each part recolors
  // independently without leaking into other meshes.
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.95, 0.5), charcoal(0.5));
  counter.position.set(0, 0.475, 0.95); counter.castShadow = true; counter.receiveShadow = true;
  counter.userData.boothDesk = true; g.add(counter);
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.6), charcoal(0.3, 0.2));
  counterTop.position.set(0, 0.97, 0.95); counterTop.castShadow = true;
  counterTop.userData.boothDesk = true; g.add(counterTop);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.02), brand(0.5));
  strip.position.set(0, 0.55, 1.21); strip.userData.brand = true; g.add(strip);
  // Name signage — the booth name on the back wall and as a decal on the
  // booth's floor area (both plain black text: the oat wall and light floor
  // give strong contrast). Both start hidden; `setBoothName` (catalog.js)
  // pushes the current name into each sign via the `boothSign` update fn.
  const wallSign = makeTextSign({
    width: 2.6, height: 0.55,
    color: '#000000',
  });
  wallSign.mesh.position.set(0, 1.4, -1.40); // 0.02 in front of the wall face
  wallSign.mesh.userData.boothSign = wallSign.update;
  g.add(wallSign.mesh);
  const floorSign = makeTextSign({
    width: 2.6, height: 1.2,
    color: '#000000',
  });
  floorSign.mesh.rotation.x = -Math.PI / 2; // lie flat, text reads from the front
  floorSign.mesh.position.set(0, 0.012, 0); // just above the floor, footprint center
  floorSign.mesh.userData.boothSign = floorSign.update;
  g.add(floorSign.mesh);
  return g;
}

/** Registration counter with monitors, queue stanchions and branded banner. */
export function makeRegistration() {
  const g = new THREE.Group();
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.95, 0.7), oat(0.7));
  desk.position.y = 0.475; desk.castShadow = true; desk.receiveShadow = true; g.add(desk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.05, 0.8), charcoal(0.3, 0.2));
  top.position.y = 0.97; top.castShadow = true; g.add(top);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 0.02), brand(0.5));
  strip.position.set(0, 0.55, 0.36); strip.userData.brand = true; g.add(strip);
  // Two check-in monitors
  [-0.6, 0.6].forEach(x => {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8), charcoal(0.4, 0.5));
    stand.position.set(x, 1.1, -0.1); g.add(stand);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.02), charcoal(0.3, 0.6));
    screen.position.set(x, 1.35, -0.1); screen.rotation.x = -0.15; screen.castShadow = true; g.add(screen);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.44, 0.26),
      new THREE.MeshStandardMaterial({ color: 0x1F3A5F, emissive: 0x1F3A5F, emissiveIntensity: 0.5 })
    );
    face.position.set(x, 1.35, -0.085); face.rotation.x = -0.15; g.add(face);
  });
  // Overhead banner with branded panel
  [-1.25, 1.25].forEach(x => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 8), charcoal(0.4, 0.5));
    post.position.set(x, 1.15, -0.3); post.castShadow = true; g.add(post);
  });
  const banner = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 0.05), brand(0.55));
  banner.position.set(0, 2.1, -0.3); banner.castShadow = true; banner.userData.brand = true; g.add(banner);
  // Queue stanchions in front
  for (let i = 0; i < 3; i++) {
    const x = -0.9 + i * 0.9;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.95, 8), charcoal(0.3, 0.7));
    post.position.set(x, 0.475, 1.1); post.castShadow = true; g.add(post);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), charcoal(0.3, 0.7));
    ball.position.set(x, 0.98, 1.1); g.add(ball);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 12), charcoal(0.3, 0.7));
    base.position.set(x, 0.015, 1.1); g.add(base);
    if (i < 2) {
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8),
        new THREE.MeshStandardMaterial({ color: state.brandColor, roughness: 0.7 })
      );
      rope.rotation.z = Math.PI / 2;
      rope.position.set(x + 0.45, 0.85, 1.1); rope.userData.brand = true; g.add(rope);
    }
  }
  return g;
}

/** Stage: riser platform, branded backdrop, steps and truss spots. */
export function makeStage() {
  const g = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 3.4), charcoal(0.6, 0.1));
  deck.position.set(0, 0.25, -0.7); deck.castShadow = true; deck.receiveShadow = true; g.add(deck);
  // Black skirting edge
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(6, 0.45, 0.04), charcoal(0.7));
  skirt.position.set(0, 0.24, 1.02); g.add(skirt);
  // Branded backdrop wall
  const back = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 0.12), oat(0.85));
  back.position.set(0, 1.3, -2.3); back.castShadow = true; back.receiveShadow = true; g.add(back);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.6, 0.14), brand(0.55));
  panel.position.set(0, 1.4, -2.28); panel.castShadow = true; panel.userData.brand = true; g.add(panel);
  // Podium
  const podium = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.45), charcoal(0.5));
  podium.position.set(-1.8, 1.05, -1); podium.castShadow = true; g.add(podium);
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), charcoal(0.3, 0.7));
  mic.position.set(-1.8, 1.68, -0.92); mic.rotation.x = 0.4; g.add(mic);
  // Access steps on the right
  [0, 1].forEach(i => {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5 - i * 0.25, 0.5), charcoal(0.6, 0.1));
    step.position.set(3.55, (0.5 - i * 0.25) / 2, 1.45 + i * 0.5);
    step.castShadow = true; step.receiveShadow = true; g.add(step);
  });
  // Front truss with stage lights
  const trussMat = charcoal(0.4, 0.6);
  [-2.9, 2.9].forEach(x => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.6, 0.12), trussMat);
    tower.position.set(x, 1.8, 1.2); tower.castShadow = true; g.add(tower);
  });
  const truss = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.12, 0.12), trussMat);
  truss.position.set(0, 3.55, 1.2); truss.castShadow = true; g.add(truss);
  [-2.1, -0.7, 0.7, 2.1].forEach(x => {
    const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.24, 10), charcoal(0.35, 0.6));
    spot.position.set(x, 3.4, 1.2); spot.rotation.x = 0.35; g.add(spot);
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 2.2, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xfff0c8, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false
      })
    );
    beam.position.set(x, 2.3, 1.45); beam.rotation.x = 0.35; g.add(beam);
  });
  return g;
}

/** Food stall: kiosk with awning, menu board and serving window. */
export function makeFoodStall() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 1.1), oat(0.75));
  body.position.y = 0.5; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 1.2), charcoal(0.35, 0.2));
  counter.position.y = 1.03; counter.castShadow = true; g.add(counter);
  // Roof with striped awning (brand + cream stripes)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 1.4), charcoal(0.5));
  roof.position.set(0, 2.25, 0.05); roof.rotation.x = 0.12; roof.castShadow = true; g.add(roof);
  for (let i = 0; i < 6; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.03, 1.3),
      i % 2 === 0 ? brand(0.55) : new THREE.MeshStandardMaterial({ color: 0xF5F1EA, roughness: 0.6 })
    );
    stripe.position.set(-1.12 + i * 0.45, 2.22 + i * 0.037, 0.05);
    stripe.rotation.x = 0.12;
    if (i % 2 === 0) stripe.userData.brand = true;
    g.add(stripe);
  }
  // Corner posts
  [[-1.2, 0.6], [1.2, 0.6], [-1.2, -0.5], [1.2, -0.5]].forEach(([x, z]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.25, 8), charcoal(0.4, 0.5));
    post.position.set(x, 1.65, z); post.castShadow = true; g.add(post);
  });
  // Menu board (dark with brand header)
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.04), charcoal(0.4));
  board.position.set(0, 1.75, -0.56); board.castShadow = true; g.add(board);
  const header = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.05), brand(0.55));
  header.position.set(0, 2.02, -0.55); header.userData.brand = true; g.add(header);
  // Serving equipment on the counter
  const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.35, 12), charcoal(0.3, 0.6));
  urn.position.set(-0.8, 1.24, -0.2); urn.castShadow = true; g.add(urn);
  const case_ = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.4, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xF5F1EA, roughness: 0.1, transparent: true, opacity: 0.4 })
  );
  case_.position.set(0.5, 1.26, -0.2); g.add(case_);
  return g;
}

/** Red carpet runner with gold trim. */
export function makeRedCarpet() {
  const g = new THREE.Group();
  const carpet = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.02, 6),
    new THREE.MeshStandardMaterial({ color: 0x9E2B25, roughness: 0.95 })
  );
  carpet.position.y = 0.011; carpet.receiveShadow = true; g.add(carpet);
  [-0.76, 0.76].forEach(x => {
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.025, 6),
      new THREE.MeshStandardMaterial({ color: 0xC9A227, roughness: 0.4, metalness: 0.6 })
    );
    trim.position.set(x, 0.013, 0); g.add(trim);
  });
  return g;
}

/** Sponsor wall: step-and-repeat backdrop with branded logo panels. */
export function makeSponsorWall() {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, 0.1), oat(0.85));
  wall.position.y = 1.1; wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
  // Step-and-repeat logo grid
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const isBrand = (row + col) % 2 === 0;
      const logo = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.35, 0.03),
        isBrand ? brand(0.55) : charcoal(0.55)
      );
      logo.position.set(-1.5 + col * 1.0, 0.55 + row * 0.75, 0.07);
      logo.userData.brand = isBrand;
      g.add(logo);
    }
  }
  // Ballast feet
  [-1.7, 1.7].forEach(x => {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.6), charcoal(0.6));
    foot.position.set(x, 0.05, 0); g.add(foot);
  });
  return g;
}

/** Event lounge: low sofa cluster with branded cushions and rug. */
export function makeLounge() {
  const g = new THREE.Group();
  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.015, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x8B6F47, roughness: 0.95 })
  );
  rug.position.y = 0.008; rug.receiveShadow = true; g.add(rug);
  // Two facing low sofas
  [[0, -0.85, 0], [0, 0.85, Math.PI]].forEach(([x, z, rot]) => {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 0.7), oat(0.9));
    base.position.set(x, 0.18, z); base.rotation.y = rot; base.castShadow = true; g.add(base);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.15), oat(0.9));
    back.position.set(x, 0.52, z + (rot === 0 ? -0.28 : 0.28));
    back.rotation.y = rot; back.castShadow = true; g.add(back);
    [-0.92, 0.92].forEach(dx => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.7), oat(0.9));
      arm.position.set(x + dx, 0.4, z); arm.rotation.y = rot; arm.castShadow = true; g.add(arm);
    });
    [-0.5, 0.5].forEach(dx => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.55), brand(0.8));
      c.position.set(x + dx, 0.4, z + (rot === 0 ? 0.05 : -0.05));
      c.rotation.y = rot; c.castShadow = true; c.userData.brand = true; g.add(c);
    });
  });
  // Low coffee table between them
  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 20), charcoal(0.35, 0.2));
  table.position.y = 0.28; table.castShadow = true; g.add(table);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.28, 10), charcoal(0.4, 0.4));
  leg.position.y = 0.14; g.add(leg);
  return g;
}

/** Light truss tower with spotlights and branded banner. */
export function makeTruss() {
  const g = new THREE.Group();
  const mat = charcoal(0.4, 0.6);
  [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 3.4, 0.07), mat);
    leg.position.set(x, 1.7, z); leg.castShadow = true; g.add(leg);
  });
  // Cross bracing
  for (let i = 0; i < 4; i++) {
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.95), mat);
    brace.position.set(0, 0.6 + i * 0.8, 0); brace.rotation.y = Math.PI / 4; g.add(brace);
  }
  // Head frame with 4 spots
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 1.1), mat);
  head.position.y = 3.45; head.castShadow = true; g.add(head);
  [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(([x, z]) => {
    const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.22, 10), charcoal(0.35, 0.6));
    spot.position.set(x, 3.3, z); spot.rotation.x = 0.4; g.add(spot);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xfff5e0, emissive: 0xffd5a0, emissiveIntensity: 2.2 })
    );
    glow.position.set(x, 3.2, z + 0.06); g.add(glow);
  });
  // Branded banner between the legs
  const banner = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.03), brand(0.55));
  banner.position.set(0, 1.9, -0.38); banner.userData.brand = true; banner.castShadow = true; g.add(banner);
  return g;
}

