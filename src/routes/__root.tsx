import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Canvas } from '@/components/Canvas'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { CanvasProvider } from '@/contexts/CanvasContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import '@/index.css'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <CanvasProvider>
        <ErrorBoundary>
          <div className="app">
            <Canvas />
            <Header />
            <main className="main">
              <Outlet />
            </main>
            <Footer />
          </div>
        </ErrorBoundary>
      </CanvasProvider>
    </ThemeProvider>
  ),
})
