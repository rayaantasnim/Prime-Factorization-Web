/**
 * PrimeFactor.app — Candidate Academic Profile & Telemetry Controller
 * Implements Profile Command Matrix Overlay, PB Milestone Audit,
 * 10-Contests Registry Matrix, and Precision Clipboard Telemetry Multi-Buttons.
 */

import { getLedger, getLastExamResult, getSettings, compute64BitBackupHash, ENGINE_HMAC_SECRET, addNotification, clearLedger } from './storage.js';
import { playSound } from './audio.js';
import { renderFooter, initGlobalHeader, triggerFlash } from './header.js';
import {
  getUserElo,
  getUserPeakElo,
  setUserElo,
  getTierByElo,
  formatLocalDateString,
  reSignProfileDirectory,
  renderPermanentBanScreen,
  renderTemporalLockoutScreen,
  generateUniqueTokenHandle
} from './elo-engine.js';
import { MEDALS_CATALOG } from './medals-catalog.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader();
  renderFooter();
  initProfileSettingsRedirect();
  initCommandMatrixOverlay();
  renderProfileMetrics();
  initClipboardButtons();
});

/**
 * MANDATORY BOUNDARY ENFORCEMENT:
 * On profile.html, clicking the global top settings (gear) icon must cleanly
 * execute a window redirection directly to the hidden 'profile-settings.html' asset portal.
 */
function initProfileSettingsRedirect() {
  const settingsToggleBtn = document.getElementById('settings-toggle-btn');
  if (settingsToggleBtn) {
    settingsToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      playSound('click');
      window.location.href = './profile-settings.html';
    });
  }
}

/**
 * 1. THE FLOATING PROFILE COMMAND MATRIX OVERLAY CONTROLLER
 */
function initCommandMatrixOverlay() {
  const triggerBtn = document.getElementById('profile-matrix-trigger');
  const overlay = document.getElementById('profile-matrix-overlay');
  const closeBtn = document.getElementById('close-matrix-overlay-btn');
  const navCards = document.querySelectorAll('[data-matrix-nav="true"]');
  const diagnosticsPortal = document.getElementById('matrix-portal-diagnostics');

  if (!triggerBtn || !overlay) return;

  const openOverlay = () => {
    playSound('click');
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (window.gsap) {
      window.gsap.fromTo('.matrix-routing-card',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
      );
    }
  };

  const closeOverlay = () => {
    playSound('click');
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  triggerBtn.addEventListener('click', openOverlay);
  if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeOverlay();
    }
  });

  // Smooth scroll and auto-close when clicking an in-page portal anchor
  navCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const targetHash = card.getAttribute('href');
      if (targetHash && targetHash.startsWith('#')) {
        e.preventDefault();
        closeOverlay();
        const targetElement = document.querySelector(targetHash);
        if (targetElement) {
          setTimeout(() => {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }
      }
    });
  });

  // Diagnostics Export Portal
  if (diagnosticsPortal) {
    diagnosticsPortal.addEventListener('click', () => {
      playSound('click');
      exportDiagnosticsBackup();
      closeOverlay();
    });
  }
}

/**
 * 64-BIT MASHED HASH BACKUP INTEGRITY CONTROL GATE & RECOVERY SYSTEM
 */

function countEarnedMedals(ctx) {
  let earned = 0;
  if (!Array.isArray(MEDALS_CATALOG)) return 0;
  for (const m of MEDALS_CATALOG) {
    try {
      if (typeof m.check === 'function' && m.check(ctx)) {
        earned++;
      }
    } catch {
      // safe fallback
    }
  }
  return earned;
}

function buildEvaluationContext(metrics = {}) {
  const ledger = metrics.ledger || getLedger();
  const currentElo = Number(metrics.elo !== undefined ? metrics.elo : getUserElo());
  const peakElo = Number(metrics.peak_elo !== undefined ? metrics.peak_elo : getUserPeakElo());
  const activeTier = getTierByElo(currentElo);
  const securityStrikes = Number(metrics.active_security_strikes !== undefined ? metrics.active_security_strikes : (localStorage.getItem('primefactor_security_strikes') || 0));

  let matchRegistry = [];
  if (Array.isArray(metrics.match_logs)) {
    matchRegistry = metrics.match_logs;
  } else {
    try {
      const raw = localStorage.getItem('primefactor_match_logs');
      if (raw) matchRegistry = JSON.parse(raw);
      if (!Array.isArray(matchRegistry)) matchRegistry = [];
    } catch (e) {
      matchRegistry = [];
    }
  }

  let fastestMatch = null;
  let minTime = Infinity;
  for (const m of matchRegistry) {
    const t = parseFloat(m.time);
    if (!isNaN(t) && t > 0 && t < minTime) {
      minTime = t;
      fastestMatch = m;
    }
  }

  let sumClears = 0;
  for (const m of matchRegistry) {
    const c = (Number(m.firstAttemptClears || 0) + Number(m.secondAttemptClears || 0)) ||
              Number(m.correctCount || 0) ||
              (m.accuracy ? Math.round((m.accuracy / 100) * (m.totalQuestions || 10)) : 0);
    sumClears += c;
  }

  const totalSolved = Math.max(
    Number(ledger.totalSolved || 0),
    Number(metrics.total_solved || localStorage.getItem('primefactor_total_solved') || 0),
    sumClears
  );
  const bestStreak = Math.max(Number(ledger.bestStreak || 0), Number(ledger.currentStreak || 0));

  return {
    ledger,
    lastResult: metrics.lastResult || getLastExamResult(),
    currentElo,
    peakElo,
    activeTier,
    securityStrikes,
    matchRegistry,
    fastestMatch,
    totalSolved,
    bestStreak
  };
}

/**
 * Diagnostics JSON Backup Download Generator with 64-Bit Sealed HMAC Hash
 */
export function exportDiagnosticsBackup() {
  try {
    const currentElo = getUserElo();
    const peakElo = getUserPeakElo();
    const ledger = getLedger();
    const settings = getSettings();
    const lastResult = getLastExamResult();
    const username = localStorage.getItem('primefactor_profile_username') || 'Rayaan Tasnim';
    const token = localStorage.getItem('primefactor_profile_token') || 'OLY-PF-746525000545';
    const activeStrikes = Number(localStorage.getItem('primefactor_security_strikes') || 0);

    let matchLogs = [];
    try {
      const raw = localStorage.getItem('primefactor_match_logs');
      if (raw) matchLogs = JSON.parse(raw);
      if (!Array.isArray(matchLogs)) matchLogs = [];
    } catch (e) {
      matchLogs = [];
    }

    const totalSolved = Math.max(
      Number(ledger.totalSolved || 0),
      Number(localStorage.getItem('primefactor_total_solved') || 0)
    );
    const examsCompleted = Math.max(
      Number(ledger.examsCompleted || 0),
      Number(localStorage.getItem('primefactor_total_matches') || 0)
    );
    const currentWinStreak = Number(ledger.currentStreak || 0);

    const evalCtx = buildEvaluationContext({
      elo: currentElo,
      peak_elo: peakElo,
      ledger,
      match_logs: matchLogs,
      active_security_strikes: activeStrikes,
      total_solved: totalSolved
    });

    const earnedMedalsCount = countEarnedMedals(evalCtx);

    const payload = {
      elo: currentElo,
      peak_elo: peakElo,
      total_solved: totalSolved,
      exams_completed: examsCompleted,
      active_security_strikes: activeStrikes,
      current_win_streak: currentWinStreak,
      medals: earnedMedalsCount
    };

    // Calculate exact 64-bit verification hash sealed with ENGINE_HMAC_SECRET
    const hash = compute64BitBackupHash(payload, ENGINE_HMAC_SECRET);

    const backupData = {
      backup_verification_hash: hash,
      app: 'Prime-Factor.app',
      version: '3.0.0',
      certifier: 'Rayaan Tasnim',
      organization: 'Olympiad Edge',
      timestamp: new Date().toISOString(),
      candidate: {
        username,
        token,
        elo: currentElo,
        peak_elo: peakElo,
        active_security_strikes: activeStrikes
      },
      elo: currentElo,
      peak_elo: peakElo,
      total_solved: totalSolved,
      exams_completed: examsCompleted,
      active_security_strikes: activeStrikes,
      current_win_streak: currentWinStreak,
      medals: earnedMedalsCount,
      metrics: payload,
      ledger,
      settings,
      lastResult,
      match_logs: matchLogs
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `primefactor-profile-diagnostics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export diagnostics:', err);
  }
}

/**
 * Strict Import Validation Pipeline & Integrity Gateway
 */
export function importDiagnosticsBackup(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      let data;
      try {
        data = JSON.parse(content);
      } catch {
        executeDishonestyLadder('Malformed JSON Syntax');
        return;
      }

      if (!data || typeof data !== 'object') {
        executeDishonestyLadder('Invalid JSON Object Schema');
        return;
      }

      const providedHash = data.backup_verification_hash;
      if (!providedHash || typeof providedHash !== 'string' || providedHash.trim().length !== 16) {
        executeDishonestyLadder('Missing or Malformed 64-Bit Verification Hash');
        return;
      }

      // Extract metrics
      const elo = Number(data.elo ?? data.metrics?.elo ?? data.candidate?.elo ?? 500);
      const peak_elo = Number(data.peak_elo ?? data.metrics?.peak_elo ?? data.candidate?.peak_elo ?? elo);
      const total_solved = Number(data.total_solved ?? data.metrics?.total_solved ?? (data.ledger?.totalSolved ?? 0));
      const exams_completed = Number(data.exams_completed ?? data.metrics?.exams_completed ?? (data.ledger?.examsCompleted ?? 0));
      const active_security_strikes = Number(data.active_security_strikes ?? data.metrics?.active_security_strikes ?? (data.candidate?.active_security_strikes ?? 0));
      const current_win_streak = Number(data.current_win_streak ?? data.metrics?.current_win_streak ?? (data.ledger?.currentStreak ?? 0));

      let medals = 0;
      if (Array.isArray(data.medals)) medals = data.medals.length;
      else if (typeof data.medals === 'number') medals = data.medals;
      else if (data.metrics && typeof data.metrics.medals === 'number') medals = data.metrics.medals;

      // Bound & Sanity Checks
      if (isNaN(elo) || isNaN(peak_elo) || isNaN(total_solved) || isNaN(exams_completed) ||
          isNaN(active_security_strikes) || isNaN(current_win_streak) || isNaN(medals)) {
        executeDishonestyLadder('Corrupted Numerical Types');
        return;
      }

      if (elo < 0 || peak_elo < 0 || total_solved < 0 || exams_completed < 0 ||
          active_security_strikes < 0 || current_win_streak < 0 || medals < 0) {
        executeDishonestyLadder('Negative Metric Bounds Violation');
        return;
      }

      if (peak_elo < elo) {
        executeDishonestyLadder('Peak ELO Below Current Rating');
        return;
      }

      if (current_win_streak > exams_completed) {
        executeDishonestyLadder('Streak Exceeds Total Completed Matches');
        return;
      }

      // Re-calculate expected 64-bit verification hash using client's ENGINE_HMAC_SECRET
      const expectedHash = compute64BitBackupHash({
        elo,
        peak_elo,
        total_solved,
        exams_completed,
        active_security_strikes,
        current_win_streak,
        medals
      }, ENGINE_HMAC_SECRET);

      if (providedHash.toUpperCase() !== expectedHash.toUpperCase()) {
        executeDishonestyLadder('Cryptographic Signature Mismatch');
        return;
      }

      // Verification passed! Commit verified state cleanly
      localStorage.setItem('primefactor_elo', String(elo));
      localStorage.setItem('primefactor_peak_elo', String(peak_elo));
      localStorage.setItem('primefactor_total_solved', String(total_solved));
      localStorage.setItem('primefactor_total_matches', String(exams_completed));
      localStorage.setItem('primefactor_security_strikes', String(active_security_strikes));

      if (data.candidate?.username || data.username) {
        localStorage.setItem('primefactor_profile_username', data.candidate?.username || data.username);
      }
      if (data.candidate?.token || data.token) {
        localStorage.setItem('primefactor_profile_token', data.candidate?.token || data.token);
      }
      if (data.ledger && typeof data.ledger === 'object') {
        localStorage.setItem('primefactor_ledger', JSON.stringify(data.ledger));
      }
      if (data.settings && typeof data.settings === 'object') {
        localStorage.setItem('primefactor_settings', JSON.stringify(data.settings));
      }
      if (data.match_logs && Array.isArray(data.match_logs)) {
        localStorage.setItem('primefactor_match_logs', JSON.stringify(data.match_logs));
      }
      if (data.lastResult && typeof data.lastResult === 'object') {
        localStorage.setItem('primefactor_last_result', JSON.stringify(data.lastResult));
      }

      reSignProfileDirectory();
      playSound('correct');

      renderImportSuccessOverlay();
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error('Import processing error:', err);
      executeDishonestyLadder('Runtime State Parse Failure');
    }
  };

  reader.onerror = () => {
    executeDishonestyLadder('Disk Read Stream Error');
  };

  reader.readAsText(file);
}

/**
 * Escalating Dishonesty Hammer Penalty Ladder
 */
export function executeDishonestyLadder(reason = 'Cryptographic Hash Mismatch') {
  let tamperCount = Number(localStorage.getItem('primefactor_tamper_import_count') || 0);
  tamperCount += 1;
  localStorage.setItem('primefactor_tamper_import_count', String(tamperCount));

  playSound('wrong');

  if (tamperCount === 1) {
    // TIER 1 (1st Mismatch): Flat -50 ELO penalty, in-app push notification, technical warning overlay
    const current = getUserElo();
    const newElo = Math.max(0, current - 50);
    setUserElo(newElo);
    reSignProfileDirectory();

    addNotification({
      type: 'security_tampering',
      title: 'SECURITY TAMPER ADVISORY',
      message: '🚨 SECURITY TAMPER ADVISORY: Invalid or fabricated backup hash detected. 50 ELO deducted.'
    });

    renderDishonestyFreezeOverlay(
      '🚨 SECURITY TAMPER ADVISORY (TIER 1)',
      `An invalid, tampered, or fabricated 64-bit backup verification hash was detected (${reason}). A disciplinary flat -50 ELO deduction has been applied to your candidate ledger.`
    );
  } else if (tamperCount === 2) {
    // TIER 2 (2nd Mismatch): Flat -100 ELO penalty, collapse peak ELO to current, append permanent disciplinary record to match logs
    const current = getUserElo();
    const newElo = Math.max(0, current - 100);
    setUserElo(newElo);
    localStorage.setItem('primefactor_peak_elo', String(newElo));

    try {
      const rawLogs = localStorage.getItem('primefactor_match_logs');
      const logs = rawLogs ? JSON.parse(rawLogs) : [];
      logs.unshift({
        id: `tamper-${Date.now()}`,
        tier: 'DISCIPLINARY TAMPER INFRACTION',
        score: -100,
        eloDelta: -100,
        accuracy: 0,
        time: '0.0',
        date: formatLocalDateString(),
        notes: `Tier 2 Repeated Tamper Violation: ${reason}.`
      });
      localStorage.setItem('primefactor_match_logs', JSON.stringify(logs));
    } catch (e) {}

    reSignProfileDirectory();

    addNotification({
      type: 'security_tampering',
      title: 'REPEATED TAMPER VIOLATION',
      message: '🚨 REPEATED TAMPER VIOLATION: Disciplinary -100 ELO and Peak ELO revoked.'
    });

    renderDishonestyFreezeOverlay(
      '🚨 REPEATED TAMPER VIOLATION (TIER 2)',
      `Repeated cryptographic hash failure detected (${reason}). Disciplinary penalty of -100 ELO applied, Peak ELO revoked to current ELO, and a permanent violation record entered into your competition registry.`
    );
  } else if (tamperCount === 3) {
    // TIER 3 (3rd Mismatch — Ledger Liquidation): Wipe career ledger, reset streaks, drop ELO to 0, zero medals
    clearLedger();
    localStorage.setItem('primefactor_total_solved', '0');
    localStorage.setItem('primefactor_total_matches', '0');
    localStorage.setItem('primefactor_historical_accuracy', '0');
    localStorage.setItem('primefactor_elo', '0');
    localStorage.setItem('primefactor_peak_elo', '0');
    reSignProfileDirectory();

    addNotification({
      type: 'security_tampering',
      title: 'DISCIPLINARY LEDGER LIQUIDATION',
      message: '🚨 DISCIPLINARY LEDGER LIQUIDATION: 3rd Tamper strike. Career ledger liquidated to 0 ELO.'
    });

    renderDishonestyFreezeOverlay(
      '🚨 CAREER LEDGER LIQUIDATION (TIER 3)',
      `3rd Cryptographic Tamper Strike Detected (${reason}). Complete Ledger Liquidation enforced: All career milestones, streaks, and composite clears have been purged, and your rating has been dropped to 0 ELO.`
    );
  } else if (tamperCount === 4) {
    // TIER 4 (4th Mismatch — Temporal Lockout): 1-Month (30-day) lockout marker in storage and cookies
    const lockoutUntil = Date.now() + (30 * 24 * 60 * 60 * 1000);
    localStorage.setItem('primefactor_lockout_until', String(lockoutUntil));
    try {
      document.cookie = `primefactor_lockout_until=${lockoutUntil}; path=/; max-age=${30 * 24 * 3600}; SameSite=Strict`;
    } catch (e) {}

    renderTemporalLockoutScreen(lockoutUntil);
  } else {
    // TIER 5 (5th Mismatch — Permanent Blacklist Ban)
    localStorage.setItem('primefactor_banned', 'PERMANENTLY_BANNED');
    sessionStorage.setItem('primefactor_banned', 'PERMANENTLY_BANNED');
    try {
      document.cookie = `primefactor_banned=PERMANENTLY_BANNED; path=/; max-age=315360000; SameSite=Strict`;
    } catch (e) {}

    renderPermanentBanScreen();
  }
}

/**
 * Disciplinary Freeze Overlay
 */
function renderDishonestyFreezeOverlay(title, description) {
  const existing = document.getElementById('tamper-freeze-overlay');
  if (existing) existing.remove();

  const tamperCount = Number(localStorage.getItem('primefactor_tamper_import_count') || 1);

  const overlay = document.createElement('div');
  overlay.id = 'tamper-freeze-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(10, 15, 30, 0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    box-sizing: border-box;
    animation: fadeIn 0.3s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(239, 68, 68, 0.5);
      box-shadow: 0 0 50px rgba(239, 68, 68, 0.3), inset 0 0 30px rgba(239, 68, 68, 0.1);
      border-radius: 16px;
      max-width: 580px;
      width: 100%;
      padding: 2.25rem;
      text-align: center;
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="font-size: 3rem; margin-bottom: 0.75rem;">🛡️⚠️</div>
      <div style="
        display: inline-block;
        padding: 0.3rem 0.85rem;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid #EF4444;
        border-radius: 9999px;
        color: #FCA5A5;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 1rem;
      ">
        Integrity Control Gate Breach (Strike ${tamperCount} of 5)
      </div>
      <h2 style="
        color: #EF4444;
        font-size: 1.4rem;
        font-weight: 800;
        margin-bottom: 1rem;
        text-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
      ">
        ${title}
      </h2>
      <p style="
        color: #CBD5E1;
        font-size: 0.95rem;
        line-height: 1.6;
        margin-bottom: 1.75rem;
      ">
        ${description}
      </p>
      <div style="
        background: rgba(0, 0, 0, 0.4);
        border-left: 3px solid #EF4444;
        padding: 0.75rem 1rem;
        text-align: left;
        font-family: monospace;
        font-size: 0.8rem;
        color: #94A3B8;
        margin-bottom: 1.75rem;
      ">
        <div>> TAMPER_COUNT: ${tamperCount}</div>
        <div>> AUDIT_STATUS: REJECTED_SIGNATURE_MISMATCH</div>
        <div>> DISCIPLINARY_ACTION: APPLIED</div>
      </div>
      <button id="btn-acknowledge-tamper" style="
        background: #DC2626;
        color: #FFFFFF;
        border: none;
        padding: 0.85rem 2rem;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 0 20px rgba(220, 38, 38, 0.4);
      ">
        Acknowledge &amp; Refresh State
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const btnAck = document.getElementById('btn-acknowledge-tamper');
  if (btnAck) {
    btnAck.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

/**
 * Import Success Overlay
 */
function renderImportSuccessOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'import-success-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(10, 15, 30, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
  `;
  overlay.innerHTML = `
    <div style="
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(56, 189, 248, 0.5);
      box-shadow: 0 0 40px rgba(56, 189, 248, 0.25);
      border-radius: 16px;
      padding: 2.5rem 3rem;
      text-align: center;
      color: #F8FAFC;
    ">
      <div style="font-size: 3rem; margin-bottom: 0.75rem;">✔️🔐</div>
      <h2 style="color: #38BDF8; font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem;">
        Integrity Gate Verified
      </h2>
      <p style="color: #94A3B8; font-size: 0.95rem; margin-bottom: 0;">
        64-Bit cryptographic seal verified. Re-signing directory and refreshing state...
      </p>
    </div>
  `;
  document.body.appendChild(overlay);
}

/**
 * 2. PERSONAL BEST (PB) MILESTONES & LAST 10 PERFORMANCES REGISTRY
 */
function getTierMaxFromTitle(title) {
  if (!title) return 200;
  const match = String(title).match(/(\d+[\d,]*)\s*$/) || String(title).match(/-\s*(\d+[\d,]*)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10) || 200;
  }
  return 200;
}

function renderProfileMetrics() {
  const ledger = getLedger();
  const lastResult = getLastExamResult();

  // Master ELO Matrix & Identity Synchronization
  const currentElo = getUserElo();
  const peakElo = getUserPeakElo();
  const activeTier = getTierByElo(currentElo);
  const peakTier = getTierByElo(peakElo);

  // Custom User Handle & Cryptographic Token
  const customUser = localStorage.getItem('primefactor_profile_username') || localStorage.getItem('primefactor_profile_token') || 'Rayaan Tasnim';
  const token = localStorage.getItem('primefactor_profile_token') || 'OLY-PF-746525000545';

  const profileDisplayName = document.getElementById('profile-display-name');
  if (profileDisplayName) profileDisplayName.textContent = customUser;

  const tokenBadge = document.getElementById('profile-token-badge') || document.querySelector('.identity-token-badge');
  if (tokenBadge) tokenBadge.textContent = token;

  const rankTag = document.getElementById('profile-rank-tag') || document.querySelector('.identity-rank-tag');
  if (rankTag) {
    rankTag.textContent = `${activeTier.symbol} ${activeTier.title}`;
    rankTag.style.color = activeTier.colorHex;
    rankTag.style.borderColor = activeTier.colorHex;
    rankTag.style.background = `${activeTier.colorHex}22`;
  }

  const profileEloTag = document.getElementById('profile-elo-tag');
  if (profileEloTag) {
    profileEloTag.textContent = `${currentElo.toLocaleString()} ELO (Live Rating)`;
    profileEloTag.style.color = activeTier.colorHex;
  }

  const divisionTag = document.getElementById('profile-division-tag');
  if (divisionTag) {
    const rangeText = activeTier.maxElo === Infinity ? '3,000+ ELO' : `${activeTier.minElo.toLocaleString()} - ${activeTier.maxElo.toLocaleString()} ELO`;
    divisionTag.textContent = `Division: ${activeTier.title} (${rangeText})`;
  }

  // Load Real Match Registry Logs from Cache (Purged fake dummy records)
  let matchRegistry = [];
  try {
    const rawLogs = localStorage.getItem('primefactor_match_logs');
    if (rawLogs) {
      matchRegistry = JSON.parse(rawLogs);
      if (!Array.isArray(matchRegistry)) matchRegistry = [];
    }
  } catch (e) {
    console.warn('Error reading match logs:', e);
    matchRegistry = [];
  }

  // 1. Surgical isolation of single fastest valid clear duration from authentic cache
  let fastestMatch = null;
  let minDuration = Infinity;

  if (matchRegistry.length > 0) {
    for (let i = 0; i < matchRegistry.length; i++) {
      const m = matchRegistry[i];
      const duration = parseFloat(m.time);
      if (!isNaN(duration) && duration > 0 && duration < minDuration) {
        minDuration = duration;
        fastestMatch = m;
      }
    }
  }

  if (!fastestMatch && lastResult && lastResult.timeSpent) {
    const lrTime = parseFloat(lastResult.timeSpent);
    if (!isNaN(lrTime) && lrTime > 0) {
      minDuration = lrTime;
      fastestMatch = {
        date: lastResult.timestamp ? formatLocalDateString(new Date(lastResult.timestamp)) : formatLocalDateString(),
        time: lrTime,
        tier: lastResult.rangeTitle || 'Tier 1: 1 - 200'
      };
    }
  }

  // 2. Highest Tier Performed across history
  let highestTierFound = null;
  let maxTierBoundary = 0;
  if (matchRegistry.length > 0) {
    for (const m of matchRegistry) {
      const b = getTierMaxFromTitle(m.tier);
      if (b > maxTierBoundary) {
        maxTierBoundary = b;
        highestTierFound = (m.tier || '').split('(')[0].trim();
      }
    }
  } else if (lastResult?.rangeTitle) {
    highestTierFound = lastResult.rangeTitle.split('(')[0].trim();
  }

  // 3. Scan historic run profiles for peak concurrent winning streak
  let calculatedPeakStreak = 0;
  let currentRun = 0;
  const chronoLogs = [...matchRegistry].reverse();
  for (const m of chronoLogs) {
    const isWin = (Number(m.eloDelta) >= 0 && Number(m.score) > 0) || (Number(m.accuracy) >= 70) || (Number(m.firstAttemptClears) === 10);
    if (isWin) {
      currentRun++;
      if (currentRun > calculatedPeakStreak) calculatedPeakStreak = currentRun;
    } else {
      currentRun = 0;
    }
  }
  const lifetimePeakStreak = Math.max(Number(ledger.bestStreak || 0), calculatedPeakStreak);

  // 4. Cumulative sum engine: First-Chance clears + Second-Chance recovered completions
  let sumClearsFromLogs = 0;
  for (const m of matchRegistry) {
    const clears = (Number(m.firstAttemptClears || 0) + Number(m.secondAttemptClears || 0)) || Number(m.correctCount || 0) || (m.accuracy ? Math.round((m.accuracy / 100) * (m.totalQuestions || 10)) : 0);
    sumClearsFromLogs += clears;
  }
  const storedSolved = Number(localStorage.getItem('primefactor_total_solved') || 0);
  const ledgerSolved = Number(ledger.totalSolved || 0);
  const totalCompositesSolved = Math.max(ledgerSolved, storedSolved, sumClearsFromLogs);

  // Active streak
  const activeStreak = Number(ledger.currentStreak || 0);

  // Populate PB Milestone Cards
  const elHighestTier = document.getElementById('pb-highest-tier');
  const elHighestSpeed = document.getElementById('pb-highest-speed');
  const elWidgetDate = document.getElementById('pb-widget-date');
  const elWidgetTime = document.getElementById('pb-widget-time');
  const elWidgetTier = document.getElementById('pb-widget-tier');
  const elMaxRating = document.getElementById('pb-max-rating');
  const elMaxStreak = document.getElementById('pb-max-streak');
  const elMaxRank = document.getElementById('pb-max-rank');
  const pbRankCard = document.getElementById('pb-card-rank');
  const pbRankBadge = document.getElementById('pb-rank-badge');

  if (elHighestTier) {
    elHighestTier.textContent = highestTierFound || (matchRegistry.length > 0 ? 'Tier 1: 1 - 200' : '—');
  }

  if (elHighestSpeed) {
    elHighestSpeed.textContent = fastestMatch ? `${Number(fastestMatch.time).toFixed(2)}s` : '—';
  }

  // 3-Layer "Lowest Time Consumption" widget card layout:
  // Layer 1: Date of Performance
  // Layer 2: Total Time Expended (high-precision duration in seconds e.g. "34.12s")
  // Layer 3: Tier Title Achieved (color-coded)
  if (fastestMatch) {
    if (elWidgetDate) elWidgetDate.textContent = fastestMatch.date || '—';
    if (elWidgetTime) elWidgetTime.textContent = `${Number(fastestMatch.time).toFixed(2)}s Elapsed`;
    if (elWidgetTier) {
      const tierTitle = (fastestMatch.tier || 'Tier 1: 1 - 200').split('(')[0].trim();
      elWidgetTier.textContent = `${tierTitle} Division`;
      const maxVal = getTierMaxFromTitle(fastestMatch.tier);
      if (maxVal <= 200) elWidgetTier.style.color = '#10B981';
      else if (maxVal <= 500) elWidgetTier.style.color = '#0EA5E9';
      else if (maxVal <= 1000) elWidgetTier.style.color = '#2563EB';
      else if (maxVal <= 2000) elWidgetTier.style.color = '#6366F1';
      else if (maxVal <= 5000) elWidgetTier.style.color = '#8B5CF6';
      else if (maxVal <= 10000) elWidgetTier.style.color = '#EC4899';
      else elWidgetTier.style.color = '#38BDF8';
    }
  } else {
    if (elWidgetDate) elWidgetDate.textContent = '—';
    if (elWidgetTime) elWidgetTime.textContent = '—';
    if (elWidgetTier) {
      elWidgetTier.textContent = '—';
      elWidgetTier.style.color = '#94A3B8';
    }
  }

  if (elMaxRating) {
    elMaxRating.textContent = `${peakElo.toLocaleString()} ELO`;
  }

  if (elMaxStreak) {
    elMaxStreak.textContent = `${lifetimePeakStreak} Matches`;
  }

  if (elMaxRank) {
    elMaxRank.textContent = `${peakTier.symbol} ${peakTier.title}`;
    elMaxRank.style.color = peakTier.colorHex;
    elMaxRank.style.textShadow = `0 0 16px ${peakTier.colorHex}`;
    if (pbRankCard) {
      pbRankCard.style.borderColor = `${peakTier.colorHex}66`;
      pbRankCard.style.boxShadow = `0 0 20px ${peakTier.colorHex}22`;
    }
    if (pbRankBadge) {
      pbRankBadge.style.color = peakTier.colorHex;
      pbRankBadge.style.borderColor = peakTier.colorHex;
      pbRankBadge.style.background = `${peakTier.colorHex}25`;
    }
  }

  // Populate Streak Telemetry Strip
  const elActiveStreak = document.getElementById('streak-active-val');
  const elPeakStreak = document.getElementById('streak-peak-val');
  const elSlump = document.getElementById('streak-slump-val');
  const elComposites = document.getElementById('streak-composites-val');

  if (elActiveStreak) elActiveStreak.textContent = `${activeStreak} Matches`;
  if (elPeakStreak) elPeakStreak.textContent = `${lifetimePeakStreak} Clears`;
  if (elSlump) elSlump.textContent = '0.00%';
  if (elComposites) elComposites.textContent = `${totalCompositesSolved} Solved`;

  // Populate Last 10 Performances Table
  const tbody = document.getElementById('last-10-tbody');
  if (tbody) {
    if (matchRegistry.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2.5rem 1rem; color: #94A3B8; font-size: 0.95rem;">
            No performance logs recorded in this browser profile yet.
          </td>
        </tr>
      `;
    } else {
      const activeRows = matchRegistry.slice(0, 10);
      tbody.innerHTML = activeRows.map((m) => {
        const firstAttempts = Number(m.firstAttemptClears || 0);
        const secondAttempts = Number(m.secondAttemptClears || 0);
        const totalQ = Number(m.totalQuestions) || 10;
        let trueAccuracy = 0;

        if (firstAttempts > 0 || secondAttempts > 0) {
          trueAccuracy = Math.min(100, Math.round(((firstAttempts + secondAttempts) / totalQ) * 100));
        } else if (m.accuracy !== undefined) {
          trueAccuracy = Math.round(Number(m.accuracy));
        }

        const deltaVal = Number(m.eloDelta) || 0;
        let eloTag = `<span class="score-elo-tag neutral">+${m.score ?? 0} pts (+0 ELO)</span>`;
        if (deltaVal > 0) {
          eloTag = `<span class="score-elo-tag">+${m.score ?? 0} pts (+${deltaVal} ELO)</span>`;
        } else if (deltaVal < 0) {
          eloTag = `<span class="score-elo-tag" style="color: #EF4444;">${m.score ?? 0} pts (${deltaVal} ELO)</span>`;
        }

        const durationFormatted = parseFloat(m.time);
        const timeDisplay = !isNaN(durationFormatted) ? `${durationFormatted.toFixed(1)}s` : `${m.time}s`;

        return `
          <tr>
            <td style="font-weight: 700; color: #FFFFFF;">${m.tier || 'Custom'}</td>
            <td class="tabular-nums font-bold" style="color: ${trueAccuracy >= 90 ? '#34D399' : (trueAccuracy >= 75 ? '#FBBF24' : '#EF4444')};">${trueAccuracy}%</td>
            <td class="tabular-nums font-mono">${timeDisplay}</td>
            <td>${eloTag}</td>
            <td class="tabular-nums" style="color: #94A3B8; font-size: 0.825rem;">${m.date || '—'}</td>
          </tr>
        `;
      }).join('');
    }
  }
}

/**
 * 3. PRECISION TELEMETRY CLIPBOARD MULTI-BUTTONS
 */
function initClipboardButtons() {
  const btnAcademic = document.getElementById('btn-copy-academic-profile');
  const btnStreak = document.getElementById('btn-copy-streak-records');
  const btnMilestones = document.getElementById('btn-copy-milestones');
  const btnContests = document.getElementById('btn-copy-contests-ledger');

  const copyToClipboard = async (text, buttonNode, successLabel) => {
    playSound('click');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
    } catch (err) {
      console.warn('Clipboard write fallback error:', err);
    }

    if (buttonNode) {
      const originalHTML = buttonNode.innerHTML;
      buttonNode.textContent = `✔️ ${successLabel} Copied!`;
      buttonNode.classList.add('btn-neon-copied-glow');

      setTimeout(() => {
        buttonNode.innerHTML = originalHTML;
        buttonNode.classList.remove('btn-neon-copied-glow');
      }, 2000);
    }
  };

  // Button 1: Copy Academic Profile
  if (btnAcademic) {
    btnAcademic.addEventListener('click', () => {
      const activeUser = localStorage.getItem('primefactor_profile_username') || localStorage.getItem('primefactor_profile_token') || 'Rayaan Tasnim';
      const token = localStorage.getItem('primefactor_profile_token') || 'OLY-PF-746525000545';
      const currentElo = getUserElo();
      const peakElo = getUserPeakElo();
      const activeTier = getTierByElo(currentElo);
      const ledger = getLedger();

      const academicText = `⚡ Prime-Factor.app Academic Profile Credentials ⚡\n\n` +
        `👤 Competitor: ${activeUser} (Olympiad Contender)\n` +
        `🔑 Token ID: ${token}\n` +
        `🏆 Current Rank: ${activeTier.symbol} ${activeTier.title}\n` +
        `📡 Current ELO: ${currentElo.toLocaleString()} ELO\n` +
        `📈 Peak Rating: ${peakElo.toLocaleString()} ELO\n` +
        `🧩 Solved Composites: ${Number(ledger.totalSolved || 0)}\n` +
        `🛡️ Status: Authenticated Active Contender\n\n` +
        `✨ Certified By Rayaan Tasnim\n` +
        `🚀 Powered by Olympiad Edge\n` +
        `© All rights reserved.`;

      copyToClipboard(academicText, btnAcademic, 'Academic Profile');
    });
  }

  // Button 2: Copy Streak Records
  if (btnStreak) {
    btnStreak.addEventListener('click', () => {
      const ledger = getLedger();
      const activeStreak = Number(ledger.currentStreak || 0);

      // Compute peak streak by taking match logs into account exactly like renderProfileMetrics()
      let matchRegistry = [];
      try {
        const rawLogs = localStorage.getItem('primefactor_match_logs');
        if (rawLogs) {
          matchRegistry = JSON.parse(rawLogs);
          if (!Array.isArray(matchRegistry)) matchRegistry = [];
        }
      } catch (e) {
        matchRegistry = [];
      }

      let calculatedPeakStreak = 0;
      let currentRun = 0;
      const chronoLogs = [...matchRegistry].reverse();
      for (const m of chronoLogs) {
        const isWin = (Number(m.eloDelta) >= 0 && Number(m.score) > 0) || (Number(m.accuracy) >= 70) || (Number(m.firstAttemptClears) === 10);
        if (isWin) {
          currentRun++;
          if (currentRun > calculatedPeakStreak) calculatedPeakStreak = currentRun;
        } else {
          currentRun = 0;
        }
      }

      const peakStreak = Math.max(Number(ledger.bestStreak || 0), calculatedPeakStreak);
      const totalSolved = Number(ledger.totalSolved || 0);

      const streakText = `⚡ Prime-Factor.app Streak Records & Cadence Ledger ⚡\n\n` +
        `🔥 Current Active Streak: ${activeStreak} Matches\n` +
        `👑 Lifetime Peak Streak: ${peakStreak} Consecutive Clears\n` +
        `📉 Slump Index: 0.00% (Nominal Cadence)\n` +
        `🧩 Total Composites Cleared: ${totalSolved} Numbers\n\n` +
        `✨ Certified By Rayaan Tasnim\n` +
        `🚀 Powered by Olympiad Edge\n` +
        `© All rights reserved.`;

      copyToClipboard(streakText, btnStreak, 'Streak Records');
    });
  }

  // Button 3: Copy Lifetime Milestones
  if (btnMilestones) {
    btnMilestones.addEventListener('click', () => {
      const peakElo = getUserPeakElo();
      const peakTier = getTierByElo(peakElo);

      let logs = [];
      try {
        const rawLogs = localStorage.getItem('primefactor_match_logs');
        if (rawLogs) logs = JSON.parse(rawLogs);
      } catch (e) {}

      let fastest = null;
      let minTime = Infinity;
      if (Array.isArray(logs)) {
        logs.forEach(m => {
          const t = parseFloat(m.time);
          if (!isNaN(t) && t > 0 && t < minTime) {
            minTime = t;
            fastest = m;
          }
        });
      }

      const milestonesText = `⚡ Prime-Factor.app Lifetime PB Milestones ⚡\n\n` +
        `🏆 Max Rating Achieved: ${peakElo.toLocaleString()} ELO\n` +
        `👑 Max Rank Achieved: ${peakTier.symbol} ${peakTier.title}\n` +
        `⏱ Lowest Time Consumption: ${fastest ? `${fastest.time}s (${fastest.tier || ''})` : '—'}\n` +
        `📅 PB Milestone Date: ${fastest ? fastest.date : '—'}\n\n` +
        `✨ Certified By Rayaan Tasnim\n` +
        `🚀 Powered by Olympiad Edge\n` +
        `© All rights reserved.`;

      copyToClipboard(milestonesText, btnMilestones, 'Lifetime Milestones');
    });
  }

  // Button 4: Copy Last 10 Contests Ledger
  if (btnContests) {
    btnContests.addEventListener('click', () => {
      let logs = [];
      try {
        const rawLogs = localStorage.getItem('primefactor_match_logs');
        if (rawLogs) logs = JSON.parse(rawLogs);
      } catch (e) {
        console.warn('Error reading logs for clipboard:', e);
      }
      if (!Array.isArray(logs)) logs = [];

      let rowsList = 'No performance logs recorded in this browser profile yet.';
      if (logs.length > 0) {
        rowsList = logs.slice(0, 10).map((m, idx) => {
          const num = String(idx + 1).padStart(2, '0');
          const eloD = Number(m.eloDelta) || 0;
          const eloStr = eloD > 0 ? `+${eloD} ELO` : (eloD < 0 ? `${eloD} ELO` : `+0 ELO`);
          let acc = m.accuracy;
          if (m.firstAttemptClears !== undefined && m.totalQuestions) {
            acc = Math.round((Number(m.firstAttemptClears) / Number(m.totalQuestions)) * 100);
          }
          return `#${num} | ${String(m.tier).padEnd(26, ' ')} | ${String(acc)}% Acc | ${m.time}s | Score: ${m.score} (${eloStr}) | ${m.date}`;
        }).join('\n');
      }

      const contestsText = `⚡ Prime-Factor.app Last 10 Contests Ledger ⚡\n\n` +
        `📊 Logged Matches: ${Math.min(10, logs.length)} Completed\n` +
        `🎯 Current Live ELO: ${getUserElo().toLocaleString()} ELO\n\n` +
        `MATCH REGISTRY:\n` +
        `${rowsList}\n\n` +
        `✨ Certified By Rayaan Tasnim\n` +
        `🚀 Powered by Olympiad Edge\n` +
        `© All rights reserved.`;

      copyToClipboard(contestsText, btnContests, 'Last 10 Contests Ledger');
    });
  }

  // Diagnostics Export Button
  const btnExport = document.getElementById('btn-export-diagnostics');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      playSound('click');
      exportDiagnosticsBackup();
      const originalHTML = btnExport.innerHTML;
      btnExport.textContent = '✔️ State Backup Exported!';
      btnExport.classList.add('btn-neon-copied-glow');
      setTimeout(() => {
        btnExport.innerHTML = originalHTML;
        btnExport.classList.remove('btn-neon-copied-glow');
      }, 2000);
    });
  }

  // Diagnostics Import Button & System File Input Binding
  const btnImport = document.getElementById('btn-import-diagnostics');
  const inputImport = document.getElementById('input-import-backup');
  if (btnImport && inputImport) {
    btnImport.addEventListener('click', () => {
      playSound('click');
      inputImport.value = ''; // Reset file input to allow re-uploading identical file
      inputImport.click();
    });

    inputImport.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        importDiagnosticsBackup(file);
      }
    });
  }
}
