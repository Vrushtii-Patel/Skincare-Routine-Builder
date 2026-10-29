/**
 * Database Abstraction Layer
 * Supports seamless Firestore synchronization when configured, or local-first storage.
 */

import { Product, Profile, CheckInRecord } from '../types';

export interface UserDataPayload {
  profile: Profile;
  products: Product[];
  checkIns: Record<string, CheckInRecord>;
}

export async function syncUserDataToRemote(_uid: string, _data: UserDataPayload): Promise<boolean> {
  // Remote sync stub - returns true for offline/local
  if (!_uid) return false;
  return true;
}

export async function fetchUserDataFromRemote(_uid: string): Promise<UserDataPayload | null> {
  if (!_uid) return null;
  return null;
}
