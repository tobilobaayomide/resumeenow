import React, { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { AuthContext } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(activeSession);
        setUser(activeSession?.user ?? null);
        setLoading(false);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          setSession(nextSession);
          setUser(nextSession?.user ?? null);
          setLoading(false);
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const signOut = async () => {
    const { supabase } = await import('../lib/supabase');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
