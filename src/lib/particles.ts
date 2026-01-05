import { DUST_PARTICLE_COUNT } from '@/constants'
import type { CollisionParticle, DustParticle, Letter } from '@/types'

export function updateAllDust(
  dust: DustParticle[],
  letters: Letter[] | null,
  time: number,
  width: number,
  height: number,
): void {
  for (const d of dust) {
    updateDustParticle(d, letters, time, width, height)
  }
}

export function createDustParticles(
  width: number,
  height: number,
): DustParticle[] {
  const particles: DustParticle[] = []

  for (let i = 0; i < DUST_PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.15 + 0.05,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.2 - 0.1,
      drift: Math.random() * Math.PI * 2,
    })
  }

  return particles
}

export function createCollisionParticles(
  x: number,
  y: number,
  intensity: number,
): CollisionParticle[] {
  const particles: CollisionParticle[] = []
  const count = Math.floor(3 + intensity * 4)

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = (1 + Math.random() * 2) * intensity
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: 1 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.3,
      life: 1,
    })
  }

  return particles
}

function updateDustParticle(
  dust: DustParticle,
  letters: Letter[] | null,
  time: number,
  width: number,
  height: number,
): void {
  // Wake turbulence from moving letters (when letters are present)
  if (letters) {
    for (const letter of letters) {
      if (!letter.active && !letter.grabbed) continue

      const dx = dust.x - letter.x
      const dy = dust.y - letter.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const letterSpeed = Math.sqrt(
        letter.vx * letter.vx + letter.vy * letter.vy,
      )
      const pushRadius = letter.width * 1.5

      if (dist < pushRadius && letterSpeed > 2) {
        const pushStrength = (1 - dist / pushRadius) * letterSpeed * 0.15
        const nx = dx / (dist || 1)
        const ny = dy / (dist || 1)
        dust.speedX += nx * pushStrength
        dust.speedY += ny * pushStrength
      }
    }
  }

  // Apply movement with drift
  dust.x += dust.speedX + Math.sin(time * 0.5 + dust.drift) * 0.15
  dust.y += dust.speedY

  // Apply damping
  dust.speedX *= 0.98
  dust.speedY *= 0.98

  // Return to baseline drift
  dust.speedX += ((Math.random() - 0.5) * 0.3 - dust.speedX) * 0.01
  dust.speedY += ((Math.random() - 0.5) * 0.2 - 0.1 - dust.speedY) * 0.01

  // Wrap around screen edges
  if (dust.x < -10) dust.x = width + 10
  if (dust.x > width + 10) dust.x = -10
  if (dust.y < -10) dust.y = height + 10
  if (dust.y > height + 10) dust.y = -10
}

function updateCollisionParticle(particle: CollisionParticle): void {
  particle.x += particle.vx
  particle.y += particle.vy
  particle.vy += 0.1
  particle.life -= 0.03
  particle.opacity = particle.life * 0.4
}

export function updateCollisionParticles(
  particles: CollisionParticle[],
): CollisionParticle[] {
  for (const p of particles) updateCollisionParticle(p)
  return particles.filter((p) => p.life > 0)
}
