/**
 * 12-Tier Competitive Hierarchy Matrix — interactive ELO gauge.
 *
 * A 12-segment ladder (Tier 12 → Tier 1) with a draggable marker, a synced range input, a live
 * readout (tier, ELO-to-next, constraint) and a card grid whose active card lights up in the
 * tier's own colour. Marker motion is a Framer Motion spring (`animate(from, to, {onUpdate})`).
 * A signed-in player's real rating (profile.elo) is picked up from the existing auth events.
 */
import { tween } from './pf-motion-loader.js';
import { fmt } from './pf-math.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const MAX_ELO = 3400;

export function initLadder(motion) {
  const root = document.getElementById('sec-elo-matrix');
  if (!root) return null;
  const $ = (id) => document.getElementById(id);
  const cards = [...root.querySelectorAll('.pf-tier-card')];
  const segs = [...root.querySelectorAll('.pf-seg')];
  if (!cards.length || !segs.length) return null;
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const tiers = cards.map((c) => ({
    n: +c.dataset.tier, lo: +c.dataset.lo, hi: +c.dataset.hi, title: c.dataset.title, color: c.dataset.color,
    note: c.dataset.note, el: c
  })).sort((a, b) => b.n - a.n);               // index 0 = Tier 12 (lowest ELO)

  const valEl = $('pf-elo-val'), nameEl = $('pf-lr-tier-name'), nextEl = $('pf-lr-next'), noteEl = $('pf-lr-note');
  const marker = $('pf-gauge-marker'), track = $('pf-gauge'), range = $('pf-elo-range'), tag = $('pf-lr-tag');
  const tierNum = $('pf-lr-tier-num');
  let elo = 500, shown = 500, tw = null, synced = false;

  const idxOf = (e) => { let i = 0; tiers.forEach((t, k) => { if (e >= t.lo) i = k; }); return i; };
  const posOf = (e) => {
    const i = idxOf(e), t = tiers[i];
    const hi = i === tiers.length - 1 ? MAX_ELO : t.hi + 1;
    return clamp((i + (e - t.lo) / (hi - t.lo)) / tiers.length, 0, 1);
  };
  const eloAt = (pos) => {
    const x = clamp(pos, 0, 0.99999) * tiers.length, i = Math.floor(x), t = tiers[i];
    const hi = i === tiers.length - 1 ? MAX_ELO : t.hi + 1;
    return Math.round(t.lo + (x - i) * (hi - t.lo));
  };

  function paint(v) {
    const i = idxOf(Math.round(v)), t = tiers[i];
    const pos = posOf(v);
    if (marker) marker.style.left = (pos * 100).toFixed(3) + '%';
    if (valEl) valEl.textContent = fmt(v);
    root.style.setProperty('--tc', t.color);
    segs.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-past', k < i); });
    if (range) range.value = Math.round(pos * 1000);
    range && range.setAttribute('aria-valuetext', `${fmt(v)} ELO, Tier ${t.n}, ${t.title}`);
  }
  function describe(e) {
    const i = idxOf(e), t = tiers[i], next = tiers[i + 1];
    cards.forEach((c) => {
      const on = c === t.el;
      c.classList.toggle('is-active', on);
      on ? c.setAttribute('aria-current', 'true') : c.removeAttribute('aria-current');
    });
    root.querySelector('.pf-tier-grid').classList.add('has-active');
    if (nameEl) nameEl.textContent = t.title;
    if (tierNum) tierNum.textContent = String(t.n).padStart(2, '0');
    if (nextEl) nextEl.textContent = next ? `+${fmt(next.lo - e)} ELO to Tier ${next.n} · ${next.title}` : 'Apex tier reached — nothing above';
    if (noteEl) noteEl.textContent = t.note;
    if (tag) tag.textContent = synced ? 'Your rating · synced' : 'Preview · drag to explore';
  }

  function setElo(target, { instant = false } = {}) {
    target = Math.round(clamp(target, 0, MAX_ELO));
    elo = target;
    describe(target);
    if (tw) tw.stop();
    if (instant || reduce) { shown = target; paint(shown); return; }
    const from = shown;
    tw = tween(motion, from, target, { type: 'spring', stiffness: 120, damping: 17 }, (v) => { shown = v; paint(v); });
  }

  // gauge drag
  let dragging = false;
  const fromPointer = (e) => {
    const r = track.getBoundingClientRect();
    setElo(eloAt((e.clientX - r.left) / r.width), { instant: true });
  };
  track.addEventListener('pointerdown', (e) => { dragging = true; track.setPointerCapture && track.setPointerCapture(e.pointerId); synced = false; fromPointer(e); });
  track.addEventListener('pointermove', (e) => { if (dragging) fromPointer(e); });
  const up = () => { dragging = false; };
  track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
  if (range) range.addEventListener('input', () => { synced = false; setElo(eloAt(+range.value / 1000), { instant: true }); });

  cards.forEach((c) => {
    const go = () => {
      synced = false;
      setElo(c.dataset.tier === '1' ? 3000 : Math.round((+c.dataset.lo + +c.dataset.hi) / 2));
      window.dispatchEvent(new CustomEvent('pf:burst', { detail: { x: c.getBoundingClientRect().left + c.offsetWidth / 2, y: c.getBoundingClientRect().top + 30, kind: 'select' } }));
    };
    c.addEventListener('click', go);
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  // real rating from the existing auth events
  const fromProfile = (p) => {
    if (p && typeof p.elo === 'number') { synced = true; setElo(p.elo); }
  };
  window.addEventListener('primefactor_auth_changed', (e) => fromProfile(e.detail && e.detail.profile));
  window.addEventListener('primefactor_profile_updated', (e) => fromProfile(e.detail && e.detail.profile));

  setElo(500, { instant: true });
  // entrance sweep when scrolled into view: 0 → 500
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      if (synced) return;
      shown = 0; paint(0);
      tw = tween(motion, 0, elo, { type: 'spring', stiffness: 40, damping: 13, mass: 1.3 }, (v) => { shown = v; paint(v); });
    }, { threshold: 0.35 });
    io.observe($('pf-gauge'));
  }
  return { setElo };
}
