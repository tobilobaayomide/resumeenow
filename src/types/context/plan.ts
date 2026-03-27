export type PlanTier = 'free' | 'pro';
export type PlanStatus = 'signed_out' | 'loading' | 'ready' | 'unavailable';

export type ProFeature =
  | 'ai_tailor'
  | 'ats_audit'
  | 'cover_letter'
  | 'interview_prep'
  | 'priority_templates';

export interface PlanContextType {
  tier: PlanTier;
  planStatus: PlanStatus;
  isPlanLoading: boolean;
  isPlanUnavailable: boolean;
  isPro: boolean;
  isProWaitlistJoined: boolean;
  isJoiningProWaitlist: boolean;
  dailyCreditLimit: number;
  usedCredits: number;
  hasAccess: (feature: ProFeature) => boolean;
  requestAccess: (feature: ProFeature) => boolean;
  consumeCredit: () => Promise<void>;
  refreshCredits: () => Promise<void>;
  retryPlan: () => Promise<void>;
  openUpgrade: (feature?: ProFeature) => void;
  closeUpgrade: () => void;
  upgradeToPro: () => void;
}
