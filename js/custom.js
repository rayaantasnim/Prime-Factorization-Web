/**
 * PrimeFactor.app — Dedicated Custom Range Controller
 * Handles manual bounds definition, interactive session duration slider (3-60 min),
 * localized 3-strike disqualification toggle, rule overrides, and validation.
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

  // Time Limit Controls
  const timeSlider = document.getElementById('custom-time-slider');
  const timeVal = document.getElementById('custom-time-val');
  const timeSec = document.getElementById('custom-time-sec');
  const timePresetBtns = document.querySelectorAll('.time-preset-btn');

  // Rule switches
  const toggleSecond = document.getElementById('custom-toggle-second');
  const togglePause = document.getElementById('custom-toggle-pause');
  const toggleRegen = document.getElementById('custom-toggle-regen');
  const toggleHint = document.getElementById('custom-toggle-hint');
  const toggleStrike = document.getElementById('custom-toggle-strike');

  // Bounds Presets
  const presetBtns = document.querySelectorAll('.preset-badge-btn');

  const baseSettings = getSettings();
  if (toggleSecond) toggleSecond.checked = baseSettings.allowSecondAttempt;
  if (togglePause) togglePause.checked = baseSettings.allowPause;
  if (toggleRegen) toggleRegen.checked = baseSettings.allowRegenerate;
  if (toggleHint) toggleHint.checked = baseSettings.allowHint;
  if (toggleStrike) toggleStrike.checked = true; // Localized default: ON

  function updateTimeDisplay(minutes) {
    const clamped = Math.max(3, Math.min(60, Number(minutes) || 10));
    if (timeSlider) timeSlider.value = clamped;
    if (timeVal) timeVal.textContent = clamped;
    if (timeSec) timeSec.textContent = clamped * 60;
  }

  if (timeSlider) {
    timeSlider.addEventListener('input', () => {
      updateTimeDisplay(timeSlider.value);
    });
  }

  timePresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      const val = Number(btn.getAttribute('data-time'));
      updateTimeDisplay(val);
    });
  });

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
    const minutes = Number(timeSlider ? timeSlider.value : 10);

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
    if (isNaN(minutes) || minutes < 3 || minutes > 60) {
      showError('Session duration must be constrained between 3 and 60 minutes.');
      return null;
    }

    clearError();
    return { min, max, minutes };
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
    const timeSeconds = valid.minutes * 60;
    const allowStrike = toggleStrike ? toggleStrike.checked : true;

    const customRules = {
      allowSecondAttempt: toggleSecond ? toggleSecond.checked : true,
      allowPause: togglePause ? togglePause.checked : true,
      allowRegenerate: toggleRegen ? toggleRegen.checked : true,
      allowHint: toggleHint ? toggleHint.checked : true,
      allowStrikePenalty: allowStrike,
      soundEnabled: baseSettings.soundEnabled
    };

    setActiveExamParams({
      min: valid.min,
      max: valid.max,
      title: label,
      timeLimit: timeSeconds,
      rules: customRules
    });

    window.location.href = `./contract.html?min=${valid.min}&max=${valid.max}&title=${encodeURIComponent(label)}&time=${timeSeconds}&strikePenalty=${allowStrike}`;
  });

  // Run initial check
  updateTimeDisplay(timeSlider ? timeSlider.value : 10);
  validate();
}
