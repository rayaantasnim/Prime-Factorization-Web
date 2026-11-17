/**
 * PrimeFactor.app — pf-enhance.js
 * Tiny, dependency-free progressive enhancement (≈1 KB gz). Everything here is optional:
 * if it fails, the page still works. No layout reads in hot paths; pointer work is rAF-throttled.
 */
(function () {
  'use strict';
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  ready(function () {
    // 1) Range Portal: cursor-follow spotlight (desktop pointers only)
    if (fine && !reduce) {
      var grid = document.querySelector('.rp-grid');
      if (grid) {
        var raf = 0, last = null;
        grid.addEventListener('pointermove', function (e) {
          last = e;
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = 0;
            var card = last.target.closest && last.target.closest('.rp-card');
            if (!card) return;
            var r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (last.clientX - r.left) + 'px');
            card.style.setProperty('--my', (last.clientY - r.top) + 'px');
          });
        }, { passive: true });
      }
    }

    // 2) Prime Playground: quick-pick chips + a flash when the result changes
    var input = document.getElementById('playground-integer-input');
    var formula = document.getElementById('playground-formula-output');
    document.querySelectorAll('.pg-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (!input) return;
        input.value = chip.getAttribute('data-pg');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    if (formula && !reduce && 'MutationObserver' in window) {
      new MutationObserver(function () {
        formula.classList.remove('pg-flash');
        void formula.offsetWidth; // restart animation
        formula.classList.add('pg-flash');
      }).observe(formula, { childList: true, characterData: true, subtree: true });
    }

    // 3) Pause infinite decorative animations while their section is off-screen (saves CPU/battery)
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          en.target.style.setProperty('--pfe-play', en.isIntersecting ? 'running' : 'paused');
          en.target.classList.toggle('pfe-offscreen', !en.isIntersecting);
        });
      }, { rootMargin: '120px 0px' });
      ['sec-randomizer', 'sec-ranges', 'sec-settings', 'playground-section', 'sec-v4-announcement'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) io.observe(el);
      });
    }
  });
})();
