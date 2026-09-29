# Atelier — Commercial Space Planner

A 3D commercial space planner: pick a template, place furniture on the floor,
re-brand the whole room with one color, check capacity & fire egress compliance,
and export a layout sheet / cost quote as PDF.

Originally a single `index.html` file; now a properly structured Vite project
with ES modules and npm-managed dependencies.

**Live demo:** https://candasoft.github.io/spaceplanner/ (auto-deployed from `main` via GitHub Actions)

## Features

- **3D room** (Three.js) with walls, windows, baseboards and wood floor
- **Editable floor layout** — type room width/depth (4–150 m wide × 4–40 m deep)
  in the HUD;
  the room, egress paths, stats and export sheet adapt instantly
- **5 templates** — Cafe, Co-working, Boutique, Restaurant, Exhibition
- **Furniture library** — 12 pieces with ghost-preview click-to-place placement
- **Brand theming** — one accent color recolors chairs, pendants, counters,
  shelving, racks and egress path instantly
- **Capacity planner** — seats, density, per-seat area, max-occupancy meter
- **Fire egress** — animated exit paths, pulsing exit marker, compliance status
- **View transitions** — animated camera move between 3D perspective & floor plan
- **Live costing** — grouped breakdown, delivery/contingency, slide-out panel
- **Export** — animated 2D layout sheet (canvas) + PDF download (jsPDF)
- **Keyboard shortcuts** — `V` toggle view, `F` fire egress, `C` cost panel,
  `1–9` select furniture, `Esc` deselect

## Tech stack

| Package | Purpose |
| --- | --- |
| [Vite](https://vite.dev) | dev server & bundler |
| [three](https://www.npmjs.com/package/three) | 3D rendering + OrbitControls |
| [Tailwind CSS v4](https://tailwindcss.com) (`@tailwindcss/vite`) | utility CSS |
| [jspdf](https://www.npmjs.com/package/jspdf) | PDF export |
| [@fortawesome/fontawesome-free](https://www.npmjs.com/package/@fortawesome/fontawesome-free) | icons |
| `@fontsource-variable/*` | Archivo / Manrope / JetBrains Mono fonts (offline) |

## Getting started

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## Project structure

```
spaceplan/
├── index.html                  # App shell: topbar, panels, HUDs, modals
├── vite.config.js              # Vite + Tailwind plugin
├── public/
│   └── favicon.svg
└── src/
    ├── main.js                 # Entry point — wires modules & boots the app
    ├── styles/
    │   └── main.css            # Tailwind v4 + fonts + all custom CSS
    ├── core/
    │   ├── state.js            # Single shared application state object
    │   ├── constants.js        # Room dimensions, placement margin
    │   └── utils.js            # hexToRgb, animateNumber helpers
    ├── three/
    │   ├── scene.js            # Renderer, camera, controls, lights, render loop
    │   ├── room.js             # Floor, walls, windows, baseboards
    │   └── furniture/
    │       ├── tables.js       # Round/rect table, work desk factories
    │       ├── seating.js      # Chair, bar stool, lounge sofa factories
    │       └── fixtures.js     # Counter, shelf, rack, planter, pendant factories
    └── features/
        ├── catalog.js          # ITEM_CATALOG: type -> { name, icon, price, seats, factory }
        ├── library.js          # Left panel furniture library UI
        ├── selection.js        # select / deselect furniture for placement
        ├── placement.js        # Raycast ghost preview, place/rotate/clear items
        ├── templates.js        # Template presets + template card UI
        ├── stats.js            # Capacity/occupancy stats + placed items list
        ├── costing.js          # Cost breakdown + slide-out cost panel
        ├── brand.js            # Brand color state, swatches, live recolor
        ├── egress.js           # Fire egress paths & animated arrows
        ├── views.js            # Camera transitions (perspective <-> floor plan)
        ├── toolbar.js          # Zoom / rotate / reset / clear / fire buttons
        ├── keyboard.js         # Global keyboard shortcuts
        ├── export.js           # Layout sheet canvas + PDF downloads
        └── toast.js            # Toast notifications
```

## Module graph (no circular dependencies)

`scene → room → furniture → catalog → placement → stats → costing`,
with `selection / templates / toolbar / keyboard / brand / export` as consumers.
The render loop in `scene.js` exposes an `onFrame()` registry that `egress.js`
uses for arrow/ring animations.
