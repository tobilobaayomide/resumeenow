import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import UpgradeModal from '../components/ui/UpgradeModal';
import { getErrorMessage } from '../lib/errors';
import { triggerNotificationEvent } from '../lib/notifications/client';
import { getProfileQueryKey } from '../lib/queries/profile';
import {
  fetchPlanSnapshot,
  getPlanDailyCreditLimit,
  getPlanSnapshotQueryKey,
  resolvePlanState,
} from '../lib/queries/plan';
import {
  fetchProWaitlistStatus,
  getProWaitlistQueryKey,
  joinProWaitlist,
  PRO_WAITLIST_QUERY_STALE_TIME,
} from '../lib/queries/proWaitlist';
import { PlanContext, type PlanTier, type ProFeature } from './plan-context';
import { useAuth } from './useAuth';
import { useCurrentUserRole } from '../hooks/useCurrentUserRole';

const showToast = (type: 'success' | 'error' | 'info', message: string): void => {
    void import('sonner')
    .then(({ toast }) => {
      toast[type](message);
    })
    .catch((error) => {
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('Failed to load toast library for showToast:', error);
      }
    });
};

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useCurrentUserRole();
  const queryClient = useQueryClient();

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeOwnerId, setUpgradeOwnerId] = useState<string | null>(null);
  const [pendingFeature, setPendingFeature] = useState<ProFeature | null>(null);
  const triggeredAiAlertKeysRef = useRef<Set<string>>(new Set());

  const currentUserId = user?.id ?? null;
  const proWaitlistQueryKey = getProWaitlistQueryKey(currentUserId);
  const planSnapshotQuery = useQuery({
    queryKey: getPlanSnapshotQueryKey(currentUserId),
    queryFn: () => fetchPlanSnapshot(currentUserId),
    enabled: currentUserId !== null,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const { planStatus, snapshot: planSnapshot } = resolvePlanState({
    userId: currentUserId,
    snapshot: planSnapshotQuery.data,
    isPending: planSnapshotQuery.isPending,
    isError: planSnapshotQuery.isError,
  });
  const effectivePlanStatus =
    currentUserId === null
      ? planStatus
      : roleLoading
        ? 'loading'
        : isAdmin
          ? 'ready'
          : planStatus;
  const tier: PlanTier = isAdmin ? 'pro' : planSnapshot.tier;
  const usedCredits = planSnapshot.usedCredits;
  const isPlanLoading = effectivePlanStatus === 'loading';
  const isPlanUnavailable = effectivePlanStatus === 'unavailable';
  const isPro = tier === 'pro';
  const hasUnlimitedAccess = isAdmin;
  const proWaitlistQuery = useQuery({
    queryKey: proWaitlistQueryKey,
    queryFn: () => fetchProWaitlistStatus(currentUserId as string),
    enabled: currentUserId !== null && effectivePlanStatus === 'ready' && !isPro,
    staleTime: PRO_WAITLIST_QUERY_STALE_TIME,
    refetchOnWindowFocus: false,
  });
  const isProWaitlistJoined = !isPro && (proWaitlistQuery.data ?? false);
  const dailyCreditLimit = hasUnlimitedAccess
    ? Number.POSITIVE_INFINITY
    : getPlanDailyCreditLimit(planSnapshot);

  const hasAccess = (feature: ProFeature): boolean => {
    void feature;
    if (effectivePlanStatus !== 'ready') {
      return false;
    }

    if (hasUnlimitedAccess) {
      return true;
    }

    return usedCredits < dailyCreditLimit;
  };

  const openUpgrade = (feature?: ProFeature) => {
    setUpgradeOwnerId(currentUserId);
    setPendingFeature(feature ?? null);
    setUpgradeOpen(true);
  };

  const closeUpgrade = () => {
    setUpgradeOpen(false);
    setUpgradeOwnerId(null);
    setPendingFeature(null);
  };

  const retryPlan = async () => {
    if (currentUserId === null) {
      return;
    }

    await planSnapshotQuery.refetch();
  };

  const joinProWaitlistMutation = useMutation({
    mutationFn: async () => {
      if (currentUserId === null) {
        throw new Error('Login required.');
      }

      return joinProWaitlist(currentUserId);
    },
    onSuccess: ({ joinedAt, alreadyJoined }) => {
      if (currentUserId !== null) {
        queryClient.setQueryData(proWaitlistQueryKey, true);
        queryClient.setQueryData(getProfileQueryKey(currentUserId), (current) => {
          const nextRecord: Record<string, unknown> =
            typeof current === 'object' && current !== null
              ? { ...(current as Record<string, unknown>) }
              : { id: currentUserId };

          nextRecord.pro_waitlist_joined_at = joinedAt;
          return nextRecord;
        });
      }

      if (!alreadyJoined) {
        void triggerNotificationEvent({
          type: 'pro_waitlist_joined',
          payload: {
            joined_at: joinedAt,
          },
        }).catch((error) => {
          if (typeof console !== 'undefined' && typeof console.error === 'function') {
            console.error('Failed to trigger waitlist notification:', error);
          }
        });
      }

      closeUpgrade();
      showToast(
        'success',
        alreadyJoined
          ? 'You are already on the Pro waitlist.'
          : 'Waitlist joined! Pro billing is coming very soon.',
      );
    },
    onError: (error: unknown) => {
      showToast('error', getErrorMessage(error, 'Failed to join the Pro waitlist.'));
    },
  });

  const requestAccess = (feature: ProFeature): boolean => {
    if (!currentUserId) {
      void feature;
      showToast('error', 'Login required to use AI tools.');
      return false;
    }

    if (hasUnlimitedAccess) {
      return true;
    }

    if (effectivePlanStatus === 'loading') {
      void feature;
      showToast('info', 'Checking your plan. Try again in a moment.');
      return false;
    }

    if (effectivePlanStatus === 'unavailable') {
      void feature;
      void retryPlan();
      showToast('error', 'We could not verify your plan right now. Retrying now.');
      return false;
    }

    if (hasAccess(feature)) return true;

    if (isPro) {
      void feature;
      showToast('error', 'Daily AI limit reached. Try again after 00:00 UTC.');
      return false;
    }

    openUpgrade(feature);
    return false;
  };

  const consumeCredit = async () => {
    if (currentUserId === null) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: getPlanSnapshotQueryKey(currentUserId),
      exact: true,
    });
  };

  const upgradeToPro = () => {
    if (!user) {
      showToast('error', 'Login required.');
      return;
    }

    if (isProWaitlistJoined) {
      closeUpgrade();
      showToast('info', 'You are already on the Pro waitlist.');
      return;
    }

    void joinProWaitlistMutation.mutateAsync().catch(() => {
      // Error toast is handled by the mutation.
    });
  };

  const refreshCredits = async () => {
    if (currentUserId === null) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: getPlanSnapshotQueryKey(currentUserId),
      exact: true,
    });
  };

  useEffect(() => {
    if (
      !currentUserId ||
      effectivePlanStatus !== 'ready' ||
      hasUnlimitedAccess ||
      !Number.isFinite(dailyCreditLimit) ||
      dailyCreditLimit <= 0
    ) {
      return;
    }

    const utcDayKey = new Date().toISOString().split('T')[0];
    const utilization = usedCredits / dailyCreditLimit;
    const reachedFullLimit = usedCredits >= dailyCreditLimit;
    const reachedWarningLimit =
      usedCredits > 0 && utilization >= 0.8 && usedCredits < dailyCreditLimit;

    const threshold = reachedFullLimit ? 100 : reachedWarningLimit ? 80 : null;
    if (threshold === null) {
      return;
    }

    const alertKey = `${currentUserId}:${utcDayKey}:${threshold}`;
    if (triggeredAiAlertKeysRef.current.has(alertKey)) {
      return;
    }

    triggeredAiAlertKeysRef.current.add(alertKey);

    void triggerNotificationEvent({
      type: 'ai_usage_alert',
      payload: {
        used: usedCredits,
        limit: dailyCreditLimit,
        percent: Math.min(100, Math.round(utilization * 100)),
        threshold,
      },
    }).catch((error) => {
      triggeredAiAlertKeysRef.current.delete(alertKey);
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('Failed to trigger AI usage alert notification:', error);
      }
    });
  }, [currentUserId, dailyCreditLimit, effectivePlanStatus, hasUnlimitedAccess, usedCredits]);

  const value = {
    tier,
    planStatus: effectivePlanStatus,
    isPlanLoading,
    isPlanUnavailable,
    isPro,
    hasUnlimitedAccess,
    isProWaitlistJoined,
    isJoiningProWaitlist: joinProWaitlistMutation.isPending,
    dailyCreditLimit,
    usedCredits,
    hasAccess,
    requestAccess,
    consumeCredit,
    refreshCredits,
    retryPlan,
    openUpgrade,
    closeUpgrade,
    upgradeToPro,
  };
  const isUpgradeVisible = upgradeOpen && upgradeOwnerId === currentUserId;

  return (
    <PlanContext.Provider value={value}>
      {children}
      <UpgradeModal
        open={isUpgradeVisible}
        feature={pendingFeature}
        joined={isProWaitlistJoined}
        joining={joinProWaitlistMutation.isPending}
        onClose={closeUpgrade}
        onUpgrade={upgradeToPro}
      />
    </PlanContext.Provider>
  );
};
