/**
 * PrimeFactor.app — Header, Global Dropdown Navigation, Settings Modal, Flash Overlays, and Persistent Footer
 */

import { getSettings, updateSettings, setActiveExamParams } from './storage.js';
import { playSound } from './audio.js';
import { initServerlessOnboarding } from './elo-engine.js';
import { updateUnreadStatusDots, initNotificationDotListeners } from './notification-engine.js';

// Immediate Root Initialization Hook (within 1ms of module evaluation)
initServerlessOnboarding();

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

// ============================================================================
// 11-TIER NAVIGATION TOPOLOGY MATRIX CONFIGURATION
// ============================================================================
export const NAVIGATION_TOPOLOGY_OPTIONS = [
  {
    id: 'nav-home',
    href: './index.html',
    num: '01',
    title: 'The Gateway & Hub',
    subtitle: 'Central command, scoring contracts, ELO tiers & instant randomizer.',
    badge: 'Hub',
    badgeColor: '#0284C7',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
  },
  {
    id: 'nav-rules',
    href: './rules.html',
    num: '02',
    title: 'Rules & Governance',
    subtitle: 'Olympiad scoring matrix, lifeline penalties & 3-strike integrity policy.',
    badge: 'Policies',
    badgeColor: '#F59E0B',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
  },
  {
    id: 'nav-rating',
    href: './rating.html',
    num: '03',
    title: '12-Tier ELO Matrix',
    subtitle: 'Dynamic K-factor volatility, logistic expectations & promotion ladder.',
    badge: 'Matrix',
    badgeColor: '#8B5CF6',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
  },
  {
    id: 'nav-edu',
    href: './edu.html',
    num: '04',
    title: 'Education Laboratory',
    subtitle: 'Mental factorization heuristics, Pollard’s Rho & prime distribution sieves.',
    badge: 'Training',
    badgeColor: '#10B981',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>`
  },
  {
    id: 'nav-services',
    href: './services.html',
    num: '05',
    title: 'Laboratory Services',
    subtitle: 'Real-time telemetry, Web Audio synthesis & cryptographic state storage.',
    badge: 'Facilities',
    badgeColor: '#06B6D4',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
  },
  {
    id: 'nav-contest',
    href: './contest.html',
    num: '06',
    title: 'Contest Arena',
    subtitle: 'High-speed 180s rated decomposition arena with live strike detection.',
    badge: 'Arena',
    badgeColor: '#EC4899',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7.5"/><path d="M14 14.66V17c0 .55.45 1 1 1h1.5"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`
  },
  {
    id: 'nav-profile',
    href: './profile.html',
    num: '07',
    title: 'Candidate Profile',
    subtitle: 'Career ledger, solved counts, accuracy analytics & directory verification.',
    badge: 'Overview',
    badgeColor: '#3B82F6',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
  },
  {
    id: 'nav-ranges',
    href: './ranges.html',
    num: '08',
    title: 'Division Ranges',
    subtitle: '9 rated tiers spanning from Tier 1 (1–200) to Tier 9 (1–35,000+ Master).',
    badge: 'Divisions',
    badgeColor: '#14B8A6',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`
  },
  {
    id: 'nav-medals',
    href: './medals.html',
    num: '09',
    title: 'Hall of Medals',
    subtitle: 'Cryptographically certified trophies, hurdle badges & milestone honors.',
    badge: 'Honors',
    badgeColor: '#EAB308',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`
  },
  {
    id: 'nav-notifications',
    href: './notifications.html',
    num: '10',
    title: 'Notification Center',
    subtitle: 'LIFO telemetry feed, ELO adjustment deltas & security violation strikes.',
    badge: 'Telemetry',
    badgeColor: '#EF4444',
    isNotification: true,
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`
  },
  {
    id: 'nav-settings',
    href: '#settings',
    num: '11',
    title: 'Engine Configuration',
    subtitle: 'Tactical pauses, conceptual hints, audio synthesis & overtime lifelines.',
    badge: 'Options',
    badgeColor: '#64748B',
    isSettings: true,
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
];

// Build and inject Full-Screen Glassmorphic Navigation Dashboard
export function renderNavigationDashboard() {
  let dashboard = document.getElementById('fullscreen-nav-dashboard');
  if (dashboard) return dashboard;

  dashboard = document.createElement('div');
  dashboard.id = 'fullscreen-nav-dashboard';
  dashboard.className = 'fullscreen-nav-dashboard';
  dashboard.setAttribute('role', 'dialog');
  dashboard.setAttribute('aria-modal', 'true');
  dashboard.setAttribute('aria-hidden', 'true');
  dashboard.style.display = 'none';

  const cardsHtml = NAVIGATION_TOPOLOGY_OPTIONS.map(opt => `
    <a href="${opt.href}" class="nav-dashboard-card" id="${opt.id}" data-is-settings="${opt.isSettings ? 'true' : 'false'}" aria-label="${opt.title}">
      <div class="nav-card-top-row">
        <div class="nav-card-icon-wrap">
          <div class="nav-card-icon" style="color: ${opt.badgeColor};">
            ${opt.icon}
          </div>
          <span class="nav-card-num">${opt.num}</span>
        </div>
        <span class="nav-card-badge" style="border-color: ${opt.badgeColor}; color: #FFFFFF; background: ${opt.badgeColor}25;">
          ${opt.badge}
        </span>
      </div>

      <div class="nav-card-body">
        <h3 class="nav-card-title font-heading">
          <span>${opt.title}</span>
          ${opt.isNotification ? `<span id="dashboard-notif-dot" class="subpixel-unread-dot" style="display: none; background: #DC2626; box-shadow: 0 0 10px #EF4444, 0 0 20px #FF0000; border-radius: 50%; width: 8px; height: 8px; vertical-align: middle; flex-shrink: 0;"></span>` : ''}
        </h3>
        <p class="nav-card-desc">${opt.subtitle}</p>
      </div>

      <div class="nav-card-bottom-row">
        <span>Launch Facility</span>
        <svg class="nav-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </div>
    </a>
  `).join('');

  dashboard.innerHTML = `
    <!-- Prominent Fixed Close Dismissal Node in Top-Right Corner -->
    <button id="close-nav-dashboard-btn" class="nav-dashboard-close-btn" aria-label="Close Navigation Dashboard">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <span class="close-label font-heading">ESC</span>
    </button>

    <!-- Scrollable Dashboard Inner Container exclusively within dashboard -->
    <div class="nav-dashboard-scroll-wrap">
      <div class="nav-dashboard-content-box">
        <div class="nav-dashboard-header">
          <div class="nav-dashboard-brand-row">
            <div class="dashboard-brand-symbol">Π</div>
            <div>
              <span class="nav-dashboard-kicker font-heading">Global Navigation Topology</span>
              <h2 class="nav-dashboard-title font-heading">Olympiad Arena Directory</h2>
            </div>
          </div>
          <p class="nav-dashboard-subtitle">
            Full-spectrum cognitive factorization suite — 11 core facilities, competitive ranking matrices, training labs &amp; telemetry audits.
          </p>
        </div>

        <!-- 3-Tier Responsive Topology Grid (11 Items) -->
        <div class="nav-dashboard-grid" id="nav-dashboard-grid">
          ${cardsHtml}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(dashboard);

  // Wire close button
  const closeBtn = dashboard.querySelector('#close-nav-dashboard-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeNavigationDashboard();
    });
  }

  // Wire cards click
  const cards = dashboard.querySelectorAll('.nav-dashboard-card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      playSound('click');
      if (card.getAttribute('data-is-settings') === 'true') {
        e.preventDefault();
        closeNavigationDashboard();
        initSettingsModal();
        const isProfilePage = window.location.pathname.endsWith('profile.html') || window.location.pathname.includes('/profile.html');
        if (isProfilePage) {
          window.location.href = './profile-settings.html';
        } else {
          const modal = document.getElementById('settings-modal');
          if (modal) {
            modal.classList.add('open');
          }
        }
      } else {
        closeNavigationDashboard();
      }
    });
  });

  // Close on backdrop click (click outside content box in scroll wrap)
  const scrollWrap = dashboard.querySelector('.nav-dashboard-scroll-wrap');
  if (scrollWrap) {
    scrollWrap.addEventListener('click', (e) => {
      if (e.target === scrollWrap) {
        closeNavigationDashboard();
      }
    });
  }

  return dashboard;
}

// Open Full-Screen Glassmorphic Navigation Dashboard with GSAP
export function openNavigationDashboard() {
  const dashboard = renderNavigationDashboard();
  if (!dashboard) return;
  playSound('click');

  // Enforce background website document scrolling lock
  document.body.style.overflow = 'hidden';

  dashboard.style.display = 'block';
  dashboard.setAttribute('aria-hidden', 'false');

  const cards = dashboard.querySelectorAll('.nav-dashboard-card');

  if (window.gsap) {
    window.gsap.killTweensOf(dashboard);
    window.gsap.killTweensOf(cards);

    // Slide in from right side smoothly
    window.gsap.fromTo(dashboard,
      { x: '100%', opacity: 0 },
      { x: '0%', opacity: 1, duration: 0.38, ease: 'power3.out' }
    );

    // Internal grid cards deploy sequentially with 0.03s micro-interaction stagger delay
    window.gsap.fromTo(cards,
      { y: 24, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.32, stagger: 0.03, ease: 'power2.out', delay: 0.06 }
    );
  } else {
    dashboard.style.opacity = '1';
    dashboard.style.transform = 'none';
  }

  updateUnreadStatusDots();
}

// Close Full-Screen Glassmorphic Navigation Dashboard
export function closeNavigationDashboard() {
  const dashboard = document.getElementById('fullscreen-nav-dashboard');
  if (!dashboard || dashboard.style.display === 'none') return;
  playSound('click');

  // Restore background website document scrolling
  document.body.style.overflow = '';
  dashboard.setAttribute('aria-hidden', 'true');

  if (window.gsap) {
    window.gsap.killTweensOf(dashboard);
    window.gsap.to(dashboard, {
      x: '100%',
      opacity: 0,
      duration: 0.28,
      ease: 'power3.in',
      onComplete: () => {
        dashboard.style.display = 'none';
      }
    });
  } else {
    dashboard.style.display = 'none';
  }
}

// Render and bind Global Fixed Header & Full-Screen Navigation Dashboard
export function initGlobalHeader(options = {}) {
  const header = document.querySelector('.fixed-header');
  if (!header) return;

  const hideSettings = options.hideSettings === true || document.body.classList.contains('hide-settings-gear');

  // If header doesn't already have its DOM baked in, populate it with desktop adaptive matrix
  if (!header.querySelector('.header-container')) {
    header.innerHTML = `
      <div class="header-container">
        <!-- Far Left: Brand Logo + Brand Text -->
        <a href="./index.html" class="brand-lockup">
          <span class="brand-symbol">Π</span>
          <span class="brand-text">Prime Factor<span class="dot-app">.app</span></span>
        </a>

        <!-- Absolute Center: Settings Gear Icon (Hidden on dedicated setup or mobile) -->
        ${!hideSettings ? `
          <div class="header-center-settings">
            <button id="settings-toggle-btn" class="icon-btn header-settings-gear-btn" aria-label="Global Engine Settings">
              <svg class="gear-icon" width="20" height="20" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8-74.9-8-111.6 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L86.1 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L64.6 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8 74.9 8 111.6 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"/>
              </svg>
            </button>
          </div>
        ` : ''}

        <!-- Far Right: Navigation Hamburger Menu Trigger -->
        <div class="header-right-nav">
          <button id="menu-toggle" class="nav-hamburger-btn nav-dropdown-trigger" aria-label="Toggle Navigation Dashboard" aria-expanded="false">
            <div class="hamburger-bars">
              <span class="hamburger-bar"></span>
              <span class="hamburger-bar"></span>
              <span class="hamburger-bar"></span>
            </div>
            <span>Navigation</span>
          </button>
        </div>
      </div>
    `;
  } else {
    // Existing Baked HTML: Reorganize elements into desktop adaptive alignment
    const headerContainer = header.querySelector('.header-container');
    if (headerContainer) {
      headerContainer.style.position = 'relative';

      // Ensure settings gear is in the absolute center
      const settingsBtn = headerContainer.querySelector('#settings-toggle-btn');
      const headerActions = headerContainer.querySelector('.header-actions');
      if (settingsBtn) {
        settingsBtn.classList.add('header-settings-gear-btn');
        if (headerActions) {
          headerActions.classList.add('header-center-settings');
        } else {
          settingsBtn.classList.add('header-center-settings');
        }
      }

      // Shift hamburger navigation button to far right
      const navBtn = headerContainer.querySelector('.nav-hamburger-btn, #menu-toggle');
      if (navBtn) {
        const navWrap = navBtn.parentElement;
        if (navWrap && navWrap !== headerContainer) {
          navWrap.classList.add('header-right-nav');
          navWrap.style.marginLeft = 'auto';
        } else {
          navBtn.classList.add('header-right-nav');
          navBtn.style.marginLeft = 'auto';
        }
      }
    }
  }

  // Pre-render the full-screen navigation dashboard DOM
  renderNavigationDashboard();

  // INTERCEPTION REQUIREMENT:
  // Completely deactivate the legacy dropdown box `#global-dropdown-menu`
  const legacyDropdown = document.querySelector('.nav-dropdown-glass-container') || document.getElementById('global-dropdown-menu');
  if (legacyDropdown) {
    legacyDropdown.classList.remove('active');
    legacyDropdown.style.display = 'none';
  }

  // Intercept navigation toggle button to launch new Full-Screen Overlay Dashboard
  const toggleBtns = document.querySelectorAll('.nav-hamburger-btn, #menu-toggle, .nav-dropdown-trigger');
  toggleBtns.forEach(btn => {
    btn.setAttribute('aria-label', 'Toggle Navigation Dashboard');

    // Use capture phase (true) and stopImmediatePropagation to completely neutralize legacy dropdown scripts
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      openNavigationDashboard();
    }, true);
  });

  // Ensure overhead unread dot is positioned next to navigation button
  const mainToggle = document.querySelector('.nav-hamburger-btn') || document.getElementById('menu-toggle');
  if (mainToggle && mainToggle.parentNode) {
    let overheadDot = document.getElementById('overhead-nav-unread-dot');
    if (!overheadDot) {
      overheadDot = document.createElement('span');
      overheadDot.id = 'overhead-nav-unread-dot';
      overheadDot.className = 'subpixel-unread-dot';
      overheadDot.style.cssText = 'background: #DC2626; box-shadow: 0 0 10px #EF4444, 0 0 20px #FF0000; border-radius: 50%; width: 8px; height: 8px; display: none; margin-right: 8px; vertical-align: middle; flex-shrink: 0;';
      mainToggle.parentNode.insertBefore(overheadDot, mainToggle);
    }
  }

  // Global Escape Key Listener for Dashboard Dismissal
  if (!window._navDashboardEscapeBound) {
    window._navDashboardEscapeBound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeNavigationDashboard();
      }
    });
  }

  // Initialize Settings Modal structure for both header and dashboard triggers
  initSettingsModal();

  // Synchronize unread dots across header and dashboard
  initNotificationDotListeners();
  updateUnreadStatusDots();
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
    triggerBtn.addEventListener('click', (e) => {
      const isProfilePage = window.location.pathname.endsWith('profile.html') || window.location.pathname.includes('/profile.html');
      if (isProfilePage) {
        e.preventDefault();
        e.stopPropagation();
        playSound('click');
        window.location.href = './profile-settings.html';
        return;
      }
      openModal();
    });
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


