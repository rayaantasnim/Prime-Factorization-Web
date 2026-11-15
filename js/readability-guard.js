/**
 * PrimeFactor.app — Readability Guard
 * ---------------------------------------------------------------------------------------------
 * Fixes the "gloomy" dark-navy bug at the source: navy / slate / deep-blue text colours
 * (#1E3A8A, #2563EB, #0284C7, #475569, #64748B …) were authored for the old light theme and
 * become near-invisible on the navy-black surfaces.
 *
 * The guard measures the WCAG contrast of every visible text node against its real, composited
 * background and — only when it falls below the threshold — lifts that single colour along its own
 * hue (lightness only; hue & saturation untouched) until it passes. The brand palette is therefore
 * preserved: blue stays blue, amber stays amber, they just become legible.
 *
 * Also covers text injected later by JS (badges, medals, ledger rows, toasts) via a throttled
 * MutationObserver. Runs in idle time and in small batches so it never blocks interaction.
 */
const MIN_NORMAL = 4.6;   // WCAG AA (4.5) with a little headroom
const MIN_LARGE = 3.2;
const ATTR = 'data-rg';

const parse = (c) => {
  const m = c && c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
};
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

function backdrop(el) {
  const layers = [];
  for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.backgroundImage && cs.backgroundImage !== 'none') {
      const cols = [...cs.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map((m) => parse(m[0])).filter(Boolean);
      if (cols.length) {
        const n = cols.length;
        const avg = cols.reduce((s, c) => ({ r: s.r + c.r / n, g: s.g + c.g / n, b: s.b + c.b / n, a: s.a + c.a / n }), { r: 0, g: 0, b: 0, a: 0 });
        layers.push({ ...avg, a: Math.min(1, avg.a) });
      }
    }
    const bg = parse(cs.backgroundColor);
    if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= 1) break; }
  }
  let base = { r: 5, g: 11, b: 24, a: 1 }; // site canvas (--ux-bg)
  for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
  return base;
}

function toHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6;
  }
  return { h, s, l };
}
function fromHsl({ h, s, l }) {
  const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return { r: Math.round(f(p, q, h + 1 / 3) * 255), g: Math.round(f(p, q, h) * 255), b: Math.round(f(p, q, h - 1 / 3) * 255) };
}

/** Lift (dark bg) or deepen (light bg) lightness until contrast >= min. Hue is preserved. */
function fixColor(fg, bg, min) {
  const dark = lum(bg) < 0.4;
  const hsl = toHsl(fg);
  // desaturated slate/navy greys read better with a touch of the brand sky tint
  for (let i = 0; i < 40; i++) {
    hsl.l = Math.min(0.97, Math.max(0.05, hsl.l + (dark ? 0.02 : -0.02)));
    const c = fromHsl(hsl);
    if (ratio(c, bg) >= min) return c;
  }
  return dark ? { r: 241, g: 245, b: 249 } : { r: 15, g: 23, b: 42 };
}

function inspect(el) {
  if (el.hasAttribute(ATTR)) return;
  const cs = getComputedStyle(el);
  if (cs.visibility === 'hidden' || cs.display === 'none') return;
  if (cs.webkitTextFillColor && cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)') return; // gradient text
  const fg = parse(cs.color);
  if (!fg || fg.a === 0) return;
  let op = 1;
  for (let e = el; e && e.nodeType === 1; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
  if (op < 0.3) return; // hidden pre-reveal; re-checked when its class changes (reveal) via the observer
  const bg = backdrop(el);
  const eff = over({ ...fg }, bg); // judge the settled (final-opacity) state
  const fs = parseFloat(cs.fontSize), large = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
  const min = large ? MIN_LARGE : MIN_NORMAL;
  el.setAttribute(ATTR, '0');
  if (ratio(eff, bg) >= min) return;
  const fixed = fixColor({ ...fg, a: 1 }, bg, min);
  el.style.setProperty('color', `rgb(${fixed.r}, ${fixed.g}, ${fixed.b})`, 'important');
  el.setAttribute(ATTR, '1');
}

function textElements(root) {
  const out = new Set();
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeValue.trim() && !['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG'].includes(n.parentElement?.tagName?.toUpperCase()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
  });
  let n; while ((n = w.nextNode())) out.add(n.parentElement);
  return [...out];
}

const idle = window.requestIdleCallback || ((f) => setTimeout(() => f({ timeRemaining: () => 8 }), 30));
function scan(root) {
  const list = textElements(root);
  let i = 0;
  const run = (deadline) => {
    while (i < list.length && (deadline.timeRemaining() > 2 || deadline.didTimeout)) inspect(list[i++]);
    if (i < list.length) idle(run, { timeout: 400 });
  };
  idle(run, { timeout: 400 });
}

function boot() {
  if (!document.body) return;
  scan(document.body);
  // second pass after entrance animations settle (opacity-gated elements are skipped above)
  const rescanAll = () => {
    document.querySelectorAll('[' + ATTR + ']').forEach((el) => {
      if (el.getAttribute(ATTR) === '1') el.style.removeProperty('color');
      el.removeAttribute(ATTR);
    });
    scan(document.body);
  };
  setTimeout(rescanAll, 1600);
  let rt = 0;
  ['primefactor_auth_changed', 'primefactor_profile_updated'].forEach((ev) =>
    window.addEventListener(ev, () => { clearTimeout(rt); rt = setTimeout(rescanAll, 350); }));
  let pending = new Set(), t = 0;
  new MutationObserver((muts) => {
    muts.forEach((m) => {
      if (m.type === 'attributes') { if (m.target.nodeType === 1 && m.target !== document.body && m.target.getAttribute('data-rg') === null) pending.add(m.target); return; }
      m.addedNodes.forEach((n) => { if (n.nodeType === 1) pending.add(n); });
    });
    if (!pending.size) return;
    clearTimeout(t);
    t = setTimeout(() => { const nodes = [...pending]; pending = new Set(); nodes.forEach((n) => n.isConnected && scan(n)); }, 160);
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
