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

const PLAN_ENDPOINT = '/api/plan';

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
    // Fall through to text parsing.
  }

  const text = (await response.text()).trim();
  return text || 'Failed to load plan.';
};

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

  const response = await fetch(PLAN_ENDPOINT);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as {
    snapshot?: {
      tier?: unknown;
      usedCredits?: unknown;
      lastResetAt?: string | null;
    };
  };
  const lastResetDateStr = payload.snapshot?.lastResetAt ?? null;
  const lastResetDate = toIsoDate(lastResetDateStr);
  const today = new Date().toISOString().split('T')[0];
  const isNewDay = lastResetDate != null && lastResetDate !== today;

  return {
    tier: normalizePlanTier(payload.snapshot?.tier),
    usedCredits:
      isNewDay
        ? 0
        : typeof payload.snapshot?.usedCredits === 'number'
          ? payload.snapshot.usedCredits
          : 0,
    dynamicFreeLimit: getDefaultPlanSnapshot().dynamicFreeLimit,
  };
};
