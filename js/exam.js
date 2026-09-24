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

  // State Management
  const state = {
    min: params.min || 1,
    max: params.max || 200,
    title: params.title || 'Standard Arena',
    score: 0,
    timeRemaining: 180,
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
    examEnded: false
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

    // 🚨 3-Strike Rule: Flat -10 point penalty upon hitting exactly 3 errors
    if (state.incorrectSubmissionsCount === 3) {
      state.score -= 10;
      state.threeStrikePenaltiesApplied++;
      triggerFlash('penalty');
      if (inputFeedbackEl) {
        inputFeedbackEl.textContent = '🚨 3-STRIKE PENALTY TRIGGERED: -10 POINTS APPLIED!';
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
        triggerFlash('success');

        if (inputFeedbackEl) {
          inputFeedbackEl.textContent = `Correct! +${pts} points`;
          inputFeedbackEl.className = 'exam-feedback text-mint';
        }

        updateHUD();
        setTransitionFreeze(() => {
          advanceToNextQuestion();
        });
      } else {
        // Incorrect on first attempt
        currentItem.attempt1Correct = false;
        const penalty = state.activeHintForCurrentQuestion ? 5 : 2;
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
        // Incorrect on second attempt
        currentItem.attempt2Correct = false;
        const penalty = currentItem.hintActive ? 5 : 2;
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

  // Lifeline: Pause Timer (Pauses for exactly 5s, max 2 uses)
  function handleLifelinePause() {
    if (state.lifelines.pauseUsed >= state.lifelines.maxPause || state.isPausedByLifeline || state.isFrozen) return;

    state.lifelines.pauseUsed++;
    state.isPausedByLifeline = true;
    playSound('alert');
    triggerFlash('warning');

    if (inputFeedbackEl) {
      inputFeedbackEl.textContent = '⏸ Timer paused for 5 seconds...';
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

  // Lifeline: Skip (Applies -2 penalty, moves to next index)
  function handleLifelineSkip() {
    if (state.isFrozen || state.examEnded) return;

    state.lifelines.skipsUsed++;
    const currentItem = !state.isSecondChanceLoop 
      ? state.questionAudits[state.currentIndex] 
      : state.secondChanceQueue[state.secondChanceIndex];

    if (!currentItem) return;

    const penalty = state.activeHintForCurrentQuestion ? 5 : 2;
    state.score -= penalty;

    if (!state.isSecondChanceLoop) {
      currentItem.attempt1 = '[Skipped]';
      currentItem.attempt1Correct = false;
    } else {
      currentItem.attempt2 = '[Skipped]';
      currentItem.attempt2Correct = false;
    }

    playSound('error');
    triggerFlash('penalty');

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
    clearTimeout(state.freezeTimeout);
    clearTimeout(state.pauseTimeout);

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
      timeSpent: 180 - Math.max(0, state.timeRemaining),
      totalQuestions: 10,
      correctFirstAttempt: firstTryCorrect,
      correctSecondAttempt: secondTryCorrect,
      incorrectTotal: state.incorrectSubmissionsCount,
      threeStrikeTriggered: state.threeStrikePenaltiesApplied > 0,
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
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmission();
      }
    });
  }

  if (btnPause) btnPause.addEventListener('click', handleLifelinePause);
  if (btnEnd) {
    btnEnd.addEventListener('click', () => {
      playSound('alert');
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
