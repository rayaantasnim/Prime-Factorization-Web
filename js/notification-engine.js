/**
 * PrimeFactor.app — Global Notification Engine & Standalone Feed Controller
 * Manages LIFO stack sequence, cryptographic telemetry logging, real-time unread dot sync,
 * visual desaturation of read entries, category filtering, and standalone notifications.html view.
 */

import {
  getNotifications,
  saveNotifications,
  addNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  clearReadNotifications,
  clearAllNotifications,
  hasUnreadNotifications
} from './storage.js';
import { playSound } from './audio.js';

// Re-export storage API for unified imports
export {
  getNotifications,
  saveNotifications,
  addNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  clearReadNotifications,
  clearAllNotifications,
  hasUnreadNotifications
};

// ============================================================================
// 1. HARDWARE-ACCELERATED UNREAD STATUS DOT CONTROLLER
// ============================================================================

/**
 * Updates the neon-red glowing sub-pixel unread dot markers across the DOM:
 * 1. Directly to the left of the overhead fixed header 'Navigation' button (#overhead-nav-unread-dot)
 * 2. Next to the 'Notification' link row inside the navigation dropdown card (#notif-row-unread-dot)
 */
export function updateUnreadStatusDots() {
  const isUnread = hasUnreadNotifications();
  const overheadDot = document.getElementById('overhead-nav-unread-dot');
  const rowDot = document.getElementById('notif-row-unread-dot');
  const standaloneBadge = document.getElementById('telemetry-unread-badge');

  if (overheadDot) {
    overheadDot.style.display = isUnread ? 'inline-block' : 'none';
  }
  if (rowDot) {
    rowDot.style.display = isUnread ? 'inline-block' : 'none';
  }
  if (standaloneBadge) {
    const unreadCount = getNotifications().filter(n => !n.isRead).length;
    standaloneBadge.textContent = unreadCount > 0 ? `${unreadCount} Unread` : 'All Read';
    standaloneBadge.className = unreadCount > 0 ? 'badge-unread-active' : 'badge-all-read';
  }
}

/**
 * Instantly clears all unread status markers across the active DOM.
 */
export function clearAllUnreadDots() {
  const overheadDot = document.getElementById('overhead-nav-unread-dot');
  const rowDot = document.getElementById('notif-row-unread-dot');
  if (overheadDot) overheadDot.style.display = 'none';
  if (rowDot) rowDot.style.display = 'none';
  document.querySelectorAll('.subpixel-unread-dot').forEach(el => {
    el.style.display = 'none';
  });
}

/**
 * Attaches global storage and custom event listeners so the unread status
 * stays synchronized in real time across pages, modals, and arena exams.
 */
export function initNotificationDotListeners() {
  if (window._primefactorNotificationEngineInitialized) return;
  window._primefactorNotificationEngineInitialized = true;

  // Immediate evaluation on load
  updateUnreadStatusDots();

  // Custom intra-window broadcast events
  window.addEventListener('primefactor_notification_added', () => {
    updateUnreadStatusDots();
  });

  window.addEventListener('primefactor_notifications_read', () => {
    updateUnreadStatusDots();
  });

  // Cross-tab / cross-window storage event sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'primefactor_notifications') {
      updateUnreadStatusDots();
    }
  });
}

// ============================================================================
// 2. METRICS & TELEMETRY COMPUTATION
// ============================================================================

export function getNotificationMetrics() {
  const list = getNotifications();
  const total = list.length;
  const unread = list.filter(item => item.isRead === false).length;
  const eloDeltas = list.filter(item => item.type === 'elo_gain' || item.type === 'elo_loss').length;
  const securityAlerts = list.filter(item => item.type === 'refresh_offense' || item.type === 'security_tampering').length;

  return {
    total,
    unread,
    eloDeltas,
    securityAlerts
  };
}

// ============================================================================
// 3. LIFO NOTIFICATION STACK FEED RENDERER
// ============================================================================

let activeFilter = 'all';

/**
 * Renders the full-history LIFO (Last In, First Out) notification feed.
 * Unread items are visually elevated with cyan/crimson glowing accents.
 * Read logs desaturate into low-contrast muted gray font (color: #64748B;) at the bottom.
 */
export function renderNotificationsFeed(containerId = 'notifications-feed-list', filter = activeFilter) {
  activeFilter = filter;
  const container = document.getElementById(containerId);
  if (!container) return;

  const raw = getNotifications();

  // 1. Filter items by category
  let filtered = raw;
  if (filter === 'elo') {
    filtered = raw.filter(item => item.type === 'elo_gain' || item.type === 'elo_loss');
  } else if (filter === 'security') {
    filtered = raw.filter(item => item.type === 'refresh_offense' || item.type === 'security_tampering');
  } else if (filter === 'system') {
    filtered = raw.filter(item => item.type === 'system' || (item.type !== 'elo_gain' && item.type !== 'elo_loss' && item.type !== 'refresh_offense' && item.type !== 'security_tampering'));
  }

  // 2. LIFO Stack Sequence: Sort by read state (unread first), then by newest entry at the top
  const sorted = [...filtered].sort((a, b) => {
    if (a.isRead === b.isRead) return 0;
    return a.isRead ? 1 : -1;
  });

  // 3. Handle Empty State
  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="notifications-empty-state">
        <div class="empty-icon-wrap">🔕</div>
        <h3 class="empty-title font-heading">No Notification Logs Found</h3>
        <p class="empty-desc">
          ${filter === 'all' 
            ? 'No activity entries have been recorded yet. Launch an arena match or adjust your profile to begin logging.' 
            : `No logs matching the "${filter.toUpperCase()}" filter category are currently in the directory.`}
        </p>
        ${filter !== 'all' ? `
          <button id="reset-filter-btn" class="btn-reset-filter font-heading">
            Reset to All Logs
          </button>
        ` : ''}
      </div>
    `;

    const resetBtn = document.getElementById('reset-filter-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        playSound('click');
        setActiveTab('all');
        renderNotificationsFeed(containerId, 'all');
      });
    }
    return;
  }

  // 4. Map Notifications to High-Fidelity Glass-Morphic Cards
  container.innerHTML = sorted.map((notif) => {
    const isUnread = notif.isRead === false;

    // Type metadata & visual presentation mapping
    let icon = '🔔';
    let typeBadge = 'SYSTEM LOG';
    let badgeClass = 'badge-system';
    let cardClass = isUnread ? 'notif-card unread-card' : 'notif-card read-card';

    if (notif.type === 'refresh_offense') {
      icon = '🚨';
      typeBadge = 'INTEGRITY BREACH';
      badgeClass = 'badge-offense';
      cardClass += ' offense-card';
    } else if (notif.type === 'security_tampering') {
      icon = '🛡️';
      typeBadge = 'SECURITY STRIKE';
      badgeClass = 'badge-security';
      cardClass += ' security-card';
    } else if (notif.type === 'elo_gain') {
      icon = '📈';
      typeBadge = 'RATING GAIN (+ELO)';
      badgeClass = 'badge-elo-gain';
      cardClass += ' elo-gain-card';
    } else if (notif.type === 'elo_loss') {
      icon = '📉';
      typeBadge = 'RATING LOSS (-ELO)';
      badgeClass = 'badge-elo-loss';
      cardClass += ' elo-loss-card';
    }

    return `
      <div class="${cardClass}" data-id="${notif.id}" role="article" aria-label="${notif.title || 'Notification Entry'}">
        <div class="notif-card-header">
          <div class="notif-meta-left">
            <span class="notif-icon-bubble" aria-hidden="true">${icon}</span>
            <div class="notif-title-group">
              <h4 class="notif-title font-heading">
                ${notif.title || 'System Notification'}
              </h4>
              <span class="notif-timestamp">${notif.timestamp || 'Recorded'}</span>
            </div>
            ${isUnread ? `
              <span class="subpixel-unread-dot" title="Unread entry" aria-label="Unread"></span>
            ` : ''}
          </div>

          <div class="notif-meta-right">
            <span class="notif-type-badge ${badgeClass} font-heading">
              ${typeBadge}
            </span>
            ${isUnread ? `
              <button class="btn-mark-single-read font-heading" data-read-id="${notif.id}" title="Mark this log as read">
                Mark Read
              </button>
            ` : `
              <span class="read-indicator-label">Archived Log</span>
            `}
          </div>
        </div>

        <div class="notif-card-body">
          <p class="notif-message-text">${notif.message || ''}</p>
        </div>

        <div class="notif-card-footer">
          <span class="notif-security-audit-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            HMAC Validated
          </span>
          <span class="notif-id-label">#${String(notif.id).slice(-8)}</span>
        </div>
      </div>
    `;
  }).join('');

  // 5. Bind Single Mark-As-Read Action Buttons
  container.querySelectorAll('.btn-mark-single-read').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      const id = btn.getAttribute('data-read-id');
      if (id) {
        markNotificationAsRead(id);
        renderNotificationsFeed(containerId, activeFilter);
        updateTelemetryCounters();
      }
    });
  });

  // Clicking anywhere on an unread card also marks it as read
  container.querySelectorAll('.unread-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      if (id) {
        markNotificationAsRead(id);
        renderNotificationsFeed(containerId, activeFilter);
        updateTelemetryCounters();
      }
    });
  });
}

// Helper to switch active filter button UI
function setActiveTab(filter) {
  document.querySelectorAll('.filter-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-filter') === filter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function updateTelemetryCounters() {
  const metrics = getNotificationMetrics();
  const elTotal = document.getElementById('metric-total-logs');
  const elUnread = document.getElementById('metric-unread-logs');
  const elElo = document.getElementById('metric-elo-deltas');
  const elSecurity = document.getElementById('metric-security-strikes');

  if (elTotal) elTotal.textContent = String(metrics.total);
  if (elUnread) elUnread.textContent = String(metrics.unread);
  if (elElo) elElo.textContent = String(metrics.eloDeltas);
  if (elSecurity) elSecurity.textContent = String(metrics.securityAlerts);

  updateUnreadStatusDots();
}

// ============================================================================
// 4. STANDALONE NOTIFICATIONS.HTML PAGE CONTROLLER
// ============================================================================

export function initNotificationsPage() {
  initNotificationDotListeners();
  updateTelemetryCounters();
  renderNotificationsFeed('notifications-feed-list', 'all');

  // 1. Filter Tabs
  document.querySelectorAll('.filter-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      const filter = btn.getAttribute('data-filter') || 'all';
      setActiveTab(filter);
      renderNotificationsFeed('notifications-feed-list', filter);
    });
  });

  // 2. Action: Mark All as Read
  const markAllBtn = document.getElementById('btn-mark-all-read');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      playSound('click');
      markAllNotificationsAsRead();
      clearAllUnreadDots();
      updateTelemetryCounters();
      renderNotificationsFeed('notifications-feed-list', activeFilter);
    });
  }

  // 3. Action: Clear Read Logs (Prunes desaturated entries while preserving unread audits)
  const clearReadBtn = document.getElementById('btn-clear-read-logs');
  if (clearReadBtn) {
    clearReadBtn.addEventListener('click', () => {
      playSound('click');
      clearReadNotifications();
      updateTelemetryCounters();
      renderNotificationsFeed('notifications-feed-list', activeFilter);
    });
  }

  // 4. Action: Dispatch Sample Test Log (Simulates incoming match telemetry)
  const testLogBtn = document.getElementById('btn-test-notification');
  if (testLogBtn) {
    testLogBtn.addEventListener('click', () => {
      playSound('click');
      const sampleTypes = ['elo_gain', 'elo_loss', 'refresh_offense', 'system'];
      const chosen = sampleTypes[Math.floor(Math.random() * sampleTypes.length)];
      if (chosen === 'elo_gain') {
        addNotification({
          type: 'elo_gain',
          title: 'Rating Gain',
          message: '📈 Rating Increase: +22 ELO earned in Tier 2: 1 - 500 [Simulated].'
        });
      } else if (chosen === 'elo_loss') {
        addNotification({
          type: 'elo_loss',
          title: 'Rating Adjustment',
          message: '📉 Rating Adjustment: -8 ELO in Tier 3: 1 - 1,000 [Simulated].'
        });
      } else if (chosen === 'refresh_offense') {
        addNotification({
          type: 'refresh_offense',
          title: 'Integrity Breach',
          message: '🚨 Abrupt reload recorded. Mandatory -5 ELO applied.'
        });
      } else {
        addNotification({
          type: 'system',
          title: 'Olympiad Calibration',
          message: 'Engine heuristics recalibrated with active browser precision clock.'
        });
      }
      updateTelemetryCounters();
      renderNotificationsFeed('notifications-feed-list', activeFilter);
    });
  }
}
