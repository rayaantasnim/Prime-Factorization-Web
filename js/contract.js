/**
 * PrimeFactor.app — Pre-Exam Contract Gatekeeper & Redirection Router
 * Manages target parameters continuity, scoring rule disclosures, anti-cheat isolation advisories,
 * and the automated 30-second forward-escalation countdown to exam.html.
 */

import { initGlobalHeader, renderFooter } from './header.js';
import { getActiveExamParams, setActiveExamParams } from './storage.js';
import { playSound } from './audio.js';

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

  const participationMode = urlParams.get('mode') || storedParams.rules?.participationMode || 'rated';

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

  // Sync to active storage
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
      participationMode
    }
  });

  // Calculate dynamic Pacing Challenge Threshold (< 1.5s per question base or calibrated to tier)
  let pacingThresholdStr = '< 1.5s per question';
  const paceSecondsPerQ = durationSeconds / (questionsCount || 10);
  if (paceSecondsPerQ <= 18) {
    pacingThresholdStr = '< 1.5s per question';
  } else if (paceSecondsPerQ <= 30) {
    pacingThresholdStr = '< 2.5s per question';
  } else if (paceSecondsPerQ <= 60) {
    pacingThresholdStr = '< 4.5s per question';
  } else {
    pacingThresholdStr = '< 8.0s per question';
  }

  // Populate DOM elements
  const elTier = document.getElementById('contract-tier-name');
  const elBounds = document.getElementById('contract-bounds-val');
  const elTime = document.getElementById('contract-time-val');
  const elQuestions = document.getElementById('contract-questions-val');
  const elStrike = document.getElementById('contract-strike-val');
  const elPacing = document.getElementById('expectation-pacing-val');
  const elCountdownNum = document.getElementById('contract-countdown-num');
  const elProgress = document.getElementById('contract-progress-bar');
  const btnEnter = document.getElementById('contract-enter-btn');
  const btnCancel = document.getElementById('contract-cancel-btn');

  if (elTier) elTier.textContent = title;
  if (elBounds) elBounds.textContent = `${min.toLocaleString()} — ${max.toLocaleString()}`;
  if (elTime) elTime.textContent = `${durationMinutes} Minutes (${durationSeconds}s)`;
  if (elQuestions) elQuestions.textContent = `${questionsCount} Questions`;
  if (elPacing) elPacing.textContent = pacingThresholdStr;
  if (elStrike) {
    elStrike.textContent = strikeEnabled ? 'ACTIVE (Disqualification & -10 pts)' : 'BYPASSED (Standard Deductions Only)';
    elStrike.style.color = strikeEnabled ? '#EF4444' : '#10B981';
  }

  // Construct target exam URL preserving full parameters
  const examUrl = `./exam.html?min=${min}&max=${max}&title=${encodeURIComponent(title)}&time=${durationSeconds}&questions=${questionsCount}&strikePenalty=${strikeEnabled}&trackFocus=${trackFocusParam}&mode=${participationMode}&initialPenalty=${initialPenaltyParam}`;

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
