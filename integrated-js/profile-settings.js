import { getSettings, updateSettings } from './js/storage.js';
import { playSound } from './js/audio.js';
import { getUserElo, getUserPeakElo, getTierByElo, reSignProfileDirectory, initServerlessOnboarding } from './js/elo-engine.js';

document.addEventListener('DOMContentLoaded', () => {
  initServerlessOnboarding();

  const menuToggle = document.querySelector('.nav-hamburger-btn') || document.getElementById('menu-toggle');
  const dropdownMenu = document.querySelector('.nav-dropdown-glass-container');
  if (menuToggle && dropdownMenu) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
      if (!dropdownMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        dropdownMenu.classList.remove('active');
      }
    });
  }

  const settings = getSettings();
  const soundCheck = document.getElementById('setting-sound');
  const secondCheck = document.getElementById('setting-second-attempt');
  const pauseCheck = document.getElementById('setting-pause');
  const userHandle = document.getElementById('setting-username');
  const saveBtn = document.getElementById('btn-save-settings');
  const banner = document.getElementById('save-banner');

  // Populate Live Token & ELO Status
  const token = localStorage.getItem('primefactor_profile_token') || 'OLY-PF-746525000545';
  const tokenDisplay = document.getElementById('display-profile-token');
  const btnCopyToken = document.getElementById('btn-copy-token');
  if (tokenDisplay) tokenDisplay.textContent = token;

  if (btnCopyToken) {
    btnCopyToken.addEventListener('click', async () => {
      playSound('click');
      try {
        await navigator.clipboard.writeText(token);
      } catch (e) {}
      btnCopyToken.textContent = 'Copied!';
      setTimeout(() => { btnCopyToken.textContent = 'Copy'; }, 1500);
    });
  }

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

  // Re-anchor signature
  const btnReSign = document.getElementById('btn-re-sign');
  if (btnReSign) {
    btnReSign.addEventListener('click', () => {
      playSound('click');
      reSignProfileDirectory();
      if (banner) {
        banner.textContent = '✔️ Profile Directory Integrity Re-Anchored with HMAC!';
        banner.style.display = 'block';
        setTimeout(() => { 
          banner.textContent = '✔️️ Profile Settings Saved Successfully!';
          banner.style.display = 'none'; 
        }, 2500);
      }
    });
  }

  if (soundCheck) soundCheck.checked = settings.soundEnabled ?? true;
  if (secondCheck) secondCheck.checked = settings.allowSecondAttempt ?? true;
  if (pauseCheck) pauseCheck.checked = settings.allowPause ?? true;

  const storedUser = localStorage.getItem('primefactor_profile_username');
  if (storedUser && userHandle) userHandle.value = storedUser;

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      playSound('click');
      updateSettings({
        soundEnabled: soundCheck.checked,
        allowSecondAttempt: secondCheck.checked,
        allowPause: pauseCheck.checked
      });
      if (userHandle && userHandle.value.trim()) {
        localStorage.setItem('primefactor_profile_username', userHandle.value.trim());
      }
      reSignProfileDirectory();
      if (banner) {
        banner.style.display = 'block';
        setTimeout(() => { banner.style.display = 'none'; }, 2500);
      }
    });
  }
});