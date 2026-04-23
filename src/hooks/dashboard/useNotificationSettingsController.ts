import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../../lib/errors';
import {
  fetchNotificationPreferences,
  getNotificationPreferencesQueryKey,
  NOTIFICATION_PREFERENCES_QUERY_STALE_TIME,
  type NotificationPreferencesRecord,
  upsertNotificationPreferences,
} from '../../lib/queries/notifications';
import {
  parseNotificationPreferencesFormState,
  parseSelfNotificationPreferencesUpdate,
} from '../../schemas/integrations/notifications';
import type {
  NotificationPreferencesFormState,
  UseNotificationSettingsControllerArgs,
  UseNotificationSettingsControllerResult,
} from '../../types/dashboard/settings';

const EMPTY_NOTIFICATION_PREFERENCES_STATE: NotificationPreferencesFormState = {
  weeklyDigest: false,
  aiUsageAlerts: true,
  proWaitlistUpdates: true,
  productUpdates: true,
};

const resolveNotificationPreferencesFormState = (
  record: NotificationPreferencesRecord | null,
): NotificationPreferencesFormState =>
  record
    ? parseNotificationPreferencesFormState(record)
    : EMPTY_NOTIFICATION_PREFERENCES_STATE;

const areNotificationPreferencesEqual = (
  left: NotificationPreferencesFormState,
  right: NotificationPreferencesFormState,
): boolean =>
  left.weeklyDigest === right.weeklyDigest &&
  left.aiUsageAlerts === right.aiUsageAlerts &&
  left.proWaitlistUpdates === right.proWaitlistUpdates &&
  left.productUpdates === right.productUpdates;

export const useNotificationSettingsController = ({
  user,
}: UseNotificationSettingsControllerArgs): UseNotificationSettingsControllerResult => {
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const [draftFormState, setDraftFormState] =
    useState<NotificationPreferencesFormState | null>(null);
  const notificationPreferencesQueryKey = getNotificationPreferencesQueryKey(userId);

  const notificationPreferencesQuery = useQuery({
    queryKey: notificationPreferencesQueryKey,
    queryFn: async () => fetchNotificationPreferences(userId as string),
    enabled: userId !== null,
    staleTime: NOTIFICATION_PREFERENCES_QUERY_STALE_TIME,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (notificationPreferencesQuery.isError) {
      toast.error('Failed to load notification settings.');
    }
  }, [
    notificationPreferencesQuery.error,
    notificationPreferencesQuery.isError,
  ]);

  const serverFormState = resolveNotificationPreferencesFormState(
    notificationPreferencesQuery.data ?? null,
  );
  const formState = draftFormState ?? serverFormState;
  const hasUnsavedChanges =
    draftFormState !== null &&
    !areNotificationPreferencesEqual(draftFormState, serverFormState);

  const updateDraftFormState = (
    updater: (
      current: NotificationPreferencesFormState,
    ) => NotificationPreferencesFormState,
  ) => {
    setDraftFormState((currentDraft) => {
      const nextState = updater(currentDraft ?? serverFormState);
      return areNotificationPreferencesEqual(nextState, serverFormState)
        ? null
        : nextState;
    });
  };

  const savePreferencesMutation = useMutation({
    mutationFn: async (nextFormState: NotificationPreferencesFormState) => {
      if (!userId) {
        throw new Error('Login required.');
      }

      const updates = parseSelfNotificationPreferencesUpdate({
        weekly_digest: nextFormState.weeklyDigest,
        ai_usage_alerts: nextFormState.aiUsageAlerts,
        pro_waitlist_updates: nextFormState.proWaitlistUpdates,
        product_updates: nextFormState.productUpdates,
      });

      return upsertNotificationPreferences(userId, updates);
    },
    onSuccess: (savedPreferences) => {
      queryClient.setQueryData(notificationPreferencesQueryKey, savedPreferences);
      setDraftFormState(null);
      toast.success('Notification settings saved.');
    },
    onError: (error: unknown) => {
      toast.error(
        getErrorMessage(error, 'Failed to save notification settings.'),
      );
    },
  });

  const savePreferences = async () => {
    if (!userId) {
      return;
    }

    try {
      await savePreferencesMutation.mutateAsync(formState);
    } catch {
      // Error toast is handled by the mutation.
    }
  };

  return {
    loading:
      userId !== null &&
      notificationPreferencesQuery.isPending &&
      notificationPreferencesQuery.data === undefined,
    saving: savePreferencesMutation.isPending,
    weeklyDigest: formState.weeklyDigest,
    aiUsageAlerts: formState.aiUsageAlerts,
    proWaitlistUpdates: formState.proWaitlistUpdates,
    productUpdates: formState.productUpdates,
    hasUnsavedChanges,
    setWeeklyDigest: (value) =>
      updateDraftFormState((current) => ({
        ...current,
        weeklyDigest: value,
      })),
    setAiUsageAlerts: (value) =>
      updateDraftFormState((current) => ({
        ...current,
        aiUsageAlerts: value,
      })),
    setProWaitlistUpdates: (value) =>
      updateDraftFormState((current) => ({
        ...current,
        proWaitlistUpdates: value,
      })),
    setProductUpdates: (value) =>
      updateDraftFormState((current) => ({
        ...current,
        productUpdates: value,
      })),
    savePreferences,
    resetForm: () => setDraftFormState(null),
  };
};
