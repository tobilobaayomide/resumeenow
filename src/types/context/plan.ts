export type PlanTier = 'free' | 'pro';

export type ProFeature =
  | 'ai_tailor'
  | 'ats_audit'
  | 'cover_letter'
  | 'interview_prep'
  | 'priority_templates';

export interface PlanContextType {
  tier: PlanTier;
  isPro: boolean;
  monthlyCredits: number;
  usedCredits: number;
  hasAccess: (feature: ProFeature) => boolean;
  requestAccess: (feature: ProFeature) => boolean;
  consumeCredit: () => Promise<void>;
  refreshCredits: () => Promise<void>;
  openUpgrade: (feature?: ProFeature) => void;
  closeUpgrade: () => void;
  upgradeToPro: () => void;
}
