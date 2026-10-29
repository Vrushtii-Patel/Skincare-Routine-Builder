/**
 * Auth service: Google sign-in only.
 */

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebase } from './firebase';

export interface UserSession {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

function toSession(user: User): UserSession {
  return {
    uid: user.uid,
    displayName: user.displayName ?? 'Skincare friend',
    email: user.email ?? '',
    photoURL: user.photoURL ?? undefined,
  };
}

export async function signInWithGoogleService(): Promise<UserSession> {
  const fb = getFirebase();
  if (!fb) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* keys to .env.');
  }
  const credential = await signInWithPopup(fb.auth, new GoogleAuthProvider());
  return toSession(credential.user);
}

export async function signOutService(): Promise<void> {
  const fb = getFirebase();
  if (fb) await signOut(fb.auth);
}

/** Fires on page load (restored session) and on every sign-in / sign-out. */
export function subscribeToAuth(callback: (user: UserSession | null) => void): () => void {
  const fb = getFirebase();
  if (!fb) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(fb.auth, (user) => callback(user ? toSession(user) : null));
}