/**
 * PrimeFactor.app — Hero GLSL sources (WebGL 1 / GLSL ES 1.00, shared by the Three.js and the
 * raw-WebGL renderers in hero-fx.js).
 *
 * FIELD: a full-screen "prime sieve" — every grid cell is an integer n; prime cells glow
 * (primality is tested per-fragment by trial division, n < 1764 so d <= 41), layered over a
 * domain-warped fbm nebula. The cursor launches ripples through the lattice.
 */

export const FIELD_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const FIELD_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;   // 0..1, y up
uniform float uScroll;  // 0..1 hero scroll progress
uniform float uPulse;   // click / hover energy 0..1
uniform vec4  uText;    // hero copy box in uv space: centre.xy, half-size.zw (keeps text legible)

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.02 + vec2(17.0, 9.0);
    a *= 0.5;
  }
  return v;
}
float isPrime(float n) {
  if (n < 2.0) return 0.0;
  for (int d = 2; d < 42; d++) {
    float fd = float(d);
    if (fd * fd > n) break;
    if (mod(n, fd) < 0.5) return 0.0;
  }
  return 1.0;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);
  float t = uTime;

  // --- domain-warped nebula -------------------------------------------------------------
  vec2 q = vec2(fbm(p * 1.6 + t * 0.05), fbm(p * 1.6 + vec2(5.2, 1.3) - t * 0.04));
  float f = fbm(p * 1.4 + 2.0 * q + vec2(0.0, uScroll * 0.8));
  vec3 navy   = vec3(0.012, 0.027, 0.075);
  vec3 cyan   = vec3(0.03, 0.42, 0.72);
  vec3 violet = vec3(0.36, 0.26, 0.86);
  // rounded-box signed distance to the copy block: 1 inside the text area, fading out around it
  vec2 td = abs(vUv - uText.xy) - uText.zw;
  float sdf = length(max(td, 0.0)) + min(max(td.x, td.y), 0.0);
  float tm = 1.0 - smoothstep(-0.03, 0.14, sdf);

  vec3 col = mix(navy, cyan, smoothstep(0.2, 0.8, f) * 0.8);
  col = mix(col, violet, smoothstep(0.5, 0.95, q.x) * 0.5);
  col *= 1.0 - 0.5 * tm;

  // --- prime sieve lattice --------------------------------------------------------------
  float rows = 36.0;
  vec2 g = p * rows + vec2(0.0, -uScroll * 3.0);
  vec2 cell = floor(g + vec2(40.0, 20.0));
  vec2 loc = fract(g) - 0.5;
  float n = cell.y * 40.0 + cell.x + 1.0;
  float prime = isPrime(n);

  float md = length(p - m);
  float ripple = exp(-md * 2.6) * (0.55 + 0.45 * sin(md * 20.0 - t * 4.5));
  float wave = 0.5 + 0.5 * sin(t * 1.3 + length(cell) * 0.35);
  float r = 0.06 + 0.07 * wave + 0.2 * ripple * (0.6 + uPulse);
  float dist = length(loc);
  float dot_ = smoothstep(r + 0.03, r - 0.01, dist);
  float halo = smoothstep(0.5, 0.0, dist) * 0.35;

  vec3 primeCol = mix(vec3(0.22, 0.74, 0.97), vec3(0.2, 0.83, 0.6), hash(cell));
  float lattice = 1.0 - 0.9 * tm;            // lattice almost vanishes behind the copy
  col += lattice * prime * (dot_ * primeCol * (0.85 + 0.4 * ripple) + halo * primeCol * 0.3);
  // composites: a very faint pinprick so the grid reads as numbers, not noise
  col += lattice * (1.0 - prime) * smoothstep(0.045, 0.0, dist) * 0.05 * vec3(0.6, 0.7, 0.9);

  // --- sweeping scan band + click shockwave --------------------------------------------
  float band = exp(-pow((vUv.y - fract(t * 0.045)) * 9.0, 2.0));
  col += band * 0.04 * (1.0 - tm) * vec3(0.3, 0.7, 1.0);
  float shock = exp(-abs(md - fract(t * 0.35) * 1.6) * 18.0) * uPulse;
  col += shock * 0.2 * (1.0 - tm) * vec3(0.4, 0.8, 1.0);

  // --- vignette + bottom fade so the next section blends in ----------------------------
  float vig = smoothstep(1.25, 0.25, length((vUv - 0.5) * vec2(1.1, 1.0)));
  col *= mix(0.55, 1.0, vig);
  col *= 1.0 - uScroll * 0.55;

  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Precision space particles (Three.js ShaderMaterial for stratified deep-field stars + orbital prime-dust).
 * Renders diffraction-sharp cores with delicate coronas, faint optical cross-glints on high-tier motes,
 * and automatic luminance attenuation behind the hero copy box.
 */
export const POINTS_VERTEX = /* glsl */ `
attribute float aSeed;
attribute float aTier;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
varying float vTw;
varying float vSeed;
varying float vTier;
varying float vDepth;
varying vec2  vScreenUv;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec4 clip = projectionMatrix * mv;
  float depthDist = max(1.5, -mv.z);

  // Subtle multi-harmonic shimmer for crisp optical stability (no mushy pulsing)
  float speed = 0.8 + aSeed * 1.4;
  float wave = 0.72 + 0.28 * sin(uTime * speed + aSeed * 43.17);
  vTw = wave * (0.85 + 0.15 * cos(uTime * 0.45 + aTier * 19.3));
  vSeed = aSeed;
  vTier = aTier;
  vDepth = clamp((depthDist - 2.5) / 14.0, 0.0, 1.0);
  vScreenUv = (clip.xy / max(0.0001, clip.w)) * 0.5 + 0.5;

  float tierScale = mix(0.68, 1.48, pow(aTier, 1.6));
  float rawSize = uSize * uPixelRatio * tierScale * (0.88 + 0.22 * vTw) * (7.2 / depthDist);
  gl_PointSize = clamp(rawSize, 1.35 * uPixelRatio, 11.0 * uPixelRatio);
  gl_Position = clip;
}
`;

export const POINTS_FRAGMENT = /* glsl */ `
precision highp float;
uniform float uOpacity;
uniform vec4  uText;
varying float vTw;
varying float vSeed;
varying float vTier;
varying float vDepth;
varying vec2  vScreenUv;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;

  // Optical point-spread function: razor-sharp core + clean exponential corona
  float pinpoint = exp(-d * 17.5);
  float corona = pow(smoothstep(0.5, 0.0, d), 4.2) * 0.42;

  // Faint telescope diffraction cross-glint reserved strictly for bright foreground tiers
  float glintMask = smoothstep(0.80, 0.98, vTier);
  float glintX = exp(-abs(c.y) * 30.0) * exp(-abs(c.x) * 6.5);
  float glintY = exp(-abs(c.x) * 30.0) * exp(-abs(c.y) * 6.5);
  float glint = (glintX + glintY) * 0.28 * glintMask;

  float energy = pinpoint + corona + glint;

  // Attenuate luminosity gently inside the hero copy & mini-challenge box so typography stays sharp
  vec2 td = abs(vScreenUv - uText.xy) - uText.zw;
  float sdf = length(max(td, 0.0)) + min(max(td.x, td.y), 0.0);
  float textCalm = 1.0 - 0.62 * (1.0 - smoothstep(-0.02, 0.16, sdf));

  // Depth fade and refined cool-spectral palette (starlight white, electric cyan, indigo, mint)
  float depthFade = mix(1.0, 0.48, vDepth);
  float a = clamp(energy * uOpacity * vTw * textCalm * depthFade, 0.0, 1.0);
  if (a < 0.008) discard;

  vec3 cyanCol   = vec3(0.22, 0.76, 0.98);
  vec3 indigoCol = vec3(0.52, 0.56, 0.98);
  vec3 mintCol   = vec3(0.24, 0.85, 0.68);
  vec3 baseCol   = mix(cyanCol, indigoCol, smoothstep(0.15, 0.75, vSeed));
  baseCol = mix(baseCol, mintCol, smoothstep(0.75, 0.98, vSeed) * 0.55);
  // Core pushes smoothly toward crisp white-hot center
  vec3 finalCol = mix(baseCol, vec3(0.94, 0.98, 1.0), clamp(pinpoint * 0.85 + glintMask * 0.2, 0.0, 1.0));

  gl_FragColor = vec4(finalCol * (0.95 + pinpoint * 0.45), a);
}
`;
