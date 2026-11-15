/**
 * PrimeFactor.app — index.html visual layer entry.
 * WebGL (hero orrery, Observatory, digit sparks) + Framer Motion (reveals, springs, HUD) + ladder.
 * Each piece initialises independently; a failure in one never affects the rest of the page.
 */
import { initMotionLayer } from './pf-motion.js';
import { initOrrery } from './pf-orrery.js';
import { initSparks } from './pf-sparks.js';
import { initObservatory } from './pf-observatory.js';
import { initLadder } from './pf-ladder.js';

const attempt = (name, fn) => { try { return fn(); } catch (e) { console.debug(`[index-fx] ${name} failed:`, e); return null; } };

async function boot() {
  const motionP = initMotionLayer();            // starts loading Motion immediately
  attempt('orrery', () => initOrrery(document.getElementById('sec-hero')));
  attempt('sparks', initSparks);
  const m = await motionP.catch(() => null);
  attempt('observatory', () => initObservatory(m));
  attempt('ladder', () => initLadder(m));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
