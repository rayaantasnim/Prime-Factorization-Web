/**
 * Hero "orrery": a large modular times-table (cardioid → nephroid → epicycloids) glowing behind the
 * headline. Raw WebGL, additive, ~200 chords. The multiplier k drifts on its own, leans toward the
 * cursor, and the circle parallaxes with scroll. Pauses off-screen / hidden tab.
 */
import { getGL, TimesTable, envelopeName } from "./pf-gl-core.js";

export function initOrrery(heroEl) {
  const wrap = heroEl && heroEl.querySelector(".section-bg-image-wrap");
  if (!wrap) return null;
  const reduce = !!(
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const canvas = document.createElement("canvas");
  canvas.id = "hero-orrery";
  canvas.setAttribute("aria-hidden", "true");
  wrap.insertBefore(canvas, wrap.querySelector(".section-bg-overlay"));
  const gl = getGL(canvas, {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!gl) {
    canvas.remove();
    return null;
  }
  let tt;
  try {
    tt = new TimesTable(gl, { nodes: false });
  } catch (e) {
    canvas.remove();
    return null;
  }

  const readout = heroEl.querySelector("#hero-k-readout");
  let N = 210,
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let w = 1,
    h = 1,
    running = false,
    visible = true,
    raf = 0,
    slow = 0,
    last = 0,
    scroll = 0,
    mx = 0.5,
    lastLabel = 0;
  const t0 = performance.now();

  function resize() {
    const cw = Math.max(1, wrap.clientWidth),
      ch = Math.max(1, wrap.clientHeight);
    w = Math.round(cw * dpr);
    h = Math.round(ch * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    render((performance.now() - t0) / 1000);
  }

  function kAt(t) {
    // 2 → 6 and back, slowly; the pointer adds a gentle lean
    const u = 0.5 - 0.5 * Math.cos(t * 0.055);
    return 2 + u * 4 + (mx - 0.5) * 0.5;
  }

  function render(t) {
    const k = reduce ? 2.0 : kAt(t);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const m = Math.min(w, h);
    const radius = Math.max(m * 0.52, Math.min(w, h * 1.1) * 0.42);
    tt.draw({
      w,
      h,
      n: N,
      k,
      cx: w * 0.5,
      cy: h * (0.52 - scroll * 0.12),
      radius: Math.min(radius, w * 0.62),
      width: 1.4 * dpr,
      alpha: 0.46,
      hue: 0.5 + (reduce ? 0 : Math.sin(t * 0.04) * 0.04),
      span: 0.5,
      sat: 0.7,
      nodeSize: 0,
    });
    if (readout && performance.now() - lastLabel > 120) {
      lastLabel = performance.now();
      readout.textContent = `×${k.toFixed(2)} mod ${N} · ${envelopeName(k)}`;
    }
  }

  function loop(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    if (dt > 0.04) {
      if (++slow > 40 && N > 140) {
        N = 140;
        slow = 0;
      }
    } else if (slow > 0) slow--;
    render((now - t0) / 1000);
    raf = requestAnimationFrame(loop);
  }
  const start = () => {
    if (running || reduce || !visible || document.hidden) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  heroEl.addEventListener(
    "pointermove",
    (e) => {
      const r = heroEl.getBoundingClientRect();
      mx += ((e.clientX - r.left) / Math.max(1, r.width) - mx) * 0.2;
    },
    { passive: true },
  );
  window.addEventListener(
    "scroll",
    () => {
      const r = heroEl.getBoundingClientRect();
      scroll = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stop() : start(),
  );
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((en) => {
      visible = en[0].isIntersecting;
      visible ? start() : stop();
    }).observe(heroEl);
  }
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(wrap);
  else window.addEventListener("resize", resize);
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    stop();
    canvas.remove();
  });
  resize();
  start();
  return { stop };
}
