/**
 * Firestore data layer.
 *
 * users/{uid}                  -> { profile, updatedAt }
 * users/{uid}/products/{id}    -> Product
 * users/{uid}/checkins/{date}  -> CheckInRecord   (date = YYYY-MM-DD)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { getFirebase } from './firebase';
import type { Product, Profile, CheckInRecord } from '../types';

export interface UserDataPayload {
  profile: Profile;
  products: Product[];
  checkIns: Record<string, CheckInRecord>;
}

// Firestore allows 500 writes per batch; stay well under
const BATCH_SIZE = 400;

type WriteOp = (batch: ReturnType<typeof writeBatch>) => void;

async function commitInChunks(db: Firestore, ops: WriteOp[]): Promise<void> {
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    ops.slice(i, i + BATCH_SIZE).forEach((op) => op(batch));
    await batch.commit();
  }
}

export async function fetchUserDataFromRemote(uid: string): Promise<UserDataPayload | null> {
  const fb = getFirebase();
  if (!fb || !uid) return null;

  const [userSnap, productsSnap, checkInsSnap] = await Promise.all([
    getDoc(doc(fb.db, 'users', uid)),
    getDocs(collection(fb.db, 'users', uid, 'products')),
    getDocs(collection(fb.db, 'users', uid, 'checkins')),
  ]);

  const profile = userSnap.data()?.profile as Profile | undefined;
  if (!profile) return null; // brand-new account, nothing saved yet

  const checkIns: Record<string, CheckInRecord> = {};
  checkInsSnap.forEach((d) => {
    checkIns[d.id] = d.data() as CheckInRecord;
  });

  return {
    profile,
    products: productsSnap.docs.map((d) => d.data() as Product),
    checkIns,
  };
}

/** Full upload. Used once, when a new account first signs in with local data. */
export async function syncUserDataToRemote(uid: string, data: UserDataPayload): Promise<boolean> {
  const fb = getFirebase();
  if (!fb || !uid) return false;

  const ops: WriteOp[] = [
    (b) => b.set(doc(fb.db, 'users', uid), { profile: data.profile, updatedAt: serverTimestamp() }),
    ...data.products.map<WriteOp>((p) => (b) => b.set(doc(fb.db, 'users', uid, 'products', p.id), p)),
    ...Object.entries(data.checkIns).map<WriteOp>(([date, c]) => (b) =>
      b.set(doc(fb.db, 'users', uid, 'checkins', date), c)
    ),
  ];
  await commitInChunks(fb.db, ops);
  return true;
}

export interface UserDataChanges {
  profile?: Profile;
  upsertProducts: Product[];
  deleteProductIds: string[];
  upsertCheckIns: Record<string, CheckInRecord>;
}

/** Incremental push of only what changed. */
export async function pushUserDataChanges(uid: string, changes: UserDataChanges): Promise<void> {
  const fb = getFirebase();
  if (!fb || !uid) return;

  const ops: WriteOp[] = [];
  if (changes.profile) {
    const profile = changes.profile;
    ops.push((b) =>
      b.set(doc(fb.db, 'users', uid), { profile, updatedAt: serverTimestamp() }, { merge: true })
    );
  }
  changes.upsertProducts.forEach((p) =>
    ops.push((b) => b.set(doc(fb.db, 'users', uid, 'products', p.id), p))
  );
  changes.deleteProductIds.forEach((id) =>
    ops.push((b) => b.delete(doc(fb.db, 'users', uid, 'products', id)))
  );
  Object.entries(changes.upsertCheckIns).forEach(([date, c]) =>
    ops.push((b) => b.set(doc(fb.db, 'users', uid, 'checkins', date), c))
  );

  await commitInChunks(fb.db, ops);
}