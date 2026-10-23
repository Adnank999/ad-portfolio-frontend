import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export const WATER_LEVEL = 1.2;

export function createRiverMask(heightAt, resolution = 768) {
  const width = resolution, height = resolution;
  const pixels = new Uint8Array(width * height * 4);
  const bankDistances = new Float32Array(width * height);
  for (let index = 0; index < pixels.length; index += 4) {
    const column = (index / 4) % width;
    const row = Math.floor(index / 4 / width);
    const depth = WATER_LEVEL - heightAt((column / (width - 1) - .5) * 340, (row / (height - 1) - .5) * 340);
    const channel = THREE.MathUtils.smoothstep(depth, -.3, .8);
    bankDistances[index / 4] = channel < .5 ? 0 : width + height;
    pixels.set([Math.round(channel * 255), Math.round(THREE.MathUtils.clamp(depth / 12, 0, 1) * 255), 0, 255], index);
  }
  const diagonal = Math.SQRT2;
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const index = row * width + column;
      bankDistances[index] = Math.min(bankDistances[index],
        column > 0 ? bankDistances[index - 1] + 1 : Infinity,
        row > 0 ? bankDistances[index - width] + 1 : Infinity,
        row > 0 && column > 0 ? bankDistances[index - width - 1] + diagonal : Infinity,
        row > 0 && column < width - 1 ? bankDistances[index - width + 1] + diagonal : Infinity);
    }
  }
  for (let row = height - 1; row >= 0; row--) {
    for (let column = width - 1; column >= 0; column--) {
      const index = row * width + column;
      bankDistances[index] = Math.min(bankDistances[index],
        column < width - 1 ? bankDistances[index + 1] + 1 : Infinity,
        row < height - 1 ? bankDistances[index + width] + 1 : Infinity,
        row < height - 1 && column < width - 1 ? bankDistances[index + width + 1] + diagonal : Infinity,
        row < height - 1 && column > 0 ? bankDistances[index + width - 1] + diagonal : Infinity);
      pixels[index * 4 + 2] = Math.round(THREE.MathUtils.clamp(bankDistances[index] * 340 / (width - 1) / 24, 0, 1) * 255);
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height);
  texture.flipY = true;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return {
    texture,
    sample(horizontal, vertical) {
      const column = THREE.MathUtils.clamp(Math.round(horizontal * (width - 1)), 0, width - 1);
      const row = THREE.MathUtils.clamp(Math.round((1 - vertical) * (height - 1)), 0, height - 1);
      return pixels[(row * width + column) * 4] / 255;
    },
    distanceToBank(horizontal, vertical) {
      const column = THREE.MathUtils.clamp(Math.round(horizontal * (width - 1)), 0, width - 1);
      const row = THREE.MathUtils.clamp(Math.round((1 - vertical) * (height - 1)), 0, height - 1);
      return pixels[(row * width + column) * 4 + 2] / 255 * 24;
    },
  };
}

export function createRiverWater(normalA, normalB, mask, flowNoise) {
  const shader = {
    name: 'StormRiverReflection',
    uniforms: {
      color: { value: new THREE.Color('#244863') },
      tDiffuse: { value: null },
      textureMatrix: { value: new THREE.Matrix4() },
      uNormalA: { value: null }, uNormalB: { value: null }, uMask: { value: null }, uNoise: { value: null },
      uTime: { value: 0 }, uFlash: { value: 0 }, uWet: { value: .86 },
      uBloomMode: { value: 0 },
      uIcePatches: { value: Array.from({ length: 12 }, () => new THREE.Vector4(0, 0, 0, 0)) },
      uGlow: { value: 1 }, uFlowSpeed: { value: .6 },
      uFlashDirection: { value: new THREE.Vector3(-.45, .35, -.86).normalize() },
      uFogColor: { value: new THREE.Color('#325875') }, uFogDensity: { value: .004 },
    },
    vertexShader: `
      uniform mat4 textureMatrix;
      varying vec2 vUv;
      varying vec4 vReflection;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vReflection = textureMatrix * vec4(position, 1.0);
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse, uNormalA, uNormalB, uMask, uNoise;
      uniform float uTime, uFlash, uWet, uFogDensity, uGlow, uFlowSpeed, uBloomMode;
      uniform vec3 uFlashDirection, uFogColor;
      uniform vec4 uIcePatches[12];
      varying vec2 vUv;
      varying vec4 vReflection;
      varying vec3 vWorld;
      void main() {
        vec3 river = texture2D(uMask, vUv).rgb;
        float channel = river.r;
        if (channel < .08) discard;
        float time = uTime * uFlowSpeed;
        vec2 flow = vWorld.xz * .035;
        vec3 rippleA = texture2D(uNormalA, flow + vec2(time * .014, time * .006)).xyz * 2.0 - 1.0;
        vec3 rippleB = texture2D(uNormalB, flow * 1.43 + vec2(-time * .009, time * .012)).xyz * 2.0 - 1.0;
        vec3 normal = normalize(vec3((rippleA.xy + rippleB.xy) * .16, 1.0)).xzy;
        vec3 eye = normalize(cameraPosition - vWorld);
        float fresnel = .08 + .92 * pow(1.0 - max(dot(normal, eye), 0.0), 4.0);
        vec2 reflectionUv = vReflection.xy / vReflection.w + normal.xz * .018;
        reflectionUv = clamp(reflectionUv, .003, .997);
        float blur = .007+.009*(1.0-fresnel);
        vec2 blurStep=vec2(blur,blur*.7);
        vec3 reflection=texture2D(tDiffuse,reflectionUv).rgb*.25;
        reflection+=texture2D(tDiffuse,clamp(reflectionUv+vec2(blurStep.x,0.0),.003,.997)).rgb*.125;
        reflection+=texture2D(tDiffuse,clamp(reflectionUv-vec2(blurStep.x,0.0),.003,.997)).rgb*.125;
        reflection+=texture2D(tDiffuse,clamp(reflectionUv+vec2(0.0,blurStep.y),.003,.997)).rgb*.125;
        reflection+=texture2D(tDiffuse,clamp(reflectionUv-vec2(0.0,blurStep.y),.003,.997)).rgb*.125;
        reflection+=texture2D(tDiffuse,clamp(reflectionUv+blurStep,.003,.997)).rgb*.0625;
        reflection+=texture2D(tDiffuse,clamp(reflectionUv-blurStep,.003,.997)).rgb*.0625;
        reflection+=texture2D(tDiffuse,clamp(reflectionUv+vec2(blurStep.x,-blurStep.y),.003,.997)).rgb*.0625;
        reflection+=texture2D(tDiffuse,clamp(reflectionUv+vec2(-blurStep.x,blurStep.y),.003,.997)).rgb*.0625;
        vec2 cloudUv = vWorld.xz * vec2(.0017, .0033) + vec2(.23, .57) + vec2(time * .0025, -time * .0011);
        vec2 warp = vec2(texture2D(uNoise, cloudUv * .73).r,
          texture2D(uNoise, cloudUv * .91 + vec2(.37, .62)).r) - .5;
        float cloud = texture2D(uNoise, cloudUv + warp * .48 + normal.xz * .06).r * .6
          + texture2D(uNoise, cloudUv * 2.14 - vec2(time * .003, 0.0)).r * .28
          + texture2D(uNoise, cloudUv * 4.7 + normal.xz * .1).r * .12;
        float cloudLight = pow(smoothstep(.32, .73, cloud), 2.0);
        float lightRibbon = exp(-pow((vWorld.x + vWorld.z * .28
          + sin(vWorld.z * .025 + time * .13) * 23.0) / 63.0, 2.0));
        float brokenHighlight = .65 + .35 * smoothstep(-.3, .6, rippleA.x + rippleB.y);
        float reflectedCloud = cloudLight * (.12 + lightRibbon * .88);
        vec3 deep = vec3(.018, .04, .075);
        vec3 water = mix(deep, reflection * vec3(.68, .86, 1.0), .1 + fresnel * .22);
        water += vec3(.15, .43, .78) * reflectedCloud * uGlow * 1.45 * brokenHighlight;
        vec2 strikeAxis = normalize(uFlashDirection.xz);
        float crossStrike = dot(vWorld.xz, vec2(-strikeAxis.y, strikeAxis.x));
        float flashPool = exp(-pow((crossStrike + uFlashDirection.x * 90.0
          + warp.x * 42.0) / 49.0, 2.0));
        float stormReflection = flashPool * (.28 + cloudLight * .72) * brokenHighlight;
        vec3 thunder=vec3(.28, .65, 1.05) * stormReflection * uFlash;
        float bankDistance = river.b * 24.0;
        float bankLight = exp(-bankDistance * .22) * (.2 + cloudLight * .8);
        vec3 bankColor=vec3(.045, .18, .32) * bankLight * uGlow * brokenHighlight;
        water += bankColor;
        thunder += bankColor*uFlash*.5;
        float shore = exp(-bankDistance * .95);
        float capillary = texture2D(uNormalA, flow * 11.0 + vec2(time * .03, -time * .009)).r;
        float shoreBreakup = .15+.85*smoothstep(.46,.65,capillary);
        water += shore * vec3(.026, .09, .15) * (.6 + uWet * .4) * shoreBreakup * uGlow;
        float glint = pow(max(0.0,capillary-.57)*2.3,3.0)*shore;
        vec3 pearl = .5+.5*cos(vec3(0.0,2.0,4.0)+rippleA.x*5.0+rippleB.y*3.0);
        water += pearl * glint * .32 * (.6 + uWet * .4);
        float frost=0.0;
        for(int iceIndex=0;iceIndex<12;iceIndex++){
          vec4 stamp=uIcePatches[iceIndex];
          float radial=length(vWorld.xz-stamp.xy);
          float edge=texture2D(uNoise,vWorld.xz*.23).r;
          frost=max(frost,(1.0-smoothstep(2.0+edge,7.0+edge*2.0,radial))*stamp.w);
        }
        float crystal=texture2D(uNoise,vWorld.xz*2.4).r;
        vec2 iceCell=fract(vWorld.xz*.68+sin(vWorld.zx*.21)*.32);
        float cracks=pow(1.0-min(min(iceCell.x,1.0-iceCell.x),min(iceCell.y,1.0-iceCell.y)),22.0);
        vec3 frozen=mix(vec3(.15,.32,.42),vec3(.65,.81,.88),crystal*.6+cracks*.4);
        water=mix(water,frozen,frost*.86);
        water+=vec3(.08,.28,.38)*cracks*frost*.3;
        float distanceFog = 1.0 - exp(-pow(distance(cameraPosition, vWorld) * uFogDensity, 2.0));
        water = mix(water, uFogColor, distanceFog * .65);
        thunder *= 1.0-distanceFog*.65;
        water = uBloomMode>1.5 ? thunder : water+thunder*(uBloomMode<.5?1.0:0.0);
        gl_FragColor = vec4(water, smoothstep(.12, .4, channel) * .98);
      }
    `,
  };
  const mesh = new Reflector(new THREE.PlaneGeometry(340, 340), {
    shader, textureWidth: 768, textureHeight: 512, multisample: 0, clipBias: .003,
  });
  mesh.name = 'Reflective river channels';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WATER_LEVEL;
  mesh.material.transparent = true;
  mesh.material.depthWrite = false;
  mesh.renderOrder = 1;
  mesh.material.uniforms.uNormalA.value = normalA;
  mesh.material.uniforms.uNormalB.value = normalB;
  mesh.material.uniforms.uMask.value = mask;
  mesh.material.uniforms.uNoise.value = flowNoise;
  const reflect = mesh.onBeforeRender, hidden = [];
  let frameTime = 0, lastReflection = -Infinity, reflectionFps = 30, forceReflection = true, previousFlash = 0;
  let reflectDragons = true, reflectionCount = 0, reflectionScale = .42, exclusions = [];
  let viewportWidth=768,viewportHeight=512;
  let frostCursor=0,frostDue=0;
  mesh.onBeforeRender = function(renderer, scene, camera, ...parameters) {
    if (!forceReflection && frameTime-lastReflection < 1/reflectionFps) return;
    if (!reflectDragons) for (const object of exclusions) { hidden.push([object,object.visible]);object.visible=false; }
    try { reflect.call(this,renderer,scene,camera,...parameters);lastReflection=frameTime;reflectionCount++;forceReflection=false; }
    finally { for (const [object,visible] of hidden) object.visible=visible;hidden.length=0; }
  };
  return {
    mesh,
    setFrost(impact,strength,delta) {
      const patches=mesh.material.uniforms.uIcePatches.value;
      for(const patch of patches)patch.w=Math.max(0,patch.w-delta/22);
      frostDue-=delta;
      if(impact&&!impact.dry&&strength>.08&&frostDue<=0){
        patches[frostCursor].set(impact.point.x,impact.point.z,0,strength);
        frostCursor=(frostCursor+1)%patches.length;frostDue=.25;
      }
    },
    setReflectionExclusions(objects) { exclusions = objects; },
    getStats: () => ({ reflectionCount, reflectionFps, reflectionScale }),
    update(time, flash, settings, fog, direction) {
      const uniforms = mesh.material.uniforms;
      uniforms.uTime.value = time;
      uniforms.uFlash.value = flash;
      uniforms.uWet.value = settings.wetness;
      uniforms.uGlow.value = settings.riverGlow;
      uniforms.uFlowSpeed.value = settings.riverSpeed;
      uniforms.uFogColor.value.copy(fog.color);
      uniforms.uFogDensity.value = fog.density;
      uniforms.uFlashDirection.value.copy(direction);
      frameTime=time;forceReflection=forceReflection||flash>.001||previousFlash>.001;
      previousFlash=flash;reflectionFps=Math.max(10,settings.reflectionFps??30);
      reflectDragons=settings.reflectDragons!==false;
      const nextScale=settings.reflectionScale??.42;
      if(nextScale!==reflectionScale){reflectionScale=nextScale;this.resize(viewportWidth,viewportHeight);}
    },
    resize(width, height) {
      viewportWidth=width;viewportHeight=height;
      mesh.getRenderTarget().setSize(Math.min(768, Math.max(192, Math.round(width * reflectionScale))),
        Math.min(512, Math.max(128, Math.round(height * reflectionScale))));
      forceReflection=true;
    },
    dispose() { mesh.geometry.dispose(); mesh.dispose(); },
  };
}
