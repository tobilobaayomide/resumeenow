import {
  FiBell,
  FiCreditCard,
  FiShield,
  FiUser,
} from 'react-icons/fi';
import type { SettingsTabItem } from '../../types/dashboard';

export const DASHBOARD_SETTINGS_TABS: SettingsTabItem[] = [
  { id: 'profile', label: 'General', icon: FiUser, description: 'Profile details & public info' },
  { id: 'account', label: 'Security', icon: FiShield, description: 'Password & authentication' },
  { id: 'billing', label: 'Billing', icon: FiCreditCard, description: 'Manage your subscription' },
  { id: 'notifications', label: 'Notifications', icon: FiBell, description: 'Email preferences' },
];
