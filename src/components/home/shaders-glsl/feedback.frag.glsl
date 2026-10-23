precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPrev;
uniform sampler2D uMarble;
uniform sampler2D uNoise;
uniform sampler2D uPerlin;
uniform vec2 uMouse;
uniform vec2 uLastMouse;
uniform float uTime;
uniform float uDelta;
uniform float uHover;
uniform float uVelocity;
uniform float uRadius;
uniform float uStrength;
uniform float uDecay;
uniform float uIntensity;
uniform float uOffsetScale;
uniform float uDecayRate;
uniform float uMixFactor;
uniform float uClampMax;

float segmentDistance(vec2 pt, vec2 a, vec2 b){
  vec2 d=b-a;
  float t=clamp(dot(pt-a,d)/max(dot(d,d),1.e-7),0.0,1.0);
  return length(pt-(a+t*d));
}
void main(){
  vec2 uv=vUv;
  vec2 direction=uv-uMouse;
  float dist=length(direction*vec2(1.0,1.06));
  float edgeNoise=texture(uNoise,uv*1.7+vec2(uTime*0.014,-uTime*0.009)).r;
  float drift=texture(uPerlin,uv*1.05+vec2(uTime*0.003,uTime*0.002)).r;
  vec2 stretched=uv+normalize(direction+vec2(1.e-5)) * (drift-0.5)*0.006;
  float marble=texture(uMarble,clamp(stretched,0.0,1.0)).r;
  float base=pow(max(marble,0.0),1.45)*0.27;

  // An approximation of Saffron's offscreen radial feedback (20 taps).
  // The captured on-screen GLSL is exact, but this offscreen pass is reconstructed.
  float blur=0.0;
  float decay=1.0;
  for(int i=0;i<20;i++){
    float progress=(float(i)+1.0)/20.0;
    vec2 displaced=uv + normalize(direction+vec2(1.e-5))*progress*(uOffsetScale*0.05);
    blur+=texture(uMarble,clamp(displaced,0.0,1.0)).r*decay;
    decay*=uDecayRate;
  }
  blur*=uMixFactor/20.0;
  float footprint=1.0-smoothstep(uRadius*0.15,uRadius*(0.78+edgeNoise*0.40),dist);
  float scratch=clamp((edgeNoise-0.27)*1.65,0.0,1.0);
  float dragLine=1.0-smoothstep(uRadius*0.16,uRadius*0.84,segmentDistance(uv,uMouse,uLastMouse));
  float hovered=max(footprint,dragLine*0.52)*uHover * scratch;
  // Restrict user illumination to the marble texture instead of filling a circle.
  float reveal=hovered*max(marble,blur)*uStrength*uIntensity*(0.64+uVelocity*0.36);
  float previous=texture(uPrev,uv).r*pow(uDecay, max(uDelta,0.0001)*60.0);
  float value=min(max(base+reveal,previous),uClampMax);
  fragColor=vec4(vec3(value),1.0);
}
