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
  upsertProfileRecord,
} from '../../lib/queries/profile';
import {
  parseAvatarProfileUpdate,
  parseSettingsFormState,
  parseSettingsProfileUpdate,
} from '../../schemas/integrations/profile';
import { supabase } from '../../lib/supabase';
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

const getFallbackSettingsState = (user: User): SettingsFormState =>
  parseSettingsFormState(
    { full_name: user.user_metadata?.full_name, bio: '' },
    typeof user.user_metadata?.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : null,
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
      const updates = parseSettingsProfileUpdate({
        id: user.id,
        full_name: fullName,
        bio: nextFormState.bio,
        avatar_url: nextFormState.avatarUrl,
        updated_at: new Date().toISOString(),
      });

      const savedProfile = await upsertProfileRecord(user.id, updates);
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          full_name: fullName,
          avatar_url: nextFormState.avatarUrl,
        },
      });

      return {
        savedProfile,
        authUpdateError,
      };
    },
    onSuccess: ({ savedProfile, authUpdateError }) => {
      queryClient.setQueryData(profileQueryKey, savedProfile);
      setDraftFormState(null);
      if (authUpdateError) {
        toast('Settings saved, but account display info may take time to refresh.');
      }
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

      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const nextAvatarUrl = data.publicUrl;
      const profileUpdate = parseAvatarProfileUpdate({
        id: user.id,
        avatar_url: nextAvatarUrl,
        updated_at: new Date().toISOString(),
      });
      const savedProfile = await upsertProfileRecord(user.id, profileUpdate);

      const fullName = `${formState.firstName} ${formState.lastName}`.trim();
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          full_name: fullName,
          avatar_url: nextAvatarUrl,
        },
      });

      return {
        savedProfile,
        nextAvatarUrl,
        authUpdateError,
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
      const { savedProfile, nextAvatarUrl, authUpdateError } =
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
      if (authUpdateError) {
        toast('Avatar saved, but account display info may take time to refresh.');
      }
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
