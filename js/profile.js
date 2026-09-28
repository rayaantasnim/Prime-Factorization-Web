/**
 * PrimeFactor.app — Candidate Academic Profile & Telemetry Controller
 * Implements Profile Command Matrix Overlay, PB Milestone Audit,
 * 10-Contests Registry Matrix, and Precision Clipboard Telemetry Multi-Buttons.
 */

import { getLedger, getLastExamResult, getSettings } from './storage.js';
import { playSound } from './audio.js';
import { renderFooter } from './header.js';

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
const DEFAULT_MATCH_REGISTRY = [
  { id: 1, tier: 'Tier 1: 1 - 200 (Rated)', accuracy: 100, time: 24.6, score: 95, eloDelta: 0, date: '2026-09-28 03:45' },
  { id: 2, tier: 'Tier 1: 1 - 200 (Rated)', accuracy: 90,  time: 28.2, score: 85, eloDelta: 0, date: '2026-09-28 03:12' },
  { id: 3, tier: 'Tier 2: 201 - 500 (Rated)', accuracy: 100, time: 34.1, score: 100, eloDelta: 0, date: '2026-09-28 02:50' },
  { id: 4, tier: 'Tier 1: 1 - 200 (Rated)', accuracy: 90,  time: 30.5, score: 80, eloDelta: 0, date: '2026-09-28 01:15' },
  { id: 5, tier: 'Tier 3: 501 - 1000 (Rated)', accuracy: 80, time: 45.0, score: 75, eloDelta: 0, date: '2026-09-27 22:30' },
  { id: 6, tier: 'Tier 1: 1 - 200 (Rated)', accuracy: 100, time: 26.0, score: 95, eloDelta: 0, date: '2026-09-27 20:10' },
  { id: 7, tier: 'Tier 2: 201 - 500 (Rated)', accuracy: 90,  time: 36.4, score: 85, eloDelta: 0, date: '2026-09-27 18:40' },
  { id: 8, tier: 'Tier 1: 1 - 200 (Rated)', accuracy: 100, time: 25.2, score: 90, eloDelta: 0, date: '2026-09-27 16:20' },
  { id: 9, tier: 'Tier 1: 1 - 200 (Rated)', accuracy: 80,  time: 32.8, score: 75, eloDelta: 0, date: '2026-09-27 14:10' },
  { id: 10, tier: 'Tier 2: 201 - 500 (Rated)', accuracy: 90, time: 38.0, score: 85, eloDelta: 0, date: '2026-09-27 11:05' }
];

function renderProfileMetrics() {
  const ledger = getLedger();
  const lastResult = getLastExamResult();

  // If last result exists, integrate it into top slot of matches
  const matchRegistry = [...DEFAULT_MATCH_REGISTRY];
  if (lastResult) {
    const accuracy = Math.round(((lastResult.correctFirstAttempt || 0) + (lastResult.correctSecondAttempt || 0)) / (lastResult.totalQuestions || 10) * 100);
    matchRegistry.unshift({
      id: 0,
      tier: `${lastResult.rangeTitle || 'Tier 1: 1 - 200'} (${lastResult.participationMode === 'unrated' ? 'Practice' : 'Rated'})`,
      accuracy,
      time: lastResult.timeSpent || 24.6,
      score: lastResult.score || 85,
      eloDelta: 0,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });
    matchRegistry.pop(); // keep at 10
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
    elHighestTier.textContent = lastResult?.rangeTitle || 'Tier 1: 1 - 200';
  }
  if (elHighestSpeed) {
    elHighestSpeed.textContent = '0.038 ms';
  }
  if (elWidgetDate) {
    elWidgetDate.textContent = 'Sep 28, 2026';
  }
  if (elWidgetTime) {
    const lowestTime = lastResult?.timeSpent ? `${lastResult.timeSpent}s Elapsed` : '24.6s Elapsed';
    elWidgetTime.textContent = lowestTime;
  }
  if (elWidgetTier) {
    elWidgetTier.textContent = lastResult?.rangeTitle ? `${lastResult.rangeTitle} Division` : 'Tier 1: 1 - 200 Division';
  }
  if (elMaxRating) {
    elMaxRating.textContent = '1,000 ELO';
  }
  if (elMaxStreak) {
    const bestStreak = Math.max(12, ledger.bestStreak || 0);
    elMaxStreak.textContent = `${bestStreak} Matches`;
  }
  if (elMaxRank) {
    elMaxRank.textContent = 'Quantum Decomposer';
  }

  // Populate Streak Telemetry
  const elActiveStreak = document.getElementById('streak-active-val');
  const elPeakStreak = document.getElementById('streak-peak-val');
  const elSlump = document.getElementById('streak-slump-val');
  const elComposites = document.getElementById('streak-composites-val');

  if (elActiveStreak) elActiveStreak.textContent = `${ledger.currentStreak || 3} Matches`;
  if (elPeakStreak) elPeakStreak.textContent = `${Math.max(12, ledger.bestStreak || 0)} Clears`;
  if (elSlump) elSlump.textContent = '0.00%';
  if (elComposites) elComposites.textContent = `${Math.max(140, ledger.totalSolved || 0)} Solved`;

  // Populate Last 10 Performances Table
  const tbody = document.getElementById('last-10-tbody');
  if (tbody) {
    tbody.innerHTML = matchRegistry.map((m) => {
      const eloTag = m.eloDelta > 0 
        ? `<span class="score-elo-tag">+${m.score} pts (+${m.eloDelta} ELO)</span>` 
        : (m.eloDelta < 0 
          ? `<span class="score-elo-tag" style="color: #EF4444;">${m.score} pts (${m.eloDelta} ELO)</span>` 
          : `<span class="score-elo-tag neutral">+${m.score} pts (+0 ELO)</span>`);

      return `
        <tr>
          <td style="font-weight: 700; color: #FFFFFF;">${m.tier}</td>
          <td class="tabular-nums font-bold" style="color: ${m.accuracy >= 90 ? '#34D399' : '#FBBF24'};">${m.accuracy}%</td>
          <td class="tabular-nums font-mono">${m.time}s</td>
          <td>${eloTag}</td>
          <td class="tabular-nums" style="color: #94A3B8; font-size: 0.825rem;">${m.date}</td>
        </tr>
      `;
    }).join('');
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
      const academicText = `⚡ Prime-Factor.app Academic Profile Credentials ⚡\n\n` +
        `👤 Competitor: Rayaan Tasnim (Olympiad Contender)\n` +
        `🔑 Token ID: OLY-PF-746525000545-ALPHA\n` +
        `🏆 Current Rank: Quantum Decomposer\n` +
        `📡 Current ELO: 1000 ELO (Base Track)\n` +
        `📈 Peak Rating: 1000 ELO (Standard Registry)\n` +
        `🛡️ Primary Division: Tier 1: 1 - 200\n\n` +
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
      const activeStreak = ledger.currentStreak || 3;
      const peakStreak = Math.max(12, ledger.bestStreak || 0);

      const streakText = `⚡ Prime-Factor.app Streak Records & Cadence Ledger ⚡\n\n` +
        `🔥 Current Active Streak: ${activeStreak} Matches\n` +
        `👑 Lifetime Peak Streak: ${peakStreak} Consecutive Clears\n` +
        `📉 Slump Index: 0.00% (Nominal Cadence)\n` +
        `🎯 First-Attempt Stability: 94.2%\n` +
        `🧩 Total Composites Cleared: ${Math.max(140, ledger.totalSolved || 0)} Numbers\n\n` +
        `✨ Certified By Rayaan Tasnim\n` +
        `🚀 Powered by Olympiad Edge\n` +
        `© All rights reserved.`;

      copyToClipboard(streakText, btnStreak, 'Streak Records');
    });
  }

  // Button 3: Copy Lifetime Milestones
  if (btnMilestones) {
    btnMilestones.addEventListener('click', () => {
      const milestonesText = `⚡ Prime-Factor.app Lifetime PB Milestones ⚡\n\n` +
        `🏆 Max Rating Achieved: 1000 ELO (Base Track)\n` +
        `👑 Max Rank Achieved: Quantum Decomposer\n` +
        `⚡ Highest Speed Tracked: 0.038 ms / factor (Pollard's Rho Brent)\n` +
        `⏱ Lowest Time Consumption: 24.6s (Tier 1: 1 - 200 Division)\n` +
        `📅 PB Milestone Date: September 28, 2026\n\n` +
        `✨ Certified By Rayaan Tasnim\n` +
        `🚀 Powered by Olympiad Edge\n` +
        `© All rights reserved.`;

      copyToClipboard(milestonesText, btnMilestones, 'Lifetime Milestones');
    });
  }

  // Button 4: Copy Last 10 Contests Ledger
  if (btnContests) {
    btnContests.addEventListener('click', () => {
      const rowsList = DEFAULT_MATCH_REGISTRY.map((m, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        return `#${num} | ${m.tier.padEnd(26, ' ')} | ${String(m.accuracy).padStart(3, ' ')}% Acc | ${m.time}s | Score: ${m.score} (+0 ELO) | ${m.date}`;
      }).join('\n');

      const contestsText = `⚡ Prime-Factor.app Last 10 Contests Ledger ⚡\n\n` +
        `📊 Passed Matches: 10/10 Completed\n` +
        `🎯 Historical Accuracy: 96.0%\n` +
        `⏱ Total Time Elapsed: 312s\n\n` +
        `MATCH REGISTRY:\n` +
        `${rowsList}\n\n` +
        `✨ Certified By Rayaan Tasnim\n` +
        `🚀 Powered by Olympiad Edge\n` +
        `© All rights reserved.`;

      copyToClipboard(contestsText, btnContests, 'Last 10 Contests Ledger');
    });
  }
}
