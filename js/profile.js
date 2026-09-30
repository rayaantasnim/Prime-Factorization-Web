/**
 * PrimeFactor.app — Candidate Academic Profile & Telemetry Controller
 * Implements Profile Command Matrix Overlay, PB Milestone Audit,
 * 10-Contests Registry Matrix, and Precision Clipboard Telemetry Multi-Buttons.
 */

import { getLedger, getLastExamResult, getSettings } from './storage.js';
import { playSound } from './audio.js';
import { renderFooter } from './header.js';
import { getUserElo, getUserPeakElo, getTierByElo, formatLocalDateString } from './elo-engine.js';

document.addEventListener('DOMContentLoaded', () => {
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
      e.stopPropagation();
      playSound('click');
      window.location.href = './profile-settings.html';
    }, true);
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
 * Diagnostics JSON Backup Download Generator
 */
function exportDiagnosticsBackup() {
  try {
    const backupData = {
      app: 'Prime-Factor.app',
      certifier: 'Rayaan Tasnim',
      organization: 'Olympiad Edge',
      timestamp: new Date().toISOString(),
      ledger: getLedger(),
      lastResult: getLastExamResult(),
      settings: getSettings()
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `primefactor-profile-diagnostics-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Failed to export diagnostics:', err);
  }
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

  // Surgical isolation of single fastest valid clear duration from authentic cache
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

  // Populate PB Milestone Cards
  const elHighestTier = document.getElementById('pb-highest-tier');
  const elHighestSpeed = document.getElementById('pb-highest-speed');
  const elWidgetDate = document.getElementById('pb-widget-date');
  const elWidgetTime = document.getElementById('pb-widget-time');
  const elWidgetTier = document.getElementById('pb-widget-tier');
  const elMaxRating = document.getElementById('pb-max-rating');
  const elMaxStreak = document.getElementById('pb-max-streak');
  const elMaxRank = document.getElementById('pb-max-rank');

  if (elHighestTier) {
    if (matchRegistry.length > 0) {
      elHighestTier.textContent = matchRegistry[0].tier.split('(')[0].trim();
    } else if (lastResult?.rangeTitle) {
      elHighestTier.textContent = lastResult.rangeTitle.split('(')[0].trim();
    } else {
      elHighestTier.textContent = '—';
    }
  }

  if (elHighestSpeed) {
    elHighestSpeed.textContent = fastestMatch ? `${Number(fastestMatch.time).toFixed(1)}s` : '—';
  }

  // 3-Layer "Lowest Time Consumption" widget card layout:
  // Layer 1: Date of Performance
  // Layer 2: Total Time Expended (high-precision duration in seconds)
  // Layer 3: Tier Title Achieved (color-coded)
  if (fastestMatch) {
    if (elWidgetDate) elWidgetDate.textContent = fastestMatch.date || '—';
    if (elWidgetTime) elWidgetTime.textContent = `${Number(fastestMatch.time).toFixed(1)}s Elapsed`;
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

  // Career Overview Sync: fully driven by localStorage ledger values, fallback to 0
  const lifetimePeakStreak = Number(ledger.bestStreak || 0);
  const lifetimeClearedComposites = Number(ledger.totalSolved || 0);
  const activeStreak = Number(ledger.currentStreak || 0);

  if (elMaxStreak) {
    elMaxStreak.textContent = `${lifetimePeakStreak} Matches`;
  }
  if (elMaxRank) {
    elMaxRank.textContent = `${peakTier.symbol} ${peakTier.title}`;
    elMaxRank.style.color = peakTier.colorHex;
    elMaxRank.style.textShadow = `0 0 16px ${peakTier.colorHex}`;
  }

  // Populate Streak Telemetry
  const elActiveStreak = document.getElementById('streak-active-val');
  const elPeakStreak = document.getElementById('streak-peak-val');
  const elSlump = document.getElementById('streak-slump-val');
  const elComposites = document.getElementById('streak-composites-val');

  if (elActiveStreak) elActiveStreak.textContent = `${activeStreak} Matches`;
  if (elPeakStreak) elPeakStreak.textContent = `${lifetimePeakStreak} Clears`;
  if (elSlump) elSlump.textContent = '0.00%';
  if (elComposites) elComposites.textContent = `${lifetimeClearedComposites} Solved`;

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
        let trueAccuracy = 0;
        if (m.firstAttemptClears !== undefined && m.totalQuestions && Number(m.totalQuestions) > 0) {
          trueAccuracy = Math.round((Number(m.firstAttemptClears) / Number(m.totalQuestions)) * 100);
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

        return `
          <tr>
            <td style="font-weight: 700; color: #FFFFFF;">${m.tier || 'Custom'}</td>
            <td class="tabular-nums font-bold" style="color: ${trueAccuracy >= 90 ? '#34D399' : (trueAccuracy >= 75 ? '#FBBF24' : '#EF4444')};">${trueAccuracy}%</td>
            <td class="tabular-nums font-mono">${m.time}s</td>
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
      const peakStreak = Number(ledger.bestStreak || 0);
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
}
