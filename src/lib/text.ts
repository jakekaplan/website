export interface LetterLayout {
  char: string
  x: number
  width: number
  weight: 400 | 800
}

export interface NameLayout {
  letters: LetterLayout[]
  fontSize: number
  centerY: number
}

const FIRST_NAME = 'Jake'
const LAST_NAME = 'Kaplan'

/** Measure name layout for given canvas dimensions */
export function measureNameLayout(width: number, height: number): NameLayout {
  const fontSize = Math.min(80, width / 7)
  const letters: LetterLayout[] = []

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return { letters: [], fontSize, centerY: height / 2 }

  // Measure total width
  ctx.font = `800 ${fontSize}px 'Syne', sans-serif`
  const firstNameWidth = ctx.measureText(FIRST_NAME).width
  ctx.font = `400 ${fontSize}px 'Syne', sans-serif`
  const lastNameWidth = ctx.measureText(LAST_NAME).width
  const spaceWidth = ctx.measureText(' ').width

  const totalWidth = firstNameWidth + spaceWidth + lastNameWidth
  let x = (width - totalWidth) / 2

  // First name (bold)
  ctx.font = `800 ${fontSize}px 'Syne', sans-serif`
  for (const char of FIRST_NAME) {
    const charWidth = ctx.measureText(char).width
    letters.push({ char, x: x + charWidth / 2, width: charWidth, weight: 800 })
    x += charWidth
  }

  x += spaceWidth

  // Last name (regular)
  ctx.font = `400 ${fontSize}px 'Syne', sans-serif`
  for (const char of LAST_NAME) {
    const charWidth = ctx.measureText(char).width
    letters.push({ char, x: x + charWidth / 2, width: charWidth, weight: 400 })
    x += charWidth
  }

  return { letters, fontSize, centerY: height / 2 }
}
