import { reportRuntimeValidationIssue } from '../observability/runtimeValidation';
import { supabase } from '../supabase';

export type NotificationPreferencesRecord = Record<string, unknown>;

export const NOTIFICATION_PREFERENCES_QUERY_STALE_TIME = 300_000;

const isRecord = (value: unknown): value is NotificationPreferencesRecord =>
  typeof value === 'object' && value !== null;

const normalizeNotificationPreferencesRecord = (
  value: unknown,
  userId: string,
): NotificationPreferencesRecord | null => {
  if (value == null) {
    return null;
  }

  if (isRecord(value)) {
    return value;
  }

  reportRuntimeValidationIssue({
    key: `notificationPreferences.query.invalid-row:${userId}`,
    source: 'notificationPreferences.query',
    action: 'Ignored a malformed notification preferences row returned from persistence.',
    details: {
      userId,
    },
  });

  return null;
};

export const getNotificationPreferencesQueryKey = (
  userId: string | null | undefined,
) => ['notificationPreferences', userId ?? null] as const;

export const fetchNotificationPreferences = async (
  userId: string,
): Promise<NotificationPreferencesRecord | null> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeNotificationPreferencesRecord(data, userId);
};

export const upsertNotificationPreferences = async (
  userId: string,
  updates: Record<string, unknown>,
): Promise<NotificationPreferencesRecord> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(updates, {
      onConflict: 'user_id',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const savedPreferences = normalizeNotificationPreferencesRecord(data, userId);
  if (!savedPreferences) {
    throw new Error('Failed to parse saved notification preferences.');
  }

  return savedPreferences;
};
