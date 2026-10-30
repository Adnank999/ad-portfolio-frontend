import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mountTerrain, DEFAULT_SETTINGS } from './engine/scene.js';
import { PERFORMANCE_PRESET } from './engine/performance.js';
import { toTerrainProjects } from './project-data';
import { TerrainNavigation } from './TerrainNavigation';


const SHOW_BACKGROUND_BUTTON=false;
const ProjectGallery=lazy(()=>import('./gallery/ProjectGallery'));

const SLIDERS={
  WEATHER:[
    ['storm','Storm depth',0,1],['rain','Rain density',0,1],['fog','Valley fog',0,1],
    ['wind','Rain wind',0,1],['lightningRate','Thunder frequency',0,1],
    ['lightningStrength','Lightning power',0,2],['fogBrightness','Fog brightness',.4,2.5],
    ['skyBrightness','Sky brightness',.4,2.7],
  ],
  AUDIO:[
    ['musicVolume','Background music volume',0,.5],['thunderVolume','Thunder volume',0,1],
    ['portalVolume','Portal sound volume',0,.7],
  ],
  SKY:[
    ['skyMist','Sky mist / haze',0,1.5],['skyThunderGlow','Sky lightning glow',0,2],
    ['thunderBloom','Thunder bloom (sky + river)',0,2.5],['thunderBloomThreshold','Thunder bloom threshold',0,1.5],
  ],
  RIVER:[
    ['riverGlow','River glow',0,2.5],['riverSpeed','River flow speed',0,2],
    ['riverBloom','River bloom',0,2.6],['riverBloomThreshold','River bloom threshold',0,1],
    ['sparkles','Shore glints',0,2],
  ],
  DRAGONS:[
    ['dragonFlightSpeed','Dragon flight speed',0,1.6],['dragonSize','Dragon size',.6,1.5],
    ['dragonAltitude','Flight clearance',12,36],['breathLength','Breath reach',18,55],
    ['breathPower','Breath intensity',0,2],['dragonBloom','Dragon breath bloom',0,1.6],
    ['dragonBloomThreshold','Dragon bloom threshold',0,1.5],['frostDuration','Frost thaw time (s)',5,60],
    ['dragonLighting','Dragon soft fill',0,2.5],['dragonRim','Dragon moon rim',0,2],
  ],
  PERFORMANCE:[
    ['maxPixelRatio','Maximum pixel ratio',.65,1.6],['reflectionFps','Reflection refresh (FPS)',15,60],
    ['reflectionScale','Reflection resolution',.25,.75],['breathSteps','Breath ray-march steps',10,28],
  ],
  RENDER:[
    ['exposure','Renderer exposure',.25,3.0],['ambientFill','Terrain lighting',.25,2.5],
    ['wetness','Wet rock',0,1],['bloom','Flame bloom',0,2.6],
    ['bloomThreshold','Flame bloom threshold',0,1],
    ['grain','Film grain',0,.25],['vignette','Vignette',0,1],['uiShade','UI shadow overlay',0,1],
    ['chroma','RGB fringe',0,1],['shadowLift','Shadow lift',0,.35],
  ],
  INTERACTION:[
    ['beacon','Beacon energy',0,2],['cursor','Hover radius',.2,2.3],
    ['flameHeight','Flame height',.3,3.2],['hoverFlameBoost','Hover flame stretch',0,3],
    ['flameTurbulence','Flame turbulence',0,2.5],
    ['ripple','Ground ripple intensity',0,2],['cameraSpeed','Camera speed',0,2],
    ['cameraDistance','Camera distance',.62,1.55],
    ['chargeDuration','Charge duration (s)',.45,2.4],['spiralSpeed','Spiral rotation',0,3],
  ],
  PROJECT:[
    ['portalGlow','Portal glow',0,2.5],['portalSize','Portal size',.55,2.25],
    ['portalSwirl','Swirl speed',0,3],['portalWarmth','Warm rim / orange',0,1],
  ],
  BACKGROUND:[
    ['projectGlow','Background glow',0,3],['projectThunderGlow','Page lightning glow',0,2],
    ['projectBloom','Background bloom',0,2],['projectBloomThreshold','Background bloom threshold',0,1],
    ['projectDistortion','Background displacement',0,3],['projectDistortionScale','Displacement scale',.5,5],
    ['projectBackgroundBlur','Background softness',0,5],['projectExposure','Page exposure',0,1],
    ['projectFrost','Frost sparkle intensity',0,1.5],
    ['projectFrostDensity','Frost sparkle density',0,1],['projectFrostSize','Frost sparkle size',.2,1.2],
    ['projectGrain','Page film grain',0,.12],['projectThunderVolume','Page thunder volume',0,.4],
  ],
  COLOR:[
    ['contrast','Contrast',.4,2.2],['hue','Hue angle',-1,1],
    ['saturation','Saturation',0,2],['gradeExposure','Composite exposure',.35,2.0],
  ],
  FLUID:[
    ['fluidStrength','Pointer fluid displacement',0,2],
    ['fluidPersistence','Flow persistence',.75,.99],
    ['fluidDiffusion','Flow diffusion',0,1],['fluidThickness','Flow radius',.012,.15],
  ],
};
const PRESETS={
  'REFERENCE MIST':{...DEFAULT_SETTINGS},
  'MOODY STORM':{storm:.92,rain:.84,fog:.76,wind:.7,skyBrightness:.92,
    fogBrightness:.88,ambientFill:.86,exposure:.86,gradeExposure:.84,
    contrast:1.26,shadowLift:.035,vignette:.56,uiShade:.58,bloom:.22,riverBloom:.95,grain:1},
  'THUNDER FLASH':{lightningStrength:1.25,riverGlow:1.18,riverSpeed:.7,sparkles:.7},
  'CLEAR NIGHT':{storm:.20,rain:.06,fog:.25,wind:.15,skyBrightness:1.50,
    fogBrightness:1.22,ambientFill:1.48,exposure:1.58,gradeExposure:1.16,
    contrast:1.04,shadowLift:.07,vignette:.23,uiShade:.25,bloom:.16,riverBloom:.35,grain:.038},
  'TARGET 60 FPS':PERFORMANCE_PRESET,
};
const round=(n)=>Number(n).toFixed(2);

export default function TerrainExperience({projects,project=null,projectSlug=null,onNavigate,onStateChange}){
  const MARKERS=useMemo(()=>toTerrainProjects(projects),[projects]);
  const host=useRef(null),api=useRef(null);
  const galleryActive=useRef(false);
  const tabBar=useRef(null);
  const route=useRef({projectSlug,project,onNavigate,onStateChange});
  const [ready,setReady]=useState(false);
  const [galleryRequest,setGalleryRequest]=useState(null);
  const [audio,setAudio]=useState({enabled:true,status:'blocked'});
  const [settings,setSettings]=useState({...DEFAULT_SETTINGS});
  const [performance,setPerformance]=useState(null);
  const [controlsOpen,setControlsOpen]=useState(false);
  const [tab,setTab]=useState(projectSlug?'BACKGROUND':'WEATHER');
  const [topdown,setTopdown]=useState(false),[auto,setAuto]=useState(true);
  const onGalleryActive=useCallback(active=>{galleryActive.current=active;api.current?.setGalleryActive(active);},[]);
  const onLauncherLayout=useCallback(layout=>api.current?.setGalleryLauncher(layout),[]);
  const onOpenGallery=useCallback((slug,src,trigger)=>setGalleryRequest({projectSlug:slug,src,trigger}),[]);
  useEffect(()=>{
    route.current={projectSlug,project,onNavigate,onStateChange};
    api.current?.syncRoute(projectSlug,project);
  },[projectSlug,project,onNavigate,onStateChange]);
  useEffect(()=>{
    setControlsOpen(false);
    setGalleryRequest(null);
    setTab(projectSlug?'BACKGROUND':'WEATHER');
  },[projectSlug]);
  useEffect(()=>{
    const bar=tabBar.current,active=bar?.querySelector('[aria-selected="true"]');
    if(!controlsOpen||!active)return;
    bar.scrollLeft+=active.getBoundingClientRect().left-bar.getBoundingClientRect().left-(bar.clientWidth-active.clientWidth)/2;
  },[controlsOpen,tab]);
  useEffect(()=>{
    let cancelled=false,handle;
    const controller=new AbortController();
    setReady(false);route.current.onStateChange('loading');
    mountTerrain(host.current,{
      settings:DEFAULT_SETTINGS,signal:controller.signal,projects:MARKERS,
      projectSlug:route.current.projectSlug,
      onAudioState:state=>{if(!cancelled)setAudio(state);},
      onNavigate:slug=>route.current.onNavigate(slug),
      onOpenGallery,
      onError:()=>{if(!cancelled){route.current.onStateChange('error');api.current?.destroy();}},
      onSetting:(key,value)=>{if(!cancelled)setSettings(s=>({...s,[key]:value}));},
      onPerformance:stats=>{if(!cancelled)setPerformance(stats);}
    }).then(scene=>{
      if(cancelled)scene.destroy();
      else {handle=scene;api.current=scene;scene.syncRoute(route.current.projectSlug,route.current.project);setReady(true);route.current.onStateChange('ready');}
    }).catch(err=>{if(!cancelled&&err.name!=='AbortError'){console.error('[storm terrain]',err);route.current.onStateChange('error');}});
    return ()=>{cancelled=true;controller.abort();handle?.destroy();api.current=null;};
  },[MARKERS,onOpenGallery]);
  const set=(key,value)=>{const parsed=typeof DEFAULT_SETTINGS[key]==='boolean'?Boolean(value):Number(value);
    setSettings(s=>({...s,[key]:parsed}));api.current?.setSetting(key,parsed);};
  const preset=(name)=>{
    const next={...settings,...PRESETS[name]};
    for(const key of ['musicEnabled','musicVolume','portalSoundEnabled','portalVolume','soundEnabled','thunderVolume','projectThunderVolume'])next[key]=settings[key];
    if(name!=='TARGET 60 FPS')for(const key of Object.keys(PERFORMANCE_PRESET))next[key]=settings[key];
    setSettings(next);api.current?.setSettings(next);
    if(name==='THUNDER FLASH')api.current?.flash();
  };
  const toggleAuto=()=>{api.current?.setAuto(!auto);setAuto(!auto);};
  const toggleView=()=>{api.current?.setOverhead(!topdown);setTopdown(!topdown);};
  const toggleSound=enabled=>{void api.current?.setAudioEnabled(enabled);};
  useEffect(()=>{
    const keyboard=event=>{
      if(galleryActive.current)return;
      const key=event.key.toLowerCase();
      if(key==='p'&&!event.repeat&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();setControlsOpen(open=>!open);return;}
      if(event.target?.tagName==='INPUT')return;
      if(api.current?.getShowcaseState().active)return;
      if(event.target?.tagName==='BUTTON')return;
      if(key==='l')api.current?.flash();
      if(key==='1'&&MARKERS[0])api.current?.selectPortal(MARKERS[0].id);
      if(key==='2'&&MARKERS[1])api.current?.selectPortal(MARKERS[1].id);
      if(key==='3'&&MARKERS[2])api.current?.selectPortal(MARKERS[2].id);
      if(key==='4'&&MARKERS[3])api.current?.selectPortal(MARKERS[3].id);
      if(key==='5'&&MARKERS[4])api.current?.selectPortal(MARKERS[4].id);
      if(key==='6'&&MARKERS[5])api.current?.selectPortal(MARKERS[5].id);
      if(key==='r')set('rippleEnabled',!settings.rippleEnabled);
      if(key==='b')api.current?.breathe('both');
    };window.addEventListener('keydown',keyboard);
    return ()=>window.removeEventListener('keydown',keyboard);
  },[settings.rippleEnabled,MARKERS]);

  return <main className="terrain-experience" style={{'--ui-shade':settings.uiShade}}>
    <div className="stage" ref={host} />
    <div className="vignette" />
    <TerrainNavigation projectSlug={projectSlug} audio={audio} ready={ready} onToggleSound={toggleSound}/>
    <section className="hero-copy">
      <p className="eyebrow">DESIGN &amp; DEVELOPMENT / SELECTED WORK</p>
      <h1>Crafting<br/>experiences<br/>worth remembering.</h1>
      <p className="description">From first idea to final detail, I build thoughtful digital products with lasting impact.</p>
      <button className="hero-cta" disabled={!ready||!MARKERS.length} onClick={()=>MARKERS[0]&&api.current?.selectPortal(MARKERS[0].id)}>
        ENTER THE WORLD <span>↗</span>
      </button>
    </section>
    {project&&<Suspense fallback={null}><ProjectGallery key={project.slug} project={project} ready={ready} openRequest={galleryRequest} onActive={onGalleryActive} onLauncherLayout={onLauncherLayout}/></Suspense>}
    {SHOW_BACKGROUND_BUTTON&&project&&!controlsOpen&&<button className="project-background-controls" aria-label="Project background controls" aria-controls="terrain-storm-controls" aria-expanded={false} onClick={()=>{setTab('BACKGROUND');setControlsOpen(true);}}>BACKGROUND</button>}
    {controlsOpen&&<aside id="terrain-storm-controls" className="control-dock open" aria-label="Storm laboratory">
      <div className="dock-header"><div><div className="dock-eyebrow">REAL-TIME RENDER LAB</div><strong>Storm controls · V5.3</strong></div>
        <button className="dock-toggle" aria-label="Hide controls" aria-expanded={controlsOpen} onClick={()=>setControlsOpen(!controlsOpen)}>{controlsOpen?'−':'+'}</button></div>
      {controlsOpen&&<div className="dock-content">
        <div className="preset-buttons" aria-label="Weather presets">
          {Object.keys(PRESETS).map(p=><button key={p} disabled={!ready} onClick={()=>preset(p)}>{p}</button>)}
        </div>
        <output className="dock-applied dock-performance" aria-label="Rendering performance">{performance?`${performance.fps.toFixed(0)} FPS · ${performance.frameMs.toFixed(1)} ms/frame · JS ${performance.cpuMs.toFixed(1)} ms · Scene DPR ${performance.pixelRatio.toFixed(2)} · ${performance.calls} draws · ${(performance.triangles/1000000).toFixed(2)}M triangles`:'Measuring render performance…'}</output>
        <div ref={tabBar} className="tab-bar" role="tablist" aria-label="Controls section">
          {Object.keys(SLIDERS).map(t=><button key={t} role="tab" aria-selected={tab===t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}
        </div>
        <div className="sliders" role="group" aria-label={tab+' settings'}>
          {SLIDERS[tab].map(([key,label,min,max])=><label key={key} className="range-row">
            <div className="range-label"><span>{label}</span><output>{round(settings[key])}</output></div>
            <input aria-label={label} type="range" min={min} max={max} step={['reflectionFps','breathSteps'].includes(key)?1:['fluidThickness','projectGrain'].includes(key)?.001:.01} value={settings[key]} disabled={!ready} onChange={e=>set(key,e.target.value)}/>
          </label>)}
        </div>
        {tab==='AUDIO'&&<div className="switch-grid" role="group" aria-label="Soundtrack controls">
          <label className="switch-label"><input type="checkbox" checked={settings.musicEnabled} onChange={e=>set('musicEnabled',e.target.checked)} disabled={!ready}/> BACKGROUND MUSIC <span>{settings.musicEnabled?'ON':'MUTED'}</span></label>
          <label className="switch-label"><input type="checkbox" checked={settings.portalSoundEnabled} onChange={e=>set('portalSoundEnabled',e.target.checked)} disabled={!ready}/> PORTAL SOUND <span>{settings.portalSoundEnabled?'ON':'MUTED'}</span></label>
        </div>}
        {tab==='BACKGROUND'&&<p className="dock-help">Project pages only. Glow and bloom do not change terrain or flame lighting. Page thunder is capped by the main thunder volume; music stays paused. P hides this panel.</p>}
        {tab==='DRAGONS'&&<>
          <div className="switch-grid" role="group" aria-label="Dragon controls">
            <label className="switch-label"><input type="checkbox" checked={settings.dragonsEnabled} onChange={e=>set('dragonsEnabled',e.target.checked)} disabled={!ready}/> DRAGONS <span>{settings.dragonsEnabled?'ON':'OFF'}</span></label>
            <label className="switch-label"><input type="checkbox" checked={settings.dragonBreathEnabled} onChange={e=>set('dragonBreathEnabled',e.target.checked)} disabled={!ready}/> AUTO BREATH <span>{settings.dragonBreathEnabled?'ON':'OFF'}</span></label>
          </div>
          <div className="dock-actions buttons" role="group" aria-label="Trigger dragon breath">
            <button disabled={!ready||!settings.dragonsEnabled} onClick={()=>api.current?.breathe('fire')}>FIRE BREATH</button>
            <button disabled={!ready||!settings.dragonsEnabled} onClick={()=>api.current?.breathe('ice')}>ICE BREATH</button>
            <button disabled={!ready||!settings.dragonsEnabled} onClick={()=>api.current?.breathe('both')}>BOTH / B</button>
          </div>
          <p className="dock-help">Dragon model by <a href={`${import.meta.env.BASE_URL}terrain/THIRD_PARTY_NOTICES.txt`} target="_blank" rel="noreferrer">endlessvoidmc / CC BY 4.0</a>.</p>
        </>}
        {tab==='PERFORMANCE'&&<div className="switch-grid" role="group" aria-label="Performance controls">
          <label className="switch-label"><input type="checkbox" checked={settings.adaptiveQuality} onChange={e=>set('adaptiveQuality',e.target.checked)} disabled={!ready}/> ADAPTIVE RESOLUTION <span>{settings.adaptiveQuality?'ON':'OFF'}</span></label>
          <label className="switch-label"><input type="checkbox" checked={settings.reflectDragons} onChange={e=>set('reflectDragons',e.target.checked)} disabled={!ready}/> DRAGON REFLECTIONS <span>{settings.reflectDragons?'ON':'OFF'}</span></label>
          <p className="dock-help">Target 60 FPS trades resolution and reflection detail for speed. Lightning always refreshes reflections immediately. Actual FPS depends on your GPU and viewport.</p>
        </div>}
        <div className="dock-actions">
          <label className="switch-label"><input type="checkbox" checked={settings.lightningEnabled} onChange={e=>set('lightningEnabled',e.target.checked)} disabled={!ready}/> AUTO THUNDER</label>
          <button disabled={!ready} onClick={()=>api.current?.flash()}>TRIGGER LIGHTNING ↯</button>
        </div>
        <div className="switch-grid" role="group" aria-label="Interaction effect toggles">
          <label className="switch-label"><input type="checkbox" checked={settings.soundEnabled} onChange={e=>set('soundEnabled',e.target.checked)} disabled={!ready}/> THUNDER SOUND <span>{settings.soundEnabled?'ON':'MUTED'}</span></label>
          <label className="switch-label"><input type="checkbox" checked={settings.rippleEnabled} onChange={e=>set('rippleEnabled',e.target.checked)} disabled={!ready}/> GROUND RIPPLES <span>{settings.rippleEnabled?'ON':'OFF'}</span></label>
          <label className="switch-label"><input type="checkbox" checked={settings.particlesEnabled} onChange={e=>set('particlesEnabled',e.target.checked)} disabled={!ready}/> BEACON PARTICLES <span>{settings.particlesEnabled?'ON':'OFF'}</span></label>
        </div>
        <div className="dock-actions buttons">
          <button disabled={!ready} onClick={toggleView}>{topdown?'PERSPECTIVE':'TOP-DOWN'}</button>
          <button disabled={!ready} onClick={toggleAuto}>{auto?'PAUSE CAMERA':'PLAY CAMERA'}</button>
          <button disabled={!ready} onClick={()=>preset('REFERENCE MIST')}>RESET LOOK</button>
        </div>
        <p className="dock-help">Audio starts automatically when permitted, otherwise after a click or keypress. AUDIO: music, thunder and portal levels. RIVER: river bloom; RENDER: flame bloom; DRAGONS: flight, breath and separate breath bloom. B → both breaths · Hover → flame · Click → project · Drag / scroll → camera · L thunder · R ripples · 1–6 projects · P panel · Esc close.</p>
        <p className="dock-applied">{ready?`LIVE · river bloom ${round(settings.riverBloom)} · flame bloom ${round(settings.bloom)} · exposure ${round(settings.exposure)}`:'WAITING FOR RENDERER'}</p>
      </div>}
    </aside>}
  </main>;
}
