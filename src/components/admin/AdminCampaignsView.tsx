import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiBell,
  FiCheckCircle,
  FiMail,
  FiRadio,
  FiRefreshCw,
  FiSend,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { toast } from 'sonner';
import type {
  AdminCampaignAudience,
  AdminCampaignHistoryRecord,
  AdminCampaignInput,
} from '../../types/admin';
import { getErrorMessage } from '../../lib/errors';
import {
  fetchAdminCampaignHistory,
  getAdminCampaignHistoryQueryKey,
  sendAdminCampaign,
} from '../../lib/queries/adminCampaigns';
import { useCurrentUserRole } from '../../hooks/useCurrentUserRole';
import AdminLayout from './AdminLayout';
import { formatAdminDateLabel, isWithinRecentDays } from './adminDisplay';

const AUDIENCE_OPTIONS: Array<{
  value: AdminCampaignAudience;
  label: string;
  description: string;
}> = [
  {
    value: 'product_updates',
    label: 'Product updates',
    description: 'People who left product updates on.',
  },
  {
    value: 'waitlist',
    label: 'Pro waitlist',
    description: 'Only people who joined the Pro waitlist.',
  },
  {
    value: 'all_users',
    label: 'All users',
    description: 'Every account in the app. Use sparingly.',
  },
];

const INITIAL_FORM_STATE: AdminCampaignInput = {
  subject: '',
  title: '',
  body: '',
  audience: 'product_updates',
  sendEmail: true,
  sendInApp: true,
  ctaLabel: '',
  ctaHref: '',
};

const EMPTY_CAMPAIGNS: AdminCampaignHistoryRecord[] = [];

const audienceLabelMap = new Map(
  AUDIENCE_OPTIONS.map((option) => [option.value, option.label]),
);

const normalizeOptionalText = (value: string) => value.trim();

const getCampaignChannelLabel = (campaign: AdminCampaignHistoryRecord) => {
  if (campaign.deliverEmail && campaign.deliverInApp) {
    return 'Email + In-app';
  }

  if (campaign.deliverEmail) {
    return 'Email only';
  }

  return 'In-app only';
};

const getCampaignHealthCopy = (campaign: AdminCampaignHistoryRecord) => {
  if (campaign.failedRecipients > 0) {
    return `${campaign.failedRecipients} email delivery issue${
      campaign.failedRecipients === 1 ? '' : 's'
    } recorded.`;
  }

  if (campaign.skippedRecipients > 0) {
    return `${campaign.skippedRecipients} recipient${
      campaign.skippedRecipients === 1 ? '' : 's'
    } skipped by delivery rules.`;
  }

  return 'No delivery issues recorded.';
};

const ChannelBadge = ({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) => (
  <span
    className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
      active
        ? 'border-black bg-black text-white'
        : 'border-zinc-200 bg-zinc-100 text-zinc-500'
    }`}
  >
    {label}
  </span>
);

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

const MetricTile = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) => (
  <div className="rounded-[1.2rem] border border-black/8 bg-[#f7f7f5] px-3.5 py-3.5">
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
      {label}
    </p>
    <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.04em] text-[#111111]">
      {value}
    </p>
  </div>
);

const HistoryChip = ({
  children,
  selected,
}: {
  children: ReactNode;
  selected: boolean;
}) => (
  <span
    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
      selected
        ? 'border-white/10 bg-white/6 text-zinc-200'
        : 'border-black/8 bg-[#f7f7f5] text-zinc-600'
    }`}
  >
    {children}
  </span>
);

const AdminCampaignsView = () => {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { isSuperAdmin, loading: roleLoading } = useCurrentUserRole();

  const canUseEmailChannel = isSuperAdmin;
  const canTargetAllUsers = isSuperAdmin;

  const resolvedFormState = useMemo(
    () => ({
      ...formState,
      audience:
        !canTargetAllUsers && formState.audience === 'all_users'
          ? ('product_updates' as const)
          : formState.audience,
      sendEmail: canUseEmailChannel ? formState.sendEmail : false,
      ctaLabel: canUseEmailChannel ? formState.ctaLabel : '',
      ctaHref: canUseEmailChannel ? formState.ctaHref : '',
    }),
    [canTargetAllUsers, canUseEmailChannel, formState],
  );

  const campaignHistoryQuery = useQuery({
    queryKey: getAdminCampaignHistoryQueryKey(),
    queryFn: fetchAdminCampaignHistory,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: AdminCampaignInput = {
        ...resolvedFormState,
        subject: resolvedFormState.subject.trim(),
        title: resolvedFormState.title.trim(),
        body: resolvedFormState.body.trim(),
        ctaLabel: normalizeOptionalText(resolvedFormState.ctaLabel ?? ''),
        ctaHref: normalizeOptionalText(resolvedFormState.ctaHref ?? ''),
      };

      return sendAdminCampaign(payload);
    },
    onSuccess: async (result) => {
      toast.success(`Campaign sent to ${result.targetedRecipients} recipients.`);
      setFormState(INITIAL_FORM_STATE);
      await queryClient.invalidateQueries({
        queryKey: getAdminCampaignHistoryQueryKey(),
        exact: true,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to send admin campaign.'));
    },
  });

  const selectedAudience = useMemo(
    () => AUDIENCE_OPTIONS.find((option) => option.value === resolvedFormState.audience),
    [resolvedFormState.audience],
  );

  const canSubmit = Boolean(
    !roleLoading &&
      resolvedFormState.subject.trim() &&
      resolvedFormState.title.trim() &&
      resolvedFormState.body.trim() &&
      (resolvedFormState.sendEmail || resolvedFormState.sendInApp),
  );

  const recentCampaigns = campaignHistoryQuery.data ?? EMPTY_CAMPAIGNS;
  const selectedCampaign =
    recentCampaigns.find((campaign) => campaign.campaignId === selectedCampaignId) ??
    recentCampaigns[0] ??
    null;
  const lastResult = mutation.data;

  const summaryCards = useMemo(() => {
    const totalCampaigns = recentCampaigns.length;
    const sentThisWeek = recentCampaigns.filter((campaign) =>
      isWithinRecentDays(campaign.createdAt, 7),
    ).length;
    const targetedRecipients = recentCampaigns.reduce(
      (total, campaign) => total + campaign.targetedRecipients,
      0,
    );
    const inAppRecipients = recentCampaigns.reduce(
      (total, campaign) => total + campaign.inAppRecipients,
      0,
    );
    const failedRecipients = recentCampaigns.reduce(
      (total, campaign) => total + campaign.failedRecipients,
      0,
    );

    return [
      {
        label: 'Sends',
        value: totalCampaigns,
        detail: `${sentThisWeek} went out this week`,
        icon: FiRadio,
        iconTone: 'bg-black text-white',
      },
      {
        label: 'Audience',
        value: targetedRecipients,
        detail: 'Total targeted recipients in the current history window',
        icon: FiUsers,
        iconTone: 'bg-[#f3f4f6] text-[#111111]',
      },
      {
        label: 'In-app',
        value: inAppRecipients,
        detail: 'Bell notifications recorded from campaign sends',
        icon: FiBell,
        iconTone: 'bg-[#eef2ff] text-[#3730a3]',
      },
      {
        label: 'Email issues',
        value: failedRecipients,
        detail:
          failedRecipients > 0
            ? 'Review the affected sends below'
            : 'Recent email delivery looks clean',
        icon: FiTrendingUp,
        iconTone: 'bg-rose-50 text-rose-700',
      },
    ] as const;
  }, [recentCampaigns]);

  return (
    <AdminLayout
      eyebrow="Updates"
      title="Write and review campaign sends"
      description="Send product updates from one tighter internal surface, then inspect what reached the inbox and what landed in the app."
    >
      <section className="space-y-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.label}
              label={card.label}
              value={campaignHistoryQuery.isPending ? 0 : card.value}
              detail={card.detail}
              icon={card.icon}
              iconTone={card.iconTone}
            />
          ))}
        </section>

        <section className="overflow-hidden rounded-[1.85rem] border border-black/8 bg-white/92 shadow-[0_26px_72px_-56px_rgba(15,17,21,0.22)]">
          <div className="grid xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="px-4 py-4 md:px-5 xl:border-r xl:border-black/8 xl:px-5 xl:py-5">
              <div className="flex flex-col gap-3 border-b border-black/8 pb-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                      New send
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                      Write the next update
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">
                      Use this for launches, waitlist follow-ups, pricing changes, or any product update worth pushing out from ResumeeNow.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ChannelBadge active={resolvedFormState.sendEmail} label="Email" />
                    <ChannelBadge active={resolvedFormState.sendInApp} label="In-app" />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                {!isSuperAdmin && !roleLoading ? (
                  <div className="rounded-[1.3rem] border border-amber-200 bg-amber-50 px-3.5 py-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
                      Super admin controls
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-900">
                      Email sends and all-user broadcasts are reserved for the super admin. Admins
                      can still push in-app updates to opted-in product-update users and waitlist
                      leads.
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Email subject
                    </span>
                    <input
                      type="text"
                      value={formState.subject}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          subject: event.target.value,
                        }))
                      }
                      placeholder="New templates are live"
                      className="mt-2.5 w-full rounded-[1.15rem] border border-black/10 px-3.5 py-2.5 text-sm text-[#111111] outline-none transition focus:border-black/20 focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      In-app title
                    </span>
                    <input
                      type="text"
                      value={formState.title}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Three new templates just dropped"
                      className="mt-2.5 w-full rounded-[1.15rem] border border-black/10 px-3.5 py-2.5 text-sm text-[#111111] outline-none transition focus:border-black/20 focus:bg-white"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Message
                  </span>
                  <textarea
                    value={formState.body}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        body: event.target.value,
                      }))
                    }
                    placeholder="You can now use the new ATS, Silicon, and Studio templates in your builder."
                    rows={6}
                    className="mt-2.5 w-full rounded-[1.35rem] border border-black/10 px-3.5 py-3.5 text-sm leading-6 text-[#111111] outline-none transition focus:border-black/20 focus:bg-white"
                  />
                </label>

                <section className="rounded-[1.4rem] border border-black/10 bg-[#f4f6fa] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Audience
                    </p>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                      {selectedAudience?.label}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2.5 lg:grid-cols-3">
                    {AUDIENCE_OPTIONS.map((option) => {
                      const optionDisabled =
                        option.value === 'all_users' && !canTargetAllUsers;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={optionDisabled}
                          onClick={() =>
                            setFormState((current) => ({
                              ...current,
                              audience: option.value,
                            }))
                          }
                          className={`rounded-[1.2rem] border px-3.5 py-3.5 text-left transition ${
                            optionDisabled
                              ? 'cursor-not-allowed border-black/8 bg-[#f2f2ef] text-zinc-400'
                              : resolvedFormState.audience === option.value
                                ? 'border-black bg-black text-white'
                                : 'border-black/10 bg-white text-zinc-700 hover:border-black/20 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold">{option.label}</span>
                            {resolvedFormState.audience === option.value && !optionDisabled ? (
                              <FiCheckCircle size={16} />
                            ) : null}
                          </div>
                          <p
                            className={`mt-1.5 text-[13px] leading-5 ${
                              optionDisabled
                                ? 'text-zinc-400'
                                : resolvedFormState.audience === option.value
                                  ? 'text-zinc-300'
                                  : 'text-zinc-600'
                            }`}
                          >
                            {optionDisabled ? 'Super admin only.' : option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    disabled={!canUseEmailChannel}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        sendEmail: !current.sendEmail,
                      }))
                    }
                    className={`flex items-start gap-3 rounded-[1.3rem] border p-4 text-left transition ${
                      !canUseEmailChannel
                        ? 'cursor-not-allowed border-black/8 bg-[#f2f2ef] text-zinc-400'
                        : resolvedFormState.sendEmail
                          ? 'border-black bg-black text-white'
                          : 'border-black/10 bg-white text-zinc-700'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        !canUseEmailChannel
                          ? 'bg-zinc-200 text-zinc-500'
                          : resolvedFormState.sendEmail
                            ? 'bg-white/10 text-white'
                            : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <FiMail size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">Email channel</span>
                      <span
                        className={`mt-2 block text-sm leading-6 ${
                          !canUseEmailChannel
                            ? 'text-zinc-500'
                            : resolvedFormState.sendEmail
                              ? 'text-zinc-300'
                              : 'text-zinc-600'
                        }`}
                      >
                        {canUseEmailChannel
                          ? 'Use the ResumeeNow sender and branded layout.'
                          : 'Super admin only.'}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        sendInApp: !current.sendInApp,
                      }))
                    }
                    className={`flex items-start gap-3 rounded-[1.3rem] border p-4 text-left transition ${
                      formState.sendInApp
                        ? 'border-black bg-black text-white'
                        : 'border-black/10 bg-white text-zinc-700'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        formState.sendInApp ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <FiBell size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">In-app channel</span>
                      <span
                        className={`mt-2 block text-sm leading-6 ${
                          formState.sendInApp ? 'text-zinc-300' : 'text-zinc-600'
                        }`}
                      >
                        Push the same update into the dashboard bell.
                      </span>
                    </span>
                  </button>
                </div>

                {resolvedFormState.sendEmail ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        CTA label
                      </span>
                      <input
                        type="text"
                        value={formState.ctaLabel}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            ctaLabel: event.target.value,
                          }))
                        }
                        placeholder="Open dashboard"
                        className="mt-2.5 w-full rounded-[1.15rem] border border-black/10 px-3.5 py-2.5 text-sm text-[#111111] outline-none transition focus:border-black/20 focus:bg-white"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        CTA link
                      </span>
                      <input
                        type="url"
                        value={formState.ctaHref}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            ctaHref: event.target.value,
                          }))
                        }
                        placeholder="https://resumeenow.xyz/dashboard/templates"
                        className="mt-2.5 w-full rounded-[1.15rem] border border-black/10 px-3.5 py-2.5 text-sm text-[#111111] outline-none transition focus:border-black/20 focus:bg-white"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="rounded-[1.3rem] border border-black/10 bg-[#f4f6fa] px-3.5 py-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Email-only field
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">
                      CTA label and CTA link are only used when the email channel is on.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm leading-6 text-zinc-600">
                      Sending to{' '}
                      <span className="font-semibold text-[#111111]">
                        {selectedAudience?.label}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <ChannelBadge active={resolvedFormState.sendEmail} label="Email" />
                      <ChannelBadge active={resolvedFormState.sendInApp} label="In-app" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void mutation.mutateAsync();
                    }}
                    disabled={!canSubmit || mutation.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-[1.1rem] bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e1a17] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiSend size={16} />
                    {mutation.isPending ? 'Sending…' : 'Send campaign'}
                  </button>
                </div>
              </div>
            </section>

            <aside className="flex flex-col border-t border-black/8 bg-[#fafaf9] xl:border-t-0 xl:px-0">
              <section className="bg-[#0f1115] px-4 py-4 text-white md:px-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.3rem] bg-white text-[#111111]">
                    <FiTarget size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                      Draft snapshot
                    </p>
                    <h3 className="mt-2 text-[1.7rem] font-semibold tracking-[-0.04em]">
                      {formState.title.trim() || 'Untitled update'}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-300">{selectedAudience?.label}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                    {resolvedFormState.sendEmail ? 'Email on' : 'Email off'}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                    {resolvedFormState.sendInApp ? 'In-app on' : 'In-app off'}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                    {resolvedFormState.sendEmail &&
                    resolvedFormState.ctaLabel?.trim() &&
                    resolvedFormState.ctaHref?.trim()
                      ? 'CTA ready'
                      : 'No CTA'}
                  </span>
                </div>

                <dl className="mt-4 grid gap-2.5 text-sm text-zinc-300">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-zinc-500">Subject</dt>
                    <dd className="truncate text-right font-medium text-white">
                      {formState.subject.trim() || 'Not written'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-zinc-500">Title length</dt>
                    <dd className="font-medium text-white">{formState.title.trim().length}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-zinc-500">Body length</dt>
                    <dd className="font-medium text-white">{formState.body.trim().length}</dd>
                  </div>
                </dl>
              </section>

              <section className="border-t border-black/8 px-4 py-4 md:px-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                  Latest send
                </p>

                {lastResult ? (
                  <>
                    <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                      <MetricTile label="Targeted" value={lastResult.targetedRecipients} />
                      <MetricTile
                        label="In-app"
                        value={lastResult.deliverInApp ? lastResult.inAppRecipients : 'Not sent'}
                      />
                      <MetricTile
                        label="Email"
                        value={lastResult.deliverEmail ? lastResult.emailedRecipients : 'Not sent'}
                      />
                      <MetricTile label="Failed" value={lastResult.failedRecipients} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                      {lastResult.skippedRecipients > 0
                        ? `${lastResult.skippedRecipients} recipient${
                            lastResult.skippedRecipients === 1 ? '' : 's'
                          } skipped because of delivery rules or missing email.`
                        : 'No skipped recipients were recorded on the latest send.'}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    Send one campaign and the latest result will show here.
                  </p>
                )}
              </section>
            </aside>
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.85rem] border border-black/8 bg-white/92 shadow-[0_26px_72px_-56px_rgba(15,17,21,0.22)]">
          <div className="grid xl:grid-cols-[22rem_minmax(0,1fr)]">
            <section className="border-b border-black/8 px-4 py-4 xl:min-h-152 xl:border-b-0 xl:border-r xl:px-5">
              <div className="flex items-end justify-between gap-4 border-b border-black/8 pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                    History
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                    Recent sends
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-zinc-600">
                    Open one send to review its message, audience, and delivery shape.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void campaignHistoryQuery.refetch();
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-black/20 hover:bg-[#f7f7f5]"
                >
                  <FiRefreshCw size={15} />
                  Refresh
                </button>
              </div>

              {campaignHistoryQuery.isPending && (
                <div className="mt-4 rounded-[1.35rem] border border-dashed border-black/10 bg-[#f9fafb] px-5 py-8 text-center text-sm text-zinc-600">
                  Loading campaign history…
                </div>
              )}

              {campaignHistoryQuery.isError && (
                <div className="mt-4 rounded-[1.35rem] border border-rose-200 bg-rose-50 px-5 py-5">
                  <p className="text-sm font-semibold text-rose-700">Failed to load campaign history.</p>
                  <p className="mt-2 text-sm leading-7 text-rose-700/80">
                    {campaignHistoryQuery.error instanceof Error
                      ? campaignHistoryQuery.error.message
                      : 'An unexpected admin API error occurred.'}
                  </p>
                </div>
              )}

              {!campaignHistoryQuery.isPending &&
                !campaignHistoryQuery.isError &&
                recentCampaigns.length === 0 && (
                  <div className="mt-4 rounded-[1.35rem] border border-dashed border-black/10 bg-[#f9fafb] px-5 py-8 text-center text-sm text-zinc-600">
                    No campaigns sent yet.
                  </div>
                )}

              {!campaignHistoryQuery.isPending &&
                !campaignHistoryQuery.isError &&
                recentCampaigns.length > 0 && (
                  <div className="mt-4 space-y-2.5">
                    {recentCampaigns.map((campaign) => {
                      const isSelected = campaign.campaignId === selectedCampaign?.campaignId;

                      return (
                        <button
                          key={campaign.campaignId}
                          type="button"
                          onClick={() => setSelectedCampaignId(campaign.campaignId)}
                          className={`w-full rounded-[1.35rem] border px-4 py-3.5 text-left transition ${
                            isSelected
                              ? 'border-black bg-[#0f1115] text-white shadow-[0_24px_56px_-42px_rgba(15,17,21,0.48)]'
                              : 'border-black/8 bg-[#f8f8f7] text-[#111111] hover:border-black/15 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="truncate text-[14px] font-semibold">
                                  {campaign.title}
                                </h4>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                    isSelected
                                      ? 'border-white/20 bg-white/10 text-white'
                                      : 'border-black/10 bg-white text-zinc-700'
                                  }`}
                                >
                                  {audienceLabelMap.get(campaign.audience)}
                                </span>
                              </div>
                              <p
                                className={`mt-1 truncate text-[12px] ${
                                  isSelected ? 'text-zinc-300' : 'text-zinc-600'
                                }`}
                              >
                                {campaign.subject}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 text-[12px] font-medium ${
                                isSelected ? 'text-zinc-300' : 'text-zinc-500'
                              }`}
                            >
                              {formatAdminDateLabel(campaign.createdAt)}
                            </span>
                          </div>

                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <HistoryChip selected={isSelected}>
                              {campaign.targetedRecipients} targeted
                            </HistoryChip>
                            <HistoryChip selected={isSelected}>
                              {getCampaignChannelLabel(campaign)}
                            </HistoryChip>
                            <HistoryChip selected={isSelected}>
                              {campaign.deliverEmail
                                ? campaign.failedRecipients > 0
                                  ? `${campaign.failedRecipients} email issue${
                                      campaign.failedRecipients === 1 ? '' : 's'
                                    }`
                                  : `${campaign.emailedRecipients} emailed`
                                : 'Email off'}
                            </HistoryChip>
                            <HistoryChip selected={isSelected}>
                              {campaign.deliverInApp
                                ? `${campaign.inAppRecipients} in-app`
                                : 'In-app off'}
                            </HistoryChip>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
            </section>

            <section className="px-4 py-4 xl:min-h-152 xl:px-6 xl:py-5">
              {!selectedCampaign && (
                <div className="flex h-full min-h-64 items-center justify-center rounded-3xl border border-dashed border-black/10 bg-[#f9fafb] px-6 text-center text-sm text-zinc-600">
                  Pick a campaign from the list to inspect the message and delivery detail.
                </div>
              )}

              {selectedCampaign && (
                <div className="space-y-4">
                  <div className="rounded-[1.65rem] border border-black/8 bg-[#0f1115] px-4 py-4 text-white md:px-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                          Selected send
                        </p>
                        <h3 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.05em]">
                          {selectedCampaign.title}
                        </h3>
                        <p className="mt-2 text-sm text-zinc-300">{selectedCampaign.subject}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                          {audienceLabelMap.get(selectedCampaign.audience)}
                        </span>
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                          {getCampaignChannelLabel(selectedCampaign)}
                        </span>
                      </div>
                    </div>

                   
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_18rem]">
                    <section className="rounded-[1.55rem] border border-black/8 bg-[#f7f7f5] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                          Message
                        </p>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                          {formatAdminDateLabel(selectedCampaign.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                        {selectedCampaign.body}
                      </p>
                    </section>

                    <section className="rounded-[1.55rem] border border-black/8 bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Delivery
                      </p>
                      <dl className="mt-3 grid gap-2.5 text-sm text-zinc-700">
                        <div className="flex items-center justify-between gap-4">
                          <dt className="font-medium text-zinc-500">Sent</dt>
                          <dd className="text-right font-semibold text-[#111111]">
                            {formatAdminDateLabel(selectedCampaign.sentAt ?? selectedCampaign.createdAt)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt className="font-medium text-zinc-500">Skipped</dt>
                          <dd className="text-right font-semibold text-[#111111]">
                            {selectedCampaign.skippedRecipients}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt className="font-medium text-zinc-500">Email status</dt>
                          <dd className="text-right font-semibold text-[#111111]">
                            {selectedCampaign.deliverEmail ? 'Enabled' : 'Off'}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt className="font-medium text-zinc-500">In-app status</dt>
                          <dd className="text-right font-semibold text-[#111111]">
                            {selectedCampaign.deliverInApp ? 'Enabled' : 'Off'}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-4 rounded-[1.2rem] border border-black/8 bg-[#f7f7f5] px-3.5 py-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                          Health
                        </p>
                        <p className="mt-2.5 text-sm leading-6 text-zinc-700">
                          {getCampaignHealthCopy(selectedCampaign)}
                        </p>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      </section>
    </AdminLayout>
  );
};

export default AdminCampaignsView;
