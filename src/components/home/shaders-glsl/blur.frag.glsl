precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uInput;
uniform vec2 uAxis;
void main(){
  vec3 sum=texture(uInput,vUv).rgb*0.199471;
  sum+=(texture(uInput,vUv+uAxis*1.0).rgb+texture(uInput,vUv-uAxis*1.0).rgb)*0.176033;
  sum+=(texture(uInput,vUv+uAxis*2.0).rgb+texture(uInput,vUv-uAxis*2.0).rgb)*0.120985;
  sum+=(texture(uInput,vUv+uAxis*3.0).rgb+texture(uInput,vUv-uAxis*3.0).rgb)*0.064759;
  sum+=(texture(uInput,vUv+uAxis*4.0).rgb+texture(uInput,vUv-uAxis*4.0).rgb)*0.027017;
  sum+=(texture(uInput,vUv+uAxis*5.0).rgb+texture(uInput,vUv-uAxis*5.0).rgb)*0.008764;
  fragColor=vec4(sum,1.0);
}
