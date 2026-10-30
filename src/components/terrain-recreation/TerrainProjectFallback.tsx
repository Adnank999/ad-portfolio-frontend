import { Link } from '@tanstack/react-router'
import type { Project } from '../../data/projects'
import { PageLoading } from '../feedback/PageFeedback'

export function TerrainLoadingScreen() {
  return <PageLoading className="terrain-loading" message="Please wait for an immersive experience" />
}

export function TerrainProjectFallback({ project, projects = [] }: { project?: Project; projects?: Project[] }) {
  if (!project) return <main className="terrain-fallback">
    <p>SELECTED WORK</p>
    <h1>Projects built to solve real problems.</h1>
    {!projects.length && <p role="status">No projects have been published yet.</p>}
    <div className="terrain-fallback-grid">
      {projects.map(item => <Link key={item.slug} to="/projects/$slug" params={{ slug: item.slug }} viewTransition={false}>
        <h2>{item.title}</h2><p>{item.description}</p>
      </Link>)}
    </div>
  </main>

  return <main className="terrain-fallback">
    <p>{project.category} / {project.year}</p>
    <h1>{project.title}</h1>
    <p>{project.description}</p>
    <img src={project.featuredImageUrl || project.image} alt={project.featuredImageAlt || project.imageAlt || `${project.title} project preview`} width={1600} height={900} />
    <p>{project.technologies.join(' · ')}</p>
    {[
      ['Overview', project.overview], ['The problem', project.problem], ['The solution', project.solution],
      ['Technical implementation', project.technical], ['Challenges', project.challenges], ['Results', project.results],
    ].map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}
    <section><h2>Key features</h2><ul>{project.features.map(feature => <li key={feature}>{feature}</li>)}</ul></section>
    <nav aria-label="Project links">
      {[
        ['Live project', project.liveUrl], ['Source code', project.githubUrl],
      ].filter(([, href]) => /^(https?:\/\/|\/(?!\/))/.test(href)).map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label}</a>)}
    </nav>
  </main>
}
