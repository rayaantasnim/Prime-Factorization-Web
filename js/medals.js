/**
 * PrimeFactor.app — Dual-Vault Medals & Badges Master Controller
 * Manages Section A (100 Olympiad Medals) and Section B (100 Tactical Insignias).
 * Enforces Fade-To-Inspire protocol, 3-second locked toast interception,
 * single-tap glass-morphic certificate popups with red [X] close node,
 * and 6-way dynamic filtering (All, Achieved, Locked, Speed, Resource, Streak).
 */

import { initGlobalHeader, renderFooter, triggerFlash } from './header.js';
import { getLedger, getLastExamResult } from './storage.js';
import { playSound } from './audio.js';
import { getUserElo, getUserPeakElo, getTierByElo, initServerlessOnboarding } from './elo-engine.js';
import { MEDALS_CATALOG } from './medals-catalog.js';
import { BADGES_CATALOG } from './badges-catalog.js';

let currentVault = 'medals'; // 'medals' | 'badges'
let currentFilter = 'all';    // 'all' | 'achieved' | 'locked' | 'speed' | 'resource' | 'streak'
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initServerlessOnboarding();
  initGlobalHeader();
  renderFooter();
  initVaultSwitcher();
  initSearchInput();
  initFilterTabs();
  initInspectModal();
  initClipboardExport();
  renderActiveVault();
});

/**
 * Builds the centralized telemetry evaluation context from localStorage.
 */
function getEvaluationContext() {
  const ledger = getLedger();
  const lastResult = getLastExamResult();
  const currentElo = getUserElo();
  const peakElo = getUserPeakElo();
  const activeTier = getTierByElo(currentElo);
  const securityStrikes = Number(localStorage.getItem('primefactor_security_strikes') || 0);

  let matchRegistry = [];
  try {
    const raw = localStorage.getItem('primefactor_match_logs');
    if (raw) matchRegistry = JSON.parse(raw);
    if (!Array.isArray(matchRegistry)) matchRegistry = [];
  } catch (e) {
    matchRegistry = [];
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

  // Calculate cumulative solved numbers from match logs & ledger
  let sumClears = 0;
  for (const m of matchRegistry) {
    const c = (Number(m.firstAttemptClears || 0) + Number(m.secondAttemptClears || 0)) ||
              Number(m.correctCount || 0) ||
              (m.accuracy ? Math.round((m.accuracy / 100) * (m.totalQuestions || 10)) : 0);
    sumClears += c;
  }
  const totalSolved = Math.max(
    Number(ledger.totalSolved || 0),
    Number(localStorage.getItem('primefactor_total_solved') || 0),
    sumClears
  );
  const bestStreak = Math.max(Number(ledger.bestStreak || 0), Number(ledger.currentStreak || 0));

  const baseCtx = {
    ledger,
    lastResult,
    currentElo,
    peakElo,
    activeTier,
    securityStrikes,
    matchRegistry,
    fastestMatch,
    totalSolved,
    bestStreak
  };

  let unlockedMedalsCount = 0;
  MEDALS_CATALOG.forEach(m => {
    try {
      if (m.check(baseCtx)) unlockedMedalsCount++;
    } catch {
      // safe fallback
    }
  });

  let unlockedBadgesCount = 0;
  BADGES_CATALOG.forEach(b => {
    try {
      if (b.check(baseCtx)) unlockedBadgesCount++;
    } catch {
      // safe fallback
    }
  });

  return {
    ...baseCtx,
    unlockedMedalsCount,
    unlockedBadgesCount
  };
}

/**
 * Initializes the Dual-Vault Master Switcher (Medals vs Badges)
 */
function initVaultSwitcher() {
  const switchMedals = document.getElementById('switch-vault-medals');
  const switchBadges = document.getElementById('switch-vault-badges');

  if (switchMedals) {
    switchMedals.addEventListener('click', () => {
      if (currentVault === 'medals') return;
      playSound('click');
      currentVault = 'medals';
      switchMedals.classList.add('active');
      switchBadges.classList.remove('active');
      currentFilter = 'all';
      resetFilterButtons();
      renderActiveVault();
    });
  }

  if (switchBadges) {
    switchBadges.addEventListener('click', () => {
      if (currentVault === 'badges') return;
      playSound('click');
      currentVault = 'badges';
      switchBadges.classList.add('active');
      switchMedals.classList.remove('active');
      currentFilter = 'all';
      resetFilterButtons();
      renderActiveVault();
    });
  }
}

function resetFilterButtons() {
  const tabBtns = document.querySelectorAll('.filter-tab-btn');
  tabBtns.forEach(btn => {
    if (btn.getAttribute('data-filter') === 'all') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function initSearchInput() {
  const input = document.getElementById('vault-search-input');
  if (!input) return;

  input.addEventListener('input', (e) => {
    searchQuery = (e.target.value || '').toLowerCase().trim();
    renderActiveVault();
  });
}

function initFilterTabs() {
  const tabBtns = document.querySelectorAll('.filter-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      renderActiveVault();
    });
  });
}

/**
 * Primary Render Loop across the 100+ items in the active vault.
 */
function renderActiveVault() {
  const ctx = getEvaluationContext();

  // 1. Update Master Switcher Counts
  const elMedalsCount = document.getElementById('medals-count-badge');
  const elBadgesCount = document.getElementById('badges-count-badge');
  if (elMedalsCount) elMedalsCount.textContent = `${ctx.unlockedMedalsCount} / ${MEDALS_CATALOG.length} Gained`;
  if (elBadgesCount) elBadgesCount.textContent = `${ctx.unlockedBadgesCount} / ${BADGES_CATALOG.length} Gained`;

  // 2. Determine active catalog
  const isMedals = currentVault === 'medals';
  const catalog = isMedals ? MEDALS_CATALOG : BADGES_CATALOG;

  // 3. Update Hero Card Texts & Summary
  const elKicker = document.getElementById('vault-kicker');
  const elTitle = document.getElementById('vault-main-title');
  const elDesc = document.getElementById('vault-main-desc');

  if (elKicker) {
    elKicker.textContent = isMedals
      ? `🏛️ OLYMPIAD COMPETITIVE MEDALS VAULT · ${MEDALS_CATALOG.length} ACCOLADES`
      : `🛡️ INSIGNIAS & ACCREDITATION BADGES VAULT · ${BADGES_CATALOG.length} BADGES`;
    elKicker.style.color = isMedals ? '#F59E0B' : '#38BDF8';
  }

  if (elTitle) {
    elTitle.innerHTML = isMedals
      ? '<span>🏅</span> Olympiad Medals Vault'
      : '<span>🛡️</span> Insignias &amp; Badges Vault';
  }

  if (elDesc) {
    elDesc.textContent = isMedals
      ? 'Certified Math Olympiad accolades, Diophantine ranks, Sieve calibration sprints, and Cosmic Manifold honors awarded for high-precision factorizations.'
      : 'Sub-second velocity insignias, zero-lifeline virgin clears, continuous win streaks, and tamper-proof cognitive focus records.';
  }

  // Summary Metrics
  const gainedCount = isMedals ? ctx.unlockedMedalsCount : ctx.unlockedBadgesCount;
  const totalItems = catalog.length;
  const totalHonorPoints = catalog
    .filter(item => {
      try { return Boolean(item.check(ctx)); } catch { return false; }
    })
    .reduce((sum, item) => sum + item.points, 0);

  const elProgressLabel = document.getElementById('summary-progress-label');
  const elCount = document.getElementById('summary-unlocked-count');
  const elFill = document.getElementById('summary-progress-fill');
  const elPoints = document.getElementById('summary-honor-points');
  const elElo = document.getElementById('summary-user-elo');
  const elTier = document.getElementById('summary-user-tier');

  if (elProgressLabel) elProgressLabel.textContent = isMedals ? 'Medals Progress' : 'Badges Progress';
  if (elCount) elCount.textContent = `${gainedCount} / ${totalItems}`;
  if (elFill) {
    const pct = Math.round((gainedCount / totalItems) * 100);
    elFill.style.width = `${pct}%`;
    elFill.style.background = isMedals
      ? 'linear-gradient(90deg, #F59E0B, #10B981)'
      : 'linear-gradient(90deg, #38BDF8, #818CF8)';
  }
  if (elPoints) {
    elPoints.textContent = `${totalHonorPoints.toLocaleString()} pts`;
    elPoints.style.color = isMedals ? '#F59E0B' : '#38BDF8';
  }
  if (elElo) elElo.textContent = `${ctx.currentElo.toLocaleString()} ELO`;
  if (elTier) {
    elTier.textContent = `${ctx.activeTier.symbol} ${ctx.activeTier.title}`;
    elTier.style.color = ctx.activeTier.colorHex;
  }

  // 4. Filter & Search Grid Items
  const filtered = catalog.filter(item => {
    let isUnlocked = false;
    try { isUnlocked = Boolean(item.check(ctx)); } catch { isUnlocked = false; }

    // Search filter
    if (searchQuery) {
      const matchName = item.title.toLowerCase().includes(searchQuery);
      const matchDesc = item.desc.toLowerCase().includes(searchQuery);
      const matchCat = (item.categoryName || '').toLowerCase().includes(searchQuery);
      const matchHurdle = (item.hurdle || '').toLowerCase().includes(searchQuery);
      if (!matchName && !matchDesc && !matchCat && !matchHurdle) return false;
    }

    // Category / State filter
    if (currentFilter === 'all') return true;
    if (currentFilter === 'achieved') return isUnlocked;
    if (currentFilter === 'locked') return !isUnlocked;
    if (currentFilter === 'speed') return item.category === 'speed';
    if (currentFilter === 'resource') return item.category === 'resource';
    if (currentFilter === 'streak') return item.category === 'streak';

    return true;
  });

  // 5. Render Grid Cards
  const grid = document.getElementById('vault-cards-grid');
  if (!grid) return;

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1rem; color: #94A3B8; background: rgba(15, 23, 42, 0.6); border-radius: 1rem; border: 1px dashed rgba(255, 255, 255, 0.1);">
        <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔍</div>
        <p style="font-size: 1rem; color: #FFFFFF; font-weight: 700; margin-bottom: 0.25rem;">No honors match your active filter.</p>
        <p style="font-size: 0.85rem; margin: 0;">Try adjusting your query or selecting another filter tab to view more honors.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    let isGained = false;
    try { isGained = Boolean(item.check(ctx)); } catch { isGained = false; }

    const card = document.createElement('div');
    const typeClass = isMedals ? 'card-medal-type' : 'card-badge-type';
    const stateClass = isGained ? 'shining' : 'faded';

    card.className = `vault-card ${stateClass} ${typeClass}`;
    card.setAttribute('data-id', item.id);

    const progressInfo = item.calcProgress ? item.calcProgress(ctx) : { text: 'In Progress', pct: 0 };
    const tagClass = isGained
      ? (isMedals ? 'tag-shining-gold' : 'tag-shining-cyan')
      : 'tag-faded-lock';
    const tagText = isGained ? '✦ GAINED & VERIFIED' : '🔒 AWAITING INDUCTION';

    card.innerHTML = `
      <div class="vault-card-top">
        <div class="vault-card-icon">${item.icon}</div>
        <span class="vault-badge-tag ${tagClass}">${tagText}</span>
      </div>
      <div>
        <div class="vault-card-meta">${item.categoryName}</div>
        <h3 class="vault-card-title">${item.title}</h3>
        <p class="vault-card-desc">${item.desc}</p>
      </div>
      <div class="vault-card-footer">
        <span class="vault-card-points">+${item.points} pts</span>
        ${isGained
          ? `<span class="vault-card-prompt">Inspect Certificate →</span>`
          : `
            <div class="vault-card-progress-hint">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Target:</span>
                <span class="tabular-nums" style="color: #BAE6FD;">${progressInfo.text}</span>
              </div>
              <div class="mini-progress-track">
                <div class="mini-progress-bar" style="width: ${progressInfo.pct}%;"></div>
              </div>
            </div>
          `}
      </div>
    `;

    // Click handler following the strict rules:
    card.addEventListener('click', (e) => {
      e.stopPropagation();

      if (!isGained) {
        // RULE: If unearned (locked): Block modals entirely and flash an absolute text node
        // directly over the asset container block for 3 seconds stating exactly:
        // "Gain that medal to unlock the legacy."
        handleLockedCardClick(card);
      } else {
        // RULE: If earned (unlocked): Clear all grayscale filters. Clicking an earned medal
        // must launch a single-tap glass-morphic popup window overlay.
        openInspectModal(item, isMedals);
      }
    });

    grid.appendChild(card);
  });
}

/**
 * Handles clicks on locked (unearned) items.
 * Enforces modal blockage and flashes the exact requested 3-second overlay toast.
 */
function handleLockedCardClick(cardElement) {
  playSound('click');

  // Prevent multiple toasts stacking
  const existingToast = cardElement.querySelector('.locked-legacy-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'locked-legacy-toast';
  toast.innerHTML = `
    <div class="toast-icon">🔒</div>
    <div>Gain that medal to unlock the legacy.</div>
  `;

  cardElement.appendChild(toast);

  // Auto-remove after exactly 3 seconds
  setTimeout(() => {
    if (toast.parentNode === cardElement) {
      if (window.gsap) {
        window.gsap.to(toast, {
          opacity: 0,
          scale: 0.95,
          duration: 0.25,
          onComplete: () => toast.remove()
        });
      } else {
        toast.remove();
      }
    }
  }, 3000);
}

/**
 * Opens single-tap glass-morphic popup window overlay for earned honors.
 * Features title, unlock date, hurdle broken, historical flavor text, and red [X] close node.
 */
function openInspectModal(item, isMedals) {
  const modal = document.getElementById('medal-inspect-modal');
  if (!modal) return;

  playSound('correct');

  const elIcon = document.getElementById('modal-medal-icon');
  const elBadge = document.getElementById('modal-medal-badge');
  const elTitle = document.getElementById('modal-medal-title');
  const elCat = document.getElementById('modal-medal-cat');
  const elDate = document.getElementById('modal-medal-date');
  const elHurdle = document.getElementById('modal-medal-hurdle');
  const elFlavor = document.getElementById('modal-medal-flavor');
  const elPts = document.getElementById('modal-medal-pts');
  const elStatus = document.getElementById('modal-medal-status');

  if (elIcon) elIcon.textContent = item.icon;
  if (elBadge) {
    elBadge.className = `vault-badge-tag ${isMedals ? 'tag-shining-gold' : 'tag-shining-cyan'}`;
    elBadge.textContent = '✦ GAINED & VERIFIED';
  }
  if (elTitle) elTitle.textContent = item.title;
  if (elCat) {
    elCat.textContent = item.categoryName.toUpperCase();
    elCat.style.color = isMedals ? '#F59E0B' : '#38BDF8';
  }

  // Generate accurate timestamp
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  if (elDate) elDate.textContent = `Unlocked: ${dateStr}`;

  if (elHurdle) elHurdle.textContent = item.hurdle || item.desc;
  if (elFlavor) elFlavor.textContent = item.flavorText || 'Certified in the official Mathematical Honors Ledger.';
  if (elPts) {
    elPts.textContent = `+${item.points} pts`;
    elPts.style.color = isMedals ? '#F59E0B' : '#38BDF8';
  }
  if (elStatus) elStatus.textContent = 'Authentic Signature';

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function initInspectModal() {
  const modal = document.getElementById('medal-inspect-modal');
  const closeBtn = document.getElementById('close-inspect-modal');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        playSound('click');
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

function initClipboardExport() {
  const btn = document.getElementById('btn-copy-honors');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    playSound('click');
    const ctx = getEvaluationContext();
    const isMedals = currentVault === 'medals';
    const catalog = isMedals ? MEDALS_CATALOG : BADGES_CATALOG;

    const gainedItems = catalog.filter(item => {
      try { return Boolean(item.check(ctx)); } catch { return false; }
    });

    const report = [
      `=== PRIMEFACTOR.APP MATHEMATICAL HONORS VAULT ===`,
      `Contestant: ${localStorage.getItem('primefactor_profile_username') || 'Rayaan Tasnim'}`,
      `Certified Name: ${localStorage.getItem('primefactor_profile_realname') || 'None'}`,
      `Active ELO: ${ctx.currentElo.toLocaleString()} ELO · Peak: ${ctx.peakElo.toLocaleString()} ELO`,
      `Tier Standing: ${ctx.activeTier.title}`,
      `Total Cleared Composites: ${ctx.totalSolved.toLocaleString()}`,
      `Lifetime Best Streak: ${ctx.bestStreak}`,
      `Medals Unlocked: ${ctx.unlockedMedalsCount} / ${MEDALS_CATALOG.length}`,
      `Badges Unlocked: ${ctx.unlockedBadgesCount} / ${BADGES_CATALOG.length}`,
      `Generated: ${new Date().toISOString()}`,
      `\n--- GAINED IN THE ${isMedals ? 'MEDALS' : 'BADGES'} VAULT ---`,
      ...gainedItems.map(item => `[${item.icon}] ${item.title} (+${item.points} pts) — ${item.categoryName}`)
    ].join('\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(report);
      } else {
        const ta = document.createElement('textarea');
        ta.value = report;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      triggerFlash('rgba(16, 185, 129, 0.25)');
      btn.innerHTML = `<span>✔️ Vault Copied!</span>`;
      setTimeout(() => {
        btn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy Dual-Vault Ledger</span>
        `;
      }, 2000);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  });
}
