import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { triggerNotificationEvent } from '../lib/notifications/client';
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
  const lastWelcomeNotificationUserIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!user?.id || !user.email) {
      return;
    }

    if (lastWelcomeNotificationUserIdRef.current === user.id) {
      return;
    }

    lastWelcomeNotificationUserIdRef.current = user.id;

    void triggerNotificationEvent({
      type: 'welcome_email',
      payload: {
        full_name:
          typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : '',
      },
    }).catch((error) => {
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('Failed to trigger welcome notification:', error);
      }
    });
  }, [user]);

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
