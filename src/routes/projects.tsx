import { createFileRoute, Link } from '@tanstack/react-router'

function ProjectsPage() {
  return (
    <div className="page">
      <nav className="page-nav">
        <Link to="/">← back</Link>
      </nav>
      <main className="page-content">
        <h1>projects</h1>
        <p>Coming soon.</p>
      </main>
    </div>
  )
}

export const Route = createFileRoute('/projects')({
  component: ProjectsPage,
})
