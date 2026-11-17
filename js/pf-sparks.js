/**
 * Digit sparks: a fixed, click-through WebGL overlay that emits glyph sprites (the digits 0-9,
 * weighted toward 2 3 5 7) from the cursor trail, button presses, Observatory picks and the
 * mini-challenge verdict. CPU particle sim, one dynamic buffer, GL_POINTS sampling the digit atlas.
 * The render loop only runs while particles are alive.
 */
import { PREC, getGL, makeProgram, makeDigitAtlas } from "./pf-gl-core.js";

const VS = /* glsl */ `
attribute vec4 aA;   // x, y (css px), size (css px), glyph
attribute vec2 aB;   // life 0..1, hue index
uniform vec2 uRes;
uniform float uDpr;
varying float vGlyph;
varying float vLife;
varying float vHue;
void main() {
  vec2 p = aA.xy / uRes * 2.0 - 1.0;
  gl_Position = vec4(p.x, -p.y, 0.0, 1.0);
  gl_PointSize = aA.z * uDpr * (0.55 + 0.45 * aB.x);
  vGlyph = aA.w; vLife = aB.x; vHue = aB.y;
}
`;
const FS =
  PREC +
  /* glsl */ `
uniform sampler2D uAtlas;
varying float vGlyph;
varying float vLife;
varying float vHue;
vec3 palette(float h) {
  if (h < 0.5) return vec3(0.35, 0.88, 1.0);     // cyan
  if (h < 1.5) return vec3(1.0, 0.80, 0.30);     // gold
  if (h < 2.5) return vec3(0.45, 1.0, 0.72);     // mint
  if (h < 3.5) return vec3(0.72, 0.60, 1.0);     // violet
  return vec3(1.0, 0.42, 0.50);                  // rose
}
void main() {
  float lx = (gl_PointCoord.x - 0.5) * 1.5 + 0.5;   // sprite is square, glyph cell is 2:3
  if (lx < 0.0 || lx > 1.0) discard;
  float a = texture2D(uAtlas, vec2((vGlyph + lx) / 10.0, 1.0 - gl_PointCoord.y)).a;
  float k = a * smoothstep(0.0, 0.35, vLife) * 0.95;
  gl_FragColor = vec4(palette(vHue) * k, k);
}
`;

const MAX = 260;
const GLYPHS = [2, 3, 5, 7, 2, 3, 5, 7, 1, 0, 4, 6, 8, 9, 11 % 10, 13 % 10];

export function initSparks() {
  const reduce = !!(
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  if (reduce) return null;
  const canvas = document.createElement("canvas");
  canvas.id = "pf-sparks";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const gl = getGL(canvas, {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!gl) {
    canvas.remove();
    return null;
  }
  let prog, buf, atlas;
  try {
    prog = makeProgram(gl, VS, FS);
    atlas = makeDigitAtlas(gl, 0);
    buf = gl.createBuffer();
  } catch (e) {
    canvas.remove();
    return null;
  }

  const P = []; // particle objects
  const data = new Float32Array(MAX * 6);
  let w = 1,
    h = 1,
    dpr = 1,
    raf = 0,
    last = 0;
  const fine =
    window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener("resize", resize);

  const rnd = (a, b) => a + Math.random() * (b - a);
  function spawn(x, y, o) {
    if (P.length >= MAX) P.shift();
    P.push({
      x,
      y,
      vx: o.vx,
      vy: o.vy,
      g: o.g ?? 0,
      size: o.size,
      glyph: o.glyph ?? GLYPHS[(Math.random() * GLYPHS.length) | 0],
      life: 1,
      decay: o.decay,
      hue: o.hue,
      drag: o.drag ?? 0.9,
    });
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  }
  function burst(x, y, kind = "select", n) {
    const cfg =
      {
        select: {
          count: 14,
          speed: [60, 190],
          hues: [0, 3, 1],
          size: [13, 20],
          g: 140,
        },
        win: {
          count: 70,
          speed: [140, 460],
          hues: [1, 2, 0],
          size: [16, 30],
          g: 360,
        },
        lose: {
          count: 16,
          speed: [40, 150],
          hues: [4],
          size: [14, 22],
          g: 520,
        },
        press: {
          count: 10,
          speed: [50, 160],
          hues: [0, 3],
          size: [11, 17],
          g: 100,
        },
      }[kind] || {};
    const digits = n ? String(n).split("").map(Number) : null;
    for (let i = 0; i < cfg.count; i++) {
      const a = rnd(0, Math.PI * 2),
        s = rnd(...cfg.speed);
      spawn(x, y, {
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - (kind === "lose" ? -40 : 60),
        g: cfg.g,
        size: rnd(...cfg.size),
        decay: rnd(0.7, 1.25),
        hue: cfg.hues[(Math.random() * cfg.hues.length) | 0],
        glyph:
          digits && Math.random() < 0.6
            ? digits[(Math.random() * digits.length) | 0]
            : undefined,
      });
    }
  }

  function tick(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    let k = 0;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        P.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d;
      p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (const p of P) {
      data[k++] = p.x;
      data[k++] = p.y;
      data[k++] = p.size;
      data[k++] = p.glyph;
      data[k++] = p.life;
      data[k++] = p.hue;
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (P.length) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(prog.prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.uniform1i(prog.u.uAtlas, 0);
      gl.uniform2f(prog.u.uRes, w, h);
      gl.uniform1f(prog.u.uDpr, dpr);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, k), gl.DYNAMIC_DRAW);
      const a = prog.attr("aA"),
        b = prog.attr("aB");
      gl.enableVertexAttribArray(a);
      gl.enableVertexAttribArray(b);
      gl.vertexAttribPointer(a, 4, gl.FLOAT, false, 24, 0);
      gl.vertexAttribPointer(b, 2, gl.FLOAT, false, 24, 16);
      gl.drawArrays(gl.POINTS, 0, P.length);
      gl.disableVertexAttribArray(a);
      gl.disableVertexAttribArray(b);
      raf = requestAnimationFrame(tick);
    }
  }

  // cursor trail (mouse only)
  if (fine) {
    let lx = -99,
      ly = -99,
      lt = 0;
    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse") return;
        const now = performance.now();
        if (now - lt < 55 || Math.hypot(e.clientX - lx, e.clientY - ly) < 18)
          return;
        lt = now;
        lx = e.clientX;
        ly = e.clientY;
        spawn(lx, ly, {
          vx: rnd(-14, 14),
          vy: rnd(-46, -18),
          g: -10,
          size: rnd(11, 17),
          decay: rnd(1.3, 1.9),
          hue: Math.random() < 0.7 ? 0 : 3,
          drag: 0.96,
        });
      },
      { passive: true },
    );
  }
  // press feedback on interactive surfaces
  const PRESS =
    ".hero-btn-primary, .hero-btn-secondary, .hero-btn-auth, .mini-prime-pill, .mini-new-num, .mini-target-refresh, .obs-chip, .obs-btn, .pf-tier-card";
  document.addEventListener(
    "pointerdown",
    (e) => {
      const t = e.target.closest && e.target.closest(PRESS);
      if (t) burst(e.clientX, e.clientY, "press");
    },
    { passive: true },
  );
  window.addEventListener("pf:burst", (e) => {
    const d = e.detail || {};
    burst(d.x ?? w / 2, d.y ?? h / 2, d.kind || "select", d.n);
  });

  return { burst };
}
