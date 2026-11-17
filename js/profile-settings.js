/**
 * PrimeFactor.app — Profile System Settings Controller (V3.4)
 * Connected directly to Cloud Firestore & Firebase Authentication.
 * Awaits waitForAuthReady() to avoid guest flash on page load, supports
 * real-time @handle validation/claiming, and syncs public profile fields.
 */

import { getSettings, updateSettings } from "./storage.js";
import { playSound } from "./audio.js";
import { renderFooter, initGlobalHeader } from "./header.js";
import { showToast } from "./notification-engine.js";
import { getUserElo, getUserPeakElo, getTierByElo } from "./elo-engine.js";
import {
  waitForAuthReady,
  isUserLoggedIn,
  getCurrentUser,
  getCurrentProfile,
  onAuthChange,
  signInWithGoogle,
  updateUserProfile,
  refreshProfile,
  normalizeHandle,
  isValidHandleFormat,
  checkHandleAvailability,
} from "./firebase.js";

const UNLOAD_WARNING_MESSAGE =
  "Changes you made may not be saved. Are you sure you want to leave?";

let isDirty = false;
let listenersBound = false;
let handleCheckSeq = 0;
let handleCheckDebounce = null;
let initialState = {
  handle: "",
  realName: "",
  city: "",
  country: "",
  organization: "",
  enrollCause: "Olympiad Training",
  soundEnabled: true,
  allowSecondAttempt: true,
  allowPause: true,
  username: "",
};

document.addEventListener("DOMContentLoaded", async () => {
  initGlobalHeader();
  renderFooter();
  initExitPreventionGuard();

  await waitForAuthReady();
  initProfileSettingsEngine();

  onAuthChange(() => {
    initProfileSettingsEngine();
  });
});

function setHandleStatus(message, tone = "muted") {
  const statusEl = document.getElementById("setting-handle-status");
  const handleInput = document.getElementById("setting-handle");
  if (!statusEl) return;

  statusEl.textContent = message || "";
  if (tone === "error") {
    statusEl.style.color = "#F87171";
    if (handleInput) handleInput.style.borderColor = "#EF4444";
  } else if (tone === "success") {
    statusEl.style.color = "#34D399";
    if (handleInput) handleInput.style.borderColor = "#10B981";
  } else if (tone === "checking") {
    statusEl.style.color = "#38BDF8";
    if (handleInput) handleInput.style.borderColor = "rgba(56, 189, 248, 0.5)";
  } else {
    statusEl.style.color = "#94A3B8";
    if (handleInput) handleInput.style.borderColor = "";
  }
}

function initProfileSettingsEngine() {
  const settings = getSettings();
  const loggedIn = isUserLoggedIn();
  const user = getCurrentUser();
  const profile = getCurrentProfile();

  // Field DOM Elements
  const handleInput = document.getElementById("setting-handle");
  const realNameInput = document.getElementById("setting-realname");
  const cityInput = document.getElementById("setting-city");
  const countryInput = document.getElementById("setting-country");
  const orgInput = document.getElementById("setting-organization");
  const causeSelect = document.getElementById("setting-enroll-cause");
  const userHandle = document.getElementById("setting-username");

  // Switch Elements
  const soundCheck = document.getElementById("setting-sound");
  const secondCheck = document.getElementById("setting-second-attempt");
  const pauseCheck = document.getElementById("setting-pause");

  // Action & Feedback Nodes
  const saveBtn = document.getElementById("btn-save-settings");
  const unsavedWarningBanner = document.getElementById(
    "unsaved-warning-banner",
  );
  const saveBanner = document.getElementById("save-banner");
  const tokenDisplay = document.getElementById("display-profile-token");
  const btnCopyToken = document.getElementById("btn-copy-token");
  const btnReSign = document.getElementById("btn-re-sign");

  // Guest warning banner management
  let guestBanner = document.getElementById("profile-settings-guest-banner");
  const mainWrapper =
    document.querySelector("main") ||
    document.querySelector(".content-container") ||
    document.body;

  if (!loggedIn) {
    if (!guestBanner) {
      guestBanner = document.createElement("div");
      guestBanner.id = "profile-settings-guest-banner";
      guestBanner.className = "guest-warning-banner";
      guestBanner.style.margin = "20px auto";
      guestBanner.style.maxWidth = "900px";
      guestBanner.innerHTML = `
        <div style="font-size: 1.5rem;">🔒</div>
        <div class="guest-warning-text">
          <strong>Authentication Required:</strong> You are browsing as an unauthenticated guest. Profile customization, certified credentials, and display settings can only be saved to Cloud Firestore after signing in.
        </div>
        <button type="button" class="guest-warning-btn" id="settings-guest-signin-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Sign In with Google
        </button>
      `;
      const formSection =
        document.querySelector("section") ||
        document.querySelector("form") ||
        mainWrapper.firstChild;
      if (formSection && formSection.parentNode) {
        formSection.parentNode.insertBefore(guestBanner, formSection);
      } else {
        mainWrapper.prepend(guestBanner);
      }
      const signinBtn = guestBanner.querySelector("#settings-guest-signin-btn");
      if (signinBtn) {
        signinBtn.addEventListener("click", () => {
          signInWithGoogle().catch((err) => console.error(err));
        });
      }
    }
  } else if (guestBanner) {
    guestBanner.remove();
  }

  // --- STATE SYNCHRONIZATION (From Firestore profile) ---
  initialState = {
    handle: profile?.handle || "",
    realName: profile?.realName || "",
    city: profile?.city || "",
    country: profile?.country || "",
    organization: profile?.organization || "",
    enrollCause: profile?.enrollCause || "Olympiad Training",
    soundEnabled:
      profile?.settings?.soundEnabled ?? settings.soundEnabled ?? true,
    allowSecondAttempt:
      profile?.settings?.allowSecondAttempt ??
      settings.allowSecondAttempt ??
      true,
    allowPause: profile?.settings?.allowPause ?? settings.allowPause ?? true,
    username: profile?.displayName || user?.displayName || "",
  };

  if (handleInput) {
    handleInput.value = initialState.handle;
    setHandleStatus(
      loggedIn && initialState.handle
        ? `✓ Active handle: @${initialState.handle}`
        : "Sign in to claim a unique @handle",
      loggedIn && initialState.handle ? "success" : "muted",
    );
  }
  if (realNameInput) realNameInput.value = initialState.realName;
  if (cityInput) cityInput.value = initialState.city;
  if (countryInput) countryInput.value = initialState.country;
  if (orgInput) orgInput.value = initialState.organization;
  if (causeSelect) causeSelect.value = initialState.enrollCause;
  if (userHandle) userHandle.value = initialState.username;

  if (soundCheck) soundCheck.checked = initialState.soundEnabled;
  if (secondCheck) secondCheck.checked = initialState.allowSecondAttempt;
  if (pauseCheck) pauseCheck.checked = initialState.allowPause;

  // Live Token & ELO Status
  const token = user?.uid ? user.uid : "Not Signed In";
  if (tokenDisplay) tokenDisplay.textContent = token;

  const currentElo = getUserElo();
  const peakElo = getUserPeakElo();
  const currentTier = getTierByElo(currentElo);

  const tierDisplay = document.getElementById("display-profile-tier");
  const eloDisplay = document.getElementById("display-profile-elo");
  if (tierDisplay) {
    tierDisplay.textContent = `${currentTier.symbol} ${currentTier.title}`;
    tierDisplay.style.color = currentTier.colorHex;
  }
  if (eloDisplay) {
    eloDisplay.textContent = `${currentElo.toLocaleString()} ELO · Peak: ${peakElo.toLocaleString()} ELO`;
  }

  if (btnReSign) {
    btnReSign.innerHTML = `<span>🔄 Cloud Sync</span>`;
  }

  isDirty = false;
  if (saveBtn) {
    saveBtn.classList.add("btn-save-inactive");
    saveBtn.classList.remove("btn-save-active-wake");
  }
  if (unsavedWarningBanner && unsavedWarningBanner.style.background === "") {
    unsavedWarningBanner.style.display = "none";
  }

  if (listenersBound) return;
  listenersBound = true;

  const validateHandleInputRealtime = () => {
    if (!handleInput) return;
    const raw = handleInput.value;
    const cleaned = raw.replace(/^@+/, "").toLowerCase();
    if (cleaned !== raw) {
      handleInput.value = cleaned;
    }

    if (!cleaned) {
      setHandleStatus(
        "Handle is required (3–20 lowercase letters, numbers, or _).",
        "error",
      );
      return;
    }
    if (!isValidHandleFormat(cleaned)) {
      setHandleStatus(
        "Invalid handle: use 3–20 lowercase chars (a-z, 0-9, _).",
        "error",
      );
      return;
    }
    if (cleaned === initialState.handle) {
      setHandleStatus(`✓ Active handle: @${cleaned}`, "success");
      return;
    }

    setHandleStatus(`Checking availability for @${cleaned}...`, "checking");
    const seq = ++handleCheckSeq;
    clearTimeout(handleCheckDebounce);
    handleCheckDebounce = setTimeout(async () => {
      try {
        const res = await checkHandleAvailability(cleaned);
        if (seq !== handleCheckSeq) return;
        if (!res.valid) {
          setHandleStatus(
            "Invalid handle: use 3–20 lowercase chars (a-z, 0-9, _).",
            "error",
          );
        } else if (res.available) {
          setHandleStatus(`✓ @${res.normalized} is available!`, "success");
        } else {
          setHandleStatus(
            `✗ @${res.normalized} is already taken by another competitor.`,
            "error",
          );
        }
      } catch (err) {
        if (seq !== handleCheckSeq) return;
        setHandleStatus(
          "Unable to verify handle availability right now.",
          "muted",
        );
      }
    }, 320);
  };

  const checkMutationState = () => {
    const currentValues = {
      handle: handleInput
        ? normalizeHandle(handleInput.value)
        : initialState.handle,
      realName: realNameInput
        ? realNameInput.value.trim()
        : initialState.realName,
      city: cityInput ? cityInput.value.trim() : initialState.city,
      country: countryInput ? countryInput.value.trim() : initialState.country,
      organization: orgInput
        ? orgInput.value.trim()
        : initialState.organization,
      enrollCause: causeSelect ? causeSelect.value : initialState.enrollCause,
      soundEnabled: soundCheck ? soundCheck.checked : initialState.soundEnabled,
      allowSecondAttempt: secondCheck
        ? secondCheck.checked
        : initialState.allowSecondAttempt,
      allowPause: pauseCheck ? pauseCheck.checked : initialState.allowPause,
      username: userHandle ? userHandle.value.trim() : initialState.username,
    };

    const hasMutated =
      currentValues.handle !== initialState.handle ||
      currentValues.realName !== initialState.realName ||
      currentValues.city !== initialState.city ||
      currentValues.country !== initialState.country ||
      currentValues.organization !== initialState.organization ||
      currentValues.enrollCause !== initialState.enrollCause ||
      currentValues.soundEnabled !== initialState.soundEnabled ||
      currentValues.allowSecondAttempt !== initialState.allowSecondAttempt ||
      currentValues.allowPause !== initialState.allowPause ||
      currentValues.username !== initialState.username;

    if (hasMutated) {
      if (!isDirty) {
        isDirty = true;
        if (saveBtn) {
          saveBtn.classList.remove("btn-save-inactive");
          saveBtn.classList.add("btn-save-active-wake");
        }
        if (unsavedWarningBanner) {
          unsavedWarningBanner.style.background = "";
          unsavedWarningBanner.style.borderColor = "";
          unsavedWarningBanner.style.color = "";
          unsavedWarningBanner.style.boxShadow = "";
          unsavedWarningBanner.innerHTML = `
            <span style="font-size: 1.15rem;">⚠️</span>
            <span>Unsaved Changes Detected — Click &quot;Save Configuration&quot; to commit to Cloud Firestore.</span>
          `;
          unsavedWarningBanner.style.display = "flex";
        }
      }
    } else if (isDirty) {
      isDirty = false;
      if (saveBtn) {
        saveBtn.classList.remove("btn-save-active-wake");
        saveBtn.classList.add("btn-save-inactive");
      }
      if (unsavedWarningBanner) {
        unsavedWarningBanner.style.display = "none";
      }
    }
  };

  if (handleInput) {
    handleInput.addEventListener("input", () => {
      validateHandleInputRealtime();
      checkMutationState();
    });
    handleInput.addEventListener("change", () => {
      validateHandleInputRealtime();
      checkMutationState();
    });
  }

  [
    realNameInput,
    cityInput,
    countryInput,
    orgInput,
    causeSelect,
    userHandle,
  ].forEach((fieldNode) => {
    if (fieldNode) {
      fieldNode.addEventListener("input", checkMutationState);
      fieldNode.addEventListener("change", checkMutationState);
    }
  });

  [soundCheck, secondCheck, pauseCheck].forEach((switchNode) => {
    if (switchNode) {
      switchNode.addEventListener("change", () => {
        playSound("click");
        checkMutationState();
      });
    }
  });

  if (btnCopyToken) {
    btnCopyToken.addEventListener("click", async () => {
      playSound("click");
      const u = getCurrentUser();
      const textToCopy = u?.uid || "Not Signed In";
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
        }
      } catch (e) {
        console.warn("Clipboard write fallback:", e);
      }
      btnCopyToken.textContent = "✔️ Copied!";
      btnCopyToken.classList.add("btn-neon-copied-glow");
      setTimeout(() => {
        btnCopyToken.textContent = "Copy";
        btnCopyToken.classList.remove("btn-neon-copied-glow");
      }, 1500);
    });
  }

  if (btnReSign) {
    btnReSign.addEventListener("click", async () => {
      playSound("click");
      if (!isUserLoggedIn()) {
        signInWithGoogle().catch((err) => console.error(err));
        return;
      }
      btnReSign.classList.add("btn-neon-copied-glow");
      await refreshProfile();
      showToast({
        type: "success",
        title: "Cloud Sync Complete",
        message:
          "Your competitive telemetry and handle have been synchronized with Cloud Firestore.",
      });
      if (saveBanner) {
        saveBanner.textContent = "✔ Profile synchronized with Cloud Firestore!";
        saveBanner.style.background = "rgba(16, 185, 129, 0.15)";
        saveBanner.style.borderColor = "#10b981";
        saveBanner.style.color = "#34d399";
        saveBanner.style.boxShadow = "0 0 15px rgba(16, 185, 129, 0.25)";
        saveBanner.style.display = "block";
        setTimeout(() => {
          btnReSign.classList.remove("btn-neon-copied-glow");
          saveBanner.style.display = "none";
        }, 2500);
      } else {
        setTimeout(
          () => btnReSign.classList.remove("btn-neon-copied-glow"),
          1500,
        );
      }
    });
  }

  // Save Configuration Action
  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (!isUserLoggedIn()) {
        playSound("alert");
        showToast({
          type: "warning",
          title: "Authentication Required",
          message:
            "Sign in with Google to save your profile configuration and @handle to Cloud Firestore.",
        });
        if (unsavedWarningBanner) {
          unsavedWarningBanner.style.display = "flex";
          unsavedWarningBanner.style.background = "#DC2626";
          unsavedWarningBanner.style.borderColor = "#EF4444";
          unsavedWarningBanner.style.color = "#FFFFFF";
          unsavedWarningBanner.innerHTML = `<span>⚠️ You must sign in with Google to save profile settings to Cloud Firestore.</span>`;
        }
        signInWithGoogle().catch((err) => console.error(err));
        return;
      }

      const activeUser = getCurrentUser();
      const rawHandle = handleInput ? handleInput.value : initialState.handle;
      const newHandle = normalizeHandle(rawHandle);

      if (!isValidHandleFormat(newHandle)) {
        playSound("error");
        setHandleStatus(
          "Handle must be 3–20 lowercase letters, numbers, or underscores.",
          "error",
        );
        showToast({
          type: "error",
          title: "Invalid Competitor Handle",
          message:
            "Handle must be 3–20 lowercase letters, numbers, or underscores.",
        });
        if (unsavedWarningBanner) {
          unsavedWarningBanner.style.display = "flex";
          unsavedWarningBanner.style.background = "#DC2626";
          unsavedWarningBanner.style.borderColor = "#EF4444";
          unsavedWarningBanner.style.color = "#FFFFFF";
          unsavedWarningBanner.innerHTML = `<span>❌ Invalid @handle: Must be 3–20 lowercase letters, numbers, or underscores.</span>`;
        }
        return;
      }

      if (newHandle !== initialState.handle) {
        try {
          const check = await checkHandleAvailability(newHandle);
          if (!check.available) {
            playSound("error");
            setHandleStatus(
              `✗ @${newHandle} is already taken by another competitor.`,
              "error",
            );
            showToast({
              type: "error",
              title: "Handle Unavailable",
              message: `Handle @${newHandle} is already claimed by another competitor. Please choose another.`,
            });
            if (unsavedWarningBanner) {
              unsavedWarningBanner.style.display = "flex";
              unsavedWarningBanner.style.background = "#DC2626";
              unsavedWarningBanner.style.borderColor = "#EF4444";
              unsavedWarningBanner.style.color = "#FFFFFF";
              unsavedWarningBanner.innerHTML = `<span>❌ Handle @${newHandle} is already claimed by another competitor. Please choose another.</span>`;
            }
            return;
          }
        } catch (err) {
          console.warn(
            "[Settings] Handle pre-check error (falling back to atomic transaction):",
            err,
          );
        }
      }

      const newRealName = realNameInput ? realNameInput.value.trim() : "";
      const newCity = cityInput ? cityInput.value.trim() : "";
      const newCountry = countryInput ? countryInput.value.trim() : "";
      const newOrg = orgInput ? orgInput.value.trim() : "";
      const newCause = causeSelect ? causeSelect.value : "Olympiad Training";
      const savedUsername =
        userHandle && userHandle.value.trim()
          ? userHandle.value.trim()
          : activeUser?.displayName || "Competitor";

      const newSound = soundCheck ? soundCheck.checked : true;
      const newSecond = secondCheck ? secondCheck.checked : true;
      const newPause = pauseCheck ? pauseCheck.checked : true;

      updateSettings({
        soundEnabled: newSound,
        allowSecondAttempt: newSecond,
        allowPause: newPause,
      });

      try {
        await updateUserProfile({
          handle: newHandle,
          realName: newRealName,
          city: newCity,
          country: newCountry,
          organization: newOrg,
          enrollCause: newCause,
          displayName: savedUsername,
          settings: {
            soundEnabled: newSound,
            allowSecondAttempt: newSecond,
            allowPause: newPause,
          },
        });

        playSound("correct");
        if (handleInput) handleInput.value = newHandle;
        setHandleStatus(`✓ Active handle: @${newHandle}`, "success");
        showToast({
          type: "success",
          title: "Configuration Saved",
          message: `Profile settings and @${newHandle} synced to Cloud Firestore & public leaderboard.`,
        });

        initialState = {
          handle: newHandle,
          realName: newRealName,
          city: newCity,
          country: newCountry,
          organization: newOrg,
          enrollCause: newCause,
          soundEnabled: newSound,
          allowSecondAttempt: newSecond,
          allowPause: newPause,
          username: savedUsername,
        };

        isDirty = false;
        saveBtn.classList.remove("btn-save-active-wake");
        saveBtn.classList.add("btn-save-inactive");

        if (unsavedWarningBanner) {
          unsavedWarningBanner.style.display = "flex";
          unsavedWarningBanner.style.background = "rgba(16, 185, 129, 0.15)";
          unsavedWarningBanner.style.borderColor = "#10b981";
          unsavedWarningBanner.style.color = "#34d399";
          unsavedWarningBanner.style.boxShadow =
            "0 0 18px rgba(16, 185, 129, 0.35)";
          unsavedWarningBanner.innerHTML = `<span>✔ Configuration Saved to Cloud Firestore &amp; Leaderboard Synced!</span>`;

          setTimeout(() => {
            if (
              !isDirty &&
              unsavedWarningBanner.textContent.includes("Saved")
            ) {
              unsavedWarningBanner.style.display = "none";
            }
          }, 3500);
        }

        if (saveBanner) {
          saveBanner.textContent =
            "✔ Profile settings & @handle committed to Cloud Firestore!";
          saveBanner.style.background = "rgba(16, 185, 129, 0.15)";
          saveBanner.style.borderColor = "#10b981";
          saveBanner.style.color = "#34d399";
          saveBanner.style.boxShadow = "0 0 15px rgba(16, 185, 129, 0.25)";
          saveBanner.style.display = "block";
          setTimeout(() => {
            saveBanner.style.display = "none";
          }, 3500);
        }
      } catch (err) {
        console.error("Failed to save profile settings to Firestore:", err);
        playSound("error");
        const msg = String(err?.message || "").replace(/^HANDLE_TAKEN:\s*/, "");
        if (msg.includes("taken") || msg.includes("Handle")) {
          setHandleStatus(`✗ ${msg}`, "error");
        }
        showToast({
          type: "error",
          title: "Cloud Save Error",
          message:
            msg || "Permission denied while saving profile configuration.",
        });
        if (unsavedWarningBanner) {
          unsavedWarningBanner.style.display = "flex";
          unsavedWarningBanner.style.background = "#DC2626";
          unsavedWarningBanner.style.borderColor = "#EF4444";
          unsavedWarningBanner.style.color = "#FFFFFF";
          unsavedWarningBanner.innerHTML = `<span>❌ Error saving to Firestore: ${msg || "Permission denied"}</span>`;
        }
      }
    };
  }
}

function initExitPreventionGuard() {
  window.addEventListener("beforeunload", (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = UNLOAD_WARNING_MESSAGE;
      return UNLOAD_WARNING_MESSAGE;
    }
  });

  document.querySelectorAll("a[href]").forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#" || href.startsWith("#")) return;

      if (isDirty) {
        let allowLeave = true;
        try {
          allowLeave = window.confirm(UNLOAD_WARNING_MESSAGE);
        } catch {
          allowLeave = true;
        }
        if (!allowLeave) {
          e.preventDefault();
          return false;
        }
      }
    });
  });
}
