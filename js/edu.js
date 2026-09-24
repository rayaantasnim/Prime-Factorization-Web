/**
 * PrimeFactor.app — Dedicated Number Theory Training Arena (edu.html) Controller
 * Zero-Timer Calculation Sandbox for:
 * Strategy 01: Parity & Modulo 5 Isolation
 * Strategy 02: Sum of Digits & Modulo 9
 * Strategy 03: Difference of Squares (a² - b²)
 */

import { initGlobalHeader, renderFooter } from './header.js';
import { factorize, toExponentialForm, formatExponentialString, isPrime } from './math-engine.js';
import { playSound } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader();
  renderFooter();
  initEduSandbox();
});

function initEduSandbox() {
  const stratBtns = document.querySelectorAll('.sandbox-strat-btn');
  const inputEl = document.getElementById('sandbox-num-input');
  const calcBtn = document.getElementById('sandbox-calc-btn');
  const stepsWrap = document.getElementById('sandbox-steps-output');
  const summaryEl = document.getElementById('sandbox-summary-text');

  let activeStrategy = 'strat1'; // 'strat1' | 'strat2' | 'strat3'

  stratBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      stratBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStrategy = btn.getAttribute('data-strat');
      runStrategyBreakdown();
    });
  });

  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      playSound('click');
      runStrategyBreakdown();
    });
  }

  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        playSound('click');
        runStrategyBreakdown();
      }
    });
  }

  function runStrategyBreakdown() {
    const rawVal = inputEl ? inputEl.value.trim() : '';
    const n = Number(rawVal);

    if (isNaN(n) || !Number.isInteger(n) || n < 2) {
      if (summaryEl) summaryEl.textContent = 'Please enter an integer greater than or equal to 2.';
      if (stepsWrap) stepsWrap.innerHTML = '<div class="sandbox-step-item text-muted">Awaiting valid positive integer entry...</div>';
      return;
    }

    if (n > 1000000) {
      if (summaryEl) summaryEl.textContent = 'Sandbox supports integers up to 1,000,000 for instantaneous breakdown.';
      return;
    }

    const fullFactors = factorize(n);
    const expForm = toExponentialForm(fullFactors);
    const formulaStr = formatExponentialString(expForm);

    if (activeStrategy === 'strat1') {
      executeStrategy1(n, formulaStr);
    } else if (activeStrategy === 'strat2') {
      executeStrategy2(n, formulaStr);
    } else {
      executeStrategy3(n, formulaStr);
    }
  }

  // Strategy 1: Parity & Modulo 5 Isolation
  function executeStrategy1(n, fullFormula) {
    let temp = n;
    let twoCount = 0;
    let fiveCount = 0;
    const steps = [];

    const lastDigit = temp % 10;
    steps.push({
      label: 'Initial Inspection',
      desc: `Evaluating last digit of ${n}: Ends in <strong>${lastDigit}</strong>.`
    });

    if (temp % 2 === 0) {
      while (temp % 2 === 0) {
        twoCount++;
        const next = temp / 2;
        steps.push({
          label: `Extract 2^${twoCount}`,
          desc: `${temp} is even &rarr; Divided by 2 = <strong>${next}</strong>`
        });
        temp = next;
      }
    } else {
      steps.push({
        label: 'Parity Check',
        desc: `${n} is odd &rarr; No factors of 2.`
      });
    }

    if (temp % 5 === 0) {
      while (temp % 5 === 0) {
        fiveCount++;
        const next = temp / 5;
        steps.push({
          label: `Extract 5^${fiveCount}`,
          desc: `${temp} ends in 5 or 0 &rarr; Divided by 5 = <strong>${next}</strong>`
        });
        temp = next;
      }
    } else {
      steps.push({
        label: 'Mod 5 Check',
        desc: `Remaining quotient ${temp} does not end in 0 or 5 &rarr; Fully stripped of 2 and 5.`
      });
    }

    steps.push({
      label: 'Residual Quotient',
      desc: `Stripped Magnitude: <strong>${temp}</strong>. Full decomposition: <span class="font-math font-bold text-accent">${n} = ${fullFormula}</span>.`
    });

    renderSteps('Strategy 01: Parity & Modulo 5 Isolation', steps);
  }

  // Strategy 2: Sum of Digits & Modulo 9
  function executeStrategy2(n, fullFormula) {
    const digits = String(n).split('').map(Number);
    const sum = digits.reduce((a, b) => a + b, 0);
    const steps = [];

    steps.push({
      label: 'Digital Sum',
      desc: `Summing digits of ${n}: <code>${digits.join(' + ')} = <strong>${sum}</strong></code>.`
    });

    const isDiv9 = (sum % 9 === 0);
    const isDiv3 = (sum % 3 === 0);

    if (isDiv9) {
      steps.push({
        label: 'Modulo 9 Match',
        desc: `Sum ${sum} is divisible by 9 (${sum} = 9 &times; ${sum / 9}) &rarr; ${n} contains at least <strong>3&sup2; = 9</strong>.`
      });
    } else if (isDiv3) {
      steps.push({
        label: 'Modulo 3 Match',
        desc: `Sum ${sum} is divisible by 3 (${sum} = 3 &times; ${sum / 3}) &rarr; ${n} contains at least <strong>3</strong>.`
      });
    } else {
      steps.push({
        label: 'Modulo 3/9 Check',
        desc: `Sum ${sum} mod 3 = ${sum % 3} &rarr; ${n} has <strong>no factors of 3</strong>.`
      });
    }

    let temp = n;
    let threeCount = 0;
    while (temp % 3 === 0) {
      threeCount++;
      const next = temp / 3;
      steps.push({
        label: `Extract 3^${threeCount}`,
        desc: `${temp} / 3 = <strong>${next}</strong>`
      });
      temp = next;
    }

    steps.push({
      label: 'Complete Decomposition',
      desc: `Quotient without 3s: <strong>${temp}</strong>. Complete factorization: <span class="font-math font-bold text-accent">${n} = ${fullFormula}</span>.`
    });

    renderSteps('Strategy 02: Sum of Digits & Modulo 9', steps);
  }

  // Strategy 3: Difference of Squares (a² - b²)
  function executeStrategy3(n, fullFormula) {
    const steps = [];
    steps.push({
      label: 'Algebraic Form',
      desc: `Testing if ${n} can be expressed as <code>N = a&sup2; - b&sup2; = (a - b)(a + b)</code>.`
    });

    if (n % 2 === 0) {
      steps.push({
        label: 'Parity Note',
        desc: `${n} is even. Fermat difference of squares is optimized for odd integers; stripping factors of 2 is recommended first.`
      });
    }

    const startA = Math.ceil(Math.sqrt(n));
    let found = false;
    let aVal = startA;
    let bVal = 0;

    for (let a = startA; a <= startA + 50; a++) {
      const b2 = a * a - n;
      const b = Math.round(Math.sqrt(b2));
      if (b * b === b2 && b > 0) {
        found = true;
        aVal = a;
        bVal = b;
        break;
      }
    }

    if (found) {
      const factor1 = aVal - bVal;
      const factor2 = aVal + bVal;
      steps.push({
        label: 'Square Collision Found',
        desc: `Found a = <strong>${aVal}</strong>: <code>${aVal}&sup2; - ${n} = ${aVal * aVal} - ${n} = ${bVal * bVal} = ${bVal}&sup2;</code>`
      });
      steps.push({
        label: 'Algebraic Identity',
        desc: `<code>${n} = (${aVal} - ${bVal}) &times; (${aVal} + ${bVal}) = <strong>${factor1} &times; ${factor2}</strong></code>.`
      });
    } else {
      steps.push({
        label: 'Square Proximity',
        desc: `Ceiling square &lceil;&radic;${n}&rceil; = ${startA} (${startA}&sup2; = ${startA * startA}). No immediate difference of squares with small b.`
      });
    }

    steps.push({
      label: 'Complete Decomposition',
      desc: `Prime factors: <span class="font-math font-bold text-accent">${n} = ${fullFormula}</span>.`
    });

    renderSteps('Strategy 03: Difference of Squares (a² - b²)', steps);
  }

  function renderSteps(stratTitle, steps) {
    if (summaryEl) summaryEl.textContent = stratTitle;
    if (!stepsWrap) return;

    stepsWrap.innerHTML = steps.map((s, idx) => `
      <div class="sandbox-step-item">
        <span class="step-badge">[Step ${idx + 1}] ${s.label}:</span>
        <div>${s.desc}</div>
      </div>
    `).join('');

    if (window.gsap) {
      window.gsap.fromTo('.sandbox-step-item',
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }

  // Initial execution with 899
  runStrategyBreakdown();
}
