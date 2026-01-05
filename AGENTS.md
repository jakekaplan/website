# Jake Kaplan Personal Website

Personal website for Jake Kaplan, software engineer. Features an interactive kinetic name animation with a persistent canvas background.

## Style

Warm minimalist aesthetic with an ambient, organic feel. The brush stroke motif evokes a calligraphic, hand-drawn quality. Clean and understated with subtle interactive depth.

## Architecture

The site uses a **persistent background** pattern: a fullscreen canvas runs continuously behind all content and persists across route navigation.

```
__root.tsx (Root Layout)
├── ThemeProvider
├── CanvasProvider
├── ErrorBoundary
└── .app
    ├── Canvas (fullscreen, z-index: 1, persistent)
    ├── Header (fixed top, z-index: 10)
    ├── main (z-index: 5)
    │   └── <Outlet /> (route content)
    └── Footer (fixed bottom, z-index: 10)
```

Routes control canvas visibility via `CanvasContext`:
- Home page shows letters on mount, hides on unmount
- Dust particles always animate regardless of letter visibility

## Structure

```
src/
├── main.tsx                    # App entry point
├── routes/
│   ├── __root.tsx              # Root layout + providers + persistent canvas
│   ├── index.tsx               # Homepage (shows hint after letters settle)
│   └── about.tsx               # About page
├── hooks/useCanvas.ts          # Canvas orchestration (input, animation loop)
├── contexts/
│   ├── CanvasContext.tsx       # Canvas state (letter visibility, reset)
│   └── ThemeContext.tsx        # Theme state (light/dark) + localStorage
├── components/
│   ├── Canvas.tsx              # Fullscreen canvas wrapper
│   ├── Header.tsx              # Nav, social links, theme toggle, reset
│   ├── Footer.tsx              # Source link
│   └── ErrorBoundary.tsx
├── lib/
│   ├── physics.ts              # Letter physics (pure functions)
│   ├── particles.ts            # Dust & collision particles
│   ├── render.ts               # Canvas drawing functions
│   └── text.ts                 # Text measurement utilities
├── types.ts                    # Domain types (Letter, Point, Particle, etc.)
├── constants.ts                # Tunable values (physics, colors, animation)
└── index.css
```

## Commands

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run test      # Run tests
npm run lint      # Biome check
npm run lint:fix  # Auto-fix
```

## Physics

Letters behave as physical objects with:

- **Gravity & Friction** - Letters fall and slow down over time
- **Collisions** - Bounce off ground, walls, ceiling, and each other
- **Restlessness** - Settled letters accumulate "restlessness" which grows over time
- **Home Force** - Restless letters are pulled back toward their original position with force proportional to restlessness²
- **Snap to Home** - When close enough to home and sufficiently restless, letters snap back and deactivate

The loop: grab letter → falls with physics → settles → builds restlessness → returns home → snaps back.

## Theming

Light/dark mode with theme-specific brush strokes:
- Light: warm cream background, orange accent, `warm-brush-stroke.png`
- Dark: navy background, teal accent, `cool-brush-stroke.png`

Theme colors are defined in two places that must stay in sync:
- `constants.ts` → `THEME` object (for canvas rendering, includes brush stroke paths)
- `index.css` → CSS variables in `:root` and `:root[data-theme="dark"]`

The `constants.ts` values have inline comments showing their CSS variable counterparts.

## Code Patterns

- **Pure functions in `lib/`** - physics, particles, render, text are stateless and testable
- **Hook orchestrates** - `useCanvas` owns refs and the animation loop, delegates to `lib/`
- **Context for cross-route state** - `CanvasContext` allows routes to control canvas without prop drilling
- **Types in `types.ts`** - domain types (Letter, Particle, etc.) are centralized
- **Constants in `constants.ts`** - no magic numbers inline

When adding new functionality, prefer pure functions in `lib/` over adding complexity to hooks.
