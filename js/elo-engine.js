/**
 * PrimeFactor.app — Master Mathematical ELO Engine & 12-Tier Competitive Rank Matrix
 * Dynamic Volatility (K), Diminishing Returns, Asymmetric Tier-Banning Firewall,
 * and Cloud Firestore Profile Synchronization.
 * (All LocalStorage tampering checks and unauthenticated profile initialization removed).
 */

import {
  addNotification,
  isPenaltyLockdownActive,
  setPenaltyLockdown,
} from "./storage.js";
import {
  getCurrentProfile,
  isUserLoggedIn,
  applyEloPenalty,
  recordMatchToFirestore,
} from "./firebase.js";

// ============================================================================
// 1. 12-TIER COMPETITIVE ELO MATRIX DEFINITION
// ============================================================================
export const ELO_TIERS = [
  {
    tierIndex: 1,
    minElo: 3000,
    maxElo: Infinity,
    title: "Prime Singularity",
    symbol: "👑",
    colorName: "Nebula Pink",
    colorHex: "#F43F5E",
    glowClass: "glow-nebula-pink",
    cssEffect: "animated-cyber-glow",
    lockedTiers: [1, 2, 3, 4, 5, 6],
    description:
      "Transcendent supreme cognitive computing capability. Sub-second Pollard’s Rho mastery.",
  },
  {
    tierIndex: 2,
    minElo: 2700,
    maxElo: 2999,
    title: "Riemann Transcendentalist",
    symbol: "♾️",
    colorName: "Crimson Scarlet",
    colorHex: "#DC2626",
    glowClass: "glow-crimson-scarlet",
    cssEffect: "pulse-effect",
    lockedTiers: [1, 2, 3, 4, 5],
    description:
      "Master of prime distribution heuristics and deep complex coordinate decomposition.",
  },
  {
    tierIndex: 3,
    minElo: 2400,
    maxElo: 2699,
    title: "Canonical Analyst",
    symbol: "⚡",
    colorName: "Electric Cyan",
    colorHex: "#06B6D4",
    glowClass: "glow-electric-cyan",
    cssEffect: "neon-shimmer",
    lockedTiers: [1, 2, 3, 4],
    description: "Canonical prime power representation speed specialist.",
  },
  {
    tierIndex: 4,
    minElo: 2200,
    maxElo: 2399,
    title: "Gaussian Cryptographer",
    symbol: "🔐",
    colorName: "Vibrant Violet",
    colorHex: "#8B5CF6",
    glowClass: "glow-vibrant-violet",
    cssEffect: "neon-shimmer",
    lockedTiers: [1, 2, 3, 4],
    description:
      "Cryptographic security engineer decoding RSA-grade composite components.",
  },
  {
    tierIndex: 5,
    minElo: 2000,
    maxElo: 2199,
    title: "Eulerian Sentinel",
    symbol: "📐",
    colorName: "Laser Amber",
    colorHex: "#F59E0B",
    glowClass: "glow-laser-amber",
    cssEffect: "neon-shimmer",
    lockedTiers: [1, 2, 3],
    description:
      "Guardian of totient function identities and cyclic modular rings.",
  },
  {
    tierIndex: 6,
    minElo: 1800,
    maxElo: 1999,
    title: "Logarithmic Vector",
    symbol: "📈",
    colorName: "Cobalt Blue",
    colorHex: "#2563EB",
    glowClass: "glow-cobalt-blue",
    cssEffect: "neon-shimmer",
    lockedTiers: [1, 2, 3],
    description:
      "Exponential acceleration solver reaching Olympiad national contender status.",
  },
  {
    tierIndex: 7,
    minElo: 1600,
    maxElo: 1799,
    title: "Prime Strategist",
    symbol: "🔍",
    colorName: "Deep Jade",
    colorHex: "#059669",
    glowClass: "glow-deep-jade",
    cssEffect: "standard-neon",
    lockedTiers: [1, 2],
    description:
      "Tactical decomposer executing swift sieve filtering heuristics.",
  },
  {
    tierIndex: 8,
    minElo: 1400,
    maxElo: 1599,
    title: "Modular Operator",
    symbol: "⚙️",
    colorName: "Mint Green",
    colorHex: "#10B981",
    glowClass: "glow-mint-green",
    cssEffect: "standard-neon",
    lockedTiers: [1, 2],
    description:
      "Consistent modular arithmetic solver executing flawless textbook prime splits.",
  },
  {
    tierIndex: 9,
    minElo: 1200,
    maxElo: 1399,
    title: "Radix Scholar",
    symbol: "🎓",
    colorName: "Muted Platinum",
    colorHex: "#E2E8F0",
    glowClass: "glow-muted-platinum",
    cssEffect: "standard-neon",
    lockedTiers: [1],
    description:
      "Dedicated contender displaying strong computational foundation across 3-digit domains.",
  },
  {
    tierIndex: 10,
    minElo: 900,
    maxElo: 1199,
    title: "Sieve Calibrator",
    symbol: "🧮",
    colorName: "Polished Bronze",
    colorHex: "#D97706",
    glowClass: "glow-polished-bronze",
    cssEffect: "standard-neon",
    lockedTiers: [1],
    description:
      "Standard competitive baseline for sieve filtering heuristics.",
  },
  {
    tierIndex: 11,
    minElo: 500,
    maxElo: 899,
    title: "Composite Apprentice",
    symbol: "🧩",
    colorName: "Slate Gray",
    colorHex: "#64748B",
    glowClass: "glow-slate-gray",
    cssEffect: "standard-neon",
    lockedTiers: [],
    description:
      "Default onboarding floor initialized at 500 ELO upon first sign-in. Developing mental heuristics for basic prime testing.",
  },
  {
    tierIndex: 12,
    minElo: 0,
    maxElo: 499,
    title: "Foundry Initiate",
    symbol: "🪵",
    colorName: "Chalk White",
    colorHex: "#F8FAFC",
    glowClass: "glow-chalk-white",
    cssEffect: "standard-neon",
    lockedTiers: [],
    description:
      "First steps into the Olympiad factorization arena. Building basic intuition.",
  },
];

export function getTierByElo(elo) {
  const safeElo = Math.max(
    0,
    Math.round(Number(elo !== undefined && elo !== null ? elo : 500)),
  );
  for (const tier of ELO_TIERS) {
    if (safeElo >= tier.minElo && safeElo <= tier.maxElo) {
      return tier;
    }
  }
  return ELO_TIERS[ELO_TIERS.length - 1];
}

export function getTierBaselineFromRange(maxVal) {
  if (maxVal <= 200) return 1000;
  if (maxVal <= 500) return 1200;
  if (maxVal <= 1000) return 1400;
  if (maxVal <= 2000) return 1600;
  if (maxVal <= 5000) return 1800;
  if (maxVal <= 10000) return 2000;
  if (maxVal <= 20000) return 2200;
  if (maxVal <= 35000) return 2400;
  return 2600;
}

export function getTierNumberFromMax(maxVal) {
  if (maxVal <= 200) return 1;
  if (maxVal <= 500) return 2;
  if (maxVal <= 1000) return 3;
  if (maxVal <= 2000) return 4;
  if (maxVal <= 5000) return 5;
  if (maxVal <= 10000) return 6;
  if (maxVal <= 20000) return 7;
  if (maxVal <= 35000) return 8;
  return 9;
}

// Backward-compatible stubs
export function initServerlessOnboarding() {}
export function verifyProfileIntegrity() {
  return true;
}
export function reSignProfileDirectory() {}
export function handleSecurityViolation() {}
export function renderPermanentBanScreen() {}
export function handleAbruptExitAudit() {}
export function computeHMAC(str) {
  return "SIG_SECURE";
}
export function generateUniqueTokenHandle(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let res = "";
  for (let i = 0; i < length; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }
  return res;
}

// ============================================================================
// 2. USER ELO READ / WRITE API (Powered by Cloud Firestore)
// ============================================================================

export function getUserElo() {
  const profile = getCurrentProfile();
  if (profile && typeof profile.elo === "number") {
    return Math.round(profile.elo);
  }
  return 500; // Unsaved baseline for guest players
}

export function setUserElo(newElo) {
  // Security: the client may only ever LOWER a persisted rating (penalties / restart fees).
  // Rating gains are earned exclusively through recordMatchToFirestore().
  const safeElo = Math.max(0, Math.round(Number(newElo) || 0));
  const current = getUserElo();
  if (isUserLoggedIn() && safeElo < current) {
    applyEloPenalty(current - safeElo).catch((err) =>
      console.error("Failed to apply ELO penalty in Firestore:", err),
    );
  }
  return safeElo;
}

export function getUserPeakElo() {
  const profile = getCurrentProfile();
  if (profile && typeof profile.peak_elo === "number") {
    return Math.max(getUserElo(), Math.round(profile.peak_elo));
  }
  return getUserElo();
}

// ============================================================================
// 3. ASYMMETRIC TIER-BANNING CAPABILITY CEILING CHECKS
// ============================================================================

export function isRangeBannedForElo(userElo, maxBound) {
  const elo = Number(userElo) || 0;
  const bound = Number(maxBound) || 0;
  if (elo >= 3000) return bound <= 10000;
  if (elo >= 2700) return bound <= 5000;
  if (elo >= 2200) return bound <= 2000;
  if (elo >= 1800) return bound <= 1000;
  if (elo >= 1400) return bound <= 500;
  if (elo >= 900) return bound <= 200;
  return false;
}

export function getTierBanCeilingDescription(maxBound) {
  const bound = Number(maxBound) || 0;
  if (bound <= 200)
    return "MAX_BOUND ≤ 200 is restricted for ratings ≥ 900 ELO (Blocks Tier 1 Foundations).";
  if (bound <= 500)
    return "MAX_BOUND ≤ 500 is restricted for ratings ≥ 1,400 ELO (Blocks Tiers 1–2 Intermediate).";
  if (bound <= 1000)
    return "MAX_BOUND ≤ 1,000 is restricted for ratings ≥ 1,800 ELO (Blocks Tiers 1–3 Olympiad Baseline).";
  if (bound <= 2000)
    return "MAX_BOUND ≤ 2,000 is restricted for ratings ≥ 2,200 ELO (Blocks Tiers 1–4 Advanced).";
  if (bound <= 5000)
    return "MAX_BOUND ≤ 5,000 is restricted for ratings ≥ 2,700 ELO (Blocks Tiers 1–5 Master).";
  if (bound <= 10000)
    return "MAX_BOUND ≤ 10,000 is restricted for ratings ≥ 3,000 ELO (Blocks Tiers 1–6 Invitational).";
  return "Competitive tier open to all rated contenders.";
}

// ============================================================================
// 4. OFFICIAL ELO CALCULATION ENGINE
// Delta R = K * (Net Accuracy% - E) * V
// ============================================================================

export function calculateEloDelta(params) {
  const {
    userElo,
    maxBound,
    accuracyPct,
    allocatedSeconds,
    actualSeconds,
    isForcedUnrated = false,
    participationMode = "rated",
    streakCount = 0,
  } = params;

  if (isForcedUnrated || participationMode === "unrated") {
    return {
      deltaR: 0,
      expected: 0.85,
      velocity: 1.0,
      kFactor: 32,
      isForcedUnrated: true,
      expectationStatus: "⏸️ Deactivated",
      comment: "Training",
    };
  }

  // 1. Expected Outcome Seed (E)
  const tierBaseline = getTierBaselineFromRange(maxBound);
  const exponent = (tierBaseline - userElo) / 400;
  const rawExpected = 1 / (1 + Math.pow(10, exponent));
  const E = Math.min(0.95, Math.max(0.15, rawExpected));

  // 2. Net Accuracy%
  const netAccuracy = Math.min(1.0, Math.max(0.0, accuracyPct / 100));

  // 3. Velocity Index (V) = Allocated Duration / Actual Time Expended
  const safeActualTime = Math.max(1, actualSeconds || 30);
  const rawV = allocatedSeconds / safeActualTime;
  const V = Math.min(3.5, Math.max(0.5, rawV));

  // 4. Dynamic Volatility Factor (K) = 32 * (1 + log10(Streak Count + 1))
  const safeStreak = Math.max(0, streakCount || 0);
  const K = 32 * (1 + Math.log10(safeStreak + 1));

  // Core Formula Calculation: Delta R = K * (Net Accuracy% - E) * V
  let rawDelta = K * (netAccuracy - E) * V;

  // 5. High-Tier Hardening Filter (1800+ ELO Diminishing Returns)
  if (userElo >= 1800 && rawDelta > 0) {
    const dampeningFactor = 1800 / userElo;
    rawDelta = rawDelta * dampeningFactor;
  }

  // 6. Dynamic Sub-Second Factor Combo Strike Chain Bonus Tokens
  const comboBonus =
    Number(params.bonusEloPoints) ||
    (Number(params.bonusEloTokens) ? Number(params.bonusEloTokens) * 2 : 0);
  const computedDelta = Math.round(rawDelta) + comboBonus;

  const supportiveRemarks = [
    "Amazing!",
    "Brilliant!",
    "Flawless!",
    "Spectacular!",
    "Mastery!",
  ];
  const criticalRemarks = [
    "Unexpected",
    "Slumped",
    "Sub-par",
    "Velocity Slack",
    "Hesitant",
  ];

  const isPassed = computedDelta > 0;
  const expectationStatus = isPassed ? "✔️ Passed" : "❌ Failed";
  const comment = isPassed
    ? supportiveRemarks[Math.floor(Math.random() * supportiveRemarks.length)]
    : criticalRemarks[Math.floor(Math.random() * criticalRemarks.length)];

  return {
    deltaR: computedDelta,
    rawCalculatedDelta: computedDelta,
    expected: +(E * 100).toFixed(1),
    velocity: +V.toFixed(2),
    kFactor: +K.toFixed(1),
    comboBonus,
    bonusEloTokens: Number(params.bonusEloTokens) || 0,
    isForcedUnrated: false,
    expectationStatus,
    comment,
  };
}

export function formatLocalDateString(dateInput = new Date()) {
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return d.toISOString().replace("T", " ").slice(0, 16);
  } catch (e) {
    return new Date().toISOString().replace("T", " ").slice(0, 16);
  }
}

// Record completed match into profile logs (Only persists to Firestore if authenticated)
export function recordRatedMatchToProfile(matchData) {
  if (!isUserLoggedIn()) {
    console.warn(
      "[PrimeFactor] Guest Mode: Match progress and ELO changes are not saved.",
    );
    return;
  }

  recordMatchToFirestore(matchData).catch((err) => {
    console.error("Failed to commit match to Firestore:", err);
  });
}

// ============================================================================
// 5. MULTI-AXIS CROSS-MATRIX DYNAMIC EXPECTATIONS ENGINE
// ============================================================================

export function computeSystemExpectations(userElo, maxBound) {
  const elo =
    Number(userElo !== undefined && userElo !== null ? userElo : 500) || 500;
  const bound =
    Number(maxBound !== undefined && maxBound !== null ? maxBound : 200) || 200;

  let pacing = "< 3.8s per factor";
  if (elo >= 3000) pacing = "< 1.2s per factor";
  else if (elo >= 2400)
    pacing = bound <= 2000 ? "< 1.2s per factor" : "< 1.5s per factor";
  else if (elo >= 2000)
    pacing = bound <= 1000 ? "< 1.4s per factor" : "< 1.8s per factor";
  else if (elo >= 1600) pacing = "< 2.2s per factor";
  else if (elo >= 1200) pacing = "< 2.8s per factor";
  else if (elo >= 900) pacing = "< 3.2s per factor";

  let accuracy = "Expected: 80%+ Precision";
  if (bound <= 200) accuracy = "Expected: 80%+ Precision";
  else if (bound <= 500) accuracy = "Expected: 83%+ Precision";
  else if (bound <= 1000) accuracy = "Expected: 85%+ Precision";
  else if (bound <= 2000) accuracy = "Expected: 88%+ Precision";
  else if (bound <= 5000) accuracy = "Expected: 90%+ Precision";
  else if (bound <= 10000) accuracy = "Expected: 92%+ Precision";
  else if (bound <= 25000) accuracy = "Expected: 94%+ Precision";
  else accuracy = "Expected: 95%+ Precision";

  let lifelines =
    elo >= 1200
      ? "Expected: 0 lifelines utilized"
      : "Expected: ≤ 1 lifeline utilized";

  const tierBaseline = getTierBaselineFromRange(bound);
  const exponent = (tierBaseline - elo) / 400;
  const rawExpected = 1 / (1 + Math.pow(10, exponent));
  const E = Math.min(0.95, Math.max(0.15, rawExpected));
  const minScore = Math.min(100, Math.max(15, Math.round(E * 100)));
  const scoreExpectation = `Expected: ≥ ${minScore} / 100 pts`;

  return {
    pacing,
    accuracy,
    lifelines,
    scoreExpectation,
    minScore,
  };
}
