import type { IconType } from 'react-icons';
import type { User } from '@supabase/supabase-js';
import type { ChangeEvent, RefObject } from 'react';

export type SettingsTabId = 'profile' | 'account' | 'billing' | 'notifications';

export interface SettingsTabItem {
  id: SettingsTabId;
  label: string;
  icon: IconType;
  description: string;
}

export interface SettingsFormState {
  firstName: string;
  lastName: string;
  bio: string;
  avatarUrl: string | null;
}

export interface NotificationPreferencesFormState {
  weeklyDigest: boolean;
  aiUsageAlerts: boolean;
  proWaitlistUpdates: boolean;
  productUpdates: boolean;
}

export interface SettingsTabNavigationProps {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
}

export interface SettingsProfileTabProps {
  firstName: string;
  lastName: string;
  bio: string;
  avatarUrl: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  saving: boolean;
  hasUnsavedChanges: boolean;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onAvatarUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onSave: () => void;
}

export interface SettingsAccountTabProps {
  email: string;
  onDeleteAccount: () => void;
}

export interface SettingsNotificationsTabProps {
  weeklyDigest: boolean;
  aiUsageAlerts: boolean;
  proWaitlistUpdates: boolean;
  productUpdates: boolean;
  loading: boolean;
  saving: boolean;
  hasUnsavedChanges: boolean;
  onWeeklyDigestChange: (value: boolean) => void;
  onAiUsageAlertsChange: (value: boolean) => void;
  onProWaitlistUpdatesChange: (value: boolean) => void;
  onProductUpdatesChange: (value: boolean) => void;
  onReset: () => void;
  onSave: () => void;
}

export interface UseSettingsControllerArgs {
  user: User | null;
}

export interface UseSettingsControllerResult {
  activeTab: SettingsTabId;
  loading: boolean;
  saving: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  firstName: string;
  lastName: string;
  bio: string;
  avatarUrl: string | null;
  hasUnsavedChanges: boolean;
  setActiveTab: (tab: SettingsTabId) => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setBio: (value: string) => void;
  handleAvatarUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  saveProfile: () => Promise<void>;
  resetForm: () => void;
}

export interface UseNotificationSettingsControllerArgs {
  user: User | null;
}

export interface UseNotificationSettingsControllerResult {
  loading: boolean;
  saving: boolean;
  weeklyDigest: boolean;
  aiUsageAlerts: boolean;
  proWaitlistUpdates: boolean;
  productUpdates: boolean;
  hasUnsavedChanges: boolean;
  setWeeklyDigest: (value: boolean) => void;
  setAiUsageAlerts: (value: boolean) => void;
  setProWaitlistUpdates: (value: boolean) => void;
  setProductUpdates: (value: boolean) => void;
  savePreferences: () => Promise<void>;
  resetForm: () => void;
}
