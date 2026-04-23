import {
  HttpError,
  isRecord,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './_lib/admin.js';
import { authenticateUserRequest } from './_lib/user.js';

export const config = {
  maxDuration: 30,
};

const parseRequestBody = (req: ApiRequest): Record<string, unknown> => {
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
    throw new HttpError(400, 'Invalid notification feed payload.');
  }

  return rawBody;
};

const parseEventIds = (req: ApiRequest): string[] => {
  const body = parseRequestBody(req);
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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    res.setHeader('Allow', 'GET, PATCH');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  try {
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
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'NOTIFICATION_FEED_REQUEST_FAILED',
        message: error.message,
      });
      return;
    }

    sendJson(res, 500, {
      error: 'NOTIFICATION_FEED_REQUEST_FAILED',
      message:
        error instanceof Error ? error.message : 'Unexpected notification feed API error.',
    });
  }
}
