import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createForestLayout } from './forest.js';
import { findTerrainCrest } from './terrain.js';

export function createPortfolioMarkerOrigins(projects,heightAt) {
  return Object.fromEntries(projects.map((project,index)=>{
    const degrees=projects.length<2?70:-65+index/(projects.length-1)*245;
    const angle=degrees*Math.PI/180,radius=79+4*Math.sin(angle*3)+3*Math.sin(angle*5);
    const origin={x:Math.cos(angle)*radius,z:-10-Math.sin(angle)*radius};
    const crest=findTerrainCrest(heightAt,origin,1.2,9);
    return [project.id,{x:crest.x,z:crest.z,radius:0}];
  }));
}

export function createBakedHeightSampler(buffer, resolution = 257, size = 340) {
  const heights = new Float32Array(buffer);
  if (heights.length !== resolution * resolution || heights.some(value => !Number.isFinite(value))) {
    throw new Error('Invalid Blender terrain height grid');
  }
  return (horizontal, depth) => {
    const column = THREE.MathUtils.clamp(horizontal / size + .5, 0, 1) * (resolution - 1);
    const row = THREE.MathUtils.clamp(.5 - depth / size, 0, 1) * (resolution - 1);
    const left = Math.floor(column), bottom = Math.floor(row);
    const right = Math.min(left + 1, resolution - 1), top = Math.min(bottom + 1, resolution - 1);
    const lower = THREE.MathUtils.lerp(heights[bottom * resolution + left], heights[bottom * resolution + right], column - left);
    const upper = THREE.MathUtils.lerp(heights[top * resolution + left], heights[top * resolution + right], column - left);
    return THREE.MathUtils.lerp(lower, upper, row - bottom);
  };
}

export async function loadBlenderEnvironment(base, anisotropy = 4) {
  const loader = new GLTFLoader(), textureLoader = new THREE.TextureLoader();
  const textures = [], geometries = new Set(), importedMaterials = new Set();
  const track = gltf => {
    gltf.scene.traverse(object => {
      if (object.isMesh) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) importedMaterials.add(material);
      }
    });
    return gltf;
  };
  const texture = async (name, color = false) => {
    const value = await textureLoader.loadAsync(`${base}${name}.webp`);
    value.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    value.wrapS = value.wrapT = THREE.RepeatWrapping;
    value.anisotropy = anisotropy;
    textures.push(value);
    return value;
  };
  const dispose = () => {
    textures.forEach(value => value.dispose());
    geometries.forEach(value => value.dispose());
    importedMaterials.forEach(value => value.dispose());
  };
  const requests = [loader.loadAsync(`${base}terrain.glb`).then(track), loader.loadAsync(`${base}fir-lod2.glb`).then(track),
    fetch(`${base}heights.f32`).then(response => {
      if (!response.ok) throw new Error(`Blender height grid: HTTP ${response.status}`);
      return response.arrayBuffer();
    }),
    ...['rock-diff', 'forest_ground-diff', 'rock-nor_gl', 'forest_ground-nor_gl', 'rock-rough',
      'forest_ground-rough', 'rock-disp', 'forest_ground-disp', 'tree-branches', 'tree-twigs']
      .map(name => texture(name, name.endsWith('-diff') || name.startsWith('tree-'))), texture('outside-land'),
    fetch(`${base}scene.json`).then(response=>{if(!response.ok)throw new Error('Missing Blender scene metadata');return response.json();})];
  const results = await Promise.allSettled(requests);
  const failure = results.find(result => result.status === 'rejected');
  if (failure) { dispose(); throw failure.reason; }
  const [terrain, tree, heightBuffer, rock, ground, rockNormal, groundNormal, rockRough, groundRough,
    rockHeight, groundHeight, bark, needles, outsideLand, metadata] = results.map(result => result.value);
  outsideLand.wrapS = outsideLand.wrapT = THREE.ClampToEdgeWrapping;
  let geometry;
  terrain.scene.updateMatrixWorld(true);
  terrain.scene.traverse(object => {
    if (object.isMesh) {
      geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
      geometries.add(geometry);
    }
  });
  if (!geometry) { dispose(); throw new Error('Blender terrain has no mesh'); }
  const heightAt = createBakedHeightSampler(heightBuffer);
  return { geometry, heightAt, markerOrigins: metadata.projectAnchors, maps: { rock, ground, rockNormal, groundNormal, rockRough, groundRough, rockHeight, groundHeight, outsideLand },
    createForest(colorMap, maximum) {
      const placements = createForestLayout(heightAt, colorMap, maximum);
      const group = new THREE.Group(), materials = [], dummy = new THREE.Object3D();
      group.name = 'Blender fir grove / shared LOD2 geometry';
      tree.scene.updateMatrixWorld(true);
      tree.scene.traverse(source => {
        if (!source.isMesh) return;
        const leaf = source.name.includes('twigs');
        const material = new THREE.MeshStandardMaterial({ map: leaf ? needles : bark, roughness: .92,
          alphaTest: leaf ? .45 : 0, side: leaf ? THREE.DoubleSide : THREE.FrontSide });
        materials.push(material);
        const treeGeometry = source.geometry.clone().applyMatrix4(source.matrixWorld);
        geometries.add(treeGeometry);
        const instances = new THREE.InstancedMesh(treeGeometry, material, placements.length);
        instances.name = `Instanced ${source.name}`;
        placements.forEach((placement, index) => {
          dummy.position.set(placement.x, placement.y, placement.z);
          dummy.rotation.set(0, placement.rotation, 0);
          dummy.scale.setScalar(placement.scale);
          dummy.updateMatrix(); instances.setMatrixAt(index, dummy.matrix);
        });
        instances.instanceMatrix.needsUpdate = true;
        instances.computeBoundingSphere(); group.add(instances);
      });
      return { group, count: placements.length, update() {}, dispose() {
        group.traverse(object => { if (object.isInstancedMesh) object.dispose(); });
        materials.forEach(value => value.dispose()); group.clear();
      } };
    }, dispose };
}

export function applyBlenderTerrainMaterial(material, maps, valleyUniforms) {
  material.map = maps.rock;
  material.normalMap = null;
  material.bumpMap = maps.rockHeight;
  material.bumpScale = .3;
  material.emissiveMap = null;
  material.emissive.set(0);
  material.color.set('#ffffff');
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, { uVolcanoHeat: { value: 0 }, uVolcanoTime: { value: 0 } }, valleyUniforms, Object.fromEntries(Object.entries(maps).map(([name, value]) => [name, { value }])));
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTerrainWorld,vTerrainNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTerrainWorld=(modelMatrix*vec4(position,1.0)).xyz;vTerrainNormal=normalize(mat3(modelMatrix)*normal);');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vTerrainWorld,vTerrainNormal;
      uniform float uValleyFog;uniform vec3 uValleyColor;
      uniform float uVolcanoHeat,uVolcanoTime;
      uniform sampler2D rock,ground,rockNormal,groundNormal,rockRough,groundRough,rockHeight,groundHeight,outsideLand;
      float lavaHash(vec2 point){return fract(sin(dot(point,vec2(127.1,311.7)))*43758.5453);}
      float lavaNoise(vec2 point){vec2 cell=floor(point),blend=fract(point);blend=blend*blend*(3.0-2.0*blend);
        return mix(mix(lavaHash(cell),lavaHash(cell+vec2(1,0)),blend.x),mix(lavaHash(cell+vec2(0,1)),lavaHash(cell+vec2(1,1)),blend.x),blend.y);}
      vec3 terrainWeights(){vec3 weights=pow(abs(normalize(vTerrainNormal)),vec3(4.0));return weights/max(dot(weights,vec3(1.0)),.0001);}
      vec4 terrainSample(sampler2D source){vec3 weights=terrainWeights();vec3 point=vTerrainWorld*.16;
        return texture2D(source,point.zy)*weights.x+texture2D(source,point.xz)*weights.y+texture2D(source,point.xy)*weights.z;}
      vec3 terrainMappedNormal(sampler2D source){vec3 weights=terrainWeights(),point=vTerrainWorld*.16;
        vec3 base=normalize(vTerrainNormal);
        vec3 nx=texture2D(source,point.zy).xyz*2.0-1.0;
        vec3 ny=texture2D(source,point.xz).xyz*2.0-1.0;
        vec3 nz=texture2D(source,point.xy).xyz*2.0-1.0;
        return normalize(vec3(nx.z*sign(base.x),nx.y,nx.x)*weights.x+
          vec3(ny.x,ny.z*sign(base.y),ny.y)*weights.y+
          vec3(nz.x,nz.y,nz.z*sign(base.z))*weights.z);}`)
      .replace('#include <map_fragment>', `
        float meadow=texture2D(outsideLand,vec2(vTerrainWorld.x/340.0+.5,.5-vTerrainWorld.z/340.0)).r;
        diffuseColor.rgb*=mix(terrainSample(rock).rgb,terrainSample(ground).rgb,meadow);
        diffuseColor.rgb*=mix(.55,1.0,smoothstep(1.2,5.5,vTerrainWorld.y));`)
      .replace('#include <roughnessmap_fragment>', `float roughnessFactor=roughness*mix(terrainSample(rockRough).r,terrainSample(groundRough).r,meadow);`)
      .replace('#include <normal_fragment_maps>', `
        vec3 mapped=mix(terrainMappedNormal(rockNormal),terrainMappedNormal(groundNormal),meadow);
        normal=normalize(mix(normal,normalize(mat3(viewMatrix)*mapped),.48));
        float relief=mix(terrainSample(rockHeight).r,terrainSample(groundHeight).r,meadow)*bumpScale;
        normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(relief),dFdy(relief)),faceDirection);`)
      .replace('#include <opaque_fragment>', `
        vec2 volcanicPoint=vTerrainWorld.xz-vec2(0.0,-10.0);
        float volcanicRadius=length(volcanicPoint),volcanicAngle=atan(volcanicPoint.y,volcanicPoint.x);
        float rockBreakup=lavaNoise(volcanicPoint*.45);
        float channelWander=(lavaNoise(volcanicPoint*.075)-.5)*.85+sin(volcanicRadius*.13+volcanicAngle*4.0)*.12;
        float branches=abs(sin(volcanicAngle*3.0+sin(volcanicAngle*5.0)*.28+channelWander));
        float tributary=abs(sin(volcanicAngle*9.0-channelWander*1.5));
        float width=.05+lavaNoise(volcanicPoint*.11)*.055;
        float veins=(1.0-smoothstep(.012,width,branches))+(1.0-smoothstep(.007,.032,tributary))*.28;
        veins*=.65+rockBreakup*.5;
        float crater=1.0-smoothstep(4.0,9.0,volcanicRadius);
        float rim=exp(-pow((volcanicRadius-9.0)/.8,2.0));
        float fractures=min(abs(sin(volcanicPoint.x*.74+rockBreakup*2.0)),abs(sin(volcanicPoint.y*.63-rockBreakup*2.7)));
        float thermalCracks=(1.0-smoothstep(.015,.06,fractures))*uVolcanoHeat*.18;
        float lavaMask=max(crater,max(rim,veins*smoothstep(8.0,16.0,volcanicRadius)+thermalCracks))*(1.0-smoothstep(38.0,53.0,volcanicRadius))*(1.0-meadow);
        float pulse=.78+.22*lavaNoise(volcanicPoint*.65+vec2(0.0,-uVolcanoTime*.7));
        float heatColor=smoothstep(0.0,.85,uVolcanoHeat);
        vec3 coolingOrange=vec3(3.2,1.05,.025);
        vec3 castingRed=vec3(6.0,.12,.012);
        vec3 lava=mix(coolingOrange,castingRed,heatColor)*pulse*(.85+crater*.3+rockBreakup*.12);
        outgoingLight*=1.0-lavaMask*.3;
        outgoingLight+=lava*lavaMask*(.28+uVolcanoHeat*2.6);
        float valley=1.0-smoothstep(1.2,13.2,vTerrainWorld.y);
        outgoingLight=mix(outgoingLight,uValleyColor*.55,valley*valley*uValleyFog*.38);
        #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => 'aether-molten-fractures-v4';
  material.needsUpdate = true;
}
