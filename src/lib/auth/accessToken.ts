import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

const refreshSessionOrThrow = async (missingTokenMessage: string): Promise<Session> => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    throw error;
  }

  if (!data.session?.access_token) {
    throw new Error(missingTokenMessage);
  }

  return data.session;
};

export const getValidAccessToken = async (
  missingTokenMessage = 'Please sign in again to continue.',
): Promise<string> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  let session = data.session;
  const expiresSoon =
    !session?.access_token ||
    (typeof session.expires_at === 'number' &&
      session.expires_at * 1000 <= Date.now() + ACCESS_TOKEN_REFRESH_BUFFER_MS);

  if (expiresSoon) {
    session = await refreshSessionOrThrow(missingTokenMessage);
  }

  if (!session?.access_token) {
    throw new Error(missingTokenMessage);
  }

  return session.access_token;
};
