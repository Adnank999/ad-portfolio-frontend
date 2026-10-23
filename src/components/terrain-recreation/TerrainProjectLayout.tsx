import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ClientOnly, Link, Outlet, useMatches, useNavigate } from '@tanstack/react-router'
import { getProject } from '../../data/projects'
import { terrainProjectFromPath } from './project-data'
import { TerrainLoadingScreen } from './TerrainProjectFallback'
import './terrain.css'

const TerrainExperience = lazy(() => import('./TerrainExperience'))

export function TerrainProjectLayout() {
  const pathname = useMatches({ select: matches => matches.at(-1)?.pathname ?? '/' })
  const navigate = useNavigate()
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])
  const project = terrainProjectFromPath(pathname, import.meta.env.BASE_URL)
  const overview = pathname.replace(/\/$/, '') === `${import.meta.env.BASE_URL}projects`.replace(/\/$/, '')
  const validRoute = overview || Boolean(project && getProject(project.id))
  const inProjectRoute = overview || pathname.startsWith(`${import.meta.env.BASE_URL}projects/`)
  const onNavigate = useCallback((slug: string | null) => {
    if (slug) void navigate({ to: '/projects/$slug', params: { slug }, viewTransition: false })
    else void navigate({ to: '/projects', viewTransition: false })
  }, [navigate])

  if (!inProjectRoute) return null

  return <div className="terrain-route" data-terrain-state={validRoute ? state : 'error'}>
    {validRoute && <ClientOnly>
      <Suspense fallback={null}>
        <TerrainExperience projectSlug={project?.id ?? null} onNavigate={onNavigate} onStateChange={setState} />
      </Suspense>
    </ClientOnly>}
    {validRoute && state === 'loading' && <TerrainLoadingScreen />}
    <noscript><style>{`.terrain-loading{display:none!important}.terrain-route[data-terrain-state="loading"] .terrain-static-content{position:relative;opacity:1;pointer-events:auto;height:auto;overflow:visible}`}</style></noscript>
    <div className="terrain-static-content" hidden={validRoute && state === 'ready'} inert={hydrated && validRoute && state === 'loading'}>
      <Link to={overview ? '/' : '/projects'} className="terrain-fallback-home" aria-label={overview ? 'Back to home' : 'Back to projects'} viewTransition={false}>Back</Link>
      {state === 'error' && <p role="status" className="terrain-fallback-notice">The 3D view is unavailable in this browser. You can still explore every project below.</p>}
      <Outlet />
    </div>
  </div>
}
