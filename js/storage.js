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
  soundEnabled: true
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

export function recordExamCompletion(resultPayload) {
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
