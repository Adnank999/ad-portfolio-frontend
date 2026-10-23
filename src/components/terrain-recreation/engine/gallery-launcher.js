import * as THREE from 'three';

export function createGalleryLauncher({ reducedMotion = false } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;
  const material = new THREE.ShaderMaterial({
    name: 'Gallery iris / luminous orbit', transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { uTime: { value: 0 }, uHover: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: `varying vec2 vUv;
      void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float;varying vec2 vUv;uniform float uTime,uHover,uOpacity;
      float tile(vec2 point){vec2 distance=abs(point)-.075;return 1.-smoothstep(.004,.014,abs(max(distance.x,distance.y)));}
      void main(){
        vec2 point=(vUv-.5)*2.;float radius=length(point),angle=atan(point.y,point.x);
        float orbit=.54+uHover*.025;
        float rim=exp(-abs(radius-orbit)*150.);
        float halo=exp(-abs(radius-orbit)*12.)*(.24+uHover*.18);
        float arc=pow(max(0.,cos(angle*2.-uTime*.85)),12.);
        float stream=exp(-abs(radius-orbit-.055)*115.)*arc;
        float pin=exp(-length(point-vec2(cos(uTime*.7),sin(uTime*.7))*orbit)*95.);
        float glyph=tile(point-vec2(.12,.12))+tile(point-vec2(-.12,.12))+tile(point-vec2(.12,-.12))+tile(point+vec2(.12,.12));
        vec3 cool=mix(vec3(.16,.64,.9),vec3(.65,.94,1.),arc);
        vec3 color=cool*(rim*1.3+halo*1.8+stream*1.2)+vec3(.9,.61,.33)*pin+vec3(.76,.93,1.)*glyph;
        float alpha=clamp(rim*.75+halo+stream+pin+glyph*.85,0.,1.)*uOpacity;
        gl_FragColor=vec4(color,alpha);
      }`,
  });
  const geometry = new THREE.PlaneGeometry(1, 1);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  let layout = null;
  return {
    setLayout(value) {
      layout = value;
      if (!value) return;
      camera.left = -value.width / 2; camera.right = value.width / 2;
      camera.top = value.height / 2; camera.bottom = -value.height / 2; camera.updateProjectionMatrix();
      mesh.position.set(value.centerX - value.width / 2, value.height / 2 - value.centerY, 0);
      mesh.scale.setScalar(value.size * 1.85);
    },
    render(renderer, time, amount) {
      if (!layout || amount < .01) return;
      material.uniforms.uTime.value = reducedMotion ? 0 : time;
      material.uniforms.uHover.value = reducedMotion ? Number(layout.hovered) : THREE.MathUtils.lerp(material.uniforms.uHover.value, Number(layout.hovered), .12);
      material.uniforms.uOpacity.value = THREE.MathUtils.smoothstep(amount, .45, .95);
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      try { renderer.setRenderTarget(null); renderer.render(scene, camera); }
      finally { renderer.autoClear = autoClear; }
    },
    dispose() { geometry.dispose(); material.dispose(); scene.clear(); layout = null; },
  };
}
