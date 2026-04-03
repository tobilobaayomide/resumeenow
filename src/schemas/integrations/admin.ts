import { z } from 'zod';

export const AdminUserRecordSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string(),
  role: z.enum(['user', 'admin', 'super_admin']),
  accountStatus: z.enum(['active', 'suspended']),
  planTier: z.enum(['free', 'pro']),
  waitlistJoinedAt: z.string().nullable(),
  createdAt: z.string().nullable(),
  lastSignInAt: z.string().nullable(),
  aiCreditsUsed: z.number().int().nonnegative(),
});

export const AdminUsersResponseSchema = z.object({
  users: z.array(AdminUserRecordSchema),
});

export const AdminUserActionSchema = z.enum([
  'promote_admin',
  'demote_admin',
  'grant_pro',
  'revoke_pro',
  'suspend_user',
  'unsuspend_user',
  'delete_user',
  'reset_ai_usage',
  'resend_welcome_email',
]);

export const AdminUserActionResultSchema = z.object({
  user: AdminUserRecordSchema.nullable(),
  deletedUserId: z.string().nullable(),
  message: z.string(),
});

export const AdminUserResumeRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  templateId: z.string(),
  updatedAt: z.string().nullable(),
});

export const AdminUserNotificationRecordSchema = z.object({
  id: z.string(),
  type: z.enum([
    'welcome_email',
    'weekly_digest',
    'ai_usage_alert',
    'pro_waitlist_joined',
    'campaign',
  ]),
  status: z.string(),
  createdAt: z.string(),
  sentAt: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  channelLabel: z.string(),
});

export const AdminUserDetailSchema = z.object({
  user: AdminUserRecordSchema,
  resumeCount: z.number().int().nonnegative(),
  recentResumes: z.array(AdminUserResumeRecordSchema),
  recentNotifications: z.array(AdminUserNotificationRecordSchema),
  lastUsageResetAt: z.string().nullable(),
  sentNotificationCount: z.number().int().nonnegative(),
  failedNotificationCount: z.number().int().nonnegative(),
  campaignNotificationCount: z.number().int().nonnegative(),
});

export const AdminUserDetailResponseSchema = z.object({
  detail: AdminUserDetailSchema,
});

export const AdminCampaignAudienceSchema = z.enum([
  'product_updates',
  'waitlist',
  'all_users',
]);

export const AdminCampaignResultSchema = z.object({
  audience: AdminCampaignAudienceSchema,
  deliverEmail: z.boolean(),
  deliverInApp: z.boolean(),
  targetedRecipients: z.number().int().nonnegative(),
  inAppRecipients: z.number().int().nonnegative(),
  emailedRecipients: z.number().int().nonnegative(),
  skippedRecipients: z.number().int().nonnegative(),
  failedRecipients: z.number().int().nonnegative(),
});

export const AdminCampaignHistoryRecordSchema = z.object({
  campaignId: z.string(),
  subject: z.string(),
  title: z.string(),
  body: z.string(),
  audience: AdminCampaignAudienceSchema,
  deliverEmail: z.boolean(),
  deliverInApp: z.boolean(),
  createdAt: z.string(),
  sentAt: z.string().nullable(),
  targetedRecipients: z.number().int().nonnegative(),
  inAppRecipients: z.number().int().nonnegative(),
  emailedRecipients: z.number().int().nonnegative(),
  skippedRecipients: z.number().int().nonnegative(),
  failedRecipients: z.number().int().nonnegative(),
});

export const AdminCampaignHistoryResponseSchema = z.object({
  campaigns: z.array(AdminCampaignHistoryRecordSchema),
});

export const parseAdminUsersResponse = (value: unknown) =>
  AdminUsersResponseSchema.parse(value);

export const parseAdminUserActionResult = (value: unknown) =>
  AdminUserActionResultSchema.parse(value);

export const parseAdminUserDetailResponse = (value: unknown) =>
  AdminUserDetailResponseSchema.parse(value);

export const parseAdminCampaignResult = (value: unknown) =>
  AdminCampaignResultSchema.parse(value);

export const parseAdminCampaignHistoryResponse = (value: unknown) =>
  AdminCampaignHistoryResponseSchema.parse(value);
