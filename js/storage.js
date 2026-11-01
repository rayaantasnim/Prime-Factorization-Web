/**
 * PrimeFactor.app — Serverless Local Storage Layer
 * 100% Client-Side State Management for User Settings, Personal Ledger, and Exam Audits.
 */

const SETTINGS_KEY = 'primefactor_settings';
const LEDGER_KEY = 'primefactor_ledger';
const EXAM_PARAMS_KEY = 'primefactor_active_exam_params';
const LAST_RESULT_KEY = 'primefactor_last_result';

export const DEFAULT_SETTINGS = {
  allowSecondAttempt: true,
  allowPause: true,
  allowRegenerate: true,
  allowHint: true,
  allowSandbox: true,
  allowNoise: true,
  allowComboTracker: true,
  subSecondBoost: true,
  allowSkip: true,
  allowDeficitOverride: true,
  soundEnabled: true,
  masterVolume: 0.8,
  eventChimePitch: 440,
  participationMode: 'rated'
};

export const DEFAULT_LEDGER = {
  examsCompleted: 0,
  highScore: 0,
  currentStreak: 0,
  bestStreak: 0,
  grandMasterCount: 0,
  totalSolved: 0,
  totalAttempted: 0
};

// Safe JSON Parse helper
function safeGet(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return { ...defaultVal, ...JSON.parse(raw) };
  } catch (e) {
    console.warn(`Error reading localStorage for key '${key}':`, e);
    return defaultVal;
  }
}

// Safe JSON Set helper
function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing localStorage for key '${key}':`, e);
  }
}

// Settings methods
export function getSettings() {
  return safeGet(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export function updateSettings(partial) {
  const current = getSettings();
  const next = { ...current, ...partial };
  safeSet(SETTINGS_KEY, next);
  return next;
}

// Ledger methods
export function getLedger() {
  return safeGet(LEDGER_KEY, DEFAULT_LEDGER);
}

export function clearLedger() {
  safeSet(LEDGER_KEY, DEFAULT_LEDGER);
  return DEFAULT_LEDGER;
}

export function recordExamCompletion(resultPayload) {
  // If in unrated practice mode, bypass permanent ledger updates and ELO alterations
  if (resultPayload.participationMode === 'unrated' || resultPayload.mode === 'unrated') {
    return getLedger();
  }

  const ledger = getLedger();
  ledger.examsCompleted += 1;
  ledger.totalSolved += (resultPayload.correctFirstAttempt || 0) + (resultPayload.correctSecondAttempt || 0);
  ledger.totalAttempted += (resultPayload.totalQuestions || 10);

  if (resultPayload.score > ledger.highScore) {
    ledger.highScore = resultPayload.score;
  }

  // Check if perfect (10/10 first attempt)
  const isPerfect = (resultPayload.correctFirstAttempt === 10);
  if (isPerfect) {
    ledger.currentStreak += 1;
    if (ledger.currentStreak > ledger.bestStreak) {
      ledger.bestStreak = ledger.currentStreak;
    }
    if (resultPayload.lifelinesUsedCount === 0) {
      ledger.grandMasterCount += 1;
    }
  } else {
    ledger.currentStreak = 0;
  }

  safeSet(LEDGER_KEY, ledger);
  return ledger;
}

// Active Exam Parameters methods
export function setActiveExamParams(params) {
  safeSet(EXAM_PARAMS_KEY, params);
}

export function getActiveExamParams() {
  return safeGet(EXAM_PARAMS_KEY, {
    min: 1,
    max: 200,
    title: 'Tier 1: 1 - 200',
    rules: DEFAULT_SETTINGS
  });
}

// Last Result Audit methods
export function setLastExamResult(resultData) {
  safeSet(LAST_RESULT_KEY, resultData);
}

export function getLastExamResult() {
  return safeGet(LAST_RESULT_KEY, null);
}

// Micro-latency Factor Evaluation Snapshot accessor
export function getFactorLatencySnapshot() {
  const lastResult = getLastExamResult();
  if (lastResult && Array.isArray(lastResult.factorLatencyAudit)) {
    return lastResult.factorLatencyAudit;
  }
  return [];
}

// ============================================================================
// Pre-flight Exam Lifecycle & Integrity Status tracking methods
// ============================================================================
const EXAM_IN_PROGRESS_KEY = 'exam_in_progress';
const STATUS_KEY = 'status';
const PRIMEFACTOR_STATUS_KEY = 'primefactor_status';
const OFFENSE_COUNT_KEY = 'primefactor_offense_count';
const ABORTED_MATCH_KEY = 'primefactor_aborted_match_payload';

export function setExamInProgress(inProgress) {
  const val = inProgress ? 'true' : 'false';
  try {
    sessionStorage.setItem(EXAM_IN_PROGRESS_KEY, val);
    localStorage.setItem(EXAM_IN_PROGRESS_KEY, val);
  } catch (e) {
    console.warn('Error setting exam_in_progress:', e);
  }
}

export function isExamInProgress() {
  try {
    return sessionStorage.getItem(EXAM_IN_PROGRESS_KEY) === 'true' ||
           localStorage.getItem(EXAM_IN_PROGRESS_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function setSessionStatus(status) {
  try {
    localStorage.setItem(STATUS_KEY, status);
    localStorage.setItem(PRIMEFACTOR_STATUS_KEY, status);
    sessionStorage.setItem(STATUS_KEY, status);
    sessionStorage.setItem(PRIMEFACTOR_STATUS_KEY, status);
  } catch (e) {
    console.warn('Error setting session status:', e);
  }
}

export function getSessionStatus() {
  try {
    return localStorage.getItem(STATUS_KEY) ||
           localStorage.getItem(PRIMEFACTOR_STATUS_KEY) ||
           sessionStorage.getItem(STATUS_KEY) ||
           'NORMAL';
  } catch (e) {
    return 'NORMAL';
  }
}

export function getOffenseCount() {
  try {
    return Number(localStorage.getItem(OFFENSE_COUNT_KEY) || 0);
  } catch (e) {
    return 0;
  }
}

export function incrementOffenseCount() {
  try {
    const current = getOffenseCount() + 1;
    localStorage.setItem(OFFENSE_COUNT_KEY, String(current));
    return current;
  } catch (e) {
    return 1;
  }
}

export function resetOffenseCount() {
  try {
    localStorage.setItem(OFFENSE_COUNT_KEY, '0');
  } catch (e) {
    console.warn('Error resetting offense count:', e);
  }
}

export function setAbortedMatchPayload(payload) {
  safeSet(ABORTED_MATCH_KEY, payload);
}

export function getAbortedMatchPayload() {
  return safeGet(ABORTED_MATCH_KEY, null);
}

export function clearAbortedMatchPayload() {
  try {
    localStorage.removeItem(ABORTED_MATCH_KEY);
  } catch (e) {
    console.warn('Error clearing aborted match payload:', e);
  }
}

// ============================================================================
// Three-Match Strike Chain & Plus-Rating Blackhole Lockdown Storage Layer
// ============================================================================
const CONSECUTIVE_FLAGS_KEY = 'primefactor_consecutive_flags';
const PENALTY_LOCKDOWN_KEY = 'primefactor_penalty_lockdown';

export function getConsecutiveFlags() {
  try {
    return Number(localStorage.getItem(CONSECUTIVE_FLAGS_KEY) || 0);
  } catch (e) {
    return 0;
  }
}

export function incrementConsecutiveFlags() {
  try {
    const current = getConsecutiveFlags() + 1;
    localStorage.setItem(CONSECUTIVE_FLAGS_KEY, String(current));
    return current;
  } catch (e) {
    return 1;
  }
}

export function resetConsecutiveFlags() {
  try {
    localStorage.setItem(CONSECUTIVE_FLAGS_KEY, '0');
  } catch (e) {
    console.warn('Error resetting consecutive flags:', e);
  }
}

export function isPenaltyLockdownActive() {
  try {
    return localStorage.getItem(PENALTY_LOCKDOWN_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function setPenaltyLockdown(active) {
  try {
    localStorage.setItem(PENALTY_LOCKDOWN_KEY, active ? 'true' : 'false');
  } catch (e) {
    console.warn('Error setting penalty lockdown:', e);
  }
}

// ============================================================================
// Notifications Center Storage Layer (LIFO Stack & Read Tracker)
// ============================================================================
const NOTIFICATIONS_KEY = 'primefactor_notifications';

export function getNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      // Seed default notification initial entries so system shows unread status on fresh load
      const initial = [
        {
          id: 'notif-seed-1',
          type: 'refresh_offense',
          title: 'Integrity Breach',
          message: '🚨 Abrupt reload recorded. Mandatory -5 ELO applied.',
          timestamp: 'Recent',
          isRead: false
        },
        {
          id: 'notif-seed-2',
          type: 'elo_gain',
          title: 'Rating Calibration',
          message: '📈 Division calibration unlocked. Compete in rated arenas to ascend the 12-Tier Rank Matrix.',
          timestamp: 'Today',
          isRead: true
        },
        {
          id: 'notif-seed-3',
          type: 'system',
          title: 'Onboarding Initialized',
          message: 'Welcome to PrimeFactor.app! Baseline competitive rating locked at 500 ELO (Composite Apprentice).',
          timestamp: 'Initial',
          isRead: true
        }
      ];
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading notifications:', e);
    return [];
  }
}

export function saveNotifications(notifications) {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.warn('Error saving notifications:', e);
  }
}

export function addNotification({
  type = 'system',
  title = 'System Notice',
  message = '',
  timestamp = null,
  eloTracker = null,
  performance = null,
  details = null,
  narrative = null
}) {
  try {
    const list = getNotifications();
    const timeStr = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
    const newNotif = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      type,
      title,
      message,
      timestamp: timeStr,
      isRead: false,
      eloTracker,
      performance,
      details,
      narrative
    };
    // LIFO Stack: New notifications at absolute top of view
    list.unshift(newNotif);
    // Keep max 50 notifications in stack
    const trimmed = list.slice(0, 50);
    saveNotifications(trimmed);
    window.dispatchEvent(new CustomEvent('primefactor_notification_added', { detail: newNotif }));
    return newNotif;
  } catch (e) {
    console.warn('Error adding notification:', e);
    return null;
  }
}

export function markAllNotificationsAsRead() {
  try {
    const list = getNotifications();
    const updated = list.map(item => ({ ...item, isRead: true }));
    saveNotifications(updated);
    window.dispatchEvent(new CustomEvent('primefactor_notifications_read'));
    return updated;
  } catch (e) {
    console.warn('Error marking notifications as read:', e);
    return [];
  }
}

export function markNotificationAsRead(id) {
  try {
    const list = getNotifications();
    const updated = list.map(item => item.id === id ? { ...item, isRead: true } : item);
    saveNotifications(updated);
    window.dispatchEvent(new CustomEvent('primefactor_notifications_read', { detail: { id } }));
    return updated;
  } catch (e) {
    console.warn('Error marking notification as read:', e);
    return [];
  }
}

export function clearReadNotifications() {
  try {
    const list = getNotifications();
    const updated = list.filter(item => item.isRead === false);
    saveNotifications(updated);
    window.dispatchEvent(new CustomEvent('primefactor_notifications_read'));
    return updated;
  } catch (e) {
    console.warn('Error clearing read notifications:', e);
    return [];
  }
}

export function clearAllNotifications() {
  try {
    saveNotifications([]);
    window.dispatchEvent(new CustomEvent('primefactor_notifications_read'));
    return [];
  } catch (e) {
    console.warn('Error clearing all notifications:', e);
    return [];
  }
}

export function hasUnreadNotifications() {
  const list = getNotifications();
  return list.some(item => item.isRead === false);
}

// ============================================================================
// 64-BIT MASHED HASH BACKUP INTEGRITY CONTROL GATE
// ============================================================================
export const ENGINE_HMAC_SECRET = "YOUR_LOCAL_HMAC_SECRET_KEY_PLACEHOLDER";

/**
 * Computes a sealed 64-bit verification hash for JSON state backups.
 * Strictly mashes: elo, peak_elo, total_solved, exams_completed, active_security_strikes,
 * current_win_streak, and cumulative earned medals, keyed by ENGINE_HMAC_SECRET.
 *
 * @param {object} payload - The extracted profile metrics
 * @param {string} [secret] - Cryptographic HMAC secret
 * @returns {string} 16-character (64-bit) uppercase hexadecimal verification hash
 */
export function compute64BitBackupHash(payload, secret = ENGINE_HMAC_SECRET) {
  const elo = Number(payload.elo ?? 500);
  const peakElo = Number(payload.peak_elo ?? elo);
  const totalSolved = Number(payload.total_solved ?? 0);
  const examsCompleted = Number(payload.exams_completed ?? 0);
  const securityStrikes = Number(payload.active_security_strikes ?? 0);
  const winStreak = Number(payload.current_win_streak ?? 0);
  const medals = Array.isArray(payload.medals) ? payload.medals.length : Number(payload.medals ?? 0);

  // Strictly mash together the exact candidate metrics
  const mashedString = `ELO:${elo}#PEAK:${peakElo}#SOLVED:${totalSolved}#EXAMS:${examsCompleted}#STRIKES:${securityStrikes}#STREAK:${winStreak}#MEDALS:${medals}`;

  // Deterministic 64-bit FNV-1a + Murmur/DJB2 hybrid hash generator
  let hash1 = 0x811c9dc5;
  let hash2 = 0x55555555;
  const combined = secret + '::' + mashedString + '::' + secret.length;

  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    hash1 ^= code;
    hash1 = (Math.imul(hash1, 0x01000193)) >>> 0;
    hash2 = ((hash2 << 5) - hash2 + code) >>> 0;
    hash2 ^= (hash1 >>> 16);
  }

  // Exact 64-bit hex string representation (16 characters, 8 for hash1 + 8 for hash2)
  return (hash1.toString(16).padStart(8, '0') + hash2.toString(16).padStart(8, '0')).toUpperCase();
}

