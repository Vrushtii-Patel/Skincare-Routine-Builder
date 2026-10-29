import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { subscribeToAuth } from '../services/auth';
import {
  fetchUserDataFromRemote,
  pushUserDataChanges,
  syncUserDataToRemote,
  type UserDataPayload,
} from '../services/db';

const DEBOUNCE_MS = 1000;

function pickData(state: ReturnType<typeof useStore.getState>): UserDataPayload {
  return { profile: state.profile, products: state.products, checkIns: state.checkIns };
}

/**
 * Mount once (in App). Keeps the Zustand store (source of truth in the UI)
 * and Firestore in sync:
 *  1. mirrors Firebase auth state into the store
 *  2. on sign-in: remote data wins; if the account is new, local data is uploaded
 *  3. afterwards: debounced push of only the changed items
 */
export function useCloudSync(): void {
  const uid = useStore((state) => state.user?.uid);

  // 1. Auth state -> store
  useEffect(() => {
    return subscribeToAuth((user) => useStore.getState().setUser(user));
  }, []);

  // 2 + 3. Initial reconcile, then live push
  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const remote = await fetchUserDataFromRemote(uid);
      if (cancelled) return;

      if (remote) {
        useStore.setState({
          profile: remote.profile,
          products: remote.products,
          checkIns: remote.checkIns,
        });
      } else {
        await syncUserDataToRemote(uid, pickData(useStore.getState()));
        if (cancelled) return;
      }

      let last = pickData(useStore.getState());

      unsubscribe = useStore.subscribe((state) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          const next = pickData(state);
          const lastProducts = new Map(last.products.map((p) => [p.id, p]));
          const nextIds = new Set(next.products.map((p) => p.id));

          const upsertCheckIns: UserDataPayload['checkIns'] = {};
          for (const [date, record] of Object.entries(next.checkIns)) {
            if (last.checkIns[date] !== record) upsertCheckIns[date] = record;
          }

          const changes = {
            profile: next.profile !== last.profile ? next.profile : undefined,
            upsertProducts: next.products.filter((p) => lastProducts.get(p.id) !== p),
            deleteProductIds: last.products.filter((p) => !nextIds.has(p.id)).map((p) => p.id),
            upsertCheckIns,
          };

          const hasChanges =
            changes.profile !== undefined ||
            changes.upsertProducts.length > 0 ||
            changes.deleteProductIds.length > 0 ||
            Object.keys(changes.upsertCheckIns).length > 0;
          if (!hasChanges) return;

          try {
            await pushUserDataChanges(uid, changes);
            last = next; // only advance after a successful write
          } catch (err) {
            console.error('Cloud sync failed, will retry on next change:', err);
          }
        }, DEBOUNCE_MS);
      });
    })().catch((err) => console.error('Initial cloud sync failed:', err));

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe?.();
    };
  }, [uid]);
}