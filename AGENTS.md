# Jake Kaplan Personal Website

Interactive kinetic typography with canvas-based physics. Letters are draggable with gravity, collision, and return-to-home behavior.

## Structure

```
src/
├── routes/index.tsx        # Homepage canvas + layout
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

## Notes

- Physics constants live in `constants.ts` - modify there, not inline
- `lib/` contains pure functions; `useKineticName.ts` orchestrates the render loop
- Tests exist for `lib/physics.ts` and `lib/particles.ts`
