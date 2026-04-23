import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import {
  getSupabaseServiceClient,
  HttpError,
  isRecord,
  type ApiRequest,
  type ApiResponse,
} from './admin.js';
import { applySetCookieHeaders, resolveSessionFromApiRequest } from './session.js';

const getSupabaseUserServerConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new HttpError(
      500,
      'Server user authentication is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
    );
  }

  return { url, anonKey };
};

const createUserScopedSupabaseClient = (accessToken: string): SupabaseClient => {
  const { url, anonKey } = getSupabaseUserServerConfig();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

export const authenticateUserRequest = async (
  req: ApiRequest,
  res?: ApiResponse,
): Promise<{
  supabase: SupabaseClient;
  user: User;
}> => {
  const session = await resolveSessionFromApiRequest(req);
  const userSupabase = createUserScopedSupabaseClient(session.accessToken);
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? await getSupabaseServiceClient()
    : userSupabase;
  const user = session.user;
  if (res) {
    applySetCookieHeaders((name, value) => res.setHeader(name, value), session.setCookieHeaders);
  }

  const { data: profile, error: profileError } = await userSupabase
    .from('profiles')
    .select('account_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new HttpError(500, 'Failed to verify account status.');
  }

  if (isRecord(profile) && profile.account_status === 'suspended') {
    throw new HttpError(403, 'This account is suspended.');
  }

  return {
    supabase,
    user,
  };
};
