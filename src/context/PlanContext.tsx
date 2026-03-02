import React, { useState } from 'react';
import { toast } from 'sonner';
import UpgradeModal from '../components/ui/UpgradeModal';
import { PlanContext, type PlanTier, type ProFeature } from './plan-context';
import { useAuth } from './useAuth';

const STORAGE_KEY_PREFIX = 'resumeenow_plan_tier';
const FREE_MONTHLY_CREDITS = 20;

const resolveStorageKey = (userId: string): string => `${STORAGE_KEY_PREFIX}:${userId}`;

const getStoredTier = (userId: string | null): PlanTier => {
  if (!userId) return 'free';
  const stored = window.localStorage.getItem(resolveStorageKey(userId));
  return stored === 'pro' ? 'pro' : 'free';
};

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tierOverride, setTierOverride] = useState<{
    userId: string;
    tier: PlanTier;
  } | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeOwnerId, setUpgradeOwnerId] = useState<string | null>(null);
  const [pendingFeature, setPendingFeature] = useState<ProFeature | null>(null);

  const currentUserId = user?.id ?? null;
  const tier =
    currentUserId && tierOverride?.userId === currentUserId
      ? tierOverride.tier
      : getStoredTier(currentUserId);

  const isPro = tier === 'pro';
  const usedCredits = 0;
  const monthlyCredits = isPro ? 100 : FREE_MONTHLY_CREDITS;

  const hasAccess = (feature: ProFeature): boolean => {
    void feature;
    return isPro;
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

  const upgradeToPro = () => {
    if (!user) {
      toast.error('Login required.');
      return;
    }

    setTierOverride({
      userId: user.id,
      tier: 'pro',
    });
    window.localStorage.setItem(resolveStorageKey(user.id), 'pro');
    closeUpgrade();
    toast.success('Pro UI unlocked. Billing integration is the next step.');
  };

  const value = {
    tier,
    isPro,
    monthlyCredits,
    usedCredits,
    hasAccess,
    requestAccess,
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
