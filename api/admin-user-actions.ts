import type { User } from '@supabase/supabase-js';
import type {
  AdminUserAction,
  AdminUserActionResult,
} from '../src/types/admin.js';
import {
  authenticateAdminRequest,
  HttpError,
  isRecord,
  sendJson,
  toString,
  writeAdminActionLog,
  type ApiRequest,
  type ApiResponse,
} from './_lib/admin.js';
import { buildAdminUserRecord } from './_lib/admin-users.js';

export const config = {
  maxDuration: 30,
};

const ALLOWED_ACTIONS: readonly AdminUserAction[] = [
  'promote_admin',
  'demote_admin',
  'grant_pro',
  'revoke_pro',
  'suspend_user',
  'unsuspend_user',
  'delete_user',
  'reset_ai_usage',
  'resend_welcome_email',
] as const;

type NotificationEventStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'skipped';

interface NotificationEmailContent {
  subject: string;
  html: string;
}

const parseRequestBody = (
  req: ApiRequest,
): { userId: string; action: AdminUserAction } => {
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
    throw new HttpError(400, 'Invalid admin user action payload.');
  }

  const userId = toString(rawBody.userId);
  const action = toString(rawBody.action) as AdminUserAction;

  if (!userId) {
    throw new HttpError(400, 'User id is required.');
  }

  if (!ALLOWED_ACTIONS.includes(action)) {
    throw new HttpError(400, 'Unsupported admin user action.');
  }

  return { userId, action };
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildEmailShell = ({
  eyebrow,
  title,
  intro,
  body,
  ctaLabel,
  ctaHref,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
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

const resolveDisplayName = (user: User): string => {
  const metadata = user.user_metadata;
  if (isRecord(metadata) && typeof metadata.full_name === 'string' && metadata.full_name.trim()) {
    return metadata.full_name.trim();
  }

  return (user.email ?? '').split('@')[0] || 'there';
};

const buildWelcomeResendEmail = (user: User): NotificationEmailContent => {
  const displayName = escapeHtml(resolveDisplayName(user));

  return {
    subject: 'Welcome to ResumeeNow',
    html: buildEmailShell({
      eyebrow: 'ResumeeNow',
      title: 'Your workspace is ready',
      intro: 'Start building polished, job-ready resumes from one focused workspace.',
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Hi ${displayName},</p>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#374151;">Welcome to <strong style="color:#111827;">ResumeeNow</strong>. You can parse an existing resume, tailor it with AI, and export recruiter-ready versions from one place.</p>
        <p style="margin:0;font-size:15px;line-height:1.8;color:#6b7280;">If you have not finished your first resume yet, now is the best time to set up your profile and build a solid base draft.</p>
      `,
      ctaLabel: 'Open ResumeeNow',
      ctaHref: 'https://resumeenow.xyz/dashboard',
    }),
  };
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

const upsertProfileRole = async (
  supabase: Awaited<ReturnType<typeof authenticateAdminRequest>>['supabase'],
  userId: string,
  role: 'user' | 'admin',
) => {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        role,
      },
      {
        onConflict: 'id',
      },
    );

  if (error) {
    throw error;
  }
};

const updateAccountStatus = async (
  supabase: Awaited<ReturnType<typeof authenticateAdminRequest>>['supabase'],
  userId: string,
  accountStatus: 'active' | 'suspended',
) => {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        account_status: accountStatus,
      },
      {
        onConflict: 'id',
      },
    );

  if (error) {
    throw error;
  }
};

const updatePlanTier = async (
  supabase: Awaited<ReturnType<typeof authenticateAdminRequest>>['supabase'],
  userId: string,
  planTier: 'free' | 'pro',
) => {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .update({ plan_tier: planTier })
    .eq('user_id', userId)
    .select('user_id');

  if (error) {
    throw error;
  }

  if ((data?.length ?? 0) > 0 || planTier === 'free') {
    return;
  }

  const { error: insertError } = await supabase.from('user_subscriptions').insert({
    user_id: userId,
    plan_tier: planTier,
  });

  if (insertError) {
    throw insertError;
  }
};

const clearWaitlistState = async (
  supabase: Awaited<ReturnType<typeof authenticateAdminRequest>>['supabase'],
  userId: string,
) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      pro_waitlist_joined_at: null,
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
};

const setAuthBanState = async (
  supabase: Awaited<ReturnType<typeof authenticateAdminRequest>>['supabase'],
  userId: string,
  suspended: boolean,
) => {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: suspended ? '876000h' : 'none',
  });

  if (error) {
    throw error;
  }
};

const resetAiUsage = async (
  supabase: Awaited<ReturnType<typeof authenticateAdminRequest>>['supabase'],
  userId: string,
) => {
  const now = new Date().toISOString();

  const [{ error: usageError }, { error: requestLimitError }] = await Promise.all([
    supabase.from('user_api_usage').upsert(
      {
        user_id: userId,
        ai_credits_used: 0,
        last_reset_at: now,
      },
      {
        onConflict: 'user_id',
      },
    ),
    supabase.from('user_ai_request_limits').upsert(
      {
        user_id: userId,
        window_started_at: now,
        request_count: 0,
        active_requests: 0,
        updated_at: now,
      },
      {
        onConflict: 'user_id',
      },
    ),
  ]);

  if (usageError) {
    throw usageError;
  }

  if (requestLimitError) {
    throw requestLimitError;
  }
};

const createNotificationEvent = async (
  supabase: Awaited<ReturnType<typeof authenticateAdminRequest>>['supabase'],
  userId: string,
  payload: Record<string, unknown>,
): Promise<{ id: string; attempts: number }> => {
  const { data, error } = await supabase
    .from('notification_events')
    .insert({
      user_id: userId,
      type: 'campaign',
      payload,
      status: 'processing' satisfies NotificationEventStatus,
      last_error: null,
    })
    .select('id, attempts')
    .single();

  if (error) {
    throw error;
  }

  if (!isRecord(data) || !toString(data.id)) {
    throw new Error('Failed to create notification event.');
  }

  return {
    id: toString(data.id),
    attempts: typeof data.attempts === 'number' ? data.attempts : 0,
  };
};

const updateNotificationEvent = async (
  supabase: Awaited<ReturnType<typeof authenticateAdminRequest>>['supabase'],
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

const resendWelcomeEmail = async (
  supabase: Awaited<ReturnType<typeof authenticateAdminRequest>>['supabase'],
  targetUser: User,
) => {
  if (!targetUser.email) {
    throw new HttpError(400, 'This account does not have a valid email address.');
  }

  const content = buildWelcomeResendEmail(targetUser);
  const payload = {
    kind: 'welcome_email_resend',
    title: 'Welcome email resent',
    body: 'An admin resent the ResumeeNow welcome email for this account.',
    subject: content.subject,
    deliverEmail: true,
    deliverInApp: false,
  };
  const eventRecord = await createNotificationEvent(supabase, targetUser.id, payload);

  try {
    await sendEmailWithResend({
      to: targetUser.email,
      content,
    });

    await updateNotificationEvent(supabase, eventRecord.id, {
      status: 'sent' satisfies NotificationEventStatus,
      sent_at: new Date().toISOString(),
      last_error: null,
      attempts: eventRecord.attempts + 1,
    });
  } catch (error) {
    await updateNotificationEvent(supabase, eventRecord.id, {
      status: 'failed' satisfies NotificationEventStatus,
      last_error: error instanceof Error ? error.message : 'Unknown delivery error.',
      attempts: eventRecord.attempts + 1,
    });
    throw error;
  }
};

const deleteUserDependencies = async (
  supabase: Awaited<ReturnType<typeof authenticateAdminRequest>>['supabase'],
  userId: string,
) => {
  const deleteByUserId = async (table: string) => {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error) {
      throw error;
    }
  };

  await Promise.all([
    deleteByUserId('notification_events'),
    deleteByUserId('notification_preferences'),
    deleteByUserId('user_ai_request_limits'),
    deleteByUserId('user_api_usage'),
    deleteByUserId('user_subscriptions'),
    deleteByUserId('resumes'),
  ]);

  const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
  if (profileError) {
    throw profileError;
  }
};

const handleAction = async (
  supabase: Awaited<ReturnType<typeof authenticateAdminRequest>>['supabase'],
  actorRole: Awaited<ReturnType<typeof authenticateAdminRequest>>['role'],
  actorId: string,
  targetUser: User,
  action: AdminUserAction,
): Promise<AdminUserActionResult> => {
  const targetRecord = await buildAdminUserRecord(supabase, targetUser);

  const isRoleAction = action === 'promote_admin' || action === 'demote_admin';
  const isDeleteAction = action === 'delete_user';
  const isActorSuperAdmin = actorRole === 'super_admin';

  if (isRoleAction && !isActorSuperAdmin) {
    throw new HttpError(403, 'Only the super admin can change admin roles.');
  }

  if (isDeleteAction && !isActorSuperAdmin) {
    throw new HttpError(403, 'Only the super admin can delete accounts.');
  }

  if (action === 'delete_user') {
    if (actorId === targetUser.id) {
      throw new HttpError(400, 'You cannot delete your own super admin account.');
    }

    if (targetRecord.role === 'super_admin') {
      throw new HttpError(400, 'Super admin accounts cannot be deleted from the admin console.');
    }

    const { error } = await supabase.auth.admin.deleteUser(targetUser.id);
    if (error) {
      throw error;
    }

    let cleanupWarning: string | null = null;
    try {
      await deleteUserDependencies(supabase, targetUser.id);
    } catch (cleanupError) {
      cleanupWarning =
        cleanupError instanceof Error
          ? cleanupError.message
          : 'Related records could not be fully cleaned up.';
    }

    return {
      user: null,
      deletedUserId: targetUser.id,
      message: cleanupWarning
        ? 'User access removed. Some related records still need manual cleanup.'
        : 'User deleted permanently.',
    };
  }

  if (action === 'reset_ai_usage') {
    if (targetRecord.role !== 'user') {
      return {
        user: targetRecord,
        deletedUserId: null,
        message: 'Admin accounts already have unlimited AI access.',
      };
    }

    await resetAiUsage(supabase, targetUser.id);

    return {
      user: await buildAdminUserRecord(supabase, targetUser),
      deletedUserId: null,
      message: 'AI usage was reset for this account.',
    };
  }

  if (action === 'resend_welcome_email') {
    await resendWelcomeEmail(supabase, targetUser);

    return {
      user: await buildAdminUserRecord(supabase, targetUser),
      deletedUserId: null,
      message: 'Welcome email resent.',
    };
  }

  if (action === 'promote_admin') {
    if (targetRecord.role !== 'user') {
      return {
        user: targetRecord,
        deletedUserId: null,
        message: 'This account already has admin access.',
      };
    }

    await upsertProfileRole(supabase, targetUser.id, 'admin');

    return {
      user: await buildAdminUserRecord(supabase, targetUser),
      deletedUserId: null,
      message: 'Admin access granted.',
    };
  }

  if (action === 'demote_admin') {
    if (actorId === targetUser.id) {
      throw new HttpError(400, 'You cannot remove your own super admin access.');
    }

    if (targetRecord.role === 'super_admin') {
      throw new HttpError(400, 'Super admin access can only be changed manually in the database.');
    }

    if (targetRecord.role !== 'admin') {
      return {
        user: targetRecord,
        deletedUserId: null,
        message: 'Admin access was already removed.',
      };
    }

    await upsertProfileRole(supabase, targetUser.id, 'user');

    return {
      user: await buildAdminUserRecord(supabase, targetUser),
      deletedUserId: null,
      message: 'Admin access removed.',
    };
  }

  if (action === 'suspend_user' || action === 'unsuspend_user') {
    const nextStatus = action === 'suspend_user' ? 'suspended' : 'active';

    if (actorId === targetUser.id) {
      throw new HttpError(
        400,
        nextStatus === 'suspended'
          ? 'You cannot suspend your own account.'
          : 'You cannot change your own suspension status here.',
      );
    }

    if (targetRecord.role === 'super_admin') {
      throw new HttpError(400, 'Super admin accounts cannot be suspended from the admin console.');
    }

    if (targetRecord.role === 'admin' && !isActorSuperAdmin) {
      throw new HttpError(403, 'Only the super admin can suspend or restore admin accounts.');
    }

    if (targetRecord.accountStatus === nextStatus) {
      return {
        user: targetRecord,
        deletedUserId: null,
        message:
          nextStatus === 'suspended'
            ? 'This account is already suspended.'
            : 'This account is already active.',
      };
    }

    await updateAccountStatus(supabase, targetUser.id, nextStatus);
    await setAuthBanState(supabase, targetUser.id, nextStatus === 'suspended');

    return {
      user: await buildAdminUserRecord(supabase, targetUser),
      deletedUserId: null,
      message:
        nextStatus === 'suspended'
          ? 'User suspended and signed out.'
          : 'User restored and allowed back in.',
    };
  }

  if (targetRecord.role !== 'user') {
    throw new HttpError(
      400,
      'Admin accounts already inherit unlimited Pro access. Change the role first.',
    );
  }

  if (action === 'grant_pro') {
    if (targetRecord.planTier === 'pro') {
      return {
        user: targetRecord,
        deletedUserId: null,
        message: 'Pro access is already active for this account.',
      };
    }

    await updatePlanTier(supabase, targetUser.id, 'pro');
    await clearWaitlistState(supabase, targetUser.id);

    return {
      user: await buildAdminUserRecord(supabase, targetUser),
      deletedUserId: null,
      message: 'Pro access granted.',
    };
  }

  if (targetRecord.planTier !== 'pro') {
    return {
      user: targetRecord,
      deletedUserId: null,
      message: 'This account is already on the free plan.',
    };
  }

  await updatePlanTier(supabase, targetUser.id, 'free');

  return {
    user: await buildAdminUserRecord(supabase, targetUser),
    deletedUserId: null,
    message: 'Pro access removed.',
  };
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

  let auditSupabase: Awaited<ReturnType<typeof authenticateAdminRequest>>['supabase'] | null = null;
  let auditActorId: string | null = null;
  let auditActorRole: Awaited<ReturnType<typeof authenticateAdminRequest>>['role'] | null = null;
  let auditAction: AdminUserAction | null = null;
  let auditTargetUser: User | null = null;

  try {
    const {
      supabase,
      user: actor,
      role: actorRole,
    } = await authenticateAdminRequest(req, res);
    auditSupabase = supabase;
    auditActorId = actor.id;
    auditActorRole = actorRole;
    const { userId, action } = parseRequestBody(req);
    auditAction = action;
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data.user) {
      throw new HttpError(404, 'User not found.');
    }

    auditTargetUser = data.user;
    const result = await handleAction(supabase, actorRole, actor.id, data.user, action);

    await writeAdminActionLog(supabase, {
      actorId: actor.id,
      actorRole,
      action,
      status: 'success',
      targetUserId: data.user.id,
      details: {
        targetEmail: data.user.email ?? null,
        message: result.message,
        deletedUserId: result.deletedUserId,
        role: result.user?.role ?? null,
        accountStatus: result.user?.accountStatus ?? null,
        planTier: result.user?.planTier ?? null,
      },
    });

    sendJson(res, 200, result);
  } catch (error) {
    if (auditSupabase && auditActorId && auditActorRole && auditAction) {
      try {
        await writeAdminActionLog(auditSupabase, {
          actorId: auditActorId,
          actorRole: auditActorRole,
          action: auditAction,
          status: 'failed',
          targetUserId: auditTargetUser?.id ?? null,
          details: {
            targetEmail: auditTargetUser?.email ?? null,
            error: error instanceof Error ? error.message : 'Unexpected admin action error.',
          },
        });
      } catch {
        // Keep the original admin action error as the response payload.
      }
    }

    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'ADMIN_USER_ACTION_FAILED',
        message: error.message,
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unexpected admin action error.';
    sendJson(res, 500, {
      error: 'ADMIN_USER_ACTION_FAILED',
      message,
    });
  }
}
