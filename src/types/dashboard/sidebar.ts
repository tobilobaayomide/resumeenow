import type { IconType } from 'react-icons';

export interface DashboardNavItem {
  icon: IconType;
  label: string;
  path: string;
  proPage?: boolean;
}
