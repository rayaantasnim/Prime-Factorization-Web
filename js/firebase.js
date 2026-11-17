/**
 * PrimeFactor.app — Firebase Authentication & Cloud Firestore Integration Layer (V3.4)
 *
 * Security model (see firestore.rules for the server-side half):
 *  - Private PII (`email`, `friends`, full ledger) stays in `users/{uid}` readable/writable ONLY by owner.
 *  - Public standing card (`leaderboard/{uid}`) exposes only safe public metrics & recent 10 matches.
 *  - Globally unique `@handle` reservations (`handles/{handle}`) are claimed transactionally.
 *  - `waitForAuthReady()` eliminates early-boot auth race conditions across all MPA pages.
 */

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getCountFromServer,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

const env =
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

// Support optional firebase-applet-config.json if provisioned in AI Studio, or VITE_FIREBASE_* env vars.
const configModules =
  typeof import.meta !== "undefined" && import.meta.glob
    ? import.meta.glob("/firebase-applet-config.json", { eager: true })
    : {};
const appletConfig =
  configModules["/firebase-applet-config.json"]?.default ||
  configModules["/firebase-applet-config.json"] ||
  null;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig?.apiKey || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig?.authDomain || "",
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig?.projectId || "",
  storageBucket:
    env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig?.storageBucket || "",
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    appletConfig?.messagingSenderId ||
    "",
  appId: env.VITE_FIREBASE_APP_ID || appletConfig?.appId || "",
  measurementId:
    env.VITE_FIREBASE_MEASUREMENT_ID || appletConfig?.measurementId || "",
};

const firestoreDatabaseId =
  env.VITE_FIREBASE_DATABASE_ID || appletConfig?.firestoreDatabaseId || "";

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

export let app = null;
export let auth = null;
export let db = null;
export let googleProvider = null;

export const OperationType = Object.freeze({
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  LIST: "list",
  GET: "get",
  WRITE: "write",
});

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);

  // Optional App Check (enabled only when a reCAPTCHA v3 site key is provided at build time).
  if (env.VITE_RECAPTCHA_SITE_KEY && typeof window !== "undefined") {
    import("firebase/app-check")
      .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(env.VITE_RECAPTCHA_SITE_KEY),
          isTokenAutoRefreshEnabled: true,
        });
      })
      .catch((e) => console.warn("[Firebase] App Check unavailable:", e));
  }

  // FAST AUTH: initialise without the popup/redirect resolver (which would eagerly load a hidden
  // gapi iframe on every page). The resolver is passed lazily to sign-in calls only.
  // IndexedDB persistence first => the stored session restores in a few ms, with localStorage fallback.
  auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  });

  // FAST FIRESTORE: persistent multi-tab IndexedDB cache => repeat reads (profile, leaderboard) are
  // served from disk instantly while the server revalidates in the background. Long-polling
  // auto-detect avoids WebChannel stalls behind restrictive proxies.
  const fsSettings = {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    experimentalAutoDetectLongPolling: true,
  };
  try {
    db = firestoreDatabaseId
      ? initializeFirestore(app, fsSettings, firestoreDatabaseId)
      : initializeFirestore(app, fsSettings);
  } catch (e) {
    console.warn(
      "[Firebase] Persistent cache unavailable, using default Firestore:",
      e,
    );
    db = firestoreDatabaseId
      ? getFirestore(app, firestoreDatabaseId)
      : getFirestore(app);
  }
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });

  // Complete a pending redirect sign-in only when one was started (avoids loading the resolver otherwise).
  try {
    if (sessionStorage.getItem("pf_redirect_pending") === "1") {
      sessionStorage.removeItem("pf_redirect_pending");
      getRedirectResult(auth, browserPopupRedirectResolver).catch((e) =>
        console.warn("[Firebase] Redirect result:", e),
      );
    }
  } catch (e) {
    /* storage unavailable */
  }
} else {
  console.warn(
    "[Firebase] VITE_FIREBASE_* environment variables not configured. Running in guest/local mode.",
  );
}

// ---------------------------------------------------------------------------------------
// Limits — MUST stay in sync with firestore.rules
// ---------------------------------------------------------------------------------------
export const LIMITS = Object.freeze({
  BASE_ELO: 500,
  MAX_ELO: 5000,
  MAX_ELO_STEP: 250, // largest legal single-write ELO movement
  MAX_SOLVED_STEP: 50, // largest legal single-match solved count
  MAX_SCORE: 1000,
  MAX_LOGS: 50,
  MAX_PUBLIC_LOGS: 10,
  HANDLE_MIN: 3,
  HANDLE_MAX: 20,
  TEXT_MAX: 80,
  NAME_MAX: 60,
});

const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const EDITABLE_TEXT_FIELDS = [
  "realName",
  "city",
  "country",
  "organization",
  "enrollCause",
];

// ---------------------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------------------
let currentUser = null;
let currentProfile = null;
let isAuthReady = false;
const authListeners = new Set();
const authReadyWaiters = [];
const profileInflight = new Map();

// ---------------------------------------------------------------------------------------
// Instant-session hint: a compact, PII-free snapshot of the last signed-in profile so that every
// page can paint the signed-in header + ELO immediately, then reconcile with Firebase.
// (Never trusted for writes: all mutations run in server transactions guarded by firestore.rules.)
// ---------------------------------------------------------------------------------------
const HINT_KEY = "pf_session_hint_v1";
export function readSessionHint() {
  try {
    const raw = localStorage.getItem(HINT_KEY);
    if (!raw) return null;
    const h = JSON.parse(raw);
    return h && typeof h.uid === "string" && h.profile ? h : null;
  } catch (e) {
    return null;
  }
}
function writeSessionHint(user, profile) {
  try {
    if (!user || !profile || profile._unsynced) return;
    const { email, ...safe } = profile;
    localStorage.setItem(
      HINT_KEY,
      JSON.stringify({
        uid: user.uid,
        t: Date.now(),
        user: {
          uid: user.uid,
          displayName: user.displayName || profile.displayName || "",
          photoURL: safePhotoURL(user.photoURL || profile.photoURL),
        },
        profile: safe,
      }),
    );
  } catch (e) {
    /* quota / private mode */
  }
}
function clearSessionHint() {
  try {
    localStorage.removeItem(HINT_KEY);
  } catch (e) {}
}
const bootHint = readSessionHint();
/** Synchronous best-guess auth state for first paint (null if none). */
export const getAuthHint = () =>
  isAuthReady
    ? null
    : bootHint
      ? { user: bootHint.user, profile: bootHint.profile, hint: true }
      : null;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const cleanText = (v, max) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);

/** Normalize raw input into candidate handle format (lowercase alphanumeric + underscores). */
export function normalizeHandle(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, LIMITS.HANDLE_MAX);
}

/** Validates canonical handle rules: 3–20 chars of [a-z0-9_]. */
export function isValidHandleFormat(handle) {
  return typeof handle === "string" && /^[a-z0-9_]{3,20}$/.test(handle);
}

function generateCandidateHandles(user) {
  const rawSeed =
    user?.displayName || user?.email?.split("@")[0] || "contender";
  let base = normalizeHandle(rawSeed);
  if (base.length < LIMITS.HANDLE_MIN) {
    base = (base + "_contender").slice(0, 14);
  }
  const stem = base.slice(0, 14).replace(/_+$/, "") || "contender";
  const candidates = [base];
  for (let i = 0; i < 6; i++) {
    const suffix = String(Math.floor(100 + Math.random() * 9000));
    candidates.push(`${stem}_${suffix}`.slice(0, LIMITS.HANDLE_MAX));
  }
  const uidTail =
    String(user?.uid || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 5) || "pf";
  candidates.push(
    `${stem.slice(0, 13)}_${uidTail}`.slice(0, LIMITS.HANDLE_MAX),
  );
  return [...new Set(candidates)].filter(isValidHandleFormat);
}

/** Only https(s) photo URLs are ever kept. */
function safePhotoURL(url) {
  try {
    const u = new URL(String(url || ""));
    return u.protocol === "https:" ? u.href : "";
  } catch (e) {
    return "";
  }
}

function dispatch(name, detail) {
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch (e) {
    /* non-browser env */
  }
}

function emitAuth() {
  const payload = { user: currentUser, profile: currentProfile };
  authListeners.forEach((cb) => {
    try {
      cb(payload);
    } catch (e) {
      console.warn("Auth listener error:", e);
    }
  });
  dispatch("primefactor_auth_changed", payload);
}

function emitProfile() {
  const payload = { user: currentUser, profile: currentProfile };
  authListeners.forEach((cb) => {
    try {
      cb(payload);
    } catch (e) {
      console.warn("Auth listener error:", e);
    }
  });
  dispatch("primefactor_profile_updated", { profile: currentProfile });
}

function resolveAuthReadyWaiters() {
  while (authReadyWaiters.length > 0) {
    const resolve = authReadyWaiters.shift();
    try {
      resolve({ user: currentUser, profile: currentProfile });
    } catch (e) {
      /* ignore waiter callback errors */
    }
  }
}

/**
 * Resolves only AFTER Firebase's initial `onAuthStateChanged` check has finished (`isAuthReady === true`).
 */
export function waitForAuthReady() {
  if (isAuthReady) {
    return Promise.resolve({ user: currentUser, profile: currentProfile });
  }
  return new Promise((resolve) => {
    authReadyWaiters.push(resolve);
  });
}

/**
 * Builds a sanitized public leaderboard payload containing ZERO PII (no email, no friends).
 */
function buildPublicLeaderboardPayload(
  profile,
  lastMatchAtOverride = undefined,
) {
  const logs = Array.isArray(profile.match_logs) ? profile.match_logs : [];
  const safeRecent = logs.slice(0, LIMITS.MAX_PUBLIC_LOGS);
  const payload = {
    uid: profile.uid,
    handle: normalizeHandle(profile.handle || "") || "contender",
    displayName:
      cleanText(profile.displayName || "Contender", LIMITS.NAME_MAX) ||
      "Contender",
    photoURL: safePhotoURL(profile.photoURL),
    elo: clamp(
      Math.round(num(profile.elo, LIMITS.BASE_ELO)),
      0,
      LIMITS.MAX_ELO,
    ),
    peak_elo: clamp(
      Math.round(num(profile.peak_elo, LIMITS.BASE_ELO)),
      0,
      LIMITS.MAX_ELO,
    ),
    total_solved: Math.max(0, Math.round(num(profile.total_solved, 0))),
    total_matches: Math.max(0, Math.round(num(profile.total_matches, 0))),
    best_streak: Math.max(0, Math.round(num(profile.best_streak, 0))),
    country: cleanText(profile.country || "None", LIMITS.TEXT_MAX),
    organization: cleanText(profile.organization || "None", LIMITS.TEXT_MAX),
    recent_matches: safeRecent,
    updatedAt: serverTimestamp(),
  };
  if (
    typeof lastMatchAtOverride === "number" &&
    Number.isFinite(lastMatchAtOverride)
  ) {
    payload.last_match_at = Math.max(0, Math.round(lastMatchAtOverride));
  }
  return payload;
}

/**
 * Initial profile. Shape matches firestore.rules on create (including unique `handle` & `friends: []`).
 */
export function createDefaultProfile(user, assignedHandle = "") {
  const fallbackHandle = isValidHandleFormat(assignedHandle)
    ? assignedHandle
    : generateCandidateHandles(user)[0] || "contender_001";
  return {
    uid: user.uid,
    handle: fallbackHandle,
    displayName:
      cleanText(
        user.displayName || user.email?.split("@")[0] || "Contender",
        LIMITS.NAME_MAX,
      ) || "Contender",
    email: user.email || "",
    photoURL: safePhotoURL(user.photoURL),
    elo: LIMITS.BASE_ELO,
    peak_elo: LIMITS.BASE_ELO,
    total_solved: 0,
    total_matches: 0,
    current_win_streak: 0,
    best_streak: 0,
    high_score: 0,
    grand_master_count: 0,
    medals: [],
    match_logs: [],
    friends: [],
    realName: "None",
    city: "None",
    country: "None",
    organization: "None",
    enrollCause: "Olympiad Training",
    settings: {},
  };
}

/**
 * Fetch the profile, creating it atomically on first sign-in alongside a unique `handles/{handle}`
 * claim and `leaderboard/{uid}` public card. Concurrent callers for the same uid share one promise.
 */
export function fetchOrCreateProfile(user) {
  if (!user || !db) return Promise.resolve(null);
  if (profileInflight.has(user.uid)) return profileInflight.get(user.uid);

  const p = (async () => {
    const userRef = doc(db, "users", user.uid);
    const leaderboardRef = doc(db, "leaderboard", user.uid);
    const candidates = generateCandidateHandles(user);

    try {
      let resolvedData = null;

      // FAST PATH: both documents fetched in parallel (cache-first via persistent cache, one round
      // trip otherwise). Only fall through to the 3-read creation transaction if something is missing.
      try {
        const [uSnap, lbSnap0] = await Promise.all([
          getDoc(userRef),
          getDoc(leaderboardRef),
        ]);
        if (
          uSnap.exists() &&
          lbSnap0.exists() &&
          isValidHandleFormat(uSnap.data()?.handle) &&
          Array.isArray(uSnap.data()?.friends)
        ) {
          resolvedData = uSnap.data();
        }
      } catch (fastErr) {
        if (fastErr?.code === "permission-denied") throw fastErr;
      }

      for (
        let attempt = 0;
        !resolvedData && attempt < candidates.length;
        attempt++
      ) {
        const candidateHandle = candidates[attempt];
        const handleRef = doc(db, "handles", candidateHandle);

        const txResult = await runTransaction(db, async (tx) => {
          const snap = await tx.get(userRef);
          const lbSnap = await tx.get(leaderboardRef);
          const handleSnap = await tx.get(handleRef);

          if (snap.exists()) {
            const existing = snap.data();
            const hasValidHandle = isValidHandleFormat(existing.handle);
            const hasFriends = Array.isArray(existing.friends);

            // Legacy V3.3 backfill: assign unique handle & friends array if missing
            if (!hasValidHandle) {
              if (handleSnap.exists() && handleSnap.data()?.uid !== user.uid) {
                return { retryHandle: true };
              }
              const patchedProfile = {
                ...createDefaultProfile(user, candidateHandle),
                ...existing,
                uid: user.uid,
                handle: candidateHandle,
                friends: hasFriends ? existing.friends : [],
              };
              if (!handleSnap.exists()) {
                tx.set(handleRef, {
                  uid: user.uid,
                  handle: candidateHandle,
                  createdAt: serverTimestamp(),
                });
              }
              tx.update(userRef, {
                handle: candidateHandle,
                friends: patchedProfile.friends,
                updatedAt: serverTimestamp(),
              });
              if (!lbSnap.exists()) {
                tx.set(
                  leaderboardRef,
                  buildPublicLeaderboardPayload(patchedProfile, 0),
                  { merge: true },
                );
              } else {
                tx.set(
                  leaderboardRef,
                  buildPublicLeaderboardPayload(patchedProfile),
                  { merge: true },
                );
              }
              return { retryHandle: false, data: patchedProfile };
            }

            // Ensure public leaderboard card exists for active users
            if (!lbSnap.exists()) {
              const merged = {
                ...createDefaultProfile(user, existing.handle),
                ...existing,
                uid: user.uid,
              };
              tx.set(leaderboardRef, buildPublicLeaderboardPayload(merged, 0), {
                merge: true,
              });
            }
            return { retryHandle: false, data: existing };
          }

          // Fresh user creation: ensure candidate handle is free
          if (handleSnap.exists() && handleSnap.data()?.uid !== user.uid) {
            return { retryHandle: true };
          }

          const fresh = createDefaultProfile(user, candidateHandle);
          tx.set(userRef, {
            ...fresh,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          if (!handleSnap.exists()) {
            tx.set(handleRef, {
              uid: user.uid,
              handle: candidateHandle,
              createdAt: serverTimestamp(),
            });
          }
          tx.set(leaderboardRef, buildPublicLeaderboardPayload(fresh, 0), {
            merge: true,
          });
          return { retryHandle: false, data: fresh };
        });

        if (!txResult.retryHandle) {
          resolvedData = txResult.data;
          break;
        }
      }

      if (!resolvedData) {
        throw new Error(
          "Could not reserve a unique @handle after multiple attempts.",
        );
      }

      currentProfile = {
        ...createDefaultProfile(user, resolvedData.handle),
        ...resolvedData,
        uid: user.uid,
      };
      writeSessionHint(user, currentProfile);
    } catch (err) {
      console.error("[Firebase] Error fetching/creating profile:", err);
      currentProfile = { ...createDefaultProfile(user), _unsynced: true };
      if (
        err?.code === "permission-denied" ||
        String(err?.message || "").includes(
          "Missing or insufficient permissions",
        )
      ) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    } finally {
      profileInflight.delete(user.uid);
    }
    return currentProfile;
  })();

  profileInflight.set(user.uid, p);
  return p;
}

/**
 * Sign in with Google. Never throws for a user-cancelled popup; resolves to `{ user, profile }`.
 */
export async function signInWithGoogle() {
  if (!auth || !googleProvider) {
    console.warn("[Firebase] Sign-In unavailable: Firebase is not configured.");
    if (typeof window !== "undefined" && window.UX?.toast) {
      window.UX.toast(
        "Firebase not configured — configure VITE_FIREBASE_* in .env to enable Google Sign-In.",
        "info",
      );
    }
    return { user: null, profile: null };
  }
  try {
    const result = await signInWithPopup(
      auth,
      googleProvider,
      browserPopupRedirectResolver,
    );
    currentUser = result.user;
    currentProfile = await fetchOrCreateProfile(result.user);
    isAuthReady = true;
    resolveAuthReadyWaiters();
    emitAuth();
    return { user: currentUser, profile: currentProfile };
  } catch (err) {
    const code = err && err.code;
    if (
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      return { user: null, profile: null };
    }
    if (
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment"
    ) {
      try {
        try {
          sessionStorage.setItem("pf_redirect_pending", "1");
        } catch (e2) {
          /* ignore */
        }
        await signInWithRedirect(
          auth,
          googleProvider,
          browserPopupRedirectResolver,
        );
      } catch (e) {
        console.error("[Firebase] Redirect sign-in error:", e);
      }
      return { user: null, profile: null };
    }
    console.error("[Firebase] Sign In Error:", code || err);
    throw err;
  }
}

export async function signOutUser() {
  if (auth) {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("[Firebase] Sign Out Error:", err);
      throw err;
    }
  }
  currentUser = null;
  currentProfile = null;
  clearSessionHint();
  try {
    [
      "primefactor_last_result",
      "primefactor_active_exam_params",
      "exam_in_progress",
      "status",
    ].forEach((k) => {
      sessionStorage.removeItem(k);
    });
  } catch (e) {
    /* storage unavailable */
  }
  emitAuth();
}

export function onAuthChange(callback) {
  authListeners.add(callback);
  if (isAuthReady) {
    try {
      callback({ user: currentUser, profile: currentProfile });
    } catch (e) {
      console.warn(e);
    }
  }
  return () => authListeners.delete(callback);
}

// Global observer. Guards against out-of-order async results when sessions switch quickly.
let authEpoch = 0;
if (auth) {
  onAuthStateChanged(auth, async (user) => {
    const epoch = ++authEpoch;
    currentUser = user;
    if (!user) {
      clearSessionHint();
      currentProfile = null;
      isAuthReady = true;
      resolveAuthReadyWaiters();
      emitAuth();
      return;
    }

    // STALE-WHILE-REVALIDATE: if we hold a hint for this very uid, release the page immediately with
    // it and refresh from Firestore in the background (emits `primefactor_profile_updated`).
    const hint = bootHint && bootHint.uid === user.uid ? bootHint : null;
    if (hint && !isAuthReady) {
      currentProfile = {
        ...createDefaultProfile(user, hint.profile?.handle),
        ...hint.profile,
        uid: user.uid,
      };
      isAuthReady = true;
      resolveAuthReadyWaiters();
      emitAuth();
      fetchOrCreateProfile(user)
        .then((fresh) => {
          if (epoch !== authEpoch || !fresh) return;
          currentProfile = fresh;
          emitProfile();
        })
        .catch((e) =>
          console.warn("[Firebase] Background profile refresh failed:", e),
        );
      return;
    }

    let profile = null;
    try {
      profile = await fetchOrCreateProfile(user);
    } catch (e) {
      console.error("[Firebase] Initial profile load error:", e);
      profile = currentProfile;
    }
    if (epoch !== authEpoch) return;
    currentProfile = profile;
    isAuthReady = true;
    resolveAuthReadyWaiters();
    emitAuth();
  });
} else {
  isAuthReady = true;
  resolveAuthReadyWaiters();
}

export const getCurrentUser = () => currentUser;
export const getCurrentProfile = () => currentProfile;
export const isUserLoggedIn = () => Boolean(currentUser);
export const isAuthInitialized = () => isAuthReady;

function requireSession() {
  if (!currentUser || !db) return null;
  if (currentProfile && currentProfile._unsynced) {
    console.warn(
      "[Firebase] Profile is not synced with the cloud; write skipped.",
    );
    return null;
  }
  return doc(db, "users", currentUser.uid);
}

/**
 * Checks whether a normalized handle is free or owned by the current user.
 */
export async function checkHandleAvailability(handle) {
  const normalized = normalizeHandle(handle);
  if (!isValidHandleFormat(normalized)) {
    return { available: false, valid: false, normalized, ownerUid: null };
  }
  if (!db) {
    return { available: false, valid: true, normalized, ownerUid: null };
  }
  const snap = await getDoc(doc(db, "handles", normalized));
  if (!snap.exists()) {
    return { available: true, valid: true, normalized, ownerUid: null };
  }
  const ownerUid = snap.data()?.uid || null;
  return {
    available: Boolean(currentUser && ownerUid === currentUser.uid),
    valid: true,
    normalized,
    ownerUid,
  };
}

/**
 * Updates user-editable profile fields (`handle`, `displayName`, personal details, UI settings),
 * atomically swapping `handles/{oldHandle}` -> `handles/{newHandle}` and syncing public fields
 * to `leaderboard/{uid}` WITHOUT altering `last_match_at`.
 */
export async function updateUserProfile(partialData) {
  const userRef = requireSession();
  if (!userRef) return null;

  const patch = {};
  const input = partialData || {};
  let requestedHandle = null;

  if ("handle" in input) {
    const normalized = normalizeHandle(input.handle);
    if (!isValidHandleFormat(normalized)) {
      throw new Error(
        "Handle must be 3–20 lowercase letters, numbers, or underscores.",
      );
    }
    requestedHandle = normalized;
  }
  if ("displayName" in input) {
    const n = cleanText(input.displayName, LIMITS.NAME_MAX);
    if (n) patch.displayName = n;
  }
  for (const k of EDITABLE_TEXT_FIELDS) {
    if (k in input) patch[k] = cleanText(input[k], LIMITS.TEXT_MAX);
  }
  if (input.settings && typeof input.settings === "object") {
    const s = {};
    for (const [k, v] of Object.entries(input.settings)) {
      if (
        typeof v === "boolean" ||
        (typeof v === "number" && Number.isFinite(v))
      )
        s[k] = v;
      else if (typeof v === "string" && v.length <= 40) s[k] = v;
    }
    patch.settings = s;
  }

  const rejected = Object.keys(input).filter(
    (k) =>
      !(k in patch) &&
      k !== "handle" &&
      k !== "displayName" &&
      !EDITABLE_TEXT_FIELDS.includes(k) &&
      k !== "settings",
  );
  if (rejected.length)
    console.warn(
      "[Firebase] Ignored non-editable profile fields:",
      rejected.join(", "),
    );
  if (!Object.keys(patch).length && !requestedHandle) return currentProfile;

  const leaderboardRef = doc(db, "leaderboard", currentUser.uid);

  try {
    const updatedMerged = await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) throw new Error("Profile document missing");
      const existing = snap.data();
      const lbSnap = await tx.get(leaderboardRef);

      const oldHandle = isValidHandleFormat(existing.handle)
        ? existing.handle
        : null;
      let oldHandleSnap = null;
      let newHandleSnap = null;

      if (requestedHandle && requestedHandle !== oldHandle) {
        newHandleSnap = await tx.get(doc(db, "handles", requestedHandle));
        if (oldHandle) {
          oldHandleSnap = await tx.get(doc(db, "handles", oldHandle));
        }
        if (
          newHandleSnap.exists() &&
          newHandleSnap.data()?.uid !== currentUser.uid
        ) {
          throw new Error(
            `HANDLE_TAKEN: @${requestedHandle} is already taken by another competitor.`,
          );
        }
      }

      const finalPatch = { ...patch };
      if (!isValidHandleFormat(existing.handle) && !requestedHandle) {
        throw new Error("Profile handle missing.");
      }
      if (requestedHandle && requestedHandle !== oldHandle) {
        finalPatch.handle = requestedHandle;
        if (
          oldHandle &&
          oldHandleSnap?.exists() &&
          oldHandleSnap.data()?.uid === currentUser.uid
        ) {
          tx.delete(doc(db, "handles", oldHandle));
        }
        if (!newHandleSnap?.exists()) {
          tx.set(doc(db, "handles", requestedHandle), {
            uid: currentUser.uid,
            handle: requestedHandle,
            createdAt: serverTimestamp(),
          });
        }
      }
      if (!Array.isArray(existing.friends)) {
        finalPatch.friends = [];
      }

      tx.update(userRef, { ...finalPatch, updatedAt: serverTimestamp() });

      const nextFullProfile = {
        ...existing,
        ...finalPatch,
        uid: currentUser.uid,
      };
      const shouldSyncPublic =
        !lbSnap.exists() ||
        "handle" in finalPatch ||
        "displayName" in finalPatch ||
        "country" in finalPatch ||
        "organization" in finalPatch;

      if (shouldSyncPublic) {
        if (!lbSnap.exists()) {
          tx.set(
            leaderboardRef,
            buildPublicLeaderboardPayload(nextFullProfile, 0),
            { merge: true },
          );
        } else {
          // Do NOT overwrite last_match_at on profile settings updates
          tx.set(
            leaderboardRef,
            {
              uid: currentUser.uid,
              handle: nextFullProfile.handle,
              displayName:
                cleanText(
                  nextFullProfile.displayName || "Contender",
                  LIMITS.NAME_MAX,
                ) || "Contender",
              photoURL: safePhotoURL(nextFullProfile.photoURL),
              country: cleanText(
                nextFullProfile.country || "None",
                LIMITS.TEXT_MAX,
              ),
              organization: cleanText(
                nextFullProfile.organization || "None",
                LIMITS.TEXT_MAX,
              ),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        }
      }

      return nextFullProfile;
    });

    currentProfile = { ...currentProfile, ...updatedMerged };
    writeSessionHint(currentUser, currentProfile);
    emitProfile();
    return currentProfile;
  } catch (err) {
    if (String(err?.message || "").startsWith("HANDLE_TAKEN:")) {
      throw err;
    }
    handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
  }
}

/**
 * Applies a negative ELO adjustment (disciplinary penalty / restart fee). Positive ELO can only
 * be earned through recordMatchToFirestore(). Runs against the server copy in a transaction.
 */
export async function applyEloPenalty(points) {
  const userRef = requireSession();
  const pts = clamp(Math.round(num(points)), 0, LIMITS.MAX_ELO_STEP);
  if (!userRef || pts === 0) return currentProfile;

  try {
    const next = await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) throw new Error("Profile document missing");
      const d = snap.data();
      const elo = Math.max(0, num(d.elo, LIMITS.BASE_ELO) - pts);
      tx.update(userRef, { elo, updatedAt: serverTimestamp() });
      return { elo, profile: { ...d, elo } };
    });
    currentProfile = { ...currentProfile, elo: next.elo };
    try {
      await setDoc(
        doc(db, "leaderboard", currentUser.uid),
        buildPublicLeaderboardPayload(currentProfile),
        { merge: true },
      );
    } catch (lbErr) {
      console.warn("[Firebase] Leaderboard sync after penalty failed:", lbErr);
    }
    emitProfile();
    return currentProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
  }
}

/**
 * Commit a completed rated match. Idempotent per `matchData.matchId`.
 * Upserts public summary and `last_match_at: Date.now()` into `leaderboard/{uid}`.
 */
export async function recordMatchToFirestore(matchData) {
  const userRef = requireSession();
  if (!userRef) {
    console.warn(
      "[Firebase] Match saving denied: not signed in (or profile unsynced).",
    );
    return null;
  }

  const totalQuestions = clamp(
    Math.round(num(matchData.totalQuestions, 10)),
    1,
    LIMITS.MAX_SOLVED_STEP,
  );
  const eloDelta = clamp(
    Math.round(num(matchData.eloDelta)),
    -LIMITS.MAX_ELO_STEP,
    LIMITS.MAX_ELO_STEP,
  );
  const correctCount = clamp(
    Math.round(num(matchData.correctCount)),
    0,
    totalQuestions,
  );
  const firstAttemptClears = clamp(
    Math.round(num(matchData.firstAttemptClears)),
    0,
    totalQuestions,
  );
  const score = clamp(num(matchData.score), 0, LIMITS.MAX_SCORE);
  const matchId = String(
    matchData.matchId ||
      `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  ).slice(0, 64);
  const lifelinesUsed = num(matchData.lifelinesUsedCount, 0);

  try {
    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) throw new Error("Profile document missing");
      const d = snap.data();
      const logs = Array.isArray(d.match_logs) ? d.match_logs : [];

      if (logs.some((l) => String(l.id) === matchId)) {
        return { duplicate: true, data: d };
      }

      const prevElo = num(d.elo, LIMITS.BASE_ELO);
      const newElo = clamp(prevElo + eloDelta, 0, LIMITS.MAX_ELO);
      const appliedDelta = newElo - prevElo;
      const peak = clamp(
        Math.max(newElo, num(d.peak_elo, LIMITS.BASE_ELO)),
        0,
        LIMITS.MAX_ELO,
      );

      let streak = num(d.current_win_streak);
      let best = num(d.best_streak);
      let grand = num(d.grand_master_count);
      const flawless =
        firstAttemptClears === totalQuestions ||
        (correctCount === totalQuestions && score >= 90);
      if (flawless) {
        streak += 1;
        best = Math.max(best, streak);
        if (lifelinesUsed === 0) grand += 1;
      } else if (score < 50 || eloDelta < 0) {
        streak = 0;
      }

      const entry = {
        id: matchId,
        tier: cleanText(matchData.tier || "Rated Arena", LIMITS.TEXT_MAX),
        accuracy: clamp(num(matchData.accuracy, 100), 0, 100),
        firstAttemptClears,
        totalQuestions,
        time: clamp(num(matchData.time, 30), 0, 86400),
        score,
        eloDelta: appliedDelta,
        prevElo,
        newElo,
        date: new Date().toISOString().replace("T", " ").slice(0, 16),
      };

      const updates = {
        elo: newElo,
        peak_elo: peak,
        total_solved: num(d.total_solved) + correctCount,
        total_matches: num(d.total_matches) + 1,
        current_win_streak: streak,
        best_streak: best,
        high_score: Math.max(num(d.high_score), score),
        grand_master_count: grand,
        match_logs: [entry, ...logs].slice(0, LIMITS.MAX_LOGS),
        updatedAt: serverTimestamp(),
      };
      tx.update(userRef, updates);
      const merged = { ...d, ...updates, uid: currentUser.uid };
      // Public card committed in the SAME transaction => one network round trip, atomic with the ledger.
      tx.set(
        doc(db, "leaderboard", currentUser.uid),
        buildPublicLeaderboardPayload(merged, Date.now()),
        { merge: true },
      );
      return { duplicate: false, data: { ...d, ...updates } };
    });

    currentProfile = {
      ...currentProfile,
      ...result.data,
      updatedAt: new Date().toISOString(),
    };

    writeSessionHint(currentUser, currentProfile);
    emitProfile();
    return currentProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
  }
}

/** Re-read the profile from the server (e.g. after returning to a stale tab). */
export async function refreshProfile() {
  if (!currentUser || !db) return null;
  const path = `users/${currentUser.uid}`;
  try {
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    if (snap.exists()) {
      currentProfile = {
        ...createDefaultProfile(currentUser),
        ...snap.data(),
        uid: currentUser.uid,
      };
      emitProfile();
    }
  } catch (e) {
    if (
      e?.code === "permission-denied" ||
      String(e?.message || "").includes("Missing or insufficient permissions")
    ) {
      handleFirestoreError(e, OperationType.GET, path);
    }
    console.warn("[Firebase] refreshProfile failed:", e);
  }
  return currentProfile;
}

// ---------------------------------------------------------------------------------------
// V3.4 Public Leaderboard, Handle Lookup, Search & Friends API
// ---------------------------------------------------------------------------------------

/**
 * Fetches a competitor's public profile from `leaderboard` where `handle == normalizedHandle`.
 */
export async function getPublicProfileByHandle(handle) {
  if (!db) return null;
  const normalized = normalizeHandle(handle);
  if (!isValidHandleFormat(normalized)) return null;

  try {
    const q = query(
      collection(db, "leaderboard"),
      where("handle", "==", normalized),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data();
  } catch (err) {
    if (
      err?.code === "permission-denied" ||
      String(err?.message || "").includes("Missing or insufficient permissions")
    ) {
      handleFirestoreError(err, OperationType.LIST, "leaderboard");
    }
    console.warn("[Firebase] getPublicProfileByHandle failed:", err);
    return null;
  }
}

/**
 * Queries `leaderboard` for matching competitor handles or display names.
 */
export async function searchCompetitorsByPrefix(queryText) {
  if (!db) return [];
  const raw = cleanText(queryText, LIMITS.NAME_MAX).replace(/^@+/, "");
  if (!raw) return [];

  const handlePrefix = raw.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const resultsMap = new Map();

  try {
    const queries = [];
    if (handlePrefix) {
      queries.push(
        getDocs(
          query(
            collection(db, "leaderboard"),
            where("handle", ">=", handlePrefix),
            where("handle", "<=", `${handlePrefix}\uf8ff`),
            orderBy("handle"),
            limit(15),
          ),
        ),
      );
    }
    queries.push(
      getDocs(
        query(
          collection(db, "leaderboard"),
          where("displayName", ">=", raw),
          where("displayName", "<=", `${raw}\uf8ff`),
          orderBy("displayName"),
          limit(15),
        ),
      ),
    );

    const snaps = await Promise.allSettled(queries);
    for (const res of snaps) {
      if (res.status === "fulfilled") {
        res.value.docs.forEach((d) => {
          const data = d.data();
          if (data?.uid) resultsMap.set(data.uid, data);
        });
      }
    }

    return Array.from(resultsMap.values())
      .sort((a, b) => num(b.elo) - num(a.elo))
      .slice(0, 15);
  } catch (err) {
    if (
      err?.code === "permission-denied" ||
      String(err?.message || "").includes("Missing or insufficient permissions")
    ) {
      handleFirestoreError(err, OperationType.LIST, "leaderboard");
    }
    console.warn("[Firebase] searchCompetitorsByPrefix failed:", err);
    return [];
  }
}

/**
 * Toggles friendship status for `targetUid` inside `users/{currentUser.uid}.friends`
 * using Firestore `arrayUnion` / `arrayRemove`. Returns the new boolean `isFriend`.
 */
export async function toggleFriendStatus(targetUid) {
  const userRef = requireSession();
  if (!userRef) {
    throw new Error("Authentication required to manage friends.");
  }
  const cleanTarget = String(targetUid || "").trim();
  if (!cleanTarget || cleanTarget === currentUser.uid) {
    throw new Error("Invalid friend target.");
  }

  try {
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : currentProfile || {};
    const currentFriends = Array.isArray(data.friends) ? data.friends : [];
    const alreadyFriend = currentFriends.includes(cleanTarget);

    await updateDoc(userRef, {
      friends: alreadyFriend
        ? arrayRemove(cleanTarget)
        : arrayUnion(cleanTarget),
      updatedAt: serverTimestamp(),
    });

    const nextFriends = alreadyFriend
      ? currentFriends.filter((id) => id !== cleanTarget)
      : [...currentFriends, cleanTarget];

    currentProfile = { ...currentProfile, friends: nextFriends };
    emitProfile();
    return !alreadyFriend;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
  }
}

/**
 * Sets up a real-time `onSnapshot` listener for the top 100 active competitors
 * (`last_match_at >= Date.now() - 30 days`, ordered by `elo` desc).
 * Falls back gracefully to single-field `orderBy('elo', 'desc')` if a composite index is still building.
 */
export function subscribeToActiveLeaderboard(onUpdateCallback) {
  if (!db || typeof onUpdateCallback !== "function") {
    return () => {};
  }

  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  const activeQuery = query(
    collection(db, "leaderboard"),
    where("last_match_at", ">=", cutoff),
    orderBy("elo", "desc"),
    limit(100),
  );

  let fallbackUnsub = null;
  const primaryUnsub = onSnapshot(
    activeQuery,
    (snapshot) => {
      const entries = snapshot.docs.map((d, index) => ({
        rank: index + 1,
        ...d.data(),
      }));
      onUpdateCallback(entries);
    },
    (error) => {
      if (
        error?.code === "permission-denied" ||
        String(error?.message || "").includes(
          "Missing or insufficient permissions",
        )
      ) {
        handleFirestoreError(error, OperationType.LIST, "leaderboard");
      }
      // If composite index is missing/building, fall back cleanly to single-field elo ordering + client cutoff filter.
      if (error?.code === "failed-precondition" && !fallbackUnsub) {
        console.warn(
          "[Firebase] Active leaderboard composite index missing; using ELO order fallback.",
          error.message,
        );
        const fallbackQuery = query(
          collection(db, "leaderboard"),
          orderBy("elo", "desc"),
          limit(200),
        );
        fallbackUnsub = onSnapshot(
          fallbackQuery,
          (fbSnap) => {
            const recentCutoff = Date.now() - ACTIVE_WINDOW_MS;
            const entries = fbSnap.docs
              .map((d) => d.data())
              .filter((item) => num(item.last_match_at, 0) >= recentCutoff)
              .slice(0, 100)
              .map((item, idx) => ({ rank: idx + 1, ...item }));
            onUpdateCallback(entries);
          },
          (fbErr) => {
            if (fbErr?.code === "permission-denied") {
              handleFirestoreError(fbErr, OperationType.LIST, "leaderboard");
            }
          },
        );
      } else {
        console.warn("[Firebase] subscribeToActiveLeaderboard error:", error);
      }
    },
  );

  return () => {
    try {
      primaryUnsub();
    } catch (e) {}
    if (fallbackUnsub) {
      try {
        fallbackUnsub();
      } catch (e) {}
    }
  };
}

/**
 * Computes exact global rank (`higherCount + 1`) via Firestore `getCountFromServer()`
 * if active within the last 30 days, or returns `null` if inactive.
 */
export async function getUserExactGlobalRank(userElo, lastMatchAt) {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  const ts = num(lastMatchAt, 0);
  if (!ts || ts < cutoff) {
    return null;
  }
  if (!db) return null;

  const elo = num(userElo, LIMITS.BASE_ELO);

  try {
    const rankQuery = query(
      collection(db, "leaderboard"),
      where("last_match_at", ">=", cutoff),
      where("elo", ">", elo),
    );
    const aggSnap = await getCountFromServer(rankQuery);
    return Number(aggSnap.data().count || 0) + 1;
  } catch (err) {
    if (
      err?.code === "permission-denied" ||
      String(err?.message || "").includes("Missing or insufficient permissions")
    ) {
      handleFirestoreError(err, OperationType.GET, "leaderboard");
    }
    if (err?.code === "failed-precondition") {
      try {
        const fbQuery = query(
          collection(db, "leaderboard"),
          where("elo", ">", elo),
        );
        const fbSnap = await getDocs(fbQuery);
        const activeHigher = fbSnap.docs.filter(
          (d) => num(d.data()?.last_match_at, 0) >= cutoff,
        ).length;
        return activeHigher + 1;
      } catch (e2) {
        console.warn("[Firebase] getUserExactGlobalRank fallback error:", e2);
      }
    } else {
      console.warn("[Firebase] getUserExactGlobalRank failed:", err);
    }
    return null;
  }
}
