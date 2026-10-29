import { useState } from 'react';
import { useStore } from '../store/useStore';
import { signInWithGoogleService, signOutService } from '../services/auth';

export function useAuth() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const authUser = await signInWithGoogleService();
      setUser(authUser);
    } catch (err) {
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOutService();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    loading,
    loginWithGoogle,
    logout,
  };
}

