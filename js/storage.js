/**
 * PrimeFactor.app — Session State & Storage Layer
 * Manages active exam parameters, temporary session lifecycle, and connects to Cloud Firestore
 * for persistent user progression.
 * (All LocalStorage-based profile/ELO/streak persistence and tampering checks have been removed).
 */

import {
  getCurrentProfile,
  isUserLoggedIn,
  recordMatchToFirestore,
} from "./firebase.js";

const SETTINGS_KEY = "primefactor_settings";
const EXAM_PARAMS_KEY = "primefactor_active_exam_params";
const LAST_RESULT_KEY = "primefactor_last_result";

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
  participationMode: "rated",
};

export const DEFAULT_LEDGER = {
  examsCompleted: 0,
  highScore: 0,
  currentStreak: 0,
  bestStreak: 0,
  grandMasterCount: 0,
  totalSolved: 0,
  totalAttempted: 0,
};

// Safe JSON Parse helper for client browser settings
function safeGet(key, defaultVal) {
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!raw) return defaultVal;
    return { ...defaultVal, ...JSON.parse(raw) };
  } catch (e) {
    return defaultVal;
  }
}

function safeSet(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // fallback
  }
}

// Client engine settings (audio, volume, lifelines toggles)
export function getSettings() {
  return safeGet(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export function updateSettings(partial) {
  const current = getSettings();
  const next = { ...current, ...partial };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch (e) {}
  return next;
}

/**
 * Returns current ledger metrics from Cloud Firestore user profile if authenticated.
 * If user is a guest, returns clean baseline with zero progression saved.
 */
export function getLedger() {
  const profile = getCurrentProfile();
  if (profile) {
    return {
      examsCompleted: Number(profile.total_matches || 0),
      highScore: Number(profile.high_score || 0),
      currentStreak: Number(profile.current_win_streak || 0),
      bestStreak: Number(profile.best_streak || 0),
      grandMasterCount: Number(profile.grand_master_count || 0),
      totalSolved: Number(profile.total_solved || 0),
      totalAttempted: Number((profile.total_matches || 0) * 10),
    };
  }
  return { ...DEFAULT_LEDGER };
}

export function clearLedger() {
  return { ...DEFAULT_LEDGER };
}

/**
 * Record exam completion: only commits if user is logged in to Firestore
 */
export async function recordExamCompletion(resultPayload) {
  if (!isUserLoggedIn()) {
    console.warn(
      "[PrimeFactor] Guest session: exam completion not saved to profile.",
    );
    return getLedger();
  }

  try {
    await recordMatchToFirestore(resultPayload);
    return getLedger();
  } catch (e) {
    console.error("Error committing exam to Firestore:", e);
    return getLedger();
  }
}

// Active Exam Parameters methods (ephemeral match session configuration)
export function setActiveExamParams(params) {
  safeSet(EXAM_PARAMS_KEY, params);
}

export function getActiveExamParams() {
  return safeGet(EXAM_PARAMS_KEY, {
    min: 1,
    max: 200,
    title: "Tier 1: 1 - 200",
    rules: DEFAULT_SETTINGS,
  });
}

// Last Result Audit methods (session-scoped for result.html display)
export function setLastExamResult(resultData) {
  safeSet(LAST_RESULT_KEY, resultData);
}

export function getLastExamResult() {
  return safeGet(LAST_RESULT_KEY, null);
}

export function getFactorLatencySnapshot() {
  const lastResult = getLastExamResult();
  if (lastResult && Array.isArray(lastResult.factorLatencyAudit)) {
    return lastResult.factorLatencyAudit;
  }
  return [];
}

// Pre-flight Exam Lifecycle & Integrity Status tracking (session storage only)
const EXAM_IN_PROGRESS_KEY = "exam_in_progress";

export function setExamInProgress(inProgress) {
  try {
    sessionStorage.setItem(EXAM_IN_PROGRESS_KEY, inProgress ? "true" : "false");
  } catch (e) {}
}

export function isExamInProgress() {
  try {
    return sessionStorage.getItem(EXAM_IN_PROGRESS_KEY) === "true";
  } catch (e) {
    return false;
  }
}

export function setSessionStatus(status) {
  try {
    sessionStorage.setItem("status", status);
  } catch (e) {}
}

export function getSessionStatus() {
  try {
    return sessionStorage.getItem("status") || "NORMAL";
  } catch (e) {
    return "NORMAL";
  }
}

export function isPenaltyLockdownActive() {
  return false;
}

export function setPenaltyLockdown() {}

const NOTIFICATIONS_KEY = "primefactor_notifications";
const PENDING_TOASTS_KEY = "primefactor_pending_toasts";
const MAX_NOTIFICATIONS = 50;
let inMemoryNotifications = [];

function normalizeNotification(notifData = {}) {
  const isReadVal = Boolean(
    notifData.isRead !== undefined ? notifData.isRead : notifData.read,
  );
  return {
    ...notifData,
    id:
      notifData.id ||
      `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: notifData.timestamp || Date.now(),
    read: isReadVal,
    isRead: isReadVal,
  };
}

export function getNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryNotifications = parsed
          .map(normalizeNotification)
          .slice(0, MAX_NOTIFICATIONS);
        return [...inMemoryNotifications];
      }
    }
  } catch (e) {}
  return [...inMemoryNotifications];
}

export function saveNotifications(notifs) {
  const list = (Array.isArray(notifs) ? notifs : [])
    .map(normalizeNotification)
    .slice(0, MAX_NOTIFICATIONS);
  inMemoryNotifications = list;
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
  } catch (e) {}
  return [...list];
}

export function getPendingToasts() {
  try {
    const raw = sessionStorage.getItem(PENDING_TOASTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const active = parsed.filter((entry) => {
      if (!entry || !entry.id) return false;
      if (entry._shownAt && now - entry._shownAt >= 4800) return false;
      if (
        entry.timestamp &&
        typeof entry.timestamp === "number" &&
        now - entry.timestamp > 60000
      )
        return false;
      return true;
    });
    if (active.length !== parsed.length) {
      sessionStorage.setItem(PENDING_TOASTS_KEY, JSON.stringify(active));
    }
    return active;
  } catch (e) {
    return [];
  }
}

export function queuePendingToast(item) {
  if (!item || !item.id) return;
  try {
    const current = getPendingToasts().filter((entry) => entry.id !== item.id);
    current.push({ ...item, _shownAt: null });
    sessionStorage.setItem(
      PENDING_TOASTS_KEY,
      JSON.stringify(current.slice(-10)),
    );
  } catch (e) {}
}

export function markPendingToastShown(id) {
  if (!id) return;
  try {
    const raw = sessionStorage.getItem(PENDING_TOASTS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    const now = Date.now();
    const updated = parsed.map((entry) =>
      entry && entry.id === id
        ? { ...entry, _shownAt: entry._shownAt || now }
        : entry,
    );
    sessionStorage.setItem(PENDING_TOASTS_KEY, JSON.stringify(updated));
  } catch (e) {}
}

export function consumePendingToast(id) {
  if (!id) return;
  try {
    const raw = sessionStorage.getItem(PENDING_TOASTS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    const remaining = parsed.filter((entry) => entry && entry.id !== id);
    sessionStorage.setItem(PENDING_TOASTS_KEY, JSON.stringify(remaining));
  } catch (e) {}
}

// Notification helper (persists & dispatches in-app notification event)
export function addNotification(notifData = {}) {
  const item = normalizeNotification({
    ...notifData,
    read: Boolean(notifData.read ?? notifData.isRead ?? false),
    isRead: Boolean(notifData.read ?? notifData.isRead ?? false),
  });
  const current = getNotifications();
  const existingIdx = current.findIndex(
    (entry) => entry && entry.id === item.id,
  );
  const nextList =
    existingIdx >= 0
      ? [item, ...current.filter((_, idx) => idx !== existingIdx)]
      : [item, ...current];
  const next = saveNotifications(nextList);
  if (!notifData.silent) {
    queuePendingToast(item);
  }
  try {
    window.dispatchEvent(
      new CustomEvent("primefactor_notification_added", { detail: item }),
    );
  } catch (e) {}
  return next[0] || item;
}

export function markAllNotificationsAsRead() {
  const next = saveNotifications(
    getNotifications().map((n) => ({ ...n, read: true, isRead: true })),
  );
  try {
    window.dispatchEvent(
      new CustomEvent("primefactor_notifications_read", {
        detail: { all: true },
      }),
    );
  } catch (e) {}
  return next;
}

export function markNotificationAsRead(id) {
  const next = saveNotifications(
    getNotifications().map((n) =>
      n.id === id ? { ...n, read: true, isRead: true } : n,
    ),
  );
  try {
    window.dispatchEvent(
      new CustomEvent("primefactor_notifications_read", { detail: { id } }),
    );
  } catch (e) {}
  return next;
}

export function clearReadNotifications() {
  const next = saveNotifications(
    getNotifications().filter((n) => !n.read && !n.isRead),
  );
  try {
    window.dispatchEvent(
      new CustomEvent("primefactor_notifications_read", {
        detail: { cleared: true },
      }),
    );
  } catch (e) {}
  return next;
}

export function clearAllNotifications() {
  const next = saveNotifications([]);
  try {
    window.dispatchEvent(
      new CustomEvent("primefactor_notifications_read", {
        detail: { clearedAll: true },
      }),
    );
  } catch (e) {}
  return next;
}

export function hasUnreadNotifications() {
  return getNotifications().some((n) => !n.read && !n.isRead);
}

let inMemoryFlags = 0;
export function getConsecutiveFlags() {
  return inMemoryFlags;
}

export function incrementConsecutiveFlags() {
  inMemoryFlags++;
  return inMemoryFlags;
}

export function resetConsecutiveFlags() {
  inMemoryFlags = 0;
}

export function recordMobileAbruptExitOffense() {
  console.warn("[PrimeFactor] Mobile abrupt exit noted in session");
}
