import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import * as THREE from 'three'
import { toTerrainProjects } from '../src/components/terrain-recreation/project-data'
import { projects } from '../src/data/projects'
const terrainProjects = toTerrainProjects(projects)
import { createBakedHeightSampler, createPortfolioMarkerOrigins, applyBlenderTerrainMaterial } from '../src/components/terrain-recreation/engine/blender-environment.js'
import { findTerrainCrest } from '../src/components/terrain-recreation/engine/terrain.js'
import { findDragonBreathTarget, sampleDragonFlight } from '../src/components/terrain-recreation/engine/dragons.js'
import { createDragonBreath, traceBreathTerrain } from '../src/components/terrain-recreation/engine/dragon-breath.js'
import { createRiverWater } from '../src/components/terrain-recreation/engine/water.js'
import { DEFAULT_SETTINGS } from '../src/components/terrain-recreation/engine/scene.js'

const base = new URL('../public/terrain/assets/aether/', import.meta.url)
const metadata = JSON.parse(readFileSync(new URL('scene.json', base), 'utf8'))
const bytes = readFileSync(new URL('heights.f32', base))
const heightAt = createBakedHeightSampler(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))

describe('ported volcanic terrain', () => {
  test('ships the complete optimized scene, without original Blender source packs', () => {
    expect(metadata.formation).toBe('volcanic-island')
    expect(metadata.surroundingLandform).toBe('connected-crescent')
    expect(metadata.volcanoBridge).toBe(false)
    expect(metadata.runtimeBytes).toBeLessThan(6_000_000)
    expect(metadata.treeTextureBytes).toBeLessThan(200_000)
    for (const name of ['terrain.glb', 'fir-lod2.glb', 'outside-land.webp', 'tree-branches.webp', 'tree-twigs.webp']) expect(existsSync(new URL(name, base))).toBe(true)
    for (const family of ['rock', 'forest_ground']) for (const suffix of ['diff', 'nor_gl', 'rough', 'disp']) expect(existsSync(new URL(`${family}-${suffix}.webp`, base))).toBe(true)
    expect(readdirSync(base).some(name => /\.(blend|raw|exr)$/.test(name))).toBe(false)
    expect(heightAt(9, -10)).toBeGreaterThan(25)
    expect(heightAt(9, -10)).toBeLessThan(38)
    expect(heightAt(56, -10)).toBeLessThan(1.2)
  })

  test('places every portfolio project on a distinct exposed crescent ridge', () => {
    const origins = createPortfolioMarkerOrigins(terrainProjects, heightAt)
    expect(Object.keys(origins)).toEqual(terrainProjects.map(project => project.id))
    const positioned: THREE.Vector3[] = []
    for (const project of terrainProjects) {
      const origin = origins[project.id]
      const crest = findTerrainCrest(heightAt, origin, 1.2, origin.radius)
      expect(crest.y).toBeGreaterThan(7)
      expect(crest.y).toBeLessThan(28)
      for (let sample = 0; sample < 24; sample++) {
        const angle = sample / 24 * Math.PI * 2
        expect(crest.y - heightAt(crest.x + Math.cos(angle) * 1.75, crest.z + Math.sin(angle) * 1.75)).toBeGreaterThan(.1)
      }
      for (const previous of positioned) expect(Math.hypot(crest.x - previous.x, crest.z - previous.z)).toBeGreaterThan(35)
      positioned.push(new THREE.Vector3(crest.x, crest.y, crest.z))
    }
  })

  test('keeps fire on the volcano and ice on visible water throughout its wider patrol', () => {
    for (let index = 0; index < 12; index++) {
      for (const kind of ['fire', 'ice']) {
        const flight = sampleDragonFlight(index / 12 * Math.PI * 2 / .105, kind, DEFAULT_SETTINGS, heightAt)
        const target = findDragonBreathTarget(kind, flight.position, heightAt)
        const direction = target.clone().sub(flight.position).normalize()
        const hit = traceBreathTerrain(flight.position, direction, flight.position.distanceTo(target) + 1, heightAt)
        expect(hit).not.toBeNull()
        expect(hit?.dry).toBe(kind === 'fire')
      }
    }
  })

  test('retains red-to-orange lava, turbulent impacts, particle culling and melting river frost', () => {
    const material = new THREE.MeshStandardMaterial(), rock = new THREE.Texture(), rockHeight = new THREE.Texture()
    const uniforms = { uVolcanoHeat: { value: 1 }, uVolcanoTime: { value: 2 } }
    applyBlenderTerrainMaterial(material, { rock, rockHeight }, uniforms)
    const shader = { uniforms: {} as Record<string, unknown>, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader }
    material.onBeforeCompile(shader as THREE.WebGLProgramParametersWithUniforms, {} as THREE.WebGLRenderer)
    expect(shader.uniforms.uVolcanoHeat).toBe(uniforms.uVolcanoHeat)
    expect(shader.fragmentShader).toContain('mix(coolingOrange,castingRed,heatColor)')
    const scene = new THREE.Scene(), socket = new THREE.Object3D()
    socket.position.set(30, 70, 0); socket.updateMatrixWorld(true)
    const effect = createDragonBreath({ kind: 'fire', scene, heightAt })
    effect.update(1, .1, socket, 1, DEFAULT_SETTINGS, findDragonBreathTarget('fire', socket.position, heightAt))
    expect(effect.impact?.dry).toBe(true)
    expect(effect.group.children.some(child => child.name.includes('impact bloom') && child.visible)).toBe(true)
    const textures = Array.from({ length: 4 }, () => new THREE.Texture())
    const water = createRiverWater(...textures)
    water.setFrost({ dry: false, point: new THREE.Vector3(55, 1.2, 0) }, 1, .3)
    expect(water.mesh.material.uniforms.uIcePatches.value.some((stamp: THREE.Vector4) => stamp.w === 1)).toBe(true)
    for (let frame = 0; frame < 1500; frame++) water.setFrost(null, 0, 1 / 60)
    expect(water.mesh.material.uniforms.uIcePatches.value.every((stamp: THREE.Vector4) => stamp.w === 0)).toBe(true)
    effect.dispose(); water.dispose(); material.dispose(); rock.dispose(); rockHeight.dispose(); textures.forEach(texture => texture.dispose())
    expect(scene.children.length).toBe(0)
  })
})
