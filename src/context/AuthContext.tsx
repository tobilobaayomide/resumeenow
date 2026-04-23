import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import {
  AUTH_SESSION_SYNCED_EVENT,
  clearServerAuthSession,
  clearTransientSupabaseSession,
  getServerAuthUser,
  syncActiveSupabaseSessionToServer,
} from '../lib/auth/serverSession';
import { triggerNotificationEvent } from '../lib/notifications/client';
import { fetchProfileRecord } from '../lib/queries/profile';
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

const isResetPasswordRoute = (): boolean =>
  typeof window !== 'undefined' && window.location.pathname === '/reset-password';

const syncUserState = (
  nextUser: User | null,
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  setUser((currentUser) =>
    areUsersEquivalent(currentUser, nextUser) ? currentUser : nextUser,
  );
  setLoading(false);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastWelcomeNotificationUserIdRef = useRef<string | null>(null);
  const suspensionHandledUserIdRef = useRef<string | null>(null);

  const clearSensitiveClientState = useCallback(async () => {
    const [{ clearBuilderStorage }, { clearAiResponseCaches }] = await Promise.all([
      import('../store/builderStore'),
      import('../lib/gemini'),
    ]);

    clearBuilderStorage();
    clearAiResponseCaches();
  }, []);

  const completeSignOut = useCallback(async () => {
    await clearServerAuthSession().catch(() => {
      // Still clear the transient local session if server cookie cleanup fails.
    });
    await clearTransientSupabaseSession().catch(() => {
      // Ignore transient session cleanup failures while signing out.
    });
    await clearSensitiveClientState();
    setUser(null);
    setLoading(false);
  }, [clearSensitiveClientState]);

  const forceSuspendSignOut = useCallback(async (reason = 'Your account has been suspended.') => {
    await completeSignOut();
    toast.error(reason);
  }, [completeSignOut]);

  const readAccountStatus = useCallback(async (userId: string) => {
    const profile = await fetchProfileRecord(userId);
    return parseAccountStatus(profile);
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        let nextUser = await getServerAuthUser();

        if (!mounted) return;

        if (!nextUser && !isResetPasswordRoute()) {
          try {
            nextUser = await syncActiveSupabaseSessionToServer();
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.toLowerCase().includes('suspended')
            ) {
              await forceSuspendSignOut();
              return;
            }
            nextUser = null;
          }
        }

        if (nextUser?.id) {
          syncUserState(nextUser, setUser, setLoading);

          try {
            const accountStatus = await readAccountStatus(nextUser.id);

            if (!mounted) return;

            if (accountStatus === 'suspended') {
              suspensionHandledUserIdRef.current = nextUser.id;
              await forceSuspendSignOut();
              return;
            }
          } catch {
            // A just-issued cookie session can race the first profile read in dev.
          }
        }

        syncUserState(nextUser, setUser, setLoading);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          void (async () => {
            if (isResetPasswordRoute() || !nextSession?.user) {
              return;
            }

            try {
              const serverUser = await syncActiveSupabaseSessionToServer();
              if (!serverUser?.id) {
                return;
              }

              syncUserState(serverUser, setUser, setLoading);

              try {
                const accountStatus = await readAccountStatus(serverUser.id);
                if (accountStatus === 'suspended') {
                  if (suspensionHandledUserIdRef.current !== serverUser.id) {
                    suspensionHandledUserIdRef.current = serverUser.id;
                    await forceSuspendSignOut();
                  }
                  return;
                }
              } catch {
                // Ignore transient post-login profile fetch failures.
              }
            } catch (error) {
              if (
                error instanceof Error &&
                error.message.toLowerCase().includes('suspended')
              ) {
                await forceSuspendSignOut();
              }
            }
          })();
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch (error) {
        if (mounted) {
          if (
            error instanceof Error &&
            error.message.toLowerCase().includes('suspended')
          ) {
            await forceSuspendSignOut();
            return;
          }
          setLoading(false);
        }
      }
    };

    void initializeAuth();

    const handleServerSessionSynced = (event: Event) => {
      const syncedUser =
        event instanceof CustomEvent &&
        typeof event.detail === 'object' &&
        event.detail !== null &&
        'user' in event.detail
          ? ((event.detail as { user?: User | null }).user ?? null)
          : null;

      if (!syncedUser) {
        void initializeAuth();
        return;
      }

      syncUserState(syncedUser, setUser, setLoading);
      void (async () => {
        try {
          const accountStatus = await readAccountStatus(syncedUser.id);
          if (accountStatus === 'suspended') {
            suspensionHandledUserIdRef.current = syncedUser.id;
            await forceSuspendSignOut();
          }
        } catch {
          // Ignore transient post-login profile fetch failures.
        }
      })();
    };
    window.addEventListener(AUTH_SESSION_SYNCED_EVENT, handleServerSessionSynced);

    return () => {
      mounted = false;
      unsubscribe?.();
      window.removeEventListener(AUTH_SESSION_SYNCED_EVENT, handleServerSessionSynced);
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

    const startWatchingAccountStatus = async () => {
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
    };

    void startWatchingAccountStatus();

    return () => {
      active = false;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      removeFocusListener?.();
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
    await completeSignOut();
  }, [completeSignOut]);

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
