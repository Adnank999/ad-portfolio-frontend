export const logoSurfaceVaryings = `
  varying vec3 vLogoPosition;
  varying vec3 vLogoNormal;
`

export const logoSurfaceVertex = `
  #include <begin_vertex>
  vLogoPosition = position;
  vLogoNormal = normal;
`

export const logoSurfaceUniforms = `
  uniform float uLogoTime;
  uniform float uLogoPhase;
`

export const logoSurfaceMap = `
  #ifdef USE_MAP
    vec3 weights = pow(abs(normalize(vLogoNormal)), vec3(6.0));
    weights /= max(weights.x + weights.y + weights.z, 0.0001);
    vec2 drift = vec2(uLogoTime * 0.006 + uLogoPhase * 0.17, uLogoTime * 0.004);
    vec3 coordinates = vLogoPosition * 0.31 + 0.5;
    vec3 textureColor = texture2D(map, coordinates.yz + drift).rgb * weights.x;
    textureColor += texture2D(map, coordinates.xz + drift).rgb * weights.y;
    textureColor += texture2D(map, coordinates.xy + drift).rgb * weights.z;
    diffuseColor.rgb *= mix(vec3(1.0), textureColor, 0.2);
  #endif
`
