/**
 * PrimeFactor.app — Dynamic Exam Arena Controller Module Reference
 * Exports Move Evaluation Engine, Thermodynamic Audio Tension Engine,
 * and High-Bound Honey Spot Suppression Gate for the Exam Arena.
 */

export * from './move-evaluator.js';
export {
  startExamTensionAtmosphere,
  stopExamTensionAtmosphere,
  updateExamTensionTelemetry,
  getExamTensionState,
  playSound
} from './audio.js';
export {
  rollCompositeNumber,
  isHoneySpotSuppressed,
  isDeceptiveSymmetricCandidate,
  factorize,
  parseAndValidateFactorInput
} from './math-engine.js';

// Browser global window attachment for seamless telemetry debugging & integration
import { updateThermodynamicState } from './three-particles.js';

/**
 * 1. SUB-SECOND FACTOR COMBO STRIKE METER
 * High-fidelity metrics tracking object for rapid mental factorization.
 * Conditions for +1 combo increment:
 * - Complete, valid prime factor sequence
 * - Absolutely ZERO Backspace or Delete keystrokes logged across the question
 * - Sub-second input duration (< 1.0s per discrete factor token)
 *
 * Chain Reward:
 * - Reaching consecutive streak of 3 triggers custom glass-morphic neon animation flash
 * - Appends dynamic +2 ELO bonus point calculation tracking token to the active match payload
 * - Any errant token or backspace instantly resets the active multiplier to 0.
 */
export const activeComboStrikeState = {
  comboStreak: 0,
  maxStreak: 0,
  hasInvalidKeyOrBackspace: false,
  backspaceCount: 0,
  questionStartTime: 0,
  currentFactorCount: 1,
  bonusEloTokens: 0, // Count of +2 ELO bonus tokens awarded
  bonusEloPoints: 0, // Cumulative bonus ELO points (+2 per streak of 3)
  history: [],

  resetForQuestion(targetNumber, factorCount = 1) {
    this.hasInvalidKeyOrBackspace = false;
    this.backspaceCount = 0;
    this.questionStartTime = performance.now();
    this.currentFactorCount = Math.max(1, Number(factorCount) || 1);
  },

  logKey(event) {
    if (!event || !event.key) return;
    const key = event.key;

    // Strict drop rule: Backspace or Delete instantly drops combo to 0
    if (key === 'Backspace' || key === 'Delete') {
      this.hasInvalidKeyOrBackspace = true;
      this.backspaceCount++;
      const wasActive = this.comboStreak > 0;
      this.comboStreak = 0;
      this.notifyUI({ dropped: wasActive, reason: 'backspace' });
      return;
    }

    // Check for errant input token: Allowed keys are 0-9, '*', '^', space, Enter, and navigation/clipboard controls
    const isModifier = event.ctrlKey || event.metaKey || event.altKey;
    const isNavigation = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Escape'].includes(key);
    const isValidTokenChar = /^[0-9*^ ]$/.test(key) || key === 'Enter';

    if (!isModifier && !isNavigation && !isValidTokenChar) {
      this.hasInvalidKeyOrBackspace = true;
      const wasActive = this.comboStreak > 0;
      this.comboStreak = 0;
      this.notifyUI({ dropped: wasActive, reason: 'errant_token' });
    }
  },

  evaluateSubmission({ isCorrect, factorCount, responseDuration }) {
    if (!isCorrect) {
      // Errant calculation: instant reset to 0
      const wasActive = this.comboStreak > 0;
      this.comboStreak = 0;
      this.notifyUI({ dropped: wasActive, reason: 'incorrect_submission' });
      return {
        comboStreak: 0,
        rewarded: false,
        isFlawlessSubSecond: false,
        secondsPerToken: 0,
        bonusEloPoints: this.bonusEloPoints,
        bonusEloTokens: this.bonusEloTokens
      };
    }

    const duration = responseDuration !== undefined 
      ? Number(responseDuration) 
      : (performance.now() - this.questionStartTime) / 1000;
    
    const count = Math.max(1, Number(factorCount) || this.currentFactorCount || 1);
    const secondsPerToken = duration / count;

    // Strict validation conditions:
    // 1. Zero Backspace / Delete keys
    // 2. No errant character tokens logged
    // 3. Clocks strictly beneath 1.0 second per factor token (< 1.0s)
    const isFlawlessSubSecond = (!this.hasInvalidKeyOrBackspace && this.backspaceCount === 0) && (secondsPerToken < 1.0);

    let rewarded = false;

    if (isFlawlessSubSecond) {
      this.comboStreak += 1;
      if (this.comboStreak > this.maxStreak) {
        this.maxStreak = this.comboStreak;
      }

      // Consecutive Chain Reward: Every multiple of 3 flawless questions
      if (this.comboStreak >= 3 && this.comboStreak % 3 === 0) {
        rewarded = true;
        this.bonusEloTokens += 1;
        this.bonusEloPoints += 2; // Dynamic +2 ELO bonus tracking token
        triggerGlassmorphicComboFlash();
      }
    } else {
      // Failed sub-second timing or had backspaces
      this.comboStreak = 0;
    }

    this.history.push({
      duration,
      count,
      secondsPerToken,
      flawless: isFlawlessSubSecond,
      comboStreak: this.comboStreak,
      rewarded
    });

    this.notifyUI({ rewarded, secondsPerToken, flawless: isFlawlessSubSecond });

    return {
      comboStreak: this.comboStreak,
      maxStreak: this.maxStreak,
      rewarded,
      isFlawlessSubSecond,
      secondsPerToken,
      bonusEloPoints: this.bonusEloPoints,
      bonusEloTokens: this.bonusEloTokens
    };
  },

  resetAll() {
    this.comboStreak = 0;
    this.maxStreak = 0;
    this.hasInvalidKeyOrBackspace = false;
    this.backspaceCount = 0;
    this.questionStartTime = 0;
    this.bonusEloTokens = 0;
    this.bonusEloPoints = 0;
    this.history = [];
    this.notifyUI({ reset: true });
  },

  notifyUI(extra = {}) {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('combostrike:update', {
        detail: {
          comboStreak: this.comboStreak,
          maxStreak: this.maxStreak,
          bonusEloPoints: this.bonusEloPoints,
          bonusEloTokens: this.bonusEloTokens,
          hasInvalidKeyOrBackspace: this.hasInvalidKeyOrBackspace,
          ...extra
        }
      }));
    }
  }
};

/**
 * Custom Glass-morphic Neon Viewport Flash Animation
 * Ignites upon achieving a consecutive 3-flawless chain reward.
 */
export function triggerGlassmorphicComboFlash() {
  if (typeof document === 'undefined') return;
  const overlay = document.getElementById('flash-overlay');
  if (!overlay) return;

  overlay.className = '';
  overlay.classList.add('flash-glass-neon-combo');

  if (window.gsap) {
    window.gsap.killTweensOf(overlay);
    window.gsap.fromTo(overlay,
      { opacity: 1, scale: 1.03 },
      { opacity: 0, scale: 1, duration: 0.65, ease: 'power3.out' }
    );
  } else {
    overlay.style.opacity = '1';
    setTimeout(() => {
      overlay.style.transition = 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1)';
      overlay.style.opacity = '0';
    }, 20);
  }
}

/**
 * Explicit Thermodynamic Canvas State Interface
 * Forwards chess-style move classification reports to the 3D particle mesh.
 */
export function dispatchThermodynamicResponse(classification) {
  return updateThermodynamicState(classification);
}

/**
 * 2. COMPREHENSIVE BEHAVIORAL ANTI-CHEAT DETECTION LAYER
 * Multi-axis human-vs-machine validation matrix to intercept unauthorized sidekick devices
 * and external AI calculators during rated speed factorization trials.
 *
 * Zero False Positive Safeguard:
 * A session is flagged ONLY if it violates these criteria simultaneously:
 * 1. Absolute Human Velocity Ceiling: Response duration T for complex composite (Max Bound > 200, N >= 10) < 2.5s
 * 2. Input Errantry Metrics: High-speed solve with zero backspaces logged across the session
 * 3. Dynamic Lifeline Throttle: Missed the subtle on-screen interaction anchor ([⚡ CONFIRM ORGANIC REFLEX])
 */
export const behavioralAntiCheatEngine = {
  sessionTotalBackspaces: 0,
  hasHighVelocityComplexSolve: false,
  highVelocitySolveCount: 0,
  organicReflexSpawned: false,
  organicReflexConfirmed: false,
  organicReflexMissed: false,
  suspicionScore: 0,
  isSessionFlagged: false,
  reflexTimeoutId: null,

  reset() {
    this.sessionTotalBackspaces = 0;
    this.hasHighVelocityComplexSolve = false;
    this.highVelocitySolveCount = 0;
    this.organicReflexSpawned = false;
    this.organicReflexConfirmed = false;
    this.organicReflexMissed = false;
    this.suspicionScore = 0;
    this.isSessionFlagged = false;
    if (this.reflexTimeoutId) {
      clearTimeout(this.reflexTimeoutId);
      this.reflexTimeoutId = null;
    }
  },

  logKey(event) {
    if (!event || !event.key) return;
    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.sessionTotalBackspaces++;
    }
  },

  /**
   * Question-level telemetry evaluation
   */
  evaluateQuestionSolve({ isCorrect, targetNumber, responseDuration, maxBound = 200, keystrokeDeltas = [] }) {
    const bound = Number(maxBound) || 200;
    const num = Number(targetNumber) || 0;
    const T = Number(responseDuration) || 0;

    // 1. Absolute Human Velocity Ceiling check:
    // Multi-digit semi-prime or complex composite number (Max Bound > 200) strictly < 2.5 seconds
    const isComplexComposite = bound > 200 && num >= 10;
    const isUnderHumanCeiling = Boolean(isCorrect && isComplexComposite && T < 2.5);

    if (isUnderHumanCeiling) {
      this.hasHighVelocityComplexSolve = true;
      this.highVelocitySolveCount++;
      this.suspicionScore += 1.5;

      // Silently spawn the Anti-Sidekick Tension Layer anchor
      this.spawnOrganicReflexAnchor();
    }

    // Keystroke variance verification
    if (keystrokeDeltas.length >= 3) {
      const mean = keystrokeDeltas.reduce((a, b) => a + b, 0) / keystrokeDeltas.length;
      const variance = keystrokeDeltas.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0) / keystrokeDeltas.length;
      if (variance < 15) {
        this.suspicionScore += 1.0;
      } else if (variance > 200) {
        this.suspicionScore = Math.max(0, this.suspicionScore - 0.5);
      }
    }

    return {
      isUnderHumanCeiling,
      isComplexComposite,
      sessionTotalBackspaces: this.sessionTotalBackspaces,
      suspicionScore: this.suspicionScore
    };
  },

  spawnOrganicReflexAnchor() {
    this.organicReflexSpawned = true;
    this.organicReflexConfirmed = false;
    this.organicReflexMissed = false;

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('anticheat:spawn_reflex_anchor', {
        detail: { timeoutMs: 3800 }
      }));
    }

    if (this.reflexTimeoutId) clearTimeout(this.reflexTimeoutId);
    this.reflexTimeoutId = setTimeout(() => {
      if (!this.organicReflexConfirmed) {
        this.organicReflexMissed = true;
        this.suspicionScore += 1.5; // Missing screen anchor contributes to suspicion weight
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('anticheat:reflex_anchor_missed'));
        }
      }
    }, 3800);
  },

  confirmOrganicReflex() {
    this.organicReflexConfirmed = true;
    this.organicReflexMissed = false;
    this.suspicionScore = Math.max(0, this.suspicionScore - 1.0);
    if (this.reflexTimeoutId) {
      clearTimeout(this.reflexTimeoutId);
      this.reflexTimeoutId = null;
    }
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('anticheat:reflex_anchor_confirmed'));
    }
  },

  /**
   * Session-level multi-axis validation verdict
   * Flagged ONLY if violating all 3 criteria simultaneously
   */
  evaluateSessionVerdict() {
    const criterion1_VelocityCeiling = this.hasHighVelocityComplexSolve;
    const criterion2_ZeroBackspaces = (this.sessionTotalBackspaces === 0) && (this.hasHighVelocityComplexSolve);
    // Violated if reflex was spawned and missed
    const criterion3_MissedReflexAnchor = this.organicReflexSpawned ? (!this.organicReflexConfirmed) : false;

    // Simultaneous criteria validation (Zero False Positive Safeguard)
    const isFlagged = Boolean(criterion1_VelocityCeiling && criterion2_ZeroBackspaces && criterion3_MissedReflexAnchor);
    this.isSessionFlagged = isFlagged;

    return {
      isFlagged,
      criterion1_VelocityCeiling,
      criterion2_ZeroBackspaces,
      criterion3_MissedReflexAnchor,
      sessionTotalBackspaces: this.sessionTotalBackspaces,
      highVelocitySolveCount: this.highVelocitySolveCount,
      suspicionScore: this.suspicionScore
    };
  }
};

export function evaluateAntiCheatTelemetry(options = {}, arg2, arg3) {
  if (typeof options === 'boolean' || typeof options === 'number') {
    return behavioralAntiCheatEngine.evaluateQuestionSolve({
      isCorrect: Boolean(options),
      targetNumber: arg2,
      responseDuration: arg3
    });
  }
  return behavioralAntiCheatEngine.evaluateQuestionSolve(options);
}

/**
 * 3. MODULE 3: THE LIFELINE BLACKLIST FIREWALL
 * Progressively locks down interactive utility tools as competitor ELO reaches master thresholds.
 * Bypassed entirely under "Unrated Practice" mode (Safe-Zone Exception).
 */
export const LifelineBlacklistFirewall = {
  THRESHOLDS: {
    SANDBOX: 900,     // Sieve Calibrator+
    NOISE: 1200,      // Radix Scholar+
    HINT: 1400,       // Modular Operator+
    EXTEND: 1800,     // Logarithmic Vector+
    PAUSE: 2400,      // Canonical Analyst+
    ALL_HELP: 3000    // Prime Singularity
  },

  /**
   * Evaluates active restrictions for given user ELO and contest mode.
   * @param {number} userElo Active competitor ELO rating
   * @param {boolean} isRated True if match is an official Rated Contest
   */
  getRestrictions(userElo, isRated = true) {
    if (!isRated) {
      // Safe-Zone Exception: bypass firewall entirely, leaving all utility tools 100% active
      return {
        isSafeZone: true,
        sandboxBlocked: false,
        noiseBlocked: false,
        mistakePenaltyDoubled: false,
        hintBlocked: false,
        extendBlocked: false,
        fermatClueBlocker: false,
        dampenPositiveElo: false,
        pauseBlocked: false,
        subSecondPacingStrict: false,
        regenBlocked: false,
        skipBlocked: false,
        allHelpBlocked: false,
        maxVelocityIndex: 1.0,
        activeTierName: 'Unrated Safe-Zone'
      };
    }

    const elo = Math.max(0, Number(userElo) || 0);

    return {
      isSafeZone: false,
      userElo: elo,
      sandboxBlocked: elo >= 900,
      noiseBlocked: elo >= 1200,
      mistakePenaltyDoubled: elo >= 1200,
      hintBlocked: elo >= 1400,
      extendBlocked: elo >= 1800,
      restartBlocked: elo >= 1800,
      fermatClueBlocker: elo >= 1800,
      dampenPositiveElo: elo >= 1800,
      pauseBlocked: elo >= 2400,
      subSecondPacingStrict: elo >= 2400,
      regenBlocked: elo >= 3000,
      skipBlocked: elo >= 3000,
      allHelpBlocked: elo >= 3000,
      maxVelocityIndex: elo >= 3000 ? 3.5 : (elo >= 2400 ? 2.5 : 1.5),
      activeTierName: elo >= 3000 ? 'Prime Singularity' :
                      elo >= 2400 ? 'Canonical Analyst+' :
                      elo >= 1800 ? 'Logarithmic Vector+' :
                      elo >= 1400 ? 'Modular Operator+' :
                      elo >= 1200 ? 'Radix Scholar+' :
                      elo >= 900 ? 'Sieve Calibrator+' : 'Base Track'
    };
  },

  /**
   * Helper to verify if an individual lifeline is blocked.
   */
  isBlocked(lifelineKey, userElo, isRated = true) {
    if (!isRated) return false;
    const elo = Number(userElo) || 0;
    switch (lifelineKey) {
      case 'sandbox':
        return elo >= 900;
      case 'noise':
        return elo >= 1200;
      case 'hint':
        return elo >= 1400;
      case 'extend':
        return elo >= 1800;
      case 'restart':
        return elo >= 1800;
      case 'pause':
        return elo >= 2400;
      case 'regen':
        return elo >= 3000;
      case 'skip':
        return elo >= 3000;
      default:
        return false;
    }
  },

  /**
   * Synchronously applies firewall hard-lock and fade-out rules to arena DOM elements.
   */
  applyToArenaDOM(options = {}) {
    const { userElo, isRated } = options;
    const r = this.getRestrictions(userElo, isRated);

    const lockElement = (btn, reason, usesBadgeText = 'PROHIBITED') => {
      if (!btn) return;
      btn.disabled = true;
      btn.style.opacity = '0.28';
      btn.style.pointerEvents = 'none';
      btn.style.cursor = 'not-allowed';
      btn.classList.add('lifeline-firewall-locked');
      btn.setAttribute('title', `❌ FIREWALL DEACTIVATED (ELO PROHIBITED): ${reason}`);
      btn.setAttribute('data-firewall-locked', 'true');
      const badge = btn.querySelector('.lifeline-uses');
      if (badge) {
        badge.textContent = usesBadgeText;
      }
    };

    const unlockElement = (btn) => {
      if (!btn) return;
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
      btn.style.cursor = '';
      btn.classList.remove('lifeline-firewall-locked');
      btn.removeAttribute('data-firewall-locked');
    };

    const btnSandbox = document.getElementById('lifeline-sandbox');
    const btnNoise = document.getElementById('lifeline-noise');
    const btnHint = document.getElementById('lifeline-hint');
    const btnExtend = document.getElementById('lifeline-extend');
    const btnRestart = document.getElementById('lifeline-restart');
    const btnPause = document.getElementById('lifeline-pause');
    const btnRegen = document.getElementById('lifeline-regen');
    const btnSkip = document.getElementById('lifeline-skip');

    if (r.isSafeZone) {
      // Safe-Zone Exception: unlock all
      [btnSandbox, btnNoise, btnHint, btnExtend, btnRestart, btnPause, btnRegen, btnSkip].forEach(unlockElement);
      return r;
    }

    if (r.sandboxBlocked) lockElement(btnSandbox, 'Scratchpad disabled for ELO ≥ 900', 'PROHIBITED (≥900)');
    if (r.noiseBlocked) lockElement(btnNoise, 'Candidate noise filter disabled for ELO ≥ 1200', 'PROHIBITED (≥1200)');
    if (r.hintBlocked) lockElement(btnHint, 'Conceptual pedagogical hints disabled for ELO ≥ 1400', 'PROHIBITED (≥1400)');
    if (r.extendBlocked) lockElement(btnExtend, 'Clock extension disabled for ELO ≥ 1800', 'PROHIBITED (≥1800)');
    if (r.restartBlocked) lockElement(btnRestart, 'Session restart is entirely prohibited for high-rated contestants (ELO ≥ 1800)', 'PROHIBITED (≥1800)');
    if (r.pauseBlocked) lockElement(btnPause, 'Tactical pauses disabled for ELO ≥ 2400', 'PROHIBITED (≥2400)');
    if (r.regenBlocked) lockElement(btnRegen, 'Regeneration suppressed for ELO ≥ 3000', 'PROHIBITED (≥3000)');
    if (r.skipBlocked) lockElement(btnSkip, 'Skip protocol suppressed for ELO ≥ 3000', 'PROHIBITED (≥3000)');

    return r;
  }
};

export function applyLifelineFirewall(options) {
  return LifelineBlacklistFirewall.applyToArenaDOM(options);
}

export function isLifelineBlocked(lifelineKey, userElo, isRated = true) {
  return LifelineBlacklistFirewall.isBlocked(lifelineKey, userElo, isRated);
}

export function getFirewallRestrictions(userElo, isRated = true) {
  return LifelineBlacklistFirewall.getRestrictions(userElo, isRated);
}

if (typeof window !== 'undefined') {
  window.ExamArenaController = {
    ...(window.ExamArenaController || {}),
    version: '3.7.0',
    activeComboStrikeState,
    triggerGlassmorphicComboFlash,
    dispatchThermodynamicResponse,
    behavioralAntiCheatEngine,
    evaluateAntiCheatTelemetry,
    LifelineBlacklistFirewall,
    applyLifelineFirewall,
    isLifelineBlocked,
    getFirewallRestrictions
  };
}
