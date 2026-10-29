import { useState } from 'react';
import { useStore } from '../store/useStore';
import { signInWithGoogleService, signOutService } from '../services/auth';

export function useAuth() {
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The store's user is set by onAuthStateChanged (see useCloudSync),
  // so these only trigger the Firebase calls.
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogleService();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOutService();
    } finally {
      setLoading(false);
    }
  };

  return { user, isAuthenticated: !!user, loading, error, loginWithGoogle, logout };
}