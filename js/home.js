/**
 * PrimeFactor.app — Modernized Home Page Interactive Controller
 * Coordinates the Interactive Hero, Mini-Challenge Widget, 3-Step Guide,
 * Dynamic Firebase Cloud Ledger, Instant Randomizer, and Live Prime Playground.
 */

import { initGlobalHeader, renderFooter, triggerFlash } from "./header.js";
import {
  factorize,
  toExponentialForm,
  formatExponentialString,
  isPrime,
  parseExpressionToFactors,
} from "./math-engine.js";
import { getSettings, updateSettings, setActiveExamParams } from "./storage.js";
import { playSound } from "./audio.js";
import { getTierByElo } from "./elo-engine.js";
import {
  waitForAuthReady,
  isUserLoggedIn,
  getCurrentUser,
  getCurrentProfile,
  onAuthChange,
  signInWithGoogle,
  updateUserProfile,
} from "./firebase.js";

let staticModulesInitialized = false;

export function initHomeStaticModules() {
  if (staticModulesInitialized) return;
  staticModulesInitialized = true;

  // 1. Navigation Map Matrix (Full-screen overlay)
  initFloatingMenu();

  // 2. Interactive Hero Mini-Challenge Widget
  initMiniChallenge();

  // 3. Cloud Profile & Settings Node
  initCloudSettingsNode();

  // 4. Instant Randomizer Slot Machine
  initInstantRandomizer();

  // 5. Prime Playground Live Pollard's Rho Sandbox
  initPrimePlayground();
}

export function syncHomeAuthUI(authState) {
  initHeroAuthCta(authState);
  renderPersonalLedger(authState);
  syncCloudSettingsFromProfile(authState);
}

export async function initHomePage() {
  if (window.__pfHomeBootstrapped) return;
  window.__pfHomeBootstrapped = true;

  initGlobalHeader();
  renderFooter();
  initHomeStaticModules();

  // Wait for Firebase Auth resolution before rendering auth CTA & cloud ledger
  const initialAuth = await waitForAuthReady();
  syncHomeAuthUI(initialAuth);

  // Re-sync on Firebase Auth state transitions & custom auth/profile events
  onAuthChange((authState) => {
    syncHomeAuthUI(authState);
  });

  if (!window.__pfHomeAuthEventsBound) {
    window.__pfHomeAuthEventsBound = true;
    window.addEventListener("primefactor_auth_changed", (e) => {
      syncHomeAuthUI(e.detail);
    });
    window.addEventListener("primefactor_profile_updated", (e) => {
      syncHomeAuthUI({
        user: getCurrentUser(),
        profile: e.detail?.profile ?? getCurrentProfile(),
      });
    });
  }
}

/**
 * 1. FLOATING NAVIGATION OVERLAY
 */
function initFloatingMenu() {
  const triggerBtn = document.getElementById("floating-menu-trigger");
  const overlay = document.getElementById("fullscreen-nav-overlay");
  const closeBtn = document.getElementById("close-nav-overlay-btn");
  const navCards = document.querySelectorAll(".overlay-nav-card");

  if (!triggerBtn || !overlay) return;

  function openMenu() {
    playSound("click");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    overlay.scrollTop = 0;
    if (closeBtn) setTimeout(() => closeBtn.focus({ preventScroll: true }), 50);

    if (window.gsap) {
      window.gsap.fromTo(
        ".overlay-nav-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.03, ease: "power2.out" },
      );
    }
  }

  function closeMenu() {
    playSound("click");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
    triggerBtn.focus({ preventScroll: true });
  }

  // Esc closes the map; clicking the dark backdrop (not a card) closes it too
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("active")) closeMenu();
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeMenu();
  });

  triggerBtn.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  navCards.forEach((card) => {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
      }
    });
    card.addEventListener("click", () => {
      const targetId = card.getAttribute("data-target");
      if (targetId) {
        closeMenu();
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const headerHeight =
            document.querySelector(".fixed-header")?.offsetHeight || 68;
          const targetY =
            targetEl.getBoundingClientRect().top +
            window.pageYOffset -
            headerHeight;

          if (window.gsap) {
            window.gsap.to(window, {
              duration: 0.7,
              scrollTo: targetY,
              ease: "power3.inOut",
            });
          } else {
            window.scrollTo({ top: targetY, behavior: "smooth" });
          }
        }
      }
    });
  });
}

/**
 * 2. HERO CALL-TO-ACTION AUTHENTICATION SYNC
 */
export function initHeroAuthCta(authState) {
  const authCtaBtn = document.getElementById("hero-auth-cta-btn");
  if (!authCtaBtn) return;

  const user =
    authState?.user !== undefined ? authState.user : getCurrentUser();
  const profile =
    authState?.profile !== undefined ? authState.profile : getCurrentProfile();
  const loggedIn = Boolean(user) || isUserLoggedIn();

  if (loggedIn) {
    const elo = typeof profile?.elo === "number" ? profile.elo : 500;
    const name = profile?.displayName || user?.displayName || "Competitor";
    authCtaBtn.textContent = "";

    const dot = document.createElement("span");
    dot.style.color = "#10B981";
    dot.textContent = "●";

    const label = document.createElement("span");
    label.textContent = `${name} (${elo.toLocaleString()} ELO) · View Profile`;

    authCtaBtn.appendChild(dot);
    authCtaBtn.appendChild(label);
    authCtaBtn.insertAdjacentHTML(
      "beforeend",
      `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `,
    );
    authCtaBtn.onclick = () => {
      playSound("click");
      window.location.href = "./profile.html";
    };
  } else {
    authCtaBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
      </svg>
      <span>Sign In with Google (500 ELO)</span>
    `;
    authCtaBtn.onclick = () => {
      playSound("click");
      signInWithGoogle().catch((err) => console.error(err));
    };
  }
}

/**
 * 3. INTERACTIVE MINI-CHALLENGE WIDGET
 * Provides instant tactile feedback without leaving homepage
 */
function initMiniChallenge() {
  const targetDisplay = document.getElementById("mini-target-num");
  const refreshBtn = document.getElementById("mini-new-num-btn");
  const exprInput = document.getElementById("mini-challenge-input");
  const submitBtn = document.getElementById("mini-submit-btn");
  const clearBtn = document.getElementById("mini-clear-btn");
  const productDisplay = document.getElementById("mini-current-product");
  const verdictBanner = document.getElementById("mini-verdict-banner");
  const primePills = document.querySelectorAll(".mini-prime-pill");

  if (!targetDisplay || !exprInput || !submitBtn) return;

  const SAMPLE_COMPOSITES = [
    360, 120, 180, 252, 420, 504, 720, 840, 900, 1260, 210, 300, 630,
  ];
  let currentTarget = 360;
  let challengeStartTime = performance.now();

  function setNewTarget(num = null) {
    if (num !== null) {
      currentTarget = num;
    } else {
      const candidates = SAMPLE_COMPOSITES.filter((n) => n !== currentTarget);
      currentTarget = candidates[Math.floor(Math.random() * candidates.length)];
    }

    targetDisplay.textContent = currentTarget;
    exprInput.value = "";
    challengeStartTime = performance.now();
    updateLiveProduct();

    if (verdictBanner) {
      verdictBanner.style.display = "none";
      verdictBanner.className = "mini-verdict-banner";
      verdictBanner.innerHTML = "";
    }

    if (window.gsap) {
      window.gsap.fromTo(
        targetDisplay,
        { scale: 0.8, opacity: 0.5 },
        { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" },
      );
    }
  }

  // Parse input expression and calculate product
  function parseCurrentFactors() {
    const raw = exprInput.value.trim();
    if (!raw) return [];
    try {
      return parseExpressionToFactors(raw);
    } catch {
      return [];
    }
  }

  function updateLiveProduct() {
    const factors = parseCurrentFactors();
    let product = 1;
    let hasNonPrime = false;

    for (const f of factors) {
      product *= f;
      if (!isPrime(f)) hasNonPrime = true;
    }

    if (factors.length === 0) {
      if (productDisplay) productDisplay.textContent = "1";
      return;
    }

    if (productDisplay) {
      productDisplay.textContent = product.toLocaleString();
      if (product === currentTarget) {
        productDisplay.style.color = "#10B981";
      } else if (product > currentTarget) {
        productDisplay.style.color = "#EF4444";
      } else {
        productDisplay.style.color = "#38BDF8";
      }
    }
  }

  // Add prime pill factor
  primePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      playSound("click");
      const primeVal = pill.getAttribute("data-prime");
      if (!primeVal) return;

      const currentText = exprInput.value.trim();
      if (!currentText) {
        exprInput.value = primeVal;
      } else {
        exprInput.value = `${currentText} × ${primeVal}`;
      }
      updateLiveProduct();
      exprInput.focus();
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      playSound("click");
      exprInput.value = "";
      updateLiveProduct();
      if (verdictBanner) verdictBanner.style.display = "none";
      exprInput.focus();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      playSound("click");
      setNewTarget();
    });
  }

  exprInput.addEventListener("input", () => {
    updateLiveProduct();
    if (verdictBanner) verdictBanner.style.display = "none";
  });

  exprInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      checkAnswer();
    }
  });

  function checkAnswer() {
    const factors = parseCurrentFactors();
    if (factors.length === 0) {
      playSound("alert");
      showVerdict(
        false,
        "Please enter or tap prime factors (e.g. 2³ × 3² × 5)",
      );
      return;
    }

    // Check if every factor is actually prime
    const nonPrimes = factors.filter((f) => !isPrime(f));
    if (nonPrimes.length > 0) {
      playSound("alert");
      showVerdict(
        false,
        `Decomposition error: ${nonPrimes[0]} is not a prime number! Break it down further.`,
      );
      return;
    }

    let product = 1;
    for (const f of factors) product *= f;

    const elapsedSec = (
      (performance.now() - challengeStartTime) /
      1000
    ).toFixed(1);

    if (product === currentTarget) {
      playSound("correct");
      playSound("fanfare");
      triggerFlash("rgba(16, 185, 129, 0.25)");

      const canonForm = formatExponentialString(
        toExponentialForm(factorize(currentTarget)),
      );

      showVerdict(
        true,
        `
        <div>
          <strong>🎯 Flawless Decomposition!</strong> ${currentTarget} = ${canonForm} · Solved in <strong>${elapsedSec}s</strong>!
          <div style="font-size: 0.85rem; font-weight: normal; margin-top: 4px; opacity: 0.9;">
            You just performed an Olympiad-grade mental factorization. Step into the rated arena to officially climb the 12-Tier ladder!
          </div>
        </div>
        <a href="./contract.html?min=1&max=500&title=Tier%202%3A%20201%20-%20500&mode=rated" class="btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.88rem; background: #10B981; border: none; white-space: nowrap;">
          <span>Play Full Match →</span>
        </a>
      `,
      );
    } else if (product < currentTarget) {
      playSound("alert");
      const missing = currentTarget / product;
      const hint = Number.isInteger(missing)
        ? `Missing a factor of ${missing}`
        : "Current product is smaller than target";
      showVerdict(
        false,
        `Product is ${product.toLocaleString()} (Target: ${currentTarget.toLocaleString()}). ${hint}.`,
      );
    } else {
      playSound("alert");
      showVerdict(
        false,
        `Product exceeded target: ${product.toLocaleString()} > ${currentTarget.toLocaleString()}. Too many factors.`,
      );
    }
  }

  function showVerdict(isSuccess, htmlContent) {
    if (!verdictBanner) return;
    verdictBanner.className = `mini-verdict-banner ${isSuccess ? "mini-verdict-success" : "mini-verdict-error"}`;
    verdictBanner.innerHTML = htmlContent;
    verdictBanner.style.display = "flex";
  }

  submitBtn.addEventListener("click", checkAnswer);

  // Initialize with 360
  setNewTarget(360);
}

/**
 * 4. DYNAMIC CLOUD LEDGER (Firebase Firestore Powered)
 */
export function renderPersonalLedger(authState) {
  const user =
    authState?.user !== undefined ? authState.user : getCurrentUser();
  const profile =
    authState?.profile !== undefined ? authState.profile : getCurrentProfile();
  const loggedIn = Boolean(user) || isUserLoggedIn();

  const examsEl = document.getElementById("ledger-exams-count");
  const highEl = document.getElementById("ledger-high-score");
  const streakEl = document.getElementById("ledger-best-streak");
  const accuracyEl = document.getElementById("ledger-accuracy-rate");
  const accuracyFill = document.getElementById("ledger-accuracy-bar");
  const guestOverlay = document.getElementById("ledger-guest-lock-overlay");
  const userBanner = document.getElementById("ledger-user-banner");

  // User Profile Node Elements
  const avatarImg = document.getElementById("ledger-user-avatar");
  const avatarFallback = document.getElementById("ledger-user-avatar-fallback");
  const nameEl = document.getElementById("ledger-user-name");
  const eloTag = document.getElementById("ledger-user-elo");
  const tierTag = document.getElementById("ledger-user-tier");

  if (loggedIn) {
    if (guestOverlay) {
      guestOverlay.hidden = true;
      guestOverlay.style.display = "none";
    }
    if (userBanner) {
      userBanner.hidden = false;
      userBanner.style.display = "flex";
    }

    const elo = typeof profile?.elo === "number" ? profile.elo : 500;
    const tier = getTierByElo(elo);
    const totalMatches = Number(profile?.total_matches || 0);
    const bestStreak = Number(profile?.best_streak || 0);
    const highScore = Number(profile?.high_score || 0);
    const displayName =
      profile?.displayName || user?.displayName || "Competitor";
    const photoURL = profile?.photoURL || user?.photoURL || "";

    if (examsEl) examsEl.textContent = totalMatches.toLocaleString();
    if (highEl) highEl.textContent = `${highScore.toLocaleString()} pts`;
    if (streakEl) streakEl.textContent = `${bestStreak.toLocaleString()} Wins`;

    const totalQuestions = totalMatches * 10;
    const accRate =
      totalQuestions > 0
        ? Math.min(
            100,
            Math.round(((profile?.total_solved || 0) / totalQuestions) * 100),
          )
        : 100;

    if (accuracyEl) accuracyEl.textContent = `${accRate}%`;
    if (accuracyFill) accuracyFill.style.width = `${accRate}%`;

    if (nameEl) nameEl.textContent = displayName;
    if (eloTag) eloTag.textContent = `${elo.toLocaleString()} ELO`;
    if (tierTag) {
      tierTag.textContent = `${tier.symbol} ${tier.title}`;
      tierTag.style.color = tier.colorHex;
    }

    if (avatarImg && photoURL) {
      avatarImg.src = photoURL;
      avatarImg.style.display = "block";
      if (avatarFallback) avatarFallback.style.display = "none";
    } else if (avatarFallback) {
      if (avatarImg) avatarImg.style.display = "none";
      avatarFallback.style.display = "flex";
      avatarFallback.textContent = (displayName || "U")[0].toUpperCase();
    }
  } else {
    // Guest view: Show lock overlay with Sign-In CTA
    if (guestOverlay) {
      guestOverlay.hidden = false;
      guestOverlay.style.display = "flex";
    }
    if (userBanner) {
      userBanner.hidden = true;
      userBanner.style.display = "none";
    }

    if (examsEl) examsEl.textContent = "—";
    if (highEl) highEl.textContent = "—";
    if (streakEl) streakEl.textContent = "—";
    if (accuracyEl) accuracyEl.textContent = "—";
    if (accuracyFill) accuracyFill.style.width = "0%";

    const overlaySigninBtn = document.getElementById(
      "ledger-overlay-signin-btn",
    );
    if (overlaySigninBtn) {
      overlaySigninBtn.onclick = () => {
        playSound("click");
        signInWithGoogle().catch((err) => console.error(err));
      };
    }
  }
}

const SETTINGS_TOGGLE_BINDINGS = [
  ["local-toggle-second-attempt", "allowSecondAttempt"],
  ["local-toggle-pauses", "allowPause"],
  ["local-toggle-regen", "allowRegenerate"],
  ["local-toggle-hints", "allowHint"],
  ["local-toggle-audio", "soundEnabled"],
];

export function syncCloudSettingsFromProfile(authState) {
  const profile =
    authState?.profile !== undefined ? authState.profile : getCurrentProfile();
  if (
    profile?.settings &&
    typeof profile.settings === "object" &&
    Object.keys(profile.settings).length > 0
  ) {
    updateSettings(profile.settings);
  }
  const current = getSettings();
  for (const [id, key] of SETTINGS_TOGGLE_BINDINGS) {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(current[key]);
  }
}

/**
 * 5. CLOUD PROFILE & SETTINGS NODE
 */
function initCloudSettingsNode() {
  const current = getSettings();

  for (const [id, key] of SETTINGS_TOGGLE_BINDINGS) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.checked = Boolean(current[key]);
    el.addEventListener("change", async () => {
      playSound("click");
      updateSettings({ [key]: el.checked });

      if (isUserLoggedIn()) {
        try {
          await updateUserProfile({
            settings: {
              ...getSettings(),
              [key]: el.checked,
            },
          });
        } catch (e) {
          console.warn("[Firebase] Settings sync error:", e);
        }
      }
    });
  }
}

/**
 * 6. INSTANT RANDOMIZER SLOT MACHINE
 */
function initInstantRandomizer() {
  const card = document.getElementById("randomizer-trigger-card");
  const slotText = document.getElementById("slot-machine-target");
  if (!card || !slotText) return;

  const ranges = [
    { min: 1, max: 200, label: "Tier 1: 1 - 200" },
    { min: 201, max: 500, label: "Tier 2: 201 - 500" },
    { min: 501, max: 1000, label: "Tier 3: 501 - 1,000" },
    { min: 1001, max: 2000, label: "Tier 4: 1,001 - 2,000" },
    { min: 2001, max: 5000, label: "Tier 5: 2,001 - 5,000" },
    { min: 5001, max: 10000, label: "Tier 6: 5,001 - 10,000" },
    { min: 10001, max: 20000, label: "Tier 7: 10,001 - 20,000" },
    { min: 20001, max: 35000, label: "Tier 8: 20,001 - 35,000" },
    { min: 1, max: 50000, label: "Omega: 1 - 50,000+" },
  ];

  let isRolling = false;
  let rollTimer = 0;

  // A bfcache restore (browser Back) could leave the card stuck in "rolling": reset it
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    clearInterval(rollTimer);
    isRolling = false;
    card.classList.remove("is-rolling", "is-landed");
    slotText.textContent = "ROLL ARENA";
  });

  // The card is a <div role="button">: make it keyboard-operable like a real button
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      card.click();
    }
  });

  card.addEventListener("click", () => {
    if (isRolling) return;
    isRolling = true;
    card.classList.remove("is-landed");
    card.classList.add("is-rolling");
    playSound("alert");

    let rollCount = 0;
    const maxRolls = 14;
    const chosenIndex = Math.floor(Math.random() * ranges.length);
    const chosenRange = ranges[chosenIndex];

    rollTimer = setInterval(() => {
      rollCount++;
      // never show the same label twice in a row so the reel always looks like it is moving
      let randomIdx = Math.floor(Math.random() * ranges.length);
      if (ranges[randomIdx].label === slotText.textContent)
        randomIdx = (randomIdx + 1) % ranges.length;
      slotText.textContent = ranges[randomIdx].label;

      if (window.gsap) {
        window.gsap.fromTo(
          slotText,
          { y: -15, opacity: 0.7 },
          { y: 0, opacity: 1, duration: 0.07, ease: "none", overwrite: true },
        );
      }

      if (rollCount >= maxRolls) {
        clearInterval(rollTimer);
        slotText.textContent = chosenRange.label;
        card.classList.remove("is-rolling");
        card.classList.add("is-landed");
        playSound("correct");

        if (window.gsap) {
          window.gsap.fromTo(
            slotText,
            { scale: 1.25, color: "#38BDF8" },
            {
              scale: 1,
              color: "#FFFFFF",
              duration: 0.35,
              ease: "back.out(2)",
              overwrite: true,
            },
          );
        }

        setTimeout(() => {
          setActiveExamParams({
            min: chosenRange.min,
            max: chosenRange.max,
            title: chosenRange.label,
            rules: getSettings(),
          });
          window.location.href = `./exam.html?min=${chosenRange.min}&max=${chosenRange.max}&title=${encodeURIComponent(chosenRange.label)}`;
        }, 450);
      }
    }, 55);
  });
}

/**
 * 7. PRIME PLAYGROUND LIVE POLLARD'S RHO SANDBOX
 */
function initPrimePlayground() {
  const input = document.getElementById("playground-integer-input");
  const formulaEl = document.getElementById("playground-formula-output");
  const bubblesWrap = document.getElementById("playground-bubbles-wrap");
  const tagEl = document.getElementById("playground-verdict-tag");

  if (!input || !formulaEl || !bubblesWrap || !tagEl) return;

  function executeDecomposition() {
    const rawVal = input.value.trim();
    if (!rawVal) {
      formulaEl.textContent = "Enter any integer above 1";
      bubblesWrap.innerHTML = "";
      tagEl.textContent = "Awaiting input...";
      return;
    }

    const n = Number(rawVal);
    if (isNaN(n) || !Number.isInteger(n) || n <= 1) {
      formulaEl.textContent = "Invalid Integer";
      bubblesWrap.innerHTML = "";
      tagEl.textContent = "Please enter an integer >= 2";
      return;
    }

    if (n > 10000000) {
      formulaEl.textContent = "Input exceeds engine limit";
      bubblesWrap.innerHTML = "";
      tagEl.textContent =
        "Maximum supported casual sandbox range is 10,000,000";
      return;
    }

    const t0 = performance.now();
    const factors = factorize(n);
    const elapsed = (performance.now() - t0).toFixed(2);

    if (isPrime(n)) {
      formulaEl.textContent = `${n} is Prime!`;
      bubblesWrap.innerHTML = `<span class="factor-bubble">${n}</span>`;
      tagEl.textContent = `Deterministic Miller-Rabin Primality Verified (${elapsed}ms)`;
      return;
    }

    const expForm = toExponentialForm(factors);
    const formatted = formatExponentialString(expForm);

    formulaEl.textContent = `${n} = ${formatted}`;

    bubblesWrap.innerHTML = factors
      .map(
        (f, i) =>
          `<span class="factor-bubble" style="animation-delay: ${i * 0.04}s">${f}</span>`,
      )
      .join("");

    tagEl.textContent = `Pollard's Rho Complete in ${elapsed}ms · ${factors.length} total prime factors (${expForm.length} distinct)`;
  }

  input.addEventListener("input", executeDecomposition);
  executeDecomposition();
}
