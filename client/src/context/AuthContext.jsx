import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { api, GOOGLE_LOGIN_URL } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const loginWithGoogle = () => {
    window.location.href = GOOGLE_LOGIN_URL;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // The session may already be gone; clearing local state is enough.
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}