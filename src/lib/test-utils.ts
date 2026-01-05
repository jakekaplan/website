import type { Letter } from '@/types'

export function createLetter(overrides: Partial<Letter> = {}): Letter {
  return {
    char: 'A',
    x: 0,
    y: 0,
    homeX: 0,
    homeY: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    rotationSpeed: 0,
    width: 50,
    height: 80,
    active: false,
    grabbed: false,
    restlessness: 0,
    hovered: false,
    scale: 1,
    opacity: 1,
    entered: true,
    entryDelay: 0,
    weight: 700,
    ...overrides,
  }
}
