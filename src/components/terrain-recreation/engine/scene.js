import * as THREE from 'three';
import { getMobileCameraScale } from './mobile-showcase.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createAtmosphere } from './atmosphere.js';
import { makeFilmPass } from './postfx.js';
import { createPointerFluid } from './fluid.js';
import { createRiverMask, createRiverWater, WATER_LEVEL } from './water.js';
import { createTerrainSurface } from './terrain.js';
import { createSceneAudio } from './scene-audio.js';
import { createThunderSampleSets } from './thunder-mixes.js';
import { SelectiveBloomPass } from './selective-bloom.js';
import { createForest } from './forest.js';
import { createDragons } from './dragons.js';
import { createPerformanceController } from './performance.js';
import { ProjectShowcasePass } from './project-showcase.js';
import { ProjectBackgroundPass } from './project-background.js';
import { createProjectPage } from './project-page.js';
import { createFrameSizing } from './frame-sizing.js';
import { configureSurfaceTexture } from './texture-quality.js';
import { configureProjectOutput } from './project-output.js';
import { createProjectMasks } from './project-artwork.js';
import { createGalleryLauncher } from './gallery-launcher.js';
import { loadBlenderEnvironment, applyBlenderTerrainMaterial, createPortfolioMarkerOrigins } from './blender-environment.js';
import { createVolcanoAtmosphere } from './volcano-atmosphere.js';

// Vite sets BASE_URL. Do not assume import.meta.env exists in a plain ES module.
const ASSET = `${import.meta.env?.BASE_URL || '/'}terrain/assets/`;
const AUDIO = `${import.meta.env?.BASE_URL || '/'}terrain/audio/`;
export const DEFAULT_SETTINGS = Object.freeze({
  storm:.92,rain:.35,fog:.69,wind:0,lightningRate:.60,lightningEnabled:true,lightningStrength:2,
  soundEnabled:true,thunderVolume:.30,riverGlow:1.73,riverSpeed:1,
  musicEnabled:true,musicVolume:.11,portalSoundEnabled:true,portalVolume:.18,
  // Explicit output pass reads renderer.toneMappingExposure every frame.
  exposure:.95,ambientFill:1.1,skyBrightness:1.80,fogBrightness:.88,
  wetness:.70,bloom:.55,bloomThreshold:.72,riverBloom:.99,riverBloomThreshold:.30,sparkles:.93,grain:.07,vignette:1,chroma:.08,
  contrast:1.20,hue:-.10,saturation:1.07,gradeExposure:1.03,shadowLift:.03,uiShade:.64,
  fluidStrength:.36,fluidPersistence:.89,fluidDiffusion:.46,fluidThickness:.06,
  chargeDuration:1,spiralSpeed:.55,portalGlow:.45,portalSize:1.06,portalSwirl:1.1,portalWarmth:.72,
  beacon:.28,cursor:.70,ripple:.02,rippleEnabled:true,particlesEnabled:false,
  flameHeight:3.20,hoverFlameBoost:.56,flameTurbulence:1.1,
  cameraSpeed:.40,cameraDistance:1.12,
  dragonsEnabled:true,dragonBreathEnabled:true,dragonFlightSpeed:1.15,dragonSize:.75,
  dragonAltitude:27.14,breathLength:55,breathPower:.12,dragonBloom:.12,dragonBloomThreshold:.60,frostDuration:24,
  skyMist:1.50,skyThunderGlow:1.80,thunderBloom:2.02,thunderBloomThreshold:.30,
  dragonLighting:2.42,dragonRim:1.30,maxPixelRatio:1.20,adaptiveQuality:true,
  reflectionFps:30,reflectionScale:.45,reflectDragons:true,breathSteps:16,
  projectGlow:3,projectThunderGlow:1.59,projectBloom:.24,projectBloomThreshold:.31,
  projectDistortion:1.32,projectDistortionScale:5,projectBackgroundBlur:0,projectFrost:.73,
  projectFrostDensity:.52,projectFrostSize:.23,
  projectExposure:.25,projectGrain:.09,projectThunderVolume:.1,
});
const clamp=THREE.MathUtils.clamp;
const cFogDark=new THREE.Color('#426488');
const cBackDark=new THREE.Color('#112940');
function readPixels(url){return new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{try{
    const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
    const g=c.getContext('2d',{willReadFrequently:true});if(!g)throw new Error('2D texture sampler unavailable');
    g.drawImage(image,0,0);resolve({data:g.getImageData(0,0,c.width,c.height).data,w:c.width,h:c.height});
  }catch(e){reject(new Error(`${url} - ${e.message}`));}};
  image.onerror=()=>reject(new Error(`Missing or blocked texture: ${url}. Run npm run dev instead of opening index.html directly.`));
  image.src=url;
});}
function loadTexture(loader,name,color=true){return new Promise((resolve,reject)=>loader.load(ASSET+name,t=>{
  if(color)t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;resolve(t);
},undefined,()=>reject(new Error(`Missing texture: ${ASSET}${name}`))));}
function makeShoreGlints(heightAt,riverMask){
  const count=2800,positions=new Float32Array(count*3),seed=new Float32Array(count);
  let rnd=20261018,n=0;
  const rand=()=>{rnd=(rnd*1664525+1013904223)>>>0;return rnd/4294967296;};
  for(let i=0;i<120000&&n<count;i++){
    const x=(rand()-.5)*335,z=(rand()-.5)*335,r=Math.hypot(x,z);
    const y=heightAt(x,z);
    const channel=riverMask.sample(x/340+.5,.5-z/340);
    if(r>165||r<23||channel<.6||y>WATER_LEVEL+.2||riverMask.distanceToBank(x/340+.5,.5-z/340)>1.2||rand()<.34)continue;
    const h2=heightAt(x+.7,z+.5);
    // Wet rock margins and narrow streams: sparkle distribution follows actual height.
    if(Math.abs(h2-y)<.3&&rand()<.55)continue;
    positions.set([x,Math.max(y,WATER_LEVEL)+.12,z],n*3);seed[n]=rand();n++;
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions.slice(0,n*3),3));
  geo.setAttribute('aSeed',new THREE.BufferAttribute(seed.slice(0,n),1));
  const mat=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uIntensity:{value:.85},uFlash:{value:0}},transparent:true,depthWrite:false,
    blending:THREE.AdditiveBlending,toneMapped:false,
    vertexShader:`attribute float aSeed;uniform float uTime,uIntensity;
      varying float vSpark,vSeed;
      void main(){vSeed=aSeed;
        vSpark=pow(max(0.0,sin(uTime*(2.0+aSeed*9.0)+aSeed*1254.0)),13.0);
        vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_PointSize=clamp(210.0/max(1.0,-mv.z),1.0,5.0)*(0.6+vSpark*1.7)*uIntensity;
        gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uIntensity,uFlash;varying float vSpark,vSeed;
      void main(){float r=length(gl_PointCoord-.5)*2.0;
        float halo=exp(-r*r*11.0);
        float alpha=halo*(.1+vSpark*.84+uFlash*.4)*uIntensity*(.4+.6*vSeed);
        vec3 tint=mix(vec3(.36,.76,1.0),vec3(.94,.47,.85),pow(vSeed,4.0));
        gl_FragColor=vec4(tint,alpha);}`});
  const obj=new THREE.Points(geo,mat);obj.frustumCulled=false;obj.renderOrder=10;
  return {obj,geo,mat,count:n};
}

/** Build original height-based terrain then extend with cohesive storm lighting. */
export async function mountTerrain(host,opts={}){
  const MARKERS=opts.projects??[];
  if(!host)throw new Error('Missing host element');
  const status=msg=>opts.onStatus?.(msg);
  const settings={...DEFAULT_SETTINGS,...opts.settings};
  const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  if(reducedMotion){settings.dragonBreathEnabled=false;opts.onSetting?.('dragonBreathEnabled',false);}
  status('Checking WebGL2...');
  const canvas=document.createElement('canvas');
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'high-performance'});
  if(!gl)throw new Error('WebGL2 unavailable. Check browser hardware acceleration and GPU support.');
  status('Reading original height maps and logo mask...');
  const [hm,logo,detail,fbmMask]=await Promise.all([
    readPixels(ASSET+'02.jpg'),readPixels(ASSET+'logo.jpg'),readPixels(ASSET+'displace-background.webp'),readPixels(ASSET+'fbm-mask.webp')]);
  opts.signal?.throwIfAborted();
  const scene=new THREE.Scene();scene.background=cBackDark.clone();
  scene.fog=new THREE.FogExp2(cFogDark.clone(),.0032);
  const camera=new THREE.PerspectiveCamera(52,1,.5,1900);
  let mobileCameraScale=getMobileCameraScale(host.clientWidth,host.clientHeight);
  camera.position.set(22,80,150);camera.lookAt(0,1,-15);
  const renderer=new THREE.WebGLRenderer({canvas,context:gl,antialias:false});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=settings.exposure;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,settings.maxPixelRatio));
  renderer.info.autoReset=false;
  host.appendChild(renderer.domElement);
  const resources=[];
  const audio=createSceneAudio({musicUrl:AUDIO+'kaer-morhen.mp3',portalUrl:AUDIO+'portal-jump.mp3',hoverUrl:AUDIO+'air_slash_02.mp3',
    thunderSets:createThunderSampleSets(AUDIO),settings,detailMode:Boolean(opts.projectSlug),
    onError:message=>opts.onInteraction?.(message),onState:state=>opts.onAudioState?.(state)});
  const onAbort=()=>audio.dispose();
  opts.signal?.addEventListener('abort',onAbort,{once:true});
  void audio.unlock();
  const galleryLauncher=createGalleryLauncher({reducedMotion});
  let renderErrorMessage='';
  const errorSurface=document.createElement('div');
  errorSurface.className='webgl-diagnostics';
  errorSurface.setAttribute('role','alert');
  errorSurface.style.cssText='position:absolute;left:18px;bottom:82px;z-index:50;max-width:min(660px,calc(100% - 36px));max-height:45vh;overflow:auto;white-space:pre-wrap;word-break:break-word;padding:14px 16px;background:#1d101cf0;border:1px solid #ed8198;color:#fff0f2;border-radius:10px;font:12px/1.6 ui-monospace,Consolas,monospace;display:none;pointer-events:auto';
  host.appendChild(errorSurface);
  function reportRenderError(error,phase='renderer') {
    const full=error instanceof Error ? (error.stack||error.message) : String(error);
    // Avoid stacking duplicate shader errors per frame.
    if(renderErrorMessage===full)return;
    renderErrorMessage=full;
    errorSurface.textContent=`WEBGL2 ${phase.toUpperCase()} ERROR\n${full}\n\nTry the offline preview in this ZIP if your browser blocks WebGL2. Press F12 > Console to inspect the complete error.`;
    errorSurface.style.display='block';
    status('Render error — see the diagnostic panel and Console.');
    opts.onError?.(error);
    console.error('[terrain-v5.1]',phase,error);
  }
  renderer.debug.onShaderError=(context,program,vertexShader,fragmentShader)=>{
    const details=[context.getProgramInfoLog(program),
      context.getShaderInfoLog(vertexShader),context.getShaderInfoLog(fragmentShader)]
      .filter(Boolean).join('\n');
    reportRenderError(new Error(details||'GLSL compilation/link failure'),'shader');
  };
  let destroyed=false,raf=0,composer=null,ground=null,film=null,atmosphere=null;
  let shimmer=null,water=null,riverMask=null,forest=null,bloomPass=null,resizeObserver=null,fluid=null;
  let dragons=null,showcasePass=null,projectPage=null,frameSizing=null,projectBackground=null;
  let renderRatio=Math.min(devicePixelRatio||1,settings.maxPixelRatio);
  let auto=true,overhead=false,orbit=0,dragOffset=0,dragging=false,dragX=0,pointerX=0;
  let galleryActive=false,galleryAudioEnabled=true,galleryPausedAt=0;
  let elapsed=0,prev=0,lastStorm=0,flash=0;
  const lighting={};
  const cameraFocus=new THREE.Vector3(0,1,-18),desiredFocus=new THREE.Vector3(),desiredCamera=new THREE.Vector3();
  const dispose=()=>{
    if(destroyed)return;destroyed=true;cancelAnimationFrame(raf);
    opts.signal?.removeEventListener('abort',onAbort);
    window.removeEventListener('resize',resize);resizeObserver?.disconnect();
    renderer.domElement.removeEventListener('pointermove',onPointerMove);
    renderer.domElement.removeEventListener('pointerleave',onPointerLeave);
    renderer.domElement.removeEventListener('pointerdown',onPointerDown);
    window.removeEventListener('pointerup',onPointerUp);
    renderer.domElement.removeEventListener('wheel',onWheel);
    projectPage?.dispose();atmosphere?.dispose();audio.dispose();dragons?.dispose();forest?.dispose();fluid?.dispose();film?.dispose();water?.dispose();composer?.passes.forEach(pass=>pass.dispose());composer?.dispose();
    galleryLauncher.dispose();
    if(!composer)bloomPass?.dispose();
    resources.forEach(r=>r?.dispose?.());
    renderer.dispose();renderer.domElement.remove();errorSurface.remove();
  };
  let texLoader=new THREE.TextureLoader();
  let blenderEnvironment=null,surface,heightAt;
  const onPointerMove=e=>{
    const rect=host.getBoundingClientRect();pointerX=(e.clientX-rect.left)/rect.width-.5;
    if(dragging){dragOffset+=(e.clientX-dragX)*.0033;dragX=e.clientX;}
    fluid?.move((e.clientX-rect.left)/rect.width,1-(e.clientY-rect.top)/rect.height);
  };
  const onPointerLeave=()=>fluid?.leave();
  const onPointerDown=e=>{if(e.button!==0||e.target!==renderer.domElement)return;
    dragging=true;dragX=e.clientX;};
  const onPointerUp=()=>{dragging=false;};
  const onWheel=e=>{
    if(e.target!==renderer.domElement)return;
    e.preventDefault();settings.cameraDistance=clamp(settings.cameraDistance+Math.sign(e.deltaY)*.055,.62,1.55);
    opts.onSetting?.('cameraDistance',settings.cameraDistance);
  };
  function resize(){if(destroyed)return;
    frameSizing?.request({width:host.clientWidth,height:host.clientHeight,renderRatio,
      displayRatio:Math.min(devicePixelRatio||1,Math.max(.65,settings.maxPixelRatio))});
  }
  const performanceController=createPerformanceController({deviceRatio:devicePixelRatio||1,
    onScale:ratio=>{renderRatio=ratio;resize();},
    onReport:stats=>opts.onPerformance?.(stats)});
  performanceController.configure(settings);
  try{
    status('Loading volcanic terrain and optimized 1K surfaces...');
    if(new URLSearchParams(globalThis.location?.search).get('terrain')!=='legacy'){
      try{
        blenderEnvironment=await loadBlenderEnvironment(ASSET+'aether/',Math.min(8,renderer.capabilities.getMaxAnisotropy()));
        resources.push(blenderEnvironment);
      }catch(error){
        opts.signal?.throwIfAborted();
        console.warn('[terrain] Blender assets unavailable; using the original terrain.',error);
        opts.onInteraction?.('Blender assets unavailable. Showing original terrain.');
      }
    }
    opts.signal?.throwIfAborted();
    surface=blenderEnvironment||createTerrainSurface({relief:hm,glyph:logo,detail,mask:fbmMask});
    heightAt=surface.heightAt;
    resources.push(surface.normalMap);
    status('Loading rock, wet normal maps, panorama and film noise...');
    const [diffuse,n1,n2,rockDetail,flowNoise,grassPixels]=await Promise.all([
      loadTexture(texLoader,'terrain-diffuse.webp'),loadTexture(texLoader,'normal_1.webp',false),loadTexture(texLoader,'normal_2.webp',false),
      loadTexture(texLoader,'displace-background.webp',false),
      loadTexture(texLoader,'perlin.webp',false),readPixels(ASSET+'terrain-diffuse.webp')
    ]);
    resources.push(diffuse,n1,n2,rockDetail,flowNoise);
    opts.signal?.throwIfAborted();
    flowNoise.wrapS=flowNoise.wrapT=THREE.RepeatWrapping;
    riverMask=createRiverMask(heightAt);resources.push(riverMask.texture);
    n1.wrapS=n1.wrapT=n2.wrapS=n2.wrapT=THREE.RepeatWrapping;
    n1.repeat.set(15,15);n2.repeat.set(27,27);
    rockDetail.wrapS=rockDetail.wrapT=THREE.RepeatWrapping;rockDetail.repeat.set(5,5);
    for(const texture of [n1,n2,diffuse,rockDetail,surface.normalMap].filter(Boolean))
      configureSurfaceTexture(texture,Math.min(16,renderer.capabilities.getMaxAnisotropy()));
    status('Preserving displaced terrain geometry...');
    const N=host.clientWidth<700?320:512,S=340,geo=blenderEnvironment?.geometry||new THREE.PlaneGeometry(S,S,N,N);
    if(!blenderEnvironment)geo.rotateX(-Math.PI/2);
    const position=geo.attributes.position;
    if(!blenderEnvironment)for(let i=0;i<position.count;i++){
      position.setY(i,heightAt(position.getX(i),position.getZ(i)));
    }
    position.needsUpdate=true;geo.computeVertexNormals();
    const material=new THREE.MeshStandardMaterial({
      map:diffuse,normalMap:surface.normalMap,normalMapType:THREE.ObjectSpaceNormalMap,
      bumpMap:rockDetail,bumpScale:1.55,
      roughness:.9,metalness:.08,side:THREE.DoubleSide,
      color:'#96a9d1',emissiveMap:diffuse,emissive:'#6388c3',emissiveIntensity:.15
    });
    const valleyUniforms={uValleyFog:{value:settings.fog},uValleyColor:{value:scene.fog.color},uVolcanoHeat:{value:0},uVolcanoTime:{value:0}};
    material.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,valleyUniforms);
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vTerrainWorld;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nvTerrainWorld=(modelMatrix*vec4(position,1.0)).xyz;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vTerrainWorld;\nuniform float uValleyFog;\nuniform vec3 uValleyColor;')
        .replace('#include <normal_fragment_maps>',`
          #include <normal_fragment_maps>
          vec3 worldRockNormal=inverseTransformDirection(normal,viewMatrix);
          vec3 sourceColor=texture2D(map,vMapUv).rgb;
          float grassColor=smoothstep(.002,.035,sourceColor.g-sourceColor.r*1.08);
          float outerMeadow=smoothstep(94.0,136.0,length(vTerrainWorld.xz))*.55;
          float grassCover=max(grassColor,outerMeadow)*smoothstep(.25,.8,worldRockNormal.y)
            *smoothstep(3.0,9.0,vTerrainWorld.y);
          float grassVariation=texture2D(bumpMap,vTerrainWorld.xz*.027).r;
          vec3 grassTint=mix(vec3(.012,.033,.026),vec3(.026,.063,.047),grassVariation);
          float meadowDetail=texture2D(bumpMap,vTerrainWorld.xz*.73).r;
          float sourceLuminance=dot(sourceColor,vec3(.2126,.7152,.0722));
          grassTint*=mix(.72,1.35,smoothstep(.015,.21,sourceLuminance))*(.86+meadowDetail*.28);
          diffuseColor.rgb=mix(diffuseColor.rgb,grassTint,grassCover*.86);
          vec3 meadowNormal=normalize((viewMatrix*vec4(0.0,1.0,0.0,0.0)).xyz);
          normal=normalize(mix(normal,meadowNormal,grassCover*.18));
          vec3 blendWeights=pow(abs(worldRockNormal),vec3(4.0));
          blendWeights/=max(dot(blendWeights,vec3(1.0)),.0001);
          float rockHeight=texture2D(bumpMap,vTerrainWorld.yz*.09).r*blendWeights.x
            +texture2D(bumpMap,vTerrainWorld.xz*.09).r*blendWeights.y
            +texture2D(bumpMap,vTerrainWorld.xy*.09).r*blendWeights.z;
          float fineRock=texture2D(bumpMap,vTerrainWorld.yz*.31).r*blendWeights.x
            +texture2D(bumpMap,vTerrainWorld.xz*.31).r*blendWeights.y
            +texture2D(bumpMap,vTerrainWorld.xy*.31).r*blendWeights.z;
          float rockRelief=(rockHeight+fineRock*.22)*bumpScale*mix(1.0,.18,grassCover)+meadowDetail*grassCover*.11;
          normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(rockRelief),dFdy(rockRelief)),faceDirection);
        `)
        .replace('#include <emissivemap_fragment>',`
          #include <emissivemap_fragment>
          totalEmissiveRadiance*=mix(1.0,.12,grassCover);
        `)
        .replace('#include <opaque_fragment>',`
          outgoingLight*=mix(vec3(1.0),vec3(.62,.88,.53),grassCover);
          float valley=1.0-smoothstep(1.2,13.2,vTerrainWorld.y);
          outgoingLight=mix(outgoingLight,uValleyColor*1.1,valley*valley*uValleyFog*.7);
          float distantHaze=smoothstep(155.0,330.0,distance(cameraPosition,vTerrainWorld));
          outgoingLight=mix(outgoingLight,uValleyColor*.45,distantHaze*uValleyFog*.32);
          #include <opaque_fragment>
        `)
        .replace('#include <fog_fragment>',`
          #ifdef USE_FOG
            float terrainFog=1.0-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth*.38);
            gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor*.6,terrainFog);
          #endif
        `);
    };
    if(blenderEnvironment)applyBlenderTerrainMaterial(material,blenderEnvironment.maps,valleyUniforms);
    ground=new THREE.Mesh(geo,material);ground.name=blenderEnvironment?'Volcanic island and crescent ridge':'Continuous eroded terrain';scene.add(ground);
    if(!blenderEnvironment)resources.push(geo);
    resources.push(material);
    const volcano=blenderEnvironment?createVolcanoAtmosphere(scene,heightAt,reducedMotion):null;
    if(volcano)resources.push(volcano);
    lighting.ambient=new THREE.HemisphereLight('#accae5','#182f48',1.2);
    lighting.key=new THREE.DirectionalLight('#d1e8ff',2.0);lighting.key.position.set(-75,145,-120);
    lighting.fill=new THREE.DirectionalLight('#5595b8',.83);lighting.fill.position.set(75,38,92);
    scene.add(lighting.ambient,lighting.key,lighting.fill);
    bloomPass=new SelectiveBloomPass(scene,camera);bloomPass.update(settings);
    water=createRiverWater(n1,n2,riverMask.texture,flowNoise);scene.add(water.mesh);
    bloomPass.include(water.mesh,'river');bloomPass.include(water.mesh,'storm');
    // Thin silver/cyan glints on wet shoreline, rather than a glowing terrain blanket.
    shimmer=makeShoreGlints(heightAt,riverMask);scene.add(shimmer.obj);bloomPass.include(shimmer.obj,'river');
    resources.push(shimmer.geo,shimmer.mat);
    forest=blenderEnvironment?blenderEnvironment.createForest(grassPixels,host.clientWidth<700?70:140):createForest({heightAt,colorMap:grassPixels,maximum:host.clientWidth<700?190:300,
      anisotropy:Math.min(8,renderer.capabilities.getMaxAnisotropy())});
    scene.add(forest.group);const count=forest.count;
    status('Decoding dragon textures, independent skeletons and flight animation...');
    dragons=await createDragons({scene,terrainMaterial:material,heightAt,assetBase:ASSET,
      decoderPath:`${import.meta.env?.BASE_URL || '/'}terrain/vendor/draco/`,mobile:host.clientWidth<700,
      reducedMotion,anisotropy:Math.min(8,renderer.capabilities.getMaxAnisotropy()),
      onBloom:object=>bloomPass.include(object,'dragon')});
    opts.signal?.throwIfAborted();
    water.setReflectionExclusions([dragons.group,...dragons.dragons.map(dragon=>dragon.effect.group)]);
    status('Building thunderstorm, reactive energy beacons and project image shader...');
    atmosphere=await createAtmosphere({scene,camera,renderer,host,imageBase:ASSET,heightAt,riverMask,markers:MARKERS,
      markerOrigins:blenderEnvironment?createPortfolioMarkerOrigins(MARKERS,heightAt):undefined,
      onThunder:event=>{void audio.strike(event);},
      onPortalOpen:project=>{void audio.playPortal(project);},onPortalClose:()=>audio.stopPortal(),
      onViewProject:id=>projectPage?.open(id),isShowcasing:()=>showcasePass?.transition.getState().active||false,
      onRiver:object=>bloomPass.include(object,'river'),onFlame:object=>bloomPass.include(object,'flame'),
      onStorm:object=>bloomPass.include(object,'storm'),
      onStatus:msg=>opts.onInteraction?.(msg)});
    opts.signal?.throwIfAborted();
    for(const [k,v] of Object.entries(settings))atmosphere.setSetting(k,v);
    status('Building bloom + full-scene grain and cinematic grade...');
    film=await makeFilmPass(ASSET);
    opts.signal?.throwIfAborted();
    fluid=createPointerFluid(renderer);fluid.resize(host.clientWidth||1024,host.clientHeight||768);
    const sceneTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,
      depthTexture:new THREE.DepthTexture(1,1,THREE.UnsignedIntType)});
    composer=new EffectComposer(renderer,sceneTarget);
    composer.setPixelRatio(1);
    composer.renderTarget2.depthTexture.dispose();
    composer.renderTarget2.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
    const worldPass=new RenderPass(scene,camera);
    composer.addPass(worldPass);
    composer.addPass(bloomPass);composer.addPass(film.pass);
    const projectMasks=createProjectMasks(hm,fbmMask);
    resources.push(projectMasks.erosion,projectMasks.reveal);
    showcasePass=new ProjectShowcasePass({reducedMotion,distortion:rockDetail,masks:projectMasks});
    const projectDirection=new THREE.Vector3(0,.4,-.9).normalize();
    projectBackground=new ProjectBackgroundPass({scene,camera,objects:[ground,water.mesh,...Object.values(lighting)],
      distortion:rockDetail,stormUniforms:showcasePass.uniforms,reducedMotion,
      beforeCapture:time=>water.update(time,0,settings,scene.fog,projectDirection)
    });
    composer.addPass(projectBackground);
    projectPage=createProjectPage({host,pass:showcasePass,projects:MARKERS,imageBase:ASSET,base:import.meta.env?.BASE_URL||'/',reducedMotion,onNavigate:opts.onNavigate,
      noise:atmosphere.getProjectNoise(),getArtwork:(id,url)=>atmosphere.getProjectArtwork(id,url),
      loadArtwork:(id,url)=>atmosphere.loadProjectArtwork(id,url),
      onProject:id=>{if(atmosphere.getSelectedProject()!==id)atmosphere.select(id,{silent:true});},
      onActive:value=>{atmosphere.setShowcaseActive(value);audio.setDetailMode(value);if(value)dragging=false;},
      onImageHover:()=>{void audio.playHover();}
    });
    const outputPass=new OutputPass();
    const projectOutput=configureProjectOutput(outputPass);
    composer.addPass(outputPass);composer.addPass(showcasePass);composer.addPass(film.grainPass);
    frameSizing=createFrameSizing({renderer,composer,camera,fluid,water,onResize:()=>{
      mobileCameraScale=getMobileCameraScale(host.clientWidth,host.clientHeight);
      projectPage?.resize();
    }});
    renderer.domElement.addEventListener('pointermove',onPointerMove,{passive:true});
    renderer.domElement.addEventListener('pointerleave',onPointerLeave);
    renderer.domElement.addEventListener('pointerdown',onPointerDown);
    window.addEventListener('pointerup',onPointerUp);
    renderer.domElement.addEventListener('wheel',onWheel,{passive:false});
    window.addEventListener('resize',resize);
    resizeObserver=typeof ResizeObserver==='undefined'?null:new ResizeObserver(resize);
    resizeObserver?.observe(host);resize();frameSizing.apply();
    status('Warming sky, river and dragon shaders...');
    await renderer.compileAsync(scene,camera);
    opts.signal?.throwIfAborted();
    projectPage.restore();
    let t0=performance.now();
    const loop=()=>{
      if(destroyed || renderErrorMessage)return;
      if(document.hidden){prev=(performance.now()-t0)*.001;raf=requestAnimationFrame(loop);return;}
      const frameStarted=performance.now();renderer.info.reset();
      try {
      frameSizing.apply();
      elapsed=(performance.now()-t0)*.001;
      const frameMs=(elapsed-prev)*1000;
      const dt=clamp(elapsed-prev,.001,.055);prev=elapsed;
      const stormState=atmosphere.updateStorm(elapsed,dt);
      showcasePass.setStorm(stormState.flash,stormState.flashDirection);
      const showcaseState=showcasePass.update(elapsed,frameMs*.001);
      projectBackground.update(elapsed,showcaseState,showcasePass.uniforms.uPointer.value,settings);
      projectOutput.update(showcaseState,settings,projectBackground.uniforms.uDebug.value>0);
      projectPage.update(showcaseState);
      worldPass.enabled=bloomPass.enabled=film.pass.enabled=showcaseState.needsWorld;
      lighting.ambient.intensity=(4.2-settings.storm*.35)*settings.ambientFill;
      lighting.key.intensity=(7.8-settings.storm*.5)*settings.ambientFill;
      lighting.fill.intensity=1.7*settings.ambientFill;
      valleyUniforms.uValleyFog.value=settings.fog;
      scene.fog.density=.0016+settings.fog*.0034+settings.storm*.00045;
      scene.fog.color.copy(cFogDark).multiplyScalar(settings.fogBrightness);
      scene.background.copy(cBackDark).multiplyScalar(settings.skyBrightness*.88);
      material.roughness=.98-settings.wetness*.14;
      material.metalness=.03+settings.wetness*.05;
      material.emissiveIntensity=.09+settings.ambientFill*.025;
      renderer.toneMappingExposure=settings.exposure;
      if(showcaseState.needsWorld){
      if(auto)orbit+=dt*.013*settings.cameraSpeed;
      const angle=orbit+dragOffset+pointerX*.1;
      desiredFocus.set(0,1,-18);
      if(overhead){desiredCamera.set(0,229*settings.cameraDistance,1);desiredFocus.set(0,0,0);}
      else {desiredCamera.set((24+Math.sin(angle)*18)*settings.cameraDistance,
        (79+Math.sin(elapsed*.18)*1.6)*settings.cameraDistance,
        (151+Math.cos(angle)*8)*settings.cameraDistance);
        const selectedAnchor=atmosphere.getSelectedAnchor();
        if(selectedAnchor){
          desiredCamera.set(12,59,136).multiplyScalar(settings.cameraDistance).add(selectedAnchor);
          desiredFocus.copy(selectedAnchor);desiredFocus.y+=10;
        }
      }
      const cameraBlend=1-Math.exp(-dt*3.5);
      desiredCamera.sub(desiredFocus).multiplyScalar(mobileCameraScale).add(desiredFocus);
      camera.position.lerp(desiredCamera,cameraBlend);cameraFocus.lerp(desiredFocus,cameraBlend);camera.lookAt(cameraFocus);
      const st=atmosphere.update(elapsed,dt,stormState);
      flash=st.flash;lastStorm=settings.storm;
      water.update(elapsed,flash,settings,scene.fog,st.flashDirection);
      n2.offset.set(elapsed*.001,elapsed*.0015);
      shimmer.mat.uniforms.uTime.value=elapsed;
      shimmer.mat.uniforms.uIntensity.value=settings.sparkles;
      shimmer.mat.uniforms.uFlash.value=flash;
      bloomPass.update(settings,flash);forest.update(elapsed,settings.wind);
      dragons.update(elapsed,dt,settings);
      const fireDragon=dragons.dragons[0],iceDragon=dragons.dragons[1];
      const breathEnergy=settings.dragonsEnabled?THREE.MathUtils.clamp(settings.breathPower/.12,0,1):0;
      const heating=fireDragon.effect.impact?.dry?fireDragon.strength*breathEnergy:0;
      valleyUniforms.uVolcanoHeat.value=THREE.MathUtils.damp(valleyUniforms.uVolcanoHeat.value,heating,heating>valleyUniforms.uVolcanoHeat.value?3.2:.45,dt);
      valleyUniforms.uVolcanoTime.value=reducedMotion?0:elapsed;
      volcano?.update(elapsed,valleyUniforms.uVolcanoHeat.value);
      water.setFrost?.(iceDragon.effect.impact,iceDragon.strength*breathEnergy,dt);
      const fluidTexture=fluid.update(dt);
      film.update(elapsed,0,settings,renderer.domElement.width,renderer.domElement.height,fluidTexture);
      }else{
        film.grainPass.uniforms.uTime.value=reducedMotion?0:elapsed;
      }
      film.grainPass.uniforms.uAmount.value=THREE.MathUtils.lerp(settings.grain,settings.projectGrain,showcaseState.amount);
      film.grainPass.uniforms.uProjectAmount.value=showcaseState.amount;
      film.grainPass.uniforms.uProjectAspect.value=host.clientWidth/Math.max(1,host.clientHeight);
      if(showcaseState.active&&projectBackground.uniforms.uDebug.value>0)film.grainPass.uniforms.uAmount.value=0;
      composer.render();
      galleryLauncher.render(renderer,elapsed,showcaseState.amount);
      performanceController.sample(frameMs,performance.now()-frameStarted,settings,renderer.info.render,!document.hidden);
      if(!renderErrorMessage)raf=requestAnimationFrame(loop);
      } catch (error) {
        reportRenderError(error,'frame');
      }
    };
    void audio.unlock();
    loop();
    status(`Ready · ${position.count.toLocaleString()} vertices · ${count} trees · 2 animated dragons · ${MARKERS.length} reactive portals.`);
    return {
      destroy:dispose,
      setAudioEnabled:value=>audio.setEnabled(value),getAudioState:()=>audio.getState(),
      syncRoute:(id,project)=>{projectPage.syncRoute(id,project);if(!id)atmosphere.close();},
      setGalleryLauncher:layout=>galleryLauncher.setLayout(layout),
      setGalleryActive(value){
        const active=Boolean(value);if(destroyed||galleryActive===active)return;
        galleryActive=active;projectPage.setModalActive(active);
        if(active){galleryPausedAt=performance.now();galleryAudioEnabled=audio.getState().masterEnabled;void audio.setEnabled(false);cancelAnimationFrame(raf);}
        else{t0+=performance.now()-galleryPausedAt;prev=(performance.now()-t0)*.001;void audio.setEnabled(galleryAudioEnabled);raf=requestAnimationFrame(loop);}
      },
      getGalleryState:()=>({active:galleryActive}),
      setSetting(key,value){if(key in settings){settings[key]=typeof settings[key]==='boolean'?Boolean(value):Number(value);
        audio.setSetting(key,settings[key]);
        atmosphere.setSetting(key,settings[key]);
        if(key==='maxPixelRatio'||key==='adaptiveQuality')performanceController.configure(settings);
        const fluidMap={fluidPersistence:'persistence',fluidDiffusion:'diffusion',fluidThickness:'thickness'};
        if(fluidMap[key])fluid?.set(fluidMap[key],settings[key]);
        return true;}return false;},
      setSettings(next){for(const [key,value] of Object.entries(next))this.setSetting(key,value);},
      getSettings:()=>({...settings}),
      setOverhead:v=>{overhead=Boolean(v);},setAuto:v=>{auto=Boolean(v);},
      flash:()=>{void audio.unlock();atmosphere.flash();},selectPortal:id=>atmosphere.select(id),closePortal:()=>atmosphere.close(),
      breathe:kind=>dragons.breathe(kind),getDragonState:()=>dragons.getState(),
      getPerformance:()=>performanceController.getState(),
      openProject:id=>projectPage.open(id),closeShowcase:()=>projectPage.overview(),getShowcaseState:()=>projectPage.getState(),
      getProjectBackgroundState:()=>projectBackground.getState(),
      setProjectBackgroundDebug:mode=>{const changed=projectBackground.setDebug(mode);if(changed)showcasePass.uniforms.uHideArtwork.value=mode==='off'?0:1;return changed;},
    };
  }catch(e){dispose();if(e.name!=='AbortError')reportRenderError(e,'startup');throw e;}
}
