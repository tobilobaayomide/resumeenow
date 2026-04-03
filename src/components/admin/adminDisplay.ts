import type { AdminUserRecord } from '../../types/admin';

const adminDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const formatAdminDateLabel = (value: string | null): string => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return adminDateFormatter.format(parsed);
};

export const getAdminRoleBadgeClassName = (role: AdminUserRecord['role']) =>
  role === 'super_admin'
    ? 'border-[#7c2d12] bg-[#7c2d12] text-white'
    : role === 'admin'
      ? 'border-black bg-black text-white'
      : 'border-zinc-200 bg-zinc-50 text-zinc-700';

export const getAdminRoleLabel = (role: AdminUserRecord['role']) =>
  role === 'super_admin' ? 'Super admin' : role === 'admin' ? 'Admin' : 'User';

export const getAdminPlanBadgeClassName = (record: AdminUserRecord) =>
  record.role !== 'user'
    ? 'border-slate-900 bg-slate-900 text-white'
    : record.planTier === 'pro'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-zinc-200 bg-zinc-100 text-zinc-700';

export const getAdminPlanLabel = (record: AdminUserRecord) =>
  record.role === 'super_admin'
    ? 'Super admin'
    : record.role === 'admin'
      ? 'Admin'
    : record.planTier === 'pro'
      ? 'Pro'
      : 'Free';

export const getAdminUsageLabel = (record: AdminUserRecord) =>
  record.role !== 'user' ? 'Unlimited access' : `${record.aiCreditsUsed} used`;

export const isWithinRecentDays = (value: string | null, days: number): boolean => {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return parsed.getTime() >= cutoff;
};
