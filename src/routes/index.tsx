import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useCanvasContext } from '@/contexts/CanvasContext'

function HomePage() {
  const { showLetters, hideLetters, isAtRest } = useCanvasContext()
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    showLetters()
    return () => hideLetters()
  }, [showLetters, hideLetters])

  useEffect(() => {
    if (!isAtRest) {
      setShowHint(false)
      return
    }
    const timer = setTimeout(() => setShowHint(true), 1200)
    return () => clearTimeout(timer)
  }, [isAtRest])

  return (
    <p className={`hint-centered ${showHint ? 'visible' : ''}`}>
      Fling letters or press space
    </p>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage,
})
