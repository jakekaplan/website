import { hexToRgba } from '@/constants'

describe('hexToRgba', () => {
  it('converts hex to rgba with alpha', () => {
    expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)')
    expect(hexToRgba('#000000', 1)).toBe('rgba(0, 0, 0, 1)')
    expect(hexToRgba('#ffffff', 0)).toBe('rgba(255, 255, 255, 0)')
  })

  it('handles theme colors correctly', () => {
    // Light theme ink color
    expect(hexToRgba('#1c1917', 0.2)).toBe('rgba(28, 25, 23, 0.2)')
    // Dark theme ink color
    expect(hexToRgba('#f8fafc', 0.15)).toBe('rgba(248, 250, 252, 0.15)')
  })
})
