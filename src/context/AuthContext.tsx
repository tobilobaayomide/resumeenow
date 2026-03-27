import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthContext } from './auth-context';

const areUsersEquivalent = (left: User | null, right: User | null): boolean => {
  if (left === right) return true;
  if (!left || !right) return left === right;

  return (
    left.id === right.id &&
    left.email === right.email &&
    JSON.stringify(left.user_metadata ?? null) === JSON.stringify(right.user_metadata ?? null)
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
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

        setUser((currentUser) => {
          const nextUser = activeSession?.user ?? null;
          return areUsersEquivalent(currentUser, nextUser) ? currentUser : nextUser;
        });
        setLoading(false);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          setUser((currentUser) => {
            const nextUser = nextSession?.user ?? null;
            return areUsersEquivalent(currentUser, nextUser) ? currentUser : nextUser;
          });
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

  const signOut = useCallback(async () => {
    const { supabase } = await import('../lib/supabase');
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, loading, signOut }),
    [loading, signOut, user],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
