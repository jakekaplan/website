# Jake Kaplan Personal Website

Personal website for Jake Kaplan, software engineer. Currently features an interactive kinetic name animation on the homepage, with plans to expand into side projects and blog posts.

## Style

Warm minimalist aesthetic with an ambient, organic feel. The brush stroke motif evokes a calligraphic, hand-drawn quality. Clean and understated with subtle interactive depth.

## Kinetic Name Feature

The homepage features interactive typography where letters behave as physical objects—draggable with gravity, collision, and return-to-home behavior.

## Structure

```
src/
├── main.tsx                # App entry point
├── routes/
│   ├── __root.tsx          # Root layout
│   └── index.tsx           # Homepage canvas + layout
├── hooks/useKineticName.ts # Canvas orchestration (input, animation loop)
├── lib/
│   ├── physics.ts          # Physics calculations (pure functions)
│   ├── particles.ts        # Particle system logic
│   └── render.ts           # Canvas drawing functions
├── components/ErrorBoundary.tsx
├── types.ts                # Domain types (Letter, Point, Particle, etc.)
├── constants.ts            # Tunable values (physics, colors, animation)
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

## Notes

- Physics constants live in `constants.ts` - modify there, not inline
- `lib/` contains pure functions; `useKineticName.ts` orchestrates the render loop
- Tests exist for `lib/physics.ts` and `lib/particles.ts`
