import * as THREE from 'three';
import { PROJECT_ARTWORK_GLSL } from './project-artwork.js';

export class ProjectMediaLayer {
  constructor(uniforms, reducedMotion) {
    this.uniforms = uniforms;
    this.reducedMotion = reducedMotion;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
    this.camera.position.z = 1;
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.images = new Map();
  }

  setImage(id, image) {
    if (this.images.has(id)) return;
    const texture = new THREE.Texture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    const material = new THREE.ShaderMaterial({
      name: 'Scroll-revealed project image', transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uDistortion: this.uniforms.uDistortion, uRevealMask: this.uniforms.uRevealMask,
        uErosionMask: this.uniforms.uErosionMask, uViewportSize: this.uniforms.uViewportSize,
        uTime: this.uniforms.uTime, uArtwork: { value: texture },
        uSize: { value: new THREE.Vector2(1, 1) },
        uAspect: { value: image.naturalWidth / Math.max(1, image.naturalHeight) },
        uReveal: { value: 0 }, uHover: { value: 0 }, uWeight: { value: 0 },
      },
      vertexShader: `varying vec2 vUv;
        void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `precision highp float;
        uniform sampler2D uArtwork,uDistortion,uRevealMask,uErosionMask;
        uniform vec2 uViewportSize,uSize;
        uniform float uAspect,uReveal,uHover,uWeight,uTime;
        varying vec2 vUv;
        vec2 coverUv(vec2 point,vec2 size,float aspect){
          float boxAspect=size.x*uViewportSize.x/max(size.y*uViewportSize.y,1.);
          vec2 fit=boxAspect>aspect?vec2(1.,aspect/boxAspect):vec2(boxAspect/aspect,1.);
          return clamp((point-.5)*fit+.5,vec2(.001),vec2(.999));
        }
        ${PROJECT_ARTWORK_GLSL}
        void main(){
          vec2 displacement=artworkDisplacement(vUv,uSize,uHover);
          vec2 imageUv=artworkUv(vUv,uSize,uAspect,uHover,displacement);
          vec3 image=sRGBTransferOETF(vec4(texture2D(uArtwork,imageUv).rgb,1.)).rgb;
          vec3 mask=artworkMask(vUv,uSize,uReveal,uHover,1.,uTime,displacement);
          float alpha=artworkAlpha(image,mask.x)*uWeight;
          gl_FragColor=vec4(image*mask.y,alpha);
        }`,
    });
    const mesh = new THREE.Mesh(this.geometry, material);
    mesh.frustumCulled = false;
    mesh.visible = false;
    this.scene.add(mesh);
    this.images.set(id, { mesh, texture, reveal: 0, hover: 0, visible: false });
  }

  setLayout(items, width, height) {
    for (const image of this.images.values()) image.visible = false;
    for (const { id, rectangle, progress, hovered } of items) {
      const image = this.images.get(id);
      if (!image) continue;
      const { left, top, width: imageWidth, height: imageHeight } = rectangle;
      image.visible = top < height && top + imageHeight > 0 && imageWidth > 0;
      image.reveal = progress;
      image.hover = hovered ? 1 : 0;
      image.mesh.position.set((left + imageWidth / 2) / width * 2 - 1, 1 - (top + imageHeight / 2) / height * 2, 0);
      image.mesh.scale.set(imageWidth / width * 2, imageHeight / height * 2, 1);
      image.mesh.material.uniforms.uSize.value.set(imageWidth / width, imageHeight / height);
    }
  }

  update(delta, weight) {
    const smoothing = this.reducedMotion ? 1 : 1 - Math.exp(-Math.min(.1, delta) * 8);
    for (const image of this.images.values()) {
      const uniforms = image.mesh.material.uniforms;
      uniforms.uReveal.value = THREE.MathUtils.lerp(uniforms.uReveal.value, image.reveal, smoothing);
      uniforms.uHover.value = THREE.MathUtils.lerp(uniforms.uHover.value, this.reducedMotion ? 0 : image.hover, smoothing);
      uniforms.uWeight.value = weight;
      image.mesh.visible = image.visible && weight > .001;
    }
  }

  render(renderer) { renderer.render(this.scene, this.camera); }

  clear() {
    for (const { mesh, texture } of this.images.values()) {
      mesh.material.dispose(); texture.dispose();
    }
    this.images.clear(); this.scene.clear();
  }

  dispose() { this.clear(); this.geometry.dispose(); }
}
