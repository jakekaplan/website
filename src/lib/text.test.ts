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
    // Use wide enough widths to avoid triggering stacked layout
    const mediumLayout = measureNameLayout(560, 600) // 560/7 = 80, at threshold
    expect(mediumLayout.fontSize).toBe(80)

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

  describe('stacked layout (narrow viewport)', () => {
    // With mock widths: Jake=143, space=20, Kaplan=225, total=388
    // At width 400, fontSize=57, totalWidth would exceed 85% threshold
    const narrowWidth = 300

    it('triggers stacked layout when horizontal width exceeds threshold', () => {
      const layout = measureNameLayout(narrowWidth, 600)

      // In stacked layout, letters have per-letter centerY values
      const firstNameLetters = layout.letters.slice(0, 4)
      const lastNameLetters = layout.letters.slice(4)

      // All first name letters should share the same centerY (top row)
      const topY = firstNameLetters[0]?.centerY
      expect(topY).toBeDefined()
      for (const letter of firstNameLetters) {
        expect(letter.centerY).toBe(topY)
      }

      // All last name letters should share the same centerY (bottom row)
      const bottomY = lastNameLetters[0]?.centerY
      expect(bottomY).toBeDefined()
      for (const letter of lastNameLetters) {
        expect(letter.centerY).toBe(bottomY)
      }

      // Top row should be above bottom row
      expect(topY).toBeLessThan(bottomY!)
    })

    it('uses larger font size in stacked layout', () => {
      const horizontalLayout = measureNameLayout(800, 600)
      const stackedLayout = measureNameLayout(narrowWidth, 600)

      // Stacked layout should have larger font (scaled by STACKED_FONT_SCALE)
      expect(stackedLayout.fontSize).toBeGreaterThan(
        horizontalLayout.fontSize * 0.5,
      )
    })

    it('centers each row independently', () => {
      const layout = measureNameLayout(narrowWidth, 600)

      const firstNameLetters = layout.letters.slice(0, 4)
      const lastNameLetters = layout.letters.slice(4)

      // Calculate center of first name row
      const firstLeft = firstNameLetters[0]!.x - firstNameLetters[0]!.width / 2
      const firstRight = firstNameLetters[3]!.x + firstNameLetters[3]!.width / 2
      const firstCenter = (firstLeft + firstRight) / 2

      // Calculate center of last name row
      const lastLeft = lastNameLetters[0]!.x - lastNameLetters[0]!.width / 2
      const lastRight = lastNameLetters[5]!.x + lastNameLetters[5]!.width / 2
      const lastCenter = (lastLeft + lastRight) / 2

      // Both rows should be centered around viewport center
      expect(firstCenter).toBeCloseTo(narrowWidth / 2, -1)
      expect(lastCenter).toBeCloseTo(narrowWidth / 2, -1)
    })

    it('applies tighter tracking in stacked layout', () => {
      const layout = measureNameLayout(narrowWidth, 600)
      const firstNameLetters = layout.letters.slice(0, 4)

      // With tracking < 1 (0.85), letters should overlap slightly
      // Check that each letter's right edge exceeds the next letter's left edge
      for (let i = 0; i < firstNameLetters.length - 1; i++) {
        const curr = firstNameLetters[i]!
        const next = firstNameLetters[i + 1]!

        const currRightEdge = curr.x + curr.width / 2
        const nextLeftEdge = next.x - next.width / 2

        // With tight tracking, letters should overlap
        expect(currRightEdge).toBeGreaterThan(nextLeftEdge)
      }
    })

    it('does not use stacked layout on wide viewports', () => {
      const layout = measureNameLayout(800, 600)

      // In horizontal layout, letters should not have individual centerY
      for (const letter of layout.letters) {
        expect(letter.centerY).toBeUndefined()
      }
    })
  })
})
