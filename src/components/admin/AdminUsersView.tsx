import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiStar,
  FiUsers,
} from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import { fetchAdminUsers, getAdminUsersQueryKey } from '../../lib/queries/adminUsers';
import type { AdminUserRecord } from '../../types/admin';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatDateLabel = (value: string | null): string => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return dateFormatter.format(parsed);
};

const roleBadgeClassName = (role: AdminUserRecord['role']) =>
  role === 'admin'
    ? 'border-black bg-black text-white'
    : 'border-zinc-200 bg-white text-zinc-700';

const planBadgeClassName = (record: AdminUserRecord) =>
  record.role === 'admin'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : record.planTier === 'pro'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-zinc-200 bg-zinc-100 text-zinc-700';

const getPlanLabel = (record: AdminUserRecord) =>
  record.role === 'admin'
    ? 'Admin unlimited'
    : record.planTier === 'pro'
      ? 'Pro'
      : 'Free';

const getUsageLabel = (record: AdminUserRecord) =>
  record.role === 'admin' ? 'Unlimited' : `${record.aiCreditsUsed} used`;

const EMPTY_USERS: AdminUserRecord[] = [];

const AdminUsersView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const usersQuery = useQuery({
    queryKey: getAdminUsersQueryKey(),
    queryFn: fetchAdminUsers,
    staleTime: 30_000,
  });

  const users = usersQuery.data ?? EMPTY_USERS;
  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) {
      return users;
    }

    return users.filter((record) =>
      [record.fullName, record.email, record.role, record.planTier]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [normalizedQuery, users]);

  const totalUsers = users.length;
  const adminCount = users.filter((record) => record.role === 'admin').length;
  const proCount = users.filter(
    (record) => record.planTier === 'pro' || record.role === 'admin',
  ).length;
  const waitlistCount = users.filter((record) => record.waitlistJoinedAt !== null).length;

  return (
    <AdminLayout
      eyebrow="User Management"
      title="Users"
      description="Read-only account inspection comes first. This lets you verify roles, plan state, waitlist joins, and recent activity before we add sensitive actions."
    >
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <article className="rounded-[1.75rem] border border-black/5 bg-white/85 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111111] text-white">
                <FiUsers size={18} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Total
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-[#111111]">{totalUsers}</p>
          </article>

          <article className="rounded-[1.75rem] border border-black/5 bg-white/85 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                <FiShield size={18} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Admins
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-[#111111]">{adminCount}</p>
          </article>

          <article className="rounded-[1.75rem] border border-black/5 bg-white/85 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <FiStar size={18} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Pro Access
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-[#111111]">{proCount}</p>
          </article>

          <article className="rounded-[1.75rem] border border-black/5 bg-white/85 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                <FiClock size={18} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Waitlist
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-[#111111]">{waitlistCount}</p>
          </article>
        </div>

        <section className="rounded-[2rem] border border-black/5 bg-white/90 p-5 shadow-[0_24px_60px_-45px_rgba(0,0,0,0.25)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                Read-Only Directory
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#111111]">
                Accounts, roles, plan state, and waitlist signals
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
                This page is intentionally read-only for now. It gives you a safe operational view
                before we add suspend, delete, campaign targeting, or plan overrides.
              </p>
            </div>

            <div className="flex w-full items-center gap-3 md:max-w-md">
              <label className="flex flex-1 items-center gap-3 rounded-2xl border border-black/10 bg-[#f7f1e9] px-4 py-3">
                <FiSearch className="shrink-0 text-zinc-500" size={16} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, email, role, or plan"
                  className="w-full bg-transparent text-sm text-[#111111] outline-none placeholder:text-zinc-500"
                />
              </label>
              <button
                onClick={() => {
                  void usersQuery.refetch();
                }}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-black/10 px-4 text-sm font-semibold text-zinc-700 transition hover:border-black/20 hover:bg-zinc-50"
              >
                <FiRefreshCw size={15} />
                Refresh
              </button>
            </div>
          </div>

          {usersQuery.isPending && (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-black/10 bg-[#f7f1e9] px-5 py-10 text-center text-sm text-zinc-600">
              Loading admin user directory…
            </div>
          )}

          {usersQuery.isError && (
            <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-6">
              <p className="text-sm font-semibold text-rose-700">Failed to load users.</p>
              <p className="mt-2 text-sm leading-7 text-rose-700/80">
                {usersQuery.error instanceof Error
                  ? usersQuery.error.message
                  : 'An unexpected admin API error occurred.'}
              </p>
            </div>
          )}

          {!usersQuery.isPending && !usersQuery.isError && filteredUsers.length === 0 && (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-black/10 bg-[#f7f1e9] px-5 py-10 text-center text-sm text-zinc-600">
              No users matched your search.
            </div>
          )}

          {!usersQuery.isPending && !usersQuery.isError && filteredUsers.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-black/5">
              <table className="hidden min-w-full divide-y divide-black/5 md:table">
                <thead className="bg-[#f7f1e9]">
                  <tr className="text-left text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Plan</th>
                    <th className="px-5 py-4">AI Usage</th>
                    <th className="px-5 py-4">Waitlist</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4">Last Sign In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 bg-white">
                  {filteredUsers.map((record) => (
                    <tr key={record.id} className="align-top">
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-[#111111]">
                            {record.fullName || 'Unnamed user'}
                          </p>
                          <p className="mt-1 text-sm text-zinc-600">{record.email || 'No email'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${roleBadgeClassName(record.role)}`}
                        >
                          {record.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${planBadgeClassName(record)}`}
                        >
                          {getPlanLabel(record)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-700">{getUsageLabel(record)}</td>
                      <td className="px-5 py-4 text-sm text-zinc-700">
                        {record.waitlistJoinedAt ? formatDateLabel(record.waitlistJoinedAt) : 'Not joined'}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-700">
                        {formatDateLabel(record.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-700">
                        {formatDateLabel(record.lastSignInAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="divide-y divide-black/5 md:hidden">
                {filteredUsers.map((record) => (
                  <article key={record.id} className="space-y-4 bg-white px-4 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#111111]">
                          {record.fullName || 'Unnamed user'}
                        </p>
                        <p className="mt-1 truncate text-sm text-zinc-600">{record.email || 'No email'}</p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${roleBadgeClassName(record.role)}`}
                      >
                        {record.role}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${planBadgeClassName(record)}`}
                      >
                        {getPlanLabel(record)}
                      </span>
                      <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                        {getUsageLabel(record)}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                          Waitlist
                        </dt>
                        <dd className="mt-1 text-zinc-700">
                          {record.waitlistJoinedAt
                            ? formatDateLabel(record.waitlistJoinedAt)
                            : 'Not joined'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                          Created
                        </dt>
                        <dd className="mt-1 text-zinc-700">{formatDateLabel(record.createdAt)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                          Last Sign In
                        </dt>
                        <dd className="mt-1 text-zinc-700">{formatDateLabel(record.lastSignInAt)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </section>
    </AdminLayout>
  );
};

export default AdminUsersView;
