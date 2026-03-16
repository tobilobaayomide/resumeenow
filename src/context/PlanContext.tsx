import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import UpgradeModal from '../components/ui/UpgradeModal';
import { PlanContext, type PlanTier, type ProFeature } from './plan-context';
import { useAuth } from './useAuth';


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
  const [dynamicFreeLimit, setDynamicFreeLimit] = useState<number>(10);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeOwnerId, setUpgradeOwnerId] = useState<string | null>(null);
  const [pendingFeature, setPendingFeature] = useState<ProFeature | null>(null);

  const currentUserId = user?.id ?? null;

  const fetchPlanData = async (isMounted = true) => {
    if (!currentUserId) {
      if (isMounted) {
        setTier('free');
        setUsedCredits(0);
      }
      return;
    }

    try {
      const [subRes, usageRes] = await Promise.all([
        supabase.from('user_subscriptions').select('plan_tier').eq('user_id', currentUserId).maybeSingle(),
        supabase.from('user_api_usage').select('ai_credits_used, last_reset_at').eq('user_id', currentUserId).maybeSingle()
      ]);

      if (isMounted) {
        if (subRes.data) setTier(subRes.data.plan_tier as PlanTier);
        if (usageRes.data) {
          const lastResetDateStr = usageRes.data.last_reset_at;
          const lastResetDate = lastResetDateStr 
            ? new Date(lastResetDateStr).toISOString().split('T')[0] 
            : null;
          const today = new Date().toISOString().split('T')[0];
          const isNewDay = lastResetDate && lastResetDateStr !== "" && lastResetDate !== today;
          
          const hasHadFirstReset = (lastResetDate !== null && lastResetDateStr !== "");
          const calculatedLimit = hasHadFirstReset ? 5 : 10;
          setDynamicFreeLimit(calculatedLimit);

          const effectiveCredits = isNewDay ? 0 : usageRes.data.ai_credits_used;
          setUsedCredits(effectiveCredits);
        }
      }
    } catch (error) {
      console.error('Failed to fetch plan data:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    void fetchPlanData(isMounted);
    return () => { isMounted = false; };
  }, [currentUserId]);

  const isPro = tier === 'pro';
  const monthlyCredits = isPro ? 100 : dynamicFreeLimit;

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
    if (hasAccess(feature)) return true;
    openUpgrade(feature);
    return false;
  };

  const consumeCredit = async () => {
    if (isPro || !currentUserId) return;
    
    // Optimistic UI update, followed by a true fetch to sync with DB
    setUsedCredits(prev => prev + 1);
    await fetchPlanData();
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
    await fetchPlanData(true);
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
