import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AuthState = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

async function fetchIsAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);
    if (error) {
      console.warn('[auth] admin check error:', error.message);
      return false;
    }
    return Array.isArray(data) && data.length > 0;
  } catch (e) {
    console.warn('[auth] admin check exception:', e);
    return false;
  }
}

export function useAuth(): AuthState {
  const [user, setUser]       = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from storage
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const admin = await fetchIsAdmin();
        if (!cancelled) setIsAdmin(admin);
      }
      if (!cancelled) setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    // Only listen for SIGNED_OUT to clear state — no async work here
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && !cancelled) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error as Error };
      const u = data.user ?? null;
      setUser(u);
      if (u) {
        const admin = await fetchIsAdmin();
        setIsAdmin(admin);
      }
      return { error: null };
    } catch (e: any) {
      return { error: e };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
    await supabase.auth.signOut();
  };

  return { user, isAdmin, loading, signIn, signOut };
}
