/**
 * PrimeFactor.app — Profile System Settings Controller
 * Handles live, ledger-validated multi-input identity configuration matrix,
 * interlocking mutation control engine (isDirty state wake-up trigger),
 * dynamic strike audit & re-anchor loop, and native window thread beforeunload exit interception guard.
 */

import { getSettings, updateSettings } from './storage.js';
import { playSound } from './audio.js';
import { renderFooter, initGlobalHeader } from './header.js';
import { getUserElo, getUserPeakElo, getTierByElo, reSignProfileDirectory, initServerlessOnboarding, ENGINE_HMAC_SECRET } from './elo-engine.js';

const UNLOAD_WARNING_MESSAGE = "Changes you made may not be saved. Are you sure you want to leave?";

// Global validation state tracking flag
let isDirty = false;

// Background object cache locking the exact initial input and toggle values in memory
let initialState = {
  realName: 'None',
  city: 'None',
  country: 'None',
  organization: 'None',
  enrollCause: 'Olympiad Training',
  soundEnabled: true,
  allowSecondAttempt: true,
  allowPause: true,
  username: ''
};

document.addEventListener('DOMContentLoaded', () => {
  initServerlessOnboarding();
  initGlobalHeader();
  renderFooter();
  initProfileSettingsEngine();
  initExitPreventionGuard();
});

/**
 * 1. UNIFIED TOP NAVIGATION CONTROLLER
 * Handled universally via initGlobalHeader() to eliminate event thread hijacking.
 */
function initDropdownNavigation() {
  // Handled by initGlobalHeader()
}

/**
 * 2. LIVE PROFILE CONFIGURATION & MUTATION CONTROL ENGINE
 * Module 1: Live Interface Mutation Verification & Dynamic Strike Diagnostics
 */
function initProfileSettingsEngine() {
  const settings = getSettings();

  // Field DOM Elements (5 Monitored Identity Fields + Contestant Handle)
  const realNameInput = document.getElementById('setting-realname');
  const cityInput = document.getElementById('setting-city');
  const countryInput = document.getElementById('setting-country');
  const orgInput = document.getElementById('setting-organization');
  const causeSelect = document.getElementById('setting-enroll-cause');
  const userHandle = document.getElementById('setting-username');

  // Switch Elements (3 Monitored Configuration Switches)
  const soundCheck = document.getElementById('setting-sound');
  const secondCheck = document.getElementById('setting-second-attempt');
  const pauseCheck = document.getElementById('setting-pause');

  // Action & Feedback Nodes
  const saveBtn = document.getElementById('btn-save-settings');
  const unsavedWarningBanner = document.getElementById('unsaved-warning-banner');
  const saveBanner = document.getElementById('save-banner');

  // --- STATE SYNCHRONIZATION AUDIT (Fetch & Lock into initialState) ---
  const storedUser = localStorage.getItem('primefactor_profile_username') || (userHandle ? userHandle.value.trim() : 'Rayaan Tasnim');

  initialState = {
    realName: localStorage.getItem('primefactor_profile_realname') || 'None',
    city: localStorage.getItem('primefactor_profile_city') || 'None',
    country: localStorage.getItem('primefactor_profile_country') || 'None',
    organization: localStorage.getItem('primefactor_profile_organization') || 'None',
    enrollCause: localStorage.getItem('primefactor_profile_enroll_cause') || 'Olympiad Training',
    soundEnabled: settings.soundEnabled ?? true,
    allowSecondAttempt: settings.allowSecondAttempt ?? true,
    allowPause: settings.allowPause ?? true,
    username: storedUser
  };

  // Populate Field Elements with Audited Cache
  if (realNameInput) realNameInput.value = initialState.realName;
  if (cityInput) cityInput.value = initialState.city;
  if (countryInput) countryInput.value = initialState.country;
  if (orgInput) orgInput.value = initialState.organization;
  if (causeSelect) causeSelect.value = initialState.enrollCause;
  if (userHandle) userHandle.value = initialState.username;

  // Populate switches with Audited Cache
  if (soundCheck) {
    soundCheck.checked = initialState.soundEnabled;
    soundCheck.addEventListener('change', () => playSound('click'));
  }
  if (secondCheck) {
    secondCheck.checked = initialState.allowSecondAttempt;
    secondCheck.addEventListener('change', () => playSound('click'));
  }
  if (pauseCheck) {
    pauseCheck.checked = initialState.allowPause;
    pauseCheck.addEventListener('change', () => playSound('click'));
  }

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
      enrollCause: causeSelect ? causeSelect.value : initialState.enrollCause,
      soundEnabled: soundCheck ? soundCheck.checked : initialState.soundEnabled,
      allowSecondAttempt: secondCheck ? secondCheck.checked : initialState.allowSecondAttempt,
      allowPause: pauseCheck ? pauseCheck.checked : initialState.allowPause,
      username: userHandle ? userHandle.value.trim() : initialState.username
    };

    const hasMutated = 
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
        // Wake up Save Configuration button to glowing active neon green layout
        if (saveBtn) {
          saveBtn.classList.remove('btn-save-inactive');
          saveBtn.classList.add('btn-save-active-wake');
        }
        // Forcefully display (style.display = "flex") the flashing yellow neon status warning banner
        if (unsavedWarningBanner) {
          unsavedWarningBanner.style.background = '';
          unsavedWarningBanner.style.borderColor = '';
          unsavedWarningBanner.style.color = '';
          unsavedWarningBanner.style.boxShadow = '';
          unsavedWarningBanner.innerHTML = `
            <span style="font-size: 1.15rem;">⚠️</span>
            <span>Unsaved Configuration Detected — Click &quot;Save Configuration&quot; to securely commit your profile credentials.</span>
          `;
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
        // Completely collapse the yellow warning banner
        if (unsavedWarningBanner) {
          unsavedWarningBanner.style.display = 'none';
        }
      }
    }
  };

  // Map both input and change events across all 5 monitored identity fields and handle
  const monitoredFields = [realNameInput, cityInput, countryInput, orgInput, causeSelect, userHandle];
  monitoredFields.forEach(fieldNode => {
    if (fieldNode) {
      fieldNode.addEventListener('input', checkMutationState);
      fieldNode.addEventListener('change', checkMutationState);
    }
  });

  // Map change events across all 3 monitored local configuration switches
  const monitoredSwitches = [soundCheck, secondCheck, pauseCheck];
  monitoredSwitches.forEach(switchNode => {
    if (switchNode) {
      switchNode.addEventListener('change', checkMutationState);
    }
  });

  // Re-Anchor Signature Button
  const btnReSign = document.getElementById('btn-re-sign');
  if (btnReSign) {
    btnReSign.addEventListener('click', () => {
      playSound('click');
      reSignProfileDirectory();
      btnReSign.classList.add('btn-neon-copied-glow');
      const activeStrikes = Number(localStorage.getItem('primefactor_security_strikes') || 0);

      if (saveBanner) {
        if (activeStrikes === 0) {
          saveBanner.textContent = '✔ Profile Directory Integrity Re-Anchored with HMAC! [All Systems Safe]';
          saveBanner.style.background = 'rgba(16, 185, 129, 0.15)';
          saveBanner.style.borderColor = '#10b981';
          saveBanner.style.color = '#34d399';
          saveBanner.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.25)';
        } else if (activeStrikes === 1) {
          saveBanner.textContent = '🚨 CRITICAL WARNING: Active Disciplinary Strike [1/3] Detected! Core directory compiled under baseline memory lock. Maintain strict speed-mathematics integrity.';
          saveBanner.style.background = '#DC2626';
          saveBanner.style.borderColor = '#EF4444';
          saveBanner.style.color = '#FFFFFF';
          saveBanner.style.boxShadow = '0 0 25px rgba(220, 38, 38, 0.8), 0 0 45px rgba(239, 68, 68, 0.5)';
        } else {
          saveBanner.textContent = '🚨 TOTAL QUARANTINE: Severe Violation Strike [2/3] Detected! Profile liquidated to 0 ELO Foundry floor. Next security anomaly triggers irreversible browser blacklist permanent ban.';
          saveBanner.style.background = '#DC2626';
          saveBanner.style.borderColor = '#EF4444';
          saveBanner.style.color = '#FFFFFF';
          saveBanner.style.boxShadow = '0 0 25px rgba(220, 38, 38, 0.8), 0 0 45px rgba(239, 68, 68, 0.5)';
        }
        saveBanner.style.display = 'block';
        setTimeout(() => {
          btnReSign.classList.remove('btn-neon-copied-glow');
          if (activeStrikes === 0) {
            saveBanner.style.display = 'none';
          }
        }, 2500);
      }
    });
  }

  // --- SAVE CONFIGURATION ACTION (DYNAMIC STRIKE AUDIT & RE-ANCHOR LOOP) ---
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      // 1. Synchronously intercept and audit the client environment's active persistent strike registry value
      const activeStrikes = Number(localStorage.getItem('primefactor_security_strikes') || 0);

      if (activeStrikes > 0) {
        playSound('alert');
      } else {
        playSound('correct');
      }

      // 2. Securely commit the 5 multi-input identity configuration parameters
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

      // 3. Commit handle and toggle options
      let savedUsername = initialState.username || 'None';
      if (userHandle && userHandle.value.trim()) {
        savedUsername = userHandle.value.trim();
        localStorage.setItem('primefactor_profile_username', savedUsername);
      }

      const newSound = soundCheck ? soundCheck.checked : true;
      const newSecond = secondCheck ? secondCheck.checked : true;
      const newPause = pauseCheck ? pauseCheck.checked : true;

      updateSettings({
        soundEnabled: newSound,
        allowSecondAttempt: newSecond,
        allowPause: newPause
      });

      // 4. Instantly invoke serverless directory signing protocol reSignProfileDirectory() via ENGINE_HMAC_SECRET
      reSignProfileDirectory();

      // 5. Update memory cache lock to newly saved state
      initialState = {
        realName: newRealName || 'None',
        city: newCity || 'None',
        country: newCountry || 'None',
        organization: newOrg || 'None',
        enrollCause: newCause,
        soundEnabled: newSound,
        allowSecondAttempt: newSecond,
        allowPause: newPause,
        username: savedUsername
      };

      // 6. Reset validation state flag
      isDirty = false;

      // 7. Reset Save button to inactive state
      saveBtn.classList.remove('btn-save-active-wake');
      saveBtn.classList.add('btn-save-inactive');

      // 8. Apply 3-Zone Dynamic Layout and Typography Matrix directly onto the header warning/success banner
      if (unsavedWarningBanner) {
        unsavedWarningBanner.style.display = 'flex';

        if (activeStrikes === 0) {
          // Green Zone (0 Active Strikes Detected)
          unsavedWarningBanner.style.background = 'rgba(16, 185, 129, 0.15)';
          unsavedWarningBanner.style.borderColor = '#10b981';
          unsavedWarningBanner.style.color = '#34d399';
          unsavedWarningBanner.style.boxShadow = '0 0 18px rgba(16, 185, 129, 0.35)';
          unsavedWarningBanner.innerHTML = `<span>✔ Profile Directory Integrity Re-Anchored with HMAC! [All Systems Safe]</span>`;

          setTimeout(() => {
            if (!isDirty && unsavedWarningBanner.textContent.includes('All Systems Safe')) {
              unsavedWarningBanner.style.display = 'none';
            }
          }, 3500);
        } else if (activeStrikes === 1) {
          // Crimson Security Zone 1 (Exactly 1 Active Strike Detected)
          unsavedWarningBanner.style.background = '#DC2626';
          unsavedWarningBanner.style.borderColor = '#EF4444';
          unsavedWarningBanner.style.color = '#FFFFFF';
          unsavedWarningBanner.style.boxShadow = '0 0 25px rgba(220, 38, 38, 0.8), 0 0 45px rgba(239, 68, 68, 0.5)';
          unsavedWarningBanner.innerHTML = `<span>🚨 CRITICAL WARNING: Active Disciplinary Strike [1/3] Detected! Core directory compiled under baseline memory lock. Maintain strict speed-mathematics integrity.</span>`;
        } else {
          // Crimson Security Zone 2 (2 Active Strikes Detected or Higher)
          unsavedWarningBanner.style.background = '#DC2626';
          unsavedWarningBanner.style.borderColor = '#EF4444';
          unsavedWarningBanner.style.color = '#FFFFFF';
          unsavedWarningBanner.style.boxShadow = '0 0 25px rgba(220, 38, 38, 0.8), 0 0 45px rgba(239, 68, 68, 0.5)';
          unsavedWarningBanner.innerHTML = `<span>🚨 TOTAL QUARANTINE: Severe Violation Strike [2/3] Detected! Profile liquidated to 0 ELO Foundry floor. Next security anomaly triggers irreversible browser blacklist permanent ban.</span>`;
        }

        if (window.gsap) {
          window.gsap.fromTo(unsavedWarningBanner,
            { scale: 0.98, opacity: 0.8 },
            { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
          );
        }
      }

      // Synchronize save-banner feedback
      if (saveBanner) {
        if (activeStrikes === 0) {
          saveBanner.textContent = '✔ Profile Directory Integrity Re-Anchored with HMAC! [All Systems Safe]';
          saveBanner.style.background = 'rgba(16, 185, 129, 0.15)';
          saveBanner.style.borderColor = '#10b981';
          saveBanner.style.color = '#34d399';
          saveBanner.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.25)';
        } else if (activeStrikes === 1) {
          saveBanner.textContent = '🚨 CRITICAL WARNING: Active Disciplinary Strike [1/3] Detected! Core directory compiled under baseline memory lock.';
          saveBanner.style.background = '#DC2626';
          saveBanner.style.borderColor = '#EF4444';
          saveBanner.style.color = '#FFFFFF';
          saveBanner.style.boxShadow = '0 0 25px rgba(220, 38, 38, 0.8), 0 0 45px rgba(239, 68, 68, 0.5)';
        } else {
          saveBanner.textContent = '🚨 TOTAL QUARANTINE: Severe Violation Strike [2/3] Detected! Profile liquidated to 0 ELO Foundry floor.';
          saveBanner.style.background = '#DC2626';
          saveBanner.style.borderColor = '#EF4444';
          saveBanner.style.color = '#FFFFFF';
          saveBanner.style.boxShadow = '0 0 25px rgba(220, 38, 38, 0.8), 0 0 45px rgba(239, 68, 68, 0.5)';
        }
        saveBanner.style.display = 'block';
        if (activeStrikes === 0) {
          setTimeout(() => {
            saveBanner.style.display = 'none';
          }, 3500);
        }
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
      const href = anchor.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#')) return;

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
