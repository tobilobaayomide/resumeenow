import { getValidAccessToken } from '../auth/accessToken';
import type { TriggerNotificationEventInput } from './types';

const NOTIFICATION_EVENTS_ENDPOINT = '/api/notification-events';

export const triggerNotificationEvent = async ({
  type,
  payload = {},
}: TriggerNotificationEventInput): Promise<void> => {
  const accessToken = await getValidAccessToken(
    'Please sign in again to continue.',
  );

  const response = await fetch(NOTIFICATION_EVENTS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      payload,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to trigger notification.');
  }
};
