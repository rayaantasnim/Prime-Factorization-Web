/**
 * PrimeFactor.app — Range Choosing Hub Controller
 * Coordinates the 10 Dynamic Range Selector Cards with 3D Parallax Tilt Tracking via GSAP.
 */

import { initGlobalHeader, renderFooter } from './header.js';
import { setActiveExamParams, getSettings } from './storage.js';
import { playSound } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader();
  renderFooter();
  initTiltCards();
});

function initTiltCards() {
  const cards = document.querySelectorAll('.range-tilt-card');

  cards.forEach(card => {
    // Parallax 3D tilt tracking with GSAP
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      if (window.gsap) {
        window.gsap.to(card, {
          transformPerspective: 900,
          rotateX,
          rotateY,
          scale3d: [1.02, 1.02, 1.02],
          duration: 0.25,
          ease: 'power1.out'
        });
      }
    });

    card.addEventListener('mouseleave', () => {
      if (window.gsap) {
        window.gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          scale3d: [1, 1, 1],
          duration: 0.45,
          ease: 'power2.out'
        });
      }
    });

    // Click handler
    card.addEventListener('click', (e) => {
      e.preventDefault();
      playSound('click');

      const isCustom = card.getAttribute('data-is-custom') === 'true' || 
                       card.getAttribute('href')?.includes('custom.html') || 
                       card.id === 'tier-9-custom-card';
      if (isCustom) {
        window.location.href = './custom.html';
        return;
      }

      const min = Number(card.getAttribute('data-min'));
      const max = Number(card.getAttribute('data-max'));
      const time = Number(card.getAttribute('data-time')) || 180;
      const label = card.getAttribute('data-label') || `${min} - ${max}`;

      setActiveExamParams({
        min,
        max,
        title: label,
        timeLimit: time,
        rules: getSettings()
      });

      const targetUrl = `./contract.html?min=${min}&max=${max}&title=${encodeURIComponent(label)}&time=${time}`;

      if (window.gsap) {
        window.gsap.to(card, {
          scale: 0.96,
          duration: 0.12,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            window.location.href = targetUrl;
          }
        });
      } else {
        window.location.href = targetUrl;
      }
    });
  });
}
