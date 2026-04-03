import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { AdminUserRecord } from '../src/types/admin.js';

export const config = {
  maxDuration: 30,
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ApiResponse;
  send: (body: string) => void;
}

interface ProfileRecord {
  id: string;
  full_name: string | null;
  role: 'user' | 'admin' | null;
  pro_waitlist_joined_at: string | null;
}

interface SubscriptionRecord {
  user_id: string;
  plan_tier: string | null;
}

interface UsageRecord {
  user_id: string;
  ai_credits_used: number | null;
  last_reset_at: string | null;
}

let supabaseServiceClientPromise: Promise<SupabaseClient> | null = null;

const sendJson = (res: ApiResponse, status: number, payload: Record<string, unknown>) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(JSON.stringify(payload));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toIsoDate = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().split('T')[0];
};

const getSupabaseServerConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new HttpError(
      500,
      'Admin API is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return { url, serviceRoleKey };
};

const getSupabaseServiceClient = async (): Promise<SupabaseClient> => {
  if (!supabaseServiceClientPromise) {
    supabaseServiceClientPromise = (async () => {
      const { url, serviceRoleKey } = getSupabaseServerConfig();

      return createClient(url, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    })();
  }

  return supabaseServiceClientPromise;
};

const getBearerToken = (authorizationHeader: string | string[] | undefined) => {
  if (!authorizationHeader) return null;

  const authorization = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;
  const [scheme, token] = String(authorization).trim().split(/\s+/, 2);

  if (!/^Bearer$/i.test(scheme) || !token) return null;
  return token;
};

const authenticateAdminRequest = async (req: ApiRequest): Promise<SupabaseClient> => {
  const accessToken = getBearerToken(req.headers.authorization);
  if (!accessToken) {
    throw new HttpError(401, 'Authentication required. Please sign in again.');
  }

  const supabase = await getSupabaseServiceClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    throw new HttpError(401, 'Invalid or expired session. Please sign in again.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new HttpError(500, 'Failed to verify admin role.');
  }

  if (!isRecord(profile) || profile.role !== 'admin') {
    throw new HttpError(403, 'Admin access required.');
  }

  return supabase;
};

const listAllAuthUsers = async (supabase: SupabaseClient): Promise<User[]> => {
  const users: User[] = [];
  const perPage = 200;

  for (let page = 1; page <= 25; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const currentPageUsers = data.users ?? [];
    users.push(...currentPageUsers);

    if (currentPageUsers.length < perPage) {
      break;
    }
  }

  return users;
};

const getMetadataFullName = (user: User): string => {
  const metadata = user.user_metadata;

  if (!isRecord(metadata)) {
    return '';
  }

  return typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
};

const buildAdminUsers = async (supabase: SupabaseClient): Promise<AdminUserRecord[]> => {
  const authUsers = await listAllAuthUsers(supabase);
  const userIds = authUsers.map((user) => user.id);

  if (userIds.length === 0) {
    return [];
  }

  const [profilesResult, subscriptionsResult, usageResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, pro_waitlist_joined_at')
      .in('id', userIds),
    supabase
      .from('user_subscriptions')
      .select('user_id, plan_tier')
      .in('user_id', userIds),
    supabase
      .from('user_api_usage')
      .select('user_id, ai_credits_used, last_reset_at')
      .in('user_id', userIds),
  ]);

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  if (subscriptionsResult.error) {
    throw subscriptionsResult.error;
  }

  if (usageResult.error) {
    throw usageResult.error;
  }

  const profileMap = new Map(
    (profilesResult.data ?? []).map((record) => [record.id, record as ProfileRecord]),
  );
  const subscriptionMap = new Map(
    (subscriptionsResult.data ?? []).map((record) => [record.user_id, record as SubscriptionRecord]),
  );
  const usageMap = new Map(
    (usageResult.data ?? []).map((record) => [record.user_id, record as UsageRecord]),
  );

  const today = new Date().toISOString().split('T')[0];

  return authUsers
    .map((user) => {
      const profile = profileMap.get(user.id);
      const role = profile?.role === 'admin' ? 'admin' : 'user';
      const subscription = subscriptionMap.get(user.id);
      const usage = usageMap.get(user.id);
      const lastResetDate = toIsoDate(usage?.last_reset_at ?? null);
      const aiCreditsUsed =
        lastResetDate !== null && lastResetDate !== today ? 0 : usage?.ai_credits_used ?? 0;

      return {
        id: user.id,
        email: user.email ?? '',
        fullName: profile?.full_name?.trim() || getMetadataFullName(user),
        role,
        planTier:
          role === 'admin' || subscription?.plan_tier === 'pro' ? 'pro' : 'free',
        waitlistJoinedAt: profile?.pro_waitlist_joined_at ?? null,
        createdAt: user.created_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        aiCreditsUsed: Math.max(0, aiCreditsUsed),
      } satisfies AdminUserRecord;
    })
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    });
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' });
    return;
  }

  try {
    const supabase = await authenticateAdminRequest(req);
    const users = await buildAdminUsers(supabase);
    sendJson(res, 200, { users });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'ADMIN_USERS_REQUEST_FAILED',
        message: error.message,
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unexpected admin API error.';
    sendJson(res, 500, {
      error: 'ADMIN_USERS_REQUEST_FAILED',
      message,
    });
  }
}
