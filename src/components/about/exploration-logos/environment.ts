import { BackSide, BoxGeometry, Color, Mesh, MeshBasicMaterial, PMREMGenerator, Scene, SphereGeometry, type Texture, type WebGLRenderer } from 'three'

export function createLogoStudio(texture: Texture) {
  const scene = new Scene()
  scene.background = new Color('#030103')
  const sphere = new SphereGeometry(12, 48, 32)
  const backdropMaterial = new MeshBasicMaterial({ map: texture, side: BackSide, color: 0xffffff, toneMapped: false })
  const backdrop = new Mesh(sphere, backdropMaterial)
  backdrop.rotation.y = .8
  scene.add(backdrop)
  const panelGeometry = new BoxGeometry(1, 1, .015)
  const panelMaterials: MeshBasicMaterial[] = []
  const panels = [
    { position: [-1.6, .5, 5], size: [2, 5], color: new Color(1.15, .02, .25) },
    { position: [1.8, -.3, 5], size: [1.5, 4], color: new Color(1.05, .32, .015) },
    { position: [0, 5, .6], size: [5, 1.4], color: new Color(.22, .015, .8) },
    { position: [-1, -2, -5], size: [4, 1.6], color: new Color(.9, .12, .008) },
  ]
  for (const panel of panels) {
    const material = new MeshBasicMaterial({ color: panel.color, toneMapped: false })
    const mesh = new Mesh(panelGeometry, material)
    mesh.position.set(panel.position[0], panel.position[1], panel.position[2])
    mesh.scale.set(panel.size[0], panel.size[1], 1)
    mesh.lookAt(0, 0, 0)
    panelMaterials.push(material)
    scene.add(mesh)
  }
  return {
    scene,
    dispose() {
      sphere.dispose()
      panelGeometry.dispose()
      backdropMaterial.dispose()
      panelMaterials.forEach(material => material.dispose())
      scene.clear()
    },
  }
}

export function createLogoReflections(renderer: WebGLRenderer, texture: Texture) {
  const studio = createLogoStudio(texture)
  const generator = new PMREMGenerator(renderer)
  try {
    return generator.fromScene(studio.scene, .018, .1, 30, { size: window.innerWidth < 800 ? 128 : 256 })
  } finally {
    generator.dispose()
    studio.dispose()
  }
}
