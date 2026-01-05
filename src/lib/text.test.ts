/**
 * @vitest-environment jsdom
 */
import { measureNameLayout } from './text'

// Mock canvas context for consistent text measurements
const mockMeasureText = (char: string) => {
  // Simulate proportional character widths
  const widths: Record<string, number> = {
    J: 30,
    a: 40,
    k: 35,
    e: 38,
    K: 45,
    p: 40,
    l: 20,
    n: 40,
    ' ': 20,
  }
  return { width: widths[char] ?? 40 }
}

const originalCreateElement = document.createElement.bind(document)

beforeEach(() => {
  document.createElement = ((tagName: string) => {
    if (tagName === 'canvas') {
      return {
        getContext: () => ({
          font: '',
          measureText: (text: string) => {
            // Sum widths for multi-char strings
            let total = 0
            for (const char of text) {
              total += mockMeasureText(char).width
            }
            return { width: total }
          },
        }),
      } as unknown as HTMLCanvasElement
    }
    return originalCreateElement(tagName)
  }) as typeof document.createElement
})

afterEach(() => {
  document.createElement = originalCreateElement
})

describe('measureNameLayout', () => {
  it('returns correct number of letters for "Jake Kaplan"', () => {
    const layout = measureNameLayout(800, 600)
    expect(layout.letters).toHaveLength(10) // "JakeKaplan" without space
  })

  it('calculates fontSize based on width', () => {
    // fontSize = Math.min(80, width / 7)
    const narrowLayout = measureNameLayout(350, 600) // 350/7 = 50
    expect(narrowLayout.fontSize).toBe(50)

    const wideLayout = measureNameLayout(1000, 600) // 1000/7 = 142, capped at 80
    expect(wideLayout.fontSize).toBe(80)
  })

  it('centers vertically', () => {
    const layout = measureNameLayout(800, 600)
    expect(layout.centerY).toBe(300)

    const tallLayout = measureNameLayout(800, 1000)
    expect(tallLayout.centerY).toBe(500)
  })

  it('assigns correct weights to first and last name', () => {
    const layout = measureNameLayout(800, 600)

    // First 4 letters (Jake) should be bold (800)
    for (let i = 0; i < 4; i++) {
      expect(layout.letters[i]?.weight).toBe(800)
    }

    // Last 6 letters (Kaplan) should be regular (400)
    for (let i = 4; i < 10; i++) {
      expect(layout.letters[i]?.weight).toBe(400)
    }
  })

  it('preserves correct character sequence', () => {
    const layout = measureNameLayout(800, 600)
    const chars = layout.letters.map((l) => l.char).join('')
    expect(chars).toBe('JakeKaplan')
  })

  it('positions letters left to right with increasing x', () => {
    const layout = measureNameLayout(800, 600)

    for (let i = 1; i < layout.letters.length; i++) {
      const prev = layout.letters[i - 1]
      const curr = layout.letters[i]
      if (prev && curr) {
        expect(curr.x).toBeGreaterThan(prev.x)
      }
    }
  })

  it('centers the name horizontally', () => {
    const layout = measureNameLayout(800, 600)
    const firstLetter = layout.letters[0]
    const lastLetter = layout.letters[layout.letters.length - 1]

    if (firstLetter && lastLetter) {
      // The name should be roughly centered
      const leftEdge = firstLetter.x - firstLetter.width / 2
      const rightEdge = lastLetter.x + lastLetter.width / 2
      const center = (leftEdge + rightEdge) / 2

      // Center should be close to canvas center (400)
      expect(center).toBeCloseTo(400, -1) // Within 10px
    }
  })

  it('assigns positive widths to all letters', () => {
    const layout = measureNameLayout(800, 600)

    for (const letter of layout.letters) {
      expect(letter.width).toBeGreaterThan(0)
    }
  })
})
