import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import '@/index.css'

export const Route = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <div className="app">
        <main className="main">
          <Outlet />
        </main>
      </div>
    </ErrorBoundary>
  ),
})
