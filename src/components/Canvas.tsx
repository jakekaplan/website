import { useRef } from 'react'
import { useCanvasContext } from '@/contexts/CanvasContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useCanvas } from '@/hooks/useCanvas'

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const { lettersVisible } = useCanvasContext()
  const { isHovering, isGrabbing } = useCanvas(canvasRef, theme)

  const cursor = lettersVisible
    ? isGrabbing
      ? 'grabbing'
      : isHovering
        ? 'grab'
        : 'default'
    : 'default'

  return <canvas ref={canvasRef} className="canvas" style={{ cursor }} />
}
