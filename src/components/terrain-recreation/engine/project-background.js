import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export const PROJECT_BACKGROUND_LAYER = 6;
export const PROJECT_BACKGROUND_DEFAULTS = Object.freeze({ amount: 1.961972, mix: 1, scale: 2.668918, exposure: .7, exposureOffset: -.4, refreshRate: 8 });
const DEBUG_MODES = ['off', 'navy', 'displacement', 'scene', 'warped', 'grade'];

export class ProjectBackgroundPass extends Pass {
  constructor({ scene, camera, objects, distortion, stormUniforms, beforeCapture = () => {}, reducedMotion = false }) {
    super();
    this.scene = scene; this.camera = camera; this.objects = objects;
    this.beforeCapture = beforeCapture; this.reducedMotion = reducedMotion;
    this.layers = objects.map(object => object.layers.mask);
    for (const object of objects) object.layers.enable(PROJECT_BACKGROUND_LAYER);
    this.source = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: true });
    this.source.texture.name = 'Retained terrain and river for project background';
    this.source.texture.generateMipmaps = true; this.source.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.bloomInput = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1, 0, .25);
    this.bloom.compositeMaterial.uniforms.bloomFactors.value = [.25, .5, .75, 1, .2];
    this.copyMaterial = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false,
      uniforms: { tSource: { value: this.source.texture } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: 'uniform sampler2D tSource;varying vec2 vUv;void main(){gl_FragColor=texture2D(tSource,vUv);}' });
    this.copyQuad = new FullScreenQuad(this.copyMaterial);
    this.uniforms = {
      tDiffuse: { value: null }, tScene: { value: this.source.texture }, tDistortion: { value: distortion },
      uProgress: { value: 0 }, uAspect: { value: 1 }, uScale: { value: PROJECT_BACKGROUND_DEFAULTS.scale },
      uAmount: { value: PROJECT_BACKGROUND_DEFAULTS.amount }, uMix: { value: PROJECT_BACKGROUND_DEFAULTS.mix },
      uDebug: { value: 0 },
      tBloom: { value: this.bloom.renderTargetsHorizontal[0].texture },
      uGlow: { value: 1 }, uThunderGlow: { value: .55 }, uBloom: { value: .4 }, uBlur: { value: 3.35 },
      uTime: { value: 0 }, uFrost: { value: .85 }, uFrostDensity: { value: .72 }, uFrostSize: { value: .4 },
      uViewportSize: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2() },
      uFlash: stormUniforms.uFlash, uFlashPosition: stormUniforms.uFlashPosition,
    };
    this.material = new THREE.ShaderMaterial({
      name: 'Scene-backed project atmosphere', glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false,
      uniforms: this.uniforms,
      vertexShader: `out vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
      fragmentShader: `precision highp float;
        uniform sampler2D tDiffuse,tScene,tDistortion,tBloom;
        uniform float uProgress,uAspect,uScale,uAmount,uMix,uFlash,uDebug;
        uniform float uGlow,uThunderGlow,uBloom,uBlur,uTime,uFrost,uFrostDensity,uFrostSize;
        uniform vec2 uPointer,uFlashPosition,uViewportSize;
        in vec2 vUv;out vec4 fragColor;
        vec3 sceneSample(vec2 point){return texture(tScene,clamp(point,vec2(.001),vec2(.999))).rgb;}
        float frostHash(vec2 point){
          vec3 seed=fract(vec3(point.xyx)*.1031);
          seed+=dot(seed,seed.yzx+33.33);
          return fract((seed.x+seed.y)*seed.z);
        }
        float frostGlints(float haze){
          if(uFrost<=0.||uFrostDensity<=0.)return 0.;
          vec2 gridSize=max(uViewportSize/5.,vec2(1.));
          vec2 grid=vUv*gridSize;
          vec2 cell=floor(grid);
          float seed=frostHash(cell);
          if(seed>=uFrostDensity)return 0.;
          vec2 center=vec2(frostHash(cell+17.3),frostHash(cell+43.7))*.6+.2;
          vec2 point=(fract(grid)-center)*uViewportSize/gridSize;
          float distanceSquared=dot(point,point);
          float radiusSquared=uFrostSize*uFrostSize;
          float variance=radiusSquared+.16;
          float core=exp(-distanceSquared/variance)*radiusSquared/variance;
          float clock=uTime*mix(.16,.28,frostHash(cell+62.4))+frostHash(cell+81.2)*23.;
          float cycle=floor(clock);
          float phase=fract(clock);
          vec2 eventCell=cell+vec2(cycle*13.7,cycle*7.9);
          float onset=.06+.26*frostHash(eventCell+103.1);
          float rise=.06+.06*frostHash(eventCell+126.7);
          float fall=.14+.16*frostHash(eventCell+157.3);
          float pulse=smoothstep(onset,onset+rise,phase)
            *(1.-smoothstep(onset+rise+.035,onset+rise+.035+fall,phase));
          float peak=mix(2.5,5.,frostHash(eventCell+193.8));
          float halo=exp(-distanceSquared/(variance+.45))*.06;
          return (core+halo)*(.008+pulse*peak)*mix(.3,1.,smoothstep(.035,.65,haze))*uFrost*.55;
        }
        void main(){
          vec2 distortionUv=(vUv-.5)*vec2(uAspect,1.)*uScale+.5;
          vec2 displacement=textureLod(tDistortion,distortionUv,max(0.,uBlur*1.3)).rg-.5;
          vec2 warpedUv=vUv+displacement*uAmount;
          vec3 warped=textureLod(tScene,warpedUv,uBlur).rgb;
          float level=dot(max(warped,vec3(0.)),vec3(.2126,.7152,.0722));
          float haze=pow(smoothstep(.005,.24,level),1.3);
          vec3 navy=vec3(.139,.141,.158);
          vec3 background=navy+vec3(.005,.013,.040)*haze*uGlow;
          vec3 bloom=texture(tBloom,vUv).rgb*2.;
          background+=min(bloom,vec3(.25))*vec3(.10,.18,.34)*uBloom;
          vec2 strike=(vUv-uFlashPosition)*vec2(uAspect*.6,.85);
          float sheet=exp(-dot(strike,strike)*2.5)*(.35+haze*.65);
          background+=vec3(.014,.030,.065)*sheet*uFlash*uThunderGlow;
          background+=vec3(.55,.86,1.25)*frostGlints(haze)*(1.+min(uFlash,1.)*.18);
          if(uDebug>.5){
            vec3 debugColor=navy;
            if(uDebug>1.5&&uDebug<2.5)debugColor=vec3(displacement+.5,.5);
            if(uDebug>2.5&&uDebug<3.5)debugColor=sceneSample(vUv);
            if(uDebug>3.5&&uDebug<4.5)debugColor=sceneSample(warpedUv);
            if(uDebug>4.5)debugColor=background;
            fragColor=vec4(debugColor,1.);return;
          }
          vec3 original=texture(tDiffuse,vUv).rgb;
          vec3 displaced=texture(tDiffuse,warpedUv).rgb;
          float progress=clamp(uProgress*uMix,0.,1.);
          vec3 transition=mix(original,displaced,progress*.65);
          fragColor=vec4(mix(transition,background,progress),1.);
        }`,
    });
    this.quad = new FullScreenQuad(this.material);
    this.viewport = new THREE.Vector4(); this.scissor = new THREE.Vector4();
    this.ready = false; this.lastCapture = -Infinity; this.captureCount = 0; this.time = 0;
    this.enabled = false; this.disposed = false;
  }

  update(time, state, pointer, settings = {}) {
    if (!state.active) this.ready = false;
    this.enabled = state.active; this.time = time;
    this.uniforms.uTime.value = this.reducedMotion ? 0 : time;
    this.uniforms.uProgress.value = state.amount;
    if (this.reducedMotion) this.uniforms.uPointer.value.set(0, 0); else this.uniforms.uPointer.value.copy(pointer);
    this.uniforms.uAmount.value = settings.projectDistortion ?? PROJECT_BACKGROUND_DEFAULTS.amount;
    this.uniforms.uScale.value = settings.projectDistortionScale ?? PROJECT_BACKGROUND_DEFAULTS.scale;
    this.uniforms.uGlow.value = settings.projectGlow ?? 1;
    this.uniforms.uThunderGlow.value = settings.projectThunderGlow ?? .55;
    this.uniforms.uBloom.value = settings.projectBloom ?? .4;
    this.uniforms.uBlur.value = settings.projectBackgroundBlur ?? 3.35;
    this.uniforms.uFrost.value = THREE.MathUtils.clamp(settings.projectFrost ?? .85, 0, 1.5);
    this.uniforms.uFrostDensity.value = THREE.MathUtils.clamp(settings.projectFrostDensity ?? .72, 0, 1);
    this.uniforms.uFrostSize.value = THREE.MathUtils.clamp(settings.projectFrostSize ?? .4, .2, 1.2);
    const threshold = settings.projectBloomThreshold ?? .25;
    if (this.bloom.threshold !== threshold) { this.bloom.threshold = threshold; this.ready = false; }
  }

  setDebug(mode = 'off') {
    const index = DEBUG_MODES.indexOf(mode);
    if (index < 0) return false;
    this.uniforms.uDebug.value = index; return true;
  }

  setSize(width, height) {
    this.uniforms.uAspect.value = width / Math.max(1, height);
    this.uniforms.uViewportSize.value.set(Math.max(1, width), Math.max(1, height));
    const scale = Math.min(1, 1024 / Math.max(1, width, height));
    const sourceWidth = Math.max(1, Math.round(width * scale));
    const sourceHeight = Math.max(1, Math.round(height * scale));
    if (this.source.width === sourceWidth && this.source.height === sourceHeight) return;
    this.source.setSize(sourceWidth, sourceHeight); this.ready = false;
    const bloomScale = Math.min(1, 512 / Math.max(sourceWidth, sourceHeight));
    this.bloomInput.setSize(Math.max(1, Math.round(sourceWidth * bloomScale)), Math.max(1, Math.round(sourceHeight * bloomScale)));
    this.bloom.setSize(this.bloomInput.width, this.bloomInput.height);
  }

  capture(renderer) {
    const target = renderer.getRenderTarget(), mask = this.camera.layers.mask, autoClear = renderer.autoClear;
    const scissorTest = renderer.getScissorTest();
    renderer.getViewport(this.viewport); renderer.getScissor(this.scissor);
    const callbacks = this.objects.filter(object => object.isReflector).map(object => [object, object.onBeforeRender]);
    try {
      this.beforeCapture(this.reducedMotion ? 0 : this.time);
      this.camera.layers.set(PROJECT_BACKGROUND_LAYER);
      for (const [object] of callbacks) object.onBeforeRender = () => {};
      renderer.autoClear = true; renderer.setRenderTarget(this.source); renderer.setScissorTest(false);
      renderer.clear(); renderer.render(this.scene, this.camera);
      renderer.setRenderTarget(this.bloomInput); this.copyQuad.render(renderer);
      this.bloom.render(renderer, null, this.bloomInput, 0, false);
      this.ready = true; this.lastCapture = this.time; this.captureCount++;
    } finally {
      for (const [object, callback] of callbacks) object.onBeforeRender = callback;
      this.camera.layers.mask = mask; renderer.autoClear = autoClear;
      renderer.setRenderTarget(target); renderer.setViewport(this.viewport); renderer.setScissor(this.scissor); renderer.setScissorTest(scissorTest);
    }
  }

  render(renderer, writeBuffer, readBuffer) {
    if (!this.ready || (!this.reducedMotion && this.time - this.lastCapture >= 1 / PROJECT_BACKGROUND_DEFAULTS.refreshRate)) this.capture(renderer);
    this.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    if (this.clear) renderer.clear();
    this.quad.render(renderer);
  }

  getState() { return { active: this.enabled, ready: this.ready, captures: this.captureCount, sourceSize: [this.source.width, this.source.height],
    ...PROJECT_BACKGROUND_DEFAULTS, debug: DEBUG_MODES[this.uniforms.uDebug.value], amount: this.uniforms.uAmount.value,
    scale: this.uniforms.uScale.value, glow: this.uniforms.uGlow.value, thunderGlow: this.uniforms.uThunderGlow.value,
    bloom: this.uniforms.uBloom.value, bloomThreshold: this.bloom.threshold, blur: this.uniforms.uBlur.value,
    frost: this.uniforms.uFrost.value, frostDensity: this.uniforms.uFrostDensity.value, frostSize: this.uniforms.uFrostSize.value }; }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.objects.forEach((object, index) => { object.layers.mask = this.layers[index]; });
    this.source.dispose(); this.material.dispose(); this.quad.dispose();
    this.bloom.dispose(); this.bloomInput.dispose(); this.copyMaterial.dispose(); this.copyQuad.dispose();
  }
}
