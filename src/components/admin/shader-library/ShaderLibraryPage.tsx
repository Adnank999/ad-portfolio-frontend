import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/admin/ui/button'
import { PageLoading } from '@/components/feedback/PageFeedback'
import type { ShaderManifest } from '@/components/shaders/types'
import { shaderCatalogOptions } from '@/queries/services/shaders'
import { shaderCatalogFn } from '@/server/shaders'
import { ShaderLibrary } from './ShaderLibrary'

export function ShaderLibraryPage({ loadCatalog = shaderCatalogFn }: { loadCatalog?: () => Promise<ShaderManifest> }) {
  const catalog = useQuery({ ...shaderCatalogOptions(), queryFn: () => loadCatalog() })

  return <div className="space-y-7">
    <header>
      <p className="mb-3 text-[10px] uppercase tracking-[.2em] text-accent-300"><span className="accent-text">Visual library</span></p>
      <h1 className="text-5xl leading-none sm:text-6xl">Shaders.</h1>
      <p className="mt-4 text-xs leading-6 text-zinc-400">Manage shader activation here. Choose effects and edit their props separately in each service’s section visuals.</p>
    </header>
    {catalog.isPending && <PageLoading size="panel" message="Loading shader catalog…" />}
    {catalog.isError && <div role="alert" className="space-y-3 rounded-xl border border-red-400/20 bg-red-400/10 p-5 text-xs leading-6 text-red-200">
      <p>Could not load the shader catalog. {catalog.error.message}</p>
      <p>Activation stays disabled until the backend catalog can be verified.</p>
      <Button type="button" variant="secondary" disabled={catalog.isFetching} onClick={() => void catalog.refetch()}>{catalog.isFetching ? 'Retrying…' : 'Retry shader catalog'}</Button>
    </div>}
    {catalog.data && <ShaderLibrary catalog={catalog.data} disabled={catalog.isError || catalog.isFetching} />}
  </div>
}
