import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ContentKind } from '@/server/portfolio-content'
import type { CompletedAsset } from '@/lib/media/direct-upload'

type UploadContext = { kind: ContentKind; busy: boolean; register: (asset: CompletedAsset) => void; begin: () => void; end: () => void; getAssetIds: () => string[] }
const ImageUploadContext = createContext<UploadContext | null>(null)

export function AdminImageUploads({ kind, initialAssetIds = [], children }: { kind: ContentKind; initialAssetIds?: string[]; children: ReactNode }) {
  const assets = useRef(new Set(initialAssetIds))
  const [pending, setPending] = useState(0)
  const register = useCallback((asset: CompletedAsset) => { assets.current.add(asset.assetId) }, [])
  const begin = useCallback(() => setPending(current => current + 1), [])
  const end = useCallback(() => setPending(current => Math.max(0, current - 1)), [])
  const getAssetIds = useCallback(() => [...assets.current], [])
  const value = useMemo(() => ({ kind, busy: pending > 0, register, begin, end, getAssetIds }), [kind, pending, register, begin, end, getAssetIds])
  return <ImageUploadContext.Provider value={value}>{children}</ImageUploadContext.Provider>
}

export function useAdminImageUploads() { return useContext(ImageUploadContext) }
