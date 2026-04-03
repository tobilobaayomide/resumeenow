export type NotificationEventType =
  | 'welcome_email'
  | 'weekly_digest'
  | 'ai_usage_alert'
  | 'pro_waitlist_joined'
  | 'campaign';

export interface TriggerNotificationEventInput {
  type: NotificationEventType;
  payload?: Record<string, unknown>;
}
