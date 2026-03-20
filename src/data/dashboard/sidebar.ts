import {
  FiBriefcase,
  FiFileText,
  FiGrid,
  FiLayout,
  FiSettings,
  FiStar,
} from 'react-icons/fi';
import type { DashboardNavItem } from '../../types/dashboard';

export const DASHBOARD_MAIN_MENU_ITEMS: DashboardNavItem[] = [
  { icon: FiGrid, label: 'Overview', path: '/dashboard' },
  { icon: FiFileText, label: 'My Resumes', path: '/dashboard/myresumes' },
  { icon: FiLayout, label: 'Templates', path: '/dashboard/templates' },
  { icon: FiStar, label: 'Pro Features', path: '/dashboard/pro', proPage: true },
];

export const DASHBOARD_PREFERENCES_ITEMS: DashboardNavItem[] = [
  { icon: FiBriefcase, label: 'Career Profile', path: '/dashboard/profile' },
  { icon: FiSettings, label: 'Settings', path: '/dashboard/settings' },
];

export const DASHBOARD_MOBILE_DOCK_ITEMS: DashboardNavItem[] = [
  DASHBOARD_MAIN_MENU_ITEMS[0],
  DASHBOARD_MAIN_MENU_ITEMS[1],
  DASHBOARD_MAIN_MENU_ITEMS[2],
  DASHBOARD_MAIN_MENU_ITEMS[3],
  DASHBOARD_PREFERENCES_ITEMS[0],
];
