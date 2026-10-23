import * as THREE from 'three';

export function createStormSky(panorama, noise, hazeColor) {
  const material = new THREE.ShaderMaterial({ name: 'Misty storm sky', side: THREE.BackSide,
    depthWrite: false, depthTest: true, toneMapped: false,
    uniforms: { uPanorama: { value: panorama }, uNoise: { value: noise }, uTime: { value: 0 },
      uStorm: { value: .7 }, uSkyBrightness: { value: 1 }, uHazeColor: { value: hazeColor },
      uSkyMist: { value: .75 }, uSkyThunder: { value: 1 }, uFlash: { value: 0 },
      uFlashDirection: { value: new THREE.Vector3(-.45, .35, -.86).normalize() }, uBloomMode: { value: 0 } },
    vertexShader: `varying vec3 vDir;void main(){vDir=normalize(position);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform sampler2D uPanorama,uNoise;
      uniform float uTime,uStorm,uSkyBrightness,uSkyMist,uSkyThunder,uFlash,uBloomMode;
      uniform vec3 uHazeColor,uFlashDirection;varying vec3 vDir;
      void main(){vec3 direction=normalize(vDir);
        float azimuth=atan(direction.z,direction.x)/6.2831853+.5,elevation=direction.y;
        vec2 panoramaUv=vec2(fract(azimuth*2.0+.78),clamp((elevation+.19)/.32,.015,.985));
        vec4 panorama=texture2D(uPanorama,panoramaUv);
        vec3 haze=uHazeColor*.55,mountains=panorama.rgb*vec3(.25,.4,.52);
        float horizonFade=smoothstep(-.24,-.08,elevation)*(1.0-smoothstep(.055,.16,elevation));
        vec3 sky=mix(haze,mountains,panorama.a*horizonFade*.78);
        vec2 cloudUv=vec2(azimuth*3.0,elevation*1.6)+vec2(uTime*.0012,-uTime*.00035);
        vec2 warp=vec2(texture2D(uNoise,cloudUv*.73).r,texture2D(uNoise,cloudUv*.91+.31).r)-.5;
        float clouds=texture2D(uNoise,cloudUv+warp*.35).r*.57
          +texture2D(uNoise,cloudUv*2.13+vec2(-uTime*.001,.2)).r*.28
          +texture2D(uNoise,cloudUv*4.37).r*.15;
        float mistBand=exp(-pow((elevation-.035)*4.1,2.0));
        float mist=clamp(uSkyMist*mistBand*(.22+clouds*.48),0.0,.9);
        sky=mix(sky,uHazeColor*(.51+clouds*.24),mist);
        sky+=clouds*vec3(.018,.032,.052)*(.6+uStorm*.4);
        sky=mix(sky,uHazeColor*.55,smoothstep(.09,.65,-elevation)*.3);
        vec3 strikeDirection=normalize(vec3(uFlashDirection.x,max(.08,uFlashDirection.y),uFlashDirection.z));
        float sheet=pow(max(0.0,dot(direction,strikeDirection)),10.0);
        float cloudBody=smoothstep(.34,.76,clouds);
        float skyBand=smoothstep(-.2,-.03,elevation)*(1.0-smoothstep(.48,.85,elevation));
        vec3 thunder=vec3(.10,.27,.55)*uFlash*uSkyThunder*skyBand
          *(.12+cloudBody*.88)*(.08+sheet*1.55)*(1.0+uSkyMist*.25);
        gl_FragColor=vec4(uBloomMode>1.5?thunder:sky*uSkyBrightness+thunder,1.0);}`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), material);
  mesh.name = 'Misty sky and synchronized sheet lightning'; mesh.renderOrder = -40;
  return { mesh, update(time, flash, direction, settings) {
    const uniforms = material.uniforms;
    uniforms.uTime.value = time; uniforms.uStorm.value = settings.storm;
    uniforms.uSkyBrightness.value = settings.skyBrightness; uniforms.uSkyMist.value = settings.skyMist;
    uniforms.uSkyThunder.value = settings.skyThunderGlow; uniforms.uFlash.value = flash;
    uniforms.uFlashDirection.value.copy(direction);
  }, dispose() { mesh.geometry.dispose(); material.dispose(); } };
}

