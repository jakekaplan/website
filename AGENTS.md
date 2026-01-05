# Jake Kaplan Personal Website

A minimalist personal website featuring interactive kinetic typography with canvas-based physics simulation.

## Overview

The site displays "Jake Kaplan" as draggable, physics-enabled letters on a canvas. Users can interact with letters by dragging them, pressing spacebar to scatter all letters, or hovering to lift individual letters. Letters naturally return to their home positions when released.

## Tech Stack

- **React 19** with TanStack Router
- **Vite 7** for build tooling
- **TypeScript** in strict mode
- **Biome** for linting and formatting
- **Canvas API** for rendering and physics

## Project Structure

```
src/
├── routes/
│   ├── index.tsx        # Homepage component (canvas + layout)
│   └── __root.tsx       # Root layout
├── hooks/
│   └── useLetterPhysics.ts  # Physics simulation and canvas rendering
├── types.ts             # TypeScript interfaces (Letter, Point, Particles)
├── constants.ts         # Configuration values (colors, physics, animation)
├── index.css            # Global styles
└── main.tsx             # Entry point
```

## Key Features

### Physics System (`useLetterPhysics.ts`)
- Gravity, friction, and bounce physics for realistic motion
- Collision detection between letters
- Home force pulls letters back when released
- Restlessness system increases return force over time

### Visual Effects
- **Dust particles**: Ambient floating particles that respond to letter movement (wake turbulence)
- **Collision particles**: Dust puffs on letter-to-letter and letter-to-ground impacts
- **Entry animation**: Letters scale in sequentially on page load
- **Hover effect**: Letters scale up when hovered
- **HiDPI support**: Canvas renders at device pixel ratio for crisp text

### Interactions
- **Drag**: Click and drag any letter
- **Throw**: Release while moving to throw letters
- **Scatter**: Press spacebar to explode all letters outward
- **Reset**: Button returns all letters to home positions

## Configuration

All tunable values are in `src/constants.ts`:
- Physics: `GRAVITY`, `FRICTION`, `BOUNCE`, `HOME_FORCE`
- Animation: `DUST_PARTICLE_COUNT`, `ENTRY_DELAY_PER_LETTER`, `HOVER_SCALE`
- Colors: `BG_COLOR`, `INK_COLOR`, `INK_GRABBED`, `GROUND_COLOR`

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Check with Biome
npm run lint:fix  # Auto-fix lint/format issues
npm run format    # Format code
```

## Design

- **Aesthetic**: Design studio / kinetic typography
- **Fonts**: DM Mono (display) + Instrument Serif (body)
- **Colors**: Warm ivory background (#f8f6f1), stone ink (#1c1917)
- **Textures**: Subtle noise overlay, grid pattern
