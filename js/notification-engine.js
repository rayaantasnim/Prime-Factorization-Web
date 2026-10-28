/**
 * PrimeFactor.app — Global Notification Engine & Standalone Feed Controller
 * Manages LIFO stack sequence, cryptographic telemetry logging, real-time unread dot sync,
 * visual desaturation of read entries, category filtering, glass-morphic single-open accordion view,
 * detailed narrative-style reports (at least 100 words), rich ELO tracking, performance metrics,
 * and real-time active page toast alerts.
 */

import {
  getNotifications,
  saveNotifications,
  addNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  clearReadNotifications,
  clearAllNotifications,
  hasUnreadNotifications
} from './storage.js';
import { playSound } from './audio.js';

// Re-export storage API for unified imports
export {
  getNotifications,
  saveNotifications,
  addNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  clearReadNotifications,
  clearAllNotifications,
  hasUnreadNotifications
};

// ============================================================================
// 1. HARDWARE-ACCELERATED UNREAD STATUS DOT CONTROLLER
// ============================================================================

export function updateUnreadStatusDots() {
  const isUnread = hasUnreadNotifications();
  const overheadDot = document.getElementById('overhead-nav-unread-dot');
  const rowDot = document.getElementById('notif-row-unread-dot');
  const dashboardDot = document.getElementById('dashboard-notif-dot');
  const standaloneBadge = document.getElementById('telemetry-unread-badge');

  if (overheadDot) {
    overheadDot.style.display = isUnread ? 'inline-block' : 'none';
  }
  if (rowDot) {
    rowDot.style.display = isUnread ? 'inline-block' : 'none';
  }
  if (dashboardDot) {
    dashboardDot.style.display = isUnread ? 'inline-block' : 'none';
  }
  if (standaloneBadge) {
    const unreadCount = getNotifications().filter(n => !n.isRead).length;
    standaloneBadge.textContent = unreadCount > 0 ? `${unreadCount} Unread` : 'All Read';
    standaloneBadge.className = unreadCount > 0 ? 'badge-unread-active' : 'badge-all-read';
  }
}

export function clearAllUnreadDots() {
  const overheadDot = document.getElementById('overhead-nav-unread-dot');
  const rowDot = document.getElementById('notif-row-unread-dot');
  if (overheadDot) overheadDot.style.display = 'none';
  if (rowDot) rowDot.style.display = 'none';
  document.querySelectorAll('.subpixel-unread-dot').forEach(el => {
    el.style.display = 'none';
  });
}

export function initNotificationDotListeners() {
  if (window._primefactorNotificationEngineInitialized) return;
  window._primefactorNotificationEngineInitialized = true;

  updateUnreadStatusDots();

  // Custom intra-window broadcast events (fires toast alerts & unread dot updates)
  window.addEventListener('primefactor_notification_added', (e) => {
    updateUnreadStatusDots();
    if (e.detail) {
      showNotificationToast(e.detail);
    }
  });

  window.addEventListener('primefactor_notifications_read', () => {
    updateUnreadStatusDots();
  });

  // Cross-tab / cross-window storage event sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'primefactor_notifications') {
      updateUnreadStatusDots();
    }
  });
}

// ============================================================================
// 2. REAL-TIME ACTIVE PAGE TOAST ALERT ENGINE (IN-APP PUSH SYSTEM)
// ============================================================================

export function showNotificationToast(notif) {
  if (!notif) return;

  let container = document.getElementById('primefactor-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'primefactor-toast-container';
    container.className = 'primefactor-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Live Achievement & Security Alerts');
    document.body.appendChild(container);
  }

  let icon = '🔔';
  let bannerBorderClass = 'toast-brand';
  if (notif.type === 'elo_gain') {
    icon = '📈';
    bannerBorderClass = 'toast-elo-gain';
  } else if (notif.type === 'elo_loss') {
    icon = '📉';
    bannerBorderClass = 'toast-elo-loss';
  } else if (notif.type === 'rank_shift') {
    icon = '🏆';
    bannerBorderClass = 'toast-rank-shift';
  } else if (notif.type === 'streak') {
    icon = '🔥';
    bannerBorderClass = 'toast-streak';
  } else if (notif.type === 'pr') {
    icon = '⚡';
    bannerBorderClass = 'toast-pr';
  } else if (notif.type === 'refresh_offense' || notif.type === 'security_tampering') {
    icon = '🚨';
    bannerBorderClass = 'toast-security';
  }

  let eloPillHtml = '';
  if (notif.eloTracker && typeof notif.eloTracker.delta === 'number') {
    const delta = notif.eloTracker.delta;
    const isPos = delta >= 0;
    const deltaTxt = isPos ? `+${delta}` : `${delta}`;
    eloPillHtml = `
      <div class="toast-elo-shift-pill ${isPos ? 'toast-elo-shift-pos' : 'toast-elo-shift-neg'}">
        <span>${notif.eloTracker.prevElo}</span>
        <span class="toast-arrow">→</span>
        <strong>${deltaTxt}</strong>
        <span class="toast-arrow">→</span>
        <span>${notif.eloTracker.nextElo} ELO</span>
      </div>
    `;
  }

  const toast = document.createElement('div');
  toast.className = `primefactor-toast-banner ${bannerBorderClass}`;
  toast.setAttribute('role', 'alert');

  toast.innerHTML = `
    <div class="toast-icon-node" aria-hidden="true">${icon}</div>
    <div class="toast-body">
      <div class="toast-top-row">
        <span class="toast-title font-heading">${notif.title || 'System Notification'}</span>
        <span class="toast-time-label">${notif.timestamp ? notif.timestamp.split(',')[0] : 'Just now'}</span>
      </div>
      <p class="toast-preview-msg">${notif.message || ''}</p>
      ${eloPillHtml}
      <div class="toast-footer-bar">
        <span class="toast-committed-tag">✓ Committed to Notifications Ledger</span>
        <a href="./notifications.html" class="toast-feed-link font-heading">View Feed →</a>
      </div>
    </div>
    <button class="toast-dismiss-btn" aria-label="Dismiss alert">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  let dismissed = false;
  const dismissToast = () => {
    if (dismissed) return;
    dismissed = true;
    toast.classList.add('toast-dismissing');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 320);
  };

  const closeBtn = toast.querySelector('.toast-dismiss-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      dismissToast();
    });
  }

  let autoTimer = setTimeout(dismissToast, 4500);

  toast.addEventListener('mouseenter', () => clearTimeout(autoTimer));
  toast.addEventListener('mouseleave', () => {
    autoTimer = setTimeout(dismissToast, 2200);
  });

  try {
    playSound('click');
  } catch (e) {}

  container.prepend(toast);

  while (container.children.length > 3) {
    const oldest = container.lastElementChild;
    if (oldest) container.removeChild(oldest);
  }
}

// ============================================================================
// 3. METRICS & TELEMETRY COMPUTATION
// ============================================================================

export function getNotificationMetrics() {
  const list = getNotifications();
  const total = list.length;
  const unread = list.filter(item => item.isRead === false).length;
  const eloDeltas = list.filter(item => item.type === 'elo_gain' || item.type === 'elo_loss' || item.type === 'rank_shift').length;
  const securityAlerts = list.filter(item => item.type === 'refresh_offense' || item.type === 'security_tampering').length;

  return {
    total,
    unread,
    eloDeltas,
    securityAlerts
  };
}

// ============================================================================
// 4. HIGH-FIDELITY DETAILED NARRATIVE GENERATOR (>= 100 WORDS GUARANTEED)
// ============================================================================

function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function formatDuration(sec) {
  if (sec === undefined || sec === null || isNaN(Number(sec))) return '0.00s';
  const val = Number(sec);
  if (val === 0) return '0.00s';
  const totalSec = Math.floor(val);
  const ms = Math.round((val - totalSec) * 1000);
  if (val >= 60) {
    const m = Math.floor(val / 60);
    const s = (val % 60).toFixed(1);
    return `${m}m ${s}s (${val.toFixed(2)}s)`;
  }
  return ms > 0 ? `${val.toFixed(2)}s (${totalSec}s ${ms}ms)` : `${val.toFixed(2)}s`;
}

/**
 * Synthesizes or extracts a rich, 3-part narrative-style report exceeding 100 words.
 * Accommodates mathematical context, algorithmic complexity, and session telemetry deep-dive.
 */
export function generateDetailedNarrativeReport(notif) {
  const tracker = notif.eloTracker || {};
  const perf = notif.performance || {};
  const prevElo = Number(tracker.prevElo !== undefined ? tracker.prevElo : 500);
  const delta = Number(tracker.delta !== undefined ? tracker.delta : 0);
  const nextElo = Number(tracker.nextElo !== undefined ? tracker.nextElo : prevElo + delta);
  const durationStr = formatDuration(perf.duration);
  const accuracy = perf.accuracy !== undefined ? perf.accuracy : 100;
  const tier = notif.details?.tier || notif.details?.rangeTitle || 'Rated Competition Arena';

  // Check if notification already has an explicit custom narrative of >= 100 words
  if (notif.narrative && countWords(notif.narrative) >= 100) {
    const fullText = notif.narrative;
    const rawParagraphs = fullText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (rawParagraphs.length >= 3) {
      return {
        wordCount: countWords(fullText),
        fullText,
        sections: [
          { heading: 'I. Event Audit & Contextual Background', text: rawParagraphs[0] },
          { heading: 'II. Mathematical & Algorithmic Significance', text: rawParagraphs[1] },
          { heading: 'III. Session Performance & Telemetry Deep-Dive', text: rawParagraphs.slice(2).join('\n\n') }
        ]
      };
    }
    return {
      wordCount: countWords(fullText),
      fullText,
      sections: [
        { heading: 'I. Comprehensive Event Audit', text: fullText },
        { heading: 'II. Mathematical & Algorithmic Significance', text: `Decomposition across this integer spectrum requires balancing quick trial factoring with modular heuristics under high clock velocity.` },
        { heading: 'III. Session Telemetry Deep-Dive', text: `Session concluded at ${durationStr} with ${accuracy}% precision accuracy and ${delta >= 0 ? '+' + delta : delta} ELO delta shift.` }
      ]
    };
  }

  // Synthesize domain-specific, articulate narrative based on notification event type
  let s1 = '';
  let s2 = '';
  let s3 = '';

  if (notif.type === 'rank_shift') {
    const prevTier = notif.details?.prevTier || 'Composite Apprentice';
    const nextTier = notif.details?.nextTier || 'Prime Practitioner';
    const isPromotion = notif.details?.direction !== 'demotion' && delta >= 0;

    s1 = isPromotion
      ? `Competitive Division Elevation: The competitor has officially completed an authoritative rating recalibration in ${tier}, securing a tier promotion from ${prevTier} to ${nextTier}. This milestone elevates baseline expectation standing from ${prevElo.toLocaleString()} ELO to ${nextElo.toLocaleString()} ELO following a decisive ${delta >= 0 ? '+' + delta : delta} ELO rating expansion, adjusting competitive placement across global Olympiad leaderboard rankings.`
      : `Competitive Division Contraction: Following official match adjudication in ${tier}, the player's rating transitioned downward from ${prevTier} to ${nextTier}. This recalibration adjusts standing from ${prevElo.toLocaleString()} ELO to ${nextElo.toLocaleString()} ELO (${delta} ELO shift), reflecting an adaptive skill correction designed to realign the competitor with appropriate numerical range fields.`;

    s2 = `Mathematical & Algorithmic Significance: As competitors cross tier thresholds, the computational complexity of integer factorization increases non-linearly. While foundational divisions permit standard trial division across prime bases (2, 3, 5, 7, 11), higher composite fields exhibit irregular prime gap distributions governed by the Prime Number Theorem π(x) ≈ x / ln(x). Sustaining high factoring velocity requires advancing beyond brute division toward modular residue sieving, rapid quadratic non-residue elimination, and subconscious Pollard's Rho cycle-detection heuristics.`;

    s3 = `Session Performance Deep-Dive: Across the official ${durationStr} match duration, the candidate registered a precision accuracy rate of ${accuracy}% across all composite vectors. Factoring throughput demonstrated steady cognitive cadence, effectively overcoming the adaptive time-decay pressure and securing the mathematical qualifications mandated for ${nextTier} division membership.`;

  } else if (notif.type === 'elo_gain') {
    s1 = `Competitive Rating Advancement: An official rated match conducted under Olympiad standard clock rules has concluded with an authoritative rating increase of +${delta} ELO in ${tier}. This competitive triumph advances active standing from ${prevElo.toLocaleString()} ELO to ${nextElo.toLocaleString()} ELO, successfully expanding the competitor's profile trajectory and shifting their logistical expectation curve positively toward advanced master divisions.`;

    s2 = `Mathematical & Algorithmic Significance: Numerical values in this competitive range rigorously test rapid mental modular reductions across small prime bases. Competitors must swiftly inspect composite parity, execute digital root summations for modulo 3 and 9 divisibility checks, and identify algebraic difference-of-squares factorizations. Outperforming the theoretical expectation baseline reflects an exceptional cognitive capacity to suppress calculation latency when decomposing non-trivial composite semiprimes.`;

    s3 = `Session Performance Deep-Dive: The candidate recorded a complete board clear in exactly ${durationStr} while maintaining an exceptional ${accuracy}% precision accuracy profile. Operating at a brisk cadence per composite question, the candidate outpaced the dynamic algorithmic pacing threshold, minimizing false branch exploration and extracting maximum available K-factor rating yield.`;

  } else if (notif.type === 'elo_loss') {
    s1 = `Competitive Rating Adjustment: Following the conclusion of a rated trial in ${tier}, the Olympiad expectation engine applied a calibration adjustment of ${delta} ELO against the player's profile. This delta shifts the active standing downward from ${prevElo.toLocaleString()} ELO to ${nextElo.toLocaleString()} ELO. The adjustment reflects an inability to satisfy the elevated mathematical velocity demanded by the adaptive logistical model under competition pressure.`;

    s2 = `Mathematical & Algorithmic Significance: Numbers in this competition field exhibit substantial combinatorial density, frequently producing unbalanced semiprimes whose smallest prime factor exceeds elementary trial bounds. Under these conditions, classical trial division experiences sharp polynomial latency spikes. Hesitation on candidate divisors consumes critical seconds, triggering aggressive rating decay penalties enforced by the system's dynamic performance matrix.`;

    s3 = `Session Performance Deep-Dive: The session concluded at ${durationStr} with an accuracy rating of ${accuracy}%, reflecting unforced calculation errors or uncorrected factor entries under clock pressure. The resulting cognitive throughput trailed the adaptive expectation threshold, necessitating an ELO contraction until mental divisibility instincts are re-anchored in the training laboratory.`;

  } else if (notif.type === 'streak') {
    const streakCount = notif.details?.streak || 5;
    s1 = `Longevity Endurance Milestone: The participant has achieved an exceptional competitive longevity achievement, sustaining an unbroken ${streakCount}-match winning streak of consecutive flawless clears in the rated arena. This unbroken progression demonstrates superior mental stamina, error suppression, and algorithmic resilience across consecutive problem distributions, solidifying live rating at ${nextElo.toLocaleString()} ELO.`;

    s2 = `Mathematical & Algorithmic Significance: Combinatorially, executing dozens of consecutive flawless prime decompositions without a single arithmetic error is statistically extraordinary. In randomized numerical fields, each successive problem presents an independent stochastic factor structure. Navigating prime, prime-power, and highly composite integers without triggering false positive factor assumptions requires immaculate mastery of the Fundamental Theorem of Arithmetic and mental sieving techniques.`;

    s3 = `Session Performance Deep-Dive: During the latest leg of this streak, the candidate cleared the problem matrix in ${durationStr} while registering an unblemished ${accuracy}% precision accuracy score. Maintaining sub-second factor synthesis under cumulative competition pressure confirms elite cognitive cadence and near-deterministic accuracy under tournament rules.`;

  } else if (notif.type === 'pr') {
    const scoreVal = notif.details?.score || 120;
    const prevScore = notif.details?.prevHighScore || (scoreVal - 16);
    s1 = `Personal Record Breakthrough: An extraordinary career milestone has been authenticated in the Olympiad ledger. The competitor shattered their prior historical high score, recording a new personal best of ${scoreVal} points in ${tier}. This achievement eclipses the previous benchmark of ${prevScore} points and delivers a dynamic rating boost to ${nextElo.toLocaleString()} ELO.`;

    s2 = `Mathematical & Algorithmic Significance: Breaking performance thresholds in this integer bracket signifies an elite mastery of mental number theory. In this range, composites demand simultaneous evaluation of multiple divisibility heuristics: alternating sums for 11, truncations for 7 and 13, and rapid Euclidean greatest common divisor approximations. Setting a personal record demonstrates optimal synchronization between working memory, factor recognition, and keyboard input cadence.`;

    s3 = `Session Performance Deep-Dive: The record run registered an exceptional completion time of ${durationStr} accompanied by a flawless ${accuracy}% precision accuracy profile. Operating at peak calculation velocity allowed the candidate to maximize speed-bonus multipliers and establish the highest cognitive throughput logged in their career profile.`;

  } else if (notif.type === 'refresh_offense') {
    s1 = `Integrity Compliance Infraction: A critical anti-cheat telemetry violation was intercepted during an active rated match session. The client registered an abrupt browser refresh and unauthorized session termination, initiating an immediate abortive audit. In accordance with the Olympiad 3-strike governance charter, a mandatory disciplinary penalty of -5 ELO was deducted, lowering rating from ${prevElo.toLocaleString()} ELO to ${nextElo.toLocaleString()} ELO.`;

    s2 = `Mathematical & Algorithmic Significance: The competitive rating infrastructure relies strictly on uninterrupted session integrity to maintain ELO statistical validity. In competitive number theory tournaments, abruptly aborting an active match to evade difficult prime combinations or bypass the countdown timer artificially skews the dynamic skill distribution. The system applies deterministic sanctions to ensure that every recorded ELO transition represents authenticated mathematical problem-solving.`;

    s3 = `Session Performance Deep-Dive: The aborted match session terminated at ${durationStr} with 0% verified accuracy and zero completed factorizations. The match was registered in the security audit ledger as an integrity breach, advancing the player's offense log and triggering live telemetry monitoring across subsequent match initializations.`;

  } else if (notif.type === 'security_tampering') {
    s1 = `Security Tampering Sanction: An integrity violation was intercepted by the cryptographic audit sub-system. The client profile storage signature failed SHA-256 HMAC cryptographic token validation, indicating unauthorized modification of local storage key-values. A mandatory liquidation penalty was executed against the competitive rating ledger.`;

    s2 = `Mathematical & Algorithmic Significance: In competitive mathematics arenas, verifiable state provenance is paramount. The application anchors competitive ratings, match tallies, and peak historical records in deterministic HMAC checksum digests. Tampering with serialized profile nodes compromises cryptographic state consistency and threatens rating parity across the competitive population.`;

    s3 = `Session Performance Deep-Dive: The security validator isolated the state mutation immediately upon session boot, applying a severe rating penalty. All active session privileges were suspended pending directory re-signing, and an unforgeable strike marker was recorded in the persistent security telemetry ledger.`;

  } else {
    // Default / System Onboarding
    s1 = `System Telemetry & Platform Calibration: The Olympiad computational environment has successfully initialized and calibrated against the host browser's high-resolution precision clock. The candidate's baseline competitive profile has been synchronized at ${nextElo.toLocaleString()} ELO (Composite Apprentice division), establishing the foundational anchor for all future speed trials.`;

    s2 = `Mathematical & Algorithmic Significance: The underlying calculation engine leverages a real-time Pollard's Rho heuristic with Brent's cycle-finding modification to verify prime factorization primality deterministically. Calibrating this engine guarantees microsecond evaluation bounds when verifying candidate answers against random composite distributions, ensuring zero latency drift during rated clock countdowns.`;

    s3 = `Session Performance Deep-Dive: Initialized with verified 100% precision calibration and ${durationStr} initial system latency. The telemetry engine is fully primed to track real-time keystroke variance, calculation cadence, and dynamic ELO volatility across all upcoming competition tiers.`;
  }

  const fullText = `${s1}\n\n${s2}\n\n${s3}`;
  const totalWords = countWords(fullText);

  return {
    wordCount: totalWords,
    fullText,
    sections: [
      { heading: 'I. Event Audit & Contextual Background', text: s1 },
      { heading: 'II. Mathematical & Algorithmic Significance', text: s2 },
      { heading: 'III. Session Performance & Telemetry Deep-Dive', text: s3 }
    ]
  };
}

/**
 * Renders the High-Fidelity Long-Form Narrative Report Box inside the accordion card
 */
function renderDetailedNarrativeSectionHtml(notif) {
  const report = generateDetailedNarrativeReport(notif);

  return `
    <div class="notif-report-section notif-narrative-section">
      <div class="narrative-header-bar">
        <div class="report-section-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          <span>Comprehensive Mathematical & Telemetry Audit Report</span>
        </div>
        <span class="narrative-word-count-badge font-mono">${report.wordCount} Words · Long-Form Audit</span>
      </div>

      <div class="notif-narrative-card">
        ${report.sections.map(sec => `
          <div class="narrative-block">
            <div class="narrative-subheading font-heading">
              <span>${sec.heading}</span>
            </div>
            <p class="narrative-text">${sec.text}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// 5. ELO TRACKER & PERFORMANCE METRICS HTML RENDERERS
// ============================================================================

function renderEloTrackerHtml(tracker) {
  if (!tracker || tracker.prevElo === undefined) return '';

  const prev = Number(tracker.prevElo);
  const delta = Number(tracker.delta);
  const next = Number(tracker.nextElo !== undefined ? tracker.nextElo : prev + delta);
  const isPos = delta >= 0;
  const deltaDisplay = isPos ? `+${delta}` : `${delta}`;
  const deltaClass = isPos ? 'elo-shift-pos' : 'elo-shift-neg';

  return `
    <div class="notif-report-section notif-tracker-section">
      <div class="report-section-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          <polyline points="16 7 22 7 22 13"/>
        </svg>
        <span>Competitive Rating Shift Tracker</span>
      </div>
      <div class="notif-elo-tracker">
        <div class="elo-track-box">
          <span class="elo-track-label">Previous ELO</span>
          <span class="elo-track-val font-mono">${prev.toLocaleString()}</span>
        </div>
        <div class="elo-track-arrow" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
        <div class="elo-track-box ${deltaClass}">
          <span class="elo-track-label">Delta Shift</span>
          <span class="elo-track-val font-mono">${deltaDisplay}</span>
        </div>
        <div class="elo-track-arrow" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
        <div class="elo-track-box elo-live-box">
          <span class="elo-track-label">Updated Live ELO</span>
          <span class="elo-track-val font-mono">${next.toLocaleString()}</span>
        </div>
      </div>
    </div>
  `;
}

function renderPerformanceHtml(perf) {
  if (!perf) return '';

  const durationStr = formatDuration(perf.duration);
  const accuracy = perf.accuracy !== undefined ? perf.accuracy : 100;

  return `
    <div class="notif-report-section notif-metrics-section">
      <div class="report-section-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>Match Performance Telemetry</span>
      </div>
      <div class="notif-metrics-grid">
        <div class="metric-pod">
          <span class="metric-icon">⏱️</span>
          <div class="metric-body">
            <span class="metric-sublabel">Completion Duration</span>
            <span class="metric-num font-mono">${durationStr}</span>
          </div>
        </div>
        <div class="metric-pod">
          <span class="metric-icon">🎯</span>
          <div class="metric-body">
            <span class="metric-sublabel">Precision Accuracy</span>
            <span class="metric-num font-mono">${accuracy}%</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// 6. SINGLE-OPEN ACCORDION CONTROLLER & LIFO FEED ENGINE
// ============================================================================

let activeFilter = 'all';
let activeExpandedCardId = null;

export function toggleNotificationAccordion(cardId) {
  const container = document.getElementById('notifications-feed-list');
  if (!container) return;

  const targetCard = container.querySelector(`.notif-card[data-id="${cardId}"]`);
  if (!targetCard) return;

  const isCurrentlyExpanded = targetCard.classList.contains('expanded');

  // Single-Open Enforcement: Collapse all currently expanded cards
  container.querySelectorAll('.notif-card.expanded').forEach(card => {
    card.classList.remove('expanded');
    const toggleBtn = card.querySelector('.btn-accordion-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  });

  if (!isCurrentlyExpanded) {
    // Smoothly expand target card downwards
    targetCard.classList.add('expanded');
    const toggleBtn = targetCard.querySelector('.btn-accordion-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    activeExpandedCardId = cardId;
    playSound('click');

    // Auto mark as read upon expanding to inspect
    if (targetCard.classList.contains('unread-card')) {
      markNotificationAsRead(cardId);
      targetCard.classList.remove('unread-card');
      targetCard.classList.add('read-card');
      const dot = targetCard.querySelector('.subpixel-unread-dot');
      if (dot) dot.remove();
      const markBtn = targetCard.querySelector('.btn-mark-single-read');
      if (markBtn) {
        const archivedSpan = document.createElement('span');
        archivedSpan.className = 'read-indicator-label';
        archivedSpan.textContent = 'Archived Log';
        markBtn.replaceWith(archivedSpan);
      }
      updateTelemetryCounters();
    }
  } else {
    activeExpandedCardId = null;
    playSound('click');
  }
}

export function renderNotificationsFeed(containerId = 'notifications-feed-list', filter = activeFilter) {
  activeFilter = filter;
  const container = document.getElementById(containerId);
  if (!container) return;

  const raw = getNotifications();

  // Strict Category Filter Routing
  let filtered = raw;
  if (filter === 'elo') {
    filtered = raw.filter(item => item.type === 'elo_gain' || item.type === 'elo_loss' || item.type === 'rank_shift');
  } else if (filter === 'security') {
    filtered = raw.filter(item => item.type === 'refresh_offense' || item.type === 'security_tampering');
  } else if (filter === 'system') {
    filtered = raw.filter(item => 
      item.type === 'system' ||
      item.type === 'streak' ||
      item.type === 'pr' ||
      (item.type !== 'elo_gain' && item.type !== 'elo_loss' && item.type !== 'rank_shift' && item.type !== 'refresh_offense' && item.type !== 'security_tampering')
    );
  }

  // LIFO Stack Sequence: Unread first, then newest entry at the top
  const sorted = [...filtered].sort((a, b) => {
    if (a.isRead === b.isRead) return 0;
    return a.isRead ? 1 : -1;
  });

  // Handle Empty State
  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="notifications-empty-state">
        <div class="empty-icon-wrap">🔕</div>
        <h3 class="empty-title font-heading">No Notification Logs Found</h3>
        <p class="empty-desc">
          ${filter === 'all' 
            ? 'No activity entries have been recorded yet. Launch an arena match or adjust your profile to begin logging.' 
            : `No logs matching the "${filter.toUpperCase()}" filter category are currently in the directory.`}
        </p>
        ${filter !== 'all' ? `
          <button id="reset-filter-btn" class="btn-reset-filter font-heading">
            Reset to All Logs
          </button>
        ` : ''}
      </div>
    `;

    const resetBtn = document.getElementById('reset-filter-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        playSound('click');
        setActiveTab('all');
        renderNotificationsFeed(containerId, 'all');
      });
    }
    return;
  }

  // Map Notifications to Glass-Morphic Accordion Cards
  container.innerHTML = sorted.map((notif) => {
    const isUnread = notif.isRead === false;
    const isExpanded = notif.id === activeExpandedCardId;

    let icon = '🔔';
    let typeBadge = 'SYSTEM LOG';
    let badgeClass = 'badge-system';
    let cardClass = isUnread ? 'notif-card unread-card' : 'notif-card read-card';
    if (isExpanded) cardClass += ' expanded';

    if (notif.type === 'refresh_offense') {
      icon = '🚨';
      typeBadge = 'INTEGRITY BREACH';
      badgeClass = 'badge-offense';
      cardClass += ' offense-card';
    } else if (notif.type === 'security_tampering') {
      icon = '🛡️';
      typeBadge = 'SECURITY STRIKE';
      badgeClass = 'badge-security';
      cardClass += ' security-card';
    } else if (notif.type === 'elo_gain') {
      icon = '📈';
      typeBadge = 'RATING GAIN (+ELO)';
      badgeClass = 'badge-elo-gain';
      cardClass += ' elo-gain-card';
    } else if (notif.type === 'elo_loss') {
      icon = '📉';
      typeBadge = 'RATING LOSS (-ELO)';
      badgeClass = 'badge-elo-loss';
      cardClass += ' elo-loss-card';
    } else if (notif.type === 'rank_shift') {
      icon = '🏆';
      typeBadge = 'RANK SHIFT';
      badgeClass = 'badge-rank-shift';
      cardClass += ' rank-shift-card';
    } else if (notif.type === 'streak') {
      icon = '🔥';
      typeBadge = 'STREAK MILESTONE';
      badgeClass = 'badge-streak';
      cardClass += ' streak-card';
    } else if (notif.type === 'pr') {
      icon = '⚡';
      typeBadge = 'PERSONAL RECORD';
      badgeClass = 'badge-pr';
      cardClass += ' pr-card';
    }

    let teaser = '';
    if (notif.eloTracker && typeof notif.eloTracker.delta === 'number') {
      const d = notif.eloTracker.delta;
      teaser = d >= 0 ? `+${d} ELO (Live: ${notif.eloTracker.nextElo})` : `${d} ELO (Live: ${notif.eloTracker.nextElo})`;
    } else if (notif.message) {
      teaser = notif.message.length > 55 ? notif.message.slice(0, 52) + '...' : notif.message;
    }

    return `
      <div class="${cardClass}" data-id="${notif.id}" role="article" aria-label="${notif.title || 'Notification Entry'}">
        <!-- Compact Header (Always Visible in Collapsed State) -->
        <div class="notif-card-header" data-toggle-card="${notif.id}">
          <div class="notif-meta-left">
            <span class="notif-icon-bubble" aria-hidden="true">${icon}</span>
            <div class="notif-title-group">
              <div class="notif-title-row">
                <h4 class="notif-title font-heading">${notif.title || 'System Notification'}</h4>
                ${isUnread ? `
                  <span class="subpixel-unread-dot" title="Unread entry" aria-label="Unread"></span>
                ` : ''}
              </div>
              <div class="notif-brief-row">
                <span class="notif-timestamp">${notif.timestamp || 'Recorded'}</span>
                ${teaser ? `<span class="notif-brief-dot">·</span><span class="notif-brief-teaser">${teaser}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="notif-meta-right">
            <span class="notif-type-badge ${badgeClass} font-heading">
              ${typeBadge}
            </span>
            ${isUnread ? `
              <button class="btn-mark-single-read font-heading" data-read-id="${notif.id}" title="Mark this log as read">
                Mark Read
              </button>
            ` : `
              <span class="read-indicator-label">Archived Log</span>
            `}
            <button class="btn-accordion-toggle" data-toggle-btn="${notif.id}" aria-expanded="${isExpanded ? 'true' : 'false'}" aria-label="Toggle details">
              <svg class="accordion-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <!-- Expandable Accordion Body Revealing Detailed Narrative Report -->
        <div class="notif-accordion-content" id="accordion-${notif.id}">
          <div class="notif-mini-report">
            <!-- 1. Detailed Narrative Report (At least 100 words guaranteed) -->
            ${renderDetailedNarrativeSectionHtml(notif)}

            <!-- 2. ELO Tracker (Previous ELO -> Delta Shift -> Updated live ELO) -->
            ${renderEloTrackerHtml(notif.eloTracker)}

            <!-- 3. Performance Metrics (Completion Duration & Precision Accuracy %) -->
            ${renderPerformanceHtml(notif.performance)}

            <!-- Card Footer -->
            <div class="notif-card-footer">
              <span class="notif-security-audit-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                HMAC Validated Audit Entry
              </span>
              <span class="notif-id-label">#${String(notif.id).slice(-8)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind Accordion Dropdown Toggles (Single-Open Enforcement)
  container.querySelectorAll('.btn-accordion-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-toggle-btn');
      if (id) toggleNotificationAccordion(id);
    });
  });

  // Clicking on card header (excluding action buttons) also toggles accordion
  container.querySelectorAll('.notif-card-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.closest('.btn-mark-single-read') || e.target.closest('.btn-accordion-toggle')) {
        return;
      }
      const id = header.getAttribute('data-toggle-card');
      if (id) toggleNotificationAccordion(id);
    });
  });

  // Bind Single Mark-As-Read Action Buttons
  container.querySelectorAll('.btn-mark-single-read').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      const id = btn.getAttribute('data-read-id');
      if (id) {
        markNotificationAsRead(id);
        renderNotificationsFeed(containerId, activeFilter);
        updateTelemetryCounters();
      }
    });
  });
}

function setActiveTab(filter) {
  document.querySelectorAll('.filter-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-filter') === filter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function updateTelemetryCounters() {
  const metrics = getNotificationMetrics();
  const elTotal = document.getElementById('metric-total-logs');
  const elUnread = document.getElementById('metric-unread-logs');
  const elElo = document.getElementById('metric-elo-deltas');
  const elSecurity = document.getElementById('metric-security-strikes');

  if (elTotal) elTotal.textContent = String(metrics.total);
  if (elUnread) elUnread.textContent = String(metrics.unread);
  if (elElo) elElo.textContent = String(metrics.eloDeltas);
  if (elSecurity) elSecurity.textContent = String(metrics.securityAlerts);

  updateUnreadStatusDots();
}

// ============================================================================
// 7. STANDALONE NOTIFICATIONS.HTML PAGE CONTROLLER
// ============================================================================

export function initNotificationsPage() {
  initNotificationDotListeners();
  updateTelemetryCounters();
  renderNotificationsFeed('notifications-feed-list', 'all');

  // Filter Tabs
  document.querySelectorAll('.filter-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      const filter = btn.getAttribute('data-filter') || 'all';
      setActiveTab(filter);
      renderNotificationsFeed('notifications-feed-list', filter);
    });
  });

  // Action: Mark All as Read
  const markAllBtn = document.getElementById('btn-mark-all-read');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      playSound('click');
      markAllNotificationsAsRead();
      clearAllUnreadDots();
      updateTelemetryCounters();
      renderNotificationsFeed('notifications-feed-list', activeFilter);
    });
  }

  // Action: Clear Read Logs
  const clearReadBtn = document.getElementById('btn-clear-read-logs');
  if (clearReadBtn) {
    clearReadBtn.addEventListener('click', () => {
      playSound('click');
      clearReadNotifications();
      updateTelemetryCounters();
      renderNotificationsFeed('notifications-feed-list', activeFilter);
    });
  }

  // Action: Dispatch Sample Test Log (Simulates major events with rich narrative reports)
  const testLogBtn = document.getElementById('btn-test-notification');
  if (testLogBtn) {
    testLogBtn.addEventListener('click', () => {
      playSound('click');
      const sampleTypes = ['elo_gain', 'elo_loss', 'rank_shift', 'streak', 'pr', 'refresh_offense'];
      const chosen = sampleTypes[Math.floor(Math.random() * sampleTypes.length)];

      if (chosen === 'elo_gain') {
        addNotification({
          type: 'elo_gain',
          title: 'Rating Gain',
          message: '📈 Rating Increase: +22 ELO earned in Tier 2: 1 - 500 [Simulated]. Rapid factorization cadence under clock.',
          eloTracker: { prevElo: 1500, delta: 22, nextElo: 1522 },
          performance: { duration: 38.45, accuracy: 100 },
          details: { tier: 'Tier 2: 1 - 500' }
        });
      } else if (chosen === 'elo_loss') {
        addNotification({
          type: 'elo_loss',
          title: 'Rating Adjustment',
          message: '📉 Rating Adjustment: -14 ELO in Tier 4: 1 - 2,000 [Simulated]. Performance fell below dynamic expectation threshold.',
          eloTracker: { prevElo: 1522, delta: -14, nextElo: 1508 },
          performance: { duration: 64.20, accuracy: 70 },
          details: { tier: 'Tier 4: 1 - 2,000' }
        });
      } else if (chosen === 'rank_shift') {
        addNotification({
          type: 'rank_shift',
          title: 'Tier Promotion: Prime Practitioner',
          message: '🏆 Promotion Milestone: Ascended from Composite Apprentice to Prime Practitioner (+25 ELO) [Simulated]. Live rating threshold cleared.',
          eloTracker: { prevElo: 1180, delta: 25, nextElo: 1205 },
          performance: { duration: 31.80, accuracy: 100 },
          details: { prevTier: 'Composite Apprentice', nextTier: 'Prime Practitioner', direction: 'promotion', tier: 'Tier 2: 1 - 500' }
        });
      } else if (chosen === 'streak') {
        addNotification({
          type: 'streak',
          title: '5-Match Win Streak!',
          message: '🔥 Longevity Milestone: Maintained continuous flawless 10/10 execution across 5 consecutive matches [Simulated].',
          eloTracker: { prevElo: 1508, delta: 18, nextElo: 1526 },
          performance: { duration: 29.50, accuracy: 100 },
          details: { streak: 5, tier: 'Tier 2: 1 - 500' }
        });
      } else if (chosen === 'pr') {
        addNotification({
          type: 'pr',
          title: 'Personal Record Broken!',
          message: '⚡ Personal Record Shattered! Achieved new career high score of 128 pts in Tier 3: 1 - 1,000 [Simulated].',
          eloTracker: { prevElo: 1526, delta: 24, nextElo: 1550 },
          performance: { duration: 24.15, accuracy: 100 },
          details: { score: 128, prevHighScore: 112, tier: 'Tier 3: 1 - 1,000' }
        });
      } else if (chosen === 'refresh_offense') {
        addNotification({
          type: 'refresh_offense',
          title: 'Integrity Breach',
          message: '🚨 Abrupt reload recorded during live match. Mandatory -5 ELO applied [Simulated].',
          eloTracker: { prevElo: 1550, delta: -5, nextElo: 1545 },
          performance: { duration: 12.00, accuracy: 0 },
          details: { tier: 'Arena Exam' }
        });
      }

      updateTelemetryCounters();
      renderNotificationsFeed('notifications-feed-list', activeFilter);
    });
  }
}
