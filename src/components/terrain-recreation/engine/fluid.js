import * as THREE from 'three';

// Low-resolution ping-pong pointer feedback, inspired by the source bundle's
// uPosOld/uPosNew + persistence/diffusion pipeline. This is not verbatim site code.
export function createPointerFluid(renderer) {
  const settings = { resolutionScale: 0.36, persistence: 0.94, diffusion: 0.46, thickness: 0.055 };
  const targetOptions = {
    depthBuffer:false, stencilBuffer:false, magFilter:THREE.LinearFilter,
    minFilter:THREE.LinearFilter, format:THREE.RGBAFormat, type:THREE.UnsignedByteType
  };
  let read = new THREE.WebGLRenderTarget(32,32,targetOptions);
  let write = new THREE.WebGLRenderTarget(32,32,targetOptions);
  const uniforms = {
    tPrev:{value:read.texture},uPointer:{value:new THREE.Vector2(-4,-4)},
    uVelocity:{value:new THREE.Vector2()},uAspect:{value:1},uActive:{value:0},
    uDecay:{value:0.94},uDiffusion:{value:0.46},uThickness:{value:0.055}
  };
  const quadMaterial = new THREE.ShaderMaterial({uniforms,depthWrite:false,depthTest:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:`precision highp float;
      uniform sampler2D tPrev;
      uniform vec2 uPointer,uVelocity;
      uniform float uAspect,uActive,uDecay,uDiffusion,uThickness;
      varying vec2 vUv;
      void main(){
        vec2 uv=vUv;
        vec2 d=vec2(.007,.007*uAspect);
        vec4 previous=texture2D(tPrev,uv);
        vec4 blur=(texture2D(tPrev,uv+vec2(d.x,0.))+texture2D(tPrev,uv-vec2(d.x,0.))+
                   texture2D(tPrev,uv+vec2(0.,d.y))+texture2D(tPrev,uv-vec2(0.,d.y)))*.25;
        vec4 fluid=mix(previous,blur,uDiffusion*.38);
        fluid.b*=uDecay;
        fluid.rg=mix(vec2(.5),fluid.rg,uDecay);
        vec2 p=uv-uPointer;p.x*=uAspect;
        float stamp=exp(-dot(p,p)/max(.00002,uThickness*uThickness));
        float speed=min(length(uVelocity)*60.0,1.0);
        fluid.rg=mix(fluid.rg,clamp(.5+uVelocity*16.0,0.,1.),stamp*speed*uActive);
        fluid.b=clamp(fluid.b+stamp*speed*uActive*.65,0.,1.);
        gl_FragColor=vec4(fluid.rgb,1.);
      }`
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2),quadMaterial);
  const scene = new THREE.Scene();scene.add(mesh);
  const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  let pointer = new THREE.Vector2(-4,-4),previous = new THREE.Vector2(-4,-4),
      velocity = new THREE.Vector2(),active=false;
  function resize(w,h){
    const tw=Math.max(32,Math.round(w*settings.resolutionScale));
    const th=Math.max(32,Math.round(h*settings.resolutionScale));
    read.setSize(tw,th);write.setSize(tw,th);
    uniforms.uAspect.value=w/Math.max(1,h);
  }
  function move(u,v){
    if(!active)previous.set(u,v);
    pointer.set(u,v);active=true;
  }
  function leave(){active=false;previous.copy(pointer);}
  function update(dt){
    dt=Math.max(.001,Math.min(dt,.05));
    if(active){velocity.subVectors(pointer,previous).multiplyScalar(Math.min(2,.016/dt));
      previous.copy(pointer);} else velocity.multiplyScalar(Math.exp(-10*dt));
    uniforms.tPrev.value=read.texture;
    uniforms.uPointer.value.copy(pointer);
    uniforms.uVelocity.value.copy(velocity);
    uniforms.uActive.value=active?1:0;
    uniforms.uDecay.value=Math.pow(settings.persistence,dt*60);
    uniforms.uDiffusion.value=settings.diffusion;
    uniforms.uThickness.value=settings.thickness;
    const last=renderer.getRenderTarget();
    renderer.setRenderTarget(write);renderer.render(scene,camera);renderer.setRenderTarget(last);
    [read,write]=[write,read];
    return read.texture;
  }
  return {resize,move,leave,update,
    set(key,value){if(key in settings)settings[key]=Number(value);},
    dispose(){read.dispose();write.dispose();mesh.geometry.dispose();quadMaterial.dispose();}
  };
}

