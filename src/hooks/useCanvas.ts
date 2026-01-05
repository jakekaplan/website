import { useEffect, useRef, useState } from 'react'
import {
  ENTRY_STAGGER,
  ENTRY_Y_OFFSET,
  GRAB_IMPULSE_X,
  GRAB_IMPULSE_Y,
  GRAB_LIFT,
  GRAB_ROTATION,
  GROUND_OFFSET,
  THEME,
} from '@/constants'
import { useCanvasContext } from '@/contexts/CanvasContext'
import {
  createCollisionParticles,
  createDustParticles,
  updateAllDust,
  updateCollisionParticles,
} from '@/lib/particles'
import {
  findLetterCollisions,
  hitTestLetter,
  updateAllLetterEntries,
  updateAllLetters,
} from '@/lib/physics'
import {
  drawBackground,
  drawBrushStroke,
  drawCollisionParticles,
  drawDustParticles,
  drawGround,
  drawLetters,
} from '@/lib/render'
import { measureNameLayout, type NameLayout } from '@/lib/text'
import type { CollisionParticle, DustParticle, Letter, Point } from '@/types'

type FadeState = 'hidden' | 'entering' | 'visible' | 'exiting'

const FADE_SPEED = 0.04

export function useCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  theme: 'light' | 'dark',
) {
  const colors = THEME[theme]
  const { lettersVisible, resetKey, setIsAtRest } = useCanvasContext()

  // UI state for cursor
  const [isHovering, setIsHovering] = useState(false)
  const [isGrabbing, setIsGrabbing] = useState(false)

  // Animation state refs (persistent across renders)
  const dustRef = useRef<DustParticle[]>([])
  const lettersRef = useRef<Letter[]>([])
  const collisionParticlesRef = useRef<CollisionParticle[]>([])
  const brushStrokeRef = useRef<HTMLImageElement | null>(null)
  const brushStrokeOpacity = useRef(0)
  const letterOpacity = useRef(0)
  const entryStartRef = useRef(0)
  const timeRef = useRef(0)
  const sizeRef = useRef({ width: 0, height: 0 })
  const layoutRef = useRef<NameLayout | null>(null)
  const animationRef = useRef(0)
  const wasActiveRef = useRef(false)
  const fadeStateRef = useRef<FadeState>('hidden')

  // Interaction refs (stable across renders)
  const grabbedRef = useRef<Letter | null>(null)
  const offsetRef = useRef<Point>({ x: 0, y: 0 })
  const lastPosRef = useRef<Point | null>(null)

  // Handler refs (stable references for event listeners)
  const grabRef = useRef<(pos: Point) => void>(() => {})
  const dragRef = useRef<(pos: Point) => void>(() => {})
  const releaseRef = useRef<() => void>(() => {})
  const scatterRef = useRef<() => void>(() => {})
  const updateHoverRef = useRef<(pos: Point) => void>(() => {})
  const colorsRef = useRef(colors)
  colorsRef.current = colors

  // Load brush stroke on theme change
  useEffect(() => {
    const img = new Image()
    img.src = colors.brushStroke
    img.onload = () => {
      brushStrokeRef.current = img
    }
  }, [colors.brushStroke])

  // Reset everything when resetKey changes
  useEffect(() => {
    if (resetKey === 0) return
    const { width, height } = sizeRef.current
    if (width > 0) {
      // Reset letters to home positions
      for (const letter of lettersRef.current) {
        letter.x = letter.homeX
        letter.y = letter.homeY
        letter.vx = 0
        letter.vy = 0
        letter.rotation = 0
        letter.rotationSpeed = 0
        letter.active = false
        letter.grabbed = false
        letter.restlessness = 0
      }
      collisionParticlesRef.current = []
      dustRef.current = createDustParticles(width, height)
    }
  }, [resetKey])

  // Handle visibility changes with state machine
  useEffect(() => {
    const state = fadeStateRef.current
    if (lettersVisible && (state === 'hidden' || state === 'exiting')) {
      // Start entering
      const { width, height } = sizeRef.current
      if (width === 0) return

      document.fonts.load("800 48px 'Syne'").then(() => {
        const layout = measureNameLayout(width, height)
        layoutRef.current = layout
        lettersRef.current = layout.letters.map((l, i) => ({
          char: l.char,
          x: l.x,
          y: layout.centerY + ENTRY_Y_OFFSET,
          homeX: l.x,
          homeY: layout.centerY,
          vx: 0,
          vy: 0,
          rotation: 0,
          rotationSpeed: 0,
          width: l.width,
          height: layout.fontSize,
          active: false,
          grabbed: false,
          restlessness: 0,
          hovered: false,
          scale: 1,
          opacity: 0,
          entered: false,
          entryDelay: i * ENTRY_STAGGER,
          weight: l.weight,
        }))
        entryStartRef.current = performance.now()
        brushStrokeOpacity.current = 0
        letterOpacity.current = 0
        collisionParticlesRef.current = []
        fadeStateRef.current = 'entering'
      })
    } else if (
      !lettersVisible &&
      (state === 'visible' || state === 'entering')
    ) {
      fadeStateRef.current = 'exiting'
    }
  }, [lettersVisible])

  // Stable interaction handlers - update refs for use in event listeners
  const hitTest = (pos: Point): Letter | null => {
    for (let i = lettersRef.current.length - 1; i >= 0; i--) {
      const letter = lettersRef.current[i]
      if (letter && hitTestLetter(pos, letter)) return letter
    }
    return null
  }

  const canInteract = () => fadeStateRef.current === 'visible'

  // Update handler refs on each render (these are called by stable event listeners)
  grabRef.current = (pos: Point) => {
    if (!canInteract()) return
    const letter = hitTest(pos)
    if (!letter) return

    setIsAtRest(false)
    grabbedRef.current = letter
    letter.grabbed = true
    letter.active = true
    letter.vx = (Math.random() - 0.5) * GRAB_IMPULSE_X
    letter.vy = GRAB_IMPULSE_Y
    letter.rotation += (Math.random() - 0.5) * GRAB_ROTATION
    letter.restlessness = 0
    offsetRef.current = {
      x: letter.x - pos.x,
      y: letter.y - pos.y - GRAB_LIFT,
    }
    lastPosRef.current = pos
    setIsGrabbing(true)
  }

  dragRef.current = (pos: Point) => {
    const letter = grabbedRef.current
    if (!letter) return
    if (lastPosRef.current) {
      letter.vx = (pos.x - lastPosRef.current.x) * 0.5
      letter.vy = (pos.y - lastPosRef.current.y) * 0.5
    }
    letter.x = pos.x + offsetRef.current.x
    letter.y = pos.y + offsetRef.current.y
    lastPosRef.current = pos
  }

  releaseRef.current = () => {
    const letter = grabbedRef.current
    if (letter) {
      letter.grabbed = false
      letter.vx *= 2
      letter.vy *= 2
      letter.rotationSpeed = letter.vx * 0.02
      grabbedRef.current = null
    }
    lastPosRef.current = null
    setIsGrabbing(false)
  }

  scatterRef.current = () => {
    if (!canInteract()) return
    setIsAtRest(false)
    for (const letter of lettersRef.current) {
      letter.active = true
      letter.restlessness = 0
      letter.vx = (Math.random() - 0.5) * 25
      letter.vy = -Math.random() * 20 - 10
      letter.rotationSpeed = (Math.random() - 0.5) * 0.3
    }
  }

  updateHoverRef.current = (pos: Point) => {
    if (!canInteract()) {
      setIsHovering(false)
      return
    }
    const hovered = hitTest(pos)
    setIsHovering(!!hovered)
    for (const letter of lettersRef.current) {
      letter.hovered = letter === hovered
    }
  }

  // Main animation loop - set up once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const oldSize = sizeRef.current
      sizeRef.current = { width: w, height: h }

      // Scale dust positions proportionally
      if (oldSize.width > 0) {
        const scaleX = w / oldSize.width
        const scaleY = h / oldSize.height
        for (const d of dustRef.current) {
          d.x *= scaleX
          d.y *= scaleY
        }
      }

      // Reposition letters using cached layout ratios
      if (lettersRef.current.length > 0 && layoutRef.current) {
        const newLayout = measureNameLayout(w, h)
        layoutRef.current = newLayout
        for (let i = 0; i < lettersRef.current.length; i++) {
          const letter = lettersRef.current[i]
          const l = newLayout.letters[i]
          if (!letter || !l) continue
          letter.homeX = l.x
          letter.homeY = newLayout.centerY
          letter.width = l.width
          letter.height = newLayout.fontSize
          if (!letter.active && letter.entered) {
            letter.x = l.x
            letter.y = newLayout.centerY
          }
        }
      }

      return { width: w, height: h }
    }

    const { width, height } = resize()

    // Initialize dust once
    if (dustRef.current.length === 0) {
      dustRef.current = createDustParticles(width, height)
    }

    // Event handlers - call through refs for latest handlers
    const getPos = (e: MouseEvent | Touch): Point => ({
      x: e.clientX,
      y: e.clientY,
    })

    const onMouseDown = (e: MouseEvent) => grabRef.current(getPos(e))
    const onMouseMove = (e: MouseEvent) => {
      updateHoverRef.current(getPos(e))
      dragRef.current(getPos(e))
    }
    const onMouseUp = () => releaseRef.current()
    const onMouseLeave = () => releaseRef.current()
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      if (touch) grabRef.current(getPos(touch))
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      if (touch) dragRef.current(getPos(touch))
    }
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      releaseRef.current()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        scatterRef.current()
      }
    }

    const updateFadeState = () => {
      const fadeState = fadeStateRef.current
      if (fadeState === 'entering') {
        letterOpacity.current = Math.min(1, letterOpacity.current + FADE_SPEED)
        if (letterOpacity.current >= 1) fadeStateRef.current = 'visible'
      } else if (fadeState === 'exiting') {
        letterOpacity.current = Math.max(0, letterOpacity.current - FADE_SPEED)
        if (letterOpacity.current <= 0) {
          fadeStateRef.current = 'hidden'
          lettersRef.current = []
          collisionParticlesRef.current = []
          layoutRef.current = null
        }
      }
    }

    const updateBrushStroke = (elapsed: number) => {
      const fadeState = fadeStateRef.current
      if (fadeState === 'entering' || fadeState === 'visible') {
        brushStrokeOpacity.current = Math.min(1, elapsed / 500)
      } else if (fadeState === 'exiting') {
        brushStrokeOpacity.current = Math.max(
          0,
          brushStrokeOpacity.current - FADE_SPEED,
        )
      }
    }

    const spawnParticles = (
      collisions: { x: number; y: number; intensity: number }[],
    ) => {
      for (const c of collisions) {
        collisionParticlesRef.current.push(
          ...createCollisionParticles(c.x, c.y, c.intensity),
        )
      }
    }

    const update = () => {
      const { width: w, height: h } = sizeRef.current
      timeRef.current += 0.016

      // Update dust (always runs)
      const letters =
        fadeStateRef.current !== 'hidden' ? lettersRef.current : null
      updateAllDust(dustRef.current, letters, timeRef.current, w, h)

      // Handle fade transitions
      updateFadeState()
      if (lettersRef.current.length === 0) return

      // Update brush stroke and letters
      const elapsed = performance.now() - entryStartRef.current
      updateBrushStroke(elapsed)
      updateAllLetterEntries(lettersRef.current, elapsed)

      // Collisions and physics
      const letterCollisions = findLetterCollisions(lettersRef.current)
      spawnParticles(
        letterCollisions.map((c) => ({
          x: c.impactX,
          y: c.impactY,
          intensity: c.impactSpeed,
        })),
      )

      const groundY = h - GROUND_OFFSET
      const { anyActive, groundImpacts } = updateAllLetters(
        lettersRef.current,
        groundY,
        w,
      )
      spawnParticles(groundImpacts)

      // Update rest state (only when changed)
      if (anyActive !== wasActiveRef.current) {
        wasActiveRef.current = anyActive
        setIsAtRest(!anyActive)
      }

      // Update collision particles
      collisionParticlesRef.current = updateCollisionParticles(
        collisionParticlesRef.current,
      )
    }

    const draw = () => {
      const { width: w, height: h } = sizeRef.current
      const currentColors = colorsRef.current
      drawBackground(ctx, w, h, currentColors)
      drawDustParticles(ctx, dustRef.current, currentColors)

      if (lettersRef.current.length > 0 && letterOpacity.current > 0) {
        ctx.globalAlpha = letterOpacity.current
        if (brushStrokeRef.current) {
          drawBrushStroke(
            ctx,
            brushStrokeRef.current,
            brushStrokeOpacity.current,
            lettersRef.current,
          )
        }
        drawCollisionParticles(
          ctx,
          collisionParticlesRef.current,
          currentColors,
        )
        drawGround(ctx, w, h, currentColors)
        drawLetters(ctx, lettersRef.current, w, currentColors)
        ctx.globalAlpha = 1
      }
    }

    const animate = () => {
      update()
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }

    // Attach event listeners once
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', onKeyDown)
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      cancelAnimationFrame(animationRef.current)
    }
  }, [canvasRef, setIsAtRest])

  return { isHovering, isGrabbing }
}
