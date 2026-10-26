import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/admin/ui/button'
import { allShaderDefinitions, backendHasShader, backendSupportsShader } from '@/components/shaders/registry'
import type { ShaderManifest } from '@/components/shaders/types'
import { shaderCatalogOptions } from '@/queries/services/shaders'
import { setShaderActivationFn, type ShaderActivationInput } from '@/server/shaders'

export function ShaderLibrary({ catalog, disabled, activate = setShaderActivationFn }: { catalog?: ShaderManifest; disabled: boolean; activate?: (input: { data: ShaderActivationInput }) => Promise<ShaderManifest> }) {
  const queryClient = useQueryClient()
  const activation = useMutation({
    mutationFn: activate,
    onMutate: async () => { await queryClient.cancelQueries({ queryKey: shaderCatalogOptions().queryKey }) },
    onSuccess: data => { queryClient.setQueryData(shaderCatalogOptions().queryKey, data) },
    onSettled: () => { void queryClient.invalidateQueries({ queryKey: shaderCatalogOptions().queryKey }) },
  })
  return <section aria-labelledby="shader-library-heading" className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
    <h2 id="shader-library-heading" className="text-lg text-white">Shader availability</h2>
    <div className="mt-3 space-y-4">
      <p className="text-xs leading-6 text-zinc-400">Activate a configured shader to make it selectable across services. Changes save immediately without opening or saving a service. Deactivation hides it from new selections; existing service visuals keep working.</p>
      <Button type="button" variant="secondary" className="min-h-11" disabled={disabled || activation.isPending} onClick={() => { void queryClient.invalidateQueries({ queryKey: shaderCatalogOptions().queryKey }) }}>Refresh shader catalog</Button>
      {!catalog && <p role="status" className="text-xs text-zinc-400">Waiting for the backend shader catalog. Use Retry catalog if loading fails.</p>}
      {catalog && !catalog.canManage && <p className="text-xs text-amber-300">Shader activation requires service publishing permission and the updated backend.</p>}
      <ul className="divide-y divide-white/10">{Object.values(allShaderDefinitions).map(definition => {
        const configured = backendHasShader(catalog, definition.id)
        const active = backendSupportsShader(catalog, definition.id)
        const entry = catalog?.shaders.find(entry => entry.id === definition.id)
        const status = configured ? active ? 'Active' : 'Draft' : 'Needs setup'
        return <li key={definition.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="min-w-0 space-y-1"><p className="text-sm text-white">{definition.name} <span className="text-xs text-zinc-500">v{definition.version}</span></p><p className="text-xs text-zinc-400">{status}{!configured && ' — adapter, controls and matching manifests must be prepared and deployed first.'}</p></div>
          <Button type="button" variant={active ? 'secondary' : 'default'} className="min-h-11" aria-label={`${active ? 'Deactivate' : 'Activate'} ${definition.name}`} disabled={disabled || activation.isPending || !catalog?.canManage || !configured || !entry} onClick={() => {
            if (entry) activation.mutate({ data: { id: definition.id, version: entry.version, contract: entry.contract, active: !active } })
          }}>{activation.isPending && activation.variables?.data.id === definition.id ? 'Saving…' : active ? 'Deactivate' : 'Activate'}</Button>
        </li>
      })}</ul>
      {activation.error && <p role="alert" className="text-xs text-red-300">{activation.error.message} Your activation change was not confirmed; reload the catalog before retrying.</p>}
      {activation.isSuccess && <p role="status" className="text-xs text-emerald-300">Shader availability saved.</p>}
      <p className="text-xs leading-6 text-zinc-500">New shader source still needs a trusted installation and deployment. Empty installer drafts cannot be activated safely; this panel never edits files, installs packages or runs uploaded code.</p>
    </div>
  </section>
}
