precision highp float;
uniform float uReveal;
uniform float uReverse;
uniform float uAspect;
uniform vec3 uInk;
uniform vec3 uPaper;
varying vec2 vUv;

float hash(vec2 point) {
  return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  vec2 blend = local * local * (3.0 - 2.0 * local);
  return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), blend.x),
    mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), blend.x), blend.y);
}
float fbm(vec2 point) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
  for (int octave = 0; octave < 5; octave++) {
    value += amplitude * noise(point);
    point = turn * point * 2.03 + 17.1;
    amplitude *= 0.5;
  }
  return value;
}
float dissolve(float progress, vec2 point, float seed) {
  if (progress <= 0.001) return 0.0;
  if (progress >= 0.999) return 1.0;
  vec2 domain = point * vec2(uAspect, 1.0) * 7.0;
  vec2 warp = vec2(fbm(domain + seed), fbm(domain + vec2(7.2, 3.1) + seed));
  float organic = fbm(domain + warp * 3.8);
  float detail = noise(domain * 7.0 + warp * 2.0);
  float field = point.y + (organic - 0.5) * 0.38 + (detail - 0.5) * 0.055;
  float threshold = mix(-0.35, 1.35, progress);
  float edge = smoothstep(threshold - 0.006, threshold + 0.006, field);
  vec2 grid = point * vec2(uAspect, 1.0) * 210.0;
  vec2 cells = floor(grid);
  float speck = hash(cells + seed);
  float dispersion = smoothstep(0.12, 0.0, abs(field - threshold));
  float droplet = 1.0 - smoothstep(0.13, 0.4, length(fract(grid) - 0.5));
  float droplets = step(0.986, speck) * dispersion * droplet;
  float mask = max(1.0 - edge, droplets);
  return mask;
}
void main() {
  float reveal = dissolve(uReveal, vUv, 0.0);
  float reverse = dissolve(uReverse, vUv, 23.4);
  vec3 color = mix(uInk, uPaper, reveal);
  color = mix(color, uInk, reverse);
  gl_FragColor = vec4(color, 1.0);
}
