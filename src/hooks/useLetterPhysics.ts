import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BG_COLOR,
  BOUNCE,
  DUST_PARTICLE_COUNT,
  ENTRY_FADE_LERP,
  ENTRY_Y_OFFSET,
  FRICTION,
  GRAVITY,
  GROUND_COLOR,
  GROUND_OFFSET,
  HOME_FORCE,
  HOVER_SCALE,
  INK_COLOR,
  INK_GRABBED,
  MAX_RESTLESSNESS,
  RESTLESSNESS_GROWTH,
  SCALE_LERP,
} from '../constants'
import type { CollisionParticle, DustParticle, Letter, Point } from '../types'

export function useLetterPhysics(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const lettersRef = useRef<Letter[]>([])
  const dustRef = useRef<DustParticle[]>([])
  const collisionParticlesRef = useRef<CollisionParticle[]>([])
  const lastPosRef = useRef<Point | null>(null)
  const grabbedLetterRef = useRef<Letter | null>(null)
  const grabOffsetRef = useRef<Point>({ x: 0, y: 0 })
  const animationRef = useRef<number>(0)
  const initializedRef = useRef(false)
  const entryAnimationRef = useRef(false)
  const timeRef = useRef<number>(0)
  const [isHovering, setIsHovering] = useState(false)
  const hoveredLetterRef = useRef<Letter | null>(null)

  const initDust = useCallback((width: number, height: number) => {
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

    dustRef.current = particles
  }, [])

  const spawnCollisionParticles = useCallback(
    (x: number, y: number, intensity: number) => {
      const count = Math.floor(3 + intensity * 4)
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = (1 + Math.random() * 2) * intensity
        collisionParticlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          size: 1 + Math.random() * 2,
          opacity: 0.3 + Math.random() * 0.3,
          life: 1,
        })
      }
    },
    [],
  )

  const initLetters = useCallback((width: number, height: number) => {
    const name = 'Jake Kaplan'
    const fontSize = Math.min(80, width / 7)
    const letters: Letter[] = []
    const isFirstLoad = !entryAnimationRef.current

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.font = `500 ${fontSize}px 'DM Mono', monospace`

    const totalWidth = ctx.measureText(name).width
    let x = (width - totalWidth) / 2
    const y = height / 2

    for (const char of name) {
      const charWidth = ctx.measureText(char).width
      if (char !== ' ') {
        const posX = x + charWidth / 2
        letters.push({
          char,
          x: posX,
          y: isFirstLoad ? y + ENTRY_Y_OFFSET : y,
          homeX: posX,
          homeY: y,
          vx: 0,
          vy: 0,
          rotation: 0,
          rotationSpeed: 0,
          width: charWidth,
          height: fontSize,
          active: false,
          grabbed: false,
          restlessness: 0,
          hovered: false,
          scale: 1,
          opacity: isFirstLoad ? 0 : 1,
          breatheOffset: Math.random() * Math.PI * 2,
          entryDelay: 0,
          entered: !isFirstLoad,
        })
      }
      x += charWidth
    }

    if (isFirstLoad) {
      entryAnimationRef.current = true
    }

    lettersRef.current = letters
  }, [])

  const update = useCallback(
    (width: number, height: number) => {
      const groundY = height - GROUND_OFFSET

      timeRef.current += 0.016

      // Handle entry animation - fade up from bottom (all at once)
      for (const letter of lettersRef.current) {
        if (!letter.entered) {
          letter.entered = true
        }
        if (letter.opacity < 1 && !letter.active && !letter.grabbed) {
          letter.opacity += (1 - letter.opacity) * ENTRY_FADE_LERP
          letter.y += (letter.homeY - letter.y) * ENTRY_FADE_LERP
          if (letter.opacity > 0.99) {
            letter.opacity = 1
            letter.y = letter.homeY
          }
        }
      }

      // Letter-to-letter collisions
      for (let i = 0; i < lettersRef.current.length; i++) {
        for (let j = i + 1; j < lettersRef.current.length; j++) {
          const a = lettersRef.current[i]
          const b = lettersRef.current[j]

          if (!a.active && !b.active) continue
          if (a.restlessness > 0.3 || b.restlessness > 0.3) continue

          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minDist = (a.width + b.width) * 0.35

          if (dist < minDist && dist > 0) {
            const nx = dx / dist
            const ny = dy / dist
            const overlap = minDist - dist

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

              if (impactSpeed > 3) {
                const impactX = (a.x + b.x) / 2
                const impactY = (a.y + b.y) / 2
                spawnCollisionParticles(
                  impactX,
                  impactY,
                  Math.min(impactSpeed / 10, 1.5),
                )
              }

              a.active = true
              b.active = true
            }
          }
        }
      }

      // Update letters
      for (const letter of lettersRef.current) {
        if (letter.grabbed) {
          letter.restlessness = 0
          continue
        }

        if (!letter.active) continue

        const speed = Math.sqrt(letter.vx * letter.vx + letter.vy * letter.vy)
        const isSettled = speed < 1 && Math.abs(letter.rotationSpeed) < 0.02

        if (isSettled) {
          letter.restlessness = Math.min(
            MAX_RESTLESSNESS,
            letter.restlessness + RESTLESSNESS_GROWTH,
          )
        }

        const dxHome = letter.homeX - letter.x
        const dyHome = letter.homeY - letter.y
        const distHome = Math.sqrt(dxHome * dxHome + dyHome * dyHome)

        if (letter.restlessness > 0 && distHome > 1) {
          const force = HOME_FORCE * letter.restlessness * letter.restlessness
          letter.vx += dxHome * force
          letter.vy += dyHome * force
          letter.rotationSpeed += -letter.rotation * 0.02 * letter.restlessness
        }

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
          continue
        }

        const effectiveGravity = GRAVITY * (1 - letter.restlessness * 0.95)
        letter.vy += effectiveGravity
        letter.vx *= FRICTION
        letter.vy *= FRICTION
        letter.rotation += letter.rotationSpeed
        letter.rotationSpeed *= 0.98

        letter.x += letter.vx
        letter.y += letter.vy

        const visualHeight = letter.height * 0.7
        if (letter.y + visualHeight / 2 >= groundY) {
          const impactSpeed = Math.abs(letter.vy)

          letter.y = groundY - visualHeight / 2
          letter.vy *= -BOUNCE
          letter.vx *= 0.9
          letter.rotationSpeed = letter.vx * 0.01

          if (impactSpeed > 5) {
            spawnCollisionParticles(
              letter.x,
              groundY,
              Math.min(impactSpeed / 12, 1.5),
            )
          }

          if (Math.abs(letter.vy) < 0.5) {
            letter.vy = 0
          }
        }

        if (letter.x < letter.width / 2) {
          letter.x = letter.width / 2
          letter.vx *= -BOUNCE
        } else if (letter.x > width - letter.width / 2) {
          letter.x = width - letter.width / 2
          letter.vx *= -BOUNCE
        }

        if (letter.y < letter.height / 2) {
          letter.y = letter.height / 2
          letter.vy *= -BOUNCE
        }
      }

      // Update scale (hover lift effect)
      for (const letter of lettersRef.current) {
        if (letter.entered && letter.scale > 0.95) {
          const targetScale =
            letter.hovered && !letter.grabbed ? HOVER_SCALE : 1
          letter.scale += (targetScale - letter.scale) * SCALE_LERP
        }
      }

      // Update dust particles with wake turbulence
      for (const dust of dustRef.current) {
        for (const letter of lettersRef.current) {
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

        dust.x +=
          dust.speedX + Math.sin(timeRef.current * 0.5 + dust.drift) * 0.15
        dust.y += dust.speedY

        dust.speedX *= 0.98
        dust.speedY *= 0.98

        dust.speedX += ((Math.random() - 0.5) * 0.3 - dust.speedX) * 0.01
        dust.speedY += ((Math.random() - 0.5) * 0.2 - 0.1 - dust.speedY) * 0.01

        if (dust.x < -10) dust.x = width + 10
        if (dust.x > width + 10) dust.x = -10
        if (dust.y < -10) dust.y = height + 10
        if (dust.y > height + 10) dust.y = -10
      }

      // Update collision particles
      for (const p of collisionParticlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.1
        p.life -= 0.03
        p.opacity = p.life * 0.4
      }
      collisionParticlesRef.current = collisionParticlesRef.current.filter(
        (p) => p.life > 0,
      )
    },
    [spawnCollisionParticles],
  )

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, width, height)

      // Draw dust particles
      for (const dust of dustRef.current) {
        ctx.beginPath()
        ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(28, 25, 23, ${dust.opacity})`
        ctx.fill()
      }

      // Draw collision particles
      for (const p of collisionParticlesRef.current) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(28, 25, 23, ${p.opacity})`
        ctx.fill()
      }

      const groundY = height - GROUND_OFFSET

      ctx.strokeStyle = GROUND_COLOR
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, groundY)
      ctx.lineTo(width, groundY)
      ctx.stroke()

      const fontSize = Math.min(80, width / 7)
      ctx.font = `500 ${fontSize}px 'DM Mono', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      for (const letter of lettersRef.current) {
        ctx.save()
        ctx.translate(letter.x, letter.y)
        ctx.rotate(letter.rotation)
        ctx.scale(letter.scale, letter.scale)
        ctx.globalAlpha = letter.opacity

        if (letter.hovered || letter.active || letter.grabbed) {
          const shadowIntensity = letter.hovered ? 0.2 : 0.15
          const shadowBlur = letter.hovered ? 16 : 12
          const shadowY = letter.hovered ? 6 : 4
          ctx.shadowColor = `rgba(28, 25, 23, ${shadowIntensity * letter.opacity})`
          ctx.shadowBlur = shadowBlur
          ctx.shadowOffsetX = 2
          ctx.shadowOffsetY = shadowY
        }

        ctx.fillStyle = letter.grabbed ? INK_GRABBED : INK_COLOR
        ctx.fillText(letter.char, 0, 0)
        ctx.restore()
      }
    },
    [],
  )

  const reset = useCallback(() => {
    grabbedLetterRef.current = null
    const canvas = canvasRef.current
    if (canvas) {
      const dpr = window.devicePixelRatio || 1
      initLetters(canvas.width / dpr, canvas.height / dpr)
    }
  }, [canvasRef, initLetters])

  const scatter = useCallback(() => {
    for (const letter of lettersRef.current) {
      letter.active = true
      letter.restlessness = 0
      letter.vx = (Math.random() - 0.5) * 25
      letter.vy = -Math.random() * 20 - 10
      letter.rotationSpeed = (Math.random() - 0.5) * 0.3
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    const setCanvasSize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)
      return { width: w, height: h }
    }

    let { width, height } = setCanvasSize()

    if (!initializedRef.current) {
      initLetters(width, height)
      initDust(width, height)
      initializedRef.current = true
    }

    const handleResize = () => {
      const size = setCanvasSize()
      width = size.width
      height = size.height
      initLetters(width, height)
      initDust(width, height)
    }

    const getPos = (e: MouseEvent | Touch): Point => ({
      x: e.clientX,
      y: e.clientY,
    })

    const hitTestLetters = (pos: Point): Letter | null => {
      for (let i = lettersRef.current.length - 1; i >= 0; i--) {
        const letter = lettersRef.current[i]
        const dx = pos.x - letter.x
        const dy = pos.y - letter.y

        const cos = Math.cos(-letter.rotation)
        const sin = Math.sin(-letter.rotation)
        const localX = dx * cos - dy * sin
        const localY = dx * sin + dy * cos

        if (
          Math.abs(localX) < letter.width * 0.6 &&
          Math.abs(localY) < letter.height * 0.4
        ) {
          return letter
        }
      }
      return null
    }

    const handleMouseDown = (e: MouseEvent) => {
      const pos = getPos(e)
      const letter = hitTestLetters(pos)

      if (letter) {
        grabbedLetterRef.current = letter
        letter.grabbed = true
        letter.active = true
        letter.vx = (Math.random() - 0.5) * 6
        letter.vy = -12
        letter.rotation += (Math.random() - 0.5) * 0.2
        letter.restlessness = 0
        grabOffsetRef.current = {
          x: letter.x - pos.x,
          y: letter.y - pos.y - 20,
        }
        lastPosRef.current = pos
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getPos(e)

      const hovered = hitTestLetters(pos)
      setIsHovering(!!hovered)

      if (hoveredLetterRef.current && hoveredLetterRef.current !== hovered) {
        hoveredLetterRef.current.hovered = false
      }
      if (hovered) {
        hovered.hovered = true
      }
      hoveredLetterRef.current = hovered

      if (grabbedLetterRef.current) {
        const letter = grabbedLetterRef.current

        if (lastPosRef.current) {
          letter.vx = (pos.x - lastPosRef.current.x) * 0.5
          letter.vy = (pos.y - lastPosRef.current.y) * 0.5
        }

        letter.x = pos.x + grabOffsetRef.current.x
        letter.y = pos.y + grabOffsetRef.current.y
        lastPosRef.current = pos
      }
    }

    const handleMouseUp = () => {
      if (grabbedLetterRef.current) {
        const letter = grabbedLetterRef.current
        letter.grabbed = false
        letter.vx *= 2
        letter.vy *= 2
        letter.rotationSpeed = letter.vx * 0.02
        grabbedLetterRef.current = null
      }
      lastPosRef.current = null
    }

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const pos = getPos(e.touches[0])
      const letter = hitTestLetters(pos)

      if (letter) {
        grabbedLetterRef.current = letter
        letter.grabbed = true
        letter.active = true
        letter.vx = (Math.random() - 0.5) * 6
        letter.vy = -12
        letter.rotation += (Math.random() - 0.5) * 0.2
        letter.restlessness = 0
        grabOffsetRef.current = {
          x: letter.x - pos.x,
          y: letter.y - pos.y - 20,
        }
        lastPosRef.current = pos
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const pos = getPos(e.touches[0])

      if (grabbedLetterRef.current) {
        const letter = grabbedLetterRef.current

        if (lastPosRef.current) {
          letter.vx = (pos.x - lastPosRef.current.x) * 0.5
          letter.vy = (pos.y - lastPosRef.current.y) * 0.5
        }

        letter.x = pos.x + grabOffsetRef.current.x
        letter.y = pos.y + grabOffsetRef.current.y
        lastPosRef.current = pos
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      handleMouseUp()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        scatter()
      }
    }

    const animate = () => {
      update(width, height)
      draw(ctx, width, height)
      animationRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeyDown)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseUp)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      cancelAnimationFrame(animationRef.current)
    }
  }, [canvasRef, update, draw, initLetters, initDust, scatter])

  return { isHovering, reset }
}
