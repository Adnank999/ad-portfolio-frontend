precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uInput;
uniform int uChannel;
uniform float uGain;
uniform float uHeroProgress;
uniform float uHeroHeight;
void main(){
  vec4 pixel=texture(uInput,vUv);
  float channel=pixel.r;
  if(uChannel==1)channel=pixel.g;
  if(uChannel==2)channel=pixel.b;
  if(uChannel==3)channel=pixel.a;
  if(uChannel==4){fragColor=vec4(pixel.rgb*uGain,1.0);}
  else {fragColor=vec4(vec3(channel*uGain),1.0);}
  float heroBottom=uHeroHeight+1.0-uHeroProgress*(uHeroHeight+1.0);
  fragColor.a*=smoothstep(0.0,.14,heroBottom-(1.0-vUv.y));
}
