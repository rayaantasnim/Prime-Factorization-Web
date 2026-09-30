/**
 * PrimeFactor.app — Standalone Dynamic Rating Calibrator Hub Controller
 * Manages active ELO telemetry, lifetime peak tracking, goal target persistence,
 * 12-tier competitive hierarchy rendering, and AI-driven strategic guidance.
 */

import { initGlobalHeader, renderFooter, triggerFlash } from './header.js';
import { getUserElo, getUserPeakElo, getTierByElo, ELO_TIERS } from './elo-engine.js';
import { playSound } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader();
  renderFooter();
  initRatingCalibrator();
});

function initRatingCalibrator() {
  const currentElo = getUserElo();
  const peakElo = getUserPeakElo();
  const currentTier = getTierByElo(currentElo);

  // 1. Top Metric Dashboard: Current Rating & Peak Rating
  const elCurrentElo = document.getElementById('metric-current-elo');
  const elCurrentTierTitle = document.getElementById('metric-current-tier-title');
  const elCurrentTierIcon = document.getElementById('current-tier-icon');

  const elPeakElo = document.getElementById('metric-peak-elo');
  const elPeakTierTitle = document.getElementById('metric-peak-tier-title');

  if (elCurrentElo) {
    elCurrentElo.innerHTML = `<span style="color: ${currentTier.colorHex || '#38BDF8'};">${currentElo.toLocaleString()}</span> <span style="font-size: 1.25rem; color: #94A3B8;">ELO</span>`;
  }

  if (elCurrentTierTitle) {
    elCurrentTierTitle.innerHTML = `${currentTier.symbol} ${currentTier.title}`;
    elCurrentTierTitle.style.color = currentTier.colorHex || '#38BDF8';
  }

  if (elCurrentTierIcon) {
    elCurrentTierIcon.textContent = currentTier.symbol;
  }

  if (elPeakElo) {
    elPeakElo.innerHTML = `<span style="color: #F59E0B;">${peakElo.toLocaleString()}</span> <span style="font-size: 1.25rem; color: #94A3B8;">ELO</span>`;
  }

  if (elPeakTierTitle) {
    const peakTier = getTierByElo(peakElo);
    elPeakTierTitle.textContent = `${peakTier.symbol} ${peakTier.title} (Peak Record)`;
  }

  // 2. Expected Rating [Goal Input Field] Controller
  const goalDisplay = document.getElementById('metric-goal-display');
  const goalInput = document.getElementById('rating-goal-input');
  const goalSubmitBtn = document.getElementById('rating-goal-submit-btn');
  const goalClearBtn = document.getElementById('rating-goal-clear-btn');
  const goalHint = document.getElementById('goal-status-hint');

  function renderGoalTarget() {
    const savedGoal = localStorage.getItem('primefactor_goal_rating');
    if (savedGoal && !isNaN(Number(savedGoal)) && Number(savedGoal) > 0) {
      const goalVal = Number(savedGoal);
      const diff = goalVal - currentElo;
      const goalTier = getTierByElo(goalVal);

      if (goalDisplay) {
        goalDisplay.innerHTML = `<span style="color: #10B981;">${goalVal.toLocaleString()}</span> <span style="font-size: 1.1rem; color: #94A3B8;">ELO</span>`;
      }
      if (goalClearBtn) goalClearBtn.style.display = 'inline-block';
      if (goalInput) goalInput.value = goalVal;

      if (goalHint) {
        if (diff > 0) {
          goalHint.innerHTML = `Horizon Target: <strong>+${diff.toLocaleString()} ELO</strong> remaining to reach <strong>${goalTier.symbol} ${goalTier.title}</strong>.`;
        } else if (diff === 0) {
          goalHint.innerHTML = `🎉 <strong>Goal Achieved!</strong> You are currently at your benchmark target (${goalVal} ELO).`;
        } else {
          goalHint.innerHTML = `🌟 <strong>Goal Surpassed!</strong> You are +${Math.abs(diff).toLocaleString()} ELO above your target.`;
        }
      }
    } else {
      if (goalDisplay) goalDisplay.textContent = 'None';
      if (goalClearBtn) goalClearBtn.style.display = 'none';
      if (goalInput) goalInput.value = '';
      if (goalHint) {
        goalHint.textContent = 'Document a custom ELO benchmark to calculate dynamic target horizons.';
      }
    }
  }

  renderGoalTarget();

  function saveGoal() {
    if (!goalInput) return;
    const rawVal = goalInput.value.trim();
    const num = Number(rawVal);
    if (!rawVal || isNaN(num) || num < 500 || num > 5000) {
      playSound('error');
      triggerFlash('penalty');
      if (goalHint) {
        goalHint.innerHTML = `<span style="color: #EF4444;">Please specify a valid goal between 500 and 5,000 ELO.</span>`;
      }
      return;
    }
    playSound('success');
    triggerFlash('success');
    localStorage.setItem('primefactor_goal_rating', String(Math.round(num)));
    renderGoalTarget();
    updateAISuggestions(currentElo);
  }

  goalSubmitBtn?.addEventListener('click', saveGoal);
  goalInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveGoal();
    }
  });

  goalClearBtn?.addEventListener('click', () => {
    playSound('click');
    localStorage.removeItem('primefactor_goal_rating');
    renderGoalTarget();
    updateAISuggestions(currentElo);
  });

  // 3. Middle Rank Matrix Chart: Render Official 12-Tier Hierarchy
  const matrixTbody = document.getElementById('rating-matrix-tbody');
  if (matrixTbody) {
    matrixTbody.innerHTML = '';
    ELO_TIERS.forEach((tier) => {
      const isUserTier = currentElo >= tier.minElo && currentElo <= tier.maxElo;
      const tr = document.createElement('tr');
      if (isUserTier) {
        tr.classList.add('active-tier-row');
      }

      // Format ELO Threshold string
      let thresholdStr = '';
      if (tier.maxElo === Infinity) {
        thresholdStr = `&ge; ${tier.minElo.toLocaleString()}`;
      } else {
        thresholdStr = `${tier.minElo.toLocaleString()} &ndash; ${tier.maxElo.toLocaleString()}`;
      }

      // Format Range Ban limits
      let banDescription = '';
      if (tier.lockedTiers.length > 0) {
        const highestLocked = Math.max(...tier.lockedTiers);
        const boundCeilings = {
          1: '200',
          2: '500',
          3: '1,000',
          4: '2,000',
          5: '5,000',
          6: '10,000'
        };
        const maxLimit = boundCeilings[highestLocked] || '10,000';
        banDescription = `<span style="color: #EF4444; font-weight: 700;">Locked:</span> MAX &le; ${maxLimit} (Tiers 1&ndash;${highestLocked} restricted to Unrated)`;
      } else {
        banDescription = `<span style="color: #10B981; font-weight: 700;">Open:</span> All competition tiers permitted for Rated Contests`;
      }

      tr.innerHTML = `
        <td style="font-family: var(--font-math); font-weight: 800; color: #94A3B8;">#${tier.tierIndex}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.25rem;">${tier.symbol}</span>
            <span style="font-weight: 800; color: ${tier.colorHex || '#FFFFFF'};">${tier.title}</span>
            ${isUserTier ? '<span style="font-size: 0.65rem; background: #0284C7; color: #FFFFFF; padding: 0.15rem 0.5rem; border-radius: 9999px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">Active Rank</span>' : ''}
          </div>
        </td>
        <td style="font-family: var(--font-math); font-size: 0.95rem; font-weight: 700; color: #F8FAFC;">${thresholdStr}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${tier.colorHex}; box-shadow: 0 0 8px ${tier.colorHex};"></span>
            <span style="font-size: 0.85rem; color: #CBD5E1;">${tier.colorName}</span>
          </div>
        </td>
        <td style="font-size: 0.84rem; line-height: 1.45;">${banDescription}</td>
      `;

      matrixTbody.appendChild(tr);
    });
  }

  // 4. AI-Driven Advanced Suggestions Window
  updateAISuggestions(currentElo);
}

function updateAISuggestions(userElo) {
  const suggestionBox = document.getElementById('rating-ai-suggestion-text');
  const suggestionTag = document.getElementById('ai-suggestion-tier-tag');
  if (!suggestionBox) return;

  const tier = getTierByElo(userElo);
  if (suggestionTag) {
    suggestionTag.textContent = `Calibrated for ${tier.title} (${userElo.toLocaleString()} ELO)`;
  }

  let advice = '';

  // Prompt Explicit Requirements:
  // If ELO is between 500-899:
  // "You are navigating the onboarding floor. Target Tier 1 and Tier 2 rated sprints, maintain high input cadence to trigger a volatility multiplier surge and advance to the Sieve Calibrator tier!"
  // If ELO is 1800+:
  // "Warning Vector: Performance Decay and historical ledger audits are now fully active for your bracket. All bounds below 1,000 max bound are heavily banned for Rated Contests. Challenge the Olympiad Baseline or Advanced Decomposition ranges immediately to protect your rating from weekly degradation penalties!"

  if (userElo >= 500 && userElo <= 899) {
    advice = "You are navigating the onboarding floor. Target Tier 1 and Tier 2 rated sprints, maintain high input cadence to trigger a volatility multiplier surge and advance to the Sieve Calibrator tier!";
  } else if (userElo >= 1800) {
    advice = "Warning Vector: Performance Decay and historical ledger audits are now fully active for your bracket. All bounds below 1,000 max bound are heavily banned for Rated Contests. Challenge the Olympiad Baseline or Advanced Decomposition ranges immediately to protect your rating from weekly degradation penalties!";
  } else if (userElo >= 900 && userElo <= 1199) {
    advice = "You are operating at the competitive foundation. Focus on 3-digit prime identification in Tier 2 and Tier 3, minimizing calculation friction to advance to the Radix Scholar bracket.";
  } else if (userElo >= 1200 && userElo <= 1399) {
    advice = "You have unlocked multi-factor fluency. Eliminate lifeline dependence to maintain pristine zero-lifeline achievement badges while pacing under 2.8s per factor.";
  } else if (userElo >= 1400 && userElo <= 1599) {
    advice = "Modular arithmetic routines established. Note that MAX_BOUND ≤ 500 is now firewalled from Rated Contests. Tackle 4-digit composites in Tier 4 to continue your rating ascent.";
  } else if (userElo >= 1600 && userElo <= 1799) {
    advice = "Advanced sieve heuristics required. Maintain 92%+ precision across Tier 4 and Tier 5 while accelerating factoring cadence to cross into the Logarithmic Vector tier.";
  } else {
    // 0-499 ELO (Foundry Initiate)
    advice = "Foundry re-calibration phase. Focus on fundamental divisibility rules and small primes to quickly rebuild your rating above the 500 ELO baseline floor.";
  }

  // Append goal context if set
  const savedGoal = localStorage.getItem('primefactor_goal_rating');
  if (savedGoal && !isNaN(Number(savedGoal)) && Number(savedGoal) > userElo) {
    const diff = Number(savedGoal) - userElo;
    advice += ` <br><br><span style="color: #10B981; text-align:justify !important;">🎯 <strong>Horizon Trajectory:</strong> You are currently <strong>${diff.toLocaleString()} points</strong> away from your custom target benchmark (${Number(savedGoal).toLocaleString()} ELO). Consistent rated clears with zero lifeline deductions will secure this milestone within approximately ${Math.ceil(diff / 18)} rated sessions.</span>`;
  }

  suggestionBox.innerHTML = advice;
}
