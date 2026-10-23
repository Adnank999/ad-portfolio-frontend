import * as THREE from 'three';
import { createMobileProjectNavigation, getAdjacentProjectIndex } from './mobile-showcase.js';
import { makeEnergyBeam, makeEnergySpiral, makePortalStorm, chargeEnvelope, CHARGE_DEFAULTS } from './energy.js';
import { WATER_LEVEL } from './water.js';
import { findTerrainCrest } from './terrain.js';
import { createStormSky } from './storm-sky.js';
import { PROJECTS } from './projects.js';
import { configureSurfaceTexture } from './texture-quality.js';

// The geometry is intentionally owned by scene.js. This module only adds
// weather, energy markers, responsive hotspots, and shader-based project art.
export const MARKERS = PROJECTS;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const ease = (a, b, t) => (a + (b - a) * Math.min(1, Math.max(0, t)));
const smoothHover = (distance, radius) => 1 - THREE.MathUtils.smoothstep(distance, 12 * radius, 28 * radius);

function texLoad(loader, path) {
  return new Promise((resolve, reject) => loader.load(path, resolve, undefined,
    () => reject(new Error(`Atmosphere texture failed to load: ${path}`))));
}
function softTexture() {
  const canvas = document.createElement('canvas');canvas.width=canvas.height=128;
  const c=canvas.getContext('2d');const g=c.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.13,'rgba(255,255,255,.87)');
  g.addColorStop(.35,'rgba(255,255,255,.22)');g.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=g;c.fillRect(0,0,128,128);return new THREE.CanvasTexture(canvas);
}
function shaderMesh(geometry, vert, frag, uniforms, { blending=THREE.AdditiveBlending, depthTest=true }={}) {
  const material=new THREE.ShaderMaterial({vertexShader:vert,fragmentShader:frag,uniforms,
    transparent:true,depthWrite:false,depthTest,side:THREE.DoubleSide,blending,toneMapped:false});
  return new THREE.Mesh(geometry,material);
}
const UV_VERTEX=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;

function rainField() {
  const n=3100, pos=new Float32Array(n*6), seeds=new Float32Array(n*2);
  let seed=4489; const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<n;i++){
    const x=(rand()-.5)*300,y=rand()*140,z=(rand()-.5)*300;
    const d=.3+rand()*.8, f=rand();
    pos.set([x,y,z,x+.6,y-d,z-.25],i*6);seeds[i*2]=seeds[i*2+1]=f;
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
  const material=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uRain:{value:.67},uWind:{value:.7},uFlash:{value:0}},
    vertexShader:`attribute float aSeed;uniform float uTime,uWind;varying float vSeed;
      void main(){vSeed=aSeed;vec3 p=position;
      p.y=mod(p.y-uTime*(34.0+aSeed*39.0)+5600.0,145.0)-14.0;
      p.x+=p.y*(.065+uWind*.08)+sin(uTime*.23+aSeed)*3.0;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader:`uniform float uRain,uFlash;varying float vSeed;
      void main(){gl_FragColor=vec4(.38+uFlash*.27,.66+uFlash*.24,1.0,
        (.025+vSeed*.04)*uRain*(1.0+uFlash*.6));}`,
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
  });
  const object=new THREE.LineSegments(geometry,material);object.frustumCulled=false;object.renderOrder=18;
  return {object, geometry,material};
}
function splashField(riverMask) {
  const count=700,p=new Float32Array(count*3),r=new Float32Array(count);
  let seed=34;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  let placed=0;
  for(let attempt=0;attempt<count*50&&placed<count;attempt++){
    const horizontal=(rand()-.5)*305,vertical=(rand()-.5)*305;
    if(riverMask.sample(horizontal/340+.5,.5-vertical/340)<.85)continue;
    p.set([horizontal,WATER_LEVEL+.08,vertical],placed*3);r[placed]=rand();placed++;
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(p,3));
  geometry.setAttribute('aSeed',new THREE.BufferAttribute(r,1));
  geometry.setDrawRange(0,placed);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
    uniforms:{uTime:{value:0},uRain:{value:.6},uFlash:{value:0}},
    vertexShader:`attribute float aSeed;uniform float uTime;varying float vLife;
      void main(){vLife=fract(aSeed+uTime*(.35+aSeed*.43));vec4 mv=modelViewMatrix*vec4(position,1.0);
      gl_PointSize=clamp(225.0/max(1.0,-mv.z),1.0,10.0)*(.4+vLife);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uRain,uFlash;varying float vLife;
      void main(){float r=length(gl_PointCoord-.5)*2.0;float ring=exp(-pow((r-.54)*10.0,2.0));
      gl_FragColor=vec4(.4,.75,1.0,ring*(1.0-vLife)*(.34+uFlash*.35)*uRain);}`});
  return {object:new THREE.Points(geometry,material),geometry,material};
}

function beamColumn(color) {
  const g=new THREE.CylinderGeometry(1,1,1,40,48,true);
  const u={uColor:{value:color},uTime:{value:0},uEnergy:{value:0},uHover:{value:0},uBurst:{value:0}};
  const m=shaderMesh(g,UV_VERTEX,`
    varying vec2 vUv;uniform vec3 uColor;uniform float uTime,uEnergy,uHover,uBurst;
    void main(){float p=vUv.y;
      float column=pow(1.0-p,4.2)*(.13+.35*uHover+.34*uEnergy);
      float pool=exp(-pow((p-.62)*8.0,2.0))*(.17*uEnergy+.48*uBurst);
      float spiral=pow(max(0.0,sin(vUv.x*12.566-p*23.0-uTime*(2.4+uHover))),7.0)
         *(1.0-smoothstep(.42,.95,p))*(.06+.35*uHover+.35*uEnergy);
      float alpha=(column+pool+spiral)*(.18+.85*uEnergy+.65*uHover+.8*uBurst);
      vec3 col=mix(uColor,vec3(1.0),uBurst*.48);
      gl_FragColor=vec4(col,alpha);}
  `,u);
  m.scale.set(4.2,32,4.2);m.renderOrder=12;return m;
}
function groundRipple(color) {
  const uniforms={uColor:{value:color},uTime:{value:0},uHover:{value:0},uEnergy:{value:0},uBurst:{value:0},uRadius:{value:1}};
  const mesh=shaderMesh(new THREE.PlaneGeometry(34,34),UV_VERTEX,`
     varying vec2 vUv;uniform vec3 uColor;uniform float uTime,uHover,uEnergy,uBurst,uRadius;
     void main(){vec2 p=(vUv-.5)*2.0;float r=length(p);
       float halo=exp(-r*r*15.0)*(.15+.23*uHover+.25*uEnergy);
       float a=fract(uTime*(.19+.11*uHover));float r0=a*.82*uRadius;
       float ring=exp(-pow((r-r0)*33.0,2.0))*(1.0-a)*(.10+.64*uHover);
       float r1=(1.0-uBurst)*.95;
       float burst=exp(-pow((r-r1)*28.0,2.0))*uBurst*.88;
       float glints=pow(max(0.0,sin(atan(p.y,p.x)*32.0+uTime*1.8)),18.0)
           *(1.0-smoothstep(.0,.4,abs(r-.42)))*(.12*uHover);
       float alpha=(halo+ring+burst+glints)*(1.0-smoothstep(.74,1.0,r));
       gl_FragColor=vec4(uColor,alpha);}
  `,uniforms);
  mesh.rotation.x=-Math.PI/2;mesh.renderOrder=13;return mesh;
}
function swirlParticles(color,seed0) {
  const count=120,points=new Float32Array(count*3),seed=new Float32Array(count);
  let n=seed0;const rnd=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};
  for(let i=0;i<count;i++){points.set([0,0,0],i*3);seed[i]=rnd();}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(points,3));
  geo.setAttribute('aSeed',new THREE.BufferAttribute(seed,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
    uniforms:{uTime:{value:0},uHover:{value:0},uEnergy:{value:0},uBurst:{value:0},uColor:{value:color}},
    vertexShader:`attribute float aSeed;uniform float uTime,uHover,uEnergy,uBurst;
      varying float vSeed;varying float vHot;
      void main(){vSeed=aSeed;vHot=uHover+uEnergy;
        float a=aSeed*58.0+uTime*(.4+fract(aSeed*29.0));
        float r=(.12+aSeed*.95)*(1.0+uHover*.18+uBurst*.15);
        vec3 p=vec3(cos(a)*r, fract(aSeed*19.0+uTime*(.07+.14*aSeed))*9.0,sin(a)*r);
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        gl_PointSize=clamp((150.0/max(1.0,-mv.z))*(.35+aSeed*.6+vHot*.3+uBurst*.2),.7,3.0);
        gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying float vSeed,vHot;uniform vec3 uColor;
      void main(){float r=length(gl_PointCoord-.5)*2.0;
        float flare=pow(clamp(1.0-r,0.0,1.0),2.3);
        gl_FragColor=vec4(mix(uColor,vec3(1.0),.10+vHot*.05),flare*(.035+vHot*.16)*(.45+vSeed*.55));}`});
  const obj=new THREE.Points(geo,material);obj.frustumCulled=false;obj.renderOrder=18;
  return {obj,geo,material};
}
function portalShader(texture,noise) {
  const uniforms={uPoster:{value:texture},uNoise:{value:noise},uTime:{value:0},
    uProgress:{value:0},uColor:{value:new THREE.Color('#fa46cc')},
    uGlitch:{value:.35},uRatio:{value:1.6},uSoftness:{value:.22}};
  const mesh=shaderMesh(new THREE.PlaneGeometry(43,43),UV_VERTEX,`
    precision highp float;
    varying vec2 vUv;uniform sampler2D uPoster,uNoise;
    uniform float uTime,uProgress,uGlitch,uRatio,uSoftness;uniform vec3 uColor;
    void main(){
      vec2 p=(vUv-.5)*2.0;float radius=length(p);
      float angle=atan(p.y,p.x);
      float n=texture2D(uNoise,fract(vUv*3.3+vec2(uTime*.012,-uTime*.016))).r;
      float n2=texture2D(uNoise,fract(vUv*8.2+vec2(-uTime*.018,uTime*.02))).r;
      float open=smoothstep(.03,.95,uProgress);
      float perimeter=radius+(n-.5)*(.16+.10*uGlitch)*(1.0-open*.45);
      perimeter+=sin(angle*5.0-uTime*.65)*.029;
      float silhouette=1.0-smoothstep(.76-uSoftness*.19,.94+uSoftness*.25,perimeter);
      float noiseGate=smoothstep(.80-open*.85,1.02-open*.5,n*.8+n2*.2);
      float bottom=smoothstep(-.99,-.28,p.y);
      float alpha=silhouette*open*mix(noiseGate,1.0,smoothstep(.65,1.0,open))*mix(.65,1.,bottom);
      vec2 sampleScale=vec2(min(1.0,1.0/max(uRatio,.01)), min(1.0,uRatio));
      vec2 sampleUv=clamp(p*.5*sampleScale*.98+.5+vec2((n-.5)*.022*uGlitch,0.),.001,.999);
      vec3 art=texture2D(uPoster,sampleUv).rgb;
      vec3 glow=uColor*.035*smoothstep(.66,.94,perimeter);
      vec3 col=art+glow;
      // Normal blending multiplies alpha; RGB must NOT be premultiplied here.
      gl_FragColor=vec4(col,clamp(alpha,0.,1.));
    }
  `,uniforms,{blending:THREE.NormalBlending});
  mesh.visible=false;mesh.frustumCulled=false;mesh.renderOrder=25;mesh.material.depthTest=false;
  return mesh;
}

function portalEmbers(color) {
  const count=180;const pos=new Float32Array(count*3),seeds=new Float32Array(count);
  for(let i=0;i<count;i++)seeds[i]=(i*.61803398875)%1;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,toneMapped:false,
    uniforms:{uTime:{value:0},uStage:{value:0},uColor:{value:color},uIntensity:{value:1}},
    vertexShader:`attribute float aSeed;uniform float uTime,uStage,uIntensity;
      varying float vIntensity;varying float vSeed;
      void main(){
        float angle=aSeed*6.28318 + uTime*(.15+.5*fract(aSeed*7.0));
        float radius=21.0 + sin(aSeed*183.0+uTime*.9)*1.5;
        vec3 p=vec3(cos(angle)*radius,sin(angle)*radius,2.0);
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        float sparkle=pow(max(0.0,sin(uTime*(1.0+aSeed*3.0)+aSeed*272.0)),5.0);
        vSeed=aSeed;vIntensity=(.08+sparkle*.34)*uStage*uIntensity;
        gl_PointSize=clamp((200.0/max(1.0,-mv.z))*(.4+aSeed*.7),.7,2.5);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader:`uniform vec3 uColor;varying float vIntensity,vSeed;
      void main(){float r=length(gl_PointCoord-.5)*2.0;float a=exp(-r*r*8.0)*vIntensity;
        gl_FragColor=vec4(mix(uColor,vec3(1.0,.82,.55),vSeed*.55),a);}`,
  });
  const obj=new THREE.Points(geometry,material);obj.visible=false;obj.frustumCulled=false;obj.renderOrder=28;
  return {obj,geometry,material};
}
function makePosterDOM(host) {
  const caption=document.createElement('section');caption.className='project-reveal';
  caption.setAttribute('aria-label','Selected project');
  caption.innerHTML=`<div class="project-caption"><span class="project-client"></span><strong class="project-title"></strong>
    <div class="project-actions"><button class="project-explore" type="button">VIEW PROJECT ↗</button>
    <button class="project-close" type="button" aria-label="Close project">✕</button></div></div>`;
  host.appendChild(caption);
  return {caption,
    show(m,imageBase){caption.style.setProperty('--portal-color',m.color);
      caption.querySelector('.project-client').textContent=m.client;
      caption.querySelector('.project-title').textContent=m.title;
      caption.classList.remove('is-visible');},
    hide(){caption.classList.remove('is-visible');},
    setPosition(x,y){caption.style.setProperty('--marker-screen-x',`${x}px`);caption.style.setProperty('--marker-screen-y',`${y}px`);},
    setRevealProgress(value){caption.classList.toggle('is-visible',value>.62);},
    destroy(){caption.remove();},
  };
}
export async function createAtmosphere({scene,camera,renderer,host,heightAt,riverMask,imageBase,onStatus,onThunder,markerOrigins={},
  onPortalOpen,onPortalClose,onViewProject,isShowcasing=()=>false,onRiver,onFlame,onStorm}) {
  const loader=new THREE.TextureLoader();
  const [noise,panorama,fallback]=await Promise.all([
    texLoad(loader,imageBase+'perlin.webp'),texLoad(loader,imageBase+'bg.webp'),
    texLoad(loader,imageBase+'terrain-diffuse.webp')]);
  const projectImages=await Promise.all(MARKERS.map(project=>new Promise(resolve=>{
    let finished=false;
    const timer=setTimeout(()=>{finished=true;resolve(fallback);},6000);
    loader.load(project.imageUrl,texture=>{
      if(finished){texture.dispose();return;}
      finished=true;clearTimeout(timer);resolve(texture);
    },undefined,()=>{if(!finished){finished=true;clearTimeout(timer);resolve(fallback);}});
  })));
  const artwork=new Map(MARKERS.map((project,index)=>[project.id,projectImages[index]]));
  panorama.colorSpace=fallback.colorSpace=THREE.SRGBColorSpace;
  for(const texture of [panorama,...projectImages]){
    texture.colorSpace=THREE.SRGBColorSpace;
    configureSurfaceTexture(texture,Math.min(8,renderer.capabilities.getMaxAnisotropy()));
  }
  noise.wrapS=noise.wrapT=THREE.RepeatWrapping;
  const group=new THREE.Group();scene.add(group);const resources=[...new Set([noise,panorama,fallback,...projectImages])];
  const glowTex=softTexture();resources.push(glowTex);
  const rain=rainField(), splashes=splashField(riverMask);group.add(rain.object,splashes.object);
  onRiver?.(splashes.object);
  resources.push(rain.geometry,rain.material,splashes.geometry,splashes.material);
  const stormSky=createStormSky(panorama,noise,scene.fog.color),sky=stormSky.mesh;
  group.add(sky);resources.push(stormSky);onStorm?.(sky);
  const markers=[],hits=[];
  const ringGeo=new THREE.RingGeometry(1.9,2.35,40);
  resources.push(ringGeo);
  for(let i=0;i<MARKERS.length;i++){
    const def=MARKERS[i],origin=markerOrigins[def.id]||def;
    const crest=findTerrainCrest(heightAt,origin,WATER_LEVEL,origin.radius??26);
    const anchor=new THREE.Vector3(crest.x,crest.y,crest.z),color=new THREE.Color(def.color);
    const groupMarker=new THREE.Group();groupMarker.name=`Terrain crest beacon: ${def.id}`;
    groupMarker.position.copy(anchor);group.add(groupMarker);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color,transparent:true,opacity:.57,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    sprite.position.y=.24;sprite.scale.set(8.8,8.8,1);groupMarker.add(sprite);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color,transparent:true,opacity:.17,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    glow.position.y=4;glow.scale.set(17,25,1);groupMarker.add(glow);
    const column=makeEnergyBeam(color);groupMarker.add(column);
    const spiral=makeEnergySpiral(color);groupMarker.add(spiral);
    const ripple=groundRipple(color);ripple.position.y=.26;groupMarker.add(ripple);
    const particle=swirlParticles(color,2324+i*743);particle.obj.position.y=.5;groupMarker.add(particle.obj);
    const core=new THREE.Mesh(new THREE.SphereGeometry(.28,12,10),new THREE.MeshBasicMaterial({color,toneMapped:false}));
    core.position.y=.18;groupMarker.add(core);
    for(const object of [sprite,glow,column,spiral,ripple,particle.obj,core])onFlame?.(object);
    const light=new THREE.PointLight(color,2,24,1.6);light.position.y=3.5;groupMarker.add(light);
    const hit=new THREE.Mesh(new THREE.SphereGeometry(7,12,8),new THREE.MeshBasicMaterial({color:'#ffffff',visible:false}));
    hit.position.y=3;hit.userData.markerIndex=i;groupMarker.add(hit);hits.push(hit);
    resources.push(sprite.material,glow.material,column.geometry,column.material,spiral.geometry,spiral.material,ripple.geometry,ripple.material,
      particle.geo,particle.material,core.geometry,core.material,hit.geometry,hit.material);
    markers.push({...def,anchor,color,groupMarker,sprite,glow,column,spiral,ripple,particle,core,light,hit,hover:0,energy:0,burst:0,spinPhase:i*2.39996,bandPhase:0});
  }
  const poster=portalShader(projectImages[0],noise);group.add(poster);resources.push(poster.geometry,poster.material);
  const posterStorm=makePortalStorm(new THREE.Color('#f24cdb'));group.add(posterStorm);resources.push(posterStorm.geometry,posterStorm.material);
  const embers=portalEmbers(new THREE.Color('#f24cdb'));group.add(embers.obj);resources.push(embers.geometry,embers.material);
  const posterAura=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:'#f24cdb',transparent:true,opacity:.58,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  posterAura.visible=false;posterAura.scale.set(53,53,1);group.add(posterAura);resources.push(posterAura.material);
  for(const object of [posterStorm,embers.obj,posterAura])onFlame?.(object);
  const portalUI=makePosterDOM(host);
  const mobileNavigation=createMobileProjectNavigation(host,direction=>{
    if(!selected||isShowcasing())return;
    select(markers[getAdjacentProjectIndex(markers.indexOf(selected),direction,markers.length)]);
  });
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(9,9),proj=new THREE.Vector3();
  const settings={rain:.68,fog:.67,storm:.75,beacon:1.0,ripple:.8,rippleEnabled:false,
    particlesEnabled:true,flameHeight:1.25,hoverFlameBoost:1.7,flameTurbulence:1.1,
    cursor:1.0,lightningRate:.45,lightningStrength:1.0,wind:.7,skyBrightness:1.35,
    skyMist:.75,skyThunderGlow:1,
    lightningEnabled:true,chargeDuration:1.2,spiralSpeed:.4,portalGlow:1.25,
    portalSize:1.18,portalSwirl:1.0,portalWarmth:.6};
  let hovered=null,selected=null,flash=0,strikeStrength=0,nextFlash=11,lightningAge=12,lastFrame=0,destroyed=false,selectTime=0;
  const flashDirection=new THREE.Vector3(-.45,.35,-.86).normalize();
  const localClick=(e)=>{
    if(isShowcasing())return;
    const r=renderer.domElement.getBoundingClientRect();
    mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    ray.setFromCamera(mouse,camera);const intersects=ray.intersectObjects(hits,false);
    if(intersects.length){select(markers[intersects[0].object.userData.markerIndex]);return;}
    // The visible GPU glow is larger than its collision sphere on hover.
    // Accept clicks inside that expanded halo too, not only the tiny core.
    let nearest=null,best=32;
    for(const marker of markers){
      proj.copy(marker.anchor).add(new THREE.Vector3(0,2,0)).project(camera);
      const d=Math.hypot((proj.x-mouse.x)*r.width*.5,(proj.y-mouse.y)*r.height*.5);
      if(d<best){best=d;nearest=marker;}
    }
    if(nearest)select(nearest);
  };
  const pointerMove=(e)=>{if(isShowcasing())return;const r=renderer.domElement.getBoundingClientRect();
    mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);};
  const pointerLeave=()=>{mouse.set(9,9);renderer.domElement.style.cursor='default';};
  const onKey=(e)=>{if(e.key==='Escape'&&!isShowcasing())close();};
  renderer.domElement.addEventListener('pointermove',pointerMove,{passive:true});
  renderer.domElement.addEventListener('pointerleave',pointerLeave);
  renderer.domElement.addEventListener('click',localClick);window.addEventListener('keydown',onKey);
  const openButton=portalUI.caption.querySelector('.project-explore');
  openButton.addEventListener('click',event=>{event.stopPropagation();if(selected)onViewProject?.(selected.id);});
  portalUI.caption.querySelector('.project-close').addEventListener('click',e=>{e.stopPropagation();close();});
  function select(m,{silent=false}={}){if(!m)return;if(selected!==m&&!silent)onPortalOpen?.(m.id);selected=m;selectTime=0;host.classList.add('has-project');
    mobileNavigation.update(markers.indexOf(m),markers);
    m.energy=0;m.burst=0;
    poster.material.uniforms.uColor.value.copy(m.color);
    const image=artwork.get(m.id);
    poster.material.uniforms.uPoster.value=image;poster.material.uniforms.uRatio.value=(image.image?.width||16)/(image.image?.height||9);
    poster.material.uniforms.uProgress.value=0;poster.visible=posterAura.visible=embers.obj.visible=true;
    posterStorm.visible=true;posterStorm.material.uniforms.uColor.value.copy(m.color);
    posterStorm.material.uniforms.uStage.value=0;
    posterAura.material.color.copy(m.color);embers.material.uniforms.uColor.value.copy(m.color);
    portalUI.show(m,imageBase);onStatus?.(`${m.title}: energy charge, ripple, and shader-revealed project image.`);}
  function close(){selected=null;onPortalClose?.();host.classList.remove('has-project');poster.visible=posterAura.visible=posterStorm.visible=embers.obj.visible=false;portalUI.hide();onStatus?.('Project dismissed. Move over a glowing light to expand its particles.');}
  const stormFlash=(strength=1,force=false)=>{if((force||settings.lightningEnabled)&&lightningAge>.18){
    strikeStrength=strength;lightningAge=0;
    flashDirection.set((Math.random()-.5)*1.0,.25+Math.random()*.55,-.8).normalize();
    onThunder?.({strength:strength*settings.lightningStrength,pan:flashDirection.x,delay:.12});
    if(force)nextFlash=Math.max(nextFlash,lastFrame+5);
    onStatus?.('Sheet lightning in the sky and river reflections share the same pulse; terrain lighting stays steady.');}};
  function updateStorm(t,dt){
    if(destroyed)return {flash:0,storm:settings.storm};
    lastFrame=t;
    if(settings.lightningEnabled&&settings.storm>.05&&t>=nextFlash){stormFlash(.7+.3*Math.random());
      nextFlash=t+(17-settings.lightningRate*12)+(Math.random()*8-4);}
    lightningAge+=dt;
    const gauss=(x,c,w)=>Math.exp(-Math.pow((x-c)/w,2));
    flash=lightningAge<1.6?Math.min(1.8,strikeStrength*settings.lightningStrength*(1.05*gauss(lightningAge,.10,.055)+.52*gauss(lightningAge,.29,.066)+.32*gauss(lightningAge,.57,.13))):0;
    if(lightningAge>1.6){flash=0;strikeStrength=0;}
    return {flash,flashDirection,storm:settings.storm};
  }
  function update(t,dt,stormState=updateStorm(t,dt)){
    if(destroyed)return {flash:0,storm:settings.storm};
    flash=stormState.flash;
    stormSky.update(t,flash,flashDirection,settings);
    rain.object.visible=settings.rain>.005;rain.material.uniforms.uTime.value=t;
    rain.material.uniforms.uRain.value=settings.rain;rain.material.uniforms.uWind.value=settings.wind;
    rain.material.uniforms.uFlash.value=0;rain.object.position.set(camera.position.x,0,camera.position.z-80);
    splashes.object.visible=settings.rain>.005;splashes.material.uniforms.uTime.value=t;
    splashes.material.uniforms.uRain.value=settings.rain;splashes.material.uniforms.uFlash.value=flash;
    // Pixel-space proximity, not only a ray-hit: the entire aura gradually
    // responds as the pointer nears it, like the reference hover transition.
    let closest=null,best=0;
    for(const m of markers){
      proj.copy(m.anchor).add(new THREE.Vector3(0,2,0)).project(camera);
      const dist=Math.hypot((proj.x-mouse.x)*renderer.domElement.clientWidth*.5,
         (proj.y-mouse.y)*renderer.domElement.clientHeight*.5);
      const influence=mouse.x<8?smoothHover(dist,settings.cursor):0;
      if(influence>best){best=influence;closest=m;}
      const target=(m===selected?1.0:0.0);
      m.hover=ease(m.hover,influence,dt*5.2);
      m.flameLift=ease(m.flameLift??0,influence,1-Math.exp(-dt*2.0));
      const env=m===selected?chargeEnvelope(selectTime,settings.chargeDuration):null;
      m.energy=ease(m.energy,env?env.active:0,dt*4.0);
      m.burst=env?.burst??Math.max(0,m.burst-dt*2.8);
      const charge=env?.charging??0;
      m.spinPhase+=dt*settings.spiralSpeed*(env?.spin??1);
      m.bandPhase+=dt*(env?.bandRate??0);
      const p=m.hover*settings.beacon,active=m.energy*settings.beacon;
      const hoverStretch=clamp(m.flameLift*settings.hoverFlameBoost,0,2.8);
      const revealDim=1-(env?.open??0)*.85;
      const scale=1+p*.35+active*.18;
      m.sprite.scale.setScalar(4.0*scale);m.sprite.material.opacity=(.16+.10*p+.08*active)*revealDim;
      m.glow.scale.set(4.2*(1+p*.2),12+hoverStretch*18*settings.flameHeight,1);
      m.glow.position.y=3.5+hoverStretch*5*settings.flameHeight;
      m.glow.material.opacity=(.045+.07*p+.05*active)*revealDim;
      m.core.scale.setScalar(.75+p*.2+active*.15);
      m.light.intensity=(1.5+p*5+active*6+m.burst*8)*settings.beacon;
      const cRad=(env?.radius??1);
      const targetHeight=(3.2+hoverStretch*12+charge*18+active*11)*settings.flameHeight;
      m.column.scale.set(3.2*cRad*(1-p*.1),targetHeight,1);
      m.column.position.y=targetHeight*.5;
      m.column.rotation.y=Math.atan2(camera.position.x-m.anchor.x,camera.position.z-m.anchor.z);
      m.spiral.scale.set(.8*cRad,targetHeight,.8*cRad);
      m.spiral.position.y=targetHeight*.5;
      const beamU=m.column.material.uniforms;beamU.uTime.value=t;beamU.uHover.value=p;
      beamU.uActive.value=active;beamU.uCharge.value=charge;beamU.uBurst.value=m.burst;beamU.uBandPhase.value=m.bandPhase;
      beamU.uTurbulence.value=settings.flameTurbulence;
      beamU.uOpacity.value=.9*revealDim;
      const swirlU=m.spiral.material.uniforms;swirlU.uTime.value=t;swirlU.uHover.value=p;
      swirlU.uActive.value=active;swirlU.uCharge.value=charge;swirlU.uBurst.value=m.burst;swirlU.uPhase.value=m.spinPhase;
      swirlU.uOpacity.value=(.035+p*.16+charge*.2)*revealDim;
      m.ripple.visible=Boolean(settings.rippleEnabled)&&settings.ripple>.005;
      m.particle.obj.visible=Boolean(settings.particlesEnabled);
      m.ripple.material.uniforms.uTime.value=t;
      m.ripple.material.uniforms.uHover.value=p*settings.ripple;
      m.ripple.material.uniforms.uEnergy.value=active;
      m.ripple.material.uniforms.uBurst.value=m.burst*settings.ripple;
      m.particle.obj.scale.y=(.35+hoverStretch*1.1)*settings.flameHeight;
      m.particle.material.uniforms.uTime.value=t;
      m.particle.material.uniforms.uHover.value=p;
      m.particle.material.uniforms.uEnergy.value=active;
      m.particle.material.uniforms.uBurst.value=m.burst;
    }
    hovered=best>.12?closest:null;
    renderer.domElement.style.cursor=hovered?'pointer':'default';
    if(selected){
      selectTime=Math.min(selectTime+dt,10);
      const anim=chargeEnvelope(selectTime,settings.chargeDuration);
      poster.position.copy(selected.anchor).add(new THREE.Vector3(0,32.0+Math.sin(t*1.1)*.7,0));
      poster.scale.setScalar(settings.portalSize); 
      poster.quaternion.copy(camera.quaternion);
      posterAura.position.copy(poster.position);posterAura.position.z-=.25;
      posterAura.scale.setScalar(48*settings.portalSize);
      posterStorm.position.copy(poster.position);posterStorm.quaternion.copy(camera.quaternion);
      embers.obj.position.copy(poster.position);embers.obj.quaternion.copy(camera.quaternion);
      embers.obj.scale.setScalar(settings.portalSize);
      posterStorm.material.uniforms.uTime.value=t;
      posterStorm.material.uniforms.uPhase.value=t*.3;
      posterStorm.material.uniforms.uStage.value=anim.gathering;
      posterStorm.material.uniforms.uBurst.value=anim.burst;
      posterStorm.material.uniforms.uIntensity.value=settings.portalGlow;
      posterStorm.material.uniforms.uOrangeMix.value=settings.portalWarmth;
      posterStorm.material.uniforms.uSwirl.value=settings.portalSwirl;
      embers.material.uniforms.uTime.value=t;
      embers.material.uniforms.uStage.value=anim.gathering;
      embers.material.uniforms.uIntensity.value=settings.portalGlow;
      posterStorm.scale.setScalar(settings.portalSize*(.2+.8*anim.gathering));
      poster.material.uniforms.uTime.value=t;
      poster.material.uniforms.uProgress.value=anim.open;
      poster.material.uniforms.uGlitch.value=.48*(1-anim.open)+.08;
      posterAura.material.opacity=(.025+.055*anim.gathering)*settings.portalGlow;
      proj.copy(selected.anchor).add(new THREE.Vector3(0,13,0)).project(camera);
      const rect=host.getBoundingClientRect();
      const x=clamp((proj.x*.5+.5)*rect.width,rect.width<700?115:185,rect.width-(rect.width<700?115:185));
      const y=clamp((-proj.y*.5+.5)*rect.height,100,rect.height-135);
      portalUI.setPosition(x,y);
      portalUI.setRevealProgress(anim.open);
    }
    return {flash,flashDirection,storm:settings.storm,hovered:hovered?.id??null,selected:selected?.id??null};
  }
  return {
    sky,
    update,updateStorm,flash:()=>stormFlash(1,true),select:(id,options)=>select(markers.find(m=>m.id===id)||markers[0],options),close,
    getProjectArtwork:id=>artwork.get(id)||fallback,
    getProjectNoise:()=>noise,
    getSelectedProject:()=>selected?.id??null,
    setShowcaseActive(value){portalUI.caption.inert=Boolean(value);portalUI.caption.setAttribute('aria-hidden',String(Boolean(value)));},
    getSelectedAnchor:()=>selected?.anchor??null,
    setSetting(key,value){if(key in settings){settings[key]=typeof settings[key]==='boolean'?Boolean(value):Number(value);return true;}return false;},
    getSettings:()=>({...settings}),
    dispose(){destroyed=true;
      renderer.domElement.removeEventListener('pointermove',pointerMove);
      renderer.domElement.removeEventListener('pointerleave',pointerLeave);
      renderer.domElement.removeEventListener('click',localClick);
      window.removeEventListener('keydown',onKey);host.classList.remove('has-project');portalUI.destroy();mobileNavigation.destroy();scene.remove(group);
      resources.forEach(res=>res.dispose?.());group.clear();
    },
  };
}
