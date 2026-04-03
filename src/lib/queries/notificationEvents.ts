import { reportRuntimeValidationIssue } from '../observability/runtimeValidation';
import { supabase } from '../supabase';
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

export const fetchNotificationEvents = async (
  userId: string,
): Promise<NotificationEventRecord[]> => {
  const { data, error } = await supabase
    .from('notification_events')
    .select('id, type, payload, status, created_at, read_at, sent_at')
    .eq('user_id', userId)
    .in('status', ['sent', 'skipped'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return Array.isArray(data)
    ? data
        .map((item) => normalizeNotificationEventRecord(item, userId))
        .filter((item): item is NotificationEventRecord => item !== null)
    : [];
};

export const markNotificationEventsRead = async (
  userId: string,
  eventIds: string[],
): Promise<void> => {
  if (eventIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('notification_events')
    .update({
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .in('id', eventIds)
    .is('read_at', null);

  if (error) {
    throw error;
  }
};
