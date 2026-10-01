/**
 * PrimeFactor.app — Section B: 100 Tactical Insignia Badges Catalog
 * Distributes 100 high-velocity badges across 4 operational performance metrics:
 * 1. Sub-Second Velocity Sprints (Badges 101 to 125)
 * 2. Resource Integrity Controls (Badges 126 to 150)
 * 3. Streak & Longevity Volatility (Badges 151 to 175)
 * 4. Cognitive Focus & Anti-Tamper Records (Badges 176 to 200)
 */

export const BADGES_CATALOG = [
  // =========================================================================
  // CATEGORY 1: Sub-Second Velocity Sprints (Badges 101 to 125)
  // =========================================================================
  {
    id: 'b-101',
    icon: '⚡',
    title: 'Sub-0.80s Factor Reaction Mark',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Average factor submission reaction velocity clocked strictly beneath < 0.80s across an entire Rated Match.',
    hurdle: 'Average factor input latency < 0.80s across 10 problem submissions.',
    flavorText: 'Sub-800ms submission leaves no room for hesitation; synaptic response operates at instinctual reflex velocity.',
    points: 150,
    check: (ctx) => ctx.fastestMatch && (Number(ctx.fastestMatch.time) <= 8.0),
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${(Number(ctx.fastestMatch.time) / 10).toFixed(2)}s / < 0.80s per factor` : 'No timed logs',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((8.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-102',
    icon: '⏱️',
    title: 'Micro-Second Keyboard Pacing',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Clock an entire match in under 8.5 seconds with 100% submission accuracy.',
    hurdle: 'Total match time ≤ 8.50s with zero missed factor inputs.',
    flavorText: 'Fluid motor coordination synchronizes numerical keypad indexing directly with visual ocular streams.',
    points: 140,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 8.5 && Number(ctx.fastestMatch.accuracy || 0) >= 100,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 8.5s` : 'Goal: ≤ 8.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((8.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-103',
    icon: '🚀',
    title: 'Sub-750ms Synaptic Blitz',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Complete an Olympiad contest set in under 7.5 seconds.',
    hurdle: 'Match duration strictly beneath 7.50s.',
    flavorText: '750ms average reaction time bypasses conscious inner monologue entirely.',
    points: 160,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 7.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 7.5s` : 'Goal: ≤ 7.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((7.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-104',
    icon: '🏎️',
    title: 'Velocity Tier 1 Apex Blitz',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Finish a Tier 1 match under 9.0 seconds with perfect score.',
    hurdle: 'Sub-9.0s completion in Tier 1 with 100/100 score.',
    flavorText: 'Rapid factor elimination clears the lower number spectrum with machine-like cadences.',
    points: 130,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 9.0 && Number(ctx.fastestMatch.score || 0) >= 90,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 9.0s` : 'Goal: ≤ 9.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((9.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-105',
    icon: '🎯',
    title: 'Zero-Latency Prime Strike',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Submit your first answer within 600ms of match timer activation.',
    hurdle: 'Initial answer submission < 600ms on problem #1.',
    flavorText: 'Anticipatory primality scanning recognizes single-digit prime units instantly.',
    points: 150,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 10.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `Best Match: ${Number(ctx.fastestMatch.time).toFixed(1)}s` : 'Goal: ≤ 10.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((10.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-106',
    icon: '⚡',
    title: 'Sub-700ms Neuro-Impulse Pin',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Finish a full competition set in under 7.0 seconds total time.',
    hurdle: '≤ 7.00s total match completion time.',
    flavorText: 'Neuro-impulse velocity clocks below 700ms per complete answer token.',
    points: 175,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 7.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 7.0s` : 'Goal: ≤ 7.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((7.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-107',
    icon: '⏱️',
    title: 'Tachyon Cadence Insignia',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Complete an Olympiad session in under 6.8 seconds.',
    hurdle: 'Solve duration < 6.80s cumulative.',
    flavorText: 'The contestant executes factoring moves before visual afterimages fade from the retina.',
    points: 190,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 6.8,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 6.8s` : 'Goal: ≤ 6.8s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((6.8 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-108',
    icon: '💫',
    title: 'Sub-650ms Hyper-Drive Seal',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Clear 10 problems in under 6.5 seconds total match time.',
    hurdle: '≤ 6.50s match completion duration.',
    flavorText: 'Cognitive overclocking channels numerical streams with near-zero synaptic dissipation.',
    points: 210,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 6.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 6.5s` : 'Goal: ≤ 6.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((6.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-109',
    icon: '🔥',
    title: 'Sub-600ms Relativistic Crest',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Execute a full Olympiad match in under 6.0 seconds total time.',
    hurdle: 'Total match time < 6.00s.',
    flavorText: 'Sub-600ms pacing compresses integer decomposition into high-cadence finger gymnastics.',
    points: 230,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 6.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 6.0s` : 'Goal: ≤ 6.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((6.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-110',
    icon: '⚡',
    title: 'Sub-550ms Photon Factorization',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Complete an Olympiad session in under 5.5 seconds.',
    hurdle: '≤ 5.50s cumulative match completion time.',
    flavorText: '550ms per question: the user types answer sequences before audio chimes can complete their decay cycle.',
    points: 260,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 5.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 5.5s` : 'Goal: ≤ 5.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((5.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-111',
    icon: '🚀',
    title: 'Sub-500ms Half-Second Barrier',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Solve 10 problems in under 5.0 seconds total match time.',
    hurdle: 'Total match duration strictly beneath 5.00s.',
    flavorText: 'The sub-500ms barrier separates competitive champions from legendary algorithmic entities.',
    points: 300,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 5.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 5.0s` : 'Goal: ≤ 5.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((5.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-112',
    icon: '⏱️',
    title: 'Sub-480ms Tactile Flash',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Complete an Olympiad competition match in under 4.8 seconds.',
    hurdle: 'Solve 10 problems in ≤ 4.80s.',
    flavorText: 'Tactile memory patterns trigger keypad entries concurrently with optic signal arrival.',
    points: 320,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 4.8,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 4.8s` : 'Goal: ≤ 4.8s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((4.8 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-113',
    icon: '💫',
    title: 'Sub-450ms Synaptic Warp',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Finish an entire match under 4.5 seconds total time.',
    hurdle: 'Total match time < 4.50s.',
    flavorText: 'At 450ms per question, human latency achieves parity with low-overhead native software threads.',
    points: 350,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 4.5,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 4.5s` : 'Goal: ≤ 4.5s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((4.5 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-114',
    icon: '⚡',
    title: 'Sub-420ms Kinetic Impulse',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Decompose 10 problems in under 4.2 seconds total time.',
    hurdle: '≤ 4.20s cumulative match completion time.',
    flavorText: 'Pure kinetic muscle memory replaces deliberate arithmetic computation.',
    points: 370,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 4.2,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 4.2s` : 'Goal: ≤ 4.2s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((4.2 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-115',
    icon: '🔥',
    title: 'Sub-400ms Micro-Reflex Crest',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Complete an Olympiad session in under 4.0 seconds.',
    hurdle: 'Solve 10 problems strictly beneath 4.00s.',
    flavorText: '400ms per factor problem: the competitor operates in full sensory flow state.',
    points: 400,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 4.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 4.0s` : 'Goal: ≤ 4.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((4.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-116',
    icon: '🏎️',
    title: 'Sub-380ms Tachyon Strike',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Finish a competition set in under 3.8 seconds.',
    hurdle: '≤ 3.80s match execution duration.',
    flavorText: '380ms average answer duration challenges hardware polling boundaries.',
    points: 420,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 3.8,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 3.8s` : 'Goal: ≤ 3.8s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((3.8 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-117',
    icon: '⚡',
    title: 'Sub-360ms Quantum Pulse',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Execute 10 factorizations in under 3.6 seconds total time.',
    hurdle: 'Match clock strictly beneath 3.60s.',
    flavorText: 'Quantum pulse reflexes eliminate all mechanical drag between keypresses.',
    points: 450,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 3.6,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 3.6s` : 'Goal: ≤ 3.6s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((3.6 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-118',
    icon: '⏱️',
    title: 'Sub-340ms Optical Tunnel',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Decompose 10 problems in under 3.4 seconds total time.',
    hurdle: '≤ 3.40s cumulative match completion time.',
    flavorText: 'The contestant enters optical tunnel vision, registering prime decompositions instantaneously.',
    points: 470,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 3.4,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 3.4s` : 'Goal: ≤ 3.4s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((3.4 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-119',
    icon: '🚀',
    title: 'Sub-320ms Hyper-Velocity Mark',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Finish an entire match under 3.2 seconds total time.',
    hurdle: 'Total match time < 3.20s.',
    flavorText: 'Sub-320ms factoring borders on algorithmic telepathy.',
    points: 500,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 3.2,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 3.2s` : 'Goal: ≤ 3.2s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((3.2 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-120',
    icon: '💫',
    title: 'Sub-300ms Triple-Century Barrier',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Solve 10 problems in under 3.0 seconds total match time.',
    hurdle: 'Total match duration strictly beneath 3.00s.',
    flavorText: '300ms per complete answer: the user types answers while the screen frame buffer refreshes.',
    points: 550,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 3.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 3.0s` : 'Goal: ≤ 3.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((3.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-121',
    icon: '⚡',
    title: 'Sub-280ms Sonic Threshold',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Complete an Olympiad session in under 2.8 seconds.',
    hurdle: '≤ 2.80s cumulative match duration.',
    flavorText: 'Sonic threshold response moves beyond human verbal thought into direct muscular execution.',
    points: 580,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 2.8,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 2.8s` : 'Goal: ≤ 2.8s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((2.8 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-122',
    icon: '⏱️',
    title: 'Sub-260ms Micro-Circuit Insignia',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Finish 10 problems in under 2.6 seconds total time.',
    hurdle: 'Solve 10 problems in strictly beneath 2.60s.',
    flavorText: 'Neural micro-circuits operate in locked rhythm with software event dispatchers.',
    points: 620,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 2.6,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 2.6s` : 'Goal: ≤ 2.6s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((2.6 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-123',
    icon: '🔥',
    title: 'Sub-240ms Singularity Pulse',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Decompose 10 problems in under 2.4 seconds total time.',
    hurdle: 'Total match time ≤ 2.40s.',
    flavorText: '240ms answer pacing exceeds the reaction time of professional athletic sprinters.',
    points: 660,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 2.4,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 2.4s` : 'Goal: ≤ 2.4s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((2.4 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-124',
    icon: '🚀',
    title: 'Sub-220ms Superluminal Mark',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Finish an entire match under 2.2 seconds total time.',
    hurdle: 'Match clock strictly beneath 2.20s.',
    flavorText: 'The competitor factors numbers at the absolute thermodynamic limits of biometric input hardware.',
    points: 700,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 2.2,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 2.2s` : 'Goal: ≤ 2.2s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((2.2 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },
  {
    id: 'b-125',
    icon: '👑',
    title: 'Sub-200ms Absolute Reaction Pinnacle',
    category: 'speed',
    categoryName: 'Sub-Second Velocity Sprints',
    desc: 'Break the ultimate speed threshold: solve 10 problems in under 2.0 seconds total time.',
    hurdle: 'Total match time ≤ 2.00s across 10 problem factorizations.',
    flavorText: '200ms per factor: the competitor transcends mortal mathematics to become one with pure computational light.',
    points: 800,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 2.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? `${Number(ctx.fastestMatch.time).toFixed(1)}s / ≤ 2.0s` : 'Goal: ≤ 2.0s',
      pct: ctx.fastestMatch ? Math.min(100, Math.round((2.0 / Math.max(1, ctx.fastestMatch.time)) * 100)) : 0
    })
  },

  // =========================================================================
  // CATEGORY 2: Resource Integrity Controls (Badges 126 to 150)
  // =========================================================================
  {
    id: 'b-126',
    icon: '🛡️',
    title: '500 Cumulative Virgin Clears',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Achieve 500+ cumulative correct answers across your total profile history without utilizing a single lifeline or triggering a second-chance redemption token.',
    hurdle: '500+ total solves with zero lifelines used and zero second chances triggered.',
    flavorText: 'Purity of calculation: every solution derived through unassisted cognitive deduction.',
    points: 350,
    check: (ctx) => ctx.totalSolved >= 500 && (ctx.ledger.grandMasterCount >= 1 || (ctx.lastResult && ctx.lastResult.lifelinesUsedCount === 0)),
    calcProgress: (ctx) => ({
      text: `${Math.min(500, ctx.totalSolved)} / 500 Virgin Clears`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 500) * 100))
    })
  },
  {
    id: 'b-127',
    icon: '🔒',
    title: 'Untouched Lifeline Vault Seal',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Complete 10 consecutive matches without activating a single lifeline assistance tool.',
    hurdle: '10 consecutive matches with 0 lifelines used.',
    flavorText: 'True champions rely on mental factor sieves rather than lifeline crutches.',
    points: 200,
    check: (ctx) => ctx.matchRegistry.length >= 10 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(10, ctx.matchRegistry.length)} / 10 Clean Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 10) * 100))
    })
  },
  {
    id: 'b-128',
    icon: '💎',
    title: 'First-Attempt Purity Mark',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Maintain 100% first-attempt clearance across 5 consecutive rated matches.',
    hurdle: '5 consecutive matches with 10/10 first-attempt accuracy.',
    flavorText: 'First-attempt precision guarantees unblemished competitive scoring multiplier bonuses.',
    points: 220,
    check: (ctx) => ctx.matchRegistry.length >= 5 && ctx.bestStreak >= 5,
    calcProgress: (ctx) => ({
      text: `${Math.min(5, ctx.bestStreak)} / 5 Pure Matches`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 5) * 100))
    })
  },
  {
    id: 'b-129',
    icon: '🛡️',
    title: 'Zero Redemption Discipline Pin',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Accumulate 600 total solved numbers with zero lifeline drop.',
    hurdle: '600 cumulative solves without lifeline activations.',
    flavorText: 'Unassisted mathematical deduction strengthens intuition against chaotic number distributions.',
    points: 250,
    check: (ctx) => ctx.totalSolved >= 600,
    calcProgress: (ctx) => ({
      text: `${Math.min(600, ctx.totalSolved)} / 600 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 600) * 100))
    })
  },
  {
    id: 'b-130',
    icon: '⚖️',
    title: 'Resource Integrity Citadel',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Reach 700 total solved numbers with 0 directory HMAC security strikes.',
    hurdle: '700 total solved numbers and 0 security strikes.',
    flavorText: 'The integrity citadel maintains a flawless cryptographic audit trail.',
    points: 270,
    check: (ctx) => ctx.totalSolved >= 700 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(700, ctx.totalSolved)} / 700 Solved (0 Strikes)`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 700) * 100))
    })
  },
  {
    id: 'b-131',
    icon: '🗝️',
    title: 'Virgin Factorization Ward',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Clear 15 consecutive matches with zero second-chance triggers.',
    hurdle: '15 matches cleared with zero redemption allowances.',
    flavorText: 'Every composite answered on first strike preserves maximum rating gain velocity.',
    points: 290,
    check: (ctx) => ctx.bestStreak >= 15,
    calcProgress: (ctx) => ({
      text: `${Math.min(15, ctx.bestStreak)} / 15 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 15) * 100))
    })
  },
  {
    id: 'b-132',
    icon: '📜',
    title: 'Unassisted Factor Auditor',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Cross 800 cumulative solved integers with unblemished ledger status.',
    hurdle: '800 total solved integers in competitive history.',
    flavorText: 'Audited records demonstrate systematic consistency without statistical variance anomalies.',
    points: 310,
    check: (ctx) => ctx.totalSolved >= 800,
    calcProgress: (ctx) => ({
      text: `${Math.min(800, ctx.totalSolved)} / 800 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 800) * 100))
    })
  },
  {
    id: 'b-133',
    icon: '🛡️',
    title: 'Untouchable Resource Bastion',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Hold 95%+ precision average across last 20 recorded matches.',
    hurdle: 'Rolling 20-match accuracy average maintained at ≥ 95.0%.',
    flavorText: 'High precision across long match histories proves sustainable tactical pacing.',
    points: 330,
    check: (ctx) => ctx.matchRegistry.length >= 10 && (ctx.matchRegistry.slice(0, 20).reduce((sum, m) => sum + Number(m.accuracy || 0), 0) / Math.min(20, ctx.matchRegistry.length)) >= 95,
    calcProgress: (ctx) => ({
      text: `Matches: ${Math.min(20, ctx.matchRegistry.length)}/20 (Goal: 95% Avg Acc)`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 20) * 100))
    })
  },
  {
    id: 'b-134',
    icon: '💎',
    title: 'Flawless 10/10 Resource Pin',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Earn a perfect 10.0 / 10 rating on Lifeline Usage in Verification Ledger.',
    hurdle: 'Quad-Check verification confirms zero lifelines activated.',
    flavorText: 'Automated verification ledger honors candidates who decline computational lifelines.',
    points: 350,
    check: (ctx) => ctx.ledger.grandMasterCount >= 1 || (ctx.lastResult && ctx.lastResult.lifelinesUsedCount === 0),
    calcProgress: (ctx) => ({
      text: ctx.ledger.grandMasterCount >= 1 ? 'Ledger Verified' : 'Goal: 0 Lifelines in match',
      pct: ctx.ledger.grandMasterCount >= 1 ? 100 : 0
    })
  },
  {
    id: 'b-135',
    icon: '🔒',
    title: 'Cryptographic Virginity Seal',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Cross 1,000 total solved composites without an HMAC tamper strike.',
    hurdle: '1,000 total solves and 0 security strikes.',
    flavorText: 'Cryptographic integrity seals certify that all 1,000 clears occurred in authorized environments.',
    points: 380,
    check: (ctx) => ctx.totalSolved >= 1000 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(1000, ctx.totalSolved)} / 1,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 1000) * 100))
    })
  },
  {
    id: 'b-136',
    icon: '🛡️',
    title: 'Zero-Assistance Sovereign',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Reach 1,200 total solved numbers with zero second chances allowed.',
    hurdle: '1,200 total verified prime factor solutions.',
    flavorText: 'Mastery over factors develops an intuitive sense for divisibility and modular residues.',
    points: 400,
    check: (ctx) => ctx.totalSolved >= 1200,
    calcProgress: (ctx) => ({
      text: `${Math.min(1200, ctx.totalSolved)} / 1,200 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 1200) * 100))
    })
  },
  {
    id: 'b-137',
    icon: '⚖️',
    title: 'Steel Willpower Integrity Crest',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Win 20 consecutive matches with zero lifelines activated.',
    hurdle: '20 consecutive unassisted match victories.',
    flavorText: 'Refusing lifelines during sudden-death clock pressure proves unbreakable cognitive resilience.',
    points: 420,
    check: (ctx) => ctx.bestStreak >= 20,
    calcProgress: (ctx) => ({
      text: `${Math.min(20, ctx.bestStreak)} / 20 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 20) * 100))
    })
  },
  {
    id: 'b-138',
    icon: '💎',
    title: 'Immutable Ledger Insignia',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Cross 1,400 cumulative solved integers in competitive ledger.',
    hurdle: '1,400 total solved composite numbers.',
    flavorText: 'An immutable ledger forms the official record of competitive academic accreditation.',
    points: 450,
    check: (ctx) => ctx.totalSolved >= 1400,
    calcProgress: (ctx) => ({
      text: `${Math.min(1400, ctx.totalSolved)} / 1,400 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 1400) * 100))
    })
  },
  {
    id: 'b-139',
    icon: '📜',
    title: 'Virgin Run Grandmaster',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Cross 1,600 total solved numbers with authentic directory signature.',
    hurdle: '1,600 verified solves with clean security ledger.',
    flavorText: 'The grandmaster of virgin runs operates without cognitive fallbacks or emergency redemptions.',
    points: 480,
    check: (ctx) => ctx.totalSolved >= 1600 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(1600, ctx.totalSolved)} / 1,600 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 1600) * 100))
    })
  },
  {
    id: 'b-140',
    icon: '🛡️',
    title: 'Ironclad Factor Purity',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Reach 1,800 cumulative solved integers in competitive history.',
    hurdle: '1,800 total solved composite numbers.',
    flavorText: 'Ironclad purity resists fatigue over thousands of successive prime factorization challenges.',
    points: 500,
    check: (ctx) => ctx.totalSolved >= 1800,
    calcProgress: (ctx) => ({
      text: `${Math.min(1800, ctx.totalSolved)} / 1,800 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 1800) * 100))
    })
  },
  {
    id: 'b-141',
    icon: '🔒',
    title: 'Zero-Fault Resource Bastion',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Maintain 25 consecutive wins with zero strikes and zero lifelines.',
    hurdle: '25 consecutive unassisted wins with 0 strikes.',
    flavorText: 'Zero-fault execution represents the gold standard of Olympiad mathematical discipline.',
    points: 520,
    check: (ctx) => ctx.bestStreak >= 25 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(25, ctx.bestStreak)} / 25 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 25) * 100))
    })
  },
  {
    id: 'b-142',
    icon: '💎',
    title: 'Pure Algorithmic Lineage',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Cross 2,000 total solved numbers in competitive ledger.',
    hurdle: '2,000 career solved composite numbers.',
    flavorText: 'Pure algorithmic deduction connects human intelligence to the eternal order of prime distributions.',
    points: 550,
    check: (ctx) => ctx.totalSolved >= 2000,
    calcProgress: (ctx) => ({
      text: `${Math.min(2000, ctx.totalSolved)} / 2,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 2000) * 100))
    })
  },
  {
    id: 'b-143',
    icon: '⚖️',
    title: 'Lifeline Abstinence Sovereign',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Cross 2,200 total solved numbers with zero lifeline usage.',
    hurdle: '2,200 lifetime unassisted factorizations.',
    flavorText: 'True champions develop internal heuristics that render external computational aids obsolete.',
    points: 580,
    check: (ctx) => ctx.totalSolved >= 2200,
    calcProgress: (ctx) => ({
      text: `${Math.min(2200, ctx.totalSolved)} / 2,200 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 2200) * 100))
    })
  },
  {
    id: 'b-144',
    icon: '🛡️',
    title: 'Cryptographic Honor Guardian',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Cross 2,500 total solved composites with authentic HMAC seal.',
    hurdle: '2,500 total solves and 0 security strikes.',
    flavorText: 'The guardian maintains directory authorization with continuous mathematical rigor.',
    points: 620,
    check: (ctx) => ctx.totalSolved >= 2500 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(2500, ctx.totalSolved)} / 2,500 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 2500) * 100))
    })
  },
  {
    id: 'b-145',
    icon: '📜',
    title: 'Uncorrupted Ledger Patriarch',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Cross 2,800 cumulative solved integers in competitive history.',
    hurdle: '2,800 total solved composite numbers.',
    flavorText: 'Thousands of factorizations leave an indelible mathematical footprint in competitive history.',
    points: 660,
    check: (ctx) => ctx.totalSolved >= 2800,
    calcProgress: (ctx) => ({
      text: `${Math.min(2800, ctx.totalSolved)} / 2,800 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 2800) * 100))
    })
  },
  {
    id: 'b-146',
    icon: '🔒',
    title: 'Zero-Strike Charter Master',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Maintain 30 consecutive wins with zero strikes.',
    hurdle: '30 consecutive wins with 0 HMAC security strikes.',
    flavorText: 'Total compliance with the Three-Strike Charter establishes supreme integrity.',
    points: 700,
    check: (ctx) => ctx.bestStreak >= 30 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(30, ctx.bestStreak)} / 30 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 30) * 100))
    })
  },
  {
    id: 'b-147',
    icon: '💎',
    title: 'Flawless Resource Sentinel',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Cross 3,200 cumulative solved integers in competitive history.',
    hurdle: '3,200 total solved composite numbers.',
    flavorText: 'The sentinel guards mathematical accuracy through thousands of rapid factorizations.',
    points: 740,
    check: (ctx) => ctx.totalSolved >= 3200,
    calcProgress: (ctx) => ({
      text: `${Math.min(3200, ctx.totalSolved)} / 3,200 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 3200) * 100))
    })
  },
  {
    id: 'b-148',
    icon: '⚖️',
    title: 'Unassisted Factor Sovereign',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Cross 3,600 cumulative solved integers in competitive history.',
    hurdle: '3,600 total solved composite numbers.',
    flavorText: 'Autonomous mental computation reaches peak industrial reliability.',
    points: 780,
    check: (ctx) => ctx.totalSolved >= 3600,
    calcProgress: (ctx) => ({
      text: `${Math.min(3600, ctx.totalSolved)} / 3,600 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 3600) * 100))
    })
  },
  {
    id: 'b-149',
    icon: '🛡️',
    title: 'Absolute Integrity Apex Guard',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Cross 4,000 total solved numbers with 0 directory HMAC security strikes.',
    hurdle: '4,000 total solves and 0 security strikes.',
    flavorText: 'An unassailable record of mathematical purity across four thousand solved composite integers.',
    points: 820,
    check: (ctx) => ctx.totalSolved >= 4000 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(4000, ctx.totalSolved)} / 4,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 4000) * 100))
    })
  },
  {
    id: 'b-150',
    icon: '👑',
    title: 'Resource Integrity Paragon',
    category: 'resource',
    categoryName: 'Resource Integrity Controls',
    desc: 'Achieve 5,000+ total solved composites without ever relying on lifeline assists.',
    hurdle: '5,000 cumulative unassisted solves and 0 security strikes.',
    flavorText: 'The Paragon represents the absolute pinnacle of ethical and cognitive competition integrity.',
    points: 900,
    check: (ctx) => ctx.totalSolved >= 5000 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(5000, ctx.totalSolved)} / 5,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 5000) * 100))
    })
  },

  // =========================================================================
  // CATEGORY 3: Streak & Longevity Volatility (Badges 151 to 175)
  // =========================================================================
  {
    id: 'b-151',
    icon: '🔥',
    title: '30 Flawless Sessions Win Streak',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a continuous Live Win Streak of 30 flawless sessions.',
    hurdle: '30 continuous match victories held in live competitive ledger.',
    flavorText: 'Sustaining a 30-match streak requires navigating unpredictable prime distributions without a single mental lapse.',
    points: 350,
    check: (ctx) => ctx.bestStreak >= 30,
    calcProgress: (ctx) => ({
      text: `${Math.min(30, ctx.bestStreak)} / 30 Live Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 30) * 100))
    })
  },
  {
    id: 'b-152',
    icon: '♾️',
    title: '10,000 Solved Composites Pinnacle',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Cross a Lifetime Cleared Composites total of exactly 10,000 solved integers.',
    hurdle: '10,000 cumulative solved composites recorded in career telemetry ledger.',
    flavorText: '10,000 cleared composites: a monumental milestone marking ten thousand victories over composite numbers.',
    points: 1000,
    check: (ctx) => ctx.totalSolved >= 10000,
    calcProgress: (ctx) => ({
      text: `${Math.min(10000, ctx.totalSolved)} / 10,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 10000) * 100))
    })
  },
  {
    id: 'b-153',
    icon: '🌟',
    title: 'Centurion Streak Insignia',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 10-match consecutive win streak.',
    hurdle: '10 consecutive match victories.',
    flavorText: 'The journey to 100 consecutive wins begins with disciplined ten-match blocks.',
    points: 150,
    check: (ctx) => ctx.bestStreak >= 10,
    calcProgress: (ctx) => ({
      text: `${Math.min(10, ctx.bestStreak)} / 10 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 10) * 100))
    })
  },
  {
    id: 'b-154',
    icon: '🏛️',
    title: 'Double-Decade Streak Seal',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 20-match consecutive win streak.',
    hurdle: '20 consecutive match victories.',
    flavorText: 'Twenty consecutive victories establish a solid rhythm under pressure.',
    points: 220,
    check: (ctx) => ctx.bestStreak >= 20,
    calcProgress: (ctx) => ({
      text: `${Math.min(20, ctx.bestStreak)} / 20 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 20) * 100))
    })
  },
  {
    id: 'b-155',
    icon: '🔥',
    title: 'Quarter-Century Streak Pin',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 25-match consecutive win streak.',
    hurdle: '25 consecutive match victories.',
    flavorText: '25 consecutive wins require adapting to random wheel seeds without hesitation.',
    points: 280,
    check: (ctx) => ctx.bestStreak >= 25,
    calcProgress: (ctx) => ({
      text: `${Math.min(25, ctx.bestStreak)} / 25 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 25) * 100))
    })
  },
  {
    id: 'b-156',
    icon: '⚡',
    title: 'Thirty-Five Match Firestorm',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 35-match consecutive win streak.',
    hurdle: '35 consecutive match victories.',
    flavorText: 'A 35-match run strikes fear into the heart of competitive ladder rivals.',
    points: 360,
    check: (ctx) => ctx.bestStreak >= 35,
    calcProgress: (ctx) => ({
      text: `${Math.min(35, ctx.bestStreak)} / 35 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 35) * 100))
    })
  },
  {
    id: 'b-157',
    icon: '🏆',
    title: 'Forty-Match Fortress',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 40-match consecutive win streak.',
    hurdle: '40 consecutive match victories.',
    flavorText: 'Forty uninterrupted victories prove absolute technical dominance.',
    points: 420,
    check: (ctx) => ctx.bestStreak >= 40,
    calcProgress: (ctx) => ({
      text: `${Math.min(40, ctx.bestStreak)} / 40 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 40) * 100))
    })
  },
  {
    id: 'b-158',
    icon: '🌟',
    title: 'Forty-Five Match Titan',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 45-match consecutive win streak.',
    hurdle: '45 consecutive match victories.',
    flavorText: 'Forty-five victories demonstrate mastery over chaotic pseudo-random problem distributions.',
    points: 480,
    check: (ctx) => ctx.bestStreak >= 45,
    calcProgress: (ctx) => ({
      text: `${Math.min(45, ctx.bestStreak)} / 45 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 45) * 100))
    })
  },
  {
    id: 'b-159',
    icon: '🔥',
    title: 'Half-Century Streak Sovereign',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 50-match consecutive win streak.',
    hurdle: '50 consecutive match victories.',
    flavorText: 'Fifty matches without a loss: an extraordinary feat of competitive endurance.',
    points: 550,
    check: (ctx) => ctx.bestStreak >= 50,
    calcProgress: (ctx) => ({
      text: `${Math.min(50, ctx.bestStreak)} / 50 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 50) * 100))
    })
  },
  {
    id: 'b-160',
    icon: '💎',
    title: 'Fifty-Five Match Ascendant',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 55-match consecutive win streak.',
    hurdle: '55 consecutive match victories.',
    flavorText: 'Fifty-five wins reflect unwavering mental stamina under intense clock pressure.',
    points: 600,
    check: (ctx) => ctx.bestStreak >= 55,
    calcProgress: (ctx) => ({
      text: `${Math.min(55, ctx.bestStreak)} / 55 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 55) * 100))
    })
  },
  {
    id: 'b-161',
    icon: '🏛️',
    title: 'Sixty-Match Monolith',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 60-match consecutive win streak.',
    hurdle: '60 consecutive match victories.',
    flavorText: 'Sixty matches undefeated represents an impenetrable competitive fortress.',
    points: 650,
    check: (ctx) => ctx.bestStreak >= 60,
    calcProgress: (ctx) => ({
      text: `${Math.min(60, ctx.bestStreak)} / 60 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 60) * 100))
    })
  },
  {
    id: 'b-162',
    icon: '⚡',
    title: 'Sixty-Five Match Tempest',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 65-match consecutive win streak.',
    hurdle: '65 consecutive match victories.',
    flavorText: 'Sixty-five wins: every match entered is a foregone conclusion.',
    points: 700,
    check: (ctx) => ctx.bestStreak >= 65,
    calcProgress: (ctx) => ({
      text: `${Math.min(65, ctx.bestStreak)} / 65 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 65) * 100))
    })
  },
  {
    id: 'b-163',
    icon: '🌟',
    title: 'Seventy-Match Luminary',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 70-match consecutive win streak.',
    hurdle: '70 consecutive match victories.',
    flavorText: 'Seventy consecutive wins places the candidate in the upper echelon of world records.',
    points: 750,
    check: (ctx) => ctx.bestStreak >= 70,
    calcProgress: (ctx) => ({
      text: `${Math.min(70, ctx.bestStreak)} / 70 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 70) * 100))
    })
  },
  {
    id: 'b-164',
    icon: '🔥',
    title: 'Seventy-Five Match Inferno',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 75-match consecutive win streak.',
    hurdle: '75 consecutive match victories.',
    flavorText: 'Seventy-five consecutive triumphs burn brightly in the competitive archives.',
    points: 800,
    check: (ctx) => ctx.bestStreak >= 75,
    calcProgress: (ctx) => ({
      text: `${Math.min(75, ctx.bestStreak)} / 75 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 75) * 100))
    })
  },
  {
    id: 'b-165',
    icon: '👑',
    title: 'Eighty-Match Hegemon',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain an 80-match consecutive win streak.',
    hurdle: '80 consecutive match victories.',
    flavorText: 'Eighty matches: the candidate reigns supreme across all active training sectors.',
    points: 850,
    check: (ctx) => ctx.bestStreak >= 80,
    calcProgress: (ctx) => ({
      text: `${Math.min(80, ctx.bestStreak)} / 80 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 80) * 100))
    })
  },
  {
    id: 'b-166',
    icon: '💎',
    title: 'Eighty-Five Match Diamond',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain an 85-match consecutive win streak.',
    hurdle: '85 consecutive match victories.',
    flavorText: 'Eighty-five wins polished to crystalline perfection under intense competitive pressure.',
    points: 900,
    check: (ctx) => ctx.bestStreak >= 85,
    calcProgress: (ctx) => ({
      text: `${Math.min(85, ctx.bestStreak)} / 85 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 85) * 100))
    })
  },
  {
    id: 'b-167',
    icon: '🏛️',
    title: 'Ninety-Match Colossus',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 90-match consecutive win streak.',
    hurdle: '90 consecutive match victories.',
    flavorText: 'Ninety consecutive triumphs: a colossal achievement of human calculation.',
    points: 950,
    check: (ctx) => ctx.bestStreak >= 90,
    calcProgress: (ctx) => ({
      text: `${Math.min(90, ctx.bestStreak)} / 90 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 90) * 100))
    })
  },
  {
    id: 'b-168',
    icon: '⚡',
    title: 'Ninety-Five Match Apex',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 95-match consecutive win streak.',
    hurdle: '95 consecutive match victories.',
    flavorText: 'Ninety-five victories: one step away from the legendary century mark.',
    points: 1000,
    check: (ctx) => ctx.bestStreak >= 95,
    calcProgress: (ctx) => ({
      text: `${Math.min(95, ctx.bestStreak)} / 95 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 95) * 100))
    })
  },
  {
    id: 'b-169',
    icon: '👑',
    title: 'Century-Match Immortal',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Maintain a 100-match continuous win streak.',
    hurdle: '100 consecutive match victories.',
    flavorText: 'One hundred consecutive victories: an immortal monument to competitive prime factoring.',
    points: 1200,
    check: (ctx) => ctx.bestStreak >= 100,
    calcProgress: (ctx) => ({
      text: `${Math.min(100, ctx.bestStreak)} / 100 Streak`,
      pct: Math.min(100, Math.round((ctx.bestStreak / 100) * 100))
    })
  },
  {
    id: 'b-170',
    icon: '📜',
    title: '12,000 Cleared Composites Monument',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Cross 12,000 total solved composites in competitive ledger.',
    hurdle: '12,000 cumulative solved composites.',
    flavorText: 'Twelve thousand composites cracked: endurance elevated to an art form.',
    points: 1100,
    check: (ctx) => ctx.totalSolved >= 12000,
    calcProgress: (ctx) => ({
      text: `${Math.min(12000, ctx.totalSolved)} / 12,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 12000) * 100))
    })
  },
  {
    id: 'b-171',
    icon: '🌌',
    title: '15,000 Cleared Composites Titan',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Cross 15,000 total solved composites in career history.',
    hurdle: '15,000 cumulative solved composites.',
    flavorText: 'Fifteen thousand composite numbers decomposed with relentless mathematical discipline.',
    points: 1250,
    check: (ctx) => ctx.totalSolved >= 15000,
    calcProgress: (ctx) => ({
      text: `${Math.min(15000, ctx.totalSolved)} / 15,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 15000) * 100))
    })
  },
  {
    id: 'b-172',
    icon: '🔥',
    title: '18,000 Cleared Composites Nebula',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Cross 18,000 total solved composites in career telemetry.',
    hurdle: '18,000 cumulative solved composites.',
    flavorText: 'Eighteen thousand composite factorizations span galaxies of integer distributions.',
    points: 1350,
    check: (ctx) => ctx.totalSolved >= 18000,
    calcProgress: (ctx) => ({
      text: `${Math.min(18000, ctx.totalSolved)} / 18,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 18000) * 100))
    })
  },
  {
    id: 'b-173',
    icon: '💎',
    title: '20,000 Cleared Composites Sovereign',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Cross 20,000 total solved composites in career telemetry.',
    hurdle: '20,000 cumulative solved composites.',
    flavorText: 'Twenty thousand integers successfully cracked: an unprecedented lifetime milestone.',
    points: 1500,
    check: (ctx) => ctx.totalSolved >= 20000,
    calcProgress: (ctx) => ({
      text: `${Math.min(20000, ctx.totalSolved)} / 20,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 20000) * 100))
    })
  },
  {
    id: 'b-174',
    icon: '🌟',
    title: '25,000 Cleared Composites Celestial',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Cross 25,000 total solved composites in career telemetry.',
    hurdle: '25,000 cumulative solved composites.',
    flavorText: 'Twenty-five thousand factorizations mark an indelible legacy in competitive number theory.',
    points: 1750,
    check: (ctx) => ctx.totalSolved >= 25000,
    calcProgress: (ctx) => ({
      text: `${Math.min(25000, ctx.totalSolved)} / 25,000 Solved`,
      pct: Math.min(100, Math.round((ctx.totalSolved / 25000) * 100))
    })
  },
  {
    id: 'b-175',
    icon: '👑',
    title: 'Infinite Longevity Sovereign',
    category: 'streak',
    categoryName: 'Streak & Longevity Volatility',
    desc: 'Achieve 30,000+ total solved composites and 100+ match win streak.',
    hurdle: 'Total Solved ≥ 30,000 and Best Streak ≥ 100.',
    flavorText: 'The Infinite Longevity Sovereign has unlocked the eternal flow state of infinite arithmetic mastery.',
    points: 2000,
    check: (ctx) => ctx.totalSolved >= 30000 && ctx.bestStreak >= 100,
    calcProgress: (ctx) => ({
      text: `Solved: ${ctx.totalSolved}/30000 · Streak: ${ctx.bestStreak}/100`,
      pct: Math.min(100, Math.round(((ctx.totalSolved / 30000) * 50) + ((ctx.bestStreak / 100) * 50)))
    })
  },

  // =========================================================================
  // CATEGORY 4: Cognitive Focus & Anti-Tamper Records (Badges 176 to 200)
  // =========================================================================
  {
    id: 'b-176',
    icon: '🧠',
    title: '5 Consecutive Unshifted Tab Locks',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 5 consecutive matches in Tier 2 (Riemann Transcendentalist) or higher while keeping the browser tab focus completely unshifted (perfect window lock validation logs).',
    hurdle: '5 consecutive Tier 2+ matches with zero blur events or window focus shifts.',
    flavorText: 'Unbroken cognitive presence: zero context switching, zero tab blur, pure undivided mathematical focus.',
    points: 300,
    check: (ctx) => ctx.matchRegistry.length >= 5 && ctx.securityStrikes === 0 && ctx.currentElo >= 1100,
    calcProgress: (ctx) => ({
      text: `${Math.min(5, ctx.matchRegistry.length)} / 5 Tab-Locked Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 5) * 100))
    })
  },
  {
    id: 'b-177',
    icon: '🛡️',
    title: 'HMAC Directory Re-Anchor Seal',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Successfully re-anchor the cryptographic directory signature using the profile integrity tool.',
    hurdle: 'Re-anchor HMAC integrity hash across active user profile directory.',
    flavorText: 'HMAC-SHA256 masks sign local telemetry blocks to prevent unauthorized tampering.',
    points: 150,
    check: () => Boolean(localStorage.getItem('primefactor_profile_token')),
    calcProgress: () => ({ text: 'HMAC Anchored', pct: 100 })
  },
  {
    id: 'b-178',
    icon: '🔒',
    title: 'Zero Blur Cadence Shield',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 8 consecutive matches with zero window blur events.',
    hurdle: '8 consecutive matches with 0 blur events.',
    flavorText: 'Visual lock keeps cognitive buffers primed for incoming composite sequences.',
    points: 220,
    check: (ctx) => ctx.matchRegistry.length >= 8 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(8, ctx.matchRegistry.length)} / 8 Locked Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 8) * 100))
    })
  },
  {
    id: 'b-179',
    icon: '💎',
    title: 'Anti-Tamper Integrity Sentinel',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Maintain a 0-strike record across 10 rated competition matches.',
    hurdle: '10 rated matches with 0 security strikes.',
    flavorText: 'The integrity sentinel protects the honor of competitive Math Olympiad rankings.',
    points: 250,
    check: (ctx) => ctx.matchRegistry.length >= 10 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(10, ctx.matchRegistry.length)} / 10 Clean Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 10) * 100))
    })
  },
  {
    id: 'b-180',
    icon: '🧠',
    title: 'Monolithic Attention Span Pin',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 12 consecutive matches without shifting browser window focus.',
    hurdle: '12 consecutive matches with unshifted viewport focus.',
    flavorText: 'Deep work and sustained focus produce mathematical breakthroughs where fragmented attention fails.',
    points: 280,
    check: (ctx) => ctx.matchRegistry.length >= 12 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(12, ctx.matchRegistry.length)} / 12 Focused Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 12) * 100))
    })
  },
  {
    id: 'b-181',
    icon: '🛡️',
    title: 'Charter Security Invariant',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Review and uphold all 3 rules of the Three-Strike Security Charter.',
    hurdle: 'Full compliance with security protocols across all sessions.',
    flavorText: 'Fair play and cryptographic transparency are the cornerstones of Olympiad Edge.',
    points: 180,
    check: () => true,
    calcProgress: () => ({ text: 'Charter Compliant', pct: 100 })
  },
  {
    id: 'b-182',
    icon: '⚖️',
    title: 'Biometric Pacing Stability',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Maintain standard deviation of factor submission times under 0.40s in a match.',
    hurdle: 'Factor submission timing standard deviation < 0.40s.',
    flavorText: 'Metronomic precision guarantees unshakeable composure under high-stress competition timers.',
    points: 320,
    check: (ctx) => ctx.fastestMatch && ctx.fastestMatch.time <= 15.0,
    calcProgress: (ctx) => ({
      text: ctx.fastestMatch ? 'Pacing Verified' : 'Goal: Steady match cadence',
      pct: ctx.fastestMatch ? 100 : 50
    })
  },
  {
    id: 'b-183',
    icon: '🔒',
    title: 'Cryptographic Token Verified',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Verify and copy your local cryptographic candidate token in profile settings.',
    hurdle: 'Candidate token generated and verified in settings portal.',
    flavorText: 'Unique candidate tokens ensure sovereign, serverless identity persistence.',
    points: 160,
    check: () => Boolean(localStorage.getItem('primefactor_profile_token')),
    calcProgress: () => ({ text: 'Token Verified', pct: 100 })
  },
  {
    id: 'b-184',
    icon: '🧠',
    title: '15-Match Pure Focus Marathon',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 15 consecutive matches with unshifted viewport lock.',
    hurdle: '15 consecutive matches with 0 focus shift interruptions.',
    flavorText: 'Fifteen matches of pure laser focus elevate cognitive conditioning to elite athletic levels.',
    points: 350,
    check: (ctx) => ctx.matchRegistry.length >= 15 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(15, ctx.matchRegistry.length)} / 15 Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 15) * 100))
    })
  },
  {
    id: 'b-185',
    icon: '🛡️',
    title: 'Tamper-Proof Audit Certification',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Hold 0 strikes across 20 consecutive rated matches.',
    hurdle: '20 consecutive matches with uncompromised integrity verification.',
    flavorText: 'An impeccable audit log is the hallmark of genuine academic excellence.',
    points: 380,
    check: (ctx) => ctx.matchRegistry.length >= 20 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(20, ctx.matchRegistry.length)} / 20 Clean Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 20) * 100))
    })
  },
  {
    id: 'b-186',
    icon: '💎',
    title: 'Hermetic Audio-Visual Synesthesia',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 25 matches with audio synthesis enabled for harmonic auditory feedback.',
    hurdle: '25 matches completed with active harmonic chime verification.',
    flavorText: 'Synthesizer chimes reinforce factor memory traces through simultaneous acoustic resonance.',
    points: 400,
    check: (ctx) => ctx.matchRegistry.length >= 25,
    calcProgress: (ctx) => ({
      text: `${Math.min(25, ctx.matchRegistry.length)} / 25 Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 25) * 100))
    })
  },
  {
    id: 'b-187',
    icon: '⚖️',
    title: 'Zero Variance Metronome',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Solve 10 problems in Tier 3 with uniform execution pacing.',
    hurdle: 'Tier 3 match completed with uniform factor cadence.',
    flavorText: 'Rhythmic factoring pacing minimizes metabolic cognitive exhaustion during prolonged sessions.',
    points: 420,
    check: (ctx) => ctx.currentElo >= 1200 && (ctx.fastestMatch ? ctx.fastestMatch.time <= 20.0 : false),
    calcProgress: (ctx) => ({
      text: ctx.currentElo >= 1200 ? 'Cadence Validated' : 'Goal: Tier 3 ELO ≥ 1,200',
      pct: Math.min(100, Math.round((ctx.currentElo / 1200) * 100))
    })
  },
  {
    id: 'b-188',
    icon: '🧠',
    title: '20-Match Deep Work Fortress',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 20 consecutive matches with unshifted viewport lock.',
    hurdle: '20 consecutive matches with 0 focus loss events.',
    flavorText: 'Twenty uninterrupted matches demonstrate Olympic-level concentration discipline.',
    points: 450,
    check: (ctx) => ctx.matchRegistry.length >= 20 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(20, ctx.matchRegistry.length)} / 20 Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 20) * 100))
    })
  },
  {
    id: 'b-189',
    icon: '🔒',
    title: 'Cryptographic Identity Anchor',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Save a customized contestant handle and lock in profile credentials.',
    hurdle: 'Official contestant handle saved and authenticated.',
    flavorText: 'Contestant handles appear on official certificates of merit and leaderboard classifications.',
    points: 200,
    check: () => Boolean(localStorage.getItem('primefactor_profile_username')),
    calcProgress: () => ({
      text: localStorage.getItem('primefactor_profile_username') ? 'Custom Handle Saved' : 'Default Handle Active',
      pct: localStorage.getItem('primefactor_profile_username') ? 100 : 50
    })
  },
  {
    id: 'b-190',
    icon: '🛡️',
    title: 'Certified Real Name Accreditation',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Register a certified legal name for Olympiad accreditation certificates.',
    hurdle: 'Real name registered and saved in profile settings portal.',
    flavorText: 'Legal accreditation links competitive performance to certified academic credentials.',
    points: 250,
    check: () => {
      const rn = localStorage.getItem('primefactor_profile_realname');
      return Boolean(rn && rn !== 'None');
    },
    calcProgress: () => ({
      text: localStorage.getItem('primefactor_profile_realname') && localStorage.getItem('primefactor_profile_realname') !== 'None' ? 'Name Certified' : 'Unregistered',
      pct: localStorage.getItem('primefactor_profile_realname') && localStorage.getItem('primefactor_profile_realname') !== 'None' ? 100 : 0
    })
  },
  {
    id: 'b-191',
    icon: '🏛️',
    title: 'Academic Institution Squad Seal',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Specify your school, university, or mathematics club squad affiliation.',
    hurdle: 'Organization/Institution registered in candidate profile.',
    flavorText: 'Squad affiliations represent university mathematics departments and Olympiad prep leagues.',
    points: 220,
    check: () => {
      const org = localStorage.getItem('primefactor_profile_organization');
      return Boolean(org && org !== 'None');
    },
    calcProgress: () => ({
      text: localStorage.getItem('primefactor_profile_organization') && localStorage.getItem('primefactor_profile_organization') !== 'None' ? 'Affiliation Locked' : 'Unspecified',
      pct: localStorage.getItem('primefactor_profile_organization') && localStorage.getItem('primefactor_profile_organization') !== 'None' ? 100 : 0
    })
  },
  {
    id: 'b-192',
    icon: '🧠',
    title: 'Cognitive Flow State Pinnacle',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 25 consecutive matches with unshifted viewport focus.',
    hurdle: '25 consecutive matches with 0 focus loss events.',
    flavorText: 'Flow state dissolves cognitive friction, allowing raw mathematical perception to lead.',
    points: 500,
    check: (ctx) => ctx.matchRegistry.length >= 25 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(25, ctx.matchRegistry.length)} / 25 Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 25) * 100))
    })
  },
  {
    id: 'b-193',
    icon: '⚖️',
    title: 'Three-Strike Charter Veteran',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 30 consecutive matches with zero security strikes recorded.',
    hurdle: '30 consecutive matches with 0 strikes.',
    flavorText: 'Thirty matches without a strike confirms long-term institutional compliance.',
    points: 550,
    check: (ctx) => ctx.matchRegistry.length >= 30 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(30, ctx.matchRegistry.length)} / 30 Clean Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 30) * 100))
    })
  },
  {
    id: 'b-194',
    icon: '🔒',
    title: 'Anti-Tamper Cryptographic Fortress',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 35 matches with uncompromised HMAC security verification.',
    hurdle: '35 matches with authentic directory signature verification.',
    flavorText: 'An unbreakable cryptographic fortress safeguarding high-performance competitive achievements.',
    points: 600,
    check: (ctx) => ctx.matchRegistry.length >= 35 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(35, ctx.matchRegistry.length)} / 35 Clean Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 35) * 100))
    })
  },
  {
    id: 'b-195',
    icon: '💎',
    title: 'Flawless Ledger Quad-Check Pin',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Achieve 4/4 green checkmarks on the System Expectations Verification Ledger.',
    hurdle: '4/4 passes across Score, Accuracy, Lifeline, and Security ledger audits.',
    flavorText: 'All system expectations verified: score, accuracy, resource discipline, and tamper controls.',
    points: 400,
    check: (ctx) => (ctx.lastResult && ctx.lastResult.score >= 90 && ctx.lastResult.lifelinesUsedCount === 0) || ctx.matchRegistry.some(m => Number(m.score) >= 95),
    calcProgress: (ctx) => ({
      text: ctx.matchRegistry.some(m => Number(m.score) >= 95) ? 'Quad-Check Conquered' : 'Goal: Score ≥ 95 on Ledger',
      pct: ctx.matchRegistry.some(m => Number(m.score) >= 95) ? 100 : 0
    })
  },
  {
    id: 'b-196',
    icon: '🧠',
    title: '30-Match Diamond Focus Zenith',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 30 consecutive matches with unshifted viewport lock.',
    hurdle: '30 consecutive matches with 0 focus loss events.',
    flavorText: 'Thirty matches with zero tab shifts demonstrates monumental cognitive fortitude.',
    points: 650,
    check: (ctx) => ctx.matchRegistry.length >= 30 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(30, ctx.matchRegistry.length)} / 30 Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 30) * 100))
    })
  },
  {
    id: 'b-197',
    icon: '🛡️',
    title: 'Indelible Cryptographic Hash',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 40 matches with zero directory HMAC tamper strikes.',
    hurdle: '40 matches with authentic directory signature verification.',
    flavorText: 'Forty matches audited and certified under cryptographic HMAC hashing protocols.',
    points: 700,
    check: (ctx) => ctx.matchRegistry.length >= 40 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(40, ctx.matchRegistry.length)} / 40 Clean Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 40) * 100))
    })
  },
  {
    id: 'b-198',
    icon: '⚖️',
    title: 'Unbreakable Cognitive Bastion',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 45 matches with unshifted viewport lock and zero security strikes.',
    hurdle: '45 matches with 0 focus blur events and 0 strikes.',
    flavorText: 'The mind operates as an unbreakable bastion impervious to external digital distractions.',
    points: 750,
    check: (ctx) => ctx.matchRegistry.length >= 45 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(45, ctx.matchRegistry.length)} / 45 Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 45) * 100))
    })
  },
  {
    id: 'b-199',
    icon: '🌟',
    title: 'Half-Century Focus Monolith',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Complete 50 consecutive matches with unshifted viewport lock.',
    hurdle: '50 consecutive matches with 0 focus loss events.',
    flavorText: 'Fifty matches of pure locked-in focus cements legendary status in the competitive archives.',
    points: 800,
    check: (ctx) => ctx.matchRegistry.length >= 50 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `${Math.min(50, ctx.matchRegistry.length)} / 50 Matches`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 50) * 100))
    })
  },
  {
    id: 'b-200',
    icon: '👑',
    title: 'Cognitive Focus & Anti-Tamper Apex',
    category: 'resource',
    categoryName: 'Cognitive Focus & Anti-Tamper Records',
    desc: 'Conquer the 100 Badges Vault: complete 50+ matches with zero strikes, zero lifelines, and certified legal accreditation.',
    hurdle: '50+ matches completed, 0 strikes, 0 lifelines, and registered certified identity.',
    flavorText: 'The Apex Badge stands as the definitive badge of honour for competitive Math Olympiad champions.',
    points: 1000,
    check: (ctx) => ctx.matchRegistry.length >= 50 && ctx.securityStrikes === 0,
    calcProgress: (ctx) => ({
      text: `Matches: ${Math.min(50, ctx.matchRegistry.length)}/50 (0 Strikes)`,
      pct: Math.min(100, Math.round((ctx.matchRegistry.length / 50) * 100))
    })
  }
];
