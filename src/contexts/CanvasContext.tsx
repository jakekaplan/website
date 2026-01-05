import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'

interface CanvasContextValue {
  lettersVisible: boolean
  isAtRest: boolean
  resetKey: number
  showLetters: () => void
  hideLetters: () => void
  resetLetters: () => void
  setIsAtRest: (value: boolean) => void
}

const CanvasContext = createContext<CanvasContextValue | null>(null)

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [lettersVisible, setLettersVisible] = useState(false)
  const [isAtRest, setIsAtRest] = useState(true)
  const [resetKey, setResetKey] = useState(0)

  const showLetters = useCallback(() => setLettersVisible(true), [])
  const hideLetters = useCallback(() => setLettersVisible(false), [])
  const resetLetters = useCallback(() => {
    setResetKey((k) => k + 1)
    setIsAtRest(true)
  }, [])

  return (
    <CanvasContext.Provider
      value={{
        lettersVisible,
        isAtRest,
        resetKey,
        showLetters,
        hideLetters,
        resetLetters,
        setIsAtRest,
      }}
    >
      {children}
    </CanvasContext.Provider>
  )
}

export function useCanvasContext(): CanvasContextValue {
  const context = useContext(CanvasContext)
  if (!context) {
    throw new Error('useCanvasContext must be used within CanvasProvider')
  }
  return context
}
