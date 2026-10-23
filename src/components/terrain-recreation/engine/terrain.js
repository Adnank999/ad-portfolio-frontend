import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

export const TERRAIN_SIZE = 340;

export function findTerrainCrest(heightAt, origin, waterLevel, radius = 26) {
  let best = null, bestScore = Infinity;
  for (let offsetZ = -radius; offsetZ <= radius; offsetZ += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      const distanceSquared = offsetX * offsetX + offsetZ * offsetZ;
      if (distanceSquared > radius * radius) continue;
      const horizontal = origin.x + offsetX, depth = origin.z + offsetZ;
      if (Math.max(Math.abs(horizontal), Math.abs(depth)) > TERRAIN_SIZE / 2 - 3) continue;
      const elevation = heightAt(horizontal, depth);
      if (elevation < waterLevel + 6) continue;
      let highest = elevation, lowest = elevation;
      for (let direction = 0; direction < 16; direction++) {
        const angle = direction / 16 * Math.PI * 2;
        const neighbor = heightAt(horizontal + Math.cos(angle) * 1.75, depth + Math.sin(angle) * 1.75);
        highest = Math.max(highest, neighbor); lowest = Math.min(lowest, neighbor);
        const inner = heightAt(horizontal + Math.cos(angle) * .875, depth + Math.sin(angle) * .875);
        highest = Math.max(highest, inner); lowest = Math.min(lowest, inner);
      }
      if (lowest < waterLevel + 4) continue;
      const uphill = highest - elevation, spread = highest - lowest;
      const penalty = uphill > .35 || spread > 1.8 ? 100 : 0;
      const score = distanceSquared * .012 + spread * 2.5 + uphill * 12 - elevation * .06 + penalty;
      if (score < bestScore) {
        bestScore = score;
        best = { x: horizontal, y: highest + .24, z: depth };
      }
    }
  }
  return best || { x: origin.x, y: Math.max(waterLevel + .5, heightAt(origin.x, origin.z)) + .18, z: origin.z };
}

function readHeight(image, horizontal, vertical) {
  const column = THREE.MathUtils.clamp(horizontal, 0, 1) * (image.w - 1);
  const row = THREE.MathUtils.clamp(1 - vertical, 0, 1) * (image.h - 1);
  const left = Math.floor(column), top = Math.floor(row);
  const right = Math.min(left + 1, image.w - 1), bottom = Math.min(top + 1, image.h - 1);
  const fractionX = column - left, fractionY = row - top;
  const upper = THREE.MathUtils.lerp(image.data[(top * image.w + left) * 4], image.data[(top * image.w + right) * 4], fractionX);
  const lower = THREE.MathUtils.lerp(image.data[(bottom * image.w + left) * 4], image.data[(bottom * image.w + right) * 4], fractionX);
  return THREE.MathUtils.lerp(upper, lower, fractionY) / 255;
}

export function createTerrainSurface({ relief, glyph, detail, mask }, resolution = 768) {
  let seed = 1881;
  const noise = new SimplexNoise({ random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  } });
  const heights = new Float32Array(resolution * resolution);
  for (let row = 0; row < resolution; row++) {
    const vertical = 1 - row / (resolution - 1);
    for (let column = 0; column < resolution; column++) {
      const horizontal = column / (resolution - 1);
      const logo = readHeight(glyph, horizontal, vertical);
      const channelProfile = THREE.MathUtils.smoothstep(logo, .28, .84);
      const mountainMask = readHeight(mask, horizontal, vertical);
      const radius = Math.hypot(horizontal - .5, vertical - .5);
      const peripheral = THREE.MathUtils.smoothstep(radius, .28, .52);
      const outerRelief = (.52 - readHeight(relief, horizontal, vertical)) * 23 * peripheral;
      let amplitude = .5, frequency = 1, previous = 1, ridges = 0;
      for (let octave = 0; octave < 7; octave++) {
        const ridge = (1 - Math.abs(noise.noise3d(horizontal * 20 * frequency, vertical * 20 * frequency, 0))) ** 2;
        ridges += ridge * amplitude * previous;
        previous = ridge; frequency *= 2.17; amplitude *= .5;
      }
      const rock = noise.noise3d(horizontal * 68, vertical * 68, 2)
        + noise.noise3d(horizontal * 136, vertical * 136, 2) * .38
        + noise.noise3d(horizontal * 272, vertical * 272, 2) * .12;
      const land = 1 - THREE.MathUtils.smoothstep(logo, .6, .9);
      heights[row * resolution + column] = 14 - channelProfile * 24 + outerRelief
        + ridges * (1.4 + mountainMask * 2.0)
        + rock * land * .42 + (readHeight(detail, horizontal, vertical) - .5) * land * .7;
    }
  }
  const normalPixels = new Uint8Array(resolution * resolution * 4);
  const spacing = TERRAIN_SIZE / (resolution - 1);
  const normal = new THREE.Vector3();
  for (let row = 0; row < resolution; row++) {
    for (let column = 0; column < resolution; column++) {
      const left = heights[row * resolution + Math.max(0, column - 1)];
      const right = heights[row * resolution + Math.min(resolution - 1, column + 1)];
      const upper = heights[Math.max(0, row - 1) * resolution + column];
      const lower = heights[Math.min(resolution - 1, row + 1) * resolution + column];
      normal.set((left - right) / (2 * spacing), 1, (upper - lower) / (2 * spacing)).normalize();
      normalPixels.set([
        Math.round((normal.x * .5 + .5) * 255), Math.round((normal.y * .5 + .5) * 255),
        Math.round((normal.z * .5 + .5) * 255), 255,
      ], (row * resolution + column) * 4);
    }
  }
  const normalMap = new THREE.DataTexture(normalPixels, resolution, resolution);
  normalMap.name = 'Height-derived terrain normals';
  normalMap.flipY = true;
  normalMap.magFilter = THREE.LinearFilter;
  normalMap.minFilter = THREE.LinearMipmapLinearFilter;
  normalMap.generateMipmaps = true;
  normalMap.needsUpdate = true;
  return {
    normalMap,
    heightAt(horizontal, depth) {
      const column = THREE.MathUtils.clamp(horizontal / TERRAIN_SIZE + .5, 0, 1) * (resolution - 1);
      const row = THREE.MathUtils.clamp(depth / TERRAIN_SIZE + .5, 0, 1) * (resolution - 1);
      const left = Math.floor(column), top = Math.floor(row);
      const right = Math.min(left + 1, resolution - 1), bottom = Math.min(top + 1, resolution - 1);
      const upperHeight = THREE.MathUtils.lerp(heights[top * resolution + left], heights[top * resolution + right], column - left);
      const lowerHeight = THREE.MathUtils.lerp(heights[bottom * resolution + left], heights[bottom * resolution + right], column - left);
      return THREE.MathUtils.lerp(upperHeight, lowerHeight, row - top);
    },
  };
}

