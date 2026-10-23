import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WATER_LEVEL } from './water.js';

function seededRandom(initial) {
  let seed = initial;
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

export function createForestLayout(heightAt, colorMap, maximum = 280) {
  const random = seededRandom(30791), noise = new SimplexNoise({ random });
  const placements = [], cells = new Map(), cellSize = 5;
  for (let attempt = 0; attempt < maximum * 220 && placements.length < maximum; attempt++) {
    const horizontal = (random() - .5) * 322, depth = (random() - .5) * 322;
    if (Math.hypot(horizontal, depth) < 85) continue;
    const column = Math.round((horizontal / 340 + .5) * (colorMap.w - 1));
    const row = Math.round((depth / 340 + .5) * (colorMap.h - 1));
    const colorIndex = (row * colorMap.w + column) * 4;
    const green = colorMap.data[colorIndex + 1] - colorMap.data[colorIndex] * 1.03;
    if (green < 3) continue;
    const habitat = noise.noise(horizontal * .023, depth * .023) * .7
      + noise.noise(horizontal * .061 + 17, depth * .061) * .3;
    const density = THREE.MathUtils.smoothstep(habitat, .02, .5);
    if (random() > .018 + density ** 1.8 * .86) continue;
    const elevation = heightAt(horizontal, depth);
    if (elevation < WATER_LEVEL + 6 || elevation > 31) continue;
    const slope = Math.hypot(heightAt(horizontal + 2, depth) - heightAt(horizontal - 2, depth),
      heightAt(horizontal, depth + 2) - heightAt(horizontal, depth - 2)) / 4;
    if (slope > .82) continue;
    const scale = .48 + random() ** .65 * .84 + density * .2;
    const spacing = 2.2 + scale * 1.4;
    const cellX = Math.floor(horizontal / cellSize), cellZ = Math.floor(depth / cellSize);
    let crowded = false;
    for (let offsetZ = -1; offsetZ <= 1 && !crowded; offsetZ++) {
      for (let offsetX = -1; offsetX <= 1 && !crowded; offsetX++) {
        for (const neighbor of cells.get(`${cellX + offsetX},${cellZ + offsetZ}`) || []) {
          if (Math.hypot(horizontal - neighbor.x, depth - neighbor.z) < (spacing + neighbor.spacing) * .5) { crowded = true; break; }
        }
      }
    }
    if (crowded) continue;
    const shoreClearance = Math.min(heightAt(horizontal + 1.5, depth), heightAt(horizontal - 1.5, depth),
      heightAt(horizontal, depth + 1.5), heightAt(horizontal, depth - 1.5));
    if (shoreClearance < WATER_LEVEL + 3) continue;
    const placement = { x: horizontal, y: elevation - .12, z: depth, scale,
      rotation: random() * Math.PI * 2, species: Math.floor(random() * 3), shade: .72 + random() * .28, spacing };
    placements.push(placement);
    const key = `${cellX},${cellZ}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(placement);
  }
  return placements;
}

function needleTexture() {
  const width = 128, height = 256, pixels = new Uint8Array(width * height * 4), random = seededRandom(6105);
  for (let row = 1; row < height - 1; row++) {
    const center = 64 + Math.sin(row * .08) * 2;
    const spread = Math.sin(row / height * Math.PI) ** .7 * (42 + Math.sin(row * .55) * 3);
    for (let column = 0; column < width; column++) {
      const coverage = THREE.MathUtils.clamp((spread - Math.abs(column - center)) / 6, 0, 1);
      const variation = random();
      pixels.set([35 + variation * 18, 62 + variation * 24, 42 + variation * 18,
        coverage * (215 + variation * 30)], (row * width + column) * 4);
    }
  }
  function line(startX, startY, endX, endY, thickness, color) {
    const steps = Math.ceil(Math.hypot(endX - startX, endY - startY) * 1.6);
    for (let step = 0; step <= steps; step++) {
      const progress = step / Math.max(1, steps);
      const centerX = startX + (endX - startX) * progress, centerY = startY + (endY - startY) * progress;
      const radius = thickness * .5;
      for (let row = Math.floor(centerY - radius - 1); row <= centerY + radius + 1; row++) {
        for (let column = Math.floor(centerX - radius - 1); column <= centerX + radius + 1; column++) {
          if (column < 0 || row < 0 || column >= width || row >= height) continue;
          const alpha = Math.round(THREE.MathUtils.clamp(radius + .7 - Math.hypot(column - centerX, row - centerY), 0, 1) * 255);
          const index = (row * width + column) * 4;
          if (alpha >= pixels[index + 3]) pixels.set([...color, alpha], index);
        }
      }
    }
  }
  line(64, 254, 64, 7, 3, [48, 58, 38]);
  for (let branch = 0; branch < 38; branch++) {
    const originY = 242 - branch * 5.9;
    const spread = Math.sin((originY / height) * Math.PI) * (40 + random() * 13);
    for (const side of [-1, 1]) {
      const endX = 64 + side * spread, endY = originY - 12 - random() * 15;
      const tint = 32 + Math.round(random() * 20);
      line(64, originY, endX, endY, 3.1, [tint, tint + 24, tint + 8]);
      for (let needle = 1; needle <= 7; needle++) {
        const progress = needle / 8, startX = 64 + (endX - 64) * progress, startY = originY + (endY - originY) * progress;
        line(startX, startY, startX + side * (4 + random() * 8), startY - 6 - random() * 10,
          1.9, [tint + 8, tint + 30, tint + 15]);
      }
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height);
  texture.name = 'Procedural feathered conifer needles'; texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true; texture.needsUpdate = true;
  return texture;
}

function barkTexture() {
  const width = 64, height = 128, pixels = new Uint8Array(width * height * 4), random = seededRandom(311);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const groove = Math.sin(column * 1.7 + Math.sin(row * .09) * .65) * 9 + random() * 9;
      pixels.set([54 + groove, 43 + groove * .72, 33 + groove * .5, 255], (row * width + column) * 4);
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height);
  texture.name = 'Procedural vertically grooved bark'; texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true; texture.needsUpdate = true;
  return texture;
}

function coniferGeometry(species) {
  const random = seededRandom(783 + species * 317), positions = [], coordinates = [], indices = [];
  const crownParts = [];
  const treeHeight = 6.3 + species * .4;
  function card(root, tip, wing) {
    const start = positions.length / 3;
    for (const [along, side] of [[0, -1], [0, 1], [1, -1], [1, 1]]) {
      positions.push(root.x + (tip.x - root.x) * along + wing.x * side,
        root.y + (tip.y - root.y) * along + wing.y * side,
        root.z + (tip.z - root.z) * along + wing.z * side);
      coordinates.push(side < 0 ? 0 : 1, 1 - along);
    }
    indices.push(start, start + 2, start + 1, start + 1, start + 2, start + 3);
  }
  for (let tier = 0; tier < 10; tier++) {
    const elevation = 1.05 + tier * (treeHeight - 1.3) / 10;
    const branchCount = 6 + (tier % 3 === 0 ? 1 : 0);
    const reach = (1.7 - tier * .14) * (1 + (random() - .5) * .25);
    const crown = new THREE.SphereGeometry(reach * .7, 8, 5);
    crown.scale(1, .48 + random() * .08, .85 + random() * .15);
    crown.rotateY(tier * 2.399);
    crown.translate((random() - .5) * .16, elevation, (random() - .5) * .16);
    crownParts.push(crown);
    for (let branch = 0; branch < branchCount; branch++) {
      const angle = branch / branchCount * Math.PI * 2 + tier * 2.399 + random() * .24;
      const length = reach * (.8 + random() * .4);
      const root = new THREE.Vector3(0, elevation + random() * .13, 0);
      const tip = new THREE.Vector3(Math.cos(angle) * length, elevation - length * .16 + .13, Math.sin(angle) * length);
      card(root, tip, new THREE.Vector3(-Math.sin(angle) * length * .29, .04, Math.cos(angle) * length * .29));
      card(root, tip, new THREE.Vector3(0, length * .24, 0));
    }
  }
  card(new THREE.Vector3(0, treeHeight - 1.1, 0), new THREE.Vector3(0, treeHeight, 0), new THREE.Vector3(.28, 0, .08));
  card(new THREE.Vector3(0, treeHeight - 1.1, 0), new THREE.Vector3(0, treeHeight, 0), new THREE.Vector3(-.08, 0, .28));
  const foliage = new THREE.BufferGeometry();
  foliage.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  foliage.setAttribute('uv', new THREE.Float32BufferAttribute(coordinates, 2));
  foliage.setIndex(indices); foliage.computeVertexNormals();
  const trunk = new THREE.CylinderGeometry(.035, .14, treeHeight * .94, 7, 3);
  trunk.translate(0, treeHeight * .47, 0);
  const crown = mergeGeometries(crownParts); crownParts.forEach(part => part.dispose());
  const geometry = mergeGeometries([trunk, foliage, crown], true);
  trunk.dispose(); foliage.dispose(); crown.dispose();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createForest({ heightAt, colorMap, maximum = 280, anisotropy = 4 }) {
  const placements = createForestLayout(heightAt, colorMap, maximum), needles = needleTexture(), bark = barkTexture();
  needles.anisotropy = bark.anisotropy = anisotropy;
  const uniforms = { uTreeTime: { value: 0 }, uTreeWind: { value: .6 } };
  const leafMaterial = new THREE.MeshStandardMaterial({ map: needles, color: '#bfc9c0', roughness: 1,
    alphaTest: .3, side: THREE.DoubleSide, metalness: 0 });
  const trunkMaterial = new THREE.MeshStandardMaterial({ map: bark, color: '#9d9489', roughness: 1 });
  const crownMaterial = new THREE.MeshStandardMaterial({ map: needles, color: '#758a70', roughness: 1 });
  for (const material of [leafMaterial, trunkMaterial, crownMaterial]) {
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTreeTime,uTreeWind;')
        .replace('#include <begin_vertex>', `
          #include <begin_vertex>
          #ifdef USE_INSTANCING
            float treePhase=instanceMatrix[3].x*.13+instanceMatrix[3].z*.09;
            float crownWeight=smoothstep(.8,6.5,position.y);
            transformed.x+=sin(uTreeTime*.65+treePhase+position.y*.3)*crownWeight*uTreeWind*.09;
            transformed.z+=cos(uTreeTime*.48+treePhase)*crownWeight*uTreeWind*.055;
          #endif
        `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <fog_fragment>', `
        #ifdef USE_FOG
          float forestFog=1.0-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth*.38);
          gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor*.45,forestFog);
        #endif
      `);
    };
  }
  const group = new THREE.Group(); group.name = 'Natural textured conifer forest';
  const geometries = [], meshes = [], dummy = new THREE.Object3D(), tint = new THREE.Color();
  for (let species = 0; species < 3; species++) {
    const members = placements.filter(placement => placement.species === species);
    const geometry = coniferGeometry(species); geometries.push(geometry);
    const mesh = new THREE.InstancedMesh(geometry, [trunkMaterial, leafMaterial, crownMaterial], members.length);
    mesh.name = `Needled conifers ${species + 1}`;
    members.forEach((placement, index) => {
      dummy.position.set(placement.x, placement.y, placement.z);
      dummy.rotation.set(0, placement.rotation, 0);
      dummy.scale.set(placement.scale, placement.scale * (1 + species * .07), placement.scale);
      dummy.updateMatrix(); mesh.setMatrixAt(index, dummy.matrix);
      tint.setRGB(placement.shade * .7, placement.shade * .8, placement.shade * .72);
      mesh.setColorAt(index, tint);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere(); group.add(mesh); meshes.push(mesh);
  }
  return { group, meshes, placements, count: placements.length,
    update(time, wind) { uniforms.uTreeTime.value = time; uniforms.uTreeWind.value = wind; },
    dispose() { geometries.forEach(geometry => geometry.dispose()); leafMaterial.dispose(); trunkMaterial.dispose(); crownMaterial.dispose(); needles.dispose(); bark.dispose(); group.clear(); },
  };
}

