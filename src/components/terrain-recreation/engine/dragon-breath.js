import * as THREE from 'three';
import { WATER_LEVEL } from './water.js';

const flowNoise = `
  float flowHash(vec3 point){point=fract(point*.3183099+vec3(.1,.3,.7));point*=17.0;return fract(point.x*point.y*point.z*(point.x+point.y+point.z));}
  float flowNoise(vec3 point){vec3 cell=floor(point),blend=fract(point);blend=blend*blend*(3.0-2.0*blend);
    return mix(mix(mix(flowHash(cell),flowHash(cell+vec3(1,0,0)),blend.x),
      mix(flowHash(cell+vec3(0,1,0)),flowHash(cell+vec3(1,1,0)),blend.x),blend.y),
      mix(mix(flowHash(cell+vec3(0,0,1)),flowHash(cell+vec3(1,0,1)),blend.x),
      mix(flowHash(cell+vec3(0,1,1)),flowHash(cell+vec3(1,1,1)),blend.x),blend.y),blend.z);}
  float flowFbm(vec3 point){return flowNoise(point)*.57+flowNoise(point*2.07)*.29+flowNoise(point*4.11)*.14;}
`;

export function traceBreathTerrain(origin, direction, maximum, heightAt) {
  const point = new THREE.Vector3();
  let previous = 0;
  for (let distance = 0; distance <= maximum; distance += .8) {
    point.copy(direction).multiplyScalar(distance).add(origin);
    const surface = Math.max(WATER_LEVEL, heightAt(point.x, point.z));
    if (point.y <= surface) {
      let lower = previous, upper = distance;
      for (let iteration = 0; iteration < 8; iteration++) {
        const middle = (lower + upper) * .5;
        point.copy(direction).multiplyScalar(middle).add(origin);
        if (point.y > Math.max(WATER_LEVEL, heightAt(point.x, point.z))) lower = middle;
        else upper = middle;
      }
      point.copy(direction).multiplyScalar(upper).add(origin);
      return { point, distance: upper, dry: heightAt(point.x, point.z) >= WATER_LEVEL - .2 };
    }
    previous = distance;
  }
  return null;
}

function streamMaterial(kind, shell, uniforms) {
  return new THREE.ShaderMaterial({
    name: `${kind} turbulent breath ${shell}`, transparent: true, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { ...uniforms, uShell: { value: shell }, uIce: { value: kind === 'ice' ? 1 : 0 } },
    vertexShader: `uniform float uTime,uLength,uWidth,uShell;varying vec2 vUv;varying vec3 vWorld;
      ${flowNoise}
      void main(){vUv=uv;float along=uv.y;float angle=uv.x*6.2831853;
        float radius=(.12+pow(along,.84)*uWidth)*uShell;
        float turbulence=flowFbm(vec3(cos(angle)*2.0,sin(angle)*2.0,along*9.0-uTime*5.4));
        radius*=.44+turbulence*1.1;
        vec3 local=vec3(cos(angle)*radius,sin(angle)*radius,along*uLength);
        local.xy+=vec2(sin(along*13.0-uTime*5.0),cos(along*11.0-uTime*3.8))*along*along*uWidth*.25;
        vWorld=(modelMatrix*vec4(local,1.0)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);}`,
    fragmentShader: `uniform float uTime,uIntensity,uFront,uShell,uIce;varying vec2 vUv;varying vec3 vWorld;
      ${flowNoise}
      void main(){float along=vUv.y;
        vec3 flow=vec3(cos(vUv.x*6.2831853)*2.3,sin(vUv.x*6.2831853)*2.3,along*7.0-uTime*5.5);
        float turbulence=flowFbm(flow+flowNoise(flow*.7)*1.7);
        float filaments=smoothstep(.41,.73,turbulence);
        float ribbon=pow(flowFbm(flow*2.7+vec3(0.0,0.0,-uTime*3.0)),4.0)*4.0;
        float start=smoothstep(0.0,.015,along),tail=1.0-smoothstep(.78,1.0,along);
        float front=1.0-smoothstep(uFront-.09,uFront,along);
        float alpha=start*tail*front*uIntensity*(filaments*.22+ribbon*.12);
        vec3 fire=mix(vec3(1.8,.12,.003),vec3(5.0,2.5,.35),turbulence);
        vec3 ice=mix(vec3(.06,.35,.65),vec3(.85,1.65,2.2),turbulence*.8+ribbon*.2);
        gl_FragColor=vec4(mix(fire,ice,uIce),alpha);}`,
  });
}

function volumeMaterial(kind, uniforms) {
  return new THREE.ShaderMaterial({ name: `${kind} ray-marched breath core`, transparent: true,
    depthWrite: false, side: THREE.FrontSide, toneMapped: false,
    uniforms: { ...uniforms, uIce: { value: kind === 'ice' ? 1 : 0 } },
    vertexShader: `uniform float uLength,uWidth;varying vec3 vLocal;
      void main(){vLocal=vec3(position.xy*uWidth*3.0,(position.z+.5)*uLength);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(vLocal,1.0);}`,
    fragmentShader: `uniform float uTime,uLength,uWidth,uIntensity,uFront,uIce,uMarchSteps;uniform mat4 uWorldToStream;varying vec3 vLocal;
      ${flowNoise}
      void main(){vec3 rayOrigin=(uWorldToStream*vec4(cameraPosition,1.0)).xyz;
        vec3 ray=normalize(vLocal-rayOrigin);
        vec3 inverseRay=1.0/(mix(vec3(-1.0),vec3(1.0),step(vec3(0.0),ray))*max(abs(ray),vec3(.00001)));
        vec3 first=(vec3(-uWidth*1.5,-uWidth*1.5,0.0)-rayOrigin)*inverseRay;
        vec3 last=(vec3(uWidth*1.5,uWidth*1.5,uLength)-rayOrigin)*inverseRay;
        vec3 nearPlane=min(first,last),farPlane=max(first,last);
        float nearDistance=max(0.0,max(max(nearPlane.x,nearPlane.y),nearPlane.z));
        float farDistance=min(min(farPlane.x,farPlane.y),farPlane.z);
        float stepLength=max(0.0,farDistance-nearDistance)/uMarchSteps;
        vec3 integrated=vec3(0.0);float opacity=0.0;
        for(int stepIndex=0;stepIndex<28;stepIndex++){
          if(float(stepIndex)>=uMarchSteps||opacity>.985)break;
          vec3 point=rayOrigin+ray*(nearDistance+(float(stepIndex)+.5)*stepLength);
          float along=clamp(point.z/uLength,0.0,1.0);
          vec3 flow=vec3(point.xy*1.35,point.z*.46-uTime*7.8);
          float turbulence=flowFbm(flow+vec3(flowNoise(flow*.53)*2.1));
          float fine=flowNoise(flow*3.3+vec3(0.0,0.0,-uTime*4.0));
          vec2 curl=vec2(sin(point.z*.8-uTime*4.0),cos(point.z*.67-uTime*3.3))*along*uWidth*.23;
          float radius=(.13+pow(along,.8)*uWidth)*(.72+turbulence*.55);
          float radial=max(0.0,1.0-length(point.xy-curl)/max(.1,radius));
          float density=smoothstep(.29,.81,radial*.68+turbulence*.59+fine*.12);
          density*=smoothstep(.01,.3,radial);
          density*=.7+fine*.6;
          density*=smoothstep(0.0,.015,along)*(1.0-smoothstep(.72,1.0,along));
          density*=1.0-smoothstep(uFront-.12,uFront,along);
          float absorption=1.0-exp(-density*stepLength*.92*uIntensity);
          float heat=clamp(radial*.82+turbulence*.35-along*.25,0.0,1.0);
          vec3 fire=mix(vec3(1.25,.065,.001),vec3(6.0,2.3,.18),pow(heat,1.6));
          fire=mix(fire,vec3(7.5,5.6,2.1),pow(heat,5.0));
          vec3 ice=mix(vec3(.045,.24,.46),vec3(.85,1.65,2.35),heat);
          integrated+=(1.0-opacity)*mix(fire,ice,uIce)*absorption;
          opacity+=(1.0-opacity)*absorption;
        }
        if(opacity<.003)discard;gl_FragColor=vec4(integrated/max(opacity,.001),opacity*.88);}`,
  });
}

function makeStream(kind, uniforms) {
  const positions = [], uvs = [], indices = [];
  const rings = 38, sides = 20;
  for (let ring = 0; ring <= rings; ring++) {
    for (let side = 0; side <= sides; side++) {
      positions.push(0, 0, 0); uvs.push(side / sides, ring / rings);
      if (ring < rings && side < sides) {
        const current = ring * (sides + 1) + side;
        indices.push(current, current + 1, current + sides + 1, current + 1, current + sides + 2, current + sides + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices);
  const group = new THREE.Group(); group.name = `${kind} layered turbulent stream`;
  const materials = [.76, 1.18].map(shell => streamMaterial(kind, shell, uniforms));
  const volumeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const volume = volumeMaterial(kind, uniforms), core = new THREE.Mesh(volumeGeometry, volume);
  core.frustumCulled = false; core.renderOrder = 14; group.add(core);
  for (const material of materials) {
    const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; mesh.renderOrder = 15;
    group.add(mesh);
  }
  return { group, dispose() { geometry.dispose(); volumeGeometry.dispose(); volume.dispose(); materials.forEach(material => material.dispose()); } };
}

function createParticlePool(kind, type, count) {
  const crystal = type === 'crystal', smoke = type === 'mist';
  const source = crystal ? new THREE.OctahedronGeometry(1, 0) : new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = source.index;
  for (const [name, attribute] of Object.entries(source.attributes)) geometry.setAttribute(name, attribute);
  const origins = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const velocities = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const lives = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);
  for (let index = 0; index < count; index++) lives.setXYZW(index, -100, 1, .1, index / count);
  geometry.setAttribute('aOrigin', origins); geometry.setAttribute('aVelocity', velocities); geometry.setAttribute('aLife', lives);
  geometry.instanceCount = count;
  const material = new THREE.ShaderMaterial({ name: `${kind} ${type} instances`, transparent: true,
    depthWrite: false, side: THREE.DoubleSide, blending: smoke || crystal ? THREE.NormalBlending : THREE.AdditiveBlending,
    toneMapped: false, defines: { CRYSTAL: crystal ? 1 : 0, MIST: smoke ? 1 : 0 },
    uniforms: { uTime: { value: 0 }, uIce: { value: kind === 'ice' ? 1 : 0 } },
    vertexShader: `attribute vec3 aOrigin,aVelocity;attribute vec4 aLife;uniform float uTime,uIce;
      varying vec2 vUv;varying float vFade,vSeed,vLight;
      void main(){float age=max(0.0,uTime-aLife.x),progress=age/aLife.y;
        vSeed=aLife.w;vFade=step(0.0,uTime-aLife.x)*(1.0-smoothstep(.48,1.0,progress))*smoothstep(0.0,.06,progress);
        if(vFade<.0001){vUv=vec2(0.0);vLight=0.0;gl_Position=vec4(2.0,2.0,2.0,1.0);return;}
        progress=clamp(progress,0.0,1.0);
        vec3 center=aOrigin+aVelocity*age;
        vec3 axis=normalize(aVelocity+vec3(.0001,0.0,0.0));
        vec3 side=normalize(cross(axis,abs(axis.y)>.9?vec3(0.0,0.0,1.0):vec3(0.0,1.0,0.0)));
        vec3 lift=cross(axis,side);float swirl=age*5.0+aLife.w*62.83;
        center+=(side*cos(swirl)+lift*sin(swirl))*age*mix(.25,.75,uIce);
        center.y+=age*age*mix(.65,-.34,uIce);
        float size=aLife.z;
        #if MIST == 1
          size*=1.0+progress*2.5;center.y+=age*.65;
        #endif
        float angle=age*(1.8+aLife.w*3.0)+aLife.w*62.83;
        mat2 turn=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
        vec4 viewCenter=viewMatrix*vec4(center,1.0);
        #if CRYSTAL == 1
          vec3 rotated=position;rotated.y*=2.5;rotated.xy=turn*rotated.xy;rotated.yz=turn*rotated.yz;
          viewCenter=viewMatrix*vec4(center+rotated*size,1.0);vLight=.45+abs(normal.z)*.7;
        #else
          viewCenter.xy+=turn*position.xy*size;vLight=1.0;
        #endif
        vUv=uv;gl_Position=projectionMatrix*viewCenter;}`,
    fragmentShader: `uniform float uIce,uTime;varying vec2 vUv;varying float vFade,vSeed,vLight;
      ${flowNoise}
      void main(){if(vFade<.002)discard;float alpha=vFade;vec3 tint;
        #if CRYSTAL == 1
          tint=mix(vec3(.24,.57,.72),vec3(1.2,1.45,1.6),pow(clamp(vLight-.35,0.0,1.0),3.0));alpha*=.78;
        #else
          float radius=length(vUv-.5)*2.0;alpha*=exp(-radius*radius*5.5)*(1.0-smoothstep(.66,1.0,radius));
          tint=mix(vec3(3.4,.38,.025),vec3(.15,.95,1.9),uIce);
        #endif
        #if MIST == 1
          float billow=flowFbm(vec3(vUv*5.0+vSeed*13.0,uTime*.35+vSeed*17.0));
          tint=mix(vec3(.085,.075,.067),vec3(.55,.68,.73),uIce)*( .65+billow*.7);alpha*=smoothstep(.18,.65,billow)*mix(.36,.3,uIce);
        #endif
        if(alpha<.002)discard;gl_FragColor=vec4(tint,alpha);}`,
  });
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; mesh.renderOrder = smoke ? 18 : 16;
  mesh.name = `${kind} world-space ${type}`;
  let cursor = 0, dirty = false, lastBirth = -Infinity, seed = kind === 'ice' ? 7051 : 4151;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  return { mesh, emit(time, origin, direction, right, up, speed, spread, impact = null) {
    lastBirth = time;
    const angle = random() * Math.PI * 2, radius = Math.sqrt(random()) * spread;
    const position = impact || origin;
    origins.setXYZ(cursor, position.x, position.y, position.z);
    const travel = smoke ? speed * .14 : speed * (.5 + random() * .5);
    velocities.setXYZ(cursor, direction.x * travel + (right.x * Math.cos(angle) + up.x * Math.sin(angle)) * radius,
      (smoke && impact ? .45 : direction.y * travel) + (right.y * Math.cos(angle) + up.y * Math.sin(angle)) * radius,
      direction.z * travel + (right.z * Math.cos(angle) + up.z * Math.sin(angle)) * radius);
    lives.setXYZW(cursor, time, smoke ? 2.2 + random() : 1.0 + random() * .8,
      smoke ? .85 + random() * 1.1 : crystal ? .07 + random() ** 3 * .38 : .055 + random() * .16, random());
    cursor = (cursor + 1) % count; dirty = true;
  }, update(time) {
    material.uniforms.uTime.value = time;
    mesh.visible = time - lastBirth < 3.3;
    if (dirty) { origins.needsUpdate = velocities.needsUpdate = lives.needsUpdate = true; dirty = false; }
  }, clear() {
    lastBirth = -Infinity; mesh.visible = false;
    for (let index = 0; index < count; index++) lives.setX(index, -100);
    lives.needsUpdate = true;
  }, dispose() { source.dispose(); geometry.dispose(); material.dispose(); } };
}

function createImpactBurst(kind) {
  const geometry=new THREE.SphereGeometry(1,20,12);
  const uniforms={uTime:{value:0},uEnergy:{value:0},uIce:{value:kind==='ice'?1:0}};
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,uniforms,
    vertexShader:`uniform float uTime,uEnergy;varying vec3 vLocal;
      ${flowNoise}
      void main(){vLocal=position;float billow=flowFbm(position*3.5+vec3(0.0,-uTime*2.2,0.0));
        vec3 point=position*(1.0+billow*.55);point.y=max(0.0,point.y)*1.4;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(point,1.0);}`,
    fragmentShader:`uniform float uTime,uEnergy,uIce;varying vec3 vLocal;
      ${flowNoise}
      void main(){float field=flowFbm(vLocal*5.0+vec3(0.0,-uTime*3.0,0.0));
        float breakup=smoothstep(.36,.7,field);float edge=pow(max(0.0,1.0-abs(vLocal.y)),1.4);
        float alpha=breakup*edge*uEnergy*.42;
        vec3 fire=mix(vec3(2.6,.15,.002),vec3(6.0,3.5,.55),field);
        vec3 ice=mix(vec3(.08,.55,1.0),vec3(1.1,2.0,2.8),field);
        gl_FragColor=vec4(mix(fire,ice,uIce),alpha);}`});
  const mesh=new THREE.Mesh(geometry,material);mesh.name=`${kind} turbulent impact bloom`;mesh.visible=false;mesh.frustumCulled=false;mesh.renderOrder=17;
  return {mesh,update(time,hit,energy){mesh.visible=Boolean(hit)&&energy>.01;uniforms.uTime.value=time;uniforms.uEnergy.value=energy;
    if(hit){mesh.position.copy(hit.point);mesh.position.y+=.12;mesh.scale.setScalar(1.4+energy*3.8);}},
    dispose(){geometry.dispose();material.dispose();}};
}

export function createDragonBreath({ kind, scene, heightAt, onBloom, mobile = false }) {
  const group = new THREE.Group(); group.name = `${kind} breath effects`; scene.add(group);
  const uniforms = { uTime: { value: 0 }, uLength: { value: 30 }, uWidth: { value: 2 },
    uIntensity: { value: 0 }, uFront: { value: 0 }, uWorldToStream: { value: new THREE.Matrix4() }, uMarchSteps: { value: mobile ? 14 : 20 } };
  const stream = makeStream(kind, uniforms); group.add(stream.group);
  for (const mesh of stream.group.children) onBloom?.(mesh);
  const sparks = createParticlePool(kind, kind === 'ice' ? 'crystal' : 'ember', mobile ? 110 : 240);
  const mist = createParticlePool(kind, 'mist', mobile ? 50 : 100);
  const impactBurst=createImpactBurst(kind);group.add(impactBurst.mesh);onBloom?.(impactBurst.mesh);
  group.add(sparks.mesh, mist.mesh); onBloom?.(sparks.mesh);
  const light = new THREE.SpotLight(kind === 'ice' ? '#59cfff' : '#ff7018', 0, 55, .25, .9, 1.6);
  light.name = `${kind} breath terrain illumination`; group.add(light, light.target);
  const origin = new THREE.Vector3(), direction = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  const orientation = new THREE.Quaternion(), unitScale = new THREE.Vector3();
  let sparksDue = 0, mistDue = 0, wasVisible = true,particlePhase=0;
  const particleOrigin=new THREE.Vector3(),vertical=new THREE.Vector3(0,1,0);
  return { group, stream: stream.group, light, uniforms, origin, direction, impact: null,
    update(time, delta, socket, strength, settings, target = null) {
      const visible = Boolean(settings.dragonsEnabled);
      if (!visible && wasVisible) { sparks.clear(); mist.clear(); }
      wasVisible = visible; group.visible = visible;
      socket.matrixWorld.decompose(origin, orientation, unitScale);
      direction.set(0, 0, 1).applyQuaternion(orientation).normalize();
      if (target) {
        direction.copy(target).sub(origin).normalize();
        orientation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
      }
      right.set(1, 0, 0).applyQuaternion(orientation); up.set(0, 1, 0).applyQuaternion(orientation);
      const maximum = target ? Math.max(settings.breathLength, Math.min(120, origin.distanceTo(target) + 1.2)) : settings.breathLength;
      const hit = traceBreathTerrain(origin, direction, maximum, heightAt);
      this.impact = strength > .08 ? hit : null;
      const distance = Math.max(.1,hit ? hit.distance : maximum);
      stream.group.position.copy(origin); stream.group.quaternion.copy(orientation);
      stream.group.updateMatrixWorld(true);uniforms.uWorldToStream.value.copy(stream.group.matrixWorld).invert();
      stream.group.visible = visible && strength > .005;
      uniforms.uTime.value = time; uniforms.uLength.value = distance;
      uniforms.uMarchSteps.value=Math.round(THREE.MathUtils.clamp(settings.breathSteps??20,10,28));
      uniforms.uWidth.value = Math.min(kind==='ice'?3.6:4.1, distance * .085);
      uniforms.uIntensity.value = strength * Math.min(2, settings.breathPower * 5);
      uniforms.uFront.value = Math.min(1.12, strength * 1.6);
      light.position.copy(origin); light.target.position.copy(direction).multiplyScalar(distance).add(origin);
      light.distance = distance + 8;
      light.intensity = visible ? uniforms.uIntensity.value * (kind === 'fire' ? 600 : 380) : 0;
      const energy = uniforms.uIntensity.value;
      impactBurst.update(time,visible?this.impact:null,energy);
      if (visible && energy > .07) {
        sparksDue += delta * energy * (mobile ? 85 : 170); mistDue += delta * energy * (mobile ? 16 : 32);
        while (sparksDue >= 1) {
          const fraction=(particlePhase++*.61803398875)%1;
          particleOrigin.copy(direction).multiplyScalar(distance*fraction*.95).add(origin);
          sparks.emit(time, particleOrigin, direction, right, up, Math.min(22, distance*.6)*(1-fraction), .6+fraction*2.8);
          if(hit&&fraction>.65)sparks.emit(time,hit.point,vertical,right,up,5,4.0);
          sparksDue--;
        }
        while (mistDue >= 1) {
          mist.emit(time, origin, direction, right, up, distance * .26, 1.5, hit?.point); mistDue--;
        }
      }
      sparks.update(time); mist.update(time);
    },
    dispose() { scene.remove(group); stream.dispose(); sparks.dispose(); mist.dispose(); impactBurst.dispose(); light.dispose(); },
  };
}

export function createDragonGroundEffect(material) {
  const stamps = Array.from({ length: 20 }, () => new THREE.Vector4(0, -1000, 0, 0));
  const uniforms = { uDragonFrost: { value: stamps }, uFrostCount: { value: 0 }, uDragonFire: { value: new THREE.Vector4(0, -1000, 0, 0) } };
  const original = material.onBeforeCompile, originalKey = material.customProgramCacheKey;
  const cacheKey = originalKey.call(material);
  material.onBeforeCompile = (shader, renderer) => {
    original.call(material, shader, renderer); Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      uniform vec4 uDragonFrost[20];uniform vec4 uDragonFire;uniform int uFrostCount;
      float frostHash(vec2 point){return fract(sin(dot(point,vec2(127.1,311.7)))*43758.5453);}`)
      .replace('#include <lights_physical_fragment>', `
        float frostCoverage=0.0;
        for(int frostIndex=0;frostIndex<20;frostIndex++){
          if(frostIndex>=uFrostCount)break;
          vec4 stamp=uDragonFrost[frostIndex];vec3 offset=vTerrainWorld-stamp.xyz;
          frostCoverage=max(frostCoverage,(1.0-smoothstep(1.0,6.5,length(offset*vec3(1.0,1.35,1.0))))*stamp.w);
        }
        float iceGrain=frostHash(floor(vTerrainWorld.xz*6.0));
        float iceVeins=pow(abs(sin(vTerrainWorld.x*.93+sin(vTerrainWorld.z*1.7)*1.8)*sin(vTerrainWorld.z*1.1)),12.0);
        frostCoverage*=.68+iceGrain*.32;
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.29,.53,.64)+iceVeins*.26,frostCoverage*.88);
        roughnessFactor=mix(roughnessFactor,.38,frostCoverage);metalnessFactor*=1.0-frostCoverage*.7;
        totalEmissiveRadiance+=vec3(.035,.19,.29)*frostCoverage*(.5+iceVeins);
        float fireContact=(1.0-smoothstep(.5,6.0,distance(vTerrainWorld,uDragonFire.xyz)))*uDragonFire.w;
        totalEmissiveRadiance+=vec3(.95,.12,.008)*fireContact*.55;
        #include <lights_physical_fragment>`);
  };
  material.customProgramCacheKey = () => `${cacheKey}|dragon-ground-v1`; material.needsUpdate = true;
  let cursor = 0, stampTimer = 0;
  return { uniforms, update(delta, fire, ice, settings) {
    for (const stamp of stamps) stamp.w = Math.max(0, stamp.w - delta / Math.max(1, settings.frostDuration));
    uniforms.uFrostCount.value=stamps.reduce((last,stamp,index)=>stamp.w>.001?index+1:last,0);
    const fireContact = uniforms.uDragonFire.value;
    fireContact.w = THREE.MathUtils.damp(fireContact.w, 0, 5, delta);
    if (!settings.dragonsEnabled) return;
    if (fire?.effect.impact?.dry) {
      const point = fire.effect.impact.point;
      fireContact.set(point.x, point.y, point.z, fire.strength * settings.breathPower);
    }
    stampTimer -= delta;
    if (ice?.effect.impact?.dry && ice.strength > .2 && stampTimer <= 0) {
      const point = ice.effect.impact.point;
      stamps[cursor].set(point.x, point.y, point.z, Math.min(1, ice.strength * settings.breathPower));
      cursor = (cursor + 1) % stamps.length; stampTimer = .2;
      uniforms.uFrostCount.value=Math.max(uniforms.uFrostCount.value,cursor||stamps.length);
    }
  }, dispose() { material.onBeforeCompile = original; material.customProgramCacheKey = originalKey; material.needsUpdate = true; } };
}
