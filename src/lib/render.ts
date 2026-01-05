import {
  BG_COLOR,
  GROUND_COLOR,
  GROUND_OFFSET,
  INK_COLOR,
  INK_GRABBED,
  INK_RGB,
} from '@/constants'
import type { CollisionParticle, DustParticle, Letter } from '@/types'

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, width, height)
}

export function drawBrushStroke(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  opacity: number,
  letters: Letter[],
): void {
  if (opacity <= 0 || letters.length === 0) return

  const first = letters[0]
  const last = letters[letters.length - 1]
  if (!first || !last) return

  const centerX = (first.homeX + last.homeX) / 2
  const centerY = first.homeY
  const textWidth =
    last.homeX + last.width / 2 - (first.homeX - first.width / 2)
  const scale = (textWidth * 1.5) / img.width
  const drawWidth = img.width * scale
  const drawHeight = img.height * scale

  ctx.globalAlpha = opacity
  ctx.drawImage(
    img,
    centerX - drawWidth / 2,
    centerY - drawHeight / 2,
    drawWidth,
    drawHeight,
  )
  ctx.globalAlpha = 1
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  dust: DustParticle[],
  collision: CollisionParticle[],
): void {
  for (const d of dust) {
    ctx.beginPath()
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${INK_RGB}, ${d.opacity})`
    ctx.fill()
  }

  for (const p of collision) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${INK_RGB}, ${p.opacity})`
    ctx.fill()
  }
}

export function drawGround(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const groundY = height - GROUND_OFFSET
  ctx.strokeStyle = GROUND_COLOR
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  ctx.lineTo(width, groundY)
  ctx.stroke()
}

export function drawLetters(
  ctx: CanvasRenderingContext2D,
  letters: Letter[],
  width: number,
): void {
  const fontSize = Math.min(80, width / 7)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const letter of letters) {
    ctx.font = `${letter.weight} ${fontSize}px 'Syne', sans-serif`
    ctx.save()
    ctx.translate(letter.x, letter.y)
    ctx.rotate(letter.rotation)
    ctx.scale(letter.scale, letter.scale)
    ctx.globalAlpha = letter.opacity

    if (letter.hovered || letter.active || letter.grabbed) {
      const shadowIntensity = letter.hovered ? 0.2 : 0.15
      const shadowBlur = letter.hovered ? 16 : 12
      const shadowY = letter.hovered ? 6 : 4
      ctx.shadowColor = `rgba(${INK_RGB}, ${shadowIntensity * letter.opacity})`
      ctx.shadowBlur = shadowBlur
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = shadowY
    }

    ctx.fillStyle = letter.grabbed ? INK_GRABBED : INK_COLOR
    ctx.fillText(letter.char, 0, 0)
    ctx.restore()
  }
}
