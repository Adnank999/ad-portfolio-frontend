import type { ExplorationLogoKind } from './geometry'

export function ExplorationLogoFallback({ kind }: { kind: ExplorationLogoKind }) {
  return <div className={`exploration-logo-fallback exploration-logo-fallback-${kind}`} aria-hidden="true">
    <i className="exploration-logo-back" /><i className="exploration-logo-body" /><i className="exploration-logo-core" />
  </div>
}
