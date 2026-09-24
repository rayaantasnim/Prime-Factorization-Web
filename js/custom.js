/**
 * PrimeFactor.app — Dedicated Custom Range Controller
 * Handles manual bounds definition, rule overrides, and validation.
 */

import { initGlobalHeader, renderFooter } from './header.js';
import { setActiveExamParams, getSettings } from './storage.js';
import { playSound } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader({ hideSettings: true });
  initCustomRangeForm();
});

function initCustomRangeForm() {
  const minInput = document.getElementById('custom-min-input');
  const maxInput = document.getElementById('custom-max-input');
  const submitBtn = document.getElementById('custom-launch-btn');
  const feedbackEl = document.getElementById('custom-validation-msg');

  // Rule switches
  const toggleSecond = document.getElementById('custom-toggle-second');
  const togglePause = document.getElementById('custom-toggle-pause');
  const toggleRegen = document.getElementById('custom-toggle-regen');
  const toggleHint = document.getElementById('custom-toggle-hint');

  // Presets
  const presetBtns = document.querySelectorAll('.preset-badge-btn');

  const baseSettings = getSettings();
  if (toggleSecond) toggleSecond.checked = baseSettings.allowSecondAttempt;
  if (togglePause) togglePause.checked = baseSettings.allowPause;
  if (toggleRegen) toggleRegen.checked = baseSettings.allowRegenerate;
  if (toggleHint) toggleHint.checked = baseSettings.allowHint;

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      const min = btn.getAttribute('data-min');
      const max = btn.getAttribute('data-max');
      if (minInput && maxInput) {
        minInput.value = min;
        maxInput.value = max;
        validate();
      }
    });
  });

  function validate() {
    const min = Number(minInput.value);
    const max = Number(maxInput.value);

    if (isNaN(min) || isNaN(max)) {
      showError('Please enter valid numeric integers for both bounds.');
      return null;
    }
    if (min < 4) {
      showError('Minimum bound must be at least 4 (smallest composite integer).');
      return null;
    }
    if (max > 100000) {
      showError('Maximum bound is capped at 100,000 for client-side speed guarantees.');
      return null;
    }
    if (min >= max) {
      showError('Minimum bound must be strictly less than the maximum bound.');
      return null;
    }
    if (max - min < 15) {
      showError('The selected range must span at least 15 integers to provide 10 distinct questions.');
      return null;
    }

    clearError();
    return { min, max };
  }

  function showError(msg) {
    if (!feedbackEl || !submitBtn) return;
    feedbackEl.textContent = msg;
    feedbackEl.style.display = 'block';
    feedbackEl.style.color = '#DC2626';
    feedbackEl.className = 'validation-feedback';
    submitBtn.disabled = true;
  }

  function clearError() {
    if (!feedbackEl || !submitBtn) return;
    feedbackEl.textContent = 'Configuration verified · Ready for Olympiad deployment';
    feedbackEl.style.display = 'block';
    feedbackEl.style.color = '#15803D';
    feedbackEl.className = 'validation-feedback';
    submitBtn.disabled = false;
  }

  minInput?.addEventListener('input', validate);
  maxInput?.addEventListener('input', validate);

  submitBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const valid = validate();
    if (!valid) {
      playSound('error');
      return;
    }

    playSound('click');
    const label = `Custom: ${valid.min.toLocaleString()} - ${valid.max.toLocaleString()}`;

    const customRules = {
      allowSecondAttempt: toggleSecond ? toggleSecond.checked : true,
      allowPause: togglePause ? togglePause.checked : true,
      allowRegenerate: toggleRegen ? toggleRegen.checked : true,
      allowHint: toggleHint ? toggleHint.checked : true,
      soundEnabled: baseSettings.soundEnabled
    };

    setActiveExamParams({
      min: valid.min,
      max: valid.max,
      title: label,
      rules: customRules
    });

    window.location.href = `./exam.html?min=${valid.min}&max=${valid.max}&title=${encodeURIComponent(label)}`;
  });

  // Run initial check
  validate();
}
