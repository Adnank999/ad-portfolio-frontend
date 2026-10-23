export const valueParticleVertex = `
  uniform float uTime;
  uniform float uScrollBurst;
  uniform float uBurst;
  uniform float uDpr;
  uniform vec2 uPointer;
  attribute float seed;
  attribute float colorMix;
  attribute float kind;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vKind;
  varying float vHot;
  void main() {
    vec3 point = position;
    float angle = uTime * 0.035;
    point.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * point.xz;
    if (kind > 0.5 && kind < 1.5) {
      point.y += sin(uTime * 0.23 + seed * 41.0) * 0.13;
      point.x += cos(uTime * 0.18 + seed * 31.0) * 0.09;
    } else {
      float delay = seed * 0.12;
      float travel = clamp((uScrollBurst - delay) / (1.0 - delay), 0.0, 1.0);
      float radius = mix(0.07 + seed * 0.10, 0.60 + seed * 1.35, travel);
      point = normalize(point) * radius;
      point += sin(point.yzx * 5.0 + uTime * 0.45) * 0.018;
      point += normalize(position) * uBurst * (0.28 + seed * 0.45);
    }
    point.xy += uPointer * 0.1 * (1.0 - seed);
    vec4 viewPoint = modelViewMatrix * vec4(point, 1.0);
    gl_Position = projectionMatrix * viewPoint;
    float modelScale = length(modelMatrix[0].xyz);
    vHot = smoothstep(0.88, 1.0, seed);
    float diameter = mix(4.5, 10.0, seed * seed) + vHot * vHot * 24.0;
    if (kind > 0.5 && kind < 1.5) diameter = mix(3.0, 9.0, seed * seed);
    if (kind > 1.5) diameter = mix(150.0, 230.0, seed);
    gl_PointSize = clamp(diameter * modelScale * 5.6 / max(1.0, -viewPoint.z), 1.5, 210.0) * uDpr;
    float twinkle = 0.72 + 0.28 * sin(uTime * mix(0.55, 1.15, seed) + seed * 93.0);
    vAlpha = twinkle * mix(0.75, 1.0, seed);
    if (kind < 0.5 || kind > 1.5) vAlpha *= mix(0.4, 1.0, uScrollBurst);
    if (kind > 0.5 && kind < 1.5) vAlpha *= 0.58;
    vec3 rainbow = clamp(abs(fract(colorMix + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    vColor = mix(vec3(1.0), rainbow, 0.92);
    vKind = kind;
  }
`

export const valueParticleFragment = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vKind;
  varying float vHot;
  void main() {
    vec2 centered = (gl_PointCoord - 0.5) * 2.0;
    float radiusSquared = dot(centered, centered);
    if (radiusSquared > 1.0) discard;
    float edge = 1.0 - smoothstep(0.55, 1.0, radiusSquared);
    if (vKind > 1.5) {
      gl_FragColor = vec4(vColor, exp(-radiusSquared * 4.5) * edge * vAlpha * 0.12);
      return;
    }
    float core = exp(-radiusSquared * 44.0);
    float innerGlow = exp(-radiusSquared * 16.0) * 0.36;
    float halo = exp(-radiusSquared * 4.0) * mix(0.12, 0.28, vHot);
    vec3 color = vColor * (1.05 + core * 0.30) + vec3(core * vHot * 0.12);
    gl_FragColor = vec4(color, min(1.0, (core * 1.7 + innerGlow + halo) * edge * vAlpha));
  }
`
