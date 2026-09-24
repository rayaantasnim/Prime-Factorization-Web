/**
 * PrimeFactor.app — Header, Global Dropdown Navigation, Settings Modal, Flash Overlays, and Persistent Footer
 */

import { getSettings, updateSettings, setActiveExamParams } from './storage.js';
import { playSound } from './audio.js';

// GSAP Full-Page Interaction Flushes
export function triggerFlash(type) {
  const overlay = document.getElementById('flash-overlay');
  if (!overlay) return;

  overlay.className = '';
  
  if (type === 'success') {
    overlay.classList.add('flash-success');
  } else if (type === 'penalty') {
    overlay.classList.add('flash-penalty');
  } else if (type === 'warning') {
    overlay.classList.add('flash-warning');
  }

  if (window.gsap) {
    window.gsap.killTweensOf(overlay);
    window.gsap.fromTo(overlay, 
      { opacity: 0.9 }, 
      { opacity: 0, duration: 0.28, ease: 'power2.out' }
    );
  } else {
    overlay.style.opacity = '0.9';
    setTimeout(() => {
      overlay.style.transition = 'opacity 0.28s ease';
      overlay.style.opacity = '0';
    }, 20);
  }
}

// Render and bind Global Top Dropdown Navigation Bar
export function initGlobalHeader(options = {}) {
  const header = document.querySelector('.fixed-header');
  if (!header) return;

  const hideSettings = options.hideSettings === true || document.body.classList.contains('hide-settings-gear');

  // If header doesn't already have its DOM baked in, populate it as fallback
  if (!header.querySelector('.header-container')) {
    if (hideSettings) {
      // Dedicated Setup Screen Header: Brand on left, Hamburger Nav on right, Settings gear strictly hidden
      header.innerHTML = `
        <div class="header-container" style="justify-content: space-between;">
          <!-- Left: Minimalist Logo + Brand Text -->
          <a href="./index.html" class="brand-lockup">
            <span class="brand-symbol">Π</span>
            <span class="brand-text">Prime Factor<span class="dot-app">.app</span></span>
          </a>

          <!-- Right: Hamburger Dropdown Toggle Navigation Menu -->
          <div style="position: relative;">
            <button id="menu-toggle" class="nav-hamburger-btn nav-dropdown-trigger" aria-label="Toggle Navigation Menu" aria-expanded="false">
              <div class="hamburger-bars">
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
              </div>
              <span>Navigation</span>
            </button>

            <!-- Dropdown Box (Frosted Glass) -->
            <nav id="global-dropdown-menu" class="nav-dropdown-glass-container global-nav-dropdown align-right" style="left: auto; right: 0; transform: translateY(-10px);" aria-label="Main Navigation">
              <a href="./index.html" class="dropdown-link-item">
                <div class="dropdown-link-content">
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <span>Home Page</span>
                </div>
                <span class="dropdown-badge">Hub</span>
              </a>

              <a href="./ranges.html" class="dropdown-link-item">
                <div class="dropdown-link-content">
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span>Range Selections</span>
                </div>
                <span class="dropdown-badge">10 Tiers</span>
              </a>

              <a href="./edu.html" class="dropdown-link-item">
                <div class="dropdown-link-content">
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                    <path d="M6 6h10"></path>
                    <path d="M6 10h10"></path>
                  </svg>
                  <span>Edu</span>
                </div>
                <span class="dropdown-badge">Training</span>
              </a>

              <a href="./exam.html?min=1&max=200&title=Standard%20Exam" id="dropdown-random-exam" class="dropdown-link-item">
                <div class="dropdown-link-content">
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="16 3 21 3 21 8"></polyline>
                    <line x1="4" y1="20" x2="21" y2="3"></line>
                    <polyline points="21 16 21 21 16 21"></polyline>
                    <line x1="15" y1="15" x2="21" y2="21"></line>
                    <line x1="4" y1="4" x2="9" y2="9"></line>
                  </svg>
                  <span>Random Exam</span>
                </div>
                <span class="dropdown-badge">Instant</span>
              </a>

              <!-- Mobile-only System link -->
              <a href="#" class="dropdown-link-item mobile-only-system-link dropdown-open-settings-trigger" id="dropdown-mobile-system" aria-label="System Configuration">
                <div class="dropdown-link-content">
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  <span>System</span>
                </div>
                <span class="dropdown-badge">Engine</span>
              </a>
            </nav>
          </div>
        </div>
      `;
    } else {
      // Render standardized header HTML with Center Hamburger & Dropdown & Right Settings Gear
      header.innerHTML = `
        <div class="header-container">
          <!-- Left: Minimalist Logo + Brand Text -->
          <a href="./index.html" class="brand-lockup">
            <span class="brand-symbol">Π</span>
            <span class="brand-text">Prime Factor<span class="dot-app">.app</span></span>
          </a>

          <!-- Center: Hamburger Dropdown Trigger & Floating Frosted Glass Menu -->
          <div style="position: relative;">
            <button id="menu-toggle" class="nav-hamburger-btn nav-dropdown-trigger" aria-label="Toggle Navigation Menu" aria-expanded="false">
              <div class="hamburger-bars">
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
              </div>
              <span>Navigation</span>
            </button>

            <!-- Dropdown Box (Frosted Glass with exactly 5 links) -->
            <nav id="global-dropdown-menu" class="nav-dropdown-glass-container global-nav-dropdown" aria-label="Main Navigation">
              <a href="./index.html" class="dropdown-link-item">
                <div class="dropdown-link-content">
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <span>Home Page</span>
                </div>
                <span class="dropdown-badge">Hub</span>
              </a>

              <a href="./ranges.html" class="dropdown-link-item">
                <div class="dropdown-link-content">
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span>Range Selections</span>
                </div>
                <span class="dropdown-badge">10 Tiers</span>
              </a>

              <a href="./edu.html" class="dropdown-link-item">
                <div class="dropdown-link-content">
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                    <path d="M6 6h10"></path>
                    <path d="M6 10h10"></path>
                  </svg>
                  <span>Edu</span>
                </div>
                <span class="dropdown-badge">Training</span>
              </a>

              <a href="./exam.html?min=1&max=200&title=Standard%20Exam" id="dropdown-random-exam" class="dropdown-link-item">
                <div class="dropdown-link-content">
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="16 3 21 3 21 8"></polyline>
                    <line x1="4" y1="20" x2="21" y2="3"></line>
                    <polyline points="21 16 21 21 16 21"></polyline>
                    <line x1="15" y1="15" x2="21" y2="21"></line>
                    <line x1="4" y1="4" x2="9" y2="9"></line>
                  </svg>
                  <span>Random Exam</span>
                </div>
                <span class="dropdown-badge">Instant</span>
              </a>

              <!-- Desktop Settings Link -->
              <a href="#" id="dropdown-open-settings" class="dropdown-link-item desktop-only-settings-link dropdown-open-settings-trigger">
                <div class="dropdown-link-content">
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  <span>Settings</span>
                </div>
                <span class="dropdown-badge">Options</span>
              </a>

              <!-- Mobile-only System link -->
              <a href="#" id="dropdown-mobile-system" class="dropdown-link-item mobile-only-system-link dropdown-open-settings-trigger" aria-label="System Configuration">
                <div class="dropdown-link-content">
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  <span>System</span>
                </div>
                <span class="dropdown-badge">Engine</span>
              </a>
            </nav>
          </div>

          <!-- Right: Standalone Settings Gear Icon -->
          <div class="header-actions">
            <button id="settings-toggle-btn" class="icon-btn" aria-label="Global Engine Settings">
              <svg class="gear-icon" width="18" height="18" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8-74.9-8-111.6 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L86.1 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L64.6 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8 74.9 8 111.6 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }
  }

  // Bind Hamburger Dropdown Toggle
  const toggleBtn = document.querySelector('.nav-hamburger-btn') || document.getElementById('menu-toggle') || document.getElementById('nav-dropdown-toggle');
  const dropdownMenu = document.querySelector('.nav-dropdown-glass-container') || document.getElementById('global-dropdown-menu');

  if (toggleBtn && dropdownMenu) {
    function toggleDropdown(e) {
      e.stopPropagation();
      playSound('click');
      const isOpen = dropdownMenu.classList.toggle('active');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
    }

    function closeDropdown() {
      if (dropdownMenu.classList.contains('active')) {
        dropdownMenu.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    }

    if (!toggleBtn._hasToggleListener) {
      toggleBtn._hasToggleListener = true;
      toggleBtn.addEventListener('click', toggleDropdown);

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!toggleBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
          closeDropdown();
        }
      });
    } else {
      // Sound feedback on click when toggle is handled by inline script
      toggleBtn.addEventListener('click', () => {
        playSound('click');
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDropdown();
    });

    // Wire Random Exam Link in dropdown
    const randomExamLink = document.getElementById('dropdown-random-exam');
    if (randomExamLink) {
      randomExamLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeDropdown();
        playSound('alert');

        const ranges = [
          { min: 1, max: 200, label: 'Tier 1: 1 - 200' },
          { min: 201, max: 500, label: 'Tier 2: 201 - 500' },
          { min: 501, max: 1000, label: 'Tier 3: 501 - 1,000' },
          { min: 1001, max: 2000, label: 'Tier 4: 1,001 - 2,000' },
          { min: 2001, max: 5000, label: 'Tier 5: 2,001 - 5,000' },
          { min: 5001, max: 10000, label: 'Tier 6: 5,001 - 10,000' },
          { min: 10001, max: 20000, label: 'Tier 7: 10,001 - 20,000' },
          { min: 1, max: 50000, label: 'Omega: 1 to Infinity' }
        ];
        const chosen = ranges[Math.floor(Math.random() * ranges.length)];
        setActiveExamParams({
          min: chosen.min,
          max: chosen.max,
          title: chosen.label,
          rules: getSettings()
        });
        window.location.href = `./exam.html?min=${chosen.min}&max=${chosen.max}&title=${encodeURIComponent(chosen.label)}`;
      });
    }

    // Wire Settings Links in dropdown (both desktop Settings and mobile System options)
    const settingsTriggers = document.querySelectorAll('.dropdown-open-settings-trigger, #dropdown-open-settings, #dropdown-mobile-system');
    settingsTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        closeDropdown();
        initSettingsModal();
        const modal = document.getElementById('settings-modal');
        if (modal) {
          playSound('click');
          modal.classList.add('open');
        }
      });
    });
  }

  // Always initialize Settings modal structure so mobile & desktop triggers function everywhere
  initSettingsModal();
}

// Render and bind Global Settings Modal
export function initSettingsModal() {
  let modalContainer = document.getElementById('settings-modal-slot');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'settings-modal-slot';
    document.body.appendChild(modalContainer);
  }

  const current = getSettings();

  modalContainer.innerHTML = `
    <div id="settings-modal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-settings-title">
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="modal-settings-title" class="font-heading">Engine Configuration</h3>
          <button id="close-settings-btn" class="icon-btn" aria-label="Close configuration modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="settings-row">
            <div class="settings-info">
              <h4>Second Chance Loop</h4>
              <p>Allows retrying missed numbers during the overtime loop</p>
            </div>
            <label class="switch" aria-label="Toggle second chance loop">
              <input type="checkbox" id="modal-toggle-second-attempt" ${current.allowSecondAttempt ? 'checked' : ''}>
              <span class="slider-round"></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="settings-info">
              <h4>Timer Pauses (Max 2)</h4>
              <p>Permits 5-second tactical countdown halts during active exams</p>
            </div>
            <label class="switch" aria-label="Toggle timer pauses">
              <input type="checkbox" id="modal-toggle-pauses" ${current.allowPause ? 'checked' : ''}>
              <span class="slider-round"></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="settings-info">
              <h4>Regeneration Lifeline (Max 1)</h4>
              <p>Permits discarding a question to roll a new composite (-2 pts)</p>
            </div>
            <label class="switch" aria-label="Toggle regeneration lifeline">
              <input type="checkbox" id="modal-toggle-regen" ${current.allowRegenerate ? 'checked' : ''}>
              <span class="slider-round"></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="settings-info">
              <h4>Conceptual Hints (Max 1)</h4>
              <p>Permits mathematical number theory clues (-50% point reward)</p>
            </div>
            <label class="switch" aria-label="Toggle conceptual hints">
              <input type="checkbox" id="modal-toggle-hints" ${current.allowHint ? 'checked' : ''}>
              <span class="slider-round"></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="settings-info">
              <h4>Synthesized Sound Effects</h4>
              <p>Crisp harmonic feedback chimes via browser Web Audio API</p>
            </div>
            <label class="switch" aria-label="Toggle audio synthesis">
              <input type="checkbox" id="modal-toggle-audio" ${current.soundEnabled ? 'checked' : ''}>
              <span class="slider-round"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  `;

  const modal = document.getElementById('settings-modal');
  const triggerBtn = document.getElementById('settings-toggle-btn');
  const closeBtn = document.getElementById('close-settings-btn');

  function openModal() {
    playSound('click');
    modal.classList.add('open');
  }

  function closeModal() {
    playSound('click');
    modal.classList.remove('open');
  }

  if (triggerBtn) {
    triggerBtn.addEventListener('click', openModal);
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Wire switch changes
  const bindSwitch = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      playSound('click');
      updateSettings({ [key]: el.checked });
      window.dispatchEvent(new CustomEvent('primefactor_settings_changed', { detail: { [key]: el.checked } }));
    });
  };

  bindSwitch('modal-toggle-second-attempt', 'allowSecondAttempt');
  bindSwitch('modal-toggle-pauses', 'allowPause');
  bindSwitch('modal-toggle-regen', 'allowRegenerate');
  bindSwitch('modal-toggle-hints', 'allowHint');
  bindSwitch('modal-toggle-audio', 'soundEnabled');
}

// Render persistent footer
export function renderFooter(containerId = 'site-footer-slot') {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!container.querySelector('.site-footer')) {
    container.innerHTML = `
      <footer class="site-footer">
        <div class="footer-container">
          <p class="footer-line highlight">© Olympiad Edge</p>
          <p class="footer-line">Authorized By Rayaan Tasnim</p>
          <p class="footer-line" style="font-size: 0.75rem; color: #94A3B8;">All rights reserved</p>
        </div>
      </footer>
    `;
  }
}
