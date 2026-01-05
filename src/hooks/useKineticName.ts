import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ENTRY_DELAY,
  ENTRY_DURATION,
  ENTRY_STAGGER,
  ENTRY_Y_OFFSET,
  GROUND_OFFSET,
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
  updateLetterScale,
} from '@/lib/physics'
import {
  drawBackground,
  drawBrushStroke,
  drawGround,
  drawLetters,
  drawParticles,
} from '@/lib/render'
import type { CollisionParticle, DustParticle, Letter, Point } from '@/types'

export function useKineticName(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const lettersRef = useRef<Letter[]>([])
  const dustRef = useRef<DustParticle[]>([])
  const collisionParticlesRef = useRef<CollisionParticle[]>([])
  const brushStrokeRef = useRef<HTMLImageElement | null>(null)
  const brushStrokeOpacity = useRef(0)
  const lastPosRef = useRef<Point | null>(null)
  const grabbedLetterRef = useRef<Letter | null>(null)
  const grabOffsetRef = useRef<Point>({ x: 0, y: 0 })
  const animationRef = useRef<number>(0)
  const initializedRef = useRef(false)
  const entryAnimationRef = useRef(false)
  const startTimeRef = useRef<number>(0)
  const timeRef = useRef<number>(0)
  const [isHovering, setIsHovering] = useState(false)
  const [isGrabbing, setIsGrabbing] = useState(false)
  const [isAtRest, setIsAtRest] = useState(true)
  const [showHint, setShowHint] = useState(false)

  const spawnCollisionParticles = useCallback(
    (x: number, y: number, intensity: number) => {
      const particles = createCollisionParticle(x, y, intensity)
      collisionParticlesRef.current.push(...particles)
    },
    [],
  )

  const initLetters = useCallback((width: number, height: number) => {
    const firstName = 'Jake'
    const lastName = 'Kaplan'
    const fontSize = Math.min(80, width / 7)
    const letters: Letter[] = []
    const isFirstLoad = !entryAnimationRef.current

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Measure total width with mixed weights
    ctx.font = `800 ${fontSize}px 'Syne', sans-serif`
    const firstNameWidth = ctx.measureText(firstName).width
    ctx.font = `400 ${fontSize}px 'Syne', sans-serif`
    const lastNameWidth = ctx.measureText(lastName).width
    const spaceWidth = ctx.measureText(' ').width

    const totalWidth = firstNameWidth + spaceWidth + lastNameWidth
    let x = (width - totalWidth) / 2
    const y = height / 2
    let letterIndex = 0

    const addLetter = (char: string, charWidth: number, weight: 400 | 800) => {
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
        entryDelay: letterIndex * ENTRY_STAGGER,
        weight,
      })
      x += charWidth
      letterIndex++
    }

    ctx.font = `800 ${fontSize}px 'Syne', sans-serif`
    for (const char of firstName) {
      addLetter(char, ctx.measureText(char).width, 800)
    }

    x += spaceWidth

    ctx.font = `400 ${fontSize}px 'Syne', sans-serif`
    for (const char of lastName) {
      addLetter(char, ctx.measureText(char).width, 400)
    }

    if (isFirstLoad) {
      entryAnimationRef.current = true
      startTimeRef.current = performance.now()
    }

    lettersRef.current = letters
  }, [])

  const update = useCallback(
    (width: number, height: number) => {
      const groundY = height - GROUND_OFFSET
      timeRef.current += 0.016
      const now = performance.now()
      const elapsed = now - startTimeRef.current

      // Brush stroke fade in (starts immediately, finishes before letters)
      if (brushStrokeOpacity.current < 1) {
        const brushDuration = 500
        brushStrokeOpacity.current = Math.min(1, elapsed / brushDuration)
      }

      // Staggered entry animation
      for (const letter of lettersRef.current) {
        if (!letter.entered) {
          const timeSinceStart = elapsed - letter.entryDelay - ENTRY_DELAY
          if (timeSinceStart > 0) {
            const t = Math.min(1, timeSinceStart / ENTRY_DURATION)
            // Smooth ease out
            const ease = 1 - (1 - t) ** 3

            letter.opacity = Math.min(1, t * 1.5)
            letter.y = letter.homeY + ENTRY_Y_OFFSET * (1 - ease)

            if (t >= 1) {
              letter.entered = true
              letter.y = letter.homeY
              letter.opacity = 1
            }
          }
        }
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
      let anyActive = false
      for (const letter of lettersRef.current) {
        if (letter.active) anyActive = true
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
      setIsAtRest(!anyActive)

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
      drawBackground(ctx, width, height)
      if (brushStrokeRef.current) {
        drawBrushStroke(
          ctx,
          brushStrokeRef.current,
          brushStrokeOpacity.current,
          lettersRef.current,
        )
      }
      drawParticles(ctx, dustRef.current, collisionParticlesRef.current)
      drawGround(ctx, width, height)
      drawLetters(ctx, lettersRef.current, width)
    },
    [],
  )

  const reset = useCallback(() => {
    grabbedLetterRef.current = null
    setIsGrabbing(false)
    collisionParticlesRef.current = []
    const canvas = canvasRef.current
    if (canvas) {
      const dpr = window.devicePixelRatio || 1
      const width = canvas.width / dpr
      const height = canvas.height / dpr
      initLetters(width, height)
      dustRef.current = createDustParticles(width, height)
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

    const initialize = () => {
      if (!initializedRef.current) {
        initLetters(width, height)
        dustRef.current = createDustParticles(width, height)
        initializedRef.current = true
      }
    }

    // Load brush stroke image
    const brushImg = new Image()
    brushImg.src = '/brush-stroke.png'
    brushImg.onload = () => {
      brushStrokeRef.current = brushImg
    }

    // Explicitly load Syne font before measuring text
    document.fonts.load("800 48px 'Syne'").then(() => {
      initialize()
    })

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

    const grabLetter = (pos: Point) => {
      const letter = hitTestLetters(pos)
      if (!letter) return

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
      setIsGrabbing(true)
    }

    const dragLetter = (pos: Point) => {
      const letter = grabbedLetterRef.current
      if (!letter) return

      if (lastPosRef.current) {
        letter.vx = (pos.x - lastPosRef.current.x) * 0.5
        letter.vy = (pos.y - lastPosRef.current.y) * 0.5
      }

      letter.x = pos.x + grabOffsetRef.current.x
      letter.y = pos.y + grabOffsetRef.current.y
      lastPosRef.current = pos
    }

    const releaseLetter = () => {
      if (grabbedLetterRef.current) {
        const letter = grabbedLetterRef.current
        letter.grabbed = false
        letter.vx *= 2
        letter.vy *= 2
        letter.rotationSpeed = letter.vx * 0.02
        grabbedLetterRef.current = null
      }
      lastPosRef.current = null
      setIsGrabbing(false)
    }

    const handleMouseDown = (e: MouseEvent) => grabLetter(getPos(e))

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getPos(e)
      const hovered = hitTestLetters(pos)
      setIsHovering(!!hovered)
      for (const letter of lettersRef.current) {
        letter.hovered = letter === hovered
      }
      dragLetter(pos)
    }

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      if (touch) grabLetter(getPos(touch))
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      if (touch) dragLetter(getPos(touch))
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      releaseLetter()
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
    canvas.addEventListener('mouseup', releaseLetter)
    canvas.addEventListener('mouseleave', releaseLetter)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', releaseLetter)
      canvas.removeEventListener('mouseleave', releaseLetter)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      cancelAnimationFrame(animationRef.current)
    }
  }, [canvasRef, update, draw, initLetters, scatter])

  // Delay hint appearance, then sync with isAtRest
  const initialDelayDone = useRef(false)
  useEffect(() => {
    if (!initialDelayDone.current) {
      const timer = setTimeout(() => {
        initialDelayDone.current = true
        setShowHint(isAtRest)
      }, 1200)
      return () => clearTimeout(timer)
    }
    setShowHint(isAtRest)
  }, [isAtRest])

  return { isHovering, isGrabbing, showHint, reset }
}
