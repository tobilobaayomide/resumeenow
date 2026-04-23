import {
  HttpError,
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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  try {
    const { supabase, user } = await authenticateUserRequest(req, res);
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
