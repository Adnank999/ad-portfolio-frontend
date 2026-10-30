import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createArtworkHover, PROJECT_ARTWORK_DEFAULTS, PROJECT_ARTWORK_GLSL } from './project-artwork.js';
import { ProjectMediaLayer } from './project-media-layer.js';

const clamp = THREE.MathUtils.clamp;
const smooth = value => value * value * (3 - 2 * value);

export function createShowcaseTransition(reducedMotion = false) {
  let progress = 0, target = 0, artworkBlend = 1;
  return {
    open() { target = 1; },
    close() { target = 0; },
    swap() { artworkBlend = reducedMotion ? 1 : 0; },
    update(delta) {
      const seconds = clamp(Number(delta) || 0, 0, .1);
      progress = reducedMotion ? target : progress + clamp(target - progress, -seconds / 1.2, seconds / 1.2);
      artworkBlend = reducedMotion ? 1 : Math.min(1, artworkBlend + seconds / 1.1);
      return this.getState();
    },
    getState: () => ({ progress, amount: smooth(progress), artworkBlend: smooth(artworkBlend),
      active: progress > 0 || target > 0, needsWorld: target === 0 || progress < 1,
      phase: target ? progress === 1 ? 'open' : 'opening' : progress > 0 ? 'closing' : 'closed' }),
  };
}

export class ProjectShowcasePass extends ShaderPass {
  constructor({ reducedMotion = false, distortion = null, masks = {} } = {}) {
    super(new THREE.ShaderMaterial({
      name: 'Organic project artwork compositor', depthTest: false, depthWrite: false,
      uniforms: {
        tDiffuse: { value: null }, uNoise: { value: null }, uDistortion: { value: distortion }, uHideArtwork: { value: 0 },
        uErosionMask: { value: masks.erosion || null }, uRevealMask: { value: masks.reveal || null },
        uArtCrop: { value: new THREE.Vector4(0, 0, 1, 1) }, uPreviousCrop: { value: new THREE.Vector4(0, 0, 1, 1) },
        uNextCrop: { value: new THREE.Vector4(0, 0, 1, 1) },
        uArtwork: { value: null }, uPreviousArtwork: { value: null }, uNextArtwork: { value: null },
        uArtAspect: { value: 1 }, uPreviousAspect: { value: 1 }, uNextAspect: { value: 1 },
        uTime: { value: 0 }, uProgress: { value: 0 }, uArtBlend: { value: 1 },
        uAspect: { value: 1 }, uReducedMotion: { value: reducedMotion ? 1 : 0 },
        uViewportSize: { value: new THREE.Vector2(1, 1) },
        uFlash: { value: 0 }, uFlashPosition: { value: new THREE.Vector2(.45, .65) },
        uReveal: { value: new THREE.Vector3() }, uHover: { value: new THREE.Vector3() },
        uPointer: { value: new THREE.Vector2() },
        uHeroCenter: { value: new THREE.Vector2(.5, .7) }, uHeroSize: { value: new THREE.Vector2(.78, .6) },
        uNextCenter: { value: new THREE.Vector2(.5, -2) }, uNextSize: { value: new THREE.Vector2(.35, .5) },
        uMediaCenter: { value: new THREE.Vector2(.5, -4) }, uMediaSize: { value: new THREE.Vector2(.7, .5) },
      },
      vertexShader: `varying vec2 vUv;
        void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `precision highp float;
        uniform sampler2D tDiffuse,uNoise,uDistortion,uArtwork,uPreviousArtwork,uNextArtwork,uErosionMask,uRevealMask;
        uniform vec4 uArtCrop,uPreviousCrop,uNextCrop;
        uniform float uTime,uProgress,uArtBlend,uAspect,uReducedMotion,uArtAspect,uPreviousAspect,uNextAspect,uHideArtwork;
        uniform vec2 uPointer,uViewportSize,uHeroCenter,uHeroSize,uNextCenter,uNextSize,uMediaCenter,uMediaSize;
        uniform vec3 uReveal,uHover;
        varying vec2 vUv;
        vec2 coverUv(vec2 point,vec2 size,float aspect){
          float boxAspect=size.x*uViewportSize.x/max(size.y*uViewportSize.y,1.);
          vec2 fit=boxAspect>aspect?vec2(1.,aspect/boxAspect):vec2(boxAspect/aspect,1.);
          return clamp((point-.5)*fit+.5,vec2(.001),vec2(.999));
        }
        ${PROJECT_ARTWORK_GLSL}
        void main(){
          vec3 background=texture2D(tDiffuse,vUv).rgb;
          if(uHideArtwork>.5){gl_FragColor=vec4(background,1.);return;}
          float time=uTime*(1.-uReducedMotion);
          float pageWeight=smoothstep(.1,.85,uProgress);
          vec3 project=background;
          vec2 local=(vUv-uHeroCenter)/max(uHeroSize,vec2(.001))+.5;
          if(abs(local.x-.5)<.5&&abs(local.y-.5)<.5){
            vec2 displacement=artworkDisplacement(local,uHeroSize,uHover.x);
            vec2 imageUv=artworkUv(local,uHeroSize,uArtAspect,uHover.x,displacement);
            vec3 artwork=texture2D(uArtwork,uArtCrop.xy+imageUv*uArtCrop.zw).rgb;
            if(uArtBlend<.9999){
              vec2 previousUv=artworkUv(local,uHeroSize,uPreviousAspect,uHover.x,displacement);
              vec3 previous=texture2D(uPreviousArtwork,uPreviousCrop.xy+previousUv*uPreviousCrop.zw).rgb;
              artwork=mix(previous,artwork,artworkReveal(local,uArtBlend,displacement));
            }
            vec3 mask=artworkMask(local,uHeroSize,uReveal.x,uHover.x,0.,time,displacement);
            project=artworkOver(project,artwork,mask,pageWeight);
          }
          vec2 nextLocal=(vUv-uNextCenter)/max(uNextSize,vec2(.001))+.5;
          if(abs(nextLocal.x-.5)<.5&&abs(nextLocal.y-.5)<.5&&uReveal.z>.001){
            vec2 displacement=artworkDisplacement(nextLocal,uNextSize,uHover.z);
            vec3 mask=artworkMask(nextLocal,uNextSize,uReveal.z,uHover.z,1.,time,displacement);
            vec2 nextUv=artworkUv(nextLocal,uNextSize,uNextAspect,uHover.z,displacement);
            vec3 nextArt=texture2D(uNextArtwork,uNextCrop.xy+nextUv*uNextCrop.zw).rgb;
            project=artworkOver(project,nextArt,mask,pageWeight);
          }
          gl_FragColor=vec4(project,1.);
        }`,
    }));
    this.transition = createShowcaseTransition(reducedMotion);
    this.projectId = null;
    this.enabled = false;
    this.pointer = new THREE.Vector2();
    this.reducedMotion = reducedMotion;
    this.revealTarget = new THREE.Vector3(1, 0, 0);
    this.hoverMotion = createArtworkHover(reducedMotion);
    this.mediaLayer = new ProjectMediaLayer(this.uniforms, reducedMotion);
  }

  setProject(id, artwork, nextArtwork, noise, regions = {}) {
    const uniforms = this.uniforms;
      if (this.projectId === id && uniforms.uArtwork.value === artwork && uniforms.uNextArtwork.value === nextArtwork) return;
    uniforms.uPreviousArtwork.value = uniforms.uArtwork.value || artwork;
    uniforms.uPreviousAspect.value = uniforms.uArtAspect.value;
    uniforms.uPreviousCrop.value.copy(uniforms.uArtCrop.value);
    uniforms.uArtwork.value = artwork; uniforms.uNextArtwork.value = nextArtwork;
    const crop = (target, region) => {
      const [left, top, width, height] = region || [0, 0, 1, 1];
      target.set(left, 1 - top - height, width, height);
    };
    crop(uniforms.uArtCrop.value, regions.current); crop(uniforms.uNextCrop.value, regions.next);
    uniforms.uArtAspect.value = (artwork.image?.width || 1) * uniforms.uArtCrop.value.z / ((artwork.image?.height || 1) * uniforms.uArtCrop.value.w);
    uniforms.uNextAspect.value = (nextArtwork.image?.width || 1) * uniforms.uNextCrop.value.z / ((nextArtwork.image?.height || 1) * uniforms.uNextCrop.value.w);
    uniforms.uNoise.value = noise;
    uniforms.uDistortion.value ||= noise;
    uniforms.uErosionMask.value ||= noise; uniforms.uRevealMask.value ||= noise;
    if (this.projectId) this.transition.swap();
    else { uniforms.uPreviousAspect.value = uniforms.uArtAspect.value; uniforms.uPreviousCrop.value.copy(uniforms.uArtCrop.value); }
    this.projectId = id;
  }

  update(time, delta) {
    const state = this.transition.update(delta);
    this.enabled = state.active;
    this.uniforms.uTime.value = this.reducedMotion ? 0 : time;
    this.uniforms.uProgress.value = state.amount;
    this.uniforms.uArtBlend.value = state.artworkBlend;
    this.uniforms.uPointer.value.lerp(this.pointer, 1 - Math.exp(-Math.min(delta, .1) * 5));
    const seconds = clamp(Number(delta) || 0, 0, .1);
    for (const axis of ['x', 'y', 'z']) {
      const reveal = this.uniforms.uReveal.value;
      reveal[axis] = this.reducedMotion ? this.revealTarget[axis] : reveal[axis] + clamp(this.revealTarget[axis] - reveal[axis], -seconds / PROJECT_ARTWORK_DEFAULTS.revealDuration, seconds / PROJECT_ARTWORK_DEFAULTS.revealDuration);
    }
    this.uniforms.uHover.value.copy(this.hoverMotion.update(seconds));
    this.mediaLayer.update(seconds, smooth(clamp((state.amount - .1) / .75, 0, 1)));
    return state;
  }

  resetImages() {
    this.revealTarget.set(1, 0, 0); this.uniforms.uReveal.value.set(0, 0, 0);
    this.hoverMotion.reset(); this.uniforms.uHover.value.set(0, 0, 0);
    this.mediaLayer.clear();
  }

  revealImage(slot) {
    const axis = { hero: 'x', media: 'y', next: 'z' }[slot];
    if (axis) this.revealTarget[axis] = 1;
  }

  setImageVisibility(slot, progress) {
    const axis = { hero: 'x', media: 'y', next: 'z' }[slot];
    if (axis) this.revealTarget[axis] = clamp(progress, 0, 1);
  }

  setMediaImage(id, image) { this.mediaLayer.setImage(id, image); }

  setMediaLayout(items, width, height) { this.mediaLayer.setLayout(items, width, height); }

  render(renderer, writeBuffer, readBuffer, delta, maskActive) {
    super.render(renderer, writeBuffer, readBuffer, delta, maskActive);
    if (this.uniforms.uHideArtwork.value > .5) return;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    try { this.mediaLayer.render(renderer); } finally { renderer.autoClear = autoClear; }
  }

  dispose() { this.mediaLayer.dispose(); super.dispose(); }

  hoverImage(slot, active) {
    const axis = { hero: 'x', media: 'y', next: 'z' }[slot];
    if (axis) this.hoverMotion.set(axis, active);
  }

  setStorm(flash, direction) {
    this.uniforms.uFlash.value = this.reducedMotion ? Math.min(.08, flash * .08) : clamp(flash, 0, 1.5);
    this.uniforms.uFlashPosition.value.set(.5 + (direction?.x || 0) * .45, .65);
  }

  setSize(width, height) { this.uniforms.uAspect.value = width / Math.max(1, height); }

  setLayout(hero, next, width, height, media = null) {
    this.uniforms.uViewportSize.value.set(width,height);
    for (const [rectangle, center, size] of [[hero, 'uHeroCenter', 'uHeroSize'], [next, 'uNextCenter', 'uNextSize'], [media, 'uMediaCenter', 'uMediaSize']]) {
      if (!rectangle) continue;
      this.uniforms[center].value.set((rectangle.left + rectangle.width / 2) / width, 1 - (rectangle.top + rectangle.height / 2) / height);
      this.uniforms[size].value.set(Math.max(.001, rectangle.width / width), Math.max(.001, rectangle.height / height));
    }
  }
}
