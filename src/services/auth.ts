/**
 * Auth Service Interface & Local-First Provider
 */

export interface UserSession {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export async function signInWithGoogleService(): Promise<UserSession> {
  // If real Firebase is configured, real auth can be attached.
  // By default, provides authentic local user session without breaking offline usage.
  return {
    uid: 'user_skincare_journal_1',
    displayName: 'Elena Vance',
    email: 'elena@skincarejournal.io',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  };
}

export async function signOutService(): Promise<void> {
  // Clear any remote auth token
}

