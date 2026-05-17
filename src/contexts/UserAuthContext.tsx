'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface PublicUser {
  id: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

interface UserAuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextValue | null>(null);

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/user/session', { credentials: 'include' });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      await refreshSession();
      setIsLoading(false);
    })();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/user/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: data.error || 'Giriş yapılamadı.' };
    }
    await refreshSession();
    return {};
  }, [refreshSession]);

  const signup = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const res = await fetch('/api/user/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: data.error || 'Kayıt oluşturulamadı.' };
      }
      if (data.needsEmailConfirmation) {
        return { needsEmailConfirmation: true };
      }
      await refreshSession();
      return {};
    },
    [refreshSession]
  );

  const logout = useCallback(async () => {
    await fetch('/api/user/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, refreshSession, login, signup, logout }),
    [user, isLoading, refreshSession, login, signup, logout]
  );

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) {
    throw new Error('useUserAuth must be used within UserAuthProvider');
  }
  return ctx;
}
