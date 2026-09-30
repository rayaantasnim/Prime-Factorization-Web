/**
 * PrimeFactor.app — Standalone Rules & Competitive Policies Controller
 * Binds regulatory compliance indicators, dynamic firewall status queries,
 * and user rating evaluation into the rules documentation matrix.
 */

import { initGlobalHeader, renderFooter, triggerFlash } from './header.js';
import { getUserElo, getTierByElo, isRangeBannedForElo } from './elo-engine.js';
import { playSound } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader();
  renderFooter();
  initRulesPortal();
});

function initRulesPortal() {
  const userElo = getUserElo();
  const tier = getTierByElo(userElo);
  const strikes = Number(localStorage.getItem('primefactor_security_strikes') || 0);

  // 1. Populate Live Player Context Status Bar
  const elElo = document.getElementById('rules-user-elo');
  const elTier = document.getElementById('rules-user-tier');
  const elFirewall = document.getElementById('rules-user-firewall');
  const elSecurity = document.getElementById('rules-user-security');

  if (elElo) {
    elElo.innerHTML = `<span style="color: ${tier.colorHex || '#38BDF8'};">${userElo.toLocaleString()}</span> ELO`;
  }

  if (elTier) {
    elTier.innerHTML = `${tier.symbol} <span style="color: ${tier.colorHex || '#FFFFFF'}; font-weight: 800;">${tier.title}</span>`;
  }

  if (elFirewall) {
    if (userElo >= 3000) {
      elFirewall.innerHTML = `<span style="color: #EF4444;">🔴 Banned: Tiers 1–6 (MAX ≤ 10,000)</span>`;
    } else if (userElo >= 2700) {
      elFirewall.innerHTML = `<span style="color: #EF4444;">🔴 Banned: Tiers 1–5 (MAX ≤ 5,000)</span>`;
    } else if (userElo >= 2200) {
      elFirewall.innerHTML = `<span style="color: #F59E0B;">🟠 Banned: Tiers 1–4 (MAX ≤ 2,000)</span>`;
    } else if (userElo >= 1800) {
      elFirewall.innerHTML = `<span style="color: #F59E0B;">🟠 Banned: Tiers 1–3 (MAX ≤ 1,000)</span>`;
    } else if (userElo >= 1400) {
      elFirewall.innerHTML = `<span style="color: #EAB308;">🟡 Banned: Tiers 1–2 (MAX ≤ 500)</span>`;
    } else if (userElo >= 900) {
      elFirewall.innerHTML = `<span style="color: #EAB308;">🟡 Banned: Tier 1 (MAX ≤ 200)</span>`;
    } else {
      elFirewall.innerHTML = `<span style="color: #10B981;">🟢 Full Access (Open Floor)</span>`;
    }
  }

  if (elSecurity) {
    if (strikes === 0) {
      elSecurity.innerHTML = `<span style="color: #10B981;">🛡️ Verified (0 Strikes)</span>`;
    } else if (strikes === 1) {
      elSecurity.innerHTML = `<span style="color: #F59E0B;">⚠️ Caution (1 Strike &bull; -100 ELO)</span>`;
    } else {
      elSecurity.innerHTML = `<span style="color: #EF4444;">🚨 High Risk (${strikes} Strikes)</span>`;
    }
  }

  // 2. Add subtle interactive audio feedback on documentation card interaction
  const cards = document.querySelectorAll('.rules-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      playSound('hover');
    });
  });
}
