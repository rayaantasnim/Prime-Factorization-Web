/**
 * PrimeFactor.app — Pre-Exam Contract Gatekeeper & Redirection Router
 * Manages target parameters continuity, scoring rule disclosures, anti-cheat isolation advisories,
 * and the automated 30-second forward-escalation countdown to exam.html.
 */

import { initGlobalHeader, renderFooter, triggerFlash } from './header.js';
import { getActiveExamParams, setActiveExamParams } from './storage.js';
import { playSound } from './audio.js';
import { getUserElo, isRangeBannedForElo, getTierByElo, getTierBanCeilingDescription } from './elo-engine.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader();
  renderFooter();
  initContractGatekeeper();
});

function initContractGatekeeper() {
  const urlParams = new URLSearchParams(window.location.search);
  const storedParams = getActiveExamParams();

  // Draw parameters with priority on URL search query strings
  const min = urlParams.get('min') ? Number(urlParams.get('min')) : (storedParams.min || 1);
  const max = urlParams.get('max') ? Number(urlParams.get('max')) : (storedParams.max || 200);
  const title = urlParams.get('title') || storedParams.title || `Division: ${min} - ${max}`;
  const explicitTime = urlParams.get('time') ? Number(urlParams.get('time')) : null;
  const strikePenaltyParam = urlParams.has('strikePenalty') ? urlParams.get('strikePenalty') === 'true' : null;

  // Asymmetric Range-Banning Firewall Evaluation
  const userElo = getUserElo();
  const isBanned = isRangeBannedForElo(userElo, max);
  const initialMode = urlParams.get('mode') || storedParams.rules?.participationMode || 'rated';
  let isForcedUnrated = isBanned || initialMode === 'unrated' || urlParams.get('forcedUnrated') === 'true';
  let participationMode = isForcedUnrated ? 'unrated' : 'rated';

  const firewallBanner = document.getElementById('firewall-advisory-banner');
  if (firewallBanner) {
    if (isBanned) {
      firewallBanner.style.display = 'block';
      firewallBanner.innerHTML = `🛡️ <strong>ASYMMETRIC RANGE FIREWALL ENGAGED:</strong> Your active rating (${userElo.toLocaleString()} ELO) exceeds this division's capability ceiling. Rated Contest is locked. Running in <strong>Unrated Practice Mode</strong> (Delta R = 0 Sandbox).`;
    } else {
      firewallBanner.style.display = 'none';
    }
  }
  
  // Parsed Questions Quantity
  const questionsCount = urlParams.get('questions') 
    ? Number(urlParams.get('questions')) 
    : (storedParams.questions || storedParams.questionsCount || storedParams.totalQuestions || 10);

  // Security & Mode Flags
  const trackFocusParam = urlParams.has('trackFocus') 
    ? urlParams.get('trackFocus') === 'true' 
    : (storedParams.rules?.trackFocus !== undefined ? storedParams.rules.trackFocus : true);

  const initialPenaltyParam = urlParams.get('initialPenalty') 
    || (storedParams.rules?.initialPenalty !== undefined ? String(storedParams.rules.initialPenalty) : (sessionStorage.getItem('primefactor_focus_tracking_off_penalty') === '10' ? '-10' : '0'));

  // Progressive Time Limit Calculation
  function calculateTimeLimit(maxVal, customTime) {
    if (customTime && !isNaN(customTime) && customTime > 0) return customTime;
    if (storedParams.timeLimit && !isNaN(storedParams.timeLimit) && storedParams.timeLimit > 0) {
      return storedParams.timeLimit;
    }
    if (maxVal <= 200) return 180;
    if (maxVal <= 500) return 300;
    if (maxVal <= 1000) return 480;
    if (maxVal <= 2000) return 720;
    if (maxVal <= 5000) return 1080;
    if (maxVal <= 10000) return 1500;
    if (maxVal <= 20000) return 2100;
    if (maxVal <= 35000) return 2700;
    return 3600;
  }

  const durationSeconds = calculateTimeLimit(max, explicitTime);
  const durationMinutes = Math.round(durationSeconds / 60);

  const strikeEnabled = strikePenaltyParam !== null 
    ? strikePenaltyParam 
    : (storedParams.rules?.allowStrikePenalty !== undefined ? storedParams.rules.allowStrikePenalty : true);

  // Multi-Axis Dynamic Parameters based on active ELO rank tier pulled from localStorage:
  // 1. Time Consumed Target: dynamically calculate a scaled human limit based on tier rank difficulty
  let humanPacingLimit = '< 4.5s per factor';
  if (userElo < 1200) {
    humanPacingLimit = '< 4.5s per factor';
  } else if (userElo < 1600) {
    humanPacingLimit = '< 3.5s per factor';
  } else if (userElo < 2000) {
    humanPacingLimit = '< 2.5s per factor';
  } else if (userElo < 2400) {
    humanPacingLimit = '< 1.8s per factor';
  } else {
    // 2400+ ELO scales aggressively down
    humanPacingLimit = '< 1.2s per factor';
  }

  // 2. Target Session Accuracy: scale benchmark tracking accuracy ceiling dynamically based on active rank thresholds
  let humanAccuracyTarget = 'Expected: 90%+ Precision';
  if (userElo < 900) {
    // Apprentice ranges require 80% accuracy
    humanAccuracyTarget = 'Expected: 80%+ Precision';
  } else if (userElo < 1400) {
    humanAccuracyTarget = 'Expected: 85%+ Precision';
  } else if (userElo < 2000) {
    humanAccuracyTarget = 'Expected: 90%+ Precision';
  } else if (userElo < 2400) {
    humanAccuracyTarget = 'Expected: 92%+ Precision';
  } else if (userElo < 3000) {
    humanAccuracyTarget = 'Expected: 94%+ Precision';
  } else {
    // Quantum Decomposer requires a strict 95%+ precision bar
    humanAccuracyTarget = 'Expected: 95%+ Precision';
  }

  const humanLifelinesTarget = userElo < 1200 
    ? 'Expected: ≤ 1 lifeline utilized' 
    : 'Expected: 0 lifelines utilized';

  // Populate DOM elements
  const elTier = document.getElementById('contract-tier-name');
  const elBounds = document.getElementById('contract-bounds-val');
  const elTime = document.getElementById('contract-time-val');
  const elQuestions = document.getElementById('contract-questions-val');
  const elStrike = document.getElementById('contract-strike-val');
  const elPacing = document.getElementById('expectation-pacing-val');
  const elAccuracy = document.getElementById('expectation-accuracy-val');
  const elLifelines = document.getElementById('expectation-lifelines-val');
  const elRedemption = document.getElementById('expectation-redemption-val');
  const elCountdownNum = document.getElementById('contract-countdown-num');
  const elProgress = document.getElementById('contract-progress-bar');
  const btnEnter = document.getElementById('contract-enter-btn');
  const btnCancel = document.getElementById('contract-cancel-btn');

  // Radio button & container elements
  const radioRated = document.getElementById('radio-mode-rated');
  const radioUnrated = document.getElementById('radio-mode-unrated');
  const labelModeRated = document.getElementById('label-mode-rated');
  const labelModeUnrated = document.getElementById('label-mode-unrated');
  const textModeRated = document.getElementById('text-mode-rated');
  const textModeUnrated = document.getElementById('text-mode-unrated');
  const systemExpectationsContainer = document.getElementById('system-expectations-container');
  const unratedJadeBanner = document.getElementById('unrated-jade-banner');
  const forcedUnratedBadge = document.getElementById('forced-unrated-badge');
  const forcedUnratedBadgeText = document.getElementById('forced-unrated-badge-text');

  if (elTier) elTier.textContent = title;
  if (elBounds) elBounds.textContent = `${min.toLocaleString()} — ${max.toLocaleString()}`;
  if (elTime) elTime.textContent = `${durationMinutes} Minutes (${durationSeconds}s)`;
  if (elQuestions) elQuestions.textContent = `${questionsCount} Questions`;
  if (elPacing) elPacing.textContent = humanPacingLimit;
  if (elAccuracy) elAccuracy.textContent = humanAccuracyTarget;
  if (elLifelines) elLifelines.textContent = humanLifelinesTarget;
  if (elRedemption) elRedemption.textContent = '-5 pts on Overtime Miss';

  if (elStrike) {
    elStrike.textContent = strikeEnabled ? 'ACTIVE (Disqualification & -10 pts)' : 'BYPASSED (Standard Deductions Only)';
    elStrike.style.color = strikeEnabled ? '#EF4444' : '#10B981';
  }

  // Construct target exam URL preserving full parameters
  let examUrl = '';
  function syncState(mode) {
    participationMode = mode;
    isForcedUnrated = (mode === 'unrated') || isBanned;

    setActiveExamParams({
      min,
      max,
      title,
      timeLimit: durationSeconds,
      questions: questionsCount,
      questionsCount,
      totalQuestions: questionsCount,
      rules: {
        ...(storedParams.rules || {}),
        allowStrikePenalty: strikeEnabled,
        trackFocus: trackFocusParam,
        initialPenalty: Number(initialPenaltyParam),
        participationMode: mode
      }
    });

    examUrl = `./exam.html?min=${min}&max=${max}&title=${encodeURIComponent(title)}&time=${durationSeconds}&questions=${questionsCount}&strikePenalty=${strikeEnabled}&trackFocus=${trackFocusParam}&mode=${mode}&initialPenalty=${initialPenaltyParam}${isForcedUnrated ? '&forcedUnrated=true' : ''}`;
  }

  // Set initial sync
  syncState(participationMode);

  // Asymmetric Radio Button Intercept State Controllers
  function setUnratedModeUI(showBadge = false) {
    if (systemExpectationsContainer) {
      systemExpectationsContainer.style.display = 'none';
    }
    if (unratedJadeBanner) {
      unratedJadeBanner.style.display = 'block';
    }
    if (radioUnrated) radioUnrated.checked = true;
    if (radioRated) radioRated.checked = false;
    if (textModeUnrated) textModeUnrated.style.color = '#10B981';
    if (textModeRated) textModeRated.style.color = '#94A3B8';

    if (showBadge && forcedUnratedBadge) {
      forcedUnratedBadge.style.display = 'flex';
      if (forcedUnratedBadgeText) {
        forcedUnratedBadgeText.innerHTML = `<strong>CAPABILITY CEILING LOCKOUT:</strong> Your active rating (${userElo.toLocaleString()} ELO) exceeds this division's ceiling (${getTierBanCeilingDescription(max)}). Forcefully routed to Virtual Unrated Practice.`;
      }
    } else if (!showBadge && forcedUnratedBadge) {
      forcedUnratedBadge.style.display = 'none';
    }

    syncState('unrated');
  }

  function setRatedModeUI() {
    if (systemExpectationsContainer) {
      systemExpectationsContainer.style.display = 'block';
    }
    if (unratedJadeBanner) {
      unratedJadeBanner.style.display = 'none';
    }
    if (forcedUnratedBadge) {
      forcedUnratedBadge.style.display = 'none';
    }
    if (radioRated) radioRated.checked = true;
    if (radioUnrated) radioUnrated.checked = false;
    if (textModeRated) textModeRated.style.color = '#FFFFFF';
    if (textModeUnrated) textModeUnrated.style.color = '#94A3B8';

    syncState('rated');
  }

  // Apply Initial Mode UI State & Lockdown Enforcement
  if (isBanned) {
    if (radioRated) radioRated.disabled = true;
    if (textModeRated) textModeRated.textContent = '🔒 Banned for your ELO Bracket';
    if (labelModeRated) {
      labelModeRated.style.cursor = 'not-allowed';
      labelModeRated.style.opacity = '0.6';
      labelModeRated.style.pointerEvents = 'none';
    }
    setUnratedModeUI(true);
  } else if (isForcedUnrated) {
    setUnratedModeUI(false);
  } else {
    setRatedModeUI();
  }

  // Asymmetric Radio Button Intercept Listeners
  if (labelModeUnrated) {
    labelModeUnrated.addEventListener('click', () => {
      playSound('click');
      setUnratedModeUI(false);
    });
  }

  if (labelModeRated) {
    labelModeRated.addEventListener('click', (e) => {
      // Capability threshold ceiling check: If active ELO exceeds capability ceiling for selected range
      if (isBanned) {
        e.preventDefault();
        e.stopPropagation();
        playSound('penalty');
        triggerFlash('warning');
        setUnratedModeUI(true);

        // Flash forced unrated notice badge
        if (forcedUnratedBadge) {
          forcedUnratedBadge.style.display = 'flex';
          forcedUnratedBadge.style.animation = 'none';
          void forcedUnratedBadge.offsetWidth;
          forcedUnratedBadge.style.animation = 'shake 0.4s ease';
        }
      } else {
        playSound('click');
        setRatedModeUI();
      }
    });
  }

  let timeRemaining = 30; // 30-Second Automated Escalation
  let redirected = false;

  const proceedToArena = () => {
    if (redirected) return;
    redirected = true;
    clearInterval(countdownTimer);
    playSound('click');
    window.location.href = examUrl;
  };

  if (btnEnter) {
    btnEnter.addEventListener('click', (e) => {
      e.preventDefault();
      proceedToArena();
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', (e) => {
      e.preventDefault();
      clearInterval(countdownTimer);
      playSound('click');
      window.location.href = './ranges.html';
    });
  }

  // Automated 30s Countdown Timer
  const countdownTimer = setInterval(() => {
    timeRemaining--;
    if (elCountdownNum) {
      elCountdownNum.textContent = `${timeRemaining}s`;
    }
    if (elProgress) {
      const pct = ((30 - timeRemaining) / 30) * 100;
      elProgress.style.width = `${pct}%`;
    }

    if (timeRemaining <= 0) {
      proceedToArena();
    }
  }, 1000);
}
