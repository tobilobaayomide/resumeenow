import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiArrowRight,
  FiBell,
  FiClock,
  FiMail,
  FiShield,
  FiStar,
  FiUsers,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { fetchAdminUsers, getAdminUsersQueryKey } from '../../lib/queries/adminUsers';
import {
  fetchAdminCampaignHistory,
  getAdminCampaignHistoryQueryKey,
} from '../../lib/queries/adminCampaigns';
import { formatAdminDateLabel, isWithinRecentDays } from './adminDisplay';
import { isAdminProfileRole } from '../../types/profile';

const StatCard = ({
  label,
  value,
  detail,
  icon: Icon,
  iconTone,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: typeof FiUsers;
  iconTone: string;
}) => (
  <article className="rounded-[1.55rem] border border-black/8 bg-white/88 p-4 shadow-[0_18px_56px_-44px_rgba(15,17,21,0.28)]">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
          {label}
        </p>
        <p className="mt-2.5 text-[1.9rem] font-semibold tracking-[-0.05em] text-[#111111]">
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

const SurfaceCard = ({
  label,
  title,
  value,
  detail,
  stats,
  path,
  icon: Icon,
}: {
  label: string;
  title: string;
  value: number;
  detail: string;
  stats: readonly string[];
  path: string;
  icon: typeof FiUsers;
}) => (
  <Link
    to={path}
    className="group rounded-[1.7rem] border border-black/8 bg-white/92 p-5 shadow-[0_24px_64px_-48px_rgba(15,17,21,0.26)] transition hover:border-black/15 hover:bg-white"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
          {label}
        </p>
        <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[#111111]">{title}</h3>
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
        <Icon size={18} />
      </span>
    </div>

    <div className="mt-5 flex items-end justify-between gap-4">
      <p className="text-[2.4rem] font-semibold tracking-[-0.06em] text-[#111111]">{value}</p>
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 transition group-hover:text-zinc-700">
        Open
        <FiArrowRight size={14} />
      </span>
    </div>

    <p className="mt-3 text-sm leading-6 text-zinc-700">{detail}</p>

    <div className="mt-4 flex flex-wrap gap-2">
      {stats.map((item) => (
        <span
          key={item}
          className="rounded-full border border-black/8 bg-[#f7f7f5] px-3 py-1.5 text-[11px] font-medium text-zinc-600"
        >
          {item}
        </span>
      ))}
    </div>
  </Link>
);

const AttentionLink = ({
  title,
  detail,
  path,
}: {
  title: string;
  detail: string;
  path: string;
}) => (
  <Link
    to={path}
    className="block rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-4 transition hover:border-black/15 hover:bg-white"
  >
    <p className="text-sm font-semibold text-[#111111]">{title}</p>
    <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p>
  </Link>
);

const AdminOverview = () => {
  const usersQuery = useQuery({
    queryKey: getAdminUsersQueryKey(),
    queryFn: fetchAdminUsers,
    staleTime: 30_000,
  });

  const campaignsQuery = useQuery({
    queryKey: getAdminCampaignHistoryQueryKey(),
    queryFn: fetchAdminCampaignHistory,
    staleTime: 30_000,
  });

  const summary = useMemo(() => {
    const users = usersQuery.data ?? [];
    const campaigns = campaignsQuery.data ?? [];
    const totalUsers = users.length;
    const adminCount = users.filter((record) => isAdminProfileRole(record.role)).length;
    const proCount = users.filter(
      (record) => isAdminProfileRole(record.role) || record.planTier === 'pro',
    ).length;
    const freeCount = Math.max(totalUsers - proCount, 0);
    const recentAccounts = users.filter((record) => isWithinRecentDays(record.createdAt, 7)).length;

    const waitlistUsers = [...users]
      .filter((record) => record.waitlistJoinedAt !== null)
      .sort((left, right) => {
        const leftTime = left.waitlistJoinedAt ? new Date(left.waitlistJoinedAt).getTime() : 0;
        const rightTime = right.waitlistJoinedAt ? new Date(right.waitlistJoinedAt).getTime() : 0;
        return rightTime - leftTime;
      });
    const waitlistCount = waitlistUsers.length;
    const waitlistThisWeek = waitlistUsers.filter((record) =>
      isWithinRecentDays(record.waitlistJoinedAt, 7),
    ).length;
    const activeWaitlistLeads = waitlistUsers.filter(
      (record) =>
        record.accountStatus === 'active' &&
        record.planTier === 'free' &&
        !isAdminProfileRole(record.role),
    ).length;

    const campaignCount = campaigns.length;
    const campaignsThisWeek = campaigns.filter((campaign) =>
      isWithinRecentDays(campaign.createdAt, 7),
    ).length;
    const failedDeliveries = campaigns.reduce(
      (total, campaign) => total + campaign.failedRecipients,
      0,
    );
    const skippedDeliveries = campaigns.reduce(
      (total, campaign) => total + campaign.skippedRecipients,
      0,
    );
    const totalRecipients = campaigns.reduce(
      (total, campaign) => total + campaign.targetedRecipients,
      0,
    );
    const totalInAppDrops = campaigns.reduce(
      (total, campaign) => total + campaign.inAppRecipients,
      0,
    );

    return {
      totalUsers,
      adminCount,
      proCount,
      freeCount,
      recentAccounts,
      waitlistCount,
      waitlistThisWeek,
      activeWaitlistLeads,
      campaignCount,
      campaignsThisWeek,
      failedDeliveries,
      skippedDeliveries,
      totalRecipients,
      totalInAppDrops,
      latestUser: users[0] ?? null,
      latestWaitlistJoin: waitlistUsers[0] ?? null,
      latestCampaign: campaigns[0] ?? null,
    };
  }, [campaignsQuery.data, usersQuery.data]);

  const overviewError =
    usersQuery.error instanceof Error
      ? usersQuery.error.message
      : campaignsQuery.error instanceof Error
        ? campaignsQuery.error.message
        : null;

  const statCards = [
    {
      label: 'Accounts',
      value: usersQuery.isPending ? '—' : summary.totalUsers,
      detail: `${summary.recentAccounts} joined in the last 7 days`,
      icon: FiUsers,
      iconTone: 'bg-black text-white',
    },
    {
      label: 'Pro access',
      value: usersQuery.isPending ? '—' : summary.proCount,
      detail: `${summary.freeCount} still on free`,
      icon: FiShield,
      iconTone: 'bg-[#f3f4f6] text-[#111111]',
    },
    {
      label: 'Free waitlist leads',
      value: usersQuery.isPending ? '—' : summary.activeWaitlistLeads,
      detail:
        summary.waitlistThisWeek > 0
          ? `${summary.waitlistThisWeek} joined this week`
          : 'No new joins this week',
      icon: FiStar,
      iconTone: 'bg-[#fff5e8] text-[#c2410c]',
    },
    {
      label: 'Email issues',
      value: campaignsQuery.isPending ? '—' : summary.failedDeliveries,
      detail:
        summary.failedDeliveries > 0
          ? `${summary.skippedDeliveries} skipped in the same window`
          : `${summary.campaignsThisWeek} sends this week`,
      icon: FiBell,
      iconTone: 'bg-[#fee2e2] text-[#b91c1c]',
    },
  ] as const;

  const movementItems = [
    {
      label: 'Newest account',
      title: summary.latestUser?.fullName || summary.latestUser?.email || 'No accounts yet',
      detail: summary.latestUser
        ? `${summary.latestUser.email} • Joined ${formatAdminDateLabel(summary.latestUser.createdAt)}`
        : 'New accounts will show here first.',
      path: '/admin/users',
    },
    {
      label: 'Latest Pro join',
      title:
        summary.latestWaitlistJoin?.fullName ||
        summary.latestWaitlistJoin?.email ||
        'No waitlist join yet',
      detail: summary.latestWaitlistJoin
        ? `${summary.latestWaitlistJoin.email} • Joined ${formatAdminDateLabel(summary.latestWaitlistJoin.waitlistJoinedAt)}`
        : 'Waitlist joins will show here as they happen.',
      path: '/admin/waitlist',
    },
    {
      label: 'Latest send',
      title: summary.latestCampaign?.title || 'No campaign sent yet',
      detail: summary.latestCampaign
        ? `${summary.latestCampaign.targetedRecipients} targeted • ${getCampaignStatusLabel(
            summary.latestCampaign.failedRecipients,
          )}`
        : 'Campaign sends will show here once you send one.',
      path: '/admin/campaigns',
    },
  ] as const;

  const attentionItems = [
    summary.failedDeliveries > 0
      ? {
          title: `${summary.failedDeliveries} failed email deliveries need review`,
          detail: 'Open Campaigns and inspect the most recent send history.',
          path: '/admin/campaigns',
        }
      : {
          title: 'Recent sends look clean',
          detail: 'There are no failed email deliveries in the current campaign window.',
          path: '/admin/campaigns',
        },
    summary.activeWaitlistLeads > 0
      ? {
          title: `${summary.activeWaitlistLeads} free waitlist leads are ready for follow-up`,
          detail: 'Use Waitlist to review the strongest upgrade candidates first.',
          path: '/admin/waitlist',
        }
      : {
          title: 'No active free waitlist leads right now',
          detail: 'Watch the waitlist again when new joins start to build.',
          path: '/admin/waitlist',
        },
    summary.recentAccounts > 0
      ? {
          title: `${summary.recentAccounts} new accounts joined in the last 7 days`,
          detail: 'Open Users to see whether these accounts are still free, Pro, or internal.',
          path: '/admin/users',
        }
      : {
          title: 'New account flow is quiet this week',
          detail: 'If acquisition is a focus, keep an eye on Users for fresh movement.',
          path: '/admin/users',
        },
  ] as const;

  const surfaceCards = [
    {
      label: 'Users',
      title: 'Accounts and access',
      value: summary.totalUsers,
      detail: summary.latestUser
        ? `${summary.latestUser.fullName || summary.latestUser.email} is the newest account in the workspace.`
        : 'Review accounts, access state, and support actions.',
      stats: [`${summary.adminCount} admins`, `${summary.proCount} with Pro access`, `${summary.recentAccounts} new this week`],
      path: '/admin/users',
      icon: FiUsers,
    },
    {
      label: 'Waitlist',
      title: 'Pro demand',
      value: summary.waitlistCount,
      detail: summary.latestWaitlistJoin
        ? `${summary.latestWaitlistJoin.fullName || summary.latestWaitlistJoin.email} is the most recent Pro join.`
        : 'Track who asked for Pro and decide who to follow up with first.',
      stats: [
        `${summary.activeWaitlistLeads} free leads`,
        `${summary.waitlistThisWeek} joined this week`,
        `${summary.freeCount} still on free`,
      ],
      path: '/admin/waitlist',
      icon: FiStar,
    },
    {
      label: 'Campaigns',
      title: 'Outbound sends',
      value: summary.campaignCount,
      detail: summary.latestCampaign
        ? `${summary.latestCampaign.title} is the latest outbound update.`
        : 'Write, send, and review product updates from one place.',
      stats: [
        `${summary.campaignsThisWeek} this week`,
        `${summary.totalRecipients} total targeted`,
        `${summary.totalInAppDrops} in-app drops`,
      ],
      path: '/admin/campaigns',
      icon: FiMail,
    },
  ] as const;

  return (
    <AdminLayout
      eyebrow="Internal home"
      title="Overview"
      description="Accounts, Pro demand, and outbound updates in one pass."
    >
      <section className="space-y-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              detail={card.detail}
              icon={card.icon}
              iconTone={card.iconTone}
            />
          ))}
        </section>

        {overviewError && (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {overviewError}
          </section>
        )}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_0.92fr]">
          <section className="overflow-hidden rounded-[1.9rem] border border-black/8 bg-[#0f1115] text-white shadow-[0_28px_78px_-56px_rgba(15,17,21,0.34)]">
            <div className="border-b border-white/10 px-5 py-5 md:px-6">
              <div className="flex items-start gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                    Latest movement
                  </p>
                  <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em]">
                    What changed most recently
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Check the latest account, the latest Pro join, and the latest outbound send before you branch into deeper admin work.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/10">
              {movementItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className="grid gap-3 px-5 py-4 transition hover:bg-white/3 md:grid-cols-[8rem_minmax(0,1fr)_auto] md:items-center md:px-6"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    {item.label}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-300">{item.detail}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Open
                    <FiArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-black/8 bg-[#f2f5fa] p-5 shadow-[0_24px_64px_-48px_rgba(15,17,21,0.24)] md:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                <FiClock size={18} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                  Attention
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#111111]">
                  What deserves the next look
                </h3>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {attentionItems.map((item) => (
                <AttentionLink
                  key={item.title}
                  title={item.title}
                  detail={item.detail}
                  path={item.path}
                />
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          {surfaceCards.map((card) => (
            <SurfaceCard
              key={card.label}
              label={card.label}
              title={card.title}
              value={card.value}
              detail={card.detail}
              stats={card.stats}
              path={card.path}
              icon={card.icon}
            />
          ))}
        </section>
      </section>
    </AdminLayout>
  );
};

const getCampaignStatusLabel = (failedRecipients: number) =>
  failedRecipients > 0
    ? `${failedRecipients} failed`
    : 'No delivery issues';

export default AdminOverview;
