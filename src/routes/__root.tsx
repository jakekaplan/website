import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/contexts/ThemeContext'
import '@/index.css'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="app">
          <main className="main">
            <Outlet />
          </main>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  ),
})
