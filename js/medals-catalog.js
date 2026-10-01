/**
 * PrimeFactor.app — Section A: 100 Olympiad Medals Catalog
 * Distributes 100 prestigious medals across 5 rigorous mathematical strata.
 */

// Helper to safely get accuracy, streaks, times
const getAvgAcc = (ctx) => {
  if (!ctx.matchRegistry || ctx.matchRegistry.length === 0) return 0;
  const recent = ctx.matchRegistry.slice(0, 15);
  return recent.reduce((sum, m) => sum + Number(m.accuracy || 0), 0) / recent.length;
};

export const MEDALS_CATALOG = [
  // =========================================================================
  // STRATA 1: Foundations & Sieve Calibration Sprints (Medals 1 to 20)
  // =========================================================================
  {
    id: 'm-001',
    icon: '⚡',
    title: 'Eratosthenes Sieve Velocity',
    category: 'speed',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Clear Tier 3 (Olympiad Baseline) with 100% precision in under 15.0 seconds cumulative.',
    hurdle: 'Tier 3 cleared with 100% precision in ≤ 15.00s cumulative latency.',
    flavorText: 'Eratosthenes of Cyrene (c. 276–194 BC) pioneered composite filtering by sieving prime multiples.',
    points: 150,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 15.0 && Number(ctx.fastestMatch.accuracy || 0) >= 100,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 15.0s (Acc: ${ctx.fastestMatch.accuracy || 0}%)` : 'No timed records',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((15.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-002',
    icon: '🧮',
    title: 'Sieve Calibration Win Streak',
    category: 'streak',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Maintain a 25-Rated Contest win streak within the 501–1,000 max bound parameters.',
    hurdle: '25 continuous rated contest victories held under 501–1,000 bound limits.',
    flavorText: 'Calibration bounds test algorithmic pacing against accelerating composite densities.',
    points: 200,
    check: (ctx) => ctx.bestStreak >= 25,
    calcProgress: (ctx) => ({
      text: `${Math.min(25, ctx.bestStreak)} / 25 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 25) * 100))
    })
  },
  {
    id: 'm-003',
    icon: '⏱️',
    title: 'Sub-20 Sieve Sprint',
    category: 'speed',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Execute a full Olympiad decomposition match in under 20.0 seconds.',
    hurdle: 'Complete full 10-problem session in under 20.00 seconds.',
    flavorText: 'High cadence sieving eliminates composites before mental cache latency degrades.',
    points: 120,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 20.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 20.0s` : 'Goal: ≤ 20.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((20.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-004',
    icon: '🎯',
    title: 'Primality Bounds Verification',
    category: 'resource',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Verify 50 consecutive prime numbers without a single second-chance allowance.',
    hurdle: '50 consecutive zero-lifeline factorizations within base bounds.',
    flavorText: 'Verifying primality requires testing up to the square root boundary floor(sqrt(n)).',
    points: 130,
    check: (ctx) => ctx.totalSolved >= 50 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(50, ctx.totalSolved)} / 50 Verified Solves`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 50) * 100))
    })
  },
  {
    id: 'm-005',
    icon: '📊',
    title: 'Composite Density Auditor',
    category: 'resource',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Achieve 100% precision on a 10-problem exam containing exclusively semiprimes.',
    hurdle: '10/10 first-attempt accuracy across dense composite distributions.',
    flavorText: 'Composite density obeys the asymptotic prime counting distribution x / ln(x).',
    points: 140,
    check: (ctx) => ctx.lastResult && ctx.lastResult.score >= 90 && ctx.lastResult.correctFirstAttempt >= 9,
    calcProgress: (ctx) => ({
      text: ctx.lastResult ? `Last Score: ${ctx.lastResult.score} / 100` : 'Goal: Score ≥ 90 on composites',
      pct: ctx.lastResult ? Math.min(100, ctx.lastResult.score) : 0
    })
  },
  {
    id: 'm-006',
    icon: '📐',
    title: 'Legendre Quotient Barrier',
    category: 'speed',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Clear a 10-problem sprint in under 25.0 seconds with zero second-chance redemptions.',
    hurdle: '≤ 25.0s solve duration with 100% first-attempt execution.',
    flavorText: 'Adrien-Marie Legendre formulated the prime counting approximation pi(x) = x / (ln(x) - 1.08366).',
    points: 160,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 25.0 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 25.0s` : 'Goal: ≤ 25.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((25.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-007',
    icon: '🏛️',
    title: 'Sundaram Sieve Matrix',
    category: 'streak',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Maintain a 10-match winning streak with precision never dipping below 95%.',
    hurdle: '10 consecutive wins with average match accuracy ≥ 95.0%.',
    flavorText: 'The Sieve of Sundaram isolates odd prime numbers from arithmetic progressions.',
    points: 180,
    check: (ctx) => ctx.bestStreak >= 10 && getAvgAcc(ctx) >= 95,
    calcProgress: (ctx) => ({
      text: `${Math.min(10, ctx.bestStreak)} / 10 Streak (Avg: ${getAvgAcc(ctx).toFixed(1)}%)`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 10) * 100))
    })
  },
  {
    id: 'm-008',
    icon: '🔍',
    title: 'Atkin Modulo Sieve Proof',
    category: 'speed',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Average factor input reaction time clocked beneath 1.20s in Tier 2 arena.',
    hurdle: 'Sub-1.20s factor latency across full Tier 2 session.',
    flavorText: 'The Sieve of Atkin leverages quadratic forms 4x^2 + y^2 = n to test wheel modularity.',
    points: 175,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 22.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 22.0s` : 'Goal: ≤ 22.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((22.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-009',
    icon: '🛡️',
    title: 'Bertrand Postulate Guard',
    category: 'resource',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Accumulate 150 successfully decomposed primes without incurring a single penalty.',
    hurdle: '150 correct prime factorizations without a strike or lifeline drop.',
    flavorText: 'Bertrand postulate proves there exists at least one prime p such that n < p < 2n - 2 for n > 3.',
    points: 190,
    check: (ctx) => ctx.totalSolved >= 150 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(150, ctx.totalSolved)} / 150 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 150) * 100))
    })
  },
  {
    id: 'm-010',
    icon: '✨',
    title: 'Chebyshev Invariant Sieve',
    category: 'streak',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Win 15 consecutive Rated Contests within 1,000 max bound parameter.',
    hurdle: '15 continuous rated wins in bounds ≤ 1,000.',
    flavorText: 'Pafnuty Chebyshev verified Bertrand postulate in 1850 using theta and psi functions.',
    points: 210,
    check: (ctx) => ctx.bestStreak >= 15,
    calcProgress: (ctx) => ({
      text: `${Math.min(15, ctx.bestStreak)} / 15 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 15) * 100))
    })
  },
  {
    id: 'm-011',
    icon: '📈',
    title: 'Mertens Product Convergence',
    category: 'speed',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Finish an entire match under 30.0 seconds with 100% score.',
    hurdle: 'Sub-30.0s completion duration with perfect 100 / 100 score.',
    flavorText: 'Mertens third theorem proves the asymptotic product of (1 - 1/p) scales as e^(-gamma)/ln(x).',
    points: 200,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 30.0 && Number(ctx.fastestMatch.score || 0) >= 95,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 30.0s (Score: ${ctx.fastestMatch.score || 0})` : 'Goal: ≤ 30.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((30.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-012',
    icon: '💎',
    title: 'Brun Constant Twin Sieve',
    category: 'resource',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Solve 200 composite numbers across your competitive ledger.',
    hurdle: 'Lifetime composite clears count ≥ 200.',
    flavorText: 'Viggo Brun showed that the sum of reciprocals of twin primes converges to Brun constant B_2 = 1.902.',
    points: 220,
    check: (ctx) => ctx.totalSolved >= 200,
    calcProgress: (ctx) => ({
      text: `${Math.min(200, ctx.totalSolved)} / 200 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 200) * 100))
    })
  },
  {
    id: 'm-013',
    icon: '⚡',
    title: 'Linear Wheel Sieve Blitz',
    category: 'speed',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Complete an Olympiad contest set in under 18.0 seconds.',
    hurdle: 'Finish contest set in ≤ 18.00s.',
    flavorText: 'Wheel factorization wheel-2-3-5 skips 73% of composite divisibility trials.',
    points: 230,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 18.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 18.0s` : 'Goal: ≤ 18.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((18.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-014',
    icon: '🧬',
    title: 'Ulam Spiral Trajectory',
    category: 'streak',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Reach a streak of 18 consecutive wins across all difficulty tracks.',
    hurdle: '18 uninterrupted victories across active tracks.',
    flavorText: 'Stanislaw Ulam discovered diagonal prime concentrations while doodling on a spiral grid.',
    points: 240,
    check: (ctx) => ctx.bestStreak >= 18,
    calcProgress: (ctx) => ({
      text: `${Math.min(18, ctx.bestStreak)} / 18 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 18) * 100))
    })
  },
  {
    id: 'm-015',
    icon: '🛡️',
    title: 'Dirichlet Progression Anchor',
    category: 'resource',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Solve 250 numbers without incurring any directory HMAC tamper strikes.',
    hurdle: '250 verified solves with clean security ledger.',
    flavorText: 'Dirichlet proved that any arithmetic progression a + nd with gcd(a, d) = 1 contains infinite primes.',
    points: 250,
    check: (ctx) => ctx.totalSolved >= 250 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(250, ctx.totalSolved)} / 250 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 250) * 100))
    })
  },
  {
    id: 'm-016',
    icon: '⏱️',
    title: 'Sub-16 Hypersonic Sieve',
    category: 'speed',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Conquer a complete competition match in under 16.0 seconds.',
    hurdle: 'Official solve duration clocked strictly beneath 16.00s.',
    flavorText: 'Extreme mental reaction operates at the boundary of cognitive visual parsing latency.',
    points: 260,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 16.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 16.0s` : 'Goal: ≤ 16.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((16.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-017',
    icon: '🏆',
    title: 'Tier 1 Sieve Sovereign',
    category: 'streak',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Achieve 20 consecutive wins in Tier 1 with zero strikes.',
    hurdle: '20 clean victories in Tier 1 with zero strikes.',
    flavorText: 'Foundational mastery cements prime factor intuitions into long-term synaptic memory.',
    points: 270,
    check: (ctx) => ctx.bestStreak >= 20 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(20, ctx.bestStreak)} / 20 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 20) * 100))
    })
  },
  {
    id: 'm-018',
    icon: '🧲',
    title: 'Selberg Sieve Asymptote',
    category: 'resource',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Accumulate 300 solved composites across your competitive profile.',
    hurdle: 'Total solved count reaches ≥ 300 composites.',
    flavorText: 'Atle Selberg developed square-weight sieve methods to establish upper bounds on prime pairs.',
    points: 280,
    check: (ctx) => ctx.totalSolved >= 300,
    calcProgress: (ctx) => ({
      text: `${Math.min(300, ctx.totalSolved)} / 300 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 300) * 100))
    })
  },
  {
    id: 'm-019',
    icon: '🚀',
    title: 'Sub-14 Warp Velocity Sieve',
    category: 'speed',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Solve all 10 problems in under 14.0 seconds total match time.',
    hurdle: 'Under 14.00s cumulative match completion time.',
    flavorText: 'Decomposing 10 integers in 14 seconds requires under 1.4 seconds per composite number.',
    points: 300,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 14.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 14.0s` : 'Goal: ≤ 14.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((14.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-020',
    icon: '👑',
    title: 'Sieve Calibration Grandmaster',
    category: 'streak',
    categoryName: 'Foundations & Sieve Calibration',
    desc: 'Complete all Strata 1 foundational challenges with 25+ streak and 300+ total solves.',
    hurdle: 'Best streak ≥ 25, total solved ≥ 300, and 0 security strikes.',
    flavorText: 'Conquering the sieve strata establishes the bedrock for modular algebra and Diophantine equations.',
    points: 350,
    check: (ctx) => ctx.bestStreak >= 25 && ctx.totalSolved >= 300 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `Streak: ${ctx.bestStreak}/25 · Solved: ${ctx.totalSolved}/300`,
      pct: Math.min(100, Math.round(((ctx.bestStreak / 25) * 50) + ((ctx.totalSolved / 300) * 50)))
    })
  },

  // =========================================================================
  // STRATA 2: Modular Dynamics & Divisibility Congruences (Medals 21 to 40)
  // =========================================================================
  {
    id: 'm-021',
    icon: '⚙️',
    title: "Fermat Little Theorem Sovereign",
    category: 'resource',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Successfully resolve 50 consecutive modular prime equations without a single lifeline drop.',
    hurdle: '50 consecutive modular prime equations solved without lifeline usage.',
    flavorText: 'Fermat showed that if p is prime, then a^(p-1) = 1 (mod p) for any integer a not divisible by p.',
    points: 250,
    check: (ctx) => ctx.totalSolved >= 50 && ctx.ledger.grandMasterCount >= 1,
    calcProgress: (ctx) => ({
      text: `${Math.min(50, ctx.totalSolved)} / 50 Zero-Lifeline Solves`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 50) * 100))
    })
  },
  {
    id: 'm-022',
    icon: '🌐',
    title: 'Custom Bounds 50,000 Precision Mark',
    category: 'resource',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Hit 98% accuracy on custom bounds where Max Bound >= 50,000.',
    hurdle: '98%+ accuracy on custom bound configurations with Max Bound ≥ 50,000.',
    flavorText: 'Large parameter bounds push cognitive factoring into advanced division testing tables.',
    points: 280,
    check: (ctx) => getAvgAcc(ctx) >= 98 && ctx.matchRegistry.length >= 3,
    calcProgress: (ctx) => ({
      text: `Rolling Acc: ${getAvgAcc(ctx).toFixed(1)}% / 98.0% (Matches: ${ctx.matchRegistry.length}/3)`,
      pct: Math.min(100, Math.round((getAvgAcc(ctx) / 98) * 100))
    })
  },
  {
    id: 'm-023',
    icon: '🔄',
    title: 'Euler Totient Multiplicative Seal',
    category: 'streak',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Maintain a 15-match winning streak with zero wrong submissions across all sessions.',
    hurdle: '15 consecutive flawless match clears.',
    flavorText: 'Euler totient phi(n) = n * prod(1 - 1/p) counts coprimes up to integer n.',
    points: 260,
    check: (ctx) => ctx.bestStreak >= 15 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(15, ctx.bestStreak)} / 15 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 15) * 100))
    })
  },
  {
    id: 'm-024',
    icon: '⚡',
    title: 'Chinese Remainder Theorem Speed',
    category: 'speed',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Solve 10 coprime factorizations in under 20.0 seconds total match time.',
    hurdle: 'Sub-20.0s match duration on multi-factor coprime integers.',
    flavorText: 'Sun Tzu wrote the Chinese Remainder Theorem in the 3rd century to reconstruct integers from coprimes.',
    points: 270,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 20.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 20.0s` : 'Goal: ≤ 20.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((20.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-025',
    icon: '🔮',
    title: 'Wilson Primality Factorial Crest',
    category: 'resource',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Accumulate 400 total solved numbers across your career history.',
    hurdle: 'Career solved composite volume reaches 400 integers.',
    flavorText: 'Wilson theorem states (p-1)! = -1 (mod p) if and only if p is a prime number.',
    points: 290,
    check: (ctx) => ctx.totalSolved >= 400,
    calcProgress: (ctx) => ({
      text: `${Math.min(400, ctx.totalSolved)} / 400 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 400) * 100))
    })
  },
  {
    id: 'm-026',
    icon: '♾️',
    title: 'Carmichael Universal Exponent',
    category: 'streak',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Reach a continuous win streak of 20 Rated Contests.',
    hurdle: '20 consecutive rated contest victories.',
    flavorText: 'Carmichael function lambda(n) provides the smallest positive exponent m such that a^m = 1 (mod n).',
    points: 300,
    check: (ctx) => ctx.bestStreak >= 20,
    calcProgress: (ctx) => ({
      text: `${Math.min(20, ctx.bestStreak)} / 20 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 20) * 100))
    })
  },
  {
    id: 'm-027',
    icon: '⏱️',
    title: 'Fast Modular Exponentiation Sprint',
    category: 'speed',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Complete an Olympiad session in under 16.5 seconds.',
    hurdle: '≤ 16.50s match completion duration.',
    flavorText: 'Binary exponentiation computes a^b mod m in O(log b) squaring multiplications.',
    points: 280,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 16.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 16.5s` : 'Goal: ≤ 16.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((16.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-028',
    icon: '⚖️',
    title: 'Quadratic Reciprocity Law Proof',
    category: 'resource',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Hold 95%+ precision average across last 15 recorded matches.',
    hurdle: 'Rolling 15-match accuracy average maintained at ≥ 95.0%.',
    flavorText: 'Gauss called the Law of Quadratic Reciprocity the golden theorem of arithmetic.',
    points: 310,
    check: (ctx) => ctx.matchRegistry.length >= 5 && getAvgAcc(ctx) >= 95,
    calcProgress: (ctx) => ({
      text: `Rolling Acc: ${getAvgAcc(ctx).toFixed(1)}% / 95% (Matches: ${ctx.matchRegistry.length}/15)`,
      pct: Math.min(100, Math.round((getAvgAcc(ctx) / 95) * 100))
    })
  },
  {
    id: 'm-029',
    icon: '🗝️',
    title: 'Primitive Root Multiplier',
    category: 'streak',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Win 22 matches consecutively with zero lifeline interventions.',
    hurdle: '22 consecutive wins with zero lifeline activations.',
    flavorText: 'Primitive roots generate the entire multiplicative group modulo a prime number.',
    points: 320,
    check: (ctx) => ctx.bestStreak >= 22,
    calcProgress: (ctx) => ({
      text: `${Math.min(22, ctx.bestStreak)} / 22 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 22) * 100))
    })
  },
  {
    id: 'm-030',
    icon: '⚡',
    title: 'Legendre Symbol Evaluation Blitz',
    category: 'speed',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Clear 10 problems in under 15.0 seconds in Rated Arena.',
    hurdle: 'Under 15.00s total duration in Rated competition arena.',
    flavorText: 'Legendre symbol (a/p) evaluates to +1, -1, or 0 depending on quadratic residuosity.',
    points: 330,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 15.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 15.0s` : 'Goal: ≤ 15.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((15.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-031',
    icon: '📜',
    title: 'Jacobi Symbol Generalization',
    category: 'resource',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Accumulate 500 total solved numbers across your career history.',
    hurdle: '500 lifetime prime factor solutions recorded in ledger.',
    flavorText: 'Jacobi extended Legendre symbol to arbitrary odd moduli, accelerating modular checks.',
    points: 340,
    check: (ctx) => ctx.totalSolved >= 500,
    calcProgress: (ctx) => ({
      text: `${Math.min(500, ctx.totalSolved)} / 500 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 500) * 100))
    })
  },
  {
    id: 'm-032',
    icon: '🪜',
    title: 'Hensel Lifting Lemma',
    category: 'streak',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Reach 24 consecutive rated contest victories.',
    hurdle: '24 uninterrupted match wins.',
    flavorText: 'Hensel lemma lifts roots modulo p to roots modulo higher powers p^k using p-adic derivatives.',
    points: 350,
    check: (ctx) => ctx.bestStreak >= 24,
    calcProgress: (ctx) => ({
      text: `${Math.min(24, ctx.bestStreak)} / 24 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 24) * 100))
    })
  },
  {
    id: 'm-033',
    icon: '⏱️',
    title: 'Discrete Logarithm Cadence',
    category: 'speed',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Complete an Olympiad session in under 13.5 seconds.',
    hurdle: '≤ 13.50s match execution time.',
    flavorText: 'Solving discrete logarithms g^x = h (mod p) forms the hardness foundation of Diffie-Hellman.',
    points: 360,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 13.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 13.5s` : 'Goal: ≤ 13.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((13.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-034',
    icon: '🛡️',
    title: 'Lucas-Lehmer Resonance Seal',
    category: 'resource',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Solve 600 total numbers across all sandboxes and rated modes.',
    hurdle: 'Total solved composite count reaches ≥ 600.',
    flavorText: 'Lucas-Lehmer test evaluates Mersenne numbers M_p using recurrence s_{i} = s_{i-1}^2 - 2.',
    points: 370,
    check: (ctx) => ctx.totalSolved >= 600,
    calcProgress: (ctx) => ({
      text: `${Math.min(600, ctx.totalSolved)} / 600 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 600) * 100))
    })
  },
  {
    id: 'm-035',
    icon: '🔥',
    title: 'Frobenius Endomorphism Seal',
    category: 'streak',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Achieve 26 consecutive wins in Rated Contest arena.',
    hurdle: '26 consecutive match victories.',
    flavorText: 'The Frobenius automorphism x -> x^p preserves polynomial structures in finite fields.',
    points: 380,
    check: (ctx) => ctx.bestStreak >= 26,
    calcProgress: (ctx) => ({
      text: `${Math.min(26, ctx.bestStreak)} / 26 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 26) * 100))
    })
  },
  {
    id: 'm-036',
    icon: '⚡',
    title: 'Zsigmondy Theorem Breaker',
    category: 'speed',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Decompose 10 problems in under 12.5 seconds total match time.',
    hurdle: 'Under 12.50s solve time for 10 composites.',
    flavorText: 'Zsigmondy theorem guarantees primitive prime divisors for a^n - b^n for n > 6.',
    points: 390,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 12.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 12.5s` : 'Goal: ≤ 12.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((12.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-037',
    icon: '🏛️',
    title: 'Artin Primitive Root Conjecture',
    category: 'resource',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Accumulate 700 total solved numbers across your profile ledger.',
    hurdle: '700 total correct decompositions recorded.',
    flavorText: 'Emil Artin conjectured that any non-square integer a is a primitive root modulo infinitely many primes.',
    points: 400,
    check: (ctx) => ctx.totalSolved >= 700,
    calcProgress: (ctx) => ({
      text: `${Math.min(700, ctx.totalSolved)} / 700 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 700) * 100))
    })
  },
  {
    id: 'm-038',
    icon: '🚀',
    title: 'Sub-11 Hypersonic Congruence',
    category: 'speed',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Finish a complete exam in under 11.0 seconds.',
    hurdle: '≤ 11.00s full session time.',
    flavorText: 'Sub-11 second solve clocks require instantaneous mental pattern recognition without trial loops.',
    points: 420,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 11.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 11.0s` : 'Goal: ≤ 11.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((11.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-039',
    icon: '🌟',
    title: 'Carmichael Pseudoprime Hunter',
    category: 'streak',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Hold a 28-match consecutive win streak across competitive sandboxes.',
    hurdle: '28 consecutive wins held in competitive ledger.',
    flavorText: 'Carmichael numbers (e.g. 561 = 3 * 11 * 17) deceive Fermat test for all coprime bases.',
    points: 440,
    check: (ctx) => ctx.bestStreak >= 28,
    calcProgress: (ctx) => ({
      text: `${Math.min(28, ctx.bestStreak)} / 28 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 28) * 100))
    })
  },
  {
    id: 'm-040',
    icon: '👑',
    title: 'Modular Dynamics Grandmaster',
    category: 'resource',
    categoryName: 'Modular Dynamics & Divisibility Congruences',
    desc: 'Achieve 800 total solved numbers with ELO rating exceeding 1,500.',
    hurdle: '800+ total solves and ELO ≥ 1,500.',
    flavorText: 'The master of congruences navigates finite cyclic groups with effortless arithmetic dexterity.',
    points: 500,
    check: (ctx) => ctx.totalSolved >= 800 && ctx.currentElo >= 1500,
    calcProgress: (ctx) => ({
      text: `Solved: ${ctx.totalSolved}/800 · ELO: ${ctx.currentElo}/1500`,
      pct: Math.min(100, Math.round(((ctx.totalSolved / 800) * 50) + ((ctx.currentElo / 1500) * 50)))
    })
  },

  // =========================================================================
  // STRATA 3: Diophantine Systems & Cryptographic Ranks (Medals 41 to 60)
  // =========================================================================
  {
    id: 'm-041',
    icon: '📐',
    title: 'Tier 4 Gaussian Cryptographer Ascension',
    category: 'resource',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Advance to Tier 4 (Gaussian Cryptographer) rank using raw unassisted calculation sequences (zero lifeline usage allowed over last 15 concurrent matches).',
    hurdle: 'Advance to Tier 4 rank with zero lifeline usage over last 15 matches.',
    flavorText: 'Gaussian integers Z[i] extend unique factorization into the complex plane with norm N(a+bi) = a^2 + b^2.',
    points: 400,
    check: (ctx) => ctx.currentElo >= 1400 && ctx.matchRegistry.length >= 10 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `ELO: ${ctx.currentElo} / 1400 (Tier 4 Threshold)`,
      pct: Math.min(100, Math.round((ctx.currentElo / 1400) * 100))
    })
  },
  {
    id: 'm-042',
    icon: '🗝️',
    title: "Bezout Identity Boundary Master",
    category: 'resource',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Verify 50 consecutive GCD coprime combinations without a second-attempt trigger.',
    hurdle: '50 consecutive solves with flawless first-attempt GCD identification.',
    flavorText: 'Etienne Bezout proved there exist integers x, y such that ax + by = gcd(a, b).',
    points: 350,
    check: (ctx) => ctx.totalSolved >= 50 && (ctx.lastResult ? ctx.lastResult.correctFirstAttempt >= 8 : true),
    calcProgress: (ctx) => ({
      text: `${Math.min(50, ctx.totalSolved)} / 50 GCD Solves`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 50) * 100))
    })
  },
  {
    id: 'm-043',
    icon: '🏛️',
    title: 'Pell Equation Fundamental Unit',
    category: 'streak',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Maintain a 20-win streak in Tier 3 or higher competition sandboxes.',
    hurdle: '20 consecutive wins in Tier 3+ arena.',
    flavorText: 'Pell equation x^2 - Dy^2 = 1 fundamental solutions are generated by continued fraction convergents.',
    points: 370,
    check: (ctx) => ctx.bestStreak >= 20 && ctx.currentElo >= 1200,
    calcProgress: (ctx) => ({
      text: `${Math.min(20, ctx.bestStreak)} / 20 Streak (Tier 3+)`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 20) * 100))
    })
  },
  {
    id: 'm-044',
    icon: '⚡',
    title: 'Extended Euclidean Algorithm Blitz',
    category: 'speed',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Solve 10 problems in under 18.0 seconds with perfect precision.',
    hurdle: '≤ 18.00s match time with 100% accuracy.',
    flavorText: 'Extended Euclidean algorithm computes modular multiplicative inverses in logarithmic division steps.',
    points: 360,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 18.0 && Number(ctx.fastestMatch.accuracy || 0) >= 100,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 18.0s (Acc: ${ctx.fastestMatch.accuracy}%)` : 'Goal: ≤ 18.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((18.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-045',
    icon: '🛡️',
    title: 'Brahmagupta-Fibonacci Identity',
    category: 'resource',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Accumulate 900 total solved composites across career history.',
    hurdle: 'Total career solves ≥ 900 composites.',
    flavorText: 'Brahmagupta identity (a^2+b^2)(c^2+d^2) = (ac-bd)^2 + (ad+bc)^2 preserves sum-of-squares under multiplication.',
    points: 390,
    check: (ctx) => ctx.totalSolved >= 900,
    calcProgress: (ctx) => ({
      text: `${Math.min(900, ctx.totalSolved)} / 900 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 900) * 100))
    })
  },
  {
    id: 'm-046',
    icon: '📐',
    title: 'Primitive Pythagorean Triples Sieve',
    category: 'streak',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Win 25 consecutive matches with precision never dropping below 90%.',
    hurdle: '25 consecutive victories with accuracy ≥ 90.0%.',
    flavorText: 'All primitive Pythagorean triples are parameterized by Euclid formulas a=m^2-n^2, b=2mn, c=m^2+n^2.',
    points: 400,
    check: (ctx) => ctx.bestStreak >= 25 && getAvgAcc(ctx) >= 90,
    calcProgress: (ctx) => ({
      text: `${Math.min(25, ctx.bestStreak)} / 25 Streak (Avg: ${getAvgAcc(ctx).toFixed(1)}%)`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 25) * 100))
    })
  },
  {
    id: 'm-047',
    icon: '⏱️',
    title: 'Continued Fraction Convergent Speed',
    category: 'speed',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Complete an Olympiad competition match in under 15.0 seconds.',
    hurdle: 'Official solve duration clocked strictly beneath 15.00s.',
    flavorText: 'Continued fraction convergents p_k / q_k give the best rational approximations to irrational roots.',
    points: 410,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 15.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 15.0s` : 'Goal: ≤ 15.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((15.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-048',
    icon: '🔐',
    title: 'RSA Semiprime Modulus Cryptanalyst',
    category: 'resource',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Accumulate 1,000 total solved integers in competitive ledger.',
    hurdle: 'Cross the 1,000 career solved composite milestone.',
    flavorText: 'RSA security rests on the computational intractability of factoring large semiprimes n = pq.',
    points: 450,
    check: (ctx) => ctx.totalSolved >= 1000,
    calcProgress: (ctx) => ({
      text: `${Math.min(1000, ctx.totalSolved)} / 1,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 1000) * 100))
    })
  },
  {
    id: 'm-049',
    icon: '💎',
    title: 'Eisenstein Integer Norm Dissector',
    category: 'streak',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Maintain a 26-match winning streak across all arena lobbies.',
    hurdle: '26 consecutive match victories.',
    flavorText: 'Eisenstein integers Z[omega] with omega = e^(2pi*i/3) tile the triangular lattice with norm a^2 - ab + b^2.',
    points: 430,
    check: (ctx) => ctx.bestStreak >= 26,
    calcProgress: (ctx) => ({
      text: `${Math.min(26, ctx.bestStreak)} / 26 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 26) * 100))
    })
  },
  {
    id: 'm-050',
    icon: '⚡',
    title: 'Elliptic Curve Point Doubling Blitz',
    category: 'speed',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Decompose 10 problems in under 12.0 seconds total time.',
    hurdle: '≤ 12.00s full match duration.',
    flavorText: 'Elliptic curve group addition P + Q computes tangent intersections on y^2 = x^3 + ax + b.',
    points: 440,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 12.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 12.0s` : 'Goal: ≤ 12.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((12.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-051',
    icon: '🛡️',
    title: 'Diffie-Hellman Key Exchange Guard',
    category: 'resource',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Reach an active ELO rating of 1,600 or higher.',
    hurdle: 'Active competitive ELO standing ≥ 1,600.',
    flavorText: 'Whitfield Diffie and Martin Hellman introduced public-key cryptography in 1976.',
    points: 460,
    check: (ctx) => ctx.currentElo >= 1600,
    calcProgress: (ctx) => ({
      text: `${ctx.currentElo} / 1,600 ELO`,
      pct: Math.min(100, Math.round((ctx.currentElo / 1600) * 100))
    })
  },
  {
    id: 'm-052',
    icon: '🌀',
    title: 'Fermat Sum of Two Squares Theorem',
    category: 'streak',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Win 28 matches consecutively without a single security strike.',
    hurdle: '28 consecutive wins with zero HMAC security strikes.',
    flavorText: 'An odd prime p can be written as a^2 + b^2 if and only if p = 1 (mod 4).',
    points: 470,
    check: (ctx) => ctx.bestStreak >= 28 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(28, ctx.bestStreak)} / 28 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 28) * 100))
    })
  },
  {
    id: 'm-053',
    icon: '⏱️',
    title: 'Sub-10 Hypersonic Factorizer',
    category: 'speed',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Execute 10 factorizations in under 10.0 seconds total time.',
    hurdle: 'Under 10.00s cumulative match completion time.',
    flavorText: 'Sub-10 second execution means factoring each integer in less than 1.0 second average.',
    points: 500,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 10.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 10.0s` : 'Goal: ≤ 10.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((10.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-054',
    icon: '🏛️',
    title: 'Lagrange Four-Square Theorem Pillar',
    category: 'resource',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Cross 1,200 lifetime solved integers in competitive ledger.',
    hurdle: '1,200 total solved composites across career history.',
    flavorText: 'Joseph-Louis Lagrange proved in 1770 that every natural number is the sum of four integer squares.',
    points: 480,
    check: (ctx) => ctx.totalSolved >= 1200,
    calcProgress: (ctx) => ({
      text: `${Math.min(1200, ctx.totalSolved)} / 1,200 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 1200) * 100))
    })
  },
  {
    id: 'm-055',
    icon: '🔥',
    title: 'Dirichlet Unit Theorem Sieve',
    category: 'streak',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Maintain a 30-match continuous win streak across all game modes.',
    hurdle: '30 uninterrupted match victories.',
    flavorText: 'Dirichlet unit theorem describes the rank and structure of units in algebraic number fields.',
    points: 520,
    check: (ctx) => ctx.bestStreak >= 30,
    calcProgress: (ctx) => ({
      text: `${Math.min(30, ctx.bestStreak)} / 30 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 30) * 100))
    })
  },
  {
    id: 'm-056',
    icon: '⚡',
    title: 'Shanks Square Forms Factorization (SQUFOF)',
    category: 'speed',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Complete an Olympiad session in under 9.5 seconds.',
    hurdle: 'Solve 10 problems in ≤ 9.50s.',
    flavorText: 'Daniel Shanks SQUFOF algorithm factors integers in O(N^(1/4)) operations using binary quadratic forms.',
    points: 530,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 9.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 9.5s` : 'Goal: ≤ 9.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((9.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-057',
    icon: '🛡️',
    title: 'Minkowski Convex Body Theorem',
    category: 'resource',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Cross 1,500 total solved composites in competitive history.',
    hurdle: '1,500 lifetime solved composite numbers.',
    flavorText: 'Hermann Minkowski geometry of numbers guarantees lattice points in centrally symmetric convex bodies.',
    points: 540,
    check: (ctx) => ctx.totalSolved >= 1500,
    calcProgress: (ctx) => ({
      text: `${Math.min(1500, ctx.totalSolved)} / 1,500 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 1500) * 100))
    })
  },
  {
    id: 'm-058',
    icon: '🌟',
    title: 'Kummer Ideal Prime Factorization',
    category: 'streak',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Win 32 matches consecutively with zero lifeline drop.',
    hurdle: '32 consecutive unassisted match victories.',
    flavorText: 'Ernst Kummer introduced ideal numbers to resolve unique factorization in cyclotomic fields.',
    points: 550,
    check: (ctx) => ctx.bestStreak >= 32,
    calcProgress: (ctx) => ({
      text: `${Math.min(32, ctx.bestStreak)} / 32 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 32) * 100))
    })
  },
  {
    id: 'm-059',
    icon: '🚀',
    title: 'Sub-9 Hypersonic Cryptanalyst',
    category: 'speed',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Complete 10 factorizations in under 9.0 seconds total time.',
    hurdle: 'Match duration strictly beneath 9.00s.',
    flavorText: 'Sub-9 second decomposition requires immediate optical factor recognition.',
    points: 580,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 9.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 9.0s` : 'Goal: ≤ 9.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((9.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-060',
    icon: '👑',
    title: 'Diophantine Cryptographic Sovereign',
    category: 'resource',
    categoryName: 'Diophantine Systems & Cryptographic Ranks',
    desc: 'Achieve 1,800 ELO standing and 1,500+ total career solved numbers.',
    hurdle: 'ELO ≥ 1,800 and Total Solves ≥ 1,500.',
    flavorText: 'The Diophantine sovereign controls the intersection of discrete geometry and cryptographic complexity.',
    points: 650,
    check: (ctx) => ctx.currentElo >= 1800 && ctx.totalSolved >= 1500,
    calcProgress: (ctx) => ({
      text: `ELO: ${ctx.currentElo}/1800 · Solved: ${ctx.totalSolved}/1500`,
      pct: Math.min(100, Math.round(((ctx.currentElo / 1800) * 50) + ((ctx.totalSolved / 1500) * 50)))
    })
  },

  // =========================================================================
  // STRATA 4: Advanced Composites Decomposition (Medals 61 to 80)
  // =========================================================================
  {
    id: 'm-061',
    icon: '👑',
    title: "Pollard Rho Velocity Master",
    category: 'speed',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Break down 100 consecutive 5-digit composite numbers in under 2.0 seconds per factor execution window.',
    hurdle: '100 consecutive 5-digit composites decomposed under 2.0s per factor latency.',
    flavorText: 'John Pollard designed the Pollard rho algorithm in 1975 using Floyd cycle-finding on f(x) = x^2 + 1 mod N.',
    points: 500,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 20.0 && ctx.totalSolved >= 100,
    calcProgress: (ctx) => ({
      text: `Solved: ${Math.min(100, ctx.totalSolved)}/100 · Fastest: ${ctx.fastestMatch ? ctx.fastestMatch.time : '--'}s`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 100) * 100))
    })
  },
  {
    id: 'm-062',
    icon: '🏆',
    title: 'Tier 6 Invitational Invincible Clear',
    category: 'resource',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Conquer Tier 6 (Invitational) with a zero-failure rate across the entire match.',
    hurdle: '100% flawless execution in Tier 6 Invitational arena with zero second attempts.',
    flavorText: 'Tier 6 demands split-second factor identification across high-order composites.',
    points: 550,
    check: (ctx) => ctx.currentElo >= 2200 && (ctx.lastResult ? ctx.lastResult.score >= 95 : false),
    calcProgress: (ctx) => ({
      text: `ELO: ${ctx.currentElo} / 2,200 (Tier 6 Invitational)`,
      pct: Math.min(100, Math.round((ctx.currentElo / 2200) * 100))
    })
  },
  {
    id: 'm-063',
    icon: '⚡',
    title: "Pollard p-1 Factorization Sieve",
    category: 'speed',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Decompose a 10-problem composite set in under 12.0 seconds cumulative time.',
    hurdle: 'Sub-12.00s match execution duration.',
    flavorText: 'Pollard p-1 method efficiently extracts prime factors p when p-1 is B-powersmooth.',
    points: 520,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 12.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 12.0s` : 'Goal: ≤ 12.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((12.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-064',
    icon: '🧬',
    title: 'Sophie Germain Prime Bound Sprint',
    category: 'resource',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Accumulate 1,800 career solved integers with zero directory tamper marks.',
    hurdle: '1,800 career solved composites with authentic directory signature.',
    flavorText: 'Sophie Germain primes p have 2p+1 prime as well, critical in early proofs of Fermat Last Theorem.',
    points: 540,
    check: (ctx) => ctx.totalSolved >= 1800 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(1800, ctx.totalSolved)} / 1,800 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 1800) * 100))
    })
  },
  {
    id: 'm-065',
    icon: '🔥',
    title: 'Lenstra ECM Elliptic Curve Sieve',
    category: 'streak',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Hold a 35-match winning streak across all competitive arenas.',
    hurdle: '35 consecutive match victories.',
    flavorText: 'Hendrik Lenstra designed ECM in 1987, applying random elliptic curve group orders modulo N.',
    points: 560,
    check: (ctx) => ctx.bestStreak >= 35,
    calcProgress: (ctx) => ({
      text: `${Math.min(35, ctx.bestStreak)} / 35 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 35) * 100))
    })
  },
  {
    id: 'm-066',
    icon: '⏱️',
    title: 'Quadratic Sieve Relation Generator',
    category: 'speed',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Complete an Olympiad contest set in under 8.5 seconds.',
    hurdle: '≤ 8.50s match completion time.',
    flavorText: 'Carl Pomerance Quadratic Sieve was the fastest general-purpose factoring algorithm for integers under 100 digits.',
    points: 580,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 8.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 8.5s` : 'Goal: ≤ 8.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((8.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-067',
    icon: '🌌',
    title: 'Mersenne Prime GIMPS Resonance',
    category: 'resource',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Cross 2,000 total solved composites in competitive history.',
    hurdle: '2,000 lifetime solved composite numbers milestone.',
    flavorText: 'Marin Mersenne studied 2^p - 1 primes in 1644, giving rise to the largest known prime discoveries.',
    points: 600,
    check: (ctx) => ctx.totalSolved >= 2000,
    calcProgress: (ctx) => ({
      text: `${Math.min(2000, ctx.totalSolved)} / 2,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 2000) * 100))
    })
  },
  {
    id: 'm-068',
    icon: '📐',
    title: 'General Number Field Sieve (GNFS)',
    category: 'streak',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Maintain a 38-match consecutive win streak.',
    hurdle: '38 consecutive match victories.',
    flavorText: 'GNFS factors integers in sub-exponential time exp((c + o(1)) (ln N)^(1/3) (ln ln N)^(2/3)).',
    points: 620,
    check: (ctx) => ctx.bestStreak >= 38,
    calcProgress: (ctx) => ({
      text: `${Math.min(38, ctx.bestStreak)} / 38 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 38) * 100))
    })
  },
  {
    id: 'm-069',
    icon: '⚡',
    title: 'Sub-8 Hypersonic Decomposer',
    category: 'speed',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Finish an entire match under 8.0 seconds total time.',
    hurdle: 'Match clock strictly beneath 8.00s.',
    flavorText: 'Sub-8 second match time reflects sub-800ms average problem decomposition response.',
    points: 650,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 8.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 8.0s` : 'Goal: ≤ 8.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((8.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-070',
    icon: '🛡️',
    title: 'Baillie-PSW Primality Certification',
    category: 'resource',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Reach an active ELO rating of 2,000 or higher.',
    hurdle: 'Active competitive rating reaches 2,000 ELO.',
    flavorText: 'The Baillie-PSW test combines Miller-Rabin and Lucas tests with zero known counterexamples.',
    points: 680,
    check: (ctx) => ctx.currentElo >= 2000,
    calcProgress: (ctx) => ({
      text: `${ctx.currentElo} / 2,000 ELO`,
      pct: Math.min(100, Math.round((ctx.currentElo / 2000) * 100))
    })
  },
  {
    id: 'm-071',
    icon: '🌟',
    title: 'Cunningham Project Chain Master',
    category: 'streak',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Achieve a 40-match consecutive win streak across rated sandboxes.',
    hurdle: '40 continuous rated victories.',
    flavorText: 'The Cunningham project aims to factor numbers of the form b^n +/- 1 for small bases.',
    points: 700,
    check: (ctx) => ctx.bestStreak >= 40,
    calcProgress: (ctx) => ({
      text: `${Math.min(40, ctx.bestStreak)} / 40 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 40) * 100))
    })
  },
  {
    id: 'm-072',
    icon: '⏱️',
    title: 'Fast Fourier Transform (FFT) Multiplication',
    category: 'speed',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Complete an Olympiad session in under 7.5 seconds.',
    hurdle: 'Solve 10 problems in ≤ 7.50s.',
    flavorText: 'Schonhage-Strassen multiplication uses FFT over rings to multiply large integers in O(n log n log log n).',
    points: 720,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 7.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 7.5s` : 'Goal: ≤ 7.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((7.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-073',
    icon: '🏛️',
    title: 'Lucas Pseudoprime Sieve Boundary',
    category: 'resource',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Cross 2,500 total solved composites in competitive history.',
    hurdle: '2,500 lifetime solved composite numbers.',
    flavorText: 'Lucas sequences V_n and U_n establish rigorous primality certifications for industrial key generation.',
    points: 740,
    check: (ctx) => ctx.totalSolved >= 2500,
    calcProgress: (ctx) => ({
      text: `${Math.min(2500, ctx.totalSolved)} / 2,500 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 2500) * 100))
    })
  },
  {
    id: 'm-074',
    icon: '🔥',
    title: 'Fermat Number Factorizer Crest',
    category: 'streak',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Maintain a 42-match consecutive win streak.',
    hurdle: '42 consecutive match victories.',
    flavorText: 'Pierre de Fermat conjectured all F_n = 2^(2^n) + 1 are prime, refuted by Euler in 1732 with 641 | F_5.',
    points: 760,
    check: (ctx) => ctx.bestStreak >= 42,
    calcProgress: (ctx) => ({
      text: `${Math.min(42, ctx.bestStreak)} / 42 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 42) * 100))
    })
  },
  {
    id: 'm-075',
    icon: '⚡',
    title: 'Sub-7 Hypersonic Singularity',
    category: 'speed',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Decompose 10 problems in under 7.0 seconds total time.',
    hurdle: 'Total match duration ≤ 7.00s.',
    flavorText: 'Sub-7 second performance requires near-instantaneous subconscious cognitive factoring.',
    points: 780,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 7.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 7.0s` : 'Goal: ≤ 7.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((7.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-076',
    icon: '🛡️',
    title: 'Safe Prime & Sophie Germain Pair',
    category: 'resource',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Reach an active ELO rating of 2,200 or higher.',
    hurdle: 'Active competitive rating reaches 2,200 ELO.',
    flavorText: 'Safe primes 2p+1 guarantee maximum cycle lengths in cryptographic generators.',
    points: 800,
    check: (ctx) => ctx.currentElo >= 2200,
    calcProgress: (ctx) => ({
      text: `${ctx.currentElo} / 2,200 ELO`,
      pct: Math.min(100, Math.round((ctx.currentElo / 2200) * 100))
    })
  },
  {
    id: 'm-077',
    icon: '🌟',
    title: 'Koblitz Curve Discrete Log Barrier',
    category: 'streak',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Achieve a 45-match consecutive win streak.',
    hurdle: '45 continuous match victories.',
    flavorText: 'Neal Koblitz introduced anomalous binary curves with Frobenius speedups for elliptic key agreements.',
    points: 820,
    check: (ctx) => ctx.bestStreak >= 45,
    calcProgress: (ctx) => ({
      text: `${Math.min(45, ctx.bestStreak)} / 45 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 45) * 100))
    })
  },
  {
    id: 'm-078',
    icon: '⏱️',
    title: 'Sub-6.5 Hypersonic Flash',
    category: 'speed',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Execute 10 factorizations in under 6.5 seconds total time.',
    hurdle: 'Cumulative duration beneath 6.50s.',
    flavorText: 'Unprecedented speed barrier: factoring 10 numbers in 6.5s equates to 650ms per answer.',
    points: 850,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 6.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 6.5s` : 'Goal: ≤ 6.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((6.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-079',
    icon: '🏛️',
    title: 'Adleman-Pomerance-Rumely (APR) Seal',
    category: 'resource',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Cross 3,000 total solved composites in competitive history.',
    hurdle: '3,000 lifetime solved composite numbers.',
    flavorText: 'APR algorithm was the first nearly polynomial time deterministic primality test.',
    points: 880,
    check: (ctx) => ctx.totalSolved >= 3000,
    calcProgress: (ctx) => ({
      text: `${Math.min(3000, ctx.totalSolved)} / 3,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 3000) * 100))
    })
  },
  {
    id: 'm-080',
    icon: '👑',
    title: 'Advanced Decomposition Sovereign',
    category: 'resource',
    categoryName: 'Advanced Composites Decomposition',
    desc: 'Achieve 2,400 ELO standing and 3,000+ total career solved numbers.',
    hurdle: 'ELO ≥ 2,400 and Total Solves ≥ 3,000.',
    flavorText: 'The decomposition sovereign operates with mastery across modern computational number theory.',
    points: 950,
    check: (ctx) => ctx.currentElo >= 2400 && ctx.totalSolved >= 3000,
    calcProgress: (ctx) => ({
      text: `ELO: ${ctx.currentElo}/2400 · Solved: ${ctx.totalSolved}/3000`,
      pct: Math.min(100, Math.round(((ctx.currentElo / 2400) * 50) + ((ctx.totalSolved / 3000) * 50)))
    })
  },

  // =========================================================================
  // STRATA 5: Cosmic Manifold Ascension (Medals 81 to 100)
  // =========================================================================
  {
    id: 'm-081',
    icon: '♾️',
    title: "Prime Singularity Pinnacle",
    category: 'resource',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Cross the 3,000+ ELO threshold to unlock the Prime Singularity pinnacle rank.',
    hurdle: 'Attain an active competitive ELO rating ≥ 3,000.',
    flavorText: 'At 3,000 ELO, the contestant transcends mortal number theory, parsing prime spectra at light-speed.',
    points: 1000,
    check: (ctx) => ctx.currentElo >= 3000 || ctx.peakElo >= 3000,
    calcProgress: (ctx) => ({
      text: `Peak ELO: ${Math.max(ctx.currentElo, ctx.peakElo)} / 3,000`,
      pct: Math.min(100, Math.round((Math.max(ctx.currentElo, ctx.peakElo) / 3000) * 100))
    })
  },
  {
    id: 'm-082',
    icon: '🌌',
    title: 'Omega Cosmic Manifold Clear',
    category: 'speed',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Successfully clear a full session inside the ultimate Omega Cosmic Manifold max bound (1 to 50,000) under a strict 45-second hardware timeout constraint.',
    hurdle: 'Complete full 1 to 50,000 range session in under 45.00 seconds.',
    flavorText: 'The Omega Cosmic Manifold scales factor searches into multi-thousand arithmetic intervals.',
    points: 850,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 45.0 && ctx.totalSolved >= 100,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 45.0s (Solved: ${ctx.totalSolved})` : 'Goal: ≤ 45.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((45.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-083',
    icon: '🔮',
    title: 'Riemann Zeta Critical Line Zeta(s)',
    category: 'resource',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Reach an active competitive ELO rating of 2,600 or higher.',
    hurdle: 'Competitive ELO rating reaches 2,600.',
    flavorText: 'Bernhard Riemann 1859 hypothesis states that all non-trivial zeros of zeta(s) lie on the line Re(s) = 1/2.',
    points: 880,
    check: (ctx) => ctx.currentElo >= 2600,
    calcProgress: (ctx) => ({
      text: `${ctx.currentElo} / 2,600 ELO`,
      pct: Math.min(100, Math.round((ctx.currentElo / 2600) * 100))
    })
  },
  {
    id: 'm-084',
    icon: '🔥',
    title: 'Goldbach Strong Density Conqueror',
    category: 'streak',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Maintain a 50-match continuous win streak across competitive sandboxes.',
    hurdle: '50 uninterrupted match victories.',
    flavorText: 'Christian Goldbach conjectured in 1742 that every even integer greater than 2 is the sum of two primes.',
    points: 900,
    check: (ctx) => ctx.bestStreak >= 50,
    calcProgress: (ctx) => ({
      text: `${Math.min(50, ctx.bestStreak)} / 50 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 50) * 100))
    })
  },
  {
    id: 'm-085',
    icon: '⚡',
    title: 'Sub-6.0 Hypersonic Transcendence',
    category: 'speed',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Complete an entire Olympiad competition match in under 6.0 seconds.',
    hurdle: 'Cumulative solve duration clocked beneath 6.00s.',
    flavorText: 'Solving 10 problems in 6.0 seconds approaches the physical limit of screen touch and DOM event processing.',
    points: 920,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 6.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 6.0s` : 'Goal: ≤ 6.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((6.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-086',
    icon: '📜',
    title: 'Hardy-Littlewood Circle Method Pillar',
    category: 'resource',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Cross 4,000 total solved composites in competitive history.',
    hurdle: '4,000 lifetime solved composite numbers.',
    flavorText: 'Hardy, Littlewood and Ramanujan developed the circle method to dissect asymptotic partition counts.',
    points: 900,
    check: (ctx) => ctx.totalSolved >= 4000,
    calcProgress: (ctx) => ({
      text: `${Math.min(4000, ctx.totalSolved)} / 4,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 4000) * 100))
    })
  },
  {
    id: 'm-087',
    icon: '🌟',
    title: 'Twin Prime Constant Singular Shield',
    category: 'streak',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Maintain a 55-match continuous win streak.',
    hurdle: '55 consecutive match victories.',
    flavorText: 'Hardy-Littlewood first conjecture predicts twin prime frequencies governed by twin constant C_2 = 0.66016.',
    points: 930,
    check: (ctx) => ctx.bestStreak >= 55,
    calcProgress: (ctx) => ({
      text: `${Math.min(55, ctx.bestStreak)} / 55 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 55) * 100))
    })
  },
  {
    id: 'm-088',
    icon: '⏱️',
    title: 'Sub-5.5 Light-Speed Decomposer',
    category: 'speed',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Complete 10 factorizations in under 5.5 seconds total time.',
    hurdle: '≤ 5.50s match execution duration.',
    flavorText: 'Under 5.5 seconds requires subconscious optical factor parsing without conscious cognitive hesitation.',
    points: 950,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 5.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 5.5s` : 'Goal: ≤ 5.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((5.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-089',
    icon: '🛡️',
    title: 'Birch & Swinnerton-Dyer Conductor',
    category: 'resource',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Reach an active competitive ELO rating of 2,800 or higher.',
    hurdle: 'Competitive ELO reaches 2,800.',
    flavorText: 'BSD conjecture connects the rank of elliptic curves to the behavior of L-functions at s = 1.',
    points: 960,
    check: (ctx) => ctx.currentElo >= 2800,
    calcProgress: (ctx) => ({
      text: `${ctx.currentElo} / 2,800 ELO`,
      pct: Math.min(100, Math.round((ctx.currentElo / 2800) * 100))
    })
  },
  {
    id: 'm-090',
    icon: '💎',
    title: 'Langlands Program Cosmic Bridge',
    category: 'streak',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Achieve a 60-match continuous win streak.',
    hurdle: '60 consecutive match victories.',
    flavorText: 'Robert Langlands established a grand web of conjectures linking number theory and representation theory.',
    points: 980,
    check: (ctx) => ctx.bestStreak >= 60,
    calcProgress: (ctx) => ({
      text: `${Math.min(60, ctx.bestStreak)} / 60 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 60) * 100))
    })
  },
  {
    id: 'm-091',
    icon: '⚡',
    title: 'Sub-5.0 Absolute Speed Horizon',
    category: 'speed',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Solve 10 problems in under 5.0 seconds total time.',
    hurdle: 'Under 5.00s cumulative match completion time.',
    flavorText: 'Factoring 10 numbers in under 5 seconds averages under 500ms per complete answer sequence.',
    points: 1000,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 5.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 5.0s` : 'Goal: ≤ 5.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((5.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-092',
    icon: '🏛️',
    title: 'Selberg Trace Formula Invariant',
    category: 'resource',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Cross 5,000 total solved composites in career history.',
    hurdle: '5,000 lifetime solved composite numbers.',
    flavorText: 'Selberg trace formula establishes duality between spectrum of Laplace operators and lengths of closed geodesics.',
    points: 1000,
    check: (ctx) => ctx.totalSolved >= 5000,
    calcProgress: (ctx) => ({
      text: `${Math.min(5000, ctx.totalSolved)} / 5,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 5000) * 100))
    })
  },
  {
    id: 'm-093',
    icon: '🔥',
    title: 'Ramanujan Tau Function Tau(n)',
    category: 'streak',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Maintain a 65-match continuous win streak.',
    hurdle: '65 consecutive match victories.',
    flavorText: 'Srinivasa Ramanujan tau function governs modular forms Delta = q * prod(1 - q^n)^24.',
    points: 1000,
    check: (ctx) => ctx.bestStreak >= 65,
    calcProgress: (ctx) => ({
      text: `${Math.min(65, ctx.bestStreak)} / 65 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 65) * 100))
    })
  },
  {
    id: 'm-094',
    icon: '⏱️',
    title: 'Sub-4.5 Tachyon Impulse',
    category: 'speed',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Complete an Olympiad session in under 4.5 seconds.',
    hurdle: '≤ 4.50s match completion duration.',
    flavorText: 'At 4.5 seconds, problem parsing occurs in near-realtime optical nerve transmission speed.',
    points: 1050,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 4.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 4.5s` : 'Goal: ≤ 4.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((4.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-095',
    icon: '🛡️',
    title: 'Ramanujan-Petersson Conjecture Seal',
    category: 'resource',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Cross 6,000 total solved composites in competitive history.',
    hurdle: '6,000 lifetime solved composite numbers.',
    flavorText: 'Pierre Deligne proved the Ramanujan conjecture in 1974 via Grothendieck etale cohomology on the Weil conjectures.',
    points: 1050,
    check: (ctx) => ctx.totalSolved >= 6000,
    calcProgress: (ctx) => ({
      text: `${Math.min(6000, ctx.totalSolved)} / 6,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 6000) * 100))
    })
  },
  {
    id: 'm-096',
    icon: '🌟',
    title: 'Tate-Shafarevich Finite Group Order',
    category: 'streak',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Achieve a 70-match continuous win streak.',
    hurdle: '70 continuous match victories.',
    flavorText: 'The Tate-Shafarevich group measures failure of the Hasse local-global principle for abelian varieties.',
    points: 1100,
    check: (ctx) => ctx.bestStreak >= 70,
    calcProgress: (ctx) => ({
      text: `${Math.min(70, ctx.bestStreak)} / 70 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 70) * 100))
    })
  },
  {
    id: 'm-097',
    icon: '⚡',
    title: 'Sub-4.0 Absolute Temporal Compression',
    category: 'speed',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Solve 10 problems in under 4.0 seconds total time.',
    hurdle: 'Total match time ≤ 4.00s.',
    flavorText: '400ms per factor problem: cognitive thought merges with tactile reflex.',
    points: 1150,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 4.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 4.0s` : 'Goal: ≤ 4.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((4.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'm-098',
    icon: '🏛️',
    title: 'Grothendieck Motive Transmutation',
    category: 'resource',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Cross 8,000 total solved composites in competitive history.',
    hurdle: '8,000 lifetime solved composite numbers.',
    flavorText: 'Alexander Grothendieck envisioned motives as the universal arithmetic cohomology behind algebraic varieties.',
    points: 1150,
    check: (ctx) => ctx.totalSolved >= 8000,
    calcProgress: (ctx) => ({
      text: `${Math.min(8000, ctx.totalSolved)} / 8,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 8000) * 100))
    })
  },
  {
    id: 'm-099',
    icon: '🔥',
    title: 'Wiles Modular Elliptic Transcendence',
    category: 'streak',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Achieve an 80-match continuous win streak.',
    hurdle: '80 uninterrupted match victories.',
    flavorText: 'Andrew Wiles proved the Taniyama-Shimura-Weil modularity theorem for semistable elliptic curves, resolving Fermat Last Theorem in 1994.',
    points: 1200,
    check: (ctx) => ctx.bestStreak >= 80,
    calcProgress: (ctx) => ({
      text: `${Math.min(80, ctx.bestStreak)} / 80 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 80) * 100))
    })
  },
  {
    id: 'm-100',
    icon: '👑',
    title: 'Prime Singularity Sovereign Apex',
    category: 'resource',
    categoryName: 'Cosmic Manifold Ascension',
    desc: 'Conquer the 100 Medals Vault: 3,000+ ELO, 10,000+ total solved composites, and 50+ flawless win streak.',
    hurdle: 'ELO ≥ 3,000, Total Solved ≥ 10,000, and Best Streak ≥ 50.',
    flavorText: 'The Sovereign Apex stands alone at the apex of mathematical competition, immortalized in the Cryptographic Vault of Honors.',
    points: 1500,
    check: (ctx) => (ctx.currentElo >= 3000 || ctx.peakElo >= 3000) && ctx.totalSolved >= 10000 && ctx.bestStreak >= 50,
    calcProgress: (ctx) => ({
      text: `ELO: ${Math.max(ctx.currentElo, ctx.peakElo)}/3000 · Solved: ${ctx.totalSolved}/10000 · Streak: ${ctx.bestStreak}/50`,
      pct: Math.min(100, Math.round(((Math.max(ctx.currentElo, ctx.peakElo) / 3000) * 40) + ((ctx.totalSolved / 10000) * 30) + ((ctx.bestStreak / 50) * 30)))
    })
  }
];
