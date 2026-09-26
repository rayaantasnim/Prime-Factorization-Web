/**
 * PrimeFactor.app — Dedicated Platform Services & Facilities Controller
 * Coordinates the 8 enterprise-grade facilities, tool cards, and interactive jump actions.
 */

import { initGlobalHeader, renderFooter } from './header.js';
import { playSound } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader();
  renderFooter();
  initServiceCards();
});

function initServiceCards() {
  const cards = document.querySelectorAll('.service-facility-card');

  cards.forEach(card => {
    // Spatial 3D hover tracking with GSAP
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      if (window.gsap) {
        window.gsap.to(card, {
          transformPerspective: 800,
          rotateX,
          rotateY,
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
          duration: 0.4,
          ease: 'power2.out'
        });
      }
    });

    const linkBtn = card.querySelector('.service-card-action');
    if (linkBtn) {
      linkBtn.addEventListener('click', () => {
        playSound('click');
      });
    }
  });
}
