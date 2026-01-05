import { createFileRoute, Link } from '@tanstack/react-router'

function AboutPage() {
  return (
    <div className="page">
      <nav className="page-nav">
        <Link to="/">← back</Link>
      </nav>
      <main className="page-content">
        <h1>about</h1>
        <p>Coming soon.</p>
      </main>
    </div>
  )
}

export const Route = createFileRoute('/about')({
  component: AboutPage,
})
