import { createContext } from 'react';
import type { PlanContextType } from '../types/context';

export type { PlanContextType, PlanTier, ProFeature } from '../types/context';

export const PlanContext = createContext<PlanContextType>({
  tier: 'free',
  planStatus: 'signed_out',
  isPlanLoading: false,
  isPlanUnavailable: false,
  isPro: false,
  hasUnlimitedAccess: false,
  isProWaitlistJoined: false,
  isJoiningProWaitlist: false,
  dailyCreditLimit: 5,
  usedCredits: 0,
  hasAccess: () => false,
  requestAccess: () => false,
  consumeCredit: async () => {},
  refreshCredits: async () => {},
  retryPlan: async () => {},
  openUpgrade: () => {},
  closeUpgrade: () => {},
  upgradeToPro: () => {},
});
