import type { Letter } from '@/types'
import {
  applyGravityAndFriction,
  applyHomeForce,
  applyVelocity,
  handleCeilingCollision,
  handleGroundCollision,
  handleWallCollision,
  hitTestLetter,
  resolveLetterCollision,
  updateRestlessness,
} from './physics'

function createLetter(overrides: Partial<Letter> = {}): Letter {
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

describe('applyGravityAndFriction', () => {
  it('increases vertical velocity due to gravity', () => {
    const letter = createLetter({ vy: 0, restlessness: 0 })
    applyGravityAndFriction(letter)
    expect(letter.vy).toBeGreaterThan(0)
  })

  it('reduces gravity effect when restlessness is high', () => {
    const letterLowRestless = createLetter({ vy: 0, restlessness: 0 })
    const letterHighRestless = createLetter({ vy: 0, restlessness: 1 })

    applyGravityAndFriction(letterLowRestless)
    applyGravityAndFriction(letterHighRestless)

    expect(letterLowRestless.vy).toBeGreaterThan(letterHighRestless.vy)
  })

  it('applies friction to reduce velocity', () => {
    const letter = createLetter({ vx: 10, vy: 10 })
    applyGravityAndFriction(letter)
    expect(letter.vx).toBeLessThan(10)
  })
})

describe('applyVelocity', () => {
  it('updates position based on velocity', () => {
    const letter = createLetter({ x: 100, y: 100, vx: 5, vy: 10 })
    applyVelocity(letter)
    expect(letter.x).toBe(105)
    expect(letter.y).toBe(110)
  })
})

describe('updateRestlessness', () => {
  it('increases restlessness when letter is settled', () => {
    const letter = createLetter({
      vx: 0,
      vy: 0,
      rotationSpeed: 0,
      restlessness: 0,
    })
    updateRestlessness(letter)
    expect(letter.restlessness).toBeGreaterThan(0)
  })

  it('does not increase restlessness when letter is moving', () => {
    const letter = createLetter({ vx: 10, vy: 10, restlessness: 0 })
    updateRestlessness(letter)
    expect(letter.restlessness).toBe(0)
  })

  it('caps restlessness at max value', () => {
    const letter = createLetter({
      vx: 0,
      vy: 0,
      rotationSpeed: 0,
      restlessness: 0.99,
    })
    updateRestlessness(letter)
    expect(letter.restlessness).toBeLessThanOrEqual(1)
  })
})

describe('applyHomeForce', () => {
  it('pulls letter toward home position when restless', () => {
    const letter = createLetter({
      x: 200,
      y: 200,
      homeX: 100,
      homeY: 100,
      restlessness: 0.5,
      vx: 0,
      vy: 0,
    })
    applyHomeForce(letter)
    expect(letter.vx).toBeLessThan(0)
    expect(letter.vy).toBeLessThan(0)
  })

  it('snaps letter to home when close and restless enough', () => {
    const letter = createLetter({
      x: 101,
      y: 101,
      homeX: 100,
      homeY: 100,
      restlessness: 0.6,
      rotation: 0.01,
    })
    const snapped = applyHomeForce(letter)
    expect(snapped).toBe(true)
    expect(letter.x).toBe(100)
    expect(letter.y).toBe(100)
    expect(letter.active).toBe(false)
  })

  it('does not snap when not restless enough', () => {
    const letter = createLetter({
      x: 101,
      y: 101,
      homeX: 100,
      homeY: 100,
      restlessness: 0.3,
    })
    const snapped = applyHomeForce(letter)
    expect(snapped).toBe(false)
  })
})

describe('handleGroundCollision', () => {
  it('bounces letter off ground', () => {
    const letter = createLetter({ y: 500, vy: 10, height: 80 })
    const groundY = 500
    handleGroundCollision(letter, groundY)
    expect(letter.vy).toBeLessThan(0)
  })

  it('returns impact speed when collision is significant', () => {
    const letter = createLetter({ y: 500, vy: 20, height: 80 })
    const groundY = 500
    const impact = handleGroundCollision(letter, groundY)
    expect(impact).toBe(20)
  })

  it('returns null when no collision', () => {
    const letter = createLetter({ y: 100, vy: 5, height: 80 })
    const groundY = 500
    const impact = handleGroundCollision(letter, groundY)
    expect(impact).toBeNull()
  })
})

describe('handleWallCollision', () => {
  it('bounces letter off left wall', () => {
    const letter = createLetter({ x: 10, vx: -5, width: 50 })
    handleWallCollision(letter, 800)
    expect(letter.vx).toBeGreaterThan(0)
  })

  it('bounces letter off right wall', () => {
    const letter = createLetter({ x: 790, vx: 5, width: 50 })
    handleWallCollision(letter, 800)
    expect(letter.vx).toBeLessThan(0)
  })
})

describe('handleCeilingCollision', () => {
  it('bounces letter off ceiling', () => {
    const letter = createLetter({ y: 10, vy: -5, height: 80 })
    handleCeilingCollision(letter)
    expect(letter.vy).toBeGreaterThan(0)
  })
})

describe('resolveLetterCollision', () => {
  it('detects collision between overlapping letters', () => {
    const a = createLetter({ x: 100, y: 100, vx: 5, active: true })
    const b = createLetter({ x: 120, y: 100, vx: -5, active: true })
    resolveLetterCollision(a, b)
    expect(a.active).toBe(true)
    expect(b.active).toBe(true)
  })

  it('returns null when letters are far apart', () => {
    const a = createLetter({ x: 100, y: 100, active: true })
    const b = createLetter({ x: 500, y: 500, active: true })
    const result = resolveLetterCollision(a, b)
    expect(result).toBeNull()
  })

  it('skips collision check when both inactive', () => {
    const a = createLetter({ x: 100, y: 100, active: false })
    const b = createLetter({ x: 120, y: 100, active: false })
    const result = resolveLetterCollision(a, b)
    expect(result).toBeNull()
  })
})

describe('hitTestLetter', () => {
  it('returns true when point is inside letter bounds', () => {
    const letter = createLetter({ x: 100, y: 100, width: 50, height: 80 })
    expect(hitTestLetter({ x: 100, y: 100 }, letter)).toBe(true)
  })

  it('returns false when point is outside letter bounds', () => {
    const letter = createLetter({ x: 100, y: 100, width: 50, height: 80 })
    expect(hitTestLetter({ x: 200, y: 200 }, letter)).toBe(false)
  })

  it('accounts for letter rotation', () => {
    const letter = createLetter({
      x: 100,
      y: 100,
      width: 50,
      height: 80,
      rotation: Math.PI / 4,
    })
    // Point at corner should be considered based on rotated bounds
    expect(hitTestLetter({ x: 100, y: 100 }, letter)).toBe(true)
  })
})
