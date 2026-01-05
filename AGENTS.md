# Jake Kaplan Personal Website

Interactive kinetic typography with canvas-based physics. Letters are draggable with gravity, collision, and return-to-home behavior.

## Structure

```
src/
├── routes/index.tsx          # Homepage canvas + layout
├── hooks/useLetterPhysics.ts # Main physics loop, canvas rendering
├── lib/
│   ├── physics.ts            # Physics calculations (pure functions)
│   └── particles.ts          # Particle system logic
├── components/ErrorBoundary.tsx
├── types.ts                  # Letter, Point, Particle interfaces
├── constants.ts              # All tunable values (physics, colors, animation)
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
- `lib/physics.ts` contains pure functions; `useLetterPhysics.ts` orchestrates the render loop
- Tests exist for `lib/physics.ts` and `lib/particles.ts`
