import type { PlanStatus, PlanTier } from '../../types/context/index.js';

const FREE_DAILY_CREDIT_LIMIT = 5;
const PRO_DAILY_CREDIT_LIMIT = 100;

export interface PlanSnapshot {
  tier: PlanTier;
  usedCredits: number;
  dynamicFreeLimit: number;
}

export interface ResolvePlanStateArgs {
  userId: string | null | undefined;
  snapshot?: PlanSnapshot;
  isPending: boolean;
  isError: boolean;
}

export interface ResolvedPlanState {
  planStatus: PlanStatus;
  snapshot: PlanSnapshot;
}

export const getDefaultPlanSnapshot = (): PlanSnapshot => ({
  tier: 'free',
  usedCredits: 0,
  dynamicFreeLimit: FREE_DAILY_CREDIT_LIMIT,
});

export const getPlanDailyCreditLimit = (snapshot: PlanSnapshot): number =>
  snapshot.tier === 'pro' ? PRO_DAILY_CREDIT_LIMIT : snapshot.dynamicFreeLimit;

export const resolvePlanState = ({
  userId,
  snapshot,
  isPending,
  isError,
}: ResolvePlanStateArgs): ResolvedPlanState => {
  const fallbackSnapshot = getDefaultPlanSnapshot();

  if (!userId) {
    return {
      planStatus: 'signed_out',
      snapshot: fallbackSnapshot,
    };
  }

  if (snapshot) {
    return {
      planStatus: 'ready',
      snapshot,
    };
  }

  if (isError) {
    return {
      planStatus: 'unavailable',
      snapshot: fallbackSnapshot,
    };
  }

  void isPending;
  return {
    planStatus: 'loading',
    snapshot: fallbackSnapshot,
  };
};
