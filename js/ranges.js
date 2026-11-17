/**
 * PrimeFactor.app — Range Choosing Hub Controller
 * Coordinates the 10 Dynamic Range Selector Cards with 3D Parallax Tilt Tracking via GSAP.
 */

import { initGlobalHeader, renderFooter } from "./header.js";
import { setActiveExamParams, getSettings } from "./storage.js";
import { playSound } from "./audio.js";
import { getUserElo, isRangeBannedForElo, getTierByElo } from "./elo-engine.js";
import {
  waitForAuthReady,
  isUserLoggedIn,
  onAuthChange,
  signInWithGoogle,
} from "./firebase.js";
import { init3DCards } from "./ranges-3d.js";
import { tickNumber, scrambleText } from "./fx-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  initGlobalHeader();
  renderFooter();
  // Interactive 3D cards must never wait on the network: init first, reconcile auth afterwards.
  initTiltCards();
  initRangesBento();
  waitForAuthReady().then(() => {
    renderRangesGuestBanner();
    refreshBanFirewall();
    refreshBento();
  });
  onAuthChange(() => {
    renderRangesGuestBanner();
    refreshBanFirewall();
    refreshBento();
  });
});

function renderRangesGuestBanner() {
  const container =
    document.querySelector(".content-container") ||
    document.querySelector("main");
  let banner = document.getElementById("ranges-guest-banner");
  if (!isUserLoggedIn()) {
    if (!banner && container) {
      banner = document.createElement("div");
      banner.id = "ranges-guest-banner";
      banner.className = "guest-warning-banner";
      banner.innerHTML = `
        <div class="guest-warning-content">
          <span style="font-size: 1.5rem;">⚠️</span>
          <div>
            <strong style="color: #FFFFFF; font-size: 1rem;">Guest Contender Mode</strong>
            <div style="font-size: 0.85rem; color: #CBD5E1;">Rated division runs will not update your official ELO rating or save matches unless signed in with Google.</div>
          </div>
        </div>
        <button id="btn-ranges-signin" class="guest-warning-btn">Sign In with Google</button>
      `;
      const head =
        container.querySelector(".section-head") || container.firstChild;
      if (head && head.parentNode) {
        head.parentNode.insertBefore(banner, head.nextSibling);
      } else {
        container.prepend(banner);
      }
      const btn = banner.querySelector("#btn-ranges-signin");
      if (btn) {
        btn.addEventListener("click", async () => {
          playSound("click");
          try {
            await signInWithGoogle();
          } catch (e) {}
        });
      }
    }
  } else if (banner) {
    banner.remove();
  }
}

function allCards() {
  return Array.from(document.querySelectorAll(".range-tilt-card"));
}

/** (Re)applies the ELO-ceiling "Practice Mode" firewall badge. Safe to call repeatedly. */
function refreshBanFirewall() {
  const userElo = getUserElo();
  const userTier = getTierByElo(userElo);
  allCards().forEach((card) => {
    const maxVal = Number(card.getAttribute("data-max"));
    const banned = Boolean(maxVal && isRangeBannedForElo(userElo, maxVal));
    let badge = card.querySelector(".range-firewall-badge");
    if (banned) {
      card.setAttribute("data-forced-unrated", "true");
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "range-firewall-badge";
        card.querySelector(".range-card-body")?.appendChild(badge);
      }
      badge.textContent = `🛡️ Practice Mode · ELO Ceiling (${userTier.title})`;
    } else {
      card.removeAttribute("data-forced-unrated");
      if (badge) badge.remove();
    }
  });
}

function initTiltCards() {
  const cards = allCards();
  // graceful image fallback: a failed remote photo simply disappears (dark gradient remains)
  document.querySelectorAll(".range-card-img").forEach((img) => {
    img.addEventListener("error", () => img.setAttribute("data-failed", "1"), {
      once: true,
    });
    img.addEventListener("load", () => img.classList.add("is-img-loaded"), {
      once: true,
    });
  });
  refreshBanFirewall();
  init3DCards(cards, document.querySelector(".ranges-matrix-grid"));

  cards.forEach((card) => {
    // Click handler (rating state is read at click time so it is never stale)
    card.addEventListener("click", (e) => {
      e.preventDefault();
      playSound("click");

      const isCustom =
        card.getAttribute("data-is-custom") === "true" ||
        card.getAttribute("href")?.includes("custom.html") ||
        card.id === "tier-9-custom-card";
      if (isCustom) {
        window.location.href = "./custom.html";
        return;
      }

      const min = Number(card.getAttribute("data-min"));
      const max = Number(card.getAttribute("data-max"));
      const time = Number(card.getAttribute("data-time")) || 180;
      const label =
        card.getAttribute("data-label") ||
        card.getAttribute("data-tier") ||
        `${min} - ${max}`;

      const isForcedUnrated =
        card.getAttribute("data-forced-unrated") === "true" ||
        isRangeBannedForElo(getUserElo(), max);
      const participationMode = isForcedUnrated ? "unrated" : "rated";

      setActiveExamParams({
        min,
        max,
        title: label,
        timeLimit: time,
        rules: { ...getSettings(), participationMode, isForcedUnrated },
      });

      const targetUrl = `./contract.html?min=${min}&max=${max}&title=${encodeURIComponent(label)}&time=${time}&mode=${participationMode}${isForcedUnrated ? "&forcedUnrated=true" : ""}`;

      card.classList.add("is-launching");
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 140);
    });
  });
}

// ---------------------------------------------------------------------------------------------
// Bento strip: live ELO ticker, tier, range count, and a "problem preview" composite
// ---------------------------------------------------------------------------------------------
function smallPrimeFactors(n) {
  const out = [];
  for (let p = 2; p * p <= n; p++)
    while (n % p === 0) {
      out.push(p);
      n /= p;
    }
  if (n > 1) out.push(n);
  return out;
}
function randomComposite(lo, hi) {
  for (let i = 0; i < 200; i++) {
    const n = lo + Math.floor(Math.random() * (hi - lo + 1));
    if (smallPrimeFactors(n).length >= 3) return n;
  }
  return 360;
}
const fmtFactors = (f) => {
  const m = new Map();
  f.forEach((p) => m.set(p, (m.get(p) || 0) + 1));
  return [...m]
    .map(([p, e]) => (e > 1 ? `${p}<sup>${e}</sup>` : `${p}`))
    .join(" × ");
};

let previewTimer = 0;
function initRangesBento() {
  const range = document.getElementById("bento-range-count");
  if (range) tickNumber(range, 10, { duration: 900 });
  const btn = document.getElementById("bento-preview-next");
  const showProblem = () => {
    const n = randomComposite(120, 2000);
    const q = document.getElementById("bento-preview-n");
    const a = document.getElementById("bento-preview-a");
    if (q) scrambleText(q, n.toLocaleString(), 420);
    if (a) {
      a.innerHTML = `= ${fmtFactors(smallPrimeFactors(n))}`;
      a.classList.remove("is-revealed");
    }
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => a?.classList.add("is-revealed"), 1800);
  };
  btn?.addEventListener("click", () => {
    playSound("click");
    showProblem();
  });
  showProblem();
  refreshBento(true);
}

function refreshBento(first) {
  const elo = getUserElo();
  const tier = getTierByElo(elo);
  const eloEl = document.getElementById("bento-elo-val");
  if (eloEl) tickNumber(eloEl, elo, { duration: first ? 1100 : 700 });
  const tierEl = document.getElementById("bento-tier-name");
  if (tierEl) tierEl.textContent = `${tier.symbol || "🧩"} ${tier.title}`;
  const st = document.getElementById("bento-elo-state");
  if (st)
    st.textContent = isUserLoggedIn()
      ? "Live · synced with Firestore"
      : "Guest baseline · sign in to rate";
}
