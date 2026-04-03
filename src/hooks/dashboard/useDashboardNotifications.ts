import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../context/useAuth';
import { getErrorMessage } from '../../lib/errors';
import {
  fetchNotificationEvents,
  getNotificationEventsQueryKey,
  markNotificationEventsRead,
  NOTIFICATION_EVENTS_QUERY_STALE_TIME,
  type NotificationEventRecord,
} from '../../lib/queries/notificationEvents';
import type {
  DashboardNotificationItem,
  UseDashboardNotificationsResult,
} from '../../types/dashboard';

const formatNotificationTime = (value: string): string => {
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) {
    return 'Recently';
  }

  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return createdAt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const resolveNotificationContent = (
  event: NotificationEventRecord,
): Omit<DashboardNotificationItem, 'timeLabel' | 'isUnread'> => {
  switch (event.type) {
    case 'welcome_email':
      return {
        id: event.id,
        title: 'Welcome to ResumeNow',
        description: 'Your account is ready. Start building and exporting recruiter-ready resumes.',
      };
    case 'pro_waitlist_joined':
      return {
        id: event.id,
        title: 'Pro waitlist joined',
        description: 'You are on the Pro waitlist. We will notify you when early access opens.',
      };
    case 'ai_usage_alert': {
      const used =
        typeof event.payload.used === 'number' ? event.payload.used : null;
      const limit =
        typeof event.payload.limit === 'number' ? event.payload.limit : null;

      return {
        id: event.id,
        title: 'AI usage alert',
        description:
          used !== null && limit !== null
            ? `You have used ${used} out of ${limit} AI actions available today.`
            : 'You are getting close to your daily AI usage limit.',
      };
    }
    case 'weekly_digest':
      return {
        id: event.id,
        title: 'Weekly digest',
        description: 'A quick reminder to refresh your resume and keep momentum this week.',
      };
    default:
      return {
        id: event.id,
        title: 'Notification',
        description: 'You have a new update from ResumeNow.',
      };
  }
};

export const useDashboardNotifications = (): UseDashboardNotificationsResult => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const notificationEventsQueryKey = getNotificationEventsQueryKey(userId);

  const notificationsQuery = useQuery({
    queryKey: notificationEventsQueryKey,
    queryFn: () => fetchNotificationEvents(userId as string),
    enabled: userId !== null,
    staleTime: NOTIFICATION_EVENTS_QUERY_STALE_TIME,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (notificationsQuery.isError) {
      toast.error('Failed to load notifications.');
    }
  }, [notificationsQuery.error, notificationsQuery.isError]);

  const unreadIds = useMemo(
    () =>
      (notificationsQuery.data ?? [])
        .filter((item) => item.readAt === null)
        .map((item) => item.id),
    [notificationsQuery.data],
  );

  const markReadMutation = useMutation({
    mutationFn: async (eventIds: string[]) => {
      if (!userId) {
        return;
      }

      await markNotificationEventsRead(userId, eventIds);
    },
    onSuccess: (_, eventIds) => {
      queryClient.setQueryData(
        notificationEventsQueryKey,
        (current: NotificationEventRecord[] | undefined) => {
          if (!current) {
            return current;
          }

          const readAt = new Date().toISOString();
          return current.map((item) =>
            eventIds.includes(item.id) && item.readAt === null
              ? { ...item, readAt }
              : item,
          );
        },
      );
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update notifications.'));
    },
  });

  useEffect(() => {
    if (!isOpen || unreadIds.length === 0 || markReadMutation.isPending) {
      return;
    }

    void markReadMutation.mutateAsync(unreadIds).catch(() => {
      // Error toast is handled by the mutation.
    });
  }, [isOpen, unreadIds, markReadMutation]);

  const items = useMemo<DashboardNotificationItem[]>(
    () =>
      (notificationsQuery.data ?? []).map((event) => {
        const content = resolveNotificationContent(event);

        return {
          ...content,
          timeLabel: formatNotificationTime(event.createdAt),
          isUnread: event.readAt === null,
        };
      }),
    [notificationsQuery.data],
  );

  return {
    isOpen,
    loading:
      userId !== null &&
      notificationsQuery.isPending &&
      notificationsQuery.data === undefined,
    items,
    unreadCount: unreadIds.length,
    toggleNotifications: () => setIsOpen((current) => !current),
    closeNotifications: () => setIsOpen(false),
  };
};
