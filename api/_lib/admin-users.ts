import type { SupabaseClient, User } from '@supabase/supabase-js';
import type {
  AdminUserDetail,
  AdminUserNotificationRecord,
  AdminUserRecord,
  AdminUserResumeRecord,
} from '../../src/types/admin.js';
import { isRecord, listAllAuthUsers } from './admin.js';

interface ProfileRecord {
  id: string;
  full_name: string | null;
  role: 'user' | 'admin' | 'super_admin' | null;
  account_status: 'active' | 'suspended' | null;
  pro_waitlist_joined_at: string | null;
}

interface SubscriptionRecord {
  user_id: string;
  plan_tier: string | null;
}

interface UsageRecord {
  user_id: string;
  ai_credits_used: number | null;
  last_reset_at: string | null;
}

interface ResumeRow {
  id: string;
  title: string | null;
  template_id: string | null;
  updated_at: string | null;
}

interface NotificationEventRow {
  id: string;
  type: string | null;
  status: string | null;
  created_at: string | null;
  sent_at: string | null;
  payload: Record<string, unknown> | null;
}

const toIsoDate = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().split('T')[0];
};

const getMetadataFullName = (user: User): string => {
  const metadata = user.user_metadata;

  if (!isRecord(metadata)) {
    return '';
  }

  return typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
};

const truncateText = (value: string, maxLength = 140): string =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1).trimEnd()}…` : value;

const summarizeNotificationEvent = (
  row: NotificationEventRow,
): AdminUserNotificationRecord | null => {
  if (!row.id || !row.type || !row.status || !row.created_at) {
    return null;
  }

  const payload = isRecord(row.payload) ? row.payload : {};
  const type = row.type;

  if (
    type !== 'welcome_email' &&
    type !== 'weekly_digest' &&
    type !== 'ai_usage_alert' &&
    type !== 'pro_waitlist_joined' &&
    type !== 'campaign'
  ) {
    return null;
  }

  let title = 'Notification';
  let description = 'A new update was sent from ResumeeNow.';
  let channelLabel = 'Email';

  switch (type) {
    case 'welcome_email':
      title = 'Welcome email';
      description = 'Workspace-ready welcome message with a dashboard link.';
      break;
    case 'weekly_digest':
      title = 'Weekly digest';
      description = 'A scheduled nudge to revisit the user’s resume this week.';
      break;
    case 'ai_usage_alert': {
      const used = typeof payload.used === 'number' ? payload.used : null;
      const limit = typeof payload.limit === 'number' ? payload.limit : null;
      title = 'AI usage alert';
      description =
        used !== null && limit !== null
          ? `${used} of ${limit} daily AI actions used.`
          : 'Daily AI usage warning was sent.';
      break;
    }
    case 'pro_waitlist_joined':
      title = 'Pro waitlist joined';
      description = 'Confirmation that the user joined the Pro waitlist.';
      break;
    case 'campaign': {
      title =
        typeof payload.title === 'string' && payload.title.trim()
          ? payload.title.trim()
          : 'Campaign update';
      description =
        typeof payload.body === 'string' && payload.body.trim()
          ? truncateText(payload.body.trim())
          : 'An admin update was sent to this account.';

      const deliverEmail = payload.deliverEmail === true;
      const deliverInApp = payload.deliverInApp === true;
      channelLabel = deliverEmail && deliverInApp
        ? 'Email + in-app'
        : deliverInApp
          ? 'In-app'
          : 'Email';
      break;
    }
    default:
      break;
  }

  return {
    id: row.id,
    type,
    status: row.status,
    createdAt: row.created_at,
    sentAt: row.sent_at,
    title,
    description,
    channelLabel,
  };
};

export const buildAdminUserRecords = async (
  supabase: SupabaseClient,
  authUsers: User[],
): Promise<AdminUserRecord[]> => {
  const userIds = authUsers.map((user) => user.id);

  if (userIds.length === 0) {
    return [];
  }

  const [profilesResult, subscriptionsResult, usageResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, account_status, pro_waitlist_joined_at')
      .in('id', userIds),
    supabase
      .from('user_subscriptions')
      .select('user_id, plan_tier')
      .in('user_id', userIds),
    supabase
      .from('user_api_usage')
      .select('user_id, ai_credits_used, last_reset_at')
      .in('user_id', userIds),
  ]);

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  if (subscriptionsResult.error) {
    throw subscriptionsResult.error;
  }

  if (usageResult.error) {
    throw usageResult.error;
  }

  const profileMap = new Map(
    (profilesResult.data ?? []).map((record) => [record.id, record as ProfileRecord]),
  );
  const subscriptionMap = new Map(
    (subscriptionsResult.data ?? []).map((record) => [record.user_id, record as SubscriptionRecord]),
  );
  const usageMap = new Map(
    (usageResult.data ?? []).map((record) => [record.user_id, record as UsageRecord]),
  );

  const today = new Date().toISOString().split('T')[0];

  return authUsers
    .map((user) => {
      const profile = profileMap.get(user.id);
      const role =
        profile?.role === 'super_admin'
          ? 'super_admin'
          : profile?.role === 'admin'
            ? 'admin'
            : 'user';
      const subscription = subscriptionMap.get(user.id);
      const usage = usageMap.get(user.id);
      const lastResetDate = toIsoDate(usage?.last_reset_at ?? null);
      const aiCreditsUsed =
        lastResetDate !== null && lastResetDate !== today ? 0 : usage?.ai_credits_used ?? 0;

      return {
        id: user.id,
        email: user.email ?? '',
        fullName: profile?.full_name?.trim() || getMetadataFullName(user),
        role,
        accountStatus: profile?.account_status === 'suspended' ? 'suspended' : 'active',
        planTier: role !== 'user' || subscription?.plan_tier === 'pro' ? 'pro' : 'free',
        waitlistJoinedAt: profile?.pro_waitlist_joined_at ?? null,
        createdAt: user.created_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        aiCreditsUsed: Math.max(0, aiCreditsUsed),
      } satisfies AdminUserRecord;
    })
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    });
};

export const buildAdminUsers = async (supabase: SupabaseClient): Promise<AdminUserRecord[]> => {
  const authUsers = await listAllAuthUsers(supabase);
  return buildAdminUserRecords(supabase, authUsers);
};

export const buildAdminUserRecord = async (
  supabase: SupabaseClient,
  authUser: User,
): Promise<AdminUserRecord> => {
  const [record] = await buildAdminUserRecords(supabase, [authUser]);

  if (!record) {
    throw new Error('Failed to build admin user record.');
  }

  return record;
};

export const buildAdminUserDetail = async (
  supabase: SupabaseClient,
  authUser: User,
): Promise<AdminUserDetail> => {
  const userRecord = await buildAdminUserRecord(supabase, authUser);

  const [
    resumesCountResult,
    recentResumesResult,
    recentNotificationsResult,
    usageResult,
    sentNotificationsResult,
    failedNotificationsResult,
    campaignNotificationsResult,
  ] = await Promise.all([
    supabase
      .from('resumes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', authUser.id),
    supabase
      .from('resumes')
      .select('id, title, template_id, updated_at')
      .eq('user_id', authUser.id)
      .order('updated_at', { ascending: false })
      .limit(4),
    supabase
      .from('notification_events')
      .select('id, type, status, created_at, sent_at, payload')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('user_api_usage')
      .select('last_reset_at')
      .eq('user_id', authUser.id)
      .maybeSingle(),
    supabase
      .from('notification_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .eq('status', 'sent'),
    supabase
      .from('notification_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .eq('status', 'failed'),
    supabase
      .from('notification_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .eq('type', 'campaign'),
  ]);

  if (resumesCountResult.error) {
    throw resumesCountResult.error;
  }

  if (recentResumesResult.error) {
    throw recentResumesResult.error;
  }

  if (recentNotificationsResult.error) {
    throw recentNotificationsResult.error;
  }

  if (usageResult.error) {
    throw usageResult.error;
  }

  if (sentNotificationsResult.error) {
    throw sentNotificationsResult.error;
  }

  if (failedNotificationsResult.error) {
    throw failedNotificationsResult.error;
  }

  if (campaignNotificationsResult.error) {
    throw campaignNotificationsResult.error;
  }

  const recentResumes: AdminUserResumeRecord[] = (recentResumesResult.data ?? []).map((row) => {
    const record = row as ResumeRow;
    return {
      id: record.id,
      title: record.title?.trim() || 'Untitled resume',
      templateId: record.template_id ?? 'executive',
      updatedAt: record.updated_at,
    };
  });

  const recentNotifications: AdminUserNotificationRecord[] = (recentNotificationsResult.data ?? [])
    .map((row) => summarizeNotificationEvent(row as NotificationEventRow))
    .filter((row): row is AdminUserNotificationRecord => row !== null);

  return {
    user: userRecord,
    resumeCount: resumesCountResult.count ?? recentResumes.length,
    recentResumes,
    recentNotifications,
    lastUsageResetAt:
      usageResult.data && typeof usageResult.data.last_reset_at === 'string'
        ? usageResult.data.last_reset_at
        : null,
    sentNotificationCount: sentNotificationsResult.count ?? 0,
    failedNotificationCount: failedNotificationsResult.count ?? 0,
    campaignNotificationCount: campaignNotificationsResult.count ?? 0,
  };
};
