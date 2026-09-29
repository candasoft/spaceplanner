import { makeRoundTable, makeRectTable, makeChair, makeStool, makeDesk } from '../three/furniture/tables.js';
import { makeSofa } from '../three/furniture/seating.js';
import { makeCounter, makeShelf, makeRack, makePlant, makePendant } from '../three/furniture/fixtures.js';
import {
  makeBooth, makeRegistration, makeStage, makeFoodStall,
  makeRedCarpet, makeSponsorWall, makeLounge, makeTruss
} from '../three/furniture/event.js';

/**
 * Furniture catalog: maps item type ids to their display name,
 * icon class, unit price, seat count, mesh factory and footprint.
 */
export const ITEM_CATALOG = {
  round_table: { name: 'Round Table', icon: 'fa-circle', price: 480, seats: 0, factory: makeRoundTable, dim: [1.2, 1.2] },
  rect_table: { name: 'Rectangle Table', icon: 'fa-table-cells', price: 620, seats: 0, factory: makeRectTable, dim: [1.7, 0.9] },
  chair: { name: 'Dining Chair', icon: 'fa-chair', price: 95, seats: 1, factory: () => makeChair(false), dim: [0.45, 0.45] },
  accent_chair: { name: 'Accent Chair', icon: 'fa-chair', price: 145, seats: 1, factory: () => makeChair(true), dim: [0.45, 0.45] },
  stool: { name: 'Bar Stool', icon: 'fa-circle-half-stroke', price: 110, seats: 1, factory: makeStool, dim: [0.4, 0.4] },
  sofa: { name: 'Lounge Sofa', icon: 'fa-couch', price: 1450, seats: 3, factory: makeSofa, dim: [1.9, 0.8] },
  counter: { name: 'Service Counter', icon: 'fa-mug-saucer', price: 3800, seats: 0, factory: makeCounter, dim: [3.1, 0.8] },
  shelf: { name: 'Display Shelf', icon: 'fa-box-archive', price: 680, seats: 0, factory: makeShelf, dim: [1.0, 0.4] },
  rack: { name: 'Clothing Rack', icon: 'fa-shirt', price: 420, seats: 0, factory: makeRack, dim: [1.1, 0.4] },
  desk: { name: 'Work Desk', icon: 'fa-table-list', price: 380, seats: 1, factory: makeDesk, dim: [1.5, 0.8] },
  plant: { name: 'Planter', icon: 'fa-seedling', price: 85, seats: 0, factory: makePlant, dim: [0.5, 0.5] },
  pendant: { name: 'Pendant Light', icon: 'fa-lightbulb', price: 165, seats: 0, factory: makePendant, dim: [0.4, 0.4] },
  // Event & exhibition
  booth: { name: 'Exhibition Booth', icon: 'fa-store', price: 5200, seats: 0, factory: makeBooth, dim: [3.0, 3.0] },
  registration: { name: 'Registration Desk', icon: 'fa-clipboard-check', price: 2900, seats: 0, factory: makeRegistration, dim: [2.7, 1.8] },
  stage: { name: 'Event Stage', icon: 'fa-microphone-lines', price: 9800, seats: 0, factory: makeStage, dim: [6.0, 4.6] },
  food_stall: { name: 'Food Stall', icon: 'fa-burger', price: 2400, seats: 0, factory: makeFoodStall, dim: [2.5, 1.3] },
  red_carpet: { name: 'Red Carpet', icon: 'fa-shoe-prints', price: 750, seats: 0, factory: makeRedCarpet, dim: [1.6, 6.0] },
  sponsor_wall: { name: 'Sponsor Wall', icon: 'fa-award', price: 1850, seats: 0, factory: makeSponsorWall, dim: [4.0, 0.8] },
  lounge: { name: 'Event Lounge', icon: 'fa-couch', price: 3200, seats: 6, factory: makeLounge, dim: [3.4, 2.4] },
  truss: { name: 'Light Truss', icon: 'fa-tower-broadcast', price: 1250, seats: 0, factory: makeTruss, dim: [1.1, 1.1] },
};

/** Booth status fascia colors (mirrors the CSS --success / --danger tokens). */
export const BOOTH_STATUS_COLORS = { available: 0x6B8E4E, occupied: 0xB0432E };

/** Booth desk (front counter) default color — matches the charcoal material. */
export const BOOTH_DESK_DEFAULT = '#2A2826';

/** Recolor every desk mesh (`userData.boothDesk`) inside a placed item's group. */
export function setBoothDeskColor(mesh, color) {
  mesh.traverse(c => {
    if (c.isMesh && c.userData.boothDesk) c.material.color.set(color);
  });
}

/**
 * Push a booth's name into its wall + floor signage meshes.
 * Each sign stores its canvas redraw fn on `userData.boothSign`
 * (see three/textSign.js); an empty/whitespace name hides both signs.
 */
export function setBoothName(mesh, name) {
  mesh.traverse(c => {
    if (c.isMesh && typeof c.userData.boothSign === 'function') {
      c.userData.boothSign(name);
    }
  });
}
