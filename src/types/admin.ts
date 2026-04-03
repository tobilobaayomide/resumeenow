import type { PlanTier } from './context';
import type { ProfileRole } from './profile';

export interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: ProfileRole;
  planTier: PlanTier;
  waitlistJoinedAt: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  aiCreditsUsed: number;
}
