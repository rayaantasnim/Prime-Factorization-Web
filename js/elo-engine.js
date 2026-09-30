/**
 * PrimeFactor.app — Master Mathematical ELO Engine, Anti-Cheat Shield & Onboarding
 * 12-Tier Competitive Rank Matrix, Dynamic Volatility (K), Diminishing Returns,
 * Asymmetric Tier-Banning Firewall, and Cryptographic 3-Strike Storage Integrity Hammer.
 */

import { getLedger } from './storage.js';

export const ENGINE_HMAC_SECRET = "YOUR_LOCAL_HMAC_SECRET_KEY_PLACEHOLDER";

// ============================================================================
// 1. 12-TIER COMPETITIVE ELO MATRIX DEFINITION
// ============================================================================
export const ELO_TIERS = [
  {
    tierIndex: 12,
    minElo: 3000,
    maxElo: Infinity,
    title: 'Quantum Decomposer',
    symbol: '👑',
    colorName: 'Nebula Pink',
    colorHex: '#F43F5E',
    glowClass: 'glow-nebula-pink',
    cssEffect: 'animated-cyber-glow',
    lockedTiers: [1, 2, 3, 4, 5, 6], // Tiers 1-6 locked to Unrated Practice
    description: 'Transcendent supreme cognitive computing capability. Sub-second Pollard’s Rho mastery.'
  },
  {
    tierIndex: 11,
    minElo: 2700,
    maxElo: 2999,
    title: 'Riemann Transcendentalist',
    symbol: '♾️',
    colorName: 'Crimson Scarlet',
    colorHex: '#DC2626',
    glowClass: 'glow-crimson-scarlet',
    cssEffect: 'pulse-effect',
    lockedTiers: [1, 2, 3, 4, 5], // Tiers 1-5 locked to Unrated Practice
    description: 'Master of prime distribution heuristics and deep complex coordinate decomposition.'
  },
  {
    tierIndex: 10,
    minElo: 2400,
    maxElo: 2699,
    title: 'Canonical Analyst',
    symbol: '⚡',
    colorName: 'Electric Cyan',
    colorHex: '#06B6D4',
    glowClass: 'glow-electric-cyan',
    cssEffect: 'neon-shimmer',
    lockedTiers: [1, 2, 3, 4], // Tiers 1-4 locked
    description: 'Canonical prime power representation speed specialist.'
  },
  {
    tierIndex: 9,
    minElo: 2200,
    maxElo: 2399,
    title: 'Gaussian Cryptographer',
    symbol: '🔐',
    colorName: 'Vibrant Violet',
    colorHex: '#8B5CF6',
    glowClass: 'glow-vibrant-violet',
    cssEffect: 'neon-shimmer',
    lockedTiers: [1, 2, 3], // Tiers 1-3 locked
    description: 'Cryptographic security engineer decoding RSA-grade composite components.'
  },
  {
    tierIndex: 8,
    minElo: 2000,
    maxElo: 2199,
    title: 'Eulerian Sentinel',
    symbol: '📐',
    colorName: 'Laser Amber',
    colorHex: '#F59E0B',
    glowClass: 'glow-laser-amber',
    cssEffect: 'neon-shimmer',
    lockedTiers: [1, 2], // Tiers 1-2 locked
    description: 'Guardian of totient function identities and cyclic modular rings.'
  },
  {
    tierIndex: 7,
    minElo: 1800,
    maxElo: 1999,
    title: 'Logarithmic Vector',
    symbol: '📈',
    colorName: 'Cobalt Blue',
    colorHex: '#2563EB',
    glowClass: 'glow-cobalt-blue',
    cssEffect: 'neon-shimmer',
    lockedTiers: [1], // Tier 1 locked
    description: 'Exponential acceleration solver reaching Olympiad national contender status.'
  },
  {
    tierIndex: 6,
    minElo: 1600,
    maxElo: 1799,
    title: 'Prime Strategist',
    symbol: '🔍',
    colorName: 'Deep Jade',
    colorHex: '#059669',
    glowClass: 'glow-deep-jade',
    cssEffect: 'standard-neon',
    lockedTiers: [],
    description: 'Tactical decomposer executing swift sieve filtering heuristics.'
  },
  {
    tierIndex: 5,
    minElo: 1400,
    maxElo: 1599,
    title: 'Modular Operator',
    symbol: '⚙️',
    colorName: 'Mint Green',
    colorHex: '#10B981',
    glowClass: 'glow-mint-green',
    cssEffect: 'standard-neon',
    lockedTiers: [],
    description: 'Consistent modular arithmetic solver executing flawless textbook prime splits.'
  },
  {
    tierIndex: 4,
    minElo: 1200,
    maxElo: 1399,
    title: 'Radix Scholar',
    symbol: '🎓',
    colorName: 'Muted Platinum',
    colorHex: '#E2E8F0',
    glowClass: 'glow-muted-platinum',
    cssEffect: 'standard-neon',
    lockedTiers: [],
    description: 'Dedicated contender displaying strong computational foundation across 3-digit domains.'
  },
  {
    tierIndex: 3,
    minElo: 900,
    maxElo: 1199,
    title: 'Sieve Calibrator',
    symbol: '🧮',
    colorName: 'Polished Bronze',
    colorHex: '#D97706',
    glowClass: 'glow-polished-bronze',
    cssEffect: 'standard-neon',
    lockedTiers: [],
    description: 'Standard competitive baseline. Default onboarding floor initialized at 1000 ELO.'
  },
  {
    tierIndex: 2,
    minElo: 500,
    maxElo: 899,
    title: 'Composite Apprentice',
    symbol: '🧩',
    colorName: 'Slate Gray',
    colorHex: '#64748B',
    glowClass: 'glow-slate-gray',
    cssEffect: 'standard-neon',
    lockedTiers: [],
    description: 'Developing mental heuristics for basic prime testing and composite division.'
  },
  {
    tierIndex: 1,
    minElo: 0,
    maxElo: 499,
    title: 'Foundry Initiate',
    symbol: '🪵',
    colorName: 'Chalk White',
    colorHex: '#F8FAFC',
    glowClass: 'glow-chalk-white',
    cssEffect: 'standard-neon',
    lockedTiers: [],
    description: 'First steps into the Olympiad factorization arena. Building basic intuition.'
  }
];

export function getTierByElo(elo) {
  const safeElo = Math.max(0, Math.round(Number(elo) || 1000));
  for (const tier of ELO_TIERS) {
    if (safeElo >= tier.minElo && safeElo <= tier.maxElo) {
      return tier;
    }
  }
  return ELO_TIERS[ELO_TIERS.length - 1];
}

// Baseline expected tier score values for ELO derivation
export const TIER_BASELINES = {
  1: 1000,
  2: 1200,
  3: 1400,
  4: 1600,
  5: 1800,
  6: 2000,
  7: 2200,
  8: 2400,
  9: 2600,
  10: 2800
};

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

// ============================================================================
// 2. CRYPTOGRAPHIC SIGNATURE & STORAGE SECURITY HAMMER
// ============================================================================

// Lightweight fast deterministic HMAC signature simulation
export function computeHMAC(strData, secret = ENGINE_HMAC_SECRET) {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x55555555;
  const combined = secret + ':' + strData + ':' + secret.length;
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    hash1 ^= code;
    hash1 = (hash1 * 0x01000193) >>> 0;
    hash2 = ((hash2 << 5) - hash2 + code) >>> 0;
  }
  return `SIG_${hash1.toString(16).padStart(8, '0')}_${hash2.toString(16).padStart(8, '0')}`;
}

export function getStorageSignature(payloadObj) {
  return computeHMAC(JSON.stringify(payloadObj));
}

// Execute 3-Strike Escalation on Tampering
export function handleSecurityViolation(strikeCount = 1, reason = 'Storage Character Mutation Detected') {
  const currentStrikes = Number(localStorage.getItem('primefactor_security_strikes') || 0) + 1;
  localStorage.setItem('primefactor_security_strikes', String(currentStrikes));

  if (currentStrikes >= 3) {
    // STRIKE 3: Permanent Hard Lockout
    localStorage.setItem('prime_factor_security_verdict', 'PERMANENTLY_BANNED');
    renderPermanentBanScreen();
    throw new Error('Hard Lockout: Security Violation - Permanent Ban Applied.');
  } else if (currentStrikes === 2) {
    // STRIKE 2: Instant Liquidation to 0 ELO
    setUserElo(0);
    localStorage.setItem('primefactor_match_logs', JSON.stringify([]));
    reSignProfileDirectory();
    renderSecurityWarningModal('STRIKE 2 WARNING', 'Illegal client modification detected. Competitive rating liquidated to 0 ELO (Foundry Initiate). Continued tampering triggers permanent browser blacklisting.');
  } else {
    // STRIKE 1: -100 ELO Deduction
    const active = getUserElo();
    setUserElo(Math.max(0, active - 100));
    reSignProfileDirectory();
    renderSecurityWarningModal('STRIKE 1 WARNING', 'Security integrity signature mismatch registered. -100 ELO penalty applied. Cache signature re-anchored.');
  }
}

export function renderPermanentBanScreen() {
  document.body.innerHTML = `
    <div style="position: fixed; inset: 0; background: #000000; color: #EF4444; z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-family: monospace; padding: 2rem; box-sizing: border-box;">
      <div style="font-size: 4rem; margin-bottom: 1rem; text-shadow: 0 0 30px #EF4444;">🚨</div>
      <h1 style="font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 900; color: #EF4444; text-shadow: 0 0 20px #EF4444; margin-bottom: 1rem;">
        ACCESS DENIED — PERMANENTLY BANNED
      </h1>
      <p style="font-size: 1.1rem; color: #CBD5E1; max-width: 650px; line-height: 1.6; margin-bottom: 1.5rem;">
        This browser environment has been blacklisted for unauthorized memory alterations, client-side signature forgery, or unfair competitive manipulation.
      </p>
      <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #EF4444; padding: 0.85rem 1.5rem; border-radius: 8px; color: #FCA5A5; font-size: 0.95rem;">
        Hardware &amp; Browser Verdict Token: <span style="color: #FFFFFF; font-weight: bold;">PERMANENTLY_BANNED</span>
      </div>
      <p style="margin-top: 2rem; color: #64748B; font-size: 0.8rem;">
        Olympiad Edge Security Hammer · Code 0x88F9A · Zero Appeal Policy
      </p>
    </div>
  `;
  document.body.style.overflow = 'hidden';
}

function renderSecurityWarningModal(title, msg) {
  let modal = document.getElementById('security-strike-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'security-strike-modal';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.88); backdrop-filter: blur(12px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 1.5rem;';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div style="background: #111827; border: 2px solid #EF4444; border-radius: 1rem; max-width: 500px; width: 100%; padding: 2rem; box-shadow: 0 0 40px rgba(239, 68, 68, 0.4); text-align: center;">
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🛡️</div>
      <h3 style="color: #EF4444; font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem;">${title}</h3>
      <p style="color: #E2E8F0; font-size: 0.95rem; line-height: 1.55; margin-bottom: 1.5rem;">${msg}</p>
      <button id="dismiss-strike-modal-btn" style="background: #EF4444; color: #FFFFFF; border: none; padding: 0.75rem 1.75rem; border-radius: 0.5rem; font-weight: 800; cursor: pointer; font-size: 0.95rem;">
        Acknowledge Penalty
      </button>
    </div>
  `;
  const btn = document.getElementById('dismiss-strike-modal-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      modal.remove();
    });
  }
}

// ============================================================================
// 3. SERVERLESS ONBOARDING & PROFILE DIRECTORY INITIALIZATION
// ============================================================================

export function generateUniqueTokenHandle(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars[array[i] % chars.length];
  }
  return res;
}

export function initServerlessOnboarding() {
  // Hard Lockout Check
  if (localStorage.getItem('prime_factor_security_verdict') === 'PERMANENTLY_BANNED') {
    renderPermanentBanScreen();
    throw new Error('Hard Lockout Active');
  }

  // Check existing token handle
  let token = localStorage.getItem('primefactor_profile_token');
  if (!token) {
    // Brand new user sequence
    token = generateUniqueTokenHandle(8);
    localStorage.setItem('primefactor_profile_token', token);
    localStorage.setItem('primefactor_profile_username', token);
    
    // Baseline statistics
    localStorage.setItem('primefactor_elo', '1000');
    localStorage.setItem('primefactor_peak_elo', '1000');
    localStorage.setItem('primefactor_total_solved', '0');
    localStorage.setItem('primefactor_total_matches', '0');
    localStorage.setItem('primefactor_historical_accuracy', '0');
    localStorage.setItem('primefactor_match_logs', JSON.stringify([]));
    localStorage.setItem('primefactor_last_rated_date', new Date().toISOString());

    // Sign directory
    reSignProfileDirectory();
  } else {
    // Verify directory integrity
    verifyProfileIntegrity();
  }

  // Check midnight time-zone inactivity decay loop
  checkInactivityDecay();
}

export function reSignProfileDirectory() {
  const payload = {
    token: localStorage.getItem('primefactor_profile_token') || '',
    elo: localStorage.getItem('primefactor_elo') || '1000',
    peak: localStorage.getItem('primefactor_peak_elo') || '1000',
    solved: localStorage.getItem('primefactor_total_solved') || '0',
    matches: localStorage.getItem('primefactor_total_matches') || '0'
  };
  const signature = computeHMAC(JSON.stringify(payload));
  localStorage.setItem('primefactor_profile_sig', signature);
}

export function verifyProfileIntegrity() {
  const sig = localStorage.getItem('primefactor_profile_sig');
  if (!sig) {
    reSignProfileDirectory();
    return true;
  }
  const payload = {
    token: localStorage.getItem('primefactor_profile_token') || '',
    elo: localStorage.getItem('primefactor_elo') || '1000',
    peak: localStorage.getItem('primefactor_peak_elo') || '1000',
    solved: localStorage.getItem('primefactor_total_solved') || '0',
    matches: localStorage.getItem('primefactor_total_matches') || '0'
  };
  const expectedSig = computeHMAC(JSON.stringify(payload));
  if (sig !== expectedSig) {
    handleSecurityViolation(1, 'Profile Directory Signature Mismatch');
    return false;
  }
  return true;
}

// Inactivity Decay Check (14 days idle at 1800+ ELO -> -10 ELO per week)
export function checkInactivityDecay() {
  try {
    const userElo = getUserElo();
    if (userElo < 1800) return;

    const lastRatedStr = localStorage.getItem('primefactor_last_rated_date');
    if (!lastRatedStr) {
      localStorage.setItem('primefactor_last_rated_date', new Date().toISOString());
      return;
    }

    const lastDate = new Date(lastRatedStr);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 14) {
      const weeksOverdue = Math.floor((diffDays - 14) / 7) + 1;
      const penalty = weeksOverdue * 10;
      if (penalty > 0) {
        const nextElo = Math.max(1800, userElo - penalty);
        setUserElo(nextElo);
        localStorage.setItem('primefactor_last_rated_date', now.toISOString());
        reSignProfileDirectory();
        console.warn(`[Inactivity Decay] -${penalty} ELO applied for ${diffDays} days inactivity.`);
      }
    }
  } catch (e) {
    console.warn('Inactivity check error:', e);
  }
}

// ============================================================================
// 4. USER ELO READ / WRITE API
// ============================================================================

export function getUserElo() {
  try {
    const raw = localStorage.getItem('primefactor_elo');
    if (raw && !isNaN(Number(raw)) && Number(raw) >= 0) {
      return Math.round(Number(raw));
    }
  } catch (e) {
    console.warn('Error reading ELO:', e);
  }
  return 1000; // Sieve Calibrator floor
}

export function setUserElo(newElo) {
  const safeElo = Math.max(0, Math.round(Number(newElo) || 0));
  localStorage.setItem('primefactor_elo', String(safeElo));

  const peak = Math.max(safeElo, Number(localStorage.getItem('primefactor_peak_elo') || 1000));
  localStorage.setItem('primefactor_peak_elo', String(peak));

  reSignProfileDirectory();
  return safeElo;
}

export function getUserPeakElo() {
  const current = getUserElo();
  const peak = Number(localStorage.getItem('primefactor_peak_elo') || 1000);
  return Math.max(current, peak);
}

// ============================================================================
// 5. ASYMMETRIC TIER-BANNING CAPABILITY CEILING CHECKS
// ============================================================================

export function isRangeBannedForElo(userElo, maxBound) {
  const tier = getTierByElo(userElo);
  const targetTierNum = getTierNumberFromMax(maxBound);
  return tier.lockedTiers.includes(targetTierNum);
}

export function getTierBanCeilingDescription(maxBound) {
  const tierNum = getTierNumberFromMax(maxBound);
  if (tierNum === 1) return 'Tier 1 (1 - 200) requires ELO < 1800 for Rated Contests.';
  if (tierNum === 2) return 'Tier 2 (201 - 500) requires ELO < 2000 for Rated Contests.';
  if (tierNum === 3) return 'Tier 3 (501 - 1,000) requires ELO < 2200 for Rated Contests.';
  if (tierNum === 4) return 'Tier 4 (1,001 - 2,000) requires ELO < 2400 for Rated Contests.';
  if (tierNum === 5) return 'Tier 5 (2,001 - 5,000) requires ELO < 2700 for Rated Contests.';
  if (tierNum === 6) return 'Tier 6 (5,001 - 10,000) requires ELO < 3000 for Rated Contests.';
  return 'Competitive tier open to all rated contenders.';
}

// ============================================================================
// 6. OFFICIAL ELO CALCULATION ENGINE
// Delta R = K * (Net Accuracy% - E) * V
// ============================================================================

export function calculateEloDelta(params) {
  const {
    userElo,
    maxBound,
    accuracyPct,      // 0 - 100
    allocatedSeconds, // e.g. 180
    actualSeconds,    // e.g. 35
    isForcedUnrated = false,
    participationMode = 'rated',
    streakCount = 0
  } = params;

  // Asymmetric Override: Unrated or Forced Unrated yields Delta ELO = 0
  if (isForcedUnrated || participationMode === 'unrated') {
    return {
      deltaR: 0,
      expected: 0.85,
      velocity: 1.0,
      kFactor: 32,
      isForcedUnrated: true,
      expectationStatus: '⏸️ Deactivated',
      comment: 'Training'
    };
  }

  // 1. Expected Outcome Seed (E)
  const tierBaseline = getTierBaselineFromRange(maxBound);
  // Standard logistic ELO expectation formula, normalized [0, 1]
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
    rawDelta = rawDelta * dampeningFactor; // Diminishing returns on positive gains
  }
  // Negative rating drops are left completely unshielded!

  const finalDelta = Math.round(rawDelta);

  const supportiveRemarks = ['Amazing!', 'Brilliant!', 'Flawless!', 'Spectacular!', 'Mastery!'];
  const criticalRemarks = ['Unexpected', 'Slumped', 'Sub-par', 'Velocity Slack', 'Hesitant'];

  const isPassed = finalDelta > 0;
  const expectationStatus = isPassed ? '✔️ Passed' : '❌ Failed';
  const comment = isPassed
    ? supportiveRemarks[Math.floor(Math.random() * supportiveRemarks.length)]
    : criticalRemarks[Math.floor(Math.random() * criticalRemarks.length)];

  return {
    deltaR: finalDelta,
    expected: +(E * 100).toFixed(1),
    velocity: +V.toFixed(2),
    kFactor: +K.toFixed(1),
    isForcedUnrated: false,
    expectationStatus,
    comment
  };
}

// Record completed match into profile logs
export function recordRatedMatchToProfile(matchData) {
  try {
    const rawLogs = localStorage.getItem('primefactor_match_logs');
    const logs = rawLogs ? JSON.parse(rawLogs) : [];

    logs.unshift({
      id: Date.now(),
      tier: matchData.tier || 'Tier 1: 1 - 200',
      accuracy: matchData.accuracy || 100,
      time: matchData.time || 24.6,
      score: matchData.score || 85,
      eloDelta: matchData.eloDelta || 0,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });

    // Keep last 25 matches in active cache
    const trimmed = logs.slice(0, 25);
    localStorage.setItem('primefactor_match_logs', JSON.stringify(trimmed));

    // Update cumulative matches & accuracy
    const matchesCount = (Number(localStorage.getItem('primefactor_total_matches') || 0)) + 1;
    localStorage.setItem('primefactor_total_matches', String(matchesCount));

    const totalSolved = (Number(localStorage.getItem('primefactor_total_solved') || 0)) + (matchData.correctCount || 10);
    localStorage.setItem('primefactor_total_solved', String(totalSolved));

    localStorage.setItem('primefactor_last_rated_date', new Date().toISOString());

    reSignProfileDirectory();
  } catch (e) {
    console.warn('Error recording rated match:', e);
  }
}

// Execute unskippable root initialization hook immediately on import!
initServerlessOnboarding();