/**
 * Loads Framer Motion (the `motion` package, already a dependency in package.json) exactly once.
 *
 *  1. `import('motion')`  — resolved & bundled by Vite for dev / production builds.
 *  2. jsDelivr ESM build  — fallback when the page is opened without a bundler (static hosting).
 *  3. null                — every consumer has a CSS / rAF fallback, nothing is ever left hidden.
 */
const MOTION_CDN = "https://cdn.jsdelivr.net/npm/motion@12.23.24/+esm";

let pending = null;

export function getMotion() {
  if (pending) return pending;
  pending = (async () => {
    let mod = null;
    try {
      mod = await import("motion");
    } catch (e) {
      /* not bundled — try the CDN */
    }
    if (!mod || !mod.animate) {
      try {
        mod = await import(/* @vite-ignore */ MOTION_CDN);
      } catch (e) {
        mod = null;
      }
    }
    if (mod && mod.animate) {
      window.__pfMotion = mod;
      document.documentElement.classList.add("fx-motion");
      return mod;
    }
    return null;
  })();
  return pending;
}

/**
 * Tween a number with Framer Motion's `animate(from, to, { onUpdate })`, or a rAF ease when
 * Motion is unavailable. Returns { stop() }.
 */
export function tween(motion, from, to, opts, onUpdate) {
  const duration = opts.duration ?? 0.8;
  if (motion && motion.animate) {
    const o = { onUpdate, onComplete: opts.onComplete };
    if (opts.type === "spring")
      Object.assign(o, {
        type: "spring",
        stiffness: opts.stiffness ?? 170,
        damping: opts.damping ?? 20,
        mass: opts.mass ?? 1,
      });
    else Object.assign(o, { duration, ease: opts.ease ?? "easeOut" });
    if (opts.delay) o.delay = opts.delay;
    const c = motion.animate(from, to, o);
    return { stop: () => c && c.stop && c.stop() };
  }
  let raf = 0,
    t0 = 0,
    dead = false;
  const step = (now) => {
    if (dead) return;
    if (!t0) t0 = now + (opts.delay || 0) * 1000;
    const p = Math.min(1, Math.max(0, (now - t0) / (duration * 1000)));
    const e = 1 - Math.pow(1 - p, 3);
    onUpdate(from + (to - from) * e);
    if (p < 1) raf = requestAnimationFrame(step);
    else if (opts.onComplete) opts.onComplete();
  };
  raf = requestAnimationFrame(step);
  return {
    stop: () => {
      dead = true;
      cancelAnimationFrame(raf);
    },
  };
}
