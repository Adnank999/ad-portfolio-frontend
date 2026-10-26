import { z as schema } from 'zod'
import type { ShaderDefinition } from '../types'

export const definition = {
  id: 'gradient-flow', name: 'Gradient Flow', version: 1, status: 'ready', source: 'portfolio/custom/gradient-flow',
  schema: schema.strictObject({
    colorStops: schema.array(schema.string().regex(/^#[0-9a-fA-F]{6}$/)).min(2).max(5),
    speed: schema.number().min(0).max(2), amplitude: schema.number().min(0).max(2),
    blend: schema.number().min(0).max(1), direction: schema.enum(['horizontal', 'vertical']),
  }),
  defaults: { colorStops: ['#160009', '#C21E56', '#7C0A02'], speed: 0.5, amplitude: 1, blend: 0.5, direction: 'horizontal' },
  controls: [
    { kind: 'color-list', key: 'colorStops', label: 'Gradient colors', minItems: 2, maxItems: 5 },
    { kind: 'slider', key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.05 },
    { kind: 'slider', key: 'amplitude', label: 'Amplitude', min: 0, max: 2, step: 0.05 },
    { kind: 'slider', key: 'blend', label: 'Blend', min: 0, max: 1, step: 0.05 },
    { kind: 'select', key: 'direction', label: 'Direction', options: [{ label: 'Horizontal', value: 'horizontal' }, { label: 'Vertical', value: 'vertical' }] },
  ],
  load: () => import('../adapters/GradientFlowAdapter'),
} satisfies ShaderDefinition
