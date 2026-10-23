import * as THREE from 'three';

export function createVolcanoAtmosphere(scene, heightAt, reducedMotion = false) {
  const count=48,positions=new Float32Array(count*3),seeds=new Float32Array(count);
  for(let index=0;index<count;index++)seeds[index]=(index*.61803398875)%1;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:true,
    uniforms:{uTime:{value:0},uHeat:{value:0},uBase:{value:heightAt(0,-10)+1}},
    vertexShader:`attribute float aSeed;uniform float uTime,uHeat,uBase;varying float vAge,vSeed;
      void main(){vSeed=aSeed;float age=fract(aSeed+uTime*.035);vAge=age;
        float spread=1.2+age*6.0;
        vec3 center=vec3(sin(aSeed*132.0+age*6.0)*spread+age*13.0,uBase+age*48.0,-10.0+cos(aSeed*91.0+age*4.0)*spread);
        vec4 view=modelViewMatrix*vec4(center,1.0);
        gl_PointSize=clamp((7.0+age*21.0)*(1.0+uHeat*.12)*580.0/max(1.0,-view.z),2.0,180.0);
        gl_Position=projectionMatrix*view;}`,
    fragmentShader:`uniform float uHeat;varying float vAge,vSeed;
      void main(){vec2 point=gl_PointCoord*2.0-1.0;float radius=length(point);
        float billow=.84+sin(point.x*13.0+vSeed*71.0)*sin(point.y*11.0+vSeed*39.0)*.16;
        float alpha=exp(-radius*radius*3.2)*(1.0-smoothstep(.65,1.0,radius))*billow;
        alpha*=smoothstep(0.0,.06,vAge)*(1.0-smoothstep(.55,1.0,vAge))*.15;
        vec3 color=mix(vec3(.09,.11,.13),vec3(.27,.31,.34),vAge);
        color+=vec3(.18,.035,.002)*uHeat*pow(1.0-vAge,6.0);
        gl_FragColor=vec4(color,alpha);}`});
  const plume=new THREE.Points(geometry,material);plume.name='Volcano / drifting crater smoke';plume.frustumCulled=false;plume.renderOrder=8;scene.add(plume);
  const light=new THREE.PointLight('#ff5c0a',0,125,2);light.position.set(0,heightAt(12,-10)+4,-10);scene.add(light);
  return {update(time,heat){material.uniforms.uTime.value=reducedMotion?0:time;material.uniforms.uHeat.value=heat;light.intensity=120+heat*1900;light.color.setRGB(1,.23-heat*.20,.006);},
    dispose(){scene.remove(plume,light);geometry.dispose();material.dispose();light.dispose();}};
}
