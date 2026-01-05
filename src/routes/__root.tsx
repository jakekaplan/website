import { createRootRoute, Outlet } from '@tanstack/react-router'
import '../index.css'

export const Route = createRootRoute({
  component: () => (
    <div className="app">
      <main className="main">
        <Outlet />
      </main>
    </div>
  ),
})
