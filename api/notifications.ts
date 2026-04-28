import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { NotificationEventType } from '../src/lib/notifications/types.js';
import { parseSelfNotificationPreferencesUpdate } from '../src/schemas/integrations/notifications.js';
import {
  HttpError,
  isRecord,
  sendJson,
  toString,
  type ApiRequest,
  type ApiResponse,
} from './_lib/admin.js';
import { applySetCookieHeaders, resolveSessionFromApiRequest } from './_lib/session.js';
import { authenticateUserRequest } from './_lib/user.js';

export const config = {
  maxDuration: 30,
};

type NotificationEventStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'skipped';

type NotificationPreferencesRecord = {
  weekly_digest?: boolean | null;
  ai_usage_alerts?: boolean | null;
  pro_waitlist_updates?: boolean | null;
};

type NotificationEventRecord = {
  id: string;
  status: NotificationEventStatus;
  attempts: number | null;
};

interface NotificationEventRequestBody {
  type: NotificationEventType;
  payload: Record<string, unknown>;
}

interface NotificationEmailContent {
  subject: string;
  html: string;
}

let supabaseServiceClientPromise: Promise<SupabaseClient> | null = null;

const ALLOWED_NOTIFICATION_TYPES: readonly NotificationEventType[] = [
  'welcome_email',
  'weekly_digest',
  'ai_usage_alert',
  'pro_waitlist_joined',
] as const;

const ONE_TIME_NOTIFICATION_TYPES = new Set<NotificationEventType>([
  'welcome_email',
  'pro_waitlist_joined',
]);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getView = (req: ApiRequest): 'events' | 'feed' | 'preferences' => {
  const host = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;
  const forwardedProto = Array.isArray(req.headers['x-forwarded-proto'])
    ? req.headers['x-forwarded-proto'][0]
    : req.headers['x-forwarded-proto'];
  const protocol = typeof forwardedProto === 'string' && forwardedProto
    ? forwardedProto
    : 'https';
  const url = new URL(req.url ?? '/api/notifications', `${protocol}://${host ?? 'localhost'}`);
  const view = url.searchParams.get('view');

  if (view === 'events' || view === 'feed' || view === 'preferences') {
    return view;
  }

  if (req.method === 'PATCH') {
    return 'feed';
  }

  if (req.method === 'POST') {
    const contentType = Array.isArray(req.headers['content-type'])
      ? req.headers['content-type'][0]
      : req.headers['content-type'];
    return typeof contentType === 'string' && contentType.includes('application/json')
      ? 'preferences'
      : 'events';
  }

  return 'feed';
};

const parseJsonBody = (req: ApiRequest, invalidMessage: string): Record<string, unknown> => {
  let rawBody: unknown;

  if (typeof req.body === 'string') {
    try {
      rawBody = JSON.parse(req.body) as unknown;
    } catch {
      throw new HttpError(400, 'Invalid JSON request body.');
    }
  } else {
    rawBody = req.body ?? {};
  }

  if (!isRecord(rawBody)) {
    throw new HttpError(400, invalidMessage);
  }

  return rawBody;
};

const parseEventIds = (req: ApiRequest): string[] => {
  const body = parseJsonBody(req, 'Invalid notification feed payload.');
  const eventIds = Array.isArray(body.eventIds)
    ? body.eventIds.filter(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      )
    : [];

  if (eventIds.length === 0) {
    throw new HttpError(400, 'At least one notification event id is required.');
  }

  return Array.from(new Set(eventIds));
};

const parsePreferencesBody = (req: ApiRequest) => {
  const rawBody = parseJsonBody(req, 'Invalid notification preferences payload.');

  try {
    return parseSelfNotificationPreferencesUpdate(rawBody);
  } catch {
    throw new HttpError(400, 'Invalid notification preferences payload.');
  }
};

const parseEventBody = (req: ApiRequest): NotificationEventRequestBody => {
  const parsedBody = parseJsonBody(req, 'Invalid notification request.');
  const type = parsedBody.type;
  if (
    typeof type !== 'string' ||
    !ALLOWED_NOTIFICATION_TYPES.includes(type as NotificationEventType)
  ) {
    throw new HttpError(400, 'Unsupported notification type.');
  }

  return {
    type: type as NotificationEventType,
    payload: isRecord(parsedBody.payload) ? parsedBody.payload : {},
  };
};

const getSupabaseServerConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new HttpError(
      500,
      'Server notification delivery is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return { url, serviceRoleKey };
};

const getSupabaseServiceClient = async (): Promise<SupabaseClient> => {
  if (!supabaseServiceClientPromise) {
    supabaseServiceClientPromise = (async () => {
      const { url, serviceRoleKey } = getSupabaseServerConfig();

      return createClient(url, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    })();
  }

  return supabaseServiceClientPromise;
};

const authenticateNotificationEventRequest = async (req: ApiRequest, res: ApiResponse) => {
  const session = await resolveSessionFromApiRequest(req);
  const supabase = await getSupabaseServiceClient();
  const user = session.user;
  applySetCookieHeaders((name, value) => res.setHeader(name, value), session.setCookieHeaders);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new HttpError(500, 'Failed to verify account status.');
  }

  if (isRecord(profile) && profile.account_status === 'suspended') {
    throw new HttpError(403, 'This account is suspended.');
  }

  return { supabase, user };
};

const getNotificationPreferences = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationPreferencesRecord | null> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('weekly_digest, ai_usage_alerts, pro_waitlist_updates')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return isRecord(data) ? (data as NotificationPreferencesRecord) : null;
};

const shouldSendNotification = (
  type: NotificationEventType,
  preferences: NotificationPreferencesRecord | null,
) => {
  switch (type) {
    case 'welcome_email':
      return true;
    case 'weekly_digest':
      return preferences?.weekly_digest ?? false;
    case 'ai_usage_alert':
      return preferences?.ai_usage_alerts ?? true;
    case 'pro_waitlist_joined':
      return preferences?.pro_waitlist_updates ?? true;
    default:
      return false;
  }
};

const getExistingOneTimeEvent = async (
  supabase: SupabaseClient,
  userId: string,
  type: NotificationEventType,
): Promise<NotificationEventRecord | null> => {
  const { data, error } = await supabase
    .from('notification_events')
    .select('id, status, attempts')
    .eq('user_id', userId)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!isRecord(data)) {
    return null;
  }

  const id = toString(data.id);
  const status = data.status;
  const attempts = typeof data.attempts === 'number' ? data.attempts : 0;

  if (!id || typeof status !== 'string') {
    return null;
  }

  return {
    id,
    status: status as NotificationEventStatus,
    attempts,
  };
};

const getExistingAiUsageAlertForToday = async (
  supabase: SupabaseClient,
  userId: string,
  threshold: number,
): Promise<NotificationEventRecord | null> => {
  const startOfUtcDay = new Date();
  startOfUtcDay.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('notification_events')
    .select('id, status, attempts')
    .eq('user_id', userId)
    .eq('type', 'ai_usage_alert')
    .contains('payload', { threshold })
    .gte('created_at', startOfUtcDay.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!isRecord(data)) {
    return null;
  }

  const id = toString(data.id);
  const status = data.status;
  const attempts = typeof data.attempts === 'number' ? data.attempts : 0;

  if (!id || typeof status !== 'string') {
    return null;
  }

  return {
    id,
    status: status as NotificationEventStatus,
    attempts,
  };
};

const createNotificationEvent = async (
  supabase: SupabaseClient,
  userId: string,
  type: NotificationEventType,
  payload: Record<string, unknown>,
  status: NotificationEventStatus,
  lastError: string | null = null,
): Promise<NotificationEventRecord> => {
  const { data, error } = await supabase
    .from('notification_events')
    .insert({
      user_id: userId,
      type,
      payload,
      status,
      last_error: lastError,
    })
    .select('id, status, attempts')
    .single();

  if (error) {
    throw error;
  }

  if (!isRecord(data)) {
    throw new Error('Failed to create notification event.');
  }

  return {
    id: toString(data.id),
    status: String(data.status) as NotificationEventStatus,
    attempts: typeof data.attempts === 'number' ? data.attempts : 0,
  };
};

const updateNotificationEvent = async (
  supabase: SupabaseClient,
  eventId: string,
  updates: Record<string, unknown>,
) => {
  const { error } = await supabase
    .from('notification_events')
    .update(updates)
    .eq('id', eventId);

  if (error) {
    throw error;
  }
};

const resolveDisplayName = (
  user: User,
  payload: Record<string, unknown>,
): string => {
  const payloadName = toString(payload.full_name);
  if (payloadName) {
    return payloadName;
  }

  const metadataName = toString(user.user_metadata?.full_name);
  if (metadataName) {
    return metadataName;
  }

  return toString(user.email).split('@')[0] || 'there';
};

const buildEmailShell = ({
  eyebrow,
  title,
  intro,
  body,
  ctaLabel,
  ctaHref,
  note,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  note?: string;
}) => `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e7e5e4;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="background:#0f172a;padding:28px 32px 30px;">
                <div style="font-size:11px;line-height:1;letter-spacing:0.24em;text-transform:uppercase;color:#f87171;font-weight:800;">${escapeHtml(
                  eyebrow,
                )}</div>
                <h1 style="margin:12px 0 0;font-size:34px;line-height:1.05;font-weight:800;color:#ffffff;">${escapeHtml(
                  title,
                )}</h1>
                <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#cbd5e1;max-width:460px;">${escapeHtml(
                  intro,
                )}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 20px;">
                ${body}
                ${
                  ctaLabel && ctaHref
                    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 24px;">
                         <tr>
                           <td style="border-radius:14px;background:#111827;">
                             <a href="${escapeHtml(
                               ctaHref,
                             )}" style="display:inline-block;padding:15px 24px;font-size:15px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;border-radius:14px;">
                               ${escapeHtml(ctaLabel)}
                             </a>
                           </td>
                         </tr>
                       </table>`
                    : ''
                }
                ${
                  note
                    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px;background:#fafaf9;border:1px solid #e7e5e4;border-radius:16px;">
                         <tr>
                           <td style="padding:16px 18px;">
                             <p style="margin:0;font-size:13px;line-height:1.8;color:#6b7280;">${escapeHtml(
                               note,
                             )}</p>
                           </td>
                         </tr>
                       </table>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <div style="height:1px;background:#e7e5e4;"></div>
                <p style="margin:20px 0 0;font-size:12px;line-height:1.8;color:#9ca3af;">
                  ResumeeNow • Build better resumes, faster
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const buildNotificationEmail = (
  type: NotificationEventType,
  user: User,
  payload: Record<string, unknown>,
): NotificationEmailContent => {
  const displayName = escapeHtml(resolveDisplayName(user, payload));

  switch (type) {
    case 'welcome_email':
      return {
        subject: 'Welcome to ResumeeNow',
        html: buildEmailShell({
          eyebrow: 'ResumeeNow',
          title: 'Your workspace is ready',
          intro: 'Start building polished, job-ready resumes from one focused workspace.',
          body: `
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Hi ${displayName},</p>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Welcome to <strong style="color:#111827;">ResumeeNow</strong>. You can now parse an existing resume, tailor it with AI, and export recruiter-ready versions from one place.</p>
            <p style="margin:0;font-size:15px;line-height:1.8;color:#6b7280;">If you have not finished your first resume yet, now is the best time to set up your profile and create a solid base draft.</p>
          `,
          ctaLabel: 'Open ResumeeNow',
          ctaHref: 'https://resumeenow.xyz/dashboard',
        }),
      };
    case 'pro_waitlist_joined':
      return {
        subject: 'You joined the ResumeeNow Pro waitlist',
        html: buildEmailShell({
          eyebrow: 'ResumeeNow Pro',
          title: 'You are on the waitlist',
          intro: 'We will let you know when early access and billing go live.',
          body: `
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Hi ${displayName},</p>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Your spot on the <strong style="color:#111827;">ResumeeNow Pro</strong> waitlist is confirmed. We will notify you as soon as paid plans, early access, and new premium workflows are available.</p>
            <p style="margin:0;font-size:15px;line-height:1.8;color:#6b7280;">For now, you can keep using your current plan while we finish the rollout.</p>
          `,
          ctaLabel: 'Open Dashboard',
          ctaHref: 'https://resumeenow.xyz/dashboard',
        }),
      };
    case 'ai_usage_alert': {
      const used = Number(payload.used) || 0;
      const limit = Number(payload.limit) || 0;
      return {
        subject: 'ResumeeNow AI usage alert',
        html: buildEmailShell({
          eyebrow: 'ResumeeNow AI',
          title: 'You are close to today’s AI limit',
          intro: 'A quick heads-up so you are not surprised mid-session.',
          body: `
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Hi ${displayName},</p>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">You have used <strong style="color:#111827;">${used}</strong> out of <strong style="color:#111827;">${limit}</strong> AI actions available today.</p>
            <p style="margin:0;font-size:15px;line-height:1.8;color:#6b7280;">If you still need to tailor or audit your resume today, plan your remaining requests carefully.</p>
          `,
          ctaLabel: 'Open Builder',
          ctaHref: 'https://resumeenow.xyz/builder',
        }),
      };
    }
    case 'weekly_digest':
      return {
        subject: 'Your ResumeeNow weekly digest',
        html: buildEmailShell({
          eyebrow: 'ResumeeNow',
          title: 'Your weekly resume check-in',
          intro: 'A short reminder to keep your job-search materials moving forward.',
          body: `
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Hi ${displayName},</p>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">This is your weekly ResumeeNow digest. Take a few minutes to refresh your summary, tighten your recent bullets, or export a role-specific version before your next application.</p>
            <p style="margin:0;font-size:15px;line-height:1.8;color:#6b7280;">Small weekly updates usually beat big last-minute rewrites.</p>
          `,
          ctaLabel: 'Review Your Resume',
          ctaHref: 'https://resumeenow.xyz/dashboard/myresumes',
        }),
      };
    default:
      throw new HttpError(400, 'Unsupported notification type.');
  }
};

const sendEmailWithResend = async ({
  to,
  content,
}: {
  to: string;
  content: NotificationEmailContent;
}) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.NOTIFICATION_FROM_EMAIL || 'no-reply@auth.resumeenow.xyz';
  const fromName = process.env.NOTIFICATION_FROM_NAME || 'ResumeeNow';

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: content.subject,
      html: content.html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to send email with Resend.');
  }
};

const handleFeedView = async (req: ApiRequest, res: ApiResponse) => {
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    res.setHeader('Allow', 'GET, PATCH');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  const { supabase, user } = await authenticateUserRequest(req, res);

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('notification_events')
      .select('id, type, payload, status, created_at, read_at, sent_at')
      .eq('user_id', user.id)
      .in('status', ['sent', 'skipped'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    sendJson(res, 200, {
      events: Array.isArray(data) ? data : [],
    });
    return;
  }

  const eventIds = parseEventIds(req);
  const { error } = await supabase
    .from('notification_events')
    .update({
      read_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .in('id', eventIds)
    .is('read_at', null);

  if (error) {
    throw error;
  }

  sendJson(res, 200, { ok: true });
};

const handlePreferencesView = async (req: ApiRequest, res: ApiResponse) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  const { supabase, user } = await authenticateUserRequest(req, res);

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    sendJson(res, 200, { preferences: data });
    return;
  }

  const updates = parsePreferencesBody(req);

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  sendJson(res, 200, { preferences: data });
};

const handleEventsView = async (req: ApiRequest, res: ApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  const requestBody = parseEventBody(req);
  const { supabase, user } = await authenticateNotificationEventRequest(req, res);

  if (!user.email) {
    throw new HttpError(400, 'Notification delivery requires a valid email.');
  }

  const preferences = await getNotificationPreferences(supabase, user.id);
  const shouldSend = shouldSendNotification(requestBody.type, preferences);
  const isOneTimeType = ONE_TIME_NOTIFICATION_TYPES.has(requestBody.type);
  const aiAlertThreshold =
    requestBody.type === 'ai_usage_alert' &&
    typeof requestBody.payload.threshold === 'number'
      ? requestBody.payload.threshold
      : null;

  let existingEvent: NotificationEventRecord | null = null;
  if (isOneTimeType) {
    existingEvent = await getExistingOneTimeEvent(
      supabase,
      user.id,
      requestBody.type,
    );
    if (existingEvent && existingEvent.status !== 'failed') {
      res.status(200).send('Notification already handled.');
      return;
    }
  } else if (requestBody.type === 'ai_usage_alert' && aiAlertThreshold !== null) {
    existingEvent = await getExistingAiUsageAlertForToday(
      supabase,
      user.id,
      aiAlertThreshold,
    );
    if (existingEvent && existingEvent.status !== 'failed') {
      res.status(200).send('Notification already handled.');
      return;
    }
  }

  const eventRecord =
    existingEvent && existingEvent.status === 'failed'
      ? existingEvent
      : await createNotificationEvent(
          supabase,
          user.id,
          requestBody.type,
          requestBody.payload,
          shouldSend ? 'processing' : 'skipped',
          shouldSend ? null : 'disabled_by_preference',
        );

  if (!shouldSend) {
    if (existingEvent && existingEvent.status === 'failed') {
      await updateNotificationEvent(supabase, eventRecord.id, {
        status: 'skipped',
        last_error: 'disabled_by_preference',
        attempts: (eventRecord.attempts ?? 0) + 1,
      });
    }

    res.status(200).send('Notification skipped.');
    return;
  }

  const emailContent = buildNotificationEmail(
    requestBody.type,
    user,
    requestBody.payload,
  );

  try {
    await sendEmailWithResend({
      to: user.email,
      content: emailContent,
    });

    await updateNotificationEvent(supabase, eventRecord.id, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      last_error: null,
      attempts: (eventRecord.attempts ?? 0) + 1,
    });
  } catch (deliveryError) {
    await updateNotificationEvent(supabase, eventRecord.id, {
      status: 'failed',
      last_error:
        deliveryError instanceof Error
          ? deliveryError.message
          : 'Unknown delivery error.',
      attempts: (eventRecord.attempts ?? 0) + 1,
    });

    throw deliveryError;
  }

  res.status(200).send('Notification sent.');
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const view = getView(req);

    switch (view) {
      case 'events':
        await handleEventsView(req, res);
        return;
      case 'preferences':
        await handlePreferencesView(req, res);
        return;
      case 'feed':
        await handleFeedView(req, res);
        return;
      default:
        throw new HttpError(400, 'Unsupported notifications view.');
    }
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'NOTIFICATIONS_REQUEST_FAILED',
        message: error.message,
      });
      return;
    }

    console.error('Notifications route failed', error);
    sendJson(res, 500, {
      error: 'NOTIFICATIONS_REQUEST_FAILED',
      message:
        error instanceof Error ? error.message : 'Unexpected notifications API error.',
    });
  }
}
