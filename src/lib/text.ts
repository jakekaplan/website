import {
  STACK_THRESHOLD,
  STACKED_FONT_SCALE,
  STACKED_LINE_GAP,
  STACKED_TRACKING,
} from '@/constants'

interface LetterLayout {
  char: string
  x: number
  width: number
  weight: 400 | 800
  centerY?: number
}

export interface NameLayout {
  letters: LetterLayout[]
  fontSize: number
  centerY: number
}

const FIRST_NAME = 'Jake'
const LAST_NAME = 'Kaplan'
const FONT_FAMILY = "'Syne', sans-serif"

interface MeasuredChar {
  char: string
  width: number
}

function measureChars(
  ctx: CanvasRenderingContext2D,
  text: string,
): MeasuredChar[] {
  return text
    .split('')
    .map((char) => ({ char, width: ctx.measureText(char).width }))
}

function totalWidth(chars: MeasuredChar[], tracking = 1): number {
  return chars.reduce(
    (sum, c, i) => sum + c.width * (i < chars.length - 1 ? tracking : 1),
    0,
  )
}

function layoutWord(
  chars: MeasuredChar[],
  startX: number,
  centerY: number | undefined,
  weight: 400 | 800,
  tracking = 1,
): LetterLayout[] {
  const letters: LetterLayout[] = []
  let x = startX
  for (const { char, width } of chars) {
    letters.push({ char, x: x + width / 2, width, weight, centerY })
    x += width * tracking
  }
  return letters
}

export function measureNameLayout(width: number, height: number): NameLayout {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return { letters: [], fontSize: 80, centerY: height / 2 }

  const fontSize = Math.min(80, width / 7)

  ctx.font = `800 ${fontSize}px ${FONT_FAMILY}`
  const firstChars = measureChars(ctx, FIRST_NAME)
  ctx.font = `400 ${fontSize}px ${FONT_FAMILY}`
  const lastChars = measureChars(ctx, LAST_NAME)
  const spaceWidth = ctx.measureText(' ').width

  const horizontalWidth =
    totalWidth(firstChars) + spaceWidth + totalWidth(lastChars)
  const shouldStack = horizontalWidth > width * STACK_THRESHOLD

  if (shouldStack) {
    return measureStackedLayout(
      ctx,
      width,
      height,
      fontSize,
      firstChars,
      lastChars,
    )
  }
  return measureHorizontalLayout(
    width,
    height,
    fontSize,
    firstChars,
    lastChars,
    spaceWidth,
  )
}

function measureHorizontalLayout(
  width: number,
  height: number,
  fontSize: number,
  firstChars: MeasuredChar[],
  lastChars: MeasuredChar[],
  spaceWidth: number,
): NameLayout {
  const total = totalWidth(firstChars) + spaceWidth + totalWidth(lastChars)
  const startX = (width - total) / 2

  const letters = [
    ...layoutWord(firstChars, startX, undefined, 800),
    ...layoutWord(
      lastChars,
      startX + totalWidth(firstChars) + spaceWidth,
      undefined,
      400,
    ),
  ]

  return { letters, fontSize, centerY: height / 2 }
}

function measureStackedLayout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseFontSize: number,
  _firstChars: MeasuredChar[],
  _lastChars: MeasuredChar[],
): NameLayout {
  // Re-measure at larger font size
  const fontSize = Math.min(baseFontSize * STACKED_FONT_SCALE, width / 4.5)
  ctx.font = `800 ${fontSize}px ${FONT_FAMILY}`
  const firstChars = measureChars(ctx, FIRST_NAME)
  ctx.font = `400 ${fontSize}px ${FONT_FAMILY}`
  const lastChars = measureChars(ctx, LAST_NAME)

  const lineGap = fontSize * STACKED_LINE_GAP
  const topY = height / 2 - fontSize / 2 - lineGap / 2
  const bottomY = height / 2 + fontSize / 2 + lineGap / 2

  const firstWidth = totalWidth(firstChars, STACKED_TRACKING)
  const lastWidth = totalWidth(lastChars, STACKED_TRACKING)

  const letters = [
    ...layoutWord(
      firstChars,
      (width - firstWidth) / 2,
      topY,
      800,
      STACKED_TRACKING,
    ),
    ...layoutWord(
      lastChars,
      (width - lastWidth) / 2,
      bottomY,
      400,
      STACKED_TRACKING,
    ),
  ]

  return { letters, fontSize, centerY: height / 2 }
}
