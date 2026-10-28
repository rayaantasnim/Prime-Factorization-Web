/**
 * PrimeFactor.app — Chess-Style Dynamic Move Evaluation Engine
 * Standalone mathematical evaluation engine that evaluates factorization inputs
 * against a fluid, multi-axis calculation curve in the active exam match loop.
 *
 * Implements:
 * 1. Three Synchronous Telemetry Axes:
 *    - Axis 1: Question Boundary Complexity (Max Bound Scaling)
 *    - Axis 2: ELO Handicap Modifier (Competitor Threshold Calibration)
 *    - Axis 3: Input Response Duration (T in seconds)
 * 2. 50-Comment Matrix across 12 Exhaustive Pools (Categories 1-6)
 * 3. Dynamic Palette & Class Resolution
 */

// ============================================================================
// 1. THE 50-COMMENT MATRIX ACROSS 12 POOLS (Zero truncation / Complete fidelity)
// ============================================================================

export const MOVE_EVALUATION_POOLS = {
  // Category 1: 🌟 Brilliant (!!) [T <= B * 0.35 and no hints unlocked]
  POOL_A: ["🌟 Brilliant!!", "🧠 God-Mode!", "⚡ Transcendent!", "🧬 Overclocked!"],
  POOL_B: ["🚀 Godlike!", "💥 Decoded!", "🛸 Sub-Second!", "⚡ Synaptic!"],
  POOL_C: ["🔥 Insane Pace!", "⚡ Pure Reflex!", "🎯 Bullseye!", "👑 Unstoppable!"],

  // Category 2: 🚀 Great Move (!) [T <= B * 0.65 and T > B * 0.35]
  POOL_D: ["🚀 Great Move!", "🔥 Sharp Split!", "👑 Elite Factor!", "📐 Perfect Tree!"],
  POOL_E: ["✨ Sharp Move!", "👑 High-Tension!", "⚡ Fast Cadence!", "🎯 Rapid Strike!"],

  // Category 3: 🎯 Best Move [T <= B and T > B * 0.65]
  POOL_F: ["🎯 Best Move", "✔️ Optimal!", "🧩 Textbook!", "🛡️ Aligned!"],
  POOL_G: ["✔️ Steady!", "🎯 Secured!", "🧩 Solid Split!", "✨ Verified!"],

  // Category 4: ⏸️ Inaccuracy / Book Move (Velocity Slack) [T > B]
  POOL_H: ["🐢 Slack Detected", "⏸️ Book Move", "🔍 Hesitant!", "⚠️ Drag Vector"],
  POOL_I: ["⏳ Time Lag", "⏸️ Pace Slump", "🔍 Friction!", "🐢 Decelerated"],

  // Category 5: ⚠️ Mistake (?) [Missed 1st attempt, recovered on 2nd attempt loop]
  POOL_J: ["⚠️ Mistake!", "🔧 Recaptured!", "⚖️ Salvaged!", "🛡️ Redeemed!"],

  // Category 6: 🚨 Blunder (??) [Missed both attempts, skipped, or focus lost]
  POOL_K: ["🛡️ Integrity Fail", "🚨 Blunder (??)", "💥 Focus Lost!", "🔒 Firewalled!", "⚠️ Security Hit"],
  POOL_L: ["💥 Breakdown!", "🚨 Miscalculated!", "🪵 Bad Factor!", "❌ Structural Drop", "📉 Math Fault"]
};

// ============================================================================
// 2. THE THREE SYNCHRONOUS TELEMETRY AXES
// ============================================================================

/**
 * Axis 1: Question Boundary Complexity (Max Bound Scaling)
 * Calculates the raw base seconds based on the active integer ceiling.
 *
 * @param {number} maxBound Maximum bound parameter for the active problem
 * @returns {number} Base seconds B_raw
 */
export function computeAxis1BaseSeconds(maxBound) {
  const bound = Number(maxBound) || 200;
  if (bound <= 200) {
    return 2.0; // Tier 1 foundations
  }
  if (bound <= 1000) {
    return 4.0; // Tier 2-3 standard
  }
  if (bound <= 5000) {
    return 7.0; // Tier 4-5 intermediate
  }
  return 12.0; // Tier 6+ elite ranges (> 5000)
}

/**
 * Axis 2: ELO Handicap Modifier (Competitor Threshold Calibration)
 * Dampens or scales expected baseline according to competitor rating.
 *
 * @param {number} userElo Active competitor ELO rating
 * @returns {number} Multiplier factor
 */
export function getEloHandicapModifier(userElo) {
  const elo = Number(userElo) || 1200;
  if (elo >= 2400) {
    return 0.6; // Elite Brackets: strict dampening for reflex solves
  }
  if (elo >= 1600) {
    return 0.8; // Strategic Brackets: dampening
  }
  if (elo < 900) {
    return 1.3; // Novice / Foundations: generous threshold
  }
  return 1.0; // Standard calibration (900 <= elo < 1600)
}

/**
 * Synchronous Baseline Calculation (B = Axis 1 * Axis 2)
 *
 * @param {number} maxBound Active integer upper limit
 * @param {number} userElo Competitor rating
 * @returns {number} Expected baseline seconds B
 */
export function computeExpectedBaselineSeconds(maxBound, userElo) {
  const baseSeconds = computeAxis1BaseSeconds(maxBound);
  const eloModifier = getEloHandicapModifier(userElo);
  return baseSeconds * eloModifier;
}

// ============================================================================
// 3. CHESS-STYLE DYNAMIC MOVE EVALUATION ENGINE
// ============================================================================

/**
 * Evaluates the competitor's submission against the fluid multi-axis curve.
 *
 * @param {Object} options Evaluation parameters
 * @param {boolean} options.isCorrect Whether factorization was mathematically valid
 * @param {boolean} [options.isFirstAttempt=true] Whether this was attempt 1
 * @param {boolean} [options.isSecondChance=false] Whether this was within the 2nd chance loop
 * @param {number} options.responseDuration Exact solve time in seconds (Axis 3)
 * @param {number} options.maxBound Problem maximum bound parameter (Axis 1)
 * @param {number} options.userElo Competitor rating (Axis 2)
 * @param {boolean} [options.hintActive=false] Whether a hint was unlocked
 * @param {boolean} [options.slackTriggered=false] Whether a pause/lifeline was engaged
 * @param {boolean} [options.isIntegrityViolation=false] Whether focus/tab blur penalty fired
 * @param {boolean} [options.isSkip=false] Whether the question was manually skipped
 * @returns {Object} Evaluation report containing tier, poolId, feedback phrase, and CSS palette
 */
export function evaluateMove({
  isCorrect = false,
  isFirstAttempt = true,
  isSecondChance = false,
  responseDuration = 0,
  maxBound = 200,
  userElo = 1200,
  hintActive = false,
  slackTriggered = false,
  isIntegrityViolation = false,
  isSkip = false
} = {}) {
  const elo = Number(userElo) || 1200;
  const bound = Number(maxBound) || 200;
  const B = computeExpectedBaselineSeconds(bound, elo);
  const T = Math.max(0.01, Number(responseDuration) || 0);

  // --------------------------------------------------------------------------
  // Category 6: 🚨 Blunder (??) [Security Violations / Tab Blur]
  // --------------------------------------------------------------------------
  if (isIntegrityViolation) {
    const pool = MOVE_EVALUATION_POOLS.POOL_K;
    const text = pool[Math.floor(Math.random() * pool.length)];
    return {
      category: 6,
      categoryName: 'Blunder',
      tier: 'BLUNDER_INTEGRITY',
      poolId: 'K',
      text,
      className: 'feedback-scarlet-shake',
      expectedBaselineSeconds: B,
      responseDuration: T,
      ratio: T / B
    };
  }

  // --------------------------------------------------------------------------
  // Category 6: 🚨 Blunder (??) [Skips / Computational Faults / Math Mismatches]
  // --------------------------------------------------------------------------
  if (isSkip || !isCorrect) {
    const pool = MOVE_EVALUATION_POOLS.POOL_L;
    const text = pool[Math.floor(Math.random() * pool.length)];
    return {
      category: 6,
      categoryName: 'Blunder',
      tier: isSkip ? 'BLUNDER_SKIPPED' : 'BLUNDER_COMPUTATIONAL',
      poolId: 'L',
      text,
      className: 'feedback-scarlet-shake',
      expectedBaselineSeconds: B,
      responseDuration: T,
      ratio: T / B
    };
  }

  // --------------------------------------------------------------------------
  // Category 5: ⚠️ Mistake (?) [Missed 1st attempt, recovered on 2nd attempt loop]
  // --------------------------------------------------------------------------
  if (isSecondChance || !isFirstAttempt) {
    const pool = MOVE_EVALUATION_POOLS.POOL_J;
    const text = pool[Math.floor(Math.random() * pool.length)];
    return {
      category: 5,
      categoryName: 'Mistake',
      tier: 'MISTAKE_REDEEMED',
      poolId: 'J',
      text,
      className: 'feedback-platinum-gray',
      expectedBaselineSeconds: B,
      responseDuration: T,
      ratio: T / B
    };
  }

  // --------------------------------------------------------------------------
  // Correct on First Attempt: Evaluate against dynamic curve B
  // --------------------------------------------------------------------------

  // Category 1: 🌟 Brilliant (!!) [T <= B * 0.35 and no hints unlocked]
  if (T <= B * 0.35 && !hintActive && !slackTriggered) {
    let poolId = 'C';
    let pool = MOVE_EVALUATION_POOLS.POOL_C;

    if (elo >= 2000) {
      poolId = 'A';
      pool = MOVE_EVALUATION_POOLS.POOL_A;
    } else if (elo >= 1200) {
      poolId = 'B';
      pool = MOVE_EVALUATION_POOLS.POOL_B;
    } else {
      poolId = 'C';
      pool = MOVE_EVALUATION_POOLS.POOL_C;
    }

    const text = pool[Math.floor(Math.random() * pool.length)];
    return {
      category: 1,
      categoryName: 'Brilliant',
      tier: 'BRILLIANT',
      poolId,
      text,
      className: 'feedback-cyber-cyan',
      expectedBaselineSeconds: B,
      responseDuration: T,
      ratio: T / B
    };
  }

  // Category 2: 🚀 Great Move (!) [T <= B * 0.65 and T > B * 0.35, or hint-assisted sub-0.65]
  if (T <= B * 0.65 && !slackTriggered) {
    let poolId = 'E';
    let pool = MOVE_EVALUATION_POOLS.POOL_E;

    if (bound > 5000) {
      poolId = 'D';
      pool = MOVE_EVALUATION_POOLS.POOL_D;
    } else {
      poolId = 'E';
      pool = MOVE_EVALUATION_POOLS.POOL_E;
    }

    const text = pool[Math.floor(Math.random() * pool.length)];
    return {
      category: 2,
      categoryName: 'Great Move',
      tier: 'GREAT_MOVE',
      poolId,
      text,
      className: 'feedback-mint-amber',
      expectedBaselineSeconds: B,
      responseDuration: T,
      ratio: T / B
    };
  }

  // Category 3: 🎯 Best Move [T <= B and T > B * 0.65]
  if (T <= B && !slackTriggered) {
    let poolId = 'G';
    let pool = MOVE_EVALUATION_POOLS.POOL_G;

    if (elo >= 1800) {
      poolId = 'F';
      pool = MOVE_EVALUATION_POOLS.POOL_F;
    } else {
      poolId = 'G';
      pool = MOVE_EVALUATION_POOLS.POOL_G;
    }

    const text = pool[Math.floor(Math.random() * pool.length)];
    return {
      category: 3,
      categoryName: 'Best Move',
      tier: 'BEST_MOVE',
      poolId,
      text,
      className: 'feedback-mint-amber',
      expectedBaselineSeconds: B,
      responseDuration: T,
      ratio: T / B
    };
  }

  // Category 4: ⏸️ Inaccuracy / Book Move (Velocity Slack) [T > B or slack triggered]
  {
    let poolId = 'I';
    let pool = MOVE_EVALUATION_POOLS.POOL_I;

    if (elo >= 2000) {
      poolId = 'H';
      pool = MOVE_EVALUATION_POOLS.POOL_H;
    } else {
      poolId = 'I';
      pool = MOVE_EVALUATION_POOLS.POOL_I;
    }

    const text = pool[Math.floor(Math.random() * pool.length)];
    return {
      category: 4,
      categoryName: 'Inaccuracy',
      tier: 'INACCURACY',
      poolId,
      text,
      className: 'feedback-platinum-gray',
      expectedBaselineSeconds: B,
      responseDuration: T,
      ratio: T / B
    };
  }
}

// Global browser window namespace attachment for dynamic match loop telemetry
if (typeof window !== 'undefined') {
  window.ChessMoveEvaluator = {
    evaluateMove,
    computeExpectedBaselineSeconds,
    computeAxis1BaseSeconds,
    getEloHandicapModifier,
    MOVE_EVALUATION_POOLS
  };
}
