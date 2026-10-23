import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { WATER_LEVEL } from './water.js';

export const RIVER_BLOOM_LAYER = 1;
export const FLAME_BLOOM_LAYER = 2;
export const DRAGON_BLOOM_LAYER = 3;
export const STORM_BLOOM_LAYER = 4;

export class SelectiveBloomPass extends Pass {
  constructor(scene, camera) {
    super();
    this.scene = scene; this.camera = camera;
    this.riverTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
    this.flameTarget = this.riverTarget.clone();
    this.dragonTarget = this.riverTarget.clone();
    this.stormTarget = this.riverTarget.clone();
    this.stormMask = new THREE.WebGLRenderTarget(1,1,{depthBuffer:false});
    this.stormMask.texture.name='Sky and river visibility mask';
    this.riverTarget.texture.name = 'River-only bloom sources';
    this.flameTarget.texture.name = 'Flame-only bloom sources';
    this.dragonTarget.texture.name = 'Dragon breath-only bloom sources';
    this.stormTarget.texture.name = 'Sky and river thunder-only bloom sources and mask';
    this.riverBloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .7, .55, .38);
    this.flameBloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .25, .45, .72);
    this.dragonBloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .45, .4, .6);
    this.stormBloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .65, .6, .18);
    this.stormFlash = 0; this.stormModes = new Set();
    this.maskMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,
      uniforms:{tSource:{value:null}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:'uniform sampler2D tSource;varying vec2 vUv;void main(){float mask=texture2D(tSource,vUv).a;gl_FragColor=vec4(vec3(mask),1.0);}'});
    this.maskQuad=new FullScreenQuad(this.maskMaterial);
    this.depthUniforms = {
      uBloomDepth: { value: null }, uBloomSize: { value: new THREE.Vector2(1, 1) }, uBloomOnly: { value: false },
    };
    this.materials = new Set(); this.reflectors = new Set(); this.dragonSources = new Set();
    this.composite = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: { tBase: { value: null }, tRiver: { value: null }, tFlame: { value: null }, tDragon: { value: null },
        tStorm: { value: null }, tStormMask: { value: null }, uStormEnabled: { value: 0 },
        tSceneDepth:{value:null},uInverseProjection:{value:camera.projectionMatrixInverse},uCameraWorld:{value:camera.matrixWorld},
        uWaterLevel:{value:WATER_LEVEL},
        uRiverEnabled: { value: 1 }, uFlameEnabled: { value: 1 }, uDragonEnabled: { value: 1 } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `uniform sampler2D tBase,tRiver,tFlame,tDragon,tStorm,tStormMask,tSceneDepth;
        uniform mat4 uInverseProjection,uCameraWorld;uniform float uWaterLevel;
        uniform float uRiverEnabled,uFlameEnabled,uDragonEnabled,uStormEnabled;varying vec2 vUv;
        void main(){vec3 color=texture2D(tBase,vUv).rgb;
          color+=texture2D(tRiver,vUv).rgb*uRiverEnabled+texture2D(tFlame,vUv).rgb*uFlameEnabled;
          color+=texture2D(tDragon,vUv).rgb*uDragonEnabled;
          if(uStormEnabled>.5){
            float depth=texture2D(tSceneDepth,vUv).r;
            vec4 viewPosition=uInverseProjection*vec4(vUv*2.0-1.0,depth*2.0-1.0,1.0);
            vec4 worldPosition=uCameraWorld*vec4(viewPosition.xyz/viewPosition.w,1.0);
            float visibleSurface=depth>.999999?1.0:1.0-step(uWaterLevel-.02,worldPosition.y);
            color+=texture2D(tStorm,vUv).rgb*texture2D(tStormMask,vUv).r*visibleSurface;
          }
          gl_FragColor=vec4(color,1.0);}`,
    });
    this.quad = new FullScreenQuad(this.composite);
    this.oldClearColor = new THREE.Color();
  }

  include(object, channel) {
    const layer = { river: RIVER_BLOOM_LAYER, flame: FLAME_BLOOM_LAYER, dragon: DRAGON_BLOOM_LAYER, storm: STORM_BLOOM_LAYER }[channel];
    if (layer === undefined) throw new Error(`Unknown bloom channel: ${channel}`);
    object.layers.enable(layer);
    object.userData.bloomChannel ||= channel;
    if (channel === 'dragon') this.dragonSources.add(object);
    if (object.isReflector) this.reflectors.add(object);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (channel === 'storm' && material?.uniforms?.uBloomMode) this.stormModes.add(material.uniforms.uBloomMode);
      if (!material || this.materials.has(material)) continue;
      this.materials.add(material);
      const uniforms = this.depthUniforms;
      const cacheKey = material.customProgramCacheKey();
      const declarations = 'uniform sampler2D uBloomDepth;uniform vec2 uBloomSize;uniform bool uBloomOnly;\n';
      const compare = material.depthTest === false ? '' : `
        if(uBloomOnly){float sceneDepth=texture2D(uBloomDepth,gl_FragCoord.xy/uBloomSize).r;
          if(gl_FragCoord.z>sceneDepth+.000002)discard;}
      `;
      const instrument = source => declarations + source.replace(/void\s+main\s*\(\s*\)\s*\{/, match => match + compare);
      if (material.isShaderMaterial) {
        Object.assign(material.uniforms, uniforms);
        material.fragmentShader = instrument(material.fragmentShader);
      } else {
        const previous = material.onBeforeCompile;
        material.onBeforeCompile = (shader, renderer) => {
          previous.call(material, shader, renderer);
          Object.assign(shader.uniforms, uniforms);
          shader.fragmentShader = instrument(shader.fragmentShader);
        };
      }
      material.customProgramCacheKey = () => `${cacheKey}|selective-bloom-depth-${material.depthTest}`;
      material.needsUpdate = true;
    }
  }

  update(settings, flash = 0) {
    this.riverBloom.strength = settings.riverBloom;
    this.riverBloom.threshold = settings.riverBloomThreshold;
    this.flameBloom.strength = settings.bloom;
    this.flameBloom.threshold = settings.bloomThreshold;
    this.dragonBloom.strength = settings.dragonsEnabled === false ? 0 : settings.dragonBloom ?? .45;
    this.dragonBloom.threshold = settings.dragonBloomThreshold ?? .6;
    this.stormBloom.strength = settings.thunderBloom ?? .65;
    this.stormBloom.threshold = settings.thunderBloomThreshold ?? .18;
    this.stormFlash = flash;
  }

  setSize(width, height) {
    const scale = Math.min(.5, 1024 / width, 768 / height);
    const targetWidth = Math.max(1, Math.round(width * scale)), targetHeight = Math.max(1, Math.round(height * scale));
    this.riverTarget.setSize(targetWidth, targetHeight); this.flameTarget.setSize(targetWidth, targetHeight);
    this.dragonTarget.setSize(targetWidth, targetHeight);
    this.stormTarget.setSize(targetWidth, targetHeight);
    this.stormMask.setSize(targetWidth,targetHeight);
    this.riverBloom.setSize(targetWidth, targetHeight); this.flameBloom.setSize(targetWidth, targetHeight);
    this.dragonBloom.setSize(targetWidth, targetHeight);
    this.stormBloom.setSize(targetWidth, targetHeight);
    this.depthUniforms.uBloomSize.value.set(targetWidth, targetHeight);
  }

  render(renderer, writeBuffer, readBuffer, deltaTime) {
    if (!readBuffer.depthTexture) throw new Error('Selective bloom requires the scene depth texture.');
    const cameraMask = this.camera.layers.mask, background = this.scene.background;
    const oldTarget = renderer.getRenderTarget(), oldAlpha = renderer.getClearAlpha(), oldAutoClear = renderer.autoClear;
    renderer.getClearColor(this.oldClearColor);
    const callbacks = Array.from(this.reflectors, reflector => [reflector, reflector.onBeforeRender]);
    const stormEnabled = this.stormBloom.strength > .0001 && this.stormFlash > .001;
    const dragonEnabled = this.dragonBloom.strength > .0001 && Array.from(this.dragonSources).some(object => {
      for (let ancestor = object; ancestor; ancestor = ancestor.parent) if (!ancestor.visible) return false;
      return true;
    });
    this.depthUniforms.uBloomDepth.value = readBuffer.depthTexture;
    this.depthUniforms.uBloomOnly.value = true;
    this.scene.background = null;
    for (const [reflector] of callbacks) reflector.onBeforeRender = () => {};
    try {
      renderer.setClearColor(0, 0); renderer.autoClear = false;
      for (const [layer, target, bloom] of [
        [RIVER_BLOOM_LAYER, this.riverTarget, this.riverBloom],
        [FLAME_BLOOM_LAYER, this.flameTarget, this.flameBloom],
        [DRAGON_BLOOM_LAYER, this.dragonTarget, this.dragonBloom],
        [STORM_BLOOM_LAYER, this.stormTarget, this.stormBloom],
      ]) {
        if (bloom.strength <= .0001) continue;
        if (layer === DRAGON_BLOOM_LAYER && !dragonEnabled) continue;
        if (layer === STORM_BLOOM_LAYER && !stormEnabled) continue;
        for (const mode of this.stormModes) mode.value = layer === STORM_BLOOM_LAYER ? 2 : 1;
        this.camera.layers.set(layer);
        renderer.setRenderTarget(target); renderer.clear(); renderer.render(this.scene, this.camera);
        if(layer===STORM_BLOOM_LAYER){
          this.maskMaterial.uniforms.tSource.value=target.texture;
          renderer.setRenderTarget(this.stormMask);this.maskQuad.render(renderer);
        }
        bloom.render(renderer, null, target, deltaTime, false);
      }
    } finally {
      this.depthUniforms.uBloomOnly.value = false;
      for (const mode of this.stormModes) mode.value = 0;
      this.depthUniforms.uBloomDepth.value = null;
      this.camera.layers.mask = cameraMask; this.scene.background = background;
      for (const [reflector, callback] of callbacks) reflector.onBeforeRender = callback;
      renderer.setClearColor(this.oldClearColor, oldAlpha); renderer.autoClear = oldAutoClear;
      renderer.setRenderTarget(oldTarget);
    }
    const uniforms = this.composite.uniforms;
    uniforms.tBase.value = readBuffer.texture;
    uniforms.tRiver.value = this.riverBloom.renderTargetsHorizontal[0].texture;
    uniforms.tFlame.value = this.flameBloom.renderTargetsHorizontal[0].texture;
    uniforms.tDragon.value = this.dragonBloom.renderTargetsHorizontal[0].texture;
    uniforms.tStorm.value = this.stormBloom.renderTargetsHorizontal[0].texture;
    uniforms.tStormMask.value = this.stormMask.texture;
    uniforms.tSceneDepth.value=readBuffer.depthTexture;
    uniforms.uStormEnabled.value = stormEnabled ? 1 : 0;
    uniforms.uRiverEnabled.value = this.riverBloom.strength > .0001 ? 1 : 0;
    uniforms.uFlameEnabled.value = this.flameBloom.strength > .0001 ? 1 : 0;
    uniforms.uDragonEnabled.value = dragonEnabled ? 1 : 0;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    try{this.quad.render(renderer);}finally{uniforms.tSceneDepth.value=null;}
  }

  dispose() {
    this.riverTarget.dispose(); this.flameTarget.dispose();
    this.dragonTarget.dispose(); this.dragonBloom.dispose();
    this.stormTarget.dispose(); this.stormBloom.dispose(); this.stormModes.clear();
    this.stormMask.dispose();this.maskMaterial.dispose();this.maskQuad.dispose();
    this.riverBloom.dispose(); this.flameBloom.dispose(); this.composite.dispose(); this.quad.dispose();
    this.materials.clear(); this.reflectors.clear(); this.dragonSources.clear();
  }
}

