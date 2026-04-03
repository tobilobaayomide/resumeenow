import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { NotificationEventType } from '../src/lib/notifications/types.js';

export const config = {
  maxDuration: 30,
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ApiResponse;
  send: (body: string) => void;
}

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const parseBody = (req: ApiRequest): NotificationEventRequestBody => {
  let parsedBody: unknown;

  if (typeof req.body === 'string') {
    try {
      parsedBody = JSON.parse(req.body) as unknown;
    } catch {
      throw new HttpError(400, 'Invalid JSON request body.');
    }
  } else {
    parsedBody = req.body ?? {};
  }

  if (!isRecord(parsedBody)) {
    throw new HttpError(400, 'Invalid notification request.');
  }

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

const getBearerToken = (authorizationHeader: string | string[] | undefined) => {
  if (!authorizationHeader) return null;

  const authorization = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;
  const [scheme, token] = String(authorization).trim().split(/\s+/, 2);

  if (!/^Bearer$/i.test(scheme) || !token) return null;
  return token;
};

const authenticateRequest = async (req: ApiRequest) => {
  const accessToken = getBearerToken(req.headers.authorization);
  if (!accessToken) {
    throw new HttpError(401, 'Authentication required. Please sign in again.');
  }

  const supabase = await getSupabaseServiceClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    throw new HttpError(401, 'Invalid or expired session. Please sign in again.');
  }

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
                  ResumeNow • Build better resumes, faster
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
        subject: 'Welcome to ResumeNow',
        html: buildEmailShell({
          eyebrow: 'ResumeNow',
          title: 'Your workspace is ready',
          intro: 'Start building polished, job-ready resumes from one focused workspace.',
          body: `
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Hi ${displayName},</p>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Welcome to <strong style="color:#111827;">ResumeNow</strong>. You can now parse an existing resume, tailor it with AI, and export recruiter-ready versions from one place.</p>
            <p style="margin:0;font-size:15px;line-height:1.8;color:#6b7280;">If you have not finished your first resume yet, now is the best time to set up your profile and create a solid base draft.</p>
          `,
          ctaLabel: 'Open ResumeNow',
          ctaHref: 'https://resumeenow.xyz/dashboard',
        }),
      };
    case 'pro_waitlist_joined':
      return {
        subject: 'You joined the ResumeNow Pro waitlist',
        html: buildEmailShell({
          eyebrow: 'ResumeNow Pro',
          title: 'You are on the waitlist',
          intro: 'We will let you know when early access and billing go live.',
          body: `
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Hi ${displayName},</p>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Your spot on the <strong style="color:#111827;">ResumeNow Pro</strong> waitlist is confirmed. We will notify you as soon as paid plans, early access, and new premium workflows are available.</p>
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
        subject: 'ResumeNow AI usage alert',
        html: buildEmailShell({
          eyebrow: 'ResumeNow AI',
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
        subject: 'Your ResumeNow weekly digest',
        html: buildEmailShell({
          eyebrow: 'ResumeNow',
          title: 'Your weekly resume check-in',
          intro: 'A short reminder to keep your job-search materials moving forward.',
          body: `
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Hi ${displayName},</p>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">This is your weekly ResumeNow digest. Take a few minutes to refresh your summary, tighten your recent bullets, or export a role-specific version before your next application.</p>
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
  const fromName = process.env.NOTIFICATION_FROM_NAME || 'ResumeNow';

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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const requestBody = parseBody(req);
    const { supabase, user } = await authenticateRequest(req);

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
  } catch (error) {
    console.error('Notification event failed', error);
    const message =
      error instanceof Error ? error.message : 'Failed to send notification.';
    const shouldExposeInternalError =
      process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview';

    res
      .status(error instanceof HttpError ? error.status : 500)
      .send(
        shouldExposeInternalError
          ? `Failed to send notification: ${message}`
          : error instanceof HttpError
            ? message
            : 'Failed to send notification.',
      );
  }
}
