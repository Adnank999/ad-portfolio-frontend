import React, { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { Mesh, ShaderLib, ShaderMaterial, Texture, type WebGLRenderer } from 'three'
import { createExplorationLogo, type ExplorationLogoKind } from '../src/components/about/exploration-logos/geometry'
import { ExplorationLogoFallback } from '../src/components/about/exploration-logos/ExplorationLogoFallback'
import { ExplorationLogoCanvas } from '../src/components/about/exploration-logos/ExplorationLogoCanvas'
import { logoSurfaceMap } from '../src/components/about/exploration-logos/shaders'
import { createLogoSurface } from '../src/components/about/exploration-logos/material'
import { createLogoStudio } from '../src/components/about/exploration-logos/environment'

const setActive = mock((_active: boolean) => {})
const dispose = mock(() => {})
const create = mock((_canvas: HTMLCanvasElement, _root: HTMLDivElement) => ({ setActive, dispose }))
mock.module('../src/components/about/exploration-logos/renderer', () => ({ createLogoRenderer: create }))

const originalObserver = Object.getOwnPropertyDescriptor(globalThis, 'IntersectionObserver')
const observers: Observer[] = []
class Observer {
  disconnect = mock(() => {})
  observe = mock((_element: Element) => {})
  constructor(readonly callback: IntersectionObserverCallback, readonly options?: IntersectionObserverInit) { observers.push(this) }
  notify(visible: boolean) { this.callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
}

beforeEach(() => {
  observers.length = 0
  create.mockClear()
  dispose.mockClear()
  setActive.mockClear()
  Object.defineProperty(globalThis, 'IntersectionObserver', { configurable: true, writable: true, value: Observer })
})
afterEach(() => {
  cleanup()
  if (originalObserver) Object.defineProperty(globalThis, 'IntersectionObserver', originalObserver)
  else Reflect.deleteProperty(globalThis, 'IntersectionObserver')
})

function CanvasExample({ paused = false, reducedMotion = false }: { paused?: boolean; reducedMotion?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  return <div ref={root}><ExplorationLogoCanvas root={root} paused={paused} reducedMotion={reducedMotion} /></div>
}

async function prepare() {
  await act(async () => { observers[0].notify(true) })
  await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
}

describe('exploration shader logos', () => {
  test('builds distinct solid 3D meshes with finite positions, normals, and real depth', () => {
    const material = new ShaderMaterial()
    const kinds: ExplorationLogoKind[] = ['visual', 'modeling', 'systems']
    const signatures = []
    for (const kind of kinds) {
      const logo = createExplorationLogo(kind, material)
      expect(logo.name).toBe(`exploration-${kind}`)
      const geometries = new Set<Mesh['geometry']>()
      logo.traverse(object => {
        if (!(object instanceof Mesh)) return
        expect(object.material).toBe(material)
        geometries.add(object.geometry)
      })
      let vertices = 0
      for (const geometry of geometries) {
        expect(Array.from(geometry.attributes.position.array).every(Number.isFinite)).toBe(true)
        expect(Array.from(geometry.attributes.normal.array).every(Number.isFinite)).toBe(true)
        geometry.computeBoundingBox()
        expect(geometry.boundingBox!.max.z - geometry.boundingBox!.min.z).toBeGreaterThan(.1)
        vertices += geometry.attributes.position.count
      }
      expect(vertices).toBeGreaterThan(100)
      expect(vertices).toBeLessThan(15000)
      signatures.push(vertices)
      geometries.forEach(geometry => geometry.dispose())
    }
    expect(new Set(signatures).size).toBe(3)
    material.dispose()
  })

  test('keeps a reflective metallic surface instead of pastel diffuse shading while limiting white glare', () => {
    const texture = new Texture()
    const { material, uniforms } = createLogoSurface(texture, 2)
    expect(material.isMeshPhysicalMaterial).toBe(true)
    expect(material.map).toBe(texture)
    expect(material.metalness).toBeGreaterThanOrEqual(.9)
    expect(material.roughness).toBeGreaterThanOrEqual(.12)
    expect(material.roughness).toBeLessThanOrEqual(.24)
    expect(material.clearcoat).toBeLessThanOrEqual(.2)
    expect(material.clearcoatRoughness).toBeGreaterThanOrEqual(.1)
    expect(material.reflectivity).toBeLessThanOrEqual(.5)
    expect(material.specularIntensity).toBeLessThanOrEqual(.5)
    expect(material.envMapIntensity).toBeGreaterThanOrEqual(.9)
    expect(material.envMapIntensity).toBeLessThanOrEqual(1.2)
    const shader = { uniforms: { ...ShaderLib.physical.uniforms }, vertexShader: ShaderLib.physical.vertexShader, fragmentShader: ShaderLib.physical.fragmentShader }
    material.onBeforeCompile(shader, {} as WebGLRenderer)
    expect(shader.uniforms.uLogoTime).toBe(uniforms.uLogoTime)
    expect(shader.uniforms.uLogoPhase.value).toBe(2)
    expect(shader.vertexShader).toContain('vLogoPosition = position')
    expect(shader.fragmentShader).toContain('#include <lights_physical_fragment>')
    expect(shader.fragmentShader).toContain('#include <colorspace_fragment>')
    expect(shader.fragmentShader).toContain(logoSurfaceMap)
    expect(logoSurfaceMap.match(/texture2D\(map/g)).toHaveLength(3)
    expect(logoSurfaceMap).not.toContain('uLogoAccent')
    material.dispose()
    texture.dispose()
  })

  test('reflects the color image and restrained colored panels without white studio lights or disposing the shared image', () => {
    const texture = new Texture()
    const textureDisposed = mock(() => {})
    texture.addEventListener('dispose', textureDisposed)
    const studio = createLogoStudio(texture)
    const meshes = studio.scene.children.filter(object => object instanceof Mesh)
    expect(meshes).toHaveLength(5)
    expect(meshes[0].material.map).toBe(texture)
    expect(meshes.slice(1).every(mesh => mesh.material.map === null)).toBe(true)
    expect(meshes.slice(1).every(mesh => mesh.material.color.r !== mesh.material.color.g)).toBe(true)
    expect(meshes.slice(1).some(mesh => mesh.material.color.r > 1)).toBe(true)
    expect(meshes.slice(1).every(mesh => Math.max(mesh.material.color.r, mesh.material.color.g, mesh.material.color.b) <= 1.2)).toBe(true)
    const geometryDisposed = mock(() => {})
    const geometries = new Set(meshes.map(mesh => mesh.geometry))
    geometries.forEach(geometry => geometry.addEventListener('dispose', geometryDisposed))
    studio.dispose()
    expect(geometryDisposed).toHaveBeenCalledTimes(2)
    expect(studio.scene.children).toHaveLength(0)
    expect(textureDisposed).not.toHaveBeenCalled()
    texture.dispose()
  })

  test('uses decorative CSS-only fallbacks instead of SVG image-area illustrations', () => {
    const { container } = render(<><ExplorationLogoFallback kind="visual" /><ExplorationLogoFallback kind="modeling" /><ExplorationLogoFallback kind="systems" /></>)
    expect(container.querySelectorAll('.exploration-logo-fallback[aria-hidden="true"]')).toHaveLength(3)
    expect(container.querySelector('svg')).toBeNull()
    expect(container.querySelector('canvas')).toBeNull()
  })

  test('defers the shared renderer until near view and pauses it offscreen without recreating it', async () => {
    const { container } = render(<CanvasExample />)
    expect(container.querySelectorAll('canvas')).toHaveLength(1)
    expect(create).not.toHaveBeenCalled()
    expect(observers[0].options?.rootMargin).toBe('180px')
    await prepare()
    expect(setActive).toHaveBeenLastCalledWith(false)
    act(() => observers[1].notify(true))
    expect(setActive).toHaveBeenLastCalledWith(true)
    act(() => observers[1].notify(false))
    expect(setActive).toHaveBeenLastCalledWith(false)
    await act(async () => observers[0].notify(true))
    expect(create).toHaveBeenCalledTimes(1)
  })

  test('honors reduced motion and the pause control, then releases the renderer and observers on unmount', async () => {
    const view = render(<CanvasExample reducedMotion />)
    await prepare()
    act(() => observers[1].notify(true))
    expect(setActive).toHaveBeenLastCalledWith(false)
    view.rerender(<CanvasExample />)
    expect(setActive).toHaveBeenLastCalledWith(true)
    view.rerender(<CanvasExample paused />)
    expect(setActive).toHaveBeenLastCalledWith(false)
    expect(create).toHaveBeenCalledTimes(1)
    view.unmount()
    expect(dispose).toHaveBeenCalledTimes(1)
    expect(observers.every(observer => observer.disconnect.mock.calls.length === 1)).toBe(true)
  })
})
