/**
 * PrimeFactor.app — Home Page Interactive Controller
 * Coordinates the 11 Full-Width Sections, Floating GSAP Navigator, Instant Randomizer,
 * Personal Ledger, and Prime Playground with Live Pollard's Rho Decomposition.
 */

import { initGlobalHeader, renderFooter } from './header.js';
import { factorize, toExponentialForm, formatExponentialString, isPrime } from './math-engine.js';
import { getLedger, getSettings, updateSettings, setActiveExamParams } from './storage.js';
import { playSound } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Global Top Dropdown Header and Persistent Footer
  initGlobalHeader();
  renderFooter();

  // 1. Floating Menu & Full-Screen GSAP Navigation Overlay (Home Only)
  initFloatingMenu();

  // 2. Instant Randomizer Slot Machine
  initInstantRandomizer();

  // 3. Local Settings Node Switches
  initLocalSettingsNode();

  // 4. Personal Ledger Progress Metrics
  renderPersonalLedger();

  // 5. Prime Playground Live Pollard's Rho Sandbox
  initPrimePlayground();
});

// Floating Menu Navigation Controller
function initFloatingMenu() {
  const triggerBtn = document.getElementById('floating-menu-trigger');
  const overlay = document.getElementById('fullscreen-nav-overlay');
  const closeBtn = document.getElementById('close-nav-overlay-btn');
  const navCards = document.querySelectorAll('.overlay-nav-card');

  if (!triggerBtn || !overlay) return;

  function openMenu() {
    playSound('click');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (window.gsap) {
      window.gsap.fromTo('.overlay-nav-card', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }
      );
    }
  }

  function closeMenu() {
    playSound('click');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  triggerBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  navCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const targetId = card.getAttribute('data-target');
      if (targetId) {
        closeMenu();
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const headerHeight = document.querySelector('.fixed-header')?.offsetHeight || 68;
          const targetY = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          
          if (window.gsap) {
            window.gsap.to(window, { duration: 0.7, scrollTo: targetY, ease: 'power3.inOut' });
          } else {
            window.scrollTo({ top: targetY, behavior: 'smooth' });
          }
        }
      }
    });
  });
}

// Instant Randomizer Slot Machine Animation
function initInstantRandomizer() {
  const card = document.getElementById('randomizer-trigger-card');
  const slotText = document.getElementById('slot-machine-target');
  if (!card || !slotText) return;

  const ranges = [
    { min: 1, max: 200, label: 'Tier 1: 1 - 200' },
    { min: 201, max: 500, label: 'Tier 2: 201 - 500' },
    { min: 501, max: 1000, label: 'Tier 3: 501 - 1,000' },
    { min: 1001, max: 2000, label: 'Tier 4: 1,001 - 2,000' },
    { min: 2001, max: 5000, label: 'Tier 5: 2,001 - 5,000' },
    { min: 5001, max: 10000, label: 'Tier 6: 5,001 - 10,000' },
    { min: 10001, max: 20000, label: 'Tier 7: 10,001 - 20,000' },
    { min: 20001, max: 35000, label: 'Tier 8: 20,000 - 35,000' },
    { min: 1, max: 50000, label: 'Omega: 1 to Infinity' }
  ];

  let isRolling = false;

  card.addEventListener('click', () => {
    if (isRolling) return;
    isRolling = true;
    playSound('alert');

    let rollCount = 0;
    const maxRolls = 18;
    const chosenIndex = Math.floor(Math.random() * ranges.length);
    const chosenRange = ranges[chosenIndex];

    const interval = setInterval(() => {
      rollCount++;
      const randomIdx = Math.floor(Math.random() * ranges.length);
      slotText.textContent = ranges[randomIdx].label;

      if (window.gsap) {
        window.gsap.fromTo(slotText, 
          { y: -15, opacity: 0.7 },
          { y: 0, opacity: 1, duration: 0.08, ease: 'none' }
        );
      }

      if (rollCount >= maxRolls) {
        clearInterval(interval);
        slotText.textContent = chosenRange.label;
        playSound('correct');

        if (window.gsap) {
          window.gsap.fromTo(slotText,
            { scale: 1.25, color: '#38BDF8' },
            { scale: 1, color: '#FFFFFF', duration: 0.4, ease: 'back.out(2)' }
          );
        }

        setTimeout(() => {
          setActiveExamParams({
            min: chosenRange.min,
            max: chosenRange.max,
            title: chosenRange.label,
            rules: getSettings()
          });
          window.location.href = `./exam.html?min=${chosenRange.min}&max=${chosenRange.max}&title=${encodeURIComponent(chosenRange.label)}`;
        }, 600);
      }
    }, 70);
  });
}

// Local Settings Node Checkbox Toggles
function initLocalSettingsNode() {
  const current = getSettings();

  const bindLocal = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = !!current[key];
    el.addEventListener('change', () => {
      playSound('click');
      updateSettings({ [key]: el.checked });
      // Keep modal in sync
      const modalEl = document.getElementById(`modal-toggle-${id.replace('local-toggle-', '')}`);
      if (modalEl) modalEl.checked = el.checked;
    });
  };

  bindLocal('local-toggle-second-attempt', 'allowSecondAttempt');
  bindLocal('local-toggle-pauses', 'allowPause');
  bindLocal('local-toggle-regen', 'allowRegenerate');
  bindLocal('local-toggle-hints', 'allowHint');
  bindLocal('local-toggle-audio', 'soundEnabled');

  // Listen for modal updates
  window.addEventListener('primefactor_settings_changed', (e) => {
    const updated = e.detail;
    for (const [k, v] of Object.entries(updated)) {
      if (k === 'allowSecondAttempt') {
        const el = document.getElementById('local-toggle-second-attempt');
        if (el) el.checked = v;
      }
      if (k === 'allowPause') {
        const el = document.getElementById('local-toggle-pauses');
        if (el) el.checked = v;
      }
      if (k === 'allowRegenerate') {
        const el = document.getElementById('local-toggle-regen');
        if (el) el.checked = v;
      }
      if (k === 'allowHint') {
        const el = document.getElementById('local-toggle-hints');
        if (el) el.checked = v;
      }
      if (k === 'soundEnabled') {
        const el = document.getElementById('local-toggle-audio');
        if (el) el.checked = v;
      }
    }
  });
}

// Personal Ledger Metrics
function renderPersonalLedger() {
  const ledger = getLedger();

  const examsEl = document.getElementById('ledger-exams-count');
  const highEl = document.getElementById('ledger-high-score');
  const streakEl = document.getElementById('ledger-best-streak');
  const accuracyEl = document.getElementById('ledger-accuracy-rate');
  const accuracyFill = document.getElementById('ledger-accuracy-bar');

  if (examsEl) examsEl.textContent = ledger.examsCompleted;
  if (highEl) highEl.textContent = `${ledger.highScore} pts`;
  if (streakEl) streakEl.textContent = `${ledger.bestStreak} Wins`;

  const accRate = ledger.totalAttempted > 0 
    ? Math.round((ledger.totalSolved / ledger.totalAttempted) * 100) 
    : 100;

  if (accuracyEl) accuracyEl.textContent = `${accRate}%`;
  if (accuracyFill) accuracyFill.style.width = `${accRate}%`;
}

// Prime Playground Live Pollard's Rho Sandbox
function initPrimePlayground() {
  const input = document.getElementById('playground-integer-input');
  const formulaEl = document.getElementById('playground-formula-output');
  const bubblesWrap = document.getElementById('playground-bubbles-wrap');
  const tagEl = document.getElementById('playground-verdict-tag');

  if (!input || !formulaEl || !bubblesWrap || !tagEl) return;

  function executeDecomposition() {
    const rawVal = input.value.trim();
    if (!rawVal) {
      formulaEl.textContent = 'Enter any integer above 1';
      bubblesWrap.innerHTML = '';
      tagEl.textContent = 'Awaiting input...';
      return;
    }

    const n = Number(rawVal);
    if (isNaN(n) || !Number.isInteger(n) || n <= 1) {
      formulaEl.textContent = 'Invalid Integer';
      bubblesWrap.innerHTML = '';
      tagEl.textContent = 'Please enter an integer >= 2';
      return;
    }

    if (n > 10000000) {
      formulaEl.textContent = 'Input exceeds engine limit';
      bubblesWrap.innerHTML = '';
      tagEl.textContent = 'Maximum supported casual sandbox range is 10,000,000';
      return;
    }

    // Run Pollard's Rho Factorization
    const t0 = performance.now();
    const factors = factorize(n);
    const elapsed = (performance.now() - t0).toFixed(2);

    if (isPrime(n)) {
      formulaEl.textContent = `${n} is Prime!`;
      bubblesWrap.innerHTML = `<span class="factor-bubble">${n}</span>`;
      tagEl.textContent = `Deterministic Miller-Rabin Primality Verified (${elapsed}ms)`;
      return;
    }

    const expForm = toExponentialForm(factors);
    const formatted = formatExponentialString(expForm);

    formulaEl.textContent = `${n} = ${formatted}`;

    // Render interactive factor bubbles
    bubblesWrap.innerHTML = factors.map((f, i) => 
      `<span class="factor-bubble" style="animation-delay: ${i * 0.04}s">${f}</span>`
    ).join('');

    tagEl.textContent = `Pollard's Rho Complete in ${elapsed}ms · ${factors.length} total prime factors (${expForm.length} distinct)`;
  }

  input.addEventListener('input', executeDecomposition);
  // Initial run with sample 1260
  executeDecomposition();
}
