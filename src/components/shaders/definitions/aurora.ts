import { z as schema } from 'zod'
import type { ShaderDefinition } from '../types'

export const definition = {
  id: 'aurora', name: 'Aurora', version: 1, status: 'draft', source: '@react-bits/Aurora-TS-TW',
  schema: schema.strictObject({
    colorStops: schema.array(schema.string().regex(/^#[0-9a-fA-F]{6}$/)).min(2).max(5),
    amplitude: schema.number().min(0).max(3),
    blend: schema.number().min(0).max(1),
    speed: schema.number().min(0).max(3),
    height: schema.number().min(0.05).max(1),
    scale: schema.number().min(0.1).max(4),
    glow: schema.number().min(0).max(3),
    brightness: schema.number().min(0.1).max(3),
    layers: schema.number().min(1).max(3),
    direction: schema.enum(["top","bottom"]),
    mouseInteraction: schema.boolean(),
    intro: schema.boolean(),
    opacity: schema.number().min(0.1).max(1),
  }),
  defaults: {"colorStops":["#C21E56","#7C0A02","#F66B83"],"amplitude":1,"blend":0.5,"speed":1,"height":0.45,"scale":1,"glow":0.6,"brightness":1,"layers":1,"direction":"top","mouseInteraction":true,"intro":false,"opacity":1},
  controls: [
    {"minItems":2,"maxItems":5,"kind":"color-list","key":"colorStops","label":"Color Stops"},
    {"min":0,"max":3,"step":0.05,"kind":"slider","key":"amplitude","label":"Amplitude"},
    {"min":0,"max":1,"step":0.05,"kind":"slider","key":"blend","label":"Blend"},
    {"min":0,"max":3,"step":0.05,"kind":"slider","key":"speed","label":"Speed"},
    {"min":0.05,"max":1,"step":0.05,"kind":"slider","key":"height","label":"Height"},
    {"min":0.1,"max":4,"step":0.05,"kind":"slider","key":"scale","label":"Scale"},
    {"min":0,"max":3,"step":0.05,"kind":"slider","key":"glow","label":"Glow"},
    {"min":0.1,"max":3,"step":0.05,"kind":"slider","key":"brightness","label":"Brightness"},
    {"min":1,"max":3,"step":1,"kind":"slider","key":"layers","label":"Layers"},
    {"options":[{"label":"Top","value":"top"},{"label":"Bottom","value":"bottom"}],"kind":"select","key":"direction","label":"Direction"},
    {"kind":"toggle","key":"mouseInteraction","label":"Mouse Interaction"},
    {"kind":"toggle","key":"intro","label":"Intro"},
    {"min":0.1,"max":1,"step":0.05,"kind":"slider","key":"opacity","label":"Opacity"},
  ],
  load: () => import('../adapters/AuroraAdapter'),
} satisfies ShaderDefinition
