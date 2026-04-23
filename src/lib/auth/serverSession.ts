import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

const AUTH_SESSION_ENDPOINT = '/api/auth-session';
export const AUTH_SESSION_SYNCED_EVENT = 'resumeenow:auth-session-synced';
let activeSessionSyncPromise: Promise<User | null> | null = null;

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.clone().json()) as {
      message?: string;
      error?: string;
    };

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }
  } catch {
    // Fall through to text parsing below.
  }

  const text = (await response.text()).trim();
  return text || 'Authentication failed.';
};

const parseServerUser = (payload: unknown): User | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const user = (payload as { user?: unknown }).user;
  if (typeof user !== 'object' || user === null) {
    return null;
  }

  return user as User;
};

const emitAuthSessionSynced = (user: User | null) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(AUTH_SESSION_SYNCED_EVENT, {
        detail: { user },
      }),
    );
  }
};

export const getServerAuthUser = async (): Promise<User | null> => {
  const response = await fetch(AUTH_SESSION_ENDPOINT, {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return parseServerUser((await response.json()) as unknown);
};

export const clearTransientSupabaseSession = async (): Promise<void> => {
  const authClient = supabase.auth as unknown as {
    _removeSession?: () => Promise<void>;
  };

  if (typeof authClient._removeSession === 'function') {
    await authClient._removeSession();
  }
};

export const syncActiveSupabaseSessionToServer = async (): Promise<User | null> => {
  if (!activeSessionSyncPromise) {
    activeSessionSyncPromise = (async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!session?.access_token || !session.refresh_token) {
        return null;
      }

      const response = await fetch(AUTH_SESSION_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const user = parseServerUser((await response.json()) as unknown);
      emitAuthSessionSynced(user);
      return user;
    })();
  }

  try {
    return await activeSessionSyncPromise;
  } finally {
    activeSessionSyncPromise = null;
  }
};

export const clearServerAuthSession = async (): Promise<void> => {
  const response = await fetch(AUTH_SESSION_ENDPOINT, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(await readErrorMessage(response));
  }
};
