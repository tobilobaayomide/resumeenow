import { createContext } from 'react';
import type { PlanContextType } from '../types/context';

export type { PlanContextType, PlanTier, ProFeature } from '../types/context';

export const PlanContext = createContext<PlanContextType>({
  tier: 'free',
  isPro: false,
  monthlyCredits: 5,
  usedCredits: 0,
  hasAccess: () => false,
  requestAccess: () => false,
  consumeCredit: async () => {},
  refreshCredits: async () => {},
  openUpgrade: () => {},
  closeUpgrade: () => {},
  upgradeToPro: () => {},
});
