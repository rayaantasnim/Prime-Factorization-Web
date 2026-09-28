/**
 * PrimeFactor.app — Dedicated Custom Range Controller
 * Handles manual bounds definition, interactive session duration slider (3-180 min),
 * Questions Quantity selector (10-50 questions), real-time pace/slack ratio triggers,
 * localized 3-strike disqualification toggle, rule overrides, and validation.
 */

import { initGlobalHeader, renderFooter, initSettingsModal } from './header.js';
import { setActiveExamParams, getSettings } from './storage.js';
import { playSound } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader();
  initCustomRangeForm();
});

function initCustomRangeForm() {
  const minInput = document.getElementById('custom-min-input');
  const maxInput = document.getElementById('custom-max-input');
  const submitBtn = document.getElementById('custom-launch-btn');
  const feedbackEl = document.getElementById('custom-validation-msg');
  const warningContainer = document.getElementById('custom-warning-container');

  // Time Limit Controls (3 to 180 minutes)
  const timeSlider = document.getElementById('custom-time-slider');
  const timeVal = document.getElementById('custom-time-val');
  const timeSec = document.getElementById('custom-time-sec');
  const timePresetBtns = document.querySelectorAll('.time-preset-btn');

  // Questions Quantity Controls (10 to 50 questions)
  const quantitySlider = document.getElementById('custom-quantity-slider');
  const quantityVal = document.getElementById('custom-quantity-val');
  const quantityPresetBtns = document.querySelectorAll('.quantity-preset-btn');

  // Rule switches
  const toggleSecond = document.getElementById('custom-toggle-second');
  const togglePause = document.getElementById('custom-toggle-pause');
  const toggleRegen = document.getElementById('custom-toggle-regen');
  const toggleHint = document.getElementById('custom-toggle-hint');
  const toggleStrike = document.getElementById('custom-toggle-strike');
  const toggleFocus = document.getElementById('custom-toggle-focus');
  const cautionMsg = document.getElementById('focus-tracking-caution-msg');

  // Participation Mode Radios
  const radioRated = document.getElementById('radio-mode-rated');
  const radioUnrated = document.getElementById('radio-mode-unrated');
  const labelRated = document.getElementById('label-mode-rated');
  const labelUnrated = document.getElementById('label-mode-unrated');

  // Bounds Presets
  const presetBtns = document.querySelectorAll('.preset-badge-btn');

  const baseSettings = getSettings();
  if (toggleSecond) toggleSecond.checked = baseSettings.allowSecondAttempt;
  if (togglePause) togglePause.checked = baseSettings.allowPause;
  if (toggleRegen) toggleRegen.checked = baseSettings.allowRegenerate;
  if (toggleHint) toggleHint.checked = baseSettings.allowHint;
  if (toggleStrike) toggleStrike.checked = true; // Localized default: ON
  if (toggleFocus) toggleFocus.checked = true; // Default: ON

  // Participation Mode Selection Controller
  function updateParticipationModeUI(mode) {
    if (mode === 'unrated') {
      if (labelRated) {
        labelRated.style.background = 'rgba(15, 23, 42, 0.7)';
        labelRated.style.border = '1px solid rgba(255, 255, 255, 0.12)';
      }
      if (labelUnrated) {
        labelUnrated.style.background = 'rgba(16, 185, 129, 0.15)';
        labelUnrated.style.border = '1.5px solid #10B981';
      }
    } else {
      if (labelRated) {
        labelRated.style.background = 'rgba(14, 165, 233, 0.12)';
        labelRated.style.border = '1.5px solid #0EA5E9';
      }
      if (labelUnrated) {
        labelUnrated.style.background = 'rgba(15, 23, 42, 0.7)';
        labelUnrated.style.border = '1px solid rgba(255, 255, 255, 0.12)';
      }
    }
  }

  // Check URL query parameters for unrated mode
  const initialUrlParams = new URLSearchParams(window.location.search);
  if (initialUrlParams.get('unrated') === 'true' || initialUrlParams.get('mode') === 'unrated') {
    if (radioUnrated) {
      radioUnrated.checked = true;
      updateParticipationModeUI('unrated');
    }
  }

  radioRated?.addEventListener('change', () => {
    playSound('click');
    updateParticipationModeUI('rated');
    updateSessionStorageSettings();
  });

  radioUnrated?.addEventListener('change', () => {
    playSound('click');
    updateParticipationModeUI('unrated');
    updateSessionStorageSettings();
  });

  // Focus Tracking Toggle Logic: ON vs OFF State Hardening
  function handleFocusToggleChange() {
    const isTrackingOn = toggleFocus ? toggleFocus.checked : true;
    if (isTrackingOn) {
      if (cautionMsg) cautionMsg.style.display = 'none';
      sessionStorage.setItem('primefactor_focus_tracking', 'true');
      sessionStorage.setItem('primefactor_focus_penalty', '-5');
      sessionStorage.removeItem('primefactor_focus_tracking_off_penalty');
      sessionStorage.removeItem('primefactor_initial_penalty');
    } else {
      playSound('error');
      if (cautionMsg) cautionMsg.style.display = 'block';
      // Synchronous layout & storage triggers
      sessionStorage.setItem('primefactor_focus_tracking', 'false');
      sessionStorage.setItem('primefactor_focus_penalty', '0');
      sessionStorage.setItem('primefactor_focus_tracking_off_penalty', '10');
      sessionStorage.setItem('primefactor_initial_penalty', '-10');
    }
    updateSessionStorageSettings();
  }

  toggleFocus?.addEventListener('change', handleFocusToggleChange);

  function updateSessionStorageSettings() {
    try {
      const isTrackingOn = toggleFocus ? toggleFocus.checked : true;
      const mode = (radioUnrated && radioUnrated.checked) ? 'unrated' : 'rated';
      const lastSetupRaw = sessionStorage.getItem('primefactor_last_custom_setup');
      let setupObj = {};
      if (lastSetupRaw) {
        try { setupObj = JSON.parse(lastSetupRaw); } catch(e) {}
      }
      setupObj.rules = setupObj.rules || {};
      setupObj.rules.trackFocus = isTrackingOn;
      setupObj.rules.focusPenalty = isTrackingOn ? -5 : 0;
      setupObj.rules.initialPenalty = isTrackingOn ? 0 : -10;
      setupObj.rules.participationMode = mode;
      sessionStorage.setItem('primefactor_last_custom_setup', JSON.stringify(setupObj));

      const rawCache = sessionStorage.getItem('primefactor_custom_session_cache');
      if (rawCache) {
        let sessionCacheArray = JSON.parse(rawCache);
        if (Array.isArray(sessionCacheArray) && sessionCacheArray.length > 0) {
          const last = sessionCacheArray[sessionCacheArray.length - 1];
          last.rules = last.rules || {};
          last.rules.trackFocus = isTrackingOn;
          last.rules.focusPenalty = isTrackingOn ? -5 : 0;
          last.rules.initialPenalty = isTrackingOn ? 0 : -10;
          last.rules.participationMode = mode;
          sessionStorage.setItem('primefactor_custom_session_cache', JSON.stringify(sessionCacheArray));
        }
      }
    } catch (err) {
      console.warn('Session cache update error:', err);
    }
  }

  function updateTimeDisplay(minutes) {
    const clamped = Math.max(3, Math.min(180, Number(minutes) || 10));
    if (timeSlider) timeSlider.value = clamped;
    if (timeVal) timeVal.textContent = clamped;
    if (timeSec) timeSec.textContent = clamped * 60;
    evaluatePaceAndEfficiency();
    validate();
  }

  function updateQuantityDisplay(qty) {
    const clamped = Math.max(10, Math.min(50, Number(qty) || 10));
    if (quantitySlider) quantitySlider.value = clamped;
    if (quantityVal) quantityVal.textContent = clamped;
    evaluatePaceAndEfficiency();
    validate();
  }

  /**
   * Real-time Pace & Velocity Ratio Evaluator
   * Triggers:
   * 1. High-Speed Trigger (Aggressive Pace): impossible pace (<= 15s/question, e.g. 50 questions in 3m)
   * 2. Efficiency Drop Trigger (Velocity Slack): safe mathematical zone paired with heavy duration
   */
  function evaluatePaceAndEfficiency() {
    if (!warningContainer) return;

    const min = Number(minInput ? minInput.value : 500);
    const max = Number(maxInput ? maxInput.value : 2500);
    const minutes = Number(timeSlider ? timeSlider.value : 10);
    const questions = Number(quantitySlider ? quantitySlider.value : 10);

    const totalSeconds = minutes * 60;
    const secondsPerQuestion = totalSeconds / (questions || 10);
    const span = max - min;

    // High-Speed Trigger: impossible setups like 50 questions in 3 minutes (3.6s/q) or <= 15s per question
    const isAggressivePace = secondsPerQuestion <= 15;

    // Efficiency Drop Trigger: safe numeric bounds (e.g. 40-400 or max <= 1500) paired with heavy duration (>= 60 min)
    const isSafeZone = (max <= 1500) || (span <= 1000 && max <= 3000);
    const isHeavyDuration = (minutes >= 60) || (secondsPerQuestion >= 180 && minutes >= 30);
    const isVelocitySlack = !isAggressivePace && isSafeZone && isHeavyDuration;

    if (isAggressivePace) {
      warningContainer.style.display = 'flex';
      warningContainer.innerHTML = `
        <div class="warning-badge warning-aggressive" style="display: inline-flex; align-items: center; gap: 8px; flex-wrap: nowrap; white-space: nowrap; padding: 0.45rem 1rem; border-radius: 9999px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.7); color: #EF4444; font-weight: 700; text-shadow: 0 0 12px rgba(239, 68, 68, 0.6); box-shadow: 0 0 20px rgba(239, 68, 68, 0.25); animation: pulse-aggressive 2s infinite ease-in-out;">
          <span>⚠️ Aggressive Pace: High Speed Penalty Risk Active.</span>
        </div>
      `;
    } else if (isVelocitySlack) {
      warningContainer.style.display = 'flex';
      warningContainer.innerHTML = `
        <div class="warning-badge warning-slack" style="display: inline-flex; align-items: center; gap: 8px; flex-wrap: nowrap; white-space: nowrap; padding: 0.45rem 1rem; border-radius: 9999px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.7); color: #F59E0B; font-weight: 700; text-shadow: 0 0 12px rgba(245, 158, 11, 0.6); box-shadow: 0 0 20px rgba(245, 158, 11, 0.25); animation: pulse-slack 2s infinite ease-in-out;">
          <span>⚠️ Velocity Slack Triggered: Low Mathematical Tension Zone. ELO Gain Multiplier Dampened.</span>
        </div>
      `;
    } else {
      warningContainer.innerHTML = '';
      warningContainer.style.display = 'none';
    }
  }

  // Bind Native Input Hooks for Character & Slider Changes in Real-Time
  if (timeSlider) {
    timeSlider.addEventListener('input', () => {
      updateTimeDisplay(timeSlider.value);
    });
  }

  if (quantitySlider) {
    quantitySlider.addEventListener('input', () => {
      updateQuantityDisplay(quantitySlider.value);
    });
  }

  timePresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      const val = Number(btn.getAttribute('data-time'));
      updateTimeDisplay(val);
    });
  });

  quantityPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      const val = Number(btn.getAttribute('data-quantity'));
      updateQuantityDisplay(val);
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
        evaluatePaceAndEfficiency();
        validate();
      }
    });
  });

  minInput?.addEventListener('input', () => {
    evaluatePaceAndEfficiency();
    validate();
  });

  maxInput?.addEventListener('input', () => {
    evaluatePaceAndEfficiency();
    validate();
  });

  function validate() {
    const min = Number(minInput.value);
    const max = Number(maxInput.value);
    const minutes = Number(timeSlider ? timeSlider.value : 10);
    const questions = Number(quantitySlider ? quantitySlider.value : 10);

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
    if (max - min < questions + 5) {
      showError(`The selected range must span at least ${questions + 5} integers to provide ${questions} distinct questions.`);
      return null;
    }
    if (isNaN(minutes) || minutes < 3 || minutes > 180) {
      showError('Session duration must be constrained between 3 and 180 minutes.');
      return null;
    }
    if (isNaN(questions) || questions < 10 || questions > 50) {
      showError('Questions quantity must be set between 10 and 50.');
      return null;
    }

    clearError();
    return { min, max, minutes, questions };
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
    const isFocusTracking = toggleFocus ? toggleFocus.checked : true;
    const mode = (radioUnrated && radioUnrated.checked) ? 'unrated' : 'rated';
    const initialPenalty = isFocusTracking ? 0 : -10;

    const customRules = {
      allowSecondAttempt: toggleSecond ? toggleSecond.checked : true,
      allowPause: togglePause ? togglePause.checked : true,
      allowRegenerate: toggleRegen ? toggleRegen.checked : true,
      allowHint: toggleHint ? toggleHint.checked : true,
      allowStrikePenalty: allowStrike,
      trackFocus: isFocusTracking,
      focusPenalty: isFocusTracking ? -5 : 0,
      initialPenalty: initialPenalty,
      participationMode: mode,
      soundEnabled: baseSettings.soundEnabled
    };

    const payload = {
      min: valid.min,
      max: valid.max,
      questions: valid.questions,
      questionsCount: valid.questions,
      totalQuestions: valid.questions,
      title: label,
      timeLimit: timeSeconds,
      durationMinutes: valid.minutes,
      rules: customRules,
      timestamp: Date.now()
    };

    // 1. Sync to active exam params for downstream pages
    setActiveExamParams(payload);

    // 2. Cache finalized questions count and modified timeout variables securely into temporary local session cache array
    try {
      const rawCache = sessionStorage.getItem('primefactor_custom_session_cache');
      let sessionCacheArray = [];
      if (rawCache) {
        sessionCacheArray = JSON.parse(rawCache);
        if (!Array.isArray(sessionCacheArray)) sessionCacheArray = [];
      }
      sessionCacheArray.push(payload);
      if (sessionCacheArray.length > 20) sessionCacheArray.shift();
      sessionStorage.setItem('primefactor_custom_session_cache', JSON.stringify(sessionCacheArray));
      sessionStorage.setItem('primefactor_last_custom_setup', JSON.stringify(payload));
      
      if (!isFocusTracking) {
        sessionStorage.setItem('primefactor_focus_tracking_off_penalty', '10');
        sessionStorage.setItem('primefactor_initial_penalty', '-10');
        sessionStorage.setItem('primefactor_focus_tracking', 'false');
      } else {
        sessionStorage.removeItem('primefactor_focus_tracking_off_penalty');
        sessionStorage.removeItem('primefactor_initial_penalty');
        sessionStorage.setItem('primefactor_focus_tracking', 'true');
      }
    } catch (err) {
      console.warn('Session cache storage error:', err);
    }

    // 3. Forward seamlessly to contract.html
    window.location.href = `./contract.html?min=${valid.min}&max=${valid.max}&title=${encodeURIComponent(label)}&time=${timeSeconds}&questions=${valid.questions}&strikePenalty=${allowStrike}&trackFocus=${isFocusTracking}&mode=${mode}&initialPenalty=${initialPenalty}`;
  });

  // Run initial checks & triggers
  updateTimeDisplay(timeSlider ? timeSlider.value : 10);
  updateQuantityDisplay(quantitySlider ? quantitySlider.value : 10);
  evaluatePaceAndEfficiency();
  validate();
}
