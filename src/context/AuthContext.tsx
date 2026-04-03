import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { triggerNotificationEvent } from '../lib/notifications/client';
import { parseAccountStatus } from '../schemas/integrations/profile';
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
  const suspensionHandledUserIdRef = useRef<string | null>(null);

  const forceSuspendSignOut = useCallback(async (reason = 'Your account has been suspended.') => {
    const { supabase } = await import('../lib/supabase');
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    toast.error(reason);
  }, []);

  const readAccountStatus = useCallback(async (userId: string) => {
    const { supabase } = await import('../lib/supabase');
    const { data, error } = await supabase
      .from('profiles')
      .select('account_status')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return parseAccountStatus(data);
  }, []);

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

        const nextUser = activeSession?.user ?? null;
        if (nextUser?.id) {
          const accountStatus = await readAccountStatus(nextUser.id);

          if (!mounted) return;

          if (accountStatus === 'suspended') {
            suspensionHandledUserIdRef.current = nextUser.id;
            await forceSuspendSignOut();
            return;
          }
        }

        setUser((currentUser) => {
          return areUsersEquivalent(currentUser, nextUser) ? currentUser : nextUser;
        });
        setLoading(false);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          void (async () => {
            const nextUser = nextSession?.user ?? null;
            if (nextUser?.id) {
              try {
                const accountStatus = await readAccountStatus(nextUser.id);

                if (accountStatus === 'suspended') {
                  if (suspensionHandledUserIdRef.current !== nextUser.id) {
                    suspensionHandledUserIdRef.current = nextUser.id;
                    await forceSuspendSignOut();
                  }
                  return;
                }
              } catch {
                // Fall through to normal auth handling if status lookup fails.
              }
            }

            setUser((currentUser) =>
              areUsersEquivalent(currentUser, nextUser) ? currentUser : nextUser,
            );
            setLoading(false);
          })();
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
  }, [forceSuspendSignOut, readAccountStatus]);

  useEffect(() => {
    if (!user?.id) {
      suspensionHandledUserIdRef.current = null;
      return;
    }

    let active = true;
    let intervalId: number | null = null;
    let removeFocusListener: (() => void) | null = null;
    let channel: { unsubscribe?: () => void } | null = null;

    const startWatchingAccountStatus = async () => {
      const { supabase } = await import('../lib/supabase');

      const handleSuspendedStatus = async () => {
        if (!active || suspensionHandledUserIdRef.current === user.id) {
          return;
        }

        suspensionHandledUserIdRef.current = user.id;
        await forceSuspendSignOut();
      };

      const checkCurrentStatus = async () => {
        try {
          const accountStatus = await readAccountStatus(user.id);
          if (accountStatus === 'suspended') {
            await handleSuspendedStatus();
          }
        } catch {
          // Ignore transient profile lookup failures here.
        }
      };

      await checkCurrentStatus();

      const focusListener = () => {
        void checkCurrentStatus();
      };
      window.addEventListener('focus', focusListener);
      removeFocusListener = () => window.removeEventListener('focus', focusListener);
      intervalId = window.setInterval(() => {
        void checkCurrentStatus();
      }, 15_000);

      channel = supabase
        .channel(`profile-status:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            const nextStatus = parseAccountStatus(payload.new);
            if (nextStatus === 'suspended') {
              void handleSuspendedStatus();
            }
          },
        )
        .subscribe();
    };

    void startWatchingAccountStatus();

    return () => {
      active = false;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      removeFocusListener?.();
      channel?.unsubscribe?.();
    };
  }, [forceSuspendSignOut, readAccountStatus, user]);

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
