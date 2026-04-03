import { useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiCheckCircle,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiStar,
  FiUser,
  FiUserX,
  FiUsers,
} from 'react-icons/fi';
import { toast } from 'sonner';
import AdminLayout from './AdminLayout';
import {
  fetchAdminUserDetail,
  fetchAdminUsers,
  getAdminUserDetailQueryKey,
  getAdminUsersQueryKey,
  runAdminUserAction,
} from '../../lib/queries/adminUsers';
import type {
  AdminUserAction,
  AdminUserRecord,
} from '../../types/admin';
import {
  formatAdminDateLabel,
  getAdminPlanBadgeClassName,
  getAdminPlanLabel,
  getAdminRoleBadgeClassName,
  getAdminRoleLabel,
  getAdminUsageLabel,
  isWithinRecentDays,
} from './adminDisplay';
import { getErrorMessage } from '../../lib/errors';
import { useAuth } from '../../context/useAuth';
import { isAdminProfileRole } from '../../types/profile';
import { useCurrentUserRole } from '../../hooks/useCurrentUserRole';

const EMPTY_USERS: AdminUserRecord[] = [];

type AccessFilter = 'all' | 'admins' | 'pro' | 'free' | 'waitlist';
type StatusFilter = 'all' | 'active' | 'suspended';
type UsersSortKey = 'newest' | 'last_seen' | 'ai_usage' | 'name';
type ActivityTab = 'resumes' | 'notifications';
type ActionTone = 'dark' | 'light' | 'danger';

interface ConfirmActionConfig {
  title: string;
  description: string;
  confirmLabel: string;
  requireEmailMatch?: boolean;
}

interface UserActionDescriptor {
  action: AdminUserAction | null;
  label: string;
  helper: string;
  tone: ActionTone;
  disabled?: boolean;
  confirm?: ConfirmActionConfig;
}

interface PendingConfirmationState {
  record: AdminUserRecord;
  descriptor: UserActionDescriptor;
}

const ACCESS_FILTER_OPTIONS: Array<{
  value: AccessFilter;
  label: string;
}> = [
  { value: 'all', label: 'All' },
  { value: 'admins', label: 'Admins' },
  { value: 'pro', label: 'Pro' },
  { value: 'free', label: 'Free' },
  { value: 'waitlist', label: 'Waitlist' },
];

const STATUS_FILTER_OPTIONS: Array<{
  value: StatusFilter;
  label: string;
}> = [
  { value: 'all', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const SORT_OPTIONS: Array<{
  value: UsersSortKey;
  label: string;
}> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'last_seen', label: 'Last seen' },
  { value: 'ai_usage', label: 'Highest AI usage' },
  { value: 'name', label: 'Name' },
];

const getUserDisplayName = (record: AdminUserRecord) =>
  record.fullName || record.email || 'Unnamed user';

const getUserInitials = (record: AdminUserRecord) => {
  const source = getUserDisplayName(record).trim();

  if (!source) {
    return 'U';
  }

  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
};

const getUserSummary = (record: AdminUserRecord) => {
  if (record.accountStatus === 'suspended') {
    return 'Access is blocked and the session is terminated until you restore the account.';
  }

  if (record.role === 'super_admin') {
    return 'Full platform control, admin role management, and unlimited AI access.';
  }

  if (record.role === 'admin') {
    return 'Internal admin access with unlimited AI workflows and admin console access.';
  }

  if (record.planTier === 'pro') {
    return 'Paid access is active on this account.';
  }

  if (record.waitlistJoinedAt) {
    return `Still on free access. Joined the Pro waitlist ${formatAdminDateLabel(record.waitlistJoinedAt)}.`;
  }

  return 'Free account with no Pro waitlist join yet.';
};

const toTimestamp = (value: string | null) => {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const SummaryCard = ({
  label,
  value,
  detail,
  icon: Icon,
  iconTone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof FiUsers;
  iconTone: string;
}) => (
  <article className="rounded-[1.7rem] border border-black/8 bg-white/88 p-4 shadow-[0_18px_56px_-44px_rgba(15,17,21,0.28)]">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
          {label}
        </p>
        <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-[#111111]">
          {value}
        </p>
      </div>
      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconTone}`}>
        <Icon size={17} />
      </span>
    </div>
    <p className="mt-3 text-[13px] leading-6 text-zinc-600">{detail}</p>
  </article>
);

const FilterChip = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
      active
        ? 'border-black bg-black text-white'
        : 'border-black/10 bg-white text-zinc-700 hover:border-black/20'
    }`}
  >
    {label}
  </button>
);

const ActionButton = ({
  descriptor,
  pending,
  onClick,
}: {
  descriptor: UserActionDescriptor;
  pending: boolean;
  onClick: () => void;
}) => {
  const className =
    descriptor.tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100'
      : descriptor.tone === 'dark'
        ? 'border-black bg-black text-white hover:bg-[#1e1a17]'
        : 'border-black/10 bg-white text-zinc-700 hover:border-black/20 hover:bg-[#f7f7f5]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={descriptor.disabled || pending}
      className={`rounded-[1.4rem] border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
    >
      <span className="block text-sm font-semibold">
        {pending ? 'Saving…' : descriptor.label}
      </span>
      <span className="mt-1 block text-[12px] leading-5 opacity-80">{descriptor.helper}</span>
    </button>
  );
};

const ConfirmationDialog = ({
  state,
  confirmationText,
  pending,
  onConfirmationTextChange,
  onCancel,
  onConfirm,
}: {
  state: PendingConfirmationState | null;
  confirmationText: string;
  pending: boolean;
  onConfirmationTextChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  if (!state) {
    return null;
  }

  const { record, descriptor } = state;
  const confirmConfig = descriptor.confirm;
  if (!confirmConfig || !descriptor.action) {
    return null;
  }

  const needsEmailMatch = confirmConfig.requireEmailMatch === true;
  const isMatch =
    !needsEmailMatch ||
    confirmationText.trim().toLowerCase() === record.email.trim().toLowerCase();

  return (
    <div
      className="fixed inset-0 z-90 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-md rounded-4xl border border-black/8 bg-white px-6 py-6 shadow-[0_32px_90px_-42px_rgba(15,17,21,0.36)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
          Confirm action
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
          {confirmConfig.title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-zinc-700">{confirmConfig.description}</p>

        {needsEmailMatch && (
          <label className="mt-5 block">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Type {record.email}
            </span>
            <input
              type="text"
              value={confirmationText}
              onChange={(event) => onConfirmationTextChange(event.target.value)}
              placeholder={record.email}
              className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf6f0] px-4 py-3 text-sm text-[#111111] outline-none transition focus:border-black/20 focus:bg-white"
            />
          </label>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-black/20 hover:bg-[#f7f7f5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || !isMatch}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              descriptor.tone === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-black hover:bg-[#1e1a17]'
            }`}
          >
            {pending ? 'Saving…' : confirmConfig.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminUsersView = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useCurrentUserRole();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<UsersSortKey>('newest');
  const [activityTab, setActivityTab] = useState<ActivityTab>('resumes');
  const [preferredSelectedUserId, setPreferredSelectedUserId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmationState | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const usersQuery = useQuery({
    queryKey: getAdminUsersQueryKey(),
    queryFn: fetchAdminUsers,
    staleTime: 30_000,
  });

  const users = usersQuery.data ?? EMPTY_USERS;
  const currentUserId = user?.id ?? null;
  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    const searchFilteredUsers = users.filter((record) => {
      if (statusFilter !== 'all' && record.accountStatus !== statusFilter) {
        return false;
      }

      if (accessFilter === 'admins' && !isAdminProfileRole(record.role)) {
        return false;
      }

      if (accessFilter === 'pro' && !(record.planTier === 'pro' || isAdminProfileRole(record.role))) {
        return false;
      }

      if (accessFilter === 'free' && (record.planTier !== 'free' || isAdminProfileRole(record.role))) {
        return false;
      }

      if (accessFilter === 'waitlist' && !record.waitlistJoinedAt) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        record.fullName,
        record.email,
        record.role,
        record.planTier,
        record.accountStatus,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });

    return [...searchFilteredUsers].sort((left, right) => {
      switch (sortKey) {
        case 'name':
          return getUserDisplayName(left).localeCompare(getUserDisplayName(right));
        case 'last_seen':
          return toTimestamp(right.lastSignInAt) - toTimestamp(left.lastSignInAt);
        case 'ai_usage':
          return right.aiCreditsUsed - left.aiCreditsUsed;
        case 'newest':
        default:
          return toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
      }
    });
  }, [accessFilter, normalizedQuery, sortKey, statusFilter, users]);

  const selectedUser =
    filteredUsers.find((record) => record.id === preferredSelectedUserId) ?? filteredUsers[0] ?? null;
  const selectedUserId = selectedUser?.id ?? null;

  const userDetailQuery = useQuery({
    queryKey: getAdminUserDetailQueryKey(selectedUserId),
    queryFn: () => fetchAdminUserDetail(selectedUserId as string),
    enabled: Boolean(selectedUserId),
    staleTime: 15_000,
  });

  const userActionMutation = useMutation({
    mutationFn: runAdminUserAction,
    onSuccess: async (result, variables) => {
      queryClient.setQueryData<AdminUserRecord[]>(
        getAdminUsersQueryKey(),
        (current = EMPTY_USERS) => {
          if (result.deletedUserId) {
            return current.filter((record) => record.id !== result.deletedUserId);
          }

          if (!result.user) {
            return current;
          }

          return current.map((record) => (record.id === result.user?.id ? result.user : record));
        },
      );

      if (result.deletedUserId) {
        queryClient.removeQueries({
          queryKey: getAdminUserDetailQueryKey(result.deletedUserId),
          exact: true,
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: getAdminUserDetailQueryKey(variables.userId),
          exact: true,
        });
      }

      setPendingConfirmation((current) => {
        if (!current) {
          return current;
        }

        return current.record.id === variables.userId &&
          current.descriptor.action === variables.action
          ? null
          : current;
      });
      setConfirmationText('');
      toast.success(result.message);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update this account.'));
    },
  });

  const totalUsers = users.length;
  const adminCount = users.filter((record) => isAdminProfileRole(record.role)).length;
  const proCount = users.filter(
    (record) => isAdminProfileRole(record.role) || record.planTier === 'pro',
  ).length;
  const suspendedCount = users.filter((record) => record.accountStatus === 'suspended').length;
  const newThisWeekCount = users.filter((record) => isWithinRecentDays(record.createdAt, 7)).length;

  const summaryCards = [
    {
      label: 'Accounts',
      value: totalUsers,
      detail: `${newThisWeekCount} joined this week`,
      icon: FiUsers,
      iconTone: 'bg-black text-white',
    },
    {
      label: 'Admins',
      value: adminCount,
      detail: `${Math.max(totalUsers - adminCount, 0)} user accounts`,
      icon: FiShield,
      iconTone: 'bg-[#f3f4f6] text-[#111111]',
    },
    {
      label: 'Pro access',
      value: proCount,
      detail: `${Math.max(totalUsers - proCount, 0)} still on free`,
      icon: FiStar,
      iconTone: 'bg-[#fff5e8] text-[#c2410c]',
    },
    {
      label: 'Suspended',
      value: suspendedCount,
      detail: `${Math.max(totalUsers - suspendedCount, 0)} currently active`,
      icon: FiUserX,
      iconTone: 'bg-rose-50 text-rose-700',
    },
  ] as const;

  const visibleCountLabel =
    filteredUsers.length === totalUsers
      ? `${filteredUsers.length} visible`
      : `${filteredUsers.length} of ${totalUsers} visible`;

  const getRoleAction = (record: AdminUserRecord): UserActionDescriptor => {
    if (!isSuperAdmin) {
      return {
        action: null,
        label: 'Role locked',
        helper: 'Super admin only.',
        tone: 'light',
        disabled: true,
      };
    }

    if (record.role === 'super_admin') {
      return {
        action: null,
        label: 'Super admin',
        helper: 'Role changes stay locked.',
        tone: 'light',
        disabled: true,
      };
    }

    if (record.role === 'admin') {
      return {
        action: record.id === currentUserId ? null : 'demote_admin',
        label: record.id === currentUserId ? 'Current admin' : 'Remove admin',
        helper:
          record.id === currentUserId
            ? 'Your own role stays locked here.'
            : 'Return this account to normal user access.',
        tone: 'light',
        disabled: record.id === currentUserId,
        confirm:
          record.id === currentUserId
            ? undefined
            : {
                title: `Remove admin access for ${getUserDisplayName(record)}?`,
                description:
                  'This user will lose admin console access and go back to the normal user workspace.',
                confirmLabel: 'Remove admin',
              },
      };
    }

    return {
      action: 'promote_admin',
      label: 'Make admin',
      helper: 'Grant admin tools and unlimited AI.',
      tone: 'dark',
      confirm: {
        title: `Promote ${getUserDisplayName(record)} to admin?`,
        description:
          'They will gain admin console access, unlimited AI tools, and internal controls.',
        confirmLabel: 'Grant admin',
      },
    };
  };

  const getPlanAction = (record: AdminUserRecord): UserActionDescriptor => {
    if (record.role !== 'user') {
      return {
        action: null,
        label: 'Unlimited already',
        helper: 'Admin roles already carry Pro access.',
        tone: 'light',
        disabled: true,
      };
    }

    if (record.planTier === 'pro') {
      return {
        action: 'revoke_pro',
        label: 'Remove Pro',
        helper: 'Move this account back to free.',
        tone: 'light',
        confirm: {
          title: `Remove Pro access for ${getUserDisplayName(record)}?`,
          description:
            'This account will go back to the free plan immediately. Their saved data stays intact.',
          confirmLabel: 'Remove Pro',
        },
      };
    }

    return {
      action: 'grant_pro',
      label: 'Grant Pro',
      helper: 'Turn on paid access and clear waitlist state.',
      tone: 'dark',
    };
  };

  const getAccountAction = (record: AdminUserRecord): UserActionDescriptor => {
    if (record.role === 'super_admin') {
      return {
        action: null,
        label: 'Protected account',
        helper: 'Super admin accounts stay protected.',
        tone: 'light',
        disabled: true,
      };
    }

    if (record.accountStatus === 'suspended') {
      return {
        action: 'unsuspend_user',
        label: 'Restore access',
        helper: 'Let this user sign in again.',
        tone: 'light',
        confirm: {
          title: `Restore ${getUserDisplayName(record)}?`,
          description:
            'This account will be marked active again and the user can sign back in immediately.',
          confirmLabel: 'Restore access',
        },
      };
    }

    return {
      action: record.id === currentUserId ? null : 'suspend_user',
      label: record.id === currentUserId ? 'Current account' : 'Suspend user',
      helper:
        record.id === currentUserId
          ? 'You cannot suspend yourself here.'
          : 'Block access and sign out the user.',
      tone: 'light',
      disabled: record.id === currentUserId,
      confirm:
        record.id === currentUserId
          ? undefined
          : {
              title: `Suspend ${getUserDisplayName(record)}?`,
              description:
                'The account will be signed out immediately and blocked until you restore it.',
              confirmLabel: 'Suspend user',
            },
    };
  };

  const getResetAiAction = (record: AdminUserRecord): UserActionDescriptor => {
    if (record.role !== 'user') {
      return {
        action: null,
        label: 'Unlimited AI',
        helper: 'No daily reset needed for admin accounts.',
        tone: 'light',
        disabled: true,
      };
    }

    return {
      action: 'reset_ai_usage',
      label: 'Reset AI usage',
      helper: 'Clear daily AI credits and request windows.',
      tone: 'light',
      confirm: {
        title: `Reset AI usage for ${getUserDisplayName(record)}?`,
        description:
          'Today’s AI usage and short request-window counters will be cleared for this account.',
        confirmLabel: 'Reset usage',
      },
    };
  };

  const getWelcomeAction = (record: AdminUserRecord): UserActionDescriptor => ({
    action: record.email ? 'resend_welcome_email' : null,
    label: 'Resend welcome',
    helper: record.email
      ? 'Send the workspace-ready email again.'
      : 'This account has no valid email address.',
    tone: 'light',
    disabled: !record.email,
  });

  const getDeleteAction = (record: AdminUserRecord): UserActionDescriptor => {
    if (!isSuperAdmin || record.role === 'super_admin' || record.id === currentUserId) {
      return {
        action: null,
        label: 'Delete locked',
        helper: 'Super admin only.',
        tone: 'danger',
        disabled: true,
      };
    }

    return {
      action: 'delete_user',
      label: 'Delete user',
      helper: 'Remove auth and linked app data permanently.',
      tone: 'danger',
      confirm: {
        title: `Delete ${getUserDisplayName(record)} permanently?`,
        description:
          'This removes the auth account plus stored product data. Type the email to confirm.',
        confirmLabel: 'Delete account',
        requireEmailMatch: true,
      },
    };
  };

  const openAction = (record: AdminUserRecord, descriptor: UserActionDescriptor) => {
    if (!descriptor.action || descriptor.disabled) {
      return;
    }

    if (descriptor.confirm) {
      setPendingConfirmation({ record, descriptor });
      setConfirmationText('');
      return;
    }

    userActionMutation.mutate({
      userId: record.id,
      action: descriptor.action,
    });
  };

  const confirmPendingAction = () => {
    if (!pendingConfirmation?.descriptor.action) {
      return;
    }

    userActionMutation.mutate({
      userId: pendingConfirmation.record.id,
      action: pendingConfirmation.descriptor.action,
    });
  };

  const selectedDetail =
    userDetailQuery.data && userDetailQuery.data.user.id === selectedUserId
      ? userDetailQuery.data
      : null;

  const selectedDescriptors = selectedUser
    ? [
        getRoleAction(selectedUser),
        getPlanAction(selectedUser),
        getAccountAction(selectedUser),
        getResetAiAction(selectedUser),
        getWelcomeAction(selectedUser),
        getDeleteAction(selectedUser),
      ]
    : [];

  const activityTabs: Array<{
    value: ActivityTab;
    label: string;
    count: number;
  }> = [
    {
      value: 'resumes',
      label: 'Resumes',
      count: selectedDetail?.resumeCount ?? 0,
    },
    {
      value: 'notifications',
      label: 'Notifications',
      count: selectedDetail?.recentNotifications.length ?? 0,
    },
  ];

  const confirmationPending =
    userActionMutation.isPending &&
    pendingConfirmation?.descriptor.action === userActionMutation.variables?.action &&
    pendingConfirmation.record.id === userActionMutation.variables?.userId;

  return (
    <AdminLayout
      eyebrow="Accounts"
      title="Review accounts, access, and account health"
      description="Search the user base, inspect one account at a time, and handle role, plan, support, and cleanup actions from one tighter internal workspace."
    >
      <section className="space-y-6">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.label}
              label={card.label}
              value={usersQuery.isPending ? 0 : card.value}
              detail={card.detail}
              icon={card.icon}
              iconTone={card.iconTone}
            />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25.5rem]">
          <section className="rounded-4xlrder border-black/8 bg-[#f9fafb]/94 p-4 shadow-[0_26px_72px_-56px_rgba(15,17,21,0.22)] md:p-6">
            <div className="flex flex-col gap-4 border-b border-black/8 pb-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                    Directory
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                    Search and triage accounts
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                    {usersQuery.isPending ? 'Loading' : visibleCountLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void usersQuery.refetch();
                      if (selectedUserId) {
                        void userDetailQuery.refetch();
                      }
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-black/20 hover:bg-[#f7f7f5]"
                  >
                    <FiRefreshCw size={15} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
                <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-[0_18px_40px_-34px_rgba(15,17,21,0.22)]">
                  <FiSearch className="shrink-0 text-zinc-500" size={16} />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by name, email, role, or plan"
                    className="w-full bg-transparent text-sm text-[#111111] outline-none placeholder:text-zinc-500"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-700 shadow-[0_18px_40px_-34px_rgba(15,17,21,0.22)]">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Sort
                  </span>
                  <select
                    value={sortKey}
                    onChange={(event) => setSortKey(event.target.value as UsersSortKey)}
                    className="w-full bg-transparent font-semibold text-[#111111] outline-none"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {ACCESS_FILTER_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      active={accessFilter === option.value}
                      label={option.label}
                      onClick={() => setAccessFilter(option.value)}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      active={statusFilter === option.value}
                      label={option.label}
                      onClick={() => setStatusFilter(option.value)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {usersQuery.isPending && (
              <div className="mt-5 rounded-3xler border-dashed border-black/10 bg-white/70 px-5 py-12 text-center text-sm text-zinc-600">
                Loading accounts…
              </div>
            )}

            {usersQuery.isError && (
              <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-6">
                <p className="text-sm font-semibold text-rose-700">Failed to load accounts.</p>
                <p className="mt-2 text-sm leading-7 text-rose-700/80">
                  {usersQuery.error instanceof Error
                    ? usersQuery.error.message
                    : 'An unexpected admin API error occurred.'}
                </p>
              </div>
            )}

            {!usersQuery.isPending && !usersQuery.isError && filteredUsers.length === 0 && (
              <div className="mt-5 rounded-3xl border border-dashed border-black/10 bg-white/70 px-5 py-12 text-center text-sm text-zinc-600">
                No accounts matched your current filters.
              </div>
            )}

            {!usersQuery.isPending && !usersQuery.isError && filteredUsers.length > 0 && (
              <div className="mt-5 overflow-hidden rounded-[1.7rem] border border-black/8 bg-white">
                <div className="max-h-[calc(100vh-23rem)] overflow-y-auto">
                  {filteredUsers.map((record) => {
                    const isSelected = record.id === selectedUserId;

                    return (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => setPreferredSelectedUserId(record.id)}
                        className={`w-full border-b border-black/6 px-4 py-4 text-left transition last:border-b-0 md:px-5 ${
                          isSelected
                            ? 'bg-[#0f1115] text-white'
                            : 'bg-white hover:bg-[#f5f6f8]'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                              isSelected
                                ? 'bg-white text-[#111111]'
                                : 'bg-black text-white'
                            }`}
                          >
                            {getUserInitials(record)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-[15px] font-semibold">
                                {getUserDisplayName(record)}
                              </h3>
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  record.accountStatus === 'suspended'
                                    ? isSelected
                                      ? 'border-white/20 bg-white/10 text-white'
                                      : 'border-rose-200 bg-rose-50 text-rose-700'
                                    : isSelected
                                      ? 'border-white/20 bg-white/10 text-white'
                                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {record.accountStatus}
                              </span>
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  isSelected
                                    ? 'border-white/20 bg-white/10 text-white'
                                    : getAdminRoleBadgeClassName(record.role)
                                }`}
                              >
                                {getAdminRoleLabel(record.role)}
                              </span>
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  isSelected
                                    ? 'border-white/20 bg-white/10 text-white'
                                    : getAdminPlanBadgeClassName(record)
                                }`}
                              >
                                {getAdminPlanLabel(record)}
                              </span>
                              {record.waitlistJoinedAt && record.role === 'user' && (
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                    isSelected
                                      ? 'border-white/20 bg-white/10 text-white'
                                      : 'border-[#f0d7b3] bg-[#fff5e8] text-[#b45309]'
                                  }`}
                                >
                                  Waitlist
                                </span>
                              )}
                            </div>

                            <p
                              className={`mt-1 truncate text-[13px] ${
                                isSelected ? 'text-zinc-300' : 'text-zinc-600'
                              }`}
                            >
                              {record.email || 'No email'}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {[
                                `Joined ${formatAdminDateLabel(record.createdAt)}`,
                                `Last seen ${formatAdminDateLabel(record.lastSignInAt)}`,
                                `AI today ${getAdminUsageLabel(record)}`,
                              ].map((item) => (
                                <span
                                  key={`${record.id}-${item}`}
                                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                                    isSelected
                                      ? 'border-white/10 bg-white/6 text-zinc-200'
                                      : 'border-black/8 bg-[#f7f7f5] text-zinc-600'
                                  }`}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            {!selectedUser && (
              <section className="rounded-4xl border border-dashed border-black/10 bg-white/80 px-5 py-10 text-sm text-zinc-600">
                Choose an account from the list to inspect access, usage, and recent activity.
              </section>
            )}

            {selectedUser && (
              <>
                <section className="rounded-4xl border border-black/8 bg-[#0f1115] px-5 py-5 text-white shadow-[0_26px_72px_-56px_rgba(15,17,21,0.32)] md:px-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] bg-white text-lg font-bold text-[#111111]">
                      {getUserInitials(selectedUser)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                        Selected account
                      </p>
                      <h3 className="mt-2 truncate text-2xl font-semibold tracking-[-0.04em]">
                        {getUserDisplayName(selectedUser)}
                      </h3>
                      <p className="mt-1 truncate text-sm text-zinc-300">
                        {selectedUser.email || 'No email'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                      {getAdminRoleLabel(selectedUser.role)}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                      {getAdminPlanLabel(selectedUser)}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                      {selectedUser.accountStatus}
                    </span>
                    {selectedUser.waitlistJoinedAt && selectedUser.role === 'user' && (
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                        Waitlist
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-7 text-zinc-300">{getUserSummary(selectedUser)}</p>
                </section>

                <section className="rounded-4xl border border-black/8 bg-white/92 p-5 shadow-[0_26px_72px_-56px_rgba(15,17,21,0.22)] md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                        Inspector
                      </p>
                      <h4 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#111111]">
                        Access and controls
                      </h4>
                    </div>
                    {selectedUserId && (
                      <button
                        type="button"
                        onClick={() => {
                          void userDetailQuery.refetch();
                        }}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 text-sm font-semibold text-zinc-700 transition hover:border-black/20 hover:bg-white"
                      >
                        <FiRefreshCw size={14} />
                        Refresh
                      </button>
                    )}
                  </div>

                  {userDetailQuery.isLoading && (
                    <div className="mt-5 rounded-[1.4rem] border border-dashed border-black/10 bg-[#f7f7f5] px-4 py-8 text-center text-sm text-zinc-600">
                      Loading detail…
                    </div>
                  )}

                  {userDetailQuery.isError && (
                    <div className="mt-5 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-5">
                      <p className="text-sm font-semibold text-rose-700">Failed to load account detail.</p>
                      <p className="mt-2 text-sm leading-7 text-rose-700/80">
                        {userDetailQuery.error instanceof Error
                          ? userDetailQuery.error.message
                          : 'An unexpected admin API error occurred.'}
                      </p>
                    </div>
                  )}

                  {!userDetailQuery.isLoading && !userDetailQuery.isError && selectedDetail && (
                    <div className="mt-5 space-y-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          {
                            label: 'Resumes',
                            value: selectedDetail.resumeCount,
                            icon: FiUser,
                          },
                          {
                            label: 'Notifications sent',
                            value: selectedDetail.sentNotificationCount,
                            icon: FiMail,
                          },
                          {
                            label: 'Campaign entries',
                            value: selectedDetail.campaignNotificationCount,
                            icon: FiCheckCircle,
                          },
                          {
                            label: 'Failed sends',
                            value: selectedDetail.failedNotificationCount,
                            icon: FiUserX,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-[1.4rem] border border-black/8 bg-[#f7f7f5] px-4 py-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                                {item.label}
                              </p>
                              <item.icon size={15} className="text-zinc-500" />
                            </div>
                            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 border-t border-black/8 pt-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                              Actions
                            </p>
                            <p className="mt-2 text-sm text-zinc-600">
                              Change access, handle support, or clean up the account.
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {selectedDescriptors.map((descriptor) => {
                            const pending =
                              userActionMutation.isPending &&
                              userActionMutation.variables?.userId === selectedUser.id &&
                              userActionMutation.variables?.action === descriptor.action;

                            return (
                              <ActionButton
                                key={`${selectedUser.id}-${descriptor.label}`}
                                descriptor={descriptor}
                                pending={pending}
                                onClick={() => openAction(selectedUser, descriptor)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-4xl border border-black/8 bg-white/92 p-5 shadow-[0_26px_72px_-56px_rgba(15,17,21,0.22)] md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                        Activity
                      </p>
                      <h4 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#111111]">
                        Recent drafts and sends
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activityTabs.map((tab) => (
                        <button
                          key={tab.value}
                          type="button"
                          onClick={() => setActivityTab(tab.value)}
                          className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                            activityTab === tab.value
                              ? 'border-black bg-black text-white'
                              : 'border-black/10 bg-[#f7f7f5] text-zinc-700 hover:border-black/20'
                          }`}
                        >
                          {tab.label} · {tab.count}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {userDetailQuery.isLoading && !selectedDetail ? (
                      <div className="rounded-[1.35rem] border border-dashed border-black/10 bg-[#f7f7f5] px-4 py-6 text-sm text-zinc-600">
                        Loading recent activity…
                      </div>
                    ) : activityTab === 'resumes' ? (
                      selectedDetail && selectedDetail.recentResumes.length > 0 ? (
                        selectedDetail.recentResumes.map((resume) => (
                          <article
                            key={resume.id}
                            className="rounded-[1.35rem] border border-black/8 bg-[#f7f7f5] px-4 py-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <h5 className="truncate text-sm font-semibold text-[#111111]">
                                  {resume.title}
                                </h5>
                                <p className="mt-1 text-[12px] uppercase tracking-[0.12em] text-zinc-500">
                                  {resume.templateId}
                                </p>
                              </div>
                              <span className="text-[12px] font-medium text-zinc-500">
                                {formatAdminDateLabel(resume.updatedAt)}
                              </span>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="rounded-[1.35rem] border border-dashed border-black/10 bg-[#f7f7f5] px-4 py-6 text-sm text-zinc-600">
                          No resumes saved yet.
                        </div>
                      )
                    ) : (
                      selectedDetail && selectedDetail.recentNotifications.length > 0 ? (
                        selectedDetail.recentNotifications.map((notification) => (
                          <article
                            key={notification.id}
                            className="rounded-[1.35rem] border border-black/8 bg-[#f7f7f5] px-4 py-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-sm font-semibold text-[#111111]">
                                {notification.title}
                              </h5>
                              <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
                                {notification.channelLabel}
                              </span>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  notification.status === 'failed'
                                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                                    : notification.status === 'sent'
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                      : 'border-black/10 bg-white text-zinc-700'
                                }`}
                              >
                                {notification.status}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-zinc-600">
                              {notification.description}
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-3 text-[12px] text-zinc-500">
                              <span>{formatAdminDateLabel(notification.createdAt)}</span>
                              {notification.sentAt ? (
                                <span>Sent {formatAdminDateLabel(notification.sentAt)}</span>
                              ) : (
                                <span>Not sent yet</span>
                              )}
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="rounded-[1.35rem] border border-dashed border-black/10 bg-[#f7f7f5] px-4 py-6 text-sm text-zinc-600">
                          No recent notification history for this account.
                        </div>
                      )
                    )}
                  </div>
                </section>
              </>
            )}
          </section>
        </section>
      </section>

      <ConfirmationDialog
        state={pendingConfirmation}
        confirmationText={confirmationText}
        pending={confirmationPending}
        onConfirmationTextChange={setConfirmationText}
        onCancel={() => {
          if (confirmationPending) {
            return;
          }

          setPendingConfirmation(null);
          setConfirmationText('');
        }}
        onConfirm={confirmPendingAction}
      />
    </AdminLayout>
  );
};

export default AdminUsersView;
