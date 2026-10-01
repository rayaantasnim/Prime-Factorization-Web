/**
 * PrimeFactor.app — Profile System Settings Controller
 * Handles live, ledger-validated multi-input identity configuration matrix,
 * interlocking mutation control engine (isDirty state wake-up trigger),
 * and native window thread beforeunload exit interception guard.
 */

import { getSettings, updateSettings } from './storage.js';
import { playSound } from './audio.js';
import { renderFooter } from './header.js';
import { getUserElo, getUserPeakElo, getTierByElo, reSignProfileDirectory, initServerlessOnboarding } from './elo-engine.js';

const UNLOAD_WARNING_MESSAGE = "Changes you made may not be saved. Are you sure you want to leave?";

// Global validation state tracking flag
let isDirty = false;

// Background object cache locking the exact 5 initial input values in memory
let initialState = {
  realName: 'None',
  city: 'None',
  country: 'None',
  organization: 'None',
  enrollCause: 'Olympiad Training'
};

document.addEventListener('DOMContentLoaded', () => {
  initServerlessOnboarding();
  renderFooter();
  initDropdownNavigation();
  initProfileSettingsEngine();
  initExitPreventionGuard();
});

/**
 * 1. UNIFIED TOP NAVIGATION DROPDOWN CONTROLLER
 */
function initDropdownNavigation() {
  const menuToggle = document.querySelector('.nav-hamburger-btn') || document.getElementById('menu-toggle');
  const dropdownMenu = document.querySelector('.nav-dropdown-glass-container');
  if (menuToggle && dropdownMenu) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      const isExpanded = dropdownMenu.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', String(isExpanded));
    });

    document.addEventListener('click', (e) => {
      if (!dropdownMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        dropdownMenu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

/**
 * 2. LIVE PROFILE CONFIGURATION & MUTATION CONTROL ENGINE
 */
function initProfileSettingsEngine() {
  const settings = getSettings();

  // Field DOM Elements
  const realNameInput = document.getElementById('setting-realname');
  const cityInput = document.getElementById('setting-city');
  const countryInput = document.getElementById('setting-country');
  const orgInput = document.getElementById('setting-organization');
  const causeSelect = document.getElementById('setting-enroll-cause');
  const userHandle = document.getElementById('setting-username');

  // Switch Elements
  const soundCheck = document.getElementById('setting-sound');
  const secondCheck = document.getElementById('setting-second-attempt');
  const pauseCheck = document.getElementById('setting-pause');

  // Action & Feedback Nodes
  const saveBtn = document.getElementById('btn-save-settings');
  const unsavedWarningBanner = document.getElementById('unsaved-warning-banner');
  const saveBanner = document.getElementById('save-banner');

  // --- STATE SYNCHRONIZATION AUDIT (Fetch & Lock into initialState) ---
  initialState = {
    realName: localStorage.getItem('primefactor_profile_realname') || 'None',
    city: localStorage.getItem('primefactor_profile_city') || 'None',
    country: localStorage.getItem('primefactor_profile_country') || 'None',
    organization: localStorage.getItem('primefactor_profile_organization') || 'None',
    enrollCause: localStorage.getItem('primefactor_profile_enroll_cause') || 'Olympiad Training'
  };

  // Populate Field Elements with Audited Cache
  if (realNameInput) realNameInput.value = initialState.realName;
  if (cityInput) cityInput.value = initialState.city;
  if (countryInput) countryInput.value = initialState.country;
  if (orgInput) orgInput.value = initialState.organization;
  if (causeSelect) causeSelect.value = initialState.enrollCause;

  // Populate Live Token & ELO Status
  const token = localStorage.getItem('primefactor_profile_token') || 'OLY-PF-746525000545';
  const tokenDisplay = document.getElementById('display-profile-token');
  const btnCopyToken = document.getElementById('btn-copy-token');
  if (tokenDisplay) tokenDisplay.textContent = token;

  if (btnCopyToken) {
    btnCopyToken.addEventListener('click', async () => {
      playSound('click');
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(token);
        } else {
          const ta = document.createElement('textarea');
          ta.value = token;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
      } catch (e) {
        console.warn('Clipboard write fallback:', e);
      }
      btnCopyToken.textContent = '✔️ Copied!';
      btnCopyToken.classList.add('btn-neon-copied-glow');
      setTimeout(() => {
        btnCopyToken.textContent = 'Copy';
        btnCopyToken.classList.remove('btn-neon-copied-glow');
      }, 1500);
    });
  }

  // Populate ELO standing & Tier
  const currentElo = getUserElo();
  const peakElo = getUserPeakElo();
  const currentTier = getTierByElo(currentElo);

  const tierDisplay = document.getElementById('display-profile-tier');
  const eloDisplay = document.getElementById('display-profile-elo');
  if (tierDisplay) {
    tierDisplay.textContent = `${currentTier.symbol} ${currentTier.title}`;
    tierDisplay.style.color = currentTier.colorHex;
  }
  if (eloDisplay) {
    eloDisplay.textContent = `${currentElo.toLocaleString()} ELO · Peak: ${peakElo.toLocaleString()} ELO`;
  }

  // Populate contestant handle
  const storedUser = localStorage.getItem('primefactor_profile_username');
  if (storedUser && userHandle) {
    userHandle.value = storedUser;
  }

  // Populate switches
  if (soundCheck) {
    soundCheck.checked = settings.soundEnabled ?? true;
    soundCheck.addEventListener('change', () => playSound('click'));
  }
  if (secondCheck) {
    secondCheck.checked = settings.allowSecondAttempt ?? true;
    secondCheck.addEventListener('change', () => playSound('click'));
  }
  if (pauseCheck) {
    pauseCheck.checked = settings.allowPause ?? true;
    pauseCheck.addEventListener('change', () => playSound('click'));
  }

  // Ensure Save Button starts in dark, faded inactive state
  if (saveBtn) {
    saveBtn.classList.add('btn-save-inactive');
    saveBtn.classList.remove('btn-save-active-wake');
  }

  // --- THE LIVE WAKE-UP TRIGGER (Millisecond Mutation Monitor) ---
  const checkMutationState = () => {
    const currentValues = {
      realName: realNameInput ? realNameInput.value : initialState.realName,
      city: cityInput ? cityInput.value : initialState.city,
      country: countryInput ? countryInput.value : initialState.country,
      organization: orgInput ? orgInput.value : initialState.organization,
      enrollCause: causeSelect ? causeSelect.value : initialState.enrollCause
    };

    const hasMutated = 
      currentValues.realName !== initialState.realName ||
      currentValues.city !== initialState.city ||
      currentValues.country !== initialState.country ||
      currentValues.organization !== initialState.organization ||
      currentValues.enrollCause !== initialState.enrollCause;

    if (hasMutated) {
      if (!isDirty) {
        isDirty = true;
        // Wake up Save Configuration button to glowing active neon green layout
        if (saveBtn) {
          saveBtn.classList.remove('btn-save-inactive');
          saveBtn.classList.add('btn-save-active-wake');
        }
        // Flash yellow neon status warning banner at container header
        if (unsavedWarningBanner) {
          unsavedWarningBanner.style.display = 'flex';
          if (window.gsap) {
            window.gsap.fromTo(unsavedWarningBanner,
              { opacity: 0, y: -10 },
              { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
            );
          }
        }
      }
    } else {
      if (isDirty) {
        isDirty = false;
        // Return Save button to dark faded inactive state
        if (saveBtn) {
          saveBtn.classList.remove('btn-save-active-wake');
          saveBtn.classList.add('btn-save-inactive');
        }
        // Hide warning banner
        if (unsavedWarningBanner) {
          unsavedWarningBanner.style.display = 'none';
        }
      }
    }
  };

  // Map both input and change events across all 5 monitored identity fields
  const monitoredFields = [realNameInput, cityInput, countryInput, orgInput, causeSelect];
  monitoredFields.forEach(fieldNode => {
    if (fieldNode) {
      fieldNode.addEventListener('input', checkMutationState);
      fieldNode.addEventListener('change', checkMutationState);
    }
  });

  // Re-Anchor Signature
  const btnReSign = document.getElementById('btn-re-sign');
  if (btnReSign) {
    btnReSign.addEventListener('click', () => {
      playSound('click');
      reSignProfileDirectory();
      btnReSign.classList.add('btn-neon-copied-glow');
      if (saveBanner) {
        saveBanner.textContent = '✔️ Profile Directory Integrity Re-Anchored with HMAC!';
        saveBanner.style.display = 'block';
        setTimeout(() => {
          btnReSign.classList.remove('btn-neon-copied-glow');
          saveBanner.textContent = '✔️ Profile Settings Saved Successfully!';
          saveBanner.style.display = 'none';
        }, 2500);
      }
    });
  }

  // Save Configuration Action
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      playSound('correct');

      // 1. Securely commit the 5 multi-input identity configuration parameters
      const newRealName = realNameInput ? realNameInput.value.trim() : 'None';
      const newCity = cityInput ? cityInput.value.trim() : 'None';
      const newCountry = countryInput ? countryInput.value.trim() : 'None';
      const newOrg = orgInput ? orgInput.value.trim() : 'None';
      const newCause = causeSelect ? causeSelect.value : 'Olympiad Training';

      localStorage.setItem('primefactor_profile_realname', newRealName || 'None');
      localStorage.setItem('primefactor_profile_city', newCity || 'None');
      localStorage.setItem('primefactor_profile_country', newCountry || 'None');
      localStorage.setItem('primefactor_profile_organization', newOrg || 'None');
      localStorage.setItem('primefactor_profile_enroll_cause', newCause);

      // 2. Commit handle and toggle options
      if (userHandle && userHandle.value.trim()) {
        localStorage.setItem('primefactor_profile_username', userHandle.value.trim());
      }

      updateSettings({
        soundEnabled: soundCheck ? soundCheck.checked : true,
        allowSecondAttempt: secondCheck ? secondCheck.checked : true,
        allowPause: pauseCheck ? pauseCheck.checked : true
      });

      // 3. Re-anchor HMAC signature across the updated profile directory
      reSignProfileDirectory();

      // 4. Update memory cache lock to newly saved state
      initialState = {
        realName: newRealName || 'None',
        city: newCity || 'None',
        country: newCountry || 'None',
        organization: newOrg || 'None',
        enrollCause: newCause
      };

      // 5. Reset validation state flag
      isDirty = false;

      // 6. Reset Save button to inactive state & hide yellow warning banner
      saveBtn.classList.remove('btn-save-active-wake');
      saveBtn.classList.add('btn-save-inactive');
      if (unsavedWarningBanner) {
        unsavedWarningBanner.style.display = 'none';
      }

      // 7. Render green success confirmation banner
      if (saveBanner) {
        saveBanner.textContent = '✔️ Profile Settings Saved Successfully!';
        saveBanner.style.display = 'block';
        setTimeout(() => {
          saveBanner.style.display = 'none';
        }, 2500);
      }
    });
  }
}

/**
 * 3. THE THREAD INTERCEPTION EXIT PREVENTION GUARD
 * Hooks into the native browser thread via beforeunload event layer.
 * Traps navigation routines if isDirty === true and prompts native validation warning popup.
 */
function initExitPreventionGuard() {
  // Native Browser Thread Interception (tab close, reload, address bar navigation)
  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = UNLOAD_WARNING_MESSAGE;
      return UNLOAD_WARNING_MESSAGE;
    }
  });

  // Client-Side Link Interception (Navbar links, return-to-profile anchor, brand logo)
  document.querySelectorAll('a[href]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      if (isDirty) {
        const allowLeave = window.confirm(UNLOAD_WARNING_MESSAGE);
        if (!allowLeave) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    }, true);
  });
}
