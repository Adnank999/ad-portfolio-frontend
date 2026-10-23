import * as THREE from 'three';

// Source-guided, independently authored beacon/portal shaders. No verbatim
// production bundle code is required to render these effects.
export const CHARGE_DEFAULTS = Object.freeze({
  cold: 1.2, hover: .6, beamIn: 1.8, burstIn: .20, burstOut: .60,
  settle: .8, pinch: .72, flare: 1.10,
  spiralTwist: 9.42, spin: 1.0, spinCharged: 8.0, bandsPerSecond: 11.0,
});
const clamp = THREE.MathUtils.clamp;
const vertex = `varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
function additive(geometry, fragment, uniforms) {
  return new THREE.Mesh(geometry, new THREE.ShaderMaterial({
    vertexShader:vertex, fragmentShader:fragment, uniforms,
    transparent:true, depthWrite:false, depthTest:true,
    side:THREE.DoubleSide, blending:THREE.AdditiveBlending, toneMapped:false,
  }));
}

export function makeEnergyBeam(color) {
  const uniforms = {
    uColor:{value:color}, uTime:{value:0}, uHover:{value:0}, uActive:{value:0},
    uCharge:{value:0}, uBurst:{value:0}, uBandPhase:{value:0},
    uOpacity:{value:.86}, uTurbulence:{value:1.0},
  };
  const fragment = `precision highp float;
    varying vec2 vUv;
    uniform vec3 uColor;
    uniform float uTime,uHover,uActive,uCharge,uBurst,uBandPhase,uOpacity,uTurbulence;
    float hash(vec2 point){return fract(sin(dot(point,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 point){
      vec2 cell=floor(point),fraction=fract(point);
      fraction=fraction*fraction*(3.0-2.0*fraction);
      return mix(mix(hash(cell),hash(cell+vec2(1.0,0.0)),fraction.x),
        mix(hash(cell+vec2(0.0,1.0)),hash(cell+vec2(1.0,1.0)),fraction.x),fraction.y);
    }
    void main(){
      float height=vUv.y;
      float horizontal=(vUv.x-.5)*2.0;
      float flow=noise(vec2(height*5.0-uTime*.7,height*9.0-uTime*1.1));
      float center=(flow-.5)*.65*height*uTurbulence+sin(height*12.0-uTime*2.0)*height*.12;
      float width=mix(.55,.035,pow(height,.7));
      float body=exp(-pow((horizontal-center)/max(width,.025),2.0)*2.0);
      float wisps=noise(vec2(horizontal*5.0+height*3.0,height*15.0-uTime*2.6));
      float tongues=smoothstep(.2,.85,wisps)*exp(-pow((horizontal-center-.14)/max(width*.8,.035),2.0));
      float taper=pow(1.0-height,1.35)*smoothstep(0.0,.035,height);
      float core=exp(-pow(horizontal/.16,2.0))*exp(-height*9.0);
      float bands=pow(max(0.0,sin(height*26.0+uBandPhase)),9.0)*uCharge*.16;
      float alpha=((body*(.4+wisps*.5)+tongues*.3)*taper+core*.65+bands*body)
        *uOpacity*(.7+uHover*.35+uActive*.2+uBurst*.2);
      vec3 tint=mix(uColor,vec3(.74,.94,1.0),core*.5+uBurst*.15);
      gl_FragColor=vec4(tint,min(.7,alpha));
    }`;
  const mesh=additive(new THREE.PlaneGeometry(1,1,1,32),fragment,uniforms);
  mesh.scale.set(3.2,4,1);mesh.position.y=2;mesh.renderOrder=13;
  return mesh;
}

export function makeEnergySpiral(color) {
  const uniforms={uColor:{value:color},uTime:{value:0},uHover:{value:0},uActive:{value:0},
    uCharge:{value:0},uBurst:{value:0},uPhase:{value:0},uTwist:{value:9.42},uOpacity:{value:.82}};
  const fragment=`precision highp float;varying vec2 vUv;
    uniform vec3 uColor;uniform float uTime,uHover,uActive,uCharge,uBurst,uPhase,uTwist,uOpacity;
    void main(){
      float h=vUv.y;
      float wave=sin(vUv.x*18.8495559 + h*uTwist*2.0 - uPhase);
      float strand=pow(max(0.0,wave),17.0);
      float moving=exp(-pow(fract(h*3.5-uPhase*.16)-.5,2.0)*7.0);
      float tip=1.0-smoothstep(.47+uHover*.39,.75+uHover*.24,h);
      float intensity=.09+uHover*.63+uActive*.60+uCharge*.25+uBurst*.18;
      float a=strand*tip*moving*intensity*uOpacity;
      gl_FragColor=vec4(mix(uColor,vec3(1.0),strand*.29),a);
    }`;
  const mesh=additive(new THREE.CylinderGeometry(.12,1,1,52,64,true),fragment,uniforms);
  mesh.scale.set(1.3,9,1.3);mesh.position.y=4.5;mesh.renderOrder=14;
  mesh.material.side=THREE.FrontSide;
  return mesh;
}

// A layered, swirling shell: wispy ring, elliptical arcs and speckled filaments.
// The original site's swirl uses custom shaders; this is a visual recreation.
export function makePortalStorm(color) {
  const uniforms={uColor:{value:color},uTime:{value:0},uStage:{value:0},
    uBurst:{value:0},uHover:{value:0},uIntensity:{value:1.0},uPhase:{value:0},
    uOrangeMix:{value:.55},uSwirl:{value:1.0}};
  const fragment=`precision highp float;varying vec2 vUv;
    uniform vec3 uColor;
    uniform float uTime,uStage,uBurst,uHover,uIntensity,uPhase,uOrangeMix,uSwirl;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
                 mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    void main(){
      vec2 q=(vUv-.5)*2.0;float r=length(q);float a=atan(q.y,q.x);
      float t=uTime*(.38+.36*uSwirl),theta=a*2.7-r*5.1-t;
      float field=noise(vec2(theta*1.3,r*7.7-t*.7));
      float field2=noise(vec2(a*6.0+t*.7,r*12.0+t*.41));
      float warped=r + (field-.5)*.15 + sin(a*4.0+t*.7)*.043;
      float shellRadius=.88+.025*sin(a*3.0-t*.8);
      float shell=exp(-pow((warped-shellRadius)*24.0,2.0));
      float strands=pow(max(0.0,sin(a*5.0+(r-.7)*16.0-t*3.0+field*7.0)),5.0);
      float arcs=pow(max(0.0,sin(a*3.0+r*12.0-t*2.1)),3.0)
                  *exp(-pow((warped-.94)*18.0,2.0));
      float smoky=exp(-pow((r-.94)*6.0,2.0))*.045*field;
      float sparks=step(.974,hash(floor(q*78.0+uTime*vec2(2.0,-1.1))))
                 *exp(-pow((r-.83)*4.0,2.0));
      float opening=smoothstep(.08,.92,uStage);
      float alpha=(shell*(.12+.35*strands+.14*field2)+arcs*.14+smoky+sparks*.22)
                *opening*uIntensity*(1.0+uBurst*.25);
      alpha*=smoothstep(.70,.84,r);
      alpha*=1.0-smoothstep(1.12,1.38,warped);
      float warm=clamp(.35+.40*sin(a*2.0-t*.9)+.28*field,0.,1.);
      vec3 coral=vec3(1.0,.45,.27);
      vec3 col=mix(uColor,coral,warm*uOrangeMix);
      col=mix(col,vec3(1.0,.90,.78),min(.74,sparks*.6+strands*.18));
      gl_FragColor=vec4(col,min(.48,max(0.0,alpha)));
    }`;
  const mesh=additive(new THREE.PlaneGeometry(49,49),fragment,uniforms);
  mesh.material.depthTest=false;mesh.visible=false;mesh.frustumCulled=false;mesh.renderOrder=26;
  return mesh;
}

export function smooth01(t){t=clamp(t,0,1);return t*t*(3-2*t);}
export function chargeEnvelope(age,duration=CHARGE_DEFAULTS.cold) {
  const t=Math.max(0,age),charge=smooth01(t/(duration*.95));
  const stage=t/duration;
  const peak=Math.max(0,1-Math.abs(t-duration)/.20);
  const burst=Math.pow(peak,1.1);
  const settle=smooth01((t-duration)/.8);
  return {
    charging:(1-settle)*charge,
    burst,
    active:smooth01((t-duration)/.8),
    open:smooth01((t-duration*.72)/.65),
    gathering:smooth01(t/(duration*.75)),
    radius:stage<1?THREE.MathUtils.lerp(1,CHARGE_DEFAULTS.pinch,charge):
      THREE.MathUtils.lerp(CHARGE_DEFAULTS.flare,1,smooth01((t-duration)/.55)),
    spin:1+(CHARGE_DEFAULTS.spinCharged-1)*(1-settle)*charge,
    bandRate:CHARGE_DEFAULTS.bandsPerSecond*(1-settle)*charge
  };
}

