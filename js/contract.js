/**
 * PrimeFactor.app — Pre-Exam Contract Gatekeeper & Redirection Router
 * Manages target parameters continuity, scoring rule disclosures, anti-cheat isolation advisories,
 * and the automated 30-second forward-escalation countdown to exam.html.
 */

import { initGlobalHeader, renderFooter, triggerFlash } from './header.js';
import { getActiveExamParams, setActiveExamParams } from './storage.js';
import { playSound } from './audio.js';
import { getUserElo, isRangeBannedForElo, getTierByElo, getTierBanCeilingDescription, computeSystemExpectations } from './elo-engine.js';

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

  // Multi-Axis Dynamic Expectations cross-matrix derived from player ELO and session MAX_BOUND
  const expectations = computeSystemExpectations(userElo, max);

  // Populate DOM elements
  const elTier = document.getElementById('contract-tier-name');
  const elBounds = document.getElementById('contract-bounds-val');
  const elTime = document.getElementById('contract-time-val');
  const elQuestions = document.getElementById('contract-questions-val');
  const elStrike = document.getElementById('contract-strike-val');
  const elPacing = document.getElementById('expectation-pacing-val');
  const elAccuracy = document.getElementById('expectation-accuracy-val');
  const elLifelines = document.getElementById('expectation-lifelines-val');
  const elScore = document.getElementById('expectation-score-val');
  const elRedemption = document.getElementById('expectation-redemption-val');
  const elCountdownNum = document.getElementById('contract-countdown-num');
  const elProgress = document.getElementById('contract-progress-bar');
  const elProgressMsg = document.getElementById('contract-progress-msg');
  const btnEnter = document.getElementById('contract-enter-btn');
  const btnEnterText = document.getElementById('contract-enter-btn-text');
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
  if (elPacing) elPacing.textContent = expectations.pacing;
  if (elAccuracy) elAccuracy.textContent = expectations.accuracy;
  if (elLifelines) elLifelines.textContent = expectations.lifelines;
  if (elScore) elScore.textContent = expectations.scoreExpectation;
  if (elRedemption) elRedemption.textContent = expectations.scoreExpectation;

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

  // ============================================================================
  // TWO-PHASE TICK TIMING STRATEGY & ESCALATION ROUTER
  // ============================================================================
  const PREPARATION_MESSAGES = [
    '⏳ Initializing Memory...',
    '🔑 Seeding UTC Challenge...',
    '⚙️ Building Rho Matrix...',
    '🛡️ Locking Anti-Cheat...',
    '🧬 Syncing Expectations...',
    '📊 Injecting Deficits...',
    '🧪 Calibrating Synthesizer...',
    '🚀 Finalizing Contract...'
  ];

  let timeRemaining = 30; // Absolute timeout countdown from 30s to 0s
  let isTransitLocked = false;
  let countdownTimer = null;
  let failsafeEmergencyTimeout = null;

  // 1. Gate Accessibility Lockout: Freeze entry button during Phase 1
  const freezeEntryButton = (buttonText = '🔒 Prep Wall Active (15s)...') => {
    if (!btnEnter) return;
    btnEnter.disabled = true;
    btnEnter.setAttribute('aria-disabled', 'true');
    btnEnter.classList.add('btn-frozen');
    btnEnter.style.opacity = '0.5';
    btnEnter.style.pointerEvents = 'none';
    btnEnter.style.cursor = 'not-allowed';
    btnEnter.style.boxShadow = 'none';
    btnEnter.style.filter = 'grayscale(0.2)';

    if (btnEnterText) {
      btnEnterText.textContent = buttonText;
    } else {
      btnEnter.innerHTML = `<span>${buttonText}</span>`;
    }
  };

  // 2. Dynamic Unlock Gate: Phase 2 transition when hitting 15s remaining
  const unlockEntryButtonForActiveWindow = () => {
    if (!btnEnter) return;
    isTransitLocked = false; // Allow manual click execution

    btnEnter.disabled = false;
    btnEnter.removeAttribute('aria-disabled');
    btnEnter.classList.remove('btn-frozen');
    btnEnter.style.opacity = '1.0';
    btnEnter.style.pointerEvents = 'auto';
    btnEnter.style.cursor = 'pointer';
    btnEnter.style.boxShadow = '0 0 25px rgba(14, 165, 233, 0.6)';
    btnEnter.style.border = '1px solid rgba(56, 189, 248, 0.7)';
    btnEnter.style.filter = 'none';

    btnEnter.innerHTML = `
      <span>Authorize &amp; Enter Arena </span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 0.5rem; vertical-align: middle;">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `;

    if (elProgressMsg) {
      elProgressMsg.textContent = '🚀 Subsystems Ready — Manual Action Window Open';
    }
  };

  // 3. Execution of Secure Transit to exam.html with Multi-Click Protection
  const proceedToArena = () => {
    if (isTransitLocked) return;
    isTransitLocked = true; // Anti-duplicate double-click lock

    // Stop active timers
    if (countdownTimer) clearInterval(countdownTimer);

    // Dual-Button Intercept Lock: Disable BOTH Enter and Cancel buttons immediately
    if (btnEnter) {
      btnEnter.disabled = true;
      btnEnter.style.pointerEvents = 'none';
      btnEnter.style.opacity = '0.5';
    }
    if (btnCancel) {
      btnCancel.disabled = true;
      btnCancel.style.pointerEvents = 'none';
      btnCancel.style.opacity = '0.5';
    }

    // Freeze button with mandatory redirection text strictly: "⚡ Redirecting to Live Arena..."
    if (btnEnterText) {
      btnEnterText.textContent = '⚡ Redirecting to Live Arena...';
    } else if (btnEnter) {
      btnEnter.innerHTML = '<span>⚡ Redirecting to Live Arena...</span>';
    }

    // Pre-Flight Lock Flag: Commit state tracking before navigation
    try {
      sessionStorage.setItem('exam_in_progress', 'true');
      sessionStorage.removeItem('primefactor_contest_restart_used');
      sessionStorage.removeItem('primefactor_restarted_session');
      sessionStorage.removeItem('primefactor_restart_penalty');
      localStorage.setItem('exam_in_progress', 'true');
      localStorage.setItem('status', 'NORMAL');
      localStorage.setItem('primefactor_status', 'NORMAL');
    } catch (e) {
      console.warn('Error setting pre-flight exam lock in contract:', e);
    }

    playSound('click');
    window.location.href = examUrl;

    // Failsafe Emergency Listener: If browser thread block halts redirect after 2000ms, unlock
    if (failsafeEmergencyTimeout) clearTimeout(failsafeEmergencyTimeout);
    failsafeEmergencyTimeout = setTimeout(() => {
      unlockEntryButtonForActiveWindow();
    }, 2000);
  };

  // Manual bypass handler for Phase 2
  if (btnEnter) {
    btnEnter.addEventListener('click', (e) => {
      e.preventDefault();
      if (isTransitLocked) return;
      proceedToArena();
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', (e) => {
      e.preventDefault();
      if (isTransitLocked) return;
      if (countdownTimer) clearInterval(countdownTimer);
      if (failsafeEmergencyTimeout) clearTimeout(failsafeEmergencyTimeout);
      playSound('click');
      window.location.href = './ranges.html';
    });
  }

  // Initialize UI in Phase 1 frozen state with first preparation message
  freezeEntryButton('🔒 Preparing (15s)...');
  if (elProgressMsg) {
    elProgressMsg.textContent = PREPARATION_MESSAGES[0];
  }
  if (elProgress) {
    elProgress.style.width = '0%';
  }
  if (elCountdownNum) {
    elCountdownNum.textContent = '30s';
  }

  // 4. Two-Phase Countdown & Sequential Preparation Message Rotation Engine
  countdownTimer = setInterval(() => {
    timeRemaining--;

    // Update countdown numerical badge
    if (elCountdownNum) {
      elCountdownNum.textContent = `${Math.max(0, timeRemaining)}s`;
    }

    // Update progress bar percentage smoothly across 30s
    if (elProgress) {
      const pct = Math.min(100, Math.max(0, ((30 - timeRemaining) / 30) * 100));
      elProgress.style.width = `${pct}%`;
    }

    // Phase 1 (First 15 seconds): Elapsed time goes from 0s to 15s.
    // Map elapsed time (0 to 15) strictly to index 0 through 7.
    const elapsedSeconds = 30 - timeRemaining;
    if (elapsedSeconds <= 15) {
      const msgIndex = Math.min(
        PREPARATION_MESSAGES.length - 1,
        Math.floor((elapsedSeconds / 15) * PREPARATION_MESSAGES.length)
      );
      if (elProgressMsg && !isTransitLocked) {
        elProgressMsg.textContent = PREPARATION_MESSAGES[msgIndex];
      }
    }

    // Phase 2 Transition Trigger: Exact millisecond countdown hits 15s remaining (elapsed = 15s)
    if (timeRemaining === 15) {
      if (elProgressMsg) {
        elProgressMsg.textContent = PREPARATION_MESSAGES[PREPARATION_MESSAGES.length - 1];
      }
      unlockEntryButtonForActiveWindow();
    }

    // Absolute Timeout Escalation: Exact millisecond countdown hits 0s remaining
    if (timeRemaining <= 0) {
      clearInterval(countdownTimer);
      proceedToArena();
    }
  }, 1000);
}