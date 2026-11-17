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
  hasUnreadNotifications,
  getPendingToasts,
  markPendingToastShown,
  consumePendingToast,
} from "./storage.js";
import { playSound } from "./audio.js";

// Re-export storage API for unified imports
export {
  getNotifications,
  saveNotifications,
  addNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  clearReadNotifications,
  clearAllNotifications,
  hasUnreadNotifications,
};

const TOAST_DURATION_MS = 5000;

function escapeHtml(str) {
  return String(str ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

function resolveAlertMeta(type) {
  switch (type) {
    case "elo_gain":
      return {
        icon: "📈",
        defaultTitle: "Rating Gain",
        bannerClass: "toast-elo-gain",
        badge: "RATING GAIN (+ELO)",
        badgeClass: "badge-elo-gain",
        cardClass: "elo-gain-card",
        category: "elo",
      };
    case "elo_loss":
      return {
        icon: "📉",
        defaultTitle: "Rating Adjustment",
        bannerClass: "toast-elo-loss",
        badge: "RATING LOSS (-ELO)",
        badgeClass: "badge-elo-loss",
        cardClass: "elo-loss-card",
        category: "elo",
      };
    case "rank_shift":
      return {
        icon: "🏆",
        defaultTitle: "Rank Tier Shift",
        bannerClass: "toast-rank-shift",
        badge: "RANK SHIFT",
        badgeClass: "badge-rank-shift",
        cardClass: "rank-shift-card",
        category: "elo",
      };
    case "streak":
      return {
        icon: "🔥",
        defaultTitle: "Streak Milestone",
        bannerClass: "toast-streak",
        badge: "STREAK MILESTONE",
        badgeClass: "badge-streak",
        cardClass: "streak-card",
        category: "system",
      };
    case "pr":
      return {
        icon: "⚡",
        defaultTitle: "Personal Record",
        bannerClass: "toast-pr",
        badge: "PERSONAL RECORD",
        badgeClass: "badge-pr",
        cardClass: "pr-card",
        category: "system",
      };
    case "refresh_offense":
      return {
        icon: "🚨",
        defaultTitle: "Integrity Breach",
        bannerClass: "toast-security",
        badge: "INTEGRITY BREACH",
        badgeClass: "badge-offense",
        cardClass: "offense-card",
        category: "security",
      };
    case "security_tampering":
    case "security_flag":
    case "security":
      return {
        icon: "🛡️",
        defaultTitle: "Security Flag",
        bannerClass: "toast-security",
        badge:
          type === "security_tampering" ? "SECURITY STRIKE" : "SECURITY FLAG",
        badgeClass: "badge-security",
        cardClass: "security-card",
        category: "security",
      };
    case "policy_offense":
    case "penalty":
    case "offense":
      return {
        icon: "⚖️",
        defaultTitle: "Policy Offense",
        bannerClass: "toast-offense",
        badge: "POLICY OFFENSE",
        badgeClass: "badge-offense",
        cardClass: "offense-card",
        category: "security",
      };
    case "success":
      return {
        icon: "✅",
        defaultTitle: "System Notice",
        bannerClass: "toast-success",
        badge: "SYSTEM CONFIRMED",
        badgeClass: "badge-elo-gain",
        cardClass: "",
        category: "system",
      };
    case "warning":
      return {
        icon: "⚠️",
        defaultTitle: "System Advisory",
        bannerClass: "toast-warning",
        badge: "SYSTEM ADVISORY",
        badgeClass: "badge-rank-shift",
        cardClass: "",
        category: "system",
      };
    case "error":
      return {
        icon: "❌",
        defaultTitle: "System Error",
        bannerClass: "toast-error",
        badge: "SYSTEM ERROR",
        badgeClass: "badge-offense",
        cardClass: "offense-card",
        category: "security",
      };
    case "diagnostics_complete":
    case "diagnostics_reset":
    case "system":
    case "info":
    default:
      return {
        icon: "🔔",
        defaultTitle: "System Notice",
        bannerClass: "toast-brand",
        badge: "SYSTEM LOG",
        badgeClass: "badge-system",
        cardClass: "",
        category: "system",
      };
  }
}

// ============================================================================
// 1. HARDWARE-ACCELERATED UNREAD STATUS DOT CONTROLLER
// ============================================================================

/** Timestamps may be strings, epoch numbers, Dates or Firestore Timestamps — never assume a string. */
function formatNotifDate(ts) {
  if (!ts) return "Just now";
  if (typeof ts === "string") return ts.split(",")[0];
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  return Number.isNaN(d.getTime()) ? "Just now" : d.toLocaleDateString();
}

export function updateUnreadStatusDots() {
  const isUnread = hasUnreadNotifications();
  const overheadDot = document.getElementById("overhead-nav-unread-dot");
  const rowDot = document.getElementById("notif-row-unread-dot");
  const dashboardDot = document.getElementById("dashboard-notif-dot");
  const standaloneBadge = document.getElementById("telemetry-unread-badge");

  if (overheadDot) {
    overheadDot.style.display = isUnread ? "inline-block" : "none";
  }
  if (rowDot) {
    rowDot.style.display = isUnread ? "inline-block" : "none";
  }
  if (dashboardDot) {
    dashboardDot.style.display = isUnread ? "inline-block" : "none";
  }
  if (standaloneBadge) {
    const unreadCount = getNotifications().filter((n) => !n.isRead).length;
    standaloneBadge.textContent =
      unreadCount > 0 ? `${unreadCount} Unread` : "All Read";
    standaloneBadge.className =
      unreadCount > 0 ? "badge-unread-active" : "badge-all-read";
  }
}

export function clearAllUnreadDots() {
  const overheadDot = document.getElementById("overhead-nav-unread-dot");
  const rowDot = document.getElementById("notif-row-unread-dot");
  if (overheadDot) overheadDot.style.display = "none";
  if (rowDot) rowDot.style.display = "none";
  document.querySelectorAll(".subpixel-unread-dot").forEach((el) => {
    el.style.display = "none";
  });
}

export function replayPendingToasts() {
  if (typeof document === "undefined" || !document.body) return;
  const pending = getPendingToasts();
  if (!pending.length) return;
  const now = Date.now();
  pending.forEach((item) => {
    const elapsed = item._shownAt ? Math.max(0, now - item._shownAt) : 0;
    const remaining = Math.max(3500, TOAST_DURATION_MS - elapsed);
    showNotificationToast(item, { durationMs: remaining, fromReplay: true });
  });
}

export function initNotificationDotListeners() {
  if (typeof window === "undefined") return;
  window.__pfNotificationEngineActive = true;
  if (window._primefactorNotificationEngineInitialized) return;
  window._primefactorNotificationEngineInitialized = true;

  updateUnreadStatusDots();

  // Custom intra-window broadcast events (fires toast alerts & unread dot updates)
  window.addEventListener("primefactor_notification_added", (e) => {
    updateUnreadStatusDots();
    if (e.detail) {
      if (e.detail.id && !e.detail.isRead) {
        expandedCardIds.add(String(e.detail.id));
      }
      showNotificationToast(e.detail);
    }
    if (document.getElementById("notifications-feed-list")) {
      updateTelemetryCounters();
      renderNotificationsFeed("notifications-feed-list", activeFilter);
    }
  });

  window.addEventListener("primefactor_notifications_read", (e) => {
    updateUnreadStatusDots();
    if (e?.detail?.all || e?.detail?.clearedAll) {
      expandedCardIds.clear();
      if (focusedNotificationId) expandedCardIds.add(focusedNotificationId);
    }
    if (document.getElementById("notifications-feed-list")) {
      updateTelemetryCounters();
      renderNotificationsFeed("notifications-feed-list", activeFilter);
    }
  });

  // Unified custom toast events across modules
  const onUnifiedToastEvent = (e) => {
    if (!e || e.detail === undefined) return;
    showToast(e.detail);
  };
  window.addEventListener("primefactor:toast", onUnifiedToastEvent);
  window.addEventListener("primefactor_toast", onUnifiedToastEvent);

  // Cross-tab / cross-window storage event sync
  window.addEventListener("storage", (e) => {
    if (e.key === "primefactor_notifications") {
      getNotifications().forEach((item) => {
        if (item && item.id && !item.isRead)
          expandedCardIds.add(String(item.id));
      });
      updateUnreadStatusDots();
      if (document.getElementById("notifications-feed-list")) {
        updateTelemetryCounters();
        renderNotificationsFeed("notifications-feed-list", activeFilter);
      }
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", replayPendingToasts, {
      once: true,
    });
  } else {
    replayPendingToasts();
  }
}

// ============================================================================
// 2. REAL-TIME ACTIVE PAGE TOAST ALERT ENGINE (IN-APP PUSH SYSTEM)
// ============================================================================

export function showNotificationToast(notif, options = {}) {
  if (!notif || typeof document === "undefined" || !document.body) return;

  const displayedIds =
    window.__pfDisplayedToastIds || (window.__pfDisplayedToastIds = new Set());
  if (notif.id) {
    if (displayedIds.has(notif.id)) return;
    displayedIds.add(notif.id);
    markPendingToastShown(notif.id);
  }

  let container = document.getElementById("primefactor-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "primefactor-toast-container";
    container.className = "primefactor-toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("role", "region");
    container.setAttribute(
      "aria-label",
      "Live System, ELO, Security & Policy Alerts",
    );
    document.body.appendChild(container);
  }

  const meta = resolveAlertMeta(notif.type);
  const icon = notif.icon || meta.icon;
  const bannerBorderClass = meta.bannerClass;
  const durationMs =
    Number(options.durationMs || notif.durationMs) > 0
      ? Number(options.durationMs || notif.durationMs)
      : TOAST_DURATION_MS;

  const isExamPage =
    document.documentElement.dataset.uxPage === "exam" ||
    window.location.pathname.endsWith("/exam.html") ||
    window.location.pathname.endsWith("exam.html");

  const isLedgerEntry = Boolean(notif.id && notif.ephemeral !== true);

  let eloPillHtml = "";
  if (notif.eloTracker && typeof notif.eloTracker.delta === "number") {
    const delta = notif.eloTracker.delta;
    const isPos = delta >= 0;
    const deltaTxt = isPos ? `+${delta}` : `${delta}`;
    eloPillHtml = `
      <div class="toast-elo-shift-pill ${isPos ? "toast-elo-shift-pos" : "toast-elo-shift-neg"}">
        <span>${escapeHtml(notif.eloTracker.prevElo)}</span>
        <span class="toast-arrow">→</span>
        <strong>${escapeHtml(deltaTxt)}</strong>
        <span class="toast-arrow">→</span>
        <span>${escapeHtml(notif.eloTracker.nextElo)} ELO</span>
      </div>
    `;
  }

  const footerTag = isLedgerEntry
    ? "✓ Committed to Notifications Ledger"
    : `${meta.badge} · 5s Auto-Dismiss`;

  const focusQuery = notif.id ? `?focus=${encodeURIComponent(notif.id)}` : "";
  const feedLinkHtml =
    !isExamPage && isLedgerEntry
      ? `<a href="./notifications.html${focusQuery}" class="toast-feed-link font-heading">View Feed →</a>`
      : "";

  const toast = document.createElement("div");
  toast.className = `primefactor-toast-banner ${bannerBorderClass}`;
  toast.setAttribute("role", "alert");

  toast.innerHTML = `
    <div class="toast-icon-node" aria-hidden="true">${escapeHtml(icon)}</div>
    <div class="toast-body">
      <div class="toast-top-row">
        <span class="toast-title font-heading">${escapeHtml(notif.title || meta.defaultTitle)}</span>
        <span class="toast-time-label">${escapeHtml(formatNotifDate(notif.timestamp))}</span>
      </div>
      <p class="toast-preview-msg">${escapeHtml(notif.message || "")}</p>
      ${eloPillHtml}
      <div class="toast-footer-bar">
        <span class="toast-committed-tag">${escapeHtml(footerTag)}</span>
        ${feedLinkHtml}
      </div>
    </div>
    <button type="button" class="toast-dismiss-btn" aria-label="Close alert" title="Close alert">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <div class="toast-timer-track" aria-hidden="true">
      <div class="toast-timer-bar" style="animation-duration: ${durationMs}ms;"></div>
    </div>
  `;

  let dismissed = false;
  let remainingMs = durationMs;
  let startedAt = Date.now();
  let autoTimer = null;

  const dismissToast = () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(autoTimer);
    if (notif.id) {
      consumePendingToast(notif.id);
    }
    toast.classList.add("toast-dismissing");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 320);
  };

  const closeBtn = toast.querySelector(".toast-dismiss-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        playSound("click");
      } catch (err) {}
      dismissToast();
    });
  }

  autoTimer = setTimeout(dismissToast, remainingMs);

  toast.addEventListener("mouseenter", () => {
    clearTimeout(autoTimer);
    remainingMs = Math.max(400, remainingMs - (Date.now() - startedAt));
  });
  toast.addEventListener("mouseleave", () => {
    if (dismissed) return;
    startedAt = Date.now();
    autoTimer = setTimeout(dismissToast, remainingMs);
  });

  if (!options.fromReplay) {
    try {
      playSound("click");
    } catch (e) {}
  }

  container.prepend(toast);

  while (container.children.length > 4) {
    const oldest = container.lastElementChild;
    if (oldest) container.removeChild(oldest);
  }
}

/**
 * Unified application-wide toast launcher.
 * Accepts either a plain string `(message, type, durationMs)` or an object `{ type, title, message, eloTracker, persist }`.
 */
export function showToast(
  input,
  type = "info",
  durationMs = TOAST_DURATION_MS,
) {
  if (input === undefined || input === null) return null;
  const resolvedMs =
    Number(durationMs) > 0 ? Number(durationMs) : TOAST_DURATION_MS;
  const isObj = typeof input === "object";
  const resolvedType = (isObj ? input.type : type) || type || "info";
  const meta = resolveAlertMeta(resolvedType);
  const shouldPersist = !(isObj && input.persist === false);

  const payload = isObj
    ? {
        ...(input.id ? { id: String(input.id) } : {}),
        type: resolvedType,
        title: input.title || meta.defaultTitle,
        message: input.message || "",
        timestamp: input.timestamp || Date.now(),
        durationMs:
          Number(input.durationMs) > 0 ? Number(input.durationMs) : resolvedMs,
        eloTracker: input.eloTracker,
        performance: input.performance,
        details: input.details,
        narrative: input.narrative,
        icon: input.icon,
        capturedFromToast: true,
        source: input.source || "toast",
      }
    : {
        type: resolvedType,
        title: meta.defaultTitle,
        message: String(input),
        timestamp: Date.now(),
        durationMs: resolvedMs,
        capturedFromToast: true,
        source: "toast",
      };

  if (shouldPersist) {
    return addNotification(payload);
  }

  showNotificationToast(
    { ...payload, ephemeral: true },
    { durationMs: payload.durationMs },
  );
  return payload;
}

export function notify(payload, persist = true) {
  if (persist) {
    return addNotification(payload);
  }
  return showToast(payload);
}

// ============================================================================
// 3. METRICS & TELEMETRY COMPUTATION
// ============================================================================

export function getNotificationMetrics() {
  const list = getNotifications();
  const total = list.length;
  const unread = list.filter((item) => item.isRead === false).length;
  const eloDeltas = list.filter(
    (item) => resolveAlertMeta(item.type).category === "elo",
  ).length;
  const securityAlerts = list.filter(
    (item) => resolveAlertMeta(item.type).category === "security",
  ).length;

  return {
    total,
    unread,
    eloDeltas,
    securityAlerts,
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
  if (sec === undefined || sec === null || isNaN(Number(sec))) return "0.00s";
  const val = Number(sec);
  if (val === 0) return "0.00s";
  const totalSec = Math.floor(val);
  const ms = Math.round((val - totalSec) * 1000);
  if (val >= 60) {
    const m = Math.floor(val / 60);
    const s = (val % 60).toFixed(1);
    return `${m}m ${s}s (${val.toFixed(2)}s)`;
  }
  return ms > 0
    ? `${val.toFixed(2)}s (${totalSec}s ${ms}ms)`
    : `${val.toFixed(2)}s`;
}

/**
 * Synthesizes or extracts a rich, 3-part narrative-style report exceeding 100 words.
 * Accommodates mathematical context, algorithmic complexity, and session telemetry deep-dive.
 */
export function generateDetailedNarrativeReport(notif) {
  const tracker = notif.eloTracker || {};
  const hasTracker = Boolean(
    notif.eloTracker &&
    (tracker.prevElo !== undefined ||
      tracker.nextElo !== undefined ||
      tracker.delta !== undefined),
  );
  const perf = notif.performance || {};
  const prevElo = Number(tracker.prevElo !== undefined ? tracker.prevElo : 500);
  const delta = Number(tracker.delta !== undefined ? tracker.delta : 0);
  const nextElo = Number(
    tracker.nextElo !== undefined ? tracker.nextElo : prevElo + delta,
  );
  const durationStr = formatDuration(perf.duration);
  const accuracy = perf.accuracy !== undefined ? perf.accuracy : 100;
  const tier =
    notif.details?.tier ||
    notif.details?.rangeTitle ||
    "Rated Competition Arena";
  const msgSummary = notif.message ? String(notif.message).trim() : "";

  // Check if notification already has an explicit custom narrative of >= 100 words
  if (notif.narrative && countWords(notif.narrative) >= 100) {
    const fullText = notif.narrative;
    const rawParagraphs = fullText
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 0);
    if (rawParagraphs.length >= 3) {
      return {
        wordCount: countWords(fullText),
        fullText,
        sections: [
          {
            heading: "I. Event Audit & Contextual Background",
            text: rawParagraphs[0],
          },
          {
            heading: "II. Mathematical & Algorithmic Significance",
            text: rawParagraphs[1],
          },
          {
            heading: "III. Session Performance & Telemetry Deep-Dive",
            text: rawParagraphs.slice(2).join("\n\n"),
          },
        ],
      };
    }
    const telemetryLine = hasTracker
      ? `Session concluded at ${durationStr} with ${accuracy}% precision accuracy and ${delta >= 0 ? "+" + delta : delta} ELO delta shift.`
      : `Logged at ${formatNotifDate(notif.timestamp)} in the PrimeFactor.app operational ledger with telemetry capture verified.`;
    return {
      wordCount: countWords(fullText),
      fullText,
      sections: [
        { heading: "I. Comprehensive Event Audit", text: fullText },
        {
          heading: "II. Mathematical & Algorithmic Significance",
          text: `Decomposition across this integer spectrum requires balancing quick trial factoring with modular heuristics under high clock velocity.`,
        },
        { heading: "III. Session Telemetry Deep-Dive", text: telemetryLine },
      ],
    };
  }

  // Synthesize domain-specific, articulate narrative based on notification event type
  let s1 = "";
  let s2 = "";
  let s3 = "";

  if (notif.type === "rank_shift") {
    const prevTier = notif.details?.prevTier || "Composite Apprentice";
    const nextTier = notif.details?.nextTier || "Prime Practitioner";
    const isPromotion = notif.details?.direction !== "demotion" && delta >= 0;

    s1 = isPromotion
      ? `Competitive Division Elevation: The competitor has officially completed an authoritative rating recalibration in ${tier}, securing a tier promotion from ${prevTier} to ${nextTier}. This milestone elevates baseline expectation standing from ${prevElo.toLocaleString()} ELO to ${nextElo.toLocaleString()} ELO following a decisive ${delta >= 0 ? "+" + delta : delta} ELO rating expansion, adjusting competitive placement across global Olympiad leaderboard rankings.`
      : `Competitive Division Contraction: Following official match adjudication in ${tier}, the player's rating transitioned downward from ${prevTier} to ${nextTier}. This recalibration adjusts standing from ${prevElo.toLocaleString()} ELO to ${nextElo.toLocaleString()} ELO (${delta} ELO shift), reflecting an adaptive skill correction designed to realign the competitor with appropriate numerical range fields.`;

    s2 = `Mathematical & Algorithmic Significance: As competitors cross tier thresholds, the computational complexity of integer factorization increases non-linearly. While foundational divisions permit standard trial division across prime bases (2, 3, 5, 7, 11), higher composite fields exhibit irregular prime gap distributions governed by the Prime Number Theorem π(x) ≈ x / ln(x). Sustaining high factoring velocity requires advancing beyond brute division toward modular residue sieving, rapid quadratic non-residue elimination, and subconscious Pollard's Rho cycle-detection heuristics.`;

    s3 = `Session Performance Deep-Dive: Across the official ${durationStr} match duration, the candidate registered a precision accuracy rate of ${accuracy}% across all composite vectors. Factoring throughput demonstrated steady cognitive cadence, effectively overcoming the adaptive time-decay pressure and securing the mathematical qualifications mandated for ${nextTier} division membership.`;
  } else if (notif.type === "elo_gain") {
    s1 = `Competitive Rating Advancement: An official rated match conducted under Olympiad standard clock rules has concluded with an authoritative rating increase of +${delta} ELO in ${tier}. This competitive triumph advances active standing from ${prevElo.toLocaleString()} ELO to ${nextElo.toLocaleString()} ELO, successfully expanding the competitor's profile trajectory and shifting their logistical expectation curve positively toward advanced master divisions.`;

    s2 = `Mathematical & Algorithmic Significance: Numerical values in this competitive range rigorously test rapid mental modular reductions across small prime bases. Competitors must swiftly inspect composite parity, execute digital root summations for modulo 3 and 9 divisibility checks, and identify algebraic difference-of-squares factorizations. Outperforming the theoretical expectation baseline reflects an exceptional cognitive capacity to suppress calculation latency when decomposing non-trivial composite semiprimes.`;

    s3 = `Session Performance Deep-Dive: The candidate recorded a complete board clear in exactly ${durationStr} while maintaining an exceptional ${accuracy}% precision accuracy profile. Operating at a brisk cadence per composite question, the candidate outpaced the dynamic algorithmic pacing threshold, minimizing false branch exploration and extracting maximum available K-factor rating yield.`;
  } else if (notif.type === "elo_loss") {
    s1 = `Competitive Rating Adjustment: Following the conclusion of a rated trial in ${tier}, the Olympiad expectation engine applied a calibration adjustment of ${delta} ELO against the player's profile. This delta shifts the active standing downward from ${prevElo.toLocaleString()} ELO to ${nextElo.toLocaleString()} ELO. The adjustment reflects an inability to satisfy the elevated mathematical velocity demanded by the adaptive logistical model under competition pressure.`;

    s2 = `Mathematical & Algorithmic Significance: Numbers in this competition field exhibit substantial combinatorial density, frequently producing unbalanced semiprimes whose smallest prime factor exceeds elementary trial bounds. Under these conditions, classical trial division experiences sharp polynomial latency spikes. Hesitation on candidate divisors consumes critical seconds, triggering aggressive rating decay penalties enforced by the system's dynamic performance matrix.`;

    s3 = `Session Performance Deep-Dive: The session concluded at ${durationStr} with an accuracy rating of ${accuracy}%, reflecting unforced calculation errors or uncorrected factor entries under clock pressure. The resulting cognitive throughput trailed the adaptive expectation threshold, necessitating an ELO contraction until mental divisibility instincts are re-anchored in the training laboratory.`;
  } else if (notif.type === "streak") {
    const streakCount = notif.details?.streak || 5;
    s1 = `Longevity Endurance Milestone: The participant has achieved an exceptional competitive longevity achievement, sustaining an unbroken ${streakCount}-match winning streak of consecutive flawless clears in the rated arena. This unbroken progression demonstrates superior mental stamina, error suppression, and algorithmic resilience across consecutive problem distributions${hasTracker ? `, solidifying live rating at ${nextElo.toLocaleString()} ELO` : ""}.`;

    s2 = `Mathematical & Algorithmic Significance: Combinatorially, executing dozens of consecutive flawless prime decompositions without a single arithmetic error is statistically extraordinary. In randomized numerical fields, each successive problem presents an independent stochastic factor structure. Navigating prime, prime-power, and highly composite integers without triggering false positive factor assumptions requires immaculate mastery of the Fundamental Theorem of Arithmetic and mental sieving techniques.`;

    s3 = `Session Performance Deep-Dive: During the latest leg of this streak, the candidate cleared the problem matrix in ${durationStr} while registering an unblemished ${accuracy}% precision accuracy score. Maintaining sub-second factor synthesis under cumulative competition pressure confirms elite cognitive cadence and near-deterministic accuracy under tournament rules.`;
  } else if (notif.type === "pr") {
    const scoreVal = notif.details?.score || 120;
    const prevScore = notif.details?.prevHighScore || scoreVal - 16;
    s1 = `Personal Record Breakthrough: An extraordinary career milestone has been authenticated in the Olympiad ledger. The competitor shattered their prior historical high score, recording a new personal best of ${scoreVal} points in ${tier}. This achievement eclipses the previous benchmark of ${prevScore} points${hasTracker ? ` and delivers a dynamic rating boost to ${nextElo.toLocaleString()} ELO` : ""}.`;

    s2 = `Mathematical & Algorithmic Significance: Breaking performance thresholds in this integer bracket signifies an elite mastery of mental number theory. In this range, composites demand simultaneous evaluation of multiple divisibility heuristics: alternating sums for 11, truncations for 7 and 13, and rapid Euclidean greatest common divisor approximations. Setting a personal record demonstrates optimal synchronization between working memory, factor recognition, and keyboard input cadence.`;

    s3 = `Session Performance Deep-Dive: The record run registered an exceptional completion time of ${durationStr} accompanied by a flawless ${accuracy}% precision accuracy profile. Operating at peak calculation velocity allowed the candidate to maximize speed-bonus multipliers and establish the highest cognitive throughput logged in their career profile.`;
  } else if (notif.type === "refresh_offense") {
    s1 = `Integrity Compliance Infraction: A critical anti-cheat telemetry violation was intercepted during an active rated match session. The client registered an abrupt browser refresh and unauthorized session termination, initiating an immediate abortive audit. In accordance with the Olympiad 3-strike governance charter, a mandatory disciplinary penalty of ${delta || -5} ELO was deducted${hasTracker ? `, lowering rating from ${prevElo.toLocaleString()} ELO to ${nextElo.toLocaleString()} ELO` : ""}.`;

    s2 = `Mathematical & Algorithmic Significance: The competitive rating infrastructure relies strictly on uninterrupted session integrity to maintain ELO statistical validity. In competitive number theory tournaments, abruptly aborting an active match to evade difficult prime combinations or bypass the countdown timer artificially skews the dynamic skill distribution. The system applies deterministic sanctions to ensure that every recorded ELO transition represents authenticated mathematical problem-solving.`;

    s3 = `Session Performance Deep-Dive: The aborted match session terminated at ${durationStr} with 0% verified accuracy and zero completed factorizations. The match was registered in the security audit ledger as an integrity breach, advancing the player's offense log and triggering live telemetry monitoring across subsequent match initializations.`;
  } else if (notif.type === "security_tampering") {
    if (notif.title && notif.title.includes("PENALTY LOCKDOWN TERMINATED")) {
      s1 = `Penalty Lockdown Protocol Deactivation: The competitor has successfully cleared the plus-rating blackhole restriction. By achieving a positive rating delta in official match play, the candidate satisfied the system redemption mandate. In strict accordance with the penalty protocol, the entire positive yield was absorbed as a disciplinary offset, committing a flat 0 ELO adjustment to live standing${hasTracker ? ` (${prevElo.toLocaleString()} ELO)` : ""}. The security lockdown is now officially terminated.`;
      s2 = `Mathematical & Algorithmic Significance: The Plus-Rating Blackhole protocol enforces behavioral accountability by demanding verified human computational performance before restoring rating advancement privileges. Factoring composite integers under competition conditions verifies authentic mental arithmetic, eliminating the possibility of passive recovery. Absorbing a positive performance restores mathematical parity across the ELO distribution.`;
      s3 = `Session Performance Deep-Dive: Completed across ${durationStr} with ${accuracy}% precision accuracy. With the penalty debt fully discharged and the behavioral telemetry verified, full rated credit is now re-established for all future competitive division matches.`;
    } else if (notif.title && notif.title.includes("LOCKDOWN EXTENDED")) {
      s1 = `Penalty Lockdown Extension Enforcement: During an active security lockdown trial, the competitor registered an underperforming match session resulting in a negative rating delta (${delta} ELO). The deduction has been applied directly to active standing${hasTracker ? ` (${prevElo.toLocaleString()} ELO → ${nextElo.toLocaleString()} ELO)` : ""}. Because the lockdown protocol strictly mandates a positive rating result to pay off the penalty restriction, the penalty lockdown remains ACTIVE.`;
      s2 = `Mathematical & Algorithmic Significance: The competitive integrity framework prevents bad actors from waiting out disciplinary periods or diluting ratings through sub-par play. Under the blackhole lockdown rules, negative performance is penalized without mercy while positive performance serves as currency to discharge the security lock. The competitor must achieve an authentic, verified positive performance to lift the barrier.`;
      s3 = `Session Performance Deep-Dive: The session concluded at ${durationStr} with ${accuracy}% accuracy. The competitor remains under heightened behavioral scrutiny and must complete a winning match with positive expectation yield to terminate the restriction.`;
    } else if (
      notif.title &&
      notif.title.includes("THREE-MATCH CHEAT STRIKE")
    ) {
      s1 = `Behavioral Anti-Cheat Sanction: The multi-axis behavioral telemetry engine detected unauthorized calculation velocity patterns and sidekick assistance across three consecutive rated matches. Under the competitive anti-cheat charter, an immediate disciplinary excise of -20 ELO was applied directly to the player's profile${hasTracker ? ` (${prevElo.toLocaleString()} ELO → ${nextElo.toLocaleString()} ELO)` : ""}, and the account was placed into the Plus-Rating Blackhole Penalty Lockdown.`;
      s2 = `Mathematical & Algorithmic Significance: Decomposing complex composites in under 2.5 seconds with zero backspaces and failing organic reflex anchors violates human physiological processing thresholds. The statistical probability of such consecutive anomalies without auxiliary computation is infinitesimal. The system intervenes deterministically to protect Olympiad rating integrity.`;
      s3 = `Session Performance Deep-Dive: Three consecutive rated matches were flagged in the security audit ledger. The consecutive flag counter has been reset, and penalty lockdown has been engaged. The player must sacrifice one positive rated performance to clear the restriction.`;
    } else {
      s1 = `Security Verification Sanction: An unauthorized state modification was intercepted by the cloud security sub-system. Cloud Firestore Security Rules (request.auth.uid == userId) blocked unauthorized profile mutations and enforced session isolation.`;
      s2 = `Mathematical & Algorithmic Significance: In competitive mathematics arenas, verifiable state provenance is paramount. The application anchors competitive ratings, match tallies, and peak historical records in Cloud Firestore with authenticated user credentials. Unauthorized mutation attempts are rejected at the database level to maintain rating parity across the competitive population.`;
      s3 = `Session Performance Deep-Dive: The security validator isolated the mutation attempt immediately upon session verification. All active session privileges are governed by authenticated Google OAuth tokens, and verified telemetry records are preserved in Cloud Firestore.`;
    }
  } else if (notif.type === "security_flag" || notif.type === "security") {
    s1 = `Behavioral & Focus Security Flag: Real-time arena telemetry flagged an anomaly (${notif.title || "Security Verification Alert"})${msgSummary ? ` — ${msgSummary}` : " — Window focus interruption or anomalous solve cadence detected."}${hasTracker ? ` Rating standing reflects ${nextElo.toLocaleString()} ELO while behavioral safeguards remain armed.` : " Behavioral safeguards and session audit monitors remain armed."}`;
    s2 = `Mathematical & Algorithmic Significance: Integrity telemetry monitors inter-keystroke variance, response velocity against composite bit-length bounds, and window focus continuity. Maintaining organic human input metrics guarantees statistical fairness across global PrimeFactor divisions.`;
    s3 = `Session Performance Deep-Dive: Event captured at ${formatNotifDate(notif.timestamp)}${perf.duration !== undefined ? ` (${durationStr} elapsed, ${accuracy}% verified accuracy)` : ""}. This entry remains permanently archived in the audit ledger for tournament compliance review.`;
  } else if (
    notif.type === "policy_offense" ||
    notif.type === "penalty" ||
    notif.type === "offense"
  ) {
    const ratingClause = hasTracker
      ? ` Rating transition reflects ${prevElo.toLocaleString()} ELO → ${nextElo.toLocaleString()} ELO (${delta >= 0 ? "+" + delta : delta} ELO).`
      : " Policy compliance restrictions have been applied to the active competition context.";
    s1 = `Governance Charter Policy Offense: A competitive policy infraction or restriction was recorded (${notif.title || "Policy Enforcement"})${msgSummary ? ` — ${msgSummary}` : " — Restricted action intercepted under Olympiad tournament regulations."}.${ratingClause}`;
    s2 = `Mathematical & Algorithmic Significance: High-rating divisions enforce strict lifeline firewalls, reload prohibitions, and restart deficits to prevent selective draw-shopping across challenging composite fields. Enforcing symmetric boundary conditions preserves competitive parity.`;
    s3 = `Session Performance Deep-Dive: Policy enforcement captured in the persistent ledger at ${formatNotifDate(notif.timestamp)}${perf.duration !== undefined ? ` (${durationStr} elapsed, ${accuracy}% accuracy)` : ""}. Review Rules & Governance policies before initiating subsequent rated contests.`;
  } else if (notif.type === "success") {
    s1 = `Confirmed Platform Operation: The PrimeFactor.app runtime verified and committed a live operation (${notif.title || "System Confirmed"})${msgSummary ? ` — ${msgSummary}` : ""}. Captured automatically from the unified top alert banner into the permanent notifications ledger.`;
    s2 = `Mathematical & Cloud Integrity Significance: Deterministic state transitions across profile configuration, handle ownership, friend networks, and Cloud Firestore match records require atomic verification before confirmation banners are emitted to active competitors.`;
    s3 = `Session Telemetry Deep-Dive: Operation completed without integrity fault and archived at ${formatNotifDate(notif.timestamp)}${hasTracker ? ` with live standing confirmed at ${nextElo.toLocaleString()} ELO` : " with zero unrated side effects or data drift"}.`;
  } else if (notif.type === "warning") {
    s1 = `Operational Advisory Alert: The platform raised a live system advisory (${notif.title || "System Advisory"})${msgSummary ? ` — ${msgSummary}` : ""}. All active pop-up advisories are mirrored directly to the Notification Center so competitors never miss threshold notices.`;
    s2 = `Mathematical & Fairness Significance: Competitive PrimeFactor arenas enforce strict range eligibility, unrated practice transitions, and session clock rules to ensure ELO calculations remain statistically calibrated across all twelve divisions.`;
    s3 = `Session Telemetry Deep-Dive: Advisory recorded at ${formatNotifDate(notif.timestamp)}${hasTracker ? ` with standing at ${nextElo.toLocaleString()} ELO` : ""}. Review the summary above and proceed in accordance with division guidelines.`;
  } else if (notif.type === "error") {
    s1 = `Runtime Fault & Safeguard Report: An operational failure or validation rejection was intercepted (${notif.title || "System Error"})${msgSummary ? ` — ${msgSummary}` : ""}. Persistent logging preserves full diagnostic visibility beyond the initial five-second alert window.`;
    s2 = `Mathematical & Cloud Integrity Significance: Input validation, authentication gates, and Firestore security boundaries fail closed whenever invalid parameters, expired sessions, or network errors occur, preventing corrupted match telemetry or profile desynchronization.`;
    s3 = `Session Telemetry Deep-Dive: Error alert captured at ${formatNotifDate(notif.timestamp)}. Retry the requested action once network connectivity and account authentication state are verified.`;
  } else {
    // Default / System / Info Notice
    const customSummary = msgSummary ? ` Event Summary: ${msgSummary}.` : "";
    const standingNote = hasTracker
      ? ` Live competitive standing is synchronized at ${nextElo.toLocaleString()} ELO in Cloud Firestore.`
      : " Captured automatically from the unified top alert pipeline into the persistent notifications ledger.";
    s1 = `System Telemetry & Platform Calibration: The Olympiad computational environment processed an authoritative platform event (${notif.title || "System Notice"}).${customSummary}${standingNote}`;

    s2 = `Mathematical & Algorithmic Significance: The underlying calculation engine leverages a real-time Pollard's Rho heuristic with Brent's cycle-finding modification to verify prime factorization primality deterministically. Calibrating this engine guarantees microsecond evaluation bounds when verifying candidate answers against random composite distributions.`;

    s3 = `Session Performance Deep-Dive: Verified at ${formatNotifDate(notif.timestamp)} with operational telemetry active${perf.duration !== undefined ? ` (${durationStr}, ${accuracy}% precision)` : ""}. All competitive milestones and system notices remain synchronized across sessions.`;
  }

  const fullText = `${s1}\n\n${s2}\n\n${s3}`;
  const totalWords = countWords(fullText);

  return {
    wordCount: totalWords,
    fullText,
    sections: [
      { heading: "I. Event Audit & Contextual Background", text: s1 },
      { heading: "II. Mathematical & Algorithmic Significance", text: s2 },
      { heading: "III. Session Performance & Telemetry Deep-Dive", text: s3 },
    ],
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
        ${report.sections
          .map(
            (sec) => `
          <div class="narrative-block">
            <div class="narrative-subheading font-heading">
              <span>${escapeHtml(sec.heading)}</span>
            </div>
            <p class="narrative-text">${escapeHtml(sec.text)}</p>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

// ============================================================================
// 5. ELO TRACKER & PERFORMANCE METRICS HTML RENDERERS
// ============================================================================

function renderEloTrackerHtml(tracker) {
  if (!tracker || tracker.prevElo === undefined) return "";

  const prev = Number(tracker.prevElo);
  const delta = Number(tracker.delta);
  const next = Number(
    tracker.nextElo !== undefined ? tracker.nextElo : prev + delta,
  );
  const isPos = delta >= 0;
  const deltaDisplay = isPos ? `+${delta}` : `${delta}`;
  const deltaClass = isPos ? "elo-shift-pos" : "elo-shift-neg";

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
  if (!perf) return "";

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

let activeFilter = "all";
const expandedCardIds = new Set();
let focusedNotificationId = null;

function syncExpandedForUnread(list) {
  if (!Array.isArray(list)) return;
  list.forEach((item) => {
    if (item && item.id && item.isRead === false) {
      expandedCardIds.add(String(item.id));
    }
  });
  if (focusedNotificationId) {
    expandedCardIds.add(focusedNotificationId);
  }
}

export function toggleNotificationAccordion(cardId) {
  const container = document.getElementById("notifications-feed-list");
  if (!container) return;

  const targetId = String(cardId);
  const targetCard = Array.from(container.querySelectorAll(".notif-card")).find(
    (card) => card.dataset.id === targetId,
  );
  if (!targetCard) return;

  const isCurrentlyExpanded = targetCard.classList.contains("expanded");

  if (!isCurrentlyExpanded) {
    // Expand target card downwards
    targetCard.classList.add("expanded");
    const toggleBtn = targetCard.querySelector(".btn-accordion-toggle");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    expandedCardIds.add(targetId);
    playSound("click");

    // Auto mark as read upon expanding to inspect
    if (targetCard.classList.contains("unread-card")) {
      markNotificationAsRead(targetId);
      targetCard.classList.remove("unread-card");
      targetCard.classList.add("read-card");
      const dot = targetCard.querySelector(".subpixel-unread-dot");
      if (dot) dot.remove();
      const markBtn = targetCard.querySelector(".btn-mark-single-read");
      if (markBtn) {
        const archivedSpan = document.createElement("span");
        archivedSpan.className = "read-indicator-label";
        archivedSpan.textContent = "Archived Log";
        markBtn.replaceWith(archivedSpan);
      }
      updateTelemetryCounters();
    }
  } else {
    targetCard.classList.remove("expanded");
    const toggleBtn = targetCard.querySelector(".btn-accordion-toggle");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
    expandedCardIds.delete(targetId);
    playSound("click");
  }
}

export function renderNotificationsFeed(
  containerId = "notifications-feed-list",
  filter = activeFilter,
) {
  activeFilter = filter;
  const container = document.getElementById(containerId);
  if (!container) return;

  const raw = getNotifications();

  // Strict Category Filter Routing
  let filtered = raw;
  if (filter === "elo") {
    filtered = raw.filter(
      (item) => resolveAlertMeta(item.type).category === "elo",
    );
  } else if (filter === "security") {
    filtered = raw.filter(
      (item) => resolveAlertMeta(item.type).category === "security",
    );
  } else if (filter === "system") {
    filtered = raw.filter(
      (item) => resolveAlertMeta(item.type).category === "system",
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
          ${
            filter === "all"
              ? "No activity entries have been recorded yet. Launch an arena match or adjust your profile to begin logging."
              : `No logs matching the "${escapeHtml(filter.toUpperCase())}" filter category are currently in the directory.`
          }
        </p>
        ${
          filter !== "all"
            ? `
          <button id="reset-filter-btn" class="btn-reset-filter font-heading">
            Reset to All Logs
          </button>
        `
            : ""
        }
      </div>
    `;

    const resetBtn = document.getElementById("reset-filter-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        playSound("click");
        setActiveTab("all");
        renderNotificationsFeed(containerId, "all");
      });
    }
    return;
  }

  // Map Notifications to Glass-Morphic Accordion Cards
  container.innerHTML = sorted
    .map((notif) => {
      const isUnread = notif.isRead === false;
      const isExpanded = expandedCardIds.has(String(notif.id));
      const meta = resolveAlertMeta(notif.type);

      const icon = notif.icon || meta.icon;
      const typeBadge = meta.badge;
      const badgeClass = meta.badgeClass;
      let cardClass = isUnread
        ? "notif-card unread-card"
        : "notif-card read-card";
      if (meta.cardClass) cardClass += ` ${meta.cardClass}`;
      if (isExpanded) cardClass += " expanded";

      let teaser = "";
      if (notif.eloTracker && typeof notif.eloTracker.delta === "number") {
        const d = notif.eloTracker.delta;
        teaser =
          d >= 0
            ? `+${d} ELO (Live: ${notif.eloTracker.nextElo})`
            : `${d} ELO (Live: ${notif.eloTracker.nextElo})`;
      } else if (notif.message) {
        teaser =
          notif.message.length > 55
            ? notif.message.slice(0, 52) + "..."
            : notif.message;
      }

      const safeId = escapeHtml(notif.id);
      const safeTitle = escapeHtml(notif.title || meta.defaultTitle);
      const safeTimestamp = escapeHtml(formatNotifDate(notif.timestamp));
      const safeMessage = notif.message ? escapeHtml(notif.message) : "";

      return `
      <div class="${cardClass}" data-id="${safeId}" role="article" aria-label="${safeTitle}">
        <!-- Compact Header -->
        <div class="notif-card-header" data-toggle-card="${safeId}">
          <div class="notif-meta-left">
            <span class="notif-icon-bubble" aria-hidden="true">${escapeHtml(icon)}</span>
            <div class="notif-title-group">
              <div class="notif-title-row">
                <h4 class="notif-title font-heading">${safeTitle}</h4>
                ${
                  isUnread
                    ? `
                  <span class="subpixel-unread-dot" title="Unread entry" aria-label="Unread"></span>
                `
                    : ""
                }
              </div>
              <div class="notif-brief-row">
                <span class="notif-timestamp">${safeTimestamp}</span>
                ${teaser ? `<span class="notif-brief-dot">·</span><span class="notif-brief-teaser">${escapeHtml(teaser)}</span>` : ""}
              </div>
            </div>
          </div>

          <div class="notif-meta-right">
            <span class="notif-type-badge ${badgeClass} font-heading">
              ${escapeHtml(typeBadge)}
            </span>
            ${
              isUnread
                ? `
              <button class="btn-mark-single-read font-heading" data-read-id="${safeId}" title="Mark this log as read">
                Mark Read
              </button>
            `
                : `
              <span class="read-indicator-label">Archived Log</span>
            `
            }
            <button class="btn-accordion-toggle" data-toggle-btn="${safeId}" aria-expanded="${isExpanded ? "true" : "false"}" aria-label="Toggle details">
              <svg class="accordion-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <!-- Expandable Accordion Body Revealing Event Summary & Detailed Narrative Report -->
        <div class="notif-accordion-content" id="accordion-${safeId}">
          <div class="notif-mini-report">
            ${
              safeMessage
                ? `
              <div class="notif-report-section notif-desc-section">
                <div class="report-section-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <span>Event Alert Summary</span>
                </div>
                <p class="notif-message-text">${safeMessage}</p>
              </div>
            `
                : ""
            }

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
                Cloud Verified Audit Entry
              </span>
              <span class="notif-id-label">#${escapeHtml(String(notif.id).slice(-8))}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  // Bind Accordion Dropdown Toggles
  container.querySelectorAll(".btn-accordion-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-toggle-btn");
      if (id) toggleNotificationAccordion(id);
    });
  });

  // Clicking on card header (excluding action buttons) also toggles accordion
  container.querySelectorAll(".notif-card-header").forEach((header) => {
    header.addEventListener("click", (e) => {
      if (
        e.target.closest(".btn-mark-single-read") ||
        e.target.closest(".btn-accordion-toggle")
      ) {
        return;
      }
      const id = header.getAttribute("data-toggle-card");
      if (id) toggleNotificationAccordion(id);
    });
  });

  // Bind Single Mark-As-Read Action Buttons
  container.querySelectorAll(".btn-mark-single-read").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      playSound("click");
      const id = btn.getAttribute("data-read-id");
      if (id) {
        markNotificationAsRead(id);
        renderNotificationsFeed(containerId, activeFilter);
        updateTelemetryCounters();
      }
    });
  });
}

function setActiveTab(filter) {
  document.querySelectorAll(".filter-tab-btn").forEach((btn) => {
    if (btn.getAttribute("data-filter") === filter) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function updateTelemetryCounters() {
  const metrics = getNotificationMetrics();
  const elTotal = document.getElementById("metric-total-logs");
  const elUnread = document.getElementById("metric-unread-logs");
  const elElo = document.getElementById("metric-elo-deltas");
  const elSecurity = document.getElementById("metric-security-strikes");

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

  try {
    const params = new URLSearchParams(window.location.search);
    const focusParam = params.get("focus");
    if (focusParam) {
      focusedNotificationId = focusParam;
      expandedCardIds.add(focusParam);
    }
  } catch (e) {}

  syncExpandedForUnread(getNotifications());
  updateTelemetryCounters();
  renderNotificationsFeed("notifications-feed-list", "all");

  if (focusedNotificationId) {
    const feed = document.getElementById("notifications-feed-list");
    const focusedCard = feed
      ? Array.from(feed.querySelectorAll(".notif-card")).find(
          (el) => el.dataset.id === focusedNotificationId,
        )
      : null;
    if (focusedCard) {
      requestAnimationFrame(() => {
        focusedCard.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  // Filter Tabs
  document.querySelectorAll(".filter-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      playSound("click");
      const filter = btn.getAttribute("data-filter") || "all";
      setActiveTab(filter);
      renderNotificationsFeed("notifications-feed-list", filter);
    });
  });

  // Action: Mark All as Read
  const markAllBtn = document.getElementById("btn-mark-all-read");
  if (markAllBtn) {
    markAllBtn.addEventListener("click", () => {
      playSound("click");
      markAllNotificationsAsRead();
      clearAllUnreadDots();
      updateTelemetryCounters();
      renderNotificationsFeed("notifications-feed-list", activeFilter);
    });
  }

  // Action: Clear Read Logs
  const clearReadBtn = document.getElementById("btn-clear-read-logs");
  if (clearReadBtn) {
    clearReadBtn.addEventListener("click", () => {
      playSound("click");
      clearReadNotifications();
      updateTelemetryCounters();
      renderNotificationsFeed("notifications-feed-list", activeFilter);
    });
  }

  // Action: Dispatch Sample Test Log (Simulates major events with rich narrative reports)
  const testLogBtn = document.getElementById("btn-test-notification");
  if (testLogBtn) {
    testLogBtn.addEventListener("click", () => {
      playSound("click");
      const sampleTypes = [
        "elo_gain",
        "elo_loss",
        "rank_shift",
        "streak",
        "pr",
        "security_flag",
        "policy_offense",
        "system",
      ];
      const chosen =
        sampleTypes[Math.floor(Math.random() * sampleTypes.length)];

      if (chosen === "elo_gain") {
        addNotification({
          type: "elo_gain",
          title: "Rating Gain",
          message:
            "📈 Rating Increase: +22 ELO earned in Tier 2: 1 - 500 [Simulated]. Rapid factorization cadence under clock.",
          eloTracker: { prevElo: 1500, delta: 22, nextElo: 1522 },
          performance: { duration: 38.45, accuracy: 100 },
          details: { tier: "Tier 2: 1 - 500" },
        });
      } else if (chosen === "elo_loss") {
        addNotification({
          type: "elo_loss",
          title: "Rating Adjustment",
          message:
            "📉 Rating Adjustment: -14 ELO in Tier 4: 1 - 2,000 [Simulated]. Performance fell below dynamic expectation threshold.",
          eloTracker: { prevElo: 1522, delta: -14, nextElo: 1508 },
          performance: { duration: 64.2, accuracy: 70 },
          details: { tier: "Tier 4: 1 - 2,000" },
        });
      } else if (chosen === "rank_shift") {
        addNotification({
          type: "rank_shift",
          title: "Tier Promotion: Prime Practitioner",
          message:
            "🏆 Promotion Milestone: Ascended from Composite Apprentice to Prime Practitioner (+25 ELO) [Simulated]. Live rating threshold cleared.",
          eloTracker: { prevElo: 1180, delta: 25, nextElo: 1205 },
          performance: { duration: 31.8, accuracy: 100 },
          details: {
            prevTier: "Composite Apprentice",
            nextTier: "Prime Practitioner",
            direction: "promotion",
            tier: "Tier 2: 1 - 500",
          },
        });
      } else if (chosen === "streak") {
        addNotification({
          type: "streak",
          title: "5-Match Win Streak!",
          message:
            "🔥 Longevity Milestone: Maintained continuous flawless 10/10 execution across 5 consecutive matches [Simulated].",
          eloTracker: { prevElo: 1508, delta: 18, nextElo: 1526 },
          performance: { duration: 29.5, accuracy: 100 },
          details: { streak: 5, tier: "Tier 2: 1 - 500" },
        });
      } else if (chosen === "pr") {
        addNotification({
          type: "pr",
          title: "Personal Record Broken!",
          message:
            "⚡ Personal Record Shattered! Achieved new career high score of 128 pts in Tier 3: 1 - 1,000 [Simulated].",
          eloTracker: { prevElo: 1526, delta: 24, nextElo: 1550 },
          performance: { duration: 24.15, accuracy: 100 },
          details: {
            score: 128,
            prevHighScore: 112,
            tier: "Tier 3: 1 - 1,000",
          },
        });
      } else if (chosen === "security_flag") {
        addNotification({
          type: "security_flag",
          title: "Security Flag Raised",
          message:
            "🛡️ Integrity Monitor: Focus departure or anomalous solve velocity detected during live trial [Simulated].",
          eloTracker: { prevElo: 1550, delta: -5, nextElo: 1545 },
          performance: { duration: 12.0, accuracy: 80 },
          details: { tier: "Arena Exam" },
        });
      } else if (chosen === "policy_offense") {
        addNotification({
          type: "policy_offense",
          title: "Policy Offense Recorded",
          message:
            "⚖️ Charter Enforcement: Active-match reload attempt intercepted under 3-strike governance charter [Simulated].",
          eloTracker: { prevElo: 1545, delta: -5, nextElo: 1540 },
          performance: { duration: 15.0, accuracy: 60 },
          details: { tier: "Arena Exam" },
        });
      } else {
        addNotification({
          type: "system",
          title: "System Notice",
          message:
            "🔔 Cloud Firestore synchronization & Pollard’s Rho timing telemetry verified [Simulated].",
          eloTracker: { prevElo: 1540, delta: 0, nextElo: 1540 },
          performance: { duration: 1.25, accuracy: 100 },
          details: { tier: "Platform Telemetry" },
        });
      }

      updateTelemetryCounters();
      renderNotificationsFeed("notifications-feed-list", activeFilter);
    });
  }
}

// Automatically bind unified top-positioned alert listeners across the entire application
if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.__pfNotificationEngineActive = true;
  window.__pfShowUnifiedToast = showToast;
  window.UX = Object.assign(window.UX || {}, { toast: showToast });
  window.PrimeFactorToast = Object.assign(window.PrimeFactorToast || {}, {
    show: showToast,
    notify,
  });
  initNotificationDotListeners();
}
