import {
  BOUNCE,
  ENTRY_DELAY,
  ENTRY_DURATION,
  ENTRY_Y_OFFSET,
  FRICTION,
  GRAVITY,
  HOME_FORCE,
  HOVER_SCALE,
  MAX_RESTLESSNESS,
  RESTLESSNESS_GROWTH,
  SCALE_LERP,
} from '@/constants'
import type {
  CollisionResult,
  Letter,
  LetterUpdateResult,
  Point,
} from '@/types'

export function applyGravityAndFriction(letter: Letter): void {
  const effectiveGravity = GRAVITY * (1 - letter.restlessness * 0.95)
  letter.vy += effectiveGravity
  letter.vx *= FRICTION
  letter.vy *= FRICTION
  letter.rotation += letter.rotationSpeed
  letter.rotationSpeed *= 0.98
}

export function applyVelocity(letter: Letter): void {
  letter.x += letter.vx
  letter.y += letter.vy
}

export function updateRestlessness(letter: Letter): void {
  const speed = Math.sqrt(letter.vx * letter.vx + letter.vy * letter.vy)
  const isSettled = speed < 1 && Math.abs(letter.rotationSpeed) < 0.02

  if (isSettled) {
    letter.restlessness = Math.min(
      MAX_RESTLESSNESS,
      letter.restlessness + RESTLESSNESS_GROWTH,
    )
  }
}

export function applyHomeForce(letter: Letter): boolean {
  const dxHome = letter.homeX - letter.x
  const dyHome = letter.homeY - letter.y
  const distHome = Math.sqrt(dxHome * dxHome + dyHome * dyHome)

  if (letter.restlessness > 0 && distHome > 1) {
    const force = HOME_FORCE * letter.restlessness * letter.restlessness
    letter.vx += dxHome * force
    letter.vy += dyHome * force
    letter.rotationSpeed += -letter.rotation * 0.02 * letter.restlessness
  }

  // Check if letter should snap to home
  if (
    distHome < 3 &&
    letter.restlessness > 0.5 &&
    Math.abs(letter.rotation) < 0.05
  ) {
    letter.x = letter.homeX
    letter.y = letter.homeY
    letter.vx = 0
    letter.vy = 0
    letter.rotation = 0
    letter.rotationSpeed = 0
    letter.active = false
    letter.restlessness = 0
    return true // Letter snapped to home
  }

  return false
}

export function handleGroundCollision(
  letter: Letter,
  groundY: number,
): number | null {
  const visualHeight = letter.height * 0.7
  if (letter.y + visualHeight / 2 >= groundY) {
    const impactSpeed = Math.abs(letter.vy)

    letter.y = groundY - visualHeight / 2
    letter.vy *= -BOUNCE
    letter.vx *= 0.9
    letter.rotationSpeed = letter.vx * 0.01

    if (Math.abs(letter.vy) < 0.5) {
      letter.vy = 0
    }

    return impactSpeed > 5 ? impactSpeed : null
  }
  return null
}

export function handleWallCollision(letter: Letter, width: number): void {
  if (letter.x < letter.width / 2) {
    letter.x = letter.width / 2
    letter.vx *= -BOUNCE
  } else if (letter.x > width - letter.width / 2) {
    letter.x = width - letter.width / 2
    letter.vx *= -BOUNCE
  }
}

export function handleCeilingCollision(letter: Letter): void {
  if (letter.y < letter.height / 2) {
    letter.y = letter.height / 2
    letter.vy *= -BOUNCE
  }
}

export function resolveLetterCollision(
  a: Letter,
  b: Letter,
): CollisionResult | null {
  if (!a.active && !b.active) return null
  if (a.restlessness > 0.3 || b.restlessness > 0.3) return null

  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const minDist = (a.width + b.width) * 0.35

  if (dist < minDist && dist > 0) {
    const nx = dx / dist
    const ny = dy / dist
    const overlap = minDist - dist

    // Resolve overlap
    if (!a.grabbed && !b.grabbed) {
      a.x -= (nx * overlap) / 2
      a.y -= (ny * overlap) / 2
      b.x += (nx * overlap) / 2
      b.y += (ny * overlap) / 2
    } else if (a.grabbed) {
      b.x += nx * overlap
      b.y += ny * overlap
    } else {
      a.x -= nx * overlap
      a.y -= ny * overlap
    }

    // Resolve velocity
    const dvx = a.vx - b.vx
    const dvy = a.vy - b.vy
    const dvDotN = dvx * nx + dvy * ny

    if (dvDotN > 0) {
      const restitution = 0.7
      const impactSpeed = Math.abs(dvDotN)

      if (!a.grabbed) {
        a.vx -= dvDotN * nx * restitution
        a.vy -= dvDotN * ny * restitution
        a.rotationSpeed += (Math.random() - 0.5) * 0.1
      }
      if (!b.grabbed) {
        b.vx += dvDotN * nx * restitution
        b.vy += dvDotN * ny * restitution
        b.rotationSpeed += (Math.random() - 0.5) * 0.1
      }

      a.active = true
      b.active = true

      if (impactSpeed > 3) {
        return {
          impactX: (a.x + b.x) / 2,
          impactY: (a.y + b.y) / 2,
          impactSpeed: Math.min(impactSpeed / 10, 1.5),
        }
      }
    }
  }

  return null
}

export function hitTestLetter(pos: Point, letter: Letter): boolean {
  const dx = pos.x - letter.x
  const dy = pos.y - letter.y

  const cos = Math.cos(-letter.rotation)
  const sin = Math.sin(-letter.rotation)
  const localX = dx * cos - dy * sin
  const localY = dx * sin + dy * cos

  return (
    Math.abs(localX) < letter.width * 0.6 &&
    Math.abs(localY) < letter.height * 0.4
  )
}

function updateLetterScale(letter: Letter): void {
  if (letter.entered && letter.scale > 0.95) {
    const targetScale = letter.hovered && !letter.grabbed ? HOVER_SCALE : 1
    letter.scale += (targetScale - letter.scale) * SCALE_LERP
  }
}

function updateActiveLetter(
  letter: Letter,
  groundY: number,
  width: number,
): number | null {
  if (letter.grabbed) {
    letter.restlessness = 0
    return null
  }

  if (!letter.active) return null

  updateRestlessness(letter)
  if (applyHomeForce(letter)) return null

  applyGravityAndFriction(letter)
  applyVelocity(letter)

  const impactSpeed = handleGroundCollision(letter, groundY)
  handleWallCollision(letter, width)
  handleCeilingCollision(letter)

  return impactSpeed
}

/** Update entry animation for a single letter */
function updateLetterEntry(letter: Letter, elapsed: number): void {
  if (letter.entered) return

  const t = Math.min(
    1,
    Math.max(0, elapsed - letter.entryDelay - ENTRY_DELAY) / ENTRY_DURATION,
  )
  if (t <= 0) return

  const ease = 1 - (1 - t) ** 3
  letter.opacity = Math.min(1, t * 1.5)
  letter.y = letter.homeY + ENTRY_Y_OFFSET * (1 - ease)

  if (t >= 1) {
    letter.entered = true
    letter.y = letter.homeY
    letter.opacity = 1
  }
}

/** Find all letter-letter collisions and return collision results */
export function findLetterCollisions(letters: Letter[]): CollisionResult[] {
  const results: CollisionResult[] = []
  for (let i = 0; i < letters.length; i++) {
    const a = letters[i]
    if (!a) continue
    for (let j = i + 1; j < letters.length; j++) {
      const b = letters[j]
      if (!b) continue
      const collision = resolveLetterCollision(a, b)
      if (collision) results.push(collision)
    }
  }
  return results
}

/** Update all letters physics and return results for particle spawning */
export function updateAllLetters(
  letters: Letter[],
  groundY: number,
  width: number,
): LetterUpdateResult {
  let anyActive = false
  const groundImpacts: { x: number; y: number; intensity: number }[] = []

  for (const letter of letters) {
    if (letter.active) anyActive = true
    const impact = updateActiveLetter(letter, groundY, width)
    if (impact !== null) {
      groundImpacts.push({
        x: letter.x,
        y: groundY,
        intensity: Math.min(impact / 12, 1.5),
      })
    }
    updateLetterScale(letter)
  }

  return { anyActive, groundImpacts }
}

/** Run entry animation on all letters */
export function updateAllLetterEntries(
  letters: Letter[],
  elapsed: number,
): void {
  for (const letter of letters) {
    updateLetterEntry(letter, elapsed)
  }
}
