/**
 * PrimeFactor.app — Standalone Engine Configuration & Security Hardening Module
 * Native ES6 Production Workspace Imports:
 * - storage.js
 * - elo-engine.js
 * - audio.js
 * - header.js
 * - exam-arena-controller.js
 */

import {
  getSettings,
  updateSettings,
  getActiveExamParams,
  setActiveExamParams
} from './storage.js';

import {
  getUserElo,
  ELO_TIERS,
  getTierByElo
} from './elo-engine.js';

import {
  playSound
} from './audio.js';

import {
  initGlobalHeader,
  renderFooter,
  triggerFlash
} from './header.js';

import {
  activeComboStrikeState
} from './exam-arena-controller.js';

// Audio Context Singleton for direct synthesis calibration
let calibrationAudioCtx = null;
function getCalibrationAudioContext() {
  if (!calibrationAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      calibrationAudioCtx = new AudioContextClass();
    }
  }
  if (calibrationAudioCtx && calibrationAudioCtx.state === 'suspended') {
    calibrationAudioCtx.resume();
  }
  return calibrationAudioCtx;
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Universal Header Infrastructure and Persistent Footer
  initGlobalHeader();
  renderFooter('site-footer-slot');

  // 2. Security Hardening: Authentic User ELO Read & Presentation (Strictly Read-Only)
  initAuthenticEloDisplay();

  // 3. Initialize Competition Mode Protocol Selector (Rated vs Unrated Safe-Zone)
  initProtocolSelector();

  // 4. Initialize Tactical Lifelines Matrix Checkboxes
  initLifelineToggles();

  // 5. Initialize Web Audio Synthesizer Calibration Panel
  initAudioCalibration();

  // 6. Run Asymmetric Firewall Interlock Audit
  auditAsymmetricFirewall();
});

/**
 * 2. AUTHENTIC USER ELO ENGINE PRESENTATION
 * Security Protocol: Strictly Read-Only from verified production storage.
 * OMITTING all client-side ELO simulator fields, textboxes, testing calibration buttons,
 * and tier adjustment click handlers.
 */
function initAuthenticEloDisplay() {
  const authenticElo = getUserElo();
  const tier = getTierByElo(authenticElo) || ELO_TIERS[ELO_TIERS.length - 1];

  const scoreEl = document.getElementById('elo-score-display');
  const tierNameEl = document.getElementById('elo-tier-title');
  const symbolEl = document.getElementById('elo-tier-symbol');
  const descEl = document.getElementById('elo-tier-description');
  const colorBadgeEl = document.getElementById('elo-color-badge');

  if (scoreEl) scoreEl.textContent = authenticElo.toLocaleString();
  if (tierNameEl) {
    tierNameEl.textContent = tier.title;
    tierNameEl.style.color = tier.colorHex || '#38BDF8';
  }
  if (symbolEl) symbolEl.textContent = tier.symbol || '🛡️';
  if (descEl) descEl.textContent = tier.description || 'Cognitive factorization candidate.';
  if (colorBadgeEl) {
    colorBadgeEl.textContent = tier.colorName || 'Division Status';
    colorBadgeEl.style.borderColor = tier.colorHex || '#38BDF8';
    colorBadgeEl.style.color = tier.colorHex || '#38BDF8';
  }
}

/**
 * 3. COMPETITION MODE PROTOCOL SELECTOR
 * Handles active Rated Contest vs Unrated Practice Safe-Zone Exception.
 */
let activeProtocolMode = 'rated';

function initProtocolSelector() {
  const settings = getSettings();
  const storedContestMode = localStorage.getItem('primefactor_active_contest_mode');
  
  if (storedContestMode === 'unrated' || settings.participationMode === 'unrated') {
    activeProtocolMode = 'unrated';
  } else {
    activeProtocolMode = 'rated';
  }

  const btnRated = document.getElementById('protocol-btn-rated');
  const btnUnrated = document.getElementById('protocol-btn-unrated');

  const updateUI = () => {
    if (activeProtocolMode === 'rated') {
      btnRated?.classList.add('active-rated');
      btnUnrated?.classList.remove('active-unrated');
    } else {
      btnRated?.classList.remove('active-rated');
      btnUnrated?.classList.add('active-unrated');
    }
    auditAsymmetricFirewall();
  };

  if (btnRated) {
    btnRated.addEventListener('click', () => {
      playSound('click');
      activeProtocolMode = 'rated';
      localStorage.setItem('primefactor_active_contest_mode', 'rated');
      updateSettings({ participationMode: 'rated' });
      updateUI();
    });
  }

  if (btnUnrated) {
    btnUnrated.addEventListener('click', () => {
      playSound('click');
      activeProtocolMode = 'unrated';
      localStorage.setItem('primefactor_active_contest_mode', 'unrated');
      updateSettings({ participationMode: 'unrated' });
      updateUI();
    });
  }

  updateUI();
}

/**
 * 4. USER-CONFIGURABLE TACTICAL LIFE-LINES MATRIX
 * Neon toggles bound directly to local preferences via getSettings() / updateSettings().
 */
const LIFELINE_KEYS = [
  'allowSecondAttempt',
  'allowPause',
  'allowRegenerate',
  'allowHint',
  'allowSandbox',
  'allowNoise',
  'allowComboTracker',
  'allowSkip',
  'allowDeficitOverride'
];

function initLifelineToggles() {
  const settings = getSettings();

  LIFELINE_KEYS.forEach(key => {
    const input = document.getElementById(`toggle-${key}`);
    if (!input) return;

    // Load initial stored preference
    input.checked = !!settings[key];

    input.addEventListener('change', () => {
      playSound('click');
      const val = input.checked;
      const payload = { [key]: val };

      // Sub-Second Combo Boost synchronizes with allowComboTracker
      if (key === 'allowComboTracker') {
        payload.subSecondBoost = val;
      }

      updateSettings(payload);

      // Notify other active tabs / event loops
      window.dispatchEvent(new CustomEvent('primefactor_settings_changed', { detail: payload }));
    });
  });
}

/**
 * 5. WEB AUDIO SYNTHESIZER CALIBRATION PANEL
 * Custom fluid sliders for Global Master Volume (0.0 - 1.0) and Event Chime Pitch (220Hz - 880Hz).
 */
function initAudioCalibration() {
  const settings = getSettings();

  // Master Sound Toggle
  const soundToggle = document.getElementById('toggle-sound-enabled');
  if (soundToggle) {
    soundToggle.checked = settings.soundEnabled !== false;
    soundToggle.addEventListener('change', () => {
      playSound('click');
      updateSettings({ soundEnabled: soundToggle.checked });
      window.dispatchEvent(new CustomEvent('primefactor_settings_changed', { detail: { soundEnabled: soundToggle.checked } }));
    });
  }

  // Volume Slider (0.0 to 1.0)
  const volumeSlider = document.getElementById('slider-master-volume');
  const volumeReadout = document.getElementById('volume-readout');
  const testVolumeBtn = document.getElementById('btn-test-volume');

  const initialVolume = typeof settings.masterVolume === 'number' ? settings.masterVolume : 0.8;
  if (volumeSlider) {
    volumeSlider.value = initialVolume;
    if (volumeReadout) volumeReadout.textContent = `${Math.round(initialVolume * 100)}% (${Number(initialVolume).toFixed(2)})`;

    volumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      if (volumeReadout) volumeReadout.textContent = `${Math.round(vol * 100)}% (${vol.toFixed(2)})`;
      updateSettings({ masterVolume: vol });
    });
  }

  if (testVolumeBtn) {
    testVolumeBtn.addEventListener('click', () => {
      playTestAcousticPulse();
    });
  }

  // Pitch Slider (220Hz to 880Hz)
  const pitchSlider = document.getElementById('slider-chime-pitch');
  const pitchReadout = document.getElementById('pitch-readout');
  const testPitchBtn = document.getElementById('btn-test-pitch');

  const initialPitch = typeof settings.eventChimePitch === 'number' ? settings.eventChimePitch : 440;
  if (pitchSlider) {
    pitchSlider.value = initialPitch;
    if (pitchReadout) pitchReadout.textContent = formatPitchDescription(initialPitch);

    pitchSlider.addEventListener('input', (e) => {
      const pitch = parseInt(e.target.value, 10);
      if (pitchReadout) pitchReadout.textContent = formatPitchDescription(pitch);
      updateSettings({ eventChimePitch: pitch });
    });
  }

  if (testPitchBtn) {
    testPitchBtn.addEventListener('click', () => {
      playTestChimeNote();
    });
  }
}

function formatPitchDescription(hz) {
  if (hz >= 435 && hz <= 445) return `${hz} Hz (Concert A440)`;
  if (hz >= 520 && hz <= 526) return `${hz} Hz (High C523)`;
  if (hz >= 258 && hz <= 264) return `${hz} Hz (Middle C261)`;
  if (hz >= 875) return `${hz} Hz (Treble A880)`;
  return `${hz} Hz`;
}

// Synthesize calibrated acoustic pulse tone
function playTestAcousticPulse() {
  try {
    const ctx = getCalibrationAudioContext();
    if (!ctx) return;
    const settings = getSettings();
    if (settings.soundEnabled === false) return;

    const volume = typeof settings.masterVolume === 'number' ? settings.masterVolume : 0.8;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);

    const targetGain = 0.12 * Math.max(0.01, volume);
    gain.gain.setValueAtTime(targetGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch (e) {
    console.warn('Audio test pulse error:', e);
  }
}

// Synthesize calibrated chime note at selected frequency
function playTestChimeNote() {
  try {
    const ctx = getCalibrationAudioContext();
    if (!ctx) return;
    const settings = getSettings();
    if (settings.soundEnabled === false) return;

    const volume = typeof settings.masterVolume === 'number' ? settings.masterVolume : 0.8;
    const pitch = typeof settings.eventChimePitch === 'number' ? settings.eventChimePitch : 440;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);

    const targetGain = 0.14 * Math.max(0.01, volume);
    gain.gain.setValueAtTime(targetGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    console.warn('Audio test chime error:', e);
  }
}

/**
 * 6. STRICT ASYMMETRIC FIREWALL INTERLOCK INTEGRATION (Module 3 Enforcement)
 * Locks and fads specific tactical lifelines based on contestant's authentic ELO:
 * - ELO >= 900: Lock [Launch Sandbox Scratchpad]
 * - ELO >= 1200: Lock [Eliminate Noise Filter]
 * - ELO >= 1400: Lock [Conceptual Hints]
 * - ELO >= 1800: Lock [Timer Pauses (Max 2)]
 * - ELO >= 2400: Lock [Sub-Second Combo Boost Tracker] (Enforce strict pacing)
 * - ELO >= 3000 (Prime Singularity): Lock ALL lifelines
 *
 * Safe-Zone Exception: Completely bypassed if Unrated Practice Mode is active.
 */
function auditAsymmetricFirewall() {
  const userElo = getUserElo();
  const isRated = (activeProtocolMode === 'rated');
  const safeZoneBanner = document.getElementById('safe-zone-banner');

  if (safeZoneBanner) {
    safeZoneBanner.style.display = isRated ? 'none' : 'flex';
  }

  const settings = getSettings();

  LIFELINE_KEYS.forEach(key => {
    const input = document.getElementById(`toggle-${key}`);
    const card = document.getElementById(`card-${key}`);
    if (!input || !card) return;

    let shouldLock = false;

    if (isRated) {
      if (userElo >= 3000) {
        // Prime Singularity: Suppress and hard-lock ALL configured user help lifelines
        shouldLock = true;
      } else {
        if (key === 'allowSandbox' && userElo >= 900) shouldLock = true;
        if (key === 'allowNoise' && userElo >= 1200) shouldLock = true;
        if (key === 'allowHint' && userElo >= 1400) shouldLock = true;
        if (key === 'allowPause' && userElo >= 1800) shouldLock = true;
        if (key === 'allowComboTracker' && userElo >= 2400) shouldLock = true;
      }
    }

    let badge = card.querySelector('.firewall-indicator-badge');

    if (shouldLock) {
      // 1. Visually faded
      card.classList.add('firewall-locked');
      card.style.opacity = '0.35';
      card.style.pointerEvents = 'none';

      // 2. Browser-level disabled & checked = false
      input.disabled = true;
      input.checked = false;

      // 3. Render glowing crimson indicator badge displaying exactly:
      // "❌ FIREWALL DEACTIVATED (ELO PROHIBITED)"
      if (!badge) {
        const info = card.querySelector('.lifeline-info');
        if (info) {
          const badgeWrap = document.createElement('div');
          badgeWrap.className = 'badge-anchor';
          badgeWrap.innerHTML = '<span class="firewall-indicator-badge">❌ FIREWALL DEACTIVATED (ELO PROHIBITED)</span>';
          info.appendChild(badgeWrap);
        }
      }
    } else {
      // Restore active interactive status
      card.classList.remove('firewall-locked');
      card.style.opacity = '1';
      card.style.pointerEvents = 'auto';

      input.disabled = false;
      input.checked = !!settings[key];

      if (badge && badge.parentElement) {
        badge.parentElement.remove();
      }
    }
  });
}
