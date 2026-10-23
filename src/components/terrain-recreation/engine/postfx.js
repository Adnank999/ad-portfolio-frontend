import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/**
 * V5 post composite. Uses the uploaded bundle's *order and controls* as a
 * reference: pointer fluid -> fringe -> grade -> vignette -> film grain.
 * The original LUT (color-correction.bin) was not uploaded, so this uses a
 * configurable analytic color grade instead of claiming an exact LUT match.
 */
export async function makeFilmPass(base,{loadTexture}={}) {
  const loader=new THREE.TextureLoader();
  const load=loadTexture|| (name=>new Promise((resolve,reject)=>loader.load(base+name,resolve,undefined,reject)));
  const [grain,blue]=await Promise.all([load('grain.webp'),load('blue-noise(3).png')]);
  grain.wrapS=grain.wrapT=blue.wrapS=blue.wrapT=THREE.RepeatWrapping;
  grain.minFilter=grain.magFilter=blue.minFilter=blue.magFilter=THREE.NearestFilter;
  const grainUniforms={
    tDiffuse:{value:null},uGrain:{value:grain},uBlue:{value:blue},
    uTime:{value:0},uAmount:{value:.03},uSharpness:{value:.16},uSourceTexel:{value:new THREE.Vector2(1,1)},
    uProjectAmount:{value:0},uProjectAspect:{value:1},
    uGrainTexel:{value:new THREE.Vector2(1/grain.image.width,1/grain.image.height)},
    uBlueTexel:{value:new THREE.Vector2(1/blue.image.width,1/blue.image.height)},
  };
  const grainPass=new ShaderPass(new THREE.ShaderMaterial({uniforms:grainUniforms,depthTest:false,depthWrite:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`precision highp float;
      uniform sampler2D tDiffuse,uGrain,uBlue;
      uniform float uTime,uAmount,uSharpness;
      uniform float uProjectAmount,uProjectAspect;
      uniform vec2 uGrainTexel,uBlueTexel,uSourceTexel;
      varying vec2 vUv;
      float hash(vec2 point){
        vec3 state=fract(vec3(point.x,point.y,point.x+point.y)*.1031);
        state+=dot(state,state.yzx+33.33);
        return fract((state.x+state.y)*state.z);
      }
      void main(){
        vec3 color=texture2D(tDiffuse,vUv).rgb;
        vec3 north=texture2D(tDiffuse,clamp(vUv+vec2(0.,uSourceTexel.y),vec2(0.),vec2(1.))).rgb;
        vec3 south=texture2D(tDiffuse,clamp(vUv-vec2(0.,uSourceTexel.y),vec2(0.),vec2(1.))).rgb;
        vec3 east=texture2D(tDiffuse,clamp(vUv+vec2(uSourceTexel.x,0.),vec2(0.),vec2(1.))).rgb;
        vec3 west=texture2D(tDiffuse,clamp(vUv-vec2(uSourceTexel.x,0.),vec2(0.),vec2(1.))).rgb;
        vec3 minimum=min(color,min(min(north,south),min(east,west)));
        vec3 maximum=max(color,max(max(north,south),max(east,west)));
        color=clamp(color+(color-(north+south+east+west)*.25)*uSharpness,minimum,maximum);
        vec2 pixel=floor(gl_FragCoord.xy);
        float frame=floor(uTime*24.0);
        vec2 offset=vec2(mod(frame*73.0,1024.0),mod(frame*151.0,1024.0));
        float analog=texture2D(uGrain,(pixel+offset+.5)*uGrainTexel).r-.5;
        float blueNoise=texture2D(uBlue,(pixel+offset.yx+.5)*uBlueTexel).r-.5;
        float fine=hash(pixel+offset)+hash(pixel.yx+offset*1.37)-1.0;
        float luminance=dot(color,vec3(.2126,.7152,.0722));
        float grain=(fine*.65+blueNoise*.25+analog*.10)*uAmount;
        grain*=mix(1.0,.45,smoothstep(.35,.95,luminance));
        if(uProjectAmount>0.){
          vec2 tiledUv=((vUv-.5)*vec2(uProjectAspect,1.)+.5)*15.;
          vec3 spatial=texture2D(uBlue,tiledUv).rgb;
          vec3 modulated=mix(color*spatial,color,.75);
          modulated=mix(modulated*spatial,modulated,1.5);
          color=mix(color,modulated,uProjectAmount);
        }
        gl_FragColor=vec4(clamp(color+vec3(grain),0.0,1.0),1.0);
      }`}));
  grainPass.setSize=(width,height)=>grainUniforms.uSourceTexel.value.set(1/Math.max(1,width),1/Math.max(1,height));
  const uniforms={
    tDiffuse:{value:null},
    tFluid:{value:null},uFluidStrength:{value:.5},
    uTime:{value:0},uVignette:{value:.7},
    uChroma:{value:.17},uStorm:{value:.84},
    uContrast:{value:1.35},uSaturation:{value:.9},uHue:{value:-.398},
    uGradeExposure:{value:1.06},uShadowLift:{value:.075}
  };
  const pass=new ShaderPass(new THREE.ShaderMaterial({uniforms,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`precision highp float;
      uniform sampler2D tDiffuse,tFluid;
      uniform float uTime,uVignette,uChroma,uStorm;
      uniform float uContrast,uSaturation,uHue,uGradeExposure,uFluidStrength,uShadowLift;
      varying vec2 vUv;
      vec3 rotateHue(vec3 c,float angle){
        vec3 axis=normalize(vec3(.2126,.7152,.0722));
        return c*cos(angle)+cross(axis,c)*sin(angle)+axis*dot(axis,c)*(1.-cos(angle));
      }
      void main(){
        vec2 uv=vUv;
        vec4 flow=texture2D(tFluid,uv);
        vec2 velocity=(flow.rg-.5)*2.0;
        float flowStrength=clamp(flow.b,0.,1.)*uFluidStrength;
        uv=clamp(uv+velocity*flowStrength*.020,vec2(.001),vec2(.999));
        vec2 radial=uv-.5;float r=length(radial*vec2(1.,1.13));
        vec2 shift=radial*.004*uChroma*(.35+r*1.5);
        vec3 col=texture2D(tDiffuse,uv).rgb;
        if(uChroma>.001){
          col.r=texture2D(tDiffuse,clamp(uv+shift,0.,1.)).r;
          col.b=texture2D(tDiffuse,clamp(uv-shift,0.,1.)).b;
        }
        col+=vec3(.009,.02,.03)*flowStrength;
        col*=1.-.045*uStorm;
        col*=1.-clamp(pow(r*1.33,1.7)*uVignette*.67,0.,.57);
        col=(col-.18)*uContrast+.18;
        float level=dot(max(col,vec3(0.)),vec3(.2126,.7152,.0722));
        col+=vec3(.55,.79,1.0)*uShadowLift*(1.-smoothstep(.04,.52,level));
        col=rotateHue(col,uHue*.5);
        float grey=dot(col,vec3(.2126,.7152,.0722));
        col=mix(vec3(grey),col,uSaturation);
        col*=uGradeExposure;
        gl_FragColor=vec4(max(col,vec3(0.)),1.);
      }`}));
  return {pass,grainPass,
    update(t,flash,settings,w,h,fluidTexture){
      uniforms.uTime.value=t;uniforms.uStorm.value=settings.storm;
      grainUniforms.uTime.value=t;grainUniforms.uAmount.value=settings.grain;
      uniforms.uVignette.value=settings.vignette;
      uniforms.uChroma.value=settings.chroma;
      uniforms.uContrast.value=settings.contrast;
      uniforms.uHue.value=settings.hue;
      uniforms.uSaturation.value=settings.saturation;
      uniforms.uGradeExposure.value=settings.gradeExposure;
      uniforms.uShadowLift.value=settings.shadowLift;
      uniforms.uFluidStrength.value=settings.fluidStrength;
      if(fluidTexture)uniforms.tFluid.value=fluidTexture;
    },
    dispose(){grain.dispose();blue.dispose();pass.dispose();grainPass.dispose();}
  };
}

