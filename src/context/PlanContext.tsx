import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import UpgradeModal from '../components/ui/UpgradeModal';
import { PlanContext, type PlanTier, type ProFeature } from './plan-context';
import { useAuth } from './useAuth';

const FREE_DAILY_CREDIT_LIMIT = 5;
const PRO_CREDIT_LIMIT = 100;

const showToast = (type: 'success' | 'error', message: string): void => {
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
  
  const [tier, setTier] = useState<PlanTier>('free');
  const [usedCredits, setUsedCredits] = useState<number>(0);
  const [dynamicFreeLimit, setDynamicFreeLimit] = useState<number>(FREE_DAILY_CREDIT_LIMIT);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeOwnerId, setUpgradeOwnerId] = useState<string | null>(null);
  const [pendingFeature, setPendingFeature] = useState<ProFeature | null>(null);

  const currentUserId = user?.id ?? null;

  const fetchPlanSnapshot = useCallback(async (userId: string | null) => {
    if (!userId) {
      return {
        tier: 'free' as PlanTier,
        usedCredits: 0,
        dynamicFreeLimit: FREE_DAILY_CREDIT_LIMIT,
      };
    }

    try {
      const [subRes, usageRes] = await Promise.all([
        supabase.from('user_subscriptions').select('plan_tier').eq('user_id', userId).maybeSingle(),
        supabase.from('user_api_usage').select('ai_credits_used, last_reset_at').eq('user_id', userId).maybeSingle()
      ]);

      const lastResetDateStr = usageRes.data?.last_reset_at ?? null;
      const lastResetDate = lastResetDateStr
        ? new Date(lastResetDateStr).toISOString().split('T')[0]
        : null;
      const today = new Date().toISOString().split('T')[0];
      const isNewDay = lastResetDate && lastResetDateStr !== "" && lastResetDate !== today;

      const calculatedLimit = FREE_DAILY_CREDIT_LIMIT;
      const effectiveCredits = isNewDay ? 0 : (usageRes.data?.ai_credits_used ?? 0);

      return {
        tier: (subRes.data?.plan_tier as PlanTier | undefined) ?? 'free',
        usedCredits: effectiveCredits,
        dynamicFreeLimit: calculatedLimit,
      };
    } catch (error) {
      console.error('Failed to fetch plan data:', error);
      return null;
    }
  }, []);

  const applyPlanSnapshot = useCallback((snapshot: {
    tier: PlanTier;
    usedCredits: number;
    dynamicFreeLimit: number;
  }) => {
    setTier(snapshot.tier);
    setUsedCredits(snapshot.usedCredits);
    setDynamicFreeLimit(snapshot.dynamicFreeLimit);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchPlanSnapshot(currentUserId).then((snapshot) => {
      if (cancelled || !snapshot) return;
      applyPlanSnapshot(snapshot);
    });

    return () => { cancelled = true; };
  }, [applyPlanSnapshot, currentUserId, fetchPlanSnapshot]);

  const isPro = tier === 'pro';
  const monthlyCredits = isPro ? PRO_CREDIT_LIMIT : dynamicFreeLimit;

  const hasAccess = (feature: ProFeature): boolean => {
    void feature;
    // Allow access if Pro OR if credits remain
    return isPro || usedCredits < monthlyCredits;
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

  const requestAccess = (feature: ProFeature): boolean => {
    if (!currentUserId) {
      void feature;
      showToast('error', 'Login required to use AI tools.');
      return false;
    }
    if (hasAccess(feature)) return true;
    openUpgrade(feature);
    return false;
  };

  const consumeCredit = async () => {
    if (!currentUserId) return;
    const snapshot = await fetchPlanSnapshot(currentUserId);
    if (snapshot) {
      applyPlanSnapshot(snapshot);
    }
  };

  const upgradeToPro = () => {
    if (!user) {
      showToast('error', 'Login required.');
      return;
    }

    // Placeholder for actual Stripe integration
    // We no longer fake-upgrade via localStorage to prevent split-brain issues & false hope.
    closeUpgrade();
    showToast('success', 'Waitlist joined! Pro billing is coming very soon.');
  };

  const refreshCredits = async () => {
    const snapshot = await fetchPlanSnapshot(currentUserId);
    if (snapshot) {
      applyPlanSnapshot(snapshot);
    }
  };

  const value = {
    tier,
    isPro,
    monthlyCredits,
    usedCredits,
    hasAccess,
    requestAccess,
    consumeCredit,
    refreshCredits,
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
        onClose={closeUpgrade}
        onUpgrade={upgradeToPro}
      />
    </PlanContext.Provider>
  );
};
