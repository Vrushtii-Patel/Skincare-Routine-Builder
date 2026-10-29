/**
 * Firebase initialisation.
 * Lazy and optional: if the VITE_FIREBASE_* keys are missing, getFirebase()
 * returns null and the app keeps working local-first.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

export function isFirebaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
}

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let cached: FirebaseServices | null = null;

function createDb(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, {
      // Offline cache so the app still works without a connection
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      // Optional fields (e.g. product.directions) can be undefined
      ignoreUndefinedProperties: true,
    });
  } catch {
    // Vite hot reload re-runs this module; Firestore is already initialised
    return getFirestore(app);
  }
}

export function getFirebase(): FirebaseServices | null {
  if (!isFirebaseConfigured()) return null;
  if (cached) return cached;

  const app = getApps().length
    ? getApp()
    : initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });

  cached = { app, auth: getAuth(app), db: createDb(app) };
  return cached;
}