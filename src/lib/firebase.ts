// Firebase initialization (LIVE).
// Config comes from .env (VITE_FIREBASE_*) — see .env and .env.example.

import {
  initializeApp,
  getApps,
  getApp as firebaseGetApp,
  type FirebaseApp,
} from 'firebase/app';
import { getAuth as firebaseGetAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import {
  getAnalytics,
  isSupported as analyticsSupported,
  type Analytics,
} from 'firebase/analytics';

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

/** True when enough env is present to talk to a real Firebase project. */
export const isFirebaseConfigured: boolean = Boolean(
  FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.appId &&
    FIREBASE_CONFIG.authDomain,
);

// Fallback identity used ONLY in mock mode (no Firebase configured).
export const MOCK_USER_ID = import.meta.env.VITE_MOCK_USER_ID || 'dev-user';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

export function getApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (!app) {
    app = getApps().length > 0 ? firebaseGetApp() : initializeApp(FIREBASE_CONFIG);
  }
  return app;
}

export function getDb(): Firestore | null {
  if (!isFirebaseConfigured) return null;
  if (!db) db = getFirestore(getApp()!);
  return db;
}

/** Throws if Firestore is not available — use inside FirestoreRepo. */
export function requireDb(): Firestore {
  const instance = getDb();
  if (!instance) {
    throw new Error('Firestore is not configured. Check VITE_FIREBASE_* in .env');
  }
  return instance;
}

export function getAuth(): Auth | null {
  if (!isFirebaseConfigured) return null;
  if (!auth) auth = firebaseGetAuth(getApp()!);
  return auth;
}

/** Throws if Auth is not available. */
export function requireAuth(): Auth {
  const instance = getAuth();
  if (!instance) {
    throw new Error('Firebase Auth is not configured. Check VITE_FIREBASE_* in .env');
  }
  return instance;
}

export async function getAnalyticsIfSupported(): Promise<Analytics | null> {
  if (!isFirebaseConfigured) return null;
  if (analytics) return analytics;
  try {
    if (await analyticsSupported()) {
      analytics = getAnalytics(getApp()!);
    }
  } catch {
    // Analytics is optional; never block the app.
  }
  return analytics;
}
