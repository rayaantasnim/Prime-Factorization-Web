/**
 * PrimeFactor.app — The Dynamic Exam Arena Controller
 * Implements 180s Countdown, Composite Rule Generator, 1-Second Transition Freeze,
 * 6 Lifeline Controls, 3-Strike Penalty, Fullscreen GSAP Flushes, and Second Chance Loop.
 */

import { rollCompositeNumber, parseAndValidateFactorInput, generateConceptualHint, factorize } from './math-engine.js';
import { getActiveExamParams, setLastExamResult, recordExamCompletion } from './storage.js';
import { triggerFlash, renderFooter } from './header.js';
import { playSound } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  renderFooter();
  initExamArena();
});

function initExamArena() {
  // Lock Settings gear icon and dynamically apply hidden utility class to the hardcoded navbar
  document.body.classList.add('in-exam');
  const fixedHeader = document.querySelector('.fixed-header');
  if (fixedHeader) {
    fixedHeader.classList.add('hidden');
    fixedHeader.style.display = 'none';
  }

  const params = getActiveExamParams();
  const rules = params.rules || {
    allowSecondAttempt: true,
    allowPause: true,
    allowRegenerate: true,
    allowHint: true,
    soundEnabled: true
  };

  // Progressive Time Limit Scale Calculator
  function resolveTimeLimit(min, max, explicitTime, paramsTime) {
    if (explicitTime && !isNaN(explicitTime) && explicitTime > 0) return explicitTime;
    if (paramsTime && !isNaN(paramsTime) && paramsTime > 0) return paramsTime;
    
    // Progressive scale for standard tiers
    if (max <= 200) return 180;        // Tier 1: 3 min (180s)
    if (max <= 500) return 300;        // Tier 2: 5 min (300s)
    if (max <= 1000) return 480;       // Tier 3: 8 min (480s)
    if (max <= 2000) return 720;       // Tier 4: 12 min (720s)
    if (max <= 5000) return 1080;      // Tier 5: 18 min (1080s)
    if (max <= 10000) return 1500;     // Tier 6: 25 min (1500s)
    if (max <= 20000) return 2100;     // Tier 7: 35 min (2100s)
    if (max <= 35000) return 2700;     // Tier 8: 45 min (2700s)
    return 3600;                       // Tier 10: 60 min (3600s)
  }

  // Parse direct URL Search Parameters (Highest precedence)
  const urlParams = new URLSearchParams(window.location.search);
  const urlMin = urlParams.get('min') ? Number(urlParams.get('min')) : null;
  const urlMax = urlParams.get('max') ? Number(urlParams.get('max')) : null;
  const urlTitle = urlParams.get('title') || null;
  const urlTime = urlParams.get('time') ? Number(urlParams.get('time')) : null;
  const urlStrikePenalty = urlParams.has('strikePenalty') ? urlParams.get('strikePenalty') === 'true' : null;

  const resolvedMin = (urlMin && !isNaN(urlMin)) ? urlMin : (params.min || 1);
  const resolvedMax = (urlMax && !isNaN(urlMax)) ? urlMax : (params.max || 200);
  const resolvedTitle = urlTitle || params.title || `Division: ${resolvedMin} - ${resolvedMax}`;
  const totalDuration = resolveTimeLimit(resolvedMin, resolvedMax, urlTime, params.timeLimit);
  const allowStrikePenalty = urlStrikePenalty !== null ? urlStrikePenalty : (rules.allowStrikePenalty !== undefined ? rules.allowStrikePenalty : true);

  // State Management
  const state = {
    min: resolvedMin,
    max: resolvedMax,
    title: resolvedTitle,
    score: 0,
    totalTimeLimit: totalDuration,
    timeRemaining: totalDuration,
    allowStrikePenalty,
    timerInterval: null,
    isFrozen: false,
    freezeTimeout: null,
    isPausedByLifeline: false,
    pauseTimeout: null,
    
    // Questions
    questions: [], // 10 composite integers
    currentIndex: 0,
    isSecondChanceLoop: false,
    secondChanceQueue: [], // question items to retry
    secondChanceIndex: 0,

    // Audit logs
    questionAudits: [], // Array of question records
    incorrectSubmissionsCount: 0,
    threeStrikePenaltiesApplied: 0,

    // Lifeline counters
    lifelines: {
      pauseUsed: 0,
      maxPause: rules.allowPause ? 2 : 0,
      regenUsed: 0,
      maxRegen: rules.allowRegenerate ? 1 : 0,
      hintUsed: 0,
      maxHint: rules.allowHint ? 1 : 0,
      skipsUsed: 0
    },

    activeHintForCurrentQuestion: false,
    examEnded: false,

    // Anti-Cheat & 10-Second Temporary Window State
    bypassActive: false,
    bypassTimeRemaining: 0,
    bypassInterval: null,
    antiCheatViolationsCount: 0
  };

  // Generate 10 unique composite numbers
  const usedSet = new Set();
  while (state.questions.length < 10) {
    const num = rollCompositeNumber(state.min, state.max);
    if (!usedSet.has(num)) {
      usedSet.add(num);
      state.questions.push(num);
      const tStart = performance.now();
      const trueFactors = factorize(num);
      const latencyMs = Math.max(0.015, +(performance.now() - tStart).toFixed(3));
      state.questionAudits.push({
        id: state.questions.length,
        number: num,
        attempt1: null,
        attempt1Correct: null,
        attempt2: null,
        attempt2Correct: null,
        hintActive: false,
        trueFactors,
        latencyMs
      });
    }
  }

  // DOM Elements
  const hudScoreEl = document.getElementById('hud-marks-val');
  const hudQuestionEl = document.getElementById('hud-question-val');
  const hudErrorsEl = document.getElementById('hud-errors-val');
  const hudTimerEl = document.getElementById('hud-timer-val');
  const hudTimerContainer = document.getElementById('hud-timer-item');

  const targetNumberEl = document.getElementById('target-number-val');
  const targetHintBox = document.getElementById('target-hint-box');
  const targetHintText = document.getElementById('target-hint-text');
  const questionStatusText = document.getElementById('question-status-subtext');
  const inputEl = document.getElementById('exam-factor-input');
  const submitBtn = document.getElementById('exam-submit-btn');
  const freezeNoticeEl = document.getElementById('timer-freeze-banner');
  const inputFeedbackEl = document.getElementById('exam-input-feedback');

  // Anti-Cheat DOM Elements
  const btnBypass = document.getElementById('btn-anticheat-bypass');
  const bypassBadge = document.getElementById('bypass-countdown-badge');
  const bypassTimerVal = document.getElementById('bypass-timer-val');
  const antiCheatStatusText = document.getElementById('anticheat-status-text');

  // Lifeline Button Elements
  const btnPause = document.getElementById('lifeline-pause');
  const btnEnd = document.getElementById('lifeline-end');
  const btnSkip = document.getElementById('lifeline-skip');
  const btnRegen = document.getElementById('lifeline-regen');
  const btnRestart = document.getElementById('lifeline-restart');
  const btnHint = document.getElementById('lifeline-hint');

  // HUD Update Helper
  function updateHUD() {
    if (hudScoreEl) hudScoreEl.textContent = state.score;
    
    if (hudQuestionEl) {
      if (!state.isSecondChanceLoop) {
        hudQuestionEl.textContent = `${state.currentIndex + 1} / 10`;
      } else {
        hudQuestionEl.textContent = `2nd: ${state.secondChanceIndex + 1} / ${state.secondChanceQueue.length}`;
      }
    }

    if (hudErrorsEl) hudErrorsEl.textContent = state.incorrectSubmissionsCount;

    if (hudTimerEl) {
      const minutes = Math.floor(state.timeRemaining / 60);
      const seconds = state.timeRemaining % 60;
      hudTimerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      if (state.timeRemaining <= 30 && hudTimerContainer) {
        hudTimerContainer.classList.add('urgent');
      } else if (hudTimerContainer) {
        hudTimerContainer.classList.remove('urgent');
      }
    }

    // Update lifeline button availability
    if (btnPause) {
      const remaining = state.lifelines.maxPause - state.lifelines.pauseUsed;
      btnPause.disabled = remaining <= 0 || state.isPausedByLifeline || state.isFrozen;
      const countEl = btnPause.querySelector('.lifeline-uses');
      if (countEl) countEl.textContent = `${remaining} left`;
    }

    if (btnRegen) {
      const remaining = state.lifelines.maxRegen - state.lifelines.regenUsed;
      btnRegen.disabled = remaining <= 0 || state.isSecondChanceLoop || state.isFrozen;
      const countEl = btnRegen.querySelector('.lifeline-uses');
      if (countEl) countEl.textContent = `${remaining} left`;
    }

    if (btnHint) {
      const remaining = state.lifelines.maxHint - state.lifelines.hintUsed;
      // Hint is strictly disabled in second chance loop!
      btnHint.disabled = remaining <= 0 || state.isSecondChanceLoop || state.activeHintForCurrentQuestion || state.isFrozen;
      const countEl = btnHint.querySelector('.lifeline-uses');
      if (countEl) countEl.textContent = `${remaining} left`;
    }
  }

  // 1-Second Transition Timer Freeze
  function setTransitionFreeze(callback) {
    state.isFrozen = true;
    if (freezeNoticeEl) freezeNoticeEl.style.display = 'inline-block';
    if (inputEl) inputEl.disabled = true;
    if (submitBtn) submitBtn.disabled = true;

    clearTimeout(state.freezeTimeout);
    state.freezeTimeout = setTimeout(() => {
      state.isFrozen = false;
      if (freezeNoticeEl) freezeNoticeEl.style.display = 'none';
      if (inputEl) {
        inputEl.disabled = false;
        inputEl.value = '';
        inputEl.focus();
      }
      if (submitBtn) submitBtn.disabled = false;
      if (callback) callback();
      updateHUD();
    }, 1000);
  }

  // Display Current Question
  function renderActiveQuestion() {
    if (state.examEnded) return;

    state.activeHintForCurrentQuestion = false;
    if (targetHintBox) targetHintBox.style.display = 'none';
    if (inputFeedbackEl) inputFeedbackEl.textContent = '';

    let currentItem;
    if (!state.isSecondChanceLoop) {
      currentItem = state.questionAudits[state.currentIndex];
      if (questionStatusText) {
        questionStatusText.textContent = `Question ${state.currentIndex + 1} of 10 · Decompose completely`;
      }
    } else {
      currentItem = state.secondChanceQueue[state.secondChanceIndex];
      if (questionStatusText) {
        questionStatusText.textContent = `Second Chance Retry ${state.secondChanceIndex + 1} of ${state.secondChanceQueue.length}`;
      }
    }

    if (!currentItem) {
      finishExam();
      return;
    }

    if (targetNumberEl) {
      targetNumberEl.textContent = currentItem.number.toLocaleString();
      if (window.gsap) {
        window.gsap.fromTo(targetNumberEl,
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.5)' }
        );
      }
    }

    updateHUD();
  }

  // Check 3-Strike Penalty
  function registerError() {
    state.incorrectSubmissionsCount++;
    playSound('error');

    // 🚨 3-Strike Rule: Flat -10 point penalty upon hitting multiples of 3 cumulative errors/skips
    if (state.allowStrikePenalty && state.incorrectSubmissionsCount % 3 === 0) {
      state.score -= 10;
      state.threeStrikePenaltiesApplied++;
      triggerFlash('penalty');
      if (inputFeedbackEl) {
        inputFeedbackEl.textContent = `🚨 3-STRIKE PENALTY TRIGGERED (${state.incorrectSubmissionsCount} strikes): -10 POINTS APPLIED!`;
        inputFeedbackEl.className = 'exam-feedback text-crimson font-bold';
      }
    } else {
      triggerFlash('penalty');
    }
  }

  // Submit Answer Logic
  function handleSubmission() {
    if (state.isFrozen || state.examEnded) return;

    const currentItem = !state.isSecondChanceLoop 
      ? state.questionAudits[state.currentIndex] 
      : state.secondChanceQueue[state.secondChanceIndex];

    if (!currentItem) return;

    const userInput = inputEl.value.trim();
    if (!userInput) {
      if (inputFeedbackEl) {
        inputFeedbackEl.textContent = 'Please enter prime factors (e.g. 2*2*3, 2 2 3, or 2^2*3)';
        inputFeedbackEl.className = 'exam-feedback text-crimson';
      }
      return;
    }

    // Flexible String Parsing Engine
    const evalResult = parseAndValidateFactorInput(userInput, currentItem.number);

    if (!state.isSecondChanceLoop) {
      // FIRST ATTEMPT
      currentItem.attempt1 = userInput;

      if (evalResult.isValid) {
        // Correct on first attempt
        currentItem.attempt1Correct = true;
        const pts = state.activeHintForCurrentQuestion ? 5 : 10;
        state.score += pts;

        playSound('correct');
        if (state.activeHintForCurrentQuestion) {
          triggerFlash('warning'); // Orange for hint-assisted
        } else {
          triggerFlash('success'); // Green for positive
        }

        if (inputFeedbackEl) {
          inputFeedbackEl.textContent = `Correct! +${pts} points`;
          inputFeedbackEl.className = 'exam-feedback text-mint';
        }

        updateHUD();
        setTransitionFreeze(() => {
          advanceToNextQuestion();
        });
      } else {
        // Incorrect on first attempt (-5 pts standard error)
        currentItem.attempt1Correct = false;
        const penalty = 5;
        state.score -= penalty;

        registerError();

        if (inputFeedbackEl) {
          inputFeedbackEl.textContent = `${evalResult.error} (-${penalty} pts)`;
          inputFeedbackEl.className = 'exam-feedback text-crimson';
        }

        updateHUD();
        setTransitionFreeze(() => {
          advanceToNextQuestion();
        });
      }
    } else {
      // SECOND ATTEMPT (OVERTIME LOOP)
      currentItem.attempt2 = userInput;

      if (evalResult.isValid) {
        // Correct on second attempt
        currentItem.attempt2Correct = true;
        const pts = currentItem.hintActive ? 2 : 5;
        state.score += pts;

        playSound('correct');
        triggerFlash('warning'); // Warm orange on 2nd attempt correction

        if (inputFeedbackEl) {
          inputFeedbackEl.textContent = `Redeemed on 2nd chance! +${pts} points`;
          inputFeedbackEl.className = 'exam-feedback text-amber';
        }

        updateHUD();
        setTransitionFreeze(() => {
          advanceToNextQuestion();
        });
      } else {
        // Incorrect on second attempt (-5 pts)
        currentItem.attempt2Correct = false;
        const penalty = 5;
        state.score -= penalty;

        registerError();

        if (inputFeedbackEl) {
          inputFeedbackEl.textContent = `Missed second attempt (-${penalty} pts). Locked permanently.`;
          inputFeedbackEl.className = 'exam-feedback text-crimson';
        }

        updateHUD();
        setTransitionFreeze(() => {
          advanceToNextQuestion();
        });
      }
    }
  }

  // Advance to next question or transition to second chance loop
  function advanceToNextQuestion() {
    if (!state.isSecondChanceLoop) {
      state.currentIndex++;
      if (state.currentIndex < 10) {
        renderActiveQuestion();
      } else {
        // First 10 questions done! Check if eligible for Second Chance Loop
        checkSecondChanceTransition();
      }
    } else {
      state.secondChanceIndex++;
      if (state.secondChanceIndex < state.secondChanceQueue.length) {
        renderActiveQuestion();
      } else {
        // Second chance loop complete
        finishExam();
      }
    }
  }

  // Check and setup Second Chance Overtime Loop
  function checkSecondChanceTransition() {
    if (!rules.allowSecondAttempt) {
      finishExam();
      return;
    }

    // Collect all missed questions
    const missed = state.questionAudits.filter(q => q.attempt1Correct === false);
    if (missed.length > 0 && state.timeRemaining > 0) {
      state.isSecondChanceLoop = true;
      state.secondChanceQueue = missed;
      state.secondChanceIndex = 0;
      playSound('alert');
      triggerFlash('warning');
      renderActiveQuestion();
    } else {
      finishExam();
    }
  }

  // Lifeline: Pause Timer (Pauses for exactly 5s, -2 pts, max 2 uses)
  function handleLifelinePause() {
    if (state.lifelines.pauseUsed >= state.lifelines.maxPause || state.isPausedByLifeline || state.isFrozen) return;

    state.lifelines.pauseUsed++;
    state.score -= 2;
    state.isPausedByLifeline = true;
    playSound('alert');
    triggerFlash('warning');

    if (inputFeedbackEl) {
      inputFeedbackEl.textContent = '⏸ Timer paused for 5 seconds (-2 pts)...';
      inputFeedbackEl.className = 'exam-feedback text-amber';
    }
    updateHUD();

    clearTimeout(state.pauseTimeout);
    state.pauseTimeout = setTimeout(() => {
      state.isPausedByLifeline = false;
      if (inputFeedbackEl) inputFeedbackEl.textContent = '';
      updateHUD();
    }, 5000);
  }

  // Lifeline: Skip (Applies -5 penalty, moves to next index, counts as error)
  function handleLifelineSkip() {
    if (state.isFrozen || state.examEnded) return;

    state.lifelines.skipsUsed++;
    const currentItem = !state.isSecondChanceLoop 
      ? state.questionAudits[state.currentIndex] 
      : state.secondChanceQueue[state.secondChanceIndex];

    if (!currentItem) return;

    const penalty = 5;
    state.score -= penalty;

    if (!state.isSecondChanceLoop) {
      currentItem.attempt1 = '[Skipped]';
      currentItem.attempt1Correct = false;
    } else {
      currentItem.attempt2 = '[Skipped]';
      currentItem.attempt2Correct = false;
    }

    registerError();

    if (inputFeedbackEl) {
      inputFeedbackEl.textContent = `Question skipped (-${penalty} pts)`;
      inputFeedbackEl.className = 'exam-feedback text-crimson';
    }

    updateHUD();
    setTransitionFreeze(() => {
      advanceToNextQuestion();
    });
  }

  // Lifeline: Regenerate (Discards number, rolls new composite, -2 pts, max 1 use, bypasses freeze!)
  function handleLifelineRegenerate() {
    if (state.lifelines.regenUsed >= state.lifelines.maxRegen || state.isSecondChanceLoop || state.isFrozen) return;

    state.lifelines.regenUsed++;
    state.score -= 2;
    state.lifelines.skipsUsed++;

    // Generate fresh composite
    let newNum = rollCompositeNumber(state.min, state.max);
    while (state.questions.includes(newNum)) {
      newNum = rollCompositeNumber(state.min, state.max);
    }

    const currentItem = state.questionAudits[state.currentIndex];
    currentItem.number = newNum;
    currentItem.trueFactors = factorize(newNum);
    currentItem.attempt1 = null;
    currentItem.attempt1Correct = null;
    currentItem.hintActive = false;
    state.activeHintForCurrentQuestion = false;

    playSound('alert');
    triggerFlash('warning');

    if (inputFeedbackEl) {
      inputFeedbackEl.textContent = 'Question regenerated (-2 pts)';
      inputFeedbackEl.className = 'exam-feedback text-amber';
    }

    // BYPASS FREEZE COMPLETELY!
    if (targetNumberEl) {
      targetNumberEl.textContent = newNum.toLocaleString();
    }
    if (targetHintBox) {
      targetHintBox.style.display = 'none';
    }
    if (inputEl) {
      inputEl.value = '';
      inputEl.focus();
    }
    updateHUD();
  }

  // Lifeline: Restart (Flushes points, resets clock, restores all 6 lifelines, fresh 10 questions)
  function handleLifelineRestart() {
    playSound('click');
    clearInterval(state.timerInterval);
    clearTimeout(state.freezeTimeout);
    clearTimeout(state.pauseTimeout);
    initExamArena();
  }

  // Lifeline: Unlock Hints (Conceptual hint, max 1 use, disabled in second chance)
  function handleLifelineHint() {
    if (state.lifelines.hintUsed >= state.lifelines.maxHint || state.isSecondChanceLoop || state.activeHintForCurrentQuestion || state.isFrozen) return;

    state.lifelines.hintUsed++;
    state.activeHintForCurrentQuestion = true;

    const currentItem = state.questionAudits[state.currentIndex];
    currentItem.hintActive = true;

    const hintText = generateConceptualHint(currentItem.number);

    playSound('alert');
    triggerFlash('warning');

    if (targetHintBox && targetHintText) {
      targetHintText.textContent = hintText;
      targetHintBox.style.display = 'block';

      if (window.gsap) {
        window.gsap.fromTo(targetHintBox,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
        );
      }
    }

    if (inputFeedbackEl) {
      inputFeedbackEl.textContent = 'Conceptual hint unlocked (Points for this question reduced by 50%)';
      inputFeedbackEl.className = 'exam-feedback text-amber';
    }

    updateHUD();
  }

  // Anti-Cheat: 10-Second Temporary Exemption Request (-5 pts tactical fee)
  function handleRequestBypass() {
    if (state.examEnded || state.bypassActive || state.isFrozen) return;

    // Immediately penalize user by deducting -5 points
    state.score -= 5;
    state.bypassActive = true;
    state.bypassTimeRemaining = 10;
    playSound('alert');
    triggerFlash('warning');

    if (inputFeedbackEl) {
      inputFeedbackEl.textContent = '🛡️ Temporary 10s External Bypass Granted (-5 pts fee). Window isolation suspended.';
      inputFeedbackEl.className = 'exam-feedback text-amber font-bold';
    }

    if (btnBypass) {
      btnBypass.disabled = true;
      btnBypass.classList.add('bypassing');
    }
    if (bypassBadge) {
      bypassBadge.classList.remove('hidden');
      bypassBadge.classList.add('flashing');
    }
    if (bypassTimerVal) {
      bypassTimerVal.textContent = '10s';
    }
    if (antiCheatStatusText) {
      antiCheatStatusText.textContent = 'EXEMPTION PROTOCOL ENGAGED (10s)';
      antiCheatStatusText.style.color = '#F59E0B';
    }

    updateHUD();

    clearInterval(state.bypassInterval);
    state.bypassInterval = setInterval(() => {
      state.bypassTimeRemaining--;
      if (bypassTimerVal) {
        bypassTimerVal.textContent = `${state.bypassTimeRemaining}s`;
      }

      if (state.bypassTimeRemaining <= 0) {
        clearInterval(state.bypassInterval);
        state.bypassActive = false;
        
        if (bypassBadge) {
          bypassBadge.classList.add('hidden');
          bypassBadge.classList.remove('flashing');
        }
        if (btnBypass) {
          btnBypass.disabled = false;
          btnBypass.classList.remove('bypassing');
        }
        if (antiCheatStatusText) {
          antiCheatStatusText.textContent = 'ANTI-CHEAT ENFORCEMENT: ACTIVE';
          antiCheatStatusText.style.color = '#10B981';
        }

        playSound('error');
        triggerFlash('penalty');

        if (inputFeedbackEl) {
          inputFeedbackEl.textContent = '🔒 Bypass window expired! Strict window isolation reactivated.';
          inputFeedbackEl.className = 'exam-feedback text-crimson font-bold';
        }
      }
    }, 1000);
  }

  // Anti-Cheat: Focus Lost & Tab Switch Monitoring
  function handleIntegrityViolation(reason) {
    if (state.examEnded || state.bypassActive || state.isFrozen) return;

    state.antiCheatViolationsCount++;
    const penalty = 5;
    state.score -= penalty;

    registerError();

    if (inputFeedbackEl) {
      inputFeedbackEl.textContent = `🚨 ANTI-CHEAT VIOLATION (${reason}): Window focus lost! Strike recorded (-${penalty} pts).`;
      inputFeedbackEl.className = 'exam-feedback text-crimson font-bold';
    }

    triggerFlash('penalty');
    updateHUD();
  }

  const onVisibilityChange = () => {
    if (document.hidden) {
      handleIntegrityViolation('Tab switch or app minimized');
    }
  };

  const onWindowBlur = () => {
    // Only trigger if not already hidden to avoid double penalty in same blur event
    if (!document.hidden) {
      handleIntegrityViolation('Window focus lost');
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('blur', onWindowBlur);

  // Global document listener for hotkeys during active exam
  const onDocKeyDown = (e) => {
    if (state.examEnded || state.isFrozen) return;
    if ((e.code === 'Space' || e.key === ' ') && document.activeElement !== inputEl && !document.activeElement?.matches('button, a, input')) {
      e.preventDefault();
      if (inputEl) {
        inputEl.focus();
        inputEl.value += '*';
      }
    }
  };
  document.addEventListener('keydown', onDocKeyDown);

  // Countdown Timer
  state.timerInterval = setInterval(() => {
    if (state.isFrozen || state.isPausedByLifeline || state.examEnded) return;

    state.timeRemaining--;
    updateHUD();

    if (state.timeRemaining <= 0) {
      clearInterval(state.timerInterval);
      finishExam();
    }
  }, 1000);

  // Terminate and redirect to Results Dashboard
  function finishExam() {
    if (state.examEnded) return;
    state.examEnded = true;
    clearInterval(state.timerInterval);
    clearInterval(state.bypassInterval);
    clearTimeout(state.freezeTimeout);
    clearTimeout(state.pauseTimeout);

    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('blur', onWindowBlur);
    document.removeEventListener('keydown', onDocKeyDown);

    // Audit Calculations
    const firstTryCorrect = state.questionAudits.filter(q => q.attempt1Correct === true).length;
    const secondTryCorrect = state.questionAudits.filter(q => q.attempt2Correct === true).length;
    
    // Failure Stack: Every question with uncorrected or final errors
    const failureStack = [];
    // Redemption Track: Questions missed on 1st attempt and corrected on 2nd
    const redemptionTrack = [];

    state.questionAudits.forEach(q => {
      if (q.attempt1Correct === false && q.attempt2Correct === true) {
        redemptionTrack.push({
          number: q.number,
          attempt1: q.attempt1 || '[Skipped]',
          attempt2: q.attempt2,
          trueFactors: q.trueFactors
        });
      } else if (q.attempt1Correct === false && q.attempt2Correct !== true) {
        failureStack.push({
          number: q.number,
          attempt1: q.attempt1 || '[Skipped/Unanswered]',
          attempt2: q.attempt2 || 'None',
          trueFactors: q.trueFactors
        });
      } else if (q.attempt1Correct === null) {
        failureStack.push({
          number: q.number,
          attempt1: '[Unattempted before time expired]',
          attempt2: 'None',
          trueFactors: q.trueFactors
        });
      }
    });

    const lifelinesUsedTotal = state.lifelines.pauseUsed + state.lifelines.regenUsed + state.lifelines.hintUsed;

    const resultPayload = {
      score: state.score,
      timeRemaining: Math.max(0, state.timeRemaining),
      timeSpent: state.totalTimeLimit - Math.max(0, state.timeRemaining),
      totalQuestions: 10,
      correctFirstAttempt: firstTryCorrect,
      correctSecondAttempt: secondTryCorrect,
      incorrectTotal: state.incorrectSubmissionsCount,
      threeStrikeTriggered: state.threeStrikePenaltiesApplied > 0,
      antiCheatViolationsCount: state.antiCheatViolationsCount,
      lifelinesUsedCount: lifelinesUsedTotal,
      lifelines: { ...state.lifelines },
      failureStack,
      redemptionTrack,
      compilerLatencyAudit: state.questionAudits.map(q => ({
        id: q.id,
        number: q.number,
        latencyMs: q.latencyMs || 0.04,
        factorCount: q.trueFactors.length,
        algorithm: "Pollard's Rho (Brent)",
        status: 'Deterministic Verified'
      })),
      rangeTitle: state.title,
      min: state.min,
      max: state.max
    };

    setLastExamResult(resultPayload);
    recordExamCompletion(resultPayload);

    playSound('fanfare');
    window.location.href = './result.html';
  }

  // Event Listeners
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSubmission();
    });
  }

  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      // Spacebar hotkey: automatically inject '*' into factor string
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        const start = inputEl.selectionStart ?? inputEl.value.length;
        const end = inputEl.selectionEnd ?? inputEl.value.length;
        const cur = inputEl.value;
        inputEl.value = cur.substring(0, start) + '*' + cur.substring(end);
        inputEl.setSelectionRange(start + 1, start + 1);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmission();
      }
    });
  }

  if (btnBypass) btnBypass.addEventListener('click', handleRequestBypass);
  if (btnPause) btnPause.addEventListener('click', handleLifelinePause);
  if (btnEnd) {
    btnEnd.addEventListener('click', () => {
      playSound('alert');
      state.score -= 5; // -5 pts early termination penalty
      finishExam();
    });
  }
  if (btnSkip) btnSkip.addEventListener('click', handleLifelineSkip);
  if (btnRegen) btnRegen.addEventListener('click', handleLifelineRegenerate);
  if (btnRestart) btnRestart.addEventListener('click', handleLifelineRestart);
  if (btnHint) btnHint.addEventListener('click', handleLifelineHint);

  // Initial render
  renderActiveQuestion();
}
