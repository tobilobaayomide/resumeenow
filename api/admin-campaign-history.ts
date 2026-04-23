import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminCampaignAudience,
  AdminCampaignHistoryRecord,
} from '../src/types/admin.js';
import {
  authenticateAdminRequest,
  HttpError,
  isRecord,
  sendJson,
  toString,
  type ApiRequest,
  type ApiResponse,
} from './_lib/admin.js';

export const config = {
  maxDuration: 30,
};

interface CampaignEventRow {
  id: string;
  status: string | null;
  created_at: string | null;
  sent_at: string | null;
  last_error: string | null;
  payload: Record<string, unknown> | null;
}

const isAudience = (value: string): value is AdminCampaignAudience =>
  value === 'product_updates' || value === 'waitlist' || value === 'all_users';

const buildCampaignHistory = async (
  supabase: SupabaseClient,
): Promise<AdminCampaignHistoryRecord[]> => {
  const { data, error } = await supabase
    .from('notification_events')
    .select('id, status, created_at, sent_at, last_error, payload')
    .eq('type', 'campaign')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    throw error;
  }

  const groupedCampaigns = new Map<string, AdminCampaignHistoryRecord>();

  for (const row of (data ?? []) as CampaignEventRow[]) {
    const payload = isRecord(row.payload) ? row.payload : {};
    const campaignId = toString(payload.campaignId) || row.id;
    const audienceCandidate = toString(payload.audience);
    const audience: AdminCampaignAudience = isAudience(audienceCandidate)
      ? audienceCandidate
      : 'product_updates';
    const deliverEmail = payload.deliverEmail === true;
    const deliverInApp = payload.deliverInApp === true;
    const lastError = toString(row.last_error);
    const createdAt = toString(row.created_at) || new Date(0).toISOString();
    const sentAt = toString(row.sent_at) || null;

    if (!groupedCampaigns.has(campaignId)) {
      groupedCampaigns.set(campaignId, {
        campaignId,
        subject: toString(payload.subject) || 'Campaign',
        title: toString(payload.title) || 'Campaign update',
        body: toString(payload.body),
        audience,
        deliverEmail,
        deliverInApp,
        createdAt,
        sentAt,
        targetedRecipients: 0,
        inAppRecipients: 0,
        emailedRecipients: 0,
        skippedRecipients: 0,
        failedRecipients: 0,
      });
    }

    const aggregate = groupedCampaigns.get(campaignId);
    if (!aggregate) {
      continue;
    }

    aggregate.targetedRecipients += 1;

    if (deliverInApp) {
      aggregate.inAppRecipients += 1;
    }

    if (deliverEmail && !lastError) {
      aggregate.emailedRecipients += 1;
    }

    if (
      lastError === 'missing_email' ||
      lastError === 'email_opted_out' ||
      row.status === 'skipped'
    ) {
      aggregate.skippedRecipients += 1;
    } else if (lastError) {
      aggregate.failedRecipients += 1;
    }

    if (createdAt > aggregate.createdAt) {
      aggregate.createdAt = createdAt;
    }

    if (sentAt && (!aggregate.sentAt || sentAt > aggregate.sentAt)) {
      aggregate.sentAt = sentAt;
    }
  }

  return Array.from(groupedCampaigns.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  try {
    const { supabase } = await authenticateAdminRequest(req, res);
    const campaigns = await buildCampaignHistory(supabase);
    sendJson(res, 200, { campaigns });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'ADMIN_CAMPAIGN_HISTORY_REQUEST_FAILED',
        message: error.message,
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : 'Unexpected admin campaign history error.';
    sendJson(res, 500, {
      error: 'ADMIN_CAMPAIGN_HISTORY_REQUEST_FAILED',
      message,
    });
  }
}
