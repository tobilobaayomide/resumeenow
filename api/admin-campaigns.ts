import type { SupabaseClient, User } from '@supabase/supabase-js';
import type {
  AdminCampaignAudience,
  AdminCampaignInput,
  AdminCampaignResult,
} from '../src/types/admin.js';
import {
  authenticateAdminRequest,
  HttpError,
  isRecord,
  listAllAuthUsers,
  sendJson,
  toString,
  writeAdminActionLog,
  type ApiRequest,
  type ApiResponse,
} from './_lib/admin.js';

export const config = {
  maxDuration: 30,
};

type NotificationEventStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'skipped';

interface ProfileRecord {
  id: string;
  full_name: string | null;
  role: 'user' | 'admin' | 'super_admin' | null;
  account_status: 'active' | 'suspended' | null;
  pro_waitlist_joined_at: string | null;
}

interface NotificationPreferencesRecord {
  user_id: string;
  product_updates: boolean | null;
}

interface CampaignRecipient {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin' | 'super_admin';
  accountStatus: 'active' | 'suspended';
  waitlistJoinedAt: string | null;
  productUpdates: boolean;
}

interface NotificationEventRecord {
  id: string;
}

const ALLOWED_AUDIENCES: readonly AdminCampaignAudience[] = [
  'product_updates',
  'waitlist',
  'all_users',
] as const;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const normalizeMultilineBody = (value: string): string =>
  value
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(
      (segment) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">${escapeHtml(
          segment,
        ).replace(/\n/g, '<br/>')}</p>`,
    )
    .join('');

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

const parseRequestBody = (req: ApiRequest): AdminCampaignInput => {
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
    throw new HttpError(400, 'Invalid admin campaign payload.');
  }

  const subject = toString(rawBody.subject);
  const title = toString(rawBody.title);
  const body = toString(rawBody.body);
  const audience = toString(rawBody.audience) as AdminCampaignAudience;
  const sendEmail = rawBody.sendEmail === true;
  const sendInApp = rawBody.sendInApp === true;
  const ctaLabel = toString(rawBody.ctaLabel);
  const ctaHref = toString(rawBody.ctaHref);

  if (!subject || !title || !body) {
    throw new HttpError(400, 'Subject, title, and message are required.');
  }

  if (!ALLOWED_AUDIENCES.includes(audience)) {
    throw new HttpError(400, 'Unsupported campaign audience.');
  }

  if (!sendEmail && !sendInApp) {
    throw new HttpError(400, 'Choose at least one delivery channel.');
  }

  if ((ctaLabel && !ctaHref) || (!ctaLabel && ctaHref)) {
    throw new HttpError(400, 'CTA label and CTA link must be provided together.');
  }

  if (ctaHref && !isValidHttpUrl(ctaHref)) {
    throw new HttpError(400, 'CTA link must be a valid URL.');
  }

  return {
    subject,
    title,
    body,
    audience,
    sendEmail,
    sendInApp,
    ...(ctaLabel ? { ctaLabel } : {}),
    ...(ctaHref ? { ctaHref } : {}),
  };
};

const buildCampaignEmail = (
  recipient: CampaignRecipient,
  input: AdminCampaignInput,
): { subject: string; html: string } => {
  const displayName =
    recipient.fullName.trim() || recipient.email.split('@')[0] || 'there';

  return {
    subject: input.subject,
    html: buildEmailShell({
      eyebrow: 'ResumeeNow',
      title: input.title,
      intro: 'A new update from the ResumeeNow team.',
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Hi ${escapeHtml(
          displayName,
        )},</p>
        ${normalizeMultilineBody(input.body)}
      `,
      ctaLabel: input.ctaLabel,
      ctaHref: input.ctaHref,
      note:
        input.audience === 'product_updates'
          ? 'You are receiving this because you opted into product update emails.'
          : undefined,
    }),
  };
};

const sendEmailWithResend = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
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
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to send email with Resend.');
  }
};

const createNotificationEvent = async (
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>,
  status: NotificationEventStatus,
  sentAt: string | null,
  lastError: string | null = null,
): Promise<NotificationEventRecord> => {
  const { data, error } = await supabase
    .from('notification_events')
    .insert({
      user_id: userId,
      type: 'campaign',
      payload,
      status,
      sent_at: sentAt,
      last_error: lastError,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  if (!isRecord(data) || !toString(data.id)) {
    throw new Error('Failed to create campaign notification event.');
  }

  return {
    id: toString(data.id),
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

const buildRecipients = async (supabase: SupabaseClient): Promise<CampaignRecipient[]> => {
  const authUsers = await listAllAuthUsers(supabase);
  const userIds = authUsers.map((user) => user.id);

  if (userIds.length === 0) {
    return [];
  }

  const [profilesResult, preferencesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, account_status, pro_waitlist_joined_at')
      .in('id', userIds),
    supabase
      .from('notification_preferences')
      .select('user_id, product_updates')
      .in('user_id', userIds),
  ]);

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  if (preferencesResult.error) {
    throw preferencesResult.error;
  }

  const profileMap = new Map(
    (profilesResult.data ?? []).map((record) => [record.id, record as ProfileRecord]),
  );
  const preferencesMap = new Map(
    (preferencesResult.data ?? []).map((record) => [
      record.user_id,
      record as NotificationPreferencesRecord,
    ]),
  );

  return authUsers
    .map((user: User) => {
      const profile = profileMap.get(user.id);
      const preferences = preferencesMap.get(user.id);
      const metadataName =
        isRecord(user.user_metadata) && typeof user.user_metadata.full_name === 'string'
          ? user.user_metadata.full_name.trim()
          : '';

      return {
        id: user.id,
        email: user.email ?? '',
        fullName: profile?.full_name?.trim() || metadataName,
        role:
          profile?.role === 'super_admin'
            ? 'super_admin'
            : profile?.role === 'admin'
              ? 'admin'
              : 'user',
        accountStatus: profile?.account_status === 'suspended' ? 'suspended' : 'active',
        waitlistJoinedAt: profile?.pro_waitlist_joined_at ?? null,
        productUpdates: preferences?.product_updates ?? true,
      } satisfies CampaignRecipient;
    })
    .filter((recipient) => recipient.accountStatus === 'active');
};

const filterRecipientsByAudience = (
  recipients: CampaignRecipient[],
  audience: AdminCampaignAudience,
) => {
  switch (audience) {
    case 'product_updates':
      return recipients.filter((recipient) => recipient.productUpdates);
    case 'waitlist':
      return recipients.filter((recipient) => recipient.waitlistJoinedAt !== null);
    case 'all_users':
      return recipients;
    default:
      return recipients;
  }
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  let auditSupabase: SupabaseClient | null = null;
  let auditActorId: string | null = null;
  let auditActorRole: 'admin' | 'super_admin' | null = null;
  let parsedInput: AdminCampaignInput | null = null;

  try {
    const input = parseRequestBody(req);
    parsedInput = input;

    const {
      supabase,
      user: actor,
      role: actorRole,
    } = await authenticateAdminRequest(req);
    auditSupabase = supabase;
    auditActorId = actor.id;
    auditActorRole = actorRole;

    if (input.sendEmail && actorRole !== 'super_admin') {
      throw new HttpError(403, 'Only the super admin can send email campaigns.');
    }

    if (input.audience === 'all_users' && actorRole !== 'super_admin') {
      throw new HttpError(403, 'Only the super admin can target all users.');
    }

    const recipients = filterRecipientsByAudience(
      await buildRecipients(supabase),
      input.audience,
    );
    const campaignId = crypto.randomUUID();

    const result: AdminCampaignResult = {
      audience: input.audience,
      deliverEmail: input.sendEmail,
      deliverInApp: input.sendInApp,
      targetedRecipients: recipients.length,
      inAppRecipients: 0,
      emailedRecipients: 0,
      skippedRecipients: 0,
      failedRecipients: 0,
    };

    for (const recipient of recipients) {
      const sentAt = input.sendInApp ? new Date().toISOString() : null;
      const eventPayload = {
        campaignId,
        subject: input.subject,
        title: input.title,
        body: input.body,
        audience: input.audience,
        deliverInApp: input.sendInApp,
        deliverEmail: input.sendEmail,
        ...(input.ctaLabel ? { ctaLabel: input.ctaLabel } : {}),
        ...(input.ctaHref ? { ctaHref: input.ctaHref } : {}),
      } satisfies Record<string, unknown>;

      const event = await createNotificationEvent(
        supabase,
        recipient.id,
        eventPayload,
        input.sendInApp ? 'sent' : 'processing',
        sentAt,
      );

      if (input.sendInApp) {
        result.inAppRecipients += 1;
      }

      if (!input.sendEmail) {
        if (!input.sendInApp) {
          result.skippedRecipients += 1;
        }
        continue;
      }

      if (!recipient.productUpdates) {
        result.skippedRecipients += 1;

        await updateNotificationEvent(supabase, event.id, {
          ...(input.sendInApp ? {} : { status: 'skipped' }),
          last_error: 'email_opted_out',
        });
        continue;
      }

      if (!recipient.email) {
        result.skippedRecipients += 1;

        if (!input.sendInApp) {
          await updateNotificationEvent(supabase, event.id, {
            status: 'skipped',
            last_error: 'missing_email',
          });
        } else {
          await updateNotificationEvent(supabase, event.id, {
            last_error: 'missing_email',
          });
        }
        continue;
      }

      const email = buildCampaignEmail(recipient, input);

      try {
        await sendEmailWithResend({
          to: recipient.email,
          subject: email.subject,
          html: email.html,
        });
        result.emailedRecipients += 1;

        await updateNotificationEvent(supabase, event.id, {
          status: 'sent',
          sent_at: sentAt ?? new Date().toISOString(),
          last_error: null,
        });
      } catch (error) {
        result.failedRecipients += 1;
        const message =
          error instanceof Error ? error.message : 'Failed to send campaign email.';

        await updateNotificationEvent(supabase, event.id, {
          ...(input.sendInApp ? { status: 'sent', sent_at: sentAt } : { status: 'failed' }),
          last_error: message,
        });
      }
    }

    await writeAdminActionLog(supabase, {
      actorId: actor.id,
      actorRole,
      action: 'send_campaign',
      status: 'success',
      details: {
        audience: input.audience,
        deliverEmail: input.sendEmail,
        deliverInApp: input.sendInApp,
        subject: input.subject,
        targetedRecipients: result.targetedRecipients,
        inAppRecipients: result.inAppRecipients,
        emailedRecipients: result.emailedRecipients,
        skippedRecipients: result.skippedRecipients,
        failedRecipients: result.failedRecipients,
      },
    });

    sendJson(res, 200, result);
  } catch (error) {
    if (auditSupabase && auditActorId && auditActorRole && parsedInput) {
      try {
        await writeAdminActionLog(auditSupabase, {
          actorId: auditActorId,
          actorRole: auditActorRole,
          action: 'send_campaign',
          status: 'failed',
          details: {
            audience: parsedInput.audience,
            deliverEmail: parsedInput.sendEmail,
            deliverInApp: parsedInput.sendInApp,
            subject: parsedInput.subject,
            error: error instanceof Error ? error.message : 'Unexpected admin campaign error.',
          },
        });
      } catch {
        // Keep the original campaign error as the response payload.
      }
    }

    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'ADMIN_CAMPAIGN_REQUEST_FAILED',
        message: error.message,
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : 'Unexpected admin campaign error.';
    sendJson(res, 500, {
      error: 'ADMIN_CAMPAIGN_REQUEST_FAILED',
      message,
    });
  }
}
