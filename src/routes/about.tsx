import { createFileRoute } from '@tanstack/react-router'

function AboutPage() {
  return (
    <div className="about-box">
      <h1>About Me</h1>
      <p>
        Hi, I'm Jake 👋. I'm a software engineer who primarily works on backend
        and distributed systems. I'm currently working at{' '}
        <a
          href="https://www.prefect.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          Prefect
        </a>{' '}
        building Prefect Cloud and Horizon.
      </p>
    </div>
  )
}

export const Route = createFileRoute('/about')({
  component: AboutPage,
})
