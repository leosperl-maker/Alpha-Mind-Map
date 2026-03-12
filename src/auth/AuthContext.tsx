import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase, isMockMode } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USER_KEY = 'alpha-mock-user';

// ── Mock helpers ─────────────────────────────────────────────────────────────

function mockGetUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(MOCK_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function mockSetUser(u: AuthUser | null) {
  if (u) localStorage.setItem(MOCK_USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(MOCK_USER_KEY);
}

// ── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockMode) {
      setUser(mockGetUser());
      setLoading(false);
      return;
    }

    // Real Supabase session
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          fullName: session.user.user_metadata?.full_name ?? session.user.email!.split('@')[0],
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          fullName: session.user.user_metadata?.full_name ?? session.user.email!.split('@')[0],
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (isMockMode) {
      const u: AuthUser = { id: `mock-${Date.now()}`, email, fullName };
      mockSetUser(u);
      setUser(u);
      return { error: null };
    }
    const { error } = await supabase!.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isMockMode) {
      // Accept any credentials in mock mode
      const existing = mockGetUser();
      const u: AuthUser = existing?.email === email
        ? existing
        : { id: `mock-${Date.now()}`, email, fullName: email.split('@')[0] };
      mockSetUser(u);
      setUser(u);
      return { error: null };
    }
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (isMockMode) {
      const u: AuthUser = { id: 'mock-google', email: 'demo@gmail.com', fullName: 'Demo User' };
      mockSetUser(u);
      setUser(u);
      return { error: null };
    }
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/Alpha-Mind-Map/dashboard' },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (isMockMode) {
      mockSetUser(null);
      setUser(null);
      return;
    }
    await supabase!.auth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<AuthUser>) => {
    if (!user) return { error: 'Not authenticated' };
    const updated = { ...user, ...data };
    if (isMockMode) {
      mockSetUser(updated);
      setUser(updated);
      return { error: null };
    }
    const { error } = await supabase!.auth.updateUser({
      data: { full_name: data.fullName, avatar_url: data.avatarUrl },
    });
    if (!error) setUser(updated);
    return { error: error?.message ?? null };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
