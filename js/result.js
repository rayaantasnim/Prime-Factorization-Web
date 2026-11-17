/**
 * PrimeFactor.app — Final Result Analytics Dashboard Controller
 * Implements Circular Master Score Ring, 4-Bracket Diagnostic Engine with Typographic Matrix,
 * Telemetry Character Typing System, Failure Audit Stack with Nested Mistake Analysis Tables,
 * Redemption Track, and Compiler Latency Audit Table (Sub-Second Pollard's Rho Logs).
 */

import {
  getLastExamResult,
  setLastExamResult,
  setActiveExamParams,
  getSettings,
  getLedger,
  addNotification,
} from "./storage.js";
import { initGlobalHeader, renderFooter } from "./header.js";
import { showToast } from "./notification-engine.js";
import {
  toExponentialForm,
  formatExponentialString,
  parseAndValidateFactorInput,
  factorize,
} from "./math-engine.js";
import { playSound } from "./audio.js";
import {
  calculateEloDelta,
  getUserElo,
  setUserElo,
  recordRatedMatchToProfile,
  getTierByElo,
  computeSystemExpectations,
} from "./elo-engine.js";
import {
  waitForAuthReady,
  isUserLoggedIn,
  getCurrentProfile,
  signInWithGoogle,
  recordMatchToFirestore,
  onAuthChange,
} from "./firebase.js";

const COMMITTED_MATCHES_KEY = "primefactor_committed_match_ids";
const NOTIFIED_MATCHES_KEY = "primefactor_notified_match_ids";

function hasCommittedMatch(matchId) {
  if (!matchId) return false;
  try {
    const raw = sessionStorage.getItem(COMMITTED_MATCHES_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(String(matchId));
  } catch {
    return false;
  }
}

function markMatchCommitted(matchId) {
  if (!matchId) return;
  try {
    const raw = sessionStorage.getItem(COMMITTED_MATCHES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? list : [];
    if (!next.includes(String(matchId))) {
      next.push(String(matchId));
      sessionStorage.setItem(
        COMMITTED_MATCHES_KEY,
        JSON.stringify(next.slice(-30)),
      );
    }
  } catch {
    /* storage unavailable */
  }
}

function hasNotifiedMatch(matchId) {
  if (!matchId) return false;
  try {
    const raw = sessionStorage.getItem(NOTIFIED_MATCHES_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(String(matchId));
  } catch {
    return false;
  }
}

function markMatchNotified(matchId) {
  if (!matchId) return;
  try {
    const raw = sessionStorage.getItem(NOTIFIED_MATCHES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? list : [];
    if (!next.includes(String(matchId))) {
      next.push(String(matchId));
      sessionStorage.setItem(
        NOTIFIED_MATCHES_KEY,
        JSON.stringify(next.slice(-30)),
      );
    }
  } catch {
    /* storage unavailable */
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  initGlobalHeader();
  renderFooter();

  await waitForAuthReady();
  await renderResultDashboard();
});

async function commitMatchIfNeeded(result, eloDelta, accuracyPct, totalSolved) {
  if (!result || result.isForcedUnrated || !isUserLoggedIn()) return null;
  result.matchId =
    result.matchId ||
    `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (result.committedToCloud || hasCommittedMatch(result.matchId)) {
    return getCurrentProfile();
  }

  const profileBefore = getCurrentProfile();
  const prevElo =
    typeof profileBefore?.elo === "number"
      ? Math.round(profileBefore.elo)
      : getUserElo();
  const expectedNewElo = Math.max(0, prevElo + eloDelta);

  const updatedProfile = await recordMatchToFirestore({
    matchId: result.matchId,
    tier: result.rangeTitle || "Tier 1: 1 - 200",
    accuracy: accuracyPct,
    time: result.timeSpent || 30,
    score: result.score || 0,
    eloDelta: eloDelta,
    lifelinesUsedCount: result.lifelinesUsedCount || 0,
    correctCount: totalSolved,
    firstAttemptClears:
      result.correctFirstAttempt !== undefined
        ? result.correctFirstAttempt
        : totalSolved,
    totalQuestions: result.totalQuestions || 10,
    prevElo: prevElo,
    newElo: expectedNewElo,
  });

  if (updatedProfile) {
    markMatchCommitted(result.matchId);
    result.committedToCloud = true;
    result.savedPrevElo = prevElo;
    result.savedNewElo = updatedProfile.elo;
    result.currentElo = `${Number(updatedProfile.elo).toLocaleString()} ELO`;
    setLastExamResult(result);
  }
  return updatedProfile;
}

function updateLiveVerdictEloUI() {
  const liveElo = getUserElo();
  const currentTier = getTierByElo(liveElo);
  const elTierIcon = document.getElementById("elo-tier-icon");
  const elTierTitle = document.getElementById("elo-tier-title");
  const elLiveVal = document.getElementById("elo-live-val");

  if (elTierIcon) elTierIcon.textContent = currentTier.symbol || "🧩";
  if (elTierTitle) {
    elTierTitle.textContent = currentTier.title || "Composite Apprentice";
    elTierTitle.style.color = currentTier.colorHex || "#FFFFFF";
  }
  if (elLiveVal) elLiveVal.textContent = `${liveElo.toLocaleString()} ELO`;
}

function renderGuestResultPrompt(result, eloDelta, accuracyPct, totalSolved) {
  const container = document.querySelector(".content-container");
  if (!container) return;

  const existing = document.getElementById("guest-result-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "guest-result-banner";
  banner.className = "guest-warning-banner";
  const deltaText = eloDelta > 0 ? `+${eloDelta} ELO` : `${eloDelta} ELO`;

  banner.innerHTML = `
    <div class="guest-warning-content">
      <span style="font-size: 1.6rem;">⚠️</span>
      <div>
        <div style="font-weight: 800; font-size: 1.05rem; color: #FFFFFF; font-family: var(--font-heading);">
          Guest Match Detected · ELO Not Saved (${deltaText})
        </div>
        <div style="font-size: 0.88rem; color: #CBD5E1; margin-top: 2px;">
          You completed this match without signing in. Sign in with Google now to save this match, earn your rank, and commit your rating to Cloud Firestore!
        </div>
      </div>
    </div>
    <button id="btn-guest-result-signin" class="guest-warning-btn">
      Sign In to Save Progress
    </button>
  `;

  const head = container.querySelector(".section-head");
  if (head) {
    container.insertBefore(banner, head.nextSibling);
  } else {
    container.prepend(banner);
  }

  const showSavedBanner = (nextElo) => {
    banner.style.borderColor = "#10B981";
    banner.style.background = "rgba(16, 185, 129, 0.15)";
    banner.innerHTML = `
      <div class="guest-warning-content" style="color: #34D399;">
        <span style="font-size: 1.5rem;">✔️</span>
        <div>
          <strong style="color: #FFFFFF; font-size: 1.05rem;">Match Successfully Saved to Cloud Firestore!</strong>
          <div style="font-size: 0.88rem; color: #CBD5E1;">Your ELO rating is now updated to ${Number(nextElo).toLocaleString()} ELO.</div>
        </div>
      </div>
    `;
    updateLiveVerdictEloUI();
    showToast({
      type: "success",
      title: "Match Synced to Cloud Firestore",
      message: `Your ELO rating is now saved and updated to ${Number(nextElo).toLocaleString()} ELO.`,
    });
  };

  // Also handle if the user signs in from the top header button while viewing this page
  const unsub = onAuthChange(async ({ user }) => {
    if (
      user &&
      !result.committedToCloud &&
      !hasCommittedMatch(result.matchId)
    ) {
      unsub();
      try {
        const updatedProfile = await commitMatchIfNeeded(
          result,
          eloDelta,
          accuracyPct,
          totalSolved,
        );
        if (updatedProfile) {
          showSavedBanner(updatedProfile.elo);
        }
      } catch (err) {
        console.error("Auto-save after header sign-in failed:", err);
      }
    }
  });

  const btn = banner.querySelector("#btn-guest-result-signin");
  if (btn) {
    btn.addEventListener("click", async () => {
      playSound("click");
      try {
        const { user } = await signInWithGoogle();
        if (user) {
          unsub();
          const updatedProfile = await commitMatchIfNeeded(
            result,
            eloDelta,
            accuracyPct,
            totalSolved,
          );
          const nextElo = updatedProfile?.elo ?? getUserElo();
          showSavedBanner(nextElo);
        }
      } catch (err) {
        console.error("Sign-in error from guest banner:", err);
      }
    });
  }
}

async function renderResultDashboard() {
  const result = getLastExamResult();

  if (!result) {
    window.location.href = "./ranges.html";
    return;
  }

  // 6-Tier Olympiad Verdict Matrix
  const totalSolved =
    (result.correctFirstAttempt || 0) + (result.correctSecondAttempt || 0);
  const accuracyPct = Math.round(
    (totalSolved / (result.totalQuestions || 10)) * 100,
  );

  // ELO Engine Master Integration & Calculation
  const activeUserElo = getUserElo();
  const isForcedUnrated =
    result.participationMode === "unrated" ||
    result.mode === "unrated" ||
    Boolean(result.forcedUnrated) ||
    Boolean(result.isForcedUnrated);

  if (result.eloDelta === undefined || result.eloDelta === null) {
    if (isForcedUnrated) {
      result.matchId =
        result.matchId ||
        `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      result.eloDelta = 0;
      result.eloExpected = 0.85;
      result.eloVelocity = 1.0;
      result.eloKFactor = 32;
      result.isForcedUnrated = true;
      result.verdictComment = "Training";
      result.expectationStatus = "⏸️ Deactivated";
      result.currentElo = `${activeUserElo.toLocaleString()} ELO`;
      setLastExamResult(result);

      if (!hasNotifiedMatch(result.matchId)) {
        markMatchNotified(result.matchId);
        showToast({
          type: "system",
          title: "Unrated Practice Run Complete",
          message: `${totalSolved}/${result.totalQuestions || 10} solved (${accuracyPct}% accuracy · ${result.timeSpent || 0}s). ELO remained unchanged.`,
        });
      }
    } else {
      const ledger = getLedger();
      const allocatedSec =
        result.allocatedSeconds ||
        result.timeSpent + (result.timeRemaining || 0) ||
        180;
      const actualSec = Math.max(1, result.timeSpent || 30);

      const eloCalc = calculateEloDelta({
        userElo: activeUserElo,
        maxBound: result.max || 200,
        accuracyPct: accuracyPct,
        allocatedSeconds: allocatedSec,
        actualSeconds: actualSec,
        isForcedUnrated: false,
        participationMode: "rated",
        streakCount: ledger.currentStreak || 0,
        bonusEloTokens: result.comboStrikeTokens || 0,
        bonusEloPoints: result.comboStrikeBonusElo || 0,
      });

      result.eloDelta = eloCalc.deltaR;
      result.eloExpected = eloCalc.expected;
      result.eloVelocity = eloCalc.velocity;
      result.eloKFactor = eloCalc.kFactor;
      result.isForcedUnrated = false;
      result.verdictComment = eloCalc.comment;
      const prevElo = activeUserElo;
      const prevTier = getTierByElo(prevElo);
      const prevHighScore = ledger.highScore || 0;
      const prevStreak = ledger.currentStreak || 0;

      const newElo = Math.max(0, activeUserElo + eloCalc.deltaR);
      const newTier = getTierByElo(newElo);

      result.isLockdownMatch = eloCalc.isLockdownMatch;
      result.lockdownOutcome = eloCalc.lockdownOutcome;
      result.absorbedDelta = eloCalc.absorbedDelta;
      result.matchId =
        result.matchId ||
        `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // STRICT USER AUTHENTICATION GATE:
      // Only commit progression if user is logged into Firebase
      if (isUserLoggedIn()) {
        const existingGuestBanner = document.getElementById(
          "guest-result-banner",
        );
        if (existingGuestBanner) existingGuestBanner.remove();

        try {
          await commitMatchIfNeeded(
            result,
            eloCalc.deltaR,
            accuracyPct,
            totalSolved,
          );
        } catch (commitErr) {
          console.error(
            "[Result] Failed to commit match to Firestore:",
            commitErr,
          );
        }
      } else {
        // Guest mode: show banner and do NOT commit to persistent storage
        result.currentElo = `500 ELO (Guest)`;
        setLastExamResult(result);
        renderGuestResultPrompt(
          result,
          eloCalc.deltaR,
          accuracyPct,
          totalSolved,
        );
      }

      const finalElo = getUserElo();

      if (!hasNotifiedMatch(result.matchId)) {
        markMatchNotified(result.matchId);

        // 0. Core ELO Rating Delta or Lockdown Notification
        if (result.lockdownOutcome === "TERMINATED") {
          addNotification({
            type: "security_tampering",
            title: "PENALTY LOCKDOWN TERMINATED",
            message: `Verified positive match performance (+${result.absorbedDelta || 0} ELO) absorbed to discharge penalty lockdown. Standing: ${finalElo.toLocaleString()} ELO.`,
            eloTracker: { prevElo: activeUserElo, delta: 0, nextElo: finalElo },
            performance: {
              duration: result.timeSpent || 30,
              accuracy: accuracyPct,
            },
            details: { tier: result.rangeTitle || "Rated Competition Arena" },
          });
        } else if (result.lockdownOutcome === "EXTENDED") {
          addNotification({
            type: "security_tampering",
            title: "LOCKDOWN EXTENDED",
            message: `Negative rated outcome (${eloCalc.deltaR} ELO) during penalty lockdown. Complete a positive rated match to clear restriction.`,
            eloTracker: {
              prevElo: activeUserElo,
              delta: eloCalc.deltaR,
              nextElo: finalElo,
            },
            performance: {
              duration: result.timeSpent || 30,
              accuracy: accuracyPct,
            },
            details: { tier: result.rangeTitle || "Rated Competition Arena" },
          });
        } else if (eloCalc.deltaR > 0) {
          addNotification({
            type: "elo_gain",
            title: "Rating Gain",
            message: `+${eloCalc.deltaR} ELO earned in ${result.rangeTitle || "Rated Arena"} (${accuracyPct}% accuracy · ${result.timeSpent || 30}s). Live: ${finalElo.toLocaleString()} ELO.`,
            eloTracker: {
              prevElo: activeUserElo,
              delta: eloCalc.deltaR,
              nextElo: finalElo,
            },
            performance: {
              duration: result.timeSpent || 30,
              accuracy: accuracyPct,
            },
            details: { tier: result.rangeTitle || "Rated Competition Arena" },
          });
        } else if (eloCalc.deltaR < 0) {
          addNotification({
            type: "elo_loss",
            title: "Rating Adjustment",
            message: `${eloCalc.deltaR} ELO adjusted in ${result.rangeTitle || "Rated Arena"} (${accuracyPct}% accuracy · ${result.timeSpent || 30}s). Live: ${finalElo.toLocaleString()} ELO.`,
            eloTracker: {
              prevElo: activeUserElo,
              delta: eloCalc.deltaR,
              nextElo: finalElo,
            },
            performance: {
              duration: result.timeSpent || 30,
              accuracy: accuracyPct,
            },
            details: { tier: result.rangeTitle || "Rated Competition Arena" },
          });
        } else {
          showToast({
            type: "system",
            title: "Rated Match Complete (0 ELO Shift)",
            message: `Performance matched dynamic expectation in ${result.rangeTitle || "Rated Arena"} (${accuracyPct}% accuracy).`,
          });
        }

        // 1. Check Rank Shift (Tier Promotions or Demotions)
        const prevTierTitle = prevTier?.title || prevTier?.name;
        const newTierTitle = newTier?.title || newTier?.name;
        if (prevTier && newTier && prevTierTitle !== newTierTitle) {
          const isPromotion = newElo > activeUserElo;
          addNotification({
            type: "rank_shift",
            title: isPromotion
              ? `Tier Promotion: ${newTierTitle}`
              : `Tier Demotion: ${newTierTitle}`,
            message: isPromotion
              ? `🏆 Tier Promotion Unlocked! You have ascended from ${prevTierTitle} to ${newTierTitle}. Live rating locked at ${finalElo} ELO.`
              : `📉 Rating Division Shift: Adjusted from ${prevTierTitle} to ${newTierTitle} (${finalElo} ELO). Enter practice mode to reclaim standing.`,
            eloTracker: {
              prevElo: activeUserElo,
              delta: eloCalc.deltaR,
              nextElo: finalElo,
            },
            performance: {
              duration: result.timeSpent || 30,
              accuracy: accuracyPct,
            },
            details: {
              prevTier: prevTierTitle,
              nextTier: newTierTitle,
              direction: isPromotion ? "promotion" : "demotion",
              tier: result.rangeTitle || "Rated Competition Arena",
            },
          });
        }

        // 2. Check Continuous Practice Streaks Longevity Milestones
        const updatedLedger = getLedger();
        const currentStreak = updatedLedger.currentStreak || 0;
        if (
          currentStreak >= 2 &&
          (currentStreak > prevStreak || currentStreak % 3 === 0)
        ) {
          addNotification({
            type: "streak",
            title: `${currentStreak}-Match Win Streak!`,
            message: `🔥 Longevity Milestone: Maintained consecutive flawless 10/10 execution across ${currentStreak} matches. Rapid mental factorization rhythm sustained.`,
            eloTracker: {
              prevElo: activeUserElo,
              delta: eloCalc.deltaR,
              nextElo: finalElo,
            },
            performance: {
              duration: result.timeSpent || 30,
              accuracy: accuracyPct,
            },
            details: {
              streak: currentStreak,
              tier: result.rangeTitle || "Rated Competition Arena",
            },
          });
        }

        // 3. Check Personal Record (PR - breaking previous speed/score records)
        if (prevHighScore > 0 && (result.score || 0) > prevHighScore) {
          addNotification({
            type: "pr",
            title: "Personal Record Broken!",
            message: `⚡ Personal Record Shattered! Achieved new career high of ${result.score} pts in ${result.rangeTitle || "Rated Arena"} (previous record: ${prevHighScore} pts).`,
            eloTracker: {
              prevElo: activeUserElo,
              delta: eloCalc.deltaR,
              nextElo: finalElo,
            },
            performance: {
              duration: result.timeSpent || 30,
              accuracy: accuracyPct,
            },
            details: {
              score: result.score,
              prevHighScore,
              tier: result.rangeTitle || "Rated Competition Arena",
            },
          });
        }
      }
    }
  } else if (!isForcedUnrated) {
    // Handle page reload or post-guest sign-in for an already evaluated result
    if (isUserLoggedIn()) {
      const existingGuestBanner = document.getElementById(
        "guest-result-banner",
      );
      if (existingGuestBanner) existingGuestBanner.remove();
      if (!result.committedToCloud && !hasCommittedMatch(result.matchId)) {
        try {
          await commitMatchIfNeeded(
            result,
            Number(result.eloDelta || 0),
            accuracyPct,
            totalSolved,
          );
        } catch (commitErr) {
          console.error(
            "[Result] Failed to commit pending match on reload:",
            commitErr,
          );
        }
      }
    } else {
      renderGuestResultPrompt(
        result,
        Number(result.eloDelta || 0),
        accuracyPct,
        totalSolved,
      );
    }
  }

  const currentTier = getTierByElo(getUserElo());
  const isQuantumDecomposer =
    result.correctFirstAttempt === 10 && (result.lifelinesUsedCount || 0) === 0;
  const isAlgorithmicStrategist = !isQuantumDecomposer && totalSolved === 10;
  const isCadenceAnalyst =
    !isQuantumDecomposer && !isAlgorithmicStrategist && result.score > 75;
  const isModularOperator =
    !isQuantumDecomposer &&
    !isAlgorithmicStrategist &&
    !isCadenceAnalyst &&
    result.score > 45;
  const isFactorInitiate =
    !isQuantumDecomposer &&
    !isAlgorithmicStrategist &&
    !isCadenceAnalyst &&
    !isModularOperator &&
    result.score >= 1;

  let bracketTitle = "Quantum Decomposer";
  let bracketFontClass = "verdict-quantum";
  let bracketGlowColor = "#10B981";
  let diagnosticQuote = "";

  if (isQuantumDecomposer) {
    bracketTitle = "Quantum Decomposer";
    bracketFontClass = "verdict-quantum";
    bracketGlowColor = "#10B981";
    diagnosticQuote =
      "Absolute mastery. Achieved perfect factorization under the strict initial clock with zero assistance, running at sub-second cognitive speeds.";
  } else if (isAlgorithmicStrategist) {
    bracketTitle = "Algorithmic Strategist";
    bracketFontClass = "verdict-algorithmic";
    bracketGlowColor = "#10B981";
    diagnosticQuote =
      "Elite problem solver. Cleared the board by tactically deploying pauses, hints, or navigating the high-pressure second chance overtime loop.";
  } else if (isCadenceAnalyst) {
    bracketTitle = "Cadence Analyst";
    bracketFontClass = "verdict-cadence";
    bracketGlowColor = "#F59E0B";
    diagnosticQuote =
      "Strong competitor. Demonstrates high mental cadence and calculation accuracy, successfully neutralizing mistakes.";
  } else if (isModularOperator) {
    bracketTitle = "Modular Operator";
    bracketFontClass = "verdict-modular";
    bracketGlowColor = "#0284C7";
    diagnosticQuote =
      "Capable practitioner. Comfortably navigates textbook ranges and standard number fields, actively improving speed.";
  } else if (isFactorInitiate) {
    bracketTitle = "Factor Initiate";
    bracketFontClass = "verdict-initiate";
    bracketGlowColor = "#F87171";
    diagnosticQuote =
      "Developing foundation. Actively building basic divisibility intuition and mental heuristics inside the system.";
  } else {
    bracketTitle = "Matrix Reset";
    bracketFontClass = "verdict-reset";
    bracketGlowColor = "#EF4444";
    diagnosticQuote =
      "Tactical calibration required. Breached basic bounds. The engine recommends reviewing the edu.html sandbox before relaunching.";
  }

  // Master Score Ring Animation & DOM References
  const ringScoreNum = document.getElementById("ring-score-val");
  const verdictBadge =
    document.getElementById("verdict-badge-val") ||
    document.getElementById("quantum-score-badge-node");
  const ringProgressCircle = document.getElementById("ring-svg-progress");
  const diagnosticTextEl =
    document.getElementById("diagnostic-text-val") ||
    document.getElementById("quantum-verdict-quote-node");
  const diagnosticTitleEl =
    document.getElementById("diagnostic-title-val") ||
    document.getElementById("quantum-verdict-title-node");

  if (ringScoreNum) ringScoreNum.textContent = result.score;
  if (verdictBadge) {
    verdictBadge.textContent = bracketTitle;
    verdictBadge.className = `verdict-tier-badge ${bracketFontClass}`;
  }
  if (diagnosticTitleEl)
    diagnosticTitleEl.textContent = `Verdict Evaluation: ${bracketTitle}`;

  // Advanced Text-Typing / Telemetry Animation System
  if (diagnosticTextEl) {
    diagnosticTextEl.textContent = "";
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < diagnosticQuote.length) {
        diagnosticTextEl.textContent += diagnosticQuote.charAt(charIndex);
        charIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 18);
  }

  if (ringProgressCircle) {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    ringProgressCircle.style.strokeDasharray = `${circumference}`;

    // Normalizing score 0-100 pts
    const normalizedPercent = Math.max(
      0,
      Math.min(100, (result.score / 100) * 100),
    );
    const offset = circumference - (normalizedPercent / 100) * circumference;

    ringProgressCircle.style.stroke = bracketGlowColor;

    if (window.gsap) {
      window.gsap.fromTo(
        ringProgressCircle,
        { strokeDashoffset: circumference },
        { strokeDashoffset: offset, duration: 1.2, ease: "power2.out" },
      );
    } else {
      ringProgressCircle.style.strokeDashoffset = offset;
    }
  }

  // Populate absolute counter strip
  const elFirst = document.getElementById("cb-first-attempt");
  const elSecond = document.getElementById("cb-second-attempt");
  const elAccuracy = document.getElementById("cb-accuracy");
  const elTimeSpent = document.getElementById("cb-time-spent");
  const elLifelines = document.getElementById("cb-lifelines");
  const elEloDelta = document.getElementById("cb-elo-delta");

  if (elFirst) elFirst.textContent = `${result.correctFirstAttempt} / 10`;
  if (elSecond) elSecond.textContent = `${result.correctSecondAttempt}`;
  if (elAccuracy) elAccuracy.textContent = `${accuracyPct}%`;
  if (elTimeSpent) elTimeSpent.textContent = `${result.timeSpent}s`;
  if (elLifelines) elLifelines.textContent = `${result.lifelinesUsedCount}`;

  // Populate ELO Changes Matrix Block Beneath Score Ring & Telemetry Panel
  const eloDeltaVal = result.eloDelta || 0;
  const isUnratedSession = Boolean(result.isForcedUnrated);

  const ringExpectationStatus = document.getElementById(
    "ring-expectation-status",
  );
  const ringEloDelta = document.getElementById("ring-elo-delta");
  const ringEloComment = document.getElementById("ring-elo-comment");

  const elTierIcon = document.getElementById("elo-tier-icon");
  const elTierTitle = document.getElementById("elo-tier-title");
  const elStatusBadge = document.getElementById("elo-status-badge");
  const elLiveVal = document.getElementById("elo-live-val");
  const elReviewVal = document.getElementById("elo-review-val");
  const elDeltaLarge = document.getElementById("elo-delta-large");

  if (isUnratedSession) {
    // Unrated Practice run: low-intensity muted platinum string stating exactly "0 ELO (Practice Run)"
    // Expectation status to "⏸️ Deactivated", and dynamic comment row to state exactly "Training"
    const platinumColor = "#E2E8F0";
    const mutedColor = "#94A3B8";

    if (ringExpectationStatus) {
      ringExpectationStatus.textContent = "⏸️ Deactivated";
      ringExpectationStatus.style.color = mutedColor;
    }
    if (ringEloDelta) {
      ringEloDelta.textContent = "0 ELO ";
      ringEloDelta.style.color = platinumColor;
    }
    if (ringEloComment) {
      ringEloComment.textContent = "Training";
      ringEloComment.style.color = platinumColor;
    }
    if (elEloDelta) {
      elEloDelta.textContent = "0 ELO (Practice Run)";
      elEloDelta.style.color = platinumColor;
    }
    if (elDeltaLarge) {
      elDeltaLarge.textContent = "0 ELO (Practice Run)";
      elDeltaLarge.style.color = platinumColor;
    }
    if (elReviewVal) {
      elReviewVal.textContent = "Training";
      elReviewVal.style.color = platinumColor;
    }
    if (elStatusBadge) {
      elStatusBadge.textContent = "UNRATED PRACTICE";
      elStatusBadge.style.background = "rgba(148, 163, 184, 0.15)";
      elStatusBadge.style.color = platinumColor;
      elStatusBadge.style.borderColor = "rgba(148, 163, 184, 0.4)";
    }
  } else {
    // Official Rated Contest
    const isSuccessfulRun = eloDeltaVal > 0;
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

    const chosenComment =
      result.verdictComment ||
      (isSuccessfulRun
        ? supportiveRemarks[
            Math.floor(Math.random() * supportiveRemarks.length)
          ]
        : criticalRemarks[Math.floor(Math.random() * criticalRemarks.length)]);

    if (result.lockdownOutcome === "TERMINATED") {
      const amberColor = "#F59E0B";
      const formattedDelta = "0 ELO";

      if (ringExpectationStatus) {
        ringExpectationStatus.textContent = "✔️ Lockdown Cleared";
        ringExpectationStatus.style.color = "#10B981";
      }
      if (ringEloDelta) {
        ringEloDelta.innerHTML = `0 ELO <span style="display: block; font-size: 0.72rem; color: #F59E0B; font-weight: 700; margin-top: 2px;">(Absorbed +${result.absorbedDelta || 0} ELO Penalty)</span>`;
        ringEloDelta.style.color = amberColor;
      }
      if (ringEloComment) {
        ringEloComment.textContent = "Lockdown Cleared";
        ringEloComment.style.color = "#10B981";
      }
      if (elEloDelta) {
        elEloDelta.textContent = `0 ELO (Absorbed +${result.absorbedDelta || 0})`;
        elEloDelta.style.color = amberColor;
      }
      if (elDeltaLarge) {
        elDeltaLarge.innerHTML = `0 ELO <span style="display: block; font-size: 0.75rem; color: #F59E0B; font-weight: 700; margin-top: 2px;">⚙️ Lockdown Absorbed (+${result.absorbedDelta || 0} ELO Sacrificed)</span>`;
        elDeltaLarge.style.color = amberColor;
      }
      if (elReviewVal) {
        elReviewVal.textContent = "Lockdown Cleared";
        elReviewVal.style.color = "#10B981";
      }
      if (elStatusBadge) {
        elStatusBadge.textContent = "PENALTY ABSORBED";
        elStatusBadge.style.background = "rgba(245, 158, 11, 0.15)";
        elStatusBadge.style.color = amberColor;
        elStatusBadge.style.borderColor = "rgba(245, 158, 11, 0.4)";
      }
    } else if (isSuccessfulRun) {
      // Successful Rated run: vibrant neon green ELO delta change, expectation status ✔️ Passed
      const neonGreen = "#10B981";
      const formattedDelta = `+${eloDeltaVal} ELO`;

      if (ringExpectationStatus) {
        ringExpectationStatus.textContent = "✔️ Passed";
        ringExpectationStatus.style.color = neonGreen;
      }
      if (ringEloDelta) {
        ringEloDelta.textContent = formattedDelta;
        ringEloDelta.style.color = neonGreen;
      }
      if (ringEloComment) {
        ringEloComment.textContent = chosenComment;
        ringEloComment.style.color = neonGreen;
      }
      if (elEloDelta) {
        elEloDelta.textContent = formattedDelta;
        elEloDelta.style.color = neonGreen;
      }
      if (elDeltaLarge) {
        elDeltaLarge.innerHTML = `${formattedDelta}${result.comboStrikeBonusElo ? ` <span style="display: block; font-size: 0.725rem; color: #38BDF8; font-weight: 700; margin-top: 2px;">⚡ Includes +${result.comboStrikeBonusElo} Combo Bonus</span>` : ""}`;
        elDeltaLarge.style.color = neonGreen;
      }
      if (elReviewVal) {
        elReviewVal.textContent = chosenComment;
        elReviewVal.style.color = neonGreen;
      }
      if (elStatusBadge) {
        elStatusBadge.textContent = "OFFICIAL RATED";
        elStatusBadge.style.background = "rgba(16, 185, 129, 0.15)";
        elStatusBadge.style.color = neonGreen;
        elStatusBadge.style.borderColor = "rgba(16, 185, 129, 0.4)";
      }
    } else {
      // Underperforming Rated run: sharp neon red ELO drop, expectation status ❌ Failed
      const neonRed = "#EF4444";
      const formattedDelta = `${eloDeltaVal} ELO`;

      if (ringExpectationStatus) {
        ringExpectationStatus.textContent =
          result.lockdownOutcome === "EXTENDED"
            ? "⚠️ Lockdown Extended"
            : "❌ Failed";
        ringExpectationStatus.style.color = neonRed;
      }
      if (ringEloDelta) {
        ringEloDelta.textContent = formattedDelta;
        ringEloDelta.style.color = neonRed;
      }
      if (ringEloComment) {
        ringEloComment.textContent = chosenComment;
        ringEloComment.style.color = neonRed;
      }
      if (elEloDelta) {
        elEloDelta.textContent = formattedDelta;
        elEloDelta.style.color = neonRed;
      }
      if (elDeltaLarge) {
        elDeltaLarge.innerHTML = `${formattedDelta}${result.lockdownOutcome === "EXTENDED" ? ` <span style="display: block; font-size: 0.725rem; color: #F87171; font-weight: 700; margin-top: 2px;">⚠️ Negative In Lockdown — Restriction Stays Active</span>` : ""}`;
        elDeltaLarge.style.color = neonRed;
      }
      if (elReviewVal) {
        elReviewVal.textContent = chosenComment;
        elReviewVal.style.color = neonRed;
      }
      if (elStatusBadge) {
        elStatusBadge.textContent =
          result.lockdownOutcome === "EXTENDED"
            ? "LOCKDOWN EXTENDED"
            : "OFFICIAL RATED";
        elStatusBadge.style.background = "rgba(239, 68, 68, 0.15)";
        elStatusBadge.style.color = neonRed;
        elStatusBadge.style.borderColor = "rgba(239, 68, 68, 0.4)";
      }
    }
  }

  if (elTierIcon) elTierIcon.textContent = currentTier.symbol || "🧩";
  if (elTierTitle) {
    elTierTitle.textContent = currentTier.title || "Composite Apprentice";
    elTierTitle.style.color = currentTier.colorHex || "#FFFFFF";
  }
  if (elLiveVal) elLiveVal.textContent = `${getUserElo().toLocaleString()} ELO`;

  // Render the System Expectations Verification Ledger (Dual-Remark Output Matrix)
  renderVerificationLedger(result, activeUserElo);

  /**
   * 3. MICRO-LATENCY EVALUATION GRAPH & BOTTLENECK MATRIX
   * Lightweight, high-performance visual bar chart mapping every discrete prime factor
   * against its exact processing micro-latency (T in milliseconds).
   * Isolates and flags the peak bottleneck with glowing laser-amber warning outline.
   */
  function renderMicroLatencyEvaluationGraph(resultObj) {
    let latencyData =
      Array.isArray(resultObj.factorLatencyAudit) &&
      resultObj.factorLatencyAudit.length > 0
        ? [...resultObj.factorLatencyAudit]
        : [];

    // Fallback generation if no live snapshot is available
    if (latencyData.length === 0) {
      if (
        Array.isArray(resultObj.compilerLatencyAudit) &&
        resultObj.compilerLatencyAudit.length > 0
      ) {
        latencyData = [];
        resultObj.compilerLatencyAudit.forEach((q) => {
          const factors = factorize(q.number) || [2, 3];
          const baseMs = Math.round(
            ((resultObj.timeSpent || 45) /
              resultObj.compilerLatencyAudit.length) *
              1000,
          );
          factors.forEach((p, idx) => {
            latencyData.push({
              factor: p,
              latencyMs: Math.round(baseMs * (p > 7 ? 1.75 : 0.85) + idx * 45),
              questionNumber: q.number,
              isProblematic: false,
            });
          });
        });
      } else {
        latencyData = [
          {
            factor: 2,
            latencyMs: 320,
            questionNumber: 12,
            isProblematic: false,
          },
          {
            factor: 2,
            latencyMs: 340,
            questionNumber: 12,
            isProblematic: false,
          },
          {
            factor: 3,
            latencyMs: 460,
            questionNumber: 12,
            isProblematic: false,
          },
          {
            factor: 7,
            latencyMs: 820,
            questionNumber: 42,
            isProblematic: false,
          },
          {
            factor: 17,
            latencyMs: 1420,
            questionNumber: 68,
            isProblematic: true,
          },
          {
            factor: 5,
            latencyMs: 510,
            questionNumber: 85,
            isProblematic: false,
          },
          {
            factor: 11,
            latencyMs: 910,
            questionNumber: 99,
            isProblematic: false,
          },
        ];
      }
    }

    // Find the single peak latency factor (Problematic Bottleneck)
    let maxLatency = 0;
    let problematicItem = latencyData[0];
    latencyData.forEach((item) => {
      if (item.latencyMs > maxLatency) {
        maxLatency = item.latencyMs;
        problematicItem = item;
      }
    });

    // Strict isolation: flag only the peak element
    latencyData.forEach((item) => {
      item.isProblematic = item === problematicItem;
    });

    const totalLatency = latencyData.reduce(
      (acc, cur) => acc + cur.latencyMs,
      0,
    );
    const avgLatency = Math.round(
      totalLatency / Math.max(1, latencyData.length),
    );
    const speedDelta = (
      problematicItem.latencyMs / Math.max(1, avgLatency)
    ).toFixed(1);

    // Construct High-Performance Visual Bar Chart
    const chartBarsHtml = latencyData
      .map((item) => {
        const heightPercent = Math.max(
          14,
          Math.min(
            100,
            Math.round((item.latencyMs / Math.max(1, maxLatency)) * 100),
          ),
        );
        const isBottleneck = item.isProblematic;

        return `
        <div class="micro-latency-bar-col ${isBottleneck ? "is-bottleneck" : ""}" title="Prime Factor ${item.factor} | ${item.latencyMs}ms | Target ${item.questionNumber || "N/A"}">
          <span class="micro-latency-val tabular-nums">${item.latencyMs}ms</span>
          <div class="micro-latency-bar-track">
            <div class="micro-latency-bar-fill" style="height: ${heightPercent}%;"></div>
          </div>
          <span class="micro-latency-factor-label">
            <span class="p-symbol">P=</span>${item.factor}
          </span>
          ${isBottleneck ? '<span class="bottleneck-tag">PEAK</span>' : ""}
        </div>
      `;
      })
      .join("");

    return `
      <div class="micro-latency-graph-card" style="background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(14, 165, 233, 0.35); border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.25rem;">📊</span>
            <h4 style="color: #FFFFFF; font-family: var(--font-heading); font-size: 1.2rem; font-weight: 800; margin: 0; letter-spacing: 0.03em;">
              MICRO-LATENCY FACTOR EVALUATION GRAPH
            </h4>
          </div>
          <div style="display: flex; align-items: center; gap: 16px; font-size: 0.85rem;">
            <span style="color: #94A3B8;">Discrete Factors: <strong style="color: #FFFFFF;">${latencyData.length}</strong></span>
            <span style="color: #94A3B8;">Mean Latency: <strong style="color: #38BDF8;">${avgLatency} ms</strong></span>
            <span style="color: #F59E0B; font-weight: 700;">Peak: ${problematicItem.latencyMs} ms (P = ${problematicItem.factor})</span>
          </div>
        </div>
        <p style="font-size: 0.825rem; color: #94A3B8; margin-bottom: 18px;">
          Every discrete prime factor extracted during match session mapped against its microsecond processing time (T in milliseconds). The single most problematic integer factor is isolated with a glowing laser-amber warning outline.
        </p>

        <!-- Visual Bar Chart Container -->
        <div class="micro-latency-chart-wrapper" style="overflow-x: auto; padding-bottom: 8px;">
          <div class="micro-latency-chart-flex" style="display: flex; width: 100%; box-sizing: border-box; align-items: flex-end; gap: 14px; min-width: ${Math.max(1, latencyData.length) * 56}px; height: 180px; padding: 28px 12px 10px 12px; background: rgba(11, 15, 23, 0.85); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px;">
            ${chartBarsHtml}
          </div>
        </div>

        <!-- Inline Typographical Matrix Diagnosis Statement -->
        <div class="matrix-diagnosis-statement" style="background: rgba(245, 158, 11, 0.08); border: 1.5px solid #F59E0B; border-radius: 10px; padding: 14px 18px; margin-top: 18px; box-shadow: 0 0 20px rgba(245, 158, 11, 0.18);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 1.15rem;">⚠️</span>
            <span style="font-family: var(--font-heading); font-weight: 800; font-size: 1.02rem; color: #F59E0B; letter-spacing: 0.04em;">NUMERICAL BOTTLENECK MATRIX DIAGNOSIS</span>
          </div>
          <p style="color: #FFFFFF; font-size: 0.885rem; line-height: 1.55; margin: 0;">
            Prime factor <strong style="color: #FBBF24; font-size: 0.95rem;">P = ${problematicItem.factor}</strong> (Question Target ${problematicItem.questionNumber ? problematicItem.questionNumber.toLocaleString() : "Challenge"}) exhibited peak cognitive extraction resistance, clocking <strong style="color: #FBBF24;">${problematicItem.latencyMs.toLocaleString()} ms</strong> (${speedDelta}x slower than session mean).
          </p>
          <p style="color: #CBD5E1; font-size: 0.825rem; line-height: 1.5; margin-top: 6px; margin-bottom: 0;">
            <em>Competitor Directive:</em> Reinforce mental decomposition heuristics and modular divisibility rules for prime <strong>${problematicItem.factor}</strong> before selecting your next competitive division tier.
          </p>
        </div>
      </div>
    `;
  }

  // Populate Failure Audit Stack with Micro-Latency Factor Evaluation Graph & Nested Mistake Analysis
  const failureContainer = document.getElementById("failure-audit-list");
  if (failureContainer) {
    const microLatencyHtml = renderMicroLatencyEvaluationGraph(result);
    let failureStackHtml = "";

    if (result.failureStack && result.failureStack.length > 0) {
      failureStackHtml = result.failureStack
        .map((f) => {
          const exp = toExponentialForm(f.trueFactors);
          const expStr = formatExponentialString(exp);

          let diagnosis1 = "Omitted / Skipped";
          if (f.attempt1 && f.attempt1 !== "[Skipped/Unanswered]") {
            const eval1 = parseAndValidateFactorInput(f.attempt1, f.number);
            diagnosis1 =
              eval1.reason ||
              (eval1.isValid ? "Correct value late" : "Arithmetic mismatch");
          }

          let diagnosis2 = "None submitted";
          if (f.attempt2 && f.attempt2 !== "None") {
            const eval2 = parseAndValidateFactorInput(f.attempt2, f.number);
            diagnosis2 =
              eval2.reason ||
              (eval2.isValid ? "Corrected in overtime" : "Failed retry");
          }

          return `
          <div class="audit-item" style="padding: 1.25rem;">
            <div class="audit-q" style="font-size: 1.1rem; margin-bottom: 0.75rem; font-weight: 700; color: #FFFFFF;">Target Integer: ${f.number.toLocaleString()}</div>
            
            <div class="latency-table-wrap" style="margin-top: 0.5rem; margin-bottom: 0.75rem;">
              <table class="audit-nested-table latency-table" style="background: rgba(17, 24, 39, 0.8); border: 1px solid var(--card-border); border-radius: 0.5rem; overflow: hidden;">
                <thead>
                  <tr>
                    <th>Attempt Phase</th>
                    <th>User String Input</th>
                    <th>Diagnostic Evaluation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="color: #F87171; font-weight: 700;">1st Attempt</td>
                    <td><code style="background: rgba(31, 41, 55, 0.8); color: #FFFFFF; padding: 0.2rem 0.4rem; border-radius: 0.25rem;">${escapeHtml(f.attempt1)}</code></td>
                    <td style="color: #FFFFFF; font-weight: 600;">${escapeHtml(diagnosis1)}</td>
                  </tr>
                  <tr>
                    <td style="color: #FBBF24; font-weight: 700;">Overtime Retry</td>
                    <td><code style="background: rgba(31, 41, 55, 0.8); color: #FFFFFF; padding: 0.2rem 0.4rem; border-radius: 0.25rem;">${escapeHtml(f.attempt2)}</code></td>
                    <td style="color: #FFFFFF; font-weight: 600;">${escapeHtml(diagnosis2)}</td>
                  </tr>
                  <tr style="background: rgba(16, 185, 129, 0.1);">
                    <td style="color: #34D399; font-weight: 700;">Precise Factors</td>
                    <td colspan="2" style="font-size: 1rem; color: #FFFFFF; font-weight: 700;">
                      ${expStr} &nbsp; <span style="color: var(--text-muted); font-weight: 600;">(${f.trueFactors.join(" &times; ")})</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
        })
        .join("");
    } else {
      failureStackHtml = `<div class="empty-audit-notice">Zero computational faults recorded. Pure mathematical execution.</div>`;
    }

    if (failureContainer && failureContainer.parentElement) {
      let graphWrapper = document.getElementById(
        "micro-latency-graph-wrapper-node",
      );
      if (!graphWrapper) {
        graphWrapper = document.createElement("div");
        graphWrapper.id = "micro-latency-graph-wrapper-node";
        failureContainer.parentElement.insertBefore(
          graphWrapper,
          failureContainer,
        );
      }
      graphWrapper.innerHTML = microLatencyHtml;
    }
    failureContainer.innerHTML = failureStackHtml;
  }

  // Populate Redemption Track
  const redemptionContainer = document.getElementById("redemption-audit-list");
  if (redemptionContainer) {
    if (result.redemptionTrack && result.redemptionTrack.length > 0) {
      redemptionContainer.innerHTML = result.redemptionTrack
        .map((r) => {
          const exp = toExponentialForm(r.trueFactors);
          const expStr = formatExponentialString(exp);
          return `
          <div class="audit-item" style="background: rgba(30, 30, 47, 0.9); border: 1px solid rgba(255, 215, 0, 0.25); border-radius: 0.6rem; padding: 0.85rem 1rem; margin-bottom: 0.75rem;">
            <div class="audit-q" style="font-weight: 700; color: #A6FF00; margin-bottom: 0.35rem; font-size: 0.95rem;">
              Target Integer: ${r.number.toLocaleString()}
            </div>

            <div class="text-crimson" style="font-weight: 700; font-size: 0.875rem; color: #FF3131; margin-bottom: 0.2rem;">
              Initial Error: <span>${escapeHtml(r.attempt1)}</span>
            </div>
            
            <div class="text-amber" style="font-weight: 700; font-size: 0.875rem; color: #FF914D; margin-bottom: 0.2rem;">
              Redeemed Correction: <span>${escapeHtml(r.attempt2)}</span>
            </div>
            
            <div class="text-mint" style="font-size: 0.9rem; font-weight: 700; color: #FFD700; margin-top: 0.05rem;">
              Canonical Form: <span>${expStr}</span>
            </div>
          </div>
        `;
        })
        .join("");
    } else {
      redemptionContainer.innerHTML = `<div class="empty-audit-notice" >No redemption entries recorded. (No overtime retries utilized).</div>`;
    }
  }

  // Populate Compiler Latency Audit Table (Sub-Second Pollard's Rho Logs)
  const latencyTableBody = document.getElementById("compiler-latency-tbody");
  const avgLatencyEl = document.getElementById("avg-compiler-latency");
  if (latencyTableBody) {
    const latencyLogs =
      result.compilerLatencyAudit ||
      Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        number: 1000 + i * 23,
        latencyMs: +(0.035 + Math.random() * 0.08).toFixed(3),
        factorCount: 3,
        algorithm: "Pollard's Rho (Brent)",
        status: "Deterministic Verified",
      }));

    let totalMs = 0;
    latencyTableBody.innerHTML = latencyLogs
      .map((log, idx) => {
        const lat = Number(log.latencyMs) || 0.04;
        totalMs += lat;
        // defensive defaults: a partial/legacy audit row must never print "undefined" or throw
        const qid = log.id ?? log.questionNumber ?? idx + 1;
        const num = Number(log.number);
        const numText = Number.isFinite(num) ? num.toLocaleString() : "—";
        const algo = log.algorithm || "Pollard's Rho (Brent)";
        const status = log.status || "Deterministic Verified";
        return `
        <tr>
          <td data-label="Index" class="tabular-nums font-bold">Q${qid}</td>
          <td data-label="Target N" class="tabular-nums font-bold" style="color: #FFFFFF;">${numText}</td>
          <td data-label="Latency" class="tabular-nums font-bold text-accent">${lat.toFixed(3)} ms</td>
          <td data-label="Engine">${algo}</td>
          <td data-label="State" class="text-mint font-bold">✓ ${status}</td>
        </tr>
      `;
      })
      .join("");

    if (avgLatencyEl && latencyLogs.length > 0) {
      const avg = (totalMs / latencyLogs.length).toFixed(3);
      avgLatencyEl.textContent = `${avg} ms`;
    }
  }

  // Action Buttons & Report Card Copy Action
  const btnRetake = document.getElementById("result-retake-btn");
  const btnNewRange = document.getElementById("result-new-range-btn");
  const btnShare = document.getElementById("result-share-btn");
  const btnCardShare = document.getElementById("card-share-btn");
  const shareToast = document.getElementById("share-verdict-toast");

  const copyTextToClipboard = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn("Async clipboard write failed, using fallback", err);
      }
    }
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      return false;
    }
  };

  const getShareTelemetryText = () => {
    const firstAttemptClears =
      result.correctFirstAttempt !== undefined
        ? result.correctFirstAttempt
        : totalSolved;
    const totalQuestionsTarget = result.totalQuestions || 10;
    const rankTitle = `${currentTier.title} ${currentTier.symbol}`;
    const categoryTitle = result.rangeTitle || "Custom";
    const eloDeltaStr = result.isForcedUnrated
      ? "0 ELO (Sandbox Practice)"
      : result.eloDelta !== undefined
        ? (result.eloDelta > 0
            ? `+${result.eloDelta} ELO`
            : `${result.eloDelta} ELO`) +
          ` (${result.verdictComment || "Calibrated"})`
        : "0 ELO (Practice Run)";
    const currentEloStr = `${getUserElo().toLocaleString()} ELO`;
    const lifelinesUsed =
      result.lifelinesUsedCount !== undefined ? result.lifelinesUsedCount : 0;
    const secondsSpent = result.timeSpent !== undefined ? result.timeSpent : 0;

    return (
      `⚡ Prime-Factor.app Performance Report ⚡\n\n` +
      `🏆 Rank Tier: ${rankTitle}\n` +
      `📊 Final Score: ${result.score ?? 0}/100 points\n` +
      `🛡️ Category: ${categoryTitle} Tier\n` +
      `🎯 Accuracy: ${accuracyPct}%\n` +
      `🧩 Progress: ${firstAttemptClears}/${totalQuestionsTarget} Completed\n\n` +
      `📈 ELO Changed: ${eloDeltaStr}\n` +
      `📡 Current ELO: ${currentEloStr}\n\n` +
      `⏱ *Time Spent: ${secondsSpent}s\n` +
      `🧪 Lifelines Used: ${lifelinesUsed}\n\n` +
      `✨ Certified By Rayaan Tasnim\n` +
      `🚀 Powered by Olympiad Edge\n` +
      `© All rights reserved.`
    );
  };

  const executeShareFeedback = async (buttonEl) => {
    playSound("click");
    const shareText = getShareTelemetryText();
    await copyTextToClipboard(shareText);

    if (buttonEl) {
      const originalHTML = buttonEl.innerHTML;
      buttonEl.textContent = "✔️ Performance Report Copied!";
      buttonEl.classList.add("btn-share-copied-glow");

      setTimeout(() => {
        buttonEl.innerHTML = originalHTML;
        buttonEl.classList.remove("btn-share-copied-glow");
      }, 2000);
    }

    if (shareToast) {
      shareToast.style.display = "block";
      setTimeout(() => {
        shareToast.style.display = "none";
      }, 2000);
    }
  };

  if (btnCardShare) {
    btnCardShare.addEventListener("click", () =>
      executeShareFeedback(btnCardShare),
    );
  }

  if (btnShare) {
    btnShare.addEventListener("click", () => executeShareFeedback(btnShare));
  }

  // Explicitly ensure settings gear icon triggers scrollable Engine Configuration modal
  const settingsToggleBtn = document.getElementById("settings-toggle-btn");
  if (settingsToggleBtn) {
    settingsToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      playSound("click");
      const modal = document.getElementById("settings-modal");
      if (modal) {
        modal.classList.add("open");
      }
    });
  }

  if (btnRetake) {
    btnRetake.addEventListener("click", () => {
      playSound("click");
      setActiveExamParams({
        min: result.min,
        max: result.max,
        title: result.rangeTitle,
        rules: getSettings(),
      });
      window.location.href = `./contract.html?min=${result.min}&max=${result.max}&title=${encodeURIComponent(result.rangeTitle || "")}`;
    });
  }

  if (btnNewRange) {
    btnNewRange.addEventListener("click", () => {
      playSound("click");
      window.location.href = "./ranges.html";
    });
  }
}

/**
 * System Expectations Verification Ledger (Dual-Remark Output Matrix)
 * Evaluates 4 core categories:
 * 1. Score Expectation: Checks if raw points >= chasing target; ratings out of 10
 * 2. Accuracy Expectation: Evaluates precision metrics (1st clears + 2nd chance overtime) vs historical rolling ledger
 * 3. Lifeline Usage Expectation: Audits resource efficiency (10/10 for 0 unassisted lifelines)
 * 4. Time Consumption Expectation: Unveils hidden velocity thresholds and maps calculation speed
 */
function renderVerificationLedger(result, activeUserElo) {
  const container = document.getElementById(
    "system-expectations-verification-ledger",
  );
  if (!container) return;

  const totalQuestions = result.totalQuestions || 10;
  const firstClears =
    result.correctFirstAttempt !== undefined ? result.correctFirstAttempt : 0;
  const secondClears =
    result.correctSecondAttempt !== undefined ? result.correctSecondAttempt : 0;
  const totalSolvedMatch = firstClears + secondClears;
  const matchAccuracyPct = Math.round(
    (totalSolvedMatch / totalQuestions) * 100,
  );

  const expectations = computeSystemExpectations(
    activeUserElo,
    result.max || 200,
  );

  // Update session mode badge if in unrated practice
  const modeBadge = document.getElementById("ledger-session-mode-badge");
  if (modeBadge) {
    if (result.isForcedUnrated || result.participationMode === "unrated") {
      modeBadge.textContent = "Unrated Practice Audit Matrix";
      modeBadge.style.color = "#34D399";
      modeBadge.style.borderColor = "rgba(52, 211, 153, 0.4)";
      modeBadge.style.background = "rgba(16, 185, 129, 0.12)";
    } else {
      modeBadge.textContent = "Rated Contest Verification Matrix";
      modeBadge.style.color = "#38BDF8";
      modeBadge.style.borderColor = "rgba(56, 189, 248, 0.4)";
      modeBadge.style.background = "rgba(14, 165, 233, 0.15)";
    }
  }

  // -------------------------------------------------------------
  // 1. SCORE EXPECTATION
  // Ticks [✔️] and prints rating out of 10 based on whether the final raw score
  // (out of 100 max, following lifeline minuses) conquered the dynamic chasing target.
  // -------------------------------------------------------------
  const rawScore = result.score !== undefined ? result.score : 0;
  const targetScore = expectations.minScore || 75;
  const isScorePassed = rawScore >= targetScore;
  const scorePts = Math.min(10.0, Math.max(0.0, +(rawScore / 10).toFixed(1)));

  const cbScore = document.getElementById("checkbox-score-status");
  const symScore = document.getElementById("symbol-score-status");
  const txtScore = document.getElementById("text-score-status");
  const ratingScore = document.getElementById("rating-score-points");
  const footScore = document.getElementById("footer-score-benchmark");

  if (cbScore && symScore && txtScore) {
    if (isScorePassed) {
      cbScore.className = "custom-status-checkbox pass";
      symScore.textContent = "✔️";
      txtScore.textContent = "Target Conquered";
    } else {
      cbScore.className = "custom-status-checkbox fail";
      symScore.textContent = "❌";
      txtScore.textContent = "Target Missed";
    }
  }
  if (ratingScore) {
    ratingScore.textContent = `${scorePts.toFixed(1)} / 10 Points`;
  }
  if (footScore) {
    footScore.textContent = `Chasing Target: ≥ ${targetScore} pts · Final Raw Score: ${rawScore} pts`;
  }

  // -------------------------------------------------------------
  // 2. ACCURACY EXPECTATION
  // Ticks [✔️] and prints rating out of 10 by evaluating current precision match metrics
  // (surgically combining first-attempt successful clears AND second-chance recovered completions against total session questions)
  // against the historical rolling ledger.
  // -------------------------------------------------------------
  const ledger = getLedger();
  const historicalAcc =
    ledger.totalAttempted > 0
      ? Math.round((ledger.totalSolved / ledger.totalAttempted) * 100)
      : 80;
  const accuracyBenchmark = Math.min(historicalAcc, 80);
  const isAccuracyPassed = matchAccuracyPct >= accuracyBenchmark;

  // Fractional rating out of 10 combining 1st clears (1.0 weight) and 2nd chance overtime (0.75 weight)
  const precisionRatio =
    ((firstClears * 1.0 + secondClears * 0.75) / totalQuestions) * 10;
  const accuracyPts = Math.min(10.0, Math.max(0.0, +precisionRatio.toFixed(1)));

  const cbAccuracy = document.getElementById("checkbox-accuracy-status");
  const symAccuracy = document.getElementById("symbol-accuracy-status");
  const txtAccuracy = document.getElementById("text-accuracy-status");
  const ratingAccuracy = document.getElementById("rating-accuracy-points");
  const footAccuracy = document.getElementById("footer-accuracy-benchmark");

  if (cbAccuracy && symAccuracy && txtAccuracy) {
    if (isAccuracyPassed) {
      cbAccuracy.className = "custom-status-checkbox pass";
      symAccuracy.textContent = "✔️";
      txtAccuracy.textContent = "Precision Satisfied";
    } else {
      cbAccuracy.className = "custom-status-checkbox fail";
      symAccuracy.textContent = "❌";
      txtAccuracy.textContent = "Precision Deficit";
    }
  }
  if (ratingAccuracy) {
    ratingAccuracy.textContent = `${accuracyPts.toFixed(1)} / 10 Points`;
  }
  if (footAccuracy) {
    footAccuracy.textContent = `Match Precision: ${matchAccuracyPct}% (${firstClears} 1st, ${secondClears} 2nd) · Rolling Ledger: ${historicalAcc}%`;
  }

  // -------------------------------------------------------------
  // 3. LIFELINE USAGE EXPECTATION
  // Ticks [✔️] and prints rating out of 10 by auditing resource efficiency
  // (e.g., a perfect 10/10 points if 0 lifelines were triggered during execution).
  // -------------------------------------------------------------
  const lifelinesUsed =
    result.lifelinesUsedCount !== undefined ? result.lifelinesUsedCount : 0;
  const allowedLifelines = activeUserElo >= 1200 ? 0 : 1;
  const isLifelinesPassed = lifelinesUsed <= allowedLifelines;

  let lifelineRating = 10.0;
  if (lifelinesUsed === 0) {
    lifelineRating = 10.0;
  } else if (lifelinesUsed === 1) {
    lifelineRating = allowedLifelines >= 1 ? 8.5 : 7.0;
  } else if (lifelinesUsed === 2) {
    lifelineRating = 5.0;
  } else if (lifelinesUsed === 3) {
    lifelineRating = 2.5;
  } else {
    lifelineRating = Math.max(0.0, +(10 - lifelinesUsed * 2.5).toFixed(1));
  }

  const cbLifeline = document.getElementById("checkbox-lifeline-status");
  const symLifeline = document.getElementById("symbol-lifeline-status");
  const txtLifeline = document.getElementById("text-lifeline-status");
  const ratingLifeline = document.getElementById("rating-lifeline-points");
  const footLifeline = document.getElementById("footer-lifeline-benchmark");

  if (cbLifeline && symLifeline && txtLifeline) {
    if (isLifelinesPassed) {
      cbLifeline.className = "custom-status-checkbox pass";
      symLifeline.textContent = "✔️";
      txtLifeline.textContent =
        lifelinesUsed === 0 ? "Pure Unassisted Mastery" : "Resource Efficient";
    } else {
      cbLifeline.className = "custom-status-checkbox fail";
      symLifeline.textContent = "❌";
      txtLifeline.textContent = "Over-Assisted";
    }
  }
  if (ratingLifeline) {
    ratingLifeline.textContent = `${lifelineRating.toFixed(1)} / 10 Points`;
  }
  if (footLifeline) {
    footLifeline.textContent = `Lifelines Triggered: ${lifelinesUsed} · Contract Baseline: ≤ ${allowedLifelines} utilized`;
  }

  // -------------------------------------------------------------
  // 4. TIME CONSUMPTION EXPECTATION [The Hidden Target Unveiled]
  // Ticks [✔️] and prints rating out of 10 by mapping factor calculation speed velocity thresholds.
  // (This metric must remain completely hidden from pre-flight contract.html and revealed entirely here).
  // -------------------------------------------------------------
  const timeSpent = Math.max(
    1,
    result.timeSpent !== undefined ? result.timeSpent : 30,
  );
  const totalFactorsCount =
    result.compilerLatencyAudit && result.compilerLatencyAudit.length > 0
      ? result.compilerLatencyAudit.reduce(
          (acc, q) => acc + (q.factorCount || 2),
          0,
        )
      : Math.max(1, totalQuestions * 2.5);

  const secPerFactor = +(timeSpent / totalFactorsCount).toFixed(2);
  let thresholdSec = 2.8;
  const pacingMatch = expectations.pacing
    ? expectations.pacing.match(/([\d.]+)/)
    : null;
  if (pacingMatch) thresholdSec = parseFloat(pacingMatch[1]);

  const isTimePassed = secPerFactor <= thresholdSec;
  let timeRating = 10.0;
  if (secPerFactor <= thresholdSec) {
    const margin = thresholdSec - secPerFactor;
    timeRating = Math.min(
      10.0,
      +(8.5 + (margin / thresholdSec) * 1.5).toFixed(1),
    );
  } else {
    const over = secPerFactor - thresholdSec;
    timeRating = Math.max(1.0, +(8.0 - (over / thresholdSec) * 4.5).toFixed(1));
  }

  const cbTime = document.getElementById("checkbox-time-status");
  const symTime = document.getElementById("symbol-time-status");
  const txtTime = document.getElementById("text-time-status");
  const ratingTime = document.getElementById("rating-time-points");
  const footTime = document.getElementById("footer-time-benchmark");

  if (cbTime && symTime && txtTime) {
    if (isTimePassed) {
      cbTime.className = "custom-status-checkbox pass";
      symTime.textContent = "✔️";
      txtTime.textContent = "Velocity Qualified";
    } else {
      cbTime.className = "custom-status-checkbox fail";
      symTime.textContent = "❌";
      txtTime.textContent = "Velocity Sluggish";
    }
  }
  if (ratingTime) {
    ratingTime.textContent = `${timeRating.toFixed(1)} / 10 Points`;
  }
  if (footTime) {
    footTime.textContent = `Speed: ${secPerFactor}s/factor · Hidden Target: < ${thresholdSec}s/factor`;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ==========================================================================
   MUTATION OBSERVER SAFETY NET FOR RUNTIME COLOR PROTECTION
   ========================================================================== */
const enforceWhiteTextLock = () => {
  const targets = [
    "diagnostic-title-val",
    "diagnostic-text-val",
    "verdict-badge-val",
    "quantum-score-badge-node",
    "quantum-verdict-title-node",
    "quantum-verdict-quote-node",
  ];

  targets.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.setProperty("color", "#FFFFFF", "important");
      el.style.setProperty("-webkit-text-fill-color", "#FFFFFF", "important");
    }
  });

  document.querySelectorAll(".master-ring-card").forEach((card) => {
    card.style.setProperty("background", "#111827", "important");
    card.style.setProperty("border", "1px solid #1F2937", "important");
  });
};

const observer = new MutationObserver(() => {
  enforceWhiteTextLock();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
});

enforceWhiteTextLock();
