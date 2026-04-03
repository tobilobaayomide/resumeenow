import type { PlanTier } from './context';
import type { AccountStatus, ProfileRole } from './profile';
import type { NotificationEventType } from '../lib/notifications/types';

export interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: ProfileRole;
  accountStatus: AccountStatus;
  planTier: PlanTier;
  waitlistJoinedAt: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  aiCreditsUsed: number;
}

export type AdminUserAction =
  | 'promote_admin'
  | 'demote_admin'
  | 'grant_pro'
  | 'revoke_pro'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'delete_user'
  | 'reset_ai_usage'
  | 'resend_welcome_email';

export interface AdminUserActionInput {
  userId: string;
  action: AdminUserAction;
}

export interface AdminUserActionResult {
  user: AdminUserRecord | null;
  deletedUserId: string | null;
  message: string;
}

export interface AdminUserResumeRecord {
  id: string;
  title: string;
  templateId: string;
  updatedAt: string | null;
}

export interface AdminUserNotificationRecord {
  id: string;
  type: NotificationEventType;
  status: string;
  createdAt: string;
  sentAt: string | null;
  title: string;
  description: string;
  channelLabel: string;
}

export interface AdminUserDetail {
  user: AdminUserRecord;
  resumeCount: number;
  recentResumes: AdminUserResumeRecord[];
  recentNotifications: AdminUserNotificationRecord[];
  lastUsageResetAt: string | null;
  sentNotificationCount: number;
  failedNotificationCount: number;
  campaignNotificationCount: number;
}

export type AdminCampaignAudience =
  | 'product_updates'
  | 'waitlist'
  | 'all_users';

export interface AdminCampaignInput {
  subject: string;
  title: string;
  body: string;
  audience: AdminCampaignAudience;
  sendEmail: boolean;
  sendInApp: boolean;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface AdminCampaignResult {
  audience: AdminCampaignAudience;
  deliverEmail: boolean;
  deliverInApp: boolean;
  targetedRecipients: number;
  inAppRecipients: number;
  emailedRecipients: number;
  skippedRecipients: number;
  failedRecipients: number;
}

export interface AdminCampaignHistoryRecord {
  campaignId: string;
  subject: string;
  title: string;
  body: string;
  audience: AdminCampaignAudience;
  deliverEmail: boolean;
  deliverInApp: boolean;
  createdAt: string;
  sentAt: string | null;
  targetedRecipients: number;
  inAppRecipients: number;
  emailedRecipients: number;
  skippedRecipients: number;
  failedRecipients: number;
}
