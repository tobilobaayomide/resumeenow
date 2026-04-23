import type { TriggerNotificationEventInput } from './types';

const NOTIFICATION_EVENTS_ENDPOINT = '/api/notification-events';
export const NOTIFICATION_EVENT_CREATED = 'resumeenow:notification-event-created';

export const triggerNotificationEvent = async ({
  type,
  payload = {},
}: TriggerNotificationEventInput): Promise<void> => {
  const response = await fetch(NOTIFICATION_EVENTS_ENDPOINT, {
    method: 'POST',
    headers: {
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

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_EVENT_CREATED, {
        detail: {
          type,
        },
      }),
    );
  }
};
