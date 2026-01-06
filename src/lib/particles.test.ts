import { DUST_COLORED_RATIO, DUST_PARTICLE_COUNT } from '@/constants'
import {
  createCollisionParticles,
  createDustParticles,
  updateAllDust,
  updateCollisionParticles,
} from './particles'
import { createLetter } from './test-utils'

const TEST_COLOR_COUNT = 3

describe('createDustParticles', () => {
  it('creates the correct number of dust particles', () => {
    const particles = createDustParticles(800, 600, TEST_COLOR_COUNT)
    expect(particles).toHaveLength(DUST_PARTICLE_COUNT)
  })

  it('creates particles within bounds', () => {
    const width = 800
    const height = 600
    const particles = createDustParticles(width, height, TEST_COLOR_COUNT)

    for (const p of particles) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(width)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(height)
    }
  })

  it('creates particles with valid properties', () => {
    const particles = createDustParticles(800, 600, TEST_COLOR_COUNT)

    for (const p of particles) {
      expect(p.size).toBeGreaterThan(0)
      expect(p.opacity).toBeGreaterThan(0)
      expect(p.opacity).toBeLessThanOrEqual(0.2)
    }
  })

  it('assigns colorIndex to some particles', () => {
    const particles = createDustParticles(800, 600, TEST_COLOR_COUNT)
    const coloredCount = particles.filter((p) => p.colorIndex !== null).length
    const expectedMin = DUST_PARTICLE_COUNT * DUST_COLORED_RATIO * 0.5
    const expectedMax = DUST_PARTICLE_COUNT * DUST_COLORED_RATIO * 1.5

    expect(coloredCount).toBeGreaterThan(expectedMin)
    expect(coloredCount).toBeLessThan(expectedMax)
  })

  it('assigns valid colorIndex values', () => {
    const particles = createDustParticles(800, 600, TEST_COLOR_COUNT)
    const coloredParticles = particles.filter((p) => p.colorIndex !== null)

    for (const p of coloredParticles) {
      expect(p.colorIndex).toBeGreaterThanOrEqual(0)
      expect(p.colorIndex).toBeLessThan(TEST_COLOR_COUNT)
    }
  })

  it('creates no colored particles when colorCount is 0', () => {
    const particles = createDustParticles(800, 600, 0)
    const coloredCount = particles.filter((p) => p.colorIndex !== null).length
    expect(coloredCount).toBe(0)
  })
})

describe('createCollisionParticles', () => {
  it('creates particles at the specified position', () => {
    const particles = createCollisionParticles(100, 200, 1)

    for (const p of particles) {
      expect(p.x).toBe(100)
      expect(p.y).toBe(200)
    }
  })

  it('creates more particles with higher intensity', () => {
    const lowIntensity = createCollisionParticles(0, 0, 0.5)
    const highIntensity = createCollisionParticles(0, 0, 1.5)

    expect(highIntensity.length).toBeGreaterThan(lowIntensity.length)
  })

  it('creates particles with initial life of 1', () => {
    const particles = createCollisionParticles(0, 0, 1)

    for (const p of particles) {
      expect(p.life).toBe(1)
    }
  })
})

describe('updateAllDust', () => {
  it('moves particles based on speed', () => {
    const particle = {
      x: 100,
      y: 100,
      size: 2,
      opacity: 0.1,
      speedX: 1,
      speedY: 1,
      drift: 0,
      colorIndex: null,
    }
    const initialX = particle.x
    const initialY = particle.y

    updateAllDust([particle], [], 0, 800, 600)

    expect(particle.x).not.toBe(initialX)
    expect(particle.y).not.toBe(initialY)
  })

  it('applies wake turbulence from moving letters', () => {
    const particle = {
      x: 110,
      y: 100,
      size: 2,
      opacity: 0.1,
      speedX: 0,
      speedY: 0,
      drift: 0,
      colorIndex: null,
    }
    const letter = createLetter({ x: 100, y: 100, vx: 10, vy: 0, active: true })

    updateAllDust([particle], [letter], 0, 800, 600)

    expect(particle.speedX).not.toBe(0)
  })

  it('wraps particles around screen edges', () => {
    const particle = {
      x: -20,
      y: 100,
      size: 2,
      opacity: 0.1,
      speedX: 0,
      speedY: 0,
      drift: 0,
      colorIndex: null,
    }

    updateAllDust([particle], [], 0, 800, 600)

    expect(particle.x).toBeGreaterThan(0)
  })
})

describe('updateCollisionParticles', () => {
  it('moves particles based on velocity', () => {
    const particle = {
      x: 100,
      y: 100,
      vx: 5,
      vy: -5,
      size: 2,
      opacity: 0.5,
      life: 1,
    }

    updateCollisionParticles([particle])

    expect(particle.x).toBe(105)
    expect(particle.y).toBe(95)
  })

  it('applies gravity to particles', () => {
    const particle = {
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      size: 2,
      opacity: 0.5,
      life: 1,
    }

    updateCollisionParticles([particle])

    expect(particle.vy).toBeGreaterThan(0)
  })

  it('filters out dead particles', () => {
    const particles = [
      { x: 0, y: 0, vx: 0, vy: 0, size: 1, opacity: 0.5, life: 0.5 },
      { x: 0, y: 0, vx: 0, vy: 0, size: 1, opacity: 0, life: 0 },
    ]

    const result = updateCollisionParticles(particles)

    expect(result).toHaveLength(1)
  })
})
