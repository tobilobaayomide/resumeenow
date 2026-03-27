import { supabase } from '../supabase';
import type { PlanTier } from '../../types/context';
import { getDefaultPlanSnapshot, type PlanSnapshot } from './planState';

export {
  getDefaultPlanSnapshot,
  getPlanDailyCreditLimit,
  resolvePlanState,
  type PlanSnapshot,
  type ResolvedPlanState,
  type ResolvePlanStateArgs,
} from './planState';

export const getPlanSnapshotQueryKey = (userId: string | null | undefined) =>
  ['planSnapshot', userId ?? null] as const;

const normalizePlanTier = (value: unknown): PlanTier =>
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

export const fetchPlanSnapshot = async (userId: string | null): Promise<PlanSnapshot> => {
  if (!userId) {
    return getDefaultPlanSnapshot();
  }

  const [subscriptionResult, usageResult] = await Promise.all([
    supabase
      .from('user_subscriptions')
      .select('plan_tier')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('user_api_usage')
      .select('ai_credits_used, last_reset_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (subscriptionResult.error) {
    throw subscriptionResult.error;
  }

  if (usageResult.error) {
    throw usageResult.error;
  }

  const lastResetDateStr = usageResult.data?.last_reset_at ?? null;
  const lastResetDate = toIsoDate(lastResetDateStr);
  const today = new Date().toISOString().split('T')[0];
  const isNewDay = lastResetDate != null && lastResetDate !== today;

  return {
    tier: normalizePlanTier(subscriptionResult.data?.plan_tier),
    usedCredits: isNewDay ? 0 : (usageResult.data?.ai_credits_used ?? 0),
    dynamicFreeLimit: getDefaultPlanSnapshot().dynamicFreeLimit,
  };
};
