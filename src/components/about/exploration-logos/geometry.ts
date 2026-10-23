import { BoxGeometry, BufferGeometry, ExtrudeGeometry, Group, Matrix4, Mesh, OctahedronGeometry, Path, Shape, type Material } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export type ExplorationLogoKind = 'visual' | 'modeling' | 'systems'

function extrude(shapes: Shape | Shape[], depth = .3) {
  const geometry = new ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 6, steps: 1, curveSegments: 12 })
  geometry.translate(0, 0, -depth / 2)
  return geometry
}

function squareFrame(outer: number, inner: number) {
  const shape = new Shape()
  shape.moveTo(-outer, -outer).lineTo(outer, -outer).lineTo(outer, outer).lineTo(-outer, outer).closePath()
  const hole = new Path()
  hole.moveTo(-inner, -inner).lineTo(-inner, inner).lineTo(inner, inner).lineTo(inner, -inner).closePath()
  shape.holes.push(hole)
  return shape
}

function shaderPrism(material: Material) {
  const group = new Group()
  const triangle = new Shape()
  triangle.moveTo(0, 1.16).lineTo(-1.06, -.8).lineTo(1.06, -.8).closePath()
  const hole = new Path()
  hole.moveTo(0, .64).lineTo(.59, -.47).lineTo(-.59, -.47).closePath()
  triangle.holes.push(hole)
  const frame = extrude(triangle, .34)
  group.add(new Mesh(frame, material))
  const rear = new Mesh(frame, material)
  rear.scale.setScalar(.8)
  rear.position.set(0, .02, -.6)
  rear.rotation.z = -.12
  group.add(rear)
  const crystal = new Mesh(new OctahedronGeometry(.36, 0), material)
  crystal.position.set(0, -.04, .08)
  crystal.rotation.z = .3
  group.add(crystal)
  return group
}

function modelingCube(material: Material) {
  const group = new Group()
  const face = extrude(squareFrame(.83, .57), .15)
  const faces: BufferGeometry[] = []
  for (let side = 0; side < 4; side++) {
    const transform = new Matrix4().makeRotationY(side * Math.PI / 2)
    transform.multiply(new Matrix4().makeTranslation(0, 0, .77))
    faces.push(face.clone().applyMatrix4(transform))
  }
  for (const direction of [-1, 1]) {
    const transform = new Matrix4().makeRotationX(direction * Math.PI / 2)
    transform.multiply(new Matrix4().makeTranslation(0, 0, .77))
    faces.push(face.clone().applyMatrix4(transform))
  }
  const cage = mergeGeometries(faces)
  face.dispose()
  faces.forEach(geometry => geometry.dispose())
  group.add(new Mesh(cage, material))
  const center = new Mesh(new OctahedronGeometry(.53, 0), material)
  center.rotation.z = Math.PI / 4
  group.add(center)
  return group
}

function intelligenceChip(material: Material) {
  const group = new Group()
  const shapes = [squareFrame(.78, .47)]
  for (const direction of [-1, 1]) {
    for (const position of [-.5, 0, .5]) {
      const horizontal = new Shape()
      const edge = direction < 0 ? -1.23 : .83
      horizontal.moveTo(edge, position - .075).lineTo(edge + .4, position - .075).lineTo(edge + .4, position + .075).lineTo(edge, position + .075).closePath()
      const vertical = new Shape()
      vertical.moveTo(position - .075, edge).lineTo(position + .075, edge).lineTo(position + .075, edge + .4).lineTo(position - .075, edge + .4).closePath()
      shapes.push(horizontal, vertical)
    }
  }
  group.add(new Mesh(extrude(shapes, .27), material))
  const core = new Mesh(new BoxGeometry(.61, .61, .38), material)
  core.rotation.z = Math.PI / 4
  core.position.z = .06
  group.add(core)
  return group
}

export function createExplorationLogo(kind: ExplorationLogoKind, material: Material) {
  const group = kind === 'visual' ? shaderPrism(material) : kind === 'modeling' ? modelingCube(material) : intelligenceChip(material)
  group.name = `exploration-${kind}`
  return group
}
