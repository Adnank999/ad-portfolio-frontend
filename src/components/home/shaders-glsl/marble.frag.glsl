precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;

vec4 linearToOutputTexel(vec4 value) {
    vec3 a = value.rgb;
    vec3 outRGB = mix(pow(max(a, vec3(0.0)), vec3(0.41666)) * 1.055 - vec3(0.055),
                      a * 12.92,
                      vec3(lessThanEqual(a, vec3(0.0031308))));
    return vec4(outRGB, value.a);
}

uniform float uScrollProgress;
  uniform float uHeroProgress;
  uniform float uHeroHeight;
  uniform float uAlpha;
  uniform float uExpand;
  uniform float uDim;
  uniform float vUvScale;
  uniform float uBoostFactor;
  uniform float uBoostReveal;
  uniform float uSaturation;
  uniform vec2 uMouse;
  uniform vec2 uPlane;
  uniform vec3 uTime; // [reveal, boost, elapsed]
  uniform vec3 uResolution;
  uniform vec3 uMouseProps; // [radius, strength, boostFactor]
  uniform sampler2D uTxt;
  uniform sampler2D uTxtLoop;
  uniform sampler2D uGradientTxt;
  uniform sampler2D uTxtMask;
  uniform sampler2D uMaskSelection;
  uniform sampler2D uMaskTime;
  uniform sampler2D uNoiseTxt;

  
#ifndef EPSILON
  #define EPSILON 1e-10
#endif

vec3 RGBToHCV(const in vec3 RGB) {
	vec4 P = mix(vec4(RGB.bg, -1.0, 2.0 / 3.0), vec4(RGB.gb, 0.0, -1.0 / 3.0), step(RGB.b, RGB.g));
	vec4 Q = mix(vec4(P.xyw, RGB.r), vec4(RGB.r, P.yzx), step(P.x, RGB.r));
	float C = Q.x - min(Q.w, Q.y);
	float H = abs((Q.w - Q.y) / (6.0 * C + EPSILON) + Q.z);
	return vec3(H, C, Q.x);
}

vec3 RGBToHSL(const in vec3 RGB) {
	vec3 HCV = RGBToHCV(RGB);
	float L = HCV.z - HCV.y * 0.5;
	float S = HCV.y / (1.0 - abs(L * 2.0 - 1.0) + EPSILON);
	return vec3(HCV.x, S, L);
}

vec3 HueToRGB(const in float H) {
	float R = abs(H * 6.0 - 3.0) - 1.0;
	float G = 2.0 - abs(H * 6.0 - 2.0);
	float B = 2.0 - abs(H * 6.0 - 4.0);
	return clamp(vec3(R, G, B), 0.0, 1.0);
}

vec3 HSLToRGB(const in vec3 HSL) {
	vec3 RGB = HueToRGB(HSL.x);
	float C = (1.0 - abs(2.0 * HSL.z - 1.0)) * HSL.y;
	return (RGB - 0.5) * C + HSL.z;
}
  vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 a=RGBToHSL(dst.rgb);vec3 b=RGBToHSL(src.rgb);vec3 c=HSLToRGB(vec3(b.xy,a.z));return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}
  vec2 coverUv(vec2 uv, vec2 size, vec2 resolution) {
    vec2 ratio = vec2(
        min((resolution.x / resolution.y) / (size.x / size.y), 1.0),
        min((resolution.y / resolution.x) / (size.y / size.x), 1.0)
    );

    return vec2(
        uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
}
  vec2 scaleFromPoint(vec2 uv, float scale, vec2 point) {
    vec2 scaledUV = (uv - point) * scale + point;
    return scaledUV;
}
  vec3 saturation(vec3 rgb, float adjustment) {
  const vec3 W = vec3(0.2125, 0.7154, 0.0721);
  vec3 intensity = vec3(dot(rgb, W));
  return mix(intensity, rgb, adjustment);
}
  float blendScreen(float base, float blend) {
  return 1.0-((1.0-base)*(1.0-blend));
}

vec3 blendScreen(vec3 base, vec3 blend) {
  return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
}

vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
  return (blendScreen(base, blend) * opacity + base * (1.0 - opacity));
}

  float vignette(vec2 _uv, float _threshold){
    float h = min(smoothstep(0.0, _threshold, _uv.x), smoothstep(1.0, 1.0 - _threshold, _uv.x));
    float v = min(smoothstep(0.0, _threshold, _uv.y), smoothstep(1.0, 1.0 - _threshold, _uv.y));
    return pow(min(h,v), 2.0);
  }

  float fadeEdge(float _prog){
    float enter = smoothstep(0.0, 0.1, _prog);
    float exit = smoothstep(1.0, 0.9, _prog);
    return min(enter, exit);
  }

  void main(){
    vec2 nUv = scaleFromPoint(vUv, vUvScale, vec2(0.5));
    vec2 st = gl_FragCoord.xy / (uResolution.xy * uResolution.z);

    nUv = coverUv(nUv, vec2(textureSize(uTxt, 0).xy), uPlane);

    float noise1 = texture(uNoiseTxt, (nUv * 1.4) + vec2(uTime.z * 0.2 * 0.1, 0.0)).r;
    float noise2 = texture(uNoiseTxt, (nUv * 2.4) + vec2(-uTime.z * 0.2 * 0.1, 0.0 )).r;
    float noise = (noise1 + noise2) * 0.5;

    // GRADIENT
    vec3 gradientColor = texture(uGradientTxt, nUv + vec2(-uTime.z* 0.1, -uTime.z* 0.1)).rgb;

    //LOOP
    vec4 loopTexture = texture(uTxtLoop, nUv);
    loopTexture = blend(loopTexture, vec4(gradientColor, 1.0), 1.0);
    loopTexture *= noise;

    // MOUSE
    vec2 fragUv = st;
    vec2 mouseUv = uMouse * 0.5 + 0.5;
    vec2 d = (fragUv - mouseUv);
    d.x *= uResolution.x / uResolution.y;
    // d += vec2(noise * 0.1);
    float mouseDist = length(d) - pow(noise, 3.0) * 0.2;
    float mouseRadius = uMouseProps.x;
    float mouseHardness = 0.00;
    float dd = smoothstep(mouseRadius * mouseHardness, mouseRadius, mouseDist);
    dd = pow(dd, 0.85);
    float mouseCircle = (1.0 - dd) * 2.0 - 1.0;
    mouseCircle = smoothstep(0.0, 1.0, noise + mouseCircle);
    mouseCircle = pow(mouseCircle, 4.0);

    // MARBLE
    vec4 final = texture(uTxt, nUv);
    final = blend(final, vec4(gradientColor, 1.0), 1.0);
    vec4 colorTxt = final;

    float cut = pow(final.r, 0.5);

    float mask = texture(uTxtMask, nUv).r;
    float selection = texture(uMaskSelection, nUv).g;
    float timeShift = texture(uMaskTime, nUv).b;

    float shiftedTimeIntro = uTime.x * 0.3;
    shiftedTimeIntro = clamp(shiftedTimeIntro - timeShift * 1.0 - 0.05, 0.0, 100000.0);

    float mtReveal = mod(shiftedTimeIntro, 1.0);
    float mtBoost = mod(uTime.y * 0.3 + timeShift * 5.0, 1.0);

    // MAIN REVEAL
    float fadeBoost = fadeEdge(mtBoost);
    float fadeReveal = fadeEdge(mtReveal);
    float edge = 0.04;

    float phase = step(0.5, mtReveal); // 0: reveal, 1: hide
    float t = fract(mtReveal * 2.0);   // 0..1 within each phase

    float th = t - edge;
    float reveal = 1.0 - smoothstep(th, th + edge, mask); // 0->1 (L->R)
    float hide = smoothstep(th, th + edge, mask);         // 1->0 (L->R)

    float maskReveal = mix(reveal, hide, phase) * smoothstep(0.0, 0.1, mask);
    float revealEdge = 1.0 - smoothstep(0.0 + mtReveal, 0.03 + mtReveal, mask);
    maskReveal += sin(revealEdge * 3.14) * uBoostReveal * cut * fadeReveal;

    // COLOR BOOST
    float maskBoost = 1.0 - smoothstep(0.0 + mtBoost, 0.03 + mtBoost, mask);
    maskBoost *= selection;
    maskBoost = clamp(maskBoost, 0.0, 1.0);

    float boost = sin(maskBoost * 3.14) * uBoostFactor * cut * fadeBoost;
    final.rgb *= (1.0 + boost);
    final.rgb *= maskReveal;

    // final.rgb = mix(final.rgb, colorTxt.rgb * (1.0 + uMouseProps.z * cut), mouseCircle * uMouseProps.y * clamp(shiftedTimeIntro, 0.0, 1.0));
    final.rgb *= vignette(vUv, 0.1 * (1.0 - uScrollProgress));

    final.rgb = blendScreen(saturation(loopTexture.rgb, uSaturation), final.rgb, 1.0);
    // The blackout is what turns the landed marble into the carousel's box. Grown
    // back out to the section it is a background again, so the texture returns.
    final.rgb = mix(final.rgb, vec3(0.0), uScrollProgress * (1.0 - uExpand));

    final.rgb *= uDim;

    final.a *= uAlpha;

    fragColor = final;

    // DEBUG
    // fragColor = texture(uTxtLoop, nUv);;
    // fragColor = vec4(vec3(1.0, 0.0, 1.0), 1.0);

#if defined( TONE_MAPPING )
	fragColor.rgb = toneMapping( fragColor.rgb );
#endif
fragColor = linearToOutputTexel( fragColor );
float heroBottom = uHeroHeight + 1.0 - uHeroProgress * (uHeroHeight + 1.0);
fragColor.a *= smoothstep(0.0, 0.14, heroBottom - (1.0 - vUv.y));
  }
