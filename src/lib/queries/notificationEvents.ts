import { reportRuntimeValidationIssue } from '../observability/runtimeValidation';
import type { NotificationEventType } from '../notifications/types';

export interface NotificationEventRecord {
  id: string;
  type: NotificationEventType;
  payload: Record<string, unknown>;
  status: string;
  createdAt: string;
  readAt: string | null;
  sentAt: string | null;
}

export const NOTIFICATION_EVENTS_QUERY_STALE_TIME = 30_000;
const NOTIFICATION_FEED_ENDPOINT = '/api/notifications?view=feed';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toNullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

const normalizeNotificationEventRecord = (
  value: unknown,
  userId: string,
): NotificationEventRecord | null => {
  if (!isRecord(value)) {
    reportRuntimeValidationIssue({
      key: `notificationEvents.query.invalid-row:${userId}`,
      source: 'notificationEvents.query',
      action: 'Ignored a malformed notification event row returned from persistence.',
      details: {
        userId,
      },
    });
    return null;
  }

  const id = toNullableString(value.id);
  const type = toNullableString(value.type) as NotificationEventType | null;
  const status = toNullableString(value.status);
  const createdAt = toNullableString(value.created_at);

  if (!id || !type || !status || !createdAt) {
    reportRuntimeValidationIssue({
      key: `notificationEvents.query.missing-fields:${userId}:${String(value.id ?? 'unknown')}`,
      source: 'notificationEvents.query',
      action: 'Ignored a notification event row with missing required fields.',
      details: {
        userId,
      },
    });
    return null;
  }

  return {
    id,
    type,
    payload: isRecord(value.payload) ? value.payload : {},
    status,
    createdAt,
    readAt: toNullableString(value.read_at),
    sentAt: toNullableString(value.sent_at),
  };
};

export const getNotificationEventsQueryKey = (userId: string | null | undefined) =>
  ['notificationEvents', userId ?? null] as const;

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
  return text || 'Failed to load notifications.';
};

export const fetchNotificationEvents = async (
  userId: string,
): Promise<NotificationEventRecord[]> => {
  const response = await fetch(NOTIFICATION_FEED_ENDPOINT);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { events?: unknown };
  const data = payload.events;

  return Array.isArray(data)
    ? data
        .map((item) => normalizeNotificationEventRecord(item, userId))
        .filter((item): item is NotificationEventRecord => item !== null)
    : [];
};

export const markNotificationEventsRead = async (
  _userId: string,
  eventIds: string[],
): Promise<void> => {
  if (eventIds.length === 0) {
    return;
  }

  const response = await fetch(NOTIFICATION_FEED_ENDPOINT, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventIds,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
};
