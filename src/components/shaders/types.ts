import type { ComponentType } from 'react'
import type { ZodType } from 'zod'
import type { JsonObject } from '@/server/portfolio-content'

export type ShaderControl =
  | { kind: 'slider'; key: string; label: string; min: number; max: number; step: number }
  | { kind: 'toggle' | 'color'; key: string; label: string }
  | { kind: 'color-list'; key: string; label: string; minItems: number; maxItems: number }
  | { kind: 'select'; key: string; label: string; options: readonly { label: string; value: string }[] }

export type ShaderDefinition = {
  id: string
  name: string
  version: number
  status: 'draft' | 'ready'
  source: string
  schema: ZodType<JsonObject>
  defaults: JsonObject
  controls: readonly ShaderControl[]
  load: () => Promise<{ default: ComponentType<JsonObject> }>
}

export type ImageVisual = { type: 'image'; src: string; alt: string }
export type ShaderVisual = { type: 'shader'; shader: string; version: number; props: JsonObject; poster?: string; alt: string }
export type VisualConfig = ImageVisual | ShaderVisual
export const serviceVisualSlots = ['hero', 'overview', 'spotlight', 'article-1', 'article-2', 'article-3'] as const
export type ServiceVisualSlot = typeof serviceVisualSlots[number]
export type ServiceVisuals = Partial<Record<ServiceVisualSlot, VisualConfig>>
export type ShaderManifest = { formatVersion: number; canManage?: boolean; shaders: { id: string; name: string; version: number; contract: string; defaultActive?: boolean; active?: boolean }[] }
