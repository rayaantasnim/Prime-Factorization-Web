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
  // 30-SECOND AUTOMATED ESCALATION & INPUT FREEZE GATE
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

  let timeRemaining = 30;
  let isTransitLocked = false;
  let countdownTimer = null;
  let failsafeEmergencyTimeout = null;

  // 1. Gate Accessibility Lockout: Freeze entry button during active escalation countdown
  const freezeEntryButton = (buttonText = 'Getting Ready...') => {
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

  // 2. Failsafe Emergency Unlock Gate: Lift freeze if browser thread/network stalls transit
  const unlockEntryButtonForManualBypass = () => {
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
      <span>Authorize &amp; Enter Arena &gt;</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 0.5rem; vertical-align: middle;">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `;

    if (elProgressMsg) {
      elProgressMsg.textContent = '🚀 Subsystems Ready — Click to Enter Arena manually';
    }
  };

  // 3. Execution of Secure Transit to exam.html with Anti-Duplicate Protection
  const proceedToArena = () => {
    if (isTransitLocked) return;
    isTransitLocked = true; // Anti-duplicate double-click lock

    // Stop active timers
    if (countdownTimer) clearInterval(countdownTimer);

    // Freeze button with mandatory redirection text strictly: "⚡ Redirecting to Live Arena..."
    freezeEntryButton('⚡ Redirecting to Live Arena...');

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
      unlockEntryButtonForManualBypass();
    }, 2000);
  };

  // Manual bypass handler (active ONLY after Failsafe Emergency Unlock)
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
      if (countdownTimer) clearInterval(countdownTimer);
      if (failsafeEmergencyTimeout) clearTimeout(failsafeEmergencyTimeout);
      playSound('click');
      window.location.href = './ranges.html';
    });
  }

  // Initialize UI in frozen state with first preparation message
  freezeEntryButton('Getting Ready...');
  if (elProgressMsg) {
    elProgressMsg.textContent = PREPARATION_MESSAGES[0];
  }
  if (elProgress) {
    elProgress.style.width = '0%';
  }
  if (elCountdownNum) {
    elCountdownNum.textContent = '30s';
  }

  // 4. Automated 30s Countdown & Sequential Preparation Message Rotation
  countdownTimer = setInterval(() => {
    timeRemaining--;

    // Update countdown numerical badge
    if (elCountdownNum) {
      elCountdownNum.textContent = `${Math.max(0, timeRemaining)}s`;
    }

    // Update progress bar percentage smoothly
    if (elProgress) {
      const pct = Math.min(100, Math.max(0, ((30 - timeRemaining) / 30) * 100));
      elProgress.style.width = `${pct}%`;
    }

    // Rotate 8 Sequential Compact Preparation Messages every 3.5 seconds
    const elapsedSeconds = 30 - timeRemaining;
    const msgIndex = Math.min(
      PREPARATION_MESSAGES.length - 1,
      Math.floor(elapsedSeconds / 3.5)
    );
    if (elProgressMsg && !isTransitLocked) {
      elProgressMsg.textContent = PREPARATION_MESSAGES[msgIndex];
    }

    // The exact millisecond the 30 seconds expire: trigger automatic forward redirection
    if (timeRemaining <= 0) {
      clearInterval(countdownTimer);
      proceedToArena();
    }
  }, 1000);
}
