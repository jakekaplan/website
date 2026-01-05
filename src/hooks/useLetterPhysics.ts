import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BG_COLOR,
  ENTRY_Y_OFFSET,
  GROUND_COLOR,
  GROUND_OFFSET,
  INK_COLOR,
  INK_GRABBED,
} from '@/constants'
import {
  createCollisionParticle,
  createDustParticles,
  isParticleAlive,
  updateCollisionParticle,
  updateDustParticle,
} from '@/lib/particles'
import {
  checkLetterCollision,
  hitTestLetter,
  updateActiveLetter,
  updateEntryAnimation,
  updateLetterScale,
} from '@/lib/physics'
import type { CollisionParticle, DustParticle, Letter, Point } from '@/types'

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

  const spawnCollisionParticles = useCallback(
    (x: number, y: number, intensity: number) => {
      const particles = createCollisionParticle(x, y, intensity)
      collisionParticlesRef.current.push(...particles)
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

      for (const letter of lettersRef.current) {
        updateEntryAnimation(letter)
      }

      // Letter-to-letter collisions
      for (let i = 0; i < lettersRef.current.length; i++) {
        const letterA = lettersRef.current[i]
        if (!letterA) continue
        for (let j = i + 1; j < lettersRef.current.length; j++) {
          const letterB = lettersRef.current[j]
          if (!letterB) continue
          const collision = checkLetterCollision(letterA, letterB)
          if (collision) {
            spawnCollisionParticles(
              collision.impactX,
              collision.impactY,
              collision.impactSpeed,
            )
          }
        }
      }

      // Update letters
      for (const letter of lettersRef.current) {
        const impactSpeed = updateActiveLetter(letter, groundY, width)
        if (impactSpeed !== null) {
          spawnCollisionParticles(
            letter.x,
            groundY,
            Math.min(impactSpeed / 12, 1.5),
          )
        }
        updateLetterScale(letter)
      }

      // Update particles
      for (const dust of dustRef.current) {
        updateDustParticle(
          dust,
          lettersRef.current,
          timeRef.current,
          width,
          height,
        )
      }
      for (const p of collisionParticlesRef.current) {
        updateCollisionParticle(p)
      }
      collisionParticlesRef.current =
        collisionParticlesRef.current.filter(isParticleAlive)
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
      dustRef.current = createDustParticles(width, height)
      initializedRef.current = true
    }

    const handleResize = () => {
      const size = setCanvasSize()
      width = size.width
      height = size.height
      initLetters(width, height)
      dustRef.current = createDustParticles(width, height)
    }

    const getPos = (e: MouseEvent | Touch): Point => ({
      x: e.clientX,
      y: e.clientY,
    })

    const hitTestLetters = (pos: Point): Letter | null => {
      for (let i = lettersRef.current.length - 1; i >= 0; i--) {
        const letter = lettersRef.current[i]
        if (letter && hitTestLetter(pos, letter)) {
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

      for (const letter of lettersRef.current) {
        letter.hovered = letter === hovered
      }

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
      const touch = e.touches[0]
      if (!touch) return
      const pos = getPos(touch)
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
      const touch = e.touches[0]
      if (!touch) return
      const pos = getPos(touch)

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
  }, [canvasRef, update, draw, initLetters, scatter])

  return { isHovering, reset }
}
