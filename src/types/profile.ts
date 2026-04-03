export type ProfileRole = 'user' | 'admin' | 'super_admin';
export type AccountStatus = 'active' | 'suspended';

export const isAdminProfileRole = (role: ProfileRole): boolean =>
  role === 'admin' || role === 'super_admin';

export const isSuperAdminProfileRole = (role: ProfileRole): boolean =>
  role === 'super_admin';

export const isSuspendedAccountStatus = (status: AccountStatus): boolean =>
  status === 'suspended';
