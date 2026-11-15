/**
 * PrimeFactor.app — Number Theory Observatory (index.html § 03)
 *
 * One WebGL canvas, three fragment-shader scenes:
 *   ULAM   — the prime spiral. Every pixel computes which integer sits under it (closed-form Ulam
 *            addressing) and tests it for primality by wheel trial division *on the GPU*.
 *            Primes ≡ 1 (mod 4) glow gold, ≡ 3 (mod 4) cyan. Pan / zoom / pinch; digits fade in
 *            when the cells get big enough to read.
 *   TIMES  — modular multiplication: join i → k·i (mod n). Fractional k morphs the envelope
 *            (k=2 cardioid, 3 nephroid, …). Chords are anti-aliased quads built in the vertex shader.
 *   SIEVE  — Sieve of Eratosthenes on a 10×10 board, digits drawn in-shader from a glyph atlas.
 *
 * Framer Motion drives the tab indicator, the number count-ups, preset springs and the intro zoom
 * (`animate(from, to, { onUpdate })` feeding shader uniforms). If Motion or WebGL is missing, the
 * inspector still works and nothing is left hidden.
 */
import {
  PREC, getGL, makeProgram, makeQuad, makeDigitAtlas, FULLSCREEN_VS, GLSL_DIGITS, TimesTable, envelopeName
} from './pf-gl-core.js';
import { arithmetic, badgesFor, factorText, primePi, ulamN, ulamPos, fmt } from './pf-math.js';
import { tween } from './pf-motion-loader.js';

// ---------------------------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------------------------
const ULAM_FS = PREC + GLSL_DIGITS + /* glsl */ `
uniform vec2  uRes;
uniform vec2  uCenter;   // cell coordinates under the canvas centre
uniform float uCell;     // device px per cell
uniform float uDpr;
uniform float uSel;      // selected n (0 = none)
uniform vec2  uSelC;
uniform float uHov;
uniform vec2  uHovC;
uniform float uMaxN;

bool dv(float n, float d) { float q = n / d; return abs(q - floor(q + 0.5)) < 0.3 / d; }

// smallest prime factor (n itself when prime); wheel 2, 3, 6i±1 — exact for n < ~7e5 in fp32
float spf(float n) {
  if (n < 4.0) return n;
  if (fract(n * 0.5) < 0.25) return 2.0;
  if (dv(n, 3.0)) return 3.0;
  for (int i = 1; i < 142; i++) {
    float f = 6.0 * float(i);
    float a = f - 1.0;
    if (a * a > n) break;
    if (dv(n, a)) return a;
    float b = f + 1.0;
    if (b * b > n) break;
    if (dv(n, b)) return b;
  }
  return n;
}

// closed-form Ulam addressing: 1 at the origin, 2 to its right, counter-clockwise, y up
float ulamN(vec2 c) {
  float x = c.x, y = c.y;
  float k = max(abs(x), abs(y));
  if (k < 0.5) return 1.0;
  float m = (2.0 * k + 1.0) * (2.0 * k + 1.0);
  if (y < -k + 0.5) return m - (k - x);
  if (x < -k + 0.5) return m - 3.0 * k - y;
  if (y > k - 0.5) return m - 5.0 * k - x;
  return m - 7.0 * k + y;
}

vec3 tintFor(float s) {
  if (s < 2.5) return vec3(0.07, 0.20, 0.50);
  if (s < 3.5) return vec3(0.30, 0.18, 0.62);
  if (s < 5.5) return vec3(0.50, 0.28, 0.20);
  if (s < 7.5) return vec3(0.14, 0.46, 0.38);
  return vec3(0.16, 0.22, 0.34);
}

void main() {
  vec2 px = gl_FragCoord.xy - 0.5 * uRes;
  vec2 w = uCenter + px / uCell;
  vec2 c = floor(w + 0.5);
  vec2 f = w - c;
  float n = ulamN(c);
  float aa = 1.4 / uCell;
  float d = length(f);
  float box = max(abs(f.x), abs(f.y));
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 col = vec3(0.012, 0.028, 0.066) * (1.2 - 0.95 * length(uv - 0.5));
  float big = smoothstep(14.0 * uDpr, 30.0 * uDpr, uCell);

  // origin axes
  if (abs(c.x) < 0.5 || abs(c.y) < 0.5) col += vec3(0.015, 0.03, 0.06);

  bool known = n <= uMaxN;
  float s = known ? spf(n) : 0.0;
  bool prime = known && n > 1.5 && s == n;
  float rad = mix(0.5, 0.34, smoothstep(3.0 * uDpr, 9.0 * uDpr, uCell));
  float disc = smoothstep(rad + aa, rad - aa, d);
  vec3 pc = n < 2.5 ? vec3(1.0) : (mod(n, 4.0) < 1.5 ? vec3(1.0, 0.78, 0.26) : vec3(0.26, 0.86, 1.0));

  if (!known) col += vec3(0.05) * disc;
  else if (n < 1.5) col += vec3(0.8) * disc;
  else if (prime) col += pc * (disc * 0.95 + 0.34 * exp(-d * d * 8.0));
  else col += tintFor(s) * disc * mix(0.85, 1.1, big);

  // digits once the cells are big enough to read
  if (big > 0.0 && known) {
    float g = digitsAt(n, f, 0.84);
    vec3 tc = prime ? pc : vec3(0.72, 0.8, 0.92);
    col = mix(col, tc, g * big * (prime ? 1.0 : 0.82));
  }
  col += vec3(0.25, 0.45, 0.8) * 0.10 * big * smoothstep(0.5 - 2.0 * aa, 0.5, box);

  // selection crosshair + ring
  if (uSel > 0.5) {
    float mx = step(abs(c.x - uSelC.x), 0.5);
    float my = step(abs(c.y - uSelC.y), 0.5);
    col += vec3(0.2, 0.5, 0.9) * 0.05 * (mx + my);
    float isSel = mx * my;
    float ring = 1.0 - smoothstep(0.0, 2.5 * aa + 0.02, abs(box - 0.46));
    col = mix(col, vec3(1.0, 0.96, 0.7), isSel * ring);
    col += isSel * vec3(0.10, 0.08, 0.03);
    // reticle for tiny cells so the pick never disappears
    float pd = length(px - (uSelC - uCenter) * uCell);
    float r0 = (11.0 * uDpr) + uCell * 0.7;
    float ret = (1.0 - smoothstep(0.0, 1.6 * uDpr, abs(pd - r0))) * (1.0 - smoothstep(14.0 * uDpr, 28.0 * uDpr, uCell));
    col = mix(col, vec3(1.0, 0.96, 0.7), ret * 0.95);
  }
  if (uHov > 0.5) {
    float hv = step(abs(c.x - uHovC.x), 0.5) * step(abs(c.y - uHovC.y), 0.5);
    col += hv * vec3(0.10, 0.14, 0.2) * (0.5 + 0.5 * big);
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

const SIEVE_FS = PREC + GLSL_DIGITS + /* glsl */ `
uniform vec2  uRes;
uniform vec4  uDone;     // 1 when the sieve has finished with 2, 3, 5, 7
uniform float uP;        // prime currently sweeping (0 = none)
uniform float uProg;     // how many of its multiples are struck so far
uniform float uFinal;    // seconds since completion (<0 = not complete)
uniform float uSel;
uniform float uHov;
uniform float uDpr;

vec3 strikeCol(float q) {
  if (q < 2.5) return vec3(0.25, 0.82, 1.0);
  if (q < 3.5) return vec3(0.68, 0.52, 1.0);
  if (q < 5.5) return vec3(1.0, 0.76, 0.26);
  return vec3(1.0, 0.46, 0.62);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float side = min(uRes.x, uRes.y) * 0.86;
  vec2 org = (uRes - vec2(side)) * 0.5;
  vec2 g = (frag - org) / side;
  vec2 uv = frag / uRes;
  vec3 col = vec3(0.012, 0.028, 0.066) * (1.2 - 0.95 * length(uv - 0.5));
  if (g.x >= 0.0 && g.x < 1.0 && g.y >= 0.0 && g.y < 1.0) {
    vec2 cf = g * 10.0;
    float cx = floor(cf.x);
    float row = 9.0 - floor(cf.y);
    float n = row * 10.0 + cx + 1.0;
    vec2 f = fract(cf) - 0.5;
    // rounded tile
    vec2 q = abs(f) - vec2(0.5 - 0.06 - 0.11);
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.11;
    float aa = 1.6 / (side * 0.1);
    float tile = smoothstep(aa, -aa, sd);
    float edge = smoothstep(aa * 2.2, 0.0, abs(sd));

    // which finished prime strikes this number (smallest wins)
    float by = 0.0;
    if (n > 2.5 && uDone.x > 0.5 && mod(n, 2.0) < 0.5) by = 2.0;
    else if (n > 3.5 && uDone.y > 0.5 && mod(n, 3.0) < 0.5) by = 3.0;
    else if (n > 5.5 && uDone.z > 0.5 && mod(n, 5.0) < 0.5) by = 5.0;
    else if (n > 7.5 && uDone.w > 0.5 && mod(n, 7.0) < 0.5) by = 7.0;
    bool crossed = by > 0.0;

    // multiples of the sweeping prime
    float sweep = 0.0;
    float fresh = 0.0;
    if (uP > 0.0 && n > uP + 0.5 && mod(n, uP) < 0.5) {
      float j = n / uP - 2.0;
      if (j < uProg) { sweep = 1.0; fresh = 1.0 - clamp(uProg - j, 0.0, 1.0); }
    }
    bool isP = uP > 0.0 && abs(n - uP) < 0.5;
    float fin = 0.0;
    if (uFinal >= 0.0 && !crossed && n > 1.5) fin = clamp(uFinal * 2.2 - n * 0.022, 0.0, 1.0);

    vec3 fill = vec3(0.055, 0.095, 0.18);
    vec3 line = vec3(0.22, 0.38, 0.62);
    float txtA = 0.92;
    vec3 txt = vec3(0.86, 0.91, 0.99);

    if (crossed) { vec3 sc = strikeCol(by); fill = mix(fill * 0.7, sc * 0.2, 1.0); line = sc * 0.55; txtA = 0.32; txt = sc; }
    if (sweep > 0.5 && !crossed) { vec3 sc = strikeCol(uP); fill = mix(fill, sc * 0.55, fresh * 0.9 + 0.2); line = sc; txt = vec3(1.0); }
    if (n < 1.5) { fill *= 0.6; txtA = 0.35; }
    if (isP) { fill = vec3(0.42, 0.30, 0.04); line = vec3(1.0, 0.8, 0.3); txt = vec3(1.0, 0.95, 0.75); }
    if (fin > 0.0) { fill = mix(fill, vec3(0.03, 0.30, 0.2), fin); line = mix(line, vec3(0.35, 1.0, 0.7), fin); txt = mix(txt, vec3(0.75, 1.0, 0.9), fin); }

    col = mix(col, fill, tile);
    col += line * edge * 0.9;
    // glow behind primes / the sweeping prime
    float glow = (isP ? 1.0 : 0.0) + fin * 0.9;
    col += (isP ? vec3(1.0, 0.75, 0.25) : vec3(0.2, 1.0, 0.65)) * glow * 0.22 * (1.0 - smoothstep(0.0, 0.75, length(f)));

    // digits
    float gl = digitsAt(n, f, 0.66);
    col = mix(col, txt, gl * txtA * tile);

    // strike diagonal
    if (crossed) {
      float dd = abs(f.x - f.y) * 0.7071;
      float ln = (1.0 - smoothstep(0.012, 0.012 + aa * 1.5, dd)) * tile * step(max(abs(f.x), abs(f.y)), 0.38);
      col = mix(col, strikeCol(by), ln * 0.9);
    }
    if (uSel > 0.5 && abs(n - uSel) < 0.5) {
      float ring = 1.0 - smoothstep(0.0, aa * 2.4, abs(sd + 0.03));
      col = mix(col, vec3(1.0, 0.96, 0.7), ring);
    }
    if (uHov > 0.5 && abs(n - uHov) < 0.5) col += vec3(0.07, 0.1, 0.16) * tile;
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

const BG_FS = PREC + /* glsl */ `
uniform vec2  uRes;
uniform vec2  uCenter;
uniform float uRadius;
uniform float uDpr;
void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float r = length(p);
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 col = vec3(0.012, 0.028, 0.066) * (1.2 - 0.95 * length(uv - 0.5));
  col += vec3(0.02, 0.05, 0.11) * smoothstep(uRadius * 1.08, 0.0, r);
  // polar guide circles
  float guides = 0.0;
  for (int i = 1; i < 4; i++) guides += 1.0 - smoothstep(0.0, 1.2 * uDpr, abs(r - uRadius * float(i) * 0.25));
  col += vec3(0.2, 0.4, 0.7) * 0.05 * guides;
  // the unit circle
  col += vec3(0.28, 0.6, 0.95) * 0.5 * (1.0 - smoothstep(0.0, 1.5 * uDpr, abs(r - uRadius)));
  // 12 tick marks around the rim
  float a = atan(p.y, p.x);
  float arc = abs(fract(a / 6.2831853 * 12.0 + 0.5) - 0.5) * (6.2831853 / 12.0) * r;
  float tick = (1.0 - smoothstep(0.0, 1.3 * uDpr, arc)) * step(uRadius * 0.955, r) * step(r, uRadius * 1.04);
  col += vec3(0.35, 0.6, 0.95) * 0.5 * tick;
  gl_FragColor = vec4(col, 1.0);
}
`;

const SIEVE_PRIMES = [2, 3, 5, 7];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const MAX_N = 700000;

// ---------------------------------------------------------------------------------------------
export function initObservatory(motion) {
  const $ = (id) => document.getElementById(id);
  const root = $('sec-observatory');
  const canvas = $('obs-canvas');
  if (!root || !canvas) return null;

  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const dprCap = window.matchMedia && window.matchMedia('(pointer: coarse)').matches ? 1.75 : 2;
  const stage = $('obs-stage');
  const live = $('obs-live');

  // ---- inspector (works even without WebGL) -----------------------------------------------
  const inspector = {
    nEl: $('obs-n'), factEl: $('obs-fact'), badgesEl: $('obs-badges'),
    tau: $('obs-stat-tau'), sigma: $('obs-stat-sigma'), phi: $('obs-stat-phi'), pi: $('obs-stat-pi'),
    shown: 0, tw: null
  };
  function showN(n, opts = {}) {
    n = Math.floor(n);
    if (!(n >= 1) || n > 2_000_000_000) return;
    const a = arithmetic(n);
    if (inspector.tw) inspector.tw.stop();
    const from = inspector.shown || n;
    inspector.shown = n;
    const set = (v) => { if (inspector.nEl) inspector.nEl.textContent = fmt(v); };
    if (reduce || opts.instant || Math.abs(from - n) < 2) set(n);
    else inspector.tw = tween(motion, from, n, { duration: 0.6, ease: 'easeOut', onComplete: () => set(n) }, set);
    if (inspector.factEl) {
      inspector.factEl.textContent = n === 1 ? '1 (the empty product)' : n < 2 ? String(n) : a.prime ? `${fmt(n)} is prime` : `${fmt(n)} = ${factorText(n)}`;
    }
    if (inspector.badgesEl) {
      inspector.badgesEl.textContent = '';
      badgesFor(n).forEach((b) => {
        const s = document.createElement('span');
        s.className = `obs-badge obs-badge-${b.k}`;
        s.textContent = b.t;
        inspector.badgesEl.appendChild(s);
      });
    }
    if (inspector.tau) inspector.tau.textContent = fmt(a.tau);
    if (inspector.sigma) inspector.sigma.textContent = fmt(a.sigma);
    if (inspector.phi) inspector.phi.textContent = fmt(a.phi);
    if (inspector.pi) inspector.pi.textContent = n <= 2_000_000 ? fmt(primePi(n)) : '—';
    if (live) live.textContent = a.prime ? `${n} is prime.` : n > 1 ? `${n} equals ${factorText(n)}.` : `${n}.`;
  }

  // ---- WebGL bootstrap --------------------------------------------------------------------
  const gl = getGL(canvas, { alpha: false, antialias: false, preserveDrawingBuffer: false });
  const form = $('obs-inspect-form');
  const input = $('obs-inspect-input');

  if (!gl) {
    root.classList.add('obs-nogl');
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); const v = parseInt(input.value, 10); if (v) showN(v); });
    showN(360, { instant: true });
    return { dispose() {} };
  }

  let ulamP, sieveP, bgP, tt, quad, atlas;
  try {
    quad = makeQuad(gl);
    ulamP = makeProgram(gl, FULLSCREEN_VS, ULAM_FS);
    sieveP = makeProgram(gl, FULLSCREEN_VS, SIEVE_FS);
    bgP = makeProgram(gl, FULLSCREEN_VS, BG_FS);
    tt = new TimesTable(gl, { nodes: true });
    atlas = makeDigitAtlas(gl, 0);
  } catch (err) {
    console.debug('[observatory] shader failure:', err);
    root.classList.add('obs-nogl');
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); const v = parseInt(input.value, 10); if (v) showN(v); });
    showN(360, { instant: true });
    return { dispose() {} };
  }
  root.classList.add('obs-gl');

  // ---- state ------------------------------------------------------------------------------
  const S = {
    mode: 'ulam',
    ulam: { cx: 0, cy: 0, cell: 9, sel: 0, selC: [0, 0], hov: 0, hovC: [0, 0], vx: 0, vy: 0 },
    times: { n: 200, k: 2, play: false },
    sieve: { idx: 0, prog: 0, pause: 0, playing: false, final: -1, done: [0, 0, 0, 0], speed: 1, sel: 0, hov: 0, started: false },
    w: 1, h: 1, dpr: 1
  };
  let dirty = true, raf = 0, visible = false, last = 0, introDone = false, disposed = false;

  const hudTL = $('obs-hud-tl');
  const hudBR = $('obs-hud-br');
  const hint = $('obs-hint');
  const HINTS = {
    ulam: 'Drag to pan · pinch, +/− or Ctrl+scroll to zoom · tap a cell to factorise it',
    times: 'Slide k and n — every chord joins i to k·i (mod n); the glowing envelope is a cycloid family',
    sieve: 'Eratosthenes strikes the multiples of 2, 3, 5, 7 — what survives up to 100 is prime'
  };

  // ---- sizing -----------------------------------------------------------------------------
  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const w = Math.max(2, Math.round(r.width * dpr));
    const h = Math.max(2, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    S.w = w; S.h = h; S.dpr = dpr;
    gl.viewport(0, 0, w, h);
    dirty = true; kick();
  }

  // ---- drawing ----------------------------------------------------------------------------
  function bindQuad(p) {
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    const loc = p.attr('aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    return loc;
  }

  function drawUlam() {
    const u = S.ulam, p = ulamP;
    gl.disable(gl.BLEND);
    gl.useProgram(p.prog);
    const loc = bindQuad(p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlas);
    gl.uniform1i(p.u.uAtlas, 0);
    gl.uniform2f(p.u.uRes, S.w, S.h);
    gl.uniform2f(p.u.uCenter, u.cx, u.cy);
    gl.uniform1f(p.u.uCell, u.cell * S.dpr);
    gl.uniform1f(p.u.uDpr, S.dpr);
    gl.uniform1f(p.u.uSel, u.sel);
    gl.uniform2f(p.u.uSelC, u.selC[0], u.selC[1]);
    gl.uniform1f(p.u.uHov, u.hov);
    gl.uniform2f(p.u.uHovC, u.hovC[0], u.hovC[1]);
    gl.uniform1f(p.u.uMaxN, MAX_N);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(loc);
  }

  function timesGeometry() {
    const m = Math.min(S.w, S.h);
    return { cx: S.w / 2, cy: S.h / 2, radius: m * 0.43 };
  }
  function drawTimes() {
    const g = timesGeometry();
    gl.disable(gl.BLEND);
    gl.useProgram(bgP.prog);
    const loc = bindQuad(bgP);
    gl.uniform2f(bgP.u.uRes, S.w, S.h);
    gl.uniform2f(bgP.u.uCenter, g.cx, g.cy);
    gl.uniform1f(bgP.u.uRadius, g.radius);
    gl.uniform1f(bgP.u.uDpr, S.dpr);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(loc);
    const n = S.times.n;
    tt.draw({
      w: S.w, h: S.h, n, k: S.times.k, cx: g.cx, cy: g.cy, radius: g.radius,
      width: 1.5 * S.dpr, alpha: clamp(1.9 - n / 260, 0.55, 1.45) * 0.62, hue: 0.50, span: 0.62, sat: 0.62,
      nodeSize: clamp(7 - n / 90, 3, 7) * S.dpr
    });
  }

  function drawSieve() {
    const s = S.sieve, p = sieveP;
    gl.disable(gl.BLEND);
    gl.useProgram(p.prog);
    const loc = bindQuad(p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlas);
    gl.uniform1i(p.u.uAtlas, 0);
    gl.uniform2f(p.u.uRes, S.w, S.h);
    gl.uniform4f(p.u.uDone, s.done[0], s.done[1], s.done[2], s.done[3]);
    gl.uniform1f(p.u.uP, s.idx < 4 ? SIEVE_PRIMES[s.idx] : 0);
    gl.uniform1f(p.u.uProg, s.prog);
    gl.uniform1f(p.u.uFinal, s.final);
    gl.uniform1f(p.u.uSel, s.sel);
    gl.uniform1f(p.u.uHov, s.hov);
    gl.uniform1f(p.u.uDpr, S.dpr);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(loc);
  }

  function draw() {
    if (S.mode === 'ulam') drawUlam();
    else if (S.mode === 'times') drawTimes();
    else drawSieve();
  }

  // ---- simulation -------------------------------------------------------------------------
  function sieveStatus() {
    const el = $('obs-sv-status');
    if (!el) return;
    const s = S.sieve;
    if (s.idx >= 4) el.textContent = 'Done · 25 primes ≤ 100 survive the sieve';
    else {
      const p = SIEVE_PRIMES[s.idx];
      el.textContent = `Sieving with p = ${p} · striking ${p * 2}, ${p * 3}, ${p * 4} …`;
    }
  }
  function sieveAdvance(dt) {
    const s = S.sieve;
    if (!s.playing || s.idx >= 4) return;
    if (s.pause > 0) { s.pause -= dt; return; }
    const p = SIEVE_PRIMES[s.idx];
    const total = Math.floor(100 / p) - 1;
    s.prog += dt * (total / 2.4) * s.speed;
    if (s.prog >= total) finishPrime();
  }
  function finishPrime() {
    const s = S.sieve;
    if (s.idx >= 4) return;
    s.done[s.idx] = 1;
    s.idx++;
    s.prog = 0;
    s.pause = 0.45 / s.speed;
    if (s.idx >= 4) { s.final = 0; s.playing = false; syncSievePlay(); }
    sieveStatus();
    dirty = true;
  }
  function syncSievePlay() {
    const b = $('obs-sv-play');
    if (b) { b.textContent = S.sieve.playing ? 'Pause' : (S.sieve.idx >= 4 ? 'Replay' : 'Play'); b.setAttribute('aria-pressed', String(S.sieve.playing)); }
  }
  function sieveReset() {
    Object.assign(S.sieve, { idx: 0, prog: 0, pause: 0.2, final: -1, done: [0, 0, 0, 0], playing: true });
    syncSievePlay(); sieveStatus(); dirty = true; kick();
  }

  function isAnimating() {
    if (S.mode === 'times') return S.times.play;
    if (S.mode === 'sieve') return S.sieve.playing || (S.sieve.final >= 0 && S.sieve.final < 4.5);
    return Math.abs(S.ulam.vx) + Math.abs(S.ulam.vy) > 0.02;
  }

  function frame(now) {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    if (S.mode === 'times' && S.times.play) {
      S.times.k += dt * 0.22;
      if (S.times.k > 100) S.times.k = 2;
      syncTimesUI(true);
      dirty = true;
    } else if (S.mode === 'sieve') {
      sieveAdvance(dt);
      if (S.sieve.final >= 0) S.sieve.final += dt;
      if (S.sieve.playing || S.sieve.final >= 0) dirty = true;
    } else if (S.mode === 'ulam') {
      const u = S.ulam;
      if (Math.abs(u.vx) + Math.abs(u.vy) > 0.02) {
        u.cx -= (u.vx * dt) / u.cell; u.cy += (u.vy * dt) / u.cell;
        clampView();
        u.vx *= Math.pow(0.04, dt); u.vy *= Math.pow(0.04, dt);
        dirty = true;
      } else { u.vx = u.vy = 0; }
    }
    if (dirty) { draw(); dirty = false; }
    if (isAnimating()) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  function kick() {
    if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
  }

  // ---- ulam view helpers ------------------------------------------------------------------
  function clampView() {
    const u = S.ulam;
    u.cell = clamp(u.cell, 2, 96);
    u.cx = clamp(u.cx, -190, 190);
    u.cy = clamp(u.cy, -190, 190);
  }
  function canvasXY(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  }
  function cellAt(x, y, w, h) {
    const u = S.ulam;
    const wx = u.cx + (x - w / 2) / u.cell;
    const wy = u.cy + (h / 2 - y) / u.cell;
    return [Math.round(wx), Math.round(wy)];
  }
  function zoomAt(factor, x, y, w, h) {
    const u = S.ulam;
    const before = [u.cx + (x - w / 2) / u.cell, u.cy + (h / 2 - y) / u.cell];
    u.cell = clamp(u.cell * factor, 2, 96);
    u.cx = before[0] - (x - w / 2) / u.cell;
    u.cy = before[1] - (h / 2 - y) / u.cell;
    clampView(); dirty = true; kick(); updateHudUlam();
  }
  function selectCell(c, clientX, clientY) {
    const n = ulamN(c[0], c[1]);
    if (n > MAX_N) return;
    S.ulam.sel = n; S.ulam.selC = c;
    showN(n);
    dirty = true; kick();
    if (clientX !== undefined) window.dispatchEvent(new CustomEvent('pf:burst', { detail: { x: clientX, y: clientY, kind: 'select', n } }));
  }
  function gotoN(n) {
    n = clamp(Math.floor(n), 1, MAX_N);
    const c = ulamPos(n);
    const u = S.ulam;
    const fromX = u.cx, fromY = u.cy, fromCell = u.cell;
    const toCell = Math.max(fromCell, 16);
    u.sel = n; u.selC = c;
    showN(n);
    if (S.mode !== 'ulam') setMode('ulam');
    if (u.tw) u.tw.stop();
    u.tw = tween(motion, 0, 1, { type: 'spring', stiffness: 90, damping: 18 }, (p) => {
      u.cx = fromX + (c[0] - fromX) * p; u.cy = fromY + (c[1] - fromY) * p;
      u.cell = fromCell + (toCell - fromCell) * clamp(p, 0, 1.2);
      clampView(); dirty = true; kick(); updateHudUlam();
    });
  }
  function updateHudUlam() {
    if (!hudTL) return;
    const u = S.ulam;
    hudTL.textContent = `ULAM SPIRAL · ${u.cell.toFixed(1)} px/cell`;
  }
  function updateHudBR(text) { if (hudBR) hudBR.textContent = text; }

  // ---- pointer interaction ----------------------------------------------------------------
  const pointers = new Map();
  let drag = null;
  let pinch = null;
  let engaged = false;

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    const p = canvasXY(e);
    pointers.set(e.pointerId, p);
    engaged = true;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
      drag = null;
    } else {
      drag = { id: e.pointerId, x: p.x, y: p.y, sx: p.x, sy: p.y, t: performance.now(), moved: false };
      S.ulam.vx = S.ulam.vy = 0;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = canvasXY(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
    if (pinch && pointers.size === 2 && S.mode === 'ulam') {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      zoomAt(d / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2, p.w, p.h);
      pinch.d = d;
      return;
    }
    if (drag && drag.id === e.pointerId) {
      const dx = p.x - drag.x, dy = p.y - drag.y;
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > 5) drag.moved = true;
      if (drag.moved && S.mode === 'ulam') {
        const u = S.ulam, now = performance.now(), dtm = Math.max(1, now - drag.t);
        u.cx -= dx / u.cell; u.cy += dy / u.cell;
        u.vx = (dx / dtm) * 1000 * 0.6 + u.vx * 0.4; u.vy = (dy / dtm) * 1000 * 0.6 + u.vy * 0.4;
        drag.x = p.x; drag.y = p.y; drag.t = now;
        clampView(); dirty = true; kick(); updateHudUlam();
      }
    }
    hoverAt(p);
  });
  const endPointer = (e) => {
    const p = canvasXY(e);
    const wasDrag = drag && drag.id === e.pointerId ? drag : null;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (wasDrag) {
      if (!wasDrag.moved && e.type === 'pointerup') clickAt(p, e.clientX, e.clientY);
      else if (S.mode === 'ulam') kick();
      drag = null;
    }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('pointerleave', () => {
    if (S.ulam.hov) { S.ulam.hov = 0; dirty = true; kick(); }
    if (S.sieve.hov) { S.sieve.hov = 0; dirty = true; kick(); }
    updateHudBR('');
  });

  function sieveCellAt(p) {
    const side = Math.min(p.w, p.h) * 0.86;
    const ox = (p.w - side) / 2, oy = (p.h - side) / 2;
    const gx = (p.x - ox) / side, gy = (p.y - oy) / side;   // gy measured from the top
    if (gx < 0 || gx >= 1 || gy < 0 || gy >= 1) return 0;
    return Math.floor(gy * 10) * 10 + Math.floor(gx * 10) + 1;
  }
  function hoverAt(p) {
    if (S.mode === 'ulam') {
      const c = cellAt(p.x, p.y, p.w, p.h);
      const n = ulamN(c[0], c[1]);
      S.ulam.hov = n <= MAX_N ? n : 0; S.ulam.hovC = c; dirty = true; kick();
      updateHudBR(`(${c[0]}, ${c[1]}) → n = ${fmt(n)}`);
    } else if (S.mode === 'sieve') {
      const n = sieveCellAt(p);
      if (n !== S.sieve.hov) { S.sieve.hov = n; dirty = true; kick(); }
      updateHudBR(n ? `n = ${n}` : '');
    }
  }
  function clickAt(p, cx, cy) {
    if (S.mode === 'ulam') selectCell(cellAt(p.x, p.y, p.w, p.h), cx, cy);
    else if (S.mode === 'sieve') {
      const n = sieveCellAt(p);
      if (n) { S.sieve.sel = n; showN(n); dirty = true; kick(); window.dispatchEvent(new CustomEvent('pf:burst', { detail: { x: cx, y: cy, kind: 'select', n } })); }
    }
  }
  canvas.addEventListener('wheel', (e) => {
    if (S.mode !== 'ulam' || !(e.ctrlKey || e.metaKey || engaged)) return;
    e.preventDefault();
    const p = canvasXY(e);
    zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), p.x, p.y, p.w, p.h);
  }, { passive: false });
  canvas.addEventListener('blur', () => { engaged = false; });
  document.addEventListener('pointerdown', (e) => { if (!stage.contains(e.target)) engaged = false; }, { passive: true });

  canvas.addEventListener('keydown', (e) => {
    const u = S.ulam;
    if (S.mode !== 'ulam') return;
    const step = 40 / u.cell;
    let used = true;
    if (e.key === 'ArrowLeft') u.cx -= step;
    else if (e.key === 'ArrowRight') u.cx += step;
    else if (e.key === 'ArrowUp') u.cy += step;
    else if (e.key === 'ArrowDown') u.cy -= step;
    else if (e.key === '+' || e.key === '=') { const r = canvas.getBoundingClientRect(); zoomAt(1.25, r.width / 2, r.height / 2, r.width, r.height); }
    else if (e.key === '-' || e.key === '_') { const r = canvas.getBoundingClientRect(); zoomAt(0.8, r.width / 2, r.height / 2, r.width, r.height); }
    else if (e.key === 'Enter' || e.key === ' ') selectCell([Math.round(u.cx), Math.round(u.cy)]);
    else if (e.key === 'Home') resetUlam();
    else used = false;
    if (used) { e.preventDefault(); clampView(); dirty = true; kick(); updateHudUlam(); }
  });

  function resetUlam() {
    const u = S.ulam;
    const fx = u.cx, fy = u.cy, fc = u.cell;
    if (u.tw) u.tw.stop();
    u.tw = tween(motion, 0, 1, { type: 'spring', stiffness: 120, damping: 20 }, (p) => {
      u.cx = fx * (1 - p); u.cy = fy * (1 - p); u.cell = fc + (9 - fc) * p;
      clampView(); dirty = true; kick(); updateHudUlam();
    });
  }

  // toolbar buttons
  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
  const center = () => { const r = canvas.getBoundingClientRect(); return [r.width / 2, r.height / 2, r.width, r.height]; };
  on('obs-zoom-in', () => zoomAt(1.5, ...center()));
  on('obs-zoom-out', () => zoomAt(1 / 1.5, ...center()));
  on('obs-reset', resetUlam);
  on('obs-engage', () => {
    const b = $('obs-engage');
    const v = stage.classList.toggle('is-engaged');
    b.setAttribute('aria-pressed', String(v));
    b.textContent = v ? 'Release · scroll page' : 'Explore · drag freely';
  });

  // ---- times-table UI ---------------------------------------------------------------------
  const nRange = $('obs-n-range'), kRange = $('obs-k-range'), nVal = $('obs-n-val'), kVal = $('obs-k-val');
  function syncTimesUI(fromSim) {
    const t = S.times;
    if (nRange && !fromSim) nRange.value = t.n;
    if (kRange) kRange.value = t.k;
    if (nVal) nVal.textContent = t.n;
    if (kVal) kVal.textContent = t.k.toFixed(2);
    if (hudTL && S.mode === 'times') hudTL.textContent = `× ${t.k.toFixed(2)}  mod ${t.n}`;
    if (hudBR && S.mode === 'times') hudBR.textContent = envelopeName(t.k).toUpperCase();
    document.querySelectorAll('[data-k]').forEach((b) => b.classList.toggle('is-on', Math.abs(parseFloat(b.dataset.k) - t.k) < 0.05));
  }
  if (nRange) nRange.addEventListener('input', () => { S.times.n = parseInt(nRange.value, 10); syncTimesUI(); dirty = true; kick(); showN(S.times.n); });
  if (kRange) kRange.addEventListener('input', () => { S.times.k = parseFloat(kRange.value); S.times.play = false; syncPlayBtn(); syncTimesUI(true); dirty = true; kick(); });
  function syncPlayBtn() {
    const b = $('obs-tt-play');
    if (b) { b.textContent = S.times.play ? 'Pause morph' : 'Morph k'; b.setAttribute('aria-pressed', String(S.times.play)); }
  }
  on('obs-tt-play', () => { S.times.play = !S.times.play; syncPlayBtn(); kick(); });
  document.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
    const to = parseFloat(b.dataset.k), from = S.times.k;
    S.times.play = false; syncPlayBtn();
    if (S.times.tw) S.times.tw.stop();
    S.times.tw = tween(motion, from, to, { type: 'spring', stiffness: 70, damping: 15 }, (v) => { S.times.k = v; syncTimesUI(true); dirty = true; kick(); });
  }));

  // ---- sieve UI ---------------------------------------------------------------------------
  on('obs-sv-play', () => {
    const s = S.sieve;
    if (s.idx >= 4) { sieveReset(); return; }
    s.playing = !s.playing; syncSievePlay(); kick();
  });
  on('obs-sv-step', () => {
    const s = S.sieve;
    if (s.idx >= 4) return;
    const p = SIEVE_PRIMES[s.idx];
    s.prog = Math.floor(100 / p) - 1; s.playing = false;
    finishPrime(); syncSievePlay(); kick();
  });
  on('obs-sv-reset', () => { Object.assign(S.sieve, { idx: 0, prog: 0, pause: 0, final: -1, done: [0, 0, 0, 0], playing: false, sel: 0 }); syncSievePlay(); sieveStatus(); dirty = true; kick(); });
  const speed = $('obs-sv-speed');
  if (speed) speed.addEventListener('input', () => { S.sieve.speed = parseFloat(speed.value); });

  // ---- mode switching ---------------------------------------------------------------------
  const tabs = [...document.querySelectorAll('[data-obs-mode]')];
  const ind = $('obs-tab-ind');
  function placeIndicator(animate) {
    const active = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    if (!active || !ind) return;
    const x = active.offsetLeft, w = active.offsetWidth;
    if (animate && motion && !reduce) {
      motion.animate(ind, { x, width: w }, { type: 'spring', stiffness: 380, damping: 32 });
    } else {
      ind.style.transform = `translateX(${x}px)`;
      ind.style.width = w + 'px';
    }
  }
  function setMode(m, opts = {}) {
    if (!['ulam', 'times', 'sieve'].includes(m)) return;
    S.mode = m;
    tabs.forEach((t) => {
      const sel = t.dataset.obsMode === m;
      t.setAttribute('aria-selected', String(sel));
      t.tabIndex = sel ? 0 : -1;
    });
    document.querySelectorAll('[data-obs-panel]').forEach((p) => { p.hidden = p.dataset.obsPanel !== m; });
    stage.dataset.mode = m;
    if (hint) hint.textContent = HINTS[m];
    placeIndicator(!opts.instant);
    if (m === 'ulam') { updateHudUlam(); updateHudBR(''); if (S.ulam.sel) showN(S.ulam.sel, { instant: true }); }
    if (m === 'times') { syncTimesUI(); showN(S.times.n); }
    if (m === 'sieve') {
      if (hudTL) hudTL.textContent = 'SIEVE OF ERATOSTHENES · 1 – 100';
      updateHudBR('');
      sieveStatus(); syncSievePlay();
      if (!S.sieve.started && !reduce && !opts.instant) { S.sieve.started = true; S.sieve.playing = true; S.sieve.pause = 0.5; syncSievePlay(); }
      if (S.sieve.sel) showN(S.sieve.sel, { instant: true });
    }
    if (!opts.instant && motion && !reduce) motion.animate(canvas, { opacity: [0.25, 1] }, { duration: 0.55, ease: 'easeOut' });
    canvas.setAttribute('aria-label', {
      ulam: 'Ulam prime spiral. Arrow keys pan, plus and minus zoom, Enter inspects the centre number.',
      times: 'Modular times-table diagram. Use the sliders to change the multiplier and modulus.',
      sieve: 'Sieve of Eratosthenes on the numbers 1 to 100.'
    }[m]);
    dirty = true; kick();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => setMode(t.dataset.obsMode));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const nx = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      nx.focus(); setMode(nx.dataset.obsMode); e.preventDefault();
    });
  });

  // ---- inspector form ---------------------------------------------------------------------
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = parseInt(input.value, 10);
    if (!(v >= 1)) return;
    if (S.mode === 'ulam' && v <= MAX_N) gotoN(v);
    else if (S.mode === 'sieve') { S.sieve.sel = v <= 100 ? v : 0; showN(v); dirty = true; kick(); }
    else showN(v);
  });
  document.querySelectorAll('[data-obs-try]').forEach((b) => b.addEventListener('click', () => {
    const v = parseInt(b.dataset.obsTry, 10);
    if (input) input.value = v;
    if (S.mode === 'ulam') gotoN(v); else { showN(v); if (S.mode === 'sieve' && v <= 100) { S.sieve.sel = v; dirty = true; kick(); } }
  }));

  // ---- lifecycle --------------------------------------------------------------------------
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { resize(); placeIndicator(false); }) : null;
  if (ro) ro.observe(stage); else window.addEventListener('resize', resize);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); root.classList.add('obs-nogl'); root.classList.remove('obs-gl'); disposed = true; });

  const io = new IntersectionObserver((entries) => {
    const was = visible;
    visible = entries[0].isIntersecting;
    if (visible && !was) {
      last = 0; dirty = true; kick();
      if (!introDone) {
        introDone = true;
        if (!reduce) {
          S.ulam.cell = 2.4;
          tween(motion, 2.4, 9, { type: 'spring', stiffness: 38, damping: 12, mass: 1.2 }, (v) => { S.ulam.cell = v; dirty = true; kick(); updateHudUlam(); });
        }
      }
    }
  }, { threshold: 0.12 });
  io.observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { last = 0; kick(); } });

  setMode('ulam', { instant: true });
  syncTimesUI();
  syncPlayBtn();
  resize();
  // a famous starting point: the Ulam spiral's 41-prime diagonal (n² + n + 41) passes through 41
  S.ulam.sel = 41; S.ulam.selC = ulamPos(41);
  showN(41, { instant: true });
  if (input) input.value = 41;
  placeIndicator(false);
  setTimeout(() => placeIndicator(false), 400);

  return {
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect(); if (ro) ro.disconnect();
      try { tt.dispose(); } catch (e) { /* noop */ }
    },
    state: S,
    setMode,
    gotoN
  };
}
