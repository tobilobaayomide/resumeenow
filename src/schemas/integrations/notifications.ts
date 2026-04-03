import { z } from 'zod';
import type { NotificationPreferencesFormState } from '../../types/dashboard/settings.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const normalizeNotificationPreferencesFormState = (
  value: unknown,
): NotificationPreferencesFormState => {
  const record = isRecord(value) ? value : {};

  return {
    weeklyDigest: toBoolean(record.weekly_digest ?? record.weeklyDigest, false),
    aiUsageAlerts: toBoolean(record.ai_usage_alerts ?? record.aiUsageAlerts, true),
    proWaitlistUpdates: toBoolean(
      record.pro_waitlist_updates ?? record.proWaitlistUpdates,
      true,
    ),
  };
};

export const NotificationPreferencesFormStateSchema = z.object({
  weeklyDigest: z.boolean(),
  aiUsageAlerts: z.boolean(),
  proWaitlistUpdates: z.boolean(),
});

export const NotificationPreferencesUpdateSchema = z.object({
  user_id: z.string(),
  weekly_digest: z.boolean(),
  ai_usage_alerts: z.boolean(),
  pro_waitlist_updates: z.boolean(),
  updated_at: z.string(),
});

export const parseNotificationPreferencesFormState = (
  value: unknown,
): NotificationPreferencesFormState =>
  NotificationPreferencesFormStateSchema.parse(
    normalizeNotificationPreferencesFormState(value),
  ) as NotificationPreferencesFormState;

export const parseNotificationPreferencesUpdate = (value: unknown) =>
  NotificationPreferencesUpdateSchema.parse(value);
