import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface ApiRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ApiResponse;
  send: (body: string) => void;
}

let supabaseServiceClientPromise: Promise<SupabaseClient> | null = null;

export const sendJson = (
  res: ApiResponse,
  status: number,
  payload: unknown,
) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(JSON.stringify(payload));
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const toString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const hasAdminAccess = (role: unknown): boolean =>
  role === 'admin' || role === 'super_admin';

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

export const getSupabaseServiceClient = async (): Promise<SupabaseClient> => {
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

export const authenticateAdminRequest = async (
  req: ApiRequest,
): Promise<{
  supabase: SupabaseClient;
  user: User;
  role: 'admin' | 'super_admin';
}> => {
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
    .select('role, account_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new HttpError(500, 'Failed to verify admin role.');
  }

  if (!isRecord(profile) || !hasAdminAccess(profile.role)) {
    throw new HttpError(403, 'Admin access required.');
  }

  if (profile.account_status === 'suspended') {
    throw new HttpError(403, 'This admin account is suspended.');
  }

  return {
    supabase,
    user,
    role: profile.role === 'super_admin' ? 'super_admin' : 'admin',
  };
};

export const listAllAuthUsers = async (supabase: SupabaseClient): Promise<User[]> => {
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

export type AdminAuditStatus = 'success' | 'failed';

export interface AdminAuditLogInput {
  actorId: string;
  actorRole: 'admin' | 'super_admin';
  action: string;
  status: AdminAuditStatus;
  targetUserId?: string | null;
  details?: Record<string, unknown>;
}

export const writeAdminActionLog = async (
  supabase: SupabaseClient,
  input: AdminAuditLogInput,
): Promise<void> => {
  const { error } = await supabase.from('admin_action_logs').insert({
    actor_id: input.actorId,
    actor_role: input.actorRole,
    target_user_id: input.targetUserId ?? null,
    action: input.action,
    status: input.status,
    details: isRecord(input.details) ? input.details : {},
  });

  if (error) {
    throw error;
  }
};
