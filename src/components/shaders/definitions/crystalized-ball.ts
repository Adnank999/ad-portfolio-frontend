import { z as schema } from 'zod'
import type { ShaderDefinition } from '../types'

export const definition = {
  id: 'crystalized-ball', name: 'Crystalized Ball', version: 1, status: 'draft', source: '@react-bits/CrystalizedBall-TS-TW',
  schema: schema.strictObject({
    color: schema.string().regex(/^#[0-9a-fA-F]{6}$/),
    particleCount: schema.number().min(1000).max(15000),
    preset: schema.enum(["plasma","aurora","nebula","ember","frost","solar","eclipse","abyss"]),
    size: schema.number().min(0.2).max(1.5),
    speed: schema.number().min(0).max(3),
    interactive: schema.boolean(),
    hoverStrength: schema.number().min(0).max(2),
    intro: schema.boolean(),
    theme: schema.enum(["dark","light"]),
  }),
  defaults: {"preset":"plasma","size":0.7,"speed":1,"interactive":true,"hoverStrength":0.7,"intro":false,"theme":"dark","color":"#C21E56","particleCount":8000},
  controls: [
    { kind: 'color', key: 'color', label: 'Ball color' },
    { kind: 'slider', key: 'particleCount', label: 'Particles', min: 1000, max: 15000, step: 1000 },
    {"options":[{"label":"Plasma","value":"plasma"},{"label":"Aurora","value":"aurora"},{"label":"Nebula","value":"nebula"},{"label":"Ember","value":"ember"},{"label":"Frost","value":"frost"},{"label":"Solar","value":"solar"},{"label":"Eclipse","value":"eclipse"},{"label":"Abyss","value":"abyss"}],"kind":"select","key":"preset","label":"Preset"},
    {"min":0.2,"max":1.5,"step":0.05,"kind":"slider","key":"size","label":"Size"},
    {"min":0,"max":3,"step":0.05,"kind":"slider","key":"speed","label":"Speed"},
    {"kind":"toggle","key":"interactive","label":"Interactive"},
    {"min":0,"max":2,"step":0.05,"kind":"slider","key":"hoverStrength","label":"Hover Strength"},
    {"kind":"toggle","key":"intro","label":"Intro"},
    {"options":[{"label":"Dark","value":"dark"},{"label":"Light","value":"light"}],"kind":"select","key":"theme","label":"Theme"},
  ],
  load: () => import('../adapters/CrystalizedBallAdapter'),
} satisfies ShaderDefinition
