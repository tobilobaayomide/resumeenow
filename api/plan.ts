import {
  HttpError,
  isRecord,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './_lib/admin.js';
import { authenticateUserRequest } from './_lib/user.js';

export const config = {
  maxDuration: 30,
};

const normalizePlanTier = (value: unknown): 'free' | 'pro' =>
  value === 'pro' ? 'pro' : 'free';

const PRO_WAITLIST_JOINED_AT_FIELD = 'pro_waitlist_joined_at';

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

const getJoinedAtValue = (value: unknown): string | null => {
  if (!isRecord(value)) {
    return null;
  }

  const joinedAt = value[PRO_WAITLIST_JOINED_AT_FIELD];
  return typeof joinedAt === 'string' && joinedAt.trim() ? joinedAt : null;
};

const getView = (req: ApiRequest): 'snapshot' | 'waitlist' => {
  const host = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;
  const forwardedProto = Array.isArray(req.headers['x-forwarded-proto'])
    ? req.headers['x-forwarded-proto'][0]
    : req.headers['x-forwarded-proto'];
  const protocol = typeof forwardedProto === 'string' && forwardedProto
    ? forwardedProto
    : 'https';
  const url = new URL(req.url ?? '/api/plan', `${protocol}://${host ?? 'localhost'}`);
  return url.searchParams.get('view') === 'waitlist' ? 'waitlist' : 'snapshot';
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const view = getView(req);

  if (view === 'snapshot' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  if (view === 'waitlist' && req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  try {
    const { supabase, user } = await authenticateUserRequest(req, res);

    if (view === 'waitlist') {
      const { data: existingData, error: existingError } = await supabase
        .from('profiles')
        .select(PRO_WAITLIST_JOINED_AT_FIELD)
        .eq('id', user.id)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      const existingJoinedAt = getJoinedAtValue(existingData);

      if (req.method === 'GET') {
        sendJson(res, 200, {
          joined: existingJoinedAt !== null,
          joinedAt: existingJoinedAt,
        });
        return;
      }

      if (existingJoinedAt) {
        sendJson(res, 200, {
          joinedAt: existingJoinedAt,
          alreadyJoined: true,
        });
        return;
      }

      const joinedAt = new Date().toISOString();
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            [PRO_WAITLIST_JOINED_AT_FIELD]: joinedAt,
            updated_at: joinedAt,
          },
          {
            onConflict: 'id',
          },
        )
        .select(PRO_WAITLIST_JOINED_AT_FIELD)
        .single();

      if (error) {
        throw error;
      }

      const savedJoinedAt = getJoinedAtValue(data);
      if (!savedJoinedAt) {
        throw new HttpError(500, 'Failed to record your Pro waitlist entry.');
      }

      sendJson(res, 200, {
        joinedAt: savedJoinedAt,
        alreadyJoined: false,
      });
      return;
    }

    const [subscriptionResult, usageResult] = await Promise.all([
      supabase
        .from('user_subscriptions')
        .select('plan_tier')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('user_api_usage')
        .select('ai_credits_used, last_reset_at')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (subscriptionResult.error) {
      throw subscriptionResult.error;
    }

    if (usageResult.error) {
      throw usageResult.error;
    }

    const lastResetDate = toIsoDate(usageResult.data?.last_reset_at ?? null);
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = lastResetDate != null && lastResetDate !== today;

    sendJson(res, 200, {
      snapshot: {
        tier: normalizePlanTier(subscriptionResult.data?.plan_tier),
        usedCredits: isNewDay ? 0 : (usageResult.data?.ai_credits_used ?? 0),
        lastResetAt: usageResult.data?.last_reset_at ?? null,
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'PLAN_REQUEST_FAILED',
        message: error.message,
      });
      return;
    }

    sendJson(res, 500, {
      error: 'PLAN_REQUEST_FAILED',
      message: error instanceof Error ? error.message : 'Unexpected plan API error.',
    });
  }
}
