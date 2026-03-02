import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../../lib/errors';
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

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  };
};

export const useSettingsController = ({
  user,
}: UseSettingsControllerArgs): UseSettingsControllerResult => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savedFormState, setSavedFormState] = useState<SettingsFormState>(
    EMPTY_SETTINGS_STATE,
  );

  const applyFormState = (formState: SettingsFormState) => {
    setFirstName(formState.firstName);
    setLastName(formState.lastName);
    setBio(formState.bio);
    setAvatarUrl(formState.avatarUrl);
  };

  const hasUnsavedChanges =
    firstName !== savedFormState.firstName ||
    lastName !== savedFormState.lastName ||
    bio !== savedFormState.bio ||
    avatarUrl !== savedFormState.avatarUrl;

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const names = splitName(data.full_name || '');
          const nextState: SettingsFormState = {
            firstName: names.firstName,
            lastName: names.lastName,
            bio: data.bio || '',
            avatarUrl: data.avatar_url || null,
          };
          applyFormState(nextState);
          setSavedFormState(nextState);
        } else {
          const names = splitName(user.user_metadata?.full_name || '');
          const nextState: SettingsFormState = {
            firstName: names.firstName,
            lastName: names.lastName,
            bio: '',
            avatarUrl:
              typeof user.user_metadata?.avatar_url === 'string'
                ? user.user_metadata.avatar_url
                : null,
          };
          applyFormState(nextState);
          setSavedFormState(nextState);
        }
      } catch {
        toast.error('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const fullName = `${firstName} ${lastName}`.trim();

      const updates = {
        id: user.id,
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          full_name: fullName,
          avatar_url: avatarUrl,
        },
      });
      if (authUpdateError) {
        toast('Settings saved, but account display info may take time to refresh.');
      }

      setSavedFormState({
        firstName,
        lastName,
        bio,
        avatarUrl,
      });
      toast.success('Settings saved successfully');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Error updating profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error('Please sign in again and retry.');
      return;
    }
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const loadingToast = toast.loading('Uploading avatar...');

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const nextAvatarUrl = data.publicUrl;

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: nextAvatarUrl,
        updated_at: new Date().toISOString(),
      });
      if (profileError) throw profileError;

      const fullName = `${firstName} ${lastName}`.trim();
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          full_name: fullName,
          avatar_url: nextAvatarUrl,
        },
      });

      setAvatarUrl(nextAvatarUrl);
      setSavedFormState((prev) => ({
        ...prev,
        avatarUrl: nextAvatarUrl,
      }));
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
    loading,
    saving,
    fileInputRef,
    firstName,
    lastName,
    bio,
    avatarUrl,
    hasUnsavedChanges,
    setActiveTab,
    setFirstName,
    setLastName,
    setBio,
    handleAvatarUpload,
    saveProfile,
    resetForm: () => applyFormState(savedFormState),
  };
};
