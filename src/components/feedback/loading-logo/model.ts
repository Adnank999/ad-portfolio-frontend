import { Box3, Group, Mesh, MeshStandardMaterial, Texture, Vector3, type BufferGeometry, type Material, type Object3D } from 'three'

export const loaderModelPath = 'loader/crimson_logo_optimized.glb'
export const loaderRingRadius = 1.40825
export const loaderViewExtent = 1.72

export function cloneLoadingModel(template: Group) {
  const instance = template.clone(true)
  const materials = new Map<Material, Material>()
  const cloneMaterial = (material: Material) => {
    let clone = materials.get(material)
    if (!clone) {
      clone = material.clone()
      materials.set(material, clone)
    }
    return clone
  }
  instance.traverse(object => {
    if (!(object instanceof Mesh)) return
    object.material = Array.isArray(object.material) ? object.material.map(cloneMaterial) : cloneMaterial(object.material)
  })
  return instance
}

export function releaseLoadingModelInstance(model: Group) {
  const materials = new Set<Material>()
  model.traverse(object => {
    if (!(object instanceof Mesh)) return
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material)
  })
  materials.forEach(material => material.dispose())
  model.removeFromParent()
}

export function fitLoadingModel(model: Object3D) {
  model.updateMatrixWorld(true)
  const bounds = new Box3().setFromObject(model)
  if (bounds.isEmpty()) throw new Error('Loader model has no visible geometry')
  const center = bounds.getCenter(new Vector3())
  const size = bounds.getSize(new Vector3())
  const vertex = new Vector3()
  let radius = 0
  model.traverse(object => {
    if (!(object instanceof Mesh)) return
    const positions = object.geometry.getAttribute('position')
    for (let index = 0; index < positions.count; index++) {
      vertex.fromBufferAttribute(positions, index).applyMatrix4(object.matrixWorld).sub(center)
      radius = Math.max(radius, Math.hypot(vertex.x, vertex.y))
    }
  })
  const scale = Math.min(2.35 / Math.max(size.x, size.y), 1.22 / Math.max(radius, 0.0001))
  model.position.sub(center)
  const fitted = new Group()
  fitted.name = 'CrimsonLoaderModel'
  fitted.scale.setScalar(scale)
  fitted.add(model)
  return fitted
}

export function prepareLoadingMaterials(model: Object3D, time: { value: number }) {
  const prepared = new Set<Material>()
  model.traverse(object => {
    if (!(object instanceof Mesh)) return
    if (!object.geometry.hasAttribute('normal')) object.geometry.computeVertexNormals()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      if (!(material instanceof MeshStandardMaterial) || prepared.has(material)) continue
      prepared.add(material)
      material.flatShading = false
      material.normalScale.multiplyScalar(0.35)
      material.emissiveIntensity = 1.15
      material.onBeforeCompile = shader => {
        shader.uniforms.uLoaderTime = time
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLoaderPosition;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLoaderPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;')
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uLoaderTime;\nvarying vec3 vLoaderPosition;')
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = max(roughnessFactor, 0.22);')
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
            float direction = vLoaderPosition.x < 0.0 ? -1.0 : 1.0;
            float phase = fract((vLoaderPosition.y + 1.3) / 2.6 * direction + uLoaderTime * 0.22);
            float distance = min(phase, 1.0 - phase);
            float movingLight = exp(-distance * distance * 650.0) + exp(-phase * 13.0) * 0.4;
            float edgeLight = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 2.0);
            totalEmissiveRadiance += vec3(1.8, 0.11, 0.46) * movingLight * (0.18 + edgeLight * 0.7);
          `)
      }
      material.customProgramCacheKey = () => 'crimson-loader-glow-v1'
      material.needsUpdate = true
    }
  })
}

export function disposeLoadingModel(model: Object3D) {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  model.traverse(object => {
    if (!(object instanceof Mesh)) return
    geometries.add(object.geometry)
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material)
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value)
    }
  })
  const images = new Set<ImageBitmap>()
  textures.forEach(texture => {
    if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) images.add(texture.image)
    texture.dispose()
  })
  images.forEach(image => image.close())
  geometries.forEach(geometry => geometry.dispose())
  materials.forEach(material => material.dispose())
  model.removeFromParent()
}
