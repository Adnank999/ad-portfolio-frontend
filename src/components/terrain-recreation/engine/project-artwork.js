import * as THREE from 'three';

export const PROJECT_ARTWORK_DEFAULTS = Object.freeze({ hoverIn: 1, hoverOut: 1.5, imageZoom: .06, radiusGrowth: .07,
  distortion: .12, maskRadius: .5, maskSoftness: .28, noiseAmount: .35, noiseSpeed: .05, revealDuration: 1.4 });

export function createProjectMasks(erosion, reveal) {
  const make = (pixels, name) => {
    const data = new Uint8Array(pixels.data.buffer, pixels.data.byteOffset, pixels.data.byteLength);
    const texture = new THREE.DataTexture(data, pixels.w, pixels.h);
    texture.name = name; texture.colorSpace = THREE.NoColorSpace; texture.flipY = true;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true; texture.needsUpdate = true;
    return texture;
  };
  return { erosion: make(erosion, 'Project edge erosion: 02.jpg'), reveal: make(reveal, 'Project silhouette: fbm-mask.webp') };
}

export function createArtworkHover(reducedMotion = false) {
  const values = { x: 0, y: 0, z: 0 };
  const tracks = Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, { start: 0, target: 0, progress: 1 }]));
  return {
    set(axis, active) {
      if (!(axis in tracks)) return;
      const target = active && !reducedMotion ? 1 : 0, track = tracks[axis];
      if (track.target === target) return;
      track.start = values[axis]; track.target = target; track.progress = 0;
    },
    update(delta) {
      const seconds = Math.min(.1, Math.max(0, Number(delta) || 0));
      for (const axis of ['x', 'y', 'z']) {
        const track = tracks[axis], duration = track.target ? PROJECT_ARTWORK_DEFAULTS.hoverIn : PROJECT_ARTWORK_DEFAULTS.hoverOut;
        track.progress = Math.min(1, track.progress + seconds / duration);
        const eased = 1 - (1 - track.progress) ** 3;
        values[axis] = track.start + (track.target - track.start) * eased;
      }
      return values;
    },
    reset() {
      for (const axis of ['x', 'y', 'z']) { values[axis] = 0; Object.assign(tracks[axis], { start: 0, target: 0, progress: 1 }); }
    },
  };
}

export const PROJECT_ARTWORK_GLSL = `
  vec3 projectMod289(vec3 value){return value-floor(value/289.)*289.;}
  vec4 projectPermute(vec4 value){return mod((value*34.+1.)*value,289.);}
  float projectSimplex(vec3 point){
    vec3 cell=floor(point+dot(point,vec3(1./3.)));
    vec3 offset0=point-cell+dot(cell,vec3(1./6.));
    vec3 order=step(offset0.yzx,offset0.xyz),inverseOrder=1.-order;
    vec3 corner1=min(order,inverseOrder.zxy),corner2=max(order,inverseOrder.zxy);
    vec3 offset1=offset0-corner1+1./6.,offset2=offset0-corner2+1./3.,offset3=offset0-.5;
    cell=projectMod289(cell);
    vec4 permutation=projectPermute(projectPermute(projectPermute(cell.z+vec4(0.,corner1.z,corner2.z,1.))
      +cell.y+vec4(0.,corner1.y,corner2.y,1.))+cell.x+vec4(0.,corner1.x,corner2.x,1.));
    vec4 index=permutation-49.*floor(permutation/49.);
    vec4 gridX=floor(index/7.),gridY=floor(index-7.*gridX);
    vec4 gradientX=gridX*(2./7.)+(.5/7.-1.),gradientY=gridY*(2./7.)+(.5/7.-1.);
    vec4 gradientZ=1.-abs(gradientX)-abs(gradientY);
    vec4 basis0=vec4(gradientX.xy,gradientY.xy),basis1=vec4(gradientX.zw,gradientY.zw);
    vec4 sign0=floor(basis0)*2.+1.,sign1=floor(basis1)*2.+1.,fold=-step(gradientZ,vec4(0.));
    vec4 folded0=basis0.xzyw+sign0.xzyw*fold.xxyy,folded1=basis1.xzyw+sign1.xzyw*fold.zzww;
    vec3 gradient0=vec3(folded0.xy,gradientZ.x),gradient1=vec3(folded0.zw,gradientZ.y);
    vec3 gradient2=vec3(folded1.xy,gradientZ.z),gradient3=vec3(folded1.zw,gradientZ.w);
    vec4 normalization=1.792842914-.853734721*vec4(dot(gradient0,gradient0),dot(gradient1,gradient1),dot(gradient2,gradient2),dot(gradient3,gradient3));
    gradient0*=normalization.x;gradient1*=normalization.y;gradient2*=normalization.z;gradient3*=normalization.w;
    vec4 support=max(.6-vec4(dot(offset0,offset0),dot(offset1,offset1),dot(offset2,offset2),dot(offset3,offset3)),0.);
    support*=support;
    return 42.*dot(support*support,vec4(dot(gradient0,offset0),dot(gradient1,offset1),dot(gradient2,offset2),dot(gradient3,offset3)));
  }
  vec2 artworkDisplacement(vec2 local,vec2 size,float hover){
    vec2 mapped=mix(local,vUv,.25);
    vec2 distortionUv=(mapped-.5)*size*uViewportSize/1200.+.5;
    return (texture2D(uDistortion,distortionUv).rg-.5)*.12*(1.+hover*.5);
  }
  vec2 artworkUv(vec2 local,vec2 size,float aspect,float hover,vec2 displacement){
    vec2 point=(local-.5)/(1.+hover*.06)+.5;
    float edge=smoothstep(.35,1.,abs(local.x-.5)*2.);
    point+=displacement*.6*edge;
    return coverUv(point,size,aspect);
  }
  float artworkReveal(vec2 local,float progress,vec2 displacement){
    vec2 point=(local-.5)*.86+.5+displacement*.4;
    float silhouette=texture2D(uRevealMask,point).r;
    float erosion=texture2D(uErosionMask,point).r;
    float field=silhouette*.82+erosion*.18;
    float threshold=1.2-progress*1.4;
    return smoothstep(threshold-.12,threshold+.12,field);
  }
  vec3 artworkMask(vec2 local,vec2 size,float progress,float hover,float shape,float time,vec2 displacement){
    vec2 point=(local-.5)*.86/(1.+hover*.07)+.5;
    float drift=projectSimplex(vec3(local*3.,time*.05+hover*.05));
    point+=displacement*(.45+hover*.25);
    float density=texture2D(uRevealMask,point).r;
    float erosion=texture2D(uErosionMask,point).r-.5;
    float transitionBand=4.*density*(1.-density);
    density+=(erosion*.42+drift*.035)*transitionBand;
    float mask=smoothstep(.015,.985,density);
    vec2 boundary=min(local,1.-local);
    float frame=smoothstep(0.,.14,boundary.x)*smoothstep(0.,.18,boundary.y);
    vec2 radial=local-.5;radial.x*=size.x*uViewportSize.x/max(size.y*uViewportSize.y,1.);
    float circle=1.-smoothstep(.32,.61+hover*.035,length(radial));
    mask*=frame*mix(1.,circle,shape);
    float reveal=artworkReveal(local,progress,displacement);
    float rim=4.*mask*(1.-mask);
    float light=1.+hover*.025;
    return vec3(mask*reveal,light,rim);
  }
  float artworkAlpha(vec3 image,float mask){
    float luminance=dot(image,vec3(.2126,.7152,.0722));
    float core=smoothstep(.55,.95,mask);
    float shadowVisibility=mix(.18,1.,smoothstep(.015,.22,luminance));
    return mask*mix(shadowVisibility,1.,core);
  }
  vec3 artworkOver(vec3 background,vec3 color,vec3 mask,float weight){
    vec3 image=color*mask.y*2.;
    float alpha=artworkAlpha(image,mask.x)*weight;
    return mix(background,image,alpha);
  }
`;
