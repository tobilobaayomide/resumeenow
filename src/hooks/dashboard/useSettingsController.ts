import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { getErrorMessage } from '../../lib/errors';
import {
  fetchProfileRecord,
  getProfileQueryKey,
  PROFILE_QUERY_STALE_TIME,
  type ProfileRecord,
  uploadProfileAvatar,
  upsertProfileRecord,
} from '../../lib/queries/profile';
import {
  parseSelfProfileUpdate,
  parseSettingsFormState,
} from '../../schemas/integrations/profile';
import type {
  SettingsFormState,
  SettingsTabId,
  UseSettingsControllerArgs,
  UseSettingsControllerResult,
} from '../../types/dashboard';

const EMPTY_SETTINGS_STATE: SettingsFormState = {
  firstName: '',
  lastName: '',
  bio: '',
  avatarUrl: null,
};
const MAX_AVATAR_FILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const getFallbackSettingsState = (user: User): SettingsFormState =>
  parseSettingsFormState(
    { full_name: user.user_metadata?.full_name, bio: '' },
    null,
  );

const resolveSettingsFormState = (
  profileRecord: ProfileRecord | null,
  user: User,
): SettingsFormState =>
  profileRecord ? parseSettingsFormState(profileRecord) : getFallbackSettingsState(user);

const areSettingsFormStatesEqual = (
  left: SettingsFormState,
  right: SettingsFormState,
): boolean =>
  left.firstName === right.firstName &&
  left.lastName === right.lastName &&
  left.bio === right.bio &&
  left.avatarUrl === right.avatarUrl;

export const useSettingsController = ({
  user,
}: UseSettingsControllerArgs): UseSettingsControllerResult => {
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');
  const [draftFormState, setDraftFormState] = useState<SettingsFormState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileQueryKey = getProfileQueryKey(userId);

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => fetchProfileRecord(userId as string),
    enabled: userId !== null,
    staleTime: PROFILE_QUERY_STALE_TIME,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (profileQuery.isError) {
      toast.error('Failed to load settings.');
    }
  }, [profileQuery.error, profileQuery.isError]);

  const serverFormState =
    user == null
      ? EMPTY_SETTINGS_STATE
      : resolveSettingsFormState(profileQuery.data ?? null, user);
  const formState = draftFormState ?? serverFormState;
  const hasUnsavedChanges =
    draftFormState !== null && !areSettingsFormStatesEqual(draftFormState, serverFormState);

  const updateDraftFormState = (updater: (current: SettingsFormState) => SettingsFormState) => {
    setDraftFormState((currentDraft) => {
      const nextState = updater(currentDraft ?? serverFormState);
      return areSettingsFormStatesEqual(nextState, serverFormState) ? null : nextState;
    });
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (nextFormState: SettingsFormState) => {
      if (!user) {
        throw new Error('Login required.');
      }

      const fullName = `${nextFormState.firstName} ${nextFormState.lastName}`.trim();
      const updates = parseSelfProfileUpdate({
        full_name: fullName,
        bio: nextFormState.bio,
      });

      return upsertProfileRecord(user.id, updates);
    },
    onSuccess: (savedProfile) => {
      queryClient.setQueryData(profileQueryKey, savedProfile);
      setDraftFormState(null);
      toast.success('Settings saved successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error updating profile'));
    },
  });

  const avatarUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        throw new Error('Please sign in again and retry.');
      }

      if (file.size > MAX_AVATAR_FILE_BYTES) {
        throw new Error('Avatar images must be 2 MB or smaller.');
      }

      if (file.type && !ALLOWED_AVATAR_MIME_TYPES.has(file.type)) {
        throw new Error('Only PNG, JPEG, and WebP avatar uploads are supported.');
      }

      const { profile: savedProfile, avatarUrl: nextAvatarUrl } = await uploadProfileAvatar(user.id, file);

      return {
        savedProfile,
        nextAvatarUrl,
      };
    },
  });

  const saveProfile = async () => {
    if (!user) {
      return;
    }

    try {
      await saveProfileMutation.mutateAsync(formState);
    } catch {
      // Error toast is handled by the mutation.
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error('Please sign in again and retry.');
      return;
    }
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const loadingToast = toast.loading('Uploading avatar...');

    try {
      const { savedProfile, nextAvatarUrl } =
        await avatarUploadMutation.mutateAsync(file);
      const nextServerFormState = resolveSettingsFormState(savedProfile, user);

      queryClient.setQueryData(profileQueryKey, savedProfile);
      setDraftFormState((currentDraft) => {
        if (!currentDraft) {
          return null;
        }

        const nextDraftState = {
          ...currentDraft,
          avatarUrl: nextAvatarUrl,
        };

        return areSettingsFormStatesEqual(nextDraftState, nextServerFormState)
          ? null
          : nextDraftState;
      });
      toast.dismiss(loadingToast);
      toast.success('Avatar uploaded and saved');
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      toast.error(`Upload failed: ${getErrorMessage(error)}`);
    } finally {
      event.target.value = '';
    }
  };

  return {
    activeTab,
    loading: userId !== null && profileQuery.isPending && profileQuery.data === undefined,
    saving: saveProfileMutation.isPending || avatarUploadMutation.isPending,
    fileInputRef,
    firstName: formState.firstName,
    lastName: formState.lastName,
    bio: formState.bio,
    avatarUrl: formState.avatarUrl,
    hasUnsavedChanges,
    setActiveTab,
    setFirstName: (value) => updateDraftFormState((current) => ({ ...current, firstName: value })),
    setLastName: (value) => updateDraftFormState((current) => ({ ...current, lastName: value })),
    setBio: (value) => updateDraftFormState((current) => ({ ...current, bio: value })),
    handleAvatarUpload,
    saveProfile,
    resetForm: () => setDraftFormState(null),
  };
};
