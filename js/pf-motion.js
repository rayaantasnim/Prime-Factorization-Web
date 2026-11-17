/**
 * PrimeFactor.app — Framer Motion layer for index.html.
 *
 * Uses the real `motion` API: animate(), inView(), scroll(), hover-less pointer springs, press(),
 * stagger-style delays. Transforms on managed cards are written through CSS custom properties
 * (--pf-x/y/rx/ry/s) because ux-core.css ships `!important` hover transforms that would otherwise
 * override any inline transform; the [data-pf-fx] rule in math-ui.css composes them.
 *
 * Nothing is hidden until Motion has loaded, and a watchdog reveals anything still hidden.
 */
import { getMotion, tween } from './pf-motion-loader.js';
import { factorText, fmt } from './pf-math.js';

const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const finePointer = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const REVEAL_SEL = [
  '.home-section:not(.hero-gateway) .section-head', '.step-card', '.rank-card', '.contract-card',
  '.strategy-card', '.ledger-box', '.counter-box', '.randomizer-card', '.range-tilt-card',
  '.pf-tier-card', '.pf-stat', '.obs-shell', '.pf-ladder-console', '.playground-container',
  '.audit-stack-card', '.v3-triumph-stage'
].join(',');
const TILT_SEL = '.step-card, .rank-card, .contract-card, .strategy-card, .pf-tier-card, .pf-stat, .ledger-box, .counter-box, .audit-stack-card';

// ---------------------------------------------------------------------------------------------
function setVars(el, v) {
  const s = el.style;
  if ('x' in v) s.setProperty('--pf-x', v.x + 'px');
  if ('y' in v) s.setProperty('--pf-y', v.y + 'px');
  if ('rx' in v) s.setProperty('--pf-rx', v.rx + 'deg');
  if ('ry' in v) s.setProperty('--pf-ry', v.ry + 'deg');
  if ('s' in v) s.setProperty('--pf-s', v.s);
}

function initReveals(m) {
  if (reduce) return;
  const { inView } = m;
  const hidden = new Set();
  $$(REVEAL_SEL).forEach((el) => {
    if (el.closest('.hero-gateway') || el.closest('#settings-modal-slot')) return;
    el.setAttribute('data-pf-fx', '');
    // already on screen at load → leave to the page-load choreography
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.5 && r.bottom > 0) return;
    el.style.opacity = '0';
    setVars(el, { y: 44, s: 0.965 });
    el.dataset.pfHidden = String(performance.now());
    hidden.add(el);
    const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.hasAttribute('data-pf-fx')) : [el];
    const delay = (sibs.indexOf(el) % 4) * 0.08;
    let done = false;
    const run = () => {
      if (done) return;
      done = true; hidden.delete(el); delete el.dataset.pfHidden;
      tween(m, 0, 1, { type: 'spring', stiffness: 130, damping: 20, delay }, (p) => {
        el.style.opacity = String(clamp(p * 1.5, 0, 1));
        setVars(el, { y: 44 * (1 - p), s: 0.965 + 0.035 * p });
        el.style.filter = p < 0.98 ? `blur(${Math.max(0, (1 - p) * 8).toFixed(1)}px)` : '';
      });
    };
    try { inView(el, () => { run(); }, { amount: 0.12 }); } catch (e) { run(); }
    el.__pfRun = run;
  });
  // watchdog: anything on screen for >1.4s but still hidden is forced in
  setInterval(() => {
    hidden.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0 && performance.now() - parseFloat(el.dataset.pfHidden) > 1400) el.__pfRun && el.__pfRun();
    });
  }, 900);
}

function initTilt(m) {
  if (reduce || !finePointer) return;
  $$(TILT_SEL).forEach((el) => {
    if (el.closest('.hero-gateway')) return;
    el.setAttribute('data-pf-fx', '');
    const st = { rx: 0, ry: 0, y: 0, s: 1 };
    let tw = null, raf = 0, ev = null, lastT = 0;
    const go = (to, stiff = 230) => {
      const from = { ...st };
      if (tw) tw.stop();
      tw = tween(m, 0, 1, { type: 'spring', stiffness: stiff, damping: 21 }, (p) => {
        for (const k in st) st[k] = from[k] + (to[k] - from[k]) * p;
        setVars(el, st);
      });
    };
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      ev = e;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      el.style.setProperty('--sy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      if (raf || performance.now() - lastT < 40) return;
      raf = requestAnimationFrame(() => {
        raf = 0; lastT = performance.now();
        const nx = (ev.clientX - r.left) / r.width - 0.5, ny = (ev.clientY - r.top) / r.height - 0.5;
        go({ rx: -ny * 8, ry: nx * 10, y: -5, s: 1.012 });
      });
    });
    el.addEventListener('pointerleave', () => { ev = null; go({ rx: 0, ry: 0, y: 0, s: 1 }, 170); });
  });
}

function initCounters(m) {
  $$('[data-count]').forEach((el) => {
    const to = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const final = fmt(to) + suffix;
    if (reduce) { el.textContent = final; return; }
    el.textContent = '0' + suffix;
    let started = false;
    const run = () => {
      if (started) return; started = true;
      tween(m, 0, to, { duration: 1.8, ease: 'easeOut' }, (v) => { el.textContent = fmt(v) + suffix; });
    };
    try { m.inView(el, () => { run(); }, { amount: 0.6 }); } catch (e) { run(); }
    setTimeout(() => { if (!started) { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) run(); } }, 2500);
  });
}

function initDecode(m) {
  if (reduce) return;
  const GL = '0123456789·∏Σφπ';
  $$('.section-kicker').forEach((el) => {
    const text = el.textContent;
    if (!text.trim() || el.children.length) return;
    el.setAttribute('aria-label', text.trim());
    let done = false;
    const run = () => {
      if (done) return; done = true;
      tween(m, 0, 1, { duration: 0.9, ease: 'linear' }, (p) => {
        const n = Math.floor(p * text.length);
        let out = text.slice(0, n);
        for (let i = n; i < text.length; i++) out += /\s/.test(text[i]) ? text[i] : GL[(Math.random() * GL.length) | 0];
        el.textContent = p >= 1 ? text : out;
      });
    };
    try { m.inView(el, () => { run(); }, { amount: 0.9 }); } catch (e) { run(); }
  });
}

function initParallax(m) {
  if (reduce || !m.scroll) return;
  $$('.home-section:not(.hero-gateway) .section-bg-image').forEach((img) => {
    const sec = img.closest('.home-section');
    img.style.scale = '1.14';
    try {
      m.scroll((p) => { img.style.translate = `0 ${((p - 0.5) * -46).toFixed(1)}px`; }, { target: sec, offset: ['start end', 'end start'] });
    } catch (e) { /* static is fine */ }
  });
}

function initPress(m) {
  if (reduce || !m.press) return;
  $$('.hero-btn-primary, .hero-btn-secondary, .hero-btn-auth, .mini-prime-pill, .mini-submit-btn, .obs-chip, .obs-btn, .pf-tier-card').forEach((el) => {
    try {
      m.press(el, () => {
        m.animate(el, { scale: 0.96 }, { duration: 0.12 });
        return () => m.animate(el, { scale: 1 }, { type: 'spring', stiffness: 520, damping: 16 });
      });
    } catch (e) { /* noop */ }
  });
}

function initHeroOrnaments(m) {
  const hero = document.getElementById('sec-hero');
  if (!hero || reduce) return;
  $$('.pf-eq', hero).forEach((el, i) => {
    m.animate(el, { y: [0, -12 - i * 2, 0], rotate: [0, i % 2 ? 1.6 : -1.6, 0], opacity: [0.5, 0.9, 0.5] },
      { duration: 7 + i * 1.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 });
  });
  const path = hero.querySelector('.pf-underline path');
  if (path) {
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1';
    path.style.strokeDashoffset = '1';
    m.animate(path, { strokeDashoffset: [1, 0] }, { duration: 1.4, delay: 1.9, ease: 'easeInOut' });
  }
  // cursor-driven parallax for ornaments
  if (finePointer) {
    const eqs = $$('.pf-eq', hero);
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      eqs.forEach((el, i) => { el.style.translate = `${(nx * -26 * (1 + i * 0.25)).toFixed(1)}px ${(ny * -18 * (1 + i * 0.25)).toFixed(1)}px`; });
    }, { passive: true });
  }
}

function initTape() {
  const track = document.querySelector('.pf-tape-track');
  if (!track || reduce || !track.getAnimations) return;
  let lastY = scrollY, rate = 1;
  const tick = () => {
    const v = Math.abs(scrollY - lastY); lastY = scrollY;
    const target = 1 + Math.min(7, v * 0.35);
    rate += (target - rate) * 0.12;
    const a = track.getAnimations()[0];
    if (a) a.updatePlaybackRate(rate);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ---- prime ruler HUD --------------------------------------------------------------------------
const SECTION_LABELS = {
  'sec-hero': 'Arena', 'sec-how-it-works': 'Method', 'sec-observatory': 'Observatory', 'sec-verdict': 'Verdicts',
  'sec-elo-matrix': 'Ladder', 'sec-contract': 'Scoring', 'sec-randomizer': 'Randomizer', 'sec-ranges': 'Ranges',
  'sec-settings': 'Profile', 'sec-ledger': 'Ledger', 'playground-section': 'Playground', 'sec-strategy': 'Strategy',
  'sec-authenticity': 'Integrity'
};
function initRuler(m) {
  const secs = $$('main > section[id]').filter((s) => SECTION_LABELS[s.id]);
  if (!secs.length) return;
  const el = document.createElement('aside');
  el.id = 'pf-ruler';
  el.setAttribute('aria-label', 'Page position');
  el.innerHTML = '<div class="pf-ruler-read" aria-hidden="true"><b id="pf-ruler-n">2</b><span id="pf-ruler-f">is prime</span></div><div class="pf-ruler-track"><i class="pf-ruler-fill"></i></div>';
  const track = el.querySelector('.pf-ruler-track');
  const fill = el.querySelector('.pf-ruler-fill');
  const dots = secs.map((s) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pf-ruler-dot';
    b.innerHTML = `<span>${SECTION_LABELS[s.id]}</span>`;
    b.setAttribute('aria-label', `Jump to ${SECTION_LABELS[s.id]}`);
    b.addEventListener('click', () => s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }));
    track.appendChild(b);
    return b;
  });
  document.body.appendChild(el);
  const nEl = el.querySelector('#pf-ruler-n'), fEl = el.querySelector('#pf-ruler-f');
  let tops = [];
  const layout = () => {
    const total = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    tops = secs.map((s) => clamp((s.getBoundingClientRect().top + scrollY - 80) / total, 0, 1));
    dots.forEach((d, i) => { d.style.top = (tops[i] * 100).toFixed(2) + '%'; });
  };
  layout();
  addEventListener('resize', layout);
  setTimeout(layout, 1200); setTimeout(layout, 3500);
  let shown = 0;
  const update = (p) => {
    p = clamp(p, 0, 1);
    fill.style.transform = `scaleY(${p})`;
    const n = 2 + Math.round(p * 9997);
    if (n !== shown) { shown = n; nEl.textContent = fmt(n); fEl.textContent = factorText(n); }
    let act = 0;
    tops.forEach((t, i) => { if (p >= t - 0.004) act = i; });
    dots.forEach((d, i) => { d.classList.toggle('is-on', i === act); d.classList.toggle('is-past', i < act); });
    el.classList.toggle('is-hidden', p < 0.02 && scrollY < 120);
  };
  if (m && m.scroll) { try { m.scroll(update); } catch (e) { addEventListener('scroll', () => update(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)), { passive: true }); } }
  else addEventListener('scroll', () => update(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)), { passive: true });
  update(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
}

// ---- mini challenge reactions -----------------------------------------------------------------
function initMiniReactions(m) {
  const banner = document.getElementById('mini-verdict-banner');
  const card = document.getElementById('sec-mini-challenge');
  if (!banner || !card) return;
  let lastCls = '';
  new MutationObserver(() => {
    const cls = banner.className;
    if (cls === lastCls) return;
    lastCls = cls;
    const r = banner.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + Math.min(r.height / 2, 40);
    if (cls.includes('mini-verdict-success')) {
      window.dispatchEvent(new CustomEvent('pf:burst', { detail: { x: cx, y: cy, kind: 'win' } }));
      if (!reduce && m) m.animate(banner, { scale: [0.92, 1], opacity: [0, 1] }, { type: 'spring', stiffness: 300, damping: 18 });
    } else if (cls.includes('mini-verdict-error')) {
      window.dispatchEvent(new CustomEvent('pf:burst', { detail: { x: cx, y: cy, kind: 'lose' } }));
      if (!reduce && m) m.animate(card, { x: [0, -9, 8, -5, 3, 0] }, { duration: 0.45 });
    }
  }).observe(banner, { attributes: true, attributeFilter: ['class'] });
}

// ---- curtain ----------------------------------------------------------------------------------
async function runCurtain(m) {
  const root = document.documentElement;
  const cur = document.getElementById('pf-curtain');
  const open = () => { try { window.__pfOpenGate && window.__pfOpenGate(); } catch (e) { /* noop */ } };
  const finish = () => { root.classList.remove('pf-curtain-on'); if (cur) cur.remove(); open(); };
  if (!cur || !root.classList.contains('pf-curtain-on')) { open(); return; }
  try { sessionStorage.setItem('pf-curtain', '1'); } catch (e) { /* noop */ }
  const nEl = cur.querySelector('.pf-curtain-n');
  const fEl = cur.querySelector('.pf-curtain-f');
  const bar = cur.querySelector('.pf-curtain-bar i');
  const target = 2520;
  await new Promise((res) => {
    tween(m, 2, target, { duration: 0.65, ease: 'easeInOut', onComplete: res }, (v) => {
      const n = Math.round(v);
      if (nEl) nEl.textContent = fmt(n);
      if (fEl) fEl.textContent = factorText(n);
      if (bar) bar.style.transform = `scaleX(${(v - 2) / (target - 2)})`;
    });
    setTimeout(res, 1000);
  });
  if (m) {
    const top = cur.querySelector('.pf-curtain-half.is-top'), bot = cur.querySelector('.pf-curtain-half.is-bot'), mid = cur.querySelector('.pf-curtain-core');
    m.animate(mid, { opacity: 0, scale: 1.12 }, { duration: 0.2 });
    open();
    await Promise.all([
      m.animate(top, { y: ['0%', '-101%'] }, { duration: 0.55, ease: [0.76, 0, 0.24, 1], delay: 0.04 }).finished,
      m.animate(bot, { y: ['0%', '101%'] }, { duration: 0.55, ease: [0.76, 0, 0.24, 1], delay: 0.04 }).finished
    ]).catch(() => {});
  }
  finish();
}

// ---------------------------------------------------------------------------------------------
export async function initMotionLayer() {
  const m = await getMotion();
  const root = document.documentElement;
  if (!m) {
    // no Motion: still lift the curtain and show the stats
    runCurtain(null).catch(() => {});
    $$('[data-count]').forEach((el) => { el.textContent = fmt(parseFloat(el.dataset.count)) + (el.dataset.suffix || ''); });
    initRuler(null);
    return null;
  }
  root.classList.add('fx-motion');
  const safe = (fn) => { try { fn(m); } catch (e) { console.debug('[pf-motion]', fn.name, e); } };
  runCurtain(m).catch(() => { root.classList.remove('pf-curtain-on'); });
  [initReveals, initTilt, initCounters, initDecode, initParallax, initPress, initHeroOrnaments, initMiniReactions].forEach(safe);
  safe(initTape);
  safe(initRuler);
  return m;
}
