import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createDragonBreath, createDragonGroundEffect, traceBreathTerrain } from './dragon-breath.js';
import { configureSurfaceTexture } from './texture-quality.js';
import { WATER_LEVEL } from './water.js';

export function findDragonBreathTarget(kind, position, heightAt, output = new THREE.Vector3()) {
  if (kind === 'fire') {
    const horizontal = position.x * .42, depth = -10 + (position.z + 10) * .42;
    return output.set(horizontal, heightAt(horizontal, depth) + .12, depth);
  }
  let score = Infinity;
  output.set(position.x, WATER_LEVEL, position.z);
  for (let radius = 8; radius <= 145; radius += 5) {
    for (let sample = 0; sample < 32; sample++) {
      const angle = sample / 32 * Math.PI * 2;
      const horizontal = position.x + Math.cos(angle) * radius, depth = position.z + Math.sin(angle) * radius;
      if (Math.max(Math.abs(horizontal), Math.abs(depth)) > 165 || heightAt(horizontal, depth) > WATER_LEVEL - .8) continue;
      const candidate=new THREE.Vector3(horizontal,WATER_LEVEL,depth),direction=candidate.clone().sub(position).normalize();
      const obstruction=traceBreathTerrain(position,direction,position.distanceTo(candidate)+.2,heightAt);
      if(obstruction?.dry)continue;
      const cost = radius + Math.hypot(horizontal, depth + 10) * .015;
      if (cost < score) { score = cost; output.set(horizontal, WATER_LEVEL, depth); }
    }
    if (score < Infinity) break;
  }
  return output;
}

export function findDragonRig(model) {
  const rig = { head: null, jaw: null, pelvis: null, breath: null };
  model.traverse(object => {
    if (!object.isBone) return;
    if (/^head[._\d]/i.test(object.name)) rig.head = object;
    if (/^jaw_01/i.test(object.name)) rig.jaw = object;
    if (/^pelvis/i.test(object.name)) rig.pelvis = object;
    if (/^fireBreath/i.test(object.name)) rig.breath = object;
  });
  if (!rig.head || !rig.pelvis) throw new Error('Dragon asset requires animated head and pelvis bones.');
  return rig;
}

export function attachDragonMouth(rig) {
  const socket = new THREE.Object3D(); socket.name = 'Animated mouth breath socket';
  socket.position.set(0, 2.22, -.13);
  socket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0));
  rig.head.add(socket);
  return socket;
}

export function lightDragonMaterial(material, kind, uniforms) {
  const copy = material.clone(); copy.metalness = .035; copy.roughness = .64; copy.aoMapIntensity = .52;
  copy.color.set(kind === 'ice' ? '#d0e6f2' : '#fff1df');
  const previous = copy.onBeforeCompile;
  copy.onBeforeCompile = (shader, renderer) => {
    previous.call(copy, shader, renderer); Object.assign(shader.uniforms,{uDragonElement:{value:new THREE.Color(kind==='ice'?'#78cfff':'#ff6a16')},uDragonBreath:{value:0}}, uniforms);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uDragonFill,uDragonRim,uDragonBreath;uniform vec3 uDragonElement;`)
      .replace('#include <opaque_fragment>', `
        vec3 dragonWorldNormal=inverseTransformDirection(normal,viewMatrix);
        float skyFacing=.32+.68*max(0.0,dragonWorldNormal.y);
        float moonFacing=max(0.0,dot(dragonWorldNormal,normalize(vec3(-.45,.65,.55))));
        float wingRim=pow(1.0-abs(dot(normal,normalize(vViewPosition))),2.8);
        outgoingLight+=diffuseColor.rgb*vec3(.22,.32,.43)*(skyFacing+moonFacing*.35)*uDragonFill;
        outgoingLight+=uDragonElement*wingRim*uDragonRim*(.24+uDragonBreath*.28);
        float litScales=pow(clamp(dot(diffuseColor.rgb,vec3(.21,.71,.08))*1.8,0.0,1.0),3.0);
        outgoingLight+=uDragonElement*litScales*(.045+uDragonBreath*.17);
        #include <opaque_fragment>`);
  };
  copy.customProgramCacheKey = () => `dragon-elemental-scales-v2-${kind}`;
  return copy;
}

export function sampleDragonFlight(time, kind, settings, heightAt, output = {}) {
  const phase = time * .105 + (kind === 'ice' ? 3.35 : .2);
  const ice = kind === 'ice';
  const radiusX = ice ? 104 : 58, radiusZ = ice ? 91 : 45;
  const radialWander = ice ? Math.sin(phase * 3) * 5 : 0;
  const horizontal = Math.sin(phase) * (radiusX + radialWander), depth = Math.cos(phase) * (radiusZ + radialWander) - 10;
  let terrain = heightAt(horizontal, depth);
  for (let sample = 0; sample < 8; sample++) {
    const angle = sample * Math.PI * .25;
    terrain = Math.max(terrain, heightAt(horizontal + Math.cos(angle) * 13 * settings.dragonSize,
      depth + Math.sin(angle) * 13 * settings.dragonSize));
  }
  output.position ||= new THREE.Vector3();
  output.position.set(horizontal, terrain + settings.dragonAltitude * (ice ? .76 : 1) + Math.sin(phase * 2.7) * 1.8, depth);
  const radialVelocity=ice?Math.cos(phase*3)*15:0;
  output.yaw = Math.atan2(Math.cos(phase)*(radiusX+radialWander)+Math.sin(phase)*radialVelocity,
    -Math.sin(phase)*(radiusZ+radialWander)+Math.cos(phase)*radialVelocity);
  output.bank = Math.sin(phase * 1.4) * .12;
  return output;
}

function disposeModel(model, geometries, textures, materials, skeletons) {
  model.traverse(object => {
    if (!object.isMesh) return;
    geometries.add(object.geometry);
    if (object.skeleton) skeletons.add(object.skeleton);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
}

export async function createDragons({ scene, terrainMaterial, heightAt, assetBase, decoderPath, onBloom, mobile = false,
  reducedMotion = false, anisotropy = 8, loadModel }) {
  const decoder = new DRACOLoader().setDecoderPath(decoderPath).setWorkerLimit(1);
  let asset;
  try {
    asset = await (loadModel ? loadModel() : new GLTFLoader().setDRACOLoader(decoder).loadAsync(`${assetBase}demon_dragon_full_texture.glb`));
  } finally { decoder.dispose(); }
  const clip = asset.animations.find(animation => /flying/i.test(animation.name));
  if (!clip) throw new Error('The dragon GLB does not contain a flying animation.');
  const group = new THREE.Group(); group.name = 'Fire and ice dragons'; scene.add(group);
  const ground = createDragonGroundEffect(terrainMaterial);
  const dragons = [];
  for (const [index, kind] of ['fire', 'ice'].entries()) {
    const model = cloneSkeleton(asset.scene), rig = findDragonRig(model);
    const wrapper = new THREE.Group(); wrapper.name = `${kind} dragon flight`; wrapper.add(model); group.add(wrapper);
    const materials = new Map();
    const lighting = { uDragonFill: { value: 1.15 }, uDragonRim: { value: .8 },uDragonBreath:{value:0} };
    model.traverse(object => {
      if (!object.isMesh) return;
      object.frustumCulled = false;
      const tint = material => {
        if (!materials.has(material)) {
          for(const texture of Object.values(material))if(texture?.isTexture)configureSurfaceTexture(texture,anisotropy);
          const copy = lightDragonMaterial(material,kind,lighting);
          materials.set(material, copy);
        }
        return materials.get(material);
      };
      object.material = Array.isArray(object.material) ? object.material.map(tint) : tint(object.material);
    });
    const mixer = new THREE.AnimationMixer(model), action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity).play(); mixer.setTime(index * 2.4);
    model.updateMatrixWorld(true);
    const center = rig.pelvis.getWorldPosition(new THREE.Vector3()); model.position.sub(center);
    const socket = attachDragonMouth(rig);
    const effect = createDragonBreath({ kind, scene, heightAt, onBloom, mobile });
    dragons.push({ kind, model, wrapper, rig, socket, mixer, action, effect, strength: 0,
      flight: {}, target: new THREE.Vector3(), targetReady: false, manualUntil: -1, scale: 9.4, initialized: false, lighting });
  }
  let timeline = 0, flightTime = 0, lastTime = 0, disposed = false;
  const rotation = new THREE.Euler(0, 0, 0, 'YXZ');
  return { group, dragons, ground,
    update(time, delta, settings) {
      if (disposed) return;
      lastTime = time; timeline += delta;
      group.visible = Boolean(settings.dragonsEnabled);
      const flightSpeed = settings.dragonFlightSpeed * (reducedMotion ? .12 : 1);
      if (settings.dragonsEnabled) flightTime += delta * flightSpeed;
      for (const dragon of dragons) {
        dragon.lighting.uDragonFill.value=settings.dragonLighting??1.15;
        dragon.lighting.uDragonRim.value=settings.dragonRim??.8;
        const cycle = (timeline + (dragon.kind === 'ice' ? 7 : 1)) % 12;
        const automatic = settings.dragonBreathEnabled && cycle > 1.7 && cycle < 5.5;
        const active = settings.dragonsEnabled && (automatic || time < dragon.manualUntil);
        dragon.strength = THREE.MathUtils.damp(dragon.strength, active ? 1 : 0, active ? 5.5 : 3.4, delta);
        dragon.lighting.uDragonBreath.value=dragon.strength;
        if (settings.dragonsEnabled) dragon.mixer.update(delta * Math.max(.08, flightSpeed) * .78);
        if (dragon.rig.jaw && settings.dragonsEnabled) dragon.rig.jaw.rotateX(-dragon.strength * .22);
        const flight = sampleDragonFlight(flightTime, dragon.kind, settings, heightAt, dragon.flight);
        const heightBlend = 1 - Math.exp(-delta * 1.5);
        dragon.wrapper.position.x = flight.position.x; dragon.wrapper.position.z = flight.position.z;
        dragon.wrapper.position.y = dragon.initialized ? THREE.MathUtils.lerp(dragon.wrapper.position.y, flight.position.y, heightBlend) : flight.position.y;
        dragon.initialized = true;
        rotation.set(.10 + dragon.strength * .36, flight.yaw, flight.bank);
        if(dragon.targetReady){
          const offsetX=dragon.target.x-flight.position.x,offsetZ=dragon.target.z-flight.position.z;
          const aimYaw=Math.atan2(offsetX,offsetZ);
          rotation.y+=Math.atan2(Math.sin(aimYaw-flight.yaw),Math.cos(aimYaw-flight.yaw))*dragon.strength*.85;
          rotation.x=THREE.MathUtils.lerp(rotation.x,Math.atan2(dragon.wrapper.position.y-dragon.target.y,Math.hypot(offsetX,offsetZ)),dragon.strength*.7);
        }
        dragon.wrapper.quaternion.setFromEuler(rotation);
        dragon.wrapper.scale.setScalar(dragon.scale * settings.dragonSize);
        dragon.wrapper.updateMatrixWorld(true);
        if (active && !dragon.targetReady) {
          findDragonBreathTarget(dragon.kind, dragon.wrapper.position, heightAt, dragon.target);
          dragon.targetReady = true;
        }
        if (!active && dragon.strength < .02) dragon.targetReady = false;
        dragon.effect.update(time, delta, dragon.socket, dragon.strength, settings, dragon.targetReady ? dragon.target : null);
      }
      ground.update(delta, dragons[0], dragons[1], settings);
    },
    breathe(kind = 'both') {
      for (const dragon of dragons) if (kind === 'both' || dragon.kind === kind) dragon.manualUntil = lastTime + 4.5;
    },
    getState() { return dragons.map(dragon => ({ kind: dragon.kind, clip: clip.name, bone: dragon.socket.parent.name,
      strength: dragon.strength, position: dragon.wrapper.position.toArray(), mouth: dragon.effect.origin.toArray(),
      direction: dragon.effect.direction.toArray(), impact: dragon.effect.impact?.point.toArray() || null,
      impactDry: dragon.effect.impact?.dry ?? null, target: dragon.targetReady ? dragon.target.toArray() : null })); },
    dispose() {
      if (disposed) return; disposed = true;
      ground.dispose(); scene.remove(group);
      const geometries = new Set(), textures = new Set(), materials = new Set(), skeletons = new Set();
      disposeModel(asset.scene, geometries, textures, materials, skeletons);
      for (const dragon of dragons) {
        dragon.mixer.stopAllAction(); dragon.mixer.uncacheRoot(dragon.model); dragon.effect.dispose();
        disposeModel(dragon.model, geometries, textures, materials, skeletons);
      }
      for (const resource of [...geometries, ...materials, ...textures, ...skeletons]) resource.dispose();
      for (const texture of textures) texture.source.data?.close?.();
    },
  };
}
