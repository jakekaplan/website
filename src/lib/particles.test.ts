import { DUST_PARTICLE_COUNT } from '@/constants'
import type { CollisionParticle, Letter } from '@/types'
import {
  createCollisionParticle,
  createDustParticles,
  isParticleAlive,
  updateCollisionParticle,
  updateDustParticle,
} from './particles'

function createLetter(overrides: Partial<Letter> = {}): Letter {
  return {
    char: 'A',
    x: 100,
    y: 100,
    homeX: 100,
    homeY: 100,
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
    ...overrides,
  }
}

describe('createDustParticles', () => {
  it('creates the correct number of dust particles', () => {
    const particles = createDustParticles(800, 600)
    expect(particles).toHaveLength(DUST_PARTICLE_COUNT)
  })

  it('creates particles within bounds', () => {
    const width = 800
    const height = 600
    const particles = createDustParticles(width, height)

    for (const p of particles) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(width)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(height)
    }
  })

  it('creates particles with valid properties', () => {
    const particles = createDustParticles(800, 600)

    for (const p of particles) {
      expect(p.size).toBeGreaterThan(0)
      expect(p.opacity).toBeGreaterThan(0)
      expect(p.opacity).toBeLessThanOrEqual(0.2)
    }
  })
})

describe('createCollisionParticle', () => {
  it('creates particles at the specified position', () => {
    const particles = createCollisionParticle(100, 200, 1)

    for (const p of particles) {
      expect(p.x).toBe(100)
      expect(p.y).toBe(200)
    }
  })

  it('creates more particles with higher intensity', () => {
    const lowIntensity = createCollisionParticle(0, 0, 0.5)
    const highIntensity = createCollisionParticle(0, 0, 1.5)

    expect(highIntensity.length).toBeGreaterThan(lowIntensity.length)
  })

  it('creates particles with initial life of 1', () => {
    const particles = createCollisionParticle(0, 0, 1)

    for (const p of particles) {
      expect(p.life).toBe(1)
    }
  })
})

describe('updateDustParticle', () => {
  it('moves particle based on speed', () => {
    const dust = {
      x: 100,
      y: 100,
      size: 2,
      opacity: 0.1,
      speedX: 1,
      speedY: 1,
      drift: 0,
    }
    const initialX = dust.x
    const initialY = dust.y

    updateDustParticle(dust, [], 0, 800, 600)

    expect(dust.x).not.toBe(initialX)
    expect(dust.y).not.toBe(initialY)
  })

  it('applies wake turbulence from moving letters', () => {
    const dust = {
      x: 110,
      y: 100,
      size: 2,
      opacity: 0.1,
      speedX: 0,
      speedY: 0,
      drift: 0,
    }
    const letter = createLetter({ x: 100, y: 100, vx: 10, vy: 0, active: true })

    updateDustParticle(dust, [letter], 0, 800, 600)

    expect(dust.speedX).not.toBe(0)
  })

  it('wraps particles around screen edges', () => {
    const dust = {
      x: -20,
      y: 100,
      size: 2,
      opacity: 0.1,
      speedX: 0,
      speedY: 0,
      drift: 0,
    }

    updateDustParticle(dust, [], 0, 800, 600)

    expect(dust.x).toBeGreaterThan(0)
  })
})

describe('updateCollisionParticle', () => {
  it('moves particle based on velocity', () => {
    const particle: CollisionParticle = {
      x: 100,
      y: 100,
      vx: 5,
      vy: -5,
      size: 2,
      opacity: 0.5,
      life: 1,
    }

    updateCollisionParticle(particle)

    expect(particle.x).toBe(105)
    expect(particle.y).toBe(95)
  })

  it('applies gravity to particle', () => {
    const particle: CollisionParticle = {
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      size: 2,
      opacity: 0.5,
      life: 1,
    }

    updateCollisionParticle(particle)

    expect(particle.vy).toBeGreaterThan(0)
  })

  it('decreases life over time', () => {
    const particle: CollisionParticle = {
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      size: 2,
      opacity: 0.5,
      life: 1,
    }

    updateCollisionParticle(particle)

    expect(particle.life).toBeLessThan(1)
  })
})

describe('isParticleAlive', () => {
  it('returns true when life is positive', () => {
    const particle: CollisionParticle = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 1,
      opacity: 0.5,
      life: 0.5,
    }

    expect(isParticleAlive(particle)).toBe(true)
  })

  it('returns false when life is zero or negative', () => {
    const particle: CollisionParticle = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 1,
      opacity: 0,
      life: 0,
    }

    expect(isParticleAlive(particle)).toBe(false)
  })
})
