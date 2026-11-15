/**
 * PrimeFactor.app — Range Cards 3D Engine
 * ---------------------------------------------------------------------------------------------
 * Cursor-controlled three-dimensional tilt + glow for the 10 division cards.
 *
 *  • Spring physics (Framer-Motion-style stiffness / damping integrator) drives rotateX / rotateY /
 *    lift, so cards feel weighted and settle without overshoot jitter.
 *  • One shared requestAnimationFrame loop for all cards; it goes to sleep as soon as every spring
 *    has settled (zero idle CPU).
 *  • The pointer position is projected onto EVERY card (not just the hovered one) which powers the
 *    Aceternity-style "proximity" glow ring + spotlight that follows the cursor across the grid.
 *  • Touch: press-and-drag tilts a card; no hover required. Keyboard focus lights the glow.
 *  • prefers-reduced-motion: tilt is disabled, static glow is kept.
 *
 * All state is written to CSS custom properties (--rx --ry --lift --mx --my --glow) consumed by
 * css/ranges-3d.css, so layout/paint stays on the compositor.
 */

const MAX_TILT = 13;          // degrees
const LIFT_PX = 18;           // translateZ on hover
const SPRING = { k: 190, c: 20, mass: 1 }; // stiffness / damping — slightly under-critical (fluid)
const EPS = 0.01;

const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function makeSpring(v = 0) {
  return { x: v, v: 0, target: v };
}

export function init3DCards(cards, container) {
  if (!cards || !cards.length) return () => {};
  const grid = container || cards[0].parentElement;
  const reduce = reduceMotion();
  grid.classList.add('ranges-3d');

  const states = new Map();
  cards.forEach((card, i) => {
    card.style.setProperty('--card-i', String(i));
    states.set(card, {
      rx: makeSpring(), ry: makeSpring(), lift: makeSpring(), glow: makeSpring(),
      mx: 50, my: 50, active: false, rect: null, pointerId: null
    });
  });

  let raf = 0;
  let last = 0;

  function step(now) {
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
    last = now;
    let awake = false;
    states.forEach((st, card) => {
      for (const key of ['rx', 'ry', 'lift', 'glow']) {
        const s = st[key];
        const force = -SPRING.k * (s.x - s.target) - SPRING.c * s.v;
        s.v += (force / SPRING.mass) * dt;
        s.x += s.v * dt;
        if (Math.abs(s.v) > EPS || Math.abs(s.x - s.target) > EPS) awake = true;
        else { s.x = s.target; s.v = 0; }
      }
      card.style.setProperty('--rx', st.rx.x.toFixed(3) + 'deg');
      card.style.setProperty('--ry', st.ry.x.toFixed(3) + 'deg');
      card.style.setProperty('--lift', st.lift.x.toFixed(2) + 'px');
      card.style.setProperty('--glow', Math.max(0, st.glow.x).toFixed(3));
      // normalised tilt (-1..1) drives image parallax + the moving floor shadow
      card.style.setProperty('--px', (st.ry.x / MAX_TILT).toFixed(3));
      card.style.setProperty('--py', (-st.rx.x / MAX_TILT).toFixed(3));
      card.style.setProperty('--shx', (-st.ry.x * 1.5).toFixed(1) + 'px');
      card.style.setProperty('--shy', (st.rx.x * 1.5 + 14).toFixed(1) + 'px');
    });
    raf = awake ? requestAnimationFrame(step) : 0;
  }
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };

  function measure() {
    states.forEach((st, card) => { st.rect = card.getBoundingClientRect(); });
  }

  // --- grid-level pointer tracking: proximity glow for all cards, tilt for the one under the cursor
  function onGridMove(e) {
    if (e.pointerType === 'touch' && !states.get(e.target.closest?.('.range-tilt-card'))?.active) return;
    states.forEach((st, card) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x.toFixed(1) + 'px');
      card.style.setProperty('--my', y.toFixed(1) + 'px');
      st.mx = x; st.my = y;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      // proximity falloff for the glow ring on neighbours (0..0.55) / full on the hovered card
      const dx = Math.max(0, -x, x - r.width), dy = Math.max(0, -y, y - r.height);
      const dist = Math.hypot(dx, dy);
      const prox = inside ? 1 : Math.max(0, 1 - dist / 260) * 0.55;
      st.glow.target = prox;
      if (inside && !reduce) {
        const px = x / r.width - 0.5, py = y / r.height - 0.5;
        st.ry.target = px * 2 * MAX_TILT;
        st.rx.target = -py * 2 * MAX_TILT;
        st.lift.target = LIFT_PX;
        card.classList.add('is-hot');
      } else {
        st.rx.target = 0; st.ry.target = 0; st.lift.target = 0;
        card.classList.remove('is-hot');
      }
    });
    wake();
  }

  function onLeave() {
    states.forEach((st, card) => {
      st.rx.target = 0; st.ry.target = 0; st.lift.target = 0; st.glow.target = 0;
      card.classList.remove('is-hot');
    });
    wake();
  }

  // --- touch: tilt while a finger is down on a card
  function onTouchStart(e) {
    const card = e.target.closest?.('.range-tilt-card');
    if (!card || e.pointerType !== 'touch') return;
    states.get(card).active = true;
  }
  function onTouchEnd() {
    states.forEach((st) => { st.active = false; });
    onLeave();
  }

  // --- keyboard focus lights the glow ring (accessibility parity with hover)
  function onFocusIn(e) {
    const card = e.target.closest?.('.range-tilt-card');
    if (!card) return;
    const st = states.get(card);
    st.glow.target = 1; st.lift.target = LIFT_PX * 0.6;
    wake();
  }
  function onFocusOut(e) {
    const card = e.target.closest?.('.range-tilt-card');
    if (!card) return;
    const st = states.get(card);
    st.glow.target = 0; st.lift.target = 0;
    wake();
  }

  grid.addEventListener('pointermove', onGridMove, { passive: true });
  grid.addEventListener('pointerleave', onLeave, { passive: true });
  grid.addEventListener('pointerdown', onTouchStart, { passive: true });
  window.addEventListener('pointerup', onTouchEnd, { passive: true });
  window.addEventListener('pointercancel', onTouchEnd, { passive: true });
  grid.addEventListener('focusin', onFocusIn);
  grid.addEventListener('focusout', onFocusOut);
  window.addEventListener('scroll', measure, { passive: true });

  // staggered spring entrance (cards rise in with a delay driven by --card-i)
  if (!reduce) {
    cards.forEach((card, i) => {
      card.animate(
        [{ opacity: 0, transform: 'translate3d(0, 34px, -60px) scale(0.96)' }, { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }],
        { duration: 760, delay: 60 * i, easing: 'cubic-bezier(0.22, 1.2, 0.36, 1)', fill: 'backwards' }
      );
    });
  }

  return function destroy() {
    grid.removeEventListener('pointermove', onGridMove);
    grid.removeEventListener('pointerleave', onLeave);
    grid.removeEventListener('pointerdown', onTouchStart);
    window.removeEventListener('pointerup', onTouchEnd);
    window.removeEventListener('pointercancel', onTouchEnd);
    grid.removeEventListener('focusin', onFocusIn);
    grid.removeEventListener('focusout', onFocusOut);
    window.removeEventListener('scroll', measure);
    if (raf) cancelAnimationFrame(raf);
  };
}
