import { reportRuntimeValidationIssue } from '../observability/runtimeValidation';

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

const NOTIFICATION_PREFERENCES_ENDPOINT = '/api/notifications?view=preferences';

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.clone().json()) as {
      message?: string;
      error?: string;
    };

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }
  } catch {
    // Fall through to text parsing.
  }

  const text = (await response.text()).trim();
  return text || 'Failed to update notification preferences.';
};

export const fetchNotificationPreferences = async (
  userId: string,
): Promise<NotificationPreferencesRecord | null> => {
  const response = await fetch(NOTIFICATION_PREFERENCES_ENDPOINT, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { preferences?: unknown };
  const data = payload.preferences;

  return normalizeNotificationPreferencesRecord(data, userId);
};

export const upsertNotificationPreferences = async (
  userId: string,
  updates: Record<string, unknown>,
): Promise<NotificationPreferencesRecord> => {
  const response = await fetch(NOTIFICATION_PREFERENCES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { preferences?: unknown };
  const data = payload.preferences;

  const savedPreferences = normalizeNotificationPreferencesRecord(data, userId);
  if (!savedPreferences) {
    throw new Error('Failed to parse saved notification preferences.');
  }

  return savedPreferences;
};
