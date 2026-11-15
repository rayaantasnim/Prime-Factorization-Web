/**
 * PrimeFactor.app — raw WebGL toolkit (WebGL 1 / GLSL ES 1.00, zero dependencies).
 *
 *  - getGL / makeProgram / fullscreen quad helpers
 *  - makeDigitAtlas : 0-9 glyph strip rendered with Canvas2D, sampled by the shaders so numbers
 *                     can be drawn *inside* fragment shaders (Ulam cells, sieve grid, sparks)
 *  - TimesTable     : the modular multiplication "string-art" renderer. Chord i -> (k·i mod n) is
 *                     expanded to anti-aliased quads in the vertex shader; k may be fractional,
 *                     which morphs the envelope smoothly (k=2 cardioid, 3 nephroid, 4 …).
 *                     Used by the hero orrery and by the Observatory.
 */

export const PREC = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

export function getGL(canvas, attrs = {}) {
  const opts = { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance', ...attrs };
  let gl = null;
  try { gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts); } catch (e) { gl = null; }
  return gl;
}

export function makeProgram(gl, vsSrc, fsSrc) {
  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error('shader: ' + log);
    }
    return sh;
  };
  const prog = gl.createProgram();
  const vs = compile(gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(prog));
  const uniforms = {};
  const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(prog, i);
    uniforms[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(prog, info.name);
  }
  return { prog, u: uniforms, attr: (name) => gl.getAttribLocation(prog, name) };
}

export function makeQuad(gl) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  return buf;
}

export const FULLSCREEN_VS = /* glsl */ `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/** 10 glyph cells (64×96 each) in one strip. White on transparent; flipped so v=1 is the glyph top. */
export function makeDigitAtlas(gl, unit = 0) {
  const cw = 64, ch = 96;
  const c = document.createElement('canvas');
  c.width = cw * 10; c.height = ch;
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = '700 74px "JetBrains Mono", "Rajdhani", "SF Mono", Consolas, "Liberation Mono", monospace';
  for (let i = 0; i < 10; i++) g.fillText(String(i), cw * i + cw / 2, ch * 0.78);
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

/** GLSL: draws the decimal digits of `n` centred in a unit cell. Returns glyph coverage 0..1. */
export const GLSL_DIGITS = /* glsl */ `
uniform sampler2D uAtlas;
float digitCount(float n) {
  return n < 10.0 ? 1.0 : n < 100.0 ? 2.0 : n < 1000.0 ? 3.0 : n < 10000.0 ? 4.0 : n < 100000.0 ? 5.0 : n < 1000000.0 ? 6.0 : 7.0;
}
// f: position inside the cell, -0.5..0.5 (y up). maxW: fraction of the cell width the text may use.
float digitsAt(float n, vec2 f, float maxW) {
  float D = digitCount(n);
  float dw = min(maxW / D, 0.5);
  float dh = dw * 1.5;
  float tw = dw * D;
  float x = (f.x + tw * 0.5) / dw;
  float y = (f.y + dh * 0.5) / dh;
  if (x < 0.0 || x >= D || y < 0.0 || y > 1.0) return 0.0;
  float i = floor(x);
  float p = 1.0;
  for (int k = 0; k < 7; k++) { if (float(k) < D - 1.0 - i) p *= 10.0; }
  float dig = mod(floor(n / p + 0.001), 10.0);
  float u = (dig + fract(x)) / 10.0;
  // the glyph sits in the middle of its 64×96 cell; stretch a touch so it fills the slot
  return texture2D(uAtlas, vec2(u, y)).a;
}
`;

// =============================================================================================
// Times-table / modular multiplication renderer
// =============================================================================================
const TT_VS = /* glsl */ `
attribute vec3 aV;            // x: chord index, y: side (-1 | +1), z: end (0 | 1)
uniform float uN;
uniform float uK;
uniform vec2  uRes;
uniform vec2  uCenter;        // px, origin bottom-left
uniform float uRadius;        // px
uniform float uWidth;         // px
uniform float uHue;
uniform float uSpan;          // how much of the hue wheel the ring covers
varying float vSide;
varying float vHue;
varying float vLen;

vec2 node(float idx) {
  float a = 1.5707963 - 6.2831853 * idx / uN;   // node 0 at 12 o'clock, clockwise
  return uCenter + uRadius * vec2(cos(a), sin(a));
}
void main() {
  float i = aV.x;
  float e = mod(i * uK, uN);
  vec2 p0 = node(i);
  vec2 p1 = node(e);
  vec2 d = p1 - p0;
  float len = length(d);
  vec2 dir = len > 0.001 ? d / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 p = mix(p0, p1, aV.z) + nrm * aV.y * uWidth * 0.5 + dir * (aV.z * 2.0 - 1.0) * uWidth * 0.5;
  gl_Position = vec4(p / uRes * 2.0 - 1.0, 0.0, 1.0);
  vSide = aV.y;
  vHue = uHue + uSpan * i / uN;
  vLen = len / (2.0 * uRadius);
}
`;

const TT_FS = PREC + /* glsl */ `
uniform float uAlpha;
uniform float uSat;
varying float vSide;
varying float vHue;
varying float vLen;
vec3 hsv(float h, float s, float v) {
  vec3 k = clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  return v * mix(vec3(1.0), k, s);
}
void main() {
  float a = smoothstep(1.0, 0.05, abs(vSide));
  // long chords are the structural ones: give them a touch more weight
  float w = 0.55 + 0.9 * vLen;
  vec3 c = hsv(vHue, uSat, 1.0);
  float k = a * uAlpha * w;
  gl_FragColor = vec4(c * k, k);
}
`;

const NODE_VS = /* glsl */ `
attribute float aI;
uniform float uN;
uniform vec2  uRes;
uniform vec2  uCenter;
uniform float uRadius;
uniform float uSize;
uniform float uHue;
uniform float uSpan;
varying float vHue;
varying float vPrime;
void main() {
  float a = 1.5707963 - 6.2831853 * aI / uN;
  vec2 p = uCenter + uRadius * vec2(cos(a), sin(a));
  gl_Position = vec4(p / uRes * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uSize;
  vHue = uHue + uSpan * aI / uN;
}
`;
const NODE_FS = PREC + /* glsl */ `
varying float vHue;
vec3 hsv(float h, float s, float v) {
  vec3 k = clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  return v * mix(vec3(1.0), k, s);
}
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.2, d);
  vec3 col = hsv(vHue, 0.45, 1.0);
  gl_FragColor = vec4(col * a, a);
}
`;

export const MAX_CHORDS = 480;

export class TimesTable {
  /**
   * @param {WebGLRenderingContext} gl
   * @param {{ nodes?: boolean }} opts
   */
  constructor(gl, opts = {}) {
    this.gl = gl;
    this.showNodes = !!opts.nodes;
    this.p = makeProgram(gl, TT_VS, TT_FS);
    // 6 vertices per chord: two triangles forming a quad along the chord
    const v = new Float32Array(MAX_CHORDS * 6 * 3);
    const corners = [[-1, 0], [1, 0], [-1, 1], [-1, 1], [1, 0], [1, 1]];
    for (let i = 0; i < MAX_CHORDS; i++) {
      for (let c = 0; c < 6; c++) {
        const o = (i * 6 + c) * 3;
        v[o] = i; v[o + 1] = corners[c][0]; v[o + 2] = corners[c][1];
      }
    }
    this.chordBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.chordBuf);
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);

    if (this.showNodes) {
      this.np = makeProgram(gl, NODE_VS, NODE_FS);
      const idx = new Float32Array(MAX_CHORDS);
      for (let i = 0; i < MAX_CHORDS; i++) idx[i] = i;
      this.nodeBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.nodeBuf);
      gl.bufferData(gl.ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    }
  }

  /**
   * @param {{w:number,h:number,n:number,k:number,cx:number,cy:number,radius:number,
   *          width:number,alpha:number,hue:number,span:number,sat:number,nodeSize:number}} s  (px, origin bottom-left)
   */
  draw(s) {
    const gl = this.gl;
    const N = Math.max(3, Math.min(MAX_CHORDS, Math.round(s.n)));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    const p = this.p;
    gl.useProgram(p.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.chordBuf);
    const loc = p.attr('aV');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    gl.uniform1f(p.u.uN, N);
    gl.uniform1f(p.u.uK, s.k);
    gl.uniform2f(p.u.uRes, s.w, s.h);
    gl.uniform2f(p.u.uCenter, s.cx, s.cy);
    gl.uniform1f(p.u.uRadius, s.radius);
    gl.uniform1f(p.u.uWidth, s.width);
    gl.uniform1f(p.u.uHue, s.hue);
    gl.uniform1f(p.u.uSpan, s.span);
    gl.uniform1f(p.u.uAlpha, s.alpha);
    gl.uniform1f(p.u.uSat, s.sat);
    gl.drawArrays(gl.TRIANGLES, 0, N * 6);
    gl.disableVertexAttribArray(loc);

    if (this.showNodes && s.nodeSize > 0) {
      const q = this.np;
      gl.useProgram(q.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.nodeBuf);
      const l2 = q.attr('aI');
      gl.enableVertexAttribArray(l2);
      gl.vertexAttribPointer(l2, 1, gl.FLOAT, false, 0, 0);
      gl.uniform1f(q.u.uN, N);
      gl.uniform2f(q.u.uRes, s.w, s.h);
      gl.uniform2f(q.u.uCenter, s.cx, s.cy);
      gl.uniform1f(q.u.uRadius, s.radius);
      gl.uniform1f(q.u.uSize, s.nodeSize);
      gl.uniform1f(q.u.uHue, s.hue);
      gl.uniform1f(q.u.uSpan, s.span);
      gl.drawArrays(gl.POINTS, 0, N);
      gl.disableVertexAttribArray(l2);
    }
  }

  dispose() {
    const gl = this.gl;
    gl.deleteBuffer(this.chordBuf);
    gl.deleteProgram(this.p.prog);
    if (this.np) { gl.deleteBuffer(this.nodeBuf); gl.deleteProgram(this.np.prog); }
  }
}

/** Human name for the envelope of the k-times table: k=2 cardioid, 3 nephroid, k → (k−1) cusps. */
export function envelopeName(k) {
  const r = Math.round(k);
  if (Math.abs(k - r) > 0.02) return 'Morphing envelope';
  if (r === 2) return 'Cardioid · 1 cusp';
  if (r === 3) return 'Nephroid · 2 cusps';
  if (r === 4) return 'Trefoil epicycloid · 3 cusps';
  if (r === 5) return 'Quatrefoil epicycloid · 4 cusps';
  return `Epicycloid · ${r - 1} cusps`;
}
