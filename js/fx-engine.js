/**
 * PrimeFactor.app — FX Engine (every page, dependency-free except optional GSAP from the page's CDN tag)
 * ---------------------------------------------------------------------------------------------
 * Implements the motion layer of the "Obsidian Aurora Pro" architecture:
 *
 *  Framer-Motion-style   → spring integrator, staggered word reveals ([data-split-reveal]),
 *                          smooth hover tilts ([data-tilt])
 *  GSAP                  → precision timelines that draw geometric wireframes / math diagrams
 *                          (svg[data-wireframe])
 *  Aceternity-style      → spotlight + glowing border follow the cursor ([data-spotlight], .glow-card,
 *                          .spotlight-hero)
 *  Magic-UI-style        → animated number tickers ([data-ticker]), shimmer buttons (CSS), orbit (CSS)
 *
 * Everything is declarative: add the attribute, get the effect. All effects are skipped under
 * prefers-reduced-motion (values are simply shown) and on the timed exam arena.
 */

const reduce = () =>
  !!(
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
const isExam = () => document.documentElement.dataset.uxPage === "exam";
const finePointer = () =>
  !!(
    window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );

/* ------------------------------------------------------------------ spring physics */
export function spring({
  from = 0,
  to = 1,
  stiffness = 170,
  damping = 22,
  mass = 1,
  onUpdate,
  onDone,
}) {
  let x = from,
    v = 0,
    raf = 0,
    last = performance.now(),
    stopped = false;
  const tick = (now) => {
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;
    v += ((-stiffness * (x - to) - damping * v) / mass) * dt;
    x += v * dt;
    onUpdate && onUpdate(x);
    if (Math.abs(v) < 0.001 && Math.abs(x - to) < 0.001) {
      onUpdate && onUpdate(to);
      onDone && onDone();
      return;
    }
    if (!stopped) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}

/* ------------------------------------------------------------------ number ticker (Magic UI) */
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
export function tickNumber(
  el,
  to,
  { duration = 1100, from, decimals = 0, prefix = "", suffix = "" } = {},
) {
  if (!el) return;
  const target = Number(to);
  if (!Number.isFinite(target)) {
    el.textContent = String(to);
    return;
  }
  const start =
    from !== undefined ? Number(from) : Number(el.dataset.tickValue) || 0;
  el.dataset.tickValue = String(target);
  const fmt = (n) =>
    prefix +
    n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix;
  if (reduce() || start === target) {
    el.textContent = fmt(target);
    return;
  }
  cancelAnimationFrame(el._tickRaf || 0);
  const t0 = performance.now();
  const frame = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    el.textContent = fmt(start + (target - start) * easeOutExpo(p));
    if (p < 1) el._tickRaf = requestAnimationFrame(frame);
    else el.textContent = fmt(target);
  };
  el._tickRaf = requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ scramble (decode) text */
export function scrambleText(el, finalText, duration = 500) {
  if (!el) return;
  const chars = "0123456789";
  if (reduce()) {
    el.textContent = finalText;
    return;
  }
  const t0 = performance.now();
  cancelAnimationFrame(el._scrRaf || 0);
  const frame = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    const settled = Math.floor(p * finalText.length);
    let out = "";
    for (let i = 0; i < finalText.length; i++) {
      const ch = finalText[i];
      out +=
        i < settled || !/\d/.test(ch)
          ? ch
          : chars[(Math.random() * chars.length) | 0];
    }
    el.textContent = out;
    if (p < 1) el._scrRaf = requestAnimationFrame(frame);
    else el.textContent = finalText;
  };
  el._scrRaf = requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ viewport helper */
function whenVisible(els, cb, threshold = 0.25) {
  if (!("IntersectionObserver" in window)) {
    els.forEach(cb);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          io.unobserve(en.target);
          cb(en.target);
        }
      });
    },
    { threshold },
  );
  els.forEach((e) => io.observe(e));
}

/* ------------------------------------------------------------------ [data-ticker] */
function initTickers(root = document) {
  const els = [
    ...root.querySelectorAll("[data-ticker]:not([data-ticker-ready])"),
  ];
  els.forEach((e) => {
    e.dataset.tickerReady = "1";
  });
  whenVisible(els, (el) => {
    tickNumber(el, el.dataset.ticker, {
      duration: Number(el.dataset.tickerDuration) || 1400,
      decimals: Number(el.dataset.tickerDecimals) || 0,
      prefix: el.dataset.tickerPrefix || "",
      suffix: el.dataset.tickerSuffix || "",
      from: 0,
    });
  });
}

/* ------------------------------------------------------------------ [data-split-reveal] staggered words */
function initSplitReveal(root = document) {
  const els = [
    ...root.querySelectorAll("[data-split-reveal]:not([data-split-ready])"),
  ];
  els.forEach((el) => {
    el.dataset.splitReady = "1";
    if (reduce() || el.children.length > 0) return; // only plain-text nodes are split (keeps markup safe)
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.textContent = "";
    words.forEach((w, i) => {
      const s = document.createElement("span");
      s.className = "split-word";
      s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--i", String(i));
      s.textContent = w + (i < words.length - 1 ? " " : "");
      el.appendChild(s);
    });
  });
  whenVisible(els, (el) => el.classList.add("is-split-in"), 0.3);
}

/* ------------------------------------------------------------------ cursor spotlight + glowing border */
function initSpotlight() {
  if (!finePointer()) return;
  document
    .querySelectorAll(
      ".contract-card, .audit-stack-card, .strategy-card, .rank-card, .edu-subcard, .ledger-box",
    )
    .forEach((e) => e.classList.add("glow-card"));
  const sel =
    "[data-spotlight], .glow-card, .spotlight-hero, .bento-cell, .ux-glass-card";
  let targets = [...document.querySelectorAll(sel)];
  if (!targets.length) return;
  let raf = 0,
    ev = null;
  const paint = () => {
    raf = 0;
    if (!ev) return;
    targets.forEach((t) => {
      const r = t.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      t.style.setProperty("--sx", (ev.clientX - r.left).toFixed(1) + "px");
      t.style.setProperty("--sy", (ev.clientY - r.top).toFixed(1) + "px");
    });
  };
  window.addEventListener(
    "pointermove",
    (e) => {
      ev = e;
      if (!raf) raf = requestAnimationFrame(paint);
    },
    { passive: true },
  );
  // pick up elements injected later
  const mo = new MutationObserver(() => {
    targets = [...document.querySelectorAll(sel)];
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

/* ------------------------------------------------------------------ [data-tilt] smooth spring tilt */
function initTilt() {
  if (!finePointer() || reduce()) return;
  document
    .querySelectorAll("[data-tilt]:not([data-tilt-ready])")
    .forEach((el) => {
      el.dataset.tiltReady = "1";
      const max = Number(el.dataset.tilt) || 8;
      let stop = null,
        cur = { x: 0, y: 0 };
      const to = (tx, ty) => {
        stop && stop();
        const fx = cur.x,
          fy = cur.y;
        stop = spring({
          from: 0,
          to: 1,
          stiffness: 200,
          damping: 22,
          onUpdate: (p) => {
            cur = { x: fx + (tx - fx) * p, y: fy + (ty - fy) * p };
            el.style.transform = `perspective(900px) rotateX(${cur.y.toFixed(2)}deg) rotateY(${cur.x.toFixed(2)}deg)`;
          },
        });
      };
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        to(
          ((e.clientX - r.left) / r.width - 0.5) * 2 * max,
          -((e.clientY - r.top) / r.height - 0.5) * 2 * max,
        );
      });
      el.addEventListener("pointerleave", () => to(0, 0));
    });
}

/* ------------------------------------------------------------------ GSAP wireframe timelines */
function initWireframes() {
  const svgs = [
    ...document.querySelectorAll("svg[data-wireframe]:not([data-wf-ready])"),
  ];
  svgs.forEach((svg) => {
    svg.dataset.wfReady = "1";
    const shapes = [
      ...svg.querySelectorAll("path, line, circle, rect, polyline"),
    ];
    shapes.forEach((s) => {
      let len = 400;
      try {
        len = Math.ceil(s.getTotalLength());
      } catch (e) {
        /* non-geometry */
      }
      s.style.setProperty("--len", String(len));
      s.setAttribute("pathLength", s.getAttribute("pathLength") || "1");
    });
    const labels = [...svg.querySelectorAll("text, .wf-node")];
    const play = () => {
      if (reduce()) return;
      if (window.gsap) {
        const g = window.gsap;
        // pathLength=1 normalises every stroke so a single dash tween draws them all
        g.set(shapes, { strokeDasharray: 1, strokeDashoffset: 1 });
        g.set(labels, { opacity: 0, y: 6 });
        const tl = g.timeline({ defaults: { ease: "power3.inOut" } });
        tl.to(shapes, {
          strokeDashoffset: 0,
          duration: 1.1,
          stagger: { each: 0.07, from: "start" },
        })
          .to(
            labels,
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.06,
              ease: "back.out(2)",
            },
            "-=0.6",
          )
          .to(
            svg.querySelectorAll(".wf-pulse"),
            {
              scale: 1.25,
              transformOrigin: "50% 50%",
              repeat: -1,
              yoyo: true,
              duration: 1.2,
              ease: "sine.inOut",
            },
            "<",
          );
      } else {
        svg.classList.add("wf-css-draw"); // pure-CSS fallback defined in aurora-pro.css
      }
    };
    whenVisible([svg], play, 0.2);
  });
}

/* ------------------------------------------------------------------ boot */
function boot() {
  if (isExam()) return;
  initTickers();
  initSplitReveal();
  initSpotlight();
  initTilt();
  initWireframes();
  // late-rendered markup (dynamic sections) gets the same treatment
  let t = 0;
  new MutationObserver((muts) => {
    if (!muts.some((m) => [...m.addedNodes].some((n) => n.nodeType === 1)))
      return; // ignore text-only churn (tickers)
    clearTimeout(t);
    t = setTimeout(() => {
      initTickers();
      initSplitReveal();
      initTilt();
      initWireframes();
    }, 120);
  }).observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();

window.PFX = Object.assign(window.PFX || {}, {
  spring,
  tickNumber,
  scrambleText,
});
