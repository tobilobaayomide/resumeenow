import { useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiTrendingUp,
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
import type { AdminUserAction, AdminUserRecord } from '../../types/admin';
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

const EMPTY_WAITLIST_USERS: AdminUserRecord[] = [];

type WaitlistSegment = 'all' | 'recent' | 'free' | 'internal';
type ActionTone = 'dark' | 'light';

interface WaitlistActionDescriptor {
  action: AdminUserAction | null;
  label: string;
  helper: string;
  tone: ActionTone;
  disabled?: boolean;
  confirm?: {
    title: string;
    description: string;
    confirmLabel: string;
  };
}

interface PendingConfirmationState {
  record: AdminUserRecord;
  descriptor: WaitlistActionDescriptor;
}

const WAITLIST_SEGMENTS: Array<{
  value: WaitlistSegment;
  label: string;
}> = [
  { value: 'all', label: 'All joins' },
  { value: 'recent', label: 'Last 7 days' },
  { value: 'free', label: 'Free only' },
  { value: 'internal', label: 'Internal' },
];

const byWaitlistJoinDescending = (left: AdminUserRecord, right: AdminUserRecord) => {
  const leftTime = left.waitlistJoinedAt ? new Date(left.waitlistJoinedAt).getTime() : 0;
  const rightTime = right.waitlistJoinedAt ? new Date(right.waitlistJoinedAt).getTime() : 0;
  return rightTime - leftTime;
};

const getWaitlistDisplayName = (record: AdminUserRecord) =>
  record.fullName || record.email || 'Unnamed user';

const getWaitlistInitials = (record: AdminUserRecord) => {
  const source = getWaitlistDisplayName(record).trim();

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

const getWaitlistLeadNote = (record: AdminUserRecord) => {
  if (record.accountStatus === 'suspended') {
    return 'This account is suspended. Restore access before treating the waitlist join as a live lead.';
  }

  if (record.role === 'super_admin') {
    return 'Super admin account. This join is internal, not part of your launch audience.';
  }

  if (record.role === 'admin') {
    return 'Admin account. Useful for internal testing, but not part of the normal launch cohort.';
  }

  if (record.planTier === 'pro') {
    return 'Already on Pro. This is likely a migrated or manually upgraded account rather than a current lead.';
  }

  if (isWithinRecentDays(record.waitlistJoinedAt, 7) && isWithinRecentDays(record.lastSignInAt, 14)) {
    return 'Recent join and recently active. This is one of the strongest upgrade or launch targets.';
  }

  if (isWithinRecentDays(record.waitlistJoinedAt, 30)) {
    return 'Joined recently enough to still be useful for launch follow-up or pricing updates.';
  }

  return 'Older waitlist join. Better for broader launch messaging than for a first-release handoff.';
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
  <article className="rounded-[1.45rem] border border-black/8 bg-white/88 p-3.5 shadow-[0_18px_56px_-44px_rgba(15,17,21,0.28)]">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
          {label}
        </p>
        <p className="mt-2.5 text-[1.8rem] font-semibold tracking-[-0.05em] text-[#111111]">
          {value}
        </p>
      </div>
      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconTone}`}>
        <Icon size={17} />
      </span>
    </div>
    <p className="mt-2.5 text-[12px] leading-5 text-zinc-600">{detail}</p>
  </article>
);

const SegmentChip = ({
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

const MetricTile = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="rounded-[1.2rem] border border-black/8 bg-[#f7f7f5] px-3.5 py-3.5">
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
      {label}
    </p>
    <p className="mt-2 text-[1.3rem] font-semibold tracking-[-0.04em] text-[#111111]">
      {value}
    </p>
  </div>
);

const ActionButton = ({
  descriptor,
  pending,
  onClick,
}: {
  descriptor: WaitlistActionDescriptor;
  pending: boolean;
  onClick: () => void;
}) => {
  const className =
    descriptor.tone === 'dark'
      ? 'border-black bg-black text-white hover:bg-[#1e1a17]'
      : 'border-black/10 bg-white text-zinc-700 hover:border-black/20 hover:bg-[#f7f7f5]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={descriptor.disabled || pending}
      className={`rounded-[1.3rem] border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
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
  pending,
  onCancel,
  onConfirm,
}: {
  state: PendingConfirmationState | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  if (!state?.descriptor.confirm) {
    return null;
  }

  const { confirm } = state.descriptor;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-md rounded-[2rem] border border-black/8 bg-white px-6 py-6 shadow-[0_32px_90px_-42px_rgba(15,17,21,0.36)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
          Confirm action
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
          {confirm.title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-zinc-700">{confirm.description}</p>

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
            disabled={pending}
            className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e1a17] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Saving…' : confirm.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminWaitlistView = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [segment, setSegment] = useState<WaitlistSegment>('all');
  const [preferredSelectedUserId, setPreferredSelectedUserId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmationState | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const usersQuery = useQuery({
    queryKey: getAdminUsersQueryKey(),
    queryFn: fetchAdminUsers,
    staleTime: 30_000,
  });

  const users = usersQuery.data ?? EMPTY_WAITLIST_USERS;
  const currentUserId = user?.id ?? null;

  const waitlistUsers = useMemo(
    () =>
      [...users]
        .filter((record) => record.waitlistJoinedAt !== null)
        .sort(byWaitlistJoinDescending),
    [users],
  );

  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredWaitlistUsers = useMemo(() => {
    const segmentFiltered = waitlistUsers.filter((record) => {
      if (segment === 'recent' && !isWithinRecentDays(record.waitlistJoinedAt, 7)) {
        return false;
      }

      if (
        segment === 'free' &&
        (record.planTier !== 'free' || isAdminProfileRole(record.role))
      ) {
        return false;
      }

      if (
        segment === 'internal' &&
        !(
          isAdminProfileRole(record.role) ||
          record.planTier === 'pro' ||
          record.accountStatus === 'suspended'
        )
      ) {
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

    return segmentFiltered;
  }, [normalizedQuery, segment, waitlistUsers]);

  const selectedUser =
    filteredWaitlistUsers.find((record) => record.id === preferredSelectedUserId) ??
    filteredWaitlistUsers[0] ??
    null;
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
        (current = EMPTY_WAITLIST_USERS) => {
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

      setPendingConfirmation(null);
      toast.success(result.message);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update this waitlist account.'));
    },
  });

  const selectedDetail =
    userDetailQuery.data && userDetailQuery.data.user.id === selectedUserId
      ? userDetailQuery.data
      : null;

  const waitlistCount = waitlistUsers.length;
  const recentCount = waitlistUsers.filter((record) =>
    isWithinRecentDays(record.waitlistJoinedAt, 7),
  ).length;
  const freeLeadCount = waitlistUsers.filter(
    (record) => record.planTier === 'free' && !isAdminProfileRole(record.role),
  ).length;
  const internalCount = waitlistUsers.filter(
    (record) =>
      isAdminProfileRole(record.role) ||
      record.planTier === 'pro' ||
      record.accountStatus === 'suspended',
  ).length;

  const summaryCards = [
    {
      label: 'Waitlist',
      value: waitlistCount,
      detail: `${filteredWaitlistUsers.length} in the current view`,
      icon: FiUsers,
      iconTone: 'bg-black text-white',
    },
    {
      label: 'Joined 7d',
      value: recentCount,
      detail: 'Recent demand worth checking first',
      icon: FiTrendingUp,
      iconTone: 'bg-[#fff2e8] text-[#c2410c]',
    },
    {
      label: 'Free leads',
      value: freeLeadCount,
      detail: 'Best-fit audience for launch follow-up',
      icon: FiStar,
      iconTone: 'bg-[#fef3c7] text-[#92400e]',
    },
    {
      label: 'Internal',
      value: internalCount,
      detail: 'Admins, upgraded users, or suspended accounts',
      icon: FiClock,
      iconTone: 'bg-zinc-100 text-zinc-700',
    },
  ] as const;

  const getPlanAction = (record: AdminUserRecord): WaitlistActionDescriptor => {
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
        action: null,
        label: 'Already on Pro',
        helper: 'This lead is already upgraded.',
        tone: 'light',
        disabled: true,
      };
    }

    return {
      action: 'grant_pro',
      label: 'Grant Pro',
      helper: 'Upgrade now and clear the waitlist join.',
      tone: 'dark',
      confirm: {
        title: `Grant Pro to ${getWaitlistDisplayName(record)}?`,
        description:
          'This will move the account onto Pro immediately and remove it from the waitlist.',
        confirmLabel: 'Grant Pro',
      },
    };
  };

  const getAccountAction = (record: AdminUserRecord): WaitlistActionDescriptor => {
    if (record.accountStatus === 'suspended') {
      return {
        action: 'unsuspend_user',
        label: 'Restore access',
        helper: 'Let this user sign in again.',
        tone: 'light',
        confirm: {
          title: `Restore ${getWaitlistDisplayName(record)}?`,
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
          : 'Block access and sign the user out.',
      tone: 'light',
      disabled: record.id === currentUserId,
      confirm:
        record.id === currentUserId
          ? undefined
          : {
              title: `Suspend ${getWaitlistDisplayName(record)}?`,
              description:
                'The account will be signed out immediately and blocked until you restore it.',
              confirmLabel: 'Suspend user',
            },
    };
  };

  const getWelcomeAction = (record: AdminUserRecord): WaitlistActionDescriptor => ({
    action: record.email ? 'resend_welcome_email' : null,
    label: 'Resend welcome',
    helper: record.email
      ? 'Send the onboarding email again.'
      : 'This account has no valid email address.',
    tone: 'light',
    disabled: !record.email,
  });

  const selectedActions = selectedUser
    ? [getPlanAction(selectedUser), getAccountAction(selectedUser), getWelcomeAction(selectedUser)]
    : [];

  const openAction = (record: AdminUserRecord, descriptor: WaitlistActionDescriptor) => {
    if (!descriptor.action || descriptor.disabled) {
      return;
    }

    if (descriptor.confirm) {
      setPendingConfirmation({ record, descriptor });
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

  return (
    <AdminLayout
      eyebrow="Pro interest"
      title="Review and work the waitlist"
      description="See who asked for Pro, filter the strongest leads first, and handle upgrades or account follow-up without leaving the admin workspace."
    >
      <section className="space-y-5">
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

        <section className="overflow-hidden rounded-[1.9rem] border border-black/8 bg-white/92 shadow-[0_26px_72px_-56px_rgba(15,17,21,0.22)]">
          <div className="grid xl:grid-cols-[23rem_minmax(0,1fr)]">
            <section className="border-b border-black/8 px-4 py-4 xl:min-h-[42rem] xl:border-b-0 xl:border-r xl:px-5 xl:py-5">
              <div className="border-b border-black/8 pb-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                      Waitlist
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#111111]">
                      Search current Pro interest
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">
                      Filter the list, open one person at a time, and decide whether they should be upgraded, contacted, or left for the broader launch.
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-3">
                    <label className="flex items-center gap-3 rounded-[1.2rem] border border-black/10 bg-white px-3.5 py-3">
                      <FiSearch className="shrink-0 text-zinc-500" size={16} />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search by name, email, role, or plan"
                        className="w-full bg-transparent text-sm text-[#111111] outline-none placeholder:text-zinc-500"
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {WAITLIST_SEGMENTS.map((option) => (
                        <SegmentChip
                          key={option.value}
                          active={segment === option.value}
                          label={option.label}
                          onClick={() => setSegment(option.value)}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        void usersQuery.refetch();
                      }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[1.2rem] border border-black/10 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-black/20 hover:bg-[#f7f7f5]"
                    >
                      <FiRefreshCw size={15} />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              {usersQuery.isPending && (
                <div className="mt-4 rounded-[1.35rem] border border-dashed border-black/10 bg-[#f9fafb] px-5 py-8 text-center text-sm text-zinc-600">
                  Loading waitlist…
                </div>
              )}

              {usersQuery.isError && (
                <div className="mt-4 rounded-[1.35rem] border border-rose-200 bg-rose-50 px-5 py-5">
                  <p className="text-sm font-semibold text-rose-700">Failed to load waitlist.</p>
                  <p className="mt-2 text-sm leading-7 text-rose-700/80">
                    {usersQuery.error instanceof Error
                      ? usersQuery.error.message
                      : 'An unexpected admin API error occurred.'}
                  </p>
                </div>
              )}

              {!usersQuery.isPending && !usersQuery.isError && filteredWaitlistUsers.length === 0 && (
                <div className="mt-4 rounded-[1.35rem] border border-dashed border-black/10 bg-[#f9fafb] px-5 py-8 text-center text-sm text-zinc-600">
                  No waitlist records matched your current filters.
                </div>
              )}

              {!usersQuery.isPending && !usersQuery.isError && filteredWaitlistUsers.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  {filteredWaitlistUsers.map((record) => {
                    const isSelected = record.id === selectedUser?.id;

                    return (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => setPreferredSelectedUserId(record.id)}
                        className={`w-full rounded-[1.35rem] border px-4 py-3.5 text-left transition ${
                          isSelected
                            ? 'border-black bg-[#0f1115] text-white shadow-[0_24px_56px_-42px_rgba(15,17,21,0.48)]'
                            : 'border-black/8 bg-[#f8f8f7] text-[#111111] hover:border-black/15 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 gap-3">
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border text-[12px] font-semibold ${
                                isSelected
                                  ? 'border-white/15 bg-white/10 text-white'
                                  : 'border-black/10 bg-white text-zinc-700'
                              }`}
                            >
                              {getWaitlistInitials(record)}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-[14px] font-semibold">
                                  {getWaitlistDisplayName(record)}
                                </h3>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                    isSelected
                                      ? 'border-white/20 bg-white/10 text-white'
                                      : 'border-black/10 bg-white text-zinc-700'
                                  }`}
                                >
                                  {getAdminPlanLabel(record)}
                                </span>
                              </div>
                              <p
                                className={`mt-1 truncate text-[12px] ${
                                  isSelected ? 'text-zinc-300' : 'text-zinc-600'
                                }`}
                              >
                                {record.email}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 text-[12px] font-medium ${
                              isSelected ? 'text-zinc-300' : 'text-zinc-500'
                            }`}
                          >
                            {formatAdminDateLabel(record.waitlistJoinedAt)}
                          </span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                              isSelected
                                ? 'border-white/10 bg-white/6 text-zinc-200'
                                : 'border-black/8 bg-[#f7f7f5] text-zinc-600'
                            }`}
                          >
                            {getAdminRoleLabel(record.role)}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                              isSelected
                                ? 'border-white/10 bg-white/6 text-zinc-200'
                                : 'border-black/8 bg-[#f7f7f5] text-zinc-600'
                            }`}
                          >
                            {record.accountStatus === 'suspended' ? 'Suspended' : 'Active'}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                              isSelected
                                ? 'border-white/10 bg-white/6 text-zinc-200'
                                : 'border-black/8 bg-[#f7f7f5] text-zinc-600'
                            }`}
                          >
                            {getAdminUsageLabel(record)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="px-4 py-4 xl:min-h-[42rem] xl:px-6 xl:py-5">
              {!selectedUser && (
                <div className="flex h-full min-h-[16rem] items-center justify-center rounded-[1.5rem] border border-dashed border-black/10 bg-[#f9fafb] px-6 text-center text-sm text-zinc-600">
                  Pick a waitlist user from the list to inspect the account and take action.
                </div>
              )}

              {selectedUser && (
                <div className="space-y-4">
                  <section className="rounded-[1.65rem] border border-black/8 bg-[#0f1115] px-4 py-4 text-white md:px-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                          Selected lead
                        </p>
                        <h3 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.05em]">
                          {getWaitlistDisplayName(selectedUser)}
                        </h3>
                        <p className="mt-2 text-sm text-zinc-300">{selectedUser.email}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getAdminRoleBadgeClassName(selectedUser.role)}`}
                        >
                          {getAdminRoleLabel(selectedUser.role)}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getAdminPlanBadgeClassName(selectedUser)}`}
                        >
                          {getAdminPlanLabel(selectedUser)}
                        </span>
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                          Joined {formatAdminDateLabel(selectedUser.waitlistJoinedAt)}
                        </span>
                      </div>
                    </div>

                    <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300">
                      {getWaitlistLeadNote(selectedUser)}
                    </p>
                  </section>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricTile
                      label="Joined"
                      value={formatAdminDateLabel(selectedUser.waitlistJoinedAt)}
                    />
                    <MetricTile label="AI today" value={getAdminUsageLabel(selectedUser)} />
                    <MetricTile
                      label="Last seen"
                      value={formatAdminDateLabel(selectedUser.lastSignInAt)}
                    />
                    <MetricTile
                      label="Resumes"
                      value={selectedDetail ? selectedDetail.resumeCount : '—'}
                    />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="space-y-4">
                      <section className="rounded-[1.55rem] border border-black/8 bg-[#f7f7f5] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                            Recent resumes
                          </p>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                            {selectedDetail ? selectedDetail.resumeCount : '—'} total
                          </span>
                        </div>

                        {userDetailQuery.isPending && (
                          <p className="mt-3 text-sm text-zinc-600">Loading resume activity…</p>
                        )}

                        {!userDetailQuery.isPending &&
                          selectedDetail &&
                          selectedDetail.recentResumes.length === 0 && (
                            <p className="mt-3 text-sm text-zinc-600">
                              No recent resumes found for this account.
                            </p>
                          )}

                        {!userDetailQuery.isPending &&
                          selectedDetail &&
                          selectedDetail.recentResumes.length > 0 && (
                            <div className="mt-3 space-y-2.5">
                              {selectedDetail.recentResumes.map((resume) => (
                                <div
                                  key={resume.id}
                                  className="rounded-[1.1rem] border border-black/8 bg-white px-3.5 py-3"
                                >
                                  <p className="truncate text-sm font-semibold text-[#111111]">
                                    {resume.title}
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-2 text-[12px] text-zinc-600">
                                    <span>{resume.templateId}</span>
                                    <span>•</span>
                                    <span>{formatAdminDateLabel(resume.updatedAt)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </section>

                      <section className="rounded-[1.55rem] border border-black/8 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                            Recent notifications
                          </p>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                            {selectedDetail ? selectedDetail.sentNotificationCount : '—'} sent
                          </span>
                        </div>

                        {userDetailQuery.isPending && (
                          <p className="mt-3 text-sm text-zinc-600">Loading notification activity…</p>
                        )}

                        {!userDetailQuery.isPending &&
                          selectedDetail &&
                          selectedDetail.recentNotifications.length === 0 && (
                            <p className="mt-3 text-sm text-zinc-600">
                              No recent notification events for this account.
                            </p>
                          )}

                        {!userDetailQuery.isPending &&
                          selectedDetail &&
                          selectedDetail.recentNotifications.length > 0 && (
                            <div className="mt-3 space-y-2.5">
                              {selectedDetail.recentNotifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  className="rounded-[1.1rem] border border-black/8 bg-[#f7f7f5] px-3.5 py-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="truncate text-sm font-semibold text-[#111111]">
                                      {notification.title}
                                    </p>
                                    <span className="shrink-0 text-[11px] font-medium text-zinc-500">
                                      {formatAdminDateLabel(notification.createdAt)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[12px] leading-5 text-zinc-600">
                                    {notification.description}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-zinc-500">
                                    <span>{notification.channelLabel}</span>
                                    <span>•</span>
                                    <span>{notification.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </section>
                    </div>

                    <div className="space-y-4">
                      <section className="rounded-[1.55rem] border border-black/8 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                          Actions
                        </p>
                        <p className="mt-2 text-sm leading-6 text-zinc-700">
                          Upgrade the account, restore access, or resend the onboarding email.
                        </p>

                        <div className="mt-4 grid gap-3">
                          {selectedActions.map((descriptor) => (
                            <ActionButton
                              key={descriptor.label}
                              descriptor={descriptor}
                              pending={userActionMutation.isPending}
                              onClick={() => openAction(selectedUser, descriptor)}
                            />
                          ))}
                        </div>
                      </section>

                      <section className="rounded-[1.55rem] border border-black/8 bg-[#f7f7f5] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                          Account state
                        </p>
                        <dl className="mt-3 grid gap-2.5 text-sm text-zinc-700">
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-zinc-500">Status</dt>
                            <dd className="font-semibold text-[#111111]">
                              {selectedUser.accountStatus === 'suspended' ? 'Suspended' : 'Active'}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-zinc-500">Created</dt>
                            <dd className="font-semibold text-[#111111]">
                              {formatAdminDateLabel(selectedUser.createdAt)}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-zinc-500">Failed notifications</dt>
                            <dd className="font-semibold text-[#111111]">
                              {selectedDetail ? selectedDetail.failedNotificationCount : '—'}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-zinc-500">Campaign touches</dt>
                            <dd className="font-semibold text-[#111111]">
                              {selectedDetail ? selectedDetail.campaignNotificationCount : '—'}
                            </dd>
                          </div>
                        </dl>
                      </section>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>

        <ConfirmationDialog
          state={pendingConfirmation}
          pending={userActionMutation.isPending}
          onCancel={() => setPendingConfirmation(null)}
          onConfirm={confirmPendingAction}
        />
      </section>
    </AdminLayout>
  );
};

export default AdminWaitlistView;
