import * as THREE from 'three';

export function configureProjectOutput(outputPass) {
  const uniforms = {
    uProjectAmount: { value: 0 }, uProjectExposure: { value: .3 },
    uProjectDebug: { value: 0 },
  };
  Object.assign(outputPass.uniforms, uniforms);
  outputPass.material.fragmentShader = outputPass.material.fragmentShader
    .replace('void main() {', `
      uniform float uProjectAmount,uProjectExposure,uProjectDebug;
      vec3 projectGrade(vec3 color){
        vec2 centered=vUv-.5;
        float fade=1.-smoothstep(.107592+.01/.316456,.849367+.01/.316456,length(centered));
        color*=fade;
        color=.5+1.35*(color-.5);
        vec3 axis=normalize(vec3(1.));float angle=-.397670;
        color=color*cos(angle)+cross(axis,color)*sin(angle)+axis*dot(axis,color)*(1.-cos(angle));
        return max(color*uProjectExposure,vec3(0.))+vec3(.006,.0065,.012);
      }
      void main() {`)
    .replace('gl_FragColor = texture2D( tDiffuse, vUv );', 'gl_FragColor = texture2D( tDiffuse, vUv );vec3 projectColor=gl_FragColor.rgb;')
    .replace('// color space', `
      if(uProjectAmount>0.){
        vec3 graded=uProjectDebug>.5?projectColor:projectGrade(projectColor);
        gl_FragColor.rgb=mix(gl_FragColor.rgb,graded,uProjectAmount);
      }
      // color space`);
  outputPass.material.needsUpdate = true;
  return {
    update(state, settings, debug = false) {
      uniforms.uProjectAmount.value = state.amount;
      uniforms.uProjectExposure.value = THREE.MathUtils.clamp(Number(settings.projectExposure) || 0, 0, 1);
      uniforms.uProjectDebug.value = debug ? 1 : 0;
    },
    uniforms,
  };
}

